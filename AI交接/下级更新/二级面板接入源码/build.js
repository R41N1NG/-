#!/usr/bin/env node
/**
 * build.js —— 《仙姝墮 · 一张跑全书》标准统一构建入口
 * 
 * 依次执行：
 * 1. 构建卡片 JSON（含文风硬关卡质检，231条完整世界书内嵌）
 * 2. 封包角色卡 PNG（底图 + chara + ccv3 块）
 * 3. 导出全量 231 条酒馆世界书（写入 dist/ 与酒馆）
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const node = 'C:\\Program Files\\nodejs\\node.exe';
const ROOT = __dirname;

function run(cmd, desc) {
  console.log(`\n▶ [${desc}] 正在执行: ${cmd}`);
  execSync(`"${node}" ${cmd}`, { cwd: ROOT, stdio: 'inherit' });
}

console.log('========================================================');
console.log('   《仙姝墮 · 一张跑全书》全工程自动化构建 (Build Pipeline)');
console.log('========================================================');

try {
  // 1. 构建卡片 JSON
  run('_build_card.js', '步骤 1/3: 编译角色卡 JSON (含文风硬关卡)');

  // 2. 封包 PNG
  run('_make_card_png.mjs --apply', '步骤 2/4: 封装角色卡 PNG');

  // 3. 导出全量世界书 (240条)
  run('_write_worldbook.mjs --apply', '步骤 3/4: 导出全量 240 条世界书');

  // 4. 世界书防递归与 Token 防爆质检
  run('tools/checks/_chk_recursion.mjs', '步骤 4/4: 世界书防递归与 Token 防爆质检');

  // 4. 同步至 dist/ 与 最新角色卡/
  const latestDir = path.join(ROOT, '最新角色卡');
  if (!fs.existsSync(latestDir)) fs.mkdirSync(latestDir, { recursive: true });
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const cardPng = path.join(ROOT, '仙姝堕.png');
  const cardPngOld = path.join(ROOT, '仙姝墮-角色卡（全书群像）.png');
  const cardJson = path.join(ROOT, '仙姝堕.json');
  const cardJsonOld = path.join(ROOT, '仙姝墮-角色卡（全书群像）.json');
  const wbTavern = 'E:\\tavern\\SillyTavern\\data\\default-user\\worlds\\仙姝堕.json';
  const wbTavernOld = 'E:\\tavern\\SillyTavern\\data\\default-user\\worlds\\仙姝墮 · 一张跑全书.json';

  if (fs.existsSync(cardPng)) fs.copyFileSync(cardPng, path.join(latestDir, '仙姝堕.png'));
  if (fs.existsSync(cardJson)) fs.copyFileSync(cardJson, path.join(latestDir, '仙姝堕.json'));
  // 清理 latestDir 历史残留旧名文件，严格恪守铁律 30（仅保留两份成品）
  for (const f of fs.readdirSync(latestDir)) {
    if (f !== '仙姝堕.png' && f !== '仙姝堕.json') fs.unlinkSync(path.join(latestDir, f));
  }

  if (fs.existsSync(cardPng)) fs.copyFileSync(cardPng, path.join(distDir, '仙姝堕.png'));
  if (fs.existsSync(cardPngOld)) fs.copyFileSync(cardPngOld, path.join(distDir, '仙姝墮-角色卡（全书群像）.png'));
  if (fs.existsSync(cardJson)) fs.copyFileSync(cardJson, path.join(distDir, '仙姝堕.json'));
  if (fs.existsSync(cardJsonOld)) fs.copyFileSync(cardJsonOld, path.join(distDir, '仙姝墮-角色卡（全书群像）.json'));
  /* 2026-10-08（gpt 22 批裁定）：清旧档**不能先删再构建** —— 万一新件生成失败，上一份有效产物就没了。
     顺序改为：**生成新件 → 校验成功 → 清理确属生成器管理的旧命名**；校验不过 ⇒ 一个旧档都不动。 */
  const 数条数 = (p) => {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      const e = j.entries;
      return Array.isArray(e) ? e.length : (e && typeof e === 'object' ? Object.keys(e).length : null);
    } catch (err) { return null; }
  };
  const wbN = fs.existsSync(wbTavern) ? 数条数(wbTavern) : (fs.existsSync(wbTavernOld) ? 数条数(wbTavernOld) : null);
  const 后缀 = wbN ? `（全量世界书${wbN}条）` : '';
  const 本次新件 = [];
  if (fs.existsSync(wbTavern) && wbN) { const p = path.join(distDir, `仙姝堕${后缀}.json`); fs.copyFileSync(wbTavern, p); 本次新件.push(path.basename(p)); }
  if (fs.existsSync(wbTavernOld) && wbN) { const p = path.join(distDir, `仙姝墮 · 一张跑全书${后缀}.json`); fs.copyFileSync(wbTavernOld, p); 本次新件.push(path.basename(p)); }
  const 校验通过 = 本次新件.length > 0 && 本次新件.every((f) => {
    const p = path.join(distDir, f);
    return fs.existsSync(p) && 数条数(p) === wbN;
  });
  if (校验通过) {
    let 清 = 0;
    for (const f of fs.readdirSync(distDir)) {
      if (/全量世界书\d+条/.test(f) && !本次新件.includes(f)) { fs.unlinkSync(path.join(distDir, f)); 清++; }
    }
    if (清) console.log(`🧹 新件校验通过（${wbN} 条）⇒ 清理 dist/ 旧命名世界书 ${清} 个`);
  } else {
    console.warn('⚠️ 本次世界书新件未通过校验（缺失或条目数不符）⇒ **保留全部旧档不清理**，请先查构建。');
  }

  console.log('\n========================================================');
  console.log('🎉 构建全部完成！产物已同步至 dist/ 目录：');
  const reportPng = fs.existsSync(cardPng) ? cardPng : cardPngOld;
  const reportJson = fs.existsSync(cardJson) ? cardJson : cardJsonOld;
  console.log('   - dist/仙姝堕.png (' + (fs.statSync(reportPng).size / 1024 / 1024).toFixed(2) + ' MB)');
  console.log('   - dist/仙姝堕.json (' + (fs.statSync(reportJson).size / 1024 / 1024).toFixed(2) + ' MB)');
  if (wbN) console.log('   - dist/仙姝堕' + 后缀 + '.json (' + ((fs.existsSync(wbTavern) ? fs.statSync(wbTavern) : fs.statSync(wbTavernOld)).size / 1024 / 1024).toFixed(2) + ' MB)');
  console.log('========================================================\n');
} catch (e) {
  console.error('\n❌ 构建失败中断:', e.message);
  process.exit(1);
}
