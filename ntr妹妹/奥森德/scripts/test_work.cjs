'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const helper = fs.readFileSync(path.join(__dirname, 'test_foundation.cjs'), 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', helper + '\nmodule.exports={createSandbox};')(require, __dirname, holder);
const work = tier => `<economy op="work" tier="${tier}"/>`;

function fixture(location = 'town', arrived = true) {
  const sandbox = holder.exports.createSandbox();
  const core = sandbox.OKHBackground;
  const { DAY, LOCATIONS, buildConfig, buildInitialWorld } = sandbox.OKH_APP_CONFIG;
  const config = buildConfig();
  const world = core.init(buildInitialWorld(), config);
  world.timeMin = DAY(4, 6);
  world.flags.arrived_oakhaven = arrived;
  world.flags.arrivedDay = arrived ? 1 : null;
  world.playerLocation = location;
  world.npcs.isna.location = location;
  world.npcs.gulan.location = location;
  function advance(state, toMin, tags, id = 'work-' + toMin) {
    const front = sandbox.OKH_APP_PARSE.buildFront(`<status_bar>${tags}</status_bar>`, toMin, state, { config, locations: LOCATIONS });
    return core.advance(state, { id, revision: 'r1', toMin, interactingIds: ['isna', 'gulan'], front }, config).state;
  }
  return { sandbox, world, advance, DAY };
}

test('ordinary and Isna-assisted shifts both need six hours and pay the same wage once', () => {
  const { world, advance, DAY } = fixture();
  const bond = '<bond npc="isna" kind="steady_work"/>';
  for (const tags of [work('odd'), bond]) {
    assert.equal(advance(world, DAY(4, 6), tags).playerState.gold, 30);
    assert.equal(advance(world, DAY(4, 11, 59), tags).playerState.gold, 30);
    assert.equal(advance(world, DAY(4, 12), tags).playerState.gold, 36);
  }
  const combined = advance(world, DAY(4, 14), bond + work('odd') + work('guild_normal'));
  assert.equal(combined.playerState.gold, 36);
  assert.equal(combined.flags.lastGuildCommissionDay, null);
  assert.equal(advance(combined, DAY(4, 22), work('guild_normal')).playerState.gold, 36);
  assert.equal(advance(combined, DAY(5, 14), work('guild_normal')).playerState.gold, 64);
});

test('a volunteer shift occupies its time without taking the paid-day slot', () => {
  const { world, advance, DAY } = fixture('church');
  const volunteer = work('church_volunteer').replace('/>', ' at="4日09:00"/>');
  const tags = volunteer + '<move to="town" at="4日09:01"/>' + work('odd');
  const overlapping = advance(world, DAY(4, 14), tags);
  assert.equal(overlapping.npcs.cecilia.values.orphanage_funds, 58);
  assert.equal(overlapping.playerState.gold, 30);
  assert.equal(advance(world, DAY(4, 15, 1), tags).playerState.gold, 36);
});

test('guild limits use real hours and the two most recent starts within seven days', () => {
  const { world, advance, DAY } = fixture();
  assert.equal(advance(world, DAY(4, 13, 59), work('guild_normal')).playerState.gold, 30);
  const first = advance(world, DAY(4, 14), work('guild_normal'));
  assert.equal(first.playerState.gold, 58);
  assert.equal(first.playerState.guild_merit, 10);
  assert.equal(advance(first, DAY(7, 13, 59), work('guild_normal')).playerState.gold, 58);
  const second = advance(first, DAY(7, 14), work('guild_normal'));
  assert.equal(second.playerState.gold, 86);
  assert(second.tags.player.includes('guild_bronze'));
  assert.equal(advance(second, DAY(10, 14), work('guild_normal')).playerState.gold, 86);
  assert.equal(advance(second, DAY(11, 14), work('guild_normal')).playerState.gold, 114);
});

test('high-risk work requires 24 hours and a qualified companion', () => {
  const { world, advance, DAY } = fixture('wilds');
  assert.equal(advance(world, DAY(5, 5, 59), work('guild_high')).playerState.gold, 30);
  assert.equal(advance(world, DAY(5, 6), work('guild_high')).playerState.gold, 30);
  world.playerState.guild_merit = 20;
  const done = advance(world, DAY(5, 6), work('guild_high'));
  assert.equal(done.playerState.gold, 78);
  assert.equal(done.timeMin - world.timeMin, 1440);
  world.npcs.gulan.location = 'inn';
  world.npcs.isna.location = 'inn';
  assert.equal(advance(world, DAY(5, 6), work('guild_high')).playerState.gold, 30);
});

test('arrival and fallback time cannot provide work hours', async () => {
  const { world, advance, DAY, sandbox } = fixture('wilds', false);
  const arrives = '<prologue_step flag="arrived_oakhaven"/><move to="town"/>';
  const reached = advance(world, DAY(4, 14), arrives + work('guild_normal'));
  assert.equal(reached.flags.arrived_oakhaven, true);
  assert.equal(reached.playerState.gold, 30);
  const app = sandbox.OKH_APP;
  await app.init();
  const save = app.world();
  save.flags.arrived_oakhaven = true;
  save.flags.arrivedDay = 4;
  save.flags.ed_permanently_joined = true;
  save.npcs.ed.monitored = true;
  save.flags.edInterceptSlot = 3;
  save.playerLocation = 'town';
  save.timeMin = DAY(4, 8);
  save.bg.clockState = { count: 2, creditedMin: 0 };
  await app.save(save, { debug: true });
  await app.step(0, { text: '<status_bar></status_bar>', msgId: 'seed' });
  sandbox._ctxObj.chat = [{ is_user: true, mes: '完成送药' }, { is_user: false, mes: '<status_bar><time elapsed="0"/><event_resolve id="ed_intercept_job_4" outcome="accept_direct"/></status_bar>' }];
  await assert.rejects(app.onMessage(1), /条件不满足该事件选项/);
  assert.equal(app.world().playerState.gold, 30);
  assert.equal(app.world().timeMin, DAY(4, 8));
});

test('Ed urgent work needs its own full window and uses the shared paid-day slot', () => {
  const { world, advance, DAY } = fixture();
  world.flags.ed_permanently_joined = true;
  world.npcs.ed.monitored = true;
  world.flags.edInterceptSlot = 3;
  const ready = advance(world, DAY(4, 8), '');
  const event = '<event_resolve id="ed_intercept_job_4" outcome="accept_direct"/>';
  assert.throws(() => advance(ready, DAY(4, 8, 59), event), /条件不满足该事件选项/);
  const done = advance(ready, DAY(4, 9), event);
  assert.equal(done.playerState.gold, 38);
  assert.equal(advance(done, DAY(4, 15), work('odd')).playerState.gold, 38);
});
