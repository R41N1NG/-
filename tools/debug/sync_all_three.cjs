const fs = require('fs');
const { execSync } = require('child_process');

const wbPath = '仙姝墮-世界书.json';
const cardPath = '仙姝墮-角色卡（全书群像）.json';

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
const p1 = fs.readFileSync('scratch/plot1_v2.txt', 'utf8');
const p2 = fs.readFileSync('scratch/plot2_v5.txt', 'utf8');
const p3 = fs.readFileSync('scratch/plot3_v5.txt', 'utf8');

// Worldbook entries
wb.entries[29].content = p1;
wb.entries[30].content = p2;
wb.entries[31].content = p3;
fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('1. Worldbook updated: entries 29, 30, 31.');

// Character card entries
const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
const entries = card.data.character_book.entries;
const c_p1 = entries.find(e => e.comment && e.comment.includes('【剧情】一'));
const c_p2 = entries.find(e => e.comment && e.comment.includes('【剧情】二'));
const c_p3 = entries.find(e => e.comment && e.comment.includes('【剧情】三'));

if (c_p1) c_p1.content = p1;
if (c_p2) c_p2.content = p2;
if (c_p3) c_p3.content = p3;

fs.writeFileSync(cardPath, JSON.stringify(card, null, 2), 'utf8');
console.log('2. Character card JSON updated: entries 1, 2, 3.');

try {
  const out = execSync('& "C:\\Program Files\\nodejs\\node.exe" _make_card_png.mjs --apply', {
    shell: 'powershell.exe',
    encoding: 'utf8'
  });
  console.log('3. Card PNG packaged:\n' + out);
} catch (e) {
  console.error('Packaging error:', e.message);
}
