/**
 * @module      okh_event
 * @updated     2026-11-09 03:10
 * @status      active
 * @reason      条件事件系统。满足条件时触发预设事件，改变世界状态。不认识任何具体角色
 * @deps        ['okh_boot', 'okh_core', 'okh_schema', 'okh_rules']
 * @provides    { CONFIG, checkAll, apply, makeEvent, firedList, resetFired }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_event 加载失败'); return }

  function dep(name) {
    const m = REG.modules[name]
    if (!m) throw new Error(`[OKH] 依赖未加载：${name}`)
    return m
  }

  const CONFIG = {
    /** 每轮最多触发几个事件（防一次全炸） */
    maxPerTurn: 2
  }

  // ============================================================
  // 一、事件结构
  // ============================================================

  /**
   * 造一个事件
   * @param {string} id
   * @param {object} cfg
   * @returns {object}
   */
  function makeEvent(id, cfg = {}) {
    return {
      id,
      label: cfg.label || id,
      narration: cfg.narration || '',

      /** 只触发一次（触发后写进 fired 表） */
      once: cfg.once !== false,

      /** 触发条件 */
      trigger: {
        day: cfg.trigger?.day ?? null,          // 第几天（可为数组）
        dayMin: cfg.trigger?.dayMin ?? null,    // 至少第几天
        phase: cfg.trigger?.phase ?? null,      // 时段（数组）
        flags: cfg.trigger?.flags || {},        // 世界标记
        notFlags: cfg.trigger?.notFlags || {},
        anyNpc: cfg.trigger?.anyNpc || null,    // 某条件在任一角色上成立
        chance: cfg.trigger?.chance ?? 1        // 概率（0~1）
      },

      /** 触发后的效果 */
      effects: {
        target: cfg.effects?.target || null,    // 角色 id / id 数组 / 'all'
        drives: cfg.effects?.drives || {},
        corruption: cfg.effects?.corruption ?? 0,
        sanity: cfg.effects?.sanity ?? 0,
        exposure: cfg.effects?.exposure ?? 0,
        move: cfg.effects?.move || null,
        setFlags: cfg.effects?.setFlags || {}
      }
    };
  }

  // ============================================================
  // 二、条件判定
  // ============================================================

  /**
   * 世界条件是否满足
   * @param {object} ev
   * @param {object} ctx { day, phase, flags }
   * @param {object} npcs
   * @returns {{ok:boolean, reason?:string}}
   */
  function checkTrigger(ev, ctx, npcs) {
    const t = ev.trigger || {}

    // 天数（用 != null 同时排除 undefined 和 null）
    if (t.day != null) {
      const days = Array.isArray(t.day) ? t.day : [t.day]
      if (!days.includes(ctx.day)) return { ok: false, reason: `不是第 ${t.day} 天` }
    }
    if (t.dayMin != null && ctx.day < t.dayMin) {
      return { ok: false, reason: `还没到第 ${t.dayMin} 天` }
    }

    // 时段
    if (t.phase != null) {
      const phases = Array.isArray(t.phase) ? t.phase : [t.phase]
      if (!phases.includes(ctx.phase)) return { ok: false, reason: `不是 ${t.phase}` }
    }

    // 世界标记
    for (const [k, v] of Object.entries(t.flags || {})) {
      if (ctx.flags?.[k] !== v) return { ok: false, reason: `flag ${k} 未满足` }
    }
    for (const [k, v] of Object.entries(t.notFlags || {})) {
      if (ctx.flags?.[k] === v) return { ok: false, reason: `flag ${k} 已存在（互斥）` }
    }

    // 角色条件（任一满足即可）
    if (t.anyNpc) {
      const { rules } = REG.modules
      const hit = Object.values(npcs).some(n => {
        if (n.alive === false) return false
        if (t.anyNpc.corruption && !rules.test(n.corruption, t.anyNpc.corruption)) return false
        if (t.anyNpc.exposure && !rules.test(n.exposure ?? 0, t.anyNpc.exposure)) return false
        if (t.anyNpc.sanity && !rules.test(n.sanity ?? 80, t.anyNpc.sanity)) return false
        if (t.anyNpc.drives) {
          for (const [k, expr] of Object.entries(t.anyNpc.drives)) {
            if (!rules.test(n.drives?.[k] ?? 0, expr)) return false
          }
        }
        return true
      })
      if (!hit) return { ok: false, reason: '没有角色满足条件' }
    }

    return { ok: true }
  }

  // ============================================================
  // 三、已触发记录
  // ============================================================

  /**
   * 读已触发列表
   * @returns {string[]}
   */
  function firedList() {
    return dep('core').read('events_fired', [])
  }

  /**
   * 重置已触发记录
   */
  function resetFired() {
    dep('core').write('events_fired', [])
  }

  // ============================================================
  // 四、检查 + 应用
  // ============================================================

  /**
   * 检查本轮该触发哪些事件
   * @param {object} ctx { day, phase, flags }
   * @param {object} npcs
   * @param {object[]} library 事件库
   * @param {function} rndFn
   * @returns {object[]} 触发的事件列表
   */
  function checkAll(ctx, npcs, library, rndFn = Math.random) {
    const fired = firedList()
    const out = []

    for (const [id, ev] of Object.entries(library)) {
      if (out.length >= CONFIG.maxPerTurn) break
      if (ev.once && fired.includes(id)) continue

      const chk = checkTrigger(ev, ctx, npcs)
      if (!chk.ok) continue

    // 概率判定（trigger.chance 缺省视为 1）
    const chance = ev.trigger?.chance ?? 1
    if (chance < 1 && rndFn() > chance) continue

      out.push(ev)
    }

    return out
  }

  /**
   * 把事件效果作用到角色上
   * @param {object} ev
   * @param {object} npcs 会被原地修改
   * @param {object} ctx { flags }
   * @returns {object} 事件触发记录
   */
  function apply(ev, npcs, ctx) {
    const core = dep('core')
    const schema = dep('schema')

    const e = ev.effects || {}
    const touched = []

    // 决定作用对象
    let targets = []
    if (!e.target) {
      targets = []
    } else if (e.target === 'all') {
      targets = Object.values(npcs).filter(n => n.alive !== false)
    } else if (Array.isArray(e.target)) {
      targets = e.target.map(id => npcs[id]).filter(Boolean)
    } else {
      const one = npcs[e.target]
      if (one) targets = [one]
    }

    for (const npc of targets) {
      for (const [k, v] of Object.entries(e.drives || {})) {
        npc.drives[k] = Math.max(0, Math.min(100, (npc.drives[k] ?? 0) + v))
      }
      if (e.corruption) {
        npc.corruption = Math.max(0, Math.min(100, npc.corruption + e.corruption))
      }
      if (e.sanity) {
        npc.sanity = Math.max(0, Math.min(100, (npc.sanity ?? 80) + e.sanity))
      }
      if (e.exposure) {
        npc.exposure = Math.max(0, Math.min(100, (npc.exposure ?? 0) + e.exposure))
      }
      if (e.move) npc.location = e.move

      npc.stage = schema.stageOf(npc.corruption)
      touched.push({ id: npc.id, name: npc.name, corruption: npc.corruption })
    }

    // 世界标记
    const flags = { ...(ctx.flags || {}) }
    Object.assign(flags, e.setFlags || {})
    core.write('world.flags', flags)

    // 记录已触发
    const fired = firedList()
    if (ev.once && !fired.includes(ev.id)) {
      fired.push(ev.id)
      core.write('events_fired', fired)
    }

    return {
      kind: 'world_event',
      eventId: ev.id,
      label: ev.label,
      narration: ev.narration,
      touched,
      setFlags: e.setFlags
    }
  }

  REG.modules.event = {
    CONFIG, makeEvent, checkTrigger, checkAll, apply, firedList, resetFired
  }

  console.log('[OKH] event 已就绪 · 条件事件系统')
})()
