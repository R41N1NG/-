'use strict';
// gpt：保存已出场角色的当前事实；摘要来自当前回报，证据须逐字位于本楼正文。
const absent=v=>typeof v!=='string'||!v.trim()||/^(无|未知|未明|不详)$/.test(v.trim());
function blank(actor){return {name:actor.name,aliases:[...(actor.aliases||[])],appeared:false,appearance:'未出场',summary:'',location:'',condition:'',observation:'',inCustody:null,custodyState:'',firstFloor:null,lastFloor:null,observedFloor:null,source:''};}
function roster(config){return Object.fromEntries((config.characterRoster||[]).map(actor=>[actor.name,blank(actor)]));}
function hasFacts(row){return !!row&&['summary','location','condition','observation'].some(key=>!absent(row[key]));}
function mark(row,floor){row.appeared=true;row.firstFloor??=floor;row.lastFloor=floor;row.appearance=hasFacts(row)?'已有事实':'已出场待明';return row;}
function injectable(rows){return Object.values(rows||{}).filter(row=>row.appeared&&hasFacts(row));}
function seed(state,floor){
 const presets={
  '白雪莲':{summary:'主动接受调查，被关押在豺狼坡黑狱。',location:'豺狼坡黑狱',condition:'被关押，等待调查'},
  '薛霜灵':{summary:'奋力反抗后被捕，被关入豺狼坡黑狱拷问。',location:'豺狼坡黑狱',condition:'被捕关押，遭受拷问'}
 };
 for(const [name,preset] of Object.entries(presets)){const row=state.characters[name];if(!row||row.appeared||hasFacts(row))continue;Object.assign(row,preset,{inCustody:true,custodyState:'在押',source:'开局固定事实'});mark(row,floor);}
}
function observePresent(state,raw,config,floor){
 const block=String(raw).match(/<status_bar>([^]*?)<\/status_bar>/)?.[1]||'';
 const main=block.match(/<favor_char>([^<]*)<\/favor_char>/)?.[1];
 const names=[main,...[...block.matchAll(/<extra_char_[1-4]>([^]*?)<\/extra_char_[1-4]>/g)].map(m=>m[1].match(/<name>([^<]*)<\/name>/)?.[1])].filter(Boolean);
 const body=String(raw).replace(/<(think|analysis|details)\b[^>]*>[^]*?<\/\1>/gi,'').replace(/<status_bar>[^]*?<\/status_bar>/g,'');
 for(const name of names){const actor=(config.characterRoster||[]).find(a=>a.name===name.trim()||a.aliases?.includes(name.trim()));if(!actor||actor.node&&!state.events.entered[actor.node])continue;
  const aliases=[actor.name,...(actor.aliases||[])];const sentence=body.split(/[。！？!?\n]/).map(s=>s.trim()).filter(s=>s&&aliases.some(a=>s.includes(a))&&!/(据说|听说|传闻|若是|假如|计划|打算|可能|将要|名字|名号|未到|未现身|不在场)/.test(s)).at(-1);
  const row=state.characters[actor.name]||blank(actor);
  if(sentence){row.observation=sentence.slice(0,400);row.observedFloor=floor;row.source||='在场人物回报';}mark(row,floor);state.characters[actor.name]=row;
 }
}
function reconcileCustody(state,floor,config){
 for(const held of state.custody||[]){
  if(typeof held.inCustody!=='boolean'||held.floor!==floor)continue;
  const actor=(config.characterRoster||[]).find(a=>a.name===held.name||a.aliases?.includes(held.name));
  if(!actor||actor.node&&!state.events.entered[actor.node])continue;
  const old=state.characters[actor.name];if(!old||!old.appeared)continue;
  const changed=typeof old.inCustody==='boolean'&&old.inCustody!==held.inCustody;
  if(changed){old.summary=actor.name+'：'+held.state;old.condition=held.state;old.lastFloor=floor;old.source='人物专属状态回报';if(!held.inCustody)old.location='未明';}
  old.inCustody=held.inCustody;old.custodyState=held.state;old.appearance=hasFacts(old)?'已有事实':'已出场待明';
 }
}
function apply(state,raw,parsed,config,floor,pending){
 if(!parsed.character_updates?.trim())return;
 let updates;try{updates=JSON.parse(parsed.character_updates);if(!Array.isArray(updates)||updates.length>32)throw Error();}catch{pending('characters_format','character_updates须是至多32项的角色现状更新JSON数组');return;}
 const narrative=String(raw).replace(/<(think|analysis|details)\b[^>]*>[^]*?<\/\1>/gi,'').replace(/<status_bar>[^]*?<\/status_bar>/g,'');
 const seen=new Set();
 for(const u of updates){
  const actor=(config.characterRoster||[]).find(a=>a.name===u?.name||a.aliases?.includes(u?.name));
  if(!actor){pending('characters_name','角色现状中的姓名不在本卡名册，未写入');continue;}
  if(!['summary','location','condition'].some(key=>!absent(u[key])))continue;
  if(seen.has(actor.name)){pending('characters_duplicate','同一角色本楼重复申报，后项未覆盖：'+actor.name);continue;}seen.add(actor.name);
  if(actor.node&&!state.events.entered[actor.node]){pending('characters_locked','角色尚未按节点正式登场，未写入：'+actor.name);continue;}
  if(!['summary','location','condition'].some(key=>!absent(u[key])&&u[key].length<=(key==='summary'?500:200))||(!absent(u.summary)&&u.summary.length>500)||absent(u.evidence)||u.evidence.length>500||!narrative.includes(u.evidence)||!u.evidence.includes(actor.name)&&!actor.aliases?.some(a=>u.evidence.includes(a))||/(据说|传闻|若是|假如|假设|打算|计划|准备|可能|将要|将会)/.test(u.evidence)){
   pending('characters_evidence','角色现状缺少本楼具名的已发生事实摘录，未更新：'+actor.name);continue;
  }
  const prior=state.characters[actor.name];const next={...(prior||blank(actor)),evidence:u.evidence,source:'本楼正文事实'};
  for(const k of ['summary','location','condition'])if(!absent(u[k])&&u[k].length<=(k==='summary'?500:200))next[k]=u[k].trim();
  state.characters[actor.name]=mark(next,floor);
 }
}
module.exports={seed,apply,reconcileCustody,observePresent,roster,injectable,hasFacts};
