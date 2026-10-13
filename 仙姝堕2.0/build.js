"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  zlib = require("node:zlib");
const { source, load } = require("./tools/data.cjs");
const {storyEntries, metricEntries, areaEntries} = require("./src/runtime/story_entries");
const { evaluateGate } = require("./src/host/worldbook");
const ROOT = __dirname,
  NAME = "仙姝堕2.0·框架测试",
  OUT = path.join(ROOT, "最新角色卡"),
  DIST = path.join(ROOT, "dist");
function bundle() {
  const modules = new Map();
  function add(file) {
    const key = path.relative(ROOT, file).replaceAll("\\", "/");
    if (modules.has(key)) return key;
    let text = file.endsWith("generated-data.js")
      ? source(ROOT)
      : fs.readFileSync(file, "utf8");
    modules.set(key, "");
    text = text.replace(/require\(['"]([^'"]+)['"]\)/g, (_, name) => {
      if (!name.startsWith("."))
        throw Error("浏览器模块不允许外部依赖：" + name);
      let target = path.resolve(path.dirname(file), name);
      if (!target.endsWith(".js")) target += ".js";
      return "require(" + JSON.stringify(add(target)) + ")";
    });
    modules.set(key, text);
    return key;
  }
  const entry = add(path.join(ROOT, "src/bootstrap.js"));
  const text =
    '(function(){"use strict";const modules={' +
    [...modules]
      .map(
        ([id, body]) =>
          JSON.stringify(id) +
          ":function(module,exports,require){\n" +
          body +
          "\n}",
      )
      .join(",") +
    "};const cache={};function require(id){if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;modules[id](module,module.exports,require);return module.exports;}require(" +
    JSON.stringify(entry) +
    ");})();";
  if (!text.includes("<h1>卷中錄</h1>") || !text.includes("xsd2-document")) throw Error("新版卷中录未进入构建，拒绝旧版状态栏交付");
  new vm.Script(text);
  return text;
}
function crc(buffer) {
  let n = 0xffffffff;
  for (const b of buffer) {
    n ^= b;
    for (let j = 0; j < 8; j++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  }
  return (n ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type),
    len = Buffer.alloc(4),
    sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, sum]);
}
function png(card) {
  const w = 256,
    h = 384,
    raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * (w * 3 + 1) + 1 + x * 3;
      const edge = x < 9 || x > w - 10 || y < 9 || y > h - 10;
      const n = edge
        ? [213, 185, 123]
        : [
            23 + Math.floor(y / 30),
            30 + Math.floor(y / 30),
            28 + Math.floor(y / 30),
          ];
      raw.set(n, p);
    }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk(
      "tEXt",
      Buffer.from(
        "chara\0" + Buffer.from(JSON.stringify(card)).toString("base64"),
      ),
    ),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
