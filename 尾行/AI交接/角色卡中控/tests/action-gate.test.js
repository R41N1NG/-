/**
 * 胶囊条件门槛（主人 2026-10-19 定，第二轮"举一反三"）：
 * 非贴身不下手；没开锁工具不开锁；不在门前不给破门类动作；
 * 同街（15-20 米）够不着门与她的东西——破门 / 翻找 / 翻墙一律灰条。
 * 两层：UI 灰显或隐藏（capsuleGate）＋ 引擎拒绝（lexicon.requires），打字申报绕不过去。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createGame } = require("../src/runtime/game.js");

const html = require("./helpers/ui-source.js").readUISource();

function gameAt(placeId, extra = {}) {
  return createGame({
    sessionSalt: "gate-test-salt",
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 3000 },
    route: {
      id: "gate_route", note: "", prompt: "", startTime: "21:30",
      nodes: [placeId], known: [1], here: 0,
    },
    ...extra,
  });
}

const act = (r) => r.package.actions[0] || {};
const fire = (g, id, name, args = {}) => act(g.settleInput(name, { actions: [{ id, name, args }] }));

test("引擎：没带开锁工具，开锁被拒不掷骰", () => {
  const g = gameAt("unit_stairs_b", { dist: "touch" });
  const a = fire(g, "lockpick", "开锁");
  assert.equal(a.rejected, true);
  assert.ok(String(a.reason).includes("随身工具"), "应明确告知缺工具");
  assert.ok(String(a.reason).includes("开锁工具"), "应点名缺的是开锁工具");
});

test("引擎：带工具且站在门前，开锁正常进检定", () => {
  const g = gameAt("unit_stairs_b", { dist: "touch" });
  g.addItem("lockpick", 1);
  const a = fire(g, "lockpick", "开锁");
  assert.ok(!a.rejected, "有工具应放行");
  assert.ok(a.d20 >= 1 && a.d20 <= 20);
});

test("引擎：门前但人还在同街，破门类照样被拒（够不着）", () => {
  const g = gameAt("unit_stairs_b", { dist: "same" });
  g.addItem("lockpick", 1);
  for (const [id, name] of [["try_handle", "试门把"], ["lockpick", "开锁"], ["pry", "撬门"], ["check_door", "查门禁"]]) {
    const a = fire(g, id, name);
    assert.equal(a.rejected, true, `${name} 同街应被拒`);
    assert.ok(String(a.reason).includes("距离"), `${name} 拒绝原因应说距离`);
  }
});

test("引擎：不在门前，撬门被拒（即使有工具、人已在近旁）", () => {
  const g = gameAt("store_24h_b", { dist: "touch" });
  g.addItem("lockpick", 1);
  const a = fire(g, "pry", "撬门");
  assert.equal(a.rejected, true);
  assert.ok(String(a.reason).includes("门前"));
});

test("引擎：非近身不出现偷袭——远端/同街被拒，贴身放行", () => {
  const far = gameAt("alley_b", { dist: "far" });
  const rFar = far.settleInput("偷袭", { actions: [{ id: "strike", name: "偷袭", args: { style: "ambush" } }] });
  assert.equal(act(rFar).rejected, true);
  assert.ok(String(act(rFar).reason).includes("距离"));

  const touch = gameAt("alley_b", { dist: "touch" });
  const rTouch = touch.settleInput("偷袭", { actions: [{ id: "strike", name: "偷袭", args: { style: "ambush" } }] });
  assert.ok(!act(rTouch).rejected, "贴身应放行");
});

test("引擎：同街连翻找都做不成（手上的活也要人到）", () => {
  const g = gameAt("store_24h_b", { dist: "same" });
  const a = fire(g, "ransack", "翻找");
  assert.equal(a.rejected, true);
  assert.ok(String(a.reason).includes("距离"));
});

test("引擎：距离边界——已贴身不能再「贴近」，已最远不能再「拉远」", () => {
  const touch = gameAt("alley_b", { dist: "touch" });
  const rApproach = touch.settleInput("贴近", { actions: [{ id: "approach", name: "贴近", args: { dist: "touch" } }] });
  assert.equal(act(rApproach).rejected, true);
  assert.ok(String(act(rApproach).reason).includes("贴身"));

  const far = gameAt("alley_b", { dist: "far" });
  const rWithdraw = far.settleInput("拉开距离", { actions: [{ id: "withdraw", name: "拉开距离", args: { dist: "far" } }] });
  assert.equal(act(rWithdraw).rejected, true);
  assert.ok(String(act(rWithdraw).reason).includes("距离"));
});

test("引擎：贴身时躲藏不成立（无遮无避）", () => {
  const g = gameAt("alley_b", { dist: "touch" });
  const a = fire(g, "hide", "躲藏");
  assert.equal(a.rejected, true);
  assert.ok(String(a.reason).includes("距离"));
});

test("引擎：偷袭比强攻苛刻——身后只能强攻，偷袭必须贴身", () => {
  const close = gameAt("alley_b", { dist: "close" });
  const ambush = close.settleInput("偷袭", { actions: [{ id: "strike", name: "偷袭", args: { style: "ambush" } }] });
  assert.equal(act(ambush).rejected, true);
  assert.ok(String(act(ambush).reason).includes("贴身"));

  const assault = gameAt("alley_b", { dist: "close" });
  const r2 = assault.settleInput("强攻", { actions: [{ id: "strike", name: "强攻", args: { style: "assault" } }] });
  assert.ok(!act(r2).rejected, "身后可以强攻");
});

test("引擎：心跳已在低位时缓息被拒（不占动作位）", () => {
  const g = gameAt("alley_b", { dist: "same", stats: { date: 1, heart: 15, stamina: 100, cash: 800 } });
  const a = g.settleInput("缓息", { actions: [{ id: "breath", name: "缓息", args: {} }] });
  assert.equal(a.package.actions[0].rejected, true);
  assert.ok(String(a.package.actions[0].reason).includes("缓息无效"));
});

test("手打无效：不给胶囊时输入「开锁」不产生任何动作（只当伴随叙事）", () => {
  const g = gameAt("alley_b", { dist: "touch" });
  const plain = g.settleInput("开锁");
  assert.equal(plain.package.actions.length, 0, "手打不得产生动作");
  assert.equal(plain.package.narrativeOnly, true);

  // 引擎后备（GM/工具/单测专用）才会归一成动作，且照样被门槛拒绝
  const viaFallback = g.settleInput("开锁", { allowTextFallback: true });
  const a = act(viaFallback);
  assert.equal(a.id, "lockpick");
  assert.equal(a.rejected, true, "引擎应拒绝：街上没门");
  assert.ok(String(a.reason).includes("门前"));
});

test("UI：距离边界——贴身逼近 / 最远拉开 / 贴身影匿 / 非贴身按制 / 低位缓息都灰", () => {
  const { capsuleGate } = require("../src/ui/action-options.js");

  const touchApproach = capsuleGate({ id: "follow", name: "贴身逼近", args: { dist: "touch" } }, { dist: "touch", place: "alley_b", inventory: [] });
  assert.equal(touchApproach.lock, true);
  assert.ok(touchApproach.reason.includes("已贴身"));

  const farWithdraw = capsuleGate({ id: "withdraw", name: "拉开 (远端)", args: { dist: "far" } }, { dist: "far", place: "alley_b", inventory: [] });
  assert.equal(farWithdraw.lock, true);
  assert.ok(farWithdraw.reason.includes("已是最远"));

  const hideAtTouch = capsuleGate({ id: "hide", name: "借掩体躲藏" }, { dist: "touch", place: "alley_b", inventory: [] });
  assert.equal(hideAtTouch.lock, true);

  const pinAtSame = capsuleGate({ id: "pin", name: "按制" }, { dist: "same", place: "alley_b", inventory: [] });
  assert.equal(pinAtSame.lock, true);

  const breathLow = capsuleGate({ id: "breath", name: "缓息" }, { dist: "same", place: "alley_b", inventory: [], player: { heart: 18 } });
  assert.equal(breathLow.lock, true);

  const breathHigh = capsuleGate({ id: "breath", name: "缓息" }, { dist: "same", place: "alley_b", inventory: [], player: { heart: 60 } });
  assert.equal(breathHigh.lock, false);
});

test("UI：胶囊门槛——偷袭需贴身、开锁需工具、街上隐藏门类、同街灰掉破门与翻找", () => {
  const { capsuleGate } = require("../src/ui/action-options.js");

  const same = capsuleGate({ id: "strike", name: "下手 (偷袭)", args: { style: "ambush" } }, { dist: "same", place: "alley_b", inventory: [] });
  assert.equal(same.lock, true);
  assert.ok(same.reason.includes("贴身"));

  const touch = capsuleGate({ id: "strike", name: "下手 (偷袭)", args: { style: "ambush" } }, { dist: "touch", place: "alley_b", inventory: [] });
  assert.equal(touch.lock, false);

  const noTool = capsuleGate({ id: "lockpick", name: "开锁" }, { dist: "touch", place: "unit_stairs_b", inventory: [] });
  assert.equal(noTool.lock, true);
  assert.ok(noTool.reason.includes("开锁工具"));

  const withTool = capsuleGate({ id: "lockpick", name: "开锁" }, { dist: "touch", place: "unit_stairs_b", inventory: [{ id: "lockpick", count: 1 }] });
  assert.equal(withTool.lock, false);

  const noDoor = capsuleGate({ id: "pry", name: "撬门" }, { dist: "touch", place: "alley_b", inventory: [{ id: "lockpick", count: 1 }] });
  assert.equal(noDoor.hide, true, "街上没有门，整条不出现");

  // 门前但同街：灰条，提示走近
  const farDoor = capsuleGate({ id: "pry", name: "撬门" }, { dist: "same", place: "unit_stairs_b", inventory: [] });
  assert.equal(farDoor.lock, true);
  assert.ok(farDoor.reason.includes("门前"));

  // 同街的翻找 / 翻墙也灰
  const farRansack = capsuleGate({ id: "ransack", name: "翻找" }, { dist: "same", place: "store_24h_b", inventory: [] });
  assert.equal(farRansack.lock, true);
  const farClimb = capsuleGate({ id: "climb", name: "翻墙" }, { dist: "far", place: "alley_b", inventory: [] });
  assert.equal(farClimb.lock, true);
});
