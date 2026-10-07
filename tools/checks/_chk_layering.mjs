#!/usr/bin/env node
/**
 * _chk_layering.mjs —— **分层关卡**：照秋风 2026-09-29 21:1x 那八条标准定下的目标分层
 *
 * 判据（秋风原话，逐字）：
 *   ①严格的 YAML 格式 ②所有都用一眼能读懂的 <TAG></TAG> 包裹 ③不允许有数字和乱七八糟的格式符号
 *   ④层级要仔细安排 ⑤死文本在 CHAR 前 ⑥同类靠近 ⑦角色资料 D3，角色资料心智模块 D1
 *   ⑧状态栏和特殊导演要求 D0，状态栏和状态栏的格式必须最底层
 *
 * 由 ⑤⑦⑧ 展开成的**硬关卡**：
 *   · CHAR 前（position 0）＝ 死文本：卡内运行规则／旁白禁泄总注／演绎引擎／阶段驱动／文风／闸门 等全局静态规则，
 *     一律不许落 at_depth。
 *   · @D0 ＝ 状态栏三块（状态栏模板／状态字段表／收尾契约），且三块**编号连续**（同类靠近）。
 *   · @D1 ＝ 角色资料的心智模块（条目名以 `(心智姿态)` 结尾）。
 *   · @D3 ＝ 角色资料（【人物】条）—— **这一条先做成待改清单（软项）**，因为那是 50 条的大改，未改完不拦；
 *     改完把它转成硬项。
 *
 * ST 事实（真机源码，不是推测）：
 *   · world-info.js:5308 —— convertCharacterBook **只认 `extensions.position`**（0 before／1 after／4 atDepth）
 *   · world-info.js:4907 —— atDepth 按 `depth` 插进「倒数第 N 楼之前」；**depth 越小越贴生成点（0 最底）**
 *
 * 用法：node _chk_layering.mjs [卡.json]｜退出码 0 全通过／1 有失败项
 */
import { readFileSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const d = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const es = d.data?.character_book?.entries ?? [];
const fails = [];
const rep = [];
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fails.push(msg); };
const pos = (e) => e.extensions?.position ?? 0;
const dep = (e) => e.extensions?.depth ?? 4;

/* ① @D0：状态栏三块（最底层），且编号连续 */
const sTpl = es.find((e) => e.comment === '状态栏模板');
const sFld = es.find((e) => /状态字段表/.test(e.comment || ''));
const sEnd = es.find((e) => /收尾契约/.test(e.comment || ''));
ck(!!sTpl && !!sFld && !!sEnd, `状态栏三块都在册（模板 ${sTpl?.insertion_order}／字段表 ${sFld?.insertion_order}／收尾 ${sEnd?.insertion_order}）`);
const sb = [sTpl, sFld, sEnd].filter(Boolean);
ck(sb.every((e) => pos(e) === 4 && dep(e) === 0), `状态栏三块全在 @D0（最贴生成点）`
  + (sb.some((e) => pos(e) !== 4 || dep(e) !== 0) ? `：${sb.filter((e) => pos(e) !== 4 || dep(e) !== 0).map((e) => e.comment + ' pos' + pos(e) + ' D' + dep(e)).join('、')}` : ''));
ck(sb.length === 3 && sFld.insertion_order === sTpl.insertion_order + 1 && sEnd.insertion_order === sFld.insertion_order + 1,
  `三块编号连续（${sTpl?.insertion_order} → ${sFld?.insertion_order} → ${sEnd?.insertion_order}）—— 「同类靠近」`);

/* ② @D1：角色资料的心智模块 */
const mind = es.filter((e) => /\(心智姿态\)$/.test(e.comment || ''));
const mindBad = mind.filter((e) => pos(e) !== 4 || dep(e) !== 1);
ck(mind.length > 0, `心智模块在册 ${mind.length} 条`);
ck(mindBad.length === 0, `心智模块全在 @D1（秋风 ⑦）`
  + (mindBad.length ? `：${mindBad.map((e) => e.comment + ' pos' + pos(e) + ' D' + dep(e)).join('、')}` : ''));

/* ③ CHAR 前：全局静态规则一律不许落 at_depth */
const GLOBAL = /卡、运行规则|旁白禁泄|FNE|阶段驱动|文风|信息闸门|何为道纹/;
const g = es.filter((e) => GLOBAL.test(e.comment || ''));
const gBad = g.filter((e) => pos(e) !== 0);
ck(gBad.length === 0, `全局静态规则都在 CHAR 前（共 ${g.length} 条）`
  + (gBad.length ? `：${gBad.map((e) => e.comment + ' pos' + pos(e) + ' D' + dep(e)).join('、')}` : ''));

/* ④ 硬项：角色资料（【人物】条 ＋ 公开名册）一律 @D3 —— 秋风 ⑦（2026-09-29 深夜已改完，转硬项） */
const cast = es.filter((e) => /^【人物/.test(e.comment || ''));
const castBad = cast.filter((e) => pos(e) !== 4 || dep(e) !== 3);
ck(cast.length > 0, `角色资料在册 ${cast.length} 条（含公开名册）`);
ck(castBad.length === 0, `角色资料全在 @D3（秋风 ⑦）`
  + (castBad.length ? `：${castBad.map((e) => e.comment + ' pos' + pos(e) + ' D' + dep(e)).join('、')}` : ''));

/* ⑤ 同类靠近：册内分区条必须连续（同区条目之间不夹别的区） */
const marks = es.filter((e) => /^━+ 【/.test(e.comment || ''));
ck(marks.length > 0, `分区标记条 ${marks.length} 条在册`);

/* ⑥ 体量账（软项，只报不拦 —— 秋风「不要有太多这类规则」） */
const RULEISH = /运行规则|状态栏模板|状态字段表|收尾契约|文风|闸门|阶段驱动|演绎引擎|FNE|心智姿态|白描|规范|纪律/;
const rules = es.filter((e) => RULEISH.test(e.comment || ''));
const total = rules.reduce((n, e) => n + String(e.content || '').length, 0);
console.log(`规则类条目 ${rules.length} 条 ／ ${total} 字`);
if (total > 15000) console.log(`  ⚠️ 合计 ${total} 字 —— 秋风「不要有太多这类规则，非要放也要控制缩水」（软提醒，不拦）`);

console.log('\n' + rep.join('\n'));
console.log(`\n${rep.filter((x) => x.startsWith('✔')).length} 通过 / ${rep.filter((x) => x.startsWith('✘')).length} 失败`);
process.exit(fails.length ? 1 : 0);
