#!/usr/bin/env node
/**
 * _make_card_png.mjs —— 把刚构建的卡 JSON 封进 PNG（主人 2026-09-29 交代：做卡的图底沿用旧卡）
 *   结构照酒馆：图 + 两个 tEXt 块（关键字 `chara` 与 `ccv3`，载荷＝同一份卡 JSON 的 base64）
 *   tEXt 的数据格式＝ `关键字\0base64`；CRC32 按 PNG 标准算在 `类型+数据` 上。
 *   图底从旧卡 PNG 的 IDAT 原样搬运（不改一个像素）。
 * 用法：node _make_card_png.mjs [--apply]
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const APPLY = process.argv.includes('--apply');
const DIR = path.dirname(fileURLToPath(import.meta.url)) + path.sep;
const JSON_FILE = DIR + '仙姝墮-角色卡（全书群像）.json';
const OUT = DIR + '仙姝墮-角色卡（全书群像）.png';
const TEMPLATE = OUT + '.旧';   // 旧卡（首次运行会把现 PNG 备份成它）

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

if (!existsSync(OUT + '.旧')) copyFileSync(OUT, OUT + '.旧');
const old = readFileSync(OUT + '.旧');
console.log(`图底（旧卡）：${OUT}.旧  ${old.length} B`);

// 拆旧卡：留下除了 tEXt 之外的块（IHDR + IDAT + IEND）
const parts = [];
let p = 8;
while (p + 12 <= old.length) {
  const len = old.readUInt32BE(p);
  const type = old.toString('ascii', p + 4, p + 8);
  const whole = old.subarray(p, p + 12 + len);
  if (type !== 'tEXt') parts.push(whole);
  console.log(`  ${type} ${len} B${type === 'tEXt' ? '（丢弃，换成新的）' : '（保留）'}`);
  p += 12 + len;
  if (type === 'IEND') break;
}

const json = readFileSync(JSON_FILE, 'utf8');
JSON.parse(json);
const b64 = Buffer.from(json, 'utf8').toString('base64');
console.log(`\n新卡 JSON：${json.length} 字 → base64 ${b64.length} 字；世界书 ${JSON.parse(json).data.character_book.entries.length} 条`);

const t1 = chunk('tEXt', Buffer.from('chara\0' + b64, 'latin1'));
const t2 = chunk('tEXt', Buffer.from('ccv3\0' + b64, 'latin1'));
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parts[0], t1, t2, ...parts.slice(1)]);
console.log(`新 PNG：${png.length} B`);

// 自检：能不能再解回来
let q = 8, ok = 0;
while (q + 12 <= png.length) {
  const len = png.readUInt32BE(q); const type = png.toString('ascii', q + 4, q + 8);
  if (type === 'tEXt') {
    const d = png.subarray(q + 8, q + 8 + len);
    const nul = d.indexOf(0);
    const kw = d.subarray(0, nul).toString('latin1');
    const back = Buffer.from(d.subarray(nul + 1).toString('latin1'), 'base64').toString('utf8');
    console.log(`  自检 ${kw}：解回 ${back.length} 字，与原 JSON 一致=${back === json}，CRC 校验=${(crc32(png.subarray(q + 4, q + 8 + len)) >>> 0) === png.readUInt32BE(q + 8 + len)}`);
    ok += back === json ? 1 : 0;
  }
  q += 12 + len; if (type === 'IEND') break;
}
if (APPLY && ok === 2) {
  writeFileSync(OUT, png);
  writeFileSync(DIR + '仙姝堕.png', png);
  try {
    const latestCardDir = DIR + '最新角色卡\\';
    if (!existsSync(latestCardDir)) mkdirSync(latestCardDir, { recursive: true });
    writeFileSync(latestCardDir + '仙姝堕.png', png);
  } catch (e) {}
  try {
    const distDir = DIR + 'dist\\';
    if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
    writeFileSync(distDir + '仙姝堕.png', png);
  } catch (e) {}
  console.log(`\n✅ 已写盘 ${OUT} 与 ${DIR}仙姝堕.png 以及 最新角色卡\\仙姝堕.png`);
}
else console.log(APPLY ? '\n❌ 自检未过，未写盘' : '\n（预演，未写盘）');
