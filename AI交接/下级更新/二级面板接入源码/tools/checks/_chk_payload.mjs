#!/usr/bin/env node
/**
 * _chk_payload.mjs —— 交付物「PNG 载荷 ↔ JSON」语义一致性门禁（2026-10-08 新增）
 *
 * 为什么要有它：gpt 17 号 §4 点名 —— 我上一版的 P12 只比了**第一个能解析的载荷（chara）**，
 * 没比 `ccv3`、没逐项比 `entry.extensions` 等全配置、没比 id 集合与顺序、没看顶层重复字段，
 * 不能据此宣称「所有导入路径全一致」。这一版按语义把**每一个**载荷都比一遍。
 *
 * 比什么（逐项，任一不等即红）：
 *   · 顶层字段全量（name/description/personality/scenario/first_mes/mes_example/creatorcomment/
 *     avatar/talkativeness/fav/tags/spec/spec_version/create_date）
 *   · data 下除 character_book 以外的全部字段（含 extensions：depth_prompt／regex_scripts／
 *     tavern_helper.scripts 的 name+content 哈希）
 *   · character_book 条目：**条数、id 顺序与集合、逐条全字段深比**（content/keys/secondary_keys/
 *     constant/selective/insertion_order/enabled/position/use_regex/prevent_recursion/
 *     exclude_recursion/extensions 全部）
 *   · 顶层重复字段（同一键出现两次时 JSON.parse 会静默取后者 —— 这里用文本计数把它揪出来）
 *
 * 用法：node tools/checks/_chk_payload.mjs [--png <路径>] [--json <路径>]
 * 退出码：0＝全一致；1＝有不一致；2＝文件缺失
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const argv = process.argv;
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PNG = argOf('--png', path.join('最新角色卡', '仙姝堕.png'));
const JSONC = argOf('--json', path.join('最新角色卡', '仙姝堕.json'));
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');

if (!fs.existsSync(PNG) || !fs.existsSync(JSONC)) {
  console.error('❌ 交付物缺失：' + PNG + ' ／ ' + JSONC);
  process.exit(2);
}

const pngBuf = fs.readFileSync(PNG);
const cardRaw = fs.readFileSync(JSONC, 'utf8');
const card = JSON.parse(cardRaw);

/* ── 解析 PNG 文本块 ── */
let p = 8;
const chunks = [];
while (p + 8 <= pngBuf.length) {
  const len = pngBuf.readUInt32BE(p);
  const type = pngBuf.toString('latin1', p + 4, p + 8);
  chunks.push({ type, data: pngBuf.subarray(p + 8, p + 8 + len) });
  p += 12 + len;
  if (type === 'IEND') break;
}
const texts = [];
for (const c of chunks) {
  if (c.type === 'tEXt' || c.type === 'zTXt' || c.type === 'iTXt') {
    let key = '', val = '';
    if (c.type === 'tEXt') {
      const z = c.data.indexOf(0);
      key = c.data.toString('latin1', 0, z);
      val = c.data.subarray(z + 1).toString('latin1');
    } else if (c.type === 'zTXt') {
      const z = c.data.indexOf(0);
      key = c.data.toString('latin1', 0, z);
      try { val = zlib.inflateSync(c.data.subarray(z + 2)).toString('utf8'); } catch (e) { val = ''; }
    } else {
      const z = c.data.indexOf(0);
      key = c.data.toString('latin1', 0, z);
      const rest = c.data.subarray(z + 1);
      const compFlag = rest[0], compMethod = rest[1];
      let q = 2;
      q = rest.indexOf(0, q) + 1;
      q = rest.indexOf(0, q) + 1;
      let payload = rest.subarray(q);
      /* compression flag=1 才解压；method=0 是"压缩方法 zlib"，不代表未压缩 */
      if (compFlag === 1) { try { payload = zlib.inflateSync(payload); } catch (e) { /* 原样 */ } }
      val = payload.toString('utf8');
    }
    texts.push({ type: c.type, key, val });
  }
}

const 载荷 = [];
for (const t of texts) {
  const dec = Buffer.from(String(t.val).replace(/\s+/g, ''), 'base64').toString('utf8');
  let j = null;
  try { j = JSON.parse(dec); } catch (e) { j = null; }
  if (!j) { try { j = JSON.parse(t.val); } catch (e) { j = null; } }
  if (j && (j.data || j.spec)) 载荷.push({ key: t.key, type: t.type, json: j, 字符: dec.length });
}

const fails = [];
const notes = [];
const ck = (ok, msg) => { if (!ok) fails.push(msg); };

