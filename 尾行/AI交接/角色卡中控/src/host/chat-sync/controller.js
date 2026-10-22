"use strict";
const { VAR_SAVE, VAR_INIT, VAR_CONF, VAR_TIMELINE } = require("./keys.js");
const { createChatRepository } = require("./repository.js");
const { createSyncDiagnostics } = require("./diagnostics.js");
const { createSession } = require("./session.js");
const T = require("./timeline.js");
const { syncReport } = require("../../contracts/chat-sync-report.js");

/** [CHAT_SYNC:ENTRY] Serialized operations, guarded sessions and full-state recovery. */
function createChatSync({
  state,
  vars,
  createGame,
  defaultInit,
  syncTargetWorldbook,
  applyTargetOpening,
  publishSnapshot = () => {},
  clearReceipt = () => {},
  readContext = async () => ({ scope: null, history: null }),
  now = Date.now,
}) {
  const repository = createChatRepository(vars);
  const diagnostics = createSyncDiagnostics({ now });
  let journal = null,
    revision = null,
    queue = Promise.resolve(),
    disposed = false,
    blocked = null,
    hasSaved = false,
    savedFingerprint,
    lastFailure = null,
    needsReload = false;
  const session = createSession(readContext, (context, initialized) => {
    if (initialized) {
      state.game = null;
      state.conf = { autoSettle: false };
      state.pending = null;
      state.raced = false;
      journal = null;
      revision = null;
      blocked = null;
      lastFailure = null;
      needsReload = false;
      hasSaved = false;
      savedFingerprint = undefined;
      clearReceipt();
    }
    diagnostics.record("session.active", {
      verified: context?.scope != null,
      history: Array.isArray(context?.history),
    });
  });
  const fail = (code, message) => Object.assign(new Error(message), { code });
  function exclusive(operation) {
    // Capture before queuing: a queued A event may not become a B operation.
    const ticket = session.capture();
    ticket.catch(() => {});
    const task = queue.then(async () => {
      if (disposed) throw fail("SYNC_DISPOSED", "同步模块已卸载");
      const token = await ticket;
      await session.check(token);
      try {
        return await operation(token);
      } catch (cause) {
        await session.check(token); // 迟到的旧聊天错误不得污染当前会话。
        if (
          [
            "HISTORY_OUTSIDE_WINDOW",
            "TIMELINE_INVALID",
            "SAVE_INVALID",
            "SAVE_VERSION_UNSUPPORTED",
            "WRITE_CONFLICT",
          ].includes(cause.code)
        )
          blocked = cause.code;
        if (
          !["STALE_SESSION", "SYNC_DISPOSED"].includes(cause.code) &&
          session.epoch === token.epoch
        ) {
          cause.report = syncReport(cause, {
            gameTurn: state.game?._g?.floor,
            sessionEpoch: token.epoch,
          });
          lastFailure = cause.report;
          diagnostics.record("operation.failed", cause.report);
        }
        throw cause;
      }
    });
    queue = task.catch(() => {});
    return task;
  }
  async function readVariables(token) {
    diagnostics.record("read.start");
    await session.check(token);
    let value;
    try {
      value = (await repository.read()) || {};
    } catch (cause) {
      throw diagnostics.failure("read.failed", "READ_FAILED", cause);
    }
    await session.check(token);
    diagnostics.record("read.done");
    return value;
  }
  function syncConf(variables) {
    if (variables[VAR_CONF])
      state.conf = { ...state.conf, ...variables[VAR_CONF] };
  }
  function restore(save) {
    return createGame({ saved: T.clone(save) });
  }
  async function load(token, { force = false, beforeUser } = {}) {
    force = force || needsReload;
    if (blocked && !force)
      throw Object.assign(
        fail(blocked, "存档尚未完成校验，请恢复对应聊天或重新读取"),
        { location: lastFailure?.location },
      );
    if (state.game && !force) return state.game;
    const variables = await readVariables(token);
    syncConf(variables);
    diagnostics.record("restore.start");
    let game;
    try {
      const saved = variables[VAR_SAVE];
      savedFingerprint = T.fingerprint(saved ?? null);
      hasSaved = saved != null;
      if (saved != null) {
        if (![1, 2].includes(saved.v))
          throw fail("SAVE_VERSION_UNSUPPORTED", "存档版本不支持，原档已保留");
        game = restore(saved);
      } else
        game = createGame(
          Object.assign(
            defaultInit(variables[VAR_INIT]),
            variables[VAR_INIT] || {},
          ),
        );
      journal =
        variables[VAR_TIMELINE] == null
          ? null
          : T.validateTimeline(variables[VAR_TIMELINE]);
      revision = journal?.revision ?? null;
      if (token.scope && Array.isArray(token.context.history)) {
        if (!journal)
          journal = T.newTimeline(
            game.save(),
            token.context.history,
            token.scope,
            beforeUser,
          );
        const current = await session.check(token);
        const found = T.locate(journal, current.history);
        game = restore(found.save);
      }
    } catch (cause) {
      state.game = null;
      journal = null;
      if (cause.code) throw cause;
      throw diagnostics.failure("restore.failed", "RESTORE_FAILED", cause);
    }
    await session.check(token);
    state.game = game;
    needsReload = false;
    blocked = null;
    diagnostics.record("restore.done", { floor: game.save().floor });
    // Completion belongs to this session; late worldbook responses cannot update another chat's diagnostics.
    const targetId =
      game._g?.targetId || variables[VAR_INIT]?.targetId || "college";
    Promise.resolve(syncTargetWorldbook(targetId, () => session.check(token)))
      .then(async (result) => {
        try {
          await session.check(token);
          state.wb = result;
        } catch {}
      })
      .catch(() => {});
    return game;
  }
  function displaySnapshot(token) {
    const snap = state.game.snapshot();
    if (snap.dayPlan)
      snap.dayPlan.sync = {
        scope: T.fingerprint(token.scope ?? null),
        epoch: token.epoch,
      };
    return snap;
  }
  async function persist(token, { reason = "save", init, expectedPath } = {}) {
    if (blocked) throw fail(blocked, "时间线校验未完成，已阻止覆盖存档");
    diagnostics.record("persist.prepare");
    let snap, save;
    try {
      snap = displaySnapshot(token);
      save = state.game.save();
    } catch (cause) {
      throw diagnostics.failure(
        "persist.prepare.failed",
        "SERIALIZE_FAILED",
        cause,
      );
    }
    const previous = await readVariables(token);
    if ((previous[VAR_TIMELINE]?.revision ?? null) !== revision)
      throw fail(
        "WRITE_CONFLICT",
        "存档已被其他实例修改，请重新读取；本次未覆盖",
      );
    if (
      savedFingerprint !== undefined &&
      T.fingerprint(previous[VAR_SAVE] ?? null) !== savedFingerprint
    )
      throw fail("WRITE_CONFLICT", "存档正文被其他脚本修改；本次未覆盖");
    const nextJournal = T.clone(journal);
    if (nextJournal) {
      nextJournal.revision = (revision ?? 0) + 1;
      nextJournal.owner = token.scope;
    }
    const hostDiagnostics = {
      inject: state.injectMode || "unknown",
      verified: state.injectVerified ?? null,
      wb: state.wb
        ? {
            ok: !!state.wb.ok,
            skipped: !!state.wb.skipped,
            reason: state.wb.reason || state.wb.error || null,
            name: state.wb.name || null,
            active: state.wb.activeName || null,
          }
        : null,
      opening: state.opening || null,
      floor: save.floor,
      at: now(),
      sync: {
        scopeVerified: !!token.scope,
        timeline: !!nextJournal,
        revision: nextJournal?.revision ?? null,
        scope: token.scope,
        reason,
      },
    };
    const current = await session.check(token);
    if (
      expectedPath &&
      T.fingerprint(T.tokens(current.history || [])) !==
        T.fingerprint(expectedPath)
    )
      throw fail("HISTORY_CHANGED", "操作期间聊天发生变化，本次未保存");
    diagnostics.record("persist.write", { floor: save.floor });
    needsReload = true; // Promise 拒绝不代表宿主一定未落盘；下次操作须重新读取。
    try {
      await repository.writeSnapshot({
        save,
        snap,
        diagnostics: hostDiagnostics,
        timeline: nextJournal,
        backup: previous[VAR_SAVE]
          ? {
              save: previous[VAR_SAVE],
              timeline: previous[VAR_TIMELINE] || null,
              at: now(),
              reason,
            }
          : undefined,
        init,
      });
    } catch (cause) {
      throw diagnostics.failure("persist.failed", "WRITE_FAILED", cause);
    }
    const committedContext = await session.check(token);
    if (
      expectedPath &&
      T.fingerprint(T.tokens(committedContext.history || [])) !==
        T.fingerprint(expectedPath)
    )
      throw fail("HISTORY_CHANGED", "存储期间聊天发生变化，请重新校验");
    needsReload = false;
    journal = nextJournal;
    revision = journal?.revision ?? null;
    hasSaved = true;
    savedFingerprint = T.fingerprint(save);
    lastFailure = null;
    diagnostics.record("persist.done", { floor: save.floor });
    try {
      await publishSnapshot(snap, {
        scope: token.scope,
        revision,
        syncOk: true,
      });
    } catch {
      diagnostics.record("publish.failed", {
        code: "PUBLISH_FAILED",
        floor: save.floor,
      });
    }
    return snap;
  }
  function draftRollback(game, timeline, token) {
    return (error) => {
      if (session.epoch === token.epoch) {
        state.game = game;
        journal = timeline;
      }
      throw error;
    };
  }
  async function reconcile(token) {
    await load(token, { force: !!blocked });
    const context = await session.check(token);
    if (!hasSaved && (!journal || journal.nodes.length === 0)) {
      lastFailure = null;
      await publishSnapshot(null, { scope: token.scope, syncOk: true });
      return null;
    }
    if (!journal || !Array.isArray(context.history)) {
      const snap = displaySnapshot(token);
      lastFailure = null;
      await publishSnapshot(snap, { scope: token.scope, syncOk: true });
      return snap;
    }
    const found = T.locate(journal, context.history);
    const old = state.game,
      oldJournal = T.clone(journal);
    state.game = restore(found.save);
    try {
      // Reapply only reply declarations, never action settlement, when a swipe/edit changed prose.
      if (found.node) {
        const index = T.userIndex(
          context.history,
          context.history[found.node.path.length - 1]?.id,
        );
        const reply = context.history
          .slice(index + 1)
          .find((m) => m.role === "assistant");
        if (
          reply &&
          (!found.node.replyPath ||
            !T.prefix(found.node.replyPath, T.tokens(context.history)))
        ) {
          const end = context.history.indexOf(reply) + 1;
          if (!found.local || found.local.path.length < end)
            state.game.processReply(reply.text);
          found.node.replyPath = T.tokens(context.history.slice(0, end));
          found.node.after = state.game.save();
        }
      }
      if (
        T.fingerprint(old.save()) !== T.fingerprint(state.game.save()) ||
        savedFingerprint !== T.fingerprint(state.game.save()) ||
        T.fingerprint(oldJournal) !== T.fingerprint(journal) ||
        journal.owner !== token.scope
      )
        return await persist(token, {
          reason: "history-recovery",
          expectedPath: T.tokens(context.history),
        });
      const snap = displaySnapshot(token);
      lastFailure = null;
      await publishSnapshot(snap, {
        scope: token.scope,
        revision,
        syncOk: true,
      });
      return snap;
    } catch (error) {
      return draftRollback(old, oldJournal, token)(error);
    }
  }
  async function input(token, { messageId, text, actions = [] }) {
    await load(token, { beforeUser: messageId });
    const context = await session.check(token);
    if (journal && Array.isArray(context.history))
      state.game = restore(T.locate(journal, context.history).save);
    if (
      state.game._g?.dayPlan?.source === "daily" &&
      state.game._g.dayPlan.activity?.kind !== "tailing"
    ) {
      clearReceipt();
      return {
        narrativeOnly: true,
        floor: state.game.save().floor,
        stats: displaySnapshot(token),
      };
    }
    const path =
      journal && Array.isArray(context.history)
        ? T.inputPath(context.history, messageId)
        : null;
    if (
      path &&
      context.history[T.userIndex(context.history, messageId)]?.text !== text
    )
      throw fail("HISTORY_CHANGED", "读取的玩家消息已发生变化，本次未结算");
    const key = path && T.fingerprint(path);
    const existing = key && journal.nodes.find((n) => n.key === key);
    if (existing) {
      await reconcile(token);
      diagnostics.record("input.reused", { floor: existing.result.floor });
      return { ...T.clone(existing.result), reused: true };
    }
    const old = state.game,
      oldJournal = T.clone(journal);
    const before = journal
      ? T.locate(journal, context.history).save
      : old.save();
    state.game = restore(before);
    try {
      const result = state.game.settleInput(text, { actions });
      if (journal) {
        const after = state.game.save();
        journal.nodes.push({
          key,
          path,
          before: T.clone(before),
          afterInput: T.clone(after),
          after: T.clone(after),
          result: T.clone(result),
          replyPath: null,
        });
        T.prune(journal, path);
      }
      result.stats = await persist(token, {
        reason: "input",
        expectedPath: Array.isArray(context.history)
          ? T.tokens(context.history)
          : undefined,
      });
      return T.clone(result);
    } catch (error) {
      return draftRollback(old, oldJournal, token)(error);
    }
  }
  async function reply(token, { text, auto = false } = {}) {
    const context = await session.check(token);
    const index = T.userIndex(context.history);
    await load(token, {
      beforeUser: index >= 0 ? context.history[index].id : undefined,
    });
    if (!text) return null;
    if (journal && Array.isArray(context.history))
      state.game = restore(T.locate(journal, context.history).save);
    if (
      state.game._g?.dayPlan?.source === "daily" &&
      state.game._g.dayPlan.activity?.kind !== "tailing"
    )
      return null;
    const old = state.game,
      oldJournal = T.clone(journal);
    try {
      let node = null;
      if (journal && index >= 0) {
        const path = T.inputPath(context.history, context.history[index].id),
          key = T.fingerprint(path);
        node = journal.nodes.find((n) => n.key === key);
        if (!node && !auto) return null;
        if (!node) {
          const before = T.locate(journal, context.history).save;
          state.game = restore(before);
          const result = state.game.processFloor(text);
          node = {
            key,
            path,
            before,
            afterInput: state.game.save(),
            after: state.game.save(),
            result: T.clone(result),
            replyPath: null,
            auto: true,
          };
          journal.nodes.push(node);
          T.prune(journal, path);
        } else {
          const fullPath = T.tokens(context.history);
          if (node.replyPath && T.prefix(node.replyPath, fullPath)) {
            await reconcile(token);
            return T.clone(node.result);
          }
          const found = T.locate(journal, context.history);
          state.game = restore(found.save);
          if (!found.local || found.local.path.length <= index + 1)
            state.game.processReply(text);
        }
        node.replyPath = T.tokens(context.history);
        node.after = state.game.save();
      } else {
        state.game = restore(old.save());
        if (auto) state.game.processFloor(text);
        else state.game.processReply(text);
      }
      return await persist(token, {
        reason: "reply",
        expectedPath: Array.isArray(context.history)
          ? T.tokens(context.history)
          : undefined,
      });
    } catch (error) {
      return draftRollback(old, oldJournal, token)(error);
    }
  }
  async function newGame(token, init) {
    const previous = await readVariables(token),
      old = state.game,
      oldJournal = T.clone(journal);
    revision = previous[VAR_TIMELINE]?.revision ?? null;
    savedFingerprint = T.fingerprint(previous[VAR_SAVE] ?? null);
    try {
      state.game = createGame(Object.assign(defaultInit(init), init || {}));
      blocked = null;
      if (init?.targetId) {
        state.wb = await syncTargetWorldbook(init.targetId, () =>
          session.check(token),
        );
        await session.check(token);
        state.opening = await applyTargetOpening(init.targetId, () =>
          session.check(token),
        );
        await session.check(token);
      }
      const current = await session.check(token);
      journal =
        token.scope && Array.isArray(current.history)
          ? T.newTimeline(state.game.save(), current.history, token.scope)
          : null;
      state.pending = null;
      state.raced = false;
      clearReceipt();
      return await persist(token, { reason: "new-game", init });
    } catch (cause) {
      if (!cause.code)
        cause = diagnostics.failure("new.failed", "NEW_GAME_FAILED", cause);
      return draftRollback(old, oldJournal, token)(cause);
    }
  }
  function interrupt() {
    session.invalidate();
    state.pending = null;
    state.raced = false;
    clearReceipt();
  }
  return {
    rebuild: () => exclusive((token) => load(token, { force: true })),
    persist: () =>
      exclusive(async (token) => {
        if (journal) await reconcile(token);
        const context = await session.check(token);
        return persist(token, {
          expectedPath: Array.isArray(context.history)
            ? T.tokens(context.history)
            : undefined,
        });
      }),
    refreshConf: () =>
      exclusive(async (token) => {
        const v = await readVariables(token);
        syncConf(v);
        return v;
      }),
    newGame: (init) => {
      interrupt();
      return exclusive((token) => newGame(token, init));
    },
    resetGame: () => {
      interrupt();
      return exclusive(async (token) => {
        const previous = await readVariables(token);
        await session.check(token);
        try {
          await repository.reset(
            previous[VAR_SAVE]
              ? {
                  save: previous[VAR_SAVE],
                  timeline: previous[VAR_TIMELINE] || null,
                  at: now(),
                  reason: "reset",
                }
              : null,
          );
        } catch (cause) {
          throw diagnostics.failure("reset.failed", "RESET_FAILED", cause);
        }
        await session.check(token);
        state.game = null;
        journal = null;
        revision = null;
        blocked = null;
        diagnostics.record("reset.done");
        await publishSnapshot(null);
      });
    },
    setConf: (patch) =>
      exclusive(async (token) => {
        const next = { ...state.conf, ...patch };
        if (
          typeof next.autoSettle !== "boolean" ||
          (next.injectPos != null && ![0, 1, 2].includes(next.injectPos)) ||
          (next.injectDepth != null &&
            (!Number.isInteger(next.injectDepth) ||
              next.injectDepth < 0 ||
              next.injectDepth > 100))
        )
          throw fail("CONFIG_INVALID", "设置字段无效");
        await session.check(token);
        try {
          await repository.writeConf(next);
        } catch (cause) {
          throw diagnostics.failure(
            "config.failed",
            "CONFIG_WRITE_FAILED",
            cause,
          );
        }
        await session.check(token);
        state.conf = next;
        return { ...next };
      }),
    runInput: (options) => exclusive((token) => input(token, options)),
    runReply: (options) => exclusive((token) => reply(token, options)),
    reconcile: () => exclusive(reconcile),
    mutate: (method, ...args) =>
      exclusive(async (token) => {
        await reconcile(token);
        const commandContext = await session.check(token);
        const old = state.game,
          oldJournal = T.clone(journal);
        state.game = restore(old.save());
        const allowed = [
          "addItem",
          "removeItem",
          "equipItem",
          "unequipItem",
          "useItem",
          "nightFall",
          "executeDailyCommand",
        ];
        if (!allowed.includes(method))
          throw fail("COMMAND_INVALID", "不支持的游戏操作");
        try {
          if (method === "executeDailyCommand") {
            const guard = args[0]?.sync;
            if (
              !guard ||
              guard.scope !== T.fingerprint(token.scope ?? null) ||
              guard.epoch !== token.epoch
            )
              throw fail("DAY_STALE", "聊天已切换，请按当前日程重新选择");
            if (
              state.pending ||
              state.generating ||
              commandContext.history?.at(-1)?.role === "user"
            )
              throw fail("DAY_BUSY", "请等待当前回复完成后再安排活动");
          }
          const result = state.game[method](...args);
          if (method === "executeDailyCommand" && result.reused) return result;
          if (journal) {
            const context = await session.check(token);
            if (!Array.isArray(context.history))
              throw fail(
                "HISTORY_UNAVAILABLE",
                "宿主暂未提供完整聊天历史，请稍后再试",
              );
            T.checkpoint(journal, context.history, state.game.save());
          }
          await persist(token, {
            reason: "command",
            expectedPath: Array.isArray(commandContext.history)
              ? T.tokens(commandContext.history)
              : undefined,
          });
          return result;
        } catch (error) {
          return draftRollback(old, oldJournal, token)(error);
        }
      }),
    acceptCurrentSave: ({ confirm = false, expectedEpoch } = {}) =>
      exclusive(async (token) => {
        if (!confirm)
          throw fail("RECOVERY_CONFIRM_REQUIRED", "须确认以现存存档为准继续");
        if (expectedEpoch != null && expectedEpoch !== token.epoch)
          throw fail("RECOVERY_EXPIRED", "恢复操作所属聊天已经切换");
        const variables = await readVariables(token);
        const saved = variables[VAR_SAVE];
        if (!saved) throw fail("SAVE_INVALID", "没有可用于继续的完整存档");
        if (![1, 2].includes(saved.v))
          throw fail("SAVE_VERSION_UNSUPPORTED", "存档版本不支持");
        const candidate = restore(saved);
        const context = await session.check(token);
        if (!token.scope || !Array.isArray(context.history))
          throw fail(
            "RECOVERY_UNAVAILABLE",
            "宿主未提供完整聊天身份和历史，不能重建检查点",
          );
        const old = state.game,
          oldJournal = T.clone(journal);
        state.game = candidate;
        journal = T.newTimeline(candidate.save(), context.history, token.scope);
        revision = variables[VAR_TIMELINE]?.revision ?? null;
        savedFingerprint = T.fingerprint(saved);
        blocked = null;
        try {
          const snap = await persist(token, {
            reason: "accept-current-save",
            expectedPath: T.tokens(context.history),
          });
          state.pending = null;
          state.raced = false;
          clearReceipt();
          return snap;
        } catch (error) {
          return draftRollback(old, oldJournal, token)(error);
        }
      }),
    restoreBackup: () =>
      exclusive(async (token) => {
        const variables = await readVariables(token),
          backup = variables.wx_sync_backup;
        if (!backup?.save) throw fail("BACKUP_MISSING", "没有可恢复的备份");
        let candidate = restore(backup.save);
        const restoredJournal = backup.timeline
          ? T.validateTimeline(backup.timeline)
          : null;
        const context = await session.check(token);
        if (restoredJournal && Array.isArray(context.history))
          candidate = restore(T.locate(restoredJournal, context.history).save);
        const old = state.game,
          oldJournal = T.clone(journal);
        state.game = candidate;
        journal = restoredJournal;
        revision = variables[VAR_TIMELINE]?.revision ?? null;
        savedFingerprint = T.fingerprint(variables[VAR_SAVE] ?? null);
        blocked = null;
        try {
          return await persist(token, {
            reason: "backup-recovery",
            expectedPath: Array.isArray(context.history)
              ? T.tokens(context.history)
              : undefined,
          });
        } catch (error) {
          return draftRollback(old, oldJournal, token)(error);
        }
      }),
    getCurrentResult: () =>
      exclusive(async (token) => {
        await load(token);
        const context = await session.check(token);
        if (
          state.game._g?.dayPlan?.source === "daily" &&
          state.game._g.dayPlan.activity?.kind !== "tailing"
        )
          return { narrativeOnly: true, stats: displaySnapshot(token) };
        if (!journal) return null;
        return T.clone(T.locate(journal, context.history).node?.result || null);
      }),
    interrupt,
    captureSession: session.capture,
    checkSession: session.check,
    dispose: () => {
      disposed = true;
      interrupt();
    },
    getSyncDiagnostics: () => ({
      ...diagnostics.snapshot(),
      capabilities: {
        scopeVerified: journal?.owner != null,
        timeline: !!journal,
      },
      revision,
      blocked,
      needsReload,
      lastFailure: T.clone(lastFailure),
    }),
  };
}
module.exports = { createChatSync };
