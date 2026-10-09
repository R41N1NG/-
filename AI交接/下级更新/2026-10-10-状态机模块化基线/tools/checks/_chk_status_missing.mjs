#!/usr/bin/env node
/**
 * _chk_status_missing.mjs —— **真跑**「缺状态栏分支」的行为门禁（2026-10-08 · gpt 17 §5-3 / 05 §4 L102）
 *
 * 为什么要有它：gpt 点名 `_chk_defect_four.mjs` 第 ④ 组只是**内容断言**（`!code.includes(...)`），
 * 要求"真实跑缺状态栏分支后，断言已知有效日期／累计不变"。这一条就做那件事。
 *
 * 做法（gpt 已裁定：正确截取实际生产函数 ≠ 自造副本 —— 这里是**整份卡内状态机脚本原样进 vm**）：
 *   ① 从**候选卡**（或 `--card` 指定）里取出 `state` 脚本的 content（＝实际注入件，不是源文件）；
 *   ② 在 `node:vm` 里建最小宿主桩（只有变量层 API ＋ console ＋ toast），
 *      并把脚本**尾部自启动段之前**的部分整体执行（不动一个字符，只是不跑 DOM/事件自注册）；
 *   ③ 真调 `applyStatusToVars(text, messageId)` 三种输入：
 *      A 无状态栏正文 ⇒ 断言 `仙盟历／仙盟历文／历基准／历时累计` **一个都没被写**（值不变、键不出现）；
 *      B 有状态栏但 `<时间>` 与台账不一致 ⇒ 断言台账日期不被模型文本覆盖；
 *      C 有状态栏且历时合法（"一日"）⇒ 断言正常路径仍生效（累计 +1/30，日期随之推进）。
 *
 * 用法：node tools/checks/_chk_status_missing.mjs [--card 路径]
 * 退出码：0＝全绿；1＝有断言失败；2＝取不到脚本
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const argv = process.argv;
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const CARD = argOf('--card', path.join('_staging_2026-10-08-18', '仙姝堕.json'));
if (!fs.existsSync(CARD)) { console.error('❌ 找不到卡：' + CARD + '（先跑 node _build_card.js --stage _staging_2026-10-08-18）'); process.exit(2); }

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const scripts = (card.data.extensions.tavern_helper && card.data.extensions.tavern_helper.scripts) || [];
const sm = scripts.find((s) => s.name === '状态机');
if (!sm) { console.error('❌ 卡里没有 name=状态机 的脚本'); process.exit(2); }
const full = sm.content;

/* 只切掉「尾部自启动段」，函数定义一字不改 */
const CUT = '\nif (API.eventOn && EVENTS) {';
const cutAt = full.lastIndexOf(CUT);
const code = cutAt > 0 ? full.slice(0, cutAt) : full;

/* ── 内存变量层 ── */
const store = { chat: {}, message: {} };
const 写入记录 = [];
const layerOf = (opt) => (opt && opt.type === 'message') ? store.message : store.chat;

const logs = [];
const 桩 = {
  getVariables(opt) { const v = layerOf(opt); return Object.keys(v).length ? JSON.parse(JSON.stringify(v)) : null; },
  insertOrAssignVariables(patch, opt) {
    写入记录.push({ 层: (opt && opt.type) || 'chat', patch: JSON.parse(JSON.stringify(patch)) });
    const t = layerOf(opt);
    const deep = (dst, src) => { for (const k of Object.keys(src)) { const v = src[k]; if (v && typeof v === 'object' && !Array.isArray(v)) { if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {}; if (v === null) { dst[k] = null; continue; } deep(dst[k], v); } else dst[k] = v; } return dst; };
    deep(t, patch);
    return true;
  },
  replaceVariables(v, opt) { const t = layerOf(opt); for (const k of Object.keys(t)) delete t[k]; Object.assign(t, JSON.parse(JSON.stringify(v))); return true; },
  getChatMessages() { return [{ message: '', message_id: -1 }]; },
  setChatMessages() { return true; },
  eventOn() { return { stop() {} }; },
};

const sandbox = {
  console: { log: (...a) => logs.push(['log', ...a].join(' ')), warn: (...a) => logs.push(['warn', ...a].join(' ')), error: (...a) => logs.push(['err', ...a].join(' ')), info: () => {} },
  setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; },
  clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  Date, Math, JSON, Number, String, Array, Object, RegExp, Error, isFinite, isNaN, parseInt, parseFloat, Promise, Set, Map,
  toast: () => {},
  document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }), body: { appendChild: () => {}, contains: () => false }, head: { appendChild: () => {} }, documentElement: {} },
  tavern_events: { MESSAGE_RECEIVED: 'message_received', MESSAGE_SENT: 'message_sent', CHAT_CHANGED: 'chat_changed', GENERATION_AFTER_COMMANDS: 'generation_after_commands' },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.parent = sandbox;
sandbox.window.top = sandbox;
sandbox.window.TavernHelper = Object.assign({}, 桩);
Object.assign(sandbox, 桩);
sandbox.SillyTavern = { getContext: () => ({ chatId: 'chk-status-missing', chat: Array.from({length: 15}, () => ({})), name1: '玩家', name2: '赵无忧' }) };
sandbox.window.SillyTavern = sandbox.SillyTavern;

let loadErr = null;
try { vm.createContext(sandbox); vm.runInContext(code, sandbox, { filename: 'card/状态机.js（尾部自启动段已切）' }); }
catch (e) { loadErr = String(e && e.stack || e); }

const rep = [];
let fail = 0;
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fail++; };

