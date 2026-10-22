"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const { createChatSync } = require("../src/host/chat-sync/controller.js");
const {
  createEconomy,
  validateEconomy,
} = require("../src/contracts/economy.js");
const clone = (x) => JSON.parse(JSON.stringify(x));
const plan = () => ({
  schema: 1,
  source: "daily",
  period: 0,
  spent: 0,
  activity: null,
  ended: false,
});
let count = 0;
const game = (patch) =>
  createGame({
    sessionSalt: "economy-test",
    identity: "otaku",
    dayPlan: plan(),
    stats: { cash: 2000, stamina: 100 },
    ...patch,
  });
const req = (g, actionId, args = {}, command = "start") => ({
  operationId: `economy-${++count}`,
  command,
  actionId,
  args,
  expected: g.snapshot().dayPlan.token,
});
const act = (g, id, args) => g.executeDailyCommand(req(g, id, args));
function nextDay(g) {
  while (!g.snapshot().dayPlan.ended) act(g, "daily.pass");
  g.executeDailyCommand(req(g, null, {}, "next-day"));
}
const owned = (g, id) =>
  g.save().player.inventory.find((x) => x.id === id)?.count || 0;

test("已有工作：复用各身份底薪、体力消耗；加薪门槛未定不伪造骰点", () => {
  for (const [identity, id, income, stamina] of [
    ["otaku", "remote", 264, 0],
    ["student", "mover", 280, 40],
    ["guard", "guard_shift", 384, 0],
    ["coach", "coach_class", 360, 20],
    ["criminal", "black_labor", 196, 40],
  ]) {
    const g = game({ identity });
    const before = g.snapshot().player;
    const row = g
      .snapshot()
      .dayActions.find((a) => a.id === "daily.work")
      .input.jobs.find((j) => j.id === id);
    assert.equal(row.enabled, true);
    assert.equal(row.income, income);
    act(g, "daily.work", { jobId: id, income: 99999, roll: 20 });
    assert.equal(g.snapshot().player.cash, before.cash + income);
    assert.equal(g.snapshot().player.stamina, before.stamina - stamina);
    assert.equal(g.snapshot().dayPlan.remaining, 3);
    assert.equal(g.snapshot().dayPlan.period, 1);
    assert.equal(g.save().economy.workedOn, 1);
  }
});
test("工作资格：每日一班跨刷新保留，下一天解禁，专属身份与体力复核", () => {
  const g = game();
  act(g, "daily.work", { jobId: "remote" });
  const copy = createGame({ saved: g.save() }),
    before = copy.save();
  assert.throws(() => act(copy, "daily.work", { jobId: "guard_shift" }), {
    code: "DAY_UNAVAILABLE",
  });
  assert.deepEqual(copy.save(), before);
  nextDay(copy);
  assert.equal(
    copy.snapshot().dayActions.find((a) => a.id === "daily.work").enabled,
    true,
  );
  for (const [patch, id] of [
    [{ identity: "student" }, "coach_class"],
    [{ identity: "criminal" }, "remote"],
    [{ stats: { cash: 500, stamina: 39 } }, "mover"],
  ]) {
    const invalid = game(patch),
      saved = invalid.save();
    assert.throws(() => act(invalid, "daily.work", { jobId: id }), {
      code: "DAY_UNAVAILABLE",
    });
    assert.deepEqual(invalid.save(), saved);
  }
});
test("保安排班与待定工种：只开放已明确时段／代价，不凭空造风险值", () => {
  for (const [date, period, enabled] of [
    [1, 0, true],
    [1, 3, false],
    [8, 0, false],
    [8, 3, true],
  ]) {
    const g = game({
      identity: "guard",
      stats: { date, stamina: 100, cash: 500 },
      dayPlan: { ...plan(), period },
    });
    const jobs = g.snapshot().dayActions.find((a) => a.id === "daily.work")
      .input.jobs;
    assert.equal(jobs.find((j) => j.id === "guard_shift").enabled, enabled);
    for (const id of ["bar_shift", "delivery"])
      assert.equal(jobs.find((j) => j.id === id).enabled, false);
  }
});
test("商场批量结账：只认商品ID与数量，当次入库与隔日到货分开", () => {
  const g = game(),
    cash = g.snapshot().player.cash;
  act(g, "daily.shop", {
    cart: [
      { id: "bento", quantity: 2 },
      { id: "climb_gear", quantity: 1 },
    ],
    total: 1,
    price: 1,
  });
  assert.equal(g.snapshot().player.cash, cash - 540);
  assert.equal(owned(g, "bento"), 2);
  assert.equal(owned(g, "climb_gear"), 0);
  assert.equal(g.snapshot().dayPlan.remaining, 3);
  assert.equal(g.save().economy.orders[0].lines[1].dueDate, 2);
  const copy = createGame({ saved: g.save() });
  nextDay(copy);
  assert.equal(owned(copy, "climb_gear"), 1);
  assert.equal(owned(copy, "bento"), 2);
  assert.equal(
    copy.save().economy.orders[0].lines.every((l) => l.delivered),
    true,
  );
  const once = createGame({ saved: copy.save() });
  nextDay(once);
  assert.equal(owned(once, "climb_gear"), 1);
});
test("商场验证：资金不足、无效清单、非卖品与越权黑市都不能扣钱或扣点", () => {
  const g = game({ stats: { cash: 30, stamina: 100 } });
  for (const args of [
    { cart: [] },
    { cart: [{ id: "missing", quantity: 1 }] },
    { cart: [{ id: "bento", quantity: -1 }] },
    { cart: [{ id: "bento", quantity: 1.5 }] },
    { cart: [{ id: "bento", quantity: 100 }] },
    { cart: [{ id: "bento", quantity: 2 }] },
    { cart: [{ id: "amulet", quantity: 1 }] },
    { channel: "black_market", cart: [{ id: "coffee", quantity: 1 }] },
  ]) {
    const saved = g.save();
    assert.throws(() => act(g, "daily.shop", args), {
      code: "DAY_UNAVAILABLE",
    });
    assert.deepEqual(g.save(), saved);
  }
});
test("黑市与合并数量：身份器材折扣来自旧配置，补给不打折，重复行不会超买", () => {
  const g = game({ identity: "criminal" });
  const cash = g.snapshot().player.cash;
  act(g, "daily.shop", {
    channel: "black_market",
    cart: [
      { id: "climb_gear", quantity: 1 },
      { id: "bento", quantity: 1 },
      { id: "bento", quantity: 1 },
    ],
  });
  assert.equal(g.snapshot().player.cash, cash - 490);
  assert.equal(owned(g, "bento"), 2);
  assert.equal(g.save().economy.orders[0].lines.length, 2);
});
test("经济存档：旧档补空态，订单损坏拒绝读取；失败不能静默重置购买或工作", () => {
  const g = game(),
    save = g.save();
  delete save.economy;
  const old = createGame({ saved: save });
  assert.deepEqual(old.save().economy, createEconomy());
  act(g, "daily.shop", { cart: [{ id: "climb_gear", quantity: 1 }] });
  for (const edit of [
    (e) => e.orders[0].total++,
    (e) => (e.orders[0].lines[0].quantity = NaN),
    (e) => (e.orders[0].lines[0].delivered = "yes"),
    (e) => e.orders.push(clone(e.orders[0])),
  ]) {
    const bad = g.save();
    edit(bad.economy);
    assert.throws(() => createGame({ saved: bad }), { code: "SAVE_INVALID" });
  }
  assert.throws(() => validateEconomy({ ...createEconomy(), workedOn: -1 }), {
    code: "SAVE_INVALID",
  });
});
function host() {
  const store = {},
    history = [{ id: 0, role: "assistant", text: "opening" }],
    state = { game: null, conf: { autoSettle: false } };
  let failure = null,
    snap,
    onSnap = () => {};
  const sync = createChatSync({
    state,
    createGame,
    defaultInit: () => ({
      sessionSalt: "economy-host",
      identity: "otaku",
      dayPlan: plan(),
      stats: { cash: 2000, stamina: 100 },
    }),
    vars: {
      read: async () => clone(store),
      assign: async (patch) => {
        if (failure === "before") throw Error("disk");
        Object.assign(store, clone(patch));
        if (failure === "after") throw Error("ack");
      },
    },
    readContext: async () => ({ scope: "economy", history: clone(history) }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: (s) => {
      snap = s;
      onSnap(s);
    },
  });
  return {
    store,
    state,
    sync,
    history,
    get snap() {
      return snap;
    },
    subscribe: (fn) => (onSnap = fn),
    fail: (x) => (failure = x),
    request: (id, args) => ({
      ...req(state.game, id, args),
      sync: snap.dayPlan.sync,
    }),
    run: (r) => sync.mutate("executeDailyCommand", r),
  };
}
test("经济同步：写失败回滚，应答丢失重读，重试购买或工资都仅一次", async () => {
  for (const failure of ["before", "after"])
    for (const id of ["daily.work", "daily.shop"]) {
      const h = host();
      await h.sync.newGame({});
      const request = h.request(
        id,
        id === "daily.work"
          ? { jobId: "remote" }
          : { cart: [{ id: "bento", quantity: 2 }] },
      );
      const before = h.state.game.save();
      h.fail(failure);
      await assert.rejects(h.run(request), { code: "WRITE_FAILED" });
      assert.deepEqual(h.state.game.save(), before);
      h.fail(null);
      await h.run(request);
      await h.sync.rebuild();
      await h.sync.reconcile();
      assert.equal(h.snap.player.cash, id === "daily.work" ? 2264 : 1960);
      assert.equal(h.snap.dayPlan.remaining, 3);
      assert.equal(owned(h.state.game, "bento"), id === "daily.shop" ? 2 : 0);
    }
});
test("经济分支：改写购买锚点会恢复购买前状态，恢复原回复找回钱、物品和订单", async () => {
  const h = host();
  await h.sync.newGame({});
  h.history.push({ id: 1, role: "assistant", text: "shop anchor" });
  await h.run(
    h.request("daily.shop", {
      cart: [
        { id: "bento", quantity: 2 },
        { id: "climb_gear", quantity: 1 },
      ],
    }),
  );
  assert.equal(h.snap.player.cash, 1460);
  h.history[1].text = "alternative";
  await h.sync.reconcile();
  assert.equal(h.snap.player.cash, 2000);
  assert.equal(h.snap.economy.orders.length, 0);
  h.history[1].text = "shop anchor";
  await h.sync.reconcile();
  assert.equal(h.snap.player.cash, 1460);
  assert.equal(owned(h.state.game, "bento"), 2);
  assert.equal(h.snap.economy.orders.length, 1);
});
test("经济UI：浏览／取消不消耗，轮询不吞选择，工资、购物与到货走真实保存", async () => {
  const { JSDOM } = require("jsdom"),
    { createDailyActionsUI } = require("../src/ui/daily/actions.js"),
    { createLifecycle } = require("../src/ui/lifecycle.js");
  const dom = new JSDOM(
    '<div id="wxDailyActionGrid"></div><div id="wxDailyControls"></div><p id="wxDailyStatus"></p>',
  );
  const lifecycle = createLifecycle(dom.window);
  const flush = async () => {
    for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
  };
  try {
    const h = host();
    await h.sync.newGame({});
    const doc = dom.window.document;
    const ui = createDailyActionsUI({
      document: doc,
      window: dom.window,
      lifecycle,
      getGlue: () => ({ command: h.sync.mutate }),
      reportSyncError: (e) => {
        throw e;
      },
    });
    h.subscribe((s) => ui.render(s));
    ui.render(h.snap);
    const click = (id) => doc.querySelector(`[data-action-id="${id}"]`).click();
    click("daily.work");
    assert.equal(h.snap.dayPlan.remaining, 4);
    assert.equal(
      doc.querySelectorAll("#wxEconomyInput [data-economy-submit]").length,
      1,
    );
    doc.querySelector('#wxEconomyInput button[type="button"]').click();
    await flush();
    assert.equal(h.snap.player.cash, 2000);
    assert.equal(h.snap.dayPlan.period, 0);
    click("daily.work");
    ui.render(clone(h.snap));
    const remote = doc.querySelector('input[value="remote"]');
    remote.checked = true;
    remote.dispatchEvent(new dom.window.Event("change"));
    doc.querySelector("[data-economy-submit]").click();
    await flush();
    assert.equal(h.snap.player.cash, 2264);
    assert.equal(h.snap.dayPlan.remaining, 3);
    click("daily.shop");
    const quantity = doc.querySelector('[data-item-id="bento"]');
    quantity.value = "2";
    quantity.dispatchEvent(new dom.window.Event("input"));
    assert.match(
      doc.querySelector("[data-economy-total]").textContent,
      /总价 40/,
    );
    ui.render(clone(h.snap));
    doc.querySelector("[data-economy-submit]").click();
    await flush();
    assert.equal(h.snap.player.cash, 2224);
    assert.equal(h.snap.dayPlan.remaining, 2);
    assert.equal(owned(h.state.game, "bento"), 2);
    assert.match(doc.getElementById("wxEconomyOrders").textContent, /已入库/);
    click("daily.shop");
    h.history.push({ id: 1, role: "assistant", text: "change" });
    await h.sync.reconcile();
    // 同状态刷新保留选择；会话／时段变化必须关闭旧选择。
    ui.render({
      ...h.snap,
      dayPlan: {
        ...h.snap.dayPlan,
        sync: { ...h.snap.dayPlan.sync, epoch: 999 },
      },
    });
    await flush();
    assert.equal(doc.getElementById("wxEconomyInput").hidden, true);
  } finally {
    lifecycle.dispose();
    dom.window.close();
  }
});

test("到货换日提交失败：日期与订单一起回滚，丢应答重试不会重复到货", async () => {
  for (const failure of ["before", "after"]) {
    const h = host();
    await h.sync.newGame({});
    await h.run(
      h.request("daily.shop", { cart: [{ id: "climb_gear", quantity: 1 }] }),
    );
    while (!h.snap.dayPlan.ended) await h.run(h.request("daily.pass"));
    const request = { ...h.request(null), command: "next-day" },
      before = h.state.game.save();
    h.fail(failure);
    await assert.rejects(h.run(request), { code: "WRITE_FAILED" });
    assert.deepEqual(h.state.game.save(), before);
    h.fail(null);
    await h.run(request);
    await h.sync.rebuild();
    await h.sync.reconcile();
    assert.equal(h.snap.dayPlan.date, 2);
    assert.equal(owned(h.state.game, "climb_gear"), 1);
    assert.equal(h.snap.economy.orders[0].lines[0].delivered, true);
  }
});

test("经济表单生命周期：销毁取消等待选择并移除节点，重新挂载只有一份", async () => {
  const { JSDOM } = require("jsdom"),
    { createDailyActionsUI } = require("../src/ui/daily/actions.js"),
    { createLifecycle } = require("../src/ui/lifecycle.js");
  const dom = new JSDOM(
    '<div id="wxDailyActionGrid"></div><div id="wxDailyControls"></div><p id="wxDailyStatus"></p>',
  );
  const h = host();
  await h.sync.newGame({});
  try {
    for (let i = 0; i < 2; i++) {
      const lifecycle = createLifecycle(dom.window);
      const ui = createDailyActionsUI({
        document: dom.window.document,
        window: dom.window,
        lifecycle,
        getGlue: () => ({ command: h.sync.mutate }),
        reportSyncError: () => {},
      });
      ui.render(h.snap);
      dom.window.document
        .querySelector('[data-action-id="daily.shop"]')
        .click();
      assert.equal(
        dom.window.document.querySelectorAll("#wxEconomyInput").length,
        1,
      );
      lifecycle.dispose();
      await new Promise((r) => setImmediate(r));
      assert.equal(
        dom.window.document.querySelectorAll("#wxEconomyInput").length,
        0,
      );
      assert.equal(h.snap.dayPlan.remaining, 4);
    }
  } finally {
    dom.window.close();
  }
});

test("普通用品按原分类即时入库，器材未到货前不可装备；到货后复用原行囊", () => {
  const g = game();
  act(g, "daily.shop", {
    cart: [
      { id: "umbrella", quantity: 1 },
      { id: "climb_gear", quantity: 1 },
    ],
  });
  assert.equal(owned(g, "umbrella"), 1);
  assert.equal(owned(g, "climb_gear"), 0);
  assert.equal(g.equipItem("climb_gear").ok, false);
  nextDay(g);
  assert.equal(g.equipItem("climb_gear").ok, true);
  assert.ok(g.save().tags.some((t) => t.id === "climb_steady"));
});
