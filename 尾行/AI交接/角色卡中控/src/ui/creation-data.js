"use strict";
const CONFIG = require("./generated/rules.json");
const PRESENTATION = require("./creation-presentation.json");

const IDENTITY_DATA = {
  list: Object.fromEntries(
    Object.entries(CONFIG.identities).map(([id, rule]) => [
      id,
      { ...PRESENTATION[id], ...rule },
    ]),
  ),
};

const TARGET_DATA = { list: CONFIG.targets, content: CONFIG.targetContent };

const TARGET_NAME_POOL = CONFIG.generator.namePool;

const TARGET_PERSONALITY_POOL = CONFIG.generator.personalityPool;

const TARGET_HOBBY_POOL = CONFIG.generator.hobbyPool;

const TARGET_SHOE_POOL = CONFIG.generator.shoePool;

const TARGET_STAT_DELTA_OPTIONS = CONFIG.generator.statDelta.options;

const { generateTargetPersona } = require("../persona/generator.js");

const PRESETS = [
  {
    id: "otaku",
    label: "技术宅",
    pts: { str: 2, agi: 3, nrv: 2, int: 7, cha: 6 },
    note: "键盘后观察，镜头前结巴",
  },
  {
    id: "coach",
    label: "健身教练",
    pts: { str: 5, agi: 4, nrv: 5, int: 4, cha: 2 },
    note: "一身力气，一张笨嘴",
  },
  {
    id: "guard",
    label: "退伍保安",
    pts: { str: 4, agi: 5, nrv: 6, int: 3, cha: 2 },
    note: "胆壮体硬，眼嘴都笨",
  },
  {
    id: "detective",
    label: "侦探学徒",
    pts: { str: 2, agi: 5, nrv: 4, int: 6, cha: 3 },
    note: "均衡偏观察的跟单学徒",
  },
  {
    id: "bartender",
    label: "夜场酒保",
    pts: { str: 2, agi: 4, nrv: 5, int: 4, cha: 5 },
    note: "嘴皮子吃饭，夜路里泡大",
  },
];

const ATTR_NAMES = {
  str: "体格",
  agi: "敏捷",
  nrv: "胆量",
  int: "情报",
  cha: "口才",
};

const TIER = {
  str: [
    "病弱虚胖",
    "普通男性",
    "常干体力活",
    "重体力行当、退役兵",
    "职业力量运动员",
  ],
  agi: [
    "反应慢半拍",
    "常人，打车追两步",
    "利落，人堆里钻得动",
    "练过短跑散打的脚步",
    "职业选手脚程",
  ],
  nrv: [
    "惊弓鸟，容易僵住",
    "害怕但能喊能跑",
    "沉得住，夜路不慌",
    "老刑警的心脏",
    "泰山崩于前",
  ],
  int: [
    "钥匙丢哪都不知道",
    "见大事漏细节",
    "心细，认脸过目七八成",
    "私家侦探，破绽难逃",
    "一个眼神读出小传",
  ],
  cha: [
    "紧张就语无伦次",
    "寒暄可以，急了结巴",
    "会聊，话能圆回来",
    "律师主播级",
    "读心，演谁像谁",
  ],
};

const tierOf = (k, v) =>
  TIER[k][v <= 2 ? 0 : v <= 4 ? 1 : v <= 6 ? 2 : v <= 8 ? 3 : 4];

const POINT_BUDGET = 20;
module.exports = {
  IDENTITY_DATA,
  TARGET_DATA,
  TARGET_NAME_POOL,
  TARGET_PERSONALITY_POOL,
  TARGET_HOBBY_POOL,
  TARGET_SHOE_POOL,
  TARGET_STAT_DELTA_OPTIONS,
  generateTargetPersona,
  PRESETS,
  ATTR_NAMES,
  TIER,
  tierOf,
  POINT_BUDGET,
};
