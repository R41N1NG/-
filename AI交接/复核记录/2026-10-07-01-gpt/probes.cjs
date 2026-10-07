'use strict';
// 身份：gpt。运行原始上传函数的隔离探针，不执行整份状态机，
// 不连接真实酒馆、不写用户变量、不修改生产源。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const sourcePath = path.resolve(__dirname, '../../下级更新/2026-10-07-01/源码/卡片脚本·状态机（生效源·待复核·全文）.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function extract(name) {
  // Uploaded top-level functions close with an unindented brace. This avoids
  // executing unrelated startup code; the selected definitions stay verbatim.
  const match = new RegExp('^(?:async )?function ' + name + '\\([^]*?^\\}', 'm').exec(source);
  if (!match) throw new Error('Cannot extract ' + name);
  new vm.Script(match[0]);
  return match[0];
}
const quietConsole = { log() {}, warn() {}, error() {} };
const context = vm.createContext({ console: quietConsole, xdsMenuContext: () => ({ name1: '测试用户' }) });
vm.runInContext(['parseXianmengFromText', 'xdsMenuIntro', 'ymToMonths', 'monthsToYm', 'fmtXianmeng'].map(extract).join('\n'), context);
const results = [];
const record = (name, observation, status) => results.push({ name, status, observation });
const plain = value => JSON.parse(JSON.stringify(value));
const form = values => ({ querySelector(selector) {
  const match = /data-xds-field="([^"]+)"/.exec(selector);
  return { value: values[match[1]] || '' };
} });

