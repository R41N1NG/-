import fs from 'fs';

const wbPath = '仙姝墮-世界书.json';
const cardPath = '仙姝墮-角色卡（全书群像）.json';

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
const p2 = fs.readFileSync('scratch/plot2_v4.txt', 'utf8');
const p3 = fs.readFileSync('scratch/plot3_v3.txt', 'utf8');

console.log('WB Entry 30 before:', wb.entries[30].comment);
console.log('WB Entry 31 before:', wb.entries[31].comment);

wb.entries[30].content = p2;
wb.entries[31].content = p3;
fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('仙姝墮-世界书.json updated.');

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
const c_p2 = card.data.character_book.entries.find(e => e.comment && e.comment.includes('【剧情】二'));
const c_p3 = card.data.character_book.entries.find(e => e.comment && e.comment.includes('【剧情】三'));

if (c_p2) {
  c_p2.content = p2;
  console.log('Card Entry 2 updated:', c_p2.comment);
}
if (c_p3) {
  c_p3.content = p3;
  console.log('Card Entry 3 updated:', c_p3.comment);
}

fs.writeFileSync(cardPath, JSON.stringify(card, null, 2), 'utf8');
console.log('仙姝墮-角色卡（全书群像）.json updated.');
