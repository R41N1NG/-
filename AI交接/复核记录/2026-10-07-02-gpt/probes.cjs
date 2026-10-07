'use strict';
// 身份：gpt。酒馆、变量 API、事件和定时器均为内存替身；不执行网络、浏览器或真实存档写入。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createAudit, sha256, inputDir } = require('./scope-check.cjs');
const audit = createAudit(process.argv[2]);
const observations = [];
const plain = value => JSON.parse(JSON.stringify(value));
const record = (name, status, observation) => observations.push({ name, status, observation });
const chosen = '仙盟历 1579 年 · 六月初七';
const selectedBasis = 1579 * 12 + 5 + 6 / 30;
const sample = '赵无忧已取得《极乐引》残篇，并收入纳戒。\n<Status_block><历时>一日</历时><实际发生>极乐引入手</实际发生></Status_block>';

function merge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
      merge(target[key], value);
    } else target[key] = plain(value);
  }
}

function fixture(source = audit.injected, initial = {}, text = sample) {
  const layers = { chat: { stat_data: plain(initial) }, message: { stat_data: plain(initial) } };
  const logs = [], writes = [], timers = [], listeners = [];
  const rows = Array.from({ length: 9 }, (_, i) => ({ message_id: i, role: i % 2 ? 'user' : 'assistant',
    is_user: Boolean(i % 2), mes: i === 8 ? text : '', message: i === 8 ? text : '', swipe_id: 0 }));
  const ctx = { chatId: 'gpt-memory-chat', characterId: 0, characters: [], chat: rows, name1: '测试用户' };
  const window = {}; window.parent = window; window.top = window; window.self = window;
  const sandbox = {
    window, console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push({ level, text: args.map(String).join(' ') })])),
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    getContext: () => ctx, SillyTavern: { getContext: () => ctx },
    getVariables: opt => plain(layers[opt.type]),
    insertOrAssignVariables: (patch, opt) => { writes.push({ type: opt.type, patch: plain(patch) }); merge(layers[opt.type], patch); },
    replaceVariables: (value, opt) => { layers[opt.type] = plain(value); },
    getChatMessages: id => [rows[Number(id) === -1 ? 8 : Number(id)]].filter(Boolean), getLastMessageId: () => 8,
    getCharWorldbookNames: () => ({}), getWorldbookNames: () => [],
    eventOn: (event, handler) => { listeners.push({ event, handler }); return { stop() {} }; },
    tavern_events: Object.fromEntries(['MESSAGE_SENT', 'MESSAGE_RECEIVED', 'CHARACTER_MESSAGE_RENDERED', 'CHAT_CHANGED', 'CHAT_CREATED', 'MESSAGE_SWIPED'].map(name => [name, name])),
  };
  const context = vm.createContext(sandbox);
  new vm.Script(source, { filename: 'isolated-state-machine.js' }).runInContext(context, { timeout: 5000 });
  vm.runInContext('globalThis.__gptMilestoneCalls = 0; const __gptRealMilestones = applyMilestones; applyMilestones = async (...args) => { __gptMilestoneCalls++; return __gptRealMilestones(...args); };', context);
  return { context, logs, writes, layers, timers, listeners, ctx, text,
    state: () => plain(context.readStatData()), eval: code => vm.runInContext(code, context) };
}

