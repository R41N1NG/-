/**
 * 尾行 · 标签栈：唯一效果货币。
 * 总纲 1：凡加减益，后台标签栈说了算，叙事口说无效。
 * 挂载来源五类（道具/情景/她的行为/玩家行为/状态阈值），效果经汇总器流入 checks。
 */
const CAPS = { stealth: 6, fine: 4, conflict: 5, social: 5 };   // 同类封顶：隐蔽±6 / 精细±4 / 冲突±5 / 社交±5

/**
 * 挂标签。同名只刷新时长（取最长），不叠数值。
 * @param {Array} stack   当前栈（就地修改）
 * @param {object} tag    {id,name,owner,category,effects,duration:{type,count}}
 *                        category: stealth|fine|conflict|social；duration.type: scene|night|flag
 */
function apply(stack, tag) {
  const same = stack.find(t => t.id === tag.id);
  if (same) {
    if (tag.duration.type === "flag") same.duration = { type: "flag" };
    else if (tag.duration.type === "scene")
      same.duration.count = Math.max(same.duration.count || 0, tag.duration.count);
    if (tag.type && !same.type) same.type = tag.type;
    // effects 不变——同名不叠数值
    return stack;
  }
  stack.push({ id: tag.id, name: tag.name, owner: tag.owner, type: tag.type || "status", category: tag.category,
               effects: (tag.effects || []).slice(), duration: { ...tag.duration } });
  return stack;
}

/** 摘除（按 id）。 */
function remove(stack, id) {
  const i = stack.findIndex(t => t.id === id);
  if (i >= 0) stack.splice(i, 1);
  return stack;
}

/** 场景段推进：scene 型计数 -1，归零自动摘。flag 型不动。 */
function tick(stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    const t = stack[i];
    if (t.duration.type === "scene") {
      if (--t.duration.count <= 0) stack.splice(i, 1);
    }
  }
  return stack;
}

/** 整晚清场（过夜结算）：scene 清光，flag 保留。 */
function clearNight(stack) {
  return stack.filter(t => t.duration.type === "flag");
}

/**
 * 汇总某类别的修正（含封顶）。返回 {sum, capped, breakdown}。
 * breakdown 供结算流水逐条列出；capped 标记封顶是否生效。
 */
function summarize(stack, category) {
  const hits = [];
  for (const t of stack) {
    for (const e of t.effects) {
      if (e.category === category) hits.push({ src: t.name, owner: t.owner, v: e.value });
    }
  }
  let sum = hits.reduce((s, h) => s + h.v, 0);
  const cap = CAPS[category];
  let capped = false;
  if (sum > cap) { sum = cap; capped = true; }
  if (sum < -cap) { sum = -cap; capped = true; }
  return { sum, capped, breakdown: hits };
}

/** 连败保底的加值走规则层直入检定，不经标签栈——此处仅出提示用常量。 */
const PITY_BONUS = 3;

module.exports = { apply, remove, tick, clearNight, summarize, CAPS, PITY_BONUS };
