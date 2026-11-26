'use strict'
const assert = require('node:assert/strict')
const test = require('node:test')

// 运行环境模拟
globalThis.OKHBackgroundModules = {
  utils: {
    check(cond, msg) { if (!cond) throw new Error(msg) },
    own(obj, prop) { return Object.hasOwn(obj, prop) },
    id(v) { return typeof v === 'string' && /^[a-z][a-z0-9_]*$/.test(v) }
  }
}

const skills = require('../src/app/okh_app_skills.js')

test('okh_app_skills: constants and catalogs', () => {
  assert.equal(skills.MAX_EQUIPPED, 6)
  assert.equal(skills.ABILITIES.length, 7)
  assert.deepEqual([...skills.ABILITIES], ['开锁', '拆陷', '辨识', '潜行', '侦查', '治疗', '破障'])
  assert.equal(Object.keys(skills.CLASSES).length, 17)
  assert.equal(Object.keys(skills.catalog).length, 58)
  for (const [id, sk] of Object.entries(skills.catalog)) {
    assert.equal(sk.id, id)
    assert(typeof sk.name === 'string' && sk.name.length > 0)
    assert(Number.isInteger(sk.tier) && sk.tier >= 1 && sk.tier <= 4)
  }
})

test('okh_app_skills: learn skills', () => {
  const world = { playerState: {} }
  skills.learn(world, 'skill_basic_lockpick')
  skills.learn(world, 'skill_basic_lockpick') // 幂等
  skills.learn(world, 'skill_warrior_guard')
  assert.deepEqual(world.playerState.learnedSkills, ['skill_basic_lockpick', 'skill_warrior_guard'])
  assert.throws(() => skills.learn(world, 'non_existent_skill'), /未在词表注册/)
})

test('okh_app_skills: equip requirements, slot limits and unequip', () => {
  const world = {
    playerState: {
      tier: 2,
      currentClass: 'class_shield_guard',
      learnedSkills: ['skill_basic_lockpick', 'skill_shield_wall', 'skill_shield_bash', 'skill_shield_intervene']
    }
  }

  // 1. 未学会禁止装配
  assert.throws(() => skills.equip(world, 'skill_basic_disarm'), /未学会/)

  // 2. 阶位不足禁止装配 (skill_shield_intervene is tier 3, player is tier 2)
  assert.throws(() => skills.equip(world, 'skill_shield_intervene'), /阶位不足/)

  // 3. 正常装配
  assert(skills.equip(world, 'skill_basic_lockpick'))
  assert(skills.equip(world, 'skill_shield_wall'))
  assert(skills.equip(world, 'skill_shield_bash'))
  assert.equal(skills.getEquipped(world).length, 3)

  // 4. 主职不匹配限制 (学了重剑士技能但当前是盾卫)
  skills.learn(world, 'skill_heavy_cleave')
  assert.throws(() => skills.equip(world, 'skill_heavy_cleave'), /主职不匹配/)

  // 5. 6 格槽位上限校验
  skills.learn(world, 'skill_basic_disarm')
  skills.learn(world, 'skill_basic_identify')
  skills.learn(world, 'skill_basic_stealth')
  skills.learn(world, 'skill_basic_scout')
  skills.equip(world, 'skill_basic_disarm')
  skills.equip(world, 'skill_basic_identify')
  skills.equip(world, 'skill_basic_stealth')
  assert.equal(skills.getEquipped(world).length, 6)
  assert.throws(() => skills.equip(world, 'skill_basic_scout'), /装配栏已满/)

  // 6. 指定槽位替换装配
  skills.equip(world, 'skill_basic_scout', 0)
  assert.equal(skills.getEquipped(world).length, 6)
  assert.equal(world.playerState.equippedSkills[0], 'skill_basic_scout')

  // 7. 卸下技能
  skills.unequip(world, 'skill_basic_scout')
  assert.equal(skills.getEquipped(world).length, 5)
})

test('okh_app_skills: checkAbility computation', () => {
  const world = {
    playerState: {
      tier: 3,
      currentClass: 'class_shield_guard',
      learnedSkills: ['skill_basic_lockpick', 'skill_shield_wall'],
      equippedSkills: ['skill_basic_lockpick', 'skill_shield_wall']
    }
  }

  // static ability: skill_basic_lockpick has abilityValue: 1
  assert.equal(skills.checkAbility(world, '开锁', 3), 1)

  // dynamic ability: learn and equip a dynamic breach skill
  skills.learn(world, 'skill_warrior_breach')
  skills.equip(world, 'skill_warrior_breach')
  assert.equal(skills.checkAbility(world, '破障', 3), 3)

  // unequipped ability returns 0
  assert.equal(skills.checkAbility(world, '侦查', 3), 0)
})

test('okh_app_skills: migrate state', () => {
  const raw = { playerState: { equippedSkills: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'] } }
  skills.migrate(raw)
  assert(Array.isArray(raw.playerState.learnedSkills))
  assert.equal(raw.playerState.equippedSkills.length, 6)
})
