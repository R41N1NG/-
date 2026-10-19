"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),path=require("node:path");
const C=require("../src/runtime/contracts"),data=require("../tools/data.cjs").load(path.join(__dirname,".."));
const {createDispatcher}=require("../src/runtime/dispatcher");
const {createPromotionPlugin,resultTag}=require("../src/plugins/promotion");
const map=require("../src/plugins/youjigu_map");
function fixture(){
  const chat=[{mes:"<IdentityMenu/>",variables:[]}], sent=[],prompts=[];let fail=false,checkpoint=null;
  const adapter={readCheckpoint:async()=>C.clone(checkpoint),context:()=>({chatId:"promotion",chat}),readMessage:async i=>C.clone(chat[i]?.variables?.[chat[i]?.swipe_id || 0] || {}),
    persist:async(c,e)=>{checkpoint={...C.clone(e),branchId:c.branchId};chat[c.floor].variables ||= [];chat[c.floor].variables[chat[c.floor].swipe_id || 0]={stat_data:{...C.clone(e.state.stat_data),xsd2:[C.clone(e)]}};},
    replaceOpening:async t=>{chat[0].mes=t;},replaceStory:async(i,t)=>{chat[i].mes=t;},
    send:async t=>{if(fail)throw Error("发送失败");sent.push(t);chat.push({mes:t,is_user:true});},setPrompt:t=>prompts.push(t),report:()=>{},confirmExit:async()=>true};
  const testData = {
    ...data,
    greetings: {
      ...data.greetings,
      赵无忧: data.greetings.赵无忧.replace("3月3日", "4月1日"),
    },
  };
  const r=createDispatcher(adapter,testData),plugin=createPromotionPlugin(data.promotionDefinitions,data.nodeStories);r.registerPlugin(plugin);r.registerPlugin(map);
  const click=(id,p=plugin)=>{const s=r.getSnapshot();return r.dispatchIntent({type:"SELECT_NODE",pluginId:p.id,expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:id}});};
  const reply=async text=>{chat.push({mes:text,is_user:false,swipe_id:0});return r.settleStory();};
  const stage=(character="叶红缨")=>r.getSnapshot().stat_data.character_stages[character].id;
  const ready=async()=>{await r.dispatchIntent({type:"SELECT_IDENTITY",payload:{identity:"赵无忧"}});await r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"叶红缨",key:"好感度",value:20}});};
  const report=answer=>'<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">'+answer+'</Promotion_result>';
  return {chat,sent,prompts,r,plugin,click,reply,stage,ready,report,adapter,fail:v=>{fail=v;}};
}
test("资格20只解锁；入口单次故事开启，普通对话不晋升，完成是才提交且不加故事轮次",async()=>{
  const h=fixture();await h.ready();assert.equal(h.stage(),"stage01");
  await h.click("yhrNight");assert.equal(h.stage(),"stage01");assert.equal(h.r.getSnapshot().activeEvent.pluginId,h.plugin.id);
  assert.match(h.prompts.at(-1),/竹林/);
  await h.reply("你来到竹林，看到叶红缨正在沐浴。<Status_block><在场>叶红缨</在场><地点>洞府后竹林</地点></Status_block>");
  assert.equal(h.stage(),"stage01");
  h.chat.push({mes:"我继续等待",is_user:true});await h.reply("夜风轻拂。<Status_block><地点>竹林</地点></Status_block>");
  assert.equal(h.stage(),"stage01");assert.ok(!h.prompts.at(-1).includes("发现无人回应"));
  const count=h.r.getSnapshot().storyCount,date=h.r.getSnapshot().calendarDate;
  await h.click("yhrFinish");assert.equal(h.stage(),"stage01");
  await h.reply(h.report("是"));assert.equal(h.stage(),"stage02");assert.equal(h.r.getSnapshot().activeEvent,null);
  assert.equal(h.r.getSnapshot().storyCount,count);assert.deepEqual(h.r.getSnapshot().calendarDate,date);
  assert.ok(!h.chat.at(-1).mes.includes("Promotion_result"));
  assert.ok(!h.chat.at(-1).mes.includes("XSD2_"));
  for(const field of C.XML_FIELDS)assert.ok(h.chat.at(-1).mes.includes('<'+field+'>'));
  await h.r.settleStory();await h.r.restore();assert.equal(h.stage(),"stage02");
  await assert.rejects(h.click("yhrNight"),/不满足/);
});
test("否保持阶段一；无效/旧ID/重复回报不成功，保留完成按钮可重试",async()=>{
  for(const value of ["否","invalid","stale","duplicate"]){
    const h=fixture();await h.ready();await h.click("yhrNight");await h.reply("在竹林等待。");
    await h.click("yhrFinish");const valid=h.report("是");
    await h.reply(value === "否" ? h.report("否") : value === "invalid" ? "她微笑，表示成功。" : value === "stale" ? '<Promotion_result id="XSD2_yhrFinish_00000000">是</Promotion_result>' : valid+valid);
    assert.equal(h.stage(),"stage01");
    assert.equal(!!h.r.getSnapshot().activeEvent,value !== "否");
    if(value !== "否") {await h.click("yhrFinish");await h.reply(h.report("是"));assert.equal(h.stage(),"stage02");}
  }
});
test("低好感/其他事件阻止入口；发送失败/停止入口恢复；退出不晋升",async()=>{
  const h=fixture();await h.ready();
  await h.r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"叶红缨",key:"好感度",value:19}});
  await assert.rejects(h.click("yhrNight"),/不满足/);
  await h.r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"叶红缨",key:"好感度",value:20}});
  h.fail(true);await assert.rejects(h.click("yhrNight"),/发送失败/);assert.equal(h.r.getSnapshot().activeEvent,null);
  h.fail(false);await h.click("yhrNight");await h.r.stop();assert.equal(h.r.getSnapshot().activeEvent,null);
  h.chat.pop();await h.r.restore();await h.click("g7p2",map);await h.reply("你已入谷。");
  await assert.rejects(h.click("yhrNight"),/另一个事件/);
  const b=fixture();await b.ready();await b.click("yhrNight");await b.reply("竹林夜风。");
  await assert.rejects(b.click("yhrLeave"),/不满足|未注册/);assert.ok(b.r.getSnapshot().activeEvent);
});
test("停止完成回报、删除成功楼及重生成恢复阶段一，新的否回报不能沿用成功",async()=>{
  const h=fixture();await h.ready();await h.click("yhrNight");await h.reply("你看到她沐浴。");
  await h.click("yhrFinish");await h.r.stop();assert.equal(h.stage(),"stage01");assert.ok(h.r.getSnapshot().activeEvent);
  h.chat.pop();await h.r.restore();await h.click("yhrFinish");await h.reply(h.report("是"));assert.equal(h.stage(),"stage02");
  h.chat.pop();await h.r.restore();assert.equal(h.stage(),"stage01");assert.ok(h.r.getSnapshot().pending);
  await h.reply(h.report("否"));assert.equal(h.stage(),"stage01");
});
test("回报解析限单项与本轮标识，思考/内心标签里的回报不能作为依据",()=>{
  const code="XSD2_yhrFinish_1234abcd",tag='<Promotion_result id="'+code+'">是</Promotion_result>';
  assert.equal(resultTag(tag,code),"是");assert.equal(resultTag(tag+tag,code),null);
  assert.equal(resultTag('<think_nya~>'+tag+'</think_nya~>',code),null);
  assert.equal(resultTag('<details>'+tag+'</details>',code),null);
});

