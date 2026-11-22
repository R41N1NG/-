const fs = require('fs');

const content = fs.readFileSync('预览_状态栏样式.html', 'utf8');
const detailsIdx = content.indexOf('<details class="okh-drawer-box"');
console.log(content.substring(detailsIdx, detailsIdx + 1200));
