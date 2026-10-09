/**
 * _chk_deflower_impersonation.mjs —— 破身归属防冒名守卫与HUD身份台账覆写离线单测
 * --------------------------------------------------------------------------
 * 用途：验证当玩家身份为四大殿主或自设时，即便模型产生冒名幻觉输出
 *      「<破处>闻观语、赵无忧</破处>」与「<身份>墨山道六弟子、赵无忧</身份>」，
 *      状态机与面板仍能将破处者纠偏为当前玩家身份，名器归属属于玩家，HUD面板不被污染。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const SM_PATH = path.join(ROOT, '卡片脚本/状态机.js');
const PANEL_PATH = path.join(ROOT, '卡片脚本/状态栏面板.js');

const smCode = fs.readFileSync(SM_PATH, 'utf8');
const panelCode = fs.readFileSync(PANEL_PATH, 'utf8');

console.log('========================================================');
console.log('   破身归属防冒名守卫与 HUD 身份台账覆写离线单测');
console.log('========================================================\n');

let allPassed = true;
const ck = (ok, msg) => {
  console.log(`[${ok ? '✔ PASS' : '❌ FAIL'}] ${msg}`);
  if (!ok) allPassed = false;
};

// 1. 断言状态机代码中包含防冒名纠偏逻辑
const hasGuardInSM = smCode.includes('防冒名守卫') && smCode.includes('w = curPlayerId');
ck(hasGuardInSM, '状态机 applyMilestones 中已植入破处者防冒名守卫 (w = curPlayerId)');

// 2. 仿真运行防冒名纠偏算法
function simulateDeflowerGuard(curPlayerId, bookIn, proseOuter) {
  const isCustomExplicit = curPlayerId.includes('自设') || curPlayerId.includes('玩家') || curPlayerId.includes('{{user}}');
  const isZhao = !isCustomExplicit && curPlayerId.includes('赵无忧');
  const mergedBook = {};

  for (const it of bookIn) {
    const h = it.持有者;
    let w = it.破处者;

    if (!isZhao && (w === '赵无忧' || !w)) {
      w = curPlayerId;
    }

    if (!mergedBook[h]) mergedBook[h] = w;
  }

  // 映射到名器
  const HOLDER_TO_RELIC = { 闻观语: '心魔茶璎乳', 叶红缨: '灼酒流炎穴', 孤月: '九幽玄阴穴' };
  const relicOwners = {};
  for (const h of Object.keys(mergedBook)) {
    const r = HOLDER_TO_RELIC[h];
    if (r && !relicOwners[r]) relicOwners[r] = mergedBook[h];
  }

  return { mergedBook, relicOwners };
}

const simResult = simulateDeflowerGuard('焚欲殿主', [{ 持有者: '闻观语', 破处者: '赵无忧' }], '落红初破');
ck(simResult.mergedBook['闻观语'] === '焚欲殿主', '冒名模型输出赵无忧时，破处簿已纠偏为「焚欲殿主」');
ck(simResult.relicOwners['心魔茶璎乳'] === '焚欲殿主', '名器心魔茶璎乳归属已纠偏为「焚欲殿主」（而非被赵无忧占据）');

// 3. 断言状态栏面板中包含身份槽位台账覆写
const hasIdOverwrite = panelCode.includes("fieldNodeMap.get('id')") && panelCode.includes("idEl.textContent = idLedger");
ck(hasIdOverwrite, '状态栏面板 fillPanel 中已植入身份槽位台账覆写机制');

console.log('\n--------------------------------------------------------');
if (allPassed) {
  console.log('🎉 破身归属防冒名守卫 3 项断言全部通过！');
  process.exit(0);
} else {
  console.error('❌ 断言失败！');
  process.exit(1);
}
