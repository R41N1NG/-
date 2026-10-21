/**
 * 检定引擎单测 —— 断言全部来自《数值策划 v0.6》的定稿数值与验算锚点。
 * 跑法：node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../src/runtime/checks.js");

/* ---------- d20 检定与结果带（v0.6：单轨大成功＋勉强收窄） ---------- */
test("结果带：成功/失败按 margin 划分；数值 crit 带已删（天然 20 专属）", () => {
  // DC15：d20 15 + 属性5 = 20 → margin 5 也不再是 crit，就是 success
  assert.equal(C.d20Check({ d20: 15, attr: 5, dc: 15 }).band, "success");
  // d20 14 + 5 = 19 → margin 4 = success
  assert.equal(C.d20Check({ d20: 14, attr: 5, dc: 15 }).band, "success");
  // margin -4 → fail
  assert.equal(C.d20Check({ d20: 2, attr: 5, dc: 10 }).band, "fail");
});

test("勉强档 DC−1~−3（15% 带宽）仅尾随系 stealth=true 生效", () => {
  // margin -1 / -3 → grace（stealth 词条）
  assert.equal(C.d20Check({ d20: 4, attr: 5, dc: 10, stealth: true }).band, "grace");
  assert.equal(C.d20Check({ d20: 2, attr: 5, dc: 10, stealth: true }).band, "grace");
  // margin -4 → 即使 stealth 也是 fail（dc11：total7 = 2+5）
  assert.equal(C.d20Check({ d20: 2, attr: 5, dc: 11, stealth: true }).band, "fail");
  // 非 stealth 词条（开锁/攀爬等）DC−1~−3 直接判失败
  assert.equal(C.d20Check({ d20: 4, attr: 5, dc: 10 }).band, "fail");
  assert.equal(C.d20Check({ d20: 2, attr: 5, dc: 10 }).band, "fail");
});

test("天然 1 / 天然 20 优先于结果带", () => {
  assert.equal(C.d20Check({ d20: 1, attr: 10, dc: 5 }).band, "nat1");
  assert.equal(C.d20Check({ d20: 20, attr: 1, dc: 30 }).band, "nat20");
});

test("修正汇总进总数", () => {
  const r = C.d20Check({ d20: 11, attr: 5, mods: [{ src: "耳机", v: 2 }, { src: "夜色", v: 2 }], dc: 15 });
  assert.equal(r.total, 20);
  assert.equal(r.band, "success");   // margin 5，单轨后无数值 crit
});

test("优势取高、劣势取低", () => {
  assert.equal(C.applyAdvDis(3, 17, "adv").d20, 17);
  assert.equal(C.applyAdvDis(3, 17, "dis").d20, 3);
  assert.equal(C.applyAdvDis(9, 9, "adv").d20, 9);
});

test("优势把 65% 成功率抬到约 88%（文档锚点）", () => {
  // 1d20+5 vs DC13 → 需骰 ≥8。单骰 65%；优势 = 1-(7/20)^2 = 87.75%
  let single = 0, adv = 0;
  for (let a = 1; a <= 20; a++) {
    if (a + 5 >= 13) single++;
    for (let b = 1; b <= 20; b++) {
      if (Math.max(a, b) + 5 >= 13) adv++;
    }
  }
  assert.equal(single / 20, 0.65);
  assert.equal(adv / 400, 0.8775);
});

test("连败保底：两次硬失败后 +3，否则 0", () => {
  assert.equal(C.pityBonus(0), 0);
  assert.equal(C.pityBonus(1), 0);
  assert.equal(C.pityBonus(2), 3);
  assert.equal(C.pityBonus(5), 3);
});

/* ---------- 心跳 ---------- */
test("心跳系数：胆2=1.24 / 胆5=1.0 / 胆8=0.76 / 胆10=0.6（浮点近似）", () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);
  near(C.heartCoeff(2), 1.24);
  near(C.heartCoeff(5), 1.0);
  near(C.heartCoeff(8), 0.76);
  near(C.heartCoeff(10), 0.6);
});

test("贴身刺激+10：胆3实收12、胆5实收10、胆8实收8", () => {
  assert.equal(C.heartDelta({ stim: 10, nrv: 3 }), 12);   // 1.16*10=11.6→12
  assert.equal(C.heartDelta({ stim: 10, nrv: 5 }), 10);
  assert.equal(C.heartDelta({ stim: 10, nrv: 8 }), 8);    // 0.76*10=7.6→8
});

test("开局基线：胆2=39 / 胆5=30 / 胆8=21，下限15", () => {
  // v0.8 主人定稿：基线统一 30（原随胆量浮动作废——胆高起点低＝进甜区反而慢）
  assert.equal(C.heartBaseline(2), 30);
  assert.equal(C.heartBaseline(5), 30);
  assert.equal(C.heartBaseline(8), 30);
  assert.equal(C.heartBaseline(10), 30);
});

