"use strict";
const RULES = require("../config/rules.json");
const CONFIG = require("../config/economy.json").commerce;
const clone = (x) => JSON.parse(JSON.stringify(x));
const invalid = () =>
  Object.assign(Error("工作或订单存档无效，原进度已保留"), {
    code: "SAVE_INVALID",
  });
const integer = (v, min = 0) => Number.isSafeInteger(v) && v >= min;
function createEconomy() {
  return { schema: 1, workedOn: null, lastWork: null, orders: [] };
}
function validateEconomy(value) {
  if (
    !value ||
    value.schema !== 1 ||
    (value.workedOn !== null && !integer(value.workedOn, 1)) ||
    !Array.isArray(value.orders) ||
    value.orders.length > CONFIG.maxOrders
  )
    throw invalid();
  if (
    value.lastWork !== null &&
    (!value.lastWork ||
      !integer(value.lastWork.date, 1) ||
      typeof value.lastWork.jobId !== "string" ||
      !integer(value.lastWork.income) ||
      typeof value.lastWork.name !== "string" ||
      value.workedOn !== value.lastWork.date)
  )
    throw invalid();
  const seen = new Set();
  for (const order of value.orders) {
    if (
      !order ||
      typeof order.id !== "string" ||
      !order.id ||
      seen.has(order.id) ||
      !integer(order.date, 1) ||
      !integer(order.total, 1) ||
      !["retail", "black_market"].includes(order.channel) ||
      !Array.isArray(order.lines) ||
      !order.lines.length ||
      order.lines.length > CONFIG.maxCartLines
    )
      throw invalid();
    seen.add(order.id);
    let total = 0;
    const items = new Set();
    for (const line of order.lines) {
      if (
        !line ||
        !Object.prototype.hasOwnProperty.call(RULES.items, line.id) ||
        items.has(line.id) ||
        !integer(line.quantity, 1) ||
        line.quantity > CONFIG.maxQuantity ||
        !integer(line.unitPrice, 1) ||
        !integer(line.dueDate, order.date) ||
        typeof line.delivered !== "boolean"
      )
        throw invalid();
      items.add(line.id);
      total += line.unitPrice * line.quantity;
    }
    if (!Number.isSafeInteger(total) || total !== order.total) throw invalid();
  }
  return clone(value);
}
module.exports = { createEconomy, validateEconomy };
