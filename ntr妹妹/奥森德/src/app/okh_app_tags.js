/**
 * @module okh_app_tags
 * @updated 2026-11-26 22:25
 * @status active
 * @reason 注册与管理角色及主角后台标签（含负面Tag、三阶睡眠、妮丝暗线残响与营救Tag），状态归入世界存档 tags 分区
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
    }),
    tag_nise_dealer_shame: Object.freeze({
      id: 'tag_nise_dealer_shame',
      name: '荷官耻辱',
      desc: '独处时频繁拉扯衣领、确认常服领口是否遮严；偶尔下意识避开玩家与古兰的目光，神情紧绷。',
      visibility: 'private'
    }),
    tag_nise_secretary_fall: Object.freeze({
      id: 'tag_nise_secretary_fall',
      name: '账房失身',
      desc: '步态微显滞涩，深居简出；整日捧着书本或账册挡在胸前，眼神在恍惚与自弃间游移。',
      visibility: 'private'
    }),
    tag_nise_casino_chattel: Object.freeze({
      id: 'tag_nise_casino_chattel',
      name: '赌场私产',
      desc: '身心归附赌场，佩戴刻有金碧赌场暗印的项圈，眼神空洞麻木，甘愿充当内室抵债私产与招徕赌客的筹码。',
      visibility: 'private'
    }),
    tag_balak_grudge: Object.freeze({
      id: 'tag_balak_grudge',
      name: '巴拉克的记恨',
      desc: '金碧赌场黑老大巴拉克对小队潜入账房盗走借条怀恨在心，暗中物色报复与索讨机会。',
      visibility: 'public'
    }),
    tag_lord_manhunt: Object.freeze({
      id: 'tag_lord_manhunt',
      name: '全镇兵力围剿',
      desc: '暴力冲击领主暗中背书的金碧赌场，引来全镇卫兵与领主私兵的合围追捕，商业停摆且全队进入流亡状态。',
      visibility: 'public'
    }),
    // 7 项通用负面 Tag（公会冒险与遗迹探险）
    debuff_light_wound: Object.freeze({
      id: 'debuff_light_wound',
      name: '轻伤',
      desc: '力 -1, 敏 -1；轻微外伤撕裂，再次受创将恶化为重伤。',
      visibility: 'public'
    }),
    debuff_heavy_wound: Object.freeze({
      id: 'debuff_heavy_wound',
      name: '重伤',
      desc: '全四维 -2、有效战斗阶位 -1 阶；骨裂脏腑震荡，无法担任障碍硬解领头人，须救治或连续休养。',
      visibility: 'public'
    }),
    debuff_bleeding: Object.freeze({
      id: 'debuff_bleeding',
      name: '流血',
      desc: '力 -1；创口持续失血，若连续两时段未止血将恶化伤势。',
      visibility: 'public'
    }),
    debuff_poisoned: Object.freeze({
      id: 'debuff_poisoned',
      name: '中毒',
      desc: '力 -1, 敏 -1, 智 -1；毒素随血液蔓延，无法自愈，每持续 24 小时进一步损伤生机。',
      visibility: 'public'
    }),
    debuff_paralyzed: Object.freeze({
      id: 'debuff_paralyzed',
      name: '麻痹',
      desc: '敏 -2；神经与肌肉麻痹痉挛，禁止担任潜行、拆锁、远程射击或前排格挡，无法施展手势施法。',
      visibility: 'public'
    }),
    debuff_exhausted: Object.freeze({
      id: 'debuff_exhausted',
      name: '疲惫',
      desc: '力 -1, 敏 -1；体力透支、步履沉重动作迟滞，需休息休整清除。',
      visibility: 'public'
    }),
    debuff_starving: Object.freeze({
      id: 'debuff_starving',
      name: '断粮缺药',
      desc: '全四维 -1；补给断绝，禁止深入未知区域，超 24 小时附加轻伤。',
      visibility: 'public'
    }),
    // 3 阶睡眠状态（日常作息与战术控制）
    status_sleep_light: Object.freeze({
      id: 'status_sleep_light',
      name: '轻眠',
      desc: '浅度小憩轮休，保持基本警觉，轻微响动即惊醒，初动受限。',
      visibility: 'public'
    }),
    status_sleep_deep: Object.freeze({
      id: 'status_sleep_deep',
      name: '深眠',
      desc: '夜间沉入熟睡，常规推门靠近不会惊醒，大声摇晃方可唤醒。',
      visibility: 'public'
    }),
    status_sleep_comatose: Object.freeze({
      id: 'status_sleep_comatose',
      name: '沉眠',
      desc: '药剂或催眠术致深度昏睡，感知与反抗力归零，常规摇晃呼喊无效。',
      visibility: 'public'
    }),
    // 15 项种族 Tag（四维基准）
    race_human: Object.freeze({ id: 'race_human', name: '人类', category: 'race', stats: { str: 1, agi: 1, int: 1, fai: 1 }, desc: '无特殊天赋或生理异征。' }),
    race_catfolk: Object.freeze({ id: 'race_catfolk', name: '猫族半兽人', category: 'race', stats: { str: 1, agi: 3, int: 1, fai: 1 }, desc: '骨骼轻巧柔韧，反应与爆发敏捷出众；暗处夜视与远距听音辨位。' }),
    race_dragonkin: Object.freeze({ id: 'race_dragonkin', name: '半龙人', category: 'race', stats: { str: 4, agi: 2, int: 2, fai: 1 }, desc: '筋骨密度、力量与耐力远胜凡俗；受显性上位龙血同源压迫牵引。' }),
    race_orc_kin: Object.freeze({ id: 'race_orc_kin', name: '黑兽人/兽人混血', category: 'race', stats: { str: 3, agi: 1, int: 1, fai: 1 }, desc: '体格魁梧，肌力与抗冲击出众，擅长正面冲撞与锁死擒拿。' }),
    race_goblinoid: Object.freeze({ id: 'race_goblinoid', name: '哥布林/狗头人', category: 'race', stats: { str: 1, agi: 2, int: 1, fai: 0 }, desc: '矮小狡黠，擅长伏击陷阱与狭窄钻行；单兵正面体魄薄弱。' }),
    race_beast: Object.freeze({ id: 'race_beast', name: '野兽/魔兽', category: 'race', stats: { str: 2, agi: 2, int: 0, fai: 0 }, desc: '非智慧生物；具备敏锐嗅觉与扑咬本能，缺乏机关阵型应对力。' }),
    race_slime: Object.freeze({ id: 'race_slime', name: '史莱姆/软体魔物', category: 'race', stats: { str: 1, agi: 1, int: 0, fai: 0 }, desc: '非智慧生物；无固定骨骼，体表腐蚀与钝击缓冲；畏惧烈焰冰霜。' }),
    race_undead: Object.freeze({ id: 'race_undead', name: '亡灵系', category: 'race', stats: { str: 2, agi: 1, int: 0, fai: 0 }, desc: '非智慧生物；无痛觉无呼吸，免疫常规剧毒失血；受神术克制。' }),
    race_construct: Object.freeze({ id: 'race_construct', name: '构装体/石像魔像', category: 'race', stats: { str: 4, agi: 1, int: 0, fai: 0 }, desc: '非智慧生物；坚硬无血肉要害，免疫流血剧毒；畏惧重击破甲解离。' }),
    race_troll: Object.freeze({ id: 'race_troll', name: '巨魔', category: 'race', stats: { str: 6, agi: 1, int: 0, fai: 0 }, desc: '非智慧生物；体魄高大蛮力惊人，伤势再生旺盛；弱在火焰灼烧。' }),
    race_drake: Object.freeze({ id: 'race_drake', name: '亚龙', category: 'race', stats: { str: 6, agi: 3, int: 1, fai: 0 }, desc: '坚韧鳞甲与强横体魄，感官敏锐；缺乏真龙级上位威压。' }),
    race_dragon: Object.freeze({ id: 'race_dragon', name: '巨龙', category: 'race', stats: { str: 15, agi: 6, int: 8, fai: 0 }, desc: 'IV 阶宗师真龙；龙鳞体魄、龙息吐息与传承智识达宗师尺度。' }),
    race_ancient_dragon: Object.freeze({ id: 'race_ancient_dragon', name: '上古龙', category: 'race', stats: { str: 40, agi: 15, int: 20, fai: 0 }, desc: 'V 阶超凡古龙；护体龙鳞与法则感知跨入超凡，非人数可撼。' }),
    race_primordial_dragon: Object.freeze({ id: 'race_primordial_dragon', name: '太古龙', category: 'race', stats: { str: 120, agi: 40, int: 50, fai: 0 }, desc: 'VI 阶神话源初真龙；存在本身带有上位法则与血脉威压。' }),
    race_demon: Object.freeze({ id: 'race_demon', name: '恶魔', category: 'race', stats: { str: 6, agi: 4, int: 4, fai: 0 }, desc: '深渊存在，体魄与魔力带侵蚀性，擅混乱攻伐与精神蛊惑。' }),

    // 17 个职业基础 Tag 及 1~5 阶进阶 Tag
    class_shield_guard: Object.freeze({ id: 'class_shield_guard', name: '盾卫', category: 'class', tier: 2, stat: '力', desc: '手持重盾稳固正面阵线，护卫同伴施法。' }),
    class_shield_guard1: Object.freeze({ id: 'class_shield_guard1', name: '盾卫(I阶)', category: 'class', tier: 1, stat: '力', desc: '见习盾卫，本能遮挡。' }),
    class_shield_guard2: Object.freeze({ id: 'class_shield_guard2', name: '盾卫(II阶)', category: 'class', tier: 2, stat: '力', desc: '正规盾卫，正面抗压护卫后排。' }),
    class_shield_guard3: Object.freeze({ id: 'class_shield_guard3', name: '盾卫(III阶)', category: 'class', tier: 3, stat: '力', desc: '精锐盾卫，稳固盾墙护多人。' }),
    class_shield_guard4: Object.freeze({ id: 'class_shield_guard4', name: '盾卫(IV阶)', category: 'class', tier: 4, stat: '力', desc: '宗师盾卫，盾碎铁甲扼要道。' }),
    class_shield_guard5: Object.freeze({ id: 'class_shield_guard5', name: '盾卫(V阶)', category: 'class', tier: 5, stat: '力', desc: '超凡盾卫，气血凝盾抗攻城。' }),

    class_heavy_vanguard: Object.freeze({ id: 'class_heavy_vanguard', name: '重剑士', category: 'class', tier: 2, stat: '力', desc: '挥舞双手重剑，破甲压制正面强敌。' }),
    class_heavy_vanguard1: Object.freeze({ id: 'class_heavy_vanguard1', name: '重剑士(I阶)', category: 'class', tier: 1, stat: '力', desc: '见习重剑士，勉强挥动重剑。' }),
    class_heavy_vanguard2: Object.freeze({ id: 'class_heavy_vanguard2', name: '重剑士(II阶)', category: 'class', tier: 2, stat: '力', desc: '正规重剑士，沉稳压制同阶。' }),
    class_heavy_vanguard3: Object.freeze({ id: 'class_heavy_vanguard3', name: '重剑士(III阶)', category: 'class', tier: 3, stat: '力', desc: '精锐重剑士，破常规铁甲木盾。' }),
    class_heavy_vanguard4: Object.freeze({ id: 'class_heavy_vanguard4', name: '重剑士(IV阶)', category: 'class', tier: 4, stat: '力', desc: '宗师重剑士，剑风裂石撕开阵线。' }),
    class_heavy_vanguard5: Object.freeze({ id: 'class_heavy_vanguard5', name: '重剑士(V阶)', category: 'class', tier: 5, stat: '力', desc: '超凡重剑士，破城重击与气血护体。' }),

    class_duelist: Object.freeze({ id: 'class_duelist', name: '轻剑士', category: 'class', tier: 2, stat: '敏', desc: '手持单手细剑，步法游斗专刺破绽。' }),
    class_duelist1: Object.freeze({ id: 'class_duelist1', name: '轻剑士(I阶)', category: 'class', tier: 1, stat: '敏', desc: '见习轻剑士，基础刺击。' }),
    class_duelist2: Object.freeze({ id: 'class_duelist2', name: '轻剑士(II阶)', category: 'class', tier: 2, stat: '敏', desc: '正规轻剑士，步法稳健刺要害。' }),
    class_duelist3: Object.freeze({ id: 'class_duelist3', name: '轻剑士(III阶)', category: 'class', tier: 3, stat: '敏', desc: '精锐轻剑士，借力卸力游斗强敌。' }),
    class_duelist4: Object.freeze({ id: 'class_duelist4', name: '轻剑士(IV阶)', category: 'class', tier: 4, stat: '敏', desc: '宗师轻剑士，一息数刺穿重甲缝。' }),
    class_duelist5: Object.freeze({ id: 'class_duelist5', name: '轻剑士(V阶)', category: 'class', tier: 5, stat: '敏', desc: '超凡轻剑士，细剑截断高阶术式。' }),

    class_berserker: Object.freeze({ id: 'class_berserker', name: '狂战士', category: 'class', tier: 2, stat: '力', desc: '搏命换伤，挂伤后战意攀升。' }),
    class_berserker1: Object.freeze({ id: 'class_berserker1', name: '狂战士(I阶)', category: 'class', tier: 1, stat: '力', desc: '见习狂战士，蛮力乱挥。' }),
    class_berserker2: Object.freeze({ id: 'class_berserker2', name: '狂战士(II阶)', category: 'class', tier: 2, stat: '力', desc: '正规狂战士，血气硬吃擦伤。' }),
    class_berserker3: Object.freeze({ id: 'class_berserker3', name: '狂战士(III阶)', category: 'class', tier: 3, stat: '力', desc: '精锐狂战士，受创中连续破防。' }),
    class_berserker4: Object.freeze({ id: 'class_berserker4', name: '狂战士(IV阶)', category: 'class', tier: 4, stat: '力', desc: '宗师狂战士，濒危力量攀升震慑阵线。' }),
    class_berserker5: Object.freeze({ id: 'class_berserker5', name: '狂战士(V阶)', category: 'class', tier: 5, stat: '力', desc: '超凡狂战士，不死不休超凡血气。' }),

    class_devotion_paladin: Object.freeze({ id: 'class_devotion_paladin', name: '圣骑士', category: 'class', tier: 2, stat: '力', desc: '重甲圣光结合，代同伴承伤并克制死灵。' }),
    class_devotion_paladin1: Object.freeze({ id: 'class_devotion_paladin1', name: '圣骑士(I阶)', category: 'class', tier: 1, stat: '力', desc: '见习圣骑士，轻甲安神。' }),
    class_devotion_paladin2: Object.freeze({ id: 'class_devotion_paladin2', name: '圣骑士(II阶)', category: 'class', tier: 2, stat: '力', desc: '正规圣骑士，重甲圣光代承伤害。' }),
    class_devotion_paladin3: Object.freeze({ id: 'class_devotion_paladin3', name: '圣骑士(III阶)', category: 'class', tier: 3, stat: '力', desc: '精锐圣骑士，圣光抗诅咒护小队。' }),
    class_devotion_paladin4: Object.freeze({ id: 'class_devotion_paladin4', name: '圣骑士(IV阶)', category: 'class', tier: 4, stat: '力', desc: '宗师圣骑士，展开守护结界。' }),
    class_devotion_paladin5: Object.freeze({ id: 'class_devotion_paladin5', name: '圣骑士(V阶)', category: 'class', tier: 5, stat: '力', desc: '超凡圣骑士，化身移动圣垒。' }),

    class_scout_stealth: Object.freeze({ id: 'class_scout_stealth', name: '斥候', category: 'class', tier: 2, stat: '敏', desc: '野外辨向与隐蔽跟踪，探路清障。' }),
    class_scout_stealth1: Object.freeze({ id: 'class_scout_stealth1', name: '斥候(I阶)', category: 'class', tier: 1, stat: '敏', desc: '见习斥候，野外辨向。' }),
    class_scout_stealth2: Object.freeze({ id: 'class_scout_stealth2', name: '斥候(II阶)', category: 'class', tier: 2, stat: '敏', desc: '正规斥候，潜行跟踪脱身。' }),
    class_scout_stealth3: Object.freeze({ id: 'class_scout_stealth3', name: '斥候(III阶)', category: 'class', tier: 3, stat: '敏', desc: '精锐斥候，高速突袭反制警戒。' }),
    class_scout_stealth4: Object.freeze({ id: 'class_scout_stealth4', name: '斥候(IV阶)', category: 'class', tier: 4, stat: '敏', desc: '宗师斥候，严密防线自由穿行。' }),
    class_scout_stealth5: Object.freeze({ id: 'class_scout_stealth5', name: '斥候(V阶)', category: 'class', tier: 5, stat: '敏', desc: '超凡斥候，避开常规魔导侦测。' }),

    class_sniper_archer: Object.freeze({ id: 'class_sniper_archer', name: '弓箭手', category: 'class', tier: 2, stat: '敏', desc: '远程精准点射掩护，压制施法者。' }),
    class_sniper_archer1: Object.freeze({ id: 'class_sniper_archer1', name: '弓箭手(I阶)', category: 'class', tier: 1, stat: '敏', desc: '见习弓箭手，近中距固定靶。' }),
    class_sniper_archer2: Object.freeze({ id: 'class_sniper_archer2', name: '弓箭手(II阶)', category: 'class', tier: 2, stat: '敏', desc: '正规弓箭手，百步精准点射掩护。' }),
    class_sniper_archer3: Object.freeze({ id: 'class_sniper_archer3', name: '弓箭手(III阶)', category: 'class', tier: 3, stat: '敏', desc: '精锐弓箭手，重弓穿甲压制吟唱。' }),
    class_sniper_archer4: Object.freeze({ id: 'class_sniper_archer4', name: '弓箭手(IV阶)', category: 'class', tier: 4, stat: '敏', desc: '宗师弓箭手，超远距破风狙杀。' }),
    class_sniper_archer5: Object.freeze({ id: 'class_sniper_archer5', name: '弓箭手(V阶)', category: 'class', tier: 5, stat: '敏', desc: '超凡弓箭手，百丈贯甲截断法阵。' }),

    class_trap_breaker: Object.freeze({ id: 'class_trap_breaker', name: '盗贼', category: 'class', tier: 2, stat: '敏', desc: '精通开锁拆陷与暗道机括。' }),
    class_trap_breaker1: Object.freeze({ id: 'class_trap_breaker1', name: '盗贼(I阶)', category: 'class', tier: 1, stat: '敏', desc: '见习盗贼，辨明绊索粗锁。' }),
    class_trap_breaker2: Object.freeze({ id: 'class_trap_breaker2', name: '盗贼(II阶)', category: 'class', tier: 2, stat: '敏', desc: '正规盗贼，撬锁拆除基础陷阱。' }),
    class_trap_breaker3: Object.freeze({ id: 'class_trap_breaker3', name: '盗贼(III阶)', category: 'class', tier: 3, stat: '敏', desc: '精锐盗贼，破双层暗锁毒气机关。' }),
    class_trap_breaker4: Object.freeze({ id: 'class_trap_breaker4', name: '盗贼(IV阶)', category: 'class', tier: 4, stat: '敏', desc: '宗师盗贼，无声拆解密库死局。' }),
    class_trap_breaker5: Object.freeze({ id: 'class_trap_breaker5', name: '盗贼(V阶)', category: 'class', tier: 5, stat: '敏', desc: '超凡盗贼，破古代禁锁。' }),

    class_assassin: Object.freeze({ id: 'class_assassin', name: '刺客', category: 'class', tier: 2, stat: '敏', desc: '阴影潜行，兵刃涂毒直刺要害。' }),
    class_assassin1: Object.freeze({ id: 'class_assassin1', name: '刺客(I阶)', category: 'class', tier: 1, stat: '敏', desc: '见习刺客，背后偷袭。' }),
    class_assassin2: Object.freeze({ id: 'class_assassin2', name: '刺客(II阶)', category: 'class', tier: 2, stat: '敏', desc: '正规刺客，涂毒阴影一击。' }),
    class_assassin3: Object.freeze({ id: 'class_assassin3', name: '刺客(III阶)', category: 'class', tier: 3, stat: '敏', desc: '精锐刺客，混战切入断后排。' }),
    class_assassin4: Object.freeze({ id: 'class_assassin4', name: '刺客(IV阶)', category: 'class', tier: 4, stat: '敏', desc: '宗师刺客，护卫眼前绝杀远遁。' }),
    class_assassin5: Object.freeze({ id: 'class_assassin5', name: '刺客(V阶)', category: 'class', tier: 5, stat: '敏', desc: '超凡刺客，难以捕捉之影。' }),

    class_arcane_blast: Object.freeze({ id: 'class_arcane_blast', name: '元素法师', category: 'class', tier: 2, stat: '智', desc: '吟唱元素法术，大范围轰击与穿甲。' }),
    class_arcane_blast1: Object.freeze({ id: 'class_arcane_blast1', name: '元素法师(I阶)', category: 'class', tier: 1, stat: '智', desc: '见习法师，生活戏法与微弱火星。' }),
    class_arcane_blast2: Object.freeze({ id: 'class_arcane_blast2', name: '元素法师(II阶)', category: 'class', tier: 2, stat: '智', desc: '正规法师，成型元素火球与冰盾。' }),
    class_arcane_blast3: Object.freeze({ id: 'class_arcane_blast3', name: '元素法师(III阶)', category: 'class', tier: 3, stat: '智', desc: '精锐法师，中阶范围与连发穿甲。' }),
    class_arcane_blast4: Object.freeze({ id: 'class_arcane_blast4', name: '元素法师(IV阶)', category: 'class', tier: 4, stat: '智', desc: '宗师法师，大型术式压制军阵。' }),
    class_arcane_blast5: Object.freeze({ id: 'class_arcane_blast5', name: '元素法师(V阶)', category: 'class', tier: 5, stat: '智', desc: '超凡法师，改写局部气候与地貌。' }),

    class_rune_decode: Object.freeze({ id: 'class_rune_decode', name: '符文师', category: 'class', tier: 2, stat: '智', desc: '辨识魔纹卷轴，拆解古代奥术封印。' }),
    class_rune_decode1: Object.freeze({ id: 'class_rune_decode1', name: '符文师(I阶)', category: 'class', tier: 1, stat: '智', desc: '见习符文师，辨基础铭文。' }),
    class_rune_decode2: Object.freeze({ id: 'class_rune_decode2', name: '符文师(II阶)', category: 'class', tier: 2, stat: '智', desc: '正规符文师，释读古卷与法术陷阱。' }),
    class_rune_decode3: Object.freeze({ id: 'class_rune_decode3', name: '符文师(III阶)', category: 'class', tier: 3, stat: '智', desc: '精锐符文师，解离复合奥术封印。' }),
    class_rune_decode4: Object.freeze({ id: 'class_rune_decode4', name: '符文师(IV阶)', category: 'class', tier: 4, stat: '智', desc: '宗师符文师，干涉大型魔网阵眼。' }),
    class_rune_decode5: Object.freeze({ id: 'class_rune_decode5', name: '符文师(V阶)', category: 'class', tier: 5, stat: '智', desc: '超凡符文师，重构逆转古阵。' }),

    class_arcane_ward: Object.freeze({ id: 'class_arcane_ward', name: '结界师', category: 'class', tier: 2, stat: '智', desc: '展开力场屏障，抵挡远程与范围轰击。' }),
    class_arcane_ward1: Object.freeze({ id: 'class_arcane_ward1', name: '结界师(I阶)', category: 'class', tier: 1, stat: '智', desc: '见习结界师，微弱光膜。' }),
    class_arcane_ward2: Object.freeze({ id: 'class_arcane_ward2', name: '结界师(II阶)', category: 'class', tier: 2, stat: '智', desc: '正规结界师，力场盾挡箭与单体术。' }),
    class_arcane_ward3: Object.freeze({ id: 'class_arcane_ward3', name: '结界师(III阶)', category: 'class', tier: 3, stat: '智', desc: '精锐结界师，小队半圆防护屏障。' }),
    class_arcane_ward4: Object.freeze({ id: 'class_arcane_ward4', name: '结界师(IV阶)', category: 'class', tier: 4, stat: '智', desc: '宗师结界师，宗师结界与反魔力场。' }),
    class_arcane_ward5: Object.freeze({ id: 'class_arcane_ward5', name: '结界师(V阶)', category: 'class', tier: 5, stat: '智', desc: '超凡结界师，抗衡天灾奥术壁垒。' }),

    class_necromancer: Object.freeze({ id: 'class_necromancer', name: '死灵法师', category: 'class', tier: 2, stat: '智', desc: '驱使死灵骨骸，降下衰弱诅咒。' }),
    class_necromancer1: Object.freeze({ id: 'class_necromancer1', name: '死灵法师(I阶)', category: 'class', tier: 1, stat: '智', desc: '见习死灵法师，驱使低阶骷髅。' }),
    class_necromancer2: Object.freeze({ id: 'class_necromancer2', name: '死灵法师(II阶)', category: 'class', tier: 2, stat: '智', desc: '正规死灵法师，唤起食尸鬼与诅咒。' }),
    class_necromancer3: Object.freeze({ id: 'class_necromancer3', name: '死灵法师(III阶)', category: 'class', tier: 3, stat: '智', desc: '精锐死灵法师，统御死灵骑士。' }),
    class_necromancer4: Object.freeze({ id: 'class_necromancer4', name: '死灵法师(IV阶)', category: 'class', tier: 4, stat: '智', desc: '宗师死灵法师，巫妖级亡灵军团。' }),
    class_necromancer5: Object.freeze({ id: 'class_necromancer5', name: '死灵法师(V阶)', category: 'class', tier: 5, stat: '智', desc: '超凡死灵法师，大巫妖禁忌术式。' }),

    class_holy_heal: Object.freeze({ id: 'class_holy_heal', name: '治疗牧师', category: 'class', tier: 2, stat: '信', desc: '引动神圣神术，闭合伤口抚平濒危。' }),
    class_holy_heal1: Object.freeze({ id: 'class_holy_heal1', name: '治疗牧师(I阶)', category: 'class', tier: 1, stat: '信', desc: '见习牧师，安神祷言与草药止血。' }),
    class_holy_heal2: Object.freeze({ id: 'class_holy_heal2', name: '治疗牧师(II阶)', category: 'class', tier: 2, stat: '信', desc: '正规牧师，实效闭合中轻度创伤。' }),
    class_holy_heal3: Object.freeze({ id: 'class_holy_heal3', name: '治疗牧师(III阶)', category: 'class', tier: 3, stat: '信', desc: '精锐牧师，群体疗愈与重伤急救。' }),
    class_holy_heal4: Object.freeze({ id: 'class_holy_heal4', name: '治疗牧师(IV阶)', category: 'class', tier: 4, stat: '信', desc: '宗师牧师，瞬间抚平濒危重创。' }),
    class_holy_heal5: Object.freeze({ id: 'class_holy_heal5', name: '治疗牧师(V阶)', category: 'class', tier: 5, stat: '信', desc: '超凡牧师，覆盖战场群体复苏。' }),

    class_purify_ward: Object.freeze({ id: 'class_purify_ward', name: '驱魔牧师', category: 'class', tier: 2, stat: '信', desc: '驱散瘴气毒雾与古代诅咒，灼伤邪祟。' }),
    class_purify_ward1: Object.freeze({ id: 'class_purify_ward1', name: '驱魔牧师(I阶)', category: 'class', tier: 1, stat: '信', desc: '见习驱魔牧师，微弱感知污秽。' }),
    class_purify_ward2: Object.freeze({ id: 'class_purify_ward2', name: '驱魔牧师(II阶)', category: 'class', tier: 2, stat: '信', desc: '正规驱魔牧师，驱散轻度腐毒动摇。' }),
    class_purify_ward3: Object.freeze({ id: 'class_purify_ward3', name: '驱魔牧师(III阶)', category: 'class', tier: 3, stat: '信', desc: '精锐驱魔牧师，强效净化古诅咒烈毒。' }),
    class_purify_ward4: Object.freeze({ id: 'class_purify_ward4', name: '驱魔牧师(IV阶)', category: 'class', tier: 4, stat: '信', desc: '宗师驱魔牧师，大范围净化遗迹区域。' }),
    class_purify_ward5: Object.freeze({ id: 'class_purify_ward5', name: '驱魔牧师(V阶)', category: 'class', tier: 5, stat: '信', desc: '超凡驱魔牧师，抹除深渊侵蚀灾雾。' }),

    class_elixir_alchemist: Object.freeze({ id: 'class_elixir_alchemist', name: '药剂师', category: 'class', tier: 2, stat: '智', desc: '配制急救药膏与通用解毒剂。' }),
    class_elixir_alchemist1: Object.freeze({ id: 'class_elixir_alchemist1', name: '药剂师(I阶)', category: 'class', tier: 1, stat: '智', desc: '见习药剂师，金疮草膏。' }),
    class_elixir_alchemist2: Object.freeze({ id: 'class_elixir_alchemist2', name: '药剂师(II阶)', category: 'class', tier: 2, stat: '智', desc: '正规药剂师，快速止血通用解毒。' }),
    class_elixir_alchemist3: Object.freeze({ id: 'class_elixir_alchemist3', name: '药剂师(III阶)', category: 'class', tier: 3, stat: '智', desc: '精锐药剂师，再生秘药与烈性涂毒。' }),
    class_elixir_alchemist4: Object.freeze({ id: 'class_elixir_alchemist4', name: '药剂师(IV阶)', category: 'class', tier: 4, stat: '智', desc: '宗师药剂师，激发秘药与奇毒解药。' }),
    class_elixir_alchemist5: Object.freeze({ id: 'class_elixir_alchemist5', name: '药剂师(V阶)', category: 'class', tier: 5, stat: '智', desc: '超凡药剂师，触及生命炼成奥秘。' }),

    class_bombardier: Object.freeze({ id: 'class_bombardier', name: '炼金术士', category: 'class', tier: 2, stat: '智', desc: '投掷酸液瓶与火药炸罐破障。' }),
    class_bombardier1: Object.freeze({ id: 'class_bombardier1', name: '炼金术士(I阶)', category: 'class', tier: 1, stat: '智', desc: '见习炼金术士，黑火药罐。' }),
    class_bombardier2: Object.freeze({ id: 'class_bombardier2', name: '炼金术士(II阶)', category: 'class', tier: 2, stat: '智', desc: '正规炼金术士，酸液瓶与燃烧瓶清软体。' }),
    class_bombardier3: Object.freeze({ id: 'class_bombardier3', name: '炼金术士(III阶)', category: 'class', tier: 3, stat: '智', desc: '精锐炼金术士，炸药炸穿石门掩体。' }),
    class_bombardier4: Object.freeze({ id: 'class_bombardier4', name: '炼金术士(IV阶)', category: 'class', tier: 4, stat: '智', desc: '宗师炼金术士，定向爆药毁构装体。' }),
    class_bombardier5: Object.freeze({ id: 'class_bombardier5', name: '炼金术士(V阶)', category: 'class', tier: 5, stat: '智', desc: '超凡炼金术士，浓缩炸药平整堡垒。' }),

    // 特质 Tag
    trait_strong: Object.freeze({ id: 'trait_strong', name: '强壮', category: 'trait', statBonus: { str: 1 }, desc: '筋骨健硕，力量 +1。' }),
    trait_agile: Object.freeze({ id: 'trait_agile', name: '敏捷', category: 'trait', statBonus: { agi: 1 }, desc: '身手敏捷，敏捷 +1。' }),
    trait_clever: Object.freeze({ id: 'trait_clever', name: '聪明', category: 'trait', statBonus: { int: 1 }, desc: '心思敏锐，智力 +1。' }),
    trait_steadfast: Object.freeze({ id: 'trait_steadfast', name: '坚定', category: 'trait', statBonus: { fai: 1 }, desc: '意志沉稳，信仰 +1。' }),

    trait_dragon_awakening: Object.freeze({ id: 'trait_dragon_awakening', name: '血脉激发·龙化', category: 'trait', desc: '古兰专属；状态标识，激发时跃升超凡表现。' }),
    trait_blood_resonance_weak: Object.freeze({ id: 'trait_blood_resonance_weak', name: '同源血脉受迫', category: 'trait', desc: '古兰专属；面对上位显性龙血或龙器时受牵引压迫，出剑不稳。' }),
    trait_street_smart: Object.freeze({ id: 'trait_street_smart', name: '市井老手', category: 'trait', desc: '伊丝娜专属；识破虚高报价与假货，探听多获暗线线索。' }),
    trait_arcane_prodigy: Object.freeze({ id: 'trait_arcane_prodigy', name: '算力推演', category: 'trait', statBonus: { int: 1 }, desc: '妮丝专属；智力 +1，精于复合术式解算。' }),
    trait_stubborn_pride: Object.freeze({ id: 'trait_stubborn_pride', name: '好胜隐瞒', category: 'trait', desc: '妮丝动态；独自受挫或受要挟时不向队友求助。' }),
    nise_gamble_immune: Object.freeze({ id: 'nise_gamble_immune', name: '完全绝赌', category: 'trait', desc: '妮丝专属；在经历借据危机的生死惊悸或深厚羁绊的清偿挽救后幡然醒悟，永久免疫赌场复赌诱惑。' }),
    trait_gentle_steward: Object.freeze({ id: 'trait_gentle_steward', name: '细心照料', category: 'trait', statBonus: { fai: 1 }, desc: '奥萝拉专属；信仰 +1，照看伤员细致入微。' }),
    trait_timid_yield: Object.freeze({ id: 'trait_timid_yield', name: '畏权退让', category: 'trait', desc: '奥萝拉动态；面对权贵威压易退让妥协。' }),
    trait_street_rumor: Object.freeze({ id: 'trait_street_rumor', name: '市井耳目', category: 'trait', desc: '爱德专属；街市打听风声、抢截未登板急件。' }),
    trait_royal_warrant: Object.freeze({ id: 'trait_royal_warrant', name: '王室特使凭证', category: 'trait', desc: '艾琳动态；关卡免检、查阅防务账目。' }),
    trait_sanctuary_aura: Object.freeze({ id: 'trait_sanctuary_aura', name: '纯白庇佑', category: 'trait', desc: '塞西莉亚专属；安抚惊恐、驱散污秽与拔除血契。' }),

    // 5 项公会阶位 Tag
    guild_novice: Object.freeze({ id: 'guild_novice', name: '见习小队', category: 'guild', meritReq: 0, desc: '刚在公会登记的新人小队，接取城镇日常短差与外围清障。' }),
    guild_bronze: Object.freeze({ id: 'guild_bronze', name: '青铜小队', category: 'guild', meritReq: 20, desc: '累计 20 功绩；具备野外自保力，接取荒原中度讨伐与近郊护卫。' }),
    guild_silver: Object.freeze({ id: 'guild_silver', name: '白银小队', category: 'guild', meritReq: 60, desc: '累计 60 功绩；边境中坚主力，接取精锐敌群猎杀与浅层遗迹勘探。' }),
    guild_gold: Object.freeze({ id: 'guild_gold', name: '黄金小队', category: 'guild', meritReq: 120, desc: '累计 120 功绩；高阶劲旅，接取大型地宫中层勘测与高危魔兽讨伐。' }),
    guild_mithril: Object.freeze({ id: 'guild_mithril', name: '秘银小队', category: 'guild', meritReq: 200, desc: '累计 200 功绩；顶尖标杆，开放深层遗迹与龙脉禁区探索特许。' })
  })

  const idOf = tag => typeof tag === 'string' ? tag : tag?.id

  function apply(world, npcId, added = [], removed = []) {
    u.check(npcId === 'player' || u.own(world.npcs, npcId), '标签须用于已登记角色或主角')
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
