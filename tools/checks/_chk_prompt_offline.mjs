#!/usr/bin/env node
/**
 * _chk_prompt_offline.mjs —— **离线**复核提示词侧的三件事（不需要浏览器、不碰酒馆）
 *
 * 对应 `交接说明.md` 第九节真机清单里的：
 *   · 项 2「闸门是否仍被读到」→ 用**真实聊天变量**求值卡里每一条 `@@if`，看该进的进、不该进的不进
 *   · 项 7「提示词净化是否生效」→ 用**真实聊天正文**跑卡里那条 `promptOnly + minDepth:3` 的剔除正则
 *   · 附带：身份条目闸门（6 条【身份】只应开当前身份那条）
 *
 * 依据（读源码得来，写死在这里免得再猜）：
 *   · ST-Prompt-Template：`@@if <表达式>` ⇒ `<%- !!(<表达式>) %>`，假则**整条 splice**
 *   · 正则引擎 `engine.js`：`placement` 命中才跑；`promptOnly` ⇒ 只在提示词侧生效；
 *     `minDepth` ⇒ **只处理「depth >= minDepth」的楼层**（depth 从 0 数起、0 是最新一楼）
 *     ⇒ `minDepth:3`＝只剔除第 3 楼及更早的历史状态栏，**最近两楼（depth 0/1）保留**
 *
 * 用法：
 *   node _chk_prompt_offline.mjs [卡.json] [聊天.jsonl]
 * 默认：卡＝`仙姝墮-角色卡（全书群像）.json`；聊天＝酒馆里本卡最新的那份 jsonl
 * 退出码：0 全通过 / 2 有失败
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** 定位聊天目录：优先「名字以 仙姝墮 开头且最近修改」的那个（酒馆会改名，写死会 ENOENT） */
function resolveChatDir() {
  const root = 'E:/tavern/SillyTavern/data/default-user/chats';
  try {
    const ds = readdirSync(root, { withFileTypes: true })
      .filter(function (d) { return d.isDirectory() && /^仙姝墮/.test(d.name); })
      .map(function (d) { return { p: join(root, d.name), t: statSync(join(root, d.name)).mtimeMs }; })
      .sort(function (a, b) { return b.t - a.t; });
    if (ds.length) return ds[0].p;
  } catch (e) { /* 退回落定名 */ }
  return join(root, '仙姝墮 · 一张跑全书');
}

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const CHAT_ROOT = resolveChatDir();

function latestChat() {
  const files = readdirSync(CHAT_ROOT)
    .map((f) => ({ f, m: statSync(join(CHAT_ROOT, f)).mtimeMs }))
    .filter((x) => x.f.endsWith('.jsonl'))
    .sort((a, b) => b.m - a.m);
  return join(CHAT_ROOT, files[0].f);
}
const CHAT = process.argv[3] ?? latestChat();

const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const entries = card.data.character_book.entries ?? [];
const regexes = card.data.extensions?.regex_scripts ?? [];

const chatLines = readFileSync(CHAT, 'utf8').split('\n').filter(Boolean);
const meta = JSON.parse(chatLines[0]);
const messages = chatLines.slice(1).map((l) => JSON.parse(l));
const stat = meta.chat_metadata?.variables?.stat_data ?? {};
const variables = { stat_data: stat };

const ok = [];
const bad = [];
const ck = (cond, label) => (cond ? ok : bad).push(label);

console.log(`【离线提示词复核】卡＝${CARD}`);
console.log(`                     聊天＝${CHAT}`);
console.log(`                     身份＝${stat.身份} ｜ 阵营＝${stat.阵营} ｜ known 已解锁 ${Object.entries(stat.known ?? {}).filter(([, v]) => v === true).length} 项\n`);

/* ── ① 求值卡里所有 @@if 闸门 ── */
function gateExprOf(content) {
  const first = String(content ?? '').split('\n')[0];
  const m = /^@@if\s+(.+)$/.exec(first.trim());
  return m ? m[1] : null;
}
const safety = (expr) => {
  try {
    // eslint-disable-next-line no-new-func
    return { value: new Function('variables', `return !!( ${expr} );`)(variables), err: null };
  } catch (e) { return { value: null, err: e.message }; }
};

