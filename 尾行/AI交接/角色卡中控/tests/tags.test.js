/**
 * 标签栈单测：同名刷新不叠、时限流转（scene→自动摘 / flag→整晚保留）、
 * 分类封顶（隐蔽±6/精细±4/冲突±5）、明暗 owner 标记。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../src/runtime/tags.js");

const mk = (id, name, owner, category, value, type = "scene", count = 2) =>
  ({ id, name, owner, category, effects: [{ category, value }], duration: { type, count } });

test("挂载与汇总：两个隐蔽 +2 → +4", () => {
  const s = [];
  T.apply(s, mk("earphone", "耳机伪装", "player", "stealth", 2));
  T.apply(s, mk("night", "夜色", "scene", "stealth", 2));
  const r = T.summarize(s, "stealth");
  assert.equal(r.sum, 4);
  assert.equal(r.capped, false);
  assert.equal(r.breakdown.length, 2);
});

test("同名不叠数值，只刷新时长取最长", () => {
  const s = [];
  T.apply(s, mk("speedup", "提速", "target", "stealth", -2, "scene", 2));
  T.apply(s, mk("speedup", "提速", "target", "stealth", -2, "scene", 3));  // 重挂 3 段
  assert.equal(s.length, 1);
  assert.equal(s[0].duration.count, 3);   // 时长刷新为 3
  assert.equal(T.summarize(s, "stealth").sum, -2);   // 数值不叠
});

test("scene 型 tick 归零自动摘", () => {
  const s = [mk("speedup", "提速", "target", "stealth", -2, "scene", 1)];
  T.tick(s);
  assert.equal(s.length, 0);
});

test("flag 型整晚保留，clearNight 只留旗标", () => {
  const s = [
    mk("earphone", "耳机伪装", "player", "stealth", 2, "scene", 2),
    mk("notice", "身形醒目", "player", "stealth", -1, "flag"),
    mk("rain", "雨幕", "scene", "stealth", 2, "scene", 1),
  ];
  T.tick(s);
  const left = T.clearNight(s);
  assert.deepEqual(left.map(t => t.id), ["notice"]);
});

test("隐蔽封顶 +6：全套道具加雨夜也堆不出怪物", () => {
  const s = [];
  T.apply(s, mk("earphone", "耳机伪装", "player", "stealth", 2, "flag"));
  T.apply(s, mk("dark", "深色着装", "player", "stealth", 1, "flag"));
  T.apply(s, mk("night", "夜色", "scene", "stealth", 2, "flag"));
  T.apply(s, mk("rain", "雨幕", "scene", "stealth", 2, "flag"));
  T.apply(s, mk("flower", "花束", "player", "stealth", 2, "flag"));
  const r = T.summarize(s, "stealth");
  assert.equal(r.sum, 6);       // 裸和 9 → 封顶 6
  assert.equal(r.capped, true);
});

test("负向同样封顶 -6", () => {
  const s = [];
  for (const id of ["a", "b", "c", "d"]) T.apply(s, mk(id, id, "target", "stealth", -2, "flag"));
  const r = T.summarize(s, "stealth");
  assert.equal(r.sum, -6);
  assert.equal(r.capped, true);
});

test("精细封顶 ±4、冲突封顶 ±5（各管各的类）", () => {
  const s = [];
  T.apply(s, mk("shake", "操作变形", "player", "fine", -2, "flag"));
  T.apply(s, mk("shake2", "操作崩溃", "player", "fine", -2, "flag"));
  T.apply(s, mk("zoom", "长焦在手", "player", "fine", 4, "flag"));
  assert.equal(T.summarize(s, "fine").sum, 0);    // +4 与 -4 抵消，未触顶

  T.apply(s, mk("eye", "身形醒目", "player", "conflict", -1, "flag"));
  T.apply(s, mk("first", "偷袭先手", "player", "conflict", 5, "flag"));
  const c = T.summarize(s, "conflict");
  assert.equal(c.sum, 4);   // +5-1=4
});

test("remove 摘除指定标签", () => {
  const s = [mk("rain", "雨幕", "scene", "stealth", 2, "flag")];
  T.remove(s, "rain");
  assert.equal(s.length, 0);
  T.remove(s, "rain");   // 摘不存在的也安全
  assert.equal(s.length, 0);
});

test("owner 明暗：她的标签在栈里，汇总照算（流水呈现层再隐藏名字）", () => {
  const s = [];
  T.apply(s, mk("speedup", "提速", "target", "stealth", -2, "scene", 2));
  T.apply(s, mk("earphone", "耳机伪装", "player", "stealth", 2, "flag"));
  const r = T.summarize(s, "stealth");
  assert.equal(r.sum, 0);
  assert.deepEqual(r.breakdown.map(b => b.owner).sort(), ["player", "target"]);
});

test("不同类别互不串账", () => {
  const s = [];
  T.apply(s, mk("night", "夜色", "scene", "stealth", 2, "flag"));
  const f = T.summarize(s, "fine");
  assert.equal(f.sum, 0);
  assert.equal(f.breakdown.length, 0);
});

/* ── 社交类立户（主人定稿 ±5 封顶，2026-10-16） ── */
test('社交类封顶 ±5：同类加总触顶截断，与隐蔽 ±6 互不串账', () => {
  const s = [];
  T.apply(s, { id: "a", name: "人设入戏", owner: "player", category: "social", effects: [{ category: "social", value: 2 }], duration: { type: "flag" } });
  T.apply(s, { id: "b", name: "好印象", owner: "player", category: "social", effects: [{ category: "social", value: 2 }], duration: { type: "flag" } });
  T.apply(s, { id: "c", name: "她心情好", owner: "scene", category: "social", effects: [{ category: "social", value: 2 }], duration: { type: "flag" } });
  const r = T.summarize(s, "social");
  assert.equal(r.sum, 5);        // 2+2+2=6 触顶截到 5
  assert.equal(r.capped, true);
  assert.equal(T.summarize(s, "stealth").sum, 0);   // 不串账
});
