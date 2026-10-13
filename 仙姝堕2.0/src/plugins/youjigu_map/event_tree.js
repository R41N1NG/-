"use strict";

/**
 * 《仙姝堕 2.0》幽寂谷地图事件树纯函数引擎
 * ─────────────────────────────────────────────────────────────────────────────
 * 核心特性：
 * 1. 窗口期时间过滤：仙盟历 1578.3.1 至 1578.4.30；
 * 2. 入口斩熊后三分歧强互斥（group: "yig_fork"）：
 *    - 分支 A (a7x1)：大局为重·引队回营 -> 营地驻守 (k8d3) -> 归营相迎 (r6t2) -> 整队回宗 (w2j5, finish, 耗时2日, known: 玄机子胁迫过叶红缨)
 *    - 分支 B (b3m8)：疑窦暗生·潜行尾随 -> 隔门察危 (q5w4, TTL:3) -> 阵力破门 (t7r1) -> 石室决断 (x8f2, 自由回合) -> 凯旋归宗 (v4k6, finish, 耗时2日, 缴获【清凉玉佩】, known: 识破玄机子幽寂谷暗局, 幽寂谷救下叶红缨)
 *    - 分支 C (c9k2)：力辞分兵·三人同行 -> 洞前对峙 (m7h4) -> 探勘石室 (x3v8, 自由回合) -> 平稳归宗 (p6w1, finish, 耗时2日, known: 幽寂谷历练安澜无恙, 挫败玄机子独行图谋)
 * 3. 提前离谷 (z8u5)：全时段可选（finish: true, 耗时1日）；
 * 4. 轮次 TTL 衰减采用已完成故事轮次（storyCount）纯函数计算；
 * 5. 退出确认机制（正常完成2日、提前离开1日）。
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

const OPEN_STAMP = dayToStamp(1578, 4, 1);
const CLOSE_STAMP = dayToStamp(1578, 5, 30);

const OPEN_DATE = { year: 1578, month: 4, day: 1 };
const CLOSE_DATE = { year: 1578, month: 5, day: 30 };

const CONFIG = {
  completeDays: 2,
  earlyDays: 1,
  narrativeBudget:
    "本次事件世界日期仅在退出结算时推进：正常离开两日，提前离开一日。",
  status: "幽寂谷三大互斥分支及结算机制已上线",
};

/**
 * 绝对定位坐标表（[短地点名, left%, top%]）
 */
const PINS = {
  g7p2: ["幽寂谷", 46, 54],

  // 分歧点圆点（进入幽寂谷后的选择）
  a7x1: ["引队回营", 34, 40],
  b3m8: ["潜行尾随", 61, 39],
  c9k2: ["三人同行", 48, 30],
  z8u5: ["提前离谷", 19, 73],

  // 分支 A（原著宿命线）圆点
  k8d3: ["营地驻守", 30, 48],
  r6t2: ["归营相迎", 42, 52],
  w2j5: ["整队回宗", 83, 76],

  // 分支 B（破局营救线）圆点
  q5w4: ["隔门察危", 58, 48],
  t7r1: ["阵力破门", 65, 55],
  x8f2: ["石室残局", 70, 62],
  v4k6: ["凯旋归宗", 83, 76],

  // 分支 C（正面制衡线）圆点
  m7h4: ["洞前对峙", 50, 42],
  x3v8: ["探勘石室", 56, 52],
  p6w1: ["平稳归宗", 83, 76],
};

/**
 * 幽寂谷全事件节点定义
 */
