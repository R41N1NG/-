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
  const rendered = '<content>\n![梦境余影](okh-echo:' + cg.id + ')\n</content>' + receipt;
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

  send('  查看回忆 : ' + def.title + '  \n请稍微停顿一下。');
  const prompt = (await app.beforeGeneration()).text.split('【回忆模式】')[1];
  assert.match(prompt, /主要篇幅放在梦中/);
  assert.doesNotMatch(prompt, /爱德|异样回避|错开玩家的目光/);
  assert(prompt.includes(marker));
  chat.push(reply('<content>\n```markdown\n' + marker + '\n```\n</content>' + receipt));
  assert.equal((await app.onMessage(5)).echoNeedsRetry, true);
  assert.equal((await app.onMessage(5)).echoNeedsRetry, undefined);
  assert.equal(collect().length, 0);
  assert.equal(app.world().playerState.pendingEchoes[0].status, 'ready');

  chat[5].mes = rendered;
  assert.equal((await app.onMessage(5)).echoNeedsRetry, undefined);
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

test('bundled rendering and runtime accept the same standalone echo images', () => {
  const sb = createSandbox();
  const project = path.resolve(__dirname, '..');
  const card = JSON.parse(fs.readFileSync(path.join(project, '最新角色卡/奥克赫斯.json'), 'utf8'));
  const cgId = sb.OKH_APP.CFG.DELAYED_ECHOES[0].cgId;
  const rule = card.data.extensions.regex_scripts.find(item => item.id === 'okh-display-echo-' + cgId);
  const end = rule.findRegex.lastIndexOf('/');
  const render = text => text.replace(
    new RegExp(rule.findRegex.slice(1, end), rule.findRegex.slice(end + 1)), rule.replaceString
  );
  const preview = fs.readFileSync(path.join(project, '最新角色卡/导入预览.html'), 'utf8');
  const previewSource = preview.slice(preview.indexOf('function display(text){'), preview.indexOf('function renderMessage(index)'));
  const previewDisplay = new Function('previewCard', previewSource + '\nreturn display;')(card);
  const marker = '![图注改写](okh-echo:' + cgId + ')';
  const cases = [
    [true, '<content>\r\n' + marker + '\r\n</content>'],
    [true, '<content>' + marker + '</content>'],
    [true, '~~~js\n// 示例\n~~~\n' + marker],
    [false, '<content>\n````md\n```\n' + marker + '\n````\n</content>'],
    [false, '<content>\n<!--\n' + marker + '\n-->\n</content>'],
    [false, '<STATUS_BAR>\n' + marker + '\n</STATUS_BAR>'],
    [false, '<content>有正文</content>\n' + marker],
    [false, '附带文字 ' + marker],
    [false, '    ' + marker],
    [false, '![](okh-echo:wrong-id)'],
    [false, 'okh-echo:' + cgId]
  ];
  for (const [expected, message] of cases) {
    assert.equal(sb.OKH_APP_ECHOES.hasReplyMarker(message, cgId), expected, message);
    assert.equal(render(message).includes('<img alt="残响插图"'), expected, message);
    assert.equal(previewDisplay(message).includes('<img alt="残响插图"'), expected, message);
  }
});

test('gulan_final_fall_dark settles covertly with dragon_mark_linger tag and unlocks only at finale (bd=100, stage=3)', async () => {
  const sb = createSandbox();
  const app = sb.OKH_APP;
  const { CFG, HUD, W } = app;
  const config = CFG.buildConfig();
  const seed = CFG.buildInitialWorld();
  seed.timeMin = 1380;
  seed.playerLocation = 'wilds';
  Object.assign(seed.flags, { arrived_oakhaven: true, ed_joined: true });
  Object.assign(seed.npcs.gulan, { stage: 2, location: 'inn' });
  Object.assign(seed.npcs.gulan.values, { affection: 80, blood_density: 85 });
  Object.assign(seed.npcs.ed, { monitored: true, location: 'inn' });
  let world = sb.OKHBackground.init(seed, config);
  world = sb.OKHBackground.advance(world, { id: 'fall', revision: 'fall', toMin: 1380 }, config).state;
  assert.equal(world.npcs.gulan.stage, 3);
  assert.equal(world.npcs.gulan.flags.gulan_final_fall_done, true);
  assert(!world.bg.queue.some(entry => ['gulan_stage_3', 'gulan_final_fall_dark'].includes(entry.definitionId)));
  const tag = sb.OKH_APP_TAGS.list(world, 'gulan').find(item => item.id === 'dragon_mark_linger');
  assert(tag);
  assert.equal(tag.name, '龙血臣属');
  const echo = world.playerState.pendingEchoes.find(item => item.id === 'echo_gulan_final_fall');
  assert(echo);
  assert.equal(echo.status, 'latent');
  assert.equal(echo.unlockAt, null);

  world = sb.OKHBackground.advance(world, { id: 'wait-2-days', revision: 'wait-2-days', toMin: 1380 + 2880 }, config).state;
  const def = CFG.DELAYED_ECHOES.find(item => item.id === 'echo_gulan_final_fall');
  assert.equal(world.playerState.pendingEchoes.find(item => item.id === 'echo_gulan_final_fall').status, 'latent');
  assert(!HUD.buildHudHtml(world).includes(def.title));

  world.npcs.gulan.values.blood_density = 100;
  world = sb.OKHBackground.advance(world, { id: 'unlock-final', revision: 'unlock-final', toMin: 1380 + 2900 }, config).state;
  assert.equal(world.playerState.pendingEchoes.find(item => item.id === 'echo_gulan_final_fall').status, 'ready');
  assert(HUD.buildHudHtml(world).includes(def.title));

  await app.init();
  const session = W.session();
  const saved = W.loadWorld(session);
  const expectedRevision = saved.bg.revision++;
  world.bg.revision = saved.bg.revision;
  await W.commit(session, { state: world, expectedRevision });

  const chat = sb._ctxObj.chat;
  chat.push({ is_user: true, mes: def.triggerCommand });
  const gen = await app.beforeGeneration();
  assert(gen.text.includes('【撰写约束】正文中严禁出现任何种族称谓或特殊族群字眼'));
  assert(!gen.text.includes('侏儒'));
  assert(!gen.text.includes('okh-echo:'));

  chat.push({ is_user: false, mes: '<content>回放完成。</content><status_bar><time elapsed="0"/></status_bar>' });
  const report = await app.onMessage(1);
  assert.notEqual(report.echoNeedsRetry, true);
  assert.equal(app.world().playerState.pendingEchoes.find(item => item.id === 'echo_gulan_final_fall').status, 'viewed');
  assert.equal(sb.OKH_APP_TAGS.list(app.world(), 'gulan').length, 0);
});

