const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const cardsGridStart = html.indexOf('<div class="okh-cards-grid">');
const cardsGridEnd = html.indexOf('</details>', cardsGridStart);

console.log(html.substring(cardsGridStart, cardsGridEnd + 15));
