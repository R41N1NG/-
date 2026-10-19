"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const data = require("../tools/data.cjs").load(ROOT);
const C = require("../src/runtime/contracts");
const { createDispatcher } = require("../src/runtime/dispatcher");
const {
  isPalaceLord,
  CORRUPTION_STAGES,
  HOLDER_TO_RELIC_ID,
  HOLDER_TO_RELIC_NAME,
  getCharacterCorruption,
  resolveCorruption
} = require("../src/runtime/corruption");
const {
  resolveStages,
  completeStage
} = require("../src/runtime/character_stages");
const { createMetricEvents } = require("../src/runtime/metric_events");
const { mountHUD } = require("../src/ui/status_panel");

test("恶堕系统：身份判定 isPalaceLord 精确识别四大殿主", () => {
  assert.equal(isPalaceLord("焚欲殿主"), true);
  assert.equal(isPalaceLord("欢喜殿主"), true);
  assert.equal(isPalaceLord("浊龙殿主"), true);
  assert.equal(isPalaceLord("魂欢殿主"), true);
  assert.equal(isPalaceLord(" 焚欲殿主 "), true);

  assert.equal(isPalaceLord("赵无忧"), false);
  assert.equal(isPalaceLord("自设"), false);
  assert.equal(isPalaceLord(""), false);
  assert.equal(isPalaceLord(null), false);
  assert.equal(isPalaceLord(undefined), false);
});

test("恶堕系统：叶红缨试点五阶与名器阶位 1:1 精确映射与晋阶机缘", () => {
  const stat = { known: {} };
  const r = data.rules(stat);

  // 0阶 · 守道
  let c = getCharacterCorruption("叶红缨", stat, r);
  assert.equal(c.character, "叶红缨");
  assert.equal(c.relicId, "zhuojiu");
  assert.equal(c.relicName, "灼酒流炎穴");
  assert.equal(c.stage, 0);
  assert.equal(c.id, "shoudao");
  assert.equal(c.label, "守道");
  assert.equal(c.title, "守道 · 冰清");
  assert.equal(c.relicStageName, "未成形");
  assert.match(c.desc, /宁死不作鼎炉/);
  assert.match(c.nextRequirement, /破身见红/);

  // 1阶 · 染尘
  stat.known["灼酒流炎穴成形"] = true;
  c = getCharacterCorruption("叶红缨", stat, r);
  assert.equal(c.stage, 1);
  assert.equal(c.id, "ranchen");
  assert.equal(c.label, "染尘");
  assert.equal(c.title, "染尘 · 破禁");
  assert.equal(c.relicStageName, "一阶·初生");
  assert.match(c.nextRequirement, /本源浸润.*生理自发迎合/);

  // 2阶 · 蚀心
  stat.known["灼酒流炎穴二阶段"] = true;
  c = getCharacterCorruption("叶红缨", stat, r);
  assert.equal(c.stage, 2);
  assert.equal(c.id, "shixin");
  assert.equal(c.label, "蚀心");
  assert.equal(c.title, "蚀心 · 情动");
  assert.equal(c.relicStageName, "二阶·情动");
  assert.match(c.nextRequirement, /心理深层依附.*奴种/);

  // 3阶 · 沉沦
  stat.known["灼酒流炎穴三阶段"] = true;
  c = getCharacterCorruption("叶红缨", stat, r);
  assert.equal(c.stage, 3);
  assert.equal(c.id, "chenlun");
  assert.equal(c.label, "沉沦");
  assert.equal(c.title, "沉沦 · 归附");
  assert.equal(c.relicStageName, "三阶·沉沦");
  assert.match(c.nextRequirement, /大势终局质变.*极乐密藏/);

  // 4阶 · 极乐
  stat.known["灼酒流炎穴四阶段"] = true;
  c = getCharacterCorruption("叶红缨", stat, r);
  assert.equal(c.stage, 4);
  assert.equal(c.id, "jile");
  assert.equal(c.label, "极乐");
  assert.equal(c.title, "极乐 · 天姝");
  assert.equal(c.relicStageName, "四阶·极乐");
  assert.match(c.nextRequirement, /极乐天姝大成/);
});

