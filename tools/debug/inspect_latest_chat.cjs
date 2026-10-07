const fs = require('fs');

const file = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝墮 · 一张跑全书/仙姝墮 · 一张跑全书 - 2026-10-03@17h00m28s.jsonl';
if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim());
console.log('Total messages:', lines.length);

lines.forEach((l, idx) => {
  try {
    const d = JSON.parse(l);
    const role = d.is_user ? 'USER' : (d.name || 'AI');
    const mes = d.mes || '';
    const vars = d.extra && d.extra.variables ? JSON.stringify(d.extra.variables) : 'none';
    console.log(`=== [#${idx}] Role: ${role} | Length: ${mes.length} ===`);
    console.log(`Variables: ${vars}`);
    console.log(`Preview: ${mes.slice(0, 300).replace(/\n/g, ' ')}\n`);
  } catch (err) {
    console.error(`Line ${idx} parse error:`, err.message);
  }
});
