/**
 * M4-1 拦截-结算-注入-放行 全链单测（mock 酒馆助手环境，主人终验前先跑绿）：
 * MESSAGE_SENT 同步结算→injectPrompts 回执→放行；GENERATION_ENDED 回执相（零账目）；
 * swipe 不重掷（同楼同数）；自动掷设置退回旧全流程；斜杠命令与纯叙事楼不拦不结算。
 * 真机验证清单交主人：发送后 AI 等不等回执、回复与回执一致性、swipe 同数、设置开关。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { startGlue } = require("../src/host/glue.js");
const { createGame } = require("../src/runtime/game.js");

const FLUSH = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

function makeMockTavern() {
  const store = {}, listeners = {}, injections = [];
  let lastRole = "user";
  let lastMsg = "", genCalls = 0, stopCalls = 0, posted = [];
  const G = globalThis;
  G.insertOrAssignVariables = async (obj) => Object.assign(store, obj);
  G.getVariables = async () => JSON.parse(JSON.stringify(store));
  G.eventOn = (name, fn) => { (listeners[name] = listeners[name] || []).push(fn); };
  G.tavern_events = { MESSAGE_SENT: "MESSAGE_SENT", GENERATION_STARTED: "GENERATION_STARTED",
                      GENERATION_ENDED: "GENERATION_ENDED", MESSAGE_SWIPED: "MESSAGE_SWIPED" };
  G.getChatMessages = async (range) => [{ message_id: 1, role: lastRole, message: lastMsg }];
  G.getCurrentCharacterName = async () => "尾行1";
  // 胶囊出口：主人定「动作只认胶囊点选」，这里模拟玩家点选（未点就是空数组＝纯叙事）
  const sb = { capsules: [], consumeActiveActions() { const c = sb.capsules; sb.capsules = []; return c; } };
  G.WxStatusbar = sb;
  G.injectPrompts = (prompts, opts) => { injections.push(...prompts.map(p => ({ ...p, opts }))); return { uninject() {} }; };
  G.uninjectPrompts = () => {};
  G.generate = async () => { genCalls++; return "ok"; };
  G.stopAllGeneration = () => { stopCalls++; return true; };
  return {
    store, injections, sb,
    get genCalls() { return genCalls; }, get stopCalls() { return stopCalls; },
    emit: (name) => { if (name === "MESSAGE_SENT") lastRole = "user"; if (name === "GENERATION_ENDED") lastRole = "assistant"; for (const fn of listeners[name] || []) fn(); },
    setLast: (t) => { lastMsg = t; },
    cleanup() { for (const k of ["insertOrAssignVariables","getVariables","eventOn","tavern_events","getChatMessages",
                                 "getCurrentCharacterName","injectPrompts","uninjectPrompts","generate","stopAllGeneration","WxStatusbar"]) delete G[k];
                 delete G.WxGlue; },
  };
}

test("M4-1 全链：发送→结算→注入回执→放行；回执相零账目；swipe 同数", async () => {
  const mock = makeMockTavern();
  // 固定盐开局（wx_init 带会话盐→全程确定性）
  mock.store.wx_init = { sessionSalt: "ab".repeat(16) };
  const r0 = await startGlue();
  assert.equal(r0.ok, true);

  // ① 玩家点选胶囊（跟缀 + 拍照）→ 拦截结算 → 注入回执
  mock.sb.capsules = [
    { id: "follow", name: "跟缀", args: { dist: "same" } },
    { id: "photo", name: "拍照", args: {} }
  ];
  mock.setLast("保持二十步，顺手拍一张。");
  mock.emit("MESSAGE_SENT");
  await FLUSH();
  assert.ok(mock.injections.length >= 1, "应有回执注入");
  const receipt = mock.injections[mock.injections.length - 1];
  assert.equal(receipt.id, "wx_receipt");
  assert.ok(receipt.content.includes("跟缀"), "回执应含跟缀");
  assert.ok(receipt.content.includes("拍照"), "回执应含拍照");
  assert.ok(receipt.content.includes("唯一数值真源"), "回执应带纪律头");
  assert.ok(mock.store.wx_save && mock.store.wx_save.v === 2, "存档应落变量");
  assert.equal(typeof globalThis.WxGlue.getSyncDiagnostics, "function");
  assert.ok(globalThis.WxGlue.getSyncDiagnostics().events.some(e => e.stage === "persist.done"),
    "胶水必须接入独立的聊天存档同步模块");
  const heartAfterSettle = mock.store.wx_snap.player.heart;
  const floor1 = mock.store.wx_snap.floor ?? mock.store.wx_save.floor;
  assert.ok(heartAfterSettle !== undefined);

  // ② 生成结束（LLM 回复）→ 回执相：模式/票据生效，账目纹丝不动
  mock.setLast("<模式>接触</模式>她放慢了脚步。<动作>跟缀｜同街</动作>她回头扫了一眼。");
  mock.emit("GENERATION_ENDED");
  await FLUSH();
  assert.equal(mock.store.wx_snap.mode, "contact", "模式应切换");
  assert.equal(mock.store.wx_snap.player.heart, heartAfterSettle, "回执相零账目——LLM 回复里的动作标签不得重复结算");

  // ③ swipe：换一版正文 → 数字一个不动
  mock.emit("MESSAGE_SWIPED");
  mock.setLast("她完全没有察觉，继续往前走。（另一版写法）");
  mock.emit("GENERATION_ENDED");
  await FLUSH();
  assert.equal(mock.store.wx_snap.player.heart, heartAfterSettle, "swipe 不重掷——心跳必须逐位一致");
  mock.cleanup();
});

test("M4-1 自动掷设置：退回旧全流程（LLM 动作标签结算，无注入）", async () => {
  const mock = makeMockTavern();
  mock.store.wx_init = { sessionSalt: "cd".repeat(16) };
  mock.store.wx_conf = { autoSettle: true };
  await startGlue();
  const injBefore = mock.injections.length;
  mock.setLast("夜色里我缀了上去。");
  mock.emit("MESSAGE_SENT");
  await FLUSH();
  assert.equal(mock.injections.length, injBefore, "自动掷模式不拦截不注入");
  mock.setLast("<动作>跟缀｜同街</动作>她在便利店停下。");
  mock.emit("GENERATION_ENDED");
  await FLUSH();
  assert.ok(mock.store.wx_snap, "旧流程照常结算落快照");
  mock.cleanup();
});

test("M4-1 边界：斜杠命令不拦；纯叙事楼注入「无机械动作」", async () => {
  const mock = makeMockTavern();
  mock.store.wx_init = { sessionSalt: "ef".repeat(16) };
  await startGlue();
  mock.setLast("/roll 1d20");
  mock.emit("MESSAGE_SENT");
  await FLUSH();
  assert.equal(mock.injections.length, 0, "斜杠命令不拦");
  mock.setLast("我靠在墙边，看着她走远，什么也没做。");
  mock.emit("MESSAGE_SENT");
  await FLUSH();
  const receipt = mock.injections[mock.injections.length - 1];
  assert.ok(receipt.content.includes("未点选任何动作胶囊"), "空胶囊回执应声明纯叙事");
  assert.ok(receipt.content.includes("纯叙事推进"), "纯叙事楼回执应声明");
  mock.cleanup();
});

test("引擎拆相：translateInput 分句归一（上限 3、去重）；processReply 剥动作标签", () => {
  const g = createGame({ sessionSalt: "00".repeat(16) });
  const q = g.translateInput("跟缀 保持二十步，然后拍照，再贴门听，最后翻找");
  assert.ok(q.length <= 3, "队列上限 3");
  assert.equal(q[0].id, "follow");
  assert.ok(q.some(x => x.id === "photo"), "应含拍照");
  assert.ok(!q.some((x, i) => q.findIndex(y => y.id === x.id) !== i), "同楼去重");
  const r = g.settleInput("跟缀 保持二十步", { allowTextFallback: true });   // 引擎侧后备（GM/工具专用）
  assert.ok(r.package.actions.length >= 1);
  // 玩家侧默认关闭后备：同样的文本不产生任何动作
  const rPlain = g.settleInput("跟缀 保持二十步");
  assert.equal(rPlain.package.actions.length, 0, "手打文本不得产生动作");
  assert.equal(rPlain.package.narrativeOnly, true);
  const h1 = g.ledger.get("heart");
  const r2 = g.processReply("<动作>跟缀｜贴身</动作>正文怎么写都好。<模式>潜行</模式>");
  assert.equal(r2.actions.length, 0, "回执相忽略动作标签");
  assert.equal(g.ledger.get("heart"), h1, "回执相不动账");
  assert.equal(g.mode, "stealth");
});

test("M4-2 三翼战术 Canvas 判定台：DOM 锚点在位、3D 骰体几何与暗账揭示数据流", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(path.join(__dirname, "..", "状态栏.html"), "utf8");

  // DOM 锚点完整性
  const requiredAnchors = [
    'id="wx-settle-dialog"',
    'id="settleConsole"',
    'id="settleActBadge"',
    'id="settleModsStack"',
    'id="settleEkgHeart"',
    'id="settleHudStatus"',
    'id="settleDieShadow"',
    'id="settleDieCanvas"',
    'id="settleFlashOverlay"',
    'id="settleVerdictBadge"',
    'id="settleMathLine"',
    'id="settleLedgerWrap"',
    'id="settleDarkRevealCard"',
    'id="settleQueueHistory"',
    'id="settleAck"'
  ];
  for (const anchor of requiredAnchors) {
    assert.ok(html.includes(anchor), `状态栏缺少三翼判定台锚点: ${anchor}`);
  }

  // 结算包数据契约验证
  const g = createGame({ sessionSalt: "42".repeat(16) });
  const r = g.settleInput("跟缀 保持二十步", { actions: [{ id: "follow", name: "跟缀", args: { dist: "same" } }] });
  const act = r.package.actions[0];
  assert.ok(act, "必须产生结算动作");
  assert.ok(act.attr && act.attr.name, "动作包必须包含玩家检定主属性");
  assert.ok(act.d20 >= 1 && act.d20 <= 20, "真值 d20 必须在 [1, 20] 区间");
  assert.ok(act.band, "动作包必须包含判定档位");
  assert.ok(r.package.account, "结算包必须包含整轮即时账目");
});

test("M4-3 目标世界书动态常驻与互斥同步（仿仙姝堕 2.0 规范）", async () => {
  const { syncTargetWorldbook } = require("../src/host/glue.js");
  let currentEntries = [
    { name: "【目标档案】晚自习女高中生", enabled: false, constant: false },
    { name: "【目标档案】外企职场女性", enabled: true, constant: true },
    { name: "【中控裁判宪法】单一真源与零代打准则", enabled: true, constant: true }
  ];
  let replacedBook = null;
  let replacedEntries = null;

  globalThis.TavernHelper = {
    getCharWorldbookNames: async () => ({ primary: "尾行·中控世界书" }),
    getWorldbook: async (name) => (name === "尾行·中控世界书" ? currentEntries : []),
    replaceWorldbook: async (name, newEntries) => {
      replacedBook = name;
      currentEntries = newEntries;
      replacedEntries = newEntries;
    }
  };

  // 1. 同步为高中生 (student)
  const resStudent = await syncTargetWorldbook("student");
  assert.equal(resStudent.ok, true);
  assert.equal(replacedBook, "尾行·中控世界书");
  const studentEntry = replacedEntries.find(e => e.name.includes("女高中生"));
  const olEntry = replacedEntries.find(e => e.name.includes("外企职场女性"));
  const constEntry = replacedEntries.find(e => e.name.includes("裁判宪法"));

  assert.equal(studentEntry.enabled, true, "高中生条目应被启用");
  assert.equal(studentEntry.constant, true, "高中生条目应设为常驻");
  assert.equal(olEntry.enabled, false, "OL条目应被禁用");
  assert.equal(olEntry.constant, false, "OL条目应取消常驻");
  assert.equal(constEntry.enabled, true, "非目标档案条目保持原状");

  // 2. 切换回职场女性 (ol)
  const resOl = await syncTargetWorldbook("ol");
  assert.equal(resOl.ok, true);
  const studentEntry2 = replacedEntries.find(e => e.name.includes("女高中生"));
  const olEntry2 = replacedEntries.find(e => e.name.includes("外企职场女性"));
  assert.equal(studentEntry2.enabled, false, "高中生条目应被禁用");
  assert.equal(olEntry2.enabled, true, "OL条目应被启用并常驻");
  assert.equal(olEntry2.constant, true, "OL条目应设为常驻");

  delete globalThis.TavernHelper;
});

test("M4-4 胶囊动作展示名 label 传递与直通解耦（跟缀与逼近名副其实）", () => {
  const g = createGame({ sessionSalt: "test_label_decouple" });
  const r = g.settleInput("快步跟上缩短距离", {
    actions: [{ id: "follow", name: "逼近 (身后)", args: { dist: "close" } }]
  });
  const act = r.package.actions[0];
  assert.equal(act.name, "跟缀", "底座动作标准名应为跟缀");
  assert.equal(act.label, "逼近 (身后)", "UI动作展示名应保留为逼近 (身后)");
});


