"use strict";
const { createPreview } = require("./college-preview-model");
const TIME = require("./college-preview-time");
const { trainingShotHash } = require("./training-shot-hash");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
function courseHash(root) {
  const h = crypto.createHash("sha256");
  h.update(trainingShotHash(root));
  for (const file of [
    "college-preview.js",
    "college-preview-entry.js",
    "college-preview-model.js",
    "college-preview-time.js",
    "college-preview-tail-view.js",
    "college-preview-tail.html",
    "college-preview-tail.css",
    "day-tailing-sample.js",
    "day-tailing-shots.js",
  ])
    h.update(fs.readFileSync(path.join(root, "tools/build", file)));
  return h.digest("hex");
}
const save = (p) => JSON.parse(JSON.stringify(p.save()));
function courseScenes() {
  const p = createPreview(),
    scenes = { day: save(p) };
  p.move("university_canteen_b");
  scenes.move = save(p);
  const q = createPreview(null, { period: 3 });
  q.move("school_gate_b");
  scenes.entry = save(q);
  q.execute(q.request("start", "daily.tailing"));
  scenes.tailing = save(q);
  for (
    let i = 0;
    i < 12 && q.active() && !q.snapshot().previewTailing.recovery.pending;
    i++
  )
    q.follow();
  if (!q.snapshot().previewTailing.recovery.pending)
    throw Error("教程补救样例已改变，请核对真实流程");
  scenes.recovery = save(q);
  q.recover();
  if (q.snapshot().previewTailing.outcome?.kind !== "lost")
    throw Error("教程跟丢样例已改变");
  scenes.lost = save(q);
  q.acknowledgeOutcome();
  scenes.profile = save(q);
  return {
    scenes,
    facts: {
      ap: require("../../src/config/day-plan.json").budget,
      tailCost: require("../../src/config/day-plan.json").tailingCost,
      time: TIME.RULES.perPeriod,
      pendingPi: q.snapshot().player.pi,
      knownSegments: q.snapshot().profile.routes[0]?.segments.length || 0,
    },
  };
}
module.exports = { courseHash, courseScenes };
