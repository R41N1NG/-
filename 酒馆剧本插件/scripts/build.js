'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
const names = ['core', 'flow', 'api', 'host', 'engine', 'graph', 'ui', 'bootstrap'];
const content = '/* Branch Story Engine v' + version + ' — 自定义剧本与事件；源文件见 src/。 */\n' + names.map(name => fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8')).join('\n;\n');
new vm.Script(content);
const exported = {type: 'script', enabled: true, name: '分支剧本与事件引擎', id: 'branch-story-engine-v1', content,
  info: 'v' + version + '：分析完成后顶部可直接转化为剧本、事件与分支；有明确标准的阶段登记完成事件，节点与事件共用一次奖励、记录及回退。保存/恢复的草稿无需再次请求API，转化后打开剧本页并先关闭注入。保留条件事件包、交叉依赖与箭头关系图、独立🔒+模糊+确认、原始分析回复修复恢复、快捷填入与自由输入识别。600秒长文本等待、45秒快速识别；拖动铅笔、Alt+B或/bse打开。原文没有完成标准的阶段需手动编辑。',
  button: {enabled: false, buttons: []}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
