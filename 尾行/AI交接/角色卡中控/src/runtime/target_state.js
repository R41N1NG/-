// src/runtime/target_state.js - 目标态势中控引擎（着装、身心、双手行为与破绽）
// 宪法与纪律：
// 1. 中控代码自己掷骰（PRNG 种子化伪随机流），LLM 不读百分比，只收确定性白描指令与真源数值。
// 2. 着装：平日固定（制式校服），周末（周六/周日）依种子抽取私服。
// 3. 身心：潜行开始（按日期）固定，除非事件插入不轻易变动，带理由子池与数值扰动。
// 4. 双手：地点（站台/便利店/单元门）优先触发，途中依概率分布抽取，按段维持计数。
const D = require("./dice");
const T = require("./tags");
const LP = require("../config/lifepack.json");
const R = require("../config/rules.json");

function isWeekend(date) {
  const day = (((date || 1) - 1) % 7) + 1; // 1..7 (1=周一, 7=周日)
  return day >= 6;
}

function toSeed(seed) {
  if (typeof seed === "number") return seed >>> 0;
  return D.floorSeed(String(seed || 0), 0);
}

/** 依权重抽取数组项：返回选中的项与推进后的 PRNG 流 */
function weightedSample(list, seed, weightKey = "weight") {
  if (!list || !list.length) return { item: null, next: null };
  const total = list.reduce((s, it) => s + (it[weightKey] || 1), 0);
  const next = D.rng(toSeed(seed));
  const r = next() * total;
  let acc = 0;
  for (const it of list) {
    acc += (it[weightKey] || 1);
    if (r <= acc) return { item: it, next };
  }
  return { item: list[list.length - 1], next };
}

/**
 * 性格与服装风格群映射（四大气质池）：
 * casual: 随性休闲
 * sweet: 甜美精致 (含 JK、Lolita)
 * elegant: 文雅温润
 * cool: 清冷利落
 */
const PERSONALITY_STYLE_MAP = {
  casual: ["casual"],
  stubborn: ["casual", "cool"],
  vigilant: ["cool", "casual"],
  timid: ["elegant", "sweet"],
  gentle: ["elegant"],
  introverted: ["elegant", "cool"],
  aloof: ["cool", "casual"],
  cheerful: ["casual", "sweet"],
  chic: ["sweet"],
  naive: ["sweet", "elegant"],
  guarded: ["cool", "casual", "elegant"],
  oblivious: ["casual"]
};

// 甜美特型服装（JK 与 Lolita）：清冷与要强性格严禁抽取！
const SWEET_EXCLUDE_FOR_COOL = new Set(["outfit_sailor_jk", "outfit_plaid_jk", "outfit_lolita_jsk"]);

