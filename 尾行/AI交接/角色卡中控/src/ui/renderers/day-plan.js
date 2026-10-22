"use strict";
const {
  DAY_PLAN_RULES,
  validateDayPlan,
} = require("../../contracts/day-plan.js");
function createDayPlanRenderer({ document }) {
  const bar = document.getElementById("wxDayPlan");
  const put = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  function reset() {
    if (bar) {
      bar.dataset.state = "empty";
      delete bar.dataset.source;
    }
    put("wxDayDate", "等待开局");
    put("wxDayPeriod", "—");
    put("wxDayAp", "—");
    put("wxDayBudget", "—");
    put("wxDayActivity", "尚无日程记录");
    put("wxDayHint", "每日行动与时段");
    const rail = document.getElementById("wxDayPeriods");
    if (rail) rail.replaceChildren();
    const pips = document.getElementById("wxDayApPips");
    if (pips) pips.replaceChildren();
  }
  function render(snap) {
    const data = snap?.dayPlan;
    if (!data) return reset();
    try {
      validateDayPlan(data);
      if (!Number.isInteger(data.date) || data.date < 1)
        throw Error("invalid date");
    } catch {
      reset();
      put("wxDayActivity", "日程数据暂不可用");
      return;
    }
    const remaining = DAY_PLAN_RULES.budget - data.spent;
    if (bar) {
      bar.dataset.state = data.ended
        ? "ended"
        : data.activity
          ? "active"
          : "ready";
      bar.dataset.source = data.source;
    }
    put("wxDayDate", `第 ${data.date} 天`);
    put(
      "wxDayPeriod",
      data.ended ? "本日结束" : DAY_PLAN_RULES.periods[data.period].name,
    );
    put("wxDayAp", String(remaining));
    put("wxDayBudget", String(DAY_PLAN_RULES.budget));
    put(
      "wxDayActivity",
      data.source === "legacy"
        ? "原有夜间流程"
        : data.activity
          ? data.activity.name
          : data.ended
            ? "本日安排已结束"
            : "尚未选择行动",
    );
    put(
      "wxDayHint",
      data.source === "legacy"
        ? "日程活动尚未启用"
        : data.activity
          ? "本次活动结束后进入下一时段"
          : "每时段 1 次行动 · 尾行消耗 2 点",
    );
    const pips = document.getElementById("wxDayApPips");
    if (pips) {
      pips.replaceChildren();
      for (let i = 0; i < DAY_PLAN_RULES.budget; i++) {
        const node = document.createElement("i");
        node.className = i < remaining ? "available" : "used";
        pips.append(node);
      }
    }
    const rail = document.getElementById("wxDayPeriods");
    if (rail) {
      rail.replaceChildren();
      DAY_PLAN_RULES.periods.forEach((period, i) => {
        const node = document.createElement("li");
        node.textContent = period.name;
        node.dataset.phase =
          i < data.period || data.ended
            ? "past"
            : i === data.period
              ? "current"
              : "future";
        if (i === data.period && !data.ended)
          node.setAttribute("aria-current", "step");
        rail.append(node);
      });
    }
  }
  return { render, reset };
}
module.exports = { createDayPlanRenderer };
