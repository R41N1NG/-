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
  if (!u || !DATA) throw Error('album 缺少 utils/data')
  const packed = '__OKH_ALBUM_CATALOG__'

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
        u.check(rule && ['introduced', 'metric', 'worldFlag', 'npcFlag', 'event'].includes(rule.type), '相册解锁条件类型未知')
        if (rule.type === 'metric') {
          const owner = DATA.ROSTER.find(n => n.id === item.npc)
          u.check(Object.hasOwn(owner.values, rule.key) && Number.isFinite(rule.min) && (rule.max === undefined || Number.isFinite(rule.max) && rule.max >= rule.min), '相册数值门槛非法')
        }
        if (rule.type === 'worldFlag' || rule.type === 'npcFlag') u.check(u.id(rule.key), '相册标记名称非法')
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
      const event = DATA.EVENTS.find(e => e.id === rule.id)
      const npcId = event.scope === 'world' ? null : item.npc
      const record = world.bg?.eventStates?.[JSON.stringify(['event', rule.id, npcId])]
      if (rule.outcome !== undefined) return record?.status === 'resolved' && record.outcome === rule.outcome
      return Boolean(record || Object.hasOwn(world.bg?.fired || {}, JSON.stringify(['event', rule.id, npcId])))
    }
    function sync(world) {
      const rows = records(world), seen = new Set(rows.map(r => r.id))
      const earned = catalog.filter(item => !seen.has(item.id) && world.npcs[item.npc]?.monitored === true && item.unlock.every(rule => matches(world, item, rule)))
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
    return Object.freeze({ catalog: Object.freeze(catalog), sync, list })
  }
  const entries = root.OKH_ALBUM_CATALOG ?? (packed.startsWith('__OKH_') ? [] : JSON.parse(packed))
  root.OKH_APP_ALBUM = Object.freeze({ ...create(entries), create })
})(globalThis);
