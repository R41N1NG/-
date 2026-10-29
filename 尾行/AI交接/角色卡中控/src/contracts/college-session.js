"use strict";
const bad = (message) => {
  throw Object.assign(new Error("女大日程存档无效：" + message), {
    code: "SAVE_INVALID",
  });
};
function validateCollegeSession(value) {
  if (!value || value.schema !== 1) bad("版本");
  for (const k of ["serial", "sessionPiStart", "timeUsed"])
    if (!Number.isInteger(value[k]) || value[k] < 0) bad(k);
  if (value.timeUsed >= 3) bad("时间格");
  if (
    value.usedDate !== null &&
    (!Number.isInteger(value.usedDate) || value.usedDate < 1)
  )
    bad("出行日期");
  const r = value.recovery;
  if (
    !r ||
    ["used", "pending", "attempted"].some((k) => typeof r[k] !== "boolean")
  )
    bad("补救");
  if (r.pending && !r.used) bad("补救机会");
  if (r.lastResult !== null && !["found", "lost"].includes(r.lastResult))
    bad("补救结果");
  if (
    r.operationId !== undefined &&
    (typeof r.operationId !== "string" || !r.receipt)
  )
    bad("补救回执");
  if (
    r.operationId !== undefined &&
    (typeof r.receipt !== "object" ||
      !Array.isArray(r.receipt.actions) ||
      !r.receipt.actions.length ||
      !Number.isInteger(r.receipt.floor) ||
      !r.receipt.package)
  )
    bad("补救回执内容");
  if (r.pending && (!r.lastSeen || typeof r.lastSeen.placeId !== "string"))
    bad("补救目击记录");
  const o = value.outcome;
  if (o !== null) {
    if (
      !o ||
      !["lost", "escaped", "completed", "stopped", "ended"].includes(o.kind) ||
      typeof o.acknowledged !== "boolean" ||
      typeof o.title !== "string"
    )
      bad("结束反馈");
    for (const k of [
      "pi",
      "minimum",
      "clueGain",
      "clueCount",
      "remaining",
      "date",
      "period",
    ])
      if (!Number.isInteger(o[k]) || o[k] < 0) bad("结束反馈 " + k);
    if (o.remaining > 4 || o.period > 4) bad("结束时段");
  }
  return value;
}
module.exports = { validateCollegeSession };
