/**
 * _tavern_toggle_ext.mjs —— 安全启停一个酒馆扩展（改 settings.json 的 disabledExtensions）
 *
 * 为什么单独写个脚本：
 *   酒馆 1.14.0 里**唯一可靠**的停用方式就是 settings.json 里 `extension_settings.disabledExtensions`
 *   数组（元素格式 `third-party/<目录名>`）。把目录改名加前缀是无效的。
 *   而 settings.json 有两个要命的坑：① 绝不能带 BOM；② 写坏了酒馆直接黑屏。
 *   所以这里：先备份 → 解析 → 改 → **先写临时文件再原子替换** → 回读校验。
 *
 * 用法：
 *   node _tavern_toggle_ext.mjs off 世界书阶段切换
 *   node _tavern_toggle_ext.mjs on  世界书阶段切换
 *   node _tavern_toggle_ext.mjs list
 */

import fs from 'node:fs';
import path from 'node:path';

const SETTINGS = 'E:/tavern/SillyTavern/data/default-user/settings.json';
const BACKUP_DIR = 'E:/火狐下载/_酒馆备份_20260922';
const PREFIX = 'third-party/';

const [action, dirName] = process.argv.slice(2);

function readSettings() {
  const raw = fs.readFileSync(SETTINGS, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) throw new Error('settings.json 带 BOM，先处理它');
  return { json: JSON.parse(raw), raw };
}

/** 无 BOM UTF-8 + 原子替换；绝不留下半截文件 */
function writeSettings(json) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(SETTINGS, path.join(BACKUP_DIR, `settings_${stamp}.json.bak`));
  const text = JSON.stringify(json, null, 4);
  const tmp = SETTINGS + '.tmp-write';
  fs.writeFileSync(tmp, text, { encoding: 'utf8' });   // Node 默认不写 BOM
  fs.renameSync(tmp, SETTINGS);
  // 回读校验：能解析 + 无 BOM
  const back = fs.readFileSync(SETTINGS, 'utf8');
  if (back.charCodeAt(0) === 0xFEFF) throw new Error('写入后出现 BOM！已中止');
  JSON.parse(back);
  return text.length;
}

if (action === 'list') {
  const { json } = readSettings();
  const dis = json.extension_settings?.disabledExtensions ?? [];
  console.log('disabledExtensions（共 ' + dis.length + ' 项）：');
  dis.forEach((d) => console.log('  ' + d));
  process.exit(0);
}

if (!dirName) {
  console.error('用法: _tavern_toggle_ext.mjs off|on <目录名>');
  process.exit(1);
}
if (action !== 'off' && action !== 'on') {
  console.error('action 只能是 off / on');
  process.exit(1);
}

const { json } = readSettings();
if (!json.extension_settings) json.extension_settings = {};
if (!Array.isArray(json.extension_settings.disabledExtensions)) json.extension_settings.disabledExtensions = [];
const key = PREFIX + dirName;
const dis = json.extension_settings.disabledExtensions;
const has = dis.includes(key);

if (action === 'off') {
  if (has) { console.log(`「${dirName}」已经是停用状态，未改动。`); process.exit(0); }
  dis.push(key);
  const n = writeSettings(json);
  console.log(`✅ 已停用「${dirName}」（写入 ${key}）`);
  console.log(`   新 settings.json 体积: ${(n / 1024).toFixed(1)} KB`);
  console.log('   当前 disabledExtensions:');
  dis.forEach((d) => console.log('     ' + d));
} else {
  if (!has) { console.log(`「${dirName}」本来就是启用状态，未改动。`); process.exit(0); }
  json.extension_settings.disabledExtensions = dis.filter((d) => d !== key);
  const n = writeSettings(json);
  console.log(`✅ 已启用「${dirName}」（移除 ${key}）`);
  console.log(`   新 settings.json 体积: ${(n / 1024).toFixed(1)} KB`);
  json.extension_settings.disabledExtensions.forEach((d) => console.log('     ' + d));
}
