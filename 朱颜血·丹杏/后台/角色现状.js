'use strict';
// gpt：保存已出场角色的当前事实；摘要来自当前回报，证据须逐字位于本楼正文。
const absent=v=>typeof v!=='string'||!v.trim()||/^(无|未知|未明|不详)$/.test(v.trim());
function seed(state,floor){if(Object.keys(state.characters).length)return;
 state.characters['白雪莲']={name:'白雪莲',summary:'主动接受调查，被关押在豺狼坡黑狱。',location:'豺狼坡黑狱',condition:'被关押，等待调查',inCustody:true,custodyState:'在押',firstFloor:floor,lastFloor:floor,source:'开局固定事实'};
 state.characters['薛霜灵']={name:'薛霜灵',summary:'奋力反抗后被捕，被关入豺狼坡黑狱拷问。',location:'豺狼坡黑狱',condition:'被捕关押，遭受拷问',inCustody:true,custodyState:'在押',firstFloor:floor,lastFloor:floor,source:'开局固定事实'};
}
function observePresent(state,raw,config,floor){
 const block=String(raw).match(/<status_bar>([^]*?)<\/status_bar>/)?.[1]||'';
 const main=block.match(/<favor_char>([^<]*)<\/favor_char>/)?.[1];
 const names=[main,...[...block.matchAll(/<extra_char_[1-4]>([^]*?)<\/extra_char_[1-4]>/g)].map(m=>m[1].match(/<name>([^<]*)<\/name>/)?.[1])].filter(Boolean);
 const body=String(raw).replace(/<(think|analysis|details)\b[^>]*>[^]*?<\/\1>/gi,'').replace(/<status_bar>[^]*?<\/status_bar>/g,'');
 for(const name of names){const actor=(config.characterRoster||[]).find(a=>a.name===name.trim()||a.aliases?.includes(name.trim()));if(!actor||actor.node&&!state.events.entered[actor.node])continue;
  const aliases=[actor.name,...(actor.aliases||[])];const sentence=body.split(/[。！？!?\n]/).map(s=>s.trim()).filter(s=>s&&aliases.some(a=>s.includes(a))&&!/(据说|听说|传闻|若是|假如|计划|打算|可能|将要|名字|名号|未到|未现身|不在场)/.test(s)).at(-1);
  if(!sentence)continue;
  const row=state.characters[actor.name]||{name:actor.name,summary:'已在当前场景出场，具体处境待明确。',firstFloor:floor,lastFloor:floor,source:'在场人物回报'};
  row.observation=sentence.slice(0,400);row.observedFloor=floor;state.characters[actor.name]=row;
 }
}
function reconcileCustody(state,floor,config){
 for(const held of state.custody||[]){
  if(typeof held.inCustody!=='boolean'||held.floor!==floor)continue;
  const actor=(config.characterRoster||[]).find(a=>a.name===held.name||a.aliases?.includes(held.name));
  if(!actor||actor.node&&!state.events.entered[actor.node])continue;
  const old=state.characters[actor.name];if(!old)continue;
  const changed=typeof old.inCustody==='boolean'&&old.inCustody!==held.inCustody;
  if(changed){old.summary=actor.name+'：'+held.state;old.condition=held.state;old.lastFloor=floor;old.source='人物专属状态回报';if(!held.inCustody)old.location='未明';}
  old.inCustody=held.inCustody;old.custodyState=held.state;
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
  if(seen.has(actor.name)){pending('characters_duplicate','同一角色本楼重复申报，后项未覆盖：'+actor.name);continue;}seen.add(actor.name);
  if(actor.node&&!state.events.entered[actor.node]){pending('characters_locked','角色尚未按节点正式登场，未写入：'+actor.name);continue;}
  if(absent(u.summary)||u.summary.length>500||absent(u.evidence)||u.evidence.length>500||!narrative.includes(u.evidence)||!u.evidence.includes(actor.name)&&!actor.aliases?.some(a=>u.evidence.includes(a))||/(据说|传闻|若是|假如|假设|打算|计划|准备|可能|将要|将会)/.test(u.evidence)){
   pending('characters_evidence','角色现状缺少本楼具名的已发生事实摘录，未更新：'+actor.name);continue;
  }
  const prior=state.characters[actor.name];const next={...(prior||{name:actor.name,firstFloor:floor}),summary:u.summary.trim(),lastFloor:floor,evidence:u.evidence,source:'本楼正文事实'};
  for(const k of ['location','condition'])if(!absent(u[k])&&u[k].length<=200)next[k]=u[k].trim();
  state.characters[actor.name]=next;
 }
}
module.exports={seed,apply,reconcileCustody,observePresent};
