/**
 * P00_probe.mjs —— 只读取证：摸清成品卡条目结构，定位 id7 / id56 / id123
 * 以「现在的新卡」为准（主人 2026-10-08 裁定），不读 references 源。
 * 输出写文件，避免控制台编码干扰。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/P00_probe.json';

const raw = fs.readFileSync(CARD, 'utf8');
const card = JSON.parse(raw);
const d = card.data || {};
const book = d.character_book || {};
const entries = book.entries || [];

const out = {
  卡: {
    路径: CARD,
    字节: Buffer.byteLength(raw, 'utf8'),
    sha256: crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex'),
    顶层键: Object.keys(card),
    data键: Object.keys(d),
    条目数: entries.length,
  },
  条目字段样本: entries[0] ? Object.keys(entries[0]) : null,
  extensions键: d.extensions ? Object.keys(d.extensions) : null,
  条目: {},
};

for (const id of [7, 56, 123]) {
  const e = entries.find((x) => x.id === id);
  if (!e) { out.条目['id' + id] = null; continue; }
  const c = e.content || '';
  out.条目['id' + id] = {
    id: e.id,
    comment: e.comment,
    keys: e.keys,
    secondary_keys: e.secondary_keys,
    constant: e.constant,
    enabled: e.enabled,
    position: e.position,
    insertion_order: e.insertion_order,
    extensions: e.extensions,
    content长度: c.length,
    contentSha256: crypto.createHash('sha256').update(Buffer.from(c, 'utf8')).digest('hex'),
    content头400: c.slice(0, 400),
  };
}

/* id 全表（只取号与标题、是否常驻、是否启用），供 gpt 核「全部入口」 */
out.id全表 = entries.map((e) => ({
  id: e.id,
  comment: e.comment,
  constant: !!e.constant,
  enabled: e.enabled !== false,
  keys数: (e.keys || []).length,
  有闸门首行: /^@@if/.test((e.content || '').trim()),
  content长度: (e.content || '').length,
}));

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('OK ' + OUT);
