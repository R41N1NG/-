const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js'), {Client, endpoint, modelsEndpoint} = require('../src/api.js');
const profile = {base_url: 'https://example.com/v1', model: 'light', max_input_chars: 16000};
const dialogue = [{message_id: '0', role: 'user', text: '请允许我为你插上这朵花。'}, {message_id: '1', role: 'assistant', text: '她欣然应允，你把花轻轻插在她的发间。'}];
function client(result, options = {}) { return new Client(async () => ({ok: true, json: async () => ({choices: [{finish_reason: options.finish || 'stop', message: {content: typeof result === 'string' ? result : JSON.stringify(result)}}], usage: {prompt_tokens: 100, completion_tokens: 50}})})); }
const event = () => ({id: 'flower', description: '玩家送花并被接受', completion_criteria: '花已交给对方', exclusions: ['只提议'], actor_id: 'player', recipient_id: 'woman'});
test('连接地址兼容基础地址与完整 completions 地址', () => {
  assert.equal(endpoint(profile.base_url), 'https://example.com/v1/chat/completions');
  assert.equal(endpoint('https://example.com/v1/chat/completions/'), 'https://example.com/v1/chat/completions');
  assert.equal(endpoint('https://example.com'), 'https://example.com/v1/chat/completions');
  assert.equal(endpoint('https://example.com/'), 'https://example.com/v1/chat/completions');
  assert.equal(endpoint('https://example.com/proxy/openai/'), 'https://example.com/proxy/openai/chat/completions');
  assert.equal(endpoint('https://example.com/chat/completions'), 'https://example.com/chat/completions');
  assert.equal(modelsEndpoint('https://example.com/v1/chat/completions/'), 'https://example.com/v1/models');
  assert.equal(endpoint('https://example.com/v1/models'), 'https://example.com/v1/chat/completions');
  assert.equal(modelsEndpoint('https://example.com/chat/completions'), 'https://example.com/models');
  assert.throws(() => endpoint('https://key:pass@example.com/v1'), /凭据/);
});
test('模型列表使用同一地址及密钥，保留完整 ID 而非显示别名，不调用生成接口', async () => {
  const requests = []; const api = new Client(async (url, options) => {
    requests.push({url, options}); return {ok: true, json: async () => ({data: [{id: 'model/full-ID', name: '3.8f'}, {id: 'model/full-ID'}, {id: 'another'}, {name: 'missing-id'}]})};
  });
  assert.deepEqual(await api.models({...profile, base_url: 'https://example.com/proxy/v1/chat/completions', key: 'MODELS_SECRET'}), ['another', 'model/full-ID']);
  assert.equal(requests.length, 1); assert.equal(requests[0].url, 'https://example.com/proxy/v1/models');
  assert.equal(requests[0].options.method, 'GET'); assert.equal(requests[0].options.headers.Authorization, 'Bearer MODELS_SECRET');
  assert.equal(requests[0].options.body, undefined); assert.equal(api.usage.calls, 0); assert.equal(api.controllers.size, 0);
  await assert.rejects(new Client(async () => ({ok: true, json: async () => ({models: [{name: 'models/gemini'}]})})).models(profile), /OpenAI 兼容/);
  await assert.rejects(new Client(async () => ({ok: true, json: async () => ({data: []})})).models(profile), /列表为空/);
});
test('404 显示服务错误与实际接口，隐藏密钥和 URL 查询参数，不盲目重试', async () => {
  let calls = 0; const key = 'MY_PRIVATE_KEY';
  const api = new Client(async () => { calls++; return {ok: false, status: 404, text: async () => JSON.stringify({error: {message: 'Unknown model full-ID; key ' + key + '; Bearer another-secret; sk-other-private-token', code: 'model_not_found'}})}; });
  await assert.rejects(api.call({...profile, key, base_url: 'https://example.com/proxy/v1?api_key=' + key}, []), error => {
    assert(error.message.includes('model_not_found')); assert(error.message.includes('https://example.com/proxy/v1/chat/completions'));
    assert(error.message.includes('模型：light')); assert(!error.message.includes(key)); assert(!error.message.includes('another-secret'));
    assert(!error.message.includes('sk-other-private-token')); assert(!error.message.includes('?api_key=')); return true;
  });
  assert.equal(calls, 1);
  await assert.rejects(new Client(async () => ({ok: false, status: 404, text: async () => '<!doctype html><html>PRIVATE_ERROR_BODY</html>'})).models(profile), error => error.message.includes('HTML') && error.message.includes('获取模型列表') && !error.message.includes('PRIVATE_ERROR_BODY'));
});
test('模型列表可取消，非 JSON 响应明确报告协议问题', async () => {
  let start; const ready = new Promise(resolve => start = resolve);
  const api = new Client((url, options) => new Promise((resolve, reject) => { start(); options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); }));
  const pending = api.models(profile); await ready; api.cancel(); await assert.rejects(pending, /已取消/); assert.equal(api.controllers.size, 0);
  await assert.rejects(new Client(async () => ({ok: true, json: async () => { throw new SyntaxError('unexpected HTML'); }})).models(profile), /有效 JSON/);
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
  const running = api.call(profile, []); await ready; api.cancel(); await assert.rejects(running, /已取消/); assert.equal(api.controllers.size, 0);
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
test('事件与基础拆分使用用户编辑的系统提示词', async () => {
  const requests = []; const api = new Client(async (url, opt) => {
    const body = JSON.parse(opt.body); requests.push(body);
    const value = requests.length === 1 ? {results: []} : {title: '拆分', nodes: [{id: 'n1', title: '阶段', detail: '停电。', guidance: '停电', routes: []}]};
    return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify(value)}}]})};
  });
  await api.detect({...profile, detect_prompt: '我的事件提示词'}, dialogue, [], {});
  await api.segment({...profile, segment_prompt: '我的拆分提示词'}, '停电。');
  assert.equal(requests[0].messages[0].content, '我的事件提示词'); assert.equal(requests[1].messages[0].content, '我的拆分提示词');
});
const analyzed = () => ({title: '双结局', start_node_id: 'a', nodes: [
  {id: 'a', title: '线索', kind: 'choice', detail: '停电，钟声响起。', guidance: '先描写停电及钟声', routes: [{target: 'b', label: '调查钟楼', condition: {collected: 'fake'}}], effects: [{collect: 'fake'}]},
  {id: 'b', title: '真相', kind: 'ending', detail: '众人找到幕后人。', guidance: '揭示幕后人', routes: []}],
  analysis: {synopsis: '追查停电原因', branches: [{title: '调查路线', node_ids: ['a', 'b']}], endings: [{node_id: 'b', title: '找到幕后人', summary: '真相揭晓'}], foreshadowing: [{title: '钟声', hint: '停电仍有钟声', payoff: '钟声揭示幕后人的计划', plant_node_ids: ['a'], payoff_node_ids: ['b']}], uncertainties: []}});
