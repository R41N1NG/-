const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const start = html.indexOf('<!-- 5. 爱德');
const end = html.indexOf('<!-- ============================================================', start);

console.log(html.substring(start, end));
