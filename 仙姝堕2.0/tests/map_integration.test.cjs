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
    errors: [],
    report(error) { this.errors.push(error.message); },
    prompts: [],
    setPrompt(text) { this.prompts.push(text); },
  };
  const testData = {
    ...data,
    greetings: {
      ...data.greetings,
      赵无忧: data.greetings.赵无忧.replace("3月3日", "4月3日"),
    },
  };
  const r = createDispatcher(adapter, testData);
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
    errors: adapter.errors,
    prompts: adapter.prompts,
    click,
    reply,
    act,
    ready,
    confirm: (v) => (confirm = v),
    abort: (v) => (abort = v),
  };
}

test("真实插件+调度器：完整地图路线及奖励时间一次结算", async () => {
  const h = fixture();
  await h.ready();
  await h.click("g7p2");
  assert.equal(h.r.getSnapshot().activeEvent, null);
  await h.reply("你正式步入幽寂谷之中。");
  let s = h.r.getSnapshot();
  assert.equal(s.activeEvent.step, "first");
  assert.equal(plugin.select(s, "b3m8").allowed, true);

  // 1. 选择 B1 潜行尾随
  await h.act("b3m8", "你运转匿气秘术，悄然潜行尾随二人深入深谷。");
  s = h.r.getSnapshot();
  assert.equal(s.activeEvent.step, "valley_deep");
  assert.equal(
    tree
      .getAvailableOptions(s.pluginState[plugin.id], s.storyCount)
      .find((x) => x.id === "q5w4").remainingTtl,
    2,
  );

  // 2. 隔门察危
  await h.act("q5w4", "你潜至石室门外，察觉门内粉雾弥漫与玄机子异动。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "chamber_gate");

  // 3. 阵力破门
  await h.act("t7r1", "你运转灵力轰开石门，杀入石室撞破暗局，玄机子惊退。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "chamber_inside");

  // 4. 石室决断 (自由回合)
  await h.act("x8f2", "你以清凉佩纯净真气温和相助，为其披衣护持，平息惑心幻力。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "chamber_rescue");

  // 5. 退出确认机制
  h.confirm(false);
  const revision = h.r.getSnapshot().revision;
  assert.deepEqual(await h.click("v4k6"), { cancelled: true });
  assert.equal(h.r.getSnapshot().revision, revision);

  // 确认退出并结算
  h.confirm(true);
  await h.act("v4k6", "你收起清凉玉佩，护持师姐离开深谷，整队飞舟凯旋归宗。", {
    历时: "二日",
    纳戒: "获得：清凉玉佩×1",
  });
  s = h.r.getSnapshot();
  assert.equal(s.calendarDate.day, 5);
  assert.equal(s.activeEvent, null);
  assert.equal(s.pluginState[plugin.id].step, "done");
  assert.equal(s.inventory.find((x) => x.name === "清凉玉佩").count, 1);
  assert.equal(s.known["识破玄机子幽寂谷暗局"], true);
  assert.equal(s.known["幽寂谷救下叶红缨"], true);
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
});

test("固定终点奖励清凉玉佩不依赖模型措辞：古玉/佩饰/漏报均不撤销点选奖励", async () => {
  for (const body of [
    "你取得普通古佩，表面刻有符文。",
    "你拾起清凉佩，收入袖中。",
    "你静静等待，收拾妥当起行。",
  ]) {
    const h = fixture();
    await h.ready();
    await h.act("g7p2", "你进入幽寂谷。");
    await h.act("b3m8", "你潜行尾随二人。");
    await h.act("q5w4", "你察看石室动静。");
    await h.act("t7r1", "你轰开石门。");
    await h.act("x8f2", "你温和施救。");
    await h.act(
      "v4k6",
      body + '<Youjigu_result id="v4k6" outcome="success"/>',
      { 线索: "你已获得清凉玉佩", 纳戒: "无" },
    );
    const s = h.r.getSnapshot();
    assert.equal(s.known["识破玄机子幽寂谷暗局"], true);
    assert.equal(s.inventory.find((x) => x.name === "清凉玉佩").count, 1);
    assert.equal(s.pending, null);
    assert.equal(plugin.select(s, "v4k6").allowed, false);
  }
});

test("真实插件+调度器：移动由点选确认，停止删助手楼仍回退可重选", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  await h.reply("你在谷口岔路观察片刻。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "first");
  await h.click("b3m8");
  h.chat.push({ mes: "未完成的片段", is_user: false });
  h.abort(true);
  await h.r.stop();
  h.chat.pop();
  await h.r.restore();
  assert.equal(h.r.getSnapshot().pending, null);
  assert.equal(h.r.getSnapshot().activeEvent.step, "first");
  assert.equal(plugin.select(h.r.getSnapshot(), "b3m8").allowed, true);
});

test("真实插件+调度器：深涧TTL耗尽后隔门察危隐匿，GM门禁与日期投影一致", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  await h.act("b3m8", "你潜行尾随。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "valley_deep");

  // 在深涧中停留 3 轮
  for (let i = 0; i < 3; i++) {
    h.chat.push({ mes: "观察四周", is_user: true });
    await h.reply("山风呼啸，雾气弥漫。");
  }

  let s = h.r.getSnapshot();
  // 3轮有效故事后，TTL=3 的 q5w4 超时隐匿
  assert.ok(
    !tree
      .getAvailableOptions(s.pluginState[plugin.id], s.storyCount)
      .some((x) => x.id === "q5w4"),
  );
  assert.equal(plugin.select(s, "q5w4").allowed, false);
});

test("真实插件+调度器：分支C三人同行平稳归宗及提前退出耗时", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  await h.act("c9k2", "你当面拒绝分兵，坚持三人同行。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "valley_trio");
  await h.act("m7h4", "三人同抵粉雾洞口，暗自提防。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "chamber_trio_gate");
  await h.act("x3v8", "直面残阵机关，稳健破除异象。");
  assert.equal(h.r.getSnapshot().activeEvent.step, "chamber_trio_cleared");

  await h.click("p6w1");
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  await h.reply("三人返回营地汇合弟子，飞舟起驾返回宗门复命。", { 历时: "二日" });
  assert.equal(h.r.getSnapshot().stat_data.历时, "2日");
  assert.equal(h.r.getSnapshot().calendarDate.day, 5);
  assert.equal(h.r.getSnapshot().known["幽寂谷历练安澜无恙"], true);
  assert.equal(h.r.getSnapshot().known["挫败玄机子独行图谋"], true);

  const settlements = Object.values(h.r.getSnapshot().settlements);
  assert.equal(settlements.length, 1);
  assert.equal(settlements[0].mode, "separate");

  // 提前退出测试：耗时 1 日
  const early = fixture();
  await early.ready();
  await early.act("g7p2", "你进入幽寂谷。");
  await early.act("z8u5", "你收步折返，提前离开幽寂谷。");
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
  // 三月初三（开场白时段）：尚未开放，pins 为 0
  s = { ...s, calendarDate: { year: 1578, month: 3, day: 3 } };
  for (const f of [...callbacks]) f();
  assert.equal(doc.querySelectorAll(".yj-pin").length, 0);
  // 四月初三：幽寂谷正式开放，pins 为 1
  s = { ...s, calendarDate: { year: 1578, month: 4, day: 3 } };
  for (const f of [...callbacks]) f();
  assert.equal(doc.querySelectorAll(".yj-pin").length, 1);
  assert.equal(doc.querySelector(".yj-pin").style.borderRadius, "50%");
  assert.equal(doc.querySelector(".yj-pin span").textContent, "幽寂谷");
  unmount();
  assert.equal(callbacks.size, 0);
  assert.equal(doc.querySelector(".xsd2-map-modal-overlay"), null);
  d.window.close();
});

test("玩家授权移动不由模型裁决：实测两人入谷/异样措辞都开放子节点，无点击不推进", async () => {
  const fs = require("node:fs");
  const reported = fs.readFileSync(path.join(__dirname,"fixtures/youjigu-entry-reported.txt"),"utf8");
  for (const prose of [reported, "山風沿著夾道吹來。", '你未能进入幽寂谷。<Youjigu_result id="g7p2" outcome="failure"/>']) {
    const h = fixture();
    await h.ready();
    await h.reply(prose);
    assert.equal(h.r.getSnapshot().activeEvent, null);
    await h.click("g7p2");
    assert.equal(h.r.getSnapshot().activeEvent, null);
    await h.reply(prose);
    const s = h.r.getSnapshot();
    assert.equal(s.activeEvent.step, "first");
    assert.equal(s.stat_data.地点, "幽寂谷·谷口岔路");
    assert.equal(s.lastNodeResult.evidenceMode, "PLAYER_CHOICE_CONFIRMED");
    assert.equal(plugin.select(s,"g7p2").allowed, false);
    assert.equal(plugin.select(s,"a7x1").allowed, true);
    assert.equal(plugin.select(s,"b3m8").allowed, true);
    assert.equal(plugin.select(s,"c9k2").allowed, true);
    const revision = s.revision;
    await h.r.settleStory();
    assert.equal(h.r.getSnapshot().revision, revision);
  }
});

test("确认退出同样由点选决定：模型位置申报不能覆盖退出，耗时只结算一次", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "山风吹过。");
  h.confirm(false);
  const revision = h.r.getSnapshot().revision;
  assert.deepEqual(await h.click("z8u5"), {cancelled:true});
  assert.equal(h.r.getSnapshot().revision, revision);
  h.confirm(true);
  await h.click("z8u5");
  assert.equal(h.r.getSnapshot().calendarDate.day, 4);
  assert.match(h.prompts.at(-1), /1578年4月4日/);
  await h.reply("夜色深沉。", {地点:"幽寂谷·谷口",历时:"九日"});
  assert.equal(h.r.getSnapshot().activeEvent, null);
  assert.equal(h.r.getSnapshot().stat_data.地点, "幽寂谷外");
  assert.equal(C.parseStatus(h.chat.at(-1).mes).fields.地点, "幽寂谷外");
  assert.equal(h.r.getSnapshot().calendarDate.day, 4);
  assert.equal(h.r.getSnapshot().stat_data.历时, "1日");
  assert.equal(Object.values(h.r.getSnapshot().receipts).at(-1).elapsedDays, 1);
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().calendarDate.day, 4);
});

test("内部代码与显示分离，互斥点击即锁互斥，完成/重载不重复发奖", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "山风萧瑟。");
  await h.click("b3m8");
  const selected = h.r.getSnapshot();
  const code = h.sent.at(-1);
  assert.match(code, /^XSD2_b3m8_[a-f0-9]{8}$/);
  assert.equal(h.r.getActionDisplay(code), "潜行尾随");
  assert.equal(selected.pending?.nodeId, "b3m8");
  h.chat.at(-1).mes = code + " 暗中观察";
  await h.reply("你潜行尾随二人进入深谷。");
  const settledSnap = h.r.getSnapshot();
  assert.equal(settledSnap.pluginState[plugin.id].mutex["yig_fork"], "潜行尾随");
  assert.equal(plugin.select(settledSnap, "b3m8").allowed, false);
  assert.equal(plugin.select(settledSnap, "a7x1").allowed, false);
  assert.equal(plugin.select(settledSnap, "c9k2").allowed, false);
  await h.r.restore();
  await h.r.settleStory();
  assert.equal(plugin.select(h.r.getSnapshot(), "a7x1").allowed, false);
});

