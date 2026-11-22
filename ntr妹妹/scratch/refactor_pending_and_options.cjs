const fs = require('fs');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

let content = fs.readFileSync(localPath, 'utf8');

// 优化选项胶囊和事件卡片的 CSS
const optCssTarget = `.okh-option-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(18, 14, 12, 0.85);
      border: 1px solid rgba(195, 162, 108, 0.35);
      border-radius: 4px;
      padding: 9px 12px;
      color: var(--okh-text-main);
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }`;

const newOptCss = `.okh-option-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: linear-gradient(180deg, rgba(22, 17, 13, 0.85), rgba(14, 11, 9, 0.95));
      border: 1px solid rgba(195, 162, 108, 0.22);
      border-radius: 5px;
      padding: 10px 14px;
      color: var(--okh-text-main);
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }
    .okh-option-pill:hover {
      background: linear-gradient(180deg, rgba(46, 35, 26, 0.95), rgba(28, 21, 16, 0.98));
      border-color: rgba(224, 190, 126, 0.6);
      transform: translateY(-1.5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(224, 190, 126, 0.2);
    }`;

if (content.includes(optCssTarget)) {
  content = content.replace(optCssTarget, newOptCss);
  console.log('Replaced option-pill CSS');
} else {
  console.log('Could not find optCssTarget, checking partial match...');
}

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Done refactoring pending & options.');