/** 着装抽取：女大学生按性格气质轮换池全天候抽选；其他目标平日固定 defaultOutfit，周末抽取 weekendOutfitPool */
function sampleOutfit(pack, date, seed, persona) {
  const p = pack || LP.packs.college || LP.packs.student;
  const weekend = isWeekend(date);

  // 1. 若拥有 outfits 全天候风格池（如女大学生 packs.college）
  if (p.outfits && p.outfits.length) {
    const personalityId = (persona && (persona.personalityId || persona.personalityTag || persona.personality))
      || (pack && pack.traits && pack.traits.find(t => PERSONALITY_STYLE_MAP[t]))
      || "casual";

    const allowedStyles = PERSONALITY_STYLE_MAP[personalityId] || ["casual", "elegant"];
    let candidates = p.outfits.filter(o => allowedStyles.includes(o.styleGroup));

    // 严密拦截：若性格为清冷 (aloof) 或要强 (stubborn)，严禁穿 JK 和 Lo 裙！
    if (personalityId === "aloof" || personalityId === "stubborn") {
      candidates = candidates.filter(o => !SWEET_EXCLUDE_FOR_COOL.has(o.id));
    }

    if (!candidates.length) {
      candidates = p.outfits.filter(o => !SWEET_EXCLUDE_FOR_COOL.has(o.id));
    }
    if (!candidates.length) candidates = p.outfits;

    // 若指定了 persona.shoeId（如开局向导摇号指定的鞋具），优先在匹配鞋具的候选子池中抽选
    if (persona && persona.shoeId && candidates.some(o => o.shoeId === persona.shoeId)) {
      candidates = candidates.filter(o => o.shoeId === persona.shoeId);
    }

    const idx = (typeof seed === "number" && Number.isFinite(seed))
      ? Math.abs(seed) % candidates.length
      : Math.floor(Math.random() * candidates.length);
    const item = candidates[idx];

    return {
      id: item.id,
      name: item.name,
      desc: item.desc,
      prompt: item.prompt,
      socks: item.socks || "",
      shoeId: item.shoeId || "shoe_sneakers",
      shoeName: item.shoeName || "运动鞋",
      styleGroup: item.styleGroup,
      isWeekend: weekend
    };
  }

  // 2. 原有的 weekendOutfitPool 逻辑（如 packs.student）
  if (weekend && p.weekendOutfitPool && p.weekendOutfitPool.length) {
    const { item } = weightedSample(p.weekendOutfitPool, seed);
    return {
      id: item.id,
      name: item.name,
      desc: item.desc,
      prompt: item.prompt,
      shoeId: item.shoeId || "shoe_sneakers",
      shoeName: item.shoeName || "运动鞋",
      isWeekend: true
    };
  }

  // 3. 兜底默认着装（平日固定）
  const targetDef = (R.targets && R.targets.list && R.targets.list[p.id]);
  const defaultShoeId = targetDef?.shoe || "shoe_heel";
  const def = p.defaultOutfit || {
    id: "outfit_default",
    name: "日常衣装",
    desc: "规矩常服",
    prompt: "白描其规矩得体的日常装束",
    shoeId: defaultShoeId,
    shoeName: (R.tags && R.tags[defaultShoeId]?.name) || "日常鞋具"
  };
  return {
    id: def.id,
    name: def.name,
    desc: def.desc,
    prompt: def.prompt,
    shoeId: def.shoeId || defaultShoeId,
    shoeName: def.shoeName || "小皮鞋",
    isWeekend: false
  };
}

/** 判定指定日期是否为情侣旅社之后的下个周一或周二（生理受迫期） */
function isLimpingDate(date, lastHotelDate) {
  if (!lastHotelDate || !date) return false;
  return date === lastHotelDate + 2 || date === lastHotelDate + 3;
}

/** 身心状态抽取（开局按天固定，带理由子池） */
function sampleSomatic(pack, seed, opts = {}) {
  if (opts.isLimping) {
    return {
      id: "limping",
      name: "步履蹒跚",
      desc: "双腿轻微并拢，迈步稍大时轻微吸气，似触及痛处，敏捷 -2",
      mod: { agi: -2 },
      reason: "周末亲密初试后的生理受迫反应，步态迟缓收敛",
      tag: "somatic_limping",
      prompt: "白描少女步态明显收敛变小，两腿微并，迈步轻缓且偶尔轻微吸气，似触及隐秘痛处，神色略带局促"
    };
  }
  const p = pack || LP.packs.college || LP.packs.student;
  if (!p.somaticPool || !p.somaticPool.length) {
    return {
      id: "normal",
      name: "平常状态",
      desc: "基线平淡",
      mod: {},
      reason: "日常晚归，心境平稳",
      tag: null,
      prompt: "白描其平静匀速的步态"
    };
  }
  const { item, next } = weightedSample(p.somaticPool, seed);
  let reason = "";
  if (item.reasons && item.reasons.length) {
    const idx = Math.floor(next() * item.reasons.length);
    reason = item.reasons[idx] || item.reasons[0];
  }
  return {
    id: item.id,
    name: item.name,
    desc: item.desc || "",
    mod: item.mod || {},
    reason,
    tag: item.tag || (item.id === "normal" ? null : ("somatic_" + item.id)),
    prompt: item.prompt || ""
  };
}

