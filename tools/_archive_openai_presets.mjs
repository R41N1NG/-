/**
 * _archive_openai_presets.mjs —— 把不用的 OpenAI 预设搬出 OpenAI Settings\
 *
 * 背景（2026-09-22）：
 *   酒馆的 POST /api/settings/get（src/endpoints/settings.js:231）每次都把
 *   `OpenAI Settings\` 里的**全部**预设读出来塞进响应。
 *   本机 53 个预设 = 116.3 MB → 该接口响应体 125.7 MB、耗时 65~72 秒，
 *   而启动链在 script.js:7382 `await getSettings()`，
 *   直到 7500 行 `settingsReady = true` 之前 hideLoader() 都执行不到 —— 齿轮一直转。
 *
 * 本脚本只做一件事：把保留名单之外的预设移到归档目录。
 * 不删除任何文件；要彻底删就把归档目录整个删掉。
 *
 * 用法：node _archive_openai_presets.mjs [--apply]
 *       不带 --apply 只做预演（dry-run）。
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC = 'E:/tavern/SillyTavern/data/default-user/OpenAI Settings';
const DEST = 'E:/火狐下载/_预设归档_20260922/OpenAI Settings';

// 保留名单：当前激活的预设 + 它的两个版本变体 + 系统兜底 Default
// （settings.json 的 oai_settings.preset_settings_openai = "剑仙90"）
const KEEP = [
  '剑仙90.json',
  'Default.json',
  '[主预设] V19.5 狐神抚 · 毓忻.json',
  '[主预设] V19.5 狐神抚 · 毓忻 (4) - Muse V3 重製版 v2.0（保留逐項預演・狐策修正） (3) - 模組B分流 v1.1.1－跨預設－僅排除A.json',
];

const apply = process.argv.includes('--apply');
const files = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.json'));
const move = files.filter((f) => !KEEP.includes(f));
const keep = files.filter((f) => KEEP.includes(f));

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
const sum = (list) => list.reduce((s, f) => s + fs.statSync(path.join(SRC, f)).size, 0);

console.log('=== 保留 ===');
for (const f of keep) console.log('  ' + mb(fs.statSync(path.join(SRC, f)).size).padStart(9) + '  ' + f.slice(0, 76));
console.log('  小计: ' + mb(sum(keep)));
console.log('\n=== 搬出到 ' + DEST + ' ===');
console.log('  文件数: ' + move.length + '  合计: ' + mb(sum(move)));

if (!apply) {
  console.log('\n（预演模式。加 --apply 才真正移动。）');
  console.log('  将移动的文件（前 15 个）:');
  move.slice(0, 15).forEach((f) => console.log('    ' + mb(fs.statSync(path.join(SRC, f)).size).padStart(9) + '  ' + f.slice(0, 76)));
  process.exit(0);
}

fs.mkdirSync(DEST, { recursive: true });
let moved = 0;
let movedBytes = 0;
for (const f of move) {
  const from = path.join(SRC, f);
  const to = path.join(DEST, f);
  if (fs.existsSync(to)) { console.log('  跳过（归档里已有同名文件）: ' + f); continue; }
  const sz = fs.statSync(from).size;
  fs.renameSync(from, to);          // 同一盘符内改名，不复制数据、瞬间完成
  moved++; movedBytes += sz;
}
console.log('\n✅ 已搬出 ' + moved + ' 个文件，共 ' + mb(movedBytes));
const rest = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.json'));
console.log('   OpenAI Settings\\ 现存 ' + rest.length + ' 个，合计 ' + mb(sum(rest)));
rest.forEach((f) => console.log('     ' + mb(fs.statSync(path.join(SRC, f)).size).padStart(9) + '  ' + f.slice(0, 76)));
console.log('\n   归档位置: ' + DEST);
console.log('   想彻底删除：直接把 E:\\火狐下载\\_预设归档_20260922 整个删掉。');
