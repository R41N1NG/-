'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),path=require('node:path');
const data=require('../tools/data.cjs').load(path.join(__dirname,'..')),C=require('../src/runtime/contracts');
const {openItem}=require('../src/ui/item_panel'),{openRealm}=require('../src/ui/realm_panel'),{openEras}=require('../src/ui/era_panel'),{openGM}=require('../src/ui/gm_panel'),{mountHUD}=require('../src/ui/status_panel'),map=require('../src/plugins/youjigu_map');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const dom=new JSDOM('<html><head></head><body><main></main><div id="slot"></div></body></html>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const known=Object.fromEntries(data.rules({}).ALL_FIELDS.map(k=>[k,false])),inventory=[{id:'草药',name:'草药',count:2}];
 let state={chatId:'one',branchId:'one',floor:2,revision:1,identity:'赵无忧',calendarDate:{year:1578,month:4,day:1},known,inventory,manual:{},pluginState:{},stat_data:{身份:'赵无忧',阵营:'墨山道',修为:'金丹中期',known,inventory,名器归属:{},关系刻度:'叶红缨、同门',在场角色:[{名:'叶红缨'}],character_metrics:{叶红缨:{好感度:20}},character_stages:{叶红缨:{id:'stage01'}},completed_character_stages:{叶红缨:'stage01'}}};
 const calls=[],errors=[],runtime={getSnapshot:()=>C.clone(state),dispatchIntent:async i=>{calls.push(i);},subscribe:()=>()=>{},uiPlugins:[],stop:async()=>{calls.push({type:'stop'});}};
 return {dom,doc,runtime,calls,errors,report:e=>errors.push(e.message),get state(){return state;},set state(v){state=v;}};
}
const panels=[['物品',h=>openItem(h.doc,h.runtime,'草药',h.report),'[data-use]'],['境界',h=>openRealm(h.doc,h.runtime,data,h.report),'[data-realm-act="retreat"]'],['大势',h=>openEras(h.doc,h.runtime,data,h.report),'[data-era]']];
test('物品、闭关、大势旧面板不能跨聊天执行，缺失快照也显示原因且不锁按钮',async()=>{
 for(const[name,open,selector]of panels){const h=fixture();try{open(h);h.state={...h.state,chatId:'two',branchId:'two'};h.doc.querySelector(selector).click();await tick();assert.equal(h.calls.length,0,name);assert.match(h.doc.querySelector('dialog').textContent,/存档已变化/,name);assert.equal(h.doc.querySelector(selector).disabled,false,name);}finally{h.dom.window.close();}}
 const h=fixture();try{openRealm(h.doc,h.runtime,data,h.report);h.runtime.getSnapshot=()=>null;h.doc.querySelector('[data-realm-act="retreat"]').click();await tick();assert.match(h.doc.querySelector('[data-realm-feedback]').textContent,/存档已变化/);assert.equal(h.calls.length,0);}finally{h.dom.window.close();}
});
test('物品、闭关、大势快速双击只有一次派发，失败后恢复操作并可重试',async()=>{
 for(const[name,open,selector]of panels){const h=fixture();try{let reject;h.runtime.dispatchIntent=i=>{h.calls.push(i);return new Promise((_,r)=>reject=r);};open(h);const b=h.doc.querySelector(selector);b.click();b.click();assert.equal(h.calls.length,1,name);assert.equal(b.disabled,true,name);reject(Error('模拟发送失败'));await tick();assert.equal(b.disabled,false,name);assert.match(h.doc.querySelector('dialog').textContent,/模拟发送失败/);h.runtime.dispatchIntent=async i=>h.calls.push(i);b.click();await tick();assert.equal(h.calls.length,2,name);}finally{h.dom.window.close();}}
});
test('GM保存未完成时重复提交与交还自动不会再排队，失败后草稿保留并能再次保存',async()=>{
 const h=fixture();try{let reject;h.runtime.dispatchIntent=i=>{h.calls.push(i);return new Promise((_,r)=>reject=r);};openGM(h.doc,h.runtime,data,h.report);h.doc.querySelector('[name="realm"]').value='金丹后期';const form=h.doc.querySelector('form');form.dispatchEvent(new h.dom.window.Event('submit',{cancelable:true}));form.dispatchEvent(new h.dom.window.Event('submit',{cancelable:true}));h.doc.querySelector('[data-release-selected]').click();assert.equal(h.calls.length,1);assert.equal(h.calls[0].payload.realm,'金丹后期');reject(Error('保存失败'));await tick();assert.equal(h.doc.querySelector('[name="realm"]').value,'金丹后期');assert.equal(h.doc.querySelector('[type="submit"]').disabled,false);h.runtime.dispatchIntent=async i=>h.calls.push(i);form.dispatchEvent(new h.dom.window.Event('submit',{cancelable:true}));await tick();assert.equal(h.calls.length,2);}finally{h.dom.window.close();}
});
test('好感封顶与故事内禁开提示可见；故事结束后符合条件的菱形恢复可开启',()=>{
 const h=fixture();try{h.state.activeEvent={pluginId:'xibei'};const panel=mountHUD(h.doc,h.doc.querySelector('main'),h.runtime,data,h.report);h.doc.querySelector('[data-favor="叶红缨"]').click();assert.match(h.doc.querySelector('.xsd2-cap').textContent,/好感节点需在故事节点外开启/);assert.ok(h.doc.querySelector('[data-favor-story-block]'));assert.ok([...h.doc.querySelectorAll('[data-heart-node]')].every(b=>b.disabled));h.state.activeEvent=null;panel.render();h.doc.querySelector('[data-favor="叶红缨"]').click();assert.equal(h.doc.querySelector('[data-favor-story-block]'),null);assert.ok([...h.doc.querySelectorAll('[data-heart-node]')].some(b=>!b.disabled));panel.destroy();}finally{h.dom.window.close();}
});
test('心迹节点重复点击只派发一次，失败原因在原页显示且可重试',async()=>{
 const h=fixture();try{let reject;h.runtime.dispatchIntent=i=>{h.calls.push(i);return new Promise((_,r)=>reject=r);};const panel=mountHUD(h.doc,h.doc.querySelector('main'),h.runtime,data,h.report);h.doc.querySelector('[data-favor="叶红缨"]').click();const b=h.doc.querySelector('[data-heart-node]:not(:disabled)');b.click();b.click();assert.equal(h.calls.length,1);reject(Error('节点发送失败'));await tick();assert.equal(b.disabled,false);assert.match(h.doc.querySelector('dialog').textContent,/节点发送失败/);panel.destroy();}finally{h.dom.window.close();}
});
test('幽寂谷取消保留地图并说明，错误不依赖toast，待派发中不重复点击',async()=>{
 const h=fixture();try{h.state.pluginState.youjigu_map={...require('../src/plugins/youjigu_map/event_tree').createInitialState('赵无忧'),step:'camp_return'};h.state.activeEvent={pluginId:'youjigu_map'};let resolve;h.runtime.dispatchIntent=i=>{h.calls.push(i);return new Promise(r=>resolve=r);};const dispose=map.mount(h.doc.querySelector('#slot'),h.runtime);h.doc.querySelector('.xsd2-map-trigger-btn').click();let b=[...h.doc.querySelectorAll('.yj-card-btn')].find(b=>!b.disabled);assert.ok(b);b.click();b.click();assert.equal(h.calls.length,1);resolve({cancelled:true});await tick();assert.ok(h.doc.querySelector('.xsd2-map-modal-overlay'));assert.match(h.doc.querySelector('[data-map-result]').textContent,/已取消/);assert.equal(b.disabled,false);h.runtime.dispatchIntent=async()=>{throw Error('地图发送失败');};b.click();await tick();assert.match(h.doc.querySelector('[data-map-result]').textContent,/地图发送失败/);assert.equal(b.disabled,false);dispose();assert.equal(h.doc.querySelector('[data-map-feedback]'),null);}finally{h.dom.window.close();}
});

