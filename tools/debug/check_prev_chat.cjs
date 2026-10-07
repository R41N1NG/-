const fs = require('fs');
const filePath = 'E:\\tavern\\SillyTavern\\data\\default-user\\chats\\仙姝墮 · 一张跑全书\\仙姝墮 · 一张跑全书 - 2026-10-03@16h38m58s.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());

lines.forEach((l, idx) => {
  const d = JSON.parse(l);
  const mes = d.mes || '';
  const hasStatus = mes.includes('Status_block') || mes.includes('status_block') || mes.includes('<status>');
  const role = d.is_user ? 'USER' : (d.name || 'AI');
  console.log(`[前一次测试 楼层 ${idx}] ${role}: Status_block=${hasStatus}`);
});
