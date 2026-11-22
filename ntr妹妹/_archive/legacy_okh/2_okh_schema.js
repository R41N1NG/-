/**
 * @module      okh_schema
 * @updated     2026-11-08 20:05
 * @status      active
 * @reason      定义通用数据结构与默认值。本模块不认识任何具体角色，只认识"结构"
 * @deps        ['okh_boot', 'okh_core']
 * @provides    { DRIVES, LINE_TYPES, STAGES, makeNpc, makeAction, validate, stageOf }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_schema 加载失败：注册表不存在'); return }

  // ============================================================
  // 一、通用枚举（不针对任何角色）
  // ============================================================

  /** 驱动力维度：所有角色共用同一套坐标 */
  const DRIVES = {
    pride:     '自尊',
    duty:      '责任',
    lust:      '欲望',
    fear:      '恐惧',
    shame:     '羞耻',
    need:      '匮乏',
    curiosity: '好奇',
    loyalty:   '忠诚'
  }

  /** 底线类型：类型决定它能封锁什么，具体阈值由角色配置 */
  const LINE_TYPES = {
    no_physical_contact: '不与某类人发生身体接触',
    no_admit:            '不向某人承认某事',
    never_abandon:       '永远不抛弃某人',
    resist:              '遭到侵害时会反抗',
    no_public_shame:     '不在公众场合失态',
    keep_secret:         '守住某个秘密'
  }

  /** 堕落阶段 */
  const STAGES = ['normal', 'anomaly', 'sinking', 'subjugated']

  /** 阶段阈值 */
  const STAGE_THRESHOLD = { anomaly: 30, sinking: 55, subjugated: 80 }

  // ============================================================
  // 一·补、地点与时段（唯一真源，别处只准引用 key，不准写字面量）
  // ============================================================

  /** 地点表：加地点只改这里 */
  const LOCATIONS = {
    town:   { name: '镇上',  outdoor: true  },
    inn:    { name: '旅店',  outdoor: false },
    church: { name: '教堂',  outdoor: false },
    manor:  { name: '领主府', outdoor: false },
    casino: { name: '赌场',  outdoor: false }
  }

  /** 时段表：当日分钟边界。加时段只改这里 */
  const PHASES = [
    { key: 'deep_night', name: '深夜', from: 0,    to: 360  },
    { key: 'morning',    name: '上午', from: 360,  to: 600  },
    { key: 'afternoon',  name: '午后', from: 600,  to: 1020 },
    { key: 'night',      name: '夜晚', from: 1020, to: 1380 },
    { key: 'deep_night', name: '深夜', from: 1380, to: 1440 }
  ]

  /**
   * 由分钟推时段 key
   * @param {number} totalMin
   * @returns {string}
   */
  function phaseOf(totalMin) {
    const m = ((totalMin % 1440) + 1440) % 1440
    const hit = PHASES.find(p => m >= p.from && m < p.to)
    return (hit || PHASES[0]).key
  }

  /** 默认开局地点（唯一的硬编码点，集中在这里） */
  const DEFAULT_ROOM = 'inn'

  /**
   * 校验地点 key 是否存在
   * @param {string} key
   * @returns {boolean}
   */
  function isLocation(key) {
    return Object.prototype.hasOwnProperty.call(LOCATIONS, key)
  }

  /**
   * 校验时段 key 是否存在
   * @param {string} key
   * @returns {boolean}
   */
  function isPhase(key) {
    return PHASES.some(p => p.key === key)
  }

  // ============================================================
  // 二、构造器
  // ============================================================

  /**
   * 由驱动力值推导阶段
   * @param {number} corruption
   * @returns {string}
   */
  function stageOf(corruption) {
    if (corruption >= STAGE_THRESHOLD.subjugated) return 'subjugated'
    if (corruption >= STAGE_THRESHOLD.sinking) return 'sinking'
    if (corruption >= STAGE_THRESHOLD.anomaly) return 'anomaly'
    return 'normal'
  }

  /**
   * 造一个 NPC（所有字段都有默认值，只传想改的）
   * @param {string} id
   * @param {object} cfg
   * @returns {object}
   */
  function makeNpc(id, cfg = {}) {
    const drives = { ...(cfg.drives || {}) }
    const baseline = { ...(cfg.baseline || cfg.drives || {}) }

    return {
      id,
      name: cfg.name || id,
      archetype: cfg.archetype || 'neutral',   // 影响翻译文风，见 translate
      alive: cfg.alive !== false,

      // 心智
      drives,
      baseline,
      corruption: cfg.corruption ?? 0,
      sanity: cfg.sanity ?? 80,
      exposure: cfg.exposure ?? 0,
      stage: stageOf(cfg.corruption ?? 0),

      // 空间
      location: cfg.location || 'unknown',
      schedule: cfg.schedule || {},

      // 行为
      actions: cfg.actions || [],       // 引用全局行动 id
      actionOverrides: cfg.actionOverrides || {},  // 个体化的行动参数覆盖
      lines: cfg.lines || [],
      history: cfg.history || [],

      // 出场
      priority: cfg.priority ?? 1,
      absent: cfg.absent || null,
      cue: cfg.cue || '',

      /** 是否纳入监听面板（true = 每轮输出她的位置与状态） */
      monitored: cfg.monitored !== false,

      // 文案（可选：角色自定义，留空则用通用模板）
      textOverride: cfg.textOverride || null,
      baseText: cfg.baseText || ''      // 原始心智描述，供 translate 拼接
    }
  }

  /**
   * 造一个行动
   * @param {string} id
   * @param {object} cfg
   * @returns {object}
   */
  function makeAction(id, cfg = {}) {
    return {
      id,
      label: cfg.label || id,
      base: cfg.base ?? 20,
      tags: cfg.tags || [],
      stage: cfg.stage || null,          // 限定阶段，null = 不限
      requires: {
        phase: cfg.requires?.phase || null,
        location: cfg.requires?.location || null,
        drives: cfg.requires?.drives || {},
        flags: cfg.requires?.flags || {},
        corruption: cfg.requires?.corruption || null,
        history: cfg.requires?.history || {}
      },
      effects: {
        drives: cfg.effects?.drives || {},
        corruption: cfg.effects?.corruption ?? 0,
        sanity: cfg.effects?.sanity ?? 0,
        exposure: cfg.effects?.exposure ?? 0,
        move: cfg.effects?.move || null,
        setFlags: cfg.effects?.setFlags || {}
      },
      blockedBy: cfg.blockedBy || [],    // 底线类型数组
      narration: cfg.narration || ''
    }
  }

  // ============================================================
  // 三、校验
  // ============================================================

  /**
   * 校验 NPC 结构
   * @param {object} npc
   * @returns {{ok:boolean, errors:string[]}}
   */
  function validateNpc(npc) {
    const errors = []
    if (!npc || typeof npc !== 'object') return { ok: false, errors: ['不是对象'] }
    if (!npc.id) errors.push('缺 id')
    if (typeof npc.corruption !== 'number') errors.push('corruption 必须是数字')
    if (npc.corruption < 0 || npc.corruption > 100) errors.push('corruption 超出 0-100')
    for (const k of Object.keys(npc.drives || {})) {
      if (!DRIVES[k]) errors.push(`未知驱动力：${k}`)
      if (typeof npc.drives[k] !== 'number') errors.push(`${k} 必须是数字`)
    }
    for (const l of npc.lines || []) {
      if (!l.id) errors.push('底线缺 id')
      if (!l.holdsWhile) errors.push(`底线 ${l.id} 缺 holdsWhile`)
    }
    return { ok: errors.length === 0, errors }
  }

  /**
   * 校验行动结构
   * @param {object} action
   * @returns {{ok:boolean, errors:string[]}}
   */
  function validateAction(action) {
    const errors = []
    if (!action || typeof action !== 'object') return { ok: false, errors: ['不是对象'] }
    if (!action.id) errors.push('缺 id')
    if (typeof action.base !== 'number') errors.push('base 必须是数字')
    return { ok: errors.length === 0, errors }
  }

  // ============================================================
  // 四、注册
  // ============================================================

  REG.modules.schema = {
    DRIVES, LINE_TYPES, STAGES, STAGE_THRESHOLD,
    LOCATIONS, PHASES, phaseOf, isLocation, isPhase, DEFAULT_ROOM,
    stageOf, makeNpc, makeAction, validateNpc, validateAction
  }

  console.log('[OKH] schema 已就绪 · 驱动力 ' + Object.keys(DRIVES).length +
              ' 维 / 地点 ' + Object.keys(LOCATIONS).length + ' 处')
})()
