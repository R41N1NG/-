#!/usr/bin/env node
/**
 * _probe_panel_luma.mjs —— **量真像素**：把渲染出来的面板截图解码，报"有效底色"分布
 *
 * 为什么要有它（2026-09-28 第三十六轮，主人：「下面字太黑看不清」＋铁律 35「先读真机数据」）：
 *   对比度不能靠"看 CSS 里写的基色"估 —— 面板上面还叠了 `::before` 的噪点（`mix-blend-mode:screen`，只提亮）
 *   与 `::after` 的四团柔光。**真正的底是这两个图层混出来的**，只有解码截图才知道是多少。
 *
 * 判据输出：
 *   · `底色 p50/p90/p99/max`（只统计低饱和度的"背景像元"，避开文字／金边）
 *   · `文字最亮 p99`（同区域内高饱和或高亮像素）
 *   ⇒ 有效对比度 ≈ 用 `p99 底色` 与文字色算 WCAG 比值（这才是真机上的读数）
 *
 * 用法：node _probe_panel_luma.mjs <panel.png> [区域: 0..1 起, 0..1 止]    默认 0.45 0.95（面板下半部）
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/* ── 极简 PNG 解码（8bit，非隔行；与 _gen_portrait_small.mjs 同法） ── */
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG');
  let off = 8, w = 0, h = 0, depth = 0, color = 0, interlace = 0;
  const idat = [];
  let plte = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; color = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'PLTE') plte = data;
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8) throw new Error('只支持 8 bit');
  if (interlace !== 0) throw new Error('不支持隔行 PNG');
  const raw = inflateSync(Buffer.concat(idat));
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[color];
  const stride = w * channels;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); };
  for (let y = 0; y < h; y += 1) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, y * stride + stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = (prev && x >= channels) ? prev[x - channels] : 0;
      const v = line[x];
      cur[x] = filter === 0 ? v : filter === 1 ? (v + a) & 255 : filter === 2 ? (v + b) & 255
        : filter === 3 ? (v + ((a + b) >> 1)) & 255 : (v + paeth(a, b, c)) & 255;
    }
  }
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i += 1) {
    if (color === 3) { const idx = out[i]; rgb[i * 3] = plte[idx * 3]; rgb[i * 3 + 1] = plte[idx * 3 + 1]; rgb[i * 3 + 2] = plte[idx * 3 + 2]; }
    else if (color === 0) { rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = out[i]; }
    else if (color === 4) { rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = out[i * 2]; }
    else if (color === 2) { rgb[i * 3] = out[i * 3]; rgb[i * 3 + 1] = out[i * 3 + 1]; rgb[i * 3 + 2] = out[i * 3 + 2]; }
    else { rgb[i * 3] = out[i * 4]; rgb[i * 3 + 1] = out[i * 4 + 1]; rgb[i * 3 + 2] = out[i * 4 + 2]; }
  }
  return { w, h, rgb };
}

const lum = (r, g, b) => {
  const f = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const hx = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];

const [, , file, a0, a1, xa, xb, ign] = process.argv;
if (!file) { console.error('用法: node _probe_panel_luma.mjs <panel.png> [y起] [y止] [x起] [x止] [忽略亮度阈值]'); process.exit(2); }
const { w, h, rgb } = decodePNG(readFileSync(file));
const y0 = Math.floor(h * Number(a0 ?? 0.45));
const y1 = Math.floor(h * Number(a1 ?? 0.95));
const x0 = Math.floor(w * Number(xa ?? 0));
const x1 = Math.floor(w * Number(xb ?? 1));
/** 忽略比这个还暗的像元（截图的**页面底色**，不是面板底色） */
const IGNORE_L = Number(ign ?? 0.006);

const bgL = [], hist = new Map();
for (let y = y0; y < y1; y += 1) {
  for (let x = x0; x < x1; x += 1) {
    const i = (y * w + x) * 3;
    const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx - mn;
    const L = lum(r, g, b);
    if (L <= IGNORE_L) continue;            // 截图页面底色，不是面板底
    /* 只统计低饱和（灰调）像元 —— 排除金边／玉牌／危机红这类彩色元素 */
    if (sat > 16) continue;
    bgL.push(L);
    /* 量化到 4 一档，统计"最常见的那几种灰" —— 背景是**众数**，不是 P99（P99 抓到的多是文字抗锯齿边） */
    const q = ((r >> 2) << 4) | ((g >> 2) << 2) | (b >> 2);
    const e = hist.get(q) || { n: 0, r: 0, g: 0, b: 0 };
    e.n += 1; e.r += r; e.g += g; e.b += b;
    hist.set(q, e);
  }
}
const top = [...hist.values()].sort((a, b) => b.n - a.n).slice(0, 6)
  .map((e) => ({ n: e.n, r: Math.round(e.r / e.n), g: Math.round(e.g / e.n), b: Math.round(e.b / e.n) }));
const total = top.reduce((s, e) => s + e.n, 0) || 1;
const modal = top[0];

bgL.sort((p, q) => p - q);
const pctL = (p) => bgL[Math.min(bgL.length - 1, Math.floor(bgL.length * p))];

console.log(`【面板有效底色实测】${file}｜图 ${w}×${h}｜区域 y ${y0}–${y1}｜低饱和像元 ${bgL.length} 个`);
console.log('  最常见的几种灰（众数＝背景）：');
for (const e of top) {
  console.log(`    ${hx(e.r, e.g, e.b)}  ${(e.n / total * 100).toFixed(1)}%  亮度 ${lum(e.r, e.g, e.b).toFixed(3)}`);
}
const bgLum = lum(modal.r, modal.g, modal.b);
const peakLum = pctL(0.98);
const contrast = (Lf, Lb) => { const [hi, lo] = [Lf, Lb].sort((a, b) => b - a); return (hi + 0.05) / (lo + 0.05); };
console.log(`\n  背景众数 ${hx(modal.r, modal.g, modal.b)} 亮度 ${bgLum.toFixed(3)}｜灰度 p90 ${pctL(0.90).toFixed(3)}｜p98 ${peakLum.toFixed(3)}`);
console.log(`  对比度参照表：vs **背景众数** ／ vs 灰度 p98（最坏，含文字边缘）`);
for (const [name, c] of [['#f7f3e8 题字', [0xf7, 0xf3, 0xe8]], ['#e6e0d2 正文值', [0xe6, 0xe0, 0xd2]],
  ['#cfc7b0 折叠题', [0xcf, 0xc7, 0xb0]], ['#bcb6a6 暗值', [0xbc, 0xb6, 0xa6]],
  ['#b3ad9d 角色行标签', [0xb3, 0xad, 0x9d]], ['#b2ac9b 细目标签', [0xb2, 0xac, 0x9b]],
  ['#b2ac9c 折叠预览', [0xb2, 0xac, 0x9c]]]) {
  console.log(`    ${name.padEnd(16)} ${contrast(lum(...c), bgLum).toFixed(2)}:1 ／ ${contrast(lum(...c), peakLum).toFixed(2)}:1`);
}
console.log(`\n  ⚠️ 判据看第一列（背景众数）——它才是"底"；第二列把文字抗锯齿边也算进去了，只作参考。`);
