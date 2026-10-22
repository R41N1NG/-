"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { createGame } = require("../src/runtime/game.js");
const {
  createDayPlan,
  validateDayPlan,
} = require("../src/contracts/day-plan.js");
const { createDayPlanRenderer } = require("../src/ui/renderers/day-plan.js");
const fs = require("node:fs"),
  path = require("node:path");
const active = () => ({
  schema: 1,
  period: 3,
  spent: 2,
  activity: { id: "tailing-1", kind: "tailing", name: "尾行进行中", cost: 2 },
  ended: false,
  source: "daily",
});

test("日程存档与快照：保留时段、剩余点数和进行中活动，刷新不重置", () => {
  const game = createGame({
    sessionSalt: "agenda",
    dayPlan: active(),
    identity: "otaku",
  });
  const save = game.save();
  const copy = createGame({ saved: save });
  assert.deepEqual(copy.save().dayPlan, save.dayPlan);
  assert.deepEqual(copy.snapshot().dayPlan, game.snapshot().dayPlan);
  assert.equal(copy.snapshot().dayPlan.remaining, 2);
  const snap = copy.snapshot();
  snap.dayPlan.activity.name = "changed";
  save.dayPlan.spent = 4;
  assert.equal(copy.snapshot().dayPlan.activity.name, "尾行进行中");
  assert.equal(copy.snapshot().dayPlan.remaining, 2);
});

test("旧档缺少日程仅补字段，不猜测旧消耗或改变路线、账本及随机流", () => {
  const game = createGame({ sessionSalt: "old-daily", slot: "e23_01" });
  const save = game.save();
  delete save.dayPlan;
  const copy = createGame({ saved: save });
  assert.equal(copy.snapshot().dayPlan.period, 4);
  assert.equal(copy.snapshot().dayPlan.source, "legacy");
  for (const key of [
    "floor",
    "route",
    "ledgerState",
    "rngVersion",
    "sessionSalt",
  ])
    assert.deepEqual(copy.save()[key], save[key]);
});

test("损坏日程拒绝读取，不能静默重置点数", () => {
  for (const patch of [
    { spent: -1 },
    { spent: 5 },
    { period: 5 },
    { ended: true },
    { activity: { ...active().activity, cost: 1 } },
    { activity: undefined },
  ]) {
    const saved = createGame({ dayPlan: active() }).save();
    Object.assign(saved.dayPlan, patch);
    assert.throws(() => createGame({ saved }), { code: "SAVE_INVALID" });
  }
});

test("原有聊天回合不冒充日程完成，时段与预留点数保持不变", () => {
  const game = createGame({ sessionSalt: "turns-daily", dayPlan: active() });
  const before = game.save().dayPlan;
  game.settleInput("", { actions: [] });
  game.processReply("普通回复");
  assert.deepEqual(game.save().dayPlan, before);
});

test("日程模式不能通过旧过夜接口重置点数，旧模式过夜仍兼容", () => {
  const game = createGame({
    sessionSalt: "overnight-daily",
    dayPlan: active(),
  });
  for (let i = 0; i < 3; i++)
    assert.equal(game.snapshot().dayPlan.remaining, 2);
  assert.throws(() => game.nightFall(), { code: "DAY_UNAVAILABLE" });
  assert.equal(game.snapshot().dayPlan.date, 1);
  assert.equal(game.snapshot().dayPlan.remaining, 2);
  const legacy = createGame({ dayPlan: { ...createDayPlan(), spent: 2 } });
  legacy.nightFall();
  assert.equal(legacy.snapshot().dayPlan.date, 2);
  assert.equal(legacy.snapshot().dayPlan.remaining, 4);
});

test("日程 renderer：点数、五时段、活动真实投影，旧快照和重置清空", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "../src/ui/template.html"),
    "utf8",
  );
  const dom = new JSDOM(html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""));
  try {
    const doc = dom.window.document,
      renderer = createDayPlanRenderer({ document: doc });
    renderer.render(createGame({ dayPlan: active() }).snapshot());
    assert.equal(doc.getElementById("wxDayAp").textContent, "2");
    assert.equal(doc.querySelectorAll("#wxDayApPips .available").length, 2);
    assert.equal(doc.querySelectorAll("#wxDayPeriods li").length, 5);
    assert.equal(
      doc.querySelector('#wxDayPeriods [aria-current="step"]').textContent,
      "晚间",
    );
    assert.equal(doc.getElementById("wxDayActivity").textContent, "尾行进行中");
    renderer.render({ player: { date: 88 } });
    assert.equal(doc.getElementById("wxDayAp").textContent, "—");
    assert.equal(doc.querySelectorAll("#wxDayPeriods li").length, 0);
    renderer.render(createGame({ dayPlan: active() }).snapshot());
    renderer.reset();
    assert.equal(doc.getElementById("wxDayDate").textContent, "等待开局");
    assert.equal(doc.getElementById("wxDayPlan").dataset.source, undefined);
    renderer.render({ dayPlan: { ...active(), spent: 9 } });
    assert.equal(doc.getElementById("wxDayAp").textContent, "—");
  } finally {
    dom.window.close();
  }
});
