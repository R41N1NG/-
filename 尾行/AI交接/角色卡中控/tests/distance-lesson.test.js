"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { JSDOM } = require("jsdom");
const {
  distanceLessonScenes,
} = require("../tools/build/distance-lesson-sample");
const { mountDistanceLesson } = require("../src/ui/zero-floor/distance-lesson");
const { createLifecycle } = require("../src/ui/lifecycle");
function ui(skip = false) {
  const d = new JSDOM(
      fs.readFileSync("src/ui/zero-floor/distance-lesson.html", "utf8"),
      { url: "https://lesson.test/" },
    ),
    l = createLifecycle(d.window);
  if (skip)
    d.window.localStorage.setItem(
      "wx_tutorial_preferences_v1",
      JSON.stringify({ version: 1, skipAll: true }),
    );
  const lesson = mountDistanceLesson({
    document: d.window.document,
    window: d.window,
    lifecycle: l,
    shots: {},
    facts: distanceLessonScenes().facts,
  });
  return { d, l, lesson, $: (id) => d.window.document.getElementById(id) };
}
test("同属性同骰四距离对照来自实际费用与判定：远端DC2，近距额外暴露与心跳真实增加", () => {
  const { facts: f } = distanceLessonScenes();
  const d = f.distances;
  assert.deepEqual(
    Object.values(d).map((a) => a.d20),
    [16, 16, 16, 16],
  );
  assert.equal(d.far.dc - d.same.dc, 2);
  assert.equal(d.close.dc, d.same.dc);
  assert.equal(d.touch.dc, d.same.dc);
  assert.equal(d.close.exposure.applied, 3);
  assert.equal(d.touch.exposure.applied, 7);
  assert.deepEqual(
    Object.values(d).map((a) => a.heart),
    [30, 33, 37, 41],
  );
  assert.equal(f.agility.agileExposure.reduction, 2);
  assert.equal(f.agility.normalReduction, 1);
});
test("真实反应与当前档位不是固定进度表，不传递原始警觉或分支暗账", () => {
  const { facts: f } = distanceLessonScenes();
  assert.equal(f.signals.pace.kind, "提速");
  assert.equal(f.signals.pace.dist, "same");
  assert.equal(f.signals.turn.kind, "骤停回头");
  assert.equal(f.signals.turn.stage, 1);
  assert.equal(f.signals.run.kind, "开跑");
  for (const a of Object.values(f.signals)) {
    assert.equal(a.alert, undefined);
    assert.equal(a.detail, undefined);
    assert.equal(a.target, undefined);
  }
});
test("实际主动结束保留非空路线连接并结算，返回日程不清空整局", () => {
  const { facts: f, stoppedSave: s } = distanceLessonScenes();
  assert.equal(f.stop.kind, "stopped");
  assert.ok(f.stop.confirmedBefore > 0);
  assert.equal(f.stop.confirmedBefore, f.stop.confirmedAfter);
  assert.equal(f.stop.remaining, 2);
  assert.ok(f.stop.pi > 0);
  assert.equal(s.previewCollege.outcome.kind, "stopped");
});
test("两组对照独立切换、完成后不可继续修改课件，不写游戏进度", () => {
  const u = ui();
  try {
    u.lesson.show("far");
    assert.match(u.$("distanceReadings").textContent, /DC 15/);
    u.lesson.showSignal("turn");
    assert.match(u.$("distanceSignalReading").textContent, /回头/);
    assert.equal(u.d.window.localStorage.length, 0);
    u.$("distanceLessonComplete").click();
    u.lesson.show("same");
    assert.match(u.$("distanceReadings").textContent, /DC 15/);
    assert.equal(u.d.window.localStorage.length, 0);
  } finally {
    u.l.dispose();
    u.d.window.close();
  }
});
test("全跳过覆盖本页，刷新不挂图片或按钮；存储不可用也能在本页关闭", () => {
  const u = ui();
  try {
    u.$("distanceLessonSkipAll").click();
    assert.equal(
      JSON.parse(u.d.window.localStorage.getItem("wx_tutorial_preferences_v1"))
        .skipAll,
      true,
    );
  } finally {
    u.l.dispose();
    u.d.window.close();
  }
  const v = ui(true);
  try {
    assert.equal(v.$("distanceLesson").hidden, true);
    assert.equal(v.$("distanceTabs").childElementCount, 0);
    assert.equal(v.$("distanceEntryPicture").childElementCount, 0);
  } finally {
    v.l.dispose();
    v.d.window.close();
  }
  const w = ui();
  try {
    w.d.window.Storage.prototype.setItem = () => {
      throw Error("no storage");
    };
    w.$("distanceLessonSkipAll").click();
    assert.match(w.$("distanceLessonDoneText").textContent, /未能保存/);
  } finally {
    w.l.dispose();
    w.d.window.close();
  }
});
