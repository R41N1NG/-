/**
 * @module okh_app_tags
 * @updated 2026-11-25 10:42
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
    }),
    mud_nightly_trace: Object.freeze({
      id: 'mud_nightly_trace',
      name: '暗夜余痕',
      desc: '泥足深陷期间，昨夜未受保护而遭暗中侵犯并留下生理余痕；今日神态如常但体内龙血更趋躁动。',
      visibility: 'private'
    }),
    dragon_mark_linger: Object.freeze({
      id: 'dragon_mark_linger',
      name: '龙血臣属',
      desc: '举止一如往常般沉稳自持，已然接受身心归属生父的现实；面对玩家时如常对待，同样以师傅和母亲的方式对待和要求，只是带着一丝若有若无的冰冷。',
      visibility: 'private'
    }),
    arena_shame_linger: Object.freeze({
      id: 'arena_shame_linger',
      name: '演武场余悸',
      desc: '归队后衣襟领口刻意拢紧，身上带着急促洗漱后也压不住的草木皂角气；每当经过兵器架或听人提起演武场，指尖便会微不可察地发紧。',
      visibility: 'private'
    }),
    arena_sated_laziness: Object.freeze({
      id: 'arena_sated_laziness',
      name: '餍足慵懒',
      desc: '午后归来时步履散漫从容，眼角眉梢挂着一丝未褪的倦怠与冷傲，面对寻常问候显得心不在焉，仿佛刚经历过一场无需费力的消遣。',
      visibility: 'private'
    }),
    orc_blood_seal: Object.freeze({
      id: 'orc_blood_seal',
      name: '兽人血契',
      desc: '小腹隐蔽处被刻下黑兽人血契魔纹，必须每三日接受兽人精液灌注压制，否则便会剧痛发作并显露暗红纹路。',
      visibility: 'private'
    }),
    orc_spy_conflict: Object.freeze({
      id: 'orc_spy_conflict',
      name: '惊悸暗涌',
      desc: '在镇上如常奔走探听消息，实则尚念旧情而内心惶惑挣扎；每隔三日夜间便会借故外出，潜回营地汇报并接受灌注。',
      visibility: 'private'
    }),
    orc_fallen_pet: Object.freeze({
      id: 'orc_fallen_pet',
      name: '营地玩物',
      desc: '已完全归附黑兽人千夫长克罗格，甘愿充当其宠物与内鬼，主动泄露城镇布防与古兰动向并随时设局诱敌。',
      visibility: 'private'
    }),
    isna_orc_phobia: Object.freeze({
      id: 'isna_orc_phobia',
      name: '兽人恐惧',
      desc: '曾在黑兽人营地失足受辱、被种下血契后由玩家设法救回；面对玩家心怀愧疚与依恋，同时也患上了兽人恐惧症。效果：①会拒绝一切与兽人有关的行动（不再前往兽人营地或参与相关斥候委托）；②面对兽人时会处于恐惧状态，失去战斗力。',
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
