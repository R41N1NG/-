/* ═══════════════════════════════════════════════════════════
 * 二 · 酒馆助手接口探测（全部 typeof 保护，取不到就降级）
 * ═══════════════════════════════════════════════════════════ */

function msgOf(e) { return (e && e.message) || String(e); }

/** 多层安全探查全局/宿主函数：依次从 window、TavernHelper、parent.TavernHelper、top.TavernHelper、parent、globalThis 探查 */
function getGlobalOrParent(name) {
  try { if (typeof window !== 'undefined' && typeof window[name] === 'function') return window[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.TavernHelper && typeof window.TavernHelper[name] === 'function') return window.TavernHelper[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.parent && window.parent.TavernHelper && typeof window.parent.TavernHelper[name] === 'function') return window.parent.TavernHelper[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.top && window.top.TavernHelper && typeof window.top.TavernHelper[name] === 'function') return window.top.TavernHelper[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.parent && typeof window.parent[name] === 'function') return window.parent[name]; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && typeof globalThis[name] === 'function') return globalThis[name]; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis.TavernHelper && typeof globalThis.TavernHelper[name] === 'function') return globalThis.TavernHelper[name]; } catch (e) {}
  return null;
}

/** 安全取一个全局函数：拿不到返回 null，并（按需）打一条警告。
 *  用 getter 是为了让「标识符根本不存在」也变成可捕获的异常，并在异常时自动尝试从宿主环境深度探测。 */
function grab(name, getter, required) {
  try {
    const v = getter ? getter() : null;
    if (typeof v === 'function') return v;
  } catch (e) {}
  const fallback = getGlobalOrParent(name);
  if (typeof fallback === 'function') return fallback;
  if (required) console.warn(TAG, `⚠️ 酒馆助手接口 ${name} 不是函数或不可用 —— 相关功能降级`);
  return null;
}

const API = {
  // ── 变量层（写状态、写身份）──
  getVariables: grab('getVariables', () => (typeof getVariables === 'function' ? getVariables : null), true),
  replaceVariables: grab('replaceVariables', () => (typeof replaceVariables === 'function' ? replaceVariables : null), true),
  insertOrAssignVariables: grab('insertOrAssignVariables', () => (typeof insertOrAssignVariables === 'function' ? insertOrAssignVariables : null), true),
  updateVariablesWith: grab('updateVariablesWith', () => (typeof updateVariablesWith === 'function' ? updateVariablesWith : null)),
  deleteVariable: grab('deleteVariable', () => (typeof deleteVariable === 'function' ? deleteVariable : null)),          // 登记备用，本版未调用
  // ── 聊天消息（读正文、切开场白）──
  getChatMessages: grab('getChatMessages', () => (typeof getChatMessages === 'function' ? getChatMessages : null), true),
  setChatMessages: grab('setChatMessages', () => (typeof setChatMessages === 'function' ? setChatMessages : null), true),
  // ── 角色卡与世界书（刷新开场白、拨身份条目开关）──
  getCharacter: grab('getCharacter', () => (typeof getCharacter === 'function' ? getCharacter : null)),
  getCharWorldbookNames: grab('getCharWorldbookNames', () => (typeof getCharWorldbookNames === 'function' ? getCharWorldbookNames : null)),
  getWorldbookNames: grab('getWorldbookNames', () => (typeof getWorldbookNames === 'function' ? getWorldbookNames : null)),
  getWorldbook: grab('getWorldbook', () => (typeof getWorldbook === 'function' ? getWorldbook : null)),
  replaceWorldbook: grab('replaceWorldbook', () => (typeof replaceWorldbook === 'function' ? replaceWorldbook : null)),
  
  loadWorldInfo: grab('loadWorldInfo', () => (typeof loadWorldInfo === 'function' ? loadWorldInfo : null)),
  saveWorldInfo: grab('saveWorldInfo', () => (typeof saveWorldInfo === 'function' ? saveWorldInfo : null)),
  updateWorldInfoList: grab('updateWorldInfoList', () => (typeof updateWorldInfoList === 'function' ? updateWorldInfoList : null)),
  getContext: grab('getContext', () => (typeof getContext === 'function' ? getContext : null)),
  // ── 事件 ──
  eventOn: grab('eventOn', () => (typeof eventOn === 'function' ? eventOn : null), true),
  // ── 只登记不用的（写进 __xsdWho 的「可用 API 清单」，方便排障）──
  injectPrompts: grab('injectPrompts', () => (typeof injectPrompts === 'function' ? injectPrompts : null)),
  getLastMessageId: grab('getLastMessageId', () => (typeof getLastMessageId === 'function' ? getLastMessageId : null)),
};
/** 事件名表（不是函数，单独探） */
const EVENTS = (() => {
  try { return (typeof tavern_events !== 'undefined' && tavern_events) ? tavern_events : null; }
  catch (e) { console.warn(TAG, '⚠️ 取不到 tavern_events —— 事件钩子全部跳过'); return null; }
})();

/** 获取当前活跃聊天会话 ID（用于隔离多聊天状态，防止跨聊天污染） */
function currentChatId() {
  try { if (window.__xsdCorrection) return window.__xsdCorrection.capture(API).chatId; } catch (_) {}
  try {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext)
      ? SillyTavern.getContext()
      : ((typeof API !== 'undefined' && API.getContext) ? API.getContext() : null);
    if (ctx && ctx.chatId) return String(ctx.chatId);
    if (ctx && ctx.chat_id) return String(ctx.chat_id);
    if (typeof window !== 'undefined' && window.chat_id) return String(window.chat_id);
  } catch (e) { /* 忽略 */ }
  return 'default';
}


/** toastr（多层回退：先主窗口，再 iframe 自己的） */
function toast(kind, message, timeOut) {
  try {
    let t = null;
    try { t = (window.parent && window.parent.toastr) || null; } catch (e) { t = null; }
    if (!t) { try { t = (typeof toastr !== 'undefined') ? toastr : null; } catch (e) { t = null; } }
    if (!t) return false;
    const fn = (typeof t[kind] === 'function') ? t[kind] : (typeof t.info === 'function' ? t.info : null);
    if (!fn) return false;
    fn.call(t, message, '仙姝堕', { timeOut: timeOut || 6000 });
    return true;
  } catch (e) { return false; }
}

