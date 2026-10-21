# DEEPSEEK 交接（DSH 会话 · 2026-10-19）

> 本文件记录 **DeepSeek Harness（DSH）代理会话**在 `E:\角色卡制作\尾行` 的工作内容，供下一位智能体无缝接手。
> 会话人设：DSH 插件注入的「大肥鱼」，称呼用户为「主人」。项目宪章见 [`GEMINI.md`](GEMINI.md)（开局必读），索引见 [`项目目录索引.md`](项目目录索引.md)。
> **本文件只记事实与我做过的事**；未定稿的设计判断一律标注「待主人定」。

---

## 〇、一句话现状

引擎与状态栏均绿：**279 项单测全绿**、卡已按真源重建到 `最新角色卡/尾行.json`（863,604 字节，含本轮全部改动）。
上一轮悬着的「回执注入通道」已收口：探测改为**跨 iframe 逐层查找 + 助手通道 await + 原生回读校验**，并写进 `wx_diag`；
C5 覆盖层已整块折回基础规则并删除（逐元素计算样式对比：创角 272 元素 0 差异，判定台仅剩骰子阴影的 JS 动画抖动）。
第三轮补了**动线时刻表推进**：`herAdvance` 原是死接口（全项目无人调用），她的地点永远停在第 1 站；现由 `advanceRouteByClock()` 每楼按钟点推进，回执同步写死地点。
第四轮把**默认目标改成独居女大学生**（创角默认 / 卡面首开场 / 世界书默认互斥三处对齐），摇号按钮提亮，并补了开场白切换与世界书同步诊断。

> **主人本轮定调**：不针对 TT 酒馆做特殊化（玩家很可能跑在普通酒馆）；音频面板不再管；步声只做演出，不立听觉判定页。

---

## 一、本轮做了什么（按时间顺序）

### 0. 第二轮（2026-10-19 11:20 起）· 注入收口 + C5 清账

| # | 事项 | 结果 |
|---|---|---|
| 1 | **回执注入**（上一轮遗留的唯一未决项） | `src/host/glue.js` 重写宿主探测：`hostFrames()` 沿 window → parent → top 逐层找变量/消息/事件/助手 API（脚本在 iframe 里时 API 常挂父页面）；`injectPrompts` 改 async，助手通道**必须 await**（返回 rejected 也要接住再降级）；原生通道写入后用 `extension_prompts` 回读校验；`wx_diag` 增加 `verified` 字段；`wx_conf.injectPos / injectDepth` 可覆盖位置与深度（某分支模型仍看不见回执时，不必改卡即可试 0/2 或 depth 0）。新增 3 条单测（异步 rejected 降级、父窗口原生通道、回读校验） |
| 2 | **C5 清账**（判定项 4） | `状态栏.html` 里 136 行 C5 覆盖层（`#wx-create-dialog` / `#wx-settle-dialog` 的旧青蓝金配色）全部折回原规则后删除；创角与判定台的规则统一改由 `#wx-create-dialog` / `#wx-settle-dialog` 作用域承载（实测宿主通用按钮皮是 `.trpg dialog.wx-dialog button` = 0,2,2，单类前缀压不住） |
| 3 | 音频面板 | **主人划掉，不再管**（仍是旧深蓝皮肤） |
| 4 | 步声 | **主人定调：只做演出**，不新增「听觉」判定页 |
| 5 | `WX_SKIP_SYNC` | **主人定调：不做 TT 特殊化**，构建默认行为保持现状（默认热同步，`WX_SKIP_SYNC=1` 可跳过） |

**C5 清账的验证法（可复用）**：`work/c5/audit.mjs` 用 CDP 打开两版 HTML，把创角/判定台两个弹窗里**每个元素的 45 个计算属性**抓成 JSON 逐项对比。结果：`create` 272 元素 0 差异；`settle` 290 元素仅 `die-shadow` 的 `transform` 差 0.3%（JS 骰子缩放动画的采样时相，非 CSS 差异）。清账后另跑 `verify-static.mjs`（27 项）与 `verify-dom.mjs`（26 项）：全 OK，运行期零报错、整页无横向溢出。

**清账时发现的「从未生效」声明**（C5 之后依旧按旧值渲染，折回时保持原样、未擅自启用）：`#id-card` / `.target-card` 的 `padding: 10px 12px`（实际一直吃宿主按钮皮的 `4px 12px`）、`.stepper button` 的 `font-size: 16px / padding: 0`（实际 12px / 4px 12px）、`.zero-btn-*` 的 `padding: 8px 22px / font-size: 13px`（实际 4px 12px / 12px）。要启用的话是一次独立的视觉调整，需主人点头。

### 0.5 第三轮（2026-10-19 12:40）· 她的地点接上时刻表

