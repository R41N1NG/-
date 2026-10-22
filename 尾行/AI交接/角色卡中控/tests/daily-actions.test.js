"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const { createChatSync } = require("../src/host/chat-sync/controller.js");
const T = require("../src/host/chat-sync/timeline.js");
const defs = require("../src/config/daily-actions.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
const plan = (patch = {}) => ({
  schema: 1,
  source: "daily",
  period: 0,
  spent: 0,
  activity: null,
  ended: false,
  ...patch,
});
const game = (patch = {}, services = {}) =>
  createGame(
    {
      sessionSalt: "daily-tests",
      dayPlan: plan(),
      stats: { stamina: 20 },
      ...patch,
    },
    services,
  );
let sequence = 0;
function request(g, actionId = "daily.rest", command = "start", extra = {}) {
  return {
    operationId: `test-${++sequence}`,
    command,
    actionId,
    expected: g.snapshot().dayPlan.token,
    ...extra,
  };
}
function extension(id, handler, patch = {}) {
  return {
    definition: { ...defs.find((d) => d.id === id), ...patch },
    handler,
  };
}
test("日程：休息先显示费用，恢复受上限限制，每次只推进一段", () => {
  const g = game({ stats: { stamina: 90 }, player: { staminaMax: 115 } });
  const before = g.snapshot();
  const row = before.dayActions.find((x) => x.id === "daily.rest");
  assert.equal(row.cost, 1);
  assert.equal(row.enabled, true);
  const receipt = g.executeDailyCommand(request(g));
  assert.equal(receipt.cost, 1);
  assert.equal(g.snapshot().dayPlan.remaining, 3);
  assert.equal(g.snapshot().dayPlan.period, 1);
  assert.equal(g.snapshot().player.stamina, 115);
  const saved = g.save();
  assert.throws(() => g.executeDailyCommand(request(g)), {
    code: "DAY_UNAVAILABLE",
  });
  assert.deepEqual(g.save(), saved);
});
test("日程：零点仍可度过时段，当天结束后才能换日", () => {
  const g = game({ dayPlan: plan({ period: 4, spent: 4 }) });
  assert.throws(() => g.executeDailyCommand(request(g, null, "next-day")), {
    code: "DAY_UNAVAILABLE",
  });
  g.executeDailyCommand(request(g, "daily.pass"));
  assert.equal(g.snapshot().dayPlan.ended, true);
  assert.equal(g.snapshot().dayPlan.remaining, 0);
  assert.throws(() => g.executeDailyCommand(request(g, "daily.pass")), {
    code: "DAY_UNAVAILABLE",
  });
  g.executeDailyCommand(request(g, null, "next-day"));
  assert.equal(g.snapshot().dayPlan.date, 2);
  assert.equal(g.snapshot().dayPlan.period, 0);
  assert.equal(g.snapshot().dayPlan.remaining, 4);
});
test("日程：存档往返保留去重回执，旧状态或篡改同编号请求不能再扣点", () => {
  const g = game();
  const req = request(g);
  g.executeDailyCommand(req);
  const restored = createGame({ saved: g.save() });
  const before = restored.save();
  assert.equal(restored.executeDailyCommand(req).reused, true);
  assert.deepEqual(restored.save(), before);
  assert.throws(
    () => restored.executeDailyCommand({ ...req, operationId: "stale" }),
    { code: "DAY_STALE" },
  );
  assert.throws(
    () => restored.executeDailyCommand({ ...req, args: { stamina: 999 } }),
    { code: "DAY_REQUEST_INVALID" },
  );
  assert.deepEqual(restored.save(), before);
});
test("日程：未接交流与出行时只解释条件，不收费用", () => {
  const g = game(),
    before = g.save();
  for (const id of ["daily.talk", "daily.tailing"]) {
    const row = g.snapshot().dayActions.find((x) => x.id === id);
    assert.equal(row.enabled, false);
    assert.ok(row.reason);
    assert.throws(() => g.executeDailyCommand(request(g, id)), {
      code: "DAY_UNAVAILABLE",
    });
  }
  assert.deepEqual(g.save(), before);
});
test("扩展：事件入场一次收费，结束才推进时段，允许白天入场", () => {
  for (const period of [0, 2, 4]) {
    const services = {
      dailyActions: [
        extension("daily.tailing", {
          available: (ctx) =>
            ctx.dayPlan.period === period ? null : "不在出行时段",
          prepare: () => ({ summary: "测试活动开始", payload: { turn: 0 } }),
          finish: (ctx, args, activity) => {
            if (!activity.payload.done)
              throw Object.assign(Error("活动尚未完成"), {
                code: "DAY_UNAVAILABLE",
              });
            return { summary: "完成" };
          },
          cancel: () => ({ summary: "结束测试活动" }),
        }),
      ],
    };
    const g = game({ dayPlan: plan({ period }) }, services);
    g.executeDailyCommand(request(g, "daily.tailing"));
    assert.equal(g.snapshot().dayPlan.remaining, 2);
    assert.equal(g.snapshot().dayPlan.period, period);
    const saved = g.save(),
      r = createGame({ saved }, services),
      id = r.snapshot().dayPlan.activity.id;
    assert.throws(
      () =>
        r.executeDailyCommand(
          request(r, null, "finish", { activityId: id, args: { done: true } }),
        ),
      { code: "DAY_UNAVAILABLE" },
    );
    assert.deepEqual(r.save(), saved, "玩家不能用参数自报完成");
    r.executeDailyCommand(request(r, null, "cancel", { activityId: id }));
    assert.equal(r.snapshot().dayPlan.remaining, 2);
    assert.equal(r.snapshot().dayPlan.period, Math.min(period + 1, 4));
    assert.equal(r.snapshot().dayPlan.ended, period === 4);
    assert.equal(r.snapshot().dayPlan.activity, null);
  }
});
test("扩展：费用、物品与报酬一笔结算，错误结果整笔拒绝", () => {
  const item = Object.keys(require("../src/config/rules.json").items)[0];
  const services = {
    dailyActions: [
      extension("daily.work", {
        available: () => null,
        prepare: (ctx) => {
          ctx.ledger.cash = 0;
          return {
            summary: "测试工作",
            ledger: { cash: 100 },
            inventory: [{ id: item, add: 2 }],
          };
        },
      }),
    ],
  };
  const g = game({}, services),
    cash = g.snapshot().player.cash;
  g.executeDailyCommand(request(g, "daily.work"));
  assert.equal(g.snapshot().player.cash, cash + 100);
  assert.equal(g.save().player.inventory.find((i) => i.id === item).count, 2);
  for (const bad of [
    { ledger: { date: 2 } },
    { ledger: { cash: -999999 } },
    { inventory: [{ id: "missing", add: 1 }] },
    { ledger: { stamina: Infinity } },
    { teleport: true },
  ]) {
    const broken = game(
      {},
      {
        dailyActions: [
          extension("daily.work", {
            available: () => null,
            prepare: () => ({ summary: "bad", ...bad }),
          }),
        ],
      },
    );
    const before = broken.save();
    assert.throws(
      () => broken.executeDailyCommand(request(broken, "daily.work")),
      { code: "DAY_EFFECT_INVALID" },
    );
    assert.deepEqual(broken.save(), before);
  }
});
test("扩展：条件模块故障仅禁用本项；旧动作管道不能绕过日程费用", () => {
  const g = game(
    {},
    {
      dailyActions: [
        extension("daily.work", {
          available: () => {
            throw Error("broken");
          },
        }),
      ],
    },
  );
  assert.equal(
    g.snapshot().dayActions.find((x) => x.id === "daily.work").enabled,
    false,
  );
  assert.equal(
    g.snapshot().dayActions.find((x) => x.id === "daily.pass").enabled,
    true,
  );
  const legacy = createGame();
  const baseline = createGame();
  baseline.settleInput("", { actions: [] });
  const before = baseline.snapshot().player.stamina;
  const result = legacy.settleInput("", {
    actions: [{ id: "daily.rest", name: "日程·休息", args: {} }],
  });
  assert.equal(result.actions[0].rejected, true);
  assert.equal(legacy.snapshot().player.stamina, before);
});
function host() {
  const stores = { A: {}, B: {} },
    histories = {
      A: [{ id: 0, role: "assistant", text: "opening" }],
      B: [{ id: 0, role: "assistant", text: "opening" }],
    };
  const state = { game: null, conf: { autoSettle: false } };
  let active = "A",
    failure = null,
    snap;
  const sync = createChatSync({
    state,
    vars: {
      read: async () => clone(stores[active]),
      assign: async (patch) => {
        if (failure === "before") throw Error("disk");
        Object.assign(stores[active], clone(patch));
        if (failure === "after") throw Error("ack lost");
      },
    },
    createGame,
    defaultInit: () => ({
      sessionSalt: "daily-host",
      dayPlan: plan(),
      stats: { stamina: 20 },
    }),
    readContext: async () => ({
      scope: active,
      history: clone(histories[active]),
    }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: (s) => {
      snap = s;
    },
  });
  return {
    sync,
    state,
    stores,
    histories,
    get snap() {
      return snap;
    },
    fail: (v) => (failure = v),
    switch: (v) => {
      active = v;
      sync.interrupt();
    },
    req(id = "daily.rest") {
      return { ...request(state.game, id), sync: snap.dayPlan.sync };
    },
    run: (r) => sync.mutate("executeDailyCommand", r),
  };
}
test("日程同步：并发重复、过期按钮、刷新均不重复扣点", async () => {
  const h = host();
  await h.sync.newGame({});
  const r = h.req();
  const [a, b] = await Promise.all([h.run(r), h.run(r)]);
  assert.equal(a.cost, 1);
  assert.equal(b.reused, true);
  assert.equal(h.snap.dayPlan.remaining, 3);
  await assert.rejects(h.run({ ...r, operationId: "different" }), {
    code: "DAY_STALE",
  });
  await h.sync.rebuild();
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 3);
  assert.equal(h.snap.dayPlan.period, 1);
  assert.equal(h.stores.A.wx_timeline.locals.length, 1);
});
test("日程同步：保存失败不发布扣点；应答丢失重读并复用已保存回执", async () => {
  for (const mode of ["before", "after"]) {
    const h = host();
    await h.sync.newGame({});
    const r = h.req(),
      before = h.state.game.save();
    h.fail(mode);
    await assert.rejects(h.run(r), { code: "WRITE_FAILED" });
    assert.deepEqual(h.state.game.save(), before);
    assert.equal(h.snap.dayPlan.remaining, 4);
    h.fail(null);
    const receipt = await h.run(r);
    assert.equal(!!receipt.reused, mode === "after");
    await h.sync.reconcile();
    assert.equal(h.snap.dayPlan.remaining, 3);
    assert.equal(h.stores.A.wx_save.dayPlan.spent, 1);
  }
});
test("日程同步：普通叙事不结算；编辑、删除、恢复回复，匹配其本地活动检查点", async () => {
  const h = host();
  await h.sync.newGame({});
  h.histories.A.push({ id: 1, role: "user", text: "日常描述" });
  assert.equal(
    (await h.sync.runInput({ messageId: 1, text: "日常描述", actions: [] }))
      .narrativeOnly,
    true,
  );
  await assert.rejects(h.run(h.req()), { code: "DAY_BUSY" });
  const reply = { id: 2, role: "assistant", text: "普通回复" };
  h.histories.A.push(reply);
  await h.sync.runReply({ text: reply.text });
  await h.run(h.req());
  assert.equal(h.snap.dayPlan.remaining, 3);
  assert.equal(h.state.game.save().floor, 0);
  reply.text = "改写回复";
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 4);
  await h.run(h.req("daily.pass"));
  assert.equal(h.snap.dayPlan.period, 1);
  assert.equal(h.snap.dayPlan.remaining, 4);
  reply.text = "普通回复";
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 3);
  h.histories.A.pop();
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 4);
  h.histories.A.push(reply);
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 3);
});
test("日程同步：切换聊天后旧按钮不能作用于新档；同聊天多次活动保留最新状态", async () => {
  const h = host();
  await h.sync.newGame({});
  const old = h.req();
  h.switch("B");
  await h.sync.newGame({});
  await assert.rejects(h.run(old), { code: "DAY_STALE" });
  assert.equal(h.snap.dayPlan.remaining, 4);
  await h.run(h.req());
  await h.run(h.req("daily.pass"));
  assert.equal(h.stores.B.wx_timeline.locals.length, 1);
  await h.sync.rebuild();
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 3);
  assert.equal(h.snap.dayPlan.period, 2);
  h.switch("A");
  await h.sync.rebuild();
  await h.sync.reconcile();
  assert.equal(h.snap.dayPlan.remaining, 4);
});
test("本地检查点窗口：裁剪后仍保存最新活动；超窗给出聊天楼层", () => {
  const history = [{ id: 0, role: "assistant", text: "start" }],
    timeline = T.newTimeline({ n: 0 }, history, "A");
  for (let n = 1; n <= 90; n++) {
    history.push({ id: n, role: "assistant", text: `message${n}` });
    T.checkpoint(timeline, history, { n });
  }
  assert.ok(timeline.locals.length <= 64);
  assert.equal(T.locate(T.validateTimeline(timeline), history).save.n, 90);
  assert.throws(
    () => T.locate(timeline, history.slice(0, 1)),
    (e) => e.code === "HISTORY_OUTSIDE_WINDOW" && e.location.index === 1,
  );
});

