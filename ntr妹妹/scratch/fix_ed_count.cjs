const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

html = html.replace(/reward:\s*'ed_teach_count:\s*1'/g, "reward: '求生常识指导达成（1/3）'");
html = html.replace(/reward:\s*'ed_teach_count:\s*2'/g, "reward: '求生常识指导达成（2/3）'");

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Replaced ed_teach_count with human text');
