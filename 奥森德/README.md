# 奥森德 · 后台修复脚本 2.1.0

[下载运行脚本](okh_complete.js?raw=true)

交付日期：2026-11-10。本目录提供本次请求的修复运行脚本。`okh_complete.js` 由 9 个核心模块和 8 个应用模块合订，模块以 `@module` 标记分隔。

## 使用

1. 将 `okh_complete.js` 放入同一个酒馆助手脚本上下文，停用旧版核心和应用脚本。
2. 在对应脚本上下文执行：

```javascript
await OKH_APP.init();
OKH_APP.info();
await OKH_APP.start();
```

手动推进：`await OKH_APP.step(30)`，表示增加30游戏分钟。

若发现旧版 `okh_gpt.world`，先备份聊天变量，再显式 `await OKH_APP.importLegacy()`，随后启动。原来没有保存的历史检查点无法补造。

## 修复范围

- 普通活动统一保护期，重复申报沿用实例ID，不刷新计时；同轮结束和开始按顺序处理。
- 每条完整回复即时处理申报，时间保底只补足不足部分；开场不计入。
- 仅解析唯一闭合状态栏；`end` 校验偏差，不覆盖时间真值。
- 回复版本识别、检查点回退和历史重放；按聊天隔离存档。
- 生成前注入事件批次，成功回复只确认对应批次；取消不确认，空队列清空旧文本。
- 保存失败报错，正式环境不静默退回内存；指标漂移按游戏时间计算。
- NPC位置、focus和injury接入；原始监听默认隐藏。

## 接口适配

自动尝试聊天变量 `getVariables/replaceVariables` 或现有 `getvar/setvar`；聊天ID从 `getCurrentChatId()` 或酒馆上下文 `chatId` 获取。接口不同可通过 `OKH_APP.configure` 提供 `getChatId/getContext/storage/inject/events/eventOn/eventOff`，不需改活动和节点模块。

生成前事件必须发生在请求提示词构造前，并由宿主等待异步回调。必要时显式调用 `await OKH_APP.beforeGeneration()` 后再生成，完整回复加入聊天后调用 `await OKH_APP.onMessage(replyIndex)`。

本版直接注入 ledger 和事件；旧世界书若也注入 pendingText/ledger，应关闭重复动态入口，不注入 watch。

核心与应用已通过92项模拟宿主回归及模块审计；真实酒馆版本仍需本地联调。角色数值、保护时长、阈值和示例内容尚不是定稿。
