"use strict";
// [CHAT_SYNC:REPORT] 白名单诊断契约；禁止传递错误堆栈、聊天正文或完整存档。
const MESSAGES = {
  HISTORY_OUTSIDE_WINDOW:
    "聊天历史与最早保留的检查点不同，已暂停覆盖存档。请恢复相应聊天内容后重新校验。",
  TIMELINE_INVALID: "回合记录损坏，已保留原档。请检查备份或提供诊断信息。",
  SAVE_INVALID: "存档数据损坏，已保留原档。请检查备份。",
  SAVE_VERSION_UNSUPPORTED: "此存档版本暂不支持，请使用对应版本的角色卡。",
  WRITE_CONFLICT:
    "其他脚本实例修改了存档，本次未覆盖。请关闭重复实例后重新校验。",
  WRITE_FAILED:
    "存储应答失败，内存操作已撤回。请先重新校验确认是否已落盘，再重试原操作。",
  READ_FAILED: "暂时无法读取存档，请稍后重新校验。",
  HISTORY_CHANGED: "操作期间聊天发生变化，内存操作已撤回。请重新校验后再操作。",
  MESSAGE_NOT_FOUND:
    "当前聊天中尚未找到这条玩家消息，本次未结算。请等待消息加载后重试。",
  RECOVERY_CONFIRM_REQUIRED: "请先确认是否以现存存档的进度为准继续。",
  RECOVERY_EXPIRED: "聊天已经切换，请在当前聊天重新校验后再选择恢复。",
  RECOVERY_UNAVAILABLE: "宿主未提供完整聊天身份和历史，暂时无法建立新检查点。",
  BACKUP_MISSING: "没有可恢复的备份。",
};
function syncReport(error = {}, context = {}) {
  const code = typeof error === "string" ? error : error.code || "SYNC_FAILED";
  const result = {
    code,
    message: MESSAGES[code] || "操作未完成，请保留当前聊天并重新校验。",
  };
  const source = error.location || {};
  const epoch = context.sessionEpoch ?? error.sessionEpoch;
  if (Number.isInteger(epoch)) result.sessionEpoch = epoch;
  result.location = {};
  for (const key of [
    "index",
    "messageId",
    "kind",
    "checkpointIndex",
    "gameTurn",
  ])
    if (["string", "number"].includes(typeof source[key]))
      result.location[key] = source[key];
  if (Number.isInteger(context.gameTurn))
    result.location.gameTurn ??= context.gameTurn;
  return result;
}
module.exports = { syncReport };
