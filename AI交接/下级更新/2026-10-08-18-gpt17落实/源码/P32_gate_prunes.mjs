/**
 * P32_gate_prunes.mjs —— 用**卡实际运行的原生 EJS** 验证「@@if 为假 ⇒ 整条不出现在注入内容里」。
 * 这是回答玩家「名器四阶段都注入会不会 token 爆炸」的关键实证：闸门为假时阶段正文**根本不在**。
 * 只读。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const EJS = 'E:/tavern/SillyTavern/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js';
const CARD = '最新角色卡/仙姝堕.json';
const ejs = require_(EJS);
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;
const by = (id) => es.find((e) => e.id === id);

const 阶段1 = by(153);   // 【名器·阶段】九幽玄阴穴、一阶段（落红）
const 简介 = by(152);   // 【名器·简介】九幽玄阴穴
const 本体 = by(214);   // 【名器】九幽玄阴穴（真源本体，无阶段闸门）
const 反应律 = by(213); // 【名器】交欢反应律（无 EJS 闸门，keys 含泛词）

const V = (known) => ({ stat_data: { 身份: '赵无忧', 段位: 7, 仙盟历: 1579.01, known: Object.assign({ 极乐引入手: true }, known || {}) } });

const 取标记 = (content) => {
  /* 取正文里一段可辨识的特征串（用于判断"整条有没有被注入"） */
  const m = content.replace(/^@@if[^\n]*\n/, '').trim().split('\n').filter((l) => l.length > 12);
  return m.length ? m[0].slice(0, 24) : content.slice(0, 24);
};

const cases = [
  ['阶段一 · 闸门为假（成形未立）', 阶段1, V({}), false],
  ['阶段一 · 闸门为假（成形立但一阶段未立）', 阶段1, V({ 九幽玄阴穴成形: true }), false],
  ['阶段一 · 闸门为真（成形立 ＋ 一阶段立）', 阶段1, V({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true }), true],
  ['简介 · 闸门为假（成形未立）', 简介, V({}), false],
  ['简介 · 闸门为真（成形立）', 简介, V({ 九幽玄阴穴成形: true }), true],
  ['真源本体（无闸门）· 恒在', 本体, V({ 九幽玄阴穴成形: true }), true],
];

let ok = 0, total = 0;
console.log('【原生 EJS】' + EJS);
console.log('【卡】' + CARD + '\n');
for (const [名, e, vars, 期望注入] of cases) {
  const out = ejs.render(e.content, { variables: vars }, {});
  const 标记 = 取标记(e.content);
  const 注入 = out.includes(标记);
  total++;
  const pass = 注入 === 期望注入;
  if (pass) ok++;
  console.log((pass ? '✔ ' : '✘ ') + 名 + '｜id' + e.id + '（原 ' + e.content.length + ' 字 ⇒ 渲染 ' + out.length + ' 字）'
    + '｜' + (注入 ? '**整条注入**' : '**整条不注入**') + '（期望 ' + (期望注入 ? '注入' : '不注入') + '）');
}

/* 名器命中那一楼的"实际注入量"：本体 ＋ 简介(闸门假) ＋ 4 阶段(只有当前段真) */
const vars = V({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true });
let 实际 = 0;
for (const e of es.filter((x) => /九幽玄阴/.test(x.comment || ''))) {
  const out = ejs.render(e.content, { variables: vars }, {});
  实际 += out.length;
}
const 无闸 = es.filter((x) => /九幽玄阴/.test(x.comment || '')).reduce((a, x) => a + (x.content || '').length, 0);
console.log('\n『九幽玄阴穴』相关条目：原文合计 ' + 无闸 + ' 字；**只留当前阶段（一阶段）后 EJS 实际输出 ' + 实际 + ' 字**'
  + '（省下 ' + (无闸 - 实际) + ' 字，' + Math.round((1 - 实际 / 无闸) * 100) + '%）');

console.log('\n【无闸门条目】id' + 反应律.id + ' ' + 反应律.comment + '：' + 反应律.content.length
  + ' 字｜constant=' + (反应律.constant === true) + '｜keys 含泛词（名器/交欢/双修/纯阳…）⇒ 命中即整条注入，没有闸可裁。');

console.log('\n' + (ok === total ? '✔ 全部通过（' + total + ' 例）' : '✘ ' + (total - ok) + ' 例不符'));
process.exit(ok === total ? 0 : 1);
