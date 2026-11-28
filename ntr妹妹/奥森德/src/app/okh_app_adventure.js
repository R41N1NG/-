/**
 * @module okh_app_adventure
 * @updated 2026-11-27 03:13
 * @status active
 * @reason 在聊天回合事务内裁决探险、功绩、境界与技能，并补齐奥萝拉山庄服役期间仅限周末旅店归队时可受邀组队的硬守卫
 * @deps OKHBackgroundModules.utils, OKH_APP_DATA, OKH_APP_RUINS, OKH_APP_SKILLS, OKH_APP_TAGS
 */
(function (root) {
  'use strict'
  const u = root.OKHBackgroundModules.utils
  const DATA = root.OKH_APP_DATA
  const RUINS = root.OKH_APP_RUINS
  const SKILLS = root.OKH_APP_SKILLS
  const TAGS = root.OKH_APP_TAGS
  const guilds = Object.values(TAGS.catalog).filter(tag => tag.category === 'guild')
  const companionClasses = {
    gulan: 'class_heavy_vanguard4', isna: 'class_scout_stealth3',
    nise: 'class_arcane_blast2', aurora: 'class_holy_heal2',
    cecilia: 'class_holy_heal3', eileen: 'class_shield_guard3'
  }
  const scoutAbilities = { 侦查: 1, 潜行: 1 }
  const classAbilities = {
    class_scout_stealth: scoutAbilities,
    class_trap_breaker: { 开锁: 1, 拆陷: 1 },
    class_assassin: { 潜行: 1 },
    class_rune_decode: { 辨识: 1, 拆陷: 1 },
    class_holy_heal: { 治疗: 1 },
    class_purify_ward: { 治疗: 1 },
    class_heavy_vanguard: { 破障: 1 },
    class_bombardier: { 破障: 1 },
    class_arcane_blast: { 破障: 1 },
    class_elixir_alchemist: { 治疗: 1 }
  }
  const sleepTags = ['status_sleep_light', 'status_sleep_deep', 'status_sleep_comatose']
  const medicine = {
    antidote: ['debuff_poisoned'], healing_salve: ['debuff_bleeding'],
    paralysis_cure: ['debuff_paralyzed'], purify_vial: ['debuff_exhausted'],
    smelling_salts: sleepTags.slice(0, 2),
    church_blessed_salve: ['debuff_heavy_wound', 'debuff_light_wound', 'debuff_bleeding'],
    church_purify_incense: ['debuff_poisoned', 'debuff_paralyzed'],
    church_blessed_ration: ['debuff_starving', 'debuff_exhausted']
  }

  const shopMedicines = Object.freeze([...Object.keys(medicine), 'sleeping_draught'])

  const tagsOf = (world, id) => world.tags?.[id] || []
  const supply = world => countOf(world, 'supply')
  const countOf = (world, id) => world.playerState.inventory?.find(item => item?.custom !== true && item?.id === id)?.count || 0
  const guildRank = world => guilds.findLastIndex(tag => (world.playerState?.guild_merit ?? 0) >= tag.meritReq)
  const safe = SKILLS.isSafeLoadoutLocation
  const crew = raid => ['player', ...raid.partyMembers, ...(raid.escort ? [raid.escort] : [])]

  function syncRanks(world) {
    const ps = world.playerState
    const guild = guilds[guildRank(world)]
    const classTag = ps.currentClass + ps.tier
    const active = [guild.id, classTag]
    const old = TAGS.list(world, 'player').filter(tag => ['class', 'guild'].includes(tag.category) && !active.includes(tag.id))
    TAGS.apply(world, 'player', active, old.map(tag => tag.id))
  }

  function gain(world, { merit = 0, enemyTier, source }) {
    const ps = world.playerState
    ps.guild_merit += merit
    if (Number.isInteger(enemyTier) && ps.tier < 4) {
      const points = ps.tier === 3
        ? (enemyTier >= 4 ? 4 : enemyTier === 3 ? 2 : 0)
        : enemyTier >= 3 || source === 'core' ? 3 : (source === 'field' ? 1 : 2)
      ps.realmProgress = Math.min(ps.realmCap, ps.realmProgress + points)
      if (ps.realmProgress >= ps.realmCap && world.timeMin >= (ps.realmCooldownUntilMin ?? 0)) {
        ps.tier++
        ps.realmProgress = 0
        ps.realmCap = ps.tier === 3 ? 60 : 0
        ps.realmCooldownUntilMin = world.timeMin + (ps.tier === 3 ? 5 : 0) * 1440
        ps.lastRealmAdvanceMin = world.timeMin
      }
    }
    syncRanks(world)
  }

  function initialize(world) {
    const ps = world.playerState ||= {}
    ps.tier = [2, 3, 4].includes(ps.tier) ? ps.tier : 2
    ps.currentClass = u.own(SKILLS.CLASSES, ps.currentClass) ? ps.currentClass : 'class_shield_guard'
    ps.guild_merit = Number.isSafeInteger(ps.guild_merit) && ps.guild_merit >= 0 ? ps.guild_merit : 0
    ps.realmProgress = Number.isSafeInteger(ps.realmProgress) && ps.realmProgress >= 0 ? ps.realmProgress : 0
    ps.realmCap = { 2: 30, 3: 60, 4: 0 }[ps.tier]
    SKILLS.migrate(world)
    RUINS.migrate(world)
    syncRanks(world)
    ps.adventureVersion = 1
    return world
  }

  function chooseClass(world, id) {
    const ps = world.playerState
    u.check(u.own(SKILLS.CLASSES, id), '未知主职业')
    u.check(!ps.classChosen && ps.tier === 2 && !ps.realmProgress && !world.ruinState?.current, '主职业已定或已开始实战修行')
    const cls = SKILLS.CLASSES[id]
    const skills = Object.values(SKILLS.catalog)
    const starter = skills.find(skill => skill.branch === cls.branch) || SKILLS.catalog.skill_first_aid
    const specialty = skills.find(skill => skill.reqClass === id && skill.tier <= 2)
    ps.currentClass = id
    ps.classChosen = true
    ps.equippedSkills = [starter.id, (specialty || SKILLS.catalog.skill_basic_breach).id]
    for (const skillId of ps.equippedSkills) SKILLS.learn(world, skillId)
    syncRanks(world)
  }

  function isAvailable(world, id) {
    const npc = world.npcs[id]
    if (!npc || npc.monitored !== true || npc.alive === false || (npc.stage ?? 0) >= 3) return false
    if (id === 'aurora' && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) {
      const day = Math.floor((world?.timeMin ?? 0) / 1440) + 1
      if (!DATA.isWeekendDay(day) || npc.location !== 'inn') return false
    }
    return ['inn', 'town', 'wilds'].includes(npc.location) &&
      !npc.flags?.captured_orc && !npc.flags?.captured_manor && !npc.flags?.gulan_departed &&
      !npc.flags?.isna_captured_ed && !npc.flags?.isnaMudOutTonight && !npc.flags?.nise_fled_casino &&
      !(npc.activity && npc.activity.kind !== 'ordinary')
  }

  function members(world, raid) {
    return ['player', ...raid.partyMembers.filter(id => isAvailable(world, id))].filter(id =>
      !tagsOf(world, id).some(tag => sleepTags.includes(tag)))
  }

  function effectiveTier(world, id) {
    const tags = tagsOf(world, id)
    const professions = TAGS.list(world, id).filter(tag => tag.category === 'class')
    const fallback = TAGS.catalog[companionClasses[id]]?.tier ?? 1
    const tier = id === 'player' ? world.playerState.tier : Math.max(fallback, ...professions.map(tag => tag.tier))
    return Math.max(1, tier - Number(tags.includes('debuff_heavy_wound')))
  }

  function ability(world, id, name) {
    const tags = tagsOf(world, id)
    if (tags.includes('debuff_heavy_wound') || tags.includes('debuff_paralyzed')) return 0
    if (id === 'player') {
      const base = SKILLS.checkAbility(world, name)
      const rosary = countOf(world, 'church_silver_rosary') >= 1 && ['治疗', '辨识'].includes(name) ? 1 : 0
      return base + rosary
    }
    const professions = TAGS.list(world, id).filter(tag => tag.category === 'class')
    const fallback = TAGS.catalog[companionClasses[id]]
    if (fallback && professions.length === 0) professions.push(fallback)
    return Math.max(0, ...professions.map(tag =>
      classAbilities[tag.id.replace(/[1-5]$/, '')]?.[name] ? tag.tier : 0))
  }

  function roomOptions(world, raid) {
    const block = raid.blocks[raid.currentBlockIndex]
    if (!block) return []
    if (raid.shortage || tagsOf(world, 'player').some(tag => sleepTags.includes(tag))) return ['撤退']
    const ids = members(world, raid)
    const best = name => Math.max(0, ...ids.map(id => ability(world, id, name)))
    if (block.type === 'entrance') return ['前进', '撤退']
    if (block.type === 'obstacle') return [
      ...(best(block.reqAbility) >= block.reqDc || (block.altAbility && best(block.altAbility) >= (block.altDc ?? block.reqDc)) ? ['巧解'] : ['硬闯']),
      '绕行', '撤退'
    ]
    if (block.type === 'branch') return ['险路', '绕行', '撤退']
    if (block.type === 'sanctum') return ['开启', '撤退']
    const top = Math.max(0, ...ids.map(id => effectiveTier(world, id)))
    const front = ids.some(id => !tagsOf(world, id).includes('debuff_paralyzed') &&
      (id === 'player' ? SKILLS.getEquipped(world).some(skill => skill.tag === '前排护卫稳固') ||
        SKILLS.CLASSES[world.playerState.currentClass]?.branch === 'paladin'
        : TAGS.list(world, id).some(tag => /^class_(shield_guard|heavy_vanguard|devotion_paladin)/.test(tag.id)) ||
          /^class_(shield_guard|heavy_vanguard|devotion_paladin)/.test(companionClasses[id] || '')))
    return [
      ...(top > block.enemyTier || (top === block.enemyTier && (!block.tactics?.reqFrontline || front)) ? ['交锋'] : []),
      ...(top >= block.enemyTier - 1 ? ['周旋'] : []),
      ...(best('潜行') >= block.enemyTier ? ['潜行'] : []),
      '撤退'
    ]
  }

  function randomFor(key) {
    let state = 2166136261
    for (const char of key) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
    return () => {
      state = (state + 0x6D2B79F5) | 0
      let value = Math.imul(state ^ state >>> 15, state | 1)
      value ^= value + Math.imul(value ^ value >>> 7, value | 61)
      return ((value ^ value >>> 14) >>> 0) / 4294967296
    }
  }

  function open(world, site, ids, key) {
    u.check(world.flags?.arrived_oakhaven && world.playerLocation === 'wilds' && !DATA.isEileenFugitive(world), '请在抵镇后从城外荒原进入遗迹')
    const tier = Number(site)
    const churchCommission = site === 'church_weekly'
    const weekly = churchCommission ? DATA.getChurchWeeklyRuin(world) : null
    if (churchCommission) u.check(weekly && !weekly.ready, '须先接取待完成的教堂周常委托')
    const opts = weekly ? { tier: weekly.biome.minTier, biome: weekly.biome.id }
      : [2, 3, 4].includes(tier) ? { tier } : { coreId: site }
    const raid = RUINS.assemble({ ...opts, key, rng: randomFor(key) })
    if (churchCommission) Object.assign(raid, { merit: 0, gold: 0, scrollId: null })
    u.check(guildRank(world) >= raid.tier, '当前公会阶位不足')
    u.check(!tagsOf(world, 'player').some(tag => tag === 'debuff_starving' || sleepTags.includes(tag)), '请先休整再进入遗迹')
    u.check(ids.every(id => isAvailable(world, id)), '随行者当前无法出发')
    if (!isAvailable(world, raid.escort)) raid.escort = null
    u.check(supply(world) >= 1 + ids.length + Number(Boolean(raid.escort)), '补给不足一日用量')
    if (!raid.id && !churchCommission) {
      const recent = DATA.recentGuildStarts(world, world.timeMin)
      u.check(recent.length < DATA.WORK_LIMITS.guildStarts && !DATA.workCooldownWait(world, 'lastGuildCommission', world.timeMin, DATA.WORK_LIMITS.guildCooldownDays), '公会委托额度未恢复')
      const start = world.timeMin
      Object.assign(world.flags, {
        lastGuildCommissionDay: Math.floor(start / 1440) + 1, lastGuildCommissionStartMin: start,
        guildCommissionStarts: [...recent, start]
      })
    }
    RUINS.enter(world, raid, ids)
    for (const id of crew(world.ruinState.current).slice(1)) world.npcs[id].location = 'wilds'
    return { message: '已进入' + raid.name }
  }

  function wound(world, id) {
    const tags = tagsOf(world, id)
    if (tags.includes('debuff_heavy_wound')) return
    const light = tags.includes('debuff_light_wound')
    if (light && id === 'player' && tags.includes('bond_gulan_90') && world.ruinState?.current && !world.ruinState.current.gulanShieldUsed) {
      world.ruinState.current.gulanShieldUsed = true
      return
    }
    TAGS.apply(world, id, [light ? 'debuff_heavy_wound' : 'debuff_light_wound'], light ? ['debuff_light_wound'] : [])
  }

  function hardPassChance(gap) {
    return gap <= 0 ? 1 : Math.max(0.15, 0.75 - 0.25 * (gap - 1))
  }

  function payRations(world, raid, days) {
    const party = crew(raid).filter(id => id === 'player' || isAvailable(world, id))
    const stock = supply(world)
    const required = party.length * days
    if (stock < required) {
      raid.shortage = true
      for (const id of party) TAGS.apply(world, id, ['debuff_starving'])
    }
    const spent = Math.min(stock, required)
    return spent ? [{ target: 'world', itemsRemove: [{ id: 'supply', count: spent }] }] : []
  }

  function explore(world, choice, key) {
    const raid = world.ruinState?.current
    u.check(raid, '当前不在遗迹中')
    if (choice === '撤退') {
      RUINS.retreat(world)
      return { message: '已撤出遗迹' }
    }
    const block = raid.blocks[raid.currentBlockIndex]
    const options = roomOptions(world, raid)
    if (choice === '自动') {
      // 自动只处理没有分岔、剧情密室或均势战的安全节点。
      const safeFight = block?.type === 'combat' && Math.max(0, ...members(world, raid).map(id => effectiveTier(world, id))) > block.enemyTier
      choice = options.includes('前进') ? '前进' : options.includes('巧解') ? '巧解' : safeFight && options.includes('交锋') ? '交锋' : null
    }
    u.check(choice && options.includes(choice), '当前可用行动：' + options.join('、'))
    const rng = randomFor(key)
    const penalty = choice === '绕行' ? 4 : ['硬闯', '周旋'].includes(choice) ? 2 : 0
    const hours = block.minHours + penalty
    const days = Math.floor((world.timeMin + hours * 60) / 1440) - Math.floor(world.timeMin / 1440)
    const effects = payRations(world, raid, days)
    let passed = !raid.shortage
    const isCrypt = RUINS.getBiome(raid.biome)?.id === 'biome_undead_crypt' || block.biome === 'crypt'
    const useHolyWater = passed && isCrypt && ['硬闯', '周旋'].includes(choice) && countOf(world, 'church_holy_water') >= 1
    if (useHolyWater) effects.push({ target: 'world', itemsRemove: ['church_holy_water'] })
    if (passed && choice === '硬闯') {
      const best = name => Math.max(0, ...members(world, raid).map(id => ability(world, id, name)))
      const gap = Math.min(block.reqDc - best(block.reqAbility), block.altAbility ? (block.altDc ?? block.reqDc) - best(block.altAbility) : Infinity) - (useHolyWater ? 2 : 0)
      passed = rng() < hardPassChance(gap)
      wound(world, 'player')
    } else if (passed && choice === '周旋') {
      if (!useHolyWater) wound(world, 'player')
    } else if (passed && choice === '险路') {
      const scout = Math.max(0, ...members(world, raid).map(id => ability(world, id, '侦查')))
      if (scout >= raid.tier) effects.push({ target: 'world', itemsAdd: ['supply'] })
      else wound(world, 'player')
    }
    const cleared = RUINS.advance(world, { hours, passed })
    const victory = passed && choice === '交锋' && block.type === 'combat'
    return {
      minutes: hours * 60, effects,
      message: raid.shortage ? '补给耗尽，队伍只能撤退' : passed ? block.name + '：' + choice + '成功' : block.name + '：硬闯未通过',
      complete(state) {
        if (victory && !raid.temperedBlocks?.includes(block.id)) {
          (raid.temperedBlocks ||= []).push(block.id)
          gain(state, { enemyTier: block.enemyTier, source: 'ruin' })
        }
        if (cleared) {
          gain(state, { merit: raid.merit, enemyTier: raid.id ? raid.tier : undefined, source: 'core' })
          RUINS.finish(state)
          const bonusGold = tagsOf(state, 'player').includes('bond_isna_90') ? Math.floor(raid.gold * 1.2) : raid.gold
          const rewards = [{ target: 'world', goldDelta: bonusGold, itemsAdd: raid.scrollId ? [raid.scrollId] : [] }]
          if (raid.resonance && raid.escort && isAvailable(state, raid.escort)) {
            rewards.push({ target: raid.resonance.target, add: { blood_density: raid.resonance.bloodDelta } })
          }
          return rewards
        }
      }
    }
  }

  function use(world, item, target, key) {
    u.check(target === 'player' || world.npcs[target]?.location === world.playerLocation && world.npcs[target].alive !== false, '只能对自己或同地点的存活角色用药')
    u.check(u.own(medicine, item) || ['sleeping_draught', 'supply'].includes(item), '未知药剂')
    u.check(countOf(world, item) >= 1, '背包里没有该药剂')
    if (item === 'sleeping_draught') {
      TAGS.apply(world, target, ['status_sleep_comatose'], sleepTags.slice(0, 2))
      ;(world.playerState.sleepUntil ||= {})[target] = world.timeMin + 480
    } else if (item === 'smelling_salts' && tagsOf(world, target).includes('status_sleep_comatose')) {
      const woke = randomFor(key)() < hardPassChance(3 - ability(world, 'player', '治疗'))
      if (woke) {
        TAGS.apply(world, target, [], ['status_sleep_comatose'])
        if (world.playerState.sleepUntil) delete world.playerState.sleepUntil[target]
      }
      return { effects: [{ target: 'world', itemsRemove: [item] }], message: woke ? '沉眠已解除' : '使用嗅盐后仍未苏醒' }
    } else {
      const removed = (item === 'supply' ? medicine.healing_salve : medicine[item])
        .filter(tag => tagsOf(world, target).includes(tag))
      u.check(removed.length > 0, '该药剂无法解除目标当前的状态')
      TAGS.apply(world, target, [], removed)
      const timers = world.playerState.conditionTimers?.[target]
      if (timers && ['antidote', 'church_purify_incense'].includes(item)) delete timers.poisonSince
      if (timers && ['healing_salve', 'supply', 'church_blessed_salve'].includes(item)) delete timers.bleedingPhases
      if (timers && item === 'church_blessed_salve') delete timers.recoveryNights
      if (timers && item === 'church_blessed_ration') delete timers.hungerSince
    }
    return { effects: [{ target: 'world', itemsRemove: [item] }], message: '已使用' + DATA.ITEM_CATALOG[item].name }
  }

  function learnScroll(world, item, key) {
    const info = u.own(DATA.ITEM_CATALOG, item) ? DATA.ITEM_CATALOG[item] : null
    u.check(info?.skillTier && countOf(world, item) >= 1, '背包里没有该阶位的技能残卷')
    const learned = world.playerState.learnedSkills
    const pool = Object.values(SKILLS.catalog).filter(skill => skill.tier === info.skillTier && !learned.includes(skill.id))
    const effect = { target: 'world', itemsRemove: [item] }
    if (pool.length === 0) {
      const merit = 5
      gain(world, { merit })
      effect.goldDelta = info.unitPrice
      return { effects: [effect], message: '该阶位没有新的可学技能，残卷兑换为 ' + info.unitPrice + ' 金和 ' + merit + ' 功绩' }
    }
    const skill = pool[Math.floor(randomFor(key)() * pool.length)]
    SKILLS.learn(world, skill.id)
    return { effects: [effect], message: '已习得' + skill.name }
  }

  function order(world, input, key) {
    const words = input.slice('【冒险】'.length).trim().split(/\s+/)
    const [verb, item, extra] = words
    const limit = verb === '进入' ? 5 : ['装配', '用药'].includes(verb) ? 3 : verb === '休整' ? 1 : 2
    u.check(words.length <= limit && (verb === '休整' || item), '冒险指令参数不符')
    if (verb === '选职') { chooseClass(world, item); return { message: '已确定主职业' } }
    if (verb === '进入') return open(world, item, words.slice(2), key)
    if (verb === '行动') return explore(world, item, key)
    if (verb === '研读') return learnScroll(world, item, key)
    if (verb === '装配' || verb === '卸下') {
      if (verb === '装配') {
        u.check(extra === undefined || /^[1-6]$/.test(extra), '栏位须为 1 至 6')
        SKILLS.equip(world, item, extra === undefined ? -1 : Number(extra) - 1)
      } else SKILLS.unequip(world, item)
      return { message: '技能栏已调整，下轮生效' }
    }
    if (verb === '用药') return use(world, item, extra || 'player', key)
    if (verb === '疗伤') {
      u.check(!world.ruinState?.current && world.playerLocation === 'church', '须在圣辉大教堂处理伤势')
      const hasCecilia = DATA.churchAudience(world, world.npcs?.cecilia)
      const healer = hasCecilia ? '请塞西莉亚' : '由教堂医护'
      const target = item
      u.check(target === 'player' || u.own(world.npcs, target) &&
        world.npcs[target].alive !== false && world.npcs[target].location === world.playerLocation, '伤者须在场')
      const tags = tagsOf(world, target)
      if (tags.includes('debuff_heavy_wound')) {
        u.check(world.playerState.gold >= 10, '教堂处理重伤须准备 10 金药费')
        TAGS.apply(world, target, [], ['debuff_heavy_wound', 'debuff_light_wound'])
        if (world.playerState.conditionTimers?.[target]) delete world.playerState.conditionTimers[target].recoveryNights
        return { effects: [{ target: 'world', goldDelta: -10 }], message: `已在教堂${healer}支付 10 金处理重伤` }
      }
      u.check(tags.includes('debuff_light_wound'), '目标当前没有需要教堂处理的轻伤或重伤')
      TAGS.apply(world, target, [], ['debuff_light_wound'])
      return { message: `已在教堂${healer}免费包扎轻伤` }
    }
    if (verb === '买药') {
      u.check(['inn', 'town'].includes(world.playerLocation) && shopMedicines.includes(item), '请在镇上购买已登记药剂')
      const data = DATA.ITEM_CATALOG[item]
      u.check(countOf(world, item) < data.maxCount && world.playerState.gold >= data.unitPrice, '金币不足或药剂已满')
      return { effects: [{ target: 'world', goldDelta: -data.unitPrice, itemsAdd: [item] }], message: '已购买' + data.name }
    }
    if (verb === '休整') {
      u.check(!world.ruinState?.current && ['inn', 'wilds'].includes(world.playerLocation) && supply(world) > 0, '请撤到旅店或荒原营地后使用补给休整')
      const party = ['player', ...Object.values(world.npcs)
        .filter(npc => npc.location === world.playerLocation && npc.alive !== false && npc.monitored === true &&
          tagsOf(world, npc.id).includes('debuff_starving')).map(npc => npc.id)]
      u.check(supply(world) >= party.length, '须为休整中的每位断粮同伴准备一份补给')
      return {
        minutes: 240, effects: [{ target: 'world', itemsRemove: [{ id: 'supply', count: party.length }] }],
        message: '已用补给休整',
        complete(state) {
          if (state.playerLocation === 'wilds') state.playerState.campRestUntilMin = state.timeMin + 240
          const hasAuroraRest = tagsOf(state, 'player').includes('bond_aurora_90')
          for (const id of party) {
            const clearTags = id === 'player' && hasAuroraRest
              ? ['debuff_starving', 'debuff_exhausted', 'debuff_light_wound']
              : ['debuff_starving', 'debuff_exhausted']
            TAGS.apply(state, id, [], clearTags)
            if (state.playerState.conditionTimers?.[id]) delete state.playerState.conditionTimers[id].hungerSince
          }
        }
      }
    }
    throw Error('未知冒险指令')
  }

  function apply(world, input, key) {
    if (typeof input !== 'string' || !input.startsWith('【冒险】')) return null
    // 玩家输入不合法时恢复草稿，仍保存该楼的可重放反馈。
    const draft = u.clone(world)
    try {
      const result = order(draft, input, key)
      draft.playerState.lastAdventure = result.message
      Object.assign(world, draft)
      return result
    } catch (error) {
      if (error.constructor !== Error) throw error
      world.playerState.lastAdventure = error.message
      return { message: error.message }
    }
  }

  function settleFieldCombat(world, before, receipt) {
    if (!receipt || before.ruinState?.current || world.ruinState?.current ||
        !['wilds', 'wilds_camp'].includes(world.playerLocation) || world.playerLocation !== before.playerLocation ||
        world.timeMin <= before.timeMin || !world.flags.arrived_oakhaven) return
    const day = Math.floor(world.timeMin / 1440)
    if (world.playerState.lastFieldTemperDay === day) return
    world.playerState.lastFieldTemperDay = day
    gain(world, { enemyTier: receipt, source: 'field' })
  }

  function phaseNumber(minute) {
    return Math.floor(minute / 1440) * DATA.PHASES.length +
      DATA.PHASES.findLastIndex(phase => phase.start <= minute % 1440)
  }

  function tick(world, beforeMin) {
    const ps = world.playerState
    const passedPhase = phaseNumber(world.timeMin) > phaseNumber(beforeMin)
    const passedDawn = Math.floor((world.timeMin - 360) / 1440) > Math.floor((beforeMin - 360) / 1440)
    for (const [id, tags] of Object.entries(world.tags || {})) {
      if (id !== 'player' && !u.own(world.npcs, id)) continue
      const timers = ps.conditionTimers?.[id] || {}
      const removed = []
      const location = id === 'player' ? world.playerLocation : world.npcs[id].location
      const resting = location === 'inn' && !world.ruinState?.current
      if (passedPhase) {
        removed.push('status_sleep_light', 'debuff_paralyzed')
        if (tags.includes('debuff_bleeding')) {
          timers.bleedingPhases = (timers.bleedingPhases ?? 0) + 1
          if (timers.bleedingPhases >= 2) {
            wound(world, id)
            removed.push('debuff_bleeding')
            delete timers.bleedingPhases
          }
        }
      }
      if (!resting || !tags.includes('debuff_heavy_wound')) delete timers.recoveryNights
      if (passedDawn) {
        removed.push('status_sleep_deep')
        if (id === 'player' && tags.includes('bond_aurora_90') && !world.ruinState?.current) {
          removed.push('debuff_light_wound')
        }
        if (resting) {
          removed.push('debuff_light_wound')
          if (tags.includes('debuff_heavy_wound')) {
            timers.recoveryNights = (timers.recoveryNights ?? 0) + 1
            if (timers.recoveryNights >= 3) {
              removed.push('debuff_heavy_wound')
              delete timers.recoveryNights
            }
          }
        }
      }
      for (const [tag, key] of [['debuff_poisoned', 'poisonSince'], ['debuff_starving', 'hungerSince']]) {
        if (!tags.includes(tag)) {
          delete timers[key]
          continue
        }
        timers[key] ??= beforeMin
        if (world.timeMin - timers[key] >= 1440) {
          wound(world, id)
          timers[key] += 1440
        }
      }
      if (world.timeMin >= (ps.sleepUntil?.[id] ?? Infinity)) {
        removed.push('status_sleep_comatose')
        delete ps.sleepUntil[id]
      }
      if (removed.some(tag => tags.includes(tag))) TAGS.apply(world, id, [], removed)
      if (Object.keys(timers).length) (ps.conditionTimers ||= {})[id] = timers
      else if (ps.conditionTimers) delete ps.conditionTimers[id]
    }
  }

  function nextPhaseStart(timeMin) {
    const dayStart = Math.floor(timeMin / 1440) * 1440
    const local = timeMin % 1440
    const next = DATA.PHASES.find(phase => phase.start > local)
    return next ? dayStart + next.start : dayStart + 1440 + DATA.PHASES[0].start
  }

  function runAdvance(world, command) {
    const cfg = root.OKH_APP_CONFIG.buildConfig()
    const prevPending = new Set(Object.entries(world.bg?.eventStates || {})
      .filter(([, ev]) => ev?.status === 'pending').map(([k]) => k))
    const result = root.OKHBackground.advance(world, command, cfg)
    delete result.state.bg.receipts[command.id]
    const releasedInteractions = Object.entries(result.state.bg?.eventStates || {})
      .filter(([k, ev]) => ev?.status === 'pending' && !prevPending.has(k) &&
        cfg.events.find(def => def.id === ev.definitionId)?.mode === 'interaction')
      .map(([, ev]) => ev.definitionId)
    if (releasedInteractions.length) {
      result.report = { ...(result.report || {}), releasedInteractions }
    }
    Object.assign(world, result.state)
    return result
  }

  function runLocal(world, spec, key = 'local:' + Date.now()) {
    u.check(spec && typeof spec === 'object', '无效的本地操作参数')
    const locLabel = root.OKH_APP_CONFIG?.LOCATIONS?.[world.playerLocation] || world.playerLocation
    if (spec.kind === 'adventure') {
      const cmd = String(spec.command || '').trim()
      u.check(cmd && !cmd.startsWith('选职'), '起始主职请在 0 楼开局确定')
      const verb = cmd.split(/\s+/)[0]
      order(u.clone(world), '【冒险】' + cmd, key)
      if (cmd === '行动 自动' || spec.autoSkip) {
        const steps = []
        let lastReport = null
        for (let i = 0; i < 12 && world.ruinState?.current; i++) {
          const raid = world.ruinState.current
          const block = raid.blocks[raid.currentBlockIndex]
          if (!block || ['branch', 'sanctum'].includes(block.type)) break
          const opts = roomOptions(world, raid)
          const safeFight = block.type === 'combat' && Math.max(0, ...members(world, raid).map(id => effectiveTier(world, id))) > block.enemyTier
          const choice = opts.includes('前进') ? '前进' : opts.includes('巧解') ? '巧解' : safeFight && opts.includes('交锋') ? '交锋' : null
          if (!choice) break
          const stepId = key + ':s' + i
          const res = runAdvance(world, { id: stepId, revision: 'local', toMin: world.timeMin, playerAction: '【冒险】行动 ' + choice })
          lastReport = res.report
          steps.push(world.playerState.lastAdventure || (block.name + '：' + choice))
          if (world.ruinState?.current?.shortage) break
        }
        u.check(steps.length > 0, '当前节点需要手动决策，请使用下方行动按钮或发楼演绎')
        const summary = steps.join('；')
        const nextRaid = world.ruinState?.current
        const nextBlock = nextRaid?.blocks?.[nextRaid.currentBlockIndex]
        const stopHint = !nextRaid ? '遗迹已通关或已撤离'
          : nextRaid.shortage ? '补给耗尽被迫撤退'
            : nextBlock?.type === 'branch' ? `已在【${nextBlock.name}】停下（遇到分岔路口）`
              : nextBlock?.type === 'sanctum' ? `已在【${nextBlock.name}】停下（进入圣所密室）`
                : nextBlock ? `已在【${nextBlock.name}】停下（需要手动决策）` : ''
        const fullMsg = stopHint ? `${summary}。${stopHint}，可直接发消息延续演绎或选择当前行动` : summary
        return { message: fullMsg, report: lastReport, digest: '在遗迹中推进：' + summary }
      }
      const res = runAdvance(world, { id: key, revision: 'local', toMin: world.timeMin, playerAction: '【冒险】' + cmd })
      const msg = world.playerState.lastAdventure || '操作已完成'
      const skipDigest = ['装配', '卸下'].includes(verb)
      return {
        message: msg,
        report: res.report,
        digest: skipDigest ? null : (verb === '进入' || verb === '行动' ? msg : `在${locLabel}${msg}`)
      }
    }
    if (spec.kind === 'economy') {
      const { op, tier, count, npc } = spec
      const minutes = op === 'work' ? (DATA.WORK_TERMS[tier]?.minutes ?? 0) : 0
      const econ = { op, ...(tier ? { tier } : {}), ...(count !== undefined ? { count } : {}), ...(npc ? { npc } : {}) }
      const res = runAdvance(world, {
        id: key, revision: 'local', toMin: world.timeMin + minutes, interactingIds: [],
        front: { economies: [econ] }
      })
      const descMap = {
        buy_supply: `在${locLabel}购入 ${count || 1} 份补给`,
        donate: `在${locLabel}向塞西莉亚进行${tier === 'large' ? '大额' : '小额'}募捐`,
        work: `在${locLabel}完成了${DATA.WORK_TERMS[tier]?.label || tier}（耗时 ${minutes / 60} 小时）`
      }
      const message = descMap[op] || '操作已完成'
      return { message, report: res.report, digest: message }
    }
    if (spec.kind === 'move') {
      u.check(u.own(root.OKH_APP_CONFIG?.LOCATIONS || {}, spec.to), '未知地点')
      if (world.playerLocation === spec.to) return { noChange: true, message: '已在当前地点' }
      const res = runAdvance(world, {
        id: key, revision: 'local', toMin: world.timeMin + 15, interactingIds: [],
        front: { playerLocation: spec.to }
      })
      const targetName = root.OKH_APP_CONFIG.LOCATIONS[spec.to] || spec.to
      return { message: '已前往' + targetName, report: res.report, digest: null }
    }
    if (spec.kind === 'inn_rest') {
      u.check(!world.ruinState?.current && world.playerLocation === 'inn', '须在断剑与麦酒旅店才可回房休息')
      const hasPending = Object.values(world.bg?.eventStates || {}).some(ev => ev.status === 'pending')
      u.check(!hasPending, '当前有待回应的异象浮想，请先在手札处理')
      const res = runAdvance(world, {
        id: key, revision: 'local', toMin: nextPhaseStart(world.timeMin), interactingIds: [], front: {}
      })
      const message = '在断剑与麦酒旅店回房休息至下一时段'
      return { message, report: res.report, digest: message }
    }
    throw Error('未知的本地操作类型')
  }

  root.OKH_APP_ADVENTURE = Object.freeze({ guilds, guildRank, shopMedicines, usableMedicines: shopMedicines, initialize, gain, isAvailable, roomOptions, apply, runLocal, tick, settleFieldCombat })
})(globalThis)

