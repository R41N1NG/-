#!/usr/bin/env node
/**
 * _chk_shell_syntax.mjs —— 把迷你壳里的那段 `<script>` **抠出来单独做语法检查**
 *
 * 为什么：真机上「面板变成黑金本体（iframe 建了）」但**控制台一行日志都没有** ⇒
 *   极小可能就是**壳里的 bootstrap 自己语法错误**（它是整个链路的起点，它一挂全挂）。
 *   本脚本按真机步骤逐段验：抠 script → `new Function` 编译 → 顺带查 BOM／围栏／行数。
 *
 * 用法：node _chk_shell_syntax.mjs [卡.json]
 * 退出码：0 通过 / 2 失败
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const rs = card.data.extensions.regex_scripts.find((r) => /状态栏渲染|^仙姝墮·状态栏$/.test(r.scriptName));
if (!rs) { console.error('找不到渲染条'); process.exit(2); }
const rep = String(rs.replaceString);

let bad = 0;
const ck = (c, l) => { if (!c) bad += 1; console.log(`  ${c ? '✔' : '✘'} ${l}`); };

console.log('【迷你壳 · bootstrap 语法／结构体检】\n');
/* ① 围栏 */
ck(/^\s*```/.test(rep), '以 markdown 围栏开头');
const body = rep.replace(/^\s*```[a-zA-Z]*\r?\n?/, '').replace(/\r?\n?```\s*$/, '');
ck(body.startsWith('<!DOCTYPE html>'), '围栏内以 <!DOCTYPE html> 开头');
ck(!body.includes('```'), '围栏内不再出现围栏符号');
/* ② 抠 script */
const m = /<script>([\s\S]*?)<\/script>/.exec(body);
ck(!!m, '壳里有且只有一段 <script>');
ck((body.match(/<script>/g) || []).length === 1, 'script 标签只有一处（不会互相咬断）');
/* ③ 语法编译 */
if (m) {
  const code = m[1];
  let compiled = true, err = '';
  try { new vm.Script(code, { filename: 'shell-bootstrap.js' }); } catch (e) { compiled = false; err = e.message; }
  ck(compiled, 'bootstrap 能通过语法编译' + (compiled ? '' : '（' + err + '）'));
  /* ④ 在极简桩环境里真跑一遍：不给 XsdHUD，看它是否**安静重试**而不是抛错 */
  const calls = [];
  const ctx = {
    console: { log: (...a) => calls.push(a.join(' ')), warn: (...a) => calls.push('WARN ' + a.join(' ')), error: (...a) => calls.push('ERR ' + a.join(' ')) },
    setTimeout: (fn) => { calls.push('setTimeout'); return 0; },
    document: {
      readyState: 'complete',
      getElementById: () => ({ innerHTML: '' }),
      addEventListener: () => calls.push('addEventListener'),
    },
    window: {},
  };
  ctx.window.parent = ctx.window; ctx.window.top = ctx.window;
  let ran = true; let runErr = '';
  try { vm.createContext(ctx); new vm.Script(code).runInContext(ctx, { timeout: 3000 }); } catch (e) { ran = false; runErr = e.message; }
  ck(ran, '在桩环境里执行不抛错' + (ran ? '' : '（' + runErr + '）'));
  ck(calls.includes('setTimeout'), '取不到 XsdHUD 时走重试（调了 setTimeout）');
}
/* ⑤ 其它真机易踩点 */
ck(!rep.includes('\uFEFF'), '替换串里没有 BOM');
ck(rep.split('\n').length < 60, `替换串行数 ${rep.split('\n').length}（不应过长）`);
ck(rep.includes('<div id="content"'), '壳里有 #content 容器');
ck(rep.includes('hud.mount'), '壳里会调 hud.mount');
ck(rep.includes('XsdHUD'), '壳里会找 window.XsdHUD');

if (bad) { console.log(`\n❌ ${bad} 项不符`); process.exit(2); }
console.log('\n✅ 全部通过 —— 壳的 bootstrap 语法与结构都没问题');
