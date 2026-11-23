/**
 * @module okh_app_entry
 * @updated 2026-11-20
 * @status active
 * @reason 生命周期与宿主配置统一入口，校验原子替换能力，避免混用旧核心
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils, GPT = root.OKHBackground;
  const CFG = root.OKH_APP_CONFIG, W = root.OKH_APP_WORLD, A = root.OKH_APP_ADAPTER;
  const H = root.OKH_APP_HOOK, D = root.OKH_APP_DEBUG, HUD = root.OKH_APP_HUD;
  if (!u || !CFG || !W || !A || !H || !D) throw Error('entry 依赖缺失');
  u.check(GPT?.features?.receiptCommit && GPT.features.timeEffects && GPT.features.activitySequences && GPT.features.atomicReplyReplacement,
    '需要同时更新 gpt_core_all.js 到本修复版；不能混用旧核心');
  let started = false;
  function configure(options = {}) {
    u.check(!started, '修改宿主配置前请先 await OKH_APP.stop()');
    W.configure(options); H.configure(options);
    return info();
  }
  function info() {
    return { coreVersion: GPT.version, schemaVersion: CFG.SCHEMA_VERSION, mode: W.store.mode,
      chatId: W.chatId(), revision: W.loadWorld()?.bg.revision ?? null };
  }
  async function init(force = false) {
    const world = await W.ensureWorld(force);
    await H.refreshWorldbook().catch(error => console.warn('[APP] 聊天世界书待同步：', error.message));
    console.log('[OKH_APP] 初始化已保存', info());
    return world;
  }
  async function start() {
    const world = await init();
    root.OKH_BUBBLE_SIDE?.boot();
    const hooked = H.attach();
    if (HUD) HUD.startHud(1000);
    started = true;
    return { world, hooked, hud: Boolean(HUD), storage: info() };
  }
  async function stop() {
    root.OKH_BUBBLE_SIDE?.stop();
    H.detach(); if (HUD) HUD.stopHud();
    await H.cancelGeneration(); started = false;
  }
  async function save(world, { debug = false } = {}) {
    u.check(debug === true, '直接保存仅供显式调试；正式回复请用 step/onMessage');
    const s = W.session(), before = W.loadWorld(s), state = u.clone(world);
    u.check(before && state.bg?.version === 2, '调试存档版本非法');
    state.bg.revision = before.bg.revision + 1;
    return W.commit(s, { expectedRevision: before.bg.revision, state, checkpoint: null, reason: 'debug-save' });
  }
  async function reset() {
    const world = await W.resetWorld();
    await H.refreshWorldbook();
    return world;
  }
  root.OKH_APP = Object.freeze({ configure, init, start, stop, info, save,
    setDefaultPortrait: W.setDefaultPortrait,
    world: W.loadWorld, reset, importLegacy: () => W.importLegacy(),
    migrateSchema: () => W.migrateSchema(),
    step: H.step, applyFront: H.applyFront, beforeGeneration: H.beforeGeneration, onMessage: H.onMessage,
    cancelGeneration: H.cancelGeneration, syncHistory: H.syncHistory, restore: H.restore,
    config: A.runtimeConfig, status: D.status, watch: D.watch, ledger: D.ledger, queue: D.queue,
    renderHud: HUD ? HUD.render : () => false,
    showWatch: value => HUD?.setWatchVisible(value), CFG, W, A, H, D, HUD });
  console.log('[OKH_APP] 修复版已加载；请 await OKH_APP.init()，自动运行用 await OKH_APP.start()');
})(globalThis);
