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
    writeGate = null,
    writeFail = false,
    failAfterWrite = false;
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
        if (writeGate) {
          const wait = writeGate;
          writeGate = null;
          await wait;
        }
        Object.assign(stores[active], clone(patch));
        if (failAfterWrite) throw Error("acknowledgement lost");
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
    deferWrite() {
      let release;
      writeGate = new Promise((r) => {
        release = r;
      });
      return release;
    },
    failAfterWrite: (v) => {
      failAfterWrite = v;
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

test("首次差异精确到聊天第 0 楼；修复原聊天后重新校验解除阻塞", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  const before = clone(h.stores.A);
  h.histories.A[0].text = "changed";
  await assert.rejects(h.sync.reconcile(), (error) => {
    assert.equal(error.code, "HISTORY_OUTSIDE_WINDOW");
    assert.deepEqual(error.report.location, {
      index: 0,
      messageId: 0,
      kind: "changed",
      checkpointIndex: 0,
      gameTurn: 1,
    });
    return true;
  });
  assert.deepEqual(h.stores.A, before);
  h.histories.A[0].text = "opening";
  await h.sync.reconcile();
  assert.equal(h.sync.getSyncDiagnostics().blocked, null);
  assert.equal(h.sync.getSyncDiagnostics().lastFailure, null);
  assert.equal((await send(h, "two")).floor, 2);
});

test("缺失检查点内的楼层能报告最早缺失位置，不伪造现存消息 ID", async () => {
  const h = host();
  await h.sync.newGame({});
  h.histories.A.splice(0);
  await assert.rejects(h.sync.reconcile(), (error) => {
    assert.equal(error.report.location.index, 0);
    assert.equal(error.report.location.kind, "missing");
    assert.equal(error.report.location.messageId, undefined);
    return true;
  });
});

test("刷新后删楼：重新加载状态也必须将恢复结果写回存档", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  const first = clone(h.stores.A.wx_save);
  await send(h, "two");
  h.histories.A.splice(3);
  await h.sync.rebuild();
  await h.sync.reconcile();
  assert.deepEqual(h.stores.A.wx_save, first);
});

test("删楼后直接执行命令：先恢复对应楼层，再修改物品", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  await send(h, "two");
  h.histories.A.splice(3);
  const itemId = Object.keys(require("../src/config/rules.json").items)[0];
  await h.sync.mutate("addItem", itemId, 1);
  assert.equal(h.stores.A.wx_save.floor, 1);
  assert.ok(h.stores.A.wx_save.player.inventory.find((i) => i.id === itemId));
});

test("提交前编辑聊天：取消草稿，不写入已经改变的历史", async () => {
  const h = host();
  await h.sync.newGame({});
  const before = clone(h.stores.A.wx_save);
  const release = h.defer();
  const pending = send(h, "one");
  await new Promise((r) => setImmediate(r));
  h.histories.A[1].text = "changed while saving";
  release();
  await assert.rejects(pending, { code: "HISTORY_CHANGED" });
  assert.deepEqual(h.stores.A.wx_save, before);
  assert.deepEqual(h.state.game.save(), before);
});

test("恢复备份按当前聊天检查点定位，不能直接载入备份末尾进度", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  await send(h, "two");
  h.reply();
  await h.sync.runReply({ text: "reply" });
  h.histories.A.splice(1);
  await h.sync.restoreBackup();
  assert.equal(h.stores.A.wx_save.floor, 0);
});

test("并发冲突重新校验后能继续；普通命令错误不锁死整局", async () => {
  const h = host();
  await h.sync.newGame({});
  h.stores.A.wx_timeline.revision++;
  await assert.rejects(h.sync.persist(), { code: "WRITE_CONFLICT" });
  await h.sync.reconcile();
  await assert.rejects(h.sync.mutate("unknown"), { code: "COMMAND_INVALID" });
  assert.equal(h.sync.getSyncDiagnostics().blocked, null);
  assert.equal((await send(h, "one")).floor, 1);
});

test("损坏的 replyPath 应在读档阶段明确拒绝；诊断没有正文且可安全复制", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "private input");
  h.stores.A.wx_timeline.nodes[0].replyPath = {};
  await assert.rejects(h.sync.rebuild(), (error) => {
    assert.equal(error.code, "TIMELINE_INVALID");
    assert.equal(error.report.location.index, 1);
    return true;
  });
  const report = h.sync.getSyncDiagnostics();
  assert.ok(!JSON.stringify(report).includes("private input"));
  report.lastFailure.location.index = 99;
  report.events.at(-1).location.index = 99;
  assert.equal(h.sync.getSyncDiagnostics().lastFailure.location.index, 1);
  assert.equal(h.sync.getSyncDiagnostics().events.at(-1).location.index, 1);
});

