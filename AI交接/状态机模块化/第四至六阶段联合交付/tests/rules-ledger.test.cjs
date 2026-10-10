/* 身份：gpt 下级独立复核。直接加载交付源码，不复制被测算法。 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const src = path.join(root, '候选源码/src/state-machine');
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const plain = v => JSON.parse(JSON.stringify(v));
const results = [];
function check(name, fn) { try { fn(); results.push({name, pass:true}); } catch (e) { results.push({name, pass:false, error:e.message}); } }
function factory(file, name, deps) {
 const box = vm.createContext({});
 return new vm.Script(read(file)+'\n'+name).runInContext(box)(deps);
}
const plot = factory('rules/plot-policy-core.js','createXsdPlotPolicy');
const stage = factory('rules/stage-core.js','createXsdStageRules');
const events = [ ['南域大劫',1578.08,1578.07], ['天溪城兽潮',1579.01,1578.12], ['兽潮血战',1579.01,1578.12], ['天溪城破',1579.03,1579.02] ];
for (const [f,start,early] of events) {
 check('auto-world:'+f+':before',()=>assert.equal(plot.autoEventGate(f,{仙盟历:early}).ok,false));
 check('auto-world:'+f+':at',()=>assert.equal(plot.autoEventGate(f,{仙盟历:start}).ok,true));
 check('auto-world:'+f+':after',()=>assert.equal(plot.autoEventGate(f,{仙盟历:1580.01}).ok,true));
 for (const [i,date] of [undefined,null,'',NaN,Infinity,1579,1579.13,'未来'].entries()) check('auto-world:'+f+':invalid:'+i,()=>assert.equal(plot.autoEventGate(f,{仙盟历:date}).ok,false));
}
check('auto-world:unknown ordinary anchor',()=>assert.equal(plot.autoEventGate('孤月定情',{}).ok,true));
check('early beast clause with separate unreached reinforcement remains denied',()=>assert.equal(plot.freeFieldGate('危机','兽潮已破两处防区，援军未至',{仙盟历:1578.03}).ok,false));
check('rumour remains displayable',()=>assert.equal(plot.freeFieldGate('近闻','据说兽潮已围城',{仙盟历:1578.03}).ok,true));
check('future plan remains displayable',()=>assert.equal(plot.freeFieldGate('目标','计划在兽潮已围城时行动',{仙盟历:1578.03}).ok,true));
check('unlabelled war retained pending review',()=>{assert.equal(plot.freeFieldGate('近闻','远处战火连天',{仙盟历:1578.03}).ok,true); assert.equal(plot.freeFieldSuspect('近闻','远处战火连天',{仙盟历:1578.03}).suspect,true);});
check('stage boundary table frozen policy',()=>assert.deepEqual(plain(stage.SEG_TIME),[1578.03,1578.04,1578.06,1578.08,1578.11,1578.11,1578.12,1579.01,1579.01,1579.02,1579.03,1579.04,1579.04,1579.05,1579.06,1580.01]));
for(const [floor,want] of [[0,0],[1,1],[30,1],[31,2],[50,2],[51,3],[360,15],[361,16],[2000,16]]) check('floor boundary:'+floor,()=>assert.equal(stage.stageOfFloor(floor,0),want));
check('scene hold positive',()=>assert.equal(stage.isSceneLocked('两人相拥温存',{}),true));
check('scene departure unlocks hold',()=>assert.equal(stage.isSceneLocked('两人相拥温存，随后启程离开',{}),false));
check('fast forward candidates preserve old policy',()=>assert.equal(stage.checkFastForwardStage({'天溪城破':true},2),11));

const constants = new vm.Script(read('data/registry.js')+'\n({HOLDER_TO_RELIC,DEFLOWER_HARD_RES,ALL_FIELDS,FORM_OF_HOLDERS});').runInNewContext({});
const evidence = factory('rules/subject-evidence-core.js','createXsdSubjectEvidence',{holders:Object.keys(constants.HOLDER_TO_RELIC),hardPatterns:constants.DEFLOWER_HARD_RES});
for(const [name,prose,holder,want] of [
 ['direct subject','叶红缨那一夜破了身，孤月在门外守着','叶红缨',true],
 ['bystander regression','叶红缨那一夜破了身，孤月在门外守着','孤月',false],
 ['watcher','叶红缨看见孤月破身','叶红缨',false],
 ['watched subject','叶红缨看见孤月破身','孤月',true],
 ['negated subject','孤月没有破身','孤月',false],
 ['plan','孤月计划献出初夜','孤月',false],
 ['rumour','据说孤月破身','孤月',false],
 ['virgin noun','孤月仍是处子','孤月',false],
 ['night noun','孤月谈起初夜','孤月',false],
 ['joint subject one','苏瑶和苏玲元阴初破','苏瑶',true],
 ['joint subject two','苏瑶和苏玲元阴初破','苏玲',true],
 ['inverted subject','破身的是孤月','孤月',true],
 ['passive actor must not gain victim fact','叶红缨被孤月破了身','孤月',false],
 ['cross sentence cannot borrow name','叶红缨转身离开。此时初夜已结束','叶红缨',false],
 ['missing prose','', '孤月',false],
 ['unknown subject','路人已经失身','路人',false]
]) check('subject:'+name,()=>assert.equal(evidence.deflower(prose,holder).ok,want));
const inventoryRules = factory('rules/inventory-core.js','createXsdInventoryRules',{console:{warn(){},log(){}},TAG:'[audit]'});
const anchor = factory('rules/anchor-validation-core.js','createXsdAnchorRules',{
 ALL_FIELDS:constants.ALL_FIELDS,normalizeAnchorName:s=>s,anchorEvidenceIn:inventoryRules.anchorEvidenceIn,
 deflowerEvidenceIn:(p,h)=>evidence.deflower(p,h),autoEventGate:plot.autoEventGate,console:{warn(){},log(){}},TAG:'[audit]'
});
const prereq = anchor.MINGQI_PREREQ;
const ledger = factory('state/ledger-core.js','createXsdLedgerReader',{getPrerequisites:()=>prereq});
const merge = (c,m) => ledger.mergeStatLayers(c===null?null:{stat_data:c},m===null?null:{stat_data:m},{chatId:'audit-chat'});
check('ledger missing both',()=>assert.equal(merge(null,null),null));
check('ledger message fields override chat',()=>{ const got=merge({身份:'赵无忧',地点:'旧',known:{甲:true,乙:false}},{地点:'新',known:{乙:true}}); assert.equal(got.地点,'新');assert.deepEqual(plain(got.known),{甲:true,乙:true}); });
check('ledger clone source known',()=>{const c={known:{甲:false},锚点账本:{1:{新置真:['甲']}}};const before=JSON.stringify(c);assert.equal(merge(c,null).known.甲,true);assert.equal(JSON.stringify(c),before);});
check('ledger single sister cannot form whole relic',()=>{const got=merge({known:{},破处者:{苏瑶:'赵无忧'}},null); assert.equal(got.known.苏瑶处女丧失,true);assert.notEqual(got.known.灵犀同心成形,true);});
check('ledger both sisters recover complete relic',()=>assert.equal(merge({known:{},破处者:{苏瑶:'赵无忧',苏玲:'赵无忧'}},null).known.灵犀同心成形,true));
check('ledger additional prerequisite mandatory',()=>assert.notEqual(merge({known:{},破处者:{楚灵夜:'赵无忧'}},null).known.般若菩提菊成形,true));
check('ledger additional prerequisite satisfied',()=>assert.equal(merge({known:{楚灵夜后窍开发:true},破处者:{楚灵夜:'赵无忧'}},null).known.般若菩提菊成形,true));
check('ledger owner name alone cannot create form',()=>assert.notEqual(merge({known:{},名器归属:{九幽玄阴穴:'赵无忧'}},null).known.九幽玄阴穴成形,true));
check('ledger NPC relic cannot give player possession',()=>assert.notEqual(merge({身份:'赵无忧',known:{},破处者:{孤月:'阎雷子'},名器归属:{九幽玄阴穴:'阎雷子'}},null).known.获得任意名器,true));
check('ledger own formed relic grants possession',()=>assert.equal(merge({身份:'赵无忧',known:{},破处者:{孤月:'赵无忧'},名器归属:{九幽玄阴穴:'赵无忧'}},null).known.获得任意名器,true));
check('ledger source historical true preserved',()=>assert.equal(merge({仙盟历:1578.03,known:{天溪城兽潮:true}},null).known.天溪城兽潮,true));
const correction = require('./fixtures/correction-runtime.js')({});
const block = (field,value) => ({chatId:'audit-chat',覆盖:{[JSON.stringify(['known',field])]:{path:['known',field],value}}});
check('ledger manual negative before prerequisite recovery',()=>{const state={身份:'赵无忧',known:{},破处者:{苏瑶:'赵无忧',苏玲:'赵无忧'},人工纠错:block('苏瑶处女丧失',false)}; const got=correction.effective(merge(state,null));assert.equal(got.known.苏瑶处女丧失,false);assert.notEqual(got.known.灵犀同心成形,true);});
check('ledger manual false form remains false',()=>{const state={known:{},破处者:{孤月:'赵无忧'},人工纠错:block('九幽玄阴穴成形',false)};assert.equal(correction.effective(merge(state,null)).known.九幽玄阴穴成形,false);});
check('ledger manual false form prevents new stage',()=>{const state={known:{},破处者:{孤月:'赵无忧'},人工纠错:block('九幽玄阴穴成形',false)};assert.notEqual(correction.effective(merge(state,null)).known.九幽玄阴穴一阶段,true);});
check('ledger previous chat controls cannot override',()=>{const state={known:{},破处者:{孤月:'赵无忧'},人工纠错:{...block('九幽玄阴穴成形',false),chatId:'old-chat'}};assert.equal(merge(state,null).known.九幽玄阴穴成形,true);});
check('ledger stale message control cannot override chat truth',()=>assert.equal(merge({known:{孤月处女丧失:true}},{known:{},人工纠错:block('孤月处女丧失',false)}).known.孤月处女丧失,true));
for(const [f,start,early] of events) {
 const prose = f==='南域大劫'?'南域大劫降临，神诅笼罩天穹':f==='天溪城破'?'天溪城破，城墙已塌':'兽潮围城，城头血战';
 check('anchor dates all evidence present early:'+f,()=>assert.equal(anchor.validateAnchors([f],prose,10,{},[],{仙盟历:early}).good.length,0));
 check('anchor dates threshold true:'+f,()=>assert.deepEqual(plain(anchor.validateAnchors([f],prose,10,{},[],{仙盟历:start}).good),[f]));
 check('anchor dates missing source:'+f,()=>assert.equal(anchor.validateAnchors([f],prose,10,{},[],{}).good.length,0));
}
check('anchor rejects bstander milestone',()=>assert.equal(anchor.validateAnchors(['孤月处女丧失'],'叶红缨那一夜破了身，孤月在门外守着',10,{},[],{仙盟历:1578.03}).good.length,0));
check('anchor same round subject and form allowed',()=>assert.deepEqual(plain(anchor.validateAnchors(['叶红缨处女丧失','灼酒流炎穴成形'],'叶红缨破了身，灼酒流炎穴初醒',10,{},[{持有者:'叶红缨',破处者:'赵无忧'}],{仙盟历:1578.03}).good),['叶红缨处女丧失','灼酒流炎穴成形']));
check('anchor unproven book cannot supply prerequisite',()=>assert.equal(anchor.validateAnchors(['灼酒流炎穴成形'],'灼酒流炎穴尚未成形',10,{},[{持有者:'叶红缨',破处者:'赵无忧'}],{仙盟历:1578.03}).good.length,0));
check('anchor rumour world event not fact',()=>assert.equal(anchor.validateAnchors(['天溪城兽潮'],'据说兽潮围城',10,{},[],{仙盟历:1579.01}).good.length,0));
check('anchor plan world event not fact',()=>assert.equal(anchor.validateAnchors(['天溪城破'],'计划等到天溪城破后离开',10,{},[],{仙盟历:1579.03}).good.length,0));

async function integration() {
 const closure = new vm.Script(read('rules/relic.js')+'\n({deriveRelicClosure,出场实证名});').runInNewContext({negatedAround:inventoryRules.negatedAround});
 const relic = new vm.Script(read('rules/relic-progress.js')+'\n({RELIC_PILOT_CONFIG,validateRelicAction,calcRelicProgress});').runInNewContext({readIdentity:()=> '赵无忧'});
 function fixture(initial={}) {
  let state = {身份:'赵无忧',仙盟历:1579.01,known:{},inventory:[],...structuredClone(initial)};
  const patches=[];
  const current = () => correction.effective(ledger.mergeStatLayers({stat_data:state},null,{chatId:'audit-chat'}));
  const app=factory('rules/milestones-core.js','createXsdMilestoneApplication',{
   ...constants,...inventoryRules,...closure,...relic,structuredClone,console:{warn(){},log(){}},TAG:'[audit]',
   readStatData:current,readKnown:()=>current().known,readIdentity:()=>current().身份,
   normalizeAnchorName:s=>s,validateAnchors:anchor.validateAnchors,
   deflowerEvidenceIn:(p,h)=>evidence.deflower(p,h),nearDeflowerWord:(p,h)=>evidence.deflower(p,h).label,
   hashText:anchor.hashText,
   writeStat:async patch=>{patches.push(structuredClone(patch));state=correction.merge(state,correction.protect(current(),patch,'audit-chat'));return {ok:true,via:'independent-test'};},
  });
  return {app,patches,get state(){return state;},get view(){return current();}};
 }
 async function run(name,fn) {try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
 await run('milestone auto-date ignores forged validation cache',async()=>{const f=fixture({仙盟历:1578.03});await f.app.applyMilestones({里程碑:['天溪城兽潮'],本轮已验证锚点:['天溪城兽潮']},10,'兽潮围城');assert.notEqual(f.view.known.天溪城兽潮,true);});
 await run('milestone eligible world event persisted',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:['天溪城兽潮']},10,'兽潮围城');assert.equal(f.view.known.天溪城兽潮,true);});
 await run('milestone same valid body idempotent',async()=>{const f=fixture();const p={里程碑:['天溪城兽潮']};await f.app.applyMilestones(p,10,'兽潮围城');const count=f.patches.length;await f.app.applyMilestones(p,10,'兽潮围城');assert.equal(f.patches.length,count);});
 await run('milestone same claim changed prose retracts event',async()=>{const f=fixture();const p={里程碑:['天溪城兽潮']};await f.app.applyMilestones(p,10,'兽潮围城');await f.app.applyMilestones(p,10,'庭院平静，没有兽潮');assert.equal(f.view.known.天溪城兽潮,false);assert.equal(f.state.锚点账本['10'],null);});
 await run('milestone new valid proof same floor remains true',async()=>{const f=fixture();const p={里程碑:['天溪城兽潮']};await f.app.applyMilestones(p,10,'兽潮围城');await f.app.applyMilestones(p,10,'兽潮攻城，血战城头');assert.equal(f.view.known.天溪城兽潮,true);assert.ok(f.state.锚点账本['10']);});
 await run('milestone missing claimant cannot borrow subject',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:['孤月处女丧失'],破处:[{持有者:'孤月',破处者:'赵无忧'}]},10,'叶红缨那一夜破了身，孤月在门外守着');assert.notEqual(f.view.known.孤月处女丧失,true);assert.ok(!f.view.破处者?.孤月);});
 await run('milestone NPC fact does not grant player relic',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:['孤月处女丧失'],破处:[{持有者:'孤月',破处者:'阎雷子'}]},10,'孤月被阎雷子破了身');assert.equal(f.view.名器归属.九幽玄阴穴,'阎雷子');assert.notEqual(f.view.known.获得任意名器,true);});
 await run('milestone same round valid book forms relic',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:['叶红缨处女丧失'],破处:[{持有者:'叶红缨',破处者:'赵无忧'}]},10,'叶红缨那一夜破了身，灼酒流炎穴初醒');assert.equal(f.view.known.叶红缨处女丧失,true);assert.equal(f.view.known.灼酒流炎穴成形,true);assert.equal(f.view.破处者.叶红缨,'赵无忧');});
 await run('milestone prose proof rescues form-only declaration',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:['灼酒流炎穴成形']},10,'叶红缨那一夜破了身，灼酒流炎穴初醒');assert.equal(f.view.known.灼酒流炎穴成形,true);assert.equal(f.view.known.灼酒流炎穴一阶段,true);});
 await run('new book same floor removed proof cannot restore false fact',async()=>{const f=fixture();await f.app.applyMilestones({里程碑:['叶红缨处女丧失'],破处:[{持有者:'叶红缨',破处者:'赵无忧'}]},10,'叶红缨那一夜破了身，灼酒流炎穴初醒');await f.app.applyMilestones({里程碑:[],破处:[]},10,'庭院仍然安静，叶红缨尚未破身');assert.notEqual(f.view.known.叶红缨处女丧失,true);assert.notEqual(f.view.known.灼酒流炎穴成形,true);});
 await run('inventory same action changed prose rolls back old deduction',async()=>{const f=fixture({inventory:[{name:'醉春风',count:2}]});const p={里程碑:[],纳戒:{消耗:[{name:'醉春风',count:1}],获得:[]}};await f.app.applyMilestones(p,10,'他取出醉春风喝了一坛');assert.equal(f.view.inventory[0].count,1);await f.app.applyMilestones(p,10,'庭院静悄悄，众人没有动饮食');assert.equal(f.view.inventory[0].count,2);assert.equal(f.state.纳戒账本['10'],null);});
 await run('manual world false survives auto actual event',async()=>{const f=fixture({人工纠错:block('天溪城兽潮',false)});await f.app.applyMilestones({里程碑:['天溪城兽潮']},10,'兽潮围城');assert.equal(f.view.known.天溪城兽潮,false);});
}
if(require.main===module) integration().then(()=>{
 fs.mkdirSync(path.join(root,'验证结果'),{recursive:true});
 const testedFiles=['data/registry.js','rules/stage-core.js','rules/plot-policy-core.js','rules/subject-evidence-core.js','state/ledger-core.js','rules/inventory-core.js','rules/anchor-validation-core.js','rules/milestones-core.js','rules/relic.js','rules/relic-progress.js'];
 const sourceSHA256=Object.fromEntries(testedFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(src,f))).digest('hex')]));
 fs.writeFileSync(path.join(root,'验证结果','rules-ledger-results.json'),JSON.stringify({identity:'gpt 下级独立复核',sourceSHA256,results,pass:results.filter(x=>x.pass).length,fail:results.filter(x=>!x.pass).length},null,2)+'\n');
 for(const r of results) console.log((r.pass?'PASS ':'FAIL ')+r.name+(r.error?' — '+r.error:''));
 console.log('rules-ledger '+results.filter(x=>x.pass).length+'/'+results.length);
 if(results.some(x=>!x.pass)) process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
