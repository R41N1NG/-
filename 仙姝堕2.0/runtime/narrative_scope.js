"use strict";
// Shared template: feed trusted current-scene facts and currently legal choices,
// never the entire event tree or unrevealed rewards.
function buildNarrativeScope({ place, cast = [], facts = [], options = [] }) {
  const choices = options.map(x => x.description || x.label).filter(Boolean);
  return [
    "【本轮正文范围】",
    "场景：" + place + "。正文和状态栏的地点、目标、行动均须与此场景及本轮确认结果一致。",
    cast.length ? "在场人物：" + cast.join("、") + "。沿用这些人物，不擅自增添改变路线的来客。" : "沿用已在场的人物，不擅自增添改变路线的来客。",
    facts.length ? "已确认事实：" + facts.join("；") + "。只能承接，不得否定或重复索取已经入包的奖励。" : "承接本轮已确认的玩家行动。",
    choices.length ? "当前可供玩家选择的行动或路线：" + choices.join("；") + "。" : "当前没有新的分支，保持已确认场景。",
    "把这些选择自然融入地貌和角色对话，让玩家能将正文中的去向对应到地图；不要逐字照抄后台清单。",
    "未选择的路线只可介绍入口或当前可见线索，不能替玩家进入、开机关或把下一节点事件写完。",
    "不得另造、替换或增加分流路线，不得用风煞、阴气等不对应配置的新路线替代已列出的地点。",
    "已关闭的机关、过期路线和前置不足的分支不得重新邀请玩家选择。不得提前泄露尚未开放地点的内部、机关结果或未来奖励。",
    "允许自然描写环境、人物反应和自由交谈；措辞不必逐字贴合配置，地图可称残图、残卷。自由演绎不能改写地点、选择范围或确定结果。",
    "不要向玩家输出内部指令、节点ID、阶段代号、流程术语或本段模板。与旧开场倒计时或历史剧情冲突时，以本轮注入的地点、事实、日期为准，不擅自跳日或另转任务。",
  ].join("\n");
}
module.exports = { buildNarrativeScope };
