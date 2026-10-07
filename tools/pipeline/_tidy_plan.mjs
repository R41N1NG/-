#!/usr/bin/env node
/**
 * _tidy_plan.mjs —— 给 `设定提取\` 做"分门别类"的**安全方案**（默认只打印计划，不移动）
 *   安全前提：**凡被任何脚本以文件名引用的文件，一律钉住不动**（移动会断流水线）。
 *   用法：node _tidy_plan.mjs            → 打印计划
 *         node _tidy_plan.mjs --apply    → 执行移动（只动"没被任何脚本引用"的文件）
 */
import { readdirSync, readFileSync, statSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const DIR = 'E:\\角色卡制作\\仙姝堕';
const APPLY = process.argv.includes('--apply');

const all = readdirSync(DIR, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);

/* 扫**全树**的脚本（不只顶层）——子目录里的脚本同样会引用根目录文件 */
function walk(dir, out = []) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) { if (!/^(_归档|_备份与旧版|_报告与清单|_素材与图片|数据与中间件|_杂项)$/.test(d.name)) walk(p, out); }
    else if (/\.(mjs|cjs|js|ps1|py)$/i.test(d.name)) out.push(p);
  }
  return out;
}
const scripts = walk(DIR).map((p) => p);

/* ── 1) 收集"被脚本引用的文件名"（钉住集合） ── */
const pinned = new Set();
const quoted = /['"`]([^'"`\n]{1,120})['"`]/g;
for (const s of scripts) {
  let t = '';
  try { t = readFileSync(s, 'utf8'); } catch { continue; }
  let m;
  while ((m = quoted.exec(t))) {
    const v = m[1].trim();
    if (!/\.(json|txt|md|js|mjs|cjs|html|css|png|jpg|jpeg|webp|log|ps1|py)$/i.test(v)) continue;
    if (v.includes('/') || v.includes('\\')) continue;      // 子目录里的，不算根目录文件
    if (v.length > 60) continue;
    pinned.add(v);
  }
}
/* 手工补钉：卡产物/Png/骨架/词库 这类"按约定名"读的 ＋ **流水线入口脚本**
 *   （没有人"引用"入口脚本，但它们必须待在根目录 —— 第一次搬家就是把 `_chk_all.mjs` 搬走了，验收直接跑不起来） */
for (const extra of [
  '仙姝墮-角色卡（全书群像）.json', '仙姝墮-角色卡（全书群像）.png', '仙姝墮-世界书.json',
  '_card_panel_v4.css', '_card_panel_v4.replace.html', '_prose_baseline.json',
  '_chk_all.mjs', '_build_card.js', '_make_card_png.mjs', '_push_card.mjs', '_write_worldbook.mjs',
  '_pack_panel_script.mjs', '_sync_panel_css.mjs', '_sync_gallery_from_src.mjs', '_reflow_longlines.mjs',
  '_reverse_book_from_card.mjs', '_merge_specs.mjs', '_tidy_plan.mjs', '_verify_tavern_readback.mjs',
  '_clean_cards.mjs', '_calib_prose.mjs', '_mk_change_ledger.mjs', '_gen_portrait_small.mjs',
]) pinned.add(extra);

const isPinned = (f) => pinned.has(f) || pinned.has(basename(f));

/* ── 2) 分类规则（顺序即优先级） ── */
const RULES = [
  ['_备份与旧版', (f) => /\.(bak|旧|before-|_bak)/.test(f) || /\.bak-/.test(f) || /\.旧/.test(f)],
  ['_报告与清单', (f) => /^(_dump|_q_dump|_g\d|_chk_|_audit|_snap|_probe|_verify|_diag|_plan|_review|_泄漏|_双|_二|_质量|_清单|_提案|_对照|_索引)/.test(f) || /报告|清单|提案|对照|索引|体检|复查/.test(f)],
  ['文档与规范', (f) => extname(f) === '.md'],
  ['机制与设定源', (f) => /^(_card_core|_card_greetings|_stage_drive|_mind_engine|_relics_embed|_gallery_embed|_gallery_ids|_unlock_map|_归)/.test(f)],
  ['脚本与工具', (f) => /\.(mjs|cjs|js|ps1|py|html|css)$/i.test(f)],
  ['素材与图片', (f) => /\.(png|jpg|jpeg|webp)$/i.test(f)],
  ['数据与中间件', (f) => /\.(json|log|txt)$/i.test(f)],
];

const plan = new Map();   // 目标文件夹 → 文件数组
const stay = [];
for (const f of all) {
  if (isPinned(f)) { stay.push(f); continue; }
  let dest = '_杂项';
  for (const [dir, test] of RULES) if (test(f)) { dest = dir; break; }
  if (!plan.has(dest)) plan.set(dest, []);
  plan.get(dest).push(f);
}

console.log('顶层文件 ' + all.length + ' 件｜其中**被脚本引用 ⇒ 钉住不动** ' + stay.length + ' 件');
console.log('\n=== 钉住的（保持在原处）===');
console.log(stay.sort().map((f) => '  ' + f).join('\n'));
console.log('\n=== 计划搬运 ===');
let tot = 0;
for (const [dir, files] of [...plan.entries()].sort()) {
  const bytes = files.reduce((a, f) => a + statSync(join(DIR, f)).size, 0);
  tot += files.length;
  console.log(`  ${dir}/  ${String(files.length).padStart(4)} 件  ${(bytes / 1048576).toFixed(1)} MB   ← 例：${files.slice(0, 3).join(' ／ ')}`);
}
console.log('  合计搬运 ' + tot + ' 件');

if (!APPLY) { console.log('\n（演练；加 --apply 执行）'); process.exit(0); }
for (const [dir, files] of plan) {
  const to = join(DIR, dir);
  if (!existsSync(to)) mkdirSync(to, { recursive: true });
  for (const f of files) renameSync(join(DIR, f), join(to, f));
}
console.log('\n✅ 已搬运 ' + tot + ' 件到 ' + plan.size + ' 个子文件夹');
