/**
 * P14_verify_stage_drive.mjs —— 对重写后的 `src/text_data/_stage_drive.txt` 做离线渲染验证：
 *   ① EJS 标签配平与可编译；
 *   ② 渲染矩阵：段位 × 日期 × known × 身份 → 实际输出的世界块/个人块；
 *   ③ 硬断言（按 gpt 17 号 §2 的七条规则）：
 *      · 早日期（<1579.01）与缺日期：输出里**不得**出现「兽潮一波接一波／围城数日／城墙段化作血腥炼狱」；
 *      · 缺日期/非法日期：走中性块，且不得宣告大劫已降；
 *      · 1579.01 且兽潮已建立：可以出现围城当前句；
 *      · 1579.01 但兽潮未建立：不得出现围城当前句，且出现"待确认/启动"字样；
 *      · 1579.03：不出现"正在围城"，且提到城破须带"尚未建立/门开着"的口径；
 *      · known 污染（早日期 + 围城/城破真）：输出"后台诊断·状态冲突"；
 *      · 身份＝焚欲殿主 + 段位2 + 1577.07：**不得**被强压到第四段舞台（band 应仍是 1）；
 *      · 段位取不到/字段缺失：不抛错、输出中性或占位。
 * 说明：本机没有上游 EJS 包（无 node_modules），这里沿用与 `_chk_ejs_stage.mjs` 同一套最小 EJS 语义；
 *       gpt 已用上游原生 EJS 独立复算过同形模板（17 批 §1），本脚本只作变更后的回归。
 */
import fs from 'node:fs';

const TPL = 'E:/角色卡制作/仙姝堕/src/text_data/_stage_drive.txt';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18a_stage_drive渲染矩阵.json';

function compileEJS(tplText) {
  const re = /<%([_\-=]?)([\s\S]*?)([_\-]?)%>/g;
  let src = 'var __out = [];\n';
  let last = 0, m, slurp = false;
  const push = (s) => { if (s) src += '__out.push(' + JSON.stringify(s) + ');\n'; };
  while ((m = re.exec(tplText))) {
    let text = tplText.slice(last, m.index);
    const open = m[1], body = m[2], close = m[3];
    if (slurp) text = text.replace(/^[ \t]*\r?\n?/, '');
    if (open === '_') text = text.replace(/[ \t]*$/, '');
    push(text);
    if (open === '=' || open === '-') src += '__out.push(String(' + body + '));\n';
    else src += body + '\n';
    slurp = close === '_';
    last = re.lastIndex;
  }
  push(tplText.slice(last));
  src += 'return __out.join("");';
  // eslint-disable-next-line no-new-func
  return new Function('variables', src);
}

const tpl = fs.readFileSync(TPL, 'utf8');
const openTags = (tpl.match(/<%/g) || []).length;
const closeTags = (tpl.match(/%>/g) || []).length;
const stats = { 模板字符数: tpl.length, '<%数': openTags, '%>数': closeTags, 配平: openTags === closeTags };

let render = null, compileErr = null;
try { render = compileEJS(tpl); } catch (e) { compileErr = String(e && e.message || e); }

const KN = (o) => Object.assign({
  南域大劫: false, 天溪城兽潮: false, 兽潮血战: false, 天溪城破: false, 极乐引入手: false, 玄机子胁迫过叶红缨: false,
}, o || {});
const V = (段位, 仙盟历, known, 身份) => ({ stat_data: { 段位, 仙盟历, 身份: 身份 || '赵无忧', known: KN(known) } });

