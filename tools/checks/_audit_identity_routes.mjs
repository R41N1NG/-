#!/usr/bin/env node
/**
 * _audit_identity_routes.mjs —— **六身份路线体检**（2026-09-30 · 二·1）
 *
 * 目的：回答「换了身份之后，这个身份的**知识底座**到底是什么」。
 *   `@@if` 闸门修好之后，必须逐身份验一遍：哪些条目会进上下文、哪些够得着却没被提到、
 *   哪些**永远进不来**（＝这个身份的盲区，得确认是设计意图而不是漏挂）。
 *
 * 口径（全部读真源，不手抄）：
 *   · 身份名单／阵营  ← `卡片脚本/状态机.js` 的 `IDENTITIES`／`IDENTITY_FACTION`
 *   · 起手 `known`    ← `THSH_INSIDERS`／`openFieldsFor()`（四殿主：天姝会存在＋极乐引入手 起手 true）
 *   · 条目与闸门      ← `仙姝墮-角色卡（全书群像）.json`（**产物为准**，不是中间文件）
 *   · 开场白          ← `_card_greetings.txt` 的 `@@@ <身份名>` 段（first_mes ＝「赵无忧」段）
 *
 * 匹配规则（照 ST `world-info.js` 的口径）：
 *   · `constant:true` ⇒ 无条件进（但仍受闸门约束）
 *   · 其余 ⇒ 主键命中扫描文本才算候选；有次键时按 `selectiveLogic`
 *     （0 AND_ANY／1 AND_ALL／2 NOT_ANY／3 NOT_ALL）再判一次
 *   · 闸门 `@@if <expr>` ⇒ 用该身份的 `variables.stat_data` 求值，假则**整条不进**
 *   · **扫描文本＝该身份的开场白**（第一回合，玩家还没有发言）——这是最保守的估计：
 *     开局之后玩家一说话，命中面只会变大，不会变小。
 *
 * 用法：node _audit_identity_routes.mjs [--md 输出.md]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const CARD = JSON.parse(readFileSync(D + '仙姝墮-角色卡（全书群像）.json', 'utf8'));
const entries = CARD.data.character_book.entries ?? [];
const sm = readFileSync(D + '卡片脚本/状态机.js', 'utf8');

/* ---- 从状态机.js 取真源 ---- */
const grab = (startPat, endPat) => {
  const a = sm.indexOf(startPat);
  const b = sm.indexOf(endPat, a);
  if (a < 0 || b < 0) { console.error('✗ 状态机.js 里找不到 ' + startPat); process.exit(2); }
  return sm.slice(a, b);
};
const box = {};
const code = [
  grab('const OPEN_FIELD_FOR_OWNER', '/** 字段 → 锚点说明'),
  grab('const IDENTITY_FACTION', 'const FACTION_DEFAULT'),
  grab('const IDENTITIES', 'const IDENTITY_NAMES'),
].join('\n');
new Function('g', code + '\ng.THSH_INSIDERS=THSH_INSIDERS;g.openFieldsFor=openFieldsFor;g.IDENTITY_FACTION=IDENTITY_FACTION;g.IDENTITIES=IDENTITIES;')(box);
const { THSH_INSIDERS, openFieldsFor, IDENTITY_FACTION, IDENTITIES } = box;

/* ---- 开场白：`_card_greetings.txt` 的 `@@@ <身份名>` 段 ---- */
function sections(file) {
  const txt = readFileSync(D + file, 'utf8').replace(/^\uFEFF/, '');
  const out = {};
  for (const p of txt.split(/^@@@ /m).slice(1)) {
    const nl = p.indexOf('\n');
    out[p.slice(0, nl).trim()] = p.slice(nl + 1).replace(/\r?\n$/, '');
  }
  return out;
}
const greetings = sections('_card_greetings.txt');

/* ---- 逐身份求值 ---- */
const strip = (c) => String(c ?? '').replace(/^(\s*〔待解锁〕)+/, '');
const klass = (c) => {
  const n = strip(c);
  if (/^━/.test(n)) return '分区标记';
  if (/\(心智姿态\)$/.test(n)) return '心智姿态';
  if (/^【身份】/.test(n)) return '身份';
  const m = /^【([^】]+)】/.exec(n);
  return m ? m[1] : n;
};
const gateOf = (content) => {
  const first = String(content ?? '').split('\n')[0].trim();
  const m = /^@@if\s+(.+)$/.exec(first);
  return m ? m[1] : null;
};
const evalGate = (expr, variables) => {
  if (expr === null) return true;
  try { return { v: !!(new Function('variables', `return !!( ${expr} );`)(variables)) }; }
  catch (e) { return { err: e.message }; }
};
function keyHit(e, text) {
  const keys = e.keys ?? [];
  const sec = e.secondary_keys ?? [];
  if (keys.length && !keys.some((k) => text.includes(k))) return false;
  if (!keys.length) return false;
  if (!sec.length || e.selective === false) return true;
  const inText = sec.filter((k) => text.includes(k));
  switch (e.extensions?.selectiveLogic ?? 0) {
    case 1: return inText.length === sec.length;          // AND_ALL
    case 2: return inText.length === 0;                   // NOT_ANY
    case 3: return inText.length < sec.length;            // NOT_ALL
    default: return inText.length > 0;                    // AND_ANY
  }
}

