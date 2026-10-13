"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict');
const Eras=require('../src/runtime/grand_eras'),eras=require('../src/config/grand_eras.json');
const {managedEnabled}=require('../src/runtime/story_entries');
const {createWorldbookHost}=require('../src/host/worldbook');
const {openEras}=require('../src/ui/era_panel');
const {JSDOM}=require('jsdom');
test('时期配置连续，边界互斥，最后背景延续，未来信息不注入',()=>{
 assert.equal(Eras.validate(eras).length,3);
 assert.equal(Eras.currentEra(eras,{year:1578,month:7,day:30}).id,'peace');
 assert.equal(Eras.currentEra(eras,{year:1578,month:8,day:1}).id,'calamity');
 assert.equal(Eras.currentEra(eras,{year:1580,month:1,day:1}).id,'beast');
 assert.equal(Eras.currentEra(eras,{year:1578,month:2,day:30}),null);
 assert.throws(()=>Eras.validate([eras[0],{...eras[1],startDate:{year:1578,month:8,day:2}}]),/衔接/);
 const entries=Eras.eraEntries(eras);assert.equal(entries.filter(e=>managedEnabled(e.comment,{grand_era:'peace',grand_era_entry:'peace-v36'}) && e.comment.startsWith('【大势背景】')).length,1);
 assert.equal(managedEnabled('【中立】五 · 天溪城破',{}),false);
 assert.equal(managedEnabled('【阶段驱动】当前阶段压力与调度',{}),false);
});
test('旧绑定世界书停止七时期与阶段驱动，并补入当前大势；旧破境说明不再冲突',async()=>{
 let entries=[{uid:54,name:'【中立】二 · 承平假象',content:'旧时期',enabled:true},{uid:7,name:'【阶段驱动】当前阶段压力与调度',content:'<stage_drive>旧EJS',enabled:true},{uid:36,name:'【设定】南域神诅变局与破境断路',content:'金丹中期封顶',enabled:true}];
 const host=createWorldbookHost({getCharWorldbookNames:async()=>({primary:'测试'}),getWorldbook:async()=>entries,replaceWorldbook:async(_,e)=>entries=e},()=>({}),{expectedName:'测试',embeddedManagedEntries:Eras.eraEntries(eras)});
 await host.synchronizeState({grand_era:'calamity',known:{'南域大劫':true}});
 assert.ok(entries.slice(0,3).every(e=>!e.enabled&&e.disable));
 assert.deepEqual(entries.filter(e=>e.enabled&&e.name.startsWith('【大势背景】')).map(e=>e.name),['【大势背景】calamity']);
 await host.synchronizeState({grand_era:'peace',grand_era_entry:'peace-v36',known:{'南域大劫':false}});
 assert.deepEqual(entries.filter(e=>e.enabled&&e.name.startsWith('【大势背景】')).map(e=>e.name),['【大势背景】peace-v36']);
});
test('大势弹窗隐藏未来标题与剧情、仅向前按钮，正确发送本地意图且正常关闭',async()=>{
 const dom=new JSDOM('<body></body>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const s={chatId:'x',branchId:'x',floor:0,revision:1,calendarDate:{year:1578,month:3,day:3},stat_data:{grand_era:'peace',grand_era_entry:'peace-v36'}},calls=[];
 const runtime={getSnapshot:()=>s,dispatchIntent:async i=>calls.push(i)};
 const dispose=openEras(doc,runtime,{grandEras:eras});
 assert.equal(doc.querySelectorAll('[data-era]').length,2);assert.ok(!doc.body.textContent.includes('南域大劫'));assert.ok(!doc.body.textContent.includes('天溪兽潮'));
 doc.querySelector('[data-era="calamity"]').click();await new Promise(r=>setImmediate(r));assert.equal(calls[0].type,'ADVANCE_ERA');assert.equal(doc.querySelector('dialog'),null);dispose();
 s.activeEvent={id:'exploring'};openEras(doc,runtime,{grandEras:eras});assert.ok([...doc.querySelectorAll('[data-era]')].every(b=>b.disabled));doc.querySelector('[data-close]').click();assert.equal(doc.querySelector('dialog'),null);
});
