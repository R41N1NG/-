"use strict";
/** New stages register here (or through the returned register function), without changing the host mount. */
function createStages({ document, lifecycle, onChange }) {
  const stages = new Map();
  function go(id) {
    const stage = stages.get(id);
    if (!stage || (stage.canEnter && !stage.canEnter())) return false;
    for (const [key, entry] of stages) {
      const view = document.getElementById(entry.viewId);
      const tab = document.getElementById(entry.tabId);
      if (view) view.hidden = key !== id;
      if (tab) {
        tab.classList.toggle("active", key === id);
        tab.setAttribute("aria-selected", String(key === id));
      }
    }
    stage.enter?.();
    onChange(id);
    return true;
  }
  function register(id, definition) {
    if (stages.has(id) || !document.getElementById(definition.viewId))
      throw new Error("无效或重复的零楼步骤");
    stages.set(id, definition);
    lifecycle.on(document.getElementById(definition.tabId), "click", () =>
      go(id),
    );
  }
  return { go, register };
}
module.exports = { createStages };
