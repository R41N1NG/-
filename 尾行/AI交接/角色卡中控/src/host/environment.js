"use strict";
const { scopeKey } = require("../contracts/chat-scope.js");

function hostFrames() {
  const list = [];
  try {
    let w = typeof window !== "undefined" ? window : null;
    while (w && list.length < 8 && !list.includes(w)) {
      list.push(w);
      let p = null;
      try {
        p = w.parent;
      } catch (e) {
        p = null;
      }
      if (!p || p === w) break;
      w = p;
    }
  } catch (e) {
    /* 跨源：到此为止 */
  }
  // Node 单测 / 非浏览器环境里 globalThis 与 window 不是同一个对象，两者都要探
  if (typeof globalThis !== "undefined" && !list.includes(globalThis))
    list.push(globalThis);
  return list;
}

function findTavernHelper() {
  for (const w of hostFrames()) {
    try {
      if (w && w.TavernHelper) return w.TavernHelper;
    } catch (e) {}
  }
  try {
    return typeof TavernHelper !== "undefined" ? TavernHelper : null;
  } catch (e) {
    return null;
  }
}

function detectApi() {
  const frames = hostFrames();

  /** 逐层找函数：先看该框架自身的同名全局，再看它的 TavernHelper。 */
  const pick = (name) => {
    for (const w of frames) {
      try {
        if (w && typeof w[name] === "function") return w[name].bind(w);
      } catch (e) {}
      try {
        const th = w && w.TavernHelper;
        if (th && typeof th[name] === "function") return th[name].bind(th);
      } catch (e) {}
    }
    return null;
  };

  const holder = (() => {
    for (const w of frames) {
      try {
        if (
          w &&
          typeof w.insertOrAssignVariables === "function" &&
          typeof w.getVariables === "function"
        )
          return w;
      } catch (e) {}
      try {
        const th = w && w.TavernHelper;
        if (
          th &&
          typeof th.insertOrAssignVariables === "function" &&
          typeof th.getVariables === "function"
        )
          return th;
      } catch (e) {}
    }
    return null;
  })();

  const vars = {
    has: !!holder,
    read: async () =>
      holder ? (await holder.getVariables({ type: "chat" })) || {} : {},
    assign: async (obj) => {
      if (holder) await holder.insertOrAssignVariables(obj, { type: "chat" });
    },
  };
  const subscriptions = [];
  let eventsDisposed = false;
  const onEvent = (name, fn) => {
    const callback = fn;
    fn = (...args) => {
      if (!eventsDisposed) return callback(...args);
    };
    for (const w of frames) {
      try {
        if (
          typeof w.eventOn === "function" &&
          w.tavern_events &&
          w.tavern_events[name]
        ) {
          const subscription = w.eventOn(w.tavern_events[name], fn);
          subscriptions.push(
            () =>
              subscription?.stop?.() ??
              w.eventRemoveListener?.(w.tavern_events[name], fn),
          );
          return true;
        }
      } catch (e) {}
      try {
        const th = w.TavernHelper;
        if (
          th &&
          typeof th.eventOn === "function" &&
          th.tavern_events &&
          th.tavern_events[name]
        ) {
          const subscription = th.eventOn(th.tavern_events[name], fn);
          subscriptions.push(
            () =>
              subscription?.stop?.() ??
              th.eventRemoveListener?.(th.tavern_events[name], fn),
          );
          return true;
        }
      } catch (e) {}
      try {
        if (w.eventSource && typeof w.eventSource.on === "function") {
          const eventName = w.event_types?.[name] || String(name).toLowerCase();
          w.eventSource.on(eventName, fn);
          subscriptions.push(() =>
            (w.eventSource.removeListener || w.eventSource.off)?.call(
              w.eventSource,
              eventName,
              fn,
            ),
          );
          return true; // 酒馆原生总线：事件名小写
        }
      } catch (e) {}
    }
    // 标准酒馆也可能只在 getContext() 返回原生总线，而不暴露 window.eventSource。
    for (const w of frames) {
      try {
        const ctx = w.SillyTavern?.getContext?.();
        const source = ctx?.eventSource;
        if (source?.on) {
          const event =
            ctx.eventTypes?.[name] ||
            ctx.event_types?.[name] ||
            String(name).toLowerCase();
          source.on(event, fn);
          subscriptions.push(() =>
            (source.removeListener || source.off)?.call(source, event, fn),
          );
          return true;
        }
      } catch {}
    }
    return false;
  };

  const getChatMessages = pick("getChatMessages");
  let readLast = null;
  if (getChatMessages) {
    readLast = async () => {
      try {
        const list = await getChatMessages(-1);
        return Array.isArray(list) ? list[list.length - 1] : list;
      } catch (e) {
        return null;
      }
    };
  }
  /** M4-1 按楼号精读（message_sent 事件自带 message_id；盲读 -1 在真机上读到空——2026-10-17 实测踩坑）。 */
  const readById = async (id) => {
    if (!getChatMessages) return null;
    const last = (arr) =>
      Array.isArray(arr) ? arr[arr.length - 1] || null : arr || null;
    // ① 事件楼号直读
    if (Number.isInteger(id) && id >= 0) {
      try {
        const m = last(await getChatMessages(id));
        if (m && (m.mes ?? m.content ?? m.message)) return m;
      } catch (e) {}
    }
    // ② 最新楼
    try {
      const m = last(await getChatMessages(-1));
      if (m && (m.mes ?? m.content ?? m.message)) return m;
    } catch (e) {}
    // ③ 时序兜底：事件早于消息落库时，等一拍再读（提示词组装在 message_sent 之后，120ms 足够安全）
    await new Promise((r) => setTimeout(r, 120));
    try {
      const m = last(await getChatMessages(-1));
      if (m) return m;
    } catch (e) {}
    return null;
  };

  /* ── 回执注入的两条通道（都不特化某一家酒馆） ──
     ① 酒馆助手 TavernHelper.injectPrompts（JS-Slash-Runner 系；返回值可能是 Promise，必须 await，rejected 也要接住）
     ② 酒馆原生 SillyTavern.getContext().setExtensionPrompt(key, value, position, depth, scan, role)
        —— 标准酒馆与分支都认这套；position 1 = IN_CHAT，role 0 = SYSTEM，老版本多传参会被忽略
     ③ 都没有 → 返回 null，调用方打印告警（回执进不了模型，模型只能盲写）
     2026-10-19 复核：部分分支里 TavernHelper 有变量 API 却没有 injectPrompts，且脚本跑在 iframe 内、
     父页面才有 SillyTavern —— 所以两条通道都要跨框架找，助手通道还要等它的 Promise 落地。 */
  const findCtx = () => {
    for (const w of frames) {
      try {
        const st = w && w.SillyTavern;
        if (!st || typeof st.getContext !== "function") continue;
        const ctx = st.getContext();
        if (ctx && typeof ctx.setExtensionPrompt === "function") return ctx;
      } catch (e) {}
    }
    return null;
  };
  const POS_HELPER = { 0: "in_prompt", 1: "in_chat", 2: "none" };
  const ROLE_HELPER = { 0: "system", 1: "user", 2: "assistant" };

  /** 注入回执。成功返回 { mode: "tavernhelper"|"native", verified }；全通道不可用返回 null。
   *  verified：原生通道能回读 extension_prompts 时才给出 true/false；读不到容器则为 null（无法验，不算失败）。 */
  const injectPrompts = async (blocks) => {
    const arr = Array.isArray(blocks) ? blocks : [blocks];
    const helperInject = pick("injectPrompts");
    if (helperInject) {
      try {
        await helperInject(
          arr.map((b) => ({
            id: b.id,
            position: POS_HELPER[b.position] || "in_chat",
            depth: Number.isFinite(b.depth) ? b.depth : 1,
            role: ROLE_HELPER[b.role] || "system",
            content: b.content,
          })),
        );
        return { mode: "tavernhelper", verified: null };
      } catch (e) {
        /* 抛错或 rejected 都落到原生通道 */
      }
    }
    const ctx = findCtx();
    if (!ctx) return null;
    let sent = 0;
    let verified = null;
    for (const b of arr) {
      const pos = Number.isFinite(b.position) ? b.position : 1;
      const depth = Number.isFinite(b.depth) ? b.depth : 1;
      const role = Number.isFinite(b.role) ? b.role : 0;
      try {
        ctx.setExtensionPrompt(b.id, b.content, pos, depth, false, role);
        sent++;
      } catch (e) {
        continue;
      }
      try {
        const bag = ctx.extension_prompts || ctx.extensionPrompts;
        if (bag && typeof bag === "object") {
          const slot = bag[b.id];
          const got =
            slot && (slot.value !== undefined ? slot.value : slot.content);
          if (got !== undefined) verified = got === b.content;
        }
      } catch (e) {}
    }
    return sent ? { mode: "native", verified } : null;
  };
  const uninjectPrompts = (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    const helperUninject = pick("uninjectPrompts");
    if (helperUninject) {
      try {
        Promise.resolve(helperUninject(arr)).catch(() => {});
      } catch (e) {}
    }
    const ctx = findCtx();
    if (ctx) {
      for (const id of arr) {
        try {
          ctx.setExtensionPrompt(id, "", 1, 1, false, 0);
        } catch (e) {}
      }
    }
  };

  const readContext = async () => {
    let ctx = null;
    for (const w of frames) {
      try {
        if (typeof w.SillyTavern?.getContext === "function") {
          ctx = w.SillyTavern.getContext();
          break;
        }
      } catch {}
    }
    const helperChatId = pick("getCurrentChatId");
    const chatId =
      ctx?.chatId ??
      ctx?.chat_id ??
      (helperChatId ? await helperChatId() : null);
    const characterId = ctx?.characterId ?? ctx?.this_chid ?? null;
    const scope = scopeKey(characterId, chatId);
    const history = Array.isArray(ctx?.chat)
      ? ctx.chat.map((m, index) => ({
          id: m.message_id ?? index,
          role: m.is_user ? "user" : m.is_system ? "system" : "assistant",
          text: String(m.mes ?? m.message ?? m.content ?? ""),
          swipe: m.swipe_id ?? null,
        }))
      : null;
    return { scope, history };
  };
  return {
    vars,
    readContext,
    dispose: () => {
      eventsDisposed = true;
      for (const stop of subscriptions.splice(0)) {
        try {
          stop();
        } catch {}
      }
    },
    onEvent,
    readLast,
    readById,
    injectPrompts,
    uninjectPrompts,
    generate: pick("generate"),
    stopAllGeneration: pick("stopAllGeneration"),
  };
}

function extractLlmText(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg;
  const m = msg.message ?? msg;
  if (typeof m === "string") return m;
  return String((m && (m.mes ?? m.content ?? m.message)) ?? "");
}

function hostFn(name) {
  for (const w of hostFrames()) {
    try {
      if (typeof w[name] === "function") return w[name].bind(w);
    } catch (e) {}
    try {
      const th = w && w.TavernHelper;
      if (th && typeof th[name] === "function") return th[name].bind(th);
    } catch (e) {}
  }
  return null;
}

function hostCharacterData() {
  for (const w of hostFrames()) {
    try {
      const st = w && w.SillyTavern;
      if (!st || typeof st.getContext !== "function") continue;
      const ctx = st.getContext();
      const ch =
        ctx &&
        ctx.characters &&
        ctx.characters[ctx.characterId ?? ctx.this_chid];
      if (ch && ch.data) return ch.data;
    } catch (e) {}
  }
  return null;
}

module.exports = {
  hostFrames,
  findTavernHelper,
  detectApi,
  extractLlmText,
  hostFn,
  hostCharacterData,
};
