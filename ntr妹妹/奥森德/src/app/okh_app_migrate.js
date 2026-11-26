/**
 * @module okh_app_migrate
 * @updated 2026-11-23 20:06
 * @status  active
 * @reason schema=3 幂等迁移，按事件定义键恢复重复实例并保留未加入角色的隐藏状态
 * @deps    OKH_APP_DATA
 * @provides { LEGACY_KEYS, migrateWorld }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('migrate 缺少 OKH_APP_DATA')
  const AFTER_PURGE_COLLAPSE_TEXT = DATA.EVENTS.find(event => event.id === 'ed_grand_stage_3_after_purge').text

  const LEGACY_KEYS = [
    'pride', 'duty', 'lust', 'fear', 'shame', 'need',
    'curiosity', 'loyalty', 'corruption', 'sanity', 'exposure', 'isolation'
  ]

  function normalizeActivityOnMigrate(npc, timeMin, reportList) {
    if (!npc.activity) {
      npc.activity = null
      return
    }
    if (npc.activity.startedAt > timeMin) npc.activity.startedAt = timeMin
    const prevRule = npc.activity.releaseRule
    if (prevRule !== undefined && prevRule !== 'manualRelease') {
      if (npc.activity.kind === 'important' || npc.activity.kind === 'special') {
        npc.activity.migratedFromReleaseRule = prevRule
        npc.activity.releaseRule = 'manualRelease'
        reportList.push({
          npcId: npc.id,
          activityId: npc.activity.id,
          label: npc.activity.label || npc.activity.kind,
          fromReleaseRule: prevRule,
          toReleaseRule: 'manualRelease'
        })
      } else {
        delete npc.activity.releaseRule
      }
    }
  }

  function migrateNpcFromRoster(existing, tpl, inferredArrived, timeMin, reportList, worldFlags) {
    if (!existing) {
      const fresh = JSON.parse(JSON.stringify(tpl))
      if (worldFlags?.arrived_oakhaven || inferredArrived) {
        if (fresh.location === 'wilds' && tpl.homeLocation) fresh.location = tpl.homeLocation
      }
      if (tpl.id === 'ed') fresh.monitored = Boolean(worldFlags?.ed_joined || worldFlags?.ed_permanently_joined || worldFlags?.ed_custody_active)
      return fresh
    }

    const next = JSON.parse(JSON.stringify(existing))
    next.hasStage = tpl.hasStage
    next.hasAffection = tpl.hasAffection
    next.homeLocation = tpl.homeLocation
    next.plan = tpl.plan.slice()
    next.nodePlan = tpl.hasStage ? tpl.nodePlan.slice() : []
    next._metricBounds = { ...tpl._metricBounds }
    next.flags ||= {}
    next.nodeStates ||= {}
    next.activityHistory ||= {}
    if (tpl.id === 'eileen' && !worldFlags?.eileen_arrived && !worldFlags.eileen_fugitive && !next.flags.eileen_captured) {
      next.monitored = false
    }
    if (!Object.hasOwn(DATA.LOCATIONS, next.location)) next.location = tpl.location

    const cleanValues = {}
    for (const [k, defVal] of Object.entries(tpl.values)) {
      const oldVal = next.values?.[k]
      cleanValues[k] = Number.isFinite(oldVal) ? oldVal : defVal
    }
    for (const k of LEGACY_KEYS) {
      if (!Object.hasOwn(tpl.values, k)) delete cleanValues[k]
    }
    next.values = cleanValues
    if (tpl.id === 'aurora' && cleanValues.debt_pressure === 0 &&
        !next.flags.aurora_evt3_done && !next.flags.aurora_debt_cleared) {
      cleanValues.debt_pressure = tpl.values.debt_pressure
    }
    if (tpl.id === 'cecilia' && cleanValues.orphanage_funds === 0 &&
        existing.flags?.lastNightSettledDay === undefined &&
        !next.flags.cecilia_evt1_done && !next.flags.cecilia_midgame_crisis && (next.stage ?? 0) === 0) {
      cleanValues.orphanage_funds = tpl.values.orphanage_funds
    }
    next._baseline = { ...cleanValues }

    if (tpl.hasStage === false) {
      delete next.stage
    } else {
      next.stage ??= 0
      if (tpl.id === 'gulan') {
        for (const idx of [1, 2, 3]) {
          if (next.nodeStates['stage_' + idx] && !next.nodeStates['gulan_stage_' + idx]) {
            next.nodeStates['gulan_stage_' + idx] = next.nodeStates['stage_' + idx]
            delete next.nodeStates['stage_' + idx]
          }
        }
      }
    }

    if (tpl.hasAffection !== false && tpl.hasStage !== false && (next.stage ?? 0) >= 3) {
      if (Object.hasOwn(next.values, 'affection')) {
        next.values.affection = Math.min(next.values.affection, 50)
      }
      next.flags.affection_locked = true
    }

    normalizeActivityOnMigrate(next, timeMin, reportList)
    delete next._lines
    return next
  }

  function migratePendingQueueToEventStates(world) {
    world.bg.eventStates ||= {}
    for (const entry of [...(world.bg.queue || [])].reverse()) {
      const key = entry && JSON.stringify(['event', entry.definitionId, entry.npcId ?? null])
      if (
        entry &&
        entry.kind === 'event' &&
        entry.mode === 'interaction' &&
        (entry.status === 'pending' || entry.status === 'delivered') &&
        entry.id &&
        !Object.hasOwn(world.bg.eventStates, key)
      ) {
        world.bg.eventStates[key] = {
          status: 'pending',
          definitionId: entry.definitionId,
          npcId: entry.npcId ?? null,
          triggeredAt: entry.at ?? world.timeMin,
          instanceId: entry.id,
          ...(Number.isSafeInteger(entry.occurrence) ? { occurrence: entry.occurrence } : {})
        }
      }
    }
  }

  function repairBaronCurfew(world) {
    if (!world.flags?.baron_purged) return world
    const queue = world.bg?.queue || []
    const purgeIndex = queue.findIndex(event => event.definitionId === 'eileen_lancaster_purge')
    const purge = queue[purgeIndex]
    // A curfew decreed before the purge remains a historical fact even if its reply is still pending.
    const wrongIndex = queue.findIndex((event, index) =>
      event.definitionId === 'ed_grand_stage_3' && event.status === 'pending' &&
      event.text !== AFTER_PURGE_COLLAPSE_TEXT &&
      (!purge || event.at > purge.at || (event.at === purge.at && index > purgeIndex)))
    if (world.flags.curfew_active !== true && wrongIndex < 0) return world
    const repaired = { ...world, flags: { ...world.flags, curfew_active: false } }
    if (wrongIndex >= 0) {
      const nextQueue = queue.slice()
      nextQueue[wrongIndex] = { ...queue[wrongIndex], text: AFTER_PURGE_COLLAPSE_TEXT }
      repaired.bg = { ...world.bg, queue: nextQueue }
    }
    return repaired
  }

  function migrateWorld(rawWorld) {
    if (!rawWorld) return rawWorld
    if ((rawWorld.schemaVersion ?? 1) > DATA.SCHEMA_VERSION) return rawWorld
    rawWorld = root.OKH_APP_TAGS.migrate(rawWorld)
    if (rawWorld.schemaVersion === DATA.SCHEMA_VERSION) return repairBaronCurfew(rawWorld)

    const world = JSON.parse(JSON.stringify(rawWorld))
    const timeMin = Number.isSafeInteger(world.timeMin) ? world.timeMin : 0
    const inferredArrived =
      world.schemaVersion === undefined &&
      (world.playerLocation === 'inn' || Object.values(world.npcs || {}).some(n => n.location === 'inn'))

    world.flags ||= {}
    if (world.flags.arrived_oakhaven === undefined) world.flags.arrived_oakhaven = inferredArrived
    if (world.flags.arrivedDay === undefined) {
      world.flags.arrivedDay = world.flags.arrived_oakhaven ? 1 : null
    }
    if (world.flags.ed_joined === undefined) world.flags.ed_joined = inferredArrived
    if (world.flags.playerRoomTarget === undefined) world.flags.playerRoomTarget = null
    world.flags.eileen_fugitive ??= DATA.isEileenFugitive(world)
    world.flags.eileen_signal_fired ??= DATA.hasEileenSignal(world)
    for (const flagKey of [
      'inn_arrears', 'supply_shortage', 'orc_camp_bounty_paid', 'lancaster_purge_reward_paid',
      'eileen_arrived', 'eileen_departed', 'baron_purged', 'player_barony_granted'
    ]) {
      if (world.flags[flagKey] === undefined) world.flags[flagKey] = false
    }
    if (world.flags.lastInnSettledDay === undefined) world.flags.lastInnSettledDay = 0
    if (world.flags.playerOddJobDay === undefined) world.flags.playerOddJobDay = null
    if (world.flags.lastGuildCommissionDay === undefined) world.flags.lastGuildCommissionDay = null
    if (world.flags.lastChurchErrandDay === undefined) world.flags.lastChurchErrandDay = null
    world.playerState ||= {}
    if (!Number.isSafeInteger(world.playerState.gold) || world.playerState.gold < 0) {
      world.playerState.gold = world.flags.player_barony_granted ? 1000 : 30
    }
    delete world.playerState.injury
    world.playerState.tier = Number.isInteger(world.playerState.tier) ? world.playerState.tier : 2
    world.playerState.currentClass = world.playerState.currentClass || 'class_shield_guard'
    world.playerState.realmProgress = Number.isInteger(world.playerState.realmProgress) ? world.playerState.realmProgress : 0
    world.playerState.realmCap = Number.isInteger(world.playerState.realmCap) ? world.playerState.realmCap : 30
    world.playerState.realmCooldownDays = Number.isInteger(world.playerState.realmCooldownDays) ? world.playerState.realmCooldownDays : 0
    world.playerState.guild_merit = Number.isInteger(world.playerState.guild_merit) ? world.playerState.guild_merit : 0
    if (root.OKH_APP_SKILLS?.migrate) root.OKH_APP_SKILLS.migrate(world)
    if (root.OKH_APP_RUINS?.migrate) root.OKH_APP_RUINS.migrate(world)
    if (!Array.isArray(world.playerState.inventory)) {
      // 老存档未建背包时，前传荒原途中补开局 10 份补给，已抵镇存档置空数组避免凭空生出补给
      world.playerState.inventory = world.flags.arrived_oakhaven ? [] : [{ id: 'supply', count: 10 }]
    }
    const ensureQuestItem = (itemId) => {
      if (!world.playerState.inventory.some(it => it && it.id === itemId)) {
        world.playerState.inventory.push({ id: itemId, count: 1 })
      }
    }
    if (world.flags.alice_evidence_secured && !world.flags.alice_rescued) {
      ensureQuestItem('alice_ledger')
    }
    if (world.npcs?.aurora?.flags?.aurora_eileen_intel_given && !DATA.hasEileenSignal(world) && !world.flags.baron_purged) {
      ensureQuestItem('manor_intel_note')
    }
    if (world.flags.player_barony_granted) {
      ensureQuestItem('barony_patent')
    }
    if (!Object.hasOwn(DATA.LOCATIONS, world.playerLocation)) {
      world.playerLocation = inferredArrived ? 'inn' : 'wilds'
    }

    world.bg ||= { version: 2, revision: 0, receipts: {}, settled: {}, fired: {}, queue: [], generations: {} }
    migratePendingQueueToEventStates(world)

    const manualReleaseActivities = []
    const nextNpcs = {}
    for (const tpl of DATA.ROSTER) {
      nextNpcs[tpl.id] = migrateNpcFromRoster(world.npcs?.[tpl.id], tpl, inferredArrived, timeMin, manualReleaseActivities, world.flags)
    }
    world.npcs = nextNpcs
    world.tags = Object.fromEntries(Object.entries(world.tags || {}).filter(([id]) => id === 'player' || id === 'world' || Object.hasOwn(nextNpcs, id)))
    world.bg.migrationReport = {
      fromSchemaVersion: rawWorld.schemaVersion ?? 1,
      toSchemaVersion: DATA.SCHEMA_VERSION,
      manualReleaseActivities
    }
    world.interactingIds = (world.interactingIds || []).filter(id => Object.hasOwn(nextNpcs, id))
    world.schemaVersion = DATA.SCHEMA_VERSION
    return repairBaronCurfew(world)
  }

  root.OKH_APP_MIGRATE = Object.freeze({ LEGACY_KEYS, migrateWorld })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_MIGRATE
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
