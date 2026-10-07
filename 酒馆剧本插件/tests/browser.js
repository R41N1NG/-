'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {fixture} = require('./helpers.js');
const root = path.resolve(__dirname, '..');
const bundle = JSON.parse(fs.readFileSync(path.join(root, 'branch_story_tavern_helper_import.json'))).content;
const requests = [];
const modelRequests = [];
const browserFixture = fixture.toString().replace('host: new Host(root)', 'host: null');
const server = http.createServer(async (req, res) => {
  if (req.url === '/plugin.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle); }
  if (req.url === '/frame') return res.end('<!doctype html><html><body><script src="/plugin.js"></script></body></html>');
  if (req.url === '/v1/models') {
    modelRequests.push(req.url); res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({data: [{id: 'mock-light', name: '3.8f'}, {id: 'mock/story-with-a-long-complete-model-ID-for-mobile'}, {id: 'mock-light'}]}));
  }
  if (req.url === '/bad/v1/chat/completions') {
    res.writeHead(404, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({error: {message: 'The model 3.8f was not found. BROWSER_SECRET', code: 'model_not_found'}}));
  }
  if (req.url === '/v1/chat/completions') {
    let body = ''; for await (const chunk of req) body += chunk;
    const data = JSON.parse(body); requests.push(data);
    let value;
    if (data.messages[0].content.includes('剧本分析')) {
      const input = JSON.parse(data.messages[1].content), parts = input.original.split('\n').filter(Boolean);
      value = {title: '多走向分析剧本', start_node_id: 'a', nodes: parts.map((detail, i) => ({id: ['a', 'b', 'c'][i], title: ['停电线索', '调查结局', '离开结局'][i], kind: i ? 'ending' : 'choice', detail, guidance: i ? '演绎当前走向的结果' : '描写灯光和钟声，先不揭示答案', routes: i ? [] : [{target: 'b', label: '调查钟楼'}, {target: 'c', label: '离开酒店'}]})), analysis: {synopsis: '停电后选择调查或离开', branches: [{title: '调查', node_ids: ['a', 'b']}, {title: '离开', node_ids: ['a', 'c']}], endings: [{node_id: 'b', title: '真相', summary: '找到幕后人'}, {node_id: 'c', title: '脱险', summary: '安全离开'}], foreshadowing: [{title: '钟声', hint: '断电仍有钟声', payoff: '幕后人藏在钟楼', plant_node_ids: ['a'], payoff_node_ids: ['b']}], uncertainties: []}};
    } else if (data.messages[0].content.includes('剧本整理')) {
      const text = JSON.parse(data.messages[1].content).original;
      const parts = text.split('\n').filter(Boolean);
      value = {title: '模型整理草稿', start_node_id: 's1', nodes: parts.map((detail, i) => ({id: 's' + (i + 1), title: '阶段 ' + (i + 1), detail, guidance: '演绎：' + detail, boundary: '', routes: i < parts.length - 1 ? [{target: 's' + (i + 2), label: '继续'}] : []}))};
    } else if (data.messages[0].content.includes('玩家行动分支识别器')) {
      const input = JSON.parse(data.messages[1].content), message = input.dialogue[0];
      const candidate = input.candidates.find(r => message.text.includes(r.action_text || r.label));
      value = candidate ? {status: 'selected', target: candidate.target, evidence: [{message_id: message.message_id, quote: message.text}]} : {status: 'none'};
    } else if (data.messages[0].content.includes('事件核验器')) {
      const input = JSON.parse(data.messages[1].content), source = input.dialogue.at(-1);
      value = {results: input.candidates.map(e => ({event_id: e.id, status: 'completed', actor_id: e.actor_id, recipient_id: e.recipient_id, evidence: [{message_id: source.message_id, quote: source.text}]}))};
    } else value = {ok: true};
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(value)}}], usage: {prompt_tokens: 120, completion_tokens: 60}}));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#eef1f4;font:16px system-ui}main{padding:24px}iframe{display:none}#send_form{position:fixed;bottom:8px;left:12px;right:12px}#chatinput{width:100%;height:44px;box-sizing:border-box}</style></head><body><main><h1>酒馆助手接口测试宿主</h1><p>模拟当前聊天，用于验证脚本 iframe 与手机界面。</p></main><form id="send_form"><input id="chatinput" placeholder="聊天输入"></form><script>const C={clone:v=>JSON.parse(JSON.stringify(v))};const fixture=${browserFixture};window.testHost=fixture();window.TavernHelper=testHost.root;window.testSendInput=async(response)=>{const h=testHost.root;await h.eventEmit('GENERATION_AFTER_COMMANDS','normal',{},false);const field=document.querySelector('#chatinput'),text=field.value;field.value='';field.dispatchEvent(new Event('input',{bubbles:true}));const id=h.messages.length;h.messages.push({message_id:id,role:'user',message:text});await h.eventEmit('message_sent',id);await h.eventEmit('generate_before_combine_prompts','normal');if(response){const aid=h.messages.length;h.messages.push({message_id:aid,role:'assistant',message:response});await h.eventEmit('message_received',aid);await h.eventEmit('generation_ended');}return h.injection;};window.reloadPlugin=()=>{document.querySelector('iframe')?.remove();const f=document.createElement('iframe');f.src='/frame';document.body.appendChild(f);};window.reloadPlugin();</script></body></html>`);
});
async function state(page, fn) { return page.evaluate(fn); }
async function ready(page) { await page.waitForSelector('#bse-panel-host', {state: 'attached'}); await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.__branch_story_startup__?.status === 'ready'); }
async function unlock(page) { await page.locator('.overlay').waitFor({state: 'visible'}); if (await page.locator('[data-action="unlock-ask"]').isVisible()) { await page.locator('[data-action="unlock-ask"]').click(); await page.locator('[data-action="unlock-confirm"]').click(); } }
async function tab(page, key) { await page.locator(`[data-action="tab"][data-tab="${key}"]`).click(); }
async function wait(page, expression) { await page.waitForFunction(expression); }
async function layout(page, label) {
  await page.waitForFunction(() => {
    const panel = document.querySelector('#bse-panel-host').shadowRoot.querySelector('.panel');
    return panel.getBoundingClientRect().height <= visualViewport.height + 1;
  }, null, {timeout: 3000});
  const metrics = await page.evaluate(() => {
    const s = document.querySelector('#bse-panel-host').shadowRoot, panel = s.querySelector('.panel'), main = s.querySelector('main');
    const boxes = [...s.querySelectorAll('button')].filter(el => el.getClientRects().length).map(el => ({text: el.textContent, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height}));
    return {width: innerWidth, panelWidth: panel.getBoundingClientRect().width, panelHeight: panel.getBoundingClientRect().height, viewportHeight: visualViewport.height, overflow: main.scrollWidth - main.clientWidth, small: boxes.filter(b => b.width < 43 || b.height < 43)};
  });
  assert(metrics.panelWidth <= metrics.width + 1, label + ' 面板超出屏幕');
  assert(metrics.panelHeight <= metrics.viewportHeight + 1, label + ' 面板超出可视高度');
  assert(metrics.overflow <= 1, label + ' 内容横向溢出');
  assert.deepEqual(metrics.small, [], label + ' 触控按钮不足 44px');
}
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true, executablePath: process.env.BSE_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox']});
  const errors = [];
  fs.mkdirSync(path.join(root, 'artifacts'), {recursive: true});
  try {
    const desktop = await browser.newContext({viewport: {width: 1366, height: 900}}), page = await desktop.newPage();
    page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
    await page.goto(base); await ready(page); await page.getByRole('button', {name: '打开剧情面板'}).click();
    assert.equal(await page.locator('.run-spoiler-content').getAttribute('inert'), '');
    assert.equal(await page.locator('.run-spoiler-content').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.getByRole('button', {name: '进入分支', exact: true}).count(), 0);
    assert.equal(await state(page, () => getComputedStyle(document.querySelector('#bse-panel-host').shadowRoot.querySelector('.run-spoiler-content')).filter), 'blur(10px)');
    assert(await page.locator('[data-action="toggle-enabled"]').isEnabled()); assert(await page.locator('[data-action="complete"]').isEnabled());
    await page.locator('[data-action="unlock-ask"]').click(); assert((await page.locator('#bse-spoiler-warning').textContent()).includes('尚未解锁的分支'));
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.run-spoiler-content').getAttribute('inert'), ''); assert(await page.locator('.overlay').isVisible());
    await page.screenshot({path: path.join(root, 'artifacts/run-spoiler-locked.png')});
    assert.deepEqual(await state(page, () => testHost.root.scriptButtons.map(b => b.name)), ['其他按钮']);
    await tab(page, 'api'); assert(await page.locator('[name="base_url"]').isEditable());
    await page.locator('[name="base_url"]').fill(base + '/v1'); await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.notify());
    assert.equal(await page.locator('[name="base_url"]').inputValue(), base + '/v1');
    await tab(page, 'nodes');
    assert.equal(await page.locator('#bse-quick-host').isVisible(), false); await page.screenshot({path: path.join(root, 'artifacts/spoiler-locked.png')});
    assert.equal(await page.locator('.node-spoiler-content').getAttribute('inert'), '');
    assert(await page.locator('.node-toolbar [data-action="import"]').isEnabled()); assert(await page.locator('.node-toolbar [data-action="export-project"]').isEnabled());
    assert.equal(await state(page, () => getComputedStyle(document.querySelector('#bse-panel-host').shadowRoot.querySelector('nav')).filter), 'none');
    assert.equal(await state(page, () => getComputedStyle(document.querySelector('#bse-panel-host').shadowRoot.querySelector('.node-toolbar')).filter), 'none');
    await page.locator('[data-action="unlock-ask"]').click(); assert(await page.locator('#bse-spoiler-warning').isVisible());
    await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.notify());
    assert.equal(await state(page, () => document.querySelector('#bse-panel-host').shadowRoot.activeElement.dataset.action), 'unlock-cancel');
    await page.locator('[data-action="unlock-cancel"]').click(); assert.equal(await page.locator('.node-spoiler-content').getAttribute('inert'), '');
    await tab(page, 'events'); assert((await page.locator('.event-guide').textContent()).includes('发生什么 → 更新什么'));
    await page.locator('[data-action="event-example"]').click(); assert((await page.locator('.event-effects-summary').textContent()).includes('好感度 +1'));
    assert((await page.locator('[name="completion_criteria"]').inputValue()).includes('实际交付'));
    await page.locator('[data-action="event-manual"]').click(); await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.variables.affection === 1);
    assert(await page.locator('[data-action="event-manual"]').isDisabled());
    assert.equal(await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.collected_ids.includes('FLOWER_ACCEPTED')), true);
    await page.locator('[data-action="event-records"]').first().click(); assert.equal(await page.locator('[data-tab="records"]').getAttribute('aria-current'), 'page');
    await tab(page, 'nodes'); assert.equal(await page.locator('.node-spoiler-content').getAttribute('inert'), '');
    await unlock(page); assert.equal(await page.locator('.node-spoiler-content').getAttribute('inert'), null);
    await tab(page, 'run');
    assert.equal(await page.locator('.run-spoiler-content').getAttribute('inert'), '');
    await page.locator('[data-action="unlock-ask"]').click(); await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.notify());
    assert.equal(await state(page, () => document.querySelector('#bse-panel-host').shadowRoot.activeElement.dataset.action), 'unlock-cancel');
    await page.locator('[data-action="unlock-cancel"]').click(); assert.equal(await page.locator('.run-spoiler-content').getAttribute('inert'), '');
    await unlock(page); assert.equal(await page.locator('.run-spoiler-content').getAttribute('aria-hidden'), 'false');
    await page.locator('[data-action="spoiler-lock"]').click(); await tab(page, 'nodes'); assert.equal(await page.locator('.node-spoiler-content').getAttribute('inert'), null);
    await tab(page, 'run'); await unlock(page);
    await page.locator('[data-action="toggle-enabled"]').click();
    assert.equal(await state(page, () => testHost.storage.script.branch_story_settings.quick_options), true);
    await page.locator('[data-action="close"]').click(); await page.locator('#bse-quick-host').waitFor({state: 'visible'});
    assert.deepEqual(await page.locator('[data-action="quick-enter"]').allTextContents(), ['查看走廊', '寻找前台']);
    for (const property of ['display', 'visibility']) {
      await state(page, () => { document.querySelector('#send_form').style.display = 'none'; });
      await page.locator('#bse-quick-host').waitFor({state: 'hidden'});
      await page.evaluate(property => { const form = document.querySelector('#send_form'); form.style.display = ''; form.style[property] = property === 'display' ? 'none' : 'hidden'; }, property);
      await page.locator('#bse-quick-host').waitFor({state: 'hidden'});
      await page.evaluate(property => { document.querySelector('#send_form').style[property] = ''; }, property);
      await page.locator('#bse-quick-host').waitFor({state: 'visible'});
    }
    await state(page, () => { const form = document.querySelector('#send_form'); form.replaceWith(form.cloneNode(true)); });
    await page.locator('#bse-quick-host').waitFor({state: 'visible'});
    assert.equal(await page.getByRole('button', {name: '分支剧本面板', exact: true}).count(), 0);
    await page.screenshot({path: path.join(root, 'artifacts/quick-branches.png')});
    await page.getByRole('button', {name: '查看走廊', exact: true}).click(); assert.equal(await page.locator('#chatinput').inputValue(), '查看走廊');
    assert.equal(await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.current_node_id), 'N001');
    await state(page, () => testSendInput('她握住你的手，一起走入黑暗的走廊。')); assert.equal(await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.current_node_id), 'N002');
    await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.undo());
    await page.getByRole('button', {name: '打开剧情面板'}).click(); await tab(page, 'run');
    await page.locator('[data-action="quick-toggle"]').click(); await page.locator('[data-action="close"]').click(); assert.equal(await page.locator('#bse-quick-host').isVisible(), false);
    await state(page, () => reloadPlugin()); await ready(page);
    assert.equal(await page.locator('#bse-quick-host').isVisible(), false); assert.equal(await state(page, () => testHost.storage.script.branch_story_settings.quick_options), false);
    await page.getByRole('button', {name: '打开剧情面板'}).click(); assert.equal(await page.locator('.run-spoiler-content').getAttribute('inert'), '');
    await unlock(page); await page.locator('[data-action="quick-toggle"]').click();
    await page.locator('[data-action="enter"][data-id="N002"]').click(); await page.locator('[data-action="complete"]').click();
    await page.locator('[data-action="enter"][data-id="N001"]').click();
    assert.equal(await page.locator('[data-action="enter"][data-id="D"]').isEnabled(), true);
    assert.equal(await page.locator('[data-action="enter"][data-id="C"]').isEnabled(), false);
    await page.locator('[data-action="enter"][data-id="N003"]').click(); await page.locator('[data-action="complete"]').click(); await page.locator('[data-action="enter"][data-id="N001"]').click();
    assert.equal(await page.locator('[data-action="enter"][data-id="C"]').isEnabled(), true);
    assert.equal(await page.locator('[data-action="enter"][data-id="D"]').isEnabled(), false);
    await layout(page, '桌面运行页');
    await tab(page, 'api'); await page.locator('[name="base_url"]').fill(base); await page.locator('[name="model"]').fill('3.8f'); await page.locator('[name="key"]').fill('BROWSER_SECRET');
    await page.locator('[data-action="api-models"]').click(); await page.locator('[name="model_choice"]').waitFor();
    assert((await page.locator('.api-endpoints').textContent()).includes(base + '/v1/chat/completions'));
    assert.equal(await page.locator('[name="model_choice"] option').count(), 3);
    await page.locator('[name="model_choice"]').selectOption('mock-light'); assert.equal(await page.locator('[name="model"]').inputValue(), 'mock-light');
    await page.locator('[name="segment_model_choice"]').selectOption('mock/story-with-a-long-complete-model-ID-for-mobile');
    assert.equal(await page.locator('[name="segment_model"]').inputValue(), 'mock/story-with-a-long-complete-model-ID-for-mobile');
    assert.equal(requests.length, 0); assert.equal(await state(page, () => testHost.storage.script.branch_story_settings?.profile.key || ''), '');
    await page.locator('[name="base_url"]').fill(base + '/bad/v1'); await page.locator('[name="model"]').fill('3.8f'); await page.locator('[data-action="api-test"]').click();
    await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.error.includes('model_not_found'));
    const apiError = await page.getByRole('alert').textContent(); assert(apiError.includes(base + '/bad/v1/chat/completions')); assert(!apiError.includes('BROWSER_SECRET'));
    assert.equal(await page.locator('[name="model_choice"]').count(), 0); await layout(page, '桌面 API 错误诊断');
    await page.locator('[name="base_url"]').fill(base + '/v1'); await page.locator('[name="model"]').fill('mock-light');
    const customPrompt = '用户自定义：优先核对证据。\n' + await page.locator('[name="detect_prompt"]').inputValue(); await page.locator('[name="detect_prompt"]').fill(customPrompt);
    await page.locator('[data-action="api-test"]').click(); await wait(page, () => testHost.storage.script.branch_story_settings?.profile.model === 'mock-light');
    await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.error === '');
    assert.equal(await state(page, () => testHost.storage.script.branch_story_settings.profile.key), '');
    let releaseModels, receivedModels;
    const heldModels = new Promise(resolve => releaseModels = resolve), startedModels = new Promise(resolve => receivedModels = resolve);
    await page.route(base + '/slow/v1/models', async route => { receivedModels(); await heldModels; await route.fulfill({json: {data: [{id: 'stale-model'}]}}); });
    await page.locator('[name="base_url"]').fill(base + '/slow/v1'); await page.locator('[data-action="api-models"]').click(); await startedModels;
    await page.locator('[name="base_url"]').fill(base + '/v1'); await tab(page, 'run'); releaseModels();
    await wait(page, () => !document.querySelector('iframe').contentWindow.__branch_story_plugin__.panel.modelLoading);
    await tab(page, 'api'); assert.equal(await page.locator('[name="model_choice"]').count(), 0);
    assert.equal(await page.locator('[name="base_url"]').inputValue(), base + '/v1'); assert.equal(await page.locator('[name="model"]').inputValue(), 'mock-light');
    await tab(page, 'run'); await page.locator('[data-action="check"]').click(); await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.pending_checks[0]?.status === 'done');
    await tab(page, 'records'); await page.locator('[data-action="result-accept"]').click(); await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.variables.trust === 5);
    assert(requests.some(r => r.messages[0].content === customPrompt));
    await tab(page, 'data'); await page.locator('[name="book_save"]').fill('既有世界书'); await page.locator('[data-action="book-save"]').click(); await wait(page, () => testHost.books.get('既有世界书').length > 1);
    assert.equal(await state(page, () => testHost.books.get('既有世界书').slice(1).every(row => !row.enabled)), true);
    assert.equal(await state(page, () => testHost.books.get('既有世界书')[0].content), '原有内容');
    const downloadPromise = page.waitForEvent('download'); await page.locator('[data-action="export-project"]').click(); const download = await downloadPromise;
    const exported = fs.readFileSync(await download.path(), 'utf8'); assert(!exported.includes('BROWSER_SECRET')); assert.equal(JSON.parse(exported).type, 'bse_project');
    await page.locator('[name="quick_options"]').check(); await page.locator('[data-action="options-save"]').click(); await page.locator('[data-action="close"]').click();
    await page.locator('#bse-quick-host').waitFor({state: 'visible'});
    assert.equal(await page.locator('[data-action="quick-enter"][data-id="C"]').count(), 1); assert.equal(await page.locator('[data-action="quick-enter"][data-id="D"]').count(), 0);
    assert.equal(await page.locator('[data-action="quick-enter"][data-id="C"]').getAttribute('data-status'), '已解锁');
    const quick = await page.locator('#bse-quick-host').boundingBox(), composer = await page.locator('#send_form').boundingBox(); assert(quick.y + quick.height <= composer.y - 4);
    await page.locator('#chatinput').fill('保留玩家未发送的草稿'); await page.locator('[data-action="quick-enter"][data-id="C"]').click();
    assert.equal(await page.locator('#chatinput').inputValue(), '保留玩家未发送的草稿证据齐全，追查真相'); assert.equal(await state(page, () => testHost.root.messages.length), 4);
    assert.equal(await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.current_node_id), 'N001');
    await state(page, () => testSendInput());
    assert.equal(await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.current_node_id), 'C');
    assert.equal(await page.locator('#bse-quick-host').isVisible(), false);
    await state(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.undo());
    const launch = page.getByRole('button', {name: '打开剧情面板'}), beforeDrag = await launch.boundingBox();
    await page.mouse.move(beforeDrag.x + 24, beforeDrag.y + 24); await page.mouse.down(); await page.mouse.move(beforeDrag.x - 180, beforeDrag.y - 100, {steps: 8}); await page.mouse.up();
    assert.equal(await page.locator('.overlay').isVisible(), false); assert((await launch.boundingBox()).x < beforeDrag.x - 100);
    assert.equal(await state(page, () => typeof testHost.storage.script.branch_story_settings.launcher_position.x), 'number');
    await launch.click();
    assert.equal(await page.locator('#bse-quick-host').isVisible(), false);
    await tab(page, 'run'); await page.screenshot({path: path.join(root, 'artifacts/desktop-panel.png')});
    console.log('✓ 桌面：运行区与节点区独立防剧透、确认/取消/重新隐藏；启用后自动显示输入栏选项，输入栏隐藏/恢复/替换与刷新保留关闭设置；API、事件、分支和进度功能');
    await desktop.close();

    const mobile = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 1}), phone = await mobile.newPage();
    phone.on('pageerror', e => errors.push(e.stack || e.message)); phone.on('dialog', d => d.accept());
    await phone.goto(base); await ready(phone);
    const pencil = phone.getByRole('button', {name: '打开剧情面板'}), firstBox = await pencil.boundingBox(), cdp = await mobile.newCDPSession(phone);
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: firstBox.x + 24, y: firstBox.y + 24}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 80, y: 380}]}); await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    assert.equal(await phone.locator('.overlay').isVisible(), false); assert((await pencil.boundingBox()).x < 120);
    await pencil.tap(); assert.equal(await phone.locator('.run-spoiler-content').getAttribute('inert'), '');
    await unlock(phone); assert.equal(await phone.locator('.run-spoiler-content').getAttribute('inert'), null);
    await phone.locator('[data-action="spoiler-lock"]').tap(); await phone.locator('[data-action="toggle-enabled"]').tap();
    await phone.locator('[data-action="close"]').tap(); await phone.locator('#bse-quick-host').waitFor({state: 'visible'});
    assert.deepEqual(await phone.locator('[data-action="quick-enter"]').allTextContents(), ['查看走廊', '寻找前台']);
    await phone.locator('#chatinput').fill('手机输入草稿'); await phone.locator('[data-action="quick-enter"][data-id="N002"]').tap();
    assert.equal(await phone.locator('#chatinput').inputValue(), '手机输入草稿查看走廊');
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.current_node_id), 'N001');
    await phone.locator('[data-action="quick-cancel"]').tap(); assert.equal(await phone.locator('#chatinput').inputValue(), '手机输入草稿');
    await phone.locator('#chatinput').fill(''); await phone.locator('[data-action="quick-enter"][data-id="N002"]').tap(); await state(phone, () => testSendInput());
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.current_node_id), 'N002');
    await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.undo());
    await pencil.tap(); assert.equal(await phone.locator('.run-spoiler-content').getAttribute('inert'), '');
    await phone.locator('[data-action="pause"]').tap(); await phone.locator('[data-action="close"]').tap(); assert.equal(await phone.locator('#bse-quick-host').isVisible(), false);
    await pencil.tap(); await phone.locator('[data-action="pause"]').tap(); await phone.locator('[data-action="close"]').tap(); await phone.locator('#bse-quick-host').waitFor({state: 'visible'});
    await pencil.tap();
    for (const name of ['run', 'nodes', 'events', 'records', 'api', 'analysis', 'data']) { await tab(phone, name); await layout(phone, '390px ' + name); }
    await tab(phone, 'nodes'); assert.equal(await phone.locator('.node-spoiler-content').getAttribute('inert'), ''); await unlock(phone);
    await phone.locator('[name="title"]').fill('手机编辑 · 停电开场'); await phone.locator('[name="guidance"]').fill('灯光骤灭，保持对玩家行动的开放空间。'); await phone.locator('[data-action="node-save"]').tap();
    await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.nodes[0].title === '手机编辑 · 停电开场');
    await phone.locator('[name="guidance"]').fill('未保存的手机草稿'); await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.notify());
    assert.equal(await phone.locator('[name="guidance"]').inputValue(), '未保存的手机草稿');
    await phone.locator('[data-action="node-save"]').tap();
    await phone.getByText('添加或修改出口', {exact: true}).tap();
    await phone.locator('[name="route_target"]').selectOption('N002'); await phone.locator('[name="route_label"]').fill('手机配置的出口');
    await phone.locator('[name="route_condition"]').fill('{"collected":"A"}'); await phone.locator('[data-action="route-save"]').tap();
    assert.equal(await phone.locator('[name="route_label"]').isVisible(), true);
    await phone.locator('[data-action="node-save"]').tap();
    await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.nodes[0].routes.some(r => r.target === 'N002' && r.label === '手机配置的出口'));
    await phone.setViewportSize({width: 390, height: 430}); await layout(phone, '缩小可视高度'); assert.equal(await phone.locator('[name="guidance"]').inputValue(), '未保存的手机草稿');
    await phone.setViewportSize({width: 320, height: 568});
    for (const name of ['run', 'nodes', 'events', 'records', 'api', 'analysis', 'data']) { await tab(phone, name); await layout(phone, '320px ' + name); }
    await tab(phone, 'nodes'); await phone.locator('[data-action="spoiler-lock"]').tap(); await phone.locator('[data-action="unlock-ask"]').tap();
    await phone.locator('[data-action="unlock-cancel"]').tap(); assert.equal(await phone.locator('.node-spoiler-content').getAttribute('inert'), '');
    await unlock(phone); assert.equal(await phone.locator('.node-spoiler-content').getAttribute('inert'), null);
    await tab(phone, 'events'); await phone.locator('[data-action="event-new"]').tap(); await phone.locator('[name="title"]').fill('手机送花事件'); await phone.locator('[name="description"]').fill('玩家实际送花且对方接受。'); await phone.locator('[data-action="event-save"]').tap();
    await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.events.some(e => e.title === '手机送花事件'));
    await tab(phone, 'api'); await phone.locator('[name="base_url"]').fill(base + '/v1');
    await phone.locator('[data-action="api-models"]').tap(); await phone.locator('[name="model_choice"]').waitFor();
    await phone.locator('[name="model_choice"]').selectOption('mock-light');
    await phone.locator('[name="segment_model_choice"]').selectOption('mock/story-with-a-long-complete-model-ID-for-mobile');
    await layout(phone, '320px 完整模型 ID 下拉框');
    await phone.locator('[data-action="api-save"]').first().tap();
    await tab(phone, 'data'); await phone.locator('[name="original_text"]').fill('酒店骤然停电。\n走廊传来声响。'); await phone.locator('[data-action="segment"]').tap();
    await phone.locator('[name="segment_draft"]').waitFor();
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.id), 'hotel_demo');
    assert.equal(JSON.parse(await phone.locator('[name="segment_draft"]').inputValue()).nodes.length, 2);
    await phone.locator('[data-action="segment-apply"]').tap(); await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title === '模型整理草稿');
    await tab(phone, 'run'); assert.equal(await phone.locator('.run-spoiler-content').getAttribute('inert'), ''); await tab(phone, 'nodes'); assert.equal(await phone.locator('.node-spoiler-content').getAttribute('inert'), '');
    await tab(phone, 'analysis'); await phone.locator('[name="analysis_text"]').fill('灯光熄灭，钟声响起。\n走向一：调查钟楼，找到幕后人。\n走向二：离开酒店，躲过危险。');
    await phone.locator('[data-action="analysis-run"]').tap(); await phone.locator('[name="analysis_draft"]').waitFor();
    const analysis = JSON.parse(await phone.locator('[name="analysis_draft"]').inputValue()); assert.equal(analysis.analysis.endings.length, 2); assert.equal(analysis.analysis.foreshadowing.length, 1);
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title), '模型整理草稿');
    assert.equal(await phone.locator('[data-action="analysis-convert"]').isVisible(), true); await layout(phone, '320px 分析转化入口');
    await phone.locator('[data-action="analysis-convert"]').tap(); await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title === '多走向分析剧本');
    await tab(phone, 'nodes'); assert.equal(await phone.locator('.node-spoiler-content').getAttribute('inert'), ''); assert.equal(await phone.locator('[data-action="import"]').count(), 1);
    const exportPromise = phone.waitForEvent('download'); await phone.locator('[data-action="export-project"]').tap(); const saved = await exportPromise;
    const shared = JSON.parse(fs.readFileSync(await saved.path(), 'utf8')); assert.equal(shared.project.analysis.endings.length, 2);
    shared.project.id = 'roundtrip_story'; await phone.locator('.file').setInputFiles({name: 'shared-story.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(shared))});
    await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.id === 'roundtrip_story'); await unlock(phone);
    await phone.setViewportSize({width: 390, height: 844}); await tab(phone, 'run'); await phone.screenshot({path: path.join(root, 'artifacts/mobile-panel.png')});
    await state(phone, () => reloadPlugin()); await ready(phone); await phone.getByRole('button', {name: '打开剧情面板'}).tap();
    assert.equal(await phone.locator('.run-spoiler-content').getAttribute('inert'), ''); await tab(phone, 'nodes'); assert.equal(await phone.locator('.node-spoiler-content').getAttribute('inert'), '');
    await tab(phone, 'run');
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title), '多走向分析剧本');
    const restoredBox = await phone.getByRole('button', {name: '打开剧情面板'}).boundingBox(); assert(restoredBox.x < 150);
    assert.equal(await phone.locator('#bse-panel-host').count(), 1);
    // Keyboard focus cycles inside the dialog. Physical browser keyboard resize is approximated by viewport resize above.
    await phone.locator('[data-action="close"]').focus(); await phone.keyboard.press('Shift+Tab');
    assert.equal(await state(phone, () => document.querySelector('#bse-panel-host').shadowRoot.activeElement?.getAttribute('data-action')), 'unlock-ask');
    await phone.keyboard.press('Tab'); assert.equal(await state(phone, () => document.querySelector('#bse-panel-host').shadowRoot.activeElement?.getAttribute('data-action')), 'close');
    await phone.keyboard.press('Escape'); assert.equal(await phone.locator('.overlay').isVisible(), false);
    assert.deepEqual(errors, []); assert(requests.length >= 3);
    console.log('✓ 手机：启用后直接选择行动且保留输入草稿，暂停/继续隐藏和恢复选项；运行区防剧透、触控拖动、390px/320px 七页布局、分析与导入导出、刷新和新剧本重新锁定');
    console.log('✓ 浏览器运行错误：0；模拟生成请求：' + requests.length + '；模型列表请求：' + modelRequests.length);
    await mobile.close();
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
