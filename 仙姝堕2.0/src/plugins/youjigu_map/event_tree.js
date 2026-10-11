/**
 * 《仙姝堕 2.0》幽寂谷地图事件树纯函数引擎
 * ─────────────────────────────────────────────────────────────────────────────
 * 核心特性：
 * 1. 窗口期时间过滤：仙盟历 1578.3 - 1578.4（3月1日 至 4月30日）；
 * 2. 轮次 TTL 衰减采用纯函数基准楼层（triggerFloor）计算，天然免疫 Swipe/撤回污染；
 * 3. 互斥组（Mutex）二选一严格互斥；
 * 4. 密室钥匙门禁（需持 map_youjigu）；
 * 5. 三种退出确认机制（提前离开、出口离开、密室离开）与天数结算。
 */

// 历法日期换算为连续整数日
export const dayToStamp = (y, m, d) => y * 360 + (m - 1) * 30 + d - 1;
export const stampToDate = (n) => {
  const y = Math.floor(n / 360);
  const r = n - y * 360;
  const m = Math.floor(r / 30) + 1;
  const d = (r % 30) + 1;
  return {
    year: y,
    month: m,
    day: d,
    text: `仙盟历 ${y}年 ${m}月 ${d}日`,
    floatCalendar: Number((y + m / 100 + (d - 1) / 30 * 0.005).toFixed(4))
  };
};

export const OPEN_STAMP = dayToStamp(1578, 3, 1);
export const CLOSE_STAMP = dayToStamp(1578, 4, 30);

export const CONFIG = {
  completeDays: 2,
  earlyDays: 1,
  narrativeBudget: '测试预算：本次事件叙事不超过两日；世界日期仅在退出结算时推进。'
};

/**
 * 幽寂谷全事件节点定义
 */
export const EVENT_DEFS = {
  'g7p2': {
    id: 'g7p2',
    label: '进入幽寂谷',
    actionText: '进入幽寂谷探查',
    from: 'map',
    to: 'first'
  },
  'k4m8': {
    id: 'k4m8',
    label: '探索洞府',
    actionText: '循小径前往幽寂谷洞府探寻',
    from: 'first',
    to: 'cave',
    ttl: 3
  },
  's9a3': {
    id: 's9a3',
    label: '探索山涧',
    actionText: '顺流水沿山涧深入探查',
    from: 'first',
    to: 'stream',
    ttl: 5
  },
  'b8n2': {
    id: 'b8n2',
    label: '开启香炉',
    actionText: '小心上前开启洞府中央的青铜古香炉',
    from: 'cave',
    group: 'cave_chest',
    reward: '聚气灵丹',
    summaryNote: '开启了洞中古香炉，取得灵丹'
  },
  'q3f7': {
    id: 'q3f7',
    label: '开启暗格',
    actionText: '细细摸索洞壁机关，开启石壁暗格',
    from: 'cave',
    group: 'cave_chest',
    reward: '幽寂谷密室古卷',
    known: 'map_youjigu',
    summaryNote: '开启洞壁暗格，取得幽寂谷密室古卷'
  },
  'h5w9': {
    id: 'h5w9',
    label: '离开洞府',
    actionText: '退出洞府，返回谷口岔路',
    from: 'cave',
    to: 'first'
  },
  'r2c6': {
    id: 'r2c6',
    label: '查看溪水',
    actionText: '驻足细看溪水中流动的荧光暗影',
    from: 'stream',
    summaryNote: '查探了山涧溪水灵气异状'
  },
  'a6d4': {
    id: 'a6d4',
    label: '查看树丛',
    actionText: '拨开溪畔繁茂的紫灵草丛查探',
    from: 'stream',
    summaryNote: '观察了溪畔树丛痕迹'
  },
  'j8e1': {
    id: 'j8e1',
    label: '离开山涧',
    actionText: '退出山涧，返回谷口岔路',
    from: 'stream',
    to: 'first'
  },
  'u9h3': {
    id: 'u9h3',
    label: '前往山谷',
    actionText: '离开岔路，向幽寂谷深处山谷行进',
    from: 'second',
    to: 'valley'
  },
  'v4t7': {
    id: 'v4t7',
    label: '前往密室',
    actionText: '对照古卷指引，寻出石壁裂隙后的隐蔽密室',
    from: 'second',
    to: 'secret',
    requires: 'map_youjigu'
  },
  'n5z8': {
    id: 'n5z8',
    label: '收集草药',
    actionText: '俯身采下崖边生长的幽寂紫灵芝',
    from: 'valley',
    reward: '幽寂紫灵芝',
    summaryNote: '采集得一株年份上佳的幽寂紫灵芝'
  },
  'l7q2': {
    id: 'l7q2',
    label: '从出口离开',
    actionText: '顺着谷口山径离开幽寂谷',
    from: 'valley',
    finish: true,
    needsConfirm: true,
    exitType: '出口离开'
  },
  'p1x6': {
    id: 'p1x6',
    label: '打开左边暗格',
    actionText: '凝神按动机关，启开密室左侧的青玉石格',
    from: 'secret',
    group: 'secret_chest',
    reward: '幽月青霜环',
    summaryNote: '取得密室左侧法宝幽月青霜环'
  },
  't6v4': {
    id: 't6v4',
    label: '打开右边暗格',
    actionText: '小心探手推开密室右侧的沉香暗格',
    from: 'secret',
    group: 'secret_chest',
    reward: '幽寂伏魔古谱',
    summaryNote: '取得密室右侧秘籍幽寂伏魔古谱'
  },
  'e3j9': {
    id: 'e3j9',
    label: '离开密室',
    actionText: '收拾齐备，自隐蔽出口离去',
    from: 'secret',
    finish: true,
    needsConfirm: true,
    exitType: '密室离开'
  },
  'z8u5': {
    id: 'z8u5',
    label: '提前离开幽寂谷',
    actionText: '不再深入探寻，及早收步折返',
    from: '*',
    early: true,
    needsConfirm: true,
    exitType: '提前离开'
  }
};

