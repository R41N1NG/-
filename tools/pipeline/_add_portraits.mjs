#!/usr/bin/env node
/**
 * _add_portraits.mjs —— 把新角色的立绘接进**既有立绘链**（不新造机制，全走现有通路）：
 *
 *   ① 图库小图：`<图库>/<id>.jpg` ＝ 192×256 基线 JPEG（既有 11 张是 96×128；门禁上限 256×256／64KB，
 *      所以新图给到 2×面板尺寸，面板显示时是下采样 ⇒ **更清晰**）
 *   ② 图库大图：`<图库>/<id>.png` ＝ **原分辨率直拷**（灯箱走本地链时是最清晰的那一份）
 *   ③ 卡内内嵌小图：`src/assets_data/_gallery_embed.json`（既有 192×256 WebP ⇒ 新图用 JPEG data URI，同尺寸）
 *   ④ 卡内内嵌大图：`src/assets_data/_gallery_embed_big.json`（既有 452×800 ⇒ 新图给 **720×1146**，
 *      灯箱 `max-width:560px` 下是下采样 ⇒ 点开更清晰；体积按 720 档实测 ~114–224 KB/张）
 *   ⑤ `src/assets_data/_gallery_ids.json` 追加 id
 *
 * 缩放/编码**复用既有工具** `tools/pipeline/_gen_portrait_small.mjs`（纯 Node 自写 PNG 解码＋JPEG 编码），
 * 本脚本只做"调它、搬文件、写表"三件事，不复制它的算法。
 *
 * 用法：node tools/pipeline/_add_portraits.mjs [清单.json] [--dry]
 *   清单格式：{ "<中文名>": { "id": "<拼音id>", "png": "<源PNG路径>" }, ... }
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';

const ROOT = process.cwd();
const TOOL = join(ROOT, 'tools', 'pipeline', '_gen_portrait_small.mjs');
const GALLERY = 'E:/tavern/SillyTavern/data/default-user/user/images/xsd_gallery';
const EMBED_SMALL = join(ROOT, 'src', 'assets_data', '_gallery_embed.json');
const EMBED_BIG = join(ROOT, 'src', 'assets_data', '_gallery_embed_big.json');
const IDS = join(ROOT, 'src', 'assets_data', '_gallery_ids.json');
const TMP = join(ROOT, 'src', 'assets_data', 'incoming', '.gen');

const 清单路径 = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(ROOT, 'src', 'assets_data', 'incoming', '_new_portraits.json');
const DRY = process.argv.includes('--dry');

const 小图 = [192, 256];
const 大图 = [720, 1146];
const 清单 = JSON.parse(readFileSync(清单路径, 'utf8'));

mkdirSync(TMP, { recursive: true });
const 报告 = [];
for (const [中文名, spec] of Object.entries(清单)) {
  const id = String(spec.id || '').trim();
  const png = spec.png;
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) { console.error(`✘ ${中文名}：id 不合规（${id}）`); process.exit(2); }
  if (!existsSync(png)) { console.error(`✘ ${中文名}：源图不存在 ${png}`); process.exit(2); }
  const 源字节 = statSync(png).size;

  const 跑 = (w, h, 前缀) => {
    execFileSync(process.execPath, [TOOL, png, 前缀, String(w), String(h), '--apply'], { stdio: 'pipe' });
    return 前缀 + '.jpg';
  };
  const 小jpg = 跑(小图[0], 小图[1], join(TMP, `${id}_${小图[0]}`));
  const 大jpg = 跑(大图[0], 大图[1], join(TMP, `${id}_${大图[0]}`));
  const uri = (p) => 'data:image/jpeg;base64,' + readFileSync(p).toString('base64');

  if (!DRY) {
    mkdirSync(GALLERY, { recursive: true });
    copyFileSync(小jpg, join(GALLERY, `${id}.jpg`));      // ① 图库小图
    copyFileSync(png, join(GALLERY, `${id}.png`));        // ② 图库大图＝原分辨率直拷
  }

  const eS = JSON.parse(readFileSync(EMBED_SMALL, 'utf8'));
  const eB = JSON.parse(readFileSync(EMBED_BIG, 'utf8'));
  const s0 = eS[id] ? String(eS[id]).length : 0;
  const b0 = eB[id] ? String(eB[id]).length : 0;
  eS[id] = uri(小jpg);                                   // ③ 卡内内嵌小图
  eB[id] = uri(大jpg);                                   // ④ 卡内内嵌大图
  if (!DRY) {
    writeFileSync(EMBED_SMALL, JSON.stringify(eS), 'utf8');
    writeFileSync(EMBED_BIG, JSON.stringify(eB), 'utf8');
    const ids = JSON.parse(readFileSync(IDS, 'utf8'));
    if (!ids.includes(id)) { ids.push(id); writeFileSync(IDS, JSON.stringify(ids), 'utf8'); }
  }

  报告.push({
    中文名, id,
    源PNG: `${(源字节 / 1024 / 1024).toFixed(2)} MB`,
    图库小图: `${小图.join('×')} ${(statSync(小jpg).size / 1024).toFixed(1)} KB`,
    图库大图: `${(源字节 / 1024 / 1024).toFixed(2)} MB（原分辨率直拷）`,
    内嵌小图: `${小图.join('×')} ${(String(eS[id]).length / 1024).toFixed(0)} KB（原 ${(s0 / 1024).toFixed(0)} KB）`,
    内嵌大图: `${大图.join('×')} ${(String(eB[id]).length / 1024).toFixed(0)} KB（原 ${(b0 / 1024).toFixed(0)} KB）`,
  });
}
if (!DRY) rmSync(TMP, { recursive: true, force: true });

console.log('【立绘接入】' + (DRY ? '（预演，未写盘）' : '') + '　图库：' + GALLERY);
for (const r of 报告) {
  console.log(`· ${r.中文名} (${r.id})`);
  console.log(`    源　　：${r.源PNG}`);
  console.log(`    小图　：${r.图库小图}　→ ${GALLERY}/<id>.jpg`);
  console.log(`    大图　：${r.图库大图}　→ ${GALLERY}/<id>.png`);
  console.log(`    内嵌小：${r.内嵌小图}`);
  console.log(`    内嵌大：${r.内嵌大图}`);
}
const eS = JSON.parse(readFileSync(EMBED_SMALL, 'utf8'));
const eB = JSON.parse(readFileSync(EMBED_BIG, 'utf8'));
console.log(`\n内嵌表：小图 ${Object.keys(eS).length} 个 id｜大图 ${Object.keys(eB).length} 个 id`);
console.log(`表体积：小图 ${(statSync(EMBED_SMALL).size / 1024).toFixed(0)} KB｜大图 ${(statSync(EMBED_BIG).size / 1024 / 1024).toFixed(2)} MB`);
