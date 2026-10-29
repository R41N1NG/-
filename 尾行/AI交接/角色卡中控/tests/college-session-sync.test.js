"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  { host, send } = require("./helpers/college-host");
const { defaultInit } = require("../src/host/initial-state");
const clone = (v) => JSON.parse(JSON.stringify(v));
let serial = 0;
async function command(h, cmd, actionId, args = {}) {
  const s = await h.sync.reconcile();
  const req = {
    operationId: "sync-session-" + ++serial,
    command: cmd,
    actionId,
    args,
    activityId: s.dayPlan.activity?.id,
    expected: { ...s.dayPlan.token, turn: s.tailingSession.turn },
    sync: s.dayPlan.sync,
  };
  return h.sync.mutate("executeDailyCommand", req);
}
async function start(h) {
  await h.sync.newGame({
    ...defaultInit(),
    collegeDaily: true,
    sessionSalt: "college-preview-9",
  });
  for (let i = 0; i < 3; i++) await command(h, "start", "daily.pass");
  await command(h, "move", null, { placeId: "school_gate_b" });
  await command(h, "start", "daily.tailing");
}
async function getPending(h) {
  for (
    let i = 0;
    i < 12 && !h.state.game.snapshot().tailingSession.recovery.pending;
    i++
  ) {
    await send(h, "跟随" + i);
    h.reply("回应" + i);
    await h.sync.runReply({ text: "回应" + i });
  }
  assert.equal(h.state.game.snapshot().tailingSession.recovery.pending, true);
}
function guarded(s) {
  return {
    operationId: "recover-" + ++serial,
    expected: { ...s.dayPlan.token, turn: s.tailingSession.turn },
    activityId: s.dayPlan.activity?.id,
    sync: s.dayPlan.sync,
  };
}
test("正式日程移动与机会随原聊天保存、刷新恢复；保存失败整笔回滚", async () => {
  const h = host();
  await h.sync.newGame({ ...defaultInit(), collegeDaily: true });
  await command(h, "move", null, { placeId: "university_canteen_b" });
  const before = clone(h.stores.A);
  assert.equal(before.wx_save.collegeSession.timeUsed, 1);
  h.failWrites(true);
  await assert.rejects(command(h, "move", null, { placeId: "school_gate_b" }), {
    code: "WRITE_FAILED",
  });
  assert.deepEqual(h.stores.A, before);
  h.failWrites(false);
  await h.sync.reconcile();
  assert.equal(h.state.game.save().collegeSession.timeUsed, 1);
});
test("补救写入后丢应答：重读和重复按钮不重掷、不重扣，不重复返还机会", async () => {
  const h = host();
  await start(h);
  await getPending(h);
  const req = guarded(await h.sync.reconcile());
  h.failAfterWrite(true);
  await assert.rejects(h.sync.mutate("recoverTailing", req), {
    code: "WRITE_FAILED",
  });
  const committed = clone(h.stores.A.wx_save);
  h.failAfterWrite(false);
  await h.sync.reconcile();
  const r = await h.sync.mutate("recoverTailing", req);
  assert.equal(r.reused, true);
  assert.deepEqual(h.stores.A.wx_save, committed);
  assert.equal(committed.collegeSession.recovery.used, true);
});
test("结束与收获确认均沿检查点：刷新不重复推进、不重结PI", async () => {
  const h = host();
  await start(h);
  await getPending(h);
  await command(h, "cancel");
  const before = clone(h.stores.A.wx_save);
  assert.ok(before.collegeSession.outcome);
  const req = guarded(await h.sync.reconcile());
  await h.sync.mutate("acknowledgeTailingOutcome", req);
  await h.sync.rebuild();
  assert.equal(h.state.game.save().collegeSession.outcome.acknowledged, true);
  assert.equal(h.state.game.ledger.get("pi"), before.ledgerState.pi);
  assert.equal(h.state.game.save().dayPlan.period, before.dayPlan.period);
});
test("聊天切换后旧补救请求不能作用于另一个存档", async () => {
  const h = host();
  await start(h);
  await getPending(h);
  const req = guarded(await h.sync.reconcile());
  h.setActive("B");
  await h.sync.newGame({ ...defaultInit(), collegeDaily: true });
  const before = clone(h.stores.B);
  await assert.rejects(h.sync.mutate("recoverTailing", req), {
    code: "DAY_STALE",
  });
  assert.deepEqual(h.stores.B, before);
});
test("原回复分支回退可恢复尾行前后状态，不从楼号重建时间与AP", async () => {
  const h = host();
  await start(h);
  const messageId = h.user("第一步");
  await h.sync.runInput({
    messageId,
    text: "第一步",
    actions: [{ id: "follow", args: { dist: "same" } }],
  });
  h.reply("原回复");
  await h.sync.runReply({ text: "原回复" });
  const stable = clone(h.stores.A.wx_save);
  h.histories.A.at(-1).text = "改写回复";
  await h.sync.reconcile();
  h.histories.A.at(-1).text = "原回复";
  await h.sync.reconcile();
  assert.deepEqual(h.state.game.save(), stable);
});
