'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core'), F = require('../src/flow'), G = require('../src/graph'), API = require('../src/api'), {Engine} = require('../src/engine');
const {fixture, mockClient} = require('./helpers');
function project() {
  return C.normalizeProject({id: 'conversion', title: '转化测试', original_text: '到前厅后可以拿房卡，实际收好才取得a。', start_node_id: 'hall',
    variables: [{id: 'trust', title: '信任', type: 'number', default: 0}], collections: [{id: 'a', title: '房卡'}],
    nodes: [{id: 'hall', title: '前厅', routes: [{target: 'card', label: '拿房卡', action_text: '我去拿房卡', condition: true}]},
      {id: 'card', title: '房卡', completion_criteria: '实际收好房卡', completion_exclusions: ['只是看见'], completion_evidence: '实际收好才取得a', effects: [{collect: 'a'}, {add: {variable: 'trust', value: 3}}], routes: [{target: 'hall', label: '返回前厅', condition: {collected: 'a'}}]},
      {id: 'idea', title: '建议结局', suggested: true, completion_criteria: '找到宝藏'}],
    events: [{id: 'manual', title: '手动规则', description: '玩家打招呼', detection: 'manual', effects: []}]});
}
const linked = (p, nodeId) => p.events.find(e => e.completion_node_id === nodeId);
function state(p) { const s = C.createProgress(p); F.initialize(p, s); F.sync(p, s); return s; }
test('转化保留原文、分支、条件、证据及旧事件，仅为明确阶段登记完成事件，可重复转化且不改原草稿', () => {
  const input = project(), before = C.clone(input), p = C.convertAnalysisProject(input);
  for (const field of ['id', 'original_text', 'nodes', 'collections', 'variables', 'packages']) assert.deepEqual(p[field], before[field]);
  assert.deepEqual(input, before); assert.deepEqual(p.events[0], input.events[0]); assert.equal(p.events.length, 2);
  const event = linked(p, 'card'); assert(event); assert.deepEqual(event.scope, {kind: 'nodes', node_ids: ['card']}); assert.deepEqual(event.effects, []);
  assert.equal(event.completion_criteria, '实际收好房卡'); assert.deepEqual(event.exclusions, ['只是看见']); assert(!linked(p, 'hall')); assert(!linked(p, 'idea'));
  assert.deepEqual(C.convertAnalysisProject(p), p);
});
test('阶段事件随节点标准同步；拒绝多次结算、额外奖励、错误引用和重复绑定', () => {
  const p = C.convertAnalysisProject(project()); p.nodes[1].completion_criteria = '已拿到且刷卡成功'; p.nodes[1].completion_exclusions = ['仅拿到'];
  const edited = C.normalizeProject(p); assert.equal(linked(edited, 'card').completion_criteria, '已拿到且刷卡成功'); assert.deepEqual(linked(edited, 'card').exclusions, ['仅拿到']);
  for (const mutate of [e => { e.repeat_policy = 'once_per_accepted_turn'; }, e => { e.effects = [{collect: 'a'}]; }, e => { e.scope = {kind: 'project'}; }, e => { e.completion_node_id = 'missing'; }, e => { e.completion_node_id = 'idea'; }]) {
    const bad = C.clone(edited); mutate(linked(bad, 'card')); assert.throws(() => C.normalizeProject(bad), /阶段事件/);
  }
  const duplicate = C.clone(edited); duplicate.events.push({...linked(duplicate, 'card'), id: 'duplicate'}); assert.throws(() => C.normalizeProject(duplicate), /重复登记/);
  const manual = C.clone(edited); manual.nodes[1].completion_criteria = ''; const onlyManual = C.normalizeProject(manual), progress = state(onlyManual);
  C.enterNode(progress, onlyManual, 'card'); assert.deepEqual(C.eligibleEvents(onlyManual, progress), []); assert.equal(C.settleEvent(progress, onlyManual, linked(onlyManual, 'card').id, 'manual'), true);
});
test('节点与完成事件共用一笔结算，重复确认不加奖励；普通撤销同时恢复两边', () => {
  for (const eventFirst of [false, true]) {
    const p = C.convertAnalysisProject(project()), s = state(p), event = linked(p, 'card'); C.enterNode(s, p, 'card');
    const source = {assistant_id: 3, messages: [2, 3]};
    assert.equal(eventFirst ? C.settleEvent(s, p, event.id, 'turn', source) : C.completeNode(s, p, source), true);
    assert.deepEqual(s.collected_ids, ['a']); assert.equal(s.variables.trust, 3); assert.equal(s.event_counts[event.id], 1); assert(s.completed_node_ids.includes('card'));
    assert.equal(C.completeNode(s, p), false); assert.equal(C.settleEvent(s, p, event.id, 'again'), false); assert.equal(s.settlements.order.length, 1);
    assert.deepEqual(s.settlements.entries['node:card'].source, source); assert.equal(s.settlements.entries['node:card'].event_id, event.id); assert(!s.receipts['event:' + event.id + ':once']);
    C.undo(s); assert.deepEqual(s.collected_ids, []); assert.equal(s.variables.trust, 0); assert.equal(s.event_counts[event.id], 0); assert(!s.completed_node_ids.includes('card')); assert(!s.receipts['node:card']);
  }
});
test('未进入、前提未满足和事件包锁定时不能核验或结算；结果满足后才开放完成规则', () => {
  const p = C.convertAnalysisProject(project()), s = state(p), event = linked(p, 'card');
  assert.deepEqual(C.eligibleEvents(p, s, 'card'), []); assert.throws(() => C.settleEvent(s, p, event.id, 'x', null, 'card'), /请先进入/);
  C.enterNode(s, p, 'card'); event.condition = {variable: {id: 'trust', op: 'gte', value: 2}};
  assert.deepEqual(C.eligibleEvents(p, s), []); assert.throws(() => C.completeNode(s, p), /前置条件/); assert.deepEqual(s.collected_ids, []);
  s.variables.trust = 2; assert.equal(C.eligibleEvents(p, s)[0].id, event.id);
  const packages = C.convertAnalysisProject(F.demoProject()), progress = state(packages), locked = linked(packages, 'A_1');
  assert.deepEqual(C.eligibleEvents(packages, progress, 'A_1'), []); assert.throws(() => C.settleEvent(progress, packages, locked.id, 'x', null, 'A_1'), /不能完成|前置/);
});
test('依赖回退同时撤销节点和完成事件，保留独立包；关系图保留包内阶段完成箭头', () => {
  const p = C.convertAnalysisProject(F.demoProject()), s = state(p);
  for (const id of ['B_1', 'B_2', 'C_1', 'A_1', 'D_1']) { if (id === 'B_2') C.enterNode(s, p, id); C.completeNode(s, p, null, id); F.sync(p, s); }
  const event = linked(p, 'A_1'), graph = G.build(p, s, 'A'); assert(graph.edges.some(e => e.from === 'node:A_1' && e.to === 'event:' + event.id && e.satisfied));
  F.rollback(p, s, 'b2'); assert.deepEqual(s.collected_ids, ['c1']);
  for (const id of ['B_2', 'A_1', 'D_1']) { assert(!s.completed_node_ids.includes(id)); assert.equal(s.event_counts[linked(p, id).id] || 0, 0); }
  assert.equal(s.event_counts[linked(p, 'C_1').id], 1); assert.equal(G.build(p, s).nodes.find(e => e.id === 'event:' + event.id).status, 'locked');
});
const original = '雨夜前厅可以拿房卡。实际收好房卡记为a；只是看见不算。取得a后可以返回前厅。';
const raw = {title: '分析转化测试', collections: [{id: 'a', title: '房卡', evidence: '实际收好房卡记为a'}], nodes: [
  {id: 'hall', title: '前厅', guidance: '可以前往抽屉拿房卡', detail: original, routes: [{target: 'card', label: '拿房卡', action_text: '我去拿房卡'}]},
  {id: 'card', title: '房卡', guidance: '尝试拿起并收好房卡', detail: original, completion_criteria: '实际收好房卡', completion_exclusions: ['只是看见'], completion_evidence: '实际收好房卡记为a；只是看见不算。', result_ids: ['a'], routes: [{target: 'hall', label: '返回前厅', condition: {collected: 'a'}, condition_evidence: '取得a后可以返回前厅。'}]}
]};
test('分析后刷新仍可转化编辑草稿，无额外API；旧进度保留，新剧本关闭注入，完成规则持久化', async () => {
  const f = fixture(); let requests = 0;
  const client = new API.Client(async () => { requests++; return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify(raw)}}]})}; });
  const e = new Engine(f.host, client); await e.init(); await e.updateSettings({enabled: true, profile: {base_url: 'https://mock.test/v1', model: 'mock'}});
  C.completeNode(e.state, e.project); e.save(); const oldProject = C.clone(e.project), oldProgress = C.clone(e.state); await e.analyze(original);
  assert.equal(e.project.id, oldProject.id); assert.equal(e.settings.enabled, true);
  const fresh = new Engine(f.host, client); await fresh.init(); const edited = C.clone(fresh.analysisDraft.project); edited.title = '用户编辑的标题';
  const p = await fresh.applyAnalysis(edited); assert.equal(requests, 1); assert.equal(p.title, edited.title); assert.equal(p.events.length, 1); assert.equal(p.nodes.length, 2);
  assert.equal(fresh.settings.enabled, false); assert.deepEqual(f.root.injection, []); assert.deepEqual(fresh.state.collected_ids, []); assert.deepEqual(f.host.progress(oldProject), oldProgress);
  assert.deepEqual(fresh.settings.drafts[oldProject.id], oldProject); assert.equal(fresh.analysisDraft, null); assert.equal(f.storage.script.branch_story_settings.analysis_draft, undefined);
  const restored = new Engine(f.host, client); await restored.init(); assert.deepEqual(restored.project, p); assert.equal(restored.settings.enabled, false);
});
test('恢复已有分析结果也可本地转化，坏草稿和忙碌状态保持当前剧本、进度与分析草稿', async () => {
  const f = fixture(), client = new API.Client(async () => { throw Error('不应调用API'); }), e = new Engine(f.host, client); await e.init(); await e.updateSettings({enabled: true});
  e.restoreAnalysis(original, JSON.stringify(raw)); const before = {project: C.clone(e.project), state: C.clone(e.state), draft: C.clone(e.analysisDraft)};
  const bad = C.clone(e.analysisDraft.project); bad.nodes[0].routes[0].target = 'missing'; await assert.rejects(e.applyAnalysis(bad), /不存在/);
  assert.deepEqual(e.project, before.project); assert.deepEqual(e.state, before.state); assert.deepEqual(e.analysisDraft, before.draft); assert.equal(e.settings.enabled, true);
  e.busy = 1; await assert.rejects(e.applyAnalysis(), /等待/); e.busy = 0; await e.applyAnalysis(); assert.equal(e.project.events.length, 1); assert.equal(e.settings.enabled, false);
});
test('辅助API阶段完成与事件人工确认使用同一回执，重复核验不会再次结算', async () => {
  const f = fixture(), client = mockClient(); let calls = 0;
  client.evaluateStage = async () => { calls++; return {status: 'completed', summary: '已取得房卡', facts: [], missing: [], evidence: []}; };
  const e = new Engine(f.host, client); await e.init(); e.analysisDraft = {project: project()}; await e.applyAnalysis(); await e.updateSettings({enabled: true, profile: {base_url: 'https://mock.test/v1', model: 'mock'}});
  e.enter('card'); e.state.turn_context = {user_id: 0, node_id: 'card', injection_nodes: [{node_id: 'card', package_id: ''}]};
  const event = linked(e.project, 'card'); await e.checkStage(); await e.checkStage(); await e.manualEvent(event.id);
  assert.equal(calls, 1); assert.equal(e.state.variables.trust, 3); assert.equal(e.state.event_counts[event.id], 1); assert.equal(e.state.settlements.order.length, 1); assert.deepEqual(e.state.collected_ids, ['a']);
});
test('人工确认支线阶段事件按绑定包结算，主包游标和奖励不受影响', async () => {
  const f = fixture(), e = new Engine(f.host, mockClient()), input = F.demoProject();
  input.nodes.push({id: 'S1', title: '记录门牌', completion_criteria: '实际记下门牌', effects: [{collect: 's1'}], routes: []}); input.collections.push({id: 's1', title: '门牌记录'});
  input.packages.push({id: 'S', title: '门牌旁支', node_ids: ['S1'], role: 'side', priority: 1});
  await e.init(); e.analysisDraft = {project: input}; await e.applyAnalysis(); await e.updateSettings({enabled: true}); const main = e.state.current_node_id;
  const event = linked(e.project, 'S1'); await e.manualEvent(event.id); assert.equal(e.state.current_node_id, main); assert.deepEqual(e.state.collected_ids, ['s1']); assert.equal(e.state.event_counts[event.id], 1); assert.equal(e.state.package_progress.S.status, 'done');
});
