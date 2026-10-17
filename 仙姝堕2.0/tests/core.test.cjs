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
    assert.match(h.prompts.at(-1), name === "赵无忧" ? /神诅尚未降临/ : /南域大劫已发生/);
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
test("储物栏申报可入库，但否定及计数仍不能自行晋升名器", async () => {
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
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="草药").count,1);
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
  const { CSS, PALETTE, portrait, PORTRAIT_CDN } = require("../src/ui/status_panel"),
    source = fs.readFileSync(path.join(ROOT, "src/ui/status_panel.js"), "utf8");
  assert.ok(source.includes('data-xsd-slot="map"'));
  assert.ok(source.includes('data-xsd-slot="17"'));
  assert.equal((source.match(/<details(?:\s[^>]*)?>/g) || []).length, 3);
  assert.ok(!source.includes("<details open"));
  assert.ok(source.includes("img.onerror"));
  let guyueSmall;
  assert.ok(
    (guyueSmall = portrait("孤月", { stat_data: {}, known: {} }, data).small).endsWith(
      "guyue.png",
    ) || guyueSmall === PORTRAIT_CDN["guyue.png"],
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
  assert.equal(built.card.data.character_book.entries.length, 225 + data.grandEras.length + 1 + Object.keys(require("../src/config/node_stories.json")).length + Object.values(require("../tools/data.cjs").load(ROOT).characterProfiles).reduce((n,c)=>n+[...c.stages,...require("../src/runtime/character_stages").negativeStages(c,"")].reduce((m,x)=>m+(x.stories ? Object.keys(x.stories).length : (x.story ? 1 : 0)),0),0) + Object.keys(require("../src/config/metric_events.json")).length + Object.keys(require("../src/config/area_backgrounds.json")).length);
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
test("储物栏获得申报按玩家入库，不再由正文主语匹配拦截", async () => {
  const h = harness();
  await h.opening("赵无忧");
  await h.reply(status({ 纳戒: "获得：草药×1" }, "你看见孤月取得草药。"));
  assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==="草药").count,1);
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

function realmIntent(h,kind){const s=h.r.getSnapshot();return h.r.dispatchIntent({type:'REALM_ACTION',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{kind}});}
function deflowerReply(holder,marked=true){return status({破处:holder+'、赵无忧'},'赵无忧实质破处了'+holder+'，元阴被夺并落红。'+(marked?'赵无忧对'+holder+'内射已发生。':''));}
test('境界：金丹以下首次破处到本境大圆满，点击突破下一境前期，重复名器不再次升级',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'筑基初期'}});
 await h.reply(deflowerReply('叶红缨',false));assert.equal(h.r.getSnapshot().stat_data.修为,'筑基大圆满');assert.equal(h.r.getSnapshot().stat_data.relic_imprints.zhuojiu,undefined);
 const count=h.r.getSnapshot().storyCount;await realmIntent(h,'breakthrough');assert.equal(h.r.getSnapshot().stat_data.修为,'金丹前期');assert.equal(h.r.getSnapshot().storyCount,count);assert.equal(h.sent.length,0);
 h.c.chat.push({is_user:true,mes:'继续'});await h.reply(deflowerReply('叶红缨'));assert.equal(h.r.getSnapshot().stat_data.修为,'金丹前期');assert.ok(h.r.getSnapshot().stat_data.relic_imprints.zhuojiu);
 await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.修为,'金丹前期');
});
test('金丹期首次采补逐档提升，三个不同名器的破处及本源烙印解锁点击结婴',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'金丹前期'}});
 for(const [holder,realm] of [['叶红缨','金丹中期'],['孤月','金丹后期'],['闻观语','金丹大圆满']]){h.c.chat.push({is_user:true,mes:'继续'});await h.reply(deflowerReply(holder));assert.equal(h.r.getSnapshot().stat_data.修为,realm);}
 const Realm=require('../src/runtime/player_realm'),s=h.r.getSnapshot();assert.equal(Realm.eligibility(s,data.rules(s.stat_data)).marked.length,3);
 await realmIntent(h,'breakthrough');assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');
 h.c.chat.push({is_user:true,mes:'我已化神'});await h.reply(status({修为:'化神大圆满'},'你宣称修为提升。'));assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');
});
test('结婴门槛：失去归属、重复名器和别人的三阶名器不算；归属玩家的三阶名器可结婴',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'金丹大圆满'}});
 for(const holder of ['叶红缨','孤月','闻观语']){h.c.chat.push({is_user:true,mes:'继续'});await h.reply(deflowerReply(holder,false));}
 assert.equal(require('../src/runtime/player_realm').eligibility(h.r.getSnapshot(),data.rules(h.r.getSnapshot().stat_data)).marked.length,3);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'owner.jiuyou':'无','owner.xinmo':'无'}});await assert.rejects(realmIntent(h,'breakthrough'),/未满足/);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':3,'owner.zhuojiu':'别人'}});await assert.rejects(realmIntent(h,'breakthrough'),/未满足/);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'owner.zhuojiu':'赵无忧'}});await realmIntent(h,'breakthrough');assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');
});
test('闭关三个月推进90日并升一档，同日模型口胡不升境，旧按钮和事件中闭关被拒绝',async()=>{
 const h=harness();await h.opening('赵无忧');const date=h.r.getSnapshot().calendarDate,old=h.r.getSnapshot();
 await realmIntent(h,'retreat');assert.equal(h.sent.length,1);await h.reply(status({历时:'90日'},'你闭关三个月，出关时气息平稳。'));assert.equal(h.r.getSnapshot().stat_data.修为,'金丹后期');assert.equal(C.day(h.r.getSnapshot().calendarDate)-C.day(date),90);
 await assert.rejects(h.r.dispatchIntent({type:'REALM_ACTION',expected:{chatId:old.chatId,branchId:old.branchId,floor:old.floor,revision:old.revision},payload:{kind:'retreat'}}),/旧状态/);
 await realmIntent(h,'retreat');await h.reply(status({历时:'90日'}));assert.equal(h.r.getSnapshot().stat_data.修为,'金丹大圆满');await assert.rejects(realmIntent(h,'retreat'),/仅适用/);await assert.rejects(realmIntent(h,'breakthrough'),/未满足/);
 const k=harness();await k.opening('赵无忧');k.r.registerPlugin(plugin());await k.select('enter');await assert.rejects(realmIntent(k,'retreat'),/结束/);
});
test('模型的否定、思考和标签不能制造烙印；历史迁移不会再发破处升境奖励',async()=>{
 const h=harness();await h.opening('赵无忧');await h.reply(deflowerReply('叶红缨',false));
 h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'<think>赵无忧对叶红缨内射已发生。</think>叶红缨没有参与此事。'));assert.equal(h.r.getSnapshot().stat_data.relic_imprints.zhuojiu,undefined);
 const s=h.r.getSnapshot();delete s.stat_data.player_realm;s.stat_data.修为='金丹前期';const Realm=require('../src/runtime/player_realm');Realm.ensure(s,data.rules(s.stat_data));Realm.collect(s,data.rules(s.stat_data),'叶红缨在场。',99);assert.equal(s.stat_data.修为,'金丹前期');assert.ok(s.stat_data.player_realm.credited.includes('zhuojiu'));
});

test('新境界奖励和烙印不接受思考/外置协议自证，也不能把旁观玩家当成破处者',async()=>{
 for(const prose of ['<think>赵无忧实质破处叶红缨，元阴被夺并落红。赵无忧对叶红缨内射已发生。</think>','<破处>赵无忧实质破处叶红缨，元阴被夺并落红。</破处><名器互动>叶红缨｜赵无忧｜内射</名器互动>','赵无忧在旁观望。张三实质破处叶红缨，元阴被夺并落红。']){
  const h=harness();await h.opening('赵无忧');await h.reply(status({破处:'叶红缨、赵无忧'},prose));assert.equal(h.r.getSnapshot().stat_data.修为,'金丹中期');assert.equal(h.r.getSnapshot().stat_data.relic_imprints.zhuojiu,undefined);
 }
});

