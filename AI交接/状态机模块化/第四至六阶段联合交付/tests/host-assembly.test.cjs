'use strict';
// gpt 下级：加载最终真实拼接文件，检查共享作用域及显式依赖的初始化。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '../候选源码');
const builder = require(path.join(project, 'src/state-machine/build.cjs'));
const source = builder.assemble().bytes.toString('utf8');
const core = name => fs.readFileSync(path.join(project,'src/state-machine/host',name+'-core.js'),'utf8');
function host(withDocument = false) {
  const writes = [], reads = [], logs = [], timers = [];
  const box = {
    console: Object.fromEntries(['log', 'warn', 'error', 'info'].map(level => [level, (...args) => logs.push([level, ...args])])),
    setTimeout: (fn, delay) => { timers.push(['timeout', delay]); return timers.length; },
    setInterval: (fn, delay) => { timers.push(['interval', delay]); return timers.length; },
    clearInterval() {}, clearTimeout() {},
  };
  box.window = box;
  box.parent = box;
  box.top = box;
  box.addEventListener = () => {};
  box.removeEventListener = () => {};
  if (withDocument) {
    const doc = { getElementById:()=>null, querySelector: () => null, querySelectorAll: () => [], documentElement: {},
      addEventListener() {}, removeEventListener() {}, defaultView: box };
    box.document = doc;
    box.MutationObserver = class { observe() {} disconnect() {} };
    box.getVariables = opts => { reads.push(['variables', opts]); return {}; };
    box.getChatMessages = range => { reads.push(['messages', range]); return []; };
    box.setChatMessages = patch => { writes.push(['messages', patch]); };
    box.insertOrAssignVariables = patch => { writes.push(['variables', patch]); };
    box.replaceVariables = patch => { writes.push(['replace', patch]); };
  }
  vm.createContext(box);
  return { box, writes, reads, logs, timers };
}
test('最终生成物与源片段完全相同并可整体编译', () => {
  const checked = builder.buildStateMachine({ checkOnly: true });
  const assembled = builder.assemble();
  assert.ok(assembled.bytes.equals(Buffer.from(source)));
  assert.equal(checked.sha256, assembled.sha256);
  assert.doesNotThrow(() => new vm.Script(source));
});
test('酒馆 API 全缺时，完整脚本仍加载并暴露原入口', () => {
  const { box, logs, timers } = host();
  assert.doesNotThrow(() => vm.runInContext(source, box));
  for (const name of ['__xsdStateTick', '__xsdWho', '__xsdDump', '__xsdBoot']) assert.equal(typeof box[name], 'function');
  assert.ok(logs.some(row => row.some(value => String(value).includes('相关功能降级'))));
  assert.ok(timers.some(row => row[0] === 'timeout' && row[1] === 1500));
});
test('真实 adapter 初始化依赖齐全；解析和已存时间基准读取不写盘', () => {
  const { box, writes, reads } = host(true);
  assert.doesNotThrow(() => vm.runInContext(source, box));
  assert.equal(box.document.__xsdMenuBound, true);
  assert.equal(writes.length, 0);
  reads.length = 0;
  const parsed = box.parseStatusBlock('<Status_block><地点>测试庭院</地点><历时>一日</历时></Status_block>');
  assert.equal(parsed.fields['地点'], '测试庭院');
  assert.equal(parsed.fields['历时'], '一日');
  const basis = box.resolveCalendarBasis({ 历基准: 18938.066666666666, 身份: '赵无忧' });
  assert.equal(basis.source, 'stored-basis');
  assert.equal(basis.basis, 18938.066666666666);
  assert.equal(reads.length, 0);
  assert.equal(writes.length, 0);
});

