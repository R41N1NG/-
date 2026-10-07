# 《仙姝堕》首楼重构代码包

本包包含太微百花谱、米黄自设书卷、完整状态机替换文件及首楼构建模块，兼容 PC 与窄屏。消息模板只含 HTML/CSS；所有交互写在酒馆助手状态机里。

**这是代码接入包，不是完整角色卡。** 本次没有提供 `_build_card.js` 或完整角色卡 JSON/PNG，无法直接重编译一张完整可导入角色卡。现有状态栏面板脚本继续使用，不需要随本包替换。

## 安装

1. 将 `state_machine_first_floor.js` 的完整内容替换到酒馆助手中现有的“状态机”脚本；不要同时启用旧、新两份状态机。作者项目中的对应路径是 `卡片脚本/状态机.js`。
2. 将本文件夹放到 `_build_card.js` 同级目录。在原构建脚本中，将原来的 `MENU_HTML` 定义替换为：

   ```javascript
   const { MENU_HTML } = require('./first_floor_rebuild/menu-builder.cjs');
   ```

   如果构建脚本是 ESM，请改用：

   ```javascript
   import menuBuilder from './first_floor_rebuild/menu-builder.cjs';
   const { MENU_HTML } = menuBuilder;
   ```

3. 保留原有 `<IdentityMenu/>` 标记及负责将该标记替换为 `MENU_HTML` 的显示正则；只替换模板内容。该标记也用于状态机判定“当前停在菜单页”。不要把菜单 HTML 包在 Markdown 代码围栏里，不要添加消息内 `<script>` 或内联事件属性。
4. 重新构建、导入更新后的卡片，刷新酒馆网页，开启新聊天确认首楼。刷新可以清除旧状态机遗留在主文档上的匿名监听。旧聊天不会自动变成新首楼；是否可用“刷新开场白”命令取决于重新导入的卡片是否已有新版开场白/显示正则。

不使用构建模块时，也可读取现成的 `MENU_HTML.html` 作为 `MENU_HTML` 字符串。它已经压成一行，避免消息 Markdown 将缩进或换行转换为代码块、额外 `<br>`。

## 角色与内嵌资源

编辑 `flower-roster.cjs` 中的 `FLOWER_ROSTER` 数组即可增加、删除或调整角色。每位角色的 `id` 唯一；各项支持 `name/title/sect/image/imageKey/relicIcon/relicKey/relicName/quote`。没有完整角色卡，当前默认名录只列出已核对的三位核心角色，作者可继续追加。

运行 `node first_floor_rebuild/menu-builder.cjs` 会重生成 `MENU_HTML.html`。使用模块构建时，下一次执行 `_build_card.js` 会自动按新数组生成首楼。

默认配对依据已上传状态栏中的 `XSD_RELIC_STAGES` 与 `XSD_PINYIN`：

| 显示角色 | 立绘键 | 四阶纹章键 |
| --- | --- | --- |
| 孤月 | `guyue` | `jiuyouxuanyinxue_4` |
| 楚灵夜 | `chulingye` | `boruoputiju_4` |
| 闻观语 | `wenguanyu` | `xinmochayingru_4` |

指南中的示例配对与现有卡内表不一致：冰魄剑心穴载体是苏倾寒；九幽玄阴穴载体是孤月；闻观语对应心魔茶璎乳。“温莞玉／玉壶香乳”未出现在已上传脚本的对应表里。因此默认使用上表，指南原样数据另存于 `guide-roster.example.cjs`，需要新设定时可自行选用。

资源读取顺序：

- 立绘：卡内 `xsd_assets.menu` 的占位符映射 → `xsd_assets.lightbox[imageKey]` → `xsd_assets.panel[imageKey]`。
- 纹章：卡内 `xsd_assets.menu` 的占位符映射 → `xsd_assets.relics[relicKey]`。
- 四阶纹章缺失时显示“待”，不冒用一阶或其他角色纹章，不请求本地 `user/images/` 路径。

