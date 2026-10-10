/* ═══════════════════════════════════════════════════════════
 * 十二 · 事件接线
 * ═══════════════════════════════════════════════════════════ */

/** 同一条消息可能被两个事件（收到／渲染完）各叫一次，去个重 */
const seenMessages = new Set();      /* 已确认处理成功的键 */
function firstTime(key) {
  if (seenMessages.has(key)) return false;
  seenMessages.add(key);
  if (seenMessages.size > 300) seenMessages.clear();
  return true;
}

/* gpt ④⑦：两段式去重 —— 先占位；业务**成功**才确认；失败立即释放，允许受控重试。
   原来 firstTime 在业务之前就写进集合 ⇒ 第一次失败后，第二次被当成「已处理」直接跳过。 */
const pendingKeys = new Set();
const tickPromises = new Map();   /* gpt ⑦：同楼并发触发共用同一个 Promise */
function claimOnce(key) {
  if (seenMessages.has(key) || pendingKeys.has(key)) return { ok: false, reason: seenMessages.has(key) ? "已处理" : "处理中" };
  pendingKeys.add(key);
  return {
    ok: true,
    commit() { pendingKeys.delete(key); seenMessages.add(key); if (seenMessages.size > 300) seenMessages.clear(); },
    release() { pendingKeys.delete(key); },
  };
}

/** 启动 / 换聊天时的整体判定 */
async function boot(reason) {
  console.log(TAG, `[启动·${reason}] 开始（${VERSION}）—— 先补账本、再按开场白判定身份、最后绑菜单`);
  try {
    await ensureInit(reason);
    await syncIdentityFromFirstMes(reason);
    try { await reconcileNadeLedger(`启动·${reason}`); } catch (e) { /* 对账失败不影响启动 */ }
    ensureMenuBound();
    console.log(TAG, `[启动·${reason}] 完成`);
  } catch (e) {
    /* ⚠️ v1.5：不再静默吞。启动自检是账本的唯一入口之一，
     *   把失败原因打出来才能在真机上定位（v1.4 这里只打一行「已吞掉」，看不出账本没落地）。 */
    console.error(TAG, `❌ [启动·${reason}] 出错（卡仍能用，但账本可能没初始化）：`, msgOf(e));
  }
}

/** 玩家发言：先认命令，是命令就处理掉并藏起来；若非命令但在低楼层（<=3楼）或带大总结特征，智能识别继承 */
async function onUserMessageSent(messageId) {
  try {
    const text = messageText(messageId);
    if (text === null) return;
    const handled = await handleUserCommand(text, messageId);
    if (handled) {
      swallowCommandMessage(messageId);
      return;
    }
    // 非命令分支：智能继承识别（长跑重开自动接盘）
    const inh = detectInheritance(text, messageId);
    if (inh && inh.isInherited) {
      const r = await applyInheritedArchive(text, messageId);
      if (r && r.ok) {
        toast('info', `🎉 已智能识别大总结！成功继承至第 ${r.targetStage} 段，恢复锚点 ${r.anchorCount} 项`, 8000);
      }
    }
  } catch (e) { console.warn(TAG, '[命令] 处理失败：', msgOf(e)); }
}

/** AI 发言：解析状态条写变量（含 <实际发生> 自动记账） ＋ 关键词旁证 ＋ 收尾自检
 *  @param messageId 楼号
 *  @param opt.rawText 外部（渲染触发的 iframe）递进来的**原文**；给了就不再回读 getChatMessages
 *  @param opt.source  调用来源标记（只进 console，便于分辨「渲染触发」与「事件触发」）
 *  ⚠️ 两条来源共用这**同一个**函数 ⇒ v1.1 的「只记最新一楼」闸门对两条来源一视同仁，
 *     不存在「渲染触发绕过闸门」这种后门。 */
