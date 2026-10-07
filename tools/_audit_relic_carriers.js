const fs = require('fs');

const totalTable = fs.readFileSync('archive/_旧文档（不作判据）/仙姝墮-名器效果总表.md', 'utf8');
const lines = totalTable.split('\n');
console.log('=== 名器效果总表中的名器与持有者 ===');
lines.forEach(line => {
  if (line.startsWith('|') && !line.includes('---') && !line.includes('作用') && !line.includes('持有者')) {
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      console.log(`器名: [${parts[0]}] -> 持有者: [${parts[1]}]`);
    }
  }
});
