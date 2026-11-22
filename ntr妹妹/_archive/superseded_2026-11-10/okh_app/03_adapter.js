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
