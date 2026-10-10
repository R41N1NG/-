/**
 * P12_png_payload.mjs —— 按 gpt 05 §2.3 / §6 的要求做「PNG 载荷 ↔ 交付 JSON」一致性检查：
 *   · 从 PNG 里真实提取角色卡载荷（tEXt/iTXt 的 chara / ccv3），base64 解码；
 *   · 比字段、世界书条目 content/keys/配置与卡内脚本的**语义**（不看 PNG 与 JSON 的字节数相等）；
 *   · 同时给两边完整 SHA-256。
 * 只读，不改任何文件。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const PNG = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.png';
const JSONC = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17o_PNG载荷与JSON一致性.json';

const buf = fs.readFileSync(PNG);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

/* ── 解析 PNG chunk ── */
let p = 8;
const chunks = [];
while (p + 8 <= buf.length) {
  const len = buf.readUInt32BE(p);
  const type = buf.toString('latin1', p + 4, p + 8);
  const data = buf.subarray(p + 8, p + 8 + len);
  chunks.push({ type, len, data });
  p += 12 + len;
  if (type === 'IEND') break;
}
const textChunks = chunks.filter((c) => c.type === 'tEXt' || c.type === 'iTXt' || c.type === 'zTXt');

const found = {};
for (const c of textChunks) {
  let key = '', val = '';
  if (c.type === 'tEXt') {
    const z = c.data.indexOf(0);
    key = c.data.toString('latin1', 0, z);
    val = c.data.subarray(z + 1).toString('latin1');
  } else if (c.type === 'iTXt') {
    const z = c.data.indexOf(0);
    key = c.data.toString('latin1', 0, z);
    const rest = c.data.subarray(z + 1);
    const flags = rest[0], method = rest[1];
    let q = 2;
    const z2 = rest.indexOf(0, q); q = z2 + 1;
    const z3 = rest.indexOf(0, q); q = z3 + 1;
    let payload = rest.subarray(q);
    if (method === 0) { /* 无压缩 */ }
    else { try { payload = zlib.inflateSync(payload); } catch (e) { /* 原样 */ } }
    val = payload.toString('utf8');
  } else {
    const z = c.data.indexOf(0);
    key = c.data.toString('latin1', 0, z);
    const rest = c.data.subarray(z + 1);
    try { val = zlib.inflateSync(rest).toString('utf8'); } catch (e) { val = ''; }
  }
  found[key] = val;
}

const cardJson = JSON.parse(fs.readFileSync(JSONC, 'utf8'));
const decodeB64 = (s) => Buffer.from(String(s).replace(/\s+/g, ''), 'base64').toString('utf8');
const tryJson = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };

let payload = null, payload来源 = null, payloadRaw = null;
for (const k of Object.keys(found)) {
  const txt = found[k];
  for (const cand of [tryJson(decodeB64(txt)), tryJson(txt)]) {
    if (cand && (cand.data || cand.spec)) { payload = cand; payload来源 = k; payloadRaw = txt; break; }
  }
  if (payload) break;
}

const report = {
  PNG: { 路径: PNG, 字节: buf.length, sha256: sha(buf), chunk类型统计: chunks.reduce((a, c) => (a[c.type] = (a[c.type] || 0) + 1, a), {}), 文本chunk键: Object.keys(found) },
  JSON: { 路径: JSONC, 字节: fs.statSync(JSONC).size, sha256: sha(fs.readFileSync(JSONC)) },
  载荷: payload ? { 来源chunk: payload来源, 格式: payload.spec || '(chara v2)', 顶层键: Object.keys(payload), name: payload.name, spec: payload.spec, spec_version: payload.spec_version } : null,
};

if (payload) {
  const a = payload.data || {};
  const b = cardJson.data || {};
  const diffFields = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'character_book') continue;
    const va = JSON.stringify(a[k]) , vb = JSON.stringify(b[k]);
    if (va !== vb) diffFields.push({ 字段: k, 载荷字符数: (va || '').length, JSON字符数: (vb || '').length });
  }
  const ea = (a.character_book && a.character_book.entries) || [];
  const eb = (b.character_book && b.character_book.entries) || [];
  const byId = new Map(eb.map((e) => [e.id, e]));
  let 条目数一致 = ea.length === eb.length;
  let 配置不一致 = 0, 内容不一致 = 0;
  const 不一致明细 = [];
  for (const e of ea) {
    const o = byId.get(e.id);
    if (!o) { 不一致明细.push({ id: e.id, 问题: 'JSON 里没有这条' }); continue; }
    const keys = ['content', 'keys', 'secondary_keys', 'constant', 'selective', 'insertion_order', 'enabled', 'position', 'use_regex', 'prevent_recursion', 'exclude_recursion'];
    const bad = keys.filter((k) => JSON.stringify(e[k]) !== JSON.stringify(o[k]));
    if (bad.includes('content')) 内容不一致++;
    if (bad.length) { 配置不一致++; if (不一致明细.length < 10) 不一致明细.push({ id: e.id, 标题: e.comment, 不一致字段: bad }); }
  }
  report.世界书 = {
    载荷条目数: ea.length, JSON条目数: eb.length, 条目数一致,
    '有配置或内容不一致的条目数': 配置不一致, '其中content不一致条数': 内容不一致,
    不一致明细,
  };
  report.顶层字段差异 = diffFields;
  const scriptsA = (a.extensions && a.extensions.tavern_helper && a.extensions.tavern_helper.scripts) || [];
  const scriptsB = (b.extensions && b.extensions.tavern_helper && b.extensions.tavern_helper.scripts) || [];
  report.卡内脚本 = {
    载荷脚本数: scriptsA.length, JSON脚本数: scriptsB.length,
    逐条一致: JSON.stringify(scriptsA.map((s) => [s.name, (s.content || '').length, sha(Buffer.from(s.content || '', 'utf8'))]))
      === JSON.stringify(scriptsB.map((s) => [s.name, (s.content || '').length, sha(Buffer.from(s.content || '', 'utf8'))])),
    载荷脚本名: scriptsA.map((s) => s.name), JSON脚本名: scriptsB.map((s) => s.name),
  };
  const depthA = a.extensions && a.extensions.depth_prompt, depthB = b.extensions && b.extensions.depth_prompt;
  report.depth_prompt = { 一致: JSON.stringify(depthA) === JSON.stringify(depthB), 载荷字符数: depthA && depthA.prompt ? depthA.prompt.length : null, JSON字符数: depthB && depthB.prompt ? depthB.prompt.length : null, 载荷含Status_block: !!(depthA && depthA.prompt && depthA.prompt.includes('<Status_block>')), JSON含Status_block: !!(depthB && depthB.prompt && depthB.prompt.includes('<Status_block>')) };
}
fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({ 文本chunk键: report.PNG.文本chunk键, 载荷来源: report.载荷 && report.载荷.来源chunk, 顶层字段差异: report.顶层字段差异, 世界书: report.世界书 && { 载荷条目数: report.世界书.载荷条目数, JSON条目数: report.世界书.JSON条目数, 不一致条目数: report.世界书['有配置或内容不一致的条目数'], 内容不一致: report.世界书['其中content不一致条数'], 明细前3: report.世界书.不一致明细.slice(0, 3) }, 卡内脚本: report.卡内脚本 && { 一致: report.卡内脚本.逐条一致, 载荷: report.卡内脚本.载荷脚本名, JSON: report.卡内脚本.JSON脚本名 }, depth_prompt: report.depth_prompt }, null, 1));
