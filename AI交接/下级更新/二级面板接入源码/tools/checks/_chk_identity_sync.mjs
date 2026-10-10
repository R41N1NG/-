/**
 * 《仙姝堕》身份与剧情条目联动互斥离线仿真质检脚本
 * -------------------------------------------------------------
 * 用途：验证 6 大身份切换时，身份条目（6条）与剧情条目（22条）是否严格互斥开合
 * 运行方式：node tools/checks/_chk_identity_sync.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const CARD_JSON = path.join(ROOT, '最新角色卡/仙姝堕.json');
if (!fs.existsSync(CARD_JSON)) {
  console.error('❌ 未找到最新角色卡文件:', CARD_JSON);
  process.exit(1);
}

const cardData = JSON.parse(fs.readFileSync(CARD_JSON, 'utf8'));
const entries = cardData.data?.character_book?.entries || [];

if (!entries.length) {
  console.error('❌ 角色卡中无世界书条目！');
  process.exit(1);
}

const IDENTITY_NAMES = ['赵无忧', '自设', '焚欲殿主', '欢喜殿主', '浊龙殿主', '魂欢殿主'];

function simulateSync(targetName, initialEntries) {
  const es = JSON.parse(JSON.stringify(initialEntries));
  const nameOf = (e) => String((e && (e.name ?? e.comment)) || '');
  const hit = es.filter((e) => nameOf(e).startsWith('【身份】'));
  const isLord = ['焚欲殿主', '浊龙殿主', '欢喜殿主', '魂欢殿主'].includes(targetName);

  let changed = 0, idChanged = 0, plotChanged = 0;

  // 1. 身份条目
  for (const e of hit) {
    const nm = nameOf(e);
    const idName = nm.replace('【身份】', '').trim();
    if (!IDENTITY_NAMES.includes(idName)) continue;
    const want = (idName === targetName);
    const curEnabled = e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true);
    if (curEnabled !== want) {
      e.enabled = want;
      e.disable = !want;
      changed++;
      idChanged++;
    }
  }

  // 2. 剧情条目联动
  const plotEntries = es.filter((e) => nameOf(e).startsWith('【剧情】'));
  for (const e of plotEntries) {
    const nm = nameOf(e);
    let want = false;
    const isCustomTrack = nm.includes('自设专轨');
    const isLordTrack = nm.includes('殿主专轨');
    const isMainTrack = !isCustomTrack && !isLordTrack;

    if (targetName === '赵无忧') {
      want = isMainTrack;
    } else if (targetName === '自设') {
      want = isCustomTrack;
    } else if (isLord) {
      want = isLordTrack;
    }

    const curEnabled = e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true);
    if (curEnabled !== want) {
      e.enabled = want;
      e.disable = !want;
      changed++;
      plotChanged++;
    }
  }

  const isEntryOn = (e) => (e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true));
  const onIds = es.filter((e) => nameOf(e).startsWith('【身份】') && isEntryOn(e)).map(nameOf);
  const onPlots = es.filter((e) => nameOf(e).startsWith('【剧情】') && isEntryOn(e)).map(nameOf);

  return {
    target: targetName,
    changed,
    idChanged,
    plotChanged,
    activeIdentities: onIds,
    activePlots: onPlots,
    updatedEntries: es
  };
}

console.log('========================================================');
console.log('   《仙姝堕》多身份与剧情条目全联动离线质检');
console.log('========================================================\n');

let allPassed = true;

// Test 1: 初始赵无忧
const r1 = simulateSync('赵无忧', entries);
const pass1 = (r1.activeIdentities.length === 1 && r1.activeIdentities[0] === '【身份】赵无忧' && r1.activePlots.length === 15);
console.log(`[测试 1: 赵无忧默认路径] => 激活身份: [${r1.activeIdentities}], 激活剧情: ${r1.activePlots.length} 条 (预期 15) -> ${pass1 ? '✔ PASS' : '❌ FAIL'}`);
if (!pass1) allPassed = false;

// Test 2: 切到 自设
const r2 = simulateSync('自设', r1.updatedEntries);
const pass2 = (r2.activeIdentities.length === 1 && r2.activeIdentities[0] === '【身份】自设' && r2.activePlots.length === 3 && r2.activePlots.every(p => p.includes('自设专轨')));
console.log(`[测试 2: 自设身份路径] => 激活身份: [${r2.activeIdentities}], 激活剧情: ${r2.activePlots.length} 条 (预期 3 自设专轨) -> ${pass2 ? '✔ PASS' : '❌ FAIL'}`);
if (!pass2) allPassed = false;

// Test 3: 切到 欢喜殿主
const r3 = simulateSync('欢喜殿主', r2.updatedEntries);
const pass3 = (r3.activeIdentities.length === 1 && r3.activeIdentities[0] === '【身份】欢喜殿主' && r3.activePlots.length === 4 && r3.activePlots.every(p => p.includes('殿主专轨')));
console.log(`[测试 3: 欢喜殿主路径] => 激活身份: [${r3.activeIdentities}], 激活剧情: ${r3.activePlots.length} 条 (预期 4 殿主专轨) -> ${pass3 ? '✔ PASS' : '❌ FAIL'}`);
if (!pass3) allPassed = false;

// Test 4: 从殿主再切回 赵无忧
const r4 = simulateSync('赵无忧', r3.updatedEntries);
const pass4 = (r4.activeIdentities.length === 1 && r4.activeIdentities[0] === '【身份】赵无忧' && r4.activePlots.length === 15);
console.log(`[测试 4: 重新切回赵无忧] => 激活身份: [${r4.activeIdentities}], 激活剧情: ${r4.activePlots.length} 条 (预期 15) -> ${pass4 ? '✔ PASS' : '❌ FAIL'}`);
if (!pass4) allPassed = false;

console.log('\n--------------------------------------------------------');
if (allPassed) {
  console.log('🎉 全部 4 组身份切换用例 100% 验证通过！互斥开合完全正常！');
  process.exit(0);
} else {
  console.error('❌ 存在失败用例，请核查状态机逻辑！');
  process.exit(1);
}
