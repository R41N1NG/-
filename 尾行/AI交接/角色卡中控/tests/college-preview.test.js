"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createPreview } = require("../tools/build/college-preview-model");
const enter = (p) => {
  p.move("school_gate_b");
  return p.execute(p.request("start", "daily.tailing"));
};
test("移动耗时但不扣行动点，未满3格不推进时段，目视不泄露其余日程", () => {
  const p = createPreview();
  const first = p.snapshot();
  assert.equal(first.cityMap.target, null);
  p.move("university_canteen_b");
  let s = p.snapshot();
  assert.equal(s.cityMap.target.live, true);
  assert.equal(s.player.pi, 0);
  assert.equal(s.dayPlan.remaining, 4);
  assert.equal(s.dayPlan.period, 1);
  assert.equal(s.previewTime.used, 1);
  p.move("school_gate_b");
  s = p.snapshot();
  assert.equal(s.cityMap.target.live, false);
  assert.equal(s.cityMap.target.placeId, "university_canteen_b");
  assert.equal(
    s.dayActions.find((a) => a.id === "daily.tailing").enabled,
    false,
  );
  p.execute(p.request("start", "daily.pass"));
  p.move("university_library_b");
  s = p.snapshot();
  assert.equal(s.cityMap.target.live, true);
  assert.equal(s.dayPlan.period, 2);
  assert.equal(s.route, null);
  assert.ok(!s.profile.facts.some((f) => f.slot === "home"));
});
test("晚间目视与费用门槛，入场一次扣2点；重复请求及恢复不重扣或重建路线", () => {
  const p = createPreview(null, { period: 3 });
  assert.throws(() => p.execute(p.request("start", "daily.tailing")));
  p.move("school_gate_b");
  const req = p.request("start", "daily.tailing");
  p.execute(req);
  assert.equal(p.snapshot().dayPlan.remaining, 2);
  assert.equal(p.active(), true);
  assert.equal(p.snapshot().dayPlan.period, 3);
  const first = p.save();
  assert.equal(p.execute(req).reused, true);
  assert.deepEqual(p.save().route, first.route);
  assert.equal(p.snapshot().dayPlan.remaining, 2);
  const restored = createPreview(p.save());
  assert.equal(restored.active(), true);
  assert.equal(restored.snapshot().dayPlan.remaining, 2);
  assert.deepEqual(restored.save().route, first.route);
  const poor = createPreview(null, { period: 3, spent: 3 });
  poor.move("school_gate_b");
  assert.throws(
    () => poor.execute(poor.request("start", "daily.tailing")),
    /行动点不足/,
  );
  assert.equal(poor.snapshot().dayPlan.remaining, 1);
});
test("内部跟随用正式检定，结束推进一次时段，费用不退，当前事件不刷新", () => {
  const p = createPreview(null, { period: 3 });
  enter(p);
  const r = p.follow();
  assert.ok(r.package.actions[0].d20 >= 1);
  assert.equal(p.snapshot().dayPlan.remaining, 2);
  if (p.active()) p.execute(p.request("cancel"));
  assert.equal(p.snapshot().dayPlan.period, 4);
  assert.equal(p.snapshot().dayPlan.remaining, 2);
  assert.equal(p.save().previewCollege.usedDate, 1);
  assert.throws(() => p.follow());
  assert.equal(createPreview(p.save()).snapshot().dayPlan.period, 4);
});
test("不选择跟随，度过时段不会获取住处或路线，也不会自动进入尾行", () => {
  const p = createPreview(null, { period: 3 });
  p.move("school_gate_b");
  p.execute(p.request("start", "daily.pass"));
  const s = p.snapshot();
  assert.equal(s.dayPlan.period, 4);
  assert.equal(s.dayPlan.remaining, 4);
  assert.equal(p.active(), false);
  assert.equal(s.cityMap.target.live, false);
  assert.equal(s.cityMap.target.placeId, "school_gate_b");
  assert.equal(s.investigation.lastReceipt, null);
  assert.ok(!s.profile.facts.some((f) => f.slot === "home"));
});

