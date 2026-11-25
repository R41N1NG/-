/**
 * @module okh_app_echoes
 * @updated 2026-11-25 10:42
 * @status active
 * @reason 残响定义、时钟显影与回放验收
 */
(function (root) {
  'use strict'

  const FORMAT = root.OKH_APP_ECHO_FORMAT
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
    },
    {
      id: 'echo_gulan_final_fall',
      eventId: 'gulan_final_fall_dark',
      npc: 'gulan',
      title: '血脉深处的黑龙烙印',
      unlockWhen: world => (world.npcs?.gulan?.values?.blood_density ?? 0) >= 100 && world.npcs?.gulan?.stage === 3,
      triggerCommand: '查看回忆：血脉深处的黑龙烙印',
      tagId: 'dragon_mark_linger',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以古兰的视角回放那一夜血脉失控、爱德现身收割并完成沉沦印记的完整经过。',
        '遵循故事底稿直接推进：先写她在孤立无援中强撑对抗真血暴走，再写爱德入室褪去伪装、显露与人类孩童爱德平时身高相仿却呈成年男性轮廓的矮小身躯并道破生父身份与往夜予取予求的真相，最后直写权杖引动真血后，她被换着不同体位品尝与反复灌注，在强烈快感与血脉压制中逐渐沦陷娇吟、接纳归属并被打上太古黑龙印记。',
        '【撰写约束】正文中严禁出现任何种族称谓或特殊族群字眼，仅客观描写其如同人类孩童爱德一样身高身躯、却带着成年男性沉稳轮廓的矮小身形。'
      ].join('\n'),
      storyText: [
        '深夜的客房内，返祖真血的暴走已将{name}逼至失控边缘。白皙皮肤被高热蒸得泛红，太阳穴两侧黑角尖端灼烫发亮，小臂皮肉下隐约浮现细密的黑色龙鳞。她单膝抵着床沿、指节死死扣住精钢重剑的剑柄，指缝渗出血丝，目光却仍望向静寂无声的门外。',
        '门扉在此时被轻轻推开。{name}强撑着抬眸，看清踏入房内的竟是爱德时，琥珀色竖瞳中掠过一瞬错愕。然而下一息，浩瀚蛮荒的上位龙威瞬间充斥窄小的客房，{name}体内奔涌的半龙真血如遇君王般战栗低伏。他缓步逼近床榻，以低沉威严的声线道出自身沉睡万载的生父身份，并毫不掩饰地挑明真相：往日那些让她羞耻难安的荒唐春梦，全都是他在无数个夜晚潜入房中对她身体的予取予求与血脉催熟——这具身躯，从最初破戒那一夜起便早已属于他。',
        '话音未落，腰间那柄看似粗糙的木雕小剑应声解封为古龙权杖，幽光落处，积蓄已久的始祖龙血如决堤洪流般轰然翻涌。长年恪守的矜持与自尊在上位血脉的压制下土崩瓦解；爱德俯身压上床榻，毫不怜惜地将她按在身下，换着不同的体位尽情品尝与反复灌注。强烈的快感浪潮叠着血脉本能席卷全身，{name}最初的挣扎渐渐化作无力的迎合与婉转娇吟，在滚烫的龙息与一次次深层占有中逐渐沦陷。长夜尽头，她已再无半点抗拒之心，已然接纳了自己身心均归属于生父兼主人的事实，血脉深处也被稳稳打上了属于太古黑龙的印记。'
      ].join('\n')
    },
    {
      id: 'echo_gulan_arena_fall',
      eventId: 'dragon_blood_awakening_mud_fall',
      npc: 'gulan',
      title: '午后演武场的猎龙异香',
      delayDays: 2,
      triggerCommand: '查看回忆：午后演武场的猎龙异香',
      tagId: 'arena_shame_linger',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以古兰的视角直白回放午后演武场中猎龙异香发作、失守受辱的经过。',
        '遵循故事底稿推进：先写黑市猎龙异香勾动早已破戒的深层情潮、导致指节酸软重剑跌落，再直写十余名地痞撕开长裙、将她按在摇晃的兵器架旁轮番揉捏侵犯与粗暴泄欲，最后写她在快感与屈辱交织的泪水中勉强捡剑离去。',
        '保留古兰身为武者与长辈的强烈羞耻、抗拒与事后自厌。'
      ].join('\n'),
      storyText: [
        '午后演武场内，下风处暗燃的黑市猎龙异香顺着热风弥漫开来。霸道的药理迅速勾动了{name}此前早已失守的身躯，体内深处沉睡的龙裔繁育本能如决堤狂潮逆冲心脉，与夜里那场荒唐梦魇的记忆轰然重叠。',
        '{name}咬紧银牙试图聚力拔剑，然而双腿间早已湿滑发软，指节竟再也握不住沉重的精钢剑柄，阔刃重剑当啷跌落尘土。面前围拢上来的十余名地痞见状发出肆意哄笑，黏腻贪婪的视线毫不掩饰地上下打量着她高挑丰腴的身段。',
        '不等她退避，几双粗糙污秽的大手已扑上来将她死死按在摇晃的兵器架上，粗暴扯开黑底金边的长裙与内衬软甲，露出雪白紧致的肌肤与泛红的腿根。烈药与体内的繁育本能逼得她浑身发烫、下身不由自主地泛起濡湿水意；地痞们狞笑着分开她的双腿，轮番挺身挤入那处紧致温热的幽径，毫不怜惜地用力撞击、揉捏着饱满双乳与腰臀。战士的自制力在剧烈摩擦与羞耻感中步步溃散，{name}死死咬住下唇不愿求饶，眼角却滑落屈辱的泪水，喉间溢出压抑而破碎的呻吟，任由滚烫浑浊的液体一次次灌入深处。直至日影西斜、地痞们心满意足地散去，{name}才浑身沾满尘土与白浊，颤抖着合拢湿粘的双腿，拾起重剑在黄昏阴影中仓皇离去。'
      ].join('\n')
    },
    {
      id: 'echo_gulan_arena_fallen',
      eventId: 'dragon_blood_awakening_fallen',
      npc: 'gulan',
      title: '演武场阴影中的反客为主',
      delayDays: 2,
      triggerCommand: '查看回忆：演武场阴影中的反客为主',
      tagId: 'arena_sated_laziness',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以沉沦期古兰的视角直白回放午后演武场反客为主、将地痞当作泄欲猎物的经过。',
        '遵循故事底稿推进：先写她嗅到猎龙异香后毫无惧色、金红竖瞳露出轻蔑愉悦，再直写她不拔重剑迎上前去扯开狂徒衣裤，跨坐骑乘与轮番榨取精元，直至十余名地痞被吸干气力昏死瘫软在地。',
        '突出沉沦期古兰俯视凡俗的冷傲与从容餍足。'
      ].join('\n'),
      storyText: [
        '午后演武场下风处燃起猎龙熏香时，已接纳太古龙血本能的{name}金红竖瞳微凝，非但没有半点惊慌，唇角反而勾起一抹冷傲而愉悦的弧度，轻伸舌尖舔过微湿的红唇。',
        '世俗的廉耻与礼法在她眼中早如尘埃。面对怪叫着围上来的十余名地痞，{name}将重剑留在一旁，迎着药力撩起长裙裙摆迈步上前，在狂徒们错愕的目光中反手将领头之人掀翻在地，干脆利落地扯开对方裤腰。',
        '上位龙裔强横的体魄与滚烫情潮化作吞噬生机的漩涡。{name}跨坐在地痞腰间沉腰坐下，紧致炽热的幽径瞬间将粗陋的肉棒吞入深处，随即便自顾自地剧烈起伏套弄起来；一旁原本蠢蠢欲动的其余狂徒被她随手拽过，或被她修长有力的大腿夹住腰腹，或被拉近身前强迫迎合她的索求。凡俗宵小短短片刻便从狂妄淫笑沦为惊恐喘息与连声求饶，却根本挣脱不开宗师体魄的压制，精元在一波又一波紧缩绞弄中被接连榨干。当场内重归死寂时，十余名地痞已如干草般昏死瘫软在尘土中。{name}神情慵懒而餍足地起身，慢条斯理地拂去裙摆褶皱，未曾多看地上的废人一眼，迈着从容步履离去。'
      ].join('\n')
    },
    {
      id: 'echo_isna_camp_torture',
      eventId: 'isna_stage_1',
      npc: 'isna',
      title: '黑兽人地牢的拷问初夜',
      delayDays: 1,
      triggerCommand: '查看回忆：黑兽人地牢的拷问初夜',
      tagId: 'orc_blood_seal',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以伊丝娜的视角直白回放被擒入黑兽人营地地牢当夜的拷问、破处与被种下血契印记的过程。',
        '突出兽人粗暴狂野的压迫感与猫耳斥候娇小身躯的反差：铁链锁腕、撕碎皮甲、强行破处并轮流灌注，最后由千夫长克罗格在小腹隐蔽处刻下需要每三日以精液安抚的血契魔纹。'
      ].join('\n'),
      storyText: [
        '潮湿腥膻的黑兽人营地地牢内，{name}被粗重的铁链反剪吊在石柱旁，平日灵巧的猫耳与猫尾无力地垂落颤抖。皮甲与贴身衬衣被蛮力撕成碎布，雪白纤细的腰肢与腿根毫无遮掩地暴露在几名黑兽人守卫贪婪的目光下。',
        '审讯鞭笞之后便是毫不掩饰的蛮横掠夺。黑兽人粗砺宽大的手掌死死掐住她纤细的腰胯，将她强行按在冰冷的石台上分开双腿。伴随着一声撕裂般的痛楚与破碎惊呼，从未承欢过的处女之身被滚烫粗硕的肉棒野蛮捅入深处；几名兽人轮番压上那具单薄发抖的娇躯，抓住猫耳与纤腰剧烈撞击冲刺，将滚烫粘稠的浊液一次次射满她狭窄的子宫。',
        '天亮前，千夫长克罗格迈步走入地牢，拎起瘫软染血、神智涣散的{name}，带着戏谑的笑意将一枚暗红滚烫的黑兽人血契印记烙在她小腹隐蔽处——若不每三日回营地接受兽人精液灌注压制，魔纹便会剧痛翻涌并透衣显形。'
      ].join('\n')
    },
    {
      id: 'echo_isna_mud_spy',
      eventId: 'isna_mud_camp_report',
      npc: 'isna',
      title: '三日归巢的汇报与赏赐',
      delayDays: 1,
      triggerCommand: '查看回忆：三日归巢的汇报与赏赐',
      tagId: 'orc_spy_conflict',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以伊丝娜的视角直白回放泥足期每隔三日深夜借口替小队外出踩点、实则潜回黑兽人营地向克罗格汇报城镇情报并接受“赏赐”的经过。',
        '写出她尚念旧情与愧疚纠结的内心挣扎，同时直白描写作为半兽人的身体在血契灼痒与先前调教下对兽人灌注产生的生理渴望，以及在营帐中被兽人用更粗暴的轮换体位压制灌满的过程（勿将兽人与魔力联系）。'
      ].join('\n'),
      storyText: [
        '第三夜的钟声刚过，小腹隐蔽处的血契印记已烫得如同烧红的铁片，阵阵绞痛伴着难以启齿的空虚湿热顺着脊椎往上窜。{name}咬紧牙关，沿用白天报备过的“外出盯梢黑兽人动向”借口离开旅店，沿着荒原暗道跌跌撞撞地潜回黑兽人前哨营地。',
        '营帐内，千夫长克罗格正坐在一张兽皮大椅上把玩着短刀。{name}跪伏在地毯上，声音发颤地报出奥克赫斯近期守备换防与旅店众人的动向；心里还念着{{user}}往日照拂而阵阵刺痛，可半兽人本就敏感的身躯在血契灼痒与先前调教的刺激下，双腿早已不受控制地渗出湿意。',
        '“情报不错，过来领赏吧，小叛徒。”克罗格冷笑一声拽住她的脚踝拖上兽皮榻，帐内几名精壮兽人随即围拢上来。他们毫不怜惜地抬起她的双腿架上肩头、又把她翻过身按成跪趴后入的羞耻姿态轮换抽插撞击；粗暴的蛮力冲撞得猫耳少女眼泪混着羞耻的娇喘一起溢出，身体却诚实地在一次次深顶与大量滚烫精液的灌注中迎合痉挛。直到腹中魔纹在满溢白浊的安抚下重新暗淡，{name}才拖着酸软颤抖的身躯连夜赶回旅店，天明后强装若无其事。'
      ].join('\n')
    },
    {
      id: 'echo_isna_fallen_pet',
      eventId: 'isna_stage_3',
      npc: 'isna',
      title: '千夫长帐下的忠犬与诱饵',
      delayDays: 1,
      triggerCommand: '查看回忆：千夫长帐下的忠犬与诱饵',
      tagId: 'orc_fallen_pet',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以沉沦期伊丝娜的视角直白回放第十日心理防线瓦解、全面归附克罗格并着手设局诱引古兰的过程。',
        '直白描写她主动迎合克罗格索求灌注、心甘情愿交出城镇布防与古兰弱点情报，并亲手写下引诱古兰单骑入套的假求救信。'
      ].join('\n'),
      storyText: [
        '第十个夜晚过去，曾经徘徊在愧疚与旧情之间的防线终于无声崩断。回到黑兽人主帐内的{name}不再有半分挣扎与羞怯，主动解开衣带跨坐在千夫长克罗格腰间，讨好地摇晃着猫耳迎合每一次深入顶弄，贪婪地承接滚烫浓稠的精液灌入花心。',
        '事后她慵懒地蜷缩在克罗格怀中，一边任由对方揉弄自己尚在微颤的身躯，一边条理清晰地将奥克赫斯的城防漏洞、商队路线乃至古兰平时孤身驰援的脾性与弱点悉数挑明，甚至主动提笔拟定了一封绕开{{user}}、只单向指向古兰的假求救信，准备亲手把昔日并肩的半龙人剑士诱入营地的反龙陷阱。'
      ].join('\n')
    }
  ]

  const records = world => world.playerState?.pendingEchoes || []
  const definition = id => DELAYED_ECHOES.find(item => item.id === id)
  const isUnlocked = (world, echo, def) => def?.unlockWhen
    ? Boolean(def.unlockWhen(world))
    : world.timeMin >= echo.unlockAt
  const isVisible = (world, echo) => (echo.status === 'ready' || echo.status === 'viewed') &&
    isUnlocked(world, echo, definition(echo.id))

  function register(world, event, npc) {
    const def = DELAYED_ECHOES.find(item => item.eventId === event.id || item.id === event.echoId)
    if (!def || records(world).some(echo => echo.id === def.id)) return
    world.playerState ||= {}
    world.playerState.pendingEchoes ||= []
    const readyNow = Boolean(def.unlockWhen && def.unlockWhen(world))
    world.playerState.pendingEchoes.push({
      id: def.id, eventId: event.id, npc: npc?.id || def.npc,
      occurredAt: world.timeMin,
      unlockAt: def.unlockWhen ? null : world.timeMin + (def.delayDays ?? 2) * 1440,
      status: readyNow ? 'ready' : 'latent'
    })
  }

  function sync(world) {
    for (const echo of records(world)) {
      if (echo.status === 'latent' && isUnlocked(world, echo, definition(echo.id))) echo.status = 'ready'
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
    const def = DELAYED_ECHOES.find(item => item.triggerCommand === FORMAT.commandLine(command))
    if (!def || !records(world).some(echo => echo.id === def.id && isVisible(world, echo))) return null
    if (!def.cgId) return { def, marker: null }
    const cg = findImage(def.cgId)
    return cg ? { def, marker: `![${cg.title}](okh-echo:${cg.id})` } : null
  }

  function hasReplyMarker(reply, cgId) {
    return FORMAT.imagePattern(cgId).test(reply || '')
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
        unlockAt: echo.unlockAt, remainingMin: echo.unlockAt == null ? null : Math.max(0, echo.unlockAt - world.timeMin),
        viewedAt: echo.viewedAt, cgId, collected: collectedAt !== undefined, collectedAt
      }
    })
  }

  root.OKH_APP_ECHOES = Object.freeze({
    definitions: DELAYED_ECHOES, definition, register, sync, visible, isViewed,
    replayEntry, hasReplyMarker, completeReplay, inspect
  })
})(globalThis)
