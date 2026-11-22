const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const modalStart = html.indexOf('<div id="char-modal"');
const modalEnd = html.indexOf('<!-- ============================================================', modalStart);

console.log(html.substring(modalStart, modalEnd));
