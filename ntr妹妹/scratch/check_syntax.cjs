const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let m;
let count = 0;
while ((m = scriptRegex.exec(html)) !== null) {
  count++;
  try {
    new vm.Script(m[1]);
    console.log(`Script ${count} syntax OK`);
  } catch (err) {
    console.error(`Script ${count} syntax error:`, err);
    process.exit(1);
  }
}
