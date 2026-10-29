"use strict";
// 每个案例均运行正式引擎；只将可见快照和规则费用交给课件。
const { createGame } = require("../../src/runtime/game");
const { defaultInit } = require("../../src/host/initial-state");
const { createPreview } = require("./college-preview-model");
const { fatigueOf } = require("../../src/contracts/stamina");
const R = require("../../src/config/rules.json");
const lex = require("../../src/config/lexicon.json");
const { trainingShotHash } = require("./training-shot-hash");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const clone = (v) => JSON.parse(JSON.stringify(v));
function staminaLessonHash(root) {
  const h = crypto.createHash("sha256");
  h.update(trainingShotHash(root));
  for (const n of [
    "stamina-lesson-sample.js",
    "stamina-lesson-shots.js",
    "settlement-capture.js",
    "college-preview-model.js",
    "college-preview-work.js",
    "college-preview-time.js",
  ])
    h.update(fs.readFileSync(path.join(root, "tools/build", n)));
  h.update(fs.readFileSync(path.join(root, "src/host/initial-state.js")));
  return h.digest("hex");
}
function staminaLessonScenes() {
  const init = defaultInit(),
    g = createGame({
      ...init,
      stats: { ...init.stats, stamina: 28, heart: 30 },
      sessionSalt: "stamina-lesson-0",
    });
  g.addItem("bento", 2);
  const scenes = { start: g.snapshot() },
    facts = {};
  const first = clone(
    g.settleInput("", { actions: [{ id: "follow", args: { dist: "same" } }] }),
  );
  scenes.first = first.stats;
  scenes.bag = g.snapshot();
  const beforeSupply = g.save(),
    supply = g.useItem("bento");
  if (!supply.ok) throw Error(supply.reason);
  scenes.supplied = g.snapshot();
  const supplyTurn = g._g.floor;
  const second = clone(
    g.settleInput("", { actions: [{ id: "follow", args: { dist: "same" } }] }),
  );
  scenes.second = second.stats;
  // 同一个待判定回合的对照，验证补给只使疲劳部分降低2；不将隐藏修正投影到课件。
  const without = createGame({ saved: beforeSupply }).settleInput("", {
    actions: [{ id: "follow", args: { dist: "same" } }],
  }).actions[0];
  const receipt = (r) => ({
    floor: r.floor,
    actions: r.package.actions,
    account: r.package.account,
    seg: r.package.seg,
  });
  const a = first.actions[0],
    b = second.actions[0];
  facts.first = {
    stamina: scenes.start.player.stamina,
    after: scenes.first.player.stamina,
    dc: a.dc,
    fatigue: a.fatigueDC,
    actionCost: -a.ledger.applied.stamina,
    tax: -first.seg.staminaTax,
    band: a.band,
  };
  facts.supply = {
    before: scenes.bag.player.stamina,
    after: scenes.supplied.player.stamina,
    gain: scenes.supplied.player.stamina - scenes.bag.player.stamina,
    countBefore: scenes.bag.inventory.find((i) => i.id === "bento").count,
    countAfter: scenes.supplied.inventory.find((i) => i.id === "bento").count,
    turns: supplyTurn - beforeSupply.floor,
  };
  facts.second = {
    before: scenes.supplied.player.stamina,
    after: scenes.second.player.stamina,
    dc: b.dc,
    fatigue: b.fatigueDC,
    band: b.band,
    dcWithoutSupply: without.dc,
    d20: b.d20,
    d20WithoutSupply: without.d20,
  };
  const p = createPreview(null, { period: 2 });
  p.game.gmSet({ stamina: 28 - p.game.ledger.get("stamina") });
  scenes.restBefore = p.snapshot();
  const req = p.request("start", "daily.rest");
  p.execute(req);
  scenes.restAfter = p.snapshot();
  facts.rest = {
    before: scenes.restBefore.player.stamina,
    after: scenes.restAfter.player.stamina,
    apBefore: scenes.restBefore.dayPlan.remaining,
    apAfter: scenes.restAfter.dayPlan.remaining,
    periodBefore: scenes.restBefore.dayPlan.periodName,
    periodAfter: scenes.restAfter.dayPlan.periodName,
  };
  facts.maximum = scenes.start.player.staminaMax;
  facts.costs = Object.fromEntries(
    ["follow", "scan", "photo"].map((id) => [
      id,
      lex.entries.find((e) => e.id === id).cost.stamina,
    ]),
  );
  facts.bands = [115, 57, 28, 0].map((current) => ({
    current,
    ...fatigueOf(current, facts.maximum, R.stamina.fatigue),
  }));
  facts.rules = clone(R.stamina.fatigue);
  const empty = createGame({
      ...defaultInit(),
      stats: { stamina: 0 },
      sessionSalt: "stamina-empty",
    }),
    before = empty.save();
  try {
    empty.settleInput("", { actions: [{ id: "follow" }] });
    throw Error("耗尽样例未拒绝");
  } catch (e) {
    if (e.code !== "STAMINA_INSUFFICIENT") throw e;
  }
  if (JSON.stringify(empty.save()) !== JSON.stringify(before))
    throw Error("费用拒绝改变了游戏进度");
  scenes.empty = empty.snapshot();
  return {
    scenes,
    facts,
    receipts: { first: receipt(first), second: receipt(second) },
  };
}
module.exports = { staminaLessonHash, staminaLessonScenes };
