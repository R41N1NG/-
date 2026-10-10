/**
 * P10_gate_class.mjs —— 按 gpt 02 号 §本批台账需要更正 的口径，**以实际表达式统计**日期门：
 *   29 = 主线15 ＋ 专轨7 ＋ 中立7；日期门据 gpt 记「13＝中立7＋殿主4＋自设2」。
 * 本脚本按成品卡实际 @@if 表达式重算，并把三条自设/专轨逐条列出（不靠标题猜）。
 */
import fs from 'node:fs';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17m_日期门分类统计.json';
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;

const rows = es.map((e) => {
  const c = e.content || '';
  const first = c.split('\n')[0] || '';
  const has = /^@@if/.test(first);
  const t = e.comment || '';
  let 类 = null;
  if (/殿主专轨/.test(t)) 类 = '殿主专轨';
  else if (/自设专轨/.test(t)) 类 = '自设专轨';
  else if (/【中立】/.test(t)) 类 = '中立';
  else if (/^【剧情】[一二三四五六七八九十]+\s*·/.test(t)) 类 = '主线';
  const 有日期 = has && /仙盟历/.test(first) && /15\d\d\.\d/.test(first);
  const 日期下界 = has ? (first.match(/仙盟历\)?\s*>=\s*(\d+(?:\.\d+)?)/) || [])[1] || '' : '';
  const 日期上界 = has ? (first.match(/仙盟历\)?\s*<\s*(\d+(?:\.\d+)?)/) || [])[1] || '' : '';
  return { id: e.id, 标题: t, 类, 在册: e.enabled !== false, 常驻: !!e.constant, 有闸门: has, 有日期门: 有日期, 日期下界, 日期上界 };
}).filter((r) => r.类);

const byClass = {};
for (const r of rows) {
  byClass[r.类] = byClass[r.类] || { 条数: 0, 有日期门: 0, 无日期门: 0, 明细: [] };
  byClass[r.类].条数++;
  if (r.有日期门) byClass[r.类].有日期门++; else byClass[r.类].无日期门++;
  byClass[r.类].明细.push({ id: r.id, 标题: r.标题, 有日期门: r.有日期门, 日期下界: r.日期下界, 日期上界: r.日期上界, 常驻: r.常驻 });
}
const out = { 卡: CARD, 有分类的条目数: rows.length, 分类统计: byClass, 无日期门清单: rows.filter((r) => !r.有日期门).map((r) => ({ 类: r.类, id: r.id, 标题: r.标题 })) };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, v.条数 + ' 条，有日期门 ' + v.有日期门 + '，无 ' + v.无日期门])), null, 1));
console.log('=== 无日期门 ===');
for (const r of out.无日期门清单) console.log(r.类 + '  id' + r.id + '  ' + r.标题);
