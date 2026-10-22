"use strict";
// 地图画面只读配置与位置投影，不计算移动、目击或采购资格。
const art = require("../../config/city-cartography.json");
const { drawTransit } = require("./transit.js");
function drawCityMap({ svg, map, view, selected, showTransit = true }) {
  const frame = map.frames.find((f) => f.id === view);
  const viewHeight = frame
    ? frame.height + (view === "C" ? 110 : 40)
    : map.height;
  const drawing = svg("svg", {
    width: frame ? frame.width + 36 : map.width,
    height: viewHeight,
    viewBox: frame
      ? `${frame.x - 18} ${frame.y - 15} ${frame.width + 36} ${viewHeight}`
      : `0 0 ${map.width} ${map.height}`,
    role: "group",
    "aria-label": "城市街区地图：道路、建筑、绿地与位置",
  });
  drawing.classList.toggle("overview", view === "all");
  const text = (parent, value, x, y, cls, extra = {}) => {
    const e = svg("text", {
      x,
      y,
      class: cls,
      "text-anchor": "middle",
      ...extra,
    });
    e.textContent = value;
    parent.append(e);
    return e;
  };
  drawing.append(
    svg("rect", {
      x: 0,
      y: 0,
      width: map.width,
      height: map.height,
      class: "wx-map-land",
    }),
  );
  // 区域以实际街块铺开，保留过渡带；不再用四个框装地点连线。
  for (const f of map.frames)
    drawing.append(
      svg("rect", {
        x: f.x - 16,
        y: f.y - 18,
        width: f.width + 32,
        height: f.height + 38,
        rx: 22,
        class: `wx-map-ground ground-${f.id}`,
      }),
    );
  for (const [x, y, width, height] of art.world.fields) {
    const field = svg("g", { class: "wx-map-countryside" });
    field.append(svg("rect", { x, y, width, height, rx: 8 }));
    for (let dx = 12; dx < width; dx += 18)
      field.append(
        svg("path", { d: `M ${x + dx} ${y + 10} v ${height - 20}` }),
      );
    drawing.append(field);
  }
  drawing.append(svg("path", { d: art.world.river, class: "wx-map-water" }));
  text(drawing, "江　面", ...art.world.waterLabel, "wx-map-water-label");
  for (const label of art.world.labels)
    text(drawing, label.text, ...label.at, `wx-map-area-label ${label.kind}`);
  const roads = [];
  const road = (parent, points, width, kind, name, label) => {
    const d = points
      .map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`)
      .join(" ");
    const group = svg("g", { class: `wx-map-street ${kind || "street"}` });
    group.append(
      svg("path", { d, class: "road-edge", "stroke-width": width + 3 }),
      svg("path", { d, class: "road-surface", "stroke-width": width }),
    );
    if (kind === "highway")
      group.append(svg("path", { d, class: "road-center" }));
    parent.append(group);
    if (name && label)
      roads.push({
        parent,
        name,
        label,
        vertical: points[0][0] === points[1][0],
      });
  };
  for (const r of art.world.arterials)
    road(drawing, r.points, r.width, r.kind, r.name, r.label);
  for (const bridge of art.world.bridges) {
    road(drawing, bridge.points, bridge.width, "bridge");
    const [a, b] = bridge.points;
    for (const dy of [-bridge.width / 2, bridge.width / 2])
      drawing.append(
        svg("path", {
          d: `M ${a[0]} ${a[1] + dy} L ${b[0]} ${b[1] + dy}`,
          class: "wx-map-bridge-rail",
        }),
      );
  }
  for (const f of map.frames) {
    const data = art.districts[f.id];
    const g = svg("g", {
      transform: `translate(${f.x} ${f.y})`,
      "data-region": f.id,
    });
    drawing.append(g);
    // 地块与屋面构成地理底图；它们不注册新的可玩地点。
    data.blocks.forEach((b, index) => {
      const [x, y, width, height] = b.box;
      const parcel = svg("g", { class: `wx-map-block ${b.kind}` });
      parcel.append(
        svg("rect", {
          x,
          y,
          width,
          height,
          rx: b.kind === "forest" ? 26 : 4,
          class: "parcel",
        }),
      );
      const green = ["forest", "park", "garden"].includes(b.kind);
      if (green) {
        for (let cy = y + 17; cy < y + height - 8; cy += 30)
          for (let cx = x + 14; cx < x + width - 8; cx += 30) {
            parcel.append(
              svg("circle", {
                cx: cx + (Math.round(cy) % 2 ? 4 : 0),
                cy,
                r: b.kind === "forest" ? 10 : 6,
                class: "tree",
              }),
            );
          }
        parcel.append(
          svg("path", {
            d: `M ${x + 8} ${y + height - 9} L ${x + width / 2} ${y + height / 2} L ${x + width - 8} ${y + 9}`,
            class: "park-path",
          }),
        );
      } else {
        // 屋面内沿、天井和楼顶设备，保持俯视读法。
        parcel.append(
          svg("rect", {
            x: x + 6,
            y: y + 6,
            width: width - 12,
            height: height - 12,
            rx: 2,
            class: "roof",
          }),
        );
        if (width > 70 && height > 50) {
          parcel.append(
            svg("rect", {
              x: x + width - 29,
              y: y + 11,
              width: 14,
              height: 9,
              class: "roof-unit",
            }),
          );
          if (b.kind === "office")
            for (let w = x + 12; w < x + width - 13; w += 15)
              parcel.append(
                svg("path", {
                  d: `M ${w} ${y + height - 17} v 9`,
                  class: "roof-window",
                }),
              );
        }
        if (b.kind === "campus") {
          parcel.append(
            svg("rect", {
              x: x + 10,
              y: y + height - 24,
              width: width - 20,
              height: 14,
              rx: 2,
              class: "campus-yard",
            }),
          );
        }
      }
      g.append(parcel);
    });
    data.roads.forEach((r) =>
      road(g, r.points, r.width, r.kind, r.name, r.label),
    );
    // 天桥画作跨路设施，和道路、楼房有明确区别。
    if (f.id === "A" || f.id === "B") {
      g.append(
        svg("rect", {
          x: 225,
          y: 124,
          width: 50,
          height: 12,
          class: "wx-map-footbridge",
        }),
      );
      g.append(
        svg("path", {
          d: "M 229 125 v 10 m 8 -10 v 10 m 8 -10 v 10 m 8 -10 v 10 m 8 -10 v 10 m 8 -10 v 10",
          class: "wx-map-bridge-steps",
        }),
      );
    }
    // 路口斑马线提供尺度，避免画面读成抽象关系图。
    if (f.id !== "D") {
      for (let x = 270; x <= 284; x += 5)
        g.append(
          svg("path", { d: `M ${x} 136 v 18`, class: "wx-map-crosswalk" }),
        );
    }
  }
  // 道路名最后铺在街面，竖向文字保持竖排、不倒置。
  for (const r of roads)
    text(
      r.parent,
      r.name,
      ...r.label,
      "wx-map-street-label",
      r.vertical ? { "writing-mode": "vertical-rl" } : {},
    );
  if (showTransit) drawing.append(drawTransit({ svg, map, text }));
  for (const f of map.frames) {
    text(
      drawing,
      `${f.id}区 · ${f.name}`,
      f.x + f.width / 2,
      f.y + 19,
      "wx-map-district-title",
    );
    text(
      drawing,
      art.districts[f.id].subtitle,
      f.x + f.width / 2,
      f.y + 42,
      "wx-map-district-subtitle",
    );
  }
  const nodes = new Map(map.nodes.map((n) => [n.id, n]));
  const positioned = new Set([map.player.placeId, map.target?.placeId]);
  const stationIds = new Set(
    showTransit ? (map.transit || []).flatMap((r) => r.stops) : [],
  );
  for (const n of map.nodes) {
    const [shortName, kind] = art.landmarks[n.id];
    const label = n.hidden ? "未探明区域" : shortName;
    const hitWidth = Math.max(
      94,
      label.length * (view === "all" ? 26 : 15) + 12,
    );
    const g = svg("g", {
      "data-place-id": n.id,
      role: "button",
      tabindex:
        (view !== "all" && n.district !== view) ||
        (view === "all" &&
          !art.overview.includes(n.id) &&
          !stationIds.has(n.id) &&
          !positioned.has(n.id) &&
          n.id !== selected)
          ? -1
          : 0,
      "aria-hidden": view !== "all" && n.district !== view ? "true" : "false",
      "aria-label": n.name,
      class: `wx-city-node kind-${kind}${n.hidden ? " unknown" : ""}${selected === n.id ? " selected" : ""}${n.service ? " service" : ""}${art.overview.includes(n.id) || stationIds.has(n.id) ? " overview-landmark" : ""}${positioned.has(n.id) ? " positioned" : ""}`,
    });
    const title = svg("title");
    title.textContent = n.name;
    g.append(title);
    g.append(
      svg("rect", {
        x: n.x - hitWidth / 2,
        y: n.y - 30,
        width: hitWidth,
        height: stationIds.has(n.id) ? 66 : 54,
        rx: 5,
        class: "wx-map-place-hit",
      }),
    );
    // 地图短名只缩短已知名称；私人区域未解锁时不透出住宅／门锁名称。
    text(g, label, n.x, n.y + (stationIds.has(n.id) ? 26 : 5), "wx-city-label");
    if (
      n.service ||
      ["metro", "bus", "school", "office", "gas"].includes(kind)
    ) {
      const symbols = {
        metro: "M",
        bus: "BUS",
        school: n.id === "high_school_gate_b" ? "高" : "大",
        office: "楼",
        gas: "油",
        home: "家",
        black_market: "黑市",
      };
      g.append(
        svg("rect", {
          x: n.x - 14,
          y: n.y - 36,
          width: 28,
          height: 19,
          rx: 3,
          class: "wx-map-place-icon",
        }),
      );
      text(g, symbols[kind] || "店", n.x, n.y - 22, "wx-map-icon-label");
    }
    drawing.append(g);
  }
  const target = map.target;
  function mark(id, kind) {
    const n = nodes.get(id);
    if (!n) return;
    const offset =
      map.player.placeId === target?.placeId
        ? kind === "player"
          ? -18
          : 18
        : 0;
    const x = n.x + offset,
      y = n.y - 53;
    const g = svg("g", {
      class: `wx-map-${kind}`,
      "aria-label": kind === "player" ? "玩家位置" : target.status,
    });
    g.append(
      svg("path", {
        d: `M ${x - 6} ${y + 10} L ${x} ${y + 21} L ${x + 6} ${y + 10}`,
        class: "wx-map-pin-tip",
      }),
    );
    g.append(
      svg("circle", {
        cx: x,
        cy: y,
        r: 13,
        class: kind === "target" && !target.live ? "last-seen" : "",
      }),
    );
    text(
      g,
      kind === "player" ? "你" : target.live ? "目" : "忆",
      x,
      y + 4,
      "wx-map-pin-label",
    );
    drawing.append(g);
  }
  mark(map.player.placeId, "player");
  if (target) mark(target.placeId, "target");
  // 每个视图都保留北向；地图无旋转，切换街区不改变空间方向。
  const nx = frame ? frame.x + frame.width - 30 : map.width - 65,
    ny = frame ? frame.y + 58 : 55;
  const compass = svg("g", { class: "wx-map-compass" });
  compass.append(svg("path", { d: `M ${nx} ${ny} l -7 20 l 7 -5 l 7 5 Z` }));
  text(compass, "北", nx, ny - 8, "wx-map-compass-label");
  drawing.append(compass);
  return drawing;
}
module.exports = { drawCityMap };
