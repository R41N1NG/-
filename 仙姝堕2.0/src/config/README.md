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
