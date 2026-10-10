/**
 * P15_find_wb_entry.mjs —— 只读：摸清 references/仙姝墮-世界书.json 的结构，并按关键词定位条目。
 * 用法：node P15_find_wb_entry.mjs <关键词> [起始行] [结束行]
 */
import fs from 'node:fs';

const WB = 'E:/角色卡制作/仙姝堕/references/仙姝墮-世界书.json';
const kw = process.argv[2] || '状态栏模板';
const from = Number(process.argv[3] || 1);
const to = Number(process.argv[4] || 0);

const raw = fs.readFileSync(WB, 'utf8');
const j = JSON.parse(raw);
console.log('顶层键: ' + JSON.stringify(Object.keys(j)));
console.log('entries 类型: ' + (Array.isArray(j.entries) ? 'array[' + j.entries.length + ']' : typeof j.entries));
if (j.entries && !Array.isArray(j.entries)) console.log('entries 键数: ' + Object.keys(j.entries).length);

const list = Array.isArray(j.entries) ? j.entries.map((e, i) => Object.assign({ __i: i }, e)) : Object.values(j.entries);
const hits = list.filter((e) => JSON.stringify(e.comment || '').indexOf(kw) !== -1 || String(e.content || '').indexOf(kw) !== -1);
console.log('命中条目数: ' + hits.length);
for (const e of hits.slice(0, 5)) {
  console.log('--- 序号 ' + (e.__i !== undefined ? e.__i : '?') + ' ｜ uid=' + e.uid + ' ｜ comment=' + e.comment + ' ｜ content字符=' + String(e.content || '').length);
  if (to > 0 || from > 1) {
    const L = String(e.content || '').split('\n');
    for (let i = from - 1; i < Math.min(to || L.length, L.length); i++) console.log((i + 1) + ': ' + L[i]);
  }
}
