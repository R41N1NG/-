#!/usr/bin/env node
/**
 * _gen_portrait_small.mjs —— 把立绘大图缩成「面板用」小图，并对比编码后的体积
 *
 * 背景：本地候选链是 `user/images/xsd_gallery/<拼音>.{png,webp}`，而现在库里全是
 *   **1.5–2 MB 的 PNG**（按成图原尺寸）。面板要的只是 96×128 的小图 ⇒ 直接用大图等于
 *   每次渲染把几 MB 拉进浏览器；面板脚本注释里也写着「webp 体积小优先」。
 *
 * 本脚本：**纯 Node 实现**（本机没有 ImageMagick / ffmpeg / cwebp / sharp）：
 *   · 解码 PNG：支持 8 bit 真彩／调色板／灰度、**全部 5 种 filter**、非隔行（立绘都是标准 PNG）
 *   · 缩放：box filter（面积平均，缩小时最稳）
 *   · 编码：① **基线 JPEG**（自写：DCT ＋ 标准量化表 ＋ 4:2:0 ＋ 霍夫曼表，纯正 baseline）
 *          ② PNG（真彩，作对照）
 *   ⇒ 打印两种编码的体积，便于决定「面板该优先取哪种扩展名」。
 *
 * 用法：node _gen_portrait_small.mjs <输入.png> [输出前缀] [宽] [高] [--apply]
 *   --apply 才真写文件（默认只量体积、写临时对比文件到 `.small-preview\`）
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { basename, dirname, join, extname } from 'node:path';

/* ═══════════ ① PNG 解码 ═══════════ */
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG');
  let off = 8;
  let w = 0, h = 0, depth = 0, color = 0, interlace = 0;
  const idat = [];
  let plte = null, trns = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; color = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8) throw new Error(`只支持 8 bit（此图 ${depth} bit）`);
  if (interlace !== 0) throw new Error('不支持隔行 PNG');
  const raw = inflateSync(Buffer.concat(idat));
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[color];
  if (!channels) throw new Error(`不支持的颜色类型 ${color}`);
  const stride = w * channels;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
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
      cur[x] = filter === 0 ? v
        : filter === 1 ? (v + a) & 255
          : filter === 2 ? (v + b) & 255
            : filter === 3 ? (v + ((a + b) >> 1)) & 255
              : (v + paeth(a, b, c)) & 255;
    }
  }
  /* 统一转成 RGB */
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i += 1) {
    let r, g, bl;
    if (color === 3) {
      const idx = out[i];
      r = plte[idx * 3]; g = plte[idx * 3 + 1]; bl = plte[idx * 3 + 2];
    } else if (color === 0) { r = g = bl = out[i]; }
    else if (color === 4) { r = g = bl = out[i * 2]; }
    else if (color === 2) { r = out[i * 3]; g = out[i * 3 + 1]; bl = out[i * 3 + 2]; }
    else { r = out[i * 4]; g = out[i * 4 + 1]; bl = out[i * 4 + 2]; }
    rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = bl;
  }
  return { w, h, rgb, colorType: color, hasAlpha: color === 4 || color === 6 };
}
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
};

/* ═══════════ ② box filter 缩放 ═══════════ */
function resize(rgb, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 3);
  const xr = sw / dw, yr = sh / dh;
  for (let y = 0; y < dh; y += 1) {
    const y0 = Math.floor(y * yr), y1 = Math.max(y0 + 1, Math.min(sh, Math.ceil((y + 1) * yr)));
    for (let x = 0; x < dw; x += 1) {
      const x0 = Math.floor(x * xr), x1 = Math.max(x0 + 1, Math.min(sw, Math.ceil((x + 1) * xr)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < y1; yy += 1) {
        for (let xx = x0; xx < x1; xx += 1) {
          const i = (yy * sw + xx) * 3;
          r += rgb[i]; g += rgb[i + 1]; b += rgb[i + 2]; n += 1;
        }
      }
      const o = (y * dw + x) * 3;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n);
    }
  }
  return out;
}

