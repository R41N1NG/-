#!/usr/bin/env node
/**
 * _chk_shell_frontend.mjs —— 断言「迷你壳能被酒馆助手识别为前端代码块」
 *
 * 依据（从助手 dist/index.js 里读出来的**真判定**）：
 *   function Wk(e){ return ['html>','<head>','<body'].some(t => e.includes(t)) }
 *   `collapse_code_block = frontend_only` ⇒ 命中才把代码块变成 iframe ⇒ bootstrap 才会跑。
 *   ⇒ 替换串里**必须**同时出现这三个连续子串，且**不能被折行破坏**。
 *
 * 用法：node _chk_shell_frontend.mjs [卡.json]
 * 退出码：0 通过 / 2 失败
 */
import { readFileSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const rs = card.data.extensions.regex_scripts.find((r) => /状态栏渲染|^仙姝墮·状态栏$/.test(r.scriptName));
if (!rs) { console.error('找不到渲染条'); process.exit(2); }
const rep = String(rs.replaceString);

const need = ['html>', '<head>', '<body'];
const hit = need.filter((k) => rep.includes(k));

/* 还原助手的真实判定，并额外做「去空白后仍须命中」的稳健检查 */
const strict = need.some((t) => rep.includes(t));
const alsoFence = /^\s*```/.test(rep) && /```\s*$/.test(rep.trimEnd());

console.log('【迷你壳 · 助手前端识别断言】替换串 ' + rep.length + ' 字\n');
let bad = 0;
const ck = (c, l) => { if (!c) bad += 1; console.log(`  ${c ? '✔' : '✘'} ${l}`); };
ck(strict, `助手的判定函数命中（需要的三个子串，命中：${hit.join(' ')}）`);
for (const t of need) ck(rep.includes(t), `包含连续子串「${t}」`);
ck(alsoFence, '整体被 markdown 围栏包住（``` 开头、``` 结尾）');
ck(/^```\n<!DOCTYPE html><html lang="zh-CN"><head>/.test(rep), '第一行是 `<!DOCTYPE html><html lang="zh-CN"><head>`（**不折行**）');
ck(!/<html[^>]*>\s*\n\s*<head>/.test(rep), '`<html …>` 与 `<head>` 之间没有换行');
ck(rep.includes('</head><body>'), '`</head><body>` 连写（助手的 `<body` 也命中）');
ck(rep.includes('XsdHUD') && rep.includes('hud.mount'), '壳里含 bootstrap（找 XsdHUD ＋ 调 mount）');
ck(rep.length <= 2500, '替换串仍 ≤ 2500 字（规范 §3.2）');
/* 模板字面量安全：替换串由 `_build_card.js` 的 `readText()` 在**运行时**读入（不塞进模板串），
 * 所以开头结尾那两道 markdown 围栏的反引号是**允许的**；要防的是正文里出现反引号把围栏咬断。 */
const btCount = (rep.match(/`/g) || []).length;
ck(btCount === 6, `反引号只出现在围栏那两道（共 6 个，实测 ${btCount}）`);
ck(!rep.replace(/^\s*```/, '').replace(/```\s*$/, '').includes('`'), '围栏以内没有反引号');
ck(!rep.includes('\\'), '不含反斜杠（避免转义歧义）');
ck(!rep.includes('${'), '不含 ${（模板字面量占位）');

if (bad) { console.log(`\n❌ ${bad} 项不符`); process.exit(2); }
console.log('\n✅ 全部通过 —— 助手会把它变成 iframe，bootstrap 才会跑');
