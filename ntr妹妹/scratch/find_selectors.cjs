const fs = require('fs');
const content = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const selectors = ['.okh-cards-grid', '.okh-member-card', '.okh-body-head', '.okh-card-body', '.okh-top-bar'];
selectors.forEach(sel => {
  const idx = content.indexOf(sel);
  console.log(sel, idx);
});
