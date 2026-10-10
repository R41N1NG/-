#!/usr/bin/env node
/**
 * _chk_stage_drive.mjs —— 【阶段驱动】(id7) 门禁（2026-10-08 重写，取代 `_chk_ejs_stage.mjs`）
 *
 * 为什么重写：gpt 17 号 §4/§5-3 两条 ——
 *   ① 「模板用原生 EJS 测**实际卡内 content**」：旧门禁读的是 `src/text_data/_stage_drive.txt` **源模板**，
 *      且自带一套自造最小 EJS；与卡内注入件不是同一件东西。
 *   ② 「门控结构可合法但业务仍错…需用**独立事件政策表**给必测负例」：期望值必须**独立于被测表达式**
 *      （不能"表达式里有没有日期"决定测不测），这里把 12 条期望**写死在门禁里**。
 *
 * 验的事：
 *   ① 结构：新模板的「世界压力」四块与「个人舞台」四块都在；旧的 `## 阶段一 · ` 已不存在；
 *   ② 政策表 12 例（日期×段位×known×身份）逐例比**硬编码期望**：早日期/缺日期/污染 known 一律不得
 *      出现当下式战争句（`兽潮一波接一波`／`围城数日`／`城墙段化作血腥炼狱`）；只有日期到且事实成立才允许；
 *   ③ fail-closed：`variables` 缺失 ⇒ 只渲染安全占位（`阶段数据不可用`），不吐任何阶段/舞台块；
 *   ④ 源模板 ↔ 卡内 content 的 SHA 对照（允许的唯一差异：构建期把行首 `· ` 规范成 `- `）。
 *
 * 用法：node tools/checks/_chk_stage_drive.mjs [--card 路径]
 * 退出码：0＝全绿；1＝有断言失败；2＝卡文件缺失
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const argv = process.argv;
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const CARD = argOf('--card', path.join('最新角色卡', '仙姝堕.json'));
const SRC = path.join('src', 'text_data', '_stage_drive.txt');
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 16);

if (!fs.existsSync(CARD)) { console.error('❌ 找不到卡文件：' + CARD); process.exit(2); }
if (!fs.existsSync(SRC)) { console.error('❌ 找不到源模板：' + SRC); process.exit(2); }

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

const rep = [];
let fail = 0;
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fail++; };

const card = JSON.parse(fs.readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const e7 = (card.data.character_book.entries || []).find((e) => e.id === 7);
if (!e7) { console.error('❌ 卡内没有 id7'); process.exit(2); }
const content = e7.content;

/* ① 结构 */
const 世界块 = (content.match(/## 世界压力 · /g) || []).length;
const 舞台块 = (content.match(/## 个人舞台 · /g) || []).length;
const 旧结构 = (content.match(/## 阶段[一二三四] · /g) || []).length;
ck(世界块 === 4, '世界压力四块齐全（实测 ' + 世界块 + '）');
ck(舞台块 === 4, '个人舞台四块齐全（实测 ' + 舞台块 + '）');
ck(旧结构 === 0, '旧的「## 阶段一…四」结构已不存在（实测残留 ' + 旧结构 + '）');
ck(/## 中性世界规则/.test(content), '含「中性世界规则」块（缺日期/非法日期用）');
ck(/状态冲突/.test(content), '含「状态冲突」诊断口径');
ck(!/后台未给出，沿用你上一条写过的月份/.test(content), '已去掉「后台未给出 ⇒ 沿用你上一条写过的月份」这个兜底（保留的是"不得沿用"的禁令）');

/* ② 独立政策表（期望写死，不看被测表达式） */
const render = compileEJS(content);
const WAR = /兽潮一波接一波|围城数日|城墙段化作血腥炼狱/;
const K = (o) => Object.assign({ 南域大劫: false, 天溪城兽潮: false, 兽潮血战: false, 天溪城破: false, 极乐引入手: false, 玄机子胁迫过叶红缨: false }, o || {});
const V = (身份, 段位, 仙盟历, known) => ({ stat_data: { 身份, 段位, 仙盟历, known: K(known) } });
const 政策表 = [
  ['1577.07/段2/known空', V('赵无忧', 2, 1577.07, {}), { 战: false, 世界: '大劫之前' }],
  ['1577.07/段8/known空', V('赵无忧', 8, 1577.07, {}), { 战: false, 世界: '大劫之前' }],
  ['1578.03/段11/known空（gpt 点名的反例）', V('赵无忧', 11, 1578.03, {}), { 战: false, 世界: '大劫之前' }],
  ['1577.07/段16/污染known', V('赵无忧', 16, 1577.07, { 天溪城兽潮: true, 天溪城破: true }), { 战: false, 世界: '大劫之前' }],
  ['1578.08/段8/大劫未立', V('赵无忧', 8, 1578.08, {}), { 战: false, 世界: '大劫已降（正式兽潮尚未到期）' }],
  ['1579.01/段8/大劫真/兽潮未立', V('赵无忧', 8, 1579.01, { 南域大劫: true }), { 战: false, 世界: '正式兽潮期' }],
  ['1579.01/段8/大劫真/兽潮立', V('赵无忧', 8, 1579.01, { 南域大劫: true, 天溪城兽潮: true }), { 战: true, 世界: '正式兽潮期' }],
  ['1579.03/段8/兽潮真/城破未立', V('赵无忧', 8, 1579.03, { 南域大劫: true, 天溪城兽潮: true }), { 战: false, 世界: '城破之后' }],
  ['1579.06/段2/城破真（晚日期低段位）', V('赵无忧', 2, 1579.06, { 天溪城破: true }), { 战: false, 世界: '城破之后' }],
  ['缺日期/段8', V('赵无忧', 8, undefined, {}), { 战: false, 世界: '中性世界规则' }],
  ['非法日期/段8', V('赵无忧', 8, 9999.99, {}), { 战: false, 世界: '中性世界规则' }],
  ['殿主身份/1577.07/段2（④ 取消强压）', V('焚欲殿主', 2, 1577.07, {}), { 战: false, 世界: '大劫之前', 舞台: '启程前' }],
];
for (const [name, vars, exp] of 政策表) {
  let text = '', err = null;
  try { text = render(vars); } catch (e) { err = String(e && e.message); }
  const hasWar = WAR.test(text);
  const 世界 = (text.match(/## 世界压力 · ([^\n]+)/) || [, /## 中性世界规则/.test(text) ? '中性世界规则' : '（无）'])[1].trim();
  const 舞台 = (text.match(/## 个人舞台 · ([^\n（]+)/) || [, '（无）'])[1].trim();
  ck(!err, name + '：渲染不抛错' + (err ? '（' + err + '）' : ''));
  ck(hasWar === exp.战, name + '：战争当前句 ' + (hasWar ? '有' : '无') + '（应为 ' + (exp.战 ? '有' : '无') + '）');
  ck(世界 === exp.世界, name + '：世界轴＝' + 世界 + '（应为 ' + exp.世界 + '）');
  if (exp.舞台) ck(舞台.indexOf(exp.舞台) !== -1, name + '：个人舞台含「' + exp.舞台 + '」（实测 ' + 舞台 + '）');
}

/* ③ fail-closed */
{
  let t = '', err = null;
  try { t = render({}); } catch (e) { err = String(e && e.message); }
  ck(!err, 'fail-closed：variables 缺失时不抛错');
  ck(/阶段数据不可用/.test(t), 'fail-closed：只渲染安全占位');
  ck(!/## 世界压力|## 个人舞台/.test(t), 'fail-closed：不吐任何世界轴或舞台块');
}

/* ④ 源模板 ↔ 卡内 content */
const src = fs.readFileSync(SRC, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const 规范化 = (s) => s.replace(/\r\n/g, '\n').replace(/^[·•]\s?/gm, '- ').replace(/\s+$/, '');
ck(规范化(src) === 规范化(content), '源模板与卡内 content 一致（唯一允许差异：行首 · → -）｜源 ' + sha(src) + ' / 卡 ' + sha(content));

console.log('【阶段驱动门禁】' + CARD);
for (const line of rep) console.log('  ' + line);
console.log('\n' + (fail ? '✘ ' + fail + ' 项未通过' : '✔ 全部通过'));
process.exit(fail ? 1 : 0);
