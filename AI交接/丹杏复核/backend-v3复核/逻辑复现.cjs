// gpt：只读复现现有缺陷，不修改整卡；不是修复后的回归断言。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||process.cwd()),base=path.join(root,'朱颜血·丹杏');
const {replay}=require(path.join(base,'后台/引擎.js'));
const m=(fields,body='剧情。')=>({mes:body+'<status_bar>'+Object.entries({time:'宣德五年四月初一 酉时',elapsed:'0分钟',...fields}).map(([k,v])=>'<'+k+'>'+v+'</'+k+'>').join('')+'</status_bar>'});
const record={'姓名':'合成测试主角','身位':'江湖任侠','年龄':25,'武功境界':'冲脉','掌握武学':['自设剑法']};
const chat=[{mes:'开场。<status_bar><player_realm>未明</player_realm><player_skills>未明</player_skills></status_bar>\n<details data-zyx-opening="committed"><summary>本次开局卷宗</summary>[玩家开局设定已载入]'+JSON.stringify(record)+'</details>',extra:{zyx_opening:{version:1,record}}}];
const martial=require(path.join(base,'状态栏/v2界面/武学回放.js')).fromChat(chat,{cutoff:0});
assert.equal(martial.playerName,'');assert.equal(martial.identity,'');assert.equal(martial.realm,null);assert.deepEqual(martial.skills,[]);
const proofs=[{id:'r',type:'report',evidence:'差役已经回县衙报案。'},{id:'t',type:'testimony',evidence:'东厂番子已经取得口供。'},{id:'i',type:'intercept_messenger',evidence:'他已截杀传信信使。'}];
const values=[proofs,[proofs[2],proofs[0],proofs[1]]].map(events=>replay([m({elapsed:'初至'}),m({intel_events:JSON.stringify(events)},proofs.map(x=>x.evidence).join(''))]).state.official.val);
assert.deepEqual(values,[5,20]);
const quoted=replay([m({elapsed:'初至'}),m({intel_events:JSON.stringify([{id:'quote',type:'report',evidence:'他低声说：“差役已经回县衙报案。”'}])},'他低声说：“差役已经回县衙报案。”')]).state.official.val;assert.equal(quoted,20);
const growth=[];for(const count of [20,100,200]){const chat=[m({elapsed:'初至'})];for(let i=1;i<=count;i++){const evidence='差役已经回县衙报案，将第'+i+'份案卷交给主簿。';chat.push(m({intel_events:JSON.stringify([{id:'report_'+i,type:'report',evidence}])},evidence));}const r=replay(chat);growth.push({turns:count,rawBytes:Buffer.byteLength(JSON.stringify(chat)),framesBytes:Buffer.byteLength(JSON.stringify(r.frames)),officialInjectionBytes:Buffer.byteLength(JSON.stringify(r.state.official)),history:r.state.official.history.length});}
const card=JSON.parse(fs.readFileSync(path.join(root,'downloads/danxing-backend-v3.json'))),entries=card.data.character_book.entries;
console.log(JSON.stringify({scope:'合成回放；未连接实际酒馆',martial,orderDependentIntel:values,quotedReportIntel:quoted,syntheticGrowth: growth,promptDependencies:{constantSourceCharacters:entries.filter(e=>e.enabled&&e.constant).reduce((n,e)=>n+e.content.length,0),embeddedBookTokenBudget:card.data.character_book.token_budget,unlockedProfileConditionPresent:entries.filter(e=>[24,25,26,27,28].includes(e.id)).map(e=>({id:e.id,enabled:e.enabled,conditional:!!/@@if|<%|dayIndex|zyx_nodes|entered/.test(e.content)}))}},null,2));
