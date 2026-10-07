#!/usr/bin/env node
/**
 * deploy.js —— 《仙姝墮 · 一张跑全书》标准部署入口
 * 
 * 部署新卡与世界书至 SillyTavern 并完成深度自检。
 */
const { execSync } = require('child_process');
const node = 'C:\\Program Files\\nodejs\\node.exe';

console.log('========================================================');
console.log('   《仙姝墮 · 一张跑全书》部署到酒馆 (Deploy to Tavern)');
console.log('========================================================');

try {
  execSync(`"${node}" deploy_to_tavern.cjs`, { cwd: __dirname, stdio: 'inherit' });
} catch (e) {
  console.error('\n❌ 部署失败:', e.message);
  process.exit(1);
}
