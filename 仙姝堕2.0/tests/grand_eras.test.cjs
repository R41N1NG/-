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
 const entries=Eras.eraEntries(eras);assert.equal(entries.filter(e=>managedEnabled(e.comment,{grand_era:'peace',grand_era_entry:'peace-v48'}) && e.comment.startsWith('【大势背景】')).length,1);
 assert.equal(managedEnabled('【中立】五 · 天溪城破',{}),false);
 assert.equal(managedEnabled('【阶段驱动】当前阶段压力与调度',{}),false);
});
test('旧绑定世界书停止七时期与阶段驱动，并补入当前大势；旧破境说明不再冲突',async()=>{
 let entries=[{uid:13000,name:'【大势背景】peace-v36',content:'旧承平背景',enabled:true},{uid:26,name:'【设定】南域神诅与名器破境法则',content:'旧金丹中期封顶',enabled:true},{uid:54,name:'【中立】二 · 承平假象',content:'旧时期',enabled:true},{uid:7,name:'【阶段驱动】当前阶段压力与调度',content:'<stage_drive>旧EJS',enabled:true},{uid:36,name:'【设定】南域神诅变局与破境断路',content:'金丹中期封顶',enabled:true}];
 const host=createWorldbookHost({getCharWorldbookNames:async()=>({primary:'测试'}),getWorldbook:async()=>entries,replaceWorldbook:async(_,e)=>entries=e},()=>({}),{expectedName:'测试',embeddedManagedEntries:Eras.eraEntries(eras)});
 await host.synchronizeState({grand_era:'calamity',known:{'南域大劫':true}});
 assert.ok(entries.slice(0,5).every(e=>!e.enabled&&e.disable));
 assert.deepEqual(entries.filter(e=>e.enabled&&e.name.startsWith('【大势背景】')).map(e=>e.name),['【大势背景】calamity']);
 await host.synchronizeState({grand_era:'peace',grand_era_entry:'peace-v48',known:{'南域大劫':false}});
 assert.deepEqual(entries.filter(e=>e.enabled&&e.name.startsWith('【大势背景】')).map(e=>e.name),['【大势背景】peace-v48']);
});
test('大势弹窗隐藏未来标题与剧情、仅向前按钮，正确发送本地意图且正常关闭',async()=>{
 const dom=new JSDOM('<body></body>'),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const s={chatId:'x',branchId:'x',floor:0,revision:1,calendarDate:{year:1578,month:3,day:3},stat_data:{grand_era:'peace',grand_era_entry:'peace-v48'}},calls=[];
 const runtime={getSnapshot:()=>s,dispatchIntent:async i=>calls.push(i)};
 const dispose=openEras(doc,runtime,{grandEras:eras});
 assert.equal(doc.querySelectorAll('[data-era]').length,2);assert.ok(!doc.body.textContent.includes('南域大劫'));assert.ok(!doc.body.textContent.includes('天溪兽潮'));
 doc.querySelector('[data-era="calamity"]').click();await new Promise(r=>setImmediate(r));assert.equal(calls[0].type,'ADVANCE_ERA');assert.equal(doc.querySelector('dialog'),null);dispose();
 s.activeEvent={id:'exploring'};openEras(doc,runtime,{grandEras:eras});assert.ok([...doc.querySelectorAll('[data-era]')].every(b=>b.disabled));doc.querySelector('[data-close]').click();assert.equal(doc.querySelector('dialog'),null);
});

test('三月与七月仍无神诅，八月才进入灾后；旧未来总纲和中期封顶停用',()=>{
 for(const date of [{year:1578,month:3,day:3},{year:1578,month:7,day:30}]){
  const s={calendarDate:date,stat_data:{known:{},player_realm:{major:'元婴',phase:'初期',actions:[]},修为:'元婴初期'}};
  Eras.reconcile(s,eras);assert.equal(s.stat_data.known['南域大劫'],false);assert.equal(s.stat_data.修为,'元婴初期');assert.match(Eras.narrativeBoundary(eras,date),/神诅尚未降临/);
 }
 const date={year:1578,month:8,day:1},s={calendarDate:date,stat_data:{known:{},player_realm:{major:'元婴',phase:'初期',actions:[]},修为:'元婴初期'}};
 Eras.reconcile(s,eras);assert.equal(s.stat_data.known['南域大劫'],true);assert.equal(s.stat_data.修为,'金丹大圆满');assert.match(Eras.narrativeBoundary(eras,date),/南域大劫已发生/);
 assert.equal(managedEnabled('【设定】南域神诅与名器破境法则',s.stat_data),false);assert.equal(managedEnabled('【设定】南域纪元大势总纲',s.stat_data),false);
 const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
 const core=fs.readFileSync(path.join(root,'src/text_data/_card_core.txt'),'utf8'),mes=fs.readFileSync(path.join(root,'src/text_data/_card_mes.txt'),'utf8');
 assert.match(core,/1578年8月1日前为承平期/);assert.doesNotMatch(core,/神诅自南域起，逐步蔓延扩散到了/);assert.doesNotMatch(mes,/神诅扩散|虽受神诅压制|神诅已非/);
 const book=JSON.parse(fs.readFileSync(path.join(root,'仙姝堕-世界书.json'),'utf8'));assert.match(book.entries['104'].content,/承平期战力未受神诅压制/);
});
