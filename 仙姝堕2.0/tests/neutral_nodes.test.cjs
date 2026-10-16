'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{JSDOM}=require('jsdom');
const C=require('../src/runtime/contracts'),data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
const {createDispatcher}=require('../src/runtime/dispatcher'),{createNeutralPlugin}=require('../src/plugins/neutral');
function fixture(date={year:1578,month:9,day:1}){
 const chat=[{mes:'<IdentityMenu/>',variables:[]}];let checkpoint=null;
 const adapter={context:()=>({chatId:'neutral',chat}),readCheckpoint:async()=>C.clone(checkpoint),readMessage:async i=>C.clone(chat[i]?.variables?.[chat[i]?.swipe_id || 0] || {}),persist:async(c,e)=>{checkpoint=C.clone(e);chat[c.floor].variables ||= [];chat[c.floor].variables[chat[c.floor].swipe_id || 0]={stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}};},replaceOpening:async t=>chat[0].mes=t,replaceStory:async(i,t)=>chat[i].mes=t,send:async t=>chat.push({mes:t,is_user:true}),setPrompt(){},report(){}};
 const r=createDispatcher(adapter,data),p=createNeutralPlugin(data.neutralNodes,data.nodeStories);r.registerPlugin(p);
 const open=()=>r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{name:'测试道友',date}}});
 const select=id=>{const s=r.getSnapshot();return r.dispatchIntent({type:'SELECT_NODE',pluginId:p.id,expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:id}});};
 const reply=async text=>{chat.push({mes:text,is_user:false});await r.settleStory();};
 const report=a=>'<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">'+a+'</Promotion_result>';
 const setDate=async date=>{await r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:date}});await r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['calendarDate']}});};
 return {r,p,chat,open,select,reply,report,setDate};
}
test('中立节点日期/路线双门禁，模型申报和历史正文不能提前解锁路线',async()=>{
 const h=fixture({year:1578,month:8,day:30});await h.open();assert.equal(h.p.list(h.r.getSnapshot()).length,0);await assert.rejects(h.select('xmFrontEnter'),/不满足/);
 await h.setDate({year:1578,month:9,day:1});assert.deepEqual(h.p.list(h.r.getSnapshot()).map(x=>x.id),['xmFrontEnter']);
 h.chat.push({mes:'自由行动',is_user:true});await h.reply('你前往天溪城并已经入天溪城。<Status_block><实际发生>前往天溪城、已抵达天溪</实际发生></Status_block>');
 assert.notEqual(h.r.getSnapshot().known['前往天溪城'],true);assert.notEqual(h.r.getSnapshot().known['已抵达天溪'],true);
 await h.setDate({year:1578,month:11,day:1});assert.ok(!h.p.list(h.r.getSnapshot()).some(x=>x.id==='xmTianxiEnter'));await assert.rejects(h.select('xmTianxiEnter'),/不满足/);
});
test('防线前往/留守互斥，抵达完成才落账；无固定扣日、刷新不重复、删结算可恢复',async()=>{
 const h=fixture();await h.open();const date=C.clone(h.r.getSnapshot().calendarDate);
 await h.select('xmFrontEnter');assert.notEqual(h.r.getSnapshot().known['前往天溪城'],true);await h.reply('主事交代局势，等你选择去向。');
 await h.select('xmFrontGo');await h.reply(h.report('否'));assert.notEqual(h.r.getSnapshot().known['前往天溪城'],true);assert.equal(h.r.getSnapshot().activeEvent.pluginId,h.p.id);
 await h.select('xmFrontGo');await h.reply(h.report('是'));assert.equal(h.r.getSnapshot().known['前往天溪城'],true);assert.deepEqual(h.r.getSnapshot().calendarDate,date);await assert.rejects(h.select('xmFrontStay'),/不满足/);
 assert.equal(h.p.list(h.r.getSnapshot()).length,0);await h.setDate({year:1578,month:11,day:1});assert.deepEqual(h.p.list(h.r.getSnapshot()).map(x=>x.id),['xmTianxiEnter']);
 await h.select('xmTianxiEnter');await h.reply('守关统领查验符牒，等待你的交涉。');assert.notEqual(h.r.getSnapshot().known['已抵达天溪'],true);
 h.chat.push({mes:'说明来意，配合查验入城',is_user:true});await h.reply('你通过查验，踏入天溪城。');
 await h.select('xmTianxiFinish');await h.reply(h.report('是'));assert.equal(h.r.getSnapshot().known['已抵达天溪'],true);assert.equal(h.r.getSnapshot().activeEvent,null);
 await h.r.restore();assert.equal(h.p.list(h.r.getSnapshot()).length,0);h.chat.pop();await h.r.restore({afterDelete:true});assert.notEqual(h.r.getSnapshot().known['已抵达天溪'],true);
 const stay=fixture();await stay.open();await stay.select('xmFrontEnter');await stay.reply('主事等待答复。');await stay.select('xmFrontStay');await stay.reply(stay.report('是'));assert.notEqual(stay.r.getSnapshot().known['前往天溪城'],true);await stay.setDate({year:1578,month:11,day:1});assert.equal(stay.p.list(stay.r.getSnapshot()).length,0);
});
test('中立节点异常回包不落账且可重新完成，单实例弹窗及派发失败可再次操作',async()=>{
 const h=fixture();await h.open();await h.select('xmFrontEnter');await h.reply('主事等待答复。');await h.select('xmFrontGo');await h.reply('<Promotion_result id="old">是</Promotion_result>');assert.equal(h.r.getSnapshot().lastNodeResult.outcome,'retry');assert.ok(h.p.list(h.r.getSnapshot()).some(x=>x.id==='xmFrontGo'));assert.notEqual(h.r.getSnapshot().known['前往天溪城'],true);
 const dom=new JSDOM('<body><main></main></body>'),doc=dom.window.document;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 try{
  const runtime={getSnapshot:()=>h.r.getSnapshot(),dispatchIntent:async()=>{throw Error('模拟发送失败');}};
  const clean=h.p.mount(doc.querySelector('main'),runtime);doc.querySelector('[data-neutral-nodes]').click();doc.querySelector('[data-neutral-nodes]').click();assert.equal(doc.querySelectorAll('[data-neutral-dialog]').length,1);
  const b=doc.querySelector('[data-neutral-node]');b.click();await new Promise(r=>setImmediate(r));assert.equal(b.disabled,false);assert.match(doc.querySelector('dialog').textContent,/模拟发送失败/);clean();assert.equal(doc.querySelector('dialog'),null);
 }finally{dom.window.close();}
});