test("互斥选择撤回与非授权文字拦截", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "谷风吹过。");
  await h.click("b3m8");
  await h.r.stop();
  assert.ok(!h.r.getSnapshot().pluginState[plugin.id]?.mutex["yig_fork"]);
  h.chat.pop();
  await h.r.restore();
  assert.equal(plugin.select(h.r.getSnapshot(), "a7x1").allowed, true);
  assert.equal(plugin.select(h.r.getSnapshot(), "b3m8").allowed, true);
  assert.equal(plugin.select(h.r.getSnapshot(), "c9k2").allowed, true);
});

test("已入包清凉玉佩重复申报先去重：玉佩/清凉佩称呼不误报，不产生第二种物品", async () => {
  for (const name of ["清凉玉佩", "玉佩", "清凉佩", "辟幻佩"]) {
    const h = fixture();
    await h.ready();
    await h.act("g7p2", "谷风吹过。");
    await h.act("b3m8", "潜行尾随。");
    await h.act("q5w4", "察看门内。");
    await h.act("t7r1", "轰碎石门。");
    await h.act("x8f2", "温和救护。");
    await h.act("v4k6", "起驾飞舟归宗。", { 纳戒: "获得：" + name + "×1" });
    assert.deepEqual(h.errors, []);
    assert.equal(h.r.getSnapshot().inventory.find((x) => x.name === "清凉玉佩").count, 1);
    assert.equal(h.r.getSnapshot().inventory.filter((x) => x.source === plugin.id).length, 1);
  }
});

