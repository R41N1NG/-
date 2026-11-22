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
      return true;
    } catch (e) { return false; }
  }
  function fromState(d) {
    var st = d && d.stat_data;
    var p = st && (st['玩家'] || st.player);
    return p ? String(p['称呼'] || p['名字'] || p.name || '').trim() : '';
  }
  function playerName() {
    var v = '';
    try {
      var M = window.Mvu || (window.parent && window.parent.Mvu);
      if (M && typeof M.getCurrentMvuData === 'function') v = fromState(M.getCurrentMvuData());
    } catch (e) { /* 使用现有项目的消息变量读取路径 */ }
    try {
      if (!v && typeof getVariables === 'function') v = fromState(getVariables({ type: 'message', message_id: -1 }));
    } catch (e) { /* MVU 尚未就绪，稍后重读 */ }
    /* 已核对本机酒馆助手 4.11.3 声明/源码：只取最近 20 楼的已选 assistant 页，
       最新一楼可能是没有 stat_data 的玩家消息；不扫描全部历史，不写变量。 */
    try {
      if (!v && typeof getLastMessageId === 'function' && typeof getChatMessages === 'function') {
        var last = getLastMessageId();
        if (Number.isInteger(last) && last >= 0) {
          var recent = getChatMessages(Math.max(0, last - 19) + '-' + last, { role: 'assistant', include_swipes: false });
          for (var i = recent.length - 1; i >= 0 && !v; i--) v = fromState(recent[i].data);
        }
      }
    } catch (e) { /* 缺能力时保持别名分侧，第三人称等待状态就绪 */ }
    return v;
  }
  function isPlayer(who) {
    if (ME && who === ME) return true;
    if (Object.prototype.hasOwnProperty.call(AVA, who)) return false;
    return ['我', '你', '您', '玩家', '主角', '{{user}}'].indexOf(who) !== -1;
  }
  function avatarKey(who) { return isPlayer(who) ? PLAYER_KEY : who; }
  function imageFor(who) {
    var shared = isPlayer(who) ? store(STORE_PREFIX + PLAYER_KEY) : null;
    var legacy = {};
    try { legacy = JSON.parse(store('qx_v3_portraits') || '{}'); } catch (_) {}
    var img = shared !== null ? shared : (store(STORE_PREFIX + who) || (isPlayer(who) ? legacy.player : '') || AVA[who] || '');
    /* 旧存储也只接受图片 data URL 或原有 HTTPS 图片。 */
    return /^(data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+|https:\/\/[^\s"\\]+)$/i.test(img) ? img : '';
  }

  function closeZoom() {
    var o = DOC.querySelector('[' + OVERLAY + ']');
    if (o && o.parentNode) o.parentNode.removeChild(o);
    DOC.removeEventListener('keydown', onKey);
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    returnFocus = null;
  }
  function onKey(e) {
    var o = DOC.querySelector('[' + OVERLAY + ']');
    if (e.key === 'Escape') { e.preventDefault(); closeZoom(); }
    if (e.key === 'Tab' && o) {
      var buttons = o.querySelectorAll('button');
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && DOC.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && DOC.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function openZoom(src, label, host) {
    closeZoom();
    returnFocus = host || DOC.activeElement;
    var o = DOC.createElement('div');
    o.setAttribute(OVERLAY, '');
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-label', label + '的气泡头像');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(4,6,9,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;box-sizing:border-box;overflow:auto;color:#e2c792';
    if (src) {
      var img = DOC.createElement('img');
      img.src = src; img.alt = label;
      img.style.cssText = 'max-width:min(86vw,720px);max-height:65vh;border-radius:4px;border:1px solid rgba(226,199,146,.4);object-fit:contain';
      o.appendChild(img);
    }
    var cap = DOC.createElement('div');
    cap.textContent = label + ' · 气泡头像';
    o.appendChild(cap);
    var status = DOC.createElement('div');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'font-size:13px;max-width:32em;text-align:center;line-height:1.6';
    status.textContent = '选择 PNG、JPEG 或 WebP，最大 20 MiB；自动缩小为头像后保存在当前浏览器。';
    o.appendChild(status);
    function button(text, action) {
      var b = DOC.createElement('button'); b.type = 'button'; b.textContent = text;
      b.style.cssText = 'min-height:44px;padding:8px 18px;border:1px solid #9b8764;border-radius:4px;background:#211e19;color:#f0dfbe;cursor:pointer;font:inherit';
      b.addEventListener('click', action); o.appendChild(b); return b;
    }
    var upload = button('上传 / 更换头像', function () { pickFile(label, status, upload); });
    button('关闭', closeZoom);
    o.addEventListener('click', function (e) { if (e.target === o) closeZoom(); });
    (DOC.body || DOC.documentElement).appendChild(o);
    DOC.addEventListener('keydown', onKey);
    upload.focus();
  }

  function pickFile(name, status, button) {
    if (pendingInput) pendingInput.remove();
    var targetKey = STORE_PREFIX + avatarKey(name);
    var input = DOC.createElement('input'); pendingInput = input;
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp'; input.style.display = 'none';
    function clear() { input.remove(); if (pendingInput === input) pendingInput = null; button.disabled = false; }
    function fail(text) { if (alive) status.textContent = text; clear(); }
    input.addEventListener('cancel', clear);
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) { clear(); return; }
      if (['image/png', 'image/jpeg', 'image/webp'].indexOf(f.type) === -1) { fail('格式不支持，请选择 PNG、JPEG 或 WebP。'); return; }
      if (!f.size || f.size > MAX_BYTES) { fail('请选择非空且不超过 20 MiB 的图片。'); return; }
      button.disabled = true; status.textContent = '正在读取头像…';
      var reader = new FileReader();
      reader.onerror = function () { fail('读取失败，请重新选择文件。'); };
      reader.onabort = function () { fail('已取消读取，原头像保留。'); };
      reader.onload = function () {
        if (!alive || !status.isConnected) { clear(); return; }
        var data = String(reader.result || '');
        if (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(data) || data.length > Math.ceil(MAX_BYTES * 4 / 3) + 200) { fail('图片内容或大小不符合要求，原头像保留。'); return; }
        var probe = DOC.createElement('img');
        probe.onerror = function () { fail('图片解码失败，请选择有效图片。'); };
        probe.onload = function () {
          if (!alive || !status.isConnected) { clear(); return; }
          if (!probe.naturalWidth || !probe.naturalHeight || probe.naturalWidth * probe.naturalHeight > 64000000) { fail('请选择有效且总像素不超过 6400 万的图片。'); return; }
          try {
            var scale = Math.min(1, 768 / Math.max(probe.naturalWidth, probe.naturalHeight));
            var canvas = DOC.createElement('canvas');
            canvas.width = Math.max(1, Math.round(probe.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(probe.naturalHeight * scale));
            var ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas unavailable');
            ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
            data = canvas.toDataURL('image/webp', 0.85);
            if (data.indexOf('data:image/webp;') !== 0) data = canvas.toDataURL('image/png');
          } catch (e) { fail('头像缩放失败，原头像保留，请换一张图片。'); return; }
          if (!saveStore(targetKey, data)) { fail('保存失败：浏览器存储被禁用或空间不足。原头像保留，请检查存储设置后重试。'); return; }
          if (isPlayer(name)) DOC.dispatchEvent(new CustomEvent('qx-player-avatar-changed'));
          refreshAvatars();
          var view = DOC.querySelector('[' + OVERLAY + '] img');
          if (view) view.src = data;
          status.textContent = isPlayer(name) ? '头像已保存；同一玩家的一、二、三人称对白共用此头像。' : '头像已保存，当前人物的所有气泡已更新。';
          clear();
        };
        probe.src = data;
      };
      try { reader.readAsDataURL(f); } catch (e) { fail('读取失败，原头像保留，请重新选择文件。'); }
    });
    (DOC.body || DOC.documentElement).appendChild(input);
    input.click();
  }
  function paint(host, who) {
    var img = imageFor(who);
    host.style.backgroundImage = img ? 'url("' + img + '")' : '';
    host.textContent = img ? '' : who.slice(0, 1);
    host.style.flex = '0 0 44px'; host.style.width = '44px'; host.style.height = '58px';
    host.style.borderRadius = '4px'; host.style.alignSelf = 'flex-start'; host.style.boxSizing = 'border-box';
    host.style.display = 'flex'; host.style.alignItems = 'center'; host.style.justifyContent = 'center';
    host.style.color = 'rgba(226,199,146,.85)'; host.style.fontSize = '15px'; host.style.cursor = 'pointer';
    host.setAttribute('role', 'button'); host.setAttribute('tabindex', '0');
    host.setAttribute('aria-label', who + '的头像，点击查看或上传'); host.title = '点击查看 / 上传头像';
    host.setAttribute('data-qx-ava-key', avatarKey(who)); host.setAttribute(DONE, '');
  }
  function refreshAvatars() {
    var avas = DOC.querySelectorAll('[data-qx-ava]');
    for (var i = 0; i < avas.length; i++) paint(avas[i], avas[i].getAttribute('data-qx-ava') || '');
  }
  function apply(root) {
    var scope = root || DOC;
    ME = playerName();
    if (!scope.querySelectorAll) return;
    var dlgs = scope.querySelectorAll('[data-qx-dlg]');
    for (var k = 0; k < dlgs.length; k++) {
      var d = dlgs[k], who = String(d.getAttribute('data-qx-speaker') || '').trim();
      var right = isPlayer(who), side = right ? 'right' : 'left';
      var holder = d.querySelector('[data-qx-ava]'), col = holder && holder.nextElementSibling;
      d.style.alignItems = 'flex-start';
      if (d.getAttribute('data-qx-sided') !== side) {
        d.setAttribute('data-qx-side', side); d.setAttribute('data-qx-sided', side);
        d.style.justifyContent = right ? 'flex-end' : 'flex-start';
        if (holder) holder.style.order = right ? '2' : '0';
        if (col) col.style.alignItems = right ? 'flex-end' : 'flex-start';
        var nm = d.querySelector('[data-qx-dlg-name]');
        if (nm) { nm.style.textAlign = side; nm.style.paddingLeft = right ? '0' : '1px'; nm.style.paddingRight = right ? '1px' : '0'; }
        var bd = d.querySelector('[data-qx-dlg-body]');
        if (bd) {
          bd.style.borderRadius = right ? '10px 2px 10px 10px' : '2px 10px 10px 10px';
          bd.style.borderLeft = right ? '1px solid rgba(226,199,146,.24)' : '2px solid rgba(226,199,146,.52)';
          bd.style.borderRight = right ? '2px solid rgba(226,199,146,.6)' : '1px solid rgba(211,216,222,.13)';
          bd.style.background = right ? 'linear-gradient(135deg,rgba(42,37,28,.93),rgba(27,24,19,.9))' : 'linear-gradient(135deg,rgba(29,33,40,.93),rgba(19,22,28,.9))';
        }
      }
      if (holder && (!holder.hasAttribute(DONE) || holder.getAttribute('data-qx-ava-key') !== avatarKey(who))) paint(holder, who);
    }
  }
  function onAvatar(e) {
    var ava = e.target && e.target.closest ? e.target.closest('[data-qx-ava]') : null;
    if (!ava) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    var who = ava.getAttribute('data-qx-ava') || '';
    openZoom(imageFor(who), who, ava);
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