/** 双手焦点结算（地点优先，车厢池支持，途中依权重抽取与按段维持） */
function resolveHand(pack, placeId, currentHand, seed, opts = {}) {
  const p = pack || LP.packs.college || LP.packs.student;
  const pool = p.handPool || {};
  // 1. 车厢情境检查（45% 正常 / 35% 手机与耳机 / 20% 摇晃瞌睡）
  if ((opts.isCarriage || placeId === "metro_carriage" || placeId === "carriage") && pool.carriagePool && pool.carriagePool.length) {
    const { item } = weightedSample(pool.carriagePool, seed);
    return {
      id: item.id,
      name: item.name,
      desc: item.desc || "",
      fumbling: !!item.fumbling,
      tag: item.tag || (item.fumbling ? "hand_fumble" : null),
      remainingDuration: item.duration || 1,
      isSiteOverride: false,
      isCarriage: true
    };
  }
  // 2. 地点优先检查（含出站口固定翻找车票与校门整理书包）
  if (placeId && pool.siteOverrides && pool.siteOverrides[placeId]) {
    const ov = pool.siteOverrides[placeId];
    return {
      id: ov.id,
      name: ov.name,
      desc: ov.desc || "",
      fumbling: !!ov.fumbling,
      tag: ov.tag || (ov.fumbling ? "hand_fumble" : null),
      remainingDuration: 1,
      isSiteOverride: true
    };
  }
  // 2. 途中段数延续检查（非地点覆盖且仍有余段）
  if (currentHand && !currentHand.isSiteOverride && (currentHand.remainingDuration || 0) > 1) {
    return {
      ...currentHand,
      remainingDuration: currentHand.remainingDuration - 1
    };
  }
  // 3. 途中抽取
  const enRoute = pool.enRoute || [
    { id: "normal", name: "自然垂手", weight: 100, duration: 2, tag: null, desc: "自然摆臂前行" }
  ];
  const { item } = weightedSample(enRoute, seed);
  return {
    id: item.id,
    name: item.name,
    desc: item.desc || "",
    fumbling: !!item.fumbling,
    tag: item.tag || null,
    remainingDuration: item.duration || 1,
    isSiteOverride: false
  };
}

/** 将目标态势标签同步进标签栈 */
function syncTargetStateTags(stack, targetState) {
  const removePrefixes = ["hand_", "somatic_"];
  for (let i = stack.length - 1; i >= 0; i--) {
    const t = stack[i];
    if (t.owner === "target" && t.id && removePrefixes.some(p => t.id.startsWith(p))) {
      stack.splice(i, 1);
    }
  }
  if (!targetState) return;

  // 1. 身心标签（整晚生效，night 级别）
  if (targetState.somatic && targetState.somatic.tag) {
    const tagDef = R.tags && R.tags[targetState.somatic.tag];
    if (tagDef) {
      T.apply(stack, {
        id: tagDef.id,
        name: tagDef.name,
        owner: "target",
        type: "status",
        category: tagDef.category || "status",
        effects: tagDef.value ? [{ category: tagDef.category, value: tagDef.value }] : [],
        duration: { type: "night" }
      });
    }
  }

  // 2. 双手焦点标签（段生效，scene 级别）
  if (targetState.hand && targetState.hand.tag) {
    const tagDef = R.tags && R.tags[targetState.hand.tag];
    if (tagDef) {
      T.apply(stack, {
        id: tagDef.id,
        name: tagDef.name,
        owner: "target",
        type: "scene",
        category: tagDef.category || "stealth",
        effects: tagDef.value ? [{ category: tagDef.category, value: tagDef.value }] : [],
        duration: { type: "scene", count: targetState.hand.remainingDuration || 1 }
      });
    }
  }

  // 3. 翻找破绽标签（若 fumbling 为 true）
  if (targetState.hand && targetState.hand.fumbling && (!targetState.hand.tag || targetState.hand.tag !== "hand_fumble")) {
    const tagDef = R.tags && R.tags.hand_fumble;
    if (tagDef) {
      T.apply(stack, {
        id: tagDef.id,
        name: tagDef.name,
        owner: "target",
        type: "scene",
        category: tagDef.category || "stealth",
        effects: tagDef.value ? [{ category: tagDef.category, value: tagDef.value }] : [],
        duration: { type: "scene", count: 1 }
      });
    }
  }
}

