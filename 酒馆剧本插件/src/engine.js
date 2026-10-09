(function (root, factory) {
  const node = typeof window === 'undefined' && typeof module === 'object' && module.exports;
  const value = factory(node ? require('./core.js') : root.BSECore, node ? require('./api.js') : root.BSEApi, node ? require('./flow.js') : root.BSEFlow, node ? require('./companion.js') : root.BSECompanion);
  if (node) module.exports = value; else root.BSEEngine = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C, API, F, R) {
  'use strict';
  const VERSION = '1.5.1';
  const defaults = () => ({enabled: false, runtime_mode:'companion', checkpoint_every:3, companion_prompt:R.PROMPT, depth: 0, detail: false, auto_detect: false, auto_events: true, quick_options: false, quick_collapsed: false, story_flow: true, auto_stage: true, launcher_position: null, wait_ms: 0, batch_size: 4, max_batches: 3, worldbook: '', project_id: '',
    profile: {checkpoint_prompt:API.PROMPTS.checkpoint,author_review:true, review_model:'', review_prompt:API.PROMPTS.review, review_script_prompt:API.PROMPTS.review_script, repair_source_prompt:API.PROMPTS.repair_source, repair_variables_prompt:API.PROMPTS.repair_variables, repair_evidence_prompt:API.PROMPTS.repair_evidence, base_url: '', model: '', key: '', timeout_sec: 45, analysis_timeout_sec: 600, max_input_chars: 64000, max_output: 1024, segment_output: 16384, analysis_output: 16384, detect_prompt: API.PROMPTS.detect, choice_prompt: API.PROMPTS.choice, stage_prompt: API.PROMPTS.stage, segment_prompt: API.PROMPTS.segment, analysis_prompt: API.PROMPTS.analysis, analysis_merge_prompt: API.PROMPTS.merge, partition_prompt: API.PROMPTS.partition, auto_partition: true, analysis_chunk_chars: 3000, json_mode: true, no_thinking: false},
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
      this.host = host; this.client = client || new API.Client(); this.settings = defaults(); this.version = VERSION;
      this.project = C.demoProject(); this.state = C.createProgress(this.project); this.listeners = new Set();
      this.epoch = 0; this.chat = ''; this.draft = null; this.segmentDraft = null; this.analysisDraft = null; this.rawAnalysis = null; this.analysisProgress = null; this.jobs = Promise.resolve(); this.stageJobs = Promise.resolve(); this.busy = 0; this.error = ''; this.flowNotice = ''; this.pendingChoice = null; this.preparing = null; this.stageInFlight = new Map(); this.inFlight = new Set();
    }
    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    notify() { for (const fn of this.listeners) { try { fn(); } catch (e) { console.error('[BSE] UI 更新失败', e); } } }
    report(e) { this.error = e.message || String(e); this.notify(); }
    invalidate(reason = '配置或进度已变化') {
      this.epoch++; this.client.cancel(reason); this.inFlight.clear();
      this.pendingChoice = null; this.preparing = null;
      this.checkpointJob=null;this.stageInFlight.clear(); this.flowNotice = '';
      for (const check of this.state.pending_checks) if (['queued', 'checking'].includes(check.status)) { check.status = 'error'; check.error = '配置或进度已变化，请重新检查'; }
    }
    async init() {
      const saved = this.host.readSettings(); this.settings = {...defaults(), ...saved, profile: {...defaults().profile, ...saved.profile}};
      if(saved.runtime_mode==='legacy' && saved.profile?.author_review==null)this.settings.profile.author_review=false;
      for (const [key, field] of [['segment', 'segment_prompt'], ['analysis', 'analysis_prompt'], ['merge', 'analysis_merge_prompt'], ['detect', 'detect_prompt']]) {
        if ([API.LEGACY_PROMPTS[key], API.PREVIOUS_PROMPTS[key], API.LAST_PROMPTS[key], API.V140_PROMPTS[key], API.V141_PROMPTS[key], API.V142_PROMPTS[key], API.V144_PROMPTS[key], API.V146_PROMPTS[key]].filter(Boolean).includes(this.settings.profile[field])) this.settings.profile[field] = API.PROMPTS[key];
      }
      for (const [key, old, value] of [['max_input_chars', 16000, 64000], ['analysis_output', 8192, 16384], ['segment_output', 4096, 16384]]) if (saved.profile?.[key] === old) this.settings.profile[key] = value;
      this.client.usage = {...defaults().usage, ...saved.usage};
      if (this.settings.worldbook) {
        try { this.project = (await this.host.loadBook(this.settings.worldbook, this.settings.project_id)).project; }
        catch (e) { this.settings.enabled = false; this.error = e.message; if (saved.draft_project) this.project = C.normalizeProject(saved.draft_project); }
      } else if (saved.drafts?.[saved.project_id] || saved.draft_project) this.project = C.normalizeProject(saved.drafts?.[saved.project_id] || saved.draft_project);
      this.segmentDraft = saved.segment_draft || null;
      this.analysisDraft = saved.analysis_draft || null;
      this.rawAnalysis = saved.raw_analysis || null;
      if (this.destroyed) return;
      this.card=this.host.card?.() || {id:'unbound',name:'未识别角色卡'};
      this.settings.project_library ||= {};
      for (const p of Object.values(saved.drafts || {})) if (p?.id) this.settings.project_library[p.id] ||= {title:p.title, worldbook:'', updated_at:0};
      for(const item of Object.values(this.settings.project_library))item.card_id ||= this.card.id;
      const bootError = this.error;
      this.bindChat(); this.error = bootError || this.error; this.bindEvents(); this.captureDraft(); this.inject(); this.notify();
    }
    bindChat() {
      const nextCard=this.host.card?.() || {id:'unbound',name:'未识别角色卡'}, oldCard=this.card;
      if(oldCard && oldCard.id!==nextCard.id){this.parkWorkspace();this.settings.enabled=false;}
      this.card=nextCard;
      const selected=this.host.activeProject?.(this.card.id) || this.settings.card_projects?.[this.card.id];
      const currentItem=this.settings.project_library?.[this.project.id];
      const foreign=currentItem?.card_id && currentItem.card_id!==this.card.id;
      if(selected && this.settings.drafts?.[selected] && this.settings.project_library?.[selected]?.card_id===this.card.id){
        if(this.project.id!==selected){this.project=C.normalizeProject(this.settings.drafts[selected]);this.restoreWorkspace(selected);this.settings.enabled=false;}
      }else if(foreign){
        this.project=C.normalizeProject({id:C.id('story'),title:this.card.name+' · 新剧本',nodes:[{id:'N1',title:'开场',guidance:'请配置当前阶段。',routes:[],effects:[]}],events:[],variables:[],collections:[],start_node_id:'N1'});this.restoreWorkspace(this.project.id);this.settings.enabled=false;
      }
      this.settings.worldbook=this.settings.project_library?.[this.project.id]?.worldbook || '';
      this.persistProject();
      this.invalidate('聊天已切换或重新载入'); this.chat = this.host.chatId(); this.draft = null; this.error = '';
      try { const state = this.host.progress(this.project); F.initialize(this.project, state); this.state = state; }
      catch (e) { this.settings.enabled = false; this.host.inject('', this.settings.depth); throw e; }
      for (const check of this.state.pending_checks) if (check.status === 'checking' || check.status === 'queued') { check.status = 'error'; check.error = '任务被中断，可重新检查'; }
      R.init(this.state); F.initialize(this.project, this.state); if (this.settings.enabled && this.diagnostics().some(x => x.severity === 'error')) { this.settings.enabled = false; this.error = '依赖检查未通过，请核对记录页的关系图'; this.saveSettings(); } F.sync(this.project, this.state, this.settings.enabled);
      this.publish();this.notify();
    }
    bindEvents() {
      const safe = task => { Promise.resolve().then(task).catch(e => this.report(e)); };
      this.host.on('MESSAGE_RECEIVED', 'message_received', (messageId, type) => { if (type !== 'quiet' && type !== 'extension') safe(() => this.captureDraft(messageId)); });
      this.host.on('GENERATION_ENDED', 'generation_ended', () => safe(async () => {
        await this.captureDraft(); if(this.settings.runtime_mode==='companion'){await this.processCompanion();return;} const pair = this.draft, scopeNode = this.state.current_node_id, epoch = this.epoch;
        const candidates = C.eligibleEvents(this.project, this.state, scopeNode).filter(e => !e.completion_node_id).map(e => e.id);
        if (this.settings.auto_stage) await this.checkStage();
        if (epoch === this.epoch && this.settings.enabled && !this.state.paused && this.settings.auto_events && pair && candidates.length && this.settings.profile.base_url && this.settings.profile.model) await this.acceptPair(pair, true, {scopeNode, ids: candidates});
      }));
      this.host.on('MESSAGE_SWIPED', 'message_swiped', messageId => safe(() => {
        if (Number(messageId) <= Math.max(this.state.last_settled_message_id ?? -1, this.state.last_stage_message_id ?? -1)) { this.invalidate(); this.state.paused = true; F.clearWork(this.state); this.error = '已确认阶段或结算回复被切换，已暂停；请回退相关操作或恢复备份后继续'; this.save(); }
        this.captureDraft(messageId);
      }));
      this.host.on('MESSAGE_SENT', 'message_sent', async messageId => {
        try { await this.acceptPrevious(messageId); await this.prepareTurn(messageId); }
        catch (e) { this.report(e); throw e; }
      });
      this.host.on('CHAT_CHANGED', 'chat_id_changed', () => safe(() => { this.bindChat(); this.captureDraft(); this.inject(); this.notify(); }));
      this.host.on('CHARACTER_SELECTED','character_selected',()=>safe(()=>{this.bindChat();this.inject();this.notify();}));
      this.host.on('CHAT_CREATED', 'chat_created', () => safe(() => { this.bindChat(); this.captureDraft(); this.inject(); this.notify(); }));
      const before = async (type, options, dryRun) => {
        if (dryRun === true || type === 'quiet') return;
        // Native GENERATION_AFTER_COMMANDS runs before the new user message is appended.
        // MESSAGE_SENT is awaited by the host; the later combine hook is a second barrier.
        const pendingInput = this.host.doc()?.querySelector('#send_textarea, #chatinput')?.value;
        if (!(typeof type === 'string' && !['regenerate', 'swipe', 'continue'].includes(type) && pendingInput?.trim())) {
          try { await this.prepareTurn(); } catch (e) { this.report(e); throw e; }
        } else if(this.settings.runtime_mode!=='companion')await this.stageJobs;
        if (this.settings.wait_ms > 0) await Promise.race([this.jobs, new Promise(resolve => setTimeout(resolve, this.settings.wait_ms))]);
        this.inject();
      };
      this.host.on('GENERATION_AFTER_COMMANDS', 'GENERATION_AFTER_COMMANDS', before);
      this.host.on('GENERATE_BEFORE_COMBINE_PROMPTS', 'generate_before_combine_prompts', before);
      for (const [name, fallback] of [['MESSAGE_EDITED', 'message_edited'], ['MESSAGE_DELETED', 'message_deleted'], ['MESSAGE_UPDATED', 'message_updated']]) {
        this.host.on(name, fallback, messageId => safe(() => {
          const affected = this.state.pending_checks.filter(c => c.messages?.some(m => Number(m) >= Number(messageId)));
          const settled = Number(messageId) <= (this.state.last_settled_message_id ?? -1) || this.state.history.some(tx => tx.source?.messages?.some(m => Number(m) >= Number(messageId)));
          const stageChanged = Number(messageId) <= (this.state.last_stage_message_id ?? -1);
          if (settled || stageChanged) { this.invalidate(); this.state.paused = true; F.clearWork(this.state); if(this.project.continuity_policy==='preserve_current'){this.state.paused=false;R.init(this.state).continuity_hold=true;}R.log(this.state,'source_changed','已结算来源变化；保留已演剧情，暂停推进等待作者处理',{message_id:Number(messageId)}); this.error = '已结算来源变化，已保留故事和存档并暂停；请在记录页处理，不自动倒带'; this.save(); }
          for (const c of affected) { c.status = 'stale'; c.error = '来源消息已编辑或删除'; }
          this.captureDraft(); this.inject(); this.notify();
        }));
      }
      this.host.on('BSE_REQUEST_STATE','BSE_REQUEST_STATE',()=>this.publish());
      this.host.on('BSE_SUBMIT_EVENT', 'BSE_SUBMIT_EVENT', data => safe(() => this.manualEvent(data.event_id, data.operation_id, data.source)));
    }
    publish() {
      this.host.renderState?.(this.snapshot(),R.init(this.state).message_snapshots);
      Promise.resolve(this.host.emit('BSE_STATE_CHANGED', this.snapshot())).catch(e => console.warn('[BSE] 状态监听器出错', e));
      try { this.host.doc()?.dispatchEvent(new this.host.root.CustomEvent('bse:state-changed', {detail: this.snapshot()})); } catch {}
    }
    valueSnapshot(){const snap=this.snapshot();return {card_id:snap.card_id,project_id:snap.project_id,chat_id:snap.chat_id,variables:snap.variables};}
    snapshot() { return C.clone({card_id:this.card?.id || 'unbound',card_name:this.card?.name || '',chat_id:this.chat,project_id: this.project.id, current_node_id: this.state.current_node_id, focus_package_id: this.state.focus_package_id || '', packages: Object.fromEntries(Object.entries(this.state.package_progress || {}).map(([id, v]) => [id, {current_node_id: v.current_node_id, status: v.status}])), variables: this.state.variables, collected_ids: this.state.collected_ids, completed_node_ids: this.state.completed_node_ids, paused: this.state.paused}); }
    save() { C.assert(this.host.chatId() === this.chat, '聊天已切换，当前操作未保存'); F.sync(this.project, this.state, this.settings.enabled); this.host.saveProgress(this.project, this.state); this.publish(); this.inject(); this.notify(); }
    saveSettings() {
      this.settings.usage = C.clone(this.client.usage);
      const stored = C.clone(this.settings); if (!stored.remember_key) stored.profile.key = '';
      this.host.saveSettings(stored);
    }
    inject() {
      let text=this.settings.enabled?F.prompt(this.project,this.state,{detail:this.settings.detail}):'';
      if(text && R.init(this.state).continuity_hold)text+='\n当前场景已发生的故事保留。仅演绎本场景的非关键互动，不发放新结果，不进入后续阶段。';
      if(text && this.settings.runtime_mode==='companion' && !this.state.paused) {
        const q=R.init(this.state), turn=q.turn;
        text+='\n未提供的后续剧情不得自行越过；行动失败时自然演绎当前场景。未核验的关键结果不能作为通行依据。';
        if(turn)text+='\n'+(this.settings.companion_prompt || R.PROMPT)+'\n'+JSON.stringify(turn.spec);
        const present=this.project.actors.filter(a=>q.present.includes(a.id));
        const vars=this.project.variables.filter(v=>present.some(a=>a.id===v.owner));
        if(vars.length)text+='\n在场角色已确认数值：'+JSON.stringify(Object.fromEntries(vars.map(v=>[v.id,this.state.variables[v.id]])));
      }
      this.host.inject(text,this.settings.depth);
    }
    async updateSettings(values) {
      if(values.runtime_mode!=null)C.assert(['companion','legacy'].includes(values.runtime_mode),'运行模式无效');
      if(values.checkpoint_every!=null)C.assert(Number.isSafeInteger(values.checkpoint_every) && values.checkpoint_every>=1 && values.checkpoint_every<=20,'核验间隔须为1～20回合');
      if (values.enabled === true) F.assertRunnable(this.project);
      this.invalidate(); this.settings = {...this.settings, ...values, profile: {...this.settings.profile, ...values.profile}};
      this.saveSettings(); this.save();
    }
    persistProject() {
      this.settings.drafts ||= {};
      this.settings.drafts[this.project.id] = C.clone(this.project);
      this.settings.project_library ||= {};
      this.settings.project_library[this.project.id] = {title:this.project.title,worldbook:this.settings.worldbook || '',card_id:this.card?.id || this.host.card?.().id || 'unbound',updated_at:Date.now()};
      this.settings.card_projects ||= {};this.settings.card_projects[this.card?.id || 'unbound']=this.project.id;
      this.settings.project_id = this.project.id; this.saveSettings();
    }
    projectList() {
      return Object.entries(this.settings.project_library || {}).filter(([,item])=>!item.card_id || item.card_id===(this.card?.id || 'unbound')).map(([id, item]) => ({id, ...C.clone(item), current: id === this.project.id, nodes: this.settings.drafts?.[id]?.nodes?.length || 0}));
    }
    parkWorkspace() {
      this.settings.project_workspaces ||= {};
      this.settings.project_workspaces[this.project.id] = C.clone({analysis_draft:this.analysisDraft, segment_draft:this.segmentDraft, raw_analysis:this.rawAnalysis});
    }
    restoreWorkspace(id) {
      const workspace = this.settings.project_workspaces?.[id] || {};
      for (const [field, property] of [['analysis_draft','analysisDraft'], ['segment_draft','segmentDraft'], ['raw_analysis','rawAnalysis']]) {
        this[property] = workspace[field] || null;
        if (this[property]) this.settings[field] = C.clone(this[property]); else delete this.settings[field];
      }
      delete this.settings.project_workspaces?.[id];
    }
    async switchProject(id) {
      C.assert(!this.busy, '请先等待或取消当前辅助任务，再切换剧本');
      const item = this.settings.project_library?.[id]; C.assert(item && (!item.card_id || item.card_id===this.card.id), '剧本不在当前角色卡的库中'); const epoch = this.epoch;
      if (id === this.project.id && (item.worldbook || '') === this.settings.worldbook) return;
      const p = item.worldbook ? (await this.host.loadBook(item.worldbook,id)).project : this.settings.drafts?.[id];
      C.assert(epoch === this.epoch, '读取期间配置已变化，请重试'); C.assert(p, '剧本内容不可用，请重新导入');
      await this.setProject(p,true,{worldbook:item.worldbook || '',disable:true});
    }
    async createProject(title = '新剧本') {
      C.assert(!this.busy, '请先等待或取消当前辅助任务，再新建剧本');
      return this.setProject({id:C.id('story'), title:title.trim() || '新剧本', nodes:[{id:'N1',title:'开场',guidance:'在这里填写当前阶段的故事指引。',detail:'',routes:[],effects:[]}], events:[], variables:[], collections:[], start_node_id:'N1'},true,{disable:true});
    }
    async copyProject(id) {
      C.assert(!this.busy, '请先等待或取消当前辅助任务');
      const item = this.settings.project_library?.[id]; C.assert(item && (!item.card_id || item.card_id===this.card.id), '剧本不在当前角色卡的库中'); const epoch = this.epoch;
      const input = id === this.project.id ? this.project : item.worldbook ? (await this.host.loadBook(item.worldbook,id)).project : this.settings.drafts?.[id];
      C.assert(epoch === this.epoch && input, '剧本内容已变化或不可用');
      const copy = C.clone(input); copy.id = C.id('story'); copy.revision = C.id('rev'); copy.title += '（副本）';
      await this.setProject(copy,true,{disable:true});
    }
    removeProject(id) {
      C.assert(!this.busy, '请先等待或取消当前辅助任务'); C.assert(id !== this.project.id, '请切换到其他剧本，再移出当前剧本'); C.assert(this.settings.project_library?.[id], '剧本不在库中');
      for (const field of ['project_library','drafts','project_workspaces','project_editors']) delete this.settings[field]?.[id];
      this.saveSettings(); this.notify();
    }
    async discoverBook(name) {
      C.assert(!this.busy, '请先等待或取消当前辅助任务'); const epoch = this.epoch;
      const items = await this.host.listBookProjects(name); C.assert(epoch === this.epoch, '读取期间配置已变化，请重试');
      this.settings.project_library ||= {};
      for (const p of items) {
        const previous = this.settings.project_library[p.id];
        if (!previous || !previous.worldbook || previous.worldbook === name) this.settings.project_library[p.id] = {title:p.title,worldbook:name,card_id:this.card.id,updated_at:previous?.updated_at || 0};
      }
      this.saveSettings(); this.notify(); return items.length;
    }
    async setProject(input, detached = true, options = {}) {
      const p = C.normalizeProject(input); const state = this.host.progress(p); F.initialize(p, state);
      const changed = p.id !== this.project.id;
      this.persistProject(); if (changed) this.parkWorkspace();
      this.host.saveProgress(this.project,this.state);
      this.invalidate(); this.project = p; this.state = state; R.init(this.state); this.draft = null; this.error = '';
      if (changed) this.restoreWorkspace(p.id);
      if (options.disable) this.settings.enabled = false;
      F.initialize(p, state); if (this.settings.enabled && F.diagnose(p).some(x => x.severity === 'error')) { this.settings.enabled = false; this.error = '新剧本有依赖问题，请在记录页核对后启用'; }
      if (options.worldbook !== undefined) this.settings.worldbook = options.worldbook;
      else if (detached) this.settings.worldbook = '';
      this.persistProject(); this.save(); this.captureDraft();
    }
    async editProject(mutator) {
      const p = C.clone(this.project); mutator(p); p.revision = C.id('rev');
      const normalized = C.normalizeProject(p); const state = C.migrateProgress(C.clone(this.state), normalized); F.initialize(normalized, state);
      this.invalidate(); const epoch = this.epoch; const chat = this.chat;
      if (this.settings.worldbook) await this.host.saveBook(this.settings.worldbook, normalized);
      C.assert(epoch === this.epoch && chat === this.host.chatId(), '保存期间聊天或配置已变化，请重新读取剧本后核对');
      this.invalidate(); this.project = normalized; this.state = state; F.initialize(normalized, state); this.persistProject();
      this.error = '';
      if (this.settings.enabled && this.diagnostics().some(x => x.severity === 'error')) { this.settings.enabled = false; this.error = '依赖检查发现问题，已关闭注入，请核对后重新启用'; this.saveSettings(); }
      this.save();
    }
    async loadBook(name, projectId) {
      const epoch = this.epoch; const data = await this.host.loadBook(name, projectId);
      C.assert(epoch === this.epoch, '读取期间聊天或配置已变化，请重试'); await this.setProject(data.project, true, {worldbook:name,disable:true});
      delete this.settings.draft_project; this.saveSettings(); this.notify(); return data;
    }
    async saveBook(name) {
      const epoch = this.epoch; await this.host.saveBook(name, this.project);
      C.assert(epoch === this.epoch, '保存期间聊天或配置已变化，请重新读取该世界书核对');
      this.settings.worldbook = name; this.settings.project_id = this.project.id;
      delete this.settings.draft_project; this.persistProject(); this.notify();
    }
    mutate(fn) { this.invalidate(); this.error = ''; const changed = fn(); if (changed !== false) this.save(); return changed; }
    complete() {
      const q = this.state.stage_progress;
      const source = q && ['completed', 'uncertain'].includes(q.status) ? {assistant_id: q.assistant_id, evidence: q.evidence || [], messages: this.host.pair(q.assistant_id)?.messages.map(m => m.message_id) || []} : null;
      return this.mutate(() => C.completeNode(this.state, this.project, source));
    }
    resultDeletionPreview(code) {
      const def = this.project.collections.find(c => c.id === code); C.assert(def, '结果定义不存在');
      return {definition: C.clone(def), references: C.resultReferences(this.project, code), in_progress: !!C.resultInProgress(this.state, code)};
    }
    async deleteResult(code, mode, replacement) {
      C.assert(!C.resultInProgress(this.state, code), '此结果已有取得或结算依赖记录，请先备份并回退相关结果，再删除定义');
      const next = C.removeResultDefinition(this.project, code, mode, replacement);
      await this.editProject(p => { Object.assign(p, next); });
    }
    eventDeletionPreview(code) {
      const event = this.project.events.find(e => e.id === code); C.assert(event, '事件不存在');
      const after = C.clone(this.project); after.events = after.events.filter(e => e.id !== code);
      const cleanup = [...new Set(event.effects.filter(e => e.collect).map(e => e.collect))].filter(k => after.collections.some(c => c.id === k && !c.external) && !C.resultReferences(after, k).length && !C.resultInProgress(this.state, k));
      return {cleanup, in_progress: !!this.state.event_counts[code] || Object.values(this.state.settlements?.entries || {}).some(x => x.event_id === code)};
    }
    async deleteEvent(code) {
      const plan = this.eventDeletionPreview(code); C.assert(!plan.in_progress, '此事件已有结算记录，请先备份并回退相关结算后删除');
      await this.editProject(p => { p.events = p.events.filter(e => e.id !== code); p.collections = p.collections.filter(c => !plan.cleanup.includes(c.id)); });
    }
    diagnostics() { if (this.diagnosticProject !== this.project) { this.diagnosticProject = this.project; this.diagnosticIssues = F.diagnose(this.project); } return this.diagnosticIssues; }
    switchPackage(id) { return this.mutate(() => F.focusPackage(this.project, this.state, id)); }
    rollbackPreview(id) { return F.rollbackPlan(this.project, this.state, id); }
    rollbackResult(id) { return this.mutate(() => F.rollback(this.project, this.state, id)); }
    syncBindings() {
      const values = this.host.boundVariables?.(this.project.variables) || {}, changed = Object.entries(values).filter(([id, value]) => this.state.variables[id] !== value);
      if (changed.length) C.transact(this.state, this.project, '同步外部聊天变量', next => { for (const [id, value] of changed) next.variables[id] = value; }, 'variable:' + C.id('sync'));
      F.sync(this.project, this.state, this.settings.enabled);
    }
    enter(target) { return this.mutate(() => { const changed = C.enterNode(this.state, this.project, target); this.state.turn_context = {node_id: target, user_id: -1, manual: true}; return changed; }); }
    stageChoice(target, draft = '') {
      C.assert(this.settings.story_flow && this.settings.enabled && !this.state.paused, '请启用行动选择流程');
      const route = this.quickRoutes().find(r => r.target === target); C.assert(route, '此行动目前不可选择');
      const base = this.pendingChoice && draft === this.pendingChoice.text ? this.pendingChoice.base_text : draft;
      const action = route.action_text || route.label;
      const text = base.trim() ? base + '\n' + action : action;
      this.pendingChoice = {project_id: this.project.id, node_id: this.state.current_node_id, target, label: route.label, action_text: action, base_text: base, text};
      this.flowNotice = '已选择：' + route.label + '，等待发送'; this.notify(); return text;
    }
    cancelChoice() { const pending = this.pendingChoice; this.pendingChoice = null; this.flowNotice = ''; this.notify(); return pending; }
    async prepareTurn(messageId) {
      if (!this.settings.enabled || this.state.paused || !this.settings.story_flow) return;
      const latest = messageId == null ? this.host.latest() : this.host.message(messageId);
      const message = latest?.role === 'user' ? latest : latest?.role === 'assistant' ? this.host.pair(latest.message_id)?.messages.find(m => m.role === 'user') : null;
      if (!message) return;
      const userId = Number(message.message_id), text = message.text ?? message.message ?? message.mes ?? '';
      const taskKey = this.chat + '/' + userId + '/' + text;
      if (this.preparing?.key === taskKey) return this.preparing.promise;
      const epoch = this.epoch, chat = this.chat, project = this.project;
      const job = async () => {
        if(this.settings.runtime_mode!=='companion')await this.stageJobs;
        if (epoch !== this.epoch || this.host.chatId() !== chat) return;
        this.syncBindings();
        const signature = await fingerprint([{message_id: userId, text}]);
        if (epoch !== this.epoch || this.host.chatId() !== chat || !this.settings.enabled || this.state.paused) return;
        if (this.state.turn_context?.user_id === userId && this.state.turn_context.fingerprint === signature) return;
        const scopeNode = this.state.current_node_id, revision = this.state.revision;
        const alive = () => epoch === this.epoch && this.host.chatId() === chat && this.state.revision === revision
          && this.state.current_node_id === scopeNode && (this.host.message(userId)?.message ?? this.host.message(userId)?.mes ?? '') === text;
        const candidates = this.quickRoutes(); let target = '';
        const pending = this.pendingChoice;
        if (pending?.node_id === scopeNode && pending.project_id === project.id && text === pending.text && !pending.base_text.trim()) target = pending.target;
        if (!target) {
          const exact = candidates.filter(r => [r.action_text, r.label].some(x => x && x.trim() === text.trim()));
          if (exact.length === 1) target = exact[0].target;
        }
        if (this.settings.runtime_mode!=='companion' && !target && candidates.length && this.settings.profile.base_url && this.settings.profile.model) {
          this.busy++; this.flowNotice = '正在识别本次行动…'; this.notify();
          try {
            const result = await this.client.choose(this.settings.profile, {message_id: String(userId), role: 'user', text}, candidates.map(r => ({target: r.target, label: r.label, action_text: r.action_text, intent: r.intent})));
            if (!alive()) return;
            if (result.status === 'selected') target = result.target;
            else this.flowNotice = result.status === 'ambiguous' ? '本次行动无法明确归入某个分支，保持当前阶段' : '自由对话：保持当前阶段';
          } catch (e) {
            if (alive()) { this.flowNotice = '行动识别失败，请重试；尚未推进剧情'; throw e; }
            return;
          } finally { this.busy--; this.notify(); }
        } else if(!target && this.settings.runtime_mode==='companion')this.flowNotice='继续演绎当前阶段';
        else if (!target) this.flowNotice = candidates.length ? '自由输入识别需要配置辅助 API；本次保持当前阶段' : '继续当前阶段';
        if (!alive()) return;
        const context = {user_id: userId, fingerprint: signature, node_id: scopeNode, project_revision: project.revision};
        if (target) {
          if(target.startsWith('complete:')){context.completion_intent=target.slice(9);}
          else if (target.startsWith('package:')) { C.assert(candidates.some(r => r.target === target), '事件包未解锁'); F.focusPackage(project, this.state, target.slice(8), context); }
          else C.enterNode(this.state, project, target, context);
          if(target.startsWith('complete:'))this.state.turn_context={...context,completion_intent:target.slice(9)};
          this.flowNotice = target.startsWith('complete:') ? '继续当前阶段' : '已记录选择：' + this.state.turn_context.label;
        } else this.state.turn_context = context;
        this.state.turn_context.injection_nodes = F.activeNodes(project, this.state);
        if(this.settings.runtime_mode==='companion'){const q=R.init(this.state), nonce=C.id('turn');q.turn={id:nonce,user_id:userId,spec:{...R.spec(project,this.state,nonce),routes:C.clone(this.quickRoutes())},routes:C.clone(this.quickRoutes()),project_revision:project.revision};}
        this.pendingChoice = null; this.save(); this.saveSettings();
      };
      const promise = job(); this.preparing = {key: taskKey, promise};
      try { return await promise; } finally { if (this.preparing?.promise === promise) this.preparing = null; }
    }
    async checkStage(pair, force = false) {
      if (!this.settings.enabled || this.state.paused || !this.settings.story_flow) return;
      const targets = this.state.turn_context?.injection_nodes || F.activeNodes(this.project, this.state);
      for (const target of targets) await this.checkStageNode(target, pair, force);
    }
    async checkStageNode(target, pair, force = false) {
      if (!this.settings.enabled || this.state.paused || !this.settings.story_flow) return;
      const node = C.indexProject(this.project).nodes.get(target.node_id), scope = () => F.stage(this.project, this.state, target.package_id);
      if (!node || !node.completion_criteria || this.state.completed_node_ids.includes(node.id) || !C.nodeReady(node, this.project, this.state)) return;
      pair ||= this.draft || (this.host.latest()?.role === 'assistant' ? this.host.pair(this.host.latest().message_id) : null);
      if (!pair) return;
      const user = pair.messages.find(m => m.role === 'user');
      // A newly entered stage must never consume a reply generated for another stage.
      if (this.state.turn_context && (this.state.turn_context.user_id !== Number(user?.message_id) || (this.state.turn_context.injection_nodes ? !this.state.turn_context.injection_nodes.some(x => x.node_id === node.id) : this.state.turn_context.node_id !== node.id))) return;
      if (!this.settings.profile.base_url || !this.settings.profile.model) { this.flowNotice = '阶段自动核验需要配置辅助 API'; this.notify(); return; }
      const epoch = this.epoch, chat = this.chat, project = this.project;
      const key = node.id + '/' + await fingerprint(pair.messages);
      if (this.stageInFlight.has(key)) return this.stageInFlight.get(key);
      if (!force && scope().stage_progress?.source_key === key) return;
      const job = async () => {
        if (epoch !== this.epoch || this.host.chatId() !== chat || scope().current_node_id !== node.id || this.state.completed_node_ids.includes(node.id)) return;
        const revision = this.state.revision;
        const alive = () => epoch === this.epoch && this.host.chatId() === chat && scope().current_node_id === node.id && this.state.revision === revision
          && JSON.stringify(this.host.pair(pair.assistant_id)?.messages) === JSON.stringify(pair.messages);
        this.busy++; this.flowNotice = '正在核验阶段进展…'; this.notify();
        try {
          const stored = scope().stage_progress?.node_id === node.id ? scope().stage_progress : null;
          const priorPair = stored && this.host.pair(stored.assistant_id);
          const factsValid = stored?.facts.every(f => f.evidence.every(ref => (this.host.message(ref.message_id)?.message ?? this.host.message(ref.message_id)?.mes ?? '').includes(ref.quote)));
          const previous = priorPair && factsValid && stored.source_key === node.id + '/' + await fingerprint(priorPair.messages) ? stored : null;
          if (!alive()) return;
          const relevant = new Set(node.effects.flatMap(e => e.collect ? [e.collect] : []));
          const visit = c => { if (!C.object(c)) return; const [op, v] = Object.entries(c)[0]; if (op === 'collected') relevant.add(v); else if (op === 'all' || op === 'any') v.forEach(visit); else if (op === 'not') visit(v); };
          node.routes.forEach(r => visit(r.condition));
          visit(node.entry_condition); node.effects.filter(e => e.collect).forEach(e => visit(project.collections.find(c => c.id === e.collect)?.requires)); visit(F.owner(project, node.id)?.condition);
          project.nodes.forEach(n => n.routes.filter(r => r.target === node.id).forEach(r => visit(r.condition)));
          const known = project.collections.filter(c => relevant.has(c.id)).map(c => ({id: c.id, title: c.title, confirmed: this.state.collected_ids.includes(c.id)}));
          const variables = Object.fromEntries(node.context_variables.map(k => [k, this.state.variables[k]]));
          const result = await this.client.evaluateStage(this.settings.profile, pair.messages, node, previous, known, variables);
          if (!alive()) return;
          const facts = [...(previous?.facts || [])];
          for (const fact of result.facts) { const at = facts.findIndex(f => f.text === fact.text); if (at >= 0) facts.splice(at, 1); facts.push(fact); }
          scope().stage_progress = {node_id: node.id, status: result.status, summary: result.summary || previous?.summary || '', facts: facts.slice(-8), missing: result.missing, evidence: result.evidence, source_key: key, assistant_id: pair.assistant_id};
          this.state.last_stage_message_id = Math.max(this.state.last_stage_message_id, pair.assistant_id);
          if (result.status === 'completed' && node.auto_complete) {
            C.completeNode(this.state, project, {assistant_id: pair.assistant_id, messages: pair.messages.map(m => m.message_id), evidence: result.evidence}, node.id);
            this.flowNotice = '阶段已完成，结果标记已结算';
          } else {
            this.state.revision++;
            this.flowNotice = result.status === 'completed' ? '阶段已判定完成，请确认完成本节点' : result.status === 'uncertain' ? '阶段判断不确定，尚未结算' : '阶段进行中，已更新短摘要';
          }
          this.error = ''; this.save(); this.saveSettings();
        } catch (e) { if (alive()) { this.error = '阶段核验失败：' + e.message; this.flowNotice = '尚未结算，可在运行页重试阶段核验'; this.saveSettings(); this.notify(); } }
        finally { this.busy--; this.notify(); }
      };
      const promise = this.stageJobs.catch(() => {}).then(job).finally(() => { if (this.stageInFlight.get(key) === promise) this.stageInFlight.delete(key); });
      this.stageJobs = promise; this.stageInFlight.set(key, promise); return promise;
    }
    quickRoutes() {
      if (!this.settings.enabled || this.state.paused) return [];
      const refs = C.indexProject(this.project); const node = refs.nodes.get(this.state.current_node_id);
      if(this.settings.runtime_mode==='companion' && R.init(this.state).continuity_hold)return [];
      if(this.settings.runtime_mode==='companion' && node.completion_criteria && !this.state.completed_node_ids.includes(node.id))return [{target:'complete:'+node.id,label:node.completion_action?.label || '继续前进',action_text:node.completion_action?.action_text || node.completion_action?.label || '完成当前行动，继续前进',intent:node.completion_action?.intent || node.completion_criteria,status:'可用'}];
      if(this.settings.runtime_mode==='companion' && R.blocked(this.project,this.state))return [];
      const primary = F.activeNodes(this.project, this.state).some(x => x.node_id === node.id && x.role === 'main');
      const routes = primary ? F.availableRoutes(this.project, this.state, node.id).map(r => ({target: r.target, label: r.label || refs.nodes.get(r.target).title, action_text: r.action_text || r.label || refs.nodes.get(r.target).title, intent: r.intent || r.label || '', status: r.condition == null || r.condition === true ? '可用' : '已解锁'})) : [];
      for (const b of this.project.packages) if (b.id !== this.state.focus_package_id && ['ready', 'running'].includes(this.state.package_progress?.[b.id]?.status)) routes.push({target: 'package:' + b.id, label: '继续' + b.title, action_text: '继续' + b.title, intent: '切换到' + b.title + '，继续其中的行动', status: '可用'});
      if (this.project.packages.length && this.state.focus_package_id && this.state.base_progress) routes.push({target: 'package:', label: '返回主线', action_text: '返回主线', intent: '恢复原有主线剧情', status: '可用'});
      return routes;
    }
    defaultPrompts() { return C.clone({...API.PROMPTS,companion:R.PROMPT}); }
    apiEndpoints(base) { return {chat: API.endpoint(base), models: API.modelsEndpoint(base)}; }
    pause() { return this.mutate(() => { this.state.paused = !this.state.paused; this.state.revision++; }); }
    undo() { return this.mutate(() => {const changed=C.undo(this.state);if(changed){const q=R.init(this.state);q.turn=null;q.queue=[];q.reports={};q.stage_dialogues={};R.log(this.state,'undo','人工回退；未结算回报已清理');}return changed;}); }
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
      return this.mutate(() => C.settleEvent(this.state, this.project, eventId, key, source, event.completion_node_id || this.state.current_node_id));
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
      if(this.settings.runtime_mode==='companion')return;
      if (previous) await this.acceptPair(this.host.pair(previous.message_id), false);
    }
    async checkLatest() {
      C.assert(this.settings.enabled && !this.state.paused, '请先启用剧本并解除暂停');
      const latest = this.host.latest(); const pair = this.draft || (latest?.role === 'assistant' ? this.host.pair(latest.message_id) : null);
      C.assert(pair, '当前没有可确认的 AI 回复'); return this.acceptPair(pair, true);
    }
    async checkRound() {
      if(this.settings.runtime_mode==='companion'){await this.captureDraft();await this.processCompanion(false);return this.verifyCheckpoint(true);}
      C.assert(this.settings.enabled && !this.state.paused, '请先启用剧本并解除暂停');
      await this.captureDraft(); const pair = this.draft, scopeNode = this.state.current_node_id, epoch = this.epoch;
      C.assert(pair, '当前没有可核验的 AI 回复');
      const candidates = C.eligibleEvents(this.project, this.state, scopeNode).filter(e => !e.completion_node_id).map(e => e.id);
      await this.checkStage(undefined, true);
      if (epoch === this.epoch && candidates.length) await this.acceptPair(pair, true, {scopeNode, ids: candidates});
    }
    async acceptPair(pair, force, context = {}) {
      C.assert(pair && pair.messages.length, '没有可检查的对话');
      if (!force && !this.settings.auto_detect) return;
      const epoch = this.epoch; const chat = this.chat; const project = this.project; const scopeNode = context.scopeNode || this.state.current_node_id;
      const key = await fingerprint(pair.messages);
      if (epoch !== this.epoch || chat !== this.chat) return;
      if (this.state.accepted_turns[key] || this.inFlight.has(key)) return;
      const existing = this.state.pending_checks.find(c => c.key === key);
      if (existing && !['error', 'stale'].includes(existing.status)) return;
      const candidates = C.eligibleEvents(project, this.state, scopeNode).filter(e => !context.ids || context.ids.includes(e.id));
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
            const relevant = [...new Set([...node.context_variables, ...batch.flatMap(e => e.effects.filter(x => x.add || x.set).map(x => (x.add || x.set).variable))])];
            const facts = {node: node.title, known_variables: Object.fromEntries(relevant.map(k => [k, this.state.variables[k]]))};
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
              if (!C.condition(event.condition, this.state)) { record.handled = true; record.resolution = 'condition_changed'; record.note = '结算时前提已变化，未应用奖励'; continue; }
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
    beginRaw(kind, original, wish, mode, previous = null) {
      const run = this.rawAnalysis = {id: C.id('analysis'), kind, original:previous?.original || original, wish, mode, chat_id:this.chat, replies:C.clone(previous?.replies || []), requests:C.clone(previous?.requests || []), error:'', at:Date.now()};
      this.settings.raw_analysis = run; this.saveSettings();
      const epoch = this.epoch, key = this.settings.profile.key;
      const onResponse = value => {
        if (epoch !== this.epoch || this.rawAnalysis !== run) return;
        const retained = run.replies.reduce((n, x) => n + x.text.length, 0), capacity = Math.max(0, 2000000 - retained);
        const raw = typeof value.text === 'string' ? value.text : JSON.stringify(value.text), text = key ? raw.split(key).join('[已隐藏密钥]') : raw;
        const reply = {...C.clone(value), id: C.id('reply'), text: text.slice(0, capacity), storage_truncated: text.length > capacity};
        if (reply.original === run.original) { delete reply.original; reply.original_from_run = true; }
        if (reply.evidenceSource === run.original) { delete reply.evidenceSource; reply.evidence_from_run = true; }
        const contextSize = value => JSON.stringify({...value, text: ''}).length;
        if (run.replies.reduce((n, x) => n + contextSize(x), 0) + contextSize(reply) > 2500000) { for (const field of ['nodes', 'collections', 'packages', 'variables', 'knownNodes','knownActors', 'knownCollections', 'knownVariables', 'knownEvents', 'events', 'evidenceSource', 'sourceResult']) delete reply[field]; reply.context_unavailable = true; }
        run.replies.push(reply); this.settings.raw_analysis = C.clone(run); this.saveSettings(); this.notify();
      };
      onResponse.onRequest = value => {
        if (epoch !== this.epoch || this.rawAnalysis !== run) return;
        const text = JSON.stringify(value.messages), safe = key ? text.split(key).join('[已隐藏密钥]') : text;
        const retained = run.requests.reduce((n, x) => n + x.text.length, 0), capacity = Math.max(0, 2000000 - retained);
        run.requests.push({kind: value.kind || kind, semantic_repair:!!value.semantic_repair,extra:!!value.extra, part: value.part || 0, parts: value.parts || 1, at: Date.now(), text: safe.slice(0, capacity), storage_truncated: safe.length > capacity});
        this.settings.raw_analysis = C.clone(run); this.saveSettings(); this.notify();
      };
      return onResponse;
    }
    async segment(text, wish) {
      const epoch = this.epoch; this.busy++; this.notify();
      try {
        const profile = {...this.settings.profile, model: this.settings.segment_model || this.settings.profile.model};
        const onResponse = this.beginRaw('segment', text, wish, 'faithful');
        const result = await this.client.segment(profile, text, wish, {onResponse, onRequest: onResponse.onRequest});
        C.assert(epoch === this.epoch, '配置已变化，整理结果未应用');
        this.segmentDraft = result; this.settings.segment_draft = C.clone(result); this.saveSettings(); this.notify(); return result;
      } catch (e) { if (epoch === this.epoch && this.rawAnalysis) { this.rawAnalysis.error = e.message; this.retainAnalysisDraft(); this.settings.raw_analysis = C.clone(this.rawAnalysis); this.saveSettings(); } throw e; }
      finally { this.busy--; this.notify(); }
    }
    async applySegment() { C.assert(this.segmentDraft, '没有可应用的拆分草稿'); const p = this.segmentDraft.project; await this.setProject(p); delete this.settings.segment_draft; this.saveSettings(); }
    async applyAnalysis(input = this.analysisDraft?.project) {
      C.assert(!this.busy, '请等待当前辅助任务完成'); C.assert(this.analysisDraft && input, '请先完成分析或恢复分析草稿');
      const project = C.convertAnalysisProject(input);
      if(this.settings.profile.author_review && (!this.analysisDraft.author_review || this.analysisDraft.author_review.project_signature!==JSON.stringify(C.normalizeProject(input)))){await this.reviewAnalysis(input,project);}
      C.assert(!this.analysisDraft.review_blocked,'转化复核有待处理错误，请修改草稿后重新复核；当前剧本未替换');
      const before = {project: this.project, state: C.clone(this.state), settings: C.clone(this.settings), analysisDraft: this.analysisDraft};
      this.host.saveProgress(this.project, this.state);
      try {
        this.settings.enabled = false; await this.setProject(project); delete this.settings.analysis_draft; this.saveSettings(); this.notify(); return this.project;
      } catch (error) { Object.assign(this, before); this.inject(); throw error; }
    }
    async analyze(text, wish, mode = 'faithful') {
      C.assert(!this.busy, '请等待当前辅助任务完成');
      const epoch = this.epoch; this.busy++; this.error = ''; this.analysisProgress = {phase: '准备', done: 0, total: 0}; this.notify();
      try {
        const profile = {...this.settings.profile, model: this.settings.segment_model || this.settings.profile.model};
        const onResponse = this.beginRaw('analysis', text, wish, mode);
        const result = await this.client.analyze(profile, text, wish, {mode, onResponse, onRequest: onResponse.onRequest, onProgress: progress => { if (epoch === this.epoch) { this.analysisProgress = {...progress,done:this.rawAnalysis?.requests.length || progress.done}; this.notify(); } }});
        C.assert(epoch === this.epoch, '聊天或配置已变化，分析结果未应用');
        this.analysisDraft = result; this.settings.analysis_draft = C.clone(result); this.saveSettings(); this.notify(); return result;
      } catch (e) { if (epoch === this.epoch && this.rawAnalysis) { this.rawAnalysis.error = e.message; this.retainAnalysisDraft(); this.settings.raw_analysis = C.clone(this.rawAnalysis); this.saveSettings(); } throw e; }
      finally { this.analysisProgress = null; this.busy--; this.notify(); }
    }
    retainAnalysisDraft() {
      for(const reply of (this.rawAnalysis?.replies || []).slice().reverse()) {
        if(reply.kind==='plan' || reply.kind?.startsWith('review') || reply.storage_truncated || reply.finish_reason==='length' || reply.context_unavailable)continue;
        try {
          const context={...reply,original:reply.original_from_run?this.rawAnalysis.original:reply.original,evidenceSource:reply.evidence_from_run?this.rawAnalysis.original:reply.evidenceSource};
          const result=this.client.restoreAnalysis(context.original,reply.text,reply.mode,context);
          result.is_partial=true;result.review_blocked=true;result.warnings.push('流程未完成，保留最近可恢复草稿；尚需完成其余分段、整合或复核。');
          this.analysisDraft=result;this.settings.analysis_draft=C.clone(result);return;
        }catch{}
      }
    }
    analysisReply(text, mode, replyId) {
      C.assert(!this.busy, '请先取消或等待当前辅助任务结束');
      const stored = replyId ? this.rawAnalysis?.replies.find(x => x.id === replyId) : null;
      const reply = stored ? {...stored, original: stored.original_from_run ? this.rawAnalysis.original : stored.original, evidenceSource: stored.evidence_from_run ? this.rawAnalysis.original : stored.evidenceSource} : null;
      C.assert(!replyId || reply, '保留的回复不存在，请重新选择');
      if (reply) {
        C.assert(!reply.kind?.startsWith('review'),'复核报告不是剧本草稿，请选择正式分析或补修结果');
        C.assert(!reply.storage_truncated && reply.finish_reason !== 'length', '这份原始输出已截断，只能排查，不能当作完整草稿应用');
        C.assert(!reply.context_unavailable, '原始回复过大，缺少整合上下文；请导出记录后分篇恢复');
        C.assert(text === reply.original && mode === reply.mode, '恢复时原文和处理方式必须与这份原始回复一致');
      }
      return reply;
    }
    restoreAnalysis(text, raw, mode = 'faithful', replyId = '') {
      const reply = this.analysisReply(text,mode,replyId);
      const result = this.client.restoreAnalysis(text, raw, mode, reply);
      if (reply?.partial_merge) { result.is_partial = true; result.warnings.push('仅恢复一组整合，其余节点保留分段草稿，跨组关系仍需核对。'); }
      if (reply?.kind === 'chunk' || reply?.source_from_kind === 'chunk') { result.is_partial = true; result.warnings.push('仅恢复第' + reply.part + '/' + reply.parts + '块，不是全篇合并结果；应用前请核对跨块结果定义及连接。'); }
      this.error = ''; if (this.rawAnalysis) { this.rawAnalysis.error = ''; this.settings.raw_analysis = C.clone(this.rawAnalysis); }
      this.analysisDraft = result; this.settings.analysis_draft = C.clone(result); this.saveSettings(); this.notify(); return result;
    }
    async repairAnalysis(text, raw, mode = 'faithful', replyId = '') {
      const reply = this.analysisReply(text,mode,replyId), epoch=this.epoch, previous=this.rawAnalysis;
      this.busy++;this.error='';this.notify();
      try {
        const onResponse=this.beginRaw('analysis',text,'定向补修原文来源或变量依据',mode,previous);
        const result=await this.client.repairAnalysis({...this.settings.profile,model:this.settings.segment_model || this.settings.profile.model},text,raw,mode,reply,{onResponse,onRequest:onResponse.onRequest});
        C.assert(epoch===this.epoch,'配置已变化，来源补修未应用');
        if (reply?.kind==='chunk' || reply?.source_from_kind==='chunk') {result.is_partial=true;result.warnings.push('仅恢复当前分块，应用前需核对全篇关系。');}
        this.analysisDraft=result;this.settings.analysis_draft=C.clone(result);this.saveSettings();this.notify();return result;
      } catch(error) {if(epoch===this.epoch && this.rawAnalysis){this.rawAnalysis.error=error.message;this.settings.raw_analysis=C.clone(this.rawAnalysis);this.saveSettings();}throw error;}
      finally{this.busy--;this.notify();}
    }
    async reviewAnalysis(input=this.analysisDraft?.project,converted=C.convertAnalysisProject(input)) {
      C.assert(!this.busy && input,'请等待任务结束并准备分析草稿');const epoch=this.epoch;
      this.busy++;this.notify();const onResponse=this.beginRaw('analysis',input.original_text || '', '转化后复核','faithful',this.rawAnalysis);
      try{
        const result=await this.client.reviewScript({...this.settings.profile,model:this.settings.segment_model || this.settings.profile.model},input.original_text || '',input,converted,{onResponse,onRequest:onResponse.onRequest});
        C.assert(epoch===this.epoch,'配置变化，复核未应用');
        this.analysisDraft.author_review={...result,project_signature:JSON.stringify(C.normalizeProject(input)),at:Date.now()};this.analysisDraft.review_blocked=result.issues.some(x=>x.severity==='error');this.settings.analysis_draft=C.clone(this.analysisDraft);this.saveSettings();return result;
      }finally{this.busy--;this.notify();}
    }
    async processCompanion(auto=true) {
      if(!this.settings.enabled || this.state.paused || this.settings.runtime_mode!=='companion' || R.init(this.state).continuity_hold)return;
      const epoch=this.epoch,chat=this.chat;const pair=this.draft;if(!pair)return;let q=R.init(this.state);const turn=q.turn;
      if(!turn || turn.project_revision!==this.project.revision || turn.user_id!==Number(pair.messages.find(m=>m.role==='user')?.message_id))return;
      const signature=await fingerprint(pair.messages);if(epoch!==this.epoch || chat!==this.host.chatId() || JSON.stringify(this.host.pair(pair.assistant_id)?.messages)!==JSON.stringify(pair.messages))return;if(q.reports[signature])return;
      q.reports[signature]=true;q.round++;if(Object.keys(q.reports).length>200)delete q.reports[Object.keys(q.reports)[0]];
      let report;
      try{report=R.parse(pair.messages.find(m=>m.role==='assistant').text,turn.spec);}
      catch(error){R.log(this.state,'report_invalid',error.message,{assistant_id:pair.assistant_id});report={stages:turn.spec.stages.map(x=>({id:x.id,status:'uncertain',quote:''})),events:[],present:[]};}
      for(const target of turn.spec.active){const past=q.stage_dialogues[target.node_id] ||= [];if(!past.some(p=>p.assistant_id===pair.assistant_id))past.push(C.clone(pair));q.stage_dialogues[target.node_id]=past.slice(-8);}
      q.present=report.present.filter(id=>turn.spec.actors.some(a=>a.id===id));
      const source={assistant_id:pair.assistant_id,messages:pair.messages.map(m=>m.message_id)};
      for(const [kind,items] of [['event',report.events],['stage',report.stages]])for(const item of items){
        if(item.status==='in_progress' || item.status==='rejected'){
          if(kind==='event' && item.status==='rejected'){const id=item.attempt || Object.values(q.attempts).find(a=>a.event_id===item.id && a.status==='uncertain')?.id;if(id && q.attempts[id]?.event_id===item.id){q.attempts[id].status='rejected';q.queue=q.queue.filter(x=>x.attempt!==id);}}
          continue;
        }
        const definition=kind==='stage'?this.project.nodes.find(n=>n.id===item.id):this.project.events.find(e=>e.id===item.id);
        if(!definition || kind==='stage' && (!definition.completion_criteria || this.state.completed_node_ids.includes(item.id)))continue;
        const target=turn.spec.active.find(x=>kind==='stage'?x.node_id===item.id:definition.scope.kind==='project' || definition.scope.node_ids.includes(x.node_id));if(!target)continue;
        if(kind==='event' && !C.eligibleEvents(this.project,this.state,target.node_id).some(e=>e.id===item.id))continue;
        let attempt='';
        if(kind==='event'){
          const attemptId=item.attempt || Object.values(q.attempts).find(a=>a.event_id===item.id && a.status==='uncertain')?.id;
          const old=attemptId && q.attempts[attemptId];
          if(item.attempt && (!old || old.event_id!==item.id || old.status!=='uncertain')){R.log(this.state,'attempt_invalid','待定尝试编号无效',{event_id:item.id});continue;}
          attempt=attemptId || C.id('attempt');q.attempts[attempt]={id:attempt,event_id:item.id,status:item.status,source_key:old?.source_key || signature,first_dialogue:old?.first_dialogue || C.clone(pair.messages)};
        }
        const key=kind==='stage'?'stage:'+item.id:'event:'+item.id+':'+attempt;
        const candidate={key,kind,id:item.id,attempt,source_key:attempt?q.attempts[attempt].source_key:signature,status:item.status,package_id:target.package_id,node_id:target.node_id,source:{...source,evidence:item.quote?[{message_id:String(pair.assistant_id),quote:item.quote}]:[]},dialogue:C.clone(pair.messages),context_dialogues:kind==='stage' ? C.clone(q.stage_dialogues[item.id].map(p=>p.messages)) : attempt ? [C.clone(q.attempts[attempt].first_dialogue),C.clone(pair.messages)] : [C.clone(pair.messages)],project_revision:this.project.revision};
        q.queue=q.queue.filter(x=>x.key!==key);q.queue.push(candidate);
        if(item.status==='completed' && !R.critical(this.project,kind,item.id) && (kind==='stage'?definition.auto_complete:definition.auto_settle)){this.settleCandidate(candidate,'local');q=R.init(this.state);}
      }
      const historical=Object.values(q.attempts).filter(a=>a.status!=='uncertain');for(const old of historical.slice(0,Math.max(0,historical.length-200)))delete q.attempts[old.id];
      C.assert(q.queue.length<=128,'待核验结果过多，请先集中核验；未丢弃关键结果');q.message_snapshots[pair.assistant_id]=this.valueSnapshot();
      // Free actions are interpreted from actual prose. Only provided, currently legal choices can enter.
      if(report.choice && turn.routes.some(r=>r.target===report.choice.target) && !report.choice.target.startsWith('complete:')){
        const r=report.choice.target;
        if(this.quickRoutes().some(x=>x.target===r)){
          if(r.startsWith('package:'))F.focusPackage(this.project,this.state,r.slice(8),{user_id:turn.user_id,report:true});
          else C.enterNode(this.state,this.project,r,{user_id:turn.user_id,report:true});
        }
      }
      this.save();
      const ending=report.stages.some(x=>x.status==='completed');
      if(auto && q.queue.length && (ending || q.round % this.settings.checkpoint_every===0))await this.verifyCheckpoint();
    }
    settleCandidate(item,verified){
      const source={...item.source,messages:[...new Set((item.context_dialogues || [item.dialogue]).flatMap(d=>d.map(m=>m.message_id)))],verification:verified};
      if(item.kind==='stage')C.completeNode(this.state,this.project,source,item.id);
      else C.settleEvent(this.state,this.project,item.id,item.source_key,source,item.node_id);
      const q=R.init(this.state);q.queue=q.queue.filter(x=>x.key!==item.key);if(item.kind==='stage')delete q.stage_dialogues[item.id];if(item.attempt)q.attempts[item.attempt].status='settled';
      R.log(this.state,'settled','已结算'+item.id,{verification:verified,source});
    }
    confirmCandidate(key){
      const item=R.init(this.state).queue.find(x=>x.key===key);C.assert(item?.status==='verified','结果尚未核验通过');C.assert(!this.busy && !this.state.paused && item.project_revision===this.project.revision,'剧本配置已变化或暂停，请重新核验');
      C.assert((item.context_dialogues || [item.dialogue]).every(d=>{const a=d.find(m=>m.role==='assistant');return a && JSON.stringify(this.host.pair(Number(a.message_id))?.messages)===JSON.stringify(d);}), '来源正文已变化，请重新核验');
      this.settleCandidate(item,'author_confirmed');R.init(this.state).message_snapshots[item.source.assistant_id]=this.valueSnapshot();this.save();
    }
    async verifyCheckpoint(force=false){
      let q=R.init(this.state);if(!q.queue.length || this.checkpointJob)return this.checkpointJob;
      if(!this.settings.profile.base_url || !this.settings.profile.model){R.log(this.state,'checkpoint_wait','关键结果待核验，需配置辅助API');this.save();return;}
      const epoch=this.epoch,chat=this.chat, project=this.project;
      const alive=()=>epoch===this.epoch && chat===this.host.chatId() && project===this.project && this.settings.enabled && !this.state.paused;
      const job=async()=>{
        this.busy++;this.notify();
        try{
          const candidates=C.clone(q.queue);
          const definitions=candidates.map(x=>({key:x.key,kind:x.kind,id:x.id,node_id:x.node_id,criteria:(x.kind==='stage'?project.nodes:project.events).find(d=>d.id===x.id)?.completion_criteria + (x.kind==='stage' && project.nodes.find(d=>d.id===x.id)?.completion_action ? '；同时正文实际执行阶段结束行动：'+(project.nodes.find(d=>d.id===x.id).completion_action.intent || project.nodes.find(d=>d.id===x.id).completion_action.action_text || project.nodes.find(d=>d.id===x.id).completion_action.label) : ''),exclusions:(x.kind==='stage'?project.nodes:project.events).find(d=>d.id===x.id)?.completion_exclusions || project.events.find(d=>d.id===x.id)?.exclusions || [],actor_id:project.events.find(d=>d.id===x.id)?.actor_id || '',recipient_id:project.events.find(d=>d.id===x.id)?.recipient_id || ''}));
          let response,last;
          for(let retry=0;retry<=3;retry++){
            if(!alive())return;
            try{response=await this.client.checkpoint(this.settings.profile,candidates,definitions,this.snapshot());break;}
            catch(error){last=error;if(error.code==='BSE_API_CANCELLED' || !alive())return;if(error.code==='BSE_CHECKPOINT_BUDGET')throw error;R.log(this.state,'checkpoint_retry',error.message,{attempt:retry+1});}
          }
          if(!response)throw last;
          if(!alive())return;
          const current=await Promise.all(candidates.map(async x=>({x,valid:(x.context_dialogues || [x.dialogue]).every(d=>{const a=d.find(m=>m.role==='assistant');return a && JSON.stringify(this.host.pair(Number(a.message_id))?.messages)===JSON.stringify(d);})})));
          if(!alive())return;
          for(const {x,valid} of current){
            q=R.init(this.state);
            if(!valid){R.log(this.state,'stale','来源发生变化，拒绝旧核验',{key:x.key});continue;}
            const result=response.find(r=>r.key===x.key);if(!result)continue;
            const pending=q.queue.find(a=>a.key===x.key);if(!pending || JSON.stringify(pending.dialogue)!==JSON.stringify(x.dialogue))continue;
            if(result.status==='completed'){
              const definition=(x.kind==='stage'?project.nodes:project.events).find(d=>d.id===x.id);
              if(!(x.kind==='stage'?definition.auto_complete:definition.auto_settle)){pending.status='verified';pending.source.evidence=result.evidence;continue;}
              try{this.settleCandidate({...x,source:{...x.source,evidence:result.evidence}},'checkpoint');q=R.init(this.state);}
              catch(error){pending.status='uncertain';R.log(this.state,'rule_blocked',error.message,{key:x.key});}
            }else if(result.status==='rejected'){
              q.queue=q.queue.filter(a=>a.key!==x.key);if(x.attempt)q.attempts[x.attempt].status='rejected';R.log(this.state,'corrected','候选结果未成立，当前故事继续',{key:x.key});
            }else pending.status='uncertain';
          }
          // Refresh the snapshot for the reply where settlement actually occurred.
          for(const x of candidates)q.message_snapshots[x.source.assistant_id]=this.valueSnapshot();
          this.error='';this.save();this.saveSettings();
        }catch(error){if(alive()){R.log(this.state,'checkpoint_error',error.message);this.error='阶段核验暂未完成，相关入口保持关闭';this.save();}}
        finally{this.busy--;this.notify();}
      };
      const promise=job().finally(()=>{if(this.checkpointJob===promise)this.checkpointJob=null;});this.checkpointJob=promise;this.stageJobs=promise;return promise;
    }
    exportProject() { return C.clone({type: 'bse_project', version: 1, project: this.project}); }
    exportProgress() { return C.clone({type: 'bse_progress', version: 1, project_id: this.project.id, progress: this.state}); }
    importProgress(data) {
      C.assert(data.type === 'bse_progress' && data.project_id === this.project.id, '进度备份不属于当前剧本');
      const state = C.migrateProgress(C.clone(data.progress), this.project);
      F.initialize(this.project, state);
      this.invalidate(); this.state = state; this.save();
    }
    destroy() { if (this.destroyed) return; this.destroyed = true; this.invalidate(); this.host.destroy(); this.listeners.clear(); }
  }
  return {Engine, defaults, fingerprint, VERSION};
});
