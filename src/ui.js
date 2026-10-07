(function (root, factory) {
  const value = factory(root.BSECore);
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = value; else root.BSEUI = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C) {
  'use strict';
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const json = v => JSON.stringify(v, null, 2);
  const conditionSummary = (value, project) => { try { return C.conditionText(value, project); } catch { return '条件草稿尚未通过校验'; } };
  const button = (text, action, extra = '') => `<button type="button" data-action="${action}" ${extra}>${escape(text)}</button>`;
  const input = (label, name, value, type = 'text', extra = '') => `<label>${escape(label)}<input name="${name}" type="${type}" value="${escape(value)}" ${extra}></label>`;
  const area = (label, name, value, rows = 5) => `<label>${escape(label)}<textarea name="${name}" rows="${rows}">${escape(value)}</textarea></label>`;
  const checkbox = (label, name, checked) => `<label class="check"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>${escape(label)}</label>`;
  const select = (label, name, options, value) => `<label>${escape(label)}<select name="${name}">${options.map(([key, title]) => `<option value="${escape(key)}" ${key === value ? 'selected' : ''}>${escape(title)}</option>`).join('')}</select></label>`;
  const PENCIL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5M4 15l5 5"/></svg>';
  const STYLE = `
    :host{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#e7ecf6;font-size:14px;line-height:1.6;color-scheme:dark;--ink:#e7ecf6;--muted:#a8b3ca;--surface:#141c2c;--line:#34415b;--accent:#9ce4cf}
    *{box-sizing:border-box} [hidden]{display:none!important} button,input,textarea,select{font:inherit;color:inherit} button{min-height:44px;padding:9px 14px;border:1px solid var(--line);border-radius:10px;background:#26344b;cursor:pointer;touch-action:manipulation;font-weight:600;overflow-wrap:anywhere} button:hover{background:#334864} button:disabled{opacity:.5;cursor:default} button.primary{background:var(--accent);border-color:var(--accent);color:#132720}button.danger{color:#ffc4c4} button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .launcher{position:fixed;right:14px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:2147482000;background:#9ce4cf;color:#132720;border:0;box-shadow:0 5px 28px #0008;border-radius:24px;padding:10px 17px}.overlay{position:fixed;left:0;right:0;top:var(--bse-top,0px);height:var(--bse-height,100dvh);z-index:2147482100;background:#0009;display:flex;align-items:center;justify-content:center;padding:24px}.panel{width:min(1050px,100%);height:min(850px,100%);background:#101827;border:1px solid #47566c;border-radius:18px;box-shadow:0 24px 80px #0008;display:flex;flex-direction:column;min-width:0;overflow:hidden}
    header{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line);flex:none}header h1{font-size:19px;line-height:1.3;margin:0}header small{display:block;font-size:12px;color:var(--muted)}nav{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid var(--line);overflow:auto;flex:none;scrollbar-width:thin}nav button{flex:0 0 auto;background:transparent;padding:8px 14px;border-color:transparent}nav button.active{background:#294236;color:var(--accent);border-color:#548b77}
    main{padding:18px;overflow:auto;flex:1;min-height:0;overscroll-behavior:contain;scrollbar-width:thin}h2{font-size:17px;margin:0 0 12px}h3{font-size:15px;margin:0 0 8px}p{margin:8px 0}.muted{color:var(--muted);font-size:13px}.card{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:15px;margin-bottom:14px;min-width:0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.row.spread{justify-content:space-between}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.split{display:grid;grid-template-columns:235px minmax(0,1fr);gap:16px}.stack{display:flex;flex-direction:column;gap:8px}.stack>button{text-align:left}.selected{border-color:var(--accent)!important;color:var(--accent)}.badge{display:inline-block;padding:2px 9px;border-radius:20px;background:#28413e;color:var(--accent);font-size:12px}.warn{padding:10px 12px;border:1px solid #856339;background:#35291c;border-radius:10px;color:#f7d59b;margin-bottom:12px;overflow-wrap:anywhere}.error{border-color:#8a454b;background:#342127;color:#ffccd0}
    label{display:flex;flex-direction:column;gap:5px;margin:0 0 12px;font-weight:500;min-width:0}input,textarea,select{width:100%;background:#0d1421;border:1px solid #40516a;border-radius:8px;padding:10px;min-height:44px;min-width:0}textarea{resize:vertical;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}input:read-only{color:#91a0bb}.check{min-height:44px;flex-direction:row;align-items:center;gap:9px;font-size:14px}.check input{width:20px;min-height:20px;height:20px;flex:none;accent-color:var(--accent)}details{border:1px solid var(--line);padding:10px 12px;border-radius:10px;margin:10px 0}summary{cursor:pointer;min-height:44px;display:flex;align-items:center}code{overflow-wrap:anywhere;color:var(--accent)}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.actions{display:flex;gap:8px;flex-wrap:wrap;position:sticky;bottom:0;background:#141c2cee;padding:10px 0;z-index:2}.route{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.route>div{min-width:0}.small{font-size:12px}.pagination{margin-top:10px}.kv{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #34415b80;overflow-wrap:anywhere}.toast{position:absolute;bottom:calc(15px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);max-width:90%;background:#21473b;border:1px solid #81bda4;padding:12px 18px;border-radius:12px;z-index:5;pointer-events:none}.empty{color:var(--muted);padding:10px 0}.file{display:none}footer{padding:5px 16px;font-size:11px;color:var(--muted);border-top:1px solid var(--line);flex:none}
    @media(max-width:700px){.split{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.overlay{padding:0}.panel{height:100%;width:100%;border-radius:0;border:0}header{padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px}header h1{font-size:17px}nav{padding:6px 8px}main{padding:12px}input,textarea,select{font-size:16px}.card{padding:13px}.actions button{flex:1}.launcher{right:10px}footer{padding-bottom:calc(5px + env(safe-area-inset-bottom,0px))}.route{grid-template-columns:1fr}.route button{width:100%}}
    @media(prefers-reduced-motion:no-preference){.panel{animation:bse-in .14s ease-out}@keyframes bse-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}}
  `;
  const EXTRA_STYLE = `
    .spoiler-box{max-height:100%;overflow-y:auto;overscroll-behavior:contain}
    .launcher{width:48px;height:48px;padding:12px;border-radius:50%;touch-action:none;user-select:none;display:grid;place-items:center;cursor:grab}.launcher.dragging{cursor:grabbing}.launcher svg{pointer-events:none}.panel{position:relative}.panel-body{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0}.node-spoiler{position:relative;min-width:0}.node-spoiler.locked{height:clamp(240px,calc(var(--bse-height,100dvh) - 330px),560px);overflow:hidden}.node-spoiler-content.locked{filter:blur(10px);pointer-events:none;user-select:none}.spoiler-layer{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;padding:16px;background:#10182780}.spoiler-box{width:min(430px,100%);padding:20px;border:1px solid var(--line);background:#141c2cf5;border-radius:16px;text-align:center;box-shadow:0 10px 36px #0008}.spoiler-box h2{margin:8px 0}.lock-icon{font-size:38px;display:block}.spoiler-box .row{justify-content:center}.header-actions{display:flex;gap:8px}.analysis-report li{overflow-wrap:anywhere}.analysis-report ul{padding-left:20px}.event-guide ol{padding-left:22px}.event-guide li{margin:6px 0}
  `;
  const QUICK_STYLE = `:host{display:block;color:#e7ecf6;font:14px/1.5 system-ui,-apple-system,sans-serif;color-scheme:dark}:host([hidden]){display:none!important}*{box-sizing:border-box}.quick{padding:8px 10px;background:#141c2cf5;border:1px solid #40516a;border-radius:12px;box-shadow:0 3px 16px #0005}.quick-head{font-size:12px;color:#b8c5da;margin-bottom:6px}.quick-list{display:flex;gap:8px;overflow-x:auto;overscroll-behavior:contain;scrollbar-width:thin}.bse-choice{font:inherit;flex:0 0 auto;max-width:min(280px,90%);min-width:44px;min-height:44px;padding:8px 12px;border:1px solid #588b79;border-radius:10px;background:#263c34;color:#e7ecf6;cursor:pointer;touch-action:manipulation;text-align:left;overflow-wrap:anywhere}.bse-choice:focus-visible{outline:2px solid #9ce4cf;outline-offset:2px}.bse-choice small{color:#9ce4cf;margin-right:6px}.empty{color:#a8b3ca;font-size:13px}`;
  class Panel {
    constructor(engine) { this.e = engine; this.doc = engine.host.doc(); this.win = this.doc.defaultView; this.tab = 'run'; this.opened = false; this.unlocked = false; this.spoilerPrompt = false; this.privacyProject = ''; this.forms = {}; this.details = {}; this.search = {}; this.nodeId = ''; this.eventId = ''; this.listPage = 0; this.bookProjects = []; this.unsub = null; }
    mount() {
      this.doc.getElementById('bse-panel-host')?.remove();
      this.element = this.doc.createElement('div'); this.element.id = 'bse-panel-host'; this.element.style.cssText = 'position:relative;z-index:2147482000';
      this.shadow = this.element.attachShadow({mode: 'open'});
      this.shadow.innerHTML = `<style>${STYLE}${EXTRA_STYLE}</style><button class="launcher" type="button" aria-label="打开剧情面板" title="剧本 · 拖动可移动">${PENCIL}</button><div class="overlay" hidden><section class="panel" role="dialog" aria-modal="true" aria-label="分支剧本管理"><header><div><h1>分支剧本</h1><small>剧情、事件与进度</small></div><button type="button" data-action="close" aria-label="关闭剧情面板">关闭</button></header><div class="panel-body"><nav aria-label="剧情面板页面"></nav><main></main><footer>完整素材留在酒馆，当前剧情按需注入。</footer></div><div class="toast" role="status" hidden></div></section></div><input class="file" type="file" accept=".json,application/json">`;
      this.doc.body.appendChild(this.element);
      this.mountLauncher(); this.mountQuick();
      this.shadow.addEventListener('click', ev => { const b = ev.target.closest?.('[data-action]'); if (b && !b.disabled) this.run(() => this.action(b.dataset.action, b)); });
      this.shadow.addEventListener('submit', ev => ev.preventDefault());
      this.shadow.addEventListener('change', ev => {
        const name = ev.target.name;
        if (name === 'node_search' || name === 'event_search') { this.capture(); this.search[name] = ev.target.value; this.listPage = 0; this.render(); }
        else if (name === 'model_choice' || name === 'segment_model_choice') {
          this.capture(); if (ev.target.value) this.forms.api[name === 'model_choice' ? 'model' : 'segment_model'] = ev.target.value;
          this.render(false);
        } else if (name === 'base_url' || name === 'key') {
          this.capture(); const profile = this.forms.api;
          this.shadow.querySelector('.api-endpoints').innerHTML = this.apiPreview(profile);
          let source = ''; try { source = this.apiSource(profile); } catch {}
          if (this.apiModels?.source !== source) for (const name of ['model_choice', 'segment_model_choice']) this.shadow.querySelector(`[name="${name}"]`)?.closest('label').remove();
        }
      });
      this.shadow.querySelector('.file').onchange = async ev => { const field = ev.target, file = field.files[0]; if (file) await this.run(async () => { const data = C.parseJSON(await file.text(), '导入文件'); C.assert(data.type !== 'script', '这是插件安装文件，请在酒馆助手脚本管理中导入；此处导入的是剧本内容'); if (data.type === 'bse_progress') this.e.importProgress(data); else await this.e.setProject(data.project || data); this.forms = {}; this.nodeId = ''; this.eventId = ''; this.render(false); this.toast('导入完成'); }); field.value = ''; };
      this.keyHandler = ev => { if (ev.altKey && ev.key.toLowerCase() === 'b') { ev.preventDefault(); this.toggle(); } else if (ev.key === 'Escape' && this.opened) { if (this.spoilerPrompt) this.cancelUnlock(); else this.close(); } };
      this.doc.addEventListener('keydown', this.keyHandler);
      this.shadow.addEventListener('keydown', ev => {
        if (!this.opened || ev.key !== 'Tab') return;
        const scope = this.spoilerPrompt ? this.shadow.querySelector('.spoiler-layer') : this.shadow.querySelector('.panel');
        const targets = [...scope.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,summary')].filter(el => el.getClientRects().length && !el.closest('[inert]'));
        const first = targets[0], last = targets.at(-1), active = this.shadow.activeElement;
        if (ev.shiftKey && active === first) { ev.preventDefault(); last?.focus(); }
        else if (!ev.shiftKey && active === last) { ev.preventDefault(); first?.focus(); }
      });
      this.viewportHandler = () => {
        const vp = this.win.visualViewport;
        this.element.style.setProperty('--bse-height', (vp?.height || this.win.innerHeight) + 'px');
        this.element.style.setProperty('--bse-top', (vp?.offsetTop || 0) + 'px');
        this.applyLauncherPosition(); this.positionQuick();
      };
      this.win.addEventListener('resize', this.viewportHandler); this.win.visualViewport?.addEventListener('resize', this.viewportHandler); this.win.visualViewport?.addEventListener('scroll', this.viewportHandler); this.viewportHandler();
      this.unsub = this.e.onChange(() => this.render()); this.render();
    }
    mountLauncher() {
      const launcher = this.shadow.querySelector('.launcher');
      launcher.addEventListener('pointerdown', ev => {
        if (!ev.isPrimary || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
        const rect = launcher.getBoundingClientRect(); this.drag = {id: ev.pointerId, x: ev.clientX, y: ev.clientY, left: rect.left, top: rect.top, moved: false}; this.ignoreLauncherClick = false;
        launcher.setPointerCapture(ev.pointerId);
      });
      launcher.addEventListener('pointermove', ev => {
        const d = this.drag; if (!d || ev.pointerId !== d.id) return;
        const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 6) return;
        d.moved = true; ev.preventDefault(); launcher.classList.add('dragging');
        const box = this.launcherBounds(); const left = Math.max(box.left, Math.min(box.right, d.left + dx)), top = Math.max(box.top, Math.min(box.bottom, d.top + dy));
        this.e.settings.launcher_position = {x: (left - box.left) / Math.max(1, box.right - box.left), y: (top - box.top) / Math.max(1, box.bottom - box.top)};
        this.applyLauncherPosition();
      });
      const finish = ev => {
        if (!this.drag || ev.pointerId !== this.drag.id) return;
        this.ignoreLauncherClick = this.drag.moved; this.drag = null; launcher.classList.remove('dragging');
        if (this.ignoreLauncherClick && this.e.chat) this.run(() => this.e.saveSettings());
        if (ev.type === 'pointerup' && ev.pointerType === 'touch' && !this.ignoreLauncherClick) {
          this.handledTouchClick = {id: ev.pointerId, x: ev.clientX, y: ev.clientY, at: Date.now()}; this.toggle();
        }
      };
      launcher.addEventListener('pointerup', finish); launcher.addEventListener('pointercancel', finish);
      launcher.onclick = ev => {
        const touch = this.handledTouchClick;
        if (touch && (ev.pointerType === 'touch' && ev.pointerId === touch.id || ev.pointerType == null && ev.detail > 0 && Date.now() - touch.at < 800 && Math.hypot(ev.clientX - touch.x, ev.clientY - touch.y) < 3)) { this.handledTouchClick = null; return; }
        if (this.ignoreLauncherClick && ev.detail !== 0) { this.ignoreLauncherClick = false; return; } this.toggle();
      };
    }
    launcherBounds() { const v = this.win.visualViewport; const left = (v?.offsetLeft || 0) + 8, top = (v?.offsetTop || 0) + 8; return {left, top, right: Math.max(left, left + (v?.width || this.win.innerWidth) - 64), bottom: Math.max(top, top + (v?.height || this.win.innerHeight) - 64)}; }
    applyLauncherPosition() {
      const launcher = this.shadow?.querySelector('.launcher'); if (!launcher) return;
      const p = this.e.settings.launcher_position;
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) { launcher.style.removeProperty('left'); launcher.style.removeProperty('top'); launcher.style.removeProperty('right'); launcher.style.removeProperty('bottom'); return; }
      const b = this.launcherBounds(); launcher.style.left = (b.left + Math.max(0, Math.min(1, p.x)) * (b.right - b.left)) + 'px'; launcher.style.top = (b.top + Math.max(0, Math.min(1, p.y)) * (b.bottom - b.top)) + 'px'; launcher.style.right = 'auto'; launcher.style.bottom = 'auto';
    }
    mountQuick() {
      this.doc.getElementById('bse-quick-host')?.remove();
      this.quickElement = this.doc.createElement('div'); this.quickElement.id = 'bse-quick-host'; this.quickElement.hidden = true;
      this.quickElement.style.cssText = 'position:fixed;z-index:2147481900;max-width:100%;';
      this.quickShadow = this.quickElement.attachShadow({mode: 'open'}); this.doc.body.appendChild(this.quickElement);
      this.quickShadow.addEventListener('click', ev => { const b = ev.target.closest?.('[data-action="quick-enter"]'); if (b) this.run(() => this.action('quick-enter', b)); });
      if (this.win.ResizeObserver) this.composerResize = new this.win.ResizeObserver(() => this.positionQuick());
      this.composerObserver = new this.win.MutationObserver(() => { if (this.findComposer() !== this.composer) this.renderQuick(); }); this.composerObserver.observe(this.doc.body, {childList: true, subtree: true});
      this.quickScroll = () => this.positionQuick(); this.win.addEventListener('scroll', this.quickScroll, true);
    }
    findComposer() { return this.doc.querySelector('#send_form') || this.doc.querySelector('#send_textarea, #chatinput, textarea[name="send_textarea"]'); }
    renderQuick() {
      if (!this.quickElement) return;
      const composer = this.findComposer();
      if (composer !== this.composer) { this.composerResize?.disconnect(); this.composer = composer; if (composer) this.composerResize?.observe(composer); }
      this.quickElement.hidden = this.opened || !this.e.settings.quick_options || !composer;
      const routes = this.e.quickRoutes(); const signature = json(routes) + this.e.settings.enabled + this.e.state.paused;
      if (!routes.length) this.quickElement.hidden = true;
      if (signature !== this.quickSignature) { this.quickSignature = signature; this.quickShadow.innerHTML = `<style>${QUICK_STYLE}</style><div class="quick" role="region" aria-label="可选择剧情分支"><div class="quick-list">${routes.map(r => `<button type="button" class="bse-choice" data-action="quick-enter" data-id="${escape(r.target)}" data-status="${escape(r.status)}" title="${escape(r.status)} · 选择此分支">${escape(r.label)}</button>`).join('')}</div></div>`; }
      this.positionQuick();
    }
    positionQuick() {
      if (!this.quickElement || this.quickElement.hidden || !this.composer?.isConnected) return;
      const r = this.composer.getBoundingClientRect(), v = this.win.visualViewport; if (!r.width || !r.height) { this.quickElement.hidden = true; return; }
      const left = Math.max((v?.offsetLeft || 0) + 4, r.left), width = Math.min(r.width, (v?.width || this.win.innerWidth) - 8);
      this.quickElement.style.left = left + 'px'; this.quickElement.style.width = width + 'px'; this.quickElement.style.top = Math.max((v?.offsetTop || 0) + 4, r.top - this.quickElement.getBoundingClientRect().height - 6) + 'px';
    }
    updatePrivacy() {
      const body = this.shadow.querySelector('.node-spoiler-content'), layer = this.shadow.querySelector('.spoiler-layer');
      if (!body || !layer) return;
      this.shadow.querySelector('.node-spoiler').classList.toggle('locked', !this.unlocked);
      body.classList.toggle('locked', !this.unlocked); body.inert = !this.unlocked; body.setAttribute('aria-hidden', String(!this.unlocked));
      this.shadow.querySelector('[data-action="spoiler-lock"]').hidden = !this.unlocked; layer.hidden = this.unlocked;
      this.shadow.querySelector('[data-action="node-delete"]').disabled = !this.unlocked;
      layer.innerHTML = this.spoilerPrompt ? `<div class="spoiler-box" role="alertdialog" aria-labelledby="bse-spoiler-title" aria-describedby="bse-spoiler-warning"><span class="lock-icon">🔒</span><h2 id="bse-spoiler-title">确认查看剧本节点？</h2><p id="bse-spoiler-warning">节点列表与编辑区包含未来剧情、不同走向和结局，解锁后可能影响游玩体验。</p><div class="row">${button('取消，继续隐藏', 'unlock-cancel')}${button('确认解锁', 'unlock-confirm', 'class="primary"')}</div></div>` : `<div class="spoiler-box"><button type="button" data-action="unlock-ask" aria-label="解锁剧本内容"><span class="lock-icon">🔒</span>节点内容已隐藏</button><p class="muted">点击锁图标查看剧透提醒，其他页面可照常使用。</p></div>`;
    }
    cancelUnlock() { this.spoilerPrompt = false; this.updatePrivacy(); this.shadow.querySelector('[data-action="unlock-ask"]')?.focus(); }
    capture() {
      const form = this.shadow?.querySelector('form'); if (!form) return;
      const fields = {}; for (const el of form.elements) if (el.name) fields[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      this.forms[form.dataset.form] = fields;
    }
    values(key) { this.capture(); return this.forms[key] || {}; }
    restore(form) {
      const data = this.forms[form.dataset.form]; if (!data) return;
      for (const el of form.elements) if (el.name && Object.prototype.hasOwnProperty.call(data, el.name)) { if (el.type === 'checkbox') el.checked = data[el.name]; else el.value = data[el.name]; }
    }
    render(capture = true) {
      if (!this.shadow) return; if (capture) this.capture();
      if (this.privacyProject !== this.e.project.id) { this.privacyProject = this.e.project.id; this.unlocked = false; this.spoilerPrompt = false; }
      const oldForm = this.shadow.querySelector('form');
      if (oldForm) this.details[oldForm.dataset.form] = [...oldForm.querySelectorAll('details[open]')].map(d => d.querySelector('summary')?.textContent);
      const active = this.shadow.activeElement; const focusName = active?.name; const focusAction = active?.dataset?.action; const selection = active?.selectionStart;
      const scroll = this.shadow.querySelector('main').scrollTop;
      const tabs = [['run', '运行'], ['nodes', '剧本'], ['events', '事件'], ['records', '记录'], ['api', 'API'], ['analysis', '分析'], ['data', '数据']];
      this.shadow.querySelector('nav').innerHTML = tabs.map(([key, title]) => button(title, 'tab', `data-tab="${key}" class="${this.tab === key ? 'active' : ''}" aria-current="${this.tab === key ? 'page' : 'false'}"`)).join('');
      const body = ({run: () => this.runPage(), nodes: () => this.nodesPage(), events: () => this.eventsPage(), records: () => this.recordsPage(), api: () => this.apiPage(), analysis: () => this.analysisPage(), data: () => this.dataPage()}[this.tab])();
      this.shadow.querySelector('main').innerHTML = (this.e.error ? `<div class="warn error" role="alert" style="white-space:pre-wrap">${escape(this.e.error)}</div>` : '') + body;
      const form = this.shadow.querySelector('form'); if (form) this.restore(form);
      if (form) for (const d of form.querySelectorAll('details')) d.open = (this.details[form.dataset.form] || []).includes(d.querySelector('summary')?.textContent);
      this.shadow.querySelector('main').scrollTop = scroll;
      this.updatePrivacy(); this.applyLauncherPosition(); this.renderQuick();
      if (this.opened && !this.unlocked && focusAction?.startsWith('unlock-')) this.shadow.querySelector(`[data-action="${this.spoilerPrompt ? (focusAction === 'unlock-confirm' ? 'unlock-confirm' : 'unlock-cancel') : 'unlock-ask'}"]`)?.focus();
      if ((this.tab !== 'nodes' || this.unlocked) && focusName && form) {
        const el = Array.from(form.elements).find(x => x.name === focusName);
        if (el) { el.focus({preventScroll: true}); if (typeof selection === 'number' && el.setSelectionRange) try { el.setSelectionRange(selection, selection); } catch {} }
      }
    }
    async run(fn) { try { await fn(); } catch (e) { this.e.report(e); this.toast(e.message, true); } }
    toast(text, error = false) { const el = this.shadow.querySelector('.toast'); el.textContent = text; el.hidden = false; el.style.background = error ? '#592a31' : '#21473b'; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { el.hidden = true; }, 4000); }
    toggle() { if (this.opened) return this.close(); this.opened = true; this.oldFocus = this.doc.activeElement; this.shadow.querySelector('.overlay').hidden = false; this.render(); this.shadow.querySelector(this.tab === 'nodes' && !this.unlocked ? '[data-action="unlock-ask"]' : '[data-action="close"]').focus(); }
    close() { this.capture(); this.opened = false; this.spoilerPrompt = false; this.shadow.querySelector('.overlay').hidden = true; this.renderQuick(); this.oldFocus?.focus?.(); }
    runPage() {
      const e = this.e; const p = e.project; const s = e.state; const refs = C.indexProject(p); const node = refs.nodes.get(s.current_node_id);
      return `<div class="card"><div class="row spread"><div><h2>${escape(p.title)}</h2><span class="badge">${e.settings.enabled ? s.paused ? '已暂停' : '运行中' : '未启用'}</span> <span class="muted">${e.settings.worldbook ? '世界书：' + escape(e.settings.worldbook) : '草稿暂存在脚本变量，建议写入世界书'}</span></div>${button(e.settings.enabled ? '关闭注入' : '启用剧本', 'toggle-enabled', 'class="primary"')}</div></div>
      <div class="card"><h2>${escape(node.title)}</h2><p style="white-space:pre-wrap">${escape(e.settings.detail ? node.detail || node.guidance : node.guidance || node.detail)}</p>${node.boundary ? `<p class="muted">${escape(node.boundary)}</p>` : ''}<div class="row">${button(s.completed_node_ids.includes(node.id) ? '本节点已完成' : '确认完成本节点', 'complete', s.completed_node_ids.includes(node.id) ? 'disabled' : 'class="primary"')}${button(s.paused ? '继续' : '暂停', 'pause')}${button('回退上次操作', 'undo', s.history.length ? '' : 'disabled')}${button('确认此回复并识别事件', 'check', e.busy ? 'disabled' : '')}</div><p class="muted">完成节点会执行配置的收集和变量效果；进入出口不会自动完成当前节点。</p></div>
      <div class="card"><h2>接下来的分支</h2>${node.routes.length ? node.routes.map(r => `<div class="card route"><div><strong>${escape(r.label || refs.nodes.get(r.target).title)}</strong><div class="muted">${escape(conditionSummary(r.condition, p))}</div></div>${button(C.condition(r.condition, s) ? '进入分支' : '尚未解锁', 'enter', `data-id="${escape(r.target)}" ${C.condition(r.condition, s) ? '' : 'disabled'}`)}</div>`).join('') : '<p class="empty">此节点没有出口，可以在剧本页添加。</p>'}</div>
      <div class="grid"><div class="card"><h3>已收集</h3>${s.collected_ids.length ? s.collected_ids.map(k => `<span class="badge">${escape(refs.collections.get(k) || k)}</span> `).join('') : '<p class="empty">暂无收集项</p>'}</div><div class="card"><h3>关系与状态</h3>${p.variables.map(v => `<div class="kv"><span>${escape(v.title || v.id)}</span><strong>${escape(s.variables[v.id])}</strong></div>`).join('') || '<p class="empty">可在数据页定义好感度等变量。</p>'}</div></div>`;
    }
    list(items, key, selected, label) {
      const q = (this.search[key + '_search'] || '').toLowerCase();
      const filtered = items.filter(n => (n.title + ' ' + n.id).toLowerCase().includes(q));
      const pages = Math.max(1, Math.ceil(filtered.length / 20)); this.listPage = Math.min(this.listPage, pages - 1);
      return `<div class="card"><h3>${label} <span class="muted">${items.length}</span></h3>${input('搜索名称或编号', key + '_search', q)}<div class="stack">${filtered.slice(this.listPage * 20, this.listPage * 20 + 20).map(n => button(n.title, key + '-select', `class="${n.id === selected ? 'selected' : ''}" data-id="${escape(n.id)}"`)).join('')}</div><div class="row pagination">${button('上一页', 'list-prev', this.listPage ? '' : 'disabled')}<span class="muted">${this.listPage + 1}/${pages}</span>${button('下一页', 'list-next', this.listPage < pages - 1 ? '' : 'disabled')}</div></div>`;
    }
    conditionHelper(prefix) {
      return `<details><summary>用收集项生成条件</summary><div class="grid">${input('必须拥有（ID，逗号分隔）', prefix + '_all', '')}${input('必须没有（ID，逗号分隔）', prefix + '_not', '')}</div>${button('生成条件 JSON', 'make-condition', `data-prefix="${prefix}"`)}<p class="muted">复杂条件支持 all、any、not、completed、visited、event_completed 和 variable。生成后可继续编辑。</p></details>`;
    }
    nodesPage() {
      const p = this.e.project; this.nodeId ||= p.nodes[0].id; const n = p.nodes.find(v => v.id === this.nodeId) || p.nodes[0]; this.nodeId = n.id;
      const options = p.nodes.map(v => [v.id, v.title]);
      let routes = n.routes;
      try {
        if (this.forms['node:' + n.id]?.routes) {
          const draftRoutes = C.parseJSON(this.forms['node:' + n.id].routes);
          if (Array.isArray(draftRoutes) && draftRoutes.every(r => C.object(r) && p.nodes.some(x => x.id === r.target))) routes = draftRoutes;
        }
      } catch {}
      return `<form data-form="node:${escape(n.id)}"><div class="card row node-toolbar">${button('新建节点', 'node-new')}${button('导入剧本', 'import')}${button('导出剧本', 'export-project')}${button('分析长文本', 'open-analysis')}${button('整理长文本', 'open-segment')}${button('删除节点', 'node-delete', 'class="danger" title="解锁节点后可删除"')}${button('🔒 隐藏节点', 'spoiler-lock')}<span class="muted">修改后保持内部编号。</span></div><div class="node-spoiler"><div class="node-spoiler-content"><div class="split">${this.list(p.nodes, 'node', n.id, '剧情节点')}<div class="card"><h2>编辑节点</h2>${input('名称', 'title', n.title)}${select('节点类型', 'kind', [['scene', '剧情阶段'], ['choice', '分歧选择'], ['ending', '结局']], n.kind)}${checkbox('此节点属于补充构想（非原文）', 'suggested', n.suggested)}${area('短演绎指引（默认注入）', 'guidance', n.guidance)}${area('详细剧情原文', 'detail', n.detail, 8)}${area('演绎边界与保留线索', 'boundary', n.boundary, 3)}${input('相关变量 ID（逗号分隔，仅这些状态进入提示词）', 'context_variables', n.context_variables.join(','))}
      <details><summary>完成节点时的效果</summary>${area('效果 JSON', 'effects', json(n.effects), 5)}<div class="grid">${input('收集项 ID', 'collect_id', '')}${select('增加数值变量', 'effect_variable', [['', '不选择'], ...p.variables.filter(v => v.type === 'number').map(v => [v.id, v.title || v.id])], '')}${input('增加量', 'effect_delta', 1, 'number')}</div>${button('追加效果', 'append-effect')}</details>
      <h3>分支出口</h3>${routes.map((r, i) => `<div class="card"><strong>${escape(r.label || p.nodes.find(v => v.id === r.target).title)}</strong><p class="muted">${escape(conditionSummary(r.condition, p))}</p>${button('移除此出口', 'route-delete', `data-index="${i}"`)}</div>`).join('')}
      <details><summary>添加或修改出口</summary>${select('目标节点', 'route_target', options, p.nodes.find(v => v.id !== n.id)?.id || n.id)}${input('按钮显示文字', 'route_label', '')}${this.conditionHelper('route')}${area('出口条件 JSON', 'route_condition', 'true', 5)}${button('保存这个出口', 'route-save')}</details>
      <details><summary>高级信息</summary>${input('稳定节点 ID', 'id', n.id, 'text', 'readonly')}${area('所有出口 JSON（保存节点时应用）', 'routes', json(n.routes), 6)}</details>
      <div class="actions">${button('保存节点', 'node-save', 'class="primary"')}${button('设为新对话起点', 'set-start')}</div></div></div></div><div class="spoiler-layer"></div></div></form>`;
    }
    eventsPage() {
      const p = this.e.project;
      const guide = `<div class="card event-guide"><h2>事件规则：发生什么 → 更新什么</h2><p>这里配置对话中的行为和结果，以及发生后要记录的变化。例如：对方接受送花 → 好感度 +1，并记录“已送花”；得到房卡 → 记录收集项 A，用于解锁后续分支。</p><p class="muted">剧本节点负责当前剧情与下一步走向。事件规则负责从聊天正文中确认行为，更新变量或收集记录；条件是否解锁仍由本地脚本计算。不需要这类记录时，可以不配置事件。</p><ol><li>写清“什么情况下算已经发生”，排除提议、计划和拒绝。</li><li>设置发生后的变化，如好感度增加或记录收集项。</li><li>保存规则，在“运行”页识别当前回复，再到“记录”页确认；也可手动确认发生。勾选自动结算后，证据通过的结果会直接应用。</li></ol><div class="row">${button('用送花示例创建规则', 'event-example')}${button('查看待确认事件', 'event-records')}</div><p class="muted">送花示例会添加好感度变量与“已送花”收集项，规则和变化都可以继续修改。</p></div>`;
      if (!p.events.length) return guide + `<div class="card"><h2>还没有事件规则</h2><p>可以从送花示例开始，也可以新建自己的识别规则。</p>${button('新建事件规则', 'event-new', 'class="primary"')}${button('导入剧本与事件规则', 'import')}</div>`;
      this.eventId ||= p.events[0].id; const ev = p.events.find(v => v.id === this.eventId) || p.events[0]; this.eventId = ev.id;
      let effects = ev.effects; try { if (this.forms['event:' + ev.id]?.effects) effects = C.parseJSON(this.forms['event:' + ev.id].effects); } catch {}
      const changes = Array.isArray(effects) ? effects.map(effect => {
        if (!C.object(effect)) return '请检查效果 JSON';
        if (effect.collect) return '记录收集项：' + (p.collections.find(c => c.id === effect.collect)?.title || effect.collect);
        const value = effect.add || effect.set; if (!value) return '请检查效果 JSON';
        const name = p.variables.find(v => v.id === value.variable)?.title || value.variable;
        return name + (effect.add ? ' ' + (value.value >= 0 ? '+' : '') + value.value : ' 设置为 ' + value.value);
      }).join('；') : '变化草稿尚未通过校验';
      return guide + `<form data-form="event:${escape(ev.id)}"><div class="card row">${button('新建事件规则', 'event-new')}${button(ev.repeat_policy === 'once' && this.e.state.event_counts[ev.id] ? '本规则已确认发生' : '手动确认发生并应用变化', 'event-manual', ev.repeat_policy === 'once' && this.e.state.event_counts[ev.id] ? 'disabled' : '')}${button('删除规则', 'event-delete', 'class="danger"')}<span class="muted">手动确认直接执行本条规则，不调用模型。</span></div><div class="split">${this.list(p.events, 'event', ev.id, '事件规则')}<div class="card"><h2>编辑事件规则</h2>${input('规则名称', 'title', ev.title)}${area('需要识别的行为或结果', 'description', ev.description, 4)}${area('什么情况下算已经发生', 'completion_criteria', ev.completion_criteria, 4)}${area('不算发生的情况（每行一条）', 'exclusions', ev.exclusions.join('\n'), 3)}<div class="grid">${select('如何确认发生', 'detection', [['api', '辅助 API 分析正文'], ['manual', '仅手动确认']], ev.detection)}${select('同一规则可以执行几次', 'repeat_policy', [['once', '整个剧本一次'], ['once_per_accepted_turn', '每条确认回复一次']], ev.repeat_policy)}</div>${checkbox('启用此规则', 'enabled', ev.enabled)}${checkbox('辅助 API 完成判断且证据通过后自动应用变化', 'auto_settle', ev.auto_settle)}<h3>发生后的变化</h3><p class="event-effects-summary">${escape(changes || '尚未配置变化，请从下面添加。')}</p><div class="grid">${input('要记录的收集项编号（可空）', 'collect_id', '')}${select('要增加的变量', 'effect_variable', [['', '不选择'], ...p.variables.filter(v => v.type === 'number').map(v => [v.id, v.title || v.id])], '')}${input('增加量（减分可填负数）', 'effect_delta', 1, 'number')}</div>${button('加入发生后的变化', 'append-effect')}<p class="muted">先填写并加入变化，再保存规则。好感度等变量可在“数据”页创建；收集记录可作为分支的解锁条件。</p><details><summary>高级：效果 JSON</summary>${area('完成效果 JSON', 'effects', json(ev.effects), 5)}</details><details><summary>高级：适用范围、前置条件与身份</summary>${input('主体 ID（可空；玩家可写 player）', 'actor_id', ev.actor_id || '')}${input('对象 ID（可空）', 'recipient_id', ev.recipient_id || '')}${input('适用节点 ID（逗号分隔；留空表示整个剧本）', 'scope_nodes', ev.scope.kind === 'nodes' ? ev.scope.node_ids.join(',') : '')}${this.conditionHelper('event')}${area('事件前置条件 JSON', 'condition', json(ev.condition ?? true), 4)}<p>稳定事件 ID：<code>${escape(ev.id)}</code></p></details><div class="actions">${button('保存事件规则', 'event-save', 'class="primary"')}${button('查看识别记录', 'event-records')}</div></div></div></form>`;
    }
    recordsPage() {
      const e = this.e; const p = e.project; const s = e.state; const refs = C.indexProject(p);
      const statuses = {completed: '已发生，待结算', uncertain: '不确定', proposed: '仅提议', rejected: '被拒绝', not_occurred: '未发生'};
      return `<div class="card"><h2>进度记录</h2><div class="grid"><div><h3>已完成节点</h3>${s.completed_node_ids.map(k => `<p>${escape(refs.nodes.get(k)?.title || k)}</p>`).join('') || '<p class="empty">暂无</p>'}</div><div><h3>事件累计</h3>${Object.entries(s.event_counts).map(([k, v]) => `<div class="kv"><span>${escape(refs.events.get(k)?.title || k)}</span><strong>${v}</strong></div>`).join('') || '<p class="empty">暂无</p>'}</div></div></div>
      <div class="card"><h2>待确认与失败检查</h2>${e.busy ? '<span class="badge">辅助任务运行中</span>' : ''}${s.pending_checks.map(check => `<div class="card"><h3>回复楼层 ${Number(check.assistant_id) + 1} · ${escape(check.status)}</h3>${check.error ? `<p class="warn">${escape(check.error)}</p>` : ''}${['error', 'stale', 'partial'].includes(check.status) ? button(check.status === 'partial' ? '继续检查未查候选' : '重新检查', 'retry', `data-key="${escape(check.key)}"`) : ''}${check.results.filter(r => !r.handled).map(r => `<div class="card"><strong>${escape(refs.events.get(r.event_id)?.title || r.event_id)}</strong> <span class="badge">${escape(statuses[r.status])}</span>${r.evidence.map(x => `<p class="muted">“${escape(x.quote)}”</p>`).join('')}${r.note ? `<p class="warn">${escape(r.note)}</p>` : ''}${['completed', 'uncertain'].includes(r.status) ? `<div class="row">${button('确认发生并结算', 'result-accept', `data-key="${escape(check.key)}" data-id="${escape(r.event_id)}"`)}${button('忽略', 'result-dismiss', `data-key="${escape(check.key)}" data-id="${escape(r.event_id)}"`)}</div>` : ''}</div>`).join('')}</div>`).join('') || '<p class="empty">没有待处理的检查</p>'}</div>
      <div class="card"><h2>近期操作（最多 25 条）</h2>${s.history.slice().reverse().map(tx => `<p>${escape(tx.label)} <span class="muted">${new Date(tx.at).toLocaleString()}</span></p>`).join('') || '<p class="empty">暂无操作</p>'}${button('回退最近一次', 'undo', s.history.length ? '' : 'disabled')}</div>`;
    }
    apiSource(profile) { return this.e.apiEndpoints(profile.base_url).models + '\n' + (profile.key || '').trim(); }
    apiPreview(profile) {
      try {
        const endpoints = this.e.apiEndpoints(profile.base_url); const visible = value => { const url = new URL(value); return url.origin + url.pathname; };
        return `<p>模型列表：<code>${escape(visible(endpoints.models))}</code></p><p>聊天接口：<code>${escape(visible(endpoints.chat))}</code></p>`;
      } catch { return ''; }
    }
    apiPage() {
      const s = this.e.settings; const a = {...s.profile, ...this.forms.api}; const u = this.e.client.usage; const prompts = this.e.defaultPrompts();
      const urls = `<div class="api-endpoints muted">${this.apiPreview(a)}</div>`; let models = [];
      try { if (this.apiModels?.source === this.apiSource(a)) models = this.apiModels.ids; } catch {}
      const pick = (label, name, value) => models.length ? select(label, name, [['', '请选择（保留手动输入）'], ...models.map(id => [id, id])], models.includes(value) ? value : '') : '';
      return `<form data-form="api"><div class="card"><h2>辅助 API</h2><p class="muted">独立于主聊天 API。支持可从浏览器调用的 OpenAI 兼容 Chat Completions 服务。</p>${input('API 基础地址（域名、带 /v1 的地址或完整聊天接口）', 'base_url', a.base_url, 'url')}<p class="muted">只填域名时自动使用 /v1；自定义路径按原样保留。请使用服务提供的 OpenAI 兼容地址。</p>${input('API 密钥', 'key', a.key, 'password', 'autocomplete="off"')}${checkbox('记住密钥（保存在酒馆脚本变量）', 'remember_key', s.remember_key)}<div class="row">${button(this.modelLoading ? '正在获取模型…' : '获取模型列表', 'api-models', this.modelLoading || this.e.busy ? 'disabled' : '')}</div><p class="muted">获取列表不生成回复。选择后填入完整模型 ID；也可手动输入。列表可用后，仍需测试聊天接口。</p>${urls}${input('事件识别模型（完整 ID）', 'model', a.model)}${pick('从模型列表选择事件识别模型', 'model_choice', a.model)}${input('剧本整理模型（留空沿用事件模型）', 'segment_model', this.forms.api?.segment_model ?? s.segment_model)}${pick('从模型列表选择剧本整理模型', 'segment_model_choice', this.forms.api?.segment_model ?? s.segment_model)}<div class="row">${button('保存 API 设置', 'api-save', 'class="primary"')}${button('测试连接', 'api-test', this.e.busy || this.modelLoading ? 'disabled' : '')}</div></div>
      <div class="card"><h2>判断与预算</h2>${checkbox('用户接话后自动检查上一条选中的回复', 'auto_detect', s.auto_detect)}${checkbox('请求 JSON 输出（服务不支持时可关闭）', 'json_mode', a.json_mode)}${checkbox('发送 enable_thinking=false（仅兼容服务开启）', 'no_thinking', a.no_thinking)}<div class="grid">${input('每批候选事件数', 'batch_size', s.batch_size, 'number', 'min="1" max="32"')}${input('每次最多请求批数', 'max_batches', s.max_batches, 'number', 'min="1" max="64"')}${input('请求超时（秒）', 'timeout_sec', a.timeout_sec, 'number', 'min="5" max="300"')}${input('最大输入字符数（不是 Token）', 'max_input_chars', a.max_input_chars, 'number', 'min="1000" max="200000"')}${input('识别最大输出 Token', 'max_output', a.max_output, 'number', 'min="128" max="16000"')}${input('整理最大输出 Token', 'segment_output', a.segment_output, 'number', 'min="512" max="32000"')}${input('生成前最多等待判断（毫秒，0 为异步）', 'wait_ms', s.wait_ms, 'number', 'min="0" max="15000"')}</div><p class="muted">候选过多按批检查，达到本轮批数上限后会显示未检查数量，由你决定继续。输入超限会明确报错，不把截断文本当作全面检查结果。自动检查需启用剧本。</p></div>
      <div class="card"><h2>实际发送给辅助 API 的系统提示词</h2><p class="muted">下面的文本作为对应请求的 system 消息发送，可直接编辑，点击“保存 API 设置”生效。留空使用默认值。JSON 字段和证据格式仍需保持兼容。</p>${area('事件核验系统提示词', 'detect_prompt', a.detect_prompt || prompts.detect, 8)}${area('基础文本拆分系统提示词', 'segment_prompt', a.segment_prompt || prompts.segment, 8)}${area('剧本分析系统提示词', 'analysis_prompt', a.analysis_prompt || prompts.analysis, 12)}${area('跨段合并系统提示词', 'analysis_merge_prompt', a.analysis_merge_prompt || prompts.merge, 10)}${input('分析最大输出 Token', 'analysis_output', a.analysis_output, 'number', 'min="512" max="32000"')}${button('恢复默认提示词（仍需保存）', 'prompts-reset')}<details><summary>每次请求附带什么数据？</summary><p>事件核验：当前对话 dialogue、已确认状态 facts、候选事件 candidates。基础拆分：原文 original 与要求 preferences。剧本分析：原文 original、要求 preferences、模式 mode；长文本增加分块编号 part / parts。跨段合并：节点摘要 nodes 与各块报告 parts。</p><p>这些数据放在 user 消息中，每次自动填写。连接测试另发固定 user 消息：只输出 JSON：{&quot;ok&quot;:true}。</p></details><div class="row">${button('保存 API 设置', 'api-save', 'class="primary"')}</div></div>
      <div class="card"><h2>本机已记录用量</h2><div class="row"><span>成功响应 ${u.calls} 次</span><span>输入 ${u.input} Token</span><span>输出 ${u.output} Token</span></div>${u.unknown ? `<p class="muted">${u.unknown} 次响应没有返回 usage，未计入 Token 总数。</p>` : ''}</div></form>`;
    }
    analysisPage() {
      const e = this.e, draft = e.analysisDraft, p = draft?.project || e.project, a = p.analysis, refs = C.indexProject(p), progress = e.analysisProgress;
      const names = ids => (ids || []).map(k => refs.nodes.get(k)?.title || k).join(' → ');
      const proposed = item => item.suggested ? '<span class="badge">补充构想</span>' : '';
      return `<form data-form="analysis"><div class="card"><h2>长文本分析为新剧本</h2><p class="muted">分割剧情阶段，归纳不同走向、结局与伏笔。超过单次输入预算时自动分块并额外调用一次 API 整合；单次最多 20 万字符、32 块。</p>${area('需要分析的长文本', 'analysis_text', e.project.original_text || '', 12)}${area('分析要求', 'analysis_wish', '提取关键阶段、不同走向与结局，标出伏笔埋设和回收；未明确的信息列为待核对事项。', 3)}${select('处理方式', 'analysis_mode', [['faithful', '忠于原文，只整理已明确内容'], ['expand', '允许补充分支和结局，标为建议']], 'faithful')}<div class="row">${button('调用辅助 API 分析', 'analysis-run', e.busy ? 'disabled' : 'class="primary"')}${progress ? button('取消分析', 'analysis-cancel') : ''}</div>${progress ? `<p class="warn" role="status">${escape(progress.phase)} · 已完成 ${progress.done}/${progress.total || '准备中'} 次请求</p>` : ''}<p class="muted">使用 API 页的剧本整理模型和分析提示词。结果先保存为草稿，确认应用后才切换当前剧本。</p></div>
      ${a ? `<div class="card analysis-report"><h2>${draft ? '分析草稿报告' : '当前剧本分析报告'}</h2><p style="white-space:pre-wrap">${escape(a.synopsis)}</p><h3>不同走向</h3>${a.branches.map(x => `<div class="card"><strong>${escape(x.title)}</strong> ${proposed(x)}<p>${escape(x.summary)}</p><p class="muted">${escape(names(x.node_ids))}</p></div>`).join('') || '<p class="empty">未确认不同走向</p>'}<h3>结局</h3>${a.endings.map(x => `<div class="card"><strong>${escape(x.title)}</strong> ${proposed(x)}<p>${escape(x.summary)}</p><p class="muted">${escape(refs.nodes.get(x.node_id)?.title || '')}</p></div>`).join('') || '<p class="empty">原文未明确结局</p>'}<h3>伏笔与回收</h3>${a.foreshadowing.map(x => `<div class="card"><strong>${escape(x.title)}</strong> ${proposed(x)}<p>埋设：${escape(x.hint)}</p><p class="muted">${escape(names(x.plant_node_ids))}</p><p>回收：${escape(x.payoff)}</p><p class="muted">${escape(names(x.payoff_node_ids))}</p></div>`).join('') || '<p class="empty">未确认伏笔</p>'}${a.uncertainties.length ? `<h3>待核对事项</h3><ul>${a.uncertainties.map(x => `<li>${escape(x)}</li>`).join('')}</ul>` : ''}</div>` : ''}
      ${draft ? `<div class="card"><h2>编辑并应用分析草稿</h2><p class="warn">${draft.warnings.map(escape).join('<br>') || '请核对原文、走向、结局与伏笔。'}<br>本次分析使用 ${Number(draft.request_count) || 1} 次请求。条件与奖励请在节点编辑器中配置。</p>${area('完整剧本草稿 JSON（可编辑）', 'analysis_draft', json(draft.project), 18)}<div class="row">${button('应用分析草稿为新剧本', 'analysis-apply', 'class="primary"')}${button('导出分析草稿', 'analysis-export')}</div></div>` : ''}</form>`;
    }
    dataPage() {
      const e = this.e; const p = e.project;
      let books = []; try { books = e.host.books(); } catch {}
      const draft = e.segmentDraft;
      return `<form data-form="data"><div class="card"><h2>剧本与世界书</h2>${input('剧本名称', 'project_title', p.title)}${area('必要背景（会进入主模型提示词）', 'premise', p.premise, 3)}<div class="grid">${select('读取已有世界书', 'book_load', [['', '请选择'], ...books.map(b => [b, b])], e.settings.worldbook)}${input('写入世界书名称', 'book_save', e.settings.worldbook || '分支剧本素材')}</div>${this.bookProjects.length > 1 ? select('世界书中的剧本', 'book_project', this.bookProjects.map(v => [v.id, v.title]), p.id) : ''}<div class="row">${button('读取世界书', 'book-load')}${button('写入世界书', 'book-save', 'class="primary"')}${button('保存名称与背景', 'project-meta')}${button('新建空白剧本', 'project-new')}</div><p class="muted">每个节点和事件独立保存为关闭自动激活的条目；只更新本插件当前剧本，保留其他条目。</p></div>
      <div class="card"><h2>整理大段文本（可选模型功能）</h2>${area('剧本原文', 'original_text', p.original_text || '', 10)}${input('整理要求（如按场景分段，保留已有分支）', 'segment_wish', '')}<div class="row">${button('调用辅助 API 整理为草稿', 'segment', e.busy ? 'disabled' : '')}${button('不调用模型，保存原文', 'original-save')}</div><p class="muted">整理产生额外调用。不会直接替换当前剧本，完成后可编辑草稿再应用。</p>${draft ? `<div class="warn">${draft.warnings.map(escape).join('<br>') || '整理完成，请核对节点和原文后应用。'}</div>${area('可编辑的剧本草稿 JSON', 'segment_draft', json(draft.project), 14)}${button('应用此草稿为新剧本', 'segment-apply', 'class="primary"')}` : ''}</div>
      <div class="card"><h2>变量与收集项</h2><p class="muted">变量支持 number / boolean / string。数值变量可设置 min、max；收集项提供易读名称。</p>${area('变量定义 JSON', 'variables', json(p.variables), 7)}${area('收集项名称 JSON', 'collections', json(p.collections), 5)}${button('保存变量和收集项定义', 'definitions-save')}</div>
      <div class="card"><h2>选项与界面</h2>${checkbox('在酒馆输入框上方直接显示可选择的分支', 'quick_options', e.settings.quick_options)}<p class="muted">直接列出“查看走廊”等当前可用、已解锁的选项，点击后切换当前节点，不自动发送消息或覆盖输入框草稿。防剧透只隐藏“剧本”页的节点列表和编辑区，其他页面和顶部工具栏照常使用；刷新或切换新剧本后重新隐藏节点。</p><div class="row">${button('保存选项设置', 'options-save')}${button('恢复铅笔图标默认位置', 'launcher-reset')}</div></div>
      <div class="card"><h2>注入方式</h2>${input('注入深度', 'depth', e.settings.depth, 'number', 'min="0" max="100"')}${checkbox('注入详细剧情（默认使用短指引）', 'detail', e.settings.detail)}${button('保存注入设置', 'injection-save')}</div>
      <div class="card"><h2>导入、备份与草稿</h2><div class="row">${button('导入剧本或进度 JSON', 'import')}${button('导出当前剧本', 'export-project')}${button('备份当前进度', 'export-progress')}${button('重置当前聊天进度', 'reset', 'class="danger"')}</div><p class="muted">剧本分享包和进度备份均不包含 API 密钥。</p>${Object.values(e.settings.drafts || {}).map(v => button('打开草稿：' + v.title, 'draft-load', `data-id="${escape(v.id)}"`)).join(' ')}</div>
      <details><summary>高级：完整剧本 JSON 编辑</summary>${area('当前剧本数据', 'project_json', json(p), 16)}${button('校验并应用 JSON', 'project-json-save')}</details></form>`;
    }
    getForm() { const form = this.shadow.querySelector('form'); return this.values(form?.dataset.form); }
    async action(action, b) {
      if (action === 'close') return this.close();
      if (action === 'unlock-ask') { this.spoilerPrompt = true; this.updatePrivacy(); this.shadow.querySelector('[data-action="unlock-cancel"]').focus(); return; }
      if (action === 'unlock-cancel') return this.cancelUnlock();
      if (action === 'unlock-confirm') { this.unlocked = true; this.spoilerPrompt = false; this.updatePrivacy(); this.shadow.querySelector('[data-action="spoiler-lock"]')?.focus(); return; }
      if (action === 'spoiler-lock') { this.unlocked = false; this.spoilerPrompt = false; this.updatePrivacy(); this.shadow.querySelector('[data-action="unlock-ask"]').focus(); return; }
      if (action === 'quick-enter') { C.assert(this.e.settings.quick_options && this.e.settings.enabled && !this.e.state.paused, '快捷分支当前未启用'); this.e.enter(b.dataset.id); this.doc.querySelector('#send_textarea, #chatinput')?.focus({preventScroll: true}); return; }
      const protectedAction = ['node-select', 'node-save', 'node-delete', 'set-start', 'route-save', 'route-delete'].includes(action) || this.tab === 'nodes' && ['make-condition', 'append-effect', 'list-prev', 'list-next'].includes(action);
      if (protectedAction) C.assert(this.unlocked, '请先确认剧透风险并解锁剧本节点');
      const e = this.e; const v = this.getForm(); const ids = raw => String(raw || '').split(/[,，\n]/).map(x => x.trim()).filter(Boolean);
      const n = () => C.indexProject(e.project).nodes.get(this.nodeId);
      const event = () => C.indexProject(e.project).events.get(this.eventId);
      const number = (key, min, max) => { const value = Number(v[key]); C.assert(Number.isFinite(value) && value >= min && value <= max, key + ' 数值超出范围'); return value; };
      if (action === 'tab') { this.capture(); this.tab = b.dataset.tab; this.spoilerPrompt = false; this.listPage = 0; this.render(); this.shadow.querySelector('main').scrollTop = 0; return; }
      if (action === 'list-prev' || action === 'list-next') { this.listPage += action === 'list-prev' ? -1 : 1; this.render(); return; }
      if (action === 'node-select' || action === 'event-select') { this.capture(); if (action === 'node-select') this.nodeId = b.dataset.id; else this.eventId = b.dataset.id; this.render(false); return; }
      if (action === 'toggle-enabled') await e.updateSettings({enabled: !e.settings.enabled});
      else if (action === 'complete') e.complete();
      else if (action === 'enter') e.enter(b.dataset.id);
      else if (action === 'pause') e.pause();
      else if (action === 'undo') e.undo();
      else if (action === 'check') await e.checkLatest();
      else if (action === 'retry') await e.retryCheck(b.dataset.key);
      else if (action === 'result-accept' || action === 'result-dismiss') await e.confirmResult(b.dataset.key, b.dataset.id, action === 'result-accept');
      else if (action === 'node-new') {
        const node = {id: C.id('N'), title: '新剧情节点', guidance: '', detail: '', boundary: '', effects: [], routes: [], context_variables: []};
        await e.editProject(p => p.nodes.push(node)); this.nodeId = node.id;
      } else if (action === 'node-delete') {
        C.assert(this.win.confirm('删除当前编辑节点？已有进度或引用会阻止删除。'), '已取消删除');
        await e.editProject(p => { p.nodes = p.nodes.filter(x => x.id !== this.nodeId); }); this.nodeId = '';
      } else if (action === 'node-save') {
        const current = n(); await e.editProject(p => Object.assign(p.nodes.find(x => x.id === current.id), {title: v.title, kind: v.kind, suggested: v.suggested, guidance: v.guidance, detail: v.detail, boundary: v.boundary,
          effects: C.parseJSON(v.effects, '效果'), routes: C.parseJSON(v.routes, '出口'), context_variables: ids(v.context_variables)})); delete this.forms['node:' + current.id];
      } else if (action === 'set-start') await e.editProject(p => { p.start_node_id = this.nodeId; });
      else if (action === 'route-save') {
        const condition = C.parseJSON(v.route_condition, '出口条件'); const routes = C.parseJSON(v.routes, '出口');
        const entry = {target: v.route_target, label: v.route_label || e.project.nodes.find(x => x.id === v.route_target).title, condition};
        const at = routes.findIndex(r => r.target === entry.target); if (at < 0) routes.push(entry); else routes[at] = entry;
        this.forms['node:' + this.nodeId].routes = json(routes); this.render(false); this.toast('出口已加入编辑草稿，请保存节点'); return;
      } else if (action === 'route-delete') {
        const routes = C.parseJSON(v.routes, '出口'); routes.splice(Number(b.dataset.index), 1); this.forms['node:' + this.nodeId].routes = json(routes); this.render(false); return;
      } else if (action === 'make-condition') {
        const prefix = b.dataset.prefix; const terms = [...ids(v[prefix + '_all']).map(collected => ({collected})), ...ids(v[prefix + '_not']).map(collected => ({not: {collected}}))];
        const form = this.shadow.querySelector('form'); this.forms[form.dataset.form][prefix === 'route' ? 'route_condition' : 'condition'] = json(terms.length ? {all: terms} : true); this.render(false); return;
      } else if (action === 'append-effect') {
        const effects = C.parseJSON(v.effects, '效果'); if (v.collect_id?.trim()) effects.push({collect: C.safeId(v.collect_id.trim())});
        if (v.effect_variable) { C.assert(Number.isFinite(Number(v.effect_delta)), '请输入有效增加量'); effects.push({add: {variable: v.effect_variable, value: Number(v.effect_delta)}}); }
        const form = this.shadow.querySelector('form'); this.forms[form.dataset.form].effects = json(effects); this.render(false); return;
      } else if (action === 'event-records') { this.tab = 'records'; this.spoilerPrompt = false; this.render(); this.shadow.querySelector('main').scrollTop = 0; return; }
      else if (action === 'event-example') {
        const ev = {id: C.id('E'), title: '送花并被接受', description: '玩家把花交给对方或为对方佩戴，对方接受。', completion_criteria: '实际交付或佩戴动作已经完成，对方明确接受。', exclusions: ['只是提出送花', '尚未行动的计划', '对方拒绝', '假设或回忆'], effects: [], detection: 'api', repeat_policy: 'once', auto_settle: false, actor_id: 'player'};
        await e.editProject(p => {
          let variable = p.variables.find(x => x.id === 'affection' && x.type === 'number');
          if (!variable) { variable = {id: p.variables.some(x => x.id === 'affection') ? C.id('affection') : 'affection', title: '好感度', type: 'number', default: 0, min: 0, max: 100}; p.variables.push(variable); }
          if (!p.collections.some(x => x.id === 'FLOWER_ACCEPTED')) p.collections.push({id: 'FLOWER_ACCEPTED', title: '已送花并被接受'});
          ev.effects = [{add: {variable: variable.id, value: 1}}, {collect: 'FLOWER_ACCEPTED'}]; p.events.push(ev);
        }); this.eventId = ev.id;
      } else if (action === 'event-new') {
        const ev = {id: C.id('E'), title: '新事件', description: '描述需要识别的事件', completion_criteria: '写明事件实际完成的标准', exclusions: ['只是提议', '引用旧事', '被拒绝'], effects: [], detection: 'api', repeat_policy: 'once', auto_settle: false};
        await e.editProject(p => p.events.push(ev)); this.eventId = ev.id;
      } else if (action === 'event-delete') {
        C.assert(this.win.confirm('删除此事件？'), '已取消删除'); await e.editProject(p => { p.events = p.events.filter(x => x.id !== this.eventId); }); this.eventId = '';
      } else if (action === 'event-manual') await e.manualEvent(this.eventId);
      else if (action === 'event-save') {
        const current = event(); const nodeIds = ids(v.scope_nodes);
        await e.editProject(p => Object.assign(p.events.find(x => x.id === current.id), {title: v.title, description: v.description, completion_criteria: v.completion_criteria,
          exclusions: String(v.exclusions).split('\n').map(x => x.trim()).filter(Boolean), actor_id: v.actor_id.trim(), recipient_id: v.recipient_id.trim(),
          scope: nodeIds.length ? {kind: 'nodes', node_ids: nodeIds} : {kind: 'project'}, detection: v.detection, repeat_policy: v.repeat_policy,
          enabled: v.enabled, auto_settle: v.auto_settle, condition: C.parseJSON(v.condition, '事件条件'), effects: C.parseJSON(v.effects, '事件效果')})); delete this.forms['event:' + current.id];
      } else if (action === 'api-models') {
        if (this.modelLoading) return;
        const profile = {base_url: v.base_url.trim(), key: v.key.trim(), timeout_sec: number('timeout_sec', 5, 300)};
        const source = this.apiSource(profile); this.modelLoading = true; this.apiModels = null; this.render();
        try {
          const ids = await e.client.models(profile); this.capture();
          let currentSource = ''; try { currentSource = this.apiSource(this.forms.api); } catch {}
          if (currentSource !== source) { this.toast('地址或密钥已变化，已丢弃旧模型列表，请重新获取'); return; }
          this.apiModels = {source, ids}; e.error = ''; this.toast('已获取 ' + ids.length + ' 个模型，请选择完整 ID 后测试连接');
        } finally { this.modelLoading = false; this.render(); }
        return;
      } else if (action === 'api-save' || action === 'api-test') {
        const profile = {base_url: v.base_url.trim(), model: v.model.trim(), key: v.key.trim(), timeout_sec: number('timeout_sec', 5, 300), max_input_chars: number('max_input_chars', 1000, 200000),
          max_output: Math.floor(number('max_output', 128, 16000)), segment_output: Math.floor(number('segment_output', 512, 32000)), analysis_output: Math.floor(number('analysis_output', 512, 32000)),
          detect_prompt: v.detect_prompt.trim(), segment_prompt: v.segment_prompt.trim(), analysis_prompt: v.analysis_prompt.trim(), analysis_merge_prompt: v.analysis_merge_prompt.trim(), json_mode: v.json_mode, no_thinking: v.no_thinking};
        await e.updateSettings({profile, remember_key: v.remember_key, segment_model: v.segment_model.trim(), auto_detect: v.auto_detect,
          wait_ms: number('wait_ms', 0, 15000), batch_size: Math.floor(number('batch_size', 1, 32)), max_batches: Math.floor(number('max_batches', 1, 64))});
        if (action === 'api-test') { const result = await e.client.call(profile, [{role: 'user', content: '只输出 JSON：{"ok":true}'}], {max_tokens: 128}); C.assert(result.ok === true, '服务响应未通过 JSON 测试'); e.error = ''; e.saveSettings(); this.toast('聊天接口测试通过'); }
        delete this.forms.api;
      } else if (action === 'prompts-reset') { const p = e.defaultPrompts(); Object.assign(this.forms.api, {detect_prompt: p.detect, segment_prompt: p.segment, analysis_prompt: p.analysis, analysis_merge_prompt: p.merge}); this.render(false); this.toast('默认提示词已填入，请保存 API 设置'); return; }
      else if (action === 'options-save') await e.updateSettings({quick_options: v.quick_options});
      else if (action === 'launcher-reset') { e.settings.launcher_position = null; e.saveSettings(); this.applyLauncherPosition(); }
      else if (action === 'book-save') await e.saveBook(v.book_save.trim());
      else if (action === 'book-load') { C.assert(v.book_load, '请选择世界书'); const data = await e.loadBook(v.book_load, v.book_project || undefined); this.bookProjects = data.projects; this.nodeId = ''; this.eventId = ''; this.forms = {}; }
      else if (action === 'project-meta') await e.editProject(p => { p.title = v.project_title; p.premise = v.premise; });
      else if (action === 'project-new') {
        const nodeId = C.id('N'); await e.setProject({id: C.id('story'), title: '新剧本', start_node_id: nodeId, nodes: [{id: nodeId, title: '开场', guidance: '', routes: [], effects: []}], events: [], variables: [], collections: []}); this.nodeId = ''; this.eventId = ''; this.forms = {};
      } else if (action === 'open-segment') { this.tab = 'data'; this.render(); this.shadow.querySelector('[name="original_text"]').focus(); return; }
      else if (action === 'open-analysis') { this.tab = 'analysis'; this.render(); this.shadow.querySelector('[name="analysis_text"]').focus(); return; }
      else if (action === 'analysis-run') { const draft = await e.analyze(v.analysis_text, v.analysis_wish, v.analysis_mode); this.forms.analysis.analysis_draft = json(draft.project); }
      else if (action === 'analysis-cancel') { e.client.cancel(); return; }
      else if (action === 'analysis-export') { this.download({type: 'bse_project', version: 1, project: C.normalizeProject(C.parseJSON(v.analysis_draft, '分析草稿'))}, 'analysis-draft.json'); return; }
      else if (action === 'analysis-apply') { if (!this.win.confirm('把分析草稿作为新剧本打开？原剧本会保留在世界书或草稿中。')) return; await e.setProject(C.parseJSON(v.analysis_draft, '分析草稿')); delete e.settings.analysis_draft; e.saveSettings(); this.forms = {}; this.nodeId = ''; this.eventId = ''; }
      else if (action === 'segment') { const draft = await e.segment(v.original_text, v.segment_wish); this.forms.data.segment_draft = json(draft.project); }
      else if (action === 'segment-apply') { C.assert(this.win.confirm('把整理草稿作为新剧本打开？当前剧本会保留在原世界书或草稿中。'), '已取消应用'); await e.setProject(C.parseJSON(v.segment_draft, '拆分草稿')); delete e.settings.segment_draft; e.saveSettings(); this.forms = {}; this.nodeId = ''; this.eventId = ''; }
      else if (action === 'original-save') await e.editProject(p => { p.original_text = v.original_text; });
      else if (action === 'definitions-save') await e.editProject(p => { p.variables = C.parseJSON(v.variables, '变量'); p.collections = C.parseJSON(v.collections, '收集项'); });
      else if (action === 'injection-save') await e.updateSettings({depth: Math.floor(number('depth', 0, 100)), detail: v.detail});
      else if (action === 'project-json-save') { await e.setProject(C.parseJSON(v.project_json, '剧本')); this.forms = {}; this.nodeId = ''; this.eventId = ''; }
      else if (action === 'draft-load') { await e.setProject(e.settings.drafts[b.dataset.id]); this.forms = {}; this.nodeId = ''; this.eventId = ''; }
      else if (action === 'export-project') this.download(e.exportProject(), e.project.id + '.json');
      else if (action === 'export-progress') this.download(e.exportProgress(), e.project.id + '-progress.json');
      else if (action === 'import') { this.shadow.querySelector('.file').click(); return; }
      else if (action === 'reset') { C.assert(this.win.confirm('重置当前聊天的本剧本进度？建议先备份进度。'), '已取消重置'); e.invalidate(); e.state = C.createProgress(e.project); e.save(); }
      this.render(false); this.toast('已完成');
    }
    download(data, filename) {
      const url = this.win.URL.createObjectURL(new this.win.Blob([json(data)], {type: 'application/json'})); const link = this.doc.createElement('a'); link.href = url; link.download = filename; this.doc.body.appendChild(link); link.click(); link.remove(); this.win.setTimeout(() => this.win.URL.revokeObjectURL(url), 1000);
    }
    destroy() {
      this.unsub?.(); clearTimeout(this.toastTimer); this.doc.removeEventListener('keydown', this.keyHandler);
      this.win.removeEventListener('resize', this.viewportHandler); this.win.visualViewport?.removeEventListener('resize', this.viewportHandler); this.win.visualViewport?.removeEventListener('scroll', this.viewportHandler); this.win.removeEventListener('scroll', this.quickScroll, true); this.composerObserver?.disconnect(); this.composerResize?.disconnect(); this.quickElement?.remove(); this.element?.remove();
    }
  }
  return {Panel};
});
