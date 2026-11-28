/**
 * @module okh_app_data
 * @updated 2026-11-27 04:22
 * @status  active
 * @reason  打通古兰一阶保处三段阶梯守护与一阶初夜失守残响分支，补齐纯爱免疫守卫
 * @deps    无
 * @provides { SCHEMA_VERSION, DAY, WEEKDAYS, weekdayOf, isWeekendDay, weekdayLabel, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ITEM_CATALOG, ACTIONS, NODES, EVENTS, ROSTER, buildInitialWorld, DRAGON_TRUE_FORM_SPEC, buildDragonRevealText }
 */
(function (root) {
  'use strict'

  const SCHEMA_VERSION = 3

  const DAY = (n, hour = 6, min = 0) => (n - 1) * 1440 + hour * 60 + min

  // 全局第 1 天设定为周一，周六/周日为周末归队日
  const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const dayAt = world => Math.floor((world?.timeMin ?? 0) / 1440) + 1
  const weekdayOf = day => ((Math.max(1, day) - 1) % 7) + 1
  const isWeekendDay = day => weekdayOf(day) >= 6
  const weekdayLabel = day => WEEKDAYS[weekdayOf(day) - 1]
  const arrivedDayOf = world => (Number.isFinite(world?.flags?.arrivedDay) ? world.flags.arrivedDay : 1)
  function eileenFlag(world, key) {
    const flags = world?.flags || {}
    return Object.hasOwn(flags, key)
      ? flags[key] === true
      : world?.npcs?.eileen?.flags?.[key] === true
  }
  const isEileenFugitive = world => !world?.flags?.baron_purged && eileenFlag(world, 'eileen_fugitive')
  const hasEileenSignal = world => eileenFlag(world, 'eileen_signal_fired')

  const eileenEscortOpen = (world, npc = world.npcs?.eileen) =>
    Boolean(world.flags?.eileen_arrived && !world.flags?.eileen_departed && !world.flags?.baron_purged) &&
    (npc?.flags?.eileenInspectDays ?? 0) >= 6 && (npc?.flags?.eileenInspectDays ?? 0) < 9
  const isDaytime = phase => ['morning', 'afternoon'].includes(phase.id)
  const canPrepareCounterattack = world => isEileenFugitive(world) && !hasEileenSignal(world)
  const availableGulan = world => {
    const gulan = world.npcs?.gulan
    return Boolean(gulan?.monitored && gulan.alive !== false && (gulan.stage ?? 0) < 3 &&
      !gulan.flags?.gulan_departed && !gulan.flags?.captured_orc && !gulan.flags?.captured_manor)
  }

  const weeklyRuins = ['mire', 'vault', 'lair', 'crypt']
  const nextWeeklyBiome = npc => weeklyRuins[(npc.flags?.ceciliaWeeklyCount ?? 0) % weeklyRuins.length]
  const churchAudience = (world, npc) => Boolean(npc?.monitored && npc.alive !== false &&
    world.playerLocation === 'church' && npc.location === 'church')
  const canTakeWeeklyRuin = ({ world, npc, phase }) =>
    Boolean(world.flags?.arrived_oakhaven) && !isEileenFugitive(world) &&
    !npc.flags?.ceciliaWeeklyBiome && dayAt(world) - (npc.flags?.ceciliaWeeklyLastDoneDay ?? -99) >= 7 &&
    churchAudience(world, npc) && isDaytime(phase)

  function getChurchWeeklyRuin(world) {
    const flags = world.npcs?.cecilia?.flags
    const ruins = root.OKH_APP_RUINS
    const biome = ruins?.getBiome(flags?.ceciliaWeeklyBiome)
    if (!biome) return null
    return { biome, ready: ruins.clearedSince(world, biome.id, flags.ceciliaWeeklyAcceptMin, flags.ceciliaWeeklyAcceptDay) }
  }

  function isAloneWith(world, npc, id = npc?.id) {
    if (!npc || npc.id !== id || world.playerLocation !== npc.location) return false
    const present = Object.values(world.npcs || {}).filter(
      n => n.monitored === true && n.alive !== false && n.location === world.playerLocation
    )
    return present.length === 1 && present[0].id === id
  }

  function isAloneWithAurora(world, npc) {
    return isAloneWith(world, npc, 'aurora')
  }

  function presentMasterExists(world) {
    const adv = root.OKH_APP_ADVENTURE
    if (adv?.effectiveTier) {
      if (adv.effectiveTier(world, 'player') >= 4) return true
      return Object.values(world.npcs || {}).some(
        n => n.monitored === true && n.alive !== false && n.location === world.playerLocation &&
          n.id !== 'aurora' && adv.effectiveTier(world, n.id) >= 4
      )
    }
    if ((world.playerState?.tier ?? 2) >= 4) return true
    const tags = root.OKH_APP_TAGS?.catalog || {}
    return Object.values(world.npcs || {}).some(n => {
      if (n.monitored !== true || n.alive === false || n.location !== world.playerLocation || n.id === 'aurora') return false
      const nTags = world.tags?.[n.id] || []
      const maxTagTier = Math.max(0, ...nTags.map(id => tags[id]?.tier ?? 0))
      const base = n.id === 'gulan' ? 5 : maxTagTier
      const heavy = nTags.includes('debuff_heavy_wound') ? 1 : 0
      return Math.max(1, base - heavy) >= 4
    })
  }

  const isFugitiveSquadActive = (world, npc) =>
    isEileenFugitive(world) &&
    npc && npc.alive !== false && npc.monitored !== false && (npc.stage ?? 0) < 3 &&
    ((npc.id === 'isna' && Boolean(npc.flags?.eileen_isna_helped) && !npc.flags?.captured_orc && !npc.flags?.isna_fallen_orc && !npc.flags?.isna_captured_ed && !npc.flags?.isna_fallen_labyrinth) ||
     (npc.id === 'nise' && Boolean(npc.flags?.eileen_nise_helped) && !npc.flags?.nise_fled_casino) ||
     (npc.id === 'eileen' && !npc.flags?.eileen_captured && !npc.flags?.eileen_returned_capital))

  const PHASES = [
    { id: 'deep_night', start: 0,    label: '深夜' },
    { id: 'morning',    start: 360,  label: '上午' },
    { id: 'afternoon',  start: 600,  label: '午后' },
    { id: 'night',      start: 1020, label: '夜晚' }
  ]

  const LOCATIONS = {
    inn: '断剑与麦酒',
    training_grounds: '露天练武场',
    town: '城内街区',
    church: '圣辉大教堂',
    manor: '领主山庄',
    casino: '地下赌场',
    wilds: '城外荒原',
    wilds_camp: '黑兽人前哨据点'
  }

  const TOWN_LOCATIONS = ['inn', 'training_grounds', 'town', 'church', 'manor', 'casino']

  const STAGES = { 0: '如常', 1: '异兆', 2: '泥足', 3: '沦陷' }

  const AFFECTION_TIERS = {
    ordinary: '普通',
    friendly: '友好',
    intimate: '亲密',
    love: '爱恋'
  }

  // 已注册物品白名单：严格由后台事件、跨日结算与镇内采买规则维护；外部自定义物品须带 custom:true 且禁止冲突
  const ITEM_CATALOG = Object.freeze({
    supply: Object.freeze({
      id: 'supply',
      name: '补给',
      category: 'supply',
      stackable: true,
      maxCount: 999,
      // 1 = 单价 1 金/份：5 人满编露宿一晚消耗 5 份 = 5 金，与旅店宿费持平
      unitPrice: 1,
      desc: '一份常规一人份一天量的补给品，由干粮和药品构成。'
    }),
    antidote: Object.freeze({
      id: 'antidote',
      name: '解毒剂',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 3,
      desc: '边境药铺特配的浓缩草药解毒汤剂，解除中毒（debuff_poisoned）。'
    }),
    healing_salve: Object.freeze({
      id: 'healing_salve',
      name: '止血金疮膏',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 2,
      desc: '三七草与兽脂熬制的浓稠药膏，闭合创口，解除流血（debuff_bleeding）。'
    }),
    paralysis_cure: Object.freeze({
      id: 'paralysis_cure',
      name: '舒筋醒络药水',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 4,
      desc: '辛辣刺鼻的微发光黄色药剂，解除麻痹（debuff_paralyzed），恢复行动力。'
    }),
    purify_vial: Object.freeze({
      id: 'purify_vial',
      name: '圣水小瓶',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 5,
      desc: '晨曦修道院祭坛采收祝圣的微光圣水，驱散阴寒死气，解除疲惫（debuff_exhausted）。'
    }),
    smelling_salts: Object.freeze({
      id: 'smelling_salts',
      name: '强效嗅盐瓶',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 3,
      desc: '小瓷瓶里的挥发矿物盐，强刺激性气体，强行唤醒轻眠与深眠，提供沉眠唤醒判定。'
    }),
    sleeping_draught: Object.freeze({
      id: 'sleeping_draught',
      name: '浓缩催眠药水',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 6,
      desc: '无色无味沉眠药水，令未察觉的目标陷入沉眠（status_sleep_comatose）。'
    }),
    skill_scroll_t2: Object.freeze({
      id: 'skill_scroll_t2',
      name: '二阶正规技能残卷',
      category: 'quest',
      stackable: true,
      maxCount: 99,
      unitPrice: 30,
      skillTier: 2,
      desc: '记载二阶正规战技或法术的羊皮纸残卷，研读后掌握一项未学二阶技能。'
    }),
    skill_scroll_t3: Object.freeze({
      id: 'skill_scroll_t3',
      name: '三阶精锐技能残卷',
      category: 'quest',
      stackable: true,
      maxCount: 99,
      unitPrice: 60,
      skillTier: 3,
      desc: '记载三阶精锐战技或法术的典籍残页，研读后掌握一项未学三阶技能。'
    }),
    skill_scroll_t4: Object.freeze({
      id: 'skill_scroll_t4',
      name: '四阶宗师技能残卷',
      category: 'quest',
      stackable: true,
      maxCount: 99,
      unitPrice: 150,
      skillTier: 4,
      desc: '古代宗师秘传法诀或战技真本，研读后掌握一项未学四阶宗师技能。'
    }),
    alice_ledger: Object.freeze({
      id: 'alice_ledger',
      name: '银月珠宝铺真账与私账证物',
      category: 'quest',
      stackable: false,
      desc: '爱丽丝暗中递出的父母真实收支底单、席德私账破绽与后堂钥匙，用于堂前对质。'
    }),
    manor_intel_note: Object.freeze({
      id: 'manor_intel_note',
      name: '山庄换防与暗锁密笺',
      category: 'quest',
      stackable: false,
      desc: '奥萝拉在山庄当差期间暗中记下的私室换防间隙与领主书房暗锁密码。'
    }),
    barony_patent: Object.freeze({
      id: 'barony_patent',
      name: '奥克赫斯附庸伯爵封赏契书',
      category: 'quest',
      stackable: false,
      desc: '兰开斯特家族颁予的原雷蒙德伯爵辖下一处附庸男爵领封赏爵位契书。'
    }),
    isna_pendant: Object.freeze({
      id: 'isna_pendant',
      name: '母亲遗留的成对吊坠',
      category: 'quest',
      stackable: false,
      desc: '伊丝娜托付的成对魔纹吊坠，彼此相隔千里亦可感知危难。'
    }),
    church_blessed_salve: Object.freeze({
      id: 'church_blessed_salve',
      name: '晨曦祝圣伤药膏',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 20,
      desc: '修女长亲手熬制并祝圣的稀缺疗伤药膏，使用后可直接在野外或遗迹内消除重伤（debuff_heavy_wound）、轻伤与流血。'
    }),
    church_holy_water: Object.freeze({
      id: 'church_holy_water',
      name: '细颈圣水银瓶',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 15,
      desc: '圣辉大教堂祝圣的圣水银瓶；探索沉沦灵堂（crypt）或应对亡灵障碍时自动消耗 1 瓶，提供一次 2 阶神圣安抚判定加值。'
    }),
    church_purify_incense: Object.freeze({
      id: 'church_purify_incense',
      name: '晨曦净心熏香',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 12,
      desc: '修道院以干草药与乳香配制的净心熏丸，使用后一并解除中毒（debuff_poisoned）与麻痹（debuff_paralyzed）。'
    }),
    church_blessed_ration: Object.freeze({
      id: 'church_blessed_ration',
      name: '祝圣麦饼干粮',
      category: 'supply',
      stackable: true,
      maxCount: 99,
      unitPrice: 8,
      desc: '塞西莉亚亲手烘烤并祝圣的便携麦饼，使用后直接解除饥饿（debuff_starving）与疲惫（debuff_exhausted）。'
    }),
    church_silver_rosary: Object.freeze({
      id: 'church_silver_rosary',
      name: '纯银祈祷念珠',
      category: 'quest',
      stackable: false,
      maxCount: 1,
      desc: '塞西莉亚亲自祝圣赠予的纯银念珠信物，随身携带时在遗迹「治疗」与「辨识」判定中常驻提供 +1 庇佑加值。'
    }),
    gulan_reverse_scale: Object.freeze({
      id: 'gulan_reverse_scale',
      name: '古兰的逆鳞',
      category: 'quest',
      stackable: false,
      maxCount: 1,
      desc: '古兰亲手褪下赠予的护身逆鳞，温润坚硬；每次遗迹探险中免疫首次即将承受的重伤。'
    }),
    nise_arcane_notes: Object.freeze({
      id: 'nise_arcane_notes',
      name: '妮丝的法术笔记',
      category: 'quest',
      stackable: false,
      maxCount: 1,
      desc: '妮丝熬夜整理并写满批注的专属法术手札，将技能装配上限从 6 格提升至 7 格。'
    }),
    aurora_blessed_ring: Object.freeze({
      id: 'aurora_blessed_ring',
      name: '祝福的祈福银戒',
      category: 'quest',
      stackable: false,
      maxCount: 1,
      desc: '奥萝拉精心祈福祝祷后赠予的银质指环；休整与过夜（含荒原）时可一并安抚解除轻伤。'
    })
  })

  const WORK_LIMITS = Object.freeze({ guildStarts: 2, guildWindowDays: 7, guildCooldownDays: 3, churchCooldownDays: 2 })

  const WORK_TERMS = Object.freeze({
    odd: Object.freeze({ minutes: 360, gold: 6 }),
    guild_normal: Object.freeze({ minutes: 480, gold: 28 }),
    guild_high: Object.freeze({ minutes: 1440, gold: 48 }),
    church_paid: Object.freeze({ minutes: 180, gold: 3 }),
    church_volunteer: Object.freeze({ minutes: 180, gold: 0 })
  })

  function workStart({ world, turnFromMin, workUntilMin }, minutes, paid = true) {
    const end = world.timeMin
    const start = end - minutes
    if (!world.flags?.arrived_oakhaven || !Number.isSafeInteger(turnFromMin) || !Number.isSafeInteger(workUntilMin) || end > workUntilMin ||
        start < Math.max(turnFromMin, world.flags.arrivedOakhavenAtMin ?? 0, world.flags.lastPlayerWorkEndMin ?? 0)) return null
    if (paid && paidWorkSettledToday(world)) return null
    return start
  }

  function paidWorkSettledToday(world) {
    const day = dayAt(world), flags = world.flags || {}
    return [flags.lastPaidWorkDay, flags.playerOddJobDay, flags.lastGuildCommissionDay, flags.lastEdInterceptDay].includes(day)
  }

  function workCooldownWait(world, key, start, days) {
    const previous = world.flags?.[key + 'StartMin']
    if (Number.isSafeInteger(previous)) return Math.max(0, previous + days * 1440 - start)
    const legacyDay = world.flags?.[key + 'Day']
    return Number.isSafeInteger(legacyDay) ? Math.max(0, (legacyDay + days - 1) * 1440 - start) : 0
  }

  function recentGuildStarts(world, start) {
    const starts = world.flags?.guildCommissionStarts
    return (Array.isArray(starts) ? starts : []).filter(t => Number.isSafeInteger(t) && t > start - WORK_LIMITS.guildWindowDays * 1440)
  }

  function completedWorkFlags(world, paid = true) {
    return { lastPlayerWorkEndMin: world.timeMin, ...(paid ? { lastPaidWorkDay: dayAt(world) } : {}) }
  }

  const ACTIONS = [
    {
      id: 'gulan_inn_maintenance',
      priority: 21,
      weight: 45,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        npc.monitored !== false &&
        !npc.flags?.gulan_departed &&
        !npc.flags?.captured_orc &&
        !npc.flags?.captured_manor &&
        phase.id === 'morning',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '在旅店保养阔刃重剑与甲胄' }
    },
    {
      id: 'gulan_hall_meditate',
      priority: 21,
      weight: 35,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        npc.monitored !== false &&
        !npc.flags?.gulan_departed &&
        !npc.flags?.captured_orc &&
        !npc.flags?.captured_manor &&
        phase.id === 'morning',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '在旅店大厅闭目静坐冥想' }
    },
    {
      id: 'gulan_town_patrol',
      priority: 21,
      weight: 20,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        npc.monitored !== false &&
        !npc.flags?.gulan_departed &&
        !npc.flags?.captured_orc &&
        !npc.flags?.captured_manor &&
        !isWeekendDay(dayAt(world)) &&
        phase.id === 'morning',
      effects: { move: 'town' },
      occupation: { kind: 'ordinary', label: '在镇上巡逻并留意周边动静' }
    },
    {
      id: 'gulan_train',
      priority: 25,
      weight: 90,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        npc.monitored !== false &&
        !npc.flags?.gulan_departed &&
        !npc.flags?.captured_orc &&
        !npc.flags?.captured_manor &&
        phase.id === 'afternoon' &&
        npc.location !== 'training_grounds',
      effects: { move: 'training_grounds' },
      occupation: { kind: 'ordinary', label: '前往演武场练剑' }
    },
    {
      id: 'gulan_dragon_search',
      priority: 25,
      weight: 10,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        npc.monitored !== false &&
        !npc.flags?.gulan_departed &&
        !npc.flags?.captured_orc &&
        !npc.flags?.captured_manor &&
        phase.id === 'afternoon',
      effects: { move: 'wilds' },
      occupation: { kind: 'ordinary', label: '外出游历探寻龙族遗迹与传闻' }
    },
    {
      id: 'isna_mud_camp_night',
      priority: 40,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        npc.stage === 2 &&
        Boolean(npc.flags?.isnaMudOutTonight) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudSealCleared &&
        !npc.flags?.isna_mud_hopeless_fled &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.location !== 'wilds_camp',
      effects: { move: 'wilds_camp' },
      occupation: { kind: 'ordinary', label: '夜潜赶往荒原黑兽人前哨压制血契' }
    },
    {
      id: 'isna_odd_job',
      priority: 23,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_camp_distress &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudOutTonight &&
        npc.stage < 2 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !npc.flags?.isna_worked_today,
      effects: {
        move: 'town',
        add: { gold_desire: 1 },
        npcFlags: { isna_worked_today: true }
      },
      occupation: { kind: 'ordinary', label: '去镇上接点零散杂活' }
    },
    {
      id: 'isna_inn_nap',
      priority: 22,
      weight: 50,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_camp_distress &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudOutTonight &&
        npc.stage < 3 &&
        phase.id === 'morning',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '在旅店向阳窗台打盹歇息' }
    },
    {
      id: 'isna_knife_sharpen',
      priority: 22,
      weight: 50,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_camp_distress &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudOutTonight &&
        npc.stage < 3 &&
        phase.id === 'morning',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '在旅店门廊擦拭双匕与清点飞刀' }
    },
    {
      id: 'isna_town_rumors',
      priority: 22,
      weight: 60,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_camp_distress &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudOutTonight &&
        npc.stage < 2 &&
        phase.id === 'afternoon',
      effects: { move: 'town' },
      occupation: { kind: 'ordinary', label: '在镇上穿街走巷打听流言与商队动向' }
    },
    {
      id: 'isna_buy_jerky',
      priority: 22,
      weight: 40,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_camp_distress &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudOutTonight &&
        npc.stage < 2 &&
        phase.id === 'afternoon',
      effects: { move: 'town' },
      occupation: { kind: 'ordinary', label: '在镇上市集买肉干打牙祭' }
    },
    {
      id: 'nise_town_browse',
      priority: 22,
      weight: 60,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !npc.flags?.nise_browsed_today &&
        !npc.flags?.nise_escort_today &&
        !npc.flags?.nise_casino_busy_today,
      effects: {
        move: 'town',
        add: { curiosity: 1 },
        npcFlags: { nise_browsed_today: true }
      },
      occupation: { kind: 'ordinary', label: '在镇上四处闲逛搜罗新奇物件' }
    },
    {
      id: 'nise_inn_sleep_in',
      priority: 22,
      weight: 40,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        phase.id === 'morning' &&
        !npc.flags?.nise_escort_today &&
        !npc.flags?.nise_casino_busy_today,
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '在旅店房间赖床补觉' }
    },
    {
      id: 'nise_read_scrolls',
      priority: 21,
      weight: 35,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        phase.id === 'night' &&
        npc.location === 'inn' &&
        !npc.flags?.nise_casino_busy_today,
      effects: {},
      occupation: { kind: 'ordinary', label: '在旅店房间研读卷轴与法术笔记' }
    },
    {
      id: 'nise_hall_tea',
      priority: 21,
      weight: 25,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        phase.id === 'night' &&
        npc.location === 'inn' &&
        !npc.flags?.nise_casino_busy_today,
      effects: {},
      occupation: { kind: 'ordinary', label: '在旅店大厅点红茶与茶点歇息' }
    },
    {
      id: 'nise_hall_bard',
      priority: 21,
      weight: 40,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 2 &&
        phase.id === 'night' &&
        npc.location === 'inn' &&
        !npc.flags?.nise_casino_busy_today,
      effects: {},
      occupation: { kind: 'ordinary', label: '在旅店大厅听吟游诗人弹唱' }
    },
    {
      id: 'nise_secretary_shift',
      priority: 41,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 2 &&
        Boolean(npc.flags?.nise_casino_busy_today) &&
        !npc.flags?.nise_fled_casino &&
        ['morning', 'afternoon', 'night'].includes(phase.id) &&
        npc.location !== 'casino',
      effects: { move: 'casino' },
      occupation: { kind: 'ordinary', label: '全天留在金碧赌场内室充当私人秘书暂缓债息' }
    },
    {
      id: 'nise_dealer_shift',
      priority: 40,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 1 &&
        Boolean(npc.flags?.nise_casino_busy_today) &&
        !npc.flags?.nise_fled_casino &&
        ['morning', 'afternoon'].includes(phase.id) &&
        npc.location !== 'casino',
      effects: { move: 'casino' },
      occupation: { kind: 'ordinary', label: '白昼留在金碧赌场担任荷官抵偿今日债息' }
    },
    {
      id: 'nise_contract_stay',
      priority: 35,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        npc.stage >= 3 &&
        !npc.flags?.nise_fled_casino &&
        npc.location !== 'casino',
      effects: { move: 'casino' },
      occupation: { kind: 'ordinary', label: '签下卖身契长留地下赌场抵债' }
    },
    {
      id: 'aurora_weekend_church',
      priority: 27,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'aurora' &&
        npc.stage < 3 &&
        !npc.flags?.captured_manor &&
        weekdayOf(dayAt(world)) === 7 &&
        phase.id === 'afternoon' &&
        npc.location !== 'church',
      effects: { move: 'church' },
      occupation: { kind: 'ordinary', label: '周日午后前往圣辉大教堂祈祷照料孤儿' }
    },
    {
      id: 'aurora_weekend_return',
      priority: 29,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'aurora' &&
        Boolean(npc.flags?.manor_service_active) &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        isWeekendDay(dayAt(world)) &&
        npc.location === 'manor',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '周末离开领主山庄返回旅店归队' }
    },
    {
      id: 'aurora_manor_work',
      priority: 25,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.id === 'aurora' &&
        Boolean(npc.flags?.manor_service_active) &&
        !npc.flags?.aurora_left_manor &&
        (npc.stage >= 3 || !isWeekendDay(dayAt(world))) &&
        npc.location !== 'manor',
      effects: { move: 'manor' },
      occupation: { kind: 'ordinary', label: '前往领主山庄任职' }
    },
    {
      id: 'ed_inn_chores',
      priority: 20,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'ed' &&
        npc.monitored !== false &&
        !npc.flags?.ed_revealed &&
        !npc.flags?.ed_home_visiting &&
        (Boolean(world.flags?.ed_custody_active) || Boolean(world.flags?.ed_permanently_joined)) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        npc.location === 'inn',
      effects: {},
      occupation: { kind: 'ordinary', label: '在旅店跑腿打杂与擦拭桌椅' }
    },
    {
      id: 'return_inn',
      priority: 30,
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !['night', 'deep_night'].includes(phase.id)) return false
        if (npc.homeLocation !== 'inn' || npc.location === 'inn') return false
        if (isFugitiveSquadActive(world, npc)) return false
        if (npc.flags?.captured_orc || npc.flags?.isna_camp_distress || npc.flags?.isna_captured_ed || npc.flags?.captured_manor) return false
        if (npc.id === 'ed' && npc.flags?.ed_home_visiting) return false
        if (npc.id === 'gulan' && (npc.flags?.gulan_departed || npc.monitored === false)) return false
        if (npc.id === 'isna' && npc.flags?.isnaMudOutTonight) return false
        if (npc.id === 'nise' && (npc.stage >= 3 || (npc.stage === 2 && !npc.flags?.casino_debt_frozen && !npc.flags?.nise_fled_casino))) {
          return false
        }
        if (npc.id === 'aurora' && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor) {
          if (npc.stage >= 3 || !isWeekendDay(dayAt(world))) return false
          return npc.location !== 'manor'
        }
        return true
      },
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '夜间返回旅店休整' }
    },
    {
      id: 'return_church',
      priority: 30,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.homeLocation === 'church' &&
        npc.location !== 'church' &&
        !npc.flags?.captured_manor,
      effects: { move: 'church' },
      occupation: { kind: 'ordinary', label: '夜间返回修道院' }
    },
    {
      id: 'eileen_post_purge_return',
      priority: 32,
      when: ({ world, npc }) =>
        npc.id === 'eileen' &&
        Boolean(world.flags?.baron_purged) &&
        !npc.flags?.eileen_returned_capital &&
        !npc.flags?.eileen_captured &&
        npc.location !== 'manor',
      effects: { move: 'manor' },
      occupation: { kind: 'ordinary', label: '返驻奥克赫斯领主山庄善后' }
    },
    {
      id: 'aurora_post_purge_return',
      priority: 32,
      when: ({ world, npc }) =>
        npc.id === 'aurora' &&
        Boolean(world.flags?.baron_purged) &&
        (!npc.flags?.manor_service_active || Boolean(npc.flags?.aurora_left_manor)) &&
        npc.stage < 3 &&
        npc.location === 'manor',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '领主伏诛后返回旅店归队' }
    },
    {
      id: 'return_manor',
      priority: 30,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.homeLocation === 'manor' &&
        !isEileenFugitive(world) &&
        !npc.flags?.eileen_returned_capital &&
        npc.location !== 'manor',
      effects: { move: 'manor' },
      occupation: { kind: 'ordinary', label: '夜间返回领主山庄' }
    },
    {
      id: 'idle_rest',
      priority: 5,
      when: {},
      effects: {},
      occupation: { kind: 'ordinary', label: '歇息整备' }
    }
  ]

  const NODES = [
    {
      id: 'gulan_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: { stage: 0, metrics: { blood_density: { gte: 20 } } },
      text: '夜半调息时，{name}感到额角微烫、体内真血出现异样躁动；她以为只是连日奔波或此前激斗余波，神色沉凝地强自压下。'
    },
    {
      id: 'gulan_stage_2',
      mode: 'result',
      covert: true,
      fromStage: 1,
      toStage: 2,
      when: ({ npc }) => {
        if (npc.stage !== 1 || !npc.flags?.ed_hypnosis_play_done) return false
        const aff = npc.values.affection ?? 0
        const threshold = aff >= 90 ? 65 : aff >= 70 ? 50 : aff >= 40 ? 45 : 35
        return (npc.values.blood_density ?? 0) >= threshold
      },
      text: '昨夜防线失守的余悸未消，{name}清晨起得比往常更早，将黑底高领长裙的衣襟扣得严严实实，刻意避开了众人投来的目光。'
    },
    {
      id: 'gulan_stage_3',
      mode: 'result',
      covert: true,
      fromStage: 2,
      toStage: 3,
      when: ({ npc }) =>
        (npc.stage === 1 || npc.stage === 2) &&
        (npc.values.blood_density ?? 0) >= 80 &&
        Boolean(npc.flags?.gulan_final_fall_done),
      text: '{name}不再抗拒体内奔涌的古龙真血，赤色竖瞳沉冷而傲然，黑角尖端泛红，脸侧生出数片龙鳞。龙化形态已化作她自身的常态与本能。'
    },
    {
      id: 'aurora_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      covert: true,
      echoId: 'echo_aurora_manor_hush',
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        !npc.flags?.aurora_evt1_done &&
        npc.stage === 0 &&
        npc.location === 'manor' &&
        !isWeekendDay(dayAt(world)) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.values.debt_pressure ?? 0) > 0 &&
        (npc.flags?.manorWorkDays ?? 0) >= 3,
      effects: {
        add: { debt_pressure: -10 },
        npcFlags: { aurora_evt1_done: true },
        tagsAdd: ['tag_aurora_manor_hush']
      },
      text: '领主将{name}叫到书房，一边大肆隔着长裙抚摸裙下美臀，一边欣赏起她忍耐不敢反抗的瑟缩表情，嘴上却开口说：“奥萝拉小姐，你最近的表现很好，我正在考虑给你涨工资……”说到这里，他放肆的大手直接撩起女仆长裙，直接开始揉捏黑丝美臀，甚至将一根手指伸入了她的臀缝。{name}羞红了脸，却只能唯唯诺诺地点头称谢。'
    },
    {
      id: 'aurora_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      covert: true,
      echoId: 'echo_aurora_night_service',
      requires: ['aurora_stage_1'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !npc.flags?.manor_service_active || npc.flags?.aurora_left_manor || world.flags?.baron_purged) return false
        if (npc.flags?.aurora_evt2_done || npc.stage !== 1 || npc.location !== 'manor') return false
        if (isWeekendDay(dayAt(world)) || !['morning', 'afternoon'].includes(phase.id)) return false
        if ((npc.values.debt_pressure ?? 0) <= 0) return false
        if ((npc.values.affection ?? 0) >= 90 && !npc.flags?.aurora_evt2_delayed) return false
        const hasResignTag = (world.tags?.aurora || []).includes('tag_aurora_resign_determined')
        // 高好感宽限与决意辞职拒绝对潜规则各自延后 7 个工作日，可叠加至 21 天
        const baseDays = 7 + (npc.flags?.aurora_evt2_delayed ? 7 : 0) + (hasResignTag ? 7 : 0)
        const reqDays = baseDays - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return Boolean(npc.flags?.aurora_evt1_done) && (npc.flags?.manorWorkDays ?? 0) >= reqDays
      },
      effects: {
        add: { debt_pressure: -30 },
        npcFlags: { aurora_evt2_done: true },
        tagsAdd: ['tag_aurora_night_service'],
        tagsRemove: ['tag_aurora_manor_hush'],
        dossierAdd: [
          { npc: 'aurora', type: 'encounter', parts: ['vagina'], penetrative: true, internal: true, position: '书房长椅抬裙后入', volumeMl: 12 }
        ]
      },
      text: '在领主山庄高额加码封口费的步步相逼下，{name}最终没能推辞那笔足以还清三成旧债的私室夜侍重金。厚实橡木门隔绝了外间动静，事后她强忍屈辱收下钱袋，从此每逢工作日入夜便默认留在山庄侍寝，只在周末换回素净长裙勉强返店归队。'
    },
    {
      id: 'aurora_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      covert: true,
      echoId: 'echo_aurora_baron_mistress',
      requires: ['aurora_stage_2'],
      when: ({ world, npc, phase }) => {
        const reqDays = 21 - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return (
          Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
          Boolean(npc.flags?.aurora_evt2_done) &&
          !npc.flags?.aurora_evt3_done &&
          npc.stage === 2 &&
          npc.location === 'manor' &&
          !isWeekendDay(dayAt(world)) &&
          ['morning', 'afternoon'].includes(phase.id) &&
          (npc.values.debt_pressure ?? 0) > 0 &&
          (npc.flags?.manorWorkDays ?? 0) >= reqDays &&
          (npc.values.affection ?? 0) < 90
        )
      },
      effects: {
        add: { debt_pressure: -100 },
        npcFlags: { aurora_evt3_done: true },
        tagsAdd: ['tag_aurora_baron_mistress'],
        tagsRemove: ['tag_aurora_night_service'],
        dossierAdd: [
          { npc: 'aurora', type: 'encounter', parts: ['vagina'], penetrative: true, internal: true, position: '丝绒扶手椅正面坐跨', volumeMl: 15 }
        ]
      },
      text: '面对领主开出足以还清全部剩余家庭旧债的巨额封口重金与情妇契约，{name}轻叹着合上手中账册签下名字；她拿着这笔钱结清了外债，正式长留在领主山庄成为伯爵情妇，从此周末亦不再返回旅店。'
    },
    {
      id: 'eileen_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !isEileenFugitive(world) && !world.flags?.baron_purged) &&
        !npc.flags?.eileen_evt1_done &&
        npc.stage === 0 &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 1,
      effects: { npcFlags: { eileen_evt1_done: true } },
      text: '被秘密羁押入领主山庄地下禁室次日，{name}当面看着雷蒙德拿出自己那支早已被偷偷掉包的假魔能讯号管，又强行缴走细刺剑与王室诏令，原本坚信公文护身的傲气头一次裂开缺口。'
    },
    {
      id: 'eileen_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['eileen_stage_1'],
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !isEileenFugitive(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_evt1_done) &&
        !npc.flags?.eileen_evt2_done &&
        npc.stage === 1 &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 7,
      effects: { npcFlags: { eileen_evt2_done: true } },
      text: '幽禁满七日后，伯爵将假冒她笔迹的“沿途安好缓归”回执摆到案前；失去王都与外界全部援救希望的{name}在私室与日夜调教的磨折下防线渐崩，开始被迫配合山庄规训。'
    },
    {
      id: 'eileen_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['eileen_stage_2'],
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !isEileenFugitive(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_evt2_done) &&
        !npc.flags?.eileen_evt3_done &&
        npc.stage === 2 &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 21,
      effects: { npcFlags: { eileen_evt3_done: true } },
      text: '漫长囚禁至第二十一日，昔日骄傲的王都女巡查使{name}终于磨去了最后一线抗争执念，亲口放弃返都复命的打算，沉沦为领主山庄深处秘密圈养的专属禁脔。'
    },
    {
      id: 'nise_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      covert: true,
      echoId: 'echo_nise_casino_dealer',
      when: ({ world, npc, phase, blockedIds }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.nise_fled_casino &&
        !npc.flags?.nise_dealer_done &&
        !npc.activity &&
        !blockedIds?.has(npc.id) &&
        npc.stage === 0 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.values.gamble_debt ?? 0) >= 30,
      effects: {
        move: 'casino',
        npcFlags: { nise_dealer_done: true, nise_casino_busy_today: true }
      },
      text: '滚大的高利借条让{name}再无余地拖延，她独自溜进金碧赌场被黑巨汉胁迫换上露背束腰荷官装站台接客，借此恳求暂缓今日逼债（赌债未减，当日白昼将在赌场内占线，入夜换回常服返店隐瞒众人）。'
    },
    {
      id: 'nise_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      covert: true,
      echoId: 'echo_nise_casino_secretary',
      requires: ['nise_stage_1'],
      when: ({ world, npc, phase, blockedIds }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.nise_fled_casino &&
        Boolean(npc.flags?.nise_dealer_done) &&
        !npc.flags?.nise_secretary_done &&
        !npc.activity &&
        !blockedIds?.has(npc.id) &&
        npc.stage === 1 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.values.gamble_debt ?? 0) >= 60,
      effects: {
        move: 'casino',
        npcFlags: { nise_secretary_done: true, nise_casino_busy_today: true },
        dossierAdd: [
          { npc: 'nise', type: 'encounter', parts: ['vagina'], penetrative: true, internal: true, position: '长桌俯卧式', volumeMl: 12 }
        ]
      },
      text: '越滚越高的赌债将{name}逼入更深的筹码泥潭；黑巨汉以暂缓强收与不向家里告发为挟，把她唤入赌场二三层内室充当贴身私人秘书，在账房长桌前强行破处占有并整夜扣押，被迫以身抵债。'
    },
    {
      id: 'nise_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      covert: true,
      echoId: 'echo_nise_casino_contract',
      requires: ['nise_stage_2'],
      when: ({ world, npc, blockedIds }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !npc.flags?.nise_fled_casino &&
        Boolean(npc.flags?.nise_secretary_done) &&
        !npc.flags?.nise_contract_done &&
        !npc.activity &&
        !blockedIds?.has(npc.id) &&
        npc.stage === 2 &&
        (npc.values.gamble_debt ?? 0) >= 90,
      effects: {
        move: 'casino',
        npcFlags: { nise_contract_done: true, casino_debt_frozen: true, nise_casino_busy_today: false },
        dossierAdd: [
          { npc: 'nise', type: 'encounter', parts: ['vagina'], penetrative: true, internal: true, position: '石台跪坐后入', volumeMl: 15 }
        ]
      },
      text: '债务逼近尽头之际，走投无路的{name}在畏惧责罚与麻木屈服中于卖身契上按下了指印，从此不再回到断剑与麦酒旅店，长留地下赌场沦为黑老大掌控的专属抵债玩物。'
    },
    {
      id: 'cecilia_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 0 &&
        !npc.flags?.cecilia_evt1_done &&
        !npc.flags?.cecilia_quest_stage &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        ((npc.values.affection ?? 0) < 70 ||
          Boolean(npc.flags?.cecilia_manor_go_stage1) ||
          (npc.flags?.ceciliaAppealDays ?? 0) >= 2),
      effects: {
        add: { orphanage_funds: 30 },
        npcFlags: { cecilia_evt1_done: true, cecilia_manor_go_stage1: false, ceciliaAppealDays: 0 }
      },
      text: '孤儿院账面断绝之际，{name}为给孩子们换回口粮与药材，只得独自前往领主山庄恳求雷蒙德伯爵拨款。伯爵在书房趁机逼迫她忍受猥亵检身与含辱口舌讨好后才肯签下拨款单，{name}攥着新领回的三十份善款重返教堂，神情却多了一层难掩的晦暗（孤儿院资金 +30）。'
    },
    {
      id: 'cecilia_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['cecilia_stage_1'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 1 &&
        Boolean(npc.flags?.cecilia_evt1_done) &&
        !npc.flags?.cecilia_evt2_done &&
        !npc.flags?.cecilia_quest_stage &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        ((npc.values.affection ?? 0) < 80 ||
          Boolean(npc.flags?.cecilia_manor_go_stage2) ||
          (npc.flags?.ceciliaAppealDays ?? 0) >= 2),
      effects: {
        add: { orphanage_funds: 40 },
        npcFlags: { cecilia_evt2_done: true, cecilia_manor_go_stage2: false, ceciliaAppealDays: 0 }
      },
      text: '刚刚领回的资助再次见底，{name}不得不又一次硬着头皮踏进领主山庄求款。早已握住第一次把柄的雷蒙德这次不再满足于浅尝辄止，强迫她在内室褪下圣袍按在案台前失身成事，才换来新一笔四十份孤儿院经费（孤儿院资金 +40）。'
    },
    {
      id: 'cecilia_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['cecilia_stage_2'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 2 &&
        Boolean(npc.flags?.cecilia_evt2_done) &&
        !npc.flags?.cecilia_evt3_done &&
        !npc.flags?.cecilia_quest_stage &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        ((npc.values.affection ?? 0) < 90 ||
          Boolean(npc.flags?.cecilia_manor_go_stage3) ||
          (npc.flags?.ceciliaAppealDays ?? 0) >= 2),
      effects: {
        add: { orphanage_funds: 60 },
        npcFlags: { cecilia_evt3_done: true, cecilia_manor_go_stage3: false, ceciliaAppealDays: 0 }
      },
      text: '善款三度耗尽后，{name}再度来到领主山庄却已无力再守最后防线。伯爵以长期稳定包揽孤儿院六十份配额为交换，将这位曾经端庄自持的修女长正式收作暗中随叫随到的圣职情妇（孤儿院资金 +60）。'
    },
    {
      id: 'isna_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      echoId: 'echo_isna_camp_torture',
      when: ({ npc }) =>
        npc.stage === 0 &&
        Boolean(npc.flags?.captured_orc),
      effects: ({ world }) => ({
        tagsAdd: ['orc_blood_seal'],
        dossierAdd: [{
          npc: 'isna',
          at: world.timeMin,
          type: 'encounter',
          parts: ['vagina'],
          penetrative: true,
          internal: true,
          position: '被按在石台后入',
          volumeMl: 45
        }]
      }),
      text: '被黑兽人营地守军押入地牢当日，{name}便在拷问与粗暴轮番侵犯下丢失了处女之身并进入异兆期；天明前千夫长克罗格在她小腹隐蔽处刻下黑兽人血契印记，必须每三日接受兽人精液灌注方能压制，否则便会剧痛发作并显露魔纹。'
    },
    {
      id: 'isna_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['isna_stage_1'],
      when: ({ npc }) =>
        npc.stage === 1 &&
        Boolean(npc.flags?.captured_orc) &&
        (npc.flags?.orcCaptiveDays ?? 0) >= 1,
      effects: {
        move: 'inn',
        forceMove: true,
        tagsAdd: ['orc_spy_conflict'],
        npcFlags: {
          captured_orc: false,
          gold_desire_frozen: true,
          isnaMudDays: 0,
          isnaMudSpyCount: 0,
          isnaMudOutTonight: false,
          isnaMudProbeCount: 0,
          isnaMudFirstProbeDay: null,
          isnaMudTruthKnown: false,
          isnaMudTruthDay: null,
          isnaMudSealCleared: false,
          isna_mud_hopeless_fled: false
        }
      },
      text: '克罗格故意放走已被调教并种下血契的{name}返回断剑与麦酒旅店，并以“外人强行碰触血契便会爆裂伤身、何况失身之躯只会遭同伴嫌弃”死死封住她的口；{name}对外伪装成趁营地换防侥幸脱身并顺势接下“夜间踩点盯梢兽人”的差事，实则每三日潜回营地汇报情报并接受灌注。'
    },
    {
      id: 'isna_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['isna_stage_2'],
      echoId: 'echo_isna_fallen_pet',
      when: ({ npc }) =>
        npc.stage === 2 &&
        !npc.flags?.isnaMudSealCleared &&
        // 已坦白血契真相时留出第 10 天白天拔除窗口，拖过第 10 天仍未拔除才在第 11 天沉沦
        (npc.flags?.isnaMudDays ?? 0) >= (npc.flags?.isnaMudTruthKnown ? 11 : 10),
      effects: ({ world }) => ({
        move: 'wilds_camp',
        forceMove: true,
        tagsAdd: ['orc_fallen_pet'],
        tagsRemove: ['orc_spy_conflict'],
        npcFlags: {
          isna_fallen_orc: true,
          isnaMudOutTonight: false,
          isnaFallenDay: dayAt(world)
        },
        dossierAdd: [{
          npc: 'isna',
          at: world.timeMin,
          type: 'encounter',
          parts: ['vagina'],
          penetrative: true,
          internal: true,
          position: '跨坐千夫长腰间深顶',
          volumeMl: 80
        }]
      }),
      text: '泥足深陷满十日后，{name}心理防线全面瓦解，转入沉沦期并潜回黑兽人前哨据点，心甘情愿成为克罗格的宠物与内鬼，主动泄露城镇布防与古兰动向，借由连日“踩点”积累的信任着手发出假求救引古兰入套。'
    }
  ]

  const canPurgeIsnaSealCecilia = world => {
    const cecilia = world.npcs?.cecilia
    return Boolean(cecilia && cecilia.alive !== false && (cecilia.stage ?? 0) < 3 && !cecilia.flags?.captured_manor)
  }

  const canPurgeIsnaSealGulan = world => {
    const gulan = world.npcs?.gulan
    return Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3 && !gulan.flags?.captured_orc && !gulan.flags?.gulan_departed)
  }

  const auroraManorInsider = world => {
    const a = world.npcs?.aurora
    return Boolean(
      a &&
      a.alive !== false &&
      a.flags?.manor_service_active &&
      !a.flags?.aurora_left_manor &&
      a.stage < 3 &&
      (a.values?.affection ?? 0) >= 80
    )
  }

  const gulanSoloTrainingGrounds = ({ world, npc, phase }) =>
    Boolean(world.flags?.arrived_oakhaven) &&
    // 最早不早于第 15 天，若前传超过 4 天抵镇则按 arrivedDay + 11 动态顺延
    world.timeMin >= DAY(Math.max(15, arrivedDayOf(world) + 11), 6) &&
    phase.id === 'afternoon' &&
    npc.location === 'training_grounds' &&
    world.playerLocation !== 'training_grounds' &&
    !npc.flags?.gulan_evt1_done &&
    Object.values(world.npcs).every(
      other => other.id === npc.id || other.alive === false || other.location !== 'training_grounds'
    )

  const canResolveGulanRescue = ({ world, npc }) =>
    !world.flags?.ed_showdown_done && (npc.stage === 1 || npc.stage === 2) &&
    !npc.flags?.gulan_final_fall_done && (npc.flags?.gulan_rescue_count ?? 0) < 3

  const DRAGON_TRUE_FORM_SPEC = Object.freeze({
    // 1. 异象伏笔（供大势阶段二/三调用，零剧透）
    anomaly: '上位真龙气机律动、魔兽受源初威压惊惧外逃、同源龙血共鸣沸腾、荒山与峡谷受重压沉降。',

    // 2. 身世与动机因果（终局决算调用）
    lineage_origin: '存活数千年的太古古龙之王，视凡间伦理规条为微末妄念。数百年前与半龙人结合诞下古兰，因察觉古兰体内蕴藏着返祖纯正龙血，将其定为繁育下一代强悍上位龙裔的最优母体；以受庇护孤儿外壳潜伏队伍，旨在将小队作为戏台近距离观赏猎物在道义与血脉间的沉沦。',

    // 3. 信物真相（终局决算调用：解开开局随身短木的伏笔）
    relic_truth: '爱德平日随身攥着的那枚看似粗糙的木雕小剑，实为以自身逆鳞与真龙肋骨亲手炼制的【始祖古龙权杖】，无半点外泄魔力；一旦真身显化权杖激活，能直接干涉并强行共振龙血后裔的神经气血。',

    // 4. 外貌表征（终局决算调用）
    appearance: '漆黑翼展遮蔽天幕，周身覆着黑曜石般幽暗的暗金硬鳞，头生苍劲如断戟古木的龙角，太古逆鳞如重铁咬合，眼眸为金红熔岩般的太古竖瞳，呼出的龙息足以熔断钢铁。',

    // 5. 声音气度与言语指纹（终局决算调用）
    voice: '低沉幽邃带金属共振般的古老龙吟重音，语调漠然视常人为微尘与蝼蚁，称呼古兰为“我的好女儿”或“纯正血脉”。',

    // 6. 心智模式与致命死穴（终局决算调用：为好结局古兰逼退恶龙提供动机支撑）
    fatal_flaw_and_principles: '傲慢自负，热衷于猫鼠游戏的延迟戏谑，反感缺乏趣味的单纯蛮力碾压；以保全活体高纯度真血为第一考量，精于利害算计；视古兰为珍贵返祖活体母体，断不取残破死尸；见好就收，若猎物决意玉石俱焚或同源搏杀折损过大，绝不被无谓厮杀牵绊。'
  })

  function buildDragonRevealText(depth, resolutionText) {
    if (depth === 'anomaly') {
      return `【异象伏笔：${DRAGON_TRUE_FORM_SPEC.anomaly}】\n${resolutionText}`
    }
    if (depth === 'full' || depth === 'showdown' || depth === 'reveal') {
      return [
        '【幕后真身揭晓设定】',
        `・身世因果：${DRAGON_TRUE_FORM_SPEC.lineage_origin}`,
        `・信物真相：${DRAGON_TRUE_FORM_SPEC.relic_truth}`,
        `・外貌表征：${DRAGON_TRUE_FORM_SPEC.appearance}`,
        `・声音气度：${DRAGON_TRUE_FORM_SPEC.voice}`,
        `・死穴原则：${DRAGON_TRUE_FORM_SPEC.fatal_flaw_and_principles}`,
        `【本幕结局走向】\n${resolutionText}`
      ].join('\n')
    }
    return resolutionText
  }

  const canTriggerPassCollapse = world =>
    Boolean(world.flags?.arrived_oakhaven && world.flags?.ed_joined) &&
    !world.flags?.grand_tier_3 &&
    !world.flags?.ed_showdown_done &&
    (world.npcs?.ed?.values?.patience ?? 100) <= 25

  const PASS_COLLAPSE = '峡谷崖壁骤然滑落，断岩横截奥克赫斯连接外界的官道。往来的车马和信使都得等路面清开才能通行。'

  const EVENTS = [
    {
      id: 'dragon_blood_awakening_resist_low',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ctx => gulanSoloTrainingGrounds(ctx) && ctx.npc.stage < 2,
      text: [
        '午后演武场内，十余名亡命地痞觊觎{name}独处，借着下风处暗燃高价购得的黑市猎龙异香。{name}身为 V 阶宗师且兼具体魄，毒质难侵脏腑，仅在烈药冲刷下气血加速运转、面颊微现薄红。围逼宵小见状误以为药效得手，拔出短斧匕首叫嚣着扑上。',
        '{name}瞬息辨出此香乃专门围猎亚龙魔兽的特制炼金药，断定歹人暗中必伏有针对龙裔的捕兽机关或死士后手，决不可陷入缠斗；加之体内沸腾的龙血急需宣泄，她果断催动真血覆鳞，阔刃重剑出鞘横斩。',
        '宗师战气激荡如雷，精钢重剑坚固沉凝、劈坚折锐毫无卷刃，数息之间将来犯狂徒全部格杀于血泊之中。确认四下并无埋伏后，{name}退至武器架阴影处拭净剑刃血痕，反手击塌半边擂台木架以销毁战技痕迹，拢紧黑金长裙内衬的轻便软锁甲，沿偏僻暗巷从容隐匿撤离。'
      ].join('\n'),
      effects: ({ world }) => ({
        add: { blood_density: 10 },
        npcFlags: { gulan_evt1_done: true },
        worldFlags: {
          bloody_arena: true,
          bloodyArenaDay: dayAt(world),
          martial_law: true,
          panic: true
        }
      })
    },
    {
      id: 'dragon_blood_awakening_mud_guard',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ctx =>
        gulanSoloTrainingGrounds(ctx) &&
        ctx.npc.stage === 2 &&
        (ctx.npc.values.affection ?? 0) >= 90,
      text: [
        '演武场下风处燃起的猎龙异香，瞬间勾动了{name}体内先前已被暗中破开的深层躁热，使得她呼吸微乱、双颊泛起潮红。围拢上来的地痞误以为得手，持械蜂拥而上。',
        '然而念及对{{user}}的深厚羁绊与战士信念，加之察觉此药乃专门猎龙所用、警惕周遭伏有后手，{name}强行压下识海中翻涌的欲念，咬破舌尖提振神智，毅然强催龙血覆鳞。',
        '精钢阔刃重剑带起破空厉啸，宗师剑锋狂暴荡涤，数招间将来犯宵小全部斩杀于擂台周围。平息体内激荡的气血后，{name}退入阴影拭净佩剑，振臂震碎擂台围栏以掩盖龙血痕迹，迅速收剑离场归队。'
      ].join('\n'),
      effects: ({ world }) => ({
        add: { blood_density: 10 },
        npcFlags: { gulan_evt1_done: true },
        worldFlags: {
          bloody_arena: true,
          bloodyArenaDay: dayAt(world),
          martial_law: true,
          panic: true
        }
      })
    },
    {
      id: 'dragon_blood_awakening_mud_fall',
      mode: 'result',
      scope: 'npc',
      covert: true,
      echoId: 'echo_gulan_arena_fall',
      targets: ['gulan'],
      when: ctx =>
        gulanSoloTrainingGrounds(ctx) &&
        ctx.npc.stage === 2 &&
        (ctx.npc.values.affection ?? 0) < 90,
      text: '古兰演武场失守暗线已结算。',
      effects: {
        npcFlags: { gulan_evt1_done: true, gulan_arena_fall: true },
        tagsAdd: ['arena_shame_linger'],
        dossierAdd: [
          { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '兵器架按压', volumeMl: 10 },
          { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '后入式', volumeMl: 11 },
          { type: 'encounter', parts: ['hips', 'legs'], penetrative: true, internal: true, position: '抬腿深压', volumeMl: 12 }
        ]
      }
    },
    {
      id: 'dragon_blood_awakening_fallen',
      mode: 'result',
      scope: 'npc',
      covert: true,
      echoId: 'echo_gulan_arena_fallen',
      targets: ['gulan'],
      when: ctx => gulanSoloTrainingGrounds(ctx) && ctx.npc.stage >= 3,
      text: '古兰演武场沉沦反掠夺暗线已结算。',
      effects: {
        npcFlags: { gulan_evt1_done: true, gulan_arena_fall: true },
        tagsAdd: ['arena_sated_laziness'],
        dossierAdd: [
          { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '骑乘位', volumeMl: 15 },
          { type: 'encounter', parts: ['hips', 'legs'], penetrative: true, internal: true, position: '坐压榨取', volumeMl: 14 }
        ]
      }
    },
    {
      id: 'gulan_ed_hypnosis_play',
      mode: 'result',
      scope: 'npc',
      covert: true,
      echoId: 'echo_gulan_ed_hypnosis',
      targets: ['gulan'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined) return false
        const ed = world.npcs?.ed
        if (!ed || ed.monitored !== true || ed.alive === false) return false
        if (npc.stage !== 1 || npc.flags?.ed_hypnosis_play_done || npc.flags?.gulan_pure_bond_done || world.flags?.ed_showdown_done) return false
        if (!['night', 'deep_night'].includes(phase.id)) return false
        if (npc.location !== ed.location) return false
        if (world.flags?.playerRoomTarget === 'gulan') return false
        const aff = npc.values?.affection ?? 0
        if (aff >= 90 && Number.isFinite(world.flags?.lastGulanRoomMin) && world.timeMin - world.flags.lastGulanRoomMin < 2880) {
          return false
        }
        const threshold = aff >= 90 ? 65 : aff >= 70 ? 50 : aff >= 40 ? 45 : 35
        return (npc.values?.blood_density ?? 0) >= threshold
      },
      effects: {
        npcFlags: { ed_hypnosis_play_done: true },
        tagsAdd: ['abnormal_avoid'],
        dossierAdd: [
          { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '传教士式', volumeMl: 12 }
        ]
      },
      text: '古兰的夜间暗线已结算。'
    },
    {
      id: 'gulan_final_rescue_prompt',
      mode: 'interaction',
      scope: 'npc',
      repeatable: true,
      targets: ['gulan'],
      allowCancel: false,
      resolveWhen: canResolveGulanRescue,
      expireWhen: ctx => !canResolveGulanRescue(ctx),
      when: ({ world, npc, phase }) => {
        if (!canResolveGulanRescue({ world, npc })) return false;
        if (world.playerLocation !== 'inn' || npc.location !== 'inn') return false;
        if (!['night', 'deep_night'].includes(phase.id)) return false;
        if ((npc.values.affection ?? 0) < 90) return false;
        const threshold = 80 + 10 * (npc.flags?.gulan_rescue_count ?? 0);
        return (npc.values.blood_density ?? 0) >= threshold;
      },
      text: ({ npc }) => {
        const count = npc.flags?.gulan_rescue_count ?? 0;
        if (count === 0) {
          return '深夜的断剑与麦酒旅店万籁俱寂，{name}房内却传来重剑坠地的沉闷撞击与压抑的吐息。房门虚掩未落门闩，热浪从门缝间渗出。只见{name}单膝支地按住桌面，黑底长裙的领口已被热汗浸透，太阳穴两侧乌黑龙角的根部泛起暗红异热。她仍强撑着身为长辈与前卫战士的体面，嘴上只说是白日挥剑过量，可紧抓桌角微微发颤的指尖却出卖了体内翻腾的真血，目光躲闪却又隐隐期盼着门外的动静。';
        }
        if (count === 1) {
          return [
            '夜深时分，{name}房门缝隙间透出灼人的气流，屋内隐约传来压抑的低泣与被褥撕扯声。推门只见她蜷缩在床榻边缘，十指深陷入枕褥，冷汗浸透额前碎发，琥珀色竖瞳涣散迷离。太古龙血的梦魇低语正冲刷着她的理智，看到{{user}}靠近时，她下意识抬手想要将人推开，指尖刚触及衣袖却猛地反手死死攥住了衣襟，将人拉向自己。',
            '【演绎指导（不直接照搬进正文）】本轮核心演绎她在血脉激荡下的欲拒还迎：理智上因长辈身份与害怕伤及同伴而推拒，身体本能却渴望着{{user}}的贴近与安抚。'
          ].join('\n');
        }
        return '深夜客房内热浪滚滚，{name}体内始祖真血的繁殖欲望已然沸腾到顶点，单靠旁人言语安抚再难压制。她双颊泛着深浓酡红，乌黑龙角尖端暗红流转，呼吸急促而滚烫。面对{{user}}的到来，这位向来自立持重的武者不再遮掩眼神中的渴望，主动伸手拉近彼此的距离，吐息灼热地贴近耳畔——此刻她索求的不只是心灵上的慰藉与依赖，更有来自血脉深处对交合与身体的直接渴求。';
      },
      outcomes: {
        rescue: {
          when: ({ world, npc }) =>
            (npc.stage === 1 || npc.stage === 2) &&
            world.playerLocation === 'inn' &&
            npc.location === 'inn' &&
            (npc.values.affection ?? 0) >= 90 &&
            (npc.flags?.gulan_rescue_count ?? 0) < 3,
          text: ({ npc }) => {
            const count = npc.flags?.gulan_rescue_count ?? 0;
            if (count === 0) {
              return '在{{user}}的及时介入与安抚下，{name}发烫僵硬的身躯逐渐松弛下来。她偏过头避开视线，耳根悄然泛红，低声道了句无碍，总算将这波躁动的龙血强行压回体内，守住了防线。';
            }
            if (count === 1) {
              return '在{{user}}的贴身守护与温和回应下，{name}原本紧绷抗拒的力道一点点散去。她不再推拒这份靠近，额头抵住身前温暖的胸膛，在安稳的呼吸声中攥着衣襟沉沉睡去。';
            }
            return '在彼此交融的体温与深厚羁绊的回应下，{name}以坚毅意志为舟、以真挚情意为锚，终于将狂暴的始祖真血驯服为由自身掌控的纯净力量。热浪平息后，她依偎在侧轻喘，琥珀竖瞳澄明如初，真正迈入了与龙血共存的武圣之境。';
          },
          effects: ({ world, npc }) => {
            const count = npc.flags?.gulan_rescue_count ?? 0;
            if (count < 2) {
              return [
                { target: 'world', worldFlags: { lastGulanRoomMin: world.timeMin } },
                {
                  target: 'gulan',
                  add: { blood_density: -10, affection: 3 },
                  npcFlags: { gulan_rescue_count: count + 1, gulan_rescued_final: true }
                }
              ];
            }
            return [
              { target: 'world', worldFlags: { lastGulanRoomMin: world.timeMin } },
              {
                target: 'gulan',
                add: { affection: 3 },
                npcFlags: { gulan_rescue_count: 3, gulan_rescued_final: true, gulan_pure_bond_done: true }
              }
            ];
          }
        },
        fail: {
          echoId: ({ npc }) => (npc.stage === 1 && !npc.flags?.ed_hypnosis_play_done)
            ? 'echo_gulan_final_fall_virgin'
            : 'echo_gulan_final_fall',
          text: '门外久久未有回应，虚掩的木门在夜风中轻轻合拢，屋内压抑的喘息逐渐沉入死寂。次日清晨，{name}如常起身整装，神色沉稳自持，依旧以长辈与师长的口吻叮嘱日常起居，唯独眼神深处多了一丝若有若无的冰冷。',
          effects: {
            npcFlags: { gulan_final_fall_done: true },
            tagsAdd: ['dragon_mark_linger'],
            dossierAdd: [
              { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '侧卧交缠', volumeMl: 14 },
              { type: 'encounter', parts: ['hips', 'legs'], penetrative: true, internal: true, position: '后入式', volumeMl: 18 }
            ]
          }
        }
      }
    },
    {
      id: 'gulan_final_fall_dark',
      mode: 'result',
      scope: 'npc',
      covert: true,
      echoId: 'echo_gulan_final_fall',
      targets: ['gulan'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined) return false;
        const ed = world.npcs?.ed;
        if (!ed || ed.monitored !== true || ed.alive === false) return false;
        if (npc.stage !== 2 || npc.flags?.gulan_final_fall_done || npc.flags?.gulan_pure_bond_done || world.flags?.ed_showdown_done) return false;
        if (!['night', 'deep_night'].includes(phase.id)) return false;
        if (npc.location !== ed.location) return false;
        if (world.flags?.playerRoomTarget === 'gulan') return false;
        const rescueCount = npc.flags?.gulan_rescue_count ?? 0;
        if (rescueCount >= 3) return false;
        const aff = npc.values?.affection ?? 0;
        const bd = npc.values?.blood_density ?? 0;
        if (aff < 90) return bd >= 80;
        const threshold = 80 + 10 * rescueCount;
        return bd >= threshold && world.playerLocation !== npc.location;
      },
      text: '古兰的终局暗线已结算。',
      effects: {
        npcFlags: { gulan_final_fall_done: true },
        tagsAdd: ['dragon_mark_linger'],
        dossierAdd: [
          { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '侧卧交缠', volumeMl: 14 },
          { type: 'encounter', parts: ['hips', 'legs'], penetrative: true, internal: true, position: '后入式', volumeMl: 18 }
        ]
      }
    },
    {
      id: 'gulan_final_fall_virgin_dark',
      mode: 'result',
      scope: 'npc',
      covert: true,
      echoId: 'echo_gulan_final_fall_virgin',
      targets: ['gulan'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined) return false;
        const ed = world.npcs?.ed;
        if (!ed || ed.monitored !== true || ed.alive === false) return false;
        if (npc.stage !== 1 || npc.flags?.ed_hypnosis_play_done || npc.flags?.gulan_final_fall_done || npc.flags?.gulan_pure_bond_done || world.flags?.ed_showdown_done) return false;
        if (!['night', 'deep_night'].includes(phase.id)) return false;
        if (npc.location !== ed.location) return false;
        if (world.flags?.playerRoomTarget === 'gulan') return false;
        const rescueCount = npc.flags?.gulan_rescue_count ?? 0;
        if (rescueCount >= 3) return false;
        const aff = npc.values?.affection ?? 0;
        const bd = npc.values?.blood_density ?? 0;
        if (aff < 90) return bd >= 80;
        const threshold = 80 + 10 * rescueCount;
        return bd >= threshold && world.playerLocation !== npc.location;
      },
      text: '古兰一阶初夜失守终局暗线已结算。',
      effects: {
        npcFlags: { gulan_final_fall_done: true },
        tagsAdd: ['dragon_mark_linger'],
        dossierAdd: [
          { type: 'encounter', parts: ['chest', 'hips'], penetrative: true, internal: true, position: '压制破处', volumeMl: 14 },
          { type: 'encounter', parts: ['hips', 'legs'], penetrative: true, internal: true, position: '后入式', volumeMl: 18 }
        ]
      }
    },
    {
      id: 'isna_tavern_rumor_alone',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        !npc.flags?.isna_comforted_today &&
        world.playerLocation !== 'inn',
      text: '旅店酒馆里飘着烤肉与麦酒气味，邻桌雇佣兵高声议论着荒原悬赏与领主高薪。{name}摸了摸只剩碎肉干的口袋，猫尾甩得飞快，独自下定决心要找大活赚一笔。',
      effects: {
        add: { gold_desire: 15 },
        npcFlags: { isna_evt1_done: true }
      }
    },
    {
      id: 'isna_tavern_rumor_soothed',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        Boolean(npc.flags?.isna_comforted_today),
      text: '邻桌照样在吹嘘荒原大赏与山庄阔绰酬金，但{name}咬着你先一步分给她的热食，原本烦躁拍打木凳的猫尾逐渐安静下来。',
      effects: {
        add: { gold_desire: 5, affection: 2 },
        npcFlags: { isna_evt1_done: true }
      }
    },
    {
      id: 'isna_tavern_rumor_notice',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: false,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        !npc.flags?.isna_comforted_today &&
        world.playerLocation === 'inn',
      expireWhen: ({ npc }) =>
        npc.location !== 'inn' ||
        Boolean(npc.flags?.gold_desire_frozen || npc.flags?.captured_orc || npc.flags?.isna_camp_distress),
      text: '酒馆大堂里飘着烤肉香气，邻桌正在吹嘘荒原悬赏与领主府的三倍工钱。你注意到同在旅店的{name}正盯着空袋发呆、猫耳紧绷，似在盘算自己单干。',
      effects: { npcFlags: { isna_evt1_done: true } },
      outcomes: {
        soothe: {
          when: ({ world, npc }) => world.playerLocation === 'inn' && npc.location === 'inn',
          text: '有了同伴的分担与安抚，{name}垂下抖动的猫耳小声嘀咕两句，暂时按捺下了独自涉险的急躁念头。',
          effects: { add: { gold_desire: 5, affection: 2 } }
        },
        ignore: {
          text: '未见有人出声干预，{name}灌完杯底残酒，眼底多了几分独自接活赚快钱的跃跃欲试。',
          effects: { add: { gold_desire: 15 } }
        }
      }
    },
    {
      id: 'isna_alley_lockpick_alone',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 0 &&
        npc.location === 'town' &&
        ['night', 'deep_night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 50 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt2_done &&
        world.playerLocation !== 'town',
      text: '入夜后{name}在商业巷暗接一桩高酬开锁私活；顺利拿钱撤离时险些撞上巡卫，她撒出靴底烟幕骨粉惊险甩脱，分毫未损反而让自信越发膨胀。',
      effects: {
        add: { gold_desire: 15 },
        npcFlags: { isna_evt2_done: true, alley_confidence: true }
      }
    },
    {
      id: 'isna_alley_lockpick_spot',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: false,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 0 &&
        npc.location === 'town' &&
        ['night', 'deep_night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 50 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt2_done &&
        world.playerLocation === 'town',
      expireWhen: ({ npc }) =>
        npc.location !== 'town' ||
        Boolean(npc.flags?.gold_desire_frozen || npc.flags?.captured_orc || npc.flags?.isna_camp_distress),
      text: '商业巷拐角忽然炸开一团刺鼻骨粉烟幕，一道敏捷的猫耳身影翻过矮墙正欲抽身遁走，像刚干完私活的{name}。',
      effects: { npcFlags: { isna_evt2_done: true } },
      outcomes: {
        intercept: {
          when: ({ world, npc }) => world.playerLocation === 'town' && npc.location === 'town',
          text: '私活退路被当场截住，{name}心虚地夹紧猫尾低头认错，收敛了不少冒失念头。',
          effects: { add: { gold_desire: 5, affection: 4 } }
        },
        miss: {
          text: '烟幕散尽后巷内已空无一人，{name}顺利带着快钱脱身，越发笃信凭自己本事去哪都能来去自如。',
          effects: { add: { gold_desire: 15 }, npcFlags: { alley_confidence: true } }
        }
      }
    },
    {
      id: 'isna_pendant_exchange',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        npc.stage < 3 &&
        npc.alive !== false &&
        npc.monitored === true &&
        !npc.flags?.captured_orc &&
        !npc.flags?.token_exchanged &&
        (npc.values.affection ?? 0) >= 90 &&
        isAloneWith(world, npc, 'isna'),
      text: '四下无人时，{name}倚在身侧闲聊起幼年颠沛的旧事，平日总带着几分促狭笑意的猫耳罕见地放软下来。她从领口摘下一对镌刻微弱魔纹的旧吊坠，指尖微微发紧，将其中半枚推向你掌心前，目光藏着克制的试探与托付，静候你的回应。',
      outcomes: {
        accept_pendant: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: [
            { target: 'world', itemsAdd: [{ id: 'isna_pendant', count: 1 }] },
            { target: 'player', tagsAdd: ['bond_isna_90'] },
            { target: 'isna', npcFlags: { token_exchanged: true } }
          ],
          text: '你接过那枚尚带体温的半对吊坠妥善收好，{name}别过脸轻哼了一声，微微发烫的耳尖却藏不住心底的安定（获得【猫儿的牵挂】）。'
        },
        decline_pendant: {
          text: '你郑重婉拒了这份贵重的贴身旧物，{name}指尖微顿，随后笑着把吊坠重新挂回颈间，没有再勉强。'
        }
      }
    },
    {
      id: 'gulan_scale_bond',
      mode: 'interaction',
      scope: 'npc',
      targets: ['gulan'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        npc.stage < 3 &&
        npc.alive !== false &&
        npc.monitored === true &&
        !npc.flags?.gulan_departed &&
        !npc.flags?.captured_orc &&
        !npc.flags?.captured_manor &&
        !npc.flags?.gulan_scale_given &&
        (npc.values.affection ?? 0) >= 90 &&
        isAloneWith(world, npc, 'gulan'),
      text: '难得只有你们两人独处，{name}停下手中拭剑的动作，沉默片刻后解开高领扣环，指尖微一用力褪下一片温润如墨玉的颈侧逆鳞递到你面前。这位一向寡言的宗师长辈垂眸看着你，眼神里满是难言的关切与托付。',
      outcomes: {
        accept: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: [
            { target: 'world', itemsAdd: [{ id: 'gulan_reverse_scale', count: 1 }] },
            { target: 'player', tagsAdd: ['bond_gulan_90'] },
            { target: 'gulan', npcFlags: { gulan_scale_given: true } }
          ],
          text: '你郑重接过那片尚带体温的逆鳞贴身收好，{name}轻轻按了按你的肩头，低声叮嘱了句“莫要逞强”（获得【古兰的护佑】）。'
        },
        decline: {
          text: '你劝慰她留着护身，{name}微微颔首，将逆鳞暂且收起。'
        }
      }
    },
    {
      id: 'nise_arcane_bond',
      mode: 'interaction',
      scope: 'npc',
      targets: ['nise'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        npc.stage < 3 &&
        npc.alive !== false &&
        npc.monitored === true &&
        !npc.flags?.nise_notes_given &&
        (npc.values.affection ?? 0) >= 90 &&
        isAloneWith(world, npc, 'nise'),
      text: '趁着旁人不在，{name}抱着一本边角写满朱笔批注的厚实法术手札凑过来，把本子往你怀里一塞，嘴上却还别扭地扬着下巴：“拿去啦，笨蛋哥哥，连技能都记不全，看在我的面子上再多给你塞一个法术位！”',
      outcomes: {
        accept: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: [
            { target: 'world', itemsAdd: [{ id: 'nise_arcane_notes', count: 1 }] },
            { target: 'player', tagsAdd: ['bond_nise_90'] },
            { target: 'nise', npcFlags: { nise_notes_given: true } }
          ],
          text: '你翻开笔记看着里面细致到每一步魔力回路的口诀，忍不住笑着揉了揉她的发顶，{name}脸颊微红却仰起脸傲娇道：“天才法师妮丝大人罩着你~”（获得【天才法师的笔记】）。'
        },
        decline: {
          text: '你笑着表示眼下还用不上这么深奥的批注，{name}鼓着腮帮把本子抱了回去。'
        }
      }
    },
    {
      id: 'aurora_ring_bond',
      mode: 'interaction',
      scope: 'npc',
      targets: ['aurora'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        npc.stage < 3 &&
        npc.alive !== false &&
        npc.monitored === true &&
        !npc.flags?.aurora_ring_given &&
        (npc.values.affection ?? 0) >= 90 &&
        isAloneWith(world, npc, 'aurora'),
      text: '只剩你们两人的安静间隙里，{name}双颊微红地摊开掌心，里面静静躺着一枚刻着细微晨曦纹路、经过她反复祈福祝祷的银质指环。她轻声抬头望向你，语气温柔而坚定。',
      outcomes: {
        accept: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: [
            { target: 'world', itemsAdd: [{ id: 'aurora_blessed_ring', count: 1 }] },
            { target: 'player', tagsAdd: ['bond_aurora_90'] },
            { target: 'aurora', npcFlags: { aurora_ring_given: true } }
          ],
          text: '你小心接过指环戴在指间，{name}双手交叠在胸前，轻声为你祈祷：“愿你永安。”（获得【晨曦永安之誓】）。'
        },
        decline: {
          text: '你温言请她先收好这枚贵重的祈福银戒，{name}轻声应下，眼神依旧柔和。'
        }
      }
    },
    {
      id: 'isna_camp_ambush_pendant',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.wilds_camp_tried &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_fallen_labyrinth &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.captured_orc &&
        (npc.values.gold_desire ?? 0) >= 70 &&
        (npc.values.affection ?? 0) >= 90 &&
        Boolean(npc.flags?.token_exchanged),
      effects: [
        { target: 'world', itemsRemove: [{ id: 'isna_pendant', all: true }] },
        {
          target: 'isna',
          move: 'wilds_camp',
          forceMove: true,
          npcFlags: {
            wilds_camp_tried: true,
            gold_desire_frozen: true,
            isna_camp_distress: 'pendant',
            isna_help_real: true,
            isnaDistressDays: 0
          }
        }
      ],
      text: '独自潜往城外黑兽人前哨据点探财的{name}不慎撞入重兵包围圈，情急之下捏碎了贴身佩戴的成对吊坠！你随身佩戴的另一半吊坠随之裂响，瞬间传来她遇险受困于黑兽人前哨据点的紧急感应（须于次日完结前赶赴营救）。'
    },
    {
      id: 'isna_camp_ambush_rat',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.wilds_camp_tried &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_fallen_labyrinth &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.captured_orc &&
        (npc.values.gold_desire ?? 0) >= 70 &&
        (npc.values.affection ?? 0) >= 80 &&
        !((npc.values.affection ?? 0) >= 90 && Boolean(npc.flags?.token_exchanged)),
      effects: {
        move: 'wilds_camp',
        forceMove: true,
        npcFlags: {
          wilds_camp_tried: true,
          gold_desire_frozen: true,
          isna_camp_distress: 'rat',
          isna_help_real: false,
          isnaDistressDays: 0
        }
      },
      text: '独自潜赴城外黑兽人前哨据点寻财的{name}陷入守军围堵，被逼入废墟缝隙暂避；危急间她强忍惊慌，悄然放出随身驯养的灰鼠魔兽衔信赶回镇上报讯。'
    },
    {
      id: 'isna_camp_ambush_direct',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.wilds_camp_tried &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_fallen_labyrinth &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.captured_orc &&
        (npc.values.gold_desire ?? 0) >= 70 &&
        (npc.values.affection ?? 0) < 80,
      effects: {
        move: 'wilds_camp',
        forceMove: true,
        npcFlags: {
          wilds_camp_tried: true,
          gold_desire_frozen: true,
          captured_orc: true,
          orcCaptiveDays: 0
        }
      },
      text: '独自潜入城外黑兽人前哨据点谋财的{name}行迹败露，未能及时脱身也未向小队发出求援，当场遭黑兽人巡逻队合围擒获押入营地地牢。'
    },
    {
      id: 'isna_rat_signal_arrive',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ npc }) =>
        npc.flags?.isna_camp_distress === 'rat' &&
        !npc.flags?.isna_help_real &&
        !npc.flags?.captured_orc &&
        (npc.flags?.isnaDistressDays ?? 0) >= 1,
      effects: {
        npcFlags: { isna_help_real: true }
      },
      text: '浑身沾满荒原草屑的灰鼠魔兽终于衔着染血短笺窜回队伍落脚处——笺上潦草记着{name}被困黑兽人前哨据点的方位与求救记号（须在明日完结前携古兰赶赴营救）。'
    },
    {
      id: 'isna_distress_timeout_capture',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ npc }) => {
        const mode = npc.flags?.isna_camp_distress
        if (!mode || npc.flags?.captured_orc || npc.flags?.isna_fallen_orc || npc.flags?.isna_captured_ed) return false
        // 吊坠分支 T+1 完结前（跨 2 午夜）；灰鼠分支 T+2 完结前（跨 3 午夜）
        const limit = mode === 'pendant' ? 2 : 3
        return (npc.flags?.isnaDistressDays ?? 0) >= limit
      },
      effects: {
        npcFlags: {
          captured_orc: true,
          orcCaptiveDays: 0,
          isna_camp_distress: null,
          isna_help_real: false
        }
      },
      text: '迟迟未能等来援军，藏身处最终被黑兽人搜捕队撬开，{name}力竭被擒并押入前哨地牢深处。'
    },
    {
      id: 'isna_wilds_rescue_gulan_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_help_real) &&
          Boolean(npc.flags?.isna_camp_distress || npc.flags?.captured_orc) &&
          !npc.flags?.isna_fallen_orc &&
          !npc.flags?.isna_captured_ed &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) >= 3 && !gulan.flags?.gulan_departed)
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true } },
        {
          target: 'isna',
          npcFlags: {
            isna_captured_ed: true,
            captured_orc: false,
            isna_camp_distress: null,
            isna_help_real: false
          }
        }
      ],
      text: '截获{name}的求救信号后，早已接纳古龙真血常态龙化的古兰没有带上你，独自踏破城外黑兽人前哨据点并将守军悉数肃清；获救的{name}未能回到旅店，反而被古兰直接转交给了暗处的艾德掌控。'
    },
    {
      id: 'isna_wilds_rescue_gulan_solo',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_help_real) &&
          Boolean(npc.flags?.isna_camp_distress || npc.flags?.captured_orc) &&
          !npc.flags?.isna_fallen_orc &&
          !npc.flags?.isna_captured_ed &&
          Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) &&
          world.playerLocation !== 'inn' &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3 && gulan.location === 'inn')
      },
      effects: [
        { target: 'gulan', add: { blood_density: 10 } },
        {
          target: 'isna',
          move: 'inn',
          forceMove: true,
          add: { gold_desire: -30 },
          npcFlags: {
            captured_orc: false,
            isna_camp_distress: null,
            isna_help_real: false,
            gold_desire_frozen: false
          }
        }
      ],
      text: '灰鼠带回求救信时你正随反攻小队在外流亡，留在断剑与麦酒旅店的古兰见状立刻独自驰援黑兽人前哨据点；她激发龙血化正面击溃千夫长克罗格与守军（古兰血脉浓度 +10），将脱险的{name}护送回旅店休整。'
    },
    {
      id: 'isna_wilds_rescue_real',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_help_real) &&
          Boolean(npc.flags?.isna_camp_distress || npc.flags?.captured_orc) &&
          !npc.flags?.isna_fallen_orc &&
          !npc.flags?.isna_captured_ed &&
          !(Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) && world.playerLocation !== 'inn' && gulan?.location === 'inn') &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3)
      },
      expireWhen: ({ world, npc }) =>
        !npc.flags?.isna_help_real ||
        Boolean(npc.flags?.isna_fallen_orc || npc.flags?.isna_captured_ed) ||
        (!npc.flags?.isna_camp_distress && !npc.flags?.captured_orc) ||
        (world.npcs?.gulan?.stage ?? 0) >= 3,
      text: '确认了{name}受困于城外黑兽人前哨据点的求救方位后，古兰已提剑整装待发，正看着你决定是否即刻动身赶往荒原据点营救。',
      outcomes: {
        rescue_now: {
          when: ({ world }) => ['inn', 'town', 'wilds', 'wilds_camp'].includes(world.playerLocation),
          effects: [
            { target: 'gulan', add: { blood_density: 10, affection: 4 } },
            {
              target: 'isna',
              move: 'inn',
              forceMove: true,
              add: { gold_desire: -30, affection: 8 },
              npcFlags: {
                captured_orc: false,
                isna_camp_distress: null,
                isna_help_real: false,
                gold_desire_frozen: false
              }
            }
          ],
          text: '你随古兰星夜奔袭城外黑兽人前哨据点。面对千夫长克罗格与精锐守军合围，古兰果断开启龙血化速战速决（古兰血脉浓度 +10），成功撕开防线将{name}护送回断剑与麦酒旅店（伊丝娜金钱渴望 -30，好感度 +8）。'
        }
      }
    },
    {
      id: 'isna_mud_camp_report',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      covert: true,
      repeatable: true,
      echoId: 'echo_isna_mud_spy',
      when: ({ npc, phase }) => {
        if (npc.stage !== 2 || npc.flags?.captured_orc || npc.flags?.isna_fallen_orc || npc.flags?.isnaMudSealCleared) return false
        const mudDays = npc.flags?.isnaMudDays ?? 0
        const count = npc.flags?.isnaMudSpyCount ?? 0
        return npc.flags?.isnaMudOutTonight && phase.id === 'night' &&
          [3, 6, 9].includes(mudDays) && Math.floor(mudDays / 3) > count
      },
      effects: ({ world, npc }) => {
        const count = (npc.flags?.isnaMudSpyCount ?? 0) + 1
        const positions = ['悬空架腿后入', '兽皮榻跪趴轮换后入', '按压双膝深顶灌注']
        const volumes = [55, 65, 75]
        return {
          npcFlags: { isnaMudSpyCount: count, isnaMudLastReportDay: npc.flags.isnaMudDays },
          dossierAdd: [{
            npc: 'isna',
            at: world.timeMin,
            location: 'wilds_camp',
            type: 'encounter',
            parts: ['vagina'],
            penetrative: true,
            internal: true,
            position: positions[(count - 1) % positions.length],
            volumeMl: volumes[(count - 1) % volumes.length]
          }]
        }
      },
      text: '每隔三日夜幕降临时，{name}便强忍着小腹血契魔纹的灼痛借故离开旅店，潜回黑兽人营地向千夫长克罗格汇报城镇布防与队伍动向；虽然尚念旧情而心怀愧疚挣扎，身体却不得不在营帐中以更粗暴的轮换体位承接大量兽人精液灌注，借此压制魔纹直至次日清晨悄然返回。'
    },
    {
      id: 'isna_mud_probe',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      title: '探查·伊丝娜的异常',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        npc.stage === 2 &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudSealCleared &&
        !npc.flags?.isna_mud_hopeless_fled &&
        !npc.flags?.isnaMudOutTonight &&
        !npc.flags?.isnaMudTruthKnown &&
        (npc.flags?.isnaMudProbeCount ?? 0) === 0 &&
        (npc.flags?.isnaMudSpyCount ?? 0) >= 1 &&
        world.playerLocation === 'inn' &&
        npc.location === 'inn' &&
        (world.interactingIds || []).includes('isna'),
      expireWhen: ({ world, npc }) =>
        npc.stage !== 2 ||
        world.playerLocation !== 'inn' ||
        npc.location !== 'inn' ||
        Boolean(npc.flags?.isnaMudOutTonight || npc.flags?.isna_fallen_orc || npc.flags?.isnaMudSealCleared || npc.flags?.isna_mud_hopeless_fled || npc.flags?.isnaMudTruthKnown) ||
        (npc.flags?.isnaMudProbeCount ?? 0) > 0,
      text: '经历再次归巢受辱回到旅店后，你来到二层伊丝娜的房间拜访，却敏锐地察觉她神色格外紧绷、指尖冰凉发抖，衣襟下似有隐忍的战栗。',
      outcomes: {
        probe_confess: {
          when: ({ npc }) => (npc.values?.affection ?? 0) >= 75,
          effects: ({ npc }) => ({
            npcFlags: {
              isnaMudProbeCount: 1,
              isnaMudTruthKnown: true,
              isnaMudTruthDay: npc.flags?.isnaMudDays ?? 0
            }
          }),
          text: '刚刚经历过再次归巢受辱、又撞见你关切追问的{name}终于绷不住了；她抱着必死的决心扑进你怀里痛哭着吐露了全部真相，请求原谅自己当初自大导致失足、被种下血契又遭恐吓封口的窘境，同时颤声央求你不要嫌弃已被兽人玷污的她。'
        },
        probe_evade: {
          when: ({ npc }) => (npc.values?.affection ?? 0) < 75,
          effects: ({ npc }) => ({
            npcFlags: {
              isnaMudProbeCount: 1,
              isnaMudFirstProbeDay: npc.flags?.isnaMudDays ?? 0
            }
          }),
          text: '{name}耳尖一颤，神色慌乱地攥紧衣领遮遮掩掩地推辞，一口咬定只是连日奔波受了风寒，未敢吐露半句真相便糊弄着将你半推半就地赶出了房间。'
        }
      }
    },
    {
      id: 'isna_mud_probe_second',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      title: '深夜探查·伊丝娜的异常',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        npc.stage === 2 &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isnaMudSealCleared &&
        !npc.flags?.isna_mud_hopeless_fled &&
        !npc.flags?.isnaMudOutTonight &&
        !npc.flags?.isnaMudTruthKnown &&
        (npc.flags?.isnaMudProbeCount ?? 0) === 1 &&
        (npc.flags?.isnaMudLastReportDay ?? (npc.flags?.isnaMudSpyCount ?? 0) * 3) > (npc.flags?.isnaMudFirstProbeDay ?? 0) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'inn' &&
        npc.location === 'inn' &&
        (world.interactingIds || []).includes('isna'),
      expireWhen: ({ world, npc }) =>
        npc.stage !== 2 ||
        world.playerLocation !== 'inn' ||
        npc.location !== 'inn' ||
        Boolean(npc.flags?.isnaMudOutTonight || npc.flags?.isna_fallen_orc || npc.flags?.isnaMudSealCleared || npc.flags?.isna_mud_hopeless_fled || npc.flags?.isnaMudTruthKnown),
      text: '深夜再次造访伊丝娜房门外时，门缝里透出断续压抑的娇喘与布料摩挲声，空气中飘散着半兽人发情时特有的躁热气息。',
      outcomes: {
        probe_break_in: {
          when: ({ world, npc }) => world.playerLocation === 'inn' && npc.location === 'inn',
          effects: ({ npc }) => ({
            npcFlags: {
              isnaMudProbeCount: 2,
              isnaMudTruthKnown: true,
              isnaMudTruthDay: npc.flags?.isnaMudDays ?? 0
            }
          }),
          text: '你直接推门而入，正撞见床榻上小腹隐蔽处显现暗红印记的{name}——经过前番调教的身体本就属于半兽人血统，夜晚情潮难耐下正蜷缩在被褥间颤抖自慰渴求灌注。面对已然显现的印记她百口莫辩，只得哭着说出被迫潜回营地接受灌注的真相，央求你不要嫌弃已被兽人玷污的她。'
        }
      }
    },
    {
      id: 'isna_mud_purge_choice',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      title: '拔除·伊丝娜的兽人血契',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        npc.stage === 2 &&
        Boolean(npc.flags?.isnaMudTruthKnown) &&
        !npc.flags?.isnaMudSealCleared &&
        !npc.flags?.isna_mud_hopeless_fled &&
        !npc.flags?.isna_fallen_orc &&
        (npc.flags?.isnaMudDays ?? 0) > (npc.flags?.isnaMudTruthDay ?? 999) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (canPurgeIsnaSealCecilia(world) || canPurgeIsnaSealGulan(world)),
      expireWhen: ({ world, npc }) =>
        npc.stage !== 2 ||
        Boolean(npc.flags?.isnaMudSealCleared || npc.flags?.isna_mud_hopeless_fled || npc.flags?.isna_fallen_orc) ||
        (!canPurgeIsnaSealCecilia(world) && !canPurgeIsnaSealGulan(world)),
      text: '熬到次日白天，{name}惴惴不安地候在旅店等待你的决断。小腹上的血契印记虽暂时蛰伏，若再拖延到下一个三日期限便会再度爆发，必须尽快请可靠同伴出手拔除。',
      outcomes: {
        purge_cecilia: {
          when: ({ world }) => canPurgeIsnaSealCecilia(world),
          effects: [
            { target: 'cecilia', add: { affection: 2, orphanage_funds: -15 } },
            {
              target: 'isna',
              stage: 0,
              move: 'inn',
              forceMove: true,
              add: { gold_desire: -30, affection: 6 },
              tagsAdd: ['isna_orc_phobia'],
              tagsRemove: ['orc_blood_seal', 'orc_spy_conflict'],
              npcFlags: {
                isnaMudSealCleared: true,
                isnaMudOutTonight: false,
                gold_desire_frozen: false
              }
            }
          ],
          text: '你带着{name}前往教堂请塞西莉亚出手。塞西莉亚虽接下了请求，但执行驱除仪式需要耗费不少珍稀净礼材料，进一步加剧了教堂孤儿院资金的耗尽（孤儿院资金 -15）；圣洁神术持续洗涤掉她小腹隐蔽处的血契印记，{name}虚脱地伏在你肩头终于重回正线，却也对兽人留下了难以抹去的恐惧阴影。'
        },
        purge_gulan: {
          when: ({ world }) => canPurgeIsnaSealGulan(world),
          effects: [
            { target: 'gulan', add: { blood_density: 5, affection: 2 } },
            {
              target: 'isna',
              stage: 0,
              move: 'inn',
              forceMove: true,
              add: { gold_desire: -30, affection: 6 },
              tagsAdd: ['isna_orc_phobia'],
              tagsRemove: ['orc_blood_seal', 'orc_spy_conflict'],
              npcFlags: {
                isnaMudSealCleared: true,
                isnaMudOutTonight: false,
                gold_desire_frozen: false
              }
            }
          ],
          text: '你请出古兰替{name}压制印记。古兰不得不激活体内龙血以炽烈龙息贴合她小腹印记强行灼烧拔除，这番催动也导致古兰自身的血脉浓度小幅上升（古兰血脉浓度 +5）；痛苦退去后{name}终于脱离泥足重返正线，只是此后一闻兽人踪迹便会本能战栗回避。'
        }
      }
    },
    {
      id: 'isna_mud_hopeless_flee',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        npc.stage === 2 &&
        Boolean(npc.flags?.isnaMudTruthKnown) &&
        !npc.flags?.isnaMudSealCleared &&
        !npc.flags?.isna_mud_hopeless_fled &&
        !npc.flags?.isna_fallen_orc &&
        (npc.flags?.isnaMudDays ?? 0) > (npc.flags?.isnaMudTruthDay ?? 999) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !canPurgeIsnaSealCecilia(world) &&
        !canPurgeIsnaSealGulan(world),
      effects: {
        move: 'wilds',
        forceMove: true,
        npcFlags: {
          isna_mud_hopeless_fled: true,
          isnaMudOutTonight: false
        }
      },
      text: '次日白天，得知塞西莉亚与古兰均已自身难保无法出手拔除血契后，失去最后希望的{name}绝望地独自逃离了旅店，在绝望与体内的催情反噬中等待泥足期满。'
    },
    {
      id: 'wilds_rescue_trap_low',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 2 && !gulan.flags?.gulan_departed)
      },
      effects: [
        { target: 'gulan', add: { blood_density: 20 } },
        { target: 'isna', npcFlags: { isna_trap_fired: true } }
      ],
      text: '沦陷于兽人营地的{name}发出了绕过你、单向诱引古兰的假求救信号。古兰开启龙血化杀入营地却遭早已密谋好的{name}以反龙器具暗中偷袭，惊怒之下强行进一步催动血脉，拼死重伤突围脱身（古兰血脉浓度 +20）。'
    },
    {
      id: 'wilds_rescue_trap_mud_high',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) === 2 && !gulan.flags?.gulan_departed) &&
          (gulan.values?.affection ?? 0) >= 90
      },
      effects: [
        { target: 'gulan', move: 'inn', forceMove: true, add: { blood_density: 20 } },
        { target: 'isna', npcFlags: { isna_trap_fired: true } }
      ],
      text: '沦陷的{name}发出单向假求救将古兰诱入黑兽人前哨据点。泥足期的古兰激斗中遭{name}持针对性禁锢器具暗算；出于对你的深厚羁绊与意志坚守，强催血脉重创敌阵杀出重围，负伤撤回旅店休整（古兰血脉浓度 +20）。'
    },
    {
      id: 'wilds_rescue_trap_mud_low',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) === 2 && !gulan.flags?.gulan_departed) &&
          (gulan.values?.affection ?? 0) < 90
      },
      effects: ({ world }) => [
        { target: 'gulan', move: 'wilds_camp', forceMove: true, npcFlags: { captured_orc: true, gulan_departed: true } },
        { target: 'isna', npcFlags: { isna_trap_fired: true } },
        { target: 'world', worldFlags: { gulan_trap_captured_day: dayAt(world) } }
      ],
      text: '沦陷的{name}发出单向假求救将古兰诱入黑兽人前哨据点。处于泥足期的古兰激斗中遭{name}持针对性禁锢器具偷袭，在克制与围攻下力竭被擒，关押于据点深处。'
    },
    {
      id: 'gulan_rescue_player_rush_camp',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        return Boolean(gulan?.flags?.captured_orc) &&
          !world.flags?.orc_camp_destroyed &&
          world.playerLocation === 'wilds_camp'
      },
      effects: [
        { target: 'world', playerMove: 'wilds' }
      ],
      text: '你试图接近黑兽人前哨据点营救古兰，但作为见习冒险者连营地外围重重哨卡都无法突破，暗哨与巡逻栅栏密布，只得无功而返退回荒原；若执意硬闯，必定会被营地精锐围杀。'
    },
    {
      id: 'gulan_orc_camp_destroyed_resolve_with_note',
      priority: 15,
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        const day = Math.floor(world.timeMin / 1440) + 1
        const capturedDay = world.flags?.gulan_trap_captured_day ?? (gulan?.flags?.captured_orc ? day : 0)
        return Boolean(gulan?.flags?.captured_orc) &&
          Boolean(world.flags?.gulan_note_delivered) &&
          !world.flags?.gulan_escape_confessed &&
          day >= capturedDay + 2 &&
          (world.playerLocation === 'inn' || world.playerLocation === gulan?.location) &&
          !world.flags?.orc_camp_destroyed
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true, gulan_escape_confessed: true } },
        { target: 'isna', alive: false, npcFlags: { captured_orc: false, isna_fallen_orc: false } },
        {
          target: 'gulan',
          move: 'inn',
          forceMove: true,
          add: { blood_density: 20 },
          npcFlags: { captured_orc: false, gulan_departed: false }
        }
      ],
      text: '古兰负伤返回与你碰面。她向你自述：自己营救时被伊丝娜偷袭，导致力竭被俘获。当兽人想奸淫她时，只听见巨大的咆哮和震动，营帐外面乱声四起，自己所在的营帐也被巨大的火焰击中；她趁机挣脱了束缚，斩杀了被火焰重伤的兽人，突围而出。但是营地除了自己已无一活口……包括偷袭自己的伊丝娜。（古兰血脉浓度 +20）'
    },
    {
      id: 'gulan_orc_camp_destroyed_resolve_no_note',
      priority: 15,
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        const day = Math.floor(world.timeMin / 1440) + 1
        const capturedDay = world.flags?.gulan_trap_captured_day ?? (gulan?.flags?.captured_orc ? day : 0)
        return Boolean(gulan?.flags?.captured_orc) &&
          !world.flags?.gulan_note_delivered &&
          !world.flags?.gulan_escape_confessed &&
          day >= capturedDay + 2 &&
          (world.playerLocation === 'inn' || world.playerLocation === gulan?.location) &&
          !world.flags?.orc_camp_destroyed
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true, gulan_escape_confessed: true } },
        { target: 'isna', alive: false, npcFlags: { captured_orc: false, isna_fallen_orc: false } },
        {
          target: 'gulan',
          move: 'inn',
          forceMove: true,
          add: { blood_density: 20 },
          npcFlags: { captured_orc: false, gulan_departed: false }
        }
      ],
      text: '古兰负伤返回与你碰面。她心有余悸地开口：“营救前我留下了纸条，还好你没有乱来营救。”随后向你自述：自己营救时被伊丝娜偷袭，导致力竭被俘获。当兽人想奸淫她时，只听见巨大的咆哮和震动，营帐外面乱声四起，自己所在的营帐也被巨大的火焰击中；她趁机挣脱了束缚，斩杀了被火焰重伤的兽人，突围而出。但是营地除了自己已无一活口……包括偷袭自己的伊丝娜。（古兰血脉浓度 +20）'
    },
    {
      id: 'gulan_rescue_note_delivered',
      priority: 10,
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        const ed = world.npcs?.ed
        const day = Math.floor(world.timeMin / 1440) + 1
        const capturedDay = world.flags?.gulan_trap_captured_day ?? (gulan?.flags?.captured_orc ? day : 0)
        return Boolean(gulan?.flags?.captured_orc) &&
          !world.flags?.orc_camp_destroyed &&
          !world.flags?.gulan_note_delivered &&
          !world.flags?.gulan_escape_confessed &&
          world.playerLocation === 'inn' &&
          day > capturedDay &&
          Boolean(ed && ed.alive !== false)
      },
      effects: [
        { target: 'world', worldFlags: { gulan_note_delivered: true } }
      ],
      text: '随行学徒爱德拿来一张折叠的纸条交给你，说是古兰师傅昨天急匆匆离开前让他转交给你的。纸条上写着古兰收到伊丝娜的求救前去荒原救援，并特别写明：如果自己一天都没有回来，那么营地存在着小队现阶段难以抗衡的强敌，千万不要贸然前往救援。'
    },
    {
      id: 'wilds_rescue_trap_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) >= 3 && !gulan.flags?.gulan_departed)
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true } },
        { target: 'isna', npcFlags: { isna_trap_fired: true, isna_captured_ed: true, captured_orc: false } }
      ],
      text: '{name}以假求救诱引古兰赴营，但常态龙化的古兰面对反龙偷袭毫不动摇，反手横扫并覆灭整座黑兽人前哨据点，随即将{name}押回转交艾德掌控。'
    },
    {
      id: 'lord_hiring',
      priority: 10,
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        dayAt(world) >= arrivedDayOf(world) + 2 &&
        ['morning', 'afternoon'].includes(phase.id),
      text: '镇上告示牌贴出领主府的招募文书，称山庄正以三倍高薪招收手脚勤快、识字算账的长期女仆与差役。',
      effects: { worldFlags: { lord_hiring: true } }
    },
    {
      id: 'aurora_take_manor_job_weekday',
      priority: 5,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && world.flags?.lord_hiring && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_job_taken &&
        !npc.flags?.manor_service_active &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) > 0,
      effects: {
        move: 'manor',
        npcFlags: { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 0 }
      },
      text: '看见告示牌上高出平日三倍的佣金，{name}对着手中家书犹豫良久，低声向众人道了句想替家里和大家多攒些盘缠，随即离队前往领主山庄任职（仅周六、周日归队）。'
    },
    {
      id: 'aurora_take_manor_job_weekend',
      priority: 5,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && world.flags?.lord_hiring && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_job_taken &&
        !npc.flags?.manor_service_active &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) > 0,
      effects: {
        npcFlags: { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 0 }
      },
      text: '看见告示牌上三倍高薪的招募告示，{name}思索再三还是接下了山庄女仆差事；正逢周末休假，她先留在旅店陪伴众人，准备周一清晨再去领主山庄正式上工。'
    },
    {
      id: 'aurora_lord_punishment',
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor) &&
        npc.stage < 3 &&
        !npc.flags?.aurora_grey_rat_shield &&
        !npc.flags?.aurora_lord_punished &&
        npc.location === 'manor' &&
        !isWeekendDay(dayAt(world)) &&
        ['morning', 'afternoon'].includes(phase.id),
      effects: { npcFlags: { aurora_lord_punished: true } },
      text: '领主府追查起巡查使艾琳在冒险者掩护下逃走一事，雷蒙德伯爵迁怒到当初跑去公会发布任务的{name}头上并严加苛责施压（因未获灰鼠及时传信，事件二、三所需工作日各提前三天）。'
    },
    {
      id: 'aurora_manor_evt2_delay',
      priority: 8,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) => {
        const reqDays = 7 - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return (
          Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
          Boolean(npc.flags?.aurora_evt1_done) &&
          !npc.flags?.aurora_evt2_done &&
          !npc.flags?.aurora_evt2_delayed &&
          npc.stage === 1 &&
          npc.location === 'manor' &&
          !isWeekendDay(dayAt(world)) &&
          ['morning', 'afternoon'].includes(phase.id) &&
          (npc.values.debt_pressure ?? 0) > 0 &&
          (npc.flags?.manorWorkDays ?? 0) >= reqDays &&
          (npc.values.affection ?? 0) >= 90
        )
      },
      effects: {
        npcFlags: { aurora_evt2_delayed: true }
      },
      text: '雷蒙德伯爵捧着足够再抵三成旧债的重金提出夜宿特侍要求；念及与你确立的恋人情分，{name}眼眶微红却咬紧牙关推辞了当晚留宿，领主暗忖她仍欠巨债，姑且宽限七个工作日再作答复。'
    },
    {
      id: 'aurora_manor_evt3_refuse',
      priority: 8,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) => {
        const reqDays = 21 - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return (
          Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
          Boolean(npc.flags?.aurora_evt2_done) &&
          !npc.flags?.aurora_evt3_done &&
          npc.stage === 2 &&
          npc.location === 'manor' &&
          !isWeekendDay(dayAt(world)) &&
          ['morning', 'afternoon'].includes(phase.id) &&
          (npc.values.debt_pressure ?? 0) > 0 &&
          (npc.flags?.manorWorkDays ?? 0) >= reqDays &&
          (npc.values.affection ?? 0) >= 90
        )
      },
      effects: {
        move: 'inn',
        npcFlags: { manor_service_active: false, aurora_left_manor: true, aurora_evt3_done: true }
      },
      text: '雷蒙德领主摊出附带巨额封口金币、足够她一次还清全部剩余旧债的长期情妇契约。{name}望着面前金币，想起始终在等待她的你，终于轻声却坚定地摇了头——宁可留着余债慢慢偿还，也决不留在宅邸充当情妇，当天便交回钥匙辞工赶回旅店归队。'
    },
    {
      id: 'aurora_debt_cleared_quit',
      priority: 9,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ npc }) =>
        Boolean(npc.flags?.manor_service_active) &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) <= 0,
      effects: {
        move: 'inn',
        npcFlags: { manor_service_active: false, aurora_left_manor: true }
      },
      text: '压在心头的千金旧债终于已全部结清，{name}递交辞呈正式辞去领主山庄差事，神情松快地收拾行囊返回断剑与麦酒旅店归队。'
    },
    {
      id: 'aurora_debt_disclose',
      priority: 4,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !npc.flags?.aurora_debt_disclosed &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) > 0 &&
        (npc.values.affection ?? 0) >= 80 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_debt_disclosed: true }
      },
      text: '四下无外人打扰时，{name}攥着记账小皮册低着头终于向你吐露了家族欠下足足千金旧债的实情；这一次她没有再一个人强撑推辞，红着脸轻声点头愿意接受你的帮助。'
    },
    {
      id: 'aurora_manor_unease',
      priority: 3,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_manor_unease_told &&
        npc.stage === 0 &&
        (npc.values.affection ?? 0) >= 90 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_manor_unease_told: true }
      },
      text: '周末归队重逢时，{name}依赖地挨在你身边低声提起，说山庄二楼私室气氛总有些沉闷，领主大人的打量眼神也教人发憷。'
    },
    {
      id: 'aurora_manor_confess',
      priority: 4,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_manor_confessed &&
        npc.stage === 2 &&
        (npc.values.affection ?? 0) >= 90 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_manor_confessed: true }
      },
      text: '周末归队独处无外人时，{name}终于再也撑不住平时的微笑面具，低声抽泣着把领主府二楼的真相告诉了你——之前抵掉旧债的钱并不是正经工钱，而是伯爵给的封口费与留宿私密要求，她攥紧你的衣袖请求帮助。'
    },
    {
      id: 'aurora_resign_talk',
      priority: 7,
      mode: 'interaction',
      scope: 'npc',
      targets: ['aurora'],
      title: '辞职',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        npc.stage < 2 &&
        (npc.values.affection ?? 0) >= 90 &&
        !npc.flags?.aurora_resign_talked &&
        isWeekendDay(dayAt(world)) &&
        isAloneWithAurora(world, npc),
      expireWhen: ({ world, npc }) =>
        !npc.flags?.manor_service_active ||
        Boolean(npc.flags?.aurora_left_manor || world.flags?.baron_purged || npc.flags?.aurora_resign_talked) ||
        npc.stage >= 2 ||
        !isWeekendDay(dayAt(world)) ||
        !isAloneWithAurora(world, npc),
      text: '{{user}}独自找到{name}时，她低着头攥紧裙角终于哭诉起山庄近况——这些天领主变本加厉地对她进行没有破处的性骚扰，粗糙的大手不止一次直接触及她的美臀、奶子与大腿；她浑身微颤，害怕哪一天领主会将她的贞洁也夺走，随即红着脸扭扭捏捏地躲开{{user}}的视线说：“那、那是要留给我喜欢的人的。”说完后她沉默了一会儿，“我想申请辞职，你会支持我吗？可契约里早就下了陷阱，必须工作满六个月，提前离职需要支付 500 金币的违约金……在这片领地上他就是法律，契约也是我亲笔签字的，我怕那个老肥猪可能不会那么轻易答应……”',
      outcomes: {
        support_resign: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: {
            tagsAdd: ['tag_aurora_resign_determined'],
            npcFlags: { aurora_resign_talked: true }
          },
          text: '{{user}}握住{name}发凉的指尖明确表示支持她辞职。听见承诺的{name}眼眶微热地用力点头，下定决心不再任由领主一步步得寸进尺（获得标签【决意辞职】）；虽被六个月与五百金币的苛刻违约金暂时锁住、不得不先强忍回去上班，她已打定主意拒绝一切留宿要求，盼着你陪同前往山庄与伯爵交涉，或等待彻底脱身的转机。'
        }
      }
    },
    {
      id: 'aurora_manor_resign_negotiate',
      priority: 7,
      mode: 'interaction',
      scope: 'npc',
      targets: ['aurora'],
      title: '陪同山庄辞职交涉',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        npc.stage < 2 &&
        (world.tags?.aurora || []).includes('tag_aurora_resign_determined') &&
        !npc.flags?.aurora_resign_failed &&
        !isWeekendDay(dayAt(world)) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation === 'manor' &&
        npc.location === 'manor',
      expireWhen: ({ world, npc, phase }) =>
        !npc.flags?.manor_service_active ||
        Boolean(npc.flags?.aurora_left_manor || world.flags?.baron_purged || npc.flags?.aurora_resign_failed) ||
        npc.stage >= 2 ||
        isWeekendDay(dayAt(world)) ||
        !['morning', 'afternoon'].includes(phase.id) ||
        world.playerLocation !== 'manor' ||
        npc.location !== 'manor',
      text: '你陪同{name}来到领主山庄前厅递交辞呈。雷蒙德领主眯起眼打量着身旁的来人，指节敲击着那份签有五百金币违约金的劳务契约，神色正随着陪同阵仗悄然变换。',
      outcomes: {
        negotiate_master: {
          when: ({ world }) => presentMasterExists(world) && (world.playerState?.gold ?? 0) >= 200,
          effects: [
            { target: 'world', goldDelta: -200 },
            {
              target: 'aurora',
              move: 'inn',
              forceMove: true,
              tagsAdd: ['tag_lord_grudge'],
              tagsRemove: ['tag_aurora_resign_determined'],
              npcFlags: { manor_service_active: false, aurora_left_manor: true }
            }
          ],
          text: '雷蒙德领主瞥见陪同前来的宗师阶强者气度沉凝，心知犯不上为了一个女仆与宗师撕破脸；他立刻换上一副客客气气、和颜悦色的笑脸当场批准了{name}的辞职，还顺带“慷慨”减免了大半违约金，只象征性收下两百金币便放人离去（持有金币 -200，获得标签【领主的记恨】，{name}脱身返回旅店归队）。'
        },
        negotiate_blocked: {
          when: ({ world }) => !presentMasterExists(world),
          effects: [
            { target: 'world', playerMove: 'town' },
            { target: 'aurora', npcFlags: { aurora_resign_failed: true } }
          ],
          text: '见陪同前来的队伍中并无宗师阶强者镇场，雷蒙德领主当即撕下笑脸，趾高气昂地驳回辞呈，随口编造“{name}手头尚有重要账务与内务未曾交割完毕、暂时不得离职”的子虚乌有理由，旋即挥手召来全员三阶精锐的私兵卫队将你强行轰出庄园，把{name}硬生生扣留在山庄继续当差。'
        }
      }
    },
    {
      // TODO: 占位事件，后续可能修改或扩展细节
      id: 'aurora_shared_debt_vow',
      priority: 3,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.aurora_left_manor && !npc.flags?.aurora_purged_with_baron) &&
        !npc.flags?.aurora_shared_debt_vow_done &&
        (npc.values.affection ?? 0) >= 90 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_shared_debt_vow_done: true }
      },
      text: '【占位提醒】脱离领主山庄归队后，{{user}}与{name}并肩坐在一起核对剩余的家庭旧债账册；纵使前路仍有千金债务重压，{{user}}仍决意与{name}共同面对接下来的债务与未来。'
    },
    {
      id: 'eileen_arrive',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.eileen_arrived &&
        !world.flags?.baron_purged &&
        dayAt(world) >= 15 &&
        ['morning', 'afternoon', 'night'].includes(phase.id),
      effects: [
        { target: 'world', worldFlags: { eileen_arrived: true } },
        { target: 'eileen', monitored: true, move: 'manor', npcFlags: { eileenInspectDays: 0 } }
      ],
      text: '镇门号角吹响，一队王都仪仗车马沿官道上山入驻领主山庄——王国特派三等巡查使艾琳·冯·兰开斯特奉命前来审计边疆账务；高傲的名门千金眼下只按公文程序接受雷蒙德伯爵宴待，不与镇上见习冒险者往来。'
    },
    {
      id: 'aurora_eileen_arrive_tip',
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_arrived && !world.flags?.eileen_departed && !world.flags?.baron_purged) &&
        auroraManorInsider(world) &&
        !npc.flags?.aurora_told_eileen_arrival &&
        world.playerLocation === 'inn' &&
        npc.location === 'inn',
      effects: { npcFlags: { aurora_told_eileen_arrival: true } },
      text: '趁夜里回旅店歇脚时，{name}轻声向你提起山庄近况：近日刚来了一位王都派下来的女巡查使，是个衣着华贵、神情高傲的千金大小姐，正由伯爵亲自安排在客套房款待。'
    },
    {
      id: 'eileen_escort_offer',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: false,
      when: ({ world, npc, phase }) => eileenEscortOpen(world, npc) && isDaytime(phase) &&
        (auroraManorInsider(world) || world.playerLocation === 'town'),
      resolveWhen: ({ world, npc, phase }) =>
        eileenEscortOpen(world, npc) && isDaytime(phase) && world.playerLocation === 'town',
      expireWhen: ({ world, npc }) => !eileenEscortOpen(world, npc),
      text: ({ world }) => auroraManorInsider(world)
        ? '王都特使{name}完成奥克赫斯城巡查并向王都发出返程报信函件。离开前她嘱咐侍女奥萝拉去城内冒险者公会挂出一份报酬优渥的密封护送任务，念着与你的交情，奥萝拉优先赶来私下把这份委托悄悄递到你手边。'
        : '王都特使{name}完成奥克赫斯城巡查并向王都发出返程报信函件。离开前她派人前往城内冒险者公会分会，在告示板上挂出了一份报酬优渥的密封护送任务，正逢你在城内街区经过。',
      outcomes: {
        accept: {
          effects: [
            { target: 'world', playerMove: 'wilds', worldFlags: { eileen_departed: true, eileen_fugitive: true } },
            { target: 'eileen', add: { affection: 30 }, npcFlags: { eileen_fugitive: true, eileen_disguised: true } }
          ],
          text: '出城半途突遭掩盖身份的领主私兵合围截杀！古兰因不干涉公会常规护送未曾同行，同行雇佣卫士死战断后；队伍趁乱杀出重围遁入荒原，{name}急忙掏出暗袋里的王室魔能讯号管求救，却愕然发现管体早被伯爵偷换为不能激发的赝品。'
        },
        decline: {
          effects: [
            { target: 'world', worldFlags: { eileen_departed: true } },
            { target: 'eileen', npcFlags: { eileen_captured: true, eileenCaptiveDays: 0 } }
          ],
          text: '护送委托未获接下。{name}随少量随从自行出城半程后遭掩盖身份的领主私兵突袭围捕，捏碎暗袋中早被掉包的伪造讯号管求助无门，连人被暗中押回山庄密室秘囚；因事先已发回都信函，外界竟无一人察觉异常。'
        }
      }
    },
    {
      id: 'eileen_depart_dark_unassisted',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_arrived && !world.flags?.eileen_departed && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        // 城内公会护送委托悬挂 3 个完整昼日（第 6、7、8 天），第 9 天仍未接单才独自起程被伏击
        (npc.flags?.eileenInspectDays ?? 0) >= 9,
      effects: [
        { target: 'world', worldFlags: { eileen_departed: true } },
        { target: 'eileen', npcFlags: { eileen_captured: true, eileenCaptiveDays: 0 } }
      ],
      text: '{name}结束城内巡查并向王都寄出“已完检启程回都”公文后，因未能等来合适护送小队而独自起程，却在出城半道遭到掩盖徽记的领主私兵伏击！她在混乱中欲催动王室魔能讯号管，竟发现已被暗中掉包，最终寡不敌众遭擒回伯爵山庄秘室幽禁。'
    },
    {
      id: 'eileen_escape_move_wilds',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) &&
        !npc.flags?.eileen_fugitive_moved,
      effects: { npcFlags: { eileen_fugitive_moved: true, eileen_disguised: true } },
      text: '甩脱领主私兵第一轮合围追截后，{name}随即取兜帽披风默认乔装遮面、收敛王徽与细剑，自此无论宿野入镇都与你全程同步进退。'
    },
    {
      id: 'eileen_ambush_isna_aid',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.eileen_ambush_closed && !world.flags?.baron_purged) &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_labyrinth &&
        npc.stage < 3 &&
        npc.location !== 'wilds_camp' &&
        npc.activity?.releaseRule !== 'manualRelease' &&
        !world.npcs?.eileen?.flags?.eileen_isna_counted,
      effects: [
        { target: 'eileen', add: { counterattack: 10 }, npcFlags: { eileen_isna_counted: true } },
        { target: 'aurora', npcFlags: { aurora_grey_rat_shield: true } },
        { target: 'isna', npcFlags: { eileen_isna_helped: true } }
      ],
      text: '护送突围中在队的{name}凭老练盗贼耳目摸清领主山庄潜入路线，奠定偷取魔能管把握（艾琳反攻值 +10）；临撤入荒原前她又放出通灵灰鼠潜入山庄暗报奥萝拉提早防备，替她摘清了发单迁怒的隐患。'
    },
    {
      id: 'eileen_ambush_nise_aid_high',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.eileen_ambush_closed && !world.flags?.baron_purged) &&
        npc.stage < 3 &&
        !npc.flags?.nise_fled_casino &&
        npc.activity?.releaseRule !== 'manualRelease' &&
        (npc.values.affection ?? 0) >= 80 &&
        !world.npcs?.eileen?.flags?.eileen_nise_counted,
      effects: [
        { target: 'eileen', add: { counterattack: 10 }, npcFlags: { eileen_nise_counted: true } },
        { target: 'nise', npcFlags: { eileen_nise_helped: true, nise_casino_busy_today: false } }
      ],
      text: '念及与哥哥同甘共苦的羁绊，高好感的{name}果断搁下镇上杂务直接入队同行；她沿途动用法术感应测算出山庄暗哨与魔能封印节点（艾琳反攻值 +10），为后续潜回反攻攒足先手情报。'
    },
    {
      id: 'eileen_ambush_nise_aid',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.eileen_ambush_closed && !world.flags?.baron_purged) &&
        npc.stage < 3 &&
        !npc.flags?.nise_fled_casino &&
        (npc.values.affection ?? 0) < 80 &&
        npc.activity?.releaseRule !== 'manualRelease' &&
        !npc.flags?.nise_casino_busy_today &&
        !world.npcs?.eileen?.flags?.eileen_nise_counted,
      effects: [
        { target: 'eileen', add: { counterattack: 10 }, npcFlags: { eileen_nise_counted: true } },
        { target: 'nise', npcFlags: { eileen_nise_helped: true } }
      ],
      text: '同在护送小队中的{name}沿途动用法术感应测算出山庄暗哨与魔能封印节点（艾琳反攻值 +10），为后续潜回反攻攒足先手情报。'
    },
    {
      id: 'eileen_ambush_isna_move_wilds',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_isna_helped) &&
        !npc.flags?.eileen_isna_moved,
      effects: { npcFlags: { eileen_isna_moved: true } },
      text: '护送突围后，同行在队的{name}随你一并退避至城外荒原潜行汇合；反攻期间她将全程随你同进同退、位置同步锁定，原日常挣钱行动与金欲涨落暂行搁置。'
    },
    {
      id: 'eileen_ambush_nise_move_wilds',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_nise_helped) &&
        !npc.flags?.eileen_nise_moved,
      effects: { npcFlags: { eileen_nise_moved: true } },
      text: '护送突围后，同行的{name}也已随你退往荒原暂避追兵；反攻期间她将全程随你同进同退、位置同步锁定，不会再独自去镇上闲逛、偷赌或脱队。'
    },
    {
      id: 'eileen_ambush_window_close',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => Boolean(isEileenFugitive(world) && !world.flags?.eileen_ambush_closed),
      effects: { worldFlags: { eileen_ambush_closed: true } },
      text: '雷蒙德领主得知艾琳在半路突围失踪，随即将四门封锁并派出大队私兵入野搜捕；古兰确认伯里尚无性命之虞按规矩留守镇上不掺和纷争。'
    },
    {
      id: 'eileen_manor_trespass_alarm',
      mode: 'result',
      repeatable: true,
      scope: 'world',
      when: ({ world }) =>
        Boolean(isEileenFugitive(world) && !hasEileenSignal(world) && !world.flags?.baron_purged) &&
        world.playerLocation === 'manor' &&
        (world.npcs?.eileen?.values?.counterattack ?? 0) < 100,
      effects: [
        { target: 'world', playerMove: 'wilds' },
        { target: 'eileen', add: { counterattack: -5 } }
      ],
      text: '反攻筹备尚未周全便携着通缉中的艾琳贸然踏入伯爵山庄，立刻惊动了府外巡值的精锐私兵与宗师供奉眼线；二人只得趁夜色未合围前仓皇撤回城外荒原（艾琳反攻值 -5）。'
    },
    {
      id: 'eileen_curfew_evict',
      mode: 'result',
      repeatable: true,
      scope: 'world',
      when: ({ world, phase }) =>
        Boolean(isEileenFugitive(world) && !hasEileenSignal(world) && !world.flags?.baron_purged) &&
        ['town', 'inn'].includes(world.playerLocation) &&
        ['night', 'deep_night'].includes(phase.id),
      effects: [
        { target: 'world', playerMove: 'wilds' },
        { target: 'eileen', add: { counterattack: -5 } }
      ],
      text: '入夜后奥克赫斯城四门落锁、全城实行宵禁盘查；虽有兜帽遮面，城防暗哨仍沿街旅店与巷道逐户搜检，你们不敢久留只能摸黑翻出城外退回荒野营地（艾琳反攻值 -5）。'
    },
    {
      id: 'eileen_wilds_hunt',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(isEileenFugitive(world) && !hasEileenSignal(world) && !world.flags?.baron_purged) &&
        world.playerLocation === 'wilds' &&
        ['morning', 'afternoon', 'evening'].includes(phase.id) &&
        (npc.flags?.eileenFugitiveDays ?? 0) >= 2 &&
        !npc.flags?.eileen_wilds_hunt_done,
      text: '下风向忽然传来急促犬吠与甲叶摩擦声——雷蒙德伯爵派出的山林私兵与猎犬正顺着荒野林缘包抄过来。{name}迅速拉紧兜帽遮面，指节按住藏在披风下的细剑剑柄，原本打算由她向反方向佯动引开追兵，却因左肩旧伤渗血动作一滞，只能压低声音向你确认如何应对眼前合围。',
      outcomes: {
        counter_ambush: {
          when: ({ world }) => world.playerLocation === 'wilds',
          effects: { add: { counterattack: 15, affection: 6 }, npcFlags: { eileen_wilds_hunt_done: true } },
          text: '你与{name}没有盲目逃窜，反而借乱石林线抢先卡住视野死角，干脆利落地剪除掉队的搜捕领队并从其怀中搜出伯爵府近期巡防口令与换防签条（艾琳反攻值 +15，好感 +6）。从口供与签条中得知：山庄内庭有伯爵重金聘请的宗师供奉坐镇，城门白昼混在商旅人流中可乔装接头，入夜则全城严查。'
        },
        evade_stealth: {
          when: ({ world }) => world.playerLocation === 'wilds',
          effects: ({ world }) => {
            const inv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : []
            const hasSupply = inv.some(it => it && it.id === 'supply' && it.custom !== true && (it.count ?? 0) > 0)
            const list = [
              { target: 'eileen', add: { counterattack: 8, affection: 3 }, npcFlags: { eileen_wilds_hunt_done: true } }
            ]
            if (hasSupply) list.unshift({ target: 'world', itemsRemove: [{ id: 'supply', count: 1 }] })
            return list
          },
          text: '为免惊动大队合围，你们借沟壑地形与丢弃的诱饵掩盖气味悄然蛰伏避过搜山队（若有补给则消耗 1 份补给，艾琳反攻值 +8，好感 +3）。从远处巡逻队交谈声中仍摸清了要害：山庄有宗师供奉坐镇，白昼商旅混杂尚可乔装进城接头，入夜则全城严查。'
        }
      }
    },
    {
      id: 'eileen_seek_gulan',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) => {
        return canPrepareCounterattack(world) &&
          Boolean(npc.flags?.eileen_wilds_hunt_done) &&
          (npc.values.counterattack ?? 0) >= 30 &&
          !npc.flags?.eileen_gulan_contacted &&
          availableGulan(world) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase.id)
      },
      text: '白昼混在商旅人流中乔装潜入城内练武场一隅，外貌二十余岁的冷艳黑角重剑宗师古兰收剑立于场边，琥珀色竖瞳平静扫过你们。{name}收敛了皇室巡查官的傲气，以平辈礼节郑重说明山庄内有伯爵重金聘请的宗师供奉镇守，凭小队自身难以正面破局，恳请古兰届时只在山庄外围出手制造动静牵制对方、绝不拖她正面卷入王室纷争。',
      outcomes: {
        pledge_divert: {
          when: ({ world, npc, phase }) => canPrepareCounterattack(world) && availableGulan(world) &&
            !npc.flags?.eileen_gulan_contacted && isDaytime(phase) && world.playerLocation === 'town',
          effects: [
            { target: 'eileen', add: { counterattack: 20, affection: 5 }, npcFlags: { eileen_gulan_contacted: true } },
            { target: 'gulan', npcFlags: { gulan_divert_promised: true } }
          ],
          text: '古兰确认过伯里已自行摸清退路、并非逃避担当，按生死危局护持后辈的底线简短颔首应下：“届时山庄外围的动静，我来引开；里面的事，伯里自己拿主意。”（艾琳反攻值 +20，好感 +5）。'
        }
      }
    },
    {
      id: 'eileen_decoy_prep',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) => {
        return canPrepareCounterattack(world) &&
          Boolean(npc.flags?.eileen_wilds_hunt_done) &&
          (npc.values.counterattack ?? 0) >= 30 &&
          !npc.flags?.eileen_gulan_contacted &&
          !availableGulan(world) &&
          world.playerLocation === 'wilds' &&
          ['morning', 'afternoon', 'evening'].includes(phase.id)
      },
      text: '眼下已无法指望古兰在城内协助牵制，面对山庄内宗师供奉坐镇的硬钉子，{name}与你摊开草图商议，只能自行在城外筹备一套引火与假信号声东击西的方案。',
      outcomes: {
        decoy_prep: {
          when: ({ world, npc }) => canPrepareCounterattack(world) && !availableGulan(world) &&
            !npc.flags?.eileen_gulan_contacted && world.playerLocation === 'wilds',
          effects: { add: { counterattack: 12, affection: 3 }, npcFlags: { eileen_gulan_contacted: true } },
          text: '二人反复校准风向与几处外围引火点，勉强拼出一套声东击西吸引宗师注意的替补方案（艾琳反攻值 +12，好感 +3）。'
        }
      }
    },
    {
      id: 'eileen_manor_recon',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(isEileenFugitive(world) && !hasEileenSignal(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_wilds_hunt_done) &&
        (npc.values.counterattack ?? 0) < 100 &&
        !npc.flags?.eileen_recon_today &&
        (npc.flags?.eileenReconCount ?? 0) < 3 &&
        world.playerLocation === 'wilds' &&
        ['morning', 'afternoon', 'evening'].includes(phase.id),
      expireWhen: ({ world, npc }) => !canPrepareCounterattack(world) ||
        (npc.flags?.eileenReconCount ?? 0) >= 3 || (npc.values.counterattack ?? 0) >= 100,
      resolveWhen: ({ world, npc, phase }) => canPrepareCounterattack(world) &&
        !npc.flags?.eileen_recon_today && (npc.flags?.eileenReconCount ?? 0) < 3 &&
        (npc.values.counterattack ?? 0) < 100 && world.playerLocation === 'wilds' &&
        ['morning', 'afternoon', 'evening'].includes(phase.id),
      text: ({ npc }) => {
        const count = npc.flags?.eileenReconCount ?? 0
        if (count === 0) {
          return '避入城外高地，{name}展开一张简略炭笔草图，远眺奥克赫斯城北山庄高墙，示意先对照记忆标出巡逻私兵的换班间隙与外墙视野盲区。'
        }
        if (count === 1) {
          return '借助昨夜整理的线索，{name}随你摸到山庄侧翼林线，重点观察雷蒙德重金聘请的宗师供奉与精锐卫队的巡值交接规律。'
        }
        return '换防草图已近成形，{name}指向山庄主楼偏侧暗窗——只差最后一次核对内室暗格方位与潜入退路，这盘反攻棋局便算真正落子前夕。'
      },
      outcomes: {
        infiltrate_edge: {
          effects: ({ npc }) => [
            {
              target: 'eileen',
              add: { counterattack: 15, affection: 3 },
              npcFlags: { eileen_recon_today: true, eileenReconCount: (npc.flags?.eileenReconCount ?? 0) + 1 }
            }
          ],
          text: '你们趁山林雾气贴近山庄外围暗哨交接处，稳稳截听到最新换防口令与换岗时间差（艾琳反攻值 +15，好感 +3）。'
        },
        distant_observe: {
          effects: ({ npc }) => [
            {
              target: 'eileen',
              add: { counterattack: 10, affection: 2 },
              npcFlags: { eileen_recon_today: true, eileenReconCount: (npc.flags?.eileenReconCount ?? 0) + 1 }
            }
          ],
          text: '为求稳妥没有靠近外围哨卡，只在荒野高地长时间计时记录巡逻班次与灯火变化（艾琳反攻值 +10，好感 +2）。'
        }
      }
    },
    {
      id: 'aurora_pass_manor_intel',
      mode: 'interaction',
      scope: 'npc',
      targets: ['aurora'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor) &&
        npc.stage < 3 &&
        (npc.values.affection ?? 0) >= 80 &&
        !npc.flags?.aurora_eileen_intel_given &&
        world.playerLocation === npc.location,
      text: '你在稳妥时机与在山庄当差的{name}私下碰面了；她左右确认无人盯梢，正紧张地朝你靠近，似乎记下了领主书房内室的重要秘密准备通报。',
      outcomes: {
        receive_intel: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: ({ npc }) => [
            { target: 'world', itemsAdd: [{ id: 'manor_intel_note', count: 1 }] },
            { target: 'eileen', add: { counterattack: npc.flags?.aurora_resign_failed ? 30 : 20 } },
            { target: 'aurora', npcFlags: { aurora_eileen_intel_given: true } }
          ],
          text: ({ npc }) => npc.flags?.aurora_resign_failed
            ? '先前辞职遭伯爵当面强扣的经历已令{name}对领主再无半点幻想，她不仅冒着风险交出山庄私室换防间隙与领主暗锁密码，还将苛刻劳务契约副本与私账破绽一并托付于你以配合艾琳反攻（艾琳反攻值 +30）。'
            : '{name}低声交出自己端茶收拾时悄悄记下的山庄私室换防间隙与领主暗锁密码，艾琳一方的反攻筹备迈出一大步（艾琳反攻值 +20）。'
        }
      }
    },
    {
      id: 'eileen_reclaim_tube',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        Boolean(isEileenFugitive(world) && !hasEileenSignal(world) && !world.flags?.baron_purged) &&
        world.playerLocation === 'manor' &&
        (npc.values.counterattack ?? 0) >= 100,
      text: '历经荒野蓄势与各方情报汇总（反攻值已满 100），{name}眼神沉静而果断地看向伯爵山庄方向——如今已摸清府内换防与重金宗师供奉的巡值破绽，趁夜色或换防间隙亲抵山庄潜入夺回那支被掉包的真正王室魔能讯号管，时机已成熟。',
      outcomes: {
        strike: {
          when: ({ world, npc }) => canPrepareCounterattack(world) && world.playerLocation === 'manor' &&
            (npc.values.counterattack ?? 0) >= 100,
          effects: [
            { target: 'world', worldFlags: { eileen_signal_fired: true }, itemsRemove: [{ id: 'manor_intel_note', all: true }] },
            { target: 'eileen', npcFlags: { eileen_signal_fired: true, eileenSignalDays: 0 } }
          ],
          text: ({ world }) => {
            const gulanDivert = availableGulan(world) && world.npcs.gulan.flags?.gulan_divert_promised === true
            return (gulanDivert
              ? '众人按推演好的破绽分头行动：请出古兰隐匿身份在山庄外围出手制造动静调虎离山，成功引开伯爵重金聘请的宗师供奉；其余人趁隙摸入山庄防线深处破开暗格，'
              : '众人按推演好的破绽声东击西引开伯爵重金聘请的宗师供奉与精锐守卫，趁隙摸入山庄防线深处破开暗格，') +
              '{name}亲手夺回原装王室魔能讯号管当空拉响传讯焰火！兰开斯特家族东境狮鹫骑士团瞬间收到召唤，一日后即将降临奥克赫斯城！'
          }
        }
      }
    },
    {
      id: 'eileen_lancaster_purge',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(hasEileenSignal(world) && !world.flags?.baron_purged) &&
        (world.npcs?.eileen?.flags?.eileenSignalDays ?? 0) >= 1,
      effects: [
        {
          target: 'world',
          goldDelta: 1000,
          itemsRemove: [{ id: 'manor_intel_note', all: true }],
          worldFlags: { baron_purged: true, curfew_active: false, eileen_fugitive: false,
            lancaster_purge_reward_paid: true, inn_arrears: false }
        },
        { target: 'eileen', add: { affection: 20 }, npcFlags: { eileen_fugitive: false, eileen_disguised: false, eileen_purged_victory: true, eileenPostPurgeDays: 0 } }
      ],
      text: '发出传讯次日，翼展蔽空的兰开斯特家族狮鹫骑士团（全员三阶精锐，正副团长为四阶宗师）威严降临奥克赫斯城上空！雷蒙德伯爵私兵伏诛、供奉客卿各自退散，伯爵本人遭当场清算处决；兰开斯特家族颁发重金赏赐，艾琳感激之余神情也随之柔和下来（好感度 +20）。'
    },
    {
      id: 'eileen_purge_aurora_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage === 3 &&
        !npc.flags?.aurora_purged_with_baron,
      effects: {
        monitored: false,
        npcFlags: { manor_service_active: false, aurora_purged_with_baron: true }
      },
      text: '清算行动中，早已沦为领主山庄永久情妇的{name}未能脱身，与雷蒙德伯爵一并被兰开斯特家族骑士团带走清算处置。'
    },
    {
      id: 'eileen_purge_aurora_freed',
      mode: 'result',
      idleOnly: true,
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage < 3 &&
        Boolean(npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor),
      effects: {
        move: 'inn',
        npcFlags: { manor_service_active: false, aurora_left_manor: true }
      },
      text: '随着雷蒙德伯爵伏诛倒台，压在山庄与{name}头顶的勒索契约一同作废；她得以脱身返回旅店归队（既往阶段留存不变，剩余家族外债仍需另行设法清偿）。'
    },
    {
      id: 'eileen_purge_nise_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage === 3 &&
        !npc.flags?.nise_fled_casino,
      effects: {
        monitored: false,
        npcFlags: { nise_fled_casino: true }
      },
      text: '领主府一朝坍塌，金碧赌场瞬间失去官方保护伞；黑巨汉三人组见势不妙席卷大笔现金夜逃出境，早已签下卖身契沦陷的{name}也随之流落离开奥克赫斯，去向不明。'
    },
    {
      id: 'eileen_purge_nise_freed',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage < 3 &&
        !npc.flags?.nise_umbrella_broken,
      effects: {
        npcFlags: { nise_umbrella_broken: true, casino_debt_frozen: true }
      },
      text: '领主府倒台后，黑巨汉失去地方武力背书仓皇避祸，金碧赌场再也无法借官府高压强扣{name}逼债（过往经历的阶段依然留存）。'
    },
    {
      id: 'eileen_marriage_grant',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        !world.flags?.player_barony_granted &&
        !npc.flags?.eileen_returned_capital &&
        (npc.values.affection ?? 0) >= 90,
      effects: [
        { target: 'world', worldFlags: { player_barony_granted: true }, itemsAdd: [{ id: 'barony_patent', count: 1 }] },
        { target: 'eileen', npcFlags: { eileen_betrothed: true } }
      ],
      text: '在狮鹫骑士团团长与兰开斯特家族见证下，与你患难生情、爱恋笃定的{name}亲自申请与你缔结婚约；家族大喜之下正式将原雷蒙德伯爵辖下一处附庸领地封赏于你，册封男爵爵位。'
    },
    {
      id: 'eileen_depart_with_knights',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        !world.flags?.player_barony_granted &&
        !npc.flags?.eileen_betrothed &&
        !npc.flags?.eileen_returned_capital &&
        (npc.values.affection ?? 0) < 90 &&
        (npc.flags?.eileenPostPurgeDays ?? 0) >= 3,
      effects: {
        monitored: false,
        npcFlags: { eileen_returned_capital: true }
      },
      text: '虽已成功清剿雷蒙德并颁下重金酬谢，但你与{name}终究未及缔结婚约的深挚情分。翌日在奥克赫斯完成交接与案卷核封后，{name}郑重向你道别，随兰开斯特狮鹫骑士团一同起飞返程回王都复命离队。'
    },
    {
      id: 'eileen_three_month_inspection',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !world.flags?.baron_purged) &&
        npc.stage === 3 &&
        !npc.flags?.eileen_inspection_covered &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 90,
      effects: { npcFlags: { eileen_inspection_covered: true } },
      text: '自失联囚禁满三个月（九十日）整，兰开斯特家族派遣狮鹫骑士团飞抵奥克赫斯追查特使下落；然而早已在密室被伯爵完全调教驯服的{name}却穿戴齐整、神态端庄地走出山庄，替雷蒙德从容掩护圆场，令骑士团确认无误后无事发生返航离去。'
    },
    {
      id: 'nise_casino_hint_high',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.tasted_casino &&
        !npc.flags?.nise_hint_done &&
        (npc.values.affection ?? 0) >= 80 &&
        (npc.values.curiosity ?? 0) >= 65,
      effects: { npcFlags: { nise_hint_done: true } },
      text: '{name}漫不经心地跟你炫耀镇上商业街深处据说藏着一处用魔法水晶轮盘计赔率的金碧赌场，嘴上说着想去看看那帮老千怎么耍花招，心底正跃跃欲试。'
    },
    {
      id: 'nise_first_taste',
      mode: 'result',
      idleOnly: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.tasted_casino &&
        (npc.values.curiosity ?? 0) >= 70 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        npc.location === 'town' &&
        !['town', 'casino'].includes(world.playerLocation),
      effects: {
        move: 'casino',
        npcFlags: { tasted_casino: true, casinoGapDays: 0 }
      },
      text: '趁着镇上无人盯梢，{name}好奇压过谨慎溜进商业街金碧赌场试了数把悬晶轮盘，意外赢下一笔零钱后扬眉吐气地揣好钱袋离开。'
    },
    {
      id: 'nise_first_debt',
      mode: 'result',
      idleOnly: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        Boolean(npc.flags?.tasted_casino) &&
        !npc.flags?.nise_first_debt_done &&
        (npc.values.gamble_debt ?? 0) === 0 &&
        (npc.flags?.casinoGapDays ?? 0) >= 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation !== 'casino',
      effects: {
        move: 'casino',
        add: { gamble_debt: 10 },
        npcFlags: { nise_first_debt_done: true, casinoGapDays: 0 }
      },
      text: '尝过快钱甜头的{name}瞒着家人再度溜进金碧赌场，却被经验老到的荷官做局接连输空钱袋；急欲翻本的她害怕被古兰知晓责罚，只得按手印签下第一份高利筹码借条（赌债 +10）。'
    },
    {
      id: 'nise_gamble_debt_grow',
      mode: 'result',
      idleOnly: true,
      repeatable: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.casino_debt_frozen &&
        !npc.flags?.nise_fled_casino &&
        (npc.values.gamble_debt ?? 0) > 0 &&
        (npc.flags?.casinoGapDays ?? 0) >= 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation !== 'casino',
      effects: {
        move: 'casino',
        add: { gamble_debt: 10 },
        npcFlags: { casinoGapDays: 0 }
      },
      text: '不敢向严厉的古兰坦白的{name}抱着自己赢回来平账的侥幸悄悄再入赌场，却又被做局反杀套牢，借条雪球进一步滚大（赌债 +10）。'
    },
    {
      id: 'nise_gamble_relapse',
      mode: 'result',
      idleOnly: true,
      repeatable: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.casino_debt_frozen &&
        !npc.flags?.nise_fled_casino &&
        !npc.flags?.nise_gamble_immune &&
        Boolean(npc.flags?.tasted_casino && npc.flags?.debt_repaid_once) &&
        (npc.values.gamble_debt ?? 0) === 0 &&
        (npc.values.affection ?? 0) < 90 &&
        (npc.values.curiosity ?? 0) >= 65 &&
        (npc.flags?.casinoGapDays ?? 0) >= 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation !== 'casino',
      effects: {
        move: 'casino',
        add: { gamble_debt: 10 },
        npcFlags: { casinoGapDays: 0 }
      },
      text: '虽曾借你帮衬清还过一次账目，好胜心未泯的{name}心瘾再度抬头偷偷潜入赌场，结果重蹈覆辙又签下了新的高利借条（赌债 +10）。'
    },
    {
      id: 'nise_debt_confess',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.stage < 3 &&
        !npc.flags?.nise_debt_known &&
        (npc.values.gamble_debt ?? 0) > 0 &&
        (((npc.values.affection ?? 0) >= 80 && ['inn', 'town', 'church'].includes(world.playerLocation) && world.playerLocation === npc.location) ||
          (world.playerLocation === 'casino' && npc.location === 'casino')),
      effects: { npcFlags: { nise_debt_known: true } },
      text: '瞒不住的赌债实情已摆到明面上——{name}红着眼眶咬唇低头不敢看古兰的方向，只敢死死拽住你的袖口低声招认了金碧赌场的高利借条。'
    },
    {
      id: 'nise_casino_heist',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || npc.id !== 'nise') return false;
        if (npc.stage !== 1 || !npc.flags?.nise_dealer_done) return false;
        if ((npc.values.gamble_debt ?? 0) < 30 || npc.flags?.nise_heist_done) return false;
        if (!['night', 'deep_night'].includes(phase.id)) return false;
        if (world.playerLocation !== 'casino') return false;
        const isnaAvailable = Boolean(world.npcs?.isna && world.npcs.isna.alive !== false &&
          !world.npcs.isna.flags?.captured_orc && !world.npcs.isna.flags?.isna_camp_distress);
        const bestStealth = Math.max(
          root.OKH_APP_SKILLS ? root.OKH_APP_SKILLS.checkAbility(world, '潜行') : 0,
          isnaAvailable ? 3 : 0
        );
        const bestLockpick = Math.max(
          root.OKH_APP_SKILLS ? root.OKH_APP_SKILLS.checkAbility(world, '开锁') : 0,
          (isnaAvailable && (world.playerState?.tier ?? 2) >= 3) ? 3 : 0
        );
        return bestStealth >= 2 && bestLockpick >= 3;
      },
      effects: ({ world }) => [
        {
          target: 'nise',
          set: { gamble_debt: 0 },
          npcFlags: {
            nise_heist_done: true,
            nise_gamble_immune: true,
            casino_debt_frozen: true,
            nise_casino_busy_today: false
          },
          tagsAdd: ['nise_gamble_immune']
        },
        {
          target: 'player',
          tagsAdd: ['tag_balak_grudge']
        }
      ],
      text: '借着深宵夜色掩护，你避开赌场巡哨潜入二楼账房（潜行检定通过）；在昏暗烛影下，拆解开黑铁暗锁保险箱，将按有妮丝手印的高利借条取出焚毁（开锁检定通过）。惊魂初定的妮丝见证据化为灰烬，瘫软在你怀中泪流满面，自此绝了翻本赌念（赌债归零，获得【完全绝赌】；巴拉克发现借据失窃，对小队暗生记恨）。'
    },
    {
      id: 'cecilia_midgame_crisis',
      mode: 'result',
      scope: 'npc',
      targets: ['cecilia'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage < 3 &&
        !npc.flags?.cecilia_midgame_crisis &&
        dayAt(world) >= arrivedDayOf(world) + 14,
      effects: {
        add: { orphanage_funds: -10 },
        npcFlags: { cecilia_midgame_crisis: true }
      },
      text: '抵镇满两周后，上级教区拨给晨曦修道院的常年补助骤然中断，加之寒季孩童药材与炭火开支攀升，教堂账房库存告急、每日净损耗随之上升（孤儿院资金 -10，日耗增至 5）。'
    },
    {
      id: 'cecilia_manor_appeal_1',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 0 &&
        !npc.flags?.cecilia_manor_go_stage1 &&
        !npc.flags?.cecilia_quest_stage &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        (npc.values.affection ?? 0) >= 70,
      resolveWhen: ({ world, npc }) =>
        !world.flags?.baron_purged && npc.stage === 0 && (npc.values.orphanage_funds ?? 0) <= 0,
      expireWhen: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) ||
        npc.stage !== 0 ||
        (npc.values.orphanage_funds ?? 0) > 0 ||
        (npc.values.affection ?? 0) < 70,
      text: '孤儿院账面见底且孩童药柜空虚，{name}思虑再三后找到你商议——若再无办法筹措药材或善款，她只能独自前往领主山庄恳求伯爵拨款。',
      outcomes: {
        take_quest: {
          effects: { npcFlags: { cecilia_quest_stage: 1, ceciliaAppealDays: 0, cecilia_manor_go_stage1: false } },
          text: '你接下了筹措重担，决定亲赴城外毒沼菌窟外围采掘稀缺疗伤菌茸；{name}眼中泛起感激微光，叮嘱你务必小心瘴气（已接取救济任务，请前往 wilds 完成）。'
        },
        help: {
          when: ({ world }) => (world.playerState?.gold ?? 0) >= 30,
          effects: ({ npc }) => [
            { target: 'world', goldDelta: -30 },
            {
              target: 'cecilia',
              add: { orphanage_funds: 30, donated_gold: 30, affection: 4 },
              npcFlags: { ceciliaAppealDays: 0, cecilia_manor_go_stage1: false, ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1 }
            }
          ],
          text: '三十枚金币稳稳填补了孤儿院口粮与药费的燃眉之急；{name}眼底泛起浅浅水光，双手合十低眉致谢（孤儿院资金 +30，好感度 +4）。'
        },
        let_go: {
          effects: { npcFlags: { cecilia_manor_go_stage1: true } },
          text: '孤儿院沉重的亏空未获解决，{name}只得轻叹一口气垂眸颔首，起身整理修女服独自赶往领主山庄恳求伯爵拨款。'
        }
      }
    },
    {
      id: 'cecilia_manor_appeal_2',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 1 &&
        !npc.flags?.cecilia_manor_go_stage2 &&
        !npc.flags?.cecilia_quest_stage &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        (npc.values.affection ?? 0) >= 80,
      resolveWhen: ({ world, npc }) =>
        !world.flags?.baron_purged && npc.stage === 1 && (npc.values.orphanage_funds ?? 0) <= 0,
      expireWhen: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) ||
        npc.stage !== 1 ||
        (npc.values.orphanage_funds ?? 0) > 0 ||
        (npc.values.affection ?? 0) < 80,
      text: '上次筹措的用度再度耗尽，{name}指尖绞着修女袍袖口再度来找你商议；她翻出一本旧教区账册，提及城外古代机关旧殿遗迹石室里曾封存过一批老修道院白银圣器与救济匣，只是普通人根本进不去。',
      outcomes: {
        take_quest: {
          effects: { npcFlags: { cecilia_quest_stage: 2, ceciliaAppealDays: 0, cecilia_manor_go_stage2: false } },
          text: '你接过旧教区石室草图，决定前往城外机关旧殿废墟取回封存救济匣（已接取救济任务，请前往 wilds 完成）。'
        },
        help: {
          when: ({ world }) => (world.playerState?.gold ?? 0) >= 50,
          effects: ({ npc }) => [
            { target: 'world', goldDelta: -50 },
            {
              target: 'cecilia',
              add: { orphanage_funds: 40, donated_gold: 50, affection: 4 },
              npcFlags: { ceciliaAppealDays: 0, cecilia_manor_go_stage2: false, ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1 }
            }
          ],
          text: '五十枚金币填补了修道院大额亏空，免去了她再次独自前往领主山庄的风险（孤儿院资金 +40，好感度 +4）。'
        },
        let_go: {
          effects: { npcFlags: { cecilia_manor_go_stage2: true } },
          text: '窟窿一时无从筹措，{name}沉默地垂下眼睫，向同伴浅浅欠身后踏出教堂走向领主山庄。'
        }
      }
    },
    {
      id: 'cecilia_manor_appeal_3',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 2 &&
        !npc.flags?.cecilia_manor_go_stage3 &&
        !npc.flags?.cecilia_quest_stage &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        (npc.values.affection ?? 0) >= 90,
      resolveWhen: ({ world, npc }) =>
        !world.flags?.baron_purged && npc.stage === 2 && (npc.values.orphanage_funds ?? 0) <= 0,
      expireWhen: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) ||
        npc.stage !== 2 ||
        (npc.values.orphanage_funds ?? 0) > 0 ||
        (npc.values.affection ?? 0) < 90,
      text: '孤儿院账房第三度空底，心系你的{name}眼含微颤找到你商议最后一线对策——邻郡教区原本拨了一支冬春救济粮车，却因城外沉沦灵堂近来亡灵异动而滞留东境商道关卡。',
      outcomes: {
        take_quest: {
          effects: { npcFlags: { cecilia_quest_stage: 3, ceciliaAppealDays: 0, cecilia_manor_go_stage3: false } },
          text: '你接过邻郡教区信物，准备出城清理沉沦灵堂外围游荡亡灵、护通救济车队入城（已接取救济任务，请前往 wilds 完成）。'
        },
        help: {
          when: ({ world }) => (world.playerState?.gold ?? 0) >= 80,
          effects: ({ npc }) => [
            { target: 'world', goldDelta: -80 },
            {
              target: 'cecilia',
              add: { orphanage_funds: 50, donated_gold: 80, affection: 4 },
              npcFlags: { ceciliaAppealDays: 0, cecilia_manor_go_stage3: false, ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1 }
            }
          ],
          text: '八十枚金币足额补齐了冬春之交的粮药用度；重压骤释之下，{name}再难自持地俯首低泣，向眼前的支柱吐露积压已久的感激（孤儿院资金 +50，好感度 +4）。'
        },
        let_go: {
          effects: { npcFlags: { cecilia_manor_go_stage3: true } },
          text: '重金终未凑齐，{name}在原地伫立良久，含泪轻轻福身行礼后推门赶往了领主山庄。'
        }
      }
    },
    {
      id: 'cecilia_quest_1_mire',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && !world.flags?.baron_purged) &&
        npc.flags?.cecilia_quest_stage === 1 &&
        world.playerLocation === 'wilds' &&
        ['morning', 'afternoon', 'evening'].includes(phase.id),
      expireWhen: ({ world, npc }) => Boolean(world.flags?.baron_purged) || npc.flags?.cecilia_quest_stage !== 1,
      resolveWhen: ({ world, npc, phase }) =>
        !world.flags?.baron_purged && npc.flags?.cecilia_quest_stage === 1 &&
        world.playerLocation === 'wilds' && ['morning', 'afternoon', 'evening'].includes(phase.id),
      text: '你按约定抵达城外毒沼菌窟外围，潮湿腐殖沼气中散落着修道院急需的发光菌茸与净水药草，只是浅滩暗影里潜伏着毒角蛙与腐水寄生体。',
      outcomes: {
        complete_quest: {
          effects: ({ npc }) => [
            {
              target: 'cecilia',
              add: { orphanage_funds: 35, affection: 4 },
              npcFlags: { cecilia_quest_stage: 0, ceciliaAppealDays: 0, ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1 }
            }
          ],
          text: '你避开毒孢浓雾采足稀缺菌茸带回晨曦修道院，不仅解了孩童断药之急，余药变现后也稳住了账房用度（孤儿院资金 +35，好感度 +4）。'
        }
      }
    },
    {
      id: 'cecilia_quest_2_vault',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && !world.flags?.baron_purged) &&
        npc.flags?.cecilia_quest_stage === 2 &&
        world.playerLocation === 'wilds' &&
        ['morning', 'afternoon', 'evening'].includes(phase.id),
      expireWhen: ({ world, npc }) => Boolean(world.flags?.baron_purged) || npc.flags?.cecilia_quest_stage !== 2,
      resolveWhen: ({ world, npc, phase }) =>
        !world.flags?.baron_purged && npc.flags?.cecilia_quest_stage === 2 &&
        world.playerLocation === 'wilds' && ['morning', 'afternoon', 'evening'].includes(phase.id),
      text: '按老修女长遗留账册的指引，你找到城外荒原那座布满机关与兽骨残痕的古代石室入口；只要破开重力暗锁取回旧教区封存的救济匣，修道院就能再撑许久。',
      outcomes: {
        complete_quest: {
          effects: ({ npc }) => [
            {
              target: 'cecilia',
              add: { orphanage_funds: 45, affection: 4 },
              npcFlags: { cecilia_quest_stage: 0, ceciliaAppealDays: 0, ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1 }
            }
          ],
          text: '你稳妥拆解暗殿卡榫、取回尘封完好的白银圣器与救济钱匣交到塞西莉亚手中；她凝望这批跨越数十年送达的雪中炭火，眼眶微红（孤儿院资金 +45，好感度 +4）。'
        }
      }
    },
    {
      id: 'cecilia_quest_3_crypt',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && !world.flags?.baron_purged) &&
        npc.flags?.cecilia_quest_stage === 3 &&
        world.playerLocation === 'wilds' &&
        ['morning', 'afternoon', 'evening'].includes(phase.id),
      expireWhen: ({ world, npc }) => Boolean(world.flags?.baron_purged) || npc.flags?.cecilia_quest_stage !== 3,
      resolveWhen: ({ world, npc, phase }) =>
        !world.flags?.baron_purged && npc.flags?.cecilia_quest_stage === 3 &&
        world.playerLocation === 'wilds' && ['morning', 'afternoon', 'evening'].includes(phase.id),
      text: '东境商道旁那座沉沦灵堂外围寒雾缭绕，几具游荡骸骨封住了邻郡教会救济车队的必经山口；唯有先拔除这股外溢亡灵，车队才敢进城。',
      outcomes: {
        complete_quest: {
          effects: ({ npc }) => [
            {
              target: 'cecilia',
              add: { orphanage_funds: 55, affection: 4 },
              npcFlags: { cecilia_quest_stage: 0, ceciliaAppealDays: 0, ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1 }
            }
          ],
          text: '你清理了灵堂外围游荡亡灵并护送邻郡救济粮车绕开领主私兵盘剥直接驶入修道院后门，冬春之交的生计大关终于守住（孤儿院资金 +55，好感度 +4）。'
        }
      }
    },
    {
      id: 'cecilia_weekly_ruin_offer',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: canTakeWeeklyRuin,
      resolveWhen: canTakeWeeklyRuin,
      text: ({ npc }) => {
        const target = nextWeeklyBiome(npc)
        const descMap = {
          mire: '毒沼菌窟（mire）：修道院急需毒沼阴蛇胆与荧光菌茸配制退热解毒药膏',
          vault: '机关暗殿（vault）：寻回古代地宫石室遗落的旧教区白银圣器与祈祷手抄本',
          lair: '魔兽巢穴（lair）：猎取巢穴魔兽髓脂与洁净角骨作寒季熬药灯油补给',
          crypt: '沉沦灵堂（crypt）：安抚灵堂游荡亡灵并取回受祝福的教会圣匣'
        }
        return `{name}整理完本周药房与祈祷名录，温和询问你这周是否有空承接一趟教会遗迹委托（${descMap[target]}；仅赠教堂特产与好感，不给金币与功绩）。`
      },
      outcomes: {
        accept_weekly: {
          effects: ({ world, npc }) => ({
            npcFlags: { ceciliaWeeklyBiome: nextWeeklyBiome(npc), ceciliaWeeklyAcceptMin: world.timeMin }
          }),
          text: '你接下了本周圣辉大教堂遗迹委托；{name}取出一枚小巧木牌交给你作凭证，嘱咐你在城外通关一座对应生态的遗迹后再回来交付。'
        }
      }
    },
    {
      id: 'cecilia_weekly_ruin_turnin',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) => churchAudience(world, npc) && getChurchWeeklyRuin(world)?.ready === true,
      resolveWhen: ({ world, npc }) => churchAudience(world, npc) && getChurchWeeklyRuin(world)?.ready === true,
      text: '你带着刚从对应遗迹采获的奇物回到圣辉大教堂，{name}快步迎上前来查验，脸上浮起由衷的欣慰。',
      outcomes: {
        turnin: {
          effects: ({ world, npc }) => {
            const count = (npc.flags?.ceciliaWeeklyCount ?? 0) + 1
            const biome = getChurchWeeklyRuin(world).biome.id
            const itemsAdd = [
              { id: 'church_blessed_salve', count: 1 },
              { id: ['biome_undead_crypt', 'biome_trap_vault'].includes(biome) ? 'church_holy_water' : 'church_purify_incense', count: 1 },
              { id: 'church_blessed_ration', count: 1 }
            ]
            const inv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : []
            const hasRosary = inv.some(it => it && it.id === 'church_silver_rosary' && it.custom !== true && (it.count ?? 0) > 0)
            if (!hasRosary && count >= 2) {
              itemsAdd.push({ id: 'church_silver_rosary', count: 1 })
            }
            const add = { orphanage_funds: 20 }
            if ((npc.stage ?? 0) < 3 && !npc.flags?.affection_locked) add.affection = 8
            return [
              { target: 'world', itemsAdd },
              {
                target: 'cecilia',
                add,
                npcFlags: {
                  ceciliaWeeklyBiome: null,
                  ceciliaWeeklyAcceptDay: 0,
                  ceciliaWeeklyAcceptMin: null,
                  ceciliaWeeklyLastDoneDay: dayAt(world),
                  ceciliaWeeklyCount: count,
                  ceciliaAidCount: (npc.flags?.ceciliaAidCount ?? 0) + 1
                }
              }
            ]
          },
          text: '{name}郑重收下遗迹采获物并添入孤儿院账房，随后亲手将修道院熬制祝圣的伤药膏、圣水/熏香与祝圣麦饼装袋交给你（孤儿院资金 +20，未封锁好感时 +8，获赠教堂特有物品）。'
        }
      }
    },
    {
      id: 'cecilia_aurora_mentor_talk',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const cec = world.npcs?.cecilia
        const aur = world.npcs?.aurora
        return Boolean(world.flags?.arrived_oakhaven && !world.flags?.baron_purged) &&
          !world.flags?.cecilia_aurora_talk_done &&
          isWeekendDay(dayAt(world)) &&
          world.playerLocation === 'church' &&
          cec && cec.alive !== false && (cec.stage ?? 0) < 3 && cec.location === 'church' &&
          aur && aur.alive !== false && (aur.stage ?? 0) < 3 && aur.location === 'church' &&
          Boolean(aur.flags?.manor_service_active)
      },
      effects: [
        { target: 'world', worldFlags: { cecilia_aurora_talk_done: true } },
        { target: 'cecilia', add: { affection: 3, orphanage_funds: 5 } },
        { target: 'aurora', add: { affection: 3 } }
      ],
      text: '周末白昼在圣辉大教堂做礼拜时，外地随队而来的奥萝拉在帮修道院整理药柜期间与塞西莉亚相谈投缘。塞西莉亚察觉这名同为晨曦信徒的姑娘在领主山庄当差后眉间藏忧，温和叮嘱她“伯爵府的善款与契约向来苛刻，万勿因钱财受人拿捏”，并托付你多加照看；奥萝拉强作镇定点头应下，临走前悄悄往募捐箱添了一小袋工钱（塞西莉亚与奥萝拉好感各 +3，孤儿院资金 +5）。'
    },
    {
      id: 'cecilia_post_purge_relief',
      mode: 'result',
      scope: 'npc',
      targets: ['cecilia'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.alive !== false &&
        !npc.flags?.cecilia_purge_settled,
      effects: ({ npc }) => {
        if ((npc.stage ?? 0) >= 3) {
          return {
            npcFlags: { cecilia_purge_settled: true, affection_locked: true }
          }
        }
        const needTopUp = Math.max(0, 80 - (npc.values?.orphanage_funds ?? 0))
        return {
          add: { orphanage_funds: needTopUp, affection: 5 },
          npcFlags: { cecilia_purge_settled: true, cecilia_quest_stage: 0, ceciliaAppealDays: 0 }
        }
      },
      text: ({ npc }) => (npc.stage ?? 0) >= 3
        ? '雷蒙德伯爵伏诛、领主山庄遭查封后，强压在修道院头上的勒索契约随之消散；只是过往在山庄的屈辱已成难以抹去的圣职污点，{name}垂下眼睫继续留在修道院带着孤儿赎罪，日常与周常委托仍照常维系。'
        : '雷蒙德伯爵倒台后，艾琳协同狮鹫骑士团清点私库，将原先遭伯爵长期卡扣截留的教会拨款与冬春粮药如数发还晨曦修道院；孤儿院的资金危机自此解除，{name}长舒一口气向你致谢（资金补足安全线，好感 +5，教堂周常遗迹委托依然照常开放）。'
    },
    {
      id: 'cecilia_reward_1_oral',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isEileenFugitive(world) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        !npc.flags?.cecilia_reward1_done &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        (npc.values.affection ?? 0) >= 70 &&
        ((npc.flags?.ceciliaAidCount ?? 0) >= 1 || (npc.values.donated_gold ?? 0) >= 30),
      resolveWhen: ({ world, npc, phase }) =>
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)),
      expireWhen: ({ world, npc, phase }) =>
        Boolean(isEileenFugitive(world)) ||
        npc.stage >= 3 ||
        Boolean(npc.flags?.affection_locked) ||
        world.playerLocation !== 'church' ||
        npc.location !== 'church' ||
        !['night', 'deep_night'].includes(phase.id) ||
        ((npc.values.orphanage_funds ?? 0) <= 0 && !world.flags?.baron_purged),
      text: '夜祷散尽的圣辉大教堂偏殿只余微弱烛火，接连并肩扛过风波后，向来严守戒律的{name}在圣坛前独自跪坐良久。她低声自责明明发过贞洁愿却满脑子都是你的安危，终于红着眼眶、攥紧修女袍衣角朝你近前一步——在圣职清规与压抑已久的依恋之间颤抖着停住，将接下来的选择留给你。',
      outcomes: {
        accept: {
          effects: { add: { affection: 3 }, npcFlags: { cecilia_reward1_done: true } },
          text: '烛影摇曳的偏殿祈祷室中，{name}微颤着解开头巾垂落金发，带着几分自责与虔诚在你身前俯低身子，生涩而温软地用唇舌替你疏解直到夜深。'
        }
      }
    },
    {
      id: 'cecilia_reward_2_thighs',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isEileenFugitive(world) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        Boolean(npc.flags?.cecilia_reward1_done) &&
        !npc.flags?.cecilia_reward2_done &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        (npc.values.affection ?? 0) >= 80 &&
        ((npc.flags?.ceciliaAidCount ?? 0) >= 2 || (npc.values.donated_gold ?? 0) >= 80),
      resolveWhen: ({ world, npc, phase }) =>
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)),
      expireWhen: ({ world, npc, phase }) =>
        Boolean(isEileenFugitive(world)) ||
        npc.stage >= 3 ||
        Boolean(npc.flags?.affection_locked) ||
        world.playerLocation !== 'church' ||
        npc.location !== 'church' ||
        !['night', 'deep_night'].includes(phase.id) ||
        ((npc.values.orphanage_funds ?? 0) <= 0 && !world.flags?.baron_purged),
      text: '深夜弥撒结束后的修道院内室，{name}特意留了一盏菜油灯等你。她依然穿着齐整的修女长袍守着最后一道矜持，呼吸却因你的靠近而明显乱了节拍，耳尖泛红地轻扯下摆一角，静静等待你的回应。',
      outcomes: {
        accept: {
          effects: { add: { affection: 3 }, npcFlags: { cecilia_reward2_done: true } },
          text: '掩上木门的安静内室里，{name}脸颊绯红却不再避开目光，将端庄白丝长腿并拢夹紧，隔着细腻微温的织物轻缓磨蹭、配合掌心替你承接这份克制而炽热的依恋。'
        }
      }
    },
    {
      id: 'cecilia_reward_3_sex',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isEileenFugitive(world) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        Boolean(npc.flags?.cecilia_reward2_done) &&
        !npc.flags?.cecilia_reward3_done &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        (npc.values.affection ?? 0) >= 90 &&
        ((npc.flags?.ceciliaAidCount ?? 0) >= 3 || (npc.values.donated_gold ?? 0) >= 150),
      resolveWhen: ({ world, npc, phase }) =>
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)),
      expireWhen: ({ world, npc, phase }) =>
        Boolean(isEileenFugitive(world)) ||
        npc.stage >= 3 ||
        Boolean(npc.flags?.affection_locked) ||
        world.playerLocation !== 'church' ||
        npc.location !== 'church' ||
        !['night', 'deep_night'].includes(phase.id) ||
        ((npc.values.orphanage_funds ?? 0) <= 0 && !world.flags?.baron_purged),
      text: '漫长守望与共同扛过风波之后，{name}不再把自己当成孤儿院的赎罪符号；深夜灯下她亲手摘去高领圣饰与头巾，绿瞳清澈而笃定地望进你眼底，等待你伸手接住她作为女人的全部真心。',
      outcomes: {
        accept: {
          effects: { add: { affection: 3 }, npcFlags: { cecilia_reward3_done: true } },
          text: '微凉静谧的教堂寝室夜色里，{name}褪下厚重修女袍与长袜主动倾身相迎，在交融缠绵间不再克制轻颤呜咽，将身为修女长压抑已久的真心与身心温柔交予了你。'
        }
      }
    },
    {
      id: 'ed_grand_stage_2',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        Boolean(world.flags?.ed_joined) &&
        !world.flags?.grand_tier_2 &&
        !world.flags?.ed_showdown_done &&
        (world.npcs?.ed?.values?.patience ?? 100) <= 75,
      effects: {
        worldFlags: { grand_tier_2: true }
      },
      text: buildDragonRevealText(
        'anomaly',
        '城外野兽与魔物仿佛感知到城镇方向有不可名状的源初大恐怖，纷纷向外围仓皇逃窜，近郊浅林反常地出现野兽真空；荒原黑兽人营地座狼暴躁狂吠，千夫长下令全要塞加紧戒备并向外派出重装斥候排查；外逃魔兽践踏城镇远郊村落，流民伤员涌入大教堂避难。'
      )
    },
    {
      id: 'ed_grand_stage_3',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => canTriggerPassCollapse(world) && !world.flags?.baron_purged,
      effects: {
        worldFlags: { grand_tier_3: true, road_blocked: true, curfew_active: true }
      },
      text: buildDragonRevealText(
        'anomaly',
        PASS_COLLAPSE + '雷蒙德下令全镇宵禁，入夜后城门落锁，卫兵沿街巡查。'
      )
    },
    {
      id: 'ed_grand_stage_3_after_purge',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => canTriggerPassCollapse(world) && Boolean(world.flags?.baron_purged),
      effects: {
        worldFlags: { grand_tier_3: true, road_blocked: true, curfew_active: false }
      },
      text: buildDragonRevealText(
        'anomaly',
        PASS_COLLAPSE + '通往峡谷的路口暂时封闭，镇内沿用清算后的通行秩序。'
      )
    },
    {
      id: 'ed_showdown_good',
      mode: 'result',
      scope: 'world',
      afterNodes: true,
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const aff = gulan.values?.affection ?? 0;
        const stage = gulan.stage ?? 0;
        const patience = ed.values?.patience ?? 100;
        // 正线中的艾德会潜伏到耐心耗尽，即使古兰的血脉已经封顶。
        return bd >= 100 && aff >= 90 && stage < 3 && patience <= 0;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_good: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        }
      ],
      text: buildDragonRevealText(
        'full',
        '古兰体内的真血已达顶峰。艾德耐心耗尽，撕破男童的伪装，显化真身，庞大龙影笼罩小镇上空，逼迫其归附完成血脉繁育。然而狂暴的血脉沸腾并未冲垮古兰的神智——对伯里生死相托的深厚情义化作她最坚固的人性逆鳞。古兰横重剑立于伯里身前，周身墨黑龙鳞覆体，以同等纯度的超凡龙威正面抗衡生父。她将剑刃划破掌心立下血誓：若艾德强取，她宁可引爆心核玉石俱焚，让其布局数百年的返祖真血化为焦炭残渣。自负贪生的恶龙权衡利弊，深知同源超凡搏杀必有折损且残破母体毫无价值，冷哼一声震裂半座荒山作为惩戒与警告，振翅隐入层云退去。古兰保全自我意志，与伯里紧紧相拥，小队安然度过大劫。'
      )
    },
    {
      id: 'ed_showdown_dark',
      mode: 'result',
      scope: 'world',
      afterNodes: true,
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const stage = gulan.stage ?? 0;
        return bd >= 100 && stage === 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_dark: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: buildDragonRevealText(
        'full',
        '当古兰体内的古龙真血熟化封顶时，早已沉沦于龙血本能的她已不再保有属于人类的抗拒。寄居的艾德撕去孩童外壳，庞大的太古古龙在镇外暗云中显现身躯，发出低沉古老的心灵共鸣。古兰眼眸中最后一丝温情隐去，取而代之的是纯粹的金红龙瞳。面对惊骇阻拦的伯里与同伴，古兰神情平静如冰，视过往人伦与小队情谊如尘埃，收起重剑一步步走出城镇。在龙王掀起的狂风中，古兰随同生父振翅腾空，回归深山古巢繁育上位龙嗣。小队支柱战力离散，伯里无力回天，暗线终局落幕。'
      )
    },
    {
      id: 'ed_showdown_abduction_mature',
      mode: 'result',
      scope: 'world',
      afterNodes: true,
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const aff = gulan.values?.affection ?? 0;
        const stage = gulan.stage ?? 0;
        return bd >= 100 && aff < 90 && stage < 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_abduction: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: buildDragonRevealText(
        'full',
        '古兰体内真血浓度达到峰值，恶龙艾德现身收割成熟母体。古兰虽觉醒真血，但由于对伯里的情感羁绊未达顶峰，无法凭借自身力量正面逼退恶龙；但在最后关头，不愿同伴受戮的古兰毫不犹豫反手横剑颈前，以自身性命为注逼退恶龙杀意：“若伤他们，我当场自绝，让你数百年算计换来一具冷尸。”恶龙为保全活体母体放过小队众人，抓起古兰掠回龙巢强行繁衍。主角一行侥幸生还，但失去古兰。'
      )
    },
    {
      id: 'ed_showdown_abduction_early',
      mode: 'result',
      scope: 'world',
      afterNodes: true,
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const pat = ed.values?.patience ?? 100;
        const stage = gulan.stage ?? 0;
        return pat <= 0 && bd < 100 && stage < 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_abduction: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: buildDragonRevealText(
        'full',
        '变故骤起。面对耐心耗尽提前撕破伪装强行现身的太古巨龙艾德，上位威压如巨石临头，凡俗之躯的伯里与小队众人被龙威压制，无力对抗。古兰血脉尚未完全觉醒，但她未曾沉沦的心智死死系在同伴身上。眼见恶龙利爪即将踏碎旅店与主角一行，古兰毫不犹豫反手将重剑横上颈项，以自身性命为筹码厉声喝止：“若你敢伤他们分毫，我便立刻自断经脉横剑自尽，让你数百年算计换来一具冷尸！”艾德权衡之下认定活着的母体胜过碾碎几只凡人，终究收敛了杀意，巨爪裹挟起古兰腾空而起。主角一行在古兰以命相搏的要挟下侥幸捡回性命，却只能望着那道远去天际的龙影，背负着痛楚在边陲存活。'
      )
    },
    {
      id: 'ed_showdown_dark_early',
      mode: 'result',
      scope: 'world',
      afterNodes: true,
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const pat = ed.values?.patience ?? 100;
        const stage = gulan.stage ?? 0;
        return pat <= 0 && bd < 100 && stage === 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_dark: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: buildDragonRevealText(
        'full',
        '艾德耐心耗尽撕下伪装提前掳人，而已在暗线中沉沦的古兰早已接纳龙血天性，金红眼眸淡漠无情，听凭生父携同回归龙巢，小队无力挽留，暗线落幕。'
      )
    },
    {
      id: 'ed_wagon_rescue',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        !world.flags?.arrived_oakhaven &&
        !world.flags?.ed_joined &&
        !world.flags?.ed_wagon_found &&
        (world.timeMin ?? 0) >= DAY(3, 8) &&
        world.playerLocation === 'wilds',
      effects: {
        worldFlags: { ed_wagon_found: true }
      },
      text: '旅行途中，伊丝娜敏锐地捕捉到了风中飘来的血腥味，招呼众人赶往事发地点。前方荒道旁横着一辆崩碎的马车，地面躺着车夫与商人装扮的一男一女三具尸体。那对男女在临死前用身体与马车残骸筑起缝隙，护着中间一名陷入昏迷的瘦弱男童。古兰静立一旁并未动手。'
    },
    {
      id: 'ed_wake_camp',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.ed_joined) &&
        !world.flags?.arrived_oakhaven &&
        !world.flags?.ed_awake &&
        (world.timeMin ?? 0) >= DAY(3, 20) &&
        world.playerLocation === 'wilds',
      effects: [
        { target: 'world', worldFlags: { ed_awake: true } },
        { target: 'ed', npcFlags: { ed_awake: true } }
      ],
      text: '夜幕降临，荒原营地篝火噼啪作响。白天救下的男童悠悠转醒，初时眼神空洞木然；在奥萝拉轻柔的圣光抚慰与妮丝耐心的呼唤下，他才回过神来放声大哭。在妮丝的柔声安抚中，男孩抽泣着吐露身世：自称是奥克赫斯镇上珠宝铺的孩子，随父母赴邻镇宴席半途突闻巨吼翻车，再次醒来便见父母血肉模糊护住自己，目睹野兽撕咬惨状后吓晕过去。妮丝抱紧他轻声宽慰野兽已除、父母已被好生收敛，欲言又止地替他遮掩惨象。看见这孩子，妮丝不禁想起当年与哥哥遭逢变故后被古兰收养的光景；古兰负手而立未多言语，伊丝娜正将刚煮好的热汤盛入木碗递来。'
    },
    {
      id: 'ed_arrive_oakhaven',
      mode: 'result',
      scope: 'world',
      // 严禁按天数强行传送抵镇；改为玩家实际抵镇（arrived_oakhaven）后触发珠宝铺交接与托孤
      when: ({ world }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        Boolean(world.flags?.ed_joined) &&
        Boolean(world.flags?.ed_awake) &&
        !world.flags?.ed_custody_active &&
        !world.flags?.ed_funeral_done &&
        !world.flags?.ed_permanently_joined &&
        TOWN_LOCATIONS.includes(world.playerLocation),
      effects: ({ world }) => [
        { target: 'world', goldDelta: 10, worldFlags: { ed_custody_active: true, ed_custody_day: dayAt(world) } },
        { target: 'ed', npcFlags: { ed_custody_active: true } }
      ],
      text: '顺利抵达边陲重镇奥克赫斯后，小队护送爱德前往镇上的银月珠宝铺，向惊愕的姐姐爱丽丝与舅舅席德通报了商队遇袭的噩耗。亲人悲痛难当，舅舅席德虽满面敷衍，仍迫于周遭商贩目光，甚是不情愿地摸出 10 枚混铸金币作为打发谢礼，并借口清点铺面收留爱德，恳请小队在安顿盘点的这几天里代为照料爱德。'
    },
    {
      id: 'ed_funeral_home',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const baseDay = world.flags?.ed_custody_day ?? arrivedDayOf(world)
        // 4 = 抵镇托孤后满 4 自然日且 08:00 后返家奔丧
        return Boolean(world.flags?.arrived_oakhaven) &&
          Boolean(world.flags?.ed_custody_active) &&
          !world.flags?.ed_funeral_done &&
          (world.timeMin ?? 0) >= DAY(baseDay + 4, 8) &&
          world.npcs?.ed?.location === 'inn'
      },
      effects: ({ world }) => [
        { target: 'world', worldFlags: { ed_funeral_done: true, ed_custody_active: false, ed_funeral_day: dayAt(world) } },
        { target: 'ed', move: 'town', forceMove: true, npcFlags: { ed_home_visiting: true } }
      ],
      text: '清晨，珠宝铺送来口信，父母的葬礼与账目盘点已准备就绪，爱德向小队众人礼貌道别后赶回家中参加丧礼，暂且离开旅店。'
    },
    {
      id: 'ed_uncle_betrayal_return',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const funeralDay = world.flags?.ed_funeral_day ?? (arrivedDayOf(world) + 4)
        return Boolean(world.flags?.ed_funeral_done) &&
          !world.flags?.ed_permanently_joined &&
          (world.timeMin ?? 0) >= DAY(funeralDay + 1, 8) &&
          world.playerLocation === 'inn'
      },
      effects: ({ world }) => [
        { target: 'world', worldFlags: { ed_permanently_joined: true, alice_hostage: true, ed_joined_perm_day: dayAt(world) } },
        { target: 'ed', move: 'inn', forceMove: true, npcFlags: { ed_home_visiting: false, ed_expelled_by_uncle: true } }
      ],
      text: '次日清晨，小队正在旅店一楼共进早饭，客栈木门被轻轻推开，离开一天的爱德再度出现。男孩眼中没有孩童应有的雀跃，反而透着不安与一种少见的决绝，小声提出想随小队学习冒险。在妮丝敏锐的开导与追问下，爱德终于忍不住红了眼眶放声哭泣，吐露了实情：舅舅席德在安葬父母后迅速接管了整座珠宝铺，借口生计将姐姐爱丽丝强行留在店里当柜员看管，却将自己以‘出门学艺’为由直接扫地出门。他抹着眼泪恳求小队接纳自己，并带着颤音担忧舅舅会对被扣下的姐姐图谋不轨。众人一阵讨论，同意了他的请求。'
    },
    {
      id: 'ed_guide_town',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) => {
        const permDay = world.flags?.ed_joined_perm_day ?? (arrivedDayOf(world) + 5)
        return Boolean(world.flags?.ed_permanently_joined) &&
          !world.flags?.ed_guide_town_done &&
          (world.timeMin ?? 0) >= DAY(permDay + 2, 8) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase?.id)
      },
      effects: [
        { target: 'world', worldFlags: { ed_guide_town_done: true } },
        { target: 'ed', npcFlags: { ed_town_guided: true } }
      ],
      text: '阳光洒在奥克赫斯由碎石铺就的集市大道上，空气里带着新鲜干草与麦粉的气味。走在身侧的爱德两手紧紧抓着衣角，脚步虽然细碎，引路却熟门熟路。“商行公会每天上午十点放榜，这时候门卫换班，容易看清告示栏上的急单；西街铁匠铺后巷有一口公用水井，去那里打水不用排队……”刚进队两天的男孩认真数着沿途各处门道，仰起小脸观察着同伴的神色，见大家点头，眉眼间才稍稍松下一口气，确认自己并不是吃闲饭的累赘。'
    },
    {
      id: 'ed_watch_store',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) => {
        const permDay = world.flags?.ed_joined_perm_day ?? (arrivedDayOf(world) + 5)
        return Boolean(world.flags?.ed_guide_town_done) &&
          !world.flags?.ed_watch_store_done &&
          (world.timeMin ?? 0) >= DAY(permDay + 5, 13) &&
          world.playerLocation === 'town' &&
          phase?.id === 'afternoon'
      },
      effects: [
        { target: 'world', worldFlags: { ed_watch_store_done: true } }
      ],
      text: '商业街中央广场北侧的遮阳木棚旁，爱德原本平稳的脚步忽然慢了下来，随后整个人退入木架阴影中。男孩伸手拉住同伴的衣角，目光直直看向斜对面的三层石楼——黄铜招牌上刻着“银月珠宝铺”。宽大的水晶橱窗后，身着墨绿细呢长裙的年轻女子正在柜台后清点托盘，神情端庄温和，眉宇间却满是化不开的疲惫。两名带棍的伙计守在阶前。“是姐姐爱丽丝……”爱德的声音压得极低，眼眶发红，“父母刚下葬，席德舅舅就带着借据占了铺子，把我赶到街上。可是姐姐从小最护着我，铺子也是父母的心血，为什么姐姐至今还在店里替舅舅照看生意，始终没有离开？”'
    },
    {
      id: 'ed_investigate_truth',
      mode: 'interaction',
      scope: 'world',
      when: ({ world, phase }) => {
        const permDay = world.flags?.ed_joined_perm_day ?? (arrivedDayOf(world) + 5)
        return Boolean(world.flags?.ed_watch_store_done) &&
          !world.flags?.alice_truth_revealed &&
          (world.timeMin ?? 0) >= DAY(permDay + 7, 10) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase?.id)
      },
      text: '街角茶棚的长凳旁，爱德双手紧紧绞着衣角，低着头停下了脚步。男孩眼圈泛红，仰起清瘦的小脸，声音带着难掩的急切与恳求：“{{user}}哥哥，这几天我一闭上眼就是姐姐在橱窗后面的样子……姐姐从小最护着我，铺子也是爹娘留下的，就算舅舅抢了账本，姐姐也绝不可能甘心留下来替他算账。我想不明白姐姐为什么不走，我想求求大家帮帮我，进店去见见姐姐，从姐姐口中得知真相！只要知道姐姐到底在怕什么、舅舅到底背着我跟姐姐说了什么，我们才能帮到她……”穿过马车道，银月珠宝铺门扉半掩，铜铃轻晃。柜台后的爱丽丝一身墨绿细呢长裙，双手交叠于身前，神态端庄娴静，眼底却带着商贾门面惯有的戒备与疏离。内堂账房帘子垂着，守在侧门边的伙计正低头擦拭长凳。前堂恰逢客流间隙，为执行爱德的请托、探明受困内情提供了近身契机。',
      outcomes: {
        probe_direct_mention: {
          text: '冷不防听到爱德的名字，爱丽丝眼底的端庄防备刹那间碎裂。在透过橱窗望见对街喷泉旁安然挥手的弟弟时，年轻女子手指死死扣紧柜沿，极力压低的声音终于颤抖着吐露了实情：父母下葬后，席德谎称爱德已被送往远郊工坊打工顶债，并以断绝爱德口粮与安危相要挟，逼迫她交出地契。获知弟弟实则被救下、一直在旅店安好的真相后，爱丽丝迅速决断，借理货之机将父母生前真实的收支账目底单悄然推过展布。',
          effects: ({ world }) => [
            { target: 'world', worldFlags: { alice_truth_revealed: true, alice_evidence_secured: true, alice_truth_day: dayAt(world) }, itemsAdd: [{ id: 'alice_ledger', count: 1 }] }
          ]
        },
        probe_inquire_debt: {
          text: '听到来者探问账目与债务详情，爱丽丝原本警惕的神色在察觉对方并无恶意后渐渐泛起凄苦。她借着整理饰品盒的动作遮掩，极力压低声音道出了内幕：席德拿出的借据纯系伪造，更以扣押在外当苦工的爱德性命相逼，逼她留在柜台撑门面兼祧完婚。当得知爱德根本未曾沦为人质、就在对街等候的事实后，年轻女子眼眶通红，咬牙下定决意，将藏有席德私账破绽与后堂钥匙的信封迅速塞入托盘底部。',
          effects: ({ world }) => [
            { target: 'world', worldFlags: { alice_truth_revealed: true, alice_evidence_secured: true, alice_truth_day: dayAt(world) }, itemsAdd: [{ id: 'alice_ledger', count: 1 }] }
          ]
        }
      }
    },
    {
      id: 'alice_rescue_resolve',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) => {
        const truthDay = world.flags?.alice_truth_day ?? (arrivedDayOf(world) + 12)
        return Boolean(world.flags?.alice_truth_revealed) &&
          !world.flags?.alice_rescued &&
          (world.timeMin ?? 0) >= DAY(truthDay + 2, 10) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase?.id)
      },
      effects: [
        {
          target: 'world',
          worldFlags: { alice_rescued: true, sid_expelled: true, ed_aspiration_adventurer: true },
          goldDelta: 40,
          itemsRemove: [{ id: 'alice_ledger', all: true }]
        },
        {
          target: 'ed',
          move: 'inn',
          forceMove: true,
          npcFlags: { ed_adventurer_role: true }
        }
      ],
      text: '上午十点，银月珠宝铺内客商云集。当活生生的爱德现身堂前、席德捏造债务欺瞒晚辈的事实被当众核对拆穿时，席德面色惨白，手中的茶盏失手摔碎在地。面对真实账据与随行护卫的冒险者小队阵势，席德深知触犯商会律令且无法自圆其说，在众人指责下交出账印，狼狈离开铺面。铺内重新平息。爱丽丝步出柜台抱住失而复得的弟弟，平复心绪后郑重奉上装有 40 枚混铸金币的酬金钱袋，感谢小队保全家业，并轻声唤爱德回家重理旧铺。八岁的男孩看了看熟悉的商铺，又转头望向晨光中的小队同伴，认真摇了摇头，向姐姐立誓：自己不想再做只能等待保护的雏鸟，而是要成为像大家一样能保护别人的真正冒险者，誓言留队继续历练，直至独当一面。爱丽丝欣慰应允，将弟弟正式托付给小队。'
    }
  ]

  // 爱德类型二：2 大普适循环日常事件池（每 3 自然日限 1 次，4 组动态情景轮替，不与主线或其他爱德日常叠弹）
  function hasPendingEdDaily(world) {
    return Object.values(world.bg?.eventStates || {}).some(st =>
      st?.status === 'pending' &&
      (String(st.definitionId || '').startsWith('ed_intercept_job_') ||
       String(st.definitionId || '').startsWith('ed_daily_perk_') ||
       st.definitionId === 'ed_investigate_truth')
    )
  }

  function buildEdTeachPatch(world) {
    const ed = world.npcs?.ed
    const nextCount = (ed?.flags?.ed_teach_count ?? 0) + 1
    // 3 = 爱德求生常识教学达标门槛，解锁潜行放哨与掩护能力
    const stealthReady = Boolean(ed?.flags?.ed_stealth_ready || nextCount >= 3)
    return {
      npcEffect: { target: 'ed', npcFlags: { ed_teach_count: nextCount, ed_stealth_ready: stealthReady } },
      stealthFlag: stealthReady ? { ed_stealth_ready: true } : {}
    }
  }

  const ED_PERK_VARIANTS = [
    {
      id: 'ed_daily_perk_1',
      freeLodging: true,
      text: '清晨大堂刚飘起麦粥香气，爱德提着空菜篮轻快地走过来，难掩欢喜地小声说：“{{user}}哥哥，我一大早帮旅店掌柜去集市大批采买蔬果，靠着以前街坊熟脸谈下了老主顾折让。掌柜心情大好，说今晚小队的 5 枚金币宿费给直接勾销了！”',
      acceptText: '你笑着夸奖爱德持家麻利，掌柜在柜台后摆摆手，在账本上勾销了小队今晚的 5 金房费。',
      teachText: '你拍拍爱德的肩叮嘱他别为了省钱累坏身子，跟掌柜商量把这份工钱折换成 5 金伙食贴补，顺便教他采买称重和量力而行的分寸。'
    },
    {
      id: 'ed_daily_perk_2',
      freeLodging: true,
      text: '爱德拍着粗麻衣袖上的木屑从地窖楼梯走上来，略带腼腆地汇报道：“{{user}}哥哥，刚运来的几只大麦酒桶我帮掌柜和伙计一块儿滚进地窖码整齐了。掌柜说省了雇短工的钱，直接给我们小队抵扣掉今晚的 5 金宿费！”',
      acceptText: '你替爱德拂去肩头灰尘，肯定了他的勤恳付出。旅店掌柜爽快记下免租，今晚宿费得以省下。',
      teachText: '你拉过爱德检查他发红的掌心，仔细教他搬运重物借力省劲的法子，并把这份劳务回扣折成 5 金干粮贴补收好。'
    },
    {
      id: 'ed_daily_perk_3',
      freeLodging: false,
      supplyGrant: 5,
      text: '爱德捧着一大包油纸裹好的熏肉与厚麦饼从后厨小步走出来，眉眼弯弯：“{{user}}哥哥，我清晨帮后厨清扫了肉架和灶台，手脚利落没偷嘴。厨子高兴，特意多切了够咱们省下一天露宿开销的熟肉麦饼作犒劳！”',
      acceptText: '你收下油纸包里的熟肉与麦饼并归入行囊补给（补给 +5），爱德听见夸奖笑得格外踏实。',
      teachText: '你让爱德先坐下分吃一块热麦饼补补力气，边整理干粮入囊（补给 +5）边教他野外保存肉干防潮防鼠的常识。'
    },
    {
      id: 'ed_daily_perk_4',
      freeLodging: false,
      text: '爱德手里攥着几枚亮闪闪的钱币快步凑到桌旁，小声说道：“{{user}}哥哥，前堂有两张长凳和侧门门闩松了，我一大早拿木楔全给修牢实了，省得掌柜再去请木匠。掌柜硬塞给我 5 枚金币当赏钱，正好能抵上今晚的房费！”',
      acceptText: '你接过爱德递来的 5 枚金币并夸他心灵手巧，男孩揉揉鼻尖，眉眼里透着帮上忙的满足。',
      teachText: '你收好 5 枚金币折作行囊补给，顺手握着爱德的手教他用木工活儿护住指节、干活留余力的门道，男孩听得聚精会神。'
    }
  ]

  // 必须先于公会急件注册：免租回扣仅限 inn+morning 窄窗口，先判可避免被宽窗口急件饿死
  ED_PERK_VARIANTS.forEach((variant, idx) => {
    EVENTS.push({
      id: variant.id,
      mode: 'interaction',
      repeatable: true,
      scope: 'world',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, phase }) =>
        Boolean(world.flags?.ed_permanently_joined && world.flags?.arrived_oakhaven && !isEileenFugitive(world)) &&
        world.playerLocation === 'inn' &&
        phase?.id === 'morning' &&
        world.npcs?.ed?.monitored === true &&
        world.npcs.ed.alive !== false &&
        !hasPendingEdDaily(world) &&
        // 3 = 爱德营生跑腿免租回扣冷却天数（每 3 自然日限触发 1 次）
        (!Number.isFinite(world.flags?.lastEdPerkDay) || (dayAt(world) - world.flags.lastEdPerkDay) >= 3) &&
        ((world.flags?.edPerkSlot ?? 0) % 4) === idx,
      expireWhen: ({ world, phase }) =>
        world.playerLocation !== 'inn' ||
        phase?.id !== 'morning' ||
        Boolean(isEileenFugitive(world)),
      text: variant.text,
      outcomes: {
        accept_perk: {
          text: variant.acceptText,
          effects: ({ world }) => {
            const worldFlags = {
              lastEdPerkDay: dayAt(world),
              edPerkSlot: (idx + 1) % 4,
              ...(variant.freeLodging ? { inn_free_pass_today: true } : {}),
              ...(variant.supplyGrant && world.flags?.supply_shortage ? { supply_shortage: false } : {})
            }
            if (variant.freeLodging) {
              return [{ target: 'world', worldFlags }]
            }
            if (variant.supplyGrant) {
              return [{ target: 'world', itemsAdd: [{ id: 'supply', count: variant.supplyGrant }], worldFlags }]
            }
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + 5
            if (world.flags?.inn_arrears && nextGold >= 5) worldFlags.inn_arrears = false
            return [{ target: 'world', goldDelta: 5, worldFlags }]
          }
        },
        trade_teach: {
          text: variant.teachText,
          effects: ({ world }) => {
            const teach = buildEdTeachPatch(world)
            if (variant.supplyGrant) {
              const worldFlags = {
                lastEdPerkDay: dayAt(world),
                edPerkSlot: (idx + 1) % 4,
                ...teach.stealthFlag,
                ...(world.flags?.supply_shortage ? { supply_shortage: false } : {})
              }
              return [{ target: 'world', itemsAdd: [{ id: 'supply', count: variant.supplyGrant }], worldFlags }, teach.npcEffect]
            }
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + 5
            const worldFlags = {
              lastEdPerkDay: dayAt(world),
              edPerkSlot: (idx + 1) % 4,
              ...teach.stealthFlag,
              ...(world.flags?.inn_arrears && nextGold >= 5 ? { inn_arrears: false } : {})
            }
            return [{ target: 'world', goldDelta: 5, worldFlags }, teach.npcEffect]
          }
        }
      }
    })
  })

  const ED_INTERCEPT_VARIANTS = [
    {
      id: 'ed_intercept_job_1',
      minutes: 180,
      gold: 10,
      text: '爱德一路小跑着拽住你的衣袖，额角沁着细汗，压低声音急切汇报：“{{user}}哥哥，快！公会门口刚来了一名急着离镇的外地行商，他的加急货样和文书落在了城外临时车马棚，天黑前必须取回来。公会走账要压到明天还要抽成，雇主正跟伙计发愁呢！现在去私洽接下，当场现结 10 枚金币，要是等抄上大木板，转眼就会被那群闲汉抢光！”',
      directText: '你当机立断赶往城外临时车马棚，趁着暮色未至把遗落的货样箱与封蜡文书完好交回行商手中。行商松了一口气，爽快按约现结了 10 枚金币。',
      teachText: '你带着爱德先核验了行商的通关货票与封条印记，教他识别真假雇主并顺势谈妥了快马赶路的脚力贴补。货样如期送达，行商爽快付清 12 枚金币，爱德在一旁把核验门道牢牢记在心里。'
    },
    {
      id: 'ed_intercept_job_2',
      minutes: 120,
      gold: 9,
      text: '爱德从集市方向气喘吁吁地奔回来，手指着天边聚拢的灰云提醒道：“{{user}}哥哥，集市大商行的管事正急得团团转！天眼看要落雨，货场里还有一批怕潮的细呢布匹和干草，必须在两个钟头内转进地窖。公会排人手来不及，现在直接过去搭把手，干完当场现结 9 枚金币！”',
      directText: '你赶在雨点砸落前与商行伙计一道把怕潮布匹和草捆稳妥转入干爽地窖。管事查验无损后满意点头，当场点清 9 枚金币交付。',
      teachText: '进货场前，你先指点爱德查看商行字号与货单件数，又替搬运重货的活计谈下 2 枚金币的防雨加急贴补。忙完后管事爽快结清 11 枚金币，爱德学会了接短工先核清权责的规矩。'
    },
    {
      id: 'ed_intercept_job_3',
      minutes: 240,
      gold: 12,
      text: '爱德紧跑几步拉住你的手腕，眼睛发亮地小声道：“{{user}}哥哥，镇郊农庄的庄园主刚在公会外拦人！他家一匹拉货的挽马受了惊，带着半车杂货窜进了近郊林缘。公会登记派单太慢，雇主说只要身手利落的战士立刻去循迹找回，当场现结 12 枚金币！”',
      directText: '你沿车辙与折枝一路追入近郊林缘，安抚住受惊的挽马并将货车稳妥牵回农庄。庄园主连声致谢，如数现结 12 枚金币。',
      teachText: '出发前你带着爱德辨认蹄印深浅、估算林缘风险，并向庄园主谈明进林搜寻的额外补给贴补。寻回挽马后雇主爽快付给 14 枚金币，爱德也记熟了野外循迹的要领。'
    },
    {
      id: 'ed_intercept_job_4',
      minutes: 60,
      gold: 8,
      bonusSupply: 1,
      text: '爱德抱着胳膊快步凑过来，语速偏快地说道：“{{user}}哥哥，镇上药铺掌柜急着找脚程快的人！镇南有户病家等着刚煎配好的退热汤剂，药铺伙计全派出去了脱不开身。不用走公会抽水，现在送过去就能现结 8 枚金币，掌柜还说多捎一份草药补给！”',
      directText: '你妥帖护着药罐快步穿过街巷，趁药汤尚温送到了镇南病家门前。返程后药铺掌柜松了口气，爽快结清 8 枚金币并另捎 1 份补给。',
      teachText: '接药时你先教爱德核对药封标签与病家住址，提醒他贵重急件务必当面签收，并向掌柜谈妥 2 枚金币的急送脚费。差事办妥后入账 10 枚金币与 1 份补给，爱德把跑腿核单的细节暗暗记牢。'
    }
  ]

  ED_INTERCEPT_VARIANTS.forEach((variant, idx) => {
    const canComplete = ctx => {
      const start = workStart(ctx, variant.minutes)
      const pending = ctx.world.bg.eventStates[JSON.stringify(['event', variant.id, null])]
      return start !== null && start >= (pending?.triggeredAt ?? 0) && !workCooldownWait(ctx.world, 'lastEdIntercept', start, 3)
    }
    EVENTS.push({
      id: variant.id,
      settleAtEnd: true,
      mode: 'interaction',
      repeatable: true,
      scope: 'world',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, phase }) =>
        Boolean(world.flags?.ed_permanently_joined && world.flags?.arrived_oakhaven && !isEileenFugitive(world)) &&
        ['inn', 'town'].includes(world.playerLocation) &&
        ['morning', 'afternoon'].includes(phase?.id) &&
        world.npcs?.ed?.monitored === true &&
        world.npcs.ed.alive !== false &&
        !hasPendingEdDaily(world) &&
        // 3 = 爱德公会急件抢截冷却天数（每 3 自然日限触发 1 次）
        !workCooldownWait(world, 'lastEdIntercept', world.timeMin, 3) &&
        ((world.flags?.edInterceptSlot ?? 0) % 4) === idx,
      expireWhen: ({ world, phase }) =>
        !['inn', 'town'].includes(world.playerLocation) ||
        !['morning', 'afternoon'].includes(phase?.id) ||
        Boolean(isEileenFugitive(world)),
      text: variant.text,
      outcomes: {
        accept_direct: {
          when: canComplete,
          text: variant.directText,
          effects: ({ world }) => {
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + variant.gold
            const worldFlags = {
              ...completedWorkFlags(world),
              lastEdInterceptDay: dayAt(world),
              lastEdInterceptStartMin: world.timeMin - variant.minutes,
              edInterceptSlot: (idx + 1) % 4,
              ...(world.flags?.inn_arrears && nextGold >= 5 ? { inn_arrears: false } : {}),
              ...(variant.bonusSupply && world.flags?.supply_shortage ? { supply_shortage: false } : {})
            }
            const worldEffect = { target: 'world', goldDelta: variant.gold, worldFlags }
            if (variant.bonusSupply) worldEffect.itemsAdd = [{ id: 'supply', count: variant.bonusSupply }]
            return [worldEffect]
          }
        },
        negotiate_teach: {
          when: canComplete,
          text: variant.teachText,
          effects: ({ world }) => {
            const gain = variant.gold + 2
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + gain
            const teach = buildEdTeachPatch(world)
            const worldFlags = {
              ...completedWorkFlags(world),
              lastEdInterceptDay: dayAt(world),
              lastEdInterceptStartMin: world.timeMin - variant.minutes,
              edInterceptSlot: (idx + 1) % 4,
              ...teach.stealthFlag,
              ...(world.flags?.inn_arrears && nextGold >= 5 ? { inn_arrears: false } : {}),
              ...(variant.bonusSupply && world.flags?.supply_shortage ? { supply_shortage: false } : {})
            }
            const worldEffect = { target: 'world', goldDelta: gain, worldFlags }
            if (variant.bonusSupply) worldEffect.itemsAdd = [{ id: 'supply', count: variant.bonusSupply }]
            return [worldEffect, teach.npcEffect]
          }
        }
      }
    })
  })

  EVENTS.push({
    id: 'mystery_orb_merchant',
    mode: 'interaction',
    scope: 'world',
    when: ({ world }) =>
      Boolean(world.flags?.arrived_oakhaven) &&
      !world.flags?.crystal_orb_unlocked &&
      !world.flags?.orb_merchant_done &&
      world.playerLocation === 'town',
    text:
      '【强制落单事件：神秘人】此时伯里独自一人在奥克赫斯镇上闲逛（本事件强制玩家落单，周围没有其他在场角色，同伴均暂不在身旁、不得插话）。' +
      '一名神秘人迎面走来，看到伯里时笑着说他身上有熟悉又讨厌的气息，随后向他兜售一枚仅售 1 金币的水晶球。' +
      '她声称这枚水晶球能预示未来和揭示过去，但其中的内容只有伯里自己能看见，并特意推销道：“它能让你看见很多你想看见的东西。等你回去，可以试着对着你的同伴试试。”' +
      '【说话特点】玩家第一次提问时，她会先说：“这是个好问题。”其余所有回答都必须保持礼貌但全程打太极、永不下定论的腔调（习惯用“你说得不完全不对，但这并不能直接说明……”“更准确地说，这不足以证明……”“它不代表一定可行，也不能简单视为已经确认”“换言之，现在不能断言、不能保证、不能仅凭这一点就当作定论”“我不是说不能做，而是不能只看表面，还需要更多证据，才能更全面地说明这到底是不是那么一回事”）。' +
      '【强制成交】1 金币等于白送；就算玩家拒绝或表示不想要，她也会强行把水晶球塞进伯里手中（若有 1 金币则顺手收走，没有也照样强塞），最终在最多 2 楼的问答后凭空消失。',
    outcomes: {
      accept: {
        text: '伯里收下了那枚神秘的水晶球，神秘人随即笑着凭空消失在街角。',
        effects: { goldDelta: -1, worldFlags: { crystal_orb_unlocked: true, orb_merchant_done: true } }
      },
      refuse: {
        text: '即便伯里嘴上推辞，神秘人依然强行把水晶球塞进了他的手里，随后凭空消失得无影无踪。',
        effects: { goldDelta: -1, worldFlags: { crystal_orb_unlocked: true, orb_merchant_done: true } }
      }
    }
  })

  function makeNpc(cfg) {
    const hasStage = cfg.hasStage !== false
    const hasAffection = cfg.hasAffection !== false
    const values = { ...(cfg.values || {}) }
    const npc = {
      id: cfg.id,
      name: cfg.name,
      monitored: cfg.monitored !== false,
      alive: true,
      hasStage,
      hasAffection,
      homeLocation: cfg.homeLocation || cfg.location,
      location: cfg.location,
      values,
      plan: (cfg.plan || []).slice(),
      nodePlan: hasStage ? (cfg.nodePlan || []).slice() : [],
      activity: null,
      activityHistory: {},
      nodeStates: {},
      flags: {},
      lastAction: null,
      _baseline: { ...values },
      _metricBounds: { ...(cfg.metricBounds || {}) }
    }
    if (hasStage) npc.stage = cfg.stage ?? 0
    return npc
  }

  const ROSTER = [
    makeNpc({
      id: 'gulan', name: '古兰', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { blood_density: 0, affection: 70 },
      metricBounds: { blood_density: [0, 100], affection: [0, 100] },
      nodePlan: ['gulan_stage_1', 'gulan_stage_2', 'gulan_stage_3'],
      plan: ['gulan_inn_maintenance', 'gulan_hall_meditate', 'gulan_town_patrol', 'gulan_train', 'gulan_dragon_search', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'isna', name: '伊丝娜', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { gold_desire: 25, affection: 60 },
      metricBounds: { gold_desire: [0, 100], affection: [0, 100] },
      nodePlan: ['isna_stage_1', 'isna_stage_2', 'isna_stage_3'],
      plan: ['isna_mud_camp_night', 'isna_odd_job', 'isna_inn_nap', 'isna_knife_sharpen', 'isna_town_rumors', 'isna_buy_jerky', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'nise', name: '妮丝', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { curiosity: 40, gamble_debt: 0, affection: 70 },
      metricBounds: { curiosity: [0, 100], gamble_debt: [0, 100], affection: [0, 100] },
      nodePlan: ['nise_stage_1', 'nise_stage_2', 'nise_stage_3'],
      plan: ['nise_contract_stay', 'nise_secretary_shift', 'nise_dealer_shift', 'nise_town_browse', 'nise_inn_sleep_in', 'nise_read_scrolls', 'nise_hall_tea', 'nise_hall_bard', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'aurora', name: '奥萝拉', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { debt_pressure: 100, affection: 50 },
      metricBounds: { debt_pressure: [0, 100], affection: [0, 100] },
      nodePlan: ['aurora_stage_1', 'aurora_stage_2', 'aurora_stage_3'],
      plan: ['aurora_post_purge_return', 'aurora_manor_work', 'aurora_weekend_return', 'aurora_weekend_church', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'eileen', name: '艾琳', monitored: false, location: 'manor', homeLocation: 'manor',
      hasStage: true, hasAffection: true,
      values: { counterattack: 0, affection: 0 },
      metricBounds: { counterattack: [0, 100], affection: [0, 100] },
      nodePlan: ['eileen_stage_1', 'eileen_stage_2', 'eileen_stage_3'],
      plan: ['eileen_post_purge_return', 'return_manor', 'idle_rest']
    }),
    makeNpc({
      id: 'cecilia', name: '塞西莉亚', location: 'church', homeLocation: 'church',
      hasStage: true, hasAffection: true,
      values: { orphanage_funds: 50, donated_gold: 0, affection: 20 },
      metricBounds: { orphanage_funds: [0, 100], donated_gold: [0, 999999], affection: [0, 100] },
      nodePlan: ['cecilia_stage_1', 'cecilia_stage_2', 'cecilia_stage_3'],
      plan: ['return_church', 'idle_rest']
    }),
    makeNpc({
      id: 'ed', name: '爱德', monitored: false, location: 'wilds', homeLocation: 'inn',
      hasStage: false, hasAffection: false,
      values: { patience: 100 },
      metricBounds: { patience: [0, 100] },
      nodePlan: [],
      plan: ['ed_inn_chores', 'return_inn', 'idle_rest']
    })
  ]

  function buildInitialWorld() {
    const npcs = {}
    for (const n of ROSTER) {
      npcs[n.id] = JSON.parse(JSON.stringify(n))
      npcs[n.id]._baseline = { ...n.values }
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      timeMin: 18 * 60,
      playerLocation: 'wilds',
      // 30 = 开局小队公用盘缠（按每日5金食宿，维持全队极限生存6天）
      playerState: { gold: 30, inventory: [{ id: 'supply', count: 10 }], pendingEchoes: [] },
      interactingIds: [],
      tags: {},
      flags: {
        ed_joined: false,
        arrived_oakhaven: false,
        crystal_orb_unlocked: false,
        orb_merchant_done: false,
        orb_merchant_turns: 0,
        arrivedDay: null,
        playerRoomTarget: null,
        inn_arrears: false,
        supply_shortage: false,
        lastInnSettledDay: 0,
        playerOddJobDay: null,
        lastGuildCommissionDay: null,
        lastChurchErrandDay: null,
        orc_camp_bounty_paid: false,
        lancaster_purge_reward_paid: false,
        eileen_arrived: false,
        eileen_departed: false,
        eileen_fugitive: false,
        eileen_signal_fired: false,
        baron_purged: false,
        player_barony_granted: false
      },
      npcs
    }
  }

  root.OKH_APP_DATA = Object.freeze({
    SCHEMA_VERSION, DAY, WEEKDAYS, weekdayOf, isWeekendDay, weekdayLabel,
    PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ITEM_CATALOG,
    ACTIONS, NODES, EVENTS, ROSTER, buildInitialWorld,
    isEileenFugitive, hasEileenSignal, eileenEscortOpen, churchAudience, canTakeWeeklyRuin, getChurchWeeklyRuin,
    WORK_LIMITS, WORK_TERMS, workStart, paidWorkSettledToday, workCooldownWait, recentGuildStarts, completedWorkFlags,
    DRAGON_TRUE_FORM_SPEC, buildDragonRevealText
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_DATA
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

