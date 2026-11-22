const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

let pos = 0;
while (true) {
  const found = html.indexOf('ed_teach_count', pos);
  if (found === -1) break;
  console.log(`Found ed_teach_count at ${found}:`);
  console.log(html.substring(found - 100, found + 200));
  pos = found + 10;
}
