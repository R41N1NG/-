"use strict";
/** 零楼第三步：PPT 教程第一页。浏览只呈现，不自行建局或结算。 */
const { drawTrainingDiagram } = require("./training-diagram.js");
function createTrainingBrief({ document, lifecycle, onBack, onStart }) {
  const field = (id) => document.getElementById(id);
  const back = field("trainingBriefBack"),
    start = field("trainingBriefStart");
  let busy = false;
  const holder = field("trainingBriefDiagram");
  if (holder && !holder.childElementCount)
    holder.replaceChildren(drawTrainingDiagram(document));
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
