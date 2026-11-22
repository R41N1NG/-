const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const sIdx = html.indexOf('function openCharModal');
const eIdx = html.indexOf('function closeCharModal', sIdx);
console.log('openCharModal code:\n', html.substring(sIdx, eIdx));
