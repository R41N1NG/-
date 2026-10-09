'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core'), F = require('../src/flow'), A = require('../src/api'), {Engine} = require('../src/engine');
const {fixture, mockClient} = require('./helpers');
const profile = {base_url: 'https://mock.test/v1', model: 'mock', max_input_chars: 16000};
const lines = ['信任初始为20，范围0到100。', '领取通行证记为a。', '取得密钥记为b。', '记录巡查时间记为d。', '违约失去资格记为e。',
  '主动放弃通行证记为lost_a，此后不能再走通行证路线。', '取证成功记为c。', '进入密室需要有效通行证a或密钥b。', '同时必须已有巡查时间d且未违约e。',
  '取证成功也需要相同进入条件。', '通行证路线与密钥路线互斥。', '事件只能在未违约时继续。', '信任达到70或持有密钥b可以获准入内。'];
const original = lines.join('\n');
const gate = () => ({all: [{any: [{all: [{collected: 'a'}, {not: {collected: 'lost_a'}}]}, {collected: 'b'}]}, {collected: 'd'}, {not: {collected: 'e'}}]});
function raw() {
  const codes = ['a', 'b', 'd', 'e', 'lost_a', 'c'];
  const collections = codes.map((id, i) => ({id, title: ['通行证', '密钥', '巡查时间', '违约', '放弃通行证', '取证完成'][i], evidence: lines[i + 1]}));
  collections[0].requires = {not: {collected: 'lost_a'}}; collections[0].requires_evidence = lines[5];
  collections[5].requires = gate(); collections[5].requires_evidence = lines.slice(7, 10);
  const nodes = [{id: 'hub', title: '调查大厅', detail: original, guidance: '让玩家自由选择调查方向', routes: codes.map(id => ({target: 'get_' + id, label: id === 'c' ? '探查密室' : '调查' + id,
    ...(id === 'c' ? {condition: gate(), condition_evidence: lines.slice(7, 9)} : {})}))}];
  codes.forEach((id, i) => nodes.push({id: 'get_' + id, title: collections[i].title, detail: lines[i + 1], guidance: '演绎当前行动', completion_criteria: lines[i + 1], completion_evidence: lines[i + 1], completion_exclusions: ['只有意图或假设'], result_ids: [id], routes: [],
    ...(id === 'c' ? {entry_condition: gate(), entry_condition_evidence: lines.slice(7, 9)} : {})}));
  return {title: '替代路线与选择代价', start_node_id: 'hub', variables: [{id: 'trust', title: '信任', type: 'number', default: 20, min: 0, max: 100, evidence: lines[0], bounds_evidence: lines[0]}], collections, nodes,
    analysis: {uncertainties: ['后续隐藏用途需作者核对']}};
}
const client = data => new A.Client(async () => ({ok: true, json: async () => ({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(data)}}]})}));
const restore = data => new A.Client().restoreAnalysis(original, data).project;