const cases = [
  ['① 1577.07／段位2／known空（该局量级）', V(2, 1577.07, {}), { 禁战: true, 期望世界: '大劫之前', 期望舞台: '启程前' }],
  ['② 1577.07／段位8／known空', V(8, 1577.07, {}), { 禁战: true, 期望世界: '大劫之前', 期望舞台: '南下与天溪' }],
  ['③ 1578.03／段位8／known空', V(8, 1578.03, {}), { 禁战: true, 期望世界: '大劫之前' }],
  ['④ 1578.08／段位8／大劫未建立', V(8, 1578.08, {}), { 禁战: true, 期望世界: '大劫已降（正式兽潮尚未到期）', 期望含: '尚未由剧情建立' }],
  ['⑤ 1578.08／段位8／大劫已建立', V(8, 1578.08, { 南域大劫: true }), { 禁战: true, 期望世界: '大劫已降（正式兽潮尚未到期）', 期望含: '大劫已由剧情建立' }],
  ['⑥ 1579.01／段位8／兽潮未建立', V(8, 1579.01, { 南域大劫: true }), { 禁战: true, 期望世界: '正式兽潮期', 期望含: '尚未由剧情建立' }],
  ['⑦ 1579.01／段位8／兽潮已建立', V(8, 1579.01, { 南域大劫: true, 天溪城兽潮: true }), { 允战: true, 期望世界: '正式兽潮期', 期望含: '兽潮一波接一波' }],
  ['⑧ 1579.03／段位8／城破未建立', V(8, 1579.03, { 南域大劫: true, 天溪城兽潮: true }), { 禁战: true, 期望世界: '城破之后', 期望含: '尚未由剧情建立' }],
  ['⑨ 1579.06／段位2／城破已建立（晚日期低段位）', V(2, 1579.06, { 天溪城破: true }), { 禁战: true, 期望世界: '城破之后', 期望含: '城破已由剧情建立', 期望舞台: '启程前' }],
  ['⑩ 缺日期／段位8／known空', V(8, undefined, {}), { 禁战: true, 期望世界: '中性世界规则', 期望含: '中性世界规则' }],
  ['⑪ 缺日期／段位8／污染 known（围城+城破真）', V(8, undefined, { 天溪城兽潮: true, 天溪城破: true }), { 禁战: true, 期望世界: '中性世界规则', 期望含: '状态冲突' }],
  ['⑫ 1577.07／段位2／污染 known（围城+城破真）', V(2, 1577.07, { 天溪城兽潮: true, 天溪城破: true }), { 禁战: true, 期望世界: '大劫之前', 期望含: '状态冲突' }],
  ['⑬ 非法日期 9999.99／段位8』', V(8, 9999.99, {}), { 禁战: true, 期望世界: '中性世界规则' }],
  ['⑭ 身份＝焚欲殿主／1577.07／段位2（④ 取消强压）', V(2, 1577.07, {}, '焚欲殿主'), { 禁战: true, 期望世界: '大劫之前', 期望舞台: '启程前', 禁含: '暗流与天姝会线' }],
  ['⑮ 段位缺失／1578.03', { stat_data: { 身份: '赵无忧', known: KN({}) } }, { 禁战: true }],
  ['⑯ 无 stat_data（字段全缺）', { }, { 禁战: true, 期望含: '阶段数据不可用' }],
];

const WAR_RE = /兽潮一波接一波|围城数日|城墙段化作血腥炼狱/;
const results = [];
for (const [name, vars, exp] of cases) {
  let text = '', err = null;
  try { text = render(vars); } catch (e) { err = String(e && e.message || e); }
  const hasWar = WAR_RE.test(text);
  const 世界块 = (() => {
    const m = text.match(/## 世界压力 · ([^\n]+)/);
    if (m) return m[1].replace(/^\s+|\s+$/g, '');
    if (/## 中性世界规则/.test(text)) return '中性世界规则';
    return text.includes('判据不可用') ? '判据不可用（中性）' : '（无）';
  })();
  const 舞台块 = (text.match(/## 个人舞台 · ([^\n（]+)/) || [, '（无）'])[1].trim();
  const checks = [];
  if (err) checks.push({ 项: '不抛错', 过: false, 说明: err });
  if (exp.禁战) checks.push({ 项: '不得出现战争当前句', 过: !hasWar, 说明: hasWar ? (text.match(WAR_RE) || [])[0] : '' });
  if (exp.允战) checks.push({ 项: '已建立时允许战争当前句', 过: hasWar });
  if (exp.期望世界) checks.push({ 项: '世界块=' + exp.期望世界, 过: 世界块.indexOf(exp.期望世界) === 0 || 世界块 === exp.期望世界, 说明: '实测 ' + 世界块 });
  if (exp.期望舞台) checks.push({ 项: '舞台含 ' + exp.期望舞台, 过: 舞台块.indexOf(exp.期望舞台) !== -1, 说明: '实测 ' + 舞台块 });
  if (exp.期望含) checks.push({ 项: '含「' + exp.期望含 + '」', 过: text.indexOf(exp.期望含) !== -1 });
  if (exp.禁含) checks.push({ 项: '不得含「' + exp.禁含 + '」', 过: text.indexOf(exp.禁含) === -1 });
  results.push({ 用例: name, 输出字符数: text.length, 世界块, 舞台块, 输出含战争句: hasWar, 通过: checks.every((c) => c.过), checks, 抛错: err });
}

const bad = results.filter((r) => !r.通过);
const out = { 模板: stats, 编译错误: compileErr, 用例数: cases.length, 通过: cases.length - bad.length, 失败: bad.length, 明细: results };
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('模板：字符 ' + stats.模板字符数 + '，<% ' + openTags + ' / %> ' + closeTags + '，配平 ' + stats.配平 + '，编译 ' + (compileErr ? '失败:' + compileErr : 'OK'));
for (const r of results) {
  console.log((r.通过 ? '✔ ' : '✘ ') + r.用例 + '  ｜世界=' + r.世界块 + ' ｜舞台=' + r.舞台块 + (r.输出含战争句 ? ' ｜含战争句' : '') + (r.抛错 ? ' ｜抛错:' + r.抛错 : ''));
  for (const c of r.checks) if (!c.过) console.log('     ✘ ' + c.项 + (c.说明 ? '　' + c.说明 : ''));
}
console.log('\n合计 ' + (cases.length - bad.length) + ' 通过 / ' + bad.length + ' 失败');
process.exit(bad.length ? 1 : 0);
