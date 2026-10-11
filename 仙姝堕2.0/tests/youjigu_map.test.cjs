"use strict";

/**
 * 《仙姝堕 2.0》幽寂谷地图插件全量离线单元测试
 * ─────────────────────────────────────────────────────────────────────────────
 * 运行命令：node --test tests/youjigu_map.test.cjs
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const tree = require("../src/plugins/youjigu_map/event_tree");
const evidence = require("../src/plugins/youjigu_map/evidence");
const plugin = require("../src/plugins/youjigu_map/index");

test("【幽寂谷 2.0】测试组 1：历法与时间窗口过滤", () => {
  const { dayToStamp, stampToDate, OPEN_STAMP, createInitialState, checkActionBlock } = tree;

  const openDate = stampToDate(OPEN_STAMP);
  assert.equal(openDate.year, 1578);
  assert.equal(openDate.month, 3);
  assert.equal(openDate.day, 1);

  // 1. 三月初一正常进入
  const stateInWindow = createInitialState("赵无忧", OPEN_STAMP);
  const blockOpen = checkActionBlock(stateInWindow, "g7p2");
  assert.equal(blockOpen, "");

  // 2. 八月初一（殿主开局时点）进入被阻断
  const augustStamp = dayToStamp(1578, 8, 1);
  const stateOutOfWindow = createInitialState("浊龙殿主", augustStamp);
  const blockAugust = checkActionBlock(stateOutOfWindow, "g7p2");
  assert.match(blockAugust, /并非幽寂谷开放之期/);
});

test("【幽寂谷 2.0】测试组 2：第一轮探索与纯函数 storyCount TTL 衰减", () => {
  const { createInitialState, applyAction, getAvailableOptions } = tree;

  let state = createInitialState("自设");
  // 故事轮次第 2 轮进入幽寂谷
  let res = applyAction(state, "g7p2", 2);
  assert.ok(res.ok);
  state = res.state;
  assert.equal(state.step, "first");
  assert.equal(state.createdStoryCount, 2);

  // 推进 2 个故事轮次（storyCount = 4）：洞府(ttl:3)剩1轮，山涧(ttl:5)剩3轮
  let opts = getAvailableOptions(state, 4);
  let caveOpt = opts.find((o) => o.id === "k4m8");
  let streamOpt = opts.find((o) => o.id === "s9a3");
  assert.ok(caveOpt, "洞府选项应存在");
  assert.ok(streamOpt, "山涧选项应存在");
  assert.equal(caveOpt.remainingTtl, 1);
  assert.equal(streamOpt.remainingTtl, 3);

  // 推进 3 个故事轮次（storyCount = 5）：洞府到期隐匿，山涧仍可用
  opts = getAvailableOptions(state, 5);
  caveOpt = opts.find((o) => o.id === "k4m8");
  streamOpt = opts.find((o) => o.id === "s9a3");
  assert.equal(caveOpt, undefined, "洞府经过3轮有效故事应已超时隐匿");
  assert.ok(streamOpt, "山涧未超时仍应存在");
  assert.equal(streamOpt.remainingTtl, 2);
});

test("【幽寂谷 2.0】测试组 3：洞府内互斥组（开香炉 vs 开暗格）与离开即深入", () => {
  const { createInitialState, applyAction, getAvailableOptions } = tree;

  let state = createInitialState("自设");
  state = applyAction(state, "g7p2", 1).state;
  state = applyAction(state, "k4m8", 2).state;
  assert.equal(state.step, "cave");

  // 洞府内有两个互斥选项：开香炉(b8n2) 与 开暗格(q3f7)
  let opts = getAvailableOptions(state, 2);
  assert.ok(opts.find((o) => o.id === "b8n2"));
  assert.ok(opts.find((o) => o.id === "q3f7"));

  // 选择开暗格
  state = applyAction(state, "q3f7", 3).state;
  assert.equal(state.known["map_youjigu"], true, "应当已取得地图标记");
  assert.ok(state.inventory.includes("幽寂谷地图"), "取得通用名称幽寂谷地图");
  assert.equal(state.mutex["cave"], "开启暗格");

  // 此时香炉应当自动隐匿，整组不可再选
  opts = getAvailableOptions(state, 3);
  assert.equal(
    opts.find((o) => o.id === "b8n2"),
    undefined,
    "同组香炉选项应已互斥隐匿",
  );
  assert.ok(opts.find((o) => o.id === "h5w9"), "离开洞府选项可用");

  // 离开洞府：离开即深入！直接进入 second
  state = applyAction(state, "h5w9", 4).state;
  assert.equal(
    state.step,
    "second",
    "离开洞府直接同楼深入进入 second，无需额外中间过渡",
  );
});

test("【幽寂谷 2.0】测试组 4：密室前置钥匙门禁", () => {
  const { createInitialState, applyAction, checkActionBlock, getAvailableOptions } = tree;

  // 情况 A：未持地图走山涧离开深入第二轮
  let stateNoMap = createInitialState("自设");
  stateNoMap = applyAction(stateNoMap, "g7p2", 1).state;
  stateNoMap = applyAction(stateNoMap, "s9a3", 2).state;
  stateNoMap = applyAction(stateNoMap, "j8e1", 3).state; // 离开山涧即深入
  assert.equal(stateNoMap.step, "second");

  const blockNoMap = checkActionBlock(stateNoMap, "v4t7");
  assert.match(blockNoMap, /前置未达成/);

  // 情况 B：已持地图深入第二轮
  let stateWithMap = createInitialState("自设");
  stateWithMap = applyAction(stateWithMap, "g7p2", 1).state;
  stateWithMap = applyAction(stateWithMap, "k4m8", 2).state;
  stateWithMap = applyAction(stateWithMap, "q3f7", 3).state; // 获得地图
  stateWithMap = applyAction(stateWithMap, "h5w9", 4).state; // 离开即深入
  assert.equal(stateWithMap.step, "second");

  const blockWithMap = checkActionBlock(stateWithMap, "v4t7");
  assert.equal(blockWithMap, "", "持有地图时前往密室应被放行");

  const opts = getAvailableOptions(stateWithMap, 5);
  const secretOpt = opts.find((o) => o.id === "v4t7");
  assert.ok(secretOpt);
  assert.equal(secretOpt.blocked, "");
});

test("【幽寂谷 2.0】测试组 5：密室左右暗格互斥与三种退出天数结算", () => {
  const { createInitialState, applyAction, getAvailableOptions } = tree;

  let state = createInitialState("自设");
  state = applyAction(state, "g7p2", 1).state;
  state = applyAction(state, "k4m8", 2).state;
  state = applyAction(state, "q3f7", 3).state;
  state = applyAction(state, "h5w9", 4).state; // 深入 second
  state = applyAction(state, "v4t7", 5).state; // 进入密室
  assert.equal(state.step, "secret");

  // 打开左边暗格 (法宝)
  state = applyAction(state, "p1x6", 6).state;
  assert.ok(state.inventory.includes("法宝"), "取得通用名称法宝");
  assert.equal(state.mutex["secret"], "打开左边暗格");

  // 右边暗格 (秘籍) 自动隐匿
  const opts = getAvailableOptions(state, 6);
  assert.equal(opts.find((o) => o.id === "t6v4"), undefined, "右边暗格应已互斥隐匿");

  // 1. 密室离开：结算 2 日
  let stateSecretExit = applyAction(state, "e3j9", 7).state;
  assert.equal(stateSecretExit.step, "done");
  assert.ok(stateSecretExit.receipt);
  assert.equal(stateSecretExit.receipt.daysCost, 2);

  // 2. 出口离开：结算 2 日
  let stateValley = createInitialState("自设");
  stateValley = applyAction(stateValley, "g7p2", 1).state;
  stateValley = applyAction(stateValley, "s9a3", 2).state;
  stateValley = applyAction(stateValley, "j8e1", 3).state;
  stateValley = applyAction(stateValley, "u9h3", 4).state; // 前往山谷
  stateValley = applyAction(stateValley, "n5z8", 5).state; // 采草药
  assert.ok(stateValley.inventory.includes("草药"), "取得通用名称草药");
  let stateValleyExit = applyAction(stateValley, "l7q2", 6).state;
  assert.equal(stateValleyExit.step, "done");
  assert.equal(stateValleyExit.receipt.daysCost, 2);

  // 3. 提前离开：结算 1 日
  let stateEarly = createInitialState("自设");
  stateEarly = applyAction(stateEarly, "g7p2", 1).state;
  let stateEarlyExit = applyAction(stateEarly, "z8u5", 2).state;
  assert.equal(stateEarlyExit.step, "done");
  assert.equal(stateEarlyExit.receipt.daysCost, 1);
});

test("【幽寂谷 2.0】测试组 6：正文核验严正防御（标签不能越过否定句、他人取得与未进入拦截）", () => {
  const { EVENT_DEFS } = tree;
  const { resolveActionResult, verifyProseEvidence } = evidence;

  const slotAction = EVENT_DEFS["q3f7"]; // 开启暗格，目标取得幽寂谷地图

  // 正例：明确取得地图残卷
  const textPos = "你伸手探入石壁暗格，将那一卷泛着灵光的幽寂谷地图收入囊中。";
  const checkPos = verifyProseEvidence(textPos, slotAction);
  assert.equal(checkPos.ok, true);

  // 反例 1：成功标签 + 否定句（严禁放行！）
  const textTagNeg =
    '你翻找了半晌，暗格内空空如也，并未能找到任何地图。<Youjigu_result id="q3f7" outcome="success"/>';
  const resTagNeg = resolveActionResult(textTagNeg, slotAction);
  assert.equal(resTagNeg.success, false, "有成功标签但正文是否定句，必须坚决判定为失败");

  // 反例 2：旁人取得拦截
  const textBystander = "同门师姐抢先一步探手，将暗格中的幽寂谷地图收入纳戒。";
  const resBystander = resolveActionResult(textBystander, slotAction);
  assert.equal(resBystander.success, false, "旁人取得必须坚决拦截");

  // 反例 3：无奖励移动节点未进入拦截
  const moveAction = EVENT_DEFS["k4m8"]; // 探索洞府
  const textMoveFail = "你来到洞府前，然而禁制强大，停下脚步并未进入。";
  const resMoveFail = resolveActionResult(textMoveFail, moveAction);
  assert.equal(resMoveFail.success, false, "正文明确表明未能进入，必须判定失败");

  // 反例 4：空正文移动节点拦截
  const resEmpty = resolveActionResult("", moveAction);
  assert.equal(resEmpty.success, false, "空正文移动必须判定失败");

  // 漏标降级防死锁：无标签但正文正面强事实充分
  const herbAction = EVENT_DEFS["n5z8"];
  const textNoTag =
    "你俯身在崖畔石缝间，小心将一株成熟的草药采下，妥善收入袖中。";
  const resNoTag = resolveActionResult(textNoTag, herbAction);
  assert.equal(resNoTag.success, true);
  assert.equal(resNoTag.mode, "FALLBACK_PROSE_CONFIRMED");
});

test("【幽寂谷 2.0】测试组 7：插件 select / settle 契约与框架统一对接", async () => {
  assert.equal(plugin.id, "youjigu_map");
  assert.equal(plugin.version, "2.0.0");

  // 1. 测试 select 返回规范
  const dummySnap = {
    chatId: "c1",
    branchId: "b1",
    floor: 3,
    revision: 1,
    identity: "赵无忧",
    calendarDate: { year: 1578, month: 3, day: 3 },
    storyCount: 2,
    stat_data: { known: { map_youjigu: true } },
    pluginState: {},
  };

  const sel = plugin.select(dummySnap, "g7p2");
  assert.equal(sel.id, "g7p2");
  assert.equal(sel.allowed, true);
  assert.equal(sel.actionText, "进入幽寂谷探查");
  assert.ok(sel.prompt);

  // 2. 测试 settle 成功结果规范
  const pending = {
    pluginId: "youjigu_map",
    nodeId: "g7p2",
    actionText: sel.actionText,
    selection: sel,
  };

  const replyBody =
    '你深吸一口气，拨开谷口乱石与垂藤，正式步入幽寂谷之中。<Youjigu_result id="g7p2" outcome="success"/>';
  const settled = await plugin.settle(dummySnap, pending, replyBody);

  assert.equal(settled.outcome, "success");
  assert.ok(settled.pluginState);
  assert.equal(settled.pluginState.step, "first");
  assert.ok(settled.activeEvent);
  assert.equal(settled.activeEvent.id, "youjigu");
  assert.equal(settled.activeEvent.pluginId, "youjigu_map");
});
