/* 门禁：状态机的「去重／tick 语义／首次生成 B 前置」离线路测（gpt 复核答复 2026-10-07-02 的 ④⑦⑧）
 *
 * 做法：把生效脚本（卡片脚本/状态机.js）里这几段**逐字抠出来**，喂进最小替身环境跑，
 *       断言真实行为，而不是断言"代码里有没有那行字"。
 *   · claimOnce：占位 → 处理中被挡 → release 后可重试 → commit 后永久挡
 *   · xsdStateTick：同楼并发共用同一个 Promise（业务只跑一次）；回读不到 ⇒ ok:false；抛错 ⇒ ok:false 且不吞
 *   · preflightFirstGeneration：有取消入口时**显式取消**并 cancelled:true；没有入口时 cancelled:false（如实记录）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '卡片脚本', '状态机.js');
const code = fs.readFileSync(SRC, 'utf8');

/** 按大括号配对抠出一个函数/语句块的源码 */
function grab(startRe, label) {
  const m = startRe.exec(code);
  if (!m) throw new Error('抠不到：' + label);
  let i = m.index;
  const open = code.indexOf('{', i);
  let depth = 0, j = open;
  for (; j < code.length; j++) {
    const c = code[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  return code.slice(i, j);
}
const lineOf = (re, label) => {
  const m = re.exec(code);
  if (!m) throw new Error('抠不到：' + label);
  return m[0];
};

const pieces = [
  lineOf(/const seenMessages = new Set\(\);[^\n]*/, 'seenMessages'),
  grab(/function firstTime\(/, 'firstTime'),
  lineOf(/const pendingKeys = new Set\(\);/, 'pendingKeys'),
  grab(/function claimOnce\(/, 'claimOnce'),
  lineOf(/const tickPromises = new Map\(\);[^\n]*/, 'tickPromises'),
  grab(/async function xsdStateTick\(/, 'xsdStateTick'),
  lineOf(/let preflightDone = false;/, 'preflightDone'),
  grab(/async function preflightFirstGeneration\(/, 'preflightFirstGeneration'),
  grab(/function nativeEventSource\(/, 'nativeEventSource'),
  grab(/function onNative\(/, 'onNative'),
];

const harness = `
${pieces.join('\n')}
return {
  claimOnce, firstTime,
  xsdStateTick, preflightFirstGeneration,
  nativeEventSource, onNative,
  pendingSize: () => pendingKeys.size,
  seenSize: () => seenMessages.size,
  tickSize: () => tickPromises.size,
  preflightDone: () => preflightDone,
  resetPreflight: () => { preflightDone = false; },
};
`;

const results = [];
const check = (name, cond, note = '') => { results.push([name, !!cond, note]); };

/* ── 替身环境 ── */
const deps = {
  TAG: '[test]',
  runtime: { epoch: 1, disposed: false, cleanups: [] },
  msgOf: (e) => String((e && e.message) || e),
  xdsMenuChatKey: () => 'chat-A',
  getGlobalOrParent: () => null,
};
let stopCalls = 0;
let tickBusinessCalls = 0;
/* 回读模式：'full' 三件套齐 ⇒ 成功；'partial' 缺日历 ⇒ 部分写入；'none' ⇒ 回读不到 */
let readbackMode = 'full';
const rbOf = (n) => {
  if (readbackMode === 'none') return undefined;   /* 连 stat_data 都没有 ⇒ 触发「回读不到」分支 */
  const base = { 最后处理楼号: n, 身份: '赵无忧', 段位: 1, 仙盟历文: '仙盟历 1578 年 · 三月初三' };
  if (readbackMode === 'partial') { delete base.仙盟历文; }
  return base;
};
const makeApi = (withStop) => {
  let factory;
  const API = { getChatMessages: undefined };
  if (withStop) API.stopGeneration = () => { stopCalls++; return true; };
  const getVariables = (opt) => {
    const id = opt && Number.isFinite(Number(opt.message_id)) ? Number(opt.message_id) : 8;
    return { stat_data: rbOf(id) };
  };
  const env = {
    ...deps,
    API,
    getVariables,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    messageText: () => '',
    latestMessageId: () => 8,
    onAiMessageReceived: async () => { tickBusinessCalls++; },
    ensureInit: async () => {},
    syncIdentityFromFirstMes: async () => {},
    window: undefined,
  };
  const names = Object.keys(env);
  factory = new Function(...names, harness);
  return () => factory(...names.map((n) => env[n]));
};

/* ① claimOnce：占位 → 处理中被挡 → release 可重试 → commit 后永久挡 */
{
  const b = makeApi(false)();
  const c1 = b.claimOnce('k');
  const c2 = b.claimOnce('k');
  check('claimOnce 首次占位成功', c1.ok === true);
  check('claimOnce 处理中被挡（reason=处理中）', c2.ok === false && c2.reason === '处理中');
  c1.release();
  const c3 = b.claimOnce('k');
  check('claimOnce release 后可重试', c3.ok === true);
  c3.commit();
  const c4 = b.claimOnce('k');
  check('claimOnce commit 后永久挡（reason=已处理）', c4.ok === false && c4.reason === '已处理');
  check('claimOnce 不残留占位', b.pendingSize() === 0 && b.seenSize() === 1);
}

/* ② xsdStateTick：并发共用 Promise／回读判定（含部分写入）／抛错不吞 */
{
  const b = makeApi(false)();
  tickBusinessCalls = 0;
  readbackMode = 'full';
  const p1 = b.xsdStateTick(8, 'x', 'test');
  const p2 = b.xsdStateTick(8, 'x', 'test');
  const [r1, r2] = await Promise.all([p1, p2]);
  check('tick 同楼并发共用同一个 Promise（业务只跑一次）', tickBusinessCalls === 1, '实际 ' + tickBusinessCalls);
  check('tick 回读三件套齐 ⇒ ok:true', r1.ok === true && r2.ok === true, JSON.stringify(r1));

  const b2 = makeApi(false)();
  readbackMode = 'none';
  const r3 = await b2.xsdStateTick(9, 'x', 'test');
  check('tick 回读不到 ⇒ ok:false（不再恒 ok:true）', r3.ok === false && /回读不到|未写入/.test(String(r3.why)), String(r3.why));

  /* ⑦ 部分写入：楼号写了、日历没写 ⇒ 必须 ok:false 且标 partial（可重试），不当作成功 */
  const b4 = makeApi(false)();
  readbackMode = 'partial';
  const r5 = await b4.xsdStateTick(8, 'x', 'test');
  check('tick 部分写入（缺日历）⇒ ok:false 且 partial:true', r5.ok === false && r5.partial === true && /部分写入/.test(String(r5.why)), JSON.stringify(r5));

  const env = {
    ...deps,
    API: {},
    getVariables: () => ({}),
    console: { log: () => {}, warn: () => {}, error: () => {} },
    messageText: () => '',
    latestMessageId: () => 9,
    onAiMessageReceived: async () => { throw new Error('业务炸了'); },
    ensureInit: async () => {},
    syncIdentityFromFirstMes: async () => {},
    window: undefined,
  };
  const names = Object.keys(env);
  const b3 = new Function(...names, harness)(...names.map((n) => env[n]));
  const r4 = await b3.xsdStateTick(9, 'x', 'test');
  check('tick 业务抛错 ⇒ ok:false 且带原因（不吞成成功）', r4.ok === false && /业务炸了/.test(String(r4.why)), String(r4.why));
}

/* ③ preflightFirstGeneration：显式取消 / 无入口时如实记录 */
{
  stopCalls = 0;
  const b = makeApi(true)();
  // 让它失败：把 ensureInit 换成抛错（重建一个环境）
  const envFail = {
    ...deps,
    API: { stopGeneration: () => { stopCalls++; return true; } },
    getVariables: () => ({}),
    console: { log: () => {}, warn: () => {}, error: () => {} },
    messageText: () => '',
    latestMessageId: () => 8,
    onAiMessageReceived: async () => {},
    ensureInit: async () => { throw new Error('初始化炸了'); },
    syncIdentityFromFirstMes: async () => {},
    window: undefined,
  };
  const namesF = Object.keys(envFail);
  const bf = new Function(...namesF, harness)(...namesF.map((n) => envFail[n]));
  const rf = await bf.preflightFirstGeneration(1);
  check('preflight 失败时走显式取消（cancelled:true）', rf.ok === false && rf.cancelled === true, JSON.stringify(rf));
  check('preflight 真的调了取消入口', stopCalls === 1, 'stopCalls=' + stopCalls);

  const envNoStop = { ...envFail, API: {} };
  const namesN = Object.keys(envNoStop);
  const bn = new Function(...namesN, harness)(...namesN.map((n) => envNoStop[n]));
  const rn = await bn.preflightFirstGeneration(1);
  check('preflight 无取消入口 ⇒ cancelled:false（如实记录，不假装已取消）', rn.ok === false && rn.cancelled === false, JSON.stringify(rn));

  /* 成功路径：前置完成并回读 ⇒ ok:true 且 preflightDone 置位 */
  const envOk = {
    ...deps,
    API: {},
    getVariables: () => ({ stat_data: { 身份: '赵无忧', known: { a: true } } }),
    console: { log: () => {}, warn: () => {}, error: () => {} },
    messageText: () => '',
    latestMessageId: () => 8,
    onAiMessageReceived: async () => {},
    ensureInit: async () => {},
    syncIdentityFromFirstMes: async () => {},
    window: undefined,
  };
  const namesO = Object.keys(envOk);
  const bo = new Function(...namesO, harness)(...namesO.map((n) => envOk[n]));
  const ro = await bo.preflightFirstGeneration(1);
  check('preflight 正常 ⇒ ok:true 且回读为真', ro.ok === true && ro.readback === true, JSON.stringify(ro));
  check('preflight 完成后置位（不重复跑）', bo.preflightDone() === true);
}

/* ④ 原生 eventSource 兜底（gpt ⑧：桥接不交回 Promise 时改用宿主原生入口，并登记清理） */
{
  const events = [];
  const es = {
    on: (n) => { events.push(['on', n]); },
    removeListener: (n) => { events.push(['off', n]); },
  };
  const runtime2 = { epoch: 1, disposed: false, cleanups: [] };
  const envN = {
    runtime: runtime2,
    TAG: '[test]',
    msgOf: (e) => String((e && e.message) || e),
    getGlobalOrParent: (n) => (n === 'SillyTavern' ? { getContext: () => ({ eventSource: es }) } : null),
    window: undefined,
    console: { log: () => {}, warn: () => {}, error: () => {} },
  };
  const namesNative = Object.keys(envN);
  const bn2 = new Function(...namesNative, harness)(...namesNative.map((n) => envN[n]));
  const okNative = bn2.onNative('MESSAGE_SENT', () => {}, '测试监听');
  check('⑧ 取到宿主原生 eventSource ⇒ 挂原生并返回 true', okNative === true && events.some(([k, n]) => k === 'on' && n === 'MESSAGE_SENT'), 'okNative=' + okNative);
  check('⑧ 原生监听已登记进 runtime.cleanups', runtime2.cleanups.length === 1, 'cleanups=' + runtime2.cleanups.length);
  for (const f of runtime2.cleanups) { try { f(); } catch (e) { /* 忽略 */ } }
  check('⑧ 清理时真的摘掉了监听', events.some(([k, n]) => k === 'off' && n === 'MESSAGE_SENT'));

  const envN2 = { ...envN, getGlobalOrParent: () => null, window: undefined };
  const namesN2 = Object.keys(envN2);
  const bn3 = new Function(...namesN2, harness)(...namesN2.map((n) => envN2[n]));
  check('⑧ 取不到原生 ⇒ 返回 false（退回助手桥接，不静默失效）', bn3.onNative('MESSAGE_SENT', () => {}, 't') === false);
}

/* ── 输出 ── */
const bad = results.filter(([, ok]) => !ok);
for (const [n, ok, note] of results) console.log((ok ? '✔' : '✘') + ' ' + n + (note ? '｜' + note : ''));
console.log('\n门禁：tick/前置语义  ' + (results.length - bad.length) + ' 通过 / ' + bad.length + ' 失败');
process.exit(bad.length ? 1 : 0);
