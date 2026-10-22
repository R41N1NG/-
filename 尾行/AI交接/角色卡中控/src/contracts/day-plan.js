"use strict";
const RULES = require("../config/day-plan.json");
const copy = (value) => JSON.parse(JSON.stringify(value));
// 日程字段为整卡存档的一部分；阶段与每日行动点不能从聊天楼号推算。
function createDayPlan(slot = "e21_23") {
  const period =
    slot === "prepare" ? 2 : ["e23_01", "late"].includes(slot) ? 4 : 3;
  return {
    schema: 1,
    period,
    spent: 0,
    activity: null,
    ended: false,
    source: "legacy",
  };
}
function validateDayPlan(value) {
  if (
    !value ||
    value.schema !== 1 ||
    !Number.isInteger(value.period) ||
    value.period < 0 ||
    value.period >= RULES.periods.length ||
    !Number.isInteger(value.spent) ||
    value.spent < 0 ||
    value.spent > RULES.budget ||
    typeof value.ended !== "boolean" ||
    !["legacy", "daily"].includes(value.source)
  )
    throw Object.assign(new Error("日程数据无效"), { code: "SAVE_INVALID" });
  if (
    value.sequence !== undefined &&
    (!Number.isInteger(value.sequence) || value.sequence < 0)
  )
    throw Object.assign(new Error("日程版本无效"), { code: "SAVE_INVALID" });
  if (
    value.receipts !== undefined &&
    (!Array.isArray(value.receipts) ||
      value.receipts.length > 32 ||
      value.receipts.some(
        (r) =>
          !r ||
          typeof r.operationId !== "string" ||
          typeof r.requestKey !== "string" ||
          typeof r.summary !== "string",
      ))
  )
    throw Object.assign(new Error("日程回执无效"), { code: "SAVE_INVALID" });
  const a = value.activity;
  if (
    a !== null &&
    (!a ||
      typeof a.id !== "string" ||
      !a.id ||
      a.id.length > 128 ||
      !["routine", "tailing"].includes(a.kind) ||
      typeof a.name !== "string" ||
      !a.name ||
      a.name.length > 64 ||
      !Number.isInteger(a.cost) ||
      a.cost < 0 ||
      a.cost > RULES.budget ||
      a.cost > value.spent ||
      (a.kind === "tailing" && a.cost !== RULES.tailingCost))
  )
    throw Object.assign(new Error("日程活动数据无效"), {
      code: "SAVE_INVALID",
    });
  if (value.ended && (value.period !== RULES.periods.length - 1 || a !== null))
    throw Object.assign(new Error("日程结束状态无效"), {
      code: "SAVE_INVALID",
    });
  return copy(value);
}
function dayPlanView(value, date) {
  const state = validateDayPlan(value);
  return {
    ...state,
    date,
    budget: RULES.budget,
    remaining: RULES.budget - state.spent,
    tailingCost: RULES.tailingCost,
    periodName: RULES.periods[state.period].name,
  };
}
module.exports = {
  DAY_PLAN_RULES: RULES,
  createDayPlan,
  validateDayPlan,
  dayPlanView,
};
