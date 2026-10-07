#!/usr/bin/env node
/**
 * _reflow_longlines.mjs —— 把卡内两处"千字一行"拆成短行（2026-10-01 · 秋风口径）
 *
 * 起因：秋风飘人指出「大模型每行 35–50 字读取与执行最佳，一行太长后面就不看了；
 *   几百字叠成一坨 ⇒ 选择项太多 + 注意力不够 ⇒ 极大概率直接填『无』」。
 *   我们卡里量出来：`状态栏模板` 的 `<实际发生>` 一行 **1048 字**、`状态字段表` 的字段清单一行 **830 字**。
 *
 * 本脚本**只改断行，一个字段名都不许动**：
 *   · 把两条"说明 + 清单"的长行拆成：短句 bullet（每行 ≤45 字）＋ 字段名每行 5 个
 *   · 自检：拆出来的字段名集合必须与 `卡片脚本/状态机.js` 的 `FIELD_TABLE` **逐字一致**，不一致就拒绝写盘
 *
 * 用法：node _reflow_longlines.mjs [--apply]
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const BUILD = D + '_build_card.js';
const SM = D + '卡片脚本\\状态机.js';
const APPLY = process.argv.includes('--apply');

const src = readFileSync(BUILD, 'utf8');
const sm = readFileSync(SM, 'utf8');

/* ── ① 从状态机 FIELD_TABLE 里取出**模型可写**的字段名（逐字）
 *    ⚠️ 只取 `kind: 'ai'`：`FIELD_TABLE` 里还有身份名（赵无忧／自设／四位殿主）等，
 *       它们不在"模型可写"清单里（清单 104 个 = ai 类）。 */
const tableBlock = sm.slice(sm.indexOf('const FIELD_TABLE = ['), sm.indexOf('].map'));
/* ⚠️ 实作里顺序是 `{ kind: 'ai', name: '…', desc: …, kws: […] }` ⇒ 按对象切分再取，别用跨字段正则。 */
const NAMES = [...tableBlock.matchAll(/\{[^{}]*\}/g)]
  .map((m) => m[0])
  .filter((o) => /kind:\s*'ai'/.test(o))
  .map((o) => (o.match(/name:\s*'([^']+)'/) || [])[1])
  .filter(Boolean);
console.log('状态机 FIELD_TABLE 里 kind=ai 的字段数：' + NAMES.length);

/* ── ② 从 _build_card.js:460 那行取出字段清单（以 FIELD_TABLE 为权威，顺序照表的顺序） ── */
const LINE460 = src.split('\n').find((l) => l.includes('可写的字段名（**只能用这一串**）'));
if (!LINE460) { console.error('✘ 找不到字段清单那一行'); process.exit(1); }
const listed = LINE460.slice(LINE460.indexOf('）：') + 2).replace(/。',\s*$/, '').replace(/',\s*$/, '').split('、').map((s) => s.trim()).filter(Boolean);
console.log('清单里的字段数：' + listed.length);
const missing = NAMES.filter((n) => !listed.includes(n));
const extra = listed.filter((n) => !NAMES.includes(n));
console.log('  清单缺的：' + (missing.length ? missing.join('、') : '（无）'));
console.log('  清单多的（台账不认识）：' + (extra.length ? extra.join('、') : '（无）'));

/* ── ③ 断行：每行 5 个 ── */
const PER = 5;
const wrap = (arr) => {
  const out = [];
  for (let i = 0; i < arr.length; i += PER) out.push(arr.slice(i, i + PER).join('、'));
  return out;
};
const groups = wrap(listed);
console.log('拆成 ' + groups.length + ' 行（每行 ' + PER + ' 个）');
const longest = groups.reduce((a, b) => (b.replace(/\s/g, '').length > a.replace(/\s/g, '').length ? b : a), '');
console.log('  最长一行：' + longest.replace(/\s/g, '').length + ' 字');
groups.forEach((g) => console.log('    - ' + g));

if (!APPLY) { console.log('\n（预演，未写盘；加 --apply 才改 _build_card.js）'); process.exit(0); }
/* ⚠️ 只拦「清单缺名」（漏字段＝模型写不出来）；「清单多名」只警告 ——
 *    例如 `天姝会存在` 在状态机里是 kind:'open'（起手公开、脚本按身份自动置 true），
 *    它是**有意留在清单里**的，不属错误。 */
if (missing.length) { console.error('\n✘ 清单缺字段，拒绝写盘：' + missing.join('、')); process.exit(1); }
if (extra.length) console.warn('\n⚠️ 清单里多出这些（台账 ai 类里没有，保留原样不动）：' + extra.join('、'));

/* ── ④ 换掉 :460 那行 ── */
const newTable = [
  `  '可写字段名（**只能用这一串**，共 ${listed.length} 个，每行一组，照抄）：',`,
  ...groups.map((g) => `  '- ${g}',`),
].join('\n');
let out = src.replace(LINE460, newTable);

/* ── ⑤ 换掉 <实际发生> 那一行 ── */
const LINE271 = out.split('\n').find((l) => l.includes('<实际发生>（**仅给模型自己看'));
if (!LINE271) { console.error('✘ 找不到 <实际发生> 那一行'); process.exit(1); }
const newA = [
  `        '<实际发生>（**仅给模型自己看**：玩家看不到这一栏，也不用问玩家）',`,
  `        '- 写**本回合剧情上确实发生了**的锚点事件。字段名**逐字照抄下面这一串**，一个都不许改写、也不许自创。',`,
  `        '- 多个用「、」分隔；本回合没发生新的就写「无」。',`,
  `        '- 可写字段名（共 ${listed.length} 个，每行一组，照抄）：',`,
  ...groups.map((g) => `        '- ${g}',`),
  `        '- **只要有一个「〇〇成形」成立，必须同时写上「获得任意名器」**。',`,
  `        '- **只写正文里已经真的演出过的事件**；**没发生就不许记** —— 记了会被脚本当作既成事实写进账本，等于把没发生的事变成真的。',`,
  `        '</实际发生>',`,
].join('\n');
out = out.replace(LINE271, newA);

copyFileSync(BUILD, BUILD + '.bak-reflow');
writeFileSync(BUILD, out, 'utf8');
console.log('\n✅ 已写盘 _build_card.js（备份 .bak-reflow）');