test("日程 UI：真实桥接保存后更新、连点不重扣，业务拒绝不锁整局", async () => {
  const { JSDOM } = require("jsdom");
  const { createDailyActionsUI } = require("../src/ui/daily/actions.js");
  const dom = new JSDOM(
    '<div id="wxDailyActionGrid"></div><div id="wxDailyControls"></div><p id="wxDailyStatus"></p>',
  );
  try {
    const h = host();
    await h.sync.newGame({});
    let ui,
      count = 0,
      errors = 0;
    const lifecycle = {
      disposed: false,
      on: (el, event, fn) => el.addEventListener(event, fn),
    };
    ui = createDailyActionsUI({
      document: dom.window.document,
      window: dom.window,
      lifecycle,
      getGlue: () => ({
        command: async (method, req) => {
          count++;
          const result = await h.sync.mutate(method, req);
          ui.render(h.snap);
          return result;
        },
      }),
      reportSyncError: () => errors++,
    });
    ui.render(h.snap);
    const buttons = () =>
      dom.window.document.querySelectorAll("#wxDailyActionGrid button");
    assert.equal(buttons().length, 6);
    assert.equal(buttons()[1].disabled, false);
    buttons()[0].click();
    buttons()[0].click();
    for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
    assert.equal(count, 1);
    assert.equal(h.snap.dayPlan.remaining, 3);
    assert.match(
      dom.window.document.getElementById("wxDailyStatus").textContent,
      /休息完成/,
    );
    h.state.generating = true;
    buttons()[5].click();
    for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
    assert.equal(h.snap.dayPlan.period, 1);
    assert.equal(errors, 0);
    assert.match(
      dom.window.document.getElementById("wxDailyStatus").textContent,
      /等待/,
    );
    ui.reset();
    assert.equal(buttons().length, 0);
  } finally {
    dom.window.close();
  }
});

