/**
 * 开局身份制单测（v0.8）：属性修正、常驻标签、免检字段、侦探 PI×1.2 与职业病、
 * 教练接近度 +20、保安周班次、存档往返、配置对齐（防黑户防漂移）。
 * 真源：rules.json → identity；设计：数值策划第一节「开局身份制」。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const facts = require("../src/runtime/facts.js");
const R = require("../src/config/rules.json");
const LEX = require("../src/config/lexicon.json");
const PLACES = require("../src/config/places.json");
const T = require("../src/runtime/tags.js");

const BASE = { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 125 };
const SALT = "cafebabecafebabecafebabecafebabe";

function newGame(identity, extra = {}) {
  return createGame({
    sessionSalt: SALT,
    player: { ...BASE },
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 3000 },
    identity,
    ...extra,
  });
}

/* ---------- 配置真源对齐 ---------- */

test("身份注册：七身份全量在 rules.identity，修正净值 2~4（顶格秤）", () => {
  const ids = Object.keys(R.identity.list);
  assert.equal(ids.length, 7);
  assert.deepEqual(ids.sort(), ["bartender", "coach", "criminal", "detective", "guard", "otaku", "student"].sort());
  for (const id of ids) {
    const sum = Object.values(R.identity.list[id].mods).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 2 && sum <= 4, `${id} 修正净值 ${sum} 越秤（2~4）`);
  }
});

test("防黑户：身份引用的常驻标签在 rules.tags 与 lexicon.tags 双侧注册", () => {
  for (const id of Object.keys(R.identity.list)) {
    for (const tid of R.identity.list[id].tags || []) {
      assert.ok(R.tags[tid], `${id} 引用 ${tid} 未注册 rules.tags`);
      assert.ok(LEX.tags[tid], `${id} 引用 ${tid} 未注册 lexicon.tags`);
    }
  }
});

test("免检对齐：rules.freePass 与 places.free_pass 双向一致", () => {
  for (const [id, def] of Object.entries(R.identity.list)) {
    for (const pid of def.freePass || []) {
      const place = PLACES.places[pid];
      assert.ok(place, `freePass 节点 ${pid} 不在 places.json`);
      assert.ok(place.free_pass?.includes(id), `${pid} 的 free_pass 缺 ${id}`);
    }
  }
  const known = new Set(Object.values(R.identity.list).flatMap(d => d.freePass || []));
  for (const [pid, place] of Object.entries(PLACES.places)) {
    for (const iid of place.free_pass || []) {
      assert.ok(known.has(pid), `${pid} 挂了 free_pass 但不在任何身份的 freePass（漂移）`);
      assert.ok(R.identity.list[iid], `${pid} 的 free_pass 引用未知身份 ${iid}`);
    }
  }
});

test("工资与销赃数据锚：私教课 ×1.2、黑工 ×0.7、回收 0.6/0.75", () => {
  const cc = R.identity.jobs.coach_class;
  assert.equal(cc.attr, "str");
  assert.deepEqual([cc.base, cc.pass, cc.great].map(v => Math.round(v * cc.nativeMult)), [360, 540, 720]);
  const bl = R.identity.jobs.black_labor;
  const mover = { base: 280, pass: 420, great: 560 };   // 搬场零工表锚
  assert.deepEqual([mover.base, mover.pass, mover.great].map(v => Math.round(v * bl.mult)), [196, 294, 392]);
  assert.equal(R.identity.fence.base, 0.6);
  assert.equal(R.identity.fence.criminal, 0.75);
  assert.equal(R.identity.blackMarketDiscount, 0.10);
});

/* ---------- 开局落账 ---------- */

test("属性修正：罪犯 +体1敏1胆2，教练 +体3口1（10 封顶）", () => {
  const cr = newGame("criminal");
  assert.equal(cr._g.player.str, BASE.str + 1);
  assert.equal(cr._g.player.agi, BASE.agi + 1);
  assert.equal(cr._g.player.nrv, BASE.nrv + 2);
  const co = newGame("coach");
  assert.equal(co._g.player.str, BASE.str + 3);
  assert.equal(co._g.player.cha, BASE.cha + 1);
  const hi = createGame({ sessionSalt: SALT, player: { ...BASE, str: 9, cha: 9 }, identity: "coach" });
  assert.equal(hi._g.player.str, 10);   // 修正后仍受 10 上限
  assert.equal(hi._g.player.cha, 10);
});

test("常驻标签：罪犯双标签与教练大块头挂栈，flag 型过夜不清、走封顶汇总", () => {
  const cr = newGame("criminal");
  const st = cr._g.tags.find(t => t.id === "criminal_look");
  const sb = cr._g.tags.find(t => t.id === "criminal_blunt");
  assert.ok(st && st.duration.type === "flag");
  const crPlayerTags = cr._g.tags.filter(t => t.owner === "player");
  assert.equal(T.summarize(crPlayerTags, "stealth").sum, -2);
  assert.equal(T.summarize(crPlayerTags, "social").sum, -2);
  const co = newGame("coach");
  assert.ok(co._g.tags.find(t => t.id === "coach_bulk"));
  assert.equal(T.summarize(co._g.tags.filter(t => t.owner === "player"), "stealth").sum, -2);
  // 过夜清场保留 flag
  cr.nightFall();
  assert.ok(cr._g.tags.find(t => t.id === "criminal_look"));
});

test("常驻标签进检定：罪犯跟缀吃挂相 -2，接触搭话吃无业面 -2", () => {
  const cr = newGame("criminal");
  const r1 = cr.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.ok(r1.actions[0].mods.some(m => m.src === "挂相" && m.v === -2));
  const r2 = cr.processFloor(`<模式>接触</模式><动作>搭话</动作>`, { floor: 2 });
  assert.ok(r2.actions[0].mods.some(m => m.src === "无业面" && m.v === -2));
});

