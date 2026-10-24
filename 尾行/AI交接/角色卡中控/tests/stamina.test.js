"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game");
const { defaultInit } = require("../src/host/initial-state");
const { fatigueOf } = require("../src/contracts/stamina");
const R = require("../src/config/rules.json");
const { TAIL_PUMP_IDS } = require("../src/runtime/game/constants");
const { capsuleGate } = require("../src/ui/action-options");
function game(stamina, maximum = 120) {
  return createGame({
    ...defaultInit(),
    sessionSalt: "stamina-check",
    player: { str: 4, agi: 5, int: 5, nrv: 5, cha: 4, staminaMax: maximum },
    stats: { stamina, heart: 30 },
  });
}
test("疲劳按比例即时派生：50%与25%属于气喘，低于25%为疲惫", () => {
  for (const [value, dc] of [
    [61, 0],
    [60, 1],
    [30, 1],
    [29, 3],
    [1, 3],
    [0, 0],
  ])
    assert.equal(fatigueOf(value, 120, R.stamina.fatigue).dc, dc);
  assert.equal(fatigueOf(75, 150, R.stamina.fatigue).dc, 1);
});
test("六种跟随共用疲劳DC，与远端+2叠加，不降低敏捷且打量拍照不受罚", () => {
  for (const id of TAIL_PUMP_IDS) {
    const base = game(120),
      tired = game(29);
    base._g.mode = tired._g.mode =
      id === "follow"
        ? "stealth"
        : require("../src/runtime/lexicon").loadLexicon().byId.get(id).modes[0];
    const a = base.settleInput("", { actions: [{ id, args: { dist: "far" } }] })
      .actions[0];
    const b = tired.settleInput("", {
      actions: [{ id, args: { dist: "far" } }],
    }).actions[0];
    assert.equal(b.fatigueDC, 3, id);
    assert.equal(b.distanceDC, 2, id);
    assert.equal(b.dc, a.dc + 3, id);
    assert.equal(b.attr.v, a.attr.v);
    assert.equal(b.d20, a.d20);
  }
  for (const id of ["scan", "photo"])
    assert.equal(
      game(29).settleInput("", { actions: [{ id }] }).actions[0].fatigueDC,
      0,
    );
});
test("同回合跟随4+打量2+拍照3逐项付费，心跳段税只收一次，回执不重复扣款", () => {
  const g = game(100),
    r = g.settleInput("", {
      actions: [{ id: "follow" }, { id: "scan" }, { id: "photo" }],
    });
  assert.deepEqual(
    r.actions.map((a) => a.ledger.applied.stamina),
    [-4, -2, -3],
  );
  assert.equal(g.ledger.get("stamina"), 100 - 9 + r.seg.staminaTax);
  assert.equal(r.package.account.stamina, -9 + r.seg.staminaTax);
  const stamina = g.ledger.get("stamina");
  g.processReply("继续描写");
  assert.equal(g.ledger.get("stamina"), stamina);
});
test("疲劳以每个动作执行前体力结算，费用可触发下一动作疲劳", () => {
  const g = game(62);
  const r = g.settleInput("", { actions: [{ id: "scan" }, { id: "follow" }] });
  assert.equal(r.actions[1].fatigueDC, 1);
});
test("体力不足整个动作请求先拒绝，不前进楼层、时间、路线或扣款；UI同样锁定", () => {
  for (const stamina of [0, 3, 8]) {
    const g = game(stamina),
      before = g.save();
    assert.throws(
      () =>
        g.settleInput("", {
          actions: [{ id: "follow" }, { id: "scan" }, { id: "photo" }],
        }),
      { code: "STAMINA_INSUFFICIENT" },
    );
    assert.deepEqual(g.save(), before);
  }
  assert.equal(capsuleGate({ id: "follow" }, game(0).snapshot()).lock, true);
  assert.equal(capsuleGate({ id: "photo" }, game(2).snapshot()).lock, true);
});
test("新角色按身份修正后的上限满体力，显式初始体力和旧档不被补满", () => {
  const g = createGame({ ...defaultInit(), identity: "coach" });
  assert.equal(g.ledger.get("stamina"), g._g.player.staminaMax);
  const old = game(20).save();
  const restored = createGame({ saved: old });
  assert.equal(restored.ledger.get("stamina"), 20);
  assert.deepEqual(restored.save(), old);
  const before = restored.save();
  restored.snapshot();
  restored.snapshot();
  assert.deepEqual(restored.save(), before);
  restored.gmSet({ stamina: 60 });
  assert.equal(
    restored.settleInput("", { actions: [{ id: "follow" }] }).actions[0]
      .fatigueDC,
    0,
  );
});

test("耗尽后原便当恢复20，疲劳与动作门槛即时更新且不超上限",()=>{
 const g=game(0);g.addItem('bento',1);assert.equal(g.useItem('bento').ok,true);assert.equal(g.ledger.get('stamina'),20);
 assert.equal(capsuleGate({id:'follow',name:'跟缀'},g.snapshot()).lock,false);
 assert.equal(g.settleInput('',{actions:[{id:'follow'}]}).actions[0].fatigueDC,3);
 const full=game(118);full.addItem('bento',1);full.useItem('bento');assert.equal(full.ledger.get('stamina'),120);
});