test("晋升前后条目开关一致：基础心智常驻，阶段分身份互斥开启，基础资料不变",async()=>{
  const {storyEntries}=require("../src/runtime/story_entries"),{createWorldbookHost}=require("../src/host/worldbook");
  const testData=require("../tools/data.cjs").load(require("node:path").join(__dirname,".."));
  let entries=[{uid:1,name:"【人物】叶红缨",content:"基础资料",enabled:true},{uid:2,name:"叶红缨 (心智姿态)",content:"原心智",enabled:true},
    ...storyEntries(require("../src/config/node_stories.json"),testData.characterProfiles,100).map(x=>({...x,name:x.comment,enabled:false}))];
  const host=createWorldbookHost({getCharWorldbookNames:async()=>({primary:"测试书"}),getWorldbook:async()=>entries,replaceWorldbook:async(_,rows)=>{entries=rows;}},()=>({}));
  const h=fixture();await h.ready();await h.click("yhrNight");
  await host.synchronizeState(h.r.getSnapshot().stat_data);
  assert.equal(entries.find(x=>x.name==="叶红缨 (心智姿态)").enabled,true);
  assert.equal(entries.find(x=>x.name==="【人物阶段】叶红缨:stage02:赵无忧").enabled,false);
  await h.reply("夜访继续。");await h.click("yhrFinish");await h.reply(h.report("是"));
  await host.synchronizeState(h.r.getSnapshot().stat_data);
  assert.equal(entries.find(x=>x.name==="叶红缨 (心智姿态)").enabled,true);
  assert.equal(entries.find(x=>x.name==="【人物阶段】叶红缨:stage02:赵无忧").enabled,true);
  assert.equal(entries.find(x=>x.name==="【人物阶段】叶红缨:stage02:自设").enabled,false);
  assert.equal(entries.find(x=>x.name==="【人物】叶红缨").enabled,true);
});

