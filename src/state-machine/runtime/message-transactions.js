/** 身份：gpt。单实例消息调度队列：上下文、正文/分支签名和成功去重统一管理。 */
function createXsdMessageTransactions({ contextKey, latestMessageId, messageSignature }) {
  let epoch = 0, disposed = false;
  const seenMessages = new Set(), pending = new Map(), tails = new Map();
  function capture(messageId, fingerprint) {
    return Object.freeze({ chatKey: String(contextKey()), messageId: Number(messageId),
      signature: messageSignature(Number(messageId)), fingerprint, epoch });
  }
  function current(token) {
    if (disposed || token.epoch !== epoch || token.chatKey !== String(contextKey())) return false;
    const latest = latestMessageId();
    if (latest !== null && Number(latest) !== token.messageId) return false;
    const signature = messageSignature(token.messageId);
    return token.signature === null || signature === token.signature;
  }
  function guard(token) { if (!current(token)) throw Error('聊天、最新楼或消息分支已变化，旧任务已中止'); }
  function run(token, key, task) {
    if (pending.has(key)) return pending.get(key);
    if (seenMessages.has(key)) return Promise.resolve({ ok: true, duplicate: true, mesid: token.messageId });
    const lane = token.chatKey;
    const previous = tails.get(lane) || Promise.resolve();
    const promise = previous.catch(() => {}).then(async () => {
      guard(token);
      const result = await task(() => guard(token));
      guard(token);
      if (result && result.ok === true) {
        seenMessages.add(key);
        if (seenMessages.size > 300) seenMessages.delete(seenMessages.values().next().value);
      }
      return result || { ok: false, why: '处理未返回提交结果', retryable: true };
    }).catch(error => ({ ok: false, why: error && error.message || String(error), retryable: true }))
      .finally(() => { if (pending.get(key) === promise) pending.delete(key); if (tails.get(lane) === promise) tails.delete(lane); });
    pending.set(key, promise); tails.set(lane, promise);
    return promise;
  }
  function reset() { epoch++; seenMessages.clear(); }
  function dispose() { disposed = true; reset(); }
  return Object.freeze({ capture, current, guard, run, reset, dispose, seenMessages, pending,
    get epoch() { return epoch; }, get disposed() { return disposed; } });
}
