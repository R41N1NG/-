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
function validPath(path) {
  return (
    Array.isArray(path) &&
    path.every((v) => typeof v === "string" && /^[a-f0-9]{32}$/.test(v))
  );
}
function validateTimeline(value) {
  if (
    !value ||
    value.schema !== 1 ||
    !value.base?.save ||
    !validPath(value.base.path) ||
    !Array.isArray(value.nodes) ||
    !Number.isInteger(value.revision) ||
    value.revision < 0
  )
    throw Object.assign(new Error("时间线数据损坏或版本不支持"), {
      code: "TIMELINE_INVALID",
    });
  for (const n of value.nodes)
    if (
      !n ||
      !validPath(n.path) ||
      !prefix(value.base.path, n.path) ||
      (n.replyPath != null &&
        (!validPath(n.replyPath) || !prefix(n.path, n.replyPath))) ||
      typeof n.key !== "string" ||
      n.key !== fingerprint(n.path) ||
      !n.before ||
      !n.afterInput ||
      !n.after ||
      !n.result
    )
      throw Object.assign(new Error("回合记录损坏"), {
        code: "TIMELINE_INVALID",
        location: {
          index: Array.isArray(n?.path) ? n.path.length - 1 : undefined,
          kind: "record",
        },
      });
  if (value.locals !== undefined) {
    if (!Array.isArray(value.locals) || value.locals.length > 64)
      throw Object.assign(new Error("本地操作检查点列表损坏"), {
        code: "TIMELINE_INVALID",
      });
    const keys = new Set();
    for (const c of value.locals) {
      if (
        !c ||
        !validPath(c.path) ||
        !prefix(value.base.path, c.path) ||
        c.key !== fingerprint(c.path) ||
        keys.has(c.key) ||
        !c.save
      )
        throw Object.assign(new Error("本地操作检查点损坏"), {
          code: "TIMELINE_INVALID",
          location: {
            index:
              Array.isArray(c?.path) && c.path.length
                ? c.path.length - 1
                : undefined,
            kind: "record",
          },
        });
      keys.add(c.key);
    }
  }
  return clone(value);
}
function locate(timeline, history) {
  const path = tokens(history);
  if (!prefix(timeline.base.path, path)) {
    let index = 0;
    while (
      index < path.length &&
      index < timeline.base.path.length &&
      path[index] === timeline.base.path[index]
    )
      index++;
    throw Object.assign(
      new Error("聊天修改早于可恢复的存档检查点，原档已保留"),
      {
        code: "HISTORY_OUTSIDE_WINDOW",
        location: {
          index,
          messageId: history[index]?.id,
          kind: index >= path.length ? "missing" : "changed",
          checkpointIndex: timeline.base.path.length - 1,
        },
      },
    );
  }
  return { ...select(timeline, path), path };
}
function select(timeline, path) {
  let node = null;
  for (const n of timeline.nodes)
    if (prefix(n.path, path) && (!node || n.path.length > node.path.length))
      node = n;
  const replied = node?.replyPath && prefix(node.replyPath, path);
  let save = node
    ? replied
      ? node.after
      : node.afterInput
    : timeline.base.save;
  let length = node
    ? replied
      ? node.replyPath.length
      : node.path.length
    : timeline.base.path.length;
  let local = null;
  for (const checkpoint of timeline.locals || []) {
    if (prefix(checkpoint.path, path) && checkpoint.path.length >= length) {
      save = checkpoint.save;
      length = checkpoint.path.length;
      local = checkpoint;
    }
  }
  return { node, local, save: clone(save) };
}
function checkpoint(timeline, history, save, limit = 64) {
  const path = tokens(history),
    key = fingerprint(path);
  timeline.locals ||= [];
  const index = timeline.locals.findIndex((c) => c.key === key);
  const entry = { path, key, save: clone(save) };
  if (index >= 0) timeline.locals[index] = entry;
  else timeline.locals.push(entry);
  if (timeline.locals.length > limit) {
    const chain = timeline.locals
      .filter((c) => prefix(c.path, path))
      .sort((a, b) => a.path.length - b.path.length);
    const cut = chain[Math.max(0, chain.length - Math.floor(limit / 2) - 1)];
    timeline.base = { path: clone(cut.path), save: clone(cut.save) };
    timeline.nodes = timeline.nodes.filter((n) => prefix(cut.path, n.path));
    timeline.locals = timeline.locals.filter((c) => prefix(cut.path, c.path));
  }
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
  const cutPath = cut.replyPath || cut.path;
  timeline.base = {
    path: clone(cutPath),
    save: select(timeline, cutPath).save,
  };
  if (timeline.locals)
    timeline.locals = timeline.locals.filter((c) =>
      prefix(timeline.base.path, c.path),
    );
  timeline.nodes = timeline.nodes.filter((n) =>
    prefix(timeline.base.path, n.path),
  );
}
module.exports = {
  clone,
  checkpoint,
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
