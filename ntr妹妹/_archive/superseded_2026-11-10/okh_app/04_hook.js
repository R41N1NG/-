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
