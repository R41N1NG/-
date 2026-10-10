# 第二阶段：独立日期工具

【身份：gpt｜日期：2026-10-10】

接续工程 `card-project@f6655f859092fe7ff60204574b3117bec09155ef`，此目录独立保存第二阶段候选、审核与接入说明。第一阶段原件、ZIP、安装清单和历史验收均保留。

## 本次实现

- `utils/calendar-core.js` 声明 `createXsdCalendar()` 工厂，内部封装日期表、历时词表与上限；创建接口不读取酒馆、DOM、账本，也不产生日志或写入。
- `calculateAdvance(input)` 只接收明确的累计、旧偏移、楼号、本楼旧增量、人工锁、申报月数及转场判断；不接受整份 `stat_data`。返回原有 `acc/adv/sameFloor/clipped/rejected/capM/raw`，人工同楼分支仍保持原形状。
- `utils/calendar.js` 是兼容层，保留原调用名、签名、账本字段读取与超限警告。实际计算全部调用同一纯核，不抄两套算法。
- `utils/calendar.cjs` 是 Node 离线入口，直接加载同一纯核文件。它不进入卡内拼接，也没有单独维护日期规则。
- `rules/apply-status.js` 仅将转场识别与日号换算交给纯核；原来的人工优先、默认三月初三、基准来源、待确认记录、统一写入及事件流程保留。
- `modules.json` 将纯核放在兼容层之前，运行源由 27 段变为 28 段，成卡仍是一份自包含状态机。保留初始历史 baseline，不把新输出冒充第一阶段字节不变版。
- 时钟门禁改为从实际生成状态机读取纯核与兼容层；原行为断言不改。

## 接口

```js
const calendar = createXsdCalendar();
const advance = calendar.calculateAdvance({
  accumulated: 0, fallbackOffset: 0, previousFloor: 4, previousAdvance: 0,
  manualLocked: false, manualFloor: undefined,
  floor: 5, months: calendar.parseLishi('一日'), transit: false,
});
// advance.acc === 1 / 30；输入不修改、不自动持久化。
```

| 接口 | 输入 | 输出与边界 |
| --- | --- | --- |
| `calculateAdvance` | 上述显式字段（普通JSON账本值） | 推进结果；人工同楼不推进；同楼先撤销本楼旧增量；超限整笔拒绝。 |
| `parseLishi` | 历时文本 | 月数；已有未来计划与倒计时过滤保持。 |
| `hasTransit` | 历时文本、正文文本 | 是否命中原转场规则；正文仍只取前400字符。 |
| `pickTimepointLine` | 调用方提供的文本 | 唯一当前时点行；没有或多行返回空串。 |
| `parseXianmengFromText` | 已选定的时点文本 | `{ ym, day }` 或 `null`；本函数不保证文本来源可信。 |
| `cnNum` | 原中文/数字写法 | 保留旧转换行为。 |
| `ymToMonths` / `monthsToYm` | 年.月 / 连续月数 | 原兼容表示，跨年比较继续使用连续月数。 |
| `fmtXianmeng` / `fmtXianmengDay` | 年.月与可选日号 | 原显示文案。 |
| `dayOfMonth` | 含日分量的连续月数 | 原1~30日号换算。 |

## 本次不夹带规则调整

这一步是现有行为的结构解耦，不单独修复剧情提前、通用解析歧义或旧数值兼容口径；不能因纯函数化就宣称时间来源和剧情门全部正确。身份开场基准的宿主读取仍由原协调模块负责，GM、菜单滑块、外部时间模块仍有各自职责。下一步先显式整理基准选择和状态解析，再单独处理剧情门规则；每次用下级差分验证维持变更边界。

## 入口与分工

接入步骤与恢复见《接入说明.md》；下级实际审核/测试结果在本目录，部署回执差异见《部署回执复核.md》。GPT负责实现与汇总，基米/肥鱼负责本机同步、正常候选构建、部署与客户端加载核验；图片和手机截图任务继续暂停。

## 验证与复跑

下级正式日期差分、纯核和门禁检查共22项，通过；含2835次旧函数结果对照及10个相关原门禁。另一名下级另作26项独立接口比较，通过。具体计数和范围以《审核与验证.md》与验证结果为准；没有进行全量制卡或连接酒馆部署。

在仓库根目录执行：

```sh
node --test AI交接/状态机模块化/第二阶段日期工具/tests/calendar-differential.test.cjs
node AI交接/状态机模块化/第二阶段日期工具/候选源码/src/state-machine/build.cjs --check
```

完整门禁复跑使用本仓库已保留的原门禁，以及固定提交 f6655f8 的HUD/runtime；需要本地Git中有该提交（正常同步 card-project 历史即可）。旧日期纯函数另有固定fixture，下载包单独运行日期对照的方法见测试文件说明。不要把缺少Git对象或归档材料导致的未运行项写成已通过。

独立下载包从解压目录执行以下命令，只运行12项日期/纯核对照，10项需要仓库的门禁不执行；此范围已由下级在仓库外实际验证：

```sh
node --test --test-name-pattern="^(九个|中文|历时|nextAcc|人工|纯核|30日|新hasTransit|dayOfMonth|Node|原时钟)" tests/calendar-differential.test.cjs
```
