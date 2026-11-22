const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

let pos = 0;
while (true) {
  const found = html.indexOf('待决事件', pos);
  if (found === -1) break;
  console.log(`Found 待决事件 at ${found}:`);
  console.log(html.substring(found - 100, found + 400));
  console.log('---');
  pos = found + 10;
}
