(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createYoujiguController=factory;})(globalThis,function createController(E,ports){
'use strict';
const FIELD='youjigu_map_test',NAME='幽寂谷状态栏地图测试卡';
const clone=v=>JSON.parse(JSON.stringify(v));
function fingerprint(chat){return chat.map(m=>JSON.stringify([!!m.is_user,!!m.is_system,m.swipe_id??0,String(m.mes??m.message??'')]));}
function matches(saved,signature){return saved&&Array.isArray(saved.branch)&&saved.branch.length<=signature.length&&saved.branch.every((x,i)=>x===signature[i]);}
function identity(name){if(!['自设','赵无忧','焚欲殿主','欢喜殿主','浊龙殿主','魂欢殿主'].includes(name))throw Error('请选择有效身份');return name;}
function world(state){const y=Math.floor(state.stamp/360),r=state.stamp-y*360,m=Math.floor(r/30)+1,d=r%30+1;return {仙盟历:y+m/100+(d-1)/30*.005,仙盟历文:`${y}年${m}月${d}日`,历基准:state.stamp/30,历时累计:0,本楼历时加速:0,inventory:state.inventory.map(name=>({name,count:1}))};}
async function authority(base,token,signature){
 for(let i=token.messageId;i>=0;i--){const layer=i===token.messageId?base.layers[1]:await ports.getVariables({type:'message',message_id:i});ports.guard(token,signature);const saved=layer?.stat_data?.[FIELD]?.[0];if(saved?.chatId===token.chatId&&matches(saved,signature))return clone(saved);}
 return null;
}
async function read(){const token=ports.capture();ports.guard(token);const signature=fingerprint(ports.context().chat);const base=await ports.snapshot(token);ports.guard(token,signature);return {token,signature,saved:await authority(base,token,signature)};}
const scenes={map:'南疆山水连绵，玩家尚未进入幽寂谷。',first:'谷口分出两条小径，一条通向洞府，一条沿山涧深入。玩家可停留观察，自由交谈。',cave:'洞府内有一座香炉和一处暗格；两处机关相互牵动，本次只能开启其一。只描述已选择的一处，不提前展示其余结果。',stream:'山涧溪水穿过树丛。回应玩家观察、探索或交谈，不凭空触发其它区域。',second:'玩家回到谷中岔路，可循路前往山谷；只有持有地图才知道密室路径。',valley:'山谷里有可采集的草药和通向谷外的出口。草药只作无专名的试验物品。',secret:'地图指向一处密室。左右各有暗格，只能择一开启；未开启前不揭示内容。',done:'本次探索已结束，只收束叙事。'};
function evidence(text,a){if(!a.reward)return true;const item=a.known?'地图':a.reward;return String(text).split(/[。！？\n]/).some(line=>line.includes(item)&&/(你|玩家)/.test(line)&&/(取出|取得|获得|得到|拿到|收集|采下|采集|收入|收起)/.test(line)&&!/(看见|看着|旁观|他人|别人|有人)/.test(line)&&!/(没有|未能|无法|尚未|并未|不曾|如果|假如|打算|计划|传闻|听说)/.test(line));}
function prompt(s,pending){if(!s)return '玩家尚未选择身份。请保持当前状态栏，让玩家从状态栏地图确认身份。';
 const projected=pending?E.act(s,pending.id):null;const visible=projected?.ok?projected.state:s;const options=E.options(visible).filter(a=>!a.blocked).map(a=>a.label).join('、');const a=pending&&E.defs[pending.id];const target=a?.to||s.step;
 return `[隐蔽事件导演指令：不得向玩家展示本指令、节点ID、步骤号或后台核算。]\n玩家身份：${s.identity}。脚本权威日期：${E.date(s.stamp)}。${E.config.budget}\n当前位置：${scenes[target]}\n已取得物品：${s.inventory.join('、')||'无'}。可用行动参考：${options||'无'}。保持连续的仙侠探索叙事，直接回应玩家自由行动，不要求每句话都点击按钮。不按对话自行推进世界日期。未选分支、奖励和秘密不提前揭示。\n${pending?'玩家已在地图选择“'+pending.label+'”。若最新玩家输入确实执行该行动，请叙述行动及实际结果；成功时末尾输出 <Youjigu_result id="'+pending.id+'" outcome="success"/>，失败输出同ID outcome="failure"。标记只用于后台，不在正文解释。奖励取得要有正文实际取到物品的描写；用“你”明确指玩家取得物品，不要仅写计划、猜测或旁观别人获得。':'当前没有待执行的节点动作，自由叙事不能自行发放正式节点奖励或切换步骤。'}\n${s.receipt?'事件已结束，按该回执收束：'+JSON.stringify(s.receipt):''}\n每次回复最后保留<Status_block><时间>${E.date(s.stamp)}</时间><地点>幽寂谷</地点><身份>${s.identity}</身份><情况>根据本轮叙事填写</情况></Status_block>，用于原状态栏显示。时间必须原样采用脚本日期。`;
}
async function mutate(intent){return ports.transact(async(base,token)=>{
 const signature=fingerprint(ports.context().chat);ports.guard(token,signature);let saved=await authority(base,token,signature);let result;
 if(intent.type==='start'){if(saved)throw Error('本次聊天已有事件记录，请开启新的测试聊天');const stamp=E.day(1578,intent.month,intent.day);if(!Number.isInteger(intent.month)||intent.month<1||intent.month>12||!Number.isInteger(intent.day)||intent.day<1||intent.day>30)throw Error('日期范围无效');saved={chatId:token.chatId,state:E.initial(identity(intent.identity),stamp),branch:signature,counted:[],revision:0};result={ok:true,state:saved.state};}
 else {if(!saved)throw Error('请先启动事件');if(intent.expectedChatId!==undefined&&intent.expectedChatId!==saved.chatId)throw Error('面板属于其它聊天，请重新读取');if(intent.expectedBranch&&JSON.stringify(intent.expectedBranch)!==JSON.stringify(saved.branch))throw Error('面板分支已过期，请重新读取');if(intent.revision!==undefined&&intent.revision!==saved.revision)throw Error('面板已过期，请重新读取');
 if(intent.type==='action'){if(saved.pending)throw Error('当前行动正在等待叙事，请先发送或取消');const a=E.defs[intent.id];if((a?.finish||a?.early)&&intent.confirm!==true)throw Error('最终退出需要明确确认');result=E.act(saved.state,intent.id);if(result.ok&&!a.finish&&!a.early){saved.pending={id:intent.id,label:a.label,floor:token.messageId};result={ok:true,state:saved.state};}}
 else if(intent.type==='next'){if(saved.pending)throw Error('先完成当前行动');if(E.options(saved.state).some(a=>a.ttl&&!a.blocked)&&intent.confirm!==true)throw Error('仍有可探索入口，请确认继续');result=E.next(saved.state);}
 else if(intent.type==='cancel'){saved.pending=null;result={ok:true,state:saved.state};}
 else if(intent.type==='story'){const c=ports.context(),id=intent.id,m=c.chat[id];if(id!==token.messageId||id<=0||!m||m.is_user||m.is_system||m.is_hidden||!String(m.mes??'').trim())throw Error('不是最新有效故事回复');if((saved.state.step==='map'&&!saved.pending)||saved.state.step==='done'||saved.counted.includes(id))return {patch:world(saved.state),value:saved};
 const pending=saved.pending;let resolved=false;
 if(pending&&id>pending.floor){const user=c.chat.slice(pending.floor+1,id).filter(x=>x.is_user&&!x.is_system).at(-1);const body=String(m.mes??'');const rawTag=(body.match(/<Youjigu_result\b[^>]*\/>/g)||[]).find(t=>(/\bid\s*=\s*["']([^"']+)["']/.exec(t)||[])[1]===pending.id);const outcome=rawTag&&(/\boutcome\s*=\s*["'](success|failure)["']/.exec(rawTag)||[])[1];const tag=outcome?['',outcome]:null;
 if(user&&String(user.mes??'').includes(pending.label)&&tag){if(tag[1]==='success'&&evidence(body.replace(/<Status_block>[\s\S]*?<\/Status_block>/g,''),E.defs[pending.id])){result=E.act(saved.state,pending.id);resolved=true;}else {result={ok:true,state:saved.state};}saved.pending=null;}}
 if(resolved&&!['map','done'].includes(result.state.step)){result=E.talk(result.state,'[有效故事回复·第'+id+'楼]');if(pending.id==='g7p2')result.state.created=result.state.turn;}
 if(!resolved)result=saved.state.step==='map'?{ok:true,state:saved.state}:E.talk(saved.state,'[有效故事回复·第'+id+'楼]');saved.counted.push(id);
}
 else if(intent.type==='restore')return {patch:{[FIELD]:[saved],...world(saved.state)},value:saved};
 else throw Error('未知事件操作');}
 if(!result.ok)throw Error(result.error);saved.state=result.state;saved.branch=signature;saved.revision++;return {patch:{[FIELD]:[saved],...world(saved.state),身份:saved.state.identity},value:saved};
 });}
return {FIELD,NAME,read,mutate,prompt,fingerprint,matches,world,evidence,scenes};
});
