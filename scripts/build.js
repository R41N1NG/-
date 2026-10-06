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
  info: 'v' + version + '：世界书剧本、条件分支、收集记录、关系变量、独立辅助 API、可选全文整理和移动端剧情面板。首次导入默认关闭注入，请在面板中配置。Alt+B 或 /bse 打开。',
  button: {enabled: true, buttons: [{name: '分支剧本面板', visible: true}]}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
const loader = fs.readFileSync(path.join(root, 'src/loader.js'), 'utf8'); new vm.Script(loader);
const loaderExport = {...exported, id: 'branch-story-loader-v1', name: '分支剧本与事件引擎 · 链接加载版', content: loader,
  info: 'v' + version + '：在线加载完整插件，显示下载状态、失败原因并自动尝试备用线路。只启用链接版或完整 JSON 版中的一份。'};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_loader_import.json'), JSON.stringify(loaderExport, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'branch_story_loader.js'), loader);
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
