/**
 * @module okh_app_tags
 * @updated 2026-11-25 06:42
 * @status active
 * @reason 注册与管理角色的后台标签，状态归入世界存档的 tags 分区
 */
(function (root) {
  'use strict'

  const u = root.OKHBackgroundModules.utils
  const catalog = Object.freeze({
    abnormal_avoid: Object.freeze({
      id: 'abnormal_avoid',
      name: '异样回避',
      desc: '偶尔错开玩家的目光，说话比平时简短，下意识拢紧衣领。',
      visibility: 'private'
    })
  })

  const idOf = tag => typeof tag === 'string' ? tag : tag?.id

  function apply(world, npcId, added = [], removed = []) {
    u.check(u.own(world.npcs, npcId), '标签须用于已登记角色')
    u.check(Array.isArray(added) && Array.isArray(removed), '标签增删须为数组')
    const addIds = added.map(idOf)
    const removeIds = removed.map(idOf)
    u.check(addIds.every(id => u.id(id) && u.own(catalog, id)), '禁止添加未注册标签')
    u.check(removeIds.every(u.id), '移除标签的 ID 非法')

    const section = world.tags ||= {}
    const next = new Set(u.own(section, npcId) ? section[npcId] : [])
    for (const id of addIds) next.add(id)
    for (const id of removeIds) next.delete(id)
    if (next.size) section[npcId] = [...next]
    else delete section[npcId]
  }

  function migrate(world) {
    if (world.tags !== undefined && !Object.values(world.npcs || {}).some(npc => u.own(npc, 'tags'))) return world
    const tags = { ...world.tags }
    const npcs = { ...world.npcs }
    for (const [id, npc] of Object.entries(npcs)) {
      if (!u.own(npc, 'tags')) continue
      const { tags: legacy, ...character } = npc
      const ids = [...(tags[id] || []), ...(Array.isArray(legacy) ? legacy.map(idOf) : [])].filter(u.id)
      if (ids.length) tags[id] = [...new Set(ids)]
      npcs[id] = character
    }
    return { ...world, npcs, tags }
  }

  function list(world, npcId) {
    if (!world.tags || !u.own(world.tags, npcId)) return []
    return world.tags[npcId].map(id =>
      u.own(catalog, id) ? catalog[id] : { id, name: id, desc: '', visibility: 'private' })
  }

  root.OKH_APP_TAGS = Object.freeze({ catalog, apply, migrate, list })
})(globalThis)
