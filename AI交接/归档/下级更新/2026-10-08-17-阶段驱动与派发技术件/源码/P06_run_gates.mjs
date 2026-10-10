/**
 * P06_run_gates.mjs —— 跑**只读**门禁并原样留档（exit code ＋ 首尾输出）。
 * 刻意不跑 ship.js / _build_card.js / _chk_all.mjs --full：那三个会重写交付产物，
 * 而 gpt 16 号 §5-3 要求战争清理维持「待主人逐条过目」、不越过暂停发布。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const NODE = 'C:/Program Files/nodejs/node.exe';
const DIR = 'E:/角色卡制作/仙姝堕';
const OUT = DIR + '/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17i_原始测试结果.txt';

const GATES = [
  ['tools/checks/_chk_syntax.mjs', '卡内与构建脚本语法门禁'],
  ['tools/checks/_chk_form_gate.mjs', '名器成形闸门（含本批自动派发/归属断言）'],
  ['tools/checks/_chk_relic_stage.mjs', '名器阶段条（触发词收紧／阶段互斥）'],
  ['tools/checks/_chk_mingqi_prereq.mjs', '名器成形硬前置'],
  ['tools/checks/_chk_ejs_stage.mjs', '【阶段驱动】EJS 门控'],
  ['tools/checks/_chk_plot_gate.mjs', '主线剧情闸门'],
  ['tools/checks/_chk_identity_sync.mjs', '身份/专轨/大势离线仿真'],
  ['tools/checks/_chk_clock_acc.mjs', '历时推进'],
  ['tools/checks/_chk_defect_four.mjs', '四条状态缺陷负例'],
  ['tools/checks/_chk_panel_artifact.mjs', 'HUD 面板终产物规范断言'],
  ['tools/checks/_chk_anchor_gate.mjs', '锚点提议闸门（不在 ship.js 名单里，单独跑）'],
];

const lines = [];
lines.push('仙姝堕 · 只读门禁原始输出（2026-10-08 · 第 17 批）');
lines.push('运行方式：直接 node 单个门禁脚本，**未跑 ship.js／未跑 _build_card.js／未跑 _chk_all --full**');
lines.push('执行器：' + NODE);
lines.push('='.repeat(78));

for (const [rel, note] of GATES) {
  const r = spawnSync(NODE, [rel], { cwd: DIR, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '').split(/\r?\n/);
  const err = (r.stderr || '');
  const head = out.slice(0, 4).join('\n');
  const tail = out.slice(-16).join('\n');
  lines.push('');
  lines.push('### ' + rel + '　—　' + note);
  lines.push('exit code: ' + r.status);
  lines.push('--- 首 4 行 ---');
  lines.push(head);
  lines.push('--- 末 16 行 ---');
  lines.push(tail);
  if (err.trim()) lines.push('--- stderr（尾 6 行）---\n' + err.split(/\r?\n/).slice(-6).join('\n'));
}
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

/* 汇总表 */
const sum = GATES.map(([rel]) => {
  const r = spawnSync(NODE, [rel], { cwd: DIR, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const o = (r.stdout || '') + (r.stderr || '');
  const pass = (o.match(/✔/g) || []).length;
  const fail = (o.match(/✘/g) || []).length;
  return rel + '  exit=' + r.status + '  ✔' + pass + '  ✘' + fail;
}).join('\n');
fs.appendFileSync(OUT, '\n\n' + '='.repeat(78) + '\n汇总（✔/✘ 计数取自各脚本自身标记）\n' + sum + '\n', 'utf8');
console.log(sum);
