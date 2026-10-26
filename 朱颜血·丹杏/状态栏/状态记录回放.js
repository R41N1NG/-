/* gpt：只读截至本楼的时间/耗时/羁押明报；不编造耗时、不推进时间、不写状态。 */
(function (global) {
 'use strict';
 const ledger = global.ZYXMartialLedger || (typeof require === 'function' ? require('./玩家武学回放.js') : null);
 const known = value => !!value && !/^(未明|未知|未记录|未登记|不详)$/.test(value.trim());
 const profiles = [
  {key:'bailian', name:'白雪莲', tag:'bailian_state', profile:'原设身份：罗霄派亲传弟子、刑部捕盗司新任巡按女捕快。原设境界：通明。当前羁押与身体情况以明报为准。', portraitKey:'白雪莲-关押中'},
  {key:'shuangling', name:'薛霜灵', tag:'shuangling_state', profile:'原设身份：白莲教左路信使。原设境界：冲脉。当前羁押与身体情况以明报为准。', portraitKey:'薛霜灵-关押中'}
 ];
 function parseStatus(input) {
  const body=String(input??'').replace(/<(think|analysis)>[^]*?<\/\1>/gi,'').replace(/<details\b[^>]*>[^]*?<\/details>/gi,'');
  const matches=[...body.matchAll(/<status_bar>((?:(?!<status_bar>)[^])*?)<\/status_bar>/g)];
  if(matches.length!==1||!/^(?:---)?$/.test(body.slice(matches[0].index+matches[0][0].length).trim()))return null;
  const result={};
  for(const tag of ['time','elapsed','location','bailian_state','shuangling_state','prison_control','roster_event']) {
   const hits=[...matches[0][1].matchAll(new RegExp('<'+tag+'>([^<]*)</'+tag+'>','g'))];
   result[tag]=hits.length===1?ledger.decodeText(hits[0][1]):'';
  }
  return result;
 }
 function collect(reports, source) {
  const latest=reports.at(-1)??{};
  const prisoners=profiles.map(profile=>{
   const found=[...reports].reverse().find(item=>known(item[profile.tag]));
   return {...profile,state:found?.[profile.tag]??'未回报羁押状态',floor:found?.floor??null};
  });
  return {source, prisoners, time:latest.time||'未明', elapsed:known(latest.elapsed)&&latest.elapsed!=='无'?latest.elapsed:'待回报',
   history:reports.slice(-30).map(({floor,time,elapsed,location})=>({floor,time:time||'未明',elapsed:known(elapsed)&&elapsed!=='无'?elapsed:'待回报',location:location||'未明'}))};
 }
 function fromChat(chat,{cutoff}={}) {
  if(!Array.isArray(chat)||!Number.isInteger(cutoff)||cutoff<0||cutoff>=chat.length)throw new Error('状态记录必须限定当前楼');
  let reports=[];
  for(let i=0;i<=cutoff;i++) {
   const message=chat[i];if(!message||message.is_system)continue;
   const body=String(message.mes??message.message??'');
   if(message.is_user){if(ledger.parseOpening(body))reports=[];continue;}
   const report=parseStatus(body);if(report)reports.push({...report,floor:i});
  }
  return collect(reports,'history');
 }
 function fromSnapshot(snapshot) {return collect([{...snapshot,floor:null}],'snapshot');}
 const api={parseStatus,fromChat,fromSnapshot};global.ZYXStatusRecords=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
