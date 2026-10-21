"use strict";
const clone = (value) =>
  value == null ? value : JSON.parse(JSON.stringify(value));
/** Synchronous 128-bit content fingerprint; no message text is stored in paths. */
function fingerprint(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return [2166136261, 2246822507, 3266489909, 668265263]
    .map((seed) => {
      let h = seed;
      for (let i = 0; i < text.length; i++)
        h = Math.imul(h ^ text.charCodeAt(i), 16777619);
      return (h >>> 0).toString(16).padStart(8, "0");
    })
    .join("");
}
function tokens(history) {
  return history.map((m, index) =>
    fingerprint([m.id ?? index, m.role, m.text || "", m.swipe ?? null]),
  );
}
const prefix = (a, b) => a.length <= b.length && a.every((v, i) => v === b[i]);
function userIndex(history, id) {
  if (!Array.isArray(history)) return -1;
  if (id !== undefined && id !== null)
    return history.findIndex(
      (m) => m.role === "user" && String(m.id) === String(id),
    );
  for (let i = history.length - 1; i >= 0; i--)
    if (history[i].role === "user") return i;
  return -1;
}
function newTimeline(save, history, owner, beforeUser) {
  const index = beforeUser === undefined ? -1 : userIndex(history, beforeUser);
  const baseHistory = index >= 0 ? history.slice(0, index) : history;
  return {
    schema: 1,
    owner,
    revision: 0,
    base: { path: tokens(baseHistory || []), save: clone(save) },
    nodes: [],
  };
}
function validateTimeline(value) {
  if (
    !value ||
    value.schema !== 1 ||
    !value.base?.save ||
    !Array.isArray(value.base.path) ||
    !Array.isArray(value.nodes) ||
    !Number.isInteger(value.revision)
  )
    throw Object.assign(new Error("时间线数据损坏或版本不支持"), {
      code: "TIMELINE_INVALID",
    });
  for (const n of value.nodes)
    if (
      !Array.isArray(n.path) ||
      typeof n.key !== "string" ||
      n.key !== fingerprint(n.path) ||
      !n.before ||
      !n.afterInput ||
      !n.after
    )
      throw Object.assign(new Error("回合记录损坏"), {
        code: "TIMELINE_INVALID",
      });
  return clone(value);
}
function locate(timeline, history) {
  const path = tokens(history);
  if (!prefix(timeline.base.path, path))
    throw Object.assign(
      new Error("聊天修改早于可恢复的存档检查点，原档已保留"),
      { code: "HISTORY_OUTSIDE_WINDOW" },
    );
  let node = null;
  for (const n of timeline.nodes)
    if (prefix(n.path, path) && (!node || n.path.length > node.path.length))
      node = n;
  const save = node
    ? node.replyPath && prefix(node.replyPath, path)
      ? node.after
      : node.afterInput
    : timeline.base.save;
  return { node, save: clone(save), path };
}
function inputPath(history, messageId) {
  const index = userIndex(history, messageId);
  if (index < 0)
    throw Object.assign(new Error("玩家消息尚未落入当前聊天"), {
      code: "MESSAGE_NOT_FOUND",
    });
  return tokens(history.slice(0, index + 1));
}
function prune(timeline, currentPath, limit = 64) {
  if (timeline.nodes.length <= limit) return;
  const chain = timeline.nodes
    .filter((n) => prefix(n.path, currentPath))
    .sort((a, b) => a.path.length - b.path.length);
  const cut = chain[Math.max(0, chain.length - Math.floor(limit / 2) - 1)];
  if (!cut)
    throw Object.assign(new Error("时间线容量不足，原进度已保留"), {
      code: "TIMELINE_FULL",
    });
  timeline.base = { path: cut.replyPath || cut.path, save: clone(cut.after) };
  timeline.nodes = timeline.nodes.filter((n) =>
    prefix(timeline.base.path, n.path),
  );
}
module.exports = {
  clone,
  fingerprint,
  tokens,
  prefix,
  userIndex,
  newTimeline,
  validateTimeline,
  locate,
  inputPath,
  prune,
};
