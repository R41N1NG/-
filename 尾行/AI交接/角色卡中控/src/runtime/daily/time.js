"use strict";
// 预览暂定时间格；与行动点、尾行内部回合分开维护。
const periods = require("../../config/day-plan.json").periods;
const RULES = Object.freeze({
  perPeriod: 3,
  sameDistrict: 1,
  crossDistrict: 2,
});
function timeUsed(value = 0) {
  if (!Number.isInteger(value) || value < 0 || value >= RULES.perPeriod)
    throw Object.assign(Error("日程时间记录无效：collegeSession.timeUsed"), {
      code: "SAVE_INVALID",
    });
  return value;
}
function travelCost(from, to) {
  return from.district === to.district
    ? RULES.sameDistrict
    : RULES.crossDistrict;
}
function arrival(plan, used, cost) {
  timeUsed(used);
  if (plan.ended || plan.activity) throw Error("当前不能普通移动");
  const left = (periods.length - plan.period) * RULES.perPeriod - used;
  if (cost > left) throw Error("本次移动超过本日剩余时间，请先结束当天安排");
  const total = used + cost,
    crosses = total >= RULES.perPeriod;
  const ended = crosses && plan.period === periods.length - 1;
  return {
    period: plan.period + (crosses && !ended ? 1 : 0),
    used: ended ? 0 : total % RULES.perPeriod,
    ended,
  };
}
module.exports = { RULES, timeUsed, travelCost, arrival };
