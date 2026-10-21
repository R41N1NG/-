const test = require("node:test");
const assert = require("node:assert/strict");
const TS = require("../src/runtime/target_state.js");
const { createGame } = require("../src/runtime/game.js");
const LP = require("../src/config/lifepack.json");
const R = require("../src/config/rules.json");

test("目标态势 · 基础周末判断", () => {
  assert.equal(TS.isWeekend(1), false); // 周一
  assert.equal(TS.isWeekend(5), false); // 周五
  assert.equal(TS.isWeekend(6), true);  // 周六
  assert.equal(TS.isWeekend(7), true);  // 周日
  assert.equal(TS.isWeekend(8), false); // 次周一
  assert.equal(TS.isWeekend(13), true); // 次周六
  assert.equal(TS.isWeekend(14), true); // 次周日
});

test("目标态势 · JK服装平日固定与周末私服池确定性抽取", () => {
  const pack = LP.packs.student;
  // 平日（周一至周五）：恒定为制式校服
  for (let d = 1; d <= 5; d++) {
    const outfit = TS.sampleOutfit(pack, d, 12345);
    assert.equal(outfit.id, "outfit_jk_uniform");
    assert.equal(outfit.name, "制式校服");
    assert.equal(outfit.isWeekend, false);
  }

  // 周末（周六/周日）：从 weekendOutfitPool 抽取
  const validIds = pack.weekendOutfitPool.map(o => o.id);
  const weekendOutfit1 = TS.sampleOutfit(pack, 6, 9999);
  assert.equal(weekendOutfit1.isWeekend, true);
  assert.ok(validIds.includes(weekendOutfit1.id));

  // 相同种子必产出完全相同的结果（确定性）
  const weekendOutfit2 = TS.sampleOutfit(pack, 6, 9999);
  assert.deepEqual(weekendOutfit1, weekendOutfit2);
});

test("目标态势 · 身心状态与理由子池确定性抽取", () => {
  const pack = LP.packs.student;
  const somatic1 = TS.sampleSomatic(pack, 8888);
  assert.ok(["normal", "fatigued", "relaxed", "rushing"].includes(somatic1.id));
  assert.ok(typeof somatic1.reason === "string" && somatic1.reason.length > 0);

  // 验证理由确实属于该身心状态的 reasons 子池
  const poolItem = pack.somaticPool.find(s => s.id === somatic1.id);
  assert.ok(poolItem.reasons.includes(somatic1.reason));

  // 重放一致性
  const somatic2 = TS.sampleSomatic(pack, 8888);
  assert.deepEqual(somatic1, somatic2);
});

test("目标态势 · 双手焦点地点优先与途中维持机制", () => {
  const pack = LP.packs.student;

  // 1. 地点优先触发：学区公交总站
  const handBus = TS.resolveHand(pack, "school_bus_terminal_b", null, 100);
  assert.equal(handBus.id, "ticket_fumble");
  assert.equal(handBus.fumbling, true);
  assert.equal(handBus.isSiteOverride, true);

  // 2. 地点优先触发：老街便利店
  const handStore = TS.resolveHand(pack, "store_24h_b", null, 200);
  assert.equal(handStore.id, "drink_buy");
  assert.equal(handStore.fumbling, false);
  assert.equal(handStore.isSiteOverride, true);

  // 3. 途中抽取（平路）
  const enRoute1 = TS.resolveHand(pack, "old_alley_main_b", null, 300);
  assert.equal(enRoute1.isSiteOverride, false);
  assert.ok(enRoute1.remainingDuration >= 1);

  // 5. 新增地点专属破绽验证：老街地铁站出站口（固定翻找车票）与校门前（整理书包）
  const handMetroExit = TS.resolveHand(pack, "old_metro_b", null, 500);
  assert.equal(handMetroExit.id, "metro_fumble");
  assert.equal(handMetroExit.fumbling, true);
  assert.equal(handMetroExit.isSiteOverride, true);

  const handSchoolGate = TS.resolveHand(pack, "school_gate_b", null, 600);
  assert.equal(handSchoolGate.id, "bag_tidy");
  assert.equal(handSchoolGate.fumbling, true);
  assert.equal(handSchoolGate.isSiteOverride, true);

  // 6. 地铁车厢态势池抽取验证（45% 正常 / 35% 手机与耳机 / 20% 摇晃瞌睡，权重和为 100）
  assert.ok(pack.handPool.carriagePool, "必须包含 carriagePool");
  const cWeights = pack.handPool.carriagePool.reduce((s, it) => s + it.weight, 0);
  assert.equal(cWeights, 100, "车厢池权重和严格为 100%");
  
  const idsSampled = new Set();
  for (let s = 1; s <= 200; s++) {
    const cHand = TS.resolveHand(pack, "old_metro_b", null, s, { isCarriage: true });
    assert.equal(cHand.isCarriage, true);
    idsSampled.add(cHand.id);
  }
  assert.ok(idsSampled.has("carriage_normal"), "必须能抽到正常乘车(45%)");
  assert.ok(idsSampled.has("carriage_phone"), "必须能抽到手机与耳机(35%)");
  assert.ok(idsSampled.has("carriage_doze"), "必须能抽到摇晃瞌睡(20%)");
});