/* ═══════════ ③ 基线 JPEG 编码 ═══════════ */
const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34,
  27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44,
  51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63];
const QC_LUM = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const QC_CHR = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99,
  47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

/** 标准霍夫曼表（Annex K） */
const DC_LUM_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_LUM_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const DC_CHR_BITS = [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
const DC_CHR_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_LUM_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
const AC_LUM_VALS = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
  0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
  0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
  0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
  0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
  0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa];
const AC_CHR_BITS = [0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
const AC_CHR_VALS = [
  0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
  0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0,
  0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
  0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
  0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
  0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
  0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
  0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
  0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
  0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa];

/** 由 BITS/VALS 建 code→(码,长度) 表 */
function huffTable(bits, vals) {
  const table = new Map();
  let code = 0, k = 0;
  for (let len = 1; len <= 16; len += 1) {
    for (let i = 0; i < bits[len - 1]; i += 1) { table.set(vals[k++], { code, len }); code += 1; }
    code <<= 1;
  }
  return table;
}
const HDCL = huffTable(DC_LUM_BITS, DC_LUM_VALS);
const HDCC = huffTable(DC_CHR_BITS, DC_CHR_VALS);
const HACL = huffTable(AC_LUM_BITS, AC_LUM_VALS);
const HACC = huffTable(AC_CHR_BITS, AC_CHR_VALS);

/** 8×8 前向 DCT（分离式，先行后列） */
const COS = Array.from({ length: 8 }, (_, u) => Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16)));
const C = Array.from({ length: 8 }, (_, u) => (u === 0 ? Math.SQRT1_2 : 1));
function fdct(block) {
  const tmp = new Float64Array(64);
  const out = new Float64Array(64);
  for (let y = 0; y < 8; y += 1) {
    for (let u = 0; u < 8; u += 1) {
      let s = 0;
      for (let x = 0; x < 8; x += 1) s += block[y * 8 + x] * COS[u][x];
      tmp[y * 8 + u] = s * C[u] / 2;
    }
  }
  for (let u = 0; u < 8; u += 1) {
    for (let v = 0; v < 8; v += 1) {
      let s = 0;
      for (let y = 0; y < 8; y += 1) s += tmp[y * 8 + u] * COS[v][y];
      out[v * 8 + u] = s * C[v] / 2;
    }
  }
  return out;
}

class BitWriter {
  constructor() { this.bytes = []; this.acc = 0; this.n = 0; }
  write(code, len) {
    for (let i = len - 1; i >= 0; i -= 1) {
      this.acc = (this.acc << 1) | ((code >> i) & 1);
      this.n += 1;
      if (this.n === 8) {
        this.bytes.push(this.acc & 255);
        if ((this.acc & 255) === 255) this.bytes.push(0);   // 字节填充
        this.acc = 0; this.n = 0;
      }
    }
  }
  flush() { while (this.n) this.write(1, 1); }
}

const bitsFor = (v) => { let n = 0; while (v) { n += 1; v = Math.abs(v) >> 1; } return n; };
const magBits = (v, n) => (v >= 0 ? v : v + (1 << n) - 1);

function encodeBlock(w, zz, q, dctab, actab, prevDC, comp) {
  const coef = new Int32Array(64);
  for (let i = 0; i < 64; i += 1) {
    const z = ZIGZAG[i];
    coef[z] = Math.round(zz[z] / q[i]);
  }
  const diff = coef[0] - prevDC;
  const n = bitsFor(diff);
  const dc = dctab.get(n);
  w.write(dc.code, dc.len);
  if (n) w.write(magBits(diff, n), n);
  let run = 0;
  for (let i = 1; i < 64; i += 1) {
    const z = ZIGZAG[i];
    const v = coef[z];
    if (v === 0) { run += 1; continue; }
    while (run > 15) { const zrl = actab.get(0xf0); w.write(zrl.code, zrl.len); run -= 16; }
    const s = bitsFor(v);
    const sym = actab.get((run << 4) | s);
    w.write(sym.code, sym.len);
    w.write(magBits(v, s), s);
    run = 0;
  }
  if (run > 0) { const eob = actab.get(0x00); w.write(eob.code, eob.len); }
  return coef[0];
}

