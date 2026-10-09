/**
 * P42_cast_slider_css.mjs —— 给「在场要角」加**一行横排 ＋ 滑块翻动**的样式（主人 2026-10-09）。
 * 同时写入两处，保持打包器的"css ↔ replace.html 已同步"校验通过：
 *   ① tools/previews/_card_panel_v4.css（打包器的 CSS 来源）
 *   ② tools/previews/_card_panel_v4.replace.html 的 <style> 块
 * 幂等：已存在标记就不重复插。
 */
import fs from 'node:fs';

const MARK = '/* ═══ 在场要角：一行横排 ＋ 滑块翻动';
const BLOCK = `
${MARK}（主人 2026-10-09：上限 3 ⇒ 5，不占额外位置）═══ */
.xh-cast{position:relative}
.xds-cast-box[data-xds="cast"]{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;overflow-y:hidden;
  scroll-snap-type:x proximity;padding-bottom:3px;scrollbar-width:thin;
  scrollbar-color:rgba(190,160,90,.55) rgba(255,255,255,.05)}
.xds-cast-box[data-xds="cast"]>.xds-cc{flex:0 0 calc((100% - 32px)/5);min-width:0;margin-top:0;scroll-snap-align:start}
.xds-cast-box[data-xds="cast"]::-webkit-scrollbar{height:6px}
.xds-cast-box[data-xds="cast"]::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:3px}
.xds-cast-box[data-xds="cast"]::-webkit-scrollbar-thumb{background:rgba(190,160,90,.55);border-radius:3px}
@media (max-width:640px){.xds-cast-box[data-xds="cast"]>.xds-cc{flex:0 0 46%}}
`;

/* ① 纯 CSS 文件：直接追加到末尾 */
const cssPath = 'tools/previews/_card_panel_v4.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (css.includes(MARK)) console.log('  CSS 已有该块，跳过：' + cssPath);
else { fs.writeFileSync(cssPath, css.replace(/\s*$/, '\n') + BLOCK, 'utf8'); console.log('  ✔ 已写入：' + cssPath + '（+' + BLOCK.length + ' 字符）'); }

/* ② replace.html：插到最后一个 </style> 之前 */
const htmlPath = 'tools/previews/_card_panel_v4.replace.html';
let html = fs.readFileSync(htmlPath, 'utf8');
if (html.includes(MARK)) console.log('  replace.html 已有该块，跳过');
else {
  const i = html.lastIndexOf('</style>');
  if (i < 0) { console.error('✘ replace.html 里找不到 </style>'); process.exit(2); }
  html = html.slice(0, i) + BLOCK + html.slice(i);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('  ✔ 已写入：' + htmlPath + '（在 </style> 前插入 '+ BLOCK.length +' 字符）');
}
