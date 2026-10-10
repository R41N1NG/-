#!/usr/bin/env node
/**
 * _chk_freefield_gate.mjs —— 「自由字段一致性闸 ＋ 泛指战事待核」行为门禁
 *   （2026-10-08 · gpt 17 号 §3 ＋ 主人令「选 C」）
 *
 * 两部分：
 *   ① **拦**（freeFieldGate）：六个自由字段里把**未到的固定世界事件写成正在发生** ⇒ 拒写、保留旧值；
 *      传闻/计划/否定/疑问 ⇒ 放行；日期已到 ⇒ 放行。
 *   ② **记**（freeFieldSuspect，主人令·选 C）：出现「战火／战事／兵灾／战乱／兵锋／战报／血战」这类
 *      **泛指战事**而时点又早于大劫起点（1578.08）⇒ **不拦**，只记进 `stat_data.自由字段待核`。
 *      传闻/计划/回忆（当年、昔日…）不记。
 *
 * 验的是**实际生产函数**：按源码切片取 `FREE_FIELD_WHITELIST／FREE_WORLD_EVENTS／FREE_NEGATED_OR_PLAN／
 * FREE_VAGUE_WAR／FREE_SUSPECT_EXEMPT／FREE_SUSPECT_FLOOR／freeFieldGate／freeFieldSuspect`
 * （gpt 已裁定：正确截取实际生产函数 ≠ 自造副本；这里打源文件 SHA）。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const SM = '卡片脚本/状态机.js';
const src = fs.readFileSync(SM, 'utf8');
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 16);

function sliceBetween(a, b) {
  const normSrc = src.replace(/\r\n/g, '\n');
  const i = normSrc.indexOf(a); const j = normSrc.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('取不到：' + a);
  return normSrc.slice(i, j);
}
let 代码;
try {
  代码 = [
    sliceBetween('const FREE_FIELD_WHITELIST', '/** 返回 {ok:true} 或 {ok:false, 事件, 因由}（纯函数，可离线测）'),
    sliceBetween('function freeFieldGate(', '\n  return { ok: true };\n}') + '\n  return { ok: true };\n}',
  ].join('\n');
} catch (e) { console.error('❌ ' + e.message); process.exit(2); }
// eslint-disable-next-line no-new-func
const M = new Function(代码 + '\nreturn { freeFieldGate, freeFieldSuspect, FREE_FIELD_WHITELIST };')();
const { freeFieldGate, freeFieldSuspect, FREE_FIELD_WHITELIST } = M;

const rep = [];
let fail = 0;
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fail++; };
const sd = (仙盟历, known) => ({ 仙盟历, known: known || {} });

/* ── ① 拦：明确宣告未到事件 ⇒ 拒 ── */
const 拦例 = [
  ['① 早日期把兽潮写成正在发生 ⇒ 拒', '局势', '天溪城兽潮已破两处防区，援军未至', sd(1577.07), false],
  ['① 早日期把大劫写成已降 ⇒ 拒', '局势', '南域大劫已经降下，天再无元婴', sd(1577.07), false],
  ['① 早日期把城破写成已发生 ⇒ 拒', '危机', '城门失守，天溪城陷落', sd(1578.11), false],
  ['① 日期不可信时把兽潮写成已发生 ⇒ 拒', '危机', '兽潮已经破关，宗门无援', sd(undefined), false],
  ['① 真实局面：远闻写「妖兽潮冲破外围断界崖」（早日期）⇒ 拒', '远闻', '天溪城妖兽潮冲破外围断界崖，墨山道前锋受挫后撤', sd(1577.0701), false],
  ['① 真实局面：局势写「防线溃缩三十里」（早日期）⇒ 拒', '局势', '天溪城防线溃缩三十里，地脉煞气倒灌波及南域各宗', sd(1577.0701), false],
  ['① 大劫口径：粉黑天穹已降临（早日期）⇒ 拒', '远闻', '传闻已不可靠，粉黑天穹已经笼罩南域', sd(1577.07), false],
  ['② 传闻语境 ⇒ 放', '远闻', '据说北面有兽潮出没', sd(1577.07), true],
  ['② 计划/打算语境 ⇒ 放', '目标', '打算三日后启程去天溪', sd(1577.07), true],
  ['② 否定/尚未 ⇒ 放', '近闻', '茶客议论兽潮尚未起来', sd(1577.07), true],
  ['② 疑问/待核 ⇒ 放', '线索', '不知兽潮是否已经破关', sd(1577.07), true],
  ['② 逼近/倒计时口径不算已发生 ⇒ 放', '危机', '兽潮三日内必至，宗门无援', sd(undefined), true],
  ['③ 日期已到（兽潮起点）⇒ 放', '局势', '兽潮围城数日，城墙段化作炼狱', sd(1579.01), true],
  ['③ 日期已到（大劫起点）⇒ 放', '局势', '南域大劫已经降下', sd(1578.08), true],
  ['③ 日期已到（城破起点）⇒ 放', '危机', '城门失守', sd(1579.03), true],
  ['③ 城破起点之前写城破 ⇒ 拒', '危机', '城门失守', sd(1579.01), false],
  ['③ 到日期后真实那两句 ⇒ 放', '远闻', '天溪城妖兽潮冲破外围断界崖', sd(1579.01), true],
  ['④ 普通文案不受影响 ⇒ 放', '近闻', '客栈早早落锁，茶客议论北面商道封禁', sd(1577.07), true],
  ['④ 普通文案不受影响 ⇒ 放（2）', '目标', '护住红缨师姐，探清那对环的来历', sd(1577.07), true],
  ['④ 非白名单字段（地点）不被拦 ⇒ 放', '地点', '天溪城破后的废墟', sd(1577.07), true],
  ['④ 空值/占位不拦 ⇒ 放', '局势', '—', sd(1577.07), true],
];
for (const [名, f, v, s, 期望] of 拦例) {
  const r = freeFieldGate(f, v, s);
  ck(!!r.ok === 期望, 名 + '（' + f + '：「' + v.slice(0, 18) + '」日期 ' + String(s.仙盟历) + '）⇒ ' + (r.ok ? '放' : '拒'));
}

