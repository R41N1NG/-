"use strict";
const OPEN_DATE={year:1578,month:3,day:1};
const EVENT_DEFS={
 xbxxEnter:{id:'xbxxEnter',label:'探剿邪窟',from:'map',to:'hall'},
 xbxxFight:{id:'xbxxFight',label:'剑斩二鬼',from:'hall',to:'loot'},
 xbxxLoot:{id:'xbxxLoot',label:'极乐引入手',from:'loot',to:'fork',rewards:['极乐引'],grantsKnown:['极乐引入手']},
 xbxxAmbush:{id:'xbxxAmbush',label:'深入后洞 · 惊变',from:'fork',to:'ambush'},
 xbxxJudge:{id:'xbxxJudge',label:'判定本次救护',from:'ambush',judge:true},
 xbxxCure:{id:'xbxxCure',label:'含津更衣',from:'rescue',to:'return'},
 xbxxDodge:{id:'xbxxDodge',label:'险避奇蛊',from:'dodge',to:'return'},
 xbxxFinishA:{id:'xbxxFinishA',label:'覆巢归宗',from:'return',to:'done',exitDays:10},
 xbxxFinishB:{id:'xbxxFinishB',label:'焚巢回宗',from:'fork',to:'done',exitDays:10},
 xbxxLeave:{id:'xbxxLeave',label:'提前折返',from:['hall','loot','fork','ambush','rescue','dodge','return'],to:'done',exitDays:6}
};
const place=step=>({map:'墨山道',hall:'西北邪窟·洞府前厅',loot:'西北邪窟·前厅石案',fork:'西北邪窟·前厅岔路',ambush:'西北邪窟·后洞私牢',rescue:'西北邪窟·后洞私牢',dodge:'西北邪窟·后洞私牢',return:'西北邪窟·后洞静室',done:'墨山道·山门复命'})[step];
module.exports={OPEN_DATE,EVENT_DEFS,place};
