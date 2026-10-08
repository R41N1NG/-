/**
 * P33_guard_semantics.mjs —— 按 **ST-Prompt-Template 自己的实现**验证 `@@if` 装饰器的裁剪语义，
 * 并算出「命中一个名器时到底进多少字」以及「阶段达成后会不会累积」。
 *
 * 依据（扩展源码，原文可核）：
 *   · `src/function/worldinfo.ts:846-865` `isConditionFiltedEntry()`：
 *       `@@if` 的参数被转成 `<%- !!(${argument}) %>` 交给 EJS 求值，**结果 === 'false' ⇒ 该条目被禁用**。
 *   · `docs/features_cn.md:806`：「`@@if`：对条件进行检查，如果结果为 `false`，则排除这个条目」；
 *     `:812` 装饰器必须从条目内容**第一行**开始。
 *   · 求值用的是**原生 EJS**（本机 `ST-Prompt-Template/src/3rdparty/ejs.js`）。
 * 所以本件不是"猜语义"：转换规则照抄扩展源码，求值用扩展自带 EJS。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const EJS = 'E:/tavern/SillyTavern/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js';
const CARD = '最新角色卡/仙姝堕.json';
const ejs = require_(EJS);
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;

/* 照抄 worldinfo.ts 的转换：@@if ARGS ⇒ <%- !!(ARGS) %>，'false' 即排除 */
function 装饰器(entry) {
  const 首行 = String(entry.content || '').split('\n')[0];
  const m = /^@@if[ \t]+(.+)$/.exec(首行);
  return m ? { 有if: true, 参数: m[1].trim() } : { 有if: false };
}
function 通过(entry, vars) {
  const d = 装饰器(entry);
  if (!d.有if) return true;                                        /* 无 @@if ⇒ 不裁剪 */
  const out = ejs.render('<%- !!(' + d.参数 + ') %>', { variables: vars }, {});
  return out !== 'false';                                          /* 扩展：'false' ⇒ 排除 */
}
const 字数 = (arr) => arr.reduce((a, e) => a + (e.content || '').length, 0);

const 局面 = (known, 段位 = 7, 仙盟历 = 1577.07) => ({ stat_data: { 身份: '赵无忧', 段位, 仙盟历, known: Object.assign({ 极乐引入手: true }, known || {}) } });
const 名器条 = es.filter((e) => /名器/.test(e.comment || ''));
const 九幽 = 名器条.filter((e) => /九幽玄阴/.test(e.comment || ''));

const 局面表 = [
  ['A 未成形（known 空）', 局面({})],
  ['B 成形 ＋ 一阶段', 局面({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true })],
  ['C 成形 ＋ 一/二/三阶段', 局面({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true, 九幽玄阴穴二阶段: true, 九幽玄阴穴三阶段: true })],
  ['D 四阶段全达成', 局面({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true, 九幽玄阴穴二阶段: true, 九幽玄阴穴三阶段: true, 九幽玄阴穴四阶段: true })],
];

let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✔ ' : '  ✘ ') + msg); if (!ok) fail++; };

console.log('【依据】ST-Prompt-Template/src/function/worldinfo.ts:846-865（@@if ⇒ <%- !!(参数) %>，\'false\' 即排除该条目）');
console.log('【EJS】' + EJS + '\n');

console.log('══ 「九幽玄阴穴」相关条目在各局面下谁被排除、进多少字 ══');
for (const [名, vars] of 局面表) {
  const 进 = 九幽.filter((e) => 通过(e, vars));
  const 排 = 九幽.filter((e) => !通过(e, vars));
  console.log('· ' + 名 + ' ⇒ 进 ' + 进.length + ' 条 / 排除 ' + 排.length + ' 条｜进的字数 ' + 字数(进)
    + '｜排除：' + (排.map((e) => 'id' + e.id).join('、') || '（无）'));
}

