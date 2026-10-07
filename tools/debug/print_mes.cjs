const fs = require('fs');
const filePath = 'E:\\tavern\\SillyTavern\\data\\default-user\\chats\\仙姝墮 · 一张跑全书\\仙姝墮 · 一张跑全书 - 2026-10-03@16h38m58s.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());

[5, 7].forEach(idx => {
  const d = JSON.parse(lines[idx]);
  console.log(`\n================== 楼层 ${idx} (${d.name}) ==================`);
  console.log(d.mes);
});
