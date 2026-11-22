const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

let pos = 0;
while (true) {
  const found = html.indexOf('心相：', pos);
  if (found === -1) break;
  console.log(`Found 心相： at ${found}`);
  console.log(html.substring(found - 50, found + 100));
  pos = found + 10;
}
