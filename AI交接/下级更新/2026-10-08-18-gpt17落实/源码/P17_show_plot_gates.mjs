/**
 * P17_show_plot_gates.mjs —— 只读：把 references 世界书源里指定 comment 的条目闸门首行与结构打出来，
 * 用于给 53/58/64 三条主线加「可信日期＋必要事实」外层门。
 * 用法：node P17_show_plot_gates.mjs "关键词1" "关键词2" ...
 */
import fs from 'node:fs';

const WB = 'E:/角色卡制作/仙姝堕/references/仙姝墮-世界书.json';
const j = JSON.parse(fs.readFileSync(WB, 'utf8'));
const list = Array.isArray(j.entries) ? j.entries : Object.values(j.entries);
const kws = process.argv.slice(2);

for (const kw of kws) {
  const hits = list.filter((e) => String(e.comment || '').indexOf(kw) !== -1);
  if (!hits.length) { console.log('✘ 源里没有含「' + kw + '」的条目'); continue; }
  for (const e of hits) {
    const c = String(e.content || '');
    const lines = c.split('\n');
    console.log('\n===== uid=' + e.uid + ' ｜ ' + e.comment + ' ｜ content ' + c.length + ' 字符 ｜ 行数 ' + lines.length + ' =====');
    console.log('首行：' + (lines[0] || '').slice(0, 600));
    console.log('后续结构：');
    for (let i = 1; i < Math.min(lines.length, 26); i++) {
      if (/^#{1,3}\s|^<|^@@if|^-\s*\*\*|^时点|^前置|^覆盖|^收尾/.test(lines[i])) console.log('  ' + (i + 1) + ': ' + lines[i].slice(0, 150));
    }
    console.log('字段：keys=' + JSON.stringify(e.keys) + ' constant=' + e.constant + ' enabled=' + e.enabled + ' prevent_recursion=' + e.prevent_recursion + ' position=' + e.position + ' order=' + e.order);
  }
}
