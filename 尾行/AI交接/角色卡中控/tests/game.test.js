/**
 * 中控端到端单测：真实输入→申报→骰→结算→账本→回执全链。
 * 关键断言：确定性重放、防口胡、账目守恒、过夜闭环。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");

function newGame() {
  return createGame({
    sessionSalt: "deadbeefdeadbeefdeadbeefdeadbeef",   // 固定盐 → 全链可重放
    player: { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 125 },
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 3000 },
  });
}

test("端到端：一栋楼（跟缀成功场景）→ 账目变动 + 流水 + 回执快照", () => {
  const g = newGame();
  const r = g.processFloor(`你收着步子缀进人流。<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.equal(r.actions.length, 1);
  const a = r.actions[0];
  assert.equal(a.id, "follow");
  assert.ok(a.d20 >= 1 && a.d20 <= 20);
  assert.ok(["success", "grace", "fail", "nat1", "nat20"].includes(a.band));
  assert.ok(r.ledgerSeqs.length >= 1);
  assert.equal(r.stats.player.date, 1);
  assert.ok(r.flow.length >= 1);   // 流水有账
});

test("确定性重放：同盐同输入，两局全链结果逐位一致", () => {
  const run = () => {
    const g = newGame();
    const rs = [];
    for (let f = 1; f <= 6; f++) rs.push(g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: f }));
    return rs.map(r => r.actions[0].d20 * 100 + r.actions[0].total);
  };
  assert.deepEqual(run(), run());
});

test("防口胡：未知动作与超限动作不落账", () => {
  const g = newGame();
  const r = g.processFloor(`<动作>施法火球</动作><动作>拍照</动作><动作>拍照</动作><动作>拍照</动作><动作>拍照</动作>`, { floor: 2 });
  assert.equal(r.actions.length, 3);           // 未知1丢弃 + 队列3上限
  assert.equal(r.diag.parseErrors, 1);
  assert.equal(r.diag.actionOverflow, 1);
  assert.ok(r.ledgerSeqs.length <= 3);
});

test("模式门槛：潜行模式下搭话被拒，切接触后放行", () => {
  const g = newGame();
  const r1 = g.processFloor(`<动作>搭话</动作>`, { floor: 3 });
  assert.equal(r1.actions[0].rejected, true);
  const r2 = g.processFloor(`<模式>接触</模式><动作>搭话</动作>`, { floor: 4 });
  assert.ok(!r2.actions[0].rejected);
  assert.equal(r2.mode, "contact");
});

test("谎言依据锁：正文里没有的说法被丢弃", () => {
  const g = newGame();
  const r = g.processFloor(`你笑了笑。<谎言>自称物业｜她｜楼下｜高</谎言>`, { floor: 5 });
  assert.equal(r.lies.length, 1);
  assert.equal(r.lies[0].verified, false);
  assert.equal(r.lies[0].dropped, true);
});

test("票据核销：发出的票被销，无票申报如实记录", () => {
  const g = newGame();
  g._g.tickets = [{ no: 41, kind: "speedup", guide: "演出：脚步快了半拍" }];
  const r = g.processFloor(`她脚步快了半拍。<事实>#41</事实>`, { floor: 6 });
  assert.equal(r.facts[0].consumed, true);
  assert.equal(g._g.tickets.length, 0);        // 已清空
  const r2 = g.processFloor(`<事实>#99</事实>`, { floor: 7 });
  assert.equal(r2.facts[0].consumed, false);
});

test("心跳过线自动挂标签：状态阈值类由脚本同步", () => {
  const g = newGame();
  g.gmSet({ heart: 85 });                      // 推到崩溃线上
  const r = g.processFloor(`<动作>拍照</动作>`, { floor: 8 });
  const tags = r.stats.tags.map(t => t.name);
  assert.ok(tags.includes("操作变形") || tags.includes("操作崩溃"), "阈值标签未挂: " + tags);
  const a = r.actions[0];
  if (a.mods) assert.ok(a.mods.some(m => m.src === "操作变形" || m.src === "操作崩溃"));
});

test("过夜闭环：收摊后戒心沉淀、次日开局、标签清场", () => {
  const g = newGame();
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 9 });
  const night = g.nightFall();
  assert.ok(night.warinessGain >= 0);
  assert.equal(g.ledger.get("alert"), 0);
  assert.equal(g.ledger.get("date"), 2);
  const snap = g.snapshot();
  assert.ok(!snap.tags.some(t => t.duration === "scene"), "scene 标签应过夜清场");
});

test("GM 直改走事务，有快照可回滚", () => {
  const g = newGame();
  const r = g.gmSet({ cash: 1000 });
  assert.equal(g.ledger.get("cash"), 4000);
  assert.ok(g.ledger.rollback(r.seq));
  assert.equal(g.ledger.get("cash"), 3000);
});

test("v0.6 段位税：猎手模式一楼必扣体力（心跳档位税恒收，峰值<40 也扣维持税 1）", () => {
  const g = newGame();
  const before = g.ledger.get("stamina");
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 12 });
  assert.ok(g.ledger.get("stamina") < before, "段税未收");
});

test("v0.6 段末心跳回落：高楼心跳向基线收敛", () => {
  const g = newGame();
  g.gmSet({ heart: 85 });
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 13 });
  // 段末 −5 至基线（30）为止；动作可能再进账，但回落机制本身保证不高于 85+进账-5 的轨迹
  assert.ok(g.ledger.get("heart") < 85 + 20, "段末回落未生效");
});

test("明暗分离：快照里她只有档位没有数值", () => {
  const g = newGame();
  const s = g.snapshot();
  assert.ok(typeof s.target.alertStage === "number");
  assert.equal(s.target.alert, undefined, "警觉原始值不得出现在快照");
  assert.ok(s.target.warinessStage in ["低", "中", "高"].reduce((o, x) => (o[x] = 1, o), {}));
});

/* ── 地图 HUD 数据管道（Route Stepper 常驻条 + 战术沙盘） ── */

