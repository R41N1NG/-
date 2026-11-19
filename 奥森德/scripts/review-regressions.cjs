'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');

// Reuse only the supplied VM setup; do not run or modify the supplied suite.
const originalPath = path.join(__dirname, 'test_foundation.cjs');
const header = fs.readFileSync(originalPath, 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', header + '\nmodule.exports = { createSandbox };')(
  require, path.dirname(originalPath), holder
);
const { createSandbox } = holder.exports;

function fixture(extra = {}) {
  const sb = createSandbox();
  const cfg = {
    policy: { ordinaryGraceMin: 120 },
    phases: [{ id: 'night', start: 0 }, { id: 'morning', start: 360 },
      { id: 'afternoon', start: 720 }, { id: 'evening', start: 1080 }],
    actions: [], events: [], nodes: [], releaseRules: {}, ...extra
  };
  const raw = {
    timeMin: 360, playerLocation: 'inn', interactingIds: [], flags: {},
    npcs: { a: { id: 'a', name: 'A', monitored: true, alive: true,
      location: 'inn', values: { money: 0 }, flags: {}, plan: [], nodePlan: [] } }
  };
  return { sb, cfg, world: sb.OKHBackground.init(raw, cfg) };
}
function command(id, toMin, front = {}) {
  return { id, revision: 'r1', toMin, interactingIds: [], front };
}
function event(extra = {}) {
  return { id: 'offer', mode: 'interaction', scope: 'npc', targets: ['a'],
    when: () => true, text: 'Choose a task',
    outcomes: { accept: { text: 'Task accepted' } }, ...extra };
}

test('undeclared inherited outcome toString must be rejected', () => {
  const { sb, cfg, world } = fixture({ events: [event()] });
  const pending = sb.OKHBackground.advance(world, command('trigger', 360), cfg).state;
  assert.throws(() => sb.OKHBackground.advance(pending, command('invalid', 360, {
    resolveEvents: [{ eventId: 'offer', npcId: 'a', outcome: 'toString' }]
  }), cfg), /未登记|非法/);
});

test('new activity may start exactly when ordinary protection expires', () => {
  const { sb, cfg, world } = fixture();
  const busy = sb.OKHBackground.advance(world, command('first', 360, {
    npcs: { a: { activity: { op: 'start', id: 'old', kind: 'ordinary', label: 'Rest' } } }
  }), cfg).state;
  const next = sb.OKHBackground.advance(busy, command('handoff', 480, {
    npcs: { a: { activity: { op: 'start', id: 'new', kind: 'ordinary', label: 'Walk' } } }
  }), cfg).state;
  assert.equal(next.npcs.a.activity.id, 'new');
  assert.equal(next.npcs.a.activityHistory.old.reason, 'ordinary-timeout');
});

test('acknowledging the old generation must not consume a retried prompt', async () => {
  const { sb, cfg, world } = fixture({ events: [event({ allowCancel: true, retryOnCancel: true })] });
  let current = sb.OKHBackground.advance(world, command('trigger', 360), cfg).state;
  const ctl = sb.OKHBackgroundAdapter.createController({
    config: cfg, readWorld: () => current,
    commit: ({ state }) => { current = state; return true; }
  });
  await ctl.prepareGeneration('generation-old');
  await ctl.finishReply(command('cancel', 361, {
    resolveEvents: [{ eventId: 'offer', npcId: 'a', outcome: 'cancel' }]
  }), 'generation-old');
  assert.equal(Object.values(current.bg.eventStates)[0].status, 'pending');
  assert.equal(sb.OKHBackground.prepare(current).ids.length, 1,
    'the new event occurrence has not been delivered in generation-old');
});

test('an explicitly registered toString choice remains valid', () => {
  const { sb, cfg, world } = fixture({ events: [event({
    outcomes: { toString: { text: 'An explicit choice', effects: { add: { money: 2 } } } }
  })] });
  const pending = sb.OKHBackground.advance(world, command('trigger', 360), cfg).state;
  const next = sb.OKHBackground.advance(pending, command('choose', 360, {
    resolveEvents: [{ eventId: 'offer', npcId: 'a', outcome: 'toString' }]
  }), cfg).state;
  assert.equal(next.npcs.a.values.money, 2);
});

