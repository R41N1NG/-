const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const overlays = [
  'okh-modal-overlay',
  'okh-map-overlay',
  'okh-calendar-box',
  'okh-calendar-overlay'
];

overlays.forEach(cls => {
  const cssIdx = html.indexOf(`.${cls}`);
  console.log(`.${cls}: in CSS? ${cssIdx !== -1}`);
  if (cssIdx !== -1) {
    console.log(html.substring(cssIdx, cssIdx + 200));
    console.log('---');
  }
});
