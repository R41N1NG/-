'use strict';
/* gpt：权威结算纯引擎。活跃聊天按顺序回放，正文是输入，绝对时间与大势由脚本计算。 */
const Clock=require('./时钟.js');
const Tracker=require('../状态栏/羁押追踪.js');
const Ledger=require('../状态栏/玩家武学回放.js');
const {fingerprint}=require('./指纹.js');
const defaults=require('./规则.json');
const Official=require('./官府态势.js');
const clone=value=>structuredClone(value);
const unknown=value=>!value||/^(?:无|未明|未知|未记录|不详)$/.test(String(value).trim());
function report(input){const text=String(input??'').replace(/<(think|analysis)>[^]*?<\/\1>/gi,'').replace(/<details\b[^>]*>[^]*?<\/details>/gi,'');const blocks=[...text.matchAll(/<status_bar>((?:(?!<status_bar>)[^])*?)<\/status_bar>/g)];if(blocks.length!==1||!/^(?:---)?$/.test(text.slice(blocks[0].index+blocks[0][0].length).trim()))return null;
 const result={};for(const key of ['time','elapsed','location','prison_control','clue_obtained','clues_gained','intel_delta','intel_events',...Tracker.tags]){const hits=[...blocks[0][1].matchAll(new RegExp('<'+key+'>([^<]*)</'+key+'>','g'))];if(hits.length>1)return null;result[key]=hits.length?Ledger.decodeText(hits[0][1]):'';}return result;}
function initial(){return {schema:1,ready:false,unsettled:true,time:null,custody:Tracker.evaluateRoster([]),intel:{known:[],names:[],value:0,actCount:0,actTotal:0},official:Official.initial(),events:{active:null,fired:{},entered:{},next:''},floor:0,trend:null,nodes:[],location:'未明',prisonControl:'未明',pending:[]};}
function gateResult(gate,state){
 if(!gate)return {status:'available',reason:'原卡已列出的场所节点'};
 if(gate.unconfigured)return {status:'unconfirmed',reason:gate.description};
 if(gate.endDay!==undefined&&state.time.dayIndex>gate.endDay)return {status:'expired',reason:gate.description||'已超过节点保留日期'};
 const tests=[];
 if(gate.startDay!==undefined)tests.push(state.time.dayIndex>=gate.startDay);
 if(gate.minIntel!==undefined)tests.push(state.intel.value>=gate.minIntel);
 const check=test=>test.prisonControl?state.prisonControl===test.prisonControl:test.clue?state.intel.known.includes(test.clue):false;
 if(gate.all)tests.push(gate.all.every(check));
 if(gate.any)tests.push(gate.any.some(check));
 return {status:tests.length?tests.every(Boolean)?'available':'locked':'unconfirmed',reason:gate.description||'配置中的时间与情报条件'};
}
function derive(state,config){if(!state.time)return;const act=state.time.act;state.trend=clone(config.acts.find(item=>item.act===act));const current=config.clues.filter(item=>item.act===act);state.intel.names=state.intel.known.map(id=>config.clues.find(item=>item.id===id)?.name).filter(Boolean);state.intel.value=state.intel.names.length;state.intel.actCount=current.filter(item=>state.intel.known.includes(item.id)).length;state.intel.actTotal=current.length;
 state.nodes=config.nodes.map(node=>({...clone(node),...gateResult(node.gate,state),current:state.location.includes(node.name)}));}
function addPending(state,floor,code,message){state.pending.push({floor,code,message});state.pending=state.pending.slice(-30);}
function gained(value){if(unknown(value))return [];try{const list=JSON.parse(value);return Array.isArray(list)&&list.length<=32&&list.every(item=>typeof item==='string')?[...new Set(list.map(item=>item.trim()).filter(Boolean))]:null;}catch{return null;}}
function replay(chat,config=defaults){if(!Array.isArray(chat))throw TypeError('需要当前聊天数组');const state=initial(),frames=[],custodyReports=[];
 // 异常楼也保存当前输入绑定的保持状态，不能留下上一候选的毒快照。
 const record=(floor,message)=>frames.push({floor,sourceFingerprint:fingerprint(message),sourcePrefix:fingerprint({mes:JSON.stringify(chat.slice(0,floor+1).map(fingerprint))}),snapshot:clone(state)});
 for(let floor=0;floor<chat.length;floor++){const message=chat[floor];if(!message||message.is_system||message.is_user)continue;state.unsettled=true;const parsed=report(message.mes??message.message);if(!parsed){addPending(state,floor,floor===0?'missing_anchor':'missing_report',floor===0?'零楼没有唯一完整的开局回报，无法确认开局时刻。':'本楼没有唯一完整的状态回报，未自动改变时间或情报。');record(floor,message);continue;}
  if(!state.ready){if(floor!==0){addPending(state,floor,'missing_anchor','零楼没有可靠开局时刻，未猜测日期。');record(floor,message);continue;}const anchor=Clock.parseAnchor(parsed.time);if(!anchor){addPending(state,floor,'missing_anchor','开局时刻无法解析，未默认四月初一。');record(floor,message);continue;}state.time=anchor;state.ready=true;}
  state.unsettled=false;const actAtStart=state.time.act;state.floor=floor;
  custodyReports.push({...parsed,floor});state.custody=Tracker.evaluateRoster(custodyReports);
  if(!unknown(parsed.location))state.location=parsed.location;
  if(['未涉','受限','掌控'].includes(parsed.prison_control))state.prisonControl=parsed.prison_control;
  const items=gained(parsed.clues_gained);
  if(items===null)addPending(state,floor,'invalid_clues','clues_gained须是信物ID/名称的JSON数组。');
  else if(parsed.clue_obtained==='1'){
   if(!items.length)addPending(state,floor,'unnamed_clue','标记获得信物但未给确切ID/名称，不自动领取第一个目标。');
   for(const value of items){const item=config.clues.find(entry=>entry.id===value||entry.name===value||entry.aliases?.includes(value));if(!item){addPending(state,floor,'unknown_clue','未收录的信物未自动入账：'+value);continue;}if(item.act>actAtStart){addPending(state,floor,'future_clue','尚未开放幕次的信物未自动入账：'+item.name);continue;}if(!state.intel.known.includes(item.id))state.intel.known.push(item.id);}
  }else if(items?.length)addPending(state,floor,'unconfirmed_clue','列出信物但没有明确获得标记，未入账。');
  if(floor>0){const minutes=Clock.parseElapsed(parsed.elapsed);if(minutes===null)addPending(state,floor,'unknown_elapsed','耗时未明确，时钟保持原值。');else{try{state.time=Clock.advance(state.time,minutes);}catch{addPending(state,floor,'invalid_elapsed','耗时超出安全范围，时钟保持原值。');}}}
  if(floor>0){Official.settle(state.official,message.mes??message.message,parsed,floor,(code,text)=>addPending(state,floor,code,text));if(state.time.act>actAtStart){const requestedDelta=5*(state.time.act-actAtStart),before=state.official.val;state.official.val=Math.min(100,before+requestedDelta);state.official.history.push({floor,id:'act_'+state.time.act,requestedDelta,delta:state.official.val-before,reason:'幕次变化'});}}
  Official.derive(state.official);Official.nodes(state);derive(state,config);record(floor,message);
 }
 return {state:clone(state),frames,pending:clone(state.pending)};
}
module.exports={replay,report,fingerprint};