test('条件满足时可在活动剧情内本地突破，闭关不可跳走当前剧情',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'筑基大圆满'}});h.r.registerPlugin(plugin());await h.select('enter');await h.reply(status({},'你已经进入幽寂谷。'));
 assert.ok(h.r.getSnapshot().activeEvent);await realmIntent(h,'breakthrough');assert.equal(h.r.getSnapshot().stat_data.修为,'金丹前期');assert.ok(h.r.getSnapshot().activeEvent);await assert.rejects(realmIntent(h,'retreat'),/结束/);
});

const eraIntent=(h,id)=>{const s=h.r.getSnapshot();return h.r.dispatchIntent({type:'ADVANCE_ERA',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{id}});};
test('大势跨时期快进原子落账，不完成局部剧情或发消息奖励，刷新保留',async()=>{
 const h=harness();await h.opening('赵无忧');const before=h.r.getSnapshot();await eraIntent(h,'beast');const s=h.r.getSnapshot();
 assert.deepEqual(s.calendarDate,{year:1579,month:1,day:1});assert.equal(s.stat_data.grand_era,'beast');
 for(const key of ['南域大劫','天姝会存在','天溪城兽潮','兽潮血战'])assert.equal(s.stat_data.known[key],true);
 assert.equal(s.stat_data.known['天溪城破'],before.stat_data.known['天溪城破']);assert.deepEqual(s.stat_data.inventory,before.stat_data.inventory);
 assert.equal(s.storyCount,before.storyCount);assert.equal(h.sent.length,0);assert.equal(s.stat_data.node_trigger,null);
 await assert.rejects(eraIntent(h,'peace'),/未来/);await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.grand_era,'beast');
});
test('闭关、普通耗时及GM日期共用时期判定，末期背景延续且不自动城破',async()=>{
 const h=harness();await h.opening('赵无忧');
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:{year:1578,month:7,day:30}}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['calendarDate']}});
 h.c.chat.push({is_user:true,mes:'歇息一日'});await h.reply(status({历时:'1日'}));assert.equal(h.r.getSnapshot().stat_data.grand_era,'calamity');
 const k=harness();await k.opening('赵无忧');await realmIntent(k,'retreat');await k.reply(status({历时:'90日'}));await realmIntent(k,'retreat');await k.reply(status({历时:'90日'}));assert.equal(k.r.getSnapshot().stat_data.grand_era,'calamity');
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:{year:1579,month:3,day:1}}});assert.equal(h.r.getSnapshot().stat_data.grand_era,'beast');assert.equal(h.r.getSnapshot().stat_data.known['天溪城破'],false);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:{year:1578,month:3,day:1}}});assert.equal(h.r.getSnapshot().stat_data.grand_era,'peace');assert.equal(h.r.getSnapshot().stat_data.known['南域大劫'],false);
});
test('元婴大劫一次性跌至金丹大圆满，名器重新结婴后刷新不重复跌境',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'元婴中期'}});await eraIntent(h,'calamity');assert.equal(h.r.getSnapshot().stat_data.修为,'金丹大圆满');
 await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.player_realm.actions.filter(x=>x.kind==='calamity-drop').length,1);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'relicStage.zhuojiu':3,'owner.zhuojiu':'赵无忧'}});await realmIntent(h,'breakthrough');assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');
 await h.r.restore();await eraIntent(h,'beast');assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');
});
test('快进拒绝忙碌、旧按钮与日期覆盖，删楼恢复时期及跌境前状态',async()=>{
 const h=harness();await h.opening('赵无忧');const stale=h.r.getSnapshot();await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'元婴前期'}});
 await assert.rejects(h.r.dispatchIntent({type:'ADVANCE_ERA',expected:{chatId:stale.chatId,branchId:stale.branchId,floor:stale.floor,revision:stale.revision},payload:{id:'calamity'}}),/旧状态/);
 h.generating(true);await assert.rejects(eraIntent(h,'calamity'),/结束/);h.generating(false);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{calendarDate:{year:1578,month:3,day:3}}});await assert.rejects(eraIntent(h,'calamity'),/交还自动/);await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['calendarDate']}});
 h.c.chat.push({is_user:true,mes:'等待'});await h.reply(status({历时:'1日'}));await eraIntent(h,'calamity');assert.equal(h.r.getSnapshot().stat_data.修为,'金丹大圆满');
 h.c.chat.splice(1);await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.grand_era,'peace');assert.equal(h.r.getSnapshot().stat_data.修为,'元婴前期');
 const k=harness();await k.opening('赵无忧');k.r.registerPlugin(plugin());await k.select();await assert.rejects(eraIntent(k,'calamity'),/结束/);
});

test('四殿主大劫日开局含伪装元婴均落金丹大圆满，开局状态与后台一致',async()=>{
 for(const identity of ['焚欲殿主','欢喜殿主','浊龙殿主','魂欢殿主']){
  const h=harness();await h.opening(identity);assert.equal(h.r.getSnapshot().stat_data.修为,'金丹大圆满');assert.equal(C.parseStatus(h.c.chat[0].mes).fields.修为,'金丹大圆满');
  await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.player_realm.actions.filter(x=>x.kind==='calamity-drop').length,1);
 }
});

test('自由回合不按轮次固定计时，分钟按实际耗时累积；累计天数或未知耗时不加天',async()=>{
 const h=harness();await h.opening('赵无忧');const start=C.day(h.r.getSnapshot().calendarDate);
 for(let i=0;i<4;i++){h.c.chat.push({is_user:true,mes:'继续交谈'});await h.reply(status({历时:'—'}));}
 assert.equal(h.r.getSnapshot().clockRemainder||0,0);assert.equal(C.day(h.r.getSnapshot().calendarDate),start);
 h.c.chat.push({is_user:true,mes:'等候五分钟'});await h.reply(status({历时:'5分钟'}));assert.equal(h.r.getSnapshot().clockRemainder,5);
 h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({历时:'距出行3日'}));assert.equal(h.r.getSnapshot().clockRemainder,5);
 h.c.chat.push({is_user:true,mes:'长途行走'});await h.reply(status({历时:'1435分钟'}));assert.equal(C.day(h.r.getSnapshot().calendarDate),start+1);assert.equal(h.r.getSnapshot().clockRemainder,0);
 await h.r.restore();assert.equal(C.day(h.r.getSnapshot().calendarDate),start+1);
});

test('负好感锁定随本地消息存档保存，GM不能绕过；删楼恢复触发前的完整状态',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':-50}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['metric.叶红缨.好感度']}});
 h.c.chat.push({is_user:true,mes:'冒犯师姐'});const line='叶红缨冷然斥责赵无忧';await h.reply(status({在场:'<角色1><名>叶红缨</名><关系>戒备</关系></角色1>'},line+'。<好感事件>叶红缨｜记恨｜依据：'+line+'</好感事件>'));
 assert.equal(h.r.getSnapshot().stat_data.character_metric_caps.叶红缨.好感度,-50);await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.character_stages.叶红缨.id,'neg_hostile');await assert.rejects(h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':-49}}),/永久/);
 h.c.chat.splice(1);await h.r.restore();assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,-50);assert.equal(h.r.getSnapshot().stat_data.character_metric_caps?.叶红缨,undefined);
});

