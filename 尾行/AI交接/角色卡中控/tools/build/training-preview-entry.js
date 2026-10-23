"use strict";
// 独立预览使用正式零楼、建局和聊天同步模块；变量仅留在本页内存。
const { createChatSync } = require("../../src/host/chat-sync/controller.js");
const { createGame } = require("../../src/runtime/game.js");
const { defaultInit } = require("../../src/host/initial-state.js");
function boot(options = {}) {
  let store = {};
  const state = { game: null, conf: {} };
  const sync = createChatSync({
    state,
    createGame,
    defaultInit,
    vars: {
      read: async () => JSON.parse(JSON.stringify(store)),
      assign: async (patch) => {
        store = { ...store, ...JSON.parse(JSON.stringify(patch)) };
      },
    },
    readContext: async () => ({
      scope: "training-brief-preview",
      history: [{ id: 0, role: "assistant", text: "training-preview-opening" }],
    }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => {
      const opening = document.querySelector("[data-wx-opening]");
      if (opening)
        opening.textContent =
          "训练场景已载入。你可以打开战术终端查看当前状态。";
      return { ok: true };
    },
    publishSnapshot: (snap) => {
      if (!snap) return;
      window.WxStatusbar.render(snap);
      document.body.dataset.previewState = "field";
    },
  });
  window.getVariables = async () => JSON.parse(JSON.stringify(store));
  window.__trainingPreviewStore = () => JSON.parse(JSON.stringify(store));
  window.WxGlue = {
    newGame: (init) => {
      const operation = sync.newGame(init);
      window.__trainingPreviewOperation = operation;
      return operation;
    },
    getSyncDiagnostics: sync.getSyncDiagnostics,
  };
  window.WxStatusbarUI.mountStatusbar(document, window);
  window.__trainingPreviewReady = (async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    if (options.entry === "attributes") return;
    if (!document.getElementById("zeroAttributeLesson").hidden) document.getElementById("attributeLessonContinue").click();
    document.querySelector('#quickPane [data-preset="otaku"]')?.click();
    document.getElementById("zeroNextStep").click();
    if (!document.getElementById("zeroAttributeLesson").hidden) document.getElementById("attributeLessonContinue").click();
    document.getElementById("createConfirm").click();
  })();
}
module.exports = { boot };
