/**
 * 确定性骰子单测 —— 1+1 一定是 2 的骰子版：
 * 同种子必同序列（重放/防刷），分布均匀，种子随楼与序号变化。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/runtime/dice.js");

test("重放一致性：同种子掷 100 颗 d20，两次运行序列逐位相同", () => {
  const run = () => {
    const next = D.rng(20261015);
    return Array.from({ length: 100 }, () => Math.floor(next() * 20) + 1);
  };
  assert.deepEqual(run(), run());
});

test("同楼同序号同指纹 → 永远同一颗骰（删楼重掷不换数）", () => {
  for (let floor = 1; floor <= 50; floor++) {
    for (let seq = 0; seq < 3; seq++) {
      const s = D.actionSeed("chat-abc", floor, seq);
      const r1 = D.rollD20(s);
      const r2 = D.rollD20(s);
      assert.deepEqual(r1, r2);
    }
  }
});

test("换楼换序号换骰（不存在全局死数）", () => {
  const results = new Set();
  for (let floor = 1; floor <= 40; floor++) {
    results.add(D.rollD20(D.actionSeed("chat-abc", floor, 0)).d20);
  }
  // 40 层楼若只掷出 <=5 种面，说明种子退化
  assert.ok(results.size > 10, "种子多样性不足: " + results.size);
  // 同楼不同序号也要不同
  const s0 = D.rollD20(D.actionSeed("chat-abc", 7, 0)).d20;
  const s1 = D.rollD20(D.actionSeed("chat-abc", 7, 1)).d20;
  assert.notEqual(s0, s1, "同楼不同序号掷出了同一个数（概率 19/20，若挂了换种子混系数）");
});

test("分布均匀：10000 颗 d20，每面 380~620 次", () => {
  const next = D.rng(42);
  const count = new Array(21).fill(0);
  for (let i = 0; i < 10000; i++) count[Math.floor(next() * 20) + 1]++;
  for (let face = 1; face <= 20; face++) {
    assert.ok(count[face] >= 380 && count[face] <= 620, `面 ${face} 偏离: ${count[face]}`);
  }
});

test("优势/劣势的重放一致且取高取低正确", () => {
  const s = D.actionSeed("chat-x", 3, 0);
  const a = D.rollD20(s, "adv"), b = D.rollD20(s, "adv");
  assert.deepEqual(a, b);
  assert.equal(a.d20, Math.max(a.raw[0], a.raw[1]));
  const c = D.rollD20(s, "dis");
  assert.equal(c.d20, Math.min(c.raw[0], c.raw[1]));
});

test("2d10 重放一致，范围合法", () => {
  const s = D.actionSeed("chat-y", 9, 2);
  const a = D.roll2D10(s), b = D.roll2D10(s);
  assert.deepEqual(a.dice, b.dice);
  assert.ok(a.dice[0] >= 1 && a.dice[0] <= 10 && a.dice[1] >= 1 && a.dice[1] <= 10);
  assert.equal(a.total, a.dice[0] + a.dice[1]);
});

test("不同会话指纹互不串骰（同楼同序号，不同会话不同结果）", () => {
  const r1 = D.rollD20(D.actionSeed("chat-1", 5, 0)).d20;
  const r2 = D.rollD20(D.actionSeed("chat-2", 5, 0)).d20;
  // 概率 19/20 不同；若相同则再验一层
  if (r1 === r2) {
    const r1b = D.rollD20(D.actionSeed("chat-1", 6, 0)).d20;
    const r2b = D.rollD20(D.actionSeed("chat-2", 6, 0)).d20;
    assert.notEqual(r1b, r2b, "两个会话的骰子流疑似碰撞");
  }
});

/* ---------- 会话盐（主人定稿：种子不可推） ---------- */
test("会话盐由系统熵源生成：格式 32 位 hex，两次生成互不相同", () => {
  const a = D.newSessionSalt(), b = D.newSessionSalt();
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.match(b, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});

test("同盐重放一致，异盐序列分岔（对外黑箱，对内确定）", () => {
  const salt = D.newSessionSalt();
  const seqA = Array.from({ length: 50 }, (_, i) => D.rollD20(D.actionSeed(salt, 1 + (i % 10), i % 3)).d20);
  const seqB = Array.from({ length: 50 }, (_, i) => D.rollD20(D.actionSeed(salt, 1 + (i % 10), i % 3)).d20);
  assert.deepEqual(seqA, seqB);   // 同盐：逐位一致（可重放）
  const salt2 = D.newSessionSalt();
  const seqC = Array.from({ length: 50 }, (_, i) => D.rollD20(D.actionSeed(salt2, 1 + (i % 10), i % 3)).d20);
  const diff = seqA.filter((v, i) => v !== seqC[i]).length;
  assert.ok(diff > 30, `异盐序列过于相似: 仅 ${diff}/50 不同`);   // 期望约 47.5/50 不同
});

/* ── 优势铁律主链（rollD20 产骰层，主人定稿 2026-10-16）：与 checks.applyAdvDis 同律 ── */
test('rollD20 优势主链铁律：有 20 必取 20（含 {1,20}），无 20 有 1 锁死取 1，否则取高', () => {
  // 扫描种子空间，找到产生目标骰对的种子逐一验证
  const find = (a, b) => {
    for (let s = 1; s < 200000; s++) {
      const r = D.rollD20(s, "adv");
      if ((r.raw[0] === a && r.raw[1] === b) || (r.raw[0] === b && r.raw[1] === a)) return r;
    }
    return null;
  };
  const cases = [[1, 20, 20], [20, 1, 20], [14, 20, 20], [1, 15, 1], [5, 9, 9], [7, 7, 7]];
  for (const [a, b, want] of cases) {
    const r = find(a, b);
    assert.ok(r, `种子空间内未找到骰对 {${a},${b}}（200k 种子）`);
    assert.equal(r.d20, want, `骰对 {${a},${b}} 应取 ${want}`);
  }
});

test('rollD20 盐源双环境：Node 下 newSessionSalt 返回 32 位 hex', () => {
  const salt = D.newSessionSalt();
  assert.equal(salt.length, 32);
  assert.ok(/^[0-9a-f]+$/.test(salt));
});