/** 基线 JPEG（4:2:0，Y 全采、CbCr 各半采） */
function encodeJPEG(rgb, w, h, quality = 80) {
  const scale = quality < 50 ? Math.round(5000 / quality) : Math.round(200 - 2 * quality);
  const qLum = QC_LUM.map((v) => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));
  const qChr = QC_CHR.map((v) => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));

  /* 转 YCbCr */
  const Y = new Float64Array(w * h);
  const Cb = new Float64Array(w * h);
  const Cr = new Float64Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    Y[i] = 0.299 * r + 0.587 * g + 0.114 * b - 128;
    Cb[i] = -0.168736 * r - 0.331264 * g + 0.5 * b;
    Cr[i] = 0.5 * r - 0.418688 * g - 0.081312 * b;
  }
  const block = (plane, x0, y0) => {
    const bl = new Float64Array(64);
    for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
      const sx = Math.min(w - 1, x0 + x), sy = Math.min(h - 1, y0 + y);
      bl[y * 8 + x] = plane[sy * w + sx];
    }
    return bl;
  };

  const w8 = Math.ceil(w / 8) * 8;
  const h8 = Math.ceil(h / 8) * 8;
  const bw = Math.ceil(w / 8), bh = Math.ceil(h / 8);
  const cw = Math.ceil(w / 16), chh = Math.ceil(h / 16);

  /* 8×8 块序列：MCU 内 Y0Y1Y2Y3 CbCr */
  const Yblocks = [];
  for (let by = 0; by < bh; by += 1) for (let bx = 0; bx < bw; bx += 1) Yblocks.push([bx * 8, by * 8]);
  const Cblocks = [];
  for (let by = 0; by < chh; by += 1) for (let bx = 0; bx < cw; bx += 1) Cblocks.push([bx * 16, by * 16]);

  /* 色度下采（2×2 平均） */
  const CbS = new Float64Array(cw * 8 * chh * 8);
  const CrS = new Float64Array(cw * 8 * chh * 8);
  const sw = cw * 8, sh = chh * 8;
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      let sb = 0, sr = 0, n = 0;
      for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) {
        const sx = Math.min(w - 1, x * 2 + dx), sy = Math.min(h - 1, y * 2 + dy);
        sb += Cb[sy * w + sx]; sr += Cr[sy * w + sx]; n += 1;
      }
      CbS[y * sw + x] = sb / n; CrS[y * sw + x] = sr / n;
    }
  }

  const bit = new BitWriter();
  let dcY = 0, dcCb = 0, dcCr = 0;
  const mcuW = Math.ceil(bw / 2), mcuH = Math.ceil(bh / 2);
  for (let my = 0; my < mcuH; my += 1) {
    for (let mx = 0; mx < mcuW; mx += 1) {
      for (let k = 0; k < 4; k += 1) {
        const bx = mx * 2 + (k % 2), by = my * 2 + Math.floor(k / 2);
        const bl = block(Y, Math.min(w - 1, bx * 8), Math.min(h - 1, by * 8));
        dcY = encodeBlock(bit, fdct(bl), qLum, HDCL, HACL, dcY, 'Y');
      }
      const cbl = new Float64Array(64);
      for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
        const sx = Math.min(sw - 1, mx * 8 + x), sy = Math.min(sh - 1, my * 8 + y);
        cbl[y * 8 + x] = CbS[sy * sw + sx];
      }
      dcCb = encodeBlock(bit, fdct(cbl), qChr, HDCC, HACC, dcCb, 'Cb');
      for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
        const sx = Math.min(sw - 1, mx * 8 + x), sy = Math.min(sh - 1, my * 8 + y);
        cbl[y * 8 + x] = CrS[sy * sw + sx];
      }
      dcCr = encodeBlock(bit, fdct(cbl), qChr, HDCC, HACC, dcCr, 'Cr');
    }
  }
  bit.flush();

  const out = [];
  const push = (...b) => out.push(...b);
  push(0xff, 0xd8);                                                       // SOI
  /* DQT */
  push(0xff, 0xdb, 0x00, 0x43, 0x00); for (let i = 0; i < 64; i += 1) push(qLum[ZIGZAG[i]]);
  push(0xff, 0xdb, 0x00, 0x43, 0x01); for (let i = 0; i < 64; i += 1) push(qChr[ZIGZAG[i]]);
  /* SOF0 */
  push(0xff, 0xc0, 0x00, 0x11, 0x08, (h >> 8) & 255, h & 255, (w >> 8) & 255, w & 255, 0x03,
    0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01);
  /* DHT */
  const dht = (cls, id, bits, vals) => { push(0xff, 0xc4, 0x00, 3 + 16 + vals.length, (cls << 4) | id); for (const b of bits) push(b); for (const v of vals) push(v); };
  dht(0, 0, DC_LUM_BITS, DC_LUM_VALS);
  dht(1, 0, AC_LUM_BITS, AC_LUM_VALS);
  dht(0, 1, DC_CHR_BITS, DC_CHR_VALS);
  dht(1, 1, AC_CHR_BITS, AC_CHR_VALS);
  /* SOS */
  push(0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00);
  for (const b of bit.bytes) push(b);
  push(0xff, 0xd9);                                                       // EOI
  return Buffer.from(out);
}

