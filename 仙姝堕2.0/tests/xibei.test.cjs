'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const C=require('../src/runtime/contracts'),data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
const {createDispatcher}=require('../src/runtime/dispatcher'),{createXibeiPlugin,EVENT_DEFS}=require('../src/plugins/xibei'),map=require('../src/plugins/youjigu_map');
const {managedEnabled}=require('../src/runtime/story_entries');
function harness({wrap=t=>t}={}){
 const chat=[{mes:'<IdentityMenu/>',variables:[]}],sent=[];let fail=false,confirmed=true,retries=0,checkpoint=null;
 const adapter={readCheckpoint:async()=>C.clone(checkpoint),context:()=>({chatId:'xibei-test',chat}),readMessage:async i=>C.clone(chat[i]?.variables?.[0] || {}),persist:async(c,e)=>{checkpoint=C.clone(e);chat[c.floor].variables=[{stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}}];},replaceOpening:async t=>chat[0].mes=t,replaceStory:async(i,t)=>chat[i].mes=t,send:async t=>{if(fail)throw Error('发送失败');sent.push(t);chat.push({mes:wrap(t),is_user:true});},setPrompt:()=>{},report:()=>{},retryGeneration:()=>{retries++;},confirmExit:async()=>confirmed};
 const r=createDispatcher(adapter,data),plugin=createXibeiPlugin(data.nodeStories,data.characterProfiles,data.promotionDefinitions);r.registerPlugin(plugin);r.registerPlugin(map);
 const click=id=>{const s=r.getSnapshot();return r.dispatchIntent({type:'SELECT_NODE',pluginId:'xibei',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:id}});};
 const reply=async text=>{chat.push({mes:text,is_user:false,swipe_id:0});await r.settleStory();};
 const step=()=>r.getSnapshot().pluginState.xibei?.step || 'map';
 const run=async id=>{await click(id);await reply('你与孤月完成本次行动。<Status_block><历时>99日</历时><纳戒>无</纳戒></Status_block>');};
 const report=answer=>'<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">'+answer+'</Promotion_result>';
 const open=async()=>r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'赵无忧'}});
 const respond=async()=>{chat.push({mes:'我出手回应偷袭',is_user:true});await reply('你已经向孤月伸出援手。');};
 return {r,plugin,chat,sent,click,reply,step,run,report,open,respond,fail:v=>fail=v,confirm:v=>confirmed=v,retries:()=>retries};
}
test('西北链身份/日期/顺序与其他事件隔离，全部可执行节点绑定故事',async()=>{
 const h=harness();await h.open();assert.equal(h.plugin.list(h.r.getSnapshot())[0].id,'xbxxEnter');
 for(const d of Object.values(EVENT_DEFS))assert.ok(data.nodeStories[d.id]?.content);
 await assert.rejects(h.click('xbxxLoot'),/尚未到达/);
 for(const identity of ['自设','焚欲殿主']){const s={...h.r.getSnapshot(),identity};assert.equal(h.plugin.select(s,'xbxxEnter').allowed,false);}
 assert.equal(h.plugin.select({...h.r.getSnapshot(),calendarDate:{year:1578,month:2,day:30}},'xbxxEnter').allowed,false);
 assert.equal(h.plugin.select({...h.r.getSnapshot(),calendarDate:{year:1580,month:1,day:1}},'xbxxEnter').allowed,true);
 assert.equal(h.plugin.select({...h.r.getSnapshot(),activeEvent:{pluginId:'youjigu_map'}},'xbxxEnter').allowed,false);
});
test('获书固定奖励/锚点一次落账，当前故事/区域门禁受控，提前离开结算6日',async()=>{
 const h=harness();await h.open();const start=C.day(h.r.getSnapshot().calendarDate);
 await h.run('xbxxEnter');assert.equal(h.step(),'hall');assert.equal(h.r.getSnapshot().stat_data.active_area,'西北荒漠石山邪窟');assert.equal(C.day(h.r.getSnapshot().calendarDate),start);
 await h.run('xbxxFight');await h.click('xbxxLoot');assert.equal(h.r.getSnapshot().known.极乐引入手,true);assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='极乐引').count,1);
 assert.equal(managedEnabled('【节点故事】xbxxLoot',h.r.getSnapshot().stat_data),true);assert.equal(managedEnabled('【节点故事】xbxxAmbush',h.r.getSnapshot().stat_data),false);
 await h.reply('孤月将极乐引交给你。<Status_block><纳戒>获得：极乐引×1</纳戒></Status_block>');assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='极乐引').count,1);
 await assert.rejects(h.click('xbxxLoot'),/尚未到达/);await h.run('xbxxLeave');assert.equal(C.day(h.r.getSnapshot().calendarDate),start+6);assert.equal(h.step(),'done');assert.equal(Object.values(h.r.getSnapshot().settlements).at(-1).rewards[0].name,'极乐引');assert.equal(h.r.getSnapshot().activeEvent,null);assert.equal(h.r.getSnapshot().stat_data.active_area,'');
 await h.r.restore();await h.r.settleStory();assert.equal(C.day(h.r.getSnapshot().calendarDate),start+6);await assert.rejects(h.click('xbxxEnter'),/结束/);
});
test('救护是/否绑定本次ID、自由回应先于判定、互斥路线及10日结算',async()=>{
 for(const answer of ['是','否']){
  const h=harness();await h.open();const start=C.day(h.r.getSnapshot().calendarDate);
  for(const id of ['xbxxEnter','xbxxFight','xbxxLoot','xbxxAmbush'])await h.run(id);
  await assert.rejects(h.click('xbxxJudge'),/自由输入/);assert.equal(h.step(),'ambush');await h.respond();await h.click('xbxxJudge');
  await h.reply('<Promotion_result id="wrong">是</Promotion_result>');assert.equal(h.step(),'ambush');await h.click('xbxxJudge');await h.reply(h.report(answer));
  const route=answer==='是'?'xbxxCure':'xbxxDodge';assert.equal(h.step(),answer==='是'?'rescue':'dodge');await assert.rejects(h.click(answer==='是'?'xbxxDodge':'xbxxCure'),/分支/);
  await h.run(route);await h.run('xbxxFinishA');assert.equal(C.day(h.r.getSnapshot().calendarDate),start+10);await h.r.settleStory();await h.r.restore();assert.equal(C.day(h.r.getSnapshot().calendarDate),start+10);
  assert.equal(h.r.getSnapshot().stat_data.character_metrics.孤月.好感度,answer==='是'?15:5);assert.equal(h.r.getSnapshot().stat_data.character_stages.孤月.id,'stage01');assert.notEqual(h.r.getSnapshot().known['九幽玄阴穴成形'],true);
 }
});
test('焚巢10日、取消退出/发送失败不扣时不改状态，停止与删楼可恢复',async()=>{
 const h=harness();await h.open();const start=C.day(h.r.getSnapshot().calendarDate);h.fail(true);await assert.rejects(h.click('xbxxEnter'),/发送失败/);assert.equal(h.step(),'map');h.fail(false);
 for(const id of ['xbxxEnter','xbxxFight','xbxxLoot'])await h.run(id);h.confirm(false);await h.click('xbxxFinishB');assert.equal(h.step(),'fork');assert.equal(C.day(h.r.getSnapshot().calendarDate),start);
 h.confirm(true);await h.click('xbxxFinishB');assert.equal(C.day(h.r.getSnapshot().calendarDate),start+10);await h.r.stop();assert.equal(C.day(h.r.getSnapshot().calendarDate),start);assert.equal(h.step(),'fork');h.chat.pop();await h.r.restore();await h.run('xbxxFinishB');assert.equal(C.day(h.r.getSnapshot().calendarDate),start+10);
 h.chat.pop();await h.r.restore();assert.ok(h.r.getSnapshot().pending);await h.reply('你与孤月归宗。');assert.equal(C.day(h.r.getSnapshot().calendarDate),start+10);
});
test('西北入口与判定/完成按钮真实弹窗派发中控，历史由HUD统一只读',async()=>{
 const {JSDOM}=require('jsdom'),d=new JSDOM('<body><div id="slot"></div></body>'),doc=d.window.document;d.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};d.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new d.window.Event('close'));};
 const h=harness();await h.open();const calls=[],runtime={getSnapshot:()=>h.r.getSnapshot(),dispatchIntent:async i=>calls.push(i)};
 const dispose=h.plugin.mount(doc.querySelector('#slot'),runtime);doc.querySelector('[data-xibei]').click();doc.querySelector('[data-xibei-node="xbxxEnter"]').click();await new Promise(r=>setImmediate(r));assert.equal(calls[0].pluginId,'xibei');assert.equal(calls[0].payload.nodeId,'xbxxEnter');assert.equal(doc.querySelector('dialog'),null);dispose();assert.equal(doc.querySelector('[data-xibei]'),null);d.window.close();
});

