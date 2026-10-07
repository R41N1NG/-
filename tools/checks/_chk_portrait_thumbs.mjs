#!/usr/bin/env node
/**
 * _chk_portrait_thumbs.mjs —— 立绘小图（本地候选链）落地核对
 *
 * 背景：面板脚本的本地候选链是 `XSD_LOCAL_PATHS × XSD_LOCAL_EXTS`（现在扩展名顺序 `.jpg → .png → .webp`）。
 *   库里原本只有 1.5–2 MB 的大 PNG ⇒ 面板每次渲染要把几 MB 拉进浏览器。2026-09-28 用
 *   `_gen_portrait_small.mjs` 生成 96×128 的基线 JPEG（**合计 44 KB**）并部署进图库。
 *
 * 本脚本核对（离线，不需要酒馆在跑）：
 *   ① 从 `卡片脚本\状态栏面板.js` 里**读出真实配置**（路径表与扩展名顺序），不写死假设
 *   ② 图库里每个「拼音 id」在**首选扩展名**下都存在
 *   ③ 首选扩展名的文件确实是小图（尺寸 ≤ 256×256、体积 ≤ 64 KB）——避免把 1.6 MB 大图当小图部署
 *   ④ 首选扩展名的文件是**合法 JPEG/PNG**（魔数 + 基线 JPEG 有 SOF0）
 *   ⑤ 报出「按首选扩展名，一次 404 都不该有」的结论，以及小图总体积
 *
 * 用法：node _chk_portrait_thumbs.mjs [图库目录]
 * 退出码：0 全通过 / 2 有失败
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] ?? 'E:/tavern/SillyTavern/data/default-user/user/images/xsd_gallery';
const PANEL = '卡片脚本/状态栏面板.js';

const ok = [];
const bad = [];
const ck = (cond, label) => (cond ? ok : bad).push(label);

/* ① 从面板脚本读真实配置 */
const src = readFileSync(PANEL, 'utf8');
const extsBlock = /const XSD_LOCAL_EXTS = \[([^\]]*)\]/.exec(src);
const pathsBlock = /const XSD_LOCAL_PATHS = \[([^\]]*)\]/.exec(src);
if (!extsBlock || !pathsBlock) { console.error('面板脚本里找不到 XSD_LOCAL_EXTS／XSD_LOCAL_PATHS'); process.exit(2); }
const EXTS = [...extsBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const PATHS = [...pathsBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
console.log(`面板配置：路径 ${PATHS.length} 条（首选 ${PATHS[0]}）｜扩展名顺序 ${EXTS.join(' → ')}`);
ck(EXTS[0] === '.jpg', `首选扩展名是 .jpg（实测小图体积最优；当前 ${EXTS.join('/')}）`);

/* ②~④ 逐个 id 核对 */
const files = readdirSync(DIR);
const ids = [...new Set(files
  .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
  .map((f) => f.replace(/\.[^.]+$/, '')))]
  .filter((id) => /^[a-z0-9_-]+$/.test(id));       // 只认拼音 id（中文名/说明文档不算）

const jpegInfo = (b) => {
  if (b.readUInt16BE(0) !== 0xffd8) return null;
  let i = 2;
  while (i < b.length - 1) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const m = b[i + 1];
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), comps: b[i + 9] };
    if (m === 0xda) break;
    i += 2 + len;
  }
  return { w: 0, h: 0, comps: 0 };
};
const pngSize = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });

let total = 0;
const rows = [];
for (const id of ids) {
  const prefer = EXTS.find((e) => files.includes(id + e));
  if (!prefer) { bad.push(`${id}：首选扩展名全都缺（${EXTS.join('/')}）⇒ 会落 SVG 占位`); continue; }
  const p = join(DIR, id + prefer);
  const size = statSync(p).size;
  const buf = readFileSync(p);
  const dim = prefer === '.jpg' || prefer === '.jpeg' ? jpegInfo(buf)
    : prefer === '.png' ? pngSize(buf) : { w: 0, h: 0 };
  total += size;
  const isSmall = size <= 64 * 1024 && dim.w > 0 && dim.w <= 256 && dim.h <= 256;
  if (!isSmall) bad.push(`${id}${prefer}：不像小图（${(size / 1024).toFixed(0)} KB，${dim.w}×${dim.h}）`);
  if (!dim.w) bad.push(`${id}${prefer}：解不出尺寸（不是合法 JPEG/PNG？）`);
  rows.push({ id, ext: prefer, kb: (size / 1024).toFixed(1), dim: `${dim.w}×${dim.h}` });
  if (prefer !== EXTS[0]) console.warn(`  ⚠️ ${id} 首选 ${EXTS[0]} 缺失，退到 ${prefer} ⇒ 会先吃一次 404`);
}

console.log(`\n图库：${ids.length} 个拼音 id`);
for (const r of rows) console.log(`  ✔ ${r.id.padEnd(24)} ${r.ext.padEnd(5)} ${r.kb.padStart(6)} KB  ${r.dim}`);
console.log(`  小图合计 ${(total / 1024).toFixed(1)} KB`);
ck(rows.every((r) => r.ext === EXTS[0]), `所有 id 都能在首选扩展名（${EXTS[0]}）下命中 ⇒ 渲染时 0 次 404`);

console.log('');
for (const l of ok) console.log('  ✔ ' + l);
if (bad.length) {
  console.log('\n【失败项】\n  ' + bad.join('\n  '));
  process.exit(2);
}
console.log(`\n✅ 全部通过（${ok.length} 项）`);
