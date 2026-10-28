'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createHostRuntime}=require('./宿主适配.js');
const {replay}=require('./引擎.js');
const {fingerprint}=require('./指纹.js');
const projection=require('../状态栏/后台投影.js');
const config=require('./规则.json');
const raw=(values={})=>'<status_bar>'+Object.entries({time:'宣德五年四月初一 酉时',elapsed:'0分钟',...values}).map(([key,value])=>'<'+key+'>'+value+'</'+key+'>').join('')+'</status_bar>';
const message=mes=>({mes,extra:{external:'keep'}});
function fixture(chat){
 const listeners=new Map();
 const bus={on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeListener(name,fn){listeners.get(name)?.delete(fn);}};
 const ctx={chatId:'recovery',characterId:0,characters:[{data:{extensions:{zyx_backend:{schema:1}}}}],chat,eventSource:bus};
 const vars={external:42},prompts=[];
 const host={SillyTavern:{getContext:()=>ctx},TavernHelper:{
  async setChatMessages(rows){for(const row of rows){const m=ctx.chat[row.message_id];m.mes=row.message;m.extra=row.extra;if(m.swipes){m.swipe_info??=[];m.swipe_info[m.swipe_id??0]=row.extra;}}},
  async getVariables(){return vars;},async insertOrAssignVariables(values){Object.assign(vars,values);},async injectPrompts(value){prompts.push(value);}
 }};host.parent=host;
 // 本夹具不模拟世界书；原生开关由角色现状/整卡集成测试独立覆盖。
 const create=()=>createHostRuntime({window:host,config:{...config,identityWorldbookRequired:false}});
 const runtime=create();
 return {runtime,create,ctx,vars,prompts,emit:async name=>{for(const fn of [...(listeners.get(name)||[])])await fn();}};
}
function read(h,index=h.ctx.chat.length-1){return projection.read(h.ctx.chat,index,h.ctx.chatId);}
test('生成期间不结算新异常楼，结束后绑定保持状态并向HUD与诊断暴露待核',async()=>{
 const h=fixture([message(raw({bailian_state:'在押'}))]);h.runtime.start();await h.runtime.sync();
 const before=h.runtime.getState();await h.emit('generation_started');
 h.ctx.chat.push(message('正文有报告草稿，但尚未完成。'+raw({elapsed:'100日'})+raw({elapsed:'100日'})));
 await h.emit('message_received');assert.equal(h.ctx.chat[1].extra.zyx_backend,undefined);
 await h.emit('generation_ended');
 const saved=h.ctx.chat[1].extra.zyx_backend,state=read(h);
 assert.equal(saved.sourceFingerprint,fingerprint(h.ctx.chat[1]));assert.ok(saved.sourcePrefix);
 assert.deepEqual(state.time,before.time);assert.deepEqual(state.custody,before.custody);assert.deepEqual(state.official,before.official);
 assert.equal(state.unsettled,true);assert.ok(state.pending.some(x=>x.floor===1&&x.code==='missing_report'));
 assert.deepEqual(h.runtime.getDiagnostics().pending,state.pending);assert.equal(h.runtime.getDiagnostics().lastError.stage,'replay');
 assert.equal(h.ctx.chat[1].extra.external,'keep');assert.equal(h.vars.external,42);await h.runtime.stop();
});
test('已结算楼切成坏候选后可继续读后楼，编辑补报解除待核，重载仍绑定原输入',async()=>{
 const good=raw({elapsed:'1小时',danniang_state:'在押'}),bad='没有状态块的候选';
 const second=message(good);second.swipes=[good,bad];second.swipe_id=0;second.swipe_info=[{},{}];
 const h=fixture([message(raw()),second]);h.runtime.start();await h.runtime.sync();
 const old=second.extra.zyx_backend;
 second.mes=bad;second.swipe_id=1;await h.emit('message_swiped');
 assert.notDeepEqual(second.extra.zyx_backend,old);assert.equal(second.extra.zyx_backend.sourceFingerprint,fingerprint(second));
 assert.equal(second.swipe_info[1].zyx_backend.sourceFingerprint,fingerprint(second));assert.equal(read(h).unsettled,true);
 h.ctx.chat.push(message(raw({elapsed:'2小时'})));await h.emit('generation_ended');
 assert.equal(read(h).time.hour,19);assert.equal(read(h).unsettled,false);assert.ok(read(h).pending.some(x=>x.floor===1));
 // Correcting the earlier floor recomputes later sourcePrefix and removes its old missing-report diagnostic.
 second.mes=raw({elapsed:'30分钟'});second.swipes[1]=second.mes;await h.emit('message_edited');
 assert.equal(read(h).time.hour,19);assert.equal(read(h).time.minute,30);assert.deepEqual(read(h).pending,[]);assert.equal(h.runtime.getDiagnostics().lastError,null);
 assert.equal(projection.read(h.ctx.chat,2,'other-chat'),null);
 const expected=structuredClone(read(h));await h.runtime.stop();
 const reloaded=h.create();await reloaded.sync();assert.deepEqual(read(h),expected);assert.deepEqual(reloaded.getState(),expected);await reloaded.stop();
});
test('缺零楼锚点时诊断可读、时间始终null，补零楼后重新结算并清除待核',async()=>{
 const h=fixture([message('坏开场'),message(raw({elapsed:'100日',bailian_state:'在押'}))]);
 await h.runtime.sync();let state=read(h);
 assert.equal(state.ready,false);assert.equal(state.time,null);assert.equal(state.trend,null);assert.equal(state.unsettled,true);assert.equal(h.vars.zyx_time,null);
 assert.ok(state.pending.some(x=>x.floor===0&&x.code==='missing_anchor'));assert.ok(state.pending.some(x=>x.floor===1&&x.code==='missing_anchor'));
 assert.equal(h.ctx.chat[0].extra.zyx_backend.snapshot.ready,false);assert.equal(h.ctx.chat[1].extra.zyx_backend.snapshot.time,null);
 // Raw edits cannot make stale snapshots look valid before the writer has replayed them.
 h.ctx.chat[0].mes=raw();assert.equal(read(h),null);await h.runtime.sync();state=read(h);
 assert.equal(state.ready,true);assert.equal(state.time.dayIndex,101);assert.deepEqual(state.pending,[]);await h.runtime.stop();
});
test('纯引擎每个异常助手楼独立留诊断；忽略用户/系统，不借未来楼补锚点',()=>{
 const chat=[message(raw({time:'未明'})),{mes:'用户',is_user:true},{mes:'系统',is_system:true},message(raw({elapsed:'1日'}))];
 const result=replay(chat);
 assert.deepEqual(result.frames.map(x=>x.floor),[0,3]);assert.equal(result.frames[0].snapshot.time,null);assert.equal(result.frames[1].snapshot.time,null);
 assert.equal(result.state.ready,false);assert.equal(result.state.intel.value,0);assert.equal(result.state.official.val,0);
 assert.ok(result.frames[1].snapshot.pending.some(x=>x.floor===3&&x.code==='missing_anchor'));
});