/**
 * 创建纯净初始状态
 */
export function createInitialState(identity = '自设', currentStamp = OPEN_STAMP) {
  return {
    version: 2,
    identity,
    currentStamp,
    step: 'map',
    turn: 0,
    createdFloor: 0,
    visited: [],
    used: [],
    mutex: {},
    known: {},
    inventory: [],
    log: [],
    receipt: null,
    runCount: 0
  };
}

/**
 * 校验某动作是否被阻断
 */
export function checkActionBlock(state, actionId, currentFloor = 0) {
  const def = EVENT_DEFS[actionId];
  if (!def) return '未知或非法的事件代码';

  // 通用提前离开规则
  if (def.from === '*') {
    if (['map', 'done'].includes(state.step)) return '当前未处于进行中的幽寂谷探险';
    return '';
  }

  // 阶段匹配
  if (def.from !== state.step) return '当前场景与该操作步骤不匹配';

  // 已经执行过
  if (state.used.includes(actionId)) return '该项机缘已探索完毕';

  // 时间窗口校验
  if (def.from === 'map' && (state.currentStamp < OPEN_STAMP || state.currentStamp > CLOSE_STAMP)) {
    return '当前时令并非幽寂谷开放之期（限仙盟历1578年三至四月）';
  }

  // 轮次 TTL 衰减判定（以触发楼层为纯函数基准）
  if (def.ttl && state.createdFloor > 0) {
    const elapsedTurns = Math.max(0, currentFloor - state.createdFloor);
    if (elapsedTurns >= def.ttl) {
      return `该选项已超时关闭（时效持续 ${def.ttl} 轮，已过 ${elapsedTurns} 轮）`;
    }
  }

  // 互斥组已选择判定
  if (def.group && state.mutex[def.group]) {
    return `同组机缘已选「${state.mutex[def.group]}」，此选项不可重复获取`;
  }

  // 前置钥匙门禁
  if (def.requires && !state.known[def.requires]) {
    return '前置未达成：尚无此地指引线索或地图残卷';
  }

  return '';
}

/**
 * 获取当前步骤下所有合法选项（纯函数）
 */
export function getAvailableOptions(state, currentFloor = 0) {
  const results = [];
  for (const [id, def] of Object.entries(EVENT_DEFS)) {
    const isStepMatch = def.from === state.step || (def.from === '*' && !['map', 'done'].includes(state.step));
    if (!isStepMatch) continue;

    // 已使用排除
    if (state.used.includes(id)) continue;

    // 互斥已封死排除
    if (def.group && state.mutex[def.group]) continue;

    const blockReason = checkActionBlock(state, id, currentFloor);

    // TTL 超时排除
    if (def.ttl && state.createdFloor > 0 && (currentFloor - state.createdFloor >= def.ttl)) {
      continue;
    }

    let remainingTtl = null;
    if (def.ttl) {
      const elapsed = Math.max(0, currentFloor - state.createdFloor);
      remainingTtl = Math.max(0, def.ttl - elapsed);
    }

    results.push({
      ...def,
      blocked: blockReason,
      remainingTtl,
      needsConfirm: !!def.needsConfirm
    });
  }
  return results;
}

/**
 * 应用行动推进状态（纯函数，返回不可变新状态）
 */
export function applyAction(state, actionId, currentFloor = 0) {
  const block = checkActionBlock(state, actionId, currentFloor);
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
  if (def.summaryNote) {
    nextState.log.push(def.summaryNote);
  }

  // 场景流转
  if (def.to) {
    nextState.step = def.to;
    if (def.from === 'map') {
      nextState.createdFloor = currentFloor;
      nextState.runCount++;
    }
    if (['cave', 'stream'].includes(def.to) && !nextState.visited.includes(def.to)) {
      nextState.visited.push(def.to);
    }
  }

  // 退出结算
  if (def.finish || def.early) {
    const daysCost = def.early ? CONFIG.earlyDays : CONFIG.completeDays;
    const startStamp = nextState.currentStamp;
    const finalStamp = startStamp + daysCost;

    nextState.receipt = {
      runId: `youjigu_run_${nextState.runCount}`,
      exitType: def.exitType || (def.early ? '提前离开' : '正常完成'),
      daysCost,
      startStamp,
      finalStamp,
      dateText: stampToDate(finalStamp).text,
      rewards: [...nextState.inventory],
      summaryLog: [...nextState.log]
    };

    nextState.currentStamp = finalStamp;
    nextState.step = 'done';
  }

  return { ok: true, state: nextState };
}

/**
 * 推进转入第二轮深入探索（纯函数）
 */
export function advanceToSecondStage(state) {
  if (state.step !== 'first') {
    return { ok: false, error: '仅在第一轮谷口岔路处方可确认深入第二轮', state };
  }
  const nextState = structuredClone(state);
  nextState.step = 'second';
  nextState.log.push('深入谷内，进入第二轮探索阶段');
  return { ok: true, state: nextState };
}
