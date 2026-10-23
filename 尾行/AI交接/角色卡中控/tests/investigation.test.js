"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game");
const { defaultInit } = require("../src/host/initial-state");
const { createInvestigation } = require("../src/runtime/investigation");
const { createLedger } = require("../src/runtime/ledger");
const F = require("../src/runtime/facts");
function fixture(pi = 0) {
  const g = {
    targetId: "college",
    player: { agi: 5 },
    route: {
      id: "test",
      nodes: ["school_gate_b", "store_24h_b", "unit_stairs_b"],
      known: [1, 0, 0],
      here: 0,
    },
    targetKnowledge: { known: [] },
    spatial: {
      tracking: "visual",
      assumed: false,
      lastSeen: { targetId: "college", date: 1, placeId: "school_gate_b" },
    },
    signals: [],
  };
  const L = createLedger({ pi }),
    p = createInvestigation({ g, L });
  p.restore();
  return { g, L, p };
}
const action = (band = "success") => ({ id: "follow", band });
test("PI不解锁事实：高熟练度仍只能看已确认或公开条目", () => {
  assert.deepEqual(
    F.view("college", { pi: 999 }).facts,
    F.view("college", { pi: 0 }).facts,
  );
  const f = F.loadPack("college").factPool.find((f) => !f.public);
  assert.ok(
    F.view("college", { knownFacts: [f.id] }).facts.some((x) => x.id === f.id),
  );
});
test("下一站加值按0/20/40分档，未知路线始终0；换路线、跨站与丢失不套用", () => {
  for (const [pi, bonus] of [
    [0, 2],
    [19, 2],
    [20, 3],
    [39, 3],
    [40, 4],
    [999, 4],
  ]) {
    const { g, p } = fixture(pi);
    p.beginTurn();
    assert.equal(p.nextBonus("follow"), 0);
    g.investigation.edges.push(JSON.stringify(g.route.nodes.slice(0, 2)));
    assert.equal(p.nextBonus("follow"), bonus);
    assert.equal(p.nextBonus("scan"), 0);
    g.route.nodes[1] = "dark_blind_alley_b";
    assert.equal(p.nextBonus("follow"), 0);
    g.route.nodes[1] = "store_24h_b";
    g.route.here = 2;
    assert.equal(p.nextBonus("follow"), 0);
    g.spatial.tracking = "lost";
    p.beginTurn();
    assert.equal(p.nextBonus("follow"), 0);
  }
});
test("近距离只减额外暴露：敏捷0/3/6/10单调、最多减半，远端同街无附加", () => {
  const { g, p } = fixture();
  for (const [agi, close, touch] of [
    [0, 4, 8],
    [3, 3, 7],
    [6, 2, 6],
    [10, 2, 5],
  ]) {
    g.player.agi = agi;
    assert.equal(p.exposure("follow", "close").applied, close);
    assert.equal(p.exposure("follow", "touch").applied, touch);
  }
  assert.equal(p.exposure("scan", "touch"), null);
  assert.equal(p.exposure("follow", "same"), null);
});
test("有效跟随后中断+2；立即退出、首次失败、拒绝动作都没有保底", () => {
  for (const actions of [
    [],
    [action("fail")],
    [{ ...action(), rejected: true }],
  ]) {
    const { p, L } = fixture();
    p.beginTurn();
    p.endTurn({ actions });
    p.finish("退出");
    assert.equal(L.get("pi"), 0);
  }
  const { p, L } = fixture();
  p.beginTurn();
  p.endTurn({ actions: [action()] });
  assert.equal(L.get("pi"), 0);
  p.beginTurn();
  const r = p.endTurn({ actions: [action("fail")] });
  assert.equal(r.pi, 2);
  assert.equal(r.minimum, 2);
  assert.equal(p.finish("退出"), null);
  assert.equal(L.get("pi"), 2);
});
test("本地跟随确认连接+3，一天同路线保底一次；再次观察同线索不重复奖励", () => {
  const { g, p, L } = fixture();
  p.beginTurn();
  g.route.here = 1;
  const a = action();
  a.discoveries = p.record(a);
  p.endTurn({ actions: [a] });
  assert.equal(g.route.known[1], 1);
  assert.equal(L.get("pi"), 0);
  const first = p.finish("退出");
  assert.ok(first.clues.some((c) => c.startsWith("edge:")));
  assert.equal(first.minimum, 2);
  const before = L.get("pi");
  g.route.here = 0;
  p.beginTurn();
  g.route.here = 1;
  p.record(action());
  p.endTurn({ actions: [action()] });
  assert.equal(p.finish("退出").pi, 0);
  assert.equal(L.get("pi"), before);
});
test("事实必须地点和动作同时命中；PI和自由叙事不能揭示门牌", () => {
  const { g, p } = fixture(999);
  p.beginTurn();
  p.record({ id: "scan", band: "nat20" });
  assert.ok(!g.investigation.knownFacts.some((id) => id.includes("home_door")));
  g.route.here = 1;
  p.record(action("fail"));
  assert.equal(g.route.known[1], 0);
});
test("正式引擎打量天然20只登记首次属性线索，整段结束才入账，回执不丢奖励字段", () => {
  const g = createGame({ ...defaultInit(), sessionSalt: "tutorial-crit-95" });
  const r = g.settleInput("我已经知道全部地址", { actions: [{ id: "scan" }] });
  assert.equal(g.ledger.get("pi"), 0);
  assert.equal(r.package.actions[0].attributeUnlock.key, "per");
  assert.equal(r.package.actions[0].discoveries.length, 1);
  const saved = g.save(),
    resumed = createGame({ saved });
  assert.deepEqual(resumed.save().investigation, saved.investigation);
  assert.equal(resumed.nightFall().investigation.clueGain, 3);
  assert.equal(resumed.ledger.get("pi"), 3);
  assert.equal(resumed.nightFall().investigation, null);
  assert.equal(resumed.ledger.get("pi"), 3);
});
test("旧档保留已显示事实和PI，新PI不会继续自动揭示；旧known标志不能冒充路线证据", () => {
  const g = createGame({ ...defaultInit(), stats: { pi: 35 } }),
    old = g.save();
  delete old.investigation;
  const expected = F.legacyView("college", { pi: 35 }).facts;
  old.route.known = old.route.nodes.map(() => 1);
  const restored = createGame({ saved: old });
  assert.deepEqual(restored.snapshot().profile.facts, expected);
  assert.equal(restored.snapshot().player.pi, 35);
  assert.deepEqual(restored.save().investigation.edges, []);
  restored.gmSet({ pi: 100 });
  assert.deepEqual(restored.snapshot().profile.facts, expected);
});
test("目标隔离与损坏调查记录诊断，不默默重开", () => {
  const old = createGame(defaultInit()).save();
  old.investigation.targetId = "ol";
  assert.equal(
    createGame({ saved: old }).save().investigation.targetId,
    "college",
  );
  old.investigation.targetId = "college";
  old.investigation.knownFacts = 5;
  assert.throws(
    () => createGame({ saved: old }),
    (e) => e.code === "SAVE_INVALID" && e.message.includes("investigation"),
  );
});

