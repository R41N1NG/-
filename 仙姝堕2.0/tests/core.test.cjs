"use strict";
const { test } = require("node:test");
const { startingInventoryFor } = require("../src/runtime/starting_inventory");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const ROOT = path.join(__dirname, ".."),
  data = require("../tools/data.cjs").load(ROOT),
  C = require("../src/runtime/contracts"),
  { createDispatcher } = require("../src/runtime/dispatcher"),
  { createWorldbookHost, evaluateGate } = require("../src/host/worldbook");
function harness(runtimeData = data) {
  let c = {
      chatId: "a",
      branchId: "a",
      metadata: {},
      chat: [{ mes: "<IdentityMenu/>", is_user: false, vars: {} }],
    },
    generating = false,
    aborted = false,
    fail = false,
    confirmed = true;
  const sent = [],
    prompts = [];
  const adapter = {
    context: () => c,
    readMessage: async (i) =>
      C.clone(c.chat[i]?.variables?.[c.chat[i]?.swipe_id ?? 0] || {}),
    persist: async (ctx, e) => {
      assert.equal(ctx.chatId, c.chatId);
      const m = c.chat[ctx.floor];
      m.variables ??= [];
      m.variables[m.swipe_id ?? 0] = {
        stat_data: { ...C.clone(e.state.stat_data), xsd2: [C.clone(e)] },
      };
    },
    setPrompt: (x) => prompts.push(x),
    preflightSend: () => {
      if (generating) throw Error("busy");
    },
    isGenerating: () => generating,
    isAborted: () => aborted,
    confirmExit: async () => confirmed,
    send: async (text) => {
      if (fail) throw Error("send failed");
      sent.push(text);
      c.chat.push({ mes: text, is_user: true });
    },
    replaceStory: async (i, text) => {
      c.chat[i].mes = text;
    },
    replaceOpening: async (text) => {
      c.chat[0].mes = text;
    },
    syncIdentity: async () => {},
    report: () => {},
  };
  const r = createDispatcher(adapter, runtimeData),
    opening = (identity) =>
      r.dispatchIntent({ type: "SELECT_IDENTITY", payload: { identity } }),
    reply = (text) => {
      c.chat.push({ mes: text, is_user: false, swipe_id: 0 });
      return r.settleStory();
    },
    select = (nodeId = "enter", payload = {}) => {
      const s = r.getSnapshot();
      return r.dispatchIntent({
        type: "SELECT_NODE",
        pluginId: "test",
        expected: {
          chatId: s.chatId,
          branchId: s.branchId,
          revision: s.revision,
          floor: s.floor,
        },
        payload: { nodeId, ...payload },
      });
    };
  return {
    r,
    adapter,
    sent,
    prompts,
    opening,
    reply,
    select,
    get c() {
      return c;
    },
    set c(v) {
      c = v;
    },
    generating: (v) => (generating = v),
    aborted: (v) => (aborted = v),
    fail: (v) => (fail = v),
    confirm: (v) => (confirmed = v),
  };
}
const status = (fields = {}, prose = "山风拂过山谷。") =>
  prose +
  "\n<Status_block>" +
  Object.entries({
    时间: "仙盟历 9999年1月1日",
    身份: "魂欢殿主",
    历时: "—",
    ...fields,
  })
    .map(([k, v]) => "<" + k + ">" + v + "</" + k + ">")
    .join("") +
  "</Status_block>";
