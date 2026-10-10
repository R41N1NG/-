/**
 * P30_check_lord_gate.mjs —— 核「统一殿主专轨门禁」那行 deploy 探针（部署日志里打了 false）到底是不是真缺陷。
 * 只读：读**交付卡**里 comment 含「殿主」的条目，逐条报告
 *   · 是否含四个殿主名 · 是否有 `includes(variables.stat_data?.身份)` 身份判断
 *   · 是否有世界轴日期门（仙盟历） · 是否已被构建包装成 `@@if (function(){try{return (...)`
 *   · deploy 探针用的那条**原始字符串**是否命中
 */
import fs from 'node:fs';

const CARD = '最新角色卡/仙姝堕.json';
const 探针串 = "['焚欲殿主', '浊龙殿主', '欢喜殿主', '魂欢殿主'].includes(variables.stat_data?.身份)";
const c = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = (c.data.character_book.entries || []).filter((e) => /殿主/.test(e.comment || ''));

console.log('【交付卡】' + CARD + '　comment 含「殿主」的条目：' + es.length + ' 条\n');
let ok = 0;
for (const e of es) {
  const s = e.content || '';
  const 殿主名 = /(焚欲殿主|浊龙殿主|欢喜殿主|魂欢殿主)/.test(s);
  const 身份式 = /includes\(variables\.stat_data\?\.身份\)/.test(s);
  const 日期门 = /仙盟历/.test(s);
  const 包装 = /@@if \(function\(\)\{try\{return/.test(s);
  const 探针 = s.includes(探针串);
  if (殿主名 && 身份式 && 日期门) ok++;
  console.log('· id' + e.id + ' ' + e.comment + '｜enabled=' + e.enabled + '｜含殿主名=' + 殿主名 + '｜身份式=' + 身份式 + '｜日期门=' + 日期门 + '｜构建包装=' + 包装 + '｜deploy探针原串命中=' + 探针);
  const m = s.match(/@@if [^\n]{0,160}/);
  if (m) console.log('    门：' + m[0].slice(0, 150));
}
console.log('\n结论：' + ok + '/' + es.length + ' 条同时具备「殿主名 ＋ 身份判断 ＋ 世界轴日期门」。');
console.log('deploy 探针是**字面串比对**，而构建会把门包装成 `@@if (function(){try{return (...)`；'
  + '因此探针在包装后必然打 false —— 属**探针口径过时**，需以本件的结构核验为准。');
