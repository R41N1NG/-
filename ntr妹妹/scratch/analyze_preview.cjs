const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const idx = html.indexOf('function openCharModal');
console.log(html.substring(idx + 1500, idx + 4000));