test("恶堕系统：殿主与赵无忧/自设互斥（resolveStages 与 completeStage）", () => {
  const profiles = data.characterProfiles || {};

  // 1. 殿主身份下：恶堕开启，好感关闭
  const lordState = {
    identity: "焚欲殿主",
    stat_data: {
      身份: "焚欲殿主",
      known: { 灼酒流炎穴成形: true },
      character_metrics: { 叶红缨: { 好感度: 50 } }
    }
  };
  resolveStages(lordState, profiles, data.rules(lordState.stat_data));
  assert.equal(lordState.stat_data.corruption_active, true);
  assert.equal(lordState.stat_data.favor_active, false);
  assert.ok(lordState.stat_data.character_corruption);
  assert.equal(lordState.stat_data.character_corruption.叶红缨.stage, 1);
  assert.ok(lordState.stat_data.character_stages.叶红缨);
  assert.equal(lordState.stat_data.character_stages.叶红缨.id, "stage02");
  assert.equal(lordState.stat_data.character_stages.叶红缨.label, "染尘");
  assert.match(lordState.stat_data.character_stages.叶红缨.story, /叶红缨 · 恶堕阶段一/);
  assert.throws(() => completeStage(lordState, profiles, { character: "叶红缨", from: "yh_initial", to: "yh_pingdan" }), /殿主身份下好感晋升关闭/);

  // 2. 赵无忧身份下：好感开启，恶堕全量关闭清除
  const zhaoState = {
    identity: "赵无忧",
    stat_data: {
      身份: "赵无忧",
      known: {},
      character_metrics: { 叶红缨: { 好感度: 0 } },
      completed_character_stages: { 叶红缨: "stage01" }
    }
  };
  resolveStages(zhaoState, profiles, data.rules(zhaoState.stat_data));
  assert.equal(zhaoState.stat_data.corruption_active, false);
  assert.equal(zhaoState.stat_data.favor_active, true);
  assert.equal(zhaoState.stat_data.character_corruption, undefined);
  assert.ok(zhaoState.stat_data.character_stages.叶红缨);
  assert.equal(zhaoState.stat_data.character_stages.叶红缨.id, "stage01");
});

test("恶堕系统：殿主身份下 <好感事件> 自动拒止并提示采用名器恶堕阶梯", () => {
  const metricEvents = createMetricEvents(
    data.metricEventDefinitions,
    data.characterProfiles || {},
    data.promotionDefinitions || {}
  );

  const lordState = {
    identity: "焚欲殿主",
    stat_data: {
      身份: "焚欲殿主",
      在场角色: [{ 名: "叶红缨" }],
      character_metrics: { 叶红缨: { 好感度: 10 } }
    }
  };

  const body = "<好感事件>叶红缨｜记心上｜依据：叶红缨微微抿唇，收下回元丹。</好感事件>";
  const prose = "叶红缨微微抿唇，收下回元丹。";
  const result = metricEvents.apply(lordState, body, prose, 1);

  assert.equal(result.changes.length, 0);
  assert.equal(lordState.stat_data.lastFavorCheck.status, "rejected");
  assert.match(lordState.stat_data.lastFavorCheck.reason, /殿主身份下好感度系统关闭，采用名器恶堕阶梯/);
  // 好感数值未发生任何改变
  assert.equal(lordState.stat_data.character_metrics.叶红缨.好感度, 10);
});

