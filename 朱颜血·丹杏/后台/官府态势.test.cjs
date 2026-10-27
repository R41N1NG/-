'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{replay}=require('./引擎.js'),Official=require('./官府态势.js');
const raw=(fields={},body='验收剧情。')=>body+'\n<status_bar>'+Object.entries({time:'宣德五年四月初一 酉时',elapsed:'0分钟',...fields}).map(([k,v])=>'<'+k+'>'+v+'</'+k+'>').join('')+'</status_bar>';
const m=(f,b)=>({mes:raw(f,b),extra:{}}),start=()=>m({elapsed:'初至',bailian_state:'在押',shuangling_state:'在押'});
const event=(id,type,evidence)=>({intel_events:JSON.stringify([{id,type,evidence}])});
test('自报数字、否定关键词、计划、旧风闻不结算；必须本楼正文事实',()=>{
 for(const [fields,body]of [[{intel_delta:'20',clue:'告发'},'没有告发，没人出山报案'],[event('a','report','没有告发，没人出山报案'),'没有告发，没人出山报案'],[event('a','report','差役已经回城报案。'),'差役准备回城。'],[event('a','report','他不会向官府告密。'),'他不会向官府告密。'],[event('a','report','差役明天回城报案。'),'差役明天回城报案。']])assert.equal(replay([start(),m(fields,body)]).state.official.val,0);
});
test('事件收益后台固定、ID及事实摘录去重，换候选/删楼撤销结果',()=>{
 const proof='差役已经回城报案，将密函交给了主簿。',first=m(event('report1','report',proof),proof),second=m(event('newid','report',proof),proof);let state=replay([start(),first,second]).state;assert.equal(state.official.val,20);assert.equal(state.official.history.length,1);
 const other='捕快已经递状报案，县令收下案卷。';state=replay([start(),first,m(event('report1','report',other),other)]).state;assert.equal(state.official.val,20);
 assert.equal(replay([start()]).state.official.val,0);first.mes=raw({intel_events:'[]'});assert.equal(replay([start(),first]).state.official.val,0);
});
test('半刻不能被模型未来日期推到第三幕；12时辰正好累计一日',()=>{
 let state=replay([start(),m({elapsed:'半刻钟',time:'宣德五年七月二十 酉时'})]).state;assert.equal(state.time.act,1);assert.equal(state.time.minute,7);assert.equal(state.time.second,30);
 state=replay([start(),...Array.from({length:12},()=>m({elapsed:'一个时辰'}))]).state;assert.equal(state.time.dayIndex,2);assert.equal(state.time.hour,17);
});
test('官方退档改变active，事件历史保留；未明确仍在押不触发寻徒',()=>{
 const state=replay([start()]).state;state.official.val=85;Official.derive(state.official);Official.nodes(state);assert.equal(state.events.active.id,'dragnet');state.official.val=10;Official.derive(state.official);Official.nodes(state);assert.equal(state.events.active,null);assert.ok(state.events.fired.dragnet);
 const released=replay([start(),m({elapsed:'109日',bailian_state:'已脱困｜离开牢狱'})]).state;assert.equal(released.custody.find(x=>x.key==='bailian').inCustody,false);assert.equal(released.events.fired.xieyunsu,undefined);
});
test('同一轮内多个事件净变化限幅，未来幕角色由统一时钟解锁',()=>{
 const state=Official.initial(),pending=[];const proof='差役已经报案。东厂番子取得口供。';Official.settle(state,proof,{intel_events:JSON.stringify([{id:'r',type:'report',evidence:'差役已经报案。'},{id:'t',type:'testimony',evidence:'东厂番子取得口供。'}])},1,(...x)=>pending.push(x));assert.equal(state.val,20);
 const s=replay([start(),m({elapsed:'19日',location:'长宁县城'})]).state;assert.ok(s.events.entered['宁安郡主']);assert.ok(s.events.entered['青萝']);
});

test('上传卡四个实际开场各自锚定，初始都只有两名在押者',()=>{const card=require('../试用卡/backend-v2-上传基线.json');for(const greeting of card.data.alternate_greetings){const state=replay([{mes:greeting}]).state;assert.equal(state.ready,true);assert.deepEqual(state.custody.filter(x=>x.inCustody).map(x=>x.key),['bailian','shuangling']);}});
test('同一事件组的六种排列净结果一致，申请和实际变化分开审计',()=>{
 const items=[{id:'r',type:'report',evidence:'差役已经回县衙报案。'},{id:'t',type:'testimony',evidence:'东厂番子已经取得口供。'},{id:'i',type:'intercept_messenger',evidence:'他已截杀传信信使。'}],body=items.map(x=>x.evidence).join('');
 const permutations=items.flatMap(a=>items.filter(b=>b!==a).map(b=>[a,b,items.find(c=>c!==a&&c!==b)]));let expected;
 for(const events of permutations){const state=Official.initial();Official.settle(state,body,{intel_events:JSON.stringify(events)},1,()=>assert.fail());assert.equal(state.val,20);assert.equal(state.batches[0].requestedNet,25);assert.equal(state.batches[0].limitedNet,20);assert.equal(state.batches[0].actualDelta,20);assert.ok(state.history.every(x=>x.requestedDelta!==undefined&&x.delta===undefined));if(expected)assert.deepEqual(state,expected);else expected=state;}
});
test('上下限、批内重复和冲突事件均可审计且与排列顺序无关',()=>{
 const proof='差役已经回县衙报案。',ev={id:'r',type:'report',evidence:proof};let state=Official.initial();state.val=95;Official.settle(state,proof,{intel_events:JSON.stringify([ev,ev])},1,()=>assert.fail());assert.equal(state.val,100);assert.equal(state.history.length,1);assert.equal(state.batches[0].actualDelta,5);
 state=Official.initial();const negative='他已截杀传信信使。';Official.settle(state,negative,event('i','intercept_messenger',negative),1,()=>assert.fail());assert.equal(state.val,0);assert.equal(state.batches[0].requestedNet,-15);assert.equal(state.batches[0].actualDelta,0);
 const other={id:'r',type:'intercept_messenger',evidence:negative};for(const group of [[ev,other],[other,ev]]){state=Official.initial();const pending=[];Official.settle(state,proof+negative,{intel_events:JSON.stringify(group)},1,(...v)=>pending.push(v));assert.equal(state.val,0);assert.equal(state.seen.length,0);assert.ok(pending.some(x=>x[0]==='intel_conflict'));}
});
