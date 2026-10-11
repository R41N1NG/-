(function(root){
'use strict';
const day=(y,m,d)=>y*360+(m-1)*30+d-1;
const date=n=>{const y=Math.floor(n/360),r=n-y*360;return `仙盟历 ${y}年 ${Math.floor(r/30)+1}月 ${r%30+1}日`;};
const open=day(1578,3,1),close=day(1578,4,30);
const config={completeDays:2,earlyDays:1,budget:'测试预算：本次事件叙事不超过两日；世界日期仅在退出结算时推进。'};
const defs={
 'g7p2':{label:'进入幽寂谷',from:'map',to:'first'},
 'k4m8':{label:'探索洞府',from:'first',to:'cave',ttl:3},
 's9a3':{label:'探索山涧',from:'first',to:'stream',ttl:5},
 'b8n2':{label:'开启香炉',from:'cave',group:'cave',reward:'丹药（名称待定）'},
 'q3f7':{label:'开启暗格',from:'cave',group:'cave',reward:'幽寂谷地图',known:'map_youjigu'},
 'h5w9':{label:'离开洞府',from:'cave',to:'first'},
 'r2c6':{label:'查看溪水',from:'stream',note:'已查看溪水；正式剧情待填。'},
 'a6d4':{label:'查看树丛',from:'stream',note:'已查看树丛；正式剧情待填。'},
 'j8e1':{label:'离开山涧',from:'stream',to:'first'},
 'u9h3':{label:'前往山谷',from:'second',to:'valley'},
 'v4t7':{label:'前往密室',from:'second',to:'secret',requires:'map_youjigu'},
 'n5z8':{label:'收集草药',from:'valley',reward:'草药（名称待定）'},
 'l7q2':{label:'从出口离开',from:'valley',finish:true},
 'p1x6':{label:'打开左边暗格',from:'secret',group:'secret',reward:'法宝（名称待定）'},
 't6v4':{label:'打开右边暗格',from:'secret',group:'secret',reward:'秘籍（名称待定）'},
 'e3j9':{label:'离开密室',from:'secret',finish:true},
 'z8u5':{label:'提前离开幽寂谷',from:'*',early:true}
};
function initial(identity='自设',stamp=open){return {version:1,identity,stamp,step:'map',turn:0,created:0,visited:[],used:[],mutex:{},known:{},inventory:[],log:[],receipt:null,run:0};}
function reason(s,id){const a=defs[id];if(!a)return '无效事件代码';if(a.from==='*'){if(['map','done'].includes(s.step))return '当前没有活动事件';return '';}
if(a.from!==s.step)return '旧按钮或步骤不匹配';if(s.used.includes(id))return '本次操作已完成';if(a.from==='map'&&(s.stamp<open||s.stamp>close))return '当前日期不在开放窗口';if(a.ttl&&s.turn-s.created>=a.ttl)return '选项已过期';if(a.group&&s.mutex[a.group])return '互斥组已选择';if(a.requires&&!s.known[a.requires])return '需要先获得地图';return '';}
function options(s){return Object.entries(defs).filter(([id,a])=>(a.from===s.step||a.from==='*')&&!s.used.includes(id)&&!(a.ttl&&s.turn-s.created>=a.ttl)&&!(a.group&&s.mutex[a.group])&&!(['map','done'].includes(s.step)&&a.from==='*')).map(([id,a])=>({id,...a,blocked:reason(s,id),remaining:a.ttl?Math.max(0,a.ttl-s.turn+s.created):null}));}
function act(s,id){const err=reason(s,id);if(err)return {ok:false,error:err,state:s};const n=structuredClone(s),a=defs[id];n.used.push(id);n.log.push(a.label);if(a.group)n.mutex[a.group]=id;if(a.reward)n.inventory.push(a.reward);if(a.known)n.known[a.known]=true;if(a.note)n.log.push(a.note);if(a.to){n.step=a.to;if(a.from==='map'){n.created=n.turn;n.run++;}if(['cave','stream'].includes(a.to))n.visited.push(a.to);}
if(a.finish||a.early){const days=a.early?config.earlyDays:config.completeDays;n.receipt={id:`youjigu-${n.run}`,type:a.early?'提前离开':'正常完成',days,from:n.stamp,to:n.stamp+days,rewards:[...n.inventory],summary:[...n.log]};n.stamp+=days;n.step='done';}return {ok:true,state:n};}
function talk(s,text){if(['map','done'].includes(s.step))return {ok:false,error:'请先进入事件',state:s};if(!text.trim())return {ok:false,error:'请输入自由活动内容',state:s};const n=structuredClone(s);n.turn++;n.log.push(`自由活动第${n.turn}轮：${text}`);return {ok:true,state:n};}
function next(s){if(s.step!=='first')return {ok:false,error:'只能从第一轮选择面板继续',state:s};const n=structuredClone(s);n.step='second';n.log.push('玩家确认结束第一轮，转入第二轮');return {ok:true,state:n};}
const api={day,date,open,close,config,defs,initial,reason,options,act,talk,next};if(typeof module!=='undefined')module.exports=api;else root.YoujiguTest=api;
})(globalThis);
