const fs = require('fs');
const content = fs.readFileSync('预览_状态栏样式.html', 'utf8');
console.log('length:', content.length);
console.log('First 500 chars:');
console.log(content.substring(0, 500));
console.log('Last 500 chars:');
console.log(content.substring(content.length - 500));
