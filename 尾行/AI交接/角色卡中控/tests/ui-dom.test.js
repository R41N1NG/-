"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");
const { buildUI } = require("../tools/build/ui.js");
const legacy = require("./fixtures/legacy-v1.json");

test("UI 模块集成：构建、挂载、真实快照、胶囊与弹窗交互无运行错误", async () => {
  const { script } = buildUI();
  new vm.Script(script);
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  // DOM 交互测试独立于 CSS 支持；样式另用浏览器验收。
  const template = fs
    .readFileSync(path.resolve(__dirname, "../src/ui/template.html"), "utf8")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  const dom = new JSDOM(template, {
    url: "https://local.test/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      window.HTMLDialogElement.prototype.close = function () {
        this.open = false;
        this.dispatchEvent(new window.Event("close"));
      };
    },
  });
  try {
    const { window } = dom;
    vm.runInContext(script, dom.getInternalVMContext());
    window.WxStatusbarUI.mountStatusbar(window.document, window);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const api = window.WxStatusbar;
    for (const key of [
      "render",
      "settle",
      "consumeActiveActions",
      "setCapsuleAction",
    ])
      assert.equal(typeof api[key], "function", key);
    api.render(legacy.snapshot);
    assert.equal(window.document.getElementById("routeStrikeTag"), null);
    const progress = window.document.getElementById("routeRemain");
    assert.ok(!progress.textContent.includes("收摊"));
    assert.ok(!progress.textContent.includes("步"));
    assert.ok(
      !window.document
        .querySelector("section.trpg")
        .textContent.includes("探头锁定"),
    );
    assert.equal(
      window.document.getElementById("heartNum").textContent,
      String(legacy.snapshot.player.heart),
    );
    api.setCapsuleAction({ id: "photo", name: "拍照", args: {} });
    assert.equal(api.consumeActiveActions()[0].id, "photo");
    window.document.getElementById("heartPillBtn").click();
    assert.ok(
      window.document
        .getElementById("heartPopoverCard")
        .classList.contains("show") ||
        window.document
          .getElementById("heartPopoverCard")
          .getAttribute("aria-hidden") === "false",
    );
    window.document.getElementById("heartPopoverClose").click();
    window.document.getElementById("wx-terminal-toggle-btn").click();
    assert.equal(
      window.document.getElementById("wx-terminal-dialog").open,
      true,
    );
    window.document.getElementById("wx-terminal-close-btn").click();
    assert.equal(
      window.document.getElementById("wx-terminal-dialog").open,
      false,
    );
    assert.deepEqual(errors, []);
  } finally {
    dom.window.close();
  }
});

test("UI 生命周期：备用轮询连续更新，重挂载不叠加监听和定时器", async () => {
  const { script } = buildUI({ preview: false, writePreview: false });
  assert.ok(
    !script.includes("src/ui/preview-data.js"),
    "正式 bundle 不携带演示数据模块",
  );
  const errors = [],
    intervals = new Map();
  let seq = 0;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => errors.push(e.message));
  let snapshot = JSON.parse(JSON.stringify(legacy.snapshot));
  const dom = new JSDOM(
    fs
      .readFileSync(path.resolve(__dirname, "../src/ui/template.html"), "utf8")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""),
    {
      url: "https://local.test/",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        window.getVariables = async () => ({
          wx_save: { v: 2 },
          wx_snap: snapshot,
        });
        window.setInterval = (callback) => {
          const id = ++seq;
          intervals.set(id, callback);
          return id;
        };
        window.clearInterval = (id) => intervals.delete(id);
        window.HTMLDialogElement.prototype.showModal = function () {
          this.open = true;
        };
        window.HTMLDialogElement.prototype.close = function () {
          this.open = false;
          this.dispatchEvent(new window.Event("close"));
        };
      },
    },
  );
  try {
    const w = dom.window;
    vm.runInContext(script, dom.getInternalVMContext());
    w.WxStatusbarUI.mountStatusbar(w.document, w);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(intervals.size, 1);
    await [...intervals.values()][0]();
    w.WxStatusbar.reportSyncError({
      code: "HISTORY_OUTSIDE_WINDOW",
      location: { index: 0, messageId: 0 },
    });
    snapshot = { ...snapshot, player: { ...snapshot.player, heart: 44 } };
    await [...intervals.values()][0]();
    assert.equal(w.document.getElementById("heartNum").textContent, "44");
    assert.equal(
      w.document.getElementById("wxSyncNotice").hidden,
      false,
      "备用快照不能掩盖未解决的错误",
    );
    w.WxStatusbarUI.mountStatusbar(w.document, w);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(intervals.size, 1, "旧轮询必须被清理");
    w.document.getElementById("heartPillBtn").click();
    assert.ok(
      w.document.getElementById("heartPopoverCard").classList.contains("show"),
    );
    w.WxStatusbar.dispose();
    assert.equal(intervals.size, 0);
    assert.deepEqual(errors, []);
  } finally {
    dom.window.close();
  }
});