test("中控集成 · student 目标建局与态势初始化", () => {
  const g = createGame({
    targetId: "student",
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
    sessionSalt: "test_salt_target_state_001"
  });

  const snap = g.snapshot();
  assert.ok(snap.targetState);
  assert.equal(snap.targetState.outfit.id, "outfit_jk_uniform");
  assert.ok(snap.targetState.somatic);
  assert.ok(snap.targetState.hand);

  // 目标快照应同步注入 state
  assert.deepEqual(snap.target.state, snap.targetState);

  // 标签栈应包含对应的态势标签
  if (snap.targetState.somatic.tag) {
    const hasSomaticTag = snap.tags.some(t => t.name === R.tags[snap.targetState.somatic.tag]?.name);
    assert.ok(hasSomaticTag);
  }
  if (snap.targetState.hand.tag) {
    const hasHandTag = snap.tags.some(t => t.name === R.tags[snap.targetState.hand.tag]?.name);
    assert.ok(hasHandTag);
  }
});

test("中控集成 · 动线推进与地点翻找破绽标签挂载", () => {
  const g = createGame({
    targetId: "student",
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
    sessionSalt: "test_salt_target_state_002"
  });

  // 装载学生傍晚动线：校门 -> 公交站 -> 便利店 -> 单元楼
  g.setRoute({
    nodes: ["school_gate_b", "school_bus_terminal_b", "store_24h_b", "unit_stairs_b"],
    known: [1, 1, 1, 1],
    here: 0
  });

  // 第 0 节点：校门（地点专属覆盖：整理书包，fumbling = true）
  let snap = g.snapshot();
  assert.equal(snap.targetState.hand.id, "bag_tidy");
  assert.equal(snap.targetState.hand.isSiteOverride, true);

  // 推进至第 1 节点：公交站（地点优先覆盖：翻找月票，fumbling = true）
  g.herAdvance();
  snap = g.snapshot();
  assert.equal(snap.targetState.hand.id, "ticket_fumble");
  assert.equal(snap.targetState.hand.fumbling, true);
  assert.ok(snap.tags.some(t => t.name === "翻找物品"));

  // 推进至第 2 节点：便利店（买热饮，fumbling = false，翻找标签自动摘除）
  g.herAdvance();
  snap = g.snapshot();
  assert.equal(snap.targetState.hand.id, "drink_buy");
  assert.equal(snap.targetState.hand.fumbling, false);
  assert.ok(!snap.tags.some(t => t.name === "翻找物品"));
});

test("中控集成 · 过夜结算与周末私服切换", () => {
  // 开局设在周五（date: 5）
  const g = createGame({
    targetId: "student",
    stats: { date: 5, heart: 30, stamina: 100, cash: 800, pi: 0 },
    sessionSalt: "test_salt_target_state_003"
  });

  assert.equal(g.snapshot().targetState.outfit.id, "outfit_jk_uniform");
  assert.equal(g.snapshot().targetState.outfit.isWeekend, false);

  // 执行过夜（日期推进至 6，周六）
  const nightRes = g.nightFall();
  assert.equal(nightRes.date, 6);

  const nextSnap = g.snapshot();
  assert.equal(nextSnap.targetState.outfit.isWeekend, true);
  const validWeekendIds = LP.packs.student.weekendOutfitPool.map(o => o.id);
  assert.ok(validWeekendIds.includes(nextSnap.targetState.outfit.id));
});

test("中控集成 · 存档与读档无损恢复目标态势", () => {
  const g1 = createGame({
    targetId: "student",
    stats: { date: 6, heart: 30, stamina: 100, cash: 800, pi: 0 },
    sessionSalt: "test_salt_target_state_004"
  });

  const saved = g1.save();
  assert.ok(saved.targetState);

  // 从 saved 重建
  const g2 = createGame({ saved });
  assert.deepEqual(g2.snapshot().targetState, g1.snapshot().targetState);
});

