const fs = require('fs');
const data = JSON.parse(fs.readFileSync('卡片脚本/_src/名器图鉴数据.json', 'utf8'));

let out = '';
const list = Object.entries(data);

list.forEach(([id, r], idx) => {
  out += `\n### 【${idx + 1}】${r.name}（${id}）\n`;
  out += `- **载体宿主**：${r.carrier}\n`;
  out += `- **名器类型**：${r.type}\n`;
  out += `- **古籍传闻（未觉醒简介）**：${r.brief}\n`;
  out += `\n**【阶段境界明细】**：\n`;
  
  const stages = Object.entries(r.stages || {});
  stages.forEach(([sKey, sObj]) => {
    out += `\n#### 第 ${sKey} 阶段 · ${sObj.name}\n`;
    out += `- **玄妙体征描述**：${sObj.desc}\n`;
    out += `- **解锁机缘**：${sObj.lock || '随天道气运与双修火候突破'}\n`;
  });
  out += `\n---\n`;
});

fs.writeFileSync('tools/_relics_full_dump.md', out, 'utf8');
console.log('Successfully wrote to tools/_relics_full_dump.md, total length:', out.length);
