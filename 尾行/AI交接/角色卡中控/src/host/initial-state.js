"use strict";
const LP = require("../config/lifepack.json");
const R = require("../config/rules.json");

function defaultInit(overrides = {}) {
  const targetId = (overrides && overrides.targetId) || "college";
  const targetPersona = (overrides && overrides.targetPersona) || null;
  const pack = LP.packs && LP.packs[targetId];
  const targetDef =
    (R.targets && R.targets.list && R.targets.list[targetId]) ||
    (R.targets && R.targets.list && R.targets.list.student);

  let route = null;
  if (pack && pack.routes) {
    const evening =
      pack.routes.find(
        (r) => r.id === "college_evening" || r.id === "workday_evening",
      ) || pack.routes[0];
    if (evening) {
      const startT =
        evening.path && evening.path[0] && evening.path[0].t
          ? `${evening.path[0].t.slice(0, 2)}:${evening.path[0].t.slice(2)}`
          : "21:00";
      route = {
        id: evening.id,
        note: evening.note || "",
        prompt: evening.prompt || "",
        startTime: startT,
        nodes: evening.path.map((s) => s.place),
        times: evening.path.map((s) => s.t),
        known: evening.path.map((_, i) => (i === 0 ? 1 : 0)),
        here: 0,
      };
    }
  } else {
    // 优雅回退：使用默认傍晚动线骨架
    const fallbackPack = LP.packs.student || LP.packs.college;
    const evening =
      fallbackPack.routes.find((r) => r.id === "workday_evening") ||
      fallbackPack.routes[0];
    route = evening
      ? {
          id: evening.id,
          note: evening.note || "",
          prompt: evening.prompt || "",
          startTime: "21:00",
          nodes: evening.path.map((s) => s.place),
          times: evening.path.map((s) => s.t),
          known: evening.path.map((_, i) => (i === 0 ? 1 : 0)),
          here: 0,
        }
      : null;
  }

  let targetStats = pack
    ? { ...pack.stats, social: pack.social }
    : {
        ...(targetDef.stats || { str: 3, agi: 4, per: 5, nrv: 4 }),
        social: targetDef.social || 2,
      };
  if (targetPersona && targetPersona.finalStats) {
    targetStats = Object.assign(targetStats, targetPersona.finalStats);
  }

  let district = "B";
  if (targetId === "club") district = "C";
  else if (targetId === "wife") district = "D";

  return {
    targetId,
    ...(overrides.dailyMode
      ? {
          dayPlan: {
            schema: 1,
            source: "daily",
            period: 3,
            spent: 0,
            activity: null,
            ended: false,
          },
        }
      : {}),
    targetPersona,
    player: { str: 3, agi: 5, nrv: 5, int: 5, cha: 2, staminaMax: 115 },
    target: targetStats,
    stats: { date: 1, heart: 30, cash: 800, pi: 0 },
    world: { weather: "clear", district },
    route,
  };
}

module.exports = { defaultInit };
