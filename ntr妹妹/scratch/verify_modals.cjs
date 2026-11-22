const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const tests = [
  { name: '稚子请托彻底清除', pass: !html.includes('稚子请托') },
  { name: '市井请托彻底清除', pass: !html.includes('市井请托') },
  { name: '遗孤幼子彻底清除', pass: !html.includes('遗孤幼子') },
  { name: '.okh-modal-overlay defined in CSS', pass: html.includes('.okh-modal-overlay') },
  { name: '.okh-map-overlay defined in CSS', pass: html.includes('.okh-map-overlay') },
  { name: 'position: fixed in overlay', pass: html.includes('position: fixed !important') },
  { name: 'display: none in overlay', pass: html.includes('display: none !important') }
];

let allPass = true;
tests.forEach(t => {
  console.log(`${t.pass ? '✅ PASS' : '❌ FAIL'}: ${t.name}`);
  if (!t.pass) allPass = false;
});

if (allPass) {
  console.log('\n🎉 All checks passed!');
} else {
  console.log('\n⚠️ Some checks failed');
  process.exit(1);
}
