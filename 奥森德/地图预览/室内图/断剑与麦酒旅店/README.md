# 断剑与麦酒旅店 · 一排六间客房

![六间房与角色交互](rooms-preview.jpg)

[玩家房间](player-room-preview.jpg) · [手机效果](mobile-rooms-preview.jpg) · [六门底图](upper-scene.jpg) · [行动填入效果](interaction-preview.jpg) · [下载可点击预览](interactive-preview.html)

## 房间

同一侧走廊的一排六个房间，从左到右：

| 图面编号 | 入住角色 | 身份 |
| --- | --- | --- |
| 01 | 伯里 | 玩家，见习战士 |
| 02 | 古兰 | 伯里与妮丝的母亲，独立住客 |
| 03 | 伊丝娜 | 猫耳斥候 |
| 04 | 妮丝 | 伯里的妹妹，见习法师 |
| 05 | 奥萝拉 | 见习牧师 |
| 06 | 爱德 | 随行后勤 |

古兰不是领队或冒险者小队成员；独立住客仍有住宿与访问入口。图面房号用于导览，不自动改写角色卡存档。实际是否在房和爱德是否已经加入，需服从游戏状态；预览中的动向为演示。

## 交互

一层大厅与二层客房分别切换。点房门只展开人物和房间，再选择行动填入输入框。保留已有草稿，不自动发送。

玩家房间提供回房休息、整理行囊。其他住客在房时可拜访或交谈，外出时显示已知去向并可寻找、留言；未知状态先敲门确认。地图不把同住旅店视为同在卧室，也不代替原有夜间同住规则。

手机使用图下姓名入口；图上职业小图标对应房门，入口至少 44px。图标与姓名独立于底图，可更新入住信息。

## 文件与接入

- `interactive-preview.html`：图片内嵌的单文件演示，下载后用浏览器打开。
- `room-guide-component.html`：嵌入片段；依赖同目录的 `ground-scene.webp`、`upper-scene.webp` 及 `../../职业图标/class-icons.webp`。
- `rooms-preview.jpg`、`mobile-rooms-preview.jpg`、`player-room-preview.jpg`：当前截图。
- `ground-scene.jpg/webp`、`upper-scene.jpg/webp`：两层图稿。
- `geometry-reference.py`：六门结构参考脚本，不是定稿建筑尺寸。

`okhInnGuide.setState({rooms:[...]})` 更新入住视图；每项含 `id`、`occupant:{id,name,role,classId,isPlayer}`、`presence` 和可选 `location`。房门键为 `door1`–`door6`，只表示图面锚点。职业键支持 warrior/scout/mage/cleric/support，玩家使用 isPlayer=true 区分个人房间。

`presence` 为 inside、away 或 unknown。默认不分配住客、不推断在房；演示数据独立放在 inn-preview-fixture 中。`setFloor` 和 `selectRoom` 仅浏览。

当前尚未接入正式卡后台。检查通过：六个房门、玩家与独立住客、楼层切换、动作填入及草稿保留、状态更新、缺输入框的复制回退和手机排版。底图为 AI 转绘。
