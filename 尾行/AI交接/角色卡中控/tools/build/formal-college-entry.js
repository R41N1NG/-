"use strict";
const { createGame } = require("../../src/runtime/game"),
  { defaultInit } = require("../../src/host/initial-state"),
  { createChatSync } = require("../../src/host/chat-sync/controller");
async function boot() {
  const key = "wx_formal_college_preview_v1";
  let data;
  try {
    data = JSON.parse(localStorage.getItem(key) || "null");
  } catch {}
  data = data || {
    vars: {},
    history: [{ id: 0, role: "assistant", text: "全息训练准备就绪" }],
  };
  const state = { game: null, conf: { autoSettle: false } };
  const clone = (x) => JSON.parse(JSON.stringify(x)),
    save = () => localStorage.setItem(key, JSON.stringify(data));
  const sync = createChatSync({
    state,
    vars: {
      read: async () => clone(data.vars),
      assign: async (patch) => {
        Object.assign(data.vars, clone(patch));
        save();
      },
    },
    createGame,
    defaultInit,
    readContext: async () => ({
      scope: "formal-college-demo",
      history: clone(data.history),
    }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: (s) => {
      data.vars.wx_snap = s;
      window.WxStatusbar?.render?.(s);
    },
  });
  window.getVariables = async () => clone(data.vars);
  window.WxGlue = {
    command: sync.mutate,
    reconcile: sync.reconcile,
    newGame: sync.newGame,
    getSyncDiagnostics: sync.getSyncDiagnostics,
  };
  if (data.vars.wx_save) await sync.rebuild();
  else
    await sync.newGame({
      ...defaultInit(),
      collegeDaily: true,
      sessionSalt: "college-preview-9",
    });
  window.WxStatusbarUI.mountStatusbar(document, window);
  window.WxStatusbar.render(await sync.reconcile());
  async function send(actions) {
    const id = data.history.length,
      text = "执行本轮已选行动";
    data.history.push({ id, role: "user", text });
    save();
    const result = await sync.runInput({ messageId: id, text, actions });
    data.history.push({
      id: id + 1,
      role: "assistant",
      text: "以本轮实际结算继续。",
    });
    save();
    await sync.runReply({ text: "以本轮实际结算继续。" });
    window.WxStatusbar.render(await sync.reconcile());
    if (result.package?.actions?.length)
      window.WxStatusbar.settle(result.package);
    return result;
  }
  document.getElementById("formalSend").onclick = () =>
    send(window.WxStatusbar.consumeActiveActions()).catch((e) => {
      document.getElementById("formalNotice").textContent = e.message;
    });
  document.getElementById("formalReset").onclick = () => {
    localStorage.removeItem(key);
    location.reload();
  };
  window.__formal = {
    snapshot: () => state.game.snapshot(),
    save: () => state.game.save(),
    sync,
    send,
    ready: true,
  };
}
module.exports = { boot };
