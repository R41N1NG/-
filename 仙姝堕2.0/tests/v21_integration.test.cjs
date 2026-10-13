'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
const {createMetricEvents}=require('../src/runtime/metric_events');
const {mountHUD, PORTRAIT_CDN}=require('../src/ui/status_panel');const {JSDOM}=require('jsdom');
const linkEndsWith=(p,name)=>p.endsWith(name)||p===PORTRAIT_CDN[name];
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
 assert.equal(s.stat_data.favor_log.叶红缨.length,5);
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
 const dir=path.join(__dirname,'..');const a=fs.readFileSync(path.join(dir,'dist/仙姝堕2.0·框架测试-v43.png')),b=fs.readFileSync(path.join(dir,'最新角色卡/仙姝堕2.0·框架测试.png'));assert.ok(a.equals(b));assert.equal(unpack(a).data.character_version,'2.0-framework.43');
});
test('开局容器独立于两翼布局，入世后回到主卷，重新开局可再次移出',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document;let s=null;
 const runtime={getSnapshot:()=>s,getOpeningView:()=>({mode:'identity_menu',key:'menu'}),subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}};
 const p=mountHUD(doc,doc.querySelector('main'),runtime,data,()=>{});
 assert.equal(doc.querySelector('.xsd2-opening-root').parentElement.tagName,'MAIN');assert.equal(doc.querySelector('.xsd2-stagebar').style.display,'none');
 s=state();p.render();assert.ok(doc.querySelector('.xsd2-hud').parentElement.classList.contains('xsd2-stagebar'));assert.equal(doc.querySelector('.xsd2-stagebar').style.display,'');
 s=null;p.render();assert.equal(doc.querySelector('.xsd2-opening-root').parentElement.tagName,'MAIN');p.destroy();d.window.close();
});
test('定稿新版主卷：卷中录标题、身份铭牌、文书行与唯一储物折叠栏，未获纹章有真实图像',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state();
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{});
 assert.equal(doc.querySelector('.xsd2-head h1').textContent,'卷中錄');assert.ok(doc.querySelector('.xsd2-plaque'));assert.equal(doc.querySelectorAll('.xsd2-document>.xsd2-row').length,7);
 assert.ok([...doc.querySelectorAll('[data-xsd2-wing] img')].every(i=>i.src.startsWith('data:image/webp;base64,')));
 assert.equal(doc.querySelector('[data-storage]'),null);assert.equal(doc.querySelectorAll('[data-storage-fold]').length,1);doc.querySelector('[data-storage-fold]').open=true;assert.equal(doc.querySelector('[data-storage-fold]').open,true);p.destroy();d.window.close();
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
 assert.ok(linkEndsWith(portrait('叶红缨',s,data).small,'yehongying.png'));
 s.activeEvent={pluginId:'character_promotion',promotionId:'yehongying-night',character:'叶红缨'};
 assert.ok(linkEndsWith(portrait('叶红缨',s,data).small,'yehongying_bath_side.png')||linkEndsWith(portrait('叶红缨',s,data).small,'yehongying_bath_front.png'));assert.equal(portrait('叶红缨',s,data).small,portrait('叶红缨',s,data).large);assert.ok(linkEndsWith(portrait('孤月',s,data).large,'guyue.png'));
 s.activeEvent=null;assert.ok(linkEndsWith(portrait('叶红缨',s,data).large,'yehongying.png'));p.destroy();d.window.close();
});
test('十三名器统一用后台短ID显示浸润；无记录0值、各阶晋升条件、关闭切换保持',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state(),R=data.rules(s.stat_data);
 s.stat_data.known={};s.known=s.stat_data.known;s.stat_data.relic_progress={};
 for(const c of Object.values(R.RELIC_PILOT_CONFIG)){s.known[c.formKey]=true;s.known[c.stage1Key]=true;s.stat_data.relic_progress[c.id]={stages:{2:{count:1,target:3}}};}
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{});doc.querySelector('[data-xsd2-wing] button').click();
 for(const [id,rel] of Object.entries(data.relicDb)){const cfg=Object.values(R.RELIC_PILOT_CONFIG).find(c=>c.names.includes(rel.name));doc.querySelector('[data-xjtab="'+id+'"]').click();const progress=doc.querySelector('[data-relic-progress="'+cfg.id+'"]');assert.match(progress.textContent,/1\/3/);assert.match(progress.textContent,/晋升条件/);}
 delete s.stat_data.relic_progress.jiuyou;doc.querySelector('[data-xjtab="jiuyouxuanyinxue"]').click();assert.match(doc.querySelector('[data-relic-progress="jiuyou"]').textContent,/0\/3/);
 for(const stage of [2,3]){s.known[R.RELIC_PILOT_CONFIG.jiuyou['stage'+stage+'Key']]=true;s.stat_data.relic_progress.jiuyou={stages:{[stage+1]:{count:2,target:3}}};doc.querySelector('[data-xjtab="jiuyouxuanyinxue"]').click();const bar=doc.querySelector('[data-relic-progress="jiuyou"]');assert.equal(bar.dataset.targetStage,String(stage+1));assert.match(bar.textContent,/2\/3/);assert.match(bar.textContent,/晋升条件/);if(stage===3){assert.match(bar.textContent,/待设计，自动晋升暂停/);assert.ok(!bar.textContent.includes('外貌异化'));}}
 p.destroy();d.window.close();
});
test('场景候选随机选择只来自对应图片池，同楼重绘稳定，普通场景不选夜浴图',()=>{
 const {portrait}=require('../src/ui/status_panel'),s=state();s.activeEvent={pluginId:'character_promotion',promotionId:'yehongying-night'};
 const previous=Math.random;const seen=new Set();try{for(let floor=0;floor<12;floor++){Math.random=()=>floor%2?.9:.1;s.floor=100+floor;const p=portrait('叶红缨',s,data);seen.add(p.large);assert.equal(p.large,portrait('叶红缨',s,data).large);assert.ok(linkEndsWith(p.large,'yehongying_bath_front.png')||linkEndsWith(p.large,'yehongying_bath_side.png'));}}finally{Math.random=previous;}
 assert.equal(seen.size,2);s.activeEvent=null;assert.ok(!portrait('叶红缨',s,data).large.includes('bath'));
});
test('心迹只展示事件名和实际分值；好感协议显示正则隐藏闭合/漏闭标签且保留状态块',()=>{
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document,s=state();s.stat_data.favor_log={叶红缨:[{label:'对饮',delta:2,via:'yh_gongyin',turn:4,note:'正文证据不应显示'}]};
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{});doc.querySelector('[data-favor="叶红缨"]').click();const text=doc.querySelector('.xsd2-flog li').textContent;assert.equal(text,'对饮+2');assert.ok(!doc.querySelector('.xsd2-favor').textContent.includes('yh_gongyin'));assert.ok(!doc.querySelector('.xsd2-favor').textContent.includes('正文证据'));
 const card=require('../build').unpack(fs.readFileSync(path.join(__dirname,'../dist/仙姝堕2.0·框架测试-v43.png')));const x=card.data.extensions.regex_scripts.find(x=>x.id==='xsd2-hide-favor-report');const end=x.findRegex.lastIndexOf('/'),re=new RegExp(x.findRegex.slice(1,end),x.findRegex.slice(end+1));
 for(const close of ['</好感事件>','']){const raw='故事正文。<好感事件>叶红缨｜锚点 yh_gongyin｜依据：故事正文。'+close+'<Status_block>状态</Status_block>';assert.equal(raw.replace(re,''),'故事正文。<Status_block>状态</Status_block>');}p.destroy();d.window.close();
});

