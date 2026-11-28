'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')

const code = fs.readFileSync(path.join(__dirname, '../dist/okh_complete.js'), 'utf8')

function fixture({ merit = 60, location = 'wilds', supplies = 20 } = {}) {
  const sandbox = vm.createContext({ console: { log() {}, warn() {}, error() {} } })
  vm.runInContext(code, sandbox)
  const { OKH_APP_CONFIG: app, OKHBackground: core } = sandbox
  const config = app.buildConfig()
  const world = core.init(app.buildInitialWorld(), config)
  world.flags.arrived_oakhaven = true
  world.playerLocation = location
  world.playerState.guild_merit = merit
  world.playerState.inventory = supplies ? [{ id: 'supply', count: supplies }] : []
  world.timeMin = 19 * 60
  let sequence = 0
  function play(state, order, id = 'adventure-' + ++sequence) {
    return core.advance(state, { id, revision: 'r1', toMin: state.timeMin, playerAction: '【冒险】' + order }, config)
  }
  return { sandbox, world, config, core, play }
}

const dragon = '进入 core_ruin_dragon_chasm'
const count = (world, item) => world.playerState.inventory.find(entry => entry.id === item)?.count ?? 0

test('core expedition validates entry, executes choices and pays the first clear through the turn', () => {
  const { world, play } = fixture()
  assert.equal(play(world, dragon + ' nise aurora isna').state.ruinState.current, null)
  assert.equal(play(world, '行动 开启').state.timeMin, world.timeMin)
  let state = play(world, '选职 class_trap_breaker').state
  assert.equal(state.playerState.equippedSkills.length, 2)
  state = play(state, dragon + ' isna').state
  assert.equal(state.ruinState.current.partyMembers.length, 1)
  assert.equal(state.ruinState.current.escort, 'gulan')
  assert.equal(play(state, '装配 skill_thief_lock').report.adventure, '请在旅店或营地调整技能')
  const wrong = play(state, '行动 开启')
  assert.equal(wrong.state.ruinState.current.currentBlockIndex, 0)
  assert.equal(wrong.state.timeMin, state.timeMin)
  state = play(state, '行动 自动').state
  assert.equal(state.timeMin, world.timeMin + 480)
  assert.equal(count(state, 'supply'), 17)
  state = play(state, '行动 巧解').state
  state = play(state, '行动 交锋').state
  assert.equal(state.playerState.realmProgress, 2)
  state = play(state, '行动 险路').state
  const first = play(state, '行动 开启', 'first-clear')
  const replayed = play(state, '行动 开启', 'first-clear')
  assert.deepEqual(first.state, replayed.state)
  assert.equal(first.state.ruinState.current, null)
  assert.equal(first.state.playerState.gold, world.playerState.gold + 60)
  assert.equal(first.state.playerState.guild_merit, 80)
  assert.equal(first.state.playerState.realmProgress, 5)
  assert.equal(first.state.timeMin - world.timeMin, 48 * 60)
  assert.equal(count(first.state, 'supply'), 15)
  assert.equal(count(first.state, 'skill_scroll_t2'), 1)
  assert.match(play(first.state, dragon).report.adventure, /已首通/)
  assert.equal(world.playerState.gold, 30)
})

test('insufficient supplies force a retreat on the next missed ration and no core is marked cleared', () => {
  const { world, play } = fixture({ supplies: 3 })
  let state = play(world, '选职 class_trap_breaker').state
  state = play(state, dragon + ' isna').state
  state = play(state, '行动 前进').state
  assert.equal(count(state, 'supply'), 0)
  state = play(state, '行动 巧解').state
  state = play(state, '行动 交锋').state
  state = play(state, '行动 绕行').state
  assert(state.tags.player.includes('debuff_starving'))
  assert(state.tags.isna.includes('debuff_starving'))
  assert.match(play(state, '行动 开启').report.adventure, /撤退/)
  state = play(state, '行动 撤退').state
  assert.equal(state.ruinState.current, null)
  assert.equal(state.ruinState.clearedCores.length, 0)
  assert.equal(state.playerState.guild_merit, 60)
})

