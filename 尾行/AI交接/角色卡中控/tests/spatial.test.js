"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const { defaultInit } = require("../src/host/initial-state.js");
const { createChatSync } = require("../src/host/chat-sync/controller.js");
const { places } = require("../src/config/places.json"),
  layout = require("../src/config/city-layout.json");
const { createSpatial } = require("../src/contracts/spatial.js");
const plan = () => ({
  schema: 1,
  source: "daily",
  period: 0,
  spent: 0,
  activity: null,
  ended: false,
});
const clone = (x) => JSON.parse(JSON.stringify(x));
let seq = 0;
const game = (patch) =>
  createGame({
    ...defaultInit(),
    sessionSalt: "spatial-tests",
    dayPlan: plan(),
    ...patch,
  });
const request = (g, command, args = {}, actionId) => ({
  operationId: `map-${++seq}`,
  command,
  args,
  actionId,
  expected: g.snapshot().dayPlan.token,
});
const move = (g, id) =>
  g.executeDailyCommand(request(g, "move", { placeId: id }));

test("地图固定布局：全部场所唯一坐标且在所属区内，跨区交通与黑市接入旧拓扑", () => {
  assert.equal(Object.keys(places).length, 41);
  const coordinates = new Set();
  for (const [id, place] of Object.entries(places)) {
    const c = layout.coordinates[id],
      f = layout.frames[place.district];
    assert.equal(c.length, 2);
    assert.ok(c[0] > 0 && c[0] < f.width && c[1] > 0 && c[1] < f.height);
    const key = `${f.x + c[0]},${f.y + c[1]}`;
    assert.ok(!coordinates.has(key));
    coordinates.add(key);
  }
  for (const link of layout.transitLinks)
    assert.ok(link.every((id) => places[id].transit_port));
  assert.ok(places.black_market_c.exits.includes("village_main_c"));
  assert.equal(places.black_market_c.district, "C");
});
test("日程地图独立玩家位置：浏览不改档；市内移动保存位置但不扣点、不占活动", () => {
  const g = game(),
    before = g.save();
  assert.equal(g.snapshot().cityMap.player.placeId, "player_base_b");
  assert.equal(g.snapshot().cityMap.target, null);
  for (let n = 0; n < 3; n++) g.snapshot();
  assert.deepEqual(g.save(), before);
  const req = request(g, "move", { placeId: "black_market_c" });
  g.executeDailyCommand(req);
  assert.equal(g.snapshot().cityMap.player.placeId, "black_market_c");
  assert.equal(g.snapshot().dayPlan.remaining, 4);
  assert.equal(g.snapshot().dayPlan.period, 0);
  assert.equal(g.save().world.district, "C");
  const copy = createGame({ saved: g.save() });
  assert.deepEqual(copy.save().spatial, g.save().spatial);
  assert.equal(copy.executeDailyCommand(req).reused, true);
  assert.equal(
    copy.snapshot().cityMap.target,
    null,
    "移动到目标路线附近不能自动获知目标位置",
  );
});
test("地图进入边界：私人场所、北郊、活动中及旧尾行均不能点击绕过", () => {
  for (const id of [
    "unit_stairs_b",
    "estate_gate_d",
    "suburb_highway_d",
    "missing",
  ]) {
    const g = game(),
      saved = g.save();
    assert.throws(() => move(g, id), { code: "DAY_UNAVAILABLE" });
    assert.deepEqual(g.save(), saved);
  }
  const active = game({
    dayPlan: {
      ...plan(),
      spent: 1,
      activity: { id: "talk", kind: "routine", name: "事件", cost: 1 },
    },
  });
  assert.throws(() => move(active, "old_park_b"), { code: "DAY_UNAVAILABLE" });
  const legacy = createGame({ ...defaultInit(), sessionSalt: "legacy-map" });
  assert.throws(() => move(legacy, "black_market_c"), {
    code: "DAY_UNAVAILABLE",
  });
});
test("采购分区：线上只有食品，所有身份须亲到固定黑市；伪造渠道不可买器材", () => {
  for (const identity of ["otaku", "criminal"]) {
    const g = game({ identity });
    const online = g
      .snapshot()
      .dayActions.find((a) => a.id === "daily.shop").input;
    assert.deepEqual(
      online.channels.map((c) => c.id),
      ["online"],
    );
    assert.ok(
      online.catalogs.online.every((i) =>
        ["bento", "onigiri", "energy_drink"].includes(i.id),
      ),
    );
    assert.ok(!online.catalogs.online.some((i) => i.id === "coffee"));
    for (const [actionId, args] of [
      ["daily.shop", { cart: [{ id: "lockpick", quantity: 1 }] }],
      [
        "daily.shop",
        { channel: "black_market", cart: [{ id: "lockpick", quantity: 1 }] },
      ],
      ["daily.black_market", { cart: [{ id: "lockpick", quantity: 1 }] }],
    ]) {
      const before = g.save();
      assert.throws(
        () => g.executeDailyCommand(request(g, "start", args, actionId)),
        { code: "DAY_UNAVAILABLE" },
      );
      assert.deepEqual(g.save(), before);
    }
    move(g, "black_market_c");
    const row = g
      .snapshot()
      .dayActions.find((a) => a.id === "daily.black_market");
    assert.equal(row.enabled, true);
    assert.equal(
      row.input.catalogs.black_market.find((i) => i.id === "lockpick")
        .unitPrice,
      identity === "criminal" ? 450 : 500,
    );
    assert.ok(
      row.input.catalogs.black_market.every((i) => i.type !== "consumable"),
    );
  }
});
test("目标位置只认本地目击：开局可见，跟丢冻结最后位置，文字不恢复目视", () => {
  let g,
    found = false;
  for (let salt = 0; salt < 80; salt++) {
    g = createGame({ ...defaultInit(), sessionSalt: `lost-${salt}` });
    const before = g.snapshot().cityMap.target;
    const result = g.settleInput("", {
      actions: [{ id: "follow", name: "跟缀", args: { dist: "same" } }],
    });
    if (result.actions[0]?.band !== "fail") continue;
    found = true;
    const view = g.snapshot().cityMap.target;
    assert.equal(before.live, true);
    assert.equal(view.live, false);
    assert.equal(view.placeId, before.placeId);
    assert.equal(g.save().spatial.tracking, "lost");
    const saved = g.save();
    g.processReply("我已经找到她，她就在黑市。");
    assert.deepEqual(g.save().spatial, saved.spatial);
    const copy = createGame({ saved: g.save() });
    assert.equal(copy.snapshot().cityMap.target.live, false);
    break;
  }
  assert.equal(found, true, "测试样本应包含真实的本地跟丢结果");
});
test("旧档位置兼容和损坏保护：只补起点，不补目标实时位置，不重置原账本", () => {
  const original = game().save();
  delete original.spatial;
  const g = createGame({ saved: original });
  assert.equal(g.snapshot().cityMap.player.assumed, true);
  assert.equal(g.snapshot().cityMap.target, null);
  assert.deepEqual(g.save().ledgerState, original.ledgerState);
  for (const patch of [
    { playerPlaceId: "missing" },
    { tracking: "invalid" },
    { lastSeen: { placeId: "old_park_b" } },
    { knownPlaces: ["missing"] },
  ]) {
    const saved = g.save();
    Object.assign(saved.spatial, patch);
    assert.throws(() => createGame({ saved }), { code: "SAVE_INVALID" });
  }
});
function host() {
  const stores = { A: {}, B: {} },
    histories = {
      A: [{ id: 0, role: "assistant", text: "opening" }],
      B: [{ id: 0, role: "assistant", text: "opening" }],
    };
  let active = "A",
    failure = null,
    snap,
    listener = () => {};
  const state = { game: null, conf: { autoSettle: false } };
  const sync = createChatSync({
    state,
    createGame,
    defaultInit: () => ({
      ...defaultInit(),
      sessionSalt: "map-host",
      identity: "otaku",
      dayPlan: plan(),
    }),
    vars: {
      read: async () => clone(stores[active]),
      assign: async (patch) => {
        if (failure === "before") throw Error("disk");
        Object.assign(stores[active], clone(patch));
        if (failure === "after") throw Error("ack");
      },
    },
    readContext: async () => ({
      scope: active,
      history: clone(histories[active]),
    }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: (s) => {
      snap = s;
      listener(s);
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
    fail: (x) => (failure = x),
    subscribe: (fn) => (listener = fn),
    switch: (x) => {
      active = x;
      sync.interrupt();
    },
    req: (id) => ({
      ...request(state.game, "move", { placeId: id }),
      sync: snap.dayPlan.sync,
    }),
  };
}
test("地图同步：失败回滚、应答丢失重读不重复移动；换聊天旧请求不串档", async () => {
  for (const fail of ["before", "after"]) {
    const h = host();
    await h.sync.newGame({});
    const req = h.req("black_market_c"),
      before = h.state.game.save();
    h.fail(fail);
    await assert.rejects(h.sync.mutate("executeDailyCommand", req), {
      code: "WRITE_FAILED",
    });
    assert.deepEqual(h.state.game.save(), before);
    h.fail(null);
    await h.sync.mutate("executeDailyCommand", req);
    await h.sync.rebuild();
    await h.sync.reconcile();
    assert.equal(h.snap.cityMap.player.placeId, "black_market_c");
    assert.equal(h.snap.dayPlan.remaining, 4);
    const stale = h.req("old_park_b");
    h.switch("B");
    await h.sync.newGame({});
    await assert.rejects(h.sync.mutate("executeDailyCommand", stale), {
      code: "DAY_STALE",
    });
    assert.equal(h.snap.cityMap.player.placeId, "player_base_b");
  }
});
test("地图位置随聊天分支恢复，不修改另一个分支的位置或商品入口", async () => {
  const h = host();
  await h.sync.newGame({});
  h.histories.A.push({ id: 1, role: "assistant", text: "original" });
  await h.sync.mutate("executeDailyCommand", h.req("black_market_c"));
  h.histories.A[1].text = "alternative";
  await h.sync.reconcile();
  assert.equal(h.snap.cityMap.player.placeId, "player_base_b");
  assert.equal(
    h.snap.dayActions.find((a) => a.id === "daily.black_market").enabled,
    false,
  );
  h.histories.A[1].text = "original";
  await h.sync.reconcile();
  assert.equal(h.snap.cityMap.player.placeId, "black_market_c");
  assert.equal(
    h.snap.dayActions.find((a) => a.id === "daily.black_market").enabled,
    true,
  );
});
test("地图UI：点选只浏览，确认移动才保存；固定黑市能打开独立采购入口", async () => {
  const { JSDOM } = require("jsdom"),
    { createCityMapUI } = require("../src/ui/map/city-map.js"),
    { createLifecycle } = require("../src/ui/lifecycle.js");
  const dom = new JSDOM(
    '<details id="wxCityMap"><span id="wxCityPosition"></span><div id="wxCityCanvas"></div><div id="wxCityTabs"></div><div id="wxCityInfo"></div><p id="wxCityNotice"></p></details>',
  );
  const lifecycle = createLifecycle(dom.window);
  let opened = null;
  try {
    const h = host();
    await h.sync.newGame({});
    const ui = createCityMapUI({
      document: dom.window.document,
      window: dom.window,
      lifecycle,
      getGlue: () => ({ command: h.sync.mutate }),
      openAction: (id) => (opened = id),
      reportSyncError: () => {},
    });
    h.subscribe((s) => ui.render(s));
    ui.render(h.snap);
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll("g[data-place-id]").length, 41);
    assert.ok(doc.querySelectorAll(".wx-map-block").length > 30);
    assert.ok(doc.querySelector(".wx-map-water"));
    const beforeView = clone(h.state.game.save());
    doc.querySelector('[data-map-zoom="detail"]').click();
    assert.ok(
      doc.getElementById("wxCityCanvas").classList.contains("is-zoomed"),
    );
    doc.querySelector('[data-map-zoom="fit"]').click();
    assert.equal(
      doc.getElementById("wxCityCanvas").classList.contains("is-zoomed"),
      false,
    );
    assert.deepEqual(h.state.game.save(), beforeView);
    for (const id of layout.privatePlaces) {
      const node = doc.querySelector(`[data-place-id="${id}"]`);
      assert.ok(node.textContent.includes("未探明区域"));
      assert.equal(node.textContent.includes(places[id].name), false);
    }
    assert.equal(
      doc
        .querySelector('[data-place-id="black_market_c"]')
        .getAttribute("tabindex"),
      "-1",
    );

    doc.querySelector('[data-map-district="C"]').click();
    doc
      .querySelector('[data-place-id="black_market_c"]')
      .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    assert.equal(h.snap.cityMap.player.placeId, "player_base_b");
    doc.querySelector('[data-map-move="black_market_c"]').click();
    for (let n = 0; n < 10; n++) await new Promise((r) => setImmediate(r));
    assert.equal(h.snap.cityMap.player.placeId, "black_market_c");
    assert.equal(h.snap.dayPlan.remaining, 4);
    doc.querySelector("[data-map-market]").click();
    assert.equal(opened, "daily.black_market");
    assert.ok(
      doc
        .getElementById("wxCityPosition")
        .textContent.includes("目标位置：尚无目击记录"),
    );
  } finally {
    lifecycle.dispose();
    dom.window.close();
  }
});

test("空损坏地图字段不能冒充旧档缺字段；旧流程位置兼容不会补造目击", () => {
  const g = createGame({ ...defaultInit(), sessionSalt: "old-spatial" }),
    save = g.save();
  assert.throws(() => createGame({ saved: { ...save, spatial: null } }), {
    code: "SAVE_INVALID",
  });
  delete save.spatial;
  const old = createGame({ saved: save });
  assert.equal(old.snapshot().cityMap.player.assumed, true);
  assert.equal(old.snapshot().cityMap.target, null);
  assert.deepEqual(old.save().route, save.route);
  assert.deepEqual(old.save().ledgerState, save.ledgerState);
});

test("街区底图配置：道路与建筑在所属区内，地点短名覆盖真实地点且旧档按ID重新投影", () => {
  const art = require("../src/config/city-cartography.json");
  assert.deepEqual(
    Object.keys(art.landmarks).sort(),
    Object.keys(places).sort(),
  );
  for (const [id, data] of Object.entries(art.districts)) {
    const frame = layout.frames[id];
    assert.ok(data.blocks.length > 3 && data.roads.length > 2);
    for (const {
      box: [x, y, w, h],
    } of data.blocks) {
      assert.ok(
        x >= 0 &&
          y >= 0 &&
          w > 12 &&
          h > 12 &&
          x + w <= frame.width &&
          y + h <= frame.height,
      );
    }
    for (const road of data.roads) {
      assert.ok(road.width > 0 && road.points.length > 1);
      for (const [x, y] of road.points)
        assert.ok(x >= 0 && y >= 0 && x <= frame.width && y <= frame.height);
    }
  }
  const g = game();
  move(g, "black_market_c");
  const save = g.save(),
    before = clone(save);
  const restored = createGame({ saved: save }),
    node = restored
      .snapshot()
      .cityMap.nodes.find((n) => n.id === "black_market_c");
  assert.deepEqual(restored.save(), before);
  assert.equal(
    node.x,
    layout.frames.C.x + layout.coordinates.black_market_c[0],
  );
  assert.equal(
    node.y,
    layout.frames.C.y + layout.coordinates.black_market_c[1],
  );
});