test("旧档启用：不追扣历史，未完成原路线时拒绝切换", () => {
  const legacy = createGame({ sessionSalt: "enable" });
  legacy.executeDailyCommand(request(legacy, null, "enable"));
  assert.equal(legacy.snapshot().dayPlan.source, "daily");
  assert.equal(legacy.snapshot().dayPlan.remaining, 4);
  const running = createGame({
    ...require("../src/host/initial-state.js").defaultInit(),
    sessionSalt: "running",
  });
  running.settleInput("", { actions: [] });
  const save = running.save();
  const copy = createGame({ saved: save });
  const before = copy.save();
  assert.throws(() => copy.executeDailyCommand(request(copy, null, "enable")), {
    code: "DAY_BUSY",
  });
  assert.deepEqual(copy.save(), before);
});
test("损坏本地检查点：诊断带记录对应聊天楼层", () => {
  const history = [
    { id: 0, role: "assistant", text: "opening" },
    { id: 1, role: "assistant", text: "next" },
  ];
  const timeline = T.newTimeline({ n: 0 }, history.slice(0, 1), "A");
  T.checkpoint(timeline, history, { n: 1 });
  timeline.locals[0].key = "bad";
  assert.throws(
    () => T.validateTimeline(timeline),
    (e) => e.code === "TIMELINE_INVALID" && e.location.index === 1,
  );
});

