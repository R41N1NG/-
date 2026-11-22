const fs = require('fs');
const content = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 检索 .okh-hud-frame, .okh-cards-grid, .okh-member-card
const getRule = (selector) => {
  const s = content.indexOf(selector);
  if (s === -1) return null;
  const e = content.indexOf('}', s);
  return content.substring(s, e + 1);
};

console.log('--- hud-frame ---');
console.log(getRule('.okh-hud-frame {'));

console.log('--- cards-grid ---');
console.log(getRule('.okh-cards-grid {'));

console.log('--- member-card ---');
console.log(getRule('.okh-member-card {'));

console.log('--- body-head ---');
console.log(getRule('.okh-body-head {'));

console.log('--- state-slot ---');
console.log(getRule('.okh-state-slot {'));
