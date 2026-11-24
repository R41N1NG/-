/**
 * @module okh_app_album
 * @updated 2026-11-20
 * @status active
 * @reason 按明确剧情条件收录图片，收藏与聊天存档、回复回滚共用同一提交
 */
(function (root) {
  'use strict'
  const u = root.OKHBackgroundModules?.utils
  const DATA = root.OKH_APP_DATA
  const ECHO = root.OKH_APP_ECHOES
  if (!u || !DATA || !ECHO) throw Error('album 缺少 utils/data/echoes')
  const packed = '__OKH_ALBUM_CATALOG__'
  const initialCharacters = Object.freeze(['gulan', 'isna', 'nise', 'aurora'])
  const femaleCharacters = new Set([...initialCharacters, 'eileen', 'cecilia'])

  function create(entries) {
    u.check(Array.isArray(entries), '回忆相册目录必须是数组')
    const ids = new Set()
    const catalog = entries.map(item => {
      u.check(item && u.id(item.id) && !ids.has(item.id), '回忆图片 ID 非法或重复')
      ids.add(item.id)
      u.check(DATA.ROSTER.some(n => n.id === item.npc), '回忆图片关联了未知角色')
      u.check(['cg', 'portrait'].includes(item.kind), '图片类型必须是 cg 或 portrait')
      u.check(typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 80, '回忆图片需要标题')
      u.check(typeof item.src === 'string' && /^(?:https:\/\/[^\s]+|data:image\/(?:png|jpeg|webp|gif|avif|svg\+xml);base64,[A-Za-z0-9+/=]+)$/.test(item.src), '相册图片需要内嵌图片或 HTTPS 地址')
      u.check(Array.isArray(item.unlock) && item.unlock.length > 0, '回忆图片必须明确指定解锁条件')
      const unlock = item.unlock.map(rule => {
        u.check(rule && ['introduced', 'metric', 'worldFlag', 'npcFlag', 'event', 'echo'].includes(rule.type), '相册解锁条件类型未知')
        if (rule.type === 'metric') {
          const owner = DATA.ROSTER.find(n => n.id === item.npc)
          u.check(Object.hasOwn(owner.values, rule.key) && Number.isFinite(rule.min) && (rule.max === undefined || Number.isFinite(rule.max) && rule.max >= rule.min), '相册数值门槛非法')
        }
        if (rule.type === 'worldFlag' || rule.type === 'npcFlag') u.check(u.id(rule.key), '相册标记名称非法')
        if (rule.type === 'echo') {
          const echo = ECHO.definition(rule.id)
          u.check(echo?.cgId === item.id && echo.npc === item.npc, '相册引用了未知残响或不匹配的图片')
        }
        if (rule.type === 'event') {
          const event = DATA.EVENTS.find(e => e.id === rule.id)
          u.check(event && (!event.targets?.length || event.targets.includes(item.npc)), '相册引用了未知事件或目标')
          u.check(rule.outcome === undefined || u.id(rule.outcome) && Object.hasOwn(event.outcomes || {}, rule.outcome), '相册引用了未知事件结果')
        }
        return Object.freeze({ ...rule })
      })
      return Object.freeze({ id: item.id, npc: item.npc, kind: item.kind, title: item.title.trim(), src: item.src, unlock: Object.freeze(unlock) })
    })
    const byId = new Map(catalog.map(item => [item.id, item]))
    function records(world) {
      const rows = world.playerState?.memories
      if (rows === undefined) return []
      u.check(Array.isArray(rows), '回忆收集记录必须是数组')
      const seen = new Set()
      for (const row of rows) {
        u.check(row && u.id(row.id) && !seen.has(row.id) && u.minute(row.collectedAt), '回忆收集记录非法或重复')
        seen.add(row.id)
      }
      return rows
    }
    function matches(world, item, rule) {
      if (rule.type === 'introduced') return true
      if (rule.type === 'metric') {
        const value = world.npcs[item.npc]?.values?.[rule.key]
        return Number.isFinite(value) && value >= rule.min && (rule.max === undefined || value <= rule.max)
      }
      if (rule.type === 'worldFlag') return Object.hasOwn(world.flags || {}, rule.key) && world.flags[rule.key] === true
      if (rule.type === 'npcFlag') return Object.hasOwn(world.npcs[item.npc]?.flags || {}, rule.key) && world.npcs[item.npc].flags[rule.key] === true
      if (rule.type === 'echo') return ECHO.isViewed(world, rule.id)
      const event = DATA.EVENTS.find(e => e.id === rule.id)
      const npcId = event.scope === 'world' ? null : item.npc
      const record = world.bg?.eventStates?.[JSON.stringify(['event', rule.id, npcId])]
      if (rule.outcome !== undefined) return record?.status === 'resolved' && record.outcome === rule.outcome
      return Boolean(record || Object.hasOwn(world.bg?.fired || {}, JSON.stringify(['event', rule.id, npcId])))
    }
    function sync(world) {
      const rows = records(world), seen = new Set(rows.map(r => r.id))
      const met = world.playerState?.albumMet || []
      u.check(Array.isArray(met) && met.every(id => typeof id === 'string' && femaleCharacters.has(id)), '相册相识记录非法')
      const introduced = [...femaleCharacters].filter(id => !initialCharacters.includes(id) && !met.includes(id) && world.npcs[id]?.monitored === true && (id === 'eileen' && world.flags?.eileen_arrived || world.flags?.arrived_oakhaven && world.npcs[id].location === world.playerLocation))
      if (introduced.length) {
        world.playerState ||= {}
        world.playerState.albumMet = [...met, ...introduced]
      }
      const known = id => !femaleCharacters.has(id) || initialCharacters.includes(id) || (world.playerState?.albumMet || []).includes(id)
      const earned = catalog.filter(item => !seen.has(item.id) && known(item.npc) &&
        (world.npcs[item.npc]?.monitored === true || item.unlock.some(rule => rule.type === 'echo')) &&
        item.unlock.every(rule => matches(world, item, rule)))
      if (earned.length) {
        world.playerState ||= {}
        world.playerState.memories = [...rows, ...earned.map(item => ({ id: item.id, collectedAt: world.timeMin }))]
      }
      return earned.map(item => item.id)
    }
    function list(world) {
      return records(world).flatMap(row => {
        const item = byId.get(row.id)
        return item ? [{ ...item, collectedAt: row.collectedAt, name: world.npcs[item.npc]?.name || DATA.ROSTER.find(n => n.id === item.npc).name }] : []
      })
    }
    function groups(world) {
      const memories = list(world)
      const later = [...new Set(memories.filter(item => item.kind === 'portrait' && femaleCharacters.has(item.npc) && !initialCharacters.includes(item.npc)).map(item => item.npc))]
      return [...initialCharacters, ...later].map(id => ({ id, name: world.npcs[id]?.name || DATA.ROSTER.find(n => n.id === id).name, memories: memories.filter(item => item.npc === id) }))
    }
    function portrait(world, npc, choices = {}) {
      const owned = list(world).filter(item => item.npc === npc)
      return owned.find(item => item.id === choices[npc]) || owned.find(item => item.kind === 'portrait') || null
    }
    return Object.freeze({ catalog: Object.freeze(catalog), initialCharacters, sync, findImage: id => byId.get(id), list, groups, portrait })
  }
  const entries = root.OKH_ALBUM_CATALOG ?? (packed.startsWith('__OKH_') ? [] : JSON.parse(packed))
  root.OKH_APP_ALBUM = Object.freeze({ ...create(entries), create })
})(globalThis);
