"use strict";
const definitions = require("../../config/daily-actions.json");
const { DAY_PLAN_RULES } = require("../../contracts/day-plan.js");
const clone = (value) => JSON.parse(JSON.stringify(value));
// 扩展为可信本地代码；模型回复和 UI 请求不能注册处理器或声明效果。
const handlers = {
  rest: {
    available: (ctx) =>
      ctx.ledger.stamina >= ctx.player.staminaMax ? "体力已满" : null,
    prepare: (ctx, args, def) => ({
      ledger: {
        stamina: Math.min(
          def.recovery,
          ctx.player.staminaMax - ctx.ledger.stamina,
        ),
      },
      summary: `休息完成，恢复 ${Math.min(def.recovery, ctx.player.staminaMax - ctx.ledger.stamina)} 点体力`,
    }),
  },
  pass: { available: () => null, prepare: () => ({ summary: "已度过本时段" }) },
  work: { available: () => "暂无可接工作", prepare: null },
  shop: { available: () => "当前没有可用商店", prepare: null },
  talk: { available: () => "当前没有可开展的交流事件", prepare: null },
  tailing: { available: () => "当前没有可接入的出行机会", prepare: null },
};
function createDailyRegistry(extensions = []) {
  const entries = new Map();
  function add(def, handler) {
    if (
      !def ||
      typeof def.id !== "string" ||
      !/^daily\.[a-z][a-z0-9_]*$/.test(def.id) ||
      typeof def.name !== "string" ||
      !def.name ||
      !Number.isInteger(def.cost) ||
      def.cost < 0 ||
      def.cost > DAY_PLAN_RULES.budget ||
      !["instant", "scene"].includes(def.mode) ||
      !["routine", "tailing"].includes(def.kind) ||
      (def.kind === "tailing" && def.cost !== DAY_PLAN_RULES.tailingCost) ||
      typeof def.effect !== "string" ||
      !handler ||
      typeof handler.available !== "function"
    )
      throw Error("日程活动注册无效");
    entries.set(def.id, { definition: clone(def), handler });
  }
  definitions.forEach((def) => add(def, handlers[def.handler]));
  extensions.forEach(({ definition, handler }) => add(definition, handler));
  return { list: () => [...entries.values()], get: (id) => entries.get(id) };
}
module.exports = { createDailyRegistry };
