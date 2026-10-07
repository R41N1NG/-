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
  info: 'v' + version + '：整理/分析默认独立等待600秒，快速识别仍为45秒；超时与取消分别提示，后台已有JSON可在分析页校验恢复草稿。快捷行动填入输入框，发送后记录选择并注入同轮剧情；自由输入由辅助 API 识别；回复生成结束后更新短阶段摘要，核验实际完成后按本地预设结算结果ID并解锁选项。运行区与剧本节点分别确认解锁，拖动铅笔入口，Alt+B 或 /bse 打开。升级旧剧本请补齐完成标准或重新分析原文。',
  button: {enabled: false, buttons: []}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