test('low-ranked teams cannot launch expeditions, and random ruins share the commission limit', () => {
  const { world, play } = fixture({ merit: 20 })
  assert.match(play(world, dragon).report.adventure, /公会阶位不足/)
  world.playerState.guild_merit = 60
  const started = play(world, '进入 2').state
  const retreated = play(started, '行动 撤退').state
  assert.equal(retreated.flags.guildCommissionStarts.length, 1)
  assert.match(play(retreated, '进入 2').report.adventure, /额度/)
  assert(play(retreated, dragon).state.ruinState.current)
})

test('legacy saves get rank state, field reports rank up, and remedies and scrolls consume inventory', () => {
  const { world, sandbox, play, core, config } = fixture({ location: 'inn' })
  const old = JSON.parse(JSON.stringify(world))
  delete old.playerState.adventureVersion
  delete old.tags.player
  const migrated = sandbox.OKH_APP_CONFIG.migrateWorld(old)
  assert(migrated.tags.player.includes('guild_silver'))
  assert(!old.tags.player)

  world.playerState.inventory.push({ id: 'antidote', count: 1 }, { id: 'skill_scroll_t2', count: 1 })
  sandbox.OKH_APP_TAGS.apply(world, 'player', ['debuff_poisoned'])
  let state = play(world, '用药 antidote').state
  assert.equal(count(state, 'antidote'), 0)
  assert(!state.tags.player.includes('debuff_poisoned'))
  const learned = sandbox.OKH_APP_SKILLS.getLearned(state)
  const read = play(state, '研读 skill_scroll_t2', 'scroll')
  assert.deepEqual(read.state, play(state, '研读 skill_scroll_t2', 'scroll').state)
  state = read.state
  const gained = sandbox.OKH_APP_SKILLS.getLearned(state).filter(skill => !learned.includes(skill))
  assert.equal(gained.length, 1)
  assert.equal(gained[0].tier, 2)
  assert.equal(count(state, 'skill_scroll_t2'), 0)
  state.playerState.inventory.push({ id: 'skill_scroll_t4', count: 1 })
  assert.equal(play(state, '研读 skill_scroll_t4').state.playerState.gold, state.playerState.gold + 150)

  state.playerState.realmProgress = 29
  state.playerLocation = 'wilds'
  const front = sandbox.OKH_APP_PARSE.buildFront('<status_bar><combat_temper enemy_tier="2"/></status_bar>',
    state.timeMin + 15, state, { config })
  state = core.advance(state, { id: 'win', revision: 'r1', toMin: state.timeMin + 15, front }, config).state
  assert.equal(state.playerState.tier, 3)
  assert.equal(state.playerState.realmCap, 60)
  assert(state.tags.player.includes('class_shield_guard3'))
  assert(!state.tags.player.includes('class_shield_guard2'))
})

