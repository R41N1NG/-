"use strict";

/**
 * 《仙姝堕 2.0》幽寂谷地图事件树纯函数引擎
 * ─────────────────────────────────────────────────────────────────────────────
 * 核心特性：
 * 1. 窗口期时间过滤：仙盟历 1578.3.1 至 1578.4.30；
 * 2. 轮次 TTL 衰减采用已完成故事轮次（storyCount）纯函数计算，天然免疫楼层计数与撤回污染；
 * 3. 互斥组（Mutex）选其一即整组隐匿（洞府香炉 vs 暗格；密室左暗格 vs 右暗格）；
 * 4. 离开即深入：离开洞府/山涧直接进入 second（谷中腹地），无需额外中间过渡；
 * 5. 密室前置钥匙门禁（需持 map_youjigu）；
 * 6. 统一通用奖励名称（草药、法宝、秘籍、幽寂谷地图、丹药）；
 * 7. 退出确认机制（出口离开2日、密室离开2日、提前离开1日）。
 */

// 历法日期换算为连续整数日 (360日/年, 30日/月)
const dayToStamp = (y, m, d) => y * 360 + (m - 1) * 30 + d - 1;
const stampToDate = (n) => {
  const y = Math.floor(n / 360);
  const r = n - y * 360;
  const m = Math.floor(r / 30) + 1;
  const d = (r % 30) + 1;
  return {
    year: y,
    month: m,
    day: d,
    text: `仙盟历 ${y}年 ${m}月 ${d}日`,
    floatCalendar: Number((y + m / 100 + ((d - 1) / 30) * 0.005).toFixed(4)),
  };
};

const OPEN_STAMP = dayToStamp(1578, 3, 1);
const CLOSE_STAMP = dayToStamp(1578, 4, 30);

const OPEN_DATE = { year: 1578, month: 3, day: 1 };
const CLOSE_DATE = { year: 1578, month: 4, day: 30 };

const CONFIG = {
  completeDays: 2,
  earlyDays: 1,
  narrativeBudget: "本次事件世界日期仅在退出结算时推进：正常离开两日，提前离开一日。",
  status: "用户已确认通用奖励及耗时",
};

/**
 * 绝对定位坐标表（[短地点名, left%, top%]）
 * 严格沿用主人确认的真实大地图圆点坐标
 */
const PINS = {
  g7p2: ["幽寂谷", 46, 54],
  k4m8: ["洞府", 34, 40],
  s9a3: ["山涧", 61, 39],
  b8n2: ["香炉", 26, 25],
  q3f7: ["暗格", 44, 27],
  h5w9: ["谷口", 46, 54],
  r2c6: ["溪水", 54, 25],
  a6d4: ["树丛", 75, 29],
  j8e1: ["谷口", 46, 54],
  u9h3: ["山谷", 69, 65],
  v4t7: ["密室", 37, 72],
  n5z8: ["草药", 77, 48],
  l7q2: ["出口", 83, 76],
  p1x6: ["左侧暗格", 25, 59],
  t6v4: ["右侧暗格", 45, 88],
  e3j9: ["出口", 22, 88],
  z8u5: ["离谷", 19, 73],
};

/**
 * 幽寂谷全事件节点定义
 * 通用奖励名称：丹药、幽寂谷地图、草药、法宝、秘籍
 */