function plugin() {
  return {
    id: "test",
    select(s, id) {
      if (id === "enter")
        return {
          id,
          actionText: "进入幽寂谷",
          prompt: "仅描写进入，不提前进入洞府。",
          identities: ["赵无忧"],
          open: { year: 1578, month: 3, day: 1 },
          close: { year: 1578, month: 4, day: 30 },
          reservedState: { step: "pending" },
        };
      if (id === "exit")
        return {
          id,
          actionText: "离开幽寂谷",
          prompt: "描写离开",
          exitDays: 2,
          rewards: ["草药"],
          grantsKnown: ["离开幽寂谷"],
        };
      if (id === "ttl")
        return {
          id,
          actionText: "探索山涧",
          prompt: "描写探索",
          ttl: 2,
          openedAt: 0,
        };
      return null;
    },
    settle(s, p, body) {
      if (p.nodeId === "exit")
        return {
          outcome: "success",
          activeEvent: null,
          elapsedDays: 2,
          rewards: [{ name: "草药", count: 1 }],
          known: ["离开幽寂谷"],
        };
      return {
        outcome: "success",
        pluginState: { step: "fork" },
        activeEvent: {
          id: "test",
          pluginId: "test",
          place: "幽寂谷·谷口",
          step: "fork",
        },
      };
    },
  };
}
test("六套源开局，19字段不删，身份日期及起手门禁一致", async () => {
  assert.equal(C.XML_FIELDS.length, 19);
  for (const name of Object.keys(data.greetings)) {
    if (name === "自设") continue;
    const h = harness();
    await h.opening(name);
    const s = h.r.getSnapshot();
    assert.equal(s.identity, name);
    assert.equal(s.calendarDate.month, name === "赵无忧" ? 3 : 8);
    assert.equal(s.calendarDate.day, name === "赵无忧" ? 3 : 1);
    assert.equal(s.known.天姝会存在, name !== "赵无忧");
    assert.equal(s.known.极乐引入手, name !== "赵无忧");
    assert.deepEqual(s.inventory, startingInventoryFor(name));
    for (const k of C.XML_FIELDS)
      assert.ok(C.parseStatus(h.c.chat[0].mes).fields[k] !== undefined, k);
  }
});
test("自设要求完整入世字段，不虚构统一开局", async () => {
  const h = harness();
  await assert.rejects(h.opening("自设"), /填写/);
  await h.r.dispatchIntent({
    type: "SELECT_IDENTITY",
    payload: {
      identity: "自设",
      custom: {
        name: "测试",
        realm: "筑基初期",
        date: { year: 1580, month: 2, day: 30 },
        place: "玩家自定",
      },
    },
  });
  assert.deepEqual(h.r.getSnapshot().calendarDate, {
    year: 1580,
    month: 2,
    day: 30,
  });
  assert.equal(h.r.getSnapshot().stat_data.自设.name, "测试");
});
test("点击仅登记待执行并强制发送，模型完成前不进入下一节点", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  await h.select("enter", { actionText: "伪造", ttl: 99 });
  assert.match(h.sent[0], /^XSD2_enter_[a-f0-9]{8}$/);
  assert.equal(h.r.getSnapshot().activeEvent, null);
  assert.ok(h.r.getSnapshot().pending);
  await assert.rejects(h.select("enter"), /未完成/);
  await h.reply(status({}, "你走入幽寂谷，停在谷口。"));
  assert.equal(h.r.getSnapshot().activeEvent.step, "fork");
  assert.equal(h.r.getSnapshot().stat_data.地点, "幽寂谷·谷口");
  assert.equal(h.r.getSnapshot().identity, "赵无忧");
  assert.equal(h.r.getSnapshot().calendarDate.year, 1578);
});
test("旧revision、身份、日期、TTL和插件奖励越权均拒绝", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  const s = h.r.getSnapshot();
  await h.r.dispatchIntent({ type: "GM_PATCH", payload: { 段位: 3 } });
  await assert.rejects(
    h.r.dispatchIntent({
      type: "SELECT_NODE",
      pluginId: "test",
      expected: s,
      payload: { nodeId: "enter" },
    }),
    /旧状态/,
  );
  await h.r.dispatchIntent({
    type: "GM_PATCH",
    payload: { identity: "浊龙殿主" },
  });
  await assert.rejects(h.select("enter"), /身份/);
  await h.r.dispatchIntent({
    type: "GM_PATCH",
    payload: {
      identity: "赵无忧",
      calendarDate: { year: 1578, month: 5, day: 1 },
    },
  });
  await assert.rejects(h.select("enter"), /日期/);
});
test("取消退出无写入，确认后一次结算2日且不重复发奖扣时", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  h.confirm(false);
  const revision = h.r.getSnapshot().revision;
  assert.deepEqual(await h.select("exit"), { cancelled: true });
  assert.equal(h.r.getSnapshot().revision, revision);
  h.confirm(true);
  await h.select("exit");
  await h.reply(
    status(
      { 历时: "二日", 纳戒: "获得：草药×1" },
      "你获得草药，收起草药后离开幽寂谷。",
    ),
  );
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  assert.equal(h.r.getSnapshot().inventory.find(x => x.name === "草药").count, 1);
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  assert.equal(h.r.getSnapshot().inventory.find(x => x.name === "草药").count, 1);
});
test("发送失败恢复；停止并删助手楼后节点可重选；删用户楼亦恢复", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  h.fail(true);
  await assert.rejects(h.select(), /send failed/);
  assert.equal(h.r.getSnapshot().pending, null);
  h.fail(false);
  await h.select();
  h.c.chat.push({ mes: "未完成的片段", is_user: false });
  h.aborted(true);
  await h.r.stop();
  h.c.chat.pop();
  await h.r.restore();
  assert.equal(h.r.getSnapshot().pending, null);
  h.c.chat.pop();
  await h.r.restore();
  assert.equal(h.r.getSnapshot().pending, null);
  await h.select();
  assert.ok(h.r.getSnapshot().pending);
});
test("生成中及停止片段不结算", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  await h.select();
  h.generating(true);
  await h.reply(status());
  assert.ok(h.r.getSnapshot().pending);
  h.generating(false);
  h.aborted(true);
  await h.r.settleStory();
  assert.ok(h.r.getSnapshot().pending);
});
test("刷新、分支复制、删楼与回复候选分别恢复各自快照", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  await h.select("exit");
  await h.reply(status({}, "你离开幽寂谷。"));
  const floor = h.c.chat.length - 1,
    original = C.clone(h.c.chat[floor]);
  h.c.chat[floor].swipe_id = 1;
  h.c.chat[floor].mes = status({}, "你停在原处。");
  await h.r.restore();
  assert.ok(h.r.getSnapshot().pending);
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().inventory.find(x => x.name === "草药").count, 1);
  h.c.chat[floor] = original;
  await h.r.restore();
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  h.c = { ...C.clone(h.c), chatId: "branch", branchId: "branch" };
  await h.r.restore();
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  h.c.chat.splice(1);
  await h.r.restore();
  assert.equal(h.r.getSnapshot().calendarDate.day, 3);
  assert.deepEqual(h.r.getSnapshot().inventory, startingInventoryFor("赵无忧"));
});
test("正文库存实证、消耗及普通历时推进；GM保留人工优先并可释放", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.reply(
    status({ 纳戒: "获得：草药×2", 历时: "三日" }, "你取得草药，收入纳戒。"),
  );
  assert.equal(h.r.getSnapshot().inventory.find(x => x.name === "草药").count, 2);
  assert.equal(h.r.getSnapshot().calendarDate.day, 6);
  h.c.chat.push({ mes: "使用草药", is_user: true });
  await h.reply(status({ 纳戒: "消耗：草药×1" }, "你服下草药。"));
  assert.equal(h.r.getSnapshot().inventory.find(x => x.name === "草药").count, 1);
  await h.r.dispatchIntent({
    type: "GM_PATCH",
    payload: {
      "known.进入幽寂谷": false,
      inventory: [{ id: "人工", name: "人工", count: 3 }],
    },
  });
  h.c.chat.push({ mes: "继续", is_user: true });
  await h.reply(
    status(
      { 实际发生: "进入幽寂谷", 纳戒: "获得：草药×1" },
      "你进入幽寂谷，取得草药。",
    ),
  );
  assert.equal(h.r.getSnapshot().known.进入幽寂谷, false);
  assert.equal(h.r.getSnapshot().inventory[0].name, "人工");
  await h.r.dispatchIntent({
    type: "GM_RELEASE",
    payload: { keys: ["known.进入幽寂谷", "inventory"] },
  });
  assert.deepEqual(h.r.getSnapshot().manual, {});
});
test("否定、计划与仅状态申报不构成物品及名器实证；计数不能自行晋阶", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.reply(
    status(
      {
        纳戒: "获得：草药×1",
        实际发生: "九幽玄阴穴四阶段",
        名器互动: "九幽玄阴穴｜赵无忧｜内射",
      },
      "你尚未得到草药。孤月没有参与此事。",
    ),
  );
  assert.deepEqual(h.r.getSnapshot().inventory, startingInventoryFor("赵无忧"));
  assert.equal(h.r.getSnapshot().known.九幽玄阴穴四阶段, false);
  assert.deepEqual(h.r.getSnapshot().relics, {});
  const R = data.rules({}),
    a = R.parseRelicAction("九幽玄阴穴｜赵无忧｜内射");
  assert.equal(
    R.validateRelicAction(
      a,
      "孤月没有发生内射。",
      { 九幽玄阴穴成形: true },
      "赵无忧",
    ).ok,
    false,
  );
});
test("快照不可反向修改内核；插件生命周期取消订阅", async () => {
  const h = harness();
  await h.opening("赵无忧");
  const s = h.r.getSnapshot();
  s.inventory.push({ name: "伪造" });
  s.calendarDate.year = 9999;
  assert.deepEqual(h.r.getSnapshot().inventory, startingInventoryFor("赵无忧"));
  assert.equal(h.r.getSnapshot().calendarDate.year, 1578);
  let n = 0;
  const off = h.r.subscribe(() => n++);
  await h.r.dispatchIntent({ type: "GM_PATCH", payload: { 段位: 2 } });
  assert.equal(n, 1);
  off();
  await h.r.dispatchIntent({ type: "GM_PATCH", payload: { 段位: 3 } });
  assert.equal(n, 1);
});
test("世界书限当前primary，不触碰追加书、他卡及同名正式书；所有迁入闸门可判定", async () => {
  let written;
  const h = createWorldbookHost(
    {
      getCharWorldbookNames: () => ({
        primary: "独立2.0",
        additional: ["共享书"],
      }),
      getWorldbook: async (name) => {
        assert.equal(name, "独立2.0");
        return [
          { name: "【身份】赵无忧", enabled: false },
          { name: "【身份】魂欢殿主", enabled: true },
          { name: "普通", enabled: true },
        ];
      },
      replaceWorldbook: async (name, entries) => (written = { name, entries }),
    },
    () => ({}),
  );
  await h.synchronize("赵无忧");
  assert.equal(written.name, "独立2.0");
  assert.deepEqual(
    written.entries.map((x) => x.enabled),
    [true, false, true],
  );
  const book = JSON.parse(
    fs.readFileSync(path.join(ROOT, "仙姝堕-世界书.json")),
  );
  for (const e of Object.values(book.entries)) {
    const line = e.content.split("\n")[0];
    if (!line.startsWith("@@if ")) continue;
    const expr = line.slice(5);
    for (const stat of [
      { 身份: "赵无忧", known: {}, 仙盟历: 1578.03 },
      {
        身份: "魂欢殿主",
        known: Object.fromEntries(
          data.rules({}).ALL_FIELDS.map((k) => [k, true]),
        ),
        仙盟历: 1579.04,
      },
    ]) {
      const expected = vm.runInNewContext(expr, {
        variables: { stat_data: stat },
      });
      assert.equal(evaluateGate(e.content, stat), expected, e.comment);
    }
  }
});
test("HUD 17槽位、三面板默认收起、本地图链缺图降级及对比度", () => {
  const { CSS, PALETTE, portrait } = require("../src/ui/status_panel"),
    source = fs.readFileSync(path.join(ROOT, "src/ui/status_panel.js"), "utf8");
  assert.ok(source.includes('data-xsd-slot="map"'));
  assert.ok(source.includes('data-xsd-slot="17"'));
  assert.equal((source.match(/<details(?:\s[^>]*)?>/g) || []).length, 3);
  assert.ok(!source.includes("<details open"));
  assert.ok(source.includes("img.onerror"));
  assert.ok(
    portrait("孤月", { stat_data: {}, known: {} }, data).small.endsWith(
      "guyue.png",
    ),
  );
  function lum(hex) {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16) / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  for (const color of [PALETTE.foreground, PALETTE.muted, PALETTE.accent])
    assert.ok((lum(color) + 0.05) / (lum(PALETTE.background) + 0.05) >= 4.5);
  assert.ok(CSS.includes("focus-visible"));
});
test("构建可独立执行、脚本语法、PNG双向回读及世界书防递归", () => {
  const { build, unpack } = require("../build"),
    built = build();
  new vm.Script(built.script);
  assert.deepEqual(unpack(built.image), built.card);
  assert.equal(built.card.data.character_book.entries.length, 234 + Object.keys(require("../src/config/node_stories.json")).length + Object.values(require("../tools/data.cjs").load(ROOT).characterProfiles).reduce((n,c)=>n+c.stages.reduce((m,x)=>m+(x.stories ? Object.keys(x.stories).length : (x.story ? 1 : 0)),0),0) + Object.keys(require("../src/config/metric_events.json")).length + Object.keys(require("../src/config/area_backgrounds.json")).length);
  assert.ok(
    built.card.data.character_book.entries.every(
      (e) => e.extensions.exclude_recursion && e.extensions.prevent_recursion,
    ),
  );
  assert.equal(
    built.card.data.extensions.tavern_helper.scripts[0].enabled,
    true,
  );
});
test("TTL按已完成故事轮次检查，连续用户消息不额外扣轮次", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin(plugin());
  await h.reply(status());
  h.c.chat.push({ mes: "继续", is_user: true });
  await h.reply(status());
  await assert.rejects(h.select("ttl"), /过期/);
  assert.equal(h.r.getSnapshot().storyCount, 2);
});
test("插件不能通过结果取得未配置物品、事实及耗时", async () => {
  for (const result of [
    { outcome: "success", rewards: [{ name: "未配置宝物" }] },
    { outcome: "success", known: ["未配置事实"] },
    { outcome: "success", elapsedDays: 3 },
  ]) {
    const h = harness();
    await h.opening("赵无忧");
    h.r.registerPlugin({ ...plugin(), settle: () => result });
    await h.select("exit");
    await assert.rejects(h.reply(status()), /未配置|不符合/);
    assert.ok(h.r.getSnapshot().pending);
    assert.deepEqual(h.r.getSnapshot().inventory, startingInventoryFor("赵无忧"));
  }
});
test("换聊天立即隐藏旧快照；新聊天不继承前一角色GM数据", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.r.dispatchIntent({ type: "GM_PATCH", payload: { 段位: 16 } });
  h.c = { chatId: "new", chat: [{ mes: "<IdentityMenu/>" }], metadata: {} };
  assert.equal(h.r.getSnapshot(), null);
  await h.r.ready();
  assert.equal(h.r.getSnapshot(), null);
  await h.opening("赵无忧");
  assert.equal(h.r.getSnapshot().stat_data.段位, 1);
});
test("人工回锁到未成形压过已有归属兜底及后续自动判定", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.r.dispatchIntent({
    type: "GM_PATCH",
    payload: { "owner.jiuyou": "赵无忧", "relicStage.jiuyou": 4 },
  });
  assert.equal(
    data
      .rules(h.r.getSnapshot().stat_data)
      .getRelicStage("jiuyou", h.r.getSnapshot().known),
    4,
  );
  await h.r.dispatchIntent({
    type: "GM_PATCH",
    payload: { "relicStage.jiuyou": 0 },
  });
  let s = h.r.getSnapshot();
  assert.equal(data.rules(s.stat_data).getRelicStage("jiuyou", s.known), 0);
  h.c.chat.push({ mes: "继续", is_user: true });
  await h.reply(
    status(
      { 实际发生: "九幽玄阴穴四阶段", 名器互动: "九幽玄阴穴｜赵无忧｜内射" },
      "孤月并未参加。",
    ),
  );
  s = h.r.getSnapshot();
  assert.equal(data.rules(s.stat_data).getRelicStage("jiuyou", s.known), 0);
});
test("名器迁入规则计数达标仅ready，缺少质变不自动升阶", () => {
  const stat = { 身份: "赵无忧", known: { 九幽玄阴穴成形: true } },
    R = data.rules(stat),
    a = R.parseRelicAction("九幽玄阴穴｜赵无忧｜内射"),
    validated = R.validateRelicAction(
      a,
      "孤月参与，内射事实已经发生。",
      stat.known,
      "赵无忧",
    );
  assert.equal(validated.ok, true);
  let p = {};
  for (let floor = 1; floor <= 3; floor++)
    p = R.calcRelicProgress(
      p,
      { ...a, ...validated },
      floor,
      0,
      "h" + floor,
      stat.known,
    );
  assert.equal(p.jiuyou.ready, true);
  assert.equal(R.getRelicStage("jiuyou", stat.known), 1);
  assert.equal(
    R.hasRelicPhysiologicalResponse("jiuyou", "孤月静静坐着。"),
    false,
  );
});
test("订阅中卸载并新增插件订阅只通知原始订阅集合", async () => {
  const h = harness();
  await h.opening("赵无忧");
  let calls = 0,
    off = () => {};
  const f = () => {
    calls++;
    off();
    off = h.r.subscribe(f);
  };
  off = h.r.subscribe(f);
  await h.r.dispatchIntent({ type: "GM_PATCH", payload: { 段位: 2 } });
  assert.equal(calls, 1);
  off();
});
test("退出确认期间或持久化期间切聊天不能把原行动发送到新聊天", async () => {
  for (const phase of ["confirm", "persist"]) {
    const h = harness();
    await h.opening("赵无忧");
    h.r.registerPlugin(plugin());
    const switchChat = () => {
      h.c = {
        chatId: "other",
        chat: [{ mes: "<IdentityMenu/>" }],
        metadata: {},
      };
    };
    if (phase === "confirm")
      h.adapter.confirmExit = async () => {
        switchChat();
        return true;
      };
    else
      h.adapter.syncState = async (s) => {
        if (s.pending) switchChat();
      };
    await assert.rejects(h.select("exit"), /变化/);
    assert.deepEqual(h.sent, []);
    assert.equal(h.r.getSnapshot(), null);
  }
});
test("插件等待异步证据期间停止，返回成功也不结算", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.r.registerPlugin({
    ...plugin(),
    settle: async () => {
      h.aborted(true);
      return { outcome: "success", elapsedDays: 2 };
    },
  });
  await h.select("exit");
  const result = await h.reply(status());
  assert.deepEqual(result, { deferred: true });
  assert.equal(h.r.getSnapshot().calendarDate.day, 3);
  assert.ok(h.r.getSnapshot().pending);
});
test("普通纳戒也不把旁人取得记给玩家", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.reply(status({ 纳戒: "获得：草药×1" }, "你看见孤月取得草药。"));
  assert.deepEqual(h.r.getSnapshot().inventory, startingInventoryFor("赵无忧"));
});
test("测试卡误绑正式书会拒绝同步，不改正式世界书", async () => {
  let written = false;
  const h = createWorldbookHost(
    {
      getCharWorldbookNames: () => ({ primary: "正式世界书" }),
      getWorldbook: async () => [],
      replaceWorldbook: async () => (written = true),
    },
    () => ({}),
    { expectedName: "仙姝堕2.0·框架测试" },
  );
  await assert.rejects(h.synchronize("赵无忧"), /独立同名/);
  assert.equal(written, false);
});
test("部署只更新独立测试文件并备份旧成品；正式卡文件不变", () => {
  const base = path.join(ROOT, "work");
  fs.mkdirSync(base, { recursive: true });
  const dir = fs.mkdtempSync(path.join(base, "deploy-"));
  for (const folder of ["characters", "worlds"])
    fs.mkdirSync(path.join(dir, folder));
  const name = "仙姝堕2.0·框架测试",
    target = path.join(dir, "characters", name + ".png"),
    formal = path.join(dir, "characters", "仙姝堕.png");
  fs.writeFileSync(target, "old-test-card");
  fs.writeFileSync(formal, "formal-unchanged");
  const old = process.env.XSD2_TAVERN_USER_DIR;
  process.env.XSD2_TAVERN_USER_DIR = dir;
  try {
    require("../deploy_to_tavern.cjs").deploy();
    assert.ok(
      fs
        .readFileSync(target)
        .equals(fs.readFileSync(path.join(ROOT, "最新角色卡", name + ".png"))),
    );
    assert.equal(fs.readFileSync(formal, "utf8"), "formal-unchanged");
    const stamp = fs.readdirSync(path.join(dir, "backups", "xsd2"))[0];
    assert.equal(
      fs.readFileSync(
        path.join(dir, "backups", "xsd2", stamp, name + ".png"),
        "utf8",
      ),
      "old-test-card",
    );
  } finally {
    if (old === undefined) delete process.env.XSD2_TAVERN_USER_DIR;
    else process.env.XSD2_TAVERN_USER_DIR = old;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("缺少旧快照的现有聊天：生成恢复从真实开局重建身份并持久化在0楼", async () => {
  const h = harness();
  h.c.chat[0].mes = data.greetings.赵无忧;
  h.c.chat.push({mes:"推进剧情",is_user:true});
  await h.r.replay();
  assert.equal(h.r.getSnapshot()?.identity, "赵无忧");
  assert.equal(h.r.getSnapshot().calendarDate.month, 3);
  assert.equal(h.c.chat[0].variables?.[0]?.stat_data.xsd2[0].state.identity, "赵无忧");
  const result = await h.reply("山风依旧。<Status_block><实际发生>观察</实际发生></Status_block>");
  assert.equal(result.identity, "赵无忧");
  h.c.chat.splice(1);
  await h.r.restore();
  assert.equal(h.r.getSnapshot()?.identity, "赵无忧");
  h.c.chat[0].mes = "<IdentityMenu/>";
  h.c.chat[0].swipe_id = 1;
  h.c.chat.push({mes:"推进剧情",is_user:true});
  await h.r.replay();
  assert.equal(h.r.getSnapshot(), null);
});


test("纳戒流水只显示实际变动：虚报/缺货/过量不显示，真实扣减后下一楼清空", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.reply(status({纳戒:"消耗：醉春风×1"}, "你来到谷口。"));
  assert.ok(!h.r.getSnapshot().stat_data.纳戒?.includes("消耗"));
  assert.equal(C.parseStatus(h.c.chat.at(-1).mes).fields.纳戒, "无");
  await h.reply(status({纳戒:"消耗：无此物×1"}, "你使用无此物。"));
  assert.ok(!h.r.getSnapshot().stat_data.纳戒?.includes("消耗"));
  await h.r.dispatchIntent({type:"GM_PATCH",payload:{inventory:[{id:"酒",name:"醉春风",count:2}]}});
  await h.r.dispatchIntent({type:"GM_RELEASE",payload:{keys:["inventory"]}});
  await h.reply(status({纳戒:"消耗：醉春风×9"}, "你喝掉醉春风。"));
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 2);
  assert.ok(!h.r.getSnapshot().stat_data.纳戒?.includes("消耗"));
  await h.reply(status({纳戒:"消耗：醉春风×1"}, "你喝掉醉春风。"));
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 1);
  assert.equal(h.r.getSnapshot().stat_data.纳戒, "消耗：醉春风×1");
  await h.reply(status({}, "你收好行囊。"));
  assert.ok(!h.r.getSnapshot().stat_data.纳戒?.includes("消耗"));
});


