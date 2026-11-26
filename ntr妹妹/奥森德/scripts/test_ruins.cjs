'use strict'
const assert = require('node:assert/strict')
const test = require('node:test')

globalThis.OKHBackgroundModules = {
  utils: {
    check(cond, msg) { if (!cond) throw new Error(msg) },
    own(obj, prop) { return Object.hasOwn(obj, prop) },
    id(v) { return typeof v === 'string' && /^[a-z][a-z0-9_]*$/.test(v) }
  }
}

const ruins = require('../src/app/okh_app_ruins.js')

test('okh_app_ruins: catalog completeness and biome constraints', () => {
  const cat = ruins.catalog
  assert.equal(Object.keys(cat.biomes).length, 6)
  assert.equal(Object.keys(cat.entrances).length, 15)
  assert.equal(Object.keys(cat.obstacles).length, 15)
  assert.equal(Object.keys(cat.branches).length, 30)
  assert.equal(Object.keys(cat.combats).length, 100)
  assert.equal(Object.keys(cat.sanctums).length, 30)
  assert.equal(Object.keys(cat.coreRuins).length, 3)

  // 严控：秘术网格与沉沦灵堂仅限三阶及以上
  assert.equal(cat.biomes.biome_arcane_grid.minTier, 3)
  assert.equal(cat.biomes.biome_undead_crypt.minTier, 3)
  assert.equal(cat.biomes.biome_narrow_mine.minTier, 2)
  assert.equal(cat.biomes.biome_toxic_mire.minTier, 2)
  assert.equal(cat.biomes.biome_trap_vault.minTier, 2)
  assert.equal(cat.biomes.biome_living_lair.minTier, 2)
})

test('okh_app_ruins: assemble random ruin instance', () => {
  // Mock RNG to test determinism
  let seed = 0.42
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // Tier 2 assembly
  const ruinT2 = ruins.assemble({ tier: 2, rng })
  assert.equal(ruinT2.tier, 2)
  assert(ruinT2.partyLimit >= 2 && ruinT2.partyLimit <= 4)
  assert(ruinT2.blocks.length >= 4 && ruinT2.blocks.length <= 6)
  assert(ruinT2.minDurationHours >= 36)
  assert.notEqual(ruinT2.biome, 'biome_arcane_grid') // II 阶不可为秘术网格
  assert.notEqual(ruinT2.biome, 'biome_undead_crypt') // II 阶不可为沉沦灵堂
  assert.equal(ruinT2.blocks[0].type, 'entrance')
  assert.equal(ruinT2.blocks[ruinT2.blocks.length - 1].type, 'sanctum')

  // Tier 3 assembly allows arcane grid or undead crypt
  const ruinT3 = ruins.assemble({ tier: 3, rng })
  assert.equal(ruinT3.tier, 3)
  assert(ruinT3.minDurationHours >= 48)
})

test('okh_app_ruins: core ruins definition', () => {
  const cat = ruins.catalog
  const r1 = cat.coreRuins.core_ruin_dragon_chasm
  const r2 = cat.coreRuins.core_ruin_frost_crypt
  const r3 = cat.coreRuins.core_ruin_arcane_tower

  assert.equal(r1.tier, 2)
  assert.equal(r1.blocks.length, 5)
  assert.equal(r2.tier, 3)
  assert.equal(r2.blocks.length, 5)
  assert.equal(r3.tier, 4)
  assert.equal(r3.blocks.length, 5)

  // Assemble core ruin
  const coreInst = ruins.assemble({ coreId: 'core_ruin_arcane_tower' })
  assert.equal(coreInst.id, 'core_ruin_arcane_tower')
  assert.equal(coreInst.tier, 4)
  assert.equal(coreInst.blocks.length, 5)
})

test('room progression requires a verdict and a cleared core cannot be entered again', () => {
  const world = {}
  const assemble = () => ruins.assemble({ coreId: 'core_ruin_dragon_chasm' })
  assert.throws(() => ruins.enter(world, assemble(), ['nise', 'aurora', 'isna']), /超过名额/)
  ruins.enter(world, assemble(), ['nise', 'aurora'])
  assert.throws(() => ruins.advance(world), /后台判定/)
  assert.equal(ruins.advance(world, { hours: 8, passed: false }), false)
  assert.equal(ruins.getStatus(world).currentBlockIndex, 0)
  ruins.retreat(world)
  ruins.enter(world, assemble())
  for (const block of assemble().blocks) ruins.advance(world, { hours: block.minHours, passed: true })
  ruins.finish(world)
  assert.equal(ruins.getStatus(world).inRuin, false)
  assert.throws(() => ruins.enter(world, assemble()), /已首通/)
})

test('random rooms match their habitat, guardian tier, and enforced minimum duration', () => {
  const keys = ['mine', 'mire', 'vault', 'lair', 'arcane', 'crypt']
  const habitats = Object.values(ruins.catalog.biomes)
  for (const tier of [2, 3, 4]) {
    habitats.forEach((habitat, i) => {
      if (habitat.minTier > tier) return
      for (const random of [0, 0.49, 0.99]) {
        const raid = ruins.assemble({ tier, biome: habitat.id, rng: () => random })
        const { blocks } = raid
        assert.equal(raid.biome, habitat.id)
        assert(blocks.reduce((sum, block) => sum + block.minHours, 0) >= raid.minDurationHours)
        assert.equal(new Set(blocks.map(block => block.id)).size, blocks.length)
        assert.equal(blocks.find(block => block.type === 'combat').enemyTier, tier)
        for (const block of blocks) assert([keys[i], 'universal'].includes(block.biome))
      }
    })
  }
})

test('okh_app_ruins: migration', () => {
  const w = {}
  ruins.migrate(w)
  assert(w.ruinState)
  assert.equal(w.ruinState.current, null)
  assert.deepEqual(w.ruinState.clearedCores, [])
})
