"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  { JSDOM } = require("jsdom"),
  fs = require("node:fs"),
  path = require("node:path");
const {
  mountDayTailingCourse,
  PAGES,
  SITUATIONS,
} = require("../src/ui/zero-floor/day-tailing-course");
const { createLifecycle } = require("../src/ui/lifecycle"),
  { TUTORIAL_KEY } = require("../src/ui/zero-floor/tutorial-policy");
function setup(skip = false) {
  const dom = new JSDOM(
      fs.readFileSync(
        path.resolve(__dirname, "../src/ui/zero-floor/day-tailing-course.html"),
        "utf8",
      ),
      { url: "https://tutorial.test" },
    ),
    { window } = dom,
    document = window.document;
  if (skip)
    window.localStorage.setItem(
      TUTORIAL_KEY,
      JSON.stringify({ version: 1, skipAll: true }),
    );
  const lifecycle = createLifecycle(window),
    shots = {};
  for (const id of ["day", "move", "entry", ...SITUATIONS.map((s) => s.key)])
    shots[id] = {
      src: "data:image/png;base64,",
      width: 100,
      height: 100,
      boxes: [
        {
          left: 10,
          top: 20,
          width: 30,
          height: 40,
          title: "入口",
          note: "实际位置",
        },
        {
          left: 50,
          top: 20,
          width: 20,
          height: 40,
          title: "费用",
          note: "提前显示",
        },
      ],
    };
  let done = 0;
  window.WxGlue = {
    newGame: () => {
      throw Error("教程不能建档");
    },
    command: () => {
      throw Error("教程不能执行行动");
    },
  };
  const ui = mountDayTailingCourse({
    document,
    window,
    lifecycle,
    shots,
    onComplete: () => done++,
  });
  return {
    ui,
    window,
    document,
    done: () => done,
    close: () => {
      lifecycle.dispose();
      window.close();
    },
  };
}
test("第二组翻页、情形切换和标注只读，不写游戏进度", () => {
  const t = setup();
  try {
    assert.equal(PAGES.length, 4);
    assert.equal(t.ui.getPage(), 0);
    const marker = t.document.querySelectorAll(".training-shot-mark");
    assert.equal(marker[1].hidden, true);
    t.document.querySelectorAll(".training-shot-choice")[1].click();
    assert.equal(marker[0].hidden, true);
    assert.equal(marker[1].hidden, false);
    t.ui.show(3);
    for (let n = 0; n < SITUATIONS.length; n++) {
      t.document.querySelector(`[data-situation="${n}"]`).click();
      assert.equal(
        t.document.getElementById("dayCourseSituationTitle").textContent,
        SITUATIONS[n].title,
      );
    }
    assert.equal(t.window.localStorage.length, 0);
    assert.equal(t.done(), 0);
    t.document.getElementById("dayCourseNext").click();
    assert.equal(t.done(), 1);
    assert.equal(t.document.getElementById("dayCourse").hidden, true);
    assert.equal(t.window.localStorage.length, 0);
  } finally {
    t.close();
  }
});
test("全跳过跨章节生效，已有偏好时不展示教程正文", () => {
  const t = setup();
  try {
    t.document.getElementById("dayCourseSkipAll").click();
    assert.equal(
      JSON.parse(t.window.localStorage.getItem(TUTORIAL_KEY)).skipAll,
      true,
    );
    assert.equal(t.document.getElementById("dayCourse").hidden, true);
  } finally {
    t.close();
  }
  const r = setup(true);
  try {
    assert.equal(r.document.getElementById("dayCourse").hidden, true);
    assert.equal(r.document.getElementById("dayCourseNav").children.length, 4);
    assert.equal(
      r.document.getElementById("dayCoursePicture").childElementCount,
      0,
    );
    assert.equal(r.ui.isSkipped(), true);
  } finally {
    r.close();
  }
});
test("教学样例来自真实费用与失败状态，早先截图状态不随以后操作变化", () => {
  const { courseScenes } = require("../tools/build/day-tailing-sample"),
    { createPreview } = require("../tools/build/college-preview-model");
  const { scenes } = courseScenes();
  assert.equal(createPreview(scenes.day).snapshot().dayPlan.remaining, 4);
  assert.equal(createPreview(scenes.entry).snapshot().dayPlan.remaining, 4);
  assert.equal(createPreview(scenes.tailing).snapshot().dayPlan.remaining, 2);
  const recovery = createPreview(scenes.recovery).snapshot();
  assert.equal(recovery.previewTailing.recovery.pending, true);
  assert.equal(recovery.player.pi, 0);
  const lost = createPreview(scenes.lost).snapshot();
  assert.equal(lost.previewTailing.outcome.kind, "lost");
  assert.equal(lost.previewTailing.pendingOutcome, true);
  assert.equal(lost.player.pi, 5);
  assert.equal(
    createPreview(scenes.profile).snapshot().previewTailing.pendingOutcome,
    false,
  );
  assert.ok(!JSON.stringify(lost.profile.routes).includes("unit_stairs"));
});
test("第一组已解释待结算线索、定位与动作费用，属性课不承诺揭示社交", () => {
  const { buildTrainingSample } = require("../tools/build/training-sample");
  const sample = buildTrainingSample();
  assert.equal(sample.pendingClues, 1);
  assert.equal(sample.pendingPi, 3);
  assert.equal(sample.after.pi, 0);
  const html = fs.readFileSync(
    path.resolve(__dirname, "../src/ui/zero-floor/training-brief.html"),
    "utf8",
  );
  assert.ok(!html.includes("地图点选只查看"));
  assert.ok(html.includes("内部动作与一次日程行动"));
  assert.ok(html.includes("天然20大成功"));
  const { COURSES } = require("../src/ui/zero-floor/attribute-lessons");
  assert.match(
    COURSES.target.cards.find((c) => c[0] === "soc")[3],
    /暂不列入可揭示属性/,
  );
});
