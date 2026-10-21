"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");
const { buildRuntime } = require("../build-runtime");
const { buildStatusbar } = require("../build-statusbar");
const root = path.resolve(__dirname, "..");
function host(name) {
  const errors = [],
    store = {},
    events = new Map();
  const context = {
    characterId: 0,
    chatId: "native-chat",
    chat: [{ mes: "opening", is_user: false }],
  };
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="form_sheld"><form id="send_form"></form></div></body></html>',
    {
      url: "https://local.test",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(w) {
        w.getVariables = async () => store;
        w.insertOrAssignVariables = async (patch) =>
          Object.assign(store, JSON.parse(JSON.stringify(patch)));
        w.getCurrentCharacterName = async () => name;
        w.getChatMessages = async (id) => [
          {
            message_id: id < 0 ? context.chat.length - 1 : id,
            message: context.chat.at(id)?.mes || "",
            role: context.chat.at(id)?.is_user ? "user" : "assistant",
          },
        ];
        w.SillyTavern = { getContext: () => context };
        w.tavern_events = Object.fromEntries(
          [
            "MESSAGE_SENT",
            "GENERATION_STARTED",
            "GENERATION_ENDED",
            "MESSAGE_SWIPED",
            "CHAT_CHANGED",
            "MESSAGE_UPDATED",
            "MESSAGE_DELETED",
          ].map((n) => [n, n]),
        );
        w.eventOn = (name, fn) => {
          events.set(name, fn);
          return { stop: () => events.delete(name) };
        };
        w.HTMLDialogElement.prototype.showModal = function () {
          this.open = true;
        };
        w.HTMLDialogElement.prototype.close = function () {
          this.open = false;
          this.dispatchEvent(new w.Event("close"));
        };
      },
    },
  );
  return { dom, errors, store, context, events };
}
function script() {
  buildRuntime();
  return buildStatusbar();
}
const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
};

test("正式整合包：原生同窗口可挂载、建局、接收快照和卸载", async () => {
  const h = host("尾行");
  try {
    vm.runInContext(script(), h.dom.getInternalVMContext());
    await flush();
    const w = h.dom.window;
    assert.ok(w.document.getElementById("wx-statusbar-root"));
    await w.WxGlue.newGame({ sessionSalt: "native-bundle" });
    await flush();
    assert.equal(
      w.document.getElementById("heartNum").textContent,
      String(h.store.wx_snap.player.heart),
    );
    w.WxStatusbar.consumeActiveActions = () => [];
    h.context.chat.push({ mes: "input", is_user: true });
    await w.WxGlue.onUserSent(1);
    await flush();
    assert.equal(h.store.wx_save.floor, 1);
    w.WxStatusbar.dispose();
    w.WxGlue.dispose();
    assert.equal(h.events.size, 0);
    assert.deepEqual(h.errors, []);
  } finally {
    h.dom.window.close();
  }
});

test("正式整合包：非本卡不挂载状态栏，也不注册消息结算监听", async () => {
  const h = host("another card");
  try {
    vm.runInContext(script(), h.dom.getInternalVMContext());
    await flush();
    assert.equal(
      h.dom.window.document.getElementById("wx-statusbar-root"),
      null,
    );
    assert.equal(h.events.size, 0);
    assert.deepEqual(h.errors, []);
  } finally {
    h.dom.window.close();
  }
});