**主人报障**：TT 最新聊天里中控没在管目标当前地点——战术终端位置不变，模型却直接写到单元门口。

**取证**：`wx_snap` 停在 `floor 6 / route.here 0 / place 学校正门`，第 6 楼模型复述的回执里动线情境仍是 `[学校正门]`，正文却已到单元门；引擎复现连跑 7 楼 `place` 恒为起点。

**根因**：`herAdvance()` 是**死接口**——只有单测与 `tools/drive.mjs` 调用，`settleInput / processFloor / glue / 状态栏` 全无调用点；`route.here` 永远 0，终端位置、`exits (前)`、庇护预警、终局封印全锁在起点。

**次因**：回执 `[时空与环境]` 只有「时间 + 环境」，**没有地点**；模型只能自己编地点与时间（实测其标题从 21:05 杂物深巷 一路飘到 22:45 临街人行道）。

**修法（主人选①）**：
1. `game.js` 新增 `advanceRouteByClock()`：一楼 = 15 分钟，第 1 楼对应 `route.startTime`，越过 `route.times[i]`（生活包 `path[].t`）即推进；一次跨多站只留一条信号；终点仍 `tailing=false`。每楼结算前执行（`replyOnly` 相不推）。
2. 所有动线构造点补 `times`（初始 + 过夜重掷 + 默认开局）；**老存档**加载时按同名动线回填（只补不覆盖，找不到就不推）。
3. `receiptText`：`[时空与环境]` 加 `地点：[X]`，白描约束加「本楼她只在这里，严禁换场所或提前抵达下一站，地点变更只认回执」。
4. 新增 `tests/route.test.js` 6 项（到站推进 / 跨站合并信号 / 终点封顶 / 无 times 不推 / 老存档补表 / 回执地点约束）。

**顺带说明**：按时刻表，第 6 楼（22:45）本就该在末站（22:30 到家），所以「走到门口」不全是模型加速，更多是引擎落后了一小时。修好后终端会变成「老旧单元楼道」，与正文一致。若主人觉得六楼到家节奏太快，那是另一个旋钮（每楼分钟数 / 路线时长）。

### 0.6 第四轮（2026-10-19 13:20）· 创角默认、摇号与开场白

**主人三条指令**：①默认选项改独居女大；②摇号不醒目；③选女大后世界书没互斥、开场白没跳。

| # | 改动 | 落点 |
|---|---|---|
| ① | 默认目标 `student` → **`college`**：`ZERO.targetId` 初值、各处 `\|\| 'college'` 兜底、重开新局、演示存档回读、`glue.defaultInit` | `状态栏.html`、`src/host/glue.js` |
| ① | 卡面三处对齐：`first_mes` 换成女大开场、女高开场降到 `alternate_greetings[0]`；世界书 **女大 `enabled+constant`、女高两者皆关** | `build.js`、`worldbook_builder.js` |
| ② | 摇号按钮从幽灵小字改成琥珀描边按钮（12px / 5×14 内距 / hover 加亮 / 图标放大到 14px） | `状态栏.html` |
| ③ | 世界书同步加固：书名三源尝试（角色主书 → 扩展 world → 扫描 `getWorldbookNames`）＋ `wx_diag.wb` 记录 attempts；新增 `applyTargetOpening()`：女大取 `first_mes`、女高取 `alternate_greetings[0]`，仅在「新局且聊天只有开场一条」时用 `setChatMessages` 覆盖 | `glue.js` |
| ③ | 新增 `tests/target-default.test.js` 4 项（卡面开场对位 / 世界书默认互斥 / 默认目标 college / 开场白切换与不覆盖旧对话） | — |

**注意**：开场白只在**新聊天**里切换；已有对话（哪怕只有 3 楼）一律不覆盖，这是有意为之——不许脚本改写玩家已经读过的剧情。

### 0.7 第五轮（2026-10-19 14:00）· 动作胶囊条件门槛

**主人问**：胶囊该按当前情景限定——非近身不出偷袭、没开锁工具不出开锁；问麻烦不麻烦。

**核查**：4 胶囊条本就按「模式 + 距离 + 场所」分档，但 ①`close`（身后）也给偷袭；②**二级抽屉只按模式过滤**，全量菜单里 `far` 也有偷袭、没工具也有开锁；③**引擎只校验 modes，不校验物品与距离**——UI 藏了也挡不住打字申报。

**定档（主人选①：场景无关隐藏、条件不足灰显+原因）**：