test("宿主已写入但应答失败：重新读取真实存档，重试同楼不能重复扣回合", async () => {
  const h = host();
  await h.sync.newGame({});
  h.failAfterWrite(true);
  await assert.rejects(send(h, "one"), { code: "WRITE_FAILED" });
  assert.equal(h.state.game.save().floor, 0);
  assert.equal(h.stores.A.wx_save.floor, 1);
  assert.equal(h.sync.getSyncDiagnostics().needsReload, true);
  h.failAfterWrite(false);
  const result = await h.sync.runInput({
    messageId: 1,
    text: "one",
    actions: action,
  });
  assert.equal(result.reused, true);
  assert.equal(h.stores.A.wx_save.floor, 1);
  assert.equal(h.state.game.save().floor, 1);
});

test("读取消息后正文变化：旧正文不能与新指纹一起结算", async () => {
  const h = host();
  await h.sync.newGame({});
  const messageId = h.user("new text");
  await assert.rejects(
    h.sync.runInput({ messageId, text: "old text", actions: action }),
    { code: "HISTORY_CHANGED" },
  );
  assert.equal(h.stores.A.wx_save.floor, 0);
});

test("公共保存入口也必须先匹配历史，不能将已删楼的进度重新写回", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  h.histories.A.splice(1);
  await h.sync.persist();
  assert.equal(h.stores.A.wx_save.floor, 0);
});

test("存储等待中改楼：应答后拒绝发布草稿，重新校验按已变历史恢复", async () => {
  const h = host();
  await h.sync.newGame({});
  const release = h.deferWrite();
  const pending = send(h, "one");
  await new Promise((r) => setImmediate(r));
  h.histories.A[1].text = "edited during storage";
  release();
  await assert.rejects(pending, { code: "HISTORY_CHANGED" });
  assert.equal(h.sync.getSyncDiagnostics().needsReload, true);
  await h.sync.reconcile();
  assert.equal(h.stores.A.wx_save.floor, 0);
  assert.equal(h.stores.A.wx_sync_backup.save.floor, 1);
});

test("超出窗口可显式保留当前存档继续，原档和时间线先备份，不清空游戏进度", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "one");
  const before = clone(h.stores.A);
  h.histories.A[0].text = "edited opening";
  await assert.rejects(h.sync.reconcile(), { code: "HISTORY_OUTSIDE_WINDOW" });
  await assert.rejects(h.sync.acceptCurrentSave(), {
    code: "RECOVERY_CONFIRM_REQUIRED",
  });
  assert.deepEqual(h.stores.A, before);
  await h.sync.acceptCurrentSave({ confirm: true });
  assert.deepEqual(h.stores.A.wx_save, before.wx_save);
  assert.deepEqual(h.stores.A.wx_sync_backup.save, before.wx_save);
  assert.deepEqual(h.stores.A.wx_sync_backup.timeline, before.wx_timeline);
  assert.equal(h.stores.A.wx_sync_backup.reason, "accept-current-save");
  assert.equal(h.sync.getSyncDiagnostics().blocked, null);
  assert.equal((await send(h, "two")).floor, 2);
});

test("保留现存进度恢复入口拒绝损坏或未知版本存档，不以新局替代", async () => {
  const h = host();
  await h.sync.newGame({});
  h.stores.A.wx_save.v = 99;
  const before = clone(h.stores.A);
  await assert.rejects(h.sync.acceptCurrentSave({ confirm: true }), {
    code: "SAVE_VERSION_UNSUPPORTED",
  });
  assert.deepEqual(h.stores.A, before);
});

test("切换聊天后旧恢复按钮的确认不能作用于新聊天", async () => {
  const h = host();
  await h.sync.newGame({});
  h.histories.A[0].text = "edited";
  await assert.rejects(h.sync.reconcile());
  const expectedEpoch = h.sync.getSyncDiagnostics().lastFailure.sessionEpoch;
  h.setActive("B");
  await assert.rejects(
    h.sync.acceptCurrentSave({ confirm: true, expectedEpoch }),
    { code: "RECOVERY_EXPIRED" },
  );
  assert.deepEqual(h.stores.B, {});
});

