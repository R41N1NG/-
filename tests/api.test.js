const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js'), {Client, endpoint} = require('../src/api.js');
const profile = {base_url: 'https://example.com/v1', model: 'light', max_input_chars: 16000};
const dialogue = [{message_id: '0', role: 'user', text: '请允许我为你插上这朵花。'}, {message_id: '1', role: 'assistant', text: '她欣然应允，你把花轻轻插在她的发间。'}];
function client(result, options = {}) { return new Client(async () => ({ok: true, json: async () => ({choices: [{finish_reason: options.finish || 'stop', message: {content: typeof result === 'string' ? result : JSON.stringify(result)}}], usage: {prompt_tokens: 100, completion_tokens: 50}})})); }
const event = () => ({id: 'flower', description: '玩家送花并被接受', completion_criteria: '花已交给对方', exclusions: ['只提议'], actor_id: 'player', recipient_id: 'woman'});
test('连接地址兼容基础地址与完整 completions 地址', () => {
  assert.equal(endpoint(profile.base_url), 'https://example.com/v1/chat/completions');
  assert.equal(endpoint('https://example.com/v1/chat/completions/'), 'https://example.com/v1/chat/completions');
  assert.throws(() => endpoint('https://key:pass@example.com/v1'), /凭据/);
});
test('自然语言事件证据需原文引用与正确主体，遗漏候选保留不确定', async () => {
  const response = {results: [{event_id: 'flower', status: 'completed', actor_id: 'player', recipient_id: 'woman', evidence: [{message_id: '1', quote: '你把花轻轻插在她的发间'}]}]};
  const api = client(response); const result = await api.detect(profile, dialogue, [event(), {...event(), id: 'second'}], {});
  assert.equal(result[0].status, 'completed'); assert.equal(result[1].status, 'uncertain'); assert.equal(api.usage.input, 100);
  response.results[0].evidence[0].quote = '模型虚构'; assert.equal((await client(response).detect(profile, dialogue, [event()], {}))[0].status, 'uncertain');
  response.results[0].evidence[0].quote = '欣然应允'; response.results[0].actor_id = 'other'; assert.equal((await client(response).detect(profile, dialogue, [event()], {}))[0].status, 'uncertain');
});
test('提出/拒绝保留状态，未知事件 ID、非 JSON 和截断输出被拒绝', async () => {
  for (const status of ['proposed', 'rejected', 'not_occurred']) assert.equal((await client({results: [{event_id: 'flower', status}]}).detect(profile, dialogue, [event()], {}))[0].status, status);
  await assert.rejects(client({results: [{event_id: 'wrong', status: 'completed'}]}).detect(profile, dialogue, [event()], {}), /未知/);
  await assert.rejects(client('invalid').call(profile, []), /JSON/);
  await assert.rejects(client({}, {finish: 'length'}).call(profile, []), /截断/);
});
test('输入超限明确拒绝且未请求 API，不截断后当作全面分析', async () => {
  let calls = 0; const api = new Client(async () => { calls++; });
  await assert.rejects(api.detect({...profile, max_input_chars: 10}, dialogue, [event()], {}), /超过字符预算/); assert.equal(calls, 0);
});
test('取消传到 fetch AbortSignal，失败不泄漏返回正文中的凭据', async () => {
  let started; const ready = new Promise(r => started = r);
  const api = new Client((url, options) => new Promise((resolve, reject) => { options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); started(); }));
  const running = api.call(profile, []); await ready; api.cancel(); await assert.rejects(running, /取消或超时/); assert.equal(api.controllers.size, 0);
  await assert.rejects(new Client(async () => ({ok: false, status: 401, text: async () => 'SECRET'})).call(profile, []), e => e.message.includes('401') && !e.message.includes('SECRET'));
});
test('可选 JSON 模式及非思考参数，只发送局部对话和候选', async () => {
  let body; const api = new Client(async (url, opt) => { body = JSON.parse(opt.body); return {ok: true, json: async () => ({choices: [{message: {content: '{"results":[]}'}}]})}; });
  await api.detect({...profile, json_mode: false, no_thinking: true}, dialogue, [], {});
  assert(!body.response_format); assert.deepEqual(body.chat_template_kwargs, {enable_thinking: false}); assert.equal(body.messages.length, 2); assert.equal(api.usage.unknown, 1);
});
test('模型分段保留原文，节点 ID 由脚本生成，清除模型奖励和代码', async () => {
  const text = '酒店骤然停电。走廊传来声响。';
  const raw = {title: '停电', start_node_id: 'n1', nodes: [{id: 'n1', title: '停电', detail: '酒店骤然停电。', guidance: '描写停电', routes: [{target: 'n2'}], effects: [{collect: '作弊'}]}, {id: 'n2', title: '声响', detail: '走廊传来声响。', guidance: '循声查看', routes: []}]};
  const draft = await client(raw).segment(profile, text);
  assert.equal(draft.project.original_text, text); assert.equal(draft.project.nodes.length, 2); assert.notEqual(draft.project.nodes[0].id, 'n1');
  assert.deepEqual(draft.project.nodes[0].effects, []); assert.equal(draft.project.nodes[0].routes[0].target, draft.project.nodes[1].id); assert.deepEqual(draft.warnings, []);
  raw.nodes[1].detail = '原文不存在的内容'; await assert.rejects(client(raw).segment(profile, text), /连续摘录/);
});