test("自设散修专属晋升：只显示自设节点，完成后点亮自设阶段条目",async()=>{
  const {storyEntries}=require("../src/runtime/story_entries"),{createWorldbookHost}=require("../src/host/worldbook");
  const testData=require("../tools/data.cjs").load(require("node:path").join(__dirname,".."));
  let entries=[{uid:1,name:"【人物】叶红缨",content:"基础资料",enabled:true},{uid:2,name:"叶红缨 (心智姿态)",content:"原心智",enabled:true},
    ...storyEntries(require("../src/config/node_stories.json"),testData.characterProfiles,100).map(x=>({...x,name:x.comment,enabled:false}))];
  const host=createWorldbookHost({getCharWorldbookNames:async()=>({primary:"测试书"}),getWorldbook:async()=>entries,replaceWorldbook:async(_,rows)=>{entries=rows;}},()=>({}));
  const h=fixture();
  await h.r.dispatchIntent({type:"SELECT_IDENTITY",payload:{identity:"自设",custom:{date:{year:1577,month:7,day:1},name:"云游散修",realm:"化神前期"}}});
  await h.r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"叶红缨",key:"好感度",value:20}});
  const list = h.plugin.list(h.r.getSnapshot());
  assert.equal(list.some(x=>x.cfg.entryId === "yhrNight"), false);
  assert.equal(list.some(x=>x.cfg.entryId === "yhrRogueEnter1"), true);
  await h.click("yhrRogueEnter1");
  assert.match(h.prompts.at(-1),/金丹前期妖兽/);
  await h.reply("妖兽袭来，叶红缨御火轰击。");
  await h.click("yhrRogueFinish1");
  await h.reply(h.report("是"));
  assert.equal(h.stage(),"stage02");
  await host.synchronizeState(h.r.getSnapshot().stat_data);
  assert.equal(entries.find(x=>x.name==="叶红缨 (心智姿态)").enabled,true);
  assert.equal(entries.find(x=>x.name==="【人物阶段】叶红缨:stage02:自设").enabled,true);
  assert.equal(entries.find(x=>x.name==="【人物阶段】叶红缨:stage02:赵无忧").enabled,false);
});

