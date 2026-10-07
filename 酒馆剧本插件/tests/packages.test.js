'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core'), F = require('../src/flow'), G = require('../src/graph'), {Engine} = require('../src/engine');
const {fixture, mockClient, deferred, tick} = require('./helpers');
function setup(p = F.demoProject()) { const s = C.createProgress(p); F.initialize(p, s); F.sync(p, s); return {p, s}; }
function finish(p, s, id) { C.completeNode(s, p, null, id); F.sync(p, s); }
function chain(p, s) { finish(p, s, 'B_1'); C.enterNode(s, p, 'B_2'); finish(p, s, 'B_2'); finish(p, s, 'C_1'); finish(p, s, 'A_1'); finish(p, s, 'D_1'); }
test('数值触发与 b2+c1 → a4 → d1：解锁不授予结果，结算一次，包内阶段不可跳过', () => {
  const {p, s} = setup(); assert.equal(s.focus_package_id, 'B'); assert.equal(s.package_progress.A.status, 'locked'); assert.deepEqual(s.collected_ids, []);
  assert.throws(() => C.completeNode(s, p, null, 'B_2'), /不能完成/); assert.throws(() => C.completeNode(s, p, null, 'A_1'), /前置/);
  finish(p, s, 'B_1'); C.enterNode(s, p, 'B_2'); finish(p, s, 'B_2'); assert.equal(s.focus_package_id, 'C'); assert.deepEqual(s.collected_ids, ['b2']);
  finish(p, s, 'C_1'); assert.equal(s.focus_package_id, 'A'); assert(!s.collected_ids.includes('a4'));
  finish(p, s, 'A_1'); assert.equal(s.focus_package_id, 'D'); assert(!s.collected_ids.includes('d1')); finish(p, s, 'D_1');
  assert.equal(C.completeNode(s, p, null, 'D_1'), false); assert.deepEqual(s.collected_ids, ['b2', 'c1', 'a4', 'd1']); assert.equal(F.diagnose(p).filter(x => x.severity === 'error').length, 0);
});
test('启动阈值只控制首次解锁，持续条件可暂停；手动返回主线后不立即被抢回', () => {
  const p = F.demoProject(); p.variables[0].default = 0; const {s} = setup(p); assert.equal(s.current_node_id, 'C_1'); assert.equal(s.package_progress.B.status, 'locked');
  s.variables.trust = 30; F.sync(p, s); assert.equal(s.package_progress.B.status, 'ready'); F.focusPackage(p, s, 'B'); F.sync(p, s); s.variables.trust = 0; F.sync(p, s); assert.equal(s.package_progress.B.status, 'running');
  p.packages[0].continue_condition = {variable: {id: 'trust', op: 'gte', value: 10}}; F.sync(p, s); assert.equal(s.package_progress.B.status, 'waiting');
  F.focusPackage(p, s, ''); F.sync(p, s); assert.equal(s.current_node_id, 'hub'); assert.equal(s.focus_package_id, '');
});
test('切换事件包独立恢复游标和摘要；主模型只注入主包与最多一条支线', () => {
  const {p, s} = setup(); s.stage_progress = {node_id: 'B_1', summary: '走廊灯已熄灭', facts: [], missing: []}; F.focusPackage(p, s, 'C'); s.stage_progress = {node_id: 'C_1', summary: '登记簿已打开', facts: [], missing: []}; F.focusPackage(p, s, 'B'); assert.equal(s.stage_progress.summary, '走廊灯已熄灭'); assert.equal(s.package_progress.C.stage_progress.summary, '登记簿已打开');
  for (const id of ['S', 'T']) { p.nodes.push({id, title: id, guidance: id + '支线内容', context_variables: [], routes: [], effects: [], completion_exclusions: []}); p.packages.push({id, title: id, node_ids: [id], start_node_id: id, completion_node_ids: [id], role: 'side', priority: id === 'S' ? 2 : 1, condition: true, continue_condition: true, enabled: true, auto_start: true}); }
  F.sync(p, s); const active = F.activeNodes(p, s); assert.equal(active.length, 2); assert.equal(active[1].node_id, 'S'); const prompt = F.prompt(p, s); assert(prompt.includes('S支线内容')); assert(!prompt.includes('T支线内容')); assert(!prompt.includes('核验档案')); assert(!prompt.includes('登记簿已打开'));
});
test('依赖诊断拒绝未定义结果、缺少来源、闭合循环、AND互斥；存在OR入口的循环可用', () => {
  const base = F.demoProject(); const failures = [p => { p.packages[2].condition = {collected: 'missing'}; }, p => { p.nodes[2].effects = []; }, p => { p.packages[0].condition = {all: [{variable: {id: 'trust', op: 'eq', value: 30}}, {variable: {id: 'trust', op: 'ne', value: 30}}]}; }, p => { p.packages[0].condition = {variable: {id: 'trust', op: 'gt', value: 100}}; }, p => { p.packages[0].condition = {collected: 'd1'}; }, p => { p.collections[0].exclusive_with = ['c1']; }, p => { p.packages[0].condition = {all: [{variable: {id: 'trust', op: 'gt', value: 40}}, {variable: {id: 'trust', op: 'lte', value: 40}}]}; }];
  for (const mutate of failures) { const p = C.clone(base); mutate(p); assert(F.diagnose(C.normalizeProject(p)).some(x => x.severity === 'error')); }
  const p = C.clone(base); p.packages[0].condition = {any: [{collected: 'd1'}, true]}; assert.doesNotThrow(() => F.assertRunnable(C.normalizeProject(p)));
  const exact = C.createProgress(base); exact.collected_ids = ['a', 'a1', 'ab']; assert.equal(C.condition({collected: 'a4'}, exact), false);
});
test('连带回退撤销实际依赖链，保留独立结果与数值结算；备份保留来源', () => {
  const {p, s} = setup(); p.nodes.find(n => n.id === 'C_1').effects.push({add: {variable: 'trust', value: 4}}); chain(p, s);
  const restored = C.migrateProgress(C.clone(s), p); const plan = F.rollbackPlan(p, restored, 'b2'); assert.deepEqual(plan.removed_results, ['b2', 'a4', 'd1']); F.rollback(p, restored, 'b2'); assert.deepEqual(restored.collected_ids, ['c1']); assert.equal(restored.variables.trust, 34); assert(restored.completed_node_ids.includes('C_1')); assert.equal(restored.paused, true); assert.equal(restored.package_progress.A.status, 'locked'); assert.equal(restored.history.length, 0);
  const old = C.createProgress(p); old.collected_ids = ['b2']; assert.throws(() => F.rollbackPlan(p, old, 'b2'), /旧进度或备份/);
});
test('OR回退记录本次实际使用的前提，不因事后有另一前提而保留旧后续', () => {
  const p = F.demoProject(); p.collections[2].requires = {any: [{collected: 'b2'}, {collected: 'c1'}]}; p.packages[2].condition = p.collections[2].requires; const {s} = setup(p);
  finish(p, s, 'B_1'); C.enterNode(s, p, 'B_2'); finish(p, s, 'B_2'); assert.equal(s.focus_package_id, 'A'); finish(p, s, 'A_1'); finish(p, s, 'D_1'); finish(p, s, 'C_1');
  assert(s.settlements.entries['node:A_1'].dependencies.includes('result:b2')); assert(!s.settlements.entries['node:A_1'].dependencies.includes('result:c1')); F.rollback(p, s, 'b2'); assert.deepEqual(s.collected_ids, ['c1']);
});
test('关系图显示条件门、箭头、解锁与完成状态；包筛选保留跨包前提，文本转义', () => {
  const {p, s} = setup(); let g = G.build(p, s); assert(g.edges.some(x => x.from === 'result:b2')); assert(g.nodes.some(x => x.name.includes('且'))); assert.equal(g.nodes.find(x => x.id === 'result:a4').status, 'locked');
  finish(p, s, 'B_1'); C.enterNode(s, p, 'B_2'); finish(p, s, 'B_2'); finish(p, s, 'C_1'); g = G.build(p, s, 'D'); assert(g.nodes.some(x => x.id === 'result:b2')); assert(g.nodes.some(x => x.id === 'result:c1')); assert.equal(g.nodes.find(x => x.id === 'result:a4').status, 'available');
  p.collections[0].title = '<script>x</script>'; const svg = G.svg(G.build(p, s)); assert(svg.includes('marker-end')); assert(svg.includes('&lt;script&gt;')); assert(!svg.includes('<script>')); assert(!svg.includes('https://'));
});
test('真实发送流程跨包快捷选择与自由输入：只填草稿，发出后记录和切换', async () => {
  const f = fixture(), client = mockClient(); client.choose = async () => ({status: 'selected', target: 'package:C'}); const e = new Engine(f.host, client); await e.init(); await e.setProject(F.demoProject()); await e.updateSettings({enabled: true, profile: {base_url: 'https://mock.test/v1', model: 'mock'}});
  const draft = e.stageChoice('package:C'); assert.equal(e.state.focus_package_id, 'B'); f.root.messages.push({message_id: 2, role: 'user', message: draft}); await e.prepareTurn(2); assert.equal(e.state.focus_package_id, 'C'); assert.equal(e.state.turn_context.target, undefined); assert.equal(e.state.turn_context.package_id, 'C'); assert.deepEqual(e.state.collected_ids, []);
  e.switchPackage('B'); f.root.messages.push({message_id: 3, role: 'user', message: '我想去前台翻一翻登记簿'}); await e.prepareTurn(3); assert.equal(e.state.focus_package_id, 'C'); assert(e.state.history.some(x => x.label.includes('前台调查')));
});
test('跨包核验仍绑定本轮注入游标，不用旧回复结算刚解锁的新包，来源编辑清空全部摘要', async () => {
  const f = fixture(), client = mockClient(); const seen = []; client.evaluateStage = async (profile, dialogue, node) => { seen.push(node.id); return {status: 'completed', summary: '', facts: [], missing: [], evidence: [{message_id: '1', quote: '走廊'}]}; };
  const e = new Engine(f.host, client); await e.init(); await e.setProject(F.demoProject()); await e.updateSettings({enabled: true, profile: {base_url: 'https://mock.test/v1', model: 'mock'}}); e.enter('B_2'); e.state.turn_context = {user_id: 0, node_id: 'B_2', injection_nodes: [{node_id: 'B_2', package_id: 'B'}]}; await e.checkStage(); assert.deepEqual(seen, ['B_2']); assert.deepEqual(e.state.collected_ids, ['b2']); assert.equal(e.state.focus_package_id, 'C'); await e.checkStage(); assert.deepEqual(seen, ['B_2']);
  e.state.package_progress.B.stage_progress = {summary: '旧摘要'}; e.state.package_progress.C.stage_progress = {summary: '另一个摘要'}; await f.root.eventEmit('message_edited', 1); await tick(); assert.equal(e.state.paused, true); assert(Object.values(e.state.package_progress).every(x => x.stage_progress === null));
});
test('外部聊天数值触发、类型校验、持久化包进度和世界书定义', async () => {
  const f = fixture(), e = new Engine(f.host, mockClient()), p = F.demoProject(); p.variables[0].binding = {type: 'chat', path: ['hud', 'trust']}; p.variables[0].default = 0; f.storage.chats.chat1.hud = {trust: 12}; await e.init(); await e.setProject(p); await e.updateSettings({enabled: true});
  f.root.messages.push({message_id: 2, role: 'user', message: '继续'}); await e.prepareTurn(2); assert.equal(e.state.variables.trust, 12); assert.equal(e.state.package_progress.B.status, 'locked'); f.storage.chats.chat1.hud.trust = 40; f.root.messages.push({message_id: 3, role: 'user', message: '继续'}); await e.prepareTurn(3); assert.equal(e.state.package_progress.B.status, 'ready');
  e.switchPackage('B'); await e.saveBook('交叉剧本'); const loaded = await f.host.loadBook('交叉剧本', p.id); assert.deepEqual(loaded.project.packages, e.project.packages); const fresh = new Engine(f.host, mockClient()); await fresh.init(); assert.equal(fresh.state.focus_package_id, 'B'); assert.equal(fresh.state.variables.trust, 40);
  f.storage.chats.chat1.hud.trust = 'wrong'; f.root.messages.push({message_id: 4, role: 'user', message: '继续'}); await assert.rejects(e.prepareTurn(4), /类型/); assert.equal(f.storage.chats.chat1.hud.trust, 'wrong');
});
test('优先级不打断当前包，显式高优先级打断后能恢复原阶段；撤销返回主线恢复选择策略', () => {
  const {p, s} = setup(); s.collected_ids = ['b2', 'c1']; F.sync(p, s); assert.equal(s.focus_package_id, 'B'); assert.equal(s.package_progress.A.status, 'ready'); s.stage_progress = {node_id: 'B_1', summary: '待继续', facts: [], missing: []}; p.packages[2].interrupt = true; F.sync(p, s); assert.equal(s.focus_package_id, 'A'); assert.equal(s.package_progress.B.stage_progress.summary, '待继续');
  p.packages[2].interrupt = false; F.focusPackage(p, s, 'B'); F.focusPackage(p, s, ''); assert.equal(s.manual_base_focus, true); C.undo(s); F.sync(p, s); assert.equal(s.focus_package_id, 'B'); assert.equal(s.manual_base_focus, false);
});
test('同次奖励的互斥结果也被拒绝，操作保持原子性；事件包备份类型错误拒绝载入', () => {
  const {p, s} = setup(); p.collections[0].exclusive_with = ['c1']; p.nodes[0].effects = [{collect: 'b2'}, {collect: 'c1'}]; assert(F.diagnose(p).some(x => x.message.includes('同时产生互斥'))); assert.throws(() => C.completeNode(s, p, null, 'hub'), /互斥/); assert.deepEqual(s.collected_ids, []); assert(!s.completed_node_ids.includes('hub'));
  const bad = C.clone(s); bad.package_progress.B.activation_dependencies = 'wrong'; assert.throws(() => F.initialize(p, bad), /格式无效/);
});
test('损坏事件包备份被拒绝时保持现有项目、状态和注入，聊天切换载入失败会清掉旧注入', async () => {
  const f = fixture(), e = new Engine(f.host, mockClient()); await e.init(); await e.setProject(F.demoProject()); await e.updateSettings({enabled: true}); const before = C.clone(e.state), injection = C.clone(f.root.injection), data = e.exportProgress(); data.progress.package_progress.B.activation_dependencies = 'bad'; assert.throws(() => e.importProgress(data), /格式无效/); assert.deepEqual(e.state, before); assert.deepEqual(f.root.injection, injection);
  f.storage.chats.chat2 = {branch_story_engine: {projects: {[e.project.id]: data.progress}}}; f.root.chat = 'chat2'; assert.throws(() => e.bindChat(), /格式无效/); assert.equal(e.settings.enabled, false); assert.deepEqual(f.root.injection, []);
});
