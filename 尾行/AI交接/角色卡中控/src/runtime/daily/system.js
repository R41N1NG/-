"use strict";
const {
  DAY_PLAN_RULES,
  createDayPlan,
  validateDayPlan,
} = require("../../contracts/day-plan.js");
const { validateEconomy } = require("../../contracts/economy.js");
const { deliverDue } = require("../economy/shop.js");
const { LIMITS } = require("../ledger.js");
const ITEMS = require("../../config/rules.json").items;
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (code, message) => Object.assign(new Error(message), { code });
function createDailySystem({
  g,
  L,
  registry,
  nextDay,
  afterCommit = () => {},
}) {
  function context() {
    return clone({
      player: g.player,
      ledger: L.state,
      dayPlan: g.dayPlan,
      world: g.world,
      targetId: g.targetId,
      identity: g.identity,
      economy: g.economy,
    });
  }
  function token() {
    return {
      date: L.get("date"),
      period: g.dayPlan.period,
      sequence: g.dayPlan.sequence || 0,
    };
  }
  function reason(entry) {
    const p = g.dayPlan;
    if (p.source !== "daily") return "请先启用日程安排";
    if (p.ended) return "本日已结束";
    if (p.activity) return "请先结束当前活动";
    if (DAY_PLAN_RULES.budget - p.spent < entry.definition.cost)
      return "行动点不足";
    let unavailable;
    try {
      unavailable = entry.handler.available(context());
    } catch {
      return "活动条件模块暂不可用";
    }
    if (unavailable) return String(unavailable);
    if (typeof entry.handler.prepare !== "function")
      return "当前没有可执行的活动内容";
    return null;
  }
  function activities() {
    return registry.list().map((entry) => {
      const unavailable = reason(entry);
      let input;
      try {
        input = entry.handler.view?.(context());
      } catch {
        return {
          ...clone(entry.definition),
          enabled: false,
          reason: "活动内容暂不可用",
        };
      }
      return {
        ...clone(entry.definition),
        ...(input ? { input } : {}),
        enabled: !unavailable,
        reason: unavailable,
      };
    });
  }
  function controls() {
    const p = g.dayPlan;
    if (p.source === "legacy")
      return [
        {
          command: "enable",
          name: "试用日程安排",
          effect: "从当前时段开始；尾行入场条件待接通",
          enabled: !(
            g.floor > 0 &&
            g.route &&
            g.route.here < g.route.nodes.length - 1
          ),
          reason: "请先完成当前原有流程",
        },
      ];
    if (p.ended)
      return [
        {
          command: "next-day",
          name: "进入下一天",
          effect: `每日恢复 ${DAY_PLAN_RULES.budget} 点，未使用的行动点不保留`,
          enabled: true,
        },
      ];
    if (!p.activity) return [];
    const entry = registry.get(p.activity.actionId);
    return ["finish", "cancel"].map((command) => ({
      command,
      name: command === "finish" ? "完成本次活动" : "结束本次活动",
      effect: "不退还已消耗点数，进入下一时段",
      enabled: typeof entry?.handler[command] === "function",
      reason: "当前活动的结束条件尚未接通",
    }));
  }
  function advance(p) {
    if (p.period < DAY_PLAN_RULES.periods.length - 1) p.period++;
    else p.ended = true;
  }
  function applyEffects(result) {
    if (!result || typeof result.summary !== "string")
      throw fail("DAY_EFFECT_INVALID", "活动没有有效结算结果");
    if (
      Object.keys(result).some(
        (key) =>
          !["summary", "ledger", "payload", "inventory", "economy"].includes(
            key,
          ),
      )
    )
      throw fail("DAY_EFFECT_INVALID", "活动含有尚未支持的效果类型");
    const ledger = result.ledger || {};
    for (const [key, value] of Object.entries(ledger)) {
      if (
        !Object.prototype.hasOwnProperty.call(LIMITS, key) ||
        key === "date" ||
        !Number.isFinite(value)
      )
        throw fail("DAY_EFFECT_INVALID", "活动数值效果无效");
      if (
        L.get(key) + value < LIMITS[key][0] ||
        L.get(key) + value > LIMITS[key][1]
      )
        throw fail("DAY_EFFECT_INVALID", "活动效果超出数值范围");
    }
    const inventory = clone(g.player.inventory || []);
    if (result.inventory !== undefined) {
      if (!Array.isArray(result.inventory) || result.inventory.length > 50)
        throw fail("DAY_EFFECT_INVALID", "物品效果无效");
      for (const change of result.inventory) {
        if (
          !change ||
          !Object.prototype.hasOwnProperty.call(ITEMS, change.id) ||
          !Number.isSafeInteger(change.add) ||
          change.add < 1 ||
          change.add > 999
        )
          throw fail("DAY_EFFECT_INVALID", "物品效果无效");
        const item = inventory.find((i) => i.id === change.id);
        if (item) {
          item.count = (item.count || 1) + change.add;
          if (!Number.isSafeInteger(item.count))
            throw fail("DAY_EFFECT_INVALID", "物品数量无效");
        } else
          inventory.push({ id: change.id, count: change.add, equipped: false });
      }
    }
    const economy =
      result.economy === undefined ? null : validateEconomy(result.economy);
    return { ledger, inventory, economy };
  }
  function execute(request) {
    if (
      !request ||
      typeof request.operationId !== "string" ||
      !request.operationId ||
      request.operationId.length > 128
    )
      throw fail("DAY_REQUEST_INVALID", "活动请求无效");
    let requestKey;
    try {
      requestKey = JSON.stringify(request);
    } catch {
      throw fail("DAY_REQUEST_INVALID", "活动请求无法保存");
    }
    if (typeof requestKey !== "string" || requestKey.length > 8192)
      throw fail("DAY_REQUEST_INVALID", "活动请求过长");
    const p = validateDayPlan(g.dayPlan);
    const cached = (p.receipts || []).find(
      (r) => r.operationId === request.operationId,
    );
    if (cached) {
      if (
        cached.command !== request.command ||
        cached.actionId !== (request.actionId || null) ||
        cached.requestKey !== requestKey
      )
        throw fail("DAY_REQUEST_INVALID", "重复请求内容不一致");
      return { ...clone(cached), reused: true };
    }
    const expected = request.expected,
      current = token();
    if (
      !expected ||
      expected.date !== current.date ||
      expected.period !== current.period ||
      expected.sequence !== current.sequence
    )
      throw fail("DAY_STALE", "日程已变化，请按当前状态重新选择");
    const before = {
      date: current.date,
      period: p.period,
      remaining: DAY_PLAN_RULES.budget - p.spent,
    };
    let next = clone(p),
      result = { summary: "" },
      ledger = {},
      inventory = null,
      economy = null,
      cost = 0;
    if (request.command === "enable") {
      if (p.source !== "legacy") throw fail("DAY_STALE", "日程已经启用");
      if (
        (g.floor || 0) > 0 &&
        g.route &&
        g.route.here < g.route.nodes.length - 1
      )
        throw fail("DAY_BUSY", "请先完成当前原有流程，再启用日程安排");
      next.source = "daily";
      next.spent = 0;
      next.activity = null;
      result.summary = "已从当前时段启用日程安排";
    } else if (request.command === "start") {
      const entry = registry.get(request.actionId);
      if (!entry) throw fail("DAY_UNKNOWN", "没有这项日程活动");
      const unavailable = reason(entry);
      if (unavailable) throw fail("DAY_UNAVAILABLE", unavailable);
      // 处理器只拿脱离引擎引用的数据，返回效果；不直接修改 g 或账本。
      result = entry.handler.prepare(
        context(),
        clone(request.args || {}),
        clone(entry.definition),
      );
      ({ ledger, inventory, economy } = applyEffects(result));
      cost = entry.definition.cost;
      next.spent += cost;
      if (entry.definition.mode === "scene") {
        next.activity = {
          id: request.operationId,
          actionId: entry.definition.id,
          kind: entry.definition.kind,
          name: entry.definition.name,
          cost,
          payload: clone(result.payload || {}),
        };
      } else advance(next);
    } else if (["finish", "cancel"].includes(request.command)) {
      if (
        p.source !== "daily" ||
        !p.activity ||
        request.activityId !== p.activity.id
      )
        throw fail("DAY_STALE", "当前活动已经变化");
      const entry = registry.get(p.activity.actionId);
      if (!entry) throw fail("DAY_UNKNOWN", "当前活动的处理模块不可用");
      const handler =
        request.command === "finish"
          ? entry.handler.finish
          : entry.handler.cancel;
      if (typeof handler !== "function")
        throw fail("DAY_UNAVAILABLE", "当前活动暂不能在这里结束");
      result = handler(context(), clone(request.args || {}), clone(p.activity));
      ({ ledger, inventory, economy } = applyEffects(result));
      next.activity = null;
      advance(next);
    } else if (request.command === "next-day") {
      if (p.source !== "daily" || !p.ended || p.activity)
        throw fail("DAY_UNAVAILABLE", "请先结束当天的安排");
      // 复用现有整卡日期、天气与角色状态轮转，不另写一套日历。
      const arrivals = deliverDue(context(), L.get("date") + 1);
      ({ ledger, inventory, economy } = applyEffects(arrivals));
      const outcome = nextDay();
      if (outcome?.blocked) throw fail("DAY_BUSY", outcome.reason);
      next = {
        ...createDayPlan(),
        source: "daily",
        period: 0,
        receipts: p.receipts || [],
      };
      result.summary = `新的一天开始，行动点恢复至 ${DAY_PLAN_RULES.budget} 点${arrivals.summary ? "；" + arrivals.summary : ""}`;
    } else throw fail("DAY_REQUEST_INVALID", "不支持的日程操作");
    next.sequence = (p.sequence || 0) + 1;
    const receipt = {
      operationId: request.operationId,
      command: request.command,
      actionId: request.actionId || null,
      requestKey,
      cost,
      before,
      after: {
        date: L.get("date"),
        period: next.period,
        remaining: DAY_PLAN_RULES.budget - next.spent,
      },
      summary: result.summary,
    };
    next.receipts = [...(next.receipts || []), receipt].slice(-32);
    next.lastReceipt = receipt;
    validateDayPlan(next);
    if (Object.keys(ledger).length)
      L.commit(ledger, { reason: "daily-activity", action: request.actionId });
    if (inventory) g.player.inventory = inventory;
    if (economy) g.economy = economy;
    g.dayPlan = next;
    afterCommit();
    // 五时段只在完整活动结束时推进，内部回合不能改变此处。
    if (!next.activity) {
      g.env = next.period < 3 ? "day" : "night";
      g.slot =
        next.period < 3 ? "prepare" : next.period === 3 ? "e21_23" : "e23_01";
    }
    return clone(receipt);
  }
  return { activities, controls, execute, token };
}
module.exports = { createDailySystem };
