/* gpt下级：图片地图端口；只读取显式图包配置，不渲染替代拓扑或推进地点。 */
(() => {
  'use strict';
  const mounted = new WeakMap();
  let serial = 0;
  const placeholders = [
    { id: 'world', label: '大地图', file: '' },
    { id: 'prison', label: '黑狱图', file: '' },
  ];
  function hosts() {
    const list = [window];
    try { if (window.parent !== window) list.push(window.parent); } catch {}
    try { if (!list.includes(window.top)) list.push(window.top); } catch {}
    return list;
  }
  function configuration() {
    let config = window.ZYX_HUD_CONFIG?.maps;
    for (const host of hosts()) {
      try {
        const value = host.ZYX_DANXING_MAPS;
        if (value && typeof value === 'object') { config = value; break; }
      } catch { /* 跨源宿主不能读取，继续使用本页显式配置。 */ }
    }
    const seen = new Set();
    const images = [];
    if (Array.isArray(config?.images)) {
      for (const item of config.images) {
        if (!item || typeof item.id !== 'string') continue;
        const id = item.id.trim().slice(0, 120);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        images.push({ id, label: typeof item.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 100) : id,
          file: typeof item.file === 'string' ? item.file.trim() : '' });
      }
    }
    return { baseUrl: typeof config?.baseUrl === 'string' ? config.baseUrl : '', images: images.length ? images : placeholders };
  }
  function origin() {
    for (const host of hosts().slice().reverse()) {
      try { if (/^https?:$/.test(host.location.protocol)) return host.location.href; } catch {}
    }
    return window.location.href;
  }
  function mount(dialog, options = {}) {
    if (!dialog || dialog.tagName !== 'DIALOG' || typeof dialog.close !== 'function') throw new TypeError('ZYXMapPanel.mount requires a native dialog');
    mounted.get(dialog)?.dispose();
    const doc = dialog.ownerDocument;
    const config = configuration();
    const id = 'zyx-image-map-' + (++serial);
    const cleanups = [];
    let disposed = false, revision = 0, pending = null;
    function node(tag, className, text) {
      const el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }
    function button(label, className) {
      const el = node('button', className, label);
      el.type = 'button';
      return el;
    }
    function listen(el, event, callback) {
      el.addEventListener(event, callback);
      cleanups.push(() => el.removeEventListener(event, callback));
    }
    function cancelPending() {
      if (!pending) return;
      pending.onload = null;
      pending.onerror = null;
      pending.removeAttribute('src');
      pending = null;
    }
    function close() { if (dialog.open) dialog.close(); }
    dialog.setAttribute('data-map-dialog', '');
    dialog.setAttribute('aria-labelledby', id + '-title');
    const shell = node('div', 'zyx-map-shell');
    const head = node('header', 'zyx-map-head');
    const title = node('h2', '', '山川舆图');
    title.id = id + '-title';
    const closeButton = button('关闭地图', 'zyx-map-close');
    head.append(title, closeButton);
    const location = String(options.location ?? '').trim();
    const current = node('p', 'zyx-map-current', '当前地点：' + (location || '未提供地点'));
    const tabs = node('div', 'zyx-map-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', '地图图包');
    const viewer = node('section', 'zyx-map-viewer');
    viewer.id = id + '-viewer';
    viewer.setAttribute('role', 'tabpanel');
    viewer.tabIndex = 0;
    const image = node('img', 'zyx-map-image');
    image.setAttribute('data-map-image', '');
    image.alt = '';
    image.hidden = true;
    const empty = node('div', 'zyx-map-placeholder', '地图图包尚未接入');
    empty.setAttribute('data-map-placeholder', '');
    const status = node('p', 'zyx-map-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    viewer.append(image, empty);
    shell.append(head, current, tabs, viewer, status, node('p', 'zyx-map-note', '仅查看地图图包，不改变当前位置或时间。'));
    const controls = [];
    function select(index, focus = false) {
      const entry = config.images[index];
      if (!entry || disposed) return;
      const token = ++revision;
      cancelPending();
      controls.forEach((control, i) => {
        control.setAttribute('aria-selected', String(i === index));
        control.tabIndex = i === index ? 0 : -1;
      });
      viewer.setAttribute('aria-labelledby', controls[index].id);
      viewer.dataset.mapId = entry.id;
      if (focus) controls[index].focus();
      image.hidden = true;
      image.removeAttribute('src');
      image.alt = entry.label;
      empty.hidden = false;
      empty.textContent = '地图图包尚未接入';
      status.textContent = '';
      if (!entry.file) return;
      const files = Object.create(null);
      files[entry.id] = entry.file;
      let urls = [];
      try { urls = window.ZYXPortraitLibrary?.resolve(entry.id, { baseUrl: config.baseUrl, files }, origin())?.urls ?? []; } catch {}
      if (!urls.length) {
        empty.textContent = '地图图包暂不可用，请检查配置。';
        return;
      }
      empty.textContent = '正在载入地图…';
      const candidate = new doc.defaultView.Image();
      pending = candidate;
      candidate.onload = () => {
        if (disposed || revision !== token) return;
        pending = null;
        image.src = urls[0];
        image.hidden = false;
        empty.hidden = true;
        status.textContent = entry.label;
      };
      candidate.onerror = () => {
        if (disposed || revision !== token) return;
        pending = null;
        empty.textContent = '地图暂时无法载入，请检查图包文件。';
      };
      candidate.src = urls[0];
    }
    config.images.forEach((entry, index) => {
      const control = button(entry.label, 'zyx-map-tab');
      control.id = id + '-tab-' + index;
      control.dataset.mapId = entry.id;
      control.setAttribute('role', 'tab');
      control.setAttribute('aria-controls', viewer.id);
      listen(control, 'click', event => { event.preventDefault(); event.stopPropagation(); select(index); });
      listen(control, 'keydown', event => {
        const to = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : event.key === 'ArrowRight' ? (index + 1) % controls.length : event.key === 'ArrowLeft' ? (index + controls.length - 1) % controls.length : null;
        if (to === null) return;
        event.preventDefault(); event.stopPropagation(); select(to, true);
      });
      controls.push(control);
      tabs.append(control);
    });
    dialog.replaceChildren(shell);
    select(0);
    listen(closeButton, 'click', event => { event.preventDefault(); event.stopPropagation(); close(); });
    listen(dialog, 'cancel', event => { event.preventDefault(); close(); });
    listen(dialog, 'click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    const handle = { dispose() {
      if (disposed) return;
      disposed = true;
      revision++;
      cancelPending();
      for (const cleanup of cleanups.splice(0)) cleanup();
      if (mounted.get(dialog) === handle) mounted.delete(dialog);
    } };
    mounted.set(dialog, handle);
    return handle;
  }
  window.ZYXMapPanel = Object.freeze({ mount });
})();
