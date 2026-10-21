"use strict";
/** [CHAT_SYNC:SESSION] Epochs invalidate pending work immediately on host switches. */
/** @param {() => Promise<import("../../contracts/types").HostContext>} readContext @param {(context: import("../../contracts/types").HostContext, initialized: boolean) => void} onChange */
function createSession(readContext, onChange) {
  let epoch = 0,
    scope;
  async function capture() {
    const context = await readContext();
    const key = context?.scope ?? null;
    if (scope !== key) {
      const initialized = scope !== undefined;
      scope = key;
      epoch++;
      onChange(context, initialized);
    }
    return {
      epoch,
      scope: key,
      context: context || { scope: null, history: null },
    };
  }
  async function check(token) {
    const current = await capture();
    if (token.epoch !== epoch || token.scope !== current.scope)
      throw Object.assign(new Error("聊天已切换，旧任务已取消"), {
        code: "STALE_SESSION",
      });
    return current.context;
  }
  return {
    capture,
    check,
    invalidate() {
      epoch++;
    },
    get epoch() {
      return epoch;
    },
  };
}
module.exports = { createSession };
