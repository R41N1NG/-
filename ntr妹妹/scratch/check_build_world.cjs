const fs = require('fs');
const code = fs.readFileSync('奥森德/src/app/okh_app_data.js', 'utf8');

const start = code.indexOf('function buildInitialWorld');
console.log('buildInitialWorld code:\n', code.substring(start, start + 3000));
