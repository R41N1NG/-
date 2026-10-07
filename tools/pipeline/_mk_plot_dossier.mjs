#!/usr/bin/env node
/**
 * _mk_plot_dossier.mjs —— **全书剧情条汇编**（2026-09-30 · 主人令「先把所有剧情条目列出来」）
 *
 * 内容：
 *   ① 在册的【剧情】条 **全文逐字照录**（＋ 每条现在的闸门，方便对着定条件）
 *   ② 附录：**已删的剧情总表**（主人 2026-09-30「删」掉的那几条，原文从 `.bak-20260930plan` 取回）
 *      —— 因为要看"所有剧情"，这几条恰恰是最全的；要不要恢复由主人定。
 * 用法：node _mk_plot_dossier.mjs [输出.md]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const book = JSON.parse(readFileSync(D + '仙姝墮-世界书.json', 'utf8')).entries;
const bak = JSON.parse(readFileSync(D + '仙姝墮-世界书-前期.json.bak-20260930plan', 'utf8')).entries;
const strip = (c) => String(c).replace(/^(\s*〔待解锁〕)+/, '');
const byOrder = (o) => Object.values(o).sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.uid).localeCompare(String(b.uid)));
const gate = (e) => { const m = /^@@if\s+(.+)$/.exec(String(e.content).split('\n')[0].trim()); return m ? m[1] : null; };

const md = [];
md.push('# 全书剧情条汇编（2026-09-30）');
md.push('');
md.push('> 用途：主人要「看到所有剧情」再给标记条定条件。**正文逐字照录，未删节、未转述。**');
md.push('> 每条给：状态（启用／停用）／现在的闸门／全文。');
md.push('> 文末附录给出**已删的剧情总表原文**（这几条是全书概览，要恢复说一声）。');

const plots = byOrder(book).filter((e) => /^【剧情】/.test(strip(e.comment)));
md.push(`\n---\n\n## 一、在册【剧情】条（${plots.length} 条）\n`);
plots.forEach((e, i) => {
  const g = gate(e);
  md.push(`\n### ${i + 1}. ${strip(e.comment)}`);
  md.push('');
  md.push(`- 状态：**${e.disable === true ? '停用（不进上下文）' : '启用'}**｜order ${e.order}｜uid ${e.uid}`);
  md.push(`- 触发词：\`${(e.key || []).join('`／`')}\``);
  md.push(`- 现在的闸门：${g ? '`' + g.replace(/variables\.stat_data\?/g, '') + '`' : '（无闸门）'}`);
  md.push('');
  md.push('```text');
  md.push(String(e.content));
  md.push('```');
});

/* 附录：已删的剧情总表 */
const delNames = ['剧情发展简表（全书·含反转）', '全书时间线（含原文自相矛盾处）', '主线时间轴与走向'];
md.push('\n---\n\n## 二、附录：已删／仍在的「剧情总表」原文\n');
for (const n of delNames) {
  const inBook = Object.values(book).find((e) => strip(e.comment).replace(/^【[^】]*】/, '') === n);
  const inBak = Object.values(bak).find((e) => strip(e.comment).replace(/^【[^】]*】/, '') === n);
  const e = inBook || inBak;
  if (!e) { md.push(`\n### ${n}\n\n（备份里也找不到）`); continue; }
  md.push(`\n### ${n}`);
  md.push(`\n- 现状：**${inBook ? (inBook.disable === true ? '在册·停用' : '在册·启用') : '已于 2026-09-30 删除（原文见下，可取回）'}**｜uid ${e.uid}`);
  md.push('');
  md.push('```text');
  md.push(String(e.content));
  md.push('```');
}
const out = process.argv[2] ?? D + '全书剧情条汇编.md';
writeFileSync(out, md.join('\n') + '\n', 'utf8');
console.log('已写 ' + out + `（在册剧情条 ${plots.length} 条）`);
console.log('在册剧情条：');
plots.forEach((e) => {
  const t = String(e.content).split('\n').filter((l) => /时点/.test(l)).map((l) => l.replace(/[*#-]/g, '').trim()).join(' ');
  console.log('   ' + strip(e.comment).replace('【剧情】', '').slice(0, 34).padEnd(36) + (e.disable ? '停用' : '启用') + '｜' + (t || '（无时点行）').slice(0, 46));
});
