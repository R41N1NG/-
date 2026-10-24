"use strict";
// 路线笔记：只记录有证据的连接；名称与记录随原investigation保存。
const map = require("./map.js");
const keyOf = (g) => JSON.stringify([g.route?.id || "", g.route?.nodes || []]);
const invalid = (message) =>
  Object.assign(Error(message), { code: "ROUTE_INVALID" });
function restoreRoutes(g) {
  const p = g.investigation;
  if (p.routes === undefined) p.routes = [];
  if (!Array.isArray(p.routes) || p.routes.length > 128)
    throw Object.assign(invalid("存档路线笔记无效：investigation.routes"), {
      code: "SAVE_INVALID",
    });
  const ids = new Set(),
    keys = new Set();
  for (const r of p.routes) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !/^route-\d+$/.test(r.id) ||
      ids.has(r.id) ||
      typeof r.key !== "string" ||
      keys.has(r.key) ||
      typeof r.name !== "string" ||
      !validName(r.name) ||
      !Array.isArray(r.edges) ||
      !r.edges.length ||
      r.edges.some(
        (e) =>
          !Array.isArray(e) ||
          e.length !== 2 ||
          e.some((x) => typeof x !== "string") ||
          !p.edges.includes(JSON.stringify(e)),
      )
    )
      throw Object.assign(invalid("存档路线笔记无效：investigation.routes"), {
        code: "SAVE_INVALID",
      });
    ids.add(r.id);
    keys.add(r.key);
  }
  // 旧档仅迁移当前路线中已有连接证据，known全亮不算证据。
  for (let i = 1; i < (g.route?.nodes.length || 0); i++) {
    const pair = [g.route.nodes[i - 1], g.route.nodes[i]];
    if (p.edges.includes(JSON.stringify(pair))) rememberEdge(g, ...pair);
  }
}
function validName(name) {
  return (
    name.trim() === name &&
    [...name].length >= 1 &&
    [...name].length <= 24 &&
    !/[\u0000-\u001f\u007f]/.test(name)
  );
}
function rememberEdge(g, from, to) {
  const p = g.investigation;
  if (!p.edges.includes(JSON.stringify([from, to]))) return;
  p.routes ||= [];
  let r = p.routes.find((r) => r.key === keyOf(g));
  if (!r) {
    if (p.routes.length >= 128) return;
    const n = Math.max(0, ...p.routes.map((r) => Number(r.id.slice(6)))) + 1;
    r = { id: `route-${n}`, key: keyOf(g), name: "归家路线", edges: [] };
    p.routes.push(r);
  }
  if (!r.edges.some((e) => e[0] === from && e[1] === to))
    r.edges.push([from, to]);
}
function renameRoute(g, request) {
  if (request?.targetId !== g.targetId)
    throw invalid("目标已切换，请重新打开她的档案");
  const r = g.investigation.routes?.find((r) => r.id === request.id);
  const name = typeof request?.name === "string" ? request.name.trim() : "";
  if (!r) throw invalid("这条路线尚未探明，请重新打开档案");
  if (!validName(name))
    throw invalid("路线名称须为1–24个字，不能包含换行或控制字符");
  r.name = name;
  return { id: r.id, name, targetId: g.targetId };
}
function knownRoutesView(g) {
  return (g.investigation.routes || []).map((r) => ({
    id: r.id,
    name: r.name,
    // 每段独立投影，断开的证据不能拼成连续路线；不透传内部key或未知节点。
    segments: r.edges.map(([a, b]) => ({
      from: map.getPlace(a)?.name || a,
      to: map.getPlace(b)?.name || b,
    })),
  }));
}
module.exports = { restoreRoutes, rememberEdge, renameRoute, knownRoutesView };