test("恶堕系统：HUD 界面在殿主模式下呈现「恶 堕」行、恶堕芯片与五阶弹窗", () => {
  const d = new JSDOM("<html><head></head><body><div id='container'></div></body></html>");
  const doc = d.window.document;
  d.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  d.window.HTMLDialogElement.prototype.close = function () { this.dispatchEvent(new d.window.Event("close")); };

  const lordState = {
    chatId: "c1",
    branchId: "b1",
    floor: 1,
    revision: 1,
    identity: "焚欲殿主",
    calendarDate: { year: 1578, month: 4, day: 1 },
    inventory: [],
    manual: {},
    stat_data: {
      身份: "焚欲殿主",
      阵营: "焚欲殿",
      修为: "金丹后期",
      历时: "1日",
      地点: "焚欲大殿",
      环境: "幽暗",
      状态: "清醒",
      目标: "猎鼎",
      known: { 灼酒流炎穴成形: true },
      在场角色: [{ 名: "叶红缨", 修为: "金丹初期", 关系: "猎物" }],
      关系刻度: "叶红缨、觊觎猎物",
      character_corruption: {
        叶红缨: getCharacterCorruption("叶红缨", { known: { 灼酒流炎穴成形: true } }, data.rules({}))
      }
    }
  };

  const runtime = {
    getSnapshot: () => lordState,
    subscribe: () => () => {},
    dispatchIntent: async () => {}
  };

  const hud = mountHUD(doc, doc.querySelector("#container"), runtime, data, () => {});

  // 1. 验证主卷中的行名为「恶 堕」，无「关 系」
  const rows = [...doc.querySelectorAll(".xsd2-row")];
  const corruptionRow = rows.find(r => r.querySelector("b")?.textContent === "恶 堕");
  const favorRow = rows.find(r => r.querySelector("b")?.textContent === "关 系");
  assert.ok(corruptionRow, "应当存在「恶 堕」行");
  assert.equal(favorRow, undefined, "殿主模式下不应存在「关 系」行");

  // 2. 验证芯片为 data-corruption 芯片
  const chip = corruptionRow.querySelector("[data-corruption='叶红缨']");
  assert.ok(chip, "应当渲染叶红缨恶堕芯片");
  assert.equal(chip.textContent.trim(), "叶红缨 · 染尘");

  // 3. 点击恶堕芯片，打开恶堕五阶图谱弹窗
  chip.click();
  const dialog = doc.querySelector("dialog.xsd2-favor");
  assert.ok(dialog, "应当弹出恶堕阶梯弹窗");
  assert.match(dialog.textContent, /叶红缨 · 恶堕阶梯/);
  assert.match(dialog.textContent, /专属名器：灼酒流炎穴/);
  assert.match(dialog.textContent, /当前阶位：染尘 · 破禁/);
  assert.match(dialog.textContent, /名器一阶·初生/);
  assert.match(dialog.textContent, /恶堕五阶图谱/);
  assert.match(dialog.textContent, /守道 · 冰清/);
  assert.match(dialog.textContent, /染尘 · 破禁/);
  assert.match(dialog.textContent, /蚀心 · 情动/);
  assert.match(dialog.textContent, /沉沦 · 归附/);
  assert.match(dialog.textContent, /极乐 · 天姝/);

  hud.destroy();
  d.window.close();
});

test("恶堕系统：文本与代码恪守13个禁词规定", () => {
  const BANNED = [
    "彻底", "绝对", "极其", "极度", "臣服", "献祭",
    "近乎", "近乎于", "尽数", "不可或缺", "顺从", "终极", "神坛"
  ];
  for (const stg of CORRUPTION_STAGES) {
    for (const word of BANNED) {
      assert.equal(stg.desc.includes(word), false, `阶段描述不能包含禁词: ${word}`);
      assert.equal(stg.title.includes(word), false, `阶段标题不能包含禁词: ${word}`);
    }
  }
});

function harness(runtimeData = data) {
  let c = {
    chatId: "corrupt_chat",
    branchId: "main",
    metadata: {},
    chat: [{ mes: "<IdentityMenu/>", is_user: false, vars: {} }],
  };
  const sent = [], prompts = [];
  const adapter = {
    context: () => c,
    readMessage: async (i) => C.clone(c.chat[i]?.variables?.[c.chat[i]?.swipe_id ?? 0] || {}),
    persist: async (ctx, e) => {
      assert.equal(ctx.chatId, c.chatId);
      const m = c.chat[ctx.floor];
      m.variables ??= [];
      m.variables[m.swipe_id ?? 0] = {
        stat_data: { ...C.clone(e.state.stat_data), xsd2: [C.clone(e)] },
      };
    },
    setPrompt: (x) => prompts.push(x),
    preflightSend: () => {},
    isGenerating: () => false,
    isAborted: () => false,
    confirmExit: async () => true,
    send: async (text) => {
      sent.push(text);
      c.chat.push({ mes: text, is_user: true });
    },
    replaceStory: async (i, text) => { c.chat[i].mes = text; },
    replaceOpening: async (text) => { c.chat[0].mes = text; },
    syncIdentity: async () => {},
    report: () => {},
  };
  const r = createDispatcher(adapter, runtimeData);
  const opening = (identity) => r.dispatchIntent({ type: "SELECT_IDENTITY", payload: { identity } });
  const reply = (text) => {
    c.chat.push({ mes: text, is_user: false, swipe_id: 0 });
    return r.settleStory();
  };
  return { r, adapter, sent, prompts, opening, reply, get c() { return c; } };
}

