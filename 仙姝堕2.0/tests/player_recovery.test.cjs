"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const C = require("../src/runtime/contracts"),
  I = require("../src/runtime/message_identity");
const { createDispatcher } = require("../src/runtime/dispatcher"),
  { createRepairBackup } = require("../src/host/repair_backup");
const { resolveActionReply } = require("../src/runtime/action_wire");
const data = require("../tools/data.cjs").load(path.join(__dirname, ".."));
function fixture() {
  const c = {
    chatId: "repair-test",
    branchId: "repair-test",
    chat: [{ mes: "<IdentityMenu/>", is_user: false }],
    chatMetadata: {},
  };
  let chatVars = {},
    generating = false,
    failPersist = false,
    failBackup = false,
    settles = 0;
  const sig = (chat) => JSON.stringify([C.fingerprint(chat), I.identify(chat)]);
  const a = {
    context: () => c,
    isGenerating: () => generating,
    isSaving: () => false,
    isAborted: () => false,
    readMessage: async (floor) =>
      C.clone(c.chat[floor]?.variables?.[c.chat[floor].swipe_id || 0] || {}),
    readCheckpoints: async () =>
      [C.clone(chatVars.xsd2_checkpoint)].filter(Boolean),
    persist: async (ctx, e) => {
      if (failPersist) throw Error("模拟保存失败");
      c.chat[ctx.floor].variables ||= [];
      c.chat[ctx.floor].variables[c.chat[ctx.floor].swipe_id || 0] = {
        stat_data: { xsd2: [C.clone(e)] },
      };
      chatVars.xsd2_checkpoint = C.clone(e);
    },
    send: async (text) => c.chat.push({ is_user: true, mes: text }),
    replaceOpening: async (text) => {
      c.chat[0].mes = text;
    },
    replaceStory: async (floor, text) => {
      c.chat[floor].mes = text;
    },
    setPrompt: () => {},
    syncState: async () => {},
    syncIdentity: async () => {},
    report: () => {},
  };
  const helper = {
    getVariables: async ({ type, message_id }) =>
      type === "chat" ? C.clone(chatVars) : a.readMessage(message_id),
    replaceVariables: async (v, { type, message_id }) => {
      if (type === "chat") chatVars = C.clone(v);
      else {
        c.chat[message_id].variables ||= [];
        c.chat[message_id].variables[c.chat[message_id].swipe_id || 0] =
          C.clone(v);
      }
    },
  };
  Object.assign(
    a,
    createRepairBackup({
      rawContext: () => c,
      context: () => c,
      helper,
      guard: (ctx) => {
        if (
          ctx.chatId !== c.chatId ||
          sig(ctx.chat) !== JSON.stringify([ctx.trail, ctx.identities])
        )
          throw Error("聊天已变化");
      },
      save: async () => {
        if (failBackup) throw Error("模拟备份失败");
      },
      withSaving: (fn) => fn(),
    }),
  );
  function runtime() {
    const r = createDispatcher(a, data);
    r.registerPlugin({
      id: "test",
      select: (_s, id) => ({
        id,
        actionText: "查看石碑",
        prompt: "查看石碑。",
        rewards: ["石片"],
      }),
      settle: () => {
        settles++;
        return {
          outcome: "success",
          rewards: [{ name: "石片", count: 1 }],
          pluginState: { done: true },
        };
      },
    });
    return r;
  }
  let r = runtime();
  return {
    c,
    a,
    get r() {
      return r;
    },
    get settles() {
      return settles;
    },
    get vars() {
      return chatVars;
    },
    start: () =>
      r.dispatchIntent({
        type: "SELECT_IDENTITY",
        payload: { identity: "赵无忧" },
      }),
    select: () => {
      const s = r.getSnapshot();
      return r.dispatchIntent({
        type: "SELECT_NODE",
        pluginId: "test",
        payload: { nodeId: "check" },
        expected: {
          chatId: s.chatId,
          branchId: s.branchId,
          floor: s.floor,
          revision: s.revision,
        },
      });
    },
    user: (text) => c.chat.push({ mes: text, is_user: true }),
    reply: (text) => c.chat.push({ mes: text, is_user: false }),
    reopen: async () => {
      r.dispose();
      r = runtime();
      await r.restore();
    },
    generating: (v) => {
      generating = v;
    },
    failPersist: (v) => {
      failPersist = v;
    },
    failBackup: (v) => {
      failBackup = v;
    },
  };
}
const prose = "你仔细查看了石碑。<Status_block><历时>—</历时></Status_block>";
const amount = (h) =>
  h.r.getSnapshot().inventory.find((x) => x.name === "石片")?.count || 0;