if (loadErr) { ck(false, '卡内状态机脚本在最小宿主下可加载'); rep.push('   加载错误：' + loadErr.split('\n').slice(0, 3).join(' ／ ')); }
else ck(true, '卡内状态机脚本在最小宿主下可加载');
const apply = sandbox.applyStatusToVars;
ck(typeof apply === 'function', '取到 applyStatusToVars（' + typeof apply + '）');
if (typeof apply !== 'function') { console.log(rep.join('\n')); process.exit(1); }

/* 种子的值**照抄真实存档快照**（聊天 `仙姝堕 - 2026-10-08@13h10m49s.jsonl` 的 chat_metadata.variables.stat_data）：
 *   初始时点=历基准=18930、历时累计=0.0145 ⇒ 脚本自己推出 仙盟历=1577.0701（七月初一）。
 *   ⚠️ 第一版我种的是「历基准 18930 ＋ 历时累计 3.14 ＋ 仙盟历 1578.0303」——**这三个数互相矛盾**
 *      （基准＋累计只能推出 1577.10 左右），于是"仙盟历没变"这类断言全失真。夹具必须内部自洽。 */
const seed = () => {
  store.chat = { stat_data: { 仙盟历: 1577.0701, 仙盟历文: '仙盟历 1577 年 · 七月初一', 历基准: 18930, 初始时点: 18930, 历时累计: 0.0145, 最后处理楼号: 11, 本楼历时加速: 0, 段位: 7, 身份: '赵无忧', 阵营: '赵无忧', known: { 极乐引入手: true, 南域大劫: true } } };
  store.message = {};
  写入记录.length = 0;
  logs.length = 0;
};
const sd = () => store.chat.stat_data || {};
const 写过的键 = () => { const s = new Set(); for (const w of 写入记录) { const p = w.patch || {}; if (p.stat_data) for (const k of Object.keys(p.stat_data)) s.add(k); } return [...s]; };

/* 用例 A：无状态栏 */
{
  seed();
  await apply('他走进院子，院里的竹影摇了摇，什么也没发生。', 12);
  const d = sd();
  ck(d.仙盟历 === 1577.0701, 'A·缺状态栏：仙盟历 未被改动（' + d.仙盟历 + '）');
  ck(d.仙盟历文 === '仙盟历 1577 年 · 七月初一', 'A·缺状态栏：仙盟历文 未被改动（' + d.仙盟历文 + '）');
  ck(d.历基准 === 18930, 'A·缺状态栏：历基准 未被改动（' + d.历基准 + '）');
  ck(d.历时累计 === 0.0145, 'A·缺状态栏：历时累计 未被改动（' + d.历时累计 + '）');
  const keys = 写过的键();
  ck(!keys.includes('仙盟历') && !keys.includes('仙盟历文') && !keys.includes('历基准'), 'A·缺状态栏：写入 patch 里**不含**仙盟历／仙盟历文／历基准（写过的键：' + keys.join('、') + '）');
  ck(logs.some((l) => l.indexOf('没有状态条') !== -1), 'A·缺状态栏：日志确认走了"无状态条"分支');
}

/* 用例 B：有状态栏，但 <时间> 与台账不一致 ⇒ 台账不被覆盖 */
{
  seed();
  const block = [
    '<Status_block>',
    '<时间>仙盟历 1579 年 · 六月初七</时间>',
    '<历时>半个时辰</历时>',
    '<地点>墨山道·孤剑崖</地点>',
    '<在场>孤月</在场>',
    '<身份>墨山道六弟子、赵无忧</身份>',
    '<目标>把话说清楚</目标>',
    '<局势>师门照常</局势>',
    '</Status_block>',
  ].join('\n');
  await apply('正文：风从崖下上来。\n' + block, 13);
  const d = sd();
  ck(d.仙盟历 === 1577.0701, 'B·有状态栏：<时间> 写 1579.0607 **没有**覆盖台账仙盟历（实测 ' + d.仙盟历 + '）');
  ck(d.历基准 === 18930, 'B·有状态栏：历基准 未变（' + d.历基准 + '）');
}

/* 用例 C：有状态栏 + 合法历时 ⇒ 正常路径仍生效 */
{
  seed();
  const block = [
    '<Status_block>',
    '<时间>（照抄后台）</时间>',
    '<历时>一日</历时>',
    '<地点>墨山道·孤剑崖</地点>',
    '<在场>孤月</在场>',
    '<身份>墨山道六弟子、赵无忧</身份>',
    '<目标>把话说清楚</目标>',
    '<局势>师门照常</局势>',
    '</Status_block>',
  ].join('\n');
  const before = sd().仙盟历;
  await apply('正文：他在崖边坐了一日。\n' + block, 14);
  const d = sd();
  const 增 = Math.round((Number(d.历时累计) - 0.0145) * 10000) / 10000;
  ck(增 > 0.03 && 增 < 0.04, 'C·正常路径：历时累计 增加约 1/30 月（实测 +' + 增 + '，累计 ' + d.历时累计 + '）');
  ck(Number(d.仙盟历) > Number(before), 'C·正常路径：仙盟历 随累计推进（' + before + ' → ' + d.仙盟历 + '）');
}

console.log('【缺状态栏分支·真跑门禁】卡内脚本来源：' + CARD + '（状态机 ' + sm.content.length + ' 字符，切尾后 ' + code.length + ' 字符）');
for (const l of rep) console.log('  ' + l);
console.log('\n' + (fail ? '✘ ' + fail + ' 项未通过' : '✔ 全部通过（' + rep.length + ' 项）'));
process.exit(fail ? 1 : 0);