| 层 | 做法 |
|---|---|
| 词表 | `lexicon.requires`：`dist`（允许距离）／`items`（随身工具）／`place`（`door`=门前·楼道·玄关） |
| 引擎 | `settleAction` 在模式门槛后、掷骰前校验，不满足 → `rejected` + 人话原因，不掷骰不入账；回执写「未执行（原因）」 |
| UI | `capsuleGate()` 同一张表：不相干整条不渲染，条件不足渲染 `.locked` 灰条 + 虚线描边 + 悬停原因；点击不响应 |
| 当前口径 | 开锁＝门前 + `lockpick`/`cyber_lockpick`；撬门/试门把/贴门听/门缝观察＝门前；下手＝身后或贴身（偷袭 UI 收紧到贴身） |
| 测试 | `tests/action-gate.test.js` 5 项（无工具拒/有工具过/非门前拒/非近身拒+贴身过/UI 门槛） |

**注意**：`ransack` 没有加场所门槛——地图里没有真正的“室内”节点（只有楼道/铁门/玄关），加了会变成永远不可用。

**主人当场“举一反三”**（同日第二轮）：同街（15–20 米）时，破门整排也不该亮——门在，但人够不着。已补：

| 动作 | 场所 | 距离 |
|---|---|---|
| 试门把 / 开锁 / 撬门 / 贴门听 / 门缝观察 / 查门禁 | 门前·楼道·玄关 | 身后 / 贴身 |
| 翻找 / 翻墙 | 任意 | 身后 / 贴身（街上十几米外够不着） |
| 下手 | — | 身后 / 贴身（偷袭 UI 收紧到贴身） |
| 记撤离路线 | 任意 | 任意（纯情报，不碰门） |

**距离与场所是两把独立的锁**：UI 顺序是「先判有无门（无门整条不出现）→ 再判够不够近（够不着灰条）→ 最后判工具」；引擎按 `place → dist → items` 依次拒绝并给出对应人话。

**同日第三轮（主人第三次「举一反三」）· 距离边界与贴身连带**：

| 场景 | 处理 |
|---|---|
| 已贴身 + 「逼近/贴身逼近」 | 灰显：「已贴身，无法再靠近」（引擎 `approach` 同样拒） |
| 已远端 + 「拉开/退回」 | 灰显：「已是最远，无法再退」（`withdraw` 引擎门槛 dist≠far） |
| 目标距离＝当前档 | 灰显：「已在此距离」（白点一次不产生位移） |
| 贴身 + 躲藏 | 灰显：「贴身时无处可躲」（引擎 requires 不含 touch） |
| 非贴身 + 按制/转移 | 灰显：只在贴身成立（引擎 requires touch） |
| 心跳 ≤20 + 缓息 | 灰显：下限即 20（引擎不拦，纯 UI） |

**顺带修的真 Bug**：`withdraw` 是有骰动作，但成功分支只给 `follow` 写距离 —— **掷了骰却从不动距离**；已在成功分支补 `g.dist = "far"`。

**自查口径（以后加任何胶囊都过这四问）**：① 这地方有这东西吗（place）② 人够得着吗（dist）③ 手里有家伙吗（items）④ 这一步还有意义吗（距离边界/状态边界）。

**第四轮（主人点破"我们在这判断没用"）· 把语义边界也交给中控**：

| 补的引擎判定 | 位置 |
|---|---|
| 偷袭必须贴身，身后只允许强攻（同一条目按 `args.style` 分档） | `settleAction` |
| 缓息在 `heart ≤ 20` 时直接拒绝（不占动作位） | `settleAction` |
| 动作包补 `id` 字段（便于回执/诊断定位到词条） | `settleInput` |

**验证方式（可复现）**：不给胶囊、纯手打中文，词表归一到动作后照样被拒——
`开锁`（街上）→ 只能在门前；`撬门`（门前同街）→ 需 身后/贴身；`偷袭`（身后）→ 需贴身；`缓息`（心跳 15）→ 缓息无效。回执写「未执行（原因）」，模型不得写成成功。

**第五轮（主人定「手打绝对无效，动作只认胶囊」）· 把两条隐藏入口焊死**：

| 入口 | 之前 | 现在 |
|---|---|---|
| 默认姿态兜底 | 未点胶囊时 `consumeActiveActions()` 自动返回「跟缀」 | 返回空数组；姿态徽记改成只读的「未选动作 · 纯叙事」 |
| 文本归一后备 | `settleInput` 无胶囊时把正文归一成动作 | 默认关闭；`allowTextFallback` 仅 GM / 工具 / 单测用 |
| 正文里的 `<动作>` 标签 | 玩家输入相也会被 `processFloor` 解析执行 | `_fromInput` 相一律忽略，只有 LLM 回复/GM 通道才解析 |