/* ═══════════ ④ PNG 编码（对照用） ═══════════ */
function crc32(buf) {
  let c, table = crc32.t;
  if (!table) {
    table = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) { c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c; }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function encodePNG(rgb, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y += 1) { raw[p++] = 0; rgb.copy(raw, p, y * w * 3, (y + 1) * w * 3); p += w * 3; }
  const idat = deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ═══════════ 主流程 ═══════════ */
const [, , INPUT, PREFIX, WARG, HARG] = process.argv;
const APPLY = process.argv.includes('--apply');
if (!INPUT) { console.error('用法: node _gen_portrait_small.mjs <in.png> [outPrefix] [w] [h] [--apply]'); process.exit(2); }
const DW = Number(WARG ?? 96), DH = Number(HARG ?? 128);

const src = readFileSync(INPUT);
const t0 = Date.now();
const img = decodePNG(src);
console.log(`源：${basename(INPUT)} ${img.w}×${img.h}（PNG colorType=${img.colorType}${img.hasAlpha ? ' 带 alpha' : ''}） ${(src.length / 1024).toFixed(0)} KB`);
const small = resize(img.rgb, img.w, img.h, DW, DH);
const jpg = encodeJPEG(small, DW, DH, 82);
const png = encodePNG(small, DW, DH);
console.log(`缩到 ${DW}×${DH}：JPEG ${(jpg.length / 1024).toFixed(1)} KB ｜ PNG ${(png.length / 1024).toFixed(1)} KB ｜ 耗时 ${Date.now() - t0} ms`);
console.log(`相对源 PNG 的压缩比：JPEG 1/${(src.length / jpg.length).toFixed(0)} ｜ PNG 1/${(src.length / png.length).toFixed(0)}`);

const prefix = PREFIX ?? join(dirname(INPUT), '.small-preview', basename(INPUT, extname(INPUT)));
const dir = dirname(prefix);
if (APPLY) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(prefix + '.jpg', jpg);
  writeFileSync(prefix + '.png', png);
  console.log(`已写出：${prefix}.jpg / ${prefix}.png`);
} else {
  console.log('（预演：未写文件；加 --apply 写出到 ' + prefix + '.{jpg,png}）');
}
