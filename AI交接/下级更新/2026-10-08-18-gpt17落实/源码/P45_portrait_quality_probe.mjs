/**
 * P45_portrait_quality_probe.mjs —— 查清三个新增立绘（苏倾寒/慕容清歌/顾云舒）到底糊在哪。
 * 只读：本地图库文件像素尺寸 ＋ 卡内 xsd_assets(lightbox/panel) 的图片尺寸与 base64 体积 ＋ 灯箱取源优先级。
 */
import fs from 'node:fs';
import path from 'node:path';

const GAL = 'E:/tavern/SillyTavern/data/default-user/user/images/xsd_gallery';
const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const PANEL = 'E:/角色卡制作/仙姝堕/卡片脚本/状态栏面板.js';

/* ── 图片尺寸解析（PNG / JPEG / WebP）── */
function 尺寸(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) return { 格式: 'png', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const mk = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (mk >= 0xC0 && mk <= 0xCF && mk !== 0xC4 && mk !== 0xC8 && mk !== 0xCC) return { 格式: 'jpeg', h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
    return { 格式: 'jpeg', w: null, h: null };
  }
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const t = buf.toString('ascii', 12, 16);
    if (t === 'VP8X') return { 格式: 'webp', w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (t === 'VP8 ') return { 格式: 'webp', w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    return { 格式: 'webp', w: null, h: null };
  }
  return { 格式: '未知', w: null, h: null };
}
const dataUri尺寸 = (s) => {
  const m = /^data:image\/[a-z+]+;base64,(.+)$/.exec(String(s || ''));
  if (!m) return null;
  const b = Buffer.from(m[1], 'base64');
  return { ...尺寸(b), 字节: b.length, base64字符: m[1].length };
};

const 人 = [['苏倾寒', 'suqinghan'], ['慕容清歌', 'murongqingge'], ['顾云舒', 'guyunshu']];

console.log('══ ① 本地图库（酒馆 user/images/xsd_gallery）══');
for (const [名, py] of 人) {
  const hits = fs.readdirSync(GAL).filter((f) => f.startsWith(py + '.'));
  if (!hits.length) { console.log('  ✘ ' + 名 + '（' + py + '）：**本地没有文件**'); continue; }
  for (const f of hits) {
    const b = fs.readFileSync(path.join(GAL, f));
    const d = 尺寸(b);
    console.log('  · ' + 名 + '　' + f + '　' + (d.w || '?') + '×' + (d.h || '?') + '　' + (b.length / 1024).toFixed(0) + ' KB');
  }
}

console.log('\n══ ② 卡内 xsd_assets（灯箱/面板内嵌）══');
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const as = (card.data.extensions && card.data.extensions.xsd_assets) || {};
console.log('  xsd_assets 键：' + Object.keys(as).join('、'));
for (const ns of ['lightbox', 'panel']) {
  const box = as[ns];
  if (!box) continue;
  console.log('  【' + ns + '】' + (Array.isArray(box) ? '数组 ' + box.length + ' 项' : typeof box));
  const obj = Array.isArray(box) ? null : box;
  for (const [名, py] of 人) {
    let v = obj ? (obj[py] || obj[名]) : null;
    if (!v && Array.isArray(box)) v = box.find((x) => JSON.stringify(x).includes(py));
    if (!v) { console.log('    ✘ ' + 名 + '（' + py + '）：无'); continue; }
    const s = typeof v === 'string' ? v : (v.src || v.data || v.big || '');
    const d = dataUri尺寸(s);
    console.log('    · ' + 名 + '：' + (d ? d.格式 + ' ' + d.w + '×' + d.h + '　' + (d.字节 / 1024).toFixed(0) + ' KB（base64 ' + d.base64字符 + ' 字符）' : '（非 data URI：' + String(s).slice(0, 60) + '）'));
  }
}

console.log('\n══ ③ 灯箱取源优先级（面板生产件里的 xsdBigSourcesFor）══');
const panel = fs.readFileSync(PANEL, 'utf8');
const i = panel.indexOf('function xsdBigSourcesFor');
if (i < 0) console.log('  ✘ 找不到 xsdBigSourcesFor');
else {
  const 段 = panel.slice(i, i + 1500);
  console.log(段.split('\n').slice(0, 26).map((l) => '  ' + l.trim().slice(0, 150)).join('\n'));
}