test('删除救护结算回复恢复待判定，重试复用原用户指令，改否只开放险避',async()=>{
 const h=harness();await h.open();for(const id of ['xbxxEnter','xbxxFight','xbxxLoot','xbxxAmbush'])await h.run(id);await h.respond();await h.click('xbxxJudge');await h.reply(h.report('是'));assert.equal(h.step(),'rescue');
 h.chat.pop();for(const m of h.chat)m.variables=[];await h.r.restore();assert.equal(h.step(),'ambush');assert.ok(h.r.getSnapshot().pending);const s=h.r.getSnapshot(),code=s.pending.actionCode,count=h.sent.length;
 await h.r.dispatchIntent({type:'RETRY_COMPLETION',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision}});assert.equal(h.retries(),1);assert.equal(h.sent.length,count);assert.equal(h.r.getSnapshot().pending.actionCode,code);
 await h.reply(h.report('否'));assert.equal(h.step(),'dodge');await assert.rejects(h.click('xbxxCure'),/分支/);
});

test('覆巢好感按路线一次结算，封顶不越阶，获书后储物栏已持有秘籍',async()=>{
 for(const route of ['rescue','dodge']){
  const h=harness();await h.open();for(const id of ['xbxxEnter','xbxxFight','xbxxLoot','xbxxAmbush'])await h.run(id);
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='极乐引').count,1);await h.respond();await h.click('xbxxJudge');await h.reply(h.report(route==='rescue'?'是':'否'));await h.run(route==='rescue'?'xbxxCure':'xbxxDodge');
  await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'孤月',key:'好感度',value:19}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['metric.孤月.好感度']}});
  await h.run('xbxxFinishA');assert.equal(h.r.getSnapshot().stat_data.character_metrics.孤月.好感度,20);await h.r.restore();await h.r.settleStory();assert.equal(h.r.getSnapshot().stat_data.character_metrics.孤月.好感度,20);assert.equal(h.r.getSnapshot().stat_data.favor_log.孤月[0].delta,1);
 }
});

