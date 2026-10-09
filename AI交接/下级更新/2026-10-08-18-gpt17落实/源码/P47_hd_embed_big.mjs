/**
 * P47_hd_embed_big.mjs —— 把卡内**内嵌大图**（`src/assets_data/_gallery_embed_big.json`）提到**高清**，
 * 让"分享出去的卡"在任何机器上都清晰（主人 2026-10-09：**杜绝依赖本地图库**）。
 *
 * 做法：对图库里每张**原图 PNG**（993×1583 级）→ 缩到宽度 ≤ 目标宽（默认 1000，不放大）→ JPEG q82（复用既有 CLI 编码器）
 *      → data URI 写回 `_gallery_embed_big.json`（写前备份；无原图的键保留原值）。
 * 只读图库与旧表；只写这一张表。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'E:/角色卡制作/仙姝堕';
const GAL = 'E:/tavern/SillyTavern/data/default-user/user/images/xsd_gallery';
const BIG = path.join(ROOT, 'src/assets_data/_gallery_embed_big.json');
const TMP = path.join(ROOT, '.gen/hd-big');
const CLI = path.join(ROOT, 'tools/pipeline/_gen_portrait_small.mjs');
const 目标宽 = Number(process.env.XSD_HD_W || 1000);

fs.mkdirSync(TMP, { recursive: true });
const 旧 = JSON.parse(fs.readFileSync(BIG, 'utf8'));
const 旧体积 = fs.statSync(BIG).size;

/* PNG 尺寸（IHDR） */
const png尺寸 = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });

const 新 = {};
let 高清数 = 0, 保留数 = 0, 新字节 = 0;
const 明细 = [];
for (const key of Object.keys(旧)) {
  const src = path.join(GAL, key + '.png');
  if (!fs.existsSync(src)) { 新[key] = 旧[key]; 保留数++; 明细.push([key, '保留原内嵌（无原图 PNG）', 0, 0, Math.round(旧[key].length / 1024)]); continue; }
  const buf = fs.readFileSync(src);
  const { w, h } = png尺寸(buf);
  let dw = Math.min(w, 目标宽);
  let dh = Math.round(h * dw / w);
  if (dw % 2) dw--;
  if (dh % 2) dh--;
  const prefix = path.join(TMP, key);
  try {
    execFileSync(process.execPath, [CLI, src, prefix, String(dw), String(dh), '--apply'], { stdio: 'ignore' });
    const jpg = fs.readFileSync(prefix + '.jpg');
    const uri = 'data:image/jpeg;base64,' + jpg.toString('base64');
    新[key] = uri; 高清数++; 新字节 += uri.length;
    明细.push([key, w + '×' + h + ' → ' + dw + '×' + dh, Math.round(buf.length / 1024), Math.round(jpg.length / 1024), Math.round(uri.length / 1024)]);
  } catch (e) {
    新[key] = 旧[key]; 保留数++;
    明细.push([key, '编码失败，保留原内嵌：' + e.message.slice(0, 40), 0, 0, Math.round(旧[key].length / 1024)]);
  }
}
const 保留字节 = Object.keys(旧).reduce((a, k) => a + (String(旧[k]).length), 0) - 明细.filter((d) => d[1].startsWith('保留')).reduce((a, d) => a + d[4] * 1024, 0);
const 新总 = 新字节 + Math.max(0, 保留字节);
fs.copyFileSync(BIG, BIG + '.bak-before-hd');
fs.writeFileSync(BIG, JSON.stringify(新), 'utf8');
const 表体积 = fs.statSync(BIG).size;

console.log('══ 内嵌大图高清化（宽度上限 ' + 目标宽 + '，JPEG q82）══');
console.log('  键数 ' + Object.keys(旧).length + '｜高清化 ' + 高清数 + '｜保留原样 ' + 保留数);
console.log('  表体积：' + (旧体积 / 1048576).toFixed(2) + ' MB → **' + (表体积 / 1048576).toFixed(2) + ' MB**');
console.log('  明细（前 14 条）：');
for (const d of 明细.slice(0, 14)) console.log('   · ' + d[0] + '　' + d[1] + '　源 ' + d[2] + ' KB → jpg ' + d[3] + ' KB（uri ' + d[4] + ' KB）');
console.log('  ⇒ 已写 ' + BIG + '（备份 .bak-before-hd）');
