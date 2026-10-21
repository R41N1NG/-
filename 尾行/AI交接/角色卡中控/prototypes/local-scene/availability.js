"use strict";
// Standalone prototype: no game, host, model, random or storage dependencies.
(function expose(root) {
  function availability(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new TypeError("需要场景状态对象");
    for (const key of ["step", "busyUntilStep", "leaveAtStep"])
      if (!Number.isSafeInteger(input[key]) || input[key] < 0)
        throw new TypeError(`无效的场景节拍：${key}`);
    for (const key of ["present", "closed"])
      if (input[key] !== undefined && typeof input[key] !== "boolean")
        throw new TypeError(`无效的场景标记：${key}`);
    const ended = (reason) => ({
      state: "ended",
      canTalk: false,
      canWait: false,
      reason,
    });
    if (input.closed) return ended("scene_closed");
    if (input.present === false) return ended("not_present");
    if (input.step >= input.leaveAtStep) return ended("left");
    if (input.step < input.busyUntilStep)
      return {
        state: "busy",
        canTalk: false,
        canWait: input.busyUntilStep < input.leaveAtStep,
        reason: "busy",
      };
    return {
      state: "available",
      canTalk: true,
      canWait: false,
      reason: "available",
    };
  }
  const api = { availability };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LocalSceneAvailability = api;
})(typeof globalThis === "undefined" ? this : globalThis);