**连带清理**：删除 `postureEnabled` / `defaultPosture` 两个死变量；输入框占位提示改成「未选动作，本轮纯叙事，不掷骰」；回执纯叙事句改成「本轮玩家未点选任何动作胶囊：纯叙事推进，不得凭空发生检定或体力/心跳/警觉变动」。
**测试**：M4 全链改为模拟点选胶囊；新增/改写断言「同样文本不产生动作」。基线仍 **264**。

**第六轮（主人定：跟缀＝保持当前距离，并设为默认姿态）**：
- `getDynamicCapsules` 的 `default` 本来就等于「当前档 follow」，把它接回显示层：未点选胶囊时按默认姿态结算，徽记显示「默认: 跟缀 · 保持距离」，点徽记可切纯叙事。
- 抽屉里的「跟缀」改为**动态绑定当前距离**（否则在身后/贴身时会把人往回拽到同街）。
- 门槛放行：`capsuleGate` 对「跟缀/保持/维持」跳过距离变更判定——它不换档；「已在同街」那条误锁消失。
- 与「手打无效」的边界：文本仍不被解析；默认姿态是 UI 上的姿态选择，不是从文字猜动作。

**第七轮（主人发现：她的警觉一处都没体现）**：
- 事实核查：快照只有 `target.alertStage`，界面**从未渲染**；能看到的只有常驻条的瞬时「警觉反应」文案与结算面板的「警觉变动 +N」。
- 设计约束：`tests/game.test.js:121` 的「明暗分离」用例明确禁止 `snapshot.target.alert` 出现——她侧不给数值是宪章级契约，不能为了显示去破坏。
- 落地：战术终端「环境 · 战术沙盘」加「她的警觉」行——五格刻度 + 档位名（0–19 未起疑 / 20–39 留意 / 40–59 起疑 / 60–79 确认 / 80+ 戒备），按 `alertStage×20` 分桶，3/4 档转红；悬停只给区间。
- 新增 `tests/hud-alert.test.js` 2 项（快照仍无原始值 / 界面档位与五格齐全）。
- **若要直显精确数值**：需同时改快照契约与该测试，属宪章级改动，等主人拍板。

**第八轮（主人提议把心跳弹层右侧空位改成她的警觉）**：
- 心跳弹层从单列改成两栏：左＝生理仪表（心跳/体力/走势），右＝`aside.popover-her`「她的警觉」窄栏（档位名 + 五格刻度 + 区间）。
- 卡片宽度从 236 → 300（移动端仍 cap 在 `100vw - 16px`）；`ALERT_TIERS` 与 `alertTierOf()` 提到 IIFE 顶层，终端与弹层共用同一份档位，不再各写一套。
- 定档回答主人：**只给阶段节点 + 区间，不给精确数值**（宪章「她的状态是天气不是仪表」；数值会诱导玩家算阈值）。要数字属宪章级改动。
- 新增 `tests/hud-alert.test.js` 第 3 项：弹层右栏锚点与共用函数。
- 已知小瑕疵：standalone 预览里弹层底部（音频按钮）会被常驻条的 `her-alert` 徽记压住一层——真机上徽记位置不同，未复现；若真机也压，给 `.trpg-slim-bar` 提 z-index 即可。

**第九轮（主人定：警觉 0–20 必须「毫无察觉」，行为整体后推一档）**：
- `rules.alert.bands` → `{ uneasy: 21, suspicious: 41, confirmed: 61, react: 81 }`；五档名改为 **毫无察觉 / 不安 / 起疑 / 确认 / 反应**。
- 连带同步：`game.js` 狗吠阈值 40 → 41；HUD 档位区间（终端 + 弹层）改成 `0–20 / 21–40 / 41–60 / 61–80 / 81+`；`行为册` 僵住条件 `≥60` → `≥61（确认档）`；`数值策划` 四处阈值与行为剧本表。
- 测试：`checks.test` 档位切分改为 0/20/21/40/41/60/61/80/81 九点断言；`hud-alert` 档位名同步。基线仍 **267**。
- **未做**：竖条五格（主人已选「五格离散 + 绿黄红」，但要求先对齐阈值与语义）——下一轮再落 UI。

**第十轮（主人定「和平城市默认不设防」，并落竖条）**：
- 不抬深夜基础值：深夜开局 20 落在「毫无察觉」是**符合人设**的——正常城市里她不会无端设防，要有痕迹才警觉。
- 心跳弹层右栏改成**竖向五格**：从下往上点亮，档位名与区间在条下；`column-reverse` 让第 1 格在底部。
- 五格**固定配色**（2 绿 1 黄 1 橘 1 红）：`.alert-pips i:nth-child(1,2)` 青绿、3 黄、4 橘、5 红；终端横排同一套颜色。
- 删除心跳盘下方「甜区 40–65 · 变形 70 · 崩溃 90」文字行（阈值只留 `#instrument` 悬停提示），同步删掉 `.dial-caption` 样式与移动端规则；`verify-static` 的两条 dial-caption 探针改成「已移除」断言并新增五格配色探针。
- 手机端代价：无 hover 时看不到三个阈值，待补「点仪表盘弹说明」。

