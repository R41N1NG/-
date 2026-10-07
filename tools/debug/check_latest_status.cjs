const fs = require('fs');

const filePath = 'E:\\tavern\\SillyTavern\\data\\default-user\\chats\\仙姝墮 · 一张跑全书\\仙姝墮 · 一张跑全书 - 2026-10-03@17h00m28s.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());

console.log('Total messages in newest chat:', lines.length);

for (let i = Math.max(0, lines.length - 4); i < lines.length; i++) {
  const d = JSON.parse(lines[i]);
  const role = d.is_user ? 'USER' : (d.name || 'AI');
  console.log(`\n================== [楼层 ${i}] ${role} ==================`);
  console.log('正文尾部 500 字:');
  console.log(d.mes?.slice(-500) || '(空)');
  console.log('包含 Status_block:', d.mes?.includes('Status_block') || d.mes?.includes('status_block'));
  console.log('包含 status 标签:', d.mes?.includes('<status>') || d.mes?.includes('<Status>'));
}
