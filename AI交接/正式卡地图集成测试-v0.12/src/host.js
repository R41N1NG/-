(function(host,factory){
 let root=host;try{if(host.parent?.document)root=host.parent;}catch(_){}
 root.__youjiguTest?.dispose?.();
 root.__youjiguTest=root.Function('root','return ('+factory.toString()+')(root);')(root);
})(window,function(root){
'use strict';
const E=root.YoujiguTest,create=root.createYoujiguController,service=root.__xsdCorrection,doc=root.document;
let generating=false,replaying=false,aborted=false,busy=false,current=null,notice='选择一处地点，循路而行。',disposed=false,promptApi=null;
const cleanup=[];
function context(){const c=root.SillyTavern?.getContext?.();if(!c)throw Error('SillyTavern上下文不可用');return c;}
function isCard(){const c=context();return c.characters?.[c.characterId]?.name==='仙姝堕·地图集成测试';}
function fn(name){for(const p of [root.TavernHelper,root])if(typeof p?.[name]==='function')return p[name].bind(p);throw Error('酒馆助手接口不可用：'+name);}
function guard(token,signature){if(disposed||!isCard())throw Error('已离开测试卡');const c=context();if(String(c.getCurrentChatId?.()??c.chatId??c.chat_id)!==token.chatId||c.chat.length-1!==token.messageId)throw Error('聊天或最新楼已变化，请重新读取');if(signature&&JSON.stringify(controller.fingerprint(c.chat))!==JSON.stringify(signature))throw Error('正文或分支已变化，请重新读取');}
const api={context,getVariables:o=>fn('getVariables')(o),updateVariablesWith:(f,o)=>fn('updateVariablesWith')(f,o)};
const controller=create(E,{worldPatch,context,initialPlace:name=>/<地点>([^<]+)<\/地点>/.exec(root.YoujiguProfiles?.[name]?.greeting||'')?.[1],initialRealm:name=>/<修为>([^<]+)<\/修为>/.exec(root.YoujiguProfiles?.[name]?.greeting||'')?.[1],initialInventory:name=>root.YoujiguProfiles?.[name]?.inventory||[],profile:name=>root.YoujiguProfiles?.[name]?.content||'',capture:()=>{if(!isCard())throw Error('请打开仙姝堕·地图集成测试');return service.capture(api);},guard,getVariables:api.getVariables,snapshot:t=>service.snapshot(api,t),transact:async build=>{
 const signature=controller.fingerprint(context().chat);
 const safeApi={...api,getVariables:async o=>{const t=service.capture(api);guard(t,signature);const v=await api.getVariables(o);guard(t,signature);return v;},updateVariablesWith:async(f,o)=>{const t=service.capture(api);guard(t,signature);const v=await api.updateVariablesWith(x=>{guard(t,signature);return f(x);},o);guard(t,signature);return v;}};
 return service.transact(safeApi,build);
}});

function active(s=current?.state){return !!s&&!['map','done'].includes(s.step);}
function eventFloor(s=current){return active(s?.state)||!!s?.pending||s?.lastAction?.replyId===context().chat.length-1;}
function worldPatch(state,base,intent,saved){
 const sd=base.sd||{},patch={known:{map_youjigu:!!state.known.map_youjigu}};
 // Each transaction owns only event-sourced items; retain formal possessions and unrelated gains.
 const source=Array.isArray(sd.inventory)?sd.inventory:(state.baseInventory||[]);
 const ownsItems=active(state)||!!saved?.pending||saved?.lastAction?.replyId===context().chat.length-1||intent.type==='rollbackAction';
 if(ownsItems)patch.inventory=[...source.filter(x=>x.source!=='youjigu'),...state.inventory.map(name=>({id:name,name,count:1,source:'youjigu',desc:'幽寂谷探索所得。',full:'幽寂谷探索所得。'}))];
 const ownsClock=active(state)||!!saved?.pending||saved?.lastAction?.replyId===context().chat.length-1||intent.type==='rollbackAction';
 if(ownsClock){
  const y=Math.floor(state.stamp/360),rest=state.stamp-y*360,m=Math.floor(rest/30)+1,d=rest%30+1;
  const basis=Number.isFinite(Number(sd.历基准))?Number(sd.历基准):state.stamp/30;
  Object.assign(patch,{仙盟历:Math.round((y+m/100+(d-1)/30*.005)*10000)/10000,仙盟历文:`${y}年${m}月${d}日`,历基准:basis,历时累计:state.stamp/30-basis,本楼历时加速:0,历时:'无'});
 }
 return patch;
}
async function syncWorld(){
 const vars=await api.getVariables({type:'chat'}),sd=vars?.stat_data||{};
 const date=calendar(sd.仙盟历文||'');const identity=Object.keys(root.YoujiguProfiles||{}).find(n=>String(sd.身份||'').includes(n));
 if(!date||!identity)return;const state={stamp:E.day(date.year,date.month,date.day),identity,realm:sd.修为||current.state.realm,initialPlace:sd.地点||current.state.initialPlace};
 if(Object.entries(state).some(([k,v])=>v!==current.state[k]))await controller.mutate({type:'syncWorld',state});
}
async function beforeStatus(id){
 if(disposed||!isCard())return {defer:false};
 if(generating||busy||aborted||root.is_send_press||context().isGenerating)return {defer:true};
 if(id!==context().chat.length-1)return {defer:true};
 await refresh(false);if(current&&(current.pending||active())&&!current.counted.includes(id))await story(0,true);
 return {defer:busy||generating};
}
function filterStatusPatch(draft,patch){
 if(!eventFloor())return patch;
 const copy=structuredClone(patch);
 // The formal planner still handles characters, display, milestones and stages.
 // This event alone supplies its exact date and reward ledger, including the exit floor.
 for(const k of ['仙盟历','仙盟历文','历基准','历时累计','本楼历时加速','历时','初始时点','时点加速','inventory','纳戒账本'])delete copy[k];
 return copy;
}

function setter(){const c=context();const f=c.setExtensionPrompt||root.setExtensionPrompt;if(typeof f!=='function')throw Error('当前酒馆不提供setExtensionPrompt，无法注入当前步骤；请回报版本');return f.bind(c);}
function inject(s){if(!s||(!current?.pending&&['map','done'].includes(s.step))){clearPrompt();return;}promptApi=setter();promptApi('youjigu-map-test',controller.prompt(s,current?.pending),1,0,false,0);}
function clearPrompt(){try{promptApi?.('youjigu-map-test','',1,0,false,0);}catch(_){} }
if(!isCard())return {dispose(){},refresh:async()=>{}};
const style=doc.createElement('style');style.textContent=`#yj-map-dialog{position:fixed;z-index:100000;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;padding:4vw;box-sizing:border-box}#yj-map-dialog[hidden]{display:none}#yj-map-dialog .yj-atlas{position:relative;width:min(100%,1100px);line-height:0;box-shadow:0 8px 45px #0008}#yj-map-dialog .yj-map{display:block;width:100%;height:auto}#yj-map-dialog .yj-pin{position:absolute;left:46%;top:54%;transform:translate(-50%,-50%);width:44px;height:44px;padding:0;border:0;background:transparent;color:#252d23;cursor:pointer}#yj-map-dialog .yj-pin::before{content:'';display:block;width:11px;height:11px;border:2px solid #eee0b5;border-radius:50%;background:#345748;margin:auto;box-shadow:0 1px 4px #0009}#yj-map-dialog .yj-pin span{position:absolute;top:35px;left:50%;transform:translateX(-50%);white-space:nowrap;font:12px/1.5 serif;background:#f4ecd2d9;padding:0 4px;border-radius:2px}#yj-map-dialog .yj-pin.yj-here::before{background:#a6662b;box-shadow:0 0 0 3px #fff5,0 1px 4px #0009}#yj-map-dialog .yj-pin:focus-visible{outline:2px solid #fff;border-radius:50%}`;
doc.head.append(style);cleanup.push(()=>style.remove());
const bound=new Set();function bind(container){if(!container?.querySelector||!isCard())return;const panel=container.querySelector('[data-xds-panel]')||container;if(panel.querySelector('[data-youjigu-map]'))return;const d=container.ownerDocument||doc,b=d.createElement('button');b.setAttribute('data-youjigu-map','1');b.textContent='地图';b.style.cssText='margin-left:12px;padding:6px 14px;border:1px solid #bfa675;border-radius:6px;background:#203d35;color:#fff0c5;cursor:pointer;min-height:36px';b.onclick=()=>{dialog.hidden=false;refresh(true).then(story).catch(e=>{notice=e.message;render();});};(panel.querySelector('.xh-title')||panel).appendChild(b);bound.add(b);}
const dialog=doc.createElement('section');dialog.id='yj-map-dialog';dialog.hidden=true;doc.body.append(dialog);cleanup.push(()=>dialog.remove());
function text(parent,tag,value,cls){const n=doc.createElement(tag);n.textContent=value;if(cls)n.className=cls;parent.append(n);return n;}
function button(parent,label,task,disabled=false,cls=''){const b=text(parent,'button',label,cls);b.disabled=disabled||busy;b.onclick=task;return b;}
function sendControls(){const input=doc.getElementById('send_textarea'),send=doc.getElementById('send_but');if(!input||!send||typeof send.click!=='function')throw Error('无法找到酒馆发送按钮');if(send.disabled||send.getAttribute?.('aria-disabled')==='true')throw Error('酒馆发送暂不可用');return {input,send};}
function forceSend(label,controls){controls.input.value=label;controls.input.dispatchEvent(new root.Event('input',{bubbles:true}));controls.input.focus();dialog.hidden=true;controls.send.click();}
async function refresh(restore=false){if(disposed)return;if(!isCard()){dispose();return;}let v=await controller.read();if(!v.saved){await initialize();v=await controller.read();}current=v.saved;if(current&&!current.pending&&['map','done'].includes(current.state.step)){await syncWorld();current=(await controller.read()).saved;}if(restore&&current){const orphan=current.pending&&!busy&&!generating&&!root.is_send_press&&!context().isGenerating&&!context().chat.slice(current.pending.floor+1).some(m=>m.is_user&&!m.is_system);await controller.mutate(orphan?{type:'rollbackAction',reason:'delete'}:{type:'restore'});current=(await controller.read()).saved;}inject(current?.state);render();}
async function perform(intent,label){if(busy)return;busy=true;render();let registered=false;try{setter();if(generating||root.is_send_press||context().isGenerating)throw Error('正在生成，请等本轮回复结束');if(current?.pending)throw Error('本轮行动尚未完成');const controls=sendControls();aborted=false;const r=await controller.mutate({...intent,revision:current?.revision,expectedChatId:current?.chatId,expectedBranch:current?.branch});current=r.value;registered=true;inject(current.state);guard(service.capture(api),current.branch);forceSend(label,controls);}
catch(e){report(e);if(registered){try{const last=context().chat.at(-1);if(!last?.is_user){const r=await controller.mutate({type:'cancel'});current=r.value;inject(current.state);}}catch(_){} }try{current=(await controller.read()).saved;}catch(_){} }
finally{busy=false;render();}}
function report(e){if(root.toastr?.warning)root.toastr.warning(e.message);else if(typeof root.alert==='function')root.alert(e.message);else console.error('[幽寂谷地图]',e);}
function choose(id){const s=current.state,a=E.defs[id];if(a.finish||a.early){const n=a.early?E.config.earlyDays:E.config.completeDays;if(!root.confirm('确定'+a.label+'？\n本次行程将结束，经过'+n+'日。\n'+E.date(s.stamp)+' → '+E.date(s.stamp+n)+'\n本次所得：'+(s.inventory.join('、')||'无')))return;}return perform({type:'action',id,confirm:true},a.label);}
const pins={g7p2:['幽寂谷',46,54],k4m8:['洞府',34,40],s9a3:['山涧',61,39],b8n2:['香炉',26,25],q3f7:['暗格',44,27],h5w9:['谷口',46,54],r2c6:['溪水',54,25],a6d4:['树丛',75,29],j8e1:['谷口',46,54],u9h3:['山谷',69,65],v4t7:['密室',37,72],n5z8:['草药',77,48],l7q2:['出口',83,76],p1x6:['左侧暗格',25,59],t6v4:['右侧暗格',45,88],e3j9:['出口',22,88],z8u5:['离谷',19,73]};
function mapNodes(s,pending){if(!s||s.stamp<E.open||s.stamp>E.close||s.step==='done')return [];const list=E.options(s).filter(a=>!a.blocked).map(a=>({id:a.id,pin:pins[a.id]}));if(s.step==='first'&&!E.options(s).some(a=>a.ttl&&!a.blocked))list.push({id:'next',pin:['谷中岔路',52,72]});return list.filter(n=>n.id!==pending?.id);}
function render(){dialog.replaceChildren();const wrap=text(dialog,'div','','yj-atlas');const im=doc.createElement('img');im.src='MAP_DATA';im.alt='南疆地图';im.className='yj-map';wrap.append(im);const s=current?.state;for(const node of mapNodes(s,current?.pending)){const here=node.id==='here',pending=current?.pending?.id===node.id;const pin=button(wrap,'',()=>{if(here||pending){dialog.hidden=true;doc.getElementById('send_textarea')?.focus();}else if(node.id==='next'){if(E.options(s).some(a=>a.ttl&&!a.blocked)&&!root.confirm('确定继续深入，不再返回当前岔路？'))return;return perform({type:'next',confirm:true},'继续深入幽寂谷');}else return choose(node.id);},!!current?.pending,'yj-pin'+(here?' yj-here':''));pin.style.left=node.pin[1]+'%';pin.style.top=node.pin[2]+'%';pin.setAttribute('aria-label',node.pin[0]);pin.setAttribute('data-yj-node',node.id);if(here)pin.setAttribute('aria-current','location');text(pin,'span',node.pin[0]);}}
dialog.onclick=e=>{if(e.target===dialog)dialog.hidden=true;};
const escape=e=>{if(e.key==='Escape')dialog.hidden=true;};doc.addEventListener?.('keydown',escape);cleanup.push(()=>doc.removeEventListener?.('keydown',escape));
function numberCN(value){if(/^\d+$/.test(value))return Number(value);const n={'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'廿':20,'卅':30};value=value.replace(/^初/,'');if(value==='十'||value==='二十'||value==='三十')return {'十':10,'二十':20,'三十':30}[value];if(value.includes('十')){const x=value.split('十');return (n[x[0]]||1)*10+(n[x[1]]||0);}if(value.startsWith('廿'))return 20+(n[value[1]]||0);return n[value];}
function calendar(text){const m=String(text).match(/(\d{4})\s*年[\s·]*(\d+|[一二三四五六七八九十]+)\s*月[\s·]*(\d+|初[一二三四五六七八九十]+|[一二三四五六七八九十廿卅]+)(?:\s*日)?/);if(!m)return null;const date={year:Number(m[1]),month:numberCN(m[2]),day:numberCN(m[3])};if(!Number.isInteger(date.month)||!Number.isInteger(date.day)||date.month<1||date.month>12||date.day<1||date.day>30)return null;return date;}
async function initialize(){const v=await controller.read();if(v.saved)return;const blocks=context().chat.map(m=>String(m.mes||'')).join('\n');if(String(context().chat[0]?.mes||'').includes('<IdentityMenu'))return;const vars=await api.getVariables({type:'chat'});const stat=vars?.stat_data||{};const raw=Array.from(blocks.matchAll(/<身份>([^<]+)<\/身份>/g)).at(-1)?.[1]||stat.身份;const identity=Object.keys(root.YoujiguProfiles||{}).find(name=>String(raw||'').includes(name));const latestTime=Array.from(blocks.matchAll(/<时间>([^<]+)<\/时间>/g)).at(-1)?.[1];const date=calendar(latestTime||stat.仙盟历文||'');if(!identity||!date)return;await controller.mutate({type:'start',identity,year:date.year,month:date.month,day:date.day,realm:stat.修为||undefined,place:stat.地点||undefined});}
async function sent(){if(disposed||busy||!isCard())return;await refresh();if(!current)return;const m=context().chat.at(-1);if(!m?.is_user)return;const body=String(m.mes||'').trim();if(current.pending){if(/^(取消这次行动|放弃这次行动|取消行动)$/.test(body)){const r=await controller.mutate({type:'cancel'});current=r.value;inject(current.state);render();}return;}const a=E.options(current.state).find(a=>!a.blocked&&(body===a.label||body==='我要'+a.label||body==='我'+a.label));if(a){const def=E.defs[a.id];if((def.finish||def.early)&&!root.confirm('确定离开幽寂谷并结束本次行程？'))return;const r=await controller.mutate({type:'action',id:a.id,confirm:true});current=r.value;inject(current.state);}else if(current.state.step==='first'&&/^(继续深入|继续深入幽寂谷)$/.test(body)){if(!root.confirm('确定继续深入，不再返回当前岔路？'))return;const r=await controller.mutate({type:'next',confirm:true});current=r.value;inject(current.state);}render();}
function dispose(){if(disposed)return;disposed=true;clearPrompt();for(const b of bound)try{b.remove();}catch(_){}for(const f of cleanup)try{f();}catch(_){} }
const c=context(),events=c.eventTypes||c.event_types||root.tavern_events||root.TavernHelper?.tavern_events,source=c.eventSource;
function listen(name,handler){if(!source?.on||!events?.[name])return false;const event=events[name];source.on(event,handler);cleanup.push(()=>source.removeListener?.(event,handler));return true;}
async function story(attempt=0,fromStatus=false){if(disposed||aborted||!isCard())return;if(busy||generating||root.is_send_press||context().isGenerating){if(attempt<20)root.setTimeout(()=>story(attempt+1),250);return;}busy=true;try{const id=context().chat.length-1;const v=await controller.read();if(v.saved){const m=context().chat[id];if(id>0&&(v.saved.pending||!['map','done'].includes(v.saved.state.step))&&!v.saved.counted.includes(id)&&m&&!m.is_user&&(!v.saved.pending||id>v.saved.pending.floor)){const user=!v.saved.pending||context().chat.slice(v.saved.pending.floor+1,id).some(x=>x.is_user&&!x.is_system);if(user){const body=controller.canonical(m.mes,v.saved.pending,v.saved.state);if(body!==m.mes){await fn('setChatMessages')([{message_id:id,message:body}],{refresh:'affected'});}}}if(m?.is_user&&v.saved.pending){const undone=await controller.mutate({type:'rollbackAction',reason:'stop'});current=undone.value;inject(current.state);return;}const r=await controller.mutate({type:'story',id});current=r.value;inject(current.state);notice=current.pending?'你准备'+current.pending.label+'，等待这次行动的结果。':'山风未歇，你仍可选择下一步去向。';}}catch(e){notice='回复计数未完成：'+e.message;}finally{busy=false;render();if(!fromStatus&&context().chat.length>1)root.setTimeout(()=>root.__xsdDispatcher?.onAiMessageReceived?.(context().chat.length-1,{source:'地图结算后'}),50);}}
listen('MESSAGE_SENT',()=>sent().catch(e=>console.error('[幽寂谷行动]',e)));
async function undoPending(reason='delete',attempt=0){if(disposed||!isCard())return;if(busy){if(attempt<20)root.setTimeout(()=>undoPending(reason,attempt+1),100);return;}busy=true;try{const restored=await controller.mutate({type:'rollbackAction',reason});current=restored.value;inject(current?.state);}catch(e){report(e);}finally{busy=false;render();}}
const connected=listen('MESSAGE_RECEIVED',()=>{root.setTimeout(story,100);});listen('GENERATION_ENDED',()=>{generating=false;replaying=false;root.setTimeout(story,150);});listen('GENERATION_STARTED',async(type,options,dryRun)=>{if(dryRun)return;generating=true;aborted=false;if(type==='regenerate'||type==='swipe'){replaying=true;aborted=false;const v=await controller.read();if(v.saved?.lastAction?.replyId===context().chat.length-1){const selected=v.saved.lastAction;const before=structuredClone(selected.before);const staged=selected.id==='next'?{state:before}:E.reserve(before,selected.id);current={...v.saved,state:staged.state,pending:{...selected},counted:[...(selected.countedBefore||[])]};inject(current.state);}else {current=v.saved;inject(current?.state);}}});listen('GENERATION_STOPPED',()=>{generating=false;replaying=false;aborted=true;root.setTimeout(()=>undoPending('stop'),100);});listen('MESSAGE_DELETED',()=>{if(!replaying){aborted=true;root.setTimeout(()=>undoPending('delete'),100);}});for(const name of ['CHAT_CHANGED','MESSAGE_SWIPED'])listen(name,()=>{aborted=false;root.setTimeout(()=>refresh(true).then(story).catch(e=>{notice=e.message;render();}),100);});
if(!connected)notice='未找到有效回复事件，暂不能自动计轮；请回报酒馆版本。';
function bindAll(){for(const d of [doc,...Array.from(doc.querySelectorAll?.('iframe')||[]).map(f=>{try{return f.contentDocument;}catch(_){return null;}})])try{for(const p of d?.querySelectorAll?.('[data-xds-panel]')||[])bind(p);}catch(_){}}
bindAll();const timer=root.setInterval(()=>{try{if(!isCard())dispose();else bindAll();}catch(_){dispose();}},1000);cleanup.push(()=>root.clearInterval(timer));
initialize().then(()=>refresh()).catch(e=>{console.error('[幽寂谷地图]',e);render();});
return {dispose,refresh,controller,bind,mapNodes,calendar,beforeStatus,filterStatusPatch};
});
