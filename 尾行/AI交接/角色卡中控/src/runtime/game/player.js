"use strict";
// player：依赖由 game.js 装配，每个游戏实例独立持有状态。
const R = require("../../config/rules.json");
const T = require("../tags.js");
const C = require("../checks.js");
const facts = require("../facts.js");

function createPlayerSystem({ g, L, log }) {
  function sweetHighNow() {
    const advNrv = (g.tags || []).some((t) => t.id === "adv_nrv");
    return R.check.sweetHigh + (advNrv ? R.advantage.sweetHighBonus : 0);
  }

  function syncHeartTags() {
    const lines = C.heartLines(L.get("heart"), sweetHighNow());
    const stack = g.tags || (g.tags = []);
    if (lines.deform === -2)
      T.apply(stack, {
        id: "deform",
        name: "操作变形",
        owner: "player",
        category: "fine",
        effects: [{ category: "fine", value: -2 }],
        duration: { type: "flag" },
      });
    else if (lines.deform === 0) T.remove(stack, "deform");
    if (lines.crash)
      T.apply(stack, {
        id: "crash",
        name: "操作崩溃",
        owner: "player",
        category: "fine",
        effects: [{ category: "fine", value: -2 }],
        duration: { type: "flag" },
      });
    else T.remove(stack, "crash");
  }

  function applyIdentity(identityId, opts = {}) {
    if (!identityId) return false;
    const def = R.identity.list[identityId];
    if (!def) {
      log(`[身份] 未知身份 "${identityId}"，忽略`);
      return false;
    }
    g.identity = identityId;
    for (const [k, v] of Object.entries(def.mods || {})) {
      g.player[k] = Math.max(1, Math.min(10, (g.player[k] || 0) + v)); // 修正后仍受 1~10 秤约束
      if (k === "str") {
        g.player.staminaMax = 100 + g.player.str * 5; // 体格变动联动体力上限真源
      }
    }
    const stack = g.tags || (g.tags = []);
    for (const tid of def.tags || []) {
      const rt = R.tags[tid];
      if (!rt) {
        log(`[身份] 标签 "${tid}" 未在 rules.tags 注册（黑户）`);
        continue;
      }
      T.apply(stack, {
        id: rt.id,
        name: rt.name,
        owner: rt.owner || "player",
        category: rt.category,
        effects: [{ category: rt.category, value: rt.value }],
        duration: { type: "flag" },
      });
    }
    // 教练特权：她的日程含健身房 → 接近度起点 +20（判定锚 facts.packHasGym，宿主传 targetGym 或 packId）
    if (
      def.gymProximity &&
      (opts.targetGym || (opts.packId && facts.packHasGym(opts.packId)))
    ) {
      L.commit({ proximity: def.gymProximity }, { reason: "identity_gym" });
      addProxLog(def.gymProximity, "健身房行程 (身份特权)");
      log(`[身份] 她的日程含健身房：接近度 +${def.gymProximity}`);
    }
    // 阿宅开局器材：开局自带针孔摄像机（存储档，等值800），落位直接入包
    if (def.startKit) {
      g.startKit = { ...def.startKit };
      if (
        def.startKit.item &&
        !g.player.inventory.some((it) => it.id === def.startKit.item)
      ) {
        g.player.inventory.push({
          id: def.startKit.item,
          count: 1,
          equipped: false,
        });
      }
    }
    return true;
  }

  function addProxLog(dv, reason) {
    if (!dv) return;
    const sign = dv > 0 ? "+" : "";
    const dateStr = `第 ${L.get("date")} 晚`;
    const entry = `${sign}${dv} · ${reason} (${dateStr})`;
    g.proxLogs = g.proxLogs || [];
    g.proxLogs.push(entry);
    if (g.proxLogs.length > 20) g.proxLogs.shift();
  }

  function identityShift() {
    const rot =
      g.identity && R.identity.list[g.identity]
        ? R.identity.list[g.identity].shiftRotation
        : null;
    if (!rot) return null;
    return rot.order[Math.floor((L.get("date") - 1) / 7) % rot.order.length];
  }

  function syncThresholdTags() {
    const A = R.advantage;
    const stack = g.tags || (g.tags = []);
    // 1. 优势五标签
    const defs = [
      { id: "adv_int", name: "优势：情报", on: L.get("pi") >= A.piThreshold },
      {
        id: "adv_agi",
        name: "优势：敏捷",
        on: g.player.agi >= A.attrThreshold,
      },
      {
        id: "adv_str",
        name: "优势：体格",
        on: g.player.str >= A.attrThreshold,
      },
      {
        id: "adv_cha",
        name: "优势：口才",
        on: g.player.cha >= A.attrThreshold,
      },
      {
        id: "adv_nrv",
        name: "优势：胆量",
        on: g.player.nrv >= A.attrThreshold,
      },
    ];
    for (const d of defs) {
      if (d.on)
        T.apply(stack, {
          id: d.id,
          name: d.name,
          owner: "player",
          category: "advantage",
          effects: [],
          duration: { type: "flag" },
        });
      else T.remove(stack, d.id);
    }

    // 2. 玩家五维属性阈值标签（五维细磨档案落码）
    const attrDefs = [
      {
        id: "bulky",
        name: "身形醒目",
        owner: "player",
        category: "stealth",
        value: -1,
        on: g.player.str >= 8,
      },
      {
        id: "unobtrusive",
        name: "不起眼",
        owner: "player",
        category: "stealth",
        value: 1,
        on: g.player.str <= 3,
      },
      {
        id: "light_footed",
        name: "脚步轻",
        owner: "player",
        category: "stealth",
        value: 2,
        on: g.player.agi >= 8,
      },
      {
        id: "clumsy",
        name: "笨拙",
        owner: "player",
        category: "stealth",
        value: -2,
        on: g.player.agi <= 3,
      },
      {
        id: "stammer",
        name: "结巴",
        owner: "player",
        category: "social",
        value: -2,
        on: g.player.cha <= 2 && L.get("heart") > 70,
      },
    ];
    for (const d of attrDefs) {
      if (d.on) {
        T.apply(stack, {
          id: d.id,
          name: d.name,
          owner: d.owner,
          category: d.category,
          effects: [{ category: d.category, value: d.value }],
          duration: { type: "flag" },
        });
      } else {
        T.remove(stack, d.id);
      }
    }
  }

  return {
    sweetHighNow,
    syncHeartTags,
    applyIdentity,
    addProxLog,
    identityShift,
    syncThresholdTags,
  };
}

module.exports = { createPlayerSystem };
