#!/usr/bin/env node
/**
 * _chk_derive_ledger.mjs —— 「派生：来源账本＋事务撤销」行为门禁（2026-10-08 · gpt 17 号 §2 ⑤⑦⑧）
 *
 * 验的是**实际生产函数**：按源码切片取出 `出场实证名`（含 APPEAR_VERBS／APPEAR_EXCLUDE）、
 * `deriveRelicClosure`、以及它依赖的 `negatedAround`+`NEG_RE`（gpt 已裁定：正确截取实际生产函数
 * ≠ 自造副本；这里打源文件与切片 SHA）。
 *
 * 断言覆盖 gpt 原话：
 *   ⑤ 实际出场才触发；**不再沿用 known['阎雷子脱困'] 当资格**；点名／传闻／回忆／计划不算；缺证据不补真。
 *   ⑦ 出场派生事务里写明确 NPC 归属＋来源；**不覆盖既有的更强来源**。
 *   ⑧ 来源账本；来源清零才撤；**撤一个来源不影响别的来源**；阶段2撤销**不误删独立来源的阶段1**；
 *      人工来源不静默消失。
 *
 * 用法：node tools/checks/_chk_derive_ledger.mjs
 * 退出码：0＝全绿；1＝有断言失败；2＝取不到生产函数
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const SM = '卡片脚本/状态机.js';
const src = fs.readFileSync(SM, 'utf8');
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 16);

function sliceBetween(a1, a2) { const i = src.indexOf(a1); const j = src.indexOf(a2, i); if (i < 0 || j < 0) throw new Error('取不到 ' + a1); return src.slice(i, j + a2.length); }

let 代码;
try {
  代码 = [
    sliceBetween('const NEG_RE =', 'return NEG_RE.test(t.slice(start, end));\n}'),
    sliceBetween('const APPEAR_VERBS =', 'if (re.lastIndex <= m.index) re.lastIndex = m.index + 1;\n  }\n  return { ok: false, why: \'正文里没有「\' + nm + \'」参与当前场景的实证（点名／传闻／回忆／计划不算）\' };\n}'),
    sliceBetween('function deriveRelicClosure(inp) {', 'return { news, ledger, ledgerChanged, 归属补写, 归属来源补写, 撤销, 日志 };\n}'),
  ].join('\n');
} catch (e) { console.error('❌ ' + e.message); process.exit(2); }

// eslint-disable-next-line no-new-func
const M = new Function(代码 + '\nreturn { 出场实证名, deriveRelicClosure };')();
const { 出场实证名, deriveRelicClosure } = M;

const rep = [];
let fail = 0;
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fail++; };

const run = (o) => deriveRelicClosure(Object.assign({ known: {}, news: [], ledger: {}, 名器归属: {}, 归属来源: {}, messageId: 7, 指纹: 'fp1', 出场实证: {} }, o));

/* ⑤ 出场实证 */
ck(出场实证名('柳含烟', '').ok === false, '空正文 fail-closed');
ck(出场实证名('柳含烟', '众人提起柳含烟的名字，殿中一时安静。').ok === false, '只被点名（提起…的名字）不算出场');
ck(出场实证名('柳含烟', '据说柳含烟曾经来过此地。').ok === false, '传闻／回忆不算出场');
ck(出场实证名('柳含烟', '他打算三日后去寻柳含烟。').ok === false, '计划不算出场');
ck(出场实证名('柳含烟', '柳含烟走进殿中，微微笑了一下。').ok === true, '真出场（走进＋笑）算出场');

/* ⑤ 触发：不再沿用脱困资格 */
{
  const r = run({ known: { 阎雷子脱困: true }, 出场实证: { 柳含烟: { ok: false } } });
  ck(r.news.indexOf('烟霞灵乳二阶段') === -1, '**known[阎雷子脱困] 为真但无出场实证 ⇒ 不派生二阶段**（gpt ⑤ 的核心纠正）');
}
{
  const r = run({ 出场实证: { 柳含烟: { ok: true, 证据: '柳含烟走进殿中' } } });
  ck(r.news.indexOf('烟霞灵乳二阶段') !== -1, '有出场实证 ⇒ 派生二阶段');
  ck((r.ledger['烟霞灵乳二阶段'] || {}).来源 && r.ledger['烟霞灵乳二阶段'].来源.some((s) => s.类型 === '出场实证'), '账本登记来源（类型＝出场实证）');
  ck(r.归属补写['烟霞灵乳'] === '阎雷子', '派生事务里写明确 NPC 归属：烟霞灵乳 → 阎雷子');
  ck(r.归属来源补写['烟霞灵乳'] && r.归属来源补写['烟霞灵乳'].由脚本写 === true, '归属写了来源并标记「由脚本写」');
  ck(r.news.indexOf('烟霞灵乳一阶段') !== -1, '出场即二境 ⇒ 一并补记一阶段');
  ck((r.ledger['烟霞灵乳一阶段'] || {}).来源 && r.ledger['烟霞灵乳一阶段'].来源.some((s) => s.类型 === '依赖'), '一阶段的来源类型＝依赖');
}

