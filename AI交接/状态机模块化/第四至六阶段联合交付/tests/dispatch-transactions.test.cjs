'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {quiet,readSource,loadFactory,defer,setup,loadEnvironment} = require('./dispatch-fixture.cjs');
const valid = () => ({身份:'自设',阵营:'散修',段位:1,仙盟历:1578.03,仙盟历文:'1578 年三月初三',历基准:1578*12+2+2/30,历时累计:0,known:{},inventory:[{id:'test-sword',name:'随身青锋剑',count:1}],relic_progress:{}});

test('同部署 correction runtime 原样存证，使用真实持久化服务',()=>{
  const bytes = fs.readFileSync(path.join(__dirname,'fixtures/correction-runtime.js'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'1d07f7aab5f5b90b3744adc9b5d4a84cbd2e6d8e4a58231cb1b0a471b525b245');
});
test('加载真实生产片段只创建模块，不写变量',()=>{
  const x = setup(valid()), {env} = loadEnvironment(x);
  assert.equal(env.ALL_FIELDS.length,122);
  assert.equal(x.writes.length,0);
});
test('真实合并读恢复聊天层人工覆盖；消息层旧覆盖不复活',()=>{
  const x = setup(valid());
  const key = JSON.stringify(['known','天溪城兽潮']);
  x.layers.chat.stat_data.人工纠错 = {chatId:'A',覆盖:{[key]:{path:['known','天溪城兽潮'],value:false}}};
  x.layers.message.stat_data.人工纠错 = {chatId:'A',覆盖:{[key]:{path:['known','天溪城兽潮'],value:true}}};
  const {env} = loadEnvironment(x);
  assert.equal(env.readStatData().known.天溪城兽潮,false);
  x.layers.chat.stat_data.人工纠错 = null;
  const sd = env.readStatData();
  assert.equal(sd.人工纠错,null);
  assert.equal(sd.known.天溪城兽潮,undefined);
});
function operationSetup(initial = valid(), faults = {}) {
  const x = setup(initial);
  const names = ['XSD_INVENTORY_DEPS','XSD_INITIALIZER_DEPS','XSD_MILESTONE_DEPS','XSD_STATUS_DEPS','createXsdInventoryRules','createXsdInitializer','createXsdMilestoneApplication','createXsdStatusApplication','L_CHAT','hashText','messageText','latestMessageId','ensureInit','syncIdentityFromFirstMes','reconcileNadeLedger','handleUserCommand','swallowCommandMessage','detectInheritance','applyInheritedArchive','proposeAnchors','checkOutputContract','toast'];
  const {env} = loadEnvironment(x,names);
  const factory = loadFactory('state/status-operation.js','createXsdStatusOperation');
  let commits = 0;
  function buildOperation(outerGuard) {
  const token = x.service.capture(env.API);
  const guard = () => { if(outerGuard)outerGuard(); if(faults.guard)faults.guard(); if(!x.service.eq(x.service.capture(env.API),token))throw Error('测试 guard: 聊天/最新楼/epoch 已变化'); };
  const op = factory({
    readStatData:env.readStatData,
    writeStat:(...args)=>{commits++;return env.writeStat(...args);},
    readLayer:opt=>faults.readLayer ? faults.readLayer(x,env,opt) : env.API.getVariables(opt),service:x.service,chatId:token.chatId,guard,
    clone:x.service.clone,merge:x.service.merge,
    inventoryDeps:env.XSD_INVENTORY_DEPS,initializerDeps:env.XSD_INITIALIZER_DEPS,
    milestoneDeps:env.XSD_MILESTONE_DEPS,statusDeps:env.XSD_STATUS_DEPS,
    createInventory:env.createXsdInventoryRules,createInitializer:env.createXsdInitializer,
    createMilestones:env.createXsdMilestoneApplication,createApplication:env.createXsdStatusApplication,L_CHAT:env.L_CHAT,
  });
  return op;
  }
  const op = buildOperation();
  return {...x,env,op,buildOperation,get commits(){return commits;}};
}
const statusText = '<Status_block><地点>庭院</地点><历时>半日</历时></Status_block>';
test('真实状态应用多次草稿写只提交一笔，双层地点与日期一致',async()=>{
  const x = operationSetup();
  const r = await x.op.run(statusText,1,{swipeId:0});
  assert.equal(r.ok,true);assert.equal(r.mode,'status');assert.equal(r.commits,1);
  assert.equal(x.commits,1);assert(r.plannedWrites>1);
  assert.equal(x.writes.length,2);
  assert.equal(x.layers.chat.stat_data.地点,'庭院');
  assert.equal(x.layers.chat.stat_data.最后处理楼号,1);
  assert.equal(x.layers.chat.stat_data.仙盟历,x.layers.message.stat_data.仙盟历);
  assert.equal(x.layers.chat.stat_data.仙盟历文,x.layers.message.stat_data.仙盟历文);
});
test('无状态栏真实 fallback 一笔提交并标楼号，日期保持',async()=>{
  const x = operationSetup();const date = x.layers.chat.stat_data.仙盟历;
  const r = await x.op.run('庭院安静，无事发生。',1);
  assert.equal(r.ok,true);assert.equal(r.mode,'fallback');assert.equal(x.commits,1);
  assert.equal(x.layers.chat.stat_data.最后处理楼号,1);
  assert.equal(x.layers.chat.stat_data.仙盟历,date);
});
test('消息层返回 false 时真实服务补偿 chat，operation 不报成功',async()=>{
  const x = operationSetup();
  x.setMode((p,o)=>o.type==='message'&&p.stat_data?.地点==='庭院'?'false':null);
  const r = await x.op.run(statusText,1);
  assert.equal(r.ok,false);assert.match(r.why,/失败|补偿/);
  assert.notEqual(x.layers.chat.stat_data.地点,'庭院');
  assert.equal(x.layers.chat.stat_data.仙盟历,1578.03);
});
test('消息层假成功但不落盘时真实 readback 拒绝，允许再次运行',async()=>{
  const x = operationSetup();
  x.setMode((p,o)=>o.type==='message'&&p.stat_data?.地点==='庭院'?'omit':null);
  const r = await x.op.run(statusText,1);assert.equal(r.ok,false);
  assert.match(r.why,/回读不一致/);
  x.setMode(null);
  const retry = await x.op.run(statusText,1);assert.equal(retry.ok,true);
  assert.equal(x.layers.chat.stat_data.地点,'庭院');
});
test('人工日期/段位覆盖被真实服务保护，不误报完整回读失败',async()=>{
  const x = operationSetup();
  const p = await x.service.preview(x.env.API,{personalStage:2});
  await x.service.save(x.env.API,p);
  x.writes.splice(0);
  const r = await x.op.run(statusText,1);
  assert.equal(r.ok,true);assert.equal(x.layers.chat.stat_data.段位,2);
  assert.equal(x.layers.message.stat_data.段位,2);
});
test('规划开始前 chat 改变、最新楼变化、epoch 往返变化均不调用持久化',async()=>{
  for(const mutation of [x=>{x.context.chatId='B';},x=>{x.context.chat.push({mes:'下一楼'});},x=>{x.service.onChatChanged();}]) {
    const x = operationSetup();mutation(x);
    await assert.rejects(x.op.run(statusText,1),/变化/);
    assert.equal(x.commits,0);assert.equal(x.writes.length,0);
  }
});
test('await 规划期间换 chat/latest/epoch，原任务在真实提交前终止',async()=>{
  for(const mutation of [x=>{x.context.chatId='B';},x=>{x.context.chat.push({mes:'下一楼'});},x=>{x.service.onChatChanged();}]) {
    const x = operationSetup();
    const running = x.op.run(statusText,1);mutation(x);
    await assert.rejects(running,/变化/);
    assert.equal(x.commits,0);assert.equal(x.writes.length,0);
  }
});
test('统一服务提交后的外部层变化不确认；重试恢复且历时不双加',async()=>{
  let sabotage = true;
  const x = operationSetup(valid(),{readLayer:(x,env,opt)=>{
    if(sabotage) {sabotage=false;x.layers.message.stat_data.地点='其他更新';}
    return env.API.getVariables(opt);
  }});
  const r = await x.op.run(statusText,1);assert.equal(r.ok,false);assert.equal(r.partial,true);
  assert.match(r.why,/完整状态事务双层回读不一致/);
  const acc = x.layers.chat.stat_data.历时累计;
  const retry = await x.op.run(statusText,1);assert.equal(retry.ok,true);
  assert.equal(x.layers.chat.stat_data.历时累计,acc);
  assert.equal(x.layers.message.stat_data.地点,'庭院');
});
test('真实 service 第一层 await 中换聊天，不后续写消息层或新聊天补偿',async()=>{
  const x = operationSetup();
  x.setMode((p,o)=>{if(o.type==='chat')x.context.chatId='B';return null;});
  await assert.rejects(x.op.run(statusText,1),/变化/);
  assert.equal(x.writes.length,1);assert.equal(x.writes[0].options.type,'chat');
});
function dispatcherSetup(faults = {}) {
  const x = operationSetup(valid(),faults.operation || {});
  x.context.chat[1].mes = statusText;
  const factory = loadFactory('runtime/dispatcher-core.js','createXsdDispatcher');
  const createTransactions = loadFactory('runtime/message-transactions.js','createXsdMessageTransactions');
  const timers = new Map(), events = new Map(), domEvents = new Map();let seq = 0, cancels = 0, plans = 0;
  const eventNames = ['MESSAGE_SENT','MESSAGE_RECEIVED','CHARACTER_MESSAGE_RENDERED','CHAT_CHANGED','CHAT_CREATED','MESSAGE_SWIPED'];
  const EVENTS = Object.fromEntries(eventNames.map(n=>[n,n]));
  x.env.API.eventOn = (name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);return {stop:()=>events.get(name).delete(fn)};};
  x.host.addEventListener = (name,fn)=>{if(!domEvents.has(name))domEvents.set(name,new Set());domEvents.get(name).add(fn);};
  x.host.removeEventListener = (name,fn)=>domEvents.get(name)?.delete(fn);
  const d = factory({
    window:x.host, API:x.env.API, EVENTS, console:quiet, TAG:'[测试]',VERSION:'test',ALL_FIELDS:x.env.ALL_FIELDS,
    contextKey:()=>x.service.capture(x.env.API).chatId,
    latestMessageId:x.env.latestMessageId,messageText:x.env.messageText,hashText:x.env.hashText,createTransactions,
    runStatus:async(text,id,options,guard)=>{plans++;if(faults.beforeRun)await faults.beforeRun(x,text,id,guard);guard();return x.buildOperation(guard).run(text,id,options);},
    ensureInit:faults.ensureInit || x.env.ensureInit,
    syncIdentityFromFirstMes:x.env.syncIdentityFromFirstMes,
    reconcileNadeLedger:x.env.reconcileNadeLedger,ensureMenuBound:()=>{},
    handleUserCommand:x.env.handleUserCommand,swallowCommandMessage:x.env.swallowCommandMessage,
    detectInheritance:x.env.detectInheritance,applyInheritedArchive:x.env.applyInheritedArchive,
    proposeAnchors:x.env.proposeAnchors,checkOutputContract:x.env.checkOutputContract,
    readLayer:opt=>faults.readLayer ? faults.readLayer(x,opt) : x.env.API.getVariables(opt),L_CHAT:x.env.L_CHAT,service:x.service,
    setTimeout:(fn,delay)=>{const id=++seq;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),
    requestCancel:async()=>{cancels++;return faults.requestCancel ? faults.requestCancel(x) : {requested:true,confirmed:false};},toast:()=>{},
  });
  return {...x,d,timers,events,domEvents,get commits(){return x.commits;},get cancels(){return cancels;},get plans(){return plans;}};
}

