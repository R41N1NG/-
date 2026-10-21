"use strict";
/** @param {string} id @param {string} name */
function classifyPlace(id, name = "") {
  const place = String(id || ""),
    label = String(name || "");
  if (
    /unit|stairs|gate|door|porch|lobby|entrance/i.test(place) ||
    /楼道|单元|门|玄关|电梯|台阶|入口/.test(label)
  )
    return "door";
  if (
    /residence|room|home|flat|apartment|villa/i.test(place) ||
    /客厅|卧室|房间|室内|屋内/.test(label)
  )
    return "room";
  return "";
}
/** Shared by UI and runtime: arguments cannot override the actual current distance. */
/** @param {import("./types").Requirements | undefined} requires @param {import("./types").RequirementContext} context */
function requirementFailure(requires, context) {
  if (!requires) return null;
  if (requires.place && context.placeKind !== requires.place)
    return {
      code: "place",
      reason: `需要${requires.place === "door" ? "门前 / 楼道 / 玄关" : "室内"}场所`,
    };
  if (requires.dist?.length && !requires.dist.includes(context.dist))
    return {
      code: "dist",
      reason: `需要${requires.dist.map((d) => ({ far: "远端", same: "同街", close: "身后", touch: "贴身" })[d] || d).join(" / ")}距离`,
    };
  const items = requires.items || [];
  if (
    items.length &&
    !context.inventory.some(
      (it) => items.includes(it.id) && (it.count ?? 1) > 0,
    )
  )
    return { code: "items", reason: "缺少所需随身工具" };
  return null;
}
module.exports = { classifyPlace, requirementFailure };
