const fs = require('fs');

const filePath = 'E:\\tavern\\SillyTavern\\data\\default-user\\chats\\仙姝墮 · 一张跑全书\\仙姝墮 · 一张跑全书 - 2026-10-03@16h38m58s.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());

console.log('Total messages:', lines.length);

lines.forEach((l, idx) => {
  try {
    const d = JSON.parse(l);
    const role = d.is_user ? 'USER' : (d.name || 'AI');
    const textSnippet = (d.mes || '').slice(0, 200).replace(/\n/g, ' ');
    console.log(`\n=== [楼层 ${idx}] ${role} ===`);
    console.log(`正文预览: ${textSnippet}`);
    if (d.extra) {
      if (d.extra.variables) {
        console.log('variables:', JSON.stringify(d.extra.variables));
      }
    }
  } catch (e) {
    console.error('Error line', idx, e.message);
  }
});
