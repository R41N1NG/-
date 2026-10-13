# 2.0 模板库索引

更新：2026-10-13，当前实现v44 / framework.44；包含v18好感事件、v19持续背景、v20新状态栏及v21接入修复。节点门槛统一20/40/60/80，阶段区间独立。这里集中保存填写说明、可复制样例、实现状态和源码索引。说明与样例不是额外的运行配置；程序只读取下表指向的源码真源，勿复制出第二套配置并期待自动生效。

| 模板 | 状态 | 实际填写/执行位置 |
|---|---|---|
| [00 中控与条件](00-中控与条件.md) | 已实现 | src/runtime/dispatcher.js、conditions.js |
| [01 节点](01-节点.md) | 已实现；幽寂谷是首个插件 | plugins/youjigu_map/event_tree.js、index.js |
| [02 节点故事条目](02-节点故事条目.md) | 探索节点及叶红缨八晋升入口已绑定；其他故事按需填充 | src/config/node_stories.json |
| [03 正文范围](03-正文范围.md) | 已实现 | runtime/narrative_scope.js |
| [04 按钮行为](04-按钮行为.md) | 当前按钮已分类 | runtime/button_actions.js、dispatcher.js |
| [05 物品](05-物品.md) | 已实现 | runtime/item_catalog.js、ui/item_panel.js |
| [06 重要节点结算](06-重要节点结算.md) | 已实现独立摘要卡；无额外模型轮次 | ui/settlement_panel.js、dispatcher.js |
| [07 人物数值与阶段](07-人物数值与阶段.md) | 读取已完成阶段；叶红缨双身份五阶段已配置，其他人物待填 | src/config/character_stages.json |
| [08 身份开局](08-身份开局.md) | 六身份已实现 | text_data/_card_greetings.txt、starting_inventory.js |
| [09 状态栏与GM](09-状态栏与GM.md) | 已实现 | runtime/contracts.js、src/ui/status_panel.js、gm_panel.js |
| [10 快照与结算回执](10-快照与回执.md) | 已实现；实机边界需复测 | dispatcher.js、host/tavern.js |
| [11 持续背景与场景判定](11-持续背景与场景判定.md) | v19已实现幽寂谷区域 | src/config/area_backgrounds.json、src/runtime/dispatcher.js |
| [12 晋升节点与引导流程](12-晋升节点与引导流程.md) | 独立试点已实现；嵌入型待实现 | 不要求先到专属目的地 |
| [13 结算遮罩与揭幕](13-结算遮罩与揭幕.md) | v17已接入，固定判词＋折叠底账模式 | ui/settlement_effects.js、settlement_panel.js |
| [17 中立大势与时间推进](17-中立大势与时间推进.md) | v35实现；三时期、向前快进、神诅一次性跌境 | config/grand_eras.json、runtime/grand_eras.js、ui/era_panel.js |
| [16 境界与点击突破](16-境界与点击突破.md) | v34实现；无修炼经验值 | runtime/player_realm.js、ui/realm_panel.js |
| [18 负好感与永久上限](18-负好感与永久上限.md) | v39实现；叶红缨六份心智，其他人物通用边界 | runtime/character_stages.js、metric_events.js、config/character_stages.json |
| [已认可讨论与遗漏检查](讨论定稿与遗漏检查.md) | 定稿口径与未定事项分开 | 后续实施前先查此页 |

相对路径均以 `仙姝堕2.0/src/` 为基准。通用引擎已接入不等于数十个人物的五阶段正文和阈值都已编写。新增配置仍须明确字段、条件与本地效果，不把样例视为正式数值。

## 扩展一个事件

1. 按01配置节点、前置、互斥、奖励、行为与可选结算；新事件单独插件接入中控。
2. 按02在故事配置添加同ID内容。构建生成配套世界书，勿只改运行时酒馆条目期待下次构建保留。
3. 人物按07/12分开晋升资格与已完成阶段；v16已改为完成回报提交阶段，不能直接配阈值自动升阶段。
4. 按04判断是否发送；每次发送与耗时、轮次是不同概念。
5. 默认 `node ship.js`（Windows按GEMINI.md使用node.exe），导入新的PNG及配套独立世界书，再由主人复测。

v14重要节点结算是挂在完成回复楼的独立展示卡，不新增酒馆原生编号消息，避免额外楼层破坏撤回/分支。真正插入原生系统消息或调用模型润色摘要尚未接入。

内容填写入口：[内容样板](../内容样板/README.md)，首份叶红缨独立专属晋升已接入v16，双身份五阶段正文已填。

场景立绘配置：[portrait_scenes.json](../src/config/portrait_scenes.json)，按后台活动事件关联图包ID；玩家头像为浏览器本地界面偏好，不属于模型数值。

卡面真源：src/assets/card-cover.png，build.js保留原像素并嵌入角色卡数据；不得另起程序占位图覆盖主人指定卡面。