/* ⑦ 不覆盖既有更强来源 */
{
  const r = run({
    出场实证: { 柳含烟: { ok: true, 证据: 'x' } },
    名器归属: { 烟霞灵乳: '某人手工写的' }, 归属来源: {},
  });
  ck(Object.keys(r.归属补写).length === 0, '**已有既成归属（非脚本写的）⇒ 不覆盖**');
  ck(r.日志.some((l) => l.indexOf('保持既有来源') !== -1), '并留下"保持既有来源"的日志');
}
{
  const r = run({
    出场实证: { 柳含烟: { ok: true, 证据: 'x' } },
    名器归属: { 烟霞灵乳: '旧的错值' }, 归属来源: { 烟霞灵乳: { 由脚本写: true } },
  });
  ck(r.归属补写['烟霞灵乳'] === '阎雷子', '若是脚本自己上轮写的 ⇒ 可以按新事实改写');
}

/* ⑥ 前置齐备 ⇒ 成形（来源＝前置齐备） */
{
  const r = run({ known: { 楚灵夜处女丧失: true, 楚灵夜后窍开发: true } });
  ck(r.news.indexOf('般若菩提菊成形') !== -1, '楚灵夜两项前置齐备 ⇒ 自动成形');
  ck(((r.ledger['般若菩提菊成形'] || {}).来源 || []).some((s) => s.类型 === '前置齐备'), '账本登记来源（类型＝前置齐备）');
}
{
  const r = run({ known: { 楚灵夜处女丧失: true } });
  ck(r.news.indexOf('般若菩提菊成形') === -1, '只满足一项 ⇒ 不成形');
}

/* ⑧ 撤销：来源清零才撤；人工来源不撤；二阶段撤销不误删独立来源的一阶段 */
{
  const r = run({ known: { 般若菩提菊成形: true }, ledger: { 般若菩提菊成形: { 来源: [] } } });
  ck(r.撤销.indexOf('般若菩提菊成形') !== -1, '来源清零 ⇒ 撤销该派生（进 patch.known=false）');
  ck(r.ledger['般若菩提菊成形'] === null, '撤销后账本写 null 墓碑');
}
{
  const r = run({ known: { 般若菩提菊成形: true }, ledger: { 般若菩提菊成形: { 来源: [{ 键: '人工解锁', 类型: '人工' }] } } });
  ck(r.撤销.indexOf('般若菩提菊成形') === -1, '**人工来源在场 ⇒ 不自动撤**');
}
{
  const r = run({
    known: { 烟霞灵乳二阶段: true, 烟霞灵乳一阶段: true },
    ledger: {
      烟霞灵乳二阶段: { 来源: [] },                                   /* 二阶段来源清零 ⇒ 该撤 */
      烟霞灵乳一阶段: { 来源: [{ 键: '人工解锁', 类型: '人工' }] },     /* 一阶段有独立人工来源 ⇒ 必须保留 */
    },
  });
  ck(r.撤销.indexOf('烟霞灵乳二阶段') !== -1 && r.撤销.indexOf('烟霞灵乳一阶段') === -1, '**阶段2撤销不误删独立来源的阶段1**');
}
{
  const r = run({ known: { 烟霞灵乳二阶段: true }, ledger: { 烟霞灵乳二阶段: { 来源: [{ 键: '柳含烟出场', 类型: '出场实证' }] } } });
  ck(r.撤销.indexOf('烟霞灵乳二阶段') === -1 && r.news.indexOf('烟霞灵乳二阶段') === -1, '出场是历史事件：账本已有来源且字段已真 ⇒ 既不再派发也不撤销');
}

ck(/patch\.派生账本 = 派生账本新/.test(src) && /patch\.名器归属来源 = 名器归属来源新/.test(src), '账本与归属来源确实落盘（源码实证）');
ck(/↩️ \[派生回退\]/.test(src), '撤销时有 [派生回退] 日志（源码实证）');

console.log('【派生来源账本＋事务撤销】源 ' + SM + '（SHA ' + sha(src) + '，切片 ' + 代码.length + ' 字符）');
for (const l of rep) console.log('  ' + l);
console.log('\n' + (fail ? '✘ ' + fail + ' 项未通过' : '✔ 全部通过（' + rep.length + ' 项）'));
process.exit(fail ? 1 : 0);
