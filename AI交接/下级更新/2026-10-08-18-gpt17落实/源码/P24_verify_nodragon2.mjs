/**
 * P24_verify_nodragon2.mjs —— 复核（v2，判据按**条目归属**判，不靠窗口里是否出现名字）：
 *   凡 comment 含「九幽玄阴」的条目、以及九幽玄阴相关的名器/阶段条与卡内脚本，
 *   只要出现「需要型」表述（唯有…方能／须依赖…方能／必须…／龙气贯体／方能引爆／方能引动…）即算残留。
 *   另把「龙气」其他出现位置分类列出：现象/意象（保留）、别的事项（不该动）。
 */
import fs from 'node:fs';

const CARD = 'E:/角色卡制作/仙姝堕/_staging_2026-10-08-18/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18t_候选卡龙气清点.json';

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;
const scripts = (card.data.extensions.tavern_helper && card.data.extensions.tavern_helper.scripts) || [];

const 需要型 = /(唯有[^，。；]{0,10}(龙气|真龙)[^，。；]{0,10}(方能|才能|才可)|须依赖[^，。；]{0,8}(龙气|同源)|必须[^，。；]{0,8}龙气|龙气贯体|方能引爆|方能引动|非至阳真龙之息贯顶)/;
const 相关条 = /九幽玄阴/;

const rows = [];
const scan = (来源, 是相关条, text) => {
  const s = String(text || '');
  let i = s.indexOf('龙气');
  while (i >= 0) {
    const 窗 = s.slice(Math.max(0, i - 70), i + 70).replace(/\s+/g, ' ');
    const 需 = 需要型.test(窗);
    let 类;
    if (是相关条 && 需) 类 = '★需要型残留（应为 0）';
    else if (是相关条) 类 = '相关条内的现象/意象（保留，待主人裁）';
    else if (需) 类 = '别条里提到龙气（多数是功法/皇朝，保留）';
    else 类 = '别的事项（不该动）';
    rows.push({ 来源, 是相关条, 类, 上下文: 窗 });
    i = s.indexOf('龙气', i + 1);
  }
};

for (const e of es) scan('id' + e.id + ' ' + e.comment, 相关条.test(e.comment || ''), e.content);
for (const sc of scripts) scan('脚本·' + sc.name, /状态状态/.test(sc.name), sc.content);

const 残留 = rows.filter((r) => r.类.indexOf('★') === 0);
const out = {
  候选卡: CARD, 字节: fs.statSync(CARD).size,
  '龙气出现总处数': rows.length,
  '需要型残留（应为 0）': 残留.length,
  分类统计: rows.reduce((a, x) => (a[x.类] = (a[x.类] || 0) + 1, a), {}),
  残留明细: 残留,
  相关条内保留项: rows.filter((r) => r.类.indexOf('相关条内的现象') === 0),
  全部: rows,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('候选卡 ' + out.字节 + ' 字节｜「龙气」共 ' + rows.length + ' 处｜需要型残留 ' + 残留.length);
for (const [k, v] of Object.entries(out.分类统计)) console.log('  ' + v + ' 处 — ' + k);
if (残留.length) { console.log('残留：'); for (const r of 残留) console.log('  ✘ ' + r.来源 + '：…' + r.上下文 + '…'); }
console.log('\n九幽玄阴相关条内**保留**的龙气（现象/意象）：');
for (const r of out.相关条内保留项) console.log('  · ' + r.来源 + '：…' + r.上下文.slice(0, 90) + '…');
process.exit(残留.length ? 1 : 0);
