"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { staminaLessonScenes } = require("../tools/build/stamina-lesson-sample");
const { mountStaminaLesson } = require("../src/ui/zero-floor/stamina-lesson");
const { createLifecycle } = require("../src/ui/lifecycle");
const root = path.resolve(__dirname, "..");
function ui(skip = false) {
  const d = new JSDOM(
      fs.readFileSync(
        path.join(root, "src/ui/zero-floor/stamina-lesson.html"),
        "utf8",
      ),
      { url: "https://lesson.test/" },
    ),
    w = d.window,
    l = createLifecycle(w),
    { facts } = staminaLessonScenes();
  if (skip)
    w.localStorage.setItem(
      "wx_tutorial_preferences_v1",
      JSON.stringify({ version: 1, skipAll: true }),
    );
  const lesson = mountStaminaLesson({
    document: w.document,
    window: w,
    lifecycle: l,
    shots: {},
    facts,
  });
  return { d, w, l, lesson, $: (id) => w.document.getElementById(id) };
}
test("体力教程从真实连续回合取数，费用、补给、疲劳与物品减少均一致", () => {
  const { facts: f, receipts: r } = staminaLessonScenes();
  assert.deepEqual(f.costs, { follow: 4, scan: 2, photo: 3 });
  assert.equal(f.first.stamina, 28);
  assert.equal(f.first.after, 23);
  assert.equal(f.first.actionCost, 4);
  assert.equal(f.first.tax, 1);
  assert.equal(f.first.fatigue, 3);
  assert.deepEqual(f.supply, {
    before: 23,
    after: 43,
    gain: 20,
    countBefore: 2,
    countAfter: 1,
    turns: 0,
  });
  assert.equal(f.second.fatigue, 1);
  assert.equal(f.second.dcWithoutSupply - f.second.dc, 2);
  assert.equal(f.second.d20, f.second.d20WithoutSupply);
  assert.equal(r.first.actions[0].fatigueDC, 3);
  assert.equal(r.second.actions[0].fatigueDC, 1);
  assert.deepEqual(f.rest, {
    before: 28,
    after: 78,
    apBefore: 4,
    apAfter: 3,
    periodBefore: "午后",
    periodAfter: "晚间",
  });
});
test("课件只投影公开状态，不把存档、隐藏目标、无补给对照存档送进页面", () => {
  const s = staminaLessonScenes();
  assert.equal(s.scenes.start.target.alert, undefined);
  assert.equal(s.facts.target, undefined);
  for (const r of Object.values(s.receipts)) {
    assert.equal(r.targetState, undefined);
    assert.equal(r.player, undefined);
    assert.equal(r.ledgerState, undefined);
  }
  // 调用者改一份样例，不应改动其它记录。
  const first = s.scenes.first.player.stamina;
  s.scenes.supplied.player.stamina = 999;
  assert.equal(s.scenes.first.player.stamina, first);
});
test("四步可前后切换，不写游戏进度，完成后不再响应翻页", () => {
  const u = ui();
  try {
    assert.equal(u.$("staminaLesson").hidden, false);
    assert.equal(u.$("staminaStepCount").textContent, "1 / 4");
    assert.equal(u.$("staminaPrev").disabled, true);
    u.$("staminaNext").click();
    assert.match(u.$("staminaStepReadings").textContent, /28 → 23/);
    u.lesson.show(2);
    assert.match(u.$("staminaStepReadings").textContent, /23 → 43/);
    u.lesson.show(3);
    assert.equal(u.$("staminaNext").disabled, true);
    assert.match(u.$("staminaStepReadings").textContent, /＋3 → ＋1/);
    assert.equal(u.w.localStorage.length, 0);
    u.$("staminaLessonComplete").click();
    assert.equal(u.$("staminaLesson").hidden, true);
    u.lesson.show(0);
    assert.equal(u.$("staminaStepCount").textContent, "4 / 4");
    assert.equal(u.w.localStorage.length, 0);
  } finally {
    u.l.dispose();
    u.w.close();
  }
});
test("一键跳过覆盖未来课程、刷新后不挂图片或步骤，存储不可用也在本页生效", () => {
  const u = ui();
  try {
    u.$("staminaLessonSkipAll").click();
    assert.equal(
      JSON.parse(u.w.localStorage.getItem("wx_tutorial_preferences_v1"))
        .skipAll,
      true,
    );
  } finally {
    u.l.dispose();
    u.w.close();
  }
  const v = ui(true);
  try {
    assert.equal(v.$("staminaLesson").hidden, true);
    assert.equal(v.$("staminaSteps").childElementCount, 0);
    assert.equal(v.$("staminaStepPictures").childElementCount, 0);
    v.lesson.show(0);
    assert.equal(v.$("staminaStepPictures").childElementCount, 0);
  } finally {
    v.l.dispose();
    v.w.close();
  }
  const t = ui();
  try {
    t.w.Storage.prototype.setItem = () => {
      throw Error("unavailable");
    };
    t.$("staminaLessonSkipAll").click();
    assert.equal(t.$("staminaLesson").hidden, true);
    assert.match(t.$("staminaLessonDoneText").textContent, /未能保存/);
  } finally {
    t.l.dispose();
    t.w.close();
  }
});
