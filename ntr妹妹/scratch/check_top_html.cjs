const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const start = html.indexOf('<!-- 一、顶层常驻条');
const end = html.indexOf('<!-- 二、小队羁绊与状态抽屉', start);

console.log(html.substring(start, end));
