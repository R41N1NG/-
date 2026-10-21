/**
 * 申报解析器单测：四类标签、容错、四锁（词表锁/限次锁在此层，依据锁接口）、诊断计数。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseFloor, verifyEvidence, ACTION_QUEUE_MAX } = require("../src/runtime/parse.js");

const F = (s) => parseFloor(s);

test("四类标签合法解析", () => {
  const r = F(`你收着步子缀进人流。<动作>跟缀｜身后</动作><事实>#041</事实><模式>接触</模式><谎言>自称快递员｜她｜楼下｜高</谎言>`);
  const types = r.tags.map(t => t.type);
  assert.deepEqual(types.sort(), ["action", "fact", "lie", "mode"]);
  const act = r.tags.find(t => t.type === "action");
  assert.equal(act.id, "follow");
  assert.equal(act.args.dist, "close");
  const fact = r.tags.find(t => t.type === "fact");
  assert.equal(fact.ticket, 41);
  const lie = r.tags.find(t => t.type === "lie");
  assert.deepEqual(lie, { type: "lie", claim: "自称快递员", to: "她", scene: "楼下", verifiability: "high" });
  const mode = r.tags.find(t => t.type === "mode");
  assert.equal(mode.mode, "contact");
});

test("标签剥离：cleanText 不残留任何标签", () => {
  const r = F(`你贴近了些。<动作>贴近｜身后</动作>灯很暗。<模式>潜行</模式>`);
  assert.equal(r.cleanText, `你贴近了些。灯很暗。`);
  assert.ok(!r.cleanText.includes("<"));
});

test("无参动作：单段动作标签合法", () => {
  const r = F(`<动作>拍照</动作>`);
  assert.equal(r.tags[0].id, "photo");
});

test("半角竖线宽容解析并记诊断", () => {
  const r = F(`<动作>跟缀|贴身</动作>`);
  assert.equal(r.tags[0].args.dist, "touch");
  assert.equal(r.diag.halfWidthPipe, 1);
});

test("词表锁：未知动作丢弃＋记入诊断，不锁流程", () => {
  const r = F(`<动作>施法火球术</动作><动作>拍照</动作>`);
  assert.equal(r.tags.length, 1);
  assert.equal(r.tags[0].id, "photo");
  assert.equal(r.diag.parseErrors, 1);
  assert.deepEqual(r.diag.unknownAction, ["施法火球术"]);
});

test("限次锁：动作队列上限 3，第 4 个起截断＋诊断", () => {
  const many = [1, 2, 3, 4, 5].map(i => `<动作>拍照</动作>`).join("");
  const r = F(many);
  assert.equal(r.tags.length, ACTION_QUEUE_MAX);
  assert.equal(r.diag.actionOverflow, 2);
});

test("限次锁：模式切换一楼一次，第二次丢弃＋诊断", () => {
  const r = F(`<模式>潜行</模式><模式>接触</模式>`);
  assert.equal(r.tags.length, 1);
  assert.equal(r.tags[0].mode, "stealth");
  assert.equal(r.diag.modeDup, 1);
});

test("事实票据：#数字 格式合法，其余丢弃＋诊断", () => {
  const ok = F(`<事实>#1024</事实>`);
  assert.equal(ok.tags[0].ticket, 1024);
  const bad = F(`<事实>她好像起疑了</事实>`);
  assert.equal(bad.tags.length, 0);
  assert.equal(bad.diag.factBad, 1);
});

test("谎言四段校验与可验证度归一（中→mid）", () => {
  const ok = F(`<谎言>路过而已｜店员｜便利店｜中</谎言>`);
  assert.equal(ok.tags[0].verifiability, "mid");
  const short = F(`<谎言>路过而已｜店员</谎言>`);
  assert.equal(short.tags.length, 0);
  assert.equal(short.diag.lieBad, 1);
  const badV = F(`<谎言>路过而已｜店员｜便利店｜随便</谎言>`);
  assert.equal(badV.tags.length, 0);
});

test("模式值容错：中文/英文都收，非法值丢弃", () => {
  assert.equal(F(`<模式>接触</模式>`).tags[0].mode, "contact");
  assert.equal(F(`<模式>stealth</模式>`).tags[0].mode, "stealth");
  assert.equal(F(`<模式>飞升</模式>`).tags.length, 0);
  assert.equal(F(`<模式>飞升</模式>`).diag.modeBad, 1);
});

test("依据锁接口：claim 必须是净正文的逐字子串", () => {
  const clean = "你收着步子缀进人流，便利店的灯光从她肩上滑过去。";
  assert.equal(verifyEvidence(clean, "缀进人流"), true);
  assert.equal(verifyEvidence(clean, "你拔剑砍向守卫"), false);
});

test("空文本与垃圾输入安全", () => {
  const r = F("");
  assert.equal(r.tags.length, 0);
  const r2 = F("<<<>><动作>没有闭合");
  assert.equal(r2.tags.length, 0);
});

test("残余诊断零噪音：干净文本全零", () => {
  const r = F(`她提着便利店的袋子走进小区。<动作>跟缀｜同街</动作>`);
  assert.equal(r.tags[0].id, "follow");
  assert.equal(r.tags[0].args.dist, "same");
  assert.deepEqual(r.diag, { parseErrors: 0, halfWidthPipe: 0, actionOverflow: 0, degradedSamples: [],
                             factBad: 0, lieBad: 0, modeBad: 0, modeDup: 0, unknownAction: [] });
});
