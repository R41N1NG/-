"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { mountHUD } = require("../src/ui/status_panel"),
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
  doc.querySelector("[data-action]").click();
  doc.querySelector("[data-item]").click();
  assert.deepEqual(
    calls.map((x) => x.type),
    ["QUICK_ACTION", "USE_ITEM"],
  );
  doc.querySelector("[data-portrait]").click();
  assert.ok(doc.querySelector("dialog img").src.endsWith("guyue.png"));
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
    replaceVariables: (v, { message_id }) =>
      (c.chat[message_id].variables[c.chat[message_id].swipe_id] = C.clone(v)),
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
  assert.equal(saved, 1);
  c.chat[0].swipe_id = 1;
  assert.deepEqual(await host.readMessage(0), {});
  c.characters[0].name = "其他卡";
  assert.equal(host.isOurCard(), false);
  d.window.close();
});
