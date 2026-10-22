"use strict";
const RULES = require("../../config/rules.json");
const CONFIG = require("../../config/economy.json").commerce;
const clone = (x) => JSON.parse(JSON.stringify(x));
const error = (message) =>
  Object.assign(Error(message), { code: "DAY_UNAVAILABLE" });
function catalog(ctx, channel = "online") {
  if (!["online", "black_market"].includes(channel))
    throw error("旧商场渠道已调整，请重新选择线上补给或黑市");
  if (
    channel === "black_market" &&
    ctx.spatial?.playerPlaceId !== CONFIG.blackMarketPlace
  )
    throw error("请先通过地图前往临江黑市");
  const foods = new Set(CONFIG.onlineItemIds);
  return Object.values(RULES.items)
    .filter(
      (item) =>
        Object.prototype.hasOwnProperty.call(CONFIG.deliveryDays, item.type) &&
        Number.isSafeInteger(item.price) &&
        item.price > 0 &&
        (channel === "online"
          ? foods.has(item.id)
          : !foods.has(item.id) && item.type !== "consumable"),
    )
    .map((item) => {
      const discount =
        channel === "black_market" &&
        RULES.identity.list[ctx.identity]?.blackMarket
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
function createShopHandler(channel) {
  const isBlack = channel === "black_market";
  return {
    available: (ctx) =>
      isBlack && ctx.spatial.playerPlaceId !== CONFIG.blackMarketPlace
        ? "请先通过地图前往临江黑市"
        : null,
    view: (ctx) => ({
      type: "shop",
      actionId: isBlack ? "daily.black_market" : "daily.shop",
      title: isBlack ? "临江黑市采购" : "线上食品补给",
      cash: ctx.ledger.cash,
      channels: [
        {
          id: channel,
          name: isBlack
            ? "临江黑市" +
              (RULES.identity.list[ctx.identity]?.blackMarket
                ? "（身份九折）"
                : "")
            : "线上补给",
        },
      ],
      catalogs: {
        [channel]:
          isBlack && ctx.spatial.playerPlaceId !== CONFIG.blackMarketPlace
            ? []
            : catalog(ctx, channel),
      },
      maxQuantity: CONFIG.maxQuantity,
      maxCartLines: CONFIG.maxCartLines,
      note: isBlack
        ? "固定场所采购；器材按原供货规则到货。确认一批消耗 1 点。"
        : "仅售食品补给；浏览不扣点，确认一批消耗 1 点。行动点恢复食品待定。",
    }),
    prepare(ctx, args) {
      if (args.channel && args.channel !== channel)
        throw error("采购入口与渠道不一致");
      if (
        !Array.isArray(args.cart) ||
        !args.cart.length ||
        args.cart.length > CONFIG.maxCartLines
      )
        throw error("请选择商品，清单不能为空或超长");
      const items = new Map(catalog(ctx, channel).map((x) => [x.id, x])),
        quantities = new Map();
      for (const line of args.cart) {
        if (
          !line ||
          !items.has(line.id) ||
          !Number.isSafeInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > CONFIG.maxQuantity
        )
          throw error("当前渠道不出售该商品，或数量无效");
        const quantity = (quantities.get(line.id) || 0) + line.quantity;
        if (quantity > CONFIG.maxQuantity) throw error("同一商品数量过多");
        quantities.set(line.id, quantity);
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
      if (economy.orders.length >= CONFIG.maxOrders) {
        const index = economy.orders.findIndex((o) =>
          o.lines.every((l) => l.delivered),
        );
        if (index < 0) throw error("待收货订单已满");
        economy.orders.splice(index, 1);
      }
      economy.orders.push({
        id: `order-${ctx.ledger.date}-${ctx.dayPlan.sequence || 0}`,
        date: ctx.ledger.date,
        total,
        channel,
        lines,
      });
      return {
        summary: `${isBlack ? "黑市采购" : "线上补给"}完成，支付 ${total}${lines.some((l) => !l.delivered) ? "；器材将在下一天到货" : "；商品已入库"}`,
        ledger: { cash: -total },
        inventory: lines
          .filter((l) => l.delivered)
          .map((l) => ({ id: l.id, add: l.quantity })),
        economy,
      };
    },
  };
}
const handler = createShopHandler("online"),
  blackMarketHandler = createShopHandler("black_market");
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
module.exports = {
  catalog,
  handler,
  blackMarketHandler,
  deliverDue,
  economyView,
};
