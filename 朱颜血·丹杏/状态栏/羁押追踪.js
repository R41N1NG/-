/* gpt：八人纯函数羁押回放。初始未知，只信人物专属字段，不从传闻/全局事件猜归属。 */
(function(global){
 'use strict';
 const definitions=global.ZYX_HUD_CONFIG?.roster??(typeof require==='function'?require('./羁押名册.json'):[]);
 const unknown=v=>!v||/^(?:无|未明|未知|未记录|未登记|不详)$/.test(String(v).trim());
 const positive=new Set(['在押','关押中','已关押','已被关押','被关押','已收监','收监','已收押','收押','已入狱','入狱','被囚禁','被拘禁']);
 const negative=new Set(['未关押','未被关押','未在押','不在押','未入狱','未被捕','未曾被捕','自由','已释放','释放','获释','已获释','无罪释放','脱困','已脱困','逃脱','已逃脱','脱逃','已脱逃','越狱','已越狱','获救','已获救','救出','已救出','已离狱','已出狱','已死亡','已身亡']);
 function transition(value,def){if(unknown(value))return null;let text=String(value).trim();
  for(const name of [def.name,...def.aliases].sort((a,b)=>b.length-a.length)){if(text.startsWith(name)){text=text.slice(name.length).replace(/^[\s:：·]+/,'');break;}}
  const prefix=text.split(/[｜|：:，,；;。\n]/,1)[0].trim();
  if(positive.has(prefix))return true;if(negative.has(prefix))return false;
  // 兼容旧字段的明确直述；只接受以事实开头，拒绝“将/若/可能/据说”等条件传闻。
  if(/^(?:已被关押|被关押|已关押|已收监|已收押|关押中)(?:于|在|至|到|$)/.test(text))return true;
  if(/^(?:已经获释|已经脱困|已获释|已释放|已脱困|已逃脱|已经逃脱)(?:离开|离狱|回到|返回|$)/.test(text))return false;
  return null;
 }
 function evaluateRoster(reports=[]){
  const roster=definitions.map(def=>({...def,inCustody:null,isImprisoned:false,state:'未回报羁押状态',floor:null,custodyFloor:null}));
  for(const report of reports){for(const item of roster){const value=report[item.tag];if(unknown(value))continue;item.state=String(value).trim();item.floor=report.floor??null;const flag=transition(value,item);if(flag!==null){item.inCustody=flag;item.isImprisoned=flag;item.custodyFloor=report.floor??null;}}}
  return roster;
 }
 const api=Object.freeze({evaluateRoster,getImprisonedList:reports=>evaluateRoster(reports).filter(x=>x.inCustody===true),transition,tags:definitions.map(x=>x.tag)});
 global.ZYXPrisonTracker=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
