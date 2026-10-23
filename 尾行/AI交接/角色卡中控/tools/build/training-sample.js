"use strict";
// 构建时运行正式引擎，再白名单投影为固定教学案例；不读取玩家变量。
const { createGame } = require("../../src/runtime/game.js");
const { defaultInit } = require("../../src/host/initial-state.js");
function buildTrainingSample() {
  const game = createGame({ ...defaultInit(), sessionSalt: "tutorial-0" });
  const before = game.snapshot();
  const result = game.settleInput("", {
    actions: [{ id: "scan", name: "打量", args: {} }],
  });
  const action = result.actions[0],
    after = game.snapshot();
  if (action?.band !== "success" || !after.signal?.length)
    throw Error("教学案例未产生预期的本地打量结果，请核对引擎规则后更新案例");
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
module.exports = { buildTrainingSample };
