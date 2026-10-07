#!/usr/bin/env node
/**
 * _purge_stale_terms.mjs —— 清掉"前后期册"这套已经被主人废掉的术语（主人 2026-10-01）
 *   ① 标记改名：`〔后期·需手动启用〕` → **`〔待解锁〕`**（条目名 / 剥前缀正则 / 正文说明，全部一起改）
 *   ② 句子级替换：凡把"前期册／后期册／两册／切后期"当**册子概念**说的，改成中性说法
 *   ⚠️ **不碰**表示"故事时间／境界"的词：金丹后期、元婴中后期、后期称号、前期即可公开。
 *   用法：node _purge_stale_terms.mjs          演练
 *         node _purge_stale_terms.mjs --apply  执行
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const APPLY = process.argv.includes('--apply');

const MARK_OLD = '〔后期·需手动启用〕';
const MARK_NEW = '〔待解锁〕';

/** 句子级替换（只针对"册子概念"，按长→短顺序） */
const PHRASES = [
  ['〔后期·需手动启用〕', MARK_NEW],                       // ① 标记
  ['原〔待解锁〕那批', '现在标成〔待解锁〕的那批'],
  ['旧的"切后期插件"那条路已废弃', '旧的"阶段切换插件"那条路已废弃'],
  ['说明玩家已经手动切到了后期阶段，此时闸门自动放开', '说明玩家已经手动开启了它们，此时它们才会进上下文'],
  ['它们是第十九章之后才该出现的情报', '它们是后续章节才该出现的情报'],
  ['【怎么解锁后期】', '【怎么解锁后续条目】'],
  ['前期册里被标为后期专属的【剧情】条', '被标为〔待解锁〕的【剧情】条'],
  ['后期册中前期没有的', '默认停用条里那'],
  ['规则：前期 74 条一律 enabled=true（默认无剧透）；', '规则：默认启用的条目一律 enabled=true（无剧透）；'],
  ['两册已合一', '世界书只有一册'],
  ['两册合一', '世界书只有一册'],
  ['原「后期册」已删', ''],
  ['后期册整册', '停用条整批'],
  ['前期册', '册子'],
  ['后期册', '停用条那批'],
];

const LIVE = [
  '_build_card.js',
  '_chk_format.mjs', '_chk_names.mjs', '_audit_gates.mjs', '_audit_identity_routes.mjs',
  '_final_check_card.js', '_mk_change_ledger.mjs', '_mk_patch_misc.mjs', '_mk_plot_dossier.mjs',
  '_unify_next_beat.mjs', '_daowen_structure.md',
  '卡片脚本\\状态机.js', '卡片脚本\\状态栏面板.js',
  '仙姝墮-世界书.json',
  '世界书体例（YAML+tag）.md', '交接说明.md', '制卡规范（统一版）.md',
];

let totalHits = 0;
const report = [];
for (const rel of LIVE) {
  const p = D + rel;
  if (!existsSync(p)) { report.push('  缺：' + rel); continue; }
  let t = readFileSync(p, 'utf8');
  const before = t;
  let hits = 0;
  for (const [a, b] of PHRASES) {
    const n = t.split(a).length - 1;
    if (n > 0) { t = t.split(a).join(b); hits += n; }
  }
  if (t !== before) {
    totalHits += hits;
    if (APPLY) writeFileSync(p, t, 'utf8');
    report.push('  ' + rel.padEnd(34) + ' 改 ' + String(hits).padStart(3) + ' 处');
  } else {
    report.push('  ' + rel.padEnd(34) + ' （无命中）');
  }
}
console.log(report.join('\n'));
console.log('\n合计 ' + totalHits + ' 处' + (APPLY ? '｜✅ 已写盘' : '｜（演练，加 --apply 执行）'));