**第十一轮（主人定：继续做过档）· 过档行为第一版落码**：

| 档 | 行为 | 判定（`applyAlertBehavior`） |
|---|---|---|
| 21 不安 | 提速 | `1d20+玩家敏捷` vs DC13（`rules.checks.follow`）；败＝距离退一档 |
| 41 起疑 | 三选一 | 胆大→**回头**（近身照面对抗，输＝记忆+2/警觉+8，赢＝警觉−5）；敏锐→**绕路**（她多走一站＋距离退一档）；均衡→按种子骰定，**进店**（`alertHold` 停一楼） |
| 61 确认 | **开跑** | `fleeing=true`，此后每楼额外推进一站，跑到终点 `tailing=false` |
| 81 反应 | **摊牌** | `tailing=false`，当晚跟缀结束 |

- **锁存**：`alertLatch` 一晚每档只响一次；一次跳多档只演最高档，低档记为已过。
- **广播**：`alertEvent` 只在本楼存在（下楼清空）→ 回执「她的过档反应」、信号流「突发」、她的反应气泡、`save()` 持久化。
- 新增 `tests/alert-behavior.test.js` 6 项（提速与锁存 / 跳档只演最高 / 回头 / 绕路 / 开跑追丢 / 摊牌）。
- **未做（第二版）**：进店的“进店胶囊”判定、回头后的距离回退、选择轮里的求援/报警/对视、档4 冲突系统（`conflict*` 仍是死代码）。

### 1. 状态栏美术改造（C1 → C5，已完成）

设计方向定名「**夜巡 Night Watch**」：去边框、用光与材质做结构、她的状态当天气、心形是唯一主角。

| 批次 | 内容 |
|---|---|
| **C1** | 语义配色 token（`--ink-0/1/2`、`--line`、`--t-hi/mid/low`、`--heat #f0b355`、`--safe #5fd6c3`、`--danger #ff5a68`、`--her #e79aa8`）；常驻条重画（40px、无边框、地点名金色渐隐下划线、距离刻度 3×13px 竖条、心形 `♥` 19px + 24px 数字） |
| **C2** | 战术终端 / 弹窗 / 属性卡 / 标签栈 / 接近度 / 沙盘 全部换成「顶部一条极细线」语言；`height: fit-content`、账目移出滚动区做 footer |
| **C3** | 行动胶囊改 ghost（`rgba(255,255,255,.055)` + inset 1px）、选中 `/` 底部 2px 光条、姿态徽记改等宽小字、抽屉面板统一；**补了 `aria-expanded` 同步**（原本永远是 false） |
| **C4** | **48 种彩色 emoji → 31 枚单色内联 SVG**（`WX_ICON` + `ico()` + `stripEmoji()` + `data-ico` 占位填充）；步进节点由 8px 圆点改 20px 圆盘承载 12px 图标；≤13px 图标线宽加粗到 2 |
| **C5** | 创角向导 + 判定台收编：`#wx-create-dialog` / `#wx-settle-dialog` 作用域覆盖旧青/蓝/金配色到 token |

**成品截图**：`work/shots/shot_main.png`（常驻条）、`shot_terminal.png`（终端）、`shot_drawer.png`（抽屉）、`shot_create2.png`（创角）、`shot_settle.png`（判定台）、`icon-sheet.png`（图标集）。

### 2. 鞋具：从「只有音效」补成「有数值」

主人指出「鞋子除了音效确实是有数值影响的，如高跟鞋 tag 有敏捷 −1」，核查后确认：**9 个 `shoe_*` 标签 value 全为 0，引擎零判定参与**——不是 UI 漏渲染，是设计未落码。

**定稿数值表（主人逐格确认过）**：

| 鞋具 | 敏捷修正 | 步声基准 |
| :--- | :--: | :--: |
| `shoe_heel` 高跟鞋 | **−1** | 3 |
| `shoe_platform` 松糕鞋 | −1 | 2 |
| `shoe_slippers` 拖鞋 | −1 | 2 |
| `shoe_sandals` 凉鞋 | 0 | 2 |
| `shoe_boots` 靴子 | 0 | 3 |
| `shoe_leather` 小皮鞋 | 0 | 2 |
| `shoe_flats` 平底鞋 | 0 | 1 |
| `shoe_sneakers` 运动鞋 | **+1** | 1 |
| `shoe_barefoot` 赤脚 | 0 | 1 |

**距离折算（越近越响）**：

