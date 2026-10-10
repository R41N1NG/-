/**
 * P35_relic_stage_audit.mjs —— 只读：核对 13 件名器在**源**（src/mingqi-db.js）与**卡**（阶段条）里各有几个阶段，
 * 定位「北冥潮生穴／灵犀同心穴／玉虎噙香乳／烟霞灵乳」缺四阶段的根因：
 *   源里就没有？还是生成器/构建漏了？
 */
import fs from 'node:fs';

const db = fs.readFileSync('src/mingqi-db.js', 'utf8');
/* 按 `name: 'X'` 切块：到下一个顶层 `name: '` 为止 */
const 块 = (名) => {
  const i = db.indexOf(`name: '${名}'`);
  if (i < 0) return null;
  const j = db.indexOf("name: '", i + 10);
  return db.slice(i, j < 0 ? db.length : j);
};
const 卡 = JSON.parse(fs.readFileSync('最新角色卡/仙姝堕.json', 'utf8'));
const 卡阶段 = new Map();
const 卡简介 = new Map();
for (const e of 卡.data.character_book.entries) {
  let m = /^【名器·阶段】([^、]+)、([一二三四])阶段/.exec(e.comment || '');
  if (m) { if (!卡阶段.has(m[1])) 卡阶段.set(m[1], new Map()); 卡阶段.get(m[1]).set(m[2], e.content.length); }
  m = /^【名器·简介】(.+)$/.exec(e.comment || '');
  if (m) 卡简介.set(m[1].trim(), e.id);
}

const 名器 = ['九幽玄阴穴', '灼酒流炎穴', '心魔茶璎乳', '般若菩提菊', '北冥潮生穴', '灵犀同心穴', '玉虎噙香乳', '烟霞灵乳', '梅蕊穴', '冰魄剑心穴', '清歌弦鸣穴', '流焰叠薪穴', '凤凰羽花'];
console.log('名器'.padEnd(9) + '｜源阶段键'.padEnd(18) + '｜卡内阶段条'.padEnd(22) + '｜简介id｜判定');
let 缺 = [];
for (const 名 of 名器) {
  const b = 块(名);
  const 源键 = b ? [...b.matchAll(/'(一|二|三|四)阶段[^']*':/g)].map((m) => m[1]) : null;
  const 卡键 = 卡阶段.get(名) ? [...卡阶段.get(名).keys()] : [];
  const 判定 = !源键 ? '源里查不到该名器' : (源键.length === 4 && 卡键.length === 4) ? '齐全' : (源键.length < 4 ? `**源里就缺 ${4 - 源键.length} 个阶段**` : '源齐全但卡内缺 ⇒ 生成/构建漏');
  if (源键 && (源键.length < 4 || 卡键.length < 4)) 缺.push({ 名, 源键, 卡键, 判定 });
  console.log(名.padEnd(9) + '｜' + String(源键 ? 源键.join('') : '（无）').padEnd(16) + '｜' + String(卡键.join('')).padEnd(20) + '｜' + String(卡简介.get(名) ?? '-').padEnd(6) + '｜' + 判定);
}
console.log('\n卡内阶段条总数：' + [...卡阶段.values()].reduce((a, m) => a + m.size, 0) + '（13 件 × 4 = 52 才齐）');
console.log('缺口：' + (缺.length ? 缺.map((x) => x.名 + '(' + x.源键.length + '/4 源,' + x.卡键.length + '/4 卡)').join('、') : '无'));

/* 简介里怎么描述阶段？看这 4 件的简介是否只写到三阶段 */
console.log('\n这 4 件简介里的阶段措辞（抽「阶段／觉醒」字样一段）：');
for (const 名 of ['北冥潮生穴', '灵犀同心穴', '玉虎噙香乳', '烟霞灵乳']) {
  const e = 卡.data.character_book.entries.find((x) => (x.comment || '').trim() === `【名器·简介】${名}`);
  if (!e) { console.log('  ' + 名 + '：（找不到简介条）'); continue; }
  const 段 = (e.content.match(/[^\n]{0,80}(阶段|觉醒|第四)[^\n]{0,80}/g) || []).slice(0, 2);
  console.log('  ' + 名 + '：' + (段.length ? 段.join(' ／ ') : '（简介里没有阶段字样）'));
}