/* ---------- 教练特权 ---------- */

test("教练接近度 +20：targetGym 或生活包 gym 标记二选一命中，无健身房不加", () => {
  assert.equal(newGame("coach", { targetGym: true }).ledger.get("proximity"), 20);
  assert.equal(newGame("coach", { packId: "ol" }).ledger.get("proximity"), 0);   // OL 无健身房
  assert.equal(newGame("student", { targetGym: true }).ledger.get("proximity"), 0); // 非教练不吃
  // packHasGym 判定锚（数据参数注入）
  const fake = { packs: { x: { factPool: [{ slot: "schedule", tags: ["gym"] }, { slot: "home" }] } } };
  assert.equal(facts.packHasGym("x", fake), true);
  assert.equal(facts.packHasGym("ol"), false);
});

/* ---------- 侦探：PI ×1.2 与职业病 ---------- */

test("侦探 PI ×1.2：当晚毛入账过夜补差 round(×0.2)，无身份不补", () => {
  const det = newGame("detective");
  let pi = 0;
  for (let f = 1; f <= 4; f++) {
    det.processFloor(`<动作>拍照</动作>`, { floor: f });
    pi = det.ledger.get("pi");
  }
  const gross = pi;   // 拍照是唯一 PI 来源，段末不动 PI
  const before = det.ledger.get("pi");
  const r = det.nightFall();
  const expect = Math.round(gross * 0.2);
  assert.equal(r.piBonus, expect);
  assert.equal(det.ledger.get("pi"), before + expect);
  // 同盐同输入、属性对齐（情报同为 6）的无身份局：毛入账一致但不补差
  const plain = createGame({ sessionSalt: SALT, player: { ...BASE, int: BASE.int + 1 },
                             target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
                             stats: { date: 1, heart: 30, stamina: 100, cash: 3000 } });
  for (let f = 1; f <= 4; f++) plain.processFloor(`<动作>拍照</动作>`, { floor: f });
  assert.equal(plain.ledger.get("pi"), gross);
  assert.equal(plain.nightFall().piBonus, 0);
});

test("侦探职业病：跟缀中收摊被拒；跟丢/她到家/GM 清除三者解锁", () => {
  const det = newGame("detective");
  det.setRoute({ nodes: ["store_24h_b", "old_alley_main_b", "unit_stairs_b"], known: [1, 1, 1], here: 0 });
  for (let f = 1; f <= 8 && !det._g.tailing; f++) det.processFloor(`<动作>跟缀｜同街</动作>`, { floor: f });
  assert.ok(det._g.tailing, "跟缀成功应置 tailing");
  const blocked = det.nightFall();
  assert.equal(blocked.blocked, true);   // 她没到家：收摊被拒
  // 解锁一：她到家
  det.herAdvance(); det.herAdvance();   // 推到终点
  assert.ok(!det._g.tailing);
  assert.ok(!det.nightFall().blocked);
  // 解锁二：GM 清除
  det._g.tailing = true;
  det.gmSet({ tailing: false });
  assert.ok(!det.nightFall().blocked);
  // 非侦探不受锁
  const plain = newGame();
  for (let f = 1; f <= 8 && !plain._g.tailing; f++) plain.processFloor(`<动作>跟缀｜同街</动作>`, { floor: f });
  assert.ok(!plain._g.tailing, "非侦探跟缀不置 tailing");
});

/* ---------- 保安班次与快照 ---------- */

test("保安周班次：floor((date-1)/7) mod 2 → 昼/夜，快照暴露", () => {
  const gd = newGame("guard");
  const setDate = (n) => gd.gmSet({ date: n - gd.ledger.get("date") });   // commit 是增量语义
  assert.equal(gd.snapshot().identity.shift, "day");     // 第 1 周（date 1~7）
  setDate(8);
  assert.equal(gd.snapshot().identity.shift, "night");   // 第 2 周（date 8~14）
  setDate(15);
  assert.equal(gd.snapshot().identity.shift, "day");     // 第 3 周轮回
  assert.equal(newGame("criminal").snapshot().identity.shift, null);  // 非保安无班次
  assert.equal(newGame("guard").snapshot().identity.name, "保安");
});

/* ---------- 存档往返 ---------- */

test("存档往返：身份/常驻标签/tailing/毛入账无损还原，修正不二次叠加", () => {
  const a = newGame("criminal");
  a.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  const saved = a.save();
  const b = createGame({ saved });
  assert.equal(b._g.identity, "criminal");
  assert.deepEqual(b._g.player, a._g.player);   // 属性=base+mods，不翻倍
  assert.ok(b._g.tags.find(t => t.id === "criminal_look"));
  assert.equal(b.ledger.get("proximity"), a.ledger.get("proximity"));
  const det = newGame("detective");
  det.processFloor(`<动作>拍照</动作>`, { floor: 1 });
  det._g.tailing = true;
  const d2 = createGame({ saved: det.save() });
  assert.equal(d2._g.tailing, true);
  assert.equal(d2._g.nightPiGross, det._g.nightPiGross);
});

/* ---------- 阿宅开局器材 ---------- */

test("阿宅开局器材：快照暴露 kit（物品系统落位前按等值记录）", () => {
  const o = newGame("otaku");
  assert.deepEqual(o.snapshot().identity.kit, { item: "cam_storage", value: 800 });
  assert.equal(newGame("student").snapshot().identity.kit, null);
});
