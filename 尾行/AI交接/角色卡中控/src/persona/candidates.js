"use strict";
const D = require("../shared/random.js");
/** Optional data constraints: {requires:{personalityId:[...]}, excludes:{hobbyId:[...]}, weight:...}. */
function eligible(item, context) {
  if (!item || typeof item !== "object") return true;
  const matches = (key, wanted) =>
    (Array.isArray(wanted) ? wanted : [wanted]).includes(context[key]);
  return (
    item.enabled !== false &&
    Object.entries(item.requires || {}).every(([key, wanted]) =>
      matches(key, wanted),
    ) &&
    !Object.entries(item.excludes || {}).some(([key, wanted]) =>
      matches(key, wanted),
    )
  );
}
function pickCandidate(pool, seed, domain, context = {}) {
  if (!Array.isArray(pool) || !pool.length)
    throw new RangeError(`人物候选池为空：${domain}`);
  const candidates = pool.filter((item) => eligible(item, context));
  const weights = candidates.map((item) =>
    typeof item === "object" ? (item.weight ?? 1) : 1,
  );
  const total = weights.reduce((a, b) => a + b, 0);
  if (
    !Number.isFinite(total) ||
    total <= 0 ||
    weights.some((w) => !Number.isFinite(w) || w < 0)
  )
    throw new RangeError(`无可用候选或权重无效：${domain}`);
  const next = D.rng(seed);
  let r = next() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  throw new RangeError(`候选抽样失败：${domain}`);
}
module.exports = { eligible, pickCandidate };
