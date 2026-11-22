/**
 * @module      okh_agency
 * @updated     2026-11-08 20:06
 * @status      active
 * @reason      决策层。按通用效用公式给行动打分，加权随机选一个。不认识任何具体角色
 * @deps        ['okh_boot', 'okh_core', 'okh_schema', 'okh_rules']
 * @provides    { CONFIG, scoreOf, decide, tagModifier }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_agency 加载失败'); return }

  const rules = () => REG.modules.rules

  // ============================================================
  // 可调参数
  // ⚠️ 以下数值均为**测试用默认值**，不是定稿。
  //    它们决定"角色多变、多固执、多随机"，
  //    正式数值需主人试玩后确定。待定项见 `待定清单.md` 第 2 节。
  // ============================================================

  const CONFIG = {
    inertiaPerRepeat: 0.25,   // 每做过一次，权重 +25%（测试值）
    inertiaCap: 4,            // 惯性计数上限（测试值）
    idlePerTurn: 0.15,        // 每闲置一时段，权重 +15%（测试值）
    idleCap: 6,               // 闲置计数上限（测试值）
    noiseRange: 0.20          // 随机扰动 ±20%（测试值）
  }

  // ============================================================
  // 标签规则表（配置驱动，加规则不改逻辑）
  //   格式：当 action 带有 tag，且角色某 drive 满足比较条件时，权重乘 mult
  // ============================================================

  const TAG_RULES = [
    { tag: 'money',     drive: 'need',      op: '>', val: 60, mult: 1.40 },
    { tag: 'expose',    drive: 'shame',     op: '>', val: 60, mult: 0.75 },
    { tag: 'risk',      drive: 'curiosity', op: '>', val: 60, mult: 1.35 },
    { tag: 'risk',      drive: 'fear',      op: '>', val: 65, mult: 0.70 },
    { tag: 'duty',      drive: 'duty',      op: '>', val: 65, mult: 1.25 },
    { tag: 'bond',      drive: 'loyalty',   op: '>', val: 65, mult: 1.25 },
    { tag: 'humiliate', drive: 'pride',     op: '>', val: 70, mult: 0.60 },
    { tag: 'risk',      drive: null,        op: 'sanity<', val: 40, mult: 1.20 }
  ]

  /** 越界类：权重随堕落度线性上升，从 from 开始 */
  const CORRUPTION_RULE = { tag: 'taboo', from: 30, scale: 0.010 }

  /**
   * 比较函数
   * @param {number} v
   * @param {string} op
   * @param {number} n
   * @returns {boolean}
   */
  function cmp(v, op, n) {
    if (op === '>') return v > n
    if (op === '>=') return v >= n
    if (op === '<') return v < n
    if (op === '<=') return v <= n
    return false
  }

  /**
   * 按标签 + 驱动力算修正系数（规则表驱动）
   * @param {object} action
   * @param {object} npc
   * @returns {{mult:number, notes:string[]}}
   */
  function tagModifier(action, npc) {
    let mult = 1
    const notes = []
    const tags = action.tags || []
    const d = npc.drives || {}

    for (const rule of TAG_RULES) {
      if (!tags.includes(rule.tag)) continue

      // drive 为 null 时，比较对象是 sanity
      const isSanity = rule.op.startsWith('sanity')
      const op = isSanity ? rule.op.slice(6) : rule.op
      const value = isSanity ? (npc.sanity ?? 80) : (d[rule.drive] ?? 0)

      if (cmp(value, op, rule.val)) {
        mult *= rule.mult
        notes.push(`${rule.tag}:${rule.drive || 'sanity'}${rule.mult}`)
      }
    }

    // 越界类：堕落度越高越想做
    if (tags.includes(CORRUPTION_RULE.tag) && npc.corruption >= CORRUPTION_RULE.from) {
      const bonus = 1 + (npc.corruption - CORRUPTION_RULE.from) * CORRUPTION_RULE.scale
      mult *= bonus
      notes.push(`taboo+${(bonus - 1).toFixed(2)}`)
    }

    return { mult, notes }
  }

  // ============================================================
  // 打分
  // ============================================================

  /**
   * 算某行动的得分
   * @param {object} action
   * @param {object} npc
   * @param {number} rnd 0~1
   * @returns {object} 明细
   */
  function scoreOf(action, npc, rnd) {
    const hist = npc.history || []
    const count = hist.filter(h => h === action.id).length
    const lastIdx = hist.lastIndexOf(action.id)
    const idle = lastIdx < 0 ? CONFIG.idleCap
               : Math.min(hist.length - 1 - lastIdx, CONFIG.idleCap)

    const inertia = 1 + CONFIG.inertiaPerRepeat * Math.min(count, CONFIG.inertiaCap)
    const idleBoost = 1 + CONFIG.idlePerTurn * Math.min(idle, CONFIG.idleCap)
    const { mult, notes } = tagModifier(action, npc)

    const noise = 1 - CONFIG.noiseRange + rnd * CONFIG.noiseRange * 2
    const score = action.base * mult * inertia * idleBoost * noise

    return {
      id: action.id,
      label: action.label,
      score: Number(score.toFixed(2)),
      detail: {
        base: action.base,
        mult: Number(mult.toFixed(2)),
        notes,
        inertia: Number(inertia.toFixed(2)),
        count,
        idleBoost: Number(idleBoost.toFixed(2)),
        idle,
        noise: Number(noise.toFixed(2))
      }
    }
  }

  /**
   * 加权随机
   * @param {object[]} scored
   * @param {number} rnd
   * @returns {object|null}
   */
  function pickWeighted(scored, rnd) {
    const total = scored.reduce((s, c) => s + c.score, 0)
    if (total <= 0) return null
    const target = rnd * total
    let acc = 0
    for (const c of scored) {
      acc += c.score
      if (target <= acc) return c
    }
    return scored[scored.length - 1]
  }

  // ============================================================
  // 决策
  // ============================================================

  /**
   * 让一个角色做决定
   * @param {object} npc
   * @param {object} actionLibrary
   * @param {object} ctx { phase, flags }
   * @param {function} [rndFn] 随机函数，默认 Math.random
   * @returns {{action:object|null, scored:object[], blocked:object[], rejected:object[], reason?:string}}
   */
  function decide(npc, actionLibrary, ctx, rndFn = Math.random) {
    const { ok, blocked, rejected } = rules().availableActions(npc, actionLibrary, ctx)

    if (!ok.length) {
      return { action: null, scored: [], blocked, rejected, reason: '没有可做的事' }
    }

    const scored = ok
      .map(a => ({ ...scoreOf(a, npc, rndFn()), action: a }))
      .sort((x, y) => y.score - x.score)

    const chosen = pickWeighted(scored, rndFn())
    return { action: chosen?.action || null, scored, blocked, rejected, chosen }
  }

  REG.modules.agency = { CONFIG, TAG_RULES, CORRUPTION_RULE, scoreOf, decide, tagModifier, pickWeighted }

  console.log('[OKH] agency 已就绪 · 标签规则 ' + TAG_RULES.length + ' 条，配置驱动')
})()