test('闭关发送失败回滚，重复点击拒绝、刷新保留、取消恢复和删楼再结算不重复90日',async()=>{
 const h=harness();await h.opening('赵无忧');const date=C.day(h.r.getSnapshot().calendarDate);
 h.fail(true);await assert.rejects(realmIntent(h,'retreat'),/send failed/);assert.equal(h.r.getSnapshot().stat_data.修为,'金丹中期');assert.equal(C.day(h.r.getSnapshot().calendarDate),date);assert.equal(h.r.getSnapshot().pending,null);h.fail(false);
 await realmIntent(h,'retreat');await assert.rejects(realmIntent(h,'retreat'),/结束/);await h.r.restore();assert.equal(h.r.getSnapshot().pending.kind,'realm');
 await h.reply(status({历时:'90日',修为:'元婴大圆满'},'你闭关结束。'));const s=h.r.getSnapshot();assert.equal(s.pending,null);assert.equal(s.stat_data.修为,'金丹后期');assert.equal(C.day(s.calendarDate),date+90);assert.equal(Object.values(s.settlements).at(-1).kind,'realm');
 await h.r.settleStory();assert.equal(C.day(h.r.getSnapshot().calendarDate),date+90);h.c.chat.pop();await h.r.restore();assert.equal(h.r.getSnapshot().pending.kind,'realm');await h.reply(status({历时:'90日'}));assert.equal(C.day(h.r.getSnapshot().calendarDate),date+90);
 h.c.chat.splice(1);await h.r.restore();assert.equal(C.day(h.r.getSnapshot().calendarDate),date);assert.equal(h.r.getSnapshot().stat_data.修为,'金丹中期');
 const k=harness();await k.opening('赵无忧');const start=C.day(k.r.getSnapshot().calendarDate);await realmIntent(k,'retreat');await k.r.stop();assert.equal(k.r.getSnapshot().pending,null);assert.equal(C.day(k.r.getSnapshot().calendarDate),start);assert.equal(k.r.getSnapshot().stat_data.修为,'金丹中期');
});

test('在场角色的好感表与实际共饮申报进入本轮提示；锁定不会自动清除',async()=>{
 const h=harness();await h.opening('赵无忧');await h.reply(status({在场:'叶红缨',角色1:'<名>叶红缨</名><关系>同门</关系>'},'叶红缨提着酒坛站在竹林边。'));
 assert.match(h.prompts.at(-1),/yh_gongyin/);assert.match(h.prompts.at(-1),/<好感事件>/);
 h.c.chat.push({is_user:true,mes:'请叶红缨饮酒'});await h.reply(status({在场:'叶红缨',角色1:'<名>叶红缨</名><关系>同门</关系>'},'叶红缨接过酒盏，与赵无忧共饮，席间开怀。')+'<好感事件>叶红缨｜锚点 yh_gongyin｜依据：叶红缨接过酒盏，与赵无忧共饮，席间开怀。</好感事件>');
 assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,2);
});
test('自设留空道号年龄境界使用酒馆用户名20金丹前期；明确输入不覆盖',async()=>{
 const h=harness();h.adapter.getUserName=()=> '酒馆道友';await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{date:{year:1578,month:3,day:3},name:'',age:'',realm:''}}});assert.equal(h.r.getSnapshot().stat_data.自设.name,'酒馆道友');assert.equal(h.r.getSnapshot().stat_data.自设.age,'20');assert.equal(h.r.getSnapshot().stat_data.修为,'金丹前期');
});

test('首次成型实证兼容邻句代称及元阴初破；状态申报、传闻和其他人物不确权',async()=>{
 for(const body of ['孤月在寒玉榻上。你破了她的身，落红已发生。','本回合你使孤月元阴初破。']){
  const h=harness();await h.opening('赵无忧');await h.reply(status({破处:'孤月、赵无忧',实际发生:'孤月处女丧失、九幽玄阴穴成形、九幽玄阴穴一阶段',名器互动:'九幽玄阴穴｜孤月｜破身'},body));
  const s=h.r.getSnapshot();assert.equal(s.known['九幽玄阴穴成形'],true);assert.equal(s.known['九幽玄阴穴一阶段'],true);assert.equal(s.stat_data.名器归属.jiuyou,'赵无忧');assert.notEqual(s.known['九幽玄阴穴二阶段'],true);
 }
 for(const body of ['孤月尚未现身。你破了她的身，落红已发生。','孤月在榻边。叶红缨走来。你破了她的身，落红已发生。','孤月说：「你破了我的身。」','孤月元阴尚未失守。','孤月并非落红。','孤月未破身。','孤月在场。你回忆曾经破了她的身。','只有状态栏申报，没有正文动作。']){
  const h=harness();await h.opening('赵无忧');await h.reply(status({破处:'孤月、赵无忧',实际发生:'孤月处女丧失、九幽玄阴穴成形、九幽玄阴穴一阶段',名器互动:'九幽玄阴穴｜孤月｜破身'},body));assert.notEqual(h.r.getSnapshot().known['九幽玄阴穴成形'],true,body);
 }
 const book=JSON.parse(fs.readFileSync(path.join(ROOT,'仙姝堕-世界书.json'),'utf8')),entry=book.entries['52'];assert.ok(entry.key.includes('孤月'));assert.equal(evaluateGate(entry.content,{known:{}}),true);assert.ok(!entry.content.startsWith('@@if '));
});

test('储物栏是主协议，旧纳戒仍兼容读取，新旧并存只采用新标签',async()=>{
 assert.equal(C.XML_FIELDS.includes('储物栏'),true);assert.equal(C.XML_FIELDS.includes('纳戒'),false);assert.equal(C.XML_FIELDS.length,19);
 for(const field of ['纳戒','储物栏']){
  const text='<Status_block><'+field+'>获得：测试灵石×1</'+field+'></Status_block>';assert.equal(C.parseStatus(text).fields.纳戒,'获得：测试灵石×1');
 }
 const both=C.parseStatus('<Status_block><纳戒>获得：旧物×1</纳戒><储物栏>获得：新物×1</储物栏></Status_block>');assert.equal(both.fields.纳戒,'获得：新物×1');const canonical=C.canonicalStatus('<Status_block><纳戒>旧</纳戒><储物栏>新</储物栏></Status_block>',{identity:'赵无忧',calendarDate:{year:1578,month:3,day:3},stat_data:{储物栏:'新'}});assert.equal((canonical.match(/<储物栏>/g)||[]).length,1);
 const h=harness();await h.opening('赵无忧');await h.reply('你获得测试灵石。<Status_block><储物栏>获得：测试灵石×1</储物栏></Status_block>');assert.ok(h.r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));assert.ok(h.c.chat.at(-1).mes.includes('<储物栏>'));assert.ok(!h.c.chat.at(-1).mes.includes('<纳戒>'));
 const doc=new (require('jsdom').JSDOM)(data.openingMenu).window.document;assert.equal(doc.querySelectorAll('[data-xds-field][maxlength]').length,0);
});

test('正常续写消息变量暂失时沿用已提交可信快照，用户选择变化仍拒绝',async()=>{
 const h=harness();await h.opening('赵无忧');await h.reply(status({},'你结束了这轮交谈。'));const proof=h.r.getCheckpoint();assert.ok(proof?.trail);const revision=proof.state.revision;
 for(const m of h.c.chat)m.variables=[];h.adapter.readCheckpoint=async()=>({schema:2,chatId:h.c.chatId,trail:null});h.c.chat.push({mes:'我继续探索',is_user:true});await h.r.replay('normal');assert.equal(h.r.getSnapshot().revision,revision);assert.equal(h.r.getSnapshot().identity,'赵无忧');
 h.c.chat[0].swipe_id=1;await assert.rejects(h.r.replay('normal'),/保护存档/);
});


