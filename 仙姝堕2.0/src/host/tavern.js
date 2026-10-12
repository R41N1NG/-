"use strict";
const C = require("../runtime/contracts");
const { createWorldbookHost } = require("./worldbook");
function createTavernHost(win, doc, cardName, embeddedManagedEntries = []) {
  const top = (win && win.top) || (win && win.parent) || win;
  const helper =
    top?.TavernHelper ||
    win?.TavernHelper ||
    (typeof TavernHelper !== "undefined" ? TavernHelper : null);
  const st =
    top?.SillyTavern ||
    win?.SillyTavern ||
    (typeof SillyTavern !== "undefined" ? SillyTavern : null);
  if (!helper || !st?.getContext) throw Error("需要启用酒馆助手与脚本运行功能");
  const ctx = () => st.getContext();
  let aborted = false,
    generating = false;
  function context() {
    const c = ctx();
    const chid = c.characterId ?? c.this_chid;
    return {
      chatId: c.chatId || c.getCurrentChatId?.(),
      branchId: c.chatId || c.getCurrentChatId?.(),
      chat: c.chat,
      metadata: c.chatMetadata || {},
      card: c.characters?.[chid] || c.card,
      raw: c,
    };
  }
  const book = createWorldbookHost(helper, ctx, { expectedName: cardName, embeddedManagedEntries });
  const report = (e) => {
    console.error("[仙姝堕2.0]", e);
    top.toastr?.error(String(e.message || e), "仙姝堕");
  };
  function guard(c) {
    const n = context();
    if (
      n.chatId !== c.chatId ||
      JSON.stringify(C.fingerprint(n.chat)) !== JSON.stringify(c.trail)
    )
      throw Error("聊天已变化，取消写入");
  }
  async function save() {
    const c = ctx();
    if (c.saveChat) await c.saveChat();
    else if (c.saveChatDebounced) c.saveChatDebounced();
    else throw Error("宿主缺少聊天保存接口");
  }
  function preflightSend() {
    if (isGenerating()) throw Error("请等当前回复结束");
    if (
      !top.document.querySelector("#send_textarea") ||
      !top.document.querySelector("#send_but")
    )
      throw Error("未找到酒馆输入栏和发送按钮");
  }
  function visible(el) {
    if (!el?.isConnected) return false;
    for (let node = el; node; node = node.parentElement) {
      const style = top.getComputedStyle(node);
      if (
        node.hidden ||
        style.display === "none" ||
        ["hidden", "collapse"].includes(style.visibility)
      )
        return false;
    }
    return (
      typeof el.checkVisibility !== "function" ||
      el.checkVisibility({
        visibilityProperty: true,
        contentVisibilityAuto: true,
      })
    );
  }
  function isGenerating() {
    const c = ctx();
    const flag =
      typeof c.isGenerating === "function"
        ? c.isGenerating.call(c)
        : c.isGenerating;
    // A supported native boolean is authoritative. Some hosts expose a getter.
    if (typeof flag === "boolean") return flag;
    return generating || visible(top.document.querySelector("#mes_stop"));
  }

  const adapter = {
    context,
    getDiagnostics() {
      const c = context();
      return { cardVersion:c.card?.data?.character_version || c.card?.character_version || null,
        generating:isGenerating(), lifecycleGenerating:generating, aborted,
        stopVisible:visible(top.document.querySelector("#mes_stop")),
      };
    },
    report,
    isGenerating,
    isAborted: () => aborted,
    async readMessage(i) {
      return helper.getVariables({ type: "message", message_id: i });
    },
    async persist(c, e) {
      guard(c);
      const old = await helper.getVariables({
        type: "message",
        message_id: c.floor,
      });
      guard(c);
      await helper.replaceVariables(
        {
          ...old,
          stat_data: {
            ...(old?.stat_data || {}),
            ...C.clone(e.state.stat_data),
            xsd2: [C.clone(e)],
          },
        },
        { type: "message", message_id: c.floor },
      );
      guard(c);
      await save();
      guard(c);
      const back = await helper.getVariables({
        type: "message",
        message_id: c.floor,
      });
      guard(c);
      if (back?.stat_data?.xsd2?.[0]?.state?.revision !== e.state.revision)
        throw Error("本楼状态保存复核失败");
    },
    async syncState(state) {
      const id = context().chatId;
      const old = await helper.getVariables({ type: "chat" });
      if (context().chatId !== id) throw Error("聊天已切换");
      await helper.replaceVariables(
        { ...old, stat_data: C.clone(state?.stat_data || {}) },
        { type: "chat" },
      );
      await book.synchronizeState(
        state?.stat_data || {},
        () => context().chatId === id,
      );
    },
    preflightSend,
    fillInput(text) {
      const box = top.document.querySelector("#send_textarea");
      if (!box) throw Error("找不到输入栏");
      box.value = text;
      box.dispatchEvent(new top.Event("input", {bubbles:true}));
      box.focus();
    },
    async send(text) {
      preflightSend();
      const box = top.document.querySelector("#send_textarea");
      box.value = text;
      box.dispatchEvent(new top.Event("input", { bubbles: true }));
      aborted = false;
      top.document.querySelector("#send_but").click();
    },
    confirmExit: (n) =>
      Promise.resolve(
        top.confirm(
          (n.confirmText || "确定离开此处？") +
            "\n将推进" +
            n.exitDays +
            "日。",
        ),
      ),
    async replaceStory(i, text, refresh = "none") {
      const c = context(),
        trail = C.fingerprint(c.chat);
      if (i !== c.chat.length - 1 && i !== 0)
        throw Error("只允许修改最新正文或开场白");
      await helper.setChatMessages(
        [{ message_id: i, mes: text, message: text }],
        { refresh },
      );
      if (c.chat?.[i]) c.chat[i].mes = text;
      const n = context();
      if (n.chat?.[i]) n.chat[i].mes = text;
      if (
        n.chatId !== c.chatId ||
        !C.matches(trail.slice(0, i), C.fingerprint(n.chat))
      )
        throw Error("正文写入期间聊天变化");
      await save();
    },
    async replaceOpening(text) {
      await adapter.replaceStory(0, text, "affected");
    },
    async syncIdentity(identity) {
      const id = context().chatId;
      return book.synchronize(identity, () => context().chatId === id);
    },
    setPrompt(text) {
      const c = ctx();
      c.setExtensionPrompt?.("xsd2-event", text, 1, 0, false, 0);
    },
    markAborted(value) {
      aborted = value;
    },
    markGenerating(value) {
      generating = value;
    },
    helper,
    top,
    doc,
    cardName,
    isOurCard() {
      const c = context();
      const card = c.card;
      const curName = card?.name || card?.data?.name || c.raw?.name2 || "";
      if (!curName) return false;
      return curName === cardName || curName.startsWith("仙姝堕2.0");
    },
    on(event, fn) {
      const c = ctx(),
        name = c.eventTypes?.[event];
      if (!name) return () => {};
      c.eventSource.on(name, fn);
      return () => c.eventSource.removeListener(name, fn);
    },
  };
  return adapter;
}
module.exports = { createTavernHost };