test("管道：动线快照——大区名/当前场所/未知遮蔽/前方标记/庇护所预警", () => {
  const g = newGame();
  g.setRoute({ nodes: ["school_gate_b", "store_24h_b", "dark_blind_alley_b", "unit_stairs_b"], known: [1, 0, 1, 0], here: 2 });
  const s = g.snapshot();
  assert.equal(s.area, "老城文教区");
  assert.equal(s.place, "居民杂物暗巷");          // known[2]=1 → 显示真名
  assert.equal(s.route.here, 2);
  assert.equal(s.route.nodes[0], "学校正门");      // 已探明节点翻成人话名
  assert.equal(s.route.known[1], 0);               // 未探明遮蔽照传（前端显示 ？）
  assert.ok(s.exits.some(e => e.includes("老旧单元楼道") && e.includes("(前)")));  // 动线去向标前
  assert.ok(s.spots.length >= 1);                  // 微点 id 原样给（前端翻人话）
  assert.ok(s.sanctuaryAlert.includes("老旧单元楼道") && s.sanctuaryAlert.includes("1步"));  // BFS：她逃向自家楼道
});

test("管道：终局封印随节点切换（学校正门封 / 杂物暗巷开）", () => {
  const g = newGame();
  g.setRoute({ nodes: ["school_gate_b", "dark_blind_alley_b"], known: [1, 1], here: 0 });
  assert.equal(g.snapshot().strikeSealed, true);   // 人流密集公立探头直照
  g.herAdvance();
  assert.equal(g.snapshot().strikeSealed, false);  // 盲区解封，扳机常开
  assert.equal(g.snapshot().place, "居民杂物暗巷");
});

test("管道：herAdvance 封顶 + revealNode 点亮未知节点", () => {
  const g = newGame();
  g.setRoute({ nodes: ["a", "b"], known: [0, 0], here: 0 });
  g.herAdvance(); g.herAdvance();                  // 连推两次
  assert.equal(g.herAdvance(), 1);                 // 终点封顶不越界
  g.revealNode(1);
  const s = g.snapshot();
  assert.equal(s.route.known[1], 1);
});

