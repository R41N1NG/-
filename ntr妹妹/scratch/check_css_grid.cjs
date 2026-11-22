const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 搜索 .okh-cards-grid
const gridIdx = html.indexOf('.okh-cards-grid');
console.log('gridIdx:', gridIdx);
if (gridIdx !== -1) {
  console.log(html.substring(gridIdx - 100, gridIdx + 1500));
}
