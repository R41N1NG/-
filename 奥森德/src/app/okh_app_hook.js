/**
 * @module okh_app_hook
 * @updated 2026-11-11 21:56
 * @status active
 * @reason 修复流式回复结束时 GENERATION_ENDED 早于 MESSAGE_RECEIVED 触发导致的待发事件误回滚竞态
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG, W = root.OKH_APP_WORLD;
  const A = root.OKH_APP_ADAPTER, P = root.OKH_APP_PARSE, GPT = root.OKHBackground;
  if (!u || !CFG || !W || !A || !P || !GPT) throw Error('hook 依赖缺失');
  const RHYTHM = { everyMessages: 3, minutesPerTick: 60, useAITime: true };
  let options = {}, work = Promise.resolve(), activeGeneration = null, seq = 0, last = null;
  const controllers = new Map(), listeners = [];
  function configure(next = {}) { options = { ...options, ...next }; controllers.clear(); }
  function serial(fn) { const result = work.then(fn); work = result.catch(() => {}); return result; }
  function controller(s) {
    W.assertSession(s);
    if (!controllers.has(s.id)) controllers.set(s.id, A.createController(s));
    return controllers.get(s.id);
  }
  function fingerprint(text) {
    // 处理完整文本，不再只取前32字；这是内容标识，不是密码散列。
    let a = 2166136261, b = 2246822519;
    for (let i = 0; i < text.length; i++) {
      const n = text.charCodeAt(i);
      a = Math.imul(a ^ n, 16777619);
      b = Math.imul(b ^ n, 3266489917);
    }
    return 'h2-' + (a >>> 0).toString(16) + '-' + (b >>> 0).toString(16) + '-' + text.length;
  }
  function replyId(s, index) { return 'reply:' + s.id + ':' + index; }
  function revisionFor(chat, index) {
    const item = chat[index];
    return fingerprint(JSON.stringify([item?.swipe_id ?? 0, item?.mes || '',
      chat.slice(0, index).map(m => [Boolean(m.is_user), Boolean(m.is_system), m.mes || '', m.swipe_id ?? 0])]));
  }
  function assistant(item) { return item && !item.is_user && !item.is_system; }
  function newestIndex(chat) {
    for (let i = chat.length - 1; i >= 0; i--) if (assistant(chat[i])) return i;
    return -1;
  }
  async function inject(text, s) {
    if (text) W.assertSession(s);
    if (options.inject) {
      const result = await options.inject(text, { chatId: s.id });
      u.check(result !== false, '提示词注入接口报告失败，事件未确认');
      return result;
    }
    const ctx = W.context();
    u.check(typeof ctx?.setExtensionPrompt === 'function',
      '没有提示词注入接口；请 configure({inject})，不能只保存 pendingText 冒充已交付');
    // SillyTavern 扩展提示位置 IN_CHAT=1、SYSTEM=0；可用 configure 显式覆盖。
    const position = options.promptPosition ?? ctx.extension_prompt_types?.IN_CHAT ?? 1;
    const role = options.promptRole ?? ctx.extension_prompt_roles?.SYSTEM ?? 0;
    const result = await ctx.setExtensionPrompt('okh_pending_' + encodeURIComponent(s.id), text, position,
      options.promptDepth ?? 0, false, role);
    u.check(result !== false, '扩展提示词注入失败');
    return result;
  }
  async function publish(s) {
    const world = W.loadWorld(s), batch = GPT.prepare(world, 8);
    const values = {
      'okh_gpt.pendingText': batch.text,
      'okh_gpt.pendingIds': JSON.stringify(batch.ids),
      'okh_gpt.ledger': A.buildLedger(world),
      'okh_gpt.watch': JSON.stringify(A.buildWatch(world)),
      'okh_gpt.derivedRevision': String(world.bg.revision)
    };
    try { await W.publishDerived(s, values, world.bg.revision); return true; }
    catch (error) { console.warn('[APP] 权威状态已保存，派生缓存发布失败：', error.message); return false; }
  }
  function clockPlan(world, parsed, explicitMinutes, countMessage, initial) {
    u.check(Number.isSafeInteger(RHYTHM.everyMessages) && RHYTHM.everyMessages > 0 &&
      Number.isSafeInteger(RHYTHM.minutesPerTick) && RHYTHM.minutesPerTick > 0, '时间保底参数非法');
    const old = world.bg.clockState || { count: 0, creditedMin: 0 };
    let count = old.count, creditedMin = old.creditedMin;
    let elapsed = explicitMinutes ?? (RHYTHM.useAITime ? parsed.elapsed : null) ?? 0;
    u.check(u.minute(elapsed), '推进分钟必须为非负整数');
    if (initial) elapsed = 0;
    if (countMessage && !initial) {
      count++; creditedMin += elapsed;
      if (count >= RHYTHM.everyMessages) {
        elapsed += Math.max(0, RHYTHM.minutesPerTick - creditedMin);
        count = 0; creditedMin = 0;
      }
    }
    return { toMin: world.timeMin + elapsed, clockState: { count, creditedMin } };
  }
  async function restoreRecord(s, id) {
    const envelope = W.readEnvelope(s), record = envelope.history.find(h => h.id === id);
    u.check(record, '缺少该回复之前的检查点，不能安全重生成：' + id);
    await controller(s).restore(record.before);
    return record;
  }
  function buildTurnCommand(minutes, opts, world, id, revision) {
    const text = opts.text || '';
    try {
      const parsed = P.parseStatusBar(text);
      const plan = clockPlan(world, parsed, minutes, opts.countMessage === true, opts.initial === true);
      const front = P.buildFront(text, plan.toMin, world,
        { token: id, config: CFG.buildConfig(), locations: CFG.LOCATIONS, canMove: CFG.canMove });
      const diagnostics = [...parsed.diagnostics, ...front.diagnostics];
      if (opts.frontOverride) {
        if (!u.own(opts.frontOverride, 'interactingIds')) front.interactingIds = world.interactingIds || [];
        Object.assign(front, u.clone(opts.frontOverride));
      }
      const timeCheck = P.compareEnd(parsed, plan.toMin);
      if (timeCheck.ok === false) diagnostics.push('end 与时间真值偏差 ' + timeCheck.deviationMin + ' 分钟；未覆盖真值');
      front.clockState = plan.clockState;
      front.timeCheck = timeCheck;
      const during = new Set([...(world.interactingIds || []), ...P.parseInteract(text).filter(n => u.own(world.npcs, n))]);
      return {
        command: { id, revision, toMin: plan.toMin, interactingIds: [...during], front, chatIndex: opts.chatIndex ?? null },
        diagnostics,
        timeCheck
      };
    } catch (error) {
      if (!opts.allowFallback) throw error;
      const parsed = {
        elapsed: null, end: null, endMin: null, hasStatus: false,
        diagnostics: ['状态栏解析失败，已按空回执与保底计时降级结算（请重生成或修正本楼状态栏）：' + error.message]
      };
      const plan = clockPlan(world, parsed, minutes, opts.countMessage === true, opts.initial === true);
      const timeCheck = P.compareEnd(parsed, plan.toMin);
      const front = { interactingIds: [], clockState: plan.clockState, timeCheck };
      return {
        command: { id, revision, toMin: plan.toMin, interactingIds: [...(world.interactingIds || [])], front, chatIndex: opts.chatIndex ?? null },
        diagnostics: parsed.diagnostics,
        timeCheck
      };
    }
  }
  async function runStep(minutes, opts = {}) {
    const s = opts.session || W.session();
    await W.ensureWorld(false, s);
    let world = W.loadWorld(s);
    const id = opts.msgId || 'manual:' + s.id + ':' + Date.now() + ':' + (++seq);
    const revision = opts.revision || fingerprint(JSON.stringify([opts.text || '', minutes ?? null, opts.frontOverride ?? null]));
    const recorded = world.bg.receipts[id];
    if (recorded !== undefined) {
      const old = JSON.parse(recorded);
      if (old.revision === revision) return { advanced: false, duplicate: true, reason: '重复提交' };
      await restoreRecord(s, id);
      world = W.loadWorld(s);
    }
    const { command, diagnostics, timeCheck } = buildTurnCommand(minutes, opts, world, id, revision);
    const generationId = opts.generationId ?? null;
    const result = await controller(s).finishReply(command, generationId);
    const published = await publish(s);
    last = { advanced: true, from: world.timeMin, to: result.state.timeMin, front: command.front,
      actions: result.report.actions, released: result.report.released,
      pending: GPT.prepare(result.state, 8).ids.length, diagnostics, timeCheck, published };
    diagnostics.forEach(message => console.warn('[APP] ' + message));
    console.log('[APP] 已提交 ' + world.timeMin + ' → ' + result.state.timeMin);
    return last;
  }
  async function reconcile(s, chat, replaceIndex) {
    const history = W.readEnvelope(s).history;
    const changed = history.find(record => Number.isSafeInteger(record.chatIndex) &&
      (!assistant(chat[record.chatIndex]) || revisionFor(chat, record.chatIndex) !== record.revision ||
       record.chatIndex === replaceIndex));
    if (!changed) return null;
    await controller(s).restore(changed.before);
    await publish(s);
    return changed.chatIndex;
  }
  async function replay(s, chat, from, through) {
    for (let i = from; i <= through; i++) {
      if (!assistant(chat[i])) continue;
      await runStep(undefined, { session: s, msgId: replyId(s, i), revision: revisionFor(chat, i),
        text: chat[i].mes || '', chatIndex: i, countMessage: true, initial: i === 0, allowFallback: true });
    }
  }
  function step(minutes, opts = {}) { return serial(() => runStep(minutes, opts)); }
  const REPLACE_TYPES = new Set(['regenerate', 'swipe', 'continue', 'append', 'appendFinal']);
  const SKIP_TYPES = new Set(['quiet', 'impersonate']);
  function matchesTarget(generation, s, chat, target) {
    if (!generation || generation.session.id !== s.id) return false;
    if (generation.fixed) return generation.targetIndex === target;
    return target >= generation.targetIndex &&
      target <= generation.maxTargetIndex &&
      target === newestIndex(chat) &&
      !chat.slice(generation.targetIndex, target).some(assistant);
  }
  async function rollbackPrepared(generation) {
    if (!generation?.prepared) return;
    const now = W.loadWorld(generation.session);
    if (!now || now.bg?.generations?.[generation.id]?.status !== 'prepared') return;
    if (now.bg.revision === generation.preparedRev && generation.snapshot) {
      await W.commit(generation.session, {
        expectedRevision: now.bg.revision,
        state: generation.snapshot,
        checkpoint: null,
        reason: 'cancel-generation'
      });
    } else {
      const next = u.clone(now);
      delete next.bg.generations[generation.id];
      next.bg.revision = now.bg.revision + 1;
      await W.commit(generation.session, {
        expectedRevision: now.bg.revision,
        state: next,
        checkpoint: null,
        reason: 'cancel-generation-prune'
      });
    }
    await publish(generation.session);
  }
  async function clearGeneration(generation) {
    if (!generation) return;
    try {
      await inject('', generation.session);
    } finally {
      await rollbackPrepared(generation);
    }
  }
  async function preparePromptBatch(s, id) {
    const beforeWorld = W.loadWorld(s);
    const preview = GPT.prepare(beforeWorld, 8);
    if (!preview.ids.length) return { batch: { ...preview, text: '' }, prepared: false, preparedRev: null, snapshot: null };
    const snapshot = u.clone(beforeWorld);
    const batch = await controller(s).prepareGeneration(id, 8);
    return { batch, prepared: true, preparedRev: W.loadWorld(s)?.bg.revision ?? null, snapshot };
  }
  function resolveTargetWindow(chat, replaceIndex) {
    if (replaceIndex !== undefined) return { targetIndex: replaceIndex, maxTargetIndex: replaceIndex, fixed: true };
    const lastIndex = newestIndex(chat);
    if (lastIndex === chat.length - 1 && !chat[lastIndex]?.mes) {
      return { targetIndex: lastIndex, maxTargetIndex: lastIndex, fixed: true };
    }
    return { targetIndex: chat.length, maxTargetIndex: chat.length + 1, fixed: false };
  }
  function beforeGeneration(opts = {}) {
    if (opts.dryRun || SKIP_TYPES.has(opts.type)) return Promise.resolve(null);
    return serial(async () => {
      const s = W.session();
      await W.ensureWorld(false, s);
      if (activeGeneration) {
        const prev = activeGeneration;
        activeGeneration = null;
        await clearGeneration(prev);
      }
      const chat = W.context()?.chat || [];
      const from = await reconcile(s, chat, opts.replaceIndex);
      if (from !== null && opts.replaceIndex === undefined) await replay(s, chat, from, newestIndex(chat));
      const id = opts.generationId || 'gen:' + s.id + ':' + Date.now() + ':' + (++seq);
      const { batch, prepared, preparedRev, snapshot } = await preparePromptBatch(s, id);
      const text = A.buildLedger(W.loadWorld(s)) + (batch.text ? '\n\n' + batch.text : '');
      await inject(text, s);
      activeGeneration = { id, session: s, ...resolveTargetWindow(chat, opts.replaceIndex), prepared, preparedRev, snapshot };
      return { ...batch, generationId: id, text };
    });
  }
  function onMessage(index) {
    return serial(async () => {
      const s = W.session(), chat = W.context()?.chat || [];
      const target = Number.isSafeInteger(index) ? index : newestIndex(chat);
      if (!assistant(chat[target])) return { advanced: false, reason: '不是完整AI回复' };
      await W.ensureWorld(false, s);
      const from = await reconcile(s, chat);
      if (from !== null && from < target) await replay(s, chat, from, target - 1);
      const generation = matchesTarget(activeGeneration, s, chat, target) ? activeGeneration : null;
      const result = await runStep(undefined, { session: s, msgId: replyId(s, target),
        revision: revisionFor(chat, target), text: chat[target].mes || '', chatIndex: target,
        countMessage: true, initial: target === 0, allowFallback: true,
        generationId: generation?.prepared ? generation.id : undefined });
      if (!result.duplicate && generation) {
        activeGeneration = null;
        try { await inject('', s); } catch (error) { console.warn('[APP] 清理提示词失败：', error.message); }
      }
      return result;
    });
  }
  function syncHistory() {
    return serial(async () => {
      const s = W.session(), chat = W.context()?.chat || [];
      await W.ensureWorld(false, s);
      const from = await reconcile(s, chat);
      if (from !== null) { await replay(s, chat, from, newestIndex(chat)); await publish(s); }
      return from;
    });
  }
  function cancelGeneration() {
    return serial(async () => {
      const generation = activeGeneration;
      activeGeneration = null;
      await clearGeneration(generation);
      // 不确认事件；下次生成仍可取出。
    });
  }
  function reportFailure(error) { console.error('[APP]', error); }
  function attach() {
    if (listeners.length) return true;
    const ctx = W.context(), types = options.events || root.tavern_events || ctx?.event_types || root.event_types;
    const on = options.eventOn || root.eventOn || ctx?.eventSource?.on?.bind(ctx.eventSource);
    const off = options.eventOff || root.eventRemoveListener || ctx?.eventSource?.removeListener?.bind(ctx.eventSource);
    u.check(typeof options.inject === 'function' || typeof ctx?.setExtensionPrompt === 'function',
      '没有提示词注入接口，请配置 inject 后再启动');
    u.check(typeof on === 'function' && typeof off === 'function' && types?.MESSAGE_RECEIVED !== undefined &&
      types?.GENERATION_STARTED !== undefined, '缺少生成前/回复完成事件接口，请配置 events/eventOn/eventOff');
    function bind(event, handler) { on(event, handler); listeners.push({ event, handler, off }); }
    bind(types.GENERATION_STARTED, async (type, data, dryRun) => {
      const chat = W.context()?.chat || [];
      const last = newestIndex(chat);
      const canReplace = REPLACE_TYPES.has(type) && last >= 0 && last === chat.length - 1;
      try { return await beforeGeneration({
        type,
        dryRun: dryRun === true || data?.dryRun === true,
        replaceIndex: canReplace ? last : undefined
      }); }
      catch (error) { reportFailure(error); throw error; }
    });
    bind(types.MESSAGE_RECEIVED, index => onMessage(index).catch(error => { reportFailure(error); throw error; }));
    for (const name of ['MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_SWIPED']) {
      if (types[name] !== undefined) bind(types[name], () => syncHistory().catch(reportFailure));
    }
    // 流式结束会先触发 GENERATION_ENDED 再触发 MESSAGE_RECEIVED，不能在此取消生成；
    // 主动中止走 GENERATION_STOPPED，请求异常残留由下次 beforeGeneration 兜底清理。
    for (const name of ['GENERATION_STOPPED', 'CHAT_CHANGED']) {
      if (types[name] !== undefined) bind(types[name], () => cancelGeneration().catch(reportFailure));
    }
    return true;
  }
  function detach() {
    for (const { event, handler, off } of listeners.splice(0)) off(event, handler);
    return true;
  }
  function restore(id) { return serial(async () => { const s = W.session(); await restoreRecord(s, id); await publish(s); }); }
  root.OKH_APP_HOOK = Object.freeze({ RHYTHM, configure, attach, detach, step, onMessage,
    beforeGeneration, cancelGeneration, syncHistory, restore, fingerprint, revisionFor,
    applyFront: (front, opts = {}) => serial(() => runStep(opts.minutes ?? 0, { ...opts, frontOverride: front })),
    parseElapsed: text => P.parseStatusBar(text).elapsed, lastReport: () => last, publish });
})(globalThis);