const EVENT_DEFS = {
  g7p2: {
    id: "g7p2",
    label: "进入幽寂谷",
    actionText: "进入幽寂谷探查",
    prompt: "只演绎步入幽寂谷入口，山风萧瑟，不提前揭示洞府或山涧深处细节。",
    from: "map",
    to: "first",
    open: OPEN_DATE,
    close: CLOSE_DATE,
  },
  k4m8: {
    id: "k4m8",
    label: "探索洞府",
    actionText: "循小径前往幽寂谷洞府探寻",
    prompt: "只演绎来到洞府石门前并进入洞府，不提前开启香炉或暗格。",
    from: "first",
    to: "cave",
    ttl: 3,
  },
  s9a3: {
    id: "s9a3",
    label: "探索山涧",
    actionText: "顺流水沿山涧深入探查",
    prompt: "只演绎沿溪涧行进，水声潺潺，不提前触发其他遭遇。",
    from: "first",
    to: "stream",
    ttl: 5,
  },
  b8n2: {
    id: "b8n2",
    label: "开启香炉",
    actionText: "小心上前开启洞府中央的青铜古香炉",
    prompt: "演绎开启香炉并取出其中遗留的灵丹，注意同组暗格将不可再启。",
    from: "cave",
    group: "cave",
    reward: "丹药",
    rewards: ["丹药"],
    summaryNote: "开启了洞中古香炉，取得丹药",
  },
  q3f7: {
    id: "q3f7",
    label: "开启暗格",
    actionText: "细细摸索洞壁机关，开启石壁暗格",
    prompt: "演绎摸索石壁开启暗格，取得幽寂谷地图残卷，注意同组香炉将不可再启。",
    from: "cave",
    group: "cave",
    reward: "幽寂谷地图",
    rewards: ["幽寂谷地图"],
    known: "map_youjigu",
    grantsKnown: ["map_youjigu"],
    summaryNote: "开启洞壁暗格，取得幽寂谷地图",
  },
  h5w9: {
    id: "h5w9",
    label: "离开洞府",
    actionText: "退出洞府，继续深入谷中",
    prompt: "演绎退出洞府，不再折返，径直穿过谷口岔路深入幽寂谷第二轮腹地。",
    from: "cave",
    to: "second",
    summaryNote: "离开洞府，深入谷中",
  },
  r2c6: {
    id: "r2c6",
    label: "查看溪水",
    actionText: "驻足细看溪水中流动的荧光暗影",
    prompt: "演绎细观山涧溪流清波，察看水底灵气异象。",
    from: "stream",
    summaryNote: "查看了山涧溪水",
  },
  a6d4: {
    id: "a6d4",
    label: "查看树丛",
    actionText: "拨开溪畔繁茂的草丛查探",
    prompt: "演绎拨开溪畔草丛，查探四周痕迹。",
    from: "stream",
    summaryNote: "查看了溪畔树丛",
  },
  j8e1: {
    id: "j8e1",
    label: "离开山涧",
    actionText: "退出山涧，继续深入谷中",
    prompt: "演绎离开溪水山涧，不再折返，径直深入幽寂谷第二轮腹地。",
    from: "stream",
    to: "second",
    summaryNote: "离开山涧，深入谷中",
  },
  u9h3: {
    id: "u9h3",
    label: "前往山谷",
    actionText: "离开岔路，向幽寂谷深处山谷行进",
    prompt: "演绎穿过谷中岔路，行至生有灵草的幽静山谷。",
    from: "second",
    to: "valley",
  },
  v4t7: {
    id: "v4t7",
    label: "前往密室",
    actionText: "对照幽寂谷地图指引，寻出石壁裂隙后的隐蔽密室",
    prompt: "演绎持地图辨认方位，开启隐蔽石隙步入密室。",
    from: "second",
    to: "secret",
    requires: ["map_youjigu"],
  },
  n5z8: {
    id: "n5z8",
    label: "收集草药",
    actionText: "俯身采下崖边生长的灵草",
    prompt: "演绎在山谷崖壁处寻得并采摘草药，收入囊中。",
    from: "valley",
    reward: "草药",
    rewards: ["草药"],
    summaryNote: "采得草药一株",
  },
  l7q2: {
    id: "l7q2",
    label: "从出口离开",
    actionText: "顺着谷口山径离开幽寂谷",
    prompt: "演绎完成谷中探索，顺山径整装出谷，本次历练圆满结束。",
    from: "valley",
    finish: true,
    exitDays: 2,
    confirmText: "确定离开幽寂谷并结束本次行程？（耗时2日）",
    exitType: "出口离开",
  },
  p1x6: {
    id: "p1x6",
    label: "打开左边暗格",
    actionText: "凝神按动机关，启开密室左侧的青玉石格",
    prompt: "演绎开启密室左侧石格，取得法宝，右侧暗格随即封死。",
    from: "secret",
    group: "secret",
    reward: "法宝",
    rewards: ["法宝"],
    summaryNote: "取得密室左侧法宝",
  },
  t6v4: {
    id: "t6v4",
    label: "打开右边暗格",
    actionText: "小心探手推开密室右侧的沉香暗格",
    prompt: "演绎开启密室右侧暗格，取得秘籍，左侧暗格随即封死。",
    from: "secret",
    group: "secret",
    reward: "秘籍",
    rewards: ["秘籍"],
    summaryNote: "取得密室右侧秘籍",
  },
  e3j9: {
    id: "e3j9",
    label: "离开密室",
    actionText: "收拾齐备，自隐蔽出口离去",
    prompt: "演绎离开密室暗道，结束本次幽寂谷行程。",
    from: "secret",
    finish: true,
    exitDays: 2,
    confirmText: "确定离开幽寂谷并结束本次行程？（耗时2日）",
    exitType: "密室离开",
  },
  z8u5: {
    id: "z8u5",
    label: "提前离开幽寂谷",
    actionText: "不再深入探寻，及早收步折返",
    prompt: "演绎因故决定提前折返，收拾行装离谷。",
    from: "*",
    early: true,
    exitDays: 1,
    confirmText: "确定提前离开幽寂谷？（耗时1日）",
    exitType: "提前离开",
  },
};

