/**
 * 开局默认目标（独居女大学生）+ 开场白切换 + 世界书默认互斥：
 * 主人 2026-10-19 定：女大是默认选项，卡的开场白与世界书也要跟着对位。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { build } = require("../build.js");
const { startGlue, applyTargetOpening } = require("../src/host/glue.js");

const card = build();
const data = card.data;

test("卡面：first_mes 是女大开场，女高开场进 alternate_greetings", () => {
  assert.ok(/大学侧门|高校自习区|综合实验楼/.test(data.first_mes), "first_mes 应为女大开场");
  assert.ok(Array.isArray(data.alternate_greetings) && data.alternate_greetings.length >= 1);
  assert.ok(/老高中|下课铃|学区公交/.test(data.alternate_greetings[0]), "备选开场白应是女高");
});

test("世界书：女大默认常驻启用，女高默认关闭（与默认选项一致）", () => {
  const entries = data.character_book.entries;
  const college = entries.find(e => e.name.includes("独居女大学生"));
  const student = entries.find(e => e.name.includes("晚自习女高中生"));
  assert.ok(college, "缺女大条目");
  assert.ok(student, "缺女高条目");
  assert.equal(college.constant, true, "女大应默认常驻");
  assert.equal(college.enabled, true, "女大应默认启用");
  assert.equal(student.constant, false, "女高不应默认常驻");
  assert.equal(student.enabled, false, "女高应默认关闭");
});

test("引擎默认目标：没有 wx_init 时建局目标为 college", async () => {
  const G = globalThis;
  const store = {};
  G.insertOrAssignVariables = async (o) => Object.assign(store, o);
  G.getVariables = async () => JSON.parse(JSON.stringify(store));
  G.eventOn = () => {};
  G.tavern_events = {};
  G.getCurrentCharacterName = async () => "尾行";
  try {
    const r = await startGlue();
    assert.equal(r.ok, true);
    await G.WxGlue.rebuild();
    assert.equal(G.WxGlue.game._g.targetId, "college", "默认目标应为女大");
  } finally {
    for (const k of ["insertOrAssignVariables", "getVariables", "eventOn", "tavern_events", "getCurrentCharacterName"]) delete G[k];
    delete G.WxGlue;
  }
});

test("开场白切换：女大用 first_mes、女高用 alternate[0]；旧对话不覆盖", async () => {
  const G = globalThis;
  const calls = [];
  let chatLen = 1;
  G.SillyTavern = {
    getContext: () => ({
      characters: [{ data: { first_mes: "COLLEGE_OPEN", alternate_greetings: ["STUDENT_OPEN"] } }],
      characterId: 0,
      chat: new Array(chatLen).fill({}),
    }),
  };
  G.setChatMessages = async (msgs) => { calls.push(msgs); };
  try {
    const r1 = await applyTargetOpening("college");
    assert.equal(r1.ok, true);
    assert.equal(calls[0][0].message, "COLLEGE_OPEN");

    const r2 = await applyTargetOpening("student");
    assert.equal(r2.ok, true);
    assert.equal(calls[1][0].message, "STUDENT_OPEN");

    chatLen = 3;
    const r3 = await applyTargetOpening("college");
    assert.equal(r3.skipped, true, "已有对话时不得覆盖开场");
    assert.equal(calls.length, 2);
  } finally {
    delete G.SillyTavern; delete G.setChatMessages;
  }
});
