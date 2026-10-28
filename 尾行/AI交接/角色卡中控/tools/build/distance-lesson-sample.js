"use strict";
const { createGame } = require("../../src/runtime/game");
const { defaultInit } = require("../../src/host/initial-state");
const { createPreview } = require("./college-preview-model");
const { trainingShotHash } = require("./training-shot-hash");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const clone = (v) => JSON.parse(JSON.stringify(v));
function distanceLessonHash(root) {
  const h = crypto.createHash("sha256");
  h.update(trainingShotHash(root));
  for (const n of [
    "distance-lesson-sample.js",
    "distance-lesson-shots.js",
    "lesson-capture.js",
    "college-preview-model.js",
    "college-preview-entry.js",
    "college-preview-tail-view.js",
    "college-preview-tail.html",
    "college-preview-tail.css",
    "college-preview-time.js",
    "college-preview-work.js",
    "college-preview.js",
  ])
    h.update(fs.readFileSync(path.join(root, "tools/build", n)));
  h.update(fs.readFileSync(path.join(root, "src/host/initial-state.js")));
  return h.digest("hex");
}
function distanceLessonScenes() {
  const scenes = {},
    receipts = {},
    facts = { distances: {}, signals: {} };
  for (const dist of ["far", "same", "close", "touch"]) {
    const g = createGame({
        ...defaultInit(),
        dist,
        sessionSalt: "distance-lesson-0",
      }),
      before = g.snapshot();
    const r = g.settleInput("", {
        actions: [{ id: "follow", args: { dist } }],
      }),
      a = r.actions[0];
    scenes[dist] = g.snapshot();
    receipts[dist] = clone({
      floor: r.floor,
      actions: r.package.actions,
      account: r.package.account,
      seg: r.package.seg,
    });
    facts.distances[dist] = {
      beforeHeart: before.player.heart,
      heart: scenes[dist].player.heart,
      staminaCost: before.player.stamina - scenes[dist].player.stamina,
      d20: a.d20,
      dc: a.dc,
      distanceDC: a.distanceDC,
      band: a.band,
      exposure: a.exposure ? clone(a.exposure) : null,
    };
  }
  // 分别设定临近不同反应的训练初态，不将这些暗账数字传入课件。
  for (const [id, alert] of [
    ["pace", 20],
    ["turn", 40],
    ["run", 60],
  ]) {
    const init = defaultInit(),
      g = createGame({
        ...init,
        dist: "close",
        stats: { ...init.stats, alert },
        sessionSalt: "distance-signal-0",
      });
    g.settleInput("", { actions: [{ id: "follow", args: { dist: "close" } }] });
    const snap = g.snapshot();
    scenes[id] = snap;
    facts.signals[id] = {
      kind: g._g.alertEvent.kind,
      signal: snap.herAlert,
      stage: snap.target.alertStage,
      dist: snap.dist,
    };
  }
  const init = defaultInit(),
    agile = createGame({
      ...init,
      dist: "close",
      player: { ...init.player, agi: 8 },
      sessionSalt: "distance-lesson-0",
    });
  facts.agility = {
    normal: 5,
    agile: 8,
    normalReduction: facts.distances.close.exposure.reduction,
    agileExposure: agile.settleInput("", {
      actions: [{ id: "follow", args: { dist: "close" } }],
    }).actions[0].exposure,
  };
  const p = createPreview(null, { period: 3, seed: "college-preview-2" });
  p.move("school_gate_b");
  p.execute(p.request("start", "daily.tailing"));
  p.follow();
  p.follow();
  const beforeStop = clone(p.save());
  p.execute(p.request("cancel"));
  const after = p.snapshot();
  facts.stop = {
    title: after.previewTailing.outcome.title,
    kind: after.previewTailing.outcome.kind,
    confirmedBefore: beforeStop.investigation.edges.length,
    confirmedAfter: p.save().investigation.edges.length,
    remaining: after.dayPlan.remaining,
    pi: after.previewTailing.outcome.pi,
  };
  return { scenes, receipts, facts, stoppedSave: clone(p.save()) };
}
module.exports = { distanceLessonScenes, distanceLessonHash };
