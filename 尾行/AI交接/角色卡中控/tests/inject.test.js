/* 回执注入通道回退：酒馆助手没有 injectPrompts、或它挂在父窗口、或它返回 rejected Promise 时，
   都必须落到酒馆原生 setExtensionPrompt —— 否则中控照常结算、变量正常持久化，回执却从没进提示词。 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { startGlue } = require("../src/host/glue.js");

const FLUSH = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

function makeMock({ withHelperInject, withNative, helperAsync, nativeOnParent, echoBag }) {
  const store = {}, listeners = {}, native = [];
  let lastMsg = "";
  const G = globalThis;
  G.insertOrAssignVariables = async (obj) => Object.assign(store, obj);
  G.getVariables = async () => JSON.parse(JSON.stringify(store));
  G.eventOn = (name, fn) => { (listeners[name] = listeners[name] || []).push(fn); };
  G.tavern_events = {
    MESSAGE_SENT: "MESSAGE_SENT", GENERATION_STARTED: "GENERATION_STARTED",
    GENERATION_ENDED: "GENERATION_ENDED", MESSAGE_SWIPED: "MESSAGE_SWIPED"
  };
  G.getChatMessages = async () => [{ message_id: 1, role: "user", message: lastMsg }];
  G.getCurrentCharacterName = async () => "尾行";
  if (withHelperInject) {
    const helper = (prompts) => {
      if (helperAsync) return Promise.reject(new Error("helper 通道异步失败"));
      throw new Error("helper 通道坏了");
    };
    G.injectPrompts = helper;
  }
  const ctx = {
    extension_prompts: {},
    setExtensionPrompt: (key, value, position, depth, scan, role) => {
      native.push({ key, value, position, depth, role });
      if (echoBag) {
        if (value) ctx.extension_prompts[key] = { value };
        else delete ctx.extension_prompts[key];
      }
    }
  };
  const parentWin = { SillyTavern: { getContext: () => ctx } };
  if (withNative) {
    if (nativeOnParent) {
      // 脚本在隐藏 iframe 里跑：SillyTavern 只挂在父窗口
      G.window = { parent: parentWin };
    } else {
      G.SillyTavern = { getContext: () => ctx };
    }
  }
  return {
    store, native,
    setLast: (t) => { lastMsg = t; },
    emit: (name) => { for (const fn of listeners[name] || []) fn(); },
    cleanup() {
      for (const k of ["insertOrAssignVariables", "getVariables", "eventOn", "tavern_events",
        "getChatMessages", "getCurrentCharacterName", "injectPrompts", "uninjectPrompts",
        "generate", "stopAllGeneration", "SillyTavern", "window"]) delete G[k];
      delete G.WxGlue;
    }
  };
}

test("注入回退：没有 TavernHelper.injectPrompts 时，回执走原生 setExtensionPrompt", async () => {
  const mock = makeMock({ withHelperInject: false, withNative: true });
  mock.store.wx_init = { sessionSalt: "ab".repeat(16) };
  try {
    const r = await startGlue();
    assert.equal(r.ok, true, "glue 应启动");
    mock.setLast("跟缀 保持二十步。");
    mock.emit("MESSAGE_SENT");
    await FLUSH();

    const receiptCall = mock.native.filter(c => c.key === "wx_receipt" && c.value);
    assert.ok(receiptCall.length >= 1, "原生通道应收到 cwx_receipt 注入");
    const call = receiptCall[receiptCall.length - 1];
    assert.equal(call.position, 1, "应注入在 IN_CHAT 位置");
    assert.ok(String(call.value).includes("中控结算回执"), "注入内容应是中控回执");
    assert.ok(String(call.value).includes("[动作裁决]") || String(call.value).includes("纯叙事推进"),
      "回执应带动作裁决段");
    assert.equal(mock.store.wx_diag && mock.store.wx_diag.inject, "native", "诊断变量应记录 native 通道");
  } finally {
    mock.cleanup();
  }
});

test("注入回退：两条通道都不可用时，不抛错且诊断记为 none", async () => {
  const mock = makeMock({ withHelperInject: false, withNative: false });
  mock.store.wx_init = { sessionSalt: "cd".repeat(16) };
  try {
    const r = await startGlue();
    assert.equal(r.ok, true, "glue 仍应启动（结算不受注入失败影响）");
    mock.setLast("跟缀。");
    mock.emit("MESSAGE_SENT");
    await FLUSH();
    assert.equal(mock.store.wx_diag && mock.store.wx_diag.inject, "none", "诊断应记录 none");
    assert.ok(mock.store.wx_snap, "快照仍应持久化（渲染不受影响）");
  } finally {
    mock.cleanup();
  }
});

test("注入回退：酒馆助手通道抛错时，自动降级到原生通道", async () => {
  const mock = makeMock({ withHelperInject: true, withNative: true });
  mock.store.wx_init = { sessionSalt: "ef".repeat(16) };
  try {
    const r = await startGlue();
    assert.equal(r.ok, true);
    mock.setLast("跟缀。");
    mock.emit("MESSAGE_SENT");
    await FLUSH();
    assert.ok(mock.native.some(c => c.key === "wx_receipt" && c.value), "应降级到原生通道");
    assert.equal(mock.store.wx_diag && mock.store.wx_diag.inject, "native");
  } finally {
    mock.cleanup();
  }
});

test("注入通道：助手 injectPrompts 返回 rejected Promise 时也必须降级（不能乐观记成功）", async () => {
  const mock = makeMock({ withHelperInject: true, withNative: true, helperAsync: true });
  mock.store.wx_init = { sessionSalt: "12".repeat(16) };
  try {
    await startGlue();
    mock.setLast("跟缀。");
    mock.emit("MESSAGE_SENT");
    await FLUSH(12);
    assert.ok(mock.native.some(c => c.key === "wx_receipt" && c.value), "异步失败后应降级原生");
    assert.equal(mock.store.wx_diag && mock.store.wx_diag.inject, "native", "诊断不得记成 tavernhelper");
  } finally {
    mock.cleanup();
  }
});

test("注入通道：原生上下文只在父窗口（脚本跑在 iframe 里）时也要找得到", async () => {
  const mock = makeMock({ withHelperInject: false, withNative: true, nativeOnParent: true });
  mock.store.wx_init = { sessionSalt: "34".repeat(16) };
  try {
    await startGlue();
    mock.setLast("跟缀。");
    mock.emit("MESSAGE_SENT");
    await FLUSH();
    assert.ok(mock.native.some(c => c.key === "wx_receipt" && c.value), "父窗口原生通道应收到回执");
    assert.equal(mock.store.wx_diag && mock.store.wx_diag.inject, "native");
  } finally {
    mock.cleanup();
  }
});

test("注入通道：原生通道可回读 extension_prompts 时，诊断带上校验结果", async () => {
  const mock = makeMock({ withHelperInject: false, withNative: true, echoBag: true });
  mock.store.wx_init = { sessionSalt: "56".repeat(16) };
  try {
    await startGlue();
    mock.setLast("跟缀。");
    mock.emit("MESSAGE_SENT");
    await FLUSH();
    assert.equal(mock.store.wx_diag && mock.store.wx_diag.inject, "native");
    assert.equal(mock.store.wx_diag.verified, true, "回读内容与写入一致，应记 verified: true");
  } finally {
    mock.cleanup();
  }
});