test('仅剩最新备份时重roll用绑定的上一快照；不继承被删回复收益、不跨用户选择恢复',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':12}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['metric.叶红缨.好感度']}});
 h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'你获得测试灵石。<Status_block><储物栏>获得：测试灵石×1</储物栏></Status_block>'));
 const saved=h.r.getCheckpoint();assert.ok(saved.previous);assert.ok(!saved.previous.previous);
 for(const m of h.c.chat)m.variables=[];
 h.adapter.readCheckpoint=async()=>C.clone(saved);h.c.chat.at(-1).swipe_id=1;h.c.chat.at(-1).mes='正在重写';
 const fresh=createDispatcher(h.adapter,data);await fresh.replay('regenerate');assert.equal(fresh.getSnapshot().stat_data.character_metrics.叶红缨.好感度,12);assert.ok(!fresh.getSnapshot().inventory.some(x=>x.name==='测试灵石'));
 h.c.chat[0].swipe_id=1;await assert.rejects(fresh.restore(),/保护存档/);assert.equal(fresh.getSnapshot(),null);assert.ok(fresh.getDiagnostics().recoveryFault);await assert.rejects(fresh.dispatchIntent({type:'GM_PATCH',payload:{地点:'不应写入'}}),/尚未恢复/);
 h.c.chat[0].swipe_id=0;await fresh.replay('regenerate');assert.equal(fresh.getDiagnostics().recoveryFault,null);assert.ok(fresh.getSnapshot());
 h.c.chat.at(-1).mes=status({},'重写后的普通交谈。');await fresh.settleStory();assert.ok(fresh.getCheckpoint().previous);assert.ok(!fresh.getSnapshot().inventory.some(x=>x.name==='测试灵石'));
});


test('隐藏0至6楼不改变分支：四份聊天备份仍恢复第6楼，不清零；改用户动作回到前置、改开局候选仍拒绝',async()=>{
 const h=harness(),journal=[];await h.opening('赵无忧');journal.push(h.r.getCheckpoint());
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':12}});journal[0]=h.r.getCheckpoint();
 for(let i=0;i<3;i++){h.c.chat.push({is_user:true,mes:'继续第'+i+'次'});await h.reply(status({},'此番交谈结束。'));journal.push(h.r.getCheckpoint());}
 assert.deepEqual(journal.map(x=>x.trail.length-1),[0,2,4,6]);
 const good=h.r.getSnapshot();
 for(let i=0;i<3;i++){h.c.chat.push({is_user:true,mes:'后续交谈'+i},{is_user:false,mes:status({},'仍在交谈。')});}
 for(let i=0;i<=6;i++)h.c.chat[i].is_system=true;
 for(const m of h.c.chat)m.variables=[];
 h.adapter.readCheckpoints=async()=>C.clone(journal);const r=createDispatcher(h.adapter,data);await r.restore();
 assert.equal(r.getSnapshot().storyCount,good.storyCount);assert.equal(r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,12);assert.equal(r.getDiagnostics().recoveryFault,null);
 h.c.chat[1].mes='改为另一个选择';await r.restore();assert.equal(r.getSnapshot().storyCount,0);h.c.chat[1].mes='继续第0次';await r.restore();assert.equal(r.getSnapshot().storyCount,good.storyCount);
 h.c.chat[0].swipe_id=1;await assert.rejects(r.restore(),/保护存档/);h.c.chat[0].swipe_id=0;await r.restore();assert.equal(r.getSnapshot().identity,'赵无忧');
 const ordinary=C.fingerprint([{mes:'正文',is_user:false}]),hidden=C.fingerprint([{mes:'正文',is_user:false,is_system:true}]);assert.equal(C.matchesSnapshot(ordinary,hidden),true);assert.equal(C.matchesSnapshot(hidden,ordinary),true);
 assert.equal(C.matchesSnapshot(C.fingerprint([{mes:'指令甲',is_system:true}]),C.fingerprint([{mes:'指令乙',is_system:true}])),false);
 assert.equal(C.matches(ordinary,hidden),false);
});


test('导入聊天保留楼层快照且隐藏旧消息时，以当前消息前缀恢复原进度、不借外部聊天备份',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({},'你获得测试灵石。<Status_block><储物栏>获得：测试灵石×1</储物栏></Status_block>'));
 const old=h.r.getCheckpoint();h.c.chatId='新聊天 imported';h.c.branchId=h.c.chatId;
 for(const m of h.c.chat)m.is_system=true;
 h.adapter.readCheckpoints=async()=>[C.clone(old)];const r=createDispatcher(h.adapter,data);await r.restore();assert.equal(r.getSnapshot().chatId,h.c.chatId);assert.ok(r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));
 h.c.chat[0].swipe_id=1;await assert.rejects(r.restore(),/保护存档/);
});


test('名器诊断导出阶段归属覆盖与首次实证片段，只读不改账本',async()=>{
 const h=harness();await h.opening('赵无忧');await h.reply(status({破处:'孤月、赵无忧',实际发生:'孤月处女丧失、九幽玄阴穴成形',名器互动:'九幽玄阴穴｜孤月｜破身'},'本回合你使孤月元阴初破。'));
 const before=JSON.stringify(h.r.getCheckpoint()),report=h.r.getDiagnostics();const r=report.relics.find(x=>x.id==='jiuyou');assert.equal(r.stage,1);assert.equal(r.owners.jiuyou,'赵无忧');assert.match(report.relicEvidence[0].proof,/元阴初破/);assert.equal(JSON.stringify(h.r.getCheckpoint()),before);
});

test('突破与纹章统一归属别名，自设道号可认主；明确归属即确认烙印、破处仍独立校验',async()=>{
 const Realm=require('../src/runtime/player_realm'),h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{realm:'金丹大圆满'}});
 const s=h.r.getSnapshot(),r=data.rules(s.stat_data);s.identity='自设';s.stat_data.自设={name:'青松'};s.stat_data.名器归属={};s.stat_data.破处者={};s.stat_data.relic_imprints={};
 for(const [i,id] of ['zhuojiu','jiuyou','xinmo'].entries()){const cfg=r.RELIC_PILOT_CONFIG[id],g=r.FORM_OF_HOLDERS.find(x=>x.form===cfg.formKey);s.stat_data.known[cfg.formKey]=true;for(const holder of g.holders){s.stat_data.known[holder+'处女丧失']=true;s.stat_data.破处者[holder]='青松';}s.stat_data.名器归属[cfg.names[i===0?0:cfg.names.length-1]]='青松';s.stat_data.relic_imprints[id]={owner:'青松'};}
 const e=Realm.eligibility(s,r);assert.equal(e.marked.length,3);assert.equal(e.breakthrough,true);
 delete s.stat_data.relic_imprints.jiuyou;const missing=Realm.eligibility(s,r);assert.equal(missing.marked.length,3);assert.deepEqual(missing.details.find(x=>x.id==='jiuyou').missing,[]);assert.equal(missing.details.find(x=>x.id==='jiuyou').imprinted,true);assert.equal(s.stat_data.relic_imprints.jiuyou,undefined);
 s.stat_data.破处者.孤月='别人';assert.equal(Realm.eligibility(s,r).marked.length,2);s.stat_data.破处者.孤月='青松';s.stat_data.名器归属.jiuyou='无';assert.equal(Realm.eligibility(s,r).details.find(x=>x.id==='jiuyou').owned,false);
});


test('已存在境界账本的旧档也从已验证浸润历史补烙印，不从单独归属或他人动作补',async()=>{
 const Realm=require('../src/runtime/player_realm'),h=harness();await h.opening('赵无忧');const s=h.r.getSnapshot(),r=data.rules(s.stat_data),c=r.RELIC_PILOT_CONFIG.jiuyou;
 s.stat_data.known[c.formKey]=true;s.stat_data.known['孤月处女丧失']=true;s.stat_data.破处者.孤月='赵无忧';s.stat_data.名器归属[c.names[0]]='赵无忧';s.stat_data.relic_progress.jiuyou={history:[{actor:'别人',action:'内射'}]};
 Realm.ensure(s,r);assert.equal(s.stat_data.relic_imprints.jiuyou,undefined);
 s.stat_data.relic_progress.jiuyou.history.push({actor:'赵无忧',action:'内射'});const revision=s.revision;Realm.ensure(s,r);assert.equal(s.stat_data.relic_imprints.jiuyou.source,'validated-history');assert.equal(s.revision,revision);assert.equal(Realm.eligibility(s,r).marked.includes(c.names[0]),true);
});

