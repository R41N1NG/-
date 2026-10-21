/**
 * M4-2 行动胶囊与输入引导体系单测：
 * 1. 状态栏行动胶囊栏与二级抽屉 DOM 结构完整性；
 * 2. 情境自适应四胶囊（不同距离、门前场景、接触场景）精准匹配；
 * 3. 姿态指示、选定消费与纯叙事切换（consumeActiveActions）；
 * 4. 输入占位符（Placeholder）对门槛与高危动作的尝试性引导；
 * 5. 失败判定转折断点注入文本协议（Dramatic Complication）。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(__dirname, "..", "状态栏.html");
const html = require("./helpers/ui-source.js").readUISource();

test("DOM 锚点：行动胶囊栏、姿态徽标、胶囊容器、更多按钮与二级抽屉在位", () => {
  assert.ok(html.includes('id="wxCapsuleBar"'), "应有 wxCapsuleBar 容器");
  assert.ok(html.includes('id="wxPostureBadge"'), "应有 wxPostureBadge 姿态徽标");
  assert.ok(html.includes('id="wxChipsWrap"'), "应有 wxChipsWrap 胶囊容器");
  assert.ok(html.includes('id="wxMoreActionsBtn"'), "应有 wxMoreActionsBtn 更多按钮");
  assert.ok(html.includes('id="wxActionDrawer"'), "应有 wxActionDrawer 二级抽屉");
  assert.ok(html.includes('id="wxActionDrawerBody"'), "应有 wxActionDrawerBody 抽屉容器");
  assert.ok(html.includes('>确认结果</button>'), "结算按钮应显示为【确认结果】而非旧【认】");
});

test("胶囊自适应逻辑：同街场景产出 4 胶囊且默认姿态为跟缀", () => {
  // 提取 html 内 getDynamicCapsules 函数进行逻辑测试
  const { getDynamicCapsules } = require("../src/ui/action-options.js");

  // 同街潜行
  const samePlan = getDynamicCapsules({ mode: "stealth", dist: "same", place: "street_b" });
  assert.equal(samePlan.default.id, "follow");
  assert.equal(samePlan.chips.length, 4);
  assert.ok(samePlan.chips.some(c => c.id === "follow" && c.args.dist === "close"));
  assert.ok(samePlan.chips.some(c => c.id === "hide"));
  assert.ok(samePlan.chips.some(c => c.id === "photo"));

  // 门前场景（无默认姿态，必由玩家敲定门槛）
  const doorPlan = getDynamicCapsules({ mode: "stealth", dist: "same", place: "unit_stairs_b" });
  assert.equal(doorPlan.default, null, "门前门槛必须由玩家敲定，无自动跟缀");
  assert.equal(doorPlan.chips.length, 4);
  assert.ok(doorPlan.chips.some(c => c.id === "try_handle"));
  assert.ok(doorPlan.chips.some(c => c.id === "lockpick"));
  assert.ok(doorPlan.chips.some(c => c.id === "pry"));
  assert.ok(doorPlan.chips.some(c => c.id === "door_listen"));

  // 逼近身后场景（出现红色高危下手胶囊）
  const closePlan = getDynamicCapsules({ mode: "stealth", dist: "close", place: "alley_b" });
  assert.equal(closePlan.chips.length, 4);
  const strikeChip = closePlan.chips.find(c => c.id === "strike");
  assert.ok(strikeChip, "身后应提供下手偷袭胶囊");
  assert.equal(strikeChip.danger, true, "下手胶囊应带高危属性");

  // 接触场景（出现搭话、寒暄、误导归因）
  const contactPlan = getDynamicCapsules({ mode: "contact", dist: "same", place: "convenience_store_b" });
  assert.equal(contactPlan.chips.length, 4);
  assert.ok(contactPlan.chips.some(c => c.id === "chat"));
  assert.ok(contactPlan.chips.some(c => c.id === "greet"));
  assert.ok(contactPlan.chips.some(c => c.id === "misdirection"));
});

test("回执断点原则：检定失败时注入戏剧性转折指令", () => {
  const { createGame } = require("../src/runtime/game.js");

  // 构造 BAND_CN 与 ACC_CN 模拟环境
  const BAND_CN = { crit_success: "大成功", success: "成功", grace: "勉强", fail: "失败", crit_fail: "大失败" };
  const ACC_CN = { stamina: "体力", heart: "心跳", alert: "警觉", pi: "情报", proximity: "接近度", cash: "现金" };
  const { receiptText } = require("../src/host/receipt.js");

  // 模拟成功结算包
  const successRes = {
    floor: 1,
    package: {
      actions: [{ name: "跟缀", d20: 15, total: 17, dc: 13, band: "success", mods: [] }],
      account: { heart: 5 },
      seg: null,
      logs: [],
      narrativeOnly: false
    }
  };
  const successText = receiptText(successRes, BAND_CN, ACC_CN);
  assert.ok(!successText.includes("【叙事断点原则】"), "成功时不应触发转折断点");

  // 模拟失败结算包（开锁失败）
  const failRes = {
    floor: 2,
    package: {
      actions: [{ name: "挠钩开锁", d20: 3, total: 5, dc: 14, band: "fail", mods: [] }],
      account: null,
      seg: null,
      logs: [],
      narrativeOnly: false
    }
  };
  const failText = receiptText(failRes, BAND_CN, ACC_CN);
  assert.ok(failText.includes("【叙事断点原则】"), "失败时必须触发叙事断点原则");
  assert.ok(failText.includes("挠钩开锁 失败/意外"), "断点应标明具体翻车动作名");
  assert.ok(failText.includes("主观预想与动作尝试"), "断点应强调玩家内容仅为主观预想");
});

test("中控前置结算兼容 opts.actions（胶囊直达模式）", () => {
  const { createGame } = require("../src/runtime/game.js");
  const g = createGame({ sessionSalt: "capsule-direct-test" });

  // 玩家正文为纯描写叙事，动作由胶囊传入
  const r = g.settleInput("我屏气凝神，用余光暗中打量着路灯下的人影。", {
    actions: [{ id: "photo", name: "拍照", args: {} }]
  });

  assert.equal(r.package.actions.length, 1);
  assert.equal(r.package.actions[0].name, "拍照");
  assert.equal(r.package.narrativeOnly, false);
});

test("胶囊直达模式对不同 UI 按钮名称与自然语言输入完全解耦", () => {
  const { createGame } = require("../src/runtime/game.js");
  const g = createGame({ sessionSalt: "capsule-decouple-test", dist: "touch" });

  // 1. 胶囊上的展示名为 UI 文本（如“拍照取证”），输入框打“拍照来”
  const r1 = g.settleInput("拍照来", {
    actions: [{ id: "photo", name: "拍照取证", args: {} }]
  });
  assert.equal(r1.package.actions.length, 1);
  assert.equal(r1.package.actions[0].name, "拍照");
  assert.equal(r1.package.narrativeOnly, false);

  // 2. 胶囊为细致翻找，输入框为纯文学描写
  const r2 = g.settleInput("我戴上手套，小心翼翼地翻弄着桌上的散乱文件与发票", {
    actions: [{ id: "ransack", name: "细致翻找", args: {} }]
  });
  assert.equal(r2.package.actions.length, 1);
  assert.equal(r2.package.actions[0].name, "翻找");
  assert.equal(r2.package.narrativeOnly, false);
});

test("回执动态连线：生活包 targetState 与警觉反应正确注入 receiptText 白描指令", () => {
  const { createGame } = require("../src/runtime/game.js");

  const BAND_CN = { crit_success: "大成功", success: "成功", grace: "勉强", fail: "失败", crit_fail: "大失败" };
  const ACC_CN = { stamina: "体力", heart: "心跳", alert: "警觉", pi: "情报", proximity: "接近度", cash: "现金" };
  const { receiptText } = require("../src/host/receipt.js");

  // 1. 初始化高中生（student）开局，装载常规晚自习动线
  const g = createGame({
    targetId: "student",
    route: {
      id: "workday_evening",
      note: "周内晚自习常规放学路线（前半段结伴，后半段独行）",
      prompt: "白描晚自习放学后的校门人潮与深巷暮色",
      nodes: ["school_gate_b", "school_bus_terminal_b", "store_24h_b", "unit_stairs_b"],
      known: [1, 1, 1, 1],
      here: 0
    },
    sessionSalt: "test_receipt_link_001"
  });

  // 执行首楼跟缀
  const r1 = g.settleInput("跟在后面保持距离", {
    actions: [{ id: "follow", name: "跟缀", args: {} }]
  });

  const txt1 = receiptText(r1, BAND_CN, ACC_CN);
  assert.ok(txt1.includes("【目标当前态势与行为焦点（白描约束）】"), "应输出态势总标头");
  assert.ok(txt1.includes("动线情境：[学校正门]"), "应包含当前地点名称");
  assert.ok(txt1.includes("当前着装：[制式校服]"), "应包含平日固定制服名");
  assert.ok(txt1.includes("情绪身心："), "应包含身心状态与理由");
  assert.ok(txt1.includes("双手焦点：[整理书包]"), "首节点校门应触发整理书包破绽");
  assert.ok(txt1.includes("⚠️【破绽暴露：低感知翻找态"), "破绽态应带明晰白描指令");

  // 2. 无检定动作（如贴近 approach / 缓息 breath）不应打印 1d20(undefined)
  const r2 = g.settleInput("轻缓呼吸平复心跳", {
    actions: [{ id: "breath", name: "缓息", args: {} }]
  });
  const txt2 = receiptText(r2, BAND_CN, ACC_CN);
  assert.ok(!txt2.includes("1d20(undefined)"), "无骰动作绝不可打印 1d20(undefined)");
  assert.ok(txt2.includes("缓息："), "应打印缓息文本");

  // 3. 目标警觉跃迁时（如警觉达到 stage 2，门槛 40+），应注入生活包 flavor 反应白描指令
  g.ledger.commit({ alert: 45 }); // 警觉提至 45（起疑 stage 2）
  const r3 = g.settleInput("靠近观察", {
    actions: [{ id: "approach", name: "贴近", args: {} }]
  });
  const txt3 = receiptText(r3, BAND_CN, ACC_CN);
  assert.ok(txt3.includes("警觉反应：⚠️ 目标放慢脚步，频频侧目回顾！"), "应带出警觉警示");
  assert.ok(txt3.includes("借助街边自行车反光镜的倒影偷瞥一眼身后"), "应融入高中生独有的 flavor 动作白描");
});

