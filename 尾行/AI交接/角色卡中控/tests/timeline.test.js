"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createChatSync } = require("../src/host/chat-sync/controller.js");
const { createGame } = require("../src/runtime/game.js");
const clone = (value) => JSON.parse(JSON.stringify(value));
function host() {
  const stores = { A: {}, B: {} },
    histories = {
      A: [{ id: 0, role: "assistant", text: "opening" }],
      B: [{ id: 0, role: "assistant", text: "opening" }],
    };
  let active = "A",
    gate = null,
    writeFail = false;
  const state = { game: null, conf: { autoSettle: false } };
  const sync = createChatSync({
    state,
    vars: {
      read: async () => {
        const copy = clone(stores[active]);
        if (gate) {
          const wait = gate;
          gate = null;
          await wait;
        }
        return copy;
      },
      assign: async (patch) => {
        if (writeFail) throw Error("disk unavailable");
        Object.assign(stores[active], clone(patch));
      },
    },
    readContext: async () => ({
      scope: active,
      history: clone(histories[active]),
    }),
    createGame,
    defaultInit: () => ({ sessionSalt: "timeline-test", stats: { heart: 50 } }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
  });
  return {
    sync,
    state,
    stores,
    histories,
    setActive: (v) => {
      active = v;
    },
    user(text = "input") {
      const m = { id: histories[active].length, role: "user", text };
      histories[active].push(m);
      return m.id;
    },
    reply(text = "reply") {
      histories[active].push({
        id: histories[active].length,
        role: "assistant",
        text,
      });
    },
    defer() {
      let release;
      gate = new Promise((r) => {
        release = r;
      });
      return release;
    },
    failWrites: (v) => {
      writeFail = v;
    },
  };
}
const action = [{ id: "follow", name: "跟缀", args: { dist: "same" } }];
async function send(h, text) {
  const messageId = h.user(text);
  return h.sync.runInput({ messageId, text, actions: action });
}

test("聊天切换：A 的读档任务迟到后不写 B", async () => {
  const h = host();
  await h.sync.newGame({});
  const release = h.defer();
  const pending = h.sync.rebuild();
  await new Promise((r) => setImmediate(r));
  h.setActive("B");
  h.sync.interrupt();
  release();
  await assert.rejects(pending, { code: "STALE_SESSION" });
  assert.deepEqual(h.stores.B, {});
  await h.sync.newGame({});
  assert.equal(h.stores.B.wx_save.floor, 0);
});

test("重复消息并发触发：同一输入只结算一次，刷新后仍复用原结果", async () => {
  const h = host();
  await h.sync.newGame({});
  const id = h.user();
  const [a, b] = await Promise.all([
    h.sync.runInput({ messageId: id, text: "input", actions: action }),
    h.sync.runInput({ messageId: id, text: "input", actions: action }),
  ]);
  assert.equal(a.floor, 1);
  assert.equal(b.floor, 1);
  assert.equal(b.reused, true);
  const before = clone(h.stores.A.wx_save);
  await h.sync.rebuild();
  const repeated = await h.sync.runInput({
    messageId: id,
    text: "input",
    actions: [],
  });
  assert.equal(repeated.reused, true);
  assert.deepEqual(h.stores.A.wx_save, before);
});

test("删楼和编辑：恢复完整状态，原时间线分支仍可找回", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  const first = clone(h.stores.A.wx_save),
    original = clone(h.histories.A);
  await send(h, "two");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  const second = clone(h.stores.A.wx_save),
    full = clone(h.histories.A);
  h.histories.A.splice(3);
  await h.sync.reconcile();
  assert.deepEqual(h.stores.A.wx_save, first);
  assert.equal(h.stores.A.wx_sync_backup.save.floor, second.floor);
  h.histories.A[1].text = "edited";
  h.histories.A.splice(2);
  await h.sync.reconcile();
  assert.equal(h.stores.A.wx_save.floor, 0);
  await h.sync.runInput({ messageId: 1, text: "edited", actions: action });
  assert.equal(h.stores.A.wx_save.floor, 1);
  h.histories.A.splice(0, h.histories.A.length, ...full);
  await h.sync.reconcile();
  assert.deepEqual(h.stores.A.wx_save, second);
});

test("复制分支到 B：按对应历史恢复，修改 B 不影响 A", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "branch");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  h.stores.B = clone(h.stores.A);
  h.histories.B = clone(h.histories.A);
  const a = clone(h.stores.A.wx_save);
  h.setActive("B");
  await h.sync.reconcile();
  await send(h, "only B");
  assert.deepEqual(h.stores.A.wx_save, a);
  assert.equal(h.stores.B.wx_save.floor, a.floor + 1);
});