const status = (fields = {}, prose = "山风拂过山谷。") =>
  prose +
  "\n<Status_block>" +
  Object.entries({
    时间: "仙盟历 9999年1月1日",
    身份: "焚欲殿主",
    历时: "—",
    ...fields,
  })
    .map(([k, v]) => "<" + k + ">" + v + "</" + k + ">")
    .join("") +
  "</Status_block>";

test("恶堕系统：中控调度端 0->1->2 阶梯完整流转、浸润火候推进与恶堕日志记录", async () => {
  const h = harness();
  await h.opening("焚欲殿主");
  let snap = h.r.getSnapshot();
  assert.equal(snap.identity, "焚欲殿主");
  assert.equal(snap.stat_data.corruption_active, true);
  assert.equal(snap.stat_data.character_corruption.叶红缨.stage, 0);
  assert.equal(snap.stat_data.character_corruption.叶红缨.label, "守道");

  // 1. 第1回合：实质破身见红 -> 0阶跃迁至1阶（守道 -> 染尘）
  await h.reply(status(
    { 破处: "叶红缨、焚欲殿主", 实际发生: "叶红缨处女丧失、灼酒流炎穴成形" },
    "焚欲殿主实质破处叶红缨，元阴被夺并落红。"
  ));
  snap = h.r.getSnapshot();
  assert.equal(snap.stat_data.known["叶红缨处女丧失"], true);
  assert.equal(snap.stat_data.known["灼酒流炎穴成形"], true);
  assert.equal(snap.stat_data.破处者["叶红缨"], "焚欲殿主");
  assert.equal(snap.stat_data.名器归属["zhuojiu"], "焚欲殿主");
  assert.equal(snap.stat_data.character_corruption.叶红缨.stage, 1);
  assert.equal(snap.stat_data.character_corruption.叶红缨.label, "染尘");
  assert.equal(snap.stat_data.character_corruption.叶红缨.title, "染尘 · 破禁");
  assert.ok(Array.isArray(snap.stat_data.corruption_log));
  assert.equal(snap.stat_data.corruption_log[0].type, "stage_leap");
  assert.equal(snap.stat_data.corruption_log[0].fromStage, 0);
  assert.equal(snap.stat_data.corruption_log[0].toStage, 1);
  assert.equal(snap.stat_data.corruption_log[0].character, "叶红缨");

  // 2. 第2回合：本源浸润第1次 -> 计数 1/3，未就绪，阶段维持1阶
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status(
    { 名器互动: "灼酒流炎穴｜焚欲殿主｜内射" },
    "焚欲殿主挺身深入，浓稠阳精全数灌入叶红缨花房深处。"
  ));
  snap = h.r.getSnapshot();
  assert.equal(snap.stat_data.relic_progress.zhuojiu.stages[2].count, 1);
  assert.equal(snap.stat_data.relic_progress.zhuojiu.stages[2].ready, false);
  assert.equal(snap.stat_data.character_corruption.叶红缨.stage, 1);
  assert.equal(snap.stat_data.corruption_log[0].type, "soak");
  assert.equal(snap.stat_data.corruption_log[0].count, 1);
  assert.equal(snap.stat_data.corruption_log[0].target, 3);
  assert.equal(snap.stat_data.corruption_log[0].ready, false);

  // 3. 第3回合：本源浸润第2次 -> 计数 2/3
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status(
    { 名器互动: "灼酒流炎穴｜焚欲殿主｜内射" },
    "滚烫精液再次全数射入叶红缨体内，灼酒流炎穴至阳本源浸润。"
  ));
  snap = h.r.getSnapshot();
  assert.equal(snap.stat_data.relic_progress.zhuojiu.stages[2].count, 2);
  assert.equal(snap.stat_data.relic_progress.zhuojiu.stages[2].ready, false);
  assert.equal(snap.stat_data.character_corruption.叶红缨.stage, 1);

  // 4. 第4回合：本源浸润第3次 -> 达到 3/3，ready 为 true，但尚无生理迎合，阶段仍维持1阶
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status(
    { 名器互动: "灼酒流炎穴｜焚欲殿主｜内射" },
    "叶红缨承纳至阳本源深度交合内射，白浊注入深处，灼酒流炎穴满溢。"
  ));
  snap = h.r.getSnapshot();
  assert.equal(snap.stat_data.relic_progress.zhuojiu.stages[2].count, 3);
  assert.equal(snap.stat_data.relic_progress.zhuojiu.stages[2].ready, true);
  assert.equal(snap.stat_data.character_corruption.叶红缨.stage, 1, "火候虽满，无生理迎合前不可越阶");

  // 5. 第5回合：正文触发名器生理自发迎合 -> 1阶跃迁至2阶（染尘 -> 蚀心）
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status(
    {},
    "叶红缨内壁剧烈抽搐痉挛，名器产生生理自发迎合，二阶情动异象成形。"
  ));
  snap = h.r.getSnapshot();
  assert.equal(snap.stat_data.known["灼酒流炎穴二阶段"], true);
  assert.equal(snap.stat_data.character_corruption.叶红缨.stage, 2);
  assert.equal(snap.stat_data.character_corruption.叶红缨.label, "蚀心");
  assert.equal(snap.stat_data.character_corruption.叶红缨.title, "蚀心 · 情动");
  assert.equal(snap.stat_data.corruption_log[0].type, "stage_leap");
  assert.equal(snap.stat_data.corruption_log[0].fromStage, 1);
  assert.equal(snap.stat_data.corruption_log[0].toStage, 2);
  assert.equal(snap.stat_data.corruption_log[0].character, "叶红缨");
});