async function run() {
  new vm.Script(source);
  record('上传全文语法', '整份状态机能通过 V8 语法检查；未执行启动代码。', 'confirmed');

  const chosen = '仙盟历 1579 年 · 六月初七';
  const intro = context.xdsMenuIntro(form({ custom_timepoint: chosen, custom_origin: '仙盟历 1577 年 · 七月初一得到线索' }));
  assert.ok(intro.includes('• 当前时点：' + chosen + '\n'));
  assert.equal((intro.match(/• 当前时点：/g) || []).length, 1);
  record('生产字段清单已包含 custom_timepoint', '实际 xdsMenuIntro 保留六月初七，并已有一行当前时点；不要重复追加字段。', 'confirmed');

  const invalidIntro = context.xdsMenuIntro(form({ custom_timepoint: '还没有想好' }));
  assert.ok(invalidIntro.includes('• 当前时点：还没有想好'));
  record('非空无效日期未在提交前拒绝', '当前 xdsMenuIntro 接受“还没有想好”，只检查长度。', 'needs_fix');

  const dayCases = [['仙盟历 1579 年 · 六月十五', 1], ['仙盟历 1579 年 · 六月廿一', 1], ['仙盟历 1579 年 · 六月二十', 1], ['仙盟历 1579 年 · 六月31日', 30], ['仙盟历 1579 年 · 六月初七', 7]];
  const days = dayCases.map(([input, expectedCurrent]) => {
    const actual = plain(context.parseXianmengFromText(input));
    assert.equal(actual.day, expectedCurrent);
    return { input, actual };
  });
  record('原日期解析器的错误日数', days, 'needs_fix');

  const multiDate = '背景：仙盟历 1577 年 · 七月初一\n• 当前时点：' + chosen;
  const first = plain(context.parseXianmengFromText(multiDate));
  assert.deepEqual(first, { ym: 1577.07, day: 1 });
  record('任意正文首日期抢占字段', { input: multiDate, actual: first, expectedSelected: { ym: 1579.06, day: 7 } }, 'needs_fix');

  const baselineText = /const pick = parseXianmengFromText\(String\(text \|\| ''\)\)[^\n]+;\n\s*basis = [^\n]+;/.exec(source)[0];
  context.text = '本轮 AI 正文提到仙盟历 1578 年 · 三月初三';
  context.messageText = () => intro;
  const selectedBasis = context.ymToMonths(1579.06) + 6 / 30;
  const pickedBasis = vm.runInContext('(function(){ let basis; ' + baselineText + ' return basis; })()', context);
  assert.ok(Math.abs(pickedBasis - selectedBasis) > 1);
  record('现有基准分支优先采用 AI 正文日期', { actualMonths: pickedBasis, expectedSelectedMonths: selectedBasis }, 'needs_fix');
  context.text = '没有日期';
  context.messageText = () => '';
  const defaultBasis = vm.runInContext('(function(){ let basis; ' + baselineText + ' return basis; })()', context);
  assert.equal(defaultBasis, context.ymToMonths(1578.03));
  record('原解析失败基准为初一', { actualMonths: defaultBasis, expectedDefaultMonths: context.ymToMonths(1578.03) + 2 / 30 }, 'needs_fix');

  let missingStatusPatch;
  Object.assign(context, {
    TAG: '[probe]', FLOOR_PIN: '段位基准',
    parseStatusBlock: () => ({ found: false }),
    reconcileNadeLedger: async () => {}, ensureInit: async () => {},
    readStatData: () => ({ 身份: '自设', 段位: 1, 历基准: selectedBasis, 仙盟历: 1579.06, 仙盟历文: chosen }),
    stageOfFloor: () => 1,
    writeStat: async patch => { missingStatusPatch = plain(patch); return { ok: true }; },
  });
  const segTime = /^const SEG_TIME = [^\n]+/m.exec(source)[0];
  vm.runInContext(segTime + '\n' + extract('applyStatusToVars'), context);
  await context.applyStatusToVars('本轮没有状态栏', 2);
  assert.equal(missingStatusPatch.仙盟历, 1578.03);
  record('缺状态栏分支覆写选定日期', { selected: chosen, actualPatch: missingStatusPatch }, 'needs_fix');

  const elapsedSource = /let acc = \(Number\(sdNow\.时点加速\)[^]*?if \(isStageChanged\) patch\.时点加速 = 0;/.exec(source)[0];
  const elapsed = vm.runInContext('(function(){const sdNow={时点加速:0.4,最后处理楼号:2,本楼历时加速:0.02};const messageId=4;const isStageChanged=true;const patch={};' + elapsedSource + 'return {acc,patch};})()', context);
  assert.equal(elapsed.acc, 0);
  record('换段清空累计历时', { beforeElapsedMonths: 0.4, after: plain(elapsed), lostDaysAt30DaysPerMonth: 12 }, 'needs_fix');

  let guardCalls = 0, identityWrites = 0, entryWrites = 0;
  Object.assign(context, {
    IDENTITY_NAMES: ['自设'], IDENTITY_FACTION: { 自设: '大荒' }, FACTION_DEFAULT: '大荒',
    readStatData: () => ({ inventory: [] }), isNewChat: () => true,
    defaultInventoryFor: () => [], openFieldDefaultFor: () => false,
    writeStat: async () => { identityWrites++; return { ok: true, via: 'fixture' }; },
    syncIdentityEntries: async () => { entryWrites++; return {}; },
  });
  vm.runInContext(extract('writeIdentity'), context);
  await context.writeIdentity('自设', () => { guardCalls++; return false; });
  assert.deepEqual([guardCalls, identityWrites, entryWrites], [0, 1, 1]);
  record('writeIdentity 未接收菜单传入的 guard', { guardCalls, identityWritesInFixture: identityWrites, worldbookCallsInFixture: entryWrites, limit: '这证明参数未执行；不是已复现真实跨会话写入。writeStat 另有初始 chatId 检查。' }, 'needs_review');

  const output = {
    reviewer: 'gpt', reviewed_at: new Date().toISOString(),
    input_file: path.relative(path.resolve(__dirname, '../../..'), sourcePath),
    input_sha256: crypto.createHash('sha256').update(source).digest('hex'),
    scope: '隔离运行上传原函数/原片段。依赖为测试替身；不执行整份状态机启动，不连接真实酒馆或API。known defects 被断言为当前观察结果，不表示生产修复已通过。',
    results,
  };
  fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ observations: results.length, confirmed: results.filter(row => row.status === 'confirmed').length, needs_fix: results.filter(row => row.status === 'needs_fix').length, needs_review: results.filter(row => row.status === 'needs_review').length, output: 'verification.json' }));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