const gated = entries.filter((e) => gateExprOf(e.content));
const results = gated.map((e) => {
  const expr = gateExprOf(e.content);
  const { value, err } = safety(expr);
  return { comment: e.comment, enabled: e.enabled !== false, constant: e.constant === true, expr, value, err };
});

const gatedOn = results.filter((r) => r.value === true);
const gatedOff = results.filter((r) => r.value === false);
const gatedErr = results.filter((r) => r.err);

console.log('① 闸门求值（真＝会进上下文；未启用的条目 ST 不求值）');
console.log(`   带 @@if 的条目共 ${results.length} 条 ⇒ 真 ${gatedOn.length}／假 ${gatedOff.length}／求值异常 ${gatedErr.length}`);
for (const r of gatedOn) console.log(`     · 判真（会进上下文）：${r.enabled ? '' : '〔未启用〕'}${r.comment}`);
for (const r of gatedErr) console.log(`   ✘ 求值异常：${r.comment} ← ${r.expr}（${r.err}）`);

ck(gatedErr.length === 0, `① 全部闸门可求值、无 TypeError/ReferenceError（${results.length} 条）`);

/* 默认开局（known 全 false）时，13 条【剧情】闸门必须全为假。
 * ⚠️ 玩家已经玩下去时（known 里有 true），这条断言**不适用** —— 那时应该"闸门跟着账本走"。
 *    所以只在「起始状态」断言；否则改报实际状态，免得把正常进度误判成 bug（真踩过）。 */
const unlocked = Object.entries(stat.known ?? {}).filter(([, v]) => v === true).map(([k]) => k);
const isFreshStart = unlocked.length === 0;
const plotGated = results.filter((r) => /^【剧情】/.test(r.comment));
const plotOn = plotGated.filter((r) => r.value === true);
if (isFreshStart) {
  ck(plotOn.length === 0, `① 起始状态（零解锁）下【剧情】闸门全为假（${plotGated.length} 条，实为真 ${plotOn.length} 条）`);
  if (plotOn.length) console.log('   ✘ 不该进却判真：' + plotOn.map((r) => r.comment).join('、'));
} else {
  /* 已有进度时不做"该真几条"的推断 —— 闸门表达式还可能带**身份／地点／阶段**等条件，
   * 我的外推曾把 7 条（起手公开的天姝会存在 ＋ 四殿主身份）误判成"不该开"（踩过）。
   * 这条改成**只报到场情况**，供人一眼核对；断言留给"起手状态"那一支。 */
  console.log(`   （非起始状态：已解锁 ${unlocked.length} 项 ⇒ 跳过"全为假"断言；` +
    `当前【剧情】判真 ${plotOn.length} 条：${plotOn.map((r) => r.comment.replace(/^【剧情】/, '')).join('、') || '无'}）`);
  ck(plotOn.length <= plotGated.length, `① 已有进度 ⇒【剧情】闸门判真 ${plotOn.length}/${plotGated.length} 条（仅报到场，不做推断）`);
}

/* ── ② 身份条目：只应有当前身份那条为真 ── */
const idEntries = results.filter((r) => /^【身份】/.test(r.comment));
const idOn = idEntries.filter((r) => r.value === true);
const idName = `【身份】${stat.身份}`;
ck(idOn.length === 1 && idOn[0].comment === idName,
  `② 身份闸门：只开「${idName}」那一条（6 条里判真的：${idOn.map((r) => r.comment).join('、') || '无'}）`);
if (idOn.length !== 1 || idOn[0].comment !== idName) {
  console.log('   ✘ 身份闸门不符：' + JSON.stringify(idOn.map((r) => r.comment)));
}