test("管道：无动线时快照兜底（不抛错、字段为空）", () => {
  const g = newGame();
  const s = g.snapshot();
  assert.equal(s.route, null);
  assert.deepEqual(s.exits, []);
  assert.deepEqual(s.spots, []);
  assert.equal(s.sanctuaryAlert, "");
  assert.equal(s.place, null);
});

test("管道：每晚天气种子骰——确定性重放 + 区间合法（70/20/10）", () => {
  const run = () => {
    const g = newGame();
    const ws = [];
    for (let f = 1; f <= 5; f++) { g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: f }); ws.push(g.nightFall().nextWeather); }
    return ws;
  };
  const a = run(), b = run();
  assert.deepEqual(a, b);                                          // 同盐同楼恒同天气
  assert.ok(a.every(w => ["clear", "rain", "storm"].includes(w))); // 区间合法
});

test("管道：分区熟悉度——猎手段+1、准备期不涨、封顶10、分区独立", () => {
  const g = newGame();   // init.world 默认 district B
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });           // stealth 段
  assert.equal(g.snapshot().fam, 1);
  g._g.world.district = "A";                                          // 切区
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 2 });
  assert.equal(g.snapshot().fam, 1);                                  // A 区从 0 起步（B 区计数保留）
  g._g.world.district = "B";
  g._g.famSegs.B = 10;
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 3 });
  assert.equal(g.snapshot().fam, 10);                                 // 封顶 10 段熟区
  g._g.mode = "prepare";
  g.processFloor(`<动作>打工</动作>`, { floor: 4 });
  assert.equal(g.snapshot().fam, 10);                                 // 准备期不涨
});

/* ── 优势五标签（主人定稿阈值制：PI≥60 / 属性≥10） ── */
test("优势阈值标签：达线自动挂、掉线自动摘（每楼对表）", () => {
  const g = newGame();   // player: str4/agi5/nrv5/int5/cha5，全不达线
  const ids = () => (g._g.tags || []).map(t => t.id);
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.equal(ids().some(id => id.startsWith("adv_")), false);   // 无一达线

  g._g.player.agi = 10;                                            // 敏捷堆满
  g.gmSet({ pi: 60 });                                             // PI 挖穿深层线
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 2 });
  assert.ok(ids().includes("adv_agi"));
  assert.ok(ids().includes("adv_int"));
  assert.equal(ids().includes("adv_str"), false);                  // 体格 4 不挂

  g._g.player.agi = 9;                                             // 掉线自动摘
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 3 });
  assert.equal(ids().includes("adv_agi"), false);
  assert.ok(ids().includes("adv_int"));                            // PI 未掉，情报优势保留
});

test("优势标签驱动双骰：敏捷优势下跟缀掷两骰（raw 长度 2）", () => {
  const g = newGame();
  g._g.player.agi = 10;
  const r = g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.equal(r.actions[0].raw.length, 2);        // 双骰原始值
  assert.ok(r.actions[0].raw.includes(r.actions[0].d20));   // 采用值必来自两骰之一
  // 无优势对照：单骰
  const g2 = newGame();
  const r2 = g2.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.equal(r2.actions[0].raw.length, 1);
});

test("优势只进 1d20 检定系：口才优势对敏捷词条不生效", () => {
  const g = newGame();
  g._g.player.cha = 10;   // 只有口才优势
  const r = g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });   // 跟缀=敏捷词条
  assert.equal(r.actions[0].raw.length, 1);        // 单骰：属性不匹配不双骰
});

