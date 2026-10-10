/**
 * P08_date_gate_fix.mjs —— 自查：上一版 P07 的「日期门」判据可能漏报（正则太窄）。
 * 这一版改用「闸门首行里出现 仙盟历 且出现 15xx.xx 数字」两条并列判定，并把
 * 命中的闸门首行原样打出来，供人工核。**两份判据的结果都留下，不留掩盖。**
 */
import fs from 'node:fs';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17k_日期门普查_修正版.json';
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;

const rows = es.map((e) => {
  const c = e.content || '';
  const first = c.split('\n')[0] || '';
  const hasGate = /^@@if/.test(first);
  const t = e.comment || '';
  const isPlot = /【剧情】|【中立】|专轨|殿主/.test(t);
  const 含仙盟历 = /仙盟历/.test(first);
  const 含日期数字 = /15\d\d\.\d/.test(first);
  return {
    id: e.id, 标题: t, 分类: isPlot ? '剧情/中立/专轨' : '其他', 在册: e.enabled !== false,
    常驻: !!e.constant, 有闸门: hasGate,
    旧判据_紧邻比较符: /仙盟历\s*[<>=]/.test(first),
    新判据_含仙盟历: 含仙盟历,
    新判据_含日期数字: 含日期数字,
    判定_有日期门: hasGate && 含仙盟历 && 含日期数字,
    闸门首行: first.slice(0, 260),
  };
});

const plot = rows.filter((r) => r.分类 === '剧情/中立/专轨');
const out = {
  卡: { 路径: CARD, 条目数: es.length },
  统计_修正: {
    剧情中立专轨条: plot.length,
    无闸门: plot.filter((r) => !r.有闸门).length,
    有日期门_新判据: plot.filter((r) => r.判定_有日期门).length,
    有日期门_旧判据: plot.filter((r) => r.旧判据_紧邻比较符).length,
    既含仙盟历但无日期数字: plot.filter((r) => r.新判据_含仙盟历 && !r.新判据_含日期数字).length,
  },
  有日期门的条目: plot.filter((r) => r.判定_有日期门).map((r) => ({ id: r.id, 标题: r.标题, 闸门首行: r.闸门首行 })),
  含仙盟历但无日期数字: plot.filter((r) => r.新判据_含仙盟历 && !r.新判据_含日期数字).map((r) => ({ id: r.id, 标题: r.标题, 闸门首行: r.闸门首行 })),
  全部: rows,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out.统计_修正, null, 1));
console.log('=== 有日期门的条目 ===');
for (const x of out.有日期门的条目) console.log('id' + x.id + ' ' + x.标题 + '\n    ' + x.闸门首行);
console.log('=== 含仙盟历但无日期数字 ===');
for (const x of out.含仙盟历但无日期数字) console.log('id' + x.id + ' ' + x.标题 + '\n    ' + x.闸门首行);
