# 接入说明 · GPT 核心

> **接入日期**：2026-11-09
> **原则**：GPT 提供的 9 个文件**一个字节都不改**，只加一层桥接
> **状态**：接入完成，36 项验证通过；语义差异见第四节

---

## 一、文件结构

```
gpt_core/
├─ 00_utils.js          原样保存（GPT 提供）
├─ 10_rules.js          原样保存
├─ 20_activity.js       原样保存
├─ 30_effects.js        原样保存
├─ 40_events.js         原样保存
├─ 50_nodes.js          原样保存
├─ 60_turn.js           原样保存
├─ 70_api.js            原样保存
├─ 80_adapter.js        原样保存
└─ gpt_core_all.js      ← 9 个文件按顺序拼接（2,071 行）

tavern_scripts/
└─ 13_bridge_gpt.js     ← 桥接层（新增）
```

**为什么要拼一份 `gpt_core_all.js`**：GPT 的说明里明确提到「不同酒馆脚本可能处于不同 iframe，不能假定它们共享 `globalThis`」。拼接是为了在酒馆里作为一个脚本加载，**不改动任何源码内容**。

分开的 9 个文件保留，便于日后维护和 diff。

---

## 二、加载顺序

酒馆助手里按这个顺序装：

```
0_okh_boot.js
1_okh_core.js
2_okh_schema.js
3_okh_rules.js
4_okh_agency.js
5_okh_presence.js
6_okh_translate.js
7_okh_turn.js
8_okh_hud.js
9_okh_debug.js
10_okh_data.js
11_okh_event.js
gpt_core_all.js        ← GPT 核心
13_bridge_gpt.js       ← 桥接
```

**`gpt_core_all.js` 必须在桥接之前**，因为桥接要用 `window.OKHBackground`。

两套系统用不同的全局对象，互不干扰：

| 系统 | 全局对象 |
|---|---|
| 我们的 | `window.__OKH__` |
| GPT 的 | `window.OKHBackgroundModules` / `window.OKHBackground` |
| 桥接 | `window.OKH_BRIDGE` |

---

## 三、怎么用

### 3.1 默认状态

装好之后默认跑**我们的旧循环**（`legacy` 模式），GPT 核心处于待命状态，不参与推演。

### 3.2 切换到 GPT 核心

```js
OKH_BRIDGE.switchTo('gpt')
```

会做三件事：
1. 摘掉旧循环的钩子（防止两套同时跑）
2. 初始化 GPT 的 world
3. 挂上 GPT 的钩子

### 3.3 切回来

```js
OKH_BRIDGE.switchTo('legacy')
```

### 3.4 查看状态

```js
OKH_BRIDGE.status()
```

输出：

```
[BRIDGE] 状态
  当前模式： gpt
  GPT 已初始化： true
  版本： 2 · 修订号： 3
  已处理消息： 3
  待演绎队列： 2 条
```

### 3.5 手动推一步（不开钩子时）

```js
OKH_BRIDGE.step(60)      // 推进 60 分钟
```

---

## 四、语义差异（重要）

两套系统的模型不完全一样，桥接只做翻译，**不强行对齐**。下面五处差异需要知道。

### 4.1 时段划分不一致

| 时间 | 我们 | GPT |
|---|---|---|
| 00:00 – 06:00 | `deep_night` | `deep_night` |
| 06:00 – 10:00 | `morning` | `morning` |
| 10:00 – 17:00 | `afternoon` | `afternoon` |
| 17:00 – 23:00 | `night` | `night` |
| **23:00 – 24:00** | **`deep_night`** | **`night`** |

**原因**：我们的 `PHASES` 有两段 `deep_night`（0-360 和 1380-1440），GPT 的 `validateConfig` 要求 id 不重复，所以桥接合并成了四段。

**影响**：深夜 23 点到 24 点，GPT 认为是 `night`。如果某个行动限定了 `phase: ['deep_night']`，在这一小时里不会被选中。

### 4.2 阶段推进机制不同

