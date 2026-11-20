# 回忆相册

相册位于「同伴名册」下方。当前按要求只预留功能，`目录.json` 保持空数组，尚未导入任何正式 CG 或立绘。

[正式空状态](../最新角色卡/回忆相册空状态.jpg) · [相册排版示意](../最新角色卡/回忆相册示意.jpg) · [手机示意](../最新角色卡/回忆相册手机示意.jpg) · [下载交互示意](../最新角色卡/相册排版预览.html?raw=1)

示意预览使用独立的测试目录与装饰性画位，不会进入正式卡或真实聊天存档。

## 后续接入图片

将图片放入 `资源/`，在 `目录.json` 登记图片与解锁条件，然后运行 `node scripts/build.cjs`。构建会将本地图片内嵌进完整脚本和角色卡；无需另外部署图床。也支持用 HTTPS `src` 替代 `file`，这种图片需要联网。

例如，以下仅演示配置格式，当前正式目录没有加入此条目：

```json
[
  {
    "id": "gulan_memory_01",
    "npc": "gulan",
    "kind": "cg",
    "title": "回忆标题",
    "file": "资源/gulan_memory_01.webp",
    "unlock": [
      { "type": "metric", "key": "affection", "min": 80 },
      { "type": "worldFlag", "key": "arrived_oakhaven" }
    ]
  }
]
```

`id` 是永久收藏标识，接图后更换文件或标题时保持不变。`kind` 支持 `cg`、`portrait`。图片不裁切，缩略图和大图均完整显示。目录及条件有误时，构建会直接报错。

## 解锁条件

同一图片的 `unlock` 数组中所有条件必须同时满足，并且关联角色已经登场。不同条件或不同插画可以分别登记；不根据模型生成的图片地址或浏览点击进行解锁。

| 类型 | 示例 | 含义 |
| --- | --- | --- |
| 数值门槛 | `{"type":"metric","key":"affection","min":80}` | 好感达到 80；也支持角色已登记的其他数值，可选 `max` 指定区间上限 |
| 世界标记 | `{"type":"worldFlag","key":"arrived_oakhaven"}` | 对应世界标记为 true |
| 人物标记 | `{"type":"npcFlag","key":"gulan_rescued_final"}` | 图片所属角色的对应标记为 true |
| 事件发生 | `{"type":"event","id":"gulan_final_rescue_prompt"}` | 已登记事件确实触发，单纯待决也算发生 |
| 事件结果 | `{"type":"event","id":"gulan_final_rescue_prompt","outcome":"rescue"}` | 该事件已结算为指定结果 |
| 人物登场 | `{"type":"introduced"}` | 用于初见即收录的基础立绘；是否采用由后续每张图片的配置决定 |

条件在后台正常结算中检查；既有存档加入新目录后，下次正常结算会补收当前已经符合条件的图片。不会重新猜测存档未记载的历史数值峰值。

收集记录存放在当前聊天的 `world.playerState.memories`，只记录图片 ID 和收录时间，不复制图片数据。普通数值回落、角色离队或死亡不会删除既有收藏；回复重生成、删除或回滚则跟随该回复的存档检查点恢复。不同聊天互相隔离。旧存档没有此字段时按空相册处理，不需要清档或升级 schema。

未收集的图片不会出现在相册，也不会请求其缩略图；界面不显示其标题、数量或解锁条件。放大图支持前后按钮、方向键、Esc 关闭和键盘焦点循环。

## 构建与验证

```sh
node scripts/build.cjs
node scripts/build_card_preview.cjs
node scripts/build_hud_preview.cjs
node scripts/build_album_preview.cjs
node --test scripts/test_album.cjs
node scripts/test_album_browser.cjs
```

7 项相册测试覆盖空目录兼容、数值边界与组合条件、目录校验、事件发生与结果、未登场角色、存档复用与回复回滚、失败提交不获奖。浏览器检查覆盖空状态、角色筛选、放大与翻页、键盘、320/390/640px、浏览不改档、跨聊天和未解锁图片不发起请求。