test("统一正文范围模板：入谷提示三大真实分流，互斥关闭机关不再邀请", async () => {
  const h = fixture();
  await h.ready();
  await h.click("g7p2");
  let prompt = h.prompts.at(-1);
  assert.ok(prompt.includes("以大局为重引队回营"));
  assert.ok(prompt.includes("假意应允而暗中潜行尾随"));
  assert.ok(prompt.includes("当面拒绝分兵提议"));
  assert.ok(prompt.includes("不能替玩家进入"));
  await h.reply("山风吹过。");
  await h.act("b3m8", "暗中潜行尾随。");
  prompt = h.prompts.at(-1);
  const options = prompt.split("当前可供玩家选择的行动或路线：")[1].split("。\n")[0];
  assert.ok(options.includes("循迹摸至深涧石室外"));
  assert.ok(!options.includes("引队回营"));
  assert.ok(!options.includes("三人同行"));
});

test("末段完成后提前离开消失且后台拒绝旧入口，未完成仍可提前走", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "谷口风起。");
  await h.act("b3m8", "潜行尾随。");
  await h.act("q5w4", "察看门内。");
  await h.act("t7r1", "轰碎石门。");
  await h.act("x8f2", "温和救护。");
  assert.equal(plugin.select(h.r.getSnapshot(), "z8u5").allowed, true);
  await h.act("v4k6", "飞舟归宗。");
  const s = h.r.getSnapshot();
  assert.ok(
    !tree
      .getAvailableOptions(s.pluginState[plugin.id], s.storyCount)
      .some((x) => x.id === "z8u5"),
  );
  assert.equal(plugin.select(s, "z8u5").allowed, false);
  await assert.rejects(h.click("z8u5"), /探索已完成/);
});

test("退出点选后的新日期可随停止删楼恢复，重选完成不重复推进", async () => {
  const h = fixture();
  await h.ready();
  await h.act("g7p2", "你进入幽寂谷。");
  await h.click("z8u5");
  assert.equal(h.r.getSnapshot().calendarDate.day, 4);
  await h.r.stop();
  assert.equal(h.r.getSnapshot().calendarDate.day, 3);
  assert.ok(h.r.getSnapshot().activeEvent);
  h.chat.pop();
  await h.r.restore();
  assert.equal(h.r.getSnapshot().calendarDate.day, 3);
  await h.act("z8u5", "你离开幽寂谷。");
  await h.r.restore();
  assert.equal(h.r.getSnapshot().calendarDate.day, 4);
  assert.equal(h.r.getSnapshot().activeEvent, null);
});
