"use strict";
// 引擎共享常量。模块间通过本文件引用，避免互相导入。
const DIST_KEY = { far: "far", same: "same", close: "close", touch: "touch" };
const DIST_CN = { far: "远端", same: "同街", close: "身后", touch: "贴身" };
const DIST_RANK = { far: 0, same: 1, close: 2, touch: 3 };
const DIST_DOWN = { touch: "close", close: "same", same: "far", far: "far" };
const CA_CN = {
  front: "正面",
  side: "侧面",
  back: "背面",
  "three-quarter": "斜侧",
};
/* 每晚天气掷（二十六节锚：晴夜 70% / 小雨 20% / 暴雨 10%，1d20 区间映射） */
const WEATHER_BANDS = { clear: [1, 14], rain: [15, 18], storm: [19, 20] };
const WEATHER_ICON = { clear: "🌙 晴夜", rain: "🌧 小雨", storm: "⛈ 暴雨" };
const HUNTER_MODES = ["stealth", "contact", "vehicle"];
/* 跟缀族词族（v0.8 刺激接线）：持续暴露类动作，刺激按段一泵、距离定档 */
const TAIL_PUMP_IDS = [
  "follow",
  "ride_along",
  "transfer",
  "follow_work",
  "ride_follow",
  "car_follow",
];
const SHOE_ID_MAP = {
  shoe_heel: "heel",
  shoe_flats: "flats",
  shoe_sneakers: "sneakers",
  shoe_barefoot: "barefoot",
  shoe_slippers: "slippers",
  shoe_boots: "boots",
  shoe_platform: "platform",
  shoe_sandals: "sandals",
  shoe_leather: "leather",
};

/* 步声距离系数：越近越响（主人定稿）。声级 = round(步声基准 × 系数)，钳在 0~5 */
const SHOE_DIST_FACTOR = { far: 0.6, same: 1.0, close: 1.25, touch: 1.5 };

module.exports = {
  DIST_KEY,
  DIST_CN,
  DIST_RANK,
  DIST_DOWN,
  CA_CN,
  WEATHER_BANDS,
  WEATHER_ICON,
  HUNTER_MODES,
  TAIL_PUMP_IDS,
  SHOE_ID_MAP,
  SHOE_DIST_FACTOR,
};
