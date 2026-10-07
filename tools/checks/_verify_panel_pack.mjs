#!/usr/bin/env node
/** _verify_panel_pack.mjs —— 校验打包后的面板脚本是否齐活（避免每回在 PowerShell 里拼引号） */
import { readFileSync, existsSync } from 'node:fs';

const F = '卡片脚本/状态栏面板.js';
if (!existsSync(F)) { console.error('缺 ' + F); process.exit(2); }
const SRC_CSS = existsSync('_card_panel_v4.css') ? '_card_panel_v4.css' : 'tools/previews/_card_panel_v4.css';
const SRC_REPLACE = existsSync('_card_panel_v4.replace.html') ? '_card_panel_v4.replace.html' : 'tools/previews/_card_panel_v4.replace.html';
const s = readFileSync(F, 'utf8');
/* CSS 是 base64 常量 ⇒ 要解出来查，不能直接在源码里找关键字（上一版就是这么误报的） */
let cssText = '';
let skelText = '';
try {
  const m = /const XSD_CSS = '([A-Za-z0-9+/=]+)'/.exec(s);
  if (m) cssText = Buffer.from(m[1], 'base64').toString('utf8');
  const m2 = /const XSD_SKELETON = '([A-Za-z0-9+/=]+)'/.exec(s);
  if (m2) skelText = Buffer.from(m2[1], 'base64').toString('utf8');
} catch (e) { /* 留空，后续判定会失败并报出来 */ }
/* 骨架里所有 data-xds 槽位必须**是空的**（2026-09-28 修：示例值会把真值挡在门外） */
const slotTexts = [...skelText.matchAll(/<span\s+data-xds="([a-z]+)"[^>]*>([\s\S]*?)<\/span>/g)]
  .map((m) => [m[1], m[2].trim()]).filter(([, v]) => v);