test('上一轮保存未结束时仅追加下一条用户消息，原楼层仍提交且不丢失或重复收益',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'探索'});
 const persist=h.adapter.persist;let release,entered;const gate=new Promise(r=>release=r),reading=new Promise(r=>entered=r);
 h.adapter.persist=async(c,e)=>{if(c.floor===2){entered();await gate;}return persist(c,e);};
 const done=h.reply(status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。'));await reading;h.c.chat.push({is_user:true,mes:'立即继续'});release();await done;
 assert.equal(h.r.getSnapshot().storyCount,1);assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);assert.ok(h.c.chat[2].variables[0].stat_data.xsd2[0]);assert.equal(h.c.chat[3].variables,undefined);
 await h.r.replay('normal');await h.reply(status({},'你继续前行。'));assert.equal(h.r.getSnapshot().storyCount,2);assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);
});

test('新用户楼已入场且宿主已标生成中，生成前补齐前一助手楼而不结算用户楼',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'探索'},{is_user:false,mes:status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。')},{is_user:true,mes:'下一条'});h.generating(true);
 await h.r.flushCompleted();assert.equal(h.r.getSnapshot().storyCount,1);assert.ok(h.c.chat[2].variables[0].stat_data.xsd2[0]);assert.equal(h.c.chat[3].variables,undefined);await h.r.flushCompleted();assert.equal(h.r.getSnapshot().storyCount,1);
});


test('导入并删除未结算用户补充后，逐条校验保留回复和用户输入，重连楼号保留进度',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'多余补充'},{is_user:true,mes:'第一轮'});await h.reply(status({},'第一轮结束。'));h.c.chat.push({is_user:true,mes:'第二轮'});await h.reply(status({},'第二轮结束。'));
 const saved=h.r.getCheckpoint(),count=h.r.getSnapshot().storyCount;delete saved.identityTrail;if(saved.previous)delete saved.previous.identityTrail;h.c.chat.splice(1,1);h.c.chatId='重新导入';h.c.branchId=h.c.chatId;for(const m of h.c.chat)m.variables=[];h.adapter.readCheckpoints=async()=>[C.clone(saved)];
 const r=createDispatcher(h.adapter,data);await r.ready();assert.equal(r.getSnapshot().storyCount,count);assert.equal(r.getSnapshot().history_reassociation.floor,4);assert.deepEqual(Object.keys(r.getSnapshot().processed),['2','4']);
 h.c.chat.push({is_user:true,mes:'第三轮'},{is_user:false,mes:status({},'第三轮结束。')});await r.flushCompleted();assert.equal(r.getSnapshot().storyCount,count+1);await r.flushCompleted();assert.equal(r.getSnapshot().storyCount,count+1);
});

test('重连不接受已改用户输入/候选/回复、删助手结果或删授权命令；导入旧记录不能静默清零',async()=>{
 const {reassociate}=require('../src/runtime/reassociate_history');const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'待删除'},{is_user:true,mes:'保留输入'});await h.reply(status({},'保留回复。'));const saved=h.r.getCheckpoint(),original=C.clone(h.c.chat);delete saved.identityTrail;if(saved.previous)delete saved.previous.identityTrail;
 const check=chat=>reassociate(saved,{chat,trail:C.fingerprint(chat)});
 let chat=C.clone(original);chat.splice(1,1);assert.ok(check(chat));chat[1].mes='不同输入';assert.equal(check(chat),null);chat=C.clone(original);chat.splice(1,1);chat[2].swipe_id=1;assert.equal(check(chat),null);chat[2].swipe_id=0;chat[2].mes='改写回复';assert.equal(check(chat),null);
 chat=C.clone(original);chat.pop();assert.equal(check(chat),null);chat=C.clone(original);chat.splice(1,1);chat.push({is_user:true,mes:'XSD2_next_deadbeef'});assert.equal(check(chat),null);
 const coded=C.clone(saved),tuple=JSON.parse(coded.trail[1]);tuple[3]='XSD2_test_deadbeef';coded.trail[1]=JSON.stringify(tuple);chat=C.clone(original);chat.splice(1,1);assert.equal(reassociate(coded,{chat,trail:C.fingerprint(chat)}),null);
 h.c.chat=chat;h.c.chat[1].mes='不同输入';for(const m of h.c.chat)m.variables=[];h.c.chatId='imported';h.c.branchId='imported';h.adapter.readCheckpoints=async()=>[C.clone(saved)];await assert.rejects(createDispatcher(h.adapter,data).ready(),/保护存档/);
});

test('稳定消息身份：带奖励节点删早期普通输入并导入，收据随原回复移动且不重复',async()=>{
 const h=harness();await h.opening('赵无忧');h.r.registerPlugin(plugin());
 h.c.chat.push({is_user:true,mes:'可删除补充'},{is_user:true,mes:'继续'});await h.reply(status({},'交谈结束。'));
 await h.select('exit');const tx=h.r.getSnapshot().pending.id;assert.match(tx,/^tx_/);
 await h.reply(status({},'你离开幽寂谷，带回草药。'));const original=h.r.getSnapshot(),saved=h.r.getCheckpoint();
 assert.ok(saved.identityTrail);assert.equal(original.receipts[tx].floor,5);assert.equal(original.receipts[tx].messageRef.revisionId,saved.identityTrail.at(-1).revisionId);
 // The receipt uses its reply ID even when its cached old position is wrong.
 saved.state.receipts[tx].floor=999;
 h.c.chat.splice(1,1);h.c.chatId='导入新名字';h.c.branchId=h.c.chatId;for(const m of h.c.chat)m.variables=[];
 h.adapter.readCheckpoints=async()=>[C.clone(saved)];const fresh=createDispatcher(h.adapter,data);fresh.registerPlugin(plugin());await fresh.ready();
 const now=fresh.getSnapshot();assert.equal(now.receipts[tx].floor,4);assert.deepEqual(now.calendarDate,original.calendarDate);assert.deepEqual(now.inventory,original.inventory);assert.equal(now.storyCount,original.storyCount);
 await fresh.flushCompleted();assert.deepEqual(fresh.getSnapshot().inventory,original.inventory);assert.equal(fresh.getSnapshot().storyCount,original.storyCount);
 // Remove this outcome: the predecessor still carries the authorized action,
 // and its transaction ID survives the shifted floor and changed chat name.
 h.c.chat.pop();await fresh.restore();assert.equal(fresh.getSnapshot().pending.id,tx);assert.ok(!fresh.getSnapshot().inventory.some(x=>x.name==='草药'));
 h.c.chat.push({is_user:false,mes:status({},'重写后带回草药。')});await fresh.settleStory();assert.equal(fresh.getSnapshot().inventory.find(x=>x.name==='草药').count,1);assert.equal(Object.keys(fresh.getSnapshot().receipts).length,1);
});

test('稳定候选身份：同一楼重抽不继承旧收益，切回原候选恢复原账；编辑回复撤回再算',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'探索'});await h.reply(status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。'));
 const first=C.clone(h.c.chat.at(-1)),firstId=first.extra.xsd2_identity.revisionId;h.c.chat.at(-1).swipe_id=1;h.c.chat.at(-1).mes=status({},'没有新的发现。');await h.r.replay('swipe');await h.r.settleStory();
 assert.ok(!h.r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));assert.notEqual(h.c.chat.at(-1).extra.xsd2_identity.revisionId,firstId);
 h.c.chat.at(-1).swipe_id=0;h.c.chat.at(-1).mes=first.mes;await h.r.restore();assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);
 h.c.chat.at(-1).mes=status({},'改为普通交谈。');await h.r.restore();await h.r.settleStory();assert.ok(!h.r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));assert.equal(h.r.getSnapshot().storyCount,1);
});

