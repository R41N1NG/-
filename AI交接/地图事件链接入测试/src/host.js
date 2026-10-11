(function(host,factory){
 let root=host;try{if(host.parent?.document)root=host.parent;}catch(_){}
 root.__youjiguTest?.dispose?.();
 root.__youjiguTest=root.Function('root','return ('+factory.toString()+')(root);')(root);
})(window,function(root){
'use strict';
const E=root.YoujiguTest,create=root.createYoujiguController,service=root.__xsdMapCorrection,doc=root.document;
let busy=false,current=null,notice='点击“打开测试地图”开始。',disposed=false,promptApi=null;
const cleanup=[];
function context(){const c=root.SillyTavern?.getContext?.();if(!c)throw Error('SillyTavern上下文不可用');return c;}
function isCard(){const c=context();return c.characters?.[c.characterId]?.name==='幽寂谷地图接入测试卡';}
function fn(name){for(const p of [root.TavernHelper,root])if(typeof p?.[name]==='function')return p[name].bind(p);throw Error('酒馆助手接口不可用：'+name);}
function guard(token,signature){if(disposed||!isCard())throw Error('已离开测试卡');const c=context();if(String(c.chatId??c.chat_id)!==token.chatId||c.chat.length-1!==token.messageId)throw Error('聊天或最新楼已变化，请重新读取');if(signature&&JSON.stringify(controller.fingerprint(c.chat))!==JSON.stringify(signature))throw Error('正文或分支已变化，请重新读取');}
const api={context,getVariables:o=>fn('getVariables')(o),updateVariablesWith:(f,o)=>fn('updateVariablesWith')(f,o)};
const controller=create(E,{context,capture:()=>{if(!isCard())throw Error('请打开幽寂谷地图接入测试卡');return service.capture(api);},guard,getVariables:api.getVariables,snapshot:t=>service.snapshot(api,t),transact:async build=>{
 const signature=controller.fingerprint(context().chat);
 const safeApi={...api,getVariables:async o=>{const t=service.capture(api);guard(t,signature);const v=await api.getVariables(o);guard(t,signature);return v;},updateVariablesWith:async(f,o)=>{const t=service.capture(api);guard(t,signature);const v=await api.updateVariablesWith(x=>{guard(t,signature);return f(x);},o);guard(t,signature);return v;}};
 return service.transact(safeApi,build);
}});
function setter(){const c=context();const f=c.setExtensionPrompt||root.setExtensionPrompt;if(typeof f!=='function')throw Error('当前酒馆不提供setExtensionPrompt，无法注入当前步骤；请回报版本');return f.bind(c);}
function inject(s){promptApi=setter();promptApi('youjigu-map-test',controller.prompt(s),1,0,false,0);}
function clearPrompt(){try{promptApi?.('youjigu-map-test','',1,0,false,0);}catch(_){} }
if(!isCard())return {dispose(){},refresh:async()=>{}};
const style=doc.createElement('style');style.textContent=`#yj-map-button{position:fixed;right:18px;bottom:95px;z-index:99999;border:1px solid #bca572;background:#234b3d;color:#fff;padding:12px;border-radius:9px}#yj-map-dialog{position:fixed;z-index:100000;inset:5vh 4vw;background:#f5f0e4;color:#213b32;border:2px solid #9b8050;border-radius:12px;padding:20px;overflow:auto;box-shadow:0 10px 70px #0009;font:16px/1.6 system-ui;box-sizing:border-box}#yj-map-dialog *{box-sizing:border-box}#yj-map-dialog button,#yj-map-dialog select,#yj-map-dialog input{font:inherit;padding:10px;margin:5px;border:1px solid #9d9b83;border-radius:7px;min-height:44px;background:#244e42;color:white}#yj-map-dialog button:disabled{opacity:.5}#yj-map-dialog input{width:80px;background:#fff;color:#234}#yj-map-dialog .yj-notice{white-space:pre-line;background:#fff0c5;border:2px solid #b88231;padding:12px;font-weight:bold}#yj-map-dialog .yj-row{display:flex;flex-wrap:wrap;gap:7px}#yj-map-dialog .yj-options{display:grid;gap:5px}#yj-map-dialog .yj-close{float:right}#yj-map-dialog .yj-map{width:100%;max-height:260px;object-fit:contain}#yj-map-dialog .yj-exit{background:#833e31}@media(min-width:850px){#yj-map-dialog{inset:5vh calc((100vw - 800px)/2)}}`;
doc.head.append(style);cleanup.push(()=>style.remove());
const open=doc.createElement('button');open.id='yj-map-button';open.textContent='打开测试地图';doc.body.append(open);cleanup.push(()=>open.remove());
const dialog=doc.createElement('section');dialog.id='yj-map-dialog';dialog.hidden=true;doc.body.append(dialog);cleanup.push(()=>dialog.remove());
const names={map:'南疆 · 地图',first:'第一轮 · 选择方向',cave:'探索洞府',stream:'探索山涧',second:'第二轮 · 深入探索',valley:'探索山谷',secret:'探索密室',done:'幽寂谷 · 结算完成'};
function text(parent,tag,value,cls){const n=doc.createElement(tag);n.textContent=value;if(cls)n.className=cls;parent.append(n);return n;}
function button(parent,label,task,disabled=false,cls=''){const b=text(parent,'button',label,cls);b.disabled=disabled||busy;b.onclick=task;return b;}
function fillInput(label){const input=doc.getElementById('send_textarea');if(!input){notice='已保存步骤，但输入框不存在。请手动输入当前行动。';return;}input.value=label;input.dispatchEvent(new root.Event('input',{bubbles:true}));input.focus();}
async function refresh(restore=false){if(disposed)return;if(!isCard()){dispose();return;}const v=await controller.read();current=v.saved;if(restore&&current){await controller.mutate({type:'restore'});current=(await controller.read()).saved;}inject(current?.state);render();}
async function perform(intent,label){if(busy)return;busy=true;render();try{setter();if(root.is_send_press||context().isGenerating)throw Error('正在生成，请等回复完成再点节点');const r=await controller.mutate({...intent,revision:current?.revision,expectedChatId:current?.chatId,expectedBranch:current?.branch});current=r.value;inject(current.state);notice='已保存：'+label+'。';const a=E.defs[intent.id];if(a?.reward)notice+='\n获得：'+a.reward;if(a?.group)notice+='\n互斥的另一项已关闭。';if(a?.to==='first')notice+='\n已返回第一轮，未过期入口仍可选择。';if(a?.finish||a?.early)notice+='\n事件已结束，日期按回执推进。';if(intent.type==='action'||intent.type==='next')fillInput(current.state.step==='done'?'请仅根据事件结算回执总结本次幽寂谷探索，不继续故事。':label);}
catch(e){notice='操作未完成：'+e.message;try{current=(await controller.read()).saved;inject(current?.state);}catch(_){} }
finally{busy=false;render();}}
function choose(id){const s=current.state,a=E.defs[id];if(a.finish||a.early){const n=a.early?E.config.earlyDays:E.config.completeDays;if(!root.confirm('确定'+a.label+'？\n整个事件将结束，世界日期推进'+n+'日（测试值）。\n'+E.date(s.stamp)+' → '+E.date(s.stamp+n)+'\n保留物品：'+(s.inventory.join('、')||'无')))return;}perform({type:'action',id,confirm:true},a.label);}
function render(){dialog.replaceChildren();button(dialog,'关闭',()=>dialog.hidden=true,false,'yj-close');text(dialog,'h2',current?names[current.state.step]:'幽寂谷地图接入测试');text(dialog,'p','独立测试卡 · 不修改正式世界书 · 日期和奖励仍使用测试配置');text(dialog,'p',notice,'yj-notice');if(!current){const row=text(dialog,'div','','yj-row'),select=doc.createElement('select');for(const name of ['自设','赵无忧','焚欲殿主','欢喜殿主','浊龙殿主','魂欢殿主']){const o=text(select,'option',name);o.value=name;}select.value='自设';row.append(select);text(row,'span','1578年');const m=doc.createElement('input'),d=doc.createElement('input');m.type=d.type='number';m.value=3;d.value=1;m.min=d.min=1;m.max=12;d.max=30;row.append(m);text(row,'span','月');row.append(d);text(row,'span','日');button(dialog,'确认身份和测试日期',()=>perform({type:'start',identity:select.value,month:Number(m.value),day:Number(d.value)},'开始测试'));return;}
const s=current.state;text(dialog,'h3',E.date(s.stamp)+' · '+s.identity);text(dialog,'p','有效故事回复 '+s.turn+' 轮；普通对话不改变世界日期。');if(s.step==='map'){const im=doc.createElement('img');im.src='MAP_DATA';im.alt='南疆全域参考地图';im.className='yj-map';dialog.append(im);}if(s.step==='first')text(dialog,'p',['k4m8','s9a3'].map(id=>{const a=E.defs[id];return a.label+'：'+(s.used.includes(id)?'已探索':s.turn-s.created>=a.ttl?'已过期':'剩余'+(a.ttl-s.turn+s.created)+'轮');}).join('；'));const list=text(dialog,'div','','yj-options');for(const a of E.options(s))button(list,a.label+(a.remaining===null?'':' · 剩余'+a.remaining+'轮')+(a.blocked?'（'+a.blocked+'）':''),()=>choose(a.id),!!a.blocked,a.finish||a.early?'yj-exit':'');if(s.step==='first')button(list,'结束第一轮 · 进入第二轮',()=>{const remaining=E.options(s).filter(a=>a.ttl&&!a.blocked);if(remaining.length&&!root.confirm('还有未探索入口，进入第二轮将关闭它们。确定继续？'))return;perform({type:'next',confirm:true},'进入第二轮');});text(dialog,'h3','行囊');text(dialog,'p',s.inventory.join('、')||'尚空');if(s.receipt)text(dialog,'p',s.receipt.type+'，推进'+s.receipt.days+'日（测试值）。'+E.date(s.receipt.from)+' → '+E.date(s.receipt.to));text(dialog,'h3','本次足迹');text(dialog,'p',s.log.join(' → '));button(dialog,'重新读取',()=>refresh(true).then(story).catch(e=>{notice=e.message;render();}));text(dialog,'p','按钮只填入自然语言行动，不自动发送。自由活动请在酒馆输入框聊天。请勿在生成过程中切换节点。');}
open.onclick=async()=>{dialog.hidden=false;try{await refresh();}catch(e){notice=e.message;render();}};
function dispose(){if(disposed)return;disposed=true;clearPrompt();for(const f of cleanup)try{f();}catch(_){} }
const c=context(),events=c.event_types||root.tavern_events||root.TavernHelper?.tavern_events,source=c.eventSource;
function listen(name,handler){if(!source?.on||!events?.[name])return false;const event=events[name];source.on(event,handler);cleanup.push(()=>source.removeListener?.(event,handler));return true;}
async function story(){if(disposed||busy||!isCard()||root.is_send_press||context().isGenerating)return;busy=true;try{const id=context().chat.length-1;const v=await controller.read();if(v.saved){const r=await controller.mutate({type:'story',id});current=r.value;inject(current.state);notice='故事回复已记录，剩余轮数已刷新；世界日期不变。';}}catch(e){notice='回复计数未完成：'+e.message;}finally{busy=false;render();}}
const connected=listen('MESSAGE_RECEIVED',()=>{root.setTimeout(story,100);});listen('GENERATION_ENDED',()=>root.setTimeout(story,150));for(const name of ['CHAT_CHANGED','MESSAGE_SWIPED','MESSAGE_DELETED'])listen(name,()=>root.setTimeout(()=>refresh(true).catch(e=>{notice=e.message;render();}),100));
if(!connected)notice='未找到有效回复事件，暂不能自动计轮；请回报酒馆版本。';
const timer=root.setInterval(()=>{try{if(!isCard())dispose();}catch(_){dispose();}},1000);cleanup.push(()=>root.clearInterval(timer));
refresh().catch(e=>{notice=e.message;render();});
return {dispose,refresh,controller};
});
