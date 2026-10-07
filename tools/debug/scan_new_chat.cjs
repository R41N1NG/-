const fs = require('fs');
const file = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝墮 · 一张跑全书/仙姝墮 · 一张跑全书 - 2026-10-03@17h53m23s.jsonl';
const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim());

console.log('Total messages:', lines.length);

lines.forEach((l, idx) => {
  const d = JSON.parse(l);
  const role = d.is_user ? 'USER' : (d.name || 'AI');
  const mes = d.mes || '';
  const hasStatus = mes.includes('Status_block');
  const hasStatusLower = mes.toLowerCase().includes('status_block');
  const tail = mes.slice(-250).replace(/\n/g, ' ');
  console.log(`\n=== [#${idx}] ${role} (len: ${mes.length}) ===`);
  console.log(`hasStatus: ${hasStatus} | lower: ${hasStatusLower}`);
  console.log(`Tail snippet: ${tail}`);
});