test("回复重生成：账目、骰子和结算摘要不变，模式按当前回复恢复", async () => {
  const h = host();
  await h.sync.newGame({});
  const result = await send(h, "one");
  const account = clone(h.stores.A.wx_save.ledgerState),
    summary = h.stores.A.wx_snap.ledger;
  h.reply("<模式>接触</模式>");
  await h.sync.runReply({ text: "<模式>接触</模式>" });
  assert.equal(h.stores.A.wx_save.mode, "contact");
  h.histories.A[2].text = "different prose";
  await h.sync.runReply({ text: "different prose" });
  assert.equal(h.stores.A.wx_save.mode, "stealth");
  assert.deepEqual(h.stores.A.wx_save.ledgerState, account);
  assert.equal(h.stores.A.wx_snap.ledger, summary);
  assert.deepEqual(
    (await h.sync.getCurrentResult()).package.actions,
    result.package.actions,
  );
});

test("存档失败后重试：内存和持久档同时保持原回合", async () => {
  const h = host();
  await h.sync.newGame({});
  const before = clone(h.stores.A.wx_save);
  h.failWrites(true);
  await assert.rejects(send(h, "one"), { code: "WRITE_FAILED" });
  assert.deepEqual(h.state.game.save(), before);
  assert.deepEqual(h.stores.A.wx_save, before);
  h.failWrites(false);
  await h.sync.runInput({ messageId: 1, text: "one", actions: action });
  assert.equal(h.stores.A.wx_save.floor, 1);
});

test("超出保留范围或未知档版本：拒绝静默新建，原档不变", async () => {
  const h = host();
  await h.sync.newGame({});
  const before = clone(h.stores.A);
  h.histories.A[0].text = "changed opening";
  await assert.rejects(h.sync.reconcile(), { code: "HISTORY_OUTSIDE_WINDOW" });
  assert.deepEqual(h.stores.A, before);
  h.stores.A.wx_save.v = 99;
  await assert.rejects(h.sync.rebuild(), { code: "SAVE_VERSION_UNSUPPORTED" });
  assert.equal(h.stores.A.wx_save.v, 99);
});

test("重开清理：清快照和时间线，保留最后完整档备份", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  const before = clone(h.stores.A.wx_save);
  await h.sync.resetGame();
  assert.equal(h.stores.A.wx_save, null);
  assert.equal(h.stores.A.wx_snap, null);
  assert.equal(h.stores.A.wx_timeline, null);
  assert.deepEqual(h.stores.A.wx_sync_backup.save, before);
});

test("缺失宿主身份时明确降级，不伪造聊天身份", async () => {
  let store = {};
  const state = { game: null, conf: { autoSettle: false } };
  const sync = createChatSync({
    state,
    vars: {
      read: async () => store,
      assign: async (x) => Object.assign(store, clone(x)),
    },
    createGame,
    defaultInit: () => ({ sessionSalt: "fallback" }),
    syncTargetWorldbook: async () => ({}),
    applyTargetOpening: async () => ({}),
  });
  await sync.newGame({});
  await sync.runInput({ messageId: 1, text: "one", actions: [] });
  assert.equal(sync.getSyncDiagnostics().capabilities.timeline, false);
  assert.equal(store.wx_diag.sync.scopeVerified, false);
});

test("跨实例版本冲突拒绝覆盖；损坏档可以从备份显式恢复", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  h.stores.A.wx_timeline.revision++;
  const previous = clone(h.stores.A);
  await assert.rejects(h.sync.persist(), { code: "WRITE_CONFLICT" });
  assert.deepEqual(h.stores.A, previous);
  h.stores.A.wx_save.v = 99;
  await assert.rejects(h.sync.rebuild(), { code: "SAVE_VERSION_UNSUPPORTED" });
  await h.sync.restoreBackup();
  assert.equal(h.stores.A.wx_save.v, 2);
  assert.equal(h.stores.A.wx_sync_backup.save.v, 99, "恢复前的原档仍可追查");
});

test("时间线保留窗口有界；过早历史修改阻止保存覆盖原档", async () => {
  const h = host();
  await h.sync.newGame({});
  for (let i = 0; i < 70; i++) {
    await send(h, String(i));
    h.reply();
    await h.sync.runReply({ text: "reply" });
  }
  assert.ok(h.stores.A.wx_timeline.nodes.length <= 64);
  const before = clone(h.stores.A);
  h.histories.A[1].text = "older than retained checkpoint";
  await assert.rejects(h.sync.reconcile(), { code: "HISTORY_OUTSIDE_WINDOW" });
  await assert.rejects(h.sync.persist(), { code: "HISTORY_OUTSIDE_WINDOW" });
  assert.deepEqual(h.stores.A, before);
});

test("旧脚本未更新时间线版本而直接改写存档时，也拒绝覆盖", async () => {
  const h = host();
  await h.sync.newGame({});
  h.stores.A.wx_save.ledgerState.cash += 100;
  const before = clone(h.stores.A);
  await assert.rejects(h.sync.persist(), { code: "WRITE_CONFLICT" });
  assert.deepEqual(h.stores.A, before);
});
