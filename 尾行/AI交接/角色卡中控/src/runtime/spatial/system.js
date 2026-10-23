"use strict";
const { places, districts } = require("../../config/places.json");
const layout = require("../../config/city-layout.json");
const { routes } = require("../../config/city-transit.json");
const transitLinks = routes.flatMap((r) =>
  r.stops.slice(1).map((to, i) => [r.stops[i], to]),
);
const { TAIL_PUMP_IDS } = require("../game/constants.js");
const clone = (x) => JSON.parse(JSON.stringify(x));
const activeScene = (g) =>
  ["stealth", "contact", "vehicle"].includes(g.mode) &&
  (g.dayPlan.source !== "daily" || g.dayPlan.activity?.kind === "tailing");
function routePlace(g) {
  const id = g.route?.nodes?.[g.route.here];
  return places[id] && g.route?.known?.[g.route.here] === 1 ? id : null;
}
function sceneVisible(g) {
  return (
    activeScene(g) &&
    g.spatial.tracking === "visual" &&
    g.spatial.lastSeen?.targetId === (g.targetId || "college") &&
    g.spatial.lastSeen?.turn === (g.floor || 0) &&
    g.spatial.lastSeen.placeId === routePlace(g) &&
    g.spatial.playerPlaceId === g.spatial.lastSeen.placeId
  );
}
function observeScene(g, date, results) {
  if (!activeScene(g)) return;
  const attempts = (results?.actions || []).filter(
    (a) => TAIL_PUMP_IDS.includes(a.id) && !a.rejected && a.band,
  );
  const attempt = attempts.at(-1);
  const escaped = g.fleeing && g.route?.here >= g.route?.nodes.length - 1;
  if (["fail", "nat1"].includes(attempt?.band) || escaped) {
    g.spatial.tracking = "lost";
    return;
  }
  if ((g.spatial.tracking === "lost" || g.spatial.assumed) && !attempt) return;
  // 合法成功跟进沿原玩法更新当前目击点；不据此补出已走过的连接或未来路线。
  if (attempt && ["success", "grace", "nat20"].includes(attempt.band)) {
    const here = g.route?.here;
    if (places[g.route?.nodes?.[here]]) {
      g.route.known ||= g.route.nodes.map(() => 0);
      g.route.known[here] = 1;
    }
  }
  const id = routePlace(g);
  if (!id) return;
  g.spatial.playerPlaceId = id;
  g.spatial.assumed = false;
  g.spatial.tracking = "visual";
  g.spatial.lastSeen = {
    targetId: g.targetId || "college",
    placeId: id,
    date,
    period: g.dayPlan.period,
    turn: g.floor || 0,
  };
  if (!g.spatial.knownPlaces.includes(id)) g.spatial.knownPlaces.push(id);
}
function moveReason(ctx, id) {
  const p = places[id];
  if (!p) return "没有这个地点";
  if (layout.privatePlaces.includes(id))
    return "这里需要原有的场所进入条件，地图不能直接进入";
  if (p.district === "D") return "北郊交通条件尚未接通";
  if (id === ctx.spatial.playerPlaceId) return "你已在这里";
  const queue = [ctx.spatial.playerPlaceId],
    seen = new Set(queue);
  while (queue.length) {
    const here = queue.shift();
    if (here === id) return null;
    const exits = [
      ...(places[here]?.exits || []),
      ...transitLinks.flatMap(([a, b]) =>
        a === here ? [b] : b === here ? [a] : [],
      ),
    ];
    for (const next of exits)
      if (
        !seen.has(next) &&
        places[next]?.district !== "D" &&
        !layout.privatePlaces.includes(next)
      ) {
        seen.add(next);
        queue.push(next);
      }
  }
  return "当前没有可通行路线";
}
function prepareMove(ctx, id) {
  const reason = moveReason(ctx, id);
  if (reason) throw Object.assign(Error(reason), { code: "DAY_UNAVAILABLE" });
  const spatial = clone(ctx.spatial);
  spatial.playerPlaceId = id;
  spatial.assumed = false;
  return { summary: `已前往${places[id].name}，市内移动不消耗行动点`, spatial };
}
function cityView(g, date) {
  const spatial = g.spatial,
    live = sceneVisible(g) && spatial.lastSeen?.date === date;
  const nodes = Object.entries(places).map(([id, p]) => {
    const hidden =
      layout.privatePlaces.includes(id) &&
      !spatial.knownPlaces.includes(id) &&
      spatial.playerPlaceId !== id;
    const [x, y] = layout.coordinates[id];
    const frame = layout.frames[p.district];
    return {
      id,
      district: p.district,
      name: hidden ? "未探明区域" : p.mapName || p.name,
      sector: hidden ? null : p.sector,
      facility: hidden ? null : p.facility ? { ...p.facility } : null,
      x: x + frame.x,
      y: y + frame.y,
      hidden,
      service:
        id === layout.blackMarket
          ? "black_market"
          : id === layout.home
            ? "home"
            : null,
      moveReason:
        g.dayPlan.source !== "daily"
          ? "原尾行流程中由回合决定移动"
          : g.dayPlan.activity
            ? "请先结束当前活动"
            : g.dayPlan.ended
              ? "本日已结束"
              : moveReason({ spatial }, id),
    };
  });
  const edges = [];
  for (const [id, p] of Object.entries(places))
    for (const to of p.exits) {
      if (places[to].exits.includes(id) && id > to) continue;
      edges.push({
        from: id,
        to,
        transit: false,
        oneWay: !places[to].exits.includes(id),
      });
    }
  for (const [from, to] of transitLinks)
    edges.push({ from, to, transit: true });
  const last =
    spatial.lastSeen?.targetId === (g.targetId || "college")
      ? spatial.lastSeen
      : null;
  return {
    width: layout.width,
    height: layout.height,
    frames: Object.entries(layout.frames).map(([id, f]) => ({
      id,
      ...f,
      name: districts[id].name,
      setting: districts[id].setting,
    })),
    nodes,
    edges,
    transit: clone(routes),
    player: {
      placeId: spatial.playerPlaceId,
      name:
        places[spatial.playerPlaceId].mapName ||
        places[spatial.playerPlaceId].name,
      district: places[spatial.playerPlaceId].district,
      assumed: spatial.assumed,
    },
    target: last
      ? {
          placeId: last.placeId,
          name: places[last.placeId].mapName || places[last.placeId].name,
          date: last.date,
          period: last.period,
          live,
          status: live ? "目视位置" : "最后目击",
        }
      : null,
    note: "固定街区地图。地块表示空间分布；可通行范围以地点入口为准。",
  };
}
module.exports = {
  activeScene,
  routePlace,
  observeScene,
  prepareMove,
  cityView,
};