test("新开局起手行囊与保存余额隔离：六身份配置，重载不补领已消耗物品", async () => {
  assert.equal(startingInventoryFor("赵无忧").find(x => x.name === "醉春风").count, 2);
  assert.ok(startingInventoryFor("自设").some(x => x.name === "《极乐引》残篇"));
  for (const identity of ["焚欲殿主","欢喜殿主","浊龙殿主","魂欢殿主"])
    assert.ok(startingInventoryFor(identity).some(x => x.name === "天姝令"));
  const h = harness();
  await h.opening("赵无忧");
  await h.reply(status({纳戒:"消耗：醉春风×1"}, "你喝掉醉春风。"));
  await h.r.ready();
  assert.equal(h.r.getSnapshot().inventory.find(x => x.name === "醉春风").count, 1);
  assert.ok(!h.r.getSnapshot().inventory.some(x => x.name === "草药"));
});


test("消耗品使用自动扣一，最后一份移除，模型重复扣减及重生成不叠加", async () => {
  const h = harness();
  await h.opening("赵无忧");
  const use = () => h.r.dispatchIntent({type:"USE_ITEM",payload:{id:"醉春风"}});
  await use();
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 1);
  assert.ok(h.prompts.at(-1).includes("物品介绍：酒"));
  assert.ok(h.prompts.at(-1).includes("后台已经扣除1份"));
  await h.reply(status({纳戒:"消耗：醉春风×1"}, "你喝下醉春风。"));
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 1);
  h.c.chat.at(-1).swipe_id = 1;
  h.c.chat.at(-1).mes = status({纳戒:"消耗：醉春风×1"}, "你慢慢饮用。" );
  await h.r.replay();
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 1);
  await use();
  assert.ok(!h.r.getSnapshot().inventory.some(x=>x.name==="醉春风"));
  await h.reply(status({}, "你收好空酒器。"));
  await assert.rejects(use(), /物品不在/);
});

