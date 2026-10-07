const fs = require('fs');
const wb = JSON.parse(fs.readFileSync('仙姝墮-世界书.json', 'utf8'));
const entries = Array.isArray(wb.entries) ? wb.entries : Object.values(wb.entries);
const plots = entries.filter(e => e.comment && e.comment.includes('【剧情】') && !e.comment.includes('共 15 条'));

plots.forEach((p, i) => {
  const lines = p.content.split('\n');
  const cond = lines[0].startsWith('@@if') ? lines[0] : (lines[1]?.startsWith('@@if') ? lines[1] : '无@@if');
  const timeLine = lines.find(l => l.includes('时点') || l.includes('仙盟历'));
  const kList = p.keys || (p.key ? [p.key] : []);
  console.log(`【${i+1}】${p.comment}`);
  console.log(`     激活宏条件: ${cond}`);
  console.log(`     触发关键字: [${kList.slice(0, 8).join(', ')}]`);
  console.log(`     时点/历法: ${timeLine ? timeLine.trim() : '未标明'}`);
  console.log(`     字数: ${p.content.length} 字`);
  console.log(`     条目启用状态: ${p.enabled}\n`);
});
