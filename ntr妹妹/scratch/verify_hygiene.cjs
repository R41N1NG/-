const fs = require('fs');

const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const checks = [
  { name: '心相底模', pass: !html.includes('心相底模') },
  { name: '心相：', pass: !html.includes('心相：') },
  { name: 'blood_density', pass: !html.includes('blood_density') },
  { name: 'gold_desire', pass: !html.includes('gold_desire') },
  { name: 'ed_teach_count', pass: !html.includes('ed_teach_count') },
  { name: 'okh-cards-grid defined in CSS', pass: html.includes('.okh-cards-grid {') },
  { name: 'okh-member-card defined in CSS', pass: html.includes('.okh-member-card {') },
  { name: 'okh-soul-row defined in CSS', pass: html.includes('.okh-soul-row {') },
  { name: '爱德横跨卡片 ed-card grid-column', pass: html.includes('grid-column: 1 / -1') }
];

let allPass = true;
checks.forEach(c => {
  console.log(`${c.pass ? '✅ PASS' : '❌ FAIL'}: ${c.name}`);
  if (!c.pass) allPass = false;
});

if (allPass) {
  console.log('\n🎉 All visual & text hygiene checks passed!');
} else {
  console.log('\n⚠️ Some checks failed!');
  process.exit(1);
}
