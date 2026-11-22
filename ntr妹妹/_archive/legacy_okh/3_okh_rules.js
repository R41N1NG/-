/**
 * @module      okh_rules
 * @updated     2026-11-08 20:05
 * @status      active
 * @reason      纯函数判定层。只回答"能不能做"，不执行任何副作用
 * @deps        ['okh_boot', 'okh_core', 'okh_schema']
 * @provides    { test, lineActive, activeLineIds, checkRequires, availableActions, explain }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_rules 加载失败'); return }

  const schema = () => REG.modules.schema

  // ============================================================
  // 条件表达式
  // ============================================================

  /**
   * 判断 "<30" / ">=2" / ">50" 这类表达式
   * @param {number} value
   * @param {string} expr
   * @returns {boolean}
   */
  function test(value, expr) {
    if (expr === null || expr === undefined) return true
    const m = /^([<>]=?)(-?\d+)$/.exec(String(expr).trim())
    if (!m) return false
    const op = m[1]
    const n = Number(m[2])
    const v = Number(value) || 0
    if (op === '<') return v < n
    if (op === '<=') return v <= n
    if (op === '>') return v > n
    return v >= n
  }

  // ============================================================
  // 底线
  // ============================================================

  /**
   * 某条底线此刻是否还有效（有效 = 会封锁动作）
   * @param {object} line { id, type, holdsWhile }
   * @param {object} npc
   * @returns {boolean}
   */
  function lineActive(line, npc) {
    for (const [key, expr] of Object.entries(line.holdsWhile || {})) {
      const v = key === 'corruption' ? npc.corruption
              : key === 'sanity' ? npc.sanity
              : (npc.drives[key] ?? 0)
      if (!test(v, expr)) return false
    }
    return true
  }

  /**
   * 当前生效的底线 id 列表
   * @param {object} npc
   * @returns {string[]}
   */
  function activeLineIds(npc) {
    return (npc.lines || []).filter(l => lineActive(l, npc)).map(l => l.id)
  }

  /**
   * 当前生效的底线"类型"列表（供行动 matched）
   * @param {object} npc
   * @returns {string[]}
   */
  function activeLineTypes(npc) {
    return (npc.lines || []).filter(l => lineActive(l, npc)).map(l => l.type).filter(Boolean)
  }

  // ============================================================
  // 前置条件
  // ============================================================

  /**
   * 检查行动的全部前置条件
   * @param {object} action
   * @param {object} npc
   * @param {object} ctx { phase, flags }
   * @returns {{ok:boolean, reasons:string[]}}
   */
  function checkRequires(action, npc, ctx) {
    const reasons = []
    const req = action.requires || {}

    // 阶段限定
    if (action.stage && !action.stage.includes(npc.stage)) {
      reasons.push(`阶段不符（当前 ${npc.stage}）`)
    }

    // 时段限定
    if (req.phase && !req.phase.includes(ctx.phase)) {
      reasons.push(`时段不符（当前 ${ctx.phase}）`)
    }

    // 地点限定
    if (req.location && !req.location.includes(npc.location)) {
      reasons.push(`地点不符（当前 ${npc.location}）`)
    }

    // 驱动力门槛
    for (const [k, expr] of Object.entries(req.drives || {})) {
      if (!test(npc.drives[k] ?? 0, expr)) {
        reasons.push(`${schema().DRIVES[k] || k} ${expr} 未满足`)
      }
    }

    // 堕落度门槛
    if (req.corruption && !test(npc.corruption, req.corruption)) {
      reasons.push(`堕落度 ${req.corruption} 未满足`)
    }

    // 剧情标记
    for (const [k, v] of Object.entries(req.flags || {})) {
      if (ctx.flags?.[k] !== v) reasons.push(`Flag ${k} 未满足`)
    }

    // 历史次数
    for (const [k, expr] of Object.entries(req.history || {})) {
      const cnt = (npc.history || []).filter(h => h === k).length
      if (!test(cnt, expr)) reasons.push(`历史 ${k} ${expr} 未满足`)
    }

    return { ok: reasons.length === 0, reasons }
  }

  // ============================================================
  // 可用行动
  // ============================================================

  /**
   * 取某角色此刻能做的所有行动
   * @param {object} npc
   * @param {object[]} actionLibrary 全局行动库
   * @param {object} ctx { phase, flags }
   * @returns {{ok:object[], blocked:object[], rejected:object[]}}
   */
  function availableActions(npc, actionLibrary, ctx) {
    const ok = []
    const blocked = []
    const rejected = []

    const lineTypes = activeLineTypes(npc)
    const ids = npc.actions || []

    for (const aid of ids) {
      const base = actionLibrary[aid]
      if (!base) { rejected.push({ id: aid, reasons: ['行动不存在'] }); continue }

      // 个体覆盖
      const action = npc.actionOverrides?.[aid]
        ? { ...base, ...npc.actionOverrides[aid],
            requires: { ...base.requires, ...(npc.actionOverrides[aid].requires || {}) },
            effects: { ...base.effects, ...(npc.actionOverrides[aid].effects || {}) } }
        : base

      // 前置条件
      const chk = checkRequires(action, npc, ctx)
      if (!chk.ok) { rejected.push({ id: aid, reasons: chk.reasons }); continue }

      // 底线封锁（类型匹配）
      const hit = (action.blockedBy || []).filter(t => lineTypes.includes(t))
      if (hit.length) { blocked.push({ action, by: hit }); continue }

      ok.push(action)
    }

    return { ok, blocked, rejected }
  }

  /**
   * 生成人类可读的解释（调试用）
   * @param {object} npc
   * @param {object} actionLibrary
   * @param {object} ctx
   * @returns {string}
   */
  function explain(npc, actionLibrary, ctx) {
    const r = availableActions(npc, actionLibrary, ctx)
    const lines = [`【${npc.name}】阶段=${npc.stage} 堕落=${npc.corruption} 地点=${npc.location}`]
    lines.push(`  生效底线：${activeLineIds(npc).join(', ') || '无'}`)
    lines.push(`  可做 ${r.ok.length} 项：${r.ok.map(a => a.label).join('、') || '无'}`)
    if (r.blocked.length) lines.push(`  被底线挡住：${r.blocked.map(b => `${b.action.label}(${b.by.join(',')})`).join('、')}`)
    if (r.rejected.length) lines.push(`  条件不足：${r.rejected.map(x => `${x.id}(${x.reasons[0]})`).join('、')}`)
    return lines.join('\n')
  }

  REG.modules.rules = {
    test, lineActive, activeLineIds, activeLineTypes,
    checkRequires, availableActions, explain
  }

  console.log('[OKH] rules 已就绪')
})()