test('完成后正常新输入保留结算状态；重生成才恢复结算前并重新核验',async()=>{
 for(const answer of ['是','否']){
  const h=fixture();await h.ready();await h.click('yhrNight');await h.reply('你看到她沐浴。');await h.click('yhrFinish');await h.reply(h.report(answer));
  const completedStage=answer==='是'?'stage02':'stage01';
  await h.r.replay('normal');assert.equal(h.stage(),completedStage);assert.equal(h.r.getSnapshot().pending,null);assert.equal(h.r.getSnapshot().activeEvent,null);assert.ok(!h.prompts.at(-1).includes('Promotion_result'));
  // Explicit regeneration of this callback must still restore its authorized pending.
  await h.r.replay('regenerate');assert.equal(h.stage(),'stage01');assert.equal(h.r.getSnapshot().pending.nodeId,'yhrFinish');assert.ok(h.prompts.at(-1).includes('Promotion_result'));
  h.chat.pop();await h.reply(h.report('否'));assert.equal(h.stage(),'stage01');await h.r.replay('normal');assert.equal(h.r.getSnapshot().pending,null);
 }
});
test('双身份八个晋升入口都连接现有故事；40点节点可发送并完成',async()=>{
 const plugin=createPromotionPlugin(data.promotionDefinitions,data.nodeStories);
 for(const cfg of Object.values(data.promotionDefinitions)){
  const identity=cfg.conditions.find(c=>c.kind==='identity')?.value || '赵无忧',score=cfg.conditions.find(c=>c.kind==='metric').value;
  const names=cfg.participants || [cfg.character],s={identity,calendarDate:{year:1578,month:8,day:1},stat_data:{character_stages:Object.fromEntries(names.map(n=>[n,{id:cfg.fromStage}])),character_metrics:Object.fromEntries(names.map(n=>[n,{好感度:score}]))}};
  const selected=plugin.select(s,cfg.entryId);assert.equal(selected.allowed,true);assert.ok(selected.prompt?.trim());assert.ok(data.embeddedManagedEntries.some(e=>e.comment==='【节点故事】'+cfg.entryId));
 }
 const h=fixture();await h.ready();await h.click('yhrNight');await h.reply('你看到她沐浴。');await h.click('yhrFinish');await h.reply(h.report('是'));
 await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'叶红缨',key:'好感度',value:40}});
 await h.click('yhrZwEnter1');assert.match(h.sent.at(-1),/^XSD2_yhrZwEnter1_/);assert.ok(h.prompts.at(-1).includes(data.nodeStories.yhrZwEnter1.content));
 await h.reply('赤焰居中，她与你对饮。');await h.click('yhrZwFinish1');await h.reply(h.report('是'));assert.equal(h.stage(),'stage03');
});

test('三段晋升完成与刷新：助手正文归一化和楼层变量缺失不清零，聊天备份保留60点与阶段四',async()=>{
 const h=fixture();await h.ready();
 for(const [score,entry,finish] of [[20,'yhrNight','yhrFinish'],[40,'yhrZwEnter1','yhrZwFinish1'],[60,'yhrZwEnter2','yhrZwFinish2']]){
  await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'叶红缨',key:'好感度',value:score}});
  await h.click(entry);await h.reply('本次专属剧情已经发生。');await h.click(finish);
  // Native host can normalize prior assistant text and lose its variable slot.
  for(const m of h.chat){if(!m.is_user){m.mes+='\n';m.variables=[];}}
  await h.reply(h.report('是'));
 }
 assert.equal(h.stage(),'stage04');
 for(const m of h.chat)if(!m.is_user)m.variables=[];
 const restored=createDispatcher(h.adapter,data);restored.registerPlugin(h.plugin);await restored.restore();
 const s=restored.getSnapshot();assert.equal(s.stat_data.character_stages.叶红缨.id,'stage04');assert.equal(s.stat_data.character_metrics.叶红缨.好感度,60);assert.equal(s.pending,null);
});
test('快照容忍助手正文变化，但用户代码、候选、角色变化仍隔离；并发校验保持严格',()=>{
 const a=C.fingerprint([{mes:'正文',swipe_id:0},{mes:'XSD2_action',is_user:true}]);
 const b=C.fingerprint([{mes:'正文\n',swipe_id:0},{mes:'XSD2_action',is_user:true}]);
 assert.equal(C.matchesSnapshot(a,b),true);assert.equal(C.matches(a,b),false);
 for(const chat of [[{mes:'正文',swipe_id:1},{mes:'XSD2_action',is_user:true}],[{mes:'正文'},{mes:'XSD2_other',is_user:true}],[{mes:'正文',is_user:true},{mes:'XSD2_action',is_user:true}]])assert.equal(C.matchesSnapshot(a,C.fingerprint(chat)),false);
});
test('已有快照全部不兼容时停止初始化，不覆盖原有记录为零',async()=>{
 const h=fixture();await h.ready();const old=JSON.stringify(h.chat[0].variables);h.chat[0].swipe_id=1;
 const restored=createDispatcher(h.adapter,data);await assert.rejects(restored.restore(),/保护存档/);assert.equal(JSON.stringify(h.chat[0].variables),old);
});