async function onAiMessageReceived(messageId, opt) {
  const o = opt || {};
  const srcTag = o.source || '事件';
  try {
    const text = (typeof o.rawText === 'string' && o.rawText) ? o.rawText : messageText(messageId);
    if (text === null || text === undefined || text === '') {
      console.log(TAG, `[消息·${srcTag}] #${messageId} 取不到正文，跳过`);
      return;
    }
    const n = Number(messageId);
    const cid = currentChatId();
    let swipeId = 0;
    try {
      if (API.getChatMessages) {
        const ms = API.getChatMessages(n, { include_swipes: true });
        const m = (Array.isArray(ms) ? ms[0] : ms) || {};
        swipeId = m.swipe_id ?? (m.swipes ? m.swipes.length : 0);
      }
    } catch (e) { /* 忽略 */ }
    const dedupeKey = `recv:${cid}:${n}:${swipeId}:${hashText(text)}`;
    /* gpt ④：两段式去重 + 异步后重查 —— 业务前只占位，成功才确认；失败/中止立即释放，允许受控重试。 */
    const claim = claimOnce(dedupeKey);
    if (!claim.ok) { console.log(TAG, `[消息·${srcTag}] #${n} ${claim.reason}，跳过`); return; }
    let committed = false;
    try {
      if (!(n > 0)) {                                 // 第 0 楼是开场楼，没有状态可记
        console.log(TAG, `[消息·${srcTag}] #${n} 是开场楼，跳过状态解析与收尾自检`);
        claim.commit(); committed = true; return;
      }
      const latest = latestMessageId();
      if (latest !== null && n !== latest) {
        console.log(TAG, `[消息·${srcTag}] #${n} 不是最新一楼（当前 #${latest}），只重绘不记账`);
        claim.commit(); committed = true; return;
      }
      proposeAnchors(text, n);
      checkOutputContract(text, n);
      await applyStatusToVars(text, n, { swipeId });
      /* 重查：await 期间若切了聊天或又来了新楼，本次结果不算数（释放 ⇒ 可重试） */
      const after = latestMessageId();
      if (after !== null && Number(after) !== Number(n)) {
        console.log(TAG, `[消息·${srcTag}] #${n} 处理期间已不是最新一楼（当前 #${after}）⇒ 释放去重键，可重试`);
        claim.release(); return;
      }
      claim.commit(); committed = true;
    } finally {
      if (!committed) claim.release();
    }
  } catch (e) { console.warn(TAG, `[消息·${srcTag}] 处理第 ${messageId} 楼失败：`, msgOf(e)); }
}

/* ═══════════════════════════════════════════════════════════
 * 十二·二 · 渲染触发入口（主路径）—— 照抄外卡《大乾风华录 Ver2.0》
 *   卡内正则把 <Status_block> 换成「面板 HTML ＋ 隐藏原文副本 ＋ 自包含 iframe」，
 *   iframe（独立文档，不被 DOMPurify 清洗）在 load 时读宿主消息、拿到 (mesid, 原文)，
 *   再调本函数 ⇒ 解析／记账／提议全部照跑。
 *   ⚠️ 全程不许抛错：任何一步失败都只是少一份账，不能把渲染链带崩。
 *   ⚠️ 本函数**不写 DOM**（面板重绘交回面板脚本），只做「解析 → 写变量」。
 * ═══════════════════════════════════════════════════════════ */
async function xsdStateTick(mesid, rawText, source) {
  const n = Number(mesid);
  const src = source || '渲染触发';
  if (!Number.isFinite(n) || n < 0) {
    console.log(TAG, `[tick·${src}] 楼号无效（${mesid}），跳过`);
    return { ok: false, why: 'bad mesid' };
  }
  console.log(TAG, `[tick·${src}] #${n} 收到渲染触发${rawText ? `（随带原文 ${String(rawText).length} 字）` : '（无原文，回读消息）'}`);
  /* gpt ⑦：同楼并发触发共用同一个 Promise；内部异常被吞也不能假报成功 */
  const tickKey = "tick:" + n;
  if (tickPromises.has(tickKey)) return tickPromises.get(tickKey);
  const run = (async () => {
  try { await onAiMessageReceived(n, { rawText, source: src }); }
  catch (eTick) {
    console.warn(TAG, "[tick·" + src + "] #" + n + " 处理抛错：" + ((eTick && eTick.message) || eTick));
    return { ok: false, why: String((eTick && eTick.message) || eTick), mesid: n, source: src };
  }
  // 顺带把面板也重绘一次（面板脚本在场时才有；不在场就跳过，互不依赖）
  try {
    const fill = (typeof window !== 'undefined' && typeof window.__xsdFillPanel === 'function')
      ? window.__xsdFillPanel
      : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdFillPanel === 'function')
        ? window.parent.__xsdFillPanel : null);
    if (fill) fill(n, rawText);
  } catch (e) { /* 面板脚本不在场属正常，静默 */ }
  /* gpt ⑦：写入＋回读都确实生效才算成功；**部分写入**要单独识别并按可重试处理。 */
  let rb = null;
  try {
    const gvRb = (typeof getVariables === "function") ? getVariables : null;
    const mvRb = gvRb ? gvRb({ type: "message", message_id: n }) : null;
    rb = mvRb && mvRb.stat_data ? mvRb.stat_data : null;
  } catch (eRb) { rb = null; }
  if (!rb) {
    console.warn(TAG, "[tick] #" + n + " 回读不到 stat_data ⇒ ok:false（可重试）");
    return { ok: false, why: "回读不到 stat_data", mesid: n, source: src };
  }
  const inv = { 楼号: Number(rb.最后处理楼号) === n };
  if (n > 0) { inv["段位"] = Number.isFinite(Number(rb.段位)) && Number(rb.段位) >= 1; inv["日历"] = (typeof rb.仙盟历文 === "string" && rb.仙盟历文.length > 0); }
  const missing = Object.keys(inv).filter((k) => !inv[k]);
  if (missing.length) {
    console.warn(TAG, "[tick] #" + n + " **部分写入**：缺 " + missing.join("、") + " ⇒ ok:false（可重试，不当作成功）");
    return { ok: false, why: "部分写入（缺 " + missing.join("、") + "）", partial: true, mesid: n, source: src };
  }
  return { ok: true, mesid: n, source: src };
  })();
  tickPromises.set(tickKey, run);
  try { run.then(() => setTimeout(() => tickPromises.delete(tickKey), 800)); } catch (eFin) { /* 忽略 */ }
  return run;
}

