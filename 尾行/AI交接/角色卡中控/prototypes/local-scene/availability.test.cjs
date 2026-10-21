"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const { JSDOM } = require("jsdom");
const { availability } = require("./availability.js");
const initial = {
  step: 0,
  busyUntilStep: 1,
  leaveAtStep: 4,
  present: true,
  closed: false,
};
test("状态边界：忙碌、忙完、离开时刻", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((step) => availability({ ...initial, step }).state),
    ["busy", "available", "available", "available", "ended", "ended"],
  );
  assert.equal(availability(initial).canTalk, false);
  assert.equal(availability({ ...initial, step: 1 }).canTalk, true);
});
test("关闭和不在场优先于可交流；不会因节拍前进重新开放", () => {
  for (const step of [0, 1, 4, 8]) {
    assert.equal(
      availability({ ...initial, step, closed: true }).canTalk,
      false,
    );
    assert.equal(
      availability({ ...initial, step, present: false }).state,
      "ended",
    );
  }
});
test("本场一直忙时没有虚假的等待机会；允许开始就可交流", () => {
  assert.equal(availability({ ...initial, busyUntilStep: 4 }).canWait, false);
  assert.equal(
    availability({ ...initial, busyUntilStep: 0 }).state,
    "available",
  );
  assert.equal(availability({ ...initial, leaveAtStep: 0 }).state, "ended");
});
test("校验损坏状态，避免隐式类型转换", () => {
  for (const patch of [
    { step: -1 },
    { step: 1.5 },
    { step: "1" },
    { step: Infinity },
    { busyUntilStep: NaN },
    { leaveAtStep: -1 },
    { present: 0 },
    { closed: "false" },
  ])
    assert.throws(() => availability({ ...initial, ...patch }), TypeError);
  assert.throws(() => availability(null), TypeError);
});
test("纯计算不改输入；重复读取与 JSON 往返得到相同结果", () => {
  const state = Object.freeze({ ...initial, step: 2 });
  const before = JSON.stringify(state),
    result = availability(state);
  assert.deepEqual(availability(state), result);
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(availability(JSON.parse(before)), result);
});
test("网页原型：按钮门槛、只查看不推进、结束和重置", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only" });
  try {
    const context = dom.getInternalVMContext(),
      d = dom.window.document;
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "availability.js"), "utf8"),
      context,
    );
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
      .map((m) => m[1])
      .join("\n");
    vm.runInContext(inline, context);
    assert.equal(d.getElementById("talk").disabled, true);
    d.getElementById("inspect").click();
    assert.match(d.getElementById("steps").textContent, /当前第 0 步/);
    d.getElementById("advance").click();
    assert.equal(d.getElementById("talk").disabled, false);
    d.getElementById("talk").click();
    assert.match(d.getElementById("feedback").textContent, /条件通过/);
    assert.match(d.getElementById("steps").textContent, /当前第 1 步/);
    for (let i = 0; i < 3; i++) d.getElementById("advance").click();
    assert.equal(d.getElementById("talk").disabled, true);
    assert.equal(d.getElementById("advance").disabled, true);
    d.getElementById("reset").click();
    assert.match(d.getElementById("steps").textContent, /当前第 0 步/);
    d.getElementById("advance").click();
    d.getElementById("end").click();
    assert.equal(d.getElementById("talk").disabled, true);
    assert.match(d.getElementById("steps").textContent, /当前第 1 步/);
  } finally {
    dom.window.close();
  }
});
