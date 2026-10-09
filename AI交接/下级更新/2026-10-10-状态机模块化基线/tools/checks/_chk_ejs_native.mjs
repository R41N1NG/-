#!/usr/bin/env node
/**
 * _chk_ejs_native.mjs —— 用**卡实际运行的那一份原生 EJS**渲染**实际卡内 content**（2026-10-08 · gpt 17 §5-3）
 *
 * 为什么要有它：gpt 两次点名「模板用原生 EJS 测实际卡内 content」「不要继续用自造最小 EJS 认证模板」。
 *   本条的 EJS 取自本机酒馆里**卡真正跑在其上的那个扩展**：
 *     `…\extensions\ST-Prompt-Template\src\3rdparty\ejs.js`（EJS UMD 打包件，`module.exports = f()`）。
 *
 * 做三件事：
 *   ① 用原生 EJS 渲染卡内 id7 content 的 12 例政策表，逐例断言（早日期/缺日期无战争当前句、按日期与事实放行…）；
 *   ② 把原生 EJS 的每一例输出与「最小 EJS」的输出**逐字节对照**，从而说明既有门禁的最小 EJS 与原生等价（或指出差异）；
 *   ③ 打源 SHA（扩展 EJS 与卡内 content）。
 *
 * 缺扩展时：**如实标"未验证"并 exit 0**（不假装通过），输出里写明原因。
 * 用法：node tools/checks/_chk_ejs_native.mjs [--card 路径]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const argv = process.argv;
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const CARD = argOf('--card', path.join('_staging_2026-10-08-18', '仙姝堕.json'));
const EJS_PATH = 'E:/tavern/SillyTavern/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js';
const OUT = path.join('AI交接', '下级更新', '2026-10-08-18-gpt17落实', '材料', '19b_原生EJS渲染对照.json');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

/* ── 最小 EJS（既有门禁那一套，用于逐例对照） ── */
function compileMinimal(tplText) {
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

if (!fs.existsSync(CARD)) { console.error('❌ 找不到卡：' + CARD); process.exit(2); }
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const e7 = (card.data.character_book.entries || []).find((e) => e.id === 7);
if (!e7) { console.error('❌ 卡内没有 id7'); process.exit(2); }
const content = e7.content;

const 结果 = { 卡: CARD, id7字符数: content.length, id7SHA: sha(content), EJS路径: EJS_PATH, 验证状态: '', 明细: [] };

if (!fs.existsSync(EJS_PATH)) {
  结果.验证状态 = '未验证（本机没有 ST-Prompt-Template 扩展，取不到卡实际使用的原生 EJS）';
  console.log('⚠️ ' + 结果.验证状态);
  console.log('   （不假装通过：本条在缺扩展的机器上如实记"未验证"。）');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(结果, null, 2), 'utf8');
  process.exit(0);
}

const ejsSrc = fs.readFileSync(EJS_PATH, 'utf8');
结果.EJS_SHA = sha(ejsSrc);
结果.EJS字节 = ejsSrc.length;
const ejs = require_(EJS_PATH);

