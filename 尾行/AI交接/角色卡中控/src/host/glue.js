// src/host/glue.js - 酒馆胶水（M4-1 拦截-结算-注入-放行管线）
// 主人定稿 2026-10-17：打字 → 中控转化 → 得到结果后发送放行 · 判定演出与生成同时进行（减少等待感）；
// 默认硬停（结算面板等人点「认」，只管面板收起，不挡生成）；插件设置可切「自动掷」（退回旧 generation_ended 全流程）；
// swipe 不重掷（种子纪律：同楼同输入同结果，LLM 只重写文字——注入不设 once，重生成仍受同一回执约束）。
// 环境探测三级降级（不同版本酒馆助手注入差异全兜住）：
//   变量 insertOrAssignVariables/getVariables（脚本全局函数）→ window.TavernHelper 同名 → 无则不启动
//   事件 eventOn+tavern_events → window.TavernHelper.eventOn → window.eventSource（酒馆原生总线）
// 纯浏览器（无酒馆）环境 startGlue() 返回 false 静默跳过，WxEngine 照常可手动用。
const {
  hostFrames,
  findTavernHelper,
  detectApi,
  extractLlmText,
  hostFn,
  hostCharacterData,
} = require("./environment.js");
const { defaultInit } = require("./initial-state.js");
const { receiptText } = require("./receipt.js");
const { syncTargetWorldbook } = require("./worldbook.js");
const { applyTargetOpening } = require("./opening.js");
const { createGame } = require("../runtime/game.js");

// [CHAT_SYNC:ROUTING] 同步生命周期只在 chat-sync/ 实现；这里负责宿主事件接线。
const {
  VAR_SAVE,
  VAR_SNAP,
  VAR_INIT,
  VAR_CONF,
} = require("./chat-sync/keys.js");
const { createChatSync } = require("./chat-sync/controller.js");

