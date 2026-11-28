/**
 * @file test_foundation.cjs
 * @updated 2026-11-11 00:12
 * @purpose Adversarial test suite against compiled 奥森德/dist/okh_complete.js covering all 9 initial fixes + R2 5-point code review checks.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const BUNDLE_PATH = path.resolve(__dirname, '../dist/okh_complete.js');
const bundleCode = fs.readFileSync(BUNDLE_PATH, 'utf8');

function createSandbox(chatId = 'chat-test', sharedVars = null) {
  const vars = sharedVars || {};
  const listeners = new Map();
  const ctxObj = {
    chatId,
    chat: [],
    event_types: {
      GENERATION_STARTED: 'GENERATION_STARTED',
      MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
      MESSAGE_EDITED: 'MESSAGE_EDITED',
      MESSAGE_DELETED: 'MESSAGE_DELETED',
      MESSAGE_SWIPED: 'MESSAGE_SWIPED',
      GENERATION_STOPPED: 'GENERATION_STOPPED',
      CHAT_CHANGED: 'CHAT_CHANGED'
    },
    setExtensionPrompt: () => true
  };
  const ctx = {
    console: { log: () => {}, warn: () => {}, error: (...a) => console.error('[SANDBOX]', ...a), group: () => {}, groupEnd: () => {}, table: () => {} },
    Date, Math, JSON, Object, Array, Number, String, Boolean, Set, Map, RegExp, Error, Promise,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    setTimeout, clearTimeout, setInterval, clearInterval,
    SillyTavern: { getContext: () => ctxObj },
    getVariables: () => ({ ...vars }),
    replaceVariables: (next) => {
      for (const k of Object.keys(vars)) delete vars[k];
      Object.assign(vars, next);
      return true;
    },
    getCurrentChatId: () => ctxObj.chatId,
    _listeners: listeners,
    _ctxObj: ctxObj
  };
  ctx.globalThis = ctx;
  ctx.self = ctx;
  ctx._vars = vars;
  vm.createContext(ctx);
  vm.runInContext(bundleCode, ctx, { filename: 'okh_complete.js' });
  return ctx;
}

function makeStorage(ctx, sharedMap = new Map(), injectLog = []) {
  ctx.OKH_APP.configure({
    chatId: 'chat-test',
    storage: {
      get: k => sharedMap.get(k),
      set: (k, v) => { sharedMap.set(k, v); return true; }
    },
    inject: async (text) => { injectLog.push(text); return true; },
    getContext: () => ctx._ctxObj
  });
  return sharedMap;
}

async function runTests() {
  const results = [];
  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log('PASS:', name);
    } catch (err) {
      results.push({ name, ok: false, err });
      console.error('FAIL:', name, '\n', err);
    }
  }

  // 1. Validate config (mode & non-empty text, outcomes restriction, allowCancel/retryOnCancel, node ordering)
  await test('1. Config validation rejects missing text, illegal outcomes, invalid cancel flags & non-increasing nodes', async () => {
    const sb = createSandbox();
    const { OKHBackgroundModules, OKH_APP_CONFIG } = sb;
    const u = OKHBackgroundModules.utils;

    const validCfg = OKH_APP_CONFIG.buildConfig();
    u.validateConfig(validCfg);
    for (const ev of validCfg.events) {
      assert(['result', 'interaction'].includes(ev.mode), `event ${ev.id} invalid mode`);
      assert(typeof ev.text === 'function' || (typeof ev.text === 'string' && ev.text.trim().length > 0), `event ${ev.id} missing text`);
    }

    assert.throws(() => u.validateConfig({
      phases: validCfg.phases, policy: validCfg.policy,
      events: [{ id: 'bad_ev', mode: 'result', scope: 'world', when: {}, text: '' }],
      nodes: []
    }), /事件或节点必须配置模式和文本/);

    assert.throws(() => u.validateConfig({
      phases: validCfg.phases, policy: validCfg.policy,
      events: [{ id: 'bad_outcomes', mode: 'result', scope: 'world', when: {}, text: 'ok', outcomes: { a: { text: 'bad' } } }],
      nodes: []
    }), /只有待互动事件才允许配置 outcomes 选项表/);

    assert.throws(() => u.validateConfig({
      phases: validCfg.phases, policy: validCfg.policy,
      events: [{ id: 'bad_retry', mode: 'interaction', scope: 'world', when: {}, text: 'ok', retryOnCancel: true }],
      nodes: []
    }), /启用 retryOnCancel 时必须同时声明 allowCancel: true/);

    assert.throws(() => u.validateConfig({
      phases: validCfg.phases, policy: validCfg.policy,
      events: [], nodes: [{ id: 'bad_node', mode: 'result', fromStage: 2, toStage: 2, when: {}, text: 'x' }]
    }), /节点阶段必须向前推进/);
  });

  // 2. Interactive choice separated from stage-advancing NODES (gulan_final_rescue_prompt vs gulan_stage_3)
  await test('2. gulan_final_rescue_prompt stays stage 2 & rescue/fail outcomes work cleanly', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    await sb.OKH_APP.init();
    const { OKHBackgroundModules, OKH_APP_CONFIG, OKHBackground } = sb;
    const u = OKHBackgroundModules.utils;

    const cfg = OKH_APP_CONFIG.buildConfig();
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.flags.ed_joined = true;
    w.flags.arrived_oakhaven = true;
    w.playerLocation = 'inn';
    w.npcs.gulan.location = 'inn';
    w.npcs.gulan.stage = 2;
    w.npcs.gulan.values.blood_density = 82;
    w.npcs.gulan.values.affection = 92;

    const promptKey = u.key('event', 'gulan_final_rescue_prompt', 'gulan');
    // Daytime at inn must NOT trigger night-only final rescue prompt
    w.timeMin = OKH_APP_CONFIG.DAY(1, 8);
    w = OKHBackground.advance(w, {
      id: 'm0', revision: 'r0', toMin: w.timeMin, interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.bg.eventStates[promptKey], undefined, 'Daytime must not trigger night-only gulan_final_rescue_prompt');

    // Away from inn at night must NOT trigger
    w.timeMin = OKH_APP_CONFIG.DAY(1, 18);
    w.playerLocation = 'town';
    w = OKHBackground.advance(w, {
      id: 'm0b', revision: 'r0b', toMin: w.timeMin, interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.bg.eventStates[promptKey], undefined, 'Different location must not trigger gulan_final_rescue_prompt');

    // Same location (inn) at night triggers prompt
    w.playerLocation = 'inn';
    w = OKHBackground.advance(w, {
      id: 'm1', revision: 'r1', toMin: w.timeMin + 5, interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.stage, 2);
    assert.strictEqual(w.bg.eventStates[promptKey]?.status, 'pending');

    w = OKHBackground.advance(w, {
      id: 'm2', revision: 'r2', toMin: w.timeMin + 10, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'gulan_final_rescue_prompt', npcId: 'gulan', outcome: 'rescue' }] }
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.stage, 2);
    assert.strictEqual(w.npcs.gulan.values.blood_density, 72);
    assert.strictEqual(w.npcs.gulan.flags.gulan_rescue_count, 1);

    // Step 2 (threshold 90 -> 80) and Step 3 (threshold 100 -> pure bond, blocks fall)
    w.npcs.gulan.values.blood_density = 90;
    w = OKHBackground.advance(w, { id: 'm3', revision: 'r3', toMin: w.timeMin + 15, interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.bg.eventStates[promptKey]?.status, 'pending');
    w = OKHBackground.advance(w, {
      id: 'm4', revision: 'r4', toMin: w.timeMin + 20, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'gulan_final_rescue_prompt', npcId: 'gulan', outcome: 'rescue' }] }
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.values.blood_density, 80);
    assert.strictEqual(w.npcs.gulan.flags.gulan_rescue_count, 2);

    w.npcs.gulan.values.blood_density = 100;
    w = OKHBackground.advance(w, { id: 'm5', revision: 'r5', toMin: w.timeMin + 25, interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.bg.eventStates[promptKey]?.status, 'pending');
    w = OKHBackground.advance(w, {
      id: 'm6', revision: 'r6', toMin: w.timeMin + 30, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'gulan_final_rescue_prompt', npcId: 'gulan', outcome: 'rescue' }] }
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.values.blood_density, 100);
    assert.strictEqual(w.npcs.gulan.flags.gulan_rescue_count, 3);
    assert.strictEqual(w.npcs.gulan.flags.gulan_pure_bond_done, true);
    assert.strictEqual(w.npcs.gulan.stage, 2);

    // Once count === 3, leaving inn does NOT trigger gulan_final_fall_dark
    w.playerLocation = 'wilds';
    w = OKHBackground.advance(w, { id: 'm7', revision: 'r7', toMin: w.timeMin + 35, interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.npcs.gulan.flags.gulan_final_fall_done, undefined);
    assert.strictEqual(w.npcs.gulan.stage, 2);

    let wFail = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wFail.flags.arrived_oakhaven = true;
    wFail.timeMin = OKH_APP_CONFIG.DAY(1, 18);
    wFail.playerLocation = 'inn';
    wFail.npcs.gulan.location = 'inn';
    wFail.npcs.gulan.stage = 2;
    wFail.npcs.gulan.values.blood_density = 82;
    wFail.npcs.gulan.values.affection = 92;
    wFail = OKHBackground.advance(wFail, {
      id: 'f1', revision: 'r1', toMin: wFail.timeMin, interactingIds: [], front: {}
    }, cfg).state;
    wFail = OKHBackground.advance(wFail, {
      id: 'f2', revision: 'r2', toMin: wFail.timeMin + 5, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'gulan_final_rescue_prompt', npcId: 'gulan', outcome: 'fail' }] }
    }, cfg).state;
    assert.strictEqual(wFail.npcs.gulan.flags.gulan_final_fall_done, true);
    assert.strictEqual(wFail.npcs.gulan.stage, 3);
    assert.strictEqual(wFail.npcs.gulan.values.affection, 50, 'Female entering stage 3 drops affection from 92 to 50');
    assert.strictEqual(wFail.npcs.gulan.flags.affection_locked, true, 'Female stage 3 locks affection');
  });

  // 3. Nightly rollover, multi-day catch-up, room protection & 5-day neglect
  await test('3. Unified 00:00 rollover dedup, multi-day catch-up, room protection & 5-day neglect', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP_CONFIG, OKH_APP_TIME, OKHBackground } = sb;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.flags.ed_joined = true;
    w.flags.arrived_oakhaven = true;
    w.npcs.ed.monitored = true;
    w.playerLocation = 'inn';
    w.npcs.gulan.location = 'inn';
    w.npcs.ed.location = 'inn';
    w.npcs.isna.location = 'inn';
    w.timeMin = DAY(1, 21);

    const wReject = OKHBackground.advance(w, {
      id: 'd1n_low', revision: 'r0', toMin: w.timeMin, interactingIds: [],
      front: { room: { npc: 'gulan', state: 'together' } }
    }, cfg).state;
    assert.strictEqual(wReject.flags.playerRoomTarget, null);

    w.npcs.gulan.values.affection = 92;
    w = OKHBackground.advance(w, {
      id: 'd1n', revision: 'r1', toMin: DAY(2, 2), interactingIds: [],
      front: { room: { npc: 'gulan', state: 'together', at: 'start' } }
    }, cfg).state;
    assert.strictEqual(w.flags.playerRoomTarget, 'gulan');
    assert.strictEqual(w.npcs.gulan.values.blood_density, 0, 'Same-room protection blocks Ed midnight blood_density gain');
    assert.strictEqual(w.npcs.isna.values.gold_desire, 26);

    w = OKHBackground.advance(w, {
      id: 'd2m', revision: 'r2', toMin: DAY(2, 7), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.values.blood_density, 0);
    assert.strictEqual(w.npcs.isna.values.gold_desire, 27);
    assert.strictEqual(w.flags.playerRoomTarget, null);

    w = OKHBackground.advance(w, {
      id: 'skip5', revision: 'r3', toMin: DAY(7, 5), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.values.blood_density, 5);
    assert.strictEqual(w.npcs.gulan.values.affection, 92, 'Gulan no longer decays from 5-day neglect');
    assert.strictEqual(w.npcs.nise.values.affection, 69, 'Nise loses 1 affection after 5 days without interaction');
    assert.strictEqual(w.npcs.nise.values.curiosity, 45, 'Nise browses town once per day across Days 2..6 (+5)');
    assert.strictEqual(w.npcs.isna.values.gold_desire, 31);
    assert.strictEqual(w.npcs.isna.flags.lastNightSettledDay, 6);

    const directSnapshot = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    directSnapshot.flags.arrived_oakhaven = true;
    directSnapshot.npcs.isna.flags.isna_worked_today = true;
    directSnapshot.npcs.isna.flags.lastNightSettledDay = 1;
    const isnaGoldAdds = OKH_APP_TIME.settleTimeEffects({
      world: directSnapshot, fromMin: DAY(2, 18), toMin: DAY(5, 8)
    }).filter(c => c.target === 'isna' && c.add?.gold_desire).reduce((acc, c) => acc + c.add.gold_desire, 0);
    assert.strictEqual(isnaGoldAdds, 2);
  });

  // 4 & 8. Option A: isna_odd_job & steady_work avoid night +1; return_inn closes loop
  await test('4 & 8. isna_odd_job & steady_work avoid midnight double-add; return_inn returns NPC home at night', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP_CONFIG, OKHBackground } = sb;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.flags.arrived_oakhaven = true;
    w.playerLocation = 'inn';
    w.npcs.isna.location = 'inn';
    w.timeMin = DAY(3, 8);

    w = OKHBackground.advance(w, {
      id: 'odd1', revision: 'r1', toMin: DAY(3, 18), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.isna.values.gold_desire, 26);
    assert.strictEqual(w.npcs.isna.flags.isna_worked_today, true);

    w = OKHBackground.advance(w, {
      id: 'odd2', revision: 'r2', toMin: DAY(4, 4), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.isna.values.gold_desire, 26);
    assert.strictEqual(w.npcs.isna.flags.isna_worked_today, false);
    assert.strictEqual(w.npcs.isna.location, 'inn');

    let wSw = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wSw.flags.arrived_oakhaven = true;
    wSw.playerLocation = 'inn';
    wSw.npcs.isna.location = 'inn';
    wSw.npcs.isna.values.gold_desire = 26;
    wSw.timeMin = DAY(4, 6);

    wSw = OKHBackground.advance(wSw, {
      id: 'sw1', revision: 'r3', toMin: DAY(4, 15), interactingIds: ['isna'],
      front: {
        playerLocation: 'wilds', playerLocationAt: 'start',
        npcs: { isna: { location: 'wilds', locationAt: 'start' } },
        bonds: [{ npc: 'isna', kind: 'steady_work', at: 'end' }]
      }
    }, cfg).state;
    assert.strictEqual(wSw.npcs.isna.values.gold_desire, 26);
    assert.strictEqual(wSw.npcs.isna.values.affection, 62);
    assert.strictEqual(wSw.npcs.isna.flags.isna_worked_today, true);

    wSw = OKHBackground.advance(wSw, {
      id: 'sw2', revision: 'r4', toMin: DAY(5, 4), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(wSw.npcs.isna.values.gold_desire, 26);
    assert.strictEqual(wSw.npcs.isna.location, 'inn');
  });

  // 5. Interact != auto-intervention, comfort receipt ordering, bond bans numbers
  await test('5. Interact != auto-intervention, same-phase comfort + soothed, bond rejects numbers', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    await sb.OKH_APP.init();
    const { OKHBackgroundModules, OKH_APP_CONFIG, OKH_APP_PARSE, OKHBackground } = sb;
    const u = OKHBackgroundModules.utils;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    assert.throws(() => OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="isna" kind="comfort" delta="50" /></status_bar>',
      DAY(8, 12), OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg),
      { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    ), /禁止携带数值字段/);

    let w1 = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w1.flags.arrived_oakhaven = true;
    w1.playerLocation = 'inn';
    w1.npcs.isna.location = 'inn';
    w1.npcs.isna.values.gold_desire = 32;
    w1.timeMin = DAY(8, 12);

    w1 = OKHBackground.advance(w1, {
      id: 'int1', revision: 'r1', toMin: DAY(8, 12), interactingIds: ['isna'], front: { interactingIds: ['isna'] }
    }, cfg).state;
    const noticeKey = u.key('event', 'isna_tavern_rumor_notice', 'isna');
    assert.strictEqual(w1.bg.eventStates[noticeKey]?.status, 'pending');
    assert.strictEqual(w1.npcs.isna.values.gold_desire, 32);

    w1 = OKHBackground.advance(w1, {
      id: 'int2', revision: 'r2', toMin: DAY(8, 13), interactingIds: [],
      front: OKH_APP_PARSE.buildFront('<status_bar><event_resolve id="isna_tavern_rumor_notice" outcome="soothe" /></status_bar>', DAY(8, 13), w1, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS })
    }, cfg).state;
    assert.strictEqual(w1.npcs.isna.values.gold_desire, 37);
    assert.strictEqual(w1.npcs.isna.values.affection, 62);

    let w2 = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w2.flags.arrived_oakhaven = true;
    w2.playerLocation = 'inn';
    w2.npcs.isna.location = 'inn';
    w2.npcs.isna.values.gold_desire = 35;
    w2.timeMin = DAY(8, 12);
    w2 = OKHBackground.advance(w2, {
      id: 'pre1', revision: 'r1', toMin: DAY(8, 12), interactingIds: [],
      front: OKH_APP_PARSE.buildFront('<status_bar><bond npc="isna" kind="comfort" /></status_bar>', DAY(8, 12), w2, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS })
    }, cfg).state;
    assert.strictEqual(w2.bg.fired[u.key('event', 'isna_tavern_rumor_soothed', 'isna')], true);
    assert.strictEqual(w2.npcs.isna.values.gold_desire, 38);
  });

  // 6. R2 Audit Point 1: Cross-midnight time-inversion prevention & activity+move timestamp atomicity
  await test('6. Cross-midnight 23:50->00:10 default end receipt prevents time inversion; explicit at overrides accurately', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP_CONFIG, OKH_APP_PARSE, OKHBackground } = sb;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    // Case A: 1日 23:50 -> 2日 00:10, default end (<move> & <bond comfort>) MUST NOT rewrite Night 1!
    let wA = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wA.flags.arrived_oakhaven = true;
    wA.playerLocation = 'town';
    wA.npcs.isna.location = 'town';
    wA.timeMin = DAY(1, 23, 50);

    const endMin = DAY(2, 0, 10);
    const frontA = OKH_APP_PARSE.buildFront(
      '<status_bar><time elapsed="20" end="2日 00:10"/><move to="inn"/><move npc="isna" to="inn"/><bond npc="isna" kind="comfort"/></status_bar>',
      endMin, wA, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS, canMove: OKH_APP_CONFIG.canMove }
    );
    wA = OKHBackground.advance(wA, { id: 'cmA', revision: 'r1', toMin: endMin, interactingIds: [], front: frontA }, cfg).state;

    // Day 1 midnight (+1 empty bag -> 26) settled BEFORE 00:10 Day 2 comfort (-2 -> 24)!
    assert.strictEqual(wA.npcs.isna.values.gold_desire, 24, '25 +1 (Night 1) -2 (Day 2 comfort) = 24');
    assert.strictEqual(wA.npcs.isna.flags.lastNightSettledDay, 1);
    assert.strictEqual(wA.npcs.isna.flags.isna_comforted_today, true, 'comfort landed on Day 2, preserved after 00:00');
    assert.strictEqual(wA.npcs.isna.flags.lastComfortMin, DAY(2, 0, 10), 'lastComfortMin must record 00:10 Day 2');
    assert.strictEqual(wA.npcs.isna.flags.dailyAffectionDay, 2);

    // Case B: Explicit at="1日 23:55" settles BEFORE 00:00 -> exempts Night 1 (+0) and clears for Day 2!
    let wB = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wB.flags.arrived_oakhaven = true;
    wB.playerLocation = 'town';
    wB.npcs.isna.location = 'town';
    wB.timeMin = DAY(1, 23, 50);
    const frontB = OKH_APP_PARSE.buildFront(
      '<status_bar><time elapsed="20" end="2日 00:10"/><move to="inn" at="1日 23:55"/><move npc="isna" to="inn" at="1日 23:55"/><bond npc="isna" kind="comfort" at="1日 23:55"/></status_bar>',
      endMin, wB, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS, canMove: OKH_APP_CONFIG.canMove }
    );
    wB = OKHBackground.advance(wB, { id: 'cmB', revision: 'r1', toMin: endMin, interactingIds: [], front: frontB }, cfg).state;
    assert.strictEqual(wB.npcs.isna.values.gold_desire, 23, '25 -2 (Day 1 23:55) +0 (Night 1 exempted) = 23');
    assert.strictEqual(wB.npcs.isna.flags.isna_comforted_today, false, 'Day 1 comfort flag cleared at 00:00');
    assert.strictEqual(wB.npcs.isna.flags.lastComfortMin, DAY(1, 23, 55));

    // Case C: Out-of-window `at` throws cleanly
    assert.throws(() => OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="isna" kind="comfort" at="1日 23:45"/></status_bar>',
      endMin, wB, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    ), /超出本轮区间/);

    // Case D: <activity op="start" to="town" at="2日 08:00"/> keeps move & activity synchronized atomically
    let wAct = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wAct.flags.arrived_oakhaven = true;
    wAct.playerLocation = 'inn';
    wAct.npcs.gulan.location = 'inn';
    wAct.timeMin = DAY(2, 7, 0);
    const frontAct = OKH_APP_PARSE.buildFront(
      '<status_bar><activity op="start" npc="gulan" kind="important" rule="manualRelease" label="巡查城门" to="town" at="2日 08:00"/></status_bar>',
      DAY(2, 9, 0), wAct, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS, canMove: OKH_APP_CONFIG.canMove }
    );
    wAct = OKHBackground.advance(wAct, { id: 'act1', revision: 'r1', toMin: DAY(2, 9, 0), interactingIds: [], front: frontAct }, cfg).state;
    assert.strictEqual(wAct.npcs.gulan.location, 'town');
    assert.strictEqual(wAct.npcs.gulan.activity?.startedAt, DAY(2, 8, 0), 'activity.startedAt matches move timestamp 08:00');

    // Case E (R3 Point 1): Cross-midnight 23:50->00:10 prologue arrival defaults to END (00:10):
    // MUST NOT unlock town or settle Night 1 at 00:00 midnight!
    let wProCross = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wProCross.timeMin = DAY(1, 23, 50);
    const frontProCross = OKH_APP_PARSE.buildFront(
      '<status_bar><time elapsed="20" end="2日 00:10"/><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>',
      endMin, wProCross, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS, canMove: OKH_APP_CONFIG.canMove }
    );
    wProCross = OKHBackground.advance(wProCross, { id: 'proCross1', revision: 'r1', toMin: endMin, interactingIds: [], front: frontProCross }, cfg).state;
    assert.strictEqual(wProCross.flags.arrived_oakhaven, true, 'arrived_oakhaven set at 00:10 end');
    assert.strictEqual(wProCross.playerLocation, 'inn');
    assert.strictEqual(wProCross.npcs.isna.location, 'inn');
    assert.strictEqual(wProCross.npcs.isna.values.gold_desire, 25, 'Night 1 midnight (00:00) must NOT charge empty bag before 00:10 arrival');
    assert.strictEqual(wProCross.npcs.isna.flags.lastNightSettledDay, 1);

    // Case F (R3 Point 1): Already arrived, 23:50->00:10 <prologue_step flag="ed_joined"/> defaults to END (00:10):
    // Night 1 (00:00) must NOT grant Gulan +1 blood_density before Ed actually joined at 00:10!
    let wEdCross = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wEdCross.flags.arrived_oakhaven = true;
    wEdCross.playerLocation = 'inn';
    wEdCross.npcs.gulan.location = 'inn';
    wEdCross.timeMin = DAY(1, 23, 50);
    const frontEdCross = OKH_APP_PARSE.buildFront(
      '<status_bar><time elapsed="20" end="2日 00:10"/><prologue_step flag="ed_joined"/></status_bar>',
      endMin, wEdCross, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS, canMove: OKH_APP_CONFIG.canMove }
    );
    wEdCross = OKHBackground.advance(wEdCross, { id: 'edCross1', revision: 'r1', toMin: endMin, interactingIds: [], front: frontEdCross }, cfg).state;
    assert.strictEqual(wEdCross.flags.ed_joined, true);
    assert.strictEqual(wEdCross.npcs.ed.monitored, true);
    assert.strictEqual(wEdCross.npcs.gulan.values.blood_density, 0, 'Night 1 (00:00) must NOT gain blood before 00:10 ed_joined');

    // Case G (R3 Point 2): Loaded/migrated state right before phase boundary (Day 15 16:50 afternoon -> 17:10 night)
    // with ZERO start receipts: unconditional start refresh MUST NOT miss afternoon-only events!
    let wBound = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wBound.flags.arrived_oakhaven = true;
    wBound.playerLocation = 'inn';
    wBound.npcs.gulan.location = 'training_grounds';
    wBound.npcs.isna.location = 'inn';
    wBound.npcs.nise.location = 'inn';
    wBound.npcs.aurora.location = 'inn';
    wBound.timeMin = DAY(15, 16, 50);
    wBound = OKHBackground.advance(wBound, { id: 'bnd1', revision: 'r1', toMin: DAY(15, 17, 10), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wBound.bg.fired[sb.OKHBackgroundModules.utils.key('event', 'dragon_blood_awakening_resist_low', 'gulan')], true, 'Start refresh at 16:50 must fire afternoon-only event before crossing 17:00 night boundary');
    assert.strictEqual(wBound.bg.fired[sb.OKHBackgroundModules.utils.key('event', 'lord_hiring', null)], true, 'Start refresh at 16:50 must also fire world afternoon event');
    assert.strictEqual(wBound.flags.bloody_arena, true);
  });

  // 7. R2 Audit Point 2: Duplicate reply, swipe/regenerate rollback, cross-midnight rollback, cold VM reload
  await test('7. Duplicate message, swipe regenerate, cross-midnight rollback & cold reload consistency', async () => {
    const storeMap = new Map();
    const sharedVars = {};

    const sb1 = createSandbox('chat-test', sharedVars);
    makeStorage(sb1, storeMap);
    await sb1.OKH_APP.init();
    const DAY = sb1.OKH_APP_CONFIG.DAY;

    // Seed world right before midnight Day 1
    let seed = sb1.OKH_APP.world();
    seed.flags.ed_joined = true;
    seed.flags.arrived_oakhaven = true;
    seed.npcs.ed.monitored = true;
    seed.playerLocation = 'inn';
    seed.npcs.gulan.location = 'inn';
    seed.npcs.ed.location = 'inn';
    seed.npcs.isna.location = 'inn';
    seed.timeMin = DAY(1, 23, 40);
    await sb1.OKH_APP.save(seed, { debug: true });

    // Message 0 (init) & Message 1 crossing 00:00 midnight
    sb1._ctxObj.chat = [
      { is_user: false, is_system: false, mes: '<status_bar></status_bar>', swipe_id: 0 },
      { is_user: true, is_system: false, mes: '过夜', swipe_id: 0 },
      { is_user: false, is_system: false, mes: '<status_bar><time elapsed="40" end="2日 00:20"/></status_bar>', swipe_id: 0 }
    ];
    const m0 = await sb1.OKH_APP.onMessage(0);
    assert.strictEqual(m0.advanced, true);

    await sb1.OKH_APP.beforeGeneration();
    const m1 = await sb1.OKH_APP.onMessage(2);
    assert.strictEqual(m1.advanced, true);
    const snapAfterMidnight = sb1.OKH_APP.world();
    assert.strictEqual(snapAfterMidnight.npcs.isna.values.gold_desire, 26);
    assert.strictEqual(snapAfterMidnight.npcs.isna.flags.lastNightSettledDay, 1);

    // 7A. Re-submitting exact same message -> duplicate, zero mutation
    const m1Dup = await sb1.OKH_APP.onMessage(2);
    assert.strictEqual(m1Dup.duplicate, true);
    assert.strictEqual(sb1.OKH_APP.world().npcs.isna.values.gold_desire, 26);

    // 7B. Swipe/Edit message 2 to add pre-midnight comfort -> rollback before midnight & re-evaluate!
    sb1._ctxObj.chat[2] = {
      is_user: false, is_system: false,
      mes: '<status_bar><time elapsed="40" end="2日 00:20"/><bond npc="isna" kind="comfort" at="1日 23:55"/></status_bar>',
      swipe_id: 1
    };
    await sb1.OKH_APP.syncHistory();
    const afterSwipe = sb1.OKH_APP.world();
    assert.strictEqual(afterSwipe.npcs.isna.values.gold_desire, 23, 'Swipe rollback replays Day 1 comfort -2 & exempts Night 1');
    assert.strictEqual(afterSwipe.npcs.isna.flags.lastNightSettledDay, 1);

    // Swipe BACK to swipe_id: 0 (reconcile -> rollback across 00:00 -> exact same result as first run!)
    sb1._ctxObj.chat[2] = {
      is_user: false, is_system: false,
      mes: '<status_bar><time elapsed="40" end="2日 00:20"/></status_bar>',
      swipe_id: 0
    };
    await sb1.OKH_APP.syncHistory();
    const afterRollbackReplay = sb1.OKH_APP.world();
    assert.strictEqual(afterRollbackReplay.npcs.isna.values.gold_desire, snapAfterMidnight.npcs.isna.values.gold_desire);
    assert.strictEqual(afterRollbackReplay.npcs.isna.flags.lastNightSettledDay, 1);
    assert.strictEqual(afterRollbackReplay.npcs.gulan.values.blood_density, snapAfterMidnight.npcs.gulan.values.blood_density);

    // 7C. Trigger Day 8 afternoon interactive prompt, cold-reload into BRAND NEW VM sandbox, resolve smoothly!
    const sb2 = createSandbox('chat-test', sharedVars);
    makeStorage(sb2, storeMap);
    const reloaded = sb2.OKH_APP.world();
    assert.strictEqual(reloaded.npcs.isna.flags.lastNightSettledDay, 1);
    assert.strictEqual(reloaded.npcs.isna.values.gold_desire, 26);
    assert.strictEqual(reloaded.npcs.gulan.values.blood_density, 1);
    assert.strictEqual(reloaded.timeMin, DAY(2, 0, 20));
  });

  // 8. R2 Audit Point 3: Event resolve identity, condition validation, allowCancel/retryOnCancel, atomic failure, supersede delivered
  await test('8. Event resolution enforces conditions, target identity, allowCancel, supersede delivered & atomic fail', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKHBackgroundModules, OKH_APP_CONFIG, OKH_APP_PARSE, OKHBackground } = sb;
    const u = OKHBackgroundModules.utils;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    // 8A. Wrong target, untriggered, cancel forbidden on allowCancel:false, out-of-location condition failure (atomic!)
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.flags.arrived_oakhaven = true;
    w.playerLocation = 'town';
    w.npcs.isna.location = 'town';
    w.npcs.isna.values.gold_desire = 55;
    w.timeMin = DAY(9, 21);
    w = OKHBackground.advance(w, { id: 'ev1', revision: 'r1', toMin: w.timeMin, interactingIds: [], front: {} }, cfg).state;
    const alleyKey = u.key('event', 'isna_alley_lockpick_spot', 'isna');
    assert.strictEqual(w.bg.eventStates[alleyKey]?.status, 'pending');

    // Deliver the prompt in a generation cycle so queue status becomes 'delivered'
    w = OKHBackground.ack(w, [alleyKey], 'gen1');
    assert.strictEqual(w.bg.queue.find(q => q.id === alleyKey).status, 'delivered');

    // Cross-character hijack rejected
    assert.throws(() => OKHBackground.advance(w, {
      id: 'badTgt', revision: 'r2', toMin: w.timeMin + 5, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'isna_alley_lockpick_spot', npcId: 'gulan', outcome: 'intercept' }] }
    }, cfg), /事件目标角色不匹配/);

    // Forbidden cancel rejected (cannot dodge negative branch!)
    assert.throws(() => OKHBackground.advance(w, {
      id: 'badCancel', revision: 'r2', toMin: w.timeMin + 5, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'isna_alley_lockpick_spot', npcId: 'isna', outcome: 'cancel' }] }
    }, cfg), /不允许取消/);

    // Condition failure: player moved to 'inn', CANNOT retroactively 'intercept' at 'town'!
    const wSnapshotBeforeFail = u.clone(w);
    assert.throws(() => OKHBackground.advance(w, {
      id: 'badCond', revision: 'r2', toMin: w.timeMin + 5, interactingIds: [],
      front: {
        playerLocation: 'inn', playerLocationAt: 'start',
        resolveEvents: [{ eventId: 'isna_alley_lockpick_spot', npcId: 'isna', outcome: 'intercept', at: 'start' }]
      }
    }, cfg), /当前条件不满足该事件选项：intercept/);
    assert.deepStrictEqual(w, wSnapshotBeforeFail, 'Failed resolve leaves zero mutations on world');

    // Direct batch atomicity check on events.resolve (valid #1 + invalid #2 must rollback #1 cleanly!)
    const eventsMod = OKHBackgroundModules.events({
      utils: u,
      rules: OKHBackgroundModules.rules({ utils: u }),
      effects: OKHBackgroundModules.effects({ utils: u })
    });
    assert.throws(() => eventsMod.resolve(w, [
      { eventId: 'isna_alley_lockpick_spot', npcId: 'isna', outcome: 'intercept' },
      { eventId: 'unknown_ev', npcId: null, outcome: 'x' }
    ], cfg, { world: w, blockedIds: new Set() }), /不存在/);
    assert.strictEqual(w.bg.eventStates[alleyKey].status, 'pending', 'Batch rollback restored pending status');
    assert.strictEqual(w.npcs.isna.values.gold_desire, 55, 'Batch rollback restored gold_desire');

    // Now valid intercept: must supersede even from 'delivered', cannot replay different outcome, idempotent same outcome
    w = OKHBackground.advance(w, {
      id: 'ev2', revision: 'r2', toMin: w.timeMin + 10, interactingIds: [],
      front: OKH_APP_PARSE.buildFront('<status_bar><event_resolve id="isna_alley_lockpick_spot" outcome="intercept" /></status_bar>', w.timeMin + 10, w, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS })
    }, cfg).state;
    assert.strictEqual(w.bg.eventStates[alleyKey].status, 'resolved');
    assert.strictEqual(w.bg.queue.find(q => q.id === alleyKey).status, 'superseded', 'Delivered prompt must transition to superseded');
    assert.strictEqual(w.npcs.isna.values.gold_desire, 60);

    // Repeat identical resolve -> idempotent (stays 60, not 65); different outcome throws
    w = OKHBackground.advance(w, {
      id: 'ev3', revision: 'r3', toMin: w.timeMin + 5, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'isna_alley_lockpick_spot', npcId: 'isna', outcome: 'intercept' }] }
    }, cfg).state;
    assert.strictEqual(w.npcs.isna.values.gold_desire, 60);

    assert.throws(() => OKHBackground.advance(w, {
      id: 'ev4', revision: 'r4', toMin: w.timeMin + 5, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'isna_alley_lockpick_spot', npcId: 'isna', outcome: 'miss' }] }
    }, cfg), /事件已经处理，不能变更结果/);

    // 8B. Explicit allowCancel + retryOnCancel test
    const retryCfg = {
      ...cfg,
      events: [
        ...cfg.events,
        {
          id: 'test_retry_prompt',
          mode: 'interaction',
          scope: 'world',
          allowCancel: true,
          retryOnCancel: true,
          when: { worldFlags: { arrived_oakhaven: true } },
          text: '可推迟再触发测试提示',
          outcomes: { accept: { text: '已接受' } }
        }
      ]
    };
    let wr = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), retryCfg);
    wr.flags.arrived_oakhaven = true;
    wr = OKHBackground.advance(wr, { id: 'rt1', revision: 'r1', toMin: wr.timeMin, interactingIds: [], front: {} }, retryCfg).state;
    const rtKey = u.key('event', 'test_retry_prompt', null);
    assert.strictEqual(wr.bg.eventStates[rtKey].status, 'pending');
    wr = OKHBackground.advance(wr, {
      id: 'rt2', revision: 'r2', toMin: wr.timeMin + 10, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'test_retry_prompt', npcId: null, outcome: 'cancel' }] }
    }, retryCfg).state;
    // Cancelled + retryOnCancel clears fired -> immediately re-evaluated & pending again at end of turn!
    assert.strictEqual(wr.bg.eventStates[rtKey].status, 'pending');
    const retryInstanceId = wr.bg.eventStates[rtKey].instanceId;
    assert.notStrictEqual(retryInstanceId, rtKey, 'Retry must use a new occurrence ID');
    const pendingPrompts = OKHBackground.prepare(wr, 8).ids.filter(id => id === retryInstanceId);
    assert.strictEqual(pendingPrompts.length, 1);
  });

  // 9. Ed non-stage & normalize-before-validate ordering in okh_api
  await test('9. Ed hasStage:false & okh_api.init normalizes stale stage before validateWorld', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP, OKH_APP_CONFIG, OKHBackground } = sb;

    // Raw world where Ed accidentally has stage: 0 should cleanly normalize in OKHBackground.init
    const rawWithStageOnEd = OKH_APP_CONFIG.buildInitialWorld();
    rawWithStageOnEd.npcs.ed.stage = 0;
    const normalizedInit = OKHBackground.init(rawWithStageOnEd, OKH_APP_CONFIG.buildConfig());
    assert.strictEqual(normalizedInit.npcs.ed.stage, undefined);

    const w = await OKH_APP.init();
    assert.strictEqual(w.npcs.ed.hasStage, false);
    assert.strictEqual(w.npcs.ed.stage, undefined);
    assert.strictEqual(w.npcs.ed.monitored, false);
    assert(!OKH_APP.ledger().includes('爱德'));

    await OKH_APP.step(30, { text: '<status_bar><time elapsed="30" /><prologue_step flag="ed_joined" /></status_bar>' });
    const w2 = OKH_APP.world();
    assert.strictEqual(w2.npcs.ed.monitored, true);
    assert.strictEqual(w2.npcs.ed.stage, undefined);
    assert(OKH_APP.HUD.buildWatchHtml(w2).includes('｜—｜'));
    assert.strictEqual(OKH_APP.status().find(r => r.姓名 === '爱德').阶段, '—');
  });

  // 10. R2 Audit Point 4 & 5: Idempotent double migration, pending/activity conversion, checkpoint rollback, error preservation, decoupling
  await test('10. Double-migration idempotency, active/pending preservation, checkpoint rollback, fail preservation & prologue 3-locks', async () => {
    const sb = createSandbox();
    const store = makeStorage(sb);
    const { OKH_APP, OKH_APP_CONFIG, OKH_APP_MIGRATE, OKHBackground } = sb;
    const u = sb.OKHBackgroundModules.utils;

    const firedKey = u.key('event', 'lord_hiring', null);
    const pendEventKey = u.key('event', 'isna_tavern_rumor_notice', 'isna');
    const legacyBefore = {
      timeMin: OKH_APP_CONFIG.DAY(8, 10),
      playerLocation: 'inn',
      interactingIds: [],
      flags: {},
      bg: { version: 2, revision: 3, receipts: { r0: u.signature({ revision: 'rev0', toMin: OKH_APP_CONFIG.DAY(8, 10), interactingIds: [], front: null }) }, settled: {}, fired: { [firedKey]: true }, queue: [], generations: {} },
      npcs: {
        gulan: {
          id: 'gulan', name: '古兰', monitored: true, alive: true, location: 'inn', stage: 1,
          values: { blood_density: 22, affection: 76, corruption: 80, sanity: 50, need: 40 },
          plan: [], nodePlan: ['stage_1'], activity: null, activityHistory: {}, nodeStates: { stage_1: { status: 'fired', at: 1800 } }, flags: {}
        },
        isna: {
          id: 'isna', name: '伊丝娜', monitored: true, alive: true, location: 'inn', stage: 0,
          values: { gold_desire: 35, affection: 60 },
          plan: [], nodePlan: [], activity: null, activityHistory: {}, nodeStates: {}, flags: {}
        }
      }
    };

    const legacyCurrent = {
      timeMin: OKH_APP_CONFIG.DAY(8, 12),
      playerLocation: 'inn',
      interactingIds: [],
      flags: {},
      bg: {
        version: 2,
        revision: 4,
        receipts: { r0: legacyBefore.bg.receipts.r0, r1: u.signature({ revision: 'rev1', toMin: OKH_APP_CONFIG.DAY(8, 12), interactingIds: [], front: null }) },
        settled: {},
        fired: { [firedKey]: true, [pendEventKey]: true },
        queue: [{ id: pendEventKey, definitionId: 'isna_tavern_rumor_notice', kind: 'event', mode: 'interaction', npcId: 'isna', text: '旧待选提示', status: 'pending', at: OKH_APP_CONFIG.DAY(8, 12) }],
        generations: {}
      },
      npcs: {
        gulan: {
          id: 'gulan', name: '古兰', monitored: true, alive: true,
          location: 'inn', stage: 1,
          values: { blood_density: 24, affection: 76, corruption: 88, sanity: 40, need: 55, pride: 10 },
          plan: [], nodePlan: ['stage_1', 'stage_2', 'stage_3'],
          activity: { id: 'legacy_act', kind: 'important', label: '旧任务', source: 'narrative', startedAt: OKH_APP_CONFIG.DAY(8, 10), releaseRule: 'deletedOldRule' },
          activityHistory: {},
          nodeStates: { stage_1: { status: 'fired', at: 1800 } },
          flags: {}, lastAction: null
        },
        nise: {
          id: 'nise', name: '妮丝', monitored: true, alive: true,
          location: 'inn', stage: 0,
          values: { curiosity: 12, exposure: 30, sanity: 70 },
          plan: [], nodePlan: [], activity: null, activityHistory: {}, nodeStates: {}, flags: {}, lastAction: null
        },
        ed: {
          id: 'ed', name: '爱德', monitored: true, alive: true, location: 'inn', stage: 0,
          values: { need: 10 }, plan: [], nodePlan: [], activity: null, activityHistory: {}, nodeStates: {}, flags: {}
        }
      }
    };

    // 10A. Idempotency check on migrateWorld(migrateWorld(x))
    const mOnce = OKH_APP_MIGRATE.migrateWorld(legacyCurrent);
    const mTwice = OKH_APP_MIGRATE.migrateWorld(mOnce);
    assert.deepStrictEqual(mTwice, mOnce, 'Double migration must be strictly idempotent');
    assert.strictEqual(mOnce.npcs.gulan.activity.releaseRule, 'manualRelease', 'Stale releaseRule upgraded to manualRelease');
    assert.strictEqual(mOnce.bg.eventStates[pendEventKey].status, 'pending', 'Pending interaction queue entry backfilled into eventStates');
    assert.strictEqual(mOnce.npcs.ed.stage, undefined, 'Migrated Ed loses legacy stage before validation');

    // 10B. Persisted save with history checkpoint -> migrateSchema -> resolve pending event -> rollback to migrated history checkpoint!
    const key = 'okh_gpt.state.v1:' + encodeURIComponent('chat-test');
    store.set(key, JSON.stringify({
      version: 1, chatId: 'chat-test', world: legacyCurrent,
      history: [{ id: 'r1', revision: 'rev1', chatIndex: null, before: legacyBefore }]
    }));

    const mig = await OKH_APP.migrateSchema();
    assert.strictEqual(mig.migrated, true);
    assert.strictEqual(mig.manualReleaseActivities.length, 1);
    assert.strictEqual(mig.manualReleaseActivities[0].npcId, 'gulan');
    assert.strictEqual(mig.manualReleaseActivities[0].activityId, 'legacy_act');
    assert.strictEqual(mig.manualReleaseActivities[0].fromReleaseRule, 'deletedOldRule');
    const loaded = OKH_APP.world();
    assert.strictEqual(loaded.bg.eventStates[pendEventKey].status, 'pending');
    assert.strictEqual(loaded.npcs.gulan.activity.migratedFromReleaseRule, 'deletedOldRule');
    assert(OKH_APP.ledger().includes('deletedOldRule'), 'Ledger must warn about migrated manualRelease activity');

    // Step 120 minutes: migrated manualRelease activity must stay occupied (not auto-released), then manual finish releases cleanly!
    await OKH_APP.step(120, { text: '<status_bar><time elapsed="120"/><event_resolve id="isna_tavern_rumor_notice" outcome="soothe"/></status_bar>' });
    assert.strictEqual(OKH_APP.world().bg.eventStates[pendEventKey].status, 'resolved');
    assert.strictEqual(OKH_APP.world().npcs.gulan.activity?.id, 'legacy_act', 'manualRelease stays occupied across time step');
    await OKH_APP.step(10, { text: '<status_bar><time elapsed="10"/><activity op="finish" npc="gulan"/></status_bar>' });
    assert.strictEqual(OKH_APP.world().npcs.gulan.activity, null, 'Explicit finish clears migrated manualRelease activity');
    assert(OKH_APP.world().npcs.gulan.activityHistory.legacy_act, 'Finished legacy_act recorded in history');
    assert(!OKH_APP.ledger().includes('deletedOldRule'), 'Ledger warning cleared once finished');

    // Rollback to migrated checkpoint r1 (before event existed) -> works cleanly & continues stepping!
    await OKH_APP.restore('r1');
    const restoredW = OKH_APP.world();
    assert.strictEqual(restoredW.schemaVersion, OKH_APP_CONFIG.SCHEMA_VERSION);
    assert.strictEqual(restoredW.timeMin, OKH_APP_CONFIG.DAY(8, 10));
    await OKH_APP.step(10, { text: '<status_bar><time elapsed="10"/></status_bar>' });

    // 10C. Corrupt save migration failure preserves original save byte-for-byte!
    const badKey = 'okh_gpt.state.v1:' + encodeURIComponent('bad-chat');
    const badRaw = JSON.stringify({
      version: 1, chatId: 'bad-chat',
      world: { timeMin: -999, playerLocation: 'inn', bg: { version: 2 }, npcs: {} },
      history: []
    });
    store.set(badKey, badRaw);
    sb._ctxObj.chatId = 'bad-chat';
    sb.OKH_APP.W.configure({ chatId: 'bad-chat' });
    await assert.rejects(() => OKH_APP.migrateSchema(), /世界状态缺少时间|非法/);
    assert.strictEqual(store.get(badKey), badRaw, 'Failed migration must preserve original raw save byte-for-byte');

    // 10D. Decoupled module presence + all 3 prologue lock entrances
    assert(sb.OKH_APP_DATA && sb.OKH_APP_RULES && sb.OKH_APP_TIME && sb.OKH_APP_MIGRATE && sb.OKH_APP_CONFIG);
    const sbPro = createSandbox();
    makeStorage(sbPro);
    const pw = await sbPro.OKH_APP.init();
    const pCfg = sbPro.OKH_APP_CONFIG.buildConfig();

    const pfBlocked = sbPro.OKH_APP_PARSE.buildFront(
      '<status_bar><move to="town"/><move npc="gulan" to="inn"/><activity op="start" npc="isna" kind="ordinary" label="去教堂" to="church"/></status_bar>',
      pw.timeMin + 60, pw, { config: pCfg, locations: sbPro.OKH_APP_CONFIG.LOCATIONS, canMove: sbPro.OKH_APP_CONFIG.canMove }
    );
    assert.strictEqual(pfBlocked.playerLocation, undefined);
    assert.strictEqual(pfBlocked.npcs.gulan, undefined);
    assert.strictEqual(pfBlocked.npcs.isna.location, undefined);

    // Late arrival (prologue_step at=end) cannot unlock an earlier move at=start
    const pfLate = sbPro.OKH_APP_PARSE.buildFront(
      '<status_bar><prologue_step flag="arrived_oakhaven" at="end"/><move to="town" at="start"/></status_bar>',
      pw.timeMin + 60, pw, { config: pCfg, locations: sbPro.OKH_APP_CONFIG.LOCATIONS, canMove: sbPro.OKH_APP_CONFIG.canMove }
    );
    assert.strictEqual(pfLate.playerLocation, undefined, 'Early move before late arrival step must stay blocked');

    assert.throws(() => OKHBackground.advance(pw, {
      id: 'pm2', revision: 'r1', toMin: pw.timeMin + 10, interactingIds: [],
      front: { playerLocation: 'town' }
    }, pCfg), /当前阶段禁止移动至该地点/);

    const pwEff = sbPro.OKHBackgroundModules.utils.clone(pw);
    assert.throws(() => sbPro.OKHBackgroundModules.effects({ utils: sbPro.OKHBackgroundModules.utils })
      .apply(pwEff, pwEff.npcs.isna, { move: 'town' }, { blockedIds: new Set() }, pCfg), /当前阶段禁止移动至该地点：town/);

    await sbPro.OKH_APP.step(60, {
      text: '<status_bar><time elapsed="60"/><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>'
    });
    assert.strictEqual(sbPro.OKH_APP.world().flags.arrived_oakhaven, true);
    assert.strictEqual(sbPro.OKH_APP.world().playerLocation, 'inn');
  });

  // 11. Expanded Gulan/Isna/Nise bonds, Nise curiosity & seenNovelties ledger
  await test('11. Expanded bonds, Nise curiosity (40), novelty checklist dedup & escort/browse mutual exclusion', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP_CONFIG, OKH_APP_PARSE, OKH_APP_ADAPTER, OKHBackground } = sb;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    // Validate <bond> item parser constraints
    let w0 = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w0.npcs.nise.values.curiosity, 40);
    assert.strictEqual(w0.npcs.nise.values.affection, 70);
    assert.throws(() => OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="nise" kind="novelty" item="  " /></status_bar>',
      DAY(1, 18, 30), w0, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    ), /1~24 字非空短词/);
    assert.throws(() => OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="nise" kind="novelty" item="微光矿石" delta="10" /></status_bar>',
      DAY(1, 18, 30), w0, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    ), /禁止携带数值字段/);

    // Prologue wilds expanded bonds (Gulan spar/care/watch + Isna share_food + Nise tease_back/magic_help)
    w0.timeMin = DAY(1, 14); // afternoon in wilds
    const f1 = OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="gulan" kind="spar" /><bond npc="gulan" kind="care" /><bond npc="isna" kind="share_food" /></status_bar>',
      DAY(1, 14, 30), w0, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    );
    w0 = OKHBackground.advance(w0, { id: 'b1', revision: 'r1', toMin: DAY(1, 14, 30), interactingIds: [], front: f1 }, cfg).state;
    assert.strictEqual(w0.npcs.gulan.values.affection, 72, 'Gulan wilds spar +1 and afternoon care +1 = 72');
    assert.strictEqual(w0.npcs.isna.values.affection, 61, 'Isna wilds share_food +1 = 61');

    // Night in wilds: Gulan watch (+1 -> 73, confide +2 would hit cap 3 -> +1 -> 74); Nise novelty dedup & daily limit 2
    const f2 = OKH_APP_PARSE.buildFront(
      '<status_bar><time elapsed="600" end="2日 00:30" />' +
      '<bond npc="gulan" kind="watch" at="1日 22:00" />' +
      '<bond npc="nise" kind="novelty" item="发光孢子石" at="1日 22:00" />' +
      '<bond npc="nise" kind="novelty" item=" 发光孢子石 " at="1日 22:10" />' +
      '<bond npc="nise" kind="novelty" item="古代铜铃" at="1日 22:20" />' +
      '<bond npc="nise" kind="novelty" item="第三件新物" at="1日 22:30" />' +
      '</status_bar>',
      DAY(2, 0, 30), w0, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    );
    w0 = OKHBackground.advance(w0, { id: 'b2', revision: 'r2', toMin: DAY(2, 0, 30), interactingIds: [], front: f2 }, cfg).state;
    assert.strictEqual(w0.npcs.gulan.values.affection, 73, 'Gulan wilds night watch +1');
    assert.deepStrictEqual([...w0.npcs.nise.flags.seenNovelties], ['发光孢子石', '古代铜铃']);
    assert.strictEqual(w0.npcs.nise.flags.totalNovelties, 2);
    assert.strictEqual(w0.npcs.nise.values.curiosity, 46, 'Two valid novelties add +6 curiosity (3rd capped)');
    assert.strictEqual(w0.npcs.nise.values.affection, 72, 'Two novelties add +2 affection');
    const ledger = OKH_APP_ADAPTER.buildLedger(w0);
    assert(ledger.includes('发光孢子石、古代铜铃'), 'Ledger injects Nise novelty checklist summary');

    // Arrived in Oakhaven: Nise escort prevents browse + guide lowers curiosity with optional item + 2-day cooldown + offend increases curiosity
    w0.flags.arrived_oakhaven = true;
    w0.playerLocation = 'town';
    w0.npcs.nise.location = 'town';
    w0.npcs.isna.location = 'town';
    w0.timeMin = DAY(2, 8);
    const f3 = OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="nise" kind="escort" at="start" /><bond npc="nise" kind="guide" item="炼金风标" /><bond npc="isna" kind="steady_work" /><bond npc="isna" kind="steady_work" /></status_bar>',
      DAY(2, 14), w0, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    );
    w0 = OKHBackground.advance(w0, { id: 'b3', revision: 'r3', toMin: DAY(2, 14), interactingIds: ['isna'], front: f3 }, cfg).state;
    assert.strictEqual(w0.npcs.isna.values.affection, 63, 'steady_work only counts once per day (+2) even after afternoon boundary');
    assert.strictEqual(w0.npcs.nise.flags.nise_escort_today, true);
    assert.strictEqual(w0.npcs.nise.flags.nise_browsed_today, false, 'escort prevents solo town browse on Day 2');
    assert.strictEqual(w0.npcs.nise.values.curiosity, 42, 'guide -4 curiosity (46 -> 42)');
    assert.deepStrictEqual([...w0.npcs.nise.flags.seenNovelties], ['发光孢子石', '古代铜铃', '炼金风标']);
    assert.strictEqual(w0.npcs.nise.values.affection, 75, 'guide +2 and escort +2 capped to +3 daily (72 + 3)');

    // Advance cleanly past Day 2 midnight into Day 3 morning+afternoon; solo browse +1 -> 43; cooldown blocks guide, offend +5 -> 48
    w0 = OKHBackground.advance(w0, { id: 'b3b', revision: 'r3b', toMin: DAY(3, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w0.npcs.nise.flags.nise_browsed_today, true, 'Day 3 triggers solo browse after midnight cleared Day 2 escort');
    assert.strictEqual(w0.npcs.nise.values.curiosity, 43);
    const f4 = OKH_APP_PARSE.buildFront(
      '<status_bar><bond npc="nise" kind="guide" /><bond npc="nise" kind="offend" /></status_bar>',
      DAY(3, 12, 10), w0, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS }
    );
    w0 = OKHBackground.advance(w0, { id: 'b4', revision: 'r4', toMin: DAY(3, 12, 10), interactingIds: [], front: f4 }, cfg).state;
    assert.strictEqual(w0.npcs.nise.values.curiosity, 48, 'guide blocked by cooldown, offend (+5 -> 48)');
    assert.strictEqual(w0.npcs.nise.values.affection, 70, 'offend -5 exempts daily cap (75 -> 70)');
  });

  // 12. Aurora 4/7 spec: debt countdown (100->0), weekday calendar, manor 3-stage cadence, >=80 disclose, >=90 delay/confess/refuse & weekend church +5
  await test('12. Aurora debt countdown, weekday manor cycle, rescue guardrails & weekend church bonus', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_PARSE } = sb;
    const { DAY } = OKH_APP_CONFIG;
    const cfg = OKH_APP_CONFIG.buildConfig();

    const stepFront = (state, id, min, tagStr) => {
      const f = OKH_APP_PARSE.buildFront(tagStr, min, state, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS });
      return OKHBackground.advance(state, { id, revision: 'r_' + id, toMin: min, interactingIds: [], front: f }, cfg).state;
    };

    // Case A: Arrive Day 2 (Tue) -> lord_hiring Day 4 (Thu), affection >= 90 triggers delay (7->14), confess, and Event 3 refusal
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 100);
    assert.strictEqual(w.npcs.aurora.values.affection, 50);

    // Day 1 night (Mon): wilds chores (+1) + reassure (+2) + wilds_assist (+3 exempt) = +6 -> 56
    w = stepFront(w, 'a0', DAY(1, 20), '<status_bar><bond npc="aurora" kind="reassure"/><bond npc="aurora" kind="help_chores"/><bond npc="aurora" kind="wilds_assist"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 56);

    // Day 2 (Tue): arrive Oakhaven inn (gift +2, chores +1 -> 59) + wilds excursion (wilds_assist +3 -> 62) & return to inn
    w = stepFront(w, 'a1', DAY(2, 12), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="gift"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    assert.strictEqual(w.flags.arrivedDay, 2, 'arrivedDay recorded from arrival timeMin');
    assert.strictEqual(w.flags.lord_hiring, undefined, 'lord_hiring must not post before Day 4');
    w = stepFront(w, 'a1b', DAY(2, 16), '<status_bar><move to="wilds"/><move npc="aurora" to="wilds"/><bond npc="aurora" kind="wilds_assist"/></status_bar>');
    w = stepFront(w, 'a1b2', DAY(2, 17), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 62);

    // Day 3 (Wed): weekday church (+2) -> wilds_assist (+3) -> inn chores (+1) -> 68
    w = stepFront(w, 'a1c', DAY(3, 10), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'a1d', DAY(3, 14), '<status_bar><move to="wilds"/><move npc="aurora" to="wilds"/><bond npc="aurora" kind="wilds_assist"/></status_bar>');
    w = stepFront(w, 'a1e', DAY(3, 16), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 68);

    // Advance to Day 4 morning (Thu 09:00): lord_hiring queues + aurora_take_manor_job_weekday moves Aurora to manor
    w = OKHBackground.advance(w, { id: 'a2', revision: 'ra2', toMin: DAY(4, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.flags.lord_hiring, true, 'lord_hiring posts on 3rd town day (arrivedDay + 2 = Day 4)');
    assert.strictEqual(w.npcs.aurora.flags.manor_service_active, true);
    assert.strictEqual(w.npcs.aurora.location, 'manor', 'weekday hiring moves Aurora to manor');

    // Sat morning: Thu(1) + Fri(2) workdays counted; weekend schedule returns Aurora to inn
    w = OKHBackground.advance(w, { id: 'a3', revision: 'ra3', toMin: DAY(6, 7), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.npcs.aurora.flags.manorWorkDays, 2, 'Thu + Fri counted as 2 weekday manor workdays');
    assert.strictEqual(w.npcs.aurora.location, 'inn', 'Weekend returns Aurora to inn');

    // Sat weekend church (+2 daily + 3 exempt + cecilia_aurora_mentor_talk +3 = 76) then inn chores (+1 daily remaining -> 77)
    w = stepFront(w, 'a3b', DAY(6, 8), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 76, 'Sat church_visit + mentor talk grants +8 total');
    w = stepFront(w, 'a3c', DAY(6, 9), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 77, 'Daily cap allows remaining +1 from help_chores (76 -> 77)');

    // Sun weekend church (+5 -> 82) + inn chores (+1 -> 83) -> unlocks >=80 debt disclosure at inn without premature confess or quitting
    w = stepFront(w, 'a4a', DAY(7, 8), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'a4b', DAY(7, 9), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 83);
    assert.strictEqual(w.npcs.aurora.flags.aurora_debt_disclosed, true, 'affection >= 80 discloses family debt at inn');
    assert.strictEqual(w.npcs.aurora.flags.aurora_manor_confessed, undefined, 'affection 80 < 90 & stage 0 must not confess manor events');
    assert.strictEqual(w.npcs.aurora.flags.manor_service_active, true, 'disclosing debt does not zero-cost quit manor service');

    // Mon..Fri (Days 8..12) + Sat Day 13 morning: Aurora works weekdays at manor -> Tue (Day 9, manorWorkDays=3) fires Event 1 (debt 100->90, stage 1); Sat returns inn at 7 workdays
    w = stepFront(w, 'a6a', DAY(13, 7), '<status_bar><move to="inn"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.stage, 1, 'Aurora advances to stage 1 after 3rd weekday at manor');
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 90, 'Event 1 deducts 10 debt_pressure (100 -> 90)');
    assert.strictEqual(w.npcs.aurora.flags.aurora_evt1_done, true);
    assert.strictEqual(w.npcs.aurora.flags.manorWorkDays, 7);
    assert.strictEqual(w.npcs.aurora.location, 'inn');

    // Raise affection across Sat 13 + Sun 14 to 92 (>= 90) -> triggers manor confess at inn
    w = stepFront(w, 'a6b', DAY(13, 8), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'a6c', DAY(13, 9), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    w = stepFront(w, 'a6d', DAY(14, 8), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'a6e', DAY(14, 9), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 95);
    assert.strictEqual(w.npcs.aurora.flags.aurora_manor_confessed, undefined, 'stage 1 weekend must not leak stage 2 manor confess');

    // Mon Day 15: back at manor with manorWorkDays=7 & affection >= 90 -> Event 2 delayed 7 workdays (stage stays 1, debt stays 90)
    w = OKHBackground.advance(w, { id: 'a7', revision: 'ra7', toMin: DAY(15, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.npcs.aurora.flags.aurora_evt2_delayed, true, 'affection >= 90 delays Event 2 from 7 to 14 workdays');
    assert.strictEqual(w.npcs.aurora.stage, 1);
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 90);

    // Wed Day 24: 14 workdays completed -> Event 2 triggers (-30 debt -> 60, stage 2)
    w = OKHBackground.advance(w, { id: 'a8', revision: 'ra8', toMin: DAY(24, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.npcs.aurora.flags.manorWorkDays, 14);
    assert.strictEqual(w.npcs.aurora.stage, 2, 'Delayed Event 2 triggers at 14 workdays');
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 60, 'Event 2 deducts 30 debt_pressure (90 -> 60)');
    assert.strictEqual(w.npcs.aurora.flags.aurora_evt2_done, true);

    // Fri Day 33: 21 workdays completed with affection >= 90 -> Event 3 refused! Preserves remaining debt (60), keeps stage 2, leaves manor & returns to inn
    w = OKHBackground.advance(w, { id: 'a9', revision: 'ra9', toMin: DAY(33, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.npcs.aurora.flags.manorWorkDays, 21);
    assert.strictEqual(w.npcs.aurora.stage, 2, 'Refusing Event 3 keeps stage 2 (no fall to stage 3)');
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 60, 'Refusing Event 3 preserves remaining debt_pressure (60)');
    assert.strictEqual(w.npcs.aurora.flags.manor_service_active, false);
    assert.strictEqual(w.npcs.aurora.flags.aurora_left_manor, true);
    assert.strictEqual(w.npcs.aurora.location, 'inn', 'Refusing Event 3 immediately returns Aurora to inn');

    // Case B: Low affection (< 90) Event 3 triggers full fall -> debt_pressure cleared to 0, stage 3, permanent manor mistress
    let wB = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wB = stepFront(wB, 'b1', DAY(1, 19), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/><move npc="aurora" to="inn"/></status_bar>');
    wB = OKHBackground.advance(wB, { id: 'b2', revision: 'rb2', toMin: DAY(12, 9), interactingIds: [], front: {} }, cfg).state;
    wB = OKHBackground.advance(wB, { id: 'b3', revision: 'rb3', toMin: DAY(24, 9), interactingIds: [], front: {} }, cfg).state;
    wB = OKHBackground.advance(wB, { id: 'b4', revision: 'rb4', toMin: DAY(34, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wB.npcs.aurora.stage, 3, 'Low affection Event 3 reaches stage 3 fall');
    assert.strictEqual(wB.npcs.aurora.values.debt_pressure, 0, 'Event 3 clears remaining debt_pressure to 0');
    assert.strictEqual(wB.npcs.aurora.location, 'manor', 'Stage 3 mistress remains permanently at manor even on weekend (Day 34 Sat)');

    // Case C: Weekend hiring postpones move to Monday; clearing debt early via repayment quits manor service cleanly
    let wC = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wC = stepFront(wC, 'c1', DAY(4, 12), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/><move npc="aurora" to="inn"/></status_bar>');
    wC = OKHBackground.advance(wC, { id: 'c2', revision: 'rc2', toMin: DAY(6, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.flags.lord_hiring, true);
    assert.strictEqual(wC.npcs.aurora.flags.manor_service_active, true);
    assert.strictEqual(wC.npcs.aurora.location, 'inn', 'Weekend hiring keeps Aurora at inn over the weekend');
    assert.strictEqual(wC.npcs.aurora.flags.manorWorkDays, 0);

    wC = OKHBackground.advance(wC, { id: 'c3', revision: 'rc3', toMin: DAY(9, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.aurora.location, 'manor');
    assert.strictEqual(wC.npcs.aurora.flags.manorWorkDays, 1, 'Weekday counting starts on Monday after weekend hiring');

    wC = OKHBackground.advance(wC, {
      id: 'c4', revision: 'rc4', toMin: DAY(9, 10), interactingIds: [],
      front: { npcs: { aurora: { add: { debt_pressure: -100 } } } }
    }, cfg).state;
    assert.strictEqual(wC.npcs.aurora.values.debt_pressure, 0);
    assert.strictEqual(wC.npcs.aurora.flags.manor_service_active, false, 'Clearing debt quits manor service');
    assert.strictEqual(wC.npcs.aurora.flags.aurora_left_manor, true);
    assert.strictEqual(wC.npcs.aurora.location, 'inn', 'Clearing debt returns Aurora to inn');
  });

  // 13. Eileen 5/7 spec: Day-15 arrival, counterattack (0->100), Isna/Nise/Aurora synergy, >=70 emotion retention, Baron punishment vs Grey Rat Shield, Purge & Dark 90-day inspection
  await test('13. Eileen delayed arrival, bright counterattack/purge/marriage, Grey Rat vs punishment & dark 90-day chain', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_PARSE } = sb;
    const { DAY } = OKH_APP_CONFIG;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const u = sb.OKHBackgroundModules.utils;

    const stepFront = (state, id, min, tagStr, interactingIds = []) => {
      const f = OKH_APP_PARSE.buildFront(tagStr, min, state, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS });
      return OKHBackground.advance(state, { id, revision: 'r_' + id, toMin: min, interactingIds, front: f }, cfg).state;
    };

    // Case A: Bright route with Isna (+10 + Grey Rat Shield), Nise (+5), Aurora (>=80 intel +20), >=70 emotion retention & >=90 marriage/barony
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w.npcs.eileen.monitored, false);
    assert.strictEqual(w.npcs.eileen.values.affection, 0);
    assert.strictEqual(w.npcs.eileen.values.counterattack, 0);

    // Build Aurora to affection 80 via Days 1..3 & Weekend 6..7
    w = stepFront(w, 'ea0', DAY(1, 20), '<status_bar><bond npc="aurora" kind="reassure"/><bond npc="aurora" kind="help_chores"/><bond npc="aurora" kind="wilds_assist"/></status_bar>');
    w = stepFront(w, 'ea1', DAY(2, 12), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="gift"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    w = stepFront(w, 'ea1b', DAY(2, 16), '<status_bar><move to="wilds"/><move npc="aurora" to="wilds"/><bond npc="aurora" kind="wilds_assist"/></status_bar>');
    w = stepFront(w, 'ea1c', DAY(2, 17), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/></status_bar>');
    w = stepFront(w, 'ea2', DAY(3, 10), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'ea2b', DAY(3, 14), '<status_bar><move to="wilds"/><move npc="aurora" to="wilds"/><bond npc="aurora" kind="wilds_assist"/></status_bar>');
    w = stepFront(w, 'ea2c', DAY(3, 16), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    w = stepFront(w, 'ea3a', DAY(6, 8), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'ea3b', DAY(6, 9), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    w = stepFront(w, 'ea4a', DAY(7, 8), '<status_bar><move to="church"/><move npc="aurora" to="church"/><bond npc="aurora" kind="church_visit"/></status_bar>');
    w = stepFront(w, 'ea4b', DAY(7, 9), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="help_chores"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, 83);

    // Day 15 (Mon): Eileen arrives at manor, becomes monitored; proud inspector refuses bonds during inspection
    w = OKHBackground.advance(w, { id: 'ea_d15', revision: 'rea15', toMin: DAY(15, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.flags.eileen_arrived, true);
    assert.strictEqual(w.npcs.eileen.monitored, true);
    w = stepFront(w, 'ea_d15b', DAY(15, 11), '<status_bar><move to="manor"/><bond npc="eileen" kind="encourage"/><bond npc="eileen" kind="care_watch"/></status_bar>');
    assert.strictEqual(w.npcs.eileen.values.affection, 0, 'Inspection period ignores positive bonds');

    // Sat Day 20 at inn: Aurora warns Berri about the royal inspector at manor
    w = stepFront(w, 'ea_d20', DAY(20, 9), '<status_bar><move to="inn"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.flags.aurora_told_eileen_arrival, true);

    // Sun Day 21: Inspection finishes -> eileen_escort_offer pending
    w = OKHBackground.advance(w, { id: 'ea_d21', revision: 'rea21', toMin: DAY(21, 9), interactingIds: [], front: {} }, cfg).state;
    const offerKey = u.key('event', 'eileen_escort_offer', 'eileen');
    assert.strictEqual(w.bg.eventStates[offerKey]?.status, 'pending');

    // Accept escort -> playerLocation moves to wilds automatically alongside participating Isna/Nise; Eileen still moves safely without blockedIds collision
    w = stepFront(w, 'ea_town', DAY(21, 9, 30), '<status_bar><move to="town"/></status_bar>');
    w = stepFront(w, 'ea_acc', DAY(21, 10), '<status_bar><interact npc="eileen"/><event_resolve id="eileen_escort_offer" npc="eileen" outcome="accept"/></status_bar>', ['eileen']);
    assert.strictEqual(w.flags.eileen_fugitive, true);
    assert.strictEqual(w.playerLocation, 'wilds', 'Accepting escort immediately relocates player to wilds');
    assert.strictEqual(w.npcs.eileen.location, 'wilds', 'Synced Eileen relocates to wilds on breakout');
    assert.strictEqual(w.npcs.eileen.flags.eileen_disguised, true, 'Eileen defaults to hooded disguise on breakout');
    assert.strictEqual(w.npcs.isna.location, 'wilds', 'Participating Isna relocates to wilds on breakout');
    assert.strictEqual(w.npcs.nise.location, 'wilds', 'Participating Nise relocates to wilds on breakout');
    assert.strictEqual(w.npcs.eileen.values.affection, 30, 'Escape adds +30 affection (0 -> 30)');
    assert.strictEqual(w.npcs.eileen.values.counterattack, 20, 'Isna (+10) + Nise (+10) yield 20 starting counterattack');
    assert.strictEqual(w.npcs.aurora.flags.aurora_grey_rat_shield, true, 'Isna grey rat warns Aurora at manor');

    // Mon Day 22: Aurora at manor must NOT suffer Baron punishment thanks to grey rat shield; Eileen moves to wilds safely
    w = OKHBackground.advance(w, { id: 'ea_d22', revision: 'rea22', toMin: DAY(22, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.npcs.aurora.flags.aurora_lord_punished, undefined, 'Grey rat shield offsets Baron punishment');
    assert.strictEqual(w.npcs.eileen.location, 'wilds');

    // Advance fugitive Days 22..26 with care_watch (+1) + encourage (+2) + scout_prep (+4 counterattack/day) + 1 rescue_shield (+5 aff & +10 ct) + 1 cover_hide (+3 aff & +6 ct) + offend (-3)
    for (let d = 22; d <= 26; d++) {
      w = stepFront(w, 'ef_' + d, DAY(d, 14), '<status_bar><move to="wilds"/><bond npc="eileen" kind="care_watch"/><bond npc="eileen" kind="encourage"/><bond npc="eileen" kind="scout_prep"/></status_bar>');
    }
    w = stepFront(w, 'ef_cov', DAY(26, 16), '<status_bar><bond npc="eileen" kind="cover_hide"/><bond npc="eileen" kind="rescue_shield"/><bond npc="eileen" kind="offend"/></status_bar>');
    // Base 30 + 5*3=15 -> 45 - 3 = 42 affection (cover_hide/rescue_shield no longer grant free affection)
    assert.strictEqual(w.npcs.eileen.values.affection, 42);

    // Sat Day 27: Actively visit Aurora at inn -> disguised Eileen accompanies at inn too; aurora_pass_manor_intel pending -> resolve +20 counterattack!
    w = stepFront(w, 'ea_intel_meet', DAY(27, 8), '<status_bar><move to="inn"/></status_bar>');
    assert.strictEqual(w.npcs.eileen.location, 'inn', 'Disguised fugitive Eileen accompanies player to inn');
    const intelKey = u.key('event', 'aurora_pass_manor_intel', 'aurora');
    assert.strictEqual(w.bg.eventStates[intelKey]?.status, 'pending');
    const ctBeforeIntel = w.npcs.eileen.values.counterattack;
    w = stepFront(w, 'ea_intel_ok', DAY(27, 9), '<status_bar><event_resolve id="aurora_pass_manor_intel" npc="aurora" outcome="receive_intel"/></status_bar>');
    assert.strictEqual(w.npcs.eileen.values.counterattack, Math.min(100, ctBeforeIntel + 20), 'Active contact with Aurora >=80 grants +20 counterattack');

    // Spend Days 28..37 in wilds raising affection past 70 -> verify care_watch stops at >=70 while encourage (+2) continues!
    for (let d = 28; d <= 37; d++) {
      w = stepFront(w, 'ef2_' + d, DAY(d, 14), '<status_bar><move to="wilds"/><bond npc="eileen" kind="care_watch"/><bond npc="eileen" kind="encourage"/></status_bar>');
    }
    assert.strictEqual(w.npcs.eileen.values.affection, 72, 'Reaches 72 cleanly across 10 days (42 + 10*3)');
    // At >=70 (72): care_watch does NOT add +1, but emotion encourage (+2) IS retained -> 74!
    w = stepFront(w, 'ef_past70', DAY(38, 14), '<status_bar><move to="wilds"/><bond npc="eileen" kind="care_watch"/><bond npc="eileen" kind="encourage"/></status_bar>');
    assert.strictEqual(w.npcs.eileen.values.affection, 74, 'Past >=70: care_watch (+1) stops, emotion encourage (+2) stays active');
    w.npcs.eileen.values.counterattack = 100;
    assert.strictEqual(w.npcs.eileen.values.counterattack, 100);

    // Resolve reclaim tube -> requires moving to manor first, then 1 day later Griffin Knights purge Baron (+20 -> 94 >= 90 -> marriage + barony; keeps Aurora/Nise stage!)
    const reclaimKey = u.key('event', 'eileen_reclaim_tube', 'eileen');
    assert.notStrictEqual(w.bg.eventStates[reclaimKey]?.status, 'pending', 'Reclaim tube does not fire in wilds');
    w = stepFront(w, 'ea_to_manor', DAY(38, 17), '<status_bar><move to="manor"/></status_bar>');
    assert.strictEqual(w.bg.eventStates[reclaimKey]?.status, 'pending', 'Reclaim tube becomes pending upon infiltrating manor');
    w = stepFront(w, 'ea_strike', DAY(38, 18), '<status_bar><event_resolve id="eileen_reclaim_tube" npc="eileen" outcome="strike"/></status_bar>');
    assert.strictEqual(w.flags.eileen_signal_fired, true);

    const niseStageBeforePurge = w.npcs.nise.stage;
    const auroraStageBeforePurge = w.npcs.aurora.stage;
    w = OKHBackground.advance(w, { id: 'ea_purge', revision: 'reap', toMin: DAY(39, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(w.flags.baron_purged, true);
    assert.strictEqual(w.flags.eileen_fugitive, false);
    assert.strictEqual(w.npcs.eileen.flags.eileen_disguised, false, 'Purge ends Eileen fugitive disguise');
    assert.strictEqual(w.npcs.eileen.values.affection, 94, 'Purge grants +20 affection (74 -> 94)');
    assert.strictEqual(w.flags.player_barony_granted, true, '>=90 affection triggers marriage & Oakhaven barony');
    assert.strictEqual(w.npcs.eileen.flags.eileen_betrothed, true);
    assert.strictEqual(w.npcs.aurora.stage, auroraStageBeforePurge, 'Purge preserves existing Aurora stage');
    assert.strictEqual(w.npcs.aurora.flags.manor_service_active, false, 'Purge frees surviving <3 Aurora from manor');
    assert.strictEqual(w.npcs.nise.stage, niseStageBeforePurge, 'Purge preserves existing Nise stage');
    assert.strictEqual(w.npcs.nise.flags.nise_umbrella_broken, true);

    // Case B: Missing Isna (0 grey rat shield -> Baron punishment -3 workdays on Aurora!) + stage 3 Aurora/Nise irreversible purge/flight
    let wB = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wB.flags.arrived_oakhaven = true;
    wB.flags.arrivedDay = 2;
    wB.flags.lord_hiring = true;
    wB.timeMin = DAY(21, 8);
    wB.playerLocation = 'town';
    // Aurora at manor with 17 workdays & stage 2 (affection 80), Isna away at wilds_camp captured, Nise stage 3 fallen
    wB.npcs.aurora.location = 'manor';
    wB.npcs.aurora.values.affection = 80;
    wB.npcs.aurora.stage = 2;
    wB.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 17, aurora_evt1_done: true, aurora_evt2_done: true, lastNightSettledDay: 20 };
    wB.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' }, aurora_stage_2: { status: 'completed' } };
    wB.npcs.isna.flags.captured_orc = true;
    wB.npcs.nise.stage = 3;
    wB.flags.eileen_arrived = true;
    wB.npcs.eileen.monitored = true;
    wB.npcs.eileen.flags.eileenInspectDays = 6;

    wB = OKHBackground.advance(wB, { id: 'eb_offer', revision: 'reb0', toMin: DAY(21, 9), interactingIds: [], front: {} }, cfg).state;
    wB = stepFront(wB, 'eb_acc', DAY(21, 10), '<status_bar><event_resolve id="eileen_escort_offer" npc="eileen" outcome="accept"/></status_bar>');
    assert.strictEqual(wB.npcs.eileen.values.counterattack, 0, 'Neither Isna nor Nise available -> 0 starting counterattack');

    // Mon Day 22 morning: manorWorkDays still 17, Baron punishment shifts Event 3 from 21 -> 18! Night 22 pushes to 18 -> Tue Day 23 triggers Aurora stage 3!
    wB = OKHBackground.advance(wB, { id: 'eb_d22', revision: 'reb1', toMin: DAY(22, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wB.npcs.aurora.flags.aurora_lord_punished, true, 'Baron punishes Aurora without grey rat shield');
    assert.strictEqual(wB.npcs.aurora.values.affection, 80, 'Baron punishment does not reduce affection');
    assert.strictEqual(wB.npcs.aurora.stage, 2);

    wB = OKHBackground.advance(wB, { id: 'eb_d23', revision: 'reb2', toMin: DAY(23, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wB.npcs.aurora.flags.manorWorkDays, 18);
    assert.strictEqual(wB.npcs.aurora.stage, 3, 'Punishment accelerates Aurora Event 3 by 3 workdays (21 -> 18)');

    // Complete counterattack & purge with < 90 Eileen affection (50 < 90) -> stage 3 Aurora purged with Baron; stage 3 Nise flees; 3 days post-purge Eileen departs with Griffin Knights!
    wB.npcs.eileen.values.counterattack = 100;
    wB.playerLocation = 'manor';
    wB = OKHBackground.advance(wB, { id: 'eb_rec', revision: 'reb3', toMin: DAY(23, 10), interactingIds: [], front: {} }, cfg).state;
    wB = stepFront(wB, 'eb_str', DAY(23, 11), '<status_bar><event_resolve id="eileen_reclaim_tube" npc="eileen" outcome="strike"/></status_bar>');
    wB = OKHBackground.advance(wB, { id: 'eb_end', revision: 'reb4', toMin: DAY(24, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wB.flags.baron_purged, true);
    assert.strictEqual(wB.flags.player_barony_granted, false, 'Affection 50 < 90 does not grant marriage or barony');
    assert.strictEqual(wB.npcs.eileen.values.affection, 50);
    assert.strictEqual(wB.npcs.aurora.flags.aurora_purged_with_baron, true, 'Stage 3 mistress Aurora is purged alongside Baron');
    assert.strictEqual(wB.npcs.aurora.monitored, false);
    assert.strictEqual(wB.npcs.nise.flags.nise_fled_casino, true, 'Stage 3 Nise flees when casino umbrella collapses');
    assert.strictEqual(wB.npcs.nise.monitored, false);
    wB = stepFront(wB, 'eb_stay_d1', DAY(25, 12), '<status_bar><bond npc="eileen" kind="encourage"/></status_bar>');
    assert.notStrictEqual(wB.npcs.eileen.flags.eileen_returned_capital, true, 'Eileen stays 3 days post-purge before departing');
    assert.strictEqual(wB.npcs.eileen.values.affection, 52, 'Eileen encourage bond remains open during 3-day post-purge window');
    wB = OKHBackground.advance(wB, { id: 'eb_leave', revision: 'reb5', toMin: DAY(27, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wB.npcs.eileen.flags.eileen_returned_capital, true, 'Eileen <90 affection departs to capital with Griffin Knights after 3 days');
    assert.strictEqual(wB.npcs.eileen.monitored, false);

    // Case D: Ordering guard — late-arrived Aurora at manorWorkDays=4 & affection=90 suffering Baron punishment must trigger evt2 delay instead of bypassing to stage 2!
    let wD = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wD.flags.arrived_oakhaven = true;
    wD.flags.lord_hiring = true;
    wD.flags.eileen_fugitive = true;
    wD.flags.eileen_ambush_closed = true;
    wD.timeMin = DAY(22, 5);
    wD.npcs.aurora.location = 'manor';
    wD.npcs.aurora.stage = 1;
    wD.npcs.aurora.values.affection = 92;
    wD.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 4, aurora_evt1_done: true, lastNightSettledDay: 21 };
    wD.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' } };
    wD = OKHBackground.advance(wD, { id: 'ed_ord', revision: 'red1', toMin: DAY(22, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wD.npcs.aurora.flags.aurora_lord_punished, true);
    assert.strictEqual(wD.npcs.aurora.flags.aurora_evt2_delayed, true, 'Order fix ensures >=90 delay catches accelerated Event 2 threshold');
    assert.strictEqual(wD.npcs.aurora.stage, 1, 'Delayed Aurora must stay stage 1 instead of bypassing into stage 2');

    // Case C: Dark route (unassisted solo departure -> captured 1/7/21 stages & 90-day Griffin Knight inspection cover-up)
    let wC = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wC = stepFront(wC, 'ec_arr', DAY(2, 12), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>');
    wC = OKHBackground.advance(wC, { id: 'ec_d15', revision: 'rec1', toMin: DAY(15, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.monitored, true);
    wC = OKHBackground.advance(wC, { id: 'ec_d21', revision: 'rec2', toMin: DAY(21, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.flags.eileen_captured, undefined, 'Day 6 guild-offer window opens and stays open');
    wC = OKHBackground.advance(wC, { id: 'ec_d23', revision: 'rec2a', toMin: DAY(23, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.flags.eileen_captured, undefined, 'Day 8 (3rd day of guild offer) still stays open before solo departure');
    wC = OKHBackground.advance(wC, { id: 'ec_d24', revision: 'rec2b', toMin: DAY(24, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.flags.eileen_captured, true, 'Missing 3-day guild offer leads to solo departure and capture on day 9');

    wC = OKHBackground.advance(wC, { id: 'ec_c1', revision: 'rec3', toMin: DAY(25, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.stage, 1, 'Captive Day 1 -> stage 1');
    wC = OKHBackground.advance(wC, { id: 'ec_c7', revision: 'rec4', toMin: DAY(31, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.stage, 2, 'Captive Day 7 -> stage 2');
    wC = OKHBackground.advance(wC, { id: 'ec_c21', revision: 'rec5', toMin: DAY(45, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wC.npcs.eileen.stage, 3, 'Captive Day 21 -> stage 3');

    for (const nextDay of [60, 75, 90, 105, 114]) {
      wC = OKHBackground.advance(wC, { id: 'ec_d' + nextDay, revision: 'rec_' + nextDay, toMin: DAY(nextDay, 9), interactingIds: [], front: {} }, cfg).state;
    }
    assert.strictEqual(wC.npcs.eileen.flags.eileenCaptiveDays, 90);
    assert.strictEqual(wC.npcs.eileen.flags.eileen_inspection_covered, true, 'At 90 captive days, conditioned Eileen covers for Baron during Griffin inspection');
    assert.strictEqual(wC.flags.baron_purged, false);
  });

  // 14. Gulan +2 stage2+, ledger bloody_arena, fugitive full squad sync + metric pauses, high-aff Nise join & female stage-3 affection <=50 lock
  await test('14. Gulan/Isna/Nise audit fixes: +2 night gain, ledger bloody_arena, fugitive sync & metric pauses, high-affection Nise & stage-3 lock', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_PARSE, OKH_APP_ADAPTER } = sb;
    const { DAY } = OKH_APP_CONFIG;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const u = sb.OKHBackgroundModules.utils;

    const stepFront = (state, id, min, tagStr, interactingIds = []) => {
      const f = OKH_APP_PARSE.buildFront(tagStr, min, state, { config: cfg, locations: OKH_APP_CONFIG.LOCATIONS, canMove: cfg.canMove });
      return OKHBackground.advance(state, { id, revision: 'r_' + id, toMin: min, interactingIds, front: f }, cfg).state;
    };

    // (a) Gulan stage >= 2 nightly blood_density +2 (down from +3) & bloody_arena in buildLedger
    let wG = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wG.flags.arrived_oakhaven = true;
    wG.flags.ed_joined = true;
    wG.npcs.ed.monitored = true;
    wG.npcs.ed.location = 'inn';
    wG.npcs.gulan.location = 'inn';
    wG.npcs.gulan.stage = 2;
    wG.npcs.gulan.values.blood_density = 40;
    wG.timeMin = DAY(1, 22);
    wG = OKHBackground.advance(wG, { id: 'g2n', revision: 'rg2n', toMin: DAY(2, 2), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wG.npcs.gulan.values.blood_density, 42, 'Stage >= 2 Gulan gains +2 blood_density per night with Ed');
    assert(!OKH_APP_ADAPTER.buildLedger(wG).includes('演武场血案'), 'Ledger omits bloody_arena rumor before flag is set');
    wG.flags.bloody_arena = true;
    assert(OKH_APP_ADAPTER.buildLedger(wG).includes('演武场血案'), 'Ledger surfaces bloody_arena town rumor when flag is set');

    // (b) Fugitive squad sync across locations (even if Isna/Nise were in morning ordinary jobs), rogue move rejection & metric pauses
    let wS = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wS.flags.arrived_oakhaven = true;
    wS.flags.arrivedDay = 2;
    wS.flags.lord_hiring = true;
    wS.flags.eileen_arrived = true;
    wS.npcs.eileen.monitored = true;
    wS.npcs.eileen.location = 'manor';
    wS.npcs.eileen.flags.eileenInspectDays = 6;
    wS.npcs.aurora.values.affection = 80;
    wS.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 10, lastNightSettledDay: 20 };
    wS.npcs.aurora.location = 'inn';
    wS.npcs.isna.values.gold_desire = 52;
    wS.npcs.isna.flags.lastNightSettledDay = 20;
    wS.npcs.nise.flags.lastNightSettledDay = 20;
    wS.npcs.nise.flags.lastInteractDay = 17;
    wS.timeMin = DAY(21, 5);

    // Advance to Day 21 07:30 morning: Isna & Nise pick morning ordinary activities (isna_odd_job & nise_town_browse at 'town'), Aurora triggers offer
    wS = OKHBackground.advance(wS, { id: 's1', revision: 'rs1', toMin: DAY(21, 7, 30), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wS.npcs.isna.activity?.kind, 'ordinary', 'Isna started ordinary morning odd job before ambush');
    assert.strictEqual(wS.npcs.nise.activity?.kind, 'ordinary', 'Nise started ordinary town browse before ambush');
    const goldAtBreakout = wS.npcs.isna.values.gold_desire;
    const curiosityAtBreakout = wS.npcs.nise.values.curiosity;

    // Accept escort at 07:45 while Isna/Nise still have ordinary occupations and Isna is even listed in interactingIds -> both STILL join & move to wilds!
    wS = stepFront(wS, 's1b', DAY(21, 7, 40), '<status_bar><move to="town"/></status_bar>');
    wS = stepFront(wS, 's2', DAY(21, 7, 45), '<status_bar><interact npc="eileen"/><interact npc="isna"/><event_resolve id="eileen_escort_offer" npc="eileen" outcome="accept"/></status_bar>', ['eileen', 'isna']);
    assert.strictEqual(wS.playerLocation, 'wilds');
    assert.strictEqual(wS.npcs.eileen.location, 'wilds', 'Synced Eileen moves to wilds immediately on breakout');
    assert.strictEqual(wS.npcs.eileen.flags.eileen_disguised, true, 'Eileen defaults to disguised on breakout');
    const fugitiveLedger = OKH_APP_ADAPTER.buildLedger(wS);
    assert(fugitiveLedger.includes('默认兜帽斗篷乔装遮面') && fugitiveLedger.includes('并与你同步进退'), 'Ledger surfaces Eileen default disguise & full-route sync');
    assert.strictEqual(wS.npcs.isna.flags.eileen_isna_helped, true);
    assert.strictEqual(wS.npcs.nise.flags.eileen_nise_helped, true);
    assert.strictEqual(wS.npcs.isna.location, 'wilds', 'Synced Isna moves to wilds immediately despite prior ordinary job & interactingIds');
    assert.strictEqual(wS.npcs.nise.location, 'wilds', 'Synced Nise moves to wilds immediately despite prior ordinary job');
    assert.strictEqual(wS.npcs.isna.activity, null);
    assert.strictEqual(wS.npcs.nise.activity, null);

    // Move protagonist to inn in daytime -> synced Isna, Nise & disguised Eileen move together; no tavern_rumor_notice triggers, Eileen bonds work in inn!
    wS = stepFront(wS, 's3', DAY(21, 15), '<status_bar><move to="inn"/><move npc="isna" to="inn"/></status_bar>');
    assert.strictEqual(wS.npcs.isna.location, 'inn', 'Synced Isna follows player to inn without parse diagnostic');
    assert.strictEqual(wS.npcs.nise.location, 'inn', 'Synced Nise follows player to inn');
    assert.strictEqual(wS.npcs.eileen.location, 'inn', 'Synced disguised Eileen follows player to inn');
    assert.strictEqual(wS.npcs.isna.flags.isna_evt1_done, undefined, 'Tavern rumor event paused during fugitive counterattack');
    wS = stepFront(wS, 's3b', DAY(21, 15, 30), '<status_bar><bond npc="eileen" kind="care_watch"/><bond npc="eileen" kind="encourage"/></status_bar>');
    assert.strictEqual(wS.npcs.eileen.values.affection, 33, 'Disguised Eileen bonds work seamlessly in inn');

    // Move protagonist to town in afternoon -> all three follow, no alley_lockpick triggers
    wS = stepFront(wS, 's4', DAY(21, 16), '<status_bar><move to="town"/><bond npc="eileen" kind="scout_prep"/><bond npc="eileen" kind="cover_hide"/><bond npc="eileen" kind="rescue_shield"/></status_bar>');
    assert.strictEqual(wS.npcs.isna.location, 'town');
    assert.strictEqual(wS.npcs.nise.location, 'town');
    assert.strictEqual(wS.npcs.eileen.location, 'town', 'Disguised Eileen accompanies player into town');
    assert.strictEqual(wS.npcs.eileen.values.affection, 33, 'Eileen cover_hide & rescue_shield no longer grant free affection');
    assert.strictEqual(wS.npcs.eileen.values.counterattack, 20, 'Eileen bonds no longer add free counterattack');
    assert.strictEqual(wS.npcs.isna.flags.isna_evt2_done, undefined, 'Alley lockpick event paused during fugitive counterattack');
    assert.throws(
      () => OKHBackground.advance(wS, { id: 's_rogue', revision: 'rs_rogue', toMin: DAY(21, 16, 10), interactingIds: [], front: { npcs: { isna: { location: 'inn' } } } }, cfg),
      /禁止移动/,
      'Synced companion cannot move away from protagonist'
    );
    assert.throws(
      () => OKHBackground.advance(wS, { id: 's_rogue_eileen', revision: 'rs_rogue_eileen', toMin: DAY(21, 16, 10), interactingIds: [], front: { npcs: { eileen: { location: 'wilds' } } } }, cfg),
      /禁止移动/,
      'Synced Eileen cannot move away from protagonist'
    );

    // Move back to wilds and skip 7 full days (Days 22..28) -> nightly Isna gold_desire & Nise 5-day affection decay + odd jobs/browse are paused!
    wS = stepFront(wS, 's5', DAY(21, 22), '<status_bar><move to="wilds"/></status_bar>');
    const niseAffBeforePause = wS.npcs.nise.values.affection;
    wS = OKHBackground.advance(wS, { id: 's6', revision: 'rs6', toMin: DAY(28, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wS.npcs.eileen.location, 'wilds', 'Eileen remains synced at wilds with protagonist');
    assert.strictEqual(wS.npcs.isna.location, 'wilds', 'Isna never returned solo to inn over 7 fugitive days');
    assert.strictEqual(wS.npcs.nise.location, 'wilds', 'Nise never returned solo to inn or town over 7 fugitive days');
    assert.strictEqual(wS.npcs.isna.values.gold_desire, goldAtBreakout, 'Isna gold_desire nightly gain and odd jobs stay paused in fugitive arc');
    assert.strictEqual(wS.npcs.nise.values.curiosity, curiosityAtBreakout, 'Nise town browse stays paused in fugitive arc');
    assert.strictEqual(wS.npcs.nise.values.affection, niseAffBeforePause, 'Nise 5-day neglect pauses during fugitive worry');
    assert.strictEqual(wS.npcs.nise.flags.lastInteractDay, 27, 'Nise lastInteractDay advances across paused fugitive nights');

    // End fugitive arc via baron_purged -> immediate night 29 still safe, Eileen stops syncing & returns to manor, 5 post-purge days resume 5-day neglect & location freedom
    wS.flags.baron_purged = true;
    wS.flags.eileen_fugitive = false;
    wS.npcs.eileen.flags.eileen_fugitive = false;
    wS.npcs.eileen.flags.eileen_disguised = false;
    wS = OKHBackground.advance(wS, { id: 's7', revision: 'rs7', toMin: DAY(29, 12), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wS.npcs.nise.values.affection, niseAffBeforePause, 'Night immediately after purge must not dump overdue fugitive neglect');
    assert.strictEqual(wS.npcs.eileen.location, 'manor', 'After baron_purged, Eileen stops syncing and moves to manor for post-purge work');
    wS = stepFront(wS, 's8', DAY(29, 13), '<status_bar><move npc="isna" to="town"/></status_bar>');
    assert.strictEqual(wS.npcs.isna.location, 'town', 'After baron_purged, Isna can move independently again');
    wS = OKHBackground.advance(wS, { id: 's9', revision: 'rs9', toMin: DAY(33, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wS.npcs.nise.values.affection, niseAffBeforePause - 1, '5 days after fugitive ends without interaction, Nise neglect resumes');

    // (c) High-affection (>= 80) Nise joins counterattack directly even when nise_casino_busy_today is true
    let wNH = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wNH.flags.arrived_oakhaven = true;
    wNH.flags.eileen_arrived = true;
    wNH.npcs.eileen.monitored = true;
    wNH.npcs.eileen.location = 'manor';
    wNH.npcs.eileen.flags.eileenInspectDays = 6;
    wNH.npcs.aurora.values.affection = 80;
    wNH.npcs.aurora.flags.manor_service_active = true;
    wNH.npcs.aurora.location = 'inn';
    wNH.npcs.nise.values.affection = 82;
    wNH.npcs.nise.flags.nise_casino_busy_today = true;
    wNH.playerLocation = 'town';
    wNH.timeMin = DAY(21, 9);
    wNH = OKHBackground.advance(wNH, { id: 'nh1', revision: 'rnh1', toMin: DAY(21, 10), interactingIds: [], front: {} }, cfg).state;
    wNH = stepFront(wNH, 'nh2', DAY(21, 10, 30), '<status_bar><event_resolve id="eileen_escort_offer" npc="eileen" outcome="accept"/></status_bar>');
    assert.strictEqual(wNH.npcs.nise.flags.eileen_nise_helped, true, 'High-affection >=80 Nise joins counterattack despite nise_casino_busy_today');
    assert.strictEqual(wNH.npcs.nise.flags.nise_casino_busy_today, false);
    assert.strictEqual(wNH.npcs.nise.location, 'wilds');

    // (d) Female stage === 3 drops affection <= 50 and locks against bonds, front patches & neglect
    let wL = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wL.flags.arrived_oakhaven = true;
    wL.timeMin = DAY(30, 8);
    wL.playerLocation = 'manor';
    wL.npcs.aurora.location = 'manor';
    wL.npcs.aurora.stage = 2;
    wL.npcs.aurora.values.affection = 85;
    wL.npcs.aurora.values.debt_pressure = 60;
    wL.npcs.aurora.flags = { manor_service_active: true, manorWorkDays: 21, aurora_evt1_done: true, aurora_evt2_done: true, lastNightSettledDay: 29 };
    wL.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' }, aurora_stage_2: { status: 'completed' } };
    wL = OKHBackground.advance(wL, { id: 'l1', revision: 'rl1', toMin: DAY(30, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wL.npcs.aurora.stage, 3);
    assert.strictEqual(wL.npcs.aurora.values.affection, 50, 'High-affection female entering stage 3 drops to 50');
    assert.strictEqual(wL.npcs.aurora.flags.affection_locked, true);

    wL = OKHBackground.advance(wL, {
      id: 'l2', revision: 'rl2', toMin: DAY(30, 10), interactingIds: [],
      front: { npcs: { aurora: { add: { affection: 15 } } } }
    }, cfg).state;
    wL = stepFront(wL, 'l3', DAY(30, 11), '<status_bar><bond npc="aurora" kind="offend"/></status_bar>');
    assert.strictEqual(wL.npcs.aurora.values.affection, 50, 'Locked stage-3 affection resists both positive and negative changes');

    // Low starting affection (<50) entering stage 3 preserves lower affection instead of jumping upward
    let wLow = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wLow.flags.eileen_arrived = true;
    wLow.npcs.eileen.monitored = true;
    wLow.npcs.eileen.stage = 2;
    wLow.npcs.eileen.values.affection = 0;
    wLow.npcs.eileen.flags = { eileen_captured: true, eileenCaptiveDays: 21, eileen_evt1_done: true, eileen_evt2_done: true };
    wLow.npcs.eileen.nodeStates = { eileen_stage_1: { status: 'completed' }, eileen_stage_2: { status: 'completed' } };
    wLow = OKHBackground.advance(wLow, { id: 'll1', revision: 'rll1', toMin: DAY(2, 9), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wLow.npcs.eileen.stage, 3);
    assert.strictEqual(wLow.npcs.eileen.values.affection, 0, 'Already <50 affection stays <=50 without artificially rising to 50');
    assert.strictEqual(wLow.npcs.eileen.flags.affection_locked, true);
    wLow = OKHBackground.advance(wLow, {
      id: 'll2', revision: 'rll2', toMin: DAY(2, 10), interactingIds: [],
      front: { npcs: { eileen: { add: { affection: 25 } } } }
    }, cfg).state;
    assert.strictEqual(wLow.npcs.eileen.values.affection, 0);
  });

  // 15. Aurora weekend-night return, church/weekend confess guardrails, weekday off-manor protection, immediate purge return & ledger summary
  await test('15. Aurora audit fixes: weekend-night return, weekday/purge confess guardrails, worked-day tracking & ledger', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER } = sb;
    const { DAY } = OKH_APP_CONFIG;
    const cfg = OKH_APP_CONFIG.buildConfig();

    // (a) Weekend-night jump at manor still triggers aurora_weekend_return to inn (previously blocked to morning/afternoon only)
    let wWk = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wWk.flags.arrived_oakhaven = true;
    wWk.playerLocation = 'inn';
    wWk.npcs.aurora.location = 'manor';
    wWk.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, lastNightSettledDay: 5 };
    wWk.timeMin = DAY(6, 18); // Sat 18:00 night
    wWk = OKHBackground.advance(wWk, { id: 'aw1', revision: 'raw1', toMin: DAY(7, 1), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wWk.npcs.aurora.location, 'inn', 'Weekend night boundary triggers aurora_weekend_return from manor to inn');

    // (b) aurora_manor_confess blocked on weekdays & post-purge, allowed on weekend at church alongside aurora_debt_disclose
    let wCf = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wCf.flags.arrived_oakhaven = true;
    wCf.flags.eileen_fugitive = true;
    wCf.playerLocation = 'inn';
    wCf.npcs.aurora.location = 'inn';
    wCf.npcs.aurora.stage = 1;
    wCf.npcs.aurora.values.affection = 92;
    wCf.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, aurora_evt1_done: true, aurora_lord_punished: true, lastNightSettledDay: 7 };
    wCf.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' } };
    wCf.timeMin = DAY(8, 8); // Mon morning (weekday)
    wCf = OKHBackground.advance(wCf, { id: 'ac1', revision: 'rac1', toMin: DAY(8, 9), interactingIds: ['aurora'], front: {} }, cfg).state;
    assert.strictEqual(wCf.npcs.aurora.flags.aurora_manor_confessed, undefined, 'aurora_manor_confess must not fire on weekdays');

    // Ledger on weekday during fugitive arc surfaces manor schedule, lord punishment & pending intel
    const wkdayLedger = OKH_APP_ADAPTER.buildLedger(wCf);
    assert(wkdayLedger.includes('当前工作日驻守领主山庄') && wkdayLedger.includes('已遭伯爵迁怒责罚') && wkdayLedger.includes('暗藏山庄换防与暗锁情报'),
      'Weekday ledger surfaces Aurora manor duty, lord punishment & pending manor intel');

    // Weekend at church triggers disclose + confess (stage 2), and weekend ledger reflects weekend reunion
    wCf.timeMin = DAY(6, 8);
    wCf.playerLocation = 'church';
    wCf.npcs.aurora.location = 'church';
    wCf.npcs.aurora.stage = 2;
    wCf.npcs.aurora.flags.lastNightSettledDay = 5;
    const wkendLedger = OKH_APP_ADAPTER.buildLedger(wCf);
    assert(wkendLedger.includes('当前周末休假在城内归队'), 'Weekend ledger surfaces Aurora town reunion window');
    wCf = OKHBackground.advance(wCf, { id: 'ac2', revision: 'rac2', toMin: DAY(6, 10), interactingIds: ['aurora'], front: {} }, cfg).state;
    assert.strictEqual(wCf.npcs.aurora.flags.aurora_debt_disclosed, true, 'aurora_debt_disclose works at church too');
    assert.strictEqual(wCf.npcs.aurora.flags.aurora_manor_confessed, true, 'aurora_manor_confess works at church on weekend in stage 2');

    // Post-purge / left-manor blocks late aurora_manor_confess on weekend
    let wPost = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wPost.flags.arrived_oakhaven = true;
    wPost.flags.baron_purged = true;
    wPost.playerLocation = 'inn';
    wPost.npcs.aurora.location = 'inn';
    wPost.npcs.aurora.stage = 1;
    wPost.npcs.aurora.values.affection = 95;
    wPost.npcs.aurora.flags = { manor_service_active: false, aurora_left_manor: true, aurora_evt1_done: true };
    wPost.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' } };
    wPost.timeMin = DAY(6, 9);
    wPost = OKHBackground.advance(wPost, { id: 'ap1', revision: 'rap1', toMin: DAY(6, 10), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wPost.npcs.aurora.flags.aurora_manor_confessed, undefined, 'aurora_manor_confess must not fire after purge/resignation');

    // (c) Holding Aurora off manor across an entire Monday must NOT add manorWorkDays; daytime manor shift + evening inn dinner DOES count!
    let wWd = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wWd.flags.arrived_oakhaven = true;
    wWd.playerLocation = 'inn';
    wWd.npcs.aurora.location = 'inn';
    wWd.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 0, lastNightSettledDay: 7 };
    wWd.timeMin = DAY(8, 5); // Mon 05:00
    wWd = OKHBackground.advance(wWd, { id: 'wd1', revision: 'rwd1', toMin: DAY(9, 1), interactingIds: ['aurora'], front: {} }, cfg).state;
    assert.strictEqual(wWd.npcs.aurora.flags.manorWorkDays, 0, 'Keeping Aurora off manor the entire Monday skips manorWorkDays +1');

    // Tue daytime at manor -> records worked day -> evening inn dinner crosses Tue midnight -> manorWorkDays increments to 1
    wWd = OKHBackground.advance(wWd, { id: 'wd2', revision: 'rwd2', toMin: DAY(9, 14), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wWd.npcs.aurora.location, 'manor');
    assert.strictEqual(wWd.npcs.aurora.flags.aurora_worked_manor_day, 9);
    wWd = OKHBackground.advance(wWd, { id: 'wd3', revision: 'rwd3', toMin: DAY(10, 1), interactingIds: ['aurora'], front: { npcs: { aurora: { location: 'inn' } } } }, cfg).state;
    assert.strictEqual(wWd.npcs.aurora.flags.manorWorkDays, 1, 'Working Tue daytime at manor counts Tue even when pulled to inn for dinner');

    // (d) eileen_purge_aurora_freed immediately returns surviving <3 Aurora to inn upon baron_purged
    let wPf = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wPf.flags.arrived_oakhaven = true;
    wPf.flags.eileen_arrived = true;
    wPf.flags.eileen_fugitive = true;
    wPf.flags.eileen_signal_fired = true;
    wPf.npcs.eileen.monitored = true;
    wPf.npcs.eileen.flags = { eileen_fugitive: true, eileen_signal_fired: true, eileenSignalDays: 0, lastNightSettledDay: 24 };
    wPf.npcs.aurora.location = 'manor';
    wPf.npcs.aurora.stage = 1;
    wPf.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, aurora_evt1_done: true, lastNightSettledDay: 24 };
    wPf.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' } };
    wPf.timeMin = DAY(25, 22);
    wPf = OKHBackground.advance(wPf, { id: 'pf1', revision: 'rpf1', toMin: DAY(26, 2), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wPf.flags.baron_purged, true);
    assert.strictEqual(wPf.npcs.aurora.flags.manor_service_active, false);
    assert.strictEqual(wPf.npcs.aurora.flags.aurora_left_manor, true);
    assert.strictEqual(wPf.npcs.aurora.location, 'inn', 'eileen_purge_aurora_freed returns surviving Aurora to inn immediately');
  });

  // 16. Audit bugfixes: Gulan room protection blocks Ed night gain, ambush manualRelease releaseRule guard
  await test('16. Audit bugfixes: room-target blocks blood_density, releaseRule check', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP_CONFIG, OKH_APP_PARSE, OKH_APP_ADAPTER, OKHBackground } = sb;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();

    // (a) Stage-2 Gulan with affection >= 90 & playerRoomTarget === 'gulan' blocks midnight +2 gain; leaving/dropping protection restores it
    let wRoom = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wRoom.flags.arrived_oakhaven = true;
    wRoom.flags.ed_joined = true;
    wRoom.npcs.ed.monitored = true;
    wRoom.playerLocation = 'inn';
    wRoom.npcs.ed.location = 'inn';
    wRoom.npcs.gulan.location = 'inn';
    wRoom.npcs.gulan.stage = 2;
    wRoom.npcs.gulan.values.affection = 92;
    wRoom.npcs.gulan.values.blood_density = 50;
    wRoom.npcs.gulan.nodeStates = { gulan_stage_1: { status: 'completed' }, gulan_stage_2: { status: 'completed' } };
    wRoom.timeMin = DAY(10, 22);
    wRoom = OKHBackground.advance(wRoom, {
      id: 'rm1', revision: 'rrm1', toMin: DAY(11, 2), interactingIds: [],
      front: { room: { npc: 'gulan', state: 'together', at: 'start' } }
    }, cfg).state;
    assert.strictEqual(wRoom.flags.playerRoomTarget, 'gulan');
    assert.strictEqual(wRoom.npcs.gulan.values.blood_density, 50, 'Stage-2 room protection blocks Ed +2 midnight gain');
    wRoom = OKHBackground.advance(wRoom, { id: 'rm2', revision: 'rrm2', toMin: DAY(11, 8), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wRoom.flags.playerRoomTarget, null, 'Room protection clears after 06:00 dawn');
    wRoom = OKHBackground.advance(wRoom, { id: 'rm3', revision: 'rrm3', toMin: DAY(12, 2), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wRoom.npcs.gulan.values.blood_density, 52, 'Unprotected next night restores stage-2 +2 gain');

    // (b) manualRelease activity (stored on activity.releaseRule) blocks Isna & high-aff Nise from ambush aid
    let wPin = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wPin.flags.arrived_oakhaven = true;
    wPin.flags.eileen_arrived = true;
    wPin.flags.eileen_departed = true;
    wPin.flags.eileen_fugitive = true;
    wPin.npcs.eileen.monitored = true;
    wPin.npcs.eileen.location = 'wilds';
    wPin.npcs.eileen.flags = { eileen_fugitive: true, eileen_disguised: true };
    wPin.playerLocation = 'wilds';
    wPin.npcs.isna.location = 'town';
    wPin.npcs.isna.activity = { id: 'isna_pin', kind: 'important', label: '驻守任务', source: 'narrative', startedAt: DAY(20, 10), releaseRule: 'manualRelease' };
    wPin.npcs.nise.location = 'inn';
    wPin.npcs.nise.values.affection = 90;
    wPin.npcs.nise.activity = { id: 'nise_pin', kind: 'special', label: '封印值守', source: 'narrative', startedAt: DAY(20, 10), releaseRule: 'manualRelease' };
    wPin.timeMin = DAY(21, 10);
    wPin = OKHBackground.advance(wPin, { id: 'pin1', revision: 'rpin1', toMin: DAY(21, 10), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wPin.flags.eileen_ambush_closed, true);
    assert.strictEqual(wPin.npcs.isna.flags.eileen_isna_helped, undefined, 'manualRelease activity blocks eileen_ambush_isna_aid');
    assert.strictEqual(wPin.npcs.nise.flags.eileen_nise_helped, undefined, 'manualRelease activity blocks eileen_ambush_nise_aid_high');
    assert.strictEqual(wPin.npcs.eileen.values.counterattack, 0);
  });

  // 17. Gulan stage-3 dark fallback (gulan_final_fall_dark): low affection, high-affection absent, relapse after single rescue
  await test('17. Gulan stage-3 dark fallback covers low affection, absent high affection, and post-rescue relapse', async () => {
    const sb = createSandbox();
    makeStorage(sb);
    const { OKH_APP_CONFIG, OKHBackground, OKHBackgroundModules } = sb;
    const u = OKHBackgroundModules.utils;
    const DAY = OKH_APP_CONFIG.DAY;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const setupBase = () => {
      const w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
      w.flags.arrived_oakhaven = true;
      w.flags.ed_joined = true;
      w.npcs.ed.monitored = true;
      w.npcs.ed.alive = true;
      w.npcs.ed.location = 'inn';
      w.npcs.gulan.location = 'inn';
      w.npcs.gulan.stage = 2;
      w.npcs.gulan.nodeStates = {
        gulan_stage_1: { status: 'completed' },
        gulan_stage_2: { status: 'completed' }
      };
      w.timeMin = DAY(10, 21);
      return w;
    };

    // (a) Low affection (<90) + blood_density >= 80 at night with Ed -> triggers gulan_final_fall_dark & advances to stage 3
    let wLow = setupBase();
    wLow.playerLocation = 'inn';
    wLow.npcs.gulan.values.affection = 80;
    wLow.npcs.gulan.values.blood_density = 80;
    wLow = OKHBackground.advance(wLow, { id: 'gf1', revision: 'rgf1', toMin: DAY(10, 22), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wLow.npcs.gulan.flags.gulan_final_fall_done, true, 'Low affection >=80 bd triggers gulan_final_fall_dark');
    assert.strictEqual(wLow.npcs.gulan.stage, 3, 'gulan_stage_3 advances immediately in same turn');
    assert.strictEqual(wLow.npcs.gulan.values.affection, 50, 'Stage 3 caps affection at 50');
    assert.strictEqual(wLow.npcs.gulan.flags.affection_locked, true, 'Stage 3 locks affection');

    // (b) High affection (>=90), rescue_count=0, player away at wilds:
    // bd=79 stays in stage 2, bd=80 falls covertly to stage 3
    let wAway = setupBase();
    wAway.playerLocation = 'wilds';
    wAway.npcs.gulan.values.affection = 92;
    wAway.npcs.gulan.values.blood_density = 79;
    wAway = OKHBackground.advance(wAway, { id: 'gf2', revision: 'rgf2', toMin: DAY(10, 21) + 5, interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wAway.npcs.gulan.stage, 2, 'High affection away with bd=79 stays in stage 2');
    wAway.npcs.gulan.values.blood_density = 80;
    wAway = OKHBackground.advance(wAway, { id: 'gf3', revision: 'rgf3', toMin: DAY(10, 22), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wAway.npcs.gulan.flags.gulan_final_fall_done, true, 'High affection away with bd=80 triggers gulan_final_fall_dark');
    assert.strictEqual(wAway.npcs.gulan.stage, 3, 'Absent high-affection Gulan falls to stage 3 at bd=80');

    // (c) High affection (>=90), rescue_count=0, player AT inn, bd=82 still triggers interaction prompt rather than dark auto-fall
    let wPresent = setupBase();
    wPresent.playerLocation = 'inn';
    wPresent.npcs.gulan.values.affection = 92;
    wPresent.npcs.gulan.values.blood_density = 82;
    wPresent = OKHBackground.advance(wPresent, { id: 'gf4', revision: 'rgf4', toMin: DAY(10, 22), interactingIds: [], front: {} }, cfg).state;
    const promptKey = u.key('event', 'gulan_final_rescue_prompt', 'gulan');
    assert.strictEqual(wPresent.bg.eventStates[promptKey]?.status, 'pending', 'Player present at inn with >=90 still gets rescue prompt');
    assert.strictEqual(wPresent.npcs.gulan.stage, 2, 'Rescue prompt does not skip straight to stage 3');

    // (d) After 1 rescue (rescue_count=1, next threshold 90):
    // staying at inn prompts step 2 instead of falling; leaving inn at >=90 triggers covert fall
    let wRelapse = setupBase();
    wRelapse.playerLocation = 'inn';
    wRelapse.npcs.gulan.values.affection = 92;
    wRelapse.npcs.gulan.values.blood_density = 90;
    wRelapse.npcs.gulan.flags.gulan_rescue_count = 1;
    wRelapse = OKHBackground.advance(wRelapse, { id: 'gf5', revision: 'rgf5', toMin: DAY(10, 22), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wRelapse.npcs.gulan.stage, 2, 'Present at inn prompts step 2 rescue instead of dark fall');
    assert.strictEqual(wRelapse.bg.eventStates[promptKey]?.status, 'pending', 'Step 2 rescue prompt is pending at inn');

    wRelapse.playerLocation = 'wilds';
    wRelapse = OKHBackground.advance(wRelapse, { id: 'gf6', revision: 'rgf6', toMin: DAY(10, 23), interactingIds: [], front: {} }, cfg).state;
    assert.strictEqual(wRelapse.npcs.gulan.flags.gulan_final_fall_done, true, 'Away at >=90 bd after 1 rescue triggers gulan_final_fall_dark');
    assert.strictEqual(wRelapse.npcs.gulan.stage, 3, 'Unprotected absent Gulan advances to stage 3');
    assert.strictEqual(wRelapse.npcs.gulan.values.affection, 50, 'Relapsed stage 3 caps affection at 50');
    assert.strictEqual(wRelapse.npcs.gulan.flags.affection_locked, true, 'Relapsed stage 3 locks affection');
  });

  // 18. Economy system: gold ledger, lodging/arrears, consumable bonds, work/guild/repay & bounties
  await test('18. Economy system: gold ledger, lodging arrears, consumable bonds, deterministic guild injury & debt repay', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER, OKH_APP_HUD, OKH_APP_MIGRATE } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'r_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    // (a) Initial 30 gold, prequel night does NOT charge lodging; post-arrival charges -5/day & arrears < 5
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w.playerState.gold, 30, 'Initial gold starts at 30');
    w = stepFront(w, 'e_pre', DAY(2, 9), '<status_bar><time elapsed="900" end="2日09:00"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 30, 'Prequel midnight does not deduct inn lodging');

    // Manually set 40 gold to test standard 8-night drain cycle to Day 10/11
    w.playerState.gold = 40;
    w = stepFront(w, 'e_arr', DAY(2, 12), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>');
    // Advance 9 nights (Day 2->Day 11) with 40 gold -> 8 nights spend 40->0, 9th night triggers inn_arrears
    w = stepFront(w, 'e_d10', DAY(10, 9), '<status_bar><time elapsed="1260" end="10日09:00"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 0, '8 nights of -5 gold drains 40 to 0');
    assert.strictEqual(w.flags.inn_arrears, false);
    w = stepFront(w, 'e_d11', DAY(11, 9), '<status_bar><time elapsed="1440" end="11日09:00"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 0);
    assert.strictEqual(w.flags.inn_arrears, true, 'Night with <5 gold sets inn_arrears=true');
    assert(OKH_APP_HUD.buildHudHtml(w).includes('旅店欠账'), 'HUD displays inn arrears tag');
    assert(OKH_APP_ADAPTER.buildLedger(w).includes('持有金币：0 金'), 'Ledger displays current gold');

    // (b) Consumable bond blocked while arrears/low gold; steady_work earns +6 and clears inn_arrears
    const affBeforeArrears = w.npcs.aurora.values.affection;
    w = stepFront(w, 'e_gift_fail', DAY(11, 10), '<status_bar><bond npc="aurora" kind="gift"/></status_bar>');
    assert.strictEqual(w.npcs.aurora.values.affection, affBeforeArrears, 'Arrears at inn blocks consumable gift');

    w = stepFront(w, 'e_steady', DAY(11, 16),
      '<status_bar><move to="town" at="start"/><move npc="isna" to="town" at="start"/><interact npc="isna"/><bond npc="isna" kind="steady_work"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 6, 'steady_work grants the 6 gold odd-job wage');
    assert.strictEqual(w.flags.inn_arrears, false, 'Earning >=5 gold clears inn_arrears');
    assert.strictEqual(w.flags.playerOddJobDay, 11);

    // Same-day odd job blocked (quota shared with steady_work)
    w = stepFront(w, 'e_odd_dup', DAY(11, 22), '<status_bar><economy op="work" tier="odd"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 6, 'Daily odd job quota is shared with isna steady_work');

    // Now gift works (-2 gold) and rejects numeric cheat attributes in parser
    assert.throws(() => sb.OKH_APP_PARSE.buildFront('<status_bar><economy op="work" tier="odd" gold="999"/></status_bar>', DAY(11, 22), w, { config: cfg }));
    w = stepFront(w, 'e_gift_ok', DAY(11, 22, 30), '<status_bar><move to="inn"/><move npc="aurora" to="inn"/><bond npc="aurora" kind="gift"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 4, 'aurora.gift deducts -2 gold cleanly');

    // (c) guild_normal (+28, 3d cooldown, sets player_guild_job_done) & guild_high deterministic replay
    w = stepFront(w, 'e_gn1', DAY(12, 16), '<status_bar><move to="town" at="12日08:00"/><economy op="work" tier="guild_normal"/></status_bar>');
    // Spend the remaining 4 at midnight, then earn 28 after eight hours of work.
    assert.strictEqual(w.playerState.gold, 28, 'guild_normal grants +28 gold after lodging');
    assert.strictEqual(w.npcs.gulan.flags.player_guild_job_done, true, 'guild_normal sets player_guild_job_done');
    // Day 12->13 stayed in town (non-inn): lodging NOT double-charged, supply consumed instead; guild_normal blocked by cooldown
    w = stepFront(w, 'e_gn_cd', DAY(13, 16), '<status_bar><economy op="work" tier="guild_normal"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 28, 'guild_normal on cooldown rejected; non-inn midnight does not charge lodging');

    // Run both high-risk branches after the Bronze promotion, with a full 24-hour work window.
    w.playerState.guild_merit = 20;
    w.flags.lastGuildCommissionDay = null;
    w.flags.lastGuildCommissionStartMin = null;
    w.flags.guildCommissionStarts = [];
    w.npcs.isna.location = 'inn';
    w.npcs.gulan.location = 'wilds';
    const goldBeforeHigh = w.playerState.gold;
    const fail = stepFront(w, 'e_gh_fail', DAY(14, 16), '<status_bar><interact npc="isna"/><economy op="work" tier="guild_high"/></status_bar>');
    assert.strictEqual(fail.playerState.gold, goldBeforeHigh, 'Full hours do not waive the high-risk companion requirement');

    w.npcs.gulan.flags.player_guild_job_done = false;
    const high = '<status_bar><move to="wilds" at="start"/><interact npc="gulan"/><economy op="work" tier="guild_high"/></status_bar>';
    const wHighA = stepFront(w, 'e_gh_ok', DAY(14, 16), high);
    const wHighB = stepFront(w, 'e_gh_ok', DAY(14, 16), high);
    assert.strictEqual(wHighA.playerState.gold, goldBeforeHigh + 48, 'guild_high with Gulan in the wilds pays 48 gold');
    assert.strictEqual(wHighA.npcs.gulan.flags.player_guild_job_done, true);
    assert.deepStrictEqual(wHighA, wHighB);

    // Use the original branch for the debt and bounty checks.
    w.playerState.gold = 350;
    w.npcs.aurora.values.debt_pressure = 20;
    w.npcs.aurora.values.affection = 85;
    w.npcs.aurora.flags.aurora_debt_disclosed = true;
    w.npcs.aurora.flags.manor_service_active = true;
    w.npcs.aurora.location = 'inn';
    w = stepFront(w, 'e_rep_part', DAY(13, 16, 15), '<status_bar><move to="inn"/><economy op="repay" npc="aurora" tier="part"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 250, 'part repay 10 pts costs 100 gold');
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 10);
    w = stepFront(w, 'e_rep_all', DAY(13, 16, 30), '<status_bar><economy op="repay" npc="aurora" tier="all"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 150, 'all repay clears remaining 10 pts (100 gold)');
    assert.strictEqual(w.npcs.aurora.values.debt_pressure, 0);
    assert.strictEqual(w.npcs.aurora.flags.aurora_debt_cleared, true);
    assert.strictEqual(w.npcs.aurora.flags.manor_service_active, false, 'Clearing debt quits manor service immediately');
    assert.strictEqual(w.npcs.aurora.flags.aurora_left_manor, true);

    // Lancaster purge (+1000) one-time payout (orc_camp_bounty_reward removed as deprecated)
    w.flags.eileen_signal_fired = true;
    w.npcs.eileen.monitored = true;
    w.npcs.eileen.flags.eileen_signal_fired = true;
    w.npcs.eileen.flags.eileenSignalDays = 1;
    w = stepFront(w, 'e_purge', DAY(13, 17), '<status_bar><time elapsed="10" end="13日17:10"/></status_bar>');
    assert.strictEqual(w.flags.baron_purged, true);
    assert.strictEqual(w.flags.lancaster_purge_reward_paid, true);
    assert.strictEqual(w.playerState.gold, 1150);

    // Legacy v1 save migration backfills gold & Cecilia initial funds
    const legacyV1 = { timeMin: DAY(2, 8), playerLocation: 'inn', npcs: { aurora: { id: 'aurora', location: 'inn', values: { debt_pressure: 0, affection: 50 }, flags: {} }, cecilia: { id: 'cecilia', location: 'church', values: { orphanage_funds: 0, affection: 20 }, flags: {} } } };
    const migrated = OKH_APP_MIGRATE.migrateWorld(legacyV1);
    assert.strictEqual(migrated.playerState.gold, 30);
    assert.strictEqual(migrated.npcs.cecilia.values.orphanage_funds, 50);
    assert.strictEqual(migrated.npcs.cecilia.values.donated_gold, 0);
  });

  // 19. Cecilia 6/7 full arc: early errands/bonds, <70 donate cap, midgame crisis, silent zero manor descent, 70/80/90 exemptions, 3 NSFW rewards & baron_purged stop
  await test('19. Cecilia full arc: drain, errands, <70 donate cap, 3 NSFW rewards, silent manor path & 70/80/90 exemptions', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const u = sb.OKHBackgroundModules.utils;
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'rc_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    // (a) Errands (2d cooldown: paid vs volunteer), 7 bonds & donate affection cap at 70 + 3 sequential NSFW rewards
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w.npcs.cecilia.values.orphanage_funds, 50);
    w = stepFront(w, 'c_arr', DAY(2, 8), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="church"/></status_bar>');
    w.playerState.gold = 500;
    w = stepFront(w, 'c_paid', DAY(2, 11), '<status_bar><economy op="work" tier="church_paid"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 503);
    assert.strictEqual(w.npcs.cecilia.values.orphanage_funds, 54);
    assert.strictEqual(w.npcs.cecilia.values.affection, 22);

    // Day 2/3 blocked by 2-day cooldown -> Day 4 church_volunteer works (+0 gold, +8 funds, +5 affection cleanly)
    w = stepFront(w, 'c_cd', DAY(3, 11), '<status_bar><economy op="work" tier="church_volunteer"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.values.orphanage_funds, 51, 'Midnight drained -3 (54->51), cooldown blocked volunteer');
    w = stepFront(w, 'c_vol', DAY(4, 11), '<status_bar><economy op="work" tier="church_volunteer"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.values.orphanage_funds, 56, 'Day 3->4 drained -3 (51->48) then volunteer +8 -> 56');
    assert.strictEqual(w.npcs.cecilia.values.affection, 27, 'Volunteer adds +5 affection cleanly');
    assert.strictEqual(w.playerState.gold, 503, 'Non-inn nights at church consume supply instead of lodging; volunteer adds +0 gold');

    // Donate affection cap strictly stops at 70
    w.npcs.cecilia.values.affection = 66;
    w = stepFront(w, 'c_don1', DAY(4, 12), '<status_bar><economy op="donate" npc="cecilia" tier="large"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.values.affection, 70, 'Donate +5 caps cleanly at 70');
    assert.strictEqual(w.npcs.cecilia.values.donated_gold, 15);
    assert.strictEqual(w.npcs.cecilia.values.orphanage_funds, 61);
    w = stepFront(w, 'c_don2', DAY(4, 13), '<status_bar><economy op="donate" npc="cecilia" tier="large"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.values.affection, 70, 'Donating at >=70 adds 0 affection');
    assert.strictEqual(w.npcs.cecilia.values.donated_gold, 30);
    assert.strictEqual(w.npcs.cecilia.values.orphanage_funds, 66);

    // Set donated_gold to 50 to test reward 1 unlock threshold
    w.npcs.cecilia.values.donated_gold = 50;

    // Night bonds on same Day 4 (volunteer already used 2 of daily cap 3, so shield +4 exempt + church_gift +1 remaining = +5 total) + 3 sequential NSFW rewards
    w = stepFront(w, 'c_r1', DAY(4, 21), '<status_bar><bond npc="cecilia" kind="shield_church"/><bond npc="cecilia" kind="church_gift"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.values.affection, 75);
    const rew1Key = u.key('event', 'cecilia_reward_1_oral', 'cecilia');
    assert.strictEqual(w.bg.eventStates[rew1Key]?.status, 'pending', 'Reward 1 unlocks at >=70 aff & >=50 donated_gold');
    // Leaving church expires pending reward cleanly, then returning at night re-triggers it (repeatable fix)
    w = stepFront(w, 'c_r1_lv', DAY(4, 21) + 5, '<status_bar><move to="inn"/></status_bar>');
    assert.strictEqual(w.bg.eventStates[rew1Key]?.outcome, 'expired', 'Leaving church cleanly expires unaccepted reward');
    w = stepFront(w, 'c_r1_ret', DAY(4, 21) + 8, '<status_bar><move to="church"/></status_bar>');
    assert.strictEqual(w.bg.eventStates[rew1Key]?.status, 'pending', 'Returning at night re-triggers expired reward 1 cleanly');
    w = stepFront(w, 'c_r1_ok', DAY(4, 21) + 10, '<status_bar><event_resolve id="cecilia_reward_1_oral" npc="cecilia" outcome="accept"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.flags.cecilia_reward1_done, true);

    // Cannot trigger reward 2 without donated_gold >= 150 & aff >= 80
    w.npcs.cecilia.values.affection = 82;
    w = stepFront(w, 'c_r2_no', DAY(4, 22), '<status_bar><time elapsed="10" end="4日22:10"/></status_bar>');
    const rew2Key = u.key('event', 'cecilia_reward_2_thighs', 'cecilia');
    assert.strictEqual(w.bg.eventStates[rew2Key], undefined, 'Reward 2 waits for donated_gold >= 150');
    w = stepFront(w, 'c_don3', DAY(4, 22) + 5, '<status_bar><economy op="donate" npc="cecilia" tier="large"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.values.donated_gold, 65);
    w.npcs.cecilia.values.donated_gold = 150;
    w = stepFront(w, 'c_r2_chk', DAY(4, 22) + 8, '<status_bar><time elapsed="5" end="4日22:13"/></status_bar>');
    assert.strictEqual(w.bg.eventStates[rew2Key]?.status, 'pending', 'Reward 2 triggers at donated_gold 150 & aff >= 80');
    w = stepFront(w, 'c_r2_ok', DAY(4, 22) + 15, '<status_bar><event_resolve id="cecilia_reward_2_thighs" npc="cecilia" outcome="accept"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.flags.cecilia_reward2_done, true);

    w.npcs.cecilia.values.affection = 90;
    w.npcs.cecilia.values.donated_gold = 300;
    w = stepFront(w, 'c_r3_go', DAY(4, 23), '<status_bar><time elapsed="10" end="4日23:10"/></status_bar>');
    const rew3Key = u.key('event', 'cecilia_reward_3_sex', 'cecilia');
    assert.strictEqual(w.bg.eventStates[rew3Key]?.status, 'pending', 'Reward 3 unlocks at 90 aff & 300 donated_gold');
    w = stepFront(w, 'c_r3_ok', DAY(4, 23) + 10, '<status_bar><event_resolve id="cecilia_reward_3_sex" npc="cecilia" outcome="accept"/></status_bar>');
    assert.strictEqual(w.npcs.cecilia.flags.cecilia_reward3_done, true);

    // (b) Low-affection silent manor descent: zero pre-warning in ledger, triggers +30/+40/+60 sequentially only on zeroing again
    let wDark = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wDark = stepFront(wDark, 'cd_arr', DAY(1, 19), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>');
    wDark.npcs.cecilia.values.affection = 30;
    assert(!OKH_APP_ADAPTER.buildLedger(wDark).includes('领主'), 'Ledger must NEVER leak manor pre-warning for Cecilia');
    wDark.npcs.cecilia.values.orphanage_funds = 3;
    // Crossing midnight drops 3->0 and silently advances stage 0->1 with +30 funds
    wDark = stepFront(wDark, 'cd_m1', DAY(2, 8), '<status_bar><time elapsed="60" end="2日08:00"/></status_bar>');
    assert.strictEqual(wDark.npcs.cecilia.stage, 1, 'Low affection silently goes to manor at 0 funds -> stage 1');
    assert.strictEqual(wDark.npcs.cecilia.values.orphanage_funds, 30, 'Stage 1 grants +30 orphanage funds');

    // Stage 2 must NOT trigger while funds > 0; triggers only when funds reach 0 again
    wDark.npcs.cecilia.values.orphanage_funds = 2;
    wDark = stepFront(wDark, 'cd_m2', DAY(3, 8), '<status_bar><time elapsed="60" end="3日08:00"/></status_bar>');
    assert.strictEqual(wDark.npcs.cecilia.stage, 2, 'Zeroing again triggers stage 2');
    assert.strictEqual(wDark.npcs.cecilia.values.orphanage_funds, 40, 'Stage 2 grants +40 funds');

    // Midgame crisis at arrivedDay + 14 (-10 shock & -5/day drain)
    wDark.npcs.cecilia.values.orphanage_funds = 80;
    wDark = stepFront(wDark, 'cd_mid', DAY(15, 8), '<status_bar><time elapsed="60" end="15日08:00"/></status_bar>');
    assert.strictEqual(wDark.npcs.cecilia.flags.cecilia_midgame_crisis, true);
    assert.strictEqual(wDark.npcs.cecilia.stage, 2, 'Funds remain >0 so stage stays 2 until zeroing');
    const fundsPre = wDark.npcs.cecilia.values.orphanage_funds;
    wDark = stepFront(wDark, 'cd_rate', DAY(16, 8), '<status_bar><time elapsed="1440" end="16日08:00"/></status_bar>');
    assert.strictEqual(fundsPre - wDark.npcs.cecilia.values.orphanage_funds, 5, 'Midgame crisis drains -5/day');

    wDark.npcs.cecilia.values.orphanage_funds = 0;
    wDark = stepFront(wDark, 'cd_m3', DAY(16, 9), '<status_bar><time elapsed="10" end="16日09:10"/></status_bar>');
    assert.strictEqual(wDark.npcs.cecilia.stage, 3, 'Third zeroing triggers stage 3 fall');
    assert.strictEqual(wDark.npcs.cecilia.values.orphanage_funds, 60);
    assert.strictEqual(wDark.npcs.cecilia.values.affection, 30, 'Stage 3 locks affection <= 50');
    assert.strictEqual(wDark.npcs.cecilia.flags.affection_locked, true);

    // (c) High-affection exemption (70/80/90): repeatable consultation, help saves funds, 2-day ignore or let_go triggers manor; baron_purged stops drain
    let wSave = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wSave = stepFront(wSave, 'cs_arr', DAY(1, 19), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>');
    wSave.playerState.gold = 300;
    wSave.npcs.cecilia.values.affection = 75;
    wSave.npcs.cecilia.values.orphanage_funds = 0;
    wSave = stepFront(wSave, 'cs_ap1', DAY(1, 20), '<status_bar><time elapsed="10" end="1日20:10"/></status_bar>');
    const ap1Key = u.key('event', 'cecilia_manor_appeal_1', 'cecilia');
    assert.strictEqual(wSave.npcs.cecilia.stage, 0, 'High affection >=70 stops auto manor and raises consultation');
    assert.strictEqual(wSave.bg.eventStates[ap1Key]?.status, 'pending');
    assert(OKH_APP_ADAPTER.buildLedger(wSave).includes('cecilia_manor_appeal_1'), 'Consultation appears in pending event ledger');

    wSave = stepFront(wSave, 'cs_h1', DAY(1, 21), '<status_bar><event_resolve id="cecilia_manor_appeal_1" npc="cecilia" outcome="help"/></status_bar>');
    assert.strictEqual(wSave.playerState.gold, 270);
    assert.strictEqual(wSave.npcs.cecilia.values.orphanage_funds, 30);
    assert.strictEqual(wSave.npcs.cecilia.values.donated_gold, 30);
    assert.strictEqual(wSave.npcs.cecilia.values.affection, 79);

    // Second zeroing repeats consultation cleanly! Also forbid cancel-loop and verify herb_assist resets ceciliaAppealDays
    wSave.npcs.cecilia.values.orphanage_funds = 0;
    wSave = stepFront(wSave, 'cs_ap1_r', DAY(1, 22), '<status_bar><time elapsed="10" end="1日22:10"/></status_bar>');
    assert.strictEqual(wSave.bg.eventStates[ap1Key]?.status, 'pending');
    assert.strictEqual(wSave.bg.eventStates[ap1Key]?.occurrence, 2, 'Consultation is repeatable upon re-zeroing');
    assert.throws(
      () => stepFront(wSave, 'cs_no_cancel', DAY(1, 22) + 5, '<status_bar><event_resolve id="cecilia_manor_appeal_1" npc="cecilia" outcome="cancel"/></status_bar>'),
      /不允许取消/,
      'Manor appeal disables cancel-retrigger loop'
    );

    // herb_assist rescuing 0 -> 1 on same night resets ceciliaAppealDays = 0 cleanly
    wSave.npcs.cecilia.flags.ceciliaAppealDays = 1;
    wSave = stepFront(wSave, 'cs_herb_save', DAY(1, 23), '<status_bar><move to="church"/><bond npc="cecilia" kind="herb_assist"/></status_bar>');
    assert.strictEqual(wSave.npcs.cecilia.values.orphanage_funds, 1);
    assert.strictEqual(wSave.npcs.cecilia.flags.ceciliaAppealDays, 0, 'herb_assist resets appeal wait days');

    // Single-step 2nd-midnight rollover immediately triggers stage 1 AND expires stale appeal in the exact same turn
    wSave.npcs.cecilia.values.orphanage_funds = 0;
    wSave = stepFront(wSave, 'cs_ap1_r2', DAY(1, 23) + 10, '<status_bar><time elapsed="10" end="1日23:20"/></status_bar>');
    assert.strictEqual(wSave.bg.eventStates[ap1Key]?.status, 'pending');
    wSave = stepFront(wSave, 'cs_mid1', DAY(2, 1), '<status_bar><time elapsed="100" end="2日01:00"/></status_bar>');
    assert.strictEqual(wSave.npcs.cecilia.flags.ceciliaAppealDays, 1);
    assert.strictEqual(wSave.bg.eventStates[ap1Key]?.status, 'pending');
    wSave = stepFront(wSave, 'cs_ign', DAY(3, 1), '<status_bar><time elapsed="1440" end="3日01:00"/></status_bar>');
    assert.strictEqual(wSave.npcs.cecilia.stage, 1, 'Ignoring high-affection consultation 2 days sends Cecilia to manor');
    assert.strictEqual(wSave.bg.eventStates[ap1Key]?.outcome, 'expired', 'Stale appeal expires in the same turn stage 1 triggers');

    // Stage 1 requires >=80 aff: 79 < 80 silently goes to stage 2 if 0 funds, OR 82 triggers appeal_2; test let_go + baron_purged stop
    wSave.npcs.cecilia.values.affection = 82;
    wSave.npcs.cecilia.values.orphanage_funds = 0;
    wSave = stepFront(wSave, 'cs_ap2', DAY(4, 9), '<status_bar><time elapsed="10" end="4日09:10"/></status_bar>');
    const ap2Key = u.key('event', 'cecilia_manor_appeal_2', 'cecilia');
    assert.strictEqual(wSave.bg.eventStates[ap2Key]?.status, 'pending');
    wSave = stepFront(wSave, 'cs_lg2', DAY(4, 10), '<status_bar><event_resolve id="cecilia_manor_appeal_2" npc="cecilia" outcome="let_go"/></status_bar>');
    assert.strictEqual(wSave.npcs.cecilia.stage, 2, 'Choosing let_go sends Cecilia to stage 2 in same turn');

    // baron_purged stops further daily drain and triggers cecilia_post_purge_relief (+40 -> 80)
    wSave.flags.baron_purged = true;
    const fundsPurge = wSave.npcs.cecilia.values.orphanage_funds;
    wSave = stepFront(wSave, 'cs_bp', DAY(5, 8), '<status_bar><time elapsed="1440" end="5日08:00"/></status_bar>');
    assert.strictEqual(wSave.npcs.cecilia.values.orphanage_funds, fundsPurge + 40, 'baron_purged stops drain & triggers post-purge relief');

    const v1SettledZero = OKH_APP_CONFIG.buildInitialWorld();
    v1SettledZero.schemaVersion = 1;
    v1SettledZero.npcs.cecilia.values.orphanage_funds = 0;
    v1SettledZero.npcs.cecilia.flags.lastNightSettledDay = 3;
    const migratedZero = sb.OKH_APP_MIGRATE.migrateWorld(v1SettledZero);
    assert.strictEqual(migratedZero.npcs.cecilia.values.orphanage_funds, 0, 'Migration preserves settled 0 orphanage_funds');
  });

  // 20. Nise 3/7 casino & gamble_debt full arc: taste, 3d debt 10, +2/+4 midnight interest, 30/60/90 stages, repay & >=90 relapse immunity
  await test('20. Nise casino & gamble_debt arc: taste, +2/+4 interest, 30/60/90 stages, busy lock, repay & >=90 relapse immunity', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'rn_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w = stepFront(w, 'n_arr', DAY(1, 19), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>');
    w.npcs.nise.values.curiosity = 70;
    w.npcs.nise.values.affection = 82;
    w.npcs.nise.location = 'town';
    w = stepFront(w, 'n_taste', DAY(2, 11), '<status_bar><time elapsed="60" end="2日11:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.flags.tasted_casino, true, 'curiosity >=70 at town triggers nise_first_taste');
    assert.strictEqual(w.npcs.nise.flags.nise_hint_done, true, 'High affection >=80 triggers casino hint');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 0, 'First taste leaves gamble_debt at 0');

    // +3 midnights -> nise_first_debt (gamble_debt = 10)
    w = stepFront(w, 'n_d5', DAY(5, 11), '<status_bar><time elapsed="120" end="5日11:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.flags.nise_first_debt_done, true);
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 10, '+3 days after taste sets first gamble_debt = 10');

    // Repay debt via <economy op="repay" npc="nise" tier="all" /> after confess -> >=90 exempts relapse, <90 relapses
    w.playerState.gold = 300;
    w.npcs.nise.values.gamble_debt = 10;
    w.npcs.nise.flags.nise_debt_known = true;
    w.npcs.nise.values.affection = 80;
    w = stepFront(w, 'n_rep1', DAY(5, 14), '<status_bar><move to="inn"/><economy op="repay" npc="nise" tier="all"/></status_bar>');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 0);
    assert.strictEqual(w.playerState.gold, 200);
    assert.strictEqual(w.npcs.nise.flags.debt_repaid_once, true);

    // Affection < 90 + curiosity >= 65 relapses after 3 days (+10 gamble_debt)
    w = stepFront(w, 'n_rel', DAY(8, 12), '<status_bar><move to="inn"/><time elapsed="120" end="8日12:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 10, 'Affection < 90 relapses after 3 days');

    // Repay again, raise affection to 90 -> permanently exempt from relapse!
    w.npcs.nise.values.affection = 92;
    w.npcs.nise.values.gamble_debt = 10;
    w.npcs.nise.flags.nise_debt_known = true;
    w = stepFront(w, 'n_rep2', DAY(8, 15), '<status_bar><economy op="repay" npc="nise" tier="all"/></status_bar>');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 0);
    w = stepFront(w, 'n_no_rel', DAY(12, 12), '<status_bar><time elapsed="120" end="12日12:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 0, 'Affection >= 90 permanently exempts post-repay relapse');

    // Midnight interest (<60: +2/day, >=60: +4/day) + Stage 1/2/3 casino progression
    w.npcs.nise.values.affection = 70;
    w.npcs.nise.values.gamble_debt = 28;
    w = stepFront(w, 'n_s1', DAY(13, 11), '<status_bar><time elapsed="120" end="13日11:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, 30, 'Midnight interest adds +2 while < 60 (28->30)');
    assert.strictEqual(w.npcs.nise.stage, 1, 'gamble_debt >= 30 triggers stage 1 dealer');
    assert.strictEqual(w.npcs.nise.flags.nise_dealer_done, true);
    assert.strictEqual(w.npcs.nise.flags.nise_casino_busy_today, true);
    assert.strictEqual(w.npcs.nise.location, 'casino');
    w = stepFront(w, 'n_s1_night', DAY(13, 21), '<status_bar><time elapsed="60" end="13日21:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.location, 'inn', 'Stage 1 dealer returns to inn at night');

    w.npcs.nise.values.gamble_debt = 60;
    w = stepFront(w, 'n_s2', DAY(14, 11), '<status_bar><time elapsed="120" end="14日11:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.stage, 2, 'gamble_debt >= 60 triggers stage 2 private secretary');
    assert.strictEqual(w.npcs.nise.flags.nise_secretary_done, true);
    assert.strictEqual(w.npcs.nise.flags.nise_casino_busy_today, true);
    w = stepFront(w, 'n_s2_night', DAY(14, 21), '<status_bar><time elapsed="60" end="14日21:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.location, 'casino', 'Stage 2 full-day busy stays in casino even at night');

    const debtBeforeHighInt = w.npcs.nise.values.gamble_debt;
    w = stepFront(w, 'n_int60', DAY(15, 7), '<status_bar><time elapsed="60" end="15日07:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.values.gamble_debt, debtBeforeHighInt + 4, 'Midnight interest adds +4 while >= 60');

    w.npcs.nise.values.gamble_debt = 90;
    w = stepFront(w, 'n_s3', DAY(15, 11), '<status_bar><time elapsed="60" end="15日11:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.stage, 3, 'gamble_debt >= 90 triggers stage 3 contract');
    assert.strictEqual(w.npcs.nise.flags.casino_debt_frozen, true);
    assert.strictEqual(w.npcs.nise.values.affection, 50, 'Stage 3 locks Nise affection <= 50');
    assert.strictEqual(w.npcs.nise.flags.affection_locked, true);
    w = stepFront(w, 'n_s3_night', DAY(15, 22), '<status_bar><time elapsed="60" end="15日22:00"/></status_bar>');
    assert.strictEqual(w.npcs.nise.location, 'casino', 'Stage 3 Nise permanently stays in casino');
  });

  // 21. Ed patience flow, calm mitigation -3 and grand tiers 2/3 world events
  await test('21. Ed patience flow, calm mitigation -3 and grand tiers 2/3 world events', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'red_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w = stepFront(w, 'ed_arr', DAY(1, 19), '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    assert.strictEqual(w.flags.ed_joined, true);
    assert.strictEqual(w.flags.arrived_oakhaven, true);
    assert.strictEqual(w.npcs.ed.monitored, true);
    assert.strictEqual(w.npcs.ed.values.patience, 100);

    // 1) 正常跨午夜：古兰未阻断，血脉 +1，爱德催熟补偿 +1 抵消自然 -1，耐心保持 100
    w = stepFront(w, 'ed_m1', DAY(2, 8), '<status_bar><time elapsed="60" end="2日08:00"/></status_bar>');
    assert.strictEqual(w.npcs.gulan.values.blood_density, 1);
    assert.strictEqual(w.npcs.ed.values.patience, 100, 'Maturing Gulan compensates midnight decay (patience stays 100)');

    // 2) 同房阻断跨午夜：古兰好感 >= 90 达成同房，血脉不增，爱德无补偿，耐心自然流失 -1 (100 -> 99)
    w.npcs.gulan.values.affection = 90;
    w = stepFront(w, 'ed_room', DAY(2, 23), '<status_bar><room npc="gulan" state="together"/></status_bar>');
    assert.strictEqual(w.flags.playerRoomTarget, 'gulan');
    w = stepFront(w, 'ed_m2', DAY(3, 8), '<status_bar><time elapsed="60" end="3日08:00"/></status_bar>');
    assert.strictEqual(w.npcs.gulan.values.blood_density, 1, 'Room block stopped midnight blood_density');
    assert.strictEqual(w.npcs.ed.values.patience, 99, 'Blocked maturing yields net -1 patience (100 -> 99)');

    // 3) calm 动作减少古兰血脉时，额外扣减爱德耐心 -3 (99 -> 96)
    w.npcs.gulan.stage = 1;
    w.npcs.gulan.values.affection = 75;
    w.npcs.gulan.values.blood_density = 20;
    w = stepFront(w, 'ed_calm', DAY(3, 10), '<status_bar><bond npc="gulan" kind="calm"/></status_bar>');
    assert.strictEqual(w.npcs.gulan.values.blood_density, 18, 'Calm reduces blood_density by 2');
    assert.strictEqual(w.npcs.ed.values.patience, 96, 'Calm mitigation reduces Ed patience by 3 (99 -> 96)');

    // 4) 当 patience <= 75 时触发大势二阶段（grand_tier_2）
    w.npcs.ed.values.patience = 75;
    w = stepFront(w, 'ed_tier2', DAY(3, 11), '<status_bar><time elapsed="60" end="3日11:00"/></status_bar>');
    assert.strictEqual(w.flags.grand_tier_2, true, 'patience <= 75 triggers grand_tier_2');

    // 5) 当 patience <= 25 时触发大势三阶段（grand_tier_3，含 road_blocked 与 curfew_active）
    const beforeCollapse = structuredClone(w);
    w.npcs.ed.values.patience = 25;
    w = stepFront(w, 'ed_tier3', DAY(3, 12), '<status_bar><time elapsed="60" end="3日12:00"/></status_bar>');
    assert.strictEqual(w.flags.grand_tier_3, true, 'patience <= 25 triggers grand_tier_3');
    assert.strictEqual(w.flags.road_blocked, true, 'grand_tier_3 sets road_blocked');
    assert.strictEqual(w.flags.curfew_active, true, 'grand_tier_3 sets curfew_active');
    const originalCollapse = w.bg.queue.find(event => event.definitionId === 'ed_grand_stage_3');
    assert.match(originalCollapse.text, /雷蒙德下令全镇宵禁/);

    const afterPurge = structuredClone(beforeCollapse);
    afterPurge.flags.baron_purged = true;
    afterPurge.npcs.ed.values.patience = 25;
    const postPurgeCollapse = stepFront(afterPurge, 'ed_purged_first', DAY(3, 12), '');
    assert.strictEqual(postPurgeCollapse.flags.road_blocked, true);
    assert.strictEqual(postPurgeCollapse.flags.curfew_active, false);
    assert(!postPurgeCollapse.bg.queue.some(event => event.definitionId === 'ed_grand_stage_3'));
    const newCollapse = postPurgeCollapse.bg.queue.find(event => event.definitionId === 'ed_grand_stage_3_after_purge');
    assert.match(newCollapse.text, /官道/);
    assert.doesNotMatch(newCollapse.text, /雷蒙德|宵禁/);

    const signalReady = structuredClone(beforeCollapse);
    signalReady.flags.eileen_signal_fired = true;
    signalReady.npcs.eileen.flags.eileenSignalDays = 1;
    signalReady.npcs.ed.values.patience = 25;
    const sameTurn = stepFront(signalReady, 'ed_purge_and_collapse', signalReady.timeMin, '');
    assert.strictEqual(sameTurn.flags.baron_purged, true);
    assert.strictEqual(sameTurn.flags.road_blocked, true);
    assert.strictEqual(sameTurn.flags.curfew_active, false);
    const bothIds = ['eileen_lancaster_purge', 'ed_grand_stage_3_after_purge'];
    const both = sameTurn.bg.queue.filter(event => bothIds.includes(event.definitionId));
    assert.deepEqual(Array.from(both, event => event.definitionId), bothIds);
    assert.strictEqual(both[0].at, both[1].at);

    w.flags.eileen_signal_fired = true;
    w.npcs.eileen.flags.eileenSignalDays = 1;
    const purgeAfter = stepFront(w, 'ed_collapse_then_purge', DAY(3, 13), '');
    assert.strictEqual(purgeAfter.flags.baron_purged, true);
    assert.strictEqual(purgeAfter.flags.road_blocked, true);
    assert.strictEqual(purgeAfter.flags.curfew_active, false);
    assert.strictEqual(OKH_APP_CONFIG.migrateWorld(purgeAfter), purgeAfter);
    assert.strictEqual(purgeAfter.bg.queue.find(event => event.id === originalCollapse.id).text, originalCollapse.text);
    const ledger = sb.OKH_APP_ADAPTER.buildLedger(purgeAfter);
    assert.match(ledger, /峡谷官道因塌方中断/);
    assert.doesNotMatch(ledger, /雷蒙德下达的夜间宵禁/);
  });

  // 22. Ed & Gulan final showdown: good standing, dark assimilation & tragic abduction with life-threat bargain
  await test('22. Ed & Gulan final showdown: good standing, dark assimilation & tragic abduction', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'rfin_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    // 1) 正线的血脉可以先封顶，艾德要等耐心耗尽才现身。
    let wGood = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wGood = stepFront(wGood, 'g_arr', DAY(1, 19), '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    wGood.npcs.gulan.values.blood_density = 99;
    wGood.npcs.gulan.values.affection = 90;
    wGood.npcs.gulan.stage = 2;
    wGood.npcs.ed.values.patience = 1;
    const changes = cfg.timeEffects({ world: wGood, fromMin: wGood.timeMin, toMin: DAY(3, 0) });
    assert.deepEqual(Array.from(changes.filter(c => c.target === 'gulan' && c.add), c => c.add.blood_density), [1]);
    assert.deepEqual(Array.from(changes.filter(c => c.target === 'ed' && c.add), c => c.add.patience), [-1]);
    wGood = stepFront(wGood, 'g_wait', DAY(2, 8), '<status_bar><time elapsed="60" end="2日08:00"/></status_bar>');
    assert.strictEqual(wGood.npcs.gulan.values.blood_density, 100);
    assert.strictEqual(wGood.npcs.ed.values.patience, 1);
    assert.strictEqual(wGood.npcs.ed.monitored, true);
    assert(!wGood.flags.ed_revealed);
    assert(!wGood.flags.ed_showdown_done);
    assert(!wGood.bg.queue.some(event => event.definitionId?.startsWith('ed_showdown_')));
    const [rescueKey, pendingRescue] = Object.entries(wGood.bg.eventStates)
      .find(([, event]) => event.definitionId === 'gulan_final_rescue_prompt');
    assert.strictEqual(pendingRescue.status, 'pending');
    wGood = stepFront(wGood, 'g_fin', DAY(3, 8), '<status_bar><time elapsed="60" end="3日08:00"/></status_bar>');
    assert.strictEqual(wGood.npcs.ed.values.patience, 0);
    assert.strictEqual(wGood.flags.ed_showdown_done, true);
    assert.strictEqual(wGood.flags.ed_final_good, true);
    assert.strictEqual(wGood.flags.ed_revealed, true);
    assert.strictEqual(wGood.npcs.ed.monitored, false, 'Ed revealed and removed from monitoring');
    assert.strictEqual(wGood.npcs.gulan.monitored, true, 'Gulan remains monitored with squad');
    assert(!OKH_APP_ADAPTER.buildLedger(wGood).includes('【终局·真血自立】'), 'Pending reveal is absent from the ledger');
    const goodReveal = wGood.bg.queue.find(event => event.definitionId === 'ed_showdown_good');
    const wGoodDelivered = OKHBackground.ack(wGood, [goodReveal.id], 'test-reveal-good');
    assert(OKH_APP_ADAPTER.buildLedger(wGoodDelivered).includes('【终局·真血自立】'));
    assert.strictEqual(wGood.bg.eventStates[rescueKey].outcome, 'expired');
    assert.strictEqual(wGood.bg.queue.find(event => event.id === pendingRescue.instanceId).status, 'superseded');
    assert.strictEqual(wGood.npcs.gulan.stage, 2);

    // 旧存档可能留着已经过期的守夜选项，直接提交也须通过当前终局状态校验。
    const legacyGood = structuredClone(wGood);
    legacyGood.bg.eventStates[rescueKey] = structuredClone(pendingRescue);
    legacyGood.bg.queue.find(event => event.id === pendingRescue.instanceId).status = 'pending';
    assert.throws(() => stepFront(legacyGood, 'g_stale', legacyGood.timeMin,
      '<status_bar><event_resolve npc="gulan" id="gulan_final_rescue_prompt" outcome="fail"/></status_bar>'
    ), /当前条件不满足处理该事件/);
    const resumedGood = stepFront(legacyGood, 'g_resume', legacyGood.timeMin, '');
    assert.strictEqual(resumedGood.bg.eventStates[rescueKey].outcome, 'expired');
    assert.strictEqual(resumedGood.npcs.gulan.stage, 2);

    // 2) 坏结局（ed_showdown_dark）：血脉 100 且已沉沦 (stage === 3)
    let wDark = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wDark = stepFront(wDark, 'd_arr', DAY(1, 19), '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    wDark.npcs.gulan.values.blood_density = 100;
    wDark.npcs.gulan.stage = 3;
    wDark = stepFront(wDark, 'd_fin', DAY(2, 9), '<status_bar><time elapsed="60" end="2日09:00"/></status_bar>');
    assert.strictEqual(wDark.flags.ed_showdown_done, true);
    assert.strictEqual(wDark.flags.ed_final_dark, true);
    assert.strictEqual(wDark.npcs.ed.monitored, false);
    assert.strictEqual(wDark.npcs.gulan.monitored, false);
    assert.strictEqual(wDark.npcs.gulan.location, 'wilds');
    assert(!OKH_APP_ADAPTER.buildLedger(wDark).includes('【终局·始祖同化】'));

    // 3) 悲壮分支 A（ed_showdown_abduction）：耐心归零提前发难，古兰以死要挟换取小队生路
    let wAbd = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wAbd = stepFront(wAbd, 'a_arr', DAY(1, 19), '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    wAbd.npcs.ed.values.patience = 0;
    wAbd.npcs.gulan.values.blood_density = 60;
    wAbd.npcs.gulan.values.affection = 75;
    wAbd.npcs.gulan.stage = 1;
    wAbd = stepFront(wAbd, 'a_fin', DAY(2, 9), '<status_bar><time elapsed="60" end="2日09:00"/></status_bar>');
    assert.strictEqual(wAbd.flags.ed_showdown_done, true);
    assert.strictEqual(wAbd.flags.ed_final_abduction, true);
    assert.strictEqual(wAbd.npcs.ed.monitored, false);
    assert.strictEqual(wAbd.npcs.gulan.monitored, false);
    assert.strictEqual(wAbd.npcs.gulan.location, 'wilds');
    assert(!OKH_APP_ADAPTER.buildLedger(wAbd).includes('【终局·以命相挟】'));

    // 4) 白天封顶时仍未沉沦，走成熟悲壮分支。
    let wBlindB = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wBlindB = stepFront(wBlindB, 'b_arr', DAY(1, 19), '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    wBlindB = stepFront(wBlindB, 'b_day', DAY(2, 15), '');
    wBlindB.npcs.ed.values.patience = 50;
    wBlindB.npcs.gulan.values.blood_density = 100;
    wBlindB.npcs.gulan.values.affection = 80;
    wBlindB.npcs.gulan.stage = 2;
    wBlindB = stepFront(wBlindB, 'b_fin', DAY(2, 15), '');
    assert.strictEqual(wBlindB.flags.ed_showdown_done, true);
    assert.strictEqual(wBlindB.flags.ed_final_abduction, true);
    assert.strictEqual(wBlindB.npcs.gulan.stage, 2);

    // 同一个夜间结算点发生沉沦与封顶时，先进入阶段 3，再判定成熟暗线。
    let wSameNight = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wSameNight = stepFront(wSameNight, 'same_arr', DAY(1, 19),
      '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    Object.assign(wSameNight.npcs.gulan.values, { blood_density: 100, affection: 80 });
    wSameNight.npcs.gulan.stage = 2;
    wSameNight = stepFront(wSameNight, 'same_fin', DAY(1, 19), '');
    assert.strictEqual(wSameNight.npcs.gulan.stage, 3);
    assert.strictEqual(wSameNight.flags.ed_final_dark, true);
    assert(!wSameNight.flags.ed_final_abduction);
    const sameNightQueue = wSameNight.bg.queue.filter(event =>
      ['gulan_final_fall_dark', 'gulan_stage_3', 'ed_showdown_dark'].includes(event.definitionId));
    assert.deepEqual(Array.from(sameNightQueue, event => event.definitionId), ['ed_showdown_dark']);
    assert(sameNightQueue.every(event => event.at === DAY(1, 19)));
    assert.strictEqual(wSameNight.playerState.pendingEchoes.some(e => e.id === 'echo_gulan_final_fall'), true);

    // 5) 提前发难已沉沦兜底（ed_showdown_dark_early）
    let wDarkEarly = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wDarkEarly = stepFront(wDarkEarly, 'de_arr', DAY(1, 19), '<status_bar><move to="inn"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/></status_bar>');
    wDarkEarly.npcs.ed.values.patience = 0;
    wDarkEarly.npcs.gulan.values.blood_density = 50;
    wDarkEarly.npcs.gulan.stage = 3;
    wDarkEarly = stepFront(wDarkEarly, 'de_fin', DAY(2, 9), '<status_bar><time elapsed="60" end="2日09:00"/></status_bar>');
    assert.strictEqual(wDarkEarly.flags.ed_showdown_done, true);
    assert.strictEqual(wDarkEarly.flags.ed_final_dark, true);

    // 6) 幽灵调度消除验证：古兰被抓走后，推进到下午练武场与夜间旅店，均不响应移动
    wAbd = stepFront(wAbd, 'a_noon', DAY(2, 14), '<status_bar><time elapsed="300" end="2日14:00"/></status_bar>');
    assert.strictEqual(wAbd.npcs.gulan.location, 'wilds', 'Abducted Gulan does not execute gulan_train in afternoon');
    wAbd = stepFront(wAbd, 'a_night', DAY(2, 21), '<status_bar><time elapsed="420" end="2日21:00"/></status_bar>');
    assert.strictEqual(wAbd.npcs.gulan.location, 'wilds', 'Abducted Gulan does not execute return_inn at night');
  });

  // 23. Ed wagon rescue, camp awakening, arrival custody (+10g), chores, funeral return & uncle betrayal permanent join
  await test('23. Ed wagon rescue, camp awakening, arrival custody (+10g), chores, funeral return & uncle betrayal permanent join', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'red_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w.flags.ed_joined, false);
    assert.strictEqual(w.npcs.ed.monitored, false);

    // 1) 第 3 天 08:00 遭遇马车，触发 ed_wagon_rescue，随后救下爱德
    w = stepFront(w, 'ed_t1', DAY(3, 8), '<status_bar><time elapsed="60" end="3日08:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_wagon_found, true);

    w = stepFront(w, 'ed_t1_rescue', DAY(3, 8) + 15, '<status_bar><time elapsed="15"/><prologue_step flag="ed_joined"/></status_bar>');
    assert.strictEqual(w.flags.ed_joined, true);
    assert.strictEqual(w.npcs.ed.monitored, true);
    assert.strictEqual(w.npcs.ed.location, 'wilds');

    // 2) 第 3 天 20:00 营地篝火转醒
    w = stepFront(w, 'ed_t2', DAY(3, 20), '<status_bar><time elapsed="720" end="3日20:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_awake, true);
    assert.strictEqual(w.npcs.ed.flags.ed_awake, true);

    // 3) 第 4 天若玩家未申报抵达，绝不强行自动传送抵镇（P1-5 守则）
    w = stepFront(w, 'ed_t3_wait', DAY(4, 16, 34), '<status_bar><time elapsed="1234" end="4日16:34"/></status_bar>');
    assert.strictEqual(w.flags.arrived_oakhaven, false, 'Must NOT auto-teleport arrival by day count');
    assert.strictEqual(w.playerLocation, 'wilds');

    // 玩家实际于第 6 天申报抵镇并入住旅店 -> 自动触发珠宝铺交接 (+10g) 与 3 天托付，所有后续节点按 arrivedDay=6 顺延
    const goldBefore = w.playerState.gold;
    w = stepFront(w, 'ed_t3', DAY(6, 15, 0), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/><time elapsed="1346"/></status_bar>');
    assert.strictEqual(w.flags.arrived_oakhaven, true);
    assert.strictEqual(w.flags.arrivedDay, 6);
    assert.strictEqual(w.flags.ed_custody_active, true);
    assert.strictEqual(w.flags.ed_custody_day, 6);
    assert.strictEqual(w.playerState.gold, goldBefore + 10);
    assert.strictEqual(w.playerLocation, 'inn');
    assert.strictEqual(w.npcs.ed.location, 'inn');

    // 4) 第 7 天白天执行旅店打杂 ed_inn_chores
    w = stepFront(w, 'ed_t4', DAY(7, 10), '<status_bar><time elapsed="60" end="7日10:00"/></status_bar>');
    assert.strictEqual(w.npcs.ed.location, 'inn');
    assert.strictEqual(w.npcs.ed.activity?.label, '在旅店跑腿打杂与擦拭桌椅');

    // 5) 第 10 天 (6+4) 08:00 即使玩家正与爱德互动且处于普通活动期，forceMove 也能安全参加丧礼返家不抛错（P0-2 修复）
    w = stepFront(w, 'ed_t5', DAY(10, 8), '<status_bar><interact npc="ed"/><time elapsed="60" end="10日08:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_funeral_done, true);
    assert.strictEqual(w.flags.ed_custody_active, false);
    assert.strictEqual(w.flags.ed_funeral_day, 10);
    assert.strictEqual(w.npcs.ed.flags.ed_home_visiting, true);
    assert.strictEqual(w.npcs.ed.location, 'town');

    // 第 10 天夜间 return_inn 受到防护拦截，爱德不被拉回旅店
    w = stepFront(w, 'ed_t5_night', DAY(10, 22), '<status_bar><time elapsed="60" end="10日22:00"/></status_bar>');
    assert.strictEqual(w.npcs.ed.location, 'town', 'Ed stays in town at night while home_visiting');

    // 6) 第 11 天 (10+1) 08:00 早餐时分归来哭诉舅舅侵吞家业，正式入队
    w = stepFront(w, 'ed_t6', DAY(11, 8), '<status_bar><interact npc="ed"/><time elapsed="60" end="11日08:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_permanently_joined, true);
    assert.strictEqual(w.flags.ed_joined_perm_day, 11);
    assert.strictEqual(w.flags.alice_hostage, true);
    assert.strictEqual(w.npcs.ed.flags.ed_home_visiting, false);
    assert.strictEqual(w.npcs.ed.flags.ed_expelled_by_uncle, true);
    assert.strictEqual(w.npcs.ed.location, 'inn');
  });

  // 24. Ed rescue Alice four-stage chain: guide town -> watch store -> investigate truth (interaction) -> rescue resolve (+150g & adventurer role)
  await test('24. Ed rescue sister Alice 4-stage chain: guide, watch, investigate truth & showdown rescue resolve', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'ralice_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    // 基础前置：已抵奥克赫斯，爱德已正式入队
    w.flags.arrived_oakhaven = true;
    w.flags.arrivedDay = 4;
    w.flags.ed_joined = true;
    w.flags.ed_permanently_joined = true;
    w.flags.alice_hostage = true;
    w.npcs.ed.location = 'inn';
    w.playerLocation = 'inn';

    // 1) 阶段 1：向导熟悉门道 (ed_guide_town)
    // 在旅店或未到 Day 11 不触发
    w = stepFront(w, 'al_1_wait', DAY(10, 10), '<status_bar><time elapsed="60" end="10日10:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_guide_town_done, undefined);

    // Day 11 上午前往 town 触发向导
    w = stepFront(w, 'al_1_trig', DAY(11, 9), '<status_bar><move to="town"/><time elapsed="60" end="11日09:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_guide_town_done, true, 'Day 11 morning in town triggers ed_guide_town');
    assert.strictEqual(w.npcs.ed.flags.ed_town_guided, true);

    // 2) 阶段 2：隔街遥望疑窦丛生 (ed_watch_store)
    // Day 14 上午不触发（限制 afternoon）
    w = stepFront(w, 'al_2_morn', DAY(14, 10), '<status_bar><time elapsed="60" end="14日10:00"/></status_bar>');
    assert.strictEqual(w.flags.ed_watch_store_done, undefined);

    // Day 14 下午 13:30 触发遥望珠宝铺
    w = stepFront(w, 'al_2_trig', DAY(14, 13, 30), '<status_bar><time elapsed="210" end="14日13:30"/></status_bar>');
    assert.strictEqual(w.flags.ed_watch_store_done, true, 'Day 14 afternoon in town triggers ed_watch_store');

    // 3) 阶段 3：稚子请托·探知真相 (ed_investigate_truth，待互动)
    // Day 16 10:00 在 town 触发待互动事件，生成 pending 记录
    w = stepFront(w, 'al_3_trig', DAY(16, 10), '<status_bar><time elapsed="60" end="16日10:00"/></status_bar>');
    const pendingKey = JSON.stringify(['event', 'ed_investigate_truth', null]);
    assert(w.bg.eventStates[pendingKey], 'ed_investigate_truth should be queued');
    assert.strictEqual(w.bg.eventStates[pendingKey].status, 'pending');
    assert.strictEqual(w.flags.alice_truth_revealed, undefined);

    // 选项分支 A：直接提及爱德下落 (probe_direct_mention)
    w = stepFront(w, 'al_3_res', DAY(16, 10, 30), '<status_bar><time elapsed="30"/><event_resolve id="ed_investigate_truth" outcome="probe_direct_mention"/></status_bar>');
    assert.strictEqual(w.flags.alice_truth_revealed, true, 'Resolving outcome sets alice_truth_revealed');
    assert.strictEqual(w.flags.alice_evidence_secured, true, 'Resolving outcome sets alice_evidence_secured');
    assert.strictEqual(w.bg.eventStates[pendingKey].status, 'resolved');

    // 4) 阶段 4：堂前对质·雏鹰立志 (alice_rescue_resolve)
    // Day 17 尚未到达门槛时间 Day(18, 10)
    w = stepFront(w, 'al_4_wait', DAY(17, 10), '<status_bar><time elapsed="60" end="17日10:00"/></status_bar>');
    assert.strictEqual(w.flags.alice_rescued, undefined);

    // Day 18 10:30 上午在 town 触发最终对质收官
    const goldBefore = w.playerState.gold;
    w = stepFront(w, 'al_4_trig', DAY(18, 10, 30), '<status_bar><time elapsed="60" end="18日10:30"/></status_bar>');
    assert.strictEqual(w.flags.alice_rescued, true, 'Triggers alice_rescued');
    assert.strictEqual(w.flags.sid_expelled, true, 'Triggers sid_expelled');
    assert.strictEqual(w.flags.ed_aspiration_adventurer, true, 'Triggers ed_aspiration_adventurer');
    assert.strictEqual(w.playerState.gold, goldBefore + 40, '40 gold reward awarded to playerState');
    assert.strictEqual(w.npcs.ed.flags.ed_adventurer_role, true, 'Ed acquires ed_adventurer_role');
    assert.strictEqual(w.npcs.ed.location, 'inn', 'Ed location aligned to inn');
  });

  await test('25. Ed daily bonds (ask_intel/teach_skills/ask_sister), 4-slot intercept/perk loops & inn_free_pass_today', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_PARSE, OKH_APP_ADAPTER, OKH_APP_HUD } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;

    function stepFront(world, id, toMin, text) {
      const front = OKH_APP_PARSE.buildFront(text, toMin, world, {
        config: cfg,
        locations: OKH_APP_CONFIG.LOCATIONS,
        canMove: OKH_APP_CONFIG.canMove
      });
      assert.strictEqual(front.diagnostics.length, 0, `${id} diagnostics: ${front.diagnostics.join('; ')}`);
      return OKHBackground.advance(world, {
        id, revision: 'r1', toMin, interactingIds: front.interactingIds, front
      }, cfg).state;
    }

    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.timeMin = DAY(12, 7, 0);
    w.flags.arrived_oakhaven = true;
    w.flags.arrivedDay = 4;
    w.flags.lastInnSettledDay = 11;
    w.flags.ed_joined = true;
    w.flags.ed_permanently_joined = true;
    w.flags.ed_guide_town_done = true;
    w.playerLocation = 'inn';
    w.playerState.gold = 100;
    w.npcs.ed.monitored = true;
    w.npcs.ed.location = 'inn';
    w.npcs.gulan.location = 'inn';
    const gulanAffBefore = w.npcs.gulan.values.affection;

    // 1) 清晨旅店触发槽位二变体 1 (ed_daily_perk_1) + 爱德 3 项日常 bond
    w = stepFront(w, 'ed_d_1', DAY(12, 7, 30),
      '<status_bar><time elapsed="30"/><bond npc="ed" kind="ask_intel"/><bond npc="ed" kind="teach_skills"/><bond npc="ed" kind="ask_sister"/></status_bar>');
    assert.strictEqual(w.npcs.ed.flags.ed_intel_day, 12);
    assert.strictEqual(w.npcs.ed.flags.ed_teach_count, 1);
    assert.strictEqual(w.npcs.ed.flags.ed_asked_sister_day, 12);
    assert.strictEqual(w.npcs.gulan.values.affection, gulanAffBefore, 'Ed daily bonds must never mutate female affection');
    const ledger12 = OKH_APP_ADAPTER.buildLedger(w);
    assert(ledger12.includes('爱德今日市井情报：'), 'ledger injects daily intel');
    assert(ledger12.includes('爱丽丝线索摘要：'), 'ledger injects sister clues');

    // 同日重复 teach_skills 应被每日限 1 次拦截
    w = stepFront(w, 'ed_d_dup', DAY(12, 8, 0),
      '<status_bar><time elapsed="30"/><bond npc="ed" kind="teach_skills"/></status_bar>');
    assert.strictEqual(w.npcs.ed.flags.ed_teach_count, 1, 'teach_skills capped at once per day');

    // 验证 ed_daily_perk_1 已待决并选择 accept_perk 免除今晚 5 金宿费
    const perk1Key = JSON.stringify(['event', 'ed_daily_perk_1', null]);
    assert.strictEqual(w.bg.eventStates[perk1Key]?.status, 'pending', 'Morning in inn triggers ed_daily_perk_1');
    w = stepFront(w, 'ed_d_perk1', DAY(12, 8, 30),
      '<status_bar><time elapsed="30"/><event_resolve id="ed_daily_perk_1" outcome="accept_perk"/></status_bar>');
    assert.strictEqual(w.flags.inn_free_pass_today, true, 'accept_perk grants inn_free_pass_today');
    assert.strictEqual(w.flags.lastEdPerkDay, 12);
    assert.strictEqual(w.flags.edPerkSlot, 1);
    assert(OKH_APP_HUD.buildHudHtml(w).includes('今晚已免'), 'HUD displays free lodging pass');

    // 2) 当天午后前往 town 触发槽位一变体 1 (ed_intercept_job_1, +40g)，选 negotiate_teach (+45g & teach_count -> 2)
    w = stepFront(w, 'ed_d_job1_trig', DAY(12, 13, 0),
      '<status_bar><move to="town"/><time elapsed="270"/></status_bar>');
    const job1Key = JSON.stringify(['event', 'ed_intercept_job_1', null]);
    assert.strictEqual(w.bg.eventStates[job1Key]?.status, 'pending', 'Afternoon in town triggers ed_intercept_job_1');
    const goldBeforeJob = w.playerState.gold;
    w = stepFront(w, 'ed_d_job1_res', DAY(12, 16, 0),
      '<status_bar><time elapsed="180"/><event_resolve id="ed_intercept_job_1" outcome="negotiate_teach"/></status_bar>');
    assert.strictEqual(w.playerState.gold, goldBeforeJob + 12, 'negotiate_teach awards variant gold + 2');
    assert.strictEqual(w.npcs.ed.flags.ed_teach_count, 2, 'negotiate_teach increments ed_teach_count to 2');
    assert.strictEqual(w.flags.edInterceptSlot, 1);

    // 3) 跨第 12→13 午夜：应免扣宿费且核销 inn_free_pass_today；跨第 13→14 午夜：恢复正常扣 5 金
    const goldBeforeNight12 = w.playerState.gold;
    w = stepFront(w, 'ed_d_night12', DAY(13, 8, 0),
      '<status_bar><move to="inn" at="start"/><time elapsed="960"/></status_bar>');
    assert.strictEqual(w.playerState.gold, goldBeforeNight12, 'inn_free_pass_today waives 5g lodging on night 12');
    assert.strictEqual(w.flags.inn_free_pass_today, false, 'inn_free_pass_today consumed after 1 night');

    // 3 天冷却内（Day 13）不应重复触发槽位一或槽位二
    const perk2Key = JSON.stringify(['event', 'ed_daily_perk_2', null]);
    assert.strictEqual(w.bg.eventStates[perk2Key], undefined, '3-day cooldown blocks ed_daily_perk_2 on Day 13');

    // Day 14 上午验证第 13→14 午夜正常扣了 5 金
    w = stepFront(w, 'ed_d_night13', DAY(14, 8, 0),
      '<status_bar><time elapsed="1440"/></status_bar>');
    assert.strictEqual(w.playerState.gold, goldBeforeNight12 - 5, 'Next night resumes normal -5g lodging');

    // 4) Day 15（满 3 日冷却）携爱德赴 town 触发槽位一变体 2 (ed_intercept_job_2, +9g)，并用 teach_skills 达第 3 次解锁 ed_stealth_ready
    w = stepFront(w, 'ed_d_day15', DAY(15, 11, 0),
      '<status_bar><move to="town"/><move npc="ed" to="town"/><time elapsed="1620"/><bond npc="ed" kind="teach_skills"/></status_bar>');
    assert.strictEqual(w.npcs.ed.flags.ed_teach_count, 3);
    assert.strictEqual(w.npcs.ed.flags.ed_stealth_ready, true, '3rd teach unlocks ed_stealth_ready on npc');
    assert.strictEqual(w.flags.ed_stealth_ready, true, '3rd teach unlocks ed_stealth_ready on world');
    assert(OKH_APP_HUD.buildHudHtml(w).includes('已掌握潜行放哨'), 'HUD reflects unlocked stealth milestone');

    w = stepFront(w, 'ed_d_job2_trig', DAY(15, 13), '<status_bar><time elapsed="120"/></status_bar>');
    const job2Key = JSON.stringify(['event', 'ed_intercept_job_2', null]);
    assert.strictEqual(w.bg.eventStates[job2Key]?.status, 'pending', 'Day 15 rotates to variant 2 ed_intercept_job_2');
    const goldBeforeJob2 = w.playerState.gold;
    w = stepFront(w, 'ed_d_job2_res', DAY(15, 15, 0),
      '<status_bar><time elapsed="120"/><event_resolve id="ed_intercept_job_2" outcome="accept_direct"/></status_bar>');
    assert.strictEqual(w.playerState.gold, goldBeforeJob2 + 9, 'Variant 2 accept_direct awards +9g');
    assert.strictEqual(w.flags.edInterceptSlot, 2, 'Slot advances to 2 for next rotation');
  });

  // 26. Inventory & Supply system: starting 10 supply, non-inn headcount consumption, shortage flag, 1g buy_supply, quest item lifecycle, Ed perks, MUV custom item compatibility & v2->v3 backfill
  await test('26. Inventory & Supply: headcount night consumption, buy_supply, quest lifecycle, Ed supply perks, MUV custom safety & v2->v3 migration', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER, OKH_APP_HUD, OKH_APP_MIGRATE } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;
    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'inv_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };
    const countOf = (state, itemId) => (state.playerState?.inventory || []).find(it => it.id === itemId && !it.custom)?.count || 0;

    // 1) Start with 10 supply in wilds (5 people: player + gulan/isna/nise/aurora)
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert.strictEqual(w.schemaVersion, 3);
    assert.strictEqual(countOf(w, 'supply'), 10, 'Initial world starts with 10 supply');
    assert.strictEqual(w.flags.supply_shortage, false);

    // Night 1 in wilds (5 people) -> consumes 5 supply (10->5), gold stays 30
    w = stepFront(w, 'n1_wilds', DAY(2, 8, 0), '<status_bar><time elapsed="840"/></status_bar>');
    assert.strictEqual(countOf(w, 'supply'), 5, 'Wilds night 1 consumes 5 supply for 5 present people');
    assert.strictEqual(w.playerState.gold, 30, 'Wilds night does not deduct inn lodging');
    assert.strictEqual(w.flags.supply_shortage, false);

    // Add an external MUV custom item before supply runs out -> must survive core validation & supply drain untouched
    w.playerState.inventory.push({ id: 'custom:lucky_coin', name: '幸运铜币', category: 'supply', count: 2, desc: '集市捡到的旧币', custom: true });

    // Rescue Ed in wilds (now 6 present people) & cross Night 2 (5 < 6) -> drains supply to 0 & sets supply_shortage=true
    w = stepFront(w, 'n2_short', DAY(3, 8, 0), '<status_bar><prologue_step flag="ed_joined" at="2日12:00"/><time elapsed="1440"/></status_bar>');
    assert.strictEqual(countOf(w, 'supply'), 0, 'Insufficient supply drains cleanly to 0');
    assert.strictEqual(w.flags.supply_shortage, true, 'Shortage sets supply_shortage=true');
    assert(w.playerState.inventory.some(it => it.id === 'custom:lucky_coin' && it.count === 2 && it.custom === true), 'MUV custom item preserved across supply drain');
    assert(OKH_APP_HUD.buildHudHtml(w).includes('补给告罄') && OKH_APP_HUD.buildHudHtml(w).includes('幸运铜币'), 'HUD renders shortage warning & MUV custom item');
    assert(OKH_APP_ADAPTER.buildLedger(w).includes('补给不足') && OKH_APP_ADAPTER.buildLedger(w).includes('幸运铜币'), 'Ledger shows shortage & MUV custom item');

    // 2) Arrive at inn & stay overnight -> lodging -5g, clears supply_shortage, does NOT consume supply
    w = stepFront(w, 'arrive_inn', DAY(3, 12, 0), '<status_bar><prologue_step flag="arrived_oakhaven"/><move to="inn"/><time elapsed="240"/></status_bar>');
    // Buy 6 supply at 1g each in inn -> gold 30->24, supply 0->6, clears shortage immediately
    assert.throws(() => sb.OKH_APP_PARSE.buildFront('<status_bar><economy op="buy_supply" count="0"/></status_bar>', DAY(3, 13), w, { config: cfg }));
    assert.throws(() => sb.OKH_APP_PARSE.buildFront('<status_bar><economy op="buy_supply" count="5" gold="1"/></status_bar>', DAY(3, 13), w, { config: cfg }));
    w = stepFront(w, 'buy_6', DAY(3, 13, 0), '<status_bar><economy op="buy_supply" count="6"/><time elapsed="60"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 24, 'buy_supply count=6 costs 6 gold');
    assert.strictEqual(countOf(w, 'supply'), 6);
    assert.strictEqual(w.flags.supply_shortage, false, 'Buying supply clears shortage flag');

    // Insufficient gold buy_supply is atomic no-op
    w = stepFront(w, 'buy_too_many', DAY(3, 14, 0), '<status_bar><economy op="buy_supply" count="50"/><time elapsed="60"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 24);
    assert.strictEqual(countOf(w, 'supply'), 6);

    // Night at inn -> -5g lodging, supply stays 6
    w = stepFront(w, 'inn_night', DAY(4, 8, 0), '<status_bar><time elapsed="1080"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 19, 'Inn night charges 5g');
    assert.strictEqual(countOf(w, 'supply'), 6, 'Inn night does not consume supply');

    // 3) Barony manor overnight waives BOTH lodging and supply
    w.flags.player_barony_granted = true;
    w = stepFront(w, 'manor_move', DAY(4, 18, 0), '<status_bar><move to="manor"/><time elapsed="600"/></status_bar>');
    w = stepFront(w, 'manor_night', DAY(5, 8, 0), '<status_bar><time elapsed="840"/></status_bar>');
    assert.strictEqual(w.playerState.gold, 19, 'Barony manor night waives lodging');
    assert.strictEqual(countOf(w, 'supply'), 6, 'Barony manor night waives supply');

    // 4) Quest item lifecycle: Alice ledger + Manor intel + Ed perk 3 (+5 supply) & intercept 4 (+1 supply)
    w.flags.player_barony_granted = false;
    w.flags.ed_permanently_joined = true;
    w.flags.ed_watch_store_done = true;
    // 避开 Day 16 期间爱德循环急件挂起占位，专注测爱丽丝证物闭环
    w.flags.lastEdInterceptDay = 16;
    w.flags.lastEdPerkDay = 16;
    w.timeMin = DAY(16, 10, 0);
    w.flags.lastInnSettledDay = 15;
    w.playerLocation = 'town';
    w = stepFront(w, 'alice_trig', DAY(16, 10, 10), '<status_bar><time elapsed="10"/></status_bar>');
    w = stepFront(w, 'alice_res', DAY(16, 10, 20), '<status_bar><time elapsed="10"/><event_resolve id="ed_investigate_truth" outcome="probe_direct_mention"/></status_bar>');
    assert.strictEqual(countOf(w, 'alice_ledger'), 1, 'ed_investigate_truth grants alice_ledger');
    assert(OKH_APP_HUD.buildHudHtml(w).includes('银月珠宝铺真账与私账证物'), 'HUD displays quest item alice_ledger');

    w.timeMin = DAY(18, 10, 0);
    w.flags.lastInnSettledDay = 17;
    w = stepFront(w, 'alice_end', DAY(18, 10, 10), '<status_bar><time elapsed="10"/></status_bar>');
    assert.strictEqual(countOf(w, 'alice_ledger'), 0, 'alice_rescue_resolve removes alice_ledger');

    // Ed perk 3 grants +5 supply; intercept 4 grants +8g & +1 supply (Day 19 >= 16+3 cooldown cleared)
    w.flags.edPerkSlot = 2;
    w.flags.edInterceptSlot = 3;
    w.playerLocation = 'inn';
    w.npcs.ed.location = 'inn';
    w.timeMin = DAY(19, 8, 0);
    w.flags.lastInnSettledDay = 18;
    const supBeforePerk3 = countOf(w, 'supply');
    w = stepFront(w, 'perk3_trig', DAY(19, 8, 10), '<status_bar><time elapsed="10"/></status_bar>');
    w = stepFront(w, 'perk3_res', DAY(19, 8, 20), '<status_bar><time elapsed="10"/><event_resolve id="ed_daily_perk_3" outcome="accept_perk"/></status_bar>');
    assert.strictEqual(countOf(w, 'supply'), supBeforePerk3 + 5, 'ed_daily_perk_3 awards +5 supply');

    w.playerLocation = 'town';
    w.timeMin = DAY(19, 11, 0);
    const goldBeforeInt4 = w.playerState.gold;
    const supBeforeInt4 = countOf(w, 'supply');
    w = stepFront(w, 'int4_trig', DAY(19, 11, 10), '<status_bar><time elapsed="10"/></status_bar>');
    w = stepFront(w, 'int4_res', DAY(19, 12, 10), '<status_bar><time elapsed="60"/><event_resolve id="ed_intercept_job_4" outcome="accept_direct"/></status_bar>');
    assert.strictEqual(w.playerState.gold, goldBeforeInt4 + 8, 'ed_intercept_job_4 awards +8g');
    assert.strictEqual(countOf(w, 'supply'), supBeforeInt4 + 1, 'ed_intercept_job_4 also awards +1 supply');

    // Aurora manor intel note grant & Eileen reclaim_tube removal
    w.flags.eileen_fugitive = true;
    w.flags.baron_purged = false;
    w.npcs.eileen.monitored = true;
    w.npcs.eileen.location = 'town';
    w.npcs.aurora.flags.manor_service_active = true;
    w.npcs.aurora.flags.aurora_left_manor = false;
    w.npcs.aurora.values.affection = 85;
    w.npcs.aurora.location = 'town';
    w = stepFront(w, 'manor_intel_trig', DAY(19, 12, 20), '<status_bar><time elapsed="10"/></status_bar>');
    w = stepFront(w, 'manor_intel_res', DAY(19, 12, 30), '<status_bar><time elapsed="10"/><event_resolve id="aurora_pass_manor_intel" npc="aurora" outcome="receive_intel"/></status_bar>');
    assert.strictEqual(countOf(w, 'manor_intel_note'), 1, 'aurora_pass_manor_intel grants manor_intel_note');
    w.npcs.eileen.values.counterattack = 100;
    w.playerLocation = 'manor';
    w = stepFront(w, 'tube_trig', DAY(19, 13, 0), '<status_bar><time elapsed="50"/></status_bar>');
    w = stepFront(w, 'tube_res', DAY(19, 13, 10), '<status_bar><time elapsed="10"/><event_resolve id="eileen_reclaim_tube" npc="eileen" outcome="strike"/></status_bar>');
    assert.strictEqual(countOf(w, 'manor_intel_note'), 0, 'eileen_reclaim_tube removes manor_intel_note');

    // 5) v2 -> v3 migration backfills ongoing quest items & preserves MUV custom entries idempotently
    const v2Save = {
      schemaVersion: 2,
      timeMin: DAY(20, 10),
      playerLocation: 'town',
      playerState: { gold: 80 },
      interactingIds: [],
      flags: {
        arrived_oakhaven: true,
        alice_evidence_secured: true,
        alice_rescued: false,
        eileen_signal_fired: false,
        baron_purged: false,
        player_barony_granted: false
      },
      npcs: {
        aurora: { id: 'aurora', location: 'inn', values: { debt_pressure: 50, affection: 85 }, flags: { aurora_eileen_intel_given: true } }
      }
    };
    const m1 = OKH_APP_MIGRATE.migrateWorld(v2Save);
    assert.strictEqual(m1.schemaVersion, 3);
    assert.strictEqual(countOf(m1, 'alice_ledger'), 1, 'v2->v3 backfills alice_ledger');
    assert.strictEqual(countOf(m1, 'manor_intel_note'), 1, 'v2->v3 backfills manor_intel_note');
    assert.strictEqual(countOf(m1, 'supply'), 0, 'Arrived v2 save does not fabricate free supply');
    const m2 = OKH_APP_MIGRATE.migrateWorld(m1);
    assert.deepStrictEqual(m2, m1, 'v2->v3 migration is idempotent');
  });

  // 27. Audit fixes: Gulan stage 1->2 unlock (gulan_ed_hypnosis_play), Isna pendant/orc camp/3-day fall/rescue/trap branches, HUD multi-pending & spoiler guards
  await test('27. Audit fixes: Gulan stage-2 unlock, Isna pendant & wilds_camp full arc, HUD multi-pending & spoiler guards', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER, OKH_APP_HUD } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;
    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'aud_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };
    const hasItem = (state, itemId) => (state.playerState?.inventory || []).some(it => it.id === itemId && !it.custom);

    // 1) HUD spoiler & button guards in prologue before Ed wakes
    let wHud = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    assert(!OKH_APP_HUD.buildHudHtml(wHud).includes('陪赴圣辉大教堂祈祷'), 'Prologue Aurora HUD hides locked town church button');
    wHud = stepFront(wHud, 'ed_join_pre', DAY(2, 10), '<status_bar><prologue_step flag="ed_joined"/><time elapsed="960"/></status_bar>');
    const hudBeforeWake = OKH_APP_HUD.buildHudHtml(wHud);
    assert(!hudBeforeWake.includes('银月珠宝铺遗孤'), 'Unawakened Ed bio must not leak store spoiler');
    assert(!hudBeforeWake.includes('询问姐姐近况'), 'Ed sister button hidden before permanent join');

    // 2) Gulan stage 1 -> 2 unlock via gulan_ed_hypnosis_play (blocked when room together, unlocks when separate)
    let wG = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wG.flags.arrived_oakhaven = true;
    wG.flags.ed_joined = true;
    wG.npcs.ed.monitored = true;
    wG.playerLocation = 'inn';
    wG.npcs.gulan.location = 'inn';
    wG.npcs.ed.location = 'inn';
    wG.npcs.gulan.stage = 1;
    wG.npcs.gulan.values.affection = 92;
    wG.npcs.gulan.values.blood_density = 66;
    wG.flags.playerRoomTarget = 'gulan';
    wG.timeMin = DAY(10, 22, 0);
    wG.flags.lastInnSettledDay = 9;
    wG = stepFront(wG, 'g_blocked', DAY(10, 22, 30), '<status_bar><time elapsed="30"/></status_bar>');
    assert.strictEqual(wG.npcs.gulan.stage, 1, 'Room together blocks gulan_ed_hypnosis_play');
    wG = stepFront(wG, 'g_unlock', DAY(10, 23, 0), '<status_bar><room state="separate"/><time elapsed="30"/></status_bar>');
    assert.strictEqual(wG.npcs.gulan.flags.ed_hypnosis_play_done, true, 'gulan_ed_hypnosis_play fires when separate at night');
    assert.strictEqual(wG.npcs.gulan.stage, 2, 'Gulan advances cleanly to stage 2 (mud)');

    // 2b) High affection (>=90) co-room grants a 2-day (2880 min) grace buffer after dawn separation
    let wGrace = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wGrace.flags.arrived_oakhaven = true;
    wGrace.flags.ed_joined = true;
    wGrace.npcs.ed.monitored = true;
    wGrace.playerLocation = 'inn';
    wGrace.npcs.gulan.location = 'inn';
    wGrace.npcs.ed.location = 'inn';
    wGrace.npcs.gulan.stage = 1;
    wGrace.npcs.gulan.values.affection = 92;
    wGrace.npcs.gulan.values.blood_density = 66;
    wGrace.timeMin = DAY(10, 22, 0);
    wGrace.flags.lastInnSettledDay = 9;
    wGrace = stepFront(wGrace, 'grace_in', DAY(10, 22, 30), '<status_bar><room npc="gulan" state="together" at="10日22:00"/><time elapsed="30"/></status_bar>');
    assert.strictEqual(wGrace.flags.playerRoomTarget, 'gulan');
    wGrace = stepFront(wGrace, 'grace_dawn', DAY(11, 8, 0), '<status_bar><time elapsed="570"/></status_bar>');
    assert.strictEqual(wGrace.flags.playerRoomTarget, null);
    // Next night (<2880 min since dawn): grace buffer blocks stage 2
    wGrace = stepFront(wGrace, 'grace_n1', DAY(11, 22, 0), '<status_bar><time elapsed="840"/></status_bar>');
    assert.strictEqual(wGrace.npcs.gulan.stage, 1, 'Within 2-day grace buffer after co-room, stage 2 stays blocked');
    // After 2880 min elapsed (Day 13 22:00): grace expires and covert event fires
    wGrace = stepFront(wGrace, 'grace_n3', DAY(13, 22, 0), '<status_bar><time elapsed="2880"/></status_bar>');
    assert.strictEqual(wGrace.npcs.gulan.flags.ed_hypnosis_play_done, true, 'After 2-day grace buffer expires, covert event triggers');
    assert.strictEqual(wGrace.npcs.gulan.stage, 2);

    // 3) Isna 90 affection pendant exchange -> inventory isna_pendant -> ambush breaks pendant -> rescue_now recovers
    let wI = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wI.flags.arrived_oakhaven = true;
    wI.playerLocation = 'inn';
    wI.npcs.isna.location = 'inn';
    wI.npcs.gulan.location = 'training_grounds';
    wI.npcs.isna.values.affection = 92;
    wI.timeMin = DAY(12, 21, 0);
    wI.flags.lastInnSettledDay = 11;
    wI = stepFront(wI, 'i_pen_trig', DAY(12, 21, 10), '<status_bar><time elapsed="10"/></status_bar>');
    wI = stepFront(wI, 'i_pen_ok', DAY(12, 21, 20), '<status_bar><time elapsed="10"/><event_resolve id="isna_pendant_exchange" npc="isna" outcome="accept_pendant"/></status_bar>');
    assert.strictEqual(wI.npcs.isna.flags.token_exchanged, true);
    assert.strictEqual(hasItem(wI, 'isna_pendant'), true, 'accept_pendant adds isna_pendant to inventory');

    // Trigger wilds_camp ambush with pendant -> 0 delay help + consumes isna_pendant
    wI.npcs.isna.values.gold_desire = 70;
    wI = stepFront(wI, 'i_ambush_p', DAY(13, 10, 0), '<status_bar><time elapsed="760"/></status_bar>');
    assert.strictEqual(wI.npcs.isna.location, 'wilds_camp');
    assert.strictEqual(wI.npcs.isna.flags.isna_help_real, true, 'Pendant gives 0-delay real distress');
    assert.strictEqual(hasItem(wI, 'isna_pendant'), false, 'Broken pendant removed from inventory');
    assert(OKH_APP_ADAPTER.buildLedger(wI).includes('wilds_camp'), 'Ledger alerts Isna distress');

    // HUD multi-pending rendering check: add a 2nd pending interaction & verify BOTH show up in HUD
    wI.bg.eventStates['["event","ed_investigate_truth",null]'] = { status: 'pending', definitionId: 'ed_investigate_truth', npcId: null, triggeredAt: wI.timeMin };
    const multiHud = OKH_APP_HUD.buildHudHtml(wI);
    assert(multiHud.includes('1 / 2') && multiHud.includes('2 / 2'), 'HUD renders all pending interactions instead of hiding 2nd');
    delete wI.bg.eventStates['["event","ed_investigate_truth",null]'];

    // Rescue Isna via rescue_now -> Gulan blood_density +10, Isna back at inn with gold_desire -30 & unfrozen
    const gulanBdBefore = wI.npcs.gulan.values.blood_density;
    wI = stepFront(wI, 'i_rescue', DAY(13, 12, 0), '<status_bar><time elapsed="120"/><event_resolve id="isna_wilds_rescue_real" npc="isna" outcome="rescue_now"/></status_bar>');
    assert.strictEqual(wI.npcs.isna.location, 'inn');
    assert.strictEqual(wI.npcs.isna.flags.gold_desire_frozen, false);
    assert.strictEqual(wI.npcs.isna.values.gold_desire, 40);
    assert.strictEqual(wI.npcs.gulan.values.blood_density, gulanBdBefore + 10);

    // 4) Low-affection Isna direct capture -> Stage 1 (camp torture + blood seal + dossier + echo) -> Stage 2 (10-day mud spy, Day 3/6/9 away & covert report) -> Stage 3 (Day 10 fallen) -> false trap
    // 4-A: High affection (>=90) Gulan breaks out with +20 blood_density after Isna's 10-day mud stage
    let wFHigh = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wFHigh.flags.arrived_oakhaven = true;
    wFHigh.playerLocation = 'inn';
    wFHigh.npcs.isna.location = 'inn';
    wFHigh.npcs.gulan.location = 'inn';
    wFHigh.npcs.gulan.stage = 2;
    wFHigh.npcs.gulan.values.blood_density = 50;
    wFHigh.npcs.gulan.values.affection = 92;
    wFHigh.npcs.isna.values.affection = 60;
    wFHigh.npcs.isna.values.gold_desire = 70;
    wFHigh.timeMin = DAY(14, 10, 0);
    wFHigh.flags.lastInnSettledDay = 13;
    wFHigh = stepFront(wFHigh, 'fh_cap0', DAY(14, 10, 10), '<status_bar><time elapsed="10"/></status_bar>');
    assert.strictEqual(wFHigh.npcs.isna.stage, 1, 'Isna enters Stage 1 (omen) on capture day');
    assert.strictEqual(wFHigh.npcs.isna.flags.captured_orc, true);
    wFHigh = stepFront(wFHigh, 'fh_cap1', DAY(15, 10, 0), '<status_bar><time elapsed="1430"/></status_bar>');
    assert.strictEqual(wFHigh.npcs.isna.stage, 2, 'Isna enters Stage 2 (mud spy) & returns to inn');
    assert.strictEqual(wFHigh.npcs.isna.location, 'inn');
    for (let d = 16; d <= 25; d++) {
      wFHigh = stepFront(wFHigh, `fh_mud_${d}`, DAY(d, 20, 0), '<status_bar><time elapsed="1440"/></status_bar>');
    }
    assert.strictEqual(wFHigh.npcs.isna.stage, 3, 'Isna enters Stage 3 after 10 mud days');
    assert.strictEqual(wFHigh.npcs.isna.flags.isna_fallen_orc, true);
    assert.strictEqual(wFHigh.npcs.isna.flags.isnaMudSpyCount, 3, 'Isna completes 3 covert camp reports (Days 3, 6, 9)');
    assert.strictEqual(wFHigh.npcs.gulan.flags.captured_orc, undefined, 'High-affection Gulan is NOT captured');
    assert.notStrictEqual(wFHigh.npcs.gulan.location, 'wilds_camp', 'High-affection Gulan escapes wilds_camp');
    assert.strictEqual(wFHigh.npcs.gulan.values.blood_density, 80, 'High-affection Gulan blood_density reaches 80 (+10 awakening, +20 breakout)');

    // 4-B: Low affection (<90) Gulan captured -> HUD shows ［暂离］ -> Rush camp blocked -> Ed note delivered -> Camp destroyed confession resolve
    let wF = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wF.flags.arrived_oakhaven = true;
    wF.flags.ed_joined = true;
    wF.npcs.ed.monitored = true;
    wF.playerLocation = 'inn';
    wF.npcs.isna.location = 'inn';
    wF.npcs.gulan.location = 'inn';
    wF.npcs.ed.location = 'inn';
    wF.npcs.gulan.stage = 2;
    wF.npcs.gulan.values.blood_density = 50;
    wF.npcs.gulan.values.affection = 70;
    wF.npcs.isna.values.affection = 60;
    wF.npcs.isna.values.gold_desire = 70;
    wF.timeMin = DAY(14, 10, 0);
    wF.flags.lastInnSettledDay = 13;
    wF = stepFront(wF, 'f_cap0', DAY(14, 10, 10), '<status_bar><time elapsed="10"/></status_bar>');
    assert.strictEqual(wF.npcs.isna.flags.captured_orc, true);
    assert.strictEqual(wF.npcs.isna.stage, 1);
    wF = stepFront(wF, 'f_cap1', DAY(15, 10, 0), '<status_bar><time elapsed="1430"/></status_bar>');
    assert.strictEqual(wF.npcs.isna.stage, 2);
    for (let d = 16; d <= 25; d++) {
      wF = stepFront(wF, `f_mud_${d}`, DAY(d, 20, 0), '<status_bar><time elapsed="1440"/></status_bar>');
    }
    assert.strictEqual(wF.npcs.isna.flags.isna_fallen_orc, true);
    assert.strictEqual(wF.npcs.gulan.flags.captured_orc, true, 'Low-affection Gulan is captured by trap');
    assert.strictEqual(wF.npcs.gulan.location, 'wilds_camp');
    assert.strictEqual(wF.flags.gulan_trap_captured_day, 25);

    // HUD must display ［暂离］ without leaking wilds_camp spoiler in Gulan roster card
    const hudCaptured = OKH_APP_HUD.buildHudHtml(wF);
    const gulanCard = hudCaptured.slice(hudCaptured.indexOf('data-okh-id="gulan"'), hudCaptured.indexOf('data-okh-member="isna"'));
    assert(!gulanCard.includes('城外黑兽人前哨据点'), 'Captured Gulan location must not leak wilds_camp');
    assert(gulanCard.includes('暂离'), 'Captured Gulan stance/location must show 暂离');

    // Player attempts rush camp on Day 26 -> blocked and repelled back to wilds
    wF = stepFront(wF, 'f_rush_camp', DAY(26, 8, 0), '<status_bar><move to="wilds_camp"/><time elapsed="60"/></status_bar>');
    assert.strictEqual(wF.playerLocation, 'wilds', 'Player cannot enter wilds_camp, repelled to wilds');

    // Player returns to inn on Day 26 -> Ed delivers Gulan note
    wF = stepFront(wF, 'f_return_inn', DAY(26, 10, 0), '<status_bar><move to="inn"/><time elapsed="120"/></status_bar>');
    assert.strictEqual(wF.flags.gulan_note_delivered, true, 'Ed delivers note at inn on day after capture');

    // Day 27 at inn -> camp destroyed resolve with note -> Gulan returns, blood_density +20, Isna deceased
    wF = stepFront(wF, 'f_camp_destroyed', DAY(27, 9, 0), '<status_bar><time elapsed="1380"/></status_bar>');
    assert.strictEqual(wF.flags.orc_camp_destroyed, true, 'Orc camp destroyed');
    assert.strictEqual(wF.flags.gulan_escape_confessed, true);
    assert.strictEqual(wF.npcs.isna.alive, false, 'Fallen Isna deceased');
    assert.strictEqual(wF.npcs.gulan.flags.captured_orc, false);
    assert.strictEqual(wF.npcs.gulan.location, 'inn');
    assert(wF.npcs.gulan.values.blood_density >= 70, 'Gulan blood_density includes +20 from camp destroyed resolve');

    // 4-C: Low affection (<90) Gulan captured -> Player stays in town on Day 26 (no note) -> Player enters inn on Day 27 -> Confession without note triggers, note blocked
    let wFNoNote = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wFNoNote.flags.arrived_oakhaven = true;
    wFNoNote.flags.ed_joined = true;
    wFNoNote.npcs.ed.monitored = true;
    wFNoNote.playerLocation = 'inn';
    wFNoNote.npcs.isna.location = 'inn';
    wFNoNote.npcs.gulan.location = 'inn';
    wFNoNote.npcs.ed.location = 'inn';
    wFNoNote.npcs.gulan.stage = 2;
    wFNoNote.npcs.gulan.values.blood_density = 50;
    wFNoNote.npcs.gulan.values.affection = 70;
    wFNoNote.npcs.isna.values.affection = 60;
    wFNoNote.npcs.isna.values.gold_desire = 70;
    wFNoNote.timeMin = DAY(14, 10, 0);
    wFNoNote.flags.lastInnSettledDay = 13;
    wFNoNote = stepFront(wFNoNote, 'fnn_cap0', DAY(14, 10, 10), '<status_bar><time elapsed="10"/></status_bar>');
    wFNoNote = stepFront(wFNoNote, 'fnn_cap1', DAY(15, 10, 0), '<status_bar><time elapsed="1430"/></status_bar>');
    for (let d = 16; d <= 25; d++) {
      wFNoNote = stepFront(wFNoNote, `fnn_mud_${d}`, DAY(d, 20, 0), '<status_bar><time elapsed="1440"/></status_bar>');
    }
    assert.strictEqual(wFNoNote.npcs.gulan.flags.captured_orc, true, 'Gulan captured');

    // Day 25 night: Player leaves inn to town and stays there all through Day 26 (never visits inn on Day 26)
    wFNoNote = stepFront(wFNoNote, 'fnn_leave_inn', DAY(25, 22, 0), '<status_bar><move to="town"/><time elapsed="120"/></status_bar>');
    wFNoNote = stepFront(wFNoNote, 'fnn_day26_town', DAY(26, 14, 0), '<status_bar><time elapsed="960"/></status_bar>');
    assert.strictEqual(wFNoNote.playerLocation, 'town');
    assert.strictEqual(wFNoNote.flags.gulan_note_delivered, undefined, 'Note is NOT delivered because player never went to inn');
    assert.strictEqual(wFNoNote.flags.gulan_escape_confessed, undefined, 'Confession does not fire while player in town');

    // Day 27 morning in town: still no confession because player and Gulan are not at same location
    wFNoNote = stepFront(wFNoNote, 'fnn_day27_town', DAY(27, 9, 0), '<status_bar><time elapsed="1140"/></status_bar>');
    assert.strictEqual(wFNoNote.flags.gulan_escape_confessed, undefined, 'Confession still not fired in town');

    // Day 27: Player returns to inn -> Meets Gulan at same location -> Confession without note triggers!
    wFNoNote = stepFront(wFNoNote, 'fnn_return_inn', DAY(27, 10, 0), '<status_bar><move to="inn"/><time elapsed="60"/></status_bar>');
    assert.strictEqual(wFNoNote.flags.orc_camp_destroyed, true, 'Orc camp destroyed');
    assert.strictEqual(wFNoNote.flags.gulan_escape_confessed, true, 'Confession without note fired');
    assert.strictEqual(wFNoNote.flags.gulan_note_delivered, undefined, 'Note was NEVER delivered');
    assert.strictEqual(wFNoNote.npcs.isna.alive, false, 'Isna deceased');
    assert.strictEqual(wFNoNote.npcs.gulan.flags.captured_orc, false);
    assert.notStrictEqual(wFNoNote.npcs.gulan.location, 'wilds_camp');

    // 4-D: Stage 2 high-affection (>=75) room visit probe after Day 3 camp return -> confess -> next-day daytime Cecilia purge (-15 orphanage_funds, +isna_orc_phobia)
    let wMudHi = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wMudHi.flags.arrived_oakhaven = true;
    wMudHi.playerLocation = 'inn';
    wMudHi.npcs.isna.location = 'inn';
    wMudHi.npcs.isna.stage = 2;
    wMudHi.npcs.isna.values.affection = 78;
    wMudHi.npcs.isna.flags.gold_desire_frozen = true;
    wMudHi.npcs.isna.flags.isnaMudDays = 4;
    wMudHi.npcs.isna.flags.isnaMudSpyCount = 1;
    wMudHi.npcs.isna.flags.isnaMudProbeCount = 0;
    const ceciliaFundsBefore = wMudHi.npcs.cecilia.values.orphanage_funds;
    wMudHi.timeMin = DAY(18, 19, 0);
    wMudHi = stepFront(wMudHi, 'mud_hi_visit', DAY(18, 19, 10), '<status_bar><time elapsed="10"/><interact npc="isna"/></status_bar>');
    assert.strictEqual(wMudHi.bg.eventStates['["event","isna_mud_probe","isna"]']?.status, 'pending', 'High-affection room visit after camp return triggers probe interaction');
    wMudHi = stepFront(wMudHi, 'mud_hi_confess', DAY(18, 19, 20), '<status_bar><time elapsed="10"/><event_resolve id="isna_mud_probe" npc="isna" outcome="probe_confess"/></status_bar>');
    assert.strictEqual(wMudHi.npcs.isna.flags.isnaMudTruthKnown, true);
    // Day 6 daylight: the scheduled visit begins only in the evening.
    wMudHi = stepFront(wMudHi, 'mud_hi_day5', DAY(19, 10, 0), '<status_bar><time elapsed="880"/></status_bar>');
    wMudHi = stepFront(wMudHi, 'mud_hi_day6', DAY(20, 9, 0), '<status_bar><time elapsed="1380"/></status_bar>');
    assert.strictEqual(wMudHi.npcs.isna.flags.isnaMudDays, 6);
    assert.strictEqual(Boolean(wMudHi.npcs.isna.flags.isnaMudOutTonight), false, 'Day 6 morning remains in town');
    assert.strictEqual(sb.OKH_APP_MAP.isLocationHidden(wMudHi.npcs.isna), false, 'Map does not hide Isna in daylight');
    assert.strictEqual(wMudHi.bg.eventStates['["event","isna_mud_purge_choice","isna"]']?.status, 'pending', 'Next-day daytime purge choice appears');
    wMudHi = stepFront(wMudHi, 'mud_hi_purge', DAY(20, 9, 30), '<status_bar><time elapsed="30"/><event_resolve id="isna_mud_purge_choice" npc="isna" outcome="purge_cecilia"/></status_bar>');
    assert.strictEqual(wMudHi.npcs.isna.stage, 0, 'Cecilia purge returns Isna to stage 0');
    assert.strictEqual(wMudHi.npcs.isna.flags.isnaMudSealCleared, true);
    assert(wMudHi.tags?.isna?.includes('isna_orc_phobia'), 'Purge grants isna_orc_phobia tag');
    assert.strictEqual(wMudHi.npcs.cecilia.values.orphanage_funds, ceciliaFundsBefore - 35, 'Cecilia purge (-15) + midgame crisis (-10) + 2 days drain (-10)');

    // 4-E: Stage 2 low-affection (<75) room visit -> evade on Day 4 -> Day 6 camp report -> Day 7 night 2nd break-in -> Day 8 Gulan purge
    let wMudLo = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wMudLo.flags.arrived_oakhaven = true;
    wMudLo.playerLocation = 'inn';
    wMudLo.npcs.isna.location = 'inn';
    wMudLo.npcs.isna.stage = 2;
    wMudLo.npcs.isna.values.affection = 60;
    wMudLo.npcs.isna.flags.gold_desire_frozen = true;
    wMudLo.npcs.isna.flags.isnaMudDays = 4;
    wMudLo.npcs.isna.flags.isnaMudSpyCount = 1;
    wMudLo.npcs.isna.flags.isnaMudProbeCount = 0;
    wMudLo.timeMin = DAY(19, 19, 0);
    wMudLo = stepFront(wMudLo, 'mud_lo_visit1', DAY(19, 19, 10), '<status_bar><time elapsed="10"/><interact npc="isna"/></status_bar>');
    wMudLo = stepFront(wMudLo, 'mud_lo_evade', DAY(19, 19, 20), '<status_bar><time elapsed="10"/><event_resolve id="isna_mud_probe" npc="isna" outcome="probe_evade"/></status_bar>');
    assert.strictEqual(wMudLo.npcs.isna.flags.isnaMudFirstProbeDay, 4);
    // Day 5: still same cycle -> 2nd probe must NOT trigger
    wMudLo = stepFront(wMudLo, 'mud_lo_day5', DAY(20, 22, 0), '<status_bar><time elapsed="1600"/><interact npc="isna"/></status_bar>');
    assert.strictEqual(wMudLo.bg.eventStates['["event","isna_mud_probe_second","isna"]'], undefined, '2nd probe blocked before next camp return');
    // Day 6 night: camp report fires (spyCount 1->2), Day 7 night: 2nd probe triggers!
    wMudLo = stepFront(wMudLo, 'mud_lo_day6', DAY(21, 21, 0), '<status_bar><time elapsed="1380"/></status_bar>');
    assert.strictEqual(wMudLo.npcs.isna.flags.isnaMudSpyCount, 2, 'Day 6 camp report fires');
    assert(sb.OKH_APP_MAP.isLocationHidden(wMudLo.npcs.isna), 'Nighttime visit is hidden on the map');
    assert(wMudLo.playerState.dossierRecords.some(record => record.npc === 'isna' && record.location === 'wilds_camp' && record.at === DAY(21, 17)));
    wMudLo = stepFront(wMudLo, 'mud_lo_day7_dawn', DAY(22, 6, 0), '<status_bar><time elapsed="540"/></status_bar>');
    assert(!sb.OKH_APP_MAP.isLocationHidden(wMudLo.npcs.isna), 'Map visibility returns at dawn');
    wMudLo = stepFront(wMudLo, 'mud_lo_day7', DAY(22, 22, 0), '<status_bar><time elapsed="1500"/><interact npc="isna"/></status_bar>');
    assert.strictEqual(wMudLo.bg.eventStates['["event","isna_mud_probe_second","isna"]']?.status, 'pending', 'Day 7 night 2nd probe triggers after camp return');
    wMudLo = stepFront(wMudLo, 'mud_lo_breakin', DAY(22, 22, 10), '<status_bar><time elapsed="10"/><event_resolve id="isna_mud_probe_second" npc="isna" outcome="probe_break_in"/></status_bar>');
    assert.strictEqual(wMudLo.npcs.isna.flags.isnaMudTruthKnown, true);
    wMudLo = stepFront(wMudLo, 'mud_lo_day8', DAY(23, 10, 0), '<status_bar><time elapsed="710"/></status_bar>');
    wMudLo = stepFront(wMudLo, 'mud_lo_purge', DAY(23, 10, 20), '<status_bar><time elapsed="20"/><event_resolve id="isna_mud_purge_choice" npc="isna" outcome="purge_gulan"/></status_bar>');
    assert.strictEqual(wMudLo.npcs.isna.stage, 0, 'Gulan purge returns Isna to stage 0');
  });

  // 28. Gulan trailing threads: dynamic arrival-based Event 1 date, bloody_arena aftermath (unknown culprit, 7-day martial_law/panic & auto-expiry)
  await test('28. Gulan trailing threads: dynamic Event 1 date, bloody_arena aftermath (unknown culprit, 7-day martial_law/panic)', async () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER, OKH_APP_HUD } = sb;
    const cfg = OKH_APP_CONFIG.buildConfig();
    const DAY = OKH_APP_CONFIG.DAY;
    const stepFront = (state, id, toMin, rawText) => {
      const front = sb.OKH_APP_PARSE.buildFront(rawText, toMin, state, { config: cfg });
      return OKHBackground.advance(state, { id, revision: 'g3_' + id, toMin, interactingIds: front.interactingIds || [], front }, cfg).state;
    };

    // 1) Dynamic Event 1 date: arrivedDay=6 -> earliest is Day 17 (6+11), blocked on Day 15
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.flags.arrived_oakhaven = true;
    w.flags.arrivedDay = 6;
    w.playerLocation = 'inn';
    w.npcs.gulan.location = 'training_grounds';
    w.timeMin = DAY(15, 13, 0);
    w.flags.lastInnSettledDay = 14;
    w = stepFront(w, 'e1_early', DAY(15, 13, 10), '<status_bar><time elapsed="10"/></status_bar>');
    assert.strictEqual(w.flags.bloody_arena, undefined, 'arrivedDay=6 defers Event 1 past Day 15');

    w.timeMin = DAY(17, 13, 0);
    w.flags.lastInnSettledDay = 16;
    w.npcs.gulan.location = 'training_grounds';
    w = stepFront(w, 'e1_fire', DAY(17, 13, 10), '<status_bar><time elapsed="10"/></status_bar>');
    assert.strictEqual(w.flags.bloody_arena, true, 'Day 17 (arrivedDay+11) fires Event 1');
    assert.strictEqual(w.flags.bloodyArenaDay, 17);
    assert.strictEqual(w.flags.martial_law, true, 'bloody_arena adds martial_law tag');
    assert.strictEqual(w.flags.panic, true, 'bloody_arena adds panic tag');

    // 2) Next morning (Day 18): culprit unknown, NO guard inquiry event, 7-day martial_law/panic active
    w = stepFront(w, 'day18_morn', DAY(18, 9, 0), '<status_bar><time elapsed="1190"/></status_bar>');
    const inqKey = JSON.stringify(['event', 'bloody_arena_guard_inquiry', null]);
    assert.strictEqual(w.bg.eventStates[inqKey], undefined, 'No guard inquiry event (culprit unknown)');
    const ledger18 = OKH_APP_ADAPTER.buildLedger(w);
    assert(ledger18.includes('凶手未知'), 'Ledger notes culprit is unknown');
    assert(ledger18.includes('［安保戒严］与［人心惶惶］'), 'Ledger notes martial_law and panic tags');
    assert(ledger18.includes('还剩 6 天'), 'Day 18 has 6 days remaining');
    assert(OKH_APP_HUD.buildHudHtml(w).includes('［安保戒严 · 人心惶惶］'), 'HUD shows badge');

    // 3) Day 23 (Day 17 + 6): still active on final 7th day
    w = stepFront(w, 'day23_morn', DAY(23, 9, 0), '<status_bar><time elapsed="7200"/></status_bar>');
    const ledger23 = OKH_APP_ADAPTER.buildLedger(w);
    assert(ledger23.includes('还剩 1 天'), 'Day 23 has 1 day remaining');

    // 4) Day 24 (Day 17 + 7): 7 full days expired, midnight settles tags to false
    w = stepFront(w, 'day24_morn', DAY(24, 9, 0), '<status_bar><time elapsed="1440"/></status_bar>');
    assert.strictEqual(w.flags.martial_law, false, 'martial_law automatically expires after 7 days');
    assert.strictEqual(w.flags.panic, false, 'panic automatically expires after 7 days');
    const ledger24 = OKH_APP_ADAPTER.buildLedger(w);
    assert(ledger24.includes('戒严解除，市井议论逐渐平息'), 'Ledger shows aftermath cleared');
    assert(!OKH_APP_HUD.buildHudHtml(w).includes('［安保戒严 · 人心惶惶］'), 'HUD removes badge');
  });

  // 29. Aurora resignation talk, manor negotiation (master vs blocked), Eileen +30 boost & Nise ledger secrecy
  await test('29. Aurora resignation talk, manor negotiation branches, Eileen +30 & Nise ledger secrecy', () => {
    const sb = createSandbox();
    const { OKHBackground, OKH_APP_CONFIG, OKH_APP_ADAPTER } = sb;
    const { DAY } = OKH_APP_CONFIG;
    const cfg = OKH_APP_CONFIG.buildConfig();
    let w = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    w.flags.arrived_oakhaven = true;
    w.playerState.gold = 300;
    // Nise stage 1 without nise_debt_known must NOT expose debt in ledger
    w.npcs.nise.stage = 1;
    w.npcs.nise.values.gamble_debt = 40;
    assert(!OKH_APP_ADAPTER.buildLedger(w).includes('妮丝已查明赌债'), 'Nise debt hidden until nise_debt_known');
    w.npcs.nise.flags.nise_debt_known = true;
    assert(OKH_APP_ADAPTER.buildLedger(w).includes('妮丝已查明赌债：40 点'), 'Nise debt visible once nise_debt_known is true');

    // Aurora alone on weekend at inn with affection >= 90 triggers aurora_resign_talk
    w.flags.lord_hiring = true;
    w.playerLocation = 'inn';
    w.npcs.aurora.location = 'inn';
    w.npcs.gulan.location = 'training_grounds';
    w.npcs.gulan.flags.gulan_trained_today = true;
    w.npcs.isna.location = 'town';
    w.npcs.isna.flags.isna_worked_today = true;
    w.npcs.nise.location = 'town';
    w.npcs.cecilia.location = 'church';
    w.npcs.aurora.stage = 1;
    w.npcs.aurora.values.affection = 92;
    w.npcs.aurora.flags = { aurora_job_taken: true, manor_service_active: true, aurora_evt1_done: true, lastNightSettledDay: 5 };
    w.npcs.aurora.nodeStates = { aurora_stage_1: { status: 'completed' } };
    w.timeMin = DAY(6, 14); // Sat afternoon
    assert(OKH_APP_ADAPTER.buildLedger(w).includes('奥萝拉有些心绪不宁，和她独处谈谈心吧'), 'Ledger prompts private talk before resign');

    w = OKHBackground.advance(w, { id: 'res0', revision: 'rres0', toMin: w.timeMin + 5, interactingIds: ['aurora'], front: {} }, cfg).state;
    const prepTalk = OKHBackground.prepare(w, 8);
    assert(prepTalk.ids.some(id => id.includes('aurora_resign_talk')), 'aurora_resign_talk prepares when alone with Aurora on weekend');
    w = OKHBackground.advance(w, {
      id: 'res1', revision: 'rres1', toMin: w.timeMin + 10, interactingIds: ['aurora'],
      front: { resolveEvents: [{ eventId: 'aurora_resign_talk', npcId: 'aurora', outcome: 'support_resign' }] }
    }, cfg).state;
    assert(w.tags?.aurora?.includes('tag_aurora_resign_determined'), 'Supporting resign adds tag_aurora_resign_determined');
    assert.strictEqual(w.npcs.aurora.flags.aurora_resign_talked, true);

    // Branch A: With Master (Gulan) present at manor -> -200 gold, quit manor, tag_lord_grudge
    let wA = JSON.parse(JSON.stringify(w));
    wA.timeMin = DAY(8, 10); // Mon morning
    wA.playerLocation = 'manor';
    wA.npcs.aurora.location = 'manor';
    wA.npcs.gulan.location = 'manor';
    wA = OKHBackground.advance(wA, { id: 'negA0', revision: 'rnegA0', toMin: wA.timeMin + 5, interactingIds: [], front: {} }, cfg).state;
    assert(OKHBackground.prepare(wA, 8).ids.some(id => id.includes('aurora_manor_resign_negotiate')), 'Negotiation triggers at manor with resign tag');
    wA = OKHBackground.advance(wA, {
      id: 'negA1', revision: 'rnegA1', toMin: wA.timeMin + 10, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'aurora_manor_resign_negotiate', npcId: 'aurora', outcome: 'negotiate_master' }] }
    }, cfg).state;
    assert.strictEqual(wA.playerState.gold, 100, 'Branch A deducts 200 gold (300 -> 100)');
    assert(wA.tags?.aurora?.includes('tag_lord_grudge'), 'Branch A grants tag_lord_grudge');
    assert.strictEqual(wA.npcs.aurora.flags.aurora_left_manor, true, 'Branch A frees Aurora from manor');
    assert.strictEqual(wA.npcs.aurora.flags.manor_service_active, false);

    // Branch B: Without Master at manor -> blocked, ejected to town, aurora_resign_failed, Eileen intel +30
    let wB = JSON.parse(JSON.stringify(w));
    wB.timeMin = DAY(8, 10);
    wB.playerLocation = 'manor';
    wB.npcs.aurora.location = 'manor';
    wB.npcs.gulan.location = 'inn';
    wB = OKHBackground.advance(wB, { id: 'negB0', revision: 'rnegB0', toMin: wB.timeMin + 5, interactingIds: [], front: {} }, cfg).state;
    assert(OKHBackground.prepare(wB, 8).ids.some(id => id.includes('aurora_manor_resign_negotiate')));
    wB = OKHBackground.advance(wB, {
      id: 'negB1', revision: 'rnegB1', toMin: wB.timeMin + 10, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'aurora_manor_resign_negotiate', npcId: 'aurora', outcome: 'negotiate_blocked' }] }
    }, cfg).state;
    assert.strictEqual(wB.playerLocation, 'town', 'Branch B ejects player from manor to town');
    assert.strictEqual(wB.npcs.aurora.flags.aurora_resign_failed, true, 'Branch B sets aurora_resign_failed');
    assert.strictEqual(wB.npcs.aurora.flags.manor_service_active, true, 'Branch B keeps Aurora at manor');

    wB.flags.eileen_fugitive = true;
    wB.flags.eileen_ambush_closed = true;
    wB.npcs.aurora.flags.aurora_debt_disclosed = true;
    wB.npcs.eileen.monitored = true;
    wB.npcs.eileen.values.counterattack = 10;
    wB.timeMin = DAY(13, 10);
    wB.playerLocation = 'inn';
    wB.npcs.aurora.location = 'inn';
    wB = OKHBackground.advance(wB, { id: 'intelB0', revision: 'rintelB0', toMin: wB.timeMin + 15, interactingIds: [], front: {} }, cfg).state;
    assert(OKHBackground.prepare(wB, 8).ids.some(id => id.includes('aurora_pass_manor_intel')));
    wB = OKHBackground.advance(wB, {
      id: 'intelB1', revision: 'rintelB1', toMin: wB.timeMin + 20, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'aurora_pass_manor_intel', npcId: 'aurora', outcome: 'receive_intel' }] }
    }, cfg).state;
    assert.strictEqual(wB.npcs.eileen.values.counterattack, 40, 'Failed resign boosts Eileen counterattack by +30 (10 -> 40)');
  });

  const failed = results.filter(r => !r.ok);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