function unpack(buffer) {
  for (let offset = 8; offset < buffer.length; ) {
    const len = buffer.readUInt32BE(offset),
      type = buffer.toString("ascii", offset + 4, offset + 8),
      payload = buffer.subarray(offset + 8, offset + 8 + len);
    if (type === "tEXt" && payload.toString().startsWith("chara\0"))
      return JSON.parse(
        Buffer.from(payload.toString().slice(6), "base64").toString(),
      );
    offset += len + 12;
  }
  throw Error("PNG 缺少角色卡数据");
}
function sections(text) {
  return Object.fromEntries(
    text
      .split(/^@@@ /m)
      .slice(1)
      .map((x) => {
        const i = x.indexOf("\n");
        return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
      }),
  );
}
function build() {
  const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8"),
    data = load(ROOT),
    core = sections(read("src/text_data/_card_core.txt")),
    book = JSON.parse(read("仙姝堕-世界书.json")),
    entries = Object.values(book.entries);
  if (
    entries.length !== 234 ||
    entries.some((e) => String(e.comment).startsWith("【剧情】"))
  )
    throw Error("世界书底表数量或隔离检查失败");
  for (const e of entries) {
    e.excludeRecursion = true;
    e.preventRecursion = true;
    e.disable = String(e.content).startsWith("@@if ") || e.disable === true;
  }
  const extra = storyEntries(JSON.parse(read("src/config/node_stories.json")),data.characterProfiles,Math.max(...entries.map(e=>e.uid))+1);
  entries.push(...extra);
  entries.push(...metricEntries(JSON.parse(read("src/config/metric_events.json")),Math.max(...entries.map(e=>e.uid))+1));
  entries.push(...areaEntries(JSON.parse(read("src/config/area_backgrounds.json")),Math.max(...entries.map(e=>e.uid))+1));
  const script = bundle(),
    characterBook = {
      name: NAME,
      description: "2.0独立测试世界书",
      scan_depth: 2,
      token_budget: 8192,
      recursive_scanning: false,
      extensions: {},
      entries: entries.map((e) => ({
        keys: e.key || [],
        secondary_keys: e.keysecondary || [],
        content: e.content,
        extensions: {
          position: e.position,
          display_index: e.displayIndex,
          exclude_recursion: true,
          prevent_recursion: true,
          probability: e.probability,
          useProbability: e.useProbability,
          depth: e.depth,
          role: e.role,
          vectorized: e.vectorized,
          ...(e.scanDepth !== undefined ? {scan_depth:e.scanDepth,match_user:e.matchUser,match_character:e.matchCharacter} : {}),
          selectiveLogic: e.selectiveLogic,
        },
        enabled: !e.disable,
        insertion_order: e.order || 0,
        case_sensitive: false,
        name: e.comment,
        id: e.uid,
        comment: e.comment,
        selective: e.selective,
        constant: e.constant,
        position: e.position === 0 ? "before_char" : "after_char",
      })),
    };
  const body = {
    name: NAME,
    description: core.DESCRIPTION,
    personality: "",
    scenario: core.SCENARIO,
    first_mes: read("src/text_data/_card_first_mes.txt").trim(),
    mes_example: read("src/text_data/_card_mes.txt").trim(),
    creator_notes:
      "独立2.0测试；恢复原版百花谱开局，内置幽寂谷地图插件。需要酒馆助手。立绘沿用本地图包，真实模型与酒馆操作由主人验收。",
    system_prompt: "",
    post_history_instructions: "",
    alternate_greetings: Object.values(data.greetings),
    character_book: characterBook,
    tags: ["仙姝堕", "2.0框架测试"],
    creator: "R41N1NG",
    character_version: "2.0-framework.26",
    extensions: {
      world: NAME,
      tavern_helper: {
        scripts: [
          {
            type: "script",
            enabled: true,
            id: "xsd2-framework-core-v1",
            name: "仙姝堕2.0核心",
            content: script,
            info: "统一状态内核、HUD和GM",
            button: { enabled: false, buttons: [] },
            data: {},
            export_with: { data: true, button: true },
          },
        ],
        variables: {},
      },
      regex_scripts: [
        ...Object.values(require("./src/plugins/youjigu_map/event_tree").EVENT_DEFS).map(def => ({
          id:"xsd2-action-label-" + def.id, scriptName:"节点指令显示：" + def.label,
          findRegex:"/\\bXSD2_" + def.id + "_[a-f0-9]{8}\\b/g",
          replaceString:require("./src/plugins/youjigu_map").getDisplayText(def.id),
          trimStrings:[], placement:[1], disabled:false, markdownOnly:true,
          promptOnly:false, runOnEdit:true, substituteRegex:0, minDepth:null,maxDepth:null,
        })),
        {
          id: "xsd2-hide-protocol",
          scriptName: "隐藏后台协议",
          findRegex:
            "/<(?:Status_block|StatusBlock|status)\\b[^>]*>[\\s\\S]*?<\\/(?:Status_block|StatusBlock|status)>|<Identity(?:Menu\\s*\\/|Pick\\b[^>]*\\/)>/gi",
          replaceString: "",
          trimStrings: [],
          placement: [2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          minDepth: null,
          maxDepth: null,
        },
      ],
    },
  };
  const card = JSON.parse(JSON.stringify({ spec: "chara_card_v2", spec_version: "2.0", data: body }));
  fs.mkdirSync(DIST, { recursive: true });
  const image = png(card);
  if (JSON.stringify(unpack(image)) !== JSON.stringify(card))
    throw Error("PNG回读不一致");
  // 交付目录纯净规范（铁律 30）：额外交付一份到 E:\角色卡制作\仙姝堕2.0\最新角色卡，且文件夹内只保留一份最新的png和json
  const extraOut = path.resolve("E:/角色卡制作/仙姝堕2.0/最新角色卡");
  const targetDirs = new Set([OUT]);
  if (fs.existsSync(path.dirname(extraOut))) targetDirs.add(extraOut);
  for (const dir of targetDirs) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, NAME + ".json"), JSON.stringify(card, null, 2));
    fs.writeFileSync(path.join(dir, NAME + ".png"), image);
    for (const file of fs.readdirSync(dir)) {
      if (file !== NAME + ".json" && file !== NAME + ".png") {
        try { fs.unlinkSync(path.join(dir, file)); } catch (_) {}
      }
    }
  }
  fs.writeFileSync(path.join(DIST, NAME + "-v26.png"), image);
  fs.writeFileSync(
    path.join(DIST, NAME + "-世界书.json"),
    JSON.stringify(
      { ...book, entries: Object.fromEntries(entries.map((e) => [e.uid, e])) },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(DIST, "runtime.js"), script);
  console.log(
    "2.0 独立构建完成：" +
      entries.length +
      "条世界书；脚本 " +
      Buffer.byteLength(script) +
      "字节；PNG " +
      image.length +
      "字节",
  );
  return { card, image, script };
}
if (require.main === module) build();
module.exports = { build, bundle, unpack, evaluateGate };
