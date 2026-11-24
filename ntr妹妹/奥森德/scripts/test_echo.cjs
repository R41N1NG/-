'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, 'test_foundation.cjs'), 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', source + '\nmodule.exports={createSandbox};')(require, __dirname, holder);
const { createSandbox } = holder.exports;

test('covert transition registers a private tag until the exact unlock minute', () => {
  const sb = createSandbox();
  const { CFG, HUD } = sb.OKH_APP;
  const config = CFG.buildConfig();
  const seed = CFG.buildInitialWorld();
  seed.timeMin = 1380;
  seed.playerLocation = 'inn';
  Object.assign(seed.flags, { arrived_oakhaven: true, ed_joined: true });
  Object.assign(seed.npcs.gulan, { stage: 1, location: 'inn' });
  Object.assign(seed.npcs.gulan.values, { affection: 45, blood_density: 47 });
  Object.assign(seed.npcs.ed, { monitored: true, location: 'inn' });
  let world = sb.OKHBackground.init(seed, config);
  const step = (id, toMin) => world = sb.OKHBackground.advance(world, { id, revision: id, toMin }, config).state;
  step('trigger', 1380);
  const [echo] = world.playerState.pendingEchoes;
  assert.equal(echo.unlockAt, 4260);
  assert.equal(echo.status, 'latent');
  assert.equal(world.npcs.gulan.stage, 2);
  assert(!world.bg.queue.some(entry => ['gulan_stage_2', echo.eventId].includes(entry.definitionId)));
  const tag = sb.OKH_APP_TAGS.list(world, 'gulan')[0];
  assert.equal(tag.id, 'abnormal_avoid');
  assert.equal(world.npcs.gulan.tags, undefined);
  assert.equal(tag.name, '异样回避');
  assert.equal(tag.desc, '偶尔错开玩家的目光，说话比平时简短，下意识拢紧衣领。');
  assert.doesNotMatch(sb.OKH_APP_ADAPTER.buildLedger(world), /后台人物表现|错开玩家的目光|异样回避/);

  const title = CFG.DELAYED_ECHOES[0].title;
  step('before-unlock', echo.unlockAt - 1);
  assert.equal(world.playerState.pendingEchoes[0].status, 'latent');
  assert.equal(sb.OKH_APP_ECHOES.inspect(world)[0].remainingMin, 1);
  assert(!HUD.buildHudHtml(world).includes(title));
  assert.doesNotMatch(HUD.buildHudHtml(world), /身心异状|异样回避|错开玩家的目光/);
  step('unlock', echo.unlockAt);
  assert.equal(world.playerState.pendingEchoes[0].status, 'ready');
  assert(HUD.buildHudHtml(world).includes(title));
});