const checks = [
  ['fillPanel 收容器参数', s.includes('function fillPanel(messageId, rawText, explicitPanel)')],
  ['fillPanel 用显式容器', s.includes('const panel = explicitPanel || panelOf(mesEl)')],
  ['xsdFillPanel 收容器参数', s.includes('function xsdFillPanel(mesid, rawText, explicitPanel)')],
  ['xsdFillPanel 透传容器', s.includes('fillPanel(n, rawText, explicitPanel)')],
  ['根容器带容器查询（解 CSS 后查）', cssText.includes('container-type:inline-size')],
  ['根容器带容器名', cssText.includes('container-name:xsd-hud')],
  ['样式里有 @font-face 的 data URI', s.includes("url(data:font/woff2;base64,")],
  ['CSS 解出成功且非空', cssText.length > 3000],
  /* ★ 骨架必须是「空槽」—— 示例值会把真值挡在门外（真机两次踩到） */
  ['骨架解出成功', skelText.length > 2000],
  ['骨架 18 个槽位齐', (skelText.match(/data-xds="/g) || []).length >= 18],
  ['★ 骨架槽位**全空**（无示例值残留）', slotTexts.length === 0],
  /* ⚠️ 2026-10-01：`mq`（名器）槽已按主人令删除（痕迹改写进各角色自己的子块）⇒ 期望清单同步去掉 mq，19→18。 */
  ['骨架含全部 18 个 FIELD_MAP 槽位（含 id 身份）',
    ['loc', 'time', 'elapsed', 'weather', 'env', 'who', 'dark', 'id', 'realm', 'state', 'goal', 'cast', 'sit', 'clue', 'near', 'mid', 'crisis', 'rel']
      .every((k) => skelText.includes(`data-xds="${k}"`) || skelText.includes(`data-xds="${k}" `))],
  ['骨架里没有设计稿样例文字（元婴初期/九皇子）', !skelText.includes('元婴初期') && !skelText.includes('九皇子</span>')],
  ['★ 骨架里没有示例立绘卡（.xh-cc）', !skelText.includes('xh-cc')],
  ['★ 骨架里没有示例人名「柳玉」', !skelText.includes('柳玉')],
  ['填值已改为覆盖式（无 !el.textContent 判断）', !s.includes('!el.textContent')],
  ['立绘阶段分组仍在', s.includes('XSD_VARIANTS')],
  ['灯箱翻面仍在', s.includes('xsdMakeFlipper')],
  ['样式注入入口', s.includes('ensureStyleInjected')],
  ['反查原文入口', s.includes('getMessageData')],
  ['XsdHUD 已挂', s.includes('w.XsdHUD = XsdHUD')],
  ['CSS 常量只声明一次', (s.match(/const XSD_CSS = /g) || []).length === 1],
  ['骨架常量只声明一次', (s.match(/const XSD_SKELETON = /g) || []).length === 1],
  ['字体常量只声明一次', (s.match(/const XSD_FONT_B64 = /g) || []).length === 1],
  ['无遗留占位符', !s.includes('/*__XSD_')],
  ['无旧 v2.3 接线日志', !s.includes('已挂到 ${ok} 个全局（v2.3）')],
  /* ★★ 2026-09-28 第三十六轮：`_card_panel_v4.css` 改了但**卡里没变**（CSS 其实是从
   *    `_card_panel_v4.replace.html` 里切的）—— 三处必须一致，否则样式改了等于没改。 */
  ['★ 打包用的 CSS ≡ `_card_panel_v4.css`（样式单一真源）', cssMatchesSource()],
  ['★ `_card_panel_v4.css` 与 `replace.html` 的 <style> 正文已同步', cssInSync()],
  /* ★ 本轮两条修复：翻面数据两段式读取、一次点击只开一次箱 */
  ['★ 翻面数据从 img 两段式读取（xsdAttrFrom）', s.includes('function xsdAttrFrom(') && (s.includes("'data-alt')") || s.includes("\"data-alt\")"))],
  ['★ 翻面链是大图（data-alt 用 XSD_BIG_EXTS[0]）', s.includes('xsdStageImages(pinyin, st, table, XSD_BIG_EXTS[0])')],
  ['★ 双开箱防护：capture 委托 stopPropagation', s.includes('typeof ev.stopPropagation ===')],
  ['★ 双开箱防护：xsdOpenFrom 去重闸门', s.includes('xsdLastOpen')],
  ['★ 对比度：噪点不再抬底（opacity:.5 / slope 0.12）', cssText.includes('opacity:.5;mix-blend-mode:screen') && cssText.includes("slope='0.12'")],
  ['★ 对比度：旧暗字已抬亮（无 #8a8471/#8f8974/#948e7d）',
    !cssText.includes('#8a8471') && !cssText.includes('#8f8974') && !cssText.includes('#948e7d')],
];

function cssMatchesSource() {
  try {
    const src = readFileSync(SRC_CSS, 'utf8').replace(/^\uFEFF/, '');
    const norm = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
    const a = norm(cssText), b = norm(src);
    return a === b || a === norm(src.replace(/(\.xh\{[^}]*?)(\})/, '$1container-type:inline-size;container-name:xsd-hud;$2'));
  } catch (e) { return false; }
}
function cssInSync() {
  try {
    const src = readFileSync(SRC_CSS, 'utf8').replace(/^\uFEFF/, '');
    const html = readFileSync(SRC_REPLACE, 'utf8');
    const i = html.indexOf('<style>'), j = html.indexOf('</style>', i);
    if (i < 0 || j < 0) return false;
    const inner = html.slice(i + 7, j).replace(/@font-face\{[^}]*\}\s*/g, '');
    const norm = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
    return norm(inner) === norm(src);
  } catch (e) { return false; }
}
let bad = 0;
console.log('【面板脚本打包校验】' + F + '（' + s.length + ' 字符）\n');
for (const [k, v] of checks) { if (!v) bad += 1; console.log(`  ${v ? '✔' : '✘'} ${k}`); }
if (bad) { console.log(`\n❌ ${bad} 项不符`); process.exit(2); }
console.log('\n✅ 全部通过');
