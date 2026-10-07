'use strict';
// 身份：gpt。只在内存替身里执行上传快照，不连接酒馆、不写玩家存档。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const sourceDir = path.join(root, 'AI交接/下级更新/2026-10-07-01/源码');
const filename = '卡片脚本·状态机（2026-10-08·含撤销命令与整件退回）.js';
const source = fs.readFileSync(path.join(sourceDir, filename), 'utf8');
const injected = require(path.join(sourceDir, 'inject-timepoint.cjs')).injectTimepointModule(source);
const plain = x => JSON.parse(JSON.stringify(x));
const observations = [];
function merge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
      merge(target[key], value);
    } else target[key] = plain(value);
  }
}
function fixture(initial = {}, text = '', user = '') {
  const layers = { chat: { stat_data: plain(initial) }, message: { stat_data: plain(initial) } };
  const logs = [], writes = [];
  const rows = Array.from({ length: 9 }, (_, i) => ({ message_id: i, role: i % 2 ? 'user' : 'assistant',
    is_user: Boolean(i % 2), mes: i === 8 ? text : i === 1 ? user : '',
    message: i === 8 ? text : i === 1 ? user : '', swipe_id: 0 }));
  const ctx = { chatId: 'gpt-incident-memory', characterId: 0, characters: [], chat: rows, name1: '测试用户' };
  const window = {}; window.parent = window; window.top = window; window.self = window;
  const sandbox = {
    window, console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push({ level, text: args.map(String).join(' ') })])),
    setTimeout: () => 1, clearTimeout() {}, getContext: () => ctx, SillyTavern: { getContext: () => ctx },
    getVariables: opt => plain(layers[opt.type]),
    insertOrAssignVariables: (patch, opt) => { writes.push({ type: opt.type, patch: plain(patch) }); merge(layers[opt.type], patch); },
    replaceVariables: (value, opt) => { layers[opt.type] = plain(value); },
    getChatMessages: id => [rows[Number(id) === -1 ? 8 : Number(id)]].filter(Boolean), getLastMessageId: () => 8,
    getCharWorldbookNames: () => ({}), getWorldbookNames: () => [],
    eventOn: () => ({ stop() {} }),
    tavern_events: Object.fromEntries(['MESSAGE_SENT', 'MESSAGE_RECEIVED', 'CHARACTER_MESSAGE_RENDERED', 'CHAT_CHANGED', 'CHAT_CREATED', 'MESSAGE_SWIPED'].map(name => [name, name])),
  };
  const context = vm.createContext(sandbox);
  new vm.Script(injected).runInContext(context, { timeout: 5000 });
  return { context, layers, logs, writes, state: () => plain(context.readStatData()), eval: code => vm.runInContext(code, context) };
}
async function run() {
  const prose = '庭院平静，众人仍在墨山道。\n<Status_block><历时>无</历时><实际发生>天溪城兽潮</实际发生></Status_block>';
  const f = fixture({ 身份: '赵无忧', 段位: 6, known: {}, 窗口起点: 1, 本段楼数: 2,
    最后处理楼号: 6, 历基准: 1578 * 12 + 2 + 2 / 30, 历时累计: 0 }, prose);
  await f.context.applyStatusToVars(prose, 8);
  assert.equal(f.state().段位, 7);
  assert.notEqual(f.state().known['天溪城兽潮'], true);
  assert.ok(f.logs.some(x => x.text.includes('丢弃「天溪城兽潮」')));
  observations.push({ name: '被锚点证据闸门拒绝的原始申报仍触发跳段', stage: f.state().段位,
    beast_anchor: f.state().known['天溪城兽潮'] ?? null, rejection: f.logs.filter(x => x.text.includes('丢弃「天溪城兽潮」')) });

  const negative = '本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破。';
  const inh = fixture({ 身份: '赵无忧', 段位: 1, known: {} }, '', negative);
  const detected = plain(inh.context.detectInheritance(negative, 1));
  assert.equal(detected.targetStage, 11);
  await inh.context.onUserMessageSent(1);
  assert.equal(inh.state().段位, 11);
  assert.equal(inh.state().known['天溪城兽潮'], true);
  assert.equal(inh.state().known['天溪城破'], true);
  observations.push({ name: '否定未来事件的普通首楼文字误触自动继承并写真', input: negative,
    detected, stage: inh.state().段位, known: inh.state().known, calendar: inh.state().仙盟历文 });

  const evidence = fixture();
  const weak = plain(evidence.context.anchorEvidenceIn('尚未抵达天溪，也没有兽潮；仅听说另一座城在围城。', '天溪城兽潮'));
  const empty = plain(evidence.context.anchorEvidenceIn('', '天溪城兽潮'));
  assert.equal(weak.ok, true); assert.equal(empty.ok, true);
  const hits = plain(evidence.context.proposeAnchors('听说天溪城有兽潮，但我们尚未南下。', 8));
  assert.equal(evidence.writes.length, 0);
  observations.push({ name: '证据正则不识别否定/主体，空正文放行；旁证函数自身不写盘', weak, empty, suggestion_hits: hits, suggestion_writes: evidence.writes.length });

  const noStatus = fixture({ 身份: '自设', 段位: 1, 仙盟历: 1579.06, 仙盟历文: '1579 年 · 六月初七',
    历基准: 1579 * 12 + 5 + 6 / 30, 历时累计: 0 }, '今天平静无事。');
  await noStatus.context.applyStatusToVars('今天平静无事。', 8);
  assert.equal(noStatus.state().仙盟历, 1578.03);
  observations.push({ name: '缺状态栏仍按段位回写日期', before: '1579 年 · 六月初七', after: noStatus.state().仙盟历文 });

  const base = 1580 * 12;
  const after = evidence.eval(`monthsToYm(${base} + nextAcc({历时累计:0}, 8, 3, true).acc)`);
  assert.equal(after, 1580.04);
  observations.push({ name: '日历算术没有在1580.01截止', after_three_months: after });

  const results = { identity: 'gpt', baseline_commit: '4824b1d', input: filename,
    source_sha256: crypto.createHash('sha256').update(source).digest('hex'), source_chars: source.length,
    injected_sha256: crypto.createHash('sha256').update(injected).digest('hex'), count: observations.length, observations,
    limits: '执行上传快照的实际函数；API、聊天、双层变量、事件和定时器为替身。未执行真实世界书引擎、ST-Prompt-Template、实际请求或用户旧档。通过表示问题被复现，不表示已修复。' };
  fs.writeFileSync(path.join(__dirname, '事故探针结果.json'), JSON.stringify(results, null, 2) + '\n');
  process.stdout.write(JSON.stringify(results, null, 2) + '\n');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
