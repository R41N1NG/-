const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const classes = [
  'okh-top-bar',
  'okh-bar-left',
  'okh-bar-right',
  'okh-dial-plate',
  'okh-dial-text',
  'okh-dial-time',
  'okh-dial-cal-hint',
  'okh-loc-plate',
  'okh-wealth-box',
  'okh-map-btn',
  'okh-presence-row',
  'okh-presence-tag',
  'okh-presence-title'
];

classes.forEach(cls => {
  const has = html.includes(`.${cls}`);
  console.log(`${has ? '✅' : '❌'} .${cls}`);
});
