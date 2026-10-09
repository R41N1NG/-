'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core'), A = require('../src/api'), {Engine, defaults} = require('../src/engine'), {fixture} = require('./helpers');
const profile = {...defaults().profile,author_review:false, base_url: 'https://mock.test/v1', model: 'mock'};
const text = '警觉初始0，范围0到100。听到异常且实际怀疑时增加20，可每轮重复，最多两次，到60不再生效。解除戒备后调整至30，任务仅一次。阶段调查成功减少5。';
const effect = (operation, value, evidence) => ({operation, variable: 'alert', value, evidence});
function raw(original = text) { return {title: '潜行', variables: [{id: 'alert', title: '警觉', type: 'number', default: 0, min: 0, max: 100, evidence: '警觉初始0，范围0到100。', bounds_evidence: '警觉初始0，范围0到100。'}], nodes: [{id: 'n', title: '调查', detail: original, guidance: '调查当前地点', context_variables: ['alert'], completion_criteria: '调查成功', completion_evidence: '阶段调查成功减少5。', numeric_effects: [effect('add', -5, '阶段调查成功减少5。')], routes: []}], events: [{id: 'noise', title: '异常', description: '目标听见异常并实际怀疑', completion_criteria: '实际听见异常并产生怀疑', exclusions: ['仅计划', '旧事'], evidence: '听到异常且实际怀疑时增加20，可每轮重复，最多两次，到60不再生效。', repeat_policy: 'once_per_accepted_turn', repeat_evidence: '可每轮重复', max_occurrences: 2, max_occurrences_evidence: '最多两次', condition: {variable: {id: 'alert', op: 'lt', value: 60}}, condition_evidence: '到60不再生效', scope: {kind: 'nodes', node_ids: ['n']}, numeric_effects: [effect('add', 20, '听到异常且实际怀疑时增加20')]}, {id: 'calm', title: '解除戒备', description: '确实解除戒备', completion_criteria: '目标实际解除戒备', evidence: '解除戒备后调整至30，任务仅一次。', repeat_policy: 'once', numeric_effects: [effect('set', 30, '解除戒备后调整至30')]}], analysis: {uncertainties: []}}; }
function server(fn) { const requests = []; const api = new A.Client(async (url, options) => { const body = JSON.parse(options.body), input = JSON.parse(body.messages[1].content); requests.push({body, input}); const result = await fn(input, requests.length); return {ok: true, json: async () => ({choices: [{finish_reason: result.finish || 'stop', message: {content: typeof result.value === 'string' ? result.value : JSON.stringify(result.value)}}]})}; }); return {api, requests}; }
const plan = input => ({sections: [{end: input.paragraphs.at(-1).id}], complete: true});
const piece = input => ({title: '调查片段', nodes: [{id: 'n', title: '当前调查', detail: input.original, guidance: '调查当前内容', routes: []}], analysis: {synopsis: '调查'}});
const merge = input => ({title: '整合', nodes: input.nodes.map(n => ({id: n.id, routes: []}))});
test('规划在正式分析之前；短篇保留完整原文与实际请求，数值规则本地转化并持久化', async () => {
 const f = server(input => ({value: input.operation === 'partition' ? plan(input) : input.candidates ? {results: input.candidates.map(e => ({event_id:e.id,status:'completed',evidence:[{message_id:input.dialogue.at(-1).message_id,quote:input.dialogue.at(-1).text}]}))} : raw()}));
 const draft = await f.api.analyze(profile, text); assert.equal(f.requests[0].input.operation, 'partition'); assert.equal(f.requests[1].input.original, text); assert.equal(draft.request_count, 2); assert(draft.planned);
 const p = C.convertAnalysisProject(draft.project), s = C.createProgress(p); assert.equal(p.events.length, 3); assert.deepEqual(p.nodes[0].effects, [{add: {variable: 'alert', value: -5}}]); assert(C.prompt(p, s).includes('警觉：0'));
 C.settleEvent(s, p, 'noise', 'r1', {assistant_id: 1}); assert.equal(s.variables.alert, 20);
 assert.equal(C.settleEvent(s, p, 'noise', 'other-key', {assistant_id: 1}), false); assert.equal(s.event_counts.noise, 1);
 C.settleEvent(s, p, 'noise', 'r2', {assistant_id: 3}); assert.equal(s.variables.alert, 40);
 assert(!C.eligibleEvents(p, s).some(e => e.id === 'noise')); assert.equal(C.settleEvent(s, p, 'noise', 'r3', {assistant_id: 5}), false);
 C.settleEvent(s, p, 'calm', 'r3', {assistant_id: 5}); assert.equal(s.variables.alert, 30); C.completeNode(s, p); assert.equal(s.variables.alert, 25); assert.equal(C.completeNode(s, p), false);
 const stored = C.normalizeProject(JSON.parse(JSON.stringify(p))); assert.equal(stored.events.find(e => e.id === 'noise').max_occurrences, 2);
 const host = fixture(), engine = new Engine(host.host,f.api); await engine.init(); engine.analysisDraft=draft; await engine.applyAnalysis(); await engine.updateSettings({enabled:true,profile});
 host.root.messages[1].message='她听见异常，实际开始怀疑。'; const pair=engine.host.pair(1); await engine.acceptPair(pair,true,{ids:['noise']}); assert.equal(engine.state.variables.alert,20); assert.equal(engine.state.event_counts.noise,1); const count=f.requests.length; await engine.acceptPair(pair,true,{ids:['noise']}); assert.equal(f.requests.length,count); assert.equal(engine.state.variables.alert,20);
});
test('数值效果未知变量/虚构依据/缺完成标准/无依据重复与次数上限均拒绝', () => {
 for (const mutate of [r => r.events[0].numeric_effects[0].variable = 'missing', r => r.events[0].numeric_effects[0].evidence = '虚构', r => r.events[0].repeat_evidence = '', r => r.events[0].max_occurrences_evidence = '', r => r.nodes[0].completion_criteria = '', r => r.events[0].condition = {collected: 'missing'}]) {
  const r = raw(); mutate(r); assert.throws(() => new A.Client().restoreAnalysis(text, r));
 }
 const r = raw(); r.nodes[0].effects = [{add: {variable: 'alert', value: 999}}]; assert.equal(new A.Client().restoreAnalysis(text, r).project.nodes[0].effects[0].add.value, -5);
});
test('单次行为上限与载体总上限独立，门槛停止生效，回退后次数可以恢复', () => {
 const r = raw(); r.events[0].numeric_effects[0].max = 35; r.events[0].numeric_effects[0].bounds_evidence = '到60不再生效';
 const p = C.convertAnalysisProject(new A.Client().restoreAnalysis(text, r).project), s = C.createProgress(p);
 C.settleEvent(s, p, 'noise', 'x1'); C.settleEvent(s, p, 'noise', 'x2'); assert.equal(s.variables.alert, 35); assert.equal(s.event_counts.noise, 2); C.undo(s); assert.equal(s.variables.alert, 20); assert(C.eligibleEvents(p, s).some(e => e.id === 'noise'));
 s.variables.alert = 60; assert(!C.eligibleEvents(p, s).some(e => e.id === 'noise')); assert.throws(() => C.settleEvent(s, p, 'noise', 'x3'), /前置条件/);
});
test('长文分段规划跨窗口覆盖每个字符，逐段分析后整合，请求均遵守输入预算', async () => {
 const source = ('第一场调查。\n第二场交叉条件。\n第三场撤离。\n').repeat(2000), p = {...profile, max_input_chars: 16000, analysis_chunk_chars: 3000};
 const f = server(input => ({value: input.operation === 'partition' ? plan(input) : input.original !== undefined ? piece(input) : merge(input)}));
 const draft = await f.api.analyze(p, source), planning = f.requests.filter(x => x.input.operation === 'partition'), chunks = f.requests.filter(x => x.input.original !== undefined);
 assert(planning.length > 1); assert(chunks.length > 5); assert.equal(planning.flatMap(x => x.input.paragraphs).map(x => x.text).join(''), source); assert.equal(chunks.map(x => x.input.original).join(''), source);
 assert(chunks.every(x => x.input.original.length <= 3000)); assert.equal(draft.project.original_text, source); assert.equal(draft.segment_count, chunks.length); assert.equal(draft.request_count, f.requests.length); assert(f.requests.every(x => x.body.messages.reduce((sum, m) => sum + m.content.length, 0) <= 16000));
});
test('无效/遗漏/重复规划边界回退本地，不丢原文；规划结果不能恢复为剧本', async () => {
 for (const value of [{sections: [{end: 'missing'}], complete: true}, {sections: [{end: 'p1'}, {end: 'p1'}], complete: true}, {sections: [], complete: false}]) {
  const source = '调查场景。'.repeat(400), f = server(input => ({value: input.operation === 'partition' ? value : input.original !== undefined ? piece(input) : merge(input)}));
  const result = await f.api.analyze({...profile, analysis_chunk_chars: 1000}, source); assert.equal(result.project.original_text, source); assert(result.warnings.some(w => w.includes('本地分段')));
 }
 assert.throws(() => new A.Client().restoreAnalysis(text, plan({paragraphs: [{id: 'p1'}]}), 'faithful', {kind: 'plan'}), /不是剧本草稿/);
});
test('某段截断自动缩小重试，保留之前成功段，完整后才交给整合', async () => {
 const source = '调查异常。'.repeat(750); let truncated = false;
 const f = server(input => { if (input.operation === 'partition') return {value: plan(input)}; if (input.original !== undefined && !truncated) { truncated = true; return {finish: 'length', value: '{"nodes":['}; } return {value: input.original !== undefined ? piece(input) : merge(input)}; });
 const replies = [], result = await f.api.analyze({...profile, analysis_chunk_chars: 1500}, source, '', {onResponse: r => replies.push(r)});
 assert(result.warnings.some(w => w.includes('截断'))); assert(replies.some(r => r.finish_reason === 'length')); assert.equal(result.project.original_text, source); assert.equal(result.request_count, f.requests.length); assert(f.requests.at(-1).input.nodes);
});
test('截断连续失败最多缩小三次，不生成半截草稿；取消规划不开始后续段', async () => {
 const source = '持续调查。'.repeat(700), f = server(input => ({value: input.operation === 'partition' ? plan(input) : '{"nodes":[', finish: input.operation === 'partition' ? 'stop' : 'length'}));
 await assert.rejects(f.api.analyze({...profile, analysis_chunk_chars: 8000}, source), /截断/); assert(f.requests.length <= 6);
 const cancelled = server(input => { cancelled.api.cancel(); return {value: plan(input)}; }); await assert.rejects(cancelled.api.analyze(profile, source), /取消/); assert.equal(cancelled.requests.length, 1);
});
test('分段数值事件与节点效果经整合/恢复保留，模型不能覆盖原奖励', async () => {
 const source = text + '\n' + '继续调查。'.repeat(500), f = server(input => {
  if (input.operation === 'partition') return {value: plan(input)};
  if (input.original !== undefined) return {value: input.part === 1 ? raw(input.original) : piece(input)};
  return {value: {...merge(input), events: [], nodes: input.nodes.map(n => ({id: n.id, numeric_effects: [effect('add', 999, '不存在')], routes: []}))}};
 });
 const replies = [], draft = await f.api.analyze({...profile, analysis_chunk_chars: 1000}, source, '', {onResponse: r => replies.push(r)});
 assert.equal(draft.project.events.length, 2); assert.equal(draft.project.events[0].effects[0].add.value, 20); assert.equal(draft.project.nodes[0].effects[0].add.value, -5);
 const last = replies.at(-1), restored = f.api.restoreAnalysis(source, last.text, 'faithful', last); assert.equal(restored.project.events[0].effects[0].add.value, 20);
});
test('默认预算提升，旧精确默认迁移、自定义配置保留', async () => {
 assert.equal(profile.max_input_chars, 64000); assert.equal(profile.analysis_output, 16384); assert.equal(profile.analysis_chunk_chars, 3000); assert.equal(profile.auto_partition, true);
 const f = fixture(); f.storage.script.branch_story_settings.profile = {max_input_chars: 16000, analysis_output: 8192, segment_output: 4096, analysis_prompt: A.V141_PROMPTS.analysis, analysis_merge_prompt: A.V141_PROMPTS.merge};
 const e = new Engine(f.host); await e.init(); assert.equal(e.settings.profile.analysis_prompt, A.PROMPTS.analysis); assert.equal(e.settings.profile.analysis_merge_prompt, A.PROMPTS.merge); assert(!A.V141_PROMPTS.merge.includes('external_node_ids')); assert.equal(e.settings.profile.max_input_chars, 64000); assert(e.settings.profile.auto_partition);
 const custom = fixture(); custom.storage.script.branch_story_settings.profile = {max_input_chars: 12000, analysis_output: 7000, analysis_prompt: '作者自定义'}; const other = new Engine(custom.host); await other.init(); assert.equal(other.settings.profile.max_input_chars, 12000); assert.equal(other.settings.profile.analysis_output, 7000); assert.equal(other.settings.profile.analysis_prompt, '作者自定义');
});
test('快速整理同样提取有依据数值规则，分段规划不会参与基础整理', async () => {
 const f = server(() => ({value: raw()})), draft = await f.api.segment(profile, text);
 assert.equal(f.requests.length, 1); assert.equal(draft.project.events[0].effects[0].add.value, 20); assert.equal(draft.project.nodes[0].effects[0].add.value, -5);
});
test('长文原始记录复用全文与证据；累计恢复上下文达到预算时显式标记', async () => {
 const f = fixture(), e = new Engine(f.host); await e.init(); const source = '原始长文。'.repeat(10000), record = e.beginRaw('analysis',source,'','faithful');
 record({text:'{}',original:source,evidenceSource:source,kind:'plan',mode:'faithful'}); assert(e.rawAnalysis.replies[0].original_from_run); assert(!Object.hasOwn(e.rawAnalysis.replies[0],'original')); assert(!Object.hasOwn(e.rawAnalysis.replies[0],'evidenceSource'));
 assert.throws(()=>e.restoreAnalysis(source,'{}','faithful',e.rawAnalysis.replies[0].id),/不是剧本草稿/);
 const context = {kind:'chunk',knownNodes:[{id:'n',detail:'x'.repeat(1300000)}],original:'原始长文。'};
 record({...context,text:'{}'}); record({...context,text:'{}'}); assert(!e.rawAnalysis.replies[1].context_unavailable); assert(e.rawAnalysis.replies[2].context_unavailable); assert(!e.rawAnalysis.replies[2].knownNodes);
});

