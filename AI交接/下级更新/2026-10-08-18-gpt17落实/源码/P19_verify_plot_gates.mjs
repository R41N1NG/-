/**
 * P19_verify_plot_gates.mjs —— 六情形矩阵验收三扇主线硬门（gpt 06 §2 要求的六种情形）。
 *   用法：node P19_verify_plot_gates.mjs [--card <卡.json>]
 *   不带 --card ⇒ 读 references 源（uid 32/35/39）；带 ⇒ 读卡内条目（按 comment 关键字定位）。
 * 断言重点：**日期没到时，高段位＋所有准入事实真也一律不放行**；**段位单独不能放行**；
 *          **必要事实缺失不放行**；**已完成/身份不符/缺日期一律 false**。
 */
import fs from 'node:fs';

const SRC = 'E:/角色卡制作/仙姝堕/references/仙姝墮-世界书.json';
const argCard = (() => { const i = process.argv.indexOf('--card'); return i >= 0 ? process.argv[i + 1] : null; })();
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18h_主线硬门六情形矩阵.json';

function loadGates() {
  if (argCard) {
    const c = JSON.parse(fs.readFileSync(argCard, 'utf8'));
    const es = c.data.character_book.entries;
    const pick = (kw) => { const e = es.find((x) => String(x.comment).indexOf(kw) !== -1); return e ? e.content.split('\n')[0] : null; };
    return { 来源: argCard, 门: { 大劫: pick('【剧情】四 · 南域大劫'), 兽潮: pick('【剧情】七 · 兽潮血战'), 城破: pick('【剧情】十一 · 天溪城破') } };
  }
  const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const list = Array.isArray(j.entries) ? j.entries : Object.values(j.entries);
  const byUid = (u) => { const e = list.find((x) => Number(x.uid) === u); return e ? String(e.content).split('\n')[0] : null; };
  return { 来源: SRC, 门: { 大劫: byUid(32), 兽潮: byUid(35), 城破: byUid(39) } };
}

function evalGate(first, vars) {
  let expr = first.replace(/^@@if\s*/, '');
  /* 卡内形态是自带 try/catch 的 IIFE；直接整体求值即可（与 ST 扩展的求值口径一致） */
  try { return new Function('variables', 'return (' + expr + ');')(vars); }
  catch (e) { return 'THREW:' + (e && e.message); }
}

const K = (o) => Object.assign({
  进入幽寂谷: false, 玄机子胁迫过叶红缨: false, 已抵达天溪: false, 受征召南下: false, 双姝回归: false,
  南域大劫: false, 天溪城兽潮: false, 兽潮血战: false, 天溪城破: false,
}, o || {});
const V = (身份, 段位, 仙盟历, known) => ({ stat_data: { 身份, 段位, 仙盟历, known: K(known) } });

const cases = [
  ['大劫 · ①日期未到＋高段位＋个人前置真＋未完成', '大劫', V('赵无忧', 16, 1578.03, { 进入幽寂谷: true, 玄机子胁迫过叶红缨: true }), false],
  ['大劫 · ②日期到＋前置真＋未完成', '大劫', V('赵无忧', 1, 1578.08, { 进入幽寂谷: true }), true],
  ['大劫 · ③日期到但个人前置全缺', '大劫', V('赵无忧', 1, 1578.08, {}), false],
  ['大劫 · ④已完成（上界真）', '大劫', V('赵无忧', 16, 1578.08, { 进入幽寂谷: true, 南域大劫: true }), false],
  ['大劫 · ⑤身份不符（自设）', '大劫', V('自设', 16, 1578.08, { 进入幽寂谷: true }), false],
  ['大劫 · ⑥缺日期', '大劫', V('赵无忧', 16, undefined, { 进入幽寂谷: true }), false],

  ['兽潮 · ①日期未到＋段位16＋已抵达真＋大劫真', '兽潮', V('赵无忧', 16, 1578.03, { 已抵达天溪: true, 南域大劫: true }), false],
  ['兽潮 · ②日期到＋场景前置真＋大劫真＋兽潮未立', '兽潮', V('赵无忧', 7, 1579.01, { 已抵达天溪: true, 南域大劫: true }), true],
  ['兽潮 · ③日期到但场景前置假（只有段位16）', '兽潮', V('赵无忧', 16, 1579.01, { 南域大劫: true }), false],
  ['兽潮 · ④已完成（兽潮或血战已真）', '兽潮', V('赵无忧', 16, 1579.01, { 已抵达天溪: true, 南域大劫: true, 天溪城兽潮: true }), false],
  ['兽潮 · ⑤身份不符（自设）', '兽潮', V('自设', 16, 1579.01, { 已抵达天溪: true, 南域大劫: true }), false],
  ['兽潮 · ⑥缺日期', '兽潮', V('赵无忧', 16, undefined, { 已抵达天溪: true, 南域大劫: true }), false],

  ['城破 · ①日期未到＋双姝真＋大劫真＋兽潮真＋段位16', '城破', V('赵无忧', 16, 1578.11, { 双姝回归: true, 南域大劫: true, 天溪城兽潮: true }), false],
  ['城破 · ②日期到＋场景真＋大劫真＋兽潮真', '城破', V('赵无忧', 11, 1579.03, { 双姝回归: true, 南域大劫: true, 天溪城兽潮: true }), true],
  ['城破 · ③日期到但兽潮前置缺', '城破', V('赵无忧', 16, 1579.03, { 双姝回归: true, 南域大劫: true }), false],
  ['城破 · ④已完成（城破已真）', '城破', V('赵无忧', 16, 1579.03, { 双姝回归: true, 南域大劫: true, 天溪城兽潮: true, 天溪城破: true }), false],
  ['城破 · ⑤身份不符（自设）', '城破', V('自设', 16, 1579.03, { 双姝回归: true, 南域大劫: true, 天溪城兽潮: true }), false],
  ['城破 · ⑥缺日期', '城破', V('赵无忧', 16, undefined, { 双姝回归: true, 南域大劫: true, 天溪城兽潮: true }), false],
];

const g = loadGates();
const rows = cases.map(([name, which, vars, 期望]) => {
  const first = g.门[which];
  if (!first) return { 用例: name, 通过: false, 实测: '（找不到该门）' };
  const 实测 = evalGate(first, vars);
  return { 用例: name, 门: which, 期望, 实测, 通过: 实测 === 期望 };
});

const bad = rows.filter((r) => !r.通过);
const out = { 门来源: g.来源, 门首行: g.门, 用例数: rows.length, 通过: rows.length - bad.length, 失败: bad.length, 明细: rows };
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
for (const r of rows) console.log((r.通过 ? '✔ ' : '✘ ') + r.用例 + '　期望 ' + r.期望 + '　实测 ' + r.实测);
console.log('\n门来源：' + g.来源);
console.log('合计 ' + (rows.length - bad.length) + ' 通过 / ' + bad.length + ' 失败');
process.exit(bad.length ? 1 : 0);
