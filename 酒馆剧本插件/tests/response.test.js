'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {Client} = require('../src/api.js'), {Engine} = require('../src/engine.js');
const {deferred, fixture} = require('./helpers.js');
const profile = {base_url: 'https://example.com/v1', model: 'mock', timeout_sec: 45, max_input_chars: 16000};
const source = '大厅灯灭了。', raw = {title: '夜间调查', nodes: [{id: 'hall', title: '大厅', detail: source, guidance: '描写灯光熄灭', routes: []}]};
const response = value => ({ok: true, json: async () => ({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(value)}}]})});
test('大分析回复超过快速请求45秒仍能接收，整理和整合使用独立超时', async t => {
  t.mock.timers.enable({apis: ['setTimeout']}); let signal;
  const api = new Client((url, options) => new Promise(resolve => { signal = options.signal; setTimeout(() => resolve(response(raw)), 50000); }));
  const pending = api.analyze(profile, source); t.mock.timers.tick(45001); assert.equal(signal.aborted, false);
  t.mock.timers.tick(4999); assert.equal((await pending).project.title, '夜间调查'); assert.equal(api.controllers.size, 0);
  const requests = []; api.call = async (p, messages, options) => { requests.push(options); const input = JSON.parse(messages[1].content); return input.original ? {...raw, nodes: [{...raw.nodes[0], detail: input.original}]} : {title: '整合', nodes: input.nodes.map(n => ({id: n.id, routes: []}))}; };
  await api.segment({...profile, analysis_timeout_sec: 720}, source); assert.equal(requests.at(-1).timeout_sec, 720);
  await api.analyze({...profile, analysis_timeout_sec: 900, max_input_chars: 2500, analysis_prompt: '分析', analysis_merge_prompt: '合并'}, source.repeat(800));
  assert(requests.length > 3); assert(requests.slice(1).every(r => r.timeout_sec === 900));
});
test('真实截止触发超时分类，明确等待阶段且不自动重试', async t => {
  t.mock.timers.enable({apis: ['setTimeout']}); let calls = 0;
  const api = new Client((url, opt) => new Promise((resolve, reject) => { calls++; opt.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); }));
  const pending = assert.rejects(api.call({...profile, timeout_sec: 5}, []), error => error.code === 'BSE_API_TIMEOUT' && error.message.includes('5 秒') && error.message.includes('等待服务响应') && !error.message.includes('已取消'));
  t.mock.timers.tick(5000); await pending; assert.equal(calls, 1); assert.equal(api.controllers.size, 0);
});
test('读取正文时超时不冒充JSON错误；主动取消有独立原因且隐藏密钥', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  for (const cancel of [false, true]) {
    const started = deferred(); const api = new Client(async (url, opt) => ({ok: true, json: () => new Promise((resolve, reject) => { started.resolve(); opt.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); })}));
    const pending = assert.rejects(api.call({...profile, timeout_sec: 5, key: 'TEST_PRIVATE_KEY'}, []), error => cancel ? error.code === 'BSE_API_CANCELLED' && error.message.includes('用户取消了分析') && !error.message.includes('TEST_PRIVATE_KEY') : error.code === 'BSE_API_TIMEOUT' && error.message.includes('读取完整回复') && !error.message.includes('无效 JSON'));
    await started.promise; if (cancel) api.cancel('用户取消了分析 TEST_PRIVATE_KEY'); else t.mock.timers.tick(5000); await pending;
  }
});
test('取消后晚到的模型列表不能当作正常响应返回', async () => {
  const gate = deferred(), api = new Client(() => gate.promise); const pending = api.models(profile);
  api.cancel('聊天已切换'); gate.resolve({ok: true, json: async () => ({data: [{id: 'stale'}]})});
  await assert.rejects(pending, error => error.code === 'BSE_API_CANCELLED' && error.message.includes('聊天已切换'));
});
test('导入后台原始或完整响应只生成校验后的草稿，不重复调用API', () => {
  const api = new Client(() => { throw new Error('禁止网络请求'); });
  for (const input of [JSON.stringify(raw), '```json\n' + JSON.stringify(raw) + '\n```', JSON.stringify({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(raw)}}]})]) {
    const result = api.restoreAnalysis(source, input); assert.equal(result.project.title, raw.title); assert.equal(result.request_count, 0); assert.equal(result.recovered, true);
  }
  assert.equal(api.usage.calls, 0);
  assert.throws(() => api.restoreAnalysis(source, JSON.stringify({choices: [{finish_reason: 'length', message: {content: JSON.stringify(raw)}}]})), /截断/);
  assert.throws(() => api.restoreAnalysis('别的原文', JSON.stringify(raw)), /连续摘录/);
  assert.throws(() => api.restoreAnalysis(source, '{broken'), /JSON/);
});
test('后台恢复草稿不会替换当前项目，刷新后可继续检查和应用', async () => {
  const f = fixture(), api = new Client(() => { throw new Error('禁止网络请求'); }), e = new Engine(f.host, api); await e.init();
  const current = e.project.id; e.error = '旧超时'; e.restoreAnalysis(source, JSON.stringify(raw));
  assert.equal(e.project.id, current); assert.equal(e.error, ''); assert.equal(f.storage.script.branch_story_settings.analysis_draft.recovered, true);
  const restored = new Engine(f.host, api); await restored.init(); assert.equal(restored.analysisDraft.project.title, raw.title);
  assert.equal(restored.settings.profile.analysis_timeout_sec, 600); assert.equal(restored.settings.profile.timeout_sec, 45);
  restored.busy = 1; assert.throws(() => restored.restoreAnalysis(source, JSON.stringify(raw)), /当前辅助任务/);
});