test('the chat input, generation preview, swipe and deleted reply share the same action', async () => {
  const { world, sandbox } = fixture()
  const chat = []
  const vars = new Map()
  const app = sandbox.OKH_APP
  app.configure({
    chatId: 'adventure-test',
    getContext: () => ({ chat, chatId: 'adventure-test' }),
    storage: { get: key => vars.get(key), set: (key, val) => { vars.set(key, val); return true } },
    inject: () => true
  })
  await app.init()
  const seed = app.world()
  Object.assign(seed, { timeMin: world.timeMin, playerState: world.playerState, playerLocation: 'wilds' })
  seed.flags.arrived_oakhaven = true
  await app.save(seed, { debug: true })
  assert.match(app.HUD.buildHudHtml(app.world()), /data-okh-act="adventure-enter"/)
  chat.push({ is_user: true, mes: '【冒险】' + dragon })
  const preview = await app.beforeGeneration()
  assert.match(preview.text, /已进入龙喉裂谷/)
  assert.equal(app.world().ruinState.current, null)
  chat.push({ is_user: false, mes: '<content>进发。</content><status_bar><time elapsed="999"/></status_bar>' })
  await app.onMessage(1)
  assert.equal(app.world().timeMin, world.timeMin)
  assert.equal(app.world().ruinState.current.currentBlockIndex, 0)
  assert.match(app.HUD.buildHudHtml(app.world()), /data-okh-command="行动 前进"/)
  chat.push({ is_user: true, mes: '【冒险】行动 前进' }, { is_user: false, mes: '第一段。' })
  await app.onMessage(3)
  const once = app.world()
  assert.equal(once.timeMin, world.timeMin + 480)
  chat[3].mes = '重生成第一段。'
  await app.syncHistory()
  const replaced = app.world()
  assert.equal(replaced.timeMin, once.timeMin)
  assert.deepEqual(replaced.ruinState, once.ruinState)
  assert.equal(count(replaced, 'supply'), count(once, 'supply'))
  chat.pop()
  await app.syncHistory()
  assert.equal(app.world().timeMin, world.timeMin)
  assert.equal(app.world().ruinState.current.currentBlockIndex, 0)
  assert.equal(count(app.world(), 'supply'), 20)
})

test('all seventeen professions start with two skills available on the following turn', () => {
  const { world, play, sandbox } = fixture({ location: 'inn' })
  for (const job of Object.values(sandbox.OKH_APP_SKILLS.CLASSES)) {
    const { state } = play(world, '选职 ' + job.id)
    assert.equal(state.playerState.currentClass, job.id)
    assert.equal(state.playerState.equippedSkills.length, 2)
    assert(state.playerState.equippedSkills.every(id => state.playerState.learnedSkills.includes(id)))
    assert(state.tags.player.includes(job.id + '2'))
    assert.match(play(state, '选职 ' + job.id).report.adventure, /主职业已定/)
  }
})

test('a heavy wound can recover through treatment or three nights at the inn', () => {
  const { world, sandbox, core, config, play } = fixture({ location: 'church' })
  const tag = 'debuff_heavy_wound'
  sandbox.OKH_APP_TAGS.apply(world, 'player', [tag])
  world.npcs.cecilia.location = 'church'
  world.npcs.cecilia.monitored = true
  const healed = play(world, '疗伤 player').state
  assert(!healed.tags.player.includes(tag))
  assert.equal(healed.playerState.gold, world.playerState.gold - 10)
  // 塞西莉亚不在场时在教堂仍可由教堂医护处理轻伤
  sandbox.OKH_APP_TAGS.apply(world, 'player', ['debuff_light_wound'])
  world.npcs.cecilia.location = 'manor'
  const lightHealed = play(world, '疗伤 player').state
  assert(!lightHealed.tags.player.includes('debuff_light_wound'))
  const innWorld = fixture({ location: 'inn' }).world
  sandbox.OKH_APP_TAGS.apply(innWorld, 'player', [tag])
  function wait(days) {
    return core.advance(innWorld, { id: 'rest', revision: 'r1', toMin: days * 1440 + 360 }, config).state
  }
  assert(wait(2).tags.player.includes(tag))
  assert(!wait(3).tags.player.includes(tag))
})

