/**
 * 相册：取图与抽取规则（未拥有 × 距离角度 × 套装齐奖励）。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const A = require("../src/runtime/album.js");
const { createGame } = require("../src/runtime/game.js");

const persona = { hair: "long", body: "normal" };

test("远端拍不到：不进相册", () => {
  assert.deepEqual(A.anglesFor("far"), []);
  assert.equal(A.captureList(persona, [], "far").length, 0);
});

test("同街只有侧/背；身后与贴身有正/侧/背", () => {
  assert.deepEqual(A.anglesFor("same").sort(), ["back", "side"]);
  const same = A.captureList(persona, [], "same");
  assert.ok(same.every((c) => c.angle === "side" || c.angle === "back"));
  const close = A.captureList(persona, [], "close");
  assert.ok(close.some((c) => c.angle === "front"));
});

test("已拥有的不再出现", () => {
  const all = A.captureList(persona, [], "touch");
  const first = all[0];
  const left = A.captureList(persona, [first.key], "touch");
  assert.equal(left.length, all.length - 1);
  assert.ok(!left.some((c) => c.key === first.key));
});

test("取图路径：长发→long、其他发型→base、下装共用", () => {
  const head = A.WARDROBE.items.find((i) => i.slot === "head");
  const top = A.WARDROBE.items.find((i) => i.slot === "top");
  const bottom = A.WARDROBE.items.find((i) => i.slot === "bottom");
  assert.ok(A.fileOf(head, persona, "side").includes("/hair/long/"));
  assert.ok(A.fileOf(top, persona, "front").includes("/top/long/normal/"));
  assert.ok(
    A.fileOf(top, { hair: "bob", body: "slim" }, "front").includes(
      "/top/base/slim/",
    ),
  );
  assert.ok(A.fileOf(bottom, persona, "front").includes("/bottom/shared/"));
});

test("套装齐：四件都拍过给 +2，只给一次", () => {
  const set = A.WARDROBE.outfits.outfit_jk_uniform;
  const album = {
    [`${set.top}|front`]: {},
    [`${set.bottom}|front`]: {},
    [`${set.socks}|side`]: {},
    [`${set.shoes}|side`]: {},
  };
  const done = {};
  const first = A.setBonus(album, done);
  assert.equal(first.pi, 2);
  assert.deepEqual(first.outfits, ["outfit_jk_uniform"]);
  assert.equal(A.setBonus(album, done).pi, 0, "同一套不重复给");
});

test("capturePhoto：每次都是新的，且距离限角度", () => {
  const g = createGame({
    sessionSalt: "album-salt",
    targetPersona: { hair: "long", body: "normal", name: "测试" },
    stats: { heart: 30, stamina: 100, cash: 500, alert: 0, date: 1 },
    dist: "same",
    route: {
      id: "r",
      note: "",
      prompt: "",
      startTime: "21:30",
      nodes: ["school_gate_b"],
      times: ["2130"],
      known: [1],
      here: 0,
    },
  });
  const a = g.capturePhoto("same");
  assert.ok(a, "应拍到一张");
  assert.ok(a.angle === "side" || a.angle === "back");
  const b = g.capturePhoto("same");
  assert.ok(b && b.key !== a.key, "第二张必须不同");
  const total = g.albumTotal();
  assert.ok(total > 20);
  const snap = g.snapshot();
  assert.equal(snap.album.count, 2);
  assert.equal(snap.capture.key, b.key);
});

test("正式打量：成功收录一张当前装束的侧视图，相册与读档保留且不会重复", () => {
  const { defaultInit } = require("../src/host/initial-state");
  let g = createGame({ ...defaultInit(), sessionSalt: "tutorial-3" });
  const r = g.settleInput("", {
    actions: [{ id: "scan", name: "打量", args: {} }],
  });
  const cap = r.actions[0].capture;
  assert.equal(cap.source, "scan");
  assert.equal(cap.angle, "side");
  assert.ok(
    A.observationItems(g.snapshot().targetState.outfit).includes(
      cap.key.split("|")[0],
    ),
  );
  assert.equal(g.snapshot().album.count, 1);
  assert.ok(g.snapshot().album.catalog.some((c) => c.key === cap.key));
  const saved = g.save();
  g = createGame({ saved });
  assert.deepEqual(g.save().album, saved.album);
  const next = g.capturePhoto("same", {
    angle: "side",
    items: A.observationItems(g.snapshot().targetState.outfit),
    source: "scan",
  });
  assert.ok(next && next.key !== cap.key);
  assert.equal(
    g.capturePhoto("same", {
      angle: "side",
      items: A.observationItems(g.snapshot().targetState.outfit),
      source: "scan",
    }),
    null,
  );
});
test("打量失败、已跟丢、远端均不凭空取得侧图；未知服装不使用其他款式", () => {
  const { defaultInit } = require("../src/host/initial-state");
  const fail = createGame({ ...defaultInit(), sessionSalt: "tutorial-4" });
  assert.ok(
    !fail.settleInput("", { actions: [{ id: "scan", name: "打量", args: {} }] })
      .actions[0].capture,
  );
  assert.equal(fail.snapshot().album.count, 0);
  const far = createGame({
    ...defaultInit(),
    sessionSalt: "tutorial-3",
    dist: "far",
  });
  far.settleInput("", { actions: [{ id: "scan", name: "打量", args: {} }] });
  assert.equal(far.snapshot().album.count, 0);
  const saved = createGame({
    ...defaultInit(),
    sessionSalt: "tutorial-3",
  }).save();
  saved.spatial.tracking = "lost";
  const lost = createGame({ saved });
  const r = lost.settleInput("", {
    actions: [{ id: "scan", name: "打量", args: {} }],
  });
  assert.equal(r.actions[0].rejected, true);
  assert.equal(lost.snapshot().album.count, 0);
  assert.deepEqual(
    A.observationItems({ id: "unknown", shoeId: "unknown" }),
    [],
  );
});
test("侧图内嵌资源覆盖所有登记变体，实际收录可直接显示，无需外部图包", () => {
  const { photoSource } = require("../src/ui/photo-source");
  for (const hair of ["long", "bob", "ponytail", "twintails"])
    for (const body of ["slim", "normal", "full"])
      for (const c of A.captureList({ hair, body }, [], "same").filter(
        (c) => c.angle === "side",
      ))
        assert.ok(
          photoSource(c.file).startsWith("data:image/jpeg;base64,"),
          c.file,
        );
});

test("观察侧图随聊天路径回滚恢复，重复结算不重复发图", async () => {
  const { createChatSync } = require("../src/host/chat-sync/controller");
  const { defaultInit } = require("../src/host/initial-state");
  const store = {},
    state = { game: null, conf: { autoSettle: false } };
  const history = [{ id: 0, role: "assistant", text: "opening" }];
  const sync = createChatSync({
    state,
    createGame,
    defaultInit,
    vars: {
      read: async () => structuredClone(store),
      assign: async (p) => Object.assign(store, structuredClone(p)),
    },
    readContext: async () => ({
      scope: "scan-test",
      history: structuredClone(history),
    }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: () => {},
  });
  try {
    await sync.newGame({ ...defaultInit(), sessionSalt: "tutorial-crit-95" });
    history.push({ id: 1, role: "user", text: "观察" });
    const req = {
      messageId: 1,
      text: "观察",
      actions: [{ id: "scan", name: "打量", args: {} }],
    };
    await sync.runInput(req);
    const first = structuredClone(store.wx_save.album);
    const knowledge = structuredClone(store.wx_save.targetKnowledge);
    assert.deepEqual(state.game.snapshot().profile.attrs, {per:4});
    assert.equal(Object.keys(first).length, 1);
    await sync.runInput(req);
    assert.deepEqual(store.wx_save.album, first);
    assert.deepEqual(store.wx_save.targetKnowledge, knowledge);
    history[1].text = "另一个分支";
    await sync.reconcile();
    assert.equal(state.game.snapshot().album.count, 0);
    assert.deepEqual(state.game.snapshot().profile.attrs, {});
    history[1].text = "观察";
    await sync.reconcile();
    assert.deepEqual(state.game.save().album, first);
    assert.deepEqual(state.game.snapshot().profile.attrs, {per:4});
  } finally {
    sync.dispose();
  }
});
