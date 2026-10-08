/**
 * P09_full_gates.mjs —— 按 gpt 03 号 §给deepseek的执行要求 重做提取器：
 *   「gateArg 取实际内容首行中 @@if 之后的全部文本，**不在配平括号处截断**」；
 *   「保留整条首行、字符长度/哈希」，**不打印截断版**。
 * 输出：材料/17l_全卡闸门首行（不截断·带哈希）.txt 与 17l_全卡闸门首行.json
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const BASE = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料';

const raw = fs.readFileSync(CARD, 'utf8');
const card = JSON.parse(raw);
const es = card.data.character_book.entries;
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');

const rows = es.map((e, idx) => {
  const c = e.content || '';
  const first = c.split('\n')[0] || '';
  const isGate = /^@@if/.test(first);
  const arg = isGate ? first.replace(/^@@if\s*/, '') : '';
  return {
    序号: idx,
    卡内id: e.id,
    display_index: e.extensions && e.extensions.display_index,
    标题: e.comment,
    在册: e.enabled !== false,
    常驻: !!e.constant,
    有闸门: isGate,
    首行字符数: first.length,
    首行SHA256: sha(first),
    闸门参数全文: arg,
    content字符数: c.length,
  };
});

const txt = [];
txt.push('仙姝堕 · 全卡闸门首行（**不截断**，按 gpt 03 号「修提取器」要求重做）');
txt.push('来源：最新角色卡/仙姝堕.json　条目数 ' + es.length);
txt.push('='.repeat(90));
for (const r of rows) {
  txt.push('');
  txt.push('### 序号' + r.序号 + '　卡内id=' + r.卡内id + '　display_index=' + r.display_index + '　' + r.标题);
  txt.push('在册=' + r.在册 + '　常驻=' + r.常驻 + '　有闸门=' + r.有闸门 + '　首行字符数=' + r.首行字符数 + '　首行SHA256=' + r.首行SHA256);
  if (r.有闸门) txt.push('闸门参数（整条，未截断）：\n' + r.闸门参数全文);
  else txt.push('（无 @@if 闸门）');
}
fs.writeFileSync(BASE + '/17l_全卡闸门首行（不截断·带哈希）.txt', txt.join('\n'), 'utf8');
fs.writeFileSync(BASE + '/17l_全卡闸门首行.json', JSON.stringify({ 卡: { 路径: CARD, sha256: sha(raw), 字节: Buffer.byteLength(raw, 'utf8'), 条目数: es.length }, 条目: rows }, null, 2), 'utf8');

let maxLen = 0, maxRow = null;
for (const r of rows) if (r.有闸门 && r.首行字符数 > maxLen) { maxLen = r.首行字符数; maxRow = r; }
console.log(JSON.stringify({
  条目数: es.length,
  有闸门条数: rows.filter((r) => r.有闸门).length,
  最长闸门首行: maxRow ? (maxRow.卡内id + ':' + maxRow.标题 + ' = ' + maxLen + ' 字符') : null,
  含嵌套IIFE的闸门条数: rows.filter((r) => (r.闸门参数全文.match(/function\(\)\{try\{return/g) || []).length > 1).length,
}, null, 1));