| | 我们 | GPT |
|---|---|---|
| 阶段怎么变 | `corruption` 涨到阈值自动变 | **只能由节点推进**（`nodePlan`） |
| 阶段数 | 4（normal/anomaly/sinking/subjugated） | 数字（0/1/2/3） |

**影响**：在 GPT 模式下，`corruption` 涨到 55 了，但 `stage` 可能还是 0——因为没配节点。

**要恢复自动推进**，需要在 `buildConfig()` 的 `nodes` 里加节点配置：

```js
nodes: [
  {
    id: 'stage_1',
    mode: 'result',
    fromStage: 0,
    toStage: 1,
    when: { metrics: { corruption: { gte: 30 } } },
    text: '{name} 开始有些不对劲了。'
  },
  {
    id: 'stage_2',
    mode: 'result',
    fromStage: 1,
    toStage: 2,
    when: { metrics: { corruption: { gte: 55 } } },
    text: '{name} 已经回不去了。'
  },
  {
    id: 'stage_3',
    mode: 'result',
    fromStage: 2,
    toStage: 3,
    when: { metrics: { corruption: { gte: 80 } } },
    text: '{name} 彻底臣服。'
  }
]
```

**当前桥接没有加这三个节点**，是为了「不做任何修改、仅接入」。要不要加，主人定。

### 4.3 行动选择算法不同

| | 我们 | GPT |
|---|---|---|
| 选择方式 | 效用打分 + **加权随机** | `priority` 排序取**第一个匹配** |
| 结果 | 高分更常出现，但有随机性 | 完全可预测 |

**影响**：GPT 模式下，同样的状态永远做同一件事。行为多样性下降。

**桥接的处理**：把我们的 `base` 映射成 `priority`，所以「基础吸引力高的行动」优先。但随机性没有了。

**如果要保留随机性**，需要在 `buildConfig()` 的 `actions` 里给每个行动加随机的 `priority`——但 GPT 的代码每次读 config 都是同一份，除非每次重建。

这是个待解决的问题，见第六节。

### 4.4 活动占用是 GPT 新增的概念

| | 我们 | GPT |
|---|---|---|
| 角色做完一件事 | 立刻可以再做 | 如果有 `occupation`，会**占用一段时间** |
| 占用时长 | — | `ordinaryGraceMin`（桥接设 120 分钟） |

**影响**：GPT 模式下，角色做完「去打工」会被占用 2 小时，期间不会再被安排别的行动。这是好事（更像真人），但和我们的模型不同。

### 4.5 世界事件目前没有接

我们的 `EVENT_LIBRARY`（7 个占位事件）是自定义结构，GPT 的 `events` 是另一套结构。

**桥接目前传的是空数组**：

```js
events: [],
```

**影响**：GPT 模式下，那些世界事件不会触发。

**要接的话**，需要写一个转换器，把我们的 `EVENT_LIBRARY` 转成 GPT 的 `events` 结构。这是个待办项。

---

## 五、数据映射表

### 5.1 okh → world

| okh 字段 | world 字段 | 转换 |
|---|---|---|
| `sys.total_min` | `timeMin` | 直接 |
| `player.room_id` | `playerLocation` | 直接 |
| `world.flags` | `flags` | 直接 |
| `npcs[id].location` | `npcs[id].location` | 直接 |
| `npcs[id].drives` | `npcs[id].values` | 展开 + 补全缺失 key |
| `npcs[id].corruption` | `values.corruption` | 直接 |
| `npcs[id].sanity` | `values.sanity` | 直接 |
| `npcs[id].exposure` | `values.exposure` | 直接 |
| `npcs[id].stage` | `npcs[id].stage` | `normal→0` 等 |
| `npcs[id].actions` | `npcs[id].plan` | 直接 |
| `npcs[id].lines` | `npcs[id]._lines` | 私有字段，供 allowed 钩子 |
| `gpt.bg` | `bg` | 存档回填 |

### 5.2 world → okh

