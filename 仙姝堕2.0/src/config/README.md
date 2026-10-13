# 运行配置入口

填写说明见[模板库](../../模板库/README.md)。

- [节点故事](node_stories.json)：键为节点ID，content填正文材料。构建生成代码关键词条目；详细说明见[故事模板](../../模板库/02-节点故事条目.md)。
- [人物数值与阶段](character_stages.json)：characters按人物注册数值、条件和阶段。v16配置叶红缨试点，正式阶段二行为正文待填；可复制格式见[人物模板](../../模板库/07-人物数值与阶段.md)。

更改配置后默认ship构建并重新导入，不能仅复制模板说明到酒馆。节点控制配置在[事件树](../plugins/youjigu_map/event_tree.js)，模板文件夹保存规范而非运行副本。

- [专属晋升](promotions.json)：入口/完成/结束ID、角色、原/目标阶段、资格、故事与有限回报问题。参见[晋升模板](../../模板库/12-晋升节点与引导流程.md)。

## v21接入口径

叶红缨赵无忧/自设各四个晋升门槛：20、40、60、80。心迹从promotions.json按身份读取，不用阶段区间起点41/61/81作门槛。正式代码仅src/runtime与src/ui；relic_db.json为名器库，四阶纹章源位于src/assets/名器图标，由tools/data.cjs打包。

## 场景立绘（v26）

portrait_scenes.json按promotionId/pluginId和人物名指定图包ID；夜浴试点使用yehongying_bath_side。静态图包/网络图床仍为外部资源，卡内仅含映射；小图优先高清PNG。

场景立绘值可用ID数组（v28）：同场景多图随机抽取，同楼重绘保持一致；仅填已有图库中符合场景的资源，禁止混入其他阶段/剧情图片。玄鉴图表必须用RELIC_PILOT_CONFIG映射的短ID读取relic_progress，图包长ID不充当账本ID。

晋升故事绑定（v29）：entryId/finishId必须有node_stories内容，promotion factory接收nodeStories复用入场内容，构建逐项检查。好感anchors可填label作玩家简短事件名；价格仍由delta决定，标签不改分值，心迹仅显示label与实际变化。

## v39负向人物心智

14名已注册人物好感整数−100至100。negativeStages/negativeRecovery及永久上限规则见[模板18](../../模板库/18-负好感与永久上限.md)。叶红缨六份心智已接入；其他13人个性正文待填。正向完成记录与负向覆盖分开，不为负向新增节点。
