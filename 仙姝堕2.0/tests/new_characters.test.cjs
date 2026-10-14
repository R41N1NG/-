'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const C=require('../src/runtime/contracts'),data=require('../tools/data.cjs').load(path.join(__dirname,'..'));
const {createDispatcher}=require('../src/runtime/dispatcher'),{createPromotionPlugin}=require('../src/plugins/promotion');
const {managedEnabled}=require('../src/runtime/story_entries');
function fixture(){
 const chat=[{mes:'<IdentityMenu/>',variables:[]}];let checkpoint=null;
 const adapter={context:()=>({chatId:'six-new',chat}),readCheckpoint:async()=>C.clone(checkpoint),readMessage:async i=>C.clone(chat[i]?.variables?.[0] || {}),persist:async(c,e)=>{checkpoint=C.clone(e);chat[c.floor].variables=[{stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}}];},replaceOpening:async t=>chat[0].mes=t,replaceStory:async(i,t)=>chat[i].mes=t,send:async t=>chat.push({mes:t,is_user:true}),setPrompt:()=>{},report:()=>{}};
 const r=createDispatcher(adapter,data),plugin=createPromotionPlugin(data.promotionDefinitions,data.nodeStories);r.registerPlugin(plugin);
 const open=async()=>r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'赵无忧'}});
 const click=async id=>{const s=r.getSnapshot();return r.dispatchIntent({type:'SELECT_NODE',pluginId:plugin.id,expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:id}});};
 const reply=async text=>{chat.push({is_user:false,mes:text,swipe_id:0});await r.settleStory();};
 const metric=async(name,value)=>r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:name,key:'好感度',value}});
 const report=a=>'<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">'+a+'</Promotion_result>';
 const phase=name=>r.getSnapshot().stat_data.character_stages[name].id;
 return {r,plugin,chat,open,click,reply,metric,report,phase};
}
test('双姝四关共同门禁与原子提交，准备是不得升阶，阶段条目两人同时启用',async()=>{
 const h=fixture();await h.open();for(let i=1;i<=4;i++){
  for(const name of ['苏瑶','苏玲'])await h.metric(name,i*20);
  await h.metric('苏玲',i*20-1);await assert.rejects(h.click('sySlEnter'+i),/不满足/);await h.metric('苏玲',i*20);
  await h.click('sySlEnter'+i);const code=h.r.getSnapshot().pending.actionCode;await h.reply('二人向你说明心意。<Promotion_ready id="'+code+'">是</Promotion_ready>');
  assert.equal(h.phase('苏瑶'),'stage0'+i);assert.equal(h.phase('苏玲'),'stage0'+i);await h.click('sySlFinish'+i);await h.reply(h.report('是'));
  assert.equal(h.phase('苏瑶'),'stage0'+(i+1));assert.equal(h.phase('苏玲'),'stage0'+(i+1));const stat=h.r.getSnapshot().stat_data;
  for(const name of ['苏瑶','苏玲'])assert.equal(data.embeddedManagedEntries.filter(x=>x.comment.startsWith('【人物阶段】'+name+':stage')&&managedEnabled(x.comment,stat)).length,1);
  await h.r.restore();assert.equal(h.phase('苏玲'),'stage0'+(i+1));
 }
 assert.notEqual(h.r.getSnapshot().known['灵犀同心成形'],true);assert.equal(Object.keys(h.r.getSnapshot().stat_data.名器归属).length,0);
});
test('双姝错ID/否不升任何人，删除成功回复同时回滚两人；不同阶段不得提交',async()=>{
 const h=fixture();await h.open();await h.metric('苏瑶',20);await h.metric('苏玲',20);await h.click('sySlEnter1');await h.reply('三人同席论道。');await h.click('sySlFinish1');await h.reply('<Promotion_result id="old">是</Promotion_result>');assert.equal(h.phase('苏瑶'),'stage01');assert.equal(h.phase('苏玲'),'stage01');
 await h.click('sySlFinish1');await h.reply(h.report('是'));h.chat.pop();await h.r.restore();assert.equal(h.phase('苏瑶'),'stage01');assert.equal(h.phase('苏玲'),'stage01');await h.reply(h.report('否'));assert.equal(h.phase('苏玲'),'stage01');
 const {completeStages}=require('../src/runtime/character_stages'),s=C.clone(h.r.getSnapshot());s.stat_data.character_stages.苏玲.id='stage02';const before=C.clone(s.stat_data.completed_character_stages || {});
 assert.throws(()=>completeStages(s,data.characterProfiles,[{character:'苏瑶',from:'stage01',to:'stage02'},{character:'苏玲',from:'stage01',to:'stage02'}]),/同时/);assert.deepEqual(s.stat_data.completed_character_stages || {},before);
});
test('六人新线可用；共同单轨无需双身份复制，苏倾寒支持90门槛及灾前人物可见',async()=>{
 for(const [name,prefix,count] of [['闻观语','wg',4],['楚灵夜','cl',4],['顾云舒','gys',4],['苏倾寒','sqh',5]]){
  const h=fixture();await h.open();
  if(name==='苏倾寒'){await h.r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:{year:1578,month:8,day:1}}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['calendarDate']}});}
  for(let i=1;i<=count;i++){
   await h.metric(name,i===5?90:i*20);await h.click(prefix+'Enter'+i);await h.reply('你们在当前场景完成了本次交谈。');await h.click(prefix+'Finish'+i);await h.reply(h.report('是'));assert.equal(h.phase(name),'stage0'+(i+1));
  }
  assert.notEqual(h.r.getSnapshot().known[name+'处女丧失'],true);assert.equal(Object.keys(h.r.getSnapshot().stat_data.名器归属).length,0);
 }
});
test('四角色未完成末关真实强迫企图固定降至-51并锁-50；言语/计划/医疗/他人不罚',async()=>{
 for(const name of ['闻观语','楚灵夜','苏瑶','苏玲']){
  const h=fixture();await h.open();await h.metric(name,40);h.chat.push({mes:'我行动',is_user:true});await h.reply('你强行侵犯'+name+'，她反抗阻止，你未能得逞。');const s=h.r.getSnapshot();assert.equal(s.stat_data.character_metrics[name].好感度,-51);assert.equal(s.stat_data.character_metric_caps[name].好感度,-50);
  await assert.rejects(h.metric(name,-49),/永久/);await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.character_metrics[name].好感度,-51);
 }
 for(const body of ['你计划强行侵犯闻观语。','你扬言强占闻观语。','张三强行侵犯闻观语。','你强行撕开闻观语外袍止血救护。','闻观语说：「你强迫我破身。」','你回忆曾经强迫闻观语破身。']){
  const h=fixture();await h.open();await h.metric('闻观语',40);h.chat.push({mes:'继续',is_user:true});await h.reply(body);assert.equal(h.r.getSnapshot().stat_data.character_metrics.闻观语.好感度,40,body);
 }
 const h=fixture();await h.open();await h.metric('苏瑶',40);await h.metric('苏玲',40);h.chat.push({mes:'继续',is_user:true});await h.reply('你强行侵犯苏玲，苏瑶冲来阻止。');assert.equal(h.r.getSnapshot().stat_data.character_metrics.苏瑶.好感度,40);assert.equal(h.r.getSnapshot().stat_data.character_metrics.苏玲.好感度,-51);
});
test('双姝共同正文事实才成型，只有一人破身不成型；仅关系回报不确权归属',async()=>{
 const h=fixture();await h.open();await h.reply('你与苏瑶、苏玲完成实质结合，两人均已破身落红。<Status_block><破处>苏瑶、赵无忧｜苏玲、赵无忧</破处></Status_block>');assert.equal(h.r.getSnapshot().known['灵犀同心成形'],true);assert.equal(h.r.getSnapshot().stat_data.名器归属.lingxi,'赵无忧');
 const b=fixture();await b.open();await b.reply('你使苏瑶元阴初破，苏玲仍是处子。');assert.equal(b.r.getSnapshot().known['苏瑶处女丧失'],true);assert.notEqual(b.r.getSnapshot().known['苏玲处女丧失'],true);assert.notEqual(b.r.getSnapshot().known['灵犀同心成形'],true);
});
test('双姝各自好感封顶共同节点，强迫罚分不接受伪造标签且会结束当前亲密事件',async()=>{
 const {createMetricEvents}=require('../src/runtime/metric_events'),events=createMetricEvents(data.metricEventDefinitions,data.characterProfiles,data.promotionDefinitions);
 const s={identity:'赵无忧',manual:{},stat_data:{身份:'赵无忧',character_metrics:{苏瑶:{好感度:19},苏玲:{好感度:19}},completed_character_stages:{},在场角色:[{名:'苏瑶'},{名:'苏玲'}]}};
 for(const name of ['苏瑶','苏玲']){const prose=name+'向你致谢，认可你的守信。';events.apply(s,prose+'<好感事件>'+name+'｜记心上｜依据：'+prose+'</好感事件>',prose,1);assert.equal(s.stat_data.character_metrics[name].好感度,20);}
 const h=fixture();await h.open();await h.metric('闻观语',20);await h.click('wgEnter1');await h.reply('你们同席问茶。');h.chat.push({mes:'继续',is_user:true});await h.reply('你没有强行侵犯闻观语。<好感事件>闻观语｜锚点 wg_pozhan｜依据：你没有强行侵犯闻观语。</好感事件>');
 // A tag cannot trigger the fixed penalty when the source negates the action.
 assert.equal(h.r.getSnapshot().stat_data.character_metrics.闻观语.好感度,20);
 h.chat.push({mes:'继续',is_user:true});await h.reply('你强行侵犯闻观语，她阻止你。');assert.equal(h.r.getSnapshot().stat_data.character_metrics.闻观语.好感度,-51);assert.equal(h.r.getSnapshot().activeEvent,null);
});
