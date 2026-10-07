const fs = require('fs');
const filePath = 'E:\\tavern\\SillyTavern\\data\\default-user\\chats\\仙姝墮 · 一张跑全书\\仙姝墮 · 一张跑全书 - 2026-10-03@17h00m28s.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());

lines.forEach((l, idx) => {
  const d = JSON.parse(l);
  const mes = d.mes || '';
  const hasStatus = mes.includes('Status_block') || mes.includes('status_block') || mes.includes('<status>');
  const hasSummary = mes.includes('<summary>');
  const role = d.is_user ? 'USER' : (d.name || 'AI');
  console.log(`[楼层 ${idx}] ${role}: Status_block=${hasStatus}, summary=${hasSummary}, length=${mes.length}`);
});
