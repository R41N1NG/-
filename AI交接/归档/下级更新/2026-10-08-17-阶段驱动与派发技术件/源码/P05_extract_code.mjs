/**
 * P05_extract_code.mjs —— 按行窗口抽取「自动派发」与「面板归属判定」的技术件原文。
 * 只读源码；带行号输出，方便 gpt 对行复核。
 */
import fs from 'node:fs';

const DIR = 'E:/角色卡制作/仙姝堕/卡片脚本';
const BASE = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料';

function windowOf(file, from, to) {
  const lines = fs.readFileSync(DIR + '/' + file, 'utf8').split('\n');
  const out = [];
  for (let i = from; i <= Math.min(to, lines.length); i++) out.push(String(i).padStart(5) + ' | ' + lines[i - 1]);
  return out.join('\n');
}
function blockAround(file, re, before, after) {
  const lines = fs.readFileSync(DIR + '/' + file, 'utf8').split('\n');
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) return '（未找到：' + re + '）';
  return windowOf(file, Math.max(1, i + 1 - before), i + 1 + after);
}
function fnRegion(file, anchorRe) {
  const lines = fs.readFileSync(DIR + '/' + file, 'utf8').split('\n');
  const start = lines.findIndex((l) => anchorRe.test(l));
  if (start < 0) return '（未找到函数：' + anchorRe + '）';
  /* 本文件的分支体收尾是**缩进两格**的 `}`，所以不用 `^}` 找结尾；
   * 改用「下一个成员声明」：缩进 ≤2 的 JSDoc 注释 或 缩进 ≤2 的 function 声明。 */
  let end = Math.min(lines.length - 1, start + 199);
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {0,2}\/\*\*/.test(lines[i]) || /^ {0,2}function\s/.test(lines[i])) { end = i - 1; break; }
    if (/^\}\){0,2}\(\)?;?$/.test(lines[i])) { end = i - 1; break; }   /* IIFE 收尾也停 */
  }
  return windowOf(file, start + 1, end + 1);
}

const parts = [];
const add = (t, s) => { parts.push('\n\n══════════ ' + t + ' ══════════\n' + s); };

add('状态机.js · MINGQI_PREREQ（名器成形硬前置表）', blockAround('状态机.js', /const MINGQI_PREREQ/, 6, 60));
add('状态机.js · 前置校验调用点', blockAround('状态机.js', /const need = MINGQI_PREREQ\[f\]/, 25, 20));
add('状态机.js · 柳含烟出场派发 ＋ 楚灵夜前置齐备自动成形（本批新增）', windowOf('状态机.js', 1880, 1915));
add('状态机.js · 派发记录（一次性派发，防"用掉又长回来"）', windowOf('状态机.js', 1975, 1995));
add('状态机.js · 派发记录写盘判定', windowOf('状态机.js', 2070, 2085));
add('状态栏面板.js · 烟霞灵乳名器条目（c / lord 修复点）', windowOf('状态栏面板.js', 2153, 2162));
add('状态栏面板.js · XSD_IDENT_GROUPS 与 xsdSamePerson', fnRegion('状态栏面板.js', /const XSD_IDENT_GROUPS/));
add('状态栏面板.js · xsdRelicState（= 解锁／归属／other 判定的真身）', fnRegion('状态栏面板.js', /function xsdRelicState/));
add('状态栏面板.js · other ⇒ 反色的三处渲染点', windowOf('状态栏面板.js', 2560, 2568) + '\n…\n' + windowOf('状态栏面板.js', 2596, 2602) + '\n…\n' + windowOf('状态栏面板.js', 2683, 2712));

fs.writeFileSync(BASE + '/17h_派发与面板_代码原文（带行号）.txt', parts.join('\n'), 'utf8');
console.log('OK 17h');
