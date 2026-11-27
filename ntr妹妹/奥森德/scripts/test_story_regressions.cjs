'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')

const code = fs.readFileSync(path.join(__dirname, '../dist/okh_complete.js'), 'utf8')

function fixture(location = 'wilds', day = 20, hour = 10) {
  const sb = vm.createContext({ console: { log() {}, warn() {}, error() {} } })
  vm.runInContext(code, sb)
  const { OKHBackground: core, OKH_APP_CONFIG: app, OKH_APP_RUINS: ruins } = sb
  const config = app.buildConfig()
  const world = core.init(app.buildInitialWorld(), config)
  const activate = (id, location) => Object.assign(world.npcs[id], { monitored: true, location, activity: null })
  world.flags.arrived_oakhaven = true
  world.flags.arrivedDay = 1
  world.flags.eileen_arrived = true
  world.playerLocation = location
  world.timeMin = app.DAY(day, hour)
  activate('eileen', 'manor')
  activate('cecilia', 'church')
  let serial = 0
  function advance(state, { to = state.timeMin, move, event, npcId = 'eileen', outcome, action } = {}) {
    const front = {}
    if (move) front.playerLocation = move
    if (event) front.resolveEvents = [{ eventId: event, npcId, outcome }]
    const command = { id: 'story-' + ++serial, revision: 'r1', toMin: to, front }
    if (action) command.playerAction = '【冒险】' + action
    return core.advance(state, command, config).state
  }
  function fugitive() {
    Object.assign(world.flags, { eileen_fugitive: true, eileen_departed: true, eileen_ambush_closed: true })
    Object.assign(world.npcs.eileen.flags, { eileen_disguised: true, eileenFugitiveDays: 2 })
    world.npcs.eileen.values.counterattack = 45
    activate('eileen', world.playerLocation)
  }
  return { world, advance, fugitive, app, ruins, sb }
}

const eventKey = (event, npc = 'eileen') => JSON.stringify(['event', event, npc])
const status = (world, event, npc) => world.bg.eventStates[eventKey(event, npc)]?.status
const escort = 'eileen_escort_offer'
const recon = 'eileen_manor_recon'
const refuge = 'cecilia_quest_1_mire'

test('the escort is open on days six through eight and expires on day nine even if announced', () => {
  const { world, advance, app } = fixture('town')
  world.npcs.eileen.flags.eileenInspectDays = 6
  let state = advance(world)
  assert.equal(status(state, escort), 'pending')
  assert.equal(state.flags.eileen_departed, false)
  state = advance(state, { to: app.DAY(22, 10), move: 'wilds' })
  assert.equal(state.npcs.eileen.flags.eileenInspectDays, 8)
  assert.throws(() => advance(state, { event: escort, outcome: 'accept' }), /不满足/)
  const inTown = advance(state, { move: 'town' })
  assert.equal(advance(inTown, { event: escort, outcome: 'accept' }).flags.eileen_fugitive, true)
  state = advance(state, { to: app.DAY(23, 10), move: 'town' })
  assert.equal(status(state, escort), 'cancelled')
  assert.equal(state.npcs.eileen.flags.eileen_captured, true)
  assert.throws(() => advance(state, { event: escort, outcome: 'accept' }), /已经处理/)
})

test('old saves resume the escort deadline and release obsolete once-only locks', () => {
  const { world, advance, app } = fixture('town', 23)
  world.npcs.eileen.flags.eileenInspectDays = 6
  let state = advance(world)
  state.flags.eileen_departed = true
  state.bg.eventStates[eventKey(escort)].triggeredAt = app.DAY(20, 10)
  state.bg.fired[eventKey(recon)] = true
  state.bg.eventStates[eventKey(recon)] = { status: 'resolved' }
  state.bg.fired[eventKey(refuge, 'cecilia')] = true
  const migrated = app.migrateWorld(state)
  assert.equal(migrated.flags.eileen_departed, false)
  assert.equal(migrated.npcs.eileen.flags.eileenInspectDays, 9)
  assert.equal(migrated.bg.fired[eventKey(recon)], undefined)
  assert.equal(migrated.bg.fired[eventKey(refuge, 'cecilia')], undefined)
  assert.equal(migrated.bg.eventStates[eventKey(recon)].status, 'resolved')
  assert.equal(app.migrateWorld(migrated), migrated)
  assert.equal(advance(migrated).npcs.eileen.flags.eileen_captured, true)
})

test('Eileen can counter-ambush, prepare without Gulan, and scout on three different days', () => {
  const { world, advance, fugitive, app } = fixture()
  fugitive()
  world.npcs.gulan.flags.captured_orc = true
  let state = advance(world)
  state = advance(state, { event: 'eileen_wilds_hunt', outcome: 'counter_ambush' })
  assert.equal(state.npcs.eileen.values.counterattack, 60)
  state = advance(state, { event: 'eileen_decoy_prep', outcome: 'decoy_prep' })
  assert.equal(state.npcs.eileen.values.counterattack, 72)
  for (let visit = 1; visit <= 3; visit++) {
    assert.equal(status(state, recon), 'pending')
    state = advance(state, { event: recon, outcome: 'distant_observe' })
    assert.equal(state.npcs.eileen.flags.eileenReconCount, visit)
    assert.equal(status(state, recon), 'resolved')
    state = advance(state, { to: app.DAY(20 + visit, 10) })
  }
  assert.equal(status(state, recon), 'resolved')
  assert.equal(state.npcs.eileen.flags.eileenReconCount, 3)
})

