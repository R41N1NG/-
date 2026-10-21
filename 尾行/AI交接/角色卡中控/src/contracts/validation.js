"use strict";
/** @typedef {{id?: string, name?: string, args?: Record<string, unknown>}} ActionInput */
/** @param {unknown} value @returns {asserts value is ActionInput[]} */
function validateActions(value) {
  if (!Array.isArray(value) || value.length > 3)
    throw new TypeError("动作队列必须为数组，最多三个动作");
  for (const action of value) {
    if (
      !action ||
      typeof action !== "object" ||
      (typeof action.id !== "string" && typeof action.name !== "string")
    )
      throw new TypeError("动作需要有效 id 或名称");
    if (
      action.args != null &&
      (typeof action.args !== "object" || Array.isArray(action.args))
    )
      throw new TypeError("动作参数必须为对象");
    if (
      action.args?.dist != null &&
      !["far", "same", "close", "touch"].includes(action.args.dist)
    )
      throw new TypeError("无效的距离参数");
    if (
      action.args?.style != null &&
      !["assault", "ambush"].includes(action.args.style)
    )
      throw new TypeError("无效的动作方式");
  }
}
module.exports = { validateActions };
