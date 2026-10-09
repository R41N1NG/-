'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const A = require('../src/api'), {Engine, defaults} = require('../src/engine'), {fixture} = require('./helpers');
const profile = {...defaults().profile,author_review:false, base_url: 'https://mock.test/v1', model: 'mock'};
const raw = node => ({title: '测试', nodes: [{id: 'n1', title: '调查现场', guidance: '观察现场', routes: [], ...node}]});
const source = '# 场景\r\n\r\n' + '雨滴打在屋檐，观察当前街道。'.repeat(12) + '\r\n\r\n' + '【下一场】\n' + '街角传来脚步声。'.repeat(110) + '🔒';
function mock(fn) {
 const sent = [], api = new A.Client(async (url, options) => {
  const input = JSON.parse(JSON.parse(options.body).messages[1].content); sent.push(input);
  return {ok: true, json: async () => ({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(fn(input))}}]})};
 }); return {sent, api};
}
test('来源索引覆盖全文且位置精确，保留换行、标记及代理对', () => {
 const text = source + '字'.repeat(798) + '🔒尾部', index = A.sourceIndex(text);
 assert.equal(index.map(x=>text.slice(x.start,x.end)).join(''), text);
 assert(index.every((x,i)=>x.id==='s'+(i+1) && x.start===(i ? index[i-1].end : 0) && !/[\uD800-\uDBFF]$/.test(text.slice(x.start,x.end))));
 assert(index.length > 1); assert.deepEqual(A.sourceIndex(text), index);
});
test('编号选取单段或连续多段，由程序还原原文而非信任转述', () => {
 const index = A.sourceIndex(source), span = {from:index[0].id,to:index[1].id};
 const result = new A.Client().restoreAnalysis(source,raw({source_span:span, detail:'模型改写的故事'}));
 assert.equal(result.project.nodes[0].detail,source.slice(0,index[1].end)); assert(result.warnings.some(x=>x.includes('忽略模型改写')));
 assert(!Object.hasOwn(result.project.nodes[0],'source_span'));
 assert.equal(new A.Client().restoreAnalysis(source,raw({source_span:{from:'s2',to:'s2'}})).project.nodes[0].detail,source.slice(index[1].start,index[1].end));
});
test('未知/逆序/缺字段/非对象来源拒绝并指出节点；不能用旧detail绕过坏编号', () => {
 for (const span of [{from:'s99',to:'s99'},{from:'s2',to:'s1'},{from:'s1'},'s1']) {
  assert.throws(()=>new A.Client().restoreAnalysis(source,raw({source_span:span,detail:source})),e=>e.message.includes('调查现场') && e.message.includes('n1'));
 }
 assert.throws(()=>new A.Client().restoreAnalysis('   ',raw({source_span:{from:'s1',to:'s1'}})),/原文|空白/);
});
test('同一来源片段内用短首尾定位精确选取，不能省略中间句或伪造定位', () => {
 const text = '序言。\n进入房间。\n观察桌面。\n取得房卡。\n离开房间。';
 const span = {from:'s1',to:'s1',start_quote:'进入房间。',end_quote:'取得房卡。'};
 assert.equal(new A.Client().restoreAnalysis(text,raw({source_span:span})).project.nodes[0].detail,'进入房间。\n观察桌面。\n取得房卡。');
 for (const bad of [{...span,start_quote:'进入大厅。'},{...span,end_quote:1},{...span,start_quote:'离开房间。'}]) assert.throws(()=>new A.Client().restoreAnalysis(text,raw({source_span:bad})),/定位|start_quote|end_quote/);
 assert.throws(()=>new A.Client().restoreAnalysis(text+'进入房间。',raw({source_span:span})),/不唯一/);
});
test('补写不能冒充原文，也不能依靠来源编号取得自动规则', () => {
 const api = new A.Client();
 assert.throws(()=>api.restoreAnalysis(source,raw({suggested:true,source_span:{from:'s1',to:'s1'},detail:''}),'expand'),/补写节点/);
 assert.throws(()=>api.restoreAnalysis(source,raw({suggested:true,detail:source}),'expand'),/补写节点/);
 assert.equal(api.restoreAnalysis(source,raw({suggested:true,detail:''}),'expand').project.nodes[0].detail,'');
});
test('旧回复只改变空白时本地恢复唯一连续原文，不请求API', () => {
 const original = '【开场】\n雨落下来。\r\n\r\n你拿起房卡。\n【下一场】';
 const result = new A.Client().restoreAnalysis(original,raw({detail:'雨落下来。 你拿起房卡。'}));
 assert.equal(result.project.nodes[0].detail,'雨落下来。\r\n\r\n你拿起房卡。'); assert(result.warnings.some(x=>x.includes('仅修复换行/空格'))); assert.equal(result.request_count,0);
 const exact = new A.Client().restoreAnalysis(original,raw({detail:'雨落下来。'})); assert(!exact.warnings.some(x=>x.includes('仅修复')));
});
test('旧回复改字/删句/换标点/倒序/分散摘录拒绝；空白归一存在歧义也拒绝', () => {
 const api = new A.Client(), text = '雨落下来。\n守卫经过。\n你拿起房卡。';
 for (const detail of ['雨落上来。','雨落下来！','雨落下来。你拿起房卡。','你拿起房卡。雨落下来。']) assert.throws(()=>api.restoreAnalysis(text,raw({detail})),/调查现场.*n1.*连续摘录/);
 assert.throws(()=>api.restoreAnalysis('雨落下来。\n你拿起房卡。\n雨落下来。\r\n你拿起房卡。',raw({detail:'雨落下来。 你拿起房卡。'})),/多个匹配/);
});
test('主分析和快速整理发送相同来源索引，模型不抄正文也生成可编辑草稿', async () => {
 for (const method of ['analyze','segment']) {
  const f = mock(input => input.operation==='partition' ? {sections:[{end:input.paragraphs.at(-1).id}],complete:true} : raw({source_span:{from:input.source_index[0].id,to:input.source_index.at(-1).id}}));
  const draft = await f.api[method](profile,source); assert.equal(draft.project.nodes[0].detail,source);
  assert.deepEqual(f.sent.at(-1).source_index,A.sourceIndex(source));
 }
});
test('分块来源编号只用于本块，整合与恢复保留本地原文和跨块索引', async () => {
 const text = source.repeat(3), replies=[];
 const f = mock(input=>input.operation==='partition' ? {sections:[{end:input.paragraphs.at(-1).id}],complete:true} : input.original!==undefined ? raw({source_span:{from:input.source_index[0].id,to:input.source_index.at(-1).id}}) : {nodes:input.nodes.map(n=>({id:n.id,routes:[]}))});
 const draft=await f.api.analyze({...profile,analysis_chunk_chars:1000},text,'',{onResponse:r=>replies.push(r)});
 assert(draft.segment_count>1); assert.equal(draft.project.nodes.map(n=>n.detail).join(''),text);
 const chunk=replies.find(r=>r.kind==='chunk'), restored=f.api.restoreAnalysis(chunk.original,chunk.text,'faithful',chunk);
 assert.equal(restored.project.nodes[0].detail,chunk.original);
 const last=replies.at(-1), merged=f.api.restoreAnalysis(text,last.text,'faithful',last);
 assert.equal(merged.project.nodes.map(n=>n.detail).join(''),text); assert(!last.nodes.some(n=>n.source_span));
});
test('来源编号不代替数值/完成规则的精确证据，虚构依据仍拒绝', () => {
 const text='警觉初始0。\n调查完成增加2。', base=raw({source_span:{from:'s1',to:'s1'},completion_criteria:'调查完成',completion_evidence:'调查完成增加2。',numeric_effects:[{operation:'add',variable:'alert',value:2,evidence:'调查完成增加2。'}]});
 base.variables=[{id:'alert',title:'警觉',type:'number',default:0,evidence:'警觉初始0。'}];
 assert.equal(new A.Client().restoreAnalysis(text,base).project.nodes[0].effects[0].add.value,2);
 for (const evidence of ['s1','调查完成 增加2。','虚构条款']) {base.nodes[0].numeric_effects[0].evidence=evidence;assert.throws(()=>new A.Client().restoreAnalysis(text,base),/依据/);}
});
test('v1.4.2默认自动升级到来源编号格式，作者自定义提示词保持原样', async () => {
 const f=fixture();f.storage.script.branch_story_settings.profile={analysis_prompt:A.V142_PROMPTS.analysis,segment_prompt:A.V142_PROMPTS.segment};
 const e=new Engine(f.host);await e.init();assert.equal(e.settings.profile.analysis_prompt,A.PROMPTS.analysis);assert.equal(e.settings.profile.segment_prompt,A.PROMPTS.segment);assert(!A.V142_PROMPTS.analysis.includes('source_span'));
 const custom=fixture();custom.storage.script.branch_story_settings.profile={analysis_prompt:'自定义摘录格式'};const other=new Engine(custom.host);await other.init();assert.equal(other.settings.profile.analysis_prompt,'自定义摘录格式');
 const legacy=mock(input=>raw({detail:input.original})); await legacy.api.analyze({...profile,auto_partition:false,analysis_prompt:'自定义摘录格式'},source);assert(!legacy.sent[0].source_index);
});