test("中控集成 · 服装鞋具全量注册对齐与脚步声码切换验证", () => {
  const pack = LP.packs.student;
  const validShoePool = R.targets.generator.shoePool.student_and_college.map(s => s.id);
  const allOutfits = [pack.defaultOutfit, ...pack.weekendOutfitPool];

  // 1. 验证所有服装的 shoeId 都在 rules 注册的鞋具池中（严禁凭空造鞋）
  for (const o of allOutfits) {
    assert.ok(o.shoeId, `服装 [${o.id}] 缺少 shoeId`);
    assert.ok(validShoePool.includes(o.shoeId), `服装 [${o.id}] 的 shoeId [${o.shoeId}] 不在注册鞋池中（黑户）`);
    assert.ok(R.tags[o.shoeId], `鞋具标签 [${o.shoeId}] 未在 rules.tags 注册`);
  }

  // 2. 工作日开局（date: 1）：默认校服配制服小皮鞋 -> 脚步声代码 leather
  const gWorkday = createGame({
    targetId: "student",
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
    sessionSalt: "test_salt_shoe_workday"
  });
  const snapWorkday = gWorkday.snapshot();
  assert.equal(snapWorkday.targetState.outfit.shoeId, "shoe_leather");
  assert.equal(snapWorkday.target.shoe, "leather");
  assert.ok(snapWorkday.tags.some(t => t.id === "shoe_leather" && t.owner === "target"));

  // 3. 周末换上运动鞋私服（如卫衣牛仔裙）：脚步声代码应同步切换为 sneakers
  const gWeekend = createGame({
    targetId: "student",
    stats: { date: 6, heart: 30, stamina: 100, cash: 800, pi: 0 },
    targetState: {
      outfit: { id: "outfit_hoodie_denim", name: "连帽卫衣+牛仔短裙", shoeId: "shoe_sneakers", isWeekend: true },
      somatic: { id: "normal", name: "平常状态" },
      hand: { id: "normal", name: "自然垂手" }
    },
    sessionSalt: "test_salt_shoe_weekend"
  });
  const snapWeekend = gWeekend.snapshot();
  assert.equal(snapWeekend.target.shoe, "sneakers");
  assert.ok(snapWeekend.tags.some(t => t.id === "shoe_sneakers" && t.owner === "target"));
  assert.ok(!snapWeekend.tags.some(t => t.id === "shoe_leather"));
});

test("中控集成 · 周六日程分支与约会情侣旅社走向（胆小4/慢热3/开朗2）验证", () => {
  const pack = LP.packs.student;

  // 1. 验证性格阈值（胆小4/慢热3/开朗2）
  assert.equal(TS.getDateHotelThreshold("timid"), 4);
  assert.equal(TS.getDateHotelThreshold("anxious"), 4);
  assert.equal(TS.getDateHotelThreshold("guarded"), 3);
  assert.equal(TS.getDateHotelThreshold("oblivious"), 2);
  assert.equal(TS.getDateHotelThreshold("gentle"), 2);

  // 2. 动线匹配测试
  const cramRoute = TS.resolveSaturdayRoute(pack, "cram", 0, "timid", "seed1");
  assert.equal(cramRoute.id, "saturday_cram");

  const outingRoute = TS.resolveSaturdayRoute(pack, "outing", 0, "timid", "seed1");
  assert.equal(outingRoute.id, "saturday_outing");

  // 胆小性格，约会次数 0~3 次均只能回家
  for (let c = 0; c < 4; c++) {
    const route = TS.resolveSaturdayRoute(pack, "date", c, "timid", "seed_home");
    assert.equal(route.id, "saturday_date_home");
  }

  // 胆小性格第 4 次（dateCount: 4），存在 50% 概率触发情侣酒店走向
  let hitHotel = false;
  let hitHome = false;
  for (let s = 0; s < 50; s++) {
    const r = TS.resolveSaturdayRoute(pack, "date", 4, "timid", "seed_test_" + s);
    if (r.id === "saturday_date_hotel") hitHotel = true;
    if (r.id === "saturday_date_home") hitHome = true;
  }
  assert.ok(hitHotel, "达到阈值后应能抽中情侣旅社路线");
  assert.ok(hitHome, "达到阈值后仍有概率抽中回家路线");

  // 3. 游戏内周六动线自动装载与情侣旅社目的地校验
  const gSaturday = createGame({
    targetId: "student",
    stats: { date: 6, heart: 30, stamina: 100, cash: 800, pi: 0 },
    targetPersona: { personality: "oblivious", saturdayRoutine: "date" },
    dateCount: 2, // 开朗性格已达标
    sessionSalt: "test_salt_saturday_hotel_fixed"
  });

  const snap = gSaturday.snapshot();
  assert.ok(snap.targetState.route, "周六快照应包含当晚动线情境");
  assert.ok(["saturday_date_home", "saturday_date_hotel"].includes(snap.targetState.route.id));
  assert.ok(snap.targetState.route.prompt.includes("青涩情侣"));
});