```
声级 = clamp( round( 步声基准 × 距离系数 ), 0, 5 )
系数：贴身 ×1.5 ｜ 身后 ×1.25 ｜ 同街 ×1.0 ｜ 远端 ×0.6
```

- 高跟鞋实测：远端 2 → 同街 3 → 身后 4 → 贴身 5
- **触点是行为册「追逐」篇**：`差值 = (1d20 + 你的敏捷) − (1d20 + 她的敏捷)`，鞋的敏捷修正直接改变她那一侧的点数（这是「参与判定」的落点，不是凭空挂数值）
- **主人明确否决**「OL 高跟鞋追逐 −1 档」（`数值策划.md` 799 行那条），别再加回去

### 3. 回执注入：查出一个「模型收不到中控真值」的真因

主人反馈「TT 酒馆里中控没有正常反馈输出给模型」。我从 `E:\tavern\data\default-user\chats\尾行\` 的最新聊天记录取证：

**证据 1**：聊天变量里有 `wx_init / wx_save / wx_snap`，`floor = 3`，账本 12 项 → **中控在正常结算与持久化**。
**证据 2**：让模型复述提示词拿到的 6151 字原文里，`中控结算回执`、`唯一数值真源`、`[动作裁决]`、`[时空与环境]` **各出现 0 次** → **回执从未进入提示词**。

两个根因：

| # | 根因 | 说明 |
|---|---|---|
| A | **注入通道单一** | 代码只走 `TavernHelper.injectPrompts`；主人这台 TT 分支有变量 API 却没有它 → 静默跳过 |
| B | **构建管线断层** | `npm run build` → `build.js` → `build-statusbar.js` 读 `dist/runtime.js`，而这个文件只有单独跑 `build-runtime.js` 才更新。它停在 2026-10-18 20:49（305KB）——**主人一直在玩的卡，引擎落后两天**，本轮所有引擎侧改动都没进卡 |

修复：

- `src/host/glue.js`：注入改**双通道**——`TavernHelper.injectPrompts` → 原生 `SillyTavern.getContext().setExtensionPrompt(id, content, position=1, depth=1, scan=false, role=0)`；helper 抛错自动降级；都不行才告警
- `src/host/glue.js`：新增诊断变量 `wx_diag = { inject: "tavernhelper"|"native"|"none", floor, at }`，写进聊天变量可直接查
- `build.js`：构建前先 `require("./build-runtime.js")`，引擎产物不再落后

---

## 二、改动文件清单（本轮全部写操作）

| 文件 | 改动要点 | 风险 |
| :--- | :--- | :--- |
| `状态栏.html` | C1–C5 美术改造；「她的鞋」行（只露鞋名 + 悬停详情）；音频面板第四根「脚步声」滑杆 `vol.step`；`playFootstepSound` 按声级/距离定响度、静音与到家不播；mock 补 `shoe` 字段 | 中：常年带 `!important` 抗宿主 CSS，改选择器要先看特异性 |
| `src/config/rules.json` | 9 个 `shoe_*` 标签各加 `"mod": {"agi": …}` 与 `"noise": 0~3` | 低 |
| `src/runtime/game.js` | `applyShoeMod()` / `activeShoeDef()`（以标签栈为真源，不被 outfit 反推覆盖）；`applyTargetState()` 末尾叠鞋修正；快照 `stats` 改「基底+身心+鞋」现算；快照新增 `target.shoeInfo`；`SHOE_DIST_FACTOR` | 中：快照 stats 改为现算是为了杜绝累积漂移，测试已钉住 |
| `src/host/glue.js` | 注入双通道 + `wx_diag`；诊断日志打印实际通道 | 低 |
| `build.js` | 先重编引擎产物；`WX_SKIP_SYNC=1` 时跳过 TT 热同步（默认行为不变） | 低 |
| `数值策划.md` | 鞋具契约表加「敏捷修正 / 步声基准」两列 + 数值口径与距离公式 | — |
| `角色制作规范.md` | 模块四表同步 9 款鞋两列数值 | — |
| `GEMINI.md` | 测试基线 **229 → 230 → 235 → 238**，并补两项覆盖面 | — |
| `tests/shoe.test.js`（新） | 5 项：数据表对齐、敏捷修正生效且不累积、距离声级、赤脚/运动鞋档位、`shoeInfo` 字段 | — |
| `tests/inject.test.js`（新） | 3 项：无 helper 走原生、双通道全无记 `none`、helper 抛错降级 | — |
| `tests/statusbar-create.test.js` | 快照属性断言由「基底+身心」改为「基底+身心+鞋」（**契约变更，不是放宽**） | — |

**第二轮（注入收口 + C5 清账）写操作**：

| 文件 | 改动要点 | 风险 |
| :--- | :--- | :--- |
| `src/host/glue.js` | `hostFrames()` / `findTavernHelper()` 跨框架探测；`pick()` 逐层取函数；`injectPrompts` 改 async 并 await 助手通道；原生写入后回读 `extension_prompts` 校验；`wx_diag` 加 `verified`；`wx_conf.injectPos/injectDepth` | 低：全部走「找不到就降级」，无新硬依赖 |
| `tests/inject.test.js` | 3 → 6 项（+异步 rejected 降级、+父窗口原生通道、+回读校验 true） | — |
| `状态栏.html` | 删除 136 行 C5 覆盖层；创角/判定台规则折回并统一 ID 作用域；`.settle-actions` 恢复原排布 + ID 补内边距；`.stage-center .corner` 拆成「描边宽度基线 + ID 只改颜色」以免覆盖缺角 | 中：改的是美术层，靠计算样式审计兜底 |
| `GEMINI.md` / `项目目录索引.md` | 测试基线 **238 → 241**，覆盖面补「跨 iframe 探测 + 回读校验」 | — |

**非源码脚本/资产**（不参与构建）：`work/shots/*.mjs`（截图与探针）、`work/p1/*`（早期预览）。

---

## 三、当前产物与基线

| 项 | 值 |
| :--- | :--- |
| 单测 | **279 / 279 全绿**（`& "C:\Program Files\nodejs\node.exe" --test tests/*.test.js`） |
| 引擎产物 | `dist/runtime.js` **437.5 KB** |
| 状态栏产物 | `dist/wx-statusbar.user.js` 738.3 KB |
| 交付卡 | `最新角色卡/尾行.json` **863,604 字节**，4 条世界书（女大默认常驻、女高默认关闭），first_mes=女大开场 |
| 计算样式体检 | 创角 272 元素 0 差异；判定台 290 元素 1 项（`die-shadow` JS 动画变换） |

---

## 四、待办与未决（按优先级）

1. **【需主人定】C5 清账时翻出的「死声明」是否启用**：`id-card / target-card` 的 10px 竖直内边距、`.stepper button` 的 16px 字号与零内边距、`.zero-btn-*` 的 8/22 内边距与 13px 字号——这几条一直被宿主按钮皮压着、从未生效。当前按原样（旧值）保留，要启用属于一次独立的视觉调整。
2. **判定台 d20 三翼布局仍是旧结构**（未重构）；d20 canvas 只是配色收窄过。
3. **回执注入的实测**：本机没有可跑的宿主，注入链路由 6 条单测 + 跨框架探测代码保证；真机若仍看不到回执，先看 `wx_diag`（`inject` 通道 / `verified` 回读），再调 `wx_conf.injectPos` 或 `injectDepth`，不必改卡。
4. **【需主人定】到家的节奏**：现在一楼 15 分钟、`college_evening` 整条动线 60 分钟，第 5~6 楼她必然到家。若觉得太快，旋钮有两个：每楼分钟数（引擎 + 回执时间要一起改），或加长路线节点（生活包 `path`）。

---

## 五、避坑红线（这一轮踩过的，下一位别再踩）

1. **PowerShell 读写 UTF-8 会毁中文**：`Get-Content -Raw` + `Set-Content -Encoding UTF8` 会 mojibake。改文件一律用 edit/write 工具；批量改 JSON 用 node 脚本（`fs.readFileSync/WriteFileSync` + 显式 utf8）。
2. **无头截图下 CSS 动画与过渡不推进**：`--virtual-time-budget` 会让 `transition` 停在起始值（曾误判「回执弹窗一片黑」「颜色断言失败」）。截图/断言前必须注入 `* { animation: none !important; transition: none !important }`。
3. **无头窗口最小宽度约 500px**：测 360/390 窄屏要用 iframe 包一层（`work/shots/mobile.mjs` 即此套路）。
4. **`dialog.wx-dialog:not([open])` 必须 `display:none !important`**：否则 `.wx-create-dialog{display:flex}` 会压过 UA 规则，弹窗永不消失。
5. **`[hidden]` 会被 `display:flex` 压掉**：自定义 `display` 的组件补 `[hidden]{display:none!important}`。
6. **`/* */` 不能嵌套**：在块注释里写 `/*IN_CHAT*/` 会提前闭合，直接 SyntaxError（本轮踩过）。
7. **改选择器先算特异性**：宿主通用按钮皮是 `.trpg dialog.wx-dialog button`（**0,2,2**，不是 0,1,2），`dialog` 与 `button` 两个类型选择器都算数——单类前缀 `.wx-create-dialog .x`（0,2,0）照样压不住，要么用 ID 前缀 `#wx-create-dialog`，要么把组件选择器写到 3 个类。
8. **测试会顺带构建**：`card_build.test.js` 调 `build()`，每跑一次测试就重写 `最新角色卡/` 与 `dist/`；跑测试时建议带 `$env:WX_SKIP_SYNC="1"` 以免动 `E:/tavern`。
9. **node 必须用绝对路径**：`& "C:\Program Files\nodejs\node.exe"`（系统自带 node 是 0 字节空文件）。
10. **`node --test` 在受限沙箱里会 `spawn EPERM`**：测试运行器要起子进程；受限模式下改跑单文件 `node tests/xxx.test.js`（node:test 进程内直跑），全权限下 `node --test tests/*.test.js` 才正常。
11. **无头 Edge 的 `--dump-dom` 拿不到输出**（新版 headless 会脱离父进程，stdout 是空的）：要读页面状态一律走 **CDP**（`--remote-debugging-port` + `Runtime.evaluate`），`work/c5/audit.mjs` 是现成模板。
12. **`getComputedStyle` 会被 CSS 过渡骗**：`transition: all .15s` 的元素改完样式立刻读，拿到的是**旧值**；要么先注入 `transition:none`，要么等 300ms 再读（本轮差点误判「注入失效」）。
13. **`background: none` / `border: 0` 这类简写在 CSSOM 里会显示成 `initial`**：这不是写错，别被调试面板误导。