test("缓息：胆2 触底 6 / 胆5 = 10 / 胆8 = 16", () => {
  assert.equal(C.breathGain(2), 6);
  assert.equal(C.breathGain(5), 10);
  assert.equal(C.breathGain(8), 16);
});

test("段末回落到基线为止，不穿底", () => {
  assert.equal(C.segHeartDrop(45, 5), 40);   // 基线 30 之上正常回落
  assert.equal(C.segHeartDrop(31, 5), 30);   // 回到基线 30 为止
  assert.equal(C.segHeartDrop(28, 5), 28);   // 低于基线不动
});

test("缓息下限 20", () => {
  assert.equal(C.breathFloor(25, 10), 20);
  assert.equal(C.breathFloor(15, 10), 15);   // 已低于下限不动
});

test("操作线：全员统一 70/90（v0.8 清账：老手/新手双轨废弃，胆量心跳奖励只走优势：胆量）", () => {
  assert.deepEqual(C.heartLines(62), { sweet: true, deform: 0, crash: false });
  assert.deepEqual(C.heartLines(75), { sweet: false, deform: -2, crash: false });
  assert.deepEqual(C.heartLines(95), { sweet: false, deform: -2, crash: true });
  // 线的边界：69 线下、70 恰过变形线、90 恰崩溃
  assert.deepEqual(C.heartLines(69), { sweet: false, deform: 0, crash: false });
  assert.deepEqual(C.heartLines(70), { sweet: false, deform: -2, crash: false });
  assert.deepEqual(C.heartLines(90), { sweet: false, deform: -2, crash: true });
});

test("甜区 40~65", () => {
  assert.equal(C.heartLines(40).sweet, true);
  assert.equal(C.heartLines(65).sweet, true);
  assert.equal(C.heartLines(39).sweet, false);
  assert.equal(C.heartLines(66).sweet, false);
});

test("心跳封顶 100（v0.6）", () => {
  assert.equal(C.heartCap(128), 100);
  assert.equal(C.heartCap(85), 85);
});

/* ---------- 体力段位税（v0.6） ---------- */
test("段位税：<40→−1 / 40~65→−2 / 66~89→−4 / 90+→−6（按当段峰值）", () => {
  assert.equal(C.staminaSegTax(39), -1);
  assert.equal(C.staminaSegTax(40), -2);
  assert.equal(C.staminaSegTax(65), -2);
  assert.equal(C.staminaSegTax(66), -4);
  assert.equal(C.staminaSegTax(89), -4);
  assert.equal(C.staminaSegTax(90), -6);
  assert.equal(C.staminaSegTax(110), -6);
});

/* ---------- 认脸两层制（v0.6 照面因果） ---------- */
test("照面记忆：潜行全绿/普通失败 0；勉强瞥见 +1；天然1/对抗锁定/冲突/对视 +2；社交每段 +2", () => {
  assert.equal(C.faceMemGain({ band: "success" }), 0);
  assert.equal(C.faceMemGain({ band: "fail" }), 0);          // 跟丢未照面
  assert.equal(C.faceMemGain({ band: "grace" }), 1);
  assert.equal(C.faceMemGain({ band: "nat1" }), 2);
  assert.equal(C.faceMemGain({ context: "locked" }), 2);
  assert.equal(C.faceMemGain({ context: "conflict" }), 2);
  assert.equal(C.faceMemGain({ context: "gaze" }), 2);
  assert.equal(C.faceMemGain({ context: "social" }), 2);
});

test("身份关联/识别判定（方案 A 平滑缓释乘算）：记忆为0恒为0；体态醒目与伪装；遮挡封顶", () => {
  // 铁律：记忆为 0 时哪怕天然 20 + 女警敏锐 8，识别值仍为 0，绝对对不上号
  const zeroMem = C.faceAssociate({ d20: 20, acuity: 8, memCells: 0, cover: 0 });
  assert.equal(zeroMem.total, 0);
  assert.equal(zeroMem.hit, false);

  // 浅养：高中生敏锐4 + 记忆5格(coeff=0.25)：d20=16 → floor((16+4)*0.25)=5 vs 15 → 没对上
  const shallow = C.faceAssociate({ d20: 16, acuity: 4, memCells: 5, cover: 5 });
  assert.equal(shallow.total, 5);
  assert.equal(shallow.hit, false);

  // 熟人锚点：女警敏锐8 + 记忆20格(打满1.0)：d20=8 → (8+8)*1.0=16 vs 15 → 对上号
  const familiar = C.faceAssociate({ d20: 8, acuity: 8, memCells: 20, cover: 5 });
  assert.equal(familiar.total, 16);
  assert.equal(familiar.dc, 15);
  assert.equal(familiar.hit, true);

  // 体态醒目与伪装修正：女警记忆12格(0.6)，d20=15，敏锐8
  // 醒目(+2) → floor((15+8+2)*0.6)=15 vs 15 → 对上号
  assert.equal(C.faceAssociate({ d20: 15, acuity: 8, memCells: 12, cover: 5, bodyMod: 2 }).hit, true);
  // 宽大风衣伪装(-2) → floor((15+8-2)*0.6)=12 vs 15 → 没对上
  assert.equal(C.faceAssociate({ d20: 15, acuity: 8, memCells: 12, cover: 5, bodyMod: -2 }).hit, false);

  // 遮挡封顶：cover=7 仍按 5 计 (DC 15)
  assert.equal(C.faceAssociate({ d20: 8, acuity: 8, memCells: 20, cover: 7 }).dc, 15);

  // 别名一致性
  assert.equal(C.identifyCheck, C.faceAssociate);
});

