"use strict";
// route：依赖由 game.js 装配，每个游戏实例独立持有状态。
const { clockMinutes } = require("./clock.js");
const map = require("../map.js");
const LP = require("../../config/lifepack.json");
const TS = require("../target_state.js");

function createRouteSystem({ g, seedAt, applyTargetState }) {
  function setRoute(route) {
    g.route = route;
    if (g.targetState && route && route.nodes) {
      const curId = route.nodes[route.here || 0];
      const curName = curId ? map.getPlace(curId)?.name || curId : null;
      const pack =
        (LP.packs && LP.packs[g.targetId]) ||
        LP.packs.college ||
        LP.packs.student;
      g.targetState.hand = TS.resolveHand(
        pack,
        curId,
        g.targetState.hand,
        seedAt(g.floor || 0, "hand_set_route"),
      );
      if (g.targetState.route) {
        g.targetState.route.id = route.id;
        g.targetState.route.note = route.note;
        g.targetState.route.prompt = route.prompt;
        g.targetState.route.here = route.here || 0;
        g.targetState.route.nodes = route.nodes;
        g.targetState.route.currentPlace = curName;
      }
      applyTargetState();
    }
  }

  function herAdvance(quiet) {
    if (g.route && g.route.here < g.route.nodes.length - 1) {
      g.route.here += 1;
      const toId = g.route.nodes[g.route.here];
      const toName = map.getPlace(toId)?.name || toId;
      if (!quiet) {
        g.signals = g.signals || [];
        g.signals.push(["移动", `目标动向推进：前往 [${toName}]`]);
      }
      if (g.targetState) {
        const pack =
          (LP.packs && LP.packs[g.targetId]) ||
          LP.packs.college ||
          LP.packs.student;
        g.targetState.hand = TS.resolveHand(
          pack,
          toId,
          g.targetState.hand,
          seedAt(g.floor || 0, "hand_adv_" + g.route.here),
        );
        if (g.targetState.route) {
          g.targetState.route.here = g.route.here;
          g.targetState.route.currentPlace = toName;
        }
        applyTargetState();
      }
    }
    if (g.route && g.route.here >= g.route.nodes.length - 1) g.tailing = false; // 她到家：侦探职业病解锁（v0.8）
    return g.route ? g.route.here : -1;
  }

  function routeClockMin(floor) {
    return clockMinutes(g, floor);
  }

  function hhmmToMin(t) {
    const s = String(t || "").replace(":", "");
    if (!/^\d{3,4}$/.test(s)) return null;
    const v = s.padStart(4, "0");
    return parseInt(v.slice(0, 2), 10) * 60 + parseInt(v.slice(2), 10);
  }

  function fmtMin(min) {
    const h = Math.floor(min / 60) % 24;
    return `${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  }

  function advanceRouteByClock() {
    const r = g.route;
    if (
      !r ||
      !Array.isArray(r.nodes) ||
      !Array.isArray(r.times) ||
      !r.times.length
    )
      return r ? r.here || 0 : -1;
    if (g.alertHold > 0) {
      g.alertHold -= 1;
      return r.here || 0;
    } // 过档「进店」：她在店里停一楼
    const now = routeClockMin(g.floor || 1);
    const from = r.here || 0;
    while (r.here < r.nodes.length - 1) {
      let t = null,
        previous = 0;
      for (let index = 0; index <= r.here + 1; index++) {
        t = hhmmToMin(r.times[index]);
        if (t === null) break;
        while (t < previous) t += 1440;
        previous = t;
      }
      if (t === null || t > now) break;
      herAdvance(true);
    }
    if (r.here > from) {
      const toName = map.getPlace(r.nodes[r.here])?.name || r.nodes[r.here];
      g.signals = g.signals || [];
      g.signals.push([fmtMin(now), `目标动向推进：前往 [${toName}]`]);
      if (g.signals.length > 20) g.signals.shift();
    }
    return r.here;
  }

  function revealNode(i) {
    if (g.route && g.route.known && i >= 0 && i < g.route.known.length)
      g.route.known[i] = 1;
  }

  return { setRoute, herAdvance, advanceRouteByClock, revealNode };
}

module.exports = { createRouteSystem };
