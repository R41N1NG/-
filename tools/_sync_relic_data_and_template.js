const fs = require('fs');

const tplPath = '卡片脚本/_src/状态栏面板.模板.js';
const dataPath = '卡片脚本/_src/名器图鉴数据.json';

const stagesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const minified = JSON.stringify(stagesData);

let content = fs.readFileSync(tplPath, 'utf8');

// 1. 替换 const XSD_RELIC_STAGES = ...;
const stagesRegex = /const XSD_RELIC_STAGES = \{[\s\S]*?\};/;
if (!stagesRegex.test(content)) {
  console.error('未找到 XSD_RELIC_STAGES 定义！');
  process.exit(1);
}
content = content.replace(stagesRegex, `const XSD_RELIC_STAGES = ${minified};`);

// 2. 增强 popover 底部提示
content = content.replace(
  /'<div class="pop-footer">✦ 点击纹章展开「全景名器玄鉴」画卷<\/div>'/,
  `'<div class="pop-footer" style="cursor:pointer;" title="点击可展开玄鉴画卷">✦ 点击展开「全景名器玄鉴」画卷（全13器自由查阅）</div>'`
);

// 3. 增强 CSS: 给 .xh-relic-box 增加 hover 缩放与 pointer 反馈
if (!content.includes('.xh-relic-box:hover')) {
  const cssAnchor = '.xh-relic-box{';
  if (content.includes(cssAnchor)) {
    content = content.replace(
      cssAnchor,
      `.xh-relic-box{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;}\n    .xh-relic-box:hover{transform:scale(1.08);z-index:25;box-shadow:0 0 10px rgba(212,175,55,.45);}\n    .xh-relic-box`
    );
  }
}

fs.writeFileSync(tplPath, content, 'utf8');
console.log('成功更新 状态栏面板.模板.js！');
