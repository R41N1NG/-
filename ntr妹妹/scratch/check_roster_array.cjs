const fs = require('fs');
const code = fs.readFileSync('奥森德/src/app/okh_app_data.js', 'utf8');

const end = code.indexOf('function buildInitialWorld');
const start = code.lastIndexOf('const ROSTER = [', end);
console.log('ROSTER array:\n', code.substring(start, end));