function ports(window, globalThis = {}, overrides = {}) {
  const getters = new Proxy(overrides, {get: (obj,key) => obj[key] || (() => undefined)});
  return vm.runInNewContext(core('api')+'; createXsdHostPorts',{})({window,globalThis,getters,console:{warn(){}},TAG:'[宿主测试]'});
}
test('host API 探测保持 getter、自身、helper、parent、top、全局顺序', () => {
  const layers = [() => 'self',() => 'helper',() => 'parent-helper',() => 'top-helper',() => 'parent',() => 'global',() => 'global-helper'];
  const w = {getVariables:layers[0],TavernHelper:{getVariables:layers[1]},parent:{TavernHelper:{getVariables:layers[2]},getVariables:layers[4]},top:{TavernHelper:{getVariables:layers[3]}}};
  const g = {getVariables:layers[5],TavernHelper:{getVariables:layers[6]}};
  assert.equal(ports(w,g,{getVariables:()=>()=> 'getter'}).API.getVariables(),'getter');
  const owners=[w,w.TavernHelper,w.parent.TavernHelper,w.top.TavernHelper,w.parent,g,g.TavernHelper];
  for(let i=0;i<owners.length;i++){assert.equal(ports(w,g).API.getVariables,layers[i]); delete owners[i].getVariables;}
  assert.equal(ports(w,g).API.getVariables,null);
});
test('跨源 parent 抛异常继续回退全局；API 对象仍允许追加接口',()=>{
  const w={};Object.defineProperty(w,'parent',{get(){throw Error('cross-origin');}});
  const fn=()=>1;const p=ports(w,{getVariables:fn});assert.equal(p.API.getVariables,fn);
  p.API.stopGeneration=fn;assert.equal(p.API.stopGeneration(),1);assert.equal(Object.isFrozen(p.API),false);
});
test('事件常量保持原对象；可选清理/取消接口支持 parent helper',()=>{
  const events={MESSAGE_SENT:'sent-custom'};const remove=()=>true,cancel=()=>true;
  const p=ports({parent:{TavernHelper:{eventRemoveListener:remove,stopGeneration:cancel}}},{},{tavern_events:()=>events});
  assert.equal(p.EVENTS,events);assert.equal(p.API.eventRemoveListener,remove);assert.equal(p.API.stopGeneration,cancel);
});
test('聊天标识与 toast 从 correction、SillyTavern、父宿主按原顺序读取',()=>{
  let called;const t={info(...args){called=[this,...args];}};
  const w={parent:{toastr:t},__xsdCorrection:{capture:()=>({chatId:'service-chat'})}};
  const p=ports(w,{}, {SillyTavern:()=>({getContext:()=>({chatId:'context-chat'})})});
  assert.equal(p.currentChatId(),'service-chat');delete w.__xsdCorrection;assert.equal(p.currentChatId(),'context-chat');
  assert.equal(p.toast('missing','测试',10),true);assert.equal(called[0],t);assert.equal(called[1],'测试');
});
test('消息核支持 array/object/message/mes 与 swipe 请求；只读不写盘',()=>{
  let opts;const API={getChatMessages:(id,o)=>{opts=o;return {mes:'正文',message_id:3};},getLastMessageId:()=>3};
  const r=vm.runInNewContext(core('messages')+';createXsdMessageReader',{})({API,console:{warn(){}},TAG:'[test]',msgOf:String});
  assert.equal(r.messageText(3,true),'正文');assert.equal(opts.include_swipes,true);assert.equal(r.latestMessageId(),3);assert.equal(r.isNewChat(),false);
  API.getChatMessages=()=>[{message:'首行'},{message:'末行',message_id:7}];API.getLastMessageId=()=>NaN;
  assert.equal(r.messageText(7,false),'首行');assert.equal(r.latestMessageId(),7);
  API.getChatMessages=()=>{throw Error('缺接口');};assert.equal(r.messageText(3),null);assert.equal(r.latestMessageId(),null);assert.equal(r.isNewChat(),false);
});
test('真实 runtime 与完整脚本共同初始化，native 监听使用实际事件常量并可退出清理',()=>{
  const {box,writes}=host(true);const listeners=[],removed=[];
  box.Function=vm.runInContext('Function',box);
  box.tavern_events={MESSAGE_SENT:'native-sent-custom',MESSAGE_RECEIVED:'received-custom',MESSAGE_RENDERED:'rendered-custom',CHAT_CHANGED:'chat-custom',CHAT_CREATED:'created-custom',MESSAGE_SWIPED:'swiped-custom'};
  box.eventOn=(type,fn)=>{listeners.push([type,fn]);return ()=>removed.push(type);};
  box.SillyTavern={getContext:()=>({chatId:'init-chat',eventSource:{on:(type,fn)=>listeners.push([type,fn]),off:(type)=>removed.push(type)}})};
  const runtime=fs.readFileSync(path.join(__dirname,'fixtures/correction-runtime.js'),'utf8');
  assert.doesNotThrow(()=>vm.runInContext(runtime+'\n'+source,box));
  assert.equal(box.__xsdCorrection.version,'1.2.0');assert.equal(typeof box.__xsdDispatcher.dispose,'function');
  assert.ok(listeners.some(x=>x[0]==='native-sent-custom'));assert.equal(listeners.filter(x=>x[0]==='MESSAGE_SENT').length,0);
  assert.equal(writes.length,0);box.__xsdDispatcher.dispose();assert.equal(typeof box.__xsdStateTick,'undefined');
  assert.ok(removed.includes('native-sent-custom'));assert.ok(removed.includes('received-custom'));
});