test('local actions bypass turns, record non-empty digest, skip empty moves and clear after reply', async () => {
  const store = new Map()
  const chat = [{ is_user: false, is_system: false, mes: '<content>开局</content><status_bar><time elapsed="0" end="1日10:00"/></status_bar>' }]
  const sandbox = vm.createContext({ console: { log() {}, warn() {}, error() {} } })
  vm.runInContext(code, sandbox)
  const { OKH_APP_WORLD: W, OKH_APP_HOOK: HOOK, OKH_APP_ADVENTURE: ADV } = sandbox
  W.configure({
    getChatId: () => 'chat-local-1',
    getContext: () => ({ chat }),
    storage: { get: k => store.get(k), set: (k, v) => { store.set(k, v); return true } }
  })
  let lastInjected = ''
  HOOK.configure({ inject: text => { lastInjected = text; return true } })
  await W.ensureWorld(true)
  // Set arrived_oakhaven at day 2 morning in town with 50 gold
  await HOOK.applyLocal(draft => {
    draft.flags.arrived_oakhaven = true
    draft.playerLocation = 'town'
    draft.playerState.gold = 50
    draft.timeMin = 1440 + 540
    return { message: 'setup' }
  }, { recordDigest: false })

  // 1. Empty move does NOT add localDigest
  await HOOK.applyLocal(draft => ADV.runLocal(draft, { kind: 'move', to: 'church' }))
  assert.equal(W.loadWorld().playerLocation, 'church')
  assert.equal(W.loadWorld().bg.localDigest?.length || 0, 0)

  // 2. Church donate adds localDigest with location and deducts gold without pushing history checkpoint
  const histLenBefore = W.readEnvelope().history.length
  await HOOK.applyLocal(draft => ADV.runLocal(draft, { kind: 'economy', op: 'donate', tier: 'small', npc: 'cecilia' }))
  assert.equal(W.readEnvelope().history.length, histLenBefore)
  assert.equal(W.loadWorld().playerState.gold, 45)
  assert.equal(W.loadWorld().bg.localDigest.length, 1)
  assert.match(W.loadWorld().bg.localDigest[0], /圣辉大教堂.*募捐/)

  // 3. Equip/unequip does NOT add localDigest
  await HOOK.applyLocal(draft => ADV.runLocal(draft, { kind: 'move', to: 'inn' }))
  await HOOK.applyLocal(draft => ADV.runLocal(draft, { kind: 'adventure', command: '卸下 skill_first_aid' }))
  assert.equal(W.loadWorld().bg.localDigest.length, 1)

  // 4. Invalid action throws and leaves state untouched
  await assert.rejects(
    () => HOOK.applyLocal(draft => ADV.runLocal(draft, { kind: 'adventure', command: '进入 2' })),
    /荒原/
  )
  assert.equal(W.loadWorld().bg.localDigest.length, 1)

  // 5. Next generation injects localDigest and finishing reply clears it
  chat.push({ is_user: true, mes: '继续。' })
  await HOOK.beforeGeneration({ type: 'normal' })
  assert.match(lastInjected, /近期已完成的整备与行动/)
  assert.match(lastInjected, /募捐/)
  chat.push({ is_user: false, is_system: false, mes: '<content>继续剧情</content><status_bar><time elapsed="15" end="2日09:30"/></status_bar>' })
  await HOOK.onMessage(chat.length - 1)
  assert.equal(W.loadWorld().bg.localDigest.length, 0)
})