test('稳定身份拒绝已改用户/删授权/删助手/重排/重复消息ID，不能仅凭相同楼号借旧档',async()=>{
 const I=require('../src/runtime/message_identity'),h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'补充'},{is_user:true,mes:'XSD2_action_deadbeef'});await h.reply(status({},'第一轮。'));h.c.chat.push({is_user:true,mes:'第二次'});await h.reply(status({},'第二轮。'));
 const saved=h.r.getCheckpoint(),original=C.clone(h.c.chat);
 const resolve=chat=>I.restore(saved,{chat,identities:I.identify(chat),trail:C.fingerprint(chat),chatId:'new',branchId:'new'});
 let chat=C.clone(original);chat.splice(1,1);assert.ok(resolve(chat));
 chat=C.clone(original);chat[1].mes='编辑输入';assert.equal(resolve(chat),null);
 chat=C.clone(original);chat.splice(2,1);assert.equal(resolve(chat),null);
 chat=C.clone(original);chat.splice(3,1);assert.equal(resolve(chat),null);
 chat=C.clone(original);[chat[3],chat[5]]=[chat[5],chat[3]];assert.equal(resolve(chat),null);
 chat=C.clone(original);chat[5]=C.clone(chat[3]);assert.equal(resolve(chat),null);
 // Repeated assistant wording is still a different message, never an anchor.
 chat=C.clone(original);delete chat[5].extra;assert.equal(resolve(chat),null);
});

test('旧版迁移写出稳定身份，下一次删除普通输入后直接用ID恢复',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'补充'},{is_user:true,mes:'继续'});await h.reply(status({},'普通交谈。'));
 const old=h.r.getCheckpoint();delete old.identityTrail;delete old.previous;delete old.state.history_identity;delete old.state.processedByRevision;
 for(const m of h.c.chat){m.variables=[];delete m.extra;}
 h.adapter.readCheckpoints=async()=>[C.clone(old)];const fresh=createDispatcher(h.adapter,data);await fresh.ready();const migrated=fresh.getCheckpoint();assert.ok(migrated.identityTrail);assert.equal(migrated.state.history_identity.version,1);
 h.c.chat.splice(1,1);h.c.chatId='import';h.c.branchId='import';for(const m of h.c.chat)m.variables=[];h.adapter.readCheckpoints=async()=>[C.clone(migrated)];const imported=createDispatcher(h.adapter,data);await imported.ready();assert.equal(imported.getSnapshot().storyCount,1);await imported.flushCompleted();assert.equal(imported.getSnapshot().storyCount,1);
});

test('待执行行动的授权随消息ID移动，刷新后保持同一交易，不能被旧内存楼号覆盖',async()=>{
 const h=harness();await h.opening('赵无忧');h.r.registerPlugin(plugin());h.c.chat.push({is_user:true,mes:'补充'},{is_user:true,mes:'继续'});await h.reply(status({},'交谈结束。'));await h.select('exit');const tx=h.r.getSnapshot().pending.id;
 h.c.chat.splice(1,1);await h.r.restore();assert.equal(h.r.getSnapshot().pending.id,tx);assert.equal(h.r.getSnapshot().pending.floor,2);
 const fresh=createDispatcher(h.adapter,data);fresh.registerPlugin(plugin());await fresh.ready();assert.equal(fresh.getSnapshot().pending.floor,2);
 h.c.chat.push({is_user:false,mes:status({},'带回草药。')});await fresh.settleStory();assert.equal(fresh.getSnapshot().inventory.find(x=>x.name==='草药').count,1);assert.equal(fresh.getSnapshot().receipts[tx].floor,4);
});

test('原生候选extra随导入和候选次序移动，稳定ID跟随候选内容而不是数组槽位',()=>{
 const I=require('../src/runtime/message_identity'),m={mes:'候选甲',swipe_id:0,swipe_info:[{extra:{}},{extra:{}}]};
 const a=I.identify([m])[0];m.swipe_id=1;m.mes='候选乙';const b=I.identify([m])[0];assert.equal(a.messageId,b.messageId);assert.notEqual(a.revisionId,b.revisionId);
 const imported=JSON.parse(JSON.stringify(m));[imported.swipe_info[0],imported.swipe_info[1]]=[imported.swipe_info[1],imported.swipe_info[0]];imported.swipe_id=0;
 assert.equal(I.identify([imported])[0].revisionId,b.revisionId);imported.swipe_id=1;imported.mes='候选甲';assert.equal(I.identify([imported])[0].revisionId,a.revisionId);
 assert.deepEqual(Object.keys(imported.extra),['xsd2_identity']);
});

test('原生新候选复制旧extra且正文相同，也有独立回复版本',()=>{
 const I=require('../src/runtime/message_identity'),m={mes:'相同正文',swipe_id:0,swipe_info:[{extra:{}}]};const a=I.identify([m])[0];m.swipe_info.push(C.clone(m.swipe_info[0]));m.swipe_id=1;const b=I.identify([m])[0];assert.equal(a.messageId,b.messageId);assert.notEqual(a.revisionId,b.revisionId);assert.equal(I.identify([m])[0].revisionId,b.revisionId);
});

test('共享extra的克隆消息拆分ID，不改其他扩展字段且连续读取保持稳定',()=>{
 const I=require('../src/runtime/message_identity'),extra={other:123},chat=[{mes:'原消息',extra},{mes:'复制消息',extra}];const a=I.identify(chat),b=I.identify(chat);assert.notEqual(a[0].messageId,a[1].messageId);assert.deepEqual(a,b);assert.equal(chat[0].extra.other,123);assert.equal(chat[1].extra.other,123);
});

test('旧自设开局仅宏展开可验证迁移，保留原档；其他改文、换候选或丢编号不能借此绕过',async()=>{
 const h=harness();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{name:'青岚',date:{year:1578,month:3,day:3},realm:'金丹前期'}}});
 // Construct the exact v64 form: literal macros in its full opening trail.
 const I=require('../src/runtime/message_identity'),saved=h.r.getCheckpoint(),raw=h.c.chat[0].mes.replace('自设 · 青岚','自设 · {{user}}');h.c.chat[0].mes=raw;const oldIds=I.identify(h.c.chat);saved.identityTrail=oldIds;saved.trail=h.c.chat.map(m=>JSON.stringify([!!m.is_user,!!m.is_system,Number(m.swipe_id??0),String(m.mes??"")]));saved.state.history_identity.revisionId=oldIds[0].revisionId;
 h.c.chat[0].mes=raw.replaceAll('{{user}}','青岚');h.c.chat[0].variables=[];h.adapter.readCheckpoints=async()=>[C.clone(saved)];const r=createDispatcher(h.adapter,data);await r.ready();assert.equal(r.getSnapshot().identity,'自设');assert.ok(r.getSnapshot().openingMacroMigration);assert.equal(r.getCheckpoint().trail[0],C.fingerprint(h.c.chat)[0]);
 const c=()=>({chatId:h.c.chatId,branchId:h.c.branchId,chat:h.c.chat,trail:C.fingerprint(h.c.chat),identities:I.identify(h.c.chat)}),migrate=require('../src/runtime/opening_macros').migrateOpening;
 h.c.chat[0].mes+='多添一句';assert.equal(migrate(saved,c()),null);h.c.chat[0].mes=raw.replaceAll('{{user}}','青岚');h.c.chat[0].swipe_id=1;assert.equal(migrate(saved,c()),null);h.c.chat[0].swipe_id=0;delete h.c.chat[0].extra;assert.equal(migrate(saved,c()),null);
});


