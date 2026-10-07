#!/usr/bin/env node
/**
 * _archive_stale.mjs —— 把"旧文档／旧文件"归档，让它们**不再影响工作**（主人 2026-10-01）
 *
 * 判据（三条都要过才归档）：
 *   ① 不在 KEEP 名单（现行判据四本 ＋ 交接说明 ＋ 卡与源件 ＋ 流水线脚本 ＋ 在用工具）
 *   ② **没有被任何 KEEP 脚本按文件名引用**（被引用的留着，不然会断）
 *   ③ 是"文档／数据快照／已用过的工具"，不是卡产物
 * 目标：`_归档-过时勿用\{文档|工具|快照}\`
 * 用法：node _archive_stale.mjs [--apply]
 */
import { readdirSync, readFileSync, mkdirSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIR = 'E:\\角色卡制作\\仙姝堕';
const ARC = join(DIR, '_归档-过时勿用');
const APPLY = process.argv.includes('--apply');

const root = readdirSync(DIR, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);

/* ── ① 现行判据与在用件（名字写死，改这里就是改判据） ── */
const KEEP_DATA = [
  '制卡规范（统一版）.md', '书写规范 v1.0（全局·合并版）.md', '错题本.md', '质检规范（硬关卡+软关卡）.md',
  '秋风规范（给模型读）.md', '世界书体例（YAML+tag）.md', '交接说明.md',
  '仙姝墮-角色卡（全书群像）.json', '仙姝墮-角色卡（全书群像）.png', '仙姝墮-角色卡（全书群像）.png.旧',
  '仙姝墮-世界书.json', '仙姝墮-分章提取明细.md',
  '_card_core.txt', '_card_greetings.txt', '_card_first_mes.txt', '_card_mes.txt', '_stage_drive.txt',
  '_mind_engine_entries.json', '_gallery_embed.json', '_gallery_embed_big.json', '_relics_embed.json',
  '_gallery_ids.json', '_unlock_map.json', '_prose_baseline.json',
  '_card_panel_v4.css', '_card_panel_v4.replace.html', '_card_panel_v5.shell.html',
  '_fne_full.txt', '_fne_slim.txt', '_dump_entries.txt',
];
const KEEP_SCRIPT_RE = /^_(build_card|make_card_png|push_card|write_worldbook|pack_panel_script|sync_panel_css|sync_gallery_from_src|reflow_longlines|gen_|chk_|ef_|probe_|verify_|clean_cards|calib_prose|fix_import_tavern|fix_mind_engine_for_card|final_check_card|mk_change_ledger|mk_panel|mk_card|test_hud|dump_entries|reverse_book_from_card|merge_specs|tidy_plan|purge_stale_terms|archive_stale)/;

/* ★ 更强的判据：**被现行文档点名的脚本才算活的**
 *   —— `_chk_all.mjs` 跑的那 30 个 ＋ `制卡规范（统一版）`／`交接说明` 正文里点过名的。 */
const LIVE_DOCS = ['制卡规范（统一版）.md', '交接说明.md', '书写规范 v1.0（全局·合并版）.md', '质检规范（硬关卡+软关卡）.md', '世界书体例（YAML+tag）.md'];
const named = new Set();
{
  const t = readFileSync(join(DIR, '_chk_all.mjs'), 'utf8');
  for (const m of t.matchAll(/'(_[A-Za-z0-9_]+\.(?:mjs|cjs|js))'/g)) named.add(m[1]);
  for (const d of LIVE_DOCS) {
    if (!existsSync(join(DIR, d))) continue;
    const x = readFileSync(join(DIR, d), 'utf8');
    for (const m of x.matchAll(/(_[A-Za-z0-9_]+\.(?:mjs|cjs|js))/g)) named.add(m[1]);
  }
}
const isKeepData = (f) => KEEP_DATA.includes(f);
const isKeepScript = (f) => named.has(f) || (KEEP_SCRIPT_RE.test(f) && /\.(mjs|cjs|js|ps1)$/.test(f));

/* ── ② KEEP 脚本引用到的文件名（这些不能动） ── */
const keepScripts = root.filter(isKeepScript);
const referenced = new Set();
const quoted = /['"`]([^'"`\n]{1,120})['"`]/g;
for (const s of keepScripts) {
  let t = '';
  try { t = readFileSync(join(DIR, s), 'utf8'); } catch { continue; }
  let m;
  while ((m = quoted.exec(t))) {
    const v = m[1].trim();
    if (!/\.(json|txt|md|js|mjs|cjs|html|css|png|jpg|log)$/i.test(v)) continue;
    if (/[\\/]/.test(v) || v.length > 60) continue;
    referenced.add(v);
  }
}

/* ── ③ 分类归档 ── */
const bucket = (f) => (extname(f) === '.md' ? '文档'
  : /\.(json|txt|log)$/i.test(f) ? '快照'
  : /\.(mjs|cjs|js|ps1|py|html|css)$/i.test(f) ? '工具' : '杂项');

const plan = [];
for (const f of root) {
  if (isKeepData(f) || isKeepScript(f)) continue;
  if (referenced.has(f)) continue;
  plan.push([bucket(f), f]);
}

console.log('根目录 ' + root.length + ' 件｜KEEP 数据 ' + KEEP_DATA.length + ' 项｜KEEP 脚本 ' + keepScripts.length + ' 个｜被引用而保留 ' + referenced.size + ' 名');
const byB = {};
for (const [b, f] of plan) (byB[b] = byB[b] || []).push(f);
for (const b of Object.keys(byB).sort()) {
  console.log(`\n→ _归档-过时勿用/${b}/  ${byB[b].length} 件`);
  console.log('   ' + byB[b].slice(0, 8).join(' ／ ') + (byB[b].length > 8 ? ' …' : ''));
}
console.log('\n合计归档 ' + plan.length + ' 件');
console.log('\n=== 留在根目录的（' + (root.length - plan.length) + ' 件）===');
const stay = root.filter((f) => !plan.some(([, x]) => x === f));
console.log(stay.sort().map((f) => '  ' + f).join('\n'));

if (!APPLY) { console.log('\n（演练；加 --apply 执行）'); process.exit(0); }
for (const [b, f] of plan) {
  const to = join(ARC, b);
  if (!existsSync(to)) mkdirSync(to, { recursive: true });
  renameSync(join(DIR, f), join(to, f));
}
console.log('\n✅ 已归档 ' + plan.length + ' 件到 ' + ARC);
