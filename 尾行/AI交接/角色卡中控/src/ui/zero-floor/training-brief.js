"use strict";
/** 零楼第三步只呈现简报，不自行创建引擎、写变量或结算行动。 */
function createTrainingBrief({ document, lifecycle, onBack, onStart }) {
  const field = (id) => document.getElementById(id);
  const back = field("trainingBriefBack"),
    start = field("trainingBriefStart");
  let busy = false;
  // 装饰性环境示意不读取目标路线、属性、住址或未解锁情报。
  const holder = field("trainingBriefHologram");
  if (holder && !holder.childElementCount) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = (tag, attrs) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      return e;
    };
    const scene = svg("svg", { viewBox: "0 0 440 330", focusable: "false" });
    const project = (x, y, z = 0) => [
      220 + (x - y) * 22,
      86 + (x + y) * 11 - z,
    ];
    const poly = (points, cls) =>
      svg("polygon", {
        points: points.map((p) => p.join(",")).join(" "),
        class: cls,
      });
    scene.append(
      poly(
        [
          [0, 0],
          [9, 0],
          [9, 9],
          [0, 9],
        ].map((p) => project(...p)),
        "holo-ground",
      ),
    );
    for (let n = 0; n <= 9; n++) {
      for (const pair of [
        [
          [n, 0],
          [n, 9],
        ],
        [
          [0, n],
          [9, n],
        ],
      ]) {
        const [a, b] = pair.map((p) => project(...p));
        scene.append(svg("path", { d: `M ${a} L ${b}`, class: "holo-grid" }));
      }
    }
    const blocks = [
      [1, 1, 1.4, 1.2, 24],
      [3.2, 1, 1.4, 1.2, 48],
      [5.4, 1, 1.4, 1.2, 19],
      [7.3, 1, 0.8, 1.2, 32],
      [1, 3.2, 1.4, 1.4, 28],
      [3.2, 3.2, 1.4, 1.4, 65],
      [5.4, 3.2, 1.4, 1.4, 35],
      [7.3, 3.2, 0.8, 1.4, 20],
      [1, 5.4, 1.4, 1.4, 17],
      [3.2, 5.4, 1.4, 1.4, 29],
      [5.4, 5.4, 1.4, 1.4, 46],
      [7.3, 5.4, 0.8, 1.4, 20],
      [1, 7.5, 1.4, 0.8, 14],
      [3.2, 7.5, 1.4, 0.8, 20],
      [5.4, 7.5, 1.4, 0.8, 16],
    ].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    for (const [x, y, w, h, z] of blocks) {
      const top = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ].map((p) => project(...p, z));
      const base = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ].map((p) => project(...p));
      const g = svg("g", {
        class: z === 65 ? "holo-building focal" : "holo-building",
      });
      g.append(
        poly([top[1], top[2], base[2], base[1]], "holo-wall east"),
        poly([top[2], top[3], base[3], base[2]], "holo-wall west"),
        poly(top, "holo-roof"),
      );
      scene.append(g);
    }
    holder.replaceChildren(scene);
  }
  lifecycle.on(back, "click", () => {
    if (!busy) onBack();
  });
  lifecycle.on(start, "click", () => {
    if (!busy) onStart();
  });
  function setLoading(value) {
    busy = value;
    if (value) field("trainingBriefNotice").textContent = "";
    if (start) {
      start.disabled = value;
      start.textContent = value ? "正在载入…" : "载入训练场 ↗";
    }
    if (back) back.disabled = value;
    field("zeroStep3")?.setAttribute("aria-busy", String(value));
  }
  return {
    setSelection({ identity, target }) {
      field("trainingBriefIdentity").textContent = identity?.name || "尚未选择";
      field("trainingBriefTarget").textContent = target?.name || "尚未选择";
      field("trainingBriefNotice").textContent = "";
    },
    setLoading,
    showError(error) {
      field("trainingBriefNotice").textContent =
        `未能载入训练场，当前选择已保留。${error?.message || "请稍后重试。"}`;
    },
    reset() {
      setLoading(false);
      field("trainingBriefNotice").textContent = "";
    },
  };
}
module.exports = { createTrainingBrief };
