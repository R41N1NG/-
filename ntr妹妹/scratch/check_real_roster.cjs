const fs = require('fs');
const code = fs.readFileSync('奥森德/src/app/okh_app_data.js', 'utf8');

const start = code.indexOf('const ROSTER = {');
const end = code.indexOf('function buildInitialWorld', start);

console.log('ROSTER length:', end - start);
console.log(code.substring(start, start + 3000));
