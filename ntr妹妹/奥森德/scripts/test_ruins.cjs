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

test('okh_app_ruins: enter, advance with dynamic supply deduction, retreat', () => {
  const world = {
    timeMin: 0,
    ruinState: { current: null, clearedCores: [] },
    playerState: {
      inventory: [{ id: 'supply', count: 20 }]
    }
  }

  const ruin = ruins.assemble({ coreId: 'core_ruin_dragon_chasm' })
  // 3 人同行：主角 1 + 队友 2 = 3 人
  const party = ['nise', 'aurora']
  ruins.enter(world, ruin, party)

  const status1 = ruins.getStatus(world)
  assert.equal(status1.inRuin, true)
  assert.equal(status1.currentBlockIndex, 0)
  assert.equal(status1.totalBlocks, 5)

  // Advance block 0 (minHours: 8) -> elapsed = 8h (<24h, no supply deduction)
  ruins.advance(world)
  assert.equal(world.ruinState.current.currentBlockIndex, 1)
  assert.equal(world.playerState.inventory[0].count, 20)

  // Advance block 1 (minHours: 10) -> elapsed = 18h (<24h)
  ruins.advance(world)
  assert.equal(world.ruinState.current.currentBlockIndex, 2)
  assert.equal(world.playerState.inventory[0].count, 20)

  // Advance block 2 (minHours: 10) -> elapsed = 28h (crosses 24h, 1 day * (1+2+1 escort gulan) = 4 supplies deducted, or 3 if no escort. Wait: ruin.escort is 'gulan' so actualPartySize = 1 + 2 + 1 = 4!)
  ruins.advance(world)
  assert.equal(world.ruinState.current.currentBlockIndex, 3)
  assert.equal(world.playerState.inventory[0].count, 16) // 20 - 4 = 16

  // Advance block 3 (branch, minHours: 8) -> elapsed = 36h
  ruins.advance(world)
  assert.equal(world.ruinState.current.currentBlockIndex, 4)

  // Advance block 4 (sanctum, minHours: 12) -> elapsed = 48h (crosses 48h, another 4 deducted: 16 - 4 = 12), reaches end, marks cleared
  const res = ruins.advance(world)
  assert.equal(res.cleared, true)
  assert.equal(world.playerState.inventory[0].count, 12)
  assert(world.ruinState.clearedCores.includes('core_ruin_dragon_chasm'))

  // Retreat
  ruins.retreat(world)
  assert.equal(ruins.getStatus(world).inRuin, false)
})

test('okh_app_ruins: migration', () => {
  const w = {}
  ruins.migrate(w)
  assert(w.ruinState)
  assert.equal(w.ruinState.current, null)
  assert.deepEqual(w.ruinState.clearedCores, [])
})
