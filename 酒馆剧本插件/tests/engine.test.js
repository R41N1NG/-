const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js'), {Engine} = require('../src/engine.js');
const {fixture, deferred, tick, mockClient} = require('./helpers.js');
async function setup(client) { const f = fixture(); const e = new Engine(f.host, client || mockClient()); await e.init(); await e.updateSettings({enabled: true}); return {...f, e}; }
test('生成回复不直接加分；显式确认后人工接受，只结算一次', async () => {
  const {e} = await setup(); assert.equal(e.state.variables.trust, 0);
  await e.checkLatest(); assert.equal(e.state.variables.trust, 0); assert.equal(e.state.pending_checks.length, 1);
  const key = e.state.pending_checks[0].key; await e.confirmResult(key, 'E_TRUST', true);
  assert.equal(e.state.variables.trust, 5); assert.equal(e.state.pending_checks.length, 0);
  await e.checkLatest(); assert.equal(e.state.variables.trust, 5);
});
test('自动结算多个事件后检查记录正常完成，没有残留 checking 或重复奖励', async () => {
  const {e} = await setup(); e.project.events[0].auto_settle = true;
  e.project.events.push({...C.clone(e.project.events[0]), id: 'E_SECOND'});
  await e.checkLatest(); assert.equal(e.state.variables.trust, 10); assert.deepEqual(e.state.pending_checks, []); assert.equal(e.busy, 0);
  await e.checkLatest(); assert.equal(e.state.variables.trust, 10);
});
test('发出下一条用户消息才自动确认上一条，关闭自动检查不发请求', async () => {
  let calls = 0; const {e, root} = await setup(mockClient(async (...args) => { calls++; return mockClient().detect(...args); }));
  root.messages.push({message_id: 2, role: 'user', message: '继续调查'});
  await e.acceptPrevious(2); assert.equal(calls, 0); await e.updateSettings({auto_detect: true}); await e.acceptPrevious(2);
  assert.equal(calls, 1); assert.equal(e.state.pending_checks.length, 1);
});
test('源回复被替换后晚到的 API 结果不结算', async () => {
  const gate = deferred(), ready = deferred(); const {e, root} = await setup(mockClient(async () => { ready.resolve(); return gate.promise; }));
  e.project.events[0].auto_settle = true; const run = e.checkLatest(); await ready.promise;
  root.messages[1].message = '她拒绝了邀请。'; gate.resolve([{event_id: 'E_TRUST', status: 'completed', evidence: []}]); await run;
  assert.equal(e.state.variables.trust, 0); assert.equal(e.state.pending_checks[0].status, 'error');
});
test('切换聊天或手动改进度后晚到的返回不污染当前会话', async () => {
  for (const action of ['switch', 'manual']) {
    const gate = deferred(), ready = deferred(); const {e, root} = await setup(mockClient(async () => { ready.resolve(); return gate.promise; }));
    e.project.events[0].auto_settle = true; const run = e.checkLatest(); await ready.promise;
    if (action === 'switch') { root.chat = 'chat2'; e.bindChat(); } else e.complete();
    gate.resolve([{event_id: 'E_TRUST', status: 'completed', evidence: []}]); await run; assert.equal(e.state.variables.trust, 0);
  }
});
test('已经结算的消息编辑触发暂停，回退恢复奖励及结算标记', async () => {
  const {e, root} = await setup(); e.project.events[0].auto_settle = true; await e.checkLatest(); assert.equal(e.state.last_settled_message_id, 1);
  root.messages[1].message = '修改'; await root.eventEmit('message_edited', 1); await tick(); assert.equal(e.state.paused, true);
  e.undo(); assert.equal(e.state.variables.trust, 0); assert.equal(e.state.last_settled_message_id, -1); assert.equal(e.state.paused, false);
});
test('预算按批限制，剩余候选明确待查，继续后不重复检查', async () => {
  const seen = []; const {e} = await setup(mockClient(async (p, m, events) => { seen.push(...events.map(e => e.id)); return events.map(e => ({event_id: e.id, status: 'not_occurred', evidence: []})); }));
  e.project.events = Array.from({length: 7}, (_, i) => ({...C.clone(e.project.events[0]), id: 'E' + i}));
  await e.updateSettings({batch_size: 2, max_batches: 2}); await e.checkLatest();
  assert.equal(seen.length, 4); assert.equal(e.state.pending_checks[0].remaining_count, 3); assert.equal(e.state.pending_checks[0].status, 'partial');
  await e.retryCheck(e.state.pending_checks[0].key); assert.equal(seen.length, 7); assert.equal(new Set(seen).size, 7); assert.equal(e.state.pending_checks.length, 0);
});
test('批次失败保留已检查结果，重试只补剩余批次', async () => {
  let calls = 0; const {e} = await setup(mockClient(async (p, m, events) => { calls++; if (calls === 2) throw Error('暂时失败'); return events.map(e => ({event_id: e.id, status: 'not_occurred', evidence: []})); }));
  e.project.events.push({...C.clone(e.project.events[0]), id: 'E2'}); await e.updateSettings({batch_size: 1}); await e.checkLatest();
  assert.equal(e.state.pending_checks[0].checked_ids.length, 1); await e.retryCheck(e.state.pending_checks[0].key); assert.equal(calls, 3);
});
test('人工结算旧证据前再次核对来源；手动每轮事件按同条回复去重', async () => {
  const {e, root} = await setup(); await e.checkLatest(); const key = e.state.pending_checks[0].key;
  root.messages[1].message = '拒绝'; await assert.rejects(e.confirmResult(key, 'E_TRUST', true), /来源消息已变化/);
  await e.manualEvent('E_TRUST'); await e.manualEvent('E_TRUST'); assert.equal(e.state.variables.trust, 5);
});
test('密钥不默认落盘、不进入导出，明确记住后才保存', async () => {
  const {e, storage} = await setup(); await e.updateSettings({profile: {key: 'SECRET', model: 'm'}, remember_key: false});
  assert.equal(e.settings.profile.key, 'SECRET'); assert.equal(storage.script.branch_story_settings.profile.key, '');
  assert(!JSON.stringify(e.exportProject()).includes('SECRET')); assert(!JSON.stringify(e.exportProgress()).includes('SECRET'));
  await e.updateSettings({remember_key: true}); assert.equal(storage.script.branch_story_settings.profile.key, 'SECRET');
});
test('模型整理只生成可编辑草稿，刷新可恢复，显式应用后才换剧本', async () => {
  const client = mockClient(); const draftProject = C.demoProject(); draftProject.id = 'segmented';
  client.segment = async () => ({project: draftProject, warnings: [], source_chars: 4});
  const {e, host} = await setup(client); await e.segment('全文'); assert.equal(e.project.id, 'hotel_demo');
  const refreshed = new Engine(host, mockClient()); await refreshed.init(); assert.equal(refreshed.segmentDraft.project.id, 'segmented');
  await refreshed.applySegment(); assert.equal(refreshed.project.id, 'segmented'); assert.equal(refreshed.segmentDraft, null);
});
test('异步世界书编辑期间切换聊天，不把旧会话进度写进新聊天', async () => {
  const {e, host, root, storage} = await setup(); e.enter('N002'); e.settings.worldbook = '库';
  const gate = deferred(), ready = deferred(); host.saveBook = async () => { ready.resolve(); await gate.promise; };
  const edit = e.editProject(p => { p.title = '编辑'; }); await ready.promise;
  root.chat = 'chat2'; e.bindChat(); gate.resolve(); await assert.rejects(edit, /保存期间聊天或配置已变化/);
  assert.equal(e.state.current_node_id, 'N001'); assert.equal(storage.chats.chat2?.branch_story_engine, undefined);
});
test('快捷分支只列出当前可用及已解锁选项，暂停时隐藏', async () => {
  const {e, storage} = await setup(); assert.deepEqual(e.quickRoutes().map(r => r.target), ['N002', 'N003']);
  assert(e.quickRoutes().every(r => r.status === '可用'));
  e.enter('N002'); e.complete(); e.enter('N001'); assert(e.quickRoutes().some(r => r.target === 'D' && r.status === '已解锁')); assert(!e.quickRoutes().some(r => r.target === 'C'));
  e.enter('N003'); e.complete(); e.enter('N001'); assert(e.quickRoutes().some(r => r.target === 'C')); assert(!e.quickRoutes().some(r => ['D', 'E'].includes(r.target)));
  e.pause(); assert.deepEqual(e.quickRoutes(), []);
  await e.updateSettings({quick_options: true, profile: {detect_prompt: '自定义提示词'}}); assert.equal(storage.script.branch_story_settings.quick_options, true); assert.equal(storage.script.branch_story_settings.profile.detect_prompt, '自定义提示词');
});
test('分析草稿不自动替换剧本，刷新恢复；过期分析结果不污染当前聊天', async () => {
  const client = mockClient(), draftProject = C.demoProject(); draftProject.id = 'analysis_story';
  client.analyze = async () => ({project: draftProject, warnings: [], request_count: 1});
  const {e, host, root} = await setup(client); await e.analyze('原文'); assert.equal(e.project.id, 'hotel_demo');
  const restored = new Engine(host, mockClient()); await restored.init(); assert.equal(restored.analysisDraft.project.id, 'analysis_story');
  const gate = deferred(), ready = deferred(); client.analyze = async () => { ready.resolve(); return gate.promise; };
  const run = e.analyze('新原文'); await ready.promise; root.chat = 'chat2'; e.bindChat(); gate.resolve({project: {...draftProject, id: 'late'}, warnings: []});
  await assert.rejects(run, /配置已变化/); assert.equal(e.analysisDraft.project.id, 'analysis_story'); assert.equal(e.busy, 0);
});
