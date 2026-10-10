/* XSD_MESSAGE_READER_CORE_BEGIN */
/** 只读消息入口：不写消息、不写身份、不注册事件。 */
function createXsdMessageReader({ API, console, TAG, msgOf }) {
/** 取某条消息的正文（酒馆助手的返回形状不稳定，两种都兜） */
function messageText(messageId, withSwipes) {
  if (!API.getChatMessages) return null;
  try {
    const opt = withSwipes ? { include_swipes: true } : undefined;
    const r = API.getChatMessages(messageId, opt);
    const arr = Array.isArray(r) ? r : (r ? [r] : []);
    for (const m of arr) {
      if (m && (m.message !== undefined || m.mes !== undefined)) return String(m.message ?? m.mes ?? '');
    }
  } catch (e) { console.warn(TAG, `读第 ${messageId} 楼正文失败：`, msgOf(e)); }
  return null;
}

/** 聊天里现在是不是「只有开场楼」＝新聊天 */
function isNewChat() {
  try {
    if (API.getLastMessageId) {
      const n = API.getLastMessageId();
      if (typeof n === 'number') return n <= 0;
    }
    if (API.getChatMessages) {
      const last = API.getChatMessages(-1);
      const m = Array.isArray(last) ? (last[last.length - 1] ?? last[0]) : last;
      if (m && (m.message_id !== undefined || m.mesid !== undefined)) return Number(m.message_id ?? m.mesid) <= 0;
    }
  } catch (e) { /* 取不到就按「不是新聊天」处理，宁可不覆盖 */ }
  return false;
}

/** 最新一楼的消息号；**取不到就返回 null ⇒ 调用方默认放行**。
 *  ⚠️ 绝不能因为「判不出来」就把写入焊死（NaN 比较恒 false 会把整个记账锁死）——
 *     这条教训来自参照卡（它同一处的注释也是这么写的）。 */
function latestMessageId() {
  try {
    if (API.getLastMessageId) {
      const n = Number(API.getLastMessageId());
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch (e) { /* 继续回退 */ }
  try {
    if (API.getChatMessages) {
      const last = API.getChatMessages(-1);
      const m = Array.isArray(last) ? (last[last.length - 1] ?? last[0]) : last;
      const id = Number(m?.message_id);
      if (Number.isFinite(id) && id >= 0) return id;
    }
  } catch (e) { /* 取不到 */ }
  return null;
}

  return { messageText, isNewChat, latestMessageId };
}
/* XSD_MESSAGE_READER_CORE_END */
