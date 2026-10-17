"use strict";
const C = require('./contracts');
let serial=0;
const signatureCache=new WeakMap();
function uid(prefix='msg') {
  const random=globalThis.crypto?.randomUUID?.();
  return prefix+'_'+(random || Date.now().toString(36)+'_'+(++serial).toString(36)+'_'+Math.random().toString(36).slice(2)+'_'+Math.random().toString(36).slice(2));
}
const normalized=x=>String(x??'').replace(/\r\n/g,'\n').trim();
function signature(text) {
  const s=normalized(text);
  return s.length+':'+C.hash(s)+':'+C.hash([...s].reverse().join(''));
}
const action=text=>/XSD2_|^\/?(?:解锁|锁定|身份|段位)\s/.test(String(text));
// Persist on native message.extra and swipe_info[].extra, which travel with
// exported messages. Never use the message's current array position as its ID.
function bindOpening(chat,config,source=null) {
 const m=chat[0];if(!m || m.is_user)throw Error('开局消息不存在');
 const slot=Number(m.swipe_id??0),record={id:uid('opening'),config:C.clone(config),source:C.clone(source)};
 m.extra={...(m.extra || {}),xsd2_openings:{...(m.extra?.xsd2_openings || {}),[slot]:record}};
 const info=m.swipe_info?.[slot];if(info)info.extra={...(info.extra || {}),xsd2_opening:C.clone(record)};
 return C.clone(record);
}
function openingRecord(m) {
 if(!m || m.is_user || /<IdentityMenu\b/.test(String(m.mes)))return null;
 const slot=Number(m.swipe_id??0);
 return m.swipe_info?.[slot]?.extra?.xsd2_opening || m.extra?.xsd2_openings?.[slot] || null;
}
function identify(chat) {
  const seen=new Set();
  return chat.map((m,index)=>{
    const slot=Number(m.swipe_id??0), info=m.swipe_info?.[slot];
    m.extra ||= {};
    let record=m.extra.xsd2_identity || info?.extra?.xsd2_identity;
    if(!record?.messageId && Array.isArray(m.swipe_info))record=m.swipe_info.map(x=>x?.extra?.xsd2_identity).find(x=>x?.messageId);
    if(!record?.messageId || seen.has(record.messageId))record={messageId:uid(),versions:{}};
    // A cloned native message may share extra with its original in memory.
    record=C.clone(record);record.versions ||= {};
    // Opening configuration is the root of the save. Its display prose may be
    // reformatted by the host without creating a new game. Live-write guards
    // still compare the exact chat body through contracts.fingerprint().
    const opening=index===0?openingRecord(m):null;
    const input=opening ? JSON.stringify(opening.config) : String(m.mes ?? '');
    let cached=signatureCache.get(m);if(!cached || cached.input!==input){cached={input,signature:signature(input)};signatureCache.set(m,cached);}
    const sig=opening ? 'opening:'+opening.id+':'+cached.signature : cached.signature, key=slot+':'+sig;
    const native=info?.extra?.xsd2_identity;
    const duplicate=native?.revisionId && m.swipe_info?.some((x,i)=>i<slot && x?.extra?.xsd2_identity?.revisionId===native.revisionId);
    const revisionId=duplicate ? uid('reply') : native?.messageId===record.messageId && native.signature===sig ? native.revisionId : record.versions[key] || uid('reply');
    record.versions[key]=revisionId;
    const keys=Object.keys(record.versions);for(const oldKey of keys.slice(0,Math.max(0,keys.length-32)))delete record.versions[oldKey];
    record.revisionId=revisionId;record.signature=sig;
    m.extra={...m.extra,xsd2_identity:record};
    if(info)info.extra={...(info.extra || {}),xsd2_identity:C.clone(record)};
    seen.add(record.messageId);
    return {messageId:record.messageId,revisionId,user:!!m.is_user,signature:sig,action:!!m.is_user&&action(m.mes),...(opening?.source?{openingSource:C.clone(opening.source)}:{})};
  });
}
function trail(c,floor=c.floor){return C.clone(c.identities.slice(0,floor+1));}
function same(a,b){
 const exact=(x,y)=>x?.messageId===y?.messageId && x?.revisionId===y?.revisionId && x?.user===y?.user && x?.signature===y?.signature;
 return exact(a,b) || (!!b?.openingSource && exact(a,b.openingSource));
}
// A removed ordinary input may shift positions. Every assistant outcome and
// every command must remain. Insertions/edits/reordered replies fork history.
function mapping(old,now) {
  if(!Array.isArray(old)||!old.length||!Array.isArray(now))return null;
  const map=new Map();let j=0;
  const ids=new Set();
  for(let i=0;i<old.length;i++){
    if(!old[i]?.messageId || ids.has(old[i].messageId))return null;
    ids.add(old[i].messageId);
    if(same(old[i],now[j])){map.set(i,j++);continue;}
    if(i===0 || !old[i].user || old[i].action)return null;
    // A kept input with a different revision is an edit, not a deletion.
    if(now.some(x=>x.messageId===old[i].messageId))return null;
  }
  if(!map.has(old.length-1))return null;
  return map;
}
function remapState(source,map,c) {
  const state=C.clone(source);let unsafe=false;
  function visit(v){
    if(!v||typeof v!=='object')return;
    for(const[k,x]of Object.entries(v)){
      if(k==='floor'&&Number.isInteger(x)){
        const reference=v.messageRef;
        const position=reference ? c.identities.findIndex(id=>id.messageId===reference.messageId && (id.revisionId===reference.revisionId || id.openingSource?.revisionId===reference.revisionId)) : map.get(x);
        if(Number.isInteger(position) && [...map.values()].includes(position))v[k]=position;else unsafe=true;
      }else if(k==='processed'&&x&&typeof x==='object'){
        const next={};for(const[f,h]of Object.entries(x)){if(map.has(+f))next[map.get(+f)]=h;else unsafe=true;}v[k]=next;
      }else if(k==='authorization'&&x?.identityTrail){
        const own=mapping(x.identityTrail,c.identities);
        if(!own){unsafe=true;continue;}
        const last=own.get(x.identityTrail.length-1);
        v[k]={chatId:c.chatId,branchId:c.branchId,trail:c.trail.slice(0,last+1),identityTrail:trail(c,last)};
      }else if(k!=='history_reassociation'&&k!=='history_identity')visit(x);
    }
  }
  visit(state);
  return unsafe?null:state;
}
function restore(e,c) {
  const map=mapping(e?.identityTrail,c.identities);
  if(!map||!e.state)return null;
  const state=remapState(e.state,map,c);
  if(!state)return null;
  const floor=map.get(e.identityTrail.length-1);
  state.history_identity={version:1,messageId:c.identities[floor].messageId,revisionId:c.identities[floor].revisionId};
  return {state,floor};
}
function authorized(auth,c){return auth?.identityTrail ? !!mapping(auth.identityTrail,c.identities) : auth?.chatId===c.chatId && auth.branchId===c.branchId && C.matchesSnapshot(auth.trail,c.trail);}
function authorization(c){return {chatId:c.chatId,branchId:c.branchId,trail:C.clone(c.trail),identityTrail:trail(c)};}
function upgradeAuthorizations(s,c){
  function visit(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){
    if(k==='authorization' && x?.trail && !x.identityTrail && C.matchesSnapshot(x.trail,c.trail))
      v[k]={chatId:c.chatId,branchId:c.branchId,trail:C.clone(x.trail),identityTrail:trail(c,x.trail.length-1)};
    else visit(x);
  }}
  visit(s);
}
function bindReferences(s,c){
  function visit(v){if(!v||typeof v!=='object')return;
    if(Number.isInteger(v.floor) && !v.messageRef){const id=c.identities[v.floor];if(id)v.messageRef={messageId:id.messageId,revisionId:id.revisionId};}
    for(const[k,x]of Object.entries(v))if(!['messageRef','history_identity','history_reassociation'].includes(k))visit(x);
  }
  visit(s);
}
function stampProcessed(s,c){
  const last=c.identities[c.floor];
  s.history_identity={version:1,messageId:last.messageId,revisionId:last.revisionId};
  s.processedByRevision={};
  for(const[f,hash]of Object.entries(s.processed||{})){
    const id=c.identities[+f],text=c.chat[+f]?.mes;
    if(id && (C.hash(text)===hash || C.hash(normalized(text))===hash))s.processedByRevision[id.revisionId]={messageId:id.messageId,hash};
  }
}
function explain(e,c){
 if(!e?.identityTrail)return {reason:'旧存档无稳定消息编号'};
 for(let i=0;i<e.identityTrail.length;i++){
  const expected=e.identityTrail[i],position=c.identities.findIndex(x=>x.messageId===expected.messageId),actual=c.identities[position];
  if(position<0 || !same(expected,actual))return {sourceFloor:i,currentFloor:position,reason:position<0?'消息编号缺失':expected.revisionId!==actual.revisionId?'候选或正文版本不同':'消息内容签名不同',expected:C.clone(expected),actual:C.clone(actual || null)};
 }
 return {reason:'消息顺序或内部状态引用不匹配'};
}
module.exports={uid,bindOpening,openingRecord,same,identify,trail,mapping,restore,remapState,authorized,authorization,stampProcessed,upgradeAuthorizations,bindReferences,explain};