async function run() {
  new vm.Script(audit.source); new vm.Script(audit.injected);
  record('上传原文及当前注入产物语法', 'confirmed', '均可编译；静态 no-undef 仍报 monthSpan。');

  const broken = fixture();
  await assert.rejects(() => broken.context.applyStatusToVars(sample, 8), error => error.name === 'ReferenceError' && /monthSpan/.test(error.message));
  assert.equal(broken.context.__gptMilestoneCalls, 0);
  assert.ok(Object.keys(broken.state().known).length > 0);
  assert.equal(broken.state().段位, undefined);
  record('rawText 修正后仍在 monthSpan 中断', 'needs_fix', {
    error: 'monthSpan is not defined', milestone_calls: 0, stage_after: broken.state().段位 ?? null,
    initialized_known_fields_before_error: Object.keys(broken.state().known).length,
    implication: '有工作的变量 API 时，ensureInit 在异常前已写默认 known。因此不能把整份 stat_data 全空唯一归因于这一行。',
  });

  const fixed = fixture(audit.hotfixInjected);
  const parsed = await fixed.context.applyStatusToVars(sample, 8);
  assert.equal(parsed.found, true);
  assert.equal(fixed.context.__gptMilestoneCalls, 1);
  assert.equal(fixed.state().known['极乐引入手'], true);
  assert.equal(fixed.state().段位, 2);
  record('最小日志修补恢复状态与真实里程碑函数调用', 'confirmed', {
    change: '仅去掉本段跨度 ${monthSpan} 的旧日志片段，未恢复段位→日历推导',
    milestone_calls: 1, neutral_anchor_written: fixed.state().known['极乐引入手'], stage: fixed.state().段位,
    limit: '实际函数运行，API 与两层存储为内存替身；不代表真实酒馆写入验收。',
  });

  const retry = fixture();
  await retry.context.onAiMessageReceived(8);
  await retry.context.onAiMessageReceived(8);
  assert.equal(retry.logs.filter(row => /处理第 8 楼失败.*monthSpan/.test(row.text)).length, 1);
  assert.equal(retry.eval('seenMessages.size'), 1);
  assert.equal(retry.context.__gptMilestoneCalls, 0);
  record('失败提前进入去重集合，第二次相同消息不重试', 'needs_fix', { error_logs_after_two_calls: 1, completed_milestone_calls: 0, seen_keys: 1 });

  const tick = fixture();
  const tickResult = plain(await tick.context.window.__xsdStateTick(8, sample, 'gpt隔离探针'));
  assert.equal(tickResult.ok, true);
  assert.ok(tick.logs.some(row => /monthSpan/.test(row.text)));
  record('tick 在内部失败后仍报 ok true', 'needs_fix', tickResult);

  const oldFloor = fixture(audit.hotfixInjected);
  await oldFloor.context.onAiMessageReceived(2, { rawText: sample });
  assert.equal(oldFloor.writes.length, 0);
  assert.equal(oldFloor.context.__gptMilestoneCalls, 0);
  record('旧楼渲染被最新楼闸门挡住', 'confirmed', '当前最新楼 8，显式触发楼 2 仍只重绘不记账；不能靠翻旧楼或盲扫 tick 恢复整局。');

  const form = value => ({ querySelector(selector) { return { value: selector.includes('custom_timepoint') ? value : '' }; } });
  const intro = fixed.context.xdsMenuIntro(form(chosen));
  assert.ok(intro.includes('• 当前时点：' + chosen + '\n'));
  assert.throws(() => fixed.context.xdsMenuIntro(form('还没有想好')));
  assert.ok(fixed.context.xdsMenuIntro(form('')).includes('三月初三'));
  record('startTime 和 xdsTimepoint 当前作用域与调用顺序', 'confirmed', '构建注入后的完整脚本可初始化，Intro 延后调用保留初七，空值初三、非空无效值阻止；未发现该处 TDZ。');

  const days = ['十五', '廿一', '二十', '31日', '卅一', '初十一'].map(day => ({ day, actual: plain(fixed.context.parseXianmengFromText('仙盟历 1579 年 · 六月' + day)) }));
  assert.deepEqual(days.slice(0, 4).map(row => row.actual?.day ?? null), [15, 21, 20, null]);
  assert.equal(days[4].actual.day, 30); assert.equal(days[5].actual.day, 10);
  record('日数常规修复已生效，但异常词仍被部分接受', 'needs_fix', days);

  const newOpening = fixture(audit.hotfixInjected, { 身份: '自设', 段位: 1 });
  newOpening.ctx.chat[7].message = newOpening.ctx.chat[7].mes = '【启卷入世 · 自设命途】\n• 当前时点：' + chosen;
  await newOpening.context.applyStatusToVars(sample, 8);
  const defaultBasis = 1578 * 12 + 2 + 2 / 30;
  assert.ok(Math.abs(newOpening.state().历基准 - defaultBasis) < 1e-8);
  assert.ok(Math.abs(newOpening.state().历基准 - selectedBasis) > 1);
  record('所选开局日期仍未进入基准', 'needs_fix', { selected: chosen, actual_basis: newOpening.state().历基准,
    expected_basis: selectedBasis, cause: '仍传当前 AI text 给 pickTimepointLine，普通 AI 回复没有该行就降为共享默认。' });

  const missing = fixture(audit.hotfixInjected, { 身份: '自设', 段位: 1, 历基准: selectedBasis, 仙盟历: 1579.06, 仙盟历文: chosen });
  await missing.context.applyStatusToVars('本楼没有状态栏', 8);
  assert.equal(missing.state().仙盟历, 1578.03);
  record('缺状态栏仍按段位覆写时间', 'needs_fix', { selected: chosen, after: missing.state().仙盟历文 });

  const stage = fixture(audit.hotfixInjected, { 身份: '自设', 段位: 1, 窗口起点: 1, 历基准: selectedBasis,
    历时累计: 0.4, 时点加速: 0, 最后处理楼号: 6, 仙盟历: 1579.06, 仙盟历文: '仙盟历 1579 年 · 六月十九' });
  stage.eval('stageOfFloor = () => 2; checkFastForwardStage = () => 2; isSceneLocked = () => false;');
  await stage.context.applyStatusToVars(sample, 8);
  assert.equal(stage.state().段位, 2); assert.equal(stage.state().历时累计, 0.02);
  record('换段清零条件仍在', 'needs_fix', { before_acc_months: 0.4, after_acc_months: stage.state().历时累计,
    after_calendar: stage.state().仙盟历文, lost_prior_days: 12 });

  const zero = fixture(audit.hotfixInjected, { 身份: '自设', 段位: 1, 历基准: selectedBasis, 历时累计: 0, 时点加速: 0.4 });
  await zero.context.applyStatusToVars('<Status_block><实际发生>无</实际发生></Status_block>', 8);
  assert.ok(zero.state().仙盟历文.includes('十九'));
  record('合法累计 0 被 || 当作缺失', 'needs_fix', { new_counter: 0, old_stage_counter: 0.4, calendar: zero.state().仙盟历文 });

  const edited = fixture(audit.hotfixInjected, { 身份: '自设', 段位: 1, 历基准: selectedBasis,
    历时累计: 0.4, 最后处理楼号: 8, 本楼历时加速: 0.02 });
  const noElapsed = '<Status_block><实际发生>无</实际发生></Status_block>';
  await edited.context.applyStatusToVars(noElapsed, 8);
  const afterEdit = edited.state();
  assert.equal(afterEdit.历时累计, 0.4); assert.equal(afterEdit.本楼历时加速, 0);
  await edited.context.applyStatusToVars(noElapsed, 8);
  const afterAgain = edited.state();
  assert.notEqual(afterEdit.仙盟历文, afterAgain.仙盟历文);
  record('同楼撤销历时只改显示，累计未持久化', 'needs_fix', { after_edit: { elapsed: afterEdit.历时累计, calendar: afterEdit.仙盟历文 },
    after_again: { elapsed: afterAgain.历时累计, calendar: afterAgain.仙盟历文 } });

  assert.equal(fixed.context.parseLishi('三月'), 0.02);
  record('过渡词的大步长在内层已被截断', 'needs_fix', { input: '三月', parseLishi: 0.02, outer_transit_cap: 3,
    cause: 'parseLishi 无条件 Math.min(best, LISHI_CAP)，外层较大 cap 无法恢复原步长。' });

  const guarded = fixture(audit.hotfixInjected, { 身份: '自设' });
  const blocked = await guarded.context.writeIdentity('自设', () => false);
  assert.equal(blocked.ok, false); assert.equal(guarded.writes.length, 0);
  let pass = true, guardCalls = 0, entryCalls = 0;
  guarded.context.writeStat = async () => { pass = false; return { ok: true }; };
  guarded.context.syncIdentityEntries = async () => { entryCalls++; return {}; };
  await guarded.context.writeIdentity('自设', () => { guardCalls++; return pass; });
  assert.equal(guardCalls, 1); assert.equal(entryCalls, 1);
  record('guard 入场修复有效，异步后仍未重查', 'needs_review', { initial_false_blocks_writes: true,
    guard_calls_during_change: guardCalls, entry_sync_after_guard_became_false: entryCalls,
    limit: '测试替身主动改变 guard；不是已复现真实跨会话写入。' });

  const injector = require(path.join(inputDir, 'inject-timepoint.cjs'));
  const declaration = audit.parse(audit.shared).body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'xdsTimepointModule');
  assert.equal(audit.injected.slice(0, audit.offset ? audit.injected.length - audit.source.length : 0).trim(), audit.shared.slice(...declaration.range));
  const decoy = '// function xdsTimepointModule is mentioned in a comment\n' + audit.hotfix;
  const decoyOutput = injector.injectTimepointModule(decoy);
  assert.equal(decoyOutput, decoy);
  assert.ok(!audit.parse(decoyOutput).body.some(node => node.type === 'FunctionDeclaration' && node.id.name === 'xdsTimepointModule'));
  record('当前抽取内容正确，但注释会误触发跳过注入', 'needs_hardening', { current_function_matches_shared_ast: true,
    decoy_comment_skips_real_definition: true, current_batch_not_observed_to_fail_injection: true });

  const result = { identity: 'gpt', date: '2026-10-07', timezone: 'Asia/Shanghai',
    input_sha256: sha256(audit.source), minimal_hotfix_sha256: sha256(audit.hotfix),
    scope: '实际注入后的完整状态机在 vm 内运行，变量 API、事件、定时器、世界书为替身；不访问真实存档/API/UI，不执行定时器。部分时钟场景替换段位函数以固定分支。断言验证现有缺陷，不等于生产修复通过。',
    observations };
  fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ observations: observations.length,
    counts: Object.fromEntries([...new Set(observations.map(row => row.status))].map(status => [status, observations.filter(row => row.status === status).length])),
    output: 'verification.json' }, null, 2));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
