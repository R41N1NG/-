"use strict";
const { drawCityMap } = require("./cartography.js");
function createCityMapUI({
  document,
  window,
  lifecycle,
  getGlue,
  openAction,
  reportSyncError,
}) {
  const root = document.getElementById("wxCityMap"),
    canvas = document.getElementById("wxCityCanvas"),
    tabs = document.getElementById("wxCityTabs"),
    info = document.getElementById("wxCityInfo"),
    position = document.getElementById("wxCityPosition"),
    notice = document.getElementById("wxCityNotice");
  const NS = "http://www.w3.org/2000/svg";
  let snapshot = null,
    view = null,
    selected = null,
    pending = null,
    retry = null,
    counter = 0,
    zoomed = false,
    showTransit = true;
  let pointerStart = null,
    dragged = false;
  lifecycle.on(canvas, "pointerdown", (e) => {
    pointerStart = { x: e.clientX, y: e.clientY };
    dragged = false;
  });
  lifecycle.on(canvas, "pointerup", (e) => {
    dragged =
      !!pointerStart &&
      Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 7;
    pointerStart = null;
  });
  const el = (tag, text) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const svg = (tag, attrs = {}) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    return e;
  };
  const same = (a, b) => a?.scope === b?.scope && a?.epoch === b?.epoch;
  function reset() {
    snapshot = null;
    zoomed = false;
    showTransit = true;
    view = null;
    selected = null;
    pending = null;
    retry = null;
    canvas?.replaceChildren();
    tabs?.replaceChildren();
    info?.replaceChildren();
    if (position) position.textContent = "等待地图数据";
    if (notice) notice.textContent = "";
  }
  function render(snap) {
    if (!root || !snap?.cityMap) return reset();
    if (snapshot && !same(snapshot.dayPlan.sync, snap.dayPlan.sync)) {
      view = null;
      zoomed = false;
      showTransit = true;
      selected = null;
      pending = null;
      retry = null;
      if (notice) notice.textContent = "";
    }
    const oldPlayer = snapshot?.cityMap.player.placeId;
    snapshot = snap;
    const map = snap.cityMap;
    if (view === null || (oldPlayer && oldPlayer !== map.player.placeId))
      view = map.player.district;
    if (!selected) selected = map.player.placeId;
    const target = map.target;
    if (snap.dailyMoves) {
      const note = root.querySelector(".wx-city-note");
      if (note)
        note.textContent =
          "点击地点直接移动；同区1格、跨区2格，每时段3格，不扣行动点。分区切换、缩放和拖动只浏览；目标位置仅在实际目视时更新。";
    }
    position.textContent = `你在：${map.player.name}${map.player.assumed ? "（待确认位置）" : ""} · ${target ? `${target.status}：${target.name}${target.live ? "" : `（第 ${target.date} 天）`}` : "目标位置：尚无目击记录"}`;
    tabs.replaceChildren();
    for (const item of [{ id: "all", name: "全城" }, ...map.frames]) {
      const b = el("button", item.name);
      b.type = "button";
      b.dataset.mapDistrict = item.id;
      b.setAttribute("aria-pressed", String(view === item.id));
      tabs.append(b);
    }
    for (const [mode, title] of [
      ["fit", "适合屏幕"],
      ["detail", "放大查看"],
    ]) {
      const b = el("button", title);
      b.type = "button";
      b.dataset.mapZoom = mode;
      b.className = "wx-map-zoom-control";
      b.setAttribute(
        "aria-pressed",
        String(mode === (zoomed ? "detail" : "fit")),
      );
      tabs.append(b);
    }
    const transitToggle = el("button", "交通线路");
    transitToggle.type = "button";
    transitToggle.dataset.mapTransit = "true";
    transitToggle.setAttribute("aria-pressed", String(showTransit));
    tabs.append(transitToggle);
    canvas.classList.toggle("is-zoomed", zoomed);
    canvas.replaceChildren(
      drawCityMap({ svg, map, view, selected, showTransit }),
    );
    const nodes = new Map(map.nodes.map((n) => [n.id, n]));
    const n = nodes.get(selected);
    info.replaceChildren();
    if (!n) return;
    info.append(
      el("strong", n.name),
      el(
        "p",
        n.hidden
          ? "尚未探明的私人区域，地图不能代替场所进入条件。"
          : `所在区域：${map.frames.find((f) => f.id === n.district).name}`,
      ),
    );
    if (n.facility) info.append(el("p", n.facility.note));
    const lines = (map.transit || []).filter((r) => r.stops.includes(n.id));
    for (const r of lines) info.append(el("p", `${r.name}：${r.note}`));
    const names = map.edges
      .filter((e) => e.from === n.id || e.to === n.id)
      .map((e) => nodes.get(e.from === n.id ? e.to : e.from)?.name)
      .filter(Boolean);
    info.append(el("p", `通路连接：${[...new Set(names)].join("、")}`));
    const move = el("button", n.moveReason || "前往这里 · 市内移动不耗行动点");
    move.type = "button";
    move.dataset.mapMove = n.id;
    move.disabled = !!pending || !!n.moveReason || !snap.dayPlan.sync;
    move.hidden = !!snap.dailyMoves;
    info.append(move);
    if (n.service === "black_market") {
      const action = snap.dayActions.find((a) => a.id === "daily.black_market"),
        buy = el("button", "打开黑市采购 · 1 点");
      buy.type = "button";
      buy.dataset.mapMarket = "true";
      buy.disabled = !!pending || !action?.enabled || !snap.dayPlan.sync;
      info.append(buy);
    }
    if (retry) {
      const button = el("button", "重试上次移动");
      button.type = "button";
      button.dataset.mapRetry = "true";
      button.disabled = !!pending;
      info.append(button);
    }
  }
  async function move(request) {
    const op = { request };
    pending = op;
    render(snapshot);
    try {
      const result = await getGlue().command("executeDailyCommand", request);
      if (
        lifecycle.disposed ||
        pending !== op ||
        !same(snapshot?.dayPlan.sync, request.sync)
      )
        return;
      retry = null;
      notice.textContent = result.summary;
    } catch (error) {
      if (
        lifecycle.disposed ||
        pending !== op ||
        !same(snapshot?.dayPlan.sync, request.sync)
      )
        return;
      notice.textContent = error.message;
      if (
        ["WRITE_FAILED", "READ_FAILED", "WRITE_CONFLICT"].includes(error.code)
      ) {
        retry = request;
        reportSyncError(error);
      } else retry = null;
    } finally {
      if (pending === op) {
        pending = null;
        if (snapshot && !lifecycle.disposed) render(snapshot);
      }
    }
  }
  function choose(event) {
    if (event.target.closest?.("[data-map-transit]")) {
      showTransit = !showTransit;
      render(snapshot);
      return;
    }
    const zoom = event.target.closest?.("[data-map-zoom]");
    if (zoom) {
      zoomed = zoom.dataset.mapZoom === "detail";
      render(snapshot);
      if (!zoomed) canvas.scrollLeft = 0;
      else {
        const map = snapshot.cityMap;
        const frame = map.frames.find((f) => f.id === view);
        const n = map.nodes.find(
          (n) => n.id === selected && (!frame || n.district === frame.id),
        );
        if (n) {
          const start = frame ? frame.x - 18 : 0;
          const width = frame ? frame.width + 36 : map.width;
          canvas.scrollLeft =
            ((n.x - start) / width) *
              canvas.firstElementChild.getBoundingClientRect().width -
            canvas.clientWidth / 2;
        }
      }
      return;
    }
    const tab = event.target.closest?.("[data-map-district]");
    if (tab) {
      view = tab.dataset.mapDistrict;
      const map = snapshot.cityMap;
      if (
        view !== "all" &&
        !map.nodes.some((n) => n.id === selected && n.district === view)
      ) {
        const local = map.nodes.filter((n) => n.district === view && !n.hidden);
        selected = (local.find((n) => n.service) || local[0])?.id || selected;
      }
      zoomed = false;
      render(snapshot);
      canvas.scrollLeft = 0;
      return;
    }
    const node = event.target.closest?.("[data-place-id]");
    if (node) {
      if (snapshot.dailyMoves && dragged) {
        dragged = false;
        return;
      }
      selected = node.dataset.placeId;
      render(snapshot);
      if (snapshot.dailyMoves && !pending && snapshot.dayPlan.sync) {
        const q = snapshot.dailyMoves[selected];
        if (q?.reason) {
          notice.textContent = q.reason;
          return;
        }
        move({
          operationId:
            window.crypto?.randomUUID?.() || `map-${Date.now()}-${++counter}`,
          command: "move",
          args: { placeId: selected },
          expected: { ...snapshot.dayPlan.token },
          sync: { ...snapshot.dayPlan.sync },
        });
      }
      return;
    }
    const market = event.target.closest?.("[data-map-market]");
    if (market && !market.disabled) {
      openAction("daily.black_market");
      return;
    }
    const button = event.target.closest?.("[data-map-move],[data-map-retry]");
    if (!button || button.disabled || pending || !snapshot?.dayPlan.sync)
      return;
    if (button.dataset.mapRetry) return move(retry);
    const request = {
      operationId:
        window.crypto?.randomUUID?.() || `map-${Date.now()}-${++counter}`,
      command: "move",
      args: { placeId: button.dataset.mapMove },
      expected: { ...snapshot.dayPlan.token },
      sync: { ...snapshot.dayPlan.sync },
    };
    move(request);
  }
  lifecycle.on(root, "click", choose);
  lifecycle.on(canvas, "keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(e);
    }
  });
  return { render, reset };
}
module.exports = { createCityMapUI };
