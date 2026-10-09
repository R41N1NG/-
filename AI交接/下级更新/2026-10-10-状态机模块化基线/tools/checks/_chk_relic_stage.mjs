#!/usr/bin/env node
/**
 * _chk_relic_stage.mjs —— 名器阶段条门禁（2026-10-07 主人令立）
 *
 * 守的两条主人令：
 *   ①「只收紧触发词」——阶段条的 keys **不许**再带持有者名（高频词），只留名器正名与别名；
 *   ②「激活二阶段/三阶段时，前面的阶段条目要被关闭」——任意时刻**只能有一条**阶段条通过闸门。
 *
 * 断言：
 *   1. 每件名器 4 条阶段条，`成形成员`（除烟霞灵乳外）都带成形闸门；
 *   2. 阶段条 keys ＝ 该名器正名 ＋ 别名，且**不含持有者名**；
 *   3. 逐阶段组合求值（只到第 1／2／3／4 阶段）⇒ **恰好 1 条**为真，且就是当前那一条；
 *   4. 闸门必须 fail-closed（求值环境坏掉 ⇒ false）。
 * 用法：& 'C:\Program Files\nodejs\node.exe' tools/checks/_chk_relic_stage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'E:/角色卡制作/仙姝堕';
const CARD = path.join(DIR, '最新角色卡', '仙姝堕.json');
const DB = path.join(DIR, 'src', 'mingqi-db.js');
const CN = ['一', '二', '三', '四'];

const rep = [];
let fail = 0;
const ck = (ok, msg, extra) => { rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`); if (!ok) fail += 1; };

/* 持有者表在构建脚本里（`CARRIERS`）；名器清单从卡内「【名器·简介】」条取，两边都不另编 */
const build = fs.readFileSync(path.join(DIR, '_build_card.js'), 'utf8');
const carriers = new Map();
{
  const i = build.indexOf('const CARRIERS = {');
  const seg = build.slice(i, build.indexOf('};', i));
  for (const m of seg.matchAll(/([^\s,{]+):\s*\[([^\]]*)\]/g)) {
    const names = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    carriers.set(m[1].replace(/['"]/g, ''), names.join('、'));
  }
}
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const entries = card.data.character_book.entries || [];
const relics = entries.filter((e) => String(e.comment).startsWith('【名器·简介】')).map((e) => String(e.comment).replace('【名器·简介】', ''));
/* 每件名器在词库里定义了 3 段还是 4 段 —— 阶段条数必须与之一致（不硬编码 4） */
const stageCount = new Map();
{
  const dbSrc = fs.readFileSync(DB, 'utf8');
  const re = /name:\s*'([^']+)'[\s\S]*?stages:\s*\{([\s\S]*?)\n    \},/g;
  let m;
  while ((m = re.exec(dbSrc))) stageCount.set(m[1], [...m[2].matchAll(/'([一二三四]阶段[^']*)':/g)].length);
}
for (const r of relics) if (!carriers.has(r)) carriers.set(r, '');

const stageEntriesOf = (name) => entries.filter((e) => String(e.comment).startsWith(`【名器·阶段】${name}、`));
const run = (first, known) => {
  const arg = first.replace(/^@@if\s*/, '');
  try { return new Function('variables', 'return (' + arg + ');')({ stat_data: { 身份: '赵无忧', known } }); }
  catch (e) { return 'ERR'; }
};

rep.push(`卡：${CARD}｜词库名器 ${carriers.size} 个`);
ck(relics.length === 13, `应当是 13 件名器（实为 ${relics.length}）`);

const badKeys = [];
const badCount = [];
const badSem = [];
const badClosed = [];
for (const [name, carrier] of carriers) {
  const list = stageEntriesOf(name);
  const wantN = stageCount.get(name) || 4;
  if (list.length !== wantN) { badCount.push(`${name}：阶段条 ${list.length} 条（词库定义 ${wantN} 段）`); continue; }
  for (const e of list) {
    const keys = e.keys || [];
    /* ② 触发词不许带持有者名 */
    const carriersInKeys = carrier.split(/[、／/]/).map((x) => x.trim()).filter(Boolean).filter((c) => keys.includes(c));
    if (carriersInKeys.length) badKeys.push(`${name}：keys 里还有持有者「${carriersInKeys.join('、')}」`);
    /* ④ fail-closed */
    try {
      const broken = new Function('return (' + String(e.content).split('\n')[0].replace(/^@@if\s*/, '') + ');')();
      if (broken !== false) badClosed.push(`${String(e.comment).slice(0, 20)}（坏环境下 ${broken}）`);
    } catch (err) { badClosed.push(`${String(e.comment).slice(0, 20)}（抛异常）`); }
  }
  /* ③ 逐阶段组合 ⇒ 恰好 1 条 */
  /* 前置锚点逐件不同（从闸门原文里读，不另编）：
   *   灵犀同心穴 ⇒ 「灵犀同心成形」（不带「穴」）；烟霞灵乳 ⇒ 「阎雷子脱困」（主人令：柳含烟出场即第二境，故无「成形」锚点）。 */
  const firstGate = String(list[0].content).split('\n')[0];
  const formedAnchor = name === '灵犀同心穴' ? '灵犀同心成形'
    : name === '烟霞灵乳' ? '阎雷子脱困'
    : `${name}成形`;
  const maxN = stageCount.get(name) || 4;
  for (let hi = 1; hi <= maxN; hi += 1) {
    const known = {};
    known[formedAnchor] = true;
    for (let n = 1; n <= hi; n += 1) known[`${name}${CN[n - 1]}阶段`] = true;
    const on = list.filter((e) => run(String(e.content).split('\n')[0], known) === true);
    const want = list.find((e) => String(e.comment).includes(`、${CN[hi - 1]}阶段`));
    if (on.length !== 1 || on[0] !== want) {
      badSem.push(`${name} 到第 ${hi} 阶段 ⇒ 激活 ${on.length} 条${on.length ? '（' + on.map((x) => String(x.comment).slice(-8)).join('/') + '）' : ''}`);
    }
  }
}

ck(badCount.length === 0, '每件名器的阶段条数 == 词库定义的阶段数（9 件 4 段／4 件 3 段）', badCount.slice(0, 4).join('；'));
ck(badKeys.length === 0, '阶段条 keys 不含持有者名（只留名器正名与别名）', badKeys.slice(0, 5).join('；'));
ck(badSem.length === 0, '任意阶段下**恰好一条**阶段条通过闸门（旧阶段自动关闭）', badSem.slice(0, 4).join('；'));
ck(badClosed.length === 0, '所有阶段条闸门 fail-closed（求值坏掉 ⇒ false）', badClosed.slice(0, 4).join('；'));

console.log(rep.join('\n'));
console.log(`\n${fail === 0 ? '✅ 全部通过' : '❌ ' + fail + ' 项未通过'}（名器阶段条：触发词收紧 ＋ 阶段互斥 ＋ fail-closed）`);
process.exit(fail === 0 ? 0 : 2);
