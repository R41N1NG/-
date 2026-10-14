'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const C=require('../src/runtime/contracts'),data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
const {createDispatcher}=require('../src/runtime/dispatcher'),{createXibeiPlugin,EVENT_DEFS}=require('../src/plugins/xibei'),map=require('../src/plugins/youjigu_map');
const {managedEnabled}=require('../src/runtime/story_entries');
function harness(){
 const chat=[{mes:'<IdentityMenu/>',variables:[]}],sent=[];let fail=false,confirmed=true,retries=0,checkpoint=null;
 const adapter={readCheckpoint:async()=>C.clone(checkpoint),context:()=>({chatId:'xibei-test',chat}),readMessage:async i=>C.clone(chat[i]?.variables?.[0] || {}),persist:async(c,e)=>{checkpoint=C.clone(e);chat[c.floor].variables=[{stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}}];},replaceOpening:async t=>chat[0].mes=t,replaceStory:async(i,t)=>chat[i].mes=t,send:async t=>{if(fail)throw Error('发送失败');sent.push(t);chat.push({mes:t,is_user:true});},setPrompt:()=>{},report:()=>{},retryGeneration:()=>{retries++;},confirmExit:async()=>confirmed};
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
