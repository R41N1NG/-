/**
 * @module      okh_debug
 * @updated     2026-11-08 20:12
 * @status      active
 * @reason      调试工具。查看状态、手动推演、重置数据。只在开发期使用
 * @deps        ['okh_boot', 'okh_core', 'okh_schema', 'okh_rules', 'okh_agency', 'okh_presence', 'okh_translate', 'okh_turn']
 * @provides    { status, who, simulate, reset, present, events, candidates }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_debug 加载失败'); return }

  const M = () => REG.modules

  /**
   * 全局概览
   */
  function status() {
    const { core } = M()
    const npcs = core.read('npcs', {})
    const totalMin = core.read('sys.total_min', 0)
    const phase = core.read('sys.phase', 'unknown')
    const turn = core.read('sys.turn_index', 0)

    console.group(`[OKH] 第 ${turn} 回合 · ${phase} · 累计 ${totalMin} 分钟`)
    const rows = Object.values(npcs).map(n => ({
      姓名: n.name,
      阶段: n.stage,
      堕落: n.corruption,
      理智: n.sanity,
      位置: n.location,
      底线: M().rules.activeLineIds(n).join(',') || '无'
    }))
    if (rows.length) console.table(rows)
    else console.warn('还没有角色。请先运行 __OKH__.modules.debug.seed()')
    console.groupEnd()
    return rows
  }

  /**
   * 看某个人的细节
   * @param {string} id
   */
  function who(id) {
    const { core, rules } = M()
    const npcs = core.read('npcs', {})
    const actions = core.read('actionLibrary', {})
    const npc = npcs[id]
    if (!npc) { console.warn('找不到', id); return null }

    const phase = core.read('sys.phase', 'morning')
    const flags = core.read('world.flags', {})

    console.group(`[OKH] ${npc.name}`)
    console.log('阶段', npc.stage, '堕落', npc.corruption, '理智', npc.sanity)
    console.log('驱动力', npc.drives)
    console.log('基线  ', npc.baseline)
    console.log('位置', npc.location, '| 优先级', npc.priority)
    console.log('生效底线', rules.activeLineIds(npc))
    console.log(rules.explain(npc, actions, { phase, flags }))
    console.log('最近行为', (npc.history || []).slice(-10))
    console.groupEnd()
    return npc
  }

  /**
   * 看某个角色此刻的候选打分
   * @param {string} id
   */
  function candidates(id) {
    const { core, agency } = M()
    const npcs = core.read('npcs', {})
    const actions = core.read('actionLibrary', {})
    const npc = npcs[id]
    if (!npc) { console.warn('找不到', id); return null }

    const phase = core.read('sys.phase', 'morning')
    const flags = core.read('world.flags', {})
    const res = agency.decide(npc, actions, { phase, flags })

    console.group(`[OKH] ${npc.name} 的候选`)
    console.table(res.scored.map(s => ({
      行动: s.label,
      分数: s.score,
      基础: s.detail.base,
      修正: s.detail.mult,
      说明: s.detail.notes.join('×') || '-',
      惯性: s.detail.inertia,
      闲置: s.detail.idleBoost,
      噪声: s.detail.noise
    })))
    if (res.blocked.length) {
      console.log('被底线挡住：', res.blocked.map(b => `${b.action.label}(${b.by.join(',')})`))
    }
    if (res.rejected.length) {
      console.log('条件不足：', res.rejected)
    }
    console.groupEnd()
    return res
  }

  /**
   * 连跑 N 轮
   * @param {number} n
   */
  function simulate(n = 5) {
    const { turn } = M()
    const reports = []
    for (let i = 0; i < n; i++) reports.push(turn.runTurn({ force: true }))
    console.log(`[OKH] 已连跑 ${n} 轮`)
    return reports
  }

  /**
   * 看最近事件
   * @param {number} n
   */
  function events(n = 10) {
    const { core } = M()
    const queue = core.read('events', [])
    const rows = queue.slice(-n).map(e => ({
      回合: e.turn,
      时段: e.phase,
      角色: e.npcName,
      行为: e.actionLabel,
      变化: e.delta?.corruption ? `堕落+${e.delta.corruption}` : '',
      位置: e.delta?.location || ''
    }))
    console.table(rows)
    return rows
  }

  /**
   * 看当前在场
   */
  function present() {
    const { turn, presence } = M()
    const { core } = M()
    const npcs = core.read('npcs', {})
    const phase = core.read('sys.phase', 'morning')
    const flags = core.read('world.flags', {})
    const room = core.read('player.room_id', M().schema.DEFAULT_ROOM)

    const res = presence.resolve(Object.values(npcs), {
      roomId: room, phase, flags, turnIndex: core.read('sys.turn_index', 0)
    })
    console.group(`[OKH] 玩家在 ${room} · ${phase}`)
    console.log('在场：', res.present.map(p => p.name).join('、') || '无')
    if (res.absent.length) console.log('缺席：', res.absent.map(a => `${a.name}(${a.reason})`).join('、'))
    if (res.offStage.length) console.log('挤出：', res.offStage.map(o => o.name).join('、'))
    console.log('逐个检查：')
    for (const npc of Object.values(npcs)) console.log('  ' + presence.whyNot(npc, { roomId: room, phase, flags }))
    console.groupEnd()
    return res
  }

  /**
   * 监听面板：所有被监听角色的位置与状态
   */
  function watch() {
    const { core } = M()
    const w = core.read('watch', null)
    if (!w || !w.list) {
      console.warn('[OKH] 还没有监听数据，先跑一轮 __OKH__.modules.turn.runTurn()')
      return null
    }

    const STAGE = { normal: '正常', anomaly: '异常', sinking: '沉沦', subjugated: '臣服' }
    console.group(`[OKH] 监听 · 第 ${w.day} 天 ${w.phase} · 回合 ${w.turn}`)
    console.table(w.list.filter(x => x.alive).map(x => ({
      姓名: x.name,
      位置: x.locationName,
      阶段: STAGE[x.stage] || x.stage,
      堕落: x.corruption,
      理智: x.sanity,
      在场: x.present ? '● ' : '○ ',
      上次行为: x.lastAction || '-',
      剩余底线: (x.lines || []).join(',') || '无'
    })))
    const off = w.list.filter(x => !x.alive)
    if (off.length) console.log('已离场：', off.map(o => o.name).join('、'))
    console.groupEnd()
    return w
  }

  /**
   * 世界事件：已触发的、还没触发的
   */
  function worldEvents() {
    const { core } = M()
    const lib = core.read('eventLibrary', {})
    const fired = core.read('events_fired', [])

    const rows = Object.values(lib).map(e => ({
      事件: e.label || e.id,
      状态: fired.includes(e.id) ? '已触发' : '未触发',
      条件: describeTrigger(e.trigger)
    }))
    console.group(`[OKH] 世界事件 · ${fired.length}/${Object.keys(lib).length} 已触发`)
    console.table(rows)
    console.groupEnd()
    return rows
  }

  /**
   * 把触发条件翻译成人话
   * @param {object} t
   * @returns {string}
   */
  function describeTrigger(t = {}) {
    const parts = []
    if (t.dayMin) parts.push(`第${t.dayMin}天起`)
    if (t.day) parts.push(`第${Array.isArray(t.day) ? t.day.join('/') : t.day}天`)
    if (t.phase) parts.push(Array.isArray(t.phase) ? t.phase.join('/') : t.phase)
    if (t.anyNpc?.corruption) parts.push(`有人堕落${t.anyNpc.corruption}`)
    if (t.anyNpc?.exposure) parts.push(`有人曝光${t.anyNpc.exposure}`)
    if (t.chance && t.chance < 1) parts.push(`概率${Math.round(t.chance * 100)}%`)
    return parts.join(' ') || '无条件'
  }

  /**
   * 清空所有 OKH 变量（慎用）
   */
  function reset() {
    const { core } = M()
    const keys = core.keys()
    for (const k of keys) core.remove(k.replace(/^okh\./, ''))
    console.warn(`[OKH] 已清空 ${keys.length} 个变量`)
  }

  /**
   * 装载数据（调用 10_okh_data.js 暴露的 seed）
   */
  function seed(force = false) {
    if (typeof REG.modules.data?.seed === 'function') {
      return REG.modules.data.seed(force)
    }
    console.warn('[OKH] 未找到数据模块，请先加载 10_okh_data.js')
    return null
  }

  REG.modules.debug = { status, who, candidates, simulate, events, present, watch, worldEvents, reset, seed }

  console.log('[OKH] debug 已就绪 · 试试 __OKH__.modules.debug.status()')
})()
