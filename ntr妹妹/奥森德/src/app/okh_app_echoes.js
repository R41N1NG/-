/**
 * @module okh_app_echoes
 * @updated 2026-11-27 03:26
 * @status active
 * @reason 残响定义、时钟显影与回放验收，补齐奥萝拉山庄暗线三部曲残响
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
      id: 'echo_gulan_final_fall_virgin',
      eventId: 'gulan_final_fall_virgin_dark',
      npc: 'gulan',
      title: '初夜失守的黑龙烙印',
      unlockWhen: world => (world.npcs?.gulan?.values?.blood_density ?? 0) >= 100 && world.npcs?.gulan?.stage === 3,
      triggerCommand: '查看回忆：初夜失守的黑龙烙印',
      tagId: 'dragon_mark_linger',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以此前一直守住清白、未曾陷入梦魇失身的古兰视角，回放那一夜血脉失控、爱德现身破处收割并打上印记的经过。',
        '遵循故事底稿直接推进：先写她在孤立无援中强撑对抗真血暴走，再写爱德入室褪去伪装、显露与人类孩童爱德平时身高相仿却呈成年男性轮廓的矮小身躯并道破生父身份，最后直写权杖引动真血后，她紧守至今的处女之身在血脉威压与撕裂痛楚中被首次强行破处贯穿，在强烈快感与压制中逐渐失守娇吟、被打上太古黑龙印记。',
        '【撰写约束】正文中严禁出现任何种族称谓或特殊族群字眼，仅客观描写其如同人类孩童爱德一样身高身躯、却带着成年男性沉稳轮廓的矮小身形。'
      ].join('\n'),
      storyText: [
        '深夜的客房内，返祖真血的暴走已将{name}逼至失控边缘。白皙皮肤被高热蒸得泛红，太阳穴两侧黑角尖端灼烫发亮，小臂皮肉下隐约浮现细密的黑色龙鳞。一直紧守防线至今的她单膝抵着床沿、指节死死扣住精钢重剑的剑柄，指缝渗出血丝，目光却仍望向静寂无声的门外。',
        '门扉在此时被轻轻推开。{name}强撑着抬眸，看清踏入房内的竟是爱德时，琥珀色竖瞳中掠过一瞬错愕。然而下一息，浩瀚蛮荒的上位龙威瞬间充斥窄小的客房，{name}体内奔涌的半龙真血如遇君王般战栗低伏。他缓步逼近床榻，以低沉威严的声线道出自身沉睡万载的生父身份——这具一直守身如玉、未曾被外人碰触分毫的半龙女武者之躯，今日终究要归属她的造主与血脉源头。',
        '话音未落，腰间那柄看似粗糙的木雕小剑应声解封为古龙权杖，幽光落处，积蓄已久的始祖龙血如决堤洪流般轰然翻涌。长年恪守的矜持与自尊在上位血脉的压制下土崩瓦解；爱德俯身压上床榻，扯开紧扣的高领衣襟，将她紧守至今的处女之身第一次强行撕裂贯穿至底。剧烈的初夜破身痛楚伴着源初龙息的沸腾冲刷着神智，{name}最初的挣扎与低泣在反复深层灌注中渐渐化作无力的迎合与婉转娇吟。长夜尽头，她已再无半分抗拒之心，接纳了身心归属于生父的现实，血脉深处也被稳稳打上了太古黑龙的印记。'
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
    },
    {
      id: 'echo_nise_casino_dealer',
      eventId: 'nise_stage_1',
      npc: 'nise',
      title: '金碧赌场的荷官暗影',
      delayDays: 1,
      triggerCommand: '查看回忆：金碧赌场的荷官暗影',
      tagId: 'tag_nise_dealer_shame',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以妮丝的视角回放那一天的荷官初次站台经历。',
        '主要篇幅放在暗处赌场的压迫与受辱。描写她换上露背束腰短裙荷官服，在喧嚣的赌客与保镖环伺下发牌，身体因羞耻而战栗，守住底线未曾破身。',
        '结尾简短写夜间换回常服潜回旅店，隐瞒众人。'
      ].join('\n'),
      storyText: [
        '白昼的金碧赌场下层大厅内，浑浊的烟草与麦酒气息在闷热空气中翻滚。{name}站在发牌台后，原本宽大合体的法师长袍被强行换成了露背束腰马甲与黑色超短百褶裙，纤细雪白的双肩与大片后背毫无遮拦地暴露在嘈杂视线中。',
        '赌桌对面几个目光混浊的赌客肆意吹着口哨，视线黏腻地在她紧绷的胸口与裙下雪白的长腿上来回逡巡；身后两名体格魁梧的黑巨汉保镖借着“巡查账目与纠正洗牌手势”的名义逼近，粗糙黝黑的大手毫不掩饰地覆上少女后背与腰侧肆意揉捏揩油。以{name}娇小的个头，头顶不过刚刚及到巨汉们的腰际，庞大的体魄悬殊与被当场告发长辈古兰的恐惧，逼得她只能死死咬住下唇、含着屈辱的泪水任由摆布，双手发颤地码齐骨牌。尽管处女之身在这一阶段勉强守住，但当入夜换回常服仓皇溜出赌场时，少女单薄的双腿仍在发软，面对旅店灯火不敢直视家人的目光。'
      ].join('\n')
    },
    {
      id: 'echo_nise_casino_secretary',
      eventId: 'nise_stage_2',
      npc: 'nise',
      title: '账房长桌的屈辱抵债',
      delayDays: 1,
      triggerCommand: '查看回忆：账房长桌的屈辱抵债',
      tagId: 'tag_nise_secretary_fall',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以泥足期妮丝的视角回放那一日进入二楼账房内室充当私人秘书、被巴拉克强行破处占有的经过。',
        '突出体格悬殊的压迫感与巨额债务的现实重压：写出厚重借据拍在桌上的绝望，红木账桌前被单臂压制掀裙破处的过程，以及在痛苦哭咽中被整夜扣押索取的细节。'
      ].join('\n'),
      storyText: [
        '二楼帷幔重锁的红木账房内，厚厚一叠滚着高额利息的借据被重重拍在桌案上，数额已攀升至数百乃至上千金币的绝境。黑巨汉老板巴拉克庞大的身躯堵死了房门，带着戏谑的狞笑挑明真相：今日若不拿出真金白银平账，便立刻带齐官府缉捕文书堵死断剑与麦酒旅店的大门。',
        '退至墙角的{name}在恐惧与愧疚中浑身发抖，双手微弱的抗拒在兽人体魄面前如同稚童。巴拉克粗暴地将她单臂提起按在冰冷的红木大账桌上，掀开百褶短裙撕扯开贴身衬布；伴随着剧烈的撕裂剧痛与少女绝望破碎的尖叫，未经人事的处女之身被滚烫粗硕的肉棒野蛮贯穿至底。厚重的账册散落满地，巴拉克抓紧少女纤细的腰肢在长桌前肆意冲撞挞伐，将滚烫浑浊的精液一次次深深灌入她未曾承欢的花心。长夜漫漫，妮丝被整夜关在账房内室反复索取蹂躏，神智在痛楚与自弃的泪水中渐趋麻木，失身沦为抵债的私人秘书。'
      ].join('\n')
    },
    {
      id: 'echo_nise_casino_contract',
      eventId: 'nise_stage_3',
      npc: 'nise',
      title: '金箔契约与血指印',
      delayDays: 1,
      triggerCommand: '查看回忆：金箔契约与血指印',
      tagId: 'tag_nise_casino_chattel',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以沉沦期妮丝的视角回放欠债数千金币后心理防线瓦解、签署卖身契沦为赌场私产的过程。',
        '直白描写在金库密室内割破手指按下血指印、佩戴赌场特制皮革项圈、接纳作为抵债私产永留地下赌场的全过程。'
      ].join('\n'),
      storyText: [
        '地下金库最深处的密室内，摇曳的烛火照亮了摊开在石台上的金箔卖身契约。几千金币的高利贷天文数字早已压垮了一切生机与翻盘幻想，孤立无援的{name}双膝跪伏在厚重地毯上，眼眸里往日的灵动与骄傲已被麻木的屈从所取代。',
        '巴拉克抓起她冰凉发颤的右手，以短刀尖刃刺破食指指尖，用力按在契约末尾的受让抵押条款上，留下一道猩红刺目的血指印。随后，一具内侧刻有金碧赌场专属暗印与锁扣的特制皮革项圈被咔哒扣合在少女白皙脆弱的颈项间。契约底定，少女的身心与名籍自此完全沦为地下赌场的私有资产，从此不再回到断剑与麦酒旅店，甘愿作为长留内室的抵债玩物与招徕豪赌客人的绝色筹码。'
      ].join('\n')
    },
    {
      id: 'echo_aurora_manor_hush',
      eventId: 'aurora_stage_1',
      npc: 'aurora',
      title: '书房里的“涨薪”试探',
      delayDays: 1,
      triggerCommand: '查看回忆：书房里的“涨薪”试探',
      tagId: 'tag_aurora_manor_hush',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以奥萝拉的视角回放工作满三日后在山庄书房被雷蒙德领主借口“考虑涨工资”大肆占便宜的经过。',
        '保留她穿戴严整的黑白长裙女仆装、高领白衬衫与金丝圆框眼镜，写出领主隔裙抚摸美臀、随后撩起长裙揉捏黑丝美臀甚至将一根手指伸入臀缝的细节，突出她羞红着脸却不敢反抗、唯唯诺诺点头称谢的怯懦，此时尚未破身。'
      ].join('\n'),
      storyText: [
        '山庄二楼静谧的橡木书房内，{name}正低头收拾着长桌上的文书。整洁的白色荷叶边围裙与严密系紧的高领白衬衫将她高挑丰腴的身段裹得严严实实，鼻梁上的金丝圆框眼镜后是一双温和而略带拘谨的深蓝眼眸。',
        '厚重的门扉悄然阖上，雷蒙德领主缓步踱到她身后，大手直接隔着女仆长裙大肆抚摸起裙下浑圆挺翘的美臀，一边欣赏着她强忍不敢反抗的瑟缩表情，嘴上却慢条斯理地开口：“奥萝拉小姐，你最近的表现很好，我正在考虑给你涨工资……”说到这里，他放肆的大手直接撩起黑色女仆长裙，隔着薄透黑丝连裤袜揉捏起紧绷弹润的美臀，甚至将一根手指沿着布料缝隙深深探入了她的臀缝。{name}羞红了整张脸，呼吸发颤却不敢得罪大领主，只能低着头唯唯诺诺地点头称谢，勉强守住底线任由那番逾矩亵玩落幕。'
      ].join('\n')
    },
    {
      id: 'echo_aurora_night_service',
      eventId: 'aurora_stage_2',
      npc: 'aurora',
      title: '厚重橡木门后的夜侍',
      delayDays: 1,
      triggerCommand: '查看回忆：厚重橡木门后的夜侍',
      tagId: 'tag_aurora_night_service',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以泥足期奥萝拉的视角回放领主开出足以抵偿三成家族旧债的高额封口重金、逼迫她留宿侍寝并强行破处的经过。',
        '保持上身黑白长裙女仆装与高领白衬衫穿戴完整，只写长裙与白色围裙被掀至腰际、黑丝连裤袜被撕开破处并留宿侍寝的过程，突出她为还债而妥协落泪的心态。'
      ].join('\n'),
      storyText: [
        '夜幕沉入奥克赫斯山庄，厚实的橡木门将二楼私室与外间走廊隔成两个世界。摆在长桌上的那笔足以一次消去三成家族旧债的重金，成了压垮{name}最后推辞的砝码。',
        '她上身仍穿着严整的白色娃娃领衬衫、蓬松长袖与白色围裙，唯有及踝的黑色女仆长裙被雷蒙德粗暴地掀翻至腰际，裹住修长双腿的黑丝连裤袜在腿根处被强行撕开裂口。仰躺在冰冷的书房长椅上，金丝圆框眼镜微微歪斜，镜片后的深蓝眼眸蓄满水光。未经人事的青涩身躯在成年男性的强硬贯穿下发出压抑的呜咽，{name}颤抖着双手抓紧袖口，在阵阵撕裂般的痛楚与温热灌注中默默落泪，心里仍反复安慰自己只要再忍一忍便能替大家减轻重担。长夜之后，每逢工作日入夜她便默认留在山庄侍寝，直到周末才换回素净长裙勉强返店归队。'
      ].join('\n')
    },
    {
      id: 'echo_aurora_baron_mistress',
      eventId: 'aurora_stage_3',
      npc: 'aurora',
      title: '清空千金的契约签名',
      delayDays: 1,
      triggerCommand: '查看回忆：清空千金的契约签名',
      tagId: 'tag_aurora_baron_mistress',
      cgId: null,
      promptGuidance: [
        '【回忆模式】以沉沦期奥萝拉的视角回放她接下领主开出的足以还清剩余全部家族旧债的巨额封口重金、签署情妇契约长留山庄不再归队的经过。',
        '保留整洁女仆装束与金丝眼镜的细节，写出她合上账册签下名字、在丝绒扶手椅上接纳情妇身份与占有，周末亦不再返回旅店的结局。'
      ].join('\n'),
      storyText: [
        '书房壁炉的火光静静跳动，桌案上摊着一份附带巨额封口金票的情妇契约——那笔钱足以替她还清剩余全部家族旧债。经历了漫长工作日的盘剥与夜侍，{name}望着账册上即将归零的欠款数字，轻叹一声，用微凉发颤的手指合上随身携带的记账小皮册，拿起羽毛笔在契约末页工整地签下自己的名字。',
        '丝绒扶手椅上，她依然穿着整洁的黑白长裙女仆装与白围裙，只将长裙下摆撩起叠在腰间，摘下微微滑落的金丝圆框眼镜，听任地跨坐在雷蒙德领主怀中承受深沉的占有与灌注。眼角的泪痕已然干涸，取而代之的是认命般的温婉迎合。契约成立，{name}拿着那笔封口重金托人结清外债，正式长留在领主山庄深处，从此周末亦不再返回断剑与麦酒旅店。'
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
    if (!world.flags?.crystal_orb_unlocked) return []
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
    if (!world.flags?.crystal_orb_unlocked) return null
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
