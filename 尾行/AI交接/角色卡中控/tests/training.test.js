"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { buildUI } = require("../tools/build/ui");
const { createLifecycle } = require("../src/ui/lifecycle");
function setup() {
  const dom = new JSDOM(buildUI({ writePreview: false }).template, {
    pretendToBeVisual: true,
  });
  const d = dom.window.document,
    lifecycle = createLifecycle(dom.window);
  const calls = [];
  const {
    createTrainingBrief,
  } = require("../src/ui/zero-floor/training-brief");
  const brief = createTrainingBrief({
    document: d,
    lifecycle,
    onBack: () => calls.push("back"),
    onStart: () => calls.push("start"),
  });
  const selection = {
    identity: { name: "阿宅" },
    target: { name: "独居女大学生" },
  };
  brief.setSelection(selection);
  return {
    dom,
    d,
    brief,
    calls,
    selection,
    lifecycle,
    click: (selector) => d.querySelector(selector).click(),
    page: () => Number(d.getElementById("zeroStep3").dataset.trainingPage),
    close: () => {
      lifecycle.dispose();
      dom.window.close();
    },
  };
}
test("五页课件：顺序、边界、返回、键盘与重置，页号不会触发建局", () => {
  const h = setup();
  try {
    assert.equal(h.d.querySelectorAll("#trainingBriefPages button").length, 5);
    assert.equal(h.d.getElementById("trainingBriefStart").hidden, true);
    h.click("#trainingBriefStart");
    assert.deepEqual(h.calls, [], "不能通过隐藏的最终按钮提前建局");
    h.click("#trainingBriefPrev");
    assert.equal(h.page(), 0);
    for (let i = 1; i < 5; i++) {
      h.click("#trainingBriefNext");
      assert.equal(h.page(), i);
      assert.equal(
        h.d.querySelectorAll("[data-training-slide]:not([hidden])").length,
        1,
      );
      assert.equal(h.d.activeElement.id, "trainingBriefTitle");
    }
    h.click("#trainingBriefNext");
    assert.equal(h.page(), 4);
    assert.equal(h.d.getElementById("trainingBriefNext").hidden, true);
    h.click("[data-training-review]");
    assert.equal(h.page(), 3);
    const input = h.d.getElementById("trainingBriefNarration");
    input.dispatchEvent(
      new h.dom.window.KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
      }),
    );
    assert.equal(h.page(), 3, "输入框的方向键不能翻页");
    h.d.getElementById("trainingBriefTitle").dispatchEvent(
      new h.dom.window.KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
      }),
    );
    assert.equal(h.page(), 2);
    assert.deepEqual(h.calls, []);
    h.brief.setSelection(h.selection);
    assert.equal(h.page(), 2, "返回同一选择时保持阅读页");
    h.brief.setSelection({
      identity: { name: "学生" },
      target: { name: "疲惫的OL" },
    });
    assert.equal(h.page(), 0, "切换角色类型后回到开始");
    h.click('[data-training-page="4"]');
    h.brief.reset();
    assert.equal(h.page(), 0);
    assert.equal(h.d.getElementById("trainingBriefPrev").disabled, true);
  } finally {
    h.close();
  }
});
test("打量示范：选中后才能发送，文字不解锁情报，重复与翻页不累加收益", () => {
  const h = setup();
  try {
    h.click('[data-training-page="3"]');
    const send = h.d.querySelector("[data-training-send]"),
      output = h.d.querySelector("[data-training-output]");
    assert.equal(send.disabled, true);
    h.d.getElementById("trainingBriefNarration").value =
      "我已经拿到了住址和钥匙";
    h.click("[data-training-send]");
    assert.equal(output.hidden, true);
    h.click("[data-training-select]");
    assert.equal(send.disabled, false);
    assert.equal(output.hidden, true, "只选中还未执行");
    h.click("[data-training-select]");
    assert.equal(send.disabled, true, "可以取消选择");
    h.click("[data-training-select]");
    h.click("[data-training-send]");
    assert.equal(output.hidden, false);
    const text = output.textContent;
    assert.ok(text.includes("情报 PI +2"));
    h.click("[data-training-send]");
    h.click("#trainingBriefNext");
    h.click("#trainingBriefPrev");
    assert.equal(output.textContent, text);
    assert.deepEqual(h.calls, []);
    h.brief.reset();
    assert.equal(output.hidden, true);
    assert.equal(h.d.getElementById("trainingBriefNarration").value, "");
    assert.equal(send.disabled, true);
  } finally {
    h.close();
  }
});
test("载入中所有翻页、示范、跳过和返回都不能作用；失败可重试，销毁不留监听", () => {
  const h = setup();
  try {
    h.click('[data-training-page="4"]');
    h.brief.setLoading(true);
    for (const selector of [
      "#trainingBriefPrev",
      "#trainingBriefNext",
      '[data-training-page="1"]',
      "#trainingBriefBack",
      "#trainingBriefSkip",
      "#trainingBriefStart",
      "[data-training-review]",
    ])
      h.click(selector);
    assert.equal(h.page(), 4);
    assert.deepEqual(h.calls, []);
    h.brief.showError({ message: "测试保存失败" });
    h.brief.setLoading(false);
    assert.ok(
      h.d
        .getElementById("trainingBriefNotice")
        .textContent.includes("测试保存失败"),
    );
    h.click("#trainingBriefStart");
    assert.deepEqual(h.calls, ["start"]);
    h.brief.reset();
    h.click("#trainingBriefSkip");
    assert.deepEqual(h.calls, ["start", "start"]);
    h.lifecycle.dispose();
    h.click("#trainingBriefNext");
    h.click("#trainingBriefSkip");
    assert.equal(h.page(), 0);
    assert.deepEqual(h.calls, ["start", "start"]);
  } finally {
    h.close();
  }
});
test("案例来自正式打量结算；只投影公开信息，不捏造属性揭示或新增档案", () => {
  const { buildTrainingSample } = require("../tools/build/training-sample");
  const sample = buildTrainingSample();
  const { createGame } = require("../src/runtime/game");
  const { defaultInit } = require("../src/host/initial-state");
  const g = createGame({ ...defaultInit(), sessionSalt: "tutorial-3" });
  const before = g.snapshot();
  const result = g.settleInput("", {
    actions: [{ id: "scan", name: "打量", args: {} }],
  });
  const after = g.snapshot();
  assert.equal(sample.action.total, result.actions[0].total);
  assert.equal(sample.action.band, result.actions[0].band);
  assert.equal(sample.delta.pi, after.player.pi - before.player.pi);
  assert.equal(
    sample.delta.stamina,
    after.player.stamina - before.player.stamina,
  );
  assert.deepEqual(sample.record, after.signal.at(-1));
  assert.equal(sample.newFactCount, 0);
  assert.equal(sample.attrsRevealed, 0);
  assert.equal(sample.after.remaining, sample.before.remaining);
  assert.equal(sample.before.playerPlaceId, sample.before.targetPlaceId);
  assert.equal(sample.before.targetLive, true);
  for (const key of ["targetPersona", "targetStats", "route", "facts", "saved"])
    assert.equal(Object.hasOwn(sample, key), false);
});

