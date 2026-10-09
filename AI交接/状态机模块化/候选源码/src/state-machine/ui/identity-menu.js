function xdsMenuHost() {
  let host = window;
  for (;;) {
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
  if (!input || !send) throw new Error('未找到酒馆输入框或发送按钮，请确认已进入聊天页面。');
  if (input.disabled || input.readOnly) throw new Error('酒馆输入框暂不可用，请稍后落款。');
  return { doc, input, send };
}

function xdsMenuCanSend(composer, allowEmpty = false) {
  const ctx = xdsMenuContext();
  if (ctx && ctx.onlineStatus === 'no_connection') return false;
  const stop = composer.doc.querySelector('#mes_stop');
  const empty = allowEmpty && !composer.input.value.trim();
  return !xdsMenuVisible(stop) && xdsMenuVisible(composer.send) && (empty || !composer.send.disabled) &&
    (empty || composer.send.getAttribute('aria-disabled') !== 'true') &&
    composer.doc.defaultView.getComputedStyle(composer.send).pointerEvents !== 'none';
}

function xdsMenuIntro(form) {
  const names = ['custom_name', 'custom_gender', 'custom_age', 'custom_cultivation', 'custom_sect', 'custom_timepoint', 'custom_origin'];
  const limits = [64, 16, 32, 96, 128, 64, 1800];
  const values = {};
  names.forEach((name, i) => {
    const input = form.querySelector('[data-xds-field="' + name + '"]');
    const value = input ? String(input.value || '').replace(/\r\n?/g, '\n').trim() : '';
    if (value.length > limits[i]) throw new Error('设定文字超过字段长度限制，请适当精简。');
    values[name] = value;
  });
  const ctx = xdsMenuContext();
  const persona = ctx && typeof ctx.name1 === 'string' ? ctx.name1.trim() : '';
  const name = values.custom_name || persona || '无名散修';
  
  const startTime = xdsTimepoint.resolveTimepoint(values.custom_timepoint);
  return '【启卷入世 · 自设命途】\n' +
    '• 道号名讳：' + name + '（' + (values.custom_gender || '男') + '，' + (values.custom_age || '成年') + '）\n' +
    '• 境界修为：' + (values.custom_cultivation || '练气圆满') + '\n' +
    '• 入世身份：' + (values.custom_sect || '大荒散修') + '\n' +
    '• 当前时点：' + startTime.value + '\n' +
    '• 极乐机缘：' + (values.custom_origin || '偶得《极乐引》残篇，机缘入道') + '\n\n' +
    '（以此身入太微红尘，且看百花谁主沉浮。）';
}

function xdsMenuStatus(box, message, error) {
  const status = box && box.querySelector('[data-xds-status]');
  if (status) {
    status.textContent = message;
    status.toggleAttribute('data-xds-error', !!error);
  }
  if ((!status || !status.isConnected) && message) toast(error ? 'warning' : 'info', message, 7000);
}

function xdsMenuAssets() {
  const ctx = xdsMenuContext();
  const ch = ctx && ctx.characters && ctx.characters[ctx.characterId];
  if (!ch) return [];
  const result = [];
  if (ch.data && ch.data.extensions && ch.data.extensions.xsd_assets) result.push(ch.data.extensions.xsd_assets);
  if (ch.extensions && ch.extensions.xsd_assets) result.push(ch.extensions.xsd_assets);
  if (!result.length && typeof ch.json_data === 'string') {
    try {
      const raw = JSON.parse(ch.json_data);
      const assets = raw.data && raw.data.extensions && raw.data.extensions.xsd_assets;
      if (assets) result.push(assets);
    } catch (error) { /* 未内嵌时留占位文字，绝不请求本地路径 */ }
  }
  return result;
}

function xdsMenuImageUrl(img, maps) {
  const kind = img.getAttribute('data-xds-image');
  const key = img.getAttribute('data-xds-asset-key') || '';
  const token = img.getAttribute('data-xds-token') || '';
  for (const assets of maps) {
    const candidates = [assets.menu && assets.menu[token], assets.menu && assets.menu['{{' + token + '}}']];
    if (kind === 'portrait') candidates.push(assets.lightbox && assets.lightbox[key], assets.panel && assets.panel[key]);
    else if (key) candidates.push(assets.relics && assets.relics[key]);
    // 四阶图缺失就留占位，严禁悄悄替换成一阶或者其他角色的纹章。
    const value = candidates.find(value => typeof value === 'string' &&
      (/^data:image\/(?:png|jpeg|webp|gif|avif);base64,/i.test(value) || /^https?:\/\//i.test(value)));
    if (value) return value;
  }
  return '';
}

function xdsMenuHydrate(root, runtime) {
  if (!runtime.roots.has(root)) {
    runtime.roots.add(root);
    // 同一模板被多个消息复制时，原生 radio/label 的 id 与 name 仍须唯一。
    const suffix = '-r' + (++runtime.rootSerial);
    const ids = new Map();
    for (const input of root.querySelectorAll('input[id],textarea[id]')) {
      ids.set(input.id, input.id + suffix);
      input.id += suffix;
      if (input.hasAttribute('data-xds-page')) input.name += suffix;
    }
    for (const label of root.querySelectorAll('label[for]')) {
      if (ids.has(label.htmlFor)) label.htmlFor = ids.get(label.htmlFor);
    }
    runtime.chatKeys.set(root, xdsMenuChatKey());
  }
  const maps = xdsMenuAssets();
  for (const img of root.querySelectorAll('[data-xds-image]')) {
    if (!runtime.images.has(img)) {
      runtime.images.add(img);
      const ready = () => {
        const badge = img.closest('[data-xds-badge]');
        const card = img.closest('[data-xds-flower]');
        img.removeAttribute('data-xds-missing');
        if (badge) badge.setAttribute('data-xds-ready', '');
        else if (card) card.setAttribute('data-xds-art-ready', '');
      };
      const missing = () => {
        img.setAttribute('data-xds-missing', '');
        const badge = img.closest('[data-xds-badge]');
        const card = img.closest('[data-xds-flower]');
        if (badge) badge.removeAttribute('data-xds-ready');
        else if (card) card.removeAttribute('data-xds-art-ready');
      };
      runtime.listen(img, 'load', ready);
      runtime.listen(img, 'error', missing);
      if (img.complete && img.naturalWidth) ready();
    }
    if (!img.hasAttribute('src')) {
      const value = xdsMenuImageUrl(img, maps);
      if (value) img.src = value;
    }
  }
}

function xdsMenuSent(message, baseline) {
  const ctx = xdsMenuContext();
  if (ctx && Array.isArray(ctx.chat)) {
    return ctx.chat.slice(baseline.length).some(row => row && row.is_user === true && String(row.mes || '') === message);
  }
  try {
    if (API.getChatMessages) {
      const value = API.getChatMessages(-1);
      const rows = Array.isArray(value) ? value : [];
      return rows.some(row => row && row.role === 'user' && Number(row.message_id) > baseline.last && String(row.message || row.mes || '') === message);
    }
  } catch (error) { /* 保留未确认状态，不自动重复发送 */ }
  return false;
}

async function xdsMenuSubmit(form, button, runtime) {
  if (runtime.submitting) return;
  const root = form.closest('[data-xds-menu]');
  const chatKey = xdsMenuChatKey();
  if (chatKey === null) {
    xdsMenuStatus(form, '无法确定当前聊天，请重新打开角色会话后再落款。', true);
    return;
  }
  const rootKey = runtime.chatKeys.get(root);
  if (rootKey !== null && rootKey !== undefined && rootKey !== chatKey) {
    xdsMenuStatus(form, '这份书卷属于上一段会话，请在当前会话重新打开首楼。', true);
    return;
  }
  const previous = runtime.submissions.get(root);
  if (previous && previous.clicked) {
    const sent = xdsMenuSent(previous.message, previous.baseline);
    button.textContent = sent ? '墨宝已落 · 入世设定已发送' : '检查发送状态';
    button.disabled = sent;
    xdsMenuStatus(form, sent ? '身份已切换为自设，入世设定已发送。' : '已触发过发送，暂未确认消息入楼；请查看输入框与会话，避免重复发送。', !sent);
    return;
  }
  let message, composer;
  try {
    message = xdsMenuIntro(form);
    composer = xdsMenuComposer();
    if (composer.input.value.trim() && (!previous || composer.input.value !== previous.message)) {
      throw new Error('输入框已有未发送文案，请先发送或清空，再提笔落款。');
    }
    if (!xdsMenuCanSend(composer, true)) throw new Error('酒馆正在生成回复、未连接模型，或发送按钮暂不可用，请稍后落款。');
  } catch (error) {
    xdsMenuStatus(form, msgOf(error), true);
    return;
  }

  const epoch = runtime.epoch;
  const ctx = xdsMenuContext();
  const baseline = { length: ctx && Array.isArray(ctx.chat) ? ctx.chat.length : 0, last: latestMessageId() ?? -1 };
  const record = { message, baseline, clicked: false };
  runtime.submitting = true;
  runtime.submissions.set(root, record);
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = '落款中 · 正在切换身份…';
  const guard = () => !runtime.disposed && runtime.epoch === epoch && xdsMenuChatKey() === chatKey;
  const assertCurrent = () => { if (!guard()) throw new Error('聊天已切换，本次入世提交已中止。'); };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    assertCurrent();
    // 不切换首楼 swipe：保留填写书卷与错误反馈；普通身份按钮仍照旧切开场白。
    await pickIdentity('自设', { switchGreeting: false, quiet: true, strict: true, guard });
    assertCurrent();
    // 写接口存在并不代表落地成功；消息层优先，故两层可读值均要一致。
    const layers = [readLayer(L_CHAT), readLayer(L_MSG)].filter(Boolean);
    if (!layers.length || layers.some(layer => !layer.stat_data || layer.stat_data.身份 !== '自设')) {
      throw new Error('自设身份回读未通过，未发送设定；请检查酒馆助手变量接口。');
    }
    composer = xdsMenuComposer();
    if (composer.input.value.trim() && composer.input.value !== message) {
      throw new Error('落款期间输入框内容已改变，已保留你的文案；请清空后重试。');
    }
    xdsMenuSetValue(composer.input, message);
    xdsMenuStatus(form, '身份已切换为自设，正在发送入世设定…', false);
    button.textContent = '落款中 · 正在启卷…';
    // 等待 input 被宿主接管；不靠固定 150ms 猜测发送按钮状态。
    await pause(32);
    assertCurrent();
    for (let i = 0; !xdsMenuCanSend(composer) && i < 20; i++) {
      await pause(32); assertCurrent(); composer = xdsMenuComposer();
    }
    if (!xdsMenuCanSend(composer)) throw new Error('身份已切换，文案已保留在输入框；发送暂不可用，请稍后手动发送或重新落款。');
    if (composer.input.value !== message) throw new Error('输入框内容已改变，未自动发送；请检查后手动发送。');
    assertCurrent();
    record.clicked = true;
    composer.send.click();
    for (let i = 0; i < 40 && !xdsMenuSent(message, baseline); i++) {
      await pause(50); assertCurrent();
    }
    if (!xdsMenuSent(message, baseline)) {
      button.disabled = false;
      button.textContent = '检查发送状态';
      xdsMenuStatus(form, '已触发发送，暂未确认消息入楼；文案若仍在输入框，可手动发送。请勿重复落款。', true);
    } else {
      button.textContent = '墨宝已落 · 入世设定已发送';
      xdsMenuStatus(form, '身份已切换为自设，入世设定已发送。', false);
    }
  } catch (error) {
    button.disabled = false;
    button.textContent = record.clicked ? '检查发送状态' : '提笔落款 · 启卷入世';
    xdsMenuStatus(form, msgOf(error), true);
  } finally {
    button.removeAttribute('aria-busy');
    runtime.submitting = false;
  }
}

let xdsMenuRuntime = null;

/** 用 data 属性委托，兼容酒馆净化后的类名；重复启动更新监听，不保留旧 iframe 闭包。 */

const xdsTimepoint = (typeof xdsTimepointModule === 'function') ? xdsTimepointModule() : null;

function bindIdentityMenu() {
  try {
    const host = xdsMenuHost();
    const doc = host.document;
    if (!doc) return false;
    if (xdsMenuRuntime && !xdsMenuRuntime.disposed && doc.__xsdMenuRuntime === xdsMenuRuntime) {
      xdsMenuRuntime.scan(doc);
      return true;
    }
    if (doc.__xsdMenuRuntime && typeof doc.__xsdMenuRuntime.dispose === 'function') doc.__xsdMenuRuntime.dispose();
    const runtime = {
      disposed: false, epoch: 0, rootSerial: 0, submitting: false,
      roots: new WeakSet(), images: new WeakSet(), frames: new WeakSet(),
      chatKeys: new WeakMap(), submissions: new WeakMap(), docs: new Set(), cleanups: [],
      listen(el, type, handler, capture = false) {
        el.addEventListener(type, handler, capture);
        runtime.cleanups.push(() => el.removeEventListener(type, handler, capture));
      },
      dispose() {
        if (runtime.disposed) return;
        runtime.disposed = true;
        runtime.epoch++;
        for (const clean of runtime.cleanups.splice(0)) { try { clean(); } catch (error) { /* 卸载继续 */ } }
        if (doc.__xsdMenuRuntime === runtime) {
          delete doc.__xsdMenuRuntime;
          doc.__xsdMenuBound = false;
        }
      },
      scan(node) {
        if (runtime.disposed || !node || typeof node.querySelectorAll !== 'function') return;
        if (node.matches && node.matches('[data-xds-menu]')) xdsMenuHydrate(node, runtime);
        for (const root of node.querySelectorAll('[data-xds-menu]')) xdsMenuHydrate(root, runtime);
        const frames = [...node.querySelectorAll('.mes_text iframe, [data-xds-menu-frame]')];
        if (node.matches && node.matches('iframe') && node.closest('.mes_text')) frames.push(node);
        for (const frame of frames) {
          const attach = () => {
            try { if (frame.contentDocument) runtime.attach(frame.contentDocument); } catch (error) { /* 跨源无法委托 */ }
          };
          if (!runtime.frames.has(frame)) { runtime.frames.add(frame); runtime.listen(frame, 'load', attach); }
          attach();
        }
      },
      attach(surface) {
        if (runtime.docs.has(surface) || runtime.disposed) return;
        runtime.docs.add(surface);
        runtime.listen(surface, 'click', onClick, true);
        runtime.listen(surface, 'keydown', onKey);
        runtime.listen(surface, 'input', onInput);
        const observer = new surface.defaultView.MutationObserver(rows => {
          for (const row of rows) for (const node of row.addedNodes) runtime.scan(node);
        });
        observer.observe(surface.documentElement, { childList: true, subtree: true });
        runtime.cleanups.push(() => observer.disconnect());
        runtime.scan(surface);
    
    try {
      if (xdsTimepoint && typeof xdsTimepoint.install === 'function') {
        const timepointHandle = xdsTimepoint.install({
          host: surface.defaultView,
          ownerWindow: window,
          setValue: xdsMenuSetValue,
        });
        runtime.cleanups.push(() => timepointHandle.dispose());
      }
    } catch (error) {
      console.warn('[XDS timepoint] 初始化失败，保留原日期入口', error);
    }
      },
      keyboardSpace() {
        const viewport = host.visualViewport;
        const covered = viewport ? Math.max(0, host.innerHeight - viewport.height - viewport.offsetTop) : 0;
        for (const surface of runtime.docs) {
          for (const root of surface.querySelectorAll('[data-xds-menu]')) {
            root.style.setProperty('--xds-keyboard-space', Math.min(covered, 420) + 'px');
          }
        }
      },
    };
    const stop = ev => { ev.preventDefault(); ev.stopImmediatePropagation(); };
    function onClick(ev) {
      const target = ev.target && ev.target.nodeType === 3 ? ev.target.parentElement : ev.target;
      if (!target || typeof target.closest !== 'function') return;
      const root = target.closest('[data-xds-menu]');
      const legacyIdentity = target.closest('[data-xds-identity]');
      if (!root && !legacyIdentity) return;
      const submit = target.closest('[data-xds-action="submit-custom"]');
      if (submit && root) {
        stop(ev);
        const form = submit.closest('[data-xds-custom-form]');
        if (form) void xdsMenuSubmit(form, submit, runtime);
        return;
      }
      const chip = target.closest('[data-xds-fill]');
      if (chip && root) {
        stop(ev);
        const form = chip.closest('[data-xds-custom-form]');
        const key = chip.getAttribute('data-xds-fill');
        if (!form || !['custom_cultivation', 'custom_sect', 'custom_timepoint'].includes(key)) return;
        const input = form.querySelector('[data-xds-field="' + key + '"]');
        if (input) xdsMenuSetValue(input, chip.getAttribute('data-xds-value') || chip.textContent.trim());
        return;
      }
      const step = target.closest('[data-xds-carousel-step]');
      if (step && root) {
        stop(ev);
        const carousel = root.querySelector('[data-xds-carousel]');
        const card = carousel && carousel.querySelector('[data-xds-flower]');
        if (card) {
          const view = carousel.ownerDocument.defaultView;
          const gap = parseFloat(view.getComputedStyle(carousel).columnGap) || 14;
          carousel.scrollBy({ left: (step.getAttribute('data-xds-carousel-step') === '-1' ? -1 : 1) * (card.getBoundingClientRect().width + gap), behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
        return;
      }
      if (legacyIdentity) {
        stop(ev);
        if (runtime.submitting) return;
        const name = String(legacyIdentity.getAttribute('data-xds-identity') || '').trim();
        if (!IDENTITY_NAMES.includes(name)) {
          xdsMenuStatus(root || legacyIdentity.parentElement, '请选择具体殿主身份。', true);
          return;
        }
        runtime.submitting = true;
        void pickIdentity(name)
          .catch(error => { xdsMenuStatus(root, msgOf(error), true); })
          .finally(() => { runtime.submitting = false; });
      }
      // label 的原生 radio 激活完全交给浏览器，视口切换只由 CSS 完成。
    }
    function onKey(ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const label = ev.target && ev.target.closest && ev.target.closest('[data-xds-menu] label[role="button"]');
      if (label) { ev.preventDefault(); label.click(); }
    }
    function onInput(ev) {
      const input = ev.target;
      if (!input || !input.matches || !input.matches('[data-xds-field]')) return;
      const form = input.closest('[data-xds-custom-form]');
      if (!form) return;
      for (const chip of form.querySelectorAll('[data-xds-fill]')) {
        if (chip.getAttribute('data-xds-fill') === input.getAttribute('data-xds-field')) {
          chip.setAttribute('aria-pressed', String(chip.getAttribute('data-xds-value') === input.value));
        }
      }
    }
    xdsMenuRuntime = runtime;
    doc.__xsdMenuRuntime = runtime;
    doc.__xsdMenuBound = true;
    runtime.attach(doc);
    if (host.visualViewport) {
      runtime.listen(host.visualViewport, 'resize', runtime.keyboardSpace);
      runtime.listen(host.visualViewport, 'scroll', runtime.keyboardSpace);
    }
    runtime.keyboardSpace();
    runtime.listen(window, 'pagehide', runtime.dispose);
    try {
      if (API.eventOn && EVENTS && EVENTS.CHAT_CHANGED) {
        const listener = API.eventOn(EVENTS.CHAT_CHANGED, () => { runtime.epoch++; if (window.__xsdCorrection) window.__xsdCorrection.onChatChanged(); });
        if (listener && typeof listener.stop === 'function') runtime.cleanups.push(() => listener.stop());
      }
    } catch (error) { /* 无事件 API 时仍由 chatKey 阻止跨会话发送 */ }
    console.log(TAG, '[首楼] 百花谱与自设书卷事件委托已挂载');
    return true;
  } catch (error) {
    console.warn(TAG, '[首楼] 挂载失败：', msgOf(error));
    return false;
  }
}

/** 宿主尚未就绪时有限重试；正常加载不轮询。 */
function ensureMenuBound() {
  if (bindIdentityMenu()) return;
  let tries = 0;
  const timer = setInterval(() => {
    if (++tries > 10 || bindIdentityMenu()) clearInterval(timer);
  }, 1000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
}

/**
 * 把第 0 楼的开场白按**当前角色卡**重刷一遍。
 * 用途：酒馆在开聊天那一刻就把 first_mes 与 alternate_greetings 烧成了第 0 楼的 swipes，
 * 之后换卡不会追改 ⇒ 旧聊天里看到的是旧文案。这条命令用来补这一步。
 */
async function refreshGreetings() {
  if (!API.getCharacter || !API.setChatMessages) {
    console.warn(TAG, '[身份] 没有 getCharacter／setChatMessages，无法刷新开场白');
    return { ok: false };
  }
  let swipes = [];
  try {
    const ch = await API.getCharacter('current');
    swipes = (ch && ch.first_messages ? ch.first_messages : []).filter((s) => typeof s === 'string' && s.trim());
  } catch (e) { console.warn(TAG, '[身份] 读角色卡失败：', msgOf(e)); return { ok: false }; }
  if (swipes.length < 2) { console.warn(TAG, `[身份] 角色卡里只有 ${swipes.length} 条开场白，不刷新`); return { ok: false }; }
  const idn = readIdentity() ?? IDENTITY_DEFAULT;
  const re = new RegExp('<IdentityPick\\s+name\\s*=\\s*"' + idn + '"');
  let idx = swipes.findIndex((s) => re.test(s) && !s.includes('<IdentityMenu/>'));
  if (idx < 0) idx = 0;
  try {
    await API.setChatMessages([{ message_id: 0, swipes, swipe_id: idx, message: swipes[idx] }], { refresh: 'affected' });
    console.log(TAG, `[身份] 第 0 楼已按当前卡刷新：${swipes.length} 条开场白，停在 #${idx}（${idn}）`);
    return { ok: true, count: swipes.length, idx };
  } catch (e) { console.warn(TAG, '[身份] 刷新第 0 楼失败：', msgOf(e)); return { ok: false }; }
}

