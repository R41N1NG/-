const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

let pos = 0;
while (true) {
  const found = html.indexOf('遗孤幼子', pos);
  if (found === -1) break;
  console.log(`Found 遗孤幼子 at ${found}:`);
  console.log(html.substring(found - 50, found + 100));
  console.log('---');
  pos = found + 10;
}
