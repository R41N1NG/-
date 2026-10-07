'use strict';
// 身份：gpt。全部为合成逻辑例子，不能充当当前生产卡/门禁的测试结果。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
function reach(rules, seed = [], context = {}) {
  const known = new Set(seed);
  let changed;
  do {
    changed = false;
    for (const rule of rules) {
      if (rule.requires.every(x => known.has(x)) && (!rule.when || rule.when(context))) {
        for (const output of rule.actualWrites) {
          if (!known.has(output)) { known.add(output); changed = true; }
        }
      }
    }
  } while (changed);
  return [...known].sort();
}
const mutual = [
  { name: 'A入口', requires: ['B'], actualWrites: ['A'] },
  { name: 'B入口', requires: ['A'], actualWrites: ['B'] },
];
assert.ok(mutual.every(r => r.actualWrites.every(x => !r.requires.includes(x))));
assert.deepEqual(reach(mutual), []); // 没有直接自依赖，但从空初始状态不可达。
assert.deepEqual(reach(mutual, ['A']), ['A', 'B']); // 初始种子改变结果，不能无视初始化。
const closesAfterX = known => !known.has('X');
const known = new Set();
assert.equal(closesAfterX(known), true);
assert.equal(known.has('X'), false); // 上界检查本身没有产生X。
const missingWriter = [
  { name: '候选X入口', requires: [], actualWrites: [] },
  { name: '后续Y入口', requires: ['X'], actualWrites: ['Y'] },
];
assert.deepEqual(reach(missingWriter), []);
const afterDisasterOnly = s => s.disaster === true && s.stage >= 7;
const withBeastDate = s => s.date >= 1579.01 && afterDisasterOnly(s);
const early = { date: 1578.08, disaster: true, stage: 99 };
assert.equal(afterDisasterOnly(early), true);
assert.equal(withBeastDate(early), false);
assert.equal(withBeastDate({ ...early, date: 1579.01 }), true);
const windowRule = [{ name: '到期候选', requires: [], actualWrites: ['X'],
  when: c => c.date >= 1579.01 && c.date < 1579.03 }];
assert.deepEqual(reach(windowRule, [], { date: 1579.01 }), ['X']);
assert.deepEqual(reach(windowRule, [], { date: 1579.06 }), []);
const result = {
  identity: 'gpt', date: '2026-10-08', type: '合成反例，非当前卡测试',
  no_direct_self_dependency_but_unreachable_mutual_cycle: true,
  adding_initial_seed_changes_reachability: true,
  negative_completion_guard_does_not_write_fact: true,
  candidate_entry_without_actual_writer_cannot_advance: true,
  disaster_prerequisite_without_date_allows_early_beast_example: true,
  time_windows_change_reachability: true,
  limits: '没有执行99c04db所述生产代码、宿主扫描或下级检查；不能证明实际卡有死环/缺日期门。此固定点仅演示单调合成写入规则，不替代真实多时点、身份、keys、预算与校验验证。',
};
fs.writeFileSync(path.join(__dirname, '判据反例结果.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
