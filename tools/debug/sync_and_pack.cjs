const fs = require('fs');
const { execSync } = require('child_process');

const wbPath = '仙姝墮-世界书.json';
const cardPath = '仙姝墮-角色卡（全书群像）.json';

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
const p2 = fs.readFileSync('scratch/plot2_v4.txt', 'utf8');
const p3 = fs.readFileSync('scratch/plot3_v3.txt', 'utf8');

wb.entries[30].content = p2;
wb.entries[31].content = p3;
fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('1. Worldbook JSON updated: entry 30 and 31.');

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
const c_p2 = card.data.character_book.entries.find(e => e.comment && e.comment.includes('【剧情】二'));
const c_p3 = card.data.character_book.entries.find(e => e.comment && e.comment.includes('【剧情】三'));

if (c_p2) c_p2.content = p2;
if (c_p3) c_p3.content = p3;

fs.writeFileSync(cardPath, JSON.stringify(card, null, 2), 'utf8');
console.log('2. Character card JSON updated.');

try {
  const out = execSync('node _make_card_png.mjs --apply', { encoding: 'utf8' });
  console.log('3. PNG packaging output:\n' + out);
} catch (e) {
  console.error('PNG packaging error:', e.message);
}
