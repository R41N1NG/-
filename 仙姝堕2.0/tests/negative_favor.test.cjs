"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{JSDOM}=require('jsdom');
const data=require('../tools/data.cjs').load(path.join(__dirname,'..')),C=require('../src/runtime/contracts');
const {resolveStages,writeMetric,completeStage}=require('../src/runtime/character_stages'),{createMetricEvents}=require('../src/runtime/metric_events');
const {storyEntries,managedEnabled}=require('../src/runtime/story_entries'),{createPromotionPlugin}=require('../src/plugins/promotion'),{mountHUD}=require('../src/ui/status_panel');
const profiles=data.characterProfiles,api=createMetricEvents(data.metricEventDefinitions,profiles,data.promotionDefinitions);
function state(){const s={identity:'赵无忧',chatId:'neg',branchId:'neg',floor:0,revision:1,calendarDate:{year:1578,month:4,day:1},inventory:[],known:{},manual:{},stat_data:{身份:'赵无忧',known:{},名器归属:{},在场角色:[{名:'叶红缨'}],关系刻度:'叶红缨、同门',completed_character_stages:{叶红缨:'stage03'}}};resolveStages(s,profiles);return s;}
function score(s,n){writeMetric(s.stat_data,profiles,'叶红缨','好感度',n);resolveStages(s,profiles);}
function event(s,id,line,turn){return api.apply(s,'<好感事件>叶红缨｜锚点 '+id+'｜依据：'+line+'</好感事件>',line,turn);}
test('四档边界中控覆盖、回正恢复完成阶段；负阶无节点无晋升回报',()=>{
 for(const [n,id]of [[-1,'neg_gap'],[-20,'neg_gap'],[-21,'neg_disgust'],[-50,'neg_disgust'],[-51,'neg_hostile'],[-80,'neg_hostile'],[-81,'neg_nemesis'],[-100,'neg_nemesis']]){const s=state();score(s,n);assert.equal(s.stat_data.character_stages.叶红缨.id,id);assert.equal(s.stat_data.completed_character_stages.叶红缨,'stage03');assert.deepEqual(s.stat_data.character_stages.叶红缨.nodes,[]);const p=createPromotionPlugin(data.promotionDefinitions,data.nodeStories);assert.ok(p.list(s).every(x=>!x.allowed));assert.throws(()=>completeStage(s,profiles,{character:'叶红缨',from:'stage03',to:'stage04'}),/当前阶段/);}
 const s=state();score(s,-20);score(s,0);assert.equal(s.stat_data.character_stages.叶红缨.id,'stage03');assert.equal(s.stat_data.character_metric_caps?.叶红缨,undefined);
});
test('跌至−51永久上限−50，正向回报/GM写值不能到−49；此前−50仍能回正',()=>{
 const s=state();score(s,-51);assert.equal(s.stat_data.character_metric_caps.叶红缨.好感度,-50);assert.throws(()=>score(s,-49),/永久/);assert.throws(()=>score(s,0),/永久/);
 const gain=event(s,'yh_shengjiu','赵无忧在危难中救下叶红缨的性命。',1);assert.equal(gain.changes[0].value,-50);resolveStages(s,profiles);assert.equal(s.stat_data.character_stages.叶红缨.id,'neg_disgust');assert.equal(event(s,'yh_shengjiu','赵无忧再次救下叶红缨的性命。',10).changes.length,0);
 const restored=C.clone(s);resolveStages(restored,profiles);assert.throws(()=>score(restored,-49),/永久/);
 const free=state();score(free,-50);score(free,0);assert.equal(free.stat_data.character_stages.叶红缨.id,'stage03');
});
test('负好感恢复按档位限制，不靠赠礼刷敌视；死敌禁正向，负向仍有效',()=>{
 const gap=state();score(gap,-5);assert.equal(event(gap,'yh_zengjiu','赵无忧赠叶红缨好酒。',1).changes[0].value,-4);
 const disgust=state();score(disgust,-30);assert.equal(event(disgust,'yh_gongyin','赵无忧与叶红缨对饮。',1).changes.length,0);assert.equal(event(disgust,'yh_weihu','赵无忧当众维护同门。',2).changes.length,0);assert.equal(event(disgust,'yh_weihu','赵无忧在危难中援手同门弟子。',3).changes[0].value,-27);
 const enemy=state();score(enemy,-60);assert.equal(event(enemy,'yh_gongyin','赵无忧与叶红缨对饮。',1).changes.length,0);assert.equal(event(enemy,'yh_shengjiu','赵无忧舍身救下叶红缨的性命。',2).changes[0].value,-50);
 const dead=state();score(dead,-90);assert.equal(event(dead,'yh_shengjiu','赵无忧舍身救下叶红缨的性命。',1).changes.length,0);
 const report='<好感事件>叶红缨｜记恨｜依据：叶红缨怒斥赵无忧</好感事件>';assert.ok(api.apply(dead,report,'叶红缨怒斥赵无忧',2).changes[0].value<=-90);
});
test('负向世界书与正向互斥，心迹不负宽、不丢完成记录，永久上限明确显示',()=>{
 const s=state();score(s,-60);const entries=storyEntries({},profiles);const active=entries.filter(e=>managedEnabled(e.comment,s.stat_data));assert.equal(active.filter(e=>e.comment.startsWith('【人物阶段】叶红缨:')).length,1);assert.match(active.find(e=>e.comment.startsWith('【人物阶段】叶红缨:')).comment,/neg_hostile/);
 const d=new JSDOM('<html><head></head><body><main></main></body></html>');d.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};d.window.HTMLDialogElement.prototype.close=function(){this.dispatchEvent(new d.window.Event('close'))};
 const panel=mountHUD(d.window.document,d.window.document.querySelector('main'),{getSnapshot:()=>s,subscribe:()=>()=>{},uiPlugins:[]},data,()=>{});d.window.document.querySelector('[data-favor="叶红缨"]').click();const dialog=d.window.document.querySelector('dialog');assert.match(dialog.textContent,/-60 \/ 100/);assert.match(dialog.textContent,/永久上限−50/);assert.equal(dialog.querySelector('.xsd2-fbar i').style.width,'0%');assert.ok([...dialog.querySelectorAll('[data-heart-node]')].every(b=>b.disabled));assert.equal(s.stat_data.completed_character_stages.叶红缨,'stage03');panel.destroy();d.window.close();
});
