(function (root, factory) {
  const value = factory(root.BSECore);
  if (typeof module === 'object' && module.exports) module.exports = value; else root.BSEUI = value;
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
  class Panel {
    constructor(engine) { this.e = engine; this.doc = engine.host.doc(); this.win = this.doc.defaultView; this.tab = 'run'; this.opened = false; this.forms = {}; this.details = {}; this.search = {}; this.nodeId = ''; this.eventId = ''; this.listPage = 0; this.bookProjects = []; this.unsub = null; }
    mount() {
      this.doc.getElementById('bse-panel-host')?.remove();
      this.element = this.doc.createElement('div'); this.element.id = 'bse-panel-host'; this.element.style.cssText = 'position:relative;z-index:2147482000';
      this.shadow = this.element.attachShadow({mode: 'open'});
      this.shadow.innerHTML = `<style>${STYLE}</style><button class="launcher" type="button" aria-label="打开剧情面板">剧本</button><div class="overlay" hidden><section class="panel" role="dialog" aria-modal="true" aria-label="分支剧本管理"><header><div><h1>分支剧本</h1><small>剧情、事件与进度</small></div><button type="button" data-action="close" aria-label="关闭剧情面板">关闭</button></header><nav aria-label="剧情面板页面"></nav><main></main><footer>完整素材留在酒馆，当前剧情按需注入。</footer><div class="toast" role="status" hidden></div></section></div><input class="file" type="file" accept=".json,application/json">`;
      this.doc.body.appendChild(this.element);
      this.shadow.querySelector('.launcher').onclick = () => this.toggle();
      this.shadow.addEventListener('click', ev => { const b = ev.target.closest?.('[data-action]'); if (b && !b.disabled) this.run(() => this.action(b.dataset.action, b)); });
      this.shadow.addEventListener('submit', ev => ev.preventDefault());
      this.shadow.addEventListener('change', ev => { if (ev.target.name === 'node_search' || ev.target.name === 'event_search') { this.capture(); this.search[ev.target.name] = ev.target.value; this.listPage = 0; this.render(); } });
      this.shadow.querySelector('.file').onchange = async ev => { const file = ev.target.files[0]; if (file) await this.run(async () => { const data = C.parseJSON(await file.text(), '导入文件'); if (data.type === 'bse_progress') this.e.importProgress(data); else await this.e.setProject(data.project || data); this.forms = {}; this.render(false); this.toast('导入完成'); }); ev.target.value = ''; };
      this.keyHandler = ev => { if (ev.altKey && ev.key.toLowerCase() === 'b') { ev.preventDefault(); this.toggle(); } else if (ev.key === 'Escape' && this.opened) this.close(); };
      this.doc.addEventListener('keydown', this.keyHandler);
      this.shadow.addEventListener('keydown', ev => {
        if (!this.opened || ev.key !== 'Tab') return;
        const targets = [...this.shadow.querySelector('.panel').querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,summary')].filter(el => el.getClientRects().length);
        const first = targets[0], last = targets.at(-1), active = this.shadow.activeElement;
        if (ev.shiftKey && active === first) { ev.preventDefault(); last?.focus(); }
        else if (!ev.shiftKey && active === last) { ev.preventDefault(); first?.focus(); }
      });
      this.viewportHandler = () => {
        const vp = this.win.visualViewport;
        this.element.style.setProperty('--bse-height', (vp?.height || this.win.innerHeight) + 'px');
        this.element.style.setProperty('--bse-top', (vp?.offsetTop || 0) + 'px');
      };
      this.win.addEventListener('resize', this.viewportHandler); this.win.visualViewport?.addEventListener('resize', this.viewportHandler); this.win.visualViewport?.addEventListener('scroll', this.viewportHandler); this.viewportHandler();
      this.unsub = this.e.onChange(() => this.render()); this.render();
    }
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
      const oldForm = this.shadow.querySelector('form');
      if (oldForm) this.details[oldForm.dataset.form] = [...oldForm.querySelectorAll('details[open]')].map(d => d.querySelector('summary')?.textContent);
      const active = this.shadow.activeElement; const focusName = active?.name; const selection = active?.selectionStart;
      const scroll = this.shadow.querySelector('main').scrollTop;
      const tabs = [['run', '运行'], ['nodes', '剧本'], ['events', '事件'], ['records', '记录'], ['api', 'API'], ['data', '数据']];
      this.shadow.querySelector('nav').innerHTML = tabs.map(([key, title]) => button(title, 'tab', `data-tab="${key}" class="${this.tab === key ? 'active' : ''}" aria-current="${this.tab === key ? 'page' : 'false'}"`)).join('');
      const body = ({run: () => this.runPage(), nodes: () => this.nodesPage(), events: () => this.eventsPage(), records: () => this.recordsPage(), api: () => this.apiPage(), data: () => this.dataPage()}[this.tab])();
      this.shadow.querySelector('main').innerHTML = (this.e.error ? `<div class="warn error" role="alert">${escape(this.e.error)}</div>` : '') + body;
      const form = this.shadow.querySelector('form'); if (form) this.restore(form);
      if (form) for (const d of form.querySelectorAll('details')) d.open = (this.details[form.dataset.form] || []).includes(d.querySelector('summary')?.textContent);
      this.shadow.querySelector('main').scrollTop = scroll;
      if (focusName && form) {
        const el = Array.from(form.elements).find(x => x.name === focusName);
        if (el) { el.focus({preventScroll: true}); if (typeof selection === 'number' && el.setSelectionRange) try { el.setSelectionRange(selection, selection); } catch {} }
      }
    }
    async run(fn) { try { await fn(); } catch (e) { this.e.report(e); this.toast(e.message, true); } }
    toast(text, error = false) { const el = this.shadow.querySelector('.toast'); el.textContent = text; el.hidden = false; el.style.background = error ? '#592a31' : '#21473b'; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { el.hidden = true; }, 4000); }
    toggle() { if (this.opened) return this.close(); this.opened = true; this.oldFocus = this.doc.activeElement; this.shadow.querySelector('.overlay').hidden = false; this.render(); this.shadow.querySelector('[data-action="close"]').focus(); }
    close() { this.capture(); this.opened = false; this.shadow.querySelector('.overlay').hidden = true; this.oldFocus?.focus?.(); }
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
      return `<form data-form="node:${escape(n.id)}"><div class="card row">${button('新建节点', 'node-new')}${button('整理长文本', 'open-segment')}${button('删除节点', 'node-delete', 'class="danger"')}<span class="muted">修改后保持内部编号。</span></div><div class="split">${this.list(p.nodes, 'node', n.id, '剧情节点')}<div class="card"><h2>编辑节点</h2>${input('名称', 'title', n.title)}${area('短演绎指引（默认注入）', 'guidance', n.guidance)}${area('详细剧情原文', 'detail', n.detail, 8)}${area('演绎边界与保留线索', 'boundary', n.boundary, 3)}${input('相关变量 ID（逗号分隔，仅这些状态进入提示词）', 'context_variables', n.context_variables.join(','))}
      <details><summary>完成节点时的效果</summary>${area('效果 JSON', 'effects', json(n.effects), 5)}<div class="grid">${input('收集项 ID', 'collect_id', '')}${select('增加数值变量', 'effect_variable', [['', '不选择'], ...p.variables.filter(v => v.type === 'number').map(v => [v.id, v.title || v.id])], '')}${input('增加量', 'effect_delta', 1, 'number')}</div>${button('追加效果', 'append-effect')}</details>
      <h3>分支出口</h3>${routes.map((r, i) => `<div class="card"><strong>${escape(r.label || p.nodes.find(v => v.id === r.target).title)}</strong><p class="muted">${escape(conditionSummary(r.condition, p))}</p>${button('移除此出口', 'route-delete', `data-index="${i}"`)}</div>`).join('')}
      <details><summary>添加或修改出口</summary>${select('目标节点', 'route_target', options, p.nodes.find(v => v.id !== n.id)?.id || n.id)}${input('按钮显示文字', 'route_label', '')}${this.conditionHelper('route')}${area('出口条件 JSON', 'route_condition', 'true', 5)}${button('保存这个出口', 'route-save')}</details>
      <details><summary>高级信息</summary>${input('稳定节点 ID', 'id', n.id, 'text', 'readonly')}${area('所有出口 JSON（保存节点时应用）', 'routes', json(n.routes), 6)}</details>
      <div class="actions">${button('保存节点', 'node-save', 'class="primary"')}${button('设为新对话起点', 'set-start')}</div></div></div></form>`;
    }
    eventsPage() {
      const p = this.e.project;
      if (!p.events.length) return `<div class="card"><h2>自定义事件</h2><p>填写发生标准、排除情况和奖励，让辅助 API 判断自然语言中的事件。</p>${button('新建事件', 'event-new', 'class="primary"')}${button('批量导入', 'import')}</div>`;
      this.eventId ||= p.events[0].id; const ev = p.events.find(v => v.id === this.eventId) || p.events[0]; this.eventId = ev.id;
      return `<form data-form="event:${escape(ev.id)}"><div class="card row">${button('新建事件', 'event-new')}${button('手动确认本事件', 'event-manual')}${button('删除事件', 'event-delete', 'class="danger"')}</div><div class="split">${this.list(p.events, 'event', ev.id, '预设事件')}<div class="card"><h2>编辑事件</h2>${input('名称', 'title', ev.title)}${area('识别什么事件', 'description', ev.description, 4)}${area('完成标准', 'completion_criteria', ev.completion_criteria, 4)}${area('排除情况（每行一条）', 'exclusions', ev.exclusions.join('\n'), 3)}<div class="grid">${input('主体 ID（可空；玩家可写 player）', 'actor_id', ev.actor_id || '')}${input('对象 ID（可空）', 'recipient_id', ev.recipient_id || '')}${select('判定方式', 'detection', [['api', '辅助 API'], ['manual', '手动确认']], ev.detection)}${select('重复策略', 'repeat_policy', [['once', '整个剧本一次'], ['once_per_accepted_turn', '每条确认回复一次']], ev.repeat_policy)}</div>${checkbox('启用此事件', 'enabled', ev.enabled)}${checkbox('完成且证据校验通过后自动结算', 'auto_settle', ev.auto_settle)}${input('适用节点 ID（逗号分隔；留空表示整个剧本）', 'scope_nodes', ev.scope.kind === 'nodes' ? ev.scope.node_ids.join(',') : '')}${this.conditionHelper('event')}${area('事件前置条件 JSON', 'condition', json(ev.condition ?? true), 4)}${area('完成效果 JSON', 'effects', json(ev.effects), 5)}<div class="grid">${input('收集项 ID', 'collect_id', '')}${select('增加数值变量', 'effect_variable', [['', '不选择'], ...p.variables.filter(v => v.type === 'number').map(v => [v.id, v.title || v.id])], '')}${input('增加量', 'effect_delta', 1, 'number')}</div>${button('追加效果', 'append-effect')}<details><summary>稳定事件 ID</summary><code>${escape(ev.id)}</code></details><div class="actions">${button('保存事件', 'event-save', 'class="primary"')}</div></div></div></form>`;
    }
    recordsPage() {
      const e = this.e; const p = e.project; const s = e.state; const refs = C.indexProject(p);
      const statuses = {completed: '已发生，待结算', uncertain: '不确定', proposed: '仅提议', rejected: '被拒绝', not_occurred: '未发生'};
      return `<div class="card"><h2>进度记录</h2><div class="grid"><div><h3>已完成节点</h3>${s.completed_node_ids.map(k => `<p>${escape(refs.nodes.get(k)?.title || k)}</p>`).join('') || '<p class="empty">暂无</p>'}</div><div><h3>事件累计</h3>${Object.entries(s.event_counts).map(([k, v]) => `<div class="kv"><span>${escape(refs.events.get(k)?.title || k)}</span><strong>${v}</strong></div>`).join('') || '<p class="empty">暂无</p>'}</div></div></div>
      <div class="card"><h2>待确认与失败检查</h2>${e.busy ? '<span class="badge">辅助任务运行中</span>' : ''}${s.pending_checks.map(check => `<div class="card"><h3>回复楼层 ${Number(check.assistant_id) + 1} · ${escape(check.status)}</h3>${check.error ? `<p class="warn">${escape(check.error)}</p>` : ''}${['error', 'stale', 'partial'].includes(check.status) ? button(check.status === 'partial' ? '继续检查未查候选' : '重新检查', 'retry', `data-key="${escape(check.key)}"`) : ''}${check.results.filter(r => !r.handled).map(r => `<div class="card"><strong>${escape(refs.events.get(r.event_id)?.title || r.event_id)}</strong> <span class="badge">${escape(statuses[r.status])}</span>${r.evidence.map(x => `<p class="muted">“${escape(x.quote)}”</p>`).join('')}${r.note ? `<p class="warn">${escape(r.note)}</p>` : ''}${['completed', 'uncertain'].includes(r.status) ? `<div class="row">${button('确认发生并结算', 'result-accept', `data-key="${escape(check.key)}" data-id="${escape(r.event_id)}"`)}${button('忽略', 'result-dismiss', `data-key="${escape(check.key)}" data-id="${escape(r.event_id)}"`)}</div>` : ''}</div>`).join('')}</div>`).join('') || '<p class="empty">没有待处理的检查</p>'}</div>
      <div class="card"><h2>近期操作（最多 25 条）</h2>${s.history.slice().reverse().map(tx => `<p>${escape(tx.label)} <span class="muted">${new Date(tx.at).toLocaleString()}</span></p>`).join('') || '<p class="empty">暂无操作</p>'}${button('回退最近一次', 'undo', s.history.length ? '' : 'disabled')}</div>`;
    }
    apiPage() {
      const s = this.e.settings; const a = s.profile; const u = this.e.client.usage;
      return `<form data-form="api"><div class="card"><h2>辅助 API</h2><p class="muted">独立于主聊天 API。支持可从浏览器调用的 OpenAI 兼容 Chat Completions 服务。</p>${input('API 基础地址（如 https://服务域名/v1）', 'base_url', a.base_url, 'url')}${input('事件识别模型', 'model', a.model)}${input('API 密钥', 'key', a.key, 'password', 'autocomplete="off"')}${checkbox('记住密钥（保存在酒馆脚本变量）', 'remember_key', s.remember_key)}${input('剧本整理模型（留空沿用事件模型）', 'segment_model', s.segment_model)}<div class="row">${button('保存 API 设置', 'api-save', 'class="primary"')}${button('测试连接', 'api-test', this.e.busy ? 'disabled' : '')}</div></div>
      <div class="card"><h2>判断与预算</h2>${checkbox('用户接话后自动检查上一条选中的回复', 'auto_detect', s.auto_detect)}${checkbox('请求 JSON 输出（服务不支持时可关闭）', 'json_mode', a.json_mode)}${checkbox('发送 enable_thinking=false（仅兼容服务开启）', 'no_thinking', a.no_thinking)}<div class="grid">${input('每批候选事件数', 'batch_size', s.batch_size, 'number', 'min="1" max="32"')}${input('每次最多请求批数', 'max_batches', s.max_batches, 'number', 'min="1" max="64"')}${input('请求超时（秒）', 'timeout_sec', a.timeout_sec, 'number', 'min="5" max="300"')}${input('最大输入字符数（不是 Token）', 'max_input_chars', a.max_input_chars, 'number', 'min="1000" max="200000"')}${input('识别最大输出 Token', 'max_output', a.max_output, 'number', 'min="128" max="16000"')}${input('整理最大输出 Token', 'segment_output', a.segment_output, 'number', 'min="512" max="32000"')}${input('生成前最多等待判断（毫秒，0 为异步）', 'wait_ms', s.wait_ms, 'number', 'min="0" max="15000"')}</div><p class="muted">候选过多按批检查，达到本轮批数上限后会显示未检查数量，由你决定继续。输入超限会明确报错，不把截断文本当作全面检查结果。自动检查需启用剧本。</p></div>
      <div class="card"><h2>本机已记录用量</h2><div class="row"><span>成功响应 ${u.calls} 次</span><span>输入 ${u.input} Token</span><span>输出 ${u.output} Token</span></div>${u.unknown ? `<p class="muted">${u.unknown} 次响应没有返回 usage，未计入 Token 总数。</p>` : ''}</div></form>`;
    }
    dataPage() {
      const e = this.e; const p = e.project;
      let books = []; try { books = e.host.books(); } catch {}
      const draft = e.segmentDraft;
      return `<form data-form="data"><div class="card"><h2>剧本与世界书</h2>${input('剧本名称', 'project_title', p.title)}${area('必要背景（会进入主模型提示词）', 'premise', p.premise, 3)}<div class="grid">${select('读取已有世界书', 'book_load', [['', '请选择'], ...books.map(b => [b, b])], e.settings.worldbook)}${input('写入世界书名称', 'book_save', e.settings.worldbook || '分支剧本素材')}</div>${this.bookProjects.length > 1 ? select('世界书中的剧本', 'book_project', this.bookProjects.map(v => [v.id, v.title]), p.id) : ''}<div class="row">${button('读取世界书', 'book-load')}${button('写入世界书', 'book-save', 'class="primary"')}${button('保存名称与背景', 'project-meta')}${button('新建空白剧本', 'project-new')}</div><p class="muted">每个节点和事件独立保存为关闭自动激活的条目；只更新本插件当前剧本，保留其他条目。</p></div>
      <div class="card"><h2>整理大段文本（可选模型功能）</h2>${area('剧本原文', 'original_text', p.original_text || '', 10)}${input('整理要求（如按场景分段，保留已有分支）', 'segment_wish', '')}<div class="row">${button('调用辅助 API 整理为草稿', 'segment', e.busy ? 'disabled' : '')}${button('不调用模型，保存原文', 'original-save')}</div><p class="muted">整理产生额外调用。不会直接替换当前剧本，完成后可编辑草稿再应用。</p>${draft ? `<div class="warn">${draft.warnings.map(escape).join('<br>') || '整理完成，请核对节点和原文后应用。'}</div>${area('可编辑的剧本草稿 JSON', 'segment_draft', json(draft.project), 14)}${button('应用此草稿为新剧本', 'segment-apply', 'class="primary"')}` : ''}</div>
      <div class="card"><h2>变量与收集项</h2><p class="muted">变量支持 number / boolean / string。数值变量可设置 min、max；收集项提供易读名称。</p>${area('变量定义 JSON', 'variables', json(p.variables), 7)}${area('收集项名称 JSON', 'collections', json(p.collections), 5)}${button('保存变量和收集项定义', 'definitions-save')}</div>
      <div class="card"><h2>注入方式</h2>${input('注入深度', 'depth', e.settings.depth, 'number', 'min="0" max="100"')}${checkbox('注入详细剧情（默认使用短指引）', 'detail', e.settings.detail)}${button('保存注入设置', 'injection-save')}</div>
      <div class="card"><h2>导入、备份与草稿</h2><div class="row">${button('导入剧本或进度 JSON', 'import')}${button('导出当前剧本', 'export-project')}${button('备份当前进度', 'export-progress')}${button('重置当前聊天进度', 'reset', 'class="danger"')}</div><p class="muted">剧本分享包和进度备份均不包含 API 密钥。</p>${Object.values(e.settings.drafts || {}).map(v => button('打开草稿：' + v.title, 'draft-load', `data-id="${escape(v.id)}"`)).join(' ')}</div>
      <details><summary>高级：完整剧本 JSON 编辑</summary>${area('当前剧本数据', 'project_json', json(p), 16)}${button('校验并应用 JSON', 'project-json-save')}</details></form>`;
    }
    getForm() { const form = this.shadow.querySelector('form'); return this.values(form?.dataset.form); }
    async action(action, b) {
      const e = this.e; const v = this.getForm(); const ids = raw => String(raw || '').split(/[,，\n]/).map(x => x.trim()).filter(Boolean);
      const n = () => C.indexProject(e.project).nodes.get(this.nodeId);
      const event = () => C.indexProject(e.project).events.get(this.eventId);
      const number = (key, min, max) => { const value = Number(v[key]); C.assert(Number.isFinite(value) && value >= min && value <= max, key + ' 数值超出范围'); return value; };
      if (action === 'close') return this.close();
      if (action === 'tab') { this.capture(); this.tab = b.dataset.tab; this.listPage = 0; this.render(); this.shadow.querySelector('main').scrollTop = 0; return; }
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
        const current = n(); await e.editProject(p => Object.assign(p.nodes.find(x => x.id === current.id), {title: v.title, guidance: v.guidance, detail: v.detail, boundary: v.boundary,
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
      } else if (action === 'api-save' || action === 'api-test') {
        const profile = {base_url: v.base_url.trim(), model: v.model.trim(), key: v.key.trim(), timeout_sec: number('timeout_sec', 5, 300), max_input_chars: number('max_input_chars', 1000, 200000),
          max_output: Math.floor(number('max_output', 128, 16000)), segment_output: Math.floor(number('segment_output', 512, 32000)), json_mode: v.json_mode, no_thinking: v.no_thinking};
        await e.updateSettings({profile, remember_key: v.remember_key, segment_model: v.segment_model.trim(), auto_detect: v.auto_detect,
          wait_ms: number('wait_ms', 0, 15000), batch_size: Math.floor(number('batch_size', 1, 32)), max_batches: Math.floor(number('max_batches', 1, 64))});
        if (action === 'api-test') { const result = await e.client.call(profile, [{role: 'user', content: '只输出 JSON：{"ok":true}'}], {max_tokens: 128}); C.assert(result.ok === true, '服务响应未通过 JSON 测试'); e.saveSettings(); }
        delete this.forms.api;
      } else if (action === 'book-save') await e.saveBook(v.book_save.trim());
      else if (action === 'book-load') { C.assert(v.book_load, '请选择世界书'); const data = await e.loadBook(v.book_load, v.book_project || undefined); this.bookProjects = data.projects; this.nodeId = ''; this.eventId = ''; this.forms = {}; }
      else if (action === 'project-meta') await e.editProject(p => { p.title = v.project_title; p.premise = v.premise; });
      else if (action === 'project-new') {
        const nodeId = C.id('N'); await e.setProject({id: C.id('story'), title: '新剧本', start_node_id: nodeId, nodes: [{id: nodeId, title: '开场', guidance: '', routes: [], effects: []}], events: [], variables: [], collections: []}); this.nodeId = ''; this.eventId = ''; this.forms = {};
      } else if (action === 'open-segment') { this.tab = 'data'; this.render(); this.shadow.querySelector('[name="original_text"]').focus(); return; }
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
      this.win.removeEventListener('resize', this.viewportHandler); this.win.visualViewport?.removeEventListener('resize', this.viewportHandler); this.win.visualViewport?.removeEventListener('scroll', this.viewportHandler); this.element?.remove();
    }
  }
  return {Panel};
});
