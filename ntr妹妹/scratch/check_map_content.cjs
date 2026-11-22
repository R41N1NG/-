const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const mapStart = html.indexOf('<div id="map-modal"');
const mapEnd = html.indexOf('<!-- ============================================================', mapStart);

console.log(html.substring(mapStart, mapEnd));