test("恶堕系统：2->3 与 3->4 阶段判定及否定句防御拦截", async () => {
  const h = harness();
  await h.opening("焚欲殿主");

  // 1. 破身见红
  await h.reply(status({ 破处: "叶红缨、焚欲殿主" }, "焚欲殿主实质破处叶红缨，元阴被夺并落红。"));

  // 2. 3次浸润达标
  for (let i = 0; i < 3; i++) {
    h.c.chat.push({ is_user: true, mes: "继续" });
    await h.reply(status({ 名器互动: "灼酒流炎穴｜焚欲殿主｜内射" }, "阳精全数灌入叶红缨花房深处。"));
  }

  // 3. 生理迎合质变成形 -> 跃迁至2阶
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status({}, "叶红缨内壁痉挛吮吸，名器产生生理自发迎合，二阶情动异象成形。"));
  let s = h.r.getSnapshot();
  assert.equal(s.stat_data.character_corruption.叶红缨.stage, 2);

  // 4. 2升3浸润：3次深度交合（不触发阶段质变词）
  for (let i = 0; i < 3; i++) {
    h.c.chat.push({ is_user: true, mes: "继续" });
    await h.reply(status({ 名器互动: "灼酒流炎穴｜焚欲殿主｜深度交合" }, "叶红缨与焚欲殿主深度交合，花房痉挛，阳精注入。"));
  }
  s = h.r.getSnapshot();
  assert.equal(s.stat_data.relic_progress.zhuojiu.stages[3].count, 3);
  assert.equal(s.stat_data.relic_progress.zhuojiu.stages[3].ready, true);
  assert.equal(s.stat_data.character_corruption.叶红缨.stage, 2, "未达成三阶质变前维持二阶");

  // 5. 否定句拦截测试
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status({}, "叶红缨并未动情配合，心智未曾沉沦。"));
  s = h.r.getSnapshot();
  assert.notEqual(s.stat_data.known["灼酒流炎穴三阶段"], true);
  assert.equal(s.stat_data.character_corruption.叶红缨.stage, 2);

  // 6. 肯定句三阶质变：动情配合，理智防线失守 -> 升至3阶
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status({}, "叶红缨神魂交契，动情配合，理智防线失守，心智沉沦。"));
  s = h.r.getSnapshot();
  assert.equal(s.stat_data.known["灼酒流炎穴三阶段"], true);
  assert.equal(s.stat_data.character_corruption.叶红缨.stage, 3);
  assert.equal(s.stat_data.character_corruption.叶红缨.label, "沉沦");
  assert.equal(s.stat_data.corruption_log[0].type, "stage_leap");
  assert.equal(s.stat_data.corruption_log[0].fromStage, 2);
  assert.equal(s.stat_data.corruption_log[0].toStage, 3);

  // 7. 3升4浸润：3次天地机缘（不触发四阶大成词）
  for (let i = 0; i < 3; i++) {
    h.c.chat.push({ is_user: true, mes: "继续" });
    await h.reply(status({ 名器互动: "灼酒流炎穴｜焚欲殿主｜天地机缘" }, "叶红缨逢天地机缘，名器本源共鸣，异化展翼。"));
  }
  s = h.r.getSnapshot();
  assert.equal(s.stat_data.relic_progress.zhuojiu.stages[4].count, 3);
  assert.equal(s.stat_data.relic_progress.zhuojiu.stages[4].ready, true);
  assert.equal(s.stat_data.character_corruption.叶红缨.stage, 3, "未达成四阶大成前维持三阶");

  // 8. 肯定句四阶大成质变：身心交融，极乐天姝大成 -> 升至4阶
  h.c.chat.push({ is_user: true, mes: "继续" });
  await h.reply(status({}, "叶红缨身心交融，极乐天姝大成，永堕极乐。"));
  s = h.r.getSnapshot();
  assert.equal(s.stat_data.known["灼酒流炎穴四阶段"], true);
  assert.equal(s.stat_data.character_corruption.叶红缨.stage, 4);
  assert.equal(s.stat_data.character_corruption.叶红缨.label, "极乐");
  assert.equal(s.stat_data.corruption_log[0].type, "stage_leap");
  assert.equal(s.stat_data.corruption_log[0].fromStage, 3);
  assert.equal(s.stat_data.corruption_log[0].toStage, 4);
});

