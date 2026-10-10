/* 身份：gpt 下级独立复核。仅新RFC自动晋阶反例，加载同版真源。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const source=path.resolve(process.argv[2]||path.join(base,'fixtures/8fc897d'));
const label=process.argv[3]||'baseline-8fc897d';
if(!/^[a-zA-Z0-9_-]+$/.test(label)) throw Error('invalid output label');
const filter=process.argv[4]?new Set(process.argv[4].split(',').map(Number)):(label==='baseline-8fc897d'?new Set(Array.from({length:14},(_,i)=>i+1)):null);
const sm=path.join(source,'src/state-machine');
const read=f=>fs.readFileSync(path.join(sm,f),'utf8');
function load(file,name,deps){return new vm.Script(read(file)+'\n'+name).runInNewContext({})(deps);}
const constants=new vm.Script(read('data/registry.js')+'\n({HOLDER_TO_RELIC,DEFLOWER_HARD_RES,ALL_FIELDS,FORM_OF_HOLDERS,IDENTITY_NAMES});').runInNewContext({});
const subject=load('rules/subject-evidence-core.js','createXsdSubjectEvidence',{holders:Object.keys(constants.HOLDER_TO_RELIC),hardPatterns:constants.DEFLOWER_HARD_RES});
let physiologicalResponse=()=>false;
const inventory=load('rules/inventory-core.js','createXsdInventoryRules',{console:{warn(){},log(){}},TAG:'[audit]',hasRelicPhysiologicalResponse:(...args)=>physiologicalResponse(...args)});
const plot=load('rules/plot-policy-core.js','createXsdPlotPolicy');
const anchor=load('rules/anchor-validation-core.js','createXsdAnchorRules',{ALL_FIELDS:constants.ALL_FIELDS,normalizeAnchorName:s=>s,anchorEvidenceIn:inventory.anchorEvidenceIn,deflowerEvidenceIn:(p,h)=>subject.deflower(p,h),autoEventGate:plot.autoEventGate,console:{warn(){},log(){}},TAG:'[audit]'});
const ledger=load('state/ledger-core.js','createXsdLedgerReader',{getPrerequisites:()=>anchor.MINGQI_PREREQ});
const correction=require(path.join(source,'src/correction-runtime.js'))({});
const closure=new vm.Script(read('rules/relic.js')+'\n({deriveRelicClosure,出场实证名});').runInNewContext({negatedAround:inventory.negatedAround});
const s2='灼酒流炎穴二阶段',form='灼酒流炎穴成形',s1='灼酒流炎穴一阶段';
const positive='叶红缨的名器开始自发迎合，花房内壁紧紧缠裹。';
const results=[];
const block=(field,value)=>({chatId:'audit-chat',覆盖:{[JSON.stringify(['known',field])]:{path:['known',field],value}}});
function fixture(options={}) {
 let state={身份:'赵无忧',仙盟历:1579.01,known:{[form]:true,[s1]:true},inventory:[],relic_progress:{zhuojiu:{name:'灼酒流炎穴',count:5,target:5,ready:true,history:[]}},...structuredClone(options)};
 const patches=[];
 const current=()=>correction.effective(ledger.mergeStatLayers({stat_data:state},null,{chatId:'audit-chat'}));
 const relic=new vm.Script(read('rules/relic-progress.js')+'\n({RELIC_PILOT_CONFIG,validateRelicAction,calcRelicProgress,hasRelicPhysiologicalResponse});').runInNewContext({HOLDER_TO_RELIC:constants.HOLDER_TO_RELIC,IDENTITY_NAMES:constants.IDENTITY_NAMES,readIdentity:()=>current().身份,readStatData:current,negatedAround:inventory.negatedAround});
 physiologicalResponse=relic.hasRelicPhysiologicalResponse;
 const app=load('rules/milestones-core.js','createXsdMilestoneApplication',{
  ...constants,...inventory,...closure,...relic,structuredClone,console:{warn(){},log(){}},TAG:'[audit]',
  readStatData:current,readKnown:()=>current().known,readIdentity:()=>current().身份,
  normalizeAnchorName:s=>s,validateAnchors:anchor.validateAnchors,deflowerEvidenceIn:(p,h)=>subject.deflower(p,h),nearDeflowerWord:(p,h)=>subject.deflower(p,h).label,hashText:anchor.hashText,
  writeStat:async patch=>{patches.push(structuredClone(patch));state=correction.merge(state,correction.protect(current(),patch,'audit-chat'));return{ok:true,via:'independent-test'};}
 });
 return{app,patches,relic,get state(){return state;},get view(){return current();}};
}
async function check(id,name,run){if(filter&&!filter.has(id))return;try{const evidence=await run();results.push({id,name,pass:true,evidence});}catch(e){results.push({id,name,pass:false,error:e.message,actual:e.actual,expected:e.expected});}}
async function expectStage(options,prose,want){const f=fixture(options);await f.app.applyMilestones({里程碑:[]},20,prose);assert.equal(f.view.known[s2]===true,want);return{stage2:f.view.known[s2]??null,patches:f.patches};}
(async()=>{
 await check(1,'qualified actual response advances',()=>expectStage({},positive,true));
 await check(2,'bystander name and other holder response rejected',()=>expectStage({},'叶红缨在旁观望，孤月的身体自发迎合。',false));
 await check(3,'rumour response rejected',()=>expectStage({},'据说叶红缨已经自发迎合。',false));
 await check(4,'planned response rejected',()=>expectStage({},'叶红缨计划让名器自发迎合。',false));
 await check(5,'stage label mention alone rejected',()=>expectStage({},'叶红缨望着纸上关于二阶段的说明。',false));
 await check(6,'forged ready with count below threshold rejected',()=>expectStage({relic_progress:{zhuojiu:{name:'灼酒流炎穴',count:1,target:5,ready:true,history:[]}}},positive,false));
 await check(7,'forged ready with mismatched target rejected',()=>expectStage({relic_progress:{zhuojiu:{name:'灼酒流炎穴',count:5,target:1,ready:true,history:[]}}},positive,false));
 await check(8,'missing form rejected',()=>expectStage({known:{[s1]:true}},positive,false));
 await check(9,'missing first stage rejected',()=>expectStage({known:{[form]:true}},positive,false));
 await check(10,'manual false stage2 wins',()=>expectStage({人工纠错:block(s2,false)},positive,false));
 await check(11,'manual false form wins',()=>expectStage({人工纠错:block(form,false)},positive,false));
 await check(12,'same floor withdraw response explicit empty milestones rolls back',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:[]},20,positive);assert.equal(f.view.known[s2],true);await f.app.applyMilestones({里程碑:[],swipeId:1},20,'庭院安静，叶红缨没有任何生理反应。');assert.notEqual(f.view.known[s2],true);return{stage2:f.view.known[s2],patches:f.patches};});
 await check(13,'same floor missing milestone column still rolls back',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:[]},20,positive);assert.equal(f.view.known[s2],true);await f.app.applyMilestones({swipeId:1},20,'庭院安静，叶红缨没有任何生理反应。');assert.notEqual(f.view.known[s2],true);return{stage2:f.view.known[s2],patches:f.patches};});
 await check(14,'ready false never advances',()=>expectStage({relic_progress:{zhuojiu:{name:'灼酒流炎穴',count:5,target:5,ready:false,history:[]}}},positive,false));
 await check(15,'explicit stage2 declaration cannot borrow bystander response',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:[s2]},20,'叶红缨在旁观望，孤月的身体自发迎合。');assert.notEqual(f.view.known[s2],true);return{stage2:f.view.known[s2]??null};});
 await check(16,'explicit planned stage2 declaration rejected',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:[s2]},20,'叶红缨计划让名器自发迎合，进入二阶段。');assert.notEqual(f.view.known[s2],true);return{stage2:f.view.known[s2]??null};});
 await check(17,'full progress without response does not auto advance',()=>expectStage({},'庭院安静，叶红缨正在读书。',false));
 const files=['data/registry.js','rules/plot-policy-core.js','rules/subject-evidence-core.js','state/ledger-core.js','rules/inventory-core.js','rules/anchor-validation-core.js','rules/milestones-core.js','rules/relic.js','rules/relic-progress.js'];
 const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')]));
 hashes['src/correction-runtime.js']=crypto.createHash('sha256').update(fs.readFileSync(path.join(source,'src/correction-runtime.js'))).digest('hex');
 const out={identity:'gpt 下级独立复核',source:label,sourceSHA256:hashes,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,results};
 fs.mkdirSync(path.join(base,'results'),{recursive:true});fs.writeFileSync(path.join(base,'results',label+'.json'),JSON.stringify(out,null,2)+'\n');
 for(const r of results)console.log((r.pass?'PASS ':'FAIL ')+r.id+' '+r.name);console.log(out.pass+'/'+results.length+' passed');if(out.fail)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
