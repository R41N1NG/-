(function (root, factory) {
  const value = factory(typeof window === 'undefined' ? require('./core.js') : root.BSECore, typeof window === 'undefined' ? require('./flow.js') : root.BSEFlow, typeof window === 'undefined' ? require('./graph.js') : root.BSEGraph);
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = value; else root.BSEUI = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C, F, G) {
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
    .graph-viewport{max-width:100%;max-height:480px;overflow:auto;border:1px solid var(--line);border-radius:12px;background:#0c1320;overscroll-behavior:contain}.graph-viewport svg{display:block;max-width:none}.graph-node{cursor:pointer}.graph-node:focus rect{stroke:#e7ecf6;stroke-width:4}.section-nav{position:sticky;top:-1px;z-index:3;display:flex;gap:6px;overflow:auto;flex-wrap:nowrap;padding:8px;background:#101827f5;border:1px solid var(--line);border-radius:12px;margin-bottom:14px;scrollbar-width:thin}.section-nav button{flex:0 0 auto;padding:7px 12px}.section-target{scroll-margin-top:76px}.compact-note{border-left:3px solid var(--accent);padding:8px 12px;background:#20352d}.analysis-meter{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:13px}.subnav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.subnav .active{border-color:var(--accent);color:var(--accent)}.package-nodes{max-height:240px;overflow:auto}.package-nodes label{margin:0}.graph-detail{overflow-wrap:anywhere}
    .spoiler-box{max-height:100%;overflow-y:auto;overscroll-behavior:contain}
    .launcher{width:48px;height:48px;padding:12px;border-radius:50%;touch-action:none;user-select:none;display:grid;place-items:center;cursor:grab}.launcher.dragging{cursor:grabbing}.launcher svg{pointer-events:none}.panel{position:relative}.panel-body{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0}.spoiler-region{position:relative;min-width:0}.spoiler-region.locked{height:clamp(240px,calc(var(--bse-height,100dvh) - 330px),560px);overflow:hidden}.spoiler-content.locked{filter:blur(10px);pointer-events:none;user-select:none}.spoiler-layer{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;padding:16px;background:#10182780}.spoiler-box{width:min(430px,100%);padding:20px;border:1px solid var(--line);background:#141c2cf5;border-radius:16px;text-align:center;box-shadow:0 10px 36px #0008}.spoiler-box h2{margin:8px 0}.lock-icon{font-size:38px;display:block}.spoiler-box .row{justify-content:center}.header-actions{display:flex;gap:8px}.analysis-report li{overflow-wrap:anywhere}.analysis-report ul{padding-left:20px}.event-guide ol{padding-left:22px}.event-guide li{margin:6px 0}
  `;
  const LIBRARY_STYLE = `.project-switcher{display:flex;gap:8px;align-items:center;padding:8px 16px;border-bottom:1px solid #33415b;flex:none}.project-switcher label{display:flex;gap:8px;align-items:center;min-width:0;flex:1;font-size:13px;color:#a8b3ca}.project-switcher select{flex:1;min-width:0;max-width:100%;margin:0}.project-switcher button{flex:none}.library-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:12px}.library-item h3{overflow-wrap:anywhere}.library-item .row{flex-wrap:wrap}@media(max-width:480px){.project-switcher{padding:6px 10px}.project-switcher label{gap:5px;font-size:12px}.project-switcher button{padding:8px}}`;
  const QUICK_STYLE = `:host{display:block;color:#e7ecf6;font:14px/1.5 system-ui,-apple-system,sans-serif;color-scheme:dark}:host([hidden]){display:none!important}*{box-sizing:border-box}[hidden]{display:none!important}.quick{padding:5px 8px;background:#141c2cf5;border:1px solid #40516a;border-radius:12px;max-height:42dvh;overflow:auto;scrollbar-width:thin}.quick-header{display:flex;align-items:center;gap:5px}.quick-title{flex:1;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quick-title small{display:block;color:#b8c5da}.quick-list{display:flex;flex-wrap:wrap;gap:8px;max-height:160px;overflow:auto;padding:7px 0 2px;overscroll-behavior:contain;scrollbar-width:thin}button{font:inherit;min-width:44px;min-height:44px;padding:8px 10px;color:#e7ecf6;background:#26344b;border:1px solid #588b79;border-radius:10px;cursor:pointer;touch-action:manipulation}button:disabled{opacity:.5;cursor:default}.quick-icon{flex:none;font-size:18px;padding:6px;position:relative}.quick-dot{position:absolute;right:4px;top:4px;width:7px;height:7px;background:#f0bf69;border-radius:50%}.bse-choice{flex:0 1 auto;max-width:100%;background:#263c34;text-align:left;overflow-wrap:anywhere}.bse-choice:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid #9ce4cf;outline-offset:2px}.quick-menu{border-top:1px solid #40516a;margin-top:5px;padding-top:7px;max-height:200px;overflow:auto;overscroll-behavior:contain}.quick-tools{display:flex;gap:7px;flex-wrap:wrap}.quick-note,.empty{color:#a8b3ca;font-size:12px;margin:5px 0}.quick-pending{padding:7px;border:1px solid #40516a;border-radius:8px;margin:6px 0}.quick-pending p{margin:4px 0;overflow-wrap:anywhere}.acquired{border-bottom:1px solid #40516a;padding:4px 0}.acquired summary{cursor:pointer;min-height:44px;display:flex;align-items:center;overflow-wrap:anywhere}.acquired p{margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere}.quick-warn{color:#f0bf69}`;
  class Panel {
    constructor(engine) { this.e = engine; this.doc = engine.host.doc(); this.win = this.doc.defaultView; this.tab = 'run'; this.nodeTab = 'nodes'; this.recordsTab = 'progress'; this.sectionPositions = {}; this.opened = false; this.unlocked = false; this.runUnlocked = false; this.recordUnlocked = false; this.spoilerPrompt = false; this.privacyProject = ''; this.forms = {}; this.details = {}; this.search = {}; this.nodeId = ''; this.eventId = ''; this.packageId = ''; this.graphSelected = ''; this.variableId = ''; this.resultId = ''; this.quickMenu = ''; this.listPage = 0; this.bookProjects = []; this.unsub = null; }
    mount() {
      const previous = this.doc.getElementById('bse-panel-host')?.__bsePanelOwner;
      if (previous?.e) { const stop = previous.e.destroy.bind(previous.e); let stopped = false; previous.e.destroy = ()=>{if (stopped) return;stopped=true;stop();}; }
      previous?.destroy(); previous?.e?.destroy();
      this.doc.getElementById('bse-panel-host')?.remove();
      this.element = this.doc.createElement('div'); this.element.id = 'bse-panel-host'; this.element.style.cssText = 'position:relative;z-index:2147482000';
      this.element.__bsePanelOwner = this;
      this.shadow = this.element.attachShadow({mode: 'open'});
      this.shadow.innerHTML = `<style>${STYLE}${EXTRA_STYLE}${LIBRARY_STYLE}</style><button class="launcher" type="button" aria-label="打开剧情面板" title="剧本 · 拖动可移动">${PENCIL}</button><div class="overlay" hidden><section class="panel" role="dialog" aria-modal="true" aria-label="分支剧本管理"><header><div><h1>分支剧本</h1><small>剧情、事件与进度 · v${this.e.version}</small></div><button type="button" data-action="close" aria-label="关闭剧情面板">关闭</button></header><div class="panel-body"><nav aria-label="剧情面板页面"></nav><div class="project-switcher"></div><main></main><footer>完整素材留在酒馆，当前剧情按需注入。</footer></div><div class="toast" role="status" hidden></div></section></div><input class="file" type="file" accept=".json,application/json">`;
      this.doc.body.appendChild(this.element);
      this.mountLauncher(); this.mountQuick();
      this.shadow.addEventListener('change', ev => {
        if (this.rendering) return;
        if (ev.target.name === 'project_switch') this.run(async ()=>{this.capture();this.saveEditors();await this.e.switchProject(ev.target.value);});
        else if (ev.target.closest('form')?.dataset.form !== 'api' && ev.target.name) {this.capture();this.saveEditors();}
      });
      this.shadow.addEventListener('click', ev => { const b = ev.target.closest?.('[data-action]'); if (b && !b.disabled) this.run(() => this.action(b.dataset.action, b)); });
      this.shadow.addEventListener('submit', ev => ev.preventDefault());
      this.shadow.addEventListener('input', ev => { if (ev.target.name === 'library_search') {this.capture();this.render(false);} if (ev.target.name === 'analysis_text') { const counter = this.shadow.querySelector('[data-analysis-count]'); if (counter) counter.textContent = '原文：' + ev.target.value.length.toLocaleString() + ' 字符'; } });
      this.shadow.addEventListener('change', ev => {
        const name = ev.target.name;
        if (name === 'analysis_text') { const count = this.shadow.querySelector('[data-analysis-count]'); if (count) count.textContent = '原文：' + ev.target.value.length.toLocaleString() + ' 字符'; }
        if (name === 'node_search' || name === 'event_search' || name === 'package_search') { this.capture(); this.search[name] = ev.target.value; this.listPage = 0; this.render(); }
        else if (name === 'graph_filter') { this.capture(); this.graphSelected = ''; this.render(false); }
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
      this.shadow.querySelector('.file').onchange = async ev => { const field = ev.target, file = field.files[0]; if (file) await this.run(async () => { const data = C.parseJSON(await file.text(), '导入文件'); C.assert(data.type !== 'script', '这是插件安装文件，请在酒馆助手脚本管理中导入；此处导入的是剧本内容'); if (data.type === 'bse_progress') this.e.importProgress(data); else await this.e.setProject(data.project || data); this.nodeId = ''; this.eventId = ''; this.render(false); this.toast('导入完成'); }); field.value = ''; };
      this.keyHandler = ev => { if (ev.altKey && ev.key.toLowerCase() === 'b') { ev.preventDefault(); this.toggle(); } else if (ev.key === 'Escape' && !this.opened && this.quickMenu) { this.quickMenu = ''; this.renderQuick(); this.quickShadow.querySelector('[data-action="quick-gear"]')?.focus(); } else if (ev.key === 'Escape' && this.opened) { if (this.spoilerPrompt) this.cancelUnlock(); else this.close(); } };
      this.doc.addEventListener('keydown', this.keyHandler);
      this.shadow.addEventListener('keydown', ev => {
        if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest?.('[data-action="graph-node"]')) { ev.preventDefault(); this.run(() => this.action('graph-node', ev.target.closest('[data-action="graph-node"]'))); return; }
        if (!this.opened || ev.key !== 'Tab') return;
        const scope = this.spoilerPrompt ? this.shadow.querySelector('.spoiler-layer') : this.shadow.querySelector('.panel');
        const targets = [...scope.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,summary,[tabindex="0"]')].filter(el => el.getClientRects().length && !el.closest('[inert]'));
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
    launcherBounds() { const v = this.win.visualViewport; const left = (v?.offsetLeft || 0) + 8, top = (v?.offsetTop || 0) + 8, dockTop = !this.quickElement?.hidden && this.quickDock?.element.getBoundingClientRect().top; return {left, top, right: Math.max(left, left + (v?.width || this.win.innerWidth) - 64), bottom: Math.max(top, Math.min(top + (v?.height || this.win.innerHeight) - 64, dockTop ? dockTop - 64 : Infinity))}; }
    applyLauncherPosition() {
      const launcher = this.shadow?.querySelector('.launcher'); if (!launcher) return;
      const p = this.e.settings.launcher_position;
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        launcher.style.removeProperty('left'); launcher.style.removeProperty('top'); launcher.style.removeProperty('right');
        if (!this.quickElement?.hidden && this.quickDock) launcher.style.bottom = 'calc(' + Math.max(84, this.win.innerHeight - this.quickDock.element.getBoundingClientRect().top + 8) + 'px + env(safe-area-inset-bottom,0px))'; else launcher.style.removeProperty('bottom'); return;
      }
      const b = this.launcherBounds(); launcher.style.left = (b.left + Math.max(0, Math.min(1, p.x)) * (b.right - b.left)) + 'px'; launcher.style.top = (b.top + Math.max(0, Math.min(1, p.y)) * (b.bottom - b.top)) + 'px'; launcher.style.right = 'auto'; launcher.style.bottom = 'auto';
    }
    mountQuick() {
      this.doc.getElementById('bse-quick-host')?.remove();
      this.quickElement = this.doc.createElement('div'); this.quickElement.id = 'bse-quick-host'; this.quickElement.hidden = true;
      this.quickElement.style.cssText = 'position:absolute;left:0;right:0;top:0;z-index:10;max-width:100%;';
      this.quickShadow = this.quickElement.attachShadow({mode: 'open'}); this.doc.body.appendChild(this.quickElement);
      this.quickShadow.addEventListener('click', ev => { const b = ev.target.closest?.('[data-action]'); if (b && !b.disabled) this.run(() => this.action(b.dataset.action, b)); });
      if (this.win.ResizeObserver) { this.composerResize = new this.win.ResizeObserver(() => this.refreshComposer()); this.quickResize = new this.win.ResizeObserver(() => this.positionQuick()); this.quickResize.observe(this.quickElement); }
      this.composerObserver = new this.win.MutationObserver(records => {
        if (!records.some(r => r.target !== this.quickElement && r.target !== this.element) || this.quickFrame) return;
        this.quickFrame = this.win.requestAnimationFrame(() => { this.quickFrame = null; this.refreshComposer(); });
      });
      this.composerObserver.observe(this.doc.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden']});
      this.quickScroll = () => this.positionQuick(); this.win.addEventListener('scroll', this.quickScroll, true);
    }
    findComposer() {
      const candidates = [...this.doc.querySelectorAll('#send_form, #send_textarea, #chatinput, textarea[name="send_textarea"]')];
      return candidates.find(el => { const r = el.getBoundingClientRect(); return r.width && r.height && this.win.getComputedStyle(el).visibility !== 'hidden'; }) || candidates[0] || null;
    }
    findInput() { return [...this.doc.querySelectorAll('#send_textarea, #chatinput, textarea[name="send_textarea"]')].find(el => el.getClientRects().length && this.win.getComputedStyle(el).visibility !== 'hidden') || null; }
    refreshComposer() { if (this.findComposer() !== this.composer) this.renderQuick(); else this.positionQuick(); }
    releaseQuickDock() {
      const d = this.quickDock; if (!d) return;
      if (d.chat && d.chat.style.getPropertyValue('max-height') === d.appliedChatHeight) {
        if (d.chatHeight.value) d.chat.style.setProperty('max-height', d.chatHeight.value, d.chatHeight.priority); else d.chat.style.removeProperty('max-height');
      }
      for (const [name, original, applied] of [['padding-top', d.padding, d.appliedPadding], ['position', d.position, d.appliedPosition]]) if (applied && d.element.style.getPropertyValue(name) === applied) {
        if (original.value) d.element.style.setProperty(name, original.value, original.priority); else d.element.style.removeProperty(name);
      }
      this.quickDock = null;
    }
    dockQuick(composer) {
      const container = composer?.matches('form, #send_form') ? composer : composer?.closest('form') || composer?.parentElement;
      if (!container || container === this.doc.body) return null;
      if (this.quickDock?.element === container) return container;
      const clones = [...container.querySelectorAll('#bse-quick-host')].filter(x => x !== this.quickElement);
      if (clones.length && this.quickDock) {
        const d = this.quickDock;
        for (const [name, original, applied] of [['padding-top', d.padding, d.appliedPadding], ['position', d.position, d.appliedPosition]]) if (applied && container.style.getPropertyValue(name) === applied) {
          if (original.value) container.style.setProperty(name, original.value, original.priority); else container.style.removeProperty(name);
        }
      }
      clones.forEach(x => x.remove());
      this.releaseQuickDock();
      const saved = name => ({value: container.style.getPropertyValue(name), priority: container.style.getPropertyPriority(name)});
      const d = this.quickDock = {element: container, padding: saved('padding-top'), position: saved('position'), basePadding: parseFloat(this.win.getComputedStyle(container).paddingTop) || 0};
      if (this.win.getComputedStyle(container).position === 'static') { d.appliedPosition = 'relative'; container.style.setProperty('position', d.appliedPosition); }
      container.prepend(this.quickElement); return container;
    }
    renderQuick() {
      if (!this.quickElement) return;
      const composer = this.findComposer();
      if (composer !== this.composer) { this.composerResize?.disconnect(); this.composer = composer; if (composer) this.composerResize?.observe(composer); }
      const e = this.e, p = e.project, s = e.state, node = p.nodes.find(n => n.id === s.current_node_id), routes = e.quickRoutes();
      const pending = s.pending_checks.flatMap(c => c.results.filter(r => !r.handled && ['completed', 'uncertain'].includes(r.status)).map(r => ({...r, key: c.key})));
      const stagePending = !s.completed_node_ids.includes(node?.id) && ['completed', 'uncertain'].includes(s.stage_progress?.status);
      const obtained = C.obtainedResults(p, s), blocked = e.diagnostics().some(x => x.severity === 'error');
      const signature = json({routes, enabled: e.settings.enabled, paused: s.paused, collapsed: e.settings.quick_collapsed, menu: this.quickMenu, choice: e.pendingChoice, node: node?.id, done: s.completed_node_ids.includes(node?.id), pending, stagePending, obtained, busy: e.busy, blocked});
      this.availableQuickRoutes = routes;
      if (signature !== this.quickSignature) {
        this.quickSignature = signature;
        const ready = e.settings.enabled && !s.paused && !e.busy;
        const state = e.busy ? '辅助核验中…' : !e.settings.enabled ? blocked ? '未启用：存在依赖问题' : '未启用' : s.paused ? '已暂停' : s.completed_node_ids.includes(node?.id) ? '阶段已完成' : routes.length + ' 个可选行动';
        const gear = this.quickMenu === 'gear' ? `<div class="quick-menu" aria-label="剧情操作"><div class="quick-tools">${button(s.completed_node_ids.includes(node?.id) ? '阶段已完成' : '确认阶段完成', 'quick-complete', !ready || s.completed_node_ids.includes(node?.id) ? 'disabled' : '')}${button(e.busy ? '正在核验…' : '核验本轮', 'quick-check', ready ? '' : 'disabled')}${button(s.paused ? '继续' : '暂停', 'quick-pause', e.settings.enabled && !e.busy ? '' : 'disabled')}${button('查看后台面板', 'quick-panel')}</div>${stagePending ? '<p class="quick-note quick-warn">本阶段核验待玩家确认，可点击“确认阶段完成”。</p>' : ''}${pending.map(r => `<div class="quick-pending"><strong>${escape(p.events.find(x => x.id === r.event_id)?.title || r.event_id)}</strong><p>${r.status === 'uncertain' ? '判断不确定，请结合正文确认' : '已判定发生，等待确认结算'}</p>${r.evidence.map(x => `<p class="quick-note">“${escape(x.quote)}”</p>`).join('')}<div class="quick-tools">${button('确认发生', 'quick-accept', `data-key="${escape(r.key)}" data-id="${escape(r.event_id)}" ${ready ? '' : 'disabled'}`)}${button('忽略', 'quick-dismiss', `data-key="${escape(r.key)}" data-id="${escape(r.event_id)}" ${e.busy ? 'disabled' : ''}`)}</div></div>`).join('')}<p class="quick-note">确认完成会按配置结算本阶段；核验读取本轮玩家输入与选中回复。</p></div>` : '';
        const bag = this.quickMenu === 'bag' ? `<div class="quick-menu" aria-label="已获得内容">${this.obtainedMarkup(obtained)}<p class="quick-note">与后台完成记录同步，点击条目查看说明。</p></div>` : '';
        this.quickShadow.innerHTML = `<style>${QUICK_STYLE}</style><div class="quick" role="region" aria-label="剧情选项与当前阶段"><div class="quick-header"><div class="quick-title" title="${escape(node?.title || '')}">当前阶段：${escape(node?.title || '暂无')}<small class="${blocked ? 'quick-warn' : ''}">${escape(state)}</small></div>${button('🎒', 'quick-bag', `class="quick-icon" aria-label="查看已获得内容，共${obtained.length}项" aria-expanded="${this.quickMenu === 'bag'}"`)}<button type="button" class="quick-icon" data-action="quick-gear" aria-label="剧情操作${stagePending || pending.length ? '，有待确认事项' : ''}" aria-expanded="${this.quickMenu === 'gear'}">⚙️${stagePending || pending.length ? '<span class="quick-dot" aria-hidden="true"></span>' : ''}</button>${button(e.settings.quick_collapsed ? '▾' : '▴', 'quick-collapse', `class="quick-icon" aria-label="${e.settings.quick_collapsed ? '展开' : '收起'}剧情选项" aria-expanded="${!e.settings.quick_collapsed}"`)}</div><div class="quick-list" ${e.settings.quick_collapsed ? 'hidden' : ''}>${routes.map(r => `<button type="button" class="bse-choice" data-action="quick-enter" data-id="${escape(r.target)}" data-status="${escape(r.status)}" title="${escape(r.status)} · 选择此分支">${escape(r.label)}</button>`).join('')}${!routes.length ? `<span class="empty">${e.settings.enabled && !s.paused ? '暂无可选行动，可在 ⚙️ 中确认阶段或核验本轮。' : '可在 ⚙️ 中查看或恢复运行。'}</span>` : ''}${e.pendingChoice ? button('撤销待发送选择', 'quick-cancel') : ''}</div>${gear}${bag}</div>`;
      }
      this.positionQuick();
    }
    obtainedMarkup(items) {
      return items.map(x => `<details class="acquired"><summary>${escape(x.title)}（${escape(x.id)}）</summary><p>${escape(x.description || '尚未填写说明，可在后台结果定义中补充。')}</p><p class="muted quick-note">来源：${escape(x.source)}${x.at ? ' · ' + escape(new Date(x.at).toLocaleString()) : ''}</p></details>`).join('') || '<p class="empty">尚未获得内容</p>';
    }
    positionQuick() {
      if (!this.quickElement || this.destroyed) return;
      if (!this.element?.isConnected) { this.destroy(); return; }
      const composer = this.composer, r = composer?.isConnected ? composer.getBoundingClientRect() : null;
      const hidden = this.opened || !this.e.settings.quick_options || !r?.width || !r?.height || this.win.getComputedStyle(composer).visibility === 'hidden';
      if (this.quickElement.hidden !== hidden) this.quickElement.hidden = hidden;
      if (hidden) { this.releaseQuickDock(); this.applyLauncherPosition(); return; }
      const dock = this.dockQuick(composer); if (!dock) { this.quickElement.hidden = true; this.releaseQuickDock(); return; }
      const d = this.quickDock, padding = (d.basePadding + this.quickElement.getBoundingClientRect().height + 6) + 'px';
      if (dock.style.getPropertyValue('padding-top') !== padding) { d.appliedPadding = padding; dock.style.setProperty('padding-top', padding); }
      const chat = this.doc.getElementById('chat');
      if (chat && !chat.contains(dock)) {
        const cr = chat.getBoundingClientRect(), top = dock.getBoundingClientRect().top;
        if (d.chat || cr.bottom > top + 1) {
          if (!d.chat) { d.chat = chat; d.chatHeight = {value: chat.style.getPropertyValue('max-height'), priority: chat.style.getPropertyPriority('max-height')}; }
          const style = this.win.getComputedStyle(chat), inset = style.boxSizing === 'border-box' ? 0 : ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, k) => sum + (parseFloat(style[k]) || 0), 0);
          const height = Math.max(0, top - cr.top - 6 - inset) + 'px';
          if (chat.style.getPropertyValue('max-height') !== height) { d.appliedChatHeight = height; chat.style.setProperty('max-height', height); }
        }
      }
      this.applyLauncherPosition();
    }
    privacyUnlocked() { return this.tab === 'run' ? this.runUnlocked : this.tab === 'records' ? this.recordUnlocked : this.unlocked; }
    updatePrivacy() {
      const body = this.shadow.querySelector('.spoiler-content'), layer = this.shadow.querySelector('.spoiler-layer');
      if (!body || !layer) return;
      const unlocked = this.privacyUnlocked(), isRun = this.tab === 'run', isGraph = this.tab === 'records', label = isGraph ? '完成与解锁关系' : isRun ? '分支与状态' : '剧本节点';
      this.shadow.querySelector('.spoiler-region').classList.toggle('locked', !unlocked);
      body.classList.toggle('locked', !unlocked); body.inert = !unlocked; body.setAttribute('aria-hidden', String(!unlocked));
      this.shadow.querySelector('[data-action="spoiler-lock"]').hidden = !unlocked; layer.hidden = unlocked;
      const deleteButton = this.shadow.querySelector('[data-action="node-delete"]'); if (deleteButton) deleteButton.disabled = !unlocked;
      const warning = isGraph ? '关系图包含未来事件、结果与解锁前提，查看后可能影响游玩体验。确认后才显示箭头关系和完成状态。' : isRun ? '此区域包含尚未解锁的分支、解锁条件、收集记录和关系数值，查看后可能影响游玩体验。输入栏仍可显示当前可选的行动。' : '节点列表与事件包编辑区包含未来剧情、不同走向和结局，解锁后可能影响游玩体验。';
      layer.innerHTML = this.spoilerPrompt ? `<div class="spoiler-box" role="alertdialog" aria-labelledby="bse-spoiler-title" aria-describedby="bse-spoiler-warning"><span class="lock-icon">🔒</span><h2 id="bse-spoiler-title">确认查看${label}？</h2><p id="bse-spoiler-warning">${warning}</p><div class="row">${button('取消，继续隐藏', 'unlock-cancel')}${button('确认解锁', 'unlock-confirm', 'class="primary"')}</div></div>` : `<div class="spoiler-box"><button type="button" data-action="unlock-ask" aria-label="解锁${label}"><span class="lock-icon">🔒</span>${label}已隐藏</button><p class="muted">点击锁图标查看剧透提醒，其他区域可照常使用。</p></div>`;
    }
    cancelUnlock() { this.spoilerPrompt = false; this.updatePrivacy(); this.shadow.querySelector('[data-action="unlock-ask"]')?.focus(); }
    capture() {
      const form = this.shadow?.querySelector('form'); if (!form) return;
      const fields = {}; for (const el of form.elements) if (el.name) fields[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      this.forms[form.dataset.form] = fields;
    }
    saveEditors() {
      if (!this.formProject || !this.e.settings.project_id) return;
      const forms = Object.fromEntries(Object.entries(this.forms).filter(([key])=>key !== 'api'));
      this.e.settings.project_editors ||= {};
      this.e.settings.project_editors[this.formProject] = C.clone({forms,details:this.details});
      this.e.saveSettings();
    }
    values(key) { this.capture(); return this.forms[key] || {}; }
    restore(form) {
      const data = this.forms[form.dataset.form]; if (!data) return;
      for (const el of form.elements) if (el.name && Object.prototype.hasOwnProperty.call(data, el.name)) { if (el.type === 'checkbox') el.checked = data[el.name]; else el.value = data[el.name]; }
    }
    render(capture = true) {
      if (!this.shadow || this.rendering) return; if (capture) this.capture();
      this.rendering = true; try {
      if (this.formProject !== this.e.project.id) {
        this.saveEditors(); const api = this.forms.api, editor = this.e.settings.project_editors?.[this.e.project.id];
        this.forms = {...C.clone(editor?.forms || {}), ...(api ? {api} : {})}; this.details = C.clone(editor?.details || {});
        this.formProject = this.e.project.id; this.nodeId = ''; this.eventId = ''; this.packageId = ''; this.listPage = 0;
      }
      const privacyKey = this.e.project.id + '/' + this.e.chat;
      if (this.privacyProject !== privacyKey) { this.privacyProject = privacyKey; this.unlocked = false; this.runUnlocked = false; this.recordUnlocked = false; this.spoilerPrompt = false; this.graphSelected = ''; }
      const oldForm = this.shadow.querySelector('form');
      if (oldForm) this.details[oldForm.dataset.form] = [...oldForm.querySelectorAll('details[open]')].map(d => d.querySelector('summary')?.textContent);
      const active = this.shadow.activeElement; const focusName = active?.name; const focusAction = active?.dataset?.action; const selection = active?.selectionStart;
      const scroll = this.shadow.querySelector('main').scrollTop;
      const graphScroll = this.shadow.querySelector('.graph-viewport'); const graphPosition = graphScroll ? [graphScroll.scrollLeft, graphScroll.scrollTop] : [0, 0];
      const tabs = [['run', '运行'], ['nodes', '剧本'], ['events', '事件'], ['records', '记录'], ['api', 'API'], ['analysis', '分析'], ['data', '数据']];
      this.shadow.querySelector('nav').innerHTML = tabs.map(([key, title]) => button(title, 'tab', `data-tab="${key}" class="${this.tab === key ? 'active' : ''}" aria-current="${this.tab === key ? 'page' : 'false'}"`)).join('');
      this.shadow.querySelector('.project-switcher').innerHTML = `<label>当前剧本<select name="project_switch" aria-label="切换当前剧本" ${this.e.busy ? 'disabled' : ''}>${this.e.projectList().map(p=>`<option value="${escape(p.id)}" ${p.current ? 'selected' : ''}>${escape(p.title)}</option>`).join('')}</select></label>${button('剧本库','library-open')}`;
      const body = ({run: () => this.runPage(), nodes: () => this.nodesPage(), events: () => this.eventsPage(), records: () => this.recordsPage(), api: () => this.apiPage(), analysis: () => this.analysisPage(), data: () => this.dataPage()}[this.tab])();
      this.shadow.querySelector('main').innerHTML = (this.e.error ? `<div class="warn error" role="alert" style="white-space:pre-wrap">${escape(this.e.error)}</div>` : '') + body;
      const form = this.shadow.querySelector('form'); if (form) this.restore(form);
      if (form) for (const d of form.querySelectorAll('details')) d.open = (this.details[form.dataset.form] || []).includes(d.querySelector('summary')?.textContent);
      this.shadow.querySelector('main').scrollTop = scroll;
      const nextGraph = this.shadow.querySelector('.graph-viewport'); if (nextGraph) [nextGraph.scrollLeft, nextGraph.scrollTop] = graphPosition;
      this.organizeSections();
      this.updatePrivacy(); this.applyLauncherPosition(); this.renderQuick();
      if (this.opened && !this.privacyUnlocked() && focusAction?.startsWith('unlock-')) this.shadow.querySelector(`[data-action="${this.spoilerPrompt ? (focusAction === 'unlock-confirm' ? 'unlock-confirm' : 'unlock-cancel') : 'unlock-ask'}"]`)?.focus();
      if ((this.tab !== 'nodes' || this.unlocked) && focusName && form) {
        const el = Array.from(form.elements).find(x => x.name === focusName);
        if (el) { el.focus({preventScroll: true}); if (typeof selection === 'number' && el.setSelectionRange) try { el.setSelectionRange(selection, selection); } catch {} }
      }
      } finally {this.rendering = false;}
    }
    organizeSections() {
      if (!['analysis', 'data', 'api', 'records'].includes(this.tab)) return;
      const main = this.shadow.querySelector('main'), form = main.querySelector('form'), parent = form || main;
      if (this.tab === 'analysis') { const recovery = parent.querySelector('[name="analysis_response"]')?.closest('details'); if (recovery) { const box = this.doc.createElement('div'); box.className = 'card recovery-section'; box.innerHTML = '<h2>恢复后台结果</h2>'; box.append(recovery); parent.append(box); } }
      const sections = [...parent.children].filter(el => el.matches('.card, details') && !el.classList.contains('error'));
      if (sections.length < 2) return;
      const nav = this.doc.createElement('div'); nav.className = 'section-nav'; nav.setAttribute('role', 'navigation'); nav.setAttribute('aria-label', '本页功能导航');
      nav.innerHTML = sections.map((el, i) => {
        el.dataset.section = String(i); el.classList.add('section-target');
        const title = el.querySelector('h2, h3, summary')?.textContent || '功能' + (i + 1);
        return button(title.replace('（可选模型功能）', '').replace('实际发送给辅助 API 的', '').replace('长文本分析为新剧本', '开始分析'), 'section-jump', `data-section="${i}"`);
      }).join('');
      main.prepend(nav);
    }
    async run(fn) { try { await fn(); } catch (e) { this.e.report(e); this.toast(e.message, true); } }
    toast(text, error = false) { const el = this.shadow.querySelector('.toast'); el.textContent = text; el.hidden = false; el.style.background = error ? '#592a31' : '#21473b'; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { el.hidden = true; }, 4000); }
    toggle() { if (this.opened) return this.close(); this.opened = true; this.oldFocus = this.doc.activeElement; this.shadow.querySelector('.overlay').hidden = false; this.render(); this.shadow.querySelector(['nodes', 'run'].includes(this.tab) && !this.privacyUnlocked() ? '[data-action="unlock-ask"]' : '[data-action="close"]').focus(); }
    close() { this.capture(); this.saveEditors(); this.opened = false; this.spoilerPrompt = false; this.shadow.querySelector('.overlay').hidden = true; this.renderQuick(); this.oldFocus?.focus?.(); }
    runPage() {
      const e = this.e; const p = e.project; const s = e.state; const refs = C.indexProject(p); const node = refs.nodes.get(s.current_node_id);
      return `<div class="card"><div class="row spread"><div><h2>${escape(p.title)}</h2><span class="badge">${e.settings.enabled ? s.paused ? '已暂停' : '运行中' : '未启用'}</span> <span class="muted">${e.settings.worldbook ? '世界书：' + escape(e.settings.worldbook) : '草稿暂存在脚本变量，建议写入世界书'}</span></div>${button(e.settings.enabled ? '关闭注入' : '启用剧本', 'toggle-enabled', 'class="primary"')}</div></div>
      <div class="card"><h2>${escape(node.title)}</h2><p style="white-space:pre-wrap">${escape(e.settings.detail ? node.detail || node.guidance : node.guidance || node.detail)}</p>${node.boundary ? `<p class="muted">${escape(node.boundary)}</p>` : ''}<div class="row">${button(s.completed_node_ids.includes(node.id) ? '本节点已完成' : '确认完成本节点', 'complete', s.completed_node_ids.includes(node.id) ? 'disabled' : 'class="primary"')}${button(s.paused ? '继续' : '暂停', 'pause')}${button('回退上次操作', 'undo', s.history.length ? '' : 'disabled')}${button('确认此回复并识别事件', 'check', e.busy ? 'disabled' : '')}${node.completion_criteria ? button('重新核验阶段进展', 'stage-check', e.busy ? 'disabled' : '') : ''}</div><p class="muted">${escape(e.flowNotice || (node.completion_criteria ? '选择行动后发送，辅助 API 核验实际完成后才结算。' : '当前节点未配置完成标准，可在剧本页配置或手动确认完成。'))}</p><p class="muted">完成节点会执行配置的收集和变量效果；进入出口不会自动完成当前节点。</p></div>
      <div class="card"><div class="row spread"><h3>输入栏行动选项：${e.settings.quick_options ? '已开启' : '已关闭'}</h3>${button(e.settings.quick_options ? '关闭输入栏选项' : '显示输入栏选项', 'quick-toggle')}</div><p class="muted">关闭此面板后，输入栏小面板显示当前阶段和可用行动；⚙️收纳确认、核验与暂停，🎒查看已获得内容，收起后保留入口。</p></div>
      <div class="row">${button('🔒 隐藏分支与状态', 'spoiler-lock')}</div><div class="run-spoiler spoiler-region"><div class="run-spoiler-content spoiler-content"><div class="card"><h2>接下来的分支</h2>${node.routes.length ? node.routes.map(r => `<div class="card route"><div><strong>${escape(r.label || refs.nodes.get(r.target).title)}</strong><div class="muted">${escape(conditionSummary(r.condition, p))}</div></div>${button(C.condition(r.condition, s) ? '进入分支' : '尚未解锁', 'enter', `data-id="${escape(r.target)}" ${C.condition(r.condition, s) ? '' : 'disabled'}`)}</div>`).join('') : '<p class="empty">此节点没有出口，可以在剧本页添加。</p>'}</div>
      <div class="grid"><div class="card"><h3>已收集</h3>${s.collected_ids.length ? s.collected_ids.map(k => `<span class="badge">${escape(refs.collections.get(k) || k)}</span> `).join('') : '<p class="empty">暂无收集项</p>'}</div><div class="card"><h3>关系与状态</h3>${p.variables.map(v => `<div class="kv"><span>${escape(v.title || v.id)}</span><strong>${escape(s.variables[v.id])}</strong></div>`).join('') || '<p class="empty">可在数据页定义好感度等变量。</p>'}</div></div></div><div class="spoiler-layer"></div></div>`;
    }
    list(items, key, selected, label) {
      const q = (this.search[key + '_search'] || '').toLowerCase();
      const filtered = items.filter(n => (n.title + ' ' + n.id).toLowerCase().includes(q));
      const pages = Math.max(1, Math.ceil(filtered.length / 20)); this.listPage = Math.min(this.listPage, pages - 1);
      return `<div class="card"><h3>${label} <span class="muted">${items.length}</span></h3>${input('搜索名称或编号', key + '_search', q)}<div class="stack">${filtered.slice(this.listPage * 20, this.listPage * 20 + 20).map(n => button(n.title, key + '-select', `class="${n.id === selected ? 'selected' : ''}" data-id="${escape(n.id)}"`)).join('')}</div><div class="row pagination">${button('上一页', 'list-prev', this.listPage ? '' : 'disabled')}<span class="muted">${this.listPage + 1}/${pages}</span>${button('下一页', 'list-next', this.listPage < pages - 1 ? '' : 'disabled')}</div></div>`;
    }
    conditionHelper(prefix) {
      const numbers = prefix === 'event' ? `<details><summary>生成数值前置条件</summary>${select('数值载体', 'event_variable', this.e.project.variables.filter(x => x.type === 'number').map(x => [x.id, (x.owner ? x.owner + ' · ' : '') + x.title]), '')}${select('比较', 'event_op', [['gte', '大于等于'], ['gt', '大于'], ['lte', '小于等于'], ['lt', '小于'], ['eq', '等于']], 'lt')}${input('数值', 'event_value', 70, 'number')}${button('加入事件前置条件', 'event-number-condition')}</details>` : '';
      return numbers + `<details><summary>用收集项生成条件</summary><div class="grid">${input('必须拥有（ID，逗号分隔）', prefix + '_all', '')}${input('必须没有（ID，逗号分隔）', prefix + '_not', '')}</div>${button('生成条件 JSON', 'make-condition', `data-prefix="${prefix}"`)}<p class="muted">复杂条件支持 all、any、not、completed、visited、event_completed 和 variable。生成后可继续编辑。</p></details>`;
    }
    nodesPage() {
      const subnav = `<div class="subnav">${button('剧本库', 'node-tab', `data-tab="library" class="${this.nodeTab === 'library' ? 'active' : ''}"`)}${button('剧情节点', 'node-tab', `data-tab="nodes" class="${this.nodeTab === 'nodes' ? 'active' : ''}"`)}${button('剧情事件包', 'node-tab', `data-tab="packages" class="${this.nodeTab === 'packages' ? 'active' : ''}"`)}</div>`;
      if (this.nodeTab === 'library') return subnav + this.libraryPage();
      if (this.nodeTab === 'packages') return subnav + this.packagesPage();
      const p = this.e.project; this.nodeId ||= p.nodes[0].id; const n = p.nodes.find(v => v.id === this.nodeId) || p.nodes[0]; this.nodeId = n.id;
      const options = p.nodes.map(v => [v.id, v.title]);
      let routes = n.routes;
      try {
        if (this.forms['node:' + n.id]?.routes) {
          const draftRoutes = C.parseJSON(this.forms['node:' + n.id].routes);
          if (Array.isArray(draftRoutes) && draftRoutes.every(r => C.object(r) && p.nodes.some(x => x.id === r.target))) routes = draftRoutes;
        }
      } catch {}
      return subnav + `<form data-form="node:${escape(n.id)}"><div class="card row node-toolbar">${button('新建节点', 'node-new')}${button('导入剧本', 'import')}${button('导出剧本', 'export-project')}${button('分析长文本', 'open-analysis')}${button('整理长文本', 'open-segment')}${button('删除节点', 'node-delete', 'class="danger" title="解锁节点后可删除"')}${button('🔒 隐藏节点', 'spoiler-lock')}<span class="muted">修改后保持内部编号。</span></div><div class="node-spoiler spoiler-region"><div class="node-spoiler-content spoiler-content"><div class="split">${this.list(p.nodes, 'node', n.id, '剧情节点')}<div class="card"><h2>编辑节点</h2>${input('名称', 'title', n.title)}${select('节点类型', 'kind', [['scene', '剧情阶段'], ['choice', '分歧选择'], ['ending', '结局']], n.kind)}${checkbox('此节点属于补充构想（非原文）', 'suggested', n.suggested)}${area('短演绎指引（默认注入）', 'guidance', n.guidance)}${area('详细剧情原文', 'detail', n.detail, 8)}${area('演绎边界与保留线索', 'boundary', n.boundary, 3)}${area('阶段完成标准（留空仅手动完成）', 'completion_criteria', n.completion_criteria, 4)}${area('不算完成的情况（每行一条）', 'completion_exclusions', n.completion_exclusions.join('\n'), 3)}${checkbox('证据通过后自动完成节点并结算预设效果', 'auto_complete', n.auto_complete)}${area('进入本阶段的前置条件 JSON', 'entry_condition', json(n.entry_condition ?? true), 4)}${input('相关变量 ID（逗号分隔，仅这些状态进入提示词）', 'context_variables', n.context_variables.join(','))}
      <details><summary>完成节点时的效果</summary>${area('效果 JSON', 'effects', json(n.effects), 5)}<div class="grid">${input('收集项 ID', 'collect_id', '')}${select('增加数值变量', 'effect_variable', [['', '不选择'], ...p.variables.filter(v => v.type === 'number').map(v => [v.id, v.title || v.id])], '')}${input('增加量', 'effect_delta', 1, 'number')}</div>${button('追加效果', 'append-effect')}</details>
      <h3>分支出口</h3>${routes.map((r, i) => `<div class="card"><strong>${escape(r.label || p.nodes.find(v => v.id === r.target).title)}</strong><p class="muted">${escape(conditionSummary(r.condition, p))}</p>${button('移除此出口', 'route-delete', `data-index="${i}"`)}</div>`).join('')}
      <details><summary>添加或修改出口</summary>${select('目标节点', 'route_target', options, p.nodes.find(v => v.id !== n.id)?.id || n.id)}${input('按钮显示文字', 'route_label', '')}${input('填入输入框的行动文字（留空使用按钮文字）', 'route_action_text', '')}${area('自主输入的行动识别标准', 'route_intent', '', 3)}${this.conditionHelper('route')}${area('出口条件 JSON', 'route_condition', 'true', 5)}${button('保存这个出口', 'route-save')}</details>
      <details><summary>高级信息</summary>${input('稳定节点 ID', 'id', n.id, 'text', 'readonly')}${area('所有出口 JSON（保存节点时应用）', 'routes', json(n.routes), 6)}</details>
      <div class="actions">${button('保存节点', 'node-save', 'class="primary"')}${button('设为新对话起点', 'set-start')}</div></div></div></div><div class="spoiler-layer"></div></div></form>`;
    }
    libraryPage() {
      const query = String(this.forms.library?.library_search || '').trim().toLowerCase(), projects = this.e.projectList();
      const items = projects.filter(p=>p.title.toLowerCase().includes(query));
      return `<form data-form="library"><div class="card"><h2>剧本库 · ${projects.length}</h2><p class="muted">当前聊天使用选中的剧本。切换保留各剧本的进度、分析草稿和编辑内容，并关闭剧情注入；准备好后在运行页启用。</p>${input('搜索剧本名称','library_search',query)}<div class="row">${input('新剧本名称','project_title','新剧本')}${button('新建剧本','project-new',this.e.busy ? 'disabled' : 'class="primary"')}${button('导入剧本','import')}</div></div><div class="library-grid">${items.map(p=>`<article class="card library-item"><h3>${escape(p.title)} ${p.current ? '<span class="badge">当前</span>' : ''}</h3><p class="muted">${p.worldbook ? '世界书：'+escape(p.worldbook) : '本地保存'}${p.nodes ? ' · '+p.nodes+'个节点' : ''}</p><div class="row">${button(p.current ? '编辑当前剧本' : '切换并编辑','project-switch',`data-id="${escape(p.id)}" ${this.e.busy ? 'disabled' : ''}`)}${button('复制','project-copy',`data-id="${escape(p.id)}" ${this.e.busy ? 'disabled' : ''}`)}${button('移出剧本库','project-remove',`data-id="${escape(p.id)}" ${p.current || this.e.busy ? 'disabled' : 'class="danger"'}`)}</div></article>`).join('') || '<p class="empty">没有匹配的剧本</p>'}</div><div class="card"><h2>加入世界书中的剧本</h2>${select('世界书','library_book',this.e.host.books().map(name=>[name,name]),this.e.settings.worldbook)}${button('读取并加入剧本库','library-discover',this.e.busy ? 'disabled' : '')}</div></form>`;
    }
    packagesPage() {
      const p = this.e.project, selected = p.packages.find(x => x.id === this.packageId) || p.packages[0]; this.packageId = selected?.id || '';
      const available = p.nodes.filter(n => !F.owner(p, n.id) || F.owner(p, n.id)?.id === selected?.id);
      return `<form data-form="package:${escape(selected?.id || 'new')}"><div class="row spread"><div class="row">${button('新建事件包', 'package-new')}${button('打开交叉依赖示例', 'package-demo')}</div>${button('🔒 重新隐藏', 'spoiler-lock')}</div><p class="muted">事件包独立保存阶段与短摘要；条件满足只解锁，实际完成后才取得结果。包内出口只连接本包，跨包通过结果与触发条件连接。</p><div class="spoiler-region"><div class="spoiler-content"><div class="split"><div class="stack">${p.packages.map(x => button(x.title, 'package-select', `data-id="${escape(x.id)}" class="${x.id === selected?.id ? 'selected' : ''}"`)).join('') || '<p class="empty">暂无事件包</p>'}</div><div>${selected ? `<div class="card"><h2>编辑事件包</h2>${input('稳定 ID', 'package_id', selected.id, 'text', 'readonly')}${input('名称', 'title', selected.title)}<div class="grid">${input('优先级（越大越先）', 'priority', selected.priority, 'number')}${select('本轮位置', 'role', [['main', '主要剧情'], ['side', '可相关推进的支线']], selected.role)}</div>${checkbox('允许触发', 'enabled', selected.enabled)}${checkbox('满足条件后自动安排', 'auto_start', selected.auto_start)}${checkbox('以更高优先级打断当前主剧情', 'interrupt', selected.interrupt)}<h3>包内节点</h3><div class="package-nodes">${available.map(n => checkbox(n.title + ' · ' + n.id, 'pack_node_' + n.id, selected.node_ids.includes(n.id))).join('')}</div>${select('起始节点', 'start_node_id', available.map(n => [n.id, n.title]), selected.start_node_id)}${input('终点节点 ID（逗号分隔）', 'completion_node_ids', selected.completion_node_ids.join(','))}${this.conditionHelper('pack', selected.condition)}${area('触发条件 JSON', 'condition', json(selected.condition), 5)}<details><summary>生成数值触发条件</summary>${select('数值变量', 'pack_variable', p.variables.filter(x => x.type === 'number').map(x => [x.id, x.title]), '')}${select('比较', 'pack_op', [['gte', '大于等于'], ['gt', '大于'], ['lte', '小于等于'], ['lt', '小于'], ['eq', '等于']], 'gte')}${input('数值', 'pack_value', 30, 'number')}${button('加入触发条件', 'package-number-condition')}</details>${area('持续推进条件 JSON（默认 true）', 'continue_condition', json(selected.continue_condition), 3)}<div class="actions">${button('保存事件包', 'package-save', 'class="primary"')}${button('删除事件包', 'package-delete', 'class="danger"')}</div></div>` : '<div class="card"><p>新建事件包会创建一个待编辑节点；请填写完成标准、结果及触发条件后启用。</p></div>'}</div></div></div><div class="spoiler-layer"></div></div></form>`;
    }
    graphPage() {
      const p = this.e.project, s = this.e.state, values = this.forms.records || {}, filter = values.graph_filter || '', zoom = this.graphZoom || 1;
      const graph = G.build(p, s, filter), item = graph.nodes.find(x => x.id === this.graphSelected);
      const diagnostics = this.e.diagnostics();
      return `<form data-form="records"><div class="row spread"><h2>完成与解锁关系</h2>${button('🔒 重新隐藏', 'spoiler-lock')}</div><div class="spoiler-region"><div class="spoiler-content"><div class="card">${select('查看范围', 'graph_filter', [['', '全部事件包'], ...p.packages.map(x => [x.id, x.title])], filter)}<div class="row">${button('缩小', 'graph-zoom', 'data-delta="-0.25"')}${button('放大', 'graph-zoom', 'data-delta="0.25"')}<span>${Math.round(zoom * 100)}%</span></div><p class="muted">拖动滚动条查看；点击节点查看状态。箭头表示前提、行动或完成后取得的结果；AND 全部满足，OR 满足任一，NOT 要求不满足。解锁与完成分别显示。</p><div class="graph-viewport">${G.svg(graph, zoom)}</div></div>${this.completionRecords()}${item ? `<div class="card graph-detail"><h3>${escape(item.label)} · ${escape(item.name)}</h3><p><code>${escape(item.id)}</code> · ${escape(G.STATUS[item.status] || item.status)}</p>${item.detail ? `<p>${escape(item.detail)}</p>` : ''}${item.id.startsWith('result:') ? button('编辑结果说明', 'result-definition-edit', `data-id="${escape(item.id.slice(7))}"`) + button('删除结果', 'result-delete-ask', `data-id="${escape(item.id.slice(7))}" class="danger"`) + this.resultDeleteEditor(item.id.slice(7)) : ''}${item.id.startsWith('result:') && s.collected_ids.includes(item.id.slice(7)) ? button('预览并回退此结果及其后续', 'result-rollback', `data-id="${escape(item.id.slice(7))}" class="danger"`) : ''}</div>` : ''}<div class="card"><h3>依赖检查</h3>${diagnostics.map(x => `<p class="${x.severity === 'error' ? 'warn error' : 'muted'}">${escape(x.message)}</p>`).join('') || '<p>未发现结构或简单条件冲突。</p>'}</div></div><div class="spoiler-layer"></div></div></form>`;
    }
    eventsPage() {
      const p = this.e.project;
      const guide = `<div class="card event-guide"><h2>事件规则：发生什么 → 更新什么</h2><p>这里配置对话中的行为和结果，以及发生后要记录的变化。例如：对方接受送花 → 好感度 +1，并记录“已送花”；得到房卡 → 记录收集项 A，用于解锁后续分支。</p><p class="muted">剧本节点负责当前剧情与下一步走向。事件规则负责从聊天正文中确认行为，更新变量或收集记录；条件是否解锁仍由本地脚本计算。不需要这类记录时，可以不配置事件。</p><ol><li>写清“什么情况下算已经发生”，排除提议、计划和拒绝。</li><li>设置发生后的变化，如好感度增加或记录收集项。</li><li>保存规则，在“运行”页识别当前回复，再到“记录”页确认；也可手动确认发生。勾选自动结算后，证据通过的结果会直接应用。</li></ol><div class="row">${button('用可重复送礼示例创建规则', 'event-example')}${button('查看待确认事件', 'event-records')}</div><p class="muted">送花示例会添加好感度变量与“已送花”收集项，规则和变化都可以继续修改。</p></div>`;
      if (!p.events.length) return guide + `<div class="card"><h2>还没有事件规则</h2><p>可以从送花示例开始，也可以新建自己的识别规则。</p>${button('新建事件规则', 'event-new', 'class="primary"')}${button('导入剧本与事件规则', 'import')}</div>`;
      this.eventId ||= p.events[0].id; const ev = p.events.find(v => v.id === this.eventId) || p.events[0]; this.eventId = ev.id;
      if (ev.completion_node_id) {
        const node = C.indexProject(p).nodes.get(ev.completion_node_id), done = this.e.state.completed_node_ids.includes(node.id);
        return guide + `<form data-form="event:${escape(ev.id)}"><div class="card row">${button('新建事件规则', 'event-new')}${button('移除阶段事件', 'event-delete', 'class="danger"')}</div><div class="split">${this.list(p.events, 'event', ev.id, '事件规则')}<div class="card"><h2>${escape(ev.title)}</h2><p class="badge">${done ? '已完成' : '待完成'}</p><p>此事件与“${escape(node.title)}”阶段共用完成标准和奖励。完成阶段会同时记入事件记录；从这里确认也会完成对应阶段，只结算一次。</p><h3>完成标准</h3><pre>${escape(node.completion_criteria || '手动确认本阶段完成')}</pre><h3>不算完成的情况</h3><pre>${escape(node.completion_exclusions.join('\n') || '未设置')}</pre><h3>完成后的变化</h3><pre>${escape(node.effects.length ? json(node.effects) : '只记录阶段与事件完成，无额外奖励')}</pre><div class="row">${button('编辑对应剧情阶段', 'event-node-edit', `data-id="${escape(node.id)}"`)}${button(done ? '本阶段已完成' : '手动确认本阶段完成', 'event-manual', done ? 'disabled' : '')}${button('查看完成记录', 'event-records')}</div><p class="muted">完整剧本和分支出口在剧本页编辑；输入栏行动仍由玩家发送后推进。</p></div></div></form>`;
      }
      let effects = ev.effects; try { if (this.forms['event:' + ev.id]?.effects) effects = C.parseJSON(this.forms['event:' + ev.id].effects); } catch {}
      const changes = Array.isArray(effects) ? effects.map(effect => {
        if (!C.object(effect)) return '请检查效果 JSON';
        if (effect.collect) return '记录收集项：' + (p.collections.find(c => c.id === effect.collect)?.title || effect.collect);
        const value = effect.add || effect.set; if (!value) return '请检查效果 JSON';
        const name = p.variables.find(v => v.id === value.variable)?.title || value.variable;
        return name + (effect.add ? ' ' + (value.value >= 0 ? '+' : '') + value.value : ' 设置为 ' + value.value) + (value.max != null ? '（此行为最多加到 ' + value.max + '）' : '') + (value.min != null ? '（此行为最低减到 ' + value.min + '）' : '');
      }).join('；') : '变化草稿尚未通过校验';
      return guide + `<form data-form="event:${escape(ev.id)}"><div class="card row">${button('新建事件规则', 'event-new')}${button(ev.repeat_policy === 'once' && this.e.state.event_counts[ev.id] ? '本规则已确认发生' : '手动确认发生并应用变化', 'event-manual', ev.repeat_policy === 'once' && this.e.state.event_counts[ev.id] ? 'disabled' : '')}${button('删除规则', 'event-delete', 'class="danger"')}<span class="muted">手动确认直接执行本条规则，不调用模型。</span></div><div class="split">${this.list(p.events, 'event', ev.id, '事件规则')}<div class="card"><h2>编辑事件规则</h2>${input('规则名称', 'title', ev.title)}${area('需要识别的行为或结果', 'description', ev.description, 4)}${area('什么情况下算已经发生', 'completion_criteria', ev.completion_criteria, 4)}${area('不算发生的情况（每行一条）', 'exclusions', ev.exclusions.join('\n'), 3)}<div class="grid">${select('如何确认发生', 'detection', [['api', '辅助 API 分析正文'], ['manual', '仅手动确认']], ev.detection)}${select('同一规则可以执行几次', 'repeat_policy', [['once', '整个剧本一次'], ['once_per_accepted_turn', '每轮实际发生可重复，同一回复一次']], ev.repeat_policy)}</div>${input('最多实际发生次数（可空；可重复事件的总次数上限）', 'max_occurrences', ev.max_occurrences ?? '', 'number', 'min="1"')}${checkbox('启用此规则', 'enabled', ev.enabled)}${checkbox('辅助 API 完成判断且证据通过后自动应用变化', 'auto_settle', ev.auto_settle)}<h3>发生后的变化</h3><p class="event-effects-summary">${escape(changes || '尚未配置变化，请从下面添加。')}</p><div class="grid">${input('要记录的收集项编号（可空）', 'collect_id', '')}${select('要增加的变量', 'effect_variable', [['', '不选择'], ...p.variables.filter(v => v.type === 'number').map(v => [v.id, v.title || v.id])], '')}${input('变化量（减分可填负数）', 'effect_delta', 1, 'number')}${select('变化方式', 'effect_operation', [['add', '增加 / 减少'], ['set', '设置为指定值']], 'add')}${input('此行为最多加到（可空）', 'reward_max', '', 'number')}${input('此行为最低减到（可空）', 'reward_min', '', 'number')}</div>${button('加入发生后的变化', 'append-effect')}<p class="muted">先填写并加入变化，再保存规则。数值可在“数据 → 数值载体”创建、查看归属和当前值；此行为的限制独立于载体总上限。收集记录可作为分支的解锁条件。</p><details><summary>高级：效果 JSON</summary>${area('完成效果 JSON', 'effects', json(ev.effects), 5)}</details><details><summary>高级：适用范围、前置条件与身份</summary>${input('主体 ID（可空；玩家可写 player）', 'actor_id', ev.actor_id || '')}${input('对象 ID（可空）', 'recipient_id', ev.recipient_id || '')}${input('适用节点 ID（逗号分隔；留空表示整个剧本）', 'scope_nodes', ev.scope.kind === 'nodes' ? ev.scope.node_ids.join(',') : '')}${this.conditionHelper('event')}${area('事件前置条件 JSON', 'condition', json(ev.condition ?? true), 4)}<p>稳定事件 ID：<code>${escape(ev.id)}</code></p></details><div class="actions">${button('保存事件规则', 'event-save', 'class="primary"')}${button('查看识别记录', 'event-records')}</div></div></div></form>`;
    }
    recordsPage() {
      const subnav = `<div class="subnav">${button('进度记录', 'records-tab', `data-tab="progress" class="${this.recordsTab === 'progress' ? 'active' : ''}"`)}${button('完成与解锁关系', 'records-tab', `data-tab="graph" class="${this.recordsTab === 'graph' ? 'active' : ''}"`)}</div>`;
      if (this.recordsTab === 'graph') return subnav + this.graphPage();
      const e = this.e; const p = e.project; const s = e.state; const refs = C.indexProject(p);
      const statuses = {completed: '已发生，待结算', uncertain: '不确定', proposed: '仅提议', rejected: '被拒绝', not_occurred: '未发生'};
      return subnav + `<div class="card"><h2>当前阶段进展</h2><p>${escape(e.flowNotice || '等待行动与回复')}</p>${s.turn_context?.label ? `<p>已选择：${escape(s.turn_context.label)} · 玩家消息 ${Number(s.turn_context.user_id) + 1}</p>` : ''}${s.stage_progress ? `<p>${escape(s.stage_progress.summary || '暂无可确认的新事实')}</p><p class="muted">${escape(s.stage_progress.missing.join('；'))}</p>` : '<p class="muted">阶段完成后仅保留结果标记，工作摘要不继续累计。</p>'}<p>已确认结果：${s.collected_ids.map(x => `<code>${escape(x)}</code>`).join('、') || '暂无'}</p></div>${p.packages.some(b => s.package_progress?.[b.id]?.started) ? `<div class="card"><h2>事件包进度</h2>${p.packages.filter(b => s.package_progress?.[b.id]?.started).map(b => { const q = s.package_progress[b.id]; return `<div class="kv"><span>${escape(b.title)} · ${escape(refs.nodes.get(q.current_node_id)?.title || q.current_node_id)}<br><small>${escape(q.stage_progress?.summary || '暂无工作摘要')}</small></span><strong>${escape(({running: '进行中', done: '已完成', waiting: '等待条件', disabled: '已关闭'})[q.status] || q.status)}</strong></div>`; }).join('')}</div>` : ''}<div class="card"><h2>进度记录</h2><div class="grid"><div><h3>已完成节点</h3>${s.completed_node_ids.map(k => `<p>${escape(refs.nodes.get(k)?.title || k)}</p>`).join('') || '<p class="empty">暂无</p>'}</div><div><h3>事件累计</h3>${Object.entries(s.event_counts).map(([k, v]) => `<div class="kv"><span>${escape(refs.events.get(k)?.title || k)}</span><strong>${v}</strong></div>`).join('') || '<p class="empty">暂无</p>'}</div></div></div>
      ${this.completionRecords()}<div class="card"><h2>待确认与失败检查</h2>${e.busy ? '<span class="badge">辅助任务运行中</span>' : ''}${s.pending_checks.map(check => `<div class="card"><h3>回复楼层 ${Number(check.assistant_id) + 1} · ${escape(check.status)}</h3>${check.error ? `<p class="warn">${escape(check.error)}</p>` : ''}${['error', 'stale', 'partial'].includes(check.status) ? button(check.status === 'partial' ? '继续检查未查候选' : '重新检查', 'retry', `data-key="${escape(check.key)}"`) : ''}${check.results.filter(r => !r.handled).map(r => `<div class="card"><strong>${escape(refs.events.get(r.event_id)?.title || r.event_id)}</strong> <span class="badge">${escape(statuses[r.status])}</span>${r.evidence.map(x => `<p class="muted">“${escape(x.quote)}”</p>`).join('')}${r.note ? `<p class="warn">${escape(r.note)}</p>` : ''}${['completed', 'uncertain'].includes(r.status) ? `<div class="row">${button('确认发生并结算', 'result-accept', `data-key="${escape(check.key)}" data-id="${escape(r.event_id)}"`)}${button('忽略', 'result-dismiss', `data-key="${escape(check.key)}" data-id="${escape(r.event_id)}"`)}</div>` : ''}</div>`).join('')}</div>`).join('') || '<p class="empty">没有待处理的检查</p>'}</div>
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
      const promptField = (label, name, value, rows) => `<details class="api-prompt" data-prompt="${name}"><summary>${escape(label)}</summary>${area(label, name, value, rows)}</details>`;
      const pick = (label, name, value) => models.length ? select(label, name, [['', '请选择（保留手动输入）'], ...models.map(id => [id, id])], models.includes(value) ? value : '') : '';
      return `<form data-form="api"><div class="card"><h2>辅助 API</h2><p class="muted">独立于主聊天 API。支持可从浏览器调用的 OpenAI 兼容 Chat Completions 服务。</p>${input('API 基础地址（域名、带 /v1 的地址或完整聊天接口）', 'base_url', a.base_url, 'url')}<p class="muted">只填域名时自动使用 /v1；自定义路径按原样保留。请使用服务提供的 OpenAI 兼容地址。</p>${input('API 密钥', 'key', a.key, 'password', 'autocomplete="off"')}${checkbox('记住密钥（保存在酒馆脚本变量）', 'remember_key', s.remember_key)}<div class="row">${button(this.modelLoading ? '正在获取模型…' : '获取模型列表', 'api-models', this.modelLoading || this.e.busy ? 'disabled' : '')}</div><p class="muted">获取列表不生成回复。选择后填入完整模型 ID；也可手动输入。列表可用后，仍需测试聊天接口。</p>${urls}${input('事件识别模型（完整 ID）', 'model', a.model)}${pick('从模型列表选择事件识别模型', 'model_choice', a.model)}${input('剧本整理模型（留空沿用事件模型）', 'segment_model', this.forms.api?.segment_model ?? s.segment_model)}${pick('从模型列表选择剧本整理模型', 'segment_model_choice', this.forms.api?.segment_model ?? s.segment_model)}<div class="row">${button('保存 API 设置', 'api-save', 'class="primary"')}${button('测试连接', 'api-test', this.e.busy || this.modelLoading ? 'disabled' : '')}</div></div>
      <div class="card"><h2>判断与预算</h2><h3>长文分析</h3>${checkbox('开始分析前由模型规划分段', 'auto_partition', a.auto_partition !== false)}${input('每段目标字符数（建议2000～4000）', 'analysis_chunk_chars', a.analysis_chunk_chars || 3000, 'number', 'min="500" max="8000"')}${input('分析最大输出 Token', 'analysis_output', a.analysis_output, 'number', 'min="512" max="65536"')}<p class="muted">单段建议2000～4000字，整篇每批建议2万～10万字。分段和输出预算不足会增加重试请求；请按服务支持的上限设置。</p>${checkbox('生成结束后自动核验独立行为事件', 'auto_events', s.auto_events)}${checkbox('用户接话后自动检查上一条选中的回复', 'auto_detect', s.auto_detect)}${checkbox('请求 JSON 输出（服务不支持时可关闭）', 'json_mode', a.json_mode)}${checkbox('发送 enable_thinking=false（仅兼容服务开启）', 'no_thinking', a.no_thinking)}<div class="grid">${input('每批候选事件数', 'batch_size', s.batch_size, 'number', 'min="1" max="32"')}${input('每次最多请求批数', 'max_batches', s.max_batches, 'number', 'min="1" max="64"')}${input('快速识别/模型列表超时（秒）', 'timeout_sec', a.timeout_sec, 'number', 'min="5" max="300"')}${input('整理/分析超时（秒）', 'analysis_timeout_sec', a.analysis_timeout_sec, 'number', 'min="5" max="1800"')}${input('最大输入字符数（不是 Token）', 'max_input_chars', a.max_input_chars, 'number', 'min="1000" max="1000000"')}${input('识别最大输出 Token', 'max_output', a.max_output, 'number', 'min="128" max="16000"')}${input('整理最大输出 Token', 'segment_output', a.segment_output, 'number', 'min="512" max="65536"')}${input('生成前最多等待判断（毫秒，0 为异步）', 'wait_ms', s.wait_ms, 'number', 'min="0" max="15000"')}</div><p class="muted">候选过多按批检查，达到本轮批数上限后会显示未检查数量，由你决定继续。输入超限会明确报错，不把截断文本当作全面检查结果。自动检查需启用剧本。</p></div>
      <div class="card"><h2>实际发送给辅助 API 的系统提示词</h2><p class="muted">下面的文本作为对应请求的 system 消息发送，可直接编辑，点击“保存 API 设置”生效。留空使用默认值。JSON 字段和证据格式仍需保持兼容。</p>${promptField('玩家行动选择识别提示词', 'choice_prompt', a.choice_prompt || prompts.choice, 8)}${promptField('阶段进展与完成核验提示词', 'stage_prompt', a.stage_prompt || prompts.stage, 10)}${promptField('事件核验系统提示词', 'detect_prompt', a.detect_prompt || prompts.detect, 8)}${promptField('基础文本拆分系统提示词', 'segment_prompt', a.segment_prompt || prompts.segment, 8)}${promptField('剧本分析系统提示词', 'analysis_prompt', a.analysis_prompt || prompts.analysis, 12)}${promptField('跨段合并系统提示词', 'analysis_merge_prompt', a.analysis_merge_prompt || prompts.merge, 10)}${promptField('分段规划系统提示词', 'partition_prompt', a.partition_prompt || prompts.partition, 5)}${button('恢复默认提示词（仍需保存）', 'prompts-reset')}<details><summary>每次请求附带什么数据？</summary><p>行动选择：本次玩家输入和当前可选分支；阶段核验：一轮输入与回复、上一份短摘要、至多8条关键事实和相关结果标记。事件核验：当前对话 dialogue、已确认状态 facts、候选事件 candidates。基础拆分：原文 original 与要求 preferences。剧本分析：原文 original、要求 preferences、模式 mode；长文本增加分块编号 part / parts。跨段合并：节点摘要 nodes 与各块报告 parts。</p><p>这些数据放在 user 消息中，每次自动填写。连接测试另发固定 user 消息：只输出 JSON：{&quot;ok&quot;:true}。</p></details><div class="row">${button('保存 API 设置', 'api-save', 'class="primary"')}</div></div>
      <div class="card"><h2>本机已记录用量</h2><div class="row"><span>成功响应 ${u.calls} 次</span><span>输入 ${u.input} Token</span><span>输出 ${u.output} Token</span></div>${u.unknown ? `<p class="muted">${u.unknown} 次响应没有返回 usage，未计入 Token 总数。</p>` : ''}</div></form>`;
    }
    analysisPage() {
      const e = this.e, draft = e.analysisDraft, p = draft?.project || e.project, a = p.analysis, refs = C.indexProject(p), progress = e.analysisProgress;
      const names = ids => (ids || []).map(k => refs.nodes.get(k)?.title || k).join(' → ');
      const proposed = item => item.suggested ? '<span class="badge">补充构想</span>' : '';
      const count = draft ? {nodes: p.nodes.length, routes: p.nodes.reduce((n, x) => n + x.routes.length, 0), packages: p.packages.length, events: p.events.length + p.nodes.filter(n => !n.suggested && n.completion_criteria.trim() && !p.events.some(x => x.completion_node_id === n.id)).length} : null;
      const prompts = e.defaultPrompts();
      const promptEditor = `<details class="analysis-prompts"><summary>查看与修改分析提示词</summary><p class="muted">这里与 API 页共用已保存的系统提示词。修改后点击保存，再发起分析；保留 JSON 字段与证据约定。</p>${area('分析系统提示词（system）', 'analysis_prompt', e.settings.profile.analysis_prompt || prompts.analysis, 12)}${area('跨段合并系统提示词（system）', 'analysis_merge_prompt', e.settings.profile.analysis_merge_prompt || prompts.merge, 10)}<div class="row">${button('保存分析提示词', 'analysis-prompts-save', e.busy ? 'disabled' : '')}${button('恢复默认分析提示词', 'analysis-prompts-reset', e.busy ? 'disabled' : '')}${button('预览当前输入与已保存提示词', 'analysis-preview')}</div>${this.analysisPreview ? `<p class="muted">发送前预览：使用已保存的提示词和当前原文、要求。实际分析先规划分段；此处为分析正文模板预览，各次规划、分段和整合的真实请求见下方记录。</p><pre class="prompt-preview">${escape(json(this.analysisPreview))}</pre>` : ''}<h3>最近一次整理 / 分析的已发请求</h3>${(e.rawAnalysis?.requests || []).map((r, i) => `<details><summary>请求 ${i + 1} · ${escape(r.kind)}${r.part ? ' · ' + r.part + '/' + r.parts : ''}</summary>${r.storage_truncated ? '<p class="warn">本地保留预算已满，此展示不完整。</p>' : ''}<pre class="sent-prompt">${escape(r.text)}</pre></details>`).join('') || '<p class="empty">尚无已发送请求记录</p>'}</details>`;
      const conversion = draft ? `<div class="card analysis-conversion"><h2>分析完成，转化为可用内容</h2><p>${count.nodes} 个剧情阶段 · ${count.events} 条事件规则 · ${count.routes} 个分支出口 · ${count.packages} 个剧情事件包</p><p>转化后，阶段和分支在“剧本”页，完成规则在“事件”页，条件关系在“记录”页。有完成标准的阶段会登记对应事件，共用一次结算；未明确的标准留待编辑。</p>${draft.is_partial ? '<p class="warn">这只是单个分块，尚未完成全篇整合。</p>' : ''}<div class="row">${button('转化为剧本、事件与分支', 'analysis-convert', e.busy ? 'disabled' : 'class="primary"')}${button('备份当前进度', 'export-progress')}${button('导出分析草稿', 'analysis-export')}</div><p class="muted">转化无需再次调用 API。当前剧本保留在草稿或世界书，转换后的剧本先关闭注入，核对后启用。</p></div>` : '';
      return `<form data-form="analysis">${conversion}<div class="card"><h2>长文本分析为新剧本</h2><p class="muted">分割剧情阶段，归纳不同走向、结局与伏笔。先由模型规划分段，再逐段分析与整合。单段建议2000～4000字，默认约3000字；全文建议每批2万～10万字，最多100万字符、512段。模型实际上下文上限与费用仍由服务决定。</p>${area('需要分析的长文本', 'analysis_text', p.original_text || '', 10)}<div class="analysis-meter"><span data-analysis-count>原文：${(this.forms.analysis?.analysis_text || p.original_text || '').length.toLocaleString()} 字符</span><span>每段目标：${e.settings.profile.analysis_chunk_chars || 3000} 字符</span><span>输出预算：${e.settings.profile.analysis_output || 16384} Token</span></div><p class="compact-note">建议整篇粘贴，不必手动切段。节点正文按来源编号由本地还原，减少模型复写造成的删改。条件密集时将单段调至2000字。输入预算提高不代表输出不会截断。</p>${button('调整分段与输出预算', 'analysis-settings')}${area('分析要求', 'analysis_wish', '提取关键阶段、不同走向与结局、伏笔。保留原文明确的完成标准、结果ID及解锁条件；为出口填写行动文字和识别标准，提取数值载体、增减/设置量、发生标准、重复次数与停止门槛；缺少依据的规则列为待核对事项。', 3)}${select('处理方式', 'analysis_mode', [['faithful', '忠于原文，只整理已明确内容'], ['expand', '允许补充分支和结局，标为建议']], 'faithful')}<div class="row">${button('调用辅助 API 分析', 'analysis-run', e.busy ? 'disabled' : 'class="primary"')}${progress ? button('取消分析', 'analysis-cancel') : ''}</div>${progress ? `<p class="warn" role="status">${escape(progress.phase)} · 已完成 ${progress.done}/${progress.total || '准备中'} 次请求</p>` : ''}<p class="muted">使用 API 页的剧本整理模型和分析提示词；每次整理/分析请求最多等待 ${escape(e.settings.profile.analysis_timeout_sec || 600)} 秒。完整回复返回后才生成草稿，确认应用后才切换剧本。</p><details><summary>从后台 JSON 恢复分析草稿</summary><p class="muted">保留上面的原文，粘贴后台模型输出的 JSON 正文或完整 Chat Completions 响应；校验原文、规则和引用后保存为草稿。</p>${select('保留的原始回复', 'analysis_saved_id', [['', '手动粘贴完整结果'], ...(e.rawAnalysis?.replies || []).map((x, i) => [x.id, (i + 1) + ' · ' + x.kind + (x.part ? ' ' + x.part + '/' + x.parts : '') + (x.finish_reason === 'length' || x.storage_truncated ? ' · 已截断' : '')])], '')}<div class="row">${button('读取这份原始回复', 'analysis-raw-load', e.rawAnalysis?.replies.length ? '' : 'disabled')}${button('导出原始分析记录', 'analysis-raw-export', e.rawAnalysis ? '' : 'disabled')}</div>${e.rawAnalysis?.error ? `<p class="warn">${escape(e.rawAnalysis.error)}</p>` : ''}<p class="muted">收到的文本在校验前保留；可修改字段后重新校验，不会再次请求 API。旧 detail 仅换行/空格不同且唯一匹配时，本地恢复原文；实际删改会指出出错节点，不能强制当作原文。分块回复仅恢复本块；截断输出只供排查。</p>${area('后台分析结果 JSON', 'analysis_response', '', 8)}${button('校验后台结果并生成草稿', 'analysis-restore', e.busy ? 'disabled' : '')}${button('补修来源并恢复（必要时调用 API）', 'analysis-repair', e.busy ? 'disabled' : '')}<p class="muted">本地校验失败时，仅请求模型补修来源编号，最多两次；不重做分析，不修改原规则和奖励。</p></details></div>${promptEditor}
      ${a ? `<div class="card analysis-report"><h2>${draft ? '分析草稿报告' : '当前剧本分析报告'}</h2><p style="white-space:pre-wrap">${escape(a.synopsis)}</p><h3>不同走向</h3>${a.branches.map(x => `<div class="card"><strong>${escape(x.title)}</strong> ${proposed(x)}<p>${escape(x.summary)}</p><p class="muted">${escape(names(x.node_ids))}</p></div>`).join('') || '<p class="empty">未确认不同走向</p>'}<h3>结局</h3>${a.endings.map(x => `<div class="card"><strong>${escape(x.title)}</strong> ${proposed(x)}<p>${escape(x.summary)}</p><p class="muted">${escape(refs.nodes.get(x.node_id)?.title || '')}</p></div>`).join('') || '<p class="empty">原文未明确结局</p>'}<h3>伏笔与回收</h3>${a.foreshadowing.map(x => `<div class="card"><strong>${escape(x.title)}</strong> ${proposed(x)}<p>埋设：${escape(x.hint)}</p><p class="muted">${escape(names(x.plant_node_ids))}</p><p>回收：${escape(x.payoff)}</p><p class="muted">${escape(names(x.payoff_node_ids))}</p></div>`).join('') || '<p class="empty">未确认伏笔</p>'}${a.uncertainties.length ? `<h3>待核对事项</h3><ul>${a.uncertainties.map(x => `<li>${escape(x)}</li>`).join('')}</ul>` : ''}</div>` : ''}
      ${draft ? `<div class="card"><h2>编辑并应用分析草稿</h2><p class="warn">${draft.warnings.map(escape).join('<br>') || '请核对原文、走向、结局与伏笔。'}<br>${draft.recovered ? '本次从已有后台结果恢复，未再次请求 API。' : '本次分析使用 ' + (Number(draft.request_count) || 1) + ' 次请求。'}原文明确的完成标准、结果标记和条件会保留为可编辑规则，请核对后再应用。</p>${area('完整剧本草稿 JSON（可编辑）', 'analysis_draft', json(draft.project), 18)}<div class="row">${button('转化并打开剧本', 'analysis-apply', 'class="primary"')}${button('导出分析草稿', 'analysis-export')}</div></div>` : ''}</form>`;
    }
    valuesPage() {
      const p = this.e.project, state = this.e.state, list = p.variables.filter(v => v.type === 'number');
      const v = list.find(x => x.id === this.variableId) || list[0]; this.variableId = v?.id || '';
      const changes = (state.settlements?.order || []).slice().reverse().flatMap(k => {
        const entry = state.settlements.entries[k], source = p.events.find(x => x.id === entry.event_id)?.title || p.nodes.find(x => x.id === entry.node_id)?.title || '状态同步';
        return (entry.changes || []).filter(x => x.variable === v?.id).map(x => ({...x, source, at: entry.at}));
      }).slice(0, 12);
      return `<div class="card values-card"><h2>数值载体</h2><p class="muted">为角色、玩家、组织或全局保存数值。事件奖励写入当前聊天进度，分支与事件包用同一数值判断条件。</p><div class="stack">${list.map(x => button((x.owner ? x.owner + ' · ' : '') + x.title + '（' + x.id + '）：' + state.variables[x.id], 'variable-select', `data-id="${escape(x.id)}" class="${x.id === v?.id ? 'selected' : ''}"`)).join('') || '<p class="empty">暂无数值，可在下面创建。</p>'}</div><h3>${v ? '编辑数值定义' : '创建数值'}</h3>${input('名称', 'value_title', v?.title || '')}${input('归属 / 对象（如玩家、某角色、某组织；可空）', 'value_owner', v?.owner || '')}<div class="grid">${input('初始值（修改定义不会覆盖现有进度）', 'value_default', v?.default ?? 0, 'number')}${input('总下限（可空）', 'value_min', v?.min ?? '', 'number')}${input('总上限（可空）', 'value_max', v?.max ?? '', 'number')}</div>${v ? `<p>当前值：<strong>${escape(state.variables[v.id])}</strong> · 编号 <code>${escape(v.id)}</code>${v.binding ? ' · 从外部聊天变量只读同步' : ''}</p>` : ''}<div class="row">${button('保存数值定义', 'variable-save')}${button('创建为新数值', 'variable-new')}</div><p class="muted">一个行为的奖励上限在事件页单独设置；到达该上限后，其他符合条件的行为仍可增加数值。</p>${v ? `<h3>最近实际变化</h3>${changes.map(x => `<div class="kv"><span>${escape(x.source)}<br><small>${escape(new Date(x.at).toLocaleString())}</small></span><strong>${escape(x.before)} → ${escape(x.after)}</strong></div>`).join('') || '<p class="empty">暂无可追溯的数值变化</p>'}` : ''}</div>`;
    }
    resultDefinitionsPage() {
      const p = this.e.project, c = p.collections.find(x => x.id === this.resultId) || p.collections[0]; this.resultId = c?.id || '';
      return `<div class="card results-card"><h2>结果与🎒说明</h2><div class="stack">${p.collections.map(x => button(x.title + '（' + x.id + '）', 'definition-select', `data-id="${escape(x.id)}" class="${x.id === c?.id ? 'selected' : ''}"`)).join('') || '<p class="empty">暂无结果定义</p>'}</div>${input('结果名称', 'result_title', c?.title || '')}${input('新建结果编号（留空自动分配，如 a、b1、ab）', 'new_result_code', '')}${area('取得后显示的说明文字', 'result_description', c?.description || '', 3)}<div class="row">${button('保存结果说明', 'definition-save', c ? '' : 'disabled')}${button('创建新结果', 'definition-new')}</div><p class="muted">🎒只显示真正取得的结果和这段说明。新结果还需在节点或事件中配置获取来源。</p></div>`;
    }
    completionRecords() {
      const p = this.e.project, s = this.e.state;
      return `<div class="card completion-records"><h3>完成记录</h3><div class="grid"><div><h3>已完成阶段</h3>${s.completed_node_ids.map(k => {
        const n = p.nodes.find(x => x.id === k), entry = s.settlements?.entries['node:' + k];
        return `<details class="acquired"><summary>${escape(n?.title || k)}（${escape(C.displayId(p, 'node', k))}）</summary><p>${entry ? escape(new Date(entry.at).toLocaleString()) : '旧进度或导入记录'}${entry?.source?.assistant_id != null ? ' · 回复楼层 ' + (Number(entry.source.assistant_id) + 1) : ' · 人工确认或旧记录'}</p>${entry?.completion_criteria || n?.completion_criteria ? `<p>完成标准：${escape(entry?.completion_criteria || n.completion_criteria)}</p>` : ''}${entry?.source?.evidence?.map(x => `<p>依据：“${escape(x.quote)}”</p>`).join('') || ''}</details>`;
      }).join('') || '<p class="empty">暂无已完成阶段</p>'}</div><div><h3>已获得内容</h3>${this.obtainedMarkup(C.obtainedResults(p, s))}</div></div></div>`;
    }
    resultDeleteEditor(code) {
      if (this.deletingResult !== code) return '';
      const plan = this.e.resultDeletionPreview(code);
      return `<div class="card result-delete-editor"><h3>删除结果及处理引用</h3><p>${escape(plan.definition.title)}（${escape(code)}）</p>${plan.references.length ? `<p>以下内容引用此结果：</p><ul>${plan.references.map(r => `<li>${escape(r.label)} ${button('编辑', 'result-reference-edit', `data-kind="${escape(r.kind)}" data-id="${escape(r.id)}"`)}</li>`).join('')}</ul>` : '<p>没有其他定义引用此结果。</p>'}${plan.in_progress ? '<p class="warn">已有取得或结算依赖记录。请先备份并回退相关结果，再删除定义。</p>' : ''}${select('关联条件如何处理', 'delete_result_mode', [['block', '禁止所列关联入口，保留内容供编辑'], ['replace', '用另一个结果替换条件'], ['remove', '移除相关条件项（可能提前解锁）']], 'block')}${select('替代结果（选择替换时使用）', 'delete_result_replacement', [['', '请选择'], ...this.e.project.collections.filter(x => x.id !== code).map(x => [x.id, x.title + '（' + x.id + '）'])], '')}<p class="muted">取得此结果的效果和互斥引用会清理，数值奖励、阶段正文与其他结果保留。只影响结果定义；其他聊天使用同一剧本时也需核对。</p><div class="row">${button('取消删除', 'result-delete-cancel')}${button('修改关联内容', 'result-edit-references', `data-id="${escape(code)}"`)}${button('确认删除结果及所列引用', 'result-delete-confirm', `data-id="${escape(code)}" class="danger" ${plan.in_progress ? 'disabled' : ''}`)}${button('备份当前进度', 'export-progress')}</div></div>`;
    }
    dataPage() {
      const e = this.e; const p = e.project;
      let books = []; try { books = e.host.books(); } catch {}
      const draft = e.segmentDraft;
      return `<form data-form="data"><div class="card"><h2>剧本与世界书</h2>${input('剧本名称', 'project_title', p.title)}${area('必要背景（会进入主模型提示词）', 'premise', p.premise, 3)}<div class="grid">${select('读取已有世界书', 'book_load', [['', '请选择'], ...books.map(b => [b, b])], e.settings.worldbook)}${input('写入世界书名称', 'book_save', e.settings.worldbook || '分支剧本素材')}</div>${this.bookProjects.length > 1 ? select('世界书中的剧本', 'book_project', this.bookProjects.map(v => [v.id, v.title]), p.id) : ''}<div class="row">${button('读取世界书', 'book-load')}${button('写入世界书', 'book-save', 'class="primary"')}${button('保存名称与背景', 'project-meta')}${button('新建空白剧本', 'project-new')}</div><p class="muted">每个节点和事件独立保存为关闭自动激活的条目；只更新本插件当前剧本，保留其他条目。</p></div>
      <details class="basic-segment"><summary>快速整理 / 仅保存原文</summary><p class="muted">快速整理适合少量文本转为基础阶段草稿；完整长文、条件与数值规则请使用“分析”。两者共用校验规则，但快速整理不进行多段规划和走向整合。</p><div class="row">${button('转到完整长文分析', 'open-analysis')}</div>${area('剧本原文', 'original_text', p.original_text || '', 10)}${input('整理要求（如按场景分段，保留已有分支）', 'segment_wish', '')}<div class="row">${button('调用辅助 API 整理为草稿', 'segment', e.busy ? 'disabled' : '')}${button('不调用模型，保存原文', 'original-save')}</div><p class="muted">整理产生额外调用。不会直接替换当前剧本，完成后可编辑草稿再应用。</p>${draft ? `<div class="warn">${draft.warnings.map(escape).join('<br>') || '整理完成，请核对节点和原文后应用。'}</div>${area('可编辑的剧本草稿 JSON', 'segment_draft', json(draft.project), 14)}${button('应用此草稿为新剧本', 'segment-apply', 'class="primary"')}` : ''}</details>
      ${this.valuesPage()}${this.resultDefinitionsPage()}<div class="card"><h2>高级：变量与收集项 JSON</h2><p class="muted">变量支持 number / boolean / string。数值变量可设置 min、max；收集项提供易读名称。</p>${area('变量定义 JSON', 'variables', json(p.variables), 7)}${area('收集项名称 JSON', 'collections', json(p.collections), 5)}${button('保存变量和收集项定义', 'definitions-save')}<p class="muted">结果可设 requires（取得前提）、exclusive_with（互斥结果 ID 数组）；external:true 用于已确认外部提供的结果。历史事实用结果 ID，当前持有量用变量。ID 必须完整相等。</p><details><summary>从聊天变量读取数值</summary>${select('本插件变量', 'binding_id', p.variables.map(x => [x.id, x.title || x.id]), p.variables[0]?.id || '')}${input('聊天变量路径（用点分隔，留空解除映射）', 'binding_path', '')}${button('保存外部变量映射', 'binding-save')}<p class="muted">例如 stat_data.信任。发送玩家消息前只读取已配置路径，不写回外部变量。缺失或类型不匹配时会停止该轮推进并提示。</p>${p.variables.filter(x => x.binding).map(x => `<p>${escape(x.title || x.id)} ← <code>${escape(x.binding.path.join('.'))}</code></p>`).join('')}</details></div>
      <div class="card"><h2>选项与界面</h2>${checkbox('在酒馆输入框上方直接显示可选择的分支', 'quick_options', e.settings.quick_options)}${checkbox('发送时识别快捷选择或自主输入并推进分支', 'story_flow', e.settings.story_flow)}${checkbox('AI 回复生成结束后自动更新阶段摘要、判断完成', 'auto_stage', e.settings.auto_stage)}<p class="muted">直接列出“查看走廊”等当前可用、已解锁的选项，点击后把行动文字加入输入草稿，发送后才记录选择、切换节点和注入剧情，不自动发送消息。自主输入也可由辅助 API 识别。启用剧本时自动开启输入栏行动选项，之后可在运行页或这里关闭。运行页的分支、收集和状态区与剧本页的节点区分别确认解锁；刷新或切换新剧本后重新隐藏。</p><div class="row">${button('保存选项设置', 'options-save')}${button('恢复铅笔图标默认位置', 'launcher-reset')}</div></div>
      <div class="card"><h2>注入方式</h2>${input('注入深度', 'depth', e.settings.depth, 'number', 'min="0" max="100"')}${checkbox('注入详细剧情（默认使用短指引）', 'detail', e.settings.detail)}${button('保存注入设置', 'injection-save')}</div>
      <div class="card"><h2>导入、备份与草稿</h2><div class="row">${button('导入剧本或进度 JSON', 'import')}${button('导出当前剧本', 'export-project')}${button('备份当前进度', 'export-progress')}${button('重置当前聊天进度', 'reset', 'class="danger"')}</div><p class="muted">剧本分享包和进度备份均不包含 API 密钥。</p>${Object.values(e.settings.drafts || {}).map(v => button('打开草稿：' + v.title, 'draft-load', `data-id="${escape(v.id)}"`)).join(' ')}</div>
      <details><summary>高级：完整剧本 JSON 编辑</summary>${area('当前剧本数据', 'project_json', json(p), 16)}${button('校验并应用 JSON', 'project-json-save')}</details></form>`;
    }
    getForm() { const form = this.shadow.querySelector('form'); return this.values(form?.dataset.form); }
    showConversion() { this.render(false); this.shadow.querySelector('.analysis-conversion')?.scrollIntoView({block: 'start'}); this.toast('分析草稿已准备，点击“转化为剧本、事件与分支”继续'); }
    loadRaw(id = this.e.rawAnalysis?.replies.at(-1)?.id) {
      const reply = this.e.rawAnalysis?.replies.find(x => x.id === id); C.assert(reply, '尚未收到可保留的文本回复');
      this.capture(); this.forms.analysis ||= {}; Object.assign(this.forms.analysis, {analysis_saved_id: reply.id, analysis_text: reply.original_from_run ? this.e.rawAnalysis.original : reply.original, analysis_mode: reply.mode, analysis_response: reply.text});
      this.render(false); const detail = [...this.shadow.querySelectorAll('details')].find(x => x.querySelector('summary')?.textContent === '从后台 JSON 恢复分析草稿'); if (detail) detail.open = true;
    }
    async action(action, b) {
      if (action === 'close') return this.close();
      if (action === 'unlock-ask') { this.spoilerPrompt = true; this.updatePrivacy(); this.shadow.querySelector('[data-action="unlock-cancel"]').focus(); return; }
      if (action === 'unlock-cancel') return this.cancelUnlock();
      if (action === 'unlock-confirm') { if (this.tab === 'run') this.runUnlocked = true; else if (this.tab === 'records') this.recordUnlocked = true; else this.unlocked = true; this.spoilerPrompt = false; this.updatePrivacy(); this.shadow.querySelector('[data-action="spoiler-lock"]')?.focus(); return; }
      if (action === 'spoiler-lock') { if (this.tab === 'run') this.runUnlocked = false; else if (this.tab === 'records') this.recordUnlocked = false; else this.unlocked = false; this.spoilerPrompt = false; this.updatePrivacy(); this.shadow.querySelector('[data-action="unlock-ask"]').focus(); return; }
      if (action === 'quick-gear' || action === 'quick-bag') { const menu = action === 'quick-gear' ? 'gear' : 'bag'; this.quickMenu = this.quickMenu === menu ? '' : menu; this.renderQuick(); return; }
      if (action === 'quick-collapse') { this.e.settings.quick_collapsed = !this.e.settings.quick_collapsed; this.e.saveSettings(); this.renderQuick(); return; }
      if (action === 'quick-panel') { this.tab = this.e.diagnostics().some(x => x.severity === 'error') ? 'records' : 'run'; if (this.tab === 'records') this.recordsTab = 'graph'; this.toggle(); return; }
      if (['quick-complete', 'quick-check', 'quick-pause', 'quick-accept', 'quick-dismiss'].includes(action)) {
        C.assert(this.e.settings.enabled && !this.e.busy, '剧本未启用或辅助任务正在运行');
        if (action !== 'quick-pause') C.assert(!this.e.state.paused, '请先继续运行剧本');
        if (action === 'quick-complete') this.e.complete();
        else if (action === 'quick-check') await this.e.checkRound();
        else if (action === 'quick-pause') this.e.pause();
        else await this.e.confirmResult(b.dataset.key, b.dataset.id, action === 'quick-accept');
        this.renderQuick(); return;
      }
      if (action === 'quick-enter') {
        C.assert(this.e.settings.quick_options && this.e.settings.enabled && !this.e.state.paused, '快捷分支当前未启用');
        const field = this.findInput(); C.assert(field, '未找到可见的酒馆输入框');
        field.value = this.e.stageChoice(b.dataset.id, field.value);
        // Single-line host inputs strip line breaks; remember the actual DOM value for cancel/reselection.
        this.e.pendingChoice.text = field.value; this.e.notify();
        field.dispatchEvent(new this.win.Event('input', {bubbles: true})); field.focus({preventScroll: true}); return;
      }
      if (action === 'quick-cancel') {
        const field = this.findInput(), pending = this.e.cancelChoice();
        if (field && pending && field.value === pending.text) { field.value = pending.base_text; field.dispatchEvent(new this.win.Event('input', {bubbles: true})); field.focus({preventScroll: true}); } return;
      }
      const protectedAction = ['node-select', 'node-save', 'node-delete', 'set-start', 'route-save', 'route-delete', 'package-select', 'package-save', 'package-delete', 'package-number-condition', 'package-new', 'package-demo'].includes(action) || this.tab === 'nodes' && ['make-condition', 'append-effect', 'list-prev', 'list-next'].includes(action);
      if (protectedAction) C.assert(this.unlocked, '请先确认剧透风险并解锁剧本节点');
      if (action === 'enter') C.assert(this.runUnlocked, '请先确认剧透风险并解锁分支与状态');
      if (['graph-node', 'graph-zoom', 'result-rollback', 'result-delete-ask', 'result-delete-confirm', 'result-edit-references', 'result-reference-edit', 'result-definition-edit'].includes(action)) C.assert(this.recordUnlocked, '请先确认剧透风险并解锁完成与解锁关系');
      const e = this.e; const v = this.getForm(); const ids = raw => String(raw || '').split(/[,，\n]/).map(x => x.trim()).filter(Boolean);
      const n = () => C.indexProject(e.project).nodes.get(this.nodeId);
      const event = () => C.indexProject(e.project).events.get(this.eventId);
      const number = (key, min, max) => { const value = Number(v[key]); C.assert(Number.isFinite(value) && value >= min && value <= max, key + ' 数值超出范围'); return value; };
      if (action === 'section-jump') { const target = this.shadow.querySelector(`[data-section="${b.dataset.section}"].section-target`); if (target?.matches('details')) target.open = true; const nested = target?.classList.contains('recovery-section') ? target.querySelector(':scope > details') : null; if (nested) nested.open = true; target?.scrollIntoView({block: 'start', behavior: 'instant'}); target?.querySelector('input,textarea,button,summary')?.focus({preventScroll: true}); return; }
      if (action === 'tab') { this.capture(); this.tab = b.dataset.tab; this.spoilerPrompt = false; this.listPage = 0; this.render(); this.shadow.querySelector('main').scrollTop = 0; return; }
      if (action === 'library-open') {this.capture();this.saveEditors();this.tab='nodes';this.nodeTab='library';this.render(false);this.shadow.querySelector('main').scrollTop=0;return;}
      if (['project-new','project-switch','project-copy','project-remove','library-discover'].includes(action)) {
        this.capture();this.saveEditors(); const values=this.forms.library || {};
        if (action==='project-new') await this.e.createProject(values.project_title);
        else if (action==='project-switch') await this.e.switchProject(b.dataset.id);
        else if (action==='project-copy') await this.e.copyProject(b.dataset.id);
        else if (action==='project-remove') {const item=this.e.projectList().find(p=>p.id===b.dataset.id); if(!this.win.confirm('将“'+item.title+'”移出剧本库？本地剧本与工作草稿会移除，世界书原件和聊天进度保留。')) return;this.e.removeProject(item.id);}
        else {const count=await this.e.discoverBook(values.library_book);this.toast('已读取 '+count+' 份剧本');}
        if (['project-new','project-switch','project-copy'].includes(action)) {this.tab='nodes';this.nodeTab='nodes';}
        this.render(false);this.shadow.querySelector('main').scrollTop=0;return;
      }
      if (action === 'node-tab' || action === 'records-tab') { this.capture(); if (action === 'node-tab') this.nodeTab = b.dataset.tab; else this.recordsTab = b.dataset.tab; this.spoilerPrompt = false; this.render(false); return; }
      if (action === 'graph-node') { this.graphSelected = b.dataset.id; this.render(); return; }
      if (action === 'graph-zoom') { this.graphZoom = Math.max(.5, Math.min(2, (this.graphZoom || 1) + Number(b.dataset.delta))); this.render(); return; }
      if (action === 'result-rollback') {
        const plan = e.rollbackPreview(b.dataset.id);
        if (!this.win.confirm('回退结果 ' + b.dataset.id + '？\n将撤销结果：' + plan.removed_results.join('、') + '\n将撤销节点：' + plan.removed_nodes.join('、') + '\n其他独立结算保留；回退后暂停，请核对再继续。建议先备份进度。')) return;
        e.rollbackResult(b.dataset.id); this.toast('已撤销对应结算及依赖它的后续，剧本已暂停'); return;
      }
      if (action === 'result-delete-ask') { this.deletingResult = b.dataset.id; this.render(); return; }
      if (action === 'result-delete-cancel') { this.deletingResult = ''; this.render(); return; }
      if (action === 'result-delete-confirm') {
        const plan = e.resultDeletionPreview(b.dataset.id), mode = v.delete_result_mode || 'block';
        C.assert(!plan.in_progress, '请先回退此结果的相关结算，再删除定义');
        const warning = mode === 'remove' ? '移除相关条件项，可能提前解锁内容' : mode === 'replace' ? '条件改为引用 ' + v.delete_result_replacement : '所列关联入口禁止进入，保留内容等待编辑';
        if (!this.win.confirm('删除“' + plan.definition.title + '（' + b.dataset.id + '）”？\n' + plan.references.map(x => x.label).join('\n') + '\n处理：' + warning + '\n取得效果与互斥引用将清理。正文、数值载体和其他奖励保留。')) return;
        await e.deleteResult(b.dataset.id, mode, v.delete_result_replacement); this.deletingResult = ''; this.graphSelected = ''; delete this.forms.records; delete this.forms.data; this.render(false); this.toast('结果及引用已处理，关系图和依赖检查已更新'); return;
      }
      if (action === 'result-definition-edit') { this.tab = 'data'; this.resultId = b.dataset.id; delete this.forms.data; this.render(false); this.shadow.querySelector('.results-card')?.scrollIntoView({block: 'start'}); return; }
      if (action === 'result-edit-references' || action === 'result-reference-edit') {
        const ref = action === 'result-edit-references' ? e.resultDeletionPreview(b.dataset.id).references[0] : {kind: b.dataset.kind, id: b.dataset.id};
        C.assert(ref, '没有关联内容需要修改'); this.deletingResult = '';
        if (ref.kind === 'package') { this.tab = 'nodes'; this.nodeTab = 'packages'; this.packageId = ref.id; }
        else if (ref.kind === 'node') { this.tab = 'nodes'; this.nodeTab = 'nodes'; this.nodeId = ref.id; }
        else if (ref.kind === 'event') { this.tab = 'events'; this.eventId = ref.id; }
        else { this.tab = 'data'; this.resultId = ref.id; }
        this.spoilerPrompt = false; this.render(); return;
      }
      if (action === 'variable-select' || action === 'definition-select') { if (action === 'variable-select') this.variableId = b.dataset.id; else this.resultId = b.dataset.id; delete this.forms.data; this.render(false); this.shadow.querySelector(action === 'variable-select' ? '.values-card' : '.results-card')?.scrollIntoView({block: 'start'}); return; }
      if (action === 'variable-save' || action === 'variable-new') {
        C.assert(v.value_title?.trim(), '请填写数值名称');
        const optional = key => { if (v[key] == null || String(v[key]).trim() === '') return undefined; const value = Number(v[key]); C.assert(Number.isFinite(value), '数值限制无效'); return value; };
        await e.editProject(p => { const definition = {title: v.value_title.trim(), owner: v.value_owner.trim(), type: 'number', default: Number(v.value_default), min: optional('value_min'), max: optional('value_max')};
          if (action === 'variable-save' && this.variableId) Object.assign(p.variables.find(x => x.id === this.variableId), definition);
          else { const id = C.shortId(p, 'V'); p.variables.push({id, ...definition}); this.variableId = id; }
        }); delete this.forms.data; this.render(false); this.toast('已保存数值载体；已有当前值保留'); return;
      }
      if (action === 'definition-save' || action === 'definition-new') {
        C.assert(v.result_title?.trim(), '请填写结果名称');
        await e.editProject(p => { if (action === 'definition-save') Object.assign(p.collections.find(x => x.id === this.resultId), {title: v.result_title.trim(), description: v.result_description}); else { const id = v.new_result_code?.trim() ? C.safeId(v.new_result_code.trim(), '结果编号') : C.shortId(p, 'b'); C.assert(!p.collections.some(x => x.id === id), '结果编号已存在'); p.collections.push({id, title: v.result_title.trim(), description: v.result_description}); this.resultId = id; } });
        delete this.forms.data; this.render(false); this.toast('已保存结果说明；取得后同步显示在🎒'); return;
      }
      if (action === 'package-select') { this.capture(); this.packageId = b.dataset.id; this.render(false); return; }
      if (action === 'list-prev' || action === 'list-next') { this.listPage += action === 'list-prev' ? -1 : 1; this.render(); return; }
      if (action === 'node-select' || action === 'event-select') { this.capture(); if (action === 'node-select') this.nodeId = b.dataset.id; else this.eventId = b.dataset.id; this.render(false); return; }
      if (action === 'toggle-enabled') await e.updateSettings(e.settings.enabled ? {enabled: false} : {enabled: true, quick_options: true});
      else if (action === 'quick-toggle') await e.updateSettings({quick_options: !e.settings.quick_options});
      else if (action === 'complete') e.complete();
      else if (action === 'enter') e.enter(b.dataset.id);
      else if (action === 'pause') e.pause();
      else if (action === 'undo') e.undo();
      else if (action === 'check') await e.checkLatest();
      else if (action === 'stage-check') await e.checkStage(undefined, true);
      else if (action === 'retry') await e.retryCheck(b.dataset.key);
      else if (action === 'result-accept' || action === 'result-dismiss') await e.confirmResult(b.dataset.key, b.dataset.id, action === 'result-accept');
      else if (action === 'package-demo') {
        if (!this.win.confirm('打开 b2+c1 → a4 → d1 交叉依赖示例？当前剧本保留在世界书或草稿中。')) return;
        await e.setProject(F.demoProject()); this.packageId = '';
      } else if (action === 'package-new') {
        let nodeId, id;
        await e.editProject(p => { nodeId = C.shortId(p, 'N'); id = C.shortId(p, 'P'); p.nodes.push({id: nodeId, title: '新事件阶段', routes: [], effects: []}); p.packages.push({id, title: '新事件包', node_ids: [nodeId], enabled: false, condition: true}); }); this.packageId = id;
      } else if (action === 'package-save') {
        await e.editProject(p => Object.assign(p.packages.find(x => x.id === this.packageId), {title: v.title, priority: Number(v.priority), role: v.role, enabled: v.enabled, auto_start: v.auto_start, interrupt: v.interrupt, node_ids: p.nodes.filter(x => v['pack_node_' + x.id]).map(x => x.id), start_node_id: v.start_node_id, completion_node_ids: ids(v.completion_node_ids), condition: C.parseJSON(v.condition, '事件包触发条件'), continue_condition: C.parseJSON(v.continue_condition, '持续条件')})); delete this.forms['package:' + this.packageId];
      } else if (action === 'package-delete') {
        if (!this.win.confirm('删除此事件包定义？已启动的进度会阻止删除；请先回退或重置进度。节点仍保留。')) return;
        await e.editProject(p => { p.packages = p.packages.filter(x => x.id !== this.packageId); }); this.packageId = '';
      } else if (action === 'package-number-condition') {
        C.assert(v.pack_variable && Number.isFinite(Number(v.pack_value)), '请选择数值变量并填写数值');
        const old = C.parseJSON(v.condition, '触发条件'), term = {variable: {id: v.pack_variable, op: v.pack_op, value: Number(v.pack_value)}};
        this.forms['package:' + this.packageId].condition = json(old === true ? term : {all: [...(old.all || [old]), term]}); this.render(false); this.toast('已加入条件草稿，请保存事件包'); return;
      } else if (action === 'event-number-condition') {
        C.assert(v.event_variable && Number.isFinite(Number(v.event_value)), '请选择数值载体并填写数值');
        const old = C.parseJSON(v.condition, '事件前置条件'), term = {variable: {id: v.event_variable, op: v.event_op, value: Number(v.event_value)}};
        this.forms['event:' + this.eventId].condition = json(old === true ? term : {all: [...(old?.all || [old]), term]}); this.render(false); this.toast('已加入前置条件草稿，请保存规则'); return;
      } else if (action === 'node-new') {
        const node = {id: '', title: '新剧情节点', guidance: '', detail: '', boundary: '', effects: [], routes: [], context_variables: []};
        await e.editProject(p => { node.id = C.shortId(p, 'N'); p.nodes.push(node); }); this.nodeId = node.id;
      } else if (action === 'node-delete') {
        C.assert(this.win.confirm('删除当前编辑节点？已有进度或引用会阻止删除。'), '已取消删除');
        await e.editProject(p => { p.nodes = p.nodes.filter(x => x.id !== this.nodeId); }); this.nodeId = '';
      } else if (action === 'node-save') {
        const current = n(); await e.editProject(p => Object.assign(p.nodes.find(x => x.id === current.id), {title: v.title, kind: v.kind, suggested: v.suggested, guidance: v.guidance, detail: v.detail, boundary: v.boundary, completion_criteria: v.completion_criteria, completion_exclusions: String(v.completion_exclusions || '').split('\n').map(x => x.trim()).filter(Boolean), auto_complete: v.auto_complete,
          entry_condition: C.parseJSON(v.entry_condition, '节点进入条件'), effects: C.parseJSON(v.effects, '效果'), routes: C.parseJSON(v.routes, '出口'), context_variables: ids(v.context_variables)})); delete this.forms['node:' + current.id];
      } else if (action === 'set-start') await e.editProject(p => { p.start_node_id = this.nodeId; });
      else if (action === 'route-save') {
        const condition = C.parseJSON(v.route_condition, '出口条件'); const routes = C.parseJSON(v.routes, '出口');
        const entry = {target: v.route_target, label: v.route_label || e.project.nodes.find(x => x.id === v.route_target).title, condition, action_text: v.route_action_text || v.route_label, intent: v.route_intent || v.route_label};
        const at = routes.findIndex(r => r.target === entry.target); if (at < 0) routes.push(entry); else routes[at] = entry;
        this.forms['node:' + this.nodeId].routes = json(routes); this.render(false); this.toast('出口已加入编辑草稿，请保存节点'); return;
      } else if (action === 'route-delete') {
        const routes = C.parseJSON(v.routes, '出口'); routes.splice(Number(b.dataset.index), 1); this.forms['node:' + this.nodeId].routes = json(routes); this.render(false); return;
      } else if (action === 'make-condition') {
        const prefix = b.dataset.prefix; const terms = [...ids(v[prefix + '_all']).map(collected => ({collected})), ...ids(v[prefix + '_not']).map(collected => ({not: {collected}}))];
        const form = this.shadow.querySelector('form'); this.forms[form.dataset.form][prefix === 'route' ? 'route_condition' : 'condition'] = json(terms.length ? {all: terms} : true); this.render(false); return;
      } else if (action === 'append-effect') {
        const effects = C.parseJSON(v.effects, '效果'); if (v.collect_id?.trim()) effects.push({collect: C.safeId(v.collect_id.trim())});
        if (v.effect_variable) { C.assert(Number.isFinite(Number(v.effect_delta)), '请输入有效增加量'); const value = {variable: v.effect_variable, value: Number(v.effect_delta)}; for (const field of ['min', 'max']) { const raw = v['reward_' + field]; if (raw != null && String(raw).trim() !== '') { C.assert(Number.isFinite(Number(raw)), '奖励数值限制无效'); value[field] = Number(raw); } } effects.push({[v.effect_operation || 'add']: value}); }
        const form = this.shadow.querySelector('form'); this.forms[form.dataset.form].effects = json(effects); this.render(false); return;
      } else if (action === 'event-records') { this.tab = 'records'; this.spoilerPrompt = false; this.render(); this.shadow.querySelector('main').scrollTop = 0; return; }
      else if (action === 'event-node-edit') { this.nodeId = b.dataset.id; this.nodeTab = 'nodes'; this.tab = 'nodes'; this.spoilerPrompt = false; this.render(); this.shadow.querySelector('main').scrollTop = 0; return; }
      else if (action === 'event-example') {
        const ev = {id: '', title: '送礼并被接受（可重复示例）', description: '玩家实际赠送礼物，对方接受。', completion_criteria: '实际交付动作已经完成，对方明确接受。', exclusions: ['只是提出送礼', '尚未行动的计划', '对方拒绝', '假设或回忆'], effects: [], detection: 'api', repeat_policy: 'once_per_accepted_turn', auto_settle: true, actor_id: 'player'};
        await e.editProject(p => {
          let variable = p.variables.find(x => x.id === 'affection' && x.type === 'number');
          if (!variable) { variable = {id: C.shortId(p, 'V'), title: '关系值（示例，可改名）', owner: '当前互动对象（请修改）', type: 'number', default: 0, min: 0, max: 100}; p.variables.push(variable); }
          ev.id = C.shortId(p, 'E'); ev.effects = [{add: {variable: variable.id, value: 4, max: 70}}]; p.events.push(ev);
        }); this.eventId = ev.id;
      } else if (action === 'event-new') {
        const ev = {id: '', title: '新事件', description: '描述需要识别的事件', completion_criteria: '写明事件实际完成的标准', exclusions: ['只是提议', '引用旧事', '被拒绝'], effects: [], detection: 'api', repeat_policy: 'once', auto_settle: false};
        await e.editProject(p => { ev.id = C.shortId(p, 'E'); p.events.push(ev); }); this.eventId = ev.id;
      } else if (action === 'event-delete') {
        const linked = event()?.completion_node_id, plan = e.eventDeletionPreview(this.eventId);
        if (!this.win.confirm((linked ? '移除这条阶段事件？对应阶段、完成标准与奖励保留。' : '删除此事件？') + (plan.cleanup.length ? '\n同时清理未取得且无其他引用的结果：' + plan.cleanup.join('、') : '') + '\n已有结算或条件引用会阻止删除；数值载体保留。')) return;
        await e.deleteEvent(this.eventId); this.eventId = ''; delete this.forms.data;
      } else if (action === 'event-manual') await e.manualEvent(this.eventId);
      else if (action === 'event-save') {
        const current = event(); const nodeIds = ids(v.scope_nodes);
        await e.editProject(p => Object.assign(p.events.find(x => x.id === current.id), {title: v.title, description: v.description, completion_criteria: v.completion_criteria,
          exclusions: String(v.exclusions).split('\n').map(x => x.trim()).filter(Boolean), actor_id: v.actor_id.trim(), recipient_id: v.recipient_id.trim(),
          scope: nodeIds.length ? {kind: 'nodes', node_ids: nodeIds} : {kind: 'project'}, detection: v.detection, repeat_policy: v.repeat_policy, max_occurrences: v.max_occurrences?.trim() ? Math.floor(number('max_occurrences', 1, 1000000)) : undefined,
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
        const profile = {base_url: v.base_url.trim(), model: v.model.trim(), key: v.key.trim(), timeout_sec: number('timeout_sec', 5, 300), analysis_timeout_sec: number('analysis_timeout_sec', 5, 1800), max_input_chars: number('max_input_chars', 1000, 1000000),
          max_output: Math.floor(number('max_output', 128, 16000)), segment_output: Math.floor(number('segment_output', 512, 65536)), analysis_output: Math.floor(number('analysis_output', 512, 65536)),
          auto_partition: v.auto_partition, analysis_chunk_chars: Math.floor(number('analysis_chunk_chars', 500, 8000)), partition_prompt: v.partition_prompt.trim(), choice_prompt: v.choice_prompt.trim(), stage_prompt: v.stage_prompt.trim(), detect_prompt: v.detect_prompt.trim(), segment_prompt: v.segment_prompt.trim(), analysis_prompt: v.analysis_prompt.trim(), analysis_merge_prompt: v.analysis_merge_prompt.trim(), json_mode: v.json_mode, no_thinking: v.no_thinking};
        await e.updateSettings({profile, remember_key: v.remember_key, segment_model: v.segment_model.trim(), auto_detect: v.auto_detect, auto_events: v.auto_events,
          wait_ms: number('wait_ms', 0, 15000), batch_size: Math.floor(number('batch_size', 1, 32)), max_batches: Math.floor(number('max_batches', 1, 64))});
        if (action === 'api-test') { const result = await e.client.call(profile, [{role: 'user', content: '只输出 JSON：{"ok":true}'}], {max_tokens: 128}); C.assert(result.ok === true, '服务响应未通过 JSON 测试'); e.error = ''; e.saveSettings(); this.toast('聊天接口测试通过'); }
        delete this.forms.api; if (this.forms.analysis) { delete this.forms.analysis.analysis_prompt; delete this.forms.analysis.analysis_merge_prompt; } this.analysisPreview = null;
      } else if (action === 'prompts-reset') { const p = e.defaultPrompts(); Object.assign(this.forms.api, {choice_prompt: p.choice, stage_prompt: p.stage, detect_prompt: p.detect, segment_prompt: p.segment, analysis_prompt: p.analysis, analysis_merge_prompt: p.merge, partition_prompt: p.partition}); this.render(false); this.toast('默认提示词已填入，请保存 API 设置'); return; }
      else if (action === 'options-save') await e.updateSettings({quick_options: v.quick_options, story_flow: v.story_flow, auto_stage: v.auto_stage});
      else if (action === 'launcher-reset') { e.settings.launcher_position = null; e.saveSettings(); this.applyLauncherPosition(); }
      else if (action === 'book-save') await e.saveBook(v.book_save.trim());
      else if (action === 'book-load') { C.assert(v.book_load, '请选择世界书'); const data = await e.loadBook(v.book_load, v.book_project || undefined); this.bookProjects = data.projects; this.nodeId = ''; this.eventId = ''; this.forms = {}; }
      else if (action === 'project-meta') await e.editProject(p => { p.title = v.project_title; p.premise = v.premise; });
      else if (action === 'project-new') {
        const nodeId = 'N1'; await e.setProject({id: C.id('story'), title: '新剧本', start_node_id: nodeId, nodes: [{id: nodeId, title: '开场', guidance: '', routes: [], effects: []}], events: [], variables: [], collections: []}); this.nodeId = ''; this.eventId = ''; this.forms = {};
      } else if (action === 'open-segment') { this.tab = 'data'; this.render(); this.shadow.querySelector('.basic-segment').open = true; this.shadow.querySelector('[name="original_text"]').focus(); return; }
      else if (action === 'open-analysis') { this.tab = 'analysis'; this.render(); this.shadow.querySelector('[name="analysis_text"]').focus(); return; }
      else if (action === 'analysis-settings') { this.tab = 'api'; this.render(); this.shadow.querySelector('[name="analysis_chunk_chars"]').scrollIntoView({block: 'center'}); this.shadow.querySelector('[name="analysis_chunk_chars"]').focus({preventScroll: true}); return; }
      else if (action === 'analysis-prompts-save') {
        await e.updateSettings({profile: {analysis_prompt: v.analysis_prompt.trim(), analysis_merge_prompt: v.analysis_merge_prompt.trim()}});
        if (this.forms.api) { delete this.forms.api.analysis_prompt; delete this.forms.api.analysis_merge_prompt; }
        delete this.forms.analysis.analysis_prompt; delete this.forms.analysis.analysis_merge_prompt; this.analysisPreview = null; this.render(false); this.toast('已保存分析提示词，API 页同步使用'); return;
      }
      else if (action === 'analysis-prompts-reset') { const prompts = e.defaultPrompts(); Object.assign(this.forms.analysis, {analysis_prompt: prompts.analysis, analysis_merge_prompt: prompts.merge}); this.render(false); this.toast('已填入默认值，请点击保存'); return; }
      else if (action === 'analysis-preview') { this.analysisPreview = [{role: 'system', content: e.settings.profile.analysis_prompt?.trim() || e.defaultPrompts().analysis}, {role: 'user', content: JSON.stringify({original: v.analysis_text, preferences: v.analysis_wish, mode: v.analysis_mode, max_nodes: 128})}]; this.render(false); return; }
      else if (action === 'analysis-run') { try { const draft = await e.analyze(v.analysis_text, v.analysis_wish, v.analysis_mode); this.forms.analysis.analysis_draft = json(draft.project); this.showConversion(); return; } finally { if (e.rawAnalysis?.error && e.rawAnalysis.replies.length) this.loadRaw(); } }
      else if (action === 'analysis-raw-load') { this.loadRaw(v.analysis_saved_id); }
      else if (action === 'analysis-raw-export') { C.assert(e.rawAnalysis, '暂无原始回复记录'); this.download(e.rawAnalysis, 'analysis-raw.json'); return; }
      else if (action === 'analysis-repair') { const draft = await e.repairAnalysis(v.analysis_text,v.analysis_response,v.analysis_mode,v.analysis_saved_id);this.forms.analysis.analysis_draft=json(draft.project);this.showConversion();return;}
      else if (action === 'analysis-restore') { const draft = e.restoreAnalysis(v.analysis_text, v.analysis_response, v.analysis_mode, v.analysis_saved_id); this.forms.analysis.analysis_draft = json(draft.project); this.showConversion(); return; }
      else if (action === 'analysis-cancel') { e.client.cancel('用户取消了分析'); return; }
      else if (action === 'analysis-export') { this.download({type: 'bse_project', version: 1, project: C.normalizeProject(C.parseJSON(v.analysis_draft, '分析草稿'))}, 'analysis-draft.json'); return; }
      else if (action === 'analysis-apply' || action === 'analysis-convert') {
        C.assert(e.analysisDraft, '请先完成分析或恢复分析草稿'); const project = C.parseJSON(v.analysis_draft, '分析草稿');
        if (!this.win.confirm((e.analysisDraft.is_partial ? '这只是单个分块草稿，未完成全篇整合。\n' : '') + '转化为剧本、事件和分支并打开？当前剧本和进度保留；新剧本关闭注入，核对后启用。')) return;
        await e.applyAnalysis(project); this.nodeId = ''; this.eventId = ''; this.packageId = ''; this.nodeTab = 'nodes'; this.tab = 'nodes'; this.spoilerPrompt = false; this.render(false); this.shadow.querySelector('main').scrollTop = 0; this.toast('转化完成；剧情与分支在剧本页，完成规则在事件页'); return;
      }
      else if (action === 'segment') { const draft = await e.segment(v.original_text, v.segment_wish); this.forms.data.segment_draft = json(draft.project); }
      else if (action === 'segment-apply') { C.assert(this.win.confirm('把整理草稿作为新剧本打开？当前剧本会保留在原世界书或草稿中。'), '已取消应用'); await e.setProject(C.parseJSON(v.segment_draft, '拆分草稿')); delete e.settings.segment_draft; e.saveSettings(); this.nodeId = ''; this.eventId = ''; }
      else if (action === 'original-save') await e.editProject(p => { p.original_text = v.original_text; });
      else if (action === 'definitions-save') await e.editProject(p => { p.variables = C.parseJSON(v.variables, '变量'); p.collections = C.parseJSON(v.collections, '收集项'); });
      else if (action === 'binding-save') {
        await e.editProject(p => { const variable = p.variables.find(x => x.id === v.binding_id); C.assert(variable, '请选择已定义变量'); if (!v.binding_path.trim()) delete variable.binding; else variable.binding = {type: 'chat', path: v.binding_path.trim().split('.').map(x => x.trim())}; });
        delete this.forms.data; this.toast('已保存聊天变量映射；发送下一条玩家消息时读取');
      }
      else if (action === 'injection-save') await e.updateSettings({depth: Math.floor(number('depth', 0, 100)), detail: v.detail});
      else if (action === 'project-json-save') { await e.setProject(C.parseJSON(v.project_json, '剧本')); this.nodeId = ''; this.eventId = ''; }
      else if (action === 'draft-load') { await e.setProject(e.settings.drafts[b.dataset.id]); this.nodeId = ''; this.eventId = ''; }
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
      if (this.destroyed) return; this.destroyed = true;
      try {this.capture();this.saveEditors();} catch {}
      this.unsub?.(); clearTimeout(this.toastTimer); this.doc.removeEventListener('keydown', this.keyHandler);
      this.releaseQuickDock(); this.quickResize?.disconnect(); this.win.removeEventListener('resize', this.viewportHandler); this.win.visualViewport?.removeEventListener('resize', this.viewportHandler); this.win.visualViewport?.removeEventListener('scroll', this.viewportHandler); this.win.removeEventListener('scroll', this.quickScroll, true); this.composerObserver?.disconnect(); this.composerResize?.disconnect(); if (this.quickFrame) this.win.cancelAnimationFrame(this.quickFrame); this.quickElement?.remove(); this.element?.remove();
    }
  }
  return {Panel};
});
