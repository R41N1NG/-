const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const start = html.indexOf('待决事件');
const end = html.indexOf('</details>', start + 500);

console.log(html.substring(start - 100, end + 20));
