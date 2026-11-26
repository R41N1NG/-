/**
 * @module      okh_app_skills
 * @updated     2026-11-26 14:30
 * @status      active
 * @reason      技能系统解耦实现，提供 58 项全量技能白名单、已学与 6 格装配栏管理及能力比对
 * @deps        ['utils']
 * @provides    { catalog, CLASSES, ABILITIES, equip, unequip, learn, getLearned, getEquipped, migrate, checkAbility }
 */
(function (root) {
  'use strict'

  const u = root.OKHBackgroundModules.utils

  // 17 个职业 Tag 通俗正名表
  const CLASSES = Object.freeze({
    class_shield_guard: Object.freeze({ id: 'class_shield_guard', name: '盾卫', branch: 'warrior', stat: '力' }),
    class_heavy_vanguard: Object.freeze({ id: 'class_heavy_vanguard', name: '重剑士', branch: 'warrior', stat: '力' }),
    class_duelist: Object.freeze({ id: 'class_duelist', name: '轻剑士', branch: 'warrior', stat: '敏' }),
    class_berserker: Object.freeze({ id: 'class_berserker', name: '狂战士', branch: 'warrior', stat: '力' }),
    class_devotion_paladin: Object.freeze({ id: 'class_devotion_paladin', name: '圣骑士', branch: 'paladin', stat: '力' }),
    class_scout_stealth: Object.freeze({ id: 'class_scout_stealth', name: '斥候', branch: 'ranger', stat: '敏' }),
    class_sniper_archer: Object.freeze({ id: 'class_sniper_archer', name: '弓箭手', branch: 'ranger', stat: '敏' }),
    class_trap_breaker: Object.freeze({ id: 'class_trap_breaker', name: '盗贼', branch: 'rogue', stat: '敏' }),
    class_assassin: Object.freeze({ id: 'class_assassin', name: '刺客', branch: 'rogue', stat: '敏' }),
    class_arcane_blast: Object.freeze({ id: 'class_arcane_blast', name: '元素法师', branch: 'mage', stat: '智' }),
    class_rune_decode: Object.freeze({ id: 'class_rune_decode', name: '符文师', branch: 'mage', stat: '智' }),
    class_arcane_ward: Object.freeze({ id: 'class_arcane_ward', name: '结界师', branch: 'mage', stat: '智' }),
    class_necromancer: Object.freeze({ id: 'class_necromancer', name: '死灵法师', branch: 'mage', stat: '智' }),
    class_holy_heal: Object.freeze({ id: 'class_holy_heal', name: '治疗牧师', branch: 'priest', stat: '信' }),
    class_purify_ward: Object.freeze({ id: 'class_purify_ward', name: '驱魔牧师', branch: 'priest', stat: '信' }),
    class_elixir_alchemist: Object.freeze({ id: 'class_elixir_alchemist', name: '药剂师', branch: 'alchemy', stat: '智' }),
    class_bombardier: Object.freeze({ id: 'class_bombardier', name: '炼金术士', branch: 'alchemy', stat: '智' })
  })

  // 7 大基础能力项
  const ABILITIES = Object.freeze(['开锁', '拆陷', '辨识', '潜行', '侦查', '治疗', '破障'])

  // 58 项全量注册技能词表
  const catalog = Object.freeze({
    // 4.1 通用冒险技 (7个，全职业可学，基础阶位 1)
    skill_basic_lockpick: Object.freeze({ id: 'skill_basic_lockpick', name: '撬锁', tier: 1, ability: '开锁', abilityValue: 1, desc: '使用基础工具开启 I 阶常规门锁与箱笼。' }),
    skill_basic_disarm: Object.freeze({ id: 'skill_basic_disarm', name: '拆陷阱', tier: 1, ability: '拆陷', abilityValue: 1, desc: '拆除 I 阶常规绊索与基础暗箭机关。' }),
    skill_basic_identify: Object.freeze({ id: 'skill_basic_identify', name: '认魔纹', tier: 1, ability: '辨识', abilityValue: 1, desc: '辨识基础魔法铭文与 I 阶封印。' }),
    skill_basic_stealth: Object.freeze({ id: 'skill_basic_stealth', name: '潜行', tier: 1, ability: '潜行', abilityValue: 1, desc: '放轻脚步隐蔽接近，躲避常规视线。' }),
    skill_basic_scout: Object.freeze({ id: 'skill_basic_scout', name: '侦查', tier: 1, ability: '侦查', abilityValue: 1, desc: '察觉浅层暗门、伏击征兆与足迹。' }),
    skill_first_aid: Object.freeze({ id: 'skill_first_aid', name: '包扎', tier: 1, ability: '治疗', abilityValue: 1, desc: '战场止血、轻伤处理与基础清创。' }),
    skill_basic_breach: Object.freeze({ id: 'skill_basic_breach', name: '撞门', tier: 1, ability: '破障', abilityValue: 1, desc: '强行撞开常规木门或撬动 I 阶卡死石闸。' }),

    // 4.2 战士系 (14个)
    skill_warrior_breach: Object.freeze({ id: 'skill_warrior_breach', name: '破门', tier: 2, branch: 'warrior', ability: '破障', abilityDynamic: true, desc: '撞门、砸锁、劈开木栅石门等障碍物。' }),
    skill_warrior_guard: Object.freeze({ id: 'skill_warrior_guard', name: '护卫', tier: 2, branch: 'warrior', tag: '前排护卫稳固', desc: '站住前排保住后排法师和牧师不被贴身打断。' }),
    skill_shield_wall: Object.freeze({ id: 'skill_shield_wall', name: '举盾死守', tier: 2, reqClass: 'class_shield_guard', tag: '前排护卫稳固', desc: '正面架盾硬顶箭矢与冲锋，给队友撑开掩体。' }),
    skill_shield_bash: Object.freeze({ id: 'skill_shield_bash', name: '盾击', tier: 2, reqClass: 'class_shield_guard', desc: '近身用盾面撞开贴脸的敌人，打断对方缠斗或施法。' }),
    skill_shield_intervene: Object.freeze({ id: 'skill_shield_intervene', name: '替身挡刀', tier: 3, reqClass: 'class_shield_guard', desc: '队友险些吃重击时跨步抢上去用盾硬接。' }),
    skill_heavy_cleave: Object.freeze({ id: 'skill_heavy_cleave', name: '重劈', tier: 2, reqClass: 'class_heavy_vanguard', ability: '破障', abilityDynamic: true, desc: '专劈重甲、木盾和石像外壳。' }),
    skill_heavy_sweep: Object.freeze({ id: 'skill_heavy_sweep', name: '横扫', tier: 2, reqClass: 'class_heavy_vanguard', desc: '双手抡剑大范围横挥，逼退围上来的多个敌人。' }),
    skill_heavy_press: Object.freeze({ id: 'skill_heavy_press', name: '力压', tier: 3, reqClass: 'class_heavy_vanguard', desc: '靠兵器分量死压对手兵刃，正面角力占优。' }),
    skill_duelist_parry: Object.freeze({ id: 'skill_duelist_parry', name: '卸力拨剑', tier: 2, reqClass: 'class_duelist', desc: '侧身用剑脊带偏对方力道并顺势反刺。' }),
    skill_duelist_pierce: Object.freeze({ id: 'skill_duelist_pierce', name: '刺破绽', tier: 2, reqClass: 'class_duelist', desc: '专挑重甲关节缝隙或施法者咽喉突刺。' }),
    skill_duelist_flurry: Object.freeze({ id: 'skill_duelist_flurry', name: '连刺', tier: 3, reqClass: 'class_duelist', desc: '短时间连续出剑封锁退路，抢占先手节奏。' }),
    skill_berserk_rage: Object.freeze({ id: 'skill_berserk_rage', name: '狂化', tier: 2, reqClass: 'class_berserker', desc: '在均势或差一阶劣势险战中强行搏命破局。' }),
    skill_berserk_reckless: Object.freeze({ id: 'skill_berserk_reckless', name: '搏命换伤', tier: 2, reqClass: 'class_berserker', desc: '放弃防守硬吃轻伤抢攻，在正面死局撕开缺口。' }),
    skill_berserk_frenzy: Object.freeze({ id: 'skill_berserk_frenzy', name: '血战到底', tier: 3, reqClass: 'class_berserker', desc: '挂伤后战意不降反升，围攻中强行挥砍突围。' }),

    // 4.3 圣骑系 (3个)
    skill_paladin_aegis: Object.freeze({ id: 'skill_paladin_aegis', name: '圣光护佑', tier: 2, reqClass: 'class_devotion_paladin', tag: '前排护卫稳固', desc: '重甲举盾守住前排，面对死灵时稳住心神。' }),
    skill_paladin_lay_hands: Object.freeze({ id: 'skill_paladin_lay_hands', name: '圣手疗伤', tier: 2, reqClass: 'class_devotion_paladin', ability: '治疗', abilityDynamic: true, desc: '战后贴近伤口止血闭合。' }),
    skill_paladin_smite: Object.freeze({ id: 'skill_paladin_smite', name: '破邪斩', tier: 3, reqClass: 'class_devotion_paladin', desc: '圣光灌注兵刃，对死灵与邪祟格外凌厉。' }),

    // 4.4 游侠系 (6个)
    skill_ranger_track: Object.freeze({ id: 'skill_ranger_track', name: '追踪探路', tier: 2, branch: 'ranger', ability: '侦查', abilityDynamic: true, desc: '察觉暗门、脚印与伏击征兆。' }),
    skill_ranger_evade: Object.freeze({ id: 'skill_ranger_evade', name: '林地周旋', tier: 2, branch: 'ranger', desc: '善用地形与掩体拉开距离，避免被正面缠死。' }),
    skill_scout_stealth: Object.freeze({ id: 'skill_scout_stealth', name: '潜行', tier: 2, reqClass: 'class_scout_stealth', ability: '潜行', abilityDynamic: true, desc: '无声贴近阴影或绕过守卫。' }),
    skill_scout_ambush: Object.freeze({ id: 'skill_scout_ambush', name: '摸哨偷袭', tier: 2, reqClass: 'class_scout_stealth', desc: '暗处暴起先手解决孤立哨兵或扰乱敌后排。' }),
    skill_archer_snipe: Object.freeze({ id: 'skill_archer_snipe', name: '点射', tier: 2, reqClass: 'class_sniper_archer', desc: '远程瞄准高威胁目标，压制敌方吟唱。' }),
    skill_archer_volley: Object.freeze({ id: 'skill_archer_volley', name: '连射', tier: 3, reqClass: 'class_sniper_archer', desc: '快速连续放箭封锁通道，迟滞敌群冲锋。' }),

    // 4.5 盗贼系 (6个)
    skill_rogue_powder: Object.freeze({ id: 'skill_rogue_powder', name: '撒粉迷眼', tier: 2, branch: 'rogue', desc: '遇险抛洒粉尘制造错身脱困空档。' }),
    skill_rogue_search: Object.freeze({ id: 'skill_rogue_search', name: '摸暗格', tier: 2, branch: 'rogue', ability: '侦查', abilityDynamic: true, desc: '在墙砖与箱柜里摸索暗格与机关机括。' }),
    skill_thief_lock: Object.freeze({ id: 'skill_thief_lock', name: '开锁', tier: 2, reqClass: 'class_trap_breaker', ability: '开锁', abilityDynamic: true, desc: '专精各类门锁、保险箱与密室暗锁。' }),
    skill_thief_disarm: Object.freeze({ id: 'skill_thief_disarm', name: '拆陷阱', tier: 2, reqClass: 'class_trap_breaker', ability: '拆陷', abilityDynamic: true, desc: '拆除绊索、毒针、落石等复合机关。' }),
    skill_assassin_backstab: Object.freeze({ id: 'skill_assassin_backstab', name: '背刺', tier: 2, reqClass: 'class_assassin', ability: '潜行', abilityDynamic: true, desc: '绕到盲区以短刃直刺要害。' }),
    skill_assassin_venom: Object.freeze({ id: 'skill_assassin_venom', name: '涂毒', tier: 2, reqClass: 'class_assassin', desc: '兵刃涂抹麻痹或出血毒膏削弱对手。' }),

    // 4.6 法师系 (10个)
    skill_mage_identify: Object.freeze({ id: 'skill_mage_identify', name: '魔纹辨识', tier: 2, branch: 'mage', ability: '辨识', abilityDynamic: true, desc: '识破与解离魔法阵、封印与古物铭文。' }),
    skill_mage_missile: Object.freeze({ id: 'skill_mage_missile', name: '奥术飞弹', tier: 2, branch: 'mage', desc: '成型单体法术打击，安全距离稳定输出。' }),
    skill_elem_fireball: Object.freeze({ id: 'skill_elem_fireball', name: '火球术', tier: 2, reqClass: 'class_arcane_blast', desc: '释放爆裂火球，大范围焚烧敌群与软体魔物。' }),
    skill_elem_frostnova: Object.freeze({ id: 'skill_elem_frostnova', name: '冰霜新星', tier: 3, reqClass: 'class_arcane_blast', desc: '瞬发寒气冻结地面与敌群，拉开安全距离。' }),
    skill_rune_dispel: Object.freeze({ id: 'skill_rune_dispel', name: '解离法阵', tier: 2, reqClass: 'class_rune_decode', ability: '辨识', abilityDynamic: true, desc: '专门拆解遗迹复合魔法封印与阵眼。' }),
    skill_rune_ray: Object.freeze({ id: 'skill_rune_ray', name: '破魔射线', tier: 3, reqClass: 'class_rune_decode', desc: '击碎敌方魔导护盾或干扰敌方施法者。' }),
    skill_ward_shield: Object.freeze({ id: 'skill_ward_shield', name: '力场盾', tier: 2, reqClass: 'class_arcane_ward', desc: '展开贴身魔力护盾，挡下箭矢与单体法术。' }),
    skill_ward_barrier: Object.freeze({ id: 'skill_ward_barrier', name: '守护结界', tier: 3, reqClass: 'class_arcane_ward', desc: '张开半圆防护屏障，抵挡远程齐射与范围法术。' }),
    skill_necro_skeleton: Object.freeze({ id: 'skill_necro_skeleton', name: '唤起骷髅', tier: 2, reqClass: 'class_necromancer', desc: '驱使低阶骷髅充当前排炮灰争取施法空间。' }),
    skill_necro_curse: Object.freeze({ id: 'skill_necro_curse', name: '衰弱诅咒', tier: 3, reqClass: 'class_necromancer', desc: '对强敌降下诅咒，令其气力衰退动作迟缓。' }),

    // 4.7 牧师系 (6个)
    skill_priest_calm: Object.freeze({ id: 'skill_priest_calm', name: '安神祷言', tier: 2, branch: 'priest', desc: '安抚惊恐情绪，稳定心智抵抗精神侵蚀。' }),
    skill_priest_light: Object.freeze({ id: 'skill_priest_light', name: '圣光术', tier: 2, branch: 'priest', desc: '引动神术照明或震退贴近的低阶死灵。' }),
    skill_heal_holy: Object.freeze({ id: 'skill_heal_holy', name: '神圣治疗', tier: 2, reqClass: 'class_holy_heal', ability: '治疗', abilityDynamic: true, desc: '闭合创伤、抢救濒死重伤。' }),
    skill_heal_group: Object.freeze({ id: 'skill_heal_group', name: '群体庇佑', tier: 3, reqClass: 'class_holy_heal', desc: '范围圣光同时照料多名伤员维持续航。' }),
    skill_purify_cleanse: Object.freeze({ id: 'skill_purify_cleanse', name: '驱散净化', tier: 2, reqClass: 'class_purify_ward', ability: '治疗', abilityDynamic: true, desc: '驱除瘴气、剧毒与古代诅咒。' }),
    skill_purify_word: Object.freeze({ id: 'skill_purify_word', name: '破邪圣言', tier: 3, reqClass: 'class_purify_ward', desc: '高声吟诵神圣真言克制与灼伤死灵及邪祟。' }),

    // 4.8 炼金系 (6个)
    skill_alch_brew: Object.freeze({ id: 'skill_alch_brew', name: '调配药剂', tier: 2, branch: 'alchemy', ability: '治疗', abilityDynamic: true, desc: '现场调配止血膏与通用解毒剂。' }),
    skill_alch_acid: Object.freeze({ id: 'skill_alch_acid', name: '投掷酸液瓶', tier: 2, branch: 'alchemy', desc: '甩出腐蚀酸液瓶克制软体魔物与铁锁链。' }),
    skill_elixir_firstaid: Object.freeze({ id: 'skill_elixir_firstaid', name: '救急秘药', tier: 2, reqClass: 'class_elixir_alchemist', desc: '浓缩药剂快速止血解毒稳住伤势。' }),
    skill_elixir_poison: Object.freeze({ id: 'skill_elixir_poison', name: '淬毒涂抹', tier: 3, reqClass: 'class_elixir_alchemist', desc: '调配毒药涂抹兵刃箭矢增强压制。' }),
    skill_bomb_keg: Object.freeze({ id: 'skill_bomb_keg', name: '火药炸罐', tier: 2, reqClass: 'class_bombardier', ability: '破障', abilityDynamic: true, desc: '用火药罐炸穿石门、木栅与掩体。' }),
    skill_bomb_molotov: Object.freeze({ id: 'skill_bomb_molotov', name: '燃烧瓶', tier: 2, reqClass: 'class_bombardier', desc: '投掷炼金火油封锁通道并灼烧强敌。' })
  })

  const MAX_EQUIPPED = 6

  function learn(world, skillId) {
    u.check(u.own(catalog, skillId), '学习技能 ID 未在词表注册：' + skillId)
    const ps = world.playerState ||= {}
    const learned = new Set(Array.isArray(ps.learnedSkills) ? ps.learnedSkills : [])
    learned.add(skillId)
    ps.learnedSkills = [...learned]
    return true
  }

  function equip(world, skillId, slotIndex = -1) {
    u.check(u.own(catalog, skillId), '装配技能 ID 未在词表注册：' + skillId)
    const ps = world.playerState ||= {}
    const learned = Array.isArray(ps.learnedSkills) ? ps.learnedSkills : []
    u.check(learned.includes(skillId), '未学会该技能，无法装配：' + skillId)

    const skill = catalog[skillId]
    const pTier = Number.isInteger(ps.tier) ? ps.tier : 2
    u.check(pTier >= skill.tier, `阶位不足（当前 ${pTier} 阶，技能需求 ${skill.tier} 阶）`)

    if (skill.reqClass) {
      u.check(ps.currentClass === skill.reqClass, `主职不匹配（需 ${skill.reqClass}）`)
    }

    const equipped = [...(Array.isArray(ps.equippedSkills) ? ps.equippedSkills : [])]
    if (equipped.includes(skillId)) return true // 已装配直接幂等

    if (slotIndex >= 0 && slotIndex < equipped.length) {
      equipped[slotIndex] = skillId
    } else {
      u.check(equipped.length < MAX_EQUIPPED, `装配栏已满（上限 ${MAX_EQUIPPED} 格）`)
      equipped.push(skillId)
    }

    ps.equippedSkills = equipped
    return true
  }

  function unequip(world, skillId) {
    const ps = world.playerState ||= {}
    const equipped = Array.isArray(ps.equippedSkills) ? ps.equippedSkills : []
    ps.equippedSkills = equipped.filter(id => id !== skillId)
    return true
  }

  function getLearned(world) {
    const list = world?.playerState?.learnedSkills || []
    return list.map(id => catalog[id]).filter(Boolean)
  }

  function getEquipped(world) {
    const list = world?.playerState?.equippedSkills || []
    return list.map(id => catalog[id]).filter(Boolean)
  }

  function checkAbility(world, abilityName, playerTier = 2) {
    const equipped = getEquipped(world)
    let maxVal = 0
    for (const sk of equipped) {
      if (sk.ability === abilityName) {
        const val = sk.abilityDynamic ? playerTier : (sk.abilityValue || 1)
        if (val > maxVal) maxVal = val
      }
    }
    return maxVal
  }

  function migrate(world) {
    if (!world) return world
    const ps = world.playerState ||= {}
    if (!Array.isArray(ps.learnedSkills)) ps.learnedSkills = []
    if (!Array.isArray(ps.equippedSkills)) ps.equippedSkills = []
    if (ps.equippedSkills.length > MAX_EQUIPPED) {
      ps.equippedSkills = ps.equippedSkills.slice(0, MAX_EQUIPPED)
    }
    return world
  }

  root.OKH_APP_SKILLS = Object.freeze({
    catalog,
    CLASSES,
    ABILITIES,
    MAX_EQUIPPED,
    learn,
    equip,
    unequip,
    getLearned,
    getEquipped,
    checkAbility,
    migrate
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_SKILLS
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
