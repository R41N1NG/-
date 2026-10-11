(function(host,factory){
 let root=host;try{if(host.parent?.document)root=host.parent;}catch(_){}
 root.__youjiguTest?.dispose?.();
 root.__youjiguTest=root.Function('root','return ('+factory.toString()+')(root);')(root);
})(window,function(root){
'use strict';
const E=root.YoujiguTest,create=root.createYoujiguController,service=root.__xsdMapCorrection,doc=root.document;
let busy=false,current=null,notice='选择一处地点，循路而行。',disposed=false,promptApi=null;
const cleanup=[];
function context(){const c=root.SillyTavern?.getContext?.();if(!c)throw Error('SillyTavern上下文不可用');return c;}
function isCard(){const c=context();return c.characters?.[c.characterId]?.name==='幽寂谷状态栏地图测试卡';}
function fn(name){for(const p of [root.TavernHelper,root])if(typeof p?.[name]==='function')return p[name].bind(p);throw Error('酒馆助手接口不可用：'+name);}
function guard(token,signature){if(disposed||!isCard())throw Error('已离开测试卡');const c=context();if(String(c.chatId??c.chat_id)!==token.chatId||c.chat.length-1!==token.messageId)throw Error('聊天或最新楼已变化，请重新读取');if(signature&&JSON.stringify(controller.fingerprint(c.chat))!==JSON.stringify(signature))throw Error('正文或分支已变化，请重新读取');}
const api={context,getVariables:o=>fn('getVariables')(o),updateVariablesWith:(f,o)=>fn('updateVariablesWith')(f,o)};
const controller=create(E,{context,capture:()=>{if(!isCard())throw Error('请打开幽寂谷状态栏地图测试卡');return service.capture(api);},guard,getVariables:api.getVariables,snapshot:t=>service.snapshot(api,t),transact:async build=>{
 const signature=controller.fingerprint(context().chat);
 const safeApi={...api,getVariables:async o=>{const t=service.capture(api);guard(t,signature);const v=await api.getVariables(o);guard(t,signature);return v;},updateVariablesWith:async(f,o)=>{const t=service.capture(api);guard(t,signature);const v=await api.updateVariablesWith(x=>{guard(t,signature);return f(x);},o);guard(t,signature);return v;}};
 return service.transact(safeApi,build);
}});
function setter(){const c=context();const f=c.setExtensionPrompt||root.setExtensionPrompt;if(typeof f!=='function')throw Error('当前酒馆不提供setExtensionPrompt，无法注入当前步骤；请回报版本');return f.bind(c);}
function inject(s){promptApi=setter();promptApi('youjigu-map-test',controller.prompt(s,current?.pending),1,0,false,0);}
function clearPrompt(){try{promptApi?.('youjigu-map-test','',1,0,false,0);}catch(_){} }
if(!isCard())return {dispose(){},refresh:async()=>{}};
const style=doc.createElement('style');style.textContent=`#yj-map-dialog{position:fixed;z-index:100000;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;padding:4vw;box-sizing:border-box}#yj-map-dialog[hidden]{display:none}#yj-map-dialog .yj-atlas{position:relative;width:min(100%,1100px);line-height:0;box-shadow:0 8px 45px #0008}#yj-map-dialog .yj-map{display:block;width:100%;height:auto}#yj-map-dialog .yj-pin{position:absolute;left:46%;top:54%;transform:translate(-50%,-50%);width:44px;height:44px;padding:0;border:0;background:transparent;color:#252d23;cursor:pointer}#yj-map-dialog .yj-pin::before{content:'';display:block;width:11px;height:11px;border:2px solid #eee0b5;border-radius:50%;background:#345748;margin:auto;box-shadow:0 1px 4px #0009}#yj-map-dialog .yj-pin span{position:absolute;top:35px;left:50%;transform:translateX(-50%);white-space:nowrap;font:12px/1.5 serif;background:#f4ecd2d9;padding:0 4px;border-radius:2px}#yj-map-dialog .yj-pin:focus-visible{outline:2px solid #fff;border-radius:50%}`;
doc.head.append(style);cleanup.push(()=>style.remove());
const bound=new Set();function bind(container){if(!container?.querySelector||!isCard())return;const panel=container.querySelector('[data-xds-panel]')||container;if(panel.querySelector('[data-youjigu-map]'))return;const d=container.ownerDocument||doc,b=d.createElement('button');b.setAttribute('data-youjigu-map','1');b.textContent='地图';b.style.cssText='margin-left:12px;padding:6px 14px;border:1px solid #bfa675;border-radius:6px;background:#203d35;color:#fff0c5;cursor:pointer;min-height:36px';b.onclick=()=>{dialog.hidden=false;refresh().catch(e=>{notice=e.message;render();});};(panel.querySelector('.xh-title')||panel).appendChild(b);bound.add(b);}
const dialog=doc.createElement('section');dialog.id='yj-map-dialog';dialog.hidden=true;doc.body.append(dialog);cleanup.push(()=>dialog.remove());
const names={map:'南疆 · 地图',first:'幽寂谷 · 谷口岔路',cave:'探索洞府',stream:'探索山涧',second:'幽寂谷 · 谷中岔路',valley:'探索山谷',secret:'探索密室',done:'幽寂谷 · 结算完成'};
function text(parent,tag,value,cls){const n=doc.createElement(tag);n.textContent=value;if(cls)n.className=cls;parent.append(n);return n;}
function button(parent,label,task,disabled=false,cls=''){const b=text(parent,'button',label,cls);b.disabled=disabled||busy;b.onclick=task;return b;}
function fillInput(label){const input=doc.getElementById('send_textarea');if(!input){notice='已保存步骤，但输入框不存在。请手动输入当前行动。';return;}input.value=label;input.dispatchEvent(new root.Event('input',{bubbles:true}));input.focus();}
async function refresh(restore=false){if(disposed)return;if(!isCard()){dispose();return;}const v=await controller.read();current=v.saved;if(restore&&current){await controller.mutate({type:'restore'});current=(await controller.read()).saved;}inject(current?.state);render();}
async function perform(intent,label){if(busy)return;busy=true;render();try{setter();if(root.is_send_press||context().isGenerating)throw Error('正在生成，请等回复完成再点节点');const r=await controller.mutate({...intent,revision:current?.revision,expectedChatId:current?.chatId,expectedBranch:current?.branch});current=r.value;inject(current.state);notice=current.pending?'你准备'+label+'。回到对话中继续这次行动。':'行程已更新。';const a=E.defs[intent.id];if(a?.reward&&!current.pending)notice+='\n获得：'+a.reward;if(a?.group&&!current.pending)notice+='\n另一处机关已无法开启。';if(a?.to==='first')notice+='\n已返回第一轮，未过期入口仍可选择。';if(a?.finish||a?.early)notice+='\n事件已结束，日期按回执推进。';if(current.pending||intent.type==='next')dialog.hidden=true;if(intent.type==='action'||intent.type==='next')fillInput(current.state.step==='done'?'请仅根据事件结算回执总结本次幽寂谷探索，不继续故事。':label);}
catch(e){notice='操作未完成：'+e.message;try{current=(await controller.read()).saved;inject(current?.state);}catch(_){} }
finally{busy=false;render();}}
function choose(id){const s=current.state,a=E.defs[id];if(a.finish||a.early){const n=a.early?E.config.earlyDays:E.config.completeDays;if(!root.confirm('确定'+a.label+'？\n本次行程将结束，经过'+n+'日。\n'+E.date(s.stamp)+' → '+E.date(s.stamp+n)+'\n保留物品：'+(s.inventory.join('、')||'无')))return;}perform({type:'action',id,confirm:true},a.label);}
function render(){dialog.replaceChildren();const wrap=text(dialog,'div','','yj-atlas');const im=doc.createElement('img');im.src='MAP_DATA';im.alt='南疆地图';im.className='yj-map';wrap.append(im);const s=current?.state;if(s&&s.stamp>=E.open&&s.stamp<=E.close&&s.step!=='done'){const pin=button(wrap,'',()=>{if(s.step==='map'&&!current.pending)choose('g7p2');else {dialog.hidden=true;doc.getElementById('send_textarea')?.focus();}},false,'yj-pin');pin.setAttribute('aria-label','幽寂谷');text(pin,'span','幽寂谷');}}
dialog.onclick=e=>{if(e.target===dialog)dialog.hidden=true;};
const escape=e=>{if(e.key==='Escape')dialog.hidden=true;};doc.addEventListener?.('keydown',escape);cleanup.push(()=>doc.removeEventListener?.('keydown',escape));
async function initialize(){const v=await controller.read();if(v.saved)return;const vars=await api.getVariables({type:'chat'});const stat=vars?.stat_data||{};const blocks=context().chat.map(m=>String(m.mes||'')).join('\n');const identity=stat.身份||Array.from(blocks.matchAll(/<身份>([^<]+)<\/身份>/g)).at(-1)?.[1];const date=String(stat.仙盟历文||blocks).match(/1578年\s*(\d+)月\s*(\d+)日/);if(!identity||!date)return;await controller.mutate({type:'start',identity,month:Number(date[1]),day:Number(date[2])});}
async function sent(){if(disposed||busy||!isCard())return;await refresh();if(!current||current.pending)return;const m=context().chat.at(-1);if(!m?.is_user)return;const body=String(m.mes||'').trim();const a=E.options(current.state).find(a=>!a.blocked&&(body===a.label||body==='我要'+a.label||body==='我'+a.label));if(a){const def=E.defs[a.id];if((def.finish||def.early)&&!root.confirm('确定离开幽寂谷并结束本次行程？'))return;const r=await controller.mutate({type:'action',id:a.id,confirm:true});current=r.value;inject(current.state);}else if(current.state.step==='first'&&/^(继续深入|继续深入幽寂谷)$/.test(body)){if(!root.confirm('确定继续深入，不再返回当前岔路？'))return;const r=await controller.mutate({type:'next',confirm:true});current=r.value;inject(current.state);}render();}
function dispose(){if(disposed)return;disposed=true;clearPrompt();for(const b of bound)try{b.remove();}catch(_){}for(const f of cleanup)try{f();}catch(_){} }
const c=context(),events=c.event_types||root.tavern_events||root.TavernHelper?.tavern_events,source=c.eventSource;
function listen(name,handler){if(!source?.on||!events?.[name])return false;const event=events[name];source.on(event,handler);cleanup.push(()=>source.removeListener?.(event,handler));return true;}
async function story(){if(disposed||busy||!isCard()||root.is_send_press||context().isGenerating)return;busy=true;try{const id=context().chat.length-1;const v=await controller.read();if(v.saved){const r=await controller.mutate({type:'story',id});current=r.value;inject(current.state);notice=current.pending?'你准备'+current.pending.label+'，等待这次行动的结果。':'山风未歇，你仍可选择下一步去向。';}}catch(e){notice='回复计数未完成：'+e.message;}finally{busy=false;render();}}
listen('MESSAGE_SENT',()=>sent().catch(e=>console.error('[幽寂谷行动]',e)));
const connected=listen('MESSAGE_RECEIVED',()=>{root.setTimeout(story,100);});listen('GENERATION_ENDED',()=>root.setTimeout(story,150));for(const name of ['CHAT_CHANGED','MESSAGE_SWIPED','MESSAGE_DELETED'])listen(name,()=>root.setTimeout(()=>refresh(true).catch(e=>{notice=e.message;render();}),100));
if(!connected)notice='未找到有效回复事件，暂不能自动计轮；请回报酒馆版本。';
function bindAll(){for(const d of [doc,...Array.from(doc.querySelectorAll?.('iframe')||[]).map(f=>{try{return f.contentDocument;}catch(_){return null;}})])try{for(const p of d?.querySelectorAll?.('[data-xds-panel]')||[])bind(p);}catch(_){}}
bindAll();const timer=root.setInterval(()=>{try{if(!isCard())dispose();else bindAll();}catch(_){dispose();}},1000);cleanup.push(()=>root.clearInterval(timer));
initialize().then(()=>refresh()).catch(e=>{console.error('[幽寂谷地图]',e);render();});
return {dispose,refresh,controller,bind};
});
