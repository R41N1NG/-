'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, 'test_foundation.cjs'), 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', source + '\nmodule.exports={createSandbox};')(require, __dirname, holder);

test('daily inspector reports affection and cooldowns without modifying the save', async () => {
  const sb = holder.exports.createSandbox(), app = sb.OKH_APP;
  sb.console.table = () => {};
  await app.init();
  const session = app.W.session(), state = app.W.loadWorld(session);
  const expectedRevision = state.bg.revision++;
  const now = 10 * 1440 + 60;
  state.timeMin = now;
  Object.assign(state.npcs.gulan.flags, { dailyAffectionDay: 11, dailyAffectionGain: 2 });
  Object.assign(state.npcs.nise.flags, { dailyAffectionDay: 10, dailyAffectionGain: 3 });
  Object.assign(state.flags, {
    lastPaidWorkDay: 11,
    lastGuildCommissionStartMin: now - 2 * 1440,
    guildCommissionStarts: [now - 6 * 1440, now - 2 * 1440],
    lastChurchErrandStartMin: now - 1440
  });
  await app.W.commit(session, { state, expectedRevision });
  const before = sb._vars[session.key];
  const view = app.daily();
  assert.equal(view.affection.find(row => row.npc === 'gulan').remaining, 1);
  assert.equal(view.affection.find(row => row.npc === 'nise').remaining, 3);
  assert.equal(view.work.paidRemaining, 0);
  assert.equal(view.work.guildStartsInWindow, 2);
  assert.equal(view.work.guildWaitMin, 1440);
  assert.equal(view.work.churchWaitMin, 1440);
  assert.equal(sb._vars[session.key], before);
});

test('Eileen branch uses world flags and falls back only when a world flag is absent', () => {
  const sb = holder.exports.createSandbox(), data = sb.OKH_APP_DATA;
  const world = data.buildInitialWorld();
  Object.assign(world.npcs.eileen.flags, { eileen_fugitive: true, eileen_signal_fired: true });
  assert.equal(data.isEileenFugitive(world), false);
  assert.equal(data.hasEileenSignal(world), false);
  delete world.flags.eileen_fugitive;
  delete world.flags.eileen_signal_fired;
  assert.equal(data.isEileenFugitive(world), true);
  assert.equal(data.hasEileenSignal(world), true);

  const legacy = { ...world, schemaVersion: 2 };
  const migrated = sb.OKH_APP_MIGRATE.migrateWorld(legacy);
  assert.equal(migrated.flags.eileen_fugitive, true);
  assert.equal(migrated.flags.eileen_signal_fired, true);
  migrated.flags.baron_purged = true;
  assert.equal(data.isEileenFugitive(migrated), false);
  assert.equal(data.hasEileenSignal(migrated), true);
});