test('only a matching unlocked narrative image is collected, and edits and rollback reverse it', async () => {
  const sb = createSandbox();
  const app = sb.OKH_APP;
  const { W } = app;
  await app.init();
  const session = W.session();
  const state = W.loadWorld(session);
  const expectedRevision = state.bg.revision++;
  const def = app.CFG.DELAYED_ECHOES[0];
  const cg = sb.OKH_APP_ALBUM.catalog.find(item => item.id === def.cgId);
  assert(cg);
  const marker = `![${cg.title}](okh-echo:${cg.id})`;
  const receipt = '<status_bar><time elapsed="0"/></status_bar>';
  const rendered = '<content>\n' + marker + '\n</content>' + receipt;
  sb.OKH_APP_TAGS.apply(state, def.npc, [def.tagId]);
  state.playerState.pendingEchoes = [{
    id: def.id, eventId: def.eventId, npc: def.npc,
    occurredAt: 0, unlockAt: state.timeMin + 1, status: 'latent'
  }];
  await W.commit(session, { state, expectedRevision });
  sb.console.table = () => {};
  const saved = sb._vars[session.key];
  const [pending] = app.echoes('gulan');
  assert.equal(pending.occurredAt, 0);
  assert.equal(pending.unlockAt, state.timeMin + 1);
  assert.equal(pending.remainingMin, 1);
  assert.equal(pending.status, 'latent');
  assert.equal(pending.collected, false);
  assert.equal(app.echoes('nise').length, 0);
  assert.equal(sb._vars[session.key], saved);

  const chat = sb._ctxObj.chat;
  const reply = mes => ({ is_user: false, mes });
  const send = (mes = def.triggerCommand) => chat.push({ is_user: true, mes });
  const collect = () => sb.OKH_APP_ALBUM.list(app.world());
  send();
  assert(!(await app.beforeGeneration()).text.includes(marker));
  chat.push(reply(rendered));
  await app.onMessage(1);
  assert.equal(collect().length, 0);
  await app.step(1);

  send('我想问问' + def.title);
  assert(!(await app.beforeGeneration()).text.includes(marker));
  chat.push(reply(receipt));
  await app.onMessage(3);

  send();
  const prompt = (await app.beforeGeneration()).text.split('【回忆模式】')[1];
  assert.match(prompt, /主要篇幅放在梦中/);
  assert.doesNotMatch(prompt, /爱德|异样回避|错开玩家的目光/);
  assert(prompt.includes(marker));
  chat.push(reply('<content>\n```markdown\n' + marker + '\n```\n</content>' + receipt));
  await app.onMessage(5);
  assert.equal(collect().length, 0);
  assert.equal(app.world().playerState.pendingEchoes[0].status, 'ready');

  chat[5].mes = rendered;
  await app.onMessage(5);
  assert.equal(collect()[0].id, cg.id);
  const [viewed] = app.echoes();
  assert.equal(viewed.cgId, cg.id);
  assert.equal(viewed.collected, true);
  assert.equal(viewed.collectedAt, collect()[0].collectedAt);
  assert.equal(viewed.status, 'viewed');
  assert.equal(sb.OKH_APP_TAGS.list(app.world(), 'gulan').length, 0);
  assert.equal(app.world().playerState.pendingEchoes[0].status, 'viewed');
  await app.onMessage(5);
  assert.equal(collect().length, 1);

  chat[5].mes = receipt;
  await app.syncHistory();
  assert.equal(collect().length, 0);
  assert.equal(sb.OKH_APP_TAGS.list(app.world(), 'gulan').length, 1);
  assert.equal(app.world().playerState.pendingEchoes[0].status, 'ready');
  assert.equal(app.echoes()[0].collected, false);

  chat[5].mes = rendered;
  chat.push({ is_user: true, mes: '继续' }, reply(receipt));
  await app.onMessage(7);
  assert.equal(collect().length, 1);
  chat.splice(4);
  await app.syncHistory();
  assert.equal(collect().length, 0);
});

test('tag section migrates legacy saves and checkpoints and exposes read-only debug output', async () => {
  const sb = createSandbox();
  const app = sb.OKH_APP;
  const { W } = app;
  await app.init();
  await app.step(0);
  const key = W.session().key;
  const envelope = JSON.parse(sb._vars[key]);
  assert(envelope.history.length);
  const oldTag = { id: 'abnormal_avoid', name: '旧描述' };
  for (const world of [envelope.world, envelope.history[0].before]) {
    delete world.tags;
    world.npcs.gulan.tags = [oldTag, 'abnormal_avoid'];
    world.npcs.nise.tags = [];
  }
  sb._vars[key] = JSON.stringify(envelope);
  const result = await app.migrateSchema();
  assert(result.migrated);
  const migrated = JSON.parse(sb._vars[key]);
  for (const world of [migrated.world, migrated.history[0].before]) {
    assert.deepEqual(world.tags, { gulan: ['abnormal_avoid'] });
    assert.equal(world.npcs.gulan.tags, undefined);
    assert.equal(world.npcs.nise.tags, undefined);
  }
  assert.equal((await app.migrateSchema()).migrated, false);
  sb.console.table = () => {};
  const [row] = app.tags('gulan');
  assert.equal(row.name, '异样回避');
  assert.equal(row.visibility, 'private');
  assert(row.desc.includes('拢紧衣领'));
  assert.equal(app.tags('constructor').length, 0);
  assert.equal(app.tags().length, 1);
  const world = app.world();
  const before = sb._vars[key];
  assert.throws(() => sb.OKH_APP_TAGS.apply(world, 'gulan', ['unknown']), /未注册/);
  assert.equal(sb._vars[key], before);
});