test('正常输入不因回复格式变化重放完成判定，未完成回报被新自由输入替代时撤回指令',async()=>{
 const h=fixture();await h.ready();await h.click('yhrNight');await h.reply('本次场景已经发生。');await h.click('yhrFinish');await h.reply(h.report('是'));
 h.chat.at(-1).mes+='\n';await h.r.replay('normal');assert.equal(h.stage(),'stage02');assert.equal(h.r.getSnapshot().pending,null);assert.ok(!h.prompts.at(-1).includes('Promotion_result'));
 const k=fixture();await k.ready();await k.click('yhrNight');await k.reply('本次场景已经发生。');await k.click('yhrFinish');
 k.chat.push({is_user:true,mes:'请她喝酒'});await k.r.replay('normal');assert.equal(k.r.getSnapshot().pending,null);assert.ok(k.r.getSnapshot().activeEvent);assert.ok(!k.prompts.at(-1).includes('Promotion_result'));await k.reply('她接过酒杯。');assert.equal(k.stage(),'stage01');
});
test('删掉完成回复撤回判定但保留本次故事与好感，完成可以重新点击',async()=>{
 const h=fixture();await h.ready();await h.click('yhrNight');await h.reply('本次场景已经发生。');await h.click('yhrFinish');const oldCode=h.r.getSnapshot().pending.actionCode;await h.reply(h.report('是'));
 h.chat.pop();await h.r.restore({afterDelete:true});assert.equal(h.stage(),'stage01');assert.equal(h.r.getSnapshot().pending,null);assert.ok(h.r.getSnapshot().activeEvent);assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,20);assert.ok(!h.prompts.at(-1).includes('Promotion_result'));
 await h.click('yhrFinish');assert.notEqual(h.r.getSnapshot().pending.actionCode,oldCode);await h.reply(h.report('是'));assert.equal(h.stage(),'stage02');
});
test('自由回合准备是只提示、不晋升；刷新/删楼恢复，点击完成才切阶段',async()=>{
 const h=fixture();await h.ready();await h.click('yhrNight');const code=h.r.getSnapshot().pending.actionCode;
 assert.match(h.prompts.at(-1),/Promotion_ready/);await h.reply('你看见她沐浴。<Promotion_ready id="'+code+'">是</Promotion_ready>');
 assert.equal(h.stage(),'stage01');assert.equal(h.r.getSnapshot().pluginState.character_promotion.ready,true);assert.equal(h.r.getSnapshot().pending,null);await h.r.restore();assert.equal(h.r.getSnapshot().pluginState.character_promotion.ready,true);
 h.chat.push({is_user:true,mes:'继续'});await h.reply('<Promotion_ready id="wrong">是</Promotion_ready>');assert.equal(h.stage(),'stage01');
 await h.click('yhrFinish');await h.reply(h.report('是'));assert.equal(h.stage(),'stage02');assert.equal(h.r.getSnapshot().activeEvent,null);
 // Simulate native variables being lost and only the latest completed checkpoint remaining.
 const last=await h.adapter.readCheckpoint();h.chat.forEach(m=>m.variables=[]);h.chat.pop();h.adapter.readCheckpoint=async()=>C.clone(last);await h.r.restore();assert.equal(h.stage(),'stage01');assert.ok(h.r.getSnapshot().pending);
 await h.reply(h.report('是'));assert.equal(h.stage(),'stage02');
});
test('自设20/40/60完整链条有各自完成ID，准备回报不能代替完成结算',async()=>{
 const h=fixture();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{name:'试点',realm:'金丹前期',date:{year:1578,month:4,day:1}}}});await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'叶红缨',key:'好感度',value:60}});
 for(const [entry,finish,from,to]of [['yhrRogueEnter1','yhrRogueFinish1','stage01','stage02'],['yhrRogueEnter2','yhrRogueFinish2','stage02','stage03'],['yhrRogueEnter2b','yhrRogueFinish2b','stage03','stage04']]){
 await h.click(entry);const code=h.r.getSnapshot().pending.actionCode;await h.reply('<Promotion_ready id="'+code+'">否</Promotion_ready>');assert.equal(h.r.getSnapshot().pluginState.character_promotion.ready,false);
 h.chat.push({is_user:true,mes:'继续本次剧情'});await h.reply('<Promotion_ready id="'+code+'">是</Promotion_ready>');assert.equal(h.stage(),from);assert.equal(h.r.getSnapshot().pluginState.character_promotion.ready,true);await h.click(finish);await h.reply(h.report('是'));assert.equal(h.stage(),to);
 }
});
test('删结算回复后重试复用同一玩家指令，不发第二条消息、不提前晋升',async()=>{
 const h=fixture();await h.ready();await h.click('yhrNight');await h.reply('你已经看见她沐浴。');await h.click('yhrFinish');const sent=h.sent.length,userFloor=h.chat.length-1,code=h.r.getSnapshot().pending.actionCode;let retries=0;h.adapter.retryGeneration=()=>retries++;
 await h.r.restore();const s=h.r.getSnapshot();await h.r.dispatchIntent({type:'RETRY_COMPLETION',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision}});assert.equal(retries,1);assert.equal(h.sent.length,sent);assert.equal(h.chat.length-1,userFloor);assert.equal(h.stage(),'stage01');assert.equal(h.r.getSnapshot().pending.actionCode,code);
 await h.reply(h.report('是'));assert.equal(h.stage(),'stage02');await assert.rejects(h.r.dispatchIntent({type:'RETRY_COMPLETION'}),/没有可重试/);
});

