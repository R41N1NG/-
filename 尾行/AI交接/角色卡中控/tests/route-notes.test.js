"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game");
const { createPreview } = require("../tools/build/college-preview-model");
const { createCheckSystem } = require("../src/runtime/game/checks");
const { restoreRoutes } = require("../src/runtime/known-routes");
function discovered() {
  const p = createPreview(null, { period: 3, seed: "college-preview-2" });
  p.move("school_gate_b");
  p.execute(p.request("start", "daily.tailing"));
  for (let i = 0; i < 3; i++) p.follow();
  return p;
}
test("远端跟随与通勤DC加2，其他距离／观察不加，操作距离优先", () => {
  const g = {
    dist: "far",
    player: { agi: 5, int: 5 },
    target: { per: 4 },
    tags: [],
    consecFails: 0,
    ledger: { get: () => 30 },
  };
  const c = createCheckSystem({
    g,
    seedFor: () => 123,
    investigation: { nextBonus: () => 0 },
  });
  for (const id of [
    "follow",
    "ride_along",
    "transfer",
    "follow_work",
    "ride_follow",
    "car_follow",
  ]) {
    const far = c.runCheck({ id, check: "follow" }, {}, 0);
    const same = c.runCheck({ id, check: "follow" }, { dist: "same" }, 0);
    assert.equal(far.dc - same.dc, 2);
    assert.equal(far.distanceDC, 2);
    for (const dist of ["same", "close", "touch"])
      assert.equal(
        c.runCheck({ id, check: "follow" }, { dist }, 0).distanceDC,
        0,
      );
  }
  assert.equal(c.runCheck({ id: "scan", check: "scan" }, {}, 0).distanceDC, 0);
});
test("档案路线只投影确认连接，改名、保存和恢复不暴露未知住处", () => {
  const p = discovered(),
    s = p.snapshot(),
    routes = s.profile.routes;
  assert.equal(routes.length, 1);
  assert.equal(routes[0].name, "归家路线");
  assert.ok(routes[0].segments.length > 0);
  assert.ok(
    !JSON.stringify(routes).includes("单元") &&
      !JSON.stringify(routes).includes("unit_stairs"),
  );
  assert.ok(!Object.hasOwn(routes[0], "key"));
  const req = {
    targetId: s.target.id,
    id: routes[0].id,
    name: "图书馆后的归途",
  };
  p.renameKnownRoute(req);
  const restored = createPreview(p.save());
  assert.equal(restored.snapshot().profile.routes[0].name, req.name);
  assert.deepEqual(restored.save(), p.save());
  assert.throws(
    () => p.renameKnownRoute({ ...req, targetId: "other" }),
    /目标已切换/,
  );
  assert.throws(
    () => p.renameKnownRoute({ ...req, id: "unknown" }),
    /尚未探明/,
  );
  for (const name of ["", "\n", "甲".repeat(25), "路线\n名"])
    assert.throws(() => p.renameKnownRoute({ ...req, name }));
});
test("旧档只迁移真实连接证据，known全亮不生成路线；损坏记录明确拒绝", () => {
  const p = discovered(),
    saved = p.save();
  delete saved.investigation.routes;
  const r = createPreview(saved);
  assert.equal(r.snapshot().profile.routes.length, 1);
  const noEvidence = p.save();
  delete noEvidence.investigation.routes;
  noEvidence.investigation.edges = [];
  noEvidence.route.known.fill(1);
  assert.equal(createPreview(noEvidence).snapshot().profile.routes.length, 0);
  const corrupt = p.save();
  corrupt.investigation.routes[0].name = "";
  assert.throws(() => createPreview(corrupt), /存档路线/);
  const g = createGame()._g;
  g.investigation.routes = [];
  restoreRoutes(g);
  assert.equal(g.investigation.routes.length, 0);
});
test("工作奖励明确区分底薪、额外收益和总收入，三者与到账一致", () => {
  const p = createPreview(null, { seed: "college-preview-9" });
  const saved = p.save();
  saved.ledgerState.heart = 46;
  const q = createPreview(saved),
    r = q.execute(q.request("start", "daily.work", { jobId: "remote" }));
  const w = r.workCheck.workIncome;
  assert.ok(w.bonus > 0);
  assert.equal(w.base + w.bonus, w.total);
  assert.equal(q.snapshot().player.cash, 800 + w.total);
});
test("档案改名通过结构化保存，不执行HTML；轮询不覆盖正在输入的名称", async () => {
  const { JSDOM } = require("jsdom"),
    { createLifecycle } = require("../src/ui/lifecycle"),
    { createKnownRoutesUI } = require("../src/ui/profile/known-routes");
  const dom = new JSDOM('<div id="profileRoutes"></div>'),
    document = dom.window.document;
  const lifecycle = createLifecycle(dom.window),
    p = discovered();
  let saved;
  const ui = createKnownRoutesUI({
    document,
    lifecycle,
    getGlue: () => ({
      command: async (method, args) => {
        assert.equal(method, "renameKnownRoute");
        saved = args;
        return p.renameKnownRoute(args);
      },
    }),
  });
  ui.render(null);
  const s = p.snapshot();
  s.dayPlan.sync = { scope: "test", epoch: 1 };
  ui.render(s);
  const input = document.querySelector("input");
  input.value = "<b>归途</b>";
  ui.render(s);
  assert.equal(document.querySelector("input"), input);
  document
    .querySelector("form")
    .dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true }),
    );
  await new Promise((r) => setImmediate(r));
  assert.equal(saved.name, "<b>归途</b>");
  assert.deepEqual(saved.sync, s.dayPlan.sync);
  ui.render(p.snapshot());
  assert.equal(document.querySelector("input").value, "<b>归途</b>");
  assert.equal(document.querySelector("b"), null);
  lifecycle.dispose();
  dom.window.close();
});
