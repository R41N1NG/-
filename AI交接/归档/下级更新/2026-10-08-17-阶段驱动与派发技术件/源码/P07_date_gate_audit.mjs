/**
 * P07_date_gate_audit.mjs —— 只读：全卡「日期门 / 事实门 / 常驻」现状普查
 * 用途：核 gpt 多号要求过的「全入口保持日期＋真实后果前置」到底落实了多少。
 * 只看成品卡（以新卡为准），不读 references 源。
 */
import fs from 'node:fs';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17j_日期门普查.json';

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;

const rows = es.map((e) => {
  const c = e.content || '';
  const first = c.split('\n')[0] || '';
  const hasGate = /^@@if/.test(first);
  const gate = hasGate ? first : '';
  const t = e.comment || '';
  const isPlot = /【剧情】|【中立】|专轨|殿主/.test(t);
  return {
    id: e.id,
    标题: t,
    分类: isPlot ? '剧情/中立/专轨' : '其他',
    在册: e.enabled !== false,
    常驻: !!e.constant,
    有闸门: hasGate,
    闸门有日期条件: /仙盟历\s*[<>=]|仙盟历\s*∈|仙盟历\s*>=|仙盟历\s*<=|仙盟历\s*</.test(gate),
    闸门有known条件: /known/.test(gate),
    闸门首行: gate.slice(0, 200),
    content字符数: c.length,
  };
});

const plot = rows.filter((r) => r.分类 === '剧情/中立/专轨');
const out = {
  卡: { 路径: CARD, 条目数: es.length },
  统计: {
    剧情中立专轨条: plot.length,
    其中无闸门: plot.filter((r) => !r.有闸门).length,
    其中有闸门无日期条件: plot.filter((r) => r.有闸门 && !r.闸门有日期条件).length,
    其中有日期条件: plot.filter((r) => r.闸门有日期条件).length,
    常驻条: rows.filter((r) => r.常驻).length,
    常驻且无闸门: rows.filter((r) => r.常驻 && !r.有闸门).length,
  },
  剧情中立专轨_无日期条件: plot.filter((r) => !r.闸门有日期条件).map((r) => ({
    id: r.id, 标题: r.标题, 常驻: r.常驻, 有闸门: r.有闸门, 有known: r.闸门有known条件,
    闸门首行: r.闸门首行,
  })),
  剧情中立专轨_有日期条件: plot.filter((r) => r.闸门有日期条件).map((r) => ({ id: r.id, 标题: r.标题, 闸门首行: r.闸门首行 })),
  常驻无闸门清单: rows.filter((r) => r.常驻 && !r.有闸门).map((r) => ({ id: r.id, 标题: r.标题 })),
  全部: rows,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ 统计: out.统计, 无日期条件的剧情条: out.剧情中立专轨_无日期条件.map((x) => x.id + ':' + x.标题), 有日期条件: out.剧情中立专轨_有日期条件.map((x) => x.id + ':' + x.标题) }, null, 1));
