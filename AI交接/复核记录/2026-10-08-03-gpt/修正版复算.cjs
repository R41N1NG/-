'use strict';
// 身份：gpt。直接求值完整gateArg；不补括号、不修改生产卡或存档。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const extension = process.argv[2];
if (!extension) throw new Error('用法：node 修正版复算.cjs <ST-Prompt-Template源码目录>');
const input = fs.readFileSync(path.resolve(__dirname, '../../下级更新/2026-10-08-剧情事故/材料/2b_闸门原文（修正版·ST-PT口径）与求值体检.json'), 'utf8');
const data = JSON.parse(input);
const source = fs.readFileSync(path.join(extension, 'src/function/worldinfo.ts'), 'utf8');
const at = source.indexOf('async isConditionFiltedEntry(');
const start = source.indexOf("const condition = this.decorators.indexOf('@@if');", at);
const end = source.indexOf('\n    }', start);
assert.ok(at >= 0 && start > at && end > start);
const body = source.slice(start, end);
assert.ok(body.includes('!!(${this.arguments[condition]})'));
const ejs = require(path.join(extension, 'src/3rdparty/ejs.js'));
const handler = async (text, env, where, options) => {
  try { return await ejs.compile(text, { async: true, client: true, _with: true, ...options.options })(env); }
  catch { return null; }
};
const method = new Function('evalTemplateHandler', 'settings', 'return async function(env, options = {}) {' + body + '\n};')(handler, { cache_enabled: 0 });
const scenarios = [
  { name: 'A_1578.03_段2_known空', stat: { 身份: '赵无忧', 仙盟历: 1578.03, 段位: 2, known: {} } },
  { name: 'C_1578.03_段7_known空', stat: { 身份: '赵无忧', 仙盟历: 1578.03, 段位: 7, known: {} } },
  { name: 'D_现场chat提取值_段2_三月初四', stat: { 身份: '赵无忧', 仙盟历: 1578.0306, 段位: 2,
    known: Object.fromEntries(['极乐引入手','邪修洞府替孤月中毒','启程邪修洞府','回墨山复命',
      '受征召南下','孤剑崖送别已毕','赠送冰心泪','邪修洞府解毒'].map(key => [key, true])) } },
];
async function run() {
  const results = [];
  assert.equal(data.逐条.length, 160);
  for (const scenario of scenarios) {
    const env = { variables: { stat_data: scenario.stat } };
    const rows = [];
    for (const [i, row] of data.逐条.entries()) {
      // 不先!!：先独立检查原始返回类型，避免!!掩盖function/string等类型错误。
      const raw = new Function('variables', 'return (' + row.gateArg + ');')(env.variables);
      assert.equal(typeof raw, 'boolean');
      const filtered = await method.call({ decorators: ['@@if'], arguments: [row.gateArg],
        entry: { world: '完整首行隔离复算', comment: row.comment, uid: i } }, env);
      assert.equal(filtered, !raw);
      if (row.eval[scenario.name]) {
        assert.equal(filtered, row.eval[scenario.name].filtered === '被过滤', row.comment);
        assert.equal(Boolean(raw), row.eval[scenario.name].truthy, row.comment);
      }
      rows.push({ comment: row.comment, isPlot: row.isPlot, raw_type: typeof raw, value: raw, filtered });
    }
    const plots = rows.filter(x => x.isPlot);
    const reported = data.汇总.find(x => x.环境 === scenario.name);
    if (reported) {
      assert.equal(rows.filter(x => x.filtered).length, reported.全部被过滤);
      assert.equal(plots.filter(x => x.filtered).length, reported.剧情类被过滤);
    }
    results.push({ name: scenario.name, fixture: env, filtered: rows.filter(x => x.filtered).length,
      plot_filtered: plots.filter(x => x.filtered).length, total: rows.length, plot_total: plots.length,
      non_boolean: rows.filter(x => x.raw_type !== 'boolean').length,
      plot_not_filtered: plots.filter(x => !x.filtered).map(x => x.comment) });
  }
  const beast = data.逐条.find(x => x.comment.startsWith('【剧情】七'));
  assert.ok(results[1].plot_not_filtered.includes(beast.comment));
  assert.ok(results[2].plot_not_filtered.some(x => x.startsWith('【剧情】六')));
  assert.throws(() => new Function('variables', 'return (' + beast.gateArg + '());')({ stat_data: scenarios[1].stat }), error => error.name === 'TypeError');
  const result = { identity: 'gpt', baseline_commit: '83a6354', input_sha256: sha(input),
    upstream_commit: 'd6f520d149aba146305b0b781ddd691d449c28d2', worldinfo_sha256: sha(source),
    condition_checks: 480, results, duplicate_call_throws_TypeError: true,
    not_replayed: 'B环境仅写known含兽潮，未给完整fixture；本轮不猜其他known值，也不认证B逐条结果。',
    limits: '完整gateArg来自修正材料，原始生产卡仍未由gpt取得；上游条件方法体与EJS真实，env/settings/handler适配为替身。未运行世界书扫描/预算/用户宿主/最终请求。' };
  fs.writeFileSync(path.join(__dirname, '修正版复算结果.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
