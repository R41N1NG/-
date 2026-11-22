/**
 * @module okh_app_parse
 * @updated 2026-11-09 08:00
 * @status  demo
 * @reason  解析 AI 输出里的申报标签，转成 GPT 的 front 结构
 * @deps    无（纯函数）
 * @provides { parseActivity, parseInteract, parseStatusBar, buildFront, VALID_PHASES }
 *
 * ============================================================
 * 支持的标签
 *
 *   <activity npc="aurora" op="start" kind="ordinary" label="吃饭" />
 *   <activity npc="aurora" op="finish" />
 *   <activity npc="cecilia" op="start" kind="important" label="照看孤儿" rule="assignmentResolved" />
 *   <interact npc="aurora" />
 *   <move to="manor" />
 *   <focus npc="aurora" />
 *
 * 说明：
 *   · activity 的 id 由脚本生成（npc + 时间戳），不需要 AI 提供
 *   · finish / cancel 不需要给 id，脚本会匹配该角色的当前活动
 *   · interact 表示该角色本轮与玩家互动，后台不应给他安排行动
 * ============================================================
 */

(function (root) {
  'use strict'

  /**
   * 从文本里抓所有自闭合标签，返回 { tagName: [attrs...] }
   * @param {string} text
   * @param {string} tagName
   * @returns {object[]}
   */
  function grabTags(text, tagName) {
    const re = new RegExp(`<${tagName}\\b([^>]*)/?>`, 'gi')
    const out = []
    let m
    while ((m = re.exec(text)) !== null) {
      out.push(parseAttrs(m[1]))
    }
    return out
  }

  /**
   * 解析属性串
   * @param {string} raw 形如 ` npc="aurora" op="start" `
   * @returns {object}
   */
  function parseAttrs(raw) {
    const attrs = {}
    const re = /([\w-]+)\s*=\s*"([^"]*)"/g
    let m
    while ((m = re.exec(raw)) !== null) {
      attrs[m[1]] = m[2]
    }
    return attrs
  }

  /**
   * 解析 <activity>，产出 each npc 的活动变更指令
   * @param {string} text
   * @param {number} now 当前世界分钟，用于生成活动 id
   * @param {object} world 当前世界，用于取当前活动 id
   * @returns {object} { npcId: { activity } }
   */
  function parseActivity(text, now, world) {
    const tags = grabTags(text, 'activity')
    const out = {}

    for (const a of tags) {
      const npc = a.npc
      const op = a.op
      if (!npc || !op) continue
      if (!['start', 'finish', 'cancel'].includes(op)) continue

      const cur = world?.npcs?.[npc]?.activity

      if (!out[npc]) out[npc] = {}

      if (op === 'start') {
        const kind = ['ordinary', 'important', 'special'].includes(a.kind) ? a.kind : 'ordinary'
        out[npc].activity = {
          op: 'start',
          id: `act-${npc}-${now}`,
          kind,
          label: a.label || kind,
          source: 'narrative'
        }
        if (a.rule && kind !== 'ordinary') {
          out[npc].activity.releaseRule = a.rule
        }
      } else {
        // finish / cancel 必须带上当前活动 id，否则 GPT 会拒绝
        if (!cur) continue
        out[npc].activity = { op, id: cur.id }
      }
    }

    return out
  }

  /**
   * 解析 <interact>，产出互动角色列表
   * @param {string} text
   * @returns {string[]}
   */
  function parseInteract(text) {
    return grabTags(text, 'interact')
      .map(a => a.npc)
      .filter(Boolean)
  }

  /**
   * 解析 <move to="...">
   * @param {string} text
   * @returns {string|null}
   */
  function parseMove(text) {
    const tags = grabTags(text, 'move')
    return tags[0]?.to || null
  }

  /**
   * 解析 <time elapsed="30" end="1日18:30" />
   * @param {string} text
   * @returns {{elapsed:number|null, end:string|null}}
   */
  function parseStatusBar(text) {
    const tags = grabTags(text, 'time')
    const t = tags[0]
    if (!t) return { elapsed: null, end: null }

    let elapsed = null
    if (t.elapsed !== undefined) {
      const n = Number(t.elapsed)
      if (Number.isFinite(n) && n >= 0 && n <= 1440) elapsed = n
    }
    return { elapsed, end: t.end || null }
  }

  /**
   * 把解析结果组装成 GPT 的 front
   * @param {string} text AI 消息全文
   * @param {number} now 当前世界分钟
   * @param {object} world 当前 world（用于校验 npc 是否存在）
   * @returns {object} front
   */
  function buildFront(text, now, world) {
    const front = {}

    // 玩家移动
    const move = parseMove(text)
    if (move) front.playerLocation = move

    // 角色活动
    const acts = parseActivity(text, now, world)
    const npcs = {}
    for (const [npcId, patch] of Object.entries(acts)) {
      if (!world.npcs[npcId]) continue      // 未知角色，丢弃
      npcs[npcId] = patch
    }
    if (Object.keys(npcs).length) front.npcs = npcs

    // 互动角色
    const interacting = parseInteract(text)
      .filter(id => world.npcs[id])
    if (interacting.length) {
      front.interactingIds = interacting
    }

    return front
  }

  root.OKH_APP_PARSE = Object.freeze({
    grabTags,
    parseAttrs,
    parseActivity,
    parseInteract,
    parseMove,
    parseStatusBar,
    buildFront
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_PARSE
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
