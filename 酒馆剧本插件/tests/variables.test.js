'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/api'),C=require('../src/core'),{Engine,defaults}=require('../src/engine'),{fixture}=require('./helpers');
const profile={...defaults().profile,author_review:false,base_url:'https://mock.test/v1',model:'mock',auto_partition:false};
const text='任务开始时，警觉为 **0**，范围 0 至 100。\n调查完成增加2。达到60时封锁入口。';
const definition={id:'alertness',title:'警觉',type:'number',default:0,min:0,max:100,evidence:'任务开始时，警觉为 **0**，范围 0 至 100。',bounds_evidence:'范围 0 至 100'};
const raw=variable=>({title:'潜行任务',variables:[variable],nodes:[{id:'n1',title:'调查',source_span:{from:'s1',to:'s1'},guidance:'调查当前现场',completion_criteria:'调查完成',completion_evidence:'调查完成增加2。',numeric_effects:[{operation:'add',variable:'alertness',value:2,evidence:'调查完成增加2。'}],routes:[{target:'n1',label:'继续调查',condition:{variable:{id:'alertness',op:'lt',value:60}},condition_evidence:'达到60时封锁入口。'}]}]});
function mock(fn){const sent=[],api=new A.Client(async(url,options)=>{const input=JSON.parse(JSON.parse(options.body).messages[1].content);sent.push(input);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fn(input))}}]})};});return {sent,api};}
test('变量证据只差排版本地恢复，数值字符串恢复JSON数字，条件和奖励不变',()=>{
 const value={...definition,default:'0',evidence:'任务开始时，警觉为0，范围0至100。',bounds_evidence:'范围0至100'};
 const result=new A.Client().restoreAnalysis(text,raw(value));
 assert.equal(result.request_count,0);assert.equal(result.project.variables[0].default,0);assert(text.includes(result.project.variables[0].evidence));assert(text.includes(result.project.variables[0].bounds_evidence));
 assert.equal(result.project.nodes[0].effects[0].add.value,2);assert.equal(result.project.nodes[0].routes[0].condition.variable.value,60);assert.deepEqual(value.default,'0');assert(result.warnings.some(x=>x.includes('原文依据')));
});
test('改写、改数值、漏句、来源编号和排版匹配歧义不能作为变量证据',()=>{
 for(const evidence of ['任务开始时，警觉为1，范围0至100。','警觉初始为零。','任务开始时，范围0至100。','s1'])assert.throws(()=>new A.Client().restoreAnalysis(text,raw({...definition,evidence})),e=>e.code==='BSE_VARIABLE_INVALID' && e.variable_id==='alertness');
 const repeated=text+'\n任务开始时，警觉为 **0**，范围 0 至 100。';assert.throws(()=>new A.Client().restoreAnalysis(repeated,raw({...definition,evidence:'任务开始时，警觉为0，范围0至100。'})),/连续摘录/);
});
test('类型错误单独说明，不再被冒充为缺少初始值依据',()=>{
 for(const value of [{...definition,type:'floatish'},{...definition,default:'不是数字'},{...definition,default:true}])assert.throws(()=>new A.Client().restoreAnalysis(text,raw(value)),/类型无效/);
 assert.throws(()=>new A.Client().restoreAnalysis(text,raw({...definition,default:null})),/缺少type或default/);
 const inferred={...definition};delete inferred.type;assert.equal(new A.Client().restoreAnalysis(text,raw(inferred)).project.variables[0].type,'number');
 assert.throws(()=>new A.Client().restoreAnalysis(text,raw({...definition,default:'9007199254740993'})),/类型无效/);
});
test('辅助模型integer写法仅在初始值和边界为安全整数时本地兼容，不改数值或额外调用API',async()=>{
 const base=raw({...definition,type:'integer'}),f=mock(()=>base);const result=await f.api.analyze(profile,text);
 assert.equal(f.sent.length,1);assert.equal(result.project.variables[0].type,'number');assert.equal(result.project.variables[0].default,0);assert.equal(result.project.variables[0].max,100);assert(result.warnings.some(x=>x.includes('integer')));
 assert.equal(base.variables[0].type,'integer');
 for(const variable of [{...definition,type:'integer',default:1.5},{...definition,type:'integer',max:99.5},{...definition,type:'integer',default:Number.MAX_SAFE_INTEGER+1}])assert.throws(()=>f.api.restoreAnalysis(text,raw(variable)),/类型无效/);
});
test('可选背包说明改写只留空警告；原文定义、取得前提、完成及数值效果仍校验',()=>{
 const base=raw(definition);base.collections=[{id:'a',title:'现场线索',evidence:'调查完成增加2。',description:'调查现场找到的有用线索。',requires:{variable:{id:'alertness',op:'lt',value:60}},requires_evidence:'达到60时封锁入口。'}];base.nodes[0].result_ids=['a'];
 const d=new A.Client().restoreAnalysis(text,base);assert.equal(d.project.collections[0].description,'');assert.equal(d.project.collections[0].requires.variable.value,60);assert.deepEqual(d.project.nodes[0].effects,[{collect:'a'},{add:{variable:'alertness',value:2}}]);assert(d.warnings.some(x=>x.includes('可选说明')));assert.equal(base.collections[0].description,'调查现场找到的有用线索。');
 base.collections[0].evidence='虚构原文';assert.throws(()=>new A.Client().restoreAnalysis(text,base),/原文依据|原文定义/);
});
test('可选说明仅排版差异恢复为原文，既有分块结果说明与取得条件不被覆盖',()=>{
 const base=raw(definition);base.collections=[{id:'a',title:'现场线索',evidence:'调查完成增加2。',description:'警觉为0，范围0至100。'}];
 const d=new A.Client().restoreAnalysis(text,base);assert(text.includes(d.project.collections[0].description));assert(d.project.collections[0].description.includes('**0**'));
 const known={...d.project.collections[0],description:'原文中已校验的说明'};base.collections[0].description='新的转述';const restored=new A.Client().restoreAnalysis(text,base,'faithful',{kind:'chunk',knownCollections:[known],evidenceSource:text});assert.equal(restored.project.collections[0].description,known.description);
});
test('缺少变量依据时自动定向补修，忽略模型的默认值、边界和奖励修改',async()=>{
 const replies=[],base=raw({...definition,evidence:undefined}),f=mock(input=>input.operation==='repair_variables'?{complete:true,variable_evidence:[{...definition,default:99,min:-100,max:999}],nodes:[{numeric_effects:[{value:999}]}]}:base);
 const draft=await f.api.analyze(profile,text,'',{onResponse:r=>replies.push(r)});assert.equal(f.sent.length,2);assert.equal(f.sent[1].operation,'repair_variables');assert.equal(draft.request_count,2);
 assert.equal(draft.project.variables[0].default,0);assert.equal(draft.project.variables[0].max,100);assert.equal(draft.project.nodes[0].effects[0].add.value,2);assert.equal(draft.project.nodes[0].routes[0].condition.variable.value,60);
 const repair=replies.at(-1);assert.equal(repair.repair_type,'variables');assert.equal(f.api.restoreAnalysis(text,repair.text,'faithful',repair).project.variables[0].default,0);
});
test('原文有初始值但模型漏填时可定向补齐，不漏掉原有数值规则',async()=>{
 const missing={...definition};delete missing.default;delete missing.type;
 const f=mock(input=>input.operation==='repair_variables'?{complete:true,variable_evidence:[definition]}:raw(missing));
 const draft=await f.api.analyze(profile,text);assert.equal(draft.project.variables[0].default,0);assert.equal(draft.project.nodes[0].effects[0].add.value,2);assert.equal(f.sent.length,2);
});
test('多个变量缺依据集中一次补修，完整性要求覆盖全部指定ID',async()=>{
 const second={id:'energy',title:'精力',type:'number',default:10,evidence:'精力初始10。'},source=text+'精力初始10。';
 const base=raw({...definition,evidence:undefined});base.variables.push({...second,evidence:undefined});
 const f=mock(input=>input.operation==='repair_variables'?{complete:true,variable_evidence:[definition,second]}:base);
 const draft=await f.api.analyze(profile,source);assert.equal(f.sent.length,2);assert.equal(f.sent[1].variables.length,2);assert.equal(draft.project.variables.length,2);assert.equal(draft.project.variables[1].default,10);
 const partial=mock(input=>input.operation==='repair_variables'?{complete:true,variable_evidence:[definition]}:base);await assert.rejects(partial.api.analyze(profile,source),/alertness|警觉/);assert.equal(partial.sent.length,3);
});
test('补修无初始值则待配置，保留原始回复不生成可执行草稿，不重试或猜0',async()=>{
 const base=raw({...definition,evidence:undefined,default:null}),f=mock(input=>input.operation==='repair_variables'?{complete:false,unresolved_ids:['alertness']}:base),state=fixture(),e=new Engine(state.host,f.api);await e.init();await e.updateSettings({profile});
 await assert.rejects(e.analyze(text),e=>e.code==='BSE_VARIABLE_CONFIG_REQUIRED' && /待配置/.test(e.message));assert.equal(f.sent.length,2);assert.equal(e.analysisDraft,null);assert.equal(e.rawAnalysis.replies.length,2);assert(e.rawAnalysis.error.includes('待配置'));assert.equal(e.project.title,'停电酒店 · 分支演示');assert.equal(e.busy,0);
});
test('变量补修至多两次；未知、重复ID及半截格式不修改原稿',async()=>{
 for(const repair of [{complete:true,variable_evidence:[]},{complete:true,variable_evidence:[{...definition,id:'unknown'}]},{complete:true,variable_evidence:[{...definition,evidence:'虚构原句'}]}]){
  const f=mock(input=>input.operation==='repair_variables'?repair:raw({...definition,evidence:undefined}));await assert.rejects(f.api.analyze(profile,text),/警觉|alertness/);assert.equal(f.sent.length,3);
 }
});
test('节点来源和变量补修共用两次预算，不能在失败之间无限循环',async()=>{
 const f=mock(input=>input.operation==='repair_source'?{complete:true,node_sources:[{id:'n1',source_span:{from:'s1',to:'s1'}}]}:input.operation==='repair_variables'?{complete:true,variable_evidence:[definition]}:{...raw({...definition,evidence:undefined}),nodes:raw(definition).nodes.map(n=>({...n,source_span:undefined,detail:'改写的调查'}))});
 const result=await f.api.analyze(profile,text);assert.equal(f.sent.length,3);assert.equal(result.request_count,3);assert.equal(result.project.nodes[0].effects[0].add.value,2);
});
test('手动补修失败记录，已有依据本地恢复零API；取消不接受晚到补修',async()=>{
 const base=raw({...definition,evidence:undefined}),f=mock(()=>({complete:true,variable_evidence:[definition]}));const result=await f.api.repairAnalysis(profile,text,base);assert.equal(result.request_count,1);
 assert.equal((await f.api.repairAnalysis(profile,text,raw(definition))).request_count,0);assert.equal(f.sent.length,1);
 const cancelled=mock(input=>{if(input.operation==='repair_variables'){cancelled.api.cancel();return {complete:true,variable_evidence:[definition]};}return base;});await assert.rejects(cancelled.api.analyze(profile,text),/取消/);
});
test('分块变量证据可来自全篇，补修记录保持本块来源；既有变量不重复猜初值',async()=>{
 const original=text+'\n'+('当前场景。'.repeat(220)),replies=[];
 const f=mock(input=>input.operation==='partition'?{complete:true,sections:[{end:input.paragraphs.at(-1).id}]}:input.operation==='repair_variables'?{complete:true,variable_evidence:[definition]}:input.original!==undefined?{...raw(input.part===1?{...definition,evidence:undefined}:{id:'alertness'}),nodes:raw(definition).nodes.map(n=>({id:n.id,title:n.title,guidance:n.guidance,source_span:{from:'s1',to:input.source_index.at(-1).id},routes:[]}))}:{nodes:input.nodes.map(n=>({id:n.id,routes:[]}))});
 const result=await f.api.analyze({...profile,auto_partition:true,max_input_chars:8000,analysis_chunk_chars:500},original,'',{onResponse:r=>replies.push(r)});assert(result.segment_count>1);
 const repair=replies.find(r=>r.repair_type==='variables');assert(repair.original.length<original.length);assert.equal(f.sent.find(x=>x.operation==='repair_variables').original,original);
 const recovered=f.api.restoreAnalysis(repair.original,repair.text,'faithful',repair);assert.equal(recovered.project.variables[0].default,0);assert.equal(recovered.project.nodes[0].detail,repair.original);
 assert.equal(result.project.variables.length,1);assert.equal(result.project.variables[0].default,0);
});
test('v1.4.4默认提示词升级，自定义保留，变量在本地结算而非让API计算',async()=>{
 const state=fixture();state.storage.script.branch_story_settings.profile={analysis_prompt:A.V144_PROMPTS.analysis,segment_prompt:A.V144_PROMPTS.segment};const e=new Engine(state.host);await e.init();assert.equal(e.settings.profile.analysis_prompt,A.PROMPTS.analysis);assert(!A.V144_PROMPTS.analysis.includes('变量逐项自检'));
 const p=new A.Client().restoreAnalysis(text,raw(definition)).project,s=C.createProgress(p);C.completeNode(s,p,'N1');assert.equal(s.variables.alertness,2);
});
