const fs = require('fs');

const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');

console.log('Style start:', styleStart, 'Style end:', styleEnd);