test('覆巢归宗在原面板确认：取消可重试、确认只发送一次、结算后不再重开入口',async()=>{
 const {JSDOM}=require('jsdom'),{confirmExit}=require('../src/ui/exit_confirmation'),dom=new JSDOM('<body><div id="slot"></div></body>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const h=harness();await h.open();for(const id of ['xbxxEnter','xbxxFight','xbxxLoot','xbxxAmbush'])await h.run(id);await h.respond();await h.click('xbxxJudge');await h.reply(h.report('否'));await h.run('xbxxDodge');
 const start=C.day(h.r.getSnapshot().calendarDate),sent=h.sent.length;
 const adapterConfirm=async n=>confirmExit(doc,n);
 // Exercise the real dispatcher, not a stubbed successful UI click.
 const oldCheckpoint=h.r.getCheckpoint(),chat=h.chat;
 const adapter={context:()=>({chatId:'xibei-test',chat}),readMessage:async i=>C.clone(chat[i]?.variables?.[0]||{}),readCheckpoint:async()=>C.clone(oldCheckpoint),persist:async(c,e)=>{chat[c.floor].variables=[{stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}}];},send:async t=>{h.sent.push(t);chat.push({mes:t,is_user:true});},replaceStory:async(i,t)=>{chat[i].mes=t;},confirmExit:adapterConfirm,setPrompt:()=>{}};
 const r=createDispatcher(adapter,data),plugin=createXibeiPlugin(data.nodeStories,data.characterProfiles,data.promotionDefinitions);r.registerPlugin(plugin);await r.ready();
 const dispose=plugin.mount(doc.querySelector('#slot'),r);doc.querySelector('[data-xibei]').click();doc.querySelector('[data-xibei-node="xbxxFinishA"]').click();
 const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();assert.equal(doc.querySelectorAll('dialog').length,1);assert.match(doc.querySelector('[data-xsd2-exit-confirm]').textContent,/10日/);
 doc.querySelector('[data-exit-cancel]').click();await tick();assert.equal(h.sent.length,sent);assert.equal(C.day(r.getSnapshot().calendarDate),start);assert.equal(doc.querySelector('[data-xibei-node="xbxxFinishA"]').disabled,false);assert.match(doc.querySelector('dialog').textContent,/已取消/);
 doc.querySelector('[data-xibei-node="xbxxFinishA"]').click();await tick();const yes=doc.querySelector('[data-exit-confirm]');yes.click();yes.click();await tick();assert.equal(h.sent.length,sent+1);assert.equal(r.getSnapshot().pending.nodeId,'xbxxFinishA');assert.equal(C.day(r.getSnapshot().calendarDate),start+10);assert.equal(doc.querySelector('dialog'),null);
 chat.push({mes:'你与孤月回到山门复命。<Status_block><历时>10日</历时></Status_block>',is_user:false});await r.settleStory();assert.equal(r.getSnapshot().pending,null);assert.equal(r.getSnapshot().pluginState.xibei.step,'done');assert.equal(r.getSnapshot().stat_data.character_metrics.孤月.好感度,5);await r.restore();assert.equal(r.getSnapshot().pluginState.xibei.step,'done');assert.equal(C.day(r.getSnapshot().calendarDate),start+10);
 dispose();const unmount=plugin.mount(doc.querySelector('#slot'),r);assert.equal(doc.querySelector('[data-xibei]'),null);unmount();dom.window.close();
});

