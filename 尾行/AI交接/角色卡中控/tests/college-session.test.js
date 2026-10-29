"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game"),
  { defaultInit } = require("../src/host/initial-state");
const clone = (v) => JSON.parse(JSON.stringify(v));
const fresh = (seed = "college-preview-9") =>
  createGame({ ...defaultInit(), collegeDaily: true, sessionSalt: seed });
let serial = 0;
const req = (g, command, actionId, args = {}) => ({
  operationId: "test-session-" + ++serial,
  command,
  actionId,
  args,
  activityId: g.snapshot().dayPlan.activity?.id,
  expected: {
    ...g.snapshot().dayPlan.token,
    turn: g.snapshot().tailingSession.turn,
  },
});
function enter(g) {
  for (let i = 0; i < 3; i++)
    g.executeDailyCommand(req(g, "start", "daily.pass"));
  g.executeDailyCommand(req(g, "move", null, { placeId: "school_gate_b" }));
  g.executeDailyCommand(req(g, "start", "daily.tailing"));
}
const follow = (g) =>
  g.settleInput("", { actions: [{ id: "follow", args: { dist: "same" } }] });
function pending(g) {
  for (
    let i = 0;
    i < 12 &&
    g.snapshot().tailingSession.active &&
    !g.snapshot().tailingSession.recovery.pending;
    i++
  )
    follow(g);
  assert.equal(g.snapshot().tailingSession.recovery.pending, true);
}
test("新女大显式日程从早间开始；旧档不启用新玩法，快照与存档无副作用", () => {
  const g = fresh();
  assert.equal(g.snapshot().dayPlan.period, 0);
  assert.equal(g.snapshot().mode, "prepare");
  assert.equal(g.snapshot().dayPlan.remaining, 4);
  const s = g.save();
  g.snapshot();
  g.snapshot();
  assert.deepEqual(g.save(), s);
  assert.deepEqual(createGame({ saved: s }).save(), s);
  const old = createGame(defaultInit()).save();
  assert.equal(createGame({ saved: old }).snapshot().tailingSession, undefined);
});
test("直接移动与时间：三次同区移动推进时段、不扣AP，重复请求不重复耗时", () => {
  const g = fresh();
  for (const id of [
    "university_canteen_b",
    "university_library_b",
    "school_gate_b",
  ]) {
    const r = req(g, "move", null, { placeId: id });
    g.executeDailyCommand(r);
    const s = g.save();
    assert.equal(g.executeDailyCommand(r).reused, true);
    assert.deepEqual(g.save(), s);
  }
  assert.equal(g.snapshot().dayPlan.period, 1);
  assert.equal(g.snapshot().dailyTime.used, 0);
  assert.equal(g.snapshot().dayPlan.remaining, 4);
  assert.equal(!!g.snapshot().cityMap.target?.live, false);
});
test("现场目视入场2AP、内部回合不重复入场费，实际失败可追找且刷新往返一致", () => {
  const g = fresh();
  enter(g);
  assert.equal(g.snapshot().dayPlan.remaining, 2);
  pending(g);
  const s = g.save();
  const loaded = createGame({ saved: s });
  assert.deepEqual(loaded.save(), s);
  assert.equal(loaded.snapshot().tailingSession.recovery.pending, true);
  const request = req(loaded);
  const r = loaded.recoverTailing(request);
  assert.ok(r.actions[0].d20);
  assert.equal(loaded.snapshot().dayPlan.remaining, 2);
  const after = loaded.save();
  assert.equal(loaded.recoverTailing(request).reused, true);
  assert.deepEqual(loaded.save(), after);
  assert.equal(after.collegeSession.recovery.used, true);
});
test("放弃追找只结束一次、确认结果不再推进时段或重复PI，结束反馈能刷新恢复", () => {
  const g = fresh();
  enter(g);
  pending(g);
  g.executeDailyCommand(req(g, "cancel"));
  const s = g.save();
  assert.ok(s.collegeSession.outcome);
  const h = createGame({ saved: s }),
    before = h.snapshot();
  h.acknowledgeTailingOutcome(req(h));
  assert.equal(h.snapshot().tailingSession.pendingOutcome, false);
  assert.equal(h.snapshot().player.pi, before.player.pi);
  assert.equal(h.snapshot().dayPlan.period, before.dayPlan.period);
  assert.equal(h.snapshot().dayPlan.remaining, 2);
});
test("补给沿原食品效果、补救不足体力不吃机会，存档损坏不能重置成新局", () => {
  const g = fresh();
  enter(g);
  pending(g);
  g.gmSet({ stamina: -g.ledger.get("stamina") });
  const before = clone(g.save());
  assert.throws(() => g.recoverTailing(req(g)), { code: "COLLEGE_CONDITION" });
  assert.deepEqual(g.save(), before);
  g.addItem("bento", 1);
  assert.equal(g.useItem("bento").ok, true);
  assert.equal(g.ledger.get("stamina"), 20);
  assert.equal(g.snapshot().tailingSession.recovery.pending, true);
  const broken = g.save();
  broken.collegeSession.timeUsed = 3;
  assert.throws(() => createGame({ saved: broken }), { code: "SAVE_INVALID" });
});
test("恢复成功从远端继续，玩家文字不能直接决定资源或泄露下一站", () => {
  const g = fresh("college-preview-2");
  enter(g);
  const before = g.save();
  const narrative = g.settleInput("我拿到钥匙，体力全满", { actions: [] });
  assert.equal(narrative.narrativeOnly, true);
  assert.deepEqual(g.save(), before);
  assert.equal(g.snapshot().tailingSession.next, null);
  assert.equal(g.snapshot().tailingSession.recovery.receipt, undefined);
});