test('旧回复只丢失Markdown标题/粗体时恢复真实原文，仍拒绝改字、漏句和符号变化',()=>{
 const text='## 开场\n目标是**二十四岁**，身份为__特工__。\n警觉增加2。';
 const result=new A.Client().restoreAnalysis(text,raw({detail:'开场\n目标是二十四岁，身份为特工。\n警觉增加2。'}));
 assert(text.includes(result.project.nodes[0].detail));assert(result.project.nodes[0].detail.includes('**二十四岁**'));assert(result.warnings.some(x=>x.includes('Markdown')));
 for(const detail of ['目标是二十三岁，身份为特工。','目标是二十四岁，警觉增加2。','目标是二十四岁，身份为特工！'])assert.throws(()=>new A.Client().restoreAnalysis(text,raw({detail})),/连续摘录/);
 assert.throws(()=>new A.Client().restoreAnalysis('费用2*3。',raw({detail:'费用23。'})),/连续摘录/);
 assert.throws(()=>new A.Client().restoreAnalysis('```text\n## 密码\n**ab**\n```',raw({detail:'密码ab'})),/连续摘录/);
});
test('节点正文失败自动补修来源，模型额外输出的条件与奖励不能覆盖原稿',async()=>{
 const text='警觉初始0。\n调查完成增加2。', replies=[];
 const f=mock(input=>input.operation==='repair_source'? {complete:true,node_sources:[{id:'n1',source_span:{from:'s1',to:'s1'}}],variables:[{id:'alert',default:999}],numeric_effects:[{value:999}]} : {...raw({detail:'模型转述调查。',completion_criteria:'调查完成',completion_evidence:'调查完成增加2。',numeric_effects:[{operation:'add',variable:'alert',value:2,evidence:'调查完成增加2。'}]}),variables:[{id:'alert',title:'警觉',type:'number',default:0,evidence:'警觉初始0。'}]});
 const result=await f.api.analyze({...profile,auto_partition:false},text,'',{onResponse:r=>replies.push(r)});
 assert.equal(f.sent.length,2);assert.equal(result.project.nodes[0].detail,text);assert.equal(result.project.nodes[0].effects[0].add.value,2);assert.equal(result.project.variables[0].default,0);assert.equal(result.request_count,2);
 const reply=replies.at(-1);assert.equal(reply.kind,'repair');const restored=f.api.restoreAnalysis(text,reply.text,'faithful',reply);assert.equal(restored.project.nodes[0].effects[0].add.value,2);
});
test('来源补修失败最多两次，停止生成草稿且保留原节点诊断',async()=>{
 const f=mock(input=>input.operation==='repair_source'?{complete:true,node_sources:[{id:'n1',source_span:{from:'s99',to:'s99'}}]}:raw({detail:'改写的文本。'}));
 await assert.rejects(f.api.analyze({...profile,auto_partition:false},'调查原文。'),/调查现场/);assert.equal(f.sent.length,3);assert.equal(f.sent.filter(x=>x.operation==='repair_source').length,2);
 const bad=mock(input=>input.operation==='repair_source'?{complete:false,node_sources:[]}:raw({detail:'改写文本。'}));await assert.rejects(bad.api.analyze({...profile,auto_partition:false},'调查原文。'),/连续摘录/);assert.equal(bad.sent.length,3);
});
test('来源补修只能修原文；规则证据失败仅补修证据，取消补修不接受晚到结果',async()=>{
 const f=mock(input=>raw({source_span:{from:'s1',to:'s1'},completion_criteria:'完成',completion_evidence:'虚构完成'}));await assert.rejects(f.api.analyze({...profile,auto_partition:false},'调查原文。'),/依据/);assert.equal(f.sent.length,3);assert.equal(f.sent.filter(x=>x.operation==='repair_evidence').length,2);
 const cancelled=mock(input=>{if(input.operation==='repair_source'){cancelled.api.cancel();return {complete:true,node_sources:[{id:'n1',source_span:{from:'s1',to:'s1'}}]};}return raw({detail:'改写原文。'});});await assert.rejects(cancelled.api.analyze({...profile,auto_partition:false},'调查原文。'),/取消/);assert.equal(cancelled.sent.length,2);
});

