/**
 * @module okh_app_world
 * @updated 2026-11-18 15:24
 * @status  active
 * @reason  按聊天隔离的单一存档、显式持久化、检查点滑动窗口裁剪（防长对话存档体积线性膨胀）与增量迁移
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG;
  if (!u || !CFG) throw Error('world 缺少 utils/config');
  const KEY = 'okh_gpt.state.v1';
  // 24 = 默认回滚窗口上限：覆盖常规滑屏/删楼重放需求，同时把单聊天存档体积压在约 0.6MB 内
  const DEFAULT_MAX_HISTORY = 24;
  let settings = {}, localLock = Promise.resolve();
  const memory = new Map();

  function historyLimit() {
    const custom = settings.maxHistory;
    return Number.isSafeInteger(custom) && custom >= 1 ? custom : DEFAULT_MAX_HISTORY;
  }
  function pruneHistory(history) {
    const limit = historyLimit();
    return history.length > limit ? history.slice(history.length - limit) : history;
  }

  function configure(options = {}) {
    if (options.maxHistory !== undefined) {
      u.check(Number.isSafeInteger(options.maxHistory) && options.maxHistory >= 1,
        'maxHistory 必须为正整数');
    }
    settings = { ...settings, ...options };
  }
  function context() {
    if (settings.getContext) return settings.getContext();
    if (root.SillyTavern?.getContext) return root.SillyTavern.getContext();
    try { if (root.parent?.SillyTavern?.getContext) return root.parent.SillyTavern.getContext(); } catch (_) {}
    return null;
  }
  function chatId() {
    const c = context();
    const value = settings.getChatId ? settings.getChatId() :
      settings.chatId ?? (typeof root.getCurrentChatId === 'function' ? root.getCurrentChatId() : c?.chatId);
    u.check(typeof value === 'string' && value.trim(), '无法确定当前聊天 ID，请配置 getChatId()');
    return value;
  }
  function backend() {
    if (settings.storage) {
      u.check(typeof settings.storage.get === 'function' && typeof settings.storage.set === 'function', '自定义存储需要 get/set');
      return { mode: 'custom', ...settings.storage };
    }
    if (settings.mode === 'memory') {
      u.check(settings.development === true, '内存模式只能显式用于开发测试');
      return { mode: 'memory', get: k => memory.get(k), set: (k, v) => { memory.set(k, v); } };
    }
    if (typeof root.getVariables === 'function' && typeof root.replaceVariables === 'function') {
      return {
        mode: 'helper-chat',
        get: key => root.getVariables({ type: 'chat' })?.[key],
        set: (key, value) => {
          const vars = root.getVariables({ type: 'chat' });
          u.check(vars && typeof vars === 'object' && !vars.then, '聊天变量接口必须支持同步读取');
          return root.replaceVariables({ ...vars, [key]: value }, { type: 'chat' });
        }
      };
    }
    if (typeof root.getvar === 'function' && typeof root.setvar === 'function') {
      return { mode: 'getvar', get: k => root.getvar(k), set: (k, v) => root.setvar(k, v) };
    }
    throw Error('没有可用的持久存储接口；请配置 storage.get/set，正式环境不退回内存');
  }
  function session() {
    const id = chatId(), driver = backend();
    return { id, driver, key: KEY + ':' + encodeURIComponent(id) };
  }
  function assertSession(s) { u.check(chatId() === s.id, '聊天已切换，拒绝旧聊天操作'); }
  function rawGet(s, key) {
    assertSession(s);
    const value = s.driver.get(key);
    u.check(!value?.then, '存储读取必须同步；请适配 storage.get');
    return value;
  }
  function parse(raw, label) {
    if (raw === undefined || raw === null) return null;
    try { return typeof raw === 'string' ? JSON.parse(raw) : u.clone(raw); }
    catch (_) { throw Error(label + '损坏；拒绝覆盖，请先备份恢复'); }
  }

  function migrateEnvelope(data) {
    let migrated = false;
    if ((data.world.schemaVersion ?? 1) < CFG.SCHEMA_VERSION) {
      data.world = CFG.migrateWorld(data.world);
      migrated = true;
    }
    for (const record of data.history || []) {
      if (record?.before && (record.before.schemaVersion ?? 1) < CFG.SCHEMA_VERSION) {
        record.before = CFG.migrateWorld(record.before);
        migrated = true;
      }
    }
    return migrated;
  }

  function readEnvelope(s = session()) {
    const data = parse(rawGet(s, s.key), '存档');
    if (!data) return null;
    u.check(data.version === 1 && data.chatId === s.id && data.world?.bg?.version === 2 &&
      Array.isArray(data.history), '存档版本或聊天归属不匹配，需要显式迁移');
    migrateEnvelope(data);
    u.validateWorld(data.world);
    return data;
  }

  async function lock(s, task) {
    const run = async () => {
      assertSession(s);
      if (root.navigator?.locks?.request) return root.navigator.locks.request('okh:' + s.id, task);
      return task();
    };
    const result = localLock.then(run);
    localLock = result.catch(() => {});
    return result;
  }
  async function writeEnvelope(s, envelope) {
    assertSession(s);
    const text = JSON.stringify(envelope);
    const written = await s.driver.set(s.key, text);
    u.check(written !== false, '存储接口报告写入失败');
    assertSession(s);
    const back = rawGet(s, s.key);
    u.check(typeof back === 'string' ? back === text : u.signature(back) === u.signature(envelope),
      '存档写入回读不一致，提交未获确认');
    return true;
  }
  function loadWorld(s = session()) { return readEnvelope(s)?.world ?? null; }
  async function ensureWorld(force = false, s = session()) {
    return lock(s, async () => {
      const existing = readEnvelope(s);
      if (!force && existing) return existing.world;
      if (!force && rawGet(s, 'okh_gpt.world') != null) {
        throw Error('发现旧版存档，请先备份并调用 OKH_APP.importLegacy()，不会自动覆盖');
      }
      const world = root.OKHBackground.init(CFG.buildInitialWorld(), CFG.buildConfig());
      await writeEnvelope(s, { version: 1, chatId: s.id, world, history: [] });
      return world;
    });
  }
  async function migrateSchema(s = session()) {
    return lock(s, async () => {
      const raw = parse(rawGet(s, s.key), '存档');
      if (!raw) return { migrated: false, schemaVersion: CFG.SCHEMA_VERSION, world: null };
      u.check(raw.version === 1 && raw.chatId === s.id && raw.world?.bg?.version === 2 &&
        Array.isArray(raw.history), '存档版本或聊天归属不匹配，需要显式迁移');
      const trimmed = pruneHistory(raw.history);
      const historyPruned = trimmed.length !== raw.history.length;
      if (historyPruned) raw.history = trimmed;
      const changed = migrateEnvelope(raw) || historyPruned;
      u.validateWorld(raw.world);
      if (changed) await writeEnvelope(s, raw);
      return {
        migrated: changed,
        schemaVersion: CFG.SCHEMA_VERSION,
        manualReleaseActivities: raw.world.bg?.migrationReport?.manualReleaseActivities || [],
        world: raw.world
      };
    });
  }
  async function commit(s, { expectedRevision, state, checkpoint, reason, receipt }) {
    return lock(s, async () => {
      const envelope = readEnvelope(s);
      u.check(envelope && envelope.world.bg.revision === expectedRevision, '存档提交版本冲突');
      u.validateWorld(state);
      if (reason === 'restore-checkpoint') {
        envelope.history = envelope.history.filter(h => u.own(state.bg.receipts, h.id));
      } else if (checkpoint) {
        u.check(receipt && u.id(receipt.id), '保存检查点需要对应回复');
        envelope.history.push({ id: receipt.id, revision: receipt.revision,
          chatIndex: receipt.chatIndex ?? null, before: u.clone(checkpoint) });
      }
      envelope.history = pruneHistory(envelope.history);
      envelope.world = state;
      return writeEnvelope(s, envelope);
    });
  }
  async function importLegacy(s = session()) {
    return lock(s, async () => {
      u.check(!readEnvelope(s), '目标聊天已有新版存档，禁止覆盖导入');
      let old = parse(rawGet(s, 'okh_gpt.world'), '旧版存档');
      u.check(old?.bg?.version === 2, '没有可导入的旧版 v2 world');
      if ((old.schemaVersion ?? 1) < CFG.SCHEMA_VERSION) old = CFG.migrateWorld(old);
      u.validateWorld(old);
      old.bg.generations ||= {};
      await writeEnvelope(s, { version: 1, chatId: s.id, world: old, history: [] });
      return old;
    });
  }
  async function publishDerived(s, values, revision) {
    assertSession(s);
    u.check(loadWorld(s)?.bg.revision === revision, '派生信息已过期，拒绝发布');
    for (const [key, value] of Object.entries(values)) {
      const ok = await s.driver.set(key, value);
      u.check(ok !== false, '派生缓存写入失败：' + key);
      assertSession(s);
      u.check(rawGet(s, key) === value, '派生缓存回读失败：' + key);
    }
  }
  const store = Object.freeze({
    get mode() { return backend().mode; },
    get: key => rawGet(session(), key)
  });
  root.OKH_APP_WORLD = Object.freeze({ configure, context, chatId, session, assertSession,
    loadWorld, ensureWorld, readEnvelope, migrateSchema, commit, importLegacy, publishDerived, store,
    resetWorld: () => ensureWorld(true), STORAGE_KEY: KEY, DEFAULT_MAX_HISTORY });
})(globalThis);
