#!/usr/bin/env node
/**
 * _chk_syntax.mjs —— 卡片核心脚本语法门禁 (node -c 离线快速语法验证)
 * 确保打包进角色卡与酒馆助手的所有脚本 100% 无 SyntaxError
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NODE = process.execPath;
const SCRIPT_DIR = '卡片脚本';

const files = [];
try {
  for (const f of readdirSync(SCRIPT_DIR)) {
    if (f.endsWith('.js') && !f.includes('.bak')) {
      files.push(join(SCRIPT_DIR, f));
    }
  }
} catch (e) {
  console.error('无法读取卡片脚本目录:', e.message);
  process.exit(1);
}

// 还要验证主要构建与流水线脚本
files.push('_build_card.js');
files.push('deploy_to_tavern.cjs');

let errors = 0;
for (const file of files) {
  try {
    execFileSync(NODE, ['-c', file], { stdio: 'pipe' });
  } catch (err) {
    console.error(`❌ [语法错误] ${file}:`);
    if (err.stderr) console.error(err.stderr.toString().trim());
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n❌ 共有 ${errors} 个脚本未能通过语法检查！构建已拦截！`);
  process.exit(1);
}

console.log(`✅ 脚本语法校验全部通过 (${files.length} 个核心脚本)`);