test('男性立绘及括号别名从现有图库解析，未知人物保留头像位且文字不进入窄列',()=>{
 const {portrait}=require('../src/ui/status_panel'),s=state();
 for(const [name,id] of [['玄机子','xuanjizi'],['玄机子（陆藏锋）','xuanjizi'],['炎雷子','yanleizi'],['云逸尘（清虚散人）','yunyichen'],['清虚散人','yunyichen'],['极乐太子','jiletaizi'],['炼欲魔君','lianyumojun'],['花间二鬼','huajianergui'],['残阳老怪','canyanglaoguai'],['肉山佛','roushanfo'],['九皇子','jiuhuangzi']]){
  const p=portrait(name,s,data);assert.ok(data.assets.includes(id+'.png'));assert.ok(linkEndsWith(p.large,id+'.png'));
 }
 s.stat_data.在场角色=[{名:'玄机子',关系:'客气拘谨',情况:'衣冠齐整',心境:'力主分兵',神态:'折扇轻摇'}, {名:'未配图道友',关系:'初识',情况:'静候'}];
 const d=makeDom('<html><head></head><body><main></main></body></html>'),doc=d.window.document;
 const p=mountHUD(doc,doc.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[],dispatchIntent:async()=>{}},data,()=>{});
 const cards=doc.querySelectorAll('.xsd2-npc');assert.equal(cards[0].children.length,2);assert.ok(linkEndsWith(cards[0].querySelector('img').src,'xuanjizi.png'));assert.equal(cards[0].children[1].querySelector('h4').textContent.trim(),'玄机子');
 assert.equal(cards[1].children.length,2);assert.ok(cards[1].children[0].classList.contains('xsd2-avatar-placeholder'));assert.match(cards[1].children[1].textContent,/初识/);
 cards[0].querySelector('[data-portrait]').click();assert.ok(linkEndsWith(doc.querySelector('dialog img').src,'xuanjizi.png'));
 p.destroy();d.window.close();
});
