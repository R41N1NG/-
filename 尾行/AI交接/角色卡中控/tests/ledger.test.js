/**
 * 双账本单测：单写入口、边界钳制、快照回滚整笔还原、过夜结算复合、追缉只升不降。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createLedger } = require("../src/runtime/ledger.js");

test("初始账：默认开局，心跳基线统一 30（v0.8 主人定稿）", () => {
  const L = createLedger({ nrv: 8 });
  assert.equal(L.get("heart"), 30);      // 基线恒 30，不随胆量浮动
  assert.equal(L.get("cash"), 3000);
  assert.equal(L.get("date"), 1);
});

test("单写入口：commit 返回前后账与实际落账", () => {
  const L = createLedger({ nrv: 5 });
  const r = L.commit({ heart: 8, alert: 2 }, { floor: 10, reason: "test" });
  assert.equal(r.applied.heart, 8);
  assert.equal(r.applied.alert, 2);
  assert.equal(L.get("heart"), 38);
  assert.equal(L.get("alert"), 2);
});

test("边界钳制：警觉顶到 100 就停，applied 如实记录被剪掉的量", () => {
  const L = createLedger({ alert: 97 });
  const r = L.commit({ alert: 10 });
  assert.equal(L.get("alert"), 100);
  assert.equal(r.applied.alert, 3);      // 申报 10 实落 3
});

test("负向同理：心跳不穿 0", () => {
  const L = createLedger({ heart: 5 });
  const r = L.commit({ heart: -20 });
  assert.equal(L.get("heart"), 0);
  assert.equal(r.applied.heart, -5);
});

test("快照回滚：整笔还原，后续快照作废", () => {
  const L = createLedger({ nrv: 5 });
  const a = L.commit({ heart: 10, alert: 5 }, { floor: 3 });
  L.commit({ cash: -500 }, { floor: 4 });
  const c = L.commit({ pi: 3 }, { floor: 5 });
  assert.equal(L.get("cash"), 2500);
  assert.equal(L.get("pi"), 3);

  assert.equal(L.rollback(c.seq), true);        // 回到第 5 楼之前
  assert.equal(L.get("pi"), 0);
  assert.equal(L.get("cash"), 2500);            // 第 4 楼的账还在
  assert.equal(L.get("heart"), 40);             // 第 3 楼的账还在

  assert.equal(L.rollback(a.seq), true);        // 回到第 3 楼之前
  assert.equal(L.get("heart"), 30);
  assert.equal(L.get("alert"), 0);

  assert.equal(L.rollback(999), false);         // 不存在的快照安全拒绝
});

test("回滚后旧快照不可重放（时间线断裂保护）", () => {
  const L = createLedger();
  const a = L.commit({ heart: 5 });
  L.commit({ heart: 5 });
  L.rollback(a.seq);
  assert.equal(L.rollback(a.seq + 1), false);   // 已作废
});

test("过夜结算：防备沉淀、警觉清零、心跳回基线、体力恢复至、日期+1", () => {
  const L = createLedger({ nrv: 5, alert: 62, heart: 88, stamina: 40, wariness: 10, date: 3 });
  const r = L.settleNight({ peakAlert: 62, nrv: 5 });
  assert.equal(r.warinessGain, 3);              // (62-50)/4=3
  assert.equal(L.get("wariness"), 13);
  assert.equal(L.get("alert"), 0);
  assert.equal(L.get("heart"), 30);             // 胆5基线
  assert.equal(L.get("stamina"), 100);          // 40% ≥30% → 恢复至 100%
  assert.equal(r.restRatio, 1);
  assert.equal(L.get("date"), 4);
  assert.equal(r.nextStartAlert, Math.round(13 / 5));   // 3
});

test("过夜体力「恢复至」分档（v0.6，模拟过劳睡不好）：10~29%→80%、<10%→60%", () => {
  // 上限 120 的体格4：25%=25 点 → 80%（96）
  const L1 = createLedger({ nrv: 5, stamina: 25 });
  const r1 = L1.settleNight({ peakAlert: 0, nrv: 5, staminaMax: 120 });
  assert.equal(L1.get("stamina"), 96);
  assert.equal(r1.restRatio, 0.8);
  // 8%：10 点 → 60%（72）
  const L2 = createLedger({ nrv: 5, stamina: 10 });
  L2.settleNight({ peakAlert: 0, nrv: 5, staminaMax: 120 });
  assert.equal(L2.get("stamina"), 72);
  // 30% 整：36 点 → 回满
  const L3 = createLedger({ nrv: 5, stamina: 36 });
  L3.settleNight({ peakAlert: 0, nrv: 5, staminaMax: 120 });
  assert.equal(L3.get("stamina"), 120);
});

test("过夜不沉淀：峰值 45 以下戒心不动", () => {
  const L = createLedger({ wariness: 10, nrv: 5 });
  L.settleNight({ peakAlert: 45, nrv: 5 });
  assert.equal(L.get("wariness"), 10);
});

test("追缉只升不降：降级申报被拒，升级走 commit", () => {
  const L = createLedger({ pursuit: 2 });
  assert.equal(L.raisePursuit(1), null);
  const r = L.raisePursuit(3);
  assert.equal(L.get("pursuit"), 3);
  assert.ok(r.seq > 0);
});

test("未知账目直接抛错（防 LLM 口胡字段）", () => {
  const L = createLedger();
  assert.throws(() => L.commit({ 好感度: 10 }), /未知账目/);
  assert.throws(() => L.commit({ luck: 1 }), /未知账目/);
});

test("settleAction 复合入口：一笔动作多项账一次落（v0.6 疑虑已并入防备，无独立账）", () => {
  const L = createLedger({ nrv: 5 });
  L.settleAction({ alertD: 2, heartD: 8, piD: 2, staminaD: -1, proximityD: 1, faceMemD: 1 }, { floor: 7, reason: "follow_grace" });
  assert.equal(L.get("alert"), 2);
  assert.equal(L.get("heart"), 38);
  assert.equal(L.get("pi"), 2);
  assert.equal(L.get("stamina"), 99);
  assert.equal(L.get("proximity"), 1);
  assert.equal(L.get("faceMem"), 1);
  // 疑虑账已删（并入 wariness）——未知账目抛错兜底
  assert.throws(() => L.commit({ suspicion: 1 }), /未知账目/);
});
