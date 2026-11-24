'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, 'test_foundation.cjs'), 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', source + '\nmodule.exports={createSandbox};')(require, __dirname, holder);

test('flag inspector reads current world and NPC flags without writing the save', async () => {
  const sb = holder.exports.createSandbox();
  const app = sb.OKH_APP;
  const { W } = app;
  sb.console.table = () => {};
  assert.equal(app.flags().length, 0);
  await app.init();
  const session = W.session();
  const state = W.loadWorld(session);
  const expectedRevision = state.bg.revision++;
  state.flags.guildCommissionStarts = [1510];
  state.npcs.gulan.flags.ed_hypnosis_play_done = true;
  state.npcs.ed.flags.ed_teach_count = 2;
  await W.commit(session, { state, expectedRevision });

  const stored = sb._vars[session.key];
  const worldFlags = app.flags('world');
  assert(worldFlags.every(row => row.scope === 'world'));
  const arrival = worldFlags.find(row => row.key === 'arrived_oakhaven');
  assert.equal(arrival.value, false);
  assert.equal(arrival.initial, false);
  assert.equal(arrival.registered, true);
  const unsettled = worldFlags.find(row => row.key === 'curfew_active');
  assert.equal(unsettled.present, false);
  assert.equal(unsettled.value, undefined);
  const unregistered = worldFlags.find(row => row.key === 'guildCommissionStarts');
  assert.equal(unregistered.registered, false);
  assert.equal(unregistered.value[0], 1510);
  unregistered.value.push(1600);
  assert.equal(app.flags('world').find(row => row.key === 'guildCommissionStarts').value.length, 1);

  const gulanFlags = app.flags('gulan');
  assert(gulanFlags.every(row => row.scope === 'gulan'));
  assert.equal(gulanFlags.find(row => row.key === 'ed_hypnosis_play_done').value, true);
  const count = app.flags().find(row => row.key === 'ed_teach_count');
  assert.equal(count.scope, 'ed');
  assert.equal(count.value, 2);
  assert.equal(count.type, '整数');
  assert.equal(app.flags('constructor').length, 0);
  assert.equal(sb._vars[session.key], stored);
});
