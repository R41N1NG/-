/** 身份：gpt。生产装配入口；业务核只接受显式依赖。 */
async function requestXsdGenerationCancel() {
  const candidates = [];
  if (typeof API.stopGeneration === 'function') candidates.push([API, API.stopGeneration]);
  const helper = getGlobalOrParent('stopGeneration');
  if (typeof helper === 'function') candidates.push([window, helper]);
  for (const get of [() => window, () => window.parent, () => window.top]) {
    try {
      const root = get(), tavern = root && root.SillyTavern;
      if (tavern && typeof tavern.stopGeneration === 'function') candidates.push([tavern, tavern.stopGeneration]);
      const context = tavern && typeof tavern.getContext === 'function' && tavern.getContext();
      if (context && typeof context.stopGeneration === 'function') candidates.push([context, context.stopGeneration]);
    } catch (_) {}
  }
  for (const [owner, fn] of candidates) {
    try { const result = await fn.call(owner); if (result !== false) return { requested: true, confirmed: result === true }; } catch (_) {}
  }
  return { requested: false, confirmed: false };
}
function runXsdStatusOperation(text, id, options, guard) {
  const service = window.__xsdCorrection;
  if (!service) return Promise.resolve({ ok: false, why: '缺少二级纠错运行时，请重新构建卡片', retryable: true });
  guard();
  const operation = createXsdStatusOperation({
    readStatData, writeStat, readLayer, service, guard, chatId: service.capture(API).chatId,
    clone: service.clone, merge: service.merge, L_CHAT,
    inventoryDeps: XSD_INVENTORY_DEPS, initializerDeps: XSD_INITIALIZER_DEPS,
    milestoneDeps: XSD_MILESTONE_DEPS, statusDeps: XSD_STATUS_DEPS,
    createInventory: createXsdInventoryRules, createInitializer: createXsdInitializer,
    createMilestones: createXsdMilestoneApplication, createApplication: createXsdStatusApplication,
  });
  return operation.run(text, id, options);
}
const XSD_DISPATCHER = createXsdDispatcher({
  window, API, EVENTS, console, TAG, VERSION, ALL_FIELDS,
  contextKey: xdsMenuChatKey, latestMessageId, messageText, hashText,
  createTransactions: createXsdMessageTransactions, runStatus: runXsdStatusOperation,
  ensureInit, syncIdentityFromFirstMes, reconcileNadeLedger, ensureMenuBound,
  handleUserCommand, swallowCommandMessage, detectInheritance, applyInheritedArchive,
  proposeAnchors, checkOutputContract, readLayer, readStatData, writeStat, L_CHAT, service: window.__xsdCorrection,
  setTimeout, clearTimeout, requestCancel: requestXsdGenerationCancel, toast,
});
function boot(reason) { return XSD_DISPATCHER.boot(reason); }
function onUserMessageSent(id) { return XSD_DISPATCHER.onUserMessageSent(id); }
function onAiMessageReceived(id, options) { return XSD_DISPATCHER.onAiMessageReceived(id, options); }
function xsdStateTick(id, text, source) { return XSD_DISPATCHER.xsdStateTick(id, text, source); }
function preflightFirstGeneration(id) { return XSD_DISPATCHER.preflightFirstGeneration(id); }
XSD_DISPATCHER.start();
