const fs = require('fs');
const content = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const frameStart = content.indexOf('<div class="okh-hud-frame">');
console.log(content.substring(frameStart, frameStart + 1800));
