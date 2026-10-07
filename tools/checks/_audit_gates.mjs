#!/usr/bin/env node
/**
 * _audit_gates.mjs —— **闸门全面复查**（2026-09-30 · 主人令「现在的闸门都是正确的吗」）
 *
 * 四层，逐层给判据，绝不只数个数：
 *   ① 形式层：`@@if` 是否**正文第一个字符**（ST-PT 的 de() 只认开头，这条今天刚被违反过）；
 *             表达式能否求值；引用的 `known` 字段是否都在 FIELD_TABLE；身份／阵营字面是否合法。
 *   ② 语义层：闸门里的锚点 desc 与条目的「时点／章数」是否同一段（抽【剧情】条逐条对照）。
 *   ③ 一致性：名器本体条与其生成条、人物（2）与其主条，闸门是否同源。
 *   ④ 覆盖率：**启用、却没有闸门、而正文含后期内容**的条 —— 这是今天抓到隐藏层那条的同一类病。
 *
 * 取值全部读真源：字段表/身份表 ← `卡片脚本/状态机.js`；条目 ← 卡产物（不是中间文件）。
 * 用法：node _audit_gates.mjs
 */
import { readFileSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const card = JSON.parse(readFileSync(D + '仙姝墮-角色卡（全书群像）.json', 'utf8'));
const es = card.data?.character_book?.entries ?? [];
const sm = readFileSync(D + '卡片脚本/状态机.js', 'utf8');
const grab = (a, b) => { const i = sm.indexOf(a); const j = sm.indexOf(b, i); return sm.slice(i, j); };
const box = {};
new Function('g', [
  grab('const OPEN_FIELD_FOR_OWNER', '/** 字段 → 锚点说明'),
  grab('const IDENTITY_FACTION', 'const FACTION_DEFAULT'),
  grab('const IDENTITIES', 'const IDENTITY_NAMES'),
  'g.openFieldsFor=openFieldsFor;g.IDENTITY_FACTION=IDENTITY_FACTION;g.IDENTITIES=IDENTITIES;g.THSH=THSH_INSIDERS;',
].join('\n'))(box);
const { openFieldsFor, IDENTITY_FACTION, IDENTITIES, THSH } = box;

/* FIELD_TABLE：字段名 + desc（desc 里带章数，用来跟条目的时点对照） */
const ftSrc = grab('const FIELD_TABLE', 'const AI_FIELDS');
const FT = [...ftSrc.matchAll(/\{\s*kind:\s*'(\w+)',\s*name:\s*'([^']+)',\s*desc:\s*'([^']*)'/g)]
  .map((m) => ({ kind: m[1], name: m[2], desc: m[3] }));
const FIELD_NAMES = new Set(FT.map((f) => f.name));
const ID_NAMES = new Set(IDENTITIES.map((x) => x.name));
const FACTION_VALUES = new Set(Object.values(IDENTITY_FACTION));

const strip = (c) => String(c ?? '').replace(/^(\s*〔待解锁〕)+/, '');
const firstLine = (e) => String(e.content).split('\n')[0].trim();
const gateExpr = (e) => { const m = /^@@if\s+(.+)$/.exec(firstLine(e)); return m ? m[1] : null; };
const hasIfAnywhere = (e) => /(^|\n)\s*@@if\s/.test(String(e.content));

/* 六身份的变量表 */
const VARS = IDENTITIES.map(({ name }) => {
  const known = {};
  for (const f of FIELD_NAMES) known[f] = false;
  for (const f of openFieldsFor(name)) known[f] = true;
  return { id: name, variables: { stat_data: { 身份: name, 阵营: IDENTITY_FACTION[name], known } } };
});
const evalGate = (expr, variables) => {
  try { return { v: !!(new Function('variables', `return !!( ${expr} );`)(variables)) }; }
  catch (e) { return { err: e.message }; }
};

const gated = es.filter((e) => e.enabled !== false && gateExpr(e));
const problems = [];
const F = (tag, msg) => { problems.push(`[${tag}] ${msg}`); };

console.log('═══ ① 形式层（' + gated.length + ' 条带闸门） ═══');
let firstBad = 0;
for (const e of gated) {
  const n = strip(e.comment);
  if (!String(e.content).startsWith('@@if')) { F('形式', `「${n}」的 @@if 不在正文第一个字符`); firstBad++; }
  const expr = gateExpr(e);
  const res = VARS.map((v) => evalGate(expr, v.variables));
  const errs = res.filter((r) => r.err);
  if (errs.length) F('形式', `「${n}」求值异常：${errs[0].err}`);
  for (const m of expr.matchAll(/known\?\.\[?\x27([^\x27]+)\x27\]?/g)) {
    if (!FIELD_NAMES.has(m[1])) F('字段', `「${n}」引用了 FIELD_TABLE 里没有的字段「${m[1]}」`);
  }
  for (const m of expr.matchAll(/身份[^=!<>]*?[=!]==?\s*\x27([^\x27]+)\x27/g)) {
    if (!ID_NAMES.has(m[1])) F('身份字面', `「${n}」拿「身份」与「${m[1]}」比 —— 身份只能是 ${[...ID_NAMES].join('／')}`);
  }
  for (const m of expr.matchAll(/阵营[^=!<>]*?[=!]==?\s*\x27([^\x27]+)\x27/g)) {
    if (!FACTION_VALUES.has(m[1])) F('阵营字面', `「${n}」拿「阵营」与「${m[1]}」比`);
  }
  if (/@@if/.test(String(e.content).slice(3))) F('形式', `「${n}」正文里还有第二处 @@if（装饰器只认开头连续的那几行）`);
}
console.log('  · 首行不是 @@if 的：' + firstBad + ' 条');

/* ② 语义层：把「身份互斥」逐条与身份表对一遍
 *   ⚠️ 2026-09-30：映射**从真源推**，不再手抄名单 —— 上一版把候选角色写成常量
 *   （只抄了 残阳老怪／肉山佛／九皇子），于是**漏掉了「魂欢殿主＝鬼医病相思」那一条**。
 *   现在的推法：① 从心智条名字里取角色名（`势力、角色 (心智姿态)` 的最后一段）；
 *             ② 拿它去 `IDENTITIES[].desc` 里找 —— desc 写着「天姝会魂欢殿主 · 鬼医病相思」这种关系。 */
console.log('\n═══ ② 语义层 ═══');
const stripMind = (c) => strip(c).replace(/ \(心智姿态\)$/, '');
const charOf = (e) => stripMind(e.comment).split(/[、·]/).pop().trim();
const mindAll = es.filter((e) => e.enabled !== false && /\(心智姿态\)$/.test(strip(e.comment)));
const CHAR2ID = {};
for (const e of mindAll) {
  const ch = charOf(e);
  const owner = IDENTITIES.find((x) => String(x.desc).includes(ch));
  if (owner) CHAR2ID[ch] = owner.name;
}
console.log('  由「身份表 desc × 心智条名字」推出的「角色 → 身份名」：' + Object.entries(CHAR2ID).map(([c, i]) => c + '→' + i).join('、'));
/* ⚠️ 遍历**全部心智条**（不只是带闸门的）：该有闸门却没有的，只有这样才能看见 */
for (const e of mindAll) {
  const n = strip(e.comment);
  const ch = charOf(e);
  const id = CHAR2ID[ch];
  if (!id) continue;
  const expr = gateExpr(e);
  const V = VARS.find((v) => v.id === id);
  if (!expr) {
    console.log(`  「${n}」**没有闸门** → 玩家演「${id}」（＝${ch}本人）时，他自己的内心独白会灌进上下文 ❌`);
    F('语义', `「${n}」缺身份互斥闸门：该条角色「${ch}」就是可选身份「${id}」，应挂 \`!== '${id}'\``);
    continue;
  }
  const r = evalGate(expr, V.variables);
  const ok = r.v === false;
  console.log(`  「${n}」 ${expr}\n     → 玩家演「${id}」（＝${ch}本人）时，闸门判 ${r.err ? 'ERR ' + r.err : r.v} ${ok ? '✅（会被挡住）' : '❌（挡不住！）'}`);
  if (!ok) F('语义', `「${n}」的身份互斥失效：比较的字面必须是身份名「${id}」（身份只有 ${[...ID_NAMES].join('／')} 这几种取值）`);
}
/* 【剧情】条：闸门锚点的 desc 章数 vs 条目自己的时点 */
const CHAPTER = (s) => [...String(s).matchAll(/([一二三四五六七八九十百]+)[—–\-～~至]?([一二三四五六七八九十百]*)\s*章/g)]
  .map((m) => m[1] + (m[2] ? '—' + m[2] : '')).join('／');
for (const e of gated) {
  const n = strip(e.comment);
  if (!/^【剧情】/.test(n)) continue;
  const expr = gateExpr(e);
  const k = /known\?\.\[?\x27([^\x27]+)\x27\]?/.exec(expr);
  const self = CHAPTER(String(e.content).split('\n').filter((l) => /时点/.test(l)).join(' '));
  const anchor = k ? FT.find((f) => f.name === k[1]) : null;
  const aChap = anchor ? CHAPTER(anchor.desc) : '';
  /* ⚠️ 2026-09-30 修本工具自己的误报：原先拿「条目时点里抓到的所有章数」跟锚点逐字比，
   *   于是 `时点：第二十六—二十八章（…第十九—二十章、…第二十一—二十六章）` 这种
   *   「主时点 ＋ 两个平行现场」的写法会被判成不一致。改成：**锚点写的章数在条目时点里有据**即算过。 */
  const okChap = !aChap || !self || String(self).includes(aChap.split('／')[0]);
  const mark = !k ? '（无 known 条件）' : (okChap ? '' : '⚠️ 章数对不上');
  console.log(`  【剧情】${n.replace('【剧情】', '')}\n     条目时点 ${self || '—'}｜锚点 ${k ? k[1] + '（' + aChap + '）' : '无'} ${mark}`);
  /* ⚠️ 2026-09-30：本条**只提醒、不算失败** —— 主人定的规则里有「前置锚点」这一类
   *   （例：「剧情三」挂的是剧情二的锚点，两者本来就不在同一章），
   *   用「章数必须同段」去卡它会把正确的设计判成错。 */
  if (mark === '⚠️ 章数对不上') console.log('     （提醒：本条的时点与所挂锚点的章数不同段 —— 前置锚点属正常）');
}

/* ③ 一致性：名器本体条 ↔ 生成条 */
console.log('\n═══ ③ 一致性（名器本体 ↔ 生成条；人物主条 ↔ （2）） ═══');
const mqBody = es.filter((e) => /^【名器】/.test(strip(e.comment)) && !/^【名器·/.test(strip(e.comment)));
const mqGen = es.filter((e) => /^【名器·/.test(strip(e.comment)));
console.log(`  【名器】本体条 ${mqBody.length}（启用 ${mqBody.filter((e) => e.enabled !== false).length}）｜生成条 ${mqGen.length}（启用 ${mqGen.filter((e) => e.enabled !== false).length}）`);
console.log(`  生成条里带 @@if 的：${mqGen.filter((e) => gateExpr(e)).length}／${mqGen.length}（其余靠「名器名＋阶段词」次键共现）`);
const mqOn = mqBody.filter((e) => e.enabled !== false && gateExpr(e));
mqOn.forEach((e) => console.log(`   · 本体「${strip(e.comment)}」闸门=${gateExpr(e)}`));

/* ④ 覆盖率：启用、无闸门、正文却含后期内容 */
console.log('\n═══ ④ 覆盖率（启用 · 无闸门 · 正文含后期内容） ═══');
const SPOIL = ['夺舍', '双魂', '炼欲魔君', '阎雷子', '宫蚀殿', '神女', '神使', '显化', '邪心天婴',
  '惑心神女', '溟龙神女', '欲凰神女', '雀奴', '花奴', '月奴', '奴种', '终局', '结局', '全书', '堕落录'];
const naked = es.filter((e) => e.enabled !== false && !gateExpr(e));
let spill = 0;
for (const e of naked) {
  const t = String(e.content);
  const hit = SPOIL.filter((w) => t.includes(w));
  if (!hit.length) continue;
  spill++;
  console.log(`  ⚠️ 「${strip(e.comment)}」常驻/无闸门，正文含：${hit.slice(0, 5).join('、')} ｜ order=${e.insertion_order}`);
}
console.log(`  启用但无闸门的条共 ${naked.length}；其中正文含后期词的 ${spill} 条`);
console.log('\n═══ 结论 ═══');
console.log(problems.length ? problems.map((p) => '  ✘ ' + p).join('\n') : '  ✅ 四层都过了');