/** 周六日程型抽样：基于社会面与性格权重倾斜，开局或未指定时确定性抽取 */
function resolveSaturdayRoutine(pack, persona, seed) {
  if (persona && persona.saturdayRoutine) {
    return persona.saturdayRoutine;
  }
  const social = (persona && persona.finalStats && persona.finalStats.social)
    || (persona && persona.social)
    || (pack && pack.social)
    || 1;
  const personalityId = (persona && (persona.personality?.id || persona.personality))
    || (pack && pack.traits && pack.traits.find(t => ["timid", "guarded", "stubborn", "gentle", "curious", "oblivious"].includes(t)))
    || "timid";

  let weights = { cram: 50, outing: 35, date: 15 };
  if (social <= 1) {
    if (personalityId === "timid" || personalityId === "guarded") {
      weights = { cram: 65, outing: 30, date: 5 };
    } else {
      weights = { cram: 55, outing: 35, date: 10 };
    }
  } else if (social === 2) {
    if (personalityId === "guarded" || personalityId === "stubborn") {
      weights = { cram: 45, outing: 40, date: 15 };
    } else {
      weights = { cram: 35, outing: 45, date: 20 };
    }
  } else {
    weights = { cram: 20, outing: 50, date: 30 };
  }

  const pool = [
    { id: "cram", weight: weights.cram },
    { id: "outing", weight: weights.outing },
    { id: "date", weight: weights.date }
  ];
  const { item } = weightedSample(pool, seed);
  return item.id;
}

/** 获取约会情侣旅社质变阈值（胆小4 / 慢热3 / 开朗2） */
function getDateHotelThreshold(personalityId) {
  if (personalityId === "timid" || personalityId === "anxious") return 4;
  if (personalityId === "guarded") return 3;
  return 2;
}

/** 依周六日程与当前约会次数决定周六动线对象与分支 */
function resolveSaturdayRoute(pack, saturdayRoutine, dateCount, personalityId, seed, opts = {}) {
  const routes = pack?.routes || [];
  if (saturdayRoutine === "cram") {
    return routes.find(r => r.id === "saturday_cram") || routes[0];
  }
  if (saturdayRoutine === "outing") {
    return routes.find(r => r.id === "saturday_outing") || routes[0];
  }
  if (saturdayRoutine === "date") {
    const threshold = getDateHotelThreshold(personalityId);
    if ((dateCount || 0) >= threshold) {
      const next = D.rng(toSeed(seed));
      const isHotel = next() < 0.5;
      if (isHotel) {
        const base = routes.find(r => r.id === "saturday_date_hotel") || routes.find(r => r.id === "saturday_date_home") || routes[0];
        const isFirst = (opts.hotelVisitedCount || 0) === 0;
        return {
          ...base,
          isFirstHotel: isFirst,
          note: isFirst ? "周六青涩约会·未知新动线分支" : "周六情侣约会·情侣旅社走向",
          prompt: isFirst
            ? "白描青涩情侣初次牵手的局促与娇羞，纯真恋爱的微甜与恩爱。两人十指紧扣，并肩拐入一条陌生狭窄的偏僻侧巷深处；少女心跳微快、掌心泛起细汗，带着对跨入大人世界的向往与紧张。严禁提前剧透目的地名称。"
            : "白描情侣二人食髓知味后的熟稔亲昵与恩爱缠绵，低声耳语与亲密依偎，牵手轻车熟路走向巷深处的情侣旅社。",
          known: isFirst ? [1, 1, 1, 0] : [1, 1, 1, 1]
        };
      }
    }
    return routes.find(r => r.id === "saturday_date_home") || routes[0];
  }
  return routes.find(r => r.days && r.days.includes(6)) || routes[0];
}

/**
 * 开局事实抽样函数（方案A扩大版本：住处全抽、作息随身按性格偏好、恋爱三态额外抽、整局不变）
 * @param {Object} pack - 当前生活包（如 LP.packs.college）
 * @param {Object} persona - 目标人物画像（包含 personality, assignedFacts 等）
 * @param {number|string} seed - 伪随机种子
 * @returns {{ assignedFacts: Array, factSummary: Object }}
 */
