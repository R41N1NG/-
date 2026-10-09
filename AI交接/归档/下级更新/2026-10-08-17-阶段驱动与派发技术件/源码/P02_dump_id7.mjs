/**
 * P02_dump_id7.mjs —— 从成品卡原样导出 id7 正文（当前技术模板），并给出结构画像。
 * 另导出 id56 的「非成人/战争事实」片段与 id123 全文，供 gpt 核门控。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const BASE = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料';
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const entries = card.data.character_book.entries;
const get = (id) => entries.find((e) => e.id === id);

const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');

fs.mkdirSync(BASE, { recursive: true });

/* ── id7：整条正文原样落盘 ── */
const e7 = get(7);
const c7 = e7.content;
fs.writeFileSync(BASE + '/17a_id7原样正文.txt', c7, 'utf8');

const ejsTags = [...c7.matchAll(/<%-?[_=]?[\s\S]*?[_\-]?%>/g)].map((m) => m[0]);
const conds = [...c7.matchAll(/<%[\s\S]*?%>/g)].map((m) => m[0].replace(/\s+/g, ' ').trim());

const image7 = {
  来源: '最新角色卡/仙姝堕.json → data.character_book.entries[id=7]',
  条目标题: e7.comment,
  字段: {
    constant: e7.constant,
    enabled: e7.enabled,
    position: e7.position,
    insertion_order: e7.insertion_order,
    keys: e7.keys,
    position深度: e7.extensions.depth,
    prevent_recursion: e7.extensions.prevent_recursion,
    scan_depth: e7.extensions.scan_depth,
    probability: e7.extensions.probability,
  },
  正文字符数: c7.length,
  正文SHA256: sha(c7),
  含EJS标签数: ejsTags.length,
  EJS条件式清单: conds,
  含_Status_block: /<Status_block>/.test(c7),
  含现在时围城措辞: ['兽潮一波接一波', '围城数日', '一波接一波', '兵临城下'].filter((s) => c7.includes(s)),
};
fs.writeFileSync(BASE + '/17a_id7画像.json', JSON.stringify(image7, null, 2), 'utf8');

/* ── id56：只取非成人片段（时点/战争事实），成人照录段整体剔除 ── */
const e56 = get(56);
const c56 = e56.content;
const firstLine = c56.split('\n')[0];
const head = c56.slice(firstLine.length + 1);

/* 按小节切；凡标题含「温存/亲密/照录/原文」的小节整节剔除，只留时点与世界事实类 */
const sections = head.split(/\n(?=##\s)/).map((s) => ({ 标题: (s.match(/^##\s*(.+)/) || [, '(无标题)'])[1], 正文: s }));
const warSections = sections.filter((s) => /时点|局势|世界|背景|围城|战事|启程|南下|大势|占位/.test(s.标题));
const droppedSections = sections.filter((s) => !warSections.includes(s)).map((s) => ({ 标题: s.标题, 字符数: s.正文.length }));

const out56 = {
  条目标题: e56.comment,
  门控首行: firstLine,
  门控SHA256: sha(firstLine),
  contentSHA256: sha(c56),
  content字符数: c56.length,
  条目字段: {
    keys: e56.keys,
    constant: e56.constant,
    enabled: e56.enabled,
    position: e56.position,
    insertion_order: e56.insertion_order,
    depth: e56.extensions.depth,
    scan_depth: e56.extensions.scan_depth,
    prevent_recursion: e56.extensions.prevent_recursion,
  },
  小节清单: sections.map((s) => ({ 标题: s.标题, 字符数: s.正文.length })),
  已剔除小节: droppedSections,
  非成人片段: warSections.map((s) => s.正文).join('\n').slice(0, 4000),
};
fs.writeFileSync(BASE + '/17b_id56门控与非成人片段.json', JSON.stringify(out56, null, 2), 'utf8');

/* ── id123：全文（499 字符，人物设定本身，无成人正文） ── */
const e123 = get(123);
fs.writeFileSync(BASE + '/17c_id123全文与门控.json', JSON.stringify({
  条目标题: e123.comment,
  门控首行: ((e123.content.split('\n')[0] || '').match(/^@@if/) ? e123.content.split('\n')[0] : '（无 @@if 闸门）'),
  contentSHA256: sha(e123.content),
  content字符数: e123.content.length,
  条目字段: {
    keys: e123.keys,
    constant: e123.constant,
    enabled: e123.enabled,
    position: e123.position,
    insertion_order: e123.insertion_order,
    depth: e123.extensions.depth,
    prevent_recursion: e123.extensions.prevent_recursion,
  },
  含战争未来措辞: ['趁兽潮围困天溪城之机', '兽潮', '围困'].filter((s) => e123.content.includes(s)),
  全文: e123.content,
}, null, 2), 'utf8');

console.log(JSON.stringify({ id7: image7.正文字符数, id7SHA: image7.正文SHA256, id7含围城措辞: image7.含现在时围城措辞, id56片段字符: out56.非成人片段.length, id123字符: e123.content.length, 有闸门123: /^@@if/.test(e123.content.trim()) }, null, 1));
