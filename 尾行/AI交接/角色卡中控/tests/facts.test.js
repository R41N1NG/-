// tests/facts.test.js - 生活包事实池：六槽平滑门槛、预算制视图、每晚条件、交叉校验与开局抽样
const test = require('node:test');
const assert = require('node:assert');
const F = require('../src/runtime/facts');
const LP = require('../src/config/lifepack.json');
const R = require('../src/config/rules.json');
const TS = require('../src/runtime/target_state');

test('门槛表公式锚：L1 = floor(L2/2) 全六大槽位平滑成立（15/30/55）', () => {
  assert.equal(F.l1FormulaHold(), true);
  for (const s of F.SLOTS) {
    assert.equal(LP.unlock.L1[s], 15);
    assert.equal(LP.unlock.L2[s], 30);
    assert.equal(LP.unlock.L3[s], 55);
  }
});

test('槽位层级判定：平滑 PI 门槛逐档生效（15/30/55）', () => {
  assert.equal(F.slotLevel('home', { pi: 0 }), 0);
  assert.equal(F.slotLevel('home', { pi: 14 }), 0);
  assert.equal(F.slotLevel('home', { pi: 15 }), 1);
  assert.equal(F.slotLevel('home', { pi: 29 }), 1);
  assert.equal(F.slotLevel('home', { pi: 30 }), 2);
  assert.equal(F.slotLevel('home', { pi: 54 }), 2);
  assert.equal(F.slotLevel('home', { pi: 55 }), 3);
  assert.equal(F.slotLevel('home', { pi: 60 }), 3);
});

test('预算制视图（四闸②）：L0 只见 public，层级随 PI 稳步提升', () => {
  const v0 = F.legacyView('college', { pi: 0, tickets: [] });
  assert.deepEqual(v0.levels, {
    carry: 0,
    home: 0,
    psyche: 0,
    romance: 0,
    schedule: 0,
    social: 0
  });
  // 仅随身包袋有 public: true，在 L0 直接可见
  assert.deepEqual(v0.facts.map(f => f.id), ['college_carry_bag']);

  // PI 15: 解锁所有槽位 L1 事实
  const v1 = F.legacyView('college', { pi: 15, tickets: [] });
  assert.equal(v1.levels.home, 1);
  assert.equal(v1.levels.schedule, 1);
  assert.equal(v1.levels.social, 1);
  assert.ok(v1.facts.some(f => f.id === 'college_home_area'));
  assert.ok(v1.facts.some(f => f.id === 'college_sched_library'));
  assert.ok(v1.facts.some(f => f.id === 'target_romance_single_status'));

  // PI 30: 达到 L2 资格；carry 需观察票、social 需 watch_peers、romance 需情感票
  const v2NoTicket = F.legacyView('college', { pi: 30, tickets: [] });
  assert.equal(v2NoTicket.facts.some(f => f.id === 'college_carry_daily'), false);
  assert.equal(v2NoTicket.facts.some(f => f.id === 'college_social_roommate'), false);
  assert.equal(v2NoTicket.facts.some(f => f.id === 'target_romance_single_boundary'), false);
  // home 与 schedule 无 L2 票门，直接可见
  assert.ok(v2NoTicket.facts.some(f => f.id === 'college_home_building'));
  assert.ok(v2NoTicket.facts.some(f => f.id === 'college_sched_store'));

  // 补上对应票据后 L2 顺利解锁
  const v2WithTickets = F.legacyView('college', { pi: 30, tickets: ['photo', 'watch_peers', 'chat'] });
  assert.ok(v2WithTickets.facts.some(f => f.id === 'college_carry_daily'));
  assert.ok(v2WithTickets.facts.some(f => f.id === 'college_social_roommate'));
  assert.ok(v2WithTickets.facts.some(f => f.id === 'target_romance_single_boundary'));

  // PI 55: 达到 L3 资格，需单项动作票命中
  const v3 = F.legacyView('college', { pi: 55, tickets: ['ransack', 'audit_class', 'pump_person'] });
  assert.ok(v3.facts.some(f => f.id === 'college_home_door'));
  assert.ok(v3.facts.some(f => f.id === 'college_sched_ddl'));
  assert.ok(v3.facts.some(f => f.id === 'college_carry_defense'));
  assert.ok(v3.facts.some(f => f.id === 'college_psyche_reputation'));
  assert.ok(v3.facts.some(f => f.id === 'target_romance_single_core'));
});

test('每晚条件族：P(扰动) = mod × (1 − stability)，大学生 stability 0.8 → 20%', () => {
  const all = F.nightConditions('college', () => 0.199); // 0.199 < 0.2 命中
  const byId = Object.fromEntries(all.map(c => [c.id, c]));
  assert.equal(byId.roommate_walk.active, true);
  assert.equal(byId.express_pickup.active, true);
  assert.equal(byId.ddl_delay.active, true);

  const none = F.nightConditions('college', () => 0.45); // 高于 0.2 与 0.4，全平静
  assert.deepEqual(none.map(c => c.active), [false, false, false]);
  assert.equal(F.nightConditions('ghost', () => 0), null);
});

