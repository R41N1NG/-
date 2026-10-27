'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {createHostRuntime} = require('./宿主适配.js');
const fingerprint = m => JSON.stringify([m.mes, m.swipe_id || 0, m.extra?.zyx_opening]);
const value = n => ({schema:1,ready:true,time:{turn:n},custody:Array.from({length:8},(_,i)=>({id:i,status:'held'})),intel:{known:[],names:[],value:0,actCount:0,actTotal:0},trend:{body:'当前大势'},nodes:[],pending:[]});
function setup() {
  const bus = new EventEmitter(), calls = {messages:[],variables:[],prompts:[],inputs:[]};
  const chat = [{mes:'完整结果',extra:{foreign:'keep'},swipes:['完整结果'],swipe_id:0,swipe_info:[{foreign:'keep'}]}];
  let ctx = {chat,characters:[{data:{extensions:{zyx_backend:{schema:1}}}}],characterId:0,getCurrentChatId:()=>ctx.id,id:'a',eventSource:bus,isGenerating:false};
  const vars = {foreign:42};
  const helper = {
    async setChatMessages(rows,options) {
      calls.messages.push({rows,options});
      for(const row of rows) { const m=ctx.chat[row.message_id]; m.mes=row.message; m.extra=row.extra; m.swipe_info ||= []; m.swipe_info[m.swipe_id || 0]=row.extra; }
      bus.emit('message_updated');
    },
    async insertOrAssignVariables(v,scope) {calls.variables.push({v,scope});Object.assign(vars,v);},
    async injectPrompts(blocks) {calls.prompts.push(blocks);},
  };
  const w = {SillyTavern:{getContext:()=>ctx},TavernHelper:helper}; w.parent=w; w.top=w;
  const engine = {replay(input) {calls.inputs.push(input.map(m=>m.mes)); return {state:value(input.length),frames:input.map((m,floor)=>({floor,sourceFingerprint:fingerprint(m),snapshot:value(floor+1)}))};}};
  const runtime=createHostRuntime({window:w,engine,fingerprint,config:{secretFuture:'never inject'}});
  return {runtime,calls,helper,w,vars,bus,get ctx(){return ctx;}, switchChat(id='b') {ctx={...ctx,id,chat:[{mes:'另一聊天',extra:{}}]};}};
}
test('普通 Helper 分支落盘、候选同步、变量 merge、重复不写、事件清理',async()=>{
  const h=setup();h.runtime.start();await h.runtime.sync();await h.runtime.sync();
  assert.equal(h.calls.messages.length,1);
  const write=h.calls.messages[0];assert.deepEqual(Object.keys(write.rows[0]).sort(),['extra','message','message_id']);assert.equal(write.options.refresh,'none');
  assert.equal(h.ctx.chat[0].extra.foreign,'keep');assert.equal(h.ctx.chat[0].swipe_info[0].zyx_backend.chatId,'a');
  assert.equal(h.vars.foreign,42);assert.equal(h.calls.variables.length,1);
  assert.equal(h.calls.prompts[0][0].content.includes('secretFuture'),false);
  assert.equal(h.runtime.getDiagnostics().lastError,null);
  assert.ok(h.bus.listenerCount('message_updated'));
  await h.runtime.stop();assert.equal(h.bus.listenerCount('message_updated'),0);assert.equal(h.calls.prompts.at(-1)[0].content,'');
});
test('切聊天中止旧回放后续变量投影，无新聊天补写',async()=>{
  const h=setup();let release;const gate=new Promise(r=>release=r);
  const write=h.helper.setChatMessages;h.helper.setChatMessages=async(...args)=>{await write(...args);await gate;};
  const work=h.runtime.sync();await new Promise(r=>setImmediate(r));h.switchChat();release();await work;
  assert.equal(h.calls.variables.length,0);assert.equal(h.ctx.chat[0].extra.zyx_backend,undefined);
  await h.runtime.sync();assert.equal(h.runtime.getState().time.turn,1);assert.equal(h.ctx.chat[0].extra.zyx_backend.chatId,'b');await h.runtime.stop();
});
test('候选变化和删除后从当前聊天回放，生成中不读取新楼或流式候选',async()=>{
  const h=setup();await h.runtime.sync();
  const m=h.ctx.chat[0];m.mes='候选二';m.swipes.push(m.mes);m.swipe_id=1;m.swipe_info.push({});await h.runtime.sync();assert.equal(m.extra.zyx_backend.sourceFingerprint,fingerprint(m));
  h.ctx.isGenerating=true;h.ctx.chat.push({mes:'流式未完成',extra:{}});await h.runtime.sync();assert.deepEqual(h.calls.inputs.at(-1),['候选二']);
  h.ctx.chat[0].mes='旧楼也在流式改写';await h.runtime.sync();assert.deepEqual(h.calls.inputs.at(-1),[]);
  h.ctx.isGenerating=false;h.ctx.chat.splice(0);await h.runtime.sync();assert.equal(h.runtime.getState().time.turn,0);await h.runtime.stop();
});
test('无 Helper 或写后未落盘明确失败；非本卡不写',async()=>{
  const missing=setup();delete missing.w.TavernHelper;await missing.runtime.sync();assert.match(missing.runtime.getDiagnostics().lastError.message,/setChatMessages/);await missing.runtime.stop();
  const broken=setup();broken.helper.setChatMessages=async()=>{};await broken.runtime.sync();assert.match(broken.runtime.getDiagnostics().lastError.message,/核验失败/);assert.equal(broken.calls.variables.length,0);await broken.runtime.stop();
  const other=setup();delete other.ctx.characters[0].data.extensions.zyx_backend;await other.runtime.sync();assert.equal(other.calls.messages.length,0);assert.equal(other.runtime.getDiagnostics().active,false);await other.runtime.stop();
});
test('跨父窗口发现宿主、原生提示 fallback、未就绪时间保留 null',async()=>{
  const h=setup();delete h.helper.injectPrompts;const prompts=[];h.ctx.setExtensionPrompt=(...args)=>prompts.push(args);
  const child={parent:h.w,top:h.w};const unready=value(0);unready.ready=false;unready.time={invented:1};
  const runtime=createHostRuntime({window:child,fingerprint,engine:{replay:()=>({state:unready,frames:[]})}});
  await runtime.sync();assert.equal(h.vars.zyx_time,null);assert.equal(JSON.parse(prompts[0][1].split('\n')[1]).time,null);assert.equal(runtime.getDiagnostics().lastError.stage,'replay');await runtime.stop();
});
test('聊天变为非本卡会清理提示，前置事件返回可等待同步',async()=>{
  const h=setup();h.runtime.start();await h.runtime.sync();
  const before=h.calls.prompts.length;await Promise.all(h.bus.listeners('generation_after_commands').map(fn=>fn()));assert.equal(h.calls.prompts.length,before+1);
  delete h.ctx.characters[0].data.extensions.zyx_backend;h.bus.emit('chat_changed');await h.runtime.sync();assert.equal(h.calls.prompts.at(-1)[0].content,'');assert.equal(h.runtime.getState(),null);await h.runtime.stop();
});

test('同名变量被外部覆盖后重新校正，不只凭内存签名跳过',async()=>{const h=setup();h.helper.getVariables=()=>h.vars;await h.runtime.sync();h.vars.zyx_intel={wrong:true};h.vars.zyx_nodes=[];await h.runtime.sync();assert.equal(typeof h.vars.zyx_intel,'number');assert.equal(Array.isArray(h.vars.zyx_nodes),false);assert.equal(h.vars.foreign,42);assert.equal(h.calls.variables.length,2);await h.runtime.stop();});
