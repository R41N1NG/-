"use strict";
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
    counter = 0;
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
    position.textContent = `你在：${map.player.name}${map.player.assumed ? "（旧档起始位置）" : ""} · ${target ? `${target.status}：${target.name}${target.live ? "" : `（第 ${target.date} 天）`}` : "目标位置：尚无目击记录"}`;
    tabs.replaceChildren();
    for (const item of [{ id: "all", name: "全城" }, ...map.frames]) {
      const b = el("button", item.name);
      b.type = "button";
      b.dataset.mapDistrict = item.id;
      b.setAttribute("aria-pressed", String(view === item.id));
      tabs.append(b);
    }
    const frame = map.frames.find((f) => f.id === view),
      box = frame
        ? `${frame.x - 12} ${frame.y - 12} ${frame.width + 24} ${frame.height + 24}`
        : `0 0 ${map.width} ${map.height}`;
    const drawing = svg("svg", {
      viewBox: box,
      role: "img",
      "aria-label": "城市地点与通路示意图",
    });
    drawing.classList.toggle("overview", view === "all");
    const defs = svg("defs"),
      marker = svg("marker", {
        id: "wxMapArrow",
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 5,
        markerHeight: 5,
        orient: "auto-start-reverse",
      });
    marker.append(svg("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#697d87" }));
    defs.append(marker);
    drawing.append(defs);
    drawing.append(
      svg("path", {
        d: "M 25 1110 Q 240 1050 460 1125 T 1080 1080",
        class: "wx-city-river",
      }),
    );
    for (const f of map.frames) {
      const g = svg("g", { "data-region": f.id });
      g.append(
        svg("rect", {
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          rx: 14,
          class: "wx-city-region",
        }),
      );
      const title = svg("text", {
        x: f.x + 16,
        y: f.y + 29,
        class: "wx-city-region-title",
      });
      title.textContent = f.name;
      g.append(title);
      drawing.append(g);
    }
    const nodes = new Map(map.nodes.map((n) => [n.id, n]));
    for (const edge of map.edges) {
      const a = nodes.get(edge.from),
        b = nodes.get(edge.to);
      if (!a || !b) continue;
      drawing.append(
        svg("line", {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          class: `wx-city-road${edge.transit ? " transit" : ""}${a.hidden || b.hidden ? " unknown" : ""}`,
          ...(edge.oneWay ? { "marker-end": "url(#wxMapArrow)" } : {}),
        }),
      );
    }
    for (const n of map.nodes) {
      const g = svg("g", {
        "data-place-id": n.id,
        role: "button",
        tabindex: 0,
        "aria-label": n.name,
        class: `wx-city-node${n.hidden ? " unknown" : ""}${selected === n.id ? " selected" : ""}${n.service ? " service" : ""}`,
      });
      const title = svg("title");
      title.textContent = n.name;
      g.append(
        title,
        svg("circle", { cx: n.x, cy: n.y, r: n.service ? 7 : 5 }),
      );
      const label = svg("text", {
        x: n.x,
        y: n.y - 13,
        "text-anchor": "middle",
        class: "wx-city-label",
      });
      label.textContent = n.name.length > 9 ? n.name.slice(0, 8) + "…" : n.name;
      g.append(label);
      drawing.append(g);
    }
    function mark(id, kind) {
      const n = nodes.get(id);
      if (!n) return;
      const offset =
        map.player.placeId === target?.placeId
          ? kind === "player"
            ? -9
            : 9
          : 0;
      const g = svg("g", {
        class: `wx-map-${kind}`,
        "aria-label": kind === "player" ? "玩家位置" : target.status,
      });
      g.append(
        svg("circle", {
          cx: n.x + offset,
          cy: n.y,
          r: 12,
          class: kind === "target" && !target.live ? "last-seen" : "",
        }),
      );
      drawing.append(g);
    }
    mark(map.player.placeId, "player");
    if (target) mark(target.placeId, "target");
    const north = svg("text", { x: 50, y: 65, class: "wx-city-north" });
    north.textContent = "北 ↑";
    drawing.append(north);
    canvas.replaceChildren(drawing);
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
    const names = map.edges
      .filter((e) => e.from === n.id || e.to === n.id)
      .map((e) => nodes.get(e.from === n.id ? e.to : e.from)?.name)
      .filter(Boolean);
    info.append(el("p", `通路连接：${[...new Set(names)].join("、")}`));
    const move = el("button", n.moveReason || "前往这里 · 市内移动不耗行动点");
    move.type = "button";
    move.dataset.mapMove = n.id;
    move.disabled = !!pending || !!n.moveReason || !snap.dayPlan.sync;
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
    const tab = event.target.closest?.("[data-map-district]");
    if (tab) {
      view = tab.dataset.mapDistrict;
      render(snapshot);
      return;
    }
    const node = event.target.closest?.("[data-place-id]");
    if (node) {
      selected = node.dataset.placeId;
      render(snapshot);
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
