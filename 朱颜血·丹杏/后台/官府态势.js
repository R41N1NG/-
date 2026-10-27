'use strict';
// gpt：事件申请结算；不扫新闻或环境关键词，不把模型自报数字直接入账。
const {fingerprint}=require('./指纹.js');
const RULES=Object.freeze({report:20,testimony:20,public_fight:10,witness_escape:15,letter_exposed:20,intercept_messenger:-15,withhold_records:-10,fake_death:-10});
const LEVELS=[0,20,40,65,85];
const NAMES=['零级 · 幽谷盲区','一级 · 风闻生疑','二级 · 重典立案','三级 · 厂卫交锋','四级 · 天罗地网'];
const HINTS=['官家尚不知情，不凭空增加追捕力量。','县衙疑有逆党，便衣差役入山打探。','官府立案，官道设卡、贴榜查验路引。','厂卫介入，东厂接管城门、向深山追查。','全境合围，营兵封锁险隘、海捕文书行下。'];
const TYPES={report:/(告发|告密|报案|递状|投书)/,testimony:/(东厂|番子).*(口供|供词|审讯)/,public_fight:/(当众|客栈|官道).*(械斗|厮杀|亮.*腰牌)/,witness_escape:/(报信|求援|活口.*逃)/,letter_exposed:/(密函|原件).*(流出|现世|被获|落入|搜出)/,intercept_messenger:/(截杀.*(信使|差役|信卒)|射落信鸽)/,withhold_records:/(扣押.*(案卷|密信|告密)|截留.*卷宗)/,fake_death:/伪造.*(死证|尸身|坠崖)|伪证.*结案/};
function initial(){return {val:0,level:0,tierName:NAMES[0],hint:HINTS[0],history:[],seen:[],proofs:[]};}
function settle(state,raw,parsed,floor,pending){
 let events=[];try{events=parsed.intel_events?JSON.parse(parsed.intel_events):[];if(!Array.isArray(events)||events.length>8)throw Error();}catch{pending('intel_format','intel_events必须为至多8条事件的JSON数组。');return;}
 const narrative=String(raw).replace(/<(think|analysis|details)\b[^>]*>[^]*?<\/\1>/gi,'').replace(/<status_bar>[^]*?<\/status_bar>/g,'');
 let net=0;
 for(const item of events){
  if(!item||typeof item.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(item.id)||!Object.hasOwn(RULES,item.type)||typeof item.evidence!=='string'||item.evidence.length<4||item.evidence.length>180){pending('intel_event','事件ID/类型/事实摘录无效，未入账。');continue;}
  const proof=item.evidence.trim();
  if(!narrative.includes(proof)||/(没有|并未|未曾|尚未|不曾|未能|若是|假如|假设|计划|准备|打算|可能|据说|传闻|并没有|没人|不(?:会|再|能|向|去|告|报|曾)|没(?:有|人|向|去|能|曾)|未(?:告|报|取|获|流|回|截|扣|伪)|明天|明日|稍后|将要|将会)/.test(proof)||!TYPES[item.type].test(proof)){pending('intel_evidence','官府事件缺少本楼明确已发生证据，未入账：'+item.id);continue;}
  const digest=fingerprint({mes:proof.replace(/\s/g,'')});
  if(state.seen.includes(item.id)||state.proofs.includes(digest))continue;
  state.seen.push(item.id);state.proofs.push(digest);const wanted=RULES[item.type];const delta=Math.max(-20-net,Math.min(20-net,wanted));net+=delta;
  state.history.push({floor,id:item.id,type:item.type,delta,evidence:proof});
 }
 state.val=Math.max(0,Math.min(100,state.val+net));
 if(Number(parsed.intel_delta)&&!events.length)pending('intel_unverified','只有自报intel_delta，没有事件证据，未直接改变官方知晓度。');
}
function derive(state){state.level=LEVELS.findLastIndex(n=>state.val>=n);state.tierName=NAMES[state.level];state.hint=HINTS[state.level];}
function nodes(state){
 const official=state.official,events=state.events;const county=/(长宁县城|悦来客栈|南街|十字长街|瓮城|县衙|城东|城门)/.test(state.location);
 const held=state.custody.find(x=>x.key==='bailian')?.inCustody===true;
 const rules=[['dark','锦衣卫暗查入境',official.val>=20,'intel',1],['case','长宁知县重案立案',official.val>=40,'intel',2],['dongchang','东厂封总管亲临巡阅',official.val>=65&&state.time.act>=3,'intel',3],['dragnet','天罗地网全境合围',official.val>=85,'intel',4],['lu','陆寒渊登场',official.val>=20&&county,'enter'],['junzhu','宁安郡主与青萝入境',state.time.dayIndex>=20&&county,'enter'],['xieyunsu','师尊谢云素下山寻徒',state.time.dayIndex>=110&&held,'event'],['verdict','巡按御史开审定谳',official.val>=90&&state.time.dayIndex>=230,'event']];
 const npcs={lu:['陆寒渊'],junzhu:['宁安郡主','青萝'],xieyunsu:['谢云素'],dongchang:['封德明']};events.active=null;
 for(const [id,name,pass,kind,order]of rules){if(pass&&kind==='intel')events.active={id,name,order};if(pass&&!events.fired[id]){events.fired[id]={name,kind,day:state.time.dayIndex,floor:state.floor};for(const name of npcs[id]||[])events.entered[name]={floor:state.floor};}}
 // fired是历史；active是当前。降档后当前节点随条件退档，既成登场不抹掉。
 if(official.level===3&&state.time.act<3)official.hint='官府高度警戒；东厂正式介入节点尚未开放，不能提前演成接管城门。';
 events.next=state.time.dayIndex<110?'谢云素节点需第110日起且白雪莲仍未脱困':state.time.dayIndex<230?'定谳节点需第230日起且官方知晓度≥90':'依当前知晓度与羁押事实判断';
}
module.exports={initial,settle,derive,nodes,RULES};
