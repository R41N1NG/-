"use strict";
const LP = require("../config/lifepack.json");
const W = require("../config/wardrobe.json");
const R = require("../config/rules.json");
/** Stable IDs internally; accept display names/object forms only at legacy boundaries. */
function personalityIdOf(persona) {
  if (!persona) return null;
  const value =
    persona.personalityId ||
    persona.personalityTag ||
    persona.personality?.id ||
    persona.personality;
  if (typeof value !== "string") return null;
  return (
    R.targets.generator.personalityPool.find(
      (p) => p.id === value || p.name === value,
    )?.id || value
  );
}
function normalizePersona(value) {
  if (value == null) return null;
  const copy = JSON.parse(JSON.stringify(value));
  const id = personalityIdOf(copy);
  if (id) copy.personalityId = id;
  return copy;
}
function validatePersona(
  value,
  targetId,
  { complete = false, references = true } = {},
) {
  if (value == null && !complete) return;
  const fail = (field) => {
    throw Object.assign(new Error(`人物数据无效：${field}`), {
      code: "PERSONA_INVALID",
    });
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("画像");
  if (value.targetId && value.targetId !== targetId) fail("目标类型不一致");
  if (references && !R.targets.list[targetId]) fail("目标类型");
  const pid = personalityIdOf(value);
  if (
    references &&
    pid &&
    !R.tags[pid] &&
    !["oblivious", "curious", "anxious"].includes(pid)
  )
    fail("性格");
  for (const field of ["personalityTag", "hobbyTag", "shoeId"])
    if (references && value[field] && !R.tags[value[field]]) fail(field);
  if (value.finalStats) {
    for (const [key, n] of Object.entries(value.finalStats))
      if (
        !["str", "agi", "per", "nrv", "social"].includes(key) ||
        !Number.isFinite(n) ||
        n < 1 ||
        n > 10
      )
        fail(`属性 ${key}`);
  }
  if (
    value.assignedFacts != null &&
    (!Array.isArray(value.assignedFacts) ||
      value.assignedFacts.some((f) => !f || typeof f.id !== "string"))
  )
    fail("固定事实");
  for (const field of ["hair", "body"])
    if (
      references &&
      value[field] != null &&
      !W.variants[field].includes(value[field])
    )
      fail(field);
  if (
    value.generatorVersion != null &&
    (typeof value.generationSeed !== "string" || !value.generationSeed)
  )
    fail("生成种子");
  if (complete) {
    if (typeof value.generationSeed !== "string" || !value.generationSeed)
      fail("生成种子");
    if (!R.targets.generator.personalityPool.some((p) => p.id === pid))
      fail("性格引用");
    if (!R.targets.generator.hobbyPool.some((h) => h.id === value.hobbyId))
      fail("爱好引用");
    const pack = LP.packs[targetId];
    if (pack) {
      const validFacts = new Set((pack.factPool || []).map((f) => f.id));
      for (const [key, pool] of Object.entries(pack)) {
        if (key.endsWith("Pool") && Array.isArray(pool))
          for (const branch of pool)
            for (const f of branch.facts || []) validFacts.add(f.id);
      }
      if (value.assignedFacts?.some((f) => !validFacts.has(f.id)))
        fail("事实引用");
      const slotPools = {
        home: "homePool",
        schedule: "schedulePool",
        carry: "carryPool",
        social: "socialPool",
        psyche: "psychePool",
        romance: "romancePool",
      };
      for (const [slot, pool] of Object.entries(slotPools)) {
        const selected = value.factSummary?.[slot];
        if (selected != null && !pack[pool]?.some((b) => b.id === selected))
          fail(`事实分支 ${slot}`);
      }
    }
  }
  if (value.generatorVersion != null && value.generatorVersion !== 1)
    fail("生成器版本");
  if (
    complete &&
    (!value.name ||
      !pid ||
      !value.hobbyId ||
      !value.shoeId ||
      !value.finalStats ||
      !Array.isArray(value.assignedFacts))
  )
    fail("完整画像");
  if (
    complete &&
    ["str", "agi", "per", "nrv", "social"].some(
      (k) => !Number.isFinite(value.finalStats[k]),
    )
  )
    fail("属性缺失");
}
module.exports = { personalityIdOf, normalizePersona, validatePersona };
