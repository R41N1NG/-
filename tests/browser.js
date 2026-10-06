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
const browserFixture = fixture.toString().replace('host: new Host(root)', 'host: null');
const server = http.createServer(async (req, res) => {
  if (req.url === '/plugin.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle); }
  if (req.url === '/frame') return res.end('<!doctype html><html><body><script src="/plugin.js"></script></body></html>');
  if (req.url === '/v1/chat/completions') {
    let body = ''; for await (const chunk of req) body += chunk;
    const data = JSON.parse(body); requests.push(data);
    let value;
    if (data.messages[0].content.includes('剧本整理')) {
      const text = JSON.parse(data.messages[1].content).original;
      const parts = text.split('\n').filter(Boolean);
      value = {title: '模型整理草稿', start_node_id: 's1', nodes: parts.map((detail, i) => ({id: 's' + (i + 1), title: '阶段 ' + (i + 1), detail, guidance: '演绎：' + detail, boundary: '', routes: i < parts.length - 1 ? [{target: 's' + (i + 2), label: '继续'}] : []}))};
    } else if (data.messages[0].content.includes('事件核验器')) {
      const input = JSON.parse(data.messages[1].content), source = input.dialogue.at(-1);
      value = {results: input.candidates.map(e => ({event_id: e.id, status: 'completed', actor_id: e.actor_id, recipient_id: e.recipient_id, evidence: [{message_id: source.message_id, quote: source.text}]}))};
    } else value = {ok: true};
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(value)}}], usage: {prompt_tokens: 120, completion_tokens: 60}}));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#eef1f4;font:16px system-ui}main{padding:24px}iframe{display:none}#chatinput{position:fixed;bottom:8px;left:12px;width:70%;height:44px}</style></head><body><main><h1>酒馆助手接口测试宿主</h1><p>模拟当前聊天，用于验证脚本 iframe 与手机界面。</p></main><input id="chatinput" placeholder="聊天输入"><script>const C={clone:v=>JSON.parse(JSON.stringify(v))};const fixture=${browserFixture};window.testHost=fixture();window.TavernHelper=testHost.root;window.reloadPlugin=()=>{document.querySelector('iframe')?.remove();const f=document.createElement('iframe');f.src='/frame';document.body.appendChild(f);};window.reloadPlugin();</script></body></html>`);
});
async function state(page, fn) { return page.evaluate(fn); }
async function ready(page) { await page.waitForSelector('#bse-panel-host', {state: 'attached'}); await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.__branch_story_plugin__?.panel?.shadow); }
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
    await page.locator('[data-action="toggle-enabled"]').click();
    await page.locator('[data-action="enter"][data-id="N002"]').click(); await page.locator('[data-action="complete"]').click();
    await page.locator('[data-action="enter"][data-id="N001"]').click();
    assert.equal(await page.locator('[data-action="enter"][data-id="D"]').isEnabled(), true);
    assert.equal(await page.locator('[data-action="enter"][data-id="C"]').isEnabled(), false);
    await page.locator('[data-action="enter"][data-id="N003"]').click(); await page.locator('[data-action="complete"]').click(); await page.locator('[data-action="enter"][data-id="N001"]').click();
    assert.equal(await page.locator('[data-action="enter"][data-id="C"]').isEnabled(), true);
    assert.equal(await page.locator('[data-action="enter"][data-id="D"]').isEnabled(), false);
    await layout(page, '桌面运行页');
    await tab(page, 'api'); await page.locator('[name="base_url"]').fill(base + '/v1'); await page.locator('[name="model"]').fill('mock-light'); await page.locator('[name="key"]').fill('BROWSER_SECRET');
    await page.locator('[data-action="api-test"]').click(); await wait(page, () => testHost.storage.script.branch_story_settings?.profile.model === 'mock-light');
    assert.equal(await state(page, () => testHost.storage.script.branch_story_settings.profile.key), '');
    await tab(page, 'run'); await page.locator('[data-action="check"]').click(); await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.pending_checks[0]?.status === 'done');
    await tab(page, 'records'); await page.locator('[data-action="result-accept"]').click(); await wait(page, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.variables.trust === 5);
    await tab(page, 'data'); await page.locator('[name="book_save"]').fill('既有世界书'); await page.locator('[data-action="book-save"]').click(); await wait(page, () => testHost.books.get('既有世界书').length > 1);
    assert.equal(await state(page, () => testHost.books.get('既有世界书').slice(1).every(row => !row.enabled)), true);
    assert.equal(await state(page, () => testHost.books.get('既有世界书')[0].content), '原有内容');
    const downloadPromise = page.waitForEvent('download'); await page.locator('[data-action="export-project"]').click(); const download = await downloadPromise;
    const exported = fs.readFileSync(await download.path(), 'utf8'); assert(!exported.includes('BROWSER_SECRET')); assert.equal(JSON.parse(exported).type, 'bse_project');
    await tab(page, 'run'); await page.screenshot({path: path.join(root, 'artifacts/desktop-panel.png')});
    console.log('✓ 桌面：分支条件、辅助接口、人工结算、世界书写入、密钥不导出');
    await desktop.close();

    const mobile = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 1}), phone = await mobile.newPage();
    phone.on('pageerror', e => errors.push(e.message)); phone.on('dialog', d => d.accept());
    await phone.goto(base); await ready(phone); await phone.getByRole('button', {name: '打开剧情面板'}).tap();
    for (const name of ['run', 'nodes', 'events', 'records', 'api', 'data']) { await tab(phone, name); await layout(phone, '390px ' + name); }
    await tab(phone, 'nodes'); await phone.locator('[name="title"]').fill('手机编辑 · 停电开场'); await phone.locator('[name="guidance"]').fill('灯光骤灭，保持对玩家行动的开放空间。'); await phone.locator('[data-action="node-save"]').tap();
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
    for (const name of ['run', 'nodes', 'events', 'records', 'api', 'data']) { await tab(phone, name); await layout(phone, '320px ' + name); }
    await tab(phone, 'events'); await phone.locator('[data-action="event-new"]').tap(); await phone.locator('[name="title"]').fill('手机送花事件'); await phone.locator('[name="description"]').fill('玩家实际送花且对方接受。'); await phone.locator('[data-action="event-save"]').tap();
    await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.events.some(e => e.title === '手机送花事件'));
    await tab(phone, 'api'); await phone.locator('[name="base_url"]').fill(base + '/v1'); await phone.locator('[name="model"]').fill('mock-light'); await phone.locator('[data-action="api-save"]').tap();
    await tab(phone, 'data'); await phone.locator('[name="original_text"]').fill('酒店骤然停电。\n走廊传来声响。'); await phone.locator('[data-action="segment"]').tap();
    await phone.locator('[name="segment_draft"]').waitFor();
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.id), 'hotel_demo');
    assert.equal(JSON.parse(await phone.locator('[name="segment_draft"]').inputValue()).nodes.length, 2);
    await phone.locator('[data-action="segment-apply"]').tap(); await wait(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title === '模型整理草稿');
    await phone.setViewportSize({width: 390, height: 844}); await tab(phone, 'run'); await phone.screenshot({path: path.join(root, 'artifacts/mobile-panel.png')});
    await state(phone, () => reloadPlugin()); await ready(phone); await phone.getByRole('button', {name: '打开剧情面板'}).tap();
    assert.equal(await state(phone, () => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title), '模型整理草稿');
    assert.equal(await phone.locator('#bse-panel-host').count(), 1);
    // Keyboard focus cycles inside the dialog. Physical browser keyboard resize is approximated by viewport resize above.
    await phone.locator('[data-action="close"]').focus(); await phone.keyboard.press('Shift+Tab');
    assert.equal(await state(phone, () => document.querySelector('#bse-panel-host').shadowRoot.activeElement?.getAttribute('data-action')), 'enter');
    await phone.keyboard.press('Tab'); assert.equal(await state(phone, () => document.querySelector('#bse-panel-host').shadowRoot.activeElement?.getAttribute('data-action')), 'close');
    await phone.keyboard.press('Escape'); assert.equal(await phone.locator('.overlay').isVisible(), false);
    assert.deepEqual(errors, []); assert(requests.length >= 3);
    console.log('✓ 手机：390px/320px 六个页面无横向溢出，按钮 ≥44px，编辑、缩小视口、模型拆分草稿、刷新恢复、焦点与关闭');
    console.log('✓ 浏览器运行错误：0；模拟 API 请求：' + requests.length);
    await mobile.close();
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