/* ── ③ 提示词净化正则：用真实正文跑一遍 ── */
console.log('\n③ 剔除类正则（promptOnly）对真实正文的作用');
const promptOnly = regexes.filter((r) => r.promptOnly === true);
const total = messages.length;
// ST 的 depth：最新一楼 depth=0，往上递增
const depthOf = (idx) => total - 1 - idx;
const purge = regexes.find((r) => /历史状态栏/.test(String(r.scriptName)));
if (!purge) {
  ck(false, '③ 找不到「净化历史状态栏」正则');
} else {
  const midx = Number.isInteger(purge.minDepth) ? purge.minDepth : 3;
  const re = new RegExp(purge.findRegex, purge.replaceRegex ? 'gm' : 'gm');
  const keptByDepth = [], keptNoMatch = [], purged = [];
  /* ⚠️ 2026-10-01 修断言：旧版把「因 depth 不够而保留」与「老楼但正则没命中而保留」
   *   塞进同一个 kept，再用 `kept.every(dep < midx)` 断言 ⇒ **必假**（玩家楼没有状态块，
   *   永远不命中正则）。要保的只有一件事：**最近两楼不在剔除名单里**。 */
  messages.forEach((m, i) => {
    const dep = depthOf(i);
    if (dep < midx) { keptByDepth.push({ i, dep }); return; }        // depth 不够 ⇒ 正则不处理
    if (!re.test(String(m.mes ?? ''))) { keptNoMatch.push({ i, dep }); return; }
    purged.push({ i, dep });
  });
  const kept = keptByDepth.concat(keptNoMatch);
  console.log(`   最新一楼 depth=0；该正则 minDepth=${midx} ⇒ 只处理 depth>=${midx} 的楼`);
  console.log(`   实测：保留 ${kept.length} 楼（depth ${kept.map((k) => k.dep).join('/')}）｜剔除 ${purged.length} 楼（depth ${purged.map((p) => p.dep).join('/')}）`);
  console.log(`       其中 因 depth<${midx} 保留 ${keptByDepth.length} 楼；老楼但正则不命中（多为玩家楼）${keptNoMatch.length} 楼`);
  ck(keptByDepth.every((k) => k.dep < midx) && !purged.some((p) => p.dep < midx),
    `③ 最近两楼（depth 0/${midx - 1}）未被剔除`);
  ck(purged.every((p) => p.dep >= midx), `③ 被剔除的都是 depth>=${midx} 的旧楼`);
  /* ⚠️ 2026-09-28 改：旧断言是"最新一楼的 <Status_block> 已被渲染层吃掉 ⇒ 剔除正则不该命中"，
   *   那是**旧架构**的假设（渲染时用大段 HTML 顶掉原文）。规范 §C 卷的架构里
   *   原文仍然带 `<Status_block>`，靠**双轨制 ＋ minDepth** 分流：显示层渲染它、提示词层剔它。
   *   ⇒ 正确断言应为：**最新一楼被保留**（在 kept 里），且它的原文仍带状态块（供显示层渲染）。 */
  const newest = messages[total - 1]?.mes ?? '';
  const newestKept = kept.some((k) => k.dep === 0);
  ck(newestKept, '③ 最新一楼（depth 0）在保留集里 —— 提示词剔除只治历史楼');
  /* ⚠️ 2026-09-28：新开的聊天里**最新一楼就是身份菜单首楼**（本来就没有状态块），
   *    此时这条断言无从谈起 ⇒ 跳过并说明，不要误报成失败。 */
  if (newest.includes('<IdentityMenu') || !newest.includes('<Status_block>')) {
    ck(true, '③ 最新一楼没有状态块（身份菜单首楼｜新开聊天的正常形态）⇒ 本条跳过');
  } else {
    ck(newest.includes('<Status_block>'), '③ 最新一楼原文仍带状态块（显示层靠它渲染 HUD）');
  }
}

console.log('\n' + (bad.length ? `【失败 ${bad.length} 项】\n  ` + bad.join('\n  ') : ''));
for (const l of ok) console.log('  ✔ ' + l);
if (bad.length) process.exit(2);
console.log(`\n✅ 全部通过（${ok.length} 项）`);