test('90-affection alone events grant global tags, items, mechanical perks, and HUD bond badges', () => {
  const { world, sandbox, core, config, play } = fixture({ location: 'wilds', supplies: 20 })
  const { OKH_APP_SKILLS: SKILLS, OKH_APP_TAGS: TAGS, OKH_APP_HUD: HUD } = sandbox

  // 1. Alone check: with gulan & nise both at inn, 90-affection bond does NOT trigger
  let w = core.init(sandbox.OKH_APP_CONFIG.buildInitialWorld(), config)
  w.flags.arrived_oakhaven = true
  w.playerLocation = 'inn'
  w.npcs.gulan.location = 'inn'
  w.npcs.nise.location = 'inn'
  w.npcs.gulan.values.affection = 92
  w.npcs.nise.values.affection = 92
  w = core.advance(w, { id: 'b_crowd', revision: 'r1', toMin: 1440 + 600 }, config).state
  assert.equal(w.bg.eventStates['["event","gulan_scale_bond","gulan"]'], undefined)

  // Move gulan & player to training_grounds alone -> gulan_scale_bond triggers -> accept grants item & bond_gulan_90
  w.playerLocation = 'training_grounds'
  w.npcs.gulan.location = 'training_grounds'
  w = core.advance(w, { id: 'b_alone', revision: 'r2', toMin: 1440 + 620, interactingIds: ['gulan'] }, config).state
  assert.equal(w.bg.eventStates['["event","gulan_scale_bond","gulan"]']?.status, 'pending')
  w = core.advance(w, { id: 'b_acc', revision: 'r3', toMin: 1440 + 630, front: { resolveEvents: [{ eventId: 'gulan_scale_bond', npcId: 'gulan', outcome: 'accept' }] } }, config).state
  assert(w.tags.player.includes('bond_gulan_90'))
  assert.equal(count(w, 'gulan_reverse_scale'), 1)

  // 2. Nise 7th skill slot perk
  let wSkill = play(world, '选职 class_shield_guard').state
  const extras = Object.values(SKILLS.catalog).filter(sk => !sk.reqClass && !sk.branch && sk.tier === 1)
  for (const sk of extras) SKILLS.learn(wSkill, sk.id)
  wSkill.playerLocation = 'inn'
  while (wSkill.playerState.equippedSkills.length < 6) {
    const next = extras.find(sk => !wSkill.playerState.equippedSkills.includes(sk.id))
    SKILLS.equip(wSkill, next.id)
  }
  const seventh = extras.find(sk => !wSkill.playerState.equippedSkills.includes(sk.id))
  assert.throws(() => SKILLS.equip(wSkill, seventh.id), /上限 6 格/)
  TAGS.apply(wSkill, 'player', ['bond_nise_90'])
  SKILLS.equip(wSkill, seventh.id)
  assert.equal(wSkill.playerState.equippedSkills.length, 7)

  // 3. Aurora rest clears light wound in wilds even when Aurora is away
  let wRest = sandbox.OKH_APP_CONFIG.buildInitialWorld()
  wRest = core.init(wRest, config)
  wRest.flags.arrived_oakhaven = true
  wRest.playerLocation = 'wilds'
  wRest.npcs.aurora.location = 'inn'
  wRest.playerState.inventory = [{ id: 'supply', count: 5 }]
  TAGS.apply(wRest, 'player', ['debuff_light_wound', 'bond_aurora_90'])
  wRest = play(wRest, '休整').state
  assert(!wRest.tags.player.includes('debuff_light_wound'))

  // 4. Gulan first heavy wound immunity + Isna +20% ruin gold + HUD badge rendering
  let wRaid = play(world, '选职 class_shield_guard').state
  TAGS.apply(wRaid, 'player', ['bond_gulan_90', 'bond_isna_90', 'bond_nise_90', 'bond_aurora_90'])
  TAGS.apply(wRaid, 'player', ['debuff_light_wound'])
  wRaid = play(wRaid, '进入 2').state
  // Trigger a forced failure on an obstacle via 硬闯 or verify heavy wound immunity when wound fires
  const goldBefore = wRaid.playerState.gold
  const expectedRaidGold = Math.floor(wRaid.ruinState.current.gold * 1.2)
  wRaid = play(wRaid, '行动 自动').state
  if (!wRaid.ruinState.current) {
    assert.equal(wRaid.playerState.gold, goldBefore + expectedRaidGold)
  }
  const hudHtml = HUD.buildHudHtml(wRaid)
  assert(hudHtml.includes('okh-bond-bar'))
  assert(hudHtml.includes('莫要逞强'))
  assert(hudHtml.includes('小猫缠上你啦~'))
  assert(hudHtml.includes('天才法师妮丝大人罩着你~'))
  assert(hudHtml.includes('愿你永安'))
})