test('超过旧20万字符仍可自动分析，超过100万拒绝且不发送请求', async () => {
 const source = '调查场景。'.repeat(42000), f = server(input => ({value: input.operation === 'partition' ? plan(input) : input.original !== undefined ? piece(input) : merge(input)}));
 const result = await f.api.analyze({...profile, analysis_chunk_chars:8000},source); assert.equal(result.project.original_text,source); assert(result.segment_count>20);
 const count = f.requests.length; await assert.rejects(f.api.analyze(profile,'x'.repeat(1000001)),/100 万/); assert.equal(f.requests.length,count);
});
test('最终整合截断时分组重试，已有分段不重跑，局部整合恢复明确标记', async () => {
 const source = '调查事件。'.repeat(1200); let mergeCalls = 0;
 const f = server(input => {
  if (input.operation === 'partition') return {value:plan(input)};
  if (input.original !== undefined) return {value:piece(input)};
  mergeCalls++; return mergeCalls === 1 ? {finish:'length',value:'{"nodes":['} : {value:merge(input)};
 });
 const replies = [], result = await f.api.analyze({...profile,analysis_chunk_chars:1000},source,'',{onResponse:r=>replies.push(r)});
 assert.equal(mergeCalls,3); assert(result.warnings.some(w=>w.includes('拆成两组'))); assert.equal(f.requests.filter(x=>x.input.original!==undefined).length,result.segment_count); assert.equal(result.project.nodes.length,result.segment_count);
 const last = replies.at(-1); assert(last.partial_merge); assert.equal(f.api.restoreAnalysis(source,last.text,'faithful',last).project.nodes.length,result.project.nodes.length);
});
