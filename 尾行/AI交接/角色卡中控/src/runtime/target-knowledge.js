"use strict";
// 属性解锁独立维护，沿整卡原存档保存；仅投影已经确认的基础值。
const ATTRIBUTES = { per: "敏锐", agi: "敏捷", str: "体格", nrv: "胆量" };
function validateKnowledge(value, targetId) {
  const known = value?.targetId === targetId && Array.isArray(value.known)
    ? [...new Set(value.known.filter((key) => Object.hasOwn(ATTRIBUTES, key)))] : [];
  return { targetId, known };
}
function knownAttributes(g) {
  const knowledge = validateKnowledge(g.targetKnowledge, g.targetId);
  return Object.fromEntries(knowledge.known
    .filter((key) => Number.isFinite(g.targetBase?.[key]))
    .map((key) => [key, g.targetBase[key]]));
}
function unlockTargetAttribute(g) {
  g.targetKnowledge = validateKnowledge(g.targetKnowledge, g.targetId);
  const key = Object.keys(ATTRIBUTES).find((key) =>
    !g.targetKnowledge.known.includes(key) && Number.isFinite(g.targetBase?.[key]));
  if (!key) return null;
  g.targetKnowledge.known.push(key);
  return { key, name: ATTRIBUTES[key], value: g.targetBase[key] };
}
module.exports = { validateKnowledge, knownAttributes, unlockTargetAttribute, ATTRIBUTES };
