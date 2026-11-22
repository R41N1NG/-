const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const gulanCardStart = html.indexOf('<!-- 1. 古兰 -->');
const isnaCardStart = html.indexOf('<!-- 2. 伊丝娜 -->');
console.log('Gulan card:\n', html.substring(gulanCardStart, isnaCardStart));
