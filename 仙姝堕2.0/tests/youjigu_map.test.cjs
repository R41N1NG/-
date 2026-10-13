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
  assert.equal(openDate.month, 4);
  assert.equal(openDate.day, 1);

  // 1. 四月初一正常进入
  const stateInWindow = createInitialState("赵无忧", OPEN_STAMP);
  const blockOpen = checkActionBlock(stateInWindow, "g7p2");
  assert.equal(blockOpen, "");

  // 1.1 三月初三（开场白时点）进入被阻断，不与开场白冲突
  const marchStamp = dayToStamp(1578, 3, 3);
  const stateInMarch = createInitialState("赵无忧", marchStamp);
  const blockMarch = checkActionBlock(stateInMarch, "g7p2");
  assert.match(blockMarch, /并非幽寂谷开放之期/);

  // 2. 八月初一（殿主开局时点）进入被阻断
  const augustStamp = dayToStamp(1578, 8, 1);
  const stateOutOfWindow = createInitialState("浊龙殿主", augustStamp);
  const blockAugust = checkActionBlock(stateOutOfWindow, "g7p2");
  assert.match(blockAugust, /并非幽寂谷开放之期/);
});

test("【幽寂谷 2.0】测试组 2：分歧点选项与纯函数 storyCount TTL 衰减", () => {
  const { createInitialState, applyAction, getAvailableOptions } = tree;

  let state = createInitialState("自设");
  // 故事轮次第 2 轮进入幽寂谷
  let res = applyAction(state, "g7p2", 2);
  assert.ok(res.ok);
  state = res.state;
  assert.equal(state.step, "first");
  assert.equal(state.createdStoryCount, 2);

  // 在分歧点，三大互斥分支与提前离谷均可见
  let opts = getAvailableOptions(state, 2);
  assert.ok(opts.find((o) => o.id === "a7x1"), "A1 引队回营选项应存在");
  assert.ok(opts.find((o) => o.id === "b3m8"), "B1 潜行尾随选项应存在");
  assert.ok(opts.find((o) => o.id === "c9k2"), "C1 三人同行选项应存在");
  assert.ok(opts.find((o) => o.id === "z8u5"), "提前离谷选项应存在");

  // 选择 B1 潜行尾随，进入乱石深涧
  state = applyAction(state, "b3m8", 2).state;
  assert.equal(state.step, "valley_deep");

  // 在深涧中，隔门察危 (q5w4) 时效 TTL: 3
  opts = getAvailableOptions(state, 4);
  let watchOpt = opts.find((o) => o.id === "q5w4");
  assert.ok(watchOpt, "隔门察危选项应存在");
  assert.equal(watchOpt.remainingTtl, 1);

  // 推进 3 个故事轮次（storyCount = 5）：隔门察危到期隐匿
  opts = getAvailableOptions(state, 5);
  watchOpt = opts.find((o) => o.id === "q5w4");
  assert.equal(watchOpt, undefined, "隔门察危经过3轮有效故事应已超时隐匿");
});

test("【幽寂谷 2.0】测试组 3：分歧点三大路线互斥（group: yig_fork）", () => {
  const { createInitialState, applyAction, getAvailableOptions } = tree;

  let state = createInitialState("赵无忧");
  state = applyAction(state, "g7p2", 1).state;
  assert.equal(state.step, "first");

  // 三个互斥选项
  let opts = getAvailableOptions(state, 1);
  assert.ok(opts.find((o) => o.id === "a7x1"));
  assert.ok(opts.find((o) => o.id === "b3m8"));
  assert.ok(opts.find((o) => o.id === "c9k2"));

  // 玩家选择 B1 潜行尾随
  state = applyAction(state, "b3m8", 2).state;
  assert.equal(state.mutex["yig_fork"], "潜行尾随");

  // 同组 A1 与 C1 必须彻底互斥隐匿
  opts = getAvailableOptions(state, 2);
  assert.equal(opts.find((o) => o.id === "a7x1"), undefined, "同组 A1 应已互斥隐匿");
  assert.equal(opts.find((o) => o.id === "c9k2"), undefined, "同组 C1 应已互斥隐匿");
});

