"use strict";
/** 零楼第三步：五页 PPT。浏览页号属于 UI，不进入游戏时间线或独立存档。 */
const { TRAINING_PAGES } = require("./training-pages.js");
const { createTrainingExamples } = require("./training-examples.js");
function createTrainingBrief({
  document,
  lifecycle,
  onBack,
  onStart,
  onDemonstrate,
  onSkipAll = onStart,
}) {
  const field = (id) => document.getElementById(id);
  const root = field("zeroStep3"),
    back = field("trainingBriefBack"),
    start = field("trainingBriefStart"),
    skip = field("trainingBriefSkip"),
    next = field("trainingBriefNext"),
    prev = field("trainingBriefPrev"),
    nav = field("trainingBriefPages");
  let busy = false,
    page = 0,
    selectionKey = null;
  const examples = createTrainingExamples({
    document,
    lifecycle,
    root,
    onDemonstrate,
  });
  nav?.replaceChildren();
  TRAINING_PAGES.forEach((slide, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.trainingPage = String(i);
    button.setAttribute("aria-label", `第 ${i + 1} 页：${slide.label}`);
    const number = document.createElement("span"),
      label = document.createElement("strong");
    number.textContent = String(i + 1).padStart(2, "0");
    label.textContent = slide.label;
    button.append(number, label);
    nav?.append(button);
  });
  function render(focus = false) {
    const slide = TRAINING_PAGES[page],
      last = page === TRAINING_PAGES.length - 1;
    root.dataset.trainingPage = String(page);
    for (const panel of root.querySelectorAll("[data-training-slide]"))
      panel.hidden = Number(panel.dataset.trainingSlide) !== page;
    for (const button of nav?.querySelectorAll("button") || []) {
      const active = Number(button.dataset.trainingPage) === page;
      button.setAttribute("aria-current", active ? "step" : "false");
      button.disabled = busy;
    }
    field("trainingBriefTitle").textContent = slide.title;
    field("trainingBriefLead").textContent = slide.lead;
    field("trainingBriefEyebrow").textContent =
      `第 ${String(page + 1).padStart(2, "0")} 页 / 05 — ${slide.label}`;
    field("trainingBriefGoal").textContent = slide.goal;
    field("trainingBriefPageCount").textContent =
      `${String(page + 1).padStart(2, "0")} / 05 · 第一次训练`;
    prev.disabled = busy || page === 0;
    next.hidden = last;
    next.disabled = busy;
    next.textContent = last
      ? "下一页"
      : `下一页：${TRAINING_PAGES[page + 1].label} →`;
    start.hidden = !last;
    start.disabled = busy;
    start.textContent = busy ? "正在载入…" : "读完图解，载入训练场 ↗";
    back.disabled = busy;
    skip.disabled = busy;
    examples.setBusy(busy);
    root.setAttribute("aria-busy", String(busy));
    if (focus) field("trainingBriefTitle").focus();
  }
  function show(index, focus = true) {
    if (
      busy ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= TRAINING_PAGES.length
    )
      return;
    page = index;
    render(focus);
  }
  lifecycle.on(back, "click", () => {
    if (!busy) onBack();
  });
  lifecycle.on(start, "click", () => {
    if (!busy && page === TRAINING_PAGES.length - 1) onStart();
  });
  lifecycle.on(skip, "click", () => {
    if (!busy) onSkipAll();
  });
  lifecycle.on(next, "click", () => show(page + 1));
  lifecycle.on(prev, "click", () => show(page - 1));
  lifecycle.on(nav, "click", (event) => {
    const button = event.target.closest("[data-training-page]");
    if (button && nav.contains(button))
      show(Number(button.dataset.trainingPage));
  });
  lifecycle.on(root.querySelector("[data-training-review]"), "click", () =>
    show(3),
  );
  lifecycle.on(root, "keydown", (event) => {
    if (
      event.target.closest("input, textarea, select") ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    show(page + (event.key === "ArrowRight" ? 1 : -1));
  });
  function setLoading(value) {
    busy = value;
    if (value) field("trainingBriefNotice").textContent = "";
    render();
  }
  render();
  return {
    setSelection({ identity, target }) {
      const key = `${identity?.name || ""}\u0000${target?.name || ""}`;
      if (selectionKey !== key) {
        page = 0;
        examples.reset();
      }
      selectionKey = key;
      field("trainingBriefIdentity").textContent = identity?.name || "尚未选择";
      field("trainingBriefTarget").textContent = target?.name || "尚未选择";
      field("trainingBriefNotice").textContent = "";
      render();
    },
    setLoading,
    showError(error) {
      field("trainingBriefNotice").textContent =
        `未能载入训练场，当前选择已保留。${error?.message || "请稍后重试。"}`;
    },
    reset() {
      page = 0;
      selectionKey = null;
      examples.reset();
      setLoading(false);
      field("trainingBriefNotice").textContent = "";
    },
  };
}
module.exports = { createTrainingBrief };
