#!/usr/bin/env node
/**
 * _chk_recursion.mjs —— 世界书防递归与 Token 防爆质检脚本 (铁律 48)
 * -------------------------------------------------------------
 * 验证：
 * 1. 角色卡内所有常驻绿灯条目 (constant: true) 必须 100% 开启 prevent_recursion: true
 * 2. 角色卡内所有剧情条目 (【剧情】) 必须 100% 开启 prevent_recursion: true
 * 3. 角色卡全卡 entries 默认开启 prevent_recursion
 * 4. 导出的独立世界书 (若存在) 常驻条目 preventRecursion 必须为 true
 *
 * 用法：node tools/checks/_chk_recursion.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const CARD_PATHS = [
  path.join(ROOT, '最新角色卡/仙姝堕.json'),
  path.join(ROOT, '仙姝堕.json'),
  path.join(ROOT, '仙姝墮-角色卡（全书群像）.json')
];

let targetCardPath = CARD_PATHS.find(p => fs.existsSync(p));
if (!targetCardPath) {
  console.error('❌ 未找到角色卡 JSON 文件！');
  process.exit(1);
}

console.log('🔍 正在质检角色卡:', path.relative(ROOT, targetCardPath));
const cardData = JSON.parse(fs.readFileSync(targetCardPath, 'utf8'));
const entries = cardData.data?.character_book?.entries || [];

if (!entries.length) {
  console.error('❌ 角色卡中无 character_book 条目！');
  process.exit(1);
}

let errors = [];

// 1. 检查常驻绿灯条目
const constantEntries = entries.filter(e => e.constant === true);
console.log(`📌 检测到常驻绿灯条目: ${constantEntries.length} 条`);

constantEntries.forEach(e => {
  const comment = e.comment || e.name || `id:${e.id}`;
  const extPR = e.extensions?.prevent_recursion;
  const rootPR = e.prevent_recursion;
  if (extPR !== true) {
    errors.push(`常驻条目 [${comment}] extensions.prevent_recursion 未开启 (实际为: ${extPR})`);
  }
  if (rootPR !== true) {
    errors.push(`常驻条目 [${comment}] root prevent_recursion 未开启 (实际为: ${rootPR})`);
  }
});

// 2. 检查剧情条目
const plotEntries = entries.filter(e => String(e.comment || e.name || '').includes('【剧情】'));
console.log(`📌 检测到剧情条目: ${plotEntries.length} 条`);
plotEntries.forEach(e => {
  const comment = e.comment || e.name || `id:${e.id}`;
  const extPR = e.extensions?.prevent_recursion;
  if (extPR !== true) {
    errors.push(`剧情条目 [${comment}] extensions.prevent_recursion 未开启 (实际为: ${extPR})`);
  }
});

// 3. 统计全卡条目防递归比例
const allPreventRec = entries.filter(e => e.extensions?.prevent_recursion === true);
console.log(`📌 全卡条目防递归开启数: ${allPreventRec.length} / ${entries.length} (${((allPreventRec.length / entries.length) * 100).toFixed(1)}%)`);

// 4. 检查酒馆独立世界书（若已部署）
const TAVERN_WB = 'E:\\tavern\\SillyTavern\\data\\default-user\\worlds\\仙姝堕.json';
if (fs.existsSync(TAVERN_WB)) {
  const wbData = JSON.parse(fs.readFileSync(TAVERN_WB, 'utf8'));
  const wbEntries = Object.values(wbData.entries || {});
  const wbConstants = wbEntries.filter(e => e.constant === true);
  console.log(`📌 检测到酒馆世界书文件: 常驻条目 ${wbConstants.length} 条`);
  wbConstants.forEach(e => {
    if (e.preventRecursion !== true) {
      errors.push(`酒馆世界书常驻条目 [${e.comment}] preventRecursion 未开启 (实际为: ${e.preventRecursion})`);
    }
  });
}

if (errors.length > 0) {
  console.error('\n❌ 递归质检失败，存在以下违规条目:');
  errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
  process.exit(1);
}

console.log('\n✅ 递归扫描防雪崩质检 100% 通过！所有常驻与剧情条目已安全绑定阻止递归。');
process.exit(0);