test('expiry does not evaluate an event before same-time movement receipts', () => {
  const { sb, cfg, world } = fixture({ events: [event({
    mode: 'result', outcomes: undefined,
    when: ({ world, npc }) => world.timeMin >= 480 && npc.location === 'inn',
    effects: { add: { money: 99 } }
  })] });
  const busy = sb.OKHBackground.advance(world, command('first', 360, {
    npcs: { a: { activity: { op: 'start', id: 'old', kind: 'ordinary' } } }
  }), cfg).state;
  const result = sb.OKHBackground.advance(busy, command('handoff', 480, {
    npcs: { a: { location: 'town', activity: { op: 'start', id: 'new', kind: 'ordinary' } } }
  }), cfg);
  assert.equal(result.state.npcs.a.location, 'town');
  assert.equal(result.state.npcs.a.values.money, 0);
  assert.equal(result.state.npcs.a.activity.id, 'new');
  assert.equal(result.report.released.filter(id => id === 'a').length, 1);
});

test('protection still blocks early replacement and important activities', () => {
  for (const [kind, toMin] of [['ordinary', 479], ['important', 480]]) {
    const { sb, cfg, world } = fixture();
    const busy = sb.OKHBackground.advance(world, command('first', 360, {
      npcs: { a: { activity: { op: 'start', id: 'old', kind } } }
    }), cfg).state;
    const before = JSON.stringify(busy);
    assert.throws(() => sb.OKHBackground.advance(busy, command('replace', toMin, {
      npcs: { a: { activity: { op: 'start', id: 'new', kind: 'ordinary' } } }
    }), cfg), /不能隐式覆盖/);
    assert.equal(JSON.stringify(busy), before);
  }
});

test('an already-expired activity is released before receipts at the starting time', () => {
  const { sb, cfg, world } = fixture();
  world.npcs.a.activity = { id: 'old', kind: 'ordinary', label: 'Rest', startedAt: 240 };
  const next = sb.OKHBackground.advance(world, command('handoff', 360, {
    npcs: { a: { activity: { op: 'start', id: 'new', kind: 'ordinary' } } }
  }), cfg).state;
  assert.equal(next.npcs.a.activity.id, 'new');
  assert.equal(next.npcs.a.activityHistory.old.endedAt, 360);
});

test('retry occurrence IDs survive reload and legacy records without instance metadata', () => {
  const { sb, cfg, world } = fixture({ events: [event({ allowCancel: true, retryOnCancel: true })] });
  let current = sb.OKHBackground.advance(world, command('trigger', 360), cfg).state;
  const key = Object.keys(current.bg.eventStates)[0];
  const firstId = current.bg.queue[0].id;
  delete current.bg.eventStates[key].instanceId;
  delete current.bg.eventStates[key].occurrence;
  const ids = [firstId];
  for (let i = 0; i < 3; i++) {
    current = JSON.parse(JSON.stringify(current));
    current = sb.OKHBackground.advance(current, command('cancel-' + i, 361 + i, {
      resolveEvents: [{ eventId: 'offer', npcId: 'a', outcome: 'cancel' }]
    }), cfg).state;
    const nextId = current.bg.eventStates[key].instanceId;
    assert(!ids.includes(nextId));
    ids.push(nextId);
    current = sb.OKHBackground.ack(current, [ids[ids.length - 2]], 'old-' + i);
    assert.deepEqual(Array.from(sb.OKHBackground.prepare(current).ids), [nextId]);
  }
  current = sb.OKHBackground.advance(current, command('accept', 365, {
    resolveEvents: [{ eventId: 'offer', npcId: 'a', outcome: 'accept' }]
  }), cfg).state;
  assert.equal(current.bg.queue.find(entry => entry.id === ids.at(-1)).status, 'superseded');
  assert.equal(current.bg.queue.filter(entry => entry.status === 'pending').length, 1);
});

function setupHookHarness(chatId = 'hook-reg-chat') {
  const sb = createSandbox(chatId);
  const store = new Map();
  const injectLog = [];
  const listeners = new Map();
  sb._ctxObj.chat = [{ is_user: false, is_system: false, mes: '开场白', swipe_id: 0 }];
  sb.OKH_APP.configure({
    chatId,
    storage: { get: k => store.get(k), set: (k, v) => (store.set(k, v), true) },
    inject: async text => { injectLog.push(text); return true; },
    getContext: () => sb._ctxObj,
    events: sb._ctxObj.event_types,
    eventOn: (name, fn) => listeners.set(name, fn),
    eventOff: name => listeners.delete(name)
  });
  return { sb, injectLog, listeners };
}

