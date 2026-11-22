const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const css = html.substring(styleStart, styleEnd);

const selectors = [];
const lines = css.split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('.') && (trimmed.endsWith('{') || trimmed.includes('{'))) {
    selectors.push(trimmed.split('{')[0].trim());
  }
}

console.log('Total class selectors in style:', selectors.length);
console.log('All class selectors:');
console.log(selectors.join('\n'));
