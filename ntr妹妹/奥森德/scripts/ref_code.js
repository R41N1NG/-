<USER_REQUEST>
ok，没问题。哦，对了。我有个功能想实现，这里一并说了。
如图，我想让角色发言时想图片内一样有气泡和发言美化。
以下是参考代码，不要照抄，仅参考：
/* 群星沉默之地 · 气泡头像与分侧
 * 维护源；bubble/build-bubble-side.cjs 仅同步 avatars.json 头像表。
 */
(function () {
  'use strict';
  if (window.__qxBubbleSide) return;
  var DOC = (function () {
    try {
      if (window.parent && window.parent !== window && window.parent.document && window.parent.document.body) return window.parent.document;
    } catch (e) { /* 跨源时仅处理当前文档 */ }
    return document;
  })();

  /* AVATARS_START */
  var AVA = {"伊瑟琳":"https://i.postimg.cc/YqTH60V5/yi-se-lin.png","埃德温":"https://i.postimg.cc/tgQ9jJzy/ai-de-wen.png","塞芙琳":"https://i.postimg.cc/vBXyfzF3/sai-fu-lin.png","奥蕾娜":"https://i.postimg.cc/1zGs5SWh/ao-lei-na.png","瑟缇娅":"https://i.postimg.cc/PxKHY4sB/se-ti-ya.png","米芙拉":"https://i.postimg.cc/ZRJZWQgW/mi-fu-la.png","米蕾娅":"https://i.postimg.cc/Y9tkvPV1/mi-lei-ya.png","维罗莎":"https://i.postimg.cc/HWZHLBtB/wei-luo-sha.png","莱昂":"https://i.postimg.cc/DzrnyhCW/lai-ang.png","蕾希娅":"https://i.postimg.cc/hGLcPnCv/lei-xi-ya.png","薇奥拉":"https://i.postimg.cc/BbVGwnvy/wei-ao-la.png","薇蕾娜":"https://i.postimg.cc/ZY7ZqVLv/wei-lei-na.png","诺薇娅":"https://i.postimg.cc/gJGdx75M/nuo-wei-ya.png"};
  /* AVATARS_END */
  var STORE_PREFIX = 'qx_ava_';
  var PLAYER_KEY = '__player__';
  var MAX_BYTES = 20 * 1024 * 1024;
  var DONE = 'data-qx-ava-done';
  var OVERLAY = 'data-qx-ava-zoom';
  var ME = '';
  var observer, timer, poll, returnFocus, pendingInput, alive = true;

  function store(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function saveStore(key, val) {
    try {
      window.localStorage.setItem(key, val);
      if (window.localStorage.getItem(key) !== val) throw new Error('readback');
      return tr
<truncated 11800 bytes>
oom(imageFor(who), who, ava);
  }
  function boot() {
    apply(DOC);
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(function () {
        if (timer) return;
        timer = setTimeout(function () { timer = null; apply(DOC); }, 60);
      });
      observer.observe(DOC.body || DOC.documentElement, { childList: true, subtree: true });
    }
    /* MVU 可能晚于首批气泡就绪；重读只更新显示，不改游戏数据。 */
    poll = setInterval(function () { if (playerName() !== ME) apply(DOC); }, 1500);
  }
  function cleanup() {
    alive = false;
    if (observer) observer.disconnect(); clearTimeout(timer); clearInterval(poll);
    DOC.removeEventListener('click', onAvatar, true); DOC.removeEventListener('keydown', onAvatar, true);
    DOC.removeEventListener('qx-player-avatar-changed', refreshAvatars);
    window.removeEventListener('storage', refreshAvatars);
    DOC.removeEventListener('DOMContentLoaded', boot); closeZoom();
    if (pendingInput) pendingInput.remove();
    window.removeEventListener('pagehide', cleanup);
    delete window.QxBubbleSide; delete window.__qxBubbleSide;
  }
  DOC.addEventListener('click', onAvatar, true); DOC.addEventListener('keydown', onAvatar, true);
  DOC.addEventListener('qx-player-avatar-changed', refreshAvatars);
  window.addEventListener('storage', refreshAvatars);
  window.addEventListener('pagehide', cleanup, { once: true });
  if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.QxBubbleSide = { apply: apply, playerName: playerName, avatars: AVA, destroy: cleanup };
  window.__qxBubbleSide = true;
})();

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-20T20:05:21+08:00.

The user has uploaded 1 image(s):
- C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/.user_uploaded/media_1795176213487_a3fa3ae9.jpg
You can embed this image in an artifact if you need the USER to review it.
</ADDITIONAL_METADATA>