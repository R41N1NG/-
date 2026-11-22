const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const cardsContainerStart = html.indexOf('<!-- 4. 奥萝拉 -->');
console.log(html.substring(cardsContainerStart, cardsContainerStart + 3500));
