"use strict";
const data = require("./generated-data");
const C=require("./runtime/contracts");
const { createDispatcher } = require("./runtime/dispatcher");
const { createTavernHost } = require("./host/tavern");
const {createSettlementEffects} = require("./ui/settlement_effects");
const { mountHUD } = require("./ui/status_panel");
const {downloadDiagnostics}=require("./ui/diagnostics");
const {openRecovery}=require('./ui/recovery_panel');
const CARD_NAME = "仙姝堕2.0·框架测试";
function start(win) {
  const topWin = (win && win.top) || (win && win.parent) || win;
  const liveHandoff=topWin.XSD2?.runtime?.getSnapshot?.() || null;
  const liveCheckpoint=topWin.XSD2?.runtime?.getCheckpoint?.() || null;
  const host = createTavernHost(win, topWin.document, CARD_NAME, data.embeddedManagedEntries,liveHandoff,liveCheckpoint),
    doc = host.top.document || topWin.document || win.document;
  host.top.XSD2?.dispose?.();
  const runtime = createDispatcher(host, data);
  const huds = new Map();
  let renderEpoch = 0,
    disposed = false,
    renderTimer = null,
    moDebounce = null;
  const effects=createSettlementEffects(doc,()=>scheduleRender(0));
  const unsubs = [],
    plugins = [];
  runtime.uiPlugins = plugins;
  function active() {
    return !disposed && host.isOurCard();
  }
  let settleFaultKey=null,lastReportKey=null,recoveryPanel=null;
  function showRecovery(error){
    if(error?.code!=="XSD2_RECOVERY_MISMATCH" && !String(error?.message || error).includes("已有进度记录与当前分支不匹配"))return;
    const c=host.context(),chat=doc.querySelector("#chat");
    const rows=[...(chat?.querySelectorAll(".mes") || [])];
    const body=rows.reverse().find(row=>{const m=c.chat[Number(row.getAttribute("mesid"))];return m&&!m.is_user&&!m.is_system;})?.querySelector(".mes_text");
    if(!body)return;
    recoveryPanel?.remove();recoveryPanel=doc.createElement("aside");recoveryPanel.dataset.xsd2Recovery="";
    recoveryPanel.style.cssText="padding:16px;margin:12px 0;border:1px solid #ba944c;border-radius:12px;background:#18221d;color:#eee5cc";
    const title=doc.createElement("strong");title.textContent="仙姝堕 · 进度暂未恢复";
    const text=doc.createElement("p");text.textContent="原存档已保留，尚未重置或结算。请结束生成后重新读取；若仍失败，可下载诊断信息反馈。";
    const retry=doc.createElement("button");retry.textContent="重新读取存档";retry.onclick=async()=>{retry.disabled=true;try{await restore();settleFaultKey=null;lastReportKey=null;}catch(e){report(e);}finally{retry.disabled=false;}};
    const diagnostic=doc.createElement("button");diagnostic.textContent="下载诊断信息";diagnostic.onclick=()=>{
      try{downloadDiagnostics(doc,runtime,{recovery:true});}catch(e){report(e);}
    };
    const repair=doc.createElement('button');repair.textContent='一键修复';repair.onclick=()=>openRecovery(doc,runtime,report,{auto:true});
    recoveryPanel.append(title,text,retry,repair,diagnostic);body.append(recoveryPanel);
  }
  const faultKey=()=>{const c=host.context();return JSON.stringify([c.chatId,c.branchId,C.hash(JSON.stringify(C.fingerprint(c.chat)))]);};
  const report = e => {if(!active())return;const c=host.context(),message=String(e.message||e);const key=(message.includes("已有进度记录与当前分支不匹配")?JSON.stringify([c.chatId,c.branchId]):faultKey())+"|"+message;if(key===lastReportKey)return;lastReportKey=key;host.report(e);showRecovery(e);};
  async function render() {
    if (!active()) return;
    const epoch = ++renderEpoch, c = host.context();
    if(runtime.getSnapshot()){recoveryPanel?.remove();recoveryPanel=null;}
    effects.update(settleFaultKey===faultKey()?null:runtime.getSnapshot(),c);
    const chat = doc.querySelector("#chat");
    const rows = [...(chat?.querySelectorAll(".mes") || [])];
    const targets = [];
    const controlFloor=c.chat.findLastIndex(m=>!m.is_user&&!m.is_system);
    const canControl=!host.isGenerating() && !runtime.getSnapshot()?.pending;
    for (const [index, mes] of rows.entries()) {
      const id = mes.getAttribute("mesid");
      const floor = id === null ? index : Number(id), m = c.chat?.[floor];
      const body = mes.querySelector(".mes_text");
      if (!m || !body || mes.querySelector(".edit_textarea")) continue;
      if (m.is_user) {
        const shown = runtime.getActionDisplay(m.mes);
        if (shown && body.textContent.includes("XSD2_")) body.textContent = shown;
        continue;
      }
      if (m.is_system) continue;
      const latest = floor === c.chat.length - 1 || (floor===controlFloor && canControl);
      const s = latest && !host.isGenerating()
        ? runtime.getSnapshot() : await runtime.getFloorSnapshot(floor);
      if (epoch !== renderEpoch || host.context().chatId !== c.chatId || !active()) return;
      if (!s && !(floor === 0 && latest)) continue;
      const readOnly = !latest || host.isGenerating();
      const key = JSON.stringify([c.chatId, m.swipe_id || 0, s, readOnly,
        !s ? runtime.getOpeningView() : null, plugins.map(x => x.id), effects.revision]);
      targets.push({floor, body, s, readOnly, key});
    }
    if (epoch !== renderEpoch || !active()) return;
    const binding=host.getDiagnostics().worldbook;
    const warning=doc.querySelector('[data-xsd2-worldbook-warning]');
    warning?.remove();
    if(binding?.blocked){
      const target=targets.find(t=>!t.readOnly) || targets.at(-1);
      if(target){const note=doc.createElement('aside');note.dataset.xsd2WorldbookWarning='';note.setAttribute('role','status');note.textContent='世界书未同步：当前主书“'+binding.primary+'”，请绑定“'+binding.expectedName+'”后重新读取。原存档已保留。';note.style.cssText='padding:12px;border:1px solid #b98a50;color:#efce84';target.body.append(note);}
    }
    for (const [floor, record] of huds) {
      const target = targets.find(x => x.floor === floor);
      if (!target || record.el.parentElement !== target.body || record.target.readOnly !== target.readOnly) {
        record.hud.destroy(); record.el.remove(); huds.delete(floor);
      } else if (record.key !== target.key) {
        record.target.s = target.s;
        record.key = target.key;
        record.hud.render();
      }
    }
    for (const target of targets) {
      if (huds.has(target.floor)) continue;
      const el = doc.createElement("div");
      el.dataset.xsd2Root = "";
      el.dataset.xsd2Floor = String(target.floor);
      target.body.append(el);
      const view = Object.create(runtime);
      view.getSnapshot = () => target.s;
      view.subscribe = () => () => {};
      view.dispatchIntent = intent => target.readOnly
        ? Promise.reject(Error("历史状态仅供查看，请在最新回复中行动"))
        : runtime.dispatchIntent(intent);
      const panel = mountHUD(doc, el, view, data, report, {readOnly:target.readOnly,canRepair:target.floor===controlFloor&&!host.isGenerating(),settlementEffects:effects,getPlayerAvatar:()=>host.getPlayerAvatar?.(),focusLatest:()=>{const floor=runtime.getSnapshot()?.floor;(doc.querySelector('[data-xsd2-floor="'+floor+'"]') || [...doc.querySelectorAll("[data-xsd2-floor]")].sort((a,b)=>Number(a.dataset.xsd2Floor)-Number(b.dataset.xsd2Floor)).at(-1))?.scrollIntoView({behavior:"smooth",block:"center"});}});
      huds.set(target.floor, {el, hud:panel, key:target.key, target});
    }
  }
  async function mirror() {
    if (active()) await host.syncState(runtime.getSnapshot());
  }
  async function restore(options = {}) {
    if (!active()) return;
    await runtime.restore(options);
    recoveryPanel?.remove();recoveryPanel=null;
    await mirror();
    await render();
  }
  async function settle() {return host.withSaving(async()=>{
    if (!active()) return;
    const key=faultKey();if(settleFaultKey===key)return;
    try { await runtime.settleStory();settleFaultKey=null; } catch(error) {settleFaultKey=key;effects.reset();throw error;}
    await mirror();
    await render();
  });}
  function scheduleRender(delay = 60) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      void (async () => {
        await settle();
        await render();
      })().catch(report);
    }, delay);
  }
  function on(name, fn) {
    unsubs.push(
      host.on(name, (...args) => Promise.resolve(fn(...args)).catch(report)),
    );
  }
  let queuedSend=null;
  const gateSend=e=>{
    const target=e.target;
    const click=e.type==="click"&&target.closest?.("#send_but");
    const enter=e.type==="keydown"&&target.id==="send_textarea"&&e.key==="Enter"&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.isComposing;
    if((!click&&!enter)||!active()||host.isGenerating()||!host.isSaving())return;
    e.preventDefault();e.stopImmediatePropagation();
    if(queuedSend)return;
    const box=doc.querySelector("#send_textarea"),draft=box?.value,chatId=host.context().chatId;
    if(!draft?.trim())return;
    const notice=doc.createElement("p");notice.dataset.xsd2Saving="";notice.setAttribute("role","status");notice.textContent="正在保存上一轮，完成后发送这条消息…";box.parentElement.append(notice);
    const queued={notice};queuedSend=queued;
    void host.whenSaved().then(()=>{
      if(disposed||!active()||queuedSend!==queued||host.context().chatId!==chatId||box.value!==draft)return;
      if(settleFaultKey===faultKey())throw Error("上一轮保存未完成，本条消息尚未发送，草稿已保留。请先处理保存错误。");
      queuedSend=null;notice.remove();doc.querySelector("#send_but")?.click();
    }).catch(report).finally(()=>{if(queuedSend===queued)queuedSend=null;notice.remove();});
  };
  doc.addEventListener("click",gateSend,true);doc.addEventListener("keydown",gateSend,true);
  on("CHAT_CHANGED", ()=>{effects.reset();return restore();});
  on("MESSAGE_DELETED", ()=>{effects.reset();settleFaultKey=null;lastReportKey=null;return restore({afterDelete:true});});
  on("MESSAGE_SWIPED", async () => {
    host.markAborted(false);
    if (host.isGenerating()) return;
    await restore();
    await settle();
  });
  on("MESSAGE_UPDATED", () => scheduleRender(80));
  on("MESSAGE_EDITED", () => scheduleRender(80));
  on("USER_MESSAGE_RENDERED", () => {if(active())void runtime.bindActionUser().catch(report);scheduleRender(50);});
  // setChatMessages(refresh: affected) awaits this native event. Scheduling
  // instead of awaiting our queue avoids waiting for the intent that emitted it.
  on("CHARACTER_MESSAGE_RENDERED", () => scheduleRender(0));
  on("GENERATION_STARTED", async (_type, _options, dryRun) => {
    // Native prompt/token previews emit STARTED with dryRun=true and no ENDED.
    // They must neither acquire the action lock nor replay authoritative state.
    if (dryRun === true || !active()) return;
    const waitingChat=host.context().chatId;
    await host.whenSaved();
    if(!active() || host.context().chatId!==waitingChat)return;
    if((_type || "normal")==="normal")await runtime.flushCompleted();
    settleFaultKey=null;lastReportKey=null;
    host.markAborted(false);
    host.markGenerating(true);
    const startedChat=host.context().chatId;
    try {await runtime.replay(_type || "normal");}
    catch(error){
      if(host.context().chatId===startedChat){
        host.setPrompt("");
        const state=runtime.getSnapshot();
        if(state)await host.syncState({...state,stat_data:{...state.stat_data,node_trigger:null}});
      }
      throw error;
    }
    await mirror();
  });
  on("GENERATION_STOPPED", async () => {
    if (!active()) return;
    host.markAborted(true);
    host.markGenerating(false);
    await runtime.stop();
    await mirror();
    await render();
  });
  on("GENERATION_ENDED", async () => {
    host.markGenerating(false);
    await settle();
    scheduleRender(50);
  });
  // These commands retain the migrated registry's manual unlock / identity controls.
  on("MESSAGE_SENT", async () => {
    if (!active()) return;
    const m = host.context().chat.at(-1);
    if (!m?.is_user) return;
    void runtime.bindActionUser().catch(report);
    const match = String(m.mes)
      .trim()
      .match(/^\/?(解锁|锁定|身份|段位)\s+(.+)$/);
    if (!match) return;
    const [, cmd, value] = match;
    let payload;
    if (cmd === "身份") payload = { identity: value };
    else if (cmd === "段位") payload = { 段位: Number(value) };
    else {
      const R = data.rules(runtime.getSnapshot()?.stat_data || {});
      if (!R.ALL_FIELDS.includes(value)) throw Error("字段不在状态台账");
      payload = { ["known." + value]: cmd === "解锁" };
    }
    await runtime.dispatchIntent({ type: "GM_PATCH", payload });
    await mirror();
  });
  unsubs.push(
    runtime.subscribe(event => {
      if(event.type==='player_repair'){settleFaultKey=null;lastReportKey=null;}
      void render().catch(report);
    }),
  );
  let mo = null;
  const Win = doc.defaultView || win;
  if (typeof Win.MutationObserver !== "undefined") {
    mo = new Win.MutationObserver(() => {
      if (!active()) return;
      // Cover a newly inserted settlement reply before the next browser paint.
      effects.update(settleFaultKey===faultKey()?null:runtime.getSnapshot(),host.context());
      clearTimeout(moDebounce);
      moDebounce = setTimeout(() => {
        if (!active()) return;
        const chat = doc.querySelector("#chat");
        const mesList = chat?.querySelectorAll(".mes");
        const c = host.context();
        const lastMes = [...(mesList || [])].reverse().find((row) => {
          const floor = Number(row.getAttribute("mesid") ?? [...mesList].indexOf(row));
          return c.chat[floor] && !c.chat[floor].is_user && !c.chat[floor].is_system;
        });
        if (!lastMes) return;
        if (lastMes.querySelector(".edit_textarea")) return;
        const last = lastMes.querySelector(".mes_text");
        if (last && !last.querySelector("[data-xsd2-root]")) {
          render().catch(report);
        }
      }, 80);
    });
    const chatEl = doc.querySelector("#chat") || doc.body;
    if (chatEl) {
      mo.observe(chatEl, { childList: true, subtree: true });
    }
  }
  const exposed = {
    runtime,
    registerPlugin(plugin) {
      const unregister = runtime.registerPlugin(plugin);
      plugins.push(plugin);
      void render().catch(report);
      return () => {
        unregister();
        const i = plugins.indexOf(plugin);
        if (i >= 0) plugins.splice(i, 1);
        void render().catch(report);
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      doc.querySelectorAll("[data-xsd2-exit-confirm]").forEach(el=>el.cancelExit?.());
      effects.dispose();
      recoveryPanel?.remove();
      doc.querySelector("[data-xsd2-worldbook-warning]")?.remove();
      queuedSend?.notice.remove();queuedSend=null;
      doc.removeEventListener("click",gateSend,true);doc.removeEventListener("keydown",gateSend,true);
      doc.querySelector("[data-xsd2-diagnostic]")?.remove();
      mo?.disconnect();
      clearTimeout(renderTimer);
      clearTimeout(moDebounce);
      unsubs.forEach((f) => f());
      renderEpoch++;
      for (const record of huds.values()) { record.hud.destroy(); record.el.remove(); }
      huds.clear();
      runtime.dispose();
      if (host.top.XSD2 === exposed) delete host.top.XSD2;
    },
  };
  host.top.XSD2 = exposed;
  win.addEventListener("pagehide", exposed.dispose, { once: true });
  win.addEventListener("unload", exposed.dispose, { once: true });
  const youjiguMapPlugin = require("./plugins/youjigu_map/index");
  exposed.registerPlugin(youjiguMapPlugin);
  const {createPromotionPlugin} = require("./plugins/promotion/index");
  exposed.registerPlugin(createPromotionPlugin(data.promotionDefinitions,data.nodeStories));
  exposed.registerPlugin(require("./plugins/xibei/index").createXibeiPlugin(data.nodeStories,data.characterProfiles,data.promotionDefinitions));
  exposed.registerPlugin(require("./plugins/neutral/index").createNeutralPlugin(data.neutralNodes,data.nodeStories));
  for (const plugin of host.top.XSD2_PLUGINS || [])
    exposed.registerPlugin(plugin);
  async function ensureMounted(retries = 5, interval = 120) {
    for (let i = 0; i < retries; i++) {
      if (!active()) break;
      const chat = doc.querySelector("#chat");
      const mesList = chat?.querySelectorAll(".mes");
      if (mesList?.length && doc.querySelector("[data-xsd2-root]")) {
        break;
      }
      await render();
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  if (active()) {
    runtime
      .ready()
      .then(()=>host.isGenerating()?null:runtime.flushCompleted())
      .then(()=>{recoveryPanel?.remove();recoveryPanel=null;})
      .then(mirror)
      .then(render)
      .then(() => ensureMounted())
      .catch(report);
  }
  return exposed;
}
if (typeof window !== "undefined")
  try {
    start(window);
  } catch (e) {
    console.error("[仙姝堕2.0启动]", e);
    window.parent.toastr?.error(e.message);
  }
module.exports = { start, CARD_NAME };
