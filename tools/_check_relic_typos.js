const fs = require('fs');
const data = JSON.parse(fs.readFileSync('卡片脚本/_src/名器图鉴数据.json', 'utf8'));

for (const [id, r] of Object.entries(data)) {
  const str = JSON.stringify(r);
  ['花织凝', '苏轻涵', '陆金燕', '妙音菩萨', '柳含烟', '慕容清歌'].forEach(bad => {
    if (str.includes(bad)) {
      console.log('Found [', bad, '] in relic [', id, ']');
    }
  });
}
