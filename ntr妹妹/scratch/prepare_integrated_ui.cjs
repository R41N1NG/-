const fs = require('fs');

// 读取当前 HTML
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

console.log('HTML size:', html.length);
