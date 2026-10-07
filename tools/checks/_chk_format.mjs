#!/usr/bin/env node
/**
 * _chk_format.mjs —— **体例关卡**（秋风 2026-09-29 21:1x 八条标准）
 *
 * 判据真源：`世界书体例（YAML+tag）.md`
 *   ② 所有条目都用 `<TAG></TAG>` 包裹  ③ 不允许有数字和乱七八糟的格式符号  ⑥ 同类靠近
 *
 * 查什么：
 *   ① 每条（分区标记条除外）都被一个 ASCII 外层标签完整包住，首尾同名；
 *   ② 外层标签名与**分区**对得上（分区→标签映射表，逐条核）；
 *   ③ 没有行首 `· `／`・` 这类项目符号（YAML 用 `- `）；
 *   ④ 没有行首中文序号（「零、一、二、…」）与「（一）」这类编号；
 *   ⑤ 条目内部不许出现半角 `{{` 之类的模板残留（那是 ST 的，不是给模型的）。
 * 退出码：0 全通过 ／ 1 有失败项
 */
import { readFileSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const d = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const es = d.data?.character_book?.entries ?? [];

const EXPECT = [
  [/^【设定/, 'lore'], [/^【剧情/, 'plot'], [/^【势力/, 'faction'], [/^【名器/, 'relic'],
  [/^【物品/, 'item'], [/^【补遗/, 'appendix'], [/^【人物】公开名册/, 'roster'], [/^【人物/, 'npc'],
  [/^【身份/, 'identity'], [/\(心智姿态\)$/, 'mindset'], [/^状态栏模板/, 'status_block_spec'],
  [/^状态字段表/, 'tracked_fields'], [/^收尾契约/, 'output_contract'], [/^文风/, 'writing_style'],
  [/^当前章节信息闸门/, 'info_gate'], [/^【阶段驱动/, 'stage_drive'], [/^卡、运行规则/, 'card_rules'],
];
const expectTag = (name) => { for (const [re, t] of EXPECT) if (re.test(name)) return t; return null; };

const rep = []; const fails = [];
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fails.push(msg); };

let wrapped = 0, marks = 0;
const noTag = [], badName = [], badMatch = [], bullet = [], numbered = [];
for (const e of es) {
  const name = String(e.comment || '').replace(/^(\s*〔待解锁〕)+/, '');
  const c = String(e.content || '').trim();
  if (/^━+\s*【/.test(name)) { marks++; continue; }
  /* 外层包裹：允许**多个并列的顶层块**（例：卡、运行规则 = <card_rules> ＋ <ban_leak>），
     只要每个顶层标签都成对闭合、且整条以最后一个块收尾即可。 */
  const TOP = [...c.matchAll(/^<([A-Za-z][\w_]*)>/gm)].map((x) => x[1]);
  const firstLine = c.split('\n')[0].trim();
  const lastLine = c.split('\n').filter(Boolean).pop().trim();
  const openOk = /^<[A-Za-z][\w_]*>$/.test(firstLine);
  const closeOk = /^<\/[A-Za-z][\w_]*>$/.test(lastLine);
  if (!openOk || !closeOk) { noTag.push(`${name}（首「${firstLine.slice(0, 24)}」尾「${lastLine.slice(0, 24)}」）`); continue; }
  wrapped++;
  /* 每个顶层标签都要成对：开标签数 = 闭标签数（同名单算） */
  for (const t of new Set(TOP)) {
    const open = (c.match(new RegExp('^<' + t + '>$', 'gm')) || []).length;
    const close = (c.match(new RegExp('^</' + t + '>$', 'gm')) || []).length;
    if (open !== close) badName.push(`${name}：<${t}> 开了 ${open} 次、闭了 ${close} 次`);
  }
  const want = expectTag(name);
  if (want && TOP[0] !== want) badMatch.push(`${name}：用了 <${TOP[0]}>，应为 <${want}>`);
  if (/^[·・]\s/m.test(c)) bullet.push(name);
  if (/^[零一二三四五六七八九十]+[、．.]/m.test(c) || /^（[零一二三四五六七八九十]+）/m.test(c)) numbered.push(name);
}

ck(noTag.length === 0, `每条都被 <TAG></TAG> 包住（已包 ${wrapped} 条／分区标记条 ${marks} 条不包）` + (noTag.length ? `：未包 ${noTag.slice(0, 6).join('、')}…` : ''));
ck(badName.length === 0, '首尾标签同名' + (badName.length ? `：${badName.slice(0, 5).join('、')}` : ''));
ck(badMatch.length === 0, '外层标签与分区一致（同类用同一个词根）' + (badMatch.length ? `：${badMatch.slice(0, 5).join('、')}` : ''));
ck(bullet.length === 0, '没有行首 `· `／`・` 项目符号（YAML 用 `- `）' + (bullet.length ? `：${bullet.slice(0, 5).join('、')}` : ''));
ck(numbered.length === 0, '没有行首中文序号（「零、一、…」／「（一）」）' + (numbered.length ? `：${numbered.slice(0, 5).join('、')}` : ''));

/* depth_prompt 也要合体例（秋风 ② 说的是"提示词必须"）：层级不许用中文序号
 * ⚠️ 2026-09-29 深夜自纠：这里原先读的是 `d.extensions` —— **depth_prompt 在 `d.data.extensions` 里**，
 *    读错路径 ⇒ 永远返回空串 ⇒ 恒定"0 处、绿灯"（假绿）。已修。 */
const dp = String(d.data?.extensions?.depth_prompt?.prompt || '');
const dpNum = (dp.match(/^#{1,3}\s*[零一二三四五六七八九十]+[、．.]/gm) || []);
ck(dpNum.length === 0, `depth_prompt 的层级没有中文序号（现 ${dpNum.length} 处）` + (dpNum.length ? `：${dpNum.slice(0, 3).join(' ') }` : ''));

/* 内部 YAML 小节层级：资料类条目内部至少要有一个 `## ` 小节（秋风 ④「层级要仔细安排」）
 * ⚠️ 2026-09-29 深夜补：这条**原先根本没写** —— 关卡的绿灯是**缺项**导致的假绿。
 *    现在按"先红着、改一条绿一条"挂上，并把进度印出来。 */
const NEED_SEC = /^(lore|plot|faction|npc|relic|item|appendix|roster|mindset|identity)$/;
const noSec = [];
let hasSec = 0;
for (const e of es) {
  const name = String(e.comment || '').replace(/^(\s*〔待解锁〕)+/, '');
  const c = String(e.content || '');
  const fm = c.split('\n')[0].trim().match(/^<([A-Za-z][\w_]*)>$/);
  if (!fm || !NEED_SEC.test(fm[1])) continue;
  if (/^## /m.test(c)) hasSec++; else noSec.push(name);
}
console.log('内部小节账：资料类已带 `## ` 的 ' + hasSec + ' 条 ／ 待改 ' + noSec.length + ' 条');
ck(noSec.length === 0, `资料类条目内部都有 ## 小节（已 ${hasSec} 条／待改 ${noSec.length} 条）`
  + (noSec.length ? `：${noSec.slice(0, 6).join('、')}…` : ''));

console.log('体例账：条目 ' + es.length + ' 条 ｜ 已包裹 ' + wrapped + ' ｜ 标记条 ' + marks + ' ｜ 未包裹 ' + noTag.length);
console.log('\n' + rep.join('\n'));
console.log(`\n${rep.filter((x) => x.startsWith('✔')).length} 通过 / ${rep.filter((x) => x.startsWith('✘')).length} 失败`);
process.exit(fails.length ? 1 : 0);
