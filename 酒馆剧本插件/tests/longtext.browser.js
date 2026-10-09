'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require('playwright'), {fixture} = require('./helpers');
const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, '../branch_story_tavern_helper_import.json'))).content;
const requests = [], errors = [], story = '警觉初始0，范围0到100。实际听见异常增加20，可每轮重复，最多两次。\n' + '调查当前房间，保留现场证据。\n'.repeat(220);
let truncate = false;
const server = http.createServer(async (req, res) => {
 if (req.url === '/plugin.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle); }
 if (req.url === '/frame') return res.end('<!doctype html><script src="/plugin.js"></script>');
 if (req.url === '/v1/chat/completions') {
  let body = ''; for await (const chunk of req) body += chunk; const request = JSON.parse(body), input = request.messages[1] ? JSON.parse(request.messages[1].content) : {}; requests.push(input); let value, finish = 'stop';
  if (input.operation === 'partition') value = {sections: [{end: input.paragraphs.at(-1).id}], complete: true};
  else if (input.original !== undefined) {
   if (!truncate && input.part === 1) { truncate = true; value = '{"nodes":['; finish = 'length'; }
   else { const first = input.part === 1; value = {title: '潜行分析', nodes: [{id: 'n', title: '调查现场', source_span: {from: input.source_index[0].id, to: input.source_index.at(-1).id}, guidance: '调查当前房间', context_variables: ['alert'], routes: []}], ...(first ? {variables: [{id: 'alert', title: '警觉', type: 'number', default: 0, min: 0, max: 100, evidence: '警觉初始0，范围0到100。', bounds_evidence: '警觉初始0，范围0到100。'}], events: [{id: 'noise', title: '异常声响', description: '实际听见异常', completion_criteria: '实际听见异常', evidence: '实际听见异常增加20，可每轮重复，最多两次。', repeat_policy: 'once_per_accepted_turn', repeat_evidence: '可每轮重复', max_occurrences: 2, max_occurrences_evidence: '最多两次', numeric_effects: [{operation: 'add', variable: 'alert', value: 20, evidence: '实际听见异常增加20'}]}]} : {}), analysis: {synopsis: '任务调查'}}; }
  } else if (input.nodes) value = {title: '潜行任务', nodes: input.nodes.map(n => ({id: n.id, routes: []}))};
  else value = {results: []};
  res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({choices: [{finish_reason: finish, message: {content: typeof value === 'string' ? value : JSON.stringify(value)}}]}));
 }
 res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#222}iframe{display:none}#send_form{position:fixed;bottom:0;width:100%}textarea{width:100%;height:50px}</style><form id="send_form"><textarea id="send_textarea"></textarea></form><script>const C={clone:x=>JSON.parse(JSON.stringify(x))};const fixture=${fixture.toString().replace('host: new Host(root)', 'host: null')};window.testHost=fixture();testHost.storage.script.branch_story_settings={runtime_mode:'legacy',profile:{author_review:false}};window.TavernHelper=testHost.root;const f=document.createElement('iframe');f.src='/frame';document.body.appendChild(f);</script>`);
});
const evaluate = (page, fn, arg) => page.evaluate(({source,arg}) => new Function('e','panel','arg','return ('+source+')(e,panel,arg)')(document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine,document.querySelector('iframe').contentWindow.__branch_story_plugin__.panel,arg), {source: fn.toString(),arg});
const tab = (page,name) => page.locator(`nav [data-tab="${name}"]`).click();
async function run() {
 await new Promise(r => server.listen(0,'127.0.0.1',r)); const base = 'http://127.0.0.1:'+server.address().port, browser = await chromium.launch({headless:true,executablePath:process.env.BSE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for (const width of [1366,390,320]) {
   truncate = false; const begin = requests.length, context = await browser.newContext({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700}), page = await context.newPage(); page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept()); await page.goto(base);
   await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__branch_story_plugin__?.engine.chat);
   await evaluate(page,async e=>e.updateSettings({profile:{base_url:location.origin+'/v1',model:'mock',analysis_chunk_chars:1000}})); await page.locator('.launcher').click();
   await tab(page,'analysis'); assert((await page.locator('main').innerText()).includes('2000～4000'));
   await page.locator('[name="analysis_text"]').fill(story); assert((await page.locator('[data-analysis-count]').innerText()).includes(story.length.toLocaleString()));
   await page.locator('[data-action="analysis-settings"]').click(); assert.equal(await page.locator('[name="max_input_chars"]').inputValue(),'64000'); assert.equal(await page.locator('[name="analysis_output"]').inputValue(),'16384'); assert(await page.locator('[name="auto_partition"]').isChecked());
   await page.locator('[data-prompt="partition_prompt"] > summary').click(); await page.locator('[name="partition_prompt"]').fill('分段规划，按提供paragraphs返回sections及complete。'); await page.locator('[data-action="api-save"]').first().click();
   await tab(page,'analysis'); assert.equal(await page.locator('[name="analysis_text"]').inputValue(),story);
   await page.locator('[data-action="analysis-run"]').click(); await page.waitForFunction(()=>Boolean(document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.analysisDraft));
   assert.equal(await evaluate(page,e=>e.error),''); const sent = requests.slice(begin); assert.equal(sent[0].operation,'partition'); assert(sent.at(-1).nodes); assert(sent.filter(x=>x.original!==undefined).every(x=>x.source_index?.length)); assert(await evaluate(page,e=>e.analysisDraft.project.nodes.every(n=>e.analysisDraft.project.original_text.includes(n.detail)))); assert(await page.locator('[data-action="analysis-convert"]').isVisible());
   assert(await evaluate(page,e=>e.rawAnalysis.replies.some(r=>r.finish_reason==='length')));
   await page.locator('[data-action="analysis-convert"]').click(); await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title==='潜行任务');
   const count = requests.length; await evaluate(page,e=>e.manualEvent('noise','m1',{assistant_id:11})); assert.equal(await evaluate(page,e=>e.state.variables.alert),20); await evaluate(page,e=>e.manualEvent('noise','m2',{assistant_id:13})); assert.equal(await evaluate(page,e=>e.state.variables.alert),40); await evaluate(page,e=>e.manualEvent('noise','m3',{assistant_id:15})); assert.equal(await evaluate(page,e=>e.state.variables.alert),40); assert.equal(requests.length,count);
   await tab(page,'data'); assert.equal(await page.locator('.basic-segment').evaluate(el=>el.open),false); await page.locator('.section-nav button').filter({hasText:'数值载体'}).click(); assert((await page.locator('.values-card').innerText()).includes('40'));
   await page.locator('.section-nav button').filter({hasText:'快速整理'}).click(); assert(await page.locator('[name="original_text"]').isVisible());
   for (const name of ['data','api','analysis','records']) { await tab(page,name); assert(await page.locator('.section-nav').isVisible()); const overflow = await page.locator('main').evaluate(el=>el.scrollWidth-el.clientWidth); assert(overflow<=2, name+':'+overflow); }
   await tab(page,'analysis'); await page.locator('.section-nav button').filter({hasText:'恢复后台结果'}).click(); assert(await page.locator('[name="analysis_response"]').isVisible());
   await page.screenshot({path:'/tmp/v143-longtext-'+width+'.png'}); await context.close(); console.log(width+'px：规划→截断缩段→来源编号还原→整合→数值转化/限次/本地结算，固定导航/恢复入口/草稿保留通过');
  }
  assert.deepEqual(errors,[]);
 } finally {await browser.close();await new Promise(r=>server.close(r));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
