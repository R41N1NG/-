"use strict";
// 所有操作图均为正式界面真实截图；这里只绘制透明标注与隔离示范按钮。
const { trainingSample: sample } = require("../generated/rules.json");
const { createTrainingPictures } = require("./training-pictures.js");
const { photoSource } = require("../photo-source.js");
function createTrainingExamples({ document, lifecycle, root, onDemonstrate }) {
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const mount = (kind, node) =>
    root
      .querySelector(`[data-training-example="${kind}"]`)
      ?.replaceChildren(node);
  const { picture, close } = createTrainingPictures({ document, lifecycle });
  const first = document.getElementById("trainingBriefDiagram");
  first?.replaceChildren(picture("map-visible", false));
  const terminal = el("div", "training-real-terminal");
  terminal.append(
    el("h4", "", "先找到入口"),
    picture("statusbar"),
    el("h4", "", "再读完整展开的终端"),
    picture("terminal"),
  );
  mount("terminal", terminal);
  const location = document.getElementById("trainingBriefLocatedMap");
  location?.replaceChildren(
    el("h4", "training-example-subtitle", "① 仍在目视：实心橙点"),
    picture("map-visible"),
    el("h4", "training-example-subtitle", "② 跟缀失败：只剩最后目击"),
    picture("map-lost"),
  );
  mount(
    "location",
    el(
      "p",
      "",
      `真实案例：入场时在大学正门目视目标 → 下一回合跟缀检定失败 → ${sample.lost.after.status}；未再显示目标当前去向。`,
    ),
  );
  const action = el("div", "training-action-example");
  action.append(
    picture("capsule"),
    el("h4", "training-example-subtitle", "放大打量胶囊（原截图裁切）"),
    picture("capsule-focus", true, true),
  );
  const status = el("p", "training-ui-queue", "① 点击上方箭头指向的“打量”胶囊");
  status.dataset.trainingQueue = "";
  status.setAttribute("role", "status");
  action.append(status);
  const label = el(
    "label",
    "training-narration-label",
    "伴随描写（可选，仅用于示范）",
  );
  label.htmlFor = "trainingBriefNarration";
  const input = el("textarea", "training-narration");
  input.id = label.htmlFor;
  input.rows = 2;
  input.placeholder = "我留意她的步幅和周围动静。";
  input.maxLength = 500;
  const send = el("button", "training-demo-send", "② 示范发送，查看判定动画 →");
  send.type = "button";
  send.dataset.trainingSend = "";
  const output = el("div", "training-demo-output");
  output.dataset.trainingOutput = "";
  output.setAttribute("role", "status");
  output.hidden = true;
  output.append(
    el("strong", "", `${sample.action.name} · 成功示例`),
    el("p", "", `${sample.record[0]} · ${sample.record[1]}`),
    el(
      "p",
      "training-ui-gain",
      `情报 PI +${sample.delta.pi} · 体力 ${sample.delta.stamina} · 日程行动点 ${sample.before.remaining} → ${sample.after.remaining}`,
    ),
  );
  const replay = el("button", "training-demo-replay", "重播判定动画 ↗");
  replay.type = "button";
  replay.hidden = true;
  action.append(
    label,
    input,
    send,
    output,
    replay,
    el("h4", "training-example-subtitle", "判定界面的三个部分"),
    picture("settlement"),
  );
  mount("action", action);
  let selected = false,
    demonstrated = false,
    busy = false;
  const selects = [...action.querySelectorAll("[data-training-select]")];
  function sync() {
    for (const select of selects) {
      select.disabled = busy;
      select.setAttribute("aria-pressed", String(selected));
    }
    send.disabled = busy || !selected || demonstrated;
    send.textContent = demonstrated
      ? "示范已展示 ✓"
      : "② 示范发送，查看判定动画 →";
    input.disabled = busy;
    replay.disabled = busy;
    replay.hidden = !demonstrated;
    output.hidden = !demonstrated;
    status.textContent = demonstrated
      ? "已发送：打量。判定与收录结果见下方。"
      : selected
        ? "已选中：打量。现在点击“示范发送”。"
        : "① 点击上方箭头指向的“打量”胶囊";
  }
  for (const select of selects)
    lifecycle.on(select, "click", () => {
      if (busy || demonstrated) return;
      selected = !selected;
      sync();
    });
  const animate = () =>
    onDemonstrate?.(JSON.parse(JSON.stringify(sample.settlement)));
  lifecycle.on(send, "click", () => {
    if (busy || !selected || demonstrated) return;
    demonstrated = true;
    sync();
    animate();
  });
  lifecycle.on(replay, "click", () => {
    if (!busy) animate();
  });
  const result = el("div", "training-result-example");
  const comparison = el("div", "training-comparison");
  for (const [title, s] of [
    ["行动前", sample.before],
    ["行动后", sample.after],
  ]) {
    const cell = el("div", "training-ui-box");
    cell.append(
      el("p", "", title),
      el("strong", "training-ui-value", "PI " + s.pi),
      el("p", "", "体力 " + s.stamina),
    );
    comparison.append(cell);
  }
  const record = el("div", "training-ui-box training-ui-highlight");
  record.dataset.trainingRecord = "";
  record.append(
    el("time", "", sample.record[0]),
    el("p", "", sample.record[1]),
  );
  result.append(comparison, record);
  if (sample.capture) {
    const card = el("figure", "training-capture-card"),
      image = el("img");
    image.src = photoSource(sample.capture.file);
    image.alt = sample.capture.name + " · 侧面";
    card.append(
      image,
      el("figcaption", "", `本次新增：${sample.capture.name} · 侧面`),
    );
    result.append(card);
  }
  result.append(
    el(
      "p",
      "training-ui-muted",
      "从当前可辨认且有对应素材的服装部位中，选取一张尚未拥有的侧视图；侧图已齐不会重复获得。",
    ),
    el(
      "p",
      "training-ui-muted",
      `本例新增档案条目：${sample.newFactCount} 条；住址与后续行程仍未解锁。`,
    ),
  );
  mount("result", result);
  sync();
  return {
    setBusy(value) {
      busy = value;
      sync();
    },
    reset() {
      selected = false;
      demonstrated = false;
      input.value = "";
      close();
      sync();
    },
  };
}
module.exports = { createTrainingExamples };
