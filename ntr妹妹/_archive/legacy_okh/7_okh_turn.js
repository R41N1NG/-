/**
 * @module      okh_turn
 * @updated     2026-11-08 20:09
 * @status      active
 * @reason      主循环。负责时间推进、触发全员推演、串联各模块。本模块不认识任何具体角色
 * @deps        ['okh_boot', 'okh_core', 'okh_schema', 'okh_rules', 'okh_agency', 'okh_presence', 'okh_translate']
 * @provides    { PHASES, derivePhase, parseElapsed, runTurn, tick, attach, detach, lastReport }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_turn 加载失败'); return }

  /**
   * 延迟取依赖。
   * 不在模块加载时解构——那时后续模块可能还没注册，会拿到 undefined 且不报错。
   * 这样写：顺序错了会抛错，顺序对了才跑得起来。
   * @param {string} name
   * @returns {object}
   */
  function dep(name) {
    const m = REG.modules[name]
    if (!m) throw new Error(`[OKH] 依赖未加载：${name}（检查脚本顺序）`)
    return m
  }

  // ============================================================
  // 一、时间（常量与换算委托给 schema，本模块不重复定义）
  // ============================================================

  /** 时段表（只读引用） */
  const PHASES = () => dep('schema').PHASES

  /**
   * 由绝对分钟推时段 key
   * @param {number} totalMin
   * @returns {string}
   */
  function derivePhase(totalMin) {
    return dep('schema').phaseOf(totalMin)
  }

  /**
   * 从文本里抠出 <time elapsed="N" />
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
  // 二·补、世界台账（给 AI 看的"世界现在什么样"）
  // ============================================================

  /**
   * 生成台账文本，写入 okh.ledger，供世界书 {{getvar::okh.ledger}} 读取
   * @param {object} report
   * @returns {string}
   */
  function buildLedger(report) {
    const core = dep('core')
    const schema = dep('schema')

    const totalMin = core.read('sys.total_min', 0)
    const day = Math.floor(totalMin / 1440) + 1
    const phaseObj = schema.PHASES.find(p => p.key === report.phase)
    const phaseName = phaseObj ? phaseObj.name : report.phase

    const lines = [`【第 ${day} 天 · ${phaseName}】`]

    // 在场
    if (report.present && report.present.length) {
      lines.push('在场：' + report.present
        .map(p => p.cue ? `${p.name}（${p.cue}）` : p.name)
        .join('、'))
    } else {
      lines.push('在场：无')
    }

    // 近况：世界事件优先，再补角色行为，总数不超过 3 条
    const we = (report.worldEvents || []).map(e => e.narration).filter(Boolean)
    const ae = (report.events || []).map(e => e.narration || `${e.npcName}${e.actionLabel}`)
    const recent = [...we, ...ae].slice(0, 3)
    if (recent.length) {
      lines.push('近况：')
      for (const t of recent) lines.push('· ' + t)
    }

    return lines.join('\n')
  }

  // ============================================================
  // 二·补二、监听面板（对玩家隐藏，只写变量 + 可选 DOM）
  // ============================================================

  /**
   * 生成监听快照：所有 monitored 角色的位置与状态
   * 不写进提示词，不占 token
   * @param {object} report
   * @param {object} npcs
   * @returns {object}
   */
  function buildWatch(report, npcs) {
    const core = dep('core')
    const schema = dep('schema')
    const rules = dep('rules')

    const totalMin = core.read('sys.total_min', 0)
    const day = Math.floor(totalMin / 1440) + 1
    const presentIds = (report.present || []).map(p => p.id)

    const list = []
    for (const npc of Object.values(npcs)) {
      if (!npc.monitored) continue
      if (npc.alive === false) {
        list.push({ id: npc.id, name: npc.name, alive: false })
        continue
      }

      const loc = schema.LOCATIONS[npc.location]
      const lastAct = (npc.history || [])[npc.history.length - 1] || null

      list.push({
        id: npc.id,
        name: npc.name,
        alive: true,
        location: npc.location,
        locationName: loc ? loc.name : npc.location,
        stage: npc.stage,
        corruption: npc.corruption,
        sanity: npc.sanity,
        present: presentIds.includes(npc.id),
        lastAction: lastAct,
        lines: rules.activeLineIds(npc)
      })
    }

    return {
      turn: report.turn,
      day,
      phase: report.phase,
      at: totalMin,
      list
    }
  }

  /**
   * 把监听快照渲染成单行文本（给 DOM 用）
   * @param {object} watch
   * @returns {string}
   */
  function watchText(watch) {
    if (!watch || !watch.list) return ''
    return watch.list
      .filter(x => x.alive)
      .map(x => `【${x.name}】${x.locationName}｜${stageName(x.stage)}｜堕落${x.corruption}${x.present ? '｜在场' : ''}`)
      .join('\n')
  }

  /**
   * 阶段中文名
   * @param {string} s
   * @returns {string}
   */
  function stageName(s) {
    return { normal: '正常', anomaly: '异常', sinking: '沉沦', subjugated: '臣服' }[s] || s
  }

  // ============================================================
  // 三、推演
  // ============================================================

  let _lastReport = null

  /**
   * 结算一个角色的行动
   * @param {object} npc
   * @param {object} action
   * @returns {object} 事件
   */
  function applyAction(npc, action) {
    const before = { corruption: npc.corruption, drives: { ...npc.drives }, location: npc.location }

    for (const [k, v] of Object.entries(action.effects.drives || {})) {
      npc.drives[k] = Math.max(0, Math.min(100, (npc.drives[k] ?? 0) + v))
    }
    npc.corruption = Math.max(0, Math.min(100, npc.corruption + (action.effects.corruption || 0)))
    npc.sanity = Math.max(0, Math.min(100, (npc.sanity ?? 80) + (action.effects.sanity || 0)))
    npc.exposure = Math.max(0, Math.min(100, (npc.exposure ?? 0) + (action.effects.exposure || 0)))
    if (action.effects.move) npc.location = action.effects.move

    const oldStage = npc.stage
    npc.stage = dep('schema').stageOf(npc.corruption)

    npc.history = (npc.history || []).concat(action.id).slice(-30)

    return {
      npcId: npc.id,
      npcName: npc.name,
      actionId: action.id,
      actionLabel: action.label,
      narration: action.narration || `${npc.name}${action.label}`,
      delta: {
        corruption: npc.corruption - before.corruption,
        location: npc.location !== before.location ? `${before.location}→${npc.location}` : null
      },
      stageChanged: oldStage !== npc.stage ? `${oldStage}→${npc.stage}` : null
    }
  }

  /**
   * 时段结束：驱动力向基线回归 + 生活压力
   * @param {object} npc
   * @param {object} pressure { needPerTurn }
   */
  function endOfTurnDrift(npc, pressure = {}) {
    for (const k of Object.keys(npc.drives || {})) {
      const base = npc.baseline?.[k] ?? npc.drives[k]
      npc.drives[k] += (base - npc.drives[k]) * 0.10
    }
    if ('need' in (npc.drives || {})) {
      npc.drives.need = Math.min(100, npc.drives.need + (pressure.needPerTurn ?? 2))
    }
  }

  /**
   * 跑一轮推演（所有角色）
   * @param {object} [opts] { rnd, force }
   * @returns {object} 报告
   */
  function runTurn(opts = {}) {
    const core = dep('core')
    const agency = dep('agency')
    const presence = dep('presence')
    const translate = dep('translate')
    const schema = dep('schema')

    const rndFn = opts.rnd || Math.random
    const npcs = core.read('npcs', {})
    const actions = core.read('actionLibrary', {})
    let flags = core.read('world.flags', {})
    const phase = core.read('sys.phase', 'morning')
    const playerRoom = core.read('player.room_id', dep('schema').DEFAULT_ROOM)
    const turnIndex = (core.read('sys.turn_index', 0)) + 1

    const events = []
    const decisions = []
    const worldEvents = []

    // ① 世界事件（发生在角色行动之前，可能改变角色状态，影响本轮选择）
    const eventMod = REG.modules.event
    if (eventMod) {
      const totalMin = core.read('sys.total_min', 0)
      const day = Math.floor(totalMin / 1440) + 1
      const lib = core.read('eventLibrary', {})
      const toFire = eventMod.checkAll({ day, phase, flags }, npcs, lib, rndFn)

      for (const ev of toFire) {
        const rec = eventMod.apply(ev, npcs, { flags })
        worldEvents.push(rec)
        flags = core.read('world.flags', {})   // 事件可能改了 flags
      }
    }

    // 逐个角色决策 + 结算
    for (const [id, npc] of Object.entries(npcs)) {
      if (npc.alive === false) continue

      const res = agency.decide(npc, actions, { phase, flags }, rndFn)
      decisions.push({
        npcId: id,
        npcName: npc.name,
        candidates: res.scored.map(s => ({ id: s.id, score: s.score, detail: s.detail })),
        blocked: (res.blocked || []).map(b => ({ action: b.action.label, by: b.by })),
        chosen: res.action?.id || null,
        reason: res.reason || null
      })

      if (res.action) {
        events.push(applyAction(npc, res.action))
      }

      endOfTurnDrift(npc)
      npc.stage = schema.stageOf(npc.corruption)
      translate.writeCharD1(id, npc, core.read, core.write)
      npcs[id] = npc
    }

    // 在场判定
    const lastSeen = core.read('sys.last_seen', {})
    const pres = presence.resolve(Object.values(npcs), {
      roomId: playerRoom, phase, flags, turnIndex, lastSeen
    })
    for (const p of pres.present) lastSeen[p.id] = turnIndex

    // 写回
    core.write('npcs', npcs)
    core.write('present', pres.present.map(p => p.id))
    core.write('sys.turn_index', turnIndex)
    core.write('sys.last_seen', lastSeen)

    // 事件入队（保留最近 50 条）：世界事件在前，角色行为在后
    const queue = core.read('events', [])
    queue.push(...worldEvents.map(e => ({ ...e, turn: turnIndex, phase })))
    queue.push(...events.map(e => ({ ...e, turn: turnIndex, phase })))
    core.write('events', queue.slice(-50))

    _lastReport = {
      turn: turnIndex, phase, playerRoom,
      worldEvents,
      events, decisions, present: pres.present,
      absent: pres.absent, offStage: pres.offStage
    }

    // 通知订阅者（不直接调 hud，避免反向依赖）
    const listeners = REG.hooks?.afterTurn || []
    for (const fn of listeners) {
      try { fn(_lastReport) } catch (e) { console.warn('[OKH] afterTurn 钩子出错：', e) }
    }

    // 写台账：世界书靠 {{getvar::okh.ledger}} 把这段喂给 AI
    core.write('ledger', buildLedger(_lastReport))

    // 写监听快照：只给开发者和隐藏面板用，不进提示词
    const watch = buildWatch(_lastReport, npcs)
    core.write('watch', watch)
    _lastReport.watch = watch

    return _lastReport
  }

  // ============================================================
  // 三、时间步进
  // ============================================================

  /**
   * 推进时间（可能触发推演）
   * @param {number} elapsedMin
   * @param {object} [opts]
   * @returns {object} { before, after, oldPhase, newPhase, triggered }
   */
  function tick(elapsedMin, opts = {}) {
    const core = dep('core')

    const before = core.read('sys.total_min', 0)
    const after = before + Math.max(0, Math.floor(elapsedMin))
    core.write('sys.total_min', after)

    const oldPhase = core.read('sys.phase', null)
    const newPhase = derivePhase(after)
    core.write('sys.phase', newPhase)

    const triggered = oldPhase !== null && oldPhase !== newPhase

    let report = null
    if (triggered || opts.force) {
      report = runTurn(opts)
    }

    return { before, after, oldPhase, newPhase, triggered, report }
  }

  // ============================================================
  // 四、事件钩子
  // ============================================================

  let _handler = null

  /**
   * 节奏配置
   *   everyMessages：不管 AI 报不报时间，每 N 条消息强制推演一次
   *   minutesPerTick：每次强制推进多少游戏分钟
   *   useAITime：AI 报了 <time> 就优先用它
   *
   * ⚠️ 以下三个数值均为**测试用默认值**，不是定稿。
   *    正式节奏（多久推进一次、一次推进多久）必须由主人决定。
   *    待定项见 `待定清单.md` 第 1 节。
   */
  const RHYTHM = {
    everyMessages: 3,        // 测试值
    minutesPerTick: 60,      // 测试值
    useAITime: true          // 默认策略，待确认
  }
  let _msgCount = 0

  /**
   * 收到消息时的处理
   *
   * 两套推进机制并存：
   *   A. AI 报了 <time> 且跨时段 → 立即推演（跟叙事同步）
   *   B. 每 N 条消息强制推演一次（保证世界一定在动）
   */
  function onMessageReceived() {
    try {
      const core = dep('core')
      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null
      const chat = ctx?.chat
      if (!chat || !chat.length) return

      const last = chat[chat.length - 1]
      if (!last || last.is_user) return

      _msgCount++

      // ---- A. 优先用 AI 申报的时间 ----
      const elapsed = parseElapsed(last.mes || '')
      if (elapsed !== null && RHYTHM.useAITime) {
        const before = core.read('sys.total_min', 0)
        const after = before + elapsed
        core.write('sys.total_min', after)

        const oldPhase = core.read('sys.phase', null)
        const newPhase = derivePhase(after)
        core.write('sys.phase', newPhase)

        if (oldPhase !== null && oldPhase !== newPhase) {
          _msgCount = 0
          runTurn()
          return
        }
      }

      // ---- B. 固定节奏：够 N 条就推进一次 ----
      if (_msgCount >= RHYTHM.everyMessages) {
        _msgCount = 0
        const before = core.read('sys.total_min', 0)
        const after = before + RHYTHM.minutesPerTick
        core.write('sys.total_min', after)
        core.write('sys.phase', derivePhase(after))
        runTurn()
      }
    } catch (e) {
      console.error('[OKH] 消息处理失败：', e)
    }
  }

  /**
   * 挂钩子
   * @returns {boolean}
   */
  function attach() {
    if (_handler) { console.log('[OKH] 钩子已存在'); return true }
    if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined') {
      console.warn('[OKH] 当前环境不支持 eventOn，请手动调用 __OKH__.modules.turn.tick()')
      return false
    }
    _handler = onMessageReceived
    eventOn(tavern_events.MESSAGE_RECEIVED, _handler)
    console.log('[OKH] 钩子已挂上 · 等待 AI 申报时间')
    return true
  }

  /**
   * 摘钩子
   */
  function detach() {
    if (!_handler) return false
    if (typeof eventRemoveListener === 'function' && typeof tavern_events !== 'undefined') {
      eventRemoveListener(tavern_events.MESSAGE_RECEIVED, _handler)
    }
    _handler = null
    console.log('[OKH] 钩子已摘下')
    return true
  }

  REG.modules.turn = {
    PHASES, RHYTHM, derivePhase, parseElapsed, runTurn, tick, attach, detach,
    buildLedger, buildWatch, watchText,
    lastReport: () => _lastReport
  }

  console.log('[OKH] turn 已就绪 · 手动推演请用 __OKH__.modules.turn.runTurn()')
})()
