/**
 * @module      okh_bubble_side
 * @updated     2026-11-20 21:50
 * @status      active
 * @reason      对白气泡与发言美化独立引擎：自包含即时自执行、宿主DOM穿透、行内样式双重保险与实时MutationObserver监听，解决酒馆环境中样式丢失与异步初始化导致的美化失效问题
 * @deps        []
 * @provides    { boot, apply, refreshAvatars, openZoom, closeZoom }
 */
(function (root) {
  'use strict';
  if (root.__okhBubbleSideInitialized) return;
  root.__okhBubbleSideInitialized = true;

  // 跨窗口穿透：酒馆助手若在 iframe 运行，主聊天消息在宿主 window.parent.document
  function getTargetDocuments() {
    const docs = [];
    if (typeof document !== 'undefined' && document) docs.push(document);
    try {
      if (root.parent && root.parent !== root && root.parent.document && !docs.includes(root.parent.document)) {
        docs.push(root.parent.document);
      }
    } catch (_) {}
    try {
      if (root.top && root.top !== root && !docs.includes(root.top.document)) {
        docs.push(root.top.document);
      }
    } catch (_) {}
    return docs;
  }

  function getPrimaryDocument() {
    const docs = getTargetDocuments();
    for (let i = 0; i < docs.length; i++) {
      if (docs[i].querySelector?.('#chat, #chat_container, .mes_text')) return docs[i];
    }
    return docs[0] || (typeof document !== 'undefined' ? document : null);
  }

  const STORE_PREFIX = 'okh_ava_';
  const PLAYER_KEY = '__player__';
  const MAX_BYTES = 20 * 1024 * 1024;
  const DONE = 'data-okh-ava-done';
  const CLEANUP = '__OKH_BUBBLE_CLEANUP__';
  let ME = '';
  let mountedDocuments = [];
  const observers = [];
  let timer = null;
  let poll = null;
  let returnFocus = null;
  let pendingInput = null;
  let alive = false;
  let portraitChat = null;
  let portraitFrames = {};
  let portraitStateDirty = true;

  // 预置主要人物头像（可留空使用首字，支持后续直接填入 Data URI 或图床链接）
  const DEFAULT_AVATARS = {
    '古兰': '',
    '妮丝': '',
    '伊丝娜': '',
    '奥萝拉': '',
    '伯里': '',
    '塞西莉亚': '',
    '艾琳': '',
    '爱德': ''
  };
  const EXPRESSION_AVATARS = /* __OKH_BUBBLE_AVATARS__ */ {};

  function store(key) {
    try { return root.localStorage?.getItem(key); } catch (_) { return null; }
  }

  function saveStore(key, val) {
    try {
      root.localStorage?.setItem(key, val);
      if (root.localStorage?.getItem(key) !== val) throw new Error('readback');
      return true;
    } catch (_) { return false; }
  }

  function fromState(d) {
    const st = d?.stat_data;
    const p = st?.['玩家'] || st?.player;
    return p ? String(p['称呼'] || p['名字'] || p.name || '').trim() : '';
  }

  function playerName() {
    let v = '';
    try {
      const M = root.Mvu || (root.parent && root.parent.Mvu);
      if (M && typeof M.getCurrentMvuData === 'function') v = fromState(M.getCurrentMvuData());
    } catch (_) {}
    try {
      if (!v && typeof root.getVariables === 'function') v = fromState(root.getVariables({ type: 'message', message_id: -1 }));
    } catch (_) {}
    try {
      if (!v && typeof root.getLastMessageId === 'function' && typeof root.getChatMessages === 'function') {
        const last = root.getLastMessageId();
        if (Number.isInteger(last) && last >= 0) {
          const recent = root.getChatMessages(Math.max(0, last - 19) + '-' + last, { role: 'assistant', include_swipes: false });
          for (let i = recent.length - 1; i >= 0 && !v; i--) v = fromState(recent[i].data);
        }
      }
    } catch (_) {}
    return v;
  }

  function isPlayer(who) {
    if (!who) return false;
    const trimmed = String(who).trim();
    if (ME && trimmed === ME) return true;
    if (Object.prototype.hasOwnProperty.call(DEFAULT_AVATARS, trimmed) && trimmed !== '伯里') return false;
    return ['我', '你', '您', '玩家', '主角', '{{user}}', '伯里', 'Boli'].includes(trimmed);
  }

  function avatarKey(who) {
    return isPlayer(who) ? PLAYER_KEY : who;
  }

  function expressionFor(host) {
    return (host?.closest('[data-okh-dlg]')?.getAttribute('data-okh-face') || '').toLowerCase();
  }

  function formsFor(world) {
    const forms = {};
    const npcs = world?.npcs;
    if (!npcs) return forms;
    for (const id of ['gulan', 'nise', 'aurora', 'eileen']) {
      if (npcs[id]?.stage >= 3) forms[id] = 'fallen';
    }
    if (npcs.isna?.flags?.isna_fallen_orc === true) forms.isna = 'fallen';
    const aurora = npcs.aurora;
    const flags = aurora?.flags;
    const day = Math.floor(world.timeMin / 1440) + 1;
    if (!forms.aurora && aurora?.location === 'manor' && flags?.manor_service_active &&
        !flags.aurora_left_manor && !world.flags?.baron_purged && flags.aurora_worked_manor_day === day &&
        root.OKH_APP_CONFIG?.isWeekendDay(day) === false) forms.aurora = 'maid';
    return forms;
  }

  function loadPortraitFrames() {
    const W = root.OKH_APP_WORLD;
    if (!W) return;
    try {
      const id = W.chatId();
      if (id === portraitChat && !portraitStateDirty) return;
      portraitFrames = W.dialogueForms();
      portraitChat = id;
      portraitStateDirty = false;
    } catch (_) {
      portraitChat = null;
      portraitFrames = {};
      portraitStateDirty = true;
    }
  }

  function outfitFor(host, who) {
    const index = host?.closest('.mes[mesid]')?.getAttribute('mesid');
    const npc = Object.hasOwn(EXPRESSION_AVATARS, who) && EXPRESSION_AVATARS[who].npc;
    if (!npc || !portraitChat || !/^\d+$/.test(index ?? '')) return 'normal';
    return portraitFrames['reply:' + portraitChat + ':' + index]?.[npc] || 'normal';
  }

  function imageFor(who, face = '', outfit = 'normal') {
    const variants = Object.hasOwn(EXPRESSION_AVATARS, who) ? EXPRESSION_AVATARS[who].forms : {};
    const form = Object.hasOwn(variants, outfit) ? outfit : 'normal';
    const faces = variants[form] || {};
    if (face && face !== 'neutral' && Object.hasOwn(faces, face)) return faces[face];
    if (form !== 'normal') return faces.neutral || '';

    const key = avatarKey(who);
    const custom = store(STORE_PREFIX + key);
    if (custom && /^(data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+|https:\/\/[^\s"\\]+)$/i.test(custom)) {
      return custom;
    }
    const def = faces.neutral || DEFAULT_AVATARS[who];
    if (def && /^(data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+|https:\/\/[^\s"\\]+)$/i.test(def)) {
      return def;
    }
    return '';
  }

  function injectGlobalStyles() {
    const docs = mountedDocuments;
    const css = `
      .okh-dlg-row {
        display: flex !important;
        align-items: flex-start !important;
        margin: 16px 0 !important;
        gap: 12px !important;
        position: relative !important;
        box-sizing: border-box !important;
      }
      .okh-dlg-row.side-left {
        justify-content: flex-start !important;
      }
      .okh-dlg-row.side-right {
        justify-content: flex-end !important;
      }
      .okh-avatar {
        flex: 0 0 44px !important;
        width: 44px !important;
        height: 56px !important;
        border-radius: 4px !important;
        border: 1px solid rgba(226, 199, 146, 0.4) !important;
        background: #181d25 !important;
        background-size: cover !important;
        background-position: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: rgba(226, 199, 146, 0.9) !important;
        font-size: 18px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
        transition: transform 0.15s ease, border-color 0.15s ease !important;
        user-select: none !important;
        box-sizing: border-box !important;
      }
      .okh-avatar:hover {
        transform: scale(1.05) !important;
        border-color: #ffd78a !important;
      }
      .side-right .okh-avatar {
        order: 2 !important;
      }
      .side-left .okh-avatar {
        order: 0 !important;
      }
      .okh-dlg-col {
        display: flex !important;
        flex-direction: column !important;
        max-width: min(82%, 640px) !important;
        box-sizing: border-box !important;
      }
      .side-left .okh-dlg-col {
        align-items: flex-start !important;
      }
      .side-right .okh-dlg-col {
        align-items: flex-end !important;
      }
      .okh-speaker-name {
        font-size: 12px !important;
        color: #9b8764 !important;
        margin-bottom: 4px !important;
        letter-spacing: 0.5px !important;
        line-height: 1.2 !important;
      }
      .side-left .okh-speaker-name {
        text-align: left !important;
        padding-left: 2px !important;
      }
      .side-right .okh-speaker-name {
        text-align: right !important;
        padding-right: 2px !important;
      }
      .okh-dlg-bubble {
        padding: 10px 16px !important;
        font-size: 14.5px !important;
        line-height: 1.68 !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
        word-break: break-word !important;
        box-sizing: border-box !important;
      }
      .side-left .okh-dlg-bubble {
        background: linear-gradient(135deg, rgba(27, 32, 40, 0.96), rgba(18, 22, 28, 0.94)) !important;
        border-left: 2px solid rgba(226, 199, 146, 0.55) !important;
        border-right: 1px solid rgba(211, 216, 222, 0.12) !important;
        border-top: 1px solid rgba(211, 216, 222, 0.12) !important;
        border-bottom: 1px solid rgba(211, 216, 222, 0.12) !important;
        border-radius: 2px 12px 12px 12px !important;
        color: #f0dfbe !important;
        text-align: left !important;
      }
      .side-right .okh-dlg-bubble {
        background: linear-gradient(135deg, rgba(42, 36, 27, 0.96), rgba(26, 22, 17, 0.94)) !important;
        border-right: 2px solid rgba(226, 199, 146, 0.65) !important;
        border-left: 1px solid rgba(226, 199, 146, 0.22) !important;
        border-top: 1px solid rgba(226, 199, 146, 0.22) !important;
        border-bottom: 1px solid rgba(226, 199, 146, 0.22) !important;
        border-radius: 12px 2px 12px 12px !important;
        color: #f7ebcf !important;
        text-align: left !important;
      }
      .okh-ava-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 999999 !important;
        background: rgba(4, 6, 9, 0.95) !important;
        display: none;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 14px !important;
        padding: 24px !important;
        color: #e2c792 !important;
        box-sizing: border-box !important;
      }
      .okh-ava-overlay.active {
        display: flex !important;
      }
      .okh-ava-overlay-box {
        max-width: min(86vw, 420px) !important;
        max-height: 55vh !important;
        border-radius: 6px !important;
        border: 1px solid rgba(226, 199, 146, 0.4) !important;
        background: #181d25 !important;
        padding: 6px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 8px 28px rgba(0,0,0,0.7) !important;
      }
      .okh-ava-overlay-title {
        font-size: 17px !important;
        font-weight: bold !important;
        color: #f0dfbe !important;
        letter-spacing: 0.5px !important;
      }
      .okh-ava-overlay-tip {
        font-size: 13px !important;
        max-width: 32em !important;
        text-align: center !important;
        line-height: 1.6 !important;
        color: #bfa87a !important;
      }
      .okh-ava-overlay-btns {
        display: flex !important;
        gap: 12px !important;
        margin-top: 6px !important;
      }
      .okh-ava-btn {
        min-height: 40px !important;
        padding: 8px 20px !important;
        border: 1px solid #9b8764 !important;
        border-radius: 4px !important;
        background: #211e19 !important;
        color: #f0dfbe !important;
        cursor: pointer !important;
        font-size: 14px !important;
        transition: all 0.15s ease !important;
      }
      .okh-ava-btn:hover {
        background: #332d22 !important;
        border-color: #e2c792 !important;
        color: #fff !important;
      }
    `;
    for (const doc of docs) {
      if (!doc || !doc.head) continue;
      let el = doc.getElementById('okh-bubble-style');
      if (!el) {
        el = doc.createElement('style');
        el.id = 'okh-bubble-style';
        doc.head.appendChild(el);
      }
      if (el.textContent !== css) el.textContent = css;
    }
  }

  function paint(host, who, face, outfit) {
    const img = imageFor(who, face, outfit);
    host.style.setProperty('background-image', img ? `url("${img}")` : '', 'important');
    host.textContent = img ? '' : (who.slice(0, 1) || '◈');
    host.style.setProperty('flex', '0 0 44px', 'important');
    host.style.setProperty('width', '44px', 'important');
    host.style.setProperty('height', '56px', 'important');
    host.style.setProperty('border-radius', '4px', 'important');
    host.style.setProperty('align-self', 'flex-start', 'important');
    host.style.setProperty('box-sizing', 'border-box', 'important');
    host.style.setProperty('display', 'flex', 'important');
    host.style.setProperty('align-items', 'center', 'important');
    host.style.setProperty('justify-content', 'center', 'important');
    host.style.setProperty('background-size', 'cover', 'important');
    host.style.setProperty('background-position', 'center', 'important');
    host.style.setProperty('background-color', '#181d25', 'important');
    host.style.setProperty('border', '1px solid rgba(226, 199, 146, 0.4)', 'important');
    host.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.4)', 'important');
    host.style.setProperty('color', 'rgba(226, 199, 146, 0.9)', 'important');
    host.style.setProperty('font-size', '18px', 'important');
    host.style.setProperty('font-weight', 'bold', 'important');
    host.style.setProperty('cursor', 'pointer', 'important');
    host.setAttribute('role', 'button');
    host.setAttribute('tabindex', '0');
    host.setAttribute('aria-label', `${who}的头像，点击查看或上传`);
    host.title = `${who} · 点击查看 / 更换头像`;
    host.setAttribute('data-okh-ava-key', avatarKey(who));
    host.setAttribute('data-okh-ava-face', face);
    host.setAttribute('data-okh-ava-form', outfit);
    host.setAttribute(DONE, '1');
  }

  function refreshAvatars() {
    loadPortraitFrames();
    const docs = getTargetDocuments();
    for (const doc of docs) {
      if (!doc?.querySelectorAll) continue;
      const avas = doc.querySelectorAll('[data-okh-ava]');
      for (let i = 0; i < avas.length; i++) {
        const avatar = avas[i];
        const who = avatar.getAttribute('data-okh-ava') || '';
        paint(avatar, who, expressionFor(avatar), outfitFor(avatar, who));
      }
    }
  }

  function apply(scope) {
    if (!alive) return;
    injectGlobalStyles();
    ME = playerName();
    loadPortraitFrames();
    const docs = scope ? [scope] : getTargetDocuments();
    for (let di = 0; di < docs.length; di++) {
      const doc = docs[di];
      if (!doc?.querySelectorAll) continue;
      const dlgs = doc.querySelectorAll('[data-okh-dlg]');
      for (let k = 0; k < dlgs.length; k++) {
        const d = dlgs[k];
        const who = String(d.getAttribute('data-okh-speaker') || '').trim();
        const right = isPlayer(who);
        const side = right ? 'right' : 'left';
        const targetClass = right ? 'side-right' : 'side-left';
        const holder = d.querySelector('[data-okh-ava]');
        const col = d.querySelector('.okh-dlg-col') || (holder && holder.nextElementSibling);

        // 样式双保险：既赋 class，又设 inline 属性，杜绝任何外部隔离失效
        if (!d.classList.contains(targetClass)) {
          d.classList.remove('side-left', 'side-right');
          d.classList.add(targetClass);
        }
        d.style.setProperty('display', 'flex', 'important');
        d.style.setProperty('align-items', 'flex-start', 'important');
        d.style.setProperty('margin', '16px 0', 'important');
        d.style.setProperty('gap', '12px', 'important');
        d.style.setProperty('position', 'relative', 'important');
        d.style.setProperty('justify-content', right ? 'flex-end' : 'flex-start', 'important');

        if (holder) {
          holder.style.setProperty('order', right ? '2' : '0', 'important');
          const face = expressionFor(holder);
          const outfit = outfitFor(holder, who);
          if (!holder.hasAttribute(DONE) || holder.getAttribute('data-okh-ava-key') !== avatarKey(who) ||
              holder.getAttribute('data-okh-ava-face') !== face || holder.getAttribute('data-okh-ava-form') !== outfit) {
            paint(holder, who, face, outfit);
          }
        }

        if (col) {
          col.style.setProperty('display', 'flex', 'important');
          col.style.setProperty('flex-direction', 'column', 'important');
          col.style.setProperty('max-width', 'min(82%, 640px)', 'important');
          col.style.setProperty('align-items', right ? 'flex-end' : 'flex-start', 'important');
        }

        const nm = d.querySelector('[data-okh-dlg-name]');
        if (nm) {
          nm.style.setProperty('font-size', '12px', 'important');
          nm.style.setProperty('color', '#9b8764', 'important');
          nm.style.setProperty('margin-bottom', '4px', 'important');
          nm.style.setProperty('letter-spacing', '0.5px', 'important');
          nm.style.setProperty('text-align', side, 'important');
          nm.style.setProperty('padding-left', right ? '0' : '2px', 'important');
          nm.style.setProperty('padding-right', right ? '2px' : '0', 'important');
        }

        const bd = d.querySelector('[data-okh-dlg-body]');
        if (bd) {
          bd.style.setProperty('padding', '10px 16px', 'important');
          bd.style.setProperty('font-size', '14.5px', 'important');
          bd.style.setProperty('line-height', '1.68', 'important');
          bd.style.setProperty('word-break', 'break-word', 'important');
          bd.style.setProperty('box-shadow', '0 4px 16px rgba(0, 0, 0, 0.35)', 'important');
          bd.style.setProperty('border-radius', right ? '12px 2px 12px 12px' : '2px 12px 12px 12px', 'important');
          bd.style.setProperty('border-left', right ? '1px solid rgba(226,199,146,.22)' : '2px solid rgba(226,199,146,.55)', 'important');
          bd.style.setProperty('border-right', right ? '2px solid rgba(226,199,146,.65)' : '1px solid rgba(211,216,222,.12)', 'important');
          bd.style.setProperty('border-top', right ? '1px solid rgba(226,199,146,.22)' : '1px solid rgba(211,216,222,.12)', 'important');
          bd.style.setProperty('border-bottom', right ? '1px solid rgba(226,199,146,.22)' : '1px solid rgba(211,216,222,.12)', 'important');
          bd.style.setProperty('background', right
            ? 'linear-gradient(135deg, rgba(42,36,27,0.96), rgba(26,22,17,0.94))'
            : 'linear-gradient(135deg, rgba(27,32,40,0.96), rgba(18,22,28,0.94))', 'important');
          bd.style.setProperty('color', right ? '#f7ebcf' : '#f0dfbe', 'important');
          bd.style.setProperty('text-align', 'left', 'important');
        }
      }
    }
  }

  function ensureModal() {
    const doc = getPrimaryDocument();
    if (!doc?.body) return null;
    let modal = doc.getElementById('okh-bubble-modal');
    if (modal) return modal;
    modal = doc.createElement('div');
    modal.id = 'okh-bubble-modal';
    modal.className = 'okh-ava-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="okh-ava-overlay-title" data-okh-bmodal-title>头像详情</div>
      <div class="okh-ava-overlay-box" data-okh-bmodal-box style="width:160px;height:200px;"></div>
      <div class="okh-ava-overlay-tip" data-okh-bmodal-status></div>
      <div class="okh-ava-overlay-btns">
        <button type="button" class="okh-ava-btn" data-okh-bmodal-act="upload">更换默认头像</button>
        <button type="button" class="okh-ava-btn" data-okh-bmodal-act="close">关闭</button>
      </div>
    `;
    doc.body.appendChild(modal);

    modal.addEventListener('click', event => {
      if (event.target === modal) closeZoom();
      const act = event.target?.getAttribute('data-okh-bmodal-act');
      if (act === 'close') closeZoom();
      if (act === 'upload') {
        const who = modal.getAttribute('data-okh-bmodal-who') || '';
        if (who) pickFile(who);
      }
    });

    return modal;
  }

  function closeZoom() {
    const docs = mountedDocuments;
    for (const doc of docs) {
      const modal = doc?.getElementById('okh-bubble-modal');
      if (modal) modal.classList.remove('active');
    }
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }

  function showZoomPortrait(box, src, label) {
    if (!box) return;
    const portrait = box.ownerDocument.createElement(src ? 'img' : 'span');
    if (src) {
      portrait.src = src;
      portrait.alt = label;
      portrait.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:4px;';
    } else {
      portrait.textContent = label.slice(0, 1) || '◈';
      portrait.style.cssText = 'font-size:54px;font-weight:bold;color:#e2c792;';
    }
    box.replaceChildren(portrait);
  }

  function openZoom(src, label, host) {
    closeZoom();
    returnFocus = host || null;
    const modal = ensureModal();
    if (!modal) return;
    const title = modal.querySelector('[data-okh-bmodal-title]');
    const box = modal.querySelector('[data-okh-bmodal-box]');
    const status = modal.querySelector('[data-okh-bmodal-status]');
    if (title) title.textContent = `${label} · 气泡头像`;
    if (status) status.textContent = '自定义默认头像保存在当前浏览器，用于常态下无专用表情的对白。';
    showZoomPortrait(box, src, label);
    modal.setAttribute('data-okh-bmodal-who', label);
    modal.classList.add('active');
    modal.querySelector('[data-okh-bmodal-act="upload"]')?.focus();
  }

  function pickFile(who) {
    if (pendingInput) pendingInput.remove();
    const doc = getPrimaryDocument();
    if (!doc?.body) return;
    const modal = doc.getElementById('okh-bubble-modal');
    const status = modal?.querySelector('[data-okh-bmodal-status]');
    const uploadBtn = modal?.querySelector('[data-okh-bmodal-act="upload"]');
    const box = modal?.querySelector('[data-okh-bmodal-box]');

    const input = doc.createElement('input');
    pendingInput = input;
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.style.display = 'none';

    function clear() {
      input.remove();
      if (pendingInput === input) pendingInput = null;
      if (uploadBtn) uploadBtn.disabled = false;
    }
    function fail(text) {
      if (status) status.textContent = text;
      clear();
    }

    input.addEventListener('cancel', clear);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) { clear(); return; }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        fail('格式不支持，请选择 PNG、JPEG 或 WebP。');
        return;
      }
      if (!file.size || file.size > MAX_BYTES) {
        fail('图片大小不能超过 20 MiB。');
        return;
      }
      if (uploadBtn) uploadBtn.disabled = true;
      if (status) status.textContent = '正在读取与优化头像…';

      const reader = new FileReader();
      reader.onerror = () => fail('读取图片失败，请重试。');
      reader.onload = () => {
        if (!alive || pendingInput !== input) return;
        const rawUrl = String(reader.result || '');
        const probe = new Image();
        probe.onerror = () => fail('图片解码失败，请换一张图片。');
        probe.onload = () => {
          if (!alive || pendingInput !== input) return;
          try {
            const scale = Math.min(1, 768 / Math.max(probe.naturalWidth, probe.naturalHeight));
            const canvas = doc.createElement('canvas');
            canvas.width = Math.max(1, Math.round(probe.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(probe.naturalHeight * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas unavailable');
            ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
            let dataUrl = canvas.toDataURL('image/webp', 0.85);
            if (!dataUrl.startsWith('data:image/webp;')) dataUrl = canvas.toDataURL('image/png');

            const key = STORE_PREFIX + avatarKey(who);
            if (saveStore(key, dataUrl)) {
              if (modal?.getAttribute('data-okh-bmodal-who') === who) {
                showZoomPortrait(box, imageFor(who, expressionFor(returnFocus), outfitFor(returnFocus, who)), who);
                if (status) status.textContent = `${who}的默认头像已保存。`;
              }
              refreshAvatars();
            } else {
              fail('保存失败：浏览器本地存储空间已满。');
            }
          } catch (_) {
            fail('头像缩放失败，请换一张图片。');
          }
          clear();
        };
        probe.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });

    doc.body.appendChild(input);
    input.click();
  }

  function onAvatarClick(event) {
    const ava = event.target?.closest?.('[data-okh-ava]');
    if (!ava) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const who = ava.getAttribute('data-okh-ava') || '';
    loadPortraitFrames();
    openZoom(imageFor(who, expressionFor(ava), outfitFor(ava, who)), who, ava);
  }

  function onGlobalKeyDown(event) {
    if (event.key === 'Escape') closeZoom();
  }

  function scheduleApply() {
    if (!alive || timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      apply();
    }, 40);
  }

  function invalidate() {
    portraitStateDirty = true;
    scheduleApply();
  }

  function boot() {
    const docs = getTargetDocuments().filter(doc => doc?.body);
    if (alive || !docs.length) return;
    const previous = new Set(docs.map(doc => doc[CLEANUP]));
    for (const cleanup of previous) if (typeof cleanup === 'function') cleanup();
    alive = true;
    mountedDocuments = docs;
    for (const doc of docs) {
      doc[CLEANUP] = stop;
      doc.getElementById('okh-bubble-modal')?.remove();
    }
    apply();
    ensureModal();

    for (const doc of docs) {
      doc.addEventListener('click', onAvatarClick, true);
      doc.addEventListener('keydown', onAvatarClick, true);
      doc.addEventListener('keydown', onGlobalKeyDown, true);

      if (typeof MutationObserver !== 'undefined' && doc.body) {
        const obs = new MutationObserver(scheduleApply);
        obs.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-okh-face'] });
        observers.push(obs);
      }
    }

    if (!poll) {
      poll = setInterval(() => {
        const previous = portraitChat;
        loadPortraitFrames();
        if (playerName() !== ME || portraitChat !== previous) apply();
      }, 1500);
    }
  }

  function stop() {
    if (!alive) return;
    alive = false;
    for (const observer of observers.splice(0)) observer.disconnect();
    if (timer !== null) clearTimeout(timer);
    if (poll !== null) clearInterval(poll);
    timer = poll = null;
    pendingInput?.remove();
    pendingInput = null;
    returnFocus = null;
    portraitChat = null;
    portraitFrames = {};
    portraitStateDirty = true;
    for (const doc of mountedDocuments) {
      doc.removeEventListener('click', onAvatarClick, true);
      doc.removeEventListener('keydown', onAvatarClick, true);
      doc.removeEventListener('keydown', onGlobalKeyDown, true);
      if (doc[CLEANUP] !== stop) continue;
      delete doc[CLEANUP];
      doc.getElementById('okh-bubble-modal')?.remove();
      doc.getElementById('okh-bubble-style')?.remove();
      for (const avatar of doc.querySelectorAll(`[${DONE}]`)) avatar.removeAttribute(DONE);
    }
    mountedDocuments = [];
  }

  // 立即在当前执行阶段启动，秒级接管开场白和现有 DOM
  boot();

  root.OKH_BUBBLE_SIDE = Object.freeze({
    boot,
    stop,
    apply,
    refreshAvatars,
    openZoom,
    closeZoom,
    imageFor,
    formsFor,
    invalidate
  });

})(typeof globalThis !== 'undefined' ? globalThis : this);