test("【幽寂谷 2.0】测试组 4：三大分支全链路流转与终点落账", () => {
  const { createInitialState, applyAction } = tree;

  // ── 分支 A 全链路 ──
  let stateA = createInitialState("赵无忧");
  stateA = applyAction(stateA, "g7p2", 1).state;
  stateA = applyAction(stateA, "a7x1", 2).state;
  assert.equal(stateA.step, "camp");
  stateA = applyAction(stateA, "k8d3", 3).state;
  assert.equal(stateA.step, "camp_wait");
  stateA = applyAction(stateA, "r6t2", 4).state;
  assert.equal(stateA.step, "camp_return");
  stateA = applyAction(stateA, "w2j5", 5).state;
  assert.equal(stateA.step, "done");
  assert.equal(stateA.known["玄机子胁迫过叶红缨"], true);
  assert.equal(stateA.receipt.daysCost, 2);

  // ── 分支 B 全链路 ──
  let stateB = createInitialState("赵无忧");
  stateB = applyAction(stateB, "g7p2", 1).state;
  stateB = applyAction(stateB, "b3m8", 2).state;
  assert.equal(stateB.step, "valley_deep");
  stateB = applyAction(stateB, "q5w4", 3).state;
  assert.equal(stateB.step, "chamber_gate");
  stateB = applyAction(stateB, "t7r1", 4).state;
  assert.equal(stateB.step, "chamber_inside");
  stateB = applyAction(stateB, "x8f2", 5).state;
  assert.equal(stateB.step, "chamber_rescue");
  stateB = applyAction(stateB, "v4k6", 6).state;
  assert.equal(stateB.step, "done");
  assert.equal(stateB.known["识破玄机子幽寂谷暗局"], true);
  assert.equal(stateB.known["幽寂谷救下叶红缨"], true);
  assert.ok(stateB.inventory.includes("清凉玉佩"));
  assert.equal(stateB.receipt.daysCost, 2);

  // ── 分支 C 全链路 ──
  let stateC = createInitialState("赵无忧");
  stateC = applyAction(stateC, "g7p2", 1).state;
  stateC = applyAction(stateC, "c9k2", 2).state;
  assert.equal(stateC.step, "valley_trio");
  stateC = applyAction(stateC, "m7h4", 3).state;
  assert.equal(stateC.step, "chamber_trio_gate");
  stateC = applyAction(stateC, "x3v8", 4).state;
  assert.equal(stateC.step, "chamber_trio_cleared");
  stateC = applyAction(stateC, "p6w1", 5).state;
  assert.equal(stateC.step, "done");
  assert.equal(stateC.known["幽寂谷历练安澜无恙"], true);
  assert.equal(stateC.known["挫败玄机子独行图谋"], true);
  assert.equal(stateC.receipt.daysCost, 2);
});

test("【幽寂谷 2.0】测试组 5：正常完成与提前离开天数结算", () => {
  const { createInitialState, applyAction } = tree;

  // 1. 分支 B 正常凯旋：结算 2 日
  let stateB = createInitialState("自设");
  stateB = applyAction(stateB, "g7p2", 1).state;
  stateB = applyAction(stateB, "b3m8", 2).state;
  stateB = applyAction(stateB, "q5w4", 3).state;
  stateB = applyAction(stateB, "t7r1", 4).state;
  stateB = applyAction(stateB, "x8f2", 5).state;
  let stateBExit = applyAction(stateB, "v4k6", 6).state;
  assert.equal(stateBExit.step, "done");
  assert.ok(stateBExit.receipt);
  assert.equal(stateBExit.receipt.daysCost, 2);

  // 2. 提前离开：结算 1 日
  let stateEarly = createInitialState("自设");
  stateEarly = applyAction(stateEarly, "g7p2", 1).state;
  let stateEarlyExit = applyAction(stateEarly, "z8u5", 2).state;
  assert.equal(stateEarlyExit.step, "done");
  assert.equal(stateEarlyExit.receipt.daysCost, 1);
});

