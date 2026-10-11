"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { bundle } = require("../build");
const C = require("../src/runtime/contracts");
const script = bundle();
async function fixture(first = "<IdentityMenu/>") {
  const dom = new JSDOM(
      '<!doctype html><html><head></head><body><div id="chat"><div class="mes"><div class="mes_text"></div></div></div></body></html>',
      { runScripts: "outside-only" },
    ),
    win = dom.window,
    doc = win.document,
    handlers = new Map(),
    errors = [],
    chatVars = {};
  const eventTypes = Object.fromEntries(
    [
      "CHAT_CHANGED",
      "MESSAGE_DELETED",
      "MESSAGE_SWIPED",
      "MESSAGE_UPDATED",
      "MESSAGE_EDITED",
      "USER_MESSAGE_RENDERED",
      "CHARACTER_MESSAGE_RENDERED",
      "GENERATION_STARTED",
      "GENERATION_STOPPED",
      "GENERATION_ENDED",
      "MESSAGE_SENT",
    ].map((k) => [k, k]),
  );
  const emit = async (name) => {
    for (const f of [...(handlers.get(name) || [])]) await f();
  };
  const context = {
    chatId: "native-opening",
    chat: [{ mes: first, swipe_id: 0, variables: [{}] }],
    characters: [{ name: "仙姝堕2.0·框架测试" }],
    characterId: 0,
    eventTypes,
    eventSource: {
      on: (n, f) => {
        if (!handlers.has(n)) handlers.set(n, new Set());
        handlers.get(n).add(f);
      },
      removeListener: (n, f) => handlers.get(n)?.delete(f),
    },
    saveChat: async () => {},
    setExtensionPrompt() {},
  };
  win.console.error = () => {}; // Expected rejection is asserted through the host reporter.
  win.structuredClone = structuredClone;
  win.SillyTavern = { getContext: () => context };
  win.toastr = { error: (e) => errors.push(String(e)) };
  let replaceError = false,
    replacements = 0;
  win.TavernHelper = {
    getVariables: async ({ type, message_id }) =>
      C.clone(
        type === "chat" ? chatVars : context.chat[message_id].variables[0],
      ),
    replaceVariables: async (v, { type, message_id }) => {
      if (type === "chat") {
        Object.assign(chatVars, C.clone(v));
      } else context.chat[message_id].variables[0] = C.clone(v);
    },
    getCharWorldbookNames: async () => ({ primary: null, additional: [] }),
    setChatMessages: async (rows) => {
      if (replaceError) throw Error("宿主拒绝修改开场白");
      replacements++;
      context.chat[0].mes = rows[0].message;
      doc.querySelector(".mes_text").textContent = rows[0].message;
      await emit("CHARACTER_MESSAGE_RENDERED");
    },
  };
  const controls = doc.createElement("div");
  controls.id = "send-controls";
  controls.style.display = "none";
  controls.innerHTML = '<button id="mes_stop">停止</button>';
  doc.body.append(controls);
  const textarea = doc.createElement("textarea");
  textarea.id = "send_textarea";
  const send = doc.createElement("button");
  send.id = "send_but";
  const sends = [];
  send.onclick = () => {
    sends.push(textarea.value);
    context.chat.push({
      mes: textarea.value,
      is_user: true,
      swipe_id: 0,
      variables: [{}],
    });
  };
  doc.body.append(textarea, send);
  win.eval(script);
  await until(() => doc.querySelector("[data-xsd2-root]"));
  return {
    dom,
    win,
    doc,
    context,
    errors,
    sends,
    emit,
    replacements: () => replacements,
    fail: (v) => (replaceError = v),
    close: () => {
      win.XSD2?.dispose();
      dom.window.close();
    },
  };
}
async function until(fn) {
  for (let i = 0; i < 100; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw Error("首楼操作超时");
}
test("打包脚本+宿主等待渲染回调：六身份真实跳转，画廊只展示，按钮不锁死", async () => {
  for (const identity of [
    "赵无忧",
    "焚欲殿主",
    "欢喜殿主",
    "浊龙殿主",
    "魂欢殿主",
    "自设",
  ]) {
    const h = await fixture();
    try {
      const art = h.doc.querySelector("[data-xds-flower]");
      art.click();
      assert.equal(h.replacements(), 0);
      assert.equal(h.doc.querySelector("[data-xds-card-hint]"), null);
      assert.equal(art.getAttribute("role"), null);
      assert.equal(art.hasAttribute("data-xds-identity"), false);
      if (identity === "自设") {
        h.doc.querySelector("[data-xds-open-custom]").click();
        const set = (k, v) =>
          (h.doc.querySelector('[data-xds-field="' + k + '"]').value = v);
        set("custom_name", "测试道友");
        set("custom_cultivation", "筑基初期");
        set("custom_timepoint", "仙盟历1579年六月初七");
        h.doc.querySelector('[data-xds-action="submit-custom"]').click();
      } else
        h.doc
          .querySelector('button[data-xds-identity="' + identity + '"]')
          .click();
      await until(
        () =>
          h.win.XSD2.runtime.getSnapshot()?.identity === identity &&
          h.doc.querySelector(".xsd2-hud"),
      );
      assert.equal(h.doc.querySelector("[data-xds-menu]"), null);
      assert.equal(h.replacements(), 1);
      assert.equal(h.context.chat[0].variables[0].stat_data.身份, identity);
      assert.equal(h.errors.length, 0);
    } finally {
      h.close();
    }
  }
});
test("打包首楼宿主失败：恢复身份按钮，原开场白不变，可再次成功选择", async () => {
  const h = await fixture();
  try {
    h.fail(true);
    h.doc.querySelector('button[data-xds-identity="赵无忧"]').click();
    await until(() => h.errors.length > 0);
    assert.ok([...h.doc.querySelectorAll("button")].every((b) => !b.disabled));
    assert.equal(h.context.chat[0].mes, "<IdentityMenu/>");
    h.fail(false);
    h.doc.querySelector('button[data-xds-identity="欢喜殿主"]').click();
    await until(() => h.doc.querySelector(".xsd2-hud"));
    assert.equal(h.win.XSD2.runtime.getSnapshot().identity, "欢喜殿主");
  } finally {
    h.close();
  }
});

test("自设候选日期未填：只补设定、不猜日期或开启地图；普通身份候选直接HUD", async () => {
  const data = require("../tools/data.cjs").load(
    require("node:path").join(__dirname, ".."),
  );
  const h = await fixture(
    data.greetings.自设.replaceAll("{{user}}", "测试道友"),
  );
  try {
    await h.win.XSD2.runtime.ready();
    assert.equal(h.win.XSD2.runtime.getSnapshot(), null);
    assert.equal(h.doc.querySelector('[data-xds-view="flower"]'), null);
    assert.equal(h.doc.querySelector(".xsd2-hud"), null);
    assert.equal(h.doc.querySelector('[data-xds-page="custom"]').checked, true);
    h.doc.querySelector('[data-xds-field="custom_name"]').value = "测试道友";
    h.doc.querySelector('[data-xds-field="custom_cultivation"]').value =
      "筑基初期";
    h.doc.querySelector('[data-xds-field="custom_timepoint"]').value =
      "仙盟历1579年六月初七";
    h.doc.querySelector('[data-xds-action="submit-custom"]').click();
    await until(() => h.doc.querySelector(".xsd2-hud"));
    assert.deepEqual(C.clone(h.win.XSD2.runtime.getSnapshot().calendarDate), {
      year: 1579,
      month: 6,
      day: 7,
    });
  } finally {
    h.close();
  }
  const normal = await fixture(data.greetings.赵无忧);
  try {
    await until(() => normal.doc.querySelector(".xsd2-hud"));
    assert.equal(normal.doc.querySelector("[data-xds-menu]"), null);
  } finally {
    normal.close();
  }
});

test("打包HUD快捷行动与地图共用门禁：空闲真实发送，生成中拒绝，结束后恢复", async () => {
  const data = require("../tools/data.cjs").load(
    require("node:path").join(__dirname, ".."),
  );
  for (const action of ["观察四周", "与在场之人交谈", "自行行动", "地图"]) {
    const h = await fixture(data.greetings.赵无忧);
    try {
      await until(() => h.doc.querySelector(".xsd2-hud"));
      const runtime = h.win.XSD2.runtime;
      const dispatch = () => {
        if (action !== "地图")
          return runtime.dispatchIntent({
            type: "QUICK_ACTION",
            payload: { text: action },
          });
        const s = runtime.getSnapshot();
        return runtime.dispatchIntent({
          type: "SELECT_NODE",
          pluginId: "youjigu_map",
          expected: {
            chatId: s.chatId,
            branchId: s.branchId,
            floor: s.floor,
            revision: s.revision,
          },
          payload: { nodeId: "g7p2" },
        });
      };
      await h.emit("GENERATION_STARTED");
      await assert.rejects(dispatch(), /请等/);
      assert.equal(h.sends.length, 0);
      await h.emit("GENERATION_ENDED");
      if (action === "地图") await dispatch();
      else {
        h.doc.querySelector('[data-action="' + action + '"]').click();
        await until(() => h.sends.length === 1);
      }
      assert.equal(h.sends.length, 1);
      if (action === "地图")
        assert.equal(runtime.getSnapshot().pending.nodeId, "g7p2");
    } finally {
      h.close();
    }
  }
});
