/**
 * P11_id_uid_map.mjs —— 按 gpt 02 号 §本批台账需要更正 第64行要求：
 *   导出保留**真实 id/uid 及 world 绑定、唯一映射**，不按 comment 或数组顺序猜宿主编号。
 * 做法：读成品卡（卡内 id）与酒馆世界书（uid）两份，逐条配对并给出唯一映射与差异。
 * 只读，不改酒馆那份。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const WORLD = 'E:/tavern/SillyTavern/data/default-user/worlds/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17n_卡内id与酒馆uid映射.json';

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const cardEs = card.data.character_book.entries;
const wRaw = fs.readFileSync(WORLD, 'utf8');
const w = JSON.parse(wRaw);
const wEntries = (w.entries && !Array.isArray(w.entries)) ? Object.values(w.entries) : (w.entries || []);

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/* 酒馆 uid 可能在 e.uid，也可能就是 entries 的键 */
const wList = (Array.isArray(w.entries) ? w.entries.map((e, i) => ({ uid: e.uid ?? i, ...e })) : wEntries.map((e) => ({ uid: e.uid, ...e })));

const byComment = new Map();
for (const e of cardEs) byComment.set(norm(e.comment), e);

const rows = wList.map((e) => {
  const c = norm(e.comment);
  const cardE = byComment.get(c);
  return {
    酒馆uid: e.uid,
    标题: c,
    卡内id: cardE ? cardE.id : null,
    同名唯一: (cardEs.filter((x) => norm(x.comment) === c).length === 1),
    酒馆content字符数: (e.content || '').length,
    卡内content字符数: cardE ? (cardE.content || '').length : null,
    内容逐字一致: cardE ? ((e.content || '') === (cardE.content || '')) : null,
    酒馆enabled: e.disable === true ? false : (e.enabled !== false),
    卡内在册: cardE ? cardE.enabled !== false : null,
    酒馆constant: !!e.constant,
    卡内constant: cardE ? !!cardE.constant : null,
  };
});

const out = {
  卡: { 路径: CARD, sha256: crypto.createHash('sha256').update(fs.readFileSync(CARD)).digest('hex'), 条目数: cardEs.length },
  酒馆世界书: { 路径: WORLD, sha256: crypto.createHash('sha256').update(Buffer.from(wRaw, 'utf8')).digest('hex'), 条目数: wList.length, 文件字节: fs.statSync(WORLD).size },
  统计: {
    两端条目数一致: cardEs.length === wList.length,
    标题能对上的: rows.filter((r) => r.卡内id !== null).length,
    标题对不上的: rows.filter((r) => r.卡内id === null).length,
    内容逐字一致: rows.filter((r) => r.内容逐字一致 === true).length,
    内容不一致: rows.filter((r) => r.内容逐字一致 === false).length,
    常量位不一致: rows.filter((r) => r.卡内id !== null && r.卡内constant !== r.酒馆constant).length,
    启用位不一致: rows.filter((r) => r.卡内id !== null && r.卡内在册 !== r.酒馆enabled).length,
    'uid与卡内id同号': rows.filter((r) => r.卡内id !== null && Number(r.酒馆uid) === Number(r.卡内id)).length,
  },
  映射: rows,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out.统计, null, 1));
const bad = rows.filter((r) => r.卡内id === null || r.内容逐字一致 === false).slice(0, 12);
if (bad.length) { console.log('=== 前 12 条不一致 ==='); for (const b of bad) console.log(JSON.stringify({ uid: b.酒馆uid, 标题: b.标题, 卡内id: b.卡内id, 逐字一致: b.内容逐字一致, 酒馆字符: b.酒馆content字符数, 卡内字符: b.卡内content字符数 })); }