const EVENT_DEFS = {
  g7p2: {
    id: "g7p2",
    label: "进入幽寂谷",
    actionText: "奉炎雷子法旨，率队前往幽寂谷历练除害",
    prompt:
      "【承接上文与剧情过渡铁律】\n" +
      "1. 必须自然承接上文对话与交互，交代与当前在场人物（如侍女孤月等）交谈告一段落并嘱其留守山门据点；\n" +
      "2. 随后奉师尊【炎雷子】法旨严令安排，由二师兄玄机子（若存活）、五师姐叶红缨、六师弟赵无忧一同领命，率领二十名墨山道筑基精锐弟子整队启程，御乘飞舟前往幽寂谷除害历练；\n" +
      "3. 【人员隔离铁律】此前在场的所有其他人物（如侍女孤月等）自然交代其留守山门据点，绝不随行入谷！幽寂谷现场参与者严格限定为：赵无忧、叶红缨、玄机子（若存活）、墨山道众弟子；\n" +
      "4. 【兼容性提示词（若玄机子已死亡）】若玄机子在先前剧情中已死亡/陨落，则玄机子绝不出现！合理改变后续剧情：幽寂谷由赵无忧与叶红缨携众弟子探索，分歧路线仅可走分支C（两人并肩同行探险、稳妥破阵），不发生玄机子分兵与弄险图谋；\n" +
      "5. 队伍御飞舟抵临幽寂谷外围，合力斩灭外围盘踞的裂地妖熊后，行至深谷分兵岔路，不提前揭示深处细节。",
    from: "map",
    to: "first",
    open: OPEN_DATE,
    close: CLOSE_DATE,
  },

  // ── 分歧点（互斥组 yig_fork） ──────────────────────────────
  a7x1: {
    id: "a7x1",
    label: "引队回营",
    actionText: "念及筑基弟子安危，以大局为重率先引队回营休整",
    prompt: "演绎玄机子提议分兵，玩家以大局为重规劝叶红缨，率领筑基弟子回营休整，玄机子独引叶红缨探查未知深谷。（注：此路线仅在玄机子存活时成立）",
    from: "first",
    to: "camp",
    group: "yig_fork",
    summaryNote: "以大局为重，由玄机子独引叶红缨探查未知禁制，自引弟子回营",
  },
  b3m8: {
    id: "b3m8",
    label: "潜行尾随",
    actionText: "察觉二师兄神色有异，假意引弟子就地结阵，暗中运转敛息术尾随二人深入",
    prompt: "演绎玄机子巧言劝分兵，玩家察觉其神色有异，表面应承、暗令弟子就地结阵固守，自身运起敛息匿气之术悄然尾随深入。（注：此路线仅在玄机子存活时成立）",
    from: "first",
    to: "valley_deep",
    group: "yig_fork",
    summaryNote: "表面答应玄机子，暗中令弟子结阵防守，自身悄然尾随保护红缨",
  },
  c9k2: {
    id: "c9k2",
    label: "合力同行",
    actionText: "力辞分兵同门共进退，深入探查未知深谷",
    prompt: "演绎若玄机子存活，玩家当面力辞其分兵之策，三人结伴同行深入；【兼容性铁律】若玄机子已死亡，则玄机子不出现，剧情合理改变为赵无忧与叶红缨二人率领精锐弟子结阵防守后，并肩同行深入探查未知深谷。",
    from: "first",
    to: "valley_trio",
    group: "yig_fork",
    summaryNote: "力辞分兵提议，安顿弟子后结伴同行深入探查",
  },

  // ── 分支 A：原著宿命线 ──────────────────────────────────────
  k8d3: {
    id: "k8d3",
    label: "营地驻守",
    actionText: "于营地安顿筑基弟子结阵休整，戒备四周异状",
    prompt: "演绎在营地组织弟子调息警戒，夕阳西下，隐约察觉深谷方向传来异样灵力波动与火光，旋即平息。",
    from: "camp",
    to: "camp_wait",
    summaryNote: "在营地驻守休整，察觉深谷异动但未及深究",
  },
  r6t2: {
    id: "r6t2",
    label: "归营相迎",
    actionText: "迎候归来二人，察看叶红缨与玄机子神色境况",
    prompt: "演绎入夜后玄机子与叶红缨归营；玄机子言笑如常，叶红缨衣衫稍乱、神色冰冷躲闪，回避众人目光径自入帐闭门。",
    from: "camp_wait",
    to: "camp_return",
    summaryNote: "二人归营，叶红缨神色异样避人，暗藏端倪",
  },
  w2j5: {
    id: "w2j5",
    label: "整队回宗",
    actionText: "历练事毕，整饬飞舟队伍启程返回宗门",
    prompt: "演绎晨曦拔营，飞舟起驾返回宗门复命；红缨独坐舟尾避人，玄机子谈笑风生。触发天机结算。",
    from: "camp_return",
    finish: true,
    exitDays: 2,
    settlement: { mode: "separate", title: "幽寂谷历练·原著宿命结算" },
    grantsKnown: ["玄机子胁迫过叶红缨"],
    confirmText: "确定结束幽寂谷行程并回宗复命？（耗时2日）",
    exitType: "整队回宗",
    summaryNote: "幽寂谷历练收束，二十名弟子安然归宗，叶红缨心事重重埋下祸根",
  },

  // ── 分支 B：破局营救线 ──────────────────────────────────────
  q5w4: {
    id: "q5w4",
    label: "隔门察危",
    actionText: "循迹摸至深涧石室外，察觉门内粉雾弥漫与异样动静",
    prompt: "演绎潜行至深涧石室石门外，察觉禁制开启，门缝透出粉色惑心雾障，石室内传出微弱挣扎异动。时效紧迫！",
    from: "valley_deep",
    to: "chamber_gate",
    ttl: 3,
    summaryNote: "潜至石室门外，察觉玄机子图谋与粉雾异状",
  },
  t7r1: {
    id: "t7r1",
    label: "阵力破门",
    actionText: "果断祭起灵力轰开石门，强行杀入撞破暗局",
    prompt: "演绎玩家轰碎石门暴起发难，撞破玄机子不轨图谋；玄机子惊骇狼狈遁走，石室内留下受幻力缠绕的叶红缨与遗落的清凉玉佩。",
    from: "chamber_gate",
    to: "chamber_inside",
    summaryNote: "破门杀入击退玄机子，当场粉碎其图谋",
  },
  x8f2: {
    id: "x8f2",
    label: "石室决断",
    actionText: "面对石榻上受幻力侵扰的师姐，直面当下局势自主应对",
    prompt: "【自由回合】演绎石室内救护场景。玩家完全自主决定言行举止。客观法则：任何试图触碰乳环或越界图谋皆会导致叶红缨激惹惊醒自卫；端方温和相助则平息脱困。",
    from: "chamber_inside",
    to: "chamber_rescue",
    summaryNote: "在石室内应对叶红缨幻力之危，局势平息",
  },
  v4k6: {
    id: "v4k6",
    label: "凯旋归宗",
    actionText: "护持师姐离开深谷，汇合弟子乘飞舟凯旋归宗",
    prompt: "演绎二人并肩走出深谷，与驻守弟子汇合并起驾飞舟归宗。缴获清凉玉佩，挫败玄机子暗局。触发天机结算。",
    from: "chamber_rescue",
    finish: true,
    exitDays: 2,
    reward: "清凉玉佩",
    rewards: ["清凉玉佩"],
    settlement: { mode: "separate", title: "幽寂谷历练·破局凯旋结算" },
    grantsKnown: ["识破玄机子幽寂谷暗局", "幽寂谷救下叶红缨"],
    confirmText: "确定结束幽寂谷行程并回宗复命？（耗时2日）",
    exitType: "凯旋归宗",
    summaryNote: "成功破局营救叶红缨，缴获清凉玉佩，凯旋归宗",
  },

  // ── 分支 C：正面制衡线 ──────────────────────────────────────
  m7h4: {
    id: "m7h4",
    label: "洞前对峙",
    actionText: "深入抵临粉雾洞口，察觉异香与禁制，暗自提防戒备",
    prompt: "演绎抵达粉雾洞口，甜腻异香扑面。若玄机子在场，其投鼠忌器不敢妄动，叶红缨靠向玩家暗中戒备，三人形成微妙制衡；若玄机子已死，则为赵无忧与叶红缨二人共同察觉洞中粉雾与异样禁制，携手戒备、商讨破禁。",
    from: "valley_trio",
    to: "chamber_trio_gate",
    summaryNote: "抵达粉雾石洞，察觉残阵异状与粉雾，谨慎戒备",
  },
  x3v8: {
    id: "x3v8",
    label: "探勘石室",
    actionText: "直面粉雾石室机关，自主决定如何破阵、取宝或探查深处",
    prompt: "【自由回合】演绎直面石室机关粉雾。玩家自主决定破阵、取宝或戒备策略。若玄机子在场，其全程受制毫无下手机会；若玄机子已死，则玄机子不出现，赵无忧与叶红缨同舟共济、合力化解异象。",
    from: "chamber_trio_gate",
    to: "chamber_trio_cleared",
    summaryNote: "自主应对石室异状，稳妥破禁，未酿惨剧",
  },
  p6w1: {
    id: "p6w1",
    label: "平稳归宗",
    actionText: "平稳收束幽寂谷历练，汇合筑基弟子，整队起驾飞舟归宗复命",
    prompt: "演绎历练平稳收官，返回营地汇合弟子，飞舟起驾安然归宗。无恶性事端发生，红缨安然无恙。触发天机结算。",
    from: "chamber_trio_cleared",
    finish: true,
    exitDays: 2,
    settlement: { mode: "separate", title: "幽寂谷历练·平稳收官结算" },
    grantsKnown: ["幽寂谷历练安澜无恙", "挫败玄机子独行图谋"],
    confirmText: "确定结束幽寂谷行程并回宗复命？（耗时2日）",
    exitType: "平稳归宗",
    summaryNote: "同门同行化解深谷险局，未生恶性事端，安然凯旋",
  },

  // ── 提前离开 ──────────────────────────────────────────────
  z8u5: {
    id: "z8u5",
    label: "提前离开幽寂谷",
    actionText: "不再深入探寻，及早收步折返",
    prompt: "演绎因故决定提前折返，收拾行装离谷。",
    from: "*",
    early: true,
    finish: true,
    settlement: { mode: "separate", title: "幽寂谷提前离开结算" },
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

function effectiveStep(state, storyCount) {
  return state.step;
}

/**
 * 校验某动作是否被阻断
 */
function explorationComplete(state) {
  return Object.values(EVENT_DEFS).some(
    (def) =>
      def.finish &&
      (state.used || []).includes(def.id) &&
      state.step === "done",
  );
}

function isXuanjiDead(state) {
  if (!state) return false;
  const known = state.known || (state.stat_data && state.stat_data.known) || {};
  return Boolean(
    known["玄机子已死"] ||
    known["击杀玄机子"] ||
    known["斩杀玄机子"] ||
    known["玄机子身陨"] ||
    state.xuanjiDead
  );
}

function checkActionBlock(state, actionId, storyCount = 0) {
  const def = EVENT_DEFS[actionId];
  if (!def) return "未知或非法的事件代码";

  if (def.early && explorationComplete(state))
    return "探索已完成，请从正常出口离开";

  // 通用提前离开规则
  if (def.from === "*") {
    if (["map", "done"].includes(state.step))
      return "当前未处于活动中的幽寂谷探索";
    return "";
  }

  // 阶段匹配
  if (def.from !== effectiveStep(state, storyCount))
    return "当前场景与该步骤不匹配";

  // 已经执行过
  if (state.used.includes(actionId)) return "该项机缘已探索完毕";

  // 时间窗口校验
  if (
    def.from === "map" &&
    (state.currentStamp < OPEN_STAMP || state.currentStamp > CLOSE_STAMP)
  ) {
    return "当前时令并非幽寂谷开放之期（限仙盟历1578年四至五月）";
  }

  // 玄机子存活状态判定与分支兼容
  if (isXuanjiDead(state) && (actionId === "a7x1" || actionId === "b3m8")) {
    return "玄机子已身陨，无法触发其分兵弄险路线（仅可选择分支C合力同行）";
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

  if (
    state.step === "map" &&
    (state.currentStamp < OPEN_STAMP || state.currentStamp > CLOSE_STAMP)
  )
    return results;
  const step = effectiveStep(state, storyCount);

  for (const [id, def] of Object.entries(EVENT_DEFS)) {
    const isStepMatch =
      def.from === step ||
      (def.from === "*" && !["map", "done"].includes(state.step));
    if (!isStepMatch) continue;
    if (def.early && explorationComplete(state)) continue;

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
    if (!nextState.visited.includes(def.to)) {
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
  isXuanjiDead,
  checkActionBlock,
  getAvailableOptions,
  applyAction,
  reserveAction,
  releaseReservedAction,
};
