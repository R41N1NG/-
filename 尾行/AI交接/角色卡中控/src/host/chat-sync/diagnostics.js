"use strict";

// [CHAT_SYNC:DIAGNOSTICS] 只记录步骤、错误码和楼号，不记录聊天正文或完整存档。
function createSyncDiagnostics({ now = Date.now, limit = 24 } = {}) {
  let sequence = 0;
  const events = [];
  function record(stage, details = {}) {
    events.push({ sequence: ++sequence, at: now(), stage, ...details });
    if (events.length > limit) events.shift();
  }
  function failure(stage, code, cause) {
    record(stage, { code });
    const error = new Error(`[CHAT_SYNC:${code}] ${stage}`, { cause });
    error.code = code;
    return error;
  }
  function snapshot() {
    return { schema: 1, events: events.map((event) => ({ ...event })) };
  }
  return { record, failure, snapshot };
}
module.exports = { createSyncDiagnostics };