/* ---------- 她的警觉 ---------- */
test("警觉进账：中事8 × 同街0.8 × 夜0.9 × 敏锐5(1.0) = 6", () => {
  assert.equal(C.alertDelta({ threat: "medium", dist: "same", env: "night", acuity: 5 }), 6);
});

test("贴身大事故：20 × 1.8 × 1.0 × 1.0 = 36", () => {
  assert.equal(C.alertDelta({ threat: "major", dist: "touch", env: "day", acuity: 5 }), 36);
});

test("雨夜远端小事：3 × 0.5 × 0.7 × 1.0 = 1.05 → 1", () => {
  assert.equal(C.alertDelta({ threat: "minor", dist: "far", env: "rainNight", acuity: 5 }), 1);
});

test("眼熟档（接近度20~39）警觉增益 ×0.8：6 → 5", () => {
  assert.equal(C.alertDelta({ threat: "medium", dist: "same", env: "night", acuity: 5, familiar: true }), 5);
});

test("档位切分：0–20 毫无察觉；21/41/61/81 起逐档（主人 2026-10-19 定：先给一段完全无感的余量）", () => {
  assert.equal(C.alertStage(0), 0);
  assert.equal(C.alertStage(20), 0);
  assert.equal(C.alertStage(21), 1);
  assert.equal(C.alertStage(40), 1);
  assert.equal(C.alertStage(41), 2);
  assert.equal(C.alertStage(60), 2);
  assert.equal(C.alertStage(61), 3);
  assert.equal(C.alertStage(80), 3);
  assert.equal(C.alertStage(81), 4);
});

test("当晚开局警觉：深夜(23-01)基础20 + 戒心30÷5=6 → 26（不安档起步）", () => {
  assert.equal(C.nightStartAlert("e23_01", 30), 26);
  assert.equal(C.alertStage(C.nightStartAlert("e23_01", 30)), 1);
});

test("过夜沉淀：峰值70 → 戒心+5；峰值45 → +0", () => {
  assert.equal(C.warinessGain(70), 5);
  assert.equal(C.warinessGain(45), 0);
});

/* ---------- 冲突 ---------- */
test("战力基础：阿宅(2/4)=14、女警(6/7)=32、普通男(4/4)=20、普通女(3/4)=17", () => {
  assert.equal(C.conflictPower({ str: 2, agi: 4, dice: 0 }), 14);
  assert.equal(C.conflictPower({ str: 6, agi: 7, dice: 0 }), 32);
  assert.equal(C.conflictPower({ str: 4, agi: 4, dice: 0 }), 20);
  assert.equal(C.conflictPower({ str: 3, agi: 4, dice: 0 }), 17);
});

test("机会等级修正表：0级-15 / 3级0 / 5级+10", () => {
  assert.equal(C.conflictPower({ str: 4, agi: 4, dice: 0, opp: 0 }), 5);
  assert.equal(C.conflictPower({ str: 4, agi: 4, dice: 0, opp: 3 }), 20);
  assert.equal(C.conflictPower({ str: 4, agi: 4, dice: 0, opp: 5 }), 30);
});

test("文档锚点：阿宅对女警期望差 -18（稳定被反制档）", () => {
  const diff = C.conflictPower({ str: 2, agi: 4, dice: 0 }) - C.conflictPower({ str: 6, agi: 7, dice: 0 });
  assert.equal(diff, -18);
  assert.equal(C.conflictOutcome(diff), "overpowered");
});

test("文档锚点：普通男对普通女期望差 +3（纠缠档）", () => {
  const diff = 20 - 17;
  assert.equal(C.conflictOutcome(diff), "grind");
});