test('arena mud_fall and fallen settle covertly with tags and unlock after 2 days', async () => {
  const sb = createSandbox();
  const { CFG, HUD } = sb.OKH_APP;
  const config = CFG.buildConfig();
  for (const [stage, aff, echoId, tagId] of [
    [2, 70, 'echo_gulan_arena_fall', 'arena_shame_linger'],
    [3, 50, 'echo_gulan_arena_fallen', 'arena_sated_laziness']
  ]) {
    const seed = CFG.buildInitialWorld();
    seed.timeMin = CFG.DAY(16, 13);
    seed.playerLocation = 'inn';
    Object.assign(seed.flags, { arrived_oakhaven: true, arrivedDay: 1 });
    Object.assign(seed.npcs.gulan, { stage, location: 'training_grounds' });
    seed.npcs.gulan.values.affection = aff;
    let world = sb.OKHBackground.init(seed, config);
    world = sb.OKHBackground.advance(world, { id: 'arena-' + stage, revision: 'arena-' + stage, toMin: seed.timeMin }, config).state;
    assert.equal(world.npcs.gulan.flags.gulan_arena_fall, true);
    assert(!world.bg.queue.some(entry => entry.definitionId?.startsWith('dragon_blood_awakening_')));
    assert.equal(sb.OKH_APP_TAGS.list(world, 'gulan')[0]?.id, tagId);
    const echo = world.playerState.pendingEchoes.find(item => item.id === echoId);
    assert(echo);
    assert.equal(echo.status, 'latent');
    world = sb.OKHBackground.advance(world, { id: 'unlock-' + stage, revision: 'unlock-' + stage, toMin: echo.unlockAt }, config).state;
    assert.equal(world.playerState.pendingEchoes.find(item => item.id === echoId).status, 'ready');
    const def = CFG.DELAYED_ECHOES.find(item => item.id === echoId);
    assert(HUD.buildHudHtml(world).includes(def.title));
  }
});

test('mud stage nightly raid updates mud_nightly_trace tag and dossierRecords, cleared when protected', () => {
  const sb = createSandbox();
  const { CFG } = sb.OKH_APP;
  const config = CFG.buildConfig();
  const seed = CFG.buildInitialWorld();
  seed.timeMin = CFG.DAY(5, 22);
  seed.playerLocation = 'inn';
  seed.flags.arrived_oakhaven = true;
  seed.flags.ed_joined = true;
  seed.flags.lastInnSettledDay = 4;
  Object.assign(seed.npcs.gulan, { stage: 2, location: 'inn', flags: { ed_hypnosis_play_done: true, lastNightSettledDay: 4 } });
  Object.assign(seed.npcs.gulan.values, { affection: 92, blood_density: 50 });
  Object.assign(seed.npcs.ed, { monitored: true, location: 'inn', flags: { lastNightSettledDay: 4 } });
  let world = sb.OKHBackground.init(seed, config);

  // Night 6 unprotected: bloodGain > 0 -> tag mud_nightly_trace + 1 dossier encounter
  world = sb.OKHBackground.advance(world, { id: 'n6', revision: 'n6', toMin: CFG.DAY(6, 8), interactingIds: [], front: {} }, config).state;
  assert(sb.OKH_APP_TAGS.list(world, 'gulan').some(t => t.id === 'mud_nightly_trace'));
  const gulanEncounters = (world.playerState.dossierRecords || []).filter(r => r.npc === 'gulan' && r.type === 'encounter');
  assert.equal(gulanEncounters.length, 1);
  assert.equal(gulanEncounters[0].penetrative, true);
  assert.equal(gulanEncounters[0].internal, true);
  assert(gulanEncounters[0].volumeMl >= 8);

  // Night 7 protected by co-room: bloodGain === 0 -> mud_nightly_trace removed, no new encounter
  world.timeMin = CFG.DAY(6, 22);
  world.flags.playerRoomTarget = 'gulan';
  world = sb.OKHBackground.advance(world, { id: 'n7', revision: 'n7', toMin: CFG.DAY(7, 8), interactingIds: [], front: {} }, config).state;
  assert(!sb.OKH_APP_TAGS.list(world, 'gulan').some(t => t.id === 'mud_nightly_trace'));
  assert.equal((world.playerState.dossierRecords || []).filter(r => r.npc === 'gulan' && r.type === 'encounter').length, 1);
});