test("孤月双轨八节点：阈值/顺序/身份隔离、准备提示、点击完成与世界书互斥完整链",async()=>{
 const {managedEnabled}=require('../src/runtime/story_entries');
 for(const identity of ['赵无忧','自设']){
  const h=fixture();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity,...(identity==='自设'?{custom:{date:{year:1578,month:4,day:1},name:'测试修士',realm:'金丹前期'}}:{})}});
  const defs=Object.values(data.promotionDefinitions).filter(x=>x.character==='孤月'&&x.conditions.some(c=>c.kind==='identity'&&c.value===identity));assert.equal(defs.length,4);
  const inventory=C.clone(h.r.getSnapshot().stat_data.inventory),known=C.clone(h.r.getSnapshot().known);
  for(const cfg of defs){
   const threshold=cfg.conditions.find(c=>c.kind==='metric').value;
   await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'孤月',key:'好感度',value:threshold-1}});await assert.rejects(h.click(cfg.entryId),/不满足/);
   await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'孤月',key:'好感度',value:threshold}});
   const other=Object.values(data.promotionDefinitions).find(x=>x.character==='孤月'&&x.fromStage===cfg.fromStage&&x.entryId!==cfg.entryId);await assert.rejects(h.click(other.entryId),/不满足/);
   await assert.rejects(h.click(cfg.finishId),/不满足/);await h.click(cfg.entryId);assert.equal(h.stage('孤月'),cfg.fromStage);
   assert.match(h.prompts.at(-1),/孤月/);assert.equal(h.r.getSnapshot().activeEvent.character,'孤月');
   const code=h.r.getSnapshot().pending.actionCode;
   await h.reply('孤月等候你的回应。<Promotion_ready id="'+code+'">是</Promotion_ready>');assert.equal(h.stage('孤月'),cfg.fromStage);assert.equal(h.r.getSnapshot().pluginState.character_promotion.ready,true);
   await h.click(cfg.finishId);assert.ok(h.prompts.at(-1).includes(cfg.query));
   await h.reply(h.report('是'));assert.ok(h.chat.at(-1).mes.includes(cfg.label+'已告一段落'));assert.equal(h.stage('孤月'),cfg.toStage);assert.equal(h.stage(),'stage01');assert.equal(h.r.getSnapshot().activeEvent,null);
   const stat={...h.r.getSnapshot().stat_data,在场角色:[{名:'孤月'}]};
   const enabled=data.embeddedManagedEntries.filter(x=>x.comment.startsWith('【人物阶段】孤月:')&&managedEnabled(x.comment,stat));assert.deepEqual(Array.from(enabled,x=>x.comment),['【人物阶段】孤月:'+cfg.toStage+':'+identity]);
   await h.r.restore();assert.equal(h.stage('孤月'),cfg.toStage);await assert.rejects(h.click(cfg.entryId),/不满足/);
  }
  assert.deepEqual(h.r.getSnapshot().stat_data.inventory,inventory);assert.equal(h.r.getSnapshot().known['九幽玄阴穴成形'],known['九幽玄阴穴成形']);assert.deepEqual(h.r.getSnapshot().stat_data.名器归属,{});
 }
});
test("孤月节点错ID、否、删除完成楼及重结算不会借用红缨阶段或奖励",async()=>{
 const h=fixture();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'赵无忧'}});await h.r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'孤月',key:'好感度',value:20}});
 await h.click('gyZwEnter1');await h.reply('孤月静候交流。');await h.click('gyZwFinish1');
 await h.reply('<Promotion_result id="XSD2_yhrFinish_00000000">是</Promotion_result>');assert.equal(h.stage('孤月'),'stage01');assert.ok(h.r.getSnapshot().activeEvent);
 await h.click('gyZwFinish1');await h.reply(h.report('否'));assert.equal(h.stage('孤月'),'stage01');assert.equal(h.r.getSnapshot().activeEvent,null);
 await h.click('gyZwEnter1');await h.reply('二人交流。');await h.click('gyZwFinish1');await h.reply(h.report('是'));assert.equal(h.stage('孤月'),'stage02');
 h.chat.pop();await h.r.restore();assert.equal(h.stage('孤月'),'stage01');assert.ok(h.r.getSnapshot().pending);await h.reply(h.report('否'));assert.equal(h.stage('孤月'),'stage01');assert.equal(h.stage(),'stage01');
});