async function legacyFailure(h, historyRecovery) {
  const pending = C.clone(h.r.getSnapshot().pending),
    state = C.clone(pending.before);
  const c = {
    ...h.c,
    floor: h.c.chat.length - 1,
    trail: C.fingerprint(h.c.chat),
    identities: I.identify(h.c.chat),
  };
  state.revision = h.r.getSnapshot().revision + 1;
  state.pending = null;
  state.lastNodeResult = {
    nodeId: pending.nodeId,
    floor: c.floor,
    outcome: "failure",
    reason: "行动后的用户消息与授权行动不匹配",
    actionMismatch: {
      expectedCode: pending.actionCode,
      actualCode: pending.actionCode,
      userFloor: 1,
      boundUser: C.clone(pending.userRef),
      expectedReplyFloor: 2,
      reason: "当前回复不是原操作对应的回复",
    },
  };
  if (historyRecovery) state.historyRecovery = C.clone(historyRecovery);
  state.processed[c.floor] = C.hash(c.chat[c.floor].mes);
  state.history_identity = { version: 1, ...c.identities[c.floor] };
  await h.a.persist(c, {
    schema: 2,
    chatId: c.chatId,
    branchId: c.branchId,
    trail: c.trail,
    identityTrail: I.trail(c),
    state,
  });
  await h.reopen();
}

