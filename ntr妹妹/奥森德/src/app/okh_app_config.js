/**
 * @module okh_app_config
 * @updated 2026-11-18 21:08
 * @status  active
 * @reason  薄运行时配置装配器：透传 itemCatalog 已注册物品白名单供内核原子结算与前端渲染共源读取
 * @deps    OKH_APP_DATA, OKH_APP_RULES, OKH_APP_TIME, OKH_APP_MIGRATE
 * @provides { SCHEMA_VERSION, DAY, WEEKDAYS, weekdayOf, isWeekendDay, weekdayLabel, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ITEM_CATALOG, getAffectionTier, isFugitiveSyncedNpc, syncWorld, isMetricLocked, onStageChange, canMove, ACTIONS, NODES, EVENTS, ROSTER, buildConfig, buildInitialWorld, migrateWorld, settleTimeEffects, applyPrologueSteps, resolveRoom, resolveBonds, resolveEconomy }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  const RULES = root.OKH_APP_RULES
  const TIME = root.OKH_APP_TIME
  const MIG = root.OKH_APP_MIGRATE
  const ALBUM = root.OKH_APP_ALBUM
  const ECHO = root.OKH_APP_ECHOES
  if (!DATA || !RULES || !TIME || !MIG || !ALBUM || !ECHO) throw Error('config 缺少子模块依赖')

  function syncWorld(world, ctx) {
    RULES.syncWorld(world, ctx)
    ECHO.sync(world)
    ALBUM.sync(world)
  }

  function buildConfig() {
    const metricBounds = Object.fromEntries(DATA.ROSTER.map(n => [n.id, { ...n._metricBounds }]))
    return {
      schemaVersion: DATA.SCHEMA_VERSION,
      policy: { ordinaryGraceMin: 120 },
      phases: DATA.PHASES,
      maxSteps: 128,
      actions: DATA.ACTIONS,
      events: DATA.EVENTS,
      nodes: DATA.NODES,
      registerEcho: ECHO.register,
      itemCatalog: DATA.ITEM_CATALOG,
      metricBounds,
      releaseRules: { manualRelease: () => false },
      canMove: RULES.canMove,
      syncWorld,
      completeReply(world, before, command) {
        if (!command.playerAction) root.OKH_APP_ADVENTURE.settleFieldCombat(world, before, command.front?.combatTemper)
        if (ECHO.completeReplay(world, before, command, ALBUM.findImage)) ALBUM.sync(world)
        if (command.front?.clearLocalDigest && world.bg?.localDigest?.length) world.bg.localDigest = []
      },
      applyPlayerAction: root.OKH_APP_ADVENTURE.apply,
      afterTimeStep: root.OKH_APP_ADVENTURE.tick,
      applyTags: root.OKH_APP_TAGS.apply,
      isMetricLocked: RULES.isMetricLocked,
      onStageChange: RULES.onStageChange,
      applyPrologueSteps: RULES.applyPrologueSteps,
      resolveRoom: RULES.resolveRoom,
      resolveBonds: RULES.resolveBonds,
      resolveEconomy: RULES.resolveEconomy,
      recordDossier: RULES.recordDossier,
      timeEffects: TIME.settleTimeEffects,
      prepareCheckpoint: MIG.migrateWorld,
      allowed(ctx, item) {
        if (!item?.effects?.move) return true
        return RULES.canMove(ctx.world, item.effects.move, ctx.npc)
      }
    }
  }

  root.OKH_APP_CONFIG = Object.freeze({
    SCHEMA_VERSION: DATA.SCHEMA_VERSION,
    DAY: DATA.DAY,
    WEEKDAYS: DATA.WEEKDAYS,
    weekdayOf: DATA.weekdayOf,
    isWeekendDay: DATA.isWeekendDay,
    weekdayLabel: DATA.weekdayLabel,
    PHASES: DATA.PHASES,
    LOCATIONS: DATA.LOCATIONS,
    TOWN_LOCATIONS: DATA.TOWN_LOCATIONS,
    STAGES: DATA.STAGES,
    AFFECTION_TIERS: DATA.AFFECTION_TIERS,
    ITEM_CATALOG: DATA.ITEM_CATALOG,
    getAffectionTier: RULES.getAffectionTier,
    isFugitiveSyncedNpc: RULES.isFugitiveSyncedNpc,
    syncWorld,
    isMetricLocked: RULES.isMetricLocked,
    onStageChange: RULES.onStageChange,
    canMove: RULES.canMove,
    ACTIONS: DATA.ACTIONS,
    NODES: DATA.NODES,
    EVENTS: DATA.EVENTS,
    DELAYED_ECHOES: ECHO.definitions,
    isEileenFugitive: DATA.isEileenFugitive,
    ROSTER: DATA.ROSTER,
    buildConfig,
    buildInitialWorld: () => root.OKH_APP_ADVENTURE.initialize(DATA.buildInitialWorld()),
    migrateWorld: MIG.migrateWorld,
    settleTimeEffects: TIME.settleTimeEffects,
    applyPrologueSteps: RULES.applyPrologueSteps,
    resolveRoom: RULES.resolveRoom,
    resolveBonds: RULES.resolveBonds,
    resolveEconomy: RULES.resolveEconomy
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_CONFIG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