test('分析保留原文、重映射走向结局伏笔引用，不把未来答案注入主模型', async () => {
  const text = '停电，钟声响起。众人找到幕后人。'; const draft = await client(analyzed()).analyze(profile, text);
  const p = draft.project; assert.equal(p.original_text, text); assert.equal(p.nodes[1].kind, 'ending'); assert.deepEqual(p.nodes[0].effects, []);
  assert.equal(p.analysis.endings[0].node_id, p.nodes[1].id); assert.equal(p.analysis.foreshadowing[0].plant_node_ids[0], p.nodes[0].id);
  assert.equal(p.nodes[0].routes[0].condition, false); assert(draft.warnings.some(x => x.includes('解锁条件')));
  assert(!C.prompt(p, C.createProgress(p)).includes('钟声揭示幕后人的计划')); assert(!C.prompt(p, C.createProgress(p)).includes('众人找到幕后人'));
});
test('忠于原文拒绝虚构摘录和新增节点，补充分支必须显式标为建议', async () => {
  const raw = analyzed(), text = '停电，钟声响起。众人找到幕后人。'; raw.nodes[1].detail = '她凭空消失。';
  await assert.rejects(client(raw).analyze(profile, text), /连续摘录/);
  raw.nodes[1].suggested = true; raw.nodes[1].detail = '';
  await assert.rejects(client(raw).analyze(profile, text), /忠于原文/);
  const draft = await client(raw).analyze(profile, text, '', {mode: 'expand'}); assert.equal(draft.project.nodes[1].suggested, true);
  raw.analysis.foreshadowing[0].payoff_node_ids = ['missing']; await assert.rejects(client(raw).analyze(profile, text, '', {mode: 'expand'}), /未知节点/);
});
test('长文本自动分块后整合，全部请求遵守字符预算且保留跨段伏笔', async () => {
  const requests = []; const api = new Client(async (url, opt) => {
    const body = JSON.parse(opt.body), input = JSON.parse(body.messages[1].content); requests.push(body);
    let value;
    if (input.original !== undefined) value = {title: '片段', nodes: [{id: 'a', title: '阶段', detail: input.original, guidance: '当前片段内容', routes: []}], analysis: {synopsis: '片段概要'}};
    else value = {title: '全剧', start_node_id: input.nodes[0].id, nodes: input.nodes.map((n, i) => ({id: n.id, routes: i < input.nodes.length - 1 ? [{target: input.nodes[i + 1].id, label: '继续调查'}] : []})), analysis: {endings: [{node_id: input.nodes.at(-1).id, title: '结局'}], foreshadowing: [{title: '跨段伏笔', hint: '开头线索', payoff: '末尾回收', plant_node_ids: [input.nodes[0].id], payoff_node_ids: [input.nodes.at(-1).id]}]}};
    return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify(value)}}]})};
  });
  const progress = [], text = '灯光熄灭，调查钟楼的"\\线索"。\n'.repeat(1200);
  const draft = await api.analyze({...profile, max_input_chars: 4000, analysis_prompt: require('../src/api').V141_PROMPTS.analysis, analysis_merge_prompt: '我的跨段合并提示词'}, text, '', {onProgress: p => progress.push(p)});
  assert(requests.length > 2); assert.equal(draft.request_count, requests.length); assert.equal(draft.project.original_text, text);
  assert(requests.every(r => r.messages.reduce((n, m) => n + m.content.length, 0) <= 4000)); assert.equal(requests.at(-1).messages[0].content, '我的跨段合并提示词');
  assert.equal(draft.project.analysis.foreshadowing[0].payoff_node_ids[0], draft.project.nodes.at(-1).id); assert(progress.some(p => p.phase.includes('整合')));
  assert.equal(draft.project.nodes[0].routes[0].target, draft.project.nodes[1].id);
});
test('分析取消后不启动后续分块', async () => {
  let calls = 0; const api = new Client(async (url, opt) => { calls++; const input = JSON.parse(JSON.parse(opt.body).messages[1].content); api.cancel(); return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify({title: '片段', nodes: [{id: 'a', title: '阶段', detail: input.original, guidance: '阶段', routes: []}]})}}]})}; });
  await assert.rejects(api.analyze({...profile, max_input_chars: 4000, analysis_prompt: require('../src/api').V141_PROMPTS.analysis}, '灯光熄灭。'.repeat(3000)), /已取消/); assert.equal(calls, 1);
});
test('跨段整合遗漏原节点时拒绝应用', async () => {
  const api = new Client(async (url, opt) => {
    const input = JSON.parse(JSON.parse(opt.body).messages[1].content);
    const value = input.original === undefined ? {title: '遗漏的整合', nodes: []} : {title: '片段', nodes: [{id: 'a', title: '阶段', detail: input.original, guidance: '保留片段', routes: []}]};
    return {ok: true, json: async () => ({choices: [{message: {content: JSON.stringify(value)}}]})};
  });
  await assert.rejects(api.analyze({...profile, max_input_chars: 4000, analysis_prompt: require('../src/api').V141_PROMPTS.analysis}, '灯光熄灭。'.repeat(3000)), /遗漏或重复/);
});
