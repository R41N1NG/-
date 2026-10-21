/**
 * 刺激接线单测（v0.8 暂定表）：持续暴露按段一泵、事件类照单泵、熟区减半、社交边界、准备期不泵。
 * 纪律：期望值全部从 rules.json + checks 公式推导（改配置数字不破测试）——测试只验「引擎忠实执行配置」。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const C = require("../src/runtime/checks.js");
const R = require("../src/config/rules.json");

const P = R.heart.stim.pump;
const TARGET = { str: 3, agi: 4, per: 5, nrv: 4, social: 2 };
const NRV = 5;

function makeGame(salt, over = {}) {
  return createGame({
    sessionSalt: salt.toString(16).padStart(32, "0"),
    player: { str: 4, agi: 9, nrv: NRV, int: 5, cha: 5, staminaMax: 125, ...(over.player || {}) },
    target: { ...TARGET },
    stats: { date: 1, heart: 30, stamina: 100, cash: 3000, ...(over.stats || {}) },
    ...(() => { const { player, stats, ...rest } = over; return rest; })(),
  });
}

/** 暴力搜盐：找一个首动作落在指定结果带的局（种子骰确定性，搜到即固定可重放）。低敏捷局才掷得出 fail 档。 */
function findBand(band, dist = "same", agi = 9) {
  for (let s = 0; s < 600; s++) {
    const g = makeGame(s, { player: { agi } });
    const r = g.processFloor(`<动作>跟缀｜${dist}</动作>`, { floor: 1 });
    const a = r.actions[0];
    if (a && !a.rejected && a.band === band) return { g, r, band: a.band };
  }
  return null;
}

/** 段末账的完整期望：动作带心跳（勉强+5）+ 刺激泵 − 段末回落（至基线 30 为止）。 */
function expectHeart(band, stim) {
  let h = 30;
  if (band === "grace") h += 5;
  if (stim > 0) h += C.heartDelta({ stim, nrv: NRV });
  return Math.max(R.heart.baseline, h - R.heart.segDrop);
}

test("配置锚：泵表在位（tail 四档/lost/exposed/social/env/熟区系数/社交门槛）", () => {
  for (const k of ["far", "same", "close", "touch"]) assert.ok(Number.isFinite(P.tail[k]), "tail." + k);
  for (const k of ["lost", "exposed", "social", "familiarEnvFactor", "calmSocialProximity"]) assert.ok(P[k] !== undefined, k);
  assert.ok(P.env.cat > 0 && P.env.dog > 0);
});

test("跟缀成功：按距离档一泵（期望从 rules 推导）", () => {
  for (const dist of ["far", "same", "close", "touch"]) {
    const hit = findBand("success", dist);
    assert.ok(hit, "找不到 success 样本 " + dist);
    assert.equal(hit.g.ledger.get("heart"), expectHeart("success", P.tail[dist]));
  }
});

test("密集楼一泵：三连跟缀只泵一次（不是三倍）", () => {
  const hit = findBand("success", "same");
  const { g } = hit;
  const h0 = g.ledger.get("heart");               // 段1 末值——必须在段2结算前读
  const r2 = g.processFloor(`<动作>跟缀｜同街</动作><动作>跟缀｜同街</动作><动作>跟缀｜同街</动作>`, { floor: 2 });
  const first = r2.actions.find(a => TAIL(a.id));
  assert.ok(first, "队列应含跟缀");
  // 期望＝首动作带的单次泵（后续跟缀不再泵；若后续动作落勉强带，+5 属结果带原判）
  let stim = first.band === "nat1" ? P.exposed : first.band === "fail" ? P.lost
    : (first.band === "grace" || first.band === "nat20") ? 0 : P.tail.same;
  let h = h0;
  for (const a of r2.actions) if (a.band === "grace") h += 5;
  h += stim > 0 ? C.heartDelta({ stim, nrv: NRV }) : 0;
  h = Math.max(R.heart.baseline, h - R.heart.segDrop);
  assert.equal(g.ledger.get("heart"), h);
  assert.ok(h < h0 + 3 * C.heartDelta({ stim: P.tail.same, nrv: NRV }), "三连泵会被此断言抓住");
});
function TAIL(id) { return ["follow", "ride_along", "transfer", "follow_work", "ride_follow", "car_follow"].includes(id); }

