"use strict";
const {
  VAR_SAVE,
  VAR_SNAP,
  VAR_INIT,
  VAR_CONF,
  VAR_DIAG,
  VAR_TIMELINE,
  VAR_BACKUP,
} = require("./keys.js");

// [CHAT_SYNC:STORAGE] 宿主聊天变量的读写出口。引擎序列化仍在 runtime/game/save.js。
// 注意：当前 vars API 跟随宿主的活动聊天；CHAT_CHANGED 隔离/版本校验尚待接线。
function createChatRepository(vars) {
  return {
    read: () => vars.read(),
    writeSnapshot: ({ save, snap, diagnostics, timeline, backup, init }) =>
      vars.assign({
        ...(init === undefined ? {} : { [VAR_INIT]: init }),
        [VAR_SAVE]: save,
        [VAR_SNAP]: snap,
        [VAR_DIAG]: diagnostics,
        ...(timeline === undefined ? {} : { [VAR_TIMELINE]: timeline }),
        ...(backup === undefined ? {} : { [VAR_BACKUP]: backup }),
      }),
    begin: (init) => vars.assign({ [VAR_INIT]: init, [VAR_SAVE]: null }),
    reset: (backup) =>
      vars.assign({
        [VAR_INIT]: null,
        [VAR_SAVE]: null,
        [VAR_SNAP]: null,
        [VAR_DIAG]: null,
        [VAR_TIMELINE]: null,
        [VAR_BACKUP]: backup,
      }),
    writeConf: (conf) => vars.assign({ [VAR_CONF]: conf }),
  };
}
module.exports = { createChatRepository };