test("持续交流：可信结束处理器结算一次效果，完成后推进且回执可重用", () => {
  const g = game(
    {},
    {
      dailyActions: [
        extension("daily.talk", {
          available: () => null,
          prepare: () => ({
            summary: "开始测试事件",
            payload: { canFinish: true },
          }),
          finish: (ctx, args, a) => {
            assert.equal(a.payload.canFinish, true);
            return { summary: "完成测试事件", ledger: { pi: 1 } };
          },
        }),
      ],
    },
  );
  g.executeDailyCommand(request(g, "daily.talk"));
  assert.equal(g.snapshot().dayPlan.period, 0);
  const req = request(g, null, "finish", {
    activityId: g.snapshot().dayPlan.activity.id,
  });
  g.executeDailyCommand(req);
  assert.equal(g.snapshot().dayPlan.period, 1);
  assert.equal(g.snapshot().dayPlan.remaining, 3);
  assert.equal(g.snapshot().player.pi, 1);
  assert.equal(g.executeDailyCommand(req).reused, true);
  assert.equal(g.snapshot().player.pi, 1);
});

test("输入前切回启用日程之前的分支：按该分支原流程结算，不沿用当前日程模式", async () => {
  const h = host();
  await h.sync.newGame({ dayPlan: plan({ source: "legacy" }) });
  h.histories.A.push({ id: 1, role: "user", text: "first" });
  await h.sync.runInput({ messageId: 1, text: "first", actions: [] });
  h.histories.A.push({ id: 2, role: "assistant", text: "original" });
  await h.sync.runReply({ text: "original" });
  const enable = { ...h.req(), command: "enable", actionId: null };
  await h.run(enable);
  assert.equal(h.snap.dayPlan.source, "daily");
  h.histories.A[2].text = "edited before enable";
  h.histories.A.push({ id: 3, role: "user", text: "new branch input" });
  const result = await h.sync.runInput({
    messageId: 3,
    text: "new branch input",
    actions: [],
  });
  assert.equal(result.floor, 2);
  assert.equal(result.narrativeOnly, undefined);
  assert.equal(h.state.game.save().dayPlan.source, "legacy");
});
