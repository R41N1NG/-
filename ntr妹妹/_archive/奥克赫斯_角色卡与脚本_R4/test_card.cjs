'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const root = __dirname;
const card = JSON.parse(fs.readFileSync(path.join(root, '奥克赫斯_R4配套.json'), 'utf8'));
const oldTest = path.join(root, 'runtime/奥森德/scripts/test_foundation.cjs');
const header = fs.readFileSync(oldTest, 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', header + '\nmodule.exports={createSandbox,makeStorage};')(
  require, path.dirname(oldTest), holder
);
const { createSandbox, makeStorage } = holder.exports;

test('valid V2 card with embedded, enabled, uniquely identified lore entries', () => {
  assert.equal(card.spec, 'chara_card_v2');
  assert.equal(card.spec_version, '2.0');
  const entries = card.data.character_book.entries;
  assert.equal(entries.length, 11);
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  for (const entry of entries) {
    assert.equal(entry.enabled, true);
    assert(Array.isArray(entry.keys));
    assert(entry.content.trim());
    assert.equal(typeof entry.insertion_order, 'number');
  }
});

test('all configured IDs and locations are documented', () => {
  const sb = createSandbox();
  for (const npc of sb.OKH_APP_CONFIG.ROSTER) {
    assert(card.data.description.includes(npc.id));
    assert(card.data.personality.includes(npc.name));
  }
  for (const id of Object.keys(sb.OKH_APP_CONFIG.LOCATIONS)) {
    assert(card.data.description.includes(id));
  }
  assert(card.data.description.includes('manualRelease'));
  assert(card.data.description.includes('<event_resolve'));
  assert(card.data.description.includes('<prologue_step'));
});

test('opening parses without blocked movement or premature milestones', () => {
  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  const w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  const parsed = sb.OKH_APP_PARSE.parseStatusBar(card.data.first_mes);
  assert.equal(parsed.elapsed, 0);
  assert.equal(parsed.endMin, w.timeMin);
  const front = sb.OKH_APP_PARSE.buildFront(card.data.first_mes, w.timeMin, w,
    { config: cfg, locations: sb.OKH_APP_CONFIG.LOCATIONS, canMove: cfg.canMove });
  assert.equal(front.diagnostics.length, 0);
  const state = sb.OKHBackground.advance(w, {
    id: 'card-opening', revision: 'r1', toMin: w.timeMin, interactingIds: front.interactingIds, front
  }, cfg).state;
  assert.equal(state.playerLocation, 'wilds');
  assert.equal(state.flags.arrived_oakhaven, false);
  assert.equal(state.flags.ed_joined, false);
  assert.equal(state.npcs.ed.monitored, false);
  assert.equal(state.npcs.eileen.location, 'manor');
  assert.equal(state.npcs.cecilia.location, 'church');
});

test('example reply uses valid time and tags after the opening', () => {
  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  const w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  const reply = card.data.mes_example.split('{{char}}: ')[1];
  const p = sb.OKH_APP_PARSE.parseStatusBar(reply);
  assert.equal(p.endMin, w.timeMin + p.elapsed);
  const front = sb.OKH_APP_PARSE.buildFront(reply, p.endMin, w,
    { config: cfg, locations: sb.OKH_APP_CONFIG.LOCATIONS, canMove: cfg.canMove });
  assert.equal(front.diagnostics.length, 0);
  const state = sb.OKHBackground.advance(w, {
    id: 'sample', revision: 'r1', toMin: p.endMin, interactingIds: front.interactingIds, front
  }, cfg).state;
  assert.equal(state.timeMin, 1090);
  assert.equal(state.interactingIds.includes('nise'), true);
});

test('pending-event ledger supplies registered IDs and choices, including legacy records', () => {
  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  let w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  w.timeMin = sb.OKH_APP_CONFIG.DAY(8, 14);
  w.flags.arrived_oakhaven = true;
  w.playerLocation = 'inn';
  w.npcs.isna.location = 'inn';
  w.npcs.isna.values.gold_desire = 35;
  w = sb.OKHBackground.advance(w, {
    id: 'notice', revision: 'r1', toMin: w.timeMin, interactingIds: [], front: {}
  }, cfg).state;
  const ledger = sb.OKH_APP_ADAPTER.buildLedger(w);
  assert(ledger.includes('id="isna_tavern_rumor_notice" npc="isna"'));
  assert(ledger.includes('"soothe" / "ignore"'));
  const key = Object.keys(w.bg.eventStates)[0];
  delete w.bg.eventStates[key].instanceId;
  delete w.bg.eventStates[key].occurrence;
  assert(sb.OKH_APP_ADAPTER.buildLedger(w).includes('id="isna_tavern_rumor_notice"'));
  const front = sb.OKH_APP_PARSE.buildFront(
    '<status_bar><event_resolve id="isna_tavern_rumor_notice" npc="isna" outcome="ignore" /></status_bar>',
    w.timeMin, w, { config: cfg }
  );
  w = sb.OKHBackground.advance(w, {
    id: 'choose', revision: 'r1', toMin: w.timeMin, interactingIds: [], front
  }, cfg).state;
  assert.equal(w.bg.eventStates[key].status, 'resolved');
  assert(!sb.OKH_APP_ADAPTER.buildLedger(w).includes('待决事件：id="isna_tavern_rumor_notice"'));
});

test('autostart registers listeners, processes greeting once and preserves existing save', async () => {
  const sb = createSandbox();
  makeStorage(sb);
  const listeners = new Map();
  sb.OKH_APP.configure({
    eventOn: (name, fn) => listeners.set(name, fn),
    eventOff: name => listeners.delete(name),
    events: sb._ctxObj.event_types
  });
  sb._ctxObj.chat = [{ is_user: false, mes: card.data.first_mes }];
  const boot = fs.readFileSync(path.join(root, 'autostart.js'), 'utf8');
  try {
    vm.runInContext(boot, sb);
    await sb.OKH_CARD_READY;
    assert(listeners.has('GENERATION_STARTED'));
    assert(listeners.has('MESSAGE_RECEIVED'));
    const once = JSON.stringify(sb.OKH_APP.world());
    vm.runInContext(boot, sb);
    await sb.OKH_CARD_READY;
    assert.equal(JSON.stringify(sb.OKH_APP.world()), once);
    await sb.OKH_APP.step(10);
    const progressed = JSON.stringify(sb.OKH_APP.world());
    vm.runInContext(boot, sb);
    await sb.OKH_CARD_READY;
    assert.equal(JSON.stringify(sb.OKH_APP.world()), progressed);
  } finally {
    await sb.OKH_APP.stop();
  }
  assert.equal(listeners.size, 0);
});