test("【幽寂谷 2.0】测试组 6：正文核验严正防御（标签不能越过否定句、他人取得与未进入拦截）", () => {
  const { EVENT_DEFS } = tree;
  const { resolveActionResult, verifyProseEvidence } = evidence;

  const jadeAction = EVENT_DEFS["v4k6"]; // 终点取得清凉玉佩

  // 正例：明确取得清凉玉佩
  const textPos = "你伸手取得石榻旁的清凉玉佩，将清凉玉佩收入纳戒之中。";
  const checkPos = verifyProseEvidence(textPos, jadeAction);
  assert.equal(checkPos.ok, true);

  // 反例 1：成功标签 + 否定句（严禁放行！）
  const textTagNeg =
    '你四下搜寻，并未能找到任何清凉玉佩。<Youjigu_result id="v4k6" outcome="success"/>';
  const resTagNeg = resolveActionResult(textTagNeg, jadeAction);
  assert.equal(resTagNeg.success, false, "有成功标签但正文是否定句，必须坚决判定为失败");

  // 反例 2：旁人取得拦截
  const textBystander = "同门师姐抢先一步探手，将清凉玉佩收入怀中。";
  const resBystander = resolveActionResult(textBystander, jadeAction);
  assert.equal(resBystander.success, false, "旁人取得必须坚决拦截");

  // 反例 3：移动节点未进入拦截
  const moveAction = EVENT_DEFS["b3m8"]; // 潜行尾随
  const textMoveFail = "你止步门外，不敢深入，停下脚步并未尾随。";
  const resMoveFail = resolveActionResult(textMoveFail, moveAction);
  assert.equal(resMoveFail.success, false, "正文明确表明未能进入，必须判定失败");

  // 反例 4：空正文移动节点拦截
  const resEmpty = resolveActionResult("", moveAction);
  assert.equal(resEmpty.success, false, "空正文移动必须判定失败");

  // 漏标降级防死锁：无标签但正文正面强事实充分
  const textNoTag =
    "你小心将那一枚清凉玉佩收入掌中，妥善收入袖中。";
  const resNoTag = resolveActionResult(textNoTag, jadeAction);
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
    calendarDate: { year: 1578, month: 4, day: 3 },
    storyCount: 2,
    stat_data: { known: {} },
    pluginState: {},
  };

  const sel = plugin.select(dummySnap, "g7p2");
  assert.equal(sel.id, "g7p2");
  assert.equal(sel.allowed, true);
  assert.ok(sel.actionText.includes("幽寂谷"));
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

test("【幽寂谷 2.0】测试组 8：玄机子存活与死亡分支兼容性过滤", () => {
  const { createInitialState, checkActionBlock, applyAction } = tree;

  // 1. 玄机子存活时：三大分歧均可选
  let state = createInitialState("赵无忧", tree.OPEN_STAMP);
  state = applyAction(state, "g7p2", 1).state;
  assert.equal(state.step, "first");
  assert.equal(checkActionBlock(state, "a7x1"), "");
  assert.equal(checkActionBlock(state, "b3m8"), "");
  assert.equal(checkActionBlock(state, "c9k2"), "");

  // 2. 玄机子已身陨时：分支A与B被拦截，仅可走分支C合力同行
  const deadState = {
    ...state,
    known: { ...state.known, 玄机子已死: true },
  };
  const blockA = checkActionBlock(deadState, "a7x1");
  const blockB = checkActionBlock(deadState, "b3m8");
  const blockC = checkActionBlock(deadState, "c9k2");
  assert.match(blockA, /玄机子已身陨/);
  assert.match(blockB, /玄机子已身陨/);
  assert.equal(blockC, "");

  // 3. 验证此时在场角色过滤（不出现玄机子，隔离孤月）
  const dummySnap = {
    identity: "赵无忧",
    calendarDate: { year: 1578, month: 4, day: 5 },
    stat_data: { 在场角色: [{ 名: "赵无忧" }, { 名: "孤月" }] },
    known: { 玄机子已死: true },
    pluginState: { youjigu_map: deadState },
  };
  const prompt = plugin.getPrompt(dummySnap);
  assert.ok(prompt.includes("赵无忧、叶红缨、墨山道众弟子"));
  assert.ok(!prompt.includes("在场人物：赵无忧、孤月"));
  assert.ok(prompt.includes("玄机子已身陨"));
});