---

## 六、可复用工具（`work/shots/`）

| 脚本 | 用途 |
| :--- | :--- |
| `harness.mjs` | 渲染主界面/抽屉/终端/档案/设备/创角/判定台等截图到 `work/shots/*.png` |
| `mobile.mjs` | iframe 真宽度截图（360/390/560/561/700/800） |
| `verify-static.mjs` | 构建提取 + 静态探针（本轮实跑 27 项：10 构建断言 + 13 样式 + 3 DOM，不起浏览器） |
| `verify-dom.mjs` | CSSOM + 9 个弹窗开合 + 溢出/垫高/取整检查 |
| `verify-c3.mjs` | 胶囊/抽屉/姿态徽记交互回归（19 项） |
| `audit-c4.mjs` | 全页扫残留彩色 emoji + 统计 SVG 图标 |
| `icon-sheet.mjs` | 从 `状态栏.html` 抽出 `WX_ICON` 渲染图标清单 |
| `mprobe2.mjs` | 8 档宽度常驻条/整页溢出扫描 |
| `read-chat.mjs` / `read-leak.mjs` | 读 TT 聊天记录、抽取泄露的提示词做取证 |
| `work/c5/audit.mjs` | **计算样式对照审计**（CDP）：两版 HTML 逐元素 × 45 属性对比，输出差异清单与截图；用法 `node work/c5/audit.mjs before:<file> after:<file>` |
| `work/c5/shots.mjs` | 用 CDP 给创角/判定台拍图（`Page.captureScreenshot`，注意 `captureBeyondViewport:true` 会报 Page is too large） |