test('开局配置独立于展示正文：刷新、导入和首楼重排保留收益，切开局候选仍隔离',async()=>{
 const h=harness();await h.opening('赵无忧');const I=require('../src/runtime/message_identity');
 const root=I.identify(h.c.chat)[0],config=C.clone(h.r.getCheckpoint().state.openingConfig);
 h.c.chat[0].mes+='\n<div>宿主附加展示</div>';assert.deepEqual(I.identify(h.c.chat)[0],root);
 await h.r.restore();h.c.chat.push({is_user:true,mes:'探索'});await h.reply(status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。'));
 const saved=h.r.getCheckpoint();h.c.chat[0].mes='<div>开局展示重新排版</div>'+h.c.chat[0].mes;
 const fresh=createDispatcher(h.adapter,data);await fresh.restore();assert.equal(fresh.getSnapshot().storyCount,1);assert.equal(fresh.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);
 assert.deepEqual(fresh.getSnapshot().openingConfig,config);
 h.c.chatId='imported';h.c.branchId='imported';for(const m of h.c.chat)m.variables=[];h.adapter.readCheckpoints=async()=>[C.clone(saved)];
 const imported=createDispatcher(h.adapter,data);await imported.restore();assert.equal(imported.getSnapshot().storyCount,1);
 h.c.chat[0].swipe_id=1;await assert.rejects(imported.restore(),/保护存档/);
 h.c.chat[0].swipe_id=0;await imported.restore();assert.equal(imported.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);
 h.c.chat[0].mes='<IdentityMenu/>';await assert.rejects(imported.restore(),/保护存档/);
});

test('独立开局根不放行后续回复修改，重新选择同身份也不能借旧档',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'探索'});await h.reply(status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。'));
 h.c.chat.at(-1).mes=status({},'普通交谈。');await h.r.restore();await h.r.settleStory();assert.ok(!h.r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));
 const I=require('../src/runtime/message_identity'),root=I.identify(h.c.chat)[0],config=h.r.getCheckpoint().state.openingConfig;
 I.bindOpening(h.c.chat,config.config);assert.notEqual(I.identify(h.c.chat)[0].revisionId,root.revisionId);
 await assert.rejects(h.r.restore(),/保护存档/);
});

test('旧版未游玩自设首楼展示变化只迁移配置完全相同的记录',async()=>{
 const h=harness();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{name:'测试道友',realm:'金丹前期',date:{year:1578,month:3,day:3},origin:'测试来历'}}});
 // Recreate a pre-v67 root that used the complete body as its identity.
 delete h.c.chat[0].extra.xsd2_openings;delete h.c.chat[0].extra.xsd2_identity;
 const I=require('../src/runtime/message_identity'),e=h.r.getCheckpoint();e.identityTrail=I.identify(h.c.chat);e.trail=h.c.chat.map(m=>JSON.stringify([!!m.is_user,!!m.is_system,Number(m.swipe_id??0),String(m.mes??"")]));delete e.state.openingConfig;
 h.c.chat[0].variables=[];const legacyChat=C.clone(h.c.chat);h.adapter.readCheckpoints=async()=>[C.clone(e)];h.c.chat[0].mes='<div>附加展示</div>\n'+h.c.chat[0].mes;
 const fresh=createDispatcher(h.adapter,data);await fresh.restore();assert.equal(fresh.getSnapshot().identity,'自设');
 h.c.chat=C.clone(legacyChat);h.c.chat[0].mes=h.c.chat[0].mes.replace('测试来历','另一来历');await assert.rejects(createDispatcher(h.adapter,data).restore(),/保护存档/);
 h.c.chat=C.clone(legacyChat);h.c.chat[0].mes=JSON.parse(e.trail[0])[3].replace('金丹前期','元婴前期');await assert.rejects(createDispatcher(h.adapter,data).restore(),/保护存档/);
});


test('删楼组合不锁档：展示变化后删末楼/中间普通输入/中间结算，按可信前缀恢复',async()=>{
 const h=harness();await h.opening('赵无忧');const records=[h.r.getCheckpoint()];
 h.c.chat.push({is_user:true,mes:'补充说明'},{is_user:true,mes:'第一次探索'});await h.reply(status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。'));records.push(h.r.getCheckpoint());
 h.c.chat.push({is_user:true,mes:'第二次探索'});await h.reply(status({},'第二轮交谈。'));records.push(h.r.getCheckpoint());
 h.c.chat.push({is_user:true,mes:'第三次探索'});await h.reply(status({},'第三轮交谈。'));records.push(h.r.getCheckpoint());
 const original=C.clone(h.c.chat);h.adapter.readCheckpoints=async()=>C.clone(records);
 async function restore(chat){h.c.chat=chat;h.c.chat[0].mes='<div>宿主重排</div>'+h.c.chat[0].mes;const r=createDispatcher(h.adapter,data);await r.restore({afterDelete:true});assert.equal(r.getDiagnostics().recoveryFault,null);return r;}
 let chat=C.clone(original);chat.pop();let r=await restore(chat);assert.equal(r.getSnapshot().storyCount,2);assert.equal(r.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);
 chat=C.clone(original);chat.splice(1,1);r=await restore(chat);assert.equal(r.getSnapshot().storyCount,3);assert.equal(r.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);
 chat=C.clone(original);chat.splice(3,1);r=await restore(chat);assert.equal(r.getSnapshot().storyCount,0);assert.ok(!r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));
 await r.flushCompleted();assert.equal(r.getSnapshot().storyCount,0);assert.equal(r.getSnapshot().historyRecovery.kind,'delete');
 h.c.chat.push({is_user:true,mes:'继续交谈'},{is_user:false,mes:status({},'新一轮交谈。')});await r.settleStory();assert.equal(r.getSnapshot().storyCount,1);assert.ok(!r.getSnapshot().inventory.some(x=>x.name==='测试灵石'));
 const reload=createDispatcher(h.adapter,data);await reload.restore();assert.equal(reload.getSnapshot().storyCount,1);
 // Removing several ending turns restores the remaining last completed turn.
 chat=C.clone(original).slice(0,4);r=await restore(chat);assert.equal(r.getSnapshot().storyCount,1);
});


test('已游玩旧档核验后升级开局根，旧候选快照仍可恢复且删楼后不再受首楼改写影响',async()=>{
 const h=harness();await h.opening('赵无忧');delete h.c.chat[0].extra.xsd2_openings;delete h.c.chat[0].extra.xsd2_identity;
 const I=require('../src/runtime/message_identity');const root=h.r.getCheckpoint();root.identityTrail=I.identify(h.c.chat);root.trail=C.fingerprint(h.c.chat);delete root.state.openingConfig;delete root.previous;
 h.c.chat[0].variables=[{stat_data:{xsd2:[C.clone(root)]}}];h.adapter.readCheckpoints=async()=>[C.clone(root)];
 const legacy=createDispatcher(h.adapter,data);await legacy.restore();assert.ok(legacy.getSnapshot().openingConfig.source);
 h.c.chat.push({is_user:true,mes:'探索'},{is_user:false,mes:status({储物栏:'获得：测试灵石×1'},'你获得测试灵石。')});await legacy.settleStory();
 h.c.chat[0].mes='<div>更新后的展示</div>'+h.c.chat[0].mes;h.c.chat.pop();await legacy.restore({afterDelete:true});assert.equal(legacy.getSnapshot().storyCount,0);assert.ok(legacy.getSnapshot());
});


test('自设首遇仅在场名单仍核验好感并启用表，刷新/重roll不重复加；诊断可区分错误引用与漏报',async()=>{
 const h=harness();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{name:'测试道友',date:{year:1578,month:3,day:3}}}});
 assert.ok(h.prompts.at(-1).includes('测试道友'));assert.ok(h.prompts.at(-1).includes('</Status_block>之后'));
 h.c.chat.push({is_user:true,mes:'向同道致意'});
 const quote='叶红缨向测试道友颔首致谢。';
 await h.reply(status({在场:'叶红缨（同道）'},'<span>叶红缨</span>向测试道友颔首致谢。')+'<好感事件>叶红缨｜记心上｜依据：'+quote+'</好感事件>');
 assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,1);assert.ok(h.prompts.at(-1).includes('yh_gongyin'));
 assert.equal(h.r.getDiagnostics().favor.lastCheck.status,'applied');await h.r.restore();await h.r.flushCompleted();assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,1);
 h.c.chat.at(-1).swipe_id=1;h.c.chat.at(-1).mes=status({在场:'叶红缨'},'她只是等候你的回应。')+'<好感事件>叶红缨｜记心上｜依据：根本不存在的句子</好感事件>';
 await h.r.replay('swipe');await h.r.settleStory();assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,0);assert.equal(h.r.getDiagnostics().favor.lastCheck.evidence.matched,false);
 h.c.chat.push({is_user:true,mes:'请她喝酒'});await h.reply(status({在场:'叶红缨'},'她尚未接过酒盏。'));
 assert.equal(h.r.getDiagnostics().favor.lastCheck.status,'missing');assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,0);
});

