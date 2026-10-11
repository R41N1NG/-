(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createYoujiguController=factory;})(globalThis,function createController(E,ports){
'use strict';
const FIELD='youjigu_map_test',NAME='幽寂谷地图接入测试卡';
const clone=v=>JSON.parse(JSON.stringify(v));
function fingerprint(chat){return chat.map(m=>JSON.stringify([!!m.is_user,!!m.is_system,m.swipe_id??0,String(m.mes??m.message??'')]));}
function matches(saved,signature){return saved&&Array.isArray(saved.branch)&&saved.branch.length<=signature.length&&saved.branch.every((x,i)=>x===signature[i]);}
function identity(name){if(!['自设','赵无忧','焚欲殿主','欢喜殿主','浊龙殿主','魂欢殿主'].includes(name))throw Error('请选择有效身份');return name;}
function world(state){const y=Math.floor(state.stamp/360),r=state.stamp-y*360,m=Math.floor(r/30)+1,d=r%30+1;return {仙盟历:y+m/100+(d-1)/30*.005,仙盟历文:`${y}年${m}月${d}日`,历基准:state.stamp/30,历时累计:0,本楼历时加速:0};}
async function authority(base,token,signature){
 for(let i=token.messageId;i>=0;i--){const layer=i===token.messageId?base.layers[1]:await ports.getVariables({type:'message',message_id:i});ports.guard(token,signature);const saved=layer?.stat_data?.[FIELD]?.[0];if(saved?.chatId===token.chatId&&matches(saved,signature))return clone(saved);}
 return null;
}
async function read(){const token=ports.capture();ports.guard(token);const signature=fingerprint(ports.context().chat);const base=await ports.snapshot(token);ports.guard(token,signature);return {token,signature,saved:await authority(base,token,signature)};}
function prompt(s){if(!s)return '幽寂谷地图试验：请玩家在地图面板确认身份并启动。不得自行推进世界日期或发放奖励。';
 const options=E.options(s).filter(a=>!a.blocked).map(a=>a.label).join('、');
 return `[幽寂谷地图测试·脚本状态] 世界日期：${E.date(s.stamp)}；当前步骤：${s.step}；已有效回复轮数：${s.turn}。\n${E.config.budget}\n已取得物品：${s.inventory.join('、')||'无'}。当前允许按钮：${options||'无'}。\n只叙述当前步骤的自由活动，未选择的分支和奖励不得提前揭示。模型不能切换步骤、发奖或改日期；不要输出代码或后台变量。玩家自由活动文本不等于获得条件。${s.receipt?'本次事件已结束。仅根据真实回执总结，不输出新故事。回执：'+JSON.stringify(s.receipt):'环境叙事仅作测试占位，不编造正式宝物名。'}`;
}
async function mutate(intent){return ports.transact(async(base,token)=>{
 const signature=fingerprint(ports.context().chat);ports.guard(token,signature);let saved=await authority(base,token,signature);let result;
 if(intent.type==='start'){if(saved)throw Error('本次聊天已有事件记录，请开启新的测试聊天');const stamp=E.day(1578,intent.month,intent.day);if(!Number.isInteger(intent.month)||intent.month<1||intent.month>12||!Number.isInteger(intent.day)||intent.day<1||intent.day>30)throw Error('日期范围无效');saved={chatId:token.chatId,state:E.initial(identity(intent.identity),stamp),branch:signature,counted:[],revision:0};result={ok:true,state:saved.state};}
 else {if(!saved)throw Error('请先启动事件');if(intent.expectedChatId!==undefined&&intent.expectedChatId!==saved.chatId)throw Error('面板属于其它聊天，请重新读取');if(intent.expectedBranch&&JSON.stringify(intent.expectedBranch)!==JSON.stringify(saved.branch))throw Error('面板分支已过期，请重新读取');if(intent.revision!==undefined&&intent.revision!==saved.revision)throw Error('面板已过期，请重新读取');
 if(intent.type==='action'){const a=E.defs[intent.id];if((a?.finish||a?.early)&&intent.confirm!==true)throw Error('最终退出需要明确确认');result=E.act(saved.state,intent.id);}
 else if(intent.type==='next'){if(E.options(saved.state).some(a=>a.ttl&&!a.blocked)&&intent.confirm!==true)throw Error('仍有可探索入口，请确认继续');result=E.next(saved.state);}
 else if(intent.type==='story'){const c=ports.context(),id=intent.id,m=c.chat[id];if(id!==token.messageId||id<=0||!m||m.is_user||m.is_system||m.is_hidden||!String(m.mes??'').trim())throw Error('不是最新有效故事回复');if(saved.state.step==='map'||saved.state.step==='done'||saved.counted.includes(id))return {patch:world(saved.state),value:saved};result=E.talk(saved.state,'[酒馆有效故事回复·第'+id+'楼]');saved.counted.push(id);}
 else if(intent.type==='restore')return {patch:{[FIELD]:[saved],...world(saved.state)},value:saved};
 else throw Error('未知事件操作');}
 if(!result.ok)throw Error(result.error);saved.state=result.state;saved.branch=signature;saved.revision++;return {patch:{[FIELD]:[saved],...world(saved.state),身份:saved.state.identity},value:saved};
 });}
return {FIELD,NAME,read,mutate,prompt,fingerprint,matches,world};
});
