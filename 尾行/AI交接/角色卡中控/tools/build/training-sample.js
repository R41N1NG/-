"use strict";
// 构建时运行正式引擎，再白名单投影为固定教学案例；不读取玩家变量。
const { createGame } = require("../../src/runtime/game.js");
const { defaultInit } = require("../../src/host/initial-state.js");
function trainingInit() {
  const init = defaultInit();
  // 课件只提供公开入场点，不能在终端截图中提前亮出后续路线。
  init.route.known = init.route.nodes.map((_, i) => (i === 0 ? 1 : 0));
  return init;
}
function trainingScenes() {
  const game = createGame({ ...trainingInit(), sessionSalt: "tutorial-3" });
  const before = game.snapshot();
  const result = game.settleInput("", {
    actions: [{ id: "scan", name: "打量", args: {} }],
  });
  const action = result.actions[0],
    after = game.snapshot();
  if (action?.band !== "success" || !after.signal?.length)
    throw Error("教学案例未产生预期的本地打量结果，请核对引擎规则后更新案例");
  let lostBefore, lostAfter;
  for (let i = 0; i < 80; i++) {
    const g = createGame({ ...trainingInit(), sessionSalt: `lost-${i}` });
    const first = g.snapshot();
    const r = g.settleInput("", {
      actions: [{ id: "follow", name: "跟缀", args: { dist: "same" } }],
    });
    if (r.actions[0]?.band === "fail") {
      lostBefore = first;
      lostAfter = g.snapshot();
      break;
    }
  }
  if (!lostAfter || lostAfter.cityMap.target?.live)
    throw Error("跟丢示例未成立");
  return { before, after, result, action, lostBefore, lostAfter };
}
function buildTrainingSample() {
  const { before, after, result, action, lostBefore, lostAfter } =
    trainingScenes();
  const view = (s) => ({
    place: s.cityMap.player.name,
    playerPlaceId: s.cityMap.player.placeId,
    targetPlaceId: s.cityMap.target?.live ? s.cityMap.target.placeId : null,
    targetLive: !!s.cityMap.target?.live,
    heart: s.player.heart,
    stamina: s.player.stamina,
    pi: s.player.pi,
    date: s.player.date,
    period: s.dayPlan.periodName,
    remaining: s.dayPlan.remaining,
    budget: s.dayPlan.budget,
    source: s.dayPlan.source,
  });
  return {
    caseId: "college-scan-success",
    targetName: before.target.name,
    before: view(before),
    after: view(after),
    capture: after.capture,
    settlement: {
      floor: 1,
      actions: result.actions,
      account: result.package.account,
      seg: result.seg,
    },
    lost: {
      before: lostBefore.cityMap.target,
      after: lostAfter.cityMap.target,
    },
    action: {
      id: action.id,
      name: action.name,
      band: action.band,
      d20: action.d20,
      total: action.total,
      dc: action.dc,
    },
    record: after.signal.at(-1),
    delta: {
      pi: after.player.pi - before.player.pi,
      stamina: after.player.stamina - before.player.stamina,
    },
    // 打量不会直接揭示属性，且本例没有解锁新的档案条目。
    newFactCount: after.profile.facts.filter(
      (f) => !before.profile.facts.some((old) => old.id === f.id),
    ).length,
    attrsRevealed: Object.keys(after.profile.attrs).length,
  };
}
module.exports = { buildTrainingSample, trainingScenes };
