'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
const names = ['core', 'api', 'host', 'engine', 'ui', 'bootstrap'];
const content = '/* Branch Story Engine v' + version + ' — 自定义剧本与事件；源文件见 src/。 */\n' + names.map(name => fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8')).join('\n;\n');
new vm.Script(content);
const exported = {type: 'script', enabled: true, name: '分支剧本与事件引擎', id: 'branch-story-engine-v1', content,
  info: 'v' + version + '：可拖动铅笔入口、防剧透锁、剧本内容导入导出、输入框上方快捷分支、可编辑辅助 API 提示词、长文本走向/结局/伏笔分析，兼容移动端。首次导入默认关闭注入，点击铅笔并确认解锁后配置。Alt+B 或 /bse 打开。',
  button: {enabled: true, buttons: [{name: '分支剧本面板', visible: true}]}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
