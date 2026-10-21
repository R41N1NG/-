"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createChatSync } = require("../src/host/chat-sync/controller.js");

function fixture({ failRead, failWrite, failPublish, deferWrite } = {}) {
  const store = {},
    writes = [],
    published = [],
    created = [];
  const state = { game: null, conf: { autoSettle: false } };
  let release;
  const game = {
    _g: { targetId: "college" },
    snapshot: () => ({ player: { stamina: 87 } }),
    save: () => ({ v: 1, floor: 7, sessionSalt: "saved-salt" }),
  };
  const sync = createChatSync({
    state,
    vars: {
      read: async () => {
        if (failRead) throw failRead;
        return store;
      },
      assign: async (patch) => {
        writes.push(patch);
        if (failWrite) throw failWrite;
        if (deferWrite)
          await new Promise((resolve) => {
            release = resolve;
          });
        Object.assign(store, patch);
      },
    },
    createGame: (options) => {
      created.push(options);
      return game;
    },
    defaultInit: () => ({ mode: "stealth" }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
    publishSnapshot: async (snap) => {
      if (failPublish) throw failPublish;
      published.push(snap);
    },
    now: () => 100,
  });
  return {
    store,
    writes,
    published,
    created,
    state,
    game,
    sync,
    release: () => release(),
  };
}

test("CHAT_SYNC 读档：恢复 v1 存档并加载聊天配置", async () => {
  const f = fixture();
  f.store.wx_save = { v: 1, floor: 7, sessionSalt: "saved-salt" };
  f.store.wx_conf = { autoSettle: true };
  assert.equal(await f.sync.rebuild(), f.game);
  assert.deepEqual(f.created, [{ saved: f.store.wx_save }]);
  assert.equal(f.state.conf.autoSettle, true);
  assert.equal(f.writes.length, 0);
  assert.equal(f.sync.getSyncDiagnostics().events.at(-1).stage, "restore.done");
});

test("CHAT_SYNC 保存：档与快照同次提交，收到宿主应答后才通知界面", async () => {
  const f = fixture({ deferWrite: true });
  f.state.game = f.game;
  const saving = f.sync.persist();
  for (let i = 0; i < 20 && !f.writes.length; i++)
    await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.writes.length, 1);
  assert.deepEqual(f.writes[0].wx_save, f.game.save());
  assert.deepEqual(f.writes[0].wx_snap, f.game.snapshot());
  assert.equal(f.writes[0].wx_diag.floor, 7);
  assert.equal(f.published.length, 0);
  assert.equal(
    f.sync.getSyncDiagnostics().events.at(-1).stage,
    "persist.write",
  );
  f.release();
  await saving;
  assert.deepEqual(f.published, [f.game.snapshot()]);
  const report = f.sync.getSyncDiagnostics();
  assert.equal(report.events.at(-1).stage, "persist.done");
  report.events[0].stage = "changed";
  assert.notEqual(f.sync.getSyncDiagnostics().events[0].stage, "changed");
  assert.ok(
    !JSON.stringify(report).includes("saved-salt"),
    "诊断不得包含完整档内容",
  );
});

test("CHAT_SYNC 读取失败：保留原因和稳定错误码，不覆盖原档", async () => {
  const cause = new Error("read unavailable");
  const f = fixture({ failRead: cause });
  await assert.rejects(
    f.sync.rebuild(),
    (error) => error.code === "READ_FAILED" && error.cause === cause,
  );
  assert.equal(f.created.length, 0);
  assert.equal(f.writes.length, 0);
});

test("CHAT_SYNC 序列化失败：不写宿主变量、不发布未保存快照", async () => {
  const f = fixture();
  f.state.game = f.game;
  f.game.save = () => {
    throw new Error("invalid state");
  };
  await assert.rejects(f.sync.persist(), { code: "SERIALIZE_FAILED" });
  assert.equal(f.writes.length, 0);
  assert.equal(f.published.length, 0);
});

test("CHAT_SYNC 保存失败：保留原档，不将界面标为已更新", async () => {
  const f = fixture({ failWrite: new Error("storage unavailable") });
  f.state.game = f.game;
  f.store.wx_save = { v: 1, floor: 6 };
  await assert.rejects(f.sync.persist(), { code: "WRITE_FAILED" });
  assert.deepEqual(f.store.wx_save, { v: 1, floor: 6 });
  assert.equal(f.published.length, 0);
  assert.equal(f.sync.getSyncDiagnostics().events.at(-1).code, "WRITE_FAILED");
});

test("CHAT_SYNC 通知失败：已保存进度保留，单独记录界面通道故障", async () => {
  const f = fixture({ failPublish: new Error("window unavailable") });
  f.state.game = f.game;
  await f.sync.persist();
  assert.equal(f.store.wx_save.floor, 7);
  assert.equal(
    f.sync.getSyncDiagnostics().events.at(-1).code,
    "PUBLISH_FAILED",
  );
});

test("CHAT_SYNC 新局：写初始化、创建引擎、保存首快照依序完成", async () => {
  const f = fixture();
  await f.sync.newGame({ mode: "contact" });
  assert.deepEqual(f.writes[0].wx_init, { mode: "contact" });
  assert.equal(f.writes.length, 1, "新局只提交完整档，不写中间空档");
  assert.deepEqual(f.created, [{ mode: "contact" }]);
  assert.equal(f.state.game, f.game);
  assert.equal(f.store.wx_save.floor, 7);
  assert.equal(f.published.length, 1);
});

test("CHAT_SYNC 重开失败：不丢弃内存中的当前游戏", async () => {
  const f = fixture({ failWrite: new Error("reset unavailable") });
  f.state.game = f.game;
  await assert.rejects(f.sync.resetGame(), { code: "RESET_FAILED" });
  assert.equal(f.state.game, f.game);
});
