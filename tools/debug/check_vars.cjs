const fs = require('fs');
const filePath = 'E:\\tavern\\SillyTavern\\data\\default-user\\chats\\仙姝墮 · 一张跑全书\\仙姝墮 · 一张跑全书 - 2026-10-03@16h38m58s.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());

lines.forEach((l, idx) => {
  const d = JSON.parse(l);
  console.log(`--- 楼层 ${idx} ---`);
  if (d.extra && d.extra.variables) {
    const v = d.extra.variables;
    console.log('stat_data.身份:', v.stat_data?.身份);
    console.log('stat_data.段位:', v.stat_data?.段位);
    console.log('stat_data.仙盟历:', v.stat_data?.仙盟历);
    console.log('stat_data.时间:', v.stat_data?.时间);
    console.log('stat_data.进度:', v.stat_data?.进度);
    console.log('stat_data.实际发生:', v.stat_data?.实际发生);
  } else {
    console.log('无 extra.variables');
  }
});
