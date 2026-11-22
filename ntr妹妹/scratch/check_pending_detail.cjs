const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const start = html.indexOf('<div class="okh-pending-section"');
console.log(html.substring(start + 3000, start + 5000));
