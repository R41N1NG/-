"use strict";
const { knownRoutesView } = require("../known-routes.js");
const { knownAttributes } = require("../target-knowledge.js");
// snapshot：依赖由 game.js 装配，每个游戏实例独立持有状态。
const { classifyPlace } = require("../../contracts/action-requirements.js");
const { cityView } = require("../spatial/system.js");
const { economyView } = require("../economy/shop.js");
const R = require("../../config/rules.json");
const C = require("../checks.js");
const map = require("../map.js");
const F = require("../facts.js");
const ALBUM = require("../album.js");
const { dayPlanView } = require("../../contracts/day-plan.js");
const { WEATHER_ICON, SHOE_DIST_FACTOR } = require("./constants.js");

function createSnapshotSystem({
  g,
  L,
  syncTargetShoeTags,
  applyShoeMod,
  identityShift,
  rollEnvSfx,
  getDayActivities,
  getDayToken,
  getDayControls,
}) {
  function snapshot() {
    const s = L.state;
    /* ── 地图 HUD 管道：world/route → 状态栏 route-tracker 与战术沙盘字段 ── */
    const w = g.world;
    const districtObj = map.getDistrict(w.district);
    const here = g.route ? g.route.here : -1;
    const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
    const cur = curId ? map.getPlace(curId) : null;
    const nextId =
      g.route && here >= 0 && here + 1 < g.route.nodes.length
        ? g.route.nodes[here + 1]
        : null;
    const dailyIdle =
      g.dayPlan.source === "daily" && g.dayPlan.activity?.kind !== "tailing";
    const routeView =
      !dailyIdle && g.route
        ? {
            id: g.route.id,
            note: g.route.note,
            startTime: g.route.startTime,
            times: g.route.times || null,
            nodes: g.route.nodes.map((id, i) =>
              g.route.known && g.route.known[i]
                ? map.getPlace(id)?.name || id
                : id,
            ),
            known: g.route.known || g.route.nodes.map(() => 1),
            here,
          }
        : null;
    const exits = cur
      ? cur.exits.map(
          (id) =>
            (map.getPlace(id)?.name || id) +
            (id === nextId && g.route?.known?.[here + 1] === 1 ? " (前)" : ""),
        )
      : [];
    let sanctuaryAlert = "";
    if (cur) {
      if (cur.sanctuary) sanctuaryAlert = "当前即为安全庇护场所";
      else {
        const sn = map.findNearestSanctuary(curId);
        sanctuaryAlert = sn
          ? `若目标受惊：将循最近通路逃往 [${map.getPlace(sn.sanctuaryId)?.name || sn.sanctuaryId}] (${sn.steps}步)`
          : "此处呼救无门——声浪传导衰减为 0（孤岛区）";
      }
    }

    const activeShoe = syncTargetShoeTags();

    /* ── 环境突发（v0.8 演出与账同源：processFloor 已结算挂账，快照读缓存；未结算时现算仅供显示） ── */
    const envSfx = g._envSfx !== undefined ? g._envSfx : rollEnvSfx();

    return JSON.parse(
      JSON.stringify({
        dayPlan: { ...dayPlanView(g.dayPlan, s.date), token: getDayToken() },
        economy: economyView(g.economy),
        cityMap: cityView(g, s.date),
        dayActions: getDayActivities(),
        dayControls: getDayControls(),
        player: {
          heart: s.heart,
          stamina: s.stamina,
          staminaMax: g.player.staminaMax || 100 + g.player.str * 5,
          cash: s.cash,
          pi: s.pi,
          proximity: s.proximity,
          date: s.date,
          attrs: {
            str: g.player.str,
            agi: g.player.agi,
            nrv: g.player.nrv,
            int: g.player.int,
            cha: g.player.cha,
          },
        },
        target: {
          id: g.targetId || "college",
          name:
            R.targets &&
            R.targets.list &&
            R.targets.list[g.targetId || "college"]
              ? R.targets.list[g.targetId || "college"].name
              : "独居女大学生",
          realName: g.targetPersona ? g.targetPersona.name : null,
          persona: g.targetPersona
            ? JSON.parse(JSON.stringify(g.targetPersona))
            : null,
          /* 她的有效属性 = 基底 + 当天身心扰动 + 鞋具修正（每次现算，不依赖 g.target 的中间态） */
          stats: (() => {
            const base = g.targetBase || g.target || {};
            const out = {};
            for (const k of ["str", "agi", "per", "nrv", "social"])
              out[k] = base[k];
            const som =
              g.targetState &&
              g.targetState.somatic &&
              g.targetState.somatic.mod;
            if (som)
              for (const [k, v] of Object.entries(som)) {
                if (out[k] !== undefined) out[k] = Math.max(1, out[k] + v);
              }
            return applyShoeMod(out);
          })(),
          alertStage: C.alertStage(s.alert),
          warinessStage:
            s.wariness >= 60 ? "高" : s.wariness >= 30 ? "中" : "低",
          shoe: activeShoe,
          /* 鞋具读数（状态栏悬停用）：鞋型 + 敏捷修正 + 步声基准 + 按距离折算的当前声级 */
          shoeInfo: (() => {
            const id = (g.tags || []).find(
              (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"),
            )?.id;
            const def = id && R.tags ? R.tags[id] : null;
            if (!def) return null;
            const base = typeof def.noise === "number" ? def.noise : 1;
            const factor = SHOE_DIST_FACTOR[g.dist] ?? 1;
            return {
              id: def.id,
              name: def.name,
              agi: def.mod && typeof def.mod.agi === "number" ? def.mod.agi : 0,
              noise: base,
              distFactor: factor,
              level: Math.max(0, Math.min(5, Math.round(base * factor))),
            };
          })(),
          state: g.targetState
            ? JSON.parse(JSON.stringify(g.targetState))
            : null,
        },
        targetState: g.targetState
          ? JSON.parse(JSON.stringify(g.targetState))
          : null,
        investigation: {
          pendingClues: g.investigation.session?.clues.length || 0,
          effectiveSegments: g.investigation.session?.effective || 0,
          lastReceipt: g.investigation.lastReceipt,
        },
        profile: {
          targetId: g.targetId,
          attrs: knownAttributes(g),
          routes: knownRoutesView(g),
          impressions: [],
          facts:
            F.view(g.targetId, {
              knownFacts: g.investigation.knownFacts,
              tickets: [],
              assignedFacts: g.targetPersona?.assignedFacts,
            })?.facts || [],
        },
        envSfx,
        placeKind: classifyPlace(curId, cur?.name || ""),
        mode: g.mode,
        dist: g.dist,
        env: g.env,
        slot: g.slot,
        identity: {
          id: g.identity || null,
          name:
            g.identity && R.identity.list[g.identity]
              ? R.identity.list[g.identity].name
              : null,
          shift: identityShift(),
          kit: g.startKit || null,
        }, // v0.8 身份徽记数据源（状态栏常驻条）
        tags: (g.tags || []).map((t) => ({
          id: t.id,
          name: t.name,
          owner: t.owner,
          type: t.type || "status",
          duration: t.duration.type,
          count: t.duration.count,
        })),
        /* 战术行囊持有物 */
        inventory: (g.player.inventory || []).map((it) => {
          const def =
            R.items && R.items[it.id]
              ? R.items[it.id]
              : { name: it.id, type: "misc", desc: "" };
          return {
            id: it.id,
            name: def.name,
            type: def.type,
            slot: def.slot || null,
            count: it.count || 1,
            equipped: !!it.equipped,
            canEquip: !!(
              def.slot ||
              def.type === "tool" ||
              def.type === "gear" ||
              def.type === "disguise"
            ),
            canUse: def.type === "consumable",
            desc: def.desc || "",
            effectsDesc: def.effectsDesc || "",
          };
        }),
        /* 状态栏 HUD 动态内容管道接通 */
        herAlert:
          g.lastHerAlert ||
          (envSfx
            ? envSfx === "cat"
              ? "🐱 惊动暗巷野猫！垃圾桶传来抓挠声"
              : "🐕 触动庭院犬吠！院内传来低沉低吼"
            : null),
        signal: g.signals?.slice(-8) || [],
        proxLog:
          g.proxLogs && g.proxLogs.length > 0
            ? g.proxLogs.slice(-5).reverse()
            : [],
        assess: g.lastAssess || null,
        ledger: g.lastLedgerSummary || "本轮暂无结算",
        /* 地图 HUD 字段（状态栏 route-tracker + 战术沙盘） */
        area: dailyIdle
          ? map.getDistrict(map.getPlace(g.spatial.playerPlaceId).district).name
          : districtObj
            ? districtObj.name
            : "未知",
        place:
          !dailyIdle && cur && routeView.known[here]
            ? cur.name
            : dailyIdle
              ? map.getPlace(g.spatial.playerPlaceId).name
              : null,
        weather: w.weather,
        weatherName:
          dailyIdle && g.dayPlan.period < 3 && w.weather === "clear"
            ? "晴天"
            : WEATHER_ICON[w.weather] || "🌙 晴夜",
        strikeSealed: cur ? !!cur.strike_sealed : false,
        fam: w.district ? g.famSegs[w.district] || 0 : 0,
        route: routeView,
        exits: dailyIdle ? [] : exits,
        spots: !dailyIdle && cur ? cur.spots || [] : [],
        sanctuaryAlert: dailyIdle ? "" : sanctuaryAlert,
        /* 相册：计数 + 已拍清单（贴墙渲染用） */
        album: (() => {
          const persona = g.targetPersona || {};
          const shots = Object.entries(g.album || {}).map(([k, v]) => ({
            key: k,
            ...v,
          }));
          return {
            count: shots.length,
            total: ALBUM.totalFor(persona),
            shots,
            catalog: ALBUM.captureList(persona, [], "touch").map((c) => ({
              key: c.key,
              slot: c.item.slot,
              name: c.item.name,
              file: c.file,
              angle: c.angle,
            })),
          };
        })(),
        capture: g.capture || null,
      }),
    );
  }

  return { snapshot };
}

module.exports = { createSnapshotSystem };
