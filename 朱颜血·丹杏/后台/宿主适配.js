'use strict';

const {route}=require('./提示路由.js');
const IdentityBook=require('./身份世界书.js');
const PROMPT_ID = 'zyx_backend_truth';
const UPDATE_EVENTS = ['GENERATION_ENDED', 'GENERATION_STOPPED', 'MESSAGE_RECEIVED', 'MESSAGE_UPDATED', 'MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_SWIPED', 'CHAT_CHANGED', 'CHARACTER_MESSAGE_RENDERED'];
const PRE_EVENTS = ['GENERATION_AFTER_COMMANDS', 'GENERATION_STARTED'];
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function hostFrames(root) {
  const frames = [];
  let current = root;
  while (current && frames.length < 12 && !frames.includes(current)) {
    frames.push(current);
    try { current = current.parent === current ? null : current.parent; } catch (_) { break; }
  }
  try { if (root && root.top && !frames.includes(root.top)) frames.push(root.top); } catch (_) {}
  return frames;
}

function createHostRuntime(options = {}) {
  const engine = options.engine || require('./引擎.js');
  const fingerprint = options.fingerprint || require('./指纹.js').fingerprint;
  const config = options.config || {};
  const root = options.window || (typeof window !== 'undefined' ? window : globalThis);
  let stopped = false, started = false, queue = Promise.resolve(), pending = null;
  let currentId = null, state = null, settled = [], varsSignature = null, promptSignature = null;
  let promptActive = false, generating = false, timer = null;
  const removers = [];
  const diagnostics = { active: false, chatId: null, lastError: null, pending: [], syncs: 0, messageWrites: 0, variableWrites: 0, injections: 0 };
  const fail = (stage, error) => { diagnostics.lastError = { stage, message: String(error && error.message || error) }; };
  function discover() {
    const frames = hostFrames(root);
    const pick = name => {
      for (const w of frames) {
        try { if (typeof w[name] === 'function') return w[name].bind(w); } catch (_) {}
        try { if (w.TavernHelper && typeof w.TavernHelper[name] === 'function') return w.TavernHelper[name].bind(w.TavernHelper); } catch (_) {}
      }
      return null;
    };
    let ctx = null;
    for (const w of frames) {
      try { if (w.SillyTavern && typeof w.SillyTavern.getContext === 'function') { ctx = w.SillyTavern.getContext(); if (ctx) break; } } catch (_) {}
    }
    return { frames, pick, ctx };
  }
  function identity(ctx) {
    if (!ctx) return null;
    let id = typeof ctx.getCurrentChatId === 'function' ? ctx.getCurrentChatId() : ctx.chatId;
    const character = ctx.characters && ctx.characters[ctx.characterId] || ctx.character;
    if (id == null || id === '' || character?.data?.extensions?.zyx_backend?.schema !== 1) return null;
    return String(id);
  }
  function isGenerating(ctx) {
    try { return generating || !!(typeof ctx.isGenerating === 'function' ? ctx.isGenerating() : ctx.isGenerating); } catch (_) { return generating; }
  }
  function source(chat) { return chat.map(message => fingerprint(message)); }
  function guard(id, expected) {
    if (stopped) return false;
    const {ctx} = discover();
    return identity(ctx) === id && same(source(ctx.chat || []).slice(0, expected.length), expected) && (ctx.chat || []).length === expected.length;
  }
  async function inject(api, content) {
    const helper = api.pick('injectPrompts');
    if (helper) {
      try { await helper([{ id: PROMPT_ID, position: 'in_chat', depth: 0, role: 'system', content }]); return; }
      catch (error) { if (!api.ctx || typeof api.ctx.setExtensionPrompt !== 'function') throw error; }
    }
    if (api.ctx && typeof api.ctx.setExtensionPrompt === 'function') {
      await api.ctx.setExtensionPrompt(PROMPT_ID, content, 1, 0, false, 0);
      return;
    }
    throw new Error('缺少 injectPrompts/setExtensionPrompt，无法注入后台真值');
  }
  async function clearPrompt(api) {
    if (!promptActive) return;
    await inject(api, '');
    promptActive = false;
    promptSignature = null;
  }
  function truth(value, routing) {
    return '【丹杏后台当前真值】\n' + JSON.stringify({ ...routing, identityAuthority:'仅本聊天已提交开局有效；姓名/年岁/境界/已掌握武学/场景以playerOpening中玩家自定为准，身份模板的初始默认不得覆盖。NPC仅在nodes.entered中解锁后正式登场；青萝与影雀为同一人，战斗时favor_pose填战斗或拔剑，非战斗填常态。', ready: value.ready, time: value.ready ? value.time : null, characters:Object.values(value.characters||{}), characterAuthority:'【角色当前情况】characters为已出场角色的最新事实记录；只更新本轮有明确变化的角色，未知字段保留原值，传闻与计划不可当作已发生。每次正文后在character_updates申报变化并逐字引用本楼事实句。', official: value.official, clues: value.intel, nodes:value.events, custody: value.custody.map(({key,name,inCustody,state,floor})=>({key,name,inCustody,state,floor})), trend: { body: value.trend && value.trend.body || '' }, npcProfiles:Object.fromEntries(Object.keys(value.events?.entered||{}).filter(name=>config.npcProfiles?.[name]).map(name=>[name,config.npcProfiles[name]])) });
  }
  function announce(api, id) {
    for (const w of api.frames) {
      try { if (typeof w.dispatchEvent === 'function' && typeof w.CustomEvent === 'function') w.dispatchEvent(new w.CustomEvent('zyx-backend-state', { detail: { chatId: id } })); } catch (_) {}
    }
  }
  async function perform(forceInject) {
    let api = discover(), id = identity(api.ctx);
    if (currentId !== id) {
      state = null; settled = []; varsSignature = null; promptSignature = null; generating = false;
      currentId = id; diagnostics.chatId = id; diagnostics.active = !!id; diagnostics.pending = []; diagnostics.lastError = null;
      await clearPrompt(api);
      api = discover();
      if (identity(api.ctx) !== id) return;
    }
    if (!id || stopped) { if (!stopped) await clearPrompt(api); return; }
    const live = api.ctx.chat || [], expected = source(live);
    let input;
    if (isGenerating(api.ctx)) {
      // Only the unchanged prefix observed before generation may be replayed.
      let length = 0;
      while (length < settled.length && length < live.length && fingerprint(settled[length]) === expected[length]) length++;
      input = settled.slice(0, length);
    } else input = clone(live);
    const result = await engine.replay(input, config);
    if (!guard(id, expected)) return;
    const value = result.state;
    const setMessages = api.pick('setChatMessages');
    for (const frame of result.frames || []) {
      if (!guard(id, expected)) return;
      const now = discover().ctx.chat[frame.floor];
      if (!now || fingerprint(now) !== frame.sourceFingerprint) throw new Error('回放楼层指纹与当前候选不符');
      const backend = { schema: 1, chatId: id, sourceFingerprint: frame.sourceFingerprint, ...(frame.sourcePrefix?{sourcePrefix:frame.sourcePrefix}:{}), snapshot: frame.snapshot };
      const swipe = now.swipe_info && now.swipe_info[now.swipe_id ?? 0];
      // Real Helper stores swipe_info[index] as the extra itself; also accept wrapped legacy data.
      const swipeBackend = swipe && (swipe.zyx_backend || swipe.extra && swipe.extra.zyx_backend);
      if (same(now.extra && now.extra.zyx_backend, backend) && (!now.swipes || same(swipeBackend, backend))) continue;
      if (!setMessages) throw new Error('缺少 setChatMessages，后台快照未落盘');
      const extra = { ...(now.extra || {}), zyx_backend: backend };
      const originalText = now.mes;
      if (!guard(id, expected)) return;
      await setMessages([{ message_id: frame.floor, message: originalText, extra }], { refresh: 'none' });
      if (!guard(id, expected)) return;
      const written = discover().ctx.chat[frame.floor];
      const selected = written.swipe_info && written.swipe_info[written.swipe_id ?? 0];
      if (written.mes !== originalText || !same(written.extra && written.extra.zyx_backend, backend) || (written.swipes && !same(selected && (selected.zyx_backend || selected.extra && selected.extra.zyx_backend), backend))) throw new Error('setChatMessages 写后核验失败');
      diagnostics.messageWrites++;
    }
    const routing=route(input,config,api.ctx);
    const variables = {
      身份:routing.identity, zyx_identity:routing.identityId, zyx_characters:value.characters||{},
      zyx_time: value.ready ? value.time : null, zyx_clues: value.intel.names,
      zyx_intel: value.official?.val??0, zyx_intel_data:value.official??{}, zyx_clue_progress:value.intel, zyx_nodes: value.events??{}, zyx_places:value.nodes, zyx_custody: value.custody.map(({key,name,inCustody,state,floor})=>({key,name,inCustody,state,floor})),
      zyx_backend_current: { schema: 1, chatId: id, state: value },
    };
    const signature = JSON.stringify(variables);
    let projectionMismatch=false;
    const readVariables=api.pick('getVariables');
    if(readVariables&&varsSignature===signature){if(!guard(id,expected))return;const stored=await readVariables({type:'chat'});if(!guard(id,expected))return;projectionMismatch=Object.entries(variables).some(([key,value])=>!same(stored?.[key],value));}
    if (varsSignature !== signature || projectionMismatch || forceInject) {
      const assign = api.pick('insertOrAssignVariables');
      if (!assign) throw new Error('缺少 insertOrAssignVariables，聊天变量未投影');
      if (!guard(id, expected)) return;
      await assign(variables, { type: 'chat' });
      if (!guard(id, expected)) return;
      varsSignature = signature; diagnostics.variableWrites++;
    }
    try{diagnostics.identityWorldbook=await IdentityBook.synchronize(api,routing.identity,()=>guard(id,expected));}catch(error){diagnostics.identityWorldbook={ok:false,reason:String(error?.message||error)};}
    if(!guard(id,expected))return;
    const content = truth(value,routing);
    if (forceInject || content !== promptSignature) {
      if (!guard(id, expected)) return;
      promptActive = true;
      await inject(api, content);
      if (!guard(id, expected)) return;
      promptSignature = content; diagnostics.injections++;
    }
    if (!guard(id, expected)) return;
    state = clone(value);
    if (!isGenerating(api.ctx)) settled = clone(live);
    diagnostics.identity=routing.identity;diagnostics.unlockedProfiles=Object.keys(value.events?.entered||{}).filter(name=>config.npcProfiles?.[name]);
    diagnostics.syncs++;
    diagnostics.pending = clone(value.pending || result.pending || []);
    diagnostics.lastError = value.ready && !diagnostics.pending.length ? null : { stage: 'replay', message: value.ready ? '后台有待核事项' : '后台尚未就绪', pending: clone(diagnostics.pending) };
    if(!diagnostics.lastError&&config.identityWorldbookRequired&&diagnostics.identityWorldbook?.ok===false)diagnostics.lastError={stage:'identity_worldbook',message:diagnostics.identityWorldbook.reason};
    announce(api, id);
  }
  function sync(settings = {}) {
    if (stopped) return Promise.resolve(null);
    // Coalesce synchronous bursts, but an event during an awaited write gets a fresh queued pass.
    if (pending) { pending.forceInject ||= !!settings.forceInject; return pending.promise; }
    const job = { forceInject: !!settings.forceInject, promise: null };
    job.promise = queue.then(async () => {
      if (pending === job) pending = null;
      if (stopped) return null;
      try { await perform(job.forceInject); } catch (error) { fail('sync', error); }
      return state;
    });
    pending = job; queue = job.promise;
    return job.promise;
  }
  function listen(api, name, fn) {
    const candidates = [];
    if (api.ctx) candidates.push({ bus: api.ctx.eventSource, events: api.ctx.eventTypes || api.ctx.event_types });
    for (const w of api.frames) {
      try { candidates.push({ bus: w.eventSource, events: w.event_types || w.tavern_events }); } catch (_) {}
      try {
        for (const holder of [w, w.TavernHelper]) {
          if (!holder || !holder.tavern_events || !holder.tavern_events[name] || typeof holder.eventOn !== 'function') continue;
          const event = holder.tavern_events[name], handle = holder.eventOn(event, fn);
          removers.push(() => { if (handle && typeof handle.stop === 'function') handle.stop(); else if (typeof handle === 'function') handle(); else if (typeof holder.eventRemoveListener === 'function') holder.eventRemoveListener(event, fn); else if (typeof holder.eventOff === 'function') holder.eventOff(event, fn); });
          return true;
        }
      } catch (_) {}
    }
    for (const {bus, events} of candidates) {
      if (!bus || typeof bus.on !== 'function') continue;
      const event = events && events[name] || name.toLowerCase();
      bus.on(event, fn);
      removers.push(() => { if (typeof bus.removeListener === 'function') bus.removeListener(event, fn); else if (typeof bus.off === 'function') bus.off(event, fn); });
      return true;
    }
    return false;
  }
  function begin() {
    if (started || stopped) return runtime;
    started = true;
    const api = discover();
    let count = 0;
    for (const name of UPDATE_EVENTS) count += listen(api, name, () => { if (name === 'GENERATION_ENDED' || name === 'GENERATION_STOPPED' || name === 'CHAT_CHANGED') generating = false; return sync(); }) ? 1 : 0;
    for (const name of PRE_EVENTS) listen(api, name, async () => { await sync({ forceInject: true }); generating = true; });
    if (!count) {
      const interval = options.setInterval || setInterval;
      timer = interval(() => { sync(); }, options.pollInterval || 1000);
      if (timer && typeof timer.unref === 'function') timer.unref();
    }
    for(const w of api.frames){try{if(typeof w.addEventListener==='function'){const fn=()=>sync({forceInject:true});w.addEventListener('zyx-opening-committed',fn);removers.push(()=>w.removeEventListener('zyx-opening-committed',fn));}}catch{}}
    sync();
    return runtime;
  }
  async function stop() {
    stopped = true;
    for (const remove of removers.splice(0)) { try { remove(); } catch (_) {} }
    if (timer != null) (options.clearInterval || clearInterval)(timer);
    timer = null;
    await queue;
    try { await clearPrompt(discover()); } catch (error) { fail('cleanup', error); }
    state = null; settled = []; diagnostics.active = false;
  }
  const runtime = { start: begin, sync, getState: () => clone(state), getDiagnostics: () => clone(diagnostics), stop, dispose: stop };
  return runtime;
}
function start(options) { return createHostRuntime(options).start(); }
module.exports = { createHostRuntime, start };
