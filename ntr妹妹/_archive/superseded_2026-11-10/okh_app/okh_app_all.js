// okh_app_all.js — 基于 GPT 核心的应用层
// 顺序：config → world → adapter → parse → hook → debug → hud → entry

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
;
/**
 * @module okh_app_world
 * @updated 2026-11-09 06:45
 * @status  demo
 * @reason  world 的读写与首次初始化。存储适配层让同一份代码在酒馆和 Node 都能跑
 * @deps    ['okh_app_config'] + gpt_core_all（初始化时需要 OKHBackground）
 * @provides { store, loadWorld, saveWorld, ensureWorld, resetWorld, STORAGE_KEY }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  if (!CFG) { console.error('[APP] 需要先加载 01_config.js'); return }

  const STORAGE_KEY = 'okh_gpt.world'

  // ============================================================
  // 一、存储适配层
  //    酒馆里用 getvar/setvar，Node 里退回内存 Map
  // ============================================================

  const store = (function () {
    if (typeof getvar === 'function' && typeof setvar === 'function') {
      return {
        mode: 'tavern',
        get: k => { try { return getvar(k) } catch (e) { return undefined } },
        set: (k, v) => { try { setvar(k, v) } catch (e) {} },
        del: k => { try { if (typeof deletevar === 'function') deletevar(k) } catch (e) {} }
      }
    }
    const mem = new Map()
    return {
      mode: 'memory',
      get: k => mem.get(k),
      set: (k, v) => { mem.set(k, v) },
      del: k => { mem.delete(k) }
    }
  })()

  // ============================================================
  // 二、读写
  // ============================================================

  /**
   * 读 world
   * @returns {object|null}
   */
  function loadWorld() {
    const raw = store.get(STORAGE_KEY)
    if (raw === undefined || raw === null) return null
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) } catch (e) { return null }
    }
    return raw
  }

  /**
   * 写 world
   * @param {object} world
   * @returns {boolean} 回读校验结果
   */
  function saveWorld(world) {
    const text = JSON.stringify(world)
    store.set(STORAGE_KEY, text)

    const back = store.get(STORAGE_KEY)
    const ok = back === text
    if (!ok) console.warn('[APP] world 写入校验失败')
    return ok
  }

  // ============================================================
  // 三、初始化
  // ============================================================

  /**
   * 确保 world 存在；不存在就初始化
   * @param {boolean} force 为 true 时强制重建
   * @returns {object}
   */
  function ensureWorld(force = false) {
    if (!force) {
      const existing = loadWorld()
      if (existing && existing.bg?.version === 2) return existing
    }

    const GPT = root.OKHBackground
    if (!GPT) {
      throw new Error('[APP] 需要先加载 gpt_core_all.js')
    }

    const world = GPT.init(CFG.buildInitialWorld(), CFG.buildConfig())
    saveWorld(world)
    console.log('[APP] world 已初始化 · ' + Object.keys(world.npcs).length + ' 个角色')
    return world
  }

  /**
   * 清空重来
   * @returns {object}
   */
  function resetWorld() {
    store.del(STORAGE_KEY)
    return ensureWorld(true)
  }

  root.OKH_APP_WORLD = Object.freeze({
    STORAGE_KEY,
    store,
    loadWorld,
    saveWorld,
    ensureWorld,
    resetWorld
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_WORLD
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
/**
 * @module okh_app_adapter
 * @updated 2026-11-09 06:50
 * @status  demo
 * @reason  用 GPT 提供的 createController 接上宿主读写；额外提供驱动漂移与台账生成
 * @deps    ['okh_app_config', 'okh_app_world'] + gpt_core_all
 * @provides { createController, drift, buildLedger, buildWatch }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  const W = root.OKH_APP_WORLD
  const GPT = root.OKHBackground
  const GPT_ADAPTER = root.OKHBackgroundAdapter

  if (!CFG || !W) { console.error('[APP] 需要先加载 01_config 与 02_world'); return }
  if (!GPT || !GPT_ADAPTER) { console.error('[APP] 需要先加载 gpt_core_all.js'); return }

  // ============================================================
  // 一、控制器
  // ============================================================

  /**
   * 建立 GPT 的控制器
   * readWorld / commit 都指向同一份真源（变量池里的 world）
   * @returns {object}
   */
  function createController() {
    const config = CFG.buildConfig()

    return GPT_ADAPTER.createController({
      config,

      async readWorld() {
        const w = W.loadWorld()
        if (!w) return W.ensureWorld()
        return w
      },

      async commit({ expectedRevision, state, checkpoint, reason }) {
        const current = W.loadWorld()

        // 版本冲突检查：别人先改了，就不要覆盖
        if (current && current.bg && current.bg.revision !== expectedRevision) {
          console.warn('[APP] 版本冲突：期望 ' + expectedRevision + '，实际 ' + current.bg.revision)
          return false
        }

        const ok = W.saveWorld(state)

        // 检查点与本次回复绑定保存（用于回滚）
        if (ok && checkpoint) {
          W.store.set('okh_gpt.checkpoint', JSON.stringify(checkpoint))
        }

        return ok
      }
    })
  }

  // ============================================================
  // 二、驱动力漂移（GPT 核心没有这个机制，在应用层补）
  // ============================================================

  /**
   * 每个时段结束：驱动力向基线回归 + 生活压力
   * 直接原地修改 world，调用方负责保存
   * @param {object} world
   * @param {object} opts { regression, needPressure }
   * @returns {number} 受影响角色数
   */
  function drift(world, opts = {}) {
    const regression = opts.regression ?? 0.10
    const needPressure = opts.needPressure ?? 2
    let touched = 0

    for (const npc of Object.values(world.npcs)) {
      if (npc.alive === false) continue
      const base = npc._baseline
      if (!base) continue

      for (const k of Object.keys(npc.values)) {
        if (k === 'need') continue          // need 单独加压力
        if (typeof base[k] !== 'number') continue
        const v = npc.values[k]
        npc.values[k] = Math.max(0, Math.min(100, v + (base[k] - v) * regression))
      }

      if (typeof npc.values.need === 'number') {
        npc.values.need = Math.max(0, Math.min(100, npc.values.need + needPressure))
      }

      touched++
    }

    return touched
  }

  // ============================================================
  // 三、台账与监听
  // ============================================================

  /**
   * 世界快照，给 AI 看
   * @param {object} world
   * @returns {string}
   */
  function buildLedger(world) {
    const day = Math.floor(world.timeMin / 1440) + 1
    const local = world.timeMin % 1440
    const phase = local < 360 ? '深夜'
                : local < 600 ? '上午'
                : local < 1020 ? '午后'
                : '夜晚'

    const lines = [`【第 ${day} 天 · ${phase}】`]

    // 在场：和玩家同位置的
    const here = Object.values(world.npcs)
      .filter(n => n.alive !== false && n.location === world.playerLocation)

    lines.push('在场：' + (here.length
      ? here.map(n => {
          const busy = n.activity ? `（${n.activity.label}）` : ''
          return n.name + busy
        }).join('、')
      : '无'))

    // 近况：队列里待演绎的
    const pending = (world.bg?.queue || [])
      .filter(e => e.status === 'pending')
      .slice(-3)

    if (pending.length) {
      lines.push('近况：')
      for (const e of pending) lines.push('· ' + e.text)
    }

    return lines.join('\n')
  }

  /**
   * 监听快照，不给 AI 看
   * @param {object} world
   * @returns {object}
   */
  function buildWatch(world) {
    const STAGE = { 0: '正常', 1: '异常', 2: '沉沦', 3: '臣服' }
    const list = Object.values(world.npcs).map(n => ({
      id: n.id,
      name: n.name,
      location: n.location,
      stage: STAGE[n.stage] || n.stage,
      corruption: Math.round(n.values.corruption ?? 0),
      sanity: Math.round(n.values.sanity ?? 0),
      exposure: Math.round(n.values.exposure ?? 0),
      activity: n.activity?.label || null,
      present: n.location === world.playerLocation
    }))

    return {
      timeMin: world.timeMin,
      day: Math.floor(world.timeMin / 1440) + 1,
      list
    }
  }

  root.OKH_APP_ADAPTER = Object.freeze({
    createController,
    drift,
    buildLedger,
    buildWatch
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_ADAPTER
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
/**
 * @module okh_app_parse
 * @updated 2026-11-09 08:00
 * @status  demo
 * @reason  解析 AI 输出里的申报标签，转成 GPT 的 front 结构
 * @deps    无（纯函数）
 * @provides { parseActivity, parseInteract, parseStatusBar, buildFront, VALID_PHASES }
 *
 * ============================================================
 * 支持的标签
 *
 *   <activity npc="aurora" op="start" kind="ordinary" label="吃饭" />
 *   <activity npc="aurora" op="finish" />
 *   <activity npc="cecilia" op="start" kind="important" label="照看孤儿" rule="assignmentResolved" />
 *   <interact npc="aurora" />
 *   <move to="manor" />
 *   <focus npc="aurora" />
 *
 * 说明：
 *   · activity 的 id 由脚本生成（npc + 时间戳），不需要 AI 提供
 *   · finish / cancel 不需要给 id，脚本会匹配该角色的当前活动
 *   · interact 表示该角色本轮与玩家互动，后台不应给他安排行动
 * ============================================================
 */

(function (root) {
  'use strict'

  /**
   * 从文本里抓所有自闭合标签，返回 { tagName: [attrs...] }
   * @param {string} text
   * @param {string} tagName
   * @returns {object[]}
   */
  function grabTags(text, tagName) {
    const re = new RegExp(`<${tagName}\\b([^>]*)/?>`, 'gi')
    const out = []
    let m
    while ((m = re.exec(text)) !== null) {
      out.push(parseAttrs(m[1]))
    }
    return out
  }

  /**
   * 解析属性串
   * @param {string} raw 形如 ` npc="aurora" op="start" `
   * @returns {object}
   */
  function parseAttrs(raw) {
    const attrs = {}
    const re = /([\w-]+)\s*=\s*"([^"]*)"/g
    let m
    while ((m = re.exec(raw)) !== null) {
      attrs[m[1]] = m[2]
    }
    return attrs
  }

  /**
   * 解析 <activity>，产出 each npc 的活动变更指令
   * @param {string} text
   * @param {number} now 当前世界分钟，用于生成活动 id
   * @param {object} world 当前世界，用于取当前活动 id
   * @returns {object} { npcId: { activity } }
   */
  function parseActivity(text, now, world) {
    const tags = grabTags(text, 'activity')
    const out = {}

    for (const a of tags) {
      const npc = a.npc
      const op = a.op
      if (!npc || !op) continue
      if (!['start', 'finish', 'cancel'].includes(op)) continue

      const cur = world?.npcs?.[npc]?.activity

      if (!out[npc]) out[npc] = {}

      if (op === 'start') {
        const kind = ['ordinary', 'important', 'special'].includes(a.kind) ? a.kind : 'ordinary'
        out[npc].activity = {
          op: 'start',
          id: `act-${npc}-${now}`,
          kind,
          label: a.label || kind,
          source: 'narrative'
        }
        if (a.rule && kind !== 'ordinary') {
          out[npc].activity.releaseRule = a.rule
        }
      } else {
        // finish / cancel 必须带上当前活动 id，否则 GPT 会拒绝
        if (!cur) continue
        out[npc].activity = { op, id: cur.id }
      }
    }

    return out
  }

  /**
   * 解析 <interact>，产出互动角色列表
   * @param {string} text
   * @returns {string[]}
   */
  function parseInteract(text) {
    return grabTags(text, 'interact')
      .map(a => a.npc)
      .filter(Boolean)
  }

  /**
   * 解析 <move to="...">
   * @param {string} text
   * @returns {string|null}
   */
  function parseMove(text) {
    const tags = grabTags(text, 'move')
    return tags[0]?.to || null
  }

  /**
   * 解析 <time elapsed="30" end="1日18:30" />
   * @param {string} text
   * @returns {{elapsed:number|null, end:string|null}}
   */
  function parseStatusBar(text) {
    const tags = grabTags(text, 'time')
    const t = tags[0]
    if (!t) return { elapsed: null, end: null }

    let elapsed = null
    if (t.elapsed !== undefined) {
      const n = Number(t.elapsed)
      if (Number.isFinite(n) && n >= 0 && n <= 1440) elapsed = n
    }
    return { elapsed, end: t.end || null }
  }

  /**
   * 把解析结果组装成 GPT 的 front
   * @param {string} text AI 消息全文
   * @param {number} now 当前世界分钟
   * @param {object} world 当前 world（用于校验 npc 是否存在）
   * @returns {object} front
   */
  function buildFront(text, now, world) {
    const front = {}

    // 玩家移动
    const move = parseMove(text)
    if (move) front.playerLocation = move

    // 角色活动
    const acts = parseActivity(text, now, world)
    const npcs = {}
    for (const [npcId, patch] of Object.entries(acts)) {
      if (!world.npcs[npcId]) continue      // 未知角色，丢弃
      npcs[npcId] = patch
    }
    if (Object.keys(npcs).length) front.npcs = npcs

    // 互动角色
    const interacting = parseInteract(text)
      .filter(id => world.npcs[id])
    if (interacting.length) {
      front.interactingIds = interacting
    }

    return front
  }

  root.OKH_APP_PARSE = Object.freeze({
    grabTags,
    parseAttrs,
    parseActivity,
    parseInteract,
    parseMove,
    parseStatusBar,
    buildFront
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_PARSE
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
/**
 * @module okh_app_hook
 * @updated 2026-11-09 06:55
 * @status  demo
 * @reason  消息钩子与节奏控制：定时推进、跨时段推进、写台账
 * @deps    ['okh_app_config', 'okh_app_world', 'okh_app_adapter'] + gpt_core_all
 * @provides { RHYTHM, attach, detach, onMessage, step, lastReport, pendingText }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const GPT = root.OKHBackground

  if (!CFG || !W || !A || !GPT) {
    console.error('[APP] hook 加载失败：依赖缺失')
    return
  }

  /**
   * ⚠️ 以下数值均为测试默认值，正式节奏待定
   */
  const RHYTHM = {
    everyMessages: 3,        // 每 3 条 AI 消息推进一次
    minutesPerTick: 60,      // 每次推进 60 分钟
    useAITime: true          // AI 报了 <time> 就优先用
  }

  let _handler = null
  let _msgSeq = 0
  let _lastReport = null

  // ============================================================
  // 一、时间解析
  // ============================================================

  /**
   * 从 AI 消息里抠出 <time elapsed="30" />
   * @param {string} text
   * @returns {number|null}
   */
  function parseElapsed(text) {
    if (!text) return null
    const m = /<time[^>]*\belapsed\s*=\s*"(\d+)"/i.exec(text)
    if (!m) return null
    const n = Number(m[1])
    return Number.isFinite(n) && n >= 0 && n <= 1440 ? n : null
  }

  // ============================================================
  // 二、推进一步
  // ============================================================

  /**
   * 推进一步
   * @param {number} minutes 推进多少分钟（0 = 只应用申报，不动时间）
   * @param {object} opts { msgId, revision, force, text }
   * @returns {object} 报告
   */
  function step(minutes, opts = {}) {
    let world = W.ensureWorld()

    const text = opts.text || ''
    const P = root.OKH_APP_PARSE

    // 解析申报标签 → front
    const front = (P && text) ? P.buildFront(text, world.timeMin, world) : null
    const hasFront = front && Object.keys(front).length > 0

    const toMin = world.timeMin + Math.max(0, Math.floor(minutes))
    if (toMin === world.timeMin && !hasFront && !opts.force) {
      return { advanced: false, reason: '没有时间可推进，也没有申报' }
    }

    const id = opts.msgId || `tick-${Date.now()}`
    const revision = opts.revision || 'r1'

    // 幂等：同一条消息不重复推进
    if (world.bg.receipts && world.bg.receipts[id]) {
      return { advanced: false, reason: '重复提交' }
    }

    let result
    try {
      result = GPT.advance(world, {
        id,
        revision,
        toMin,
        interactingIds: front?.interactingIds || [],
        front: front || null
      }, CFG.buildConfig())
    } catch (e) {
      console.error('[APP] advance 失败：', e.message)
      return { advanced: false, reason: e.message }
    }

    if (result.duplicate) return { advanced: false, reason: '重复提交' }

    const state = result.state

    // 应用层：驱动力漂移（只在时间真的前进时做）
    if (toMin > world.timeMin) A.drift(state)

    // 存回
    W.saveWorld(state)

    // 待演绎文本
    const batch = GPT.prepare(state, 8)
    if (batch.ids.length) {
      W.store.set('okh_gpt.pendingText', batch.text)
      W.store.set('okh_gpt.pendingIds', JSON.stringify(batch.ids))
    }

    // 台账与监听
    W.store.set('okh_gpt.ledger', A.buildLedger(state))
    W.store.set('okh_gpt.watch', JSON.stringify(A.buildWatch(state)))

    _lastReport = {
      advanced: true,
      from: world.timeMin,
      to: state.timeMin,
      front: front || null,
      actions: result.report.actions,
      released: result.report.released,
      pending: batch.ids.length
    }

    if (typeof console !== 'undefined') {
      const frontInfo = hasFront ? ` · 申报 ${Object.keys(front).join(',')}` : ''
      console.log(`[APP] ${world.timeMin} → ${state.timeMin} · 行动 ${result.report.actions.length} 项 · 待演绎 ${batch.ids.length} 条${frontInfo}`)
    }

    return _lastReport
  }

  // ============================================================
  // 三、消息钩子
  // ============================================================

  /**
   * 收到 AI 消息
   *
   * 两套推进并存：
   *   A. AI 申报了 <time elapsed>  → 按申报推进（elapsed=0 时只应用申报，不动时间）
   *   B. AI 没申报               → 每 N 条消息推进一次固定时长
   */
  function onMessage() {
    try {
      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null
      const chat = ctx?.chat
      if (!chat || !chat.length) return

      const last = chat[chat.length - 1]
      if (!last || last.is_user) return

      _msgSeq++
      const text = last.mes || ''
      const msgId = `msg-${chat.length}`
      const revision = text.slice(0, 32) || 'r1'

      // 解析 status_bar
      const P = root.OKH_APP_PARSE
      const parsed = P ? P.parseStatusBar(text) : { elapsed: parseElapsed(text) }
      const elapsed = parsed.elapsed

      // A. AI 报了时间（含 elapsed=0 的开场）
      if (elapsed !== null && RHYTHM.useAITime) {
        _msgSeq = 0
        step(elapsed, { msgId, revision, text })
        return
      }

      // B. 固定节奏
      if (_msgSeq >= RHYTHM.everyMessages) {
        _msgSeq = 0
        step(RHYTHM.minutesPerTick, { msgId, revision, text })
      }
    } catch (e) {
      console.error('[APP] 消息处理失败：', e)
    }
  }

  /**
   * 挂钩子
   * @returns {boolean}
   */
  function attach() {
    if (_handler) { console.log('[APP] 钩子已存在'); return true }
    if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined') {
      console.warn('[APP] 当前环境不支持 eventOn，请手动调 OKH_APP.step()')
      return false
    }
    _handler = onMessage
    eventOn(tavern_events.MESSAGE_RECEIVED, _handler)
    console.log('[APP] 钩子已挂上')
    return true
  }

  /**
   * 摘钩子
   * @returns {boolean}
   */
  function detach() {
    if (!_handler) return false
    if (typeof eventRemoveListener === 'function' && typeof tavern_events !== 'undefined') {
      eventRemoveListener(tavern_events.MESSAGE_RECEIVED, _handler)
    }
    _handler = null
    console.log('[APP] 钩子已摘下')
    return true
  }

  root.OKH_APP_HOOK = Object.freeze({
    RHYTHM,
    parseElapsed,
    step,
    attach,
    detach,
    onMessage,
    lastReport: () => _lastReport
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_HOOK
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
/**
 * @module okh_app_debug
 * @updated 2026-11-09 07:00
 * @status  demo
 * @reason  调试工具：看状态、看监听、看队列、手动推演
 * @deps    ['okh_app_config', 'okh_app_world', 'okh_app_adapter', 'okh_app_hook']
 * @provides { status, watch, ledger, queue, step, reset, config }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const H = root.OKH_APP_HOOK
  const GPT = root.OKHBackground

  if (!CFG || !W || !A || !H) {
    console.error('[APP] debug 加载失败')
    return
  }

  /**
   * 全员状态表
   */
  function status() {
    const world = W.loadWorld()
    if (!world) { console.warn('[APP] 还没初始化，跑 OKH_APP.init()'); return null }

    const STAGE = { 0: '正常', 1: '异常', 2: '沉沦', 3: '臣服' }
    const rows = Object.values(world.npcs).map(n => ({
      姓名: n.name,
      阶段: STAGE[n.stage] || n.stage,
      堕落: Math.round(n.values.corruption ?? 0),
      理智: Math.round(n.values.sanity ?? 0),
      位置: n.location,
      当前活动: n.activity?.label || '—',
      在场: n.location === world.playerLocation ? '●' : '○'
    }))

    console.group(`[APP] 第 ${Math.floor(world.timeMin / 1440) + 1} 天 · ${world.timeMin % 1440} 分`)
    console.table(rows)
    console.groupEnd()
    return rows
  }

  /**
   * 监听面板
   */
  function watch() {
    const world = W.loadWorld()
    if (!world) { console.warn('[APP] 还没初始化'); return null }
    const w = A.buildWatch(world)
    console.group(`[APP] 监听 · 第 ${w.day} 天`)
    console.table(w.list)
    console.groupEnd()
    return w
  }

  /**
   * 台账文本
   */
  function ledger() {
    const world = W.loadWorld()
    if (!world) return null
    const text = A.buildLedger(world)
    console.log(text)
    return text
  }

  /**
   * 待演绎队列
   */
  function queue() {
    const world = W.loadWorld()
    if (!world) return null
    const list = (world.bg?.queue || [])
    console.group(`[APP] 待演绎队列 · ${list.filter(e => e.status === 'pending').length} 条`)
    console.table(list.map(e => ({
      状态: e.status,
      类型: e.kind,
      定义: e.definitionId,
      角色: e.npcId || '—',
      时间: e.at,
      文本: (e.text || '').slice(0, 30)
    })))
    console.groupEnd()
    return list
  }

  /**
   * 手动推演
   * @param {number} minutes
   */
  function step(minutes) {
    return H.step(minutes ?? H.RHYTHM.minutesPerTick)
  }

  /**
   * 重置
   */
  function reset() {
    const w = W.resetWorld()
    console.log('[APP] 已重置')
    return w
  }

  /**
   * 看当前配置概览
   */
  function config() {
    const c = CFG.buildConfig()
    console.group('[APP] 配置')
    console.log('时段：', c.phases.map(p => `${p.id}@${p.start}`).join(' '))
    console.log('保护期：', c.policy.ordinaryGraceMin, '分钟')
    console.log('行动：', c.actions.length, '条')
    console.log('事件：', c.events.length, '条')
    console.log('节点：', c.nodes.length, '条')
    console.groupEnd()
    return c
  }

  root.OKH_APP_DEBUG = Object.freeze({
    status, watch, ledger, queue, step, reset, config
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_DEBUG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
/**
 * @module okh_app_hud
 * @updated 2026-11-09 07:45
 * @status  demo
 * @reason  把 world 渲染成界面：在场面板（玩家可见）+ 监听面板（隐藏）
 * @deps    ['okh_app_world', 'okh_app_adapter']
 * @provides { render, startHud, stopHud, LOCATION_NAMES }
 *
 * 用法：
 *   页面上放 <div data-okh-hud></div>  → 显示时间、位置、在场
 *   页面上放 <div data-okh-watch></div> → 显示全员监听（建议设 display:none）
 */

(function (root) {
  'use strict'

  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER

  if (!W || !A) {
    console.error('[APP] hud 加载失败：需要 02_world 与 03_adapter')
    return
  }

  /** 地点中文名 */
  const LOCATION_NAMES = {
    town: '镇上',
    inn: '断剑与麦酒',
    church: '圣辉大教堂',
    manor: '领主山庄',
    casino: '地下赌场',
    wilds: '城外荒原'
  }

  /** 时段中文名 */
  const PHASE_NAMES = [
    { max: 360, name: '深夜' },
    { max: 600, name: '上午' },
    { max: 1020, name: '午后' },
    { max: 1440, name: '夜晚' }
  ]

  /**
   * 由分钟推时段名
   * @param {number} local
   * @returns {string}
   */
  function phaseName(local) {
    return (PHASE_NAMES.find(p => local < p.max) || PHASE_NAMES[3]).name
  }

  /**
   * 地点名
   * @param {string} key
   * @returns {string}
   */
  function locName(key) {
    return LOCATION_NAMES[key] || key
  }

  // ============================================================
  // 一、在场面板
  // ============================================================

  /**
   * 生成在场面板的 HTML
   * @param {object} world
   * @returns {string}
   */
  function buildHudHtml(world) {
    if (!world) return ''

    const day = Math.floor(world.timeMin / 1440) + 1
    const local = world.timeMin % 1440
    const hour = String(Math.floor(local / 60)).padStart(2, '0')
    const minute = String(local % 60).padStart(2, '0')

    const here = Object.values(world.npcs)
      .filter(n => n.alive !== false && n.location === world.playerLocation)

    const presentText = here.length
      ? here.map(n => {
          const busy = n.activity ? `（${n.activity.label}）` : ''
          return `<span class="okh-name">${escape(n.name)}</span><span class="okh-busy">${escape(busy)}</span>`
        }).join('　')
      : '<span class="okh-none">无人</span>'

    return `
      <div class="okh-row">
        <span class="okh-label">时间</span>
        <span class="okh-value">第 ${day} 天 · ${phaseName(local)}</span>
        <span class="okh-clock">${hour}:${minute}</span>
      </div>
      <div class="okh-row">
        <span class="okh-label">位置</span>
        <span class="okh-value">${escape(locName(world.playerLocation))}</span>
      </div>
      <div class="okh-row">
        <span class="okh-label">在场</span>
        <span class="okh-value">${presentText}</span>
      </div>
    `.trim()
  }

  // ============================================================
  // 二、监听面板
  // ============================================================

  /**
   * 生成监听面板的 HTML（等宽文本，便于对齐）
   * @param {object} world
   * @returns {string}
   */
  function buildWatchHtml(world) {
    if (!world) return ''
    const STAGE = { 0: '正常', 1: '异常', 2: '沉沦', 3: '臣服' }

    const lines = Object.values(world.npcs).map(n => {
      const mark = n.location === world.playerLocation ? '●' : '○'
      const stage = STAGE[n.stage] || n.stage
      const busy = n.activity ? `｜${n.activity.label}` : ''
      return `${mark} ${n.name}｜${locName(n.location)}｜${stage}｜堕落 ${Math.round(n.values.corruption ?? 0)}${busy}`
    })

    return lines.join('\n')
  }

  /**
   * HTML 转义
   * @param {string} s
   * @returns {string}
   */
  function escape(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // ============================================================
  // 三、渲染
  // ============================================================

  /**
   * 渲染一次
   * @returns {boolean} 是否找到容器
   */
  function render() {
    if (typeof document === 'undefined') return false

    const world = W.loadWorld()
    if (!world) return false

    let found = false

    // 在场面板：可能有多个（每条消息一个），全部填
    const huds = document.querySelectorAll('[data-okh-hud]')
    for (const el of huds) {
      el.innerHTML = buildHudHtml(world)
      el.setAttribute('data-okh-ready', '1')
      found = true
    }

    // 监听面板
    const watches = document.querySelectorAll('[data-okh-watch]')
    for (const el of watches) {
      el.textContent = buildWatchHtml(world)
      found = true
    }

    return found
  }

  // ============================================================
  // 四、定时刷新
  // ============================================================

  let _timer = null

  /**
   * 启动定时刷新
   * @param {number} intervalMs
   */
  function startHud(intervalMs = 1000) {
    if (_timer) return
    _timer = setInterval(() => {
      try { render() } catch (e) { /* 静默，不打断页面 */ }
    }, intervalMs)
    console.log('[APP] HUD 已启动 · 每 ' + intervalMs + 'ms 刷新')
  }

  /**
   * 停止
   */
  function stopHud() {
    if (!_timer) return
    clearInterval(_timer)
    _timer = null
    console.log('[APP] HUD 已停止')
  }

  root.OKH_APP_HUD = Object.freeze({
    LOCATION_NAMES,
    phaseName,
    locName,
    buildHudHtml,
    buildWatchHtml,
    render,
    startHud,
    stopHud
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_HUD
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
/**
 * @module okh_app_entry
 * @updated 2026-11-09 07:10
 * @status  demo
 * @reason  统一入口。把散落的 OKH_APP_* 收成一个对象，避免使用者记五个全局名
 * @deps    ['okh_app_config', 'okh_app_world', 'okh_app_adapter', 'okh_app_hook', 'okh_app_debug']
 * @provides { OKH_APP }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const H = root.OKH_APP_HOOK
  const D = root.OKH_APP_DEBUG
  const HUD = root.OKH_APP_HUD

  if (!CFG || !W || !A || !H || !D) {
    console.error('[APP] entry 加载失败：依赖缺失，检查 01~05 是否都加载了')
    return
  }
  if (!HUD) {
    console.warn('[APP] entry：HUD 模块未加载，界面将不可用')
  }

  /**
   * 初始化世界
   * @param {boolean} force 为 true 时清空重建
   * @returns {object}
   */
  function init(force = false) {
    return W.ensureWorld(force)
  }

  /**
   * 启动：初始化 + 挂钩子 + 开 HUD
   * @returns {object} { world, hooked, hud }
   */
  function start() {
    const world = init(false)
    const hooked = H.attach()
    if (HUD) HUD.startHud(1000)
    console.log('[APP] 已启动 · ' + (hooked ? '自动推进已开启' : '需手动调 step()'))
    return { world, hooked, hud: !!HUD }
  }

  /**
   * 停止：摘钩子 + 停 HUD，不清数据
   */
  function stop() {
    H.detach()
    if (HUD) HUD.stopHud()
    console.log('[APP] 已停止')
  }

  root.OKH_APP = Object.freeze({
    // 生命周期
    init,
    start,
    stop,

    // 推演
    step: H.step,

    // 数据
    world: W.loadWorld,
    save: W.saveWorld,
    reset: W.resetWorld,

    // 配置
    config: CFG.buildConfig,

    // 调试（挂一份，方便直接敲 OKH_APP.status()）
    status: D.status,
    watch: D.watch,
    ledger: D.ledger,
    queue: D.queue,

    // 界面
    renderHud: HUD ? HUD.render : () => false,

    // 子模块
    CFG, W, A, H, D, HUD
  })

  console.log('[OKH_APP] 已就绪 · 初始化用 OKH_APP.init()')

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;

