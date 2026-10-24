"use strict";
// 调查熟练度：证据登记、路线加值、整段奖励及幂等状态；仅沿原整卡存档保存。
const R = require("../config/rules.json").investigation;
const { restoreRoutes, rememberEdge } = require("./known-routes.js");
const LP = require("../config/lifepack.json");
const F = require("./facts.js");
const { TAIL_PUMP_IDS } = require("./game/constants.js");
const good = (a) =>
  !a.rejected && ["success", "grace", "nat20"].includes(a.band);
const clone = (x) => JSON.parse(JSON.stringify(x));
function createInvestigation({ g, L }) {
  let origin = null;
  const facts = () =>
    g.targetPersona?.assignedFacts || LP.packs[g.targetId]?.factPool || [];
  const routeKey = () =>
    JSON.stringify([g.route?.id || "", g.route?.nodes || []]);
  const edgeKey = (from, to) => JSON.stringify([from, to]);
  function restore(saved) {
    const value = g.investigation;
    if (value && value.targetId === g.targetId) {
      const lists = ["knownFacts", "edges", "rewardedClues", "minimumDays"];
      if (
        value.schema !== 1 ||
        lists.some(
          (k) =>
            !Array.isArray(value[k]) ||
            value[k].some((x) => typeof x !== "string"),
        ) ||
        (value.session &&
          (!Number.isInteger(value.session.effective) ||
            value.session.effective < 0 ||
            !Array.isArray(value.session.clues) ||
            value.session.clues.some((x) => typeof x !== "string") ||
            typeof value.session.route !== "string" ||
            !Number.isInteger(value.session.date)))
      )
        throw Object.assign(Error("存档调查记录无效：investigation"), {
          code: "SAVE_INVALID",
        });
      g.investigation = clone(value);
      restoreRoutes(g);
      return;
    }
    const knownFacts = saved
      ? (
          F.legacyView(g.targetId, {
            pi: L.get("pi"),
            assignedFacts: g.targetPersona?.assignedFacts,
            tickets: [],
          })?.facts || []
        ).map((f) => f.id)
      : [];
    g.investigation = {
      schema: 1,
      targetId: g.targetId,
      knownFacts,
      edges: [],
      rewardedClues: [
        ...knownFacts.map((id) => "fact:" + id),
        ...(g.targetKnowledge?.known || []).map((k) => "attr:" + k),
      ],
      minimumDays: [],
      session: null,
      lastReceipt: null,
    };
    restoreRoutes(g);
  }
  function session() {
    const p = g.investigation;
    if (!p.session)
      p.session = {
        date: L.get("date"),
        route: routeKey(),
        effective: 0,
        clues: [],
      };
    return p.session;
  }
  function applyKnownRoute() {
    if (!g.route?.nodes) return;
    g.route.known ||= g.route.nodes.map((_, i) => (i === 0 ? 1 : 0));
    for (let i = 1; i < g.route.nodes.length; i++) {
      if (
        g.investigation.edges.includes(
          edgeKey(g.route.nodes[i - 1], g.route.nodes[i]),
        )
      )
        g.route.known[i] = 1;
    }
  }
  function beginTurn() {
    applyKnownRoute();
    origin = {
      here: g.route?.here,
      place: g.route?.nodes?.[g.route.here],
      route: routeKey(),
      visual:
        g.spatial?.tracking === "visual" &&
        !g.spatial.assumed &&
        g.spatial.lastSeen?.targetId === g.targetId &&
        g.spatial.lastSeen?.date === L.get("date") &&
        g.spatial.lastSeen?.placeId === g.route?.nodes?.[g.route.here],
    };
  }
  function nextBonus(id) {
    if (
      !TAIL_PUMP_IDS.includes(id) ||
      !origin?.visual ||
      origin.route !== routeKey()
    )
      return 0;
    // 判定前时钟可能已推进；只能为原目视点的紧邻下一站加值，跨站不套旧情报。
    const here = g.route?.here;
    if (here !== origin.here && here !== origin.here + 1) return 0;
    const next = g.route.nodes[origin.here + 1];
    if (!next || !g.investigation.edges.includes(edgeKey(origin.place, next)))
      return 0;
    return R.knownNextBands.reduce(
      (v, [min, bonus]) => (L.get("pi") >= min ? bonus : v),
      0,
    );
  }
  function confirmEdge(i) {
    if (!Number.isInteger(i) || i < 1 || !g.route?.nodes?.[i]) return;
    const edge = edgeKey(g.route.nodes[i - 1], g.route.nodes[i]);
    if (!g.investigation.edges.includes(edge)) g.investigation.edges.push(edge);
    rememberEdge(g, g.route.nodes[i - 1], g.route.nodes[i]);
  }
  function exposure(id, dist) {
    if (!TAIL_PUMP_IDS.includes(id)) return null;
    const base = R.nearExposure[dist] || 0;
    if (!base) return null;
    const reduction = Math.min(
      Math.floor(Math.max(0, g.player.agi) / R.agilityPerReduction),
      Math.floor(base * R.maxReductionFraction),
    );
    return { base, reduction, applied: base - reduction, dist };
  }
  function addClue(id, discovered) {
    const p = g.investigation,
      s = session();
    if (!p.rewardedClues.includes(id) && !s.clues.includes(id)) {
      s.clues.push(id);
      discovered.push({ id, pi: R.firstClue });
    }
  }
  function record(action) {
    const discovered = [];
    if (!good(action)) return discovered;
    const p = g.investigation;
    const tracking =
      TAIL_PUMP_IDS.includes(action.id) &&
      origin?.visual &&
      origin.route === routeKey();
    const here = g.route?.here;
    if (tracking && here === origin.here + 1) {
      const place = g.route.nodes[here];
      const edge = edgeKey(origin.place, place);
      if (!p.edges.includes(edge)) {
        p.edges.push(edge);
        addClue("edge:" + edge, discovered);
      }
      rememberEdge(g, origin.place, place);
      g.route.known[here] = 1;
    }
    // 不由角色台词／模型票据解锁；只认当前可观察地点与事实自己的动作证据。
    const place = g.route?.nodes?.[here];
    const visible =
      origin?.visual &&
      g.route?.known?.[here] === 1 &&
      (place === origin.place || (tracking && here === origin.here + 1));
    if (visible) {
      for (const f of facts()) {
        if (
          !f.public &&
          f.place &&
          f.place === place &&
          (f.reveal_via || []).includes(action.id) &&
          !p.knownFacts.includes(f.id)
        ) {
          p.knownFacts.push(f.id);
          addClue("fact:" + f.id, discovered);
        }
      }
      if (action.attributeUnlock)
        addClue("attr:" + action.attributeUnlock.key, discovered);
    }
    return discovered;
  }
  function finish(reason) {
    const p = g.investigation,
      s = p.session;
    if (!s) return null;
    const dayKey = JSON.stringify([s.date, s.route]);
    const minimum =
      s.effective > 0 && !p.minimumDays.includes(dayKey) ? R.minimum : 0;
    const clues = [...new Set(s.clues)].filter(
      (id) => !p.rewardedClues.includes(id),
    );
    const base = minimum + clues.length * R.firstClue;
    const r = base
      ? L.commit({ pi: base }, { reason: "investigation-session" })
      : null;
    if (minimum) p.minimumDays.push(dayKey);
    p.rewardedClues.push(...clues);
    // 身份倍率沿原过夜补差，基数来自已完成的整段奖励，不再来自普通动作。
    g.nightPiGross = (g.nightPiGross || 0) + (r?.applied.pi || 0);
    const receipt = {
      reason,
      date: s.date,
      effective: s.effective,
      minimum,
      clues,
      clueGain: clues.length * R.firstClue,
      pi: r?.applied.pi || 0,
    };
    p.lastReceipt = receipt;
    p.session = null;
    g.signals ||= [];
    g.signals.push([
      "调查结算",
      `${reason}：有效跟随 ${s.effective} 段，保底 +${minimum}，首次线索 ${clues.length} 项 +${receipt.clueGain}，PI实际 +${receipt.pi}`,
    ]);
    g.signals = g.signals.slice(-20);
    return clone(receipt);
  }
  function endTurn(results, { deferFailure = false } = {}) {
    const attempts = results.actions.filter(
      (a) => TAIL_PUMP_IDS.includes(a.id) && !a.rejected && a.band,
    );
    const successful =
      origin?.visual && origin.route === routeKey() && attempts.some(good);
    if (successful) session().effective++;
    const failed = attempts.some((a) => ["fail", "nat1"].includes(a.band));
    if (failed && deferFailure) return null;
    if (
      failed ||
      (attempts.length && g.route?.here >= g.route?.nodes.length - 1) ||
      (g.fleeing && g.route?.here >= g.route?.nodes.length - 1) ||
      g.alertEvent?.stage === 4
    )
      return finish(
        failed ? "尾行中断" : g.fleeing ? "目标离开" : "本次路线结束",
      );
    return null;
  }
  return {
    restore,
    beginTurn,
    nextBonus,
    confirmEdge,
    applyKnownRoute,
    exposure,
    record,
    endTurn,
    finish,
  };
}
module.exports = { createInvestigation };
