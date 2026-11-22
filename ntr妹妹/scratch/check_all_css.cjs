const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const classes = [
  'okh-hud-frame',
  'okh-top-bar',
  'okh-dial-plate',
  'okh-map-btn',
  'okh-presence-row',
  'okh-cards-grid',
  'okh-member-card',
  'okh-portrait-slot',
  'okh-body-head',
  'okh-bond-metric',
  'okh-gauge-track',
  'okh-gauge-fill',
  'okh-state-slot',
  'okh-soul-row',
  'okh-action-row',
  'okh-pending-section',
  'okh-wax-seal-img',
  'okh-event-card',
  'okh-modal-box'
];

classes.forEach(cls => {
  const has = html.includes(`.${cls}`);
  console.log(`${has ? '✅' : '❌'} .${cls}`);
});
