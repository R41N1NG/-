const fs = require('fs');

const tplPath = '卡片脚本/_src/状态栏面板.模板.js';
const dataPath = '卡片脚本/_src/名器图鉴数据.json';

const stagesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const minified = JSON.stringify(stagesData);

let content = fs.readFileSync(tplPath, 'utf8');

// 1. 同步 XSD_RELIC_STAGES
const stagesRegex = /const XSD_RELIC_STAGES = \{[\s\S]*?\};/;
content = content.replace(stagesRegex, `const XSD_RELIC_STAGES = ${minified};`);

// 2. 替换解锁机缘为典籍朱批
content = content.replace(
  /'<div class="sc-lock-hint"><b>解锁机缘：<\/b>' \+ esc\(sObj\.lock \|\| '随天道气运突破'\) \+ '<\/div>'/,
  `'<div class="sc-lock-hint" style="color:#d4af37;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2);padding:6px 10px;border-radius:4px;font-size:11px;line-height:1.5;">' + esc(sObj.lock || '「极乐引」残篇朱批：玄妙道机隐于混沌，待红尘机缘方显真章。') + '</div>'`
);

fs.writeFileSync(tplPath, content, 'utf8');
console.log('✅ 模板已成功同步典籍朱批样式与文案！');
