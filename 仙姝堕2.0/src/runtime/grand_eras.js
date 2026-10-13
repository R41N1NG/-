"use strict";
const C=require('./contracts');
function validate(eras){
 const ids=new Set();
 for(let i=0;i<eras.length;i++){
  const e=eras[i];C.assertDate(e.startDate);C.assertDate(e.endDate);
  if(!e.id||ids.has(e.id)||!e.name||!e.background||!Array.isArray(e.anchors)||C.day(e.startDate)>=C.day(e.endDate))throw Error('大势配置无效');
  if(i && C.day(eras[i-1].endDate)!==C.day(e.startDate))throw Error('大势日期必须首尾衔接');
  ids.add(e.id);
 }
 return eras;
}
function currentEra(eras,date){
 const stamp=C.day(date);
 // The last known background remains after its planned window; no future event is invented.
 return [...eras].reverse().find(e=>stamp>=C.day(e.startDate)) || null;
}
function reconcile(s,eras){
 const stamp=C.day(s.calendarDate),st=s.stat_data,e=currentEra(eras,s.calendarDate);
 st.grand_era=e?.id||null;
 st.grand_era_entry=e?.entryId||e?.id||null;
 for(const era of eras)for(const key of era.anchors)st.known[key]=stamp>=C.day(era.startDate);
 st.era_effects ||= {};
 const calamity=eras.find(x=>x.id==='calamity');
 if(calamity && stamp>=C.day(calamity.startDate) && !st.era_effects.calamity){
  const realm=st.player_realm;
  if(realm && (realm.major==='元婴' || /^元婴[（(]/.test(realm.label || ''))){
   const from=st.修为;realm.major='金丹';realm.phase='大圆满';st.修为='金丹大圆满';
   realm.actions.push({kind:'calamity-drop',floor:s.floor,from,to:st.修为,days:0});
  }
  st.era_effects.calamity=true;
 }
 // A manual rewind permits replay of the calamity; restoring a message restores the full realm too.
 if(calamity && stamp<C.day(calamity.startDate))delete st.era_effects.calamity;
 return e;
}
function advance(s,eras,id){
 const e=eras.find(x=>x.id===id);if(!e)throw Error('未知大势时期');
 const days=C.day(e.startDate)-C.day(s.calendarDate);
 if(days<=0)throw Error('只能快进至未来时期');
 s.calendarDate=C.clone(e.startDate);s.clockRemainder=0;s.stat_data.历时=days+'日';
 return days;
}
function eraEntries(eras,startId=13000){
 validate(eras);
 const entries=eras.map((e,i)=>({uid:startId+i,comment:'【大势背景】'+(e.entryId||e.id),key:[],keysecondary:[],constant:true,selective:false,disable:true,order:204,position:1,excludeRecursion:true,preventRecursion:true,
 content:'【当前世界背景：'+e.name+'】\n'+e.background+'\n这些是已发生或持续中的背景，不是要求本轮重新演绎入场或灾变。不得替玩家完成局部事件、发放奖励或推进人物阶段；不得预测后续时期。'}));
 entries.push({uid:startId+eras.length,comment:'【大势规则】中控调度',key:[],keysecondary:[],constant:true,selective:false,disable:true,order:199,position:1,excludeRecursion:true,preventRecursion:true,content:'日期、当前大势、身份、境界、人物阶段与在场角色读取后台。仅当前大势背景生效；世界时期由后台日期确定，个人段位不制造世界事实。局部事件需要玩家点击并按各自完成规则结算；日期到达不自动完成城破、探索或人物晋升。不得引用未注入的未来时期，不重复上演已发生的灾变。状态栏时间照抄后台年月日，历时只申报本回合耗时。'});
 return entries;
}
module.exports={validate,currentEra,reconcile,advance,eraEntries};
