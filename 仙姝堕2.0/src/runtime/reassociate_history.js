"use strict";
const C=require('./contracts');
const normalized=x=>String(x||'').replace(/\r\n/g,'\n').trim();
// Reattach a plain-story snapshot only when every settled assistant reply is
// still present, in order, with its exact processed hash and original swipe.
// Kept user inputs must match exactly; deleted action commands are forbidden.
function reassociate(e,c){
 const s=e?.state;
 if(e?.schema!==2||!Array.isArray(e.trail)||!s||s.pending||s.activeEvent||s.lastPromotionRecovery||Object.keys(s.receipts||{}).length||Object.keys(s.settlements||{}).length)return null;
 let old;try{old=e.trail.map(JSON.parse);}catch{return null;}
 if(!old.length||!C.matchesSnapshot([e.trail[0]],[c.trail[0]]))return null;
 const ids=Object.keys(s.processed||{}).map(Number).sort((a,b)=>a-b);
 if(!ids.length||ids.at(-1)!==old.length-1||ids.some(i=>!old[i]||old[i][0]))return null;
 const assistants=c.chat.map((m,i)=>i>0&&!m.is_user?i:-1).filter(i=>i>=0);
 if(assistants.length<ids.length)return null;
 const map=new Map([[0,0]]);let oldPrev=0,newPrev=0;
 for(let n=0;n<ids.length;n++){
  const oi=ids[n],ni=assistants[n],m=c.chat[ni];
  if(Number(m.swipe_id??0)!==Number(old[oi][2])||C.hash(String(m.mes||''))!==s.processed[oi])return null;
  // No omitted assistant/system outcomes between two anchors.
  if(old.slice(oldPrev+1,oi).some(x=>!x[0]))return null;
  let cursor=oldPrev+1;
  for(let j=newPrev+1;j<ni;j++){
   const kept=c.chat[j];if(!kept.is_user)return null;
   while(cursor<oi && !(Number(old[cursor][2])===Number(kept.swipe_id??0)&&normalized(old[cursor][3])===normalized(kept.mes))){
    if(/XSD2_|^\/?(?:解锁|锁定|身份|段位)\s/.test(old[cursor][3]))return null;cursor++;
   }
   if(cursor>=oi)return null;map.set(cursor,j);cursor++;
  }
  for(;cursor<oi;cursor++)if(/XSD2_|^\/?(?:解锁|锁定|身份|段位)\s/.test(old[cursor][3]))return null;
  map.set(oi,ni);oldPrev=oi;newPrev=ni;
 }
 if(c.chat.slice(newPrev+1).some(m=>m.is_user && /XSD2_|^\/?(?:解锁|锁定|身份|段位)\s/.test(String(m.mes||''))))return null;
 const state=C.clone(s);let unsafe=false;
 function remap(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if(k==='floor'&&Number.isInteger(x)){if(map.has(x))v[k]=map.get(x);else unsafe=true;}else if(k!=='processed')remap(x);}}
 remap(state);if(unsafe)return null;
 state.processed=Object.fromEntries(ids.map(i=>[map.get(i),s.processed[i]]));
 state.history_reassociation={sourceChatId:e.chatId,sourceFloor:ids.at(-1),floor:newPrev,verifiedReplies:ids.length};
 return {state,floor:newPrev};
}
module.exports={reassociate};
