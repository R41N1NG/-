'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require('playwright'), {fixture} = require('./helpers.js');
const root = path.resolve(__dirname, '..'), bundle = JSON.parse(fs.readFileSync(path.join(root, 'branch_story_tavern_helper_import.json'))).content;
const paragraphs = [
  '雨夜，玩家来到第七号库房前厅，可以找房卡或翻交班簿。只有a才可验证房卡；只有a1和b才可复位门锁；只有ab才可取证物袋。',
  '抽屉里有房卡。玩家实际拿到并收好房卡才完成，记为a。仅看见或打算拿不算完成。',
  '交班簿记载复位码4716。玩家实际查阅并记下复位码才完成，记为b。仅看到交班簿不算。',
  '持有a才可验证。房卡实际刷卡验证成功才完成，记为a1。持有房卡不能替代验证。',
  '持有a1和b才可复位。玩家实际输入4716且锁扣已经松开才完成，记为ab。a和b不会自动合成为ab。',
  '持有ab才可取证物袋。玩家实际取出证物袋并交给接应人员才完成。'
];
const story = paragraphs.join('\n'), route = (target, label, condition = true) => ({target, label, action_text: label, condition, condition_evidence: condition === true ? undefined : paragraphs[0]});
const draft = {title: '第七号库房测试', start_node_id: 'hall', collections: ['a', 'b', 'a1', 'ab'].map((id, i) => ({id, title: ['取得房卡', '取得复位码', '房卡验证成功', '门锁复位成功'][i], evidence: paragraphs[i + 1]})), nodes: [
  {id: 'hall', title: '前厅', detail: paragraphs[0], guidance: '雨夜到达前厅，可以调查抽屉与交班簿。', routes: [route('card', '找房卡', {not: {collected: 'a'}}), route('code', '翻交班簿', {not: {collected: 'b'}}), route('verify', '验证房卡', {all: [{collected: 'a'}, {not: {collected: 'a1'}}]}), route('reset', '复位门锁', {all: [{collected: 'a1'}, {collected: 'b'}, {not: {collected: 'ab'}}]}), route('end', '取证物袋', {collected: 'ab'})]},
  ...['card', 'code', 'verify', 'reset', 'end'].map((id, i) => ({id, title: ['房卡', '交班簿', '验卡', '复位', '证物袋'][i], detail: paragraphs[i + 1], guidance: paragraphs[i + 1], completion_criteria: ['实际取得并收好房卡', '实际记下4716', '实际刷卡验证成功', '输入正确码且锁扣已经松开', '取出证物袋并交给接应人员'][i], completion_exclusions: ['仅意图或计划', '被拒绝或失败'], completion_evidence: paragraphs[i + 1], result_ids: i < 4 ? [['a'], ['b'], ['a1'], ['ab']][i] : [], routes: i === 4 ? [] : [route('hall', '返回前厅')]}))
]};
const calls = [], errors = []; let failNextStage = false;
const server = http.createServer(async (req, res) => {
  if (req.url === '/plugin.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle); }
  if (req.url === '/frame') return res.end('<!doctype html><script src="/plugin.js"></script>');
  if (req.url === '/v1/chat/completions') {
    let body = ''; for await (const chunk of req) body += chunk;
    const request = JSON.parse(body), input = JSON.parse(request.messages[1].content), system = request.messages[0].content; calls.push({system, input});
    let value;
    if (system.includes('剧本分析')) value = draft;
    else if (system.includes('玩家行动分支识别器')) {
      const m = input.dialogue[0];
      const candidate = !m.text.includes('如果') && !m.text.includes('不去') && input.candidates.find(r => m.text.includes(r.label) || r.label === '翻交班簿' && m.text.includes('交班簿'));
      value = candidate ? {status: 'selected', target: candidate.target, evidence: [{message_id: m.message_id, quote: m.text}]} : {status: m.text.includes('如果') ? 'ambiguous' : 'none'};
    } else if (system.includes('当前剧情阶段核验器')) {
      if (failNextStage) { failNextStage = false; res.writeHead(503, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({error: {message: '模拟暂时不可用'}})); }
      const m = input.dialogue.at(-1), completion = {房卡: '已收好房卡', 交班簿: '已记下4716', 验卡: '验证成功', 复位: '锁扣已经松开', 证物袋: '交给接应人员'}[input.node.title];
      value = {status: m.text.includes(completion) ? 'completed' : 'in_progress', summary: m.text, facts: [{text: m.text, evidence: [{message_id: m.message_id, quote: m.text}]}], missing: m.text.includes(completion) ? [] : ['实际完成'], evidence: [{message_id: m.message_id, quote: m.text}]};
    } else value = {ok: true};
    res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({choices: [{message: {content: JSON.stringify(value)}}], usage: {prompt_tokens: 100, completion_tokens: 80}}));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#222}iframe{display:none}#send_form{position:fixed;bottom:8px;left:10px;right:10px}textarea{box-sizing:border-box;width:100%;height:55px}</style><form id="send_form"><textarea id="send_textarea"></textarea></form><script>const C={clone:x=>JSON.parse(JSON.stringify(x))};const fixture=${fixture.toString().replace('host: new Host(root)', 'host: null')};window.testHost=fixture();window.TavernHelper=testHost.root;window.sendRound=async(text)=>{const h=testHost.root;await h.eventEmit('GENERATION_AFTER_COMMANDS','normal',{},false);const f=document.querySelector('textarea'),input=f.value;f.value='';f.dispatchEvent(new Event('input',{bubbles:true}));const id=h.messages.length;h.messages.push({message_id:id,role:'user',message:input});await h.eventEmit('message_sent',id);await h.eventEmit('generate_before_combine_prompts','normal');const injected=C.clone(h.injection);const aid=h.messages.length;h.messages.push({message_id:aid,role:'assistant',message:text});await h.eventEmit('message_received',aid);await h.eventEmit('generation_ended',aid);const e=document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine;await new Promise(r=>setTimeout(r,10));await e.stageJobs;return injected;};const f=document.createElement('iframe');f.src='/frame';document.body.appendChild(f);</script>`);
});
const get = page => page.evaluate(() => { const e = document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine; return {project: e.project, state: e.state, error: e.error}; });
async function send(page, response) { return page.evaluate(response => sendRound(response), response); }
async function action(page, target, response) { await page.locator(`[data-action="quick-enter"][data-id="${target}"]`).click(); return send(page, response); }
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true, executablePath: process.env.BSE_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({viewport: mobile ? {width: 390, height: 844} : {width: 1366, height: 900}, isMobile: mobile, hasTouch: mobile}), page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept()); await page.goto(base);
      await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow.__branch_story_startup__?.status === 'ready');
      await page.getByRole('button', {name: '打开剧情面板'}).click(); await page.locator('[data-tab="api"]').click();
      await page.locator('[name="base_url"]').fill(base); await page.locator('[name="model"]').fill('mock'); await page.locator('[data-action="api-save"]').first().click();
      assert(await page.locator('[name="choice_prompt"]').inputValue()); assert(await page.locator('[name="stage_prompt"]').inputValue());
      await page.locator('[data-tab="analysis"]').click(); await page.locator('[name="analysis_text"]').fill(story); await page.locator('[data-action="analysis-run"]').click(); await page.locator('[name="analysis_draft"]').waitFor();
      const extracted = JSON.parse(await page.locator('[name="analysis_draft"]').inputValue()); assert.deepEqual(extracted.collections.map(x => x.id), ['a', 'b', 'a1', 'ab']);
      await page.locator('[data-action="analysis-apply"]').click(); await page.locator('[data-tab="run"]').click(); await page.locator('[data-action="toggle-enabled"]').click(); await page.locator('[data-action="close"]').click();
      const ids = Object.fromEntries((await get(page)).project.nodes.map(n => [n.title, n.id]));
      await page.locator('textarea').fill('我看一眼'); await page.locator(`[data-action="quick-enter"][data-id="${ids.房卡}"]`).click();
      assert.equal(await page.locator('textarea').inputValue(), '我看一眼\n找房卡'); assert.equal((await get(page)).state.current_node_id, ids.前厅);
      await page.locator('[data-action="quick-cancel"]').click(); assert.equal(await page.locator('textarea').inputValue(), '我看一眼');
      await page.locator('textarea').fill(''); const injected = await action(page, ids.房卡, '你看见抽屉里的房卡，但还没有拿起。');
      assert(injected[0].content.includes('抽屉')); assert(!injected[0].content.includes('4716')); assert.deepEqual((await get(page)).state.collected_ids, []);
      const summary = (await get(page)).state.stage_progress.summary; assert(summary.includes('还没有拿起'));
      await page.locator('textarea').fill('我把卡拿出来，收进口袋。'); await send(page, '你已收好房卡，确认它在口袋里。'); assert.deepEqual((await get(page)).state.collected_ids, ['a']);
      assert.equal((await get(page)).state.stage_progress, null); const cardCalls = calls.filter(x => x.input.node?.title === '房卡'); assert(cardCalls.at(-1).input.previous.summary.includes('还没有拿起')); assert.equal(cardCalls.at(-1).input.dialogue.length, 2);
      await action(page, ids.前厅, '你回到前厅。'); assert.equal(await page.locator(`[data-action="quick-enter"][data-id="${ids.验卡}"]`).count(), 1); assert.equal(await page.locator(`[data-action="quick-enter"][data-id="${ids.复位}"]`).count(), 0);
      await page.locator('textarea').fill('我去翻前台交班簿，找复位码。'); const codeInjection = await send(page, '你已记下4716，准备继续调查。'); assert(codeInjection[0].content.includes('交班簿')); assert.deepEqual((await get(page)).state.collected_ids, ['a', 'b']);
      await action(page, ids.前厅, '回到前厅。'); assert.equal(await page.locator(`[data-action="quick-enter"][data-id="${ids.复位}"]`).count(), 0);
      await page.locator('textarea').fill('如果去验证房卡会怎样？'); await send(page, '你尚未验证房卡。'); assert.equal((await get(page)).state.current_node_id, ids.前厅);
      await action(page, ids.验卡, '读卡器显示验证成功。'); assert.deepEqual((await get(page)).state.collected_ids, ['a', 'b', 'a1']);
      await action(page, ids.前厅, '返回前厅。'); assert.equal(await page.locator(`[data-action="quick-enter"][data-id="${ids.复位}"]`).count(), 1); assert.equal(await page.locator(`[data-action="quick-enter"][data-id="${ids.证物袋}"]`).count(), 0);
      failNextStage = true; await action(page, ids.复位, '你输入4716，锁扣已经松开。'); assert.deepEqual((await get(page)).state.collected_ids, ['a', 'b', 'a1']); assert((await get(page)).error.includes('阶段核验失败'));
      await page.getByRole('button', {name: '打开剧情面板'}).click(); await page.locator('[data-tab="run"]').click(); await page.locator('[data-action="stage-check"]').click();
      await page.waitForFunction(() => document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.state.collected_ids.includes('ab')); await page.locator('[data-action="close"]').click();
      await action(page, ids.前厅, '返回前厅。'); assert.equal(await page.locator(`[data-action="quick-enter"][data-id="${ids.证物袋}"]`).count(), 1); await action(page, ids.证物袋, '你取出证物袋并交给接应人员。');
      assert((await get(page)).state.completed_node_ids.includes(ids.证物袋)); assert.equal(await page.locator('#bse-quick-host').isVisible(), false);
      assert.equal((await get(page)).state.collected_ids.filter(x => x === 'ab').length, 1);
      fs.mkdirSync(path.join(root, 'artifacts'), {recursive: true}); await page.getByRole('button', {name: '打开剧情面板'}).click(); await page.locator('[data-tab="records"]').click(); await page.screenshot({path: path.join(root, 'artifacts', mobile ? 'workflow-mobile.png' : 'workflow-desktop.png')});
      console.log('✓ ' + (mobile ? '手机' : '桌面') + '：原文分析→快捷填入/撤销→自由输入→同轮注入→跨轮摘要→a/b/a1/ab条件→失败重试→终点完成'); await context.close();
    }
    assert.deepEqual(errors, []); console.log('✓ 完整行动流程浏览器错误：0；全部使用模拟辅助 API');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
