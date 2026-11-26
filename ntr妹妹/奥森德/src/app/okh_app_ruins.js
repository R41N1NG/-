/**
 * @module      okh_app_ruins
 * @updated     2026-11-26 14:30
 * @status      active
 * @reason      遗迹探险引擎解耦实现，提供六大生态、全量组件白名单、流水线组装与探险推进事务
 * @deps        ['utils']
 * @provides    { catalog, assemble, enter, advance, retreat, migrate, getStatus }
 */
(function (root) {
  'use strict'

  const u = root.OKHBackgroundModules.utils

  // 1. 六大生态多维感官环境氛围与战术禁忌
  const biomes = Object.freeze({
    biome_narrow_mine: Object.freeze({
      id: 'biome_narrow_mine',
      name: '狭窄矿坑与竖井岩洞',
      minTier: 2,
      atmosphere: Object.freeze({
        architecture: '粗粝矮伏的凿石坑道、朽烂的原木支撑架、锈蚀轨道与渗水升降竖井',
        air: '潮湿泥土气混杂微弱硫磺味与铁锈腥气，空气滞重闷热',
        visibility: '视距仅数米，火把光芒被黑沉岩壁吸收，悬浮细微石粉',
        sound: '断续滴水空响、风穿狭窄岩缝的低啸、碎石滚落声',
        taboo: '严禁用大范围烈焰法术（易引爆积聚瓦斯）；不可大力敲击支撑木柱'
      })
    }),
    biome_toxic_mire: Object.freeze({
      id: 'biome_toxic_mire',
      name: '毒沼菌窟与腐殖坑道',
      minTier: 2,
      atmosphere: Object.freeze({
        architecture: '坍塌砖石地宫浸泡在黑绿死水中，大片发光菌毯与寄生藤蔓封堵通路',
        air: '浓烈刺鼻的腐败酸臭、发酵沼气与微甜致幻菌孢粉末',
        visibility: '菌孢散发青幽磷光，水面泛油彩光晕，雾气弥漫',
        sound: '淤泥气泡破裂的咕嘟声、水下不明生物摆尾游动的划水声',
        taboo: '全员必须扎紧裤腿与领口；禁止直接饮用渗水；涉水必探深浅'
      })
    }),
    biome_trap_vault: Object.freeze({
      id: 'biome_trap_vault',
      name: '机关暗殿与古代地宫',
      minTier: 2,
      atmosphere: Object.freeze({
        architecture: '紧密的玄武岩磨光条石、倾斜暗道、重力翻板与雕刻斑驳的古代警语',
        air: '干燥阴凉，夹杂陈旧石粉与机油硬化后的焦苦味',
        visibility: '视线开阔但死角密布，反光石砖反射惨白光斑，长廊深处漆黑',
        sound: '墙内齿轮微弱咬合卡顿声、铅块滑轨重压摩擦声、皮靴清脆踏步声',
        taboo: '禁止盲目踩踏中轴条石；拆卸卡榫前必须探明配重线，不可蛮力拉拽'
      })
    }),
    biome_living_lair: Object.freeze({
      id: 'biome_living_lair',
      name: '魔兽盘踞坑与活体巢穴',
      minTier: 2,
      atmosphere: Object.freeze({
        architecture: '带有深邃抓痕的天然石灰岩溶洞、撕碎的毛皮残渣、啃光骨髓的累累兽骨',
        air: '扑面而来的野兽骚腥味、干涸发黑的血腥气与残渣馊臭',
        visibility: '洞口逆光投射，深处阴暗潮湿，岩石转角后常有天然落差天坑',
        sound: '沉重的粗喘声、喉咙深处的护食低吼声、细碎啃咬骨头声',
        taboo: '必须处于下风口潜行接近；严禁在母兽视线内直视其双眼或幼崽'
      })
    }),
    biome_arcane_grid: Object.freeze({
      id: 'biome_arcane_grid',
      name: '秘术网格与浮空构装',
      minTier: 3, // 三阶及以上专属
      atmosphere: Object.freeze({
        architecture: '蓝白魔导晶石基座、断裂的秘银浮石回廊、嗡鸣运转的半透明力场屏障',
        air: '强烈的臭氧焦味，空气干燥微麻，毛发容易因静电竖起',
        visibility: '悬浮魔力微粒形成冷色散光，闪烁电弧强光，阴影被冲淡',
        sound: '持续低沉的魔力震荡共鸣音，如无休止的风箱振动；屏障微颤蜂鸣',
        taboo: '禁止在导能水槽周围施放大范围电弧；金属重甲者注意防引弧'
      })
    }),
    biome_undead_crypt: Object.freeze({
      id: 'biome_undead_crypt',
      name: '沉沦灵堂与亡灵墓穴',
      minTier: 3, // 三阶及以上专属
      atmosphere: Object.freeze({
        architecture: '潮湿的花岗岩壁龛、堆叠的石棺、散落的风化骸骨与被砸毁的石碑',
        air: '刺骨的死寂阴冷、发霉的棺木亚麻布与陈年骨粉气味',
        visibility: '幽暗寒冷，火光会被阴冷死气压制得泛绿萎缩，冷雾贴地缓缓流动',
        sound: '骸骨受惊碰撞的声响、指甲刮擦石棺内壁声、虚无的叹息声',
        taboo: '全员佩戴圣水或银饰驱寒；严禁在骨灰瓮旁剧烈跑动扬起骨尘'
      })
    })
  })

  // 2. 入口组件库 (15个)
  const entrances = Object.freeze({
    ent_mine_01: Object.freeze({ id: 'ent_mine_01', name: '荒废矿道塌方口', biome: 'mine', minHours: 8 }),
    ent_mine_02: Object.freeze({ id: 'ent_mine_02', name: '垂直绞盘通风竖井', biome: 'mine', minHours: 8 }),
    ent_mine_03: Object.freeze({ id: 'ent_mine_03', name: '地表裂谷隐秘斜坡', biome: 'mine', minHours: 8 }),
    ent_mire_01: Object.freeze({ id: 'ent_mire_01', name: '腐木栈桥残段', biome: 'mire', minHours: 10 }),
    ent_mire_02: Object.freeze({ id: 'ent_mire_02', name: '菌丝覆盖的排水涵洞', biome: 'mire', minHours: 10 }),
    ent_mire_03: Object.freeze({ id: 'ent_mire_03', name: '沉没地宫换气石孔', biome: 'mire', minHours: 8 }),
    ent_vault_01: Object.freeze({ id: 'ent_vault_01', name: '生锈的双重断龙石闸', biome: 'vault', minHours: 10 }),
    ent_vault_02: Object.freeze({ id: 'ent_vault_02', name: '古代守卫回廊外门', biome: 'vault', minHours: 8 }),
    ent_vault_03: Object.freeze({ id: 'ent_vault_03', name: '裂隙塌陷暗殿石拱', biome: 'vault', minHours: 8 }),
    ent_lair_01: Object.freeze({ id: 'ent_lair_01', name: '巨兽利爪开凿的豁口', biome: 'lair', minHours: 8 }),
    ent_lair_02: Object.freeze({ id: 'ent_lair_02', name: '乱石林天然溶洞缝隙', biome: 'lair', minHours: 8 }),
    ent_lair_03: Object.freeze({ id: 'ent_lair_03', name: '荆棘杂木遮蔽的天坑', biome: 'lair', minHours: 10 }),
    ent_arcane_01: Object.freeze({ id: 'ent_arcane_01', name: '悬浮秘银回廊残桥', biome: 'arcane', minHours: 12 }),
    ent_arcane_02: Object.freeze({ id: 'ent_arcane_02', name: '紊乱魔导符文屏障门', biome: 'arcane', minHours: 10 }),
    ent_crypt_01: Object.freeze({ id: 'ent_crypt_01', name: '青砖盗洞入口', biome: 'crypt', minHours: 8 })
  })

  // 3. 机关险阻组件库 (15个)
  const obstacles = Object.freeze({
    obs_mine_gas: Object.freeze({ id: 'obs_mine_gas', name: '瓦斯积聚区', biome: 'mine', tier: 2, reqAbility: '辨识', reqDc: 2, altAbility: '破障', altDc: 2, minHours: 8 }),
    obs_mine_rockfall: Object.freeze({ id: 'obs_mine_rockfall', name: '朽木摇晃塌方带', biome: 'mine', tier: 2, reqAbility: '拆陷', reqDc: 2, altAbility: '破障', altDc: 2, minHours: 10 }),
    obs_mire_parasite: Object.freeze({ id: 'obs_mire_parasite', name: '剧毒水蛭腐殖池', biome: 'mire', tier: 2, reqAbility: '辨识', reqDc: 2, altAbility: '治疗', altDc: 2, minHours: 10 }),
    obs_mire_spores: Object.freeze({ id: 'obs_mire_spores', name: '迷幻紫菌孢子帘', biome: 'mire', tier: 2, reqAbility: '侦查', reqDc: 2, altAbility: '辨识', altDc: 2, minHours: 10 }),
    obs_vault_darts: Object.freeze({ id: 'obs_vault_darts', name: '连环梅花重力毒针板', biome: 'vault', tier: 2, reqAbility: '拆陷', reqDc: 2, altAbility: '开锁', altDc: 2, minHours: 8 }),
    obs_vault_blade: Object.freeze({ id: 'obs_vault_blade', name: '摆斧滚石连动走廊', biome: 'vault', tier: 2, reqAbility: '侦查', reqDc: 2, altAbility: '潜行', altDc: 2, minHours: 10 }),
    obs_vault_gate: Object.freeze({ id: 'obs_vault_gate', name: '三阶闭锁合金暗门', biome: 'vault', tier: 3, reqAbility: '开锁', reqDc: 3, altAbility: '破障', altDc: 3, minHours: 12 }),
    obs_lair_webs: Object.freeze({ id: 'obs_lair_webs', name: '黏稠地穴毒蛛网阵', biome: 'lair', tier: 2, reqAbility: '破障', reqDc: 2, altAbility: '辨识', altDc: 2, minHours: 8 }),
    obs_lair_scent: Object.freeze({ id: 'obs_lair_scent', name: '敏感暗影豹气味警戒圈', biome: 'lair', tier: 2, reqAbility: '潜行', reqDc: 2, altAbility: '侦查', altDc: 2, minHours: 8 }),
    obs_arcane_turret: Object.freeze({ id: 'obs_arcane_turret', name: '充能自动魔导哨戒机', biome: 'arcane', tier: 3, reqAbility: '拆陷', reqDc: 3, altAbility: '辨识', altDc: 3, minHours: 12 }),
    obs_arcane_rift: Object.freeze({ id: 'obs_arcane_rift', name: '空间重叠相位紊乱区', biome: 'arcane', tier: 3, reqAbility: '辨识', reqDc: 3, altAbility: '潜行', altDc: 3, minHours: 12 }),
    obs_crypt_coffin: Object.freeze({ id: 'obs_crypt_coffin', name: '尸毒陷阱殉葬石棺道', biome: 'crypt', tier: 3, reqAbility: '拆陷', reqDc: 3, altAbility: '治疗', altDc: 3, minHours: 10 }),
    obs_crypt_cold: Object.freeze({ id: 'obs_crypt_cold', name: '严霜侵蚀死寂回廊', biome: 'crypt', tier: 3, reqAbility: '治疗', reqDc: 3, altAbility: '辨识', altDc: 3, minHours: 10 }),
    obs_universal_quake: Object.freeze({ id: 'obs_universal_quake', name: '地震开裂地底熔岩缝', biome: 'universal', tier: 2, reqAbility: '破障', reqDc: 2, altAbility: '侦查', altDc: 2, minHours: 8 }),
    obs_universal_puzzle: Object.freeze({ id: 'obs_universal_puzzle', name: '古代文明几何密码盘', biome: 'universal', tier: 2, reqAbility: '辨识', reqDc: 2, altAbility: '开锁', altDc: 2, minHours: 8 })
  })

  // 4. 策略岔路组件库 (30个纯路由)
  const branches = Object.freeze({
    br_mine_01: Object.freeze({ id: 'br_mine_01', name: '运输窄轨与通风竖井', biome: 'mine', minHours: 8 }),
    br_mine_02: Object.freeze({ id: 'br_mine_02', name: '渗水积坑与敲凿采掘面', biome: 'mine', minHours: 8 }),
    br_mine_03: Object.freeze({ id: 'br_mine_03', name: '塌方拱顶与沉重防火门', biome: 'mine', minHours: 8 }),
    br_mine_04: Object.freeze({ id: 'br_mine_04', name: '废弃工具间与岩隙回廊', biome: 'mine', minHours: 8 }),
    br_mine_05: Object.freeze({ id: 'br_mine_05', name: '熔岩缝暗道与坚实主道', biome: 'mine', minHours: 8 }),
    br_mire_01: Object.freeze({ id: 'br_mire_01', name: '浅滩泥泞道与发光菌林', biome: 'mire', minHours: 8 }),
    br_mire_02: Object.freeze({ id: 'br_mire_02', name: '半沉砖石拱廊与芦苇死水沼', biome: 'mire', minHours: 8 }),
    br_mire_03: Object.freeze({ id: 'br_mire_03', name: '巨木浮桥与悬挂藤蔓梯', biome: 'mire', minHours: 8 }),
    br_mire_04: Object.freeze({ id: 'br_mire_04', name: '排污总渠与墓园偏道', biome: 'mire', minHours: 8 }),
    br_mire_05: Object.freeze({ id: 'br_mire_05', name: '孢子浓雾区与湿滑钟乳壁', biome: 'mire', minHours: 8 }),
    br_vault_01: Object.freeze({ id: 'br_vault_01', name: '壁画长廊与维修窄道', biome: 'vault', minHours: 8 }),
    br_vault_02: Object.freeze({ id: 'br_vault_02', name: '浑天仪厅与军械库偏厅', biome: 'vault', minHours: 8 }),
    br_vault_03: Object.freeze({ id: 'br_vault_03', name: '力场走廊与排水铅管管道', biome: 'vault', minHours: 8 }),
    br_vault_04: Object.freeze({ id: 'br_vault_04', name: '齿轮核心室与值班换防间', biome: 'vault', minHours: 8 }),
    br_vault_05: Object.freeze({ id: 'br_vault_05', name: '试炼中庭与侧翼藏书密室', biome: 'vault', minHours: 8 }),
    br_lair_01: Object.freeze({ id: 'br_lair_01', name: '兽骨主巢洞与狭窄岩隙', biome: 'lair', minHours: 8 }),
    br_lair_02: Object.freeze({ id: 'br_lair_02', name: '暗河河滩与峭壁攀爬架', biome: 'lair', minHours: 8 }),
    br_lair_03: Object.freeze({ id: 'br_lair_03', name: '哺育偏坑与巡逻兽道', biome: 'lair', minHours: 8 }),
    br_lair_04: Object.freeze({ id: 'br_lair_04', name: '弃物深坑与上风口裂隙', biome: 'lair', minHours: 8 }),
    br_lair_05: Object.freeze({ id: 'br_lair_05', name: '石林迷宫与巨型穴腔', biome: 'lair', minHours: 8 }),
    br_arcane_01: Object.freeze({ id: 'br_arcane_01', name: '浮空石阶直道与检修导槽', biome: 'arcane', minHours: 10 }),
    br_arcane_02: Object.freeze({ id: 'br_arcane_02', name: '魔力反应室与试作构装库', biome: 'arcane', minHours: 10 }),
    br_arcane_03: Object.freeze({ id: 'br_arcane_03', name: '镜像回廊与符文充能廊', biome: 'arcane', minHours: 10 }),
    br_arcane_04: Object.freeze({ id: 'br_arcane_04', name: '相位环带与外壁残阶', biome: 'arcane', minHours: 10 }),
    br_arcane_05: Object.freeze({ id: 'br_arcane_05', name: '研究卷轴室与防卫前厅', biome: 'arcane', minHours: 10 }),
    br_crypt_01: Object.freeze({ id: 'br_crypt_01', name: '殉葬主回廊与侍从墓室', biome: 'crypt', minHours: 8 }),
    br_crypt_02: Object.freeze({ id: 'br_crypt_02', name: '骨灰瓮陈列堂与守墓石室', biome: 'crypt', minHours: 8 }),
    br_crypt_03: Object.freeze({ id: 'br_crypt_03', name: '墓道干尸走廊与积水暗沟', biome: 'crypt', minHours: 8 }),
    br_crypt_04: Object.freeze({ id: 'br_crypt_04', name: '石棺阵列回廊与盗洞偏门', biome: 'crypt', minHours: 8 }),
    br_crypt_05: Object.freeze({ id: 'br_crypt_05', name: '哀悼圣堂大门与祭坛暗道', biome: 'crypt', minHours: 8 })
  })

  // 5. 战斗遭遇库 (100个单一交锋实体，严格声明 enemyTier 与 tactics)
  const combats = Object.freeze({
    // 一阶守卫 (30个)
    mob_t1_mine_spider: Object.freeze({ id: 'mob_t1_mine_spider', name: '洞穴灰盲蛛群', enemyTier: 1, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mine_rat: Object.freeze({ id: 'mob_t1_mine_rat', name: '剧毒食腐幼鼠群', enemyTier: 1, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mine_scorpion: Object.freeze({ id: 'mob_t1_mine_scorpion', name: '潜岩石蝎', enemyTier: 1, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: true } }),
    mob_t1_mine_snake: Object.freeze({ id: 'mob_t1_mine_snake', name: '地底洞穴盲蛇', enemyTier: 1, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mine_puppet: Object.freeze({ id: 'mob_t1_mine_puppet', name: '生锈矿工傀儡', enemyTier: 1, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t1_mine_mole: Object.freeze({ id: 'mob_t1_mine_mole', name: '狂暴地鼠', enemyTier: 1, biome: 'mine', damageType: 'slash', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mine_hare: Object.freeze({ id: 'mob_t1_mine_hare', name: '腐皮穴兔', enemyTier: 1, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mine_goblin: Object.freeze({ id: 'mob_t1_mine_goblin', name: '弱小地精斥候', enemyTier: 1, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: true } }),
    mob_t1_mire_slime: Object.freeze({ id: 'mob_t1_mire_slime', name: '腐泥软泥怪', enemyTier: 1, biome: 'mire', damageType: 'acid', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mire_leech: Object.freeze({ id: 'mob_t1_mire_leech', name: '吸血巨水蛭', enemyTier: 1, biome: 'mire', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mire_frog: Object.freeze({ id: 'mob_t1_mire_frog', name: '沼泽毒角蛙', enemyTier: 1, biome: 'mire', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mire_fungus: Object.freeze({ id: 'mob_t1_mire_fungus', name: '腐菌寄生体', enemyTier: 1, biome: 'mire', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mire_gnat: Object.freeze({ id: 'mob_t1_mire_gnat', name: '腐水黑蚊群', enemyTier: 1, biome: 'mire', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mire_turtle: Object.freeze({ id: 'mob_t1_mire_turtle', name: '烂木硬甲龟', enemyTier: 1, biome: 'mire', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t1_mire_fish: Object.freeze({ id: 'mob_t1_mire_fish', name: '浅滩盲鱼怪', enemyTier: 1, biome: 'mire', damageType: 'slash', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_mire_vulture: Object.freeze({ id: 'mob_t1_mire_vulture', name: '食腐秃鹫', enemyTier: 1, biome: 'mire', damageType: 'slash', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_vault_hound: Object.freeze({ id: 'mob_t1_vault_hound', name: '发条机械犬', enemyTier: 1, biome: 'vault', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_vault_dummy: Object.freeze({ id: 'mob_t1_vault_dummy', name: '飞刀守卫假人', enemyTier: 1, biome: 'vault', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_vault_skeleton: Object.freeze({ id: 'mob_t1_vault_skeleton', name: '轻装巡逻骷髅兵', enemyTier: 1, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t1_vault_mummy: Object.freeze({ id: 'mob_t1_vault_mummy', name: '游荡干尸', enemyTier: 1, biome: 'vault', damageType: 'blunt', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_vault_orb: Object.freeze({ id: 'mob_t1_vault_orb', name: '锈蚀警卫球', enemyTier: 1, biome: 'vault', damageType: 'blunt', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_vault_gargoyle: Object.freeze({ id: 'mob_t1_vault_gargoyle', name: '破损石像鬼残躯', enemyTier: 1, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t1_lair_boar: Object.freeze({ id: 'mob_t1_lair_boar', name: '凶齿野猪', enemyTier: 1, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t1_lair_wolf: Object.freeze({ id: 'mob_t1_lair_wolf', name: '饥饿荒原郊狼', enemyTier: 1, biome: 'lair', damageType: 'slash', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_lair_cat: Object.freeze({ id: 'mob_t1_lair_cat', name: '裂爪山猫', enemyTier: 1, biome: 'lair', damageType: 'slash', tactics: { reqFrontline: false, ambush: true } }),
    mob_t1_lair_sparrow: Object.freeze({ id: 'mob_t1_lair_sparrow', name: '铁喙巨雀', enemyTier: 1, biome: 'lair', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_lair_wasp: Object.freeze({ id: 'mob_t1_lair_wasp', name: '长尾毒蜂群', enemyTier: 1, biome: 'lair', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_lair_python: Object.freeze({ id: 'mob_t1_lair_python', name: '林地斑纹蟒', enemyTier: 1, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: false, ambush: true } }),
    mob_t1_lair_badger: Object.freeze({ id: 'mob_t1_lair_badger', name: '掘穴恶獾', enemyTier: 1, biome: 'lair', damageType: 'slash', tactics: { reqFrontline: false, ambush: false } }),
    mob_t1_lair_hyena: Object.freeze({ id: 'mob_t1_lair_hyena', name: '野地鬣狗', enemyTier: 1, biome: 'lair', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),

    // 二阶正规守卫 (40个)
    mob_t2_mine_golem: Object.freeze({ id: 'mob_t2_mine_golem', name: '重型破岩傀儡', enemyTier: 2, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mine_spider: Object.freeze({ id: 'mob_t2_mine_spider', name: '洞穴黑甲巨蛛', enemyTier: 2, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: true } }),
    mob_t2_mine_boar: Object.freeze({ id: 'mob_t2_mine_boar', name: '钢鬃巨角野猪', enemyTier: 2, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mine_lizard: Object.freeze({ id: 'mob_t2_mine_lizard', name: '暗影潜行岩蜥', enemyTier: 2, biome: 'mine', damageType: 'slash', tactics: { reqFrontline: false, ambush: true } }),
    mob_t2_mine_bomber: Object.freeze({ id: 'mob_t2_mine_bomber', name: '地精掷弹狂徒', enemyTier: 2, biome: 'mine', damageType: 'fire', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mine_worm: Object.freeze({ id: 'mob_t2_mine_worm', name: '食矿巨蚯蚓', enemyTier: 2, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mine_scorpion: Object.freeze({ id: 'mob_t2_mine_scorpion', name: '地脉结晶魔蝎', enemyTier: 2, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mine_troll: Object.freeze({ id: 'mob_t2_mine_troll', name: '穴居巨魔先锋', enemyTier: 2, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mine_bat: Object.freeze({ id: 'mob_t2_mine_bat', name: '变异双头巨蝠', enemyTier: 2, biome: 'mine', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mine_ghost: Object.freeze({ id: 'mob_t2_mine_ghost', name: '黑铁工兵游魂', enemyTier: 2, biome: 'mine', damageType: 'frost', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mire_snake: Object.freeze({ id: 'mob_t2_mire_snake', name: '剧毒斑纹水蟒', enemyTier: 2, biome: 'mire', damageType: 'poison', tactics: { reqFrontline: false, ambush: true } }),
    mob_t2_mire_croc: Object.freeze({ id: 'mob_t2_mire_croc', name: '腐水潜伏巨鳄', enemyTier: 2, biome: 'mire', damageType: 'slash', tactics: { reqFrontline: true, ambush: true } }),
    mob_t2_mire_ooze: Object.freeze({ id: 'mob_t2_mire_ooze', name: '酸液大型软泥怪', enemyTier: 2, biome: 'mire', damageType: 'acid', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mire_walker: Object.freeze({ id: 'mob_t2_mire_walker', name: '沼泽泥怪行者', enemyTier: 2, biome: 'mire', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mire_hound: Object.freeze({ id: 'mob_t2_mire_hound', name: '腐毒寄生狂犬', enemyTier: 2, biome: 'mire', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mire_crab: Object.freeze({ id: 'mob_t2_mire_crab', name: '水栖硬壳黑蟹', enemyTier: 2, biome: 'mire', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mire_mother: Object.freeze({ id: 'mob_t2_mire_mother', name: '喷毒水蛭母体', enemyTier: 2, biome: 'mire', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mire_siren: Object.freeze({ id: 'mob_t2_mire_siren', name: '迷幻水妖幽魂', enemyTier: 2, biome: 'mire', damageType: 'frost', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_mire_treant: Object.freeze({ id: 'mob_t2_mire_treant', name: '腐化林地树精', enemyTier: 2, biome: 'mire', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_mire_fishman: Object.freeze({ id: 'mob_t2_mire_fishman', name: '黑鳞剧毒鱼人', enemyTier: 2, biome: 'mire', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_vault_swordsman: Object.freeze({ id: 'mob_t2_vault_swordsman', name: '双手剑持刀傀儡', enemyTier: 2, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_vault_crossbow: Object.freeze({ id: 'mob_t2_vault_crossbow', name: '连弩机关射手', enemyTier: 2, biome: 'vault', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_vault_shieldman: Object.freeze({ id: 'mob_t2_vault_shieldman', name: '重盾装甲发条兵', enemyTier: 2, biome: 'vault', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_vault_statue: Object.freeze({ id: 'mob_t2_vault_statue', name: '雕像魔像守护者', enemyTier: 2, biome: 'vault', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_vault_inspector: Object.freeze({ id: 'mob_t2_vault_inspector', name: '警备督察傀儡', enemyTier: 2, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_vault_flyblade: Object.freeze({ id: 'mob_t2_vault_flyblade', name: '飞刃浮游巡逻机', enemyTier: 2, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_vault_crusher: Object.freeze({ id: 'mob_t2_vault_crusher', name: '石板压杀巨傀儡', enemyTier: 2, biome: 'vault', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_vault_executioner: Object.freeze({ id: 'mob_t2_vault_executioner', name: '持斧行刑魔像', enemyTier: 2, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_vault_cannon: Object.freeze({ id: 'mob_t2_vault_cannon', name: '符文巡逻自走炮', enemyTier: 2, biome: 'vault', damageType: 'fire', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_vault_knight: Object.freeze({ id: 'mob_t2_vault_knight', name: '重铠铁卫英灵', enemyTier: 2, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_lair_panther: Object.freeze({ id: 'mob_t2_lair_panther', name: '成年暗影黑豹', enemyTier: 2, biome: 'lair', damageType: 'slash', tactics: { reqFrontline: false, ambush: true } }),
    mob_t2_lair_bear: Object.freeze({ id: 'mob_t2_lair_bear', name: '双头狂暴鬃熊', enemyTier: 2, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_lair_tiger: Object.freeze({ id: 'mob_t2_lair_tiger', name: '裂骨剑齿虎', enemyTier: 2, biome: 'lair', damageType: 'slash', tactics: { reqFrontline: true, ambush: true } }),
    mob_t2_lair_thunderwolf: Object.freeze({ id: 'mob_t2_lair_thunderwolf', name: '迅捷雷狼', enemyTier: 2, biome: 'lair', damageType: 'lightning', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_lair_whitetiger: Object.freeze({ id: 'mob_t2_lair_whitetiger', name: '白额凶煞猛虎', enemyTier: 2, biome: 'lair', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_lair_wyvern_pup: Object.freeze({ id: 'mob_t2_lair_wyvern_pup', name: '剧毒飞龙幼兽', enemyTier: 2, biome: 'lair', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_lair_pangolin: Object.freeze({ id: 'mob_t2_lair_pangolin', name: '铁鳞穿山甲巨兽', enemyTier: 2, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t2_lair_clawbird: Object.freeze({ id: 'mob_t2_lair_clawbird', name: '恐鸟重爪兽', enemyTier: 2, biome: 'lair', damageType: 'pierce', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_lair_dove: Object.freeze({ id: 'mob_t2_lair_dove', name: '丛林剧毒斑鸠', enemyTier: 2, biome: 'lair', damageType: 'poison', tactics: { reqFrontline: false, ambush: false } }),
    mob_t2_lair_rockbear: Object.freeze({ id: 'mob_t2_lair_rockbear', name: '荒野巨岩巨熊', enemyTier: 2, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),

    // 三阶精锐守卫 (30个)
    mob_t3_arc_cruiser: Object.freeze({ id: 'mob_t3_arc_cruiser', name: '超载自律巡航机', enemyTier: 3, biome: 'arcane', damageType: 'lightning', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_arc_force: Object.freeze({ id: 'mob_t3_arc_force', name: '秘银力场构造体', enemyTier: 3, biome: 'arcane', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_arc_colossus: Object.freeze({ id: 'mob_t3_arc_colossus', name: '共鸣魔能巨像', enemyTier: 3, biome: 'arcane', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_arc_cutter: Object.freeze({ id: 'mob_t3_arc_cutter', name: '高频电弧切割傀儡', enemyTier: 3, biome: 'arcane', damageType: 'lightning', tactics: { reqFrontline: false, ambush: false } }),
    mob_t3_arc_poly: Object.freeze({ id: 'mob_t3_arc_poly', name: '元素聚合体', enemyTier: 3, biome: 'arcane', damageType: 'frost', tactics: { reqFrontline: false, ambush: false } }),
    mob_t3_arc_core_guard: Object.freeze({ id: 'mob_t3_arc_core_guard', name: '浮空核心哨戒长', enemyTier: 3, biome: 'arcane', damageType: 'lightning', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_arc_guard: Object.freeze({ id: 'mob_t3_arc_guard', name: '符文重装禁卫', enemyTier: 3, biome: 'arcane', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_arc_battery: Object.freeze({ id: 'mob_t3_arc_battery', name: '聚能晶石炮垒', enemyTier: 3, biome: 'arcane', damageType: 'fire', tactics: { reqFrontline: false, ambush: false } }),
    mob_t3_arc_phase: Object.freeze({ id: 'mob_t3_arc_phase', name: '空间相位潜伏机', enemyTier: 3, biome: 'arcane', damageType: 'pierce', tactics: { reqFrontline: false, ambush: true } }),
    mob_t3_arc_beast: Object.freeze({ id: 'mob_t3_arc_beast', name: '虚空震荡构造兽', enemyTier: 3, biome: 'arcane', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_crypt_knight: Object.freeze({ id: 'mob_t3_crypt_knight', name: '黑铠重装骸骨骑士', enemyTier: 3, biome: 'crypt', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_crypt_lich: Object.freeze({ id: 'mob_t3_crypt_lich', name: '死灵巫妖学徒', enemyTier: 3, biome: 'crypt', damageType: 'frost', tactics: { reqFrontline: false, ambush: false } }),
    mob_t3_crypt_banshee: Object.freeze({ id: 'mob_t3_crypt_banshee', name: '幽魂女妖哀嚎者', enemyTier: 3, biome: 'crypt', damageType: 'frost', tactics: { reqFrontline: false, ambush: false } }),
    mob_t3_crypt_abom: Object.freeze({ id: 'mob_t3_crypt_abom', name: '尸毒憎恶缝合怪', enemyTier: 3, biome: 'crypt', damageType: 'poison', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_crypt_guard: Object.freeze({ id: 'mob_t3_crypt_guard', name: '殉葬禁卫军长', enemyTier: 3, biome: 'crypt', damageType: 'pierce', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_crypt_hound: Object.freeze({ id: 'mob_t3_crypt_hound', name: '白骨三头巨犬', enemyTier: 3, biome: 'crypt', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_crypt_vampire: Object.freeze({ id: 'mob_t3_crypt_vampire', name: '吸血鬼血仆执事', enemyTier: 3, biome: 'crypt', damageType: 'pierce', tactics: { reqFrontline: false, ambush: true } }),
    mob_t3_crypt_ghoul: Object.freeze({ id: 'mob_t3_crypt_ghoul', name: '墓园食尸鬼首领', enemyTier: 3, biome: 'crypt', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_crypt_shade: Object.freeze({ id: 'mob_t3_crypt_shade', name: '阴影噬魂者', enemyTier: 3, biome: 'crypt', damageType: 'frost', tactics: { reqFrontline: false, ambush: true } }),
    mob_t3_crypt_paladin: Object.freeze({ id: 'mob_t3_crypt_paladin', name: '受缚死灵圣武士', enemyTier: 3, biome: 'crypt', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_spider: Object.freeze({ id: 'mob_t3_boss_spider', name: '深渊剧毒母蛛后', enemyTier: 3, biome: 'mine', damageType: 'poison', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_troll: Object.freeze({ id: 'mob_t3_boss_troll', name: '独眼巨魔战将', enemyTier: 3, biome: 'mine', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_hydra: Object.freeze({ id: 'mob_t3_boss_hydra', name: '远古九头蛇残种', enemyTier: 3, biome: 'mire', damageType: 'poison', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_lizard: Object.freeze({ id: 'mob_t3_boss_lizard', name: '地脉熔岩巨蜥', enemyTier: 3, biome: 'mine', damageType: 'fire', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_mammoth: Object.freeze({ id: 'mob_t3_boss_mammoth', name: '狂暴剑齿巨象', enemyTier: 3, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_wyvern: Object.freeze({ id: 'mob_t3_boss_wyvern', name: '双翼飞龙成年种', enemyTier: 3, biome: 'lair', damageType: 'fire', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_overseer: Object.freeze({ id: 'mob_t3_boss_overseer', name: '防御核心督军', enemyTier: 3, biome: 'vault', damageType: 'slash', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_lord: Object.freeze({ id: 'mob_t3_boss_lord', name: '黑铁重装领主', enemyTier: 3, biome: 'vault', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } }),
    mob_t3_boss_frostlord: Object.freeze({ id: 'mob_t3_boss_frostlord', name: '霜冻幽灵领主', enemyTier: 3, biome: 'crypt', damageType: 'frost', tactics: { reqFrontline: false, ambush: false } }),
    mob_t3_boss_bearking: Object.freeze({ id: 'mob_t3_boss_bearking', name: '暴怒魔熊王', enemyTier: 3, biome: 'lair', damageType: 'blunt', tactics: { reqFrontline: true, ambush: false } })
  })

  // 6. 核心密室与奖池配置 (30个，5:3:1 阶位分布)
  const sanctums = Object.freeze({
    // 二阶正规密室 (17个，产出 skill_scroll_t2)
    sanc_t2_01: Object.freeze({ id: 'sanc_t2_01', biome: 'crypt', name: '守灵偏厅·封印石棺', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 40, minHours: 12 }),
    sanc_t2_02: Object.freeze({ id: 'sanc_t2_02', biome: 'mine', name: '采矿督工精铁暗柜', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 25, goldMax: 45, minHours: 12 }),
    sanc_t2_03: Object.freeze({ id: 'sanc_t2_03', biome: 'universal', name: '古代药剂配制偏厅', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 50, minHours: 12 }),
    sanc_t2_04: Object.freeze({ id: 'sanc_t2_04', biome: 'universal', name: '地底走私商暗格', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 30, goldMax: 50, minHours: 12 }),
    sanc_t2_05: Object.freeze({ id: 'sanc_t2_05', biome: 'universal', name: '坍塌祭坛石台暗龛', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 40, minHours: 12 }),
    sanc_t2_06: Object.freeze({ id: 'sanc_t2_06', biome: 'vault', name: '守备队长军资铁箱', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 30, goldMax: 55, minHours: 12 }),
    sanc_t2_07: Object.freeze({ id: 'sanc_t2_07', biome: 'mine', name: '熔岩缝结晶储藏柜', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 25, goldMax: 45, minHours: 12 }),
    sanc_t2_08: Object.freeze({ id: 'sanc_t2_08', biome: 'mire', name: '沼泽沉船防腐货箱', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 50, minHours: 12 }),
    sanc_t2_09: Object.freeze({ id: 'sanc_t2_09', biome: 'vault', name: '古地宫齿轮密藏阁', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 35, goldMax: 55, minHours: 12 }),
    sanc_t2_10: Object.freeze({ id: 'sanc_t2_10', biome: 'lair', name: '魔兽遗骸头骨暗槽', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 40, minHours: 12 }),
    sanc_t2_11: Object.freeze({ id: 'sanc_t2_11', biome: 'universal', name: '前哨信使殉职石台', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 25, goldMax: 45, minHours: 12 }),
    sanc_t2_12: Object.freeze({ id: 'sanc_t2_12', biome: 'vault', name: '古骑士佩剑陈列石桌', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 30, goldMax: 50, minHours: 12 }),
    sanc_t2_13: Object.freeze({ id: 'sanc_t2_13', biome: 'mire', name: '深水涵洞密封铅盒', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 45, minHours: 12 }),
    sanc_t2_14: Object.freeze({ id: 'sanc_t2_14', biome: 'vault', name: '迷宫暗门秘银小柜', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 35, goldMax: 55, minHours: 12 }),
    sanc_t2_15: Object.freeze({ id: 'sanc_t2_15', biome: 'universal', name: '风化祭祀供奉石盆', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 20, goldMax: 40, minHours: 12 }),
    sanc_t2_16: Object.freeze({ id: 'sanc_t2_16', biome: 'mine', name: '工兵爆破储藏暗室', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 25, goldMax: 50, minHours: 12 }),
    sanc_t2_17: Object.freeze({ id: 'sanc_t2_17', biome: 'universal', name: '流亡学者遗留书箱', tier: 2, scrollId: 'skill_scroll_t2', goldMin: 30, goldMax: 55, minHours: 12 }),

    // 三阶精锐宝库 (10个，产出 skill_scroll_t3)
    sanc_t3_01: Object.freeze({ id: 'sanc_t3_01', biome: 'arcane', name: '魔导动力核心舱', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 60, goldMax: 100, minHours: 14 }),
    sanc_t3_02: Object.freeze({ id: 'sanc_t3_02', biome: 'crypt', name: '沉沦灵堂大祭坛', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 70, goldMax: 110, minHours: 14 }),
    sanc_t3_03: Object.freeze({ id: 'sanc_t3_03', biome: 'crypt', name: '龙裔侍从石棺殿', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 80, goldMax: 120, minHours: 14 }),
    sanc_t3_04: Object.freeze({ id: 'sanc_t3_04', biome: 'universal', name: '禁忌圣水贮藏池', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 60, goldMax: 90, minHours: 14 }),
    sanc_t3_05: Object.freeze({ id: 'sanc_t3_05', biome: 'arcane', name: '晶石共鸣控制台', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 75, goldMax: 115, minHours: 14 }),
    sanc_t3_06: Object.freeze({ id: 'sanc_t3_06', biome: 'universal', name: '深层领主藏宝暗厅', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 80, goldMax: 120, minHours: 14 }),
    sanc_t3_07: Object.freeze({ id: 'sanc_t3_07', biome: 'crypt', name: '受诅主教白银灵柩', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 70, goldMax: 110, minHours: 14 }),
    sanc_t3_08: Object.freeze({ id: 'sanc_t3_08', biome: 'universal', name: '远古龙骨封印基座', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 85, goldMax: 125, minHours: 14 }),
    sanc_t3_09: Object.freeze({ id: 'sanc_t3_09', biome: 'arcane', name: '相位重叠秘宝舱', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 90, goldMax: 130, minHours: 14 }),
    sanc_t3_10: Object.freeze({ id: 'sanc_t3_10', biome: 'universal', name: '古代试炼宗师石台', tier: 3, scrollId: 'skill_scroll_t3', goldMin: 80, goldMax: 120, minHours: 14 }),

    // 四阶宗师秘殿 (3个，产出 skill_scroll_t4)
    sanc_t4_01: Object.freeze({ id: 'sanc_t4_01', biome: 'mine', name: '龙语泰坦熔炉王座', tier: 4, scrollId: 'skill_scroll_t4', goldMin: 250, goldMax: 350, minHours: 16 }),
    sanc_t4_02: Object.freeze({ id: 'sanc_t4_02', biome: 'crypt', name: '陨落龙骑士地下灵宫', tier: 4, scrollId: 'skill_scroll_t4', goldMin: 280, goldMax: 380, minHours: 16 }),
    sanc_t4_03: Object.freeze({ id: 'sanc_t4_03', biome: 'universal', name: '古代皇家星穹秘宝库', tier: 4, scrollId: 'skill_scroll_t4', goldMin: 300, goldMax: 400, minHours: 16 })
  })

  // 7. 三大固定核心遗迹完整拓扑定义
  const coreRuins = Object.freeze({
    // 第一座：II 阶正规 · 龙喉石殿
    core_ruin_dragon_chasm: Object.freeze({
      id: 'core_ruin_dragon_chasm',
      name: '龙喉裂谷·先遣石殿',
      tier: 2,
      partyLimit: 3,
      escort: 'gulan',
      minDurationHours: 48,
      merit: 20,
      gold: 60,
      scrollId: 'skill_scroll_t2',
      resonance: Object.freeze({ target: 'gulan', bloodDelta: 5 }),
      blocks: Object.freeze([
        Object.freeze({ type: 'entrance', id: 'ent_chasm_descent', name: '龙喉断崖垂降点', minHours: 8 }),
        Object.freeze({ type: 'obstacle', id: 'obs_chasm_acid_gate', name: '龙涎酸蚀生铁闸', minHours: 10, reqAbility: '开锁', reqDc: 2 }),
        Object.freeze({ type: 'combat', id: 'mob_chasm_flame_lizards', name: '前庭熔火岩蜥群', minHours: 10, enemyTier: 2, tactics: { reqFrontline: true } }),
        Object.freeze({ type: 'branch', id: 'br_chasm_junction', name: '前庭分流岔道', minHours: 8 }),
        Object.freeze({ type: 'sanctum', id: 'sanc_chasm_knight_tomb', name: '先遣团长英灵石棺殿', minHours: 12, tier: 2 })
      ])
    }),
    // 第二座：III 阶精锐 · 寒霜地宫
    core_ruin_frost_crypt: Object.freeze({
      id: 'core_ruin_frost_crypt',
      name: '寒霜墓道·殉道圣武士地宫',
      tier: 3,
      partyLimit: 4,
      escort: null,
      minDurationHours: 54,
      merit: 35,
      gold: 130,
      scrollId: 'skill_scroll_t3',
      blocks: Object.freeze([
        Object.freeze({ type: 'entrance', id: 'ent_crypt_descent_stair', name: '积霜断裂石阶', minHours: 10 }),
        Object.freeze({ type: 'obstacle', id: 'obs_crypt_frost_tomb_corridor', name: '阴寒死气石棺廊', minHours: 12, reqAbility: '拆陷', reqDc: 3 }),
        Object.freeze({ type: 'combat', id: 'mob_crypt_black_oath_guards', name: '受诅圣殿重装骸骨阵列', minHours: 10, enemyTier: 3, tactics: { reqFrontline: true } }),
        Object.freeze({ type: 'branch', id: 'br_crypt_path_divergence', name: '灵堂分流甬道', minHours: 8 }),
        Object.freeze({ type: 'sanctum', id: 'sanc_crypt_grand_paladin', name: '殉道大主教圣骸主殿', minHours: 14, tier: 3 })
      ])
    }),
    // 第三座：IV 阶宗师 · 倒悬魔导塔
    core_ruin_arcane_tower: Object.freeze({
      id: 'core_ruin_arcane_tower',
      name: '倒悬魔导塔·星穹构装中枢',
      tier: 4,
      partyLimit: 4,
      escort: null,
      minDurationHours: 60,
      merit: 35,
      gold: 300,
      scrollId: 'skill_scroll_t4',
      blocks: Object.freeze([
        Object.freeze({ type: 'entrance', id: 'ent_tower_inversion_bridge', name: '倒悬重力梯与悬空浮石廊', minHours: 10 }),
        Object.freeze({ type: 'obstacle', id: 'obs_tower_arc_grid_corridor', name: '超载谐振电弧网格廊', minHours: 12, reqAbility: '拆陷', reqDc: 4 }),
        Object.freeze({ type: 'combat', id: 'mob_tower_sentinel_golem', name: '超导自律巡航禁卫巨像', minHours: 12, enemyTier: 4, tactics: { reqFrontline: true } }),
        Object.freeze({ type: 'branch', id: 'br_tower_axis_divergence', name: '中枢导能竖井分流口', minHours: 10 }),
        Object.freeze({ type: 'sanctum', id: 'sanc_tower_archmage_sanctum', name: '星穹静滞中枢·大魔导御座', minHours: 16, tier: 4 })
      ])
    })
  })

  const biomeKeys = {
    biome_narrow_mine: 'mine', biome_toxic_mire: 'mire', biome_trap_vault: 'vault',
    biome_living_lair: 'lair', biome_arcane_grid: 'arcane', biome_undead_crypt: 'crypt'
  }

  const pick = (list, rng) => list[Math.floor(rng() * list.length)]

  function assemble({ coreId, tier = 2, biome, partyLimit, rng = Math.random, key = 'preview' } = {}) {
    if (coreId) {
      u.check(u.own(coreRuins, coreId), '未知核心遗迹')
      const core = coreRuins[coreId]
      return { ...core, instanceId: key, atmosphere: core.name, blocks: core.blocks.map(block => ({ ...block })) }
    }
    u.check([2, 3, 4].includes(tier), '遗迹阶位须为 II 至 IV')
    const available = Object.values(biomes).filter(item => item.minTier <= tier)
    const habitat = available.find(item => item.id === biome) || pick(available, rng)
    const habitatKey = biomeKeys[habitat.id]
    const matches = item => item.biome === habitatKey || item.biome === 'universal'
    partyLimit ??= 2 + Math.floor(rng() * 3)
    u.check([2, 3, 4].includes(partyLimit), '遗迹人数须为 2 至 4')
    const blockCount = (tier === 2 ? 4 : 5) + Math.floor(rng() * 2)
    const minDurationHours = { 4: 36, 5: 48, 6: 64 }[blockCount]
    const entrance = pick(Object.values(entrances).filter(matches), rng)
    const hazards = Object.values(obstacles).filter(item => item.tier <= tier && matches(item))
    const obstacle = pick(hazards, rng)
    const guard = pick(Object.values(combats).filter(item => item.enemyTier === Math.min(tier, 3) && matches(item)), rng)
    const branch = pick(Object.values(branches).filter(matches), rng)
    const sanctum = pick(Object.values(sanctums).filter(item => item.tier === tier && matches(item)), rng)
    const blocks = [
      { ...entrance, type: 'entrance' },
      { ...obstacle, type: 'obstacle' },
      { ...guard, type: 'combat', minHours: 10, enemyTier: tier, name: tier === 4 ? guard.name + '·宗师级' : guard.name }
    ]
    if (blockCount >= 5) blocks.push({ ...branch, type: 'branch' })
    if (blockCount >= 6) blocks.push({ ...pick(hazards.filter(item => item.id !== obstacle.id), rng), type: 'obstacle' })
    const hours = blocks.reduce((sum, block) => sum + block.minHours, 0)
    blocks.push({ ...sanctum, type: 'sanctum', minHours: Math.max(sanctum.minHours, minDurationHours - hours) })
    return {
      instanceId: key, name: habitat.name, tier, biome: habitat.id, partyLimit,
      atmosphere: habitat.atmosphere, minDurationHours, blocks,
      merit: tier === 2 ? 15 : 10,
      gold: sanctum.goldMin + Math.floor(rng() * (sanctum.goldMax - sanctum.goldMin + 1)),
      scrollId: sanctum.scrollId
    }
  }

  function enter(world, instance, partyMembers = []) {
    const rs = world.ruinState ||= { current: null, clearedCores: [] }
    u.check(!rs.current, '已在遗迹中')
    u.check(instance.blocks?.length && !rs.clearedCores.includes(instance.id), '遗迹无效或已首通')
    u.check(partyMembers.length < instance.partyLimit && new Set(partyMembers).size === partyMembers.length, '随行名单重复或超过名额')
    u.check(partyMembers.every(id => id !== instance.escort), '古兰作为领路人随行，无需占用名额')
    rs.current = { ...instance, partyMembers: [...partyMembers], currentBlockIndex: 0, elapsedHours: 0 }
  }

  function advance(world, verdict) {
    const cur = world.ruinState?.current
    u.check(cur && !cur.cleared, '当前没有可推进的遗迹')
    u.check(verdict && Number.isSafeInteger(verdict.hours) && verdict.hours > 0 &&
      typeof verdict.passed === 'boolean', '须由后台判定房间结果')
    cur.elapsedHours += verdict.hours
    if (verdict.passed) cur.currentBlockIndex++
    cur.cleared = cur.currentBlockIndex === cur.blocks.length
    return cur.cleared
  }

  function finish(world) {
    const cur = world.ruinState?.current
    u.check(cur?.cleared, '未完成遗迹')
    if (cur.id) world.ruinState.clearedCores.push(cur.id)
    world.ruinState.current = null
  }

  function retreat(world) {
    u.check(world.ruinState?.current, '当前不在遗迹中')
    world.ruinState.current = null
  }

  function getStatus(world) {
    const rs = world?.ruinState
    if (!rs || !rs.current) return { inRuin: false }
    const cur = rs.current
    const block = cur.blocks?.[cur.currentBlockIndex] || null
    return {
      inRuin: true,
      instanceId: cur.instanceId,
      name: cur.name,
      tier: cur.tier,
      biome: cur.biome,
      atmosphere: cur.atmosphere,
      currentBlock: block,
      currentBlockIndex: cur.currentBlockIndex,
      totalBlocks: cur.blocks ? cur.blocks.length : 0,
      elapsedHours: cur.elapsedHours || 0,
      cleared: cur.cleared || false
    }
  }

  function migrate(world) {
    if (!world) return world
    const rs = world.ruinState ||= {}
    if (!u.own(rs, 'current')) rs.current = null
    if (!Array.isArray(rs.clearedCores)) rs.clearedCores = []
    return world
  }

  root.OKH_APP_RUINS = Object.freeze({
    catalog: Object.freeze({
      biomes,
      entrances,
      obstacles,
      branches,
      combats,
      sanctums,
      coreRuins
    }),
    assemble,
    enter,
    advance,
    retreat,
    finish,
    getStatus,
    migrate
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_RUINS
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
