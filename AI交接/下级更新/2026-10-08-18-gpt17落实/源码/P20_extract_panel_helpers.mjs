/**
 * P20_extract_panel_helpers.mjs —— 按 gpt 17 §5-4「面板名册/别名/玩家名辅助函数补给复验」导出：
 *   `XSD_RELICS`、`XSD_IDENT_GROUPS`、`xsdPlayerNames`、`xsdIsCast`、`xsdSamePerson`、`xsdRelicState`
 * 的**完整定义**（带行号），外加 `XSD_PINYIN`（卡片自带名册）的键表与源文件 SHA。
 * 只读，不改任何文件。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const P = 'E:/角色卡制作/仙姝堕/卡片脚本/状态栏面板.js';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18p_面板辅助函数（名册·别名·玩家名·归属判定）.txt';
const src = fs.readFileSync(P, 'utf8');
const lines = src.split('\n');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function 按函数名(name) {
  const re = new RegExp('(?:^|\\n)(\\s*)(?:async\\s+)?function ' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + (m[0][0] === '\n' ? 1 : 0);
  let i = src.indexOf('{', start), d = 0, j = i;
  for (; j < src.length; j++) { const c = src[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) { j++; break; } } }
  return { start, end: j, text: src.slice(start, j) };
}
function 按常量(name) {
  const i = src.indexOf('const ' + name + ' =');
  if (i < 0) return null;
  let d = 0, j = src.indexOf('=', i), started = false;
  for (; j < src.length; j++) { const c = src[j]; if ('([{'.includes(c)) { d++; started = true; } else if (')]}'.includes(c)) d--; else if (c === ';' && d <= 0) { j++; break; } }
  return { start: i, end: j, text: src.slice(i, j) };
}
const 行号 = (off) => src.slice(0, off).split(String.fromCharCode(10)).length;
const dump = (t) => { if (!t) return '（取不到）'; return '行 ' + 行号(t.start) + '–' + 行号(t.end) + '：\n' + t.text.split('\n').map((l, i) => String(行号(t.start) + i).padStart(5) + ' | ' + l).join('\n'); };

const 名册 = 按常量('XSD_PINYIN');
const 名册键 = 名册 ? [...名册.text.matchAll(/^\s{2}'?([\u4e00-\u9fa5A-Za-z0-9_]+)'?\s*:/gm)].map((m) => m[1]) : [];

const out = [];
out.push('# 面板辅助函数（名册 · 别名 · 玩家名 · 归属判定）—— 供 gpt 复验（2026-10-08 · 第 18 批）');
out.push('');
out.push('源文件：' + P);
out.push('源 SHA256：' + sha(src) + '　字符数：' + src.length + '　行数：' + lines.length);
out.push('（`xsdRelicState` 的全文已在第 17 批 `17h_派发与面板_代码原文（带行号）.txt` 里给过，这里再附一次以保持本批自足。）');
out.push('');
out.push('## 1) 卡片自带名册 XSD_PINYIN（立绘命名表 = 判定"是不是剧中人"的唯一名册来源）');
out.push('键（' + 名册键.length + ' 个）：' + 名册键.join('、'));
out.push('');
out.push('```js');
out.push(dump(名册));
out.push('```');
out.push('');
out.push('## 2) XSD_IDENT_GROUPS（同一人物的不同写法／称号：殿主称号 ↔ 本名）');
out.push('```js');
out.push(dump(按常量('XSD_IDENT_GROUPS')));
out.push('```');
out.push('');
out.push('## 3) xsdPlayerNames —— 玩家名从宿主上下文取（不枚举名单）');
out.push('```js');
out.push(dump(按函数名('xsdPlayerNames')));
out.push('```');
out.push('');
out.push('## 4) xsdIsCast —— 是否剧中人（只看上面那张名册 + 别名组）');
out.push('```js');
out.push(dump(按函数名('xsdIsCast')));
out.push('```');
out.push('');
out.push('## 5) xsdSamePerson —— 别名／口径统一的相等判定');
out.push('```js');
out.push(dump(按函数名('xsdSamePerson')));
out.push('```');
out.push('');
out.push('## 6) xsdRelicState —— 解锁／归属／other 判定的真身');
out.push('```js');
out.push(dump(按函数名('xsdRelicState')));
out.push('```');

fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log('写出 ' + OUT);
console.log('名册键 ' + 名册键.length + ' 个：' + 名册键.join('、'));
for (const n of ['XSD_IDENT_GROUPS', 'xsdPlayerNames', 'xsdIsCast', 'xsdSamePerson', 'xsdRelicState']) {
  const t = n.startsWith('XSD') ? 按常量(n) : 按函数名(n);
  console.log('  ' + n + '：' + (t ? ('行 ' + 行号(t.start) + '–' + 行号(t.end) + '，' + t.text.length + ' 字符') : '取不到'));
}