支持 `characters[characterId].data.extensions.xsd_assets`、扁平 `extensions.xsd_assets` 及 `json_data` 内的 V2 数据。这里的卡内画像是否实际齐全，需要完整角色卡确认；预览图中无画像是明确的占位状态。

想在构建时直接内嵌图片，可传入已有资产表：

```javascript
const { buildMenuHtml } = require('./first_floor_rebuild/menu-builder.cjs');
const MENU_HTML = buildMenuHtml({ assets: card.data.extensions.xsd_assets });
```

也可通过 `tokenMap` 显式覆盖资源，无需本地图包：

```javascript
const MENU_HTML = buildMenuHtml({
  tokenMap: {
    IMG_GUYUE: 'data:image/webp;base64,...',
    RELIC_JIUYOU_4: 'data:image/png;base64,...',
  },
});
```

## 身份与提交

- 赵无忧是墨山道六弟子；九皇子对应“浊龙殿主”。没有将两者混为同一个入口。
- 四大殿主入口展开具体四项，再调用既有 `pickIdentity`。机器身份值保持“焚欲殿主／欢喜殿主／浊龙殿主／魂欢殿主”，没有写入不存在的“四大殿主”身份值。
- 自设入口与返回入口通过原生 radio/label 和 CSS 切页。标签、左右箭头、提交和资源回填由状态机委托；定位全部采用 `data-*`，兼容酒馆净化时的 `custom-` 类名改写。
- 空道号使用当前 Persona 名，再无可用名才使用“无名散修”。不会修改 Persona 本身。
- 提交顺序为：冻结本次提交 → 拼装文案 → `await pickIdentity('自设', ...)` → 回读身份 → 填入顶层输入框 → 派发该输入框所属窗口的原生 `input` 事件 → 检查可发送状态 → 触发一次原生发送 → 检查消息是否实际入楼。
- 自设书卷提交保留菜单首楼，不切到旧的自设开场白，以保留填写内容和失败提示；普通身份按钮仍按旧逻辑切第 0 楼 swipe。
- 两个可读变量层均须确认身份是“自设”；变量接口失败不会自动发送。身份流程仍沿用原世界书同步与变量闸门，不重置 `known`，不擅自额外解锁“极乐引入手”等剧情锚点。
- 已有草稿时不覆盖；生成中、未连接、输入框不可用、聊天切换时显示原因。身份切换成功而发送失败时，自设身份保持，文案保留供检查，不自动回滚或重复发送。
- 发送已触发但未确认入楼时，按钮改为“检查发送状态”；再次点击只检查，不再自动触发第二次发送。

## PC 与手机

宽屏保持三张并列名录、并列身份入口和双列表单。560px 及以下表单与身份入口转单列；百花名录仍保留横向滑动，因为横向翻阅是本界面的核心交互。

输入框使用 16px，输入与触控按钮至少 44px。它满足“不得低于 14px”，并采用更稳妥的移动输入字号。书卷没有固定底部提交栏，页面可以完整滚动；附加安全边距，并根据可见视口变化补充软键盘占用空间。

四阶徽章外框固定为 44×44px，画像保留彩色，使用 `blur(2.5px) brightness(.92) contrast(1.05)`、`.88` 透明度与 `scale(1.03)`。

## 本次验证

通过 Node 语法检查及 17 项 Chromium 153 模拟检查，包括 320/390/560/1280px、PC/触屏、酒馆 DOMPurify 原生钩子与 CSS 选择器重写、无状态机时的 CSS 切页、原生 input 激活、身份/世界书先于发送、Persona 兜底、保留草稿、变量失败、生成中、会话切换、发送未确认、双层 iframe、具体殿主 swipe、多个首楼副本、监听重载/卸载及精确四阶内嵌资源回填。

`test-results.json` 是本次模拟检查记录；`preview/` 是 PC 与窄屏布局截图；`layout-preview.html` 是独立布局预览。独立预览只展示布局及 CSS 切页，身份、标签和自动发送需在酒馆助手内运行。

尚未验证真实 iOS Safari、完整角色卡内所有资源，以及用户实际酒馆版本。没有用“已触发按钮点击”代替“消息已成功发送”的确认。
