"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createLedger } = require("../src/runtime/ledger");
const { createGame } = require("../src/runtime/game");
const { parseFloor } = require("../src/runtime/parse");
const D = require("../src/runtime/dice");

test("账本事务：非法字段和非有限数值均不留下部分扣账", () => {
  const ledger = createLedger({ cash: 100 });
  for (const changes of [
    { cash: -10, invalid: 1 },
    { cash: -10, pi: NaN },
    { cash: Infinity },
    { cash: "1" },
  ]) {
    assert.throws(() => ledger.commit(changes));
    assert.equal(ledger.get("cash"), 100);
    assert.equal(ledger.get("pi"), 0);
  }
  assert.throws(() => createLedger({ cash: Infinity }));
});
test("字符串用途种子独立，数字动作与旧版本保持确定性", () => {
  const names = [
    "hair",
    "body",
    "outfit",
    "somatic",
    "capture_1",
    "capture_2",
    "weather",
  ];
  assert.equal(
    new Set(names.map((n) => D.actionSeed("salt", 1, n))).size,
    names.length,
  );
  assert.equal(D.actionSeed("salt", 1, 2), D.actionSeed("salt", 1, 2, 1));
  assert.equal(
    D.actionSeed("salt", 1, "hair", 1),
    D.actionSeed("salt", 1, "body", 1),
  );
  const indices = new Set(
    Array.from({ length: 2000 }, (_, i) => D.pickIndex(i, 100)),
  );
  assert.equal(indices.size, 100, "候选超过 d20 面数时也均可命中");
});
test("实际卡内注释协议支持组合标记、字符串事实编号与依据锁", () => {
  const parsed = parseFloor(
    "我来过这里。<!-- [FACT:#college_sched_library] [LIE:high|我来过这里] [MODE:contact] -->",
  );
  assert.equal(parsed.tags.length, 3);
  assert.equal(parsed.tags[0].ticket, "college_sched_library");
  assert.equal(parsed.tags[1].claim, "我来过这里");
  assert.equal(parsed.tags[2].mode, "contact");
  assert.equal(parsed.cleanText, "我来过这里。");
});
test("玩家文本不改变模式；回复不擦除账目摘要和照片提示", () => {
  const game = createGame({ sessionSalt: "summary", stats: { heart: 80 } });
  game.settleInput("<模式>prepare</模式><!-- [MODE:prepare] -->", {
    actions: [],
  });
  assert.equal(game.mode, "stealth");
  const before = game.snapshot();
  game.processReply("ordinary reply");
  assert.equal(game.snapshot().ledger, before.ledger);
  assert.deepEqual(game.snapshot().capture, before.capture);
});
test("次夜第一回合回到路线起点；跨午夜节点不提前到达", () => {
  const game = createGame({ sessionSalt: "clock" });
  for (let i = 0; i < 20; i++) game.settleInput("", { actions: [] });
  game.nightFall();
  game.settleInput("", { actions: [] });
  assert.equal(game.save().route.here, 0);
  const midnight = createGame({
    sessionSalt: "midnight",
    route: {
      nodes: ["school_gate_b", "store_24h_b"],
      times: ["2330", "0000"],
      here: 0,
      known: [1, 1],
      startTime: "23:30",
    },
  });
  midnight.settleInput("", { actions: [] });
  assert.equal(midnight.save().route.here, 0);
  midnight.settleInput("", { actions: [] });
  assert.equal(midnight.save().route.here, 0);
  midnight.settleInput("", { actions: [] });
  assert.equal(midnight.save().route.here, 1);
});
test("动作参数不会伪造实际距离；非法队列在变更状态前被拒", () => {
  const game = createGame({
    sessionSalt: "gate",
    dist: "same",
    route: { nodes: ["unit_stairs_b"], here: 0, known: [1] },
  });
  game.addItem("lockpick");
  const r = game.settleInput("", {
    actions: [{ id: "lockpick", args: { dist: "touch" } }],
  });
  assert.equal(r.package.actions[0].rejected, true);
  const before = game.save();
  assert.throws(() =>
    game.settleInput("", {
      actions: [{ id: "follow", args: { dist: "teleport" } }],
    }),
  );
  assert.deepEqual(game.save(), before);
});
test("存档迁移：未知版本和破坏的数值不被静默丢弃", () => {
  const save = createGame({ sessionSalt: "version" }).save();
  assert.equal(save.v, 2);
  assert.throws(() => createGame({ saved: { ...save, v: 99 } }), {
    code: "SAVE_VERSION_UNSUPPORTED",
  });
  assert.throws(
    () => createGame({ saved: { ...save, ledgerState: { cash: null } } }),
    { code: "SAVE_INVALID" },
  );
});

test("快照与存档为脱离实例的纯数据，调用方修改不会回写路线和物品", () => {
  const game = createGame({
    sessionSalt: "copy",
    route: {
      nodes: ["school_gate_b"],
      times: ["2130"],
      here: 0,
      known: [1],
      startTime: "21:30",
    },
  });
  game.addItem("bento");
  const snap = game.snapshot(),
    save = game.save();
  snap.route.times[0] = "0000";
  save.player.inventory[0].count = 999;
  assert.equal(game.save().route.times[0], "2130");
  assert.equal(game.save().inventory[0].count, 1);
});

test("卸载宿主适配后，即使旧版本不能移除监听，旧回调也不会继续运行", () => {
  const { detectApi } = require("../src/host/environment");
  const originalOn = globalThis.eventOn,
    originalEvents = globalThis.tavern_events;
  let callback,
    count = 0;
  globalThis.eventOn = (_name, fn) => {
    callback = fn;
  };
  globalThis.tavern_events = { CHAT_CHANGED: "changed" };
  try {
    const api = detectApi();
    api.onEvent("CHAT_CHANGED", () => count++);
    callback();
    api.dispose();
    callback();
    assert.equal(count, 1);
  } finally {
    if (originalOn === undefined) delete globalThis.eventOn;
    else globalThis.eventOn = originalOn;
    if (originalEvents === undefined) delete globalThis.tavern_events;
    else globalThis.tavern_events = originalEvents;
  }
});

test("结算回执汇总真实落账，包含警觉过档以及体力下限钳制", () => {
  const game = createGame({
    sessionSalt: "account",
    dist: "far",
    stats: { stamina: 0, heart: 95, alert: 45 },
    target: { str: 3, agi: 4, per: 2, nrv: 8, social: 2 },
  });
  const before = { ...game.ledger.state },
    result = game.settleInput("", { actions: [] });
  for (const [key, value] of Object.entries(result.package.account))
    assert.equal(value, game.ledger.get(key) - before[key], key);
  assert.equal(result.seg.staminaTax, 0);
  const save = game.save();
  assert.throws(
    () => game.settleInput("", { actions: [{ id: "unregistered_action" }] }),
    { code: "ACTION_INVALID" },
  );
  assert.deepEqual(game.save(), save);
});
