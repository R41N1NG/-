// Append after the complete runtime, in the same script context.
// Starting preserves the current chat save; it never forces reinitialization.
globalThis.OKH_CARD_READY = (async function () {
  if (!globalThis.OKH_APP) throw Error('请先加载完整 okh_complete.js');
  // Character scripts can mount before SillyTavern has allocated the chat ID.
  let readinessTimer = null;
  if (typeof globalThis.addEventListener === 'function' && !globalThis.__OKH_CARD_UNLOAD_BOUND__) {
    globalThis.__OKH_CARD_UNLOAD_BOUND__ = true;
    globalThis.addEventListener('unload', () => {
      if (readinessTimer !== null) clearInterval(readinessTimer);
      const cleanup = globalThis.__OKH_HUD_CLEANUP__;
      for (const owner of [globalThis, globalThis.parent]) {
        try { if (owner?.document?.__OKH_HUD_CLEANUP__ === cleanup) cleanup?.(); } catch (_) {}
      }
      globalThis.OKH_APP.stop().catch(error => console.warn('[奥克赫斯] 卸载清理：', error.message));
    }, { once: true });
  }
  const chatReady = () => { try { globalThis.OKH_APP.W.chatId(); return true; } catch (_) { return false; } };
  if (!chatReady()) await new Promise(resolve => {
    readinessTimer = setInterval(() => {
      if (chatReady()) { clearInterval(readinessTimer); readinessTimer = null; resolve(); }
    }, 100);
  });
  await globalThis.OKH_APP.start();
  const chat = globalThis.OKH_APP.W.context()?.chat || [];
  if (chat.length === 1 && !chat[0]?.is_user && !chat[0]?.is_system && chat[0]?.mes) {
    await globalThis.OKH_APP.onMessage(0);
  }
  console.log('[奥克赫斯] 监听已启动', globalThis.OKH_APP.info());
  return globalThis.OKH_APP.info();
})();
globalThis.OKH_CARD_READY.catch(error => console.error('[奥克赫斯] 启动失败：', error));
