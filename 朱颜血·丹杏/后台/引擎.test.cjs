'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {replay}=require('./引擎.js'),rules=require('./规则.json');
const raw=(values={})=>'<status_bar>'+Object.entries({time:'宣德五年四月初一 酉时',elapsed:'初至',...values}).map(([k,v])=>'<'+k+'>'+v+'</'+k+'>').join('')+'</status_bar>';
const m=values=>({mes:raw(values),extra:{}});
test('八人独立监听、未知保持、释放移除，删楼与候选切换重新结算',()=>{
 const chat=[m({bailian_state:'在押'}),m({elapsed:'半刻钟',danniang_state:'在押｜地牢'}),m({elapsed:'1刻钟',bailian_state:'已释放',danniang_state:'未知'})];
 let result=replay(chat);assert.deepEqual(result.state.custody.filter(x=>x.inCustody).map(x=>x.name),['裴丹杏']);assert.equal(result.state.time.minute,22);assert.equal(result.state.time.second,30);
 assert.equal(replay(chat.slice(0,2)).state.custody.filter(x=>x.inCustody).length,2);
 chat[1].mes=raw({elapsed:'半刻钟',danniang_state:'未关押'});chat[1].swipe_id=1;result=replay(chat);assert.equal(result.state.custody.filter(x=>x.inCustody).length,0);
});
test('绝对时间由后台计算，未知耗时不猜，重复回放不重复推进',()=>{
 const chat=[m(),m({elapsed:'1日',time:'宣德九年十二月三十'})];const a=replay(chat);assert.equal(a.state.time.monthDay,2);assert.deepEqual(replay(chat).state,a.state);
 chat.push(m({elapsed:'过了一会儿'}));assert.deepEqual(replay(chat).state.time,a.state.time);assert.ok(replay(chat).pending.some(x=>x.code==='unknown_elapsed'));
});
test('实名信物去重、未来信物拒绝、获得标记不能自动领取目标',()=>{
 const first=rules.clues[0],future=rules.clues.find(x=>x.act===2);
 const chat=[m(),m({elapsed:'0分钟',clue_obtained:'1',clues_gained:JSON.stringify([first.name,first.id,future.name])})];
 let state=replay(chat).state;assert.equal(state.intel.value,1);assert.deepEqual(state.intel.known,[first.id]);assert.ok(state.pending.some(x=>x.code==='future_clue'));
 chat.push(m({elapsed:'0分钟',clue_obtained:'1'}));state=replay(chat).state;assert.equal(state.intel.value,1);assert.ok(state.pending.some(x=>x.code==='unnamed_clue'));
});
test('日段推进只切换相应大势；本楼跨幕不能提前领取下一幕信物',()=>{
 const future=rules.clues.find(x=>x.act===2);
 const chat=[m(),m({elapsed:'49日',clue_obtained:'1',clues_gained:JSON.stringify([future.id])})];
 let state=replay(chat).state;assert.equal(state.time.act,2);assert.equal(state.trend.act,2);assert.equal(state.intel.value,0);
 chat.push(m({elapsed:'0分钟',clue_obtained:'1',clues_gained:JSON.stringify([future.id])}));assert.equal(replay(chat).state.intel.value,1);
});
test('无开局不伪造时钟、异常回报不结算、场所条件明确区分',()=>{
 assert.equal(replay([m({time:'未明'})]).state.ready,false);
 const chat=[m(),{mes:raw({elapsed:'100日'})+raw({elapsed:'100日'})}];assert.equal(replay(chat).state.time.act,1);
 const water=replay([m()]).state.nodes.find(x=>x.gate?.any);assert.equal(water.status,'locked');
 const next=replay([m({prison_control:'掌控'})]).state.nodes.find(x=>x.id===water.id);assert.equal(next.status,'available');
 assert.ok(replay([m()]).state.nodes.some(x=>x.status==='unconfirmed'));
});
test('后台投影拒绝旧聊天、正文编辑和前序编辑后的旧快照',()=>{
 const fp=require('./指纹.js');global.ZYXFingerprint=fp;const projection=require('../状态栏/后台投影.js');const chat=[m(),m({elapsed:'1小时'})],result=replay(chat);
 for(const f of result.frames)chat[f.floor].extra.zyx_backend={schema:1,chatId:'a',sourceFingerprint:f.sourceFingerprint,sourcePrefix:f.sourcePrefix,snapshot:f.snapshot};
 assert.ok(projection.read(chat,1,'a'));assert.equal(projection.read(chat,1,'b'),null);chat[0].mes+=' ';assert.equal(projection.read(chat,1,'a'),null);
});
test('配置化时间窗、情报门槛和持有信物同时生效，到期明确关闭',()=>{
 const config=structuredClone(rules);config.nodes=[{id:'synthetic',name:'合成条件节点',gate:{startDay:2,endDay:3,minIntel:1,all:[{clue:rules.clues[0].id}]}}];
 const first=m(),second=m({elapsed:'1日',clue_obtained:'1',clues_gained:JSON.stringify([rules.clues[0].id])});
 assert.equal(replay([first],config).state.nodes[0].status,'locked');assert.equal(replay([first,second],config).state.nodes[0].status,'available');
 assert.equal(replay([first,second,m({elapsed:'2日'})],config).state.nodes[0].status,'expired');
});
test('跨幕日志记录封顶后的实际增量并保留原申请值',()=>{
 const event=(id,type,evidence)=>({mes:evidence+raw({elapsed:'0分钟',intel_events:JSON.stringify([{id,type,evidence}])}),extra:{}});
 const chat=[m(),...['甲','乙','丙','丁'].map((name,i)=>event('report_'+i,'report','差役'+name+'已经回城报案。')),event('escape','witness_escape','活口已经逃出监牢报信。')];
 assert.equal(replay(chat).state.official.val,95);
 chat.push(m({elapsed:'229日'}));let state=replay(chat).state;
 assert.equal(state.official.val,100);assert.deepEqual(state.official.history.find(x=>x.id==='act_5'),{floor:6,id:'act_5',requestedDelta:20,delta:5,reason:'幕次变化'});
 // 到顶之后的下一次跨幕同样不能在日志虚增5点。
 const full=[m(),...['甲','乙','丙','丁','戊'].map((name,i)=>event('full_'+i,'report','差役'+name+'已经回城报案。')),m({elapsed:'49日'})];
 state=replay(full).state;assert.equal(state.official.val,100);assert.equal(state.official.history.find(x=>x.id==='act_2').delta,0);assert.equal(state.official.history.find(x=>x.id==='act_2').requestedDelta,5);
});