test('分析得到嵌套OR/AND/NOT与永久失去路径，转化后的真实入口和领奖仍按完整条件执行', () => {
  const p = C.convertAnalysisProject(restore(raw())); F.assertRunnable(p); const target = p.nodes.at(-1).id;
  const cases = [[[], false], [['a', 'd'], true], [['b', 'd'], true], [['a', 'd', 'lost_a'], false], [['a', 'b', 'd', 'lost_a'], true], [['b'], false], [['b', 'd', 'e'], false]];
  for (const [codes, allowed] of cases) {
    const s = C.createProgress(p); s.collected_ids = [...codes];
    assert.equal(C.condition(p.nodes[0].routes.at(-1).condition, s), allowed);
    if (allowed) { C.enterNode(s, p, target); C.completeNode(s, p); assert(s.collected_ids.includes('c')); }
    else { assert.throws(() => C.enterNode(s, p, target), /未解锁/); assert.throws(() => C.completeNode(s, p, null, target), /前置/); assert.equal(s.current_node_id, p.start_node_id); assert(!s.collected_ids.includes('c')); }
  }
  const s = C.createProgress(p); s.collected_ids = ['lost_a']; assert.throws(() => C.completeNode(s, p, null, p.nodes[1].id), /前置/);
});
test('数值门槛与特殊许可为OR，分析保存原文数值边界而非编造默认值', () => {
  const data = raw(), condition = {any: [{variable: {id: 'trust', op: 'gte', value: 70}}, {collected: 'b'}]};
  data.nodes[0].routes.at(-1).condition = condition; data.nodes[0].routes.at(-1).condition_evidence = lines[12]; const p = restore(data), s = C.createProgress(p);
  assert.equal(p.variables[0].min, 0); assert.equal(p.variables[0].max, 100); assert.equal(C.condition(p.nodes[0].routes.at(-1).condition, s), false);
  s.variables.trust = 70; assert.equal(C.condition(p.nodes[0].routes.at(-1).condition, s), true); s.variables.trust = 20; s.collected_ids = ['b']; assert.equal(C.condition(p.nodes[0].routes.at(-1).condition, s), true);
  data.variables[0].bounds_evidence = '编造上限'; assert.throws(() => restore(data), /边界缺少/);
});
test('有原文依据的互斥保留为运行规则；未知、自身互斥和虚构证据拒绝', () => {
  const data = raw(); data.collections[0].exclusive_with = ['b']; data.collections[0].exclusive_with_evidence = lines[10]; const p = restore(data), s = C.createProgress(p);
  assert.deepEqual(p.collections[0].exclusive_with, ['b']); s.collected_ids = ['b']; assert.equal(C.resultReady('a', p, s), false);
  for (const bad of [['a'], ['missing']]) { data.collections[0].exclusive_with = bad; assert.throws(() => restore(data), /互斥结果引用/); }
  data.collections[0].exclusive_with = ['b']; data.collections[0].exclusive_with_evidence = '互斥不存在'; assert.throws(() => restore(data), /exclusive_with_evidence/);
});
test('分散证据逐条检查，空组合和部分虚构不能形成条件', () => {
  const data = raw(); data.nodes[0].routes.at(-1).condition_evidence = [lines[7], '不存在的条款']; assert.throws(()=>restore(data),error=>error.code==='BSE_EVIDENCE_INVALID' && error.evidence_issues.some(x=>x.path.at(-1)==='condition_evidence'));
  data.nodes.at(-1).entry_condition_evidence = [lines[7], '不存在的条款']; assert.throws(() => restore(data), /entry_condition_evidence/);
  data.nodes.at(-1).entry_condition_evidence = lines.slice(7, 9); data.nodes[0].routes.at(-1).condition_evidence = lines.slice(7, 9);
  for (const op of ['all', 'any']) { data.nodes[0].routes.at(-1).condition = {[op]: []}; assert.throws(() => restore(data), /非空数组/); }
});
test('分析与基础整理共用条件校验，入口、前提、代价和数字边界不会只落入报告', async () => {
  const p = (await client(raw()).segment(profile, original)).project;
  assert.deepEqual(p.nodes.at(-1).entry_condition, gate()); assert.deepEqual(p.collections.at(-1).requires, gate()); assert.equal(p.variables[0].max, 100);
  assert.deepEqual(p.nodes[0].routes.at(-1).condition, gate()); assert(!C.prompt(p, C.createProgress(p)).includes('取证成功记为c'));
});
test('事件包触发与持续条件独立保存；持续条件没有依据不能默认为true', () => {
  const data = raw(); data.nodes[0].routes.pop(); data.packages = [{id: 'P1', title: '密室事件', node_ids: ['get_c'], condition: gate(), condition_evidence: lines.slice(7, 9), continue_condition: {not: {collected: 'e'}}, continue_condition_evidence: lines[11]}];
  const p = restore(data); assert.deepEqual(p.packages[0].condition, gate()); assert.deepEqual(p.packages[0].continue_condition, {not: {collected: 'e'}});
  data.packages[0].continue_condition_evidence = ''; assert.throws(() => restore(data), /continue_condition_evidence/);
});
test('仅迁移v1.4.0默认提示词；自定义分析和合并提示词完整保留', async () => {
  const f = fixture(); f.storage.script.branch_story_settings = {profile: {analysis_prompt: A.V140_PROMPTS.analysis, segment_prompt: A.V140_PROMPTS.segment, analysis_merge_prompt: '作者自己打磨的合并规则'}};
  const e = new Engine(f.host, mockClient()); await e.init(); assert.equal(e.settings.profile.analysis_prompt, A.PROMPTS.analysis); assert.equal(e.settings.profile.segment_prompt, A.PROMPTS.segment); assert.equal(e.settings.profile.analysis_merge_prompt, '作者自己打磨的合并规则');
});
function chunkClient(responder) {
  const requests = [], replies = []; const api = new A.Client(async (url, options) => {
    const request = JSON.parse(options.body), input = JSON.parse(request.messages[1].content); requests.push(request);
    const data = responder(input, requests); return {ok: true, json: async () => ({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(data)}}]})};
  }); return {api, requests, replies, options: {onResponse: reply => replies.push(reply)}};
}
const chunkProfile = {...profile, analysis_prompt: '分析原文', analysis_merge_prompt: '整合条件', max_input_chars: 7000};
const longSource = original + '\n' + '雨声逐渐变小，调查继续。\n'.repeat(1300);
test('长文携带已提取的完整规则及待核对事项，整合遗漏出口或返回true不能擦掉既有条件', async () => {
  let chunks = 0, merge;
  const f = chunkClient(input => {
    if (input.original !== undefined) {
      chunks++; if (chunks === 1) { const data = raw(); data.nodes[0].detail = input.original; return data; }
      assert.deepEqual(input.known_results.find(x => x.id === 'c').requires, gate());
      return {title: '后文', nodes: [{id: 'tail', title: '继续调查', detail: input.original, guidance: '本段调查', routes: []}], analysis: {uncertainties: ['后文尚有未明确连接']}};
    }
    merge = input; return {title: '整合', nodes: input.nodes.map(n => ({id: n.id, entry_condition: true, routes: []})), collections: [{id: 'c', requires: true}], analysis: {uncertainties: []}};
  });
  const draft = await f.api.analyze(chunkProfile, longSource, '', f.options); assert(chunks > 1);
  const p = draft.project; assert.deepEqual(p.nodes[0].routes.at(-1).condition, gate()); assert.deepEqual(p.collections.find(x => x.id === 'c').requires, gate()); assert.deepEqual(p.nodes.find(n => n.title === '取证完成').entry_condition, gate());
  assert(merge.nodes.some(n => n.completion_exclusions?.includes('只有意图或假设'))); assert(merge.parts.some(p => p.uncertainties?.length)); assert(p.analysis.uncertainties.includes('后文尚有未明确连接'));
  assert(f.requests.every(r => r.messages.reduce((n, m) => n + m.content.length, 0) <= chunkProfile.max_input_chars));
});
test('整合可补充有依据的跨段条件，但未知结果定义和无依据条件不能放行', async () => {
  for (const invalid of ['', 'entry', 'result', 'package', 'new']) {
    const f = chunkClient(input => {
      if (input.original !== undefined) return {title: '分块', collections: input.original.includes(lines[1]) ? [{id: 'a', title: '通行证', evidence: lines[1]}] : [], nodes: [{id: 'x', title: '调查', detail: input.original, guidance: '调查', routes: []}], packages: [{id: 'P' + input.part, title: '调查包' + input.part, node_ids: ['x']}]};
      const nodes = input.nodes.map(n => ({id: n.id, routes: []})); nodes.at(-1).entry_condition = {collected: 'a'}; nodes.at(-1).entry_condition_evidence = invalid === 'entry' ? '虚构规则' : lines[7];
      return {nodes, collections: [{id: invalid === 'new' ? 'unknown' : 'a', requires: {not: {collected: 'a'}}, requires_evidence: invalid === 'result' ? '' : lines[5]}], packages: [{id: input.packages.at(-1).id, continue_condition: {collected: 'a'}, continue_condition_evidence: invalid === 'package' ? '' : lines[7]}]};
    });
    if (invalid) await assert.rejects(f.api.analyze(chunkProfile, longSource), /原文依据|未知或重复/);
    else { const p = (await f.api.analyze(chunkProfile, longSource)).project; assert.deepEqual(p.nodes.at(-1).entry_condition, {collected: 'a'}); assert.deepEqual(p.collections[0].requires, {not: {collected: 'a'}}); assert.deepEqual(p.packages.at(-1).continue_condition, {collected: 'a'}); }
  }
});
test('整合补充已有无条件出口的规则，保留条件明确出口及原有结果互斥', async () => {
  const f = chunkClient(input => {
    if (input.original !== undefined) return {title: '分块', collections: input.original.includes(lines[1]) ? [{id: 'a', title: '通行证', evidence: lines[1]}, {id: 'b', title: '密钥', evidence: lines[2]}] : [], nodes: [{id: 'x', title: '入口', detail: input.original, guidance: '调查', routes: [{target: 'x', label: '继续'}]}]};
    return {nodes: input.nodes.map(n => ({id: n.id, routes: n.routes.map(r => ({...r, condition: {any: [{collected: 'a'}, {collected: 'b'}]}, condition_evidence: lines[7]}))})), collections: [{id: 'a', exclusive_with: ['b'], exclusive_with_evidence: lines[10]}]};
  });
  const p = (await f.api.analyze(chunkProfile, longSource)).project; assert(p.nodes.every(n => n.routes[0].condition.any.length === 2)); assert.deepEqual(p.collections[0].exclusive_with, ['b']);
});
test('跨块completed/visited前提按实际节点重映射，分块恢复与全文恢复均保留关系', async () => {
  let count = 0; const text = lines[1] + '\n' + '沿走廊观察。\n'.repeat(1200);
  const f = chunkClient(input => {
    if (input.original !== undefined) {
      count++; if (count === 1) return {title: '第一段', collections: [{id: 'a', title: '通行证', evidence: lines[1], requires: {visited: 'x'}, requires_evidence: lines[1]}], nodes: [{id: 'x', title: '取证', detail: input.original, guidance: '调查', routes: []}]};
      const id = Object.keys(input.known_nodes)[0]; return {title: '后文', nodes: [{id: 'x', title: '后续', detail: input.original, guidance: '后续行动', entry_condition: {visited: id}, entry_condition_evidence: lines[1], routes: []}]};
    }
    return {nodes: input.nodes.map(n => ({id: n.id, routes: []}))};
  });
  const draft = await f.api.analyze({...chunkProfile, max_input_chars: 3000}, text, '', f.options); assert(count > 1);
  assert.deepEqual(draft.project.collections[0].requires, {visited: 'N1'}); assert(draft.project.nodes.slice(1).every(n => n.entry_condition.visited === 'N1'));
  const chunk = f.replies.find(x => x.part === 2), recovered = f.api.restoreAnalysis(chunk.original, chunk.text, 'faithful', chunk);
  assert.deepEqual(recovered.project.nodes[0].entry_condition, {visited: 'b1n1'});
  const merge = f.replies.at(-1); const full = f.api.restoreAnalysis(text, merge.text, 'faithful', merge); assert.deepEqual(full.project.collections[0].requires, {visited: 'N1'});
});
test('跨块重定义变量边界或事件包持续条件产生冲突时拒绝，不悄悄覆盖', async () => {
  for (const field of ['variable', 'package']) {
    let count = 0; const f = chunkClient(input => {
      count++; return {title: '分块', variables: field === 'variable' ? [{id: 'trust', title: '信任', type: 'number', default: 20, evidence: lines[0], min: 0, max: count === 1 ? 100 : 90, bounds_evidence: lines[0]}] : [],
        nodes: [{id: 'x', title: '调查', detail: input.original, guidance: '调查', routes: []}], packages: field === 'package' ? [{id: 'P1', title: '调查包', node_ids: ['x'], continue_condition: count === 1 ? true : {collected: 'a'}, continue_condition_evidence: lines[7]}] : [],
        collections: field === 'package' && count === 1 ? [{id: 'a', title: '通行证', evidence: lines[1]}] : []};
    }); await assert.rejects(f.api.analyze(chunkProfile, longSource), /定义冲突/);
  }
});
