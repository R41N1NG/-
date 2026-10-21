"use strict";
const LP = require("../config/lifepack.json");
const D = require("../shared/random.js");
const { personalityIdOf } = require("../contracts/persona.js");
function toSeed(seed) {
  return typeof seed === "number"
    ? seed >>> 0
    : D.floorSeed(String(seed || 0), 0);
}
function resolveTargetFacts(pack, persona, seed = 12345) {
  const p = pack || LP.packs.college || LP.packs.student;
  if (!p) return { assignedFacts: [], factSummary: {} };

  // 1. 若 persona 中已持有抽样事实，严格保证整局不变，直接返回真源
  if (
    persona &&
    persona.assignedFacts &&
    Array.isArray(persona.assignedFacts) &&
    persona.assignedFacts.length
  ) {
    return {
      assignedFacts: persona.assignedFacts,
      factSummary: persona.factSummary || {},
    };
  }

  // 2. 若生活包未提供多选项候选池（如 student 仅有静态基准池），回退至 factPool
  if (!p.homePool) {
    const facts = (p.factPool || []).slice();
    if (persona) {
      persona.assignedFacts = facts;
      persona.factSummary = {};
    }
    return { assignedFacts: facts, factSummary: {} };
  }

  const next = D.rng(toSeed(seed));
  const personalityId = personalityIdOf(persona) || "casual";

  // 1. 住处槽位 (home)：不限制性格，全池抽取（3候选）
  const homePool = p.homePool || [];
  const chosenHome = homePool.length
    ? homePool[Math.floor(next() * homePool.length)]
    : null;

  // 辅助函数：根据性格倾向权重抽选分支（倾向性格权重3，其余权重1）
  function pickByPersonality(pool, prefMap) {
    if (!pool || !pool.length) return null;
    const weights = pool.map((branch) => {
      const prefs =
        (prefMap && prefMap[branch.id]) || branch.preferredPersonalities || [];
      return prefs.includes(personalityId) ? 3 : 1;
    });
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = next() * totalW;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }

  // 2. 作息槽位 (schedule)：按性格偏好抽取
  const schedulePrefMap = {
    sched_academic: ["stubborn", "aloof", "vigilant", "introverted"],
    sched_parttime: ["gentle", "stubborn", "casual", "naive"],
    sched_socialite: ["cheerful", "chic", "naive", "casual"],
  };
  const chosenSchedule = pickByPersonality(p.schedulePool, schedulePrefMap);

  // 3. 随身槽位 (carry)：按性格偏好抽取
  const carryPrefMap = {
    carry_academic: ["stubborn", "aloof", "vigilant", "introverted", "gentle"],
    carry_glamour: ["chic", "cheerful", "naive"],
    carry_casual: ["casual", "timid", "vigilant"],
  };
  const chosenCarry = pickByPersonality(p.carryPool, carryPrefMap);

  // 4. 人际槽位 (social)：按性格偏好抽取
  const socialPrefMap = {
    social_introvert: ["introverted", "aloof", "vigilant", "timid"],
    social_extrovert: ["cheerful", "chic", "naive"],
    social_moderate: ["gentle", "stubborn", "casual"],
  };
  const chosenSocial = pickByPersonality(p.socialPool, socialPrefMap);

  // 5. 心理槽位 (psyche)：按性格偏好抽取
  const psychePrefMap = {
    psyche_pride: ["stubborn", "aloof", "vigilant"],
    psyche_timid: ["timid", "gentle", "naive"],
    psyche_cautious: ["vigilant", "casual", "introverted", "chic"],
  };
  const chosenPsyche = pickByPersonality(p.psychePool, psychePrefMap);

  // 6. 恋爱槽位 (romance)：所有性格开局额外抽取（1有恋人未发生关系 2有恋人已发生关系 3单身）
  const romancePool = p.romancePool || [];
  let chosenRomance = null;
  if (persona && persona.romanceState) {
    chosenRomance =
      romancePool.find((r) => r.id === persona.romanceState) || null;
  }
  if (!chosenRomance && romancePool.length) {
    chosenRomance = romancePool[Math.floor(next() * romancePool.length)];
  }

  // 汇聚 18 条事实（6 槽 × 3 层）
  const chosenBranches = [
    chosenHome,
    chosenSchedule,
    chosenCarry,
    chosenSocial,
    chosenPsyche,
    chosenRomance,
  ].filter(Boolean);
  const assignedFacts = [];
  for (const b of chosenBranches) {
    if (b.facts && Array.isArray(b.facts)) {
      for (const f of b.facts) assignedFacts.push(f);
    }
  }

  const factSummary = {
    home: chosenHome ? chosenHome.id : null,
    schedule: chosenSchedule ? chosenSchedule.id : null,
    carry: chosenCarry ? chosenCarry.id : null,
    social: chosenSocial ? chosenSocial.id : null,
    psyche: chosenPsyche ? chosenPsyche.id : null,
    romance: chosenRomance ? chosenRomance.id : null,
  };

  // 绑定持久化至 persona（整局不变）
  if (persona) {
    persona.assignedFacts = assignedFacts;
    persona.factSummary = factSummary;
  }

  return { assignedFacts, factSummary };
}

module.exports = { resolveTargetFacts };