test('事件与 tick 同签名并发共用同一 Promise，只规划/提交一次',async()=>{
  const gate = defer();const x = dispatcherSetup({beforeRun:()=>gate.promise});
  const fromEvent = x.d.onAiMessageReceived(1), fromTick = x.d.xsdStateTick(1,statusText,'iframe');
  assert.equal(fromEvent,fromTick);await new Promise(setImmediate);assert.equal(x.plans,1);
  gate.resolve();const r = await fromEvent;assert.equal(r.ok,true);assert.equal(x.commits,1);
  assert.equal(x.d.transactions.seenMessages.size,1);
  const duplicate = await x.d.xsdStateTick(1,statusText);assert.equal(duplicate.duplicate,true);assert.equal(x.commits,1);
});
test('事务 false/readback 不一致不确认去重，第二次触发真实重试成功',async()=>{
  for(const mode of ['false','omit']) {
    const x = dispatcherSetup();x.setMode((p,o)=>o.type==='message'&&p.stat_data?.地点==='庭院'?mode:null);
    const failed = await x.d.xsdStateTick(1,statusText);assert.equal(failed.ok,false);
    assert.equal(x.d.transactions.seenMessages.size,0);assert.equal(x.d.transactions.pending.size,0);
    x.setMode(null);const retried = await x.d.onAiMessageReceived(1);assert.equal(retried.ok,true);
    assert.equal(x.d.transactions.seenMessages.size,1);assert.equal(x.commits,2);
  }
});
test('同楼新正文排队有序；旧任务等待期间正文变更不落盘',async()=>{
  const gate = defer(), entered = [];
  const x = dispatcherSetup({beforeRun:async(x,text)=>{entered.push(text);if(entered.length===1)await gate.promise;}});
  const first = x.d.onAiMessageReceived(1);await new Promise(setImmediate);
  const newText = statusText.replace('庭院','山门');x.context.chat[1].mes = newText;
  const second = x.d.xsdStateTick(1,newText);await new Promise(setImmediate);assert.equal(entered.length,1);
  gate.resolve();assert.equal((await first).ok,false);assert.equal((await second).ok,true);
  assert.equal(entered.length,2);assert.equal(x.commits,1);assert.equal(x.layers.chat.stat_data.地点,'山门');
});
test('同楼 swipe 更新排队，旧任务释放；新 swipe 独立提交',async()=>{
  const gate = defer();let runs = 0;
  const x = dispatcherSetup({beforeRun:()=>++runs===1?gate.promise:undefined});
  const first = x.d.onAiMessageReceived(1);await new Promise(setImmediate);x.context.chat[1].swipe_id = 1;
  const second = x.d.xsdStateTick(1,statusText);assert.notEqual(first,second);
  gate.resolve();assert.equal((await first).ok,false);assert.equal((await second).ok,true);assert.equal(x.commits,1);
});
test('跨 chat、最新楼、epoch 变旧的排队任务不调用真实 writeStat',async()=>{
  for(const mutate of [x=>{x.context.chatId='B';},x=>{x.context.chat.push({mes:'下一楼'});},x=>{x.d.transactions.reset();}]) {
    const gate = defer(),x = dispatcherSetup({beforeRun:()=>gate.promise});
    const first = x.d.onAiMessageReceived(1);await new Promise(setImmediate);mutate(x);gate.resolve();
    assert.equal((await first).ok,false);assert.equal(x.commits,0);assert.equal(x.writes.length,0);
    assert.equal(x.d.transactions.seenMessages.size,0);
  }
});
test('非最新楼、开场楼、无效楼只跳过/返回失败，不提交状态',async()=>{
  const x = dispatcherSetup();x.context.chat.push({mes:'第二楼'});
  assert.equal((await x.d.xsdStateTick(1,statusText)).skipped,'not-latest');
  assert.equal((await x.d.xsdStateTick(0,statusText)).skipped,'opening');
  assert.equal((await x.d.xsdStateTick(-1,statusText)).ok,false);
  assert.equal((await x.d.xsdStateTick(1.5,statusText)).ok,false);
  assert.equal(x.commits,0);assert.equal(x.writes.length,0);
});
test('实例创建无监听；start 幂等；dispose 清本实例事件/全局/计时器',()=>{
  const x = dispatcherSetup();
  assert.equal(x.events.size,0);assert.equal(x.domEvents.size,0);assert.equal(x.timers.size,0);
  assert.equal(x.d.start(),true);
  assert.equal([...x.events.values()].reduce((n,s)=>n+s.size,0),6);
  assert.equal(x.domEvents.get('pagehide').size,1);
  assert.equal(x.d.start(),false);
  x.d.onChatChanged();x.d.scheduleStart(()=>{});assert.equal(x.timers.size,2);
  x.d.dispose();x.d.dispose();
  assert.equal(x.timers.size,0);assert.equal([...x.events.values()].reduce((n,s)=>n+s.size,0),0);
  assert.equal(x.domEvents.get('pagehide').size,0);assert.equal(x.host.__xsdStateTick,undefined);
});
function productionSetup(options = {}) {
  const x = setup(valid());x.context.chat[1].mes = statusText;
  const events = new Map(), domEvents = new Map();
  x.api.tavern_events = Object.fromEntries(['MESSAGE_SENT','MESSAGE_RECEIVED','CHARACTER_MESSAGE_RENDERED','CHAT_CHANGED','CHAT_CREATED','MESSAGE_SWIPED'].map(n=>[n,n]));
  x.api.eventOn = (name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);return {stop:()=>events.get(name).delete(fn)};};
  x.host.addEventListener = (name,fn)=>{if(!domEvents.has(name))domEvents.set(name,new Set());domEvents.get(name).add(fn);};
  x.host.removeEventListener = (name,fn)=>domEvents.get(name)?.delete(fn);
  let cancels = 0;x.host.SillyTavern = {getContext:()=>x.context,stopGeneration:()=>{cancels++;return options.cancelResult;}};
  if(options.beforeLoad)options.beforeLoad(x);
  const z = loadEnvironment(x,['XSD_DISPATCHER','requestXsdGenerationCancel','runXsdStatusOperation','preflightFirstGeneration'],{includeMain:true,parent:options.parent});
  return {...x,...z,d:z.env.XSD_DISPATCHER,events,domEvents,get cancels(){return cancels;}};
}
test('真实 main 装配路径事件与 iframe tick 共用提交，已知旧正文拒绝',async()=>{
  const x = productionSetup();
  const event = x.d.onAiMessageReceived(1), tick = x.host.__xsdStateTick(1,statusText);
  assert.equal(event,tick);assert.equal((await event).ok,true);assert.equal(x.writes.length,2);
  const stale = await x.host.__xsdStateTick(1,statusText.replace('庭院','旧楼正文'));
  assert.equal(stale.ok,false);assert.equal(x.writes.length,2);assert.equal(x.layers.chat.stat_data.地点,'庭院');
  x.d.dispose();
});
test('真实 main 第一层写 await 中换 swipe，guard 阻止第二层写',async()=>{
  const x = productionSetup();
  x.setMode((p,o)=>{if(o.type==='chat')x.context.chat[1].swipe_id++;return null;});
  const r = await x.d.xsdStateTick(1,statusText);
  assert.equal(r.ok,false);assert.equal(x.writes.length,1);assert.equal(x.writes[0].options.type,'chat');
  assert.equal(x.d.transactions.seenMessages.size,0);x.d.dispose();
});
test('已知分支签名读取后丢失，旧任务不降级放行',async()=>{
  const gate = defer();const x = dispatcherSetup({beforeRun:()=>gate.promise});
  const first = x.d.onAiMessageReceived(1);await new Promise(setImmediate);
  x.env.API.getChatMessages = ()=>{throw Error('宿主读取失败');};
  gate.resolve();assert.equal((await first).ok,false);assert.equal(x.writes.length,0);
});
test('真实首次生成 schema 双层读回一致才成功；chat_changed 后重新前置',async()=>{
  const x = productionSetup();
  assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);
  const before = x.writes.length;assert.equal((await x.d.preflightFirstGeneration(1)).why,'已初始化');assert.equal(x.writes.length,before);
  const unrelated = x.timerCallbacks.size;
  x.d.onChatChanged();assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);assert.equal(x.cancels,0);
  x.d.dispose();assert.equal(x.timerCallbacks.size,unrelated);
});
test('真实首次生成双层 known 不一致明确请求取消，修复后可重试',async()=>{
  const x = productionSetup();await x.d.preflightFirstGeneration(1);x.d.onChatChanged();
  const field = x.env.ALL_FIELDS[0];x.layers.message.stat_data.known[field] = !x.layers.chat.stat_data.known[field];
  const failed = await x.d.preflightFirstGeneration(1);
  assert.equal(failed.ok,false);assert.equal(failed.cancelRequested,true);assert.equal(failed.cancelled,false);assert.equal(x.cancels,1);
  x.layers.message.stat_data.known[field] = x.layers.chat.stat_data.known[field];
  assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);x.d.dispose();
});
test('真实首次生成回读缺失/初始化失败不缓存成功；恢复后可重试',async()=>{
  let unreadable = true;
  const x = productionSetup({beforeLoad:x=>{
    const get = x.api.getVariables;x.api.getVariables=o=>unreadable?null:get(o);
  }});
  const failed = await x.d.preflightFirstGeneration(1);
  assert.equal(failed.ok,false);assert.equal(failed.cancelRequested,true);assert.equal(x.cancels,1);
  assert.equal(x.writes.length,0);assert.equal(x.layers.chat.stat_data.身份,'自设');
  unreadable = false;assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);x.d.dispose();
});
test('真实 main 仅 parent.TavernHelper.getVariables 可用，首次前置与状态提交仍支持',async()=>{
  const parent = {}, helper = {};let reads = 0;
  parent.TavernHelper = helper;
  const x = productionSetup({parent,beforeLoad:x=>{
    const get = x.api.getVariables;delete x.api.getVariables;
    helper.getVariables = function(...args){reads++;return get(...args);};
    parent.SillyTavern = {getContext:()=>x.context};
  }});
  assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);
  assert.equal((await x.d.xsdStateTick(1,statusText)).ok,true);
  assert(reads>0);assert.equal(x.layers.message.stat_data.地点,'庭院');x.d.dispose();
});
test('真实首次前置单层缺 known 可由完整层恢复，保留已确认事实',async()=>{
  const x = productionSetup();await x.d.preflightFirstGeneration(1);
  const field = x.env.ALL_FIELDS[0];x.layers.chat.stat_data.known[field] = true;
  delete x.layers.message.stat_data.known;x.d.onChatChanged();
  const before = x.writes.length;
  assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);
  assert.equal(x.writes.length,before+2);assert.equal(x.layers.chat.stat_data.known[field],true);
  assert.equal(x.layers.message.stat_data.known[field],true);assert.equal(x.cancels,0);x.d.dispose();
});
test('两层完整 schema 却身份冲突，不靠初始化覆盖；取消请求后可人工修复重试',async()=>{
  const x = productionSetup();await x.d.preflightFirstGeneration(1);x.d.onChatChanged();
  x.layers.message.stat_data.身份 = '赵无忧';
  const before = x.writes.length, failed = await x.d.preflightFirstGeneration(1);
  assert.equal(failed.ok,false);assert.equal(failed.cancelRequested,true);assert.equal(x.writes.length,before);
  assert.equal(x.layers.chat.stat_data.身份,'自设');assert.equal(x.layers.message.stat_data.身份,'赵无忧');
  x.layers.message.stat_data.身份 = '自设';assert.equal((await x.d.preflightFirstGeneration(1)).ok,true);x.d.dispose();
});
