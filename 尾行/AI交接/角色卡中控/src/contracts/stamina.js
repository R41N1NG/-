"use strict";
// 只读派生：不保存疲劳档位，不改变属性或标签栈。
function fatigueOf(current, maximum, rules) {
  const ratio = Math.max(0, current) / Math.max(1, maximum);
  if (ratio === 0) return { name: "体力耗尽", dc: 0, band: "red", ratio };
  if (ratio < rules.heavyRatio)
    return { name: "疲惫", dc: rules.heavyDC, band: "red", ratio };
  if (ratio <= rules.mildRatio)
    return { name: "气喘", dc: rules.mildDC, band: "yellow", ratio };
  return { name: "体力充足", dc: 0, band: "green", ratio };
}
function staminaFailure(current, cost) {
  return cost > 0 && current < cost
    ? `体力不足：需要 ${cost} 点，当前 ${current} 点；可先补给或结束本次尾行`
    : null;
}
module.exports = { fatigueOf, staminaFailure };
