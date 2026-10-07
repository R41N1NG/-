const fs = require('fs');

const file = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝墮 · 一张跑全书/仙姝墮 · 一张跑全书 - 2026-10-03@17h00m28s.jsonl';
const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim());

const start = parseInt(process.argv[2] || '0', 10);
const end = parseInt(process.argv[3] || '3', 10);

for (let idx = start; idx <= end && idx < lines.length; idx++) {
  const d = JSON.parse(lines[idx]);
  const role = d.is_user ? 'USER' : (d.name || 'AI');
  const mes = d.mes || '';
  const vars = d.extra && d.extra.variables ? d.extra.variables : null;
  console.log(`\n======================================================`);
  console.log(`MESSAGE #${idx} | ROLE: ${role} | LEN: ${mes.length}`);
  if (vars) {
    console.log(`VARS: stat_data=${JSON.stringify(vars.stat_data || {})}`);
  } else {
    console.log(`VARS: none`);
  }
  console.log(`------------------------------------------------------`);
  console.log(mes);
}
