'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
if (require('../src/engine').VERSION !== version) throw new Error('源码版本与构建版本不一致');
const names = ['core', 'flow', 'companion', 'api', 'host', 'engine', 'graph', 'ui', 'bootstrap'];
const content = '/* Branch Story Engine v' + version + ' — 自定义剧本与事件；源文件见 src/。 */\n' + names.map(name => fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8')).join('\n;\n');
new vm.Script(content);
const exported = {type: 'script', enabled: true, name: '分支剧本与事件引擎', id: 'branch-story-engine-v1', content,
  info: 'v' + version + '：角色卡专用剧本库与聊天进度隔离；主模型末尾简短事实回报，普通事件本地结算，关键结果在阶段结束及固定间隔集中核验（失败最多重试三次）；自然阶段结束行动与自由输入识别；本地数值状态栏和历史快照；异常保留故事、关闭相关后续入口。作者流程分段提取与独立复核、整合及转化后复核，显示预计/实际/额外调用，阶段提示词分别编辑。分散证据按连续摘录数组严格校验，省略号拼接精确本地恢复，必要时仅定向补修证据，保留条件、数值和原始回复。兼容旧流程与自定义提示词；数值事件、交叉依赖、背包、防剧透及确认删除保留。',
  button: {enabled: false, buttons: []}, data: {}, export_with: {data: false, button: true}};
fs.writeFileSync(path.join(root, 'branch_story_tavern_helper_import.json'), JSON.stringify(exported, null, 2) + '\n');
console.log('导入包已生成：branch_story_tavern_helper_import.json (' + Buffer.byteLength(content) + ' bytes)');
