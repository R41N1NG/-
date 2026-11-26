/**
 * @file test_foundation.cjs
 * @updated 2026-11-11 00:12
 * @purpose Adversarial test suite against compiled tavern_scripts/okh_complete.js covering all 9 initial fixes + R2 5-point code review checks.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const BUNDLE_PATH = path.resolve(__dirname, '../../tavern_scripts/okh_complete.js');
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
      assert(typeof ev.text === 'string' && ev.text.trim().length > 0, `event ${ev.id} missing text`);
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

    w = OKHBackground.advance(w, {
      id: 'm1', revision: 'r1', toMin: w.timeMin, interactingIds: [], front: {}
    }, cfg).state;
    const promptKey = u.key('event', 'gulan_final_rescue_prompt', 'gulan');
    assert.strictEqual(w.npcs.gulan.stage, 2);
    assert.strictEqual(w.bg.eventStates[promptKey]?.status, 'pending');

    w = OKHBackground.advance(w, {
      id: 'm2', revision: 'r2', toMin: w.timeMin + 10, interactingIds: [],
      front: { resolveEvents: [{ eventId: 'gulan_final_rescue_prompt', npcId: 'gulan', outcome: 'rescue' }] }
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.stage, 2);
    assert.strictEqual(w.npcs.gulan.values.blood_density, 72);
    assert.strictEqual(w.npcs.gulan.flags.gulan_rescued_final, true);

    let wFail = OKHBackground.init(OKH_APP_CONFIG.buildInitialWorld(), cfg);
    wFail.flags.arrived_oakhaven = true;
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
    assert.strictEqual(w.npcs.gulan.values.blood_density, 1);
    assert.strictEqual(w.npcs.isna.values.gold_desire, 26);

    w = OKHBackground.advance(w, {
      id: 'd2m', revision: 'r2', toMin: DAY(2, 7), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.values.blood_density, 1);
    assert.strictEqual(w.npcs.isna.values.gold_desire, 27);
    assert.strictEqual(w.flags.playerRoomTarget, null);

    w = OKHBackground.advance(w, {
      id: 'skip5', revision: 'r3', toMin: DAY(7, 5), interactingIds: [], front: {}
    }, cfg).state;
    assert.strictEqual(w.npcs.gulan.values.blood_density, 6);
    assert.strictEqual(w.npcs.gulan.values.affection, 91);
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
      id: 'sw1', revision: 'r3', toMin: DAY(4, 15), interactingIds: [],
      front: {
        playerLocation: 'wilds', playerLocationAt: 'start',
        npcs: { isna: { location: 'wilds', locationAt: 'start' } },
        bonds: [{ npc: 'isna', kind: 'steady_work', at: 'start' }]
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
    assert.strictEqual(restoredW.schemaVersion, 2);
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

  const failed = results.filter(r => !r.ok);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