test('授权失配不会静默回退：主卷明确标出失败楼层与节点未推进，可导出诊断',()=>{
 const h=fixture();try{h.state.lastNodeResult={nodeId:'xbxxLoot',floor:8,outcome:'failure',reason:'行动后的用户消息与授权行动不匹配'};const panel=mountHUD(h.doc,h.doc.querySelector('main'),h.runtime,data,h.report);const notice=h.doc.querySelector('[data-action-mismatch]');assert.match(notice.textContent,/第8楼/);assert.match(notice.textContent,/正文.*不代表节点已完成/);assert.ok(notice.querySelector('[data-diagnostics]'));h.state.lastNodeResult.outcome='success';panel.render();assert.equal(h.doc.querySelector('[data-action-mismatch]'),null);panel.destroy();}finally{h.dom.window.close();}
});
test('删楼恢复仍显示完整状态栏，并说明后续旧回复不再自动结算',()=>{
 const h=fixture();try{h.state.historyRecovery={kind:'delete',ignoredReplies:['old']};const mounted=mountHUD(h.doc,h.doc.querySelector('main'),h.runtime,data,h.report);assert.ok(h.doc.querySelector('[data-history-recovery]'));assert.match(h.doc.querySelector('[data-history-recovery]').textContent,/最近可信进度/);assert.ok(h.doc.querySelector('[data-storage-fold]'));assert.equal(h.calls.length,0);mounted.destroy();}finally{h.dom.window.close();}
});
test('多人好感核验提示各看各人，不拿另一人的失败解释已成功的角色',()=>{
 const h=fixture();try{
 h.state.stat_data.在场角色.push({名:'楚灵夜'});h.state.stat_data.character_metrics.楚灵夜={好感度:1};h.state.stat_data.关系刻度='叶红缨、同门｜楚灵夜、同道';
 const ye={character:'叶红缨',turn:1,reason:'叶红缨好感已达当前节点上限',status:'rejected'},chu={character:'楚灵夜',turn:1,reason:null,status:'applied'};
 h.state.stat_data.lastFavorChecks=[ye,chu];h.state.stat_data.lastFavorCheck=chu;
 const panel=mountHUD(h.doc,h.doc.querySelector('main'),h.runtime,data,h.report);
 h.doc.querySelector('[data-favor="叶红缨"]').click();assert.match(h.doc.querySelector('dialog').textContent,/最近一次好感核验.*叶红缨好感已达/);
 h.doc.querySelector('dialog [data-close]').click();h.doc.querySelector('[data-favor="楚灵夜"]').click();assert.doesNotMatch(h.doc.querySelector('dialog').textContent,/叶红缨好感已达/);panel.destroy();
 }finally{h.dom.window.close();}
});