test('curfew and manor alarms continue to apply after the first ejection, including deep night', () => {
  const { world, advance, fugitive, app } = fixture('wilds', 20, 22)
  fugitive()
  let state = world
  for (const move of ['town', 'inn', 'manor', 'manor']) {
    state = advance(state, { move })
    assert.equal(state.playerLocation, 'wilds')
  }
  assert.equal(state.npcs.eileen.values.counterattack, 25)
  state = advance(state, { to: app.DAY(21, 2), move: 'town' })
  assert.equal(state.playerLocation, 'wilds')
  assert.equal(state.npcs.eileen.location, 'wilds')
})

test('the tube recovery uses Gulan only after a promise and while she is available', () => {
  const { world, advance, fugitive } = fixture('manor')
  fugitive()
  world.npcs.eileen.values.counterattack = 100
  const pending = advance(world)
  for (const [promised, captured, diverts] of [[false, false, false], [true, true, false], [true, false, true]]) {
    const scenario = JSON.parse(JSON.stringify(pending))
    Object.assign(scenario.npcs.gulan.flags, { gulan_divert_promised: promised, captured_orc: captured })
    const settled = advance(scenario, { event: 'eileen_reclaim_tube', outcome: 'strike' })
    const result = settled.bg.queue.find(item => item.mode === 'result' && item.definitionId === 'eileen_reclaim_tube')
    assert.equal(result.text.includes('请出古兰'), diverts)
    assert.equal(settled.flags.eileen_signal_fired, true)
  }
})

test('Cecilia relief can be completed again when funds run out and the same stage asks for help', () => {
  const { world, advance, app } = fixture('church')
  const cecilia = world.npcs.cecilia
  cecilia.values.orphanage_funds = 0
  cecilia.values.affection = 75
  let state = advance(world)
  for (const count of [1, 2]) {
    state = advance(state, { event: 'cecilia_manor_appeal_1', npcId: 'cecilia', outcome: 'take_quest' })
    state = advance(state, { move: 'wilds' })
    assert.equal(status(state, refuge, 'cecilia'), 'pending')
    state = advance(state, { event: refuge, npcId: 'cecilia', outcome: 'complete_quest' })
    assert.equal(state.npcs.cecilia.flags.ceciliaAidCount, count)
    assert.equal(state.npcs.cecilia.flags.cecilia_quest_stage, 0)
    assert.equal(state.npcs.cecilia.values.orphanage_funds, 35)
    if (count === 1) {
      state = advance(state, { to: app.DAY(28, 10) })
      assert.equal(state.npcs.cecilia.values.orphanage_funds, 0)
    }
  }
})

test('a church commission directs the expedition, records a later clear and only pays out in person once', () => {
  const { world, advance, ruins, sb } = fixture('church')
  const npcId = 'cecilia'
  const offer = 'cecilia_weekly_ruin_offer'
  const turnin = 'cecilia_weekly_ruin_turnin'
  world.playerState.guild_merit = 60
  world.playerState.tier = 4
  world.playerState.inventory = [{ id: 'supply', count: 20 }]
  world.ruinState.clearedAtByBiome = { biome_toxic_mire: world.timeMin - 1 }
  let state = advance(world)
  state = advance(state, { event: offer, npcId, outcome: 'accept_weekly' })
  assert.equal(status(state, turnin, npcId), undefined)
  assert.equal(state.npcs.cecilia.flags.ceciliaWeeklyAcceptMin, world.timeMin)
  state = advance(state, { move: 'wilds' })
  assert.match(sb.OKH_APP_HUD.buildHudHtml(state), /教堂周常 · 毒沼菌窟/)
  state = advance(state, { action: '进入 church_weekly' })
  assert.equal(state.ruinState.current.biome, 'biome_toxic_mire')
  while (state.ruinState.current) {
    const options = sb.OKH_APP_ADVENTURE.roomOptions(state, state.ruinState.current)
    const action = ['前进', '巧解', '绕行', '交锋', '开启'].find(value => options.includes(value))
    assert(action, options.join(','))
    state = advance(state, { action: '行动 ' + action })
  }
  assert.equal(state.playerState.guild_merit, world.playerState.guild_merit)
  assert.equal(state.playerState.gold, world.playerState.gold)
  assert.equal(state.playerState.inventory.some(item => item.id.startsWith('skill_scroll')), false)
  assert.deepEqual(state.flags.guildCommissionStarts, world.flags.guildCommissionStarts)
  state.ruinState.current = { biome: 'biome_trap_vault', cleared: true }
  ruins.finish(state)
  state = advance(state, { move: 'church' })
  assert.equal(status(state, turnin, npcId), 'pending')
  const away = advance(state, { move: 'wilds' })
  assert.throws(() => advance(away, { event: turnin, npcId, outcome: 'turnin' }), /不满足/)
  state = advance(state, { event: turnin, npcId, outcome: 'turnin' })
  state = advance(state, { event: turnin, npcId, outcome: 'turnin' })
  assert.equal(state.npcs.cecilia.flags.ceciliaWeeklyCount, 1)
  assert.equal(state.playerState.inventory.find(item => item.id === 'church_blessed_salve').count, 1)
})
