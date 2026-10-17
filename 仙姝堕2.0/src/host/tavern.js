"use strict";
const C = require("../runtime/contracts");
const {matchesAction}=require("../runtime/action_wire");
const Identity=require("../runtime/message_identity");
const {expandOpening}=require("../runtime/opening_macros");
const {confirmExit}=require("../ui/exit_confirmation");
const { createWorldbookHost } = require("./worldbook");
function createTavernHost(win, doc, cardName, embeddedManagedEntries = [], liveHandoff = null, liveCheckpoint = null) {
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
      identities:Identity.identify(c.chat || []),
      chatId: c.chatId || c.getCurrentChatId?.(),
      branchId: c.chatId || c.getCurrentChatId?.(),
      chat: c.chat,
      metadata: c.chatMetadata || {},
      card: c.characters?.[chid] || c.card,
      raw: c,
    };
  }
  const book = createWorldbookHost(helper, ctx, { expectedName: cardName, embeddedManagedEntries });
  const recentErrors=[];
  const report = (e) => {
    recentErrors.unshift({at:new Date().toISOString(),message:String(e.message || e),code:e.code || null});recentErrors.length=Math.min(20,recentErrors.length);
    console.error("[仙姝堕2.0]", e);
    top.toastr?.error(String(e.message || e), "仙姝堕");
  };
  let lastBindingError=null;
  async function syncBook(task){
    try{const result=await task();lastBindingError=null;return result;}
    catch(error){if(error.code!=='XSD2_WORLDBOOK_BINDING')throw error;
      if(lastBindingError!==error.message){lastBindingError=error.message;report(error);}
      return {skipped:true,reason:error.code};
    }
  }
  function guard(c) {
    const n = context();
    if (
      n.chatId !== c.chatId ||
      (c.identities && JSON.stringify(c.identities)!==JSON.stringify(n.identities.slice(0,c.identities.length))) ||
      !(JSON.stringify(C.fingerprint(n.chat)) === JSON.stringify(c.trail) || (c.allowUserAppend && C.matches(c.trail,C.fingerprint(n.chat)) && n.chat.slice(c.trail.length).every(m=>m.is_user&&!m.is_system)))
    )
      throw Error("聊天已变化，取消写入");
  }
  const saveGate=top.__XSD2_SAVE_GATE__ ||= {count:0,waiters:new Set()};
  async function withSaving(fn){
    saveGate.count++;
    try{return await fn();}finally{saveGate.count--;if(!saveGate.count){for(const done of saveGate.waiters)done();saveGate.waiters.clear();}}
  }
  const whenSaved=()=>saveGate.count?new Promise(resolve=>saveGate.waiters.add(resolve)):Promise.resolve();
  // All instances share the writer: a remounted script must not race its predecessor.
  const chatWrites = top.__XSD2_CHAT_WRITES__ ||= {tail:Promise.resolve()};
  function mutateChatVariables(c, update, skipStale=false) {
    const task=chatWrites.tail.catch(()=>{}).then(async()=>{
      if(skipStale && (context().chatId!==c.chatId || !C.matches(c.trail,C.fingerprint(context().chat))))return null;
      guard(c);
      const old=await helper.getVariables({type:"chat"});
      if(skipStale && (context().chatId!==c.chatId || !C.matches(c.trail,C.fingerprint(context().chat))))return null;
      guard(c);
      const next=update(old || {});
      await helper.replaceVariables(next,{type:"chat"});guard(c);
      return next;
    });
    chatWrites.tail=task;
    return task;
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

  function messageArchives(message) {
    const records={};
    for(const archive of [...(message?.swipe_info || []).map(x=>x?.extra?.xsd2_snapshots || {}),message?.extra?.xsd2_snapshots || {}])
      for(const[key,value]of Object.entries(archive))if(!records[key] || value.checkpoint?.state?.revision>records[key].checkpoint?.state?.revision)records[key]=value;
    return records;
  }
  function resolveCheckpoint(record,c=context()) {
    if(record?.storage!==2)return record;
    const message=c.chat.find(m=>m.extra?.xsd2_identity?.messageId===record.messageId);
    const checkpoint=messageArchives(message)[record.revisionId]?.checkpoint;
    return checkpoint ? C.clone(checkpoint) : null;
  }
  const adapter = {
    retryGeneration(){
      preflightSend();const c=ctx(),generate=c.generate || st.generate;
      if(typeof generate==="function"){Promise.resolve(generate.call(c,"normal")).catch(report);return;}
      if(typeof helper.triggerSlash==="function"){Promise.resolve(helper.triggerSlash("/trigger")).catch(report);return;}
      throw Error("宿主未提供重新生成接口，请使用酒馆原生重新生成按钮继续本次结算。");
    },
    withSaving,whenSaved,isSaving:()=>saveGate.count>0,
    getUserName(){return String(ctx().name1 || top.name1 || "无名修士").trim();},
    getPlayerAvatar(){const image=top.document.querySelector("#user_avatar_block img, #chat .mes[is_user=\"true\"] .avatar img");return image?.src || "";},
    context,
    getDiagnostics() {
      const c = context();
      return {
        saving:saveGate.count>0,pendingSaves:saveGate.count,recentErrors:C.clone(recentErrors),
        worldbook:book.getDiagnostics?.() || null,
        cardVersion:c.card?.data?.character_version || c.card?.character_version || null,
        generating:isGenerating(), lifecycleGenerating:generating, aborted,
        stopVisible:visible(top.document.querySelector("#mes_stop")),
      };
    },
    report,
    isGenerating,
    isAborted: () => aborted,
    async readCheckpoint() {
      const c=context(),vars=await helper.getVariables({type:"chat"});
      const saved=resolveCheckpoint(vars?.xsd2_checkpoint,c);
      if(saved?.identityTrail || (saved?.chatId===c.chatId && C.matchesSnapshot(saved.trail,C.fingerprint(c.chat))))return saved;
      // Only migrate a live trusted kernel's pending, bound to this chat and
      // the adjacent exact user action; never reconstruct from model prose.
      const p=liveHandoff?.pending;
      if(liveHandoff?.chatId===c.chatId && liveHandoff.branchId===c.branchId && p?.actionCode && c.chat[p.floor+1]?.is_user && matchesAction(p,c.chat[p.floor+1].mes) && !c.chat.slice(p.floor+2).some(x=>x.is_user)){
        const trail=C.fingerprint(c.chat).slice(0,p.floor+1),state=C.clone(liveHandoff);
        state.pending.authorization={chatId:c.chatId,branchId:c.branchId,trail:C.clone(trail)};
        return {schema:2,chatId:c.chatId,branchId:c.branchId,trail,state};
      }
      if(saved?.chatId===c.chatId)return saved;
      if(vars?.xsd2_checkpoint?.storage===2 && !saved)return {schema:2,chatId:c.chatId,trail:null};
      // Older cards mirrored these fields without a complete checkpoint.
      // Evidence of an existing save blocks silent zero initialization.
      if(vars?.stat_data?.character_stages && vars.stat_data.character_metrics)
        return {schema:2,chatId:c.chatId,trail:null};
      return null;
    },
    async readCheckpoints() {
      const current=await adapter.readCheckpoint();
      const vars=await helper.getVariables({type:"chat"});
      return [current,...(Array.isArray(vars?.xsd2_history)?vars.xsd2_history:[]).map(x=>resolveCheckpoint(x,context())),...(liveCheckpoint?.chatId===context().chatId && liveCheckpoint.branchId===context().branchId?[C.clone(liveCheckpoint)]:[])].filter(Boolean);
    },
    async readMessage(i) {
      const c=context(),vars=await helper.getVariables({type:"message",message_id:i});
      const m=c.chat[i],slot=Number(m?.swipe_id ?? 0),id=c.identities[i];
      const records=Object.values(messageArchives(m)).filter(x=>x.slot===slot && x.checkpoint?.identityTrail?.at(-1)?.messageId===id?.messageId);
      const record=records.find(x=>x.checkpoint?.identityTrail?.at(-1)?.revisionId===id?.revisionId) || records.sort((a,b)=>b.checkpoint.state.revision-a.checkpoint.state.revision)[0];
      return record ? {...vars,stat_data:{...vars?.stat_data,xsd2:[C.clone(record.checkpoint)]}} : vars;
    },
    async persist(c, e) {return withSaving(async()=>{
      guard(c);
      const checkpoint=C.clone(e);delete checkpoint.previous;
      // Also compact legacy authorizations nested in pending/before states.
      function compact(value){if(!value || typeof value!=="object")return;for(const[k,v]of Object.entries(value)){
        if(k==="trail" && Array.isArray(v))value[k]=C.compactTrail(v);else compact(v);
      }}
      compact(checkpoint);
      const message=c.chat[c.floor],id=c.identities?.[c.floor] || Identity.identify(c.chat)[c.floor];
      const key=id.revisionId,ref={storage:2,messageId:id.messageId,revisionId:key,revision:e.state.revision};
      const retained=Object.fromEntries(Object.entries(messageArchives(message)).filter(([,v])=>v.checkpoint?.identityTrail?.at(-1)?.messageId===id.messageId));
      message.extra={...message.extra,xsd2_snapshots:{...retained,[key]:{slot:Number(message.swipe_id ?? 0),checkpoint}}};
      const info=message.swipe_info?.[Number(message.swipe_id ?? 0)];
      if(info)info.extra={...info.extra,xsd2_snapshots:Object.fromEntries(Object.entries(message.extra.xsd2_snapshots).filter(([,v])=>v.slot===Number(message.swipe_id ?? 0)))};
      const old=await helper.getVariables({type:"message",message_id:c.floor});guard(c);
      const projection={...old,stat_data:{...old?.stat_data},xsd2_ref:ref};
      // Current values are projected once at chat scope by syncState().
      // Keep foreign message fields, not another copy of this card's state.
      for(const key of Object.keys(e.state.stat_data))delete projection.stat_data[key];
      delete projection.stat_data.xsd2;
      // These are our inherited chat backup copies, not another extension's data.
      delete projection.xsd2_checkpoint;delete projection.xsd2_history;
      await helper.replaceVariables(projection,{type:"message",message_id:c.floor});guard(c);
      await save();guard(c);
      const back=resolveCheckpoint(ref,context());
      if(back?.state?.revision!==e.state.revision)throw Error("本楼状态保存复核失败");
      await mutateChatVariables(c,vars=>{
        const journal=(Array.isArray(vars?.xsd2_history)?vars.xsd2_history:[]).filter(x=>
          !(x.storage===2 && x.messageId===ref.messageId && x.revisionId===ref.revisionId));
        journal.push(ref);
        return {...vars,xsd2_checkpoint:ref,xsd2_history:journal.slice(-3)};
      });
      await save();guard(c);
    });},
    async syncState(state) {return withSaving(async()=>{
      const c=context();c.trail=C.fingerprint(c.chat);
      const written=await mutateChatVariables(c,old=>({
        ...old,stat_data:C.clone(state?.stat_data || {})
      }),true);
      if(!written)return;
      // Replay may intentionally mirror an older revision before regeneration.
      await syncBook(()=>book.synchronizeState(state?.stat_data || {},()=>context().chatId===c.chatId));
    });},
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
    confirmExit: (n) => confirmExit(top.document,n),
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
      if (n.chat?.[i]) {n.chat[i].mes=text;const slot=Number(n.chat[i].swipe_id??0);if(Array.isArray(n.chat[i].swipes))n.chat[i].swipes[slot]=text;}
      if (
        n.chatId !== c.chatId ||
        !C.matches(trail.slice(0, i), C.fingerprint(n.chat))
      )
        throw Error("正文写入期间聊天变化");
      await save();
    },
    async replaceOpening(text) {
      const c=ctx();text=expandOpening(text,c.name1,c.name2);
      await adapter.replaceStory(0, text, "affected");
    },
    async syncIdentity(identity) {
      const id = context().chatId;
      return syncBook(()=>book.synchronize(identity, () => context().chatId === id));
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
