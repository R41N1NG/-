const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');

test('A/B 条件覆盖四种组合，未解锁的出口不可直接进入', () => {
  const p = C.demoProject();
  for (const [items, unlocked] of [[[], []], [['A'], ['D']], [['B'], ['E']], [['A', 'B'], ['C']]]) {
    const s = C.createProgress(p); s.collected_ids = items;
    for (const id of ['C', 'D', 'E']) {
      const route = p.nodes[0].routes.find(r => r.target === id);
      assert.equal(C.condition(route.condition, s), unlocked.includes(id));
      if (!unlocked.includes(id)) assert.throws(() => C.enterNode(s, p, id), /未解锁/);
    }
  }
});
test('完成节点只奖励一次，返回继续搜集，两条证据解锁 C', () => {
  const p = C.demoProject(), s = C.createProgress(p);
  C.enterNode(s, p, 'N002'); assert.equal(C.completeNode(s, p), true); assert.equal(C.completeNode(s, p), false);
  C.enterNode(s, p, 'N001'); C.enterNode(s, p, 'N003'); C.completeNode(s, p); C.enterNode(s, p, 'N001'); C.enterNode(s, p, 'C');
  assert.deepEqual(s.collected_ids, ['A', 'B']); assert.equal(s.current_node_id, 'C');
  C.undo(s); assert.equal(s.current_node_id, 'N001'); assert(!s.visited_node_ids.includes('C'));
});
test('事件按来源去重、边界钳制、回退恢复收集变量及结算来源', () => {
  const p = C.demoProject(), s = C.createProgress(p); p.events[0].effects.push({collect: 'gift'}); s.variables.trust = 98;
  assert(C.settleEvent(s, p, 'E_TRUST', 'reply1', {assistant_id: 1, messages: ['0', '1']}));
  assert.equal(s.variables.trust, 100); assert.equal(s.last_settled_message_id, 1);
  assert.equal(C.settleEvent(s, p, 'E_TRUST', 'reply1'), false);
  C.undo(s); assert.equal(s.variables.trust, 98); assert.equal(s.last_settled_message_id, -1); assert.deepEqual(s.collected_ids, []);
  assert(C.settleEvent(s, p, 'E_TRUST', 'reply1'));
});
test('一次性事件、节点范围和前置条件筛选', () => {
  const p = C.demoProject(), s = C.createProgress(p), e = p.events[0]; e.repeat_policy = 'once'; e.scope = {kind: 'nodes', node_ids: ['N002']}; e.condition = {collected: 'A'};
  assert.equal(C.eligibleEvents(p, s).length, 0); C.enterNode(s, p, 'N002'); C.completeNode(s, p);
  assert.equal(C.eligibleEvents(p, s).length, 1); C.settleEvent(s, p, e.id, 'm'); assert.equal(C.eligibleEvents(p, s).length, 0);
});
test('注入仅含当前指引及选择的变量，与素材库大小无关', () => {
  const p = C.demoProject(), s = C.createProgress(p); const baseline = C.prompt(p, s);
  p.nodes[1].detail = '秘密全文'.repeat(20000); p.original_text = '全书'.repeat(50000);
  p.variables.push({id: 'secret', title: '秘密状态', type: 'string', default: '机密'}); s.variables.secret = '机密';
  for (let i = 0; i < 2000; i++) p.nodes.push({id: 'X' + i, title: '额外节点', guidance: '未展开', context_variables: [], effects: [], routes: []});
  assert.equal(C.prompt(p, s), baseline); assert(!baseline.includes('机密')); assert(baseline.length < 500);
});
test('拒绝危险 JSON、失效引用、重复 ID 和变量类型冲突', () => {
  assert.throws(() => C.parseJSON('{"__proto__":{"polluted":true}}'), /保留字段/);
  const p = C.demoProject(); p.nodes.push(C.clone(p.nodes[0])); assert.throws(() => C.normalizeProject(p), /重复/);
  const q = C.demoProject(); q.nodes[0].routes[0].target = 'missing'; assert.throws(() => C.normalizeProject(q), /不存在/);
  const r = C.demoProject(), s = C.createProgress(r); s.variables.trust = '0'; assert.throws(() => C.migrateProgress(s, r), /类型冲突/);
});
test('修改剧本保留 ID 进度，清除旧判断；删除已访问节点被拒绝', () => {
  const p = C.demoProject(), s = C.createProgress(p); C.enterNode(s, p, 'N002'); C.completeNode(s, p); s.pending_checks.push({key: 'old'});
  const q = C.clone(p); q.revision = 'edited'; q.nodes[1].title = '改名'; C.migrateProgress(s, q);
  assert.deepEqual(s.collected_ids, ['A']); assert.deepEqual(s.pending_checks, []); assert.deepEqual(s.history, []);
  q.nodes = q.nodes.filter(n => n.id !== 'N002'); assert.throws(() => C.migrateProgress(s, q), /删除了当前节点/);
});
test('操作历史限制为 25 条，不保存每步全文快照', () => {
  const p = C.demoProject(), s = C.createProgress(p);
  for (let i = 0; i < 80; i++) { C.enterNode(s, p, 'N002'); C.enterNode(s, p, 'N001'); }
  assert.equal(s.history.length, 25); assert(!JSON.stringify(s).includes('guidance')); assert(JSON.stringify(s).length < 15000);
});
