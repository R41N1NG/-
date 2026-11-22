/**
 * @module okh_app_config
 * @updated 2026-11-09 06:40
 * @status  demo
 * @reason  基于 GPT 核心的配置。全部为示例数据，不是定稿
 * @deps    无（纯数据 + 少量纯函数）
 * @provides { buildConfig, buildInitialWorld, LINES, CHARACTER_IDS }
 *
 * ============================================================
 * ⚠️ 本文件中的角色、行动、事件、节点全部是占位示例
 *    目的是让 GPT 的核心能跑起来，不是项目定稿。
 * ============================================================
 */

(function (root) {
  'use strict'

  // ============================================================
  // 一、时段（GPT 要求：从 0 开始、递增、id 唯一）
  // ============================================================

  const PHASES = [
    { id: 'deep_night', start: 0 },      // 00:00 – 06:00
    { id: 'morning',    start: 360 },    // 06:00 – 10:00
    { id: 'afternoon',  start: 600 },    // 10:00 – 17:00
    { id: 'night',      start: 1020 }    // 17:00 – 24:00
  ]

  // ============================================================
  // 二、底线表（用 GPT 的 allowed 钩子实现）
  //    holdsWhile 里用的是 GPT 的比较对象语法
  // ============================================================

  const LINES = {
    no_physical_contact: {
      type: 'no_physical_contact',
      holdsWhile: { corruption: { lt: 30 } }
    },
    no_admit: {
      type: 'no_admit',
      holdsWhile: { corruption: { lt: 70 } }
    },
    never_abandon: {
      type: 'never_abandon',
      holdsWhile: {}          // 永不解除
    },
    resist: {
      type: 'resist',
      holdsWhile: { corruption: { lt: 75 } }
    },
    no_public_shame: {
      type: 'no_public_shame',
      holdsWhile: { corruption: { lt: 65 } }
    }
  }

  // ============================================================
  // 三、行动库（GPT 格式）
  //    priority 对应原来的 base
  //    blockedBy 通过 allowed 钩子生效
  // ============================================================

  const ACTIONS = [
    // ── 生计 ──
    {
      id: 'work_shift', priority: 28,
      when: { phase: ['morning', 'afternoon'], metrics: { need: { gt: 50 } } },
      effects: { add: { need: -12, fear: 2 } },
      occupation: { kind: 'ordinary', label: '去做工' }
    },
    {
      id: 'work_extra', priority: 20,
      when: { metrics: { need: { gt: 60 } } },
      effects: { add: { need: -18, shame: 4, corruption: 2, exposure: 2 } },
      occupation: { kind: 'ordinary', label: '接私活' }
    },
    {
      id: 'trade', priority: 16,
      when: { phase: ['morning', 'afternoon'] },
      effects: { add: { need: -8 } },
      occupation: { kind: 'ordinary', label: '做点买卖' }
    },

    // ── 日常 ──
    {
      id: 'pray', priority: 24,
      when: {},
      effects: { add: { shame: -6, duty: 3, fear: -3, sanity: 3 } },
      occupation: { kind: 'ordinary', label: '去祈祷' }
    },
    {
      id: 'rest', priority: 18,
      when: {},
      effects: { add: { fear: -4, sanity: 2 } },
      occupation: { kind: 'ordinary', label: '歇着' }
    },
    {
      id: 'care', priority: 22,
      when: {},
      effects: { add: { duty: 5, shame: -4, sanity: 4 } },
      occupation: { kind: 'ordinary', label: '去照顾人' }
    },
    {
      id: 'visit_bond', priority: 20,
      when: {},
      effects: { add: { loyalty: 6, need: -2 } },
      occupation: { kind: 'ordinary', label: '去看望亲近的人' }
    },
    {
      id: 'socialize', priority: 17,
      when: {},
      effects: { add: { shame: -5, curiosity: 3, exposure: 1 } },
      occupation: { kind: 'ordinary', label: '和人应酬' }
    },

    // ── 越界边缘 ──
    {
      id: 'serve', priority: 22,
      when: { metrics: { need: { gt: 55 } } },
      effects: { add: { need: -20, shame: 10, fear: 5, corruption: 6, exposure: 3 } },
      occupation: { kind: 'important', label: '去侍奉' },
      blockedBy: ['no_physical_contact']
    },
    {
      id: 'gamble', priority: 18,
      when: { metrics: { curiosity: { gt: 45 } } },
      effects: { add: { curiosity: -5, lust: 4, fear: 5, corruption: 3, exposure: 3 } },
      occupation: { kind: 'ordinary', label: '去赌一把' }
    },
    {
      id: 'drink', priority: 16,
      when: {},
      effects: { add: { fear: -6, shame: -5, corruption: 1 } },
      occupation: { kind: 'ordinary', label: '去喝一杯' }
    },
    {
      id: 'indulge', priority: 14,
      when: { metrics: { corruption: { gte: 30 } } },
      effects: { add: { shame: 8, lust: 8, corruption: 8, exposure: 4 } },
      occupation: { kind: 'important', label: '放纵一次' },
      blockedBy: ['no_physical_contact']
    },

    // ── 探索 / 危险 ──
    {
      id: 'explore', priority: 17,
      when: { metrics: { curiosity: { gt: 50 } } },
      effects: { add: { curiosity: -8, fear: 4, exposure: 1 } },
      occupation: { kind: 'ordinary', label: '去看看' }
    },
    {
      id: 'sneak', priority: 15,
      when: { phase: ['night'] },
      effects: { add: { fear: 6, curiosity: -4, corruption: 2, exposure: 3 } },
      occupation: { kind: 'ordinary', label: '偷偷出去' }
    },
    {
      id: 'resist', priority: 20,
      when: { metrics: { pride: { gt: 60 } } },
      effects: { add: { pride: 4, fear: 4, sanity: 2 } },
      occupation: { kind: 'ordinary', label: '顶回去' }
    },
    {
      id: 'submit', priority: 18,
      when: {},
      effects: { add: { shame: 5, fear: 3, corruption: 3 } },
      occupation: { kind: 'ordinary', label: '忍下来' }
    },

    // ── 掩饰 ──
    {
      id: 'conceal', priority: 19,
      when: { metrics: { corruption: { gte: 20 } } },
      effects: { add: { fear: 3, shame: 4, exposure: -8 } },
      occupation: { kind: 'ordinary', label: '把事瞒下来' }
    },
    {
      id: 'confess', priority: 12,
      when: { metrics: { loyalty: { gt: 65 } } },
      effects: { add: { shame: -10, loyalty: 5, sanity: 5, exposure: -3 } },
      occupation: { kind: 'ordinary', label: '说出来' }
    },
    {
      id: 'show_off', priority: 15,
      when: {},
      effects: { add: { pride: 6 } },
      occupation: { kind: 'ordinary', label: '显摆一下' }
    }
  ]

  // ============================================================
  // 四、阶段节点（GPT 的核心推进方式）
  // ============================================================

  const NODES = [
    {
      id: 'stage_1', mode: 'result', fromStage: 0, toStage: 1,
      when: { metrics: { corruption: { gte: 30 } } },
      text: '{name}最近有些不一样了，说不上来哪里不对。'
    },
    {
      id: 'stage_2', mode: 'result', fromStage: 1, toStage: 2,
      when: { metrics: { corruption: { gte: 55 } } },
      text: '{name}已经不太解释了，也不再遮掩。'
    },
    {
      id: 'stage_3', mode: 'result', fromStage: 2, toStage: 3,
      when: { metrics: { corruption: { gte: 80 } } },
      text: '{name}不再提以前的事，仿佛那些从没发生过。'
    }
  ]

  // ============================================================
  // 五、世界事件（GPT 格式）
  //    时间换算：第 N 天 06:00 = (N-1)*1440 + 360
  // ============================================================

  const DAY = (n, hour = 6) => (n - 1) * 1440 + hour * 60

  const EVENTS = [
    {
      id: 'lord_hiring', mode: 'result', scope: 'world',
      when: { time: { gte: DAY(1, 6) }, phase: ['morning', 'afternoon'] },
      text: '领主府放出消息，说要招几个手脚勤快的女仆，工钱给得比镇上高出一截。',
      effects: { worldFlags: { lord_hiring: true } }
    },
    {
      id: 'casino_open', mode: 'result', scope: 'world',
      when: { time: { gte: DAY(2, 17) }, phase: ['night'] },
      text: '镇子东头那家赌场重新开张了，门口站着两个黑塔一样的保镖。',
      effects: { worldFlags: { casino_unlocked: true } }
    },
    {
      id: 'debt_collector', mode: 'result', scope: 'npc',
      targets: ['aurora'],
      when: { time: { gte: DAY(3, 12) }, phase: ['afternoon', 'night'] },
      text: '有人在旅店门口堵住了{name}，声音不大，但说得很清楚。',
      effects: { add: { need: 15, fear: 12, shame: 8 } }
    },
    {
      id: 'eileen_arrive', mode: 'result', scope: 'npc',
      targets: ['eileen'],
      when: { time: { gte: DAY(4, 6) }, phase: ['morning', 'afternoon'] },
      text: '一队人马从东边官道进了镇，打头的是个穿白金制服的年轻女人。',
      effects: { move: 'manor', worldFlags: { eileen_arrived: true } }
    },
    {
      id: 'convent_shortage', mode: 'result', scope: 'npc',
      targets: ['cecilia'],
      when: { time: { gte: DAY(5, 6) }, phase: ['morning', 'afternoon'] },
      text: '修道院的存粮见了底，孩子们一天只吃一顿。',
      effects: { add: { need: 20, duty: 10 } }
    },
    {
      id: 'first_crack', mode: 'result', scope: 'npc',
      when: { metrics: { corruption: { gte: 30 } }, phase: ['night'] },
      text: '镇上开始有人私下议论，说某个人的样子不太一样了。',
      effects: { worldFlags: { rumor_started: true } }
    },
    {
      id: 'lord_moves', mode: 'result', scope: 'world',
      when: { time: { gte: DAY(6, 0) } },
      text: '领主府的管事开始频繁地派人来镇上走动，说是办事，眼睛却在到处看。',
      effects: { worldFlags: { lord_aggressive: true } }
    }
  ]

  // ============================================================
  // 六、角色（初始 world 用）
  // ============================================================

  const ALL_DRIVES = ['pride', 'duty', 'lust', 'fear', 'shame', 'need', 'curiosity', 'loyalty']

  /**
   * 造一个角色
   * @param {object} cfg
   * @returns {object}
   */
  function makeNpc(cfg) {
    const values = {}
    for (const k of ALL_DRIVES) values[k] = cfg.drives?.[k] ?? 0
    values.corruption = cfg.corruption ?? 0
    values.sanity = cfg.sanity ?? 80
    values.exposure = cfg.exposure ?? 0

    return {
      id: cfg.id,
      name: cfg.name,
      monitored: true,
      alive: true,
      location: cfg.location,
      values,
      stage: 0,
      plan: cfg.plan.slice(),
      nodePlan: ['stage_1', 'stage_2', 'stage_3'],
      activity: null,
      activityHistory: {},
      nodeStates: {},
      flags: {},
      lastAction: null,
      // 桥接私用：基线，用于漂移
      _baseline: { ...values },
      // 桥接私用：底线
      _lines: (cfg.lines || []).slice()
    }
  }

  const ROSTER = [
    makeNpc({
      id: 'aurora', name: '奥萝拉', location: 'church',
      drives: { duty: 70, shame: 65, fear: 50, need: 75, loyalty: 60 },
      plan: ['work_shift', 'work_extra', 'pray', 'care', 'visit_bond', 'serve', 'conceal', 'confess', 'rest'],
      lines: ['no_physical_contact', 'no_admit', 'never_abandon']
    }),
    makeNpc({
      id: 'nise', name: '妮丝', location: 'inn',
      drives: { pride: 80, curiosity: 75, lust: 40, fear: 30 },
      plan: ['show_off', 'gamble', 'explore', 'sneak', 'socialize', 'drink', 'resist', 'rest', 'indulge'],
      lines: ['no_admit', 'never_abandon']
    }),
    makeNpc({
      id: 'eileen', name: '艾琳', location: 'manor',
      drives: { pride: 95, duty: 70, fear: 45, shame: 55 },
      plan: ['resist', 'work_shift', 'pray', 'socialize', 'explore', 'conceal', 'submit', 'rest'],
      lines: ['no_public_shame', 'resist']
    }),
    makeNpc({
      id: 'cecilia', name: '塞西莉亚', location: 'church',
      drives: { duty: 85, loyalty: 80, shame: 70, need: 60 },
      plan: ['care', 'pray', 'work_shift', 'serve', 'conceal', 'confess', 'submit', 'rest'],
      lines: ['never_abandon', 'no_public_shame']
    }),
    makeNpc({
      id: 'gulan', name: '古兰', location: 'inn',
      drives: { pride: 75, duty: 90, fear: 20, loyalty: 85 },
      plan: ['work_shift', 'resist', 'care', 'rest', 'socialize', 'explore'],
      lines: ['no_public_shame']
    })
  ]

  // ============================================================
  // 七、配置构造
  // ============================================================

  /**
   * 判断某角色某条底线是否仍然有效
   * @param {object} line
   * @param {object} values
   * @returns {boolean}
   */
  function lineHolds(line, values) {
    for (const [k, cond] of Object.entries(line.holdsWhile || {})) {
      const v = values[k] ?? 0
      for (const [op, n] of Object.entries(cond)) {
        const ok = op === 'gt' ? v > n
                 : op === 'gte' ? v >= n
                 : op === 'lt' ? v < n
                 : op === 'lte' ? v <= n
                 : op === 'eq' ? v === n
                 : op === 'ne' ? v !== n
                 : false
        if (!ok) return false
      }
    }
    return true
  }

  /**
   * 取角色当前生效的底线类型
   * @param {object} npc
   * @returns {string[]}
   */
  function activeLineTypes(npc) {
    return (npc._lines || [])
      .map(id => LINES[id])
      .filter(Boolean)
      .filter(l => lineHolds(l, npc.values))
      .map(l => l.type)
  }

  /**
   * 生成 GPT 需要的 config
   * @returns {object}
   */
  function buildConfig() {
    const actions = ACTIONS.map(a => ({
      id: a.id,
      priority: a.priority,
      when: a.when,
      effects: a.effects,
      occupation: a.occupation,
      _blockedBy: a.blockedBy || []
    }))

    return {
      policy: { ordinaryGraceMin: 120 },
      phases: PHASES,
      maxSteps: 128,
      actions,
      events: EVENTS,
      nodes: NODES,
      releaseRules: {
        assignmentResolved: { worldFlags: { assignmentResolved: true } }
      },

      /**
       * GPT 留的钩子：筛选行动时调用
       * 在这里实现底线判定
       */
      allowed(ctx, item) {
        const npc = ctx.npc
        if (!npc || !item._blockedBy?.length) return true
        const types = activeLineTypes(npc)
        return !item._blockedBy.some(t => types.includes(t))
      }
    }
  }

  /**
   * 生成初始 world
   * @returns {object}
   */
  function buildInitialWorld() {
    const npcs = {}
    for (const n of ROSTER) {
      npcs[n.id] = JSON.parse(JSON.stringify(n))
      npcs[n.id]._baseline = { ...n.values }
    }

    return {
      // 开场是暮色，初始化时间与之对齐：第 1 天 18:00（属于 night 时段）
      timeMin: 18 * 60,
      playerLocation: 'inn',
      interactingIds: [],
      flags: {},
      npcs
    }
  }

  root.OKH_APP_CONFIG = Object.freeze({
    PHASES,
    LINES,
    ACTIONS,
    NODES,
    EVENTS,
    ROSTER,
    ALL_DRIVES,
    buildConfig,
    buildInitialWorld,
    activeLineTypes,
    lineHolds
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_CONFIG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
