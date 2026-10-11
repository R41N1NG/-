"use strict";
const { startingInventoryFor } = require("../src/runtime/starting_inventory");
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const { createDispatcher } = require("../src/runtime/dispatcher"),
  C = require("../src/runtime/contracts"),
  data = require("../tools/data.cjs").load(path.join(__dirname, "..")),
  plugin = require("../src/plugins/youjigu_map"),
  tree = require("../src/plugins/youjigu_map/event_tree");
function fixture() {
  const chat = [{ mes: "<IdentityMenu/>", variables: [] }],
    sent = [];
  let confirm = true,
    abort = false;
  const adapter = {
    context: () => ({ chatId: "integration", chat }),
    readMessage: async (i) =>
      C.clone(chat[i]?.variables?.[chat[i]?.swipe_id || 0] || {}),
    persist: async (c, e) => {
      chat[c.floor].variables ??= [];
      chat[c.floor].variables[chat[c.floor].swipe_id || 0] = {
        stat_data: { ...C.clone(e.state.stat_data), xsd2: [C.clone(e)] },
      };
    },
    replaceOpening: async (t) => (chat[0].mes = t),
    replaceStory: async (i, t) => (chat[i].mes = t),
    send: async (t) => {
      sent.push(t);
      chat.push({ mes: t, is_user: true });
      abort = false;
    },
    preflightSend() {},
    confirmExit: async () => confirm,
    isAborted: () => abort,
    setPrompt() {},
  };
  const r = createDispatcher(adapter, data);
  r.registerPlugin(plugin);
  const click = (id) => {
    const s = r.getSnapshot();
    return r.dispatchIntent({
      type: "SELECT_NODE",
      pluginId: plugin.id,
      expected: {
        chatId: s.chatId,
        branchId: s.branchId,
        floor: s.floor,
        revision: s.revision,
      },
      payload: { nodeId: id },
    });
  };
  const reply = async (prose, fields = {}) => {
    chat.push({
      mes:
        prose +
        "\n<Status_block>" +
        Object.entries({ 历时: "—", ...fields })
          .map(([k, v]) => "<" + k + ">" + v + "</" + k + ">")
          .join("") +
        "</Status_block>",
      is_user: false,
      swipe_id: 0,
    });
    return r.settleStory();
  };
  const act = async (id, text, fields) => {
    await click(id);
    await reply(text, fields);
  };
  const ready = () =>
    r.dispatchIntent({
      type: "SELECT_IDENTITY",
      payload: { identity: "赵无忧" },
    });
  return {
    r,
    chat,
    sent,
    click,
    reply,
    act,
    ready,
    confirm: (v) => (confirm = v),
    abort: (v) => (abort = v),
  };
}
test("真实插件+调度器：完整地图钥匙/密室/退出路线及奖励时间一次结算", async () => {
  const h = fixture();
  await h.ready();
  await h.click("g7p2");
  assert.equal(h.r.getSnapshot().activeEvent, null);
  await h.reply("你正式步入幽寂谷之中。");
  let s = h.r.getSnapshot();
  assert.equal(s.activeEvent.step, "first");
  assert.equal(
    tree
      .getAvailableOptions(s.pluginState[plugin.id], s.storyCount)
      .find((x) => x.id === "k4m8").remainingTtl,
    3,
  );
  await h.act("k4m8", "你推开石门，步入洞府之中。");
  await h.act("q3f7", "你从暗格取出幽寂谷地图，并将地图收入纳戒。", {
    纳戒: "获得：幽寂谷地图×1",
  });
  s = h.r.getSnapshot();
  assert.equal(s.inventory.find((x) => x.name === "幽寂谷地图").count, 1);
  assert.equal(s.known.map_youjigu, true);
  assert.equal(plugin.select(s, "b8n2").allowed, false);
  await h.act("h5w9", "你退出洞府，继续深入幽寂谷腹地。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "second");
  await h.act("v4t7", "你对照地图，进入石壁后的密室。");
  await h.act("p1x6", "你从左侧暗格取得法宝，收入纳戒。");
  assert.equal(plugin.select(h.r.getSnapshot(), "t6v4").allowed, false);
  h.confirm(false);
  const revision = h.r.getSnapshot().revision;
  assert.deepEqual(await h.click("e3j9"), { cancelled: true });
  assert.equal(h.r.getSnapshot().revision, revision);
  h.confirm(true);
  await h.act("e3j9", "你走出隐蔽出口，离开幽寂谷。", { 历时: "二日" });
  s = h.r.getSnapshot();
  assert.equal(s.calendarDate.day, 5);
  assert.equal(s.activeEvent, null);
  assert.equal(s.pluginState[plugin.id].step, "done");
  assert.equal(s.inventory.filter(x => x.source === plugin.id).length, 2);
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  assert.equal(h.sent.length, 7);
});
test("真实插件+调度器：铁匣/普通古卷/否定正文和状态栏声明均不能冒充地图", async () => {
  for (const body of [
    "你取得沉重铁匣，里面没有地图，也没有取得任何地图。",
    "你从暗格取出普通古卷，封面毫无标记。",
    "你静静等待。",
  ]) {
    const h = fixture();
    await h.ready();
    await h.act("g7p2", "你进入幽寂谷。");
    await h.act("k4m8", "你步入洞府。");
    await h.act(
      "q3f7",
      body + '<Youjigu_result id="q3f7" outcome="success"/>',
      { 线索: "你已获得幽寂谷地图", 纳戒: "无" },
    );
    const s = h.r.getSnapshot();
    assert.notEqual(s.known.map_youjigu, true);
    assert.deepEqual(s.inventory, startingInventoryFor("赵无忧"));
    assert.equal(s.pending, null);
    assert.equal(plugin.select(s, "q3f7").allowed, true);
  }
});
test("真实插件+调度器：门外计划不推进，停止删助手楼能重选", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  await h.act("k4m8", "你准备进入洞府，仍站在门外观察许久。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "first");
  await h.click("k4m8");
  h.chat.push({ mes: "未完成的片段", is_user: false });
  h.abort(true);
  await h.r.stop();
  h.chat.pop();
  await h.r.restore();
  assert.equal(h.r.getSnapshot().pending, null);
  assert.equal(h.r.getSnapshot().activeEvent.step, "first");
  assert.equal(plugin.select(h.r.getSnapshot(), "k4m8").allowed, true);
});
test("真实插件+调度器：入口TTL耗尽后显示的山谷可实际选择，GM门禁与日期投影一致", async () => {
  // The final available turn must remain valid when its assistant reply completes.
  const last = fixture();
  await last.ready();
  await last.act("g7p2", "你进入幽寂谷。");
  for (let i = 0; i < 2; i++) {
    last.chat.push({ mes: "观察", is_user: true });
    await last.reply("你静候山风。");
  }
  await last.act("k4m8", "你步入洞府。");
  assert.equal(last.r.getSnapshot().activeEvent.step, "cave");

  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  for (let i = 0; i < 5; i++) {
    h.chat.push({ mes: "观察", is_user: true });
    await h.reply("你静候山风。");
  }
  let s = h.r.getSnapshot();
  assert.ok(
    tree
      .getAvailableOptions(s.pluginState[plugin.id], s.storyCount)
      .some((x) => x.id === "u9h3"),
  );
  assert.equal(plugin.select(s, "u9h3").allowed, true);
  await h.r.dispatchIntent({
    type: "GM_PATCH",
    payload: { "known.map_youjigu": true },
  });
  assert.equal(plugin.select(h.r.getSnapshot(), "v4t7").allowed, true);
  await h.act("u9h3", "你抵达幽寂谷深处山谷。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "valley");
});
test("真实插件+调度器：山涧/草药/正常出口及提前退出耗时", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  await h.act("s9a3", "你抵达山涧。");
  await h.act("r2c6", "你驻足细看溪水中的水波。");
  await h.act("a6d4", "你拨开草丛，仔细查看树丛。");
  await h.act("j8e1", "你退出山涧，继续深入谷中腹地。");
  await h.act("u9h3", "你来到深处山谷。");
  await h.act("n5z8", "你采下草药，妥善收入囊中。");
  await h.act("l7q2", "你沿山径离开幽寂谷。");
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  assert.ok(h.r.getSnapshot().inventory.some(x => x.name === "草药"));
  const early = fixture();
  await early.ready();
  await early.act("g7p2", "你进入幽寂谷。");
  await early.act("z8u5", "你收步折返，离开幽寂谷。");
  assert.equal(early.r.getSnapshot().calendarDate.day, 4);
});
test("真实地图DOM：圆点与短标签、时间外无点、卸载清理", () => {
  const { JSDOM } = require("jsdom"),
    d = new JSDOM("<div data-slot></div>"),
    doc = d.window.document;
  let s = {
    identity: "赵无忧",
    calendarDate: { year: 1578, month: 8, day: 1 },
    storyCount: 0,
    known: {},
    pluginState: {},
  };
  const callbacks = new Set();
  const r = {
    getSnapshot: () => s,
    subscribe: (f) => {
      callbacks.add(f);
      return () => callbacks.delete(f);
    },
    dispatchIntent: async () => {},
  };
  const unmount = plugin.mount(doc.querySelector("[data-slot]"), r);
  doc.querySelector(".xsd2-map-trigger-btn").click();
  assert.equal(doc.querySelectorAll(".yj-pin").length, 0);
  s = { ...s, calendarDate: { year: 1578, month: 3, day: 3 } };
  for (const f of [...callbacks]) f();
  assert.equal(doc.querySelectorAll(".yj-pin").length, 1);
  assert.equal(doc.querySelector(".yj-pin").style.borderRadius, "50%");
  assert.equal(doc.querySelector(".yj-pin span").textContent, "幽寂谷");
  unmount();
  assert.equal(callbacks.size, 0);
  assert.equal(doc.querySelector(".xsd2-map-modal-overlay"), null);
  d.window.close();
});
