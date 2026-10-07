'use strict';
// 身份：gpt。以扩展原方法体和它附带的EJS引擎测试上传条件，不运行世界书扫描或真实宿主。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const extension = process.argv[2];
if (!extension) throw new Error('用法：node 闸门复核.cjs <ST-Prompt-Template源码目录>');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const inputPath = path.resolve(__dirname, '../../下级更新/2026-10-08-剧情事故/材料/2_29条剧情·配置与闸门与导轨.json');
const input = fs.readFileSync(inputPath, 'utf8');
const entries = JSON.parse(input);
const methodSource = fs.readFileSync(path.join(extension, 'src/function/worldinfo.ts'), 'utf8');
const methodStart = methodSource.indexOf('async isConditionFiltedEntry(');
const start = methodSource.indexOf("const condition = this.decorators.indexOf('@@if');", methodStart);
const end = methodSource.indexOf('\n    }', start);
assert.ok(methodStart >= 0 && start > methodStart && end > start);
const body = methodSource.slice(start, end);
assert.ok(body.includes('!!(${this.arguments[condition]})'));
assert.ok(body.includes("=== 'false'"));
const ejsPath = path.join(extension, 'src/3rdparty/ejs.js');
const ejs = require(ejsPath);
const handler = async (template, env, where, options) => {
  try { return await ejs.compile(template, {
    async: true, _with: true, client: true, ...options.options,
  })(env); } catch { return null; } // 上游evalTemplateHandler捕获渲染错误后返回null；不模拟UI告警。
};
const method = new Function('evalTemplateHandler', 'settings',
  'return async function(env, options = {}) {' + body + '\n};')(handler, { cache_enabled: 0 });
const env = { variables: { stat_data: { 身份: '赵无忧', 仙盟历: 1578.03, 段位: 2, known: {} } } };
const entryThis = (x, expression, i) => ({ decorators: ['@@if'], arguments: [expression],
  entry: { world: '隔离复核', comment: x.comment, uid: i } });
async function run() {
  const rows = [];
  for (const [i, entry] of entries.entries()) {
    const expression = entry.gate.replace(/^@@if\s+/, '');
    const value = new Function('variables', 'return (' + expression + ');')(env.variables);
    const filtered = await method.call(entryThis(entry, expression, i), env);
    assert.equal(typeof value, 'function'); assert.equal(filtered, false);
    // 仅作条件表达式参考修补：调用刚才创建的函数；没有改上传文件或生产源。
    const repaired = expression + '()';
    const repairedValue = new Function('variables', 'return (' + repaired + ');')(env.variables);
    const repairedFiltered = await method.call(entryThis(entry, repaired, i), env);
    assert.equal(typeof repairedValue, 'boolean'); assert.equal(repairedFiltered, !repairedValue);
    rows.push({ comment: entry.comment, original_type: typeof value, original_filtered: filtered,
      repaired_value: repairedValue, repaired_filtered: repairedFiltered,
      inner_has_calendar: /stat_data\?\.仙盟历/.test(expression), has_uid: Object.hasOwn(entry, 'uid') });
  }
  const beast = entries.find(x => x.comment.startsWith('【中立】四'));
  const expr = beast.gate.replace(/^@@if\s+/, '') + '()';
  const atDate = { variables: { stat_data: { 仙盟历: 1579.01 } } };
  assert.equal(await method.call(entryThis(beast, expr, 100), atDate), false);
  assert.equal(await method.call(entryThis(beast, expr, 100), { variables: {} }), true);
  const threw = '(function(){try{return missingRuntime.foo}catch(e){return false}})()';
  assert.equal(await method.call(entryThis(beast, threw, 100), env), true);
  const main = entries.find(x => x.comment.startsWith('【剧情】七'));
  const high = { variables: { stat_data: { 身份: '赵无忧', 仙盟历: 1578.03, 段位: 7, known: {} } } };
  assert.equal(await method.call(entryThis(main, main.gate.replace(/^@@if\s+/, '') + '()', 100), high), false);
  assert.equal(await method.call(entryThis(main, '(', 100), env), false);
  const result = { identity: 'gpt', baseline_commit: '0d48b38', input_sha256: hash(input),
    extension_manifest: JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'), 'utf8')),
    upstream_commit: 'd6f520d149aba146305b0b781ddd691d449c28d2',
    worldinfo_ts_sha256: hash(methodSource), ejs_sha256: hash(fs.readFileSync(ejsPath)), method_body_sha256: hash(body),
    entries: rows.length, original_not_filtered: rows.filter(x => !x.original_filtered).length,
    inner_calendar_gates: rows.filter(x => x.inner_has_calendar).length, missing_uid: rows.filter(x => !x.has_uid).length,
    repaired_at_early_date_filtered: rows.filter(x => x.repaired_filtered).length,
    additional_checks: { corrected_neutral_beast_opens_at_1579_01: true, corrected_missing_date_filtered: true,
      caught_exception_filtered: true, corrected_main_beast_still_opens_at_1578_03_with_stage_7: true,
      handler_error_null_is_not_filtered: true }, rows,
    limits: '真实上游条件方法体与真实附带EJS；evalTemplateHandler只替换为EJS执行适配，settings与env为替身。未执行上游完整宿主集成、用户安装版、扫描/预算/请求；通过表示复现错误和参考修补行为，不表示已部署或已清理所有入口。' };
  fs.writeFileSync(path.join(__dirname, '闸门复核结果.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ entries: result.entries, original_not_filtered: result.original_not_filtered,
    inner_calendar_gates: result.inner_calendar_gates, missing_uid: result.missing_uid,
    repaired_at_early_date_filtered: result.repaired_at_early_date_filtered, additional_checks: result.additional_checks }, null, 2));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
