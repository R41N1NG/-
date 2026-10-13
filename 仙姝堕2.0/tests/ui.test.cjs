"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { mountHUD, PORTRAIT_CDN } = require("../src/ui/status_panel"),
  C = require("../src/runtime/contracts"),
  data = require("../tools/data.cjs").load(path.join(__dirname, ".."));
function dom() {
  const d = new JSDOM(
    "<!doctype html><html><head></head><body><main></main></body></html>",
  );
  d.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  d.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new d.window.Event("close"));
  };
  return d;
}
test("HUD真实DOM：折叠、快捷发送、物品、立绘、GM提交与卸载", async () => {
  const d = dom(),
    doc = d.window.document,
    calls = [],
    listeners = new Set(),
    R = data.rules({});
  const s = {
    identity: "赵无忧",
    calendarDate: { year: 1578, month: 3, day: 3 },
    known: Object.fromEntries(R.ALL_FIELDS.map((k) => [k, false])),
    inventory: [{ id: "草药", name: "草药", count: 1 }],
    manual: {},
    stat_data: {
      身份: "赵无忧",
      地点: "谷口",
      修为: "金丹中期",
      段位: 1,
      名器归属: {},
      known: {},
      在场角色: [{ 名: "孤月", 关系: "同门", 神态: "静立", 心境: "平静" }],
    },
  };
  s.stat_data.inventory = s.inventory;
  s.stat_data.known = s.known;
  const runtime = {
    getSnapshot: () => C.clone(s),
    subscribe: (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    dispatchIntent: async (x) => {
      calls.push(x);
    },
    stop: async () => {},
    uiPlugins: [],
  };
  const panel = mountHUD(
    doc,
    doc.querySelector("main"),
    runtime,
    data,
    () => {},
  );
  assert.equal(doc.querySelectorAll("details").length, 3);
  assert.ok([...doc.querySelectorAll("details")].every((x) => !x.open));
  doc.querySelector("details").open = true;
  panel.render();
  assert.equal(doc.querySelector("details").open, true);
  assert.equal(doc.querySelector("[data-action]"),null);
  doc.querySelector("[data-item]").click();
  assert.deepEqual(calls.map(x=>x.type), []);
  assert.match(doc.querySelector("dialog").textContent, /介绍.*效果/s);
  assert.equal(doc.querySelector("[data-close]").textContent, "×");
  doc.querySelector("[data-close]").click();
  assert.equal(doc.querySelector("dialog"), null);
  doc.querySelector("[data-item]").click();
  doc.querySelector("[data-use]").click();
  await Promise.resolve();
  assert.deepEqual(
    calls.map((x) => x.type),
    ["USE_ITEM"],
  );
  doc.querySelector("[data-item]").click();
  doc.querySelector("[data-discard]").click();
  await Promise.resolve();
  assert.equal(calls.at(-1).type, "DISCARD_ITEM");
  doc.querySelector("[data-portrait]").click();
  const dialogSrc = doc.querySelector("dialog img").src;assert.ok(dialogSrc.endsWith("guyue.png") || dialogSrc === PORTRAIT_CDN["guyue.png"]);
  doc.querySelector("[data-close]").click();
  assert.equal(doc.querySelector("dialog"), null);
  doc.querySelector("[data-gm]").click();
  const form = doc.querySelector("dialog form");
  form.elements.rank.value = "4";
  const previous = global.FormData;
  global.FormData = d.window.FormData;
  await form.onsubmit({ preventDefault() {} });
  global.FormData = previous;
  assert.deepEqual(calls.at(-1), { type: "GM_PATCH", payload: { 段位: 4 } });
  panel.destroy();
  assert.equal(listeners.size, 0);
  assert.equal(doc.querySelector(".xsd2-hud"), null);
  assert.equal(doc.querySelector("style"), null);
  d.window.close();
});
test("插件DOM生命周期随状态更新和销毁清理，无重复订阅", () => {
  const d = dom(),
    doc = d.window.document,
    listeners = new Set();
  let mounts = 0,
    unmounts = 0;
  const s = {
    identity: "赵无忧",
    calendarDate: { year: 1578, month: 3, day: 3 },
    known: {},
    inventory: [],
    manual: {},
    stat_data: { 段位: 1, 名器归属: {}, 在场角色: [] },
  };
  const r = {
    getSnapshot: () => s,
    subscribe: (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    dispatchIntent: async () => {},
    uiPlugins: [
      {
        mount(slot) {
          assert.equal(slot.dataset.xsdSlot, "map");
          mounts++;
          return () => unmounts++;
        },
      },
    ],
  };
  const p = mountHUD(doc, doc.querySelector("main"), r, data, () => {});
  for (const f of [...listeners]) f();
  assert.equal(mounts, 2);
  assert.equal(unmounts, 1);
  p.destroy();
  assert.equal(unmounts, 2);
  assert.equal(listeners.size, 0);
  d.window.close();
});
test("宿主使用原生候选变量、填入后点击发送，并守住非本卡边界", async () => {
  const { createTavernHost } = require("../src/host/tavern"),
    d = dom(),
    win = d.window;
  win.document.body.innerHTML =
    '<textarea id="send_textarea"></textarea><button id="send_but"></button><button id="mes_stop" style="display:none"></button>';
  let sent = 0,
    saved = 0;
  win.document.querySelector("#send_but").onclick = () => sent++;
  const c = {
    chatId: "a",
    chat: [{ mes: "测试", swipe_id: 0, variables: [{ foreign: "keep" }, {}] }],
    characters: [{ name: "仙姝堕2.0·框架测试" }],
    characterId: 0,
    saveChat: async () => saved++,
  };
  win.SillyTavern = { getContext: () => c };
  win.TavernHelper = {
    getVariables: ({ type, message_id }) =>
      type === "message"
        ? C.clone(c.chat[message_id].variables[c.chat[message_id].swipe_id])
        : {},
    replaceVariables: (v, { type, message_id }) => {
      if(type === "chat") c.variables=C.clone(v);
      else c.chat[message_id].variables[c.chat[message_id].swipe_id] = C.clone(v);
    },
  };
  const host = createTavernHost(win, win.document, "仙姝堕2.0·框架测试");
  assert.equal(host.isOurCard(), true);
  await host.send("进入幽寂谷");
  assert.equal(win.document.querySelector("textarea").value, "进入幽寂谷");
  assert.equal(sent, 1);
  const ctx = { ...host.context(), floor: 0, trail: C.fingerprint(c.chat) },
    e = {
      schema: 2,
      state: { revision: 1, stat_data: { 身份: "赵无忧" } },
      trail: ctx.trail,
    };
  await host.persist(ctx, e);
  assert.equal(c.chat[0].variables[0].foreign, "keep");
  assert.equal(saved, 2);
  assert.equal(c.variables.xsd2_checkpoint.state.revision, 1);
  c.chat[0].swipe_id = 1;
  assert.deepEqual(await host.readMessage(0), {});
  c.characters[0].name = "仙姝堕";
  assert.equal(host.isOurCard(), false);
  c.characters[0].name = "";
  assert.equal(host.isOurCard(), false);
  c.characters[0].name = "其他卡";
  assert.equal(host.isOurCard(), false);
  d.window.close();
});

test("原版百花谱迁入：内嵌六张立绘/纹章、六身份单次提交、翻页与卸载", async () => {
  const d = dom(),
    doc = d.window.document,
    calls = [],
    listeners = new Set();
  const runtime = {
    getSnapshot: () => null,
    subscribe: (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    dispatchIntent: async (x) => calls.push(x),
  };
  const panel = mountHUD(
    doc,
    doc.querySelector("main"),
    runtime,
    data,
    () => {},
  );
  assert.equal(
    doc.querySelector("[data-xds-heading] h2").textContent,
    "太微百花谱",
  );
  assert.equal(doc.querySelectorAll("[data-xds-flower]").length, 6);
  assert.equal(doc.querySelectorAll("[data-xds-image]").length, 12);
  assert.ok(
    [...doc.querySelectorAll("[data-xds-image]")].every((img) =>
      /^data:image\//.test(img.src),
    ),
  );
  assert.equal(doc.querySelector(".xsd2-hud"), null);
  doc.querySelector('[data-xds-carousel-step="1"]').click();
  assert.ok(doc.querySelector("[data-xds-carousel]").scrollLeft > 0);
  for (const identity of [
    "赵无忧",
    "焚欲殿主",
    "欢喜殿主",
    "浊龙殿主",
    "魂欢殿主",
  ]) {
    const b = doc.querySelector('[data-xds-identity="' + identity + '"]');
    b.click();
    b.click();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(calls.at(-1), {
      type: "SELECT_IDENTITY",
      payload: { identity },
    });
  }
  assert.equal(calls.length, 5);
  panel.destroy();
  assert.equal(listeners.size, 0);
  assert.equal(doc.querySelector("[data-xds-menu]"), null);
  d.window.close();
});
test("原版自设书卷：手填日期保留、滑块只填字段、失败可重选与确认后换HUD", async () => {
  const d = dom(),
    doc = d.window.document,
    calls = [],
    listeners = new Set();
  let snapshot = null;
  const runtime = {
    getSnapshot: () => snapshot,
    subscribe: (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    dispatchIntent: async (x) => {
      calls.push(x);
      if (!x.payload.custom?.date) throw Error("请填写有效日期");
    },
  };
  const panel = mountHUD(
    doc,
    doc.querySelector("main"),
    runtime,
    data,
    () => {},
  );
  doc.querySelector("[data-xds-open-custom]").click();
  assert.equal(doc.querySelector('[data-xds-page="custom"]').checked, true);
  const field = (name) => doc.querySelector('[data-xds-field="' + name + '"]');
  field("custom_name").value = "测试道友";
  field("custom_cultivation").value = "筑基初期";
  field("custom_place").value = "谷口";
  const button = doc.querySelector('[data-xds-action="submit-custom"]');
  button.click();
  await new Promise((r) => setImmediate(r));
  assert.equal(button.disabled, false);
  assert.ok(
    doc
      .querySelector('[data-xds-view="custom"] [data-xds-status]')
      .textContent.includes("日期"),
  );
  field("custom_timepoint").value = "仙盟历 1579 年 六月初七";
  field("custom_timepoint").dispatchEvent(
    new d.window.Event("input", { bubbles: true }),
  );
  panel.render();
  assert.equal(field("custom_timepoint").value, "仙盟历 1579 年 六月初七");
  button.click();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(calls.at(-1).payload.custom.date, {
    year: 1579,
    month: 6,
    day: 7,
  });
  assert.equal(calls.at(-1).payload.custom.place, "谷口");
  const range = doc.querySelector("[data-xds-timepoint-range]");
  range.value = "3";
  range.dispatchEvent(new d.window.Event("input", { bubbles: true }));
  assert.equal(calls.length, 2);
  assert.ok(field("custom_timepoint").value.includes("1578"));
  button.click();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(calls.at(-1).payload.custom.date, {
    year: 1578,
    month: 8,
    day: 1,
  });
  snapshot = {
    identity: "自设",
    calendarDate: { year: 1578, month: 8, day: 1 },
    stat_data: {
      自设: { name: "测试道友" },
      known: {},
      名器归属: {},
      在场角色: [],
    },
    known: {},
    inventory: [],
    manual: {},
  };
  panel.render();
  assert.equal(doc.querySelector("[data-xds-menu]"), null);
  assert.ok(doc.querySelector(".xsd2-hud"));
  assert.equal(doc.querySelectorAll("[data-xsd-slot]").length, 18);
  panel.destroy();
  d.window.close();
});

test("宿主生成门禁：隐藏父容器/hidden/停止按钮无布局不误判，原生函数状态优先", () => {
  const { createTavernHost } = require("../src/host/tavern");
  const d = dom(),
    win = d.window,
    doc = win.document;
  doc.body.innerHTML =
    '<div style="display:none" id="controls"><button id="mes_stop">停止</button></div><textarea id="send_textarea"></textarea><button id="send_but"></button>';
  const c = {
    chatId: "flags",
    chat: [],
    characters: [{ name: "仙姝堕2.0·框架测试" }],
    characterId: 0,
  };
  win.SillyTavern = { getContext: () => c };
  win.TavernHelper = {};
  const host = createTavernHost(win, doc, "仙姝堕2.0·框架测试");
  assert.equal(host.isGenerating(), false);
  const controls = doc.querySelector("#controls"),
    stop = doc.querySelector("#mes_stop");
  controls.style.display = "block";
  assert.equal(host.isGenerating(), true);
  controls.hidden = true;
  assert.equal(host.isGenerating(), false);
  controls.hidden = false;
  stop.style.display = "none";
  assert.equal(host.isGenerating(), false);
  host.markGenerating(true);
  assert.equal(host.isGenerating(), true);
  c.busy = false;
  c.isGenerating = function () {
    return this.busy;
  };
  assert.equal(host.isGenerating(), false);
  c.busy = true;
  assert.equal(host.isGenerating(), true);
  host.markGenerating(false);
  delete c.isGenerating;
  stop.style.display = "block";
  stop.checkVisibility = () => false;
  assert.equal(host.isGenerating(), false);
  stop.checkVisibility = () => true;
  assert.equal(host.isGenerating(), true);
  c.isGenerating = false;
  assert.equal(host.isGenerating(), false);
  d.window.close();
});
