"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildWorldbook } = require("./src/runtime/worldbook_builder");
const { validateNarrativeDiscipline } = require("./src/utils/narrative_validator");

const ROOT = __dirname;
const NAME = "尾行";
const VERSION = "0.7.0";
const DIST = path.join(ROOT, "dist");
const OUT = path.join(ROOT, "最新角色卡");

function sections(text) {
  return Object.fromEntries(
    text
      .split(/^@@@ /m)
      .slice(1)
      .map((x) => {
        const i = x.indexOf("\n");
        return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
      })
  );
}

function _doBuild() {
  const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

  // 1. 读取卡核心提示词与文本
  const coreRaw = read("src/text_data/_card_core.txt");
  const core = sections(coreRaw);
  /* 开场白（主人 2026-10-19 定稿）：默认目标是独居女大学生，所以 first_mes 用女大开场；
     女高开场降为 alternate_greetings[0]，由创角向导按目标切换。 */
  const firstMesStudent = read("src/text_data/_card_first_mes.txt").trim();
  const firstMesCollege = fs.existsSync(path.join(ROOT, "src/text_data/_card_first_mes_college.txt"))
    ? read("src/text_data/_card_first_mes_college.txt").trim()
    : "";
  const firstMes = firstMesCollege || firstMesStudent;
  const mesExample = read("src/text_data/_card_mes.txt").trim();

  // 风骨与规范物理级强校验（违规直接拦截并提示先读 GEMINI.md）
  validateNarrativeDiscipline(core.SYSTEM_PROMPT || "", "卡核心系统提示词 SYSTEM_PROMPT");
  validateNarrativeDiscipline(core.POST_HISTORY_INSTRUCTIONS || "", "历史后指令 POST_HISTORY_INSTRUCTIONS");
  validateNarrativeDiscipline(core.DESCRIPTION || "", "卡片描述 DESCRIPTION");
  validateNarrativeDiscipline(core.SCENARIO || "", "开局情境 SCENARIO");
  validateNarrativeDiscipline(firstMes, "卡片首条开场白 first_mes");
  validateNarrativeDiscipline(mesExample, "对话示范 mes_example");

  // 2. 组装世界书
  const characterBook = buildWorldbook(ROOT);
  for (const entry of (characterBook.entries || [])) {
    validateNarrativeDiscipline(entry.content, `世界书条目内容 [${entry.name}]`);
  }

  // 3. 构建整合版引擎+状态栏脚本 (dist/wx-statusbar.user.js)
  //    先重编引擎产物：buildStatusbar 读的是 dist/runtime.js，
  //    这一步原先只由 build-runtime.js 单独负责，导致 npm run build 长期把旧引擎打进卡里。
  try {
    require("./build-runtime.js");
  } catch (err) {
    console.warn("引擎产物构建失败（将沿用 dist/runtime.js 旧档）：", err && err.message);
  }
  const { buildStatusbar } = require("./build-statusbar");
  const userScriptContent = buildStatusbar();

  // 女高开场降为备选问候语（与 first_mes 对调）
  const altGreetings = firstMesCollege ? [firstMesStudent] : [];
  for (let i = 0; i < altGreetings.length; i++) {
    validateNarrativeDiscipline(altGreetings[i], `备选开场白 alternate_greetings[${i}]`);
  }

  // 4. 组装 SillyTavern Card Spec V2
  const body = {
    name: NAME,
    description: core.DESCRIPTION || "",
    personality: "",
    scenario: core.SCENARIO || "",
    first_mes: firstMes,
    mes_example: mesExample,
    creator_notes: "【尾行】现实都市心理追猎TRPG角色卡。\n架构规格：v0.7.0 闭环版\n特性：底层单一真源中控、四类标签申报协议、常驻动线轨与心跳状态栏、首发独居女大学生角色生活包（女高中生为备选目标，开场白在 alternate_greetings）。",
    system_prompt: core.SYSTEM_PROMPT || "",
    post_history_instructions: core.POST_HISTORY_INSTRUCTIONS || "",
    alternate_greetings: altGreetings,
    character_book: characterBook,
    tags: ["尾行", "都市", "TRPG", "悬疑", "心理"],
    creator: "基米与主人",
    character_version: VERSION,
    extensions: {
      /* 世界书绑定名必须与 character_book.name 一致：早前这里写卡名「尾行」，
         而内嵌书名是「尾行·中控世界书」，导入后场上会同时出现两本，切换条目时容易改错那一本。 */
      world: characterBook.name || NAME,
      tavern_helper: {
        scripts: [
          {
            type: "script",
            enabled: true,
            id: "weixing-engine-statusbar-v07",
            name: "尾行·引擎+状态栏",
            content: userScriptContent,
            info: "引擎+胶水+原生嵌入状态栏（esbuild 防截断版）；卡名含尾行时自动激活；数据存聊天变量 wx_snap/wx_save。",
            button: { enabled: false, buttons: [] },
            data: {},
            export_with: { data: true, button: true }
          }
        ],
        variables: {}
      },
      regex_scripts: [
        {
          id: "weixing-hide-action-tags",
          scriptName: "隐藏中控申报协议标签",
          findRegex: "/<!--\\s*\\[(?:ACTION|FACT|LIE|MODE)[^>]*\\]\\s*-->/gi",
          replaceString: "",
          trimStrings: [],
          placement: [2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          minDepth: null,
          maxDepth: null
        }
      ]
    }
  };

  const card = {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: body
  };

  // 5. 校验与输出
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const cardJsonStr = JSON.stringify(card, null, 2);
  const distCardPath = path.join(DIST, `${NAME}.json`);
  const outCardPath = path.join(OUT, `${NAME}.json`);
  const distBookPath = path.join(DIST, `${NAME}-世界书.json`);
  const outBookPath = path.join(OUT, `${NAME}-世界书.json`);

  fs.writeFileSync(distCardPath, cardJsonStr, "utf8");
  fs.writeFileSync(outCardPath, cardJsonStr, "utf8");
  fs.writeFileSync(distBookPath, JSON.stringify(characterBook, null, 2), "utf8");
  fs.writeFileSync(outBookPath, JSON.stringify(characterBook, null, 2), "utf8");

  console.log(`[构建成功] 尾行角色卡 v${VERSION}`);
  console.log(`· 角色卡路径: ${outCardPath}`);
  console.log(`· 世界书条目: ${characterBook.entries.length} 条`);
  console.log(`· 卡片体积: ${Buffer.byteLength(cardJsonStr)} 字节`);

  // 6. 热同步至本地活跃酒馆环境（TT 酒馆 E:/tavern）
  //    WX_SKIP_SYNC=1 时跳过：主人的 TT 不是标准酒馆目录，卡只认 最新角色卡/ 这一份。
  if (process.env.WX_SKIP_SYNC === "1") {
    console.log("· 已按 WX_SKIP_SYNC=1 跳过酒馆热同步（只出 最新角色卡/ 里的那张卡）");
  } else {
    try {
      const { syncToTavern } = require("./tools/sync-to-tavern");
      syncToTavern();
    } catch (err) {
      console.warn("酒馆外部热同步失败（非致命）：", err && err.message);
    }
  }

  return card;
}

function build() {
  try {
    return _doBuild();
  } catch (err) {
    const reminder = "出现报错请先回去阅读 GEMINI.md";
    if (err && err.message && !err.message.includes(reminder)) {
      const banner = [
        "",
        "================================================================================",
        " ⚡【构建发生异常或拦截】",
        " 出现报错请先回去阅读 GEMINI.md 严格对照自身行为，修复后再行构建！",
        "--------------------------------------------------------------------------------",
        ` 错误详情: ${err.message}`,
        "================================================================================",
        ""
      ].join("\n");
      const wrappedErr = new Error(banner);
      wrappedErr.cause = err;
      throw wrappedErr;
    }
    throw err;
  }
}

if (require.main === module) {
  try {
    build();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

module.exports = { build };
