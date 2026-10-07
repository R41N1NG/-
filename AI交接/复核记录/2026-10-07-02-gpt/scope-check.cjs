'use strict';
// 身份：gpt。只解析上传源码及构建拼接结果，不执行酒馆接口。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const inputDir = path.resolve(__dirname, '../../下级更新/2026-10-07-01/源码');
const runtimeName = '卡片脚本·状态机（2026-10-07晚·含 rawText 修复·全文）.js';
const runtimePath = path.join(inputDir, runtimeName);
const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');
const hostNames = [
  'getVariables', 'replaceVariables', 'insertOrAssignVariables', 'deleteVariable',
  'getChatMessages', 'setChatMessages', 'getCharacter', 'getCharWorldbookNames',
  'getWorldbookNames', 'getWorldbook', 'replaceWorldbook', 'loadWorldInfo',
  'saveWorldInfo', 'updateWorldInfoList', 'getContext', 'eventOn', 'injectPrompts',
  'getLastMessageId', 'tavern_events', 'SillyTavern', 'toastr',
];

function createAudit(toolRoot = __dirname) {
  const load = createRequire(path.join(path.resolve(toolRoot), 'package.json'));
  const { Linter } = load('eslint');
  const globals = load('globals');
  const espree = load('espree');
  const config = {
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'script',
      globals: { ...globals.browser, ...globals.node, ...Object.fromEntries(hostNames.map(name => [name, 'readonly'])) },
    },
    rules: {
      'no-undef': ['error', { typeof: true }],
      'no-use-before-define': ['warn', { functions: false, classes: true, variables: true }],
      'no-dupe-keys': 'warn', 'no-dupe-args': 'error', 'no-unreachable': 'error',
    },
  };
  const lint = (source, filename, offset = 0) => new Linter().verify(source, config, { filename }).map(message => ({
    rule: message.ruleId, severity: message.severity, message: message.message,
    line: message.line, column: message.column,
    runtime_snapshot_line: offset && message.line > offset ? message.line - offset : null,
  }));
  const source = fs.readFileSync(runtimePath, 'utf8');
  const shared = fs.readFileSync(path.join(inputDir, 'timepoint-slider.cjs'), 'utf8');
  const injectorSource = fs.readFileSync(path.join(inputDir, 'inject-timepoint.cjs'), 'utf8');
  const { injectTimepointModule } = require(path.join(inputDir, 'inject-timepoint.cjs'));
  const injected = injectTimepointModule(source);
  if (!injected.endsWith(source)) throw new Error('Current injector changed the runtime body');
  const prefix = injected.slice(0, injected.length - source.length);
  const offset = (prefix.match(/\n/g) || []).length;
  const oldLog = '（累计 ${acc}月／本段跨度 ${monthSpan}月）';
  if (source.split(oldLog).length !== 2) throw new Error('Hotfix target must occur exactly once');
  const hotfix = source.replace(oldLog, '（全程累计 ${acc}月）');
  const hotfixInjected = injectTimepointModule(hotfix);
  const parse = text => espree.parse(text, { ecmaVersion: 'latest', sourceType: 'script', range: true, loc: true });
  return { source, shared, injectorSource, injected, hotfix, hotfixInjected, offset, parse, lint,
    versions: { eslint: load('eslint/package.json').version, globals: load('globals/package.json').version, espree: load('espree/package.json').version } };
}

function report(audit) {
  const cases = [
    ['current_injected_runtime', audit.injected, audit.offset],
    ['shared_module', audit.shared, 0], ['current_injector', audit.injectorSource, 0],
    ['minimal_hotfix_injected_runtime', audit.hotfixInjected, audit.offset],
  ].map(([name, text, offset]) => ({ name, sha256: sha256(text), messages: audit.lint(text, name + '.js', offset) }));
  return {
    identity: 'gpt', date: '2026-10-07', timezone: 'Asia/Shanghai',
    runtime_snapshot: path.relative(path.resolve(__dirname, '../../..'), runtimePath),
    runtime_sha256: sha256(audit.source), shared_sha256: sha256(audit.shared), injector_sha256: sha256(audit.injectorSource),
    tools: audit.versions, allowed_host_globals: hostNames,
    scope: '全部上传源及当前注入器拼接结果的静态作用域检查；宿主 API 被显式声明，不保证真实宿主接口存在或异步行为正确。',
    warning_review: {
      rolledBack: '闭包在 const rolledBack 初始化后才被调用，当前调用顺序没有 TDZ。',
      xdsTimepoint: 'xdsMenuIntro 是延后调用的函数；模块实例初始化先于无条件绑定和点击，当前顺序没有 TDZ。',
      duplicate_name_keys: '11 处 name 空值与后续真名重复；JS 后项覆盖前项，不是本次中断原因，仍应清理。',
    }, cases,
  };
}

module.exports = { createAudit, report, sha256, runtimePath, inputDir };
if (require.main === module) {
  const audit = createAudit(process.argv[2]);
  if (process.argv[3]) {
    const file = path.resolve(process.argv[3]);
    const text = fs.readFileSync(file, 'utf8');
    const result = { file, sha256: sha256(text), messages: audit.lint(text, path.basename(file)) };
    console.log(JSON.stringify(result, null, 2));
    if (result.messages.some(message => message.severity === 2)) process.exitCode = 1;
  } else {
  const result = report(audit);
  fs.writeFileSync(path.join(__dirname, 'scope-results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result.cases.map(row => ({ name: row.name,
    errors: row.messages.filter(message => message.severity === 2), warnings: row.messages.filter(message => message.severity === 1).length })), null, 2));
  if (result.cases.some(row => row.messages.some(message => message.severity === 2))) process.exitCode = 1;
  }
}
