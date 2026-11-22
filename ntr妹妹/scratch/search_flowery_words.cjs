const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 搜索“稚子请托”以及类似的辞藻堆砌
const terms = [
  '稚子请托',
  '稚子',
  '请托',
  '探知真相',
  '因果',
  '心相',
  '心智',
  '底模'
];

terms.forEach(t => {
  let count = 0;
  let pos = 0;
  while ((pos = html.indexOf(t, pos)) !== null) {
    if (pos === -1) break;
    count++;
    pos += t.length;
  }
  console.log(`Term [${t}]: occurrences = ${count}`);
});