/* ── 顶层重复字段检测（文本层） ── */
{
  const keys = [...cardRaw.matchAll(/^\s{2}"([A-Za-z_]+)"\s*:/gm)].map((m) => m[1]);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  ck(dup.length === 0, 'JSON 顶层出现重复字段：' + [...new Set(dup)].join('、'));
}

/* ── 每个载荷逐项比 ── */
const 顶层键 = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creatorcomment', 'avatar', 'talkativeness', 'fav', 'tags', 'spec', 'spec_version', 'create_date'];
for (const L of 载荷) {
  const a = L.json, b = card;
  const tag = '载荷[' + L.key + '/' + L.type + ']';
  for (const k of 顶层键) ck(JSON.stringify(a[k]) === JSON.stringify(b[k]), tag + ' 顶层字段不一致：' + k);
  const da = a.data || {}, db = b.data || {};
  for (const k of new Set([...Object.keys(da), ...Object.keys(db)])) {
    if (k === 'character_book') continue;
    ck(JSON.stringify(da[k]) === JSON.stringify(db[k]), tag + ' data.' + k + ' 不一致');
  }
  const ea = (da.character_book && da.character_book.entries) || [];
  const eb = (db.character_book && db.character_book.entries) || [];
  ck(ea.length === eb.length, tag + ' 条目数不一致：载荷 ' + ea.length + ' / JSON ' + eb.length);
  ck(JSON.stringify(ea.map((e) => e.id)) === JSON.stringify(eb.map((e) => e.id)), tag + ' 条目 id 顺序或集合不一致');
  ck(JSON.stringify(da.character_book && da.character_book.name) === JSON.stringify(db.character_book && db.character_book.name), tag + ' character_book.name 不一致');
  let 逐条差异 = 0;
  for (let i = 0; i < Math.min(ea.length, eb.length); i++) {
    const keys = new Set([...Object.keys(ea[i]), ...Object.keys(eb[i])]);
    for (const k of keys) {
      if (JSON.stringify(ea[i][k]) !== JSON.stringify(eb[i][k])) {
        逐条差异++;
        if (逐条差异 <= 5) fails.push(tag + ' 第 ' + i + ' 条（id=' + ea[i].id + '）字段 ' + k + ' 不一致');
      }
    }
  }
  ck(逐条差异 === 0, tag + ' 共 ' + 逐条差异 + ' 处条目字段不一致');
  const sa = (da.extensions && da.extensions.tavern_helper && da.extensions.tavern_helper.scripts) || [];
  const sb = (db.extensions && db.extensions.tavern_helper && db.extensions.tavern_helper.scripts) || [];
  ck(sa.length === sb.length, tag + ' 卡内脚本件数不一致');
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    ck(sa[i].name === sb[i].name && sha(sa[i].content || '') === sha(sb[i].content || ''), tag + ' 卡内脚本[' + i + '] 不一致：' + sa[i].name);
  }
  const pa = (da.extensions && da.extensions.depth_prompt && da.extensions.depth_prompt.prompt) || '';
  const pb = (db.extensions && db.extensions.depth_prompt && db.extensions.depth_prompt.prompt) || '';
  ck(pa === pb, tag + ' depth_prompt 不一致');
  ck(pa.includes('<Status_block>'), tag + ' depth_prompt 缺 <Status_block>（铁律 8）');
  notes.push(tag + '：条目 ' + ea.length + ' ｜ 脚本 ' + sa.length + ' ｜ depth_prompt ' + pa.length + ' 字符');
}

ck(载荷.length > 0, 'PNG 里没有可解析的角色卡载荷');
const keys = texts.map((t) => t.key);
if (!keys.includes('ccv3')) notes.push('提示：本 PNG 没有 ccv3 块（只有 ' + keys.join('/') + '）');

console.log('PNG：' + PNG + '（' + pngBuf.length + ' 字节，SHA ' + crypto.createHash('sha256').update(pngBuf).digest('hex').slice(0, 16) + '）');
console.log('JSON：' + JSONC + '（' + Buffer.byteLength(cardRaw, 'utf8') + ' 字节，SHA ' + sha(cardRaw).slice(0, 16) + '）');
console.log('文本块：' + texts.map((t) => t.type + ':' + t.key).join('、'));
for (const n of notes) console.log('  · ' + n);
if (fails.length) {
  console.log('\n✘ PNG 载荷与交付 JSON 存在不一致：');
  for (const f of fails.slice(0, 30)) console.log('  ✘ ' + f);
  if (fails.length > 30) console.log('  ……共 ' + fails.length + ' 处');
  process.exit(1);
}
console.log('\n✔ 全部载荷与交付 JSON 逐项一致（顶层／data／条目全字段／id 顺序／脚本／depth_prompt）');
