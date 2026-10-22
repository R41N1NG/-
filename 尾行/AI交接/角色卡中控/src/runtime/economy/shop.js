"use strict";
const RULES = require("../../config/rules.json");
const CONFIG = require("../../config/economy.json").commerce;
const clone = (x) => JSON.parse(JSON.stringify(x));
const error = (message) =>
  Object.assign(Error(message), { code: "DAY_UNAVAILABLE" });
function catalog(ctx, channel = "retail") {
  if (!["retail", "black_market"].includes(channel))
    throw error("未知购物渠道");
  if (
    channel === "black_market" &&
    !RULES.identity.list[ctx.identity]?.blackMarket
  )
    throw error("当前身份没有黑市渠道");
  return Object.values(RULES.items)
    .filter(
      (item) =>
        Object.prototype.hasOwnProperty.call(CONFIG.deliveryDays, item.type) &&
        Number.isSafeInteger(item.price) &&
        item.price > 0,
    )
    .map((item) => {
      const equipment = CONFIG.deliveryDays[item.type] > 0;
      const discount =
        channel === "black_market" && equipment
          ? RULES.identity.blackMarketDiscount
          : 0;
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        unitPrice: Math.round(item.price * (1 - discount)),
        deliveryDays: CONFIG.deliveryDays[item.type],
        note:
          item.type === "device"
            ? "购买仅入库，设备安装功能待接"
            : item.effectsDesc || "",
        owned:
          (ctx.player.inventory || []).find((x) => x.id === item.id)?.count ||
          0,
      };
    });
}
const handler = {
  available: () => null,
  view: (ctx) => ({
    type: "shop",
    cash: ctx.ledger.cash,
    channels: [
      { id: "retail", name: "商场" },
      ...(RULES.identity.list[ctx.identity]?.blackMarket
        ? [{ id: "black_market", name: "黑市（器材九折）" }]
        : []),
    ],
    catalogs: {
      retail: catalog(ctx),
      ...(RULES.identity.list[ctx.identity]?.blackMarket
        ? { black_market: catalog(ctx, "black_market") }
        : {}),
    },
    maxQuantity: CONFIG.maxQuantity,
    maxCartLines: CONFIG.maxCartLines,
    note: "一批采买消耗 1 点；普通品当次入库，器材隔日到货。",
  }),
  prepare(ctx, args) {
    if (
      !Array.isArray(args.cart) ||
      !args.cart.length ||
      args.cart.length > CONFIG.maxCartLines
    )
      throw error("请选择商品，购物清单不能为空或超长");
    const channel = args.channel || "retail",
      items = new Map(catalog(ctx, channel).map((x) => [x.id, x])),
      quantities = new Map();
    for (const line of args.cart) {
      if (
        !line ||
        !items.has(line.id) ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > CONFIG.maxQuantity
      )
        throw error("商品或数量无效");
      const qty = (quantities.get(line.id) || 0) + line.quantity;
      if (qty > CONFIG.maxQuantity) throw error("同一商品数量过多");
      quantities.set(line.id, qty);
    }
    const lines = [...quantities].map(([id, quantity]) => {
      const item = items.get(id);
      return {
        id,
        quantity,
        unitPrice: item.unitPrice,
        dueDate: ctx.ledger.date + item.deliveryDays,
        delivered: item.deliveryDays === 0,
      };
    });
    const total = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    if (!Number.isSafeInteger(total) || ctx.ledger.cash < total)
      throw error("现金不足，本次未扣费");
    const economy = clone(ctx.economy);
    // 仅压缩已完成订单，未到货订单始终保留。
    if (economy.orders.length >= CONFIG.maxOrders) {
      const index = economy.orders.findIndex((o) =>
        o.lines.every((l) => l.delivered),
      );
      if (index < 0) throw error("待收货订单已满，请先等待到货");
      economy.orders.splice(index, 1);
    }
    economy.orders.push({
      id: `order-${ctx.ledger.date}-${ctx.dayPlan.sequence || 0}`,
      date: ctx.ledger.date,
      total,
      channel,
      lines,
    });
    const inventory = lines
      .filter((l) => l.delivered)
      .map((l) => ({ id: l.id, add: l.quantity }));
    const delayed = lines.some((l) => !l.delivered);
    return {
      summary: `采买完成，支付 ${total}${delayed ? "；器材将在下一天到货" : "；商品已入库"}`,
      ledger: { cash: -total },
      inventory,
      economy,
    };
  },
};
function deliverDue(ctx, date) {
  const economy = clone(ctx.economy),
    counts = new Map();
  for (const order of economy.orders)
    for (const line of order.lines) {
      if (!line.delivered && line.dueDate <= date) {
        counts.set(line.id, (counts.get(line.id) || 0) + line.quantity);
        line.delivered = true;
      }
    }
  const inventory = [...counts].map(([id, add]) => ({ id, add }));
  return {
    summary: inventory.length
      ? `收到 ${inventory.reduce((s, l) => s + l.add, 0)} 件到货商品`
      : "",
    inventory,
    economy,
  };
}
function economyView(economy) {
  return {
    workedOn: economy.workedOn,
    lastWork: economy.lastWork,
    orders: economy.orders
      .slice()
      .reverse()
      .map((o) => ({
        ...o,
        lines: o.lines.map((l) => ({ ...l, name: RULES.items[l.id].name })),
      })),
  };
}
module.exports = { catalog, handler, deliverDue, economyView };
