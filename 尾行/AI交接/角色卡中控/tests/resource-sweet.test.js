"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game");
const { defaultInit } = require("../src/host/initial-state");
function check(heart, nrv = 5) {
  const g = createGame({
    ...defaultInit(),
    player: { ...defaultInit().player, nrv },
    stats: { heart },
    sessionSalt: "sweet-check",
  });
  return g.settleInput("", { actions: [{ id: "follow" }] }).actions[0];
}
test("甜区40–65实际+1，判定前心跳与修正一起进入回执", () => {
  for (const heart of [39, 40, 46, 65, 66]) {
    const a = check(heart);
    assert.equal(
      a.mods.some((m) => m.src === "甜区专注" && m.v === 1),
      heart >= 40 && heart <= 65,
    );
    assert.equal(a.heartState.value, heart);
  }
  const calm = check(30),
    sweet = check(46);
  assert.equal(calm.d20, sweet.d20);
  assert.equal(sweet.total, calm.total + 1);
});
test("胆量优势甜区拓宽，离开范围不残留+1标签", () => {
  assert.ok(check(68, 10).mods.some((m) => m.src === "甜区专注"));
  assert.ok(!check(71, 10).mods.some((m) => m.src === "甜区专注"));
  const g = createGame({ ...defaultInit(), stats: { heart: 46 } });
  assert.ok(g.snapshot().tags.some((t) => t.id === "sweet_focus"));
  g.gmSet({ heart: -16 });
  assert.ok(!g.snapshot().tags.some((t) => t.id === "sweet_focus"));
});
test("快照带实际体力上限，休息115是115/115而非115%", () => {
  const g = createGame(defaultInit());
  assert.equal(g.snapshot().player.staminaMax, 115);
  g.gmSet({ stamina: -15 });
  g.gmSet({ stamina: 15 });
  assert.equal(g.snapshot().player.stamina, 115);
  assert.equal(g.snapshot().player.stamina / g.snapshot().player.staminaMax, 1);
  assert.equal(
    createGame({ saved: g.save() }).snapshot().player.staminaMax,
    115,
  );
});

test("甜区衍生标签不写入存档，不因读档增加高心跳旧档标签；实际检定仍同步惩罚", () => {
  const g = createGame({ ...defaultInit(), stats: { heart: 46 } });
  const saved = g.save();
  assert.ok(!saved.tags.some((t) => t.id === "sweet_focus"));
  assert.ok(
    createGame({ saved })
      .snapshot()
      .tags.some((t) => t.id === "sweet_focus"),
  );
  const old = createGame({ ...defaultInit(), stats: { heart: 75 } }).save();
  old.tags = old.tags.filter(
    (t) => !["deform", "crash", "sweet_focus"].includes(t.id),
  );
  const loaded = createGame({ saved: old });
  assert.deepEqual(loaded.save().tags, old.tags);
  const r = loaded.settleInput("", { actions: [{ id: "photo" }] }).actions[0];
  assert.ok(r.mods.some((m) => m.src === "操作变形" && m.v === -2));
});
