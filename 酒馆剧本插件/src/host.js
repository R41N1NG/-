(function (root, factory) {
  const value = factory(typeof window === 'undefined' && typeof module === 'object' && module.exports ? require('./core.js') : root.BSECore);
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = value; else root.BSEHost = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C) {
  'use strict';
  const STATE_KEY = 'branch_story_engine';
  const SETTINGS_KEY = 'branch_story_settings';
  const INJECT_ID = 'branch_story_current_node_v1';
  class Host {
    constructor(root) { this.root = root; this.stops = []; }
    owners() {
      const r = this.root; const list = [r, r.TavernHelper];
      try { if (r.parent && r.parent !== r) list.push(r.parent, r.parent.TavernHelper); } catch {}
      return list.filter(Boolean);
    }
    api(name) {
      for (const owner of this.owners()) {
        const bound = owner._bind?.['_' + name];
        if (typeof bound === 'function') return bound.bind(this.root);
        if (typeof owner[name] === 'function') return owner[name].bind(owner);
      }
      return null;
    }
    context() { for (const owner of this.owners()) if (owner.SillyTavern?.getContext) return owner.SillyTavern.getContext(); return null; }
    chatId() { const api = this.api('getCurrentChatId'); try { return String(api?.() || this.context()?.chatId || 'current'); } catch { return 'current'; } }
    doc() { try { if (this.root.parent?.document?.body) return this.root.parent.document; } catch {} return this.root.document; }
    variables(type) { return this.api('getVariables')?.({type}) || {}; }
    write(type, key, value) {
      const update = this.api('updateVariablesWith'); C.assert(update, '酒馆助手缺少 updateVariablesWith，请更新扩展');
      update(v => { v[key] = C.clone(value); return v; }, {type});
    }
    readSettings() { return this.variables('script')[SETTINGS_KEY] || {}; }
    boundVariables(definitions) {
      const raw = this.variables('chat'), out = {};
      for (const def of definitions) if (def.binding) {
        let value = raw; for (const part of def.binding.path) value = value && typeof value === 'object' && C.own(value, part) ? value[part] : undefined;
        C.assert(typeof value === def.type && (def.type !== 'number' || Number.isFinite(value) && (def.min == null || value >= def.min) && (def.max == null || value <= def.max)), '外部聊天变量不存在、类型不符或超出范围：' + def.id + ' (' + def.binding.path.join('.') + ')');
        out[def.id] = value;
      }
      return out;
    }
    saveSettings(settings) { this.write('script', SETTINGS_KEY, settings); }
    progress(project) {
      const state = this.variables('chat')[STATE_KEY]?.projects?.[project.id];
      return state ? C.migrateProgress(C.clone(state), project) : C.createProgress(project);
    }
    saveProgress(project, state) {
      const update = this.api('updateVariablesWith'); C.assert(update, '无法保存聊天进度，请检查酒馆助手');
      update(v => {
        v[STATE_KEY] ||= {schema_version: 1, projects: {}};
        v[STATE_KEY].projects ||= {};
        v[STATE_KEY].projects[project.id] = C.clone(state);
        return v;
      }, {type: 'chat'});
    }
    message(messageId) { return this.api('getChatMessages')?.(messageId, {role: 'all', hide_state: 'all'})?.[0] || null; }
    latest() { return this.message(-1); }
    pair(assistantId) {
      const a = this.message(assistantId); if (!a || a.role !== 'assistant') return null;
      let u = null;
      for (let i = a.message_id - 1; i >= Math.max(0, a.message_id - 12); i--) { const m = this.message(i); if (m?.role === 'user') { u = m; break; } }
      return {assistant_id: a.message_id, messages: [u, a].filter(Boolean).map(m => ({message_id: String(m.message_id), role: m.role, name: m.name || '', text: m.message || m.mes || ''}))};
    }
    inject(text, depth) {
      this.uninject();
      if (text) { const api = this.api('injectPrompts'); C.assert(api, '酒馆助手缺少提示词注入接口'); api([{id: INJECT_ID, position: 'in_chat', role: 'system', depth, content: '\n\n' + text + '\n', should_scan: false}]); }
    }
    uninject() { this.api('uninjectPrompts')?.([INJECT_ID]); }
    on(name, fallback, listener) {
      const r = this.root; const events = r.tavern_events || this.owners().find(o => o.tavern_events)?.tavern_events || {};
      const result = this.api('eventOn')?.(events[name] || this.context()?.eventTypes?.[name] || fallback, listener);
      if (result?.stop) this.stops.push(result.stop);
    }
    emit(name, data) { return this.api('eventEmit')?.(name, data); }
    books() { C.assert(this.api('getWorldbookNames'), '当前酒馆助手没有世界书接口，请更新扩展'); return this.api('getWorldbookNames')(); }
    async loadBook(name, projectId) {
      const get = this.api('getWorldbook'); C.assert(get, '当前酒馆助手缺少 getWorldbook');
      const entries = await get(name); const items = [];
      for (const entry of entries) {
        try { const item = C.parseJSON(entry.content); if (item.bse_schema === 1) items.push(item); } catch {}
      }
      const manifests = items.filter(v => v.kind === 'manifest');
      const manifest = projectId ? manifests.find(v => v.project_id === projectId) : manifests[0];
      C.assert(manifest, '此世界书没有插件剧本。可先新建剧本，再写入世界书');
      const find = kind => items.filter(v => v.project_id === manifest.project_id && v.kind === kind);
      const nodes = new Map(find('node').map(v => [v.data.id, v.data])); const events = new Map(find('event').map(v => [v.data.id, v.data]));
      const p = C.clone(manifest.data);
      p.nodes = p.node_ids.map(k => { C.assert(nodes.has(k), '世界书缺少节点条目：' + k); return nodes.get(k); });
      p.events = p.event_ids.map(k => { C.assert(events.has(k), '世界书缺少事件条目：' + k); return events.get(k); });
      delete p.node_ids; delete p.event_ids;
      return {project: C.normalizeProject(p), projects: manifests.map(m => ({id: m.project_id, title: m.data.title}))};
    }
    async listBookProjects(name) {
      const entries = await this.api('getWorldbook')?.(name); C.assert(Array.isArray(entries), '世界书不可读取');
      const items = [];
      for (const entry of entries) {
        let value; try { value = C.parseJSON(entry.content); } catch { continue; }
        if (value?.bse_schema === 1 && value.kind === 'manifest') { C.safeId(value.project_id); items.push({id:value.project_id,title:String(value.data.title || value.project_id)}); }
      }
      return items;
    }
    async saveBook(name, input) {
      const p = C.normalizeProject(input); const names = this.books();
      C.assert(name.trim(), '请填写世界书名称');
      const update = this.api('updateWorldbookWith'); C.assert(update, '当前酒馆助手缺少 updateWorldbookWith');
      if (!names.includes(name)) { const create = this.api('createWorldbook'); C.assert(create, '当前酒馆助手不能创建世界书'); const created = await create(name); C.assert(created, '世界书名称发生冲突，请重新选择'); }
      const meta = C.clone(p); delete meta.nodes; delete meta.events; meta.node_ids = p.nodes.map(n => n.id); meta.event_ids = p.events.map(e => e.id);
      const parts = [{kind: 'manifest', id: p.id, data: meta}, ...p.nodes.map(data => ({kind: 'node', id: data.id, data})), ...p.events.map(data => ({kind: 'event', id: data.id, data}))];
      await update(name, entries => {
        const old = new Map(); const unrelated = [];
        for (const entry of entries) {
          let item = null; try { item = C.parseJSON(entry.content); } catch {}
          if (item?.bse_schema === 1 && item.project_id === p.id) old.set(item.kind + ':' + item.data.id, entry);
          else unrelated.push(entry);
        }
        return unrelated.concat(parts.map(part => ({...(old.get(part.kind + ':' + part.id) || {}),
          name: '[BSE] ' + (part.kind === 'manifest' ? p.title : part.data.title), enabled: false,
          strategy: {type: 'constant'}, recursion: {prevent_incoming: true, prevent_outgoing: true, delay_until: null},
          content: JSON.stringify({bse_schema: 1, project_id: p.id, kind: part.kind, data: part.data}, null, 2),
        })));
      });
    }
    destroy() { this.stops.forEach(stop => { try { stop(); } catch {} }); this.stops = []; this.uninject(); }
  }
  return {Host, STATE_KEY, SETTINGS_KEY, INJECT_ID};
});
