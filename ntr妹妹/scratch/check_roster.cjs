const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const rosterStart = html.indexOf('const CHAR_ROSTER = {');
const rosterEnd = html.indexOf('function handleImgError', rosterStart);

console.log(html.substring(rosterStart + 2000, rosterEnd));
