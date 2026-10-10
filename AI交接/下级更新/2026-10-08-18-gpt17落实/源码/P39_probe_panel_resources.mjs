/**
 * P39_probe_panel_resources.mjs —— 定位面板生产件里的「内嵌资源」到底是什么形态，
 * 以便正确做「去资源副本」（gpt 要求：资源可去除并说明，逻辑必须原样）。
 */
import fs from 'node:fs';

const P = '卡片脚本/状态栏面板.js';
const s = fs.readFileSync(P, 'utf8');

console.log('文件 ' + P + '　' + s.length + ' 字符');
console.log('data:image 出现 ' + (s.match(/data:image/g) || []).length + ' 次');
console.log('data: 出现 ' + (s.match(/data:/g) || []).length + ' 次');

/* 最长字符串字面量 top5（单引号/双引号/反引号都试） */
const cands = [];
for (const m of s.matchAll(/'([^'\\]{500,})'/g)) cands.push({ len: m[1].length, head: m[1].slice(0, 48), 类型: '单引号' });
for (const m of s.matchAll(/"([^"\\]{500,})"/g)) cands.push({ len: m[1].length, head: m[1].slice(0, 48), 类型: '双引号' });
cands.sort((a, b) => b.len - a.len);
console.log('\n超长字面量（≥500 字符）共 ' + cands.length + ' 个，最长 6 个：');
for (const c of cands.slice(0, 6)) console.log('  ' + String(c.len).padStart(7) + ' 字符　' + c.类型 + '　开头「' + c.head + '…」');

/* 关键变量定义位置 */
for (const name of ['XSD_CSS', 'XSD_RELIC_STAGES', 'XSD_CC_', 'XSD_EMBED', 'XSD_PINYIN']) {
  const i = s.indexOf('const ' + name);
  console.log('\nconst ' + name + ' = 位置 ' + i + (i >= 0 ? '　同行：' + s.slice(i, i + 90).replace(/\n/g, '⏎') : '（找不到）'));
}
/* 打包脚本注入的三个占位符 */
const pack = fs.readFileSync('tools/pipeline/_pack_panel_script.mjs', 'utf8');
console.log('\n打包脚本里的占位符：');
for (const m of pack.matchAll(/(__XSD_[A-Z_]+__|\/\*__[A-Z_]+__\*\/)/g)) console.log('  ' + m[1]);
const need = /const need = \[([^\]]*)\]/.exec(pack);
console.log('need 列表：' + (need ? need[1] : '（找不到）'));