test('GENERATION_STARTED before user send matches shifted MESSAGE_RECEIVED and skips empty prepare', async () => {
  const { sb, injectLog, listeners } = setupHookHarness();
  await sb.OKH_APP.start();
  await sb.OKH_APP.onMessage(0);

  // 1) Empty queue: injects ledger without bumping revision or creating empty generations entry
  const revEmpty = sb.OKH_APP.world().bg.revision;
  await listeners.get('GENERATION_STARTED')('normal', {}, false);
  assert.ok(injectLog.at(-1).includes('玩家位置'));
  assert.equal(sb.OKH_APP.world().bg.revision, revEmpty);
  assert.deepEqual(sb.OKH_APP.world().bg.generations, {});

  sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '去找水' });
  sb._ctxObj.chat.push({
    is_user: false, is_system: false, swipe_id: 0,
    mes: '<status_bar><time elapsed="10"/><move to="wilds"/></status_bar>'
  });
  await listeners.get('MESSAGE_RECEIVED')(2);
  assert.equal(injectLog.at(-1), '', 'prompt injection must clear after shifted MESSAGE_RECEIVED');
  assert.equal(sb.OKH_APP.world().playerLocation, 'wilds');

  // 2) Pending prompt in queue: prepares generation, delivers prompt, matches +1 MESSAGE_RECEIVED & completes
  const cfg = sb.OKH_APP.config();
  const wQueued = sb.OKHBackgroundModules.utils.clone(sb.OKH_APP.world());
  wQueued.flags.arrived_oakhaven = true;
  wQueued.playerLocation = 'town';
  wQueued.npcs.isna.location = 'town';
  wQueued.npcs.isna.values.gold_desire = 55;
  wQueued.timeMin = sb.OKH_APP_CONFIG.DAY(9, 21);
  const triggered = sb.OKHBackground.advance(
    wQueued,
    { id: 'seed-pend', revision: 's1', toMin: wQueued.timeMin, interactingIds: [], front: {} },
    cfg
  ).state;
  await sb.OKH_APP.save(triggered, { debug: true });

  await listeners.get('GENERATION_STARTED')('normal', {}, false);
  assert.ok(injectLog.at(-1).includes('isna_alley_lockpick_spot'));
  const prepIds = Object.keys(sb.OKH_APP.world().bg.generations);
  assert.equal(prepIds.length, 1);
  assert.equal(sb.OKH_APP.world().bg.generations[prepIds[0]].status, 'prepared');

  sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '进小巷' });
  sb._ctxObj.chat.push({
    is_user: false, is_system: false, swipe_id: 0,
    mes: '<status_bar><time elapsed="10"/></status_bar>'
  });
  await listeners.get('MESSAGE_RECEIVED')(4);
  assert.equal(injectLog.at(-1), '');
  assert.equal(sb.OKH_APP.world().bg.generations[prepIds[0]].status, 'completed');
  await sb.OKH_APP.stop();
});

test('GENERATION_STOPPED rolls back prepared generation and ignores quiet/impersonate/dryRun', async () => {
  const { sb, injectLog, listeners } = setupHookHarness('hook-cancel-chat');
  await sb.OKH_APP.start();
  await sb.OKH_APP.onMessage(0);

  const cfg = sb.OKH_APP.config();
  const wQueued = sb.OKHBackgroundModules.utils.clone(sb.OKH_APP.world());
  wQueued.flags.arrived_oakhaven = true;
  wQueued.playerLocation = 'town';
  wQueued.npcs.isna.location = 'town';
  wQueued.npcs.isna.values.gold_desire = 55;
  wQueued.timeMin = sb.OKH_APP_CONFIG.DAY(9, 21);
  const triggered = sb.OKHBackground.advance(
    wQueued,
    { id: 'seed-cancel', revision: 's2', toMin: wQueued.timeMin, interactingIds: [], front: {} },
    cfg
  ).state;
  await sb.OKH_APP.save(triggered, { debug: true });

  const revBefore = sb.OKH_APP.world().bg.revision;
  const countBefore = injectLog.length;

  await listeners.get('GENERATION_STARTED')('quiet', {}, false);
  await listeners.get('GENERATION_STARTED')('impersonate', {}, false);
  await listeners.get('GENERATION_STARTED')('normal', {}, true);
  await listeners.get('GENERATION_STARTED')('normal', { dryRun: true }, false);
  assert.equal(injectLog.length, countBefore);
  assert.equal(sb.OKH_APP.world().bg.revision, revBefore);

  // Simulated PromptViewer: normal GENERATION_STARTED -> inspect prompt -> stopGeneration() -> GENERATION_STOPPED
  await listeners.get('GENERATION_STARTED')('normal', {}, false);
  assert.ok(injectLog.at(-1).includes('isna_alley_lockpick_spot'));
  assert.equal(Object.keys(sb.OKH_APP.world().bg.generations).length, 1);

  listeners.get('GENERATION_STOPPED')();
  await sb.OKH_APP.syncHistory();
  assert.equal(injectLog.at(-1), '');
  assert.equal(sb.OKH_APP.world().bg.revision, revBefore);
  assert.deepEqual(sb.OKH_APP.world().bg.generations, {});
  assert.equal(sb.OKHBackground.prepare(sb.OKH_APP.world(), 8).ids.length, 1);
  await sb.OKH_APP.stop();
});