const REPORT = [];
const P = (s) => { console.log(s); REPORT.push(s); };

for (const { name } of IDENTITIES) {
  const known = {};
  for (const f of ['极乐引入手', '邪修洞府替孤月中毒', '已抵达天溪', '孤月定情', '玄机子装伤', '赵无忧坠渊',
    '玄机子胁迫过叶红缨', '红缨分裂成形', '封元镇灵环', '灼酒流炎穴成形', '雀奴身份成立', '孤月失守',
    '双线并置', '天姝会存在']) known[f] = false;
  for (const f of openFieldsFor(name)) known[f] = true;
  const variables = { stat_data: { 身份: name, 阵营: IDENTITY_FACTION[name], known } };

  const text = greetings[name] ?? (name === '赵无忧' ? CARD.data.first_mes : '');
  const on = entries.filter((e) => e.enabled !== false);

  const gated = on.filter((e) => gateOf(e.content) !== null);
  const gateTrue = gated.filter((e) => evalGate(gateOf(e.content), variables).v === true);
  const gateFalse = gated.filter((e) => evalGate(gateOf(e.content), variables).v === false);
  const gateErr = gated.filter((e) => evalGate(gateOf(e.content), variables).err);

  const reached = on.filter((e) => e.constant === true || keyHit(e, text || ''));
  const willEnter = reached.filter((e) => {
    const g = evalGate(gateOf(e.content), variables);
    return g.v === true || g.v === undefined;
  });

  P(`\n${'═'.repeat(72)}`);
  P(`■ 身份「${name}」（阵营 ${IDENTITY_FACTION[name]}）｜起手 known 为 true：${openFieldsFor(name).join('、') || '（无）'}`);
  P(`  开场白 ${(text || '').length} 字｜卡内启用条目 ${on.length} 条`);
  P(`  ① 闸门判真 ${gateTrue.length} 条 ／ 判假 ${gateFalse.length} 条 ／ 求值异常 ${gateErr.length} 条`);
  P(`  ② 本题材（开场白）触发到的 ${reached.length} 条；其中闸门放行的 ${willEnter.length} 条`);
  const byK = {};
  for (const e of willEnter) (byK[klass(e.comment)] ??= []).push(strip(e.comment));
  P(`  ③ 实际进上下文，按类：`);
  for (const [k, v] of Object.entries(byK).sort((a, b) => b[1].length - a[1].length)) {
    P(`     ${k}（${v.length}）：${v.map((s) => s.replace(/^【[^】]*】/, '')).join('、')}`);
  }
  const blocked = gateFalse.filter((e) => reached.some((r) => r === e));
  if (blocked.length) P(`  ④ 触发到了但被闸门挡住：${blocked.map((e) => strip(e.comment)).join('、')}`);
  const reachable = gateTrue.filter((e) => !reached.includes(e));
  P(`  ⑤ 闸门判真、但本题材没提到（玩家一提到就会进）${reachable.length} 条：${reachable.map((e) => strip(e.comment)).join('、') || '（无）'}`);
  if (gateErr.length) P(`  ⚠️ 闸门求值异常：${gateErr.map((e) => strip(e.comment)).join('、')}`);

  /* 专项：剧情条与身份闸门的人物条 */
  const plot = on.filter((e) => /^【剧情】/.test(strip(e.comment)));
  const plotIn = plot.filter((e) => evalGate(gateOf(e.content), variables).v === true);
  P(`  ★【剧情】条 ${plot.length} 条，本身份闸门判真：${plotIn.length} 条${plotIn.length ? '（' + plotIn.map((e) => strip(e.comment).slice(0, 12)).join('、') + '）' : ''}`);
  const npcGated = on.filter((e) => /^【人物】/.test(strip(e.comment)) && /身份/.test(gateOf(e.content) ?? ''));
  const npcIn = npcGated.filter((e) => evalGate(gateOf(e.content), variables).v === true);
  P(`  ★ 按身份收放的【人物】条 ${npcGated.length} 条，本身份判真：${npcIn.length} 条${npcIn.length ? '（' + npcIn.map((e) => strip(e.comment).replace('【人物】', '')).join('、') + '）' : ''}`);
}

P(`\n${'═'.repeat(72)}`);
P('口径说明：扫描文本只取该身份的开场白（第一回合、玩家未发言）——最保守估计；');
P('实际游玩里玩家一说话，主键命中面只会变大。constant 条无条件进（名单随类列出）。');

const mdOut = process.argv[process.argv.indexOf('--md') + 1];
if (process.argv.includes('--md') && mdOut) { writeFileSync(mdOut, REPORT.join('\n') + '\n', 'utf8'); console.log('\n已写出 ' + mdOut); }
