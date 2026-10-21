/**
 * 过档行为：她的警觉每跨一档，她做一件事；一晚每档只响一次。
 * 档1 提速（跟速检定）｜档2 三选一（回头/绕路/进店）｜档3 开跑｜档4 摊牌。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");

function game(over = {}) {
  return createGame({
    sessionSalt: "alert-behavior-salt",
    player: { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 125 },
    target: { str: 3, agi: 4, per: 4, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, alert: 0 },
    dist: "same",
    ...over,
  });
}

const route = () => ({
  id: "r", note: "", prompt: "", startTime: "21:30",
  nodes: ["school_gate_b", "old_skybridge_b", "store_24h_b", "old_alley_main_b", "unit_stairs_b"],
  times: ["2130", "2145", "2200", "2215", "2230"],
  known: [1, 1, 1, 1, 1], here: 0,
});

test("档1 不安：跨档触发「提速」，只响一次", () => {
  const g = game({ route: route() });
  g.ledger.commit({ alert: 25 });          // 21–40 → 不安
  g.processFloor("", { floor: 1 });
  assert.equal(g._g.alertEvent.stage, 1);
  assert.equal(g._g.alertEvent.kind, "提速");
  assert.ok(g._g.alertEvent.detail.includes("跟速"));
  assert.deepEqual(g._g.alertLatch, [1]);

  const first = g._g.alertEvent;
  g.ledger.commit({ alert: 5 });           // 仍在本档
  g.processFloor("", { floor: 2 });
  assert.equal(g._g.alertEvent, null, "同档不重复触发（本楼无新事件）");
  assert.deepEqual(g._g.alertLatch, [1]);
  assert.ok(first.kind === "提速");
});

test("一次跳到确认档：只演最高档，低档只记不发", () => {
  const g = game({ route: route() });
  g.ledger.commit({ alert: 65 });
  g.processFloor("", { floor: 1 });
  assert.equal(g._g.alertEvent.stage, 3);
  assert.equal(g._g.alertEvent.kind, "开跑");
  assert.equal(g._g.fleeing, true);
  assert.deepEqual(g._g.alertLatch, [1, 2, 3], "跳过的档记为已过");
});

test("档2 起疑：胆大 → 骤停回头（近身会照面）", () => {
  const g = game({ route: route(), target: { str: 3, agi: 4, per: 4, nrv: 6, social: 2 }, dist: "touch" });
  g.ledger.commit({ alert: 45 });
  g.processFloor("", { floor: 1 });
  assert.equal(g._g.alertEvent.stage, 2);
  assert.equal(g._g.alertEvent.kind, "骤停回头");
  assert.ok(/记忆 \+2|警觉 -5/.test(g._g.alertEvent.detail));
});

test("档2 起疑：敏锐 → 绕死路（她往前一站，你被拉开）", () => {
  const g = game({ route: route(), target: { str: 3, agi: 4, per: 6, nrv: 4, social: 2 }, dist: "close" });
  g.ledger.commit({ alert: 45 });
  g.processFloor("", { floor: 1 });
  assert.equal(g._g.alertEvent.kind, "绕死路");
  assert.equal(g._g.route.here, 1, "她多走了一站");
  assert.equal(g._g.dist, "same", "距离被拉开一档（身后 → 同街）");
});

test("档3 开跑：之后每楼她多推一站，跑到终点即跟丢", () => {
  const g = game({ route: route() });
  g.ledger.commit({ alert: 65 });
  g.processFloor("", { floor: 1 });          // 触发开跑 + 当楼先按表推进
  const hereAfter1 = g._g.route.here;
  g.processFloor("", { floor: 2 });
  assert.ok(g._g.route.here > hereAfter1, "逃跑时每楼额外推进");
  g.processFloor("", { floor: 3 });
  g.processFloor("", { floor: 4 });
  g.processFloor("", { floor: 5 });
  assert.equal(g._g.tailing, false, "她跑到终点＝跟丢");
});

test("档4 摊牌：直接结束当晚的跟缀", () => {
  const g = game({ route: route() });
  g.ledger.commit({ alert: 85 });
  g.processFloor("", { floor: 1 });
  assert.equal(g._g.alertEvent.stage, 4);
  assert.equal(g._g.alertEvent.kind, "摊牌");
  assert.equal(g._g.tailing, false);
});
