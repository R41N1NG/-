'use strict';
// 身份：gpt。执行上传的完整模板、门控及面板函数；不运行Windows取证脚本，不修改生产。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const upstream = process.argv[2];
if (!upstream) throw new Error('用法：node 技术件独立复算.cjs <ST-Prompt-Template源码目录>');
const root = path.resolve(__dirname, '../../下级更新/2026-10-08-17-阶段驱动与派发技术件');
const hashes = {};
function read(rel) {
  const s = fs.readFileSync(path.join(root, rel), 'utf8');
  hashes[rel] = crypto.createHash('sha256').update(s).digest('hex');
  return s;
}
const ejs = require(path.join(upstream, 'src/3rdparty/ejs.js'));
const template = read('材料/17a_id7原样正文.txt');
assert.equal(hashes['材料/17a_id7原样正文.txt'], '88caa54054895d251dea68c446804010fa4e59a690aa66fed28fb73f81b462d6');
const snapshot = JSON.parse(read('材料/P01_chat.json')).variables原始.stat_data;
const renderReport = JSON.parse(read('材料/17e_渲染矩阵与全卡入口扫描.json'));
const fixtureSource = read('源码/P03_render.mjs');
const start = fixtureSource.indexOf('const V = ');
const end = fixtureSource.indexOf('\nconst matrix = ', start);
assert.ok(start >= 0 && end > start);
// 只复用已检查的14格fixture构造，不运行文件读取/扫描/写入主程序。
const baseKnown = Object.fromEntries(Object.keys(snapshot.known).map(k => [k, false]));
const cases = new Function('SNAP', 'knownBase', fixtureSource.slice(start, end) + '\nreturn cases;')(snapshot, baseKnown);
assert.equal(cases.length, 14);
const nativeRender = ejs.compile(template, { client: true });
const stageResults = cases.map(([name, variables], i) => {
  const out = nativeRender({ variables });
  const stages = [...out.matchAll(/##\s*阶段([一二三四])\s*·\s*([^\n]*)/g)].map(m => m[1] + '·' + m[2].trim());
  const wars = [...out.matchAll(/[^\n]{0,40}(?:兽潮|围城|城破|城陷|兵临城下|血战|断界崖|防线溃|溃缩)[^\n]{0,40}/g)];
  assert.deepEqual(stages, renderReport.id7渲染矩阵[i].渲染出的阶段块);
  // 原P03拼接WAR_RE时没有包住整个alternation，计数不代表句数；只对比有/无，不照抄计数。
  const reportedWarCount = renderReport.id7渲染矩阵[i].输出中的战争词句.length;
  assert.equal(wars.length > 0, reportedWarCount > 0);
  return { name, stages, war_fragments: wars.length, reported_pattern_hits: reportedWarCount,
    output_sha256: crypto.createHash('sha256').update(out).digest('hex') };
});
assert.equal(stageResults[0].war_fragments, 0);
assert.ok(stageResults[1].war_fragments > 0);
assert.ok(stageResults[12].war_fragments > 0);
assert.equal(nativeRender({ variables: cases[5][1] }), nativeRender({ variables: cases[6][1] }));
assert.equal(nativeRender({ variables: cases[7][1] }), nativeRender({ variables: cases[8][1] }));
const gates = JSON.parse(read('材料/17l_全卡闸门首行.json'));
const worldinfo = fs.readFileSync(path.join(upstream, 'src/function/worldinfo.ts'), 'utf8');
const at = worldinfo.indexOf('async isConditionFiltedEntry(');
const bodyStart = worldinfo.indexOf("const condition = this.decorators.indexOf('@@if');", at);
const bodyEnd = worldinfo.indexOf('\n    }', bodyStart);
assert.ok(at >= 0 && bodyStart > at && bodyEnd > bodyStart);
const body = worldinfo.slice(bodyStart, bodyEnd);
assert.ok(body.includes('!!(${this.arguments[condition]})'));
const handler = async (text, env, where, options) => {
  try { return await ejs.compile(text, { async: true, client: true, ...options.options })(env); }
  catch { return null; }
};
const conditionMethod = new Function('evalTemplateHandler', 'settings', 'return async function(env, options = {}) {' + body + '\n};')(handler, { cache_enabled: 0 });
const gateFixtures = [
  ['实际快照', snapshot],
  ['三月高段位_大劫真', { 身份: '赵无忧', 仙盟历: 1578.03, 段位: 11, known: { 南域大劫: true } }],
  ['八月高段位_大劫真', { 身份: '赵无忧', 仙盟历: 1578.08, 段位: 11, known: { 南域大劫: true } }],
  ['三月段4_大劫未发生', { 身份: '赵无忧', 仙盟历: 1578.03, 段位: 4, known: {} }],
  ['一月阶段7_大劫真', { 身份: '赵无忧', 仙盟历: 1579.01, 段位: 7, known: { 南域大劫: true } }],
];
async function main() {
  const gateRows = gates.条目.filter(r => r.有闸门);
  assert.equal(gateRows.length, 160);
  const gateResults = [];
  for (const [name, stat_data] of gateFixtures) {
    const env = { variables: { stat_data } }, values = {};
    for (const row of gateRows) {
      const raw = new Function('variables', 'return (' + row.闸门参数全文 + ');')(env.variables);
      assert.equal(typeof raw, 'boolean', String(row.卡内id));
      const filtered = await conditionMethod.call({ decorators: ['@@if'], arguments: [row.闸门参数全文], entry: { world: '上传技术件隔离复算', uid: row.卡内id } }, env);
      assert.equal(filtered, !raw);
      values[row.卡内id] = raw;
    }
    gateResults.push({ name, checked: gateRows.length, selected_values: Object.fromEntries([49,53,56,57,58,59,63,64,66].map(id => [id, values[id]])) });
  }
  assert.equal(gateResults[1].selected_values[58], true);
  assert.equal(gateResults[1].selected_values[64], true);
  assert.equal(gateResults[3].selected_values[53], true);
  const codeText = read('材料/17h_派发与面板_代码原文（带行号）.txt');
  const numbered = new Map();
  for (const line of codeText.split('\n')) {
    const m = /^\s*(\d+) \| ?(.*)$/.exec(line);
    if (m) numbered.set(Number(m[1]), m[2]);
  }
  const exactLines = (a, b) => Array.from({ length: b-a+1 }, (_, i) => {
    assert.ok(numbered.has(a+i), '缺少行 ' + (a+i)); return numbered.get(a+i);
  }).join('\n');
  const panel = exactLines(2252,2337);
  // 生产函数体原样；未上传的三个辅助函数明确替身，限于测试控制流，不认证别名/名册。
  const sandbox = { XSD_RELIC_CN: ['', '一', '二', '三', '四'], TAG: 'gpt复算', s0: x => String(x || ''),
    xsdSamePerson: (a,b) => a === b, xsdPlayerNames: () => [], xsdIsCast: x => x === '阎雷子', console: { log() {} } };
  vm.createContext(sandbox); vm.runInContext(panel + '\nthis.panelFn = xsdRelicState;', sandbox);
  const item = { n: '烟霞灵乳', id: 'yanxialingru', c: '', s: '烟霞灵乳', a: 4, lord: '阎雷子', hall: '' };
  const k = { 烟霞灵乳二阶段: true };
  const panelCases = [
    ['空c_二阶段真_默认赵无忧', item, k, '赵无忧', {}],
    ['补c_lord_默认赵无忧', { ...item, c: '烟霞灵乳二阶段' }, k, '赵无忧', {}],
    ['显式NPC归属_赵无忧', item, k, '赵无忧', { 烟霞灵乳: '阎雷子' }],
    ['显式NPC归属_自设_NPC辅助名册认可', item, k, '自设', { 烟霞灵乳: '阎雷子' }],
    ['未成形_显式NPC归属', item, {}, '赵无忧', { 烟霞灵乳: '阎雷子' }],
  ];
  const panelResults = panelCases.map(([name,...args]) => ({ name, result: sandbox.panelFn(...args) }));
  assert.equal(panelResults[0].result.state, 'self');
  assert.equal(panelResults[0].result.arcs, 2);
  assert.equal(panelResults[1].result.state, 'self');
  assert.equal(panelResults[2].result.state, 'other');
  assert.equal(panelResults[3].result.state, 'other');
  assert.equal(panelResults[4].result.state, 'none');
  const mapData = JSON.parse(read('材料/17n_卡内id与酒馆uid映射.json'));
  assert.equal(mapData.映射.length, 241);
  assert.equal(new Set(mapData.映射.map(r => r.卡内id)).size, 241);
  for (const row of mapData.映射) assert.equal(row.卡内id, row.酒馆uid);
  const changedEnabled = mapData.映射.filter(r => r.卡内在册 !== r.酒馆enabled).length;
  assert.equal(changedEnabled, 37);
  const mainIds = [46,48,52,53,56,57,58,61,62,63,64,65,68,69,70];
  assert.ok(mainIds.every(id => mapData.映射.find(r => r.卡内id === id).酒馆enabled === false));
  const result = { identity: 'gpt', baseline: 'caac440', input_sha256: hashes,
    reported_card_sha256: gates.卡.sha256, upstream_commit: 'd6f520d149aba146305b0b781ddd691d449c28d2',
    native_ejs_stage_checks: 14, stage_results: stageResults,
    complete_gate_condition_checks: gateRows.length * gateFixtures.length, gate_results: gateResults,
    exact_panel_function_checks: panelResults,
    mapping_table_audit: { same_id_uid: 241, enabled_differences: changedEnabled, all_15_mainline_host_disabled_in_reported_snapshot: true },
    limits: '输入为最新上传技术件，未取得原卡/PNG文件或生成时完整请求。上游原生EJS和条件方法真实，env/settings/handler适配；面板函数体真实但s0/身份同一性/玩家名/NPC名册为标注替身。未重演实际世界书扫描、预算、消息写入与撤销、真机反色。' };
  fs.writeFileSync(path.join(__dirname, '技术件独立复算结果.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ stage_checks: 14, gate_checks: result.complete_gate_condition_checks,
    early_date_gate58: gateResults[1].selected_values[58], early_date_gate64: gateResults[1].selected_values[64],
    stage0_wars: stageResults[0].war_fragments, missing_date_stage_wars: stageResults[12].war_fragments,
    empty_c_phase2: panelResults[0].result, lord_only: panelResults[1].result }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
