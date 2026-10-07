#!/usr/bin/env node
/**
 * _chk_panel_regex_cases.mjs —— 状态栏渲染正则的**边界用例**验收（2026-09-28 第二十六轮）
 *
 * 为什么要有：主人两次反馈"正文里漏出 `<Status_block>` 原文"，都是**正则不命中**造成的。
 *   本脚本把各种真实形态固化成用例，任何一次改正则都必须全过。
 *
 * 用法：node _chk_panel_regex_cases.mjs
 * 退出码：0 全过 / 2 有失败
 */
import { readFileSync } from 'node:fs';

const card = JSON.parse(readFileSync('仙姝墮-角色卡（全书群像）.json', 'utf8').replace(/^\uFEFF/, ''));
const render = card.data.extensions.regex_scripts.find((r) => /状态栏渲染|^仙姝墮·状态栏$/.test(r.scriptName));
const purge = card.data.extensions.regex_scripts.find((r) => /净化历史状态栏/.test(r.scriptName));
if (!render) { console.error('找不到渲染条'); process.exit(2); }
const F = String(render.findRegex);
console.log('渲染条 findRegex：' + F + '\n');

const ok = [];
const bad = [];
const ck = (c, l) => (c ? ok : bad).push(l);

/** 用同一条正则做一次替换，返回 [是否命中, 是否还有裸 Status_block 残留] */
const hit = (text) => {
  const re = new RegExp(F, 'g');
  const m = re.exec(text);
  const replaced = text.replace(new RegExp(F, 'g'), '«PANEL»');
  return { matched: !!m, len: m ? m[0].length : 0, replaced };
};

const BODY = '他把玉简收进袖中，浑浊的双眼亮了一亮。';
const FULL = BODY + '\n\n<Status_block>\n<地点>北域 · 毒瘴沼泽</地点>\n<修为>元婴中期</修为>\n</Status_block>';

/* ① 完整块：应命中，吃掉整块，正文保留 */
{
  const r = hit(FULL);
  ck(r.matched, '① 完整块命中');
  ck(r.replaced.includes(BODY) && r.replaced.includes('«PANEL»'), '① 正文保留、状态块换成面板');
  ck(!r.replaced.includes('<Status_block>'), '① 替换后无裸 Status_block 残留');
}
/* ② 截断（写到一半就断了，结尾停在半个标签里）——**主人两次踩到的正是这个** */
{
  const t = BODY + '\n\n<Status_block>\n<地点>北域 · 毒瘴沼泽</地点>\n<环境>药鼎碎片泡在毒液';
  const r = hit(t);
  ck(r.matched, '② 截断（结尾停在半截标签里）命中');
  ck(!r.replaced.includes('<Status_block>'), '② 截断时不留裸 Status_block（这就是"漏出原文"的修复点）');
  ck(r.replaced.includes(BODY), '② 正文仍然保留');
}
/* ③ 截断得更狠：连 `</Status_block>` 都没写，块尾就是消息尾 */
{
  const t = BODY + '\n\n<Status_block>\n<地点>北域 · 毒瘴沼泽</地点>';
  const r = hit(t);
  ck(r.matched, '③ 无闭合、块尾即消息尾 ⇒ 命中');
  ck(!r.replaced.includes('<Status_block>'), '③ 不留原文');
}
/* ④ **不能误吃正文**：消息里有状态块 + 后面大段正文（多楼历史拼起来的情形） */
{
  const t = BODY + '\n\n<Status_block>\n<地点>A</地点>\n</Status_block>\n\n' + '后续正文很长很长'.repeat(30);
  const r = hit(t);
  ck(r.matched, '④ 块后有后续正文 ⇒ 命中');
  ck(r.replaced.includes('后续正文很长很长'), '④ **没有**把块后的正文吞掉');
  ck(r.len < 120, `④ 只吃掉状态块本身（实测匹配 ${r.len} 字）`);
}
/* ⑤ 完全没有状态块 ⇒ 必须不命中（否则整条正文会被换掉） */
{
  const r = hit('这一楼没有状态栏，纯叙事。');
  ck(!r.matched, '⑤ 无状态块时不命中（绝不吞正文）');
}
/* ⑥ 双轨制：两条 findRegex 逐字相同 */
ck(!!purge && String(purge.findRegex) === F, '⑥ 双轨制：渲染条与剔除条的 findRegex 逐字相同');

console.log('【状态栏正则边界用例】\n');
for (const l of ok) console.log('  ✔ ' + l);
if (bad.length) { console.log('\n【失败】\n  ' + bad.join('\n  ')); console.log(`\n${ok.length} 过 / ${bad.length} 败`); process.exit(2); }
console.log(`\n✅ 全部通过（${ok.length} 项）`);