test('regenerate generation matches newest assistant index in place', async () => {
  const { sb, injectLog, listeners } = setupHookHarness('hook-regen-chat');
  await sb.OKH_APP.start();
  await sb.OKH_APP.onMessage(0);
  sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '出发' });
  sb._ctxObj.chat.push({
    is_user: false, is_system: false, swipe_id: 0,
    mes: '<status_bar><time elapsed="10"/></status_bar>'
  });
  await listeners.get('MESSAGE_RECEIVED')(2);

  await listeners.get('GENERATION_STARTED')('regenerate', {}, false);
  assert.ok(injectLog.at(-1).includes('玩家位置'));
  sb._ctxObj.chat[2] = {
    is_user: false, is_system: false, swipe_id: 1,
    mes: '<status_bar><time elapsed="20"/></status_bar>'
  };
  await listeners.get('MESSAGE_RECEIVED')(2);
  assert.equal(injectLog.at(-1), '');
  assert.equal(sb.OKH_APP.world().timeMin, sb.OKH_APP_CONFIG.DAY(1, 18, 20));
  await sb.OKH_APP.stop();
});

test('regenerate after failed send with trailing user message preserves prior turn', async () => {
  const { sb, injectLog, listeners } = setupHookHarness('hook-429-regen-chat');
  sb._ctxObj.event_types.GENERATION_ENDED = 'GENERATION_ENDED';
  await sb.OKH_APP.start();
  try {
    await sb.OKH_APP.onMessage(0);

    // Turn 1 succeeds at index 2 (18:00 -> 18:10)
    await listeners.get('GENERATION_STARTED')('normal', {}, false);
    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '去坡下找水' });
    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<status_bar><time elapsed="10"/></status_bar>'
    });
    await listeners.get('MESSAGE_RECEIVED')(2);
    assert.equal(sb.OKH_APP.world().timeMin, sb.OKH_APP_CONFIG.DAY(1, 18, 10));

    // Turn 2 user message sent, API errors out (GENERATION_ENDED without MESSAGE_RECEIVED)
    await listeners.get('GENERATION_STARTED')('normal', {}, false);
    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '打水回营地' });
    listeners.get('GENERATION_ENDED')?.();
    await sb.OKH_APP.syncHistory();
    assert.equal(sb.OKH_APP.world().timeMin, sb.OKH_APP_CONFIG.DAY(1, 18, 10));

    // User clicks Regenerate while chat ends with user message #3 (cleans up previous failed attempt cleanly)
    await listeners.get('GENERATION_STARTED')('regenerate', {}, false);
    assert.equal(sb.OKH_APP.world().timeMin, sb.OKH_APP_CONFIG.DAY(1, 18, 10),
      'must not roll back message #2 when trailing message #3 is user');
    assert.ok(sb.OKH_APP.W.readEnvelope().history.some(h => h.chatIndex === 2));

    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<status_bar><time elapsed="30"/></status_bar>'
    });
    await listeners.get('MESSAGE_RECEIVED')(4);
    assert.equal(injectLog.at(-1), '');
    assert.equal(sb.OKH_APP.world().timeMin, sb.OKH_APP_CONFIG.DAY(1, 18, 40));
  } finally {
    await sb.OKH_APP.stop();
  }
});

