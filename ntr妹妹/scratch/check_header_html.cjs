const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 查看顶部时间、地图、金币等渲染区域
const headerStart = html.indexOf('<header class="okh-crest-header">');
const cardsStart = html.indexOf('<div class="okh-cards-grid">');

console.log('Header region:\n', html.substring(headerStart, cardsStart));
