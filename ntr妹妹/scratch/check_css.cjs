const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const idx = html.indexOf('.okh-soul-row');
console.log('okh-soul-row css idx:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 1000));
}
