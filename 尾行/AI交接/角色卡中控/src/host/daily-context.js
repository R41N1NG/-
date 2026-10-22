"use strict";
// 只向模型投影已保存的日程信息；不推测目标日程或解析自然语言效果。
function dailyContextText(snap) {
  const p = snap.dayPlan;
  const last = p.lastReceipt?.summary;
  return [
    "【日程状态 · 本地存档为准】",
    `第 ${p.date} 天，${p.periodName}，行动点 ${p.remaining}/${p.budget}。`,
    p.activity
      ? `当前活动：${p.activity.name}。`
      : p.ended
        ? "本日已结束，等待进入下一天。"
        : "当前没有进行中的活动。",
    last ? `最近已结算活动：${last}` : "尚无已结算的日程活动。",
    "玩家输入仅为伴随叙事。不得凭文字扣点、推进时段、发放金钱物品或解锁情报；实际结果只认本地活动回执。",
    "当前不处于尾行阶段。不得把夜间路线当作眼前场景，不得默认目标就在玩家面前，不得把未解锁情报写成玩家已经掌握。",
    "可以描写环境、日常细节与已发生的活动，不得另行宣布未执行的活动成功。",
  ].join("\n");
}
module.exports = { dailyContextText };
