/**
 * @module okh_app_echoes
 * @reason 残响定义、时钟显影与回放验收
 */
(function (root) {
  'use strict'

  const DELAYED_ECHOES = [
    {
      id: 'echo_gulan_ed_hypnosis',
      eventId: 'gulan_ed_hypnosis_play',
      npc: 'gulan',
      title: '深夜客房的太古梦魇',
      delayDays: 2,
      triggerCommand: '查看回忆：深夜客房的太古梦魇',
      tagId: 'abnormal_avoid',
      cgId: 'cg_gulan_hypnosis_1',
      promptGuidance: [
        '【回忆模式】以古兰的视角回放那一夜的春梦。',
        '主要篇幅放在梦中。跟着故事底稿写出古兰在梦里的所见所感，让梦境逐步推进，醒来时收束。',
        '客房、熔岩焦土与晨曦只用几笔交代。醒后的异样和回避留作简短尾声。'
      ].join('\n'),
      storyText: [
        '深夜客房内，{name}在深沉的睡眠中深陷一场荒诞狂乱的太古梦魇。',
        '梦境是一片熔岩与焦土弥漫的荒原，庞大沉重的黑影遮蔽了天幕，带着令人窒息的蛮荒威压将她重重压在身下。狂暴而滚烫的气息拂过耳畔，胸腔内沉睡的龙血仿佛被烈火点燃，周身经络如同浸泡在沸水中般酥麻发软。在那沉重阴影的笼罩下，她引以为傲的宗师力量化为乌有，只能徒劳地仰着颈项，在虚幻而激烈的撞击与颠簸中战栗。那不是属于凡人的欢爱，而是古老龙裔之间最原始、最野蛮的繁育索求。暴烈的热潮一次又一次将她淹没，她试图拔剑、试图呼喊{{user}}的名字，然而喉咙里发出的却只有破碎压抑的呜咽与违背理智的喘息。梦境的最后，是一股滚烫得仿佛要将骨髓融化的充盈感自最深处炸裂开来，将她的神智冲刷至一片惨白的混沌……',
        '晨曦破晓，{name}猛然从梦中惊醒，胸口剧烈起伏。宗师战气与半龙人体质让她毫无半点困倦虚弱，周身气血反而异常炽烈亢奋；唯独内腑最深处残留着一丝未散的反常滞胀与温热，以及贴身织物内无法忽视的湿冷黏腻。然而，这两处细微的异样全被体内奔涌如沸的滚烫真血与初醒时震荡混乱的神智所掩盖。她痛苦地以为纯系自身龙血返祖加深、在荒唐春梦中按捺不住兽性而导致的失态反噬，出于战士信念死守于心，面对{{user}}时目光飘忽，不敢坦然对视。'
      ].join('\n')
    }
  ]

  const records = world => world.playerState?.pendingEchoes || []
  const definition = id => DELAYED_ECHOES.find(item => item.id === id)
  const isVisible = (world, echo) => world.timeMin >= echo.unlockAt &&
    (echo.status === 'ready' || echo.status === 'viewed')

  function register(world, event, npc) {
    const def = DELAYED_ECHOES.find(item => item.eventId === event.id || item.id === event.echoId)
    if (!def || records(world).some(echo => echo.id === def.id)) return
    world.playerState ||= {}
    world.playerState.pendingEchoes ||= []
    world.playerState.pendingEchoes.push({
      id: def.id, eventId: event.id, npc: npc?.id || def.npc,
      occurredAt: world.timeMin,
      unlockAt: world.timeMin + (def.delayDays ?? 2) * 1440,
      status: 'latent'
    })
  }

  function sync(world) {
    for (const echo of records(world)) {
      if (echo.status === 'latent' && world.timeMin >= echo.unlockAt) echo.status = 'ready'
    }
  }

  function visible(world) {
    return records(world).flatMap(echo => {
      const def = definition(echo.id)
      return def && isVisible(world, echo)
        ? [{ id: echo.id, status: echo.status, title: def.title, triggerCommand: def.triggerCommand }]
        : []
    })
  }

  function isViewed(world, id) {
    return records(world).some(echo => echo.id === id && echo.status === 'viewed' && isVisible(world, echo))
  }

  function replayEntry(world, command, findImage) {
    const def = DELAYED_ECHOES.find(item => item.triggerCommand === command)
    if (!def || !records(world).some(echo => echo.id === def.id && isVisible(world, echo))) return null
    const cg = findImage(def.cgId)
    return cg ? { def, marker: `![${cg.title}](okh-echo:${cg.id})` } : null
  }

  function hasReplyMarker(reply, marker) {
    const text = String(reply || '')
      .replace(/^[ \t]*(?:```|~~~)[^\n]*\n[\s\S]*?(?:^[ \t]*(?:```|~~~)[^\n]*|$)/gm, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<status_bar\b[^>]*>[\s\S]*?(?:<\/status_bar\s*>|$)/gi, '');
    const blocks = [...text.matchAll(/<content\b[^>]*>([\s\S]*?)<\/content\s*>/gi)];
    const body = blocks.length ? blocks.map(match => match[1]).join('\n') : text;
    return body.split(/\r?\n/).some(line => line.replace(/^ {0,3}/, '').trimEnd() === marker);
  }

  function completeReplay(world, before, command, findImage) {
    const entry = replayEntry(before, command.echoReplay, findImage)
    if (!entry) return false
    const { def } = entry
    const echo = records(world).find(item => item.id === def.id)
    if (echo?.status !== 'ready') return false
    echo.status = 'viewed'
    echo.viewedAt = world.timeMin
    if (def.tagId) root.OKH_APP_TAGS.apply(world, def.npc, [], [def.tagId])
    return true
  }

  function inspect(world, npc) {
    return records(world).filter(echo => npc === undefined || echo.npc === npc).map(echo => {
      const def = definition(echo.id)
      const cgId = def?.cgId
      const collectedAt = cgId ? world.playerState?.memories?.find(item => item.id === cgId)?.collectedAt : undefined
      return {
        id: echo.id, npc: echo.npc, eventId: echo.eventId,
        title: def?.title, status: echo.status, occurredAt: echo.occurredAt,
        unlockAt: echo.unlockAt, remainingMin: Math.max(0, echo.unlockAt - world.timeMin),
        viewedAt: echo.viewedAt, cgId, collected: collectedAt !== undefined, collectedAt
      }
    })
  }

  root.OKH_APP_ECHOES = Object.freeze({
    definitions: DELAYED_ECHOES, definition, register, sync, visible, isViewed,
    replayEntry, hasReplyMarker, completeReplay, inspect
  })
})(globalThis)
