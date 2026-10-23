"use strict";
// 教程偏好独立于游戏存档；未来章节也必须先经过 shouldShow。
const TUTORIAL_KEY = "wx_tutorial_preferences_v1";
function createTutorialPolicy(window) {
  let skipped = false, persisted = true;
  const completed = new Set();
  function isSkipped() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(TUTORIAL_KEY) || "null");
      skipped = skipped || (saved?.version === 1 && saved.skipAll === true);
    } catch {}
    return skipped;
  }
  function skipAll() {
    skipped = true;
    try {
      window.localStorage.setItem(TUTORIAL_KEY, JSON.stringify({ version: 1, skipAll: true }));
    } catch { persisted = false; }
    return persisted;
  }
  return {
    isSkipped, skipAll,
    shouldShow: (id) => !isSkipped() && !completed.has(id),
    complete: (id) => completed.add(id),
    resetSession: () => completed.clear(),
  };
}
module.exports = { createTutorialPolicy, TUTORIAL_KEY };