test("原操作绑定首个对应回复，后续普通输入不是原操作的回复", () => {
  const chat = [
    { mes: "开局" },
    { mes: "XSD2_check_12345678", is_user: true },
    { mes: "原回复" },
    { mes: "继续", is_user: true },
    { mes: "后续回复" },
  ];
  const identities = I.identify(chat),
    p = {
      floor: 0,
      actionCode: "XSD2_check_12345678",
      userRef: { messageId: identities[1].messageId },
    };
  assert.deepEqual(resolveActionReply(p, { chat, identities }), {
    userFloor: 1,
    replyFloor: 2,
    reason: "",
  });
  chat[1].mes = "修改输入";
  assert.match(resolveActionReply(p, { chat, identities }).reason, /改变/);
});
test("已完成回复漏结算可补核验，重复修复不重复奖励，正文不改", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  const original = h.c.chat.map((m) => m.mes);
  const plan = await h.r.inspectRecovery();
  assert.deepEqual(plan.actions, ["replay"]);
  assert.equal(plan.firstFloor, 2);
  await h.r.repair(plan.id, "replay");
  assert.equal(amount(h), 1);
  assert.equal(h.settles, 1);
  assert.equal(h.r.getSnapshot().pending, null);
  await assert.rejects(h.r.repair(plan.id, "replay"), /重新检查/);
  const again = await h.r.inspectRecovery();
  assert.deepEqual(again.actions, ["refresh"]);
  await h.r.repair(again.id, "refresh");
  assert.equal(amount(h), 1);
  assert.equal(h.settles, 1);
  assert.deepEqual(
    h.c.chat.map((m) => m.mes),
    original,
  );
});
test("原回复漏回调后继续普通聊天，自动按顺序补结算而不拖到后楼报失配", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  h.user("继续走走");
  h.reply("你继续沿路查看。");
  await h.r.settleStory();
  assert.equal(h.settles, 1);
  assert.equal(h.r.getSnapshot().lastNodeResult.actionMismatch, undefined);
  const p = await h.r.inspectRecovery();
  assert.equal(p.status, "healthy");
  await h.r.oneClickRecovery();
  assert.equal(amount(h), 1);
  assert.equal(h.settles, 1);
  assert.equal(h.r.getSnapshot().storyCount, 2);
  assert.equal(h.r.getSnapshot().lastNodeResult.outcome, "success");
});
test("修复备份跨重载可撤销，恢复原消息快照与聊天变量", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  const before = C.clone(h.r.getSnapshot()),
    vars = C.clone(h.vars),
    messageVars = C.clone(h.c.chat[2].variables);
  const p = await h.r.inspectRecovery();
  await h.r.repair(p.id, "replay");
  assert.equal(amount(h), 1);
  await h.reopen();
  const checked = await h.r.inspectRecovery();
  assert.equal(checked.canUndo, true);
  await h.r.undoRepair();
  assert.equal(amount(h), 0);
  assert.equal(h.r.getSnapshot().revision, before.revision);
  assert.deepEqual(h.vars, vars);
  assert.deepEqual(h.c.chat[2].variables, messageVars || [{}]);
  assert.equal(h.c.chatMetadata.xsd2_player_repair, undefined);
  await h.r.settleStory();
  assert.equal(amount(h), 0);
  await h.reopen();
  await h.r.flushCompleted();
  assert.equal(amount(h), 0);
});
test("继续聊天、编辑原文、切候选或人工调整后禁止旧面板修复及撤销", async () => {
  for (const mutate of [
    (h) => h.user("继续"),
    (h) => {
      h.c.chat[2].mes += "改";
    },
    (h) => {
      h.c.chat[2].swipe_id = 1;
    },
    async (h) =>
      h.r.dispatchIntent({
        type: "SET_CHARACTER_METRIC",
        payload: { character: "叶红缨", key: "好感度", value: 10 },
      }),
  ]) {
    const h = fixture();
    await h.start();
    await h.select();
    h.reply(prose);
    const p = await h.r.inspectRecovery();
    await h.r.repair(p.id, "replay");
    const old = await h.r.inspectRecovery();
    await mutate(h);
    await assert.rejects(h.r.repair(old.id, "refresh"), /重新检查/);
    await assert.rejects(h.r.undoRepair(), /不能覆盖/);
  }
});
test("生成中不可修复，备份失败不开始结算", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  h.generating(true);
  assert.equal((await h.r.inspectRecovery()).status, "blocked");
  h.generating(false);
  const p = await h.r.inspectRecovery();
  h.failBackup(true);
  await assert.rejects(h.r.repair(p.id, "replay"), /备份失败/);
  assert.equal(h.settles, 0);
  assert.equal(amount(h), 0);
});
test("保存中途失败保留撤销入口，恢复后可重试", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  const p = await h.r.inspectRecovery();
  h.failPersist(true);
  await assert.rejects(h.r.repair(p.id, "replay"), /修复未完成/);
  h.failPersist(false);
  assert.equal((await h.r.inspectRecovery()).canUndo, true);
  await h.r.undoRepair();
  assert.equal(amount(h), 0);
  const again = await h.r.inspectRecovery();
  await h.r.repair(again.id, "replay");
  assert.equal(amount(h), 1);
});
test("中断操作可撤销且能撤销修复本身，不强行完成节点", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  const p = await h.r.inspectRecovery();
  assert.ok(p.actions.includes("cancel"));
  await h.r.repair(p.id, "cancel");
  assert.equal(h.r.getSnapshot().pending, null);
  assert.equal(amount(h), 0);
  await h.r.undoRepair();
  assert.ok(h.r.getSnapshot().pending);
  assert.equal(h.settles, 0);
});
test("缺失原操作快照不强行完成，其他候选不可拿来补认", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  h.user("继续");
  h.reply("你看了看天色。");
  await legacyFailure(h);
  h.c.chat[0].variables = [];
  h.c.chat[1].variables = [];
  const p = await h.r.inspectRecovery();
  assert.equal(p.status, "repairable");
  assert.deepEqual(p.actions, ["reset_failed"]);
  assert.match(p.message, /缺失/);
  assert.equal(amount(h), 0);
  await h.r.oneClickRecovery();
  assert.equal(amount(h), 0);
  assert.equal(h.r.getSnapshot().lastNodeResult.repairAcknowledged, true);
});
test("正常补结算不因物品申报缺实证而阻断节点", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(
    "你放下石碑。<Status_block><纳戒>消耗：不存在的物品×1</纳戒></Status_block>",
  );
  const p = await h.r.inspectRecovery();
  await h.r.repair(p.id, "replay");
  assert.equal(amount(h), 1);
  assert.equal(h.r.getSnapshot().pending, null);
});
test("补核验超过上限或后续已有其他操作，不允许覆盖后续进度", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  for (let i = 0; i < 12; i++) {
    h.user("继续");
    h.reply("你沿路查看。");
  }
  assert.equal((await h.r.inspectRecovery()).status, "blocked");
  assert.equal(h.settles, 0);
  const k = fixture();
  await k.start();
  await k.select();
  k.reply(prose);
  k.user("XSD2_other_12345678");
  k.reply("另一次操作。");
  assert.match((await k.r.inspectRecovery()).message, /其他操作/);
});
test("备份未封口时重新加载仍能撤销，不把备份复制进逐楼变量", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  const p = await h.r.inspectRecovery();
  await h.r.repair(p.id, "replay");
  delete h.c.chatMetadata.xsd2_player_repair.after;
  await h.reopen();
  assert.equal((await h.r.inspectRecovery()).canUndo, true);
  assert.equal(JSON.stringify(h.vars).includes("originalToken"), false);
  for (const m of h.c.chat)
    assert.equal(JSON.stringify(m.variables).includes("originalToken"), false);
  await h.r.undoRepair();
  assert.equal(amount(h), 0);
});