test('结果标签容忍单引号与排版空白，但仍严格绑定当前编号和唯一答案',()=>{
 const {parseResultTag}=require('../src/plugins/promotion');
 const code='XSD2_check_1234abcd';
 assert.equal(resultTag("<Promotion_result  id = '"+code+"' > 是 </Promotion_result >",code),'是');
 assert.equal(resultTag('<promotion_result id="'+code+'">否</promotion_result>',code),'否');
 assert.equal(parseResultTag('<Promotion_result id="wrong">是</Promotion_result>',code).status,'wrong_id');
 assert.equal(parseResultTag('<Promotion_result id="'+code+'">是</Promotion_result><Promotion_result id="'+code+'">否</Promotion_result>',code).status,'multiple');
 assert.equal(parseResultTag('<Promotion_result id="'+code+'">是',code).status,'malformed');
 assert.equal(parseResultTag('未返回标签',code).status,'missing');
 assert.equal(resultTag('<Promotion_result id="'+code+'" id="wrong">是</Promotion_result>',code),null);
});
test('参考示例、历史块及未闭合思考中的结果不能被当作正式回报',()=>{
 const code='XSD2_check_1234abcd',packet='<Promotion_result id="'+code+'">是</Promotion_result>';
 for(const name of ['Reference_Example','recall','history','memory','summary'])assert.equal(resultTag('<'+name+'>'+packet+'</'+name+'>',code),null);
 for(const start of ['<thinking>','<analysis>','<details>'])assert.equal(resultTag(start+packet,code),null);
});
