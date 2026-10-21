/**
 * 相册：取图与抽取规则（未拥有 × 距离角度 × 套装齐奖励）。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const A = require("../src/runtime/album.js");
const { createGame } = require("../src/runtime/game.js");

const persona = { hair: "long", body: "normal" };

test("远端拍不到：不进相册", () => {
  assert.deepEqual(A.anglesFor("far"), []);
  assert.equal(A.captureList(persona, [], "far").length, 0);
});

test("同街只有侧/背；身后与贴身有正/侧/背", () => {
  assert.deepEqual(A.anglesFor("same").sort(), ["back", "side"]);
  const same = A.captureList(persona, [], "same");
  assert.ok(same.every(c => c.angle === "side" || c.angle === "back"));
  const close = A.captureList(persona, [], "close");
  assert.ok(close.some(c => c.angle === "front"));
});

test("已拥有的不再出现", () => {
  const all = A.captureList(persona, [], "touch");
  const first = all[0];
  const left = A.captureList(persona, [first.key], "touch");
  assert.equal(left.length, all.length - 1);
  assert.ok(!left.some(c => c.key === first.key));
});

test("取图路径：长发→long、其他发型→base、下装共用", () => {
  const head = A.WARDROBE.items.find(i => i.slot === "head");
  const top = A.WARDROBE.items.find(i => i.slot === "top");
  const bottom = A.WARDROBE.items.find(i => i.slot === "bottom");
  assert.ok(A.fileOf(head, persona, "side").includes("/hair/long/"));
  assert.ok(A.fileOf(top, persona, "front").includes("/top/long/normal/"));
  assert.ok(A.fileOf(top, { hair: "bob", body: "slim" }, "front").includes("/top/base/slim/"));
  assert.ok(A.fileOf(bottom, persona, "front").includes("/bottom/shared/"));
});

test("套装齐：四件都拍过给 +2，只给一次", () => {
  const set = A.WARDROBE.outfits.outfit_jk_uniform;
  const album = {
    [`${set.top}|front`]: {}, [`${set.bottom}|front`]: {},
    [`${set.socks}|side`]: {}, [`${set.shoes}|side`]: {}
  };
  const done = {};
  const first = A.setBonus(album, done);
  assert.equal(first.pi, 2);
  assert.deepEqual(first.outfits, ["outfit_jk_uniform"]);
  assert.equal(A.setBonus(album, done).pi, 0, "同一套不重复给");
});

test("capturePhoto：每次都是新的，且距离限角度", () => {
  const g = createGame({
    sessionSalt: "album-salt",
    targetPersona: { hair: "long", body: "normal", name: "测试" },
    stats: { heart: 30, stamina: 100, cash: 500, alert: 0, date: 1 },
    dist: "same",
    route: { id: "r", note: "", prompt: "", startTime: "21:30", nodes: ["school_gate_b"], times: ["2130"], known: [1], here: 0 }
  });
  const a = g.capturePhoto("same");
  assert.ok(a, "应拍到一张");
  assert.ok(a.angle === "side" || a.angle === "back");
  const b = g.capturePhoto("same");
  assert.ok(b && b.key !== a.key, "第二张必须不同");
  const total = g.albumTotal();
  assert.ok(total > 20);
  const snap = g.snapshot();
  assert.equal(snap.album.count, 2);
  assert.equal(snap.capture.key, b.key);
});
