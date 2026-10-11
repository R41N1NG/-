/** 身份：gpt。总调度实例：依赖接线、前置、事件生命周期和状态事务。 */
function createXsdDispatcher(deps) {
  const { window, API, EVENTS, console, TAG, VERSION, ALL_FIELDS,
    contextKey, latestMessageId, messageText, hashText, createTransactions, runStatus,
    ensureInit, syncIdentityFromFirstMes, reconcileNadeLedger, ensureMenuBound,
    handleUserCommand, swallowCommandMessage, detectInheritance, applyInheritedArchive,
    proposeAnchors, checkOutputContract, readLayer, readStatData, writeStat, L_CHAT, service,
    setTimeout, clearTimeout, requestCancel, toast } = deps;
  const timers = new Set(), cleanups = [];
  let started = false, preflightDone = '', preflightPending = null;
  const messageSignature = id => {
    try {
      if (!API.getChatMessages) return null;
      const raw = API.getChatMessages(id, { include_swipes: true });
      const message = Array.isArray(raw) ? raw[0] : raw;
      if (!message) return null;
      const text = message.message ?? message.mes;
      return JSON.stringify([message.swipe_id ?? 0, text === undefined ? null : hashText(String(text))]);
    } catch (_) { return null; }
  };
  const transactions = createTransactions({ contextKey, latestMessageId, messageSignature });
  const delayed = (fn, delay) => {
    const handle = setTimeout(() => { timers.delete(handle); if (!transactions.disposed) Promise.resolve().then(fn).catch(error => console.warn(TAG, '[延迟调度]', error.message)); }, delay);
    timers.add(handle); return handle;
  };
  async function boot(reason) {
    const key = String(contextKey()), epoch = transactions.epoch;
    const guard = () => { if (transactions.disposed || epoch !== transactions.epoch || key !== String(contextKey())) throw Error('启动期间聊天已变化'); };
    try {
      guard(); await ensureInit(reason); guard();
      await syncIdentityFromFirstMes(reason); guard();
      await reconcileNadeLedger('启动·' + reason); guard();
      ensureMenuBound();
      // ── 检测删楼回退并同步修剪全局台账 ──
      const chatLayer = readLayer(L_CHAT);
      const msgLayer = readLayer({ type: 'message', message_id: -1 });
      const cs = chatLayer && chatLayer.stat_data;
      const ms = msgLayer && msgLayer.stat_data;
      if (cs && ms && Number.isFinite(Number(ms.最后处理楼号)) && Number.isFinite(Number(cs.最后处理楼号)) && Number(ms.最后处理楼号) < Number(cs.最后处理楼号)) {
        console.log(TAG, `[台账回剪] 检测到当前楼号(${ms.最后处理楼号})小于全局记录(${cs.最后处理楼号})，正在执行删楼回退修剪`);
        const rewoundStat = readStatData();
        if (rewoundStat) {
          await writeStat(rewoundStat, `删楼回退·同步全局台账至第${ms.最后处理楼号}楼`, false, guard);
        }
      }
      return { ok: true };
    } catch (error) { console.warn(TAG, '[启动·' + reason + ']', error.message); return { ok: false, why: error.message }; }
  }
  async function onUserMessageSent(id) {
    const token = transactions.capture(id, 'user');
    try {
      transactions.guard(token);
      const text = messageText(id);
      if (text === null) return { ok: false, why: '读不到玩家消息' };
      const handled = await handleUserCommand(text, id);
      transactions.guard(token);
      if (handled) { swallowCommandMessage(id); return { ok: true, command: true }; }
      const inherited = detectInheritance(text, id);
      if (inherited && inherited.isInherited) {
        const result = await applyInheritedArchive(text, id);
        transactions.guard(token); return result;
      }
      return { ok: true, command: false };
    } catch (error) { console.warn(TAG, '[玩家调度]', error.message); return { ok: false, why: error.message }; }
  }
  function onAiMessageReceived(id, options = {}) {
    const n = Number(id), source = options.source || '事件';
    if (!Number.isInteger(n) || n < 0) return Promise.resolve({ ok: false, why: 'bad mesid' });
    if (n === 0) return Promise.resolve({ ok: true, skipped: 'opening', mesid: n });
    const latest = latestMessageId();
    if (latest !== null && Number(latest) !== n) return Promise.resolve({ ok: true, skipped: 'not-latest', mesid: n });
    const text = typeof options.rawText === 'string' && options.rawText ? options.rawText : messageText(n);
    if (!text) return Promise.resolve({ ok: false, why: '读不到正文', retryable: true, mesid: n });
    const token = transactions.capture(n, hashText(text));
    if (typeof options.rawText === 'string' && token.signature) {
      const authoritativeHash = JSON.parse(token.signature)[1];
      if (authoritativeHash !== null && authoritativeHash !== hashText(text)) return Promise.resolve({ ok: false, why: '面板正文已过期，请按当前分支重试', stale: true, retryable: true, mesid: n });
    }
    const key = JSON.stringify([token.chatKey, n, token.signature, token.fingerprint, token.epoch]);
    return transactions.run(token, key, async guard => {
      guard(); proposeAnchors(text, n); checkOutputContract(text, n);
      const result = await runStatus(text, n, { swipeId: (() => {
        try { return token.signature ? JSON.parse(token.signature)[0] : 0; } catch (_) { return 0; }
      })() }, guard);
      guard();
      if (result && result.ok) {
        try { const fill = window.__xsdFillPanel || window.parent && window.parent.__xsdFillPanel; if (typeof fill === 'function') fill(n, text); } catch (_) {}
        try { const refresh = window.__xsdRefreshRelics || window.parent && window.parent.__xsdRefreshRelics; if (typeof refresh === 'function') refresh(); } catch (_) {}
      }
      return { ...result, mesid: n, source };
    });
  }
  function xsdStateTick(id, rawText, source) { return onAiMessageReceived(id, { rawText, source: source || '渲染触发' }); }
  function schema(layer) {
    const state = layer && layer.stat_data;
    return state && typeof state.身份 === 'string' && state.身份 && typeof state.阵营 === 'string' && state.阵营 && state.known
      && ALL_FIELDS.every(field => typeof state.known[field] === 'boolean');
  }
  function preflightFirstGeneration(id) {
    const token = transactions.capture(id, 'preflight'), key = JSON.stringify([token.chatKey, token.epoch]);
    if (preflightDone === key) return Promise.resolve({ ok: true, why: '已初始化' });
    if (preflightPending && preflightPending.key === key) return preflightPending.promise;
    const promise = (async () => {
      try {
        transactions.guard(token);
        await ensureInit('首次生成前置'); transactions.guard(token);
        await syncIdentityFromFirstMes('首次生成前置'); transactions.guard(token);
        let chat = await readLayer(L_CHAT); transactions.guard(token);
        const targetMesId = (function() {
          const n = Number(id);
          try {
            const msgs = typeof API.getChatMessages === 'function' ? API.getChatMessages(n) : null;
            if (msgs && msgs[0] && msgs[0].is_user) return 0;
          } catch (_) {}
          return n;
        })();
        let message = await readLayer({ type: 'message', message_id: targetMesId }); transactions.guard(token);
        if (!schema(chat) || !schema(message)) {
          // 仅缺结构的一层可以从已完整的层恢复；若两层均缺，从当前台账或默认全量字段安全自愈建立基线。
          const valid = schema(chat) ? chat.stat_data : schema(message) ? message.stat_data : null;
          let recoveryKnown;
          if (valid) {
            recoveryKnown = service.clone(valid.known);
          } else {
            const baseK = (chat && chat.stat_data && chat.stat_data.known) || (message && message.stat_data && message.stat_data.known) || (typeof readKnown === 'function' ? readKnown() : {}) || {};
            recoveryKnown = {};
            for (const f of ALL_FIELDS) recoveryKnown[f] = baseK[f] === true;
          }
          const recoveryId = valid?.身份 || chat?.stat_data?.身份 || message?.stat_data?.身份 || (typeof readIdentity === 'function' ? readIdentity() : null) || '赵无忧';
          const recoveryFaction = valid?.阵营 || chat?.stat_data?.阵营 || message?.stat_data?.阵营 || (typeof readFaction === 'function' ? readFaction() : null) || '墨山道';
          transactions.guard(token);
          const repaired = await writeStat({ ...readStatData(), 身份: recoveryId, 阵营: recoveryFaction, known: recoveryKnown },
            '首次生成单层结构恢复', false, () => transactions.guard(token));
          transactions.guard(token);
          if (!repaired || !repaired.ok) throw Error('首次生成单层恢复提交失败');
          chat = await readLayer(L_CHAT); transactions.guard(token);
          message = await readLayer({ type: 'message', message_id: targetMesId }); transactions.guard(token);
        }
        if (!schema(chat) || !schema(message) || !service.eq(chat.stat_data.known, message.stat_data.known)
          || chat.stat_data.身份 !== message.stat_data.身份 || chat.stat_data.阵营 !== message.stat_data.阵营) throw Error('首次生成初始化双层读回不完整或不一致');
        preflightDone = key;
        return { ok: true, readback: true };
      } catch (error) {
        if (!transactions.current(token)) return { ok: false, why: error.message, stale: true, cancelled: false };
        let cancel = { requested: false, confirmed: false };
        try { cancel = await requestCancel(); } catch (_) {}
        console.warn(TAG, '[首次生成前置] ' + error.message + (cancel.requested ? '；已请求停止生成' : '；没有可用取消接口，未确认停止生成'));
        try { toast('warning', '初始化未通过，请修复后重试：' + error.message, 12000); } catch (_) {}
        return { ok: false, why: error.message, cancelRequested: cancel.requested, cancelled: cancel.confirmed, retryable: true };
      }
    })().finally(() => { if (preflightPending && preflightPending.promise === promise) preflightPending = null; });
    preflightPending = { key, promise }; return promise;
  }
  async function preflightThenCommand(id) {
    const result = await preflightFirstGeneration(id);
    if (!result.ok) return result;
    return onUserMessageSent(id);
  }
  function onChatChanged() {
    transactions.reset(); preflightDone = ''; preflightPending = null;
    try { if (service) service.onChatChanged(); } catch (_) {}
    delayed(() => boot('换聊天'), 400);
  }
  function nativeEventSource() {
    for (const root of [window, (() => { try { return window.parent; } catch (_) { return null; } })(), (() => { try { return window.top; } catch (_) { return null; } })()]) {
      try { const ctx = root && root.SillyTavern && root.SillyTavern.getContext(); if (ctx && ctx.eventSource && typeof ctx.eventSource.on === 'function') return ctx.eventSource; } catch (_) {}
    }
    return null;
  }
  function listen(name, handler, native = false) {
    const event = EVENTS && EVENTS[name]; if (!event) return false;
    if (native) {
      const source = nativeEventSource();
      if (source) try {
        source.on(event, handler);
        cleanups.push(() => { if (typeof source.removeListener === 'function') source.removeListener(event, handler); else if (typeof source.off === 'function') source.off(event, handler); });
        return true;
      } catch (_) {}
    }
    if (!API.eventOn) return false;
    try {
      const handle = API.eventOn(event, handler);
      if (typeof handle === 'function') cleanups.push(handle);
      else if (handle && typeof handle.stop === 'function') cleanups.push(() => handle.stop());
      else if (API.eventRemoveListener) cleanups.push(() => API.eventRemoveListener(event, handler));
      return true;
    } catch (error) { console.warn(TAG, '[事件接线] ' + name, error.message); return false; }
  }
  function start() {
    if (started || transactions.disposed) return false;
    started = true;
    for (const root of [window, (() => { try { return window.parent; } catch (_) { return null; } })(), (() => { try { return window.top; } catch (_) { return null; } })()]) {
      try {
        if (!root) continue;
        const previous = root.__xsdDispatcher;
        if (previous && previous !== controller && typeof previous.dispose === 'function') previous.dispose();
        root.__xsdDispatcher = controller; root.__xsdStateTick = xsdStateTick; root.__xsdStateTickVersion = VERSION;
        cleanups.push(() => { if (root.__xsdDispatcher === controller) { delete root.__xsdDispatcher; if (root.__xsdStateTick === xsdStateTick) delete root.__xsdStateTick; } });
      } catch (_) {}
    }
    listen('MESSAGE_SENT', preflightThenCommand, true);
    listen('MESSAGE_RECEIVED', id => onAiMessageReceived(id));
    listen('CHARACTER_MESSAGE_RENDERED', id => onAiMessageReceived(id, { source: '事件·重渲染' }));
    listen('CHAT_CHANGED', onChatChanged);
    listen('CHAT_CREATED', onChatChanged);
    listen('MESSAGE_SWIPED', () => delayed(() => boot('滑开场白'), 400));
    try { ensureMenuBound(); } catch (_) {}
    try { window.addEventListener('pagehide', dispose); cleanups.push(() => window.removeEventListener('pagehide', dispose)); } catch (_) {}
    return true;
  }
  function dispose() {
    if (transactions.disposed) return;
    transactions.dispose(); preflightDone = ''; preflightPending = null;
    for (const timer of timers) clearTimeout(timer); timers.clear();
    for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch (_) {} }
  }
  const controller = Object.freeze({ start, dispose, boot, onUserMessageSent, onAiMessageReceived, xsdStateTick,
    preflightFirstGeneration, preflightThenCommand, onChatChanged, nativeEventSource, transactions,
    scheduleStart: check => delayed(() => { check(); return boot('启动'); }, 1500) });
  return controller;
}