test("中控集成 · 情侣酒店首次迷雾遮蔽 vs 后续恩爱缠绵分层白描（零代打留白）", () => {
  const pack = LP.packs.student;

  // 1. 首次触发情侣酒店走向（hotelVisitedCount: 0）：末端盲端遮蔽 [1, 1, 1, 0]
  let firstHotel = null;
  for (let s = 0; s < 50; s++) {
    const r = TS.resolveSaturdayRoute(pack, "date", 4, "timid", "seed_first_" + s, { hotelVisitedCount: 0 });
    if (r.id === "saturday_date_hotel") {
      firstHotel = r;
      break;
    }
  }
  assert.ok(firstHotel, "应能抽中情侣酒店走向");
  assert.equal(firstHotel.isFirstHotel, true);
  assert.deepEqual(firstHotel.known, [1, 1, 1, 0], "首次前往旅社：目的地节点应处于未探明迷雾遮蔽状态（known=0）");
  assert.ok(firstHotel.note.includes("未知新动线"), "首次动线标注应为未知新动线分支");
  assert.ok(firstHotel.prompt.includes("十指紧扣"), "白描应包含初次牵手的细节");
  assert.ok(!firstHotel.prompt.includes("情侣旅社"), "首次白描严禁剧透目的地具体名称");
  assert.ok(!firstHotel.prompt.includes("决断窗口"), "严禁出现教玩家做事的决断窗口提示词");
  assert.ok(!firstHotel.prompt.includes("最后机会"), "严禁出现代打式急迫催促");

  // 2. 后续再次触发情侣酒店走向（hotelVisitedCount >= 1）：已知全开 [1, 1, 1, 1]
  let nextHotel = null;
  for (let s = 0; s < 50; s++) {
    const r = TS.resolveSaturdayRoute(pack, "date", 4, "timid", "seed_next_" + s, { hotelVisitedCount: 1 });
    if (r.id === "saturday_date_hotel") {
      nextHotel = r;
      break;
    }
  }
  assert.ok(nextHotel, "后续应能抽中情侣酒店走向");
  assert.equal(nextHotel.isFirstHotel, false);
  assert.deepEqual(nextHotel.known, [1, 1, 1, 1], "后续前往旅社：已知地点全量点亮（known=1）");
  assert.ok(nextHotel.note.includes("情侣旅社走向"), "后续动线标注应为情侣旅社走向");
  assert.ok(nextHotel.prompt.includes("熟稔亲昵") || nextHotel.prompt.includes("恩爱缠绵"), "后续白描应展现食髓知味后的缠绵");
  assert.ok(!nextHotel.prompt.includes("决断窗口"), "严禁出现决断窗口指导词");
});

