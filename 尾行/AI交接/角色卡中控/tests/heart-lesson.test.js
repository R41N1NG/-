"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const { heartLessonScenes } = require("../tools/build/heart-lesson-sample");
const { createGame } = require("../src/runtime/game"),
  { defaultInit } = require("../src/host/initial-state");
const { JSDOM, VirtualConsole } = require("jsdom");
test("心跳教程数字来自真实修正与BPM换算，缓冲区不会冒充精细惩罚", () => {
  const { facts, scenes } = heartLessonScenes();
  assert.ok(Object.values(scenes).every(s=>s.envSfx===null));
  assert.deepEqual(
    [
      facts.calm.mod,
      facts.sweet.mod,
      facts.buffer.mod,
      facts.deform.mod,
      facts.crash.mod,
    ],
    [0, 1, 0, -2, -4],
  );
  assert.equal(facts.sweet.heart, 50);
  assert.equal(facts.sweet.bpm, 63);
  assert.equal(facts.buffer.sweet, false);
  assert.deepEqual(facts.breath, {
    before: 75,
    after: 60,
    direct: -10,
    other: -5,
    stamina: -4,
    turns: 1,
    ap: 0,
  });
  assert.equal(facts.advanced.high, 70);
  assert.equal(
    facts.advanced.mods.reduce((n, m) => n + m.v, 0),
    -1,
  );
});
test("70及90为包含边界的精细操作线，敏捷属性不随其降低", () => {
  for (const [heart, penalty] of [
    [69, 0],
    [70, -2],
    [89, -2],
    [90, -4],
  ]) {
    const init = defaultInit(),
      g = createGame({
        ...init,
        stats: { ...init.stats, heart },
        sessionSalt: "heart-lesson-0",
      }),
      agi = g._g.player.agi;
    const a = g.settleInput("", { actions: [{ id: "photo" }] }).actions[0];
    assert.equal(
      a.mods
        .filter((m) => ["操作变形", "操作崩溃"].includes(m.src))
        .reduce((n, m) => n + m.v, 0),
      penalty,
    );
    assert.equal(g._g.player.agi, agi);
  }
});
test("实际仪表盘随胆量优势拓宽绿弧、提示与无障碍范围", async () => {
  const { buildUI } = require("../tools/build/ui"),
    ui = buildUI({ preview: false, writePreview: false });
  const dom = new JSDOM(
    ui.template.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""),
    {
      url: "https://heart.test/",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole(),
    },
  );
  try {
    vm.runInContext(ui.script, dom.getInternalVMContext());
    dom.window.WxStatusbarUI.mountStatusbar(dom.window.document, dom.window);
    await new Promise((r) => setImmediate(r));
    const init = defaultInit(),
      normal = createGame(init),
      advanced = createGame({ ...init, player: { ...init.player, nrv: 10 } }),
      doc = dom.window.document;
    dom.window.WxStatusbar.render(normal.snapshot());
    const arc = doc.querySelector(".dial-sweet").getAttribute("d");
    assert.match(doc.getElementById("instrument").dataset.tip, /精细检定−2/);
    assert.ok(
      !doc.getElementById("instrument").dataset.tip.includes("敏捷 −2"),
    );
    dom.window.WxStatusbar.render(advanced.snapshot());
    assert.notEqual(doc.querySelector(".dial-sweet").getAttribute("d"), arc);
    assert.match(
      doc.getElementById("dial").getAttribute("aria-label"),
      /甜区40至70/,
    );
    dom.window.WxStatusbar.render(normal.snapshot());
    assert.equal(doc.querySelector(".dial-sweet").getAttribute("d"), arc);
  } finally {
    dom.window.WxStatusbar?.dispose();
    dom.window.close();
  }
});
test("心跳课切换及缓息样例只读，全跳过沿原偏好生效", () => {
  const {
      mountHeartLesson,
      STATES,
    } = require("../src/ui/zero-floor/heart-lesson"),
    { createLifecycle } = require("../src/ui/lifecycle");
  const html = fs.readFileSync(
      path.resolve(__dirname, "../src/ui/zero-floor/heart-lesson.html"),
      "utf8",
    ),
    dom = new JSDOM(html, { url: "https://lesson.test" }),
    { window } = dom,
    document = window.document,
    lifecycle = createLifecycle(window),
    { facts } = heartLessonScenes(),
    shots = {};
  for (const id of ["entry", "breath", ...STATES.map((s) => s.id)])
    shots[id] = {
      src: "data:image/png;base64,",
      width: 100,
      height: 100,
      boxes: [],
    };
  try {
    const ui = mountHeartLesson({ document, window, lifecycle, shots, facts });
    for (const s of STATES) {
      ui.show(s.id);
      assert.equal(
        document
          .getElementById("heartStateReadings")
          .textContent.includes(String(facts[s.id].bpm)),
        true,
      );
    }
    assert.equal(window.localStorage.length, 0);
    document.getElementById("heartLessonSkipAll").click();
    assert.equal(
      JSON.parse(window.localStorage.getItem("wx_tutorial_preferences_v1"))
        .skipAll,
      true,
    );
    assert.equal(document.getElementById("heartLesson").hidden, true);
    document.getElementById("heartEntryPicture").replaceChildren();
    mountHeartLesson({ document, window, lifecycle, shots, facts });
    assert.equal(
      document.getElementById("heartEntryPicture").childElementCount,
      0,
    );
  } finally {
    lifecycle.dispose();
    window.close();
  }
});
