#!/usr/bin/env node
/**
 * _chk_names.mjs —— **条目名自洽关卡**（2026-09-30 新增）
 *
 * 为什么要有这一关：2026-09-29 深夜，册子里 61 条条目的**名字被写成了别的条目**的名字
 * （5 条分区标记 ＋ 21 条【设定】/【剧情】 ＋ 35 条【势力】/【人物】/【名器】/【物品】），
 * 其中 21 条因为名字尾巴带上了 `(心智姿态)`，被 `_build_card.js:485` 当成了心智模块，
 * 以 `order 50 / depth 1`（最贴生成点的位置）注入 —— **正文一个字没坏，名字全错**，
 * 而当时所有关卡查的都是正文与 keys，**没有一条查"这个名字配不配这条正文"**。
 *
 * 本关卡只查"名—身"这一层，六条断言：
 *   ① 册内**不许重名**（当日 5 条分区标记条就是逐字重复的两份）
 *   ② 名尾带 `(心智姿态)` 的条，正文必须自带心智五段（`角色定位`／`神韵灵魂底模`／常态／破防／执念）
 *      —— 冒名的剧情条过不了这一条
 *   ③ 卡里名尾带 `(心智姿态)` 的条数必须等于册里的条数（既不重复生成，也不漏）
 *   ④ 卡内不许出现**同一正文配两个不同名字**（错名的典型形态）
 *   ⑤ 条名与正文自洽：条名去掉 `【X】`／`〔后期…〕` 前缀后的**名核**必须出现在正文里（软项，只报）
 *   ⑥ 分层：`【人物】` 条 → `at_depth / D3`；其余资料条 → CHAR 前 / `depth 4`（秋风 ⑤⑥⑦）
 *
 * 用法：node _chk_names.mjs ｜ 退出码 0 全通过 / 1 有硬项失败
 */
import { readFileSync, existsSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const bookPath = existsSync(D + '仙姝墮-世界书.json') ? D + '仙姝墮-世界书.json' : D + 'references\\仙姝墮-世界书.json';
const BOOK = JSON.parse(readFileSync(bookPath, 'utf8')).entries;
const CARD = JSON.parse(readFileSync(D + '仙姝墮-角色卡（全书群像）.json', 'utf8'));

const es = CARD.data?.character_book?.entries ?? [];
const fails = [];
const rep = [];
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fails.push(msg); };
/** 卡里停用条的名字带〔待解锁〕前缀，册里不带 ⇒ 比对前统一剥掉 */
const strip = (c) => String(c ?? '').replace(/^(\s*〔待解锁〕)+/, '');
/** `·` 与 `、` 是两种写法（09-29 统一成 `、`），比对时视为同一 */
const norm = (c) => strip(c).replace(/\s*·\s*/g, '、').trim();

/* ① 册内不许重名 */
const bookNames = Object.values(BOOK).map((e) => norm(e.comment));
const dupBook = [...new Set(bookNames.filter((n, i) => bookNames.indexOf(n) !== i))];
ck(dupBook.length === 0, `册内无重名` + (dupBook.length ? `：重名 ${dupBook.length} 个 —— ` + dupBook.slice(0, 5).map((s) => s.slice(0, 34)).join(' ｜ ') : `（${bookNames.length} 条）`));

/* ② 心智条必须自带五段 */
const SECTIONS = ['角色定位', '神韵灵魂底模', '常态心智姿态', '动机触动与破防退行', '执念'];
const mind = Object.values(BOOK).filter((e) => /\(心智姿态\)$/.test(e.comment ?? ''));
const mindNoTpl = mind.filter((e) => !SECTIONS.every((s) => String(e.content).includes(s)));
ck(mind && mindNoTpl.length === 0, `册内心智条 ${mind.length} 条，五段齐全`
  + (mindNoTpl.length ? `：不合格 —— ` + mindNoTpl.map((e) => e.comment).slice(0, 5).join(' ｜ ') : ''));
ck(mind.length === 21, `册内心智条 21 条（现 ${mind.length}）`);

/* ③ 卡内心智条数 = 册内条数 */
const cardMind = es.filter((e) => /\(心智姿态\)$/.test(e.comment ?? ''));
ck(cardMind.length === mind.length, `卡内心智条 ${cardMind.length} 条 ＝ 册内 ${mind.length} 条`);
const cardMindNoTpl = cardMind.filter((e) => !SECTIONS.every((s) => String(e.content).includes(s)));
ck(cardMindNoTpl.length === 0, `卡内心智条五段齐全` + (cardMindNoTpl.length ? `：不合格 ${cardMindNoTpl.length} 条` : ''));