/* 断言：语义必须是"假 ⇒ 排除" */
{
  const A = new Map(九幽.map((e) => [e.id, 通过(e, 局面({}))]));
  ck(A.get(152) === false && A.get(153) === false && A.get(154) === false && A.get(155) === false && A.get(156) === false,
    '未成形时：简介与四个阶段**全部被排除**（只有无闸门的本体 id214 恒在）');
  const B = new Map(九幽.map((e) => [e.id, 通过(e, 局面({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true }))]));
  ck(B.get(152) === true && B.get(153) === true && B.get(154) === false && B.get(155) === false && B.get(156) === false,
    '成形＋一阶段时：只有「简介 ＋ 一阶段」进，二/三/四阶段被排除');
  const D = new Map(九幽.map((e) => [e.id, 通过(e, 局面({ 九幽玄阴穴成形: true, 九幽玄阴穴一阶段: true, 九幽玄阴穴二阶段: true, 九幽玄阴穴三阶段: true, 九幽玄阴穴四阶段: true }))]));
  ck(D.get(152) === true && D.get(156) === true && D.get(214) === true && D.get(153) === false && D.get(154) === false && D.get(155) === false,
    '四阶段全达成时：进的是「简介 ＋ **四阶段** ＋ 本体」，一/二/三阶段被排除 ⇒ **每件名器任一时刻只有 1 个阶段条**（闸门自带 !下一阶段）');

  /* 全名器：任一局面下，同一名器的阶段条最多 1 条进 */
  const 名器名集 = [...new Set(名器条.map((e) => (/【名器·阶段】([^、]+)、/.exec(e.comment || '') || [])[1]).filter(Boolean))];
  let 最多 = 0;
  for (const 名 of 名器名集) {
    for (const [名2, vars2] of 局面表.concat([['E 只立二阶段', 局面({ [名 + '成形']: true, [名 + '二阶段']: true })]])) {
      const 该名器阶段进 = 名器条.filter((e) => new RegExp('【名器·阶段】' + 名 + '、').test(e.comment || '')).filter((e) => 通过(e, vars2));
      最多 = Math.max(最多, 该名器阶段进.length);
    }
  }
  ck(最多 <= 1, '全部 ' + 名器名集.length + ' 件名器、各 5 种局面下，单件名器**同时进上下文的阶段条最多 ' + 最多 + ' 条**（玩家担心的"四阶段一起注入"不成立）');
}

/* 全名器累计量：假设所有名器四阶段全达成 */
const 全达成known = { 极乐引入手: true };
for (const e of 名器条) {
  const c = e.comment || '';
  const m = /【名器·阶段】([^、]+)、([一二三四])阶段/.exec(c);
  if (m) 全达成known[m[1] + '成形'] = true, 全达成known[m[1] + m[2] + '阶段'] = true;
  const m2 = /【名器·简介】(.+)$/.exec(c);
  if (m2) 全达成known[m2[1] + '成形'] = true;
}
const vars全 = 局面(全达成known);
const 全进 = 名器条.filter((e) => 通过(e, vars全));
console.log('\n【极端情形】若 13 件名器全部走到第四阶段：名器条目进 ' + 全进.length + ' / ' + 名器条.length
  + ' 条，合计 **' + 字数(全进) + ' 字**（单次注入量级；= ' + Math.round(字数(全进) * 0.75) + ' token 粗估）');
console.log('   对照：名器条目原文合计 ' + 字数(名器条) + ' 字 ⇒ 说明闸门仍在排除未达成项，但**已达成的历史阶段不会被裁掉**。');

/* 无闸门的名器条（唯一会"无条件注入"的） */
const 无闸 = 名器条.filter((e) => !装饰器(e).有if);
console.log('\n【无 @@if 装饰器的名器条目】（命中 keys 即整条注入，无闸可裁）');
for (const e of 无闸) console.log('  · id' + e.id + ' ' + e.comment + '｜' + e.content.length + ' 字｜constant=' + (e.constant === true) + '｜keys=' + JSON.stringify((e.keys || []).slice(0, 8)) + (e.keys && e.keys.length > 8 ? ' …共' + e.keys.length + ' 个' : ''));

console.log('\n' + (fail ? '✘ ' + fail + ' 项不符' : '✔ 语义与断言全部符合'));
process.exit(fail ? 1 : 0);
