"use strict";
// 交通线只读真实站点和线路配置；绘图不生成乘车、移动或结算命令。
function drawTransit({ svg, map, text }) {
  const layer = svg("g", {
    class: "wx-map-transit-layer",
    "aria-label": "城市交通网络",
  });
  const nodes = new Map(map.nodes.map((n) => [n.id, n]));
  const served = new Map();
  const colors = { metro: "#327b9c", bus: "#b67c39", road: "#667b6d" };
  for (const r of map.transit || []) {
    const points = r.path.map((p) =>
      typeof p === "string"
        ? nodes.has(p)
          ? [nodes.get(p).x, nodes.get(p).y]
          : null
        : p,
    );
    if (points.some((p) => !p)) continue;
    const line = svg("g", {
      "data-transit-line": r.id,
      class: `wx-map-transit ${r.kind}`,
    });
    const d = points
      .map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`)
      .join(" ");
    line.append(
      svg("path", { d, class: "wx-transit-casing" }),
      svg("path", { d, class: "wx-transit-route" }),
    );
    const label = text(line, r.name, ...r.label, "wx-transit-label");
    label.setAttribute("data-line-label", r.id);
    layer.append(line);
    for (const id of r.stops) {
      const old = served.get(id) || [];
      old.push(r);
      served.set(id, old);
    }
  }
  for (const [id, routes] of served) {
    const n = nodes.get(id);
    if (!n) continue;
    const station = svg("g", {
      "data-transit-stop": id,
      class: "wx-transit-stop",
      "aria-label": `${n.name}：${routes.map((r) => r.name).join("、")}`,
    });
    station.append(
      svg("circle", {
        cx: n.x,
        cy: n.y,
        r: routes.length > 1 ? 11 : 8,
        fill: "#f8f5e7",
        stroke: colors[routes[0].kind],
        "stroke-width": 3,
      }),
    );
    if (routes.length > 1)
      station.append(
        svg("circle", { cx: n.x, cy: n.y, r: 5, fill: colors[routes[0].kind] }),
      );
    layer.append(station);
  }
  return layer;
}
module.exports = { drawTransit };
