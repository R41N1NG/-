"use strict";
const C = require("../runtime/contracts");
const KEY = "xsd2_player_repair";
// One bounded backup in native chat metadata, outside inherited message variables.
function createRepairBackup({
  context,
  rawContext,
  guard,
  helper,
  save,
  withSaving,
}) {
  function metadata() {
    return (rawContext().chatMetadata ||= {});
  }
  return {
    isRepairPaused() {
      const pause = metadata().xsd2_player_repair_pause,
        c = context();
      return (
        pause?.chatId === c.chatId &&
        JSON.stringify(pause.trail) === JSON.stringify(C.fingerprint(c.chat))
      );
    },
    async readRepairBackup() {
      return C.clone(metadata()[KEY] || null);
    },
    async writeRepairBackup(c, payload, floors) {
      return withSaving(async () => {
        guard(c);
        const chatVariables = C.clone(
          await helper.getVariables({ type: "chat" }),
        );
        guard(c);
        const messages = [];
        for (const floor of [...new Set(floors)]) {
          const variables = C.clone(
            await helper.getVariables({ type: "message", message_id: floor }),
          );
          guard(c);
          const m = c.chat[floor];
          messages.push({
            floor,
            extra: C.clone(m.extra || {}),
            swipe_info: C.clone(m.swipe_info || null),
            variables,
          });
        }
        const backup = {
          schema: 1,
          ...C.clone(payload),
          chatId: c.chatId,
          branchId: c.branchId,
          chatVariables,
          messages,
        };
        if (new Blob([JSON.stringify(backup)]).size > 8 * 1024 * 1024)
          throw Error("本次修复备份超过8MB，请先导出聊天记录；未执行修复");
        metadata()[KEY] = backup;
        await save();
        guard(c);
        return backup;
      });
    },
    async sealRepairBackup(c, id, after) {
      return withSaving(async () => {
        guard(c);
        const b = metadata()[KEY];
        if (b?.id !== id) throw Error("修复备份已变化");
        b.after = C.clone(after);
        await save();
        guard(c);
        if (!after.failed) {
          delete metadata().xsd2_player_repair_pause;
          await save();
          guard(c);
        }
      });
    },
    async restoreRepairBackup(c, id) {
      return withSaving(async () => {
        guard(c);
        const b = metadata()[KEY];
        if (b?.id !== id || b.chatId !== c.chatId || b.branchId !== c.branchId)
          throw Error("修复备份不属于当前聊天");
        // Repair never rewrites story text. Restoring archives leaves native swipe
        // text and message identities intact, so the same guard covers every await.
        for (const item of b.messages) {
          guard(c);
          const m = c.chat[item.floor];
          m.extra = C.clone(item.extra);
          if (item.swipe_info) m.swipe_info = C.clone(item.swipe_info);
          else delete m.swipe_info;
          await helper.replaceVariables(C.clone(item.variables || {}), {
            type: "message",
            message_id: item.floor,
          });
          guard(c);
        }
        await helper.replaceVariables(C.clone(b.chatVariables || {}), {
          type: "chat",
        });
        guard(c);
        await save();
        guard(c);
        delete metadata()[KEY];
        metadata().xsd2_player_repair_pause = {
          chatId: c.chatId,
          trail: C.fingerprint(c.chat),
        };
        await save();
        guard(c);
        return C.clone(b);
      });
    },
  };
}
module.exports = { createRepairBackup };