test("一键补结算无需先检查，重复点击保留原备份且不重复奖励", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply(prose);
  const first = await h.r.oneClickRecovery();
  assert.equal(first.status, "repaired");
  assert.equal(amount(h), 1);
  const backup = h.c.chatMetadata.xsd2_player_repair.id;
  await h.r.oneClickRecovery();
  assert.equal(h.c.chatMetadata.xsd2_player_repair.id, backup);
  assert.equal(amount(h), 1);
  assert.equal(h.settles, 1);
  await h.r.undoRepair();
  assert.equal(amount(h), 0);
});
test("旧版遗留错误与旧删楼提醒可一键清理，进度不伪造且可撤销", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  h.reply("");
  h.user("继续");
  h.reply("你沿路查看。");
  const marker = {
    kind: "delete",
    trustedMessageId: h.c.chat[0].extra.xsd2_identity.messageId,
    ignoredReplies: ["old-discarded-reply"],
  };
  await legacyFailure(h, marker);
  const before = h.r.getSnapshot(),
    original = h.c.chat.map((x) => x.mes);
  const result = await h.r.oneClickRecovery();
  assert.match(result.message, /尚未完成/);
  assert.equal(amount(h), 0);
  assert.equal(h.settles, 0);
  const after = h.r.getSnapshot();
  assert.equal(after.lastNodeResult.repairAcknowledged, true);
  assert.equal(after.historyRecovery.noticeAcknowledged, true);
  assert.deepEqual(after.historyRecovery.ignoredReplies, marker.ignoredReplies);
  assert.deepEqual(after.calendarDate, before.calendarDate);
  assert.deepEqual(after.inventory, before.inventory);
  assert.deepEqual(
    h.c.chat.map((x) => x.mes),
    original,
  );
  assert.equal((await h.r.inspectRecovery()).status, "healthy");
  await h.r.undoRepair();
  assert.equal(h.r.getSnapshot().lastNodeResult.repairAcknowledged, undefined);
});
test("一键修复中断操作会自动选择撤回，备份能撤销", async () => {
  const h = fixture();
  await h.start();
  await h.select();
  await h.r.oneClickRecovery();
  assert.equal(h.r.getSnapshot().pending, null);
  assert.equal(h.settles, 0);
  await h.r.undoRepair();
  assert.ok(h.r.getSnapshot().pending);
});
test("11楼指令对应12楼，回调遗漏到16楼时先补12楼，不拿16楼误结算", async () => {
  const h = fixture();
  await h.start();
  for (let i = 0; i < 5; i++) {
    h.user("继续");
    h.reply("你查看四周。");
    await h.r.settleStory();
  }
  await h.select();
  assert.equal(h.r.getSnapshot().pending.userRef.floor, 11);
  h.reply(prose);
  h.user("继续");
  h.reply("你沿路查看。");
  h.user("继续");
  h.reply("你走到石亭。");
  await h.r.settleStory();
  assert.equal(h.r.getSnapshot().lastNodeResult.floor, 12);
  assert.equal(h.r.getSnapshot().lastNodeResult.outcome, "success");
  assert.equal(h.settles, 1);
  assert.equal(amount(h), 1);
  assert.equal(h.r.getSnapshot().pending, null);
});