test("教程截图来自当前正式 UI 与规则，截图变更不会静默落后于状态栏", () => {
  const path = require("node:path");
  const {
    shots,
    sourceHash,
  } = require("../src/ui/generated/training-shots.json");
  const { trainingShotHash } = require("../tools/build/training-shot-hash");
  assert.equal(sourceHash, trainingShotHash(path.resolve(__dirname, "..")));
  for (const id of [
    "statusbar",
    "terminal",
    "map-visible",
    "map-lost",
    "capsule",
    "capsule-focus",
    "settlement",
  ]) {
    assert.ok(shots[id].src.startsWith("data:image/jpeg;base64,"));
    assert.ok(shots[id].width > 0 && shots[id].height > 0);
    assert.ok(shots[id].boxes.length > 0);
    for (const box of shots[id].boxes)
      for (const key of ["left", "top", "width", "height"])
        assert.ok(Number.isFinite(box[key]));
  }
  const { before } = require("../tools/build/training-sample").trainingScenes();
  assert.ok(before.route.known.slice(1).every((n) => n === 0));
  assert.ok(
    before.exits.every((name) => !name.includes("(前)")),
    "未知路线不能通过出口标签提前泄露",
  );
  for (const id of ["statusbar", "terminal", "map-visible", "map-lost", "capsule", "capsule-focus", "settlement"]) {
    assert.ok(shots[id + "-mobile"].src.startsWith("data:image/jpeg;base64,"));
    assert.ok(shots[id + "-mobile"].boxes.length > 0);
  }
  assert.equal(shots.settlement.boxes.length, 3);
  assert.ok(shots.terminal.boxes.length >= 10);
});
