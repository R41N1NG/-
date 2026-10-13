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
  const r=createDispatcher(adapter,data),plugin=createPromotionPlugin(data.promotionDefinitions,data.nodeStories);r.registerPlugin(plugin);r.registerPlugin(map);
  const click=(id,p=plugin)=>{const s=r.getSnapshot();return r.dispatchIntent({type:"SELECT_NODE",pluginId:p.id,expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:id}});};
  const reply=async text=>{chat.push({mes:text,is_user:false,swipe_id:0});return r.settleStory();};
  const stage=()=>r.getSnapshot().stat_data.character_stages.叶红缨.id;
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
  const identity=cfg.conditions.find(c=>c.kind==='identity').value,score=cfg.conditions.find(c=>c.kind==='metric').value;
  const s={identity,stat_data:{character_stages:{叶红缨:{id:cfg.fromStage}},character_metrics:{叶红缨:{好感度:score}}}};
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