/* ── ② 记（不拦）：泛指战事 ⇒ 待核 ── */
const 记例 = [
  ['C·「天溪城战火蔓延」', '局势', '天溪城战火蔓延，避难散修涌入听雪峰，外院防务杂乱', sd(1577.0701), true],
  ['C·「南域战事已起」', '远闻', '南域战事已起', sd(1577.07), true],
  ['C·「兵灾四起」', '近闻', '天溪一带兵灾四起', sd(1577.07), true],
  ['C·传闻里的战火 ⇒ 不记', '远闻', '据说邻县起了战火', sd(1577.07), false],
  ['C·计划里的战事 ⇒ 不记', '目标', '打算去打听战事的虚实', sd(1577.07), false],
  ['C·回忆（当年/昔日）⇒ 不记', '近闻', '茶客提起当年那场战火', sd(1577.07), false],
  ['C·过了大劫起点（1578.09）⇒ 不记', '局势', '南域战火蔓延', sd(1578.09), false],
  ['C·时点不可信 + 泛指战事 ⇒ 记', '局势', '各地战火不断', sd(undefined), true],
  ['C·非白名单字段（地点）⇒ 不记', '地点', '战火烧过的废墟', sd(1577.07), false],
  ['C·纯兽潮句（无泛指战事词）⇒ 待核不记，但**明确宣告照样拦**', '局势', '兽潮已破两处防区', sd(1577.07), false, true],
  ['C·日期已到的战火 ⇒ 不记', '局势', '天溪城战火蔓延', sd(1579.01), false],
];
for (const [名, f, v, s, 期望记, 期望拒] of 记例) {
  const r = freeFieldSuspect(f, v, s);
  const g = freeFieldGate(f, v, s);
  ck(!!r.suspect === 期望记, 名 + '｜待核=' + (r.suspect ? '是' : '否'));
  ck(!!g.ok === !期望拒, 名 + '｜拦截=' + (g.ok ? '放行' : '拒绝') + (期望拒 ? '（这句是**明确宣告**，选 C 也照样拦）' : '（选 C：泛指战事**不拦**）'));
}

/* ── ③ 源码实证：落盘 / 日志 / 面板可见 ── */
ck(FREE_FIELD_WHITELIST.length === 6 && FREE_FIELD_WHITELIST.indexOf('阶段总结') !== -1, '白名单恰为六个自由文本字段（含 阶段总结）：' + FREE_FIELD_WHITELIST.join('、'));
ck(/patch\.自由字段闸 = \{ 楼: Number\(messageId\), 项: 自由字段闸 \}/.test(src), '被**拒**的值落 `patch.自由字段闸`（源码实证）');
ck(/patch\.自由字段待核 = \{ 楼: Number\(messageId\), 项: 自由字段待核 \}/.test(src), '被**记**的值落 `patch.自由字段待核`（源码实证）');
ck(/\[自由字段·待核\] 第 \$\{messageId\} 楼/.test(src), '待核有日志行（源码实证）');
ck((src.match(/freeFieldSuspect\(/g) || []).length >= 4, 'freeFieldSuspect 有 3 处调用（展示字段循环 ＋ 两处阶段总结）＋1 处定义');
{
  const panel = fs.readFileSync('卡片脚本/状态栏面板.js', 'utf8');
  ck(/自由字段待核: \$\{/.test(panel), '面板诊断 diag() 里有「自由字段待核」一行（面板可见，源码实证）');
}

console.log('【自由字段闸 ＋ 泛指战事待核】源 ' + SM + '（SHA ' + sha(src) + '，切片 ' + 代码.length + ' 字符）');
for (const l of rep) console.log('  ' + l);
console.log('\n' + (fail ? '✘ ' + fail + ' 项未通过' : '✔ 全部通过（' + rep.length + ' 项）'));
process.exit(fail ? 1 : 0);
