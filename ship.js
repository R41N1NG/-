#!/usr/bin/env node
/**
 * ship.js —— 《仙姝墮》一键标准化极速交付流水线
 *
 * 核心设计（铁律 33 提速闭环）：
 *   1. 运行核心秒级离线单测（身份/闸门、开场白、面板规范、对比度，~0.4s）
 *   2. 执行全量构建 build.js（JSON 编译 + 文风硬关卡 + PNG 封装 + 世界书导出 + 防递归质检，~3.5s）
 *   3. 执行自动部署 deploy_to_tavern.cjs（自动备份 + 写入酒馆目录 + 实时终检，~1.0s）
 *   4. 全程总耗时约 4~5 秒，杜绝一切多余盲测与重型探针！
 *
 * 用法：
 *   node ship.js           （日常开发极速交付）
 *   node ship.js --full    （全量回归交付：先跑 _chk_all.mjs --full 再构建部署）
 */

import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const NODE = 'C:\\Program Files\\nodejs\\node.exe';
const t0 = performance.now();
const IS_FULL = process.argv.includes('--full');

function run(script, args = [], desc = '') {
  const start = performance.now();
  process.stdout.write(`▶ [${desc || script}] ... `);
  try {
    const out = execFileSync(NODE, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const cost = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`✅ 通过 (${cost}s)`);
    return { ok: true, out };
  } catch (err) {
    const cost = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`❌ 失败 (${cost}s)`);
    if (err.stdout) console.log(err.stdout.trim());
    if (err.stderr) console.error(err.stderr.trim());
    process.exit(err.status || 1);
  }
}

console.log('========================================================');
console.log(`  🚀 仙姝墮 · 一键标准化交付流水线 ${IS_FULL ? '【全量回归模式】' : '【极速秒级模式】'}`);
console.log('========================================================\n');

if (IS_FULL) {
  console.log('【阶段 0: 全量重型探针回归（耗时约 30+ 秒）】');
  run('tools/checks/_chk_all.mjs', ['--full'], '全量深度验收套件（条数以 _chk_all.mjs 登记为准，不写死数字）');
  console.log('');
} else {
  console.log('【阶段 1/3: 离线秒级定向质检 (约 0.4s)】');
  run('tools/checks/_chk_syntax.mjs', [], '卡内与构建脚本语法门禁');
  run('tools/checks/_chk_form_gate.mjs', [], '名器成形闸门（口交误报拦截／真破身放行／双姝用且／归属）');
  run('tools/checks/_chk_stage_drive.mjs', [], '【阶段驱动】结构＋独立政策表 12 例＋fail-closed＋源模板与卡内 content 对照');
  run('tools/checks/_chk_payload.mjs', [], '交付物载荷一致性（chara 与 ccv3 两份逐项比 JSON）');
  run('tools/checks/_chk_status_missing.mjs', [], '缺状态栏分支·真跑（日期/累计不被改写）');
  run('tools/checks/_chk_ejs_native.mjs', [], '原生 EJS 渲染卡内 id7 content（12 例）');
  run('tools/checks/_chk_freefield_gate.mjs', [], '自由字段一致性闸（未到事件不许写成正在发生）');
  run('tools/checks/_chk_derive_ledger.mjs', [], '派生来源账本＋事务撤销（出场才触发／写明确归属／来源清零才撤）');
  run('tools/checks/_chk_plot_gate.mjs', [], '主线剧情闸门（正门＝里程碑，兜底＝段位；正门锚点必须是活名）');
  run('tools/checks/_chk_example_pollution.mjs', [], '示例污染门禁（可写栏的示例里不许出现真实专名）');
  run('tools/checks/_chk_relic_stage.mjs', [], '名器阶段条（触发词收紧／阶段互斥：旧阶段自动关闭／fail-closed）');
  run('tools/checks/_chk_identity_sync.mjs', [], '身份/专轨/大势离线仿真');
  run('tools/checks/_chk_greetings.mjs', [], '开场楼结构与 19 字段完整性');
  run('tools/checks/_chk_contrast.mjs', [], 'HUD 面板 WCAG 对比度体检');
  run('tools/checks/_chk_panel_artifact.mjs', [], 'HUD 面板终产物规范断言');
  run('tools/checks/_chk_tick_preflight.mjs', [], '去重/tick 语义/首次生成前置（并发共用 Promise·回读判定·显式取消）');
  run('tools/checks/_chk_clock_acc.mjs', [], '历时推进（合法0不被跳过／同楼撤销／换段不清零／一日计足一日／N个月可转场／半年计足／倒计时不计）');
  run('tools/checks/_chk_defect_four.mjs', [], '四条状态缺陷行为负例（校验后置／隐式继承只建议／证据收紧＋否定闸／缺状态栏不覆写日期）');
  run('tools/checks/_chk_mingqi_prereq.mjs', [], '名器成形硬前置（持有者须先破身；同轮破身算数；楚灵夜需后窍；灵犀同心需双姝两人）');
  run('tools/checks/_chk_relic_progress.mjs', [], '名器数值变量 (RFC-002) 15项反例防御验证（Swipe隔离/单真源/资格/类型安全/事务）');
  run('tools/checks/_chk_deflower_impersonation.mjs', [], '破身归属防冒名守卫与HUD身份台账覆写');
  console.log('');
}

console.log('【阶段 2/3: 全量自动化构建 (约 3.5s)】');
run('build.js', [], '编译 JSON + 文风硬关卡 + 封装 PNG + 导出世界书 + 防递归');
console.log('');

console.log('【阶段 3/3: 自动部署至酒馆 (约 1.0s)】');
run('deploy_to_tavern.cjs', [], '备份旧卡 + 部署至 SillyTavern + 目录实时核验');
console.log('');

const total = ((performance.now() - t0) / 1000).toFixed(2);
console.log('========================================================');
console.log(`🎉 交付全部成功！总耗时: ${total} 秒`);
console.log('📌 提示：若酒馆正在运行，请在客户端执行 Ctrl + F5 强制刷新生效！');
console.log('========================================================\n');