test("日程完整字段随聊天隔离和重读恢复，不从界面重新生成点数", async () => {
  const h = host();
  const plan = {
    schema: 1,
    period: 3,
    spent: 2,
    activity: {
      id: "tailing-current",
      kind: "tailing",
      name: "尾行进行中",
      cost: 2,
    },
    ended: false,
    source: "daily",
  };
  await h.sync.newGame({ dayPlan: plan });
  await send(h, "one");
  h.setActive("B");
  await h.sync.newGame({
    dayPlan: { ...plan, period: 0, spent: 0, activity: null },
  });
  assert.equal(h.stores.B.wx_snap.dayPlan.remaining, 4);
  h.setActive("A");
  await h.sync.reconcile();
  assert.equal(h.state.game.snapshot().dayPlan.remaining, 2);
  assert.deepEqual(h.stores.A.wx_save.dayPlan, plan);
  await h.sync.rebuild();
  assert.equal(h.state.game.snapshot().dayPlan.activity.id, "tailing-current");
});

test("本地命令：生成前的物品变化不被回复覆盖，回复分支切换保留对应状态", async () => {
  const h = host();
  await h.sync.newGame({});
  await send(h, "legacy turn");
  await h.sync.mutate("addItem", "coffee", 2);
  h.reply("original response");
  await h.sync.runReply({ text: "original response" });
  const count = () =>
    h.state.game.save().player.inventory.find((i) => i.id === "coffee")?.count;
  assert.equal(count(), 2);
  await h.sync.mutate("addItem", "coffee", 1);
  assert.equal(count(), 3);
  h.histories.A.at(-1).text = "alternative response";
  await h.sync.reconcile();
  assert.equal(count(), 2);
  h.histories.A.at(-1).text = "original response";
  await h.sync.reconcile();
  assert.equal(count(), 3);
  await h.sync.rebuild();
  await h.sync.reconcile();
  assert.equal(count(), 3);
});

test("路线改名沿聊天检查点保存，刷新不丢；保存失败回滚、旧聊天入口拒绝", async () => {
  const h=host();
  const p=require("../tools/build/college-preview-model").createPreview(null,{period:3,seed:"college-preview-2"});
  p.move("school_gate_b"); p.execute(p.request("start","daily.tailing")); p.follow(); p.follow();
  const init=p.save();
  await h.sync.newGame({saved:init});
  const route=h.state.game.snapshot().profile.routes[0]; assert.ok(route);
  const req=(name)=>({targetId:h.state.game.snapshot().target.id,id:route.id,name,sync:h.stores.A.wx_snap.dayPlan.sync});
  await h.sync.mutate("renameKnownRoute",req("校门归途"));
  assert.equal(h.stores.A.wx_save.investigation.routes[0].name,"校门归途");
  await h.sync.rebuild(); assert.equal(h.state.game.snapshot().profile.routes[0].name,"校门归途");
  h.failWrites(true);
  await assert.rejects(h.sync.mutate("renameKnownRoute",req("不应落盘")));
  h.failWrites(false);
  assert.equal(h.state.game.snapshot().profile.routes[0].name,"校门归途");
  await assert.rejects(h.sync.mutate("renameKnownRoute",{...req("旧入口"),sync:{scope:"stale",epoch:-1}}),{code:"DAY_STALE"});
  await h.sync.mutate("renameKnownRoute",req("再次命名"));
  assert.equal(h.stores.A.wx_save.investigation.routes[0].name,"再次命名");
});

test("路线名称跟随回复分支回退恢复，不串入其他分支", async () => {
  const h=host(), p=require("../tools/build/college-preview-model").createPreview(null,{period:3,seed:"college-preview-2"});
  p.move("school_gate_b"); p.execute(p.request("start","daily.tailing")); p.follow(); p.follow();
  await h.sync.newGame({saved:p.save()});
  await send(h,"advance"); h.reply("original route reply");
  await h.sync.runReply({text:"original route reply"});
  const s=h.stores.A.wx_snap, id=s.profile.routes[0].id;
  await h.sync.mutate("renameKnownRoute",{targetId:s.target.id,id,name:"分支路线",sync:s.dayPlan.sync});
  assert.equal(h.state.game.snapshot().profile.routes[0].name,"分支路线");
  h.histories.A.at(-1).text="alternative route reply";
  await h.sync.reconcile();
  assert.equal(h.state.game.snapshot().profile.routes[0].name,"归家路线");
  h.histories.A.at(-1).text="original route reply";
  await h.sync.reconcile();
  assert.equal(h.state.game.snapshot().profile.routes[0].name,"分支路线");
});
