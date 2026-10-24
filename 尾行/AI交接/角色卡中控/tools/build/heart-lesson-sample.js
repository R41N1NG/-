"use strict";
// 所有教学数字来自规则、实际动作回执与真实UI换算，不接玩家存档。
const { createGame } = require("../../src/runtime/game");
const { defaultInit } = require("../../src/host/initial-state");
const R = require("../../src/config/rules.json");
const C = require("../../src/runtime/checks");
const { heartToBpm } = require("../../src/ui/display");
const { trainingShotHash } = require("./training-shot-hash");
const crypto = require("node:crypto"),
  fs = require("node:fs"),
  path = require("node:path");
function heartLessonHash(root) {
  const h = crypto.createHash("sha256");
  h.update(trainingShotHash(root));
  for (const n of ["heart-lesson-sample.js", "heart-lesson-shots.js"])
    h.update(fs.readFileSync(path.join(root, "tools/build", n)));
  return h.digest("hex");
}
function make(heart, nrv = 5) {
  const init = defaultInit();
  init.route.known = init.route.nodes.map((_, i) => (i === 0 ? 1 : 0));
  return createGame({
    ...init,
    player: { ...init.player, nrv },
    stats: { ...init.stats, heart },
    sessionSalt: "heart-lesson-1",
  });
}
function heartLessonScenes() {
  const scenes = {},
    facts = {};
  for (const [id, heart] of Object.entries({
    calm: 30,
    sweet: 50,
    buffer: 68,
    deform: 75,
    crash: 95,
  })) {
    const g = make(heart);
    scenes[id] = g.snapshot();
    const action = g.settleInput("", { actions: [{ id: "photo" }] }).actions[0];
    if (!action?.heartState) throw Error("心跳教程判定未成立");
    const heartMods = action.mods.filter((m) =>
      ["甜区专注", "操作变形", "操作崩溃"].includes(m.src),
    );
    facts[id] = {
      heart,
      bpm: Math.round(heartToBpm(heart)),
      mods: heartMods,
      mod: heartMods.reduce((n, m) => n + m.v, 0),
      sweet: action.heartState.sweet,
      tax: -C.staminaSegTax(heart),
    };
  }
  const g = make(75),
    before = g.snapshot(),
    result = g.settleInput("", { actions: [{ id: "breath" }] }),
    after = g.snapshot();
  scenes.breath = after;
  facts.breath = {
    before: before.player.heart,
    after: after.player.heart,
    direct: result.actions[0].ledger.applied.heart,
    other:
      after.player.heart -
      before.player.heart -
      result.actions[0].ledger.applied.heart,
    stamina: after.player.stamina - before.player.stamina,
    turns: 1,
    ap: after.dayPlan.remaining - before.dayPlan.remaining,
  };
  const advanced = make(70, 10);
  const a = advanced.settleInput("", { actions: [{ id: "photo" }] }).actions[0];
  facts.advanced = {
    high: a.heartState.sweetHigh,
    mods: a.mods.filter((m) => ["甜区专注", "操作变形"].includes(m.src)),
  };
  facts.rules = {
    sweetLow: R.check.sweetLow,
    sweetHigh: R.check.sweetHigh,
    sweetBonus: R.check.sweetBonus,
    deform: R.heart.deformLine,
    crash: R.heart.crashLine,
    floor: R.heart.floor,
  };
  return { scenes, facts };
}
module.exports = { heartLessonHash, heartLessonScenes };
