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
  info: 'v' + version + '：条件事件包独立进度与短摘要，数值/结果触发，按优先级交叉推进；b2+c1→a4→d1只解锁不自动领奖，实际依赖结算支持连带回退。记录子栏提供可缩放箭头关系图，独立🔒+模糊+确认。分析原始回复校验前保留，可修改并恢复草稿，字段报错标明节点，截断拒绝完整应用。快捷按钮填入草稿，发送后记录，自由输入也可识别；600秒长文本等待与45秒快速请求保留。拖动铅笔、Alt+B或/bse打开；旧剧本需自行补齐完成标准与事件包。',
  button: {enabled: false, buttons: []}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