---

## 七、给下一位的第一封信

1. 先读 `GEMINI.md` 与 `项目目录索引.md`，本文件只补「上一轮做了什么、坑在哪」。
2. **任何引擎侧改动结束后，必须 `node build-runtime.js` 再 `node build.js`**（现在 `build.js` 已内置，但知道这条能救命——曾漏过它，主人白玩了两天的旧引擎）。
3. 数值不要拍脑袋：`数值策划.md` = 测试预期源，改数字要同步 `rules.json` 与测试断言。
4. 改 CSS 前先想清楚「这条规则到底压不压得住宿主按钮皮（0,2,2）」；改完用 `work/c5/audit.mjs` 做一次计算样式对比，别靠肉眼。
5. 主人明确不要 TT 专属特化：所有宿主适配走「标准 SillyTavern 优先 + 跨分支逐层探测」，不要在代码里写分支名判断。


**第十二轮（相册与拍照产物落码）**：
- 新增 `src/runtime/album.js`（取图纯函数：变体目录、距离角度、未拥有过滤、套装齐奖励）与 `src/config/wardrobe.json`（23 件 / 7 套）。
- `game.js`：开局掷 `hair/body`；`capturePhoto()` 接在 photo 成功/大成功之后；album/setBonusDone/captureSeq 进存档；快照新增 `album{count,total,shots,catalog}` 与 `capture`。
- `glue.js`：回执加「拍照成果：件名 · 角度（相册 N/M）；PI +x」。
- `状态栏.html`：手机设备页加「相册 ↗」；贴墙相册（五分区、空框无文案、点开大图）；拍照即时卡片 6 秒；取图基址 `user/images/wx_wardrobe/`（本地，缩略图 .jpg）。
- 测试：新增 `tests/album.test.js` 6 项（远端不进相册、同街角度、未拥有过滤、变体路径、套装齐、capturePhoto 连续取新）。基线 **279**。