test("非消耗物品使用不扣数，说明和效果明确注入，模型消耗申报不改数量", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.r.dispatchIntent({type:"GM_PATCH",payload:{inventory:[{id:"图",name:"幽寂谷地图",count:1,consumable:false,description:"谷内路线残图",effect:"只用于阅读谷内路线",useMode:"send"}]}});
  await h.r.dispatchIntent({type:"USE_ITEM",payload:{id:"图"}});
  assert.ok(h.prompts.at(-1).includes("谷内路线残图"));
  assert.ok(h.prompts.at(-1).includes("只用于阅读谷内路线"));
  assert.ok(h.prompts.at(-1).includes("本次使用不扣数量"));
  await h.reply(status({纳戒:"消耗：幽寂谷地图×1"}, "你使用幽寂谷地图。"));
  assert.equal(h.r.getSnapshot().inventory[0].count, 1);
  assert.equal(h.r.getSnapshot().stat_data.纳戒, "使用：幽寂谷地图×1");
});

test("消耗品发送失败/停止删楼一起恢复数量，旧库存补类型不补领数量", async () => {
  const h = harness();
  await h.opening("赵无忧");
  h.fail(true);
  await assert.rejects(h.r.dispatchIntent({type:"USE_ITEM",payload:{id:"醉春风"}}), /send failed/);
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 2);
  h.fail(false);
  await h.r.dispatchIntent({type:"USE_ITEM",payload:{id:"醉春风"}});
  await h.r.stop();
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 2);
  h.c.chat.pop();
  await h.r.restore();
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count, 2);
  assert.equal(h.r.getSnapshot().pending, null);
});