test("第三次同区移动跨时段，到达后才判断目标；普通移动不会无限冻结日程", () => {
  const p = createPreview();
  p.move("university_canteen_b");
  p.move("school_gate_b");
  assert.equal(p.snapshot().previewTime.used, 2);
  p.move("university_library_b");
  const s = p.snapshot();
  assert.equal(s.dayPlan.period, 2);
  assert.equal(s.previewTime.used, 0);
  assert.equal(s.dayPlan.remaining, 4);
  assert.equal(s.cityMap.target.live, true);
  assert.equal(s.cityMap.target.placeId, "university_library_b");
});
test("跨区耗2格，跨时段后的余量保留；单次到达按新时段投影", () => {
  const p = createPreview(null, { timeUsed: 2 });
  const q = p.quote("metro_hub_a");
  assert.equal(q.cost, 2);
  assert.equal(q.reason, null);
  const r = p.move("metro_hub_a"),
    s = p.snapshot();
  assert.equal(s.dayPlan.period, 2);
  assert.equal(s.previewTime.used, 1);
  assert.equal(s.dayPlan.remaining, 4);
  assert.equal(r.travel.cost, 2);
  assert.equal(s.cityMap.player.placeId, "metro_hub_a");
  assert.ok(!s.cityMap.target?.live);
});
test("晚间最后1格赶往校门已是子夜，错过入口，不赠送住处", () => {
  const p = createPreview(null, { period: 3, timeUsed: 2 });
  p.move("school_gate_b");
  const s = p.snapshot();
  assert.equal(s.dayPlan.period, 4);
  assert.equal(s.previewTime.remaining, 3);
  assert.equal(s.dayPlan.remaining, 4);
  assert.equal(
    s.dayActions.find((a) => a.id === "daily.tailing").enabled,
    false,
  );
  assert.ok(!s.cityMap.target?.live);
  assert.throws(
    () => p.execute(p.request("start", "daily.tailing")),
    /没有可接入/,
  );
  assert.ok(!s.profile.facts.some((f) => f.slot === "home"));
});
test("已到现场晚间尚余时间可入场，内部跟随不额外扣普通移动时间", () => {
  const p = createPreview(null, { period: 3 });
  enter(p);
  const before = p.snapshot().previewTime.used;
  assert.equal(before, 1);
  p.follow();
  assert.equal(p.snapshot().dayPlan.remaining, 2);
  if (p.active()) {
    assert.equal(p.snapshot().previewTime.used, before);
    p.execute(p.request("cancel"));
  }
  assert.equal(p.snapshot().dayPlan.period, 4);
  assert.equal(p.snapshot().previewTime.used, 0);
});
test("耗时随原移动回执去重并刷新恢复，改写同操作编号被拒绝", () => {
  const p = createPreview(null, { timeUsed: 2 });
  const req = p.request("move", undefined, { placeId: "university_library_b" });
  p.execute(req);
  const restored = createPreview(p.save());
  const before = restored.save();
  const r = restored.execute(req);
  assert.equal(r.reused, true);
  assert.deepEqual(restored.save(), before);
  assert.throws(
    () => restored.execute({ ...req, args: { placeId: "school_gate_b" } }),
    /重复请求内容不一致/,
  );
  assert.equal(restored.snapshot().dayPlan.period, 2);
  assert.equal(restored.snapshot().previewTime.used, 0);
});
test("正规行动结束当前时段并清时间格，拒绝移动不扣时间、不改变位置", () => {
  const p = createPreview(null, { timeUsed: 2 });
  const before = p.save();
  assert.throws(() => p.move("unit_stairs_b"));
  assert.equal(p.snapshot().previewTime.used, 2);
  assert.equal(
    p.snapshot().cityMap.player.placeId,
    before.spatial.playerPlaceId,
  );
  p.execute(p.request("start", "daily.rest"));
  assert.equal(p.snapshot().dayPlan.period, 2);
  assert.equal(p.snapshot().previewTime.used, 0);
  assert.equal(p.snapshot().dayPlan.remaining, 3);
});
test("日终不自动翻日，无法完成的跨区移动拒绝，恰好耗尽则结束当天", () => {
  const p = createPreview(null, { period: 4, timeUsed: 2 });
  assert.throws(() => p.move("metro_hub_a"), /本日剩余时间/);
  assert.equal(p.snapshot().dayPlan.ended, false);
  assert.equal(p.snapshot().previewTime.used, 2);
  const req = p.request("move", undefined, { placeId: "school_gate_b" });
  p.execute(req);
  assert.equal(p.snapshot().dayPlan.ended, true);
  assert.equal(p.snapshot().player.date, 1);
  assert.equal(p.snapshot().previewTime.remaining, 0);
  assert.equal(p.execute(req).reused, true);
  p.execute(p.request("next-day"));
  assert.equal(p.snapshot().player.date, 2);
  assert.equal(p.snapshot().dayPlan.period, 0);
  assert.equal(p.snapshot().previewTime.used, 0);
});
test("旧独立预览缺时间格时补0；损坏的新时间值拒绝而非当作0", () => {
  const p = createPreview(),
    old = p.save();
  delete old.previewCollege.timeUsed;
  assert.equal(createPreview(old).snapshot().previewTime.used, 0);
  old.previewCollege.timeUsed = 3;
  assert.throws(() => createPreview(old), /试玩时间记录无效/);
});

test("跟丢自动退出，已获得的线索和费用保留，结束后时间格清零", () => {
  const p = createPreview(null, { period: 3 });
  enter(p);
  let last;
  for (let i = 0; i < 8 && p.active(); i++) last = p.follow();
  assert.equal(p.active(), false);
  assert.equal(p.snapshot().dayPlan.period, 4);
  assert.equal(p.snapshot().previewTime.used, 0);
  assert.equal(p.snapshot().dayPlan.remaining, 2);
  assert.ok(last.package.investigation);
  assert.equal(last.package.investigation.reason, "尾行中断");
  assert.ok(p.snapshot().player.pi >= 2);
  assert.ok(!p.snapshot().profile.facts.some((f) => f.slot === "home"));
  const restored = createPreview(p.save());
  assert.equal(restored.snapshot().player.pi, p.snapshot().player.pi);
});