/**
 * 创建纯净初始状态
 */
function createInitialState(identity = "自设", currentStamp = OPEN_STAMP) {
  return {
    version: 2,
    identity,
    currentStamp,
    step: "map",
    turn: 0,
    createdStoryCount: 0,
    visited: [],
    used: [],
    mutex: {},
    known: {},
    inventory: [],
    log: [],
    receipt: null,
    runCount: 0,
  };
}

/**
 * 校验某动作是否被阻断
 */
function checkActionBlock(state, actionId, storyCount = 0) {
  const def = EVENT_DEFS[actionId];
  if (!def) return "未知或非法的事件代码";

  // 通用提前离开规则
  if (def.from === "*") {
    if (["map", "done"].includes(state.step))
      return "当前未处于活动中的幽寂谷探索";
    return "";
  }

  // 阶段匹配
  if (def.from !== state.step) return "当前场景与该步骤不匹配";

  // 已经执行过
  if (state.used.includes(actionId)) return "该项机缘已探索完毕";

  // 时间窗口校验
  if (
    def.from === "map" &&
    (state.currentStamp < OPEN_STAMP || state.currentStamp > CLOSE_STAMP)
  ) {
    return "当前时令并非幽寂谷开放之期（限仙盟历1578年三至四月）";
  }

  // 轮次 TTL 衰减判定（以已完成故事轮次 storyCount 为准）
  if (def.ttl && state.createdStoryCount !== undefined) {
    const elapsed = Math.max(0, storyCount - state.createdStoryCount);
    if (elapsed >= def.ttl) {
      return `该选项已超时关闭（时效持续 ${def.ttl} 轮，已过 ${elapsed} 轮）`;
    }
  }

  // 互斥组已选择判定
  if (def.group && state.mutex[def.group]) {
    return `同组机缘已选「${state.mutex[def.group]}」，此选项不可重复获取`;
  }

  // 前置钥匙门禁
  if (def.requires) {
    const reqs = Array.isArray(def.requires) ? def.requires : [def.requires];
    for (const req of reqs) {
      if (!state.known[req]) return "前置未达成：尚无此地指引线索或地图残卷";
    }
  }

  return "";
}

/**
 * 获取当前步骤下所有合法选项（纯函数）
 */