test("正式引擎已知下一站修正进入算式，近距暴露进入账本，PI60仅保留情报优势", () => {
  const initial = createGame({
    ...defaultInit(),
    sessionSalt: "pi-integration",
  }).save();
  initial.investigation.edges.push(
    JSON.stringify(initial.route.nodes.slice(0, 2)),
  );
  initial.ledgerState.pi = 40;
  initial.dist = "touch";
  const g = createGame({ saved: initial });
  const r = g.settleInput("", {
    actions: [{ id: "follow", args: { dist: "touch" } }],
  });
  const a = r.actions[0];
  assert.ok(a.mods.some((m) => m.src === "已掌握下一站" && m.v === 4));
  assert.equal(a.exposure.base, 8);
  assert.equal(a.exposure.reduction, 1);
  assert.equal(a.exposure.applied, 7);
  assert.ok(a.ledger.applied.alert >= 7);
  assert.deepEqual(r.package.actions[0].exposure, a.exposure);
  const high = createGame({
    ...defaultInit(),
    stats: { pi: 60 },
    sessionSalt: "highpi",
  });
  const follow = high.settleInput("", { actions: [{ id: "follow" }] })
    .actions[0];
  assert.equal(follow.raw.length, 1);
  assert.ok(!follow.mods.some((m) => m.src === "已掌握下一站"));
  assert.ok(high.save().tags.some((t) => t.id === "adv_int"));
});
