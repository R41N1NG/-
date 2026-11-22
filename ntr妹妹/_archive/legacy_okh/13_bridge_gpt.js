/**
 * @module okh_bridge_gpt
 * @updated 2026-11-09 06:30
 * @status  experimental
 * @reason  把 GPT 提供的独立核心接入本项目：只做数据翻译与切换，不改动 gpt_core 任何源码
 * @deps    ['okh_boot','okh_core','okh_schema','okh_rules','okh_turn','okh_data'] + gpt_core_all
 * @provides { MODE, buildWorld, commitWorld, buildConfig, switchTo, status, attachGpt, detachGpt }
 *
 * ============================================================
 * 接入原则
 *
 * 1. gpt_core/ 下的 9 个文件一个字节都不改
 * 2. 本文件只做三件事：okh → world 翻译、world → okh 回写、钩子切换
 * 3. 两套推演循环不能同时跑：切换时自动摘掉另一套的钩子
 * 4. 语义不完全兼容的地方，见 `接入说明_GPT核心.md`
 * ============================================================
 */

(function () {
  'use strict'

  const OKH = window.__OKH__
  const GPT = window.OKHBackground
  const GPT_ADAPTER = window.OKHBackgroundAdapter

  if (!OKH) { console.error('[BRIDGE] 需要先加载 okh 系统'); return }
  if (!GPT) { console.error('[BRIDGE] 需要先加载 gpt_core_all.js'); return }

  // ============================================================
  // 一、常量映射
  // ============================================================

  /** 我们的阶段 → GPT 的阶段数字 */
  const STAGE_TO_INDEX = { normal: 0, anomaly: 1, sinking: 2, subjugated: 3 }

  /** GPT 的阶段数字 → 我们的阶段 */
  const INDEX_TO_STAGE = { 0: 'normal', 1: 'anomaly', 2: 'sinking', 3: 'subjugated' }

  /**
   * 我们的时段表 → GPT 的时段表
   * GPT 要求：从 0 开始、递增、id 不重复、最后一段持续到 1440
   * 我们的 PHASES 有两个 deep_night（0-360 与 1380-1440），必须合并
   */
  function buildPhases() {
    return [
      { id: 'deep_night', start: 0 },
      { id: 'morning', start: 360 },
      { id: 'afternoon', start: 600 },
      { id: 'night', start: 1020 }
    ]
  }

  /**
   * 把 '>50' 这类字符串转成 GPT 的比较对象
   * @param {string} expr
   * @returns {object}
   */
  function exprToObject(expr) {
    const m = /^([<>]=?)(-?\d+)$/.exec(String(expr).trim())
    if (!m) return { eq: expr }
    const op = m[1]
    const n = Number(m[2])
    return { [op === '>' ? 'gt' : op === '>=' ? 'gte' : op === '<' ? 'lt' : 'lte']: n }
  }

  // ============================================================
  // 二、okh → world
  // ============================================================

  /**
   * 收集行动库可能修改的全部数值 key
   * GPT 的 effects.add 要求目标角色已声明该数值，
   * 所以 values 必须覆盖所有行动会用到的 key，缺失的补 0
   * @returns {string[]}
   */
  function collectValueKeys() {
    const core = OKH.modules.core
    const library = core.read('actionLibrary', {})
    const keys = new Set(['corruption', 'sanity', 'exposure'])

    for (const a of Object.values(library)) {
      for (const k of Object.keys(a.effects?.drives || {})) keys.add(k)
    }
    // 也纳入所有角色已声明的驱动力
    const npcs = core.read('npcs', {})
    for (const n of Object.values(npcs)) {
      for (const k of Object.keys(n.drives || {})) keys.add(k)
    }

    return [...keys]
  }

  /**
   * 从 okh 变量池构造 GPT 需要的 world
   * @returns {object}
   */
  function buildWorld() {
    const core = OKH.modules.core
    const npcs = core.read('npcs', {})
    const valueKeys = collectValueKeys()

    const out = {}
    for (const [id, n] of Object.entries(npcs)) {
      if (n.alive === false) continue

      // values 必须覆盖所有行动会用到的 key，否则 GPT 会抛"未声明专属数值"
      const values = {}
      for (const k of valueKeys) {
        const fromDrives = n.drives?.[k]
        const fromTop = n[k]
        values[k] = typeof fromDrives === 'number' ? fromDrives
                  : typeof fromTop === 'number' ? fromTop
                  : (k === 'sanity' ? 80 : 0)
      }

      out[id] = {
        id,
        name: n.name,
        monitored: n.monitored !== false,
        alive: n.alive !== false,
        location: n.location,
        values,
        stage: STAGE_TO_INDEX[n.stage] ?? 0,
        plan: (n.actions || []).slice(),
        nodePlan: (n.nodePlan || []).slice(),
        activity: null,
        activityHistory: {},
        nodeStates: {},
        flags: {},
        lastAction: null,
        // 桥接私用：保留底线定义，供 allowed 钩子判定（GPT 不校验额外字段）
        _lines: (n.lines || []).slice()
      }
    }

    return {
      timeMin: core.read('sys.total_min', 360),
      playerLocation: core.read('player.room_id', OKH.modules.schema.DEFAULT_ROOM),
      interactingIds: [],
      flags: core.read('world.flags', {}),
      npcs: out,
      bg: core.read('gpt.bg', null)
    }
  }

  // ============================================================
  // 三、world → okh
  // ============================================================

  /**
   * 把 GPT 算完的 world 回写进 okh 变量池
   * @param {object} world
   */
  function commitWorld(world) {
    const core = OKH.modules.core
    const npcs = core.read('npcs', {})

    core.write('sys.total_min', world.timeMin)
    core.write('player.room_id', world.playerLocation)
    core.write('world.flags', world.flags || {})

    for (const [id, w] of Object.entries(world.npcs)) {
      const o = npcs[id]
      if (!o) continue

      o.location = w.location

      // 数值回写
      for (const k of Object.keys(o.drives || {})) {
        if (typeof w.values[k] === 'number') o.drives[k] = w.values[k]
      }
      if (typeof w.values.corruption === 'number') o.corruption = w.values.corruption
      if (typeof w.values.sanity === 'number') o.sanity = w.values.sanity
      if (typeof w.values.exposure === 'number') o.exposure = w.values.exposure

      // 阶段回写（GPT 由节点推进，这里只做映射）
      o.stage = INDEX_TO_STAGE[w.stage] ?? o.stage

      // 行为历史
      o.history = o.history || []
      if (w.lastAction?.id && o.history[o.history.length - 1] !== w.lastAction.id) {
        o.history = o.history.concat(w.lastAction.id).slice(-30)
      }
    }

    core.write('npcs', npcs)
    core.write('gpt.bg', world.bg || null)
  }

  // ============================================================
  // 四、行动库 → GPT config
  // ============================================================

  /**
   * 把我们的 actionLibrary 转成 GPT 的 config
   * @returns {object}
   */
  function buildConfig() {
    const core = OKH.modules.core
    const rules = OKH.modules.rules
    const library = core.read('actionLibrary', {})

    const actions = Object.values(library).map(a => {
      const when = {}

      if (a.requires?.phase) when.phase = a.requires.phase
      if (a.requires?.location) when.location = a.requires.location

      const metrics = {}
      for (const [k, expr] of Object.entries(a.requires?.drives || {})) {
        metrics[k] = exprToObject(expr)
      }
      if (a.requires?.corruption) metrics.corruption = exprToObject(a.requires.corruption)
      if (Object.keys(metrics).length) when.metrics = metrics

      if (Object.keys(a.requires?.flags || {}).length) {
        when.worldFlags = a.requires.flags
      }

      // effects.add 只放数值型
      const add = {}
      for (const [k, v] of Object.entries(a.effects?.drives || {})) add[k] = v
      if (a.effects?.corruption) add.corruption = a.effects.corruption
      if (a.effects?.sanity) add.sanity = a.effects.sanity
      if (a.effects?.exposure) add.exposure = a.effects.exposure

      const effects = {}
      if (Object.keys(add).length) effects.add = add
      if (a.effects?.move) effects.move = a.effects.move
      if (Object.keys(a.effects?.setFlags || {}).length) effects.worldFlags = a.effects.setFlags

      return {
        id: a.id,
        priority: a.base ?? 10,          // 用我们的 base 当优先级（高分更可能被选中）
        when,
        effects,
        occupation: { kind: 'ordinary', label: a.label || a.id },
        // 桥接私用：保留原定义，供 allowed 判定底线
        _blockedBy: (a.blockedBy || []).slice()
      }
    })

    return {
      policy: { ordinaryGraceMin: 120 },
      phases: buildPhases(),
      maxSteps: 128,
      actions,
      events: [],
      nodes: [],

      /**
       * 底线判定钩子
       * GPT 在筛选行动时调用，我们在这里用 okh 的 rules 判断底线是否封锁
       */
      allowed(ctx, item) {
        const npc = ctx.npc
        if (!npc || !item._blockedBy?.length) return true

        const lines = npc._lines || []
        if (!lines.length) return true

        // 当前生效的底线类型
        const activeTypes = lines
          .filter(l => {
            const target = { corruption: npc.values.corruption, sanity: npc.values.sanity, drives: npc.values }
            for (const [k, expr] of Object.entries(l.holdsWhile || {})) {
              const v = k === 'corruption' ? target.corruption
                      : k === 'sanity' ? target.sanity
                      : (target.drives[k] ?? 0)
              const m = /^([<>]=?)(-?\d+)$/.exec(String(expr))
              if (!m) return false
              const op = m[1], n = Number(m[2])
              const ok = op === '<' ? v < n : op === '<=' ? v <= n : op === '>' ? v > n : v >= n
              if (!ok) return false
            }
            return true
          })
          .map(l => l.type)
          .filter(Boolean)

        return !item._blockedBy.some(t => activeTypes.includes(t))
      }
    }
  }

  // ============================================================
  // 五、初始化与切换
  // ============================================================

  const MODE = { current: 'legacy' }   // 'legacy' | 'gpt'
  let _gptHandler = null
  let _msgSeq = 0

  /**
   * 初始化 GPT 世界（首次调用时）
   * @returns {object} world
   */
  function ensureInit() {
    const core = OKH.modules.core
    let world = buildWorld()

    if (world.bg && world.bg.version === 2) {
      return world
    }

    // 第一次：让 GPT 的 init 建 bg
    const clean = { ...world }
    delete clean.bg
    world = GPT.init(clean, buildConfig())
    core.write('gpt.bg', world.bg)
    return world
  }

  /**
   * 切换到指定模式
   * @param {'legacy'|'gpt'} mode
   */
  function switchTo(mode) {
    if (!['legacy', 'gpt'].includes(mode)) {
      console.error('[BRIDGE] 未知模式：' + mode)
      return
    }

    const turn = OKH.modules.turn

    if (mode === 'gpt') {
      // 摘掉旧系统的钩子，避免双循环
      if (typeof turn.detach === 'function') turn.detach()
      ensureInit()
      attachGpt()
      MODE.current = 'gpt'
      console.log('[BRIDGE] 已切到 GPT 核心 · 旧推演循环已停')
    } else {
      detachGpt()
      if (typeof turn.attach === 'function') turn.attach()
      MODE.current = 'legacy'
      console.log('[BRIDGE] 已切回旧推演循环')
    }
  }

  // ============================================================
  // 六、GPT 模式的消息钩子
  // ============================================================

  /**
   * 处理一条 AI 消息
   */
  function onGptMessage() {
    try {
      const core = OKH.modules.core
      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null
      const chat = ctx?.chat
      if (!chat || !chat.length) return

      const last = chat[chat.length - 1]
      if (!last || last.is_user) return

      _msgSeq++

      // 每 N 条推进一次（沿用旧系统的节奏配置）
      const rhythm = OKH.modules.turn.RHYTHM
      const every = rhythm?.everyMessages ?? 3
      if (_msgSeq < every) return
      _msgSeq = 0

      const minutes = rhythm?.minutesPerTick ?? 60
      let world = buildWorld()
      world = ensureInit()

      const toMin = world.timeMin + minutes
      const msgId = `msg-${chat.length}`
      const revision = String(last.mes || '').slice(0, 32) || 'r1'

      // 幂等：同一条消息不重复推进
      if (world.bg.receipts[msgId]) return

      const result = GPT.advance(world, {
        id: msgId,
        revision,
        toMin,
        interactingIds: [],
        front: null
      }, buildConfig())

      if (result.duplicate) return

      commitWorld(result.state)

      // 待演绎事件
      const batch = GPT.prepare(result.state, 8)
      if (batch.ids.length) {
        core.write('gpt.pendingText', batch.text)
        core.write('gpt.pendingIds', batch.ids)
      }

      console.log(`[BRIDGE] 推进至 ${result.state.timeMin} 分钟 · 行动 ${result.report.actions.length} 项 · 待演绎 ${batch.ids.length} 条`)
    } catch (e) {
      console.error('[BRIDGE] GPT 推进失败：', e)
    }
  }

  /**
   * 挂 GPT 钩子
   */
  function attachGpt() {
    if (_gptHandler) return true
    if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined') {
      console.warn('[BRIDGE] 当前环境不支持 eventOn，请手动调 OKH_BRIDGE.step()')
      return false
    }
    _gptHandler = onGptMessage
    eventOn(tavern_events.MESSAGE_RECEIVED, _gptHandler)
    console.log('[BRIDGE] GPT 钩子已挂上')
    return true
  }

  /**
   * 摘 GPT 钩子
   */
  function detachGpt() {
    if (!_gptHandler) return false
    if (typeof eventRemoveListener === 'function' && typeof tavern_events !== 'undefined') {
      eventRemoveListener(tavern_events.MESSAGE_RECEIVED, _gptHandler)
    }
    _gptHandler = null
    console.log('[BRIDGE] GPT 钩子已摘下')
    return true
  }

  // ============================================================
  // 七、对外接口
  // ============================================================

  function status() {
    const core = OKH.modules.core
    const bg = core.read('gpt.bg', null)
    console.group('[BRIDGE] 状态')
    console.log('当前模式：', MODE.current)
    console.log('GPT 已初始化：', !!bg)
    if (bg) {
      console.log('版本：', bg.version, '· 修订号：', bg.revision)
      console.log('已处理消息：', Object.keys(bg.receipts || {}).length)
      console.log('待演绎队列：', (bg.queue || []).filter(e => e.status === 'pending').length, '条')
    }
    console.groupEnd()
    return { mode: MODE.current, initialized: !!bg, bg }
  }

  /** 手动跑一步（不开钩子时用） */
  function step(minutes) {
    const core = OKH.modules.core
    let world = ensureInit()
    const toMin = world.timeMin + (minutes ?? OKH.modules.turn.RHYTHM.minutesPerTick)
    const id = `manual-${Date.now()}`

    const result = GPT.advance(world, {
      id, revision: 'manual', toMin, interactingIds: [], front: null
    }, buildConfig())

    commitWorld(result.state)
    const batch = GPT.prepare(result.state, 8)
    return { result, batch }
  }

  window.OKH_BRIDGE = Object.freeze({
    MODE,
    buildWorld,
    commitWorld,
    buildConfig,
    switchTo,
    status,
    step,
    attachGpt,
    detachGpt,
    get mode() { return MODE.current }
  })

  console.log('[BRIDGE] 已就绪 · 切换用 OKH_BRIDGE.switchTo("gpt")')
})()