const WAR = /兽潮一波接一波|围城数日|城墙段化作血腥炼狱/;
const K = (o) => Object.assign({ 南域大劫: false, 天溪城兽潮: false, 兽潮血战: false, 天溪城破: false, 极乐引入手: false, 玄机子胁迫过叶红缨: false }, o || {});
const V = (身份, 段位, 仙盟历, known) => ({ stat_data: { 身份, 段位, 仙盟历, known: K(known) } });
const 政策表 = [
  ['1577.07/段2/known空', V('赵无忧', 2, 1577.07, {}), { 战: false, 世界: '大劫之前' }],
  ['1577.07/段8/known空', V('赵无忧', 8, 1577.07, {}), { 战: false, 世界: '大劫之前' }],
  ['1578.03/段11/known空', V('赵无忧', 11, 1578.03, {}), { 战: false, 世界: '大劫之前' }],
  ['1577.07/段16/污染known', V('赵无忧', 16, 1577.07, { 天溪城兽潮: true, 天溪城破: true }), { 战: false, 世界: '大劫之前' }],
  ['1578.08/段8/大劫未立', V('赵无忧', 8, 1578.08, {}), { 战: false, 世界: '大劫已降（正式兽潮尚未到期）' }],
  ['1579.01/段8/大劫真/兽潮未立', V('赵无忧', 8, 1579.01, { 南域大劫: true }), { 战: false, 世界: '正式兽潮期' }],
  ['1579.01/段8/大劫真/兽潮立', V('赵无忧', 8, 1579.01, { 南域大劫: true, 天溪城兽潮: true }), { 战: true, 世界: '正式兽潮期' }],
  ['1579.03/段8/兽潮真/城破未立', V('赵无忧', 8, 1579.03, { 南域大劫: true, 天溪城兽潮: true }), { 战: false, 世界: '城破之后' }],
  ['1579.06/段2/城破真', V('赵无忧', 2, 1579.06, { 天溪城破: true }), { 战: false, 世界: '城破之后' }],
  ['缺日期/段8', V('赵无忧', 8, undefined, {}), { 战: false, 世界: '中性世界规则' }],
  ['非法日期/段8', V('赵无忧', 8, 9999.99, {}), { 战: false, 世界: '中性世界规则' }],
  ['殿主/1577.07/段2', V('焚欲殿主', 2, 1577.07, {}), { 战: false, 世界: '大劫之前', 舞台: '启程前' }],
];

const minimal = compileMinimal(content);
const rep = [];
let fail = 0;
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) fail++; };

for (const [名, vars, exp] of 政策表) {
  let 原生 = '', 最小 = '', err = null, err2 = null;
  try { 原生 = ejs.render(content, { variables: vars }, {}); } catch (e) { err = String(e && e.message || e); }
  try { 最小 = minimal(vars); } catch (e) { err2 = String(e && e.message || e); }
  const 战 = WAR.test(原生);
  const 世界 = (原生.match(/## 世界压力 · ([^\n]+)/) || [, /## 中性世界规则/.test(原生) ? '中性世界规则' : '（无）'])[1].trim();
  const 舞台 = (原生.match(/## 个人舞台 · ([^\n（]+)/) || [, '（无）'])[1].trim();
  ck(!err, 名 + '：原生 EJS 渲染不抛错' + (err ? '（' + err + '）' : ''));
  ck(!err2, 名 + '：最小 EJS 渲染不抛错' + (err2 ? '（' + err2 + '）' : ''));
  ck(原生 === 最小, 名 + '：原生 EJS 与最小 EJS 输出**逐字节一致**' + (原生 === 最小 ? '' : `（原生 ${原生.length} 字符 / 最小 ${最小.length} 字符）`));
  ck(战 === exp.战, 名 + '：战争当前句 ' + (战 ? '有' : '无') + '（应为 ' + (exp.战 ? '有' : '无') + '）');
  ck(世界 === exp.世界, 名 + '：世界轴＝' + 世界 + '（应为 ' + exp.世界 + '）');
  if (exp.舞台) ck(舞台.indexOf(exp.舞台) !== -1, 名 + '：个人舞台含「' + exp.舞台 + '」');
  结果.明细.push({ 用例: 名, 原生字符数: 原生.length, 最小字符数: 最小.length, 逐字节一致: 原生 === 最小, 含战争句: 战, 世界轴: 世界 });
}

结果.验证状态 = '已实测（原生 EJS＝' + path.basename(EJS_PATH) + '，共 ' + 政策表.length + ' 例）';
结果.通过项 = rep.filter((x) => x[0] === '✔').length;
结果.失败项 = fail;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(结果, null, 2), 'utf8');

console.log('【原生 EJS 渲染门禁】EJS＝' + EJS_PATH + '（SHA ' + 结果.EJS_SHA + '）');
console.log('  卡内 id7 content ' + content.length + ' 字符（SHA ' + 结果.id7SHA + '）');
for (const l of rep) console.log('  ' + l);
console.log('\n' + (fail ? '✘ ' + fail + ' 项未通过' : '✔ 全部通过（' + rep.length + ' 项）'));
process.exit(fail ? 1 : 0);