function getAvailableOptions(state, storyCount = 0) {
  const results = [];
  if (!state || ["done"].includes(state.step)) return results;

  // 如果处于 first 且洞府和山涧都已过期或用完，兜底允许进入 second
  const firstOptionsRemaining = Object.entries(EVENT_DEFS).filter(
    ([id, def]) =>
      def.from === "first" &&
      !state.used.includes(id) &&
      !(def.ttl && storyCount - state.createdStoryCount >= def.ttl),
  );

  for (const [id, def] of Object.entries(EVENT_DEFS)) {
    const isStepMatch =
      def.from === state.step ||
      (def.from === "*" && !["map", "done"].includes(state.step));
    if (!isStepMatch) continue;

    // 已使用排除
    if (state.used.includes(id)) continue;

    // 互斥已封死排除（整组直接不显示）
    if (def.group && state.mutex[def.group]) continue;

    const blockReason = checkActionBlock(state, id, storyCount);

    // TTL 超时直接隐匿排除
    if (def.ttl && storyCount - state.createdStoryCount >= def.ttl) {
      continue;
    }

    let remainingTtl = null;
    if (def.ttl) {
      const elapsed = Math.max(0, storyCount - state.createdStoryCount);
      remainingTtl = Math.max(0, def.ttl - elapsed);
    }

    results.push({
      ...def,
      blocked: blockReason,
      remainingTtl,
      pin: PINS[id] || null,
    });
  }

  // 若处于 first 且全部入口均已过期或执行完毕，提供自动过渡到 second 的节点
  if (state.step === "first" && firstOptionsRemaining.length === 0) {
    results.push({
      id: "u9h3",
      label: "前往山谷",
      actionText: "离开岔路，向幽寂谷深处山谷行进",
      from: "first",
      to: "valley",
      blocked: "",
      remainingTtl: null,
      pin: PINS["u9h3"],
    });
  }

  return results;
}

/**
 * 应用行动推进状态（纯函数，返回不可变新状态）
 */
function applyAction(state, actionId, storyCount = 0) {
  const block = checkActionBlock(state, actionId, storyCount);
  if (block) {
    return { ok: false, error: block, state };
  }

  const nextState = structuredClone(state);
  const def = EVENT_DEFS[actionId];

  nextState.used.push(actionId);
  nextState.log.push(def.label);

  // 记录互斥
  if (def.group) {
    nextState.mutex[def.group] = def.label;
  }

  // 记录获得物品与 known 标记
  if (def.reward) {
    nextState.inventory.push(def.reward);
  }
  if (def.known) {
    nextState.known[def.known] = true;
  }
  if (def.grantsKnown) {
    def.grantsKnown.forEach((k) => {
      nextState.known[k] = true;
    });
  }
  if (def.summaryNote) {
    nextState.log.push(def.summaryNote);
  }

  // 场景流转
  if (def.to) {
    nextState.step = def.to;
    if (def.from === "map") {
      nextState.createdStoryCount = storyCount;
      nextState.runCount++;
    }
    if (
      ["cave", "stream"].includes(def.to) &&
      !nextState.visited.includes(def.to)
    ) {
      nextState.visited.push(def.to);
    }
  }

  // 退出结算
  if (def.finish || def.early) {
    const daysCost =
      def.exitDays || (def.early ? CONFIG.earlyDays : CONFIG.completeDays);
    const startStamp = nextState.currentStamp;
    const finalStamp = startStamp + daysCost;

    nextState.receipt = {
      runId: `youjigu_run_${nextState.runCount}`,
      exitType: def.exitType || (def.early ? "提前离开" : "正常完成"),
      daysCost,
      startStamp,
      finalStamp,
      dateText: stampToDate(finalStamp).text,
      rewards: [...nextState.inventory],
      summaryLog: [...nextState.log],
    };

    nextState.currentStamp = finalStamp;
    nextState.step = "done";
  }

  return { ok: true, state: nextState };
}

/**
 * 预留互斥动作（领奖与预留分离）
 */
function reserveAction(state, actionId) {
  const block = checkActionBlock(state, actionId, state.createdStoryCount || 0);
  if (block) return { ok: false, error: block, state };
  const nextState = structuredClone(state);
  const def = EVENT_DEFS[actionId];
  if (def.group) nextState.mutex[def.group] = def.label;
  return { ok: true, state: nextState };
}

/**
 * 释放预留（撤销或失败时）
 */
function releaseReservedAction(state, actionId) {
  const nextState = structuredClone(state);
  const def = EVENT_DEFS[actionId];
  if (
    def?.group &&
    nextState.mutex[def.group] === def.label &&
    !nextState.used.includes(actionId)
  ) {
    delete nextState.mutex[def.group];
  }
  return nextState;
}

module.exports = {
  dayToStamp,
  stampToDate,
  OPEN_STAMP,
  CLOSE_STAMP,
  OPEN_DATE,
  CLOSE_DATE,
  CONFIG,
  PINS,
  EVENT_DEFS,
  createInitialState,
  checkActionBlock,
  getAvailableOptions,
  applyAction,
  reserveAction,
  releaseReservedAction,
};
