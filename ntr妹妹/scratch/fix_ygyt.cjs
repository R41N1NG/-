const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

html = html.replace(/银月珠宝铺遗孤幼子爱德/g, '银月珠宝铺学徒爱德');
html = html.replace(/护送遗孤进城差事/g, '护送爱德进城差事');

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Replaced 遗孤幼子 in calendar data');
