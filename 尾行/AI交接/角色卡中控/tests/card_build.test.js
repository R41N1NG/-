"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { build } = require("../build");

test("尾行角色卡壳子构建流水线验证", async (t) => {
  await t.test("build() 返回合法的 SillyTavern Card Spec V2 结构", () => {
    const card = build();
    assert.equal(card.spec, "chara_card_v2");
    assert.equal(card.spec_version, "2.0");
    assert.ok(card.data, "card.data 必须存在");

    const d = card.data;
    assert.equal(d.name, "尾行");
    assert.ok(d.description && d.description.length > 50, "description 必须具备足够的设定密度");
    assert.ok(d.scenario && d.scenario.length > 20, "scenario 必须非空");
    assert.ok(d.first_mes && (d.first_mes.includes("老高中") || d.first_mes.includes("文教区") || d.first_mes.includes("24小时便利店")), "first_mes 必须包含标准首夜开局文本");
    assert.ok(d.mes_example && d.mes_example.includes("<!-- [MODE:潜行] -->"), "mes_example 必须展示申报示范");
    assert.ok(d.post_history_instructions && d.post_history_instructions.includes("<!-- [FACT:"), "post_history_instructions 必须包含申报协议规范");
  });

  await t.test("世界书条目完整性与协议对齐", () => {
    const card = build();
    const book = card.data.character_book;
    assert.ok(book, "character_book 必须存在");
    assert.equal(book.entries.length, 4, "世界书条目应精准为4条：文风、中控、高中生画像与女大学生画像");

    const entryNames = book.entries.map(e => e.name);
    assert.ok(entryNames.some(n => n.includes("题材与文风")), "必须包含题材与文风条目");
    assert.ok(entryNames.some(n => n.includes("中控与回执")), "必须包含中控与回执条目");
    assert.ok(entryNames.some(n => n.includes("女高中生")), "必须包含晚自习女高中生生态画像");
    assert.ok(entryNames.some(n => n.includes("女大学生")), "必须包含独居女大学生生态画像");
    assert.ok(!entryNames.some(n => n.includes("外企职场女性")), "已下线草案OL条目，不得在世界书中残留");
    assert.ok(card.data.alternate_greetings && card.data.alternate_greetings.length >= 1, "alternate_greetings 必须包含女大学生备选开场白");

    for (const e of book.entries) {
      assert.ok(e.id > 0, "entry.id 必须大于0");
      assert.ok(Array.isArray(e.keys), "keys 必须是数组");
      assert.ok(e.content && e.content.length > 10, "entry.content 必须包含实质内容");
    }
  });

  await t.test("酒馆助手扩展与前端状态栏注入", () => {
    const card = build();
    const ext = card.data.extensions;
    assert.ok(ext, "extensions 必须存在");
    assert.ok(ext.tavern_helper, "extensions.tavern_helper 必须存在");
    assert.ok(ext.tavern_helper.scripts && ext.tavern_helper.scripts.length > 0, "必须注入 HUD 脚本");
    
    const hudScript = ext.tavern_helper.scripts[0];
    assert.equal(hudScript.id, "weixing-engine-statusbar-v07");
    assert.ok(hudScript.content.includes("wx-statusbar-root"), "HUD脚本中必须包含状态栏挂载逻辑");
    assert.ok(hudScript.content.includes("route-tracker"), "HUD脚本中必须内嵌常驻动线轨");

    // 检查隐藏申报协议正则
    assert.ok(Array.isArray(ext.regex_scripts), "regex_scripts 必须存在");
    assert.ok(ext.regex_scripts.some(r => r.id === "weixing-hide-action-tags"), "必须包含隐藏中控申报协议标签的正则");
  });

  await t.test("输出文件落地检验", () => {
    const outCardPath = path.join(__dirname, "../最新角色卡/尾行.json");
    const distCardPath = path.join(__dirname, "../dist/尾行.json");
    const distBookPath = path.join(__dirname, "../dist/尾行-世界书.json");

    assert.ok(fs.existsSync(outCardPath), "最新角色卡/尾行.json 必须真实存在");
    assert.ok(fs.existsSync(distCardPath), "dist/尾行.json 必须真实存在");
    assert.ok(fs.existsSync(distBookPath), "dist/尾行-世界书.json 必须真实存在");

    const content = JSON.parse(fs.readFileSync(outCardPath, "utf8"));
    assert.equal(content.spec, "chara_card_v2");
  });

  await t.test("风骨合规物理拦截器与 GEMINI.md 报错自省提示验证", () => {
    const { validateNarrativeDiscipline } = require("../src/utils/narrative_validator");

    // 1. 验证各种违禁词拦截
    const violationCases = [
      { text: "严格严禁代打玩家行动", word: "严禁" },
      { text: "PROHIBITIONS: do not speak", word: "PROHIBITIONS" },
      { text: "禁止直接对话", word: "禁止" },
      { text: "叙事必须保持第三人称视角", word: "第三人称" },
      { text: "彻底失去防备", word: "彻底" },
      { text: "绝对臣服", word: "绝对" },
      { text: "缺乏成年人的防范预警", word: "成年人" },
      { text: "不具备成人独立性", word: "成人" }
    ];

    for (const { text, word } of violationCases) {
      assert.throws(
        () => validateNarrativeDiscipline(text, `测试样例-${word}`),
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes("风骨合规物理拦截"), `必须触发风骨物理拦截: ${word}`);
          assert.ok(err.message.includes("出现报错请先回去阅读 GEMINI.md"), `必须指示先读 GEMINI.md: ${word}`);
          return true;
        },
        `命中违规词 [${word}] 必须被物理拦截`
      );
    }

    // 2. 验证合规文本顺利放行
    assert.doesNotThrow(() => {
      validateNarrativeDiscipline("正文顺承玩家动作起手与中控客观成效，推进至目标即时外在反应后，即刻定格留白，交由玩家发起下一步行动", "合规白描文本");
    });
  });
});