test("丢弃是本地操作：扣1持久化，不发送、不计轮次/时间，不产生pending", async () => {
  const h = harness();
  await h.opening("赵无忧");
  const before = h.r.getSnapshot(), floors = h.c.chat.length, sent = h.sent.length;
  h.fail(true);
  await h.r.dispatchIntent({type:"DISCARD_ITEM",payload:{id:"墨山道佩剑"}});
  assert.ok(!h.r.getSnapshot().inventory.some(x=>x.name==="墨山道佩剑"));
  assert.equal(h.sent.length,sent);
  assert.equal(h.c.chat.length,floors);
  assert.equal(h.r.getSnapshot().pending,null);
  assert.equal(h.r.getSnapshot().storyCount,before.storyCount);
  assert.deepEqual(h.r.getSnapshot().calendarDate,before.calendarDate);
  await h.r.restore();
  assert.ok(!h.r.getSnapshot().inventory.some(x=>x.name==="墨山道佩剑"));
  await h.r.dispatchIntent({type:"DISCARD_ITEM",payload:{id:"醉春风"}});
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="醉春风").count,1);
  h.generating(true);
  await assert.rejects(h.r.dispatchIntent({type:"DISCARD_ITEM",payload:{id:"醉春风"}}), /请等/);
});

test("查看地图不发送；交谈/自由行动填入，观察才发送", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.r.dispatchIntent({type:"GM_PATCH",payload:{inventory:[{name:"幽寂谷地图",count:1}]}});
  const sent = h.sent.length, filled = [];
  h.adapter.fillInput = x=>filled.push(x);
  await h.r.dispatchIntent({type:"USE_ITEM",payload:{id:"幽寂谷地图"}});
  assert.equal(h.r.getSnapshot().inventory[0].count,1);
  assert.equal(h.r.getSnapshot().pending,null);
  for (const text of ["与在场之人交谈","自行行动"]) await h.r.dispatchIntent({type:"QUICK_ACTION",payload:{text}});
  assert.deepEqual(filled,["与在场之人交谈：","自行行动："]);
  assert.equal(h.sent.length,sent);
  await h.r.dispatchIntent({type:"QUICK_ACTION",payload:{text:"观察四周"}});
  assert.equal(h.sent.at(-1),"观察四周");
});

