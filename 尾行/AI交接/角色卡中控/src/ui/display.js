"use strict";
const CONFIG = require("./generated/rules.json");
const SWEET = CONFIG.heart.sweet;

const LINES = CONFIG.heart.lines;

const heartToBpm = (v) =>
  v < 40
    ? 45 + v * 0.25
    : v < 65
      ? 55 + (v - 40) * 0.8
      : v < 90
        ? 75 + (v - 65) * 1.2
        : 105 + (v - 90) * 2.5;

const heartFreq = (v) => (v >= 90 ? 50 : 58);

const DIST_NAMES = {
  far: "目视远端",
  same: "同街",
  close: "身后",
  touch: "贴身",
};

const SLOT_NAMES = {
  prepare: "准备",
  e18_21: "行动窗口",
  e21_23: "行动窗口",
  e23_01: "深夜窗口",
  late: "凌晨窗口",
};

const MODE_NAMES = {
  prepare: "准备期",
  stealth: "潜行",
  contact: "接触",
  vehicle: "车厢",
};

const lineOf = (heart) => {
  const [d, c] = LINES;
  return heart >= c ? "crash" : heart >= d ? "deform" : "";
};
module.exports = {
  SWEET,
  LINES,
  heartToBpm,
  heartFreq,
  DIST_NAMES,
  SLOT_NAMES,
  MODE_NAMES,
  lineOf,
};
