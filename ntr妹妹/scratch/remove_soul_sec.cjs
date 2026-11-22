const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 精确删除模态框中的内心风骨板块
const targetSoulSec = `          <div class="okh-info-sec">
            <div class="okh-info-sec-title"><span>🕯</span> 内心风骨与心境</div>
            <div class="okh-info-sec-content" id="m-info-soul">
              纯善知恩 × 渴望变强保护至亲的倔强少年气。见生人习惯性怯生，唯独紧随 {{user}} 哥哥；坚信只要自己足够听话、多帮队伍省钱干活、学好本领，就能与大家一同救回姐姐。
            </div>
          </div>`;

if (html.includes(targetSoulSec)) {
  html = html.replace(targetSoulSec, '');
  console.log('Successfully removed targetSoulSec from modal HTML');
} else {
  console.log('Target soul sec not exact match, using substring search');
  const sPos = html.indexOf('内心风骨与心境');
  if (sPos !== -1) {
    const boxStart = html.lastIndexOf('<div class="okh-info-sec">', sPos);
    const boxEnd = html.indexOf('</div>\n          </div>', sPos) + '</div>\n          </div>'.length;
    console.log('Found soul box:\n', html.substring(boxStart, boxEnd));
    html = html.substring(0, boxStart) + html.substring(boxEnd);
    console.log('Removed soul box via index');
  }
}

// 标题修改为：状态指标与当前行踪
html = html.replace(/<span>⚖️<\/span>\s*实体状态与特质/g, '<span>⚖️</span> 状态指标与当前驻留');

// 在 JS openCharModal 中删除对 m-info-soul 的赋值代码
html = html.replace(/document\.getElementById\('m-info-soul'\)\.textContent\s*=\s*char\.soul;/g, '');

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Saved 预览_状态栏样式.html without soul sec');