test('多人救助好感真实调度：两人各结算、刷新不重复、换候选撤回再算、切回恢复',async()=>{
 const h=harness();await h.r.dispatchIntent({type:'SELECT_IDENTITY',payload:{identity:'自设',custom:{name:'测试道友',date:{year:1578,month:3,day:3}}}});
 h.c.chat.push({is_user:true,mes:'同时救助两人'});const quote='你舍身挡住崩落的巨石，将叶红缨和楚灵夜救出险地。';
 const report=name=>'<好感事件>'+name+'｜锚点 '+(name==='叶红缨'?'yh':'cl')+'_shengjiu｜依据：'+quote+'</好感事件>';
 await h.reply(status({在场:'叶红缨、楚灵夜'},quote)+report('叶红缨')+report('楚灵夜'));
 const original=C.clone(h.c.chat.at(-1));let s=h.r.getSnapshot();assert.equal(s.stat_data.character_metrics.叶红缨.好感度,20);assert.equal(s.stat_data.character_metrics.楚灵夜.好感度,20);assert.equal(s.lastMetricEvents.length,2);assert.equal(h.r.getDiagnostics().favor.checks.length,2);
 await h.r.restore();await h.r.flushCompleted();assert.equal(h.r.getSnapshot().stat_data.favor_log.楚灵夜.length,1);
 h.c.chat.at(-1).swipe_id=1;h.c.chat.at(-1).mes=status({在场:'叶红缨、楚灵夜'},quote)+report('楚灵夜');await h.r.replay('swipe');await h.r.settleStory();
 s=h.r.getSnapshot();assert.equal(s.stat_data.character_metrics.叶红缨.好感度,0);assert.equal(s.stat_data.character_metrics.楚灵夜.好感度,20);
 h.c.chat.at(-1).swipe_id=0;h.c.chat.at(-1).mes=original.mes;await h.r.restore();s=h.r.getSnapshot();assert.equal(s.stat_data.character_metrics.叶红缨.好感度,20);assert.equal(s.stat_data.character_metrics.楚灵夜.好感度,20);
});

test('多人申报中一人正文惩罚不清空其他人合法好感，也不被重复申报冲销',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'本轮互动'});
 const quote='叶红缨向你颔首致谢。';await h.reply(status({在场:'叶红缨、楚灵夜'},'你强行非礼楚灵夜。'+quote)+'<好感事件>楚灵夜｜记心上｜依据：你强行非礼楚灵夜。</好感事件><好感事件>叶红缨｜记心上｜依据：'+quote+'</好感事件>');
 const s=h.r.getSnapshot();assert.equal(s.stat_data.character_metrics.楚灵夜.好感度,-51);assert.equal(s.stat_data.character_metrics.叶红缨.好感度,1);assert.equal(s.stat_data.favor_log.楚灵夜.length,1);assert.equal(s.lastMetricEvents[0].character,'叶红缨');
});

test('GM好感保存后前一回复仅被重排正文，下个普通回合仍保留人工覆盖',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'交谈'});await h.reply(status({在场:'叶红缨'},'她向你颔首。'));
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':20}});assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,20);
 h.c.chat.at(-1).mes='<div>宿主重排</div>'+h.c.chat.at(-1).mes;
 h.c.chat.push({is_user:true,mes:'继续交谈'});await h.reply(status({在场:'叶红缨'},'她听你说完。'));
 assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,20);
});


test('故事自创物品无需注册或取物句式，刷新不重复、后续获得累加',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'收下赠礼'});
 await h.reply(status({储物栏:'获得：故事星砂×2（赠礼）'},'匣盖合拢，她微笑告别。'));
 const amount=()=>h.r.getSnapshot().inventory.find(x=>x.name==='故事星砂')?.count;
 assert.equal(amount(),2);await h.r.restore();await h.r.flushCompleted();assert.equal(amount(),2);
 h.c.chat.push({is_user:true,mes:'继续探索'});await h.reply(status({储物栏:'获得：故事星砂×3'},'行囊又添收获。'));assert.equal(amount(),5);
 assert.equal(h.r.getDiagnostics().inventory.items.find(x=>x.name==='故事星砂').count,5);
});

test('GM背包编辑不冻结后续入库或反复覆盖数量',async()=>{
 const h=harness();await h.opening('赵无忧');await h.r.dispatchIntent({type:'GM_PATCH',payload:{inventory:[{id:'故事旧物',name:'故事旧物',count:2}]}});
 h.c.chat.push({is_user:true,mes:'收获'});await h.reply(status({储物栏:'获得：故事旧物×1｜获得：故事新物×1'},'归来。'));
 assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='故事旧物').count,3);assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='故事新物').count,1);
 h.c.chat.push({is_user:true,mes:'休息'});await h.reply(status({},'风平浪静。'));await h.r.restore();assert.equal(h.r.getSnapshot().inventory.find(x=>x.name==='故事旧物').count,3);
});

test('GM好感不借给另一个候选；交还自动后重排也不复活旧锁',async()=>{
 const h=harness();await h.opening('赵无忧');h.c.chat.push({is_user:true,mes:'交谈'});await h.reply(status({在场:'叶红缨'},'她颔首。'));
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':20}});
 h.c.chat.at(-1).swipe_id=1;h.c.chat.at(-1).mes=status({在场:'叶红缨'},'另一个候选。');await h.r.replay('swipe');await h.r.settleStory();assert.equal(h.r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,0);
 await h.r.dispatchIntent({type:'GM_PATCH',payload:{'metric.叶红缨.好感度':20}});await h.r.dispatchIntent({type:'GM_RELEASE',payload:{keys:['metric.叶红缨.好感度']}});
 h.c.chat.at(-1).mes='<div>排版</div>'+h.c.chat.at(-1).mes;h.c.chat.push({is_user:true,mes:'继续'});await h.reply(status({在场:'叶红缨'},'继续交谈。'));
 assert.equal(h.r.getSnapshot().manual['metric.叶红缨.好感度'],undefined);
});

test('摘要指纹兼容旧全文且检查编辑/候选变化，长正文不进入快照',()=>{
 assert.equal(C.matches(C.fingerprint([{mes:'😀'}]),C.fingerprint([{mes:'😃'}])),false);
 const text='前文🌙'.repeat(3000),chat=[{mes:text,is_user:true},{mes:'回复',is_user:false}];
 const legacy=chat.map(m=>JSON.stringify([!!m.is_user,!!m.is_system,0,m.mes])),modern=C.fingerprint(chat);
 assert.ok(JSON.stringify(modern).length<500);assert.ok(C.matches(legacy,modern));assert.ok(C.matchesSnapshot(legacy,modern));assert.deepEqual(C.compactTrail(legacy),modern);
 chat[0].mes+='修改';assert.equal(C.matches(modern,C.fingerprint(chat)),false);assert.equal(C.matchesSnapshot(modern,C.fingerprint(chat)),false);
 chat[0].mes=text;chat[1].mes='只改助手展示';assert.equal(C.matches(modern,C.fingerprint(chat)),false);assert.ok(C.matchesSnapshot(modern,C.fingerprint(chat)));
 chat[1].swipe_id=1;assert.equal(C.matchesSnapshot(modern,C.fingerprint(chat)),false);
 const command=C.fingerprint([{mes:'XSD2_test_123',is_user:true}]);assert.equal(C.trailAction(JSON.parse(command[0])[3]),true);
});