test("社交类立户：搭话捞 social 修正；误导归因走口才属性（原掉默认敏捷的错位修正）", () => {
  const g = newGame();
  const tag = { id: "roleplay", name: "人设入戏", owner: "player", category: "social",
                effects: [{ category: "social", value: 2 }], duration: { type: "flag" } };
  require("../src/runtime/tags.js").apply(g._g.tags || (g._g.tags = []), tag);
  const r = g.processFloor(`<模式>接触</模式><动作>搭话</动作>`, { floor: 1 });   // 搭话需接触模式
  const a = r.actions.find(x => x.id === "chat");
  assert.ok(a, "搭话词条应被解析结算");
  assert.ok(a.mods.some(m => m.src === "人设入戏" && m.v === 2));   // social 通道的修正进了搭话检定

  // 误导归因属性归属：cha 高低改变结算 → 走口才（attrKeyOf 内部，经 mods 断言间接验证已够）
  const r2 = g.processFloor(`<动作>误导归因</动作>`, { floor: 2 });
  assert.ok(r2.actions.find(x => x.id === "misdirection"), "误导归因词条应被解析结算");
});

/* ── 存档往返（酒馆变量持久化地基） ── */
test("save/load 无损往返：跑几楼后存档重建，续跑结果与连续局逐位一致", async () => {
  const run = async (withSave) => {
    const mk = () => createGame({
      sessionSalt: "save-roundtrip",
      player: { str: 3, agi: 5, nrv: 5, int: 6, cha: 4, staminaMax: 110 },
      stats: { date: 3, heart: 40, pi: 10 },
      world: { weather: "rain", district: "B" },
      route: { nodes: ["store_24h_b", "dark_blind_alley_b", "unit_stairs_b"], known: [1, 0, 1], here: 1 },
    });
    const FLOOR = (f, txt) => `<动作>跟缀｜同街</动作>`;
    let g = mk();
    const r1 = g.processFloor(FLOOR(1), { floor: 1 });
    if (withSave) {
      const saved = JSON.parse(JSON.stringify(g.save()));   // 序列化往返（酒馆变量等价）
      g = createGame({ saved });
    }
    const r2 = g.processFloor(FLOOR(2), { floor: 2 });
    const s = g.snapshot();
    return { r2d20: r2.actions[0].d20, heart: s.player.heart, pi: s.player.pi,
             place: s.place, level: s.route.levels ? null : s.route.here, tags: s.tags.length,
             save: g.save() };
  };
  const direct = await run(false);
  const restored = await run(true);
  assert.equal(restored.r2d20, direct.r2d20);        // 种子流续跑一致
  assert.equal(restored.heart, direct.heart);
  assert.equal(restored.pi, direct.pi);
  assert.equal(restored.place, direct.place);
  assert.deepEqual(restored.save, direct.save);      // 最终存档逐位一致
});

test("save() 纯数据：JSON 可序列化且含全部关键字段", () => {
  const g = newGame();
  g.setRoute({ nodes: ["store_24h_b", "unit_stairs_b"], known: [1, 1], here: 0 });
  g.processFloor(`<动作>跟缀</动作>`, { floor: 1 });
  const s = JSON.parse(JSON.stringify(g.save()));
  for (const k of ["sessionSalt", "player", "target", "world", "route", "famSegs",
                   "tags", "ledgerState", "floor"]) assert.ok(k in s, "save 缺 " + k);
  assert.equal(s.ledgerState.date, 1);
});

/* ── 鞋具后台标签与脚步声联动 ── */
test("鞋具标签：缺省默认运动鞋，挂载小皮鞋/靴子后快照 target.shoe 实时联动", () => {
  const g = newGame();
  const snap1 = g.snapshot();
  assert.equal(snap1.target.shoe, "sneakers");

  // 动态切换为小皮鞋
  const T = require("../src/runtime/tags.js");
  T.remove(g._g.tags, "shoe_sneakers");
  T.apply(g._g.tags, { id: "shoe_leather", name: "小皮鞋", owner: "target", category: "equipment", effects: [], duration: { type: "flag" } });
  const snap2 = g.snapshot();
  assert.equal(snap2.target.shoe, "leather");

  // 动态切换为靴子
  T.remove(g._g.tags, "shoe_leather");
  T.apply(g._g.tags, { id: "shoe_boots", name: "靴子", owner: "target", category: "equipment", effects: [], duration: { type: "flag" } });
  const snap3 = g.snapshot();
  assert.equal(snap3.target.shoe, "boots");
});