test('streaming GENERATION_ENDED before MESSAGE_RECEIVED must still acknowledge delivered event', async () => {
  const { sb, injectLog, listeners } = setupHookHarness('hook-stream-ack-chat');
  sb._ctxObj.event_types.GENERATION_ENDED = 'GENERATION_ENDED';
  await sb.OKH_APP.start();
  try {
    await sb.OKH_APP.onMessage(0);

    // Move past prologue on Day 2, then advance to Day 4 (arrivedDay + 2) so lord_hiring is queued
    await listeners.get('GENERATION_STARTED')('normal', {}, false);
    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '入镇' });
    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<status_bar><time elapsed="1035"/><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>'
    });
    await listeners.get('MESSAGE_RECEIVED')(2);
    assert.equal(sb.OKH_APP.world().flags.arrivedDay, 2);
    assert.equal(sb.OKH_APP.world().bg.queue.find(q => q.definitionId === 'lord_hiring'), undefined);

    await listeners.get('GENERATION_STARTED')('normal', {}, false);
    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '在镇上休整一日' });
    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<status_bar><time elapsed="1440"/></status_bar>'
    });
    await listeners.get('MESSAGE_RECEIVED')(4);

    await listeners.get('GENERATION_STARTED')('normal', {}, false);
    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '次日继续在镇上休整' });
    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<status_bar><time elapsed="1440"/></status_bar>'
    });
    await listeners.get('MESSAGE_RECEIVED')(6);
    const queued = sb.OKH_APP.world().bg.queue.find(q => q.definitionId === 'lord_hiring');
    assert.equal(queued?.status, 'pending');

    // Next turn prepares lord_hiring; ST StreamingProcessor emits GENERATION_ENDED before MESSAGE_RECEIVED
    await listeners.get('GENERATION_STARTED')('normal', {}, false);
    assert.ok(injectLog.at(-1).includes('镇上告示牌贴出领主府的招募文书'));
    const prepId = Object.keys(sb.OKH_APP.world().bg.generations)[0];
    assert.equal(sb.OKH_APP.world().bg.generations[prepId]?.status, 'prepared');

    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '推进剧情' });
    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<status_bar><time elapsed="60"/></status_bar>'
    });
    listeners.get('GENERATION_ENDED')?.();
    await listeners.get('MESSAGE_RECEIVED')(8);

    assert.equal(injectLog.at(-1), '');
    assert.equal(sb.OKH_APP.world().bg.generations[prepId]?.status, 'completed');
    const after = sb.OKH_APP.world().bg.queue.find(q => q.definitionId === 'lord_hiring');
    assert.equal(after?.status, 'delivered');
    assert.equal(after?.generationId, prepId);
    assert.deepEqual(JSON.parse(sb.OKH_APP.W.store.get('okh_gpt.pendingIds')), []);
  } finally {
    await sb.OKH_APP.stop();
  }
});

test('malformed duplicate status_bar in chat degrades safely while step() stays strict', async () => {
  const { sb, injectLog, listeners } = setupHookHarness('hook-malformed-chat');
  await sb.OKH_APP.start();
  await sb.OKH_APP.onMessage(0);

  await assert.rejects(
    () => sb.OKH_APP.step(10, { text: '<status_bar></status_bar><status_bar></status_bar>' }),
    /每轮只能有一个 status_bar/
  );

  await listeners.get('GENERATION_STARTED')('normal', {}, false);
  sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '回营地' });
  sb._ctxObj.chat.push({
    is_user: false, is_system: false, swipe_id: 0,
    mes: '<content>草稿</content><status_bar><time elapsed="30"/><move to="town"/></status_bar>正文</content><status_bar><time elapsed="30"/></status_bar>'
  });
  await listeners.get('MESSAGE_RECEIVED')(2);
  assert.equal(injectLog.at(-1), '', 'prompt injection must clear even on malformed status_bar');
  assert.match(sb.OKH_APP_HOOK.lastReport().diagnostics[0], /状态栏解析失败/);
  assert.equal(sb.OKH_APP.world().playerLocation, 'wilds', 'must not apply ambiguous draft tags');

  // Fix message #2 by editing -> replay succeeds cleanly
  sb._ctxObj.chat[2] = {
    is_user: false, is_system: false, swipe_id: 0,
    mes: '<content>正文</content><status_bar><time elapsed="30"/></status_bar>'
  };
  await listeners.get('MESSAGE_EDITED')(2);
  await sb.OKH_APP.syncHistory();
  assert.equal(sb.OKH_APP.world().timeMin, sb.OKH_APP_CONFIG.DAY(1, 18, 30));
  await sb.OKH_APP.stop();
});