| world 字段 | okh 字段 |
|---|---|
| `timeMin` | `sys.total_min` |
| `playerLocation` | `player.room_id` |
| `flags` | `world.flags` |
| `values.xxx` | `npcs[id].drives.xxx`（只写回原本存在的 key） |
| `values.corruption` | `npcs[id].corruption` |
| `stage` | `npcs[id].stage`（数字转回中文） |
| `lastAction.id` | 追加到 `npcs[id].history` |
| `bg` | `gpt.bg` |

### 5.3 行动转换

```js
我们的                                 GPT 的
─────────────────────────────────────────────────────
requires.drives: { need: '>50' }   →  when.metrics: { need: { gt: 50 } }
requires.phase: ['morning']        →  when.phase: ['morning']
requires.location: ['town']        →  when.location: ['town']
requires.flags: { a: true }        →  when.worldFlags: { a: true }
requires.corruption: '>=30'        →  when.metrics: { corruption: { gte: 30 } }
effects.drives: { need: -12 }      →  effects.add: { need: -12 }
effects.corruption: 2              →  effects.add.corruption: 2
effects.move: 'manor'              →  effects.move: 'manor'
effects.setFlags: { x: true }      →  effects.worldFlags: { x: true }
base: 28                           →  priority: 28
blockedBy: [...]                   →  _blockedBy（供 allowed 钩子）
```

**底线判定**通过 GPT 留的 `config.allowed(ctx, item)` 钩子实现：桥接在这个钩子里用我们的 `lines` 判定，被封锁的行动直接返回 `false`。

---

## 六、验证结果

```
36 项全部通过
```

| 组 | 检查项 |
|---|---|
| 加载 | 两套系统能否共存、注册表是否互相污染 |
| 翻译 | buildWorld 的每个字段是否映射正确 |
| 配置 | 时段从 0 开始、行动转换、底线保留 |
| 推演 | GPT 的 init / advance 能否跑通 |
| 回写 | world 改的东西能否写回 okh |
| 幂等 | 同一条消息重复提交是否被拦 |
| 切换 | 两个模式能否来回切 |

---

## 七、已知问题与待办

| # | 问题 | 严重度 | 处理建议 |
|---|---|---|---|
| 1 | **阶段不会自动推进** | 高 | 要在 `buildConfig().nodes` 里补三个节点 |
| 2 | **行动选择失去随机性** | 中 | 需要每次推演重建 config，给 priority 加扰动 |
| 3 | **世界事件没接** | 中 | 需要写 `EVENT_LIBRARY` → GPT `events` 的转换器 |
| 4 | 深夜一小时时段错位 | 低 | 影响 23:00-24:00 的行动匹配 |
| 5 | 活动占用与原模型不兼容 | 低 | 桥接设了 120 分钟，可调 |
| 6 | `gpt_core_all.js` 是拼接生成的 | 低 | 改源码后要重新拼接 |

### 第 1 条的临时解法

如果不想改桥接，也可以**继续用我们的系统管阶段**：

- GPT 模式下，`stage` 不会被推进
- 但 `corruption` 会正常变化
- 切回 legacy 模式时，`turn.runTurn` 会用 `stageOf(corruption)` 重新算一遍
- 所以阶段会"补上"，只是延迟了

**这不优雅，但能跑。**

---

## 八、两套系统的分工建议

基于现在的状态，肥鱼的建议是：

| 职责 | 交给谁 | 理由 |
|---|---|---|
| 时间推进 | **GPT** | 它的 `advance` 有幂等、检查点、步骤上限，比我们的健壮 |
| 活动占用 | **GPT** | 我们没有这个概念，它的保护期设计更好 |
| 行动选择 | **我们的** | 加权随机比 priority 排序更像真人 |
| 阶段推进 | **我们的** | 自动推导比配节点省事 |
| 事件 | **未定** | 两边结构不同，需要转换 |
| 数值翻译 | **我们的** | GPT 没有这层 |
| 出场判定 | **我们的** | GPT 没有四闸门 |

**换句话说：时间与占用用 GPT，决策与叙事用我们的。**

但这需要改桥接（让 GPT 只管时间，不做决策），已经超出「仅接入」的范围了。

---

*接入说明 v1.0 · 2026-11-09*
*GPT 源码未改动任何一字节*
