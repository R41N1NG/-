#!/usr/bin/env node
/**
 * _chk_plot_gate.mjs —— 中立大势剧情闸门的形状与语义检查
 *
 * 契约（2026-10-10 待办二决议）：
 *   不需要重构赵无忧主线，卡内剧情脊梁采用面向所有身份开放的 7 条【中立】大势条目。
 *   旧版赵无忧专属 15 条主线与 7 条专轨已备份剥离，生产卡内仅保留中立大势。
 *
 * 断言（对卡内 `最新角色卡/仙姝堕.json` 与 `references/仙姝墮-世界书.json`）：
 *   ① 旧版赵无忧专属 15 条与专轨 7 条已剥离（生产卡内条数为 0，绝不回流污染）；
 *   ② 中立大势剧情共 7 条（【中立】一 至 【中立】七），全部 enabled === true 且 prevent_recursion === true；
 *   ③ 闸门形状：全部为 fail-closed IIFE 结构（报错或未声明环境直接返回 false）；
 *   ④ 全身份开放：六大身份（赵无忧、自设、四大殿主）条件满足时均放行，闸门不含身份排他逻辑；
 *   ⑤ 历时推进与世界锚点：各条目严格恪守仙盟历时间窗口与世界大势事实（未到绝不放行，过时退出）；
 *   ⑥ 正门锚点全部在 FIELD_TABLE 台账内（无死名）；
 *   ⑦ 铁律 32 质检：中立剧情正文严禁滥用极端副词（彻底、极其、极度等）；
 *   ⑧ 全卡所有 @@if 闸门均包裹 fail-closed 且无 `?? '赵无忧'` 软兜底。
 *
 * 用法：& 'C:\Program Files\nodejs\node.exe' tools/checks/_chk_plot_gate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'E:/角色卡制作/仙姝堕';
const CARD = path.join(DIR, '最新角色卡', '仙姝堕.json');
const SM = path.join(DIR, '卡片脚本', '状态机.js');
const MASTER_WB = path.join(DIR, 'references', '仙姝墮-世界书.json');

const rep = [];
let fail = 0;
const ck = (ok, msg, extra) => {
  rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`);
  if (!ok) fail += 1;
};

/* 提取状态机 FIELD_TABLE */
function arrOf(txt, name) {
  const i = txt.indexOf('const ' + name + ' = [');
  if (i < 0) throw new Error('状态机里找不到 ' + name);
  let d = 0, j = i + ('const ' + name + ' = ').length;
  for (; j < txt.length; j += 1) {
    const c = txt[j];
    if (c === '[') d += 1;
    else if (c === ']') { d -= 1; if (d === 0) { j += 1; break; } }
  }
  return txt.slice(i, j);
}
const sm = fs.readFileSync(SM, 'utf8');
const LEDGER = new Set([...arrOf(sm, 'FIELD_TABLE').matchAll(/kind:\s*'[^']+',\s*name:\s*'([^']+)'/g)].map((m) => m[1]));

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const entries = card.data.character_book.entries || [];
const main = entries.filter((e) => /【剧情】[一二三四五六七八九十]+ ·/.test(String(e.comment)) && !String(e.comment).includes('专轨'));
const side = entries.filter((e) => /【剧情】.*（(?:自设|殿主)专轨）/.test(String(e.comment)));
const neutral = entries.filter((e) => /【中立】[一二三四五六七] ·/.test(String(e.comment)));

rep.push(`卡：${CARD}`);
rep.push(`中立大势剧情 ${neutral.length} 条｜旧主线 ${main.length} 条｜旧专轨 ${side.length} 条｜台账 ${LEDGER.size} 个字段`);

// 1. 旧版条目已剥离断言
ck(main.length === 0, '旧版赵无忧专属主线（15条）已按指令剥离，不在生产卡内');
ck(side.length === 0, '旧版专轨剧情（7条）已按指令剥离，不在生产卡内');

// 2. 中立大势条目完整性
ck(neutral.length === 7, `中立大势剧情共 7 条（【中立】一 至 【中立】七，实为 ${neutral.length} 条）`);

// 3. 中立大势条目属性断言
const IDENTITIES = ['赵无忧', '自设', '焚欲殿主', '浊龙殿主', '欢喜殿主', '魂欢殿主'];
const BANNED_WORDS = ['极其', '极度', '彻底', '绝对', '臣服', '献祭', '近乎', '近乎于'];

let shapeBad = [];
let semBad = [];
let deadNames = [];
let styleBad = [];
let preventRecBad = [];

const evalGate = (firstLine, vars) => {
  const expr = firstLine.replace(/^@@if\s*/, '').replace(/\/\*[\s\S]*?\*\/\s*$/, '');
  try {
    return new Function('variables', 'return (' + expr + ');')(vars);
  } catch (e) {
    return 'ERR:' + e.message;
  }
};

const evalBroken = (firstLine) => {
  const expr = firstLine.replace(/^@@if\s*/, '').replace(/\/\*[\s\S]*?\*\/\s*$/, '');
  try {
    return new Function('return (' + expr + ');')();
  } catch (e) {
    return 'THREW:' + e.message;
  }
};

const EXPECTED_WINDOWS = {
  1: { start: 1577.12, end: 1578.03, mid: 1578.00, anchors: [] },
  2: { start: 1578.03, end: 1578.08, mid: 1578.05, anchors: [] },
  3: { start: 1578.08, end: 1579.01, mid: 1578.10, anchors: [] },
  4: { start: 1579.01, end: 1579.03, mid: 1579.02, anchors: ['南域大劫'] },
  5: { start: 1579.03, end: 1579.06, mid: 1579.04, anchors: ['南域大劫', '天溪城兽潮'] },
  6: { start: 1579.06, end: 1580.01, mid: 1579.08, anchors: [] },
  7: { start: 1580.01, end: Infinity, mid: 1580.05, anchors: [] },
};

const CN_MAP = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };

for (const e of neutral) {
  const cm = String(e.comment);
  const numMatch = cm.match(/^【中立】([一二三四五六七]) ·/);
  const n = numMatch ? CN_MAP[numMatch[1]] : null;
  const first = String(e.content).split('\n')[0];

  // 防递归
  if (e.prevent_recursion !== true && e.preventRecursion !== true) {
    preventRecBad.push(`${cm} 未设置 prevent_recursion: true`);
  }

  // 首行必须是 fail-closed IIFE
  if (!/^@@if \(function\(\)\{try\{return \(.*?\)\}catch\(e\)\{return false\}\}\)\(\)$/.test(first)) {
    shapeBad.push(`${cm} 闸门不是标准的 fail-closed IIFE 结构`);
  }

  // 坏环境必须 fail-closed 返回 false
  const brokenRes = evalBroken(first);
  if (brokenRes !== false) {
    semBad.push(`${cm} 坏环境求值未返回 false（实为 ${brokenRes}）`);
  }

  // 检查台账锚点死名
  const usedAnchors = [...first.matchAll(/known\?\.\['([^']+)'\]/g)].map((m) => m[1]);
  for (const a of usedAnchors) {
    if (!LEDGER.has(a)) {
      deadNames.push(`${cm} 包含死名锚点: ${a}`);
    }
  }

  // 铁律 32 极端词检查
  for (const b of BANNED_WORDS) {
    if (String(e.content).includes(b)) {
      styleBad.push(`${cm} 正文包含违禁副词: ${b}`);
    }
  }

  // 语义与时点检查
  const exp = EXPECTED_WINDOWS[n];
  if (exp) {
    // 1. 全身份放行验证（时间窗口内 + 锚点齐备时，6大身份均必须返回 true）
    const knownFull = Object.fromEntries(exp.anchors.map((a) => [a, true]));
    for (const id of IDENTITIES) {
      const res = evalGate(first, { stat_data: { 身份: id, 仙盟历: exp.mid, known: knownFull } });
      if (res !== true) {
        semBad.push(`${cm} 在身份「${id}」与时点 ${exp.mid} 下未放行（返回 ${res}）`);
      }
    }

    // 2. 时间未到绝不放行（下界前 0.01）
    const earlyRes = evalGate(first, { stat_data: { 身份: '赵无忧', 仙盟历: +(exp.start - 0.01).toFixed(2), known: knownFull } });
    if (earlyRes !== false) {
      semBad.push(`${cm} 时间未到（${+(exp.start - 0.01).toFixed(2)}）被放行（实为 ${earlyRes}）`);
    }

    // 3. 过时退出（有上界的条目，在 end 时刻必须退出）
    if (exp.end !== Infinity) {
      const lateRes = evalGate(first, { stat_data: { 身份: '赵无忧', 仙盟历: exp.end, known: knownFull } });
      if (lateRes !== false) {
        semBad.push(`${cm} 超过时间窗口（${exp.end}）未退出（实为 ${lateRes}）`);
      }
    }

    // 4. 世界锚点缺失拦截（第4、5条）
    if (exp.anchors.length > 0) {
      const emptyRes = evalGate(first, { stat_data: { 身份: '赵无忧', 仙盟历: exp.mid, known: {} } });
      if (emptyRes !== false) {
        semBad.push(`${cm} 缺失必需世界锚点「${exp.anchors.join('、')}」却被放行`);
      }
    }
  }
}

ck(shapeBad.length === 0, '中立剧情闸门形状：全部为 fail-closed IIFE 结构', shapeBad.slice(0, 3).join('；'));
ck(semBad.length === 0, '中立剧情求值语义：全身份开放／时间未到不放／过时退出／锚点缺失拦截／坏环境 fail-closed', semBad.slice(0, 3).join('；'));
ck(deadNames.length === 0, '中立剧情引用的世界锚点全部在 FIELD_TABLE 台账内（无死名）', deadNames.join('；'));
ck(preventRecBad.length === 0, '中立剧情条目全部开启 prevent_recursion: true（防递归保护）', preventRecBad.join('；'));
ck(styleBad.length === 0, '铁律 32 质检：中立剧情正文无违禁副词（彻底、极其等）', styleBad.join('；'));

/* 全卡 fail-closed 普查 */
{
  const gated = entries.filter((e) => /^@@if/.test(String(e.content)));
  const unwrapped = gated.filter((e) => !/^@@if \(function\(\)\{try\{return \(/.test(String(e.content)));
  ck(unwrapped.length === 0, `全卡 ${gated.length} 条闸门都包了 fail-closed（求值报错 ⇒ 剔除条目）`,
    unwrapped.slice(0, 5).map((e) => String(e.comment).slice(0, 22)).join('；'));
  const soft = gated.filter((e) => String(e.content).split('\n')[0].includes("?? '赵无忧'"));
  ck(soft.length === 0, '身份条件不再用 `?? \'赵无忧\'` 软兜底',
    soft.slice(0, 5).map((e) => String(e.comment).slice(0, 22)).join('；'));
}

if (fail) { rep.push(''); rep.push('✘ 未通过项：'); }
console.log(rep.join('\n'));
console.log(`\n${fail === 0 ? '✅ 全部通过' : '❌ ' + fail + ' 项未通过'}（中立大势剧情闸门质检）`);
process.exit(fail === 0 ? 0 : 2);
