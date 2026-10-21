"use strict";
const { personalityIdOf } = require("../../contracts/persona.js");
const R = require("../../config/rules.json");
const D = require("../dice.js");
const T = require("../tags.js");
const LP = require("../../config/lifepack.json");
const TS = require("../target_state.js");
const map = require("../map.js");
const { SHOE_ID_MAP, WEATHER_BANDS } = require("./constants.js");

function createTargetSystem({ g, L, seedAt, log, syncHeartTags }) {
  function applyTargetState() {
    if (!g.targetState) return;
    g.target = { ...g.targetBase };
    if (g.targetState.somatic && g.targetState.somatic.mod) {
      for (const [k, v] of Object.entries(g.targetState.somatic.mod)) {
        if (g.target[k] !== undefined) {
          g.target[k] = Math.max(1, g.target[k] + v);
        }
      }
    }
    TS.syncTargetStateTags(g.tags || (g.tags = []), g.targetState);
    const isWeekend = g.targetState.outfit && g.targetState.outfit.isWeekend;
    const isCollege = g.targetId === "college";
    const outfitShoe =
      ((isWeekend || isCollege) &&
        g.targetState.outfit &&
        g.targetState.outfit.shoeId) ||
      (g.targetPersona && g.targetPersona.shoeId) ||
      (g.targetState.outfit && g.targetState.outfit.shoeId);
    if (outfitShoe && R.tags && R.tags[outfitShoe]) {
      const stack = g.tags || (g.tags = []);
      const oldShoe = stack.find(
        (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"),
      );
      if (oldShoe && oldShoe.id !== outfitShoe) {
        T.remove(stack, oldShoe.id);
        const def = R.tags[outfitShoe];
        T.apply(stack, {
          id: def.id,
          name: def.name,
          owner: "target",
          type: "equipment",
          category: "equipment",
          effects: [],
          duration: { type: "flag" },
        });
      }
    }
    /* 鞋具属性修正：在 targetBase + 身心扰动之上再叠一层（鞋影响她的步态与追逐发挥）
       高跟鞋/松糕鞋/拖鞋 −1，运动鞋 +1；钳制在 1~10，和属性规则一致。
       注意：取【当前实际挂着的鞋标签】，不用 outfitShoe 反推——否则手挂的鞋会被穿搭覆盖 */
    applyShoeMod(g.target);
  }

  /** 当前实际穿戴的鞋具标签定义（没有就返回 null） */
  function activeShoeDef() {
    const tag = (g.tags || []).find(
      (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"),
    );
    return tag && R.tags ? R.tags[tag.id] || null : null;
  }

  /** 把鞋具的属性修正叠到一个 stats 对象上（纯计算，不改全局） */
  function applyShoeMod(stats) {
    const def = activeShoeDef();
    if (!def || !def.mod || !stats) return stats;
    for (const [k, v] of Object.entries(def.mod)) {
      if (stats[k] !== undefined)
        stats[k] = Math.max(1, Math.min(10, stats[k] + v));
    }
    return stats;
  }

  function initTargetState(dateOverride) {
    const pack =
      (LP.packs && LP.packs[g.targetId]) ||
      LP.packs.college ||
      LP.packs.student;
    const d = dateOverride ?? (L.get("date") || 1);
    const dayOfWeek = (((d || 1) - 1) % 7) + 1;
    const isLimping = TS.isLimpingDate(d, g.lastHotelDate);
    if (
      dayOfWeek === 6 &&
      (pack.id === "student" || pack.id === "college") &&
      !g.route
    ) {
      const routine =
        g.targetPersona?.saturdayRoutine ||
        (g.targetPersona
          ? (g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(
              pack,
              g.targetPersona,
              seedAt(0, "saturday_routine"),
            ))
          : "cram");
      const personalityId = personalityIdOf(g.targetPersona) || "timid";
      const routeDef = TS.resolveSaturdayRoute(
        pack,
        routine,
        g.dateCount || 0,
        personalityId,
        seedAt(d, "saturday_route_branch"),
        { hotelVisitedCount: g.hotelVisitedCount || 0 },
      );
      if (routeDef) {
        const startT =
          routeDef.path && routeDef.path[0] && routeDef.path[0].t
            ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}`
            : "21:00";
        g.route = {
          id: routeDef.id,
          note: routeDef.note,
          prompt: routeDef.prompt,
          startTime: startT,
          nodes: routeDef.path.map((p) => p.place),
          times: routeDef.path.map((p) => p.t),
          here: 0,
          known: routeDef.known || routeDef.path.map(() => 1),
        };
      }
    } else if (
      dayOfWeek === 7 &&
      (pack.id === "student" || pack.id === "college") &&
      !g.route
    ) {
      const sundayRoute = (pack.routes || []).find(
        (r) => r.id === "sunday_rest",
      ) || {
        id: "sunday_rest",
        note: "周日全天居家休整（不出门）",
        prompt:
          "白描少女周日全天在寓所内安静休整，窗帘拉起，未曾外出，街道上无其足迹",
        path: [{ place: "unit_stairs_b", t: "2000" }],
      };
      g.route = {
        id: sundayRoute.id,
        note: sundayRoute.note,
        prompt: sundayRoute.prompt,
        startTime: "20:00",
        nodes: sundayRoute.path.map((p) => p.place),
        times: sundayRoute.path.map((p) => p.t),
        here: 0,
        known: [1],
      };
      g.tailing = false;
    }
    const outfit = TS.sampleOutfit(
      pack,
      d,
      seedAt(d, "outfit"),
      g.targetPersona || g.target,
    );
    const somatic = TS.sampleSomatic(pack, seedAt(d, "somatic"), { isLimping });
    const curPlaceId =
      g.route && g.route.here >= 0
        ? g.route.nodes[g.route.here]
        : g.route && g.route.nodes
          ? g.route.nodes[0]
          : null;
    const curPlaceName = curPlaceId
      ? map.getPlace(curPlaceId)?.name || curPlaceId
      : null;
    const hand = TS.resolveHand(
      pack,
      curPlaceId,
      null,
      seedAt(g.floor || 0, "hand"),
    );
    g.targetState = {
      outfit,
      somatic,
      hand,
      route: g.route
        ? {
            id: g.route.id,
            note: g.route.note,
            prompt: g.route.prompt,
            startTime: g.route.startTime,
            here: g.route.here || 0,
            nodes: g.route.nodes,
            currentPlace: curPlaceName,
          }
        : null,
    };
    applyTargetState();
  }

  /** 心跳阈值标签同步（脚本自动挂摘，状态阈值类）。甜区上限按 [优势：胆量] 拓展。 */

  /** 开局身份制（v0.8）：属性修正＋常驻标签＋身份参数，全部开局落账；运行时规则层不碰。
   *  真源 rules.json → identity.list；存档恢复不重跑（attrs/tags/账面已随档还原，防二次修正）。 */

  /** 保安排班周轮换（v0.8）：floor((游戏日-1)/7) mod 2 → 昼班周/夜班周；夜班周夜窗被占（硬锁挂 M4 日程层） */

  /** 优势五标签与玩家属性阈值标签同步（达线挂、掉线摘）。 */

  /** 装备标签栈同步（已装备挂载对应标签，未装备摘除）。 */

  /** 行囊：增加物品。 */

  /** 行囊：扣减或移除物品。 */

  /** 行囊：装备物品（同槽位互斥，自动挂载装备标签）。 */

  /** 行囊：卸下物品。 */

  /** 行囊：使用消耗品。 */

  /** 目标穿着鞋型标签同步（后台无数值flag标签，驱动状态栏脚步声） */
  function syncTargetShoeTags() {
    const stack = g.tags || (g.tags = []);
    const found = stack.find(
      (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"),
    );
    if (found && SHOE_ID_MAP[found.id]) {
      return SHOE_ID_MAP[found.id];
    }
    const isWeekend =
      g.targetState && g.targetState.outfit && g.targetState.outfit.isWeekend;
    const isCollege = g.targetId === "college";
    const shoeTagId =
      ((isWeekend || isCollege) &&
        g.targetState &&
        g.targetState.outfit &&
        g.targetState.outfit.shoeId) ||
      (g.targetPersona && g.targetPersona.shoeId) ||
      (g.targetState && g.targetState.outfit && g.targetState.outfit.shoeId) ||
      (R.targets &&
        R.targets.list &&
        R.targets.list[g.targetId] &&
        R.targets.list[g.targetId].shoe) ||
      "shoe_heel";
    const def =
      R.tags && R.tags[shoeTagId] ? R.tags[shoeTagId] : R.tags.shoe_heel;
    if (def) {
      T.apply(stack, {
        id: def.id,
        name: def.name,
        owner: "target",
        type: "equipment",
        category: "equipment",
        effects: [],
        duration: { type: "flag" },
      });
      return SHOE_ID_MAP[def.id] || "heel";
    }
    return "heel";
  }

  /** 目标性格与爱好破绽标签同步（flag型常驻标签） */
  function syncPersonaTags() {
    if (!g.targetPersona) return;
    const stack = g.tags || (g.tags = []);
    const pTagId =
      g.targetPersona.personalityTag || g.targetPersona.personalityId;
    if (pTagId && R.tags && R.tags[pTagId]) {
      const def = R.tags[pTagId];
      T.apply(stack, {
        id: def.id,
        name: def.name,
        owner: def.owner || "target",
        type: def.type || "personality",
        category: def.category || "social",
        effects: def.value
          ? [{ category: def.category, value: def.value }]
          : [],
        duration: { type: "flag" },
      });
    }
    const hTagId = g.targetPersona.hobbyTag || g.targetPersona.hobbyId;
    if (hTagId && R.tags && R.tags[hTagId]) {
      const def = R.tags[hTagId];
      T.apply(stack, {
        id: def.id,
        name: def.name,
        owner: def.owner || "scene",
        type: def.type || "hobby",
        category: def.category || "stealth",
        effects: def.value
          ? [{ category: def.category, value: def.value }]
          : [],
        duration: { type: "flag" },
      });
    }
  }

  /** 给状态栏/回执用的账面快照（明暗分离）。 */

  /* ---------- 动线接口（她的位置由脚本全权持有，LLM 只拿过滤视图） ---------- */
  /** 装载/更换她的当晚动线 {nodes:[placeId], times:[HHMM], known:[0|1], here:int}。 */

  /** 她推进一步（节点深层博弈结束，内容层驱动）。quiet=true 时不写信号（时刻表批量推进用）。 */

  /* ---------- 过档行为：她的警觉每跨一档，她做一件事（一晚每档只响一次） ---------- */
  /** 起疑档的三选一：胆大 → 回头；敏锐 → 绕路；势均力敌 → 按种子骰定。 */

  /** 每跨一档只响一次；一次跳多档时只演最高那一档，低档记为已过。 */

  /* ---------- 时刻表推进（她按自己的返程表走，LLM 不参与） ----------
     口径：一楼 = 15 分钟，第 1 楼对应 route.startTime；越过哪个节点的发车时刻，她就推进到哪。
     没有 times 的旧动线（老存档 / 单测手搓）一律不自动推进，保持原语义。 */

  /** 按时刻表把 here 推到「当前钟点已经到达的最后一站」；一次跨多站只记一条信号。 */

  /** 情报事件点亮某个节点（locate/stakeout 成功等）。 */

  /** 过夜（收摊）。 */
  function nightFall() {
    // v0.8 侦探职业病：跟缀未结束（没跟丢、她也没到家）不可收摊——宁可不结算，不可错结算；GM 可 gmSet({tailing:false}) 解锁
    if (g.tailing) {
      const atEnd = g.route && g.route.here >= g.route.nodes.length - 1;
      if (!atEnd)
        return {
          blocked: true,
          reason: "职业病：跟缀未结束，今晚只能跟丢或跟她到家",
        };
    }
    const curDate = L.get("date");
    if (g.route && g.route.id === "saturday_date_hotel") {
      g.hotelVisitedCount = (g.hotelVisitedCount || 0) + 1;
      g.lastHotelDate = curDate;
    }
    const r = L.settleNight({
      peakAlert: L.get("alert"),
      nrv: g.player.nrv,
      staminaMax: g.player.staminaMax,
    });
    (g.tags || (g.tags = [])).length
      ? T.clearNight(g.tags) && (g.tags = T.clearNight(g.tags))
      : null;
    syncHeartTags();
    g.consecFails = 0;
    // v0.8 侦探 PI ×1.2：当晚毛入账合计补差 round(×(mult−1))，四舍五入当晚入账
    const mult =
      (g.identity &&
        R.identity.list[g.identity] &&
        R.identity.list[g.identity].piMult) ||
      1;
    let piBonus = 0;
    if (mult > 1 && g.nightPiGross > 0) {
      piBonus = Math.round(g.nightPiGross * (mult - 1));
      if (piBonus > 0) {
        L.commit({ pi: piBonus }, { reason: "identity_pi" });
        log(
          `[身份] PI×${mult}：当晚毛入账 ${g.nightPiGross}，补差 +${piBonus}`,
        );
      }
    }
    g.nightPiGross = 0;
    g.tailing = false;
    g.nightDrinkUsed = false;
    g.alertLatch = [];
    g.alertEvent = null;
    g.alertHold = 0;
    g.fleeing = false;
    // 掷下一晚天气（种子骰：同 salt+floor 恒同值；70/20/10 区间映射）
    const wd = D.rollD20(seedAt(9000 + (g.floor || 0), "weather")).d20;
    g.world.weather =
      wd <= WEATHER_BANDS.clear[1]
        ? "clear"
        : wd <= WEATHER_BANDS.rain[1]
          ? "rain"
          : "storm";
    // 掷下一晚目标态势（日期已推进）
    g.nightStartFloor = g.floor || 0;
    const nextDate = L.get("date");
    const dayOfWeek = (((nextDate || 1) - 1) % 7) + 1;
    const pack =
      (LP.packs && LP.packs[g.targetId]) ||
      LP.packs.college ||
      LP.packs.student;
    const isLimping = TS.isLimpingDate(nextDate, g.lastHotelDate);
    if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college")) {
      const routine =
        g.targetPersona?.saturdayRoutine ||
        (g.targetPersona
          ? (g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(
              pack,
              g.targetPersona,
              seedAt(0, "saturday_routine"),
            ))
          : "cram");
      if (routine === "date") {
        g.dateCount = (g.dateCount || 0) + 1;
      }
      const personalityId = personalityIdOf(g.targetPersona) || "timid";
      const routeDef = TS.resolveSaturdayRoute(
        pack,
        routine,
        g.dateCount || 0,
        personalityId,
        seedAt(nextDate, "saturday_route_branch"),
        { hotelVisitedCount: g.hotelVisitedCount || 0 },
      );
      if (routeDef) {
        const startT =
          routeDef.path && routeDef.path[0] && routeDef.path[0].t
            ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}`
            : "21:00";
        g.route = {
          id: routeDef.id,
          note: routeDef.note,
          prompt: routeDef.prompt,
          startTime: startT,
          nodes: routeDef.path.map((p) => p.place),
          times: routeDef.path.map((p) => p.t),
          here: 0,
          known: routeDef.known || routeDef.path.map(() => 1),
        };
      }
    } else if (
      dayOfWeek === 7 &&
      (pack.id === "student" || pack.id === "college")
    ) {
      const sundayRoute = (pack.routes || []).find(
        (r) => r.id === "sunday_rest",
      ) || {
        id: "sunday_rest",
        note: "周日全天居家休整（不出门）",
        prompt:
          "白描少女周日全天在寓所内安静休整，窗帘拉起，未曾外出，街道上无其足迹",
        path: [{ place: "unit_stairs_b", t: "2000" }],
      };
      g.route = {
        id: sundayRoute.id,
        note: sundayRoute.note,
        prompt: sundayRoute.prompt,
        startTime: "20:00",
        nodes: sundayRoute.path.map((p) => p.place),
        times: sundayRoute.path.map((p) => p.t),
        here: 0,
        known: [1],
      };
      g.tailing = false;
    } else if (
      dayOfWeek >= 1 &&
      dayOfWeek <= 5 &&
      (pack.id === "student" || pack.id === "college")
    ) {
      let routeDef = null;
      if (dayOfWeek === 5) {
        routeDef = pack.routes.find(
          (r) => r.id === "friday_late" || r.id === "college_friday_night",
        );
      }
      if (!routeDef) {
        routeDef =
          pack.routes.find(
            (r) => r.id === "college_evening" || r.id === "workday_evening",
          ) || pack.routes[0];
      }
      if (routeDef) {
        const startT =
          routeDef.path && routeDef.path[0] && routeDef.path[0].t
            ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}`
            : "21:00";
        g.route = {
          id: routeDef.id,
          note: routeDef.note,
          prompt: routeDef.prompt,
          startTime: startT,
          nodes: routeDef.path.map((p) => p.place),
          times: routeDef.path.map((p) => p.t),
          here: 0,
          known: routeDef.known || routeDef.path.map(() => 1),
        };
      }
    }
    const outfit = TS.sampleOutfit(
      pack,
      nextDate,
      seedAt(nextDate, "outfit"),
      g.targetPersona || g.target,
    );
    const somatic = TS.sampleSomatic(pack, seedAt(nextDate, "somatic"), {
      isLimping,
    });
    const startPlaceId = g.route && g.route.nodes ? g.route.nodes[0] : null;
    const startPlaceName = startPlaceId
      ? map.getPlace(startPlaceId)?.name || startPlaceId
      : null;
    const hand = TS.resolveHand(
      pack,
      startPlaceId,
      null,
      seedAt(9000 + (g.floor || 0), "hand_night"),
    );
    g.targetState = {
      outfit,
      somatic,
      hand,
      route: g.route
        ? {
            id: g.route.id,
            note: g.route.note,
            prompt: g.route.prompt,
            startTime: g.route.startTime,
            here: g.route.here || 0,
            nodes: g.route.nodes,
            currentPlace: startPlaceName,
          }
        : null,
    };
    applyTargetState();
    return {
      seq: r.seq,
      warinessGain: r.warinessGain,
      nextStartAlert: r.nextStartAlert,
      date: L.get("date"),
      nextWeather: g.world.weather,
      piBonus,
      targetState: g.targetState,
    };
  }

  return {
    applyTargetState,
    applyShoeMod,
    initTargetState,
    syncTargetShoeTags,
    syncPersonaTags,
    nightFall,
  };
}

module.exports = { createTargetSystem };
