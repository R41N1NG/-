/* 鞋具数值：敏捷修正 + 步声基准 + 距离折算（真源：数值策划「鞋具与脚步声对齐契约」） */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const R = require("../src/config/rules.json");

const SALT = "deadbeefdeadbeefdeadbeefdeadbeef";
const mk = (targetId) => createGame({
  sessionSalt: SALT,
  targetId,
  player: { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 125 },
  target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
  stats: { date: 1, heart: 30, stamina: 100, cash: 3000 }
});

/** 直接换掉她脚上的鞋标签（引擎以标签栈为真源，不改 outfit 反推） */
function wear(g, shoeId) {
  const T = require("../src/runtime/tags.js");
  const R = require("../src/config/rules.json");
  (g._g.tags || []).filter(t => t.owner === "target" && t.id && t.id.startsWith("shoe_"))
    .forEach(t => T.remove(g._g.tags, t.id));
  const def = R.tags[shoeId];
  T.apply(g._g.tags, { id: def.id, name: def.name, owner: "target", type: "equipment", category: "equipment", effects: [], duration: { type: "flag" } });
  return g;
}

/** 主人定稿的鞋具数值表（文档=测试预期源） */
const TABLE = {
  shoe_heel:     { agi: -1, noise: 3 },
  shoe_platform: { agi: -1, noise: 2 },
  shoe_slippers: { agi: -1, noise: 2 },
  shoe_sandals:  { agi: 0,  noise: 2 },
  shoe_boots:    { agi: 0,  noise: 3 },
  shoe_leather:  { agi: 0,  noise: 2 },
  shoe_flats:    { agi: 0,  noise: 1 },
  shoe_sneakers: { agi: 1,  noise: 1 },
  shoe_barefoot: { agi: 0,  noise: 1 }
};

test("鞋具数据表：9 款鞋都注册了敏捷修正与步声基准，且与数值策划一致", () => {
  for (const [id, v] of Object.entries(TABLE)) {
    const t = R.tags[id];
    assert.ok(t, `rules.tags 缺 ${id}`);
    assert.equal(t.mod && t.mod.agi, v.agi, `${id} 的敏捷修正不对`);
    assert.equal(t.noise, v.noise, `${id} 的步声基准不对`);
    assert.equal(t.category, "equipment", `${id} 应归 equipment 类`);
  }
});

test("鞋具敏捷修正进入她的有效属性：高跟鞋 -1 / 运动鞋 +1，差 2 点，且多次快照不累积", () => {
  const heel = wear(mk("college"), "shoe_heel");
  const heelAgi = heel.snapshot().target.stats.agi;

  const sneakers = wear(mk("college"), "shoe_sneakers");
  const sneakersAgi = sneakers.snapshot().target.stats.agi;

  assert.equal(sneakersAgi - heelAgi, 2, "运动鞋(+1) 应比高跟鞋(-1) 高 2 点敏捷");

  // 重复快照不得累积（每次都从基底现算）
  const a1 = heel.snapshot().target.stats.agi;
  const a2 = heel.snapshot().target.stats.agi;
  const a3 = heel.snapshot().target.stats.agi;
  assert.equal(a1, a2, "第二次快照敏捷不应漂移");
  assert.equal(a2, a3, "第三次快照敏捷不应漂移");
  assert.ok(a1 >= 1 && a1 <= 10, "敏捷必须钳在 1~10");
});

test("步声声级按距离折算：高跟鞋 远端2 / 同街3 / 身后4 / 贴身5", () => {
  const g = wear(mk("college"), "shoe_heel");
  const expect = { far: 2, same: 3, close: 4, touch: 5 };
  for (const [dist, lv] of Object.entries(expect)) {
    g._g.dist = dist;
    const info = g.snapshot().target.shoeInfo;
    assert.equal(info.noise, 3, "高跟鞋基准级应为 3");
    assert.equal(info.level, lv, `${dist} 档声级应为 ${lv}`);
  }
});

test("静音鞋与运动鞋的声级：赤脚/运动鞋 同街为 1 级，贴身最多 2 级", () => {
  const g = wear(mk("college"), "shoe_barefoot");
  g._g.dist = "same";
  assert.equal(g.snapshot().target.shoeInfo.level, 1, "赤脚同街应为 1 级（不是静音）");
  g._g.dist = "touch";
  assert.equal(g.snapshot().target.shoeInfo.level, 2, "赤脚贴身为 2 级");

  wear(g, "shoe_sneakers");
  g._g.dist = "same";
  assert.equal(g.snapshot().target.shoeInfo.level, 1);
});

test("shoeInfo 暴露鞋型/敏捷/基准/系数/声级，供状态栏悬停使用", () => {
  const g = wear(mk("college"), "shoe_platform");
  g._g.dist = "close";
  const info = g.snapshot().target.shoeInfo;
  assert.equal(info.id, "shoe_platform");
  assert.equal(info.name, "松糕鞋");
  assert.equal(info.agi, -1);
  assert.equal(info.noise, 2);
  assert.equal(info.distFactor, 1.25);
  assert.equal(info.level, 3);   // round(2 * 1.25) = 3
});
