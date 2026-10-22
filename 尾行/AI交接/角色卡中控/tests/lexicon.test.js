/**
 * 词表引擎单测：加载校验（id 唯一 / 别名不冲突 / check 有位 / 模式合法）
 * 与归一三段式（精确 → 别名最长 → 降级）。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadLexicon, normalize } = require("../src/runtime/lexicon.js");
const RAW = require("../src/config/lexicon.json");
const R = require("../src/config/rules.json");

let LEX;
test.before(() => { LEX = loadLexicon(); });

test("词表加载：103 条全量，校验零错误", () => {
  assert.equal(LEX.entries.length, 103);
});

test("id 唯一性：注入重复 id 必须抛错", () => {
  const bad = JSON.parse(JSON.stringify(RAW));
  bad.entries.push({ ...bad.entries[0] });
  assert.throws(() => loadLexicon(bad, R), /id 重复/);
});

test("别名冲突：两个词条抢同一个别名必须抛错", () => {
  const bad = JSON.parse(JSON.stringify(RAW));
  bad.entries[0].aliases = ["同名别名"];
  bad.entries[1].aliases = ["同名别名"];
  assert.throws(() => loadLexicon(bad, R), /别名冲突/);
});

test("名称唯一性：注入重复 name 必须抛错", () => {
  const bad = JSON.parse(JSON.stringify(RAW));
  bad.entries[1].name = bad.entries[0].name;
  assert.throws(() => loadLexicon(bad, R), /name ".*" 重复/);
});

test("check 引用：指向 rules 不存在的键必须抛错", () => {
  const bad = JSON.parse(JSON.stringify(RAW));
  bad.entries[0].check = "no_such_check";
  assert.throws(() => loadLexicon(bad, R), /不在 rules.checks/);
});

test("非法模式必须抛错", () => {
  const bad = JSON.parse(JSON.stringify(RAW));
  bad.entries[0].modes = ["hacking"];
  assert.throws(() => loadLexicon(bad, R), /非法模式/);
});

/* ---------- 归一 ---------- */
test("直达指令：'follow close' → 跟缀/身后", () => {
  const r = normalize("follow close", LEX);
  assert.equal(r.hit, true);
  assert.equal(r.id, "follow");
  assert.equal(r.args.dist, "close");
});

test("直达指令中文：'跟缀 贴身' → 跟缀/touch", () => {
  const r = normalize("跟缀 贴身", LEX);
  assert.equal(r.id, "follow");
  assert.equal(r.args.dist, "touch");
});

test("直达指令带参数：'跟缀 二十步' → 跟缀（默认同街档）", () => {
  const r = normalize("跟缀 二十步", LEX);
  assert.equal(r.hit, true);
  assert.equal(r.id, "follow");
  assert.equal(r.args.dist, "same");   // 「二十步」是 same 档关键词
});

test("直达指令带参数：'跟缀 身后十步' → 跟缀/close", () => {
  const r = normalize("跟缀 身后十步", LEX);
  assert.equal(r.hit, true);
  assert.equal(r.id, "follow");
  assert.equal(r.args.dist, "close");
});

test("官方主名直接命中：'佯装进店' 归佯装进店", () => {
  const r = normalize("佯装进店", LEX);
  assert.equal(r.id, "shop_enter");
});

test("普通动作官方名：'拍照' → 拍照", () => {
  const r = normalize("拍照", LEX);
  assert.equal(r.id, "photo");
});

test("无参动作官方名：'缓息' → 缓息", () => {
  const r = normalize("缓息", LEX);
  assert.equal(r.id, "breath");
});

test("安全降级：纯叙事与口语长句不命中、不报错、不误判为动作", () => {
  assert.equal(normalize("我穿上大衣走上台阶", LEX).hit, false);
  assert.equal(normalize("我跟上去，保持二十步左右", LEX).hit, false);
  assert.equal(normalize("抬头看了看月亮", LEX).hit, false);
  assert.equal(normalize("蹲在暗处深呼吸", LEX).hit, false);
  const r = normalize("抬头看了看月亮", LEX);
  assert.equal(r.degraded, true);
  assert.ok(r.sample);
});

test("空串与垃圾输入安全降级", () => {
  assert.equal(normalize("", LEX).degraded, true);
  assert.equal(normalize(null, LEX).degraded, true);
  assert.equal(normalize("...", LEX).degraded, true);
});

test("全程无伤检：103 条逐一自我归一全部命中", () => {
  for (const e of LEX.entries) {
    const r = normalize(e.name, LEX);
    assert.equal(r.hit, true, `词条自检失败: ${e.id}`);
    assert.equal(r.id, e.id);
  }
});

test("终局与冲突动作：下手携 style 参数，追逐与按制正常命中", () => {
  const rAmbush = normalize("下手 偷袭", LEX);
  assert.equal(rAmbush.id, "strike");
  assert.equal(rAmbush.args.style, "ambush");

  const rAssault = normalize("下手 强攻", LEX);
  assert.equal(rAssault.id, "strike");
  assert.equal(rAssault.args.style, "assault");

  const rChase = normalize("追逐", LEX);
  assert.equal(rChase.id, "chase");

  const rPin = normalize("按制", LEX);
  assert.equal(rPin.id, "pin");

  const rMis = normalize("误导归因", LEX);
  assert.equal(rMis.id, "misdirection");
});

test("核心规范别名命中：'尾随'、'偷袭'、'强攻'、'后撤' 正常归一", () => {
  assert.equal(normalize("尾随", LEX).id, "follow");
  assert.equal(normalize("偷袭", LEX).id, "strike");
  assert.equal(normalize("强攻", LEX).id, "strike");
  assert.equal(normalize("后撤", LEX).id, "withdraw");
  assert.equal(normalize("撤离", LEX).id, "abort");
});


