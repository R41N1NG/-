"use strict";
// Descriptive use rules only. No invented healing amounts, buffs or realm gains.
const RULES = {
  醉春风: {consumable:true, description:"酒。", effect:"饮用一份，按已有剧情描写酒香和饮酒反应；没有配置数值增益。"},
  草药: {consumable:true, description:"节点采集的草药。", effect:"使用一份；具体药性与疗效尚未配置，不自行提升修为或恢复数值。"},
  丹药: {consumable:true, description:"洞府中遗留的丹药。", effect:"服用一份；具体药性与疗效尚未配置，不自行提升修为或恢复数值。"},
  幽寂谷地图: {consumable:false, useMode:"view", description:"暗格所得的幽寂谷路线地图，可称残图或残卷。", effect:"展开阅读已有路线线索；查看不消耗、不移动玩家、不改变事件开放日期，不泄露未开放的奖励。", aliases:["地图","残图","舆图","残卷"]},
  墨山道佩剑: {consumable:false, description:"墨山道弟子的佩剑。", effect:"使用佩剑，不扣数量；动作与现有场景一致，不凭空增加新法宝能力。"},
  随身青锋剑: {consumable:false, description:"随身佩剑。", effect:"使用佩剑，不扣数量；动作与现有场景一致，不凭空增加新法宝能力。"},
  天姝令: {consumable:false, description:"殿主信物。", effect:"查看或出示信物，不扣数量；作用以已有世界书和剧情为准。"},
  法宝: {consumable:false, description:"密室获得的法宝，具体属性尚未配置。", effect:"使用不扣数量；具体能力未配置，不自行编造数值或新能力。"},
  秘籍: {consumable:false, useMode:"view", description:"密室获得的秘籍，具体内容尚未配置。", effect:"研读不扣数量；没有配置修炼增量，不自动晋升。"},
};
function describeItem(item) {
  const base = RULES[item.name] || (String(item.name).startsWith("《")
    ? {consumable:false, useMode:"view", description:"可研读的书册或法诀。", effect:"按对应世界书研读，不扣数量；未配置修炼增量不自动晋升。"} : {});
  return {...item,
    consumable:typeof item.consumable === "boolean" ? item.consumable : base.consumable === true,
    description:item.description || base.description || "物品介绍尚未配置。",
    effect:item.effect || base.effect || "具体使用效果尚未配置，不能凭空产生数值增益或额外物品。",
    aliases:item.aliases || base.aliases || [],
    useMode:item.useMode || base.useMode || "send",
  };
}
function itemUsePrompt(item, remaining) {
  return ["【本轮物品使用】玩家已经选择使用「" + item.name + "」。",
    "物品介绍：" + item.description,
    "使用效果与限制：" + item.effect,
    item.consumable ? "这是消耗品，后台已经扣除1份，剩余" + remaining + "份；不得重复扣减。" : "这是非消耗品，本次使用不扣数量，不写成吞食、消失或用尽。",
    "认真读取以上介绍和效果，围绕本次使用写正文与人物反应，不套用其他物品的功效。未配置的数值提升、新能力、物品或路线不得自行增加。",
  ].join("\n");
}
module.exports = {describeItem, itemUsePrompt};
