// Append after the complete runtime, in the same script context.
// Starting preserves the current chat save; it never forces reinitialization.
globalThis.OKH_CARD_READY = (async function () {
  if (!globalThis.OKH_APP) throw Error('请先加载完整 okh_complete.js');
  await globalThis.OKH_APP.start();
  const chat = globalThis.OKH_APP.W.context()?.chat || [];
  if (chat.length === 1 && !chat[0]?.is_user && !chat[0]?.is_system && chat[0]?.mes) {
    await globalThis.OKH_APP.onMessage(0);
  }
  console.log('[奥克赫斯] 监听已启动', globalThis.OKH_APP.info());
  return globalThis.OKH_APP.info();
})();
globalThis.OKH_CARD_READY.catch(error => console.error('[奥克赫斯] 启动失败：', error));