test('手动补修保留失败回复及规则，最多两次，已能本地恢复时零API',async()=>{
 const text='调查完成，获得房卡。', f=mock(input=>({complete:true,node_sources:[{id:'n1',source_span:{from:'s1',to:'s1'}}]})), bad=raw({detail:'改写后的调查。',completion_criteria:'调查完成',completion_evidence:text});
 const result=await f.api.repairAnalysis(profile,text,bad);assert.equal(f.sent.length,1);assert.equal(result.project.nodes[0].detail,text);assert.equal(result.project.nodes[0].completion_criteria,'调查完成');
 const local=await f.api.repairAnalysis(profile,text,raw({detail:text}));assert.equal(local.request_count,0);assert.equal(f.sent.length,1);
 const no=mock(()=>({complete:false,node_sources:[]}));await assert.rejects(no.api.repairAnalysis(profile,text,bad),/两次/);assert.equal(no.sent.length,2);
 const state=fixture(),e=new Engine(state.host,f.api);await e.init();await e.updateSettings({profile});const record=e.beginRaw('analysis',text,'','faithful');record({kind:'chunk',original:text,text:JSON.stringify(bad),mode:'faithful',part:1,parts:2,finish_reason:'stop'});const first=e.rawAnalysis.replies[0].id;e.rawAnalysis.error='旧错误';e.error='旧错误';
 const restored=await e.repairAnalysis(text,JSON.stringify(bad),'faithful',first);assert(restored.is_partial);assert.equal(e.rawAnalysis.replies.length,2);assert.equal(e.rawAnalysis.replies[0].id,first);assert.equal(e.rawAnalysis.error,'');assert.equal(e.error,'');assert.equal(e.busy,0);
});
test('手动补修拒绝截断回复和错误原文，不调用API；成功本地恢复清掉历史错误',async()=>{
 const text='调查原文。',f=mock(()=>{throw Error('不应调用');}),state=fixture(),e=new Engine(state.host,f.api);await e.init();const record=e.beginRaw('analysis',text,'','faithful');record({kind:'full',original:text,text:'{}',mode:'faithful',finish_reason:'length'});await assert.rejects(e.repairAnalysis(text,'{}','faithful',e.rawAnalysis.replies[0].id),/截断/);assert.equal(f.sent.length,0);
 e.rawAnalysis.error='旧的连续摘录错误';e.error='旧的连续摘录错误';e.restoreAnalysis(text,raw({detail:text}));assert.equal(e.rawAnalysis.error,'');assert.equal(e.error,'');
});
