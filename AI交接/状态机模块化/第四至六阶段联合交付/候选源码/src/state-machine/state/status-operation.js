/** 身份：gpt。每次消息建立隔离草稿；成功规划后仅一次调用既有统一写入口。 */
function createXsdStatusOperation(ports) {
  const { readStatData, writeStat, readLayer, service, chatId, guard, clone, merge,
    inventoryDeps, initializerDeps, milestoneDeps, statusDeps,
    createInventory, createInitializer, createMilestones, createApplication, L_CHAT } = ports;
  return Object.freeze({ async run(text, messageId, options = {}) {
    guard();
    let draft = clone(readStatData() || {}), patch = {}, writes = 0;
    const notices = [];
    const virtualWrite = async (value, why, manual = false) => {
      guard();
      if (manual) throw Error('自动消息规划不允许创建人工覆盖');
      const protectedValue = service.protect(draft, value, chatId);
      patch = merge(patch, protectedValue);
      draft = service.effective(merge(draft, protectedValue));
      writes++;
      return { ok: true, pending: true, via: '隔离草稿·等待统一提交' };
    };
    const read = () => { guard(); return clone(draft); };
    const planningConsole = Object.fromEntries(['log','warn','error','info'].map(level => [level, (...args) => {
      const logger = statusDeps.console[level] || statusDeps.console.log;
      logger.call(statusDeps.console, '[事务规划]', ...args);
    }]));
    const shared = { readStatData: read, writeStat: virtualWrite, console: planningConsole,
      readKnown: () => read().known || {}, readIdentity: () => read().身份 || null,
      readFaction: () => read().阵营 || null };
    const inventory = createInventory({ ...inventoryDeps, ...shared });
    const initializer = createInitializer({ ...initializerDeps, ...shared });
    const milestones = createMilestones({ ...milestoneDeps, ...shared });
    const application = createApplication({ ...statusDeps, ...shared,
      reconcileNadeLedger: inventory.reconcileNadeLedger,
      ensureInit: initializer.ensureInit,
      applyMilestones: milestones.applyMilestones,
      applyInheritedArchive: (value, id) => statusDeps.applyInheritedArchive(value, id, { writeStat: virtualWrite }),
      window: undefined,
      toast: (...args) => notices.push(args),
    });
    const parsed = await application.applyStatusToVars(text, messageId, options);
    guard();
    if (!writes) return { ok: false, why: '没有可提交的状态规划', retryable: true };
    patch.最后处理楼号 = Number(messageId);
    const mode = parsed && parsed.found ? 'status' : 'fallback';
    if (mode === 'status' && (!Number.isFinite(Number(patch.仙盟历)) || Number(patch.仙盟历) <= 0 || !patch.仙盟历文)) {
      throw Error('规划日历无效，请先校正时间基准');
    }
    guard();
    const result = await writeStat(patch, '第 ' + messageId + ' 楼完整状态事务', false, guard);
    guard();
    if (!result || result.ok !== true) return { ok: false, why: result && result.why || '统一提交失败', retryable: true };
    // service.write 已双层逐路径验；此处再核本次完整规划，并按提交时最新人工控制解释预期。
    const chat = await readLayer(L_CHAT);
    guard();
    const message = await readLayer({ type: 'message', message_id: Number(messageId) });
    guard();
    if (!chat || !message || !chat.stat_data || !message.stat_data) return { ok: false, why: '提交后双层回读不可用', retryable: true };
    const expected = service.protect(chat.stat_data, patch, chatId);
    const matches = (actual, part) => Object.keys(part).every(key => {
      const value = part[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) return actual && actual[key] && matches(actual[key], value);
      return actual && service.eq(actual[key], value);
    });
    if (!matches(chat.stat_data, expected) || !matches(message.stat_data, expected)) {
      return { ok: false, why: '完整状态事务双层回读不一致', retryable: true, partial: true };
    }
    for (const args of notices) { try { statusDeps.toast(...args); } catch (_) {} }
    return { ok: true, mesid: Number(messageId), mode, parsed, plannedWrites: writes, commits: 1 };
  }});
}