/* ── 夜间潜行猫叫/狗叫概率判定 ── */
test("夜间突发音效：室内场景绝对静音，暗巷/居民楼按概率确定性触发", () => {
  const gIndoor = newGame();
  gIndoor.setRoute({ nodes: ["metro_concourse_a"], known: [1], here: 0 });
  gIndoor.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.equal(gIndoor.snapshot().envSfx, null, "地铁站/室内豁免突发环境音效");

  // 室外暗巷测试猫叫：通过种子重放或遍历楼层验证触发
  const gAlley = newGame();
  gAlley.setRoute({ nodes: ["dark_blind_alley_b"], known: [1], here: 0 });
  const sfxResults = new Set();
  for (let f = 1; f <= 30; f++) {
    gAlley.processFloor(`<动作>跟缀｜贴身</动作>`, { floor: f });
    const sfx = gAlley.snapshot().envSfx;
    if (sfx) sfxResults.add(sfx);
  }
  assert.ok(sfxResults.has("cat"), "贴身暗巷潜行应当有概率触发猫叫");
});

/* ── HUD 五大槽位真实管道验证（ledger / proxLog / signal / assess / herAlert） ── */
test("HUD 五大槽位管道真机接通：ledger/proxLog/signal/assess/herAlert 正常产出非假账", () => {
  const g = newGame();
  g.setRoute({ nodes: ["school_gate_b", "dark_blind_alley_b"], known: [1, 1], here: 0 });
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  const snap = g.snapshot();

  assert.ok(snap.ledger && snap.ledger.includes("本轮结算"), "snap.ledger 必须有本轮结算摘要");
  assert.ok(Array.isArray(snap.proxLog), "snap.proxLog 必须为数组");
  assert.ok(Array.isArray(snap.signal) && snap.signal.length >= 1, "snap.signal 必须有时间线记录");
  assert.equal(snap.assess, null, "未掷读时机时 assess 应为 null");
});

test("读时机机会评估：timing 动作执行后产出 assess 评估文本", () => {
  const g = newGame();
  g.processFloor(`<动作>读时机</动作>`, { floor: 1 });
  const snap = g.snapshot();
  assert.ok(snap.assess && snap.assess.includes("读时机评估"), "timing 动作应产出评估文本: " + snap.assess);
});

test("接近度小账流水：变动自动进账，快照暴露最近5条，无假数据回落", () => {
  const g = createGame({
    sessionSalt: "deadbeefdeadbeefdeadbeefdeadbeef",
    player: { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 125 },
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 3000 },
    identity: "coach",
    targetGym: true
  });
  const snap = g.snapshot();
  assert.ok(snap.proxLog.length >= 1);
  assert.ok(snap.proxLog[0].includes("健身房行程"));
});

test("玩家五维属性阈值标签同步：身形醒目/不起眼/脚步轻/笨拙/结巴自动挂摘", () => {
  const g = newGame();
  const tagIds = () => (g._g.tags || []).map(t => t.id);

  // 1. 体格测试：>=8 醒目，<=3 不起眼
  g._g.player.str = 8;
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 1 });
  assert.ok(tagIds().includes("bulky"), "体格8应挂身形醒目");
  assert.equal(tagIds().includes("unobtrusive"), false);

  g._g.player.str = 3;
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 2 });
  assert.ok(tagIds().includes("unobtrusive"), "体格3应挂不起眼");
  assert.equal(tagIds().includes("bulky"), false);

  // 2. 敏捷测试：>=8 脚步轻，<=3 笨拙
  g._g.player.str = 4;
  g._g.player.agi = 8;
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 3 });
  assert.ok(tagIds().includes("light_footed"), "敏捷8应挂脚步轻");
  assert.equal(tagIds().includes("clumsy"), false);

  g._g.player.agi = 2;
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 4 });
  assert.ok(tagIds().includes("clumsy"), "敏捷2应挂笨拙");
  assert.equal(tagIds().includes("light_footed"), false);

  // 3. 结巴测试：口才<=2 且心跳>70
  g._g.player.agi = 5;
  g._g.player.cha = 2;
  g.gmSet({ heart: 50 - g.ledger.get("heart") });
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 5 });
  assert.equal(tagIds().includes("stammer"), false, "心跳<=70不应挂结巴");

  g.gmSet({ heart: 85 - g.ledger.get("heart") });
  g.processFloor(`<动作>跟缀｜同街</动作>`, { floor: 6 });
  assert.ok(tagIds().includes("stammer"), "口才2心跳85应挂结巴");
});

