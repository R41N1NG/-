const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const modals = ['char-modal', 'map-modal', 'calendar-modal'];
modals.forEach(id => {
  const idx = html.indexOf(`id="${id}"`);
  console.log(`Modal #${id} found at:`, idx);
  if (idx !== -1) {
    console.log(html.substring(idx - 30, idx + 80));
    console.log('---');
  }
});
