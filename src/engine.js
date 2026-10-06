(function (root, factory) {
  const node = typeof window === 'undefined' && typeof module === 'object' && module.exports;
  const value = factory(node ? require('./core.js') : root.BSECore, node ? require('./api.js') : root.BSEApi);
  if (node) module.exports = value; else root.BSEEngine = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C, API) {
  'use strict';
  const defaults = () => ({enabled: false, depth: 0, detail: false, auto_detect: false, wait_ms: 0, batch_size: 4, max_batches: 3, worldbook: '', project_id: '',
    profile: {base_url: '', model: '', key: '', timeout_sec: 45, max_input_chars: 16000, max_output: 1024, segment_output: 4096, json_mode: true, no_thinking: false},
    segment_model: '', usage: {calls: 0, input: 0, output: 0, unknown: 0}});
  async function fingerprint(value) {
    const text = JSON.stringify(value);
    if (globalThis.crypto?.subtle) { const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join(''); }
    // Full source text is rechecked separately even on hosts without WebCrypto.
    let a = 2166136261, b = 5381; for (const ch of text) { a = Math.imul(a ^ ch.charCodeAt(0), 16777619); b = Math.imul(b, 33) ^ ch.charCodeAt(0); }
    return (a >>> 0).toString(16) + (b >>> 0).toString(16) + '_' + text.length;
  }
  class Engine {
    constructor(host, client) {
      this.host = host; this.client = client || new API.Client(); this.settings = defaults();
      this.project = C.demoProject(); this.state = C.createProgress(this.project); this.listeners = new Set();
      this.epoch = 0; this.chat = ''; this.draft = null; this.segmentDraft = null; this.jobs = Promise.resolve(); this.busy = 0; this.error = ''; this.inFlight = new Set();
    }
    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    notify() { for (const fn of this.listeners) { try { fn(); } catch (e) { console.error('[BSE] UI 更新失败', e); } } }
    report(e) { this.error = e.message || String(e); this.notify(); }
    invalidate() {
      this.epoch++; this.client.cancel(); this.inFlight.clear();
      for (const check of this.state.pending_checks) if (['queued', 'checking'].includes(check.status)) { check.status = 'error'; check.error = '配置或进度已变化，请重新检查'; }
    }
    async init() {
      const saved = this.host.readSettings(); this.settings = {...defaults(), ...saved, profile: {...defaults().profile, ...saved.profile}};
      this.client.usage = {...defaults().usage, ...saved.usage};
      if (this.settings.worldbook) {
        try { this.project = (await this.host.loadBook(this.settings.worldbook, this.settings.project_id)).project; }
        catch (e) { this.settings.enabled = false; this.error = e.message; if (saved.draft_project) this.project = C.normalizeProject(saved.draft_project); }
      } else if (saved.drafts?.[saved.project_id] || saved.draft_project) this.project = C.normalizeProject(saved.drafts?.[saved.project_id] || saved.draft_project);
      this.segmentDraft = saved.segment_draft || null;
      const bootError = this.error;
      this.bindChat(); this.error = bootError; this.bindEvents(); this.captureDraft(); this.inject(); this.notify();
    }
    bindChat() {
      this.invalidate(); this.chat = this.host.chatId(); this.draft = null; this.error = '';
      try { this.state = this.host.progress(this.project); }
      catch (e) { this.settings.enabled = false; throw e; }
      for (const check of this.state.pending_checks) if (check.status === 'checking' || check.status === 'queued') { check.status = 'error'; check.error = '任务被中断，可重新检查'; }
      this.publish();
    }
    bindEvents() {
      const safe = task => { Promise.resolve().then(task).catch(e => this.report(e)); };
      this.host.on('MESSAGE_RECEIVED', 'message_received', (messageId, type) => { if (type !== 'quiet' && type !== 'extension') safe(() => this.captureDraft(messageId)); });
      this.host.on('MESSAGE_SWIPED', 'message_swiped', messageId => safe(() => {
        if (Number(messageId) <= (this.state.last_settled_message_id ?? -1)) { this.invalidate(); this.state.paused = true; this.error = '已结算回复被切换，已暂停；请回退相关奖励或恢复备份后继续'; this.save(); }
        this.captureDraft(messageId);
      }));
      this.host.on('MESSAGE_SENT', 'message_sent', messageId => safe(() => this.acceptPrevious(messageId)));
      this.host.on('CHAT_CHANGED', 'chat_id_changed', () => safe(() => { this.bindChat(); this.captureDraft(); this.inject(); this.notify(); }));
      this.host.on('CHAT_CREATED', 'chat_created', () => safe(() => { this.bindChat(); this.captureDraft(); this.inject(); this.notify(); }));
      const before = async () => {
        if (this.settings.wait_ms > 0) await Promise.race([this.jobs, new Promise(resolve => setTimeout(resolve, this.settings.wait_ms))]);
        this.inject();
      };
      this.host.on('GENERATION_AFTER_COMMANDS', 'GENERATION_AFTER_COMMANDS', before);
      this.host.on('GENERATE_BEFORE_COMBINE_PROMPTS', 'generate_before_combine_prompts', () => this.inject());
      for (const [name, fallback] of [['MESSAGE_EDITED', 'message_edited'], ['MESSAGE_DELETED', 'message_deleted'], ['MESSAGE_UPDATED', 'message_updated']]) {
        this.host.on(name, fallback, messageId => safe(() => {
          const affected = this.state.pending_checks.filter(c => c.messages?.some(m => Number(m) >= Number(messageId)));
          const settled = Number(messageId) <= (this.state.last_settled_message_id ?? -1) || this.state.history.some(tx => tx.source?.messages?.some(m => Number(m) >= Number(messageId)));
          if (settled) { this.invalidate(); this.state.paused = true; this.error = '已结算的历史消息发生变化，已暂停剧本；请回退相关操作或恢复进度备份后继续'; this.save(); }
          for (const c of affected) { c.status = 'stale'; c.error = '来源消息已编辑或删除'; }
          this.captureDraft(); this.inject(); this.notify();
        }));
      }
      this.host.on('BSE_SUBMIT_EVENT', 'BSE_SUBMIT_EVENT', data => safe(() => this.manualEvent(data.event_id, data.operation_id, data.source)));
    }
    publish() {
      Promise.resolve(this.host.emit('BSE_STATE_CHANGED', this.snapshot())).catch(e => console.warn('[BSE] 状态监听器出错', e));
      try { this.host.doc()?.dispatchEvent(new this.host.root.CustomEvent('bse:state-changed', {detail: this.snapshot()})); } catch {}
    }
    snapshot() { return C.clone({project_id: this.project.id, current_node_id: this.state.current_node_id, variables: this.state.variables, collected_ids: this.state.collected_ids, completed_node_ids: this.state.completed_node_ids, paused: this.state.paused}); }
    save() { C.assert(this.host.chatId() === this.chat, '聊天已切换，当前操作未保存'); this.host.saveProgress(this.project, this.state); this.publish(); this.inject(); this.notify(); }
    saveSettings() {
      this.settings.usage = C.clone(this.client.usage);
      const stored = C.clone(this.settings); if (!stored.remember_key) stored.profile.key = '';
      this.host.saveSettings(stored);
    }
    inject() { this.host.inject(this.settings.enabled ? C.prompt(this.project, this.state, {detail: this.settings.detail}) : '', this.settings.depth); }
    async updateSettings(values) {
      this.invalidate(); this.settings = {...this.settings, ...values, profile: {...this.settings.profile, ...values.profile}};
      this.saveSettings(); this.inject(); this.notify();
    }
    persistProject() {
      this.settings.drafts ||= {};
      if (!this.settings.worldbook) this.settings.drafts[this.project.id] = C.clone(this.project);
      this.settings.project_id = this.project.id; this.saveSettings();
    }
    async setProject(input, detached = true) {
      const p = C.normalizeProject(input); const state = this.host.progress(p);
      this.settings.drafts ||= {};
      if (!this.settings.worldbook) this.settings.drafts[this.project.id] = C.clone(this.project);
      this.invalidate(); this.project = p; this.state = state; this.segmentDraft = null; this.draft = null;
      if (detached) this.settings.worldbook = '';
      this.persistProject(); this.save(); this.captureDraft();
    }
    async editProject(mutator) {
      const p = C.clone(this.project); mutator(p); p.revision = C.id('rev');
      const normalized = C.normalizeProject(p); const state = C.migrateProgress(C.clone(this.state), normalized);
      this.invalidate(); const epoch = this.epoch; const chat = this.chat;
      if (this.settings.worldbook) await this.host.saveBook(this.settings.worldbook, normalized);
      C.assert(epoch === this.epoch && chat === this.host.chatId(), '保存期间聊天或配置已变化，请重新读取剧本后核对');
      this.invalidate(); this.project = normalized; this.state = state; this.persistProject(); this.save();
    }
    async loadBook(name, projectId) {
      const epoch = this.epoch; const data = await this.host.loadBook(name, projectId);
      C.assert(epoch === this.epoch, '读取期间聊天或配置已变化，请重试'); await this.setProject(data.project, true);
      this.settings.worldbook = name; delete this.settings.draft_project; delete this.settings.drafts?.[this.project.id]; this.saveSettings(); this.notify(); return data;
    }
    async saveBook(name) {
      const epoch = this.epoch; await this.host.saveBook(name, this.project);
      C.assert(epoch === this.epoch, '保存期间聊天或配置已变化，请重新读取该世界书核对');
      this.settings.worldbook = name; this.settings.project_id = this.project.id;
      delete this.settings.draft_project; delete this.settings.drafts?.[this.project.id]; this.saveSettings(); this.notify();
    }
    mutate(fn) { this.invalidate(); this.error = ''; const changed = fn(); if (changed !== false) this.save(); return changed; }
    complete() { return this.mutate(() => C.completeNode(this.state, this.project)); }
    enter(target) { return this.mutate(() => C.enterNode(this.state, this.project, target)); }
    pause() { return this.mutate(() => { this.state.paused = !this.state.paused; this.state.revision++; }); }
    undo() { return this.mutate(() => C.undo(this.state)); }
    async manualEvent(eventId, operationId, source) {
      const event = C.indexProject(this.project).events.get(eventId); C.assert(event, '事件 ID 不存在');
      let key = operationId || 'manual';
      if (!operationId && event.repeat_policy === 'once_per_accepted_turn') {
        let m = this.host.latest();
        while (m && m.role !== 'assistant' && m.message_id > 0) m = this.host.message(m.message_id - 1);
        C.assert(m?.role === 'assistant', '每轮事件需要一条 AI 回复作为来源');
        const pair = this.host.pair(m.message_id);
        const epoch = this.epoch; key = await fingerprint(pair.messages);
        C.assert(epoch === this.epoch, '聊天或配置已变化');
        source ||= {assistant_id: m.message_id, messages: pair.messages.map(m => m.message_id)};
      }
      return this.mutate(() => C.settleEvent(this.state, this.project, eventId, key, source));
    }
    async captureDraft(messageId) {
      const latest = this.host.latest(); const msg = messageId == null ? latest : this.host.message(messageId);
      if (msg?.role === 'assistant' && (!latest || msg.message_id === latest.message_id)) {
        this.draft = this.host.pair(msg.message_id); this.notify();
      }
    }
    async acceptPrevious(messageId) {
      if (!this.settings.enabled || this.state.paused) return;
      const message = messageId == null ? this.host.latest() : this.host.message(messageId);
      if (message?.role !== 'user') return;
      let previous = null;
      for (let i = message.message_id - 1; i >= Math.max(0, message.message_id - 12); i--) {
        const m = this.host.message(i); if (m?.role === 'assistant') { previous = m; break; } if (m?.role === 'user') break;
      }
      if (previous) await this.acceptPair(this.host.pair(previous.message_id), false);
    }
    async checkLatest() {
      C.assert(this.settings.enabled && !this.state.paused, '请先启用剧本并解除暂停');
      const latest = this.host.latest(); const pair = this.draft || (latest?.role === 'assistant' ? this.host.pair(latest.message_id) : null);
      C.assert(pair, '当前没有可确认的 AI 回复'); return this.acceptPair(pair, true);
    }
    async acceptPair(pair, force) {
      C.assert(pair && pair.messages.length, '没有可检查的对话');
      if (!force && !this.settings.auto_detect) return;
      const epoch = this.epoch; const chat = this.chat; const project = this.project; const scopeNode = this.state.current_node_id;
      const key = await fingerprint(pair.messages);
      if (epoch !== this.epoch || chat !== this.chat) return;
      if (this.state.accepted_turns[key] || this.inFlight.has(key)) return;
      const existing = this.state.pending_checks.find(c => c.key === key);
      if (existing && !['error', 'stale'].includes(existing.status)) return;
      const candidates = C.eligibleEvents(project, this.state, scopeNode);
      if (!candidates.length) { this.error = '当前没有符合范围和前置条件的 API 事件'; this.notify(); return; }
      let check = existing || {key, assistant_id: pair.assistant_id, messages: pair.messages.map(m => m.message_id), node_id: scopeNode, project_revision: project.revision, results: [], checked_ids: [], at: Date.now()};
      check.status = 'queued'; check.error = ''; if (!existing) this.state.pending_checks.push(check);
      this.inFlight.add(key); this.save();
      const job = async () => {
        if (epoch !== this.epoch || chat !== this.chat) return;
        this.busy++; check.status = 'checking'; this.notify();
        const sameSource = () => JSON.stringify(this.host.pair(pair.assistant_id)?.messages) === JSON.stringify(pair.messages);
        try {
          const remaining = candidates.filter(e => !check.checked_ids.includes(e.id));
          const roundLimit = this.settings.batch_size * this.settings.max_batches;
          for (let i = 0; i < Math.min(remaining.length, roundLimit); i += this.settings.batch_size) {
            const batch = remaining.slice(i, i + this.settings.batch_size);
            if (!batch.length) continue;
            if (epoch !== this.epoch || this.host.chatId() !== chat || !sameSource()) throw new Error('来源对话或剧本已变化，本次判断未结算');
            const node = C.indexProject(project).nodes.get(scopeNode);
            const facts = {node: node.title, known_variables: Object.fromEntries(node.context_variables.map(k => [k, this.state.variables[k]]))};
            const results = await this.client.detect(this.settings.profile, pair.messages, batch, facts);
            if (epoch !== this.epoch || this.host.chatId() !== chat || !sameSource()) throw new Error('返回结果已过期，未结算');
            for (const result of results) {
              const record = {...result, source_key: key, source: {assistant_id: pair.assistant_id, messages: check.messages}, node_id: scopeNode, handled: false};
              check.results.push(record);
            }
            check.checked_ids.push(...batch.map(e => e.id));
          }
          if (epoch !== this.epoch || !sameSource()) throw new Error('结果已过期');
          for (const eventId of check.results.map(r => r.event_id)) {
            const record = check.results.find(r => r.event_id === eventId);
            const event = C.indexProject(project).events.get(record.event_id);
            if (!record.handled && record.status === 'completed' && event.auto_settle) {
              C.settleEvent(this.state, project, event.id, key, record.source, scopeNode);
              check = this.state.pending_checks.find(c => c.key === key);
              check.results.find(r => r.event_id === eventId).handled = true;
            }
          }
          check.remaining_count = Math.max(0, remaining.length - roundLimit);
          check.status = check.remaining_count ? 'partial' : 'done';
          check.error = check.remaining_count ? '本轮预算已用完，仍有 ' + check.remaining_count + ' 个候选未检查；可继续检查。' : '';
          if (!check.remaining_count) this.state.accepted_turns[key] = true;
          this.state.pending_checks = this.state.pending_checks.filter(c => c.status !== 'done' || c.results.some(r => !r.handled && ['completed', 'uncertain'].includes(r.status))).concat([]);
          // Keep recent completed evidence only; unhandled checks are never silently discarded.
          this.save(); this.saveSettings();
        } catch (e) {
          if (epoch === this.epoch && chat === this.chat) { check.status = 'error'; check.error = e.message; this.save(); this.saveSettings(); }
        } finally { this.busy--; this.inFlight.delete(key); this.notify(); }
      };
      this.jobs = this.jobs.catch(() => {}).then(job); return this.jobs;
    }
    async retryCheck(key) {
      const check = this.state.pending_checks.find(c => c.key === key); C.assert(check, '记录不存在');
      const pair = this.host.pair(check.assistant_id); C.assert(pair && await fingerprint(pair.messages) === key, '来源对话已变化，不能重用此检查');
      delete this.state.accepted_turns[key]; check.status = 'error'; return this.acceptPair(pair, true);
    }
    async confirmResult(key, eventId, accept) {
      let check = this.state.pending_checks.find(c => c.key === key); let r = check?.results.find(r => r.event_id === eventId && !r.handled);
      C.assert(r, '待确认结果不存在'); C.assert(check.project_revision === this.project.revision, '剧本已修改，请重新识别');
      const pair = this.host.pair(check.assistant_id);
      const epoch = this.epoch;
      C.assert(pair && await fingerprint(pair.messages) === key && epoch === this.epoch, '来源消息已变化，不能结算旧判断');
      return this.mutate(() => {
        if (accept) {
          C.settleEvent(this.state, this.project, eventId, key, r.source, r.node_id);
          check = this.state.pending_checks.find(c => c.key === key);
          r = check.results.find(r => r.event_id === eventId);
        }
        r.handled = true; r.resolution = accept ? 'accepted' : 'dismissed';
        if (check.results.every(x => x.handled || !['completed', 'uncertain'].includes(x.status))) this.state.pending_checks = this.state.pending_checks.filter(c => c !== check);
      });
    }
    async segment(text, wish) {
      const epoch = this.epoch; this.busy++; this.notify();
      try {
        const profile = {...this.settings.profile, model: this.settings.segment_model || this.settings.profile.model};
        const result = await this.client.segment(profile, text, wish);
        C.assert(epoch === this.epoch, '配置已变化，整理结果未应用');
        this.segmentDraft = result; this.settings.segment_draft = C.clone(result); this.saveSettings(); this.notify(); return result;
      } finally { this.busy--; this.notify(); }
    }
    async applySegment() { C.assert(this.segmentDraft, '没有可应用的拆分草稿'); const p = this.segmentDraft.project; await this.setProject(p); delete this.settings.segment_draft; this.saveSettings(); }
    exportProject() { return C.clone({type: 'bse_project', version: 1, project: this.project}); }
    exportProgress() { return C.clone({type: 'bse_progress', version: 1, project_id: this.project.id, progress: this.state}); }
    importProgress(data) {
      C.assert(data.type === 'bse_progress' && data.project_id === this.project.id, '进度备份不属于当前剧本');
      const state = C.migrateProgress(C.clone(data.progress), this.project);
      this.invalidate(); this.state = state; this.save();
    }
    destroy() { this.invalidate(); this.host.destroy(); this.listeners.clear(); }
  }
  return {Engine, defaults, fingerprint};
});
