'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core'), F = require('../src/flow'), G = require('../src/graph');
const {Engine} = require('../src/engine'), {Client, PROMPTS, LAST_PROMPTS} = require('../src/api');
const {fixture, mockClient, tick} = require('./helpers');
const project = () => C.normalizeProject({id: 'player_test', title: '阶段与行为', variables: [{id: 'rapport', title: '关系', owner: '同行者', type: 'number', default: 69, min: 0, max: 100}], collections: [{id: 'b1', title: '房卡', description: '在储物间找到的房卡，上面写着301。'}], nodes: [{id: 'N1', title: '调查储物间', effects: [{collect: 'b1'}], routes: []}], events: [{id: 'E1', title: '赠礼被接受', description: '实际赠礼且对方接受', completion_criteria: '实际交付并接受', effects: [{add: {variable: 'rapport', value: 4, max: 70}}], repeat_policy: 'once_per_accepted_turn', auto_settle: true}]});
async function engine(p = project(), client = mockClient()) { const f = fixture(), e = new Engine(f.host, client); await e.init(); await e.setProject(p); await e.updateSettings({enabled: true, profile: {base_url: 'https://mock.example', model: 'mock'}}); return {...f, e}; }

test('行为上限与载体总上限独立：69加4只到70，其他行为仍可到100；减少可设独立下限', () => {
  const p = project(), s = C.createProgress(p); assert.equal(C.eligibleEvents(p, s).length, 1);
  C.settleEvent(s, p, 'E1', 'first', {assistant_id: 1}); assert.equal(s.variables.rapport, 70); assert.equal(C.eligibleEvents(p, s).length, 0);
  assert.deepEqual(s.settlements.entries['event:E1:turn_1'].changes, [{variable: 'rapport', before: 69, after: 70}]);
  s.variables.rapport = 80; C.settleEvent(s, p, 'E1', 'second', {assistant_id: 2}); assert.equal(s.variables.rapport, 80);
  C.applyEffects(s, p, [{add: {variable: 'rapport', value: 8}}]); assert.equal(s.variables.rapport, 88);
  C.applyEffects(s, p, [{add: {variable: 'rapport', value: -20, min: 75}}]); assert.equal(s.variables.rapport, 75);
  C.applyEffects(s, p, [{add: {variable: 'rapport', value: 40}}]); assert.equal(s.variables.rapport, 100);
  assert.throws(() => C.normalizeProject({...p, events: [{...p.events[0], effects: [{add: {variable: 'rapport', value: 1, min: 80, max: 70}}]}]}), /下限大于上限/);
});
test('重复行为按回复编号去重：重试、改写指纹、手动和自动共用回执；新回复可再结算，撤销可重做', () => {
  const p = project(), s = C.createProgress(p); s.variables.rapport = 0;
  assert(C.settleEvent(s, p, 'E1', 'fingerprint-A', {assistant_id: 1}));
  assert.equal(C.settleEvent(s, p, 'E1', 'fingerprint-B', {assistant_id: 1}), false);
  assert.equal(C.settleEvent(s, p, 'E1', 'fingerprint-A'), false);
  assert(C.settleEvent(s, p, 'E1', 'fingerprint-C', {assistant_id: 3})); assert.equal(s.variables.rapport, 8); assert.equal(s.event_counts.E1, 2);
  C.undo(s); assert.equal(s.variables.rapport, 4); assert(C.settleEvent(s, p, 'E1', 'fingerprint-C', {assistant_id: 3})); assert.equal(s.variables.rapport, 8);
});
test('多事件同批结算重新核对数值条件，不越过行为上限，也不重复奖励', async () => {
  const p = project(); p.events[0].condition = {variable: {id: 'rapport', op: 'lt', value: 70}};
  p.events.push({...C.clone(p.events[0]), id: 'E2', title: '另一种普通行为'});
  const {e} = await engine(p); await e.checkLatest(); assert.equal(e.state.variables.rapport, 70); assert.equal(e.state.event_counts.E1, 1); assert.equal(e.state.event_counts.E2 || 0, 0);
  await e.checkLatest(); assert.equal(e.state.variables.rapport, 70);
});
test('生成结束后即核验独立行为，流式接收不奖励；关闭自动核验后不调用', async () => {
  let calls = 0; const client = mockClient(async (p, messages, events) => { calls++; return events.map(e => ({event_id: e.id, status: 'completed', evidence: [{message_id: '1', quote: '一起走入黑暗的走廊'}]})); });
  const {e, root} = await engine(project(), client);
  await root.eventEmit('message_received', 1); await tick(); assert.equal(calls, 0);
  await root.eventEmit('generation_ended'); await tick(); await e.jobs; assert.equal(calls, 1); assert.equal(e.state.variables.rapport, 70);
  await root.eventEmit('generation_ended'); await tick(); await e.jobs; assert.equal(calls, 1);
  await e.updateSettings({auto_events: false}); e.state.variables.rapport = 0;
  root.messages.push({message_id: 2, role: 'user', message: '再次赠礼'}, {message_id: 3, role: 'assistant', message: '对方接受了礼物。'});
  await root.eventEmit('generation_ended'); await tick(); assert.equal(calls, 1);
});
test('同轮阶段完成不会让新解锁的事件读取旧正文，原阶段行为仍按原范围结算', async () => {
  const p = F.demoProject(), client = mockClient(); const seen = [];
  p.events = [{id: 'old', title: '原阶段行为', description: '原阶段行为', effects: [], repeat_policy: 'once', scope: {kind: 'nodes', node_ids: ['B_2']}, auto_settle: true}, {id: 'new', title: '后续行为', description: '后续行为', condition: {collected: 'b2'}, effects: [], repeat_policy: 'once', auto_settle: true}];
  client.evaluateStage = async () => ({status: 'completed', summary: '', facts: [], missing: [], evidence: [{message_id: '1', quote: '一起走入黑暗的走廊'}]});
  client.detect = async (profile, messages, events) => { seen.push(...events.map(e => e.id)); return events.map(e => ({event_id: e.id, status: 'completed', evidence: []})); };
  const {e, root} = await engine(p, client); e.enter('B_2'); e.state.turn_context = {user_id: 0, node_id: 'B_2', injection_nodes: F.activeNodes(e.project, e.state)};
  await root.eventEmit('generation_ended'); await tick(); await e.stageJobs; await e.jobs;
  assert.deepEqual(seen, ['old']); assert.equal(e.state.event_counts.old, 1); assert.equal(e.state.event_counts.new || 0, 0);
});
test('已获得视图读取正式记录，只列实际结果、公开说明、取得来源；回退同步撤下', () => {
  const p = project(), s = C.createProgress(p); assert.deepEqual(C.obtainedResults(p, s), []);
  C.completeNode(s, p); const item = C.obtainedResults(p, s)[0]; assert.equal(item.id, 'b1'); assert.equal(item.description, '在储物间找到的房卡，上面写着301。'); assert.equal(item.source, '调查储物间');
  assert.deepEqual(C.obtainedResults(p, C.migrateProgress(C.clone(s), p)), [item]); C.undo(s); assert.deepEqual(C.obtainedResults(p, s), []);
});
test('新短编号不与已有ID碰撞、不复用已预留ID；旧ID不变，图只使用展示别名', () => {
  const p = project(); p.nodes.push({id: 'N2', title: '已有短号', routes: [], effects: []}, {id: 'N_aaaaaaaa-bbbb-cccc-dddd', title: '旧节点', routes: [], effects: []});
  const fresh = C.shortId(p, 'N'); assert.equal(fresh, 'N3'); assert.equal(C.shortId(C.normalizeProject(p), 'N'), 'N4');
  const s = C.createProgress(C.normalizeProject(p)), graph = G.build(C.normalizeProject(p), s), old = graph.nodes.find(x => x.name === '旧节点');
  assert.equal(old.id, 'node:N_aaaaaaaa-bbbb-cccc-dddd'); assert.equal(old.label, 'N3'); assert(p.nodes.some(n => n.id === 'N_aaaaaaaa-bbbb-cccc-dddd'));
});
test('结果删除预览覆盖节点、出口、行为、事件包和结果前提；禁止或明确移除不会留下悬空引用', () => {
  const p = project(); p.nodes.push({id: 'N2', title: '后续', entry_condition: {all: [{collected: 'b1'}, {not: {collected: 'b1'}}]}, effects: [], routes: []}); p.nodes[0].routes.push({target: 'N2', condition: {collected: 'b1'}});
  p.events[0].condition = {collected: 'b1'}; p.packages.push({id: 'P1', title: '后续包', node_ids: ['N2'], condition: {collected: 'b1'}}); p.collections.push({id: 'b2', title: '后续结果', requires: {collected: 'b1'}, exclusive_with: ['b1'], external: true});
  const normalized = C.normalizeProject(p); assert.equal(C.resultReferences(normalized, 'b1').length, 7);
  const blocked = C.removeResultDefinition(normalized, 'b1', 'block'); assert.equal(blocked.nodes[1].entry_condition, false); assert.equal(blocked.packages[0].condition, false); assert.equal(C.resultReferences(blocked, 'b1').length, 0);
  const removed = C.removeResultDefinition(normalized, 'b1', 'remove'); assert.equal(removed.nodes[0].routes[0].condition, true); assert.equal(removed.events[0].condition, true); assert.equal(removed.collections[0].requires, true);
  const replaced = C.removeResultDefinition(normalized, 'b1', 'replace', 'b2'); assert.deepEqual(replaced.nodes[0].routes[0].condition, {collected: 'b2'}); assert(!normalized.collections.find(c => c.id === 'b1').external);
});
test('删除事件清理无引用且未取得的输出结果，保留数值；已有来源或被引用的结果保留', async () => {
  const p = project(); p.nodes[0].effects = []; p.events[0].effects.push({collect: 'b1'});
  const {e} = await engine(p); assert.deepEqual(e.eventDeletionPreview('E1').cleanup, ['b1']); await e.deleteEvent('E1'); assert.equal(e.project.collections.length, 0); assert.equal(e.project.variables[0].id, 'rapport'); assert(!e.diagnostics().some(x => x.severity === 'error'));
  const next = project(); next.nodes[0].entry_condition = {collected: 'b1'}; next.nodes[0].effects = []; next.events[0].effects.push({collect: 'b1'}); await e.setProject(next); assert.deepEqual(e.eventDeletionPreview('E1').cleanup, []); await e.deleteEvent('E1'); assert(e.project.collections.some(x => x.id === 'b1')); assert(e.diagnostics().some(x => x.message.includes('缺少获取来源')));
});
test('已有结算的结果和事件不能直接删；先回退后可删，解除旧依赖错误后提示同步清除', async () => {
  const {e} = await engine(); e.complete(); await assert.rejects(e.deleteResult('b1', 'remove'), /回退/); assert.equal(e.project.collections.length, 1);
  e.undo(); await e.deleteResult('b1', 'remove'); assert.equal(e.project.collections.length, 0);
  await e.manualEvent('E1'); await assert.rejects(e.deleteEvent('E1'), /结算记录/);
  const p = project(); p.collections.push({id: 'orphan', title: '遗留无来源结果'}); await e.setProject(p); e.report(Error('旧依赖错误'));
  await e.deleteResult('orphan', 'block'); assert.equal(e.error, ''); await e.updateSettings({enabled: true}); assert.equal(e.settings.enabled, true);
});
test('分析已发请求与模型实际收到的messages一致，失败前也保留，不含鉴权密钥；自定义提示词持久化', async () => {
  const seen = [], api = new Client(async (url, init) => { seen.push(JSON.parse(init.body)); return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify({title: '房卡阶段', nodes: [{id: 'long_original_node', title: '找到房卡', detail: '找到301房卡。', guidance: '调查房卡', routes: []}], collections: [{id: 'b1', title: '房卡', evidence: '找到301房卡。', description: '301房卡'}]})}}]})}; });
  const {e, storage, host} = await engine(project(), api); await e.updateSettings({profile: {key: 'REQUEST_TEST_SECRET', analysis_prompt: '自定义分析system', analysis_merge_prompt: '自定义合并system'}});
  await e.analyze('找到301房卡。', '只整理原文', 'faithful'); assert.equal(seen.length, 1); assert.deepEqual(JSON.parse(e.rawAnalysis.requests[0].text), seen[0].messages); assert.equal(seen[0].messages[0].content, '自定义分析system'); assert.equal(e.analysisDraft.project.nodes[0].id, 'N1'); assert.equal(e.analysisDraft.project.collections[0].description, '301房卡'); assert(!JSON.stringify(e.rawAnalysis).includes('REQUEST_TEST_SECRET'));
  const fresh = new Engine(host, api); await fresh.init(); assert.equal(fresh.settings.profile.analysis_prompt, '自定义分析system'); assert.equal(fresh.rawAnalysis.requests.length, 1); assert.equal(storage.script.branch_story_settings.profile.key, '');
});
test('仅玩家意图证据不能自动领取行为奖励；原文之外的结果说明拒绝', async () => {
  const api = new Client(async () => ({ok: true, json: async () => ({choices: [{message: {content: JSON.stringify({results: [{event_id: 'E1', status: 'completed', evidence: [{message_id: '0', quote: '送礼'}]}]})}}]})}));
  const result = await api.detect({base_url: 'https://mock.example', model: 'mock'}, [{message_id: 0, role: 'user', text: '送礼'}, {message_id: 1, role: 'assistant', text: '对方尚未回应'}], project().events, {}); assert.equal(result[0].status, 'uncertain');
  const failing = new Client(async () => ({ok: true, json: async () => ({choices: [{message: {content: JSON.stringify({nodes: [{id: 'N', title: '阶段', detail: '找到房卡。', guidance: '调查', routes: []}], collections: [{id: 'b1', title: '房卡', evidence: '找到房卡。', description: '通往隐藏结局'}]})}}]})}));
  await assert.rejects(failing.analyze({base_url: 'https://mock.example', model: 'mock'}, '找到房卡。'), /结果说明/);
  assert.notEqual(PROMPTS.analysis, LAST_PROMPTS.analysis);
});
test('请求失败也保留实际发送提示词；配置无效而未发送时不伪造已发记录', async () => {
  let sent = 0; const api = new Client(async () => { sent++; return {ok: true, json: async () => ({choices: [{message: {content: 'The service rejected this request.'}}]})}; });
  const {e} = await engine(project(), api); await assert.rejects(e.analyze('找到房卡。'), /JSON/); assert.equal(sent, 1); assert.equal(e.rawAnalysis.requests.length, 1); assert.equal(e.rawAnalysis.replies[0].text, 'The service rejected this request.');
  await e.updateSettings({profile: {base_url: '', model: ''}}); await assert.rejects(e.analyze('找到房卡。'), /模型名称/); assert.equal(sent, 1); assert.equal(e.rawAnalysis.requests.length, 0);
});
test('有限奖励记录实际数值来源，选择性回退其来源时也撤销受该限值影响的奖励', () => {
  const p = project(); p.variables[0].default = 60; p.nodes[0].effects.push({add: {variable: 'rapport', value: 9}}); const s = C.createProgress(p);
  C.completeNode(s, p); C.settleEvent(s, p, 'E1', 'reply', {assistant_id: 1}); assert.equal(s.variables.rapport, 70);
  assert(s.settlements.entries['event:E1:turn_1'].dependencies.includes('receipt:node:N1'));
  F.rollback(p, s, 'b1'); assert.equal(s.variables.rapport, 60); assert.equal(s.event_counts.E1 || 0, 0); assert.deepEqual(C.obtainedResults(p, s), []);
});
