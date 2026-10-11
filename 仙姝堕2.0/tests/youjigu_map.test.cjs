/**
 * 《仙姝堕 2.0》幽寂谷地图插件全量离线单元测试
 * ─────────────────────────────────────────────────────────────────────────────
 * 运行命令：node --test tests/youjigu_map.test.cjs
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// 使用动态 import 加载 ES Module
async function loadModules() {
  const tree = await import('../src/plugins/youjigu_map/event_tree.js');
  const evidence = await import('../src/plugins/youjigu_map/evidence.js');
  return { ...tree, ...evidence };
}

test('【幽寂谷 2.0】测试组 1：历法与时间窗口过滤', async () => {
  const { dayToStamp, stampToDate, OPEN_STAMP, CLOSE_STAMP, createInitialState, checkActionBlock } = await loadModules();

  const openDate = stampToDate(OPEN_STAMP);
  assert.equal(openDate.year, 1578);
  assert.equal(openDate.month, 3);
  assert.equal(openDate.day, 1);

  // 1. 三月初一正常进入
  const stateInWindow = createInitialState('赵无忧', OPEN_STAMP);
  const blockOpen = checkActionBlock(stateInWindow, 'g7p2');
  assert.equal(blockOpen, '');

  // 2. 八月初一（殿主开局时点）进入被阻断
  const augustStamp = dayToStamp(1578, 8, 1);
  const stateOutOfWindow = createInitialState('焚欲殿主', augustStamp);
  const blockAugust = checkActionBlock(stateOutOfWindow, 'g7p2');
  assert.match(blockAugust, /并非幽寂谷开放之期/);
});

test('【幽寂谷 2.0】测试组 2：第一轮探索与纯函数 TTL 衰减', async () => {
  const { createInitialState, applyAction, getAvailableOptions } = await loadModules();

  let state = createInitialState('自设');
  // 第 10 楼进入幽寂谷
  let res = applyAction(state, 'g7p2', 10);
  assert.ok(res.ok);
  state = res.state;
  assert.equal(state.step, 'first');
  assert.equal(state.createdFloor, 10);

  // 楼层推进 2 轮（第 12 楼）：洞府（TTL 3）与山涧（TTL 5）均可用
  let opts = getAvailableOptions(state, 12);
  let caveOpt = opts.find(o => o.id === 'k4m8');
  let streamOpt = opts.find(o => o.id === 's9a3');
  assert.ok(caveOpt, '洞府选项应存在');
  assert.ok(streamOpt, '山涧选项应存在');
  assert.equal(caveOpt.remainingTtl, 1);
  assert.equal(streamOpt.remainingTtl, 3);

  // 楼层推进 3 轮（第 13 楼）：洞府刚好到期关闭，山涧仍然可用
  opts = getAvailableOptions(state, 13);
  caveOpt = opts.find(o => o.id === 'k4m8');
  streamOpt = opts.find(o => o.id === 's9a3');
  assert.equal(caveOpt, undefined, '洞府经过3轮应已超时关闭');
  assert.ok(streamOpt, '山涧未超时仍应存在');
  assert.equal(streamOpt.remainingTtl, 2);
});

test('【幽寂谷 2.0】测试组 3：洞府内互斥组（开香炉 vs 开暗格）', async () => {
  const { createInitialState, applyAction, getAvailableOptions } = await loadModules();

  let state = createInitialState('自设');
  state = applyAction(state, 'g7p2', 1).state;
  state = applyAction(state, 'k4m8', 2).state;
  assert.equal(state.step, 'cave');

  // 洞府内有两个互斥选项：开香炉(b8n2) 与 开暗格(q3f7)
  let opts = getAvailableOptions(state, 2);
  assert.ok(opts.find(o => o.id === 'b8n2'));
  assert.ok(opts.find(o => o.id === 'q3f7'));

  // 选择开暗格
  state = applyAction(state, 'q3f7', 3).state;
  assert.equal(state.known['map_youjigu'], true, '应当已取得地图标记');
  assert.ok(state.inventory.includes('幽寂谷密室古卷'));
  assert.equal(state.mutex['cave_chest'], '开启暗格');

  // 此时开香炉应当自动隐匿，不可再选
  opts = getAvailableOptions(state, 3);
  assert.equal(opts.find(o => o.id === 'b8n2'), undefined, '同组香炉选项应已互斥隐匿');
  assert.ok(opts.find(o => o.id === 'h5w9'), '离开洞府选项应仍可用');

  // 离开洞府返回 first
  state = applyAction(state, 'h5w9', 4).state;
  assert.equal(state.step, 'first');
});

test('【幽寂谷 2.0】测试组 4：密室前置钥匙门禁', async () => {
  const { createInitialState, applyAction, advanceToSecondStage, getAvailableOptions, checkActionBlock } = await loadModules();

  // 情况 A：未持地图进入第二轮
  let stateNoMap = createInitialState('自设');
  stateNoMap = applyAction(stateNoMap, 'g7p2', 1).state;
  stateNoMap = advanceToSecondStage(stateNoMap).state;
  assert.equal(stateNoMap.step, 'second');

  const blockNoMap = checkActionBlock(stateNoMap, 'v4t7');
  assert.match(blockNoMap, /前置未达成/);

  // 情况 B：已持地图进入第二轮
  let stateWithMap = createInitialState('自设');
  stateWithMap = applyAction(stateWithMap, 'g7p2', 1).state;
  stateWithMap = applyAction(stateWithMap, 'k4m8', 2).state;
  stateWithMap = applyAction(stateWithMap, 'q3f7', 3).state; // 拿地图
  stateWithMap = applyAction(stateWithMap, 'h5w9', 4).state;
  stateWithMap = advanceToSecondStage(stateWithMap).state;

  const blockWithMap = checkActionBlock(stateWithMap, 'v4t7');
  assert.equal(blockWithMap, '', '持有地图时前往密室应被放行');

  const opts = getAvailableOptions(stateWithMap, 5);
  const secretOpt = opts.find(o => o.id === 'v4t7');
  assert.ok(secretOpt);
  assert.equal(secretOpt.blocked, '');
});

test('【幽寂谷 2.0】测试组 5：密室左右暗格互斥与结算', async () => {
  const { createInitialState, applyAction, advanceToSecondStage, getAvailableOptions } = await loadModules();

  let state = createInitialState('自设');
  state = applyAction(state, 'g7p2', 1).state;
  state = applyAction(state, 'k4m8', 2).state;
  state = applyAction(state, 'q3f7', 3).state;
  state = applyAction(state, 'h5w9', 4).state;
  state = advanceToSecondStage(state).state;
  state = applyAction(state, 'v4t7', 5).state; // 进入密室
  assert.equal(state.step, 'secret');

  // 打开左边暗格 (法宝)
  state = applyAction(state, 'p1x6', 6).state;
  assert.ok(state.inventory.includes('幽月青霜环'));
  assert.equal(state.mutex['secret_chest'], '打开左边暗格');

  // 右边暗格 (秘籍) 自动隐匿
  const opts = getAvailableOptions(state, 6);
  assert.equal(opts.find(o => o.id === 't6v4'), undefined, '右边暗格应已互斥隐匿');

  // 离开密室结算
  state = applyAction(state, 'e3j9', 7).state;
  assert.equal(state.step, 'done');
  assert.ok(state.receipt);
  assert.equal(state.receipt.daysCost, 2);
  assert.equal(state.receipt.exitType, '密室离开');
});

test('【幽寂谷 2.0】测试组 6：正文事实核验正例与否定句反例拦截', async () => {
  const { EVENT_DEFS, verifyProseEvidence } = await loadModules();

  const slotAction = EVENT_DEFS['q3f7']; // 开启暗格，目标取得幽寂谷密室古卷

  // 正例 1：明确取出古卷
  const textPos1 = '你伸手探入暗格深处，指尖触到冰凉绢帛，小心将那一卷泛着微光的古卷残图取出收好。';
  const checkPos1 = verifyProseEvidence(textPos1, slotAction);
  assert.equal(checkPos1.ok, true);

  // 正例 2：收入纳戒
  const textPos2 = '石壁机关洞开，一卷散发灵光的幽寂谷密室古卷现出，你顺势将其收入纳戒之中。';
  const checkPos2 = verifyProseEvidence(textPos2, slotAction);
  assert.equal(checkPos2.ok, true);

  // 反例 1：否定句拦截（扑空）
  const textNeg1 = '你虽然摸索到了暗格，然而内里空空如也，并未能找到任何地图古卷。';
  const checkNeg1 = verifyProseEvidence(textNeg1, slotAction);
  assert.equal(checkNeg1.ok, false);

  // 反例 2：旁观他人
  const textNeg2 = '你立在阴影中旁观，只见远处那名黑袍修士探手取走了石壁里的古卷。';
  const checkNeg2 = verifyProseEvidence(textNeg2, slotAction);
  assert.equal(checkNeg2.ok, false);

  // 反例 3：计划假象
  const textNeg3 = '你暗自打算稍后便去开启暗格取走古卷，眼下仍需防备四周动静。';
  const checkNeg3 = verifyProseEvidence(textNeg3, slotAction);
  assert.equal(checkNeg3.ok, false);
});

test('【幽寂谷 2.0】测试组 7：回执标签与漏标降级防死锁', async () => {
  const { EVENT_DEFS, resolveActionResult } = await loadModules();

  const herbAction = EVENT_DEFS['n5z8']; // 收集草药

  // 1. 正常带标签
  const textWithTag = '山风拂过，你采下崖边生长的幽寂紫灵芝收入囊中。<Youjigu_result id="n5z8" outcome="success"/>';
  const res1 = resolveActionResult(textWithTag, herbAction);
  assert.equal(res1.success, true);
  assert.equal(res1.mode, 'TAG_CONFIRMED');

  // 2. 标签明确拒绝
  const textFail = '妖兽突袭，你被迫退开。<Youjigu_result id="n5z8" outcome="failure"/>';
  const res2 = resolveActionResult(textFail, herbAction);
  assert.equal(res2.success, false);
  assert.equal(res2.mode, 'TAG_REJECTED');

  // 3. 核心降级防死锁（模型漏标，但正文事实取得充分）
  const textNoTag = '你在陡峭崖石间小心攀援，终于将那一株通体紫蕴的幽寂紫灵芝采下，妥帖放入灵玉匣中收起。';
  const res3 = resolveActionResult(textNoTag, herbAction);
  assert.equal(res3.success, true, '漏标但事实明确，应触发降级放行');
  assert.equal(res3.mode, 'FALLBACK_PROSE_CONFIRMED');

  // 4. 漏标且事实未达成
  const textUndone = '你远远看着那株紫灵芝，四周毒瘴弥漫，一时难以靠近。';
  const res4 = resolveActionResult(textUndone, herbAction);
  assert.equal(res4.success, false);
  assert.equal(res4.mode, 'PENDING_UNRESOLVED');
});