test("人物指标由中控保存：GM覆盖/释放、阶段重载，正文不直接改数值",async()=>{
  const profiles={角色甲:{metrics:{好感:{min:0,max:100,default:0}},stages:[{id:"base",priority:0,conditions:[]},{id:"high",priority:1,conditions:[{kind:"metric",character:"角色甲",key:"好感",op:"gte",value:60}]}]}};
  const h=harness({...data,characterProfiles:profiles}); await h.opening("赵无忧");
  await h.r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"角色甲",key:"好感",value:70}});
  assert.equal(h.r.getSnapshot().stat_data.character_stages.角色甲.id,"base");
  await h.r.restore(); assert.equal(h.r.getSnapshot().stat_data.character_stages.角色甲.id,"base");
  await h.r.dispatchIntent({type:"GM_PATCH",payload:{"metric.角色甲.好感":20}});
  assert.equal(h.r.getSnapshot().stat_data.character_stages.角色甲.id,"base");
  await assert.rejects(h.r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"角色甲",key:"好感",value:80}}),/人工覆盖/);
  await h.r.dispatchIntent({type:"GM_RELEASE",payload:{keys:["metric.角色甲.好感"]}});
  await h.r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"角色甲",key:"好感",value:80}});
  assert.equal(h.r.getSnapshot().stat_data.character_stages.角色甲.id,"base");
});