async function startGlue() {
  const api = detectApi();
  if (!api.vars.has)
    return { ok: false, reason: "无酒馆变量 API（非酒馆助手环境）" };

  // 卡名过滤：全局脚本挂在所有卡上，只在「尾行」卡才真正启动（壳的挂载也以 WxGlue 存在为前提）
  const g0 = typeof globalThis !== "undefined" ? globalThis : window;
  const nameReader = hostFn("getCurrentCharacterName");
  if (nameReader) {
    try {
      const name = String((await nameReader()) || "");
      if (name && !name.includes("尾行"))
        return { ok: false, reason: "非尾行卡（" + name + "）" };
    } catch (e) {
      /* 探测失败不拦截 */
    }
  }

  const state = {
    game: null,
    conf: { autoSettle: false },
    pending: null,
    raced: false,
    injectMode: null,
    injectVerified: null,
  };
  const sync = createChatSync({
    state,
    vars: api.vars,
    readContext: api.readContext,
    clearReceipt: () => {
      try {
        api.uninjectPrompts(["wx_receipt"]);
      } catch {}
    },
    createGame,
    defaultInit,
    syncTargetWorldbook,
    applyTargetOpening,
    publishSnapshot: (snap, metadata) => {
      if (typeof window !== "undefined") {
        const target = window.parent || window;
        target.postMessage(
          snap
            ? { wxSnap: snap, wxScope: metadata?.scope }
            : { wxReset: true, wxScope: metadata?.scope },
          "*",
        );
      }
    },
  });
  const { rebuild, persist, newGame, resetGame, setConf } = sync;
  await sync.refreshConf();

  /** 主闭环（自动掷模式 / 手动喂 / GM / 测试）：LLM 整楼输出 → 结算 → 写变量。 */
  async function handleFloor(llmText) {
    return sync.runReply({ text: String(llmText || ""), auto: true });
  }

  /** 演出通知：结算包递给状态栏（与 LLM 生成同时——面板等人认，不挡生成）。
   *  直调成功后立即退出，杜绝 postMessage 消息重复派发导致结算面板双重弹起与筹码倍增。 */
  function notifySettlePanel(r) {
    let shown = false;
    try {
      const top =
        typeof window !== "undefined" &&
        window.parent &&
        window.parent !== window
          ? window.parent
          : typeof window !== "undefined"
            ? window
            : null;
      if (
        top &&
        top.WxStatusbar &&
        typeof top.WxStatusbar.settle === "function"
      ) {
        top.WxStatusbar.settle(r.package);
        shown = true;
        return;
      }
      if (top) top.postMessage({ wxSettle: r.package }, "*");
    } catch (e) {
      console.warn("[M4] 面板直调失败：", e && e.message);
    }
    console.log("[M4] 面板通知已发", shown ? "（直调✓）" : "（仅消息通道）");
  }

  /** M4-1 玩家消息拦截：同步结算 → 注入回执 → 放行（生成照常，演出同时）。 */
  async function onUserSent(messageId) {
    const token = await sync.captureSession();
    const pending = { messageId };
    state.pending = pending;
    try {
      console.log(
        "[M4] MESSAGE_SENT 收到",
        messageId !== undefined ? "楼" + messageId : "",
      );
      if (state.conf.autoSettle) {
        console.log("[M4] 自动掷模式，跳过拦截");
        return;
      }
      const msg = await api.readById(messageId);
      const text = extractLlmText(msg);
      if (msg?.role === "assistant" || msg?.is_user === false) return;
      if (!text || text.trimStart().startsWith("/")) {
        console.log("[M4] 空输入/斜杠命令，放行不结算");
        return;
      }
      await sync.checkSession(token);
      const topWin =
        typeof window !== "undefined" &&
        window.parent &&
        window.parent !== window
          ? window.parent
          : typeof window !== "undefined"
            ? window
            : typeof globalThis !== "undefined"
              ? globalThis
              : null;
      let pickedActions = null;
      if (
        topWin &&
        topWin.WxStatusbar &&
        typeof topWin.WxStatusbar.consumeActiveActions === "function"
      ) {
        try {
          pickedActions = topWin.WxStatusbar.consumeActiveActions();
        } catch (e) {}
      }
      const actSummary =
        pickedActions && pickedActions.length
          ? pickedActions.map((a) => `${a.id}(${a.name || a.id})`).join(", ")
          : "未选胶囊（纯叙事）";
      console.log(
        `[M4] 动作输入：[${actSummary}] ｜ 伴随叙事：${String(text).slice(0, 30)}`,
      );
      // 主人定：手打绝对无效，只认胶囊。没点胶囊就传空队列，文本不参与任何动作归一。
      const r = await sync.runInput({
        messageId,
        text,
        actions: pickedActions || [],
      });
      await sync.checkSession(token);
      console.log(
        `[M4] 结算完成：楼${r.floor} · 动作${r.package.actions.length}个${r.package.narrativeOnly ? "（纯叙事）" : ""}`,
      );
      let injectRes = null;
      if (api.injectPrompts) {
        try {
          api.uninjectPrompts(["wx_receipt"]);
        } catch (e) {}
        // 位置/深度可由 wx_conf 覆盖（某些分支对 IN_CHAT 的处理不同：模型看不见回执时试 0/2 或 depth 0，不必改卡）
        const pos = Number.isInteger(state.conf.injectPos)
          ? state.conf.injectPos
          : 1;
        const depth = Number.isInteger(state.conf.injectDepth)
          ? state.conf.injectDepth
          : 1;
        injectRes = await api.injectPrompts([
          {
            id: "wx_receipt",
            position: pos,
            depth,
            role: 0,
            content: receiptText(r),
          },
        ]);
      }
      state.injectMode = injectRes ? injectRes.mode : "none";
      state.injectVerified = injectRes ? injectRes.verified : null;
      if (injectRes) {
        console.log(
          `[M4] 回执已注入 ✓（通道：${injectRes.mode}）` +
            (injectRes.verified === null
              ? ""
              : injectRes.verified
                ? "，回读校验通过"
                : "，回读校验不符"),
        );
      } else {
        console.warn(
          "[M4] 回执注入失败：TavernHelper.injectPrompts 与 SillyTavern.setExtensionPrompt 都不可用——模型将看不到中控真值",
        );
      }
      await sync.checkSession(token);
      await persist();
      await sync.checkSession(token);
      if (!r.reused) notifySettlePanel(r);
      console.log("[M4] 面板通知已发 ✓");
      if (state.raced && api.stopAllGeneration && api.generate) {
        // 竞速兜底：生成抢跑则停了重发
        state.raced = false;
        try {
          api.stopAllGeneration();
        } catch (e) {}
        try {
          await api.generate({});
        } catch (e) {}
      }
    } catch (e) {
      console.warn("[M4] 拦截结算失败：", e && (e.stack || e.message || e));
      if (!["STALE_SESSION", "SYNC_DISPOSED"].includes(e.code)) reportError(e);
    } finally {
      if (state.pending === pending) state.pending = null;
    }
  }

  /** M4-1 回执相：LLM 写完 → 只处理事实/谎言/模式（零账目，swipe 重跑安全）。 */
  let generationSession = null;
  function reportError(error) {
    const top = typeof window !== "undefined" ? window.parent || window : null;
    top?.WxStatusbar?.reportSyncError?.(error.code || "SYNC_FAILED");
  }
  async function onReplyEnded() {
    const ticket = generationSession;
    try {
      if (ticket) await sync.checkSession(await ticket);
      await sync.refreshConf();
      const msg = api.readLast ? await api.readLast() : null;
      if (msg?.role === "user" || msg?.is_user === true) return;
      const text = extractLlmText(msg);
      if (ticket) await sync.checkSession(await ticket);
      await sync.runReply({ text, auto: state.conf.autoSettle });
    } catch (error) {
      console.warn("[CHAT_SYNC:REPLY_FAILED]", error);
      if (error.code !== "STALE_SESSION") reportError(error);
    }
  }
  async function refreshHistory() {
    try {
      const token = await sync.captureSession();
      await sync.reconcile();
      const result = await sync.getCurrentResult();
      await sync.checkSession(token);
      if (result?.package)
        await api.injectPrompts([
          {
            id: "wx_receipt",
            position: 1,
            depth: 1,
            role: 0,
            content: receiptText(result),
          },
        ]);
      else api.uninjectPrompts(["wx_receipt"]);
    } catch (error) {
      console.warn("[CHAT_SYNC:RECOVERY_FAILED]", error);
      if (!["STALE_SESSION", "SYNC_DISPOSED"].includes(error.code))
        reportError(error);
    }
  }
  g0.WxGlue?.dispose?.();
  api.onEvent("MESSAGE_SENT", (messageId) => {
    onUserSent(messageId).catch((error) => reportError(error));
  });
  api.onEvent("GENERATION_STARTED", () => {
    generationSession = sync.captureSession();
    if (state.pending) state.raced = true;
  });
  api.onEvent("GENERATION_ENDED", onReplyEnded);
  api.onEvent("CHAT_CHANGED", () => {
    generationSession = null;
    sync.interrupt();
    try {
      api.stopAllGeneration?.();
    } catch {}
    refreshHistory();
  });
  for (const name of ["MESSAGE_DELETED", "MESSAGE_UPDATED", "MESSAGE_SWIPED"])
    api.onEvent(name, refreshHistory);

  if (typeof globalThis !== "undefined") {
    globalThis.WxGlue = {
      handleFloor,
      rebuild,
      persist,
      newGame,
      resetGame,
      setConf,
      command: sync.mutate,
      reconcile: sync.reconcile,
      restoreBackup: sync.restoreBackup,
      dispose: () => {
        api.dispose();
        sync.dispose();
      },
      getSyncDiagnostics: sync.getSyncDiagnostics,
      syncTargetWorldbook,
      onUserSent,
      onReplyEnded,
      get game() {
        return state.game;
      },
      get conf() {
        return state.conf;
      },
    };
  }
  return { ok: true, hasEvent: true, hasReadLast: !!api.readLast };
}

module.exports = {
  startGlue,
  syncTargetWorldbook,
  applyTargetOpening,
  receiptText,
  VAR_SAVE,
  VAR_SNAP,
  VAR_INIT,
  VAR_CONF,
};
