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

// Test 5: 身份条目防冒名铁律完整性（四大殿主 + 自设均必须有防冒名铁律）
const lordAndCustom = entries.filter((e) => ['【身份】焚欲殿主', '【身份】欢喜殿主', '【身份】浊龙殿主', '【身份】魂欢殿主', '【身份】自设'].includes(e.comment || ''));
const allHaveAntiImpersonation = lordAndCustom.length === 5 && lordAndCustom.every((e) => (e.content || '').includes('防冒名') && (e.content || '').includes('赵无忧'));
console.log(`[测试 5: 殿主与自设条目防冒名铁律验证] => 5条身份条目均含防赵无忧冒名铁律: ${allHaveAntiImpersonation} -> ${allHaveAntiImpersonation ? '✔ PASS' : '❌ FAIL'}`);
if (!allHaveAntiImpersonation) allPassed = false;

// Test 6: Scenario 全局身份松绑验证（不得焊死 {{user}} 是赵无忧）
const scenarioText = cardData.data?.scenario || '';
const scenarioDecoupled = !scenarioText.startsWith('{{user}} 是墨山道六弟子赵无忧') && scenarioText.includes('多轨扮演');
console.log(`[测试 6: Scenario 全局身份松绑验证] => 首句未焊死赵无忧且支持多轨: ${scenarioDecoupled} -> ${scenarioDecoupled ? '✔ PASS' : '❌ FAIL'}`);
if (!scenarioDecoupled) allPassed = false;

// Test 7: depth_prompt 当前身份锁死指令验证
const depthPromptText = cardData.data?.extensions?.depth_prompt?.prompt || '';
const depthPromptLocked = depthPromptText.includes('当前玩家身份锁死与防冒名规矩') && depthPromptText.includes('stat_data.身份');
console.log(`[测试 7: depth_prompt 身份锁死指令验证] => 顶层含当前玩家身份锁死指令: ${depthPromptLocked} -> ${depthPromptLocked ? '✔ PASS' : '❌ FAIL'}`);
if (!depthPromptLocked) allPassed = false;

// Test 8: 阶段驱动 (id7) 殿主身份渲染隔离验证（焚欲殿主时不应输出赵无忧师门日常）
const e7 = entries.find((e) => e.id === 7 || (e.comment || '').includes('阶段驱动'));
let stageDriveIsolated = false;
if (e7) {
  const content7 = e7.content || '';
  // 模拟 minimal EJS 渲染
  const re = /<%([_\-=]?)([\s\S]*?)([_\-]?)%>/g;
  let src = 'var __out = [];\n';
  let last = 0, m, slurp = false;
  const push = (s) => { if (s) src += '__out.push(' + JSON.stringify(s) + ');\n'; };
  while ((m = re.exec(content7))) {
    let text = content7.slice(last, m.index);
    const open = m[1], body = m[2], close = m[3];
    if (slurp) text = text.replace(/^[ \t]*\r?\n?/, '');
    if (open === '_') text = text.replace(/[ \t]*$/, '');
    push(text);
    if (open === '=' || open === '-') src += '__out.push(String(' + body + '));\n';
    else src += body + '\n';
    slurp = close === '_';
    last = re.lastIndex;
  }
  push(content7.slice(last));
  src += 'return __out.join("");';
  const renderFn = new Function('variables', src);
  const outZhao = renderFn({ stat_data: { 身份: '赵无忧', 段位: 2, 仙盟历: 1578.08 } });
  const outLord = renderFn({ stat_data: { 身份: '焚欲殿主', 段位: 2, 仙盟历: 1578.08 } });
  const zhaoHasDaily = outZhao.includes('赵无忧此刻只有师门日常');
  const lordHasLordDesc = outLord.includes('焚欲殿主') && outLord.includes('防冒名纪律') && !outLord.includes('赵无忧此刻只有师门日常');
  stageDriveIsolated = zhaoHasDaily && lordHasLordDesc;
}
console.log(`[测试 8: 阶段驱动 D0 殿主身份渲染隔离验证] => 焚欲殿主渲染专属大势且剥离赵无忧日常: ${stageDriveIsolated} -> ${stageDriveIsolated ? '✔ PASS' : '❌ FAIL'}`);
if (!stageDriveIsolated) allPassed = false;

console.log('\n--------------------------------------------------------');
if (allPassed) {
  console.log('🎉 全部 8 组身份切换与防冒名用例 100% 验证通过！');
  process.exit(0);
} else {
  console.error('❌ 存在失败用例，请核查状态机与条目逻辑！');
  process.exit(1);
}