function resolveTargetFacts(pack, persona, seed = 12345) {
  const p = pack || LP.packs.college || LP.packs.student;
  if (!p) return { assignedFacts: [], factSummary: {} };

  // 1. 若 persona 中已持有抽样事实，严格保证整局不变，直接返回真源
  if (persona && persona.assignedFacts && Array.isArray(persona.assignedFacts) && persona.assignedFacts.length) {
    return {
      assignedFacts: persona.assignedFacts,
      factSummary: persona.factSummary || {}
    };
  }

  // 2. 若生活包未提供多选项候选池（如 student 仅有静态基准池），回退至 factPool
  if (!p.homePool) {
    const facts = (p.factPool || []).slice();
    return {
      assignedFacts: facts,
      factSummary: {}
    };
  }

  const next = D.rng(toSeed(seed));
  const personalityId = (persona && (persona.personalityId || persona.personalityTag || persona.personality?.id || persona.personality)) || "casual";

  // 1. 住处槽位 (home)：不限制性格，全池抽取（3候选）
  const homePool = p.homePool || [];
  const chosenHome = homePool.length ? homePool[Math.floor(next() * homePool.length)] : null;

  // 辅助函数：根据性格倾向权重抽选分支（倾向性格权重3，其余权重1）
  function pickByPersonality(pool, prefMap) {
    if (!pool || !pool.length) return null;
    const weights = pool.map(branch => {
      const prefs = (prefMap && prefMap[branch.id]) || branch.preferredPersonalities || [];
      return prefs.includes(personalityId) ? 3 : 1;
    });
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = next() * totalW;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }

  // 2. 作息槽位 (schedule)：按性格偏好抽取
  const schedulePrefMap = {
    sched_academic: ["stubborn", "aloof", "vigilant", "introverted"],
    sched_parttime: ["gentle", "stubborn", "casual", "naive"],
    sched_socialite: ["cheerful", "chic", "naive", "casual"]
  };
  const chosenSchedule = pickByPersonality(p.schedulePool, schedulePrefMap);

  // 3. 随身槽位 (carry)：按性格偏好抽取
  const carryPrefMap = {
    carry_academic: ["stubborn", "aloof", "vigilant", "introverted", "gentle"],
    carry_glamour: ["chic", "cheerful", "naive"],
    carry_casual: ["casual", "timid", "vigilant"]
  };
  const chosenCarry = pickByPersonality(p.carryPool, carryPrefMap);

  // 4. 人际槽位 (social)：按性格偏好抽取
  const socialPrefMap = {
    social_introvert: ["introverted", "aloof", "vigilant", "timid"],
    social_extrovert: ["cheerful", "chic", "naive"],
    social_moderate: ["gentle", "stubborn", "casual"]
  };
  const chosenSocial = pickByPersonality(p.socialPool, socialPrefMap);

  // 5. 心理槽位 (psyche)：按性格偏好抽取
  const psychePrefMap = {
    psyche_pride: ["stubborn", "aloof", "vigilant"],
    psyche_timid: ["timid", "gentle", "naive"],
    psyche_cautious: ["vigilant", "casual", "introverted", "chic"]
  };
  const chosenPsyche = pickByPersonality(p.psychePool, psychePrefMap);

  // 6. 恋爱槽位 (romance)：所有性格开局额外抽取（1有恋人未发生关系 2有恋人已发生关系 3单身）
  const romancePool = p.romancePool || [];
  let chosenRomance = null;
  if (persona && persona.romanceState) {
    chosenRomance = romancePool.find(r => r.id === persona.romanceState) || null;
  }
  if (!chosenRomance && romancePool.length) {
    chosenRomance = romancePool[Math.floor(next() * romancePool.length)];
  }

  // 汇聚 18 条事实（6 槽 × 3 层）
  const chosenBranches = [chosenHome, chosenSchedule, chosenCarry, chosenSocial, chosenPsyche, chosenRomance].filter(Boolean);
  const assignedFacts = [];
  for (const b of chosenBranches) {
    if (b.facts && Array.isArray(b.facts)) {
      for (const f of b.facts) assignedFacts.push(f);
    }
  }

  const factSummary = {
    home: chosenHome ? chosenHome.id : null,
    schedule: chosenSchedule ? chosenSchedule.id : null,
    carry: chosenCarry ? chosenCarry.id : null,
    social: chosenSocial ? chosenSocial.id : null,
    psyche: chosenPsyche ? chosenPsyche.id : null,
    romance: chosenRomance ? chosenRomance.id : null
  };

  // 绑定持久化至 persona（整局不变）
  if (persona) {
    persona.assignedFacts = assignedFacts;
    persona.factSummary = factSummary;
  }

  return { assignedFacts, factSummary };
}

module.exports = {
  isWeekend,
  isLimpingDate,
  sampleOutfit,
  sampleSomatic,
  resolveHand,
  syncTargetStateTags,
  resolveSaturdayRoutine,
  getDateHotelThreshold,
  resolveSaturdayRoute,
  resolveTargetFacts
};
