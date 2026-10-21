"use strict";
// Pure generation: UI previews and engine initialization consume the same complete result.
const R = require("../config/rules.json");
const LP = require("../config/lifepack.json");
const W = require("../config/wardrobe.json");
const D = require("../shared/random.js");
const TS = require("./facts.js");
const { validatePersona } = require("../contracts/persona.js");
const { pickCandidate } = require("./candidates.js");
const GENERATOR_VERSION = 1;
function generateTargetPersona(
  targetId,
  { seed = D.newSessionSalt(), version = GENERATOR_VERSION } = {},
) {
  if (version !== GENERATOR_VERSION)
    throw new RangeError("不支持的人物生成器版本");
  const target = R.targets.list[targetId];
  if (!target) throw new RangeError(`未知目标类型：${targetId}`);
  const config = R.targets.generator;
  const context = { targetId };
  const pick = (pool, domain) =>
    pickCandidate(
      pool,
      D.actionSeed(String(seed), version, domain),
      domain,
      context,
    );
  const surname = pick(config.namePool.surnames, "surname");
  const givenName = pick(config.namePool.givenNames, "givenName");
  const p = pick(config.personalityPool, "personality");
  context.personalityId = p.id;
  const h = pick(config.hobbyPool, "hobby");
  context.hobbyId = h.id;
  const shoe = ["college", "student"].includes(targetId)
    ? pick(config.shoePool.student_and_college, "shoe")
    : config.shoePool.defaults[targetId] || config.shoePool.defaults.ol;
  if (!shoe) throw new RangeError(`缺少鞋具配置：${targetId}`);
  const deltas = {},
    finalStats = {};
  for (const key of ["str", "agi", "per", "nrv", "social"]) {
    const base =
      key === "social" ? (target.social ?? 2) : (target.stats[key] ?? 3);
    const delta = pick(config.statDelta.options, `stat:${key}`);
    if (!Number.isFinite(base) || !Number.isFinite(delta))
      throw new TypeError(`属性配置无效：${key}`);
    deltas[key] = delta;
    finalStats[key] = Math.max(1, Math.min(10, base + delta));
  }
  const persona = {
    generatorVersion: version,
    generationSeed: String(seed),
    targetId,
    surname,
    givenName,
    name: surname + givenName,
    personality: p.name,
    personalityId: p.id,
    personalityTag: p.tagId,
    personalityDesc: p.desc,
    hobby: h.name,
    hobbyId: h.id,
    hobbyTag: h.tagId,
    hobbyDesc: h.desc,
    shoeId: shoe.id,
    shoeName: shoe.name,
    shoeTag: shoe.tagId,
    shoeDesc: shoe.desc,
    hair: pick(W.variants.hair, "hair"),
    body: pick(W.variants.body, "body"),
    deltas,
    finalStats,
  };
  const pack = LP.packs[targetId];
  // Missing content is explicit, never silently borrow another target's facts.
  if (pack)
    TS.resolveTargetFacts(
      pack,
      persona,
      D.actionSeed(String(seed), version, "facts"),
    );
  else {
    persona.assignedFacts = [];
    persona.factSummary = {};
  }
  validatePersona(persona, targetId, { complete: true });
  return JSON.parse(JSON.stringify(persona));
}
module.exports = { generateTargetPersona, GENERATOR_VERSION };