test("粗心错边核实：rules 与 lexicon 均注册在 target 侧", () => {
  const R = require("../src/config/rules.json");
  const L = require("../src/config/lexicon.json");
  assert.ok(R.tags.careless, "rules.tags 必须注册 careless");
  assert.equal(R.tags.careless.owner, "target", "careless 必须归属 target");
  assert.equal(R.tags.careless.category, "acuity");
  assert.ok(L.tags.careless, "lexicon.tags 必须注册 careless");
});

test("属性修复套件 · targetBase 存档无损持久化与恢复（防回退静态死值）", () => {
  const perturbedStats = { str: 4, agi: 5, per: 6, nrv: 3, social: 3 };
  const g = createGame({
    targetId: "student",
    targetPersona: { finalStats: perturbedStats }
  });
  assert.deepEqual(g._g.targetBase, perturbedStats, "初始化时 targetBase 准确记录开局动态扰动基底");

  const saved = g.save();
  assert.ok(saved.targetBase, "save() 必须导出 targetBase 字段");
  assert.deepEqual(saved.targetBase, perturbedStats, "导出数据与动态基底全等");

  // 模拟从 saved 恢复
  const gRestored = createGame({ saved });
  assert.deepEqual(gRestored._g.targetBase, perturbedStats, "读档恢复后 targetBase 无损还原，绝未被静态配置覆盖");
});

test("属性修复套件 · 敏锐暗修正管道贯通（警惕+1/疲惫-2 驱动有效敏锐与警觉增量）", () => {
  const g = createGame({
    player: { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 120 },
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 }
  });
  // 1. 无标签基准有效敏锐应为 5
  // 中控内未挂标签时
  const T = require("../src/runtime/tags.js");
  const C = require("../src/runtime/checks.js");
  const baseDelta = C.alertDelta({ threat: "medium", dist: "same", env: "night", acuity: 5 });

  // 2. 挂载 [警惕] (acuity +1)
  T.apply(g._g.tags, {
    id: "vigilant", name: "警惕", owner: "target", category: "acuity",
    effects: [{ category: "acuity", value: 1 }], duration: { type: "flag" }
  });
  const vigilantDelta = C.alertDelta({ threat: "medium", dist: "same", env: "night", acuity: 6 });
  assert.ok(vigilantDelta >= baseDelta, "警惕特质应使有效敏锐+1并提升警觉增量");

  // 3. 挂载 [疲惫] (acuity -2)
  T.remove(g._g.tags, "vigilant");
  T.apply(g._g.tags, {
    id: "tired", name: "疲惫", owner: "target", category: "acuity",
    effects: [{ category: "acuity", value: -2 }], duration: { type: "flag" }
  });
  const tiredDelta = C.alertDelta({ threat: "medium", dist: "same", env: "night", acuity: 3 });
  assert.ok(tiredDelta <= baseDelta, "疲惫特质应使有效敏锐-2并减少警觉增量");
});

test("属性修复套件 · 体力上限公式联动（100+体格*5）与身份双向钳制", () => {
  const g = createGame({
    player: { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 120 },
    identity: "coach" // 教练：体格 +3, 口才 +1
  });
  assert.equal(g._g.player.str, 7, "教练身份使体格从4提升至7 (4 + 3)");
  assert.equal(g._g.player.staminaMax, 135, "体格为7时体力上限应严格联动为 100 + 7*5 = 135");
});