test('西北子页面单实例；关闭确认会取消而不挂住，派发失败后按钮可再点',async()=>{
 const {JSDOM}=require('jsdom'),{confirmExit}=require('../src/ui/exit_confirmation'),dom=new JSDOM('<body><div id="one"></div><div id="two"></div></body>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const h=harness();await h.open();let fail=true,calls=0;
 const runtime={getSnapshot:()=>h.r.getSnapshot(),dispatchIntent:async()=>{calls++;if(fail)throw Error('发送失败，请重试');return {};}};
 const a=h.plugin.mount(doc.querySelector('#one'),runtime),b=h.plugin.mount(doc.querySelector('#two'),runtime);doc.querySelector('#one button').click();doc.querySelector('#two button').click();assert.equal(doc.querySelectorAll('dialog').length,1);
 doc.querySelector('[data-xibei-node]').click();await new Promise(r=>setImmediate(r));assert.equal(doc.querySelector('[data-xibei-node]').disabled,false);assert.match(doc.querySelector('dialog').textContent,/发送失败/);fail=false;doc.querySelector('[data-xibei-node]').click();await new Promise(r=>setImmediate(r));assert.equal(calls,2);assert.equal(doc.querySelector('dialog'),null);
 doc.querySelector('#one button').click();const pending=confirmExit(doc,{exitDays:10});doc.querySelector('[data-close]').click();assert.equal(await pending,false);assert.equal(doc.querySelector('[data-xsd2-exit-confirm]'),null);a();b();dom.window.close();
});

test('行程确认在地图原面板内显示；页面卸载取消，独立确认关闭可再次打开',async()=>{
 const {JSDOM}=require('jsdom'),{confirmExit}=require('../src/ui/exit_confirmation'),dom=new JSDOM('<body><div class="xsd2-map-modal-box"><button>节点</button></div></body>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 let result=confirmExit(doc,{exitDays:2});assert.equal(doc.querySelector('dialog'),null);doc.querySelector('.xsd2-map-modal-box').remove();assert.equal(await result,false);
 result=confirmExit(doc,{exitDays:6});assert.equal(doc.querySelectorAll('dialog').length,1);doc.querySelector('[data-close]').click();assert.equal(await result,false);
 result=confirmExit(doc,{exitDays:10});doc.querySelector('[data-exit-confirm]').click();assert.equal(await result,true);assert.equal(doc.querySelector('dialog'),null);dom.window.close();
});


test('获书与深入使用当前输入和绑定消息：重复回显及历史旧代码不让节点倒退',async()=>{
 const wrap=t=>'<本轮用户输入>[[JX47_VALUE_E01_B123_BEGIN]]\n'+t+'\n'+t+'\n[[JX47_VALUE_E01_B123_END]]</本轮用户输入><recall>XSD2_xbxxFight_deadbeef XSD2_xbxxLoot_12345678</recall>';
 const h=harness({wrap});await h.open();
 for(const id of ['xbxxEnter','xbxxFight','xbxxLoot','xbxxAmbush']){
  await h.click(id);const p=h.r.getSnapshot().pending;assert.ok(p.userRef);assert.equal(p.userRef.floor,h.chat.length-1);assert.ok(!h.r.getActionDisplay(h.chat.at(-1).mes).includes('XSD2_'));
  await h.r.replay('normal');await h.reply('你与孤月完成当前动作。<Status_block><历时>—</历时></Status_block>');
  assert.equal(h.r.getSnapshot().lastNodeResult.outcome,'success');
 }
 assert.equal(h.step(),'ambush');assert.equal(h.r.getSnapshot().pending,null);assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='极乐引').count,1);assert.ok(!h.plugin.list(h.r.getSnapshot()).some(x=>x.id==='xbxxLoot'));
 await h.r.restore();await h.r.settleStory();assert.equal(h.step(),'ambush');assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='极乐引').count,1);
 // Free response must stay at the attack scene; it cannot resurrect old commands.
 h.chat.push({mes:'<本轮用户输入>我选择避开偷袭</本轮用户输入><recall>XSD2_xbxxLoot_12345678</recall>',is_user:true});await h.reply('你退后一步。');assert.equal(h.step(),'ambush');assert.ok(h.plugin.list(h.r.getSnapshot()).some(x=>x.id==='xbxxJudge'));
});

test('原指令已绑定后另发同代码也不能借用授权；真正改选仍撤回固定奖励',async()=>{
 const h=harness();await h.open();await h.run('xbxxEnter');await h.run('xbxxFight');await h.click('xbxxLoot');const code=h.r.getSnapshot().pending.actionCode;
 h.chat.push({is_user:true,mes:code});await h.reply('另外一条输入的回复。');assert.equal(h.step(),'loot');assert.equal(h.r.getSnapshot().inventory.some(x=>x.name==='极乐引'),false);assert.equal(h.r.getSnapshot().lastNodeResult.actionMismatch.boundUser.messageId.length>0,true);
});