test("节点故事门禁同步失败不发送，固定奖励和pending一并恢复",async()=>{
  const h=harness(); await h.opening("赵无忧"); h.r.registerPlugin(plugin());
  h.adapter.syncState=async state=>{if(state.pending?.nodeId) throw Error("条目同步失败");};
  const before=h.r.getSnapshot();
  await assert.rejects(h.select(),/条目同步失败/);
  assert.equal(h.sent.length,0); assert.equal(h.r.getSnapshot().pending,null);
  assert.deepEqual(h.r.getSnapshot().inventory,before.inventory);
});

test("节点数值条件与确定变化：条件拒绝不发送，点选变化可随停止恢复",async()=>{
  const profiles={角色甲:{metrics:{好感:{min:0,max:100,default:0}},stages:[{id:"base",priority:0,conditions:[]}]}};
  const h=harness({...data,characterProfiles:profiles}); await h.opening("赵无忧");
  const base=plugin(); let gated=true;
  h.r.registerPlugin({...base, select(s,id){return {...base.select(s,id),conditions:gated ? [{kind:"metric",character:"角色甲",key:"好感",op:"gte",value:10}] : [],metricChanges:[{character:"角色甲",key:"好感",delta:5}]};}});
  await assert.rejects(h.select(),/条件未满足/); assert.equal(h.sent.length,0);
  gated=false; await h.select(); assert.equal(h.r.getSnapshot().stat_data.character_metrics.角色甲.好感,5);
  await h.r.stop(); assert.equal(h.r.getSnapshot().stat_data.character_metrics.角色甲.好感,0);
});

test('明确内射漏申报名器互动仍增加一升二进度；同楼只算一次，次数达标不代替质变',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'owner.zhuojiu':'赵无忧','relicStage.zhuojiu':1}});
 for(let i=1;i<=3;i++){
  h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status(i===2?{名器互动:'灼酒流炎穴｜赵无忧｜内射'}:{},'本回合赵无忧对叶红缨内射已发生。'));
  await h.r.settleStory();assert.equal(h.r.getSnapshot().relics.zhuojiu.stages[2].count,i);
 }
 assert.equal(h.r.getSnapshot().relics.zhuojiu.stages[2].ready,true);assert.equal(data.rules(h.r.getSnapshot().stat_data).getRelicStage('zhuojiu',h.r.getSnapshot().known),1);
});
test('漏申报兜底排除计划否定、思考、回忆、错人和未成形；编辑删楼撤回进度',async()=>{
 for(const prose of ['赵无忧计划对叶红缨内射。','赵无忧没有对叶红缨内射。','<think>赵无忧对叶红缨内射已发生。</think>','叶红缨回忆上次赵无忧内射。','旁人对叶红缨内射。','孤月与赵无忧在场，叶红缨内射已发生。']){
  const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':1}});await h.reply(status({},prose));assert.equal(h.r.getSnapshot().relics.zhuojiu,undefined);
 }
 const h=harness();await h.opening('赵无忧');await h.reply(status({},'赵无忧对叶红缨内射已发生。'));assert.equal(h.r.getSnapshot().relics.zhuojiu,undefined);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':1}});h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'本回合赵无忧对叶红缨内射已发生。'));assert.equal(h.r.getSnapshot().relics.zhuojiu.stages[2].count,1);
 h.c.chat.at(-1).mes=status({},'本回合没有发生互动。');await h.r.settleStory();assert.equal(h.r.getSnapshot().relics.zhuojiu,undefined);
});