test("0级硬来的壮汉(8/5)对普通女：裸值 34-15=19 落纠缠；带期望骰(11) 30-17=13 落挣打得手", () => {
  const bare = C.conflictPower({ str: 8, agi: 5, dice: 0, opp: 0 });
  assert.equal(bare, 19);
  assert.equal(C.conflictOutcome(bare - 17), "grind");
  const withDice = C.conflictPower({ str: 8, agi: 5, dice: 11, opp: 0 });
  assert.equal(withDice - 17, 13);
  assert.equal(C.conflictOutcome(withDice - 17), "scuffle");
});

test("冲突修正：心跳>80 玩家-3；她的确认档+2；女警训练+5", () => {
  assert.equal(C.conflictModsSelf({ heart: 85 }), -3);
  assert.equal(C.conflictModsSelf({ heart: 70 }), 0);
  assert.equal(C.conflictModsHer({ alertStageNow: 3 }), 6);
  assert.equal(C.conflictModsHer({ alertStageNow: 3, training: 5 }), 11);
});

/* ---------- 追逐 ---------- */
test("格移差值带：+6→+2格 / +3→+1 / 0→僵持 / -3→-1 / -6→-2", () => {
  assert.equal(C.chaseStep(6), 2);
  assert.equal(C.chaseStep(3), 1);
  assert.equal(C.chaseStep(0), 0);
  assert.equal(C.chaseStep(-3), -1);
  assert.equal(C.chaseStep(-6), -2);
});

test("她的暗体力 = 体格×10", () => {
  assert.equal(C.herStamina(8), 80);
  assert.equal(C.herStamina(3), 30);
});

/* ---------- 终局心理层 ---------- */
test("僵住检定：1d20+胆量±标签 vs DC13（胆小60%僵死，胆大15%，女警95%撑住）", () => {
  // 胆小3（带[胆小-3]）：d20=12 → 12+3-3=12 < 13 僵住；d20=13 → 撑住
  assert.equal(C.freezeCheck({ d20: 12, nrv: 3 }).frozen, true);
  assert.equal(C.freezeCheck({ d20: 13, nrv: 3 }).frozen, false);

  // 胆大6（带[胆大+3]）：d20=3 → 3+6+3=12 僵住；d20=4 → 13 撑住
  assert.equal(C.freezeCheck({ d20: 3, nrv: 6 }).frozen, true);
  assert.equal(C.freezeCheck({ d20: 4, nrv: 6 }).frozen, false);

  // 女警9（+3 + 5训练）：d20=1 仍有 1+9+3+5=18 ≥ 13 撑住
  assert.equal(C.freezeCheck({ d20: 1, nrv: 9, training: 5 }).frozen, false);
});

test("迟疑轮数：<40 为0轮 / 40~69 为1轮 / ≥70 为2轮", () => {
  assert.equal(C.hesitationRounds(25), 0);
  assert.equal(C.hesitationRounds(45), 1);
  assert.equal(C.hesitationRounds(69), 1);
  assert.equal(C.hesitationRounds(70), 2);
  assert.equal(C.hesitationRounds(95), 2);
});


/* ── 优势双骰天然铁律（主人定稿 2026-10-16） ── */
test('applyAdvDis 优势铁律：有 20 必取 20（含 {1,20}），无 20 有 1 锁死取 1，否则取高', () => {
  assert.equal(C.applyAdvDis(14, 20, "adv").d20, 20);   // 普通 20
  assert.equal(C.applyAdvDis(1, 20, "adv").d20, 20);    // 特殊情况：{1,20} 大成功压倒大失败
  assert.equal(C.applyAdvDis(20, 1, "adv").d20, 20);    // 顺序无关
  assert.equal(C.applyAdvDis(1, 15, "adv").d20, 1);     // 无 20 有 1：大失败锁死，优势救不了
  assert.equal(C.applyAdvDis(5, 9, "adv").d20, 9);      // 无 1 无 20：正常取高
  assert.equal(C.applyAdvDis(7, 7, "adv").d20, 7);
  assert.deepEqual(C.applyAdvDis(3, 18, "adv").raw, [3, 18]);  // 两骰原始值照传
});

test('甜区上限参数化：[优势：胆量] 拓展 +5（65→70），默认不变', () => {
  assert.equal(C.heartLines(68).sweet, false);           // 默认 65 上限：68 出甜区
  assert.equal(C.heartLines(68, 70).sweet, true);        // 优势胆量：68 仍在甜区
  assert.equal(C.heartLines(70, 70).sweet, true);        // 顶边 70（贴变形线）
  assert.equal(C.heartLines(71, 70).sweet, false);
  assert.equal(C.staminaSegTax(68), -4);                    // 默认 68 已变形档
  assert.equal(C.staminaSegTax(68, 70), -2);                // 优势胆量：68 甜区档
  assert.equal(C.staminaSegTax(71, 70), -4);
});