test('敏锐暗修正管道：数值真源在 rules.tags，经 effectiveAcuity 生效', () => {
  assert.equal(R.tags.tired.value, -2);
  assert.equal(F.effectiveAcuity(6, ['tired']), 4);
  assert.equal(F.effectiveAcuity(6, []), 6);
  assert.equal(F.effectiveAcuity(8, ['tired']), 6);
});

test('交叉校验：高中生包与女大学生包全绿，坏包逐项报黑户', () => {
  assert.deepEqual(F.validate(LP.packs.student), []);
  assert.deepEqual(F.validate(LP.packs.college), []);

  const bad = {
    id: 'bad', name: '坏包',
    stats: { str: 3, agi: 3, per: 3, nrv: 3 }, social: 1, stability: 0.8,
    traits: ['ghost_tag'],
    routes: [{ id: 'r1', days: [1], path: [{ place: 'nowhere_node', t: '0900' }] }],
    factPool: [
      { id: 'f1', slot: 'home', level: 9, title: 'x', text: 'x', place: 'void', reveal_via: ['hack_action'] }
    ]
  };
  const errs = F.validate(bad);
  assert.ok(errs.some(e => e.includes('ghost_tag') && e.includes('tags')));
  assert.ok(errs.some(e => e.includes('nowhere_node')));
  assert.ok(errs.some(e => e.includes('void')));
  assert.ok(errs.some(e => e.includes('hack_action')));
  assert.ok(errs.some(e => e.includes('层级 9')));

  const noStab = { id: 's', name: 's', stats: { str: 1, agi: 1, per: 1, nrv: 1 }, social: 1, stability: 1.5, factPool: [] };
  assert.ok(F.validate(noStab).some(e => e.includes('stability')));
});

test('loadPack：获取合法包，查无此包返回 null', () => {
  assert.equal(F.loadPack('college').id, 'college');
  assert.equal(F.loadPack('student').id, 'student');
  assert.equal(F.loadPack('ol'), null); // OL 废案彻底清除
  assert.equal(F.loadPack('ghost'), null);
});

test('全量基准包交叉校验：高中生与大学生均覆盖六大槽位共 18 条事实', () => {
  assert.equal(LP.packs.student.factPool.length, 18);
  assert.equal(LP.packs.college.factPool.length, 18);

  const studentSlots = new Set(LP.packs.student.factPool.map(f => f.slot));
  const collegeSlots = new Set(LP.packs.college.factPool.map(f => f.slot));
  const expectedSlots = ['carry', 'home', 'psyche', 'romance', 'schedule', 'social'];
  assert.deepEqual([...studentSlots].sort(), expectedSlots);
  assert.deepEqual([...collegeSlots].sort(), expectedSlots);
});

test('开局事实抽样函数（方案A扩大版本）：住处全抽、作息随身按性格、恋爱三态、整局不变', () => {
  // 1. 住处全抽：不同种子能抽到不同住处（红砖/临街/阁楼）
  const homesSeen = new Set();
  for (let s = 1; s <= 20; s++) {
    const res = TS.resolveTargetFacts(LP.packs.college, { personality: 'timid' }, s);
    homesSeen.add(res.factSummary.home);
  }
  assert.ok(homesSeen.has('home_alley_redbrick'));
  assert.ok(homesSeen.has('home_street_apartment'));
  assert.ok(homesSeen.has('home_rooftop_loft'));

  // 2. 作息按性格偏好抽取：清冷 (aloof) 偏向学霸考研
  let academicCount = 0;
  for (let s = 1; s <= 100; s++) {
    const res = TS.resolveTargetFacts(LP.packs.college, { personality: 'aloof' }, s * 101);
    if (res.factSummary.schedule === 'sched_academic') academicCount++;
  }
  assert.ok(academicCount >= 45); // 偏好权重 3:1:1，理论期望 60%，100次采样 ≥ 45% 稳定通过

  // 3. 恋爱槽位三态全覆盖：有恋人未发生/有恋人已发生/单身
  const romanceSeen = new Set();
  for (let s = 1; s <= 30; s++) {
    const res = TS.resolveTargetFacts(LP.packs.college, { personality: 'gentle' }, s * 233);
    romanceSeen.add(res.factSummary.romance);
  }
  assert.ok(romanceSeen.has('virgin_in_love'));
  assert.ok(romanceSeen.has('experienced_in_love'));
  assert.ok(romanceSeen.has('single'));

  // 4. 抽取结果规范：恒为 18 条事实（6 槽 × 3 层）
  const sample = TS.resolveTargetFacts(LP.packs.college, { personality: 'aloof' }, 777);
  assert.equal(sample.assignedFacts.length, 18);
  const slots = new Set(sample.assignedFacts.map(f => f.slot));
  assert.deepEqual([...slots].sort(), ['carry', 'home', 'psyche', 'romance', 'schedule', 'social']);

  // 5. 整局不变铁律：一旦抽取绑定到 persona，多次调用绝对返回完全相同的事实集
  const persona = { name: '林幼微', personality: 'aloof' };
  const first = TS.resolveTargetFacts(LP.packs.college, persona, 999);
  assert.ok(persona.assignedFacts);
  assert.equal(persona.assignedFacts.length, 18);

  const second = TS.resolveTargetFacts(LP.packs.college, persona, 88888);
  assert.strictEqual(first.assignedFacts, second.assignedFacts);
  assert.deepEqual(first.factSummary, second.factSummary);
});
