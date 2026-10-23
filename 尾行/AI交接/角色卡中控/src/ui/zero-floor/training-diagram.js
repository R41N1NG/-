"use strict";
// 无状态教学插图：只取公开地理配置，不接收引擎、路线、人物档案或存档。
const { trainingExample } = require("../generated/rules.json");
const { districts } = require("../../config/city-cartography.json");
function drawTrainingDiagram(document, exampleScene) {
  const svg = (tag, attrs = {}) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs))
      el.setAttribute(key, String(value));
    return el;
  };
  const root = svg("svg", {
    viewBox: "0 0 480 340",
    focusable: "false",
    "aria-hidden": "true",
  });
  const text = (value, x, y, cls, anchor = "middle") => {
    const el = svg("text", { x, y, class: cls, "text-anchor": anchor });
    el.textContent = value;
    root.append(el);
  };
  root.append(
    svg("rect", { width: 480, height: 340, class: "training-map-ground" }),
  );
  // 沿用正式 B 区地块和街道，裁切出公开大学城；不描绘住宅内部。
  for (const {
    box: [x, y, width, height],
    kind,
  } of districts.B.blocks) {
    if (x + width > 440 || y + height > 335) continue;
    root.append(
      svg("rect", {
        x,
        y,
        width,
        height,
        rx: 5,
        class: `training-map-block ${kind}`,
      }),
    );
    root.append(
      svg("rect", {
        x: x + 6,
        y: y + 6,
        width: width - 12,
        height: height - 12,
        rx: 2,
        class: "training-map-roof",
      }),
    );
  }
  for (const road of districts.B.roads) {
    const d = road.points
      .map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`)
      .join(" ");
    root.append(
      svg("path", {
        d,
        "stroke-width": road.width + 3,
        class: "training-map-road-edge",
      }),
    );
    root.append(
      svg("path", {
        d,
        "stroke-width": road.width,
        class: "training-map-road",
      }),
    );
  }
  // 教学示例白名单，不使用场所搜索或目标的实际路线推测起点。
  for (const {
    id,
    name,
    at: [x, y],
  } of trainingExample) {
    text(
      name,
      x,
      y + 5,
      id === "school_gate_b"
        ? "training-map-label focus"
        : "training-map-label",
    );
  }
  text("学府路", 360, 155, "training-map-road-label");
  text("老街", 250, 305, "training-map-road-label");
  root.append(
    svg("rect", {
      x: 24,
      y: 54,
      width: 232,
      height: 92,
      rx: 7,
      class: "training-map-highlight",
    }),
  );
  root.append(
    svg("path", {
      d: "M 24 73 V 54 H 43 M 237 54 H 256 V 73 M 256 127 V 146 H 237 M 43 146 H 24 V 127",
      class: "training-map-corners",
    }),
  );
  // 箭头指向校门框而非虚构的目标标记；标注随 SVG 同比例缩放。
  root.append(
    svg("path", {
      d: "M 289 94 H 275 V 105 H 259",
      class: "training-map-arrow",
    }),
  );
  root.append(
    svg("path", {
      d: "M 266 99 L 258 105 L 266 111",
      class: "training-map-arrow",
    }),
  );
  root.append(
    svg("rect", {
      x: 283,
      y: 32,
      width: 178,
      height: 64,
      rx: 5,
      class: "training-map-callout",
    }),
  );
  text("从公开入口开始", 298, 59, "training-map-callout-title", "start");
  text("示例起点 · 大学正门", 298, 80, "training-map-callout-note", "start");
  if (exampleScene) {
    // 仅接受构建时已公开的教学案例；标记仍只按公开点白名单绘制。
    const ids = [
      exampleScene.playerPlaceId,
      exampleScene.targetLive ? exampleScene.targetPlaceId : null,
    ];
    ids.forEach((id, i) => {
      const point = trainingExample.find((p) => p.id === id);
      if (!point) return;
      const offset = ids[0] === ids[1] ? (i === 0 ? -18 : 18) : 0;
      const group = svg("g", {
        class: `training-map-pin ${i === 0 ? "player" : "target"}`,
      });
      const [x, y] = point.at;
      group.append(svg("circle", { cx: x + offset, cy: y - 54, r: 12 }));
      group.append(
        svg("path", { d: `M ${x + offset - 5} ${y - 44} l 5 10 l 5 -10` }),
      );
      root.append(group);
    });
  }
  return root;
}
module.exports = { drawTrainingDiagram };