test('十三名器×三个进度阶段：漏申报和显式申报统一入账、不双算、不会串阶或串名器',async()=>{
 const configs=Object.values(data.rules({}).RELIC_PILOT_CONFIG);assert.equal(configs.length,13);
 for(const cfg of configs)for(const stage of [1,2,3]){
  const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{['relicStage.'+cfg.id]:stage}});
  const action={1:'内射',2:'神魂双修',3:'本源共鸣'}[stage];
  for(let n=1;n<=2;n++){
   h.c.chat.push({is_user:true,mes:'继续'});
   await h.reply(status(n===2?{名器互动:cfg.names[0]+'｜赵无忧｜'+action}:{},'本回合赵无忧与'+cfg.owner+'完成'+action+'。'));
   await h.r.settleStory();assert.equal(h.r.getSnapshot().relics[cfg.id].stages[stage+1].count,n,cfg.id+' stage'+stage);
   assert.equal(Object.keys(h.r.getSnapshot().relics).length,1,cfg.id+'不能给其他名器入账');
   assert.equal(data.rules(h.r.getSnapshot().stat_data).getRelicStage(cfg.id,h.r.getSnapshot().known),stage);
  }
 }
});
test('十三名器高阶质变只属于对应持有者；其他角色、计划、回忆、思考和标签不能提供实证',()=>{
 const R=data.rules({}),configs=Object.values(R.RELIC_PILOT_CONFIG);
 for(const cfg of configs){
  const other=configs.find(x=>x.owner!==cfg.owner && !cfg.ownerAliases.includes(x.owner));
  for(const [check,event] of [[R.hasRelicStage3Response,'动情配合'],[R.hasRelicStage4Response,'神异质变']]){
   assert.equal(check(cfg.id,cfg.owner+'已发生'+event+'。'),check===R.hasRelicStage3Response,cfg.id);
   for(const prose of [cfg.owner+'在场。'+other.owner+'已发生'+event+'。',cfg.owner+'计划发生'+event+'。',cfg.owner+'回忆上次发生'+event+'。','<think>'+cfg.owner+'已发生'+event+'。</think>','<Status_block>'+cfg.owner+'已发生'+event+'。</Status_block>'])assert.equal(check(cfg.id,prose),false,cfg.id+': '+prose);
  }
  const K={[cfg.formKey]:true,[cfg.stage2Key]:true};
  const a=R.parseRelicAction(cfg.names[0]+'｜赵无忧｜神魂双修');
  assert.equal(R.validateRelicAction(a,cfg.owner+'在场。'+other.owner+'与赵无忧完成神魂双修。',K,'赵无忧').ok,false,cfg.id);
 }
});
test('高阶继续按原动作门槛计数；仅内射不增加二升三，达标缺少质变不跳阶',async()=>{
 for(const stage of [2,3]){
  const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':stage}});
  await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['relicStage.zhuojiu']}});
  h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'本回合赵无忧对叶红缨内射已发生。'));assert.equal(h.r.getSnapshot().relics.zhuojiu,undefined);
  for(let n=1;n<=3;n++){h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'本回合赵无忧与叶红缨完成'+(stage===2?'神魂双修':'本源共鸣')+'。'));}
  const s=h.r.getSnapshot();assert.equal(s.relics.zhuojiu.stages[stage+1].count,3);assert.equal(s.relics.zhuojiu.stages[stage+1].ready,true);assert.equal(data.rules(s.stat_data).getRelicStage('zhuojiu',s.known),stage);
 }
});

test('二升三/三升四贡献按当前楼层撤回，普通内射显式申报也不能绕过高阶门槛',async()=>{
 for(const stage of [2,3]){
  const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.jiuyou':stage}});
  h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({名器互动:'九幽玄阴穴｜赵无忧｜内射'},'本回合赵无忧对孤月内射已发生。'));assert.equal(h.r.getSnapshot().relics.jiuyou,undefined);
  const action=stage===2?'神魂双修':'本源共鸣';h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'本回合赵无忧与孤月完成'+action+'。'));assert.equal(h.r.getSnapshot().relics.jiuyou.stages[stage+1].count,1);
  h.c.chat.pop();await h.r.restore();assert.equal(h.r.getSnapshot().relics.jiuyou,undefined);
  await h.reply(status({},'孤月计划与赵无忧完成'+action+'。'));assert.equal(h.r.getSnapshot().relics.jiuyou,undefined);
 }
});

test('持有者先在前句出现、后句用代称时仍能计数；途中出现其他持有者则停止归属',async()=>{
 for(const stage of [1,2,3]){
  const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':stage}});
  const action={1:'内射',2:'神魂双修',3:'本源共鸣'}[stage];h.c.chat.push({is_user:true,mes:'继续'});
  await h.reply(status({},'叶红缨在场。你与她完成'+action+'。'));assert.equal(h.r.getSnapshot().relics.zhuojiu.stages[stage+1].count,1);
  h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'叶红缨在场。孤月走来。你与她完成'+action+'。'));assert.equal(h.r.getSnapshot().relics.zhuojiu.stages[stage+1].count,1);
 }
});

test('三升四未设计：进度达标、质变词和明确四阶声明均不自动晋升，GM旧四阶不被撤销',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':3}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['relicStage.zhuojiu']}});
 for(let n=0;n<3;n++){h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'本回合赵无忧与叶红缨完成本源共鸣。叶红缨发生神异质变，进入名器四阶。'));}
 const s=h.r.getSnapshot();assert.equal(s.relics.zhuojiu.stages[4].ready,true);assert.equal(data.rules(s.stat_data).getRelicStage('zhuojiu',s.known),3);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':4}});await h.r.restore();assert.equal(data.rules(h.r.getSnapshot().stat_data).getRelicStage('zhuojiu',h.r.getSnapshot().known),4);
});
