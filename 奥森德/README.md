# 奥森德 · 状态栏地图接入版

[查看正式 HUD 效果](地图预览/接入验证/hud-rooms-desktop.jpg) · [手机效果](地图预览/接入验证/hud-rooms-mobile.jpg) · [下载可交互沙盒预览](地图预览/接入验证/hud-live-preview.html) · [下载自动启动运行脚本](dist/okh_complete_autostart.js?raw=1)

## 在酒馆中试用

在现有角色卡聊天中，用 `dist/okh_complete_autostart.js` 替换当前完整后台脚本，保持只启用一份完整运行脚本。它包含当前源码、地图、职业图标与自动启动代码，不需要再加第二份启动脚本。

脚本沿用当前聊天存档，不强制初始化或重置。启动后可在同一脚本上下文查看 `await OKH_CARD_READY` 的结果。默认在最新一条助手回复下挂载状态栏，旧回复显示简版；支持酒馆助手同源 iframe 环境。

如果已有自定义状态栏容器，可保留 `<div class="okh-hud" data-okh-hud></div>`；用 `OKH_APP.HUD.setAutoMount(false)` 关闭自动追加。

## 已接入

- 全域图 → 镇内图 → 旅店一层 / 二层。
- 同一排六个房间：伯里、古兰、伊丝娜、妮丝、奥萝拉、爱德。
- 古兰保留母亲与独立住客身份，不称为领队。
- 点房门展开角色，再选择行动填入酒馆输入框；保留已有草稿，不自动发送。
- 人物位置、活动、登场状态和夜间同住信息从当前存档读取。人在旅店不推断为人在卧室。
- 未获救加入的爱德不提前显示为住客；未公开的暂离去向不绘成营地定位。
- 看图、切层、选房和拟定行动不直接改时间、位置、活动、关系值或存档。

地图与职业图标已内嵌。原有肖像与可选旧 UI 纹理仍沿用原资源路径及占位回退。

## 源码与验证

- `src/app/okh_app_map.js`：地图、房间视图与行动意图。
- `src/app/okh_app_hud.js`：正式状态栏、挂载、事件与输入接入。
- `scripts/build.cjs`：构建当前运行脚本到 `dist/`。
- `地图预览/接入验证/`：使用正式运行库与独立沙盒存档的可交互页面；其中的示例存档不会进入自动启动运行脚本。

在 `奥森德/` 下运行：

```sh
node scripts/build.cjs
node scripts/test_foundation.cjs
node --test scripts/review-regressions.cjs
node --test scripts/test_map.cjs
node scripts/build_hud_preview.cjs
node scripts/test_hud_browser.cjs
```

验证结果：基础回归 28/28、核心回归 16/16、地图回归 8/8；浏览器验证覆盖地图切换、房门和输入、存档更新、原分页、隐私状态、自动挂载、旧消息简版、iframe，以及 320/390/640px 排版。浏览器检查需 Playwright 与 Chromium，可通过 `OKH_CHROMIUM` 指定浏览器路径。

依赖未上传正式卡的 test_card.cjs 未执行；本次没有修改角色卡。旧 R4 内容已经清理。正式 32 条世界书角色卡仍未随源码上传，本运行脚本不生成替代角色卡；真机效果需在用户酒馆中导入试用。
