/**
 * @module okh_app_rules
 * @updated 2026-11-22 07:58
 * @status  active
 * @reason 对齐硬核周常收支模型：短差6金、常规28金、高危48金、修道院帮工3金，日常捐款下调为5/15金
 * @deps    OKH_APP_DATA
 * @provides { getAffectionTier, isFugitiveSyncedNpc, syncWorld, isMetricLocked, onStageChange, canMove, applyPrologueSteps, resolveRoom, resolveBonds, resolveEconomy }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('rules 缺少 OKH_APP_DATA')

  const TOWN_LOCATION_SET = new Set(DATA.TOWN_LOCATIONS)

  function getAffectionTier(value) {
    const score = Number.isFinite(value) ? value : 0
    if (score >= 90) return 'love'
    if (score >= 70) return 'intimate'
    if (score >= 40) return 'friendly'
    return 'ordinary'
  }

  function isFugitiveActive(world) {
    return Boolean(world?.flags?.eileen_fugitive && !world?.flags?.baron_purged)
  }

  function isFugitiveSyncedNpc(world, npc) {
    if (!isFugitiveActive(world) || !npc) return false
    if (npc.alive === false || npc.monitored === false || (npc.stage ?? 0) >= 3) return false
    if (npc.id === 'eileen') {
      return !npc.flags?.eileen_captured && !npc.flags?.eileen_returned_capital
    }
    if (npc.id === 'isna') {
      return Boolean(npc.flags?.eileen_isna_helped) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_labyrinth
    }
    if (npc.id === 'nise') {
      return Boolean(npc.flags?.eileen_nise_helped) && !npc.flags?.nise_fled_casino
    }
    return false
  }

  function syncWorld(world, ctx) {
    if (!isFugitiveActive(world)) return
    for (const id of ['isna', 'nise', 'eileen']) {
      const npc = world?.npcs?.[id]
      if (!isFugitiveSyncedNpc(world, npc)) continue
      if (npc.location !== world.playerLocation) {
        if (npc.activity?.kind === 'ordinary' && ctx?.activity?.finish) {
          ctx.activity.finish(npc, world.timeMin, 'fugitive-squad-sync')
        }
        npc.location = world.playerLocation
      }
    }
  }

  function isMetricLocked(world, npc, name) {
    if (!npc || name !== 'affection' || npc.hasAffection === false) return false
    return Boolean((npc.stage ?? 0) >= 3 || npc.flags?.affection_locked)
  }

  function onStageChange(world, npc, prevStage, toStage) {
    if (!npc || toStage < 3 || npc.hasAffection === false) return
    if (npc.values && Object.hasOwn(npc.values, 'affection')) {
      npc.values.affection = Math.min(npc.values.affection, 50)
    }
    npc.flags = { ...(npc.flags || {}), affection_locked: true }
  }

  function canMove(world, to, npc) {
    if (!Object.hasOwn(DATA.LOCATIONS, to)) return false
    if (!world?.flags?.arrived_oakhaven && TOWN_LOCATION_SET.has(to)) return false
    if (npc && isFugitiveSyncedNpc(world, npc) && to !== world.playerLocation) return false
    return true
  }

  function applyPrologueSteps(world, steps) {
    const out = []
    let arrivedNow = Boolean(world.flags?.arrived_oakhaven)
    let edNow = Boolean(world.flags?.ed_joined)

    for (const flag of steps || []) {
      if (flag === 'ed_joined' && !edNow) {
        edNow = true
        out.push({ target: 'world', worldFlags: { ed_joined: true } })
        if (world.npcs?.ed) {
          out.push({ target: 'ed', monitored: true, move: world.playerLocation || 'wilds' })
        }
      } else if (flag === 'arrived_oakhaven' && !arrivedNow) {
        arrivedNow = true
        const day = Math.floor((world.timeMin ?? 0) / 1440) + 1
        out.push({ target: 'world', worldFlags: { arrived_oakhaven: true, arrivedDay: day } })
        for (const id of ['gulan', 'isna', 'nise', 'aurora', 'ed']) {
          const npc = world.npcs?.[id]
          if (npc && (id !== 'ed' || edNow) && npc.location === 'wilds') {
            out.push({ target: id, move: 'inn' })
          }
        }
      }
    }
    return out
  }

  function resolveRoom(world, room, ctx) {
    const gulan = world.npcs?.gulan
    const current = world.flags?.playerRoomTarget
    if (!room) {
      if (current !== 'gulan') return []
      const stillValid =
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(ctx.phase?.id) &&
        world.playerLocation === 'inn' &&
        gulan?.location === 'inn' &&
        (gulan.stage ?? 0) < 3 &&
        ((gulan.stage ?? 0) < 2 || (gulan.values?.affection ?? 0) >= 90)
      return stillValid ? [] : [{ target: 'world', worldFlags: { playerRoomTarget: null } }]
    }
    if (room.state === 'separate') {
      return [{ target: 'world', worldFlags: { playerRoomTarget: null } }]
    }
    const ok =
      room.npc === 'gulan' &&
      room.state === 'together' &&
      Boolean(world.flags?.arrived_oakhaven) &&
      ['night', 'deep_night'].includes(ctx.phase?.id) &&
      world.playerLocation === 'inn' &&
      gulan?.location === 'inn' &&
      (gulan.values?.affection ?? 0) >= 90 &&
      (gulan.stage ?? 0) < 3

    return [{ target: 'world', worldFlags: { playerRoomTarget: ok ? 'gulan' : null } }]
  }

  function appendNovelty(flags, rawItem) {
    const item = typeof rawItem === 'string' ? rawItem.trim() : ''
    if (!item || item.length > 24) return null
    const list = Array.isArray(flags?.seenNovelties) ? flags.seenNovelties : []
    const norm = item.toLowerCase()
    if (list.some(entry => String(entry).trim().toLowerCase() === norm)) return null
    const nextList = list.concat(item).slice(-50)
    const totalNovelties = (Number.isFinite(flags?.totalNovelties) ? flags.totalNovelties : list.length) + 1
    return { seenNovelties: nextList, totalNovelties }
  }

  const BOND_HANDLERS = {
    gulan: {
      spar: ({ world, npc, phase }) => {
        if (!['morning', 'afternoon'].includes(phase.id) || npc.flags?.gulan_spar_today) return null
        if (world.flags?.arrived_oakhaven && npc.location === 'training_grounds') {
          return { add: { affection: 2 }, npcFlags: { gulan_spar_today: true } }
        }
        if (npc.location === 'wilds') {
          return { add: { affection: 1 }, npcFlags: { gulan_spar_today: true } }
        }
        return null
      },
      care: ({ npc, phase }) => {
        if (npc.flags?.gulan_care_today) return null
        if (npc.location === 'wilds' || (npc.location === 'inn' && ['morning', 'night'].includes(phase.id))) {
          return { add: { affection: 1 }, npcFlags: { gulan_care_today: true } }
        }
        return null
      },
      gear: ({ npc }) =>
        ['inn', 'training_grounds', 'wilds'].includes(npc.location) && !npc.flags?.gulan_gear_today
          ? { add: { affection: 1 }, npcFlags: { gulan_gear_today: true } } : null,
      guild_report: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.flags?.player_guild_job_done
          ? { add: { affection: 2 }, npcFlags: { player_guild_job_done: false } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      calm: ({ world, npc }) =>
        (npc.values.affection ?? 0) >= 70 && npc.stage >= 1 && npc.stage <= 2 &&
        (world.timeMin - (npc.flags?.lastCalmMin ?? -9999)) >= 4320
          ? { add: { affection: 2, blood_density: -2 }, npcFlags: { lastCalmMin: world.timeMin } } : null,
      confide: ({ npc }) =>
        !npc.flags?.gulan_confide_today
          ? { add: { affection: 2 }, npcFlags: { gulan_confide_today: true } } : null,
      watch: ({ npc, phase }) =>
        ['wilds', 'inn'].includes(npc.location) && ['night', 'deep_night'].includes(phase.id) &&
        !npc.flags?.gulan_watch_today
          ? { add: { affection: 1 }, npcFlags: { gulan_watch_today: true } } : null,
      duty: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['town', 'inn', 'wilds'].includes(npc.location) &&
        !npc.flags?.gulan_duty_today
          ? { add: { affection: 2 }, npcFlags: { gulan_duty_today: true } } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    isna: {
      comfort: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && world.playerLocation === 'inn' && npc.location === 'inn' &&
        !npc.flags?.gold_desire_frozen && (npc.values.affection ?? 0) >= 60 &&
        (world.timeMin - (npc.flags?.lastComfortMin ?? -9999)) >= 2880
          ? {
              goldCost: 2,
              add: { gold_desire: -2, affection: 2 },
              npcFlags: { isna_comforted_today: true, lastComfortMin: world.timeMin }
            }
          : null,
      steady_work: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && ['morning', 'afternoon'].includes(phase.id) &&
        ['town', 'wilds'].includes(npc.location) && !npc.flags?.isna_steady_today
          ? { add: { affection: 2 }, npcFlags: { isna_worked_today: true, isna_steady_today: true } }
          : null,
      share_food: ({ npc }) =>
        ['wilds', 'inn'].includes(npc.location) && !npc.flags?.isna_share_food_today
          ? { add: { affection: 1 }, npcFlags: { isna_share_food_today: true } } : null,
      scout_chat: ({ npc }) =>
        ['wilds', 'inn', 'town'].includes(npc.location) && !npc.flags?.isna_scout_today
          ? { add: { affection: 1 }, npcFlags: { isna_scout_today: true } } : null,
      gift: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['inn', 'town'].includes(npc.location) && !npc.flags?.isna_gift_today
          ? { goldCost: 2, add: { affection: 2 }, npcFlags: { isna_gift_today: true } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    nise: {
      tease_back: ({ npc }) =>
        ['wilds', 'inn', 'town'].includes(npc.location) && !npc.flags?.nise_tease_today
          ? { add: { affection: 1 }, npcFlags: { nise_tease_today: true } } : null,
      magic_help: ({ npc }) =>
        !npc.flags?.nise_magic_today
          ? { add: { affection: 1, curiosity: -1 }, npcFlags: { nise_magic_today: true } } : null,
      night_chat: ({ npc, phase }) =>
        ['wilds', 'inn'].includes(npc.location) && ['night', 'deep_night'].includes(phase.id) &&
        !npc.flags?.nise_night_today
          ? { add: { affection: 1 }, npcFlags: { nise_night_today: true } } : null,
      treat: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['inn', 'town'].includes(npc.location) && !npc.flags?.nise_treat_today
          ? { goldCost: 2, add: { affection: 2 }, npcFlags: { nise_treat_today: true } } : null,
      escort: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && ['morning', 'afternoon'].includes(phase.id) &&
        ['town', 'wilds', 'wilds_camp'].includes(npc.location) && !npc.flags?.nise_escort_today
          ? { add: { affection: 2 }, npcFlags: { nise_escort_today: true } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      guide: ({ world, npc, item }) => {
        if ((world.timeMin - (npc.flags?.lastGuideMin ?? -9999)) < 2880) return null
        const noveltyPatch = item ? appendNovelty(npc.flags, item) : null
        return {
          add: { affection: 2, curiosity: -4 },
          npcFlags: { lastGuideMin: world.timeMin, ...(noveltyPatch || {}) }
        }
      },
      novelty: ({ npc, item, day }) => {
        const used = npc.flags?.nise_novelty_day === day ? (npc.flags?.nise_novelty_count ?? 0) : 0
        if (used >= 2) return null
        const noveltyPatch = appendNovelty(npc.flags, item)
        if (!noveltyPatch) return null
        return {
          add: { curiosity: 3, affection: 1 },
          npcFlags: { ...noveltyPatch, nise_novelty_day: day, nise_novelty_count: used + 1 }
        }
      },
      offend: () => ({ add: { affection: -5, curiosity: 5 }, exemptCap: true })
    },
    aurora: {
      help_chores: ({ npc }) =>
        ['wilds', 'inn', 'town'].includes(npc.location) && !npc.flags?.aurora_chores_today
          ? { add: { affection: 1 }, npcFlags: { aurora_chores_today: true } } : null,
      heal_care: ({ npc }) =>
        ['wilds', 'wilds_camp', 'inn', 'church'].includes(npc.location) &&
        !npc.flags?.aurora_heal_today
          ? { add: { affection: 2 }, npcFlags: { aurora_heal_today: true } } : null,
      reassure: ({ npc, phase }) =>
        ['wilds', 'inn', 'church'].includes(npc.location) && ['night', 'deep_night'].includes(phase.id) &&
        !npc.flags?.aurora_reassure_today
          ? { add: { affection: 2 }, npcFlags: { aurora_reassure_today: true } } : null,
      church_visit: ({ world, npc, day }) => {
        if (!world.flags?.arrived_oakhaven || npc.location !== 'church' || npc.flags?.aurora_church_today) return null
        return DATA.isWeekendDay(day)
          ? { add: { affection: 2 }, exemptAdd: { affection: 3 }, npcFlags: { aurora_church_today: true } }
          : { add: { affection: 2 }, npcFlags: { aurora_church_today: true } }
      },
      gift: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['inn', 'town', 'church'].includes(npc.location) && !npc.flags?.aurora_gift_today
          ? { goldCost: 2, add: { affection: 2 }, npcFlags: { aurora_gift_today: true } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    eileen: {
      care_watch: ({ world, npc }) =>
        world.flags?.eileen_fugitive && !world.flags?.baron_purged && !npc.flags?.eileen_captured &&
        (npc.values.affection ?? 0) < 70 && !npc.flags?.eileen_care_today
          ? { add: { affection: 1 }, npcFlags: { eileen_care_today: true } } : null,
      encourage: ({ world, npc }) =>
        world.flags?.eileen_fugitive && !world.flags?.baron_purged && !npc.flags?.eileen_captured &&
        !npc.flags?.eileen_encourage_today
          ? { add: { affection: 2 }, npcFlags: { eileen_encourage_today: true } } : null,
      scout_prep: ({ world, npc }) =>
        world.flags?.eileen_fugitive && !world.flags?.baron_purged && !world.flags?.eileen_signal_fired &&
        !npc.flags?.eileen_captured && !npc.flags?.eileen_scout_today
          ? { add: { counterattack: 4 }, npcFlags: { eileen_scout_today: true } } : null,
      cover_hide: ({ world, npc }) => {
        if (!world.flags?.eileen_fugitive || world.flags?.baron_purged || npc.flags?.eileen_captured) return null
        if (npc.flags?.eileen_cover_today) return null
        const add = { affection: 3 }
        if (!world.flags?.eileen_signal_fired) add.counterattack = 6
        return { add, exemptCap: true, npcFlags: { eileen_cover_today: true } }
      },
      rescue_shield: ({ world, npc }) => {
        if (!world.flags?.eileen_fugitive || world.flags?.baron_purged || npc.flags?.eileen_captured) return null
        if (npc.flags?.eileen_rescue_today) return null
        const add = { affection: 5 }
        if (!world.flags?.eileen_signal_fired) add.counterattack = 10
        return { add, exemptCap: true, npcFlags: { eileen_rescue_today: true } }
      },
      offend: ({ world, npc }) =>
        (world.flags?.eileen_fugitive || world.flags?.baron_purged) &&
        !npc.flags?.eileen_captured && !npc.flags?.eileen_returned_capital
          ? { add: { affection: -3 }, exemptCap: true } : null
    },
    cecilia: {
      mass_pray: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_mass_today
          ? { add: { affection: 1 }, npcFlags: { cecilia_mass_today: true } } : null,
      help_orphans: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_orphans_today
          ? { add: { affection: 2 }, npcFlags: { cecilia_orphans_today: true } } : null,
      herb_assist: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_herb_today
          ? { add: { affection: 2, orphanage_funds: 1 }, npcFlags: { cecilia_herb_today: true, ceciliaAppealDays: 0 } } : null,
      night_talk: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked &&
        ['night', 'deep_night'].includes(phase.id) && (npc.values.affection ?? 0) >= 40 && !npc.flags?.cecilia_night_today
          ? { add: { affection: 2 }, npcFlags: { cecilia_night_today: true } } : null,
      church_gift: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_gift_today
          ? { goldCost: 2, add: { affection: 2, orphanage_funds: 1 }, npcFlags: { cecilia_gift_today: true, ceciliaAppealDays: 0 } } : null,
      shield_church: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_shield_today
          ? { add: { affection: 4 }, exemptCap: true, npcFlags: { cecilia_shield_today: true } } : null,
      offend: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.stage < 3 && !npc.flags?.affection_locked
          ? { add: { affection: -5 }, exemptCap: true } : null
    },
    ed: {
      ask_intel: ({ world, npc, day }) =>
        world.flags?.arrived_oakhaven && npc.monitored === true && npc.alive !== false && npc.flags?.ed_intel_day !== day
          ? { npcFlags: { ed_intel_day: day }, worldFlags: { ed_last_intel_day: day } } : null,
      teach_skills: ({ npc, day }) => {
        if (npc.monitored !== true || npc.alive === false || npc.flags?.ed_teach_day === day) return null
        const nextCount = (npc.flags?.ed_teach_count ?? 0) + 1
        // 3 = 定稿门槛：累计指导求生常识达 3 次解锁潜行放哨与掩护能力
        const stealthReady = Boolean(npc.flags?.ed_stealth_ready || nextCount >= 3)
        return {
          npcFlags: { ed_teach_day: day, ed_teach_count: nextCount, ed_stealth_ready: stealthReady },
          ...(stealthReady ? { worldFlags: { ed_stealth_ready: true } } : {})
        }
      },
      ask_sister: ({ world, npc, day }) =>
        world.flags?.ed_permanently_joined && npc.monitored === true && npc.alive !== false
          ? { npcFlags: { ed_asked_sister_day: day } } : null
    }
  }

  function resolveBonds(world, bonds, ctx) {
    const out = []
    const day = Math.floor(world.timeMin / 1440) + 1
    const capCache = {}
    const flagCache = {}
    let curGold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0
    let innArrears = Boolean(world.flags?.inn_arrears)
    let oddJobUsed = world.flags?.playerOddJobDay === day

    for (const item of bonds || []) {
      const npc = world.npcs?.[item.npc]
      const handlers = Object.hasOwn(BOND_HANDLERS, item.npc) ? BOND_HANDLERS[item.npc] : null
      const fn = handlers && Object.hasOwn(handlers, item.kind) ? handlers[item.kind] : null
      if (!npc || npc.monitored !== true || npc.alive === false || !fn || npc.location !== world.playerLocation) continue

      const viewNpc = { ...npc, flags: { ...npc.flags, ...(flagCache[npc.id] || {}) } }
      const res = fn({ world, npc: viewNpc, phase: ctx.phase, item: item.item, day })
      if (!res) continue

      const cost = res.goldCost ?? 0
      if (cost > 0) {
        if (curGold < cost || (world.playerLocation === 'inn' && innArrears)) continue
        curGold -= cost
        out.push({ target: 'world', goldDelta: -cost })
      }

      if (item.npc === 'isna' && item.kind === 'steady_work' &&
          !world.flags?.eileen_fugitive && !oddJobUsed) {
        oddJobUsed = true
        curGold += 15
        const worldFlags = { playerOddJobDay: day }
        if (curGold >= 5 && innArrears) {
          innArrears = false
          worldFlags.inn_arrears = false
        }
        out.push({ target: 'world', goldDelta: 15, worldFlags })
      }

      const add = { ...(res.add || {}) }
      const npcFlags = { ...(res.npcFlags || {}) }
      const affLocked = isMetricLocked(world, npc, 'affection')
      if (npc.id === 'nise' && item.kind !== 'offend') npcFlags.lastInteractDay = day

      if (affLocked) {
        delete add.affection
      } else {
        if (npc.hasAffection !== false && add.affection > 0 && !res.exemptCap) {
          const curDay = capCache[npc.id]?.day ?? npc.flags?.dailyAffectionDay
          const used = curDay === day ? (capCache[npc.id]?.gain ?? npc.flags?.dailyAffectionGain ?? 0) : 0
          const allow = Math.max(0, 3 - used)
          add.affection = Math.min(add.affection, allow)
          capCache[npc.id] = { day, gain: used + add.affection }
          npcFlags.dailyAffectionDay = day
          npcFlags.dailyAffectionGain = used + add.affection
        }
        if (npc.hasAffection !== false && res.exemptAdd?.affection) {
          add.affection = (add.affection || 0) + res.exemptAdd.affection
        }
      }

      flagCache[npc.id] = { ...(flagCache[npc.id] || {}), ...npcFlags }
      out.push({ target: npc.id, add, npcFlags })
      if (res.worldFlags) out.push({ target: 'world', worldFlags: res.worldFlags })
      if (item.npc === 'gulan' && item.kind === 'calm' && (add.blood_density ?? 0) < 0 &&
          world.flags?.ed_joined && world.npcs?.ed?.monitored) {
        out.push({ target: 'ed', add: { patience: -3 } })
      }
    }
    return out
  }

  function resolveEconomy(world, economies, ctx) {
    const out = []
    if (!world?.flags?.arrived_oakhaven) return out
    const day = Math.floor(world.timeMin / 1440) + 1
    let curGold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0
    let innArrears = Boolean(world.flags?.inn_arrears)
    let oddJobDay = world.flags?.playerOddJobDay
    let guildDay = Number.isFinite(world.flags?.lastGuildCommissionDay) ? world.flags.lastGuildCommissionDay : -99
    let churchDay = Number.isFinite(world.flags?.lastChurchErrandDay) ? world.flags.lastChurchErrandDay : -99
    let supplyCount = world.playerState?.inventory?.find(it => it.id === 'supply' && it.custom !== true)?.count ?? 0
    const supplyCapacity = DATA.ITEM_CATALOG.supply.maxCount

    const gulan = world.npcs?.gulan, isna = world.npcs?.isna
    const aurora = world.npcs?.aurora, nise = world.npcs?.nise, cecilia = world.npcs?.cecilia
    let auroraDebt = aurora?.values?.debt_pressure ?? 0
    let niseDebt = nise?.values?.gamble_debt ?? 0
    let cecFunds = cecilia?.values?.orphanage_funds ?? 0
    let cecAff = cecilia?.values?.affection ?? 0
    const cecLocked = isMetricLocked(world, cecilia, 'affection')
    let cecDaily = cecilia?.flags?.dailyAffectionDay === day ? (cecilia.flags?.dailyAffectionGain ?? 0) : 0

    const pushIncome = (delta, extraFlags) => {
      curGold += delta
      const worldFlags = { ...extraFlags }
      if (curGold >= 5 && innArrears) {
        innArrears = false
        worldFlags.inn_arrears = false
      }
      out.push({ target: 'world', goldDelta: delta, worldFlags })
    }

    for (let i = 0; i < (economies || []).length; i++) {
      const item = economies[i]
      if (!item) continue
      if (item.op === 'work' && !world.flags?.eileen_fugitive) {
        if (item.tier === 'odd' && ['town', 'wilds'].includes(world.playerLocation) && oddJobDay !== day) {
          oddJobDay = day
          pushIncome(6, { playerOddJobDay: day })
        } else if (item.tier === 'guild_normal' && ['town', 'wilds'].includes(world.playerLocation) && (day - guildDay) >= 3) {
          guildDay = day
          pushIncome(28, { lastGuildCommissionDay: day })
          if (gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3) {
            out.push({ target: 'gulan', npcFlags: { player_guild_job_done: true } })
          }
        } else if (item.tier === 'guild_high' && ['town', 'wilds'].includes(world.playerLocation) && (day - guildDay) >= 3) {
          const gulanReady = Boolean(gulan && gulan.monitored === true && gulan.alive !== false && (gulan.stage ?? 0) < 3 && world.playerLocation === 'wilds' && gulan.location === 'wilds')
          const isnaReady = Boolean(isna && isna.monitored === true && isna.alive !== false && (isna.stage ?? 0) < 3 && !isna.flags?.captured_orc && !isna.flags?.isna_fallen_orc && !isna.flags?.isna_captured_ed && !isna.flags?.isna_fallen_labyrinth && isna.location === world.playerLocation)
          if (!gulanReady && !isnaReady) continue
          guildDay = day
          pushIncome(48, { lastGuildCommissionDay: day })
          if (gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3) {
            out.push({ target: 'gulan', npcFlags: { player_guild_job_done: true } })
          }
        } else if ((item.tier === 'church_paid' || item.tier === 'church_volunteer') &&
            ['church', 'wilds'].includes(world.playerLocation) &&
            cecilia && cecilia.alive !== false && (cecilia.stage ?? 0) < 3 && (day - churchDay) >= 2) {
          churchDay = day
          const volunteer = item.tier === 'church_volunteer'
          if (volunteer) {
            out.push({ target: 'world', worldFlags: { lastChurchErrandDay: day } })
          } else {
            pushIncome(3, { lastChurchErrandDay: day })
          }
          const fundsGain = Math.min(volunteer ? 8 : 4, Math.max(0, 100 - cecFunds))
          cecFunds += fundsGain
          const capped = cecLocked ? 0 : Math.min(2, Math.max(0, 3 - cecDaily))
          cecDaily += capped
          const affGain = cecLocked ? 0 : (volunteer ? capped + 3 : capped)
          cecAff = Math.min(100, cecAff + affGain)
          const add = {}
          if (fundsGain > 0) add.orphanage_funds = fundsGain
          if (affGain > 0) add.affection = affGain
          out.push({
            target: 'cecilia',
            ...(Object.keys(add).length ? { add } : {}),
            npcFlags: { dailyAffectionDay: day, dailyAffectionGain: cecDaily, ceciliaAppealDays: 0 }
          })
        }
      } else if (item.op === 'repay') {
        if (item.npc === 'aurora' && aurora && aurora.alive !== false && !aurora.flags?.aurora_purged_with_baron &&
            aurora.flags?.aurora_debt_disclosed && auroraDebt > 0 &&
            ['inn', 'town', 'church'].includes(world.playerLocation) && world.playerLocation === aurora.location) {
          const pts = item.tier === 'all' ? auroraDebt : Math.min(auroraDebt, 10)
          const cost = pts * 10
          if (pts <= 0 || curGold < cost) continue
          curGold -= cost
          auroraDebt -= pts
          out.push({ target: 'world', goldDelta: -cost })
          out.push({
            target: 'aurora',
            add: { debt_pressure: -pts },
            ...(auroraDebt <= 0 ? { npcFlags: { aurora_debt_cleared: true } } : {})
          })
        } else if (item.npc === 'nise' && nise && nise.alive !== false && (nise.stage ?? 0) < 3 &&
            !nise.flags?.casino_debt_frozen && !nise.flags?.nise_fled_casino && niseDebt > 0 &&
            ['town', 'casino', 'inn'].includes(world.playerLocation) &&
            (nise.flags?.nise_debt_known || (nise.stage ?? 0) >= 1 || (world.playerLocation === 'casino' && nise.location === 'casino'))) {
          const pts = item.tier === 'all' ? niseDebt : Math.min(niseDebt, 10)
          const cost = pts * 10
          if (pts <= 0 || curGold < cost) continue
          curGold -= cost
          niseDebt -= pts
          out.push({ target: 'world', goldDelta: -cost })
          const npcFlags = {}
          if (world.playerLocation === 'casino') npcFlags.nise_debt_known = true
          if (niseDebt <= 0) {
            npcFlags.debt_repaid_once = true
            npcFlags.casinoGapDays = 0
          }
          out.push({ target: 'nise', add: { gamble_debt: -pts }, ...(Object.keys(npcFlags).length ? { npcFlags } : {}) })
        }
      } else if (item.op === 'donate' && item.npc === 'cecilia' &&
          world.playerLocation === 'church' && cecilia && cecilia.location === 'church' &&
          cecilia.alive !== false && (cecilia.stage ?? 0) < 3 && !cecLocked && cecFunds < 100) {
        const isLarge = item.tier === 'large'
        const cost = isLarge ? 15 : 5
        const fundsGain = Math.min(isLarge ? 5 : 2, 100 - cecFunds)
        if (curGold < cost || fundsGain <= 0) continue
        const rawAff = isLarge ? 5 : 2
        const affGain = cecAff < 70 ? Math.max(0, Math.min(70 - cecAff, rawAff)) : 0
        curGold -= cost
        cecFunds += fundsGain
        cecAff += affGain
        const add = { orphanage_funds: fundsGain, donated_gold: cost }
        if (affGain > 0) add.affection = affGain
        out.push({ target: 'world', goldDelta: -cost })
        out.push({ target: 'cecilia', add, npcFlags: { ceciliaAppealDays: 0 } })
      } else if (item.op === 'buy_supply' && ['inn', 'town'].includes(world.playerLocation)) {
        const requested = Number.isSafeInteger(item.count) && item.count >= 1 && item.count <= 99 ? item.count : 0
        const count = Math.min(requested, Math.max(0, supplyCapacity - supplyCount))
        const unitPrice = DATA.ITEM_CATALOG?.supply?.unitPrice ?? 1
        const cost = count * unitPrice
        if (count <= 0 || curGold < cost) continue
        curGold -= cost
        supplyCount += count
        out.push({
          target: 'world',
          goldDelta: -cost,
          itemsAdd: [{ id: 'supply', count }],
          ...(world.flags?.supply_shortage ? { worldFlags: { supply_shortage: false } } : {})
        })
      }
    }
    return out
  }

  root.OKH_APP_RULES = Object.freeze({
    getAffectionTier,
    isFugitiveSyncedNpc,
    syncWorld,
    isMetricLocked,
    onStageChange,
    canMove,
    applyPrologueSteps,
    resolveRoom,
    resolveBonds,
    resolveEconomy
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_RULES
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
