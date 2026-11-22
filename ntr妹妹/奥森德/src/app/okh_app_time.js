/**
 * @module okh_app_time
 * @updated 2026-11-19 02:40
 * @status  active
 * @reason  跨日午夜唯一键去重结算：移除古兰被俘天数跨夜自增；新增演武场血案余波 7 天全局 Tag（安保戒严、人心惶惶）满期自动解除
 * @deps    OKH_APP_DATA
 * @provides { settleTimeEffects }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('time 缺少 OKH_APP_DATA')

  function gulanRoomBlockedUntilMin(world, fromMin) {
    if (world.flags?.playerRoomTarget !== 'gulan') return -1
    const gulan = world.npcs?.gulan
    if (!gulan || world.playerLocation !== 'inn' || gulan.location !== 'inn') return -1
    if ((gulan.stage ?? 0) >= 3 || ((gulan.stage ?? 0) === 2 && (gulan.values?.affection ?? 0) < 90)) return -1
    // 同房保护持续至下一个 06:00 拂晓前（跨过该拂晓或离店后由 shouldClearRoomTarget 清零）
    return (Math.floor((fromMin - 360) / 1440) + 1) * 1440 + 360
  }

  function makeNightSim(world, fromMin) {
    const gulan = world.npcs?.gulan, isna = world.npcs?.isna, nise = world.npcs?.nise
    const aurora = world.npcs?.aurora, eileen = world.npcs?.eileen, cecilia = world.npcs?.cecilia, ed = world.npcs?.ed
    const others = {}
    for (const npc of Object.values(world.npcs || {})) {
      if (['gulan', 'isna', 'nise', 'aurora', 'eileen', 'cecilia', 'ed'].includes(npc.id)) continue
      others[npc.id] = {
        alive: npc.alive !== false,
        lastNight: Number.isFinite(npc.flags?.lastNightSettledDay) ? npc.flags.lastNightSettledDay : 0
      }
    }
    const inv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : []
    const supplyEntry = inv.find(it => it && it.id === 'supply' && it.custom !== true)
    const supplyCount = Number.isSafeInteger(supplyEntry?.count) && supplyEntry.count > 0 ? supplyEntry.count : 0
    const presentNpcCount = Object.values(world.npcs || {}).filter(n =>
      n && n.monitored === true && n.alive !== false && n.location === world.playerLocation
    ).length
    // 1 = 玩家本人；非旅店过夜按在场总人数（玩家 + 同地存活且受监控的同行 NPC）每人消耗 1 份补给
    const partySizeHere = 1 + presentNpcCount
    return {
      arrived: Boolean(world.flags?.arrived_oakhaven),
      playerLoc: world.playerLocation,
      gold: Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 30,
      supplyCount,
      supplyShortage: Boolean(world.flags?.supply_shortage),
      partySizeHere,
      innArrears: Boolean(world.flags?.inn_arrears),
      innFreePassToday: Boolean(world.flags?.inn_free_pass_today),
      baronyGranted: Boolean(world.flags?.player_barony_granted),
      innLastNight: Number.isFinite(world.flags?.lastInnSettledDay) ? world.flags.lastInnSettledDay : 0,
      edJoined: Boolean(world.flags?.ed_joined),
      edMonitored: Boolean(ed?.monitored),
      edAlive: Boolean(ed && ed.alive !== false),
      edPatience: ed?.values?.patience ?? 100,
      edLoc: ed?.location || null,
      edLastNight: Number.isFinite(ed?.flags?.lastNightSettledDay) ? ed.flags.lastNightSettledDay : 0,
      bloodyArena: Boolean(world.flags?.bloody_arena),
      bloodyArenaDay: Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 0,
      martialLaw: Boolean(world.flags?.martial_law),
      panic: Boolean(world.flags?.panic),
      townLastNight: Number.isFinite(world.flags?.lastTownSettledDay) ? world.flags.lastTownSettledDay : 0,
      gulanAlive: Boolean(gulan && gulan.alive !== false),
      gulanStage: gulan?.stage ?? 0,
      gulanLoc: gulan?.location || null,
      gulanRoomProtectedUntil: gulanRoomBlockedUntilMin(world, fromMin),
      gulanLastNight: Number.isFinite(gulan?.flags?.lastNightSettledDay) ? gulan.flags.lastNightSettledDay : 0,
      isnaAlive: Boolean(isna && isna.alive !== false),
      isnaFrozen: Boolean(isna?.flags?.gold_desire_frozen),
      isnaWorked: Boolean(isna?.flags?.isna_worked_today),
      isnaComforted: Boolean(isna?.flags?.isna_comforted_today),
      isnaDistress: isna?.flags?.isna_camp_distress || null,
      isnaDistressDays: Number.isFinite(isna?.flags?.isnaDistressDays) ? isna.flags.isnaDistressDays : 0,
      isnaCapturedOrc: Boolean(isna?.flags?.captured_orc),
      isnaFallenOrc: Boolean(isna?.flags?.isna_fallen_orc),
      isnaCaptiveDays: Number.isFinite(isna?.flags?.orcCaptiveDays) ? isna.flags.orcCaptiveDays : 0,
      isnaLastNight: Number.isFinite(isna?.flags?.lastNightSettledDay) ? isna.flags.lastNightSettledDay : 0,
      niseAlive: Boolean(nise && nise.alive !== false && nise.monitored !== false && !nise.flags?.nise_fled_casino),
      niseStage: nise?.stage ?? 0,
      niseAff: nise?.values?.affection ?? 0,
      niseDebt: nise?.values?.gamble_debt ?? 0,
      niseTastedCasino: Boolean(nise?.flags?.tasted_casino),
      niseFirstDebtDone: Boolean(nise?.flags?.nise_first_debt_done),
      niseDebtRepaidOnce: Boolean(nise?.flags?.debt_repaid_once),
      niseDebtFrozen: Boolean(nise?.flags?.casino_debt_frozen),
      niseCasinoGapDays: Number.isFinite(nise?.flags?.casinoGapDays) ? nise.flags.casinoGapDays : 0,
      niseHasAff: nise?.hasAffection !== false,
      niseAffLocked: Boolean(nise?.flags?.affection_locked),
      niseLastNight: Number.isFinite(nise?.flags?.lastNightSettledDay) ? nise.flags.lastNightSettledDay : 0,
      niseLastInteract: Number.isFinite(nise?.flags?.lastInteractDay) ? nise.flags.lastInteractDay : 1,
      ceciliaAlive: Boolean(cecilia && cecilia.alive !== false && cecilia.monitored !== false),
      ceciliaStage: cecilia?.stage ?? 0,
      ceciliaFunds: cecilia?.values?.orphanage_funds ?? 0,
      ceciliaAff: cecilia?.values?.affection ?? 0,
      ceciliaMidgameCrisis: Boolean(cecilia?.flags?.cecilia_midgame_crisis),
      ceciliaAppealDays: Number.isFinite(cecilia?.flags?.ceciliaAppealDays) ? cecilia.flags.ceciliaAppealDays : 0,
      ceciliaGoStage1: Boolean(cecilia?.flags?.cecilia_manor_go_stage1),
      ceciliaGoStage2: Boolean(cecilia?.flags?.cecilia_manor_go_stage2),
      ceciliaGoStage3: Boolean(cecilia?.flags?.cecilia_manor_go_stage3),
      ceciliaLastNight: Number.isFinite(cecilia?.flags?.lastNightSettledDay) ? cecilia.flags.lastNightSettledDay : 0,
      auroraAlive: Boolean(aurora && aurora.alive !== false && aurora.monitored !== false && !aurora.flags?.aurora_purged_with_baron),
      auroraStage: aurora?.stage ?? 0,
      auroraManorActive: Boolean(aurora?.flags?.manor_service_active),
      auroraLeftManor: Boolean(aurora?.flags?.aurora_left_manor),
      auroraLoc: aurora?.location || null,
      auroraWorkedDay: Number.isFinite(aurora?.flags?.aurora_worked_manor_day) ? aurora.flags.aurora_worked_manor_day : 0,
      auroraDebt: aurora?.values?.debt_pressure ?? 0,
      auroraWorkDays: Number.isFinite(aurora?.flags?.manorWorkDays) ? aurora.flags.manorWorkDays : 0,
      auroraLastNight: Number.isFinite(aurora?.flags?.lastNightSettledDay) ? aurora.flags.lastNightSettledDay : 0,
      eileenMonitored: Boolean(eileen && eileen.alive !== false && eileen.monitored === true),
      eileenArrived: Boolean(world.flags?.eileen_arrived),
      eileenDeparted: Boolean(world.flags?.eileen_departed),
      eileenFugitive: Boolean(world.flags?.eileen_fugitive || eileen?.flags?.eileen_fugitive),
      eileenCaptured: Boolean(eileen?.flags?.eileen_captured),
      eileenSignalFired: Boolean(world.flags?.eileen_signal_fired || eileen?.flags?.eileen_signal_fired),
      baronPurged: Boolean(world.flags?.baron_purged),
      eileenBetrothed: Boolean(eileen?.flags?.eileen_betrothed || world.flags?.player_barony_granted),
      eileenReturnedCapital: Boolean(eileen?.flags?.eileen_returned_capital),
      eileenInspectDays: Number.isFinite(eileen?.flags?.eileenInspectDays) ? eileen.flags.eileenInspectDays : 0,
      eileenCaptiveDays: Number.isFinite(eileen?.flags?.eileenCaptiveDays) ? eileen.flags.eileenCaptiveDays : 0,
      eileenSignalDays: Number.isFinite(eileen?.flags?.eileenSignalDays) ? eileen.flags.eileenSignalDays : 0,
      eileenPostPurgeDays: Number.isFinite(eileen?.flags?.eileenPostPurgeDays) ? eileen.flags.eileenPostPurgeDays : 0,
      eileenLastNight: Number.isFinite(eileen?.flags?.lastNightSettledDay) ? eileen.flags.lastNightSettledDay : 0,
      others
    }
  }

  function settleGulanNight(sim, k, changes) {
    if (sim.gulanLastNight >= k) return
    const add = {}
    const roomBlocked = k * 1440 < sim.gulanRoomProtectedUntil
    if (!roomBlocked && sim.edJoined && sim.arrived && sim.gulanAlive && sim.edMonitored && sim.gulanLoc === sim.edLoc) {
      add.blood_density = sim.gulanStage >= 2 ? 2 : 1
    }
    const change = {
      target: 'gulan',
      npcFlags: {
        gulan_spar_today: false,
        gulan_care_today: false,
        gulan_gear_today: false,
        gulan_confide_today: false,
        gulan_watch_today: false,
        gulan_duty_today: false,
        dailyAffectionDay: k + 1,
        dailyAffectionGain: 0,
        lastNightSettledDay: k
      }
    }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.gulanLastNight = k
  }

  function settleIsnaNight(sim, k, changes) {
    if (sim.isnaLastNight >= k) return
    const change = {
      target: 'isna',
      npcFlags: {
        isna_worked_today: false,
        isna_steady_today: false,
        isna_comforted_today: false,
        isna_share_food_today: false,
        isna_scout_today: false,
        isna_gift_today: false,
        dailyAffectionDay: k + 1,
        dailyAffectionGain: 0,
        lastNightSettledDay: k
      }
    }
    const fugitivePaused = Boolean(sim.eileenFugitive && !sim.baronPurged)
    if (sim.arrived && sim.isnaAlive && !sim.isnaFrozen && !sim.isnaWorked && !sim.isnaComforted && !fugitivePaused) {
      change.add = { gold_desire: 1 }
    }
    if (sim.isnaAlive && sim.isnaDistress && !sim.isnaCapturedOrc && !sim.isnaFallenOrc) {
      sim.isnaDistressDays += 1
      change.npcFlags.isnaDistressDays = sim.isnaDistressDays
    } else if (sim.isnaAlive && sim.isnaCapturedOrc && !sim.isnaFallenOrc) {
      sim.isnaCaptiveDays += 1
      change.npcFlags.orcCaptiveDays = sim.isnaCaptiveDays
    }
    changes.push(change)
    sim.isnaWorked = false
    sim.isnaComforted = false
    sim.isnaLastNight = k
  }

  function settleNiseNight(sim, k, changes) {
    if (sim.niseLastNight >= k) return
    const fugitivePaused = Boolean(sim.eileenFugitive && !sim.baronPurged)
    const affLocked = sim.niseStage >= 3 || sim.niseAffLocked
    const add = {}
    if (sim.niseAlive && sim.niseHasAff && !affLocked && !fugitivePaused && (k - sim.niseLastInteract) >= 5) {
      add.affection = -1
    }
    if (sim.niseAlive && sim.niseStage < 3 && !sim.niseDebtFrozen && sim.niseDebt > 0) {
      const interest = sim.niseDebt >= 60 ? 4 : 2
      add.gamble_debt = interest
      sim.niseDebt = Math.min(100, sim.niseDebt + interest)
    }
    const npcFlags = {
      nise_browsed_today: false,
      nise_tease_today: false,
      nise_magic_today: false,
      nise_night_today: false,
      nise_treat_today: false,
      nise_escort_today: false,
      nise_casino_busy_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    if (sim.arrived && sim.niseAlive && sim.niseStage < 3 && !fugitivePaused && !sim.niseDebtFrozen &&
        sim.niseTastedCasino && (!sim.niseFirstDebtDone || sim.niseDebt > 0 || (sim.niseDebtRepaidOnce && sim.niseAff < 90))) {
      sim.niseCasinoGapDays += 1
      npcFlags.casinoGapDays = sim.niseCasinoGapDays
    }
    if (fugitivePaused) {
      sim.niseLastInteract = Math.max(sim.niseLastInteract, k)
      npcFlags.lastInteractDay = sim.niseLastInteract
    }
    const change = { target: 'nise', npcFlags }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.niseLastNight = k
  }

  function settleAuroraNight(sim, k, kStart, changes) {
    if (sim.auroraLastNight >= k) return
    const npcFlags = {
      aurora_chores_today: false,
      aurora_heal_today: false,
      aurora_reassure_today: false,
      aurora_church_today: false,
      aurora_gift_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const workedToday = sim.auroraWorkedDay === k || sim.auroraLoc === 'manor' || k > kStart
    if (sim.arrived && sim.auroraAlive && !sim.baronPurged && sim.auroraManorActive && !sim.auroraLeftManor &&
        sim.auroraStage < 3 && sim.auroraDebt > 0 && !DATA.isWeekendDay(k) && workedToday) {
      sim.auroraWorkDays += 1
      npcFlags.manorWorkDays = sim.auroraWorkDays
    }
    changes.push({ target: 'aurora', npcFlags })
    sim.auroraLastNight = k
  }

  function settleEileenNight(sim, k, changes) {
    if (sim.eileenLastNight >= k) return
    const npcFlags = {
      eileen_care_today: false,
      eileen_encourage_today: false,
      eileen_scout_today: false,
      eileen_cover_today: false,
      eileen_rescue_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const change = { target: 'eileen', npcFlags }
    if (sim.eileenMonitored && !sim.baronPurged) {
      if (sim.eileenSignalFired) {
        sim.eileenSignalDays += 1
        npcFlags.eileenSignalDays = sim.eileenSignalDays
      } else if (sim.eileenFugitive) {
        change.add = { counterattack: 4 }
      } else if (sim.eileenCaptured) {
        sim.eileenCaptiveDays += 1
        npcFlags.eileenCaptiveDays = sim.eileenCaptiveDays
      } else if (sim.eileenArrived && !sim.eileenDeparted) {
        sim.eileenInspectDays += 1
        npcFlags.eileenInspectDays = sim.eileenInspectDays
      }
    } else if (sim.eileenMonitored && sim.baronPurged && !sim.eileenBetrothed && !sim.eileenReturnedCapital) {
      sim.eileenPostPurgeDays += 1
      npcFlags.eileenPostPurgeDays = sim.eileenPostPurgeDays
    }
    changes.push(change)
    sim.eileenLastNight = k
  }

  function settleInnNight(sim, k, changes) {
    if (sim.innLastNight >= k) return
    sim.innLastNight = k
    const clearShortage = sim.supplyShortage ? { supply_shortage: false } : {}

    // 互斥分支 1：在旅店过夜走宿费结算，不消耗野外补给
    if (sim.playerLoc === 'inn') {
      sim.supplyShortage = false
      if (sim.arrived && !sim.eileenFugitive && !sim.baronyGranted) {
        if (sim.innFreePassToday) {
          // 爱德当日帮工抵扣仅免除当晚一次宿费，核销后次日恢复正常计费
          sim.innFreePassToday = false
          changes.push({ target: 'world', worldFlags: { lastInnSettledDay: k, inn_free_pass_today: false, ...clearShortage } })
        } else if (sim.gold >= 5) {
          sim.gold -= 5
          const worldFlags = { lastInnSettledDay: k, ...clearShortage }
          if (sim.innArrears) {
            sim.innArrears = false
            worldFlags.inn_arrears = false
          }
          changes.push({ target: 'world', goldDelta: -5, worldFlags })
        } else {
          const delta = -sim.gold
          sim.gold = 0
          sim.innArrears = true
          changes.push({ target: 'world', ...(delta ? { goldDelta: delta } : {}), worldFlags: { lastInnSettledDay: k, inn_arrears: true, ...clearShortage } })
        }
      } else {
        const worldFlags = { lastInnSettledDay: k, ...clearShortage }
        if (sim.innFreePassToday) {
          sim.innFreePassToday = false
          worldFlags.inn_free_pass_today = false
        }
        changes.push({ target: 'world', worldFlags })
      }
      return
    }

    // 互斥分支 2：获封男爵后在自家领主山庄过夜，免宿费且免扣补给
    if (sim.baronyGranted && sim.playerLoc === 'manor') {
      const worldFlags = { lastInnSettledDay: k, ...clearShortage }
      sim.supplyShortage = false
      if (sim.innFreePassToday) {
        sim.innFreePassToday = false
        worldFlags.inn_free_pass_today = false
      }
      changes.push({ target: 'world', worldFlags })
      return
    }

    // 互斥分支 3：其他非旅店地点过夜，不扣旅店房费，改为按在场人数每人消耗 1 份补给
    const clearPass = sim.innFreePassToday ? { inn_free_pass_today: false } : {}
    sim.innFreePassToday = false
    const need = sim.partySizeHere
    if (sim.supplyCount >= need) {
      sim.supplyCount -= need
      sim.supplyShortage = false
      changes.push({
        target: 'world',
        itemsRemove: [{ id: 'supply', count: need }],
        worldFlags: { lastInnSettledDay: k, ...clearPass, ...clearShortage }
      })
    } else {
      const spent = sim.supplyCount
      sim.supplyCount = 0
      sim.supplyShortage = true
      changes.push({
        target: 'world',
        ...(spent > 0 ? { itemsRemove: [{ id: 'supply', count: spent }] } : {}),
        worldFlags: { lastInnSettledDay: k, supply_shortage: true, ...clearPass }
      })
    }
  }

  function settleCeciliaNight(sim, k, changes) {
    if (sim.ceciliaLastNight >= k) return
    const npcFlags = {
      cecilia_mass_today: false,
      cecilia_orphans_today: false,
      cecilia_herb_today: false,
      cecilia_night_today: false,
      cecilia_gift_today: false,
      cecilia_shield_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const add = {}
    if (sim.arrived && sim.ceciliaAlive && !sim.baronPurged && sim.ceciliaStage < 3) {
      if (sim.ceciliaFunds > 0) {
        const drain = sim.ceciliaMidgameCrisis ? 6 : 3
        const drop = Math.min(sim.ceciliaFunds, drain)
        sim.ceciliaFunds -= drop
        add.orphanage_funds = -drop
        if (sim.ceciliaAppealDays > 0) {
          sim.ceciliaAppealDays = 0
          npcFlags.ceciliaAppealDays = 0
        }
      } else {
        const reqAff = sim.ceciliaStage === 0 ? 70 : sim.ceciliaStage === 1 ? 80 : 90
        const goFlag = sim.ceciliaStage === 0 ? sim.ceciliaGoStage1 : sim.ceciliaStage === 1 ? sim.ceciliaGoStage2 : sim.ceciliaGoStage3
        if (sim.ceciliaAff >= reqAff && !goFlag) {
          sim.ceciliaAppealDays += 1
          npcFlags.ceciliaAppealDays = sim.ceciliaAppealDays
        }
      }
    }
    const change = { target: 'cecilia', npcFlags }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.ceciliaLastNight = k
  }

  function settleEdNight(sim, k, changes) {
    if (sim.edLastNight >= k) return
    const npcFlags = {
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const add = {}
    if (sim.edJoined && sim.edMonitored && sim.edAlive) {
      let delta = -1
      const roomBlocked = k * 1440 < sim.gulanRoomProtectedUntil
      const gulanMatured = !roomBlocked && sim.arrived && sim.gulanAlive && sim.gulanLoc === sim.edLoc
      if (gulanMatured) {
        delta += 1
      }
      if (delta !== 0) {
        add.patience = delta
      }
    }
    const change = { target: 'ed', npcFlags }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.edLastNight = k
  }

  function settleOtherNights(sim, k, changes) {
    for (const [id, st] of Object.entries(sim.others)) {
      if (!st.alive || st.lastNight >= k) continue
      changes.push({
        target: id,
        npcFlags: {
          dailyAffectionDay: k + 1,
          dailyAffectionGain: 0,
          lastNightSettledDay: k
        }
      })
      st.lastNight = k
    }
  }

  function settleTownNight(sim, k, changes) {
    if (sim.townLastNight >= k) return
    sim.townLastNight = k
    if (sim.bloodyArena && (sim.martialLaw || sim.panic)) {
      // 6 = 案发日当天算第 1 天，历经 7 个自然日（案发日 + 6 个午夜跨入第 8 天）后全局 Tag 自动解除平息
      if (k - sim.bloodyArenaDay >= 6) {
        sim.martialLaw = false
        sim.panic = false
        changes.push({
          target: 'world',
          worldFlags: { martial_law: false, panic: false, lastTownSettledDay: k }
        })
      }
    }
  }

  function shouldClearRoomTarget(world, fromMin, toMin) {
    const target = world.flags?.playerRoomTarget
    if (!target) return false
    const gulan = world.npcs?.gulan
    if (target === 'gulan') {
      const invalidNow =
        world.playerLocation !== 'inn' ||
        !gulan ||
        gulan.location !== 'inn' ||
        (gulan.stage ?? 0) >= 3 ||
        ((gulan.stage ?? 0) === 2 && (gulan.values?.affection ?? 0) < 90)
      if (invalidNow) return true
    }
    const dawnStart = Math.floor((fromMin - 360) / 1440) + 1
    const dawnEnd = Math.floor((toMin - 360) / 1440)
    return dawnStart <= dawnEnd
  }

  function settleTimeEffects({ world, fromMin, toMin }) {
    if (!world || toMin < fromMin) return []
    const changes = []
    if (toMin > fromMin) {
      const sim = makeNightSim(world, fromMin)
      const dayNow = Math.floor(fromMin / 1440) + 1
      if (sim.arrived && sim.auroraAlive && !sim.baronPurged && sim.auroraManorActive && !sim.auroraLeftManor &&
          sim.auroraStage < 3 && sim.auroraDebt > 0 && !DATA.isWeekendDay(dayNow) &&
          sim.auroraLoc === 'manor' && sim.auroraWorkedDay !== dayNow) {
        sim.auroraWorkedDay = dayNow
        changes.push({ target: 'aurora', npcFlags: { aurora_worked_manor_day: dayNow } })
      }
      const kStart = Math.floor(fromMin / 1440) + 1
      const kEnd = Math.floor(toMin / 1440)
      for (let k = kStart; k <= kEnd; k++) {
        settleInnNight(sim, k, changes)
        settleGulanNight(sim, k, changes)
        settleIsnaNight(sim, k, changes)
        settleNiseNight(sim, k, changes)
        settleAuroraNight(sim, k, kStart, changes)
        settleEileenNight(sim, k, changes)
        settleCeciliaNight(sim, k, changes)
        settleEdNight(sim, k, changes)
        settleOtherNights(sim, k, changes)
        settleTownNight(sim, k, changes)
      }
    }
    if (shouldClearRoomTarget(world, fromMin, toMin)) {
      changes.push({ target: 'world', worldFlags: { playerRoomTarget: null } })
    }
    return changes
  }

  root.OKH_APP_TIME = Object.freeze({ settleTimeEffects })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_TIME
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
