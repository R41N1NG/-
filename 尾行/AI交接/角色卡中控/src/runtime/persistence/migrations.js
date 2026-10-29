"use strict";
const { LIMITS } = require("../ledger.js");
const {
  normalizePersona,
  validatePersona,
} = require("../../contracts/persona.js");
const { validateDayPlan } = require("../../contracts/day-plan.js");
const CURRENT_SAVE_VERSION = 2;
/** Copy and migrate; unknown versions/corrupt values must never become a new game. */
function migrateSave(saved) {
  if (!saved || typeof saved !== "object" || ![1, 2].includes(saved.v))
    throw Object.assign(new Error("不支持的存档版本"), {
      code: "SAVE_VERSION_UNSUPPORTED",
    });
  const copy = JSON.parse(JSON.stringify(saved));
  if (
    !Number.isInteger(copy.floor) ||
    copy.floor < 0 ||
    typeof copy.sessionSalt !== "string" ||
    !copy.ledgerState
  )
    throw Object.assign(new Error("存档缺少有效回合、随机状态或账本"), {
      code: "SAVE_INVALID",
    });
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const value = copy.ledgerState[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      throw Object.assign(new Error(`存档账目无效：${key}`), {
        code: "SAVE_INVALID",
      });
  }
  for (const [key, value] of Object.entries(copy.ledgerState))
    if (
      !Object.prototype.hasOwnProperty.call(LIMITS, key) ||
      typeof value !== "number" ||
      !Number.isFinite(value)
    )
      throw Object.assign(new Error(`存档账目无效：${key}`), {
        code: "SAVE_INVALID",
      });
  if (copy.v === 1) {
    copy.rngVersion ??= 1; // 保留旧档随机流，已确认的结果不会因升级重掷。
    copy.nightStartFloor ??= 0;
    copy.v = 2;
  }
  if (
    ![1, 2].includes(copy.rngVersion) ||
    !Number.isInteger(copy.nightStartFloor) ||
    copy.nightStartFloor < 0 ||
    copy.nightStartFloor > copy.floor
  )
    throw Object.assign(new Error("存档时间或随机版本无效"), {
      code: "SAVE_INVALID",
    });
  if (copy.collegeSession !== undefined)
    require("../../contracts/college-session").validateCollegeSession(
      copy.collegeSession,
    );
  if (copy.dayPlan !== undefined) validateDayPlan(copy.dayPlan);
  copy.targetPersona = normalizePersona(copy.targetPersona);
  validatePersona(copy.targetPersona, copy.targetId || "college", {
    references: false,
  });
  return copy;
}
module.exports = { CURRENT_SAVE_VERSION, migrateSave };
