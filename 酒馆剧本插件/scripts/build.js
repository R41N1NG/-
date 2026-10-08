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
  info: 'v' + version + '：来源编号及短首尾定位由本地还原原文，旧回复仅空白差异可本地恢复，错误指出节点；先规划分段、逐段分析再整合，截断缩段重试；数值增减/设置量及原文依据转化为独立事件，支持限次、停止门槛与本地去重；固定功能导航与快速整理收纳。长文分析提取替代路线、AND/OR/NOT组合、数值门槛、互斥与选择代价；保留原文依据、事件包持续条件与数值边界，分块合并不抹除既有条件和出口。默认提示词自动升级，自定义保留。当前阶段/折叠行动/⚙️/🎒、数值载体和奖励上限、短编号、引用预览与确认删除、提示词编辑及实际请求继续保留。分析本地转化、交叉依赖、回退、防剧透与600秒分析等待。',
  button: {enabled: false, buttons: []}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
