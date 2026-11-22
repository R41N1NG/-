const fs = require('fs');
const html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 检查所有更新卡片的 JS
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>');
const script = html.substring(scriptStart, scriptEnd);

console.log('Script length:', script.length);

// 搜索是否有包含“心相：”或者“负债：”或者更新 DOM 的代码
const matches = [];
const lines = script.split('\n');
lines.forEach((line, i) => {
  if (line.includes('心相') || line.includes('负债') || line.includes('立志') || line.includes('okh-member-card') || line.includes('okh-cards-grid')) {
    matches.push(`${i + 1}: ${line.trim()}`);
  }
});

console.log('Matches in script:');
console.log(matches.slice(0, 30).join('\n'));
