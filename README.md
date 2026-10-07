# 项目目录

- [酒馆剧本插件](酒馆剧本插件/)：SillyTavern + 酒馆助手的分支剧本与事件引擎，含源码、测试、文档和安装包。
- [AI 交接与协作记录](AI交接/合作.txt)：共用协作记录及角色卡参考资料。

安装插件请下载 [完整脚本 JSON](酒馆剧本插件/branch_story_tavern_helper_import.json)，或 [v1.2.0 ZIP](酒馆剧本插件/branch_story_plugin_v1.2.0.zip)。详细使用方法见 [插件 README](酒馆剧本插件/README.md)，项目状态见 [插件交接文档](酒馆剧本插件/交接gpt.md)。

开发命令在 `酒馆剧本插件/` 内执行：

```bash
cd 酒馆剧本插件
npm ci --include=dev
npm test
npm run build
npm run test:browser
```
