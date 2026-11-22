const fs = require('fs');

const src = '预览_状态栏样式.html';
const dest = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

fs.copyFileSync(src, dest);
console.log(`Copied ${src} to ${dest}, size: ${fs.statSync(dest).size}`);