test("恶堕系统：中控调度 managedEnabled 动态开启在场角色专属恶堕心智条目", () => {
  const { managedEnabled } = require("../src/runtime/story_entries");
  const profiles = data.characterProfiles || {};

  const lordStat = {
    身份: "焚欲殿主",
    在场角色: [{ 名: "叶红缨" }],
    known: { 灼酒流炎穴二阶段: true }
  };
  const s = { stat_data: lordStat };
  resolveStages(s, profiles, data.rules(lordStat));

  // 当前叶红缨处于二阶(蚀心，映射 stage03)
  assert.equal(lordStat.character_stages.叶红缨.id, "stage03");
  assert.equal(lordStat.character_stages.叶红缨.label, "蚀心");
  assert.match(lordStat.character_stages.叶红缨.story, /叶红缨 · 恶堕阶段二/);

  // 1. 在场叶红缨 stage03:殿主 条目应被中控动态激活
  assert.equal(managedEnabled("【人物阶段】叶红缨:stage03:殿主", lordStat), true);

  // 2. 非当前阶段（如 stage01 或 stage02）不应激活
  assert.equal(managedEnabled("【人物阶段】叶红缨:stage01:殿主", lordStat), false);
  assert.equal(managedEnabled("【人物阶段】叶红缨:stage02:殿主", lordStat), false);

  // 3. 不在场角色（如孤月）不应激活
  assert.equal(managedEnabled("【人物阶段】孤月:stage01:殿主", lordStat), false);
});


