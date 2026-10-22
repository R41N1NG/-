"use strict";
// 独立试玩桥：正式引擎 + 正式聊天同步模块；不进入角色卡生产包。
const { createGame } = require("../../src/runtime/game.js");
const { createChatSync } = require("../../src/host/chat-sync/controller.js");
const { defaultInit } = require("../../src/host/initial-state.js");
function boot(states) {
  const storageKey = "weixing-daily-framework-preview-v2";
  let store = {},
    restored = false;
  try {
    store = JSON.parse(localStorage.getItem(storageKey) || "{}");
    restored = !!store.wx_save;
  } catch {}
  const state = { game: null, conf: { autoSettle: false } };
  const sync = createChatSync({
    state,
    createGame,
    defaultInit,
    vars: {
      read: async () => store,
      assign: async (patch) => {
        const next = { ...store, ...JSON.parse(JSON.stringify(patch)) };
        // file:// 可保存在当前浏览器；禁用存储时仍可在本页试玩。
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        store = next;
      },
    },
    readContext: async () => ({
      scope: "daily-preview",
      history: [{ id: 0, role: "assistant", text: "daily-preview-opening" }],
    }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: (snap) => {
      if (snap) window.WxStatusbar.render(snap);
    },
  });
  window.getVariables = async () => store;
  window.WxGlue = {
    command: (...args) => {
      const pending = sync.mutate(...args);
      window.__dailyPreviewOperation = pending;
      return pending;
    },
    getSyncDiagnostics: sync.getSyncDiagnostics,
    newGame: sync.newGame,
    resetGame: sync.resetGame,
  };
  window.WxStatusbarUI.mountStatusbar(document, window);
  const controls = document.getElementById("dailyPreviewControls");
  function show(index) {
    const entry = states[index];
    document.getElementById("dailyPreviewDescription").textContent =
      entry.description;
    controls
      .querySelectorAll("button")
      .forEach((button, i) =>
        button.setAttribute("aria-pressed", String(i === index)),
      );
    window.__dailyPreviewIndex = index;
    window.__dailyPreviewReady = sync.newGame(entry.init);
    return window.__dailyPreviewReady;
  }
  states.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = entry.title;
    button.dataset.stateIndex = index;
    button.onclick = () =>
      show(index).catch((error) => window.WxStatusbar.reportSyncError(error));
    controls.append(button);
  });
  window.__dailyPreviewSync = sync;
  if (restored) {
    document.getElementById("dailyPreviewDescription").textContent =
      "已恢复本浏览器上次试玩进度。上方按钮会重置试玩状态。";
    window.__dailyPreviewReady = sync.reconcile();
  } else show(0);
}
module.exports = { boot };