test('envelope.history is bounded by sliding window on commit & migrateSchema while recent rollback still works', async () => {
  const { sb } = setupHookHarness('hook-history-pruning');
  assert.equal(sb.OKH_APP_WORLD.DEFAULT_MAX_HISTORY, 24);
  assert.throws(() => sb.OKH_APP_WORLD.configure({ maxHistory: 0 }), /正整数/);

  await sb.OKH_APP.start();
  await sb.OKH_APP.onMessage(0);

  // 连续推进 30 轮（开局第 0 楼 + 29 轮新回复）
  for (let round = 1; round <= 29; round++) {
    sb._ctxObj.chat.push({ is_user: true, is_system: false, mes: '推进 ' + round });
    const idx = sb._ctxObj.chat.length;
    sb._ctxObj.chat.push({
      is_user: false, is_system: false, swipe_id: 0,
      mes: '<content>第 ' + round + ' 轮</content><status_bar><time elapsed="10"/></status_bar>'
    });
    await sb.OKH_APP.onMessage(idx);
  }

  const s = sb.OKH_APP_WORLD.session();
  let env = sb.OKH_APP_WORLD.readEnvelope(s);
  assert.equal(env.history.length, 24, 'history must be capped at DEFAULT_MAX_HISTORY=24');
  assert.equal(env.history[0].chatIndex, 12, 'oldest 6 checkpoints must be pruned');
  assert.equal(env.history.at(-1).chatIndex, 58, 'latest checkpoint must be preserved');

  // 窗口内（倒数第 2 条 AI 回复）编辑并回滚重放仍可精准恢复（原 elapsed=10 改为 25，净增 +15 分钟）
  const beforeEditMin = sb.OKH_APP.world().timeMin;
  const targetIdx = 56;
  sb._ctxObj.chat[targetIdx] = {
    is_user: false, is_system: false, swipe_id: 1,
    mes: '<content>修订</content><status_bar><time elapsed="25"/></status_bar>'
  };
  await sb.OKH_APP.syncHistory();
  assert.equal(sb.OKH_APP.world().timeMin, beforeEditMin + 15);

  // 验证 migrateSchema 能对历史超标旧档执行裁剪瘦身
  const rawKey = s.key;
  const bloated = JSON.parse(s.driver.get(rawKey));
  while (bloated.history.length < 40) {
    bloated.history.unshift({ ...bloated.history[0], id: 'old:' + bloated.history.length });
  }
  s.driver.set(rawKey, JSON.stringify(bloated));
  const mig = await sb.OKH_APP.migrateSchema();
  assert.equal(mig.migrated, true);
  assert.equal(sb.OKH_APP_WORLD.readEnvelope(s).history.length, 24);

  // 自定义更小的 maxHistory 窗口即时生效
  sb.OKH_APP_WORLD.configure({ maxHistory: 8 });
  const mig2 = await sb.OKH_APP.migrateSchema();
  assert.equal(mig2.migrated, true);
  assert.equal(sb.OKH_APP_WORLD.readEnvelope(s).history.length, 8);

  await sb.OKH_APP.stop();
});

test('completed generations are pruned to 32 while active prepared generations remain untouched', async () => {
  const { sb } = setupHookHarness('hook-gen-pruning');
  const s = sb.OKH_APP_WORLD.session();
  await sb.OKH_APP_WORLD.ensureWorld(false, s);
  const ctrl = sb.OKH_APP_ADAPTER.createController(s);

  // 先建立 1 条待完成的 prepared 记录
  await ctrl.prepareGeneration('gen-active-prepared', 8);

  // 连续完成 38 轮独立生成与确认
  for (let i = 1; i <= 38; i++) {
    const gid = 'gen-done-' + i;
    await ctrl.prepareGeneration(gid, 8);
    const cur = sb.OKH_APP_WORLD.loadWorld(s);
    await ctrl.finishReply({
      id: 'reply-gen-' + i,
      revision: 'rev-' + i,
      toMin: cur.timeMin + 5,
      interactingIds: [],
      front: {}
    }, gid);
  }

  const finalWorld = sb.OKH_APP_WORLD.loadWorld(s);
  const gens = finalWorld.bg.generations;
  const completedKeys = Object.keys(gens).filter(k => gens[k]?.status === 'completed');
  assert.equal(completedKeys.length, 32, 'completed generations capped at 32');
  assert.equal(gens['gen-done-1'], undefined, 'oldest completed generation pruned');
  assert.equal(gens['gen-done-38']?.status, 'completed', 'newest completed generation kept');
  assert.equal(gens['gen-active-prepared']?.status, 'prepared', 'active prepared generation never pruned');
});
