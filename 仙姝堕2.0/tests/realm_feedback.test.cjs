"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {JSDOM}=require('jsdom'),{createDispatcher}=require('../src/runtime/dispatcher');
const {openRealm,blockedReason}=require('../src/ui/realm_panel'),Realm=require('../src/runtime/player_realm');
const {mountHUD}=require('../src/ui/status_panel'),plugin=require('../src/plugins/youjigu_map');
const C=require('../src/runtime/contracts'),data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
function fixture(){
 const dom=new JSDOM('<html><head></head><body><main></main></body></html>');
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const chat=[{mes:'<IdentityMenu/>',variables:[]}],messages=[],errors=[];
 const r=createDispatcher({context:()=>({chatId:'feedback',chat}),readMessage:async i=>C.clone(chat[i]?.variables?.[chat[i]?.swipe_id||0]||{}),persist:async(c,e)=>{chat[c.floor].variables=[{stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}}];},replaceOpening:async t=>chat[0].mes=t,send:async t=>{messages.push(t);chat.push({is_user:true,mes:t});},replaceStory:async(i,t)=>chat[i].mes=t,setPrompt(){},report:e=>errors.push(e.message)},data);
 r.registerPlugin(plugin);r.uiPlugins=[plugin];return {dom,doc:dom.window.document,r,chat,messages,errors};
}
const flush=()=>new Promise(r=>setTimeout(r,25));
test('满足条件的闭关、突破点击真实中控并更新主卷及成功反馈，不发送模型轮',async()=>{
 const h=fixture();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'赵无忧'}});const date=h.r.getSnapshot().calendarDate;
 const panel=mountHUD(h.doc,h.doc.querySelector('main'),h.r,data,e=>h.errors.push(e.message));
 h.doc.querySelector('[data-realm]').click();assert.equal(h.doc.querySelector('[data-realm-act="retreat"]').getAttribute('aria-disabled'),'false');
 h.doc.querySelector('[data-realm-act="retreat"]').click();await flush();assert.equal(h.r.getSnapshot().stat_data.修为,'金丹后期');assert.equal(C.day(h.r.getSnapshot().calendarDate)-C.day(date),90);assert.match(h.doc.querySelector('.xsd2-feedback').textContent,/闭关完成.*金丹后期/);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'筑基大圆满'}});h.doc.querySelector('[data-realm]').click();h.doc.querySelector('[data-realm-act="breakthrough"]').click();await flush();assert.equal(h.r.getSnapshot().stat_data.修为,'金丹前期');assert.match(h.doc.querySelector('.xsd2-feedback').textContent,/突破完成.*金丹前期/);assert.equal(h.messages.length,0);assert.deepEqual(h.errors,[]);panel.destroy();
});
test('金丹满两按钮均有具体原因，点击解释而不写入；剧情、日期覆盖与未明确境界均有原因',async()=>{
 const h=fixture();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'赵无忧'}});await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'金丹大圆满'}});
 const rev=h.r.getSnapshot().revision,dispose=openRealm(h.doc,h.r,data,e=>h.errors.push(e.message));
 assert.match(h.doc.querySelector('[data-realm-reason="breakthrough"]').textContent,/结婴条件未满足/);assert.match(h.doc.querySelector('[data-realm-reason="retreat"]').textContent,/已到金丹大圆满/);
 h.doc.querySelector('[data-realm-act="retreat"]').click();assert.match(h.doc.querySelector('[data-realm-feedback]').textContent,/不能继续升档/);assert.equal(h.r.getSnapshot().revision,rev);
 const s=h.r.getSnapshot(),e=Realm.eligibility(s,data.rules(s.stat_data));s.activeEvent={id:'youjigu'};assert.match(blockedReason(s,e,'retreat'),/进行剧情/);s.activeEvent=null;s.manual.calendarDate=s.calendarDate;assert.match(blockedReason(s,e,'retreat'),/交还自动/);s.manual={};s.stat_data.player_realm={major:null,phase:null};assert.match(blockedReason(s,e,'retreat'),/未明确/);dispose();
});
test('地图可进行节点产生主卷醒目通知，关闭/卸载不残留；未开放日期没有误提示',async()=>{
 const h=fixture();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'赵无忧'}});const panel=mountHUD(h.doc,h.doc.querySelector('main'),h.r,data,e=>h.errors.push(e.message));
 assert.equal(h.doc.querySelector('.xsd2-map-node-notice').style.display,'none');
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:{year:1578,month:4,day:1}}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['calendarDate']}});
 assert.match(h.doc.querySelector('.xsd2-free-action-tip').textContent,/可先自由行动/);
 const notice=h.doc.querySelector('.xsd2-map-node-notice');assert.equal(notice.style.display,'block');assert.match(notice.textContent,/地图有 1 个可进行节点/);assert.ok(notice.closest('.xsd2-hud'));
 notice.querySelector('button').click();assert.ok(h.doc.querySelector('.yj-actions-panel'));h.doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(h.doc.querySelector('.yj-actions-panel'),null);
 const s=h.r.getSnapshot();await h.r.dispatchIntent({type:'SELECT_NODE',pluginId:plugin.id,expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:'g7p2'}});
 assert.equal(h.doc.querySelector('.xsd2-map-node-notice').style.display,'none');panel.destroy();assert.equal(h.doc.querySelector('.xsd2-map-node-notice'),null);
});
