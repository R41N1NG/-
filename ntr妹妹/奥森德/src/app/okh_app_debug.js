/**
 * @module okh_app_debug
 * @updated 2026-11-10 23:35
 * @status  active
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

    const STAGE = CFG.STAGES
    const rows = Object.values(world.npcs).map(n => ({
      姓名: n.name,
      监测: n.monitored ? '●' : '○',
      阶段: n.hasStage === false ? '—' : (STAGE[n.stage] ?? n.stage),
      好感: n.hasAffection === false ? '—' : Math.round(n.values?.affection ?? 0),
      位置: n.location,
      当前活动: n.activity?.label || '—',
      同地点: n.location === world.playerLocation ? '●' : '○',
      可调度状态: GPT.watch(world).npcs[n.id]?.availability || 'inactive',
      专属数值: JSON.stringify(n.values)
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
  async function reset() {
    const w = await W.resetWorld()
    console.log('[APP] 已重置')
    return w
  }

  /**
   * 看当前配置概览
   */
  function config() {
    const c = CFG.buildConfig()
    console.group('[APP] 配置')
    console.log('Schema 版本：', c.schemaVersion)
    console.log('时段：', c.phases.map(p => `${p.id}@${p.start}`).join(' '))
    console.log('保护期：', c.policy.ordinaryGraceMin, '分钟')
    console.log('行动：', c.actions.length, '条')
    console.log('事件：', c.events.length, '条')
    console.log('节点：', c.nodes.length, '条')
    console.groupEnd()
    return c
  }

  function daily() {
    const world = W.loadWorld()
    if (!world) return null
    const result = root.OKH_APP_DAILY.inspect(world)
    console.table(result.affection)
    console.table([result.work])
    return result
  }

  function echoes(npcId) {
    const world = W.loadWorld()
    if (!world) return []
    const rows = root.OKH_APP_ECHOES.inspect(world, npcId)
    console.table(rows)
    return rows
  }

  function flags(scope) {
    const world = W.loadWorld()
    if (!world) return []
    const rows = root.OKH_APP_FLAGS.inspect(world, scope)
    console.table(rows)
    return rows
  }

  function tags(npcId) {
    const world = W.loadWorld()
    if (!world) return []
    const owners = npcId === undefined ? Object.keys(world.tags || {}) : [npcId]
    const rows = owners.flatMap(id => root.OKH_APP_TAGS.list(world, id).map(tag => ({
      npc: id, character: world.npcs[id].name, ...tag
    })))
    console.table(rows)
    return rows
  }

  root.OKH_APP_DEBUG = Object.freeze({
    status, watch, ledger, queue, step, reset, config, tags, flags, echoes, daily
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_DEBUG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
