#!/usr/bin/env node
/**
 * _chk_anchor_gate.mjs —— 锚点提议的「地点词不算事件」闸门自测（v1.5）
 *
 * 背景（主人真机截图）：正文只写「自幽寂谷归来」，却弹了「锚点提议：玄机子胁迫过叶红缨」。
 *   本条自测断言两件事：
 *     ① **只有地点词**的正文 ⇒ **不得**提议；
 *     ② **事件真的发生了**（地点词 ＋ 事件动词）⇒ **必须**提议。
 *
 * 用法：node _chk_anchor_gate.mjs    （退出码 0＝全通过，1＝有失败）
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync('卡片脚本/状态机.js', 'utf8');
/* ⚠️ 2026-09-30 修（**只动取材范围，断言一条没改**）：
 *   病征：`ReferenceError: FIELD_TABLE is not defined`。
 *   成因：`状态机.js` 改成了「`ANCHOR_KEYWORDS` 从 `FIELD_TABLE` 派生」（状态机.js:221），
 *   而本脚本从 `const ANCHOR_KEYWORDS` 处开切 ⇒ 表定义（状态机.js:90–107）没被带进来。
 *   ⇒ 做法：把 `FIELD_TABLE` 那段数组一并切进来，两段拼起来再求值。 */
const t0 = src.indexOf('const FIELD_TABLE');
const t1 = src.indexOf('\n];', t0) + 3;
if (t0 < 0 || t1 < 3) { console.error('✗ 状态机.js 里找不到 FIELD_TABLE 数组'); process.exit(2); }
const code = src.slice(t0, t1) + '\n'
  + src.slice(src.indexOf('const ANCHOR_KEYWORDS'), src.indexOf('function msgOf'));

const box = { console };
vm.createContext(box);
vm.runInContext(`${code}\nglobalThis.__T = { ANCHOR_KEYWORDS, ANCHOR_LOCATION_ONLY, ANCHOR_SECOND_SIGNALS };`, box);
const { ANCHOR_KEYWORDS, ANCHOR_LOCATION_ONLY, ANCHOR_SECOND_SIGNALS } = box.__T;
const FIELDS = Object.keys(ANCHOR_KEYWORDS);

/** 与 proposeAnchors 里那段判定逐行同构 */
function propose(text) {
  const hits = [];
  for (const f of FIELDS) {
    const kws = ANCHOR_KEYWORDS[f] || [];
    if (!kws.length) continue;
    const hitWords = kws.filter((k) => text.includes(k));
    if (!hitWords.length) continue;
    const onlyLocation = hitWords.every((k) => ANCHOR_LOCATION_ONLY.includes(k));
    if (onlyLocation && !ANCHOR_SECOND_SIGNALS.some((k) => text.includes(k))) continue;
    hits.push(f);
  }
  return hits;
}

const CASES = [
  {
    name: '真机原文（只出现「幽寂谷」这个地名）',
    text: '「红缨师妹今日心绪似乎有些浮躁。自幽寂谷归来，她练功便常有业火外溢之状。此去天溪城恶战难免。」',
    expect: [],
  },
  {
    name: '事件真的发生（地名 ＋ 事件动词）',
    text: '玄机子终于得手，在幽寂谷里胁迫叶红缨屈从，事后她独自垂泪。',
    expect: ['玄机子胁迫过叶红缨'],
  },
  {
    name: '只提地名「葬魔渊」',
    text: '一行人沿着葬魔渊外沿的路走，谁也没往下看一眼。',
    expect: [],
  },
  {
    name: '「坠渊」＋「葬魔渊」都出现',
    text: '赵无忧在葬魔渊边失足坠渊，金丹被击碎。',
    expect: ['赵无忧坠渊'],
  },
  {
    name: '非地点类关键词（封元镇灵环）照旧直接命中',
    text: '那枚封元镇灵环在她腕上嗡然一响。',
    expect: ['封元镇灵环'],
  },
];

let pass = 0;
const fails = [];
for (const c of CASES) {
  const got = propose(c.text);
  const ok = got.length === c.expect.length && c.expect.every((e) => got.includes(e));
  if (ok) pass += 1;
  else fails.push(`${c.name}：期望 ${JSON.stringify(c.expect)}，实得 ${JSON.stringify(got)}`);
  console.log(`  ${ok ? '✔' : '✘'} ${c.name} → ${JSON.stringify(got)}`);
}

console.log(`\n【锚点闸门自测】${pass}/${CASES.length} 通过`);
if (fails.length) {
  console.log('失败项：\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('✅ 全通过（地点词不再误报；真事件仍能命中）');