test("天然1 爆露：指向类照单泵、熟区不减；跟丢走低档；天然20 白给不泵", () => {
  const n1 = findBand("nat1", "touch", 2);
  assert.ok(n1);
  assert.equal(n1.g.ledger.get("heart"), expectHeart("nat1", P.exposed));
  const fl = findBand("fail", "same", 2);
  assert.ok(fl);
  assert.equal(fl.g.ledger.get("heart"), expectHeart("fail", P.lost));
  const w = findBand("nat20", "same", 2);
  assert.ok(w);
  assert.equal(w.g.ledger.get("heart"), expectHeart("nat20", 0));
});

test("环境突发挂账＋熟区减半（环境类减半；演出与账同源）", () => {
  const mk = (fam) => makeGame(7, {
    route: { nodes: ["unit_stairs_b"], known: [1], here: 0 },
    world: { weather: "clear", district: "B" },
    famSegs: { A: 0, B: fam, C: 0, D: 0 },
  });
  const probe = mk(0);
  let fired = null;
  for (let f = 1; f <= 60 && !fired; f++) {
    probe.processFloor(`第${f}段，巷子里很安静。`, { floor: f });
    if (probe._g._envSfx) fired = { f, kind: probe._g._envSfx, heart: probe.ledger.get("heart") };
  }
  assert.ok(fired, "60 段内应触发至少一次环境突发");
  // 期望（无熟区）：环境泵 − 段末回落
  assert.equal(fired.heart, Math.max(R.heart.baseline, 30 + C.heartDelta({ stim: P.env[fired.kind], nrv: NRV }) - R.heart.segDrop));
  // 同盐同楼层：熟区满级（10 段）环境类减半
  const fam = mk(R.heart.areaFamiliarSegments);
  for (let f = 1; f < fired.f; f++) fam.processFloor(`第${f}段。`, { floor: f });
  const before = fam.ledger.get("heart");
  fam.processFloor(`第${fired.f}段。`, { floor: fired.f });
  const half = Math.round(P.env[fired.kind] * P.familiarEnvFactor);
  assert.equal(fam.ledger.get("heart"), Math.max(R.heart.baseline, before + C.heartDelta({ stim: half, nrv: NRV }) - R.heart.segDrop));
});

test("接触社交泵与熟络边界：伪装寒暄低风险一泵；接近度过门槛不进账", () => {
  const g = makeGame(3);
  const r = g.processFloor(`<模式>接触</模式><动作>搭话</动作>`, { floor: 1 });
  const a = r.actions[0];
  assert.ok(!a.rejected);
  let h = 30 + (a.band === "grace" ? 5 : 0) + C.heartDelta({ stim: P.social, nrv: NRV });
  h = Math.max(R.heart.baseline, h - R.heart.segDrop);
  assert.equal(g.ledger.get("heart"), h);
  // 熟络常规社交（接近度 ≥ 门槛）：不泵，只留结果带与回落
  const g2 = makeGame(3, { stats: { date: 1, heart: 30, stamina: 100, cash: 3000, proximity: P.calmSocialProximity } });
  const r2 = g2.processFloor(`<模式>接触</模式><动作>搭话</动作>`, { floor: 1 });
  const a2 = r2.actions[0];
  let h2 = 30 + (a2.band === "grace" ? 5 : 0);
  h2 = Math.max(R.heart.baseline, h2 - R.heart.segDrop);
  assert.equal(g2.ledger.get("heart"), h2);
});

test("准备期不泵不落段账（激活规则：紧张来自非法感）", () => {
  const g = makeGame(5, { mode: "prepare" });
  g.processFloor(`白天在据点整理装备，出门打工。`, { floor: 1 });
  assert.equal(g.ledger.get("heart"), 30);
  assert.equal(g._g._envSfx, null);
});