test("中控集成 · 周日全员居家休整与下周一周二步履蹒跚（敏捷-2）全链路结算", () => {
  // 建局：从周六（Day 6）开始，命中情侣酒店动线
  const g = createGame({
    targetId: "student",
    stats: { date: 6, heart: 30, stamina: 100, cash: 800, pi: 0 },
    targetPersona: { personality: "oblivious", saturdayRoutine: "date" },
    dateCount: 3,
    route: {
      id: "saturday_date_hotel",
      note: "周六青涩约会·未知新动线分支",
      prompt: "白描初次牵手的娇羞",
      nodes: ["old_metro_b", "old_park_b", "old_alley_main_b", "love_hotel_b"],
      known: [1, 1, 1, 0],
      here: 3
    },
    sessionSalt: "test_hotel_limping_chain"
  });

  // 周六晚过夜收摊：记录 hotelVisitedCount=1，lastHotelDate=6，日期推进至周日 Day 7
  const resSun = g.nightFall();
  assert.equal(resSun.date, 7, "过夜后进入周日（Day 7）");
  assert.equal(g._g.hotelVisitedCount, 1, "酒店访问计数记录为 1");
  assert.equal(g._g.lastHotelDate, 6, "上一次酒店日期记录为 Day 6");

  // 1. 验证周日（Day 7）：目标居家休整，不产生外勤跟缀动线
  const snapSun = g.snapshot();
  assert.equal(snapSun.targetState.route.id, "sunday_rest", "周日应装载 sunday_rest 动线");
  assert.ok(snapSun.targetState.route.note.includes("居家休整"), "周日动线标注应包含居家休整");
  assert.ok(snapSun.targetState.route.prompt.includes("休整"), "周日白描约束应为在寓所内休整");
  assert.equal(g.mode, "stealth");

  // 2. 周日晚过夜收摊：日期推进至下周一（Day 8）
  const resMon = g.nightFall();
  assert.equal(resMon.date, 8, "过夜后进入周一（Day 8）");

  // 验证周一（Day 8）：挂载【身心·步履蹒跚】（敏捷 -2）常驻标签
  const snapMon = g.snapshot();
  assert.equal(snapMon.targetState.somatic.id, "limping");
  assert.equal(snapMon.targetState.somatic.name, "步履蹒跚");
  assert.equal(snapMon.targetState.somatic.mod.agi, -2, "身心修正属性为敏捷 -2");
  assert.ok(snapMon.targetState.somatic.prompt.includes("步伐变得很小") || snapMon.targetState.somatic.prompt.includes("轻微吸气"), "正文白描应包含步伐变小与轻微吸气");
  // 目标属性敏捷受到 -2 扣减（基底 4 -> 2）
  assert.equal(snapMon.target.stats.agi, 2, "目标敏捷应经 -2 修正由 4 降至 2");
  // 目标标签栈包含 somatic_limping
  assert.ok(snapMon.tags.some(t => t.id === "somatic_limping" && t.owner === "target"), "标签栈必须包含 somatic_limping 标签");

  // 3. 周一晚过夜收摊：日期推进至下周二（Day 9）
  const resTue = g.nightFall();
  assert.equal(resTue.date, 9, "过夜后进入周二（Day 9）");

  // 验证周二（Day 9）：【身心·步履蹒跚】继续常驻
  const snapTue = g.snapshot();
  assert.equal(snapTue.targetState.somatic.id, "limping");
  assert.equal(snapTue.target.stats.agi, 2, "周二目标敏捷依然保持 -2 扣减");
  assert.ok(snapTue.tags.some(t => t.id === "somatic_limping" && t.owner === "target"), "周二标签栈仍应保持步履蹒跚");

  // 4. 周二晚过夜收摊：日期推进至周三（Day 10）
  const resWed = g.nightFall();
  assert.equal(resWed.date, 10, "过夜后进入周三（Day 10）");

  // 验证周三（Day 10）：生理受迫期结束，步履蹒跚自然消退，属性恢复为其自身基底
  const snapWed = g.snapshot();
  assert.notEqual(snapWed.targetState.somatic.id, "limping", "周三身心状态应恢复常规池抽取");
  assert.equal(snapWed.target.stats.agi, g._g.targetBase.agi, "周三目标敏捷应恢复至其自身基底");
  assert.ok(!snapWed.tags.some(t => t.id === "somatic_limping"), "周三标签栈应不再含有步履蹒跚");

  // 5. 存档与读档往返一致性验证
  const saved = g.save();
  assert.equal(saved.hotelVisitedCount, 1);
  assert.equal(saved.lastHotelDate, 6);
  const gReloaded = createGame({ saved });
  assert.equal(gReloaded._g.hotelVisitedCount, 1);
  assert.equal(gReloaded._g.lastHotelDate, 6);

  // 6. 验证带开局数值扰动（delta: +1，基底敏捷为 5）的目标动态计算
  const gPerturbed = createGame({
    targetId: "student",
    targetPersona: { finalStats: { str: 3, agi: 5, per: 4, nrv: 4, social: 2 } },
    stats: { date: 8, heart: 30, stamina: 100, cash: 800, pi: 0 },
    lastHotelDate: 6
  });
  const snapPerturbed = gPerturbed.snapshot();
  assert.equal(snapPerturbed.target.stats.agi, 3, "敏捷基底 5 的目标经 -2 修正后应动态为 3");
  gPerturbed.nightFall(); // Day 9 (周二)
  assert.equal(gPerturbed.snapshot().target.stats.agi, 3, "周二依然为 3");
  gPerturbed.nightFall(); // Day 10 (周三)
  assert.equal(gPerturbed._g.targetBase.agi, 5, "周三目标基底仍为开局扰动基底 5");
  const somaticWed = gPerturbed._g.targetState.somatic;
  const expectedAgi = 5 + (somaticWed.mod?.agi || 0);
  assert.equal(gPerturbed.snapshot().target.stats.agi, expectedAgi, `周三敏捷应为基底 5 叠加当天身心状态 (5 + ${somaticWed.mod?.agi || 0} = ${expectedAgi})`);
  assert.equal(somaticWed.id !== "limping", true, "周三已解除步履蹒跚");
});


