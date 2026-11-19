# 正式状态栏 · 地图接入验证

[查看新版地名标注](map-labels-detail.jpg) · [镇内标注](town-labels-detail.jpg)

地图文字已改为内嵌刻印风格宋体、棕墨色与柔和纸色衬底，去掉按钮方框；镇名移到城墙下方，房门姓名统一无框。点击范围与原交互保持。

![正式 HUD 中的六间客房](hud-rooms-desktop.jpg)

[手机效果](hud-rooms-mobile.jpg) · [全域图](hud-regional.jpg) · [玩家房间](hud-player-room.jpg) · [行动填入](hud-action.jpg) · [下载可交互预览](hud-live-preview.html) · [正式自动启动脚本](../../dist/okh_complete_autostart.js?raw=1)

下载 `hud-live-preview.html` 后用浏览器打开。此页面执行正式运行库，使用独立沙盒存档；地图读取相同的存档接口、正式状态栏渲染和输入事件，不是独立地图组件拼装。

可切换全域、镇内、旅店一层与二层；点房门查看角色后选择行动。页面底部“妮丝外出 / 返回旅店”会修改沙盒存档，用来观察房门信息同步更新。正式运行脚本不包含这些演示按钮或示例存档。

实际接入点在 `src/app/okh_app_map.js`、`src/app/okh_app_hud.js`。正式脚本沿用当前聊天存档，默认挂载在最新助手消息下，兼容同源助手 iframe；不会强制重置聊天。

目前存档只记录大地点与活动，不能确认每个 NPC 是否在卧室，因此显示“在旅店 · 房内待确认”并先提供敲门。夜间同住读取既有 playerRoomTarget 条件；未登场和未知去向保留隐藏。

检查通过：基础 28、核心 16、地图 8 项回归，以及真实浏览器交互、存档刷新、旧消息简版、iframe、窄屏触控与图片加载失败回退。未在用户实际酒馆中导入。
