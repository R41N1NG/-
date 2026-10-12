"use strict";
function meets(s, conditions = []) {
  if (!Array.isArray(conditions)) throw Error("条件须为数组");
  return conditions.every(c => {
    let value;
    if (c.kind === "metric") value = s.stat_data?.character_metrics?.[c.character]?.[c.key];
    else if (c.kind === "stage") value = s.stat_data?.character_stages?.[c.character]?.id;
    else if (c.kind === "known") value = s.known?.[c.key] ?? s.stat_data?.known?.[c.key];
    else if (c.kind === "identity") value = s.identity;
    else if (c.kind === "item") value = (s.inventory || s.stat_data?.inventory || []).filter(x=>x.name === c.key).reduce((n,x)=>n+x.count,0);
    else throw Error("未知条件类型");
    if (value === undefined || value === null) return false;
    const op = c.op || "eq";
    if (op === "eq") return value === c.value;
    if (op === "gte") return typeof value === "number" && Number.isFinite(c.value) && value >= c.value;
    if (op === "lte") return typeof value === "number" && Number.isFinite(c.value) && value <= c.value;
    throw Error("未知条件运算");
  });
}
module.exports = {meets};
