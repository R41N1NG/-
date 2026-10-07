'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core.js'), {Client, PROMPTS, LEGACY_PROMPTS} = require('../src/api.js'), {Engine} = require('../src/engine.js');
const {fixture, deferred, mockClient, tick} = require('./helpers.js');
const profile = {base_url: 'https://example.com/v1', model: 'mock', max_input_chars: 16000};
const responseClient = value => new Client(async () => ({ok: true, json: async () => ({choices: [{message: {content: JSON.stringify(value)}}]})}));
function user(root, text) { const id = root.messages.length; root.messages.push({message_id: id, role: 'user', message: text}); return id; }
function reply(root, text) { const id = root.messages.length; root.messages.push({message_id: id, role: 'assistant', message: text}); return id; }
async function setup(client = mockClient()) { const f = fixture(), e = new Engine(f.host, client); await e.init(); await e.updateSettings({enabled: true}); return {...f, e}; }
test('快捷选择保留原稿，发送前不切换节点、不领奖，发送后记录并注入同轮剧情', async () => {
  const {e, root} = await setup(); const text = e.stageChoice('N002', '我的原有草稿');
  assert.equal(text, '我的原有草稿\n查看走廊'); assert.equal(e.state.current_node_id, 'N001'); assert.deepEqual(e.state.collected_ids, []);
  assert.equal(e.stageChoice('N003', text), '我的原有草稿\n寻找前台'); e.cancelChoice();
  const id = user(root, e.stageChoice('N002')); await root.eventEmit('message_sent', id);
  assert.equal(e.state.current_node_id, 'N002'); assert.deepEqual(e.state.collected_ids, []);
  assert.equal(e.state.turn_context.user_id, id); assert(e.state.history.at(-1).label.includes('查看走廊')); assert(root.injection[0].content.includes('遗落房卡'));
  const count = e.state.history.length; await root.eventEmit('GENERATION_AFTER_COMMANDS', 'normal'); assert.equal(e.state.history.length, count);
});
test('改写快捷草稿以最终输入为准；生成钩子等待辅助选择，重复钩子不重复请求', async () => {
  const gate = deferred(), started = deferred(), client = mockClient(); let calls = 0;
  client.choose = async () => { calls++; started.resolve(); await gate.promise; return {status: 'selected', target: 'N003'}; };
  const {e, root} = await setup(client); await e.updateSettings({profile}); e.stageChoice('N002');
  const id = user(root, '不去走廊，我先去前台。'), sending = root.eventEmit('message_sent', id); await started.promise;
  let finished = false; const generating = root.eventEmit('GENERATION_AFTER_COMMANDS', 'normal').then(() => finished = true);
  await tick(); assert.equal(finished, false); assert.equal(e.state.current_node_id, 'N001');
  gate.resolve(); await Promise.all([sending, generating]); assert.equal(calls, 1); assert.equal(e.state.current_node_id, 'N003'); assert(root.injection[0].content.includes('登记册'));
});
test('普通聊天和歧义保持当前阶段，不可选目标仍被本地条件拒绝', async () => {
  const client = mockClient(); client.choose = async () => ({status: 'ambiguous'});
  const {e, root} = await setup(client); await e.updateSettings({profile}); await e.prepareTurn(user(root, '如果去那里会怎样？')); assert.equal(e.state.current_node_id, 'N001');
  client.choose = async () => ({status: 'none'}); await e.prepareTurn(user(root, '先聊聊天气。')); assert.equal(e.state.current_node_id, 'N001');
  client.choose = async () => ({status: 'selected', target: 'C'}); await assert.rejects(e.prepareTurn(user(root, '直接追查真相')), /未解锁/);
});
test('选择识别的晚到结果不能污染新聊天或已修改输入', async () => {
  for (const change of ['chat', 'text']) {
    const gate = deferred(), started = deferred(), client = mockClient(); client.choose = async () => { started.resolve(); await gate.promise; return {status: 'selected', target: 'N002'}; };
    const {e, root} = await setup(client); await e.updateSettings({profile}); const id = user(root, '我去走廊看看。'), pending = e.prepareTurn(id); await started.promise;
    if (change === 'chat') { root.chat = 'chat2'; e.bindChat(); } else root.messages[id].message = '我留在大厅。';
    gate.resolve(); await pending; assert.equal(e.state.current_node_id, 'N001'); assert.deepEqual(e.state.collected_ids, []);
  }
});
test('跨轮摘要辅助实际完成，一次写入ID、清掉工作摘要、开放对应出口', async () => {
  const requests = [], client = mockClient(); let calls = 0;
  client.evaluateStage = async (p, dialogue, node, previous) => {
    requests.push({dialogue, previous}); const m = dialogue.at(-1); calls++;
    return {status: calls === 1 ? 'in_progress' : 'completed', summary: calls === 1 ? '已发现房卡，尚未取得。' : '已取得房卡。',
      facts: [{text: m.text, evidence: [{message_id: m.message_id, quote: m.text}]}], missing: calls === 1 ? ['实际取得房卡'] : [], evidence: [{message_id: m.message_id, quote: m.text}]};
  };
  const {e, root} = await setup(client); await e.updateSettings({profile}); await e.editProject(p => p.nodes.find(n => n.id === 'N002').completion_criteria = '实际取得房卡');
  await e.prepareTurn(user(root, e.stageChoice('N002'))); const first = reply(root, '你看见地上的房卡，但还没有拿起。'); await e.checkStage(e.host.pair(first));
  assert.deepEqual(e.state.collected_ids, []); assert.equal(e.state.stage_progress.summary, '已发现房卡，尚未取得。');
  client.choose = async () => ({status: 'none'}); await e.prepareTurn(user(root, '我把房卡拾起来。')); const second = reply(root, '你将房卡放进口袋，确认已经拿到。');
  await Promise.all([e.checkStage(e.host.pair(second)), e.checkStage(e.host.pair(second))]); assert.equal(calls, 2);
  assert.deepEqual(e.state.collected_ids, ['A']); assert(e.state.completed_node_ids.includes('N002')); assert.equal(e.state.stage_progress, null);
  assert.equal(requests[1].previous.summary, '已发现房卡，尚未取得。'); assert.equal(requests[1].dialogue.length, 2);
  await e.checkStage(e.host.pair(second)); assert.equal(calls, 2); await e.prepareTurn(user(root, '返回大厅'));
  assert(e.quickRoutes().some(r => r.target === 'D')); assert(!e.quickRoutes().some(r => r.target === 'C'));
});
test('阶段核验返回前来源改变，不能应用旧完成结果', async () => {
  const gate = deferred(), started = deferred(), client = mockClient(); client.evaluateStage = async () => { started.resolve(); await gate.promise; return {status: 'completed', summary: '获得房卡', facts: [], missing: [], evidence: []}; };
  const {e, root} = await setup(client); await e.updateSettings({profile}); await e.editProject(p => p.nodes.find(n => n.id === 'N002').completion_criteria = '获得房卡');
  await e.prepareTurn(user(root, '查看走廊')); const id = reply(root, '取得房卡'), task = e.checkStage(e.host.pair(id)); await started.promise;
  root.messages[id].message = '没有取得房卡'; gate.resolve(); await task; assert.deepEqual(e.state.collected_ids, []);
});
test('分析保留有原文依据的运行规则，a与a1独立，未知结果不能进入草稿', async () => {
  const text = '取得房卡，结果标记为 a。刷卡成功，结果标记为 a1。只有 a1 才能开门。';
  const raw = {title: '房卡测试', collections: [{id: 'a', title: '已取得房卡', evidence: '取得房卡，结果标记为 a。'}, {id: 'a1', title: '刷卡成功', evidence: '刷卡成功，结果标记为 a1。'}], nodes: [
    {id: 'hall', title: '大厅', detail: text, guidance: '调查房卡', routes: [{target: 'card', label: '调查房卡'}, {target: 'door', label: '开门', condition: {collected: 'a1'}, condition_evidence: '只有 a1 才能开门。'}]},
    {id: 'card', title: '拿卡', detail: '取得房卡，结果标记为 a。', guidance: '发现房卡，让玩家拿取', completion_criteria: '实际取得房卡', completion_evidence: '取得房卡，结果标记为 a。', result_ids: ['a'], routes: [{target: 'hall', label: '回大厅'}]},
    {id: 'door', title: '门', detail: '只有 a1 才能开门。', guidance: '打开门', routes: []}]};
  const p = (await responseClient(raw).analyze(profile, text)).project; assert.deepEqual(p.nodes[1].effects, [{collect: 'a'}]); assert.deepEqual(p.nodes[0].routes[1].condition, {collected: 'a1'});
  const state = C.createProgress(p); state.collected_ids.push('a'); assert.equal(C.condition(p.nodes[0].routes[1].condition, state), false);
  state.collected_ids.push('a1'); assert.equal(C.condition(p.nodes[0].routes[1].condition, state), true);
  raw.nodes[1].result_ids = ['ab']; await assert.rejects(responseClient(raw).analyze(profile, text), /未定义/);
});
test('辅助选择禁止未知目标、超预算；没有有效原文证据的完成降为不确定', async () => {
  const message = {message_id: '2', role: 'user', text: '我去走廊。'}, candidates = [{target: 'hallway', label: '查看走廊'}];
  const api = responseClient({status: 'selected', target: 'hallway', evidence: [{message_id: '2', quote: '我去走廊。'}]}); assert.equal((await api.choose(profile, message, candidates)).target, 'hallway');
  await assert.rejects(api.choose({...profile, max_input_chars: 5}, message, candidates), /预算/); await assert.rejects(responseClient({status: 'selected', target: 'locked'}).choose(profile, message, candidates), /不可选/);
  const node = {id: 'n', title: '走廊', completion_criteria: '取得房卡', completion_exclusions: []};
  const result = await responseClient({status: 'completed', summary: '取得房卡', facts: [{text: '拿到了', evidence: [{message_id: '2', quote: '虚构内容'}]}], evidence: [{message_id: '2', quote: '虚构内容'}]}).evaluateStage(profile, [message], node, null, [], {});
  assert.equal(result.status, 'uncertain'); assert.equal(result.summary, ''); assert.deepEqual(result.facts, []);
});
test('仅迁移旧默认分析提示词，保留用户自定义提示词', async () => {
  const f = fixture(); f.storage.script.branch_story_settings = {profile: {analysis_prompt: LEGACY_PROMPTS.analysis, segment_prompt: '用户自定义'}};
  const e = new Engine(f.host, mockClient()); await e.init(); assert.equal(e.settings.profile.analysis_prompt, PROMPTS.analysis); assert.equal(e.settings.profile.segment_prompt, '用户自定义');
});
test('长文分块沿用已确认结果定义，合并不能擦掉已有解锁条件', async () => {
  const source = '取得房卡，标记a。\n' + '雨声。\n'.repeat(400) + '持有a才能验证。\n' + '雨声。\n'.repeat(400), requests = [];
  const api = new Client(async (url, opt) => {
    const body = JSON.parse(opt.body), input = JSON.parse(body.messages[1].content); requests.push(body);
    const checking = input.original?.includes('持有a才能验证。');
    const value = input.original ? {title: '分块测试', collections: input.original.includes('取得房卡，标记a。') ? [{id: 'a', title: '已取得房卡', evidence: '取得房卡，标记a。'}] : [], nodes: [{id: 'n', title: checking ? '验证' : '调查', detail: input.original, guidance: '当前阶段', routes: checking ? [{target: 'n', label: '验证房卡', condition: {collected: 'a'}, condition_evidence: '持有a才能验证。'}] : []}]} : {title: '全文', nodes: input.nodes.map(n => ({id: n.id, routes: n.routes.map(r => ({target: r.target, label: r.label, condition: true}))}))};
    if (checking) assert(input.known_results.some(r => r.id === 'a'));
    return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify(value)}}]})};
  });
  const result = await api.analyze({...profile, max_input_chars: 2200, analysis_prompt: '分析', analysis_merge_prompt: '合并'}, source);
  assert(result.request_count > 2); assert.equal(result.project.collections.length, 1);
  assert.deepEqual(result.project.nodes.find(n => n.title === '验证').routes[0].condition, {collected: 'a'});
  assert(requests.every(r => r.messages.reduce((n, m) => n + m.content.length, 0) <= 2200));
});
test('自动核验等待生成结束，流式接收不结算，切换已核验回复暂停', async () => {
  const client = mockClient(); let calls = 0;
  client.evaluateStage = async (p, messages) => { calls++; const m = messages.at(-1); return {status: 'in_progress', summary: '发现房卡', facts: [], missing: ['取得房卡'], evidence: [{message_id: m.message_id, quote: m.text}]}; };
  const {e, root} = await setup(client); await e.updateSettings({profile}); await root.eventEmit('message_sent', user(root, '查看走廊')); const id = reply(root, '房卡在地上。');
  await root.eventEmit('message_received', id); await tick(); assert.equal(calls, 0);
  await root.eventEmit('generation_ended'); await tick(); await e.stageJobs; assert.equal(calls, 1); assert.deepEqual(e.state.collected_ids, []);
  await root.eventEmit('message_swiped', id); await tick(); assert.equal(e.state.paused, true); assert.equal(e.state.stage_progress, null);
});
test('只引用玩家意图或仍缺条件的完成结果不会结算', async () => {
  const dialogue = [{message_id: '2', role: 'user', text: '我要拿房卡。'}, {message_id: '3', role: 'assistant', text: '房卡仍在地上。'}], node = {id: 'card', title: '房卡', completion_criteria: '实际取得房卡'};
  const intent = await responseClient({status: 'completed', evidence: [{message_id: '2', quote: '我要拿房卡。'}]}).evaluateStage(profile, dialogue, node, null, [], {});
  assert.equal(intent.status, 'uncertain');
  const missing = await responseClient({status: 'completed', missing: ['实际取得'], evidence: [{message_id: '3', quote: '房卡仍在地上。'}]}).evaluateStage(profile, dialogue, node, null, [], {});
  assert.equal(missing.status, 'uncertain');
});
test('关闭节点自动结算保留完成判定，手动确认仍按本地预设一次写入', async () => {
  const client = mockClient(); client.evaluateStage = async () => ({status: 'completed', summary: '已取得房卡', facts: [], missing: [], evidence: []});
  const {e, root} = await setup(client); await e.updateSettings({profile}); await e.editProject(p => p.nodes.find(n => n.id === 'N002').auto_complete = false);
  await e.prepareTurn(user(root, '查看走廊')); await e.checkStage(e.host.pair(reply(root, '你拿到了房卡。')));
  assert.deepEqual(e.state.collected_ids, []); assert.equal(e.state.stage_progress.status, 'completed'); assert.match(e.flowNotice, /请确认/);
  e.complete(); e.complete(); assert.deepEqual(e.state.collected_ids, ['A']);
});