/* ④ 同一正文配两个名字 */
const byContent = new Map();
for (const e of es) {
  const h = String(e.content ?? '');
  if (!h) continue;
  if (!byContent.has(h)) byContent.set(h, new Set());
  byContent.get(h).add(norm(e.comment));
}
const twoNames = [...byContent.entries()].filter(([, s]) => s.size > 1);
ck(twoNames.length === 0, `卡内没有"同一正文配两个名字"的条`
  + (twoNames.length ? `：${twoNames.length} 处 —— ` + twoNames.slice(0, 4).map(([, s]) => [...s].map((x) => x.slice(0, 22)).join(' / ')).join(' ｜ ') : ''));

/* ⑤ 名核必须在正文里（软项） */
const core = (c) => strip(c).replace(/^【[^】]*】/, '').replace(/^[一二三四五六七八九十百零〇]+[、．.\s]*/, '').split(/[·、（）(]/)[0].trim();
const soft = [];
for (const e of Object.values(BOOK)) {
  const c = strip(e.comment ?? '');
  if (/^━/.test(c) || /\(心智姿态\)$/.test(c)) continue;      // 分区标记与心智条另论
  if (!/^【/.test(c)) continue;
  const k = core(c);
  if (k.length < 2) continue;
  if (!String(e.content ?? '').includes(k)) soft.push(c);
}
if (soft.length) console.log(`（软提醒）名核未出现在正文里的条目 ${soft.length} 条：` + soft.slice(0, 8).map((s) => s.slice(0, 26)).join(' ｜ '));

/* ⑥ 分层 */
const bookNamesSet = new Set(Object.values(BOOK).map((e) => norm(e.comment)));
const derived = es.filter((e) => bookNamesSet.has(norm(e.comment)));
const castBad = derived.filter((e) => norm(e.comment).startsWith('【人物') && !(e.extensions?.position === 4 && e.extensions?.depth === 3));
const restBad = derived.filter((e) => !norm(e.comment).startsWith('【人物') && !/\(心智姿态\)$/.test(norm(e.comment)) && !(e.extensions?.position === 0 && e.extensions?.depth === 4));
ck(castBad.length === 0, `【人物】条全在 at_depth/D3` + (castBad.length ? `：${castBad.length} 条 —— ` + castBad.slice(0, 4).map((e) => strip(e.comment).slice(0, 20) + ' pos' + e.extensions?.position + '/D' + e.extensions?.depth).join(' ｜ ') : ''));
ck(restBad.length === 0, `其余资料条全在 CHAR 前 / D4（心智条另按 D1 计）` + (restBad.length ? `：${restBad.length} 条 —— ` + restBad.slice(0, 4).map((e) => strip(e.comment).slice(0, 20) + ' pos' + e.extensions?.position + '/D' + e.extensions?.depth).join(' ｜ ') : ''));

console.log('\n' + rep.join('\n'));

/* ⚠️ 2026-09-30 新增（防漂移）：状态机.js 的 FIELD_TABLE 与 _build_card.js 里那两处「可写字段名」名单
 *   一直是各写各的。实测漂移过一次：台账 100 个、名单只有 97 个 ⇒ 模型写的名字会被 applyMilestones() 丢掉、
 *   闸门永远不成立、而且没有任何报错。所以这里硬比：两处名单必须与台账逐字同序。 */
{
  const smTxt = readFileSync(D + '卡片脚本/状态机.js', 'utf8');
  const FT = [...smTxt.slice(smTxt.indexOf('const FIELD_TABLE'), smTxt.indexOf('const AI_FIELDS')).matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
  const bcTxt = readFileSync(D + '_build_card.js', 'utf8');
  const L1 = (/逐字用下面的字段名[^：:]*[：:]([^。\n]+)。/.exec(bcTxt) || [])[1];
  const L2 = (/可写的字段名（\*\*只能用这一串\*\*）[：:]([^。\n]+)。/.exec(bcTxt) || [])[1];
  const A = L1 ? L1.split('、') : []; const B = L2 ? L2.split('、') : [];
  const same = (x) => x.length === FT.length && x.every((v, i) => v === FT[i]);
  ck(same(A), '状态栏模板名单与 FIELD_TABLE 逐字一致（' + A.length + '／' + FT.length + '）');
  ck(same(B), '状态字段表名单与 FIELD_TABLE 逐字一致（' + B.length + '／' + FT.length + '）');
}

console.log(`\n册 ${Object.keys(BOOK).length} 条 ／ 卡 ${es.length} 条 ｜ ${rep.filter((x) => x.startsWith('✔')).length} 通过 / ${rep.filter((x) => x.startsWith('✘')).length} 失败`);
process.exit(fails.length ? 1 : 0);
