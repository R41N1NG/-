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

let errors = 0, execFails = 0;
for (const file of files) {
  try {
    execFileSync(NODE, ['-c', file], { stdio: 'pipe' });
  } catch (err) {
    /* 2026-10-08（gpt 17 号 §4 点名）：原版只打「[语法错误] <文件>」＋（通常为空的）stderr，
     * 执行环境拦下子进程时会被误读成语法错。现在分开报，并补 status／signal／error.code／stderr。 */
    const 执行失败 = !!(err.code || err.signal || err.status === null || err.status === undefined);
    if (执行失败) {
      execFails++;
      console.error(`⚠️ [检查执行失败·原因待定位] ${file}`);
    } else {
      errors++;
      console.error(`❌ [语法错误] ${file}`);
    }
    console.error(`   status=${String(err.status)} ｜ signal=${String(err.signal)} ｜ error.code=${String(err.code)} ｜ message=${String(err.message)}`);
    if (err.stderr && String(err.stderr).trim()) console.error('   stderr:\n' + String(err.stderr).trim());
    if (err.stdout && String(err.stdout).trim()) console.error('   stdout:\n' + String(err.stdout).trim());
    console.error(`   直连复验（同版本同文件）：node --check "${file}"`);
  }
}

if (errors > 0 || execFails > 0) {
  console.error(`\n❌ 语法门禁未通过：确为语法错误 ${errors} 个；检查执行失败 ${execFails} 个（失败不等于脚本有错，需按上面的 error.code 定位）。`);
  process.exit(1);
}

console.log(`✅ 脚本语法校验全部通过 (${files.length} 个核心脚本)`);
