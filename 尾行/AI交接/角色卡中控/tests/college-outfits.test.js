/**
 * 女大学生（college）10 种通用性格与 11 套服装生活包单测
 * 覆盖：通用性格 10 项全量注册对齐、11 套服装（2 裤 9 裙 + 细致袜饰）、
 * 气质轮换池抽样、以及【清冷/要强性格严禁命中 JK 与 Lo 裙】硬核物理拦截。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const R = require("../src/config/rules.json");
const LP = require("../src/config/lifepack.json");
const { sampleOutfit } = require("../src/runtime/target_state.js");

const HTML = fs.readFileSync(path.join(__dirname, "..", "状态栏.html"), "utf8");

function extractConst(name) {
  const at = HTML.indexOf("const " + name + " = ");
  assert.ok(at >= 0, `状态栏.html 缺少 ${name}`);
  const rest = HTML.slice(at + name.length);
  const start = Math.min(...["{", "["].map(c => { const i = rest.indexOf(c); return i < 0 ? Infinity : i; }));
  assert.ok(Number.isFinite(start), `${name} 不是对象/数组字面量`);
  const open = rest[start], close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < rest.length; i++) {
    if (rest[i] === open) depth++;
    else if (rest[i] === close) { depth--; if (depth === 0) return (new Function("return " + rest.slice(start, i + 1)))(); }
  }
  assert.fail(`${name} 括号不配平`);
}

const PERSONALITY_POOL = extractConst("TARGET_PERSONALITY_POOL");

test("通用性格库对齐：10 种全角色通用性格全量注册且双向一致（无极端词）", () => {
  const rPool = R.targets.generator.personalityPool;
  assert.equal(rPool.length, 10, "通用性格库数量必须为 10");
  assert.equal(PERSONALITY_POOL.length, 10, "状态栏通用性格库数量必须为 10");
  assert.deepEqual(PERSONALITY_POOL, rPool, "状态栏与 rules 性格库漂移");

  const expectedIds = [
    "stubborn", "vigilant", "casual", "timid", "gentle",
    "introverted", "aloof", "cheerful", "chic", "naive"
  ];
  assert.deepEqual(rPool.map(p => p.id).sort(), expectedIds.sort());

  // 验证 rules.tags 均已全量注册
  for (const p of rPool) {
    assert.ok(R.tags[p.tagId], `rules.tags 缺少性格标签 ${p.tagId}`);
    assert.equal(R.tags[p.tagId].type, "personality");
  }

  // 去极端词审查
  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  for (const p of rPool) {
    for (const w of FORBIDDEN_WORDS) {
      assert.ok(!p.name.includes(w), `性格名 [${p.name}] 包含禁词 ${w}`);
      assert.ok(!p.desc.includes(w), `性格描述 [${p.desc}] 包含禁词 ${w}`);
    }
  }
});

test("女大学生服装包规格：11 套服装（正好 2 套中性裤装 ＋ 9 套不同裙装），袜子与鞋具均全量白描", () => {
  const pack = LP.packs.college;
  assert.ok(pack, "lifepack 缺少 packs.college");
  assert.ok(Array.isArray(pack.outfits), "packs.college.outfits 必须是数组");
  assert.equal(pack.outfits.length, 11, "女大学生服装库必须包含正好 11 套服装");

  // 验证裤装与裙装配比：2 套裤装，9 套裙装
  const pants = pack.outfits.filter(o => o.desc.includes("裤") && !o.desc.includes("裙"));
  const skirts = pack.outfits.filter(o => o.desc.includes("裙"));
  assert.equal(pants.length, 2, "中性男性化裤装必须正好 2 套");
  assert.equal(skirts.length, 9, "裙装必须正好 9 套");

  // 验证包含 JK 与 Lolita 裙
  assert.ok(pack.outfits.some(o => o.id === "outfit_sailor_jk"), "缺少水手服 JK");
  assert.ok(pack.outfits.some(o => o.id === "outfit_plaid_jk"), "缺少西式格裙 JK");
  assert.ok(pack.outfits.some(o => o.id === "outfit_lolita_jsk"), "缺少 Lolita 裙");

  // 验证袜子（socks）均有详实白描
  for (const o of pack.outfits) {
    assert.ok(o.socks && o.socks.length >= 6, `服装 [${o.name}] 缺少详尽的袜子白描`);
    assert.ok(o.shoeId && o.shoeName, `服装 [${o.name}] 缺少鞋具管道参数`);
    assert.ok(o.prompt && o.prompt.length >= 15, `服装 [${o.name}] 缺少大模型 prompt 指令`);
  }

  // 去极端词审查
  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  for (const o of pack.outfits) {
    for (const w of FORBIDDEN_WORDS) {
      assert.ok(!o.desc.includes(w), `服装描述 [${o.desc}] 包含禁词 ${w}`);
      assert.ok(!o.prompt.includes(w), `服装 prompt [${o.prompt}] 包含禁词 ${w}`);
    }
  }
});

test("气质轮换与绝对拦截：清冷 (aloof) 与要强 (stubborn) 性格 100 次抽样绝不命中 JK 与 Lo 裙", () => {
  const pack = LP.packs.college;
  const FORBIDDEN_SWEET_IDS = ["outfit_sailor_jk", "outfit_plaid_jk", "outfit_lolita_jsk"];

  // 1. 清冷性格 100 次伪随机抽样
  for (let i = 0; i < 100; i++) {
    const res = sampleOutfit(pack, 1, i * 37 + 11, { personalityId: "aloof" });
    assert.ok(!FORBIDDEN_SWEET_IDS.includes(res.id), `清冷性格违规抽中甜美特型衣服: ${res.id} (${res.name})`);
    assert.ok(["cool", "casual"].includes(res.styleGroup), `清冷性格服装气质不匹配: ${res.styleGroup}`);
  }

  // 2. 要强性格 100 次伪随机抽样
  for (let i = 0; i < 100; i++) {
    const res = sampleOutfit(pack, 1, i * 43 + 7, { personalityId: "stubborn" });
    assert.ok(!FORBIDDEN_SWEET_IDS.includes(res.id), `要强性格违规抽中甜美特型衣服: ${res.id} (${res.name})`);
    assert.ok(["cool", "casual"].includes(res.styleGroup), `要强性格服装气质不匹配: ${res.styleGroup}`);
  }

  // 3. 爱美性格 (chic) 可以正常命中甜美组（JK 与 Lo 裙）
  let chicHitsSweet = false;
  for (let i = 0; i < 50; i++) {
    const res = sampleOutfit(pack, 1, i * 19 + 3, { personalityId: "chic" });
    if (FORBIDDEN_SWEET_IDS.includes(res.id)) {
      chicHitsSweet = true;
      break;
    }
  }
  assert.ok(chicHitsSweet, "爱美性格应当能够正常抽中 JK 或 Lo 裙");
});

test("女大学生身心状态与双手行为池：4大身心池与3层双手行为全量覆盖且零极端词", () => {
  const { sampleSomatic, resolveHand } = require("../src/runtime/target_state.js");
  const pack = LP.packs.college;

  // 1. 验证 somaticPool
  assert.ok(Array.isArray(pack.somaticPool) && pack.somaticPool.length === 4, "somaticPool 必须包含 4 种状态");
  const sids = pack.somaticPool.map(s => s.id);
  assert.deepEqual(sids.sort(), ["fatigued", "normal", "relaxed", "rushing"].sort());
  for (const s of pack.somaticPool) {
    assert.ok(s.reasons && s.reasons.length >= 2, `身心状态 [${s.name}] 理由子池不足`);
    assert.ok(s.prompt && s.prompt.length >= 10, `身心状态 [${s.name}] 缺少 prompt`);
  }

  // 2. 验证 handPool
  const hp = pack.handPool;
  assert.ok(hp && hp.siteOverrides && hp.carriagePool && hp.enRoute, "handPool 三层结构必须齐全");
  assert.ok(hp.siteOverrides.campus_library_b, "缺少图书馆地点破绽");
  assert.ok(hp.siteOverrides.unit_stairs_b, "缺少老楼道钥匙破绽");
  assert.equal(hp.carriagePool.length, 3, "车厢行为必须为 3 项");
  assert.equal(hp.enRoute.length, 5, "街道步行行为必须为 5 项");

  // 3. 抽样验证
  const som = sampleSomatic(pack, 12345);
  assert.ok(som && som.id && som.reason, "sampleSomatic 抽样失败");

  const handAtLib = resolveHand(pack, "campus_library_b", null, 1);
  assert.equal(handAtLib.fumbling, true, "图书馆处必须提供翻找破绽");

  // 去极端词审查
  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  for (const s of pack.somaticPool) {
    for (const r of s.reasons) {
      for (const w of FORBIDDEN_WORDS) {
        assert.ok(!r.includes(w), `身心理由 [${r}] 包含禁词 ${w}`);
      }
    }
  }
});

test("女大学生全周动线矩阵：8大路线与节点拓扑全量连通且零悬空（validate 零报错）", () => {
  const pack = LP.packs.college;
  const { validate } = require("../src/runtime/facts.js");
  const places = require("../src/config/places.json").places;

  assert.ok(Array.isArray(pack.routes), "college 必须包含 routes 动线数组");
  assert.equal(pack.routes.length, 8, "全周动线矩阵必须包含 8 条路线（周内/延误/周五/周六三大/周日）");

  const expectedRouteIds = [
    "college_evening",
    "college_delay_evening",
    "college_friday_night",
    "saturday_cram",
    "saturday_outing",
    "saturday_date_home",
    "saturday_date_hotel",
    "sunday_rest"
  ];
  const actualIds = pack.routes.map(r => r.id);
  assert.deepEqual(actualIds.sort(), expectedRouteIds.sort(), "动线 ID 必须完全符合规格");

  // 交叉校验：所有路径节点必须真实存在于 places.json 中，无悬空死链
  const errs = validate(pack);
  const routeErrs = errs.filter(e => e.includes(".route"));
  assert.deepEqual(routeErrs, [], `动线节点存在悬空死链: ${routeErrs.join("; ")}`);

  // 去极端词审查
  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  for (const r of pack.routes) {
    for (const w of FORBIDDEN_WORDS) {
      assert.ok(!r.prompt.includes(w), `动线 prompt [${r.prompt}] 包含禁词 ${w}`);
      assert.ok(!r.note.includes(w), `动线 note [${r.note}] 包含禁词 ${w}`);
    }
  }
});

test("突发扰动与作业延误：起点推迟40分钟（至22:10出发）与首节点信号联动及概率公式推导", () => {
  const pack = LP.packs.college;
  const { nightConditions } = require("../src/runtime/facts.js");
  const { createGame } = require("../src/runtime/game.js");

  // 1. conditions 规格校验
  assert.ok(Array.isArray(pack.conditions), "conditions 必须为数组");
  assert.equal(pack.conditions.length, 3, "必须包含 3 种突发扰动");
  const cids = pack.conditions.map(c => c.id);
  assert.deepEqual(cids.sort(), ["ddl_delay", "express_pickup", "roommate_walk"].sort());

  // 2. 概率推导验证：P(扰动) = mod × (1 - stability)
  // stability = 0.8 -> (1 - stability) = 0.2
  // ddl_delay: mod = 2 -> 40% 概率
  // roommate_walk & express_pickup: mod = 1 -> 20% 概率
  assert.equal(pack.stability, 0.8, "独居女大学生 stability 基础数值应为 0.8");
  const ddlCond = pack.conditions.find(c => c.id === "ddl_delay");
  assert.equal(ddlCond.mod, 2);
  const expectedP = ddlCond.mod * (1 - pack.stability);
  assert.equal(Math.round(expectedP * 100), 40, "作业延误发生概率必须严格推导为 40%");

  // 3. 小组作业延误动线：起点推迟40分钟（21:30 -> 22:10）
  const delayRoute = pack.routes.find(r => r.id === "college_delay_evening");
  assert.ok(delayRoute, "必须包含 college_delay_evening 延误路线");
  assert.equal(delayRoute.path[0].place, "school_gate_b", "起点为大学校门");
  assert.equal(delayRoute.path[0].t, "2210", "起点时间必须推迟40分钟至 22:10 出发");

  // 4. 中控状态机集成：装载延误动线时，首条信号起步时间动态呈现为 22:10
  const gDelay = createGame({
    targetId: "college",
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
    route: {
      id: delayRoute.id,
      note: delayRoute.note,
      prompt: delayRoute.prompt,
      startTime: "22:10",
      nodes: delayRoute.path.map(p => p.place),
      known: delayRoute.path.map(() => 1),
      here: 0
    },
    sessionSalt: "test_salt_college_delay"
  });

  const snap = gDelay.snapshot();
  assert.ok(snap.signal && snap.signal.length > 0, "快照必须包含初始信号");
  assert.equal(snap.signal[0][0], "22:10", "作业延误首条信号时间必须为推迟后的 22:10");
  assert.equal(snap.route.startTime, "22:10", "动线对象携带的 startTime 必须为 22:10");
});

test("中控集成：女大学生周六日程分支与周日居家休整及周一工作日全链路循环运转", () => {
  const { createGame } = require("../src/runtime/game.js");

  // 1. 周六（Day 6）自动装载周六日程路线
  const gSat = createGame({
    targetId: "college",
    stats: { date: 6, heart: 30, stamina: 100, cash: 800, pi: 0 },
    targetPersona: { personality: "cheerful", saturdayRoutine: "cram" },
    sessionSalt: "test_salt_college_weekend_flow"
  });
  const snapSat = gSat.snapshot();
  assert.ok(snapSat.targetState.route, "周六快照应包含当晚动线");
  assert.equal(snapSat.targetState.route.id, "saturday_cram", "周六备考自习应正确命中 saturday_cram");

  // 2. 过夜收摊至周日（Day 7）：目标居家休整，不产生跟缀动线
  const resSun = gSat.nightFall();
  assert.equal(resSun.date, 7, "过夜后进入周日（Day 7）");
  const snapSun = gSat.snapshot();
  assert.equal(snapSun.targetState.route.id, "sunday_rest", "周日必须装载 sunday_rest");
  assert.equal(gSat._g.tailing, false, "周日居家休整禁止跟缀");

  // 3. 周日过夜收摊至周一（Day 8）：自动平滑恢复为工作日常规晚自习动线
  const resMon = gSat.nightFall();
  assert.equal(resMon.date, 8, "过夜后进入周一（Day 8）");
  const snapMon = gSat.snapshot();
  assert.equal(snapMon.targetState.route.id, "college_evening", "进入新一周工作日应自动恢复 college_evening 动线");
  assert.equal(snapMon.route.startTime, "21:30", "工作日晚自习常规起点时间应为 21:30");
});

test("女大学生六大槽位事实池：18条细分情报基准与多选项开局抽样池全量覆盖且零极端词（通用模板）", () => {
  const pack = LP.packs.college;
  const { view, validate } = require("../src/runtime/facts.js");

  // 1. 基准池规格校验：6 槽位 × 3 层 = 18 条细分情报
  assert.ok(Array.isArray(pack.factPool), "factPool 必须为数组");
  assert.equal(pack.factPool.length, 18, "女大学生基准生活事实池必须正好为 18 条细分情报（6大槽位×3层）");

  // 2. 槽位分布校验：六大槽位（home, schedule, carry, social, psyche, romance）严格各 3 条
  const slotCounts = {};
  for (const f of pack.factPool) {
    slotCounts[f.slot] = (slotCounts[f.slot] || 0) + 1;
  }
  assert.deepEqual(slotCounts, { home: 3, schedule: 3, carry: 3, social: 3, psyche: 3, romance: 3 }, "槽位事实分布必须严密对称");

  // 3. 候选池结构齐备校验（方案A扩大版本：住处全抽、作息随身按性格、恋爱三态）
  assert.ok(Array.isArray(pack.homePool) && pack.homePool.length === 3, "homePool 必须提供 3 个住处选项");
  assert.ok(Array.isArray(pack.schedulePool) && pack.schedulePool.length === 3, "schedulePool 必须提供 3 个作息选项");
  assert.ok(Array.isArray(pack.carryPool) && pack.carryPool.length === 3, "carryPool 必须提供 3 个随身选项");
  assert.ok(Array.isArray(pack.socialPool) && pack.socialPool.length === 3, "socialPool 必须提供 3 个人际选项");
  assert.ok(Array.isArray(pack.psychePool) && pack.psychePool.length === 3, "psychePool 必须提供 3 个心理选项");
  assert.ok(Array.isArray(pack.romancePool) && pack.romancePool.length === 3, "romancePool 必须提供 3 个恋爱选项");

  // 4. 交叉校验零报错
  const errs = validate(pack);
  assert.deepEqual(errs, [], `生活包事实交叉校验存在错误: ${errs.join("; ")}`);

  // 5. 动态视图解锁演练
  // 开局 L0（PI=0）：仅能看到 carry 的 public 事实（随身包袋）
  const v0 = view("college", { pi: 0, tickets: [] });
  assert.equal(v0.facts.length, 1);
  assert.equal(v0.facts[0].id, "college_carry_bag");

  // 第一阶段 L1（PI=15）：解锁全部 6 个槽位 L1 事实
  const v15 = view("college", { pi: 15, tickets: [] });
  assert.ok(v15.facts.length >= 6, "PI=15 时应解锁六大槽位 L1 事实");
  assert.ok(v15.facts.some(f => f.id === "college_home_area"));
  assert.ok(v15.facts.some(f => f.id === "college_sched_library"));
  assert.ok(v15.facts.some(f => f.id === "target_romance_single_status"));

  // 第二阶段 L2（PI=30，持有对应观察票）：解锁 L2 事实
  const v30 = view("college", { pi: 30, tickets: ["photo", "watch_peers", "chat"] });
  assert.ok(v30.facts.length >= 12, "PI=30 且持有观察票时应解锁 12 条生活情报");
  assert.ok(v30.facts.some(f => f.id === "college_home_building"));
  assert.ok(v30.facts.some(f => f.id === "college_sched_store"));
  assert.ok(v30.facts.some(f => f.id === "college_social_roommate"));
  assert.ok(v30.facts.some(f => f.id === "target_romance_single_boundary"));

  // 终局全开（PI=55，持有全套动作票据）：解锁 L3 核心要害，18 条情报全部点亮
  const v55 = view("college", { pi: 55, tickets: ["ransack", "pick", "audit_class", "door_peep", "photo", "watch_peers", "pump_person", "chat"] });
  assert.equal(v55.facts.length, 18, "全部条件齐备时 18 条情报全量点亮");
  assert.ok(v55.facts.some(f => f.id === "college_home_door"));
  assert.ok(v55.facts.some(f => f.id === "college_sched_ddl"));
  assert.ok(v55.facts.some(f => f.id === "college_psyche_reputation"));
  assert.ok(v55.facts.some(f => f.id === "target_romance_single_core"));

  // 6. 去极端词审查（包含基准池与所有候选池分支事实）
  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  const allFacts = [...pack.factPool];
  for (const pool of [pack.homePool, pack.schedulePool, pack.carryPool, pack.socialPool, pack.psychePool, pack.romancePool]) {
    for (const branch of pool) {
      if (branch.facts) allFacts.push(...branch.facts);
    }
  }
  for (const f of allFacts) {
    for (const w of FORBIDDEN_WORDS) {
      assert.ok(!f.title.includes(w), `事实标题 [${f.title}] 包含禁词 ${w}`);
      assert.ok(!f.text.includes(w), `事实正文 [${f.text}] 包含禁词 ${w}`);
    }
  }
});



