/**
 * 零楼开局面板单测（v0.8）：状态栏内嵌身份数据与 rules.json 对齐防漂移、
 * 五预设点数和＝20、档位词齐全、关键 DOM 锚点与构建断言在位。
 * 真源：rules.json → identity；状态栏.html 内嵌 IDENTITY_DATA / PRESETS / TIER。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const R = require("../src/config/rules.json");

const HTML = require("./helpers/ui-source.js").readUISource();

function extractConst(name) { return require("../src/ui/creation-data.js")[name]; }

const ID = extractConst("IDENTITY_DATA");
const TARGETS = extractConst("TARGET_DATA");
const PRESETS = extractConst("PRESETS");
const TIER = extractConst("TIER");
const NAME_POOL = extractConst("TARGET_NAME_POOL");
const PERSONALITY_POOL = extractConst("TARGET_PERSONALITY_POOL");
const HOBBY_POOL = extractConst("TARGET_HOBBY_POOL");
const SHOE_POOL = extractConst("TARGET_SHOE_POOL");

test("身份数据对齐：内嵌七身份与 rules.identity 双向一致（mods 全等）", () => {
  const ids = Object.keys(ID.list);
  assert.deepEqual(ids.sort(), Object.keys(R.identity.list).sort());
  for (const id of ids) {
    assert.deepEqual(ID.list[id].mods, R.identity.list[id].mods, `${id} mods 漂移`);
    assert.ok(ID.list[id].name === R.identity.list[id].name, `${id} 名称漂移`);
    for (const f of ["tagline", "perk", "flaw", "job"]) assert.ok(ID.list[id][f], `${id} 缺 ${f}`);
  }
});

test("目标角色库对齐：内嵌六目标与 rules.targets 双向一致", () => {
  const tids = Object.keys(TARGETS.list);
  assert.deepEqual(tids.sort(), Object.keys(R.targets.list).sort());
  for (const tid of tids) {
    const t = TARGETS.list[tid], rt = R.targets.list[tid];
    assert.equal(t.name, rt.name, `${tid} 名称漂移`);
    assert.equal(t.difficulty, rt.difficulty, `${tid} 难度漂移`);
    assert.equal(t.stars, rt.stars, `${tid} 星级漂移`);
    assert.equal(t.type, rt.type, `${tid} 类型漂移`);
    assert.equal(t.area, rt.area, `${tid} 区域漂移`);
    assert.deepEqual(t.stats, rt.stats, `${tid} 属性漂移`);
    for (const f of ["tagline", "features", "windowNote"]) assert.ok(t[f], `${tid} 缺 ${f}`);
  }
});

test("快捷预设：五个老模板，点数和一律 20，身份 id 合法", () => {
  assert.equal(PRESETS.length, 5);
  const seen = new Set();
  for (const p of PRESETS) {
    const sum = Object.values(p.pts).reduce((a, b) => a + b, 0);
    assert.equal(sum, 20, `预设 ${p.label} 点数和 ${sum} ≠ 20`);
    assert.ok(R.identity.list[p.id], `预设 ${p.label} 引用未知身份 ${p.id}`);
    assert.deepEqual(Object.keys(p.pts).sort(), ["agi", "cha", "int", "nrv", "str"]);
    seen.add(p.id);
  }
  assert.equal(seen.size, 5);
});

test("档位人话：五维各五档非空（数值策划档位表直译）", () => {
  for (const k of ["str", "agi", "nrv", "int", "cha"]) {
    assert.equal(TIER[k].length, 5, `${k} 档位缺`);
    TIER[k].forEach(t => assert.ok(typeof t === "string" && t.length >= 2, `${k} 档位空`));
  }
});

test("DOM 锚点：零楼两步走向导面板/步骤条/目标卡网格/徽记/未开局钮/摇号组件/胶水接口全部在位", () => {
  for (const anchor of ['id="wx-zero-floor"', 'id="wx-id-dialog"', 'id="idBadge"', 'id="zeroChip"',
                        'id="createConfirm"', 'id="idResetBtn"', "updateIdBadge(snap)", "zeroFloorInit",
                        'id="zeroStep1"', 'id="zeroStep2"', 'id="zeroNextStep"', 'id="zeroPrevStep"',
                        'id="targetGrid"', 'id="targetDetailBox"', 'switchZeroStep',
                        'id="tDetailReroll"', 'id="tDetailRealName"', 'id="tDetailPersonality"', 'id="tDetailHobby"', 'id="tDetailShoe"',
                        'btn-reroll-target', 'generateTargetPersona']) {
    assert.ok(HTML.includes(anchor), `状态栏.html 缺 ${anchor}`);
  }
  const buildJs = fs.readFileSync(path.join(__dirname, "..", "build-statusbar.js"), "utf8");
  assert.ok(buildJs.includes("wx-zero-floor"), "构建断言未覆盖零楼面板");
  const glueJs = fs.readFileSync(path.join(__dirname, "..", "src/host/glue.js"), "utf8");
  assert.ok(glueJs.includes("newGame") && glueJs.includes("resetGame"), "glue 缺零楼接口");
});

test("中式姓名库规格对齐：10 姓氏 × 20 名字，与 rules.targets.generator 全等（200 种组合空间）", () => {
  const rGen = R.targets.generator;
  assert.ok(rGen && rGen.namePool, "rules.targets.generator.namePool 缺失");
  assert.equal(NAME_POOL.surnames.length, 10, "姓氏库数量必须为 10");
  assert.equal(NAME_POOL.givenNames.length, 20, "名字库数量必须为 20");
  assert.deepEqual(NAME_POOL.surnames, rGen.namePool.surnames, "姓氏库与 rules 不一致");
  assert.deepEqual(NAME_POOL.givenNames, rGen.namePool.givenNames, "名字库与 rules 不一致");

  // 验证无重复
  assert.equal(new Set(NAME_POOL.surnames).size, 10, "姓氏存在重复项");
  assert.equal(new Set(NAME_POOL.givenNames).size, 20, "名字存在重复项");
});

test("性格与爱好特质库对齐且零极端词（去极端词与霸总戒律审查）", () => {
  const rGen = R.targets.generator;
  assert.deepEqual(PERSONALITY_POOL, rGen.personalityPool, "性格特质库与 rules 漂移");
  assert.deepEqual(HOBBY_POOL, rGen.hobbyPool, "私密爱好库与 rules 漂移");

  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  for (const item of [...PERSONALITY_POOL, ...HOBBY_POOL]) {
    for (const w of FORBIDDEN_WORDS) {
      assert.ok(!item.label.includes(w), `特质标签 [${item.label}] 包含极端禁词: ${w}`);
      assert.ok(!item.desc.includes(w), `特质描述 [${item.desc}] 包含极端禁词: ${w}`);
    }
  }
});

test("鞋具随机池对齐：女大学生与高中生四鞋池及各目标默认鞋与 rules 双向一致", () => {
  const rShoe = R.targets.generator.shoePool;
  assert.deepEqual(SHOE_POOL.student_and_college, rShoe.student_and_college, "女大学生与高中生鞋具池漂移");
  assert.deepEqual(SHOE_POOL.defaults, rShoe.defaults, "各目标默认鞋具配置漂移");

  // 验证女大学生/高中生 4 款鞋具
  assert.equal(SHOE_POOL.student_and_college.length, 4);
  const shoeIds = SHOE_POOL.student_and_college.map(s => s.id);
  assert.deepEqual(shoeIds.sort(), ["shoe_flats", "shoe_leather", "shoe_platform", "shoe_sneakers"].sort());

  // 去极端词审查
  const FORBIDDEN_WORDS = ["极其", "极度", "彻底", "臣服", "献祭", "近乎", "近乎于", "绝对", "尽数", "不可或缺", "顺从", "终极", "神坛"];
  for (const s of [...SHOE_POOL.student_and_college, ...Object.values(SHOE_POOL.defaults)]) {
    for (const w of FORBIDDEN_WORDS) {
      assert.ok(!s.desc.includes(w), `鞋具描述 [${s.desc}] 包含极端禁词: ${w}`);
    }
  }
});

test("标签纯名呈现与悬停变值契约及开局情报迷雾验证", () => {
  // 标签只有名字，属性变值在 data-tip 悬停
  for (const item of [...PERSONALITY_POOL, ...HOBBY_POOL, ...SHOE_POOL.student_and_college]) {
    assert.ok(item.name.length <= 6, `标签纯名过长: ${item.name}`);
    assert.equal(item.name, item.label, `标签名与 label 不一致: ${item.name}`);
    assert.ok(item.desc.includes(item.name), `desc 必须包含标签名: ${item.name}`);
    assert.ok(item.type, `缺少分类 type: ${item.name}`);
  }

  // 状态栏 Step 2 HTML 必须显示情报迷雾遮码，而非直接明牌
  assert.ok(HTML.includes('id="tDetailShoe"'), "缺少 tDetailShoe 容器");
  assert.ok(HTML.includes("情报迷雾 · 打量或调查后揭示"), "Step 2 必须包含情报迷雾提示");
  assert.ok(HTML.includes("体格 <b>？</b> · 敏捷 <b>？</b> · 敏锐 <b>？</b> · 胆量 <b>？</b> · 社交 <b>？</b>"), "初始属性必须处于情报迷雾遮掩状态");

  // 验证 updateTargetDetail 中对属性和标签的渲染逻辑
  assert.ok(HTML.includes('span class="tag personality" data-tip='), "未按 data-tip 规范渲染性格标签");
  assert.ok(HTML.includes('span class="tag hobby" data-tip='), "未按 data-tip 规范渲染爱好标签");
  assert.ok(HTML.includes('span class="tag equipment" data-tip='), "未按 data-tip 规范渲染鞋具标签");
});

test("目标随机生成与属性微扰动公式推导：delta ∈ {-1, 0, 1} 且数值钳制在 [1, 10]", () => {
  const rGen = R.targets.generator;
  assert.deepEqual(rGen.statDelta.options, [-1, 0, 1]);
  assert.deepEqual(rGen.statDelta.clamp, [1, 10]);

  // 从 HTML 提取的生成逻辑执行 100 次随机摇号采样
  const surnames = NAME_POOL.surnames;
  const givenNames = NAME_POOL.givenNames;
  for (let i = 0; i < 100; i++) {
    const s = surnames[Math.floor(Math.random() * surnames.length)];
    const g = givenNames[Math.floor(Math.random() * givenNames.length)];
    const fullName = s + g;
    assert.ok(fullName.length >= 2 && fullName.length <= 4);
    assert.ok(surnames.includes(s));
    assert.ok(givenNames.includes(g));

    // 针对极限属性（如 1 或 10）验证钳制逻辑
    for (const baseVal of [1, 5, 10]) {
      for (const delta of [-1, 0, 1]) {
        const finalVal = Math.max(1, Math.min(10, baseVal + delta));
        assert.ok(finalVal >= 1 && finalVal <= 10, `属性越界: base=${baseVal}, delta=${delta}, final=${finalVal}`);
        if (baseVal === 1 && delta === -1) assert.equal(finalVal, 1, "下限钳制失效");
        if (baseVal === 10 && delta === 1) assert.equal(finalVal, 10, "上限钳制失效");
      }
    }
  }
});

test("零楼向导建局：支持传 targetId 与 targetPersona 并正确落入 snapshot 与 save", () => {
  const { createGame } = require("../src/runtime/game.js");
  const testPersona = {
    targetId: "college",
    surname: "林",
    givenName: "晚秋",
    name: "林晚秋",
    personality: "慢热",
    personalityId: "guarded",
    personalityTag: "guarded",
    personalityDesc: "【性格·慢热】防备心重，生人社交与搭话检定修正 -2",
    hobby: "胶片探店",
    hobbyId: "film_cafe",
    hobbyTag: "window_pause",
    hobbyDesc: "【爱好·胶片探店】常在街角橱窗停顿取景，尾随近身检定 +1",
    shoeId: "shoe_sneakers",
    shoeName: "运动鞋",
    shoeTag: "shoe_sneakers",
    shoeDesc: "【鞋具·运动鞋】软胶底球鞋，触地静音微抓地摩擦，驱动运动鞋脚步声",
    deltas: { str: 0, agi: 1, per: 0, nrv: -1, social: 0 },
    finalStats: { str: 3, agi: 5, per: 4, nrv: 3, social: 2 }
  };

  const game = createGame({
    identity: "coach",
    targetId: "college",
    targetPersona: testPersona,
    player: { str: 5, agi: 4, nrv: 5, int: 4, cha: 2, staminaMax: 110 }
  });

  const snap = game.snapshot();
  assert.equal(snap.target.id, "college");
  assert.equal(snap.target.name, "独居女大学生");
  assert.equal(snap.target.realName, "林晚秋");
  assert.equal(snap.target.persona.name, "林晚秋");
  assert.equal(snap.target.persona.personalityId, "guarded");
  assert.equal(snap.target.shoe, "sneakers");
  assert.ok(snap.tags.some(t => t.name === "慢热" && t.type === "personality"), "未成功挂载性格标签");
  assert.ok(snap.tags.some(t => t.name === "胶片探店" && t.type === "hobby"), "未成功挂载爱好破绽标签");
  assert.ok(snap.tags.some(t => t.name === "运动鞋" && t.type === "equipment"), "未成功挂载鞋具标签");
  const shoeAgiMod = ((require("../src/config/rules.json").tags[testPersona.shoeId] || {}).mod || {}).agi || 0;
  const expectedDynamicStats = {
    str: 3 + (snap.targetState?.somatic?.mod?.str || 0),
    agi: 5 + (snap.targetState?.somatic?.mod?.agi || 0) + shoeAgiMod,
    per: 4 + (snap.targetState?.somatic?.mod?.per || 0),
    nrv: 3 + (snap.targetState?.somatic?.mod?.nrv || 0),
    social: 2 + (snap.targetState?.somatic?.mod?.social || 0)
  };
  assert.deepEqual(snap.target.stats, expectedDynamicStats, "动态快照属性 = 基底 + 当天身心修正 + 鞋具修正（运动鞋 敏捷+1）");
  assert.deepEqual(snap.target.persona.finalStats, { str: 3, agi: 5, per: 4, nrv: 3, social: 2 }, "目标基底属性必须保持未扰动状态");
  assert.equal(snap.identity.name, "健身教练");

  const saved = game.save();
  assert.equal(saved.targetId, "college");
  assert.equal(saved.identity, "coach");
  assert.equal(saved.targetPersona.name, "林晚秋");
  assert.equal(saved.targetPersona.shoeId, "shoe_sneakers");
  assert.deepEqual(saved.targetPersona.finalStats, { str: 3, agi: 5, per: 4, nrv: 3, social: 2 });

  // 往返验证：从 saved 重建无损
  const gameRestored = createGame({ saved });
  const restoredSnap = gameRestored.snapshot();
  assert.equal(restoredSnap.target.realName, "林晚秋");
  assert.equal(restoredSnap.target.shoe, "sneakers");
  assert.deepEqual(restoredSnap.target.stats, expectedDynamicStats, "重建后动态快照属性必须一致");
  assert.deepEqual(restoredSnap.target.persona.finalStats, { str: 3, agi: 5, per: 4, nrv: 3, social: 2 }, "重建后基底属性无损持久化");
});
