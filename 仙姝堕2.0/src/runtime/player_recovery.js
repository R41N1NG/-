"use strict";
const C = require("./contracts");
const Identity = require("./message_identity");
const { resolveActionReply, readActionCode } = require("./action_wire");
const MAX_REPLIES = 12;
function createPlayerRecovery(h) {
  let inspected = null;
  const version = () => h.getState()?.revision ?? null;
  const blocked = (message) => ({
    status: "blocked",
    message,
    actions: [],
    canUndo: false,
  });
  function busy() {
    return h.adapter.isGenerating?.() || h.adapter.isSaving?.();
  }
  function sameScope(b, c) {
    return b?.chatId === c.chatId && b.branchId === c.branchId;
  }
  function undoable(b, c) {
    if (!sameScope(b, c)) return false;
    if (b.after)
      return b.after.token === h.token(c) && b.after.revision === version();
    // A reload or tab close may interrupt a repair before its final seal.
    return (
      b.originalToken === h.token(c) &&
      (h.getState()?.repairRunId === b.id ||
        version() === (b.before?.revision ?? b.baseRevision ?? null))
    );
  }
  async function inspect(c) {
    inspected = null;
    if (busy()) return blocked("请等回复生成和保存结束，再检查修复。");
    const backup = await h.adapter.readRepairBackup?.();
    h.guard(c);
    let safeState = null;
    const deny = (message) => {
      // A failed action already rolled back to a verified snapshot. If its
      // original reply cannot be recovered, clear only the stale task marker;
      // keep all current facts and require a fresh player choice.
      if (
        safeState &&
        !safeState.pending &&
        safeState.lastNodeResult?.actionMismatch &&
        !safeState.lastNodeResult.repairAcknowledged &&
        h.adapter.writeRepairBackup
      ) {
        const id = Identity.uid("repair_check");
        inspected = {
          id,
          token: h.token(c),
          revision: version(),
          actions: ["reset_failed"],
          base: C.clone(safeState),
          floors: [],
          historyRecovery: C.clone(safeState.historyRecovery),
        };
        return {
          id,
          status: "repairable",
          message:
            message + " 可一键清理失效任务，保留当前进度，再重新选择该节点。",
          actions: ["reset_failed"],
          canUndo: undoable(backup, c),
          replyCount: 0,
          firstFloor: null,
        };
      }
      return { ...blocked(message), canUndo: undoable(backup, c) };
    };
    if (undoable(backup, c) && (!backup.after || backup.after.failed))
      return deny(
        "上次修复未完成，修复前备份仍在。请先撤销本次修复，再重新检查。",
      );
    let found;
    try {
      found = await h.readState(c);
      h.guard(c);
    } catch (error) {
      return deny(
        "没有找到与当前分支匹配的可信进度。原存档已保留，请导出诊断；不会重置开局。",
      );
    }
    if (!found?.state) return deny("尚未建立进度，请先完成开局设置。");
    const state = C.clone(found.state),
      actions = ["refresh"];
    safeState = state;
    let message = "未发现漏结算。可以刷新状态栏与当前数值。",
      base = state,
      floors = [];
    const failure = state.lastNodeResult?.repairAcknowledged
      ? null
      : state.lastNodeResult;
    if (failure?.actionMismatch) {
      const expected = failure.actionMismatch.expectedCode;
      let pendingState = null;
      for (
        let i = Math.min(failure.floor - 1, c.floor);
        i >= Math.max(0, failure.floor - 100);
        i--
      ) {
        const e = (await h.adapter.readMessage(i))?.stat_data?.xsd2?.[0];
        h.guard(c);
        if (
          e?.state?.pending?.actionCode === expected &&
          e.state.pending.nodeId === failure.nodeId
        ) {
          const restored = e.identityTrail ? Identity.restore(e, c) : null;
          if (restored) {
            pendingState = restored.state;
            break;
          }
        }
      }
      if (!pendingState)
        return deny(
          "原操作快照已缺失，无法补认完成。进度已回退，请重新选择未完成节点。",
        );
      base = pendingState;
    }
    const p = base.pending;
    if (p) {
      const link = resolveActionReply(p, c);
      if (!p.authorization || !Identity.authorized(p.authorization, c))
        return deny("原操作不属于当前消息分支，请切回原候选后检查。");
      if (link.reason || link.replyFloor < 0) {
        if (!failure?.actionMismatch) {
          actions.push("cancel");
          message = link.reason + "。可以撤回这次中断操作后重新选择。";
        } else
          return deny("无法重放原操作：" + link.reason + "。不会补认完成。");
      } else {
        const extraCommand = c.chat
          .slice(link.userFloor + 1)
          .some(
            (m) =>
              m.is_user &&
              !m.is_system &&
              (readActionCode(m.mes) || /XSD2_/.test(m.mes)),
          );
        const otherReceipts = ["settlements", "receipts"].some((key) =>
          Object.keys(state[key] || {}).some(
            (id) => id !== p.id && !base[key]?.[id],
          ),
        );
        if (
          extraCommand ||
          otherReceipts ||
          JSON.stringify(state.manual) !== JSON.stringify(base.manual)
        )
          return deny(
            "原操作之后已有其他操作或人工调整，不能覆盖后续进度。请保留存档并导出诊断。",
          );
        floors = c.chat
          .map((m, i) =>
            !m.is_user && !m.is_system && i >= link.replyFloor ? i : -1,
          )
          .filter((i) => i >= 0);
        message =
          "发现原操作的回复未正确结算，将从第" +
          link.replyFloor +
          "楼起重新核验" +
          floors.length +
          "条回复。";
      }
    } else if (!failure?.actionMismatch) {
      floors = c.chat
        .map((m, i) => (!m.is_user && !m.is_system && i > found.floor ? i : -1))
        .filter(
          (i) =>
            i >= 0 &&
            !state.historyRecovery?.ignoredReplies?.includes(
              c.identities[i].revisionId,
            ),
        );
      if (floors.length)
        message = "发现" + floors.length + "条回复尚未结算，将按原顺序补核验。";
      else if (!h.getState())
        message = "找到当前分支的可信进度，可以重新读取并恢复显示。";
    }
    if (
      floors.some((i) =>
        state.historyRecovery?.ignoredReplies?.includes(
          c.identities[i].revisionId,
        ),
      )
    )
      return deny(
        "这些回复已在删楼恢复时作废，不能重新结算。请重新选择未完成节点。",
      );
    if (floors.length && h.adapter.isAborted?.()) {
      if (!p || failure?.actionMismatch)
        return deny("本次回复已中断，请先重新生成完整回复，再检查修复。");
      floors = [];
      actions.splice(0, actions.length, "cancel");
      message = "本次生成已中断，可以撤回这次操作后重新选择。";
    }
    if (floors.some((i) => !String(c.chat[i].mes || "").trim()))
      return deny("有回复尚未完成，请先完成或删除空回复后再检查。");
    if (floors.length > MAX_REPLIES)
      return deny("待核验回复超过12条，请导出诊断处理，避免一次重算过多历史。");
    if (floors.length) {
      actions.splice(0, 1, "replay");
    }
    if (!h.adapter.writeRepairBackup || !h.adapter.restoreRepairBackup)
      return deny("当前宿主不支持修复备份，请更新角色卡后重试。");
    const id = Identity.uid("repair_check");
    inspected = {
      id,
      token: h.token(c),
      revision: version(),
      actions,
      base,
      floors,
      historyRecovery: C.clone(state.historyRecovery),
    };
    return {
      id,
      status: floors.length ? "repairable" : p ? "interrupted" : "healthy",
      message,
      actions,
      canUndo: undoable(backup, c),
      replyCount: floors.length,
      firstFloor: floors[0] ?? null,
    };
  }
  async function run(c, id, action) {
    if (busy()) throw Error("请等回复生成和保存结束，再修复。");
    const plan = inspected;
    if (
      !plan ||
      plan.id !== id ||
      plan.token !== h.token(c) ||
      plan.revision !== version() ||
      !plan.actions.includes(action)
    )
      throw Error("聊天或进度已变化，请重新检查。");
    inspected = null;
    const before = C.clone(h.getState()),
      checkpoint = h.getCheckpoint(),
      repairId = Identity.uid("repair");
    const touched = [...plan.floors, c.floor];
    await h.adapter.writeRepairBackup(
      c,
      {
        id: repairId,
        createdAt: new Date().toISOString(),
        before,
        checkpoint,
        baseRevision: plan.base.revision,
        originalToken: h.token(c),
      },
      touched,
    );
    h.guard(c);
    try {
      let next = C.clone(plan.base);
      if (action === "cancel") next = C.clone(next.pending.before);
      if (action === "reset_failed") {
        next.lastNodeResult = {
          ...next.lastNodeResult,
          repairAcknowledged: true,
        };
      }
      if (action === "replay") {
        for (const floor of plan.floors) {
          h.guard(c);
          next.repairRunId = repairId;
          const result = await h.settle({ ...c, floor }, next);
          h.guard(c);
          if (result?.deferred || result?.skipped)
            throw Error("原回复暂时无法核验，请撤销本次修复后重试。");
          next = C.clone(h.getState());
        }
      }
      next.repairRunId = repairId;
      if (plan.historyRecovery)
        next.historyRecovery = C.clone(plan.historyRecovery);
      if (next.historyRecovery) next.historyRecovery.noticeAcknowledged = true;
      const replayMessage = next.pending
        ? "已核验原回复，但仍缺少有效结算回报，请重试该节点的结算。"
        : next.lastNodeResult?.outcome === "failure"
          ? "已核验原回复，节点未通过原有条件，可以重新选择。"
          : "已重新核验" + plan.floors.length + "条回复。";
      const message =
        action === "replay"
          ? replayMessage
          : action === "reset_failed"
            ? "已清理失效任务并保留当前进度。该节点尚未完成，请重新选择；未补发奖励或推进剧情。"
            : action === "cancel"
              ? "已撤回中断操作，可以重新选择。"
              : "已重新读取可信进度并刷新显示。";
      next.playerRepair = {
        id: repairId,
        action,
        replies: action === "replay" ? plan.floors.length : 0,
        at: new Date().toISOString(),
        message,
        revision: (h.getState()?.revision || next.revision || 0) + 1,
      };
      await h.commit(c, next, "player_repair");
      h.guard(c);
      await h.adapter.sealRepairBackup(c, repairId, {
        token: h.token(c),
        revision: version(),
      });
      return {
        status: "repaired",
        message,
        canUndo: true,
      };
    } catch (error) {
      // Leave a durable undo point even when persistence stopped part way through.
      if (h.token(c) === h.token(h.context())) {
        try {
          await h.adapter.sealRepairBackup(c, repairId, {
            token: h.token(c),
            revision: version(),
            failed: true,
          });
        } catch {}
      }
      throw Error(
        "修复未完成：" +
          error.message +
          "。已保留修复前备份，请重新检查并撤销本次修复。",
      );
    }
  }
  async function undo(c) {
    if (busy()) throw Error("请等回复生成和保存结束，再撤销。");
    const b = await h.adapter.readRepairBackup?.();
    h.guard(c);
    if (!undoable(b, c))
      throw Error("修复后聊天或进度已改变，不能覆盖后续进度。");
    await h.adapter.restoreRepairBackup(c, b.id);
    h.guard(c);
    h.install(C.clone(b.before), C.clone(b.checkpoint));
    inspected = null;
    if (h.getState()) await h.adapter.syncState?.(C.clone(h.getState()));
    h.notify("player_repair_undo");
    return {
      status: "undone",
      message: "已恢复到本次修复前的状态。",
      canUndo: false,
    };
  }
  async function oneClick(c) {
    if (busy()) throw Error("请等回复生成和保存结束，再一键修复。");
    const backup = await h.adapter.readRepairBackup?.();
    h.guard(c);
    if (undoable(backup, c) && (!backup.after || backup.after.failed)) {
      await undo(c);
      c = h.context();
    }
    const check = await inspect(c);
    h.guard(c);
    if (!check.actions.length)
      return {
        status: "blocked",
        message: check.message,
        canUndo: check.canUndo,
      };
    const action = ["replay", "reset_failed", "cancel", "refresh"].find((x) =>
      check.actions.includes(x),
    );
    if (
      action === "refresh" &&
      h.getState() &&
      (!inspected.historyRecovery ||
        inspected.historyRecovery.noticeAcknowledged)
    ) {
      await h.adapter.syncState?.(C.clone(h.getState()));
      h.guard(c);
      h.notify("player_repair");
      return {
        status: "refreshed",
        message: "已检查并刷新，当前没有需要修补的错误。",
        canUndo: check.canUndo,
      };
    }
    return run(c, check.id, action);
  }
  return { inspect, run, undo, oneClick };
}
module.exports = { createPlayerRecovery };
