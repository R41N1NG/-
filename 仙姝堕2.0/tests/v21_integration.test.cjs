'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
const {createMetricEvents}=require('../src/runtime/metric_events');
const {mountHUD}=require('../src/ui/status_panel');const {JSDOM}=require('jsdom');
function makeDom(html){const d=new JSDOM(html);d.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};d.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new d.window.Event('close'))};return d;}
function state(identity='赵无忧'){return {identity,chatId:'test',branchId:'test',floor:2,revision:3,storyCount:5,calendarDate:{year:1578,month:3,day:3},known:{},inventory:[],manual:{},stat_data:{身份:identity,关系刻度:'叶红缨、同门',名器归属:{},在场角色:[{名:'叶红缨'}],character_metrics:{叶红缨:{好感度:19}},completed_character_stages:{叶红缨:'stage01'}}};}
const prose='叶红缨接过酒坛。',tag='<好感事件>叶红缨｜记心上｜依据：叶红缨接过酒坛</好感事件>';
test('真实状态嵌套口径：申报落账、封顶、晋升后解锁与日志',()=>{
 const api=createMetricEvents(data.metricEventDefinitions,data.characterProfiles,data.promotionDefinitions),s=state();
 assert.equal(api.apply(s,tag,prose,5).changes[0].value,20);
 assert.equal(api.apply(s,tag,prose,8).changes.length,0);
 s.stat_data.completed_character_stages.叶红缨='stage02';
 assert.equal(api.apply(s,tag,prose,9).changes[0].value,21);
 s.stat_data.character_metrics.叶红缨.好感度=39;
 assert.equal(api.apply(s,tag,prose,12).changes[0].value,40);
 assert.equal(api.apply(s,tag,prose,15).changes.length,0);
 assert.equal(s.stat_data.favor_log.叶红缨.length,3);
});
test('两条晋升路线阈值均为20/40/60/80，数据源含十三名器与四阶图',()=>{
 for(const identity of ['赵无忧','自设']) assert.deepEqual(Object.values(data.promotionDefinitions).filter(p=>p.conditions.some(c=>c.kind==='identity'&&c.value===identity)).map(p=>p.conditions.find(c=>c.kind==='metric').value),[20,40,60,80]);
 assert.equal(Object.keys(data.relicDb).length,13);assert.equal(Object.keys(data.relicEmblems).length,13);
 for(const id of Object.keys(data.relicDb))for(const phase of [1,2,3,4])assert.match(data.relicEmblems[id][phase],/^data:image\/webp;base64,/);
});
test('心迹真实DOM：身份过滤四节点、点击授权中控、活动/历史禁止启动',async()=>{
 for(const identity of ['赵无忧','自设']){
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state(identity),calls=[];
 s.stat_data.character_metrics.叶红缨.好感度=20;
 const runtime={getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async i=>calls.push(i)};
 const panel=mountHUD(doc,doc.querySelector('main'),runtime,data,()=>{});
 doc.querySelector('[data-favor]').click();const nodes=[...doc.querySelectorAll('[data-heart-node]')];
 assert.equal(nodes.length,4);assert.deepEqual(nodes.map(b=>b.querySelector('span').textContent),['20','40','60','80']);
 assert.equal(nodes.filter(b=>!b.disabled).length,1);nodes[0].click();await Promise.resolve();
 assert.equal(calls[0].payload.nodeId,identity==='赵无忧'?'yhrNight':'yhrRogueEnter1');
 assert.equal(calls[0].pluginId,'character_promotion');panel.destroy();
 s.activeEvent={pluginId:'youjigu_map'};const locked=mountHUD(doc,doc.querySelector('main'),runtime,data,()=>{});doc.querySelector('[data-favor]').click();assert.ok([...doc.querySelectorAll('[data-heart-node]')].every(b=>b.disabled));locked.destroy();
 const historical=mountHUD(doc,doc.querySelector('main'),runtime,data,()=>{},{readOnly:true});doc.querySelector('[data-favor]').click();assert.ok([...doc.querySelectorAll('[data-heart-node]')].every(b=>b.disabled));historical.destroy();d.window.close();
 }
});
test('重新构建必须包含新面板与上限代码，PNG和latest一致',()=>{
 const {bundle,unpack}=require('../build');const script=bundle();assert.ok(script.includes('xsd2-favor'));assert.ok(script.includes('function favorCap'));assert.ok(script.includes('data-heart-node'));
 const dir=path.join(__dirname,'..');const a=fs.readFileSync(path.join(dir,'dist/仙姝堕2.0·框架测试-v26.png')),b=fs.readFileSync(path.join(dir,'最新角色卡/仙姝堕2.0·框架测试.png'));assert.ok(a.equals(b));assert.equal(unpack(a).data.character_version,'2.0-framework.26');
});
test('开局容器独立于两翼布局，入世后回到主卷，重新开局可再次移出',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document;let s=null;
 const runtime={getSnapshot:()=>s,getOpeningView:()=>({mode:'identity_menu',key:'menu'}),subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}};
 const p=mountHUD(doc,doc.querySelector('main'),runtime,data,()=>{});
 assert.equal(doc.querySelector('.xsd2-opening-root').parentElement.tagName,'MAIN');assert.equal(doc.querySelector('.xsd2-stagebar').style.display,'none');
 s=state();p.render();assert.ok(doc.querySelector('.xsd2-hud').parentElement.classList.contains('xsd2-stagebar'));assert.equal(doc.querySelector('.xsd2-stagebar').style.display,'');
 s=null;p.render();assert.equal(doc.querySelector('.xsd2-opening-root').parentElement.tagName,'MAIN');p.destroy();d.window.close();
});
test('定稿新版主卷：卷中录标题、身份铭牌、文书行与储物入口，未获纹章有真实图像',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state();
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{});
 assert.equal(doc.querySelector('.xsd2-head h1').textContent,'卷中錄');assert.ok(doc.querySelector('.xsd2-plaque'));assert.equal(doc.querySelectorAll('.xsd2-document>.xsd2-row').length,8);
 assert.ok([...doc.querySelectorAll('[data-xsd2-wing] img')].every(i=>i.src.startsWith('data:image/webp;base64,')));
 doc.querySelector('[data-storage]').click();assert.equal(doc.querySelector('[data-storage-fold]').open,true);p.destroy();d.window.close();
});
test('玄鉴十三名签均可切换；两种退出、背景和Esc关闭清遮罩，重开无死锁',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state();
 const errors=[];d.window.addEventListener('error',e=>errors.push(e.message));
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{});
 const open=()=>doc.querySelector('[data-xsd2-wing] button').click();open();
 for(const id of Object.keys(data.relicDb)){doc.querySelector('[data-xjtab="'+id+'"]').click();assert.ok(doc.querySelector('[data-xjtab="'+id+'"] .missing')===null);assert.ok(doc.querySelector('[data-xjtab="'+id+'"]').classList.contains('on'));}
 const root=doc.querySelector('.xsd2-xj');assert.equal(doc.querySelectorAll('.xsd2-xj').length,1);
 doc.querySelector('.xsd2-xj [data-close]').click();assert.ok(!root.classList.contains('open'));assert.equal(root.children.length,0);
 open();doc.querySelector('.xsd2-closegold').click();assert.ok(!root.classList.contains('open'));
 open();root.click();assert.ok(!root.classList.contains('open'));
 open();doc.dispatchEvent(new d.window.KeyboardEvent('keydown',{key:'Escape'}));assert.ok(!root.classList.contains('open'));
 open();assert.ok(root.classList.contains('open'));p.destroy();assert.deepEqual(errors,[]);assert.equal(doc.querySelector('.xsd2-xj'),null);d.window.close();
});
test('心迹单实例原生弹窗，不堆叠；顶端地图、旧按钮移除与晋升完成入口',async()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state(),calls=[];
 s.stat_data.关系刻度='叶红缨、同门｜孤月、同门';s.stat_data.character_metrics.孤月={好感度:0};
 const plugin={id:'character_promotion',mount(){throw Error('旧人物菜单不应挂载')}};
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[plugin],dispatchIntent:async i=>calls.push(i)},data,()=>{});
 assert.ok(doc.querySelector('.xsd2-head [data-xsd-slot="map"]'));assert.equal(doc.querySelector('[data-action]'),null);assert.equal(doc.querySelector('[data-promotion-menu]'),null);
 for(let i=0;i<6;i++){doc.querySelector('[data-favor="叶红缨"]').click();assert.equal(doc.querySelectorAll('dialog.xsd2-favor').length,1);assert.ok(doc.querySelector('dialog.xsd2-favor').open);}
 doc.querySelector('[data-favor="孤月"]').click();assert.equal(doc.querySelectorAll('dialog.xsd2-favor').length,1);assert.match(doc.querySelector('dialog header').textContent,/孤月/);
 doc.querySelector('dialog [data-close]').click();assert.equal(doc.querySelectorAll('dialog').length,0);
 s.activeEvent={pluginId:'character_promotion',character:'叶红缨',promotionId:'yehongying-night'};doc.querySelector('[data-favor="叶红缨"]').click();
 doc.querySelector('[data-heart-node="yhrFinish"]').click();await Promise.resolve();assert.equal(calls[0].payload.nodeId,'yhrFinish');assert.equal(doc.querySelectorAll('dialog').length,0);
 doc.querySelector('[data-favor="叶红缨"]').click();doc.dispatchEvent(new d.window.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(doc.querySelectorAll('dialog').length,0);
 p.destroy();d.window.close();
});
test('玩家头像独立于在场人物；高清缩图与夜浴场景图由事件配置切换',()=>{
 const {portrait}=require('../src/ui/status_panel'),d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state();
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{},{getPlayerAvatar:()=>'/avatars/player.png'});
 assert.ok(doc.querySelector('[data-player-avatar] img').src.endsWith('/avatars/player.png'));assert.equal(doc.querySelector('.xsd2-portrait [data-portrait]'),null);assert.equal(doc.querySelector('[data-player-avatar-file]').accept,'image/png,image/jpeg,image/webp');
 assert.ok(portrait('叶红缨',s,data).small.endsWith('yehongying.png'));
 s.activeEvent={pluginId:'character_promotion',promotionId:'yehongying-night',character:'叶红缨'};
 assert.ok(portrait('叶红缨',s,data).small.endsWith('yehongying_bath_side.png'));assert.ok(portrait('叶红缨',s,data).large.endsWith('yehongying_bath_side.png'));assert.ok(portrait('孤月',s,data).large.endsWith('guyue.png'));
 s.activeEvent=null;assert.ok(portrait('叶红缨',s,data).large.endsWith('yehongying.png'));p.destroy();d.window.close();
});
