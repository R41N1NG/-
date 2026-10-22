"use strict";
// 选工作、组购物清单仅收集 ID 和数量；价格、资格和收益在引擎复核。
function createEconomyInputsUI({ document, lifecycle, status }) {
  const panel = document.createElement("div"),
    orders = document.createElement("details");
  panel.className = "wx-economy-input";
  panel.id = "wxEconomyInput";
  panel.hidden = true;
  orders.className = "wx-economy-orders";
  orders.id = "wxEconomyOrders";
  orders.hidden = true;
  status?.before(panel, orders);
  let active = null;
  const key = (snap) =>
    JSON.stringify([snap?.dayPlan?.sync, snap?.dayPlan?.token]);
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function close(args = null) {
    if (!active) return;
    const resolve = active.resolve;
    active = null;
    panel.replaceChildren();
    panel.hidden = true;
    resolve(args);
  }
  function open(snap, title, build) {
    close();
    panel.hidden = false;
    const form = node("form");
    form.setAttribute("aria-label", title);
    form.append(node("h3", title));
    panel.replaceChildren(form);
    const promise = new Promise((resolve) => {
      active = { resolve, key: key(snap) };
    });
    const body = node("div", undefined, "wx-economy-body"),
      foot = node("div", undefined, "wx-economy-foot");
    const confirm = node("button"),
      cancel = node("button", "取消");
    confirm.type = "submit";
    confirm.dataset.economySubmit = "true";
    cancel.type = "button";
    cancel.onclick = () => close();
    form.append(body, foot);
    foot.append(confirm, cancel);
    build(form, body, confirm, snap);
    panel.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    return promise;
  }
  function selectWork(snap) {
    return open(snap, "选择工作", (form, body, confirm) => {
      const action = snap.dayActions.find((x) => x.id === "daily.work"),
        input = action.input;
      body.append(node("p", input.note));
      const list = node("div", undefined, "wx-work-list");
      body.append(list);
      const initial = input.jobs.find((x) => x.enabled);
      let selected = initial?.id;
      for (const job of input.jobs) {
        const label = node("label", undefined, "wx-work-choice"),
          radio = node("input");
        radio.type = "radio";
        radio.name = "wxJob";
        radio.value = job.id;
        radio.disabled = !job.enabled;
        radio.checked = job.id === selected;
        radio.onchange = () => (selected = radio.value);
        const text = node("span");
        text.append(
          node("strong", job.name),
          node("span", `收入 ${job.income} · 体力 −${job.stamina}`),
          node("small", job.reason || job.note),
        );
        if (!job.enabled) label.classList.add("unavailable");
        label.append(radio, text);
        list.append(label);
      }
      confirm.textContent = `确认工作 · ${action.cost} 点`;
      confirm.disabled = !initial;
      form.onsubmit = (e) => {
        e.preventDefault();
        if (selected) close({ jobId: selected });
      };
    });
  }
  function selectShop(snap, id = "daily.shop") {
    const title =
      snap.dayActions.find((x) => x.id === id)?.input?.title || "采购";
    return open(snap, title, (form, body, confirm) => {
      const action = snap.dayActions.find((x) => x.id === id),
        input = action.input;
      body.append(node("p", input.note));
      const channel = node("select");
      channel.setAttribute("aria-label", "购物渠道");
      input.channels.forEach((c) => {
        const option = node("option", c.name);
        option.value = c.id;
        channel.append(option);
      });
      body.append(channel);
      const list = node("div", undefined, "wx-shop-list"),
        total = node("p");
      total.dataset.economyTotal = "true";
      body.append(list, total);
      const quantities = new Map();
      let invalid = false;
      function cart() {
        return [...quantities]
          .filter(([, quantity]) => quantity > 0)
          .map(([id, quantity]) => ({ id, quantity }));
      }
      function update() {
        const items = input.catalogs[channel.value];
        invalid = [...quantities.values()].some(
          (v) => !Number.isSafeInteger(v) || v < 0 || v > input.maxQuantity,
        );
        const entries = cart(),
          price = entries.reduce(
            (sum, line) =>
              sum +
              items.find((x) => x.id === line.id).unitPrice * line.quantity,
            0,
          );
        total.textContent = `总价 ${price} / 现金 ${input.cash} · 行动点 ${action.cost}${invalid ? " · 数量无效" : price > input.cash ? " · 现金不足" : ""}`;
        confirm.disabled =
          invalid ||
          !entries.length ||
          price > input.cash ||
          entries.length > input.maxCartLines;
        confirm.textContent = `付款 ${price} · ${action.cost} 点`;
      }
      function renderCatalog() {
        list.replaceChildren();
        for (const item of input.catalogs[channel.value]) {
          const label = node("label", undefined, "wx-shop-line"),
            text = node("span");
          text.append(
            node("strong", `${item.name} · ${item.unitPrice}`),
            node(
              "small",
              `${item.deliveryDays ? "隔日到货" : "当次入库"} · 已持有 ${item.owned}${item.note ? " · " + item.note : ""}`,
            ),
          );
          const quantity = node("input");
          quantity.type = "number";
          quantity.min = "0";
          quantity.max = String(input.maxQuantity);
          quantity.step = "1";
          quantity.value = String(quantities.get(item.id) || 0);
          quantity.dataset.itemId = item.id;
          quantity.setAttribute("aria-label", `${item.name}数量`);
          quantity.oninput = () => {
            quantities.set(
              item.id,
              quantity.value === "" ? 0 : Number(quantity.value),
            );
            update();
          };
          label.append(text, quantity);
          list.append(label);
        }
        update();
      }
      channel.onchange = renderCatalog;
      renderCatalog();
      form.onsubmit = (e) => {
        e.preventDefault();
        update();
        if (!confirm.disabled) close({ channel: channel.value, cart: cart() });
      };
    });
  }
  function render(snap) {
    if (active && active.key !== key(snap)) close();
    orders.replaceChildren();
    const history = snap?.economy?.orders || [];
    orders.hidden = !history.length;
    if (!history.length) return;
    const pending = history.filter((o) =>
      o.lines.some((l) => !l.delivered),
    ).length;
    orders.append(node("summary", `订单与到货 · 待收货 ${pending} 笔`));
    for (const order of history) {
      const row = node("div", undefined, "wx-order");
      row.append(node("strong", `第 ${order.date} 天 · ${order.total}`));
      for (const line of order.lines)
        row.append(
          node(
            "p",
            `${line.name} ×${line.quantity} · ${line.delivered ? "已入库" : `第 ${line.dueDate} 天到货`}`,
          ),
        );
      orders.append(row);
    }
  }
  function reset() {
    close();
    orders.hidden = true;
    orders.replaceChildren();
  }
  lifecycle.cleanup?.(() => {
    reset();
    panel.remove();
    orders.remove();
  });
  return {
    providers: [
      ["daily.work", selectWork],
      ["daily.shop", (snap) => selectShop(snap)],
      ["daily.black_market", (snap) => selectShop(snap, "daily.black_market")],
    ],
    render,
    reset,
  };
}
module.exports = { createEconomyInputsUI };
