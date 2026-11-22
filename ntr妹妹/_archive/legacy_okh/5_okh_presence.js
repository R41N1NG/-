/**
 * @module      okh_presence
 * @updated     2026-11-08 20:07
 * @status      active
 * @reason      出场判定。四闸门（空间/日程/剧情/戏剧）全部是内部逻辑，对外只输出在场名单
 * @deps        ['okh_boot', 'okh_core', 'okh_schema', 'okh_rules']
 * @provides    { CONFIG, resolve, whyNot }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_presence 加载失败'); return }

  const CONFIG = {
    maxOnStage: 3,          // 同场最多几人
    rememberWindow: 6       // 多久没出场会被优先安排（用于轮换）
  }

  /**
   * 缺席原因（优先级最高，压过一切）
   * @param {object} npc
   * @param {object} flags
   * @returns {string|null}
   */
  function absenceReason(npc, flags) {
    const ab = npc.absent
    if (!ab) return null
    const conds = ab.flags || {}
    const keys = Object.keys(conds)
    if (!keys.length) return null
    const hit = keys.every(k => flags?.[k] === conds[k])
    return hit ? (ab.reason || '缺席') : null
  }

  /**
   * 四闸门判定单个角色
   * @param {object} npc
   * @param {object} ctx { roomId, phase, flags, turnIndex }
   * @returns {{pass:boolean, gate?:number, reason?:string, absentReason?:string}}
   */
  function checkOne(npc, ctx) {
    const abReason = absenceReason(npc, ctx.flags)
    if (abReason) return { pass: false, gate: 0, reason: abReason, absentReason: abReason }

    // 闸门 1 · 空间
    if (npc.location !== ctx.roomId) {
      return { pass: false, gate: 1, reason: `在 ${npc.location}` }
    }

    // 闸门 2 · 日程
    const allow = npc.schedule?.[ctx.phase]
    if (allow && !allow.includes(npc.location)) {
      return { pass: false, gate: 2, reason: `${ctx.phase} 不该在 ${npc.location}` }
    }

    // 闸门 3 · 剧情
    const req = npc.presenceRequires || {}
    for (const [k, v] of Object.entries(req.flags || {})) {
      if (ctx.flags?.[k] !== v) return { pass: false, gate: 3, reason: `Flag ${k} 未满足` }
    }
    for (const [k, expr] of Object.entries(req.drives || {})) {
      if (!REG.modules.rules.test(npc.drives[k] ?? 0, expr)) {
        return { pass: false, gate: 3, reason: `${k} ${expr} 未满足` }
      }
    }
    if (req.corruption && !REG.modules.rules.test(npc.corruption, req.corruption)) {
      return { pass: false, gate: 3, reason: `堕落度 ${req.corruption} 未满足` }
    }

    return { pass: true }
  }

  /**
   * 算出此刻的在场名单
   * @param {object[]} npcs 全部角色
   * @param {object} ctx { roomId, phase, flags, turnIndex, lastSeen }
   * @returns {{present:object[], offStage:object[], absent:object[], rejected:object[]}}
   */
  function resolve(npcs, ctx) {
    const candidates = []
    const absent = []
    const rejected = []
    const lastSeen = ctx.lastSeen || {}

    for (const npc of npcs) {
      if (npc.alive === false) continue
      const r = checkOne(npc, ctx)
      if (!r.pass) {
        if (r.absentReason) absent.push({ id: npc.id, name: npc.name, reason: r.absentReason })
        else rejected.push({ id: npc.id, name: npc.name, gate: r.gate, reason: r.reason })
        continue
      }
      candidates.push(npc)
    }

    // 闸门 4 · 戏剧：优先级高的先上；同优先级久未出场的优先
    candidates.sort((a, b) => {
      const pa = a.priority ?? 1, pb = b.priority ?? 1
      if (pb !== pa) return pb - pa
      const sa = lastSeen[a.id] ?? -999
      const sb = lastSeen[b.id] ?? -999
      return sa - sb
    })

    const onStage = candidates.slice(0, CONFIG.maxOnStage)
    const offStage = candidates.slice(CONFIG.maxOnStage).map(n => ({
      id: n.id, name: n.name, reason: '同场人数已满'
    }))

    const present = onStage.map(n => ({
      id: n.id,
      name: n.name,
      cue: n.cue || '',
      location: n.location,
      stage: n.stage
    }))

    return { present, offStage, absent, rejected }
  }

  /**
   * 为什么某人不在（调试用）
   * @param {object} npc
   * @param {object} ctx
   * @returns {string}
   */
  function whyNot(npc, ctx) {
    const r = checkOne(npc, ctx)
    if (r.pass) return `${npc.name}：应当在场`
    const gateName = ['缺席规则', '空间', '日程', '剧情'][r.gate] || '未知'
    return `${npc.name}：被闸门${r.gate}（${gateName}）挡住 — ${r.reason}`
  }

  REG.modules.presence = { CONFIG, resolve, checkOne, whyNot }

  console.log('[OKH] presence 已就绪 · 同场上限 ' + CONFIG.maxOnStage + ' 人')
})()
