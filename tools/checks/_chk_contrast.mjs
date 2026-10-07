#!/usr/bin/env node
/**
 * _chk_contrast.mjs —— 面板小字对比度体检（WCAG 2.1）
 *
 * 为什么要有它（2026-09-28 第三十六轮，主人：「下面字太黑看不清」）：
 *   面板底是墨色渐变（`#1b1d1e → #141617 → #0e1011`），但那只是**基色**——
 *   上面还叠了两层：`::before` 的内联 feTurbulence 噪点（`opacity:.85; mix-blend-mode:screen`）
 *   与 `::after` 的四团柔光（`opacity:.9`）。**screen 混合只提亮、不提暗**，
 *   于是"看着是深灰底"的有效底色被抬到 `#1a1c1d ~ #2f3031` ⇒
 *   原本按 `#0e1011` 挑的灰字（`#8a8471` 一类）在真机上就糊了。
 *
 * 判据：小字（10–13.5px）按 WCAG AA 正文 ⇒ **≥ 4.5:1**，且**底取噪点峰值 `#2f3031`**（不是基色）。
 *
 * 用法：node _chk_contrast.mjs [css 文件]     默认读 `_card_panel_v4.css`
 * 退出码：0＝全部达标；1＝有低于阈值的（打印同色相的建议值）
 */
import { readFileSync, existsSync } from 'node:fs';

const CSS = process.argv[2] || '_card_panel_v4.css';

/** `--menu`：从 `_build_card.js` 里把**身份菜单卡**的 CSS 抠出来查。
 *  为什么要单列：菜单卡是**另一份 CSS**（写在 `_build_card.js` 的 `MENU_HTML` 模板串里），
 *  它的 `.xds-mfoot`／`.xds-msub` 一直是照基色挑的暗字，从没被体检过
 *  —— 「整块渲染」把正文也搬进这张卡之后，它的每个字都会被玩家盯着看。 */
let cssText = '';
if (CSS === '--menu') {
  const src = readFileSync('_build_card.js', 'utf8');
  const i = src.indexOf('const MENU_HTML');
  if (i < 0) { console.error('_build_card.js 里找不到 MENU_HTML'); process.exit(2); }
  const j = src.indexOf('</style>', i);
  cssText = src.slice(src.indexOf('<style>', i) + 7, j).replace(/src:url\(data:font\/woff2;base64,[^)]*\)/, 'src:url(x)');
  console.log('（从 _build_card.js 抠出身份菜单卡 CSS ' + cssText.length + ' 字）');
} else {
  const cssPath = existsSync(CSS) ? CSS : existsSync('tools/previews/' + CSS) ? 'tools/previews/' + CSS : CSS;
  if (!existsSync(cssPath)) { console.error('找不到 CSS：' + CSS); process.exit(2); }
  cssText = readFileSync(cssPath, 'utf8');
}
const text = cssText;

/** 有效底色取样（从暗到亮）：panel 三档基色 / 微卡叠层 / 噪点平均 / **噪点峰值** */
const BGS = [
  ['#0e1011', '底部基色'],
  ['#141617', '中段基色'],
  ['#1b1d1e', '顶部基色'],
  ['#1a1c1d', '微卡叠层(白 4.5%)'],
  ['#24262a', '噪点 screen 提亮后（平均）'],
  ['#2f3031', '噪点 screen 峰值（最坏）'],
];
const TARGET = 4.5;

const hex = (s) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = ([r, g, b]) => {
  const f = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const fmt = (r) => r.toFixed(2);

function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h /= 6; if (h < 0) h += 1;
  }
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
}
function hsl2hex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h * 6) % 2) - 1)), m = l - c / 2;
  const t = h * 6;
  const [r, g, b] = t < 1 ? [c, x, 0] : t < 2 ? [x, c, 0] : t < 3 ? [0, c, x] : t < 4 ? [0, x, c] : t < 5 ? [x, 0, c] : [c, 0, x];
  const q = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + q(r) + q(g) + q(b);
}
/** 同色相／同饱和度抬亮，直到最坏底色下也达标 */
function suggest(fg, bgs, target = TARGET) {
  const [h, s, l] = rgb2hsl(fg);
  for (let nl = l; nl <= 1.0001; nl += 0.005) {
    const c = hsl2hex(h, s, nl);
    if (bgs.every((b) => ratio(hex(c), hex(b[0])) >= target)) return c;
  }
  return '#ffffff';
}


/** 收集规则里显式写的 `color:#xxxxxx`。
 *  ⚠️ 必须**按块拆声明**，不能按行找 —— 这套 CSS 里一条规则常跨好几行，
 *     而且渐变里也写十六进制（`linear-gradient(160deg,#7ab090,#4f7f63)`），按行找会看漏也会误判。
 *     第一版就是按行找，**漏掉了 `.xh-fold>summary .peek{color:#8a8471}`**（折叠行那句"预览字"，
 *     正好在主人说的"下面"），教训记一笔。 */
const decls = [];
{
  const lineOf = (idx) => text.slice(0, idx).split('\n').length;
  const blocks = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const b of blocks) {
    const sel = b[1].replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' ').slice(0, 64);
    if (/^@|^from$|^to$|^\d+%/.test(sel)) continue;
    for (const d of b[2].split(';')) {
      const m = /^\s*color\s*:\s*(#[0-9a-fA-F]{6})\s*$/.exec(d);
      if (!m) continue;
      decls.push({ line: lineOf(b.index + b[0].indexOf(d)), sel, color: m[1].toLowerCase() });
    }
  }
}

console.log('【面板小字对比度体检】' + CSS + `（阈值 ${TARGET}:1 @ 最坏底色 #2f3031 噪点峰值）\n`);
const bad = [];
for (const d of decls) {
  const fg = hex(d.color);
  const rs = BGS.map(([bg, name]) => ({ bg, name, r: ratio(fg, hex(bg)) }));
  const worst = rs.reduce((a, b) => (a.r < b.r ? a : b));
  const ok = worst.r >= TARGET;
  const sug = ok ? null : suggest(fg, BGS);
  if (!ok) bad.push({ ...d, worst, sug });
  console.log(`  ${ok ? '✔' : '✘'} L${String(d.line).padStart(3)}  ${d.color}  ${fmt(worst.r)}:1  ${d.sel}`);
  if (sug) console.log(`        ⇒ 建议 ${sug}（最坏底色下 ${fmt(ratio(hex(sug), hex('#2f3031')))}:1）`);
}

console.log(`\n共 ${decls.length} 条显式 color，${bad.length} 条低于 ${TARGET}:1`);
if (bad.length) {
  console.log('需要改的：' + bad.map((b) => `L${b.line} ${b.color}→${b.sug}`).join('｜'));
  process.exit(1);
}
console.log('✅ 全部达标（小字 ≥4.5:1，底取噪点峰值）');