/* 把入口挂到 window / window.parent / window.top 三处（哪一层都抠得到就认） */
(function registerTickEntry() {
  const targets = [];
  const push = (name, get) => {
    try { const w = get(); if (w && !targets.includes(w)) targets.push(w); } catch (e) { /* 跨源跳过 */ }
  };
  push('self', () => window);
  push('parent', () => window.parent);
  push('top', () => window.top);
  let ok = 0;
  for (const w of targets) {
    try { w.__xsdStateTick = xsdStateTick; w.__xsdStateTickVersion = VERSION; ok++; } catch (e) { /* 跨源跳过 */ }
  }
  console.log(TAG, `[接线] __xsdStateTick 已挂到 ${ok} 个全局（${VERSION}）—— 渲染触发＝主路径`);
})();

if (API.eventOn && EVENTS) {
  const on = (name, fn, why) => {
    const ev = EVENTS[name];
    if (!ev) { console.warn(TAG, `⚠️ tavern_events 里没有 ${name}，这个钩子跳过（${why}）`); return; }
    try { API.eventOn(ev, fn); }
    catch (e) { console.warn(TAG, `⚠️ 监听 ${name} 失败：`, msgOf(e)); }
  };

/* ═══ gpt ⑧：首次生成 B —— 在 MESSAGE_SENT（入楼后、世界书扫描前）把初始化落地并回读；
   失败时**显式取消**生成；找不到取消入口就如实记录（不能只 throw 就假定已取消）。 ═══ */
let preflightDone = false;
async function preflightFirstGeneration(mesid) {
  if (preflightDone) return { ok: true, why: "已初始化" };
  const chatKey0 = (typeof xdsMenuChatKey === "function") ? xdsMenuChatKey() : "";
  const epoch0 = runtime.epoch;
  try {
    await ensureInit("首次生成前置");
    if (runtime.disposed || runtime.epoch !== epoch0 || ((typeof xdsMenuChatKey === "function") && xdsMenuChatKey() !== chatKey0)) {
      console.log(TAG, "[首次生成 B] 初始化期间会话/状态已变 ⇒ 放弃本次前置（不取消生成）");
      return { ok: false, why: "会话已变", cancelled: false };
    }
    try { await syncIdentityFromFirstMes("首次生成前置"); } catch (eId) { console.warn(TAG, "[首次生成 B] 身份同步失败（继续）：" + msgOf(eId)); }
    let rb = null;
    try { const gv = (typeof getVariables === "function") ? getVariables : null; rb = gv ? gv({ type: "chat" }) : null; } catch (eRb) { rb = null; }
    const sd = rb && rb.stat_data ? rb.stat_data : null;
    preflightDone = true;
    console.log(TAG, "[首次生成 B] 前置完成并回读：" + (sd ? ("身份=" + (sd.身份 || "—") + "／known " + (sd.known ? Object.keys(sd.known).length : 0) + " 项") : "回读为空"));
    return { ok: true, readback: !!sd };
  } catch (e) {
    console.warn(TAG, "[首次生成 B] 前置失败：" + msgOf(e) + " ⇒ 显式取消本次生成");
    let cancelled = false;
    const tries = [
      () => ((typeof API !== "undefined") && API && (typeof API.stopGeneration === "function")) ? API.stopGeneration() : null,
      () => { const w = (typeof window !== "undefined") ? window : null; const S = w && (w.SillyTavern || (w.parent && w.parent.SillyTavern)); if (S && typeof S.stopGeneration === "function") { S.stopGeneration(); return true; } return null; },
      () => { const S = (typeof window !== "undefined") && window.top && window.top.SillyTavern; if (S && typeof S.stopGeneration === "function") { S.stopGeneration(); return true; } return null; },
    ];
    for (const t of tries) { try { if (t()) { cancelled = true; break; } } catch (eC) { /* 试下一条 */ } }
    if (!cancelled) console.warn(TAG, "[首次生成 B] 未找到可用的取消入口 ⇒ 如实记录，不假定生成已取消");
    return { ok: false, why: msgOf(e), cancelled };
  }
}
async function preflightThenCommand(id) {
  try { await preflightFirstGeneration(id); } catch (ePf) { console.warn(TAG, "[首次生成 B] 前置异常：" + msgOf(ePf)); }
  return onUserMessageSent(id);
}

  // ⚠️ 主路径 ＝ 渲染触发（见上方 xsdStateTick）。下面这两条**只是冗余加速**：
  //    能拿到就早一拍、少一次回读；拿不到（eventOn 缺失／事件改名）也必须一切正常。
/* gpt ⑧：助手桥接若不交回 Promise，就改挂**宿主原生 eventSource**（它的 emit 可 await），
   并把监听登记进 runtime.cleanups，换聊天/卸载时能摘掉。取不到原生就退回助手桥接。 */
function nativeEventSource() {
  const ctxs = [];
  try { if (typeof getGlobalOrParent === "function") { const S = getGlobalOrParent("SillyTavern"); if (S && typeof S.getContext === "function") ctxs.push(S.getContext()); } } catch (e) { /* 忽略 */ }
  try { const w = (typeof window !== "undefined") ? window : null; if (w && w.SillyTavern && typeof w.SillyTavern.getContext === "function") ctxs.push(w.SillyTavern.getContext()); } catch (e) { /* 忽略 */ }
  try { const w = (typeof window !== "undefined") ? window : null; if (w && w.parent && w.parent.SillyTavern && typeof w.parent.SillyTavern.getContext === "function") ctxs.push(w.parent.SillyTavern.getContext()); } catch (e) { /* 忽略 */ }
  try { const w = (typeof window !== "undefined") ? window : null; if (w && w.top && w.top.SillyTavern && typeof w.top.SillyTavern.getContext === "function") ctxs.push(w.top.SillyTavern.getContext()); } catch (e) { /* 忽略 */ }
  for (const c of ctxs) { try { if (c && c.eventSource && typeof c.eventSource.on === "function") return c.eventSource; } catch (e) { /* 试下一个 */ } }
  return null;
}
function onNative(evName, fn, label) {
  const es = nativeEventSource();
  if (!es) return false;
  try {
    es.on(evName, fn);
    try { runtime.cleanups.push(() => { try { if (typeof es.removeListener === "function") es.removeListener(evName, fn); else if (typeof es.off === "function") es.off(evName, fn); } catch (e) { /* 忽略 */ } }); } catch (e) { /* 入不了清理表不影响功能 */ }
    console.log(TAG, "[接线] " + label + " 改挂**原生 eventSource**（可 await，已登记清理）");
    return true;
  } catch (e) { console.warn(TAG, "[接线] " + label + " 挂原生 eventSource 失败：" + msgOf(e)); return false; }
}

  if (!onNative('MESSAGE_SENT', (id) => preflightThenCommand(id), '首次生成前置＋玩家命令')) {
    on('MESSAGE_SENT', (id) => preflightThenCommand(id), '首次生成前置 ＋ 玩家命令（事件驱动，不可拔）');
  }
  on('MESSAGE_RECEIVED', (id) => onAiMessageReceived(id, { source: '事件·冗余加速' }), '状态条解析的**冗余加速**（主路径是渲染触发）');
  on('CHARACTER_MESSAGE_RENDERED', (id) => onAiMessageReceived(id, { source: '事件·冗余加速' }), '同一楼重渲染的**冗余加速**（已去重；闸门仍生效）');
  on('CHAT_CHANGED', () => { if (window.__xsdCorrection) window.__xsdCorrection.onChatChanged(); setTimeout(() => boot('换聊天'), 400); }, '换聊天时重新判定身份（事件驱动，不可拔）');
  on('CHAT_CREATED', () => setTimeout(() => boot('新聊天'), 400), '新聊天初始化（事件驱动，不可拔）');
  on('MESSAGE_SWIPED', () => setTimeout(() => { ensureInit('滑开场白'); syncIdentityFromFirstMes('滑开场白'); }, 400), '滑开场白时重新判定身份（事件驱动，不可拔）');
  console.log(TAG, `${VERSION} 已接线：命令 / 换聊天 / 开场白（事件）＋ 冗余加速（收到／渲染）；主路径＝渲染触发 ${'__xsdStateTick'}`);
} else {
  console.warn(TAG, '⚠️ eventOn 或 tavern_events 不可用 —— **命令 / 换聊天 / 开场白**这三块会退步（要手打 /已知 才看得到账本）；'
    + '状态记账与面板填充不受影响，它们走渲染触发（__xsdStateTick / __xsdFillPanel）。');
}

/* 身份菜单的点击委托：**无条件**挂（不依赖 eventOn），并重试几次 */
try { ensureMenuBound(); } catch (e) { console.warn(TAG, '[身份] 挂菜单出错：', msgOf(e)); }

