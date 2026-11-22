'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');

// Reuse only the supplied VM setup; do not run or modify the supplied suite.
const originalPath = path.join(__dirname, '奥森德/scripts/test_foundation.cjs');
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
