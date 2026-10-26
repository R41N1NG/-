(function(){"use strict";const modules=[function(require,module,exports){
'use strict';
const {start}=require(1);
const runtime=start({config:require(8)});
window.DanxingBackend=runtime;
window.addEventListener('pagehide',()=>runtime.dispose(),{once:true});

},
function(require,module,exports){
'use strict';

const PROMPT_ID = 'zyx_backend_truth';
const UPDATE_EVENTS = ['GENERATION_ENDED', 'GENERATION_STOPPED', 'MESSAGE_RECEIVED', 'MESSAGE_UPDATED', 'MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_SWIPED', 'CHAT_CHANGED'];
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
  const engine = options.engine || require(2);
  const fingerprint = options.fingerprint || require(7).fingerprint;
  const config = options.config || {};
  const root = options.window || (typeof window !== 'undefined' ? window : globalThis);
  let stopped = false, started = false, queue = Promise.resolve(), pending = null;
  let currentId = null, state = null, settled = [], varsSignature = null, promptSignature = null;
  let promptActive = false, generating = false, timer = null;
  const removers = [];
  const diagnostics = { active: false, chatId: null, lastError: null, syncs: 0, messageWrites: 0, variableWrites: 0, injections: 0 };
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
  function truth(value) {
    return '【丹杏后台当前真值】\n' + JSON.stringify({ ready: value.ready, time: value.ready ? value.time : null, intel: value.intel, custody: value.custody.map(({key,name,inCustody,state,floor})=>({key,name,inCustody,state,floor})), trend: { body: value.trend && value.trend.body || '' } });
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
      currentId = id; diagnostics.chatId = id; diagnostics.active = !!id;
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
    const variables = {
      zyx_time: value.ready ? value.time : null, zyx_clues: value.intel.names,
      zyx_intel: value.intel, zyx_nodes: value.nodes, zyx_custody: value.custody.map(({key,name,inCustody,state,floor})=>({key,name,inCustody,state,floor})),
      zyx_backend_current: { schema: 1, chatId: id, state: value },
    };
    const signature = JSON.stringify(variables);
    if (varsSignature !== signature) {
      const assign = api.pick('insertOrAssignVariables');
      if (!assign) throw new Error('缺少 insertOrAssignVariables，聊天变量未投影');
      if (!guard(id, expected)) return;
      await assign(variables, { type: 'chat' });
      if (!guard(id, expected)) return;
      varsSignature = signature; diagnostics.variableWrites++;
    }
    const content = truth(value);
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
    diagnostics.syncs++;
    diagnostics.lastError = value.ready ? null : { stage: 'replay', message: '后台尚未就绪', pending: value.pending || result.pending || [] };
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

},
function(require,module,exports){
'use strict';
/* gpt：权威结算纯引擎。活跃聊天按顺序回放，正文是输入，绝对时间与大势由脚本计算。 */
const Clock=require(3);
const Tracker=require(4);
const Ledger=require(6);
const {fingerprint}=require(7);
const defaults=require(8);
const clone=value=>structuredClone(value);
const unknown=value=>!value||/^(?:无|未明|未知|未记录|不详)$/.test(String(value).trim());
function report(input){const text=String(input??'').replace(/<(think|analysis)>[^]*?<\/\1>/gi,'').replace(/<details\b[^>]*>[^]*?<\/details>/gi,'');const blocks=[...text.matchAll(/<status_bar>((?:(?!<status_bar>)[^])*?)<\/status_bar>/g)];if(blocks.length!==1||!/^(?:---)?$/.test(text.slice(blocks[0].index+blocks[0][0].length).trim()))return null;
 const result={};for(const key of ['time','elapsed','location','prison_control','clue_obtained','clues_gained',...Tracker.tags]){const hits=[...blocks[0][1].matchAll(new RegExp('<'+key+'>([^<]*)</'+key+'>','g'))];if(hits.length>1)return null;result[key]=hits.length?Ledger.decodeText(hits[0][1]):'';}return result;}
function initial(){return {schema:1,ready:false,time:null,custody:Tracker.evaluateRoster([]),intel:{known:[],names:[],value:0,actCount:0,actTotal:0},trend:null,nodes:[],location:'未明',prisonControl:'未明',pending:[]};}
function gateResult(gate,state){
 if(!gate)return {status:'available',reason:'原卡已列出的场所节点'};
 if(gate.unconfigured)return {status:'unconfirmed',reason:gate.description};
 if(gate.endDay!==undefined&&state.time.dayIndex>gate.endDay)return {status:'expired',reason:gate.description||'已超过节点保留日期'};
 const tests=[];
 if(gate.startDay!==undefined)tests.push(state.time.dayIndex>=gate.startDay);
 if(gate.minIntel!==undefined)tests.push(state.intel.value>=gate.minIntel);
 const check=test=>test.prisonControl?state.prisonControl===test.prisonControl:test.clue?state.intel.known.includes(test.clue):false;
 if(gate.all)tests.push(gate.all.every(check));
 if(gate.any)tests.push(gate.any.some(check));
 return {status:tests.length?tests.every(Boolean)?'available':'locked':'unconfirmed',reason:gate.description||'配置中的时间与情报条件'};
}
function derive(state,config){if(!state.time)return;const act=state.time.act;state.trend=clone(config.acts.find(item=>item.act===act));const current=config.clues.filter(item=>item.act===act);state.intel.names=state.intel.known.map(id=>config.clues.find(item=>item.id===id)?.name).filter(Boolean);state.intel.value=state.intel.names.length;state.intel.actCount=current.filter(item=>state.intel.known.includes(item.id)).length;state.intel.actTotal=current.length;
 state.nodes=config.nodes.map(node=>({...clone(node),...gateResult(node.gate,state),current:state.location.includes(node.name)}));}
function addPending(state,floor,code,message){state.pending.push({floor,code,message});state.pending=state.pending.slice(-30);}
function gained(value){if(unknown(value))return [];try{const list=JSON.parse(value);return Array.isArray(list)&&list.length<=32&&list.every(item=>typeof item==='string')?[...new Set(list.map(item=>item.trim()).filter(Boolean))]:null;}catch{return null;}}
function replay(chat,config=defaults){if(!Array.isArray(chat))throw TypeError('需要当前聊天数组');const state=initial(),frames=[],custodyReports=[];
 for(let floor=0;floor<chat.length;floor++){const message=chat[floor];if(!message||message.is_system||message.is_user)continue;const parsed=report(message.mes??message.message);if(!parsed){if(floor>0)addPending(state,floor,'missing_report','本楼没有唯一完整的状态回报，未自动改变时间或情报。');continue;}
  if(!state.ready){if(floor!==0){addPending(state,floor,'missing_anchor','零楼没有可靠开局时刻，未猜测日期。');continue;}const anchor=Clock.parseAnchor(parsed.time);if(!anchor){addPending(state,floor,'missing_anchor','开局时刻无法解析，未默认四月初一。');continue;}state.time=anchor;state.ready=true;}
  const actAtStart=state.time.act;
  custodyReports.push({...parsed,floor});state.custody=Tracker.evaluateRoster(custodyReports);
  if(!unknown(parsed.location))state.location=parsed.location;
  if(['未涉','受限','掌控'].includes(parsed.prison_control))state.prisonControl=parsed.prison_control;
  const items=gained(parsed.clues_gained);
  if(items===null)addPending(state,floor,'invalid_clues','clues_gained须是信物ID/名称的JSON数组。');
  else if(parsed.clue_obtained==='1'){
   if(!items.length)addPending(state,floor,'unnamed_clue','标记获得信物但未给确切ID/名称，不自动领取第一个目标。');
   for(const value of items){const item=config.clues.find(entry=>entry.id===value||entry.name===value||entry.aliases?.includes(value));if(!item){addPending(state,floor,'unknown_clue','未收录的信物未自动入账：'+value);continue;}if(item.act>actAtStart){addPending(state,floor,'future_clue','尚未开放幕次的信物未自动入账：'+item.name);continue;}if(!state.intel.known.includes(item.id))state.intel.known.push(item.id);}
  }else if(items?.length)addPending(state,floor,'unconfirmed_clue','列出信物但没有明确获得标记，未入账。');
  if(floor>0){const minutes=Clock.parseElapsed(parsed.elapsed);if(minutes===null)addPending(state,floor,'unknown_elapsed','耗时未明确，时钟保持原值。');else{try{state.time=Clock.advance(state.time,minutes);}catch{addPending(state,floor,'invalid_elapsed','耗时超出安全范围，时钟保持原值。');}}}
  derive(state,config);frames.push({floor,sourceFingerprint:fingerprint(message),sourcePrefix:fingerprint({mes:JSON.stringify(chat.slice(0,floor+1).map(fingerprint))}),snapshot:clone(state)});
 }
 return {state:clone(state),frames,pending:clone(state.pending)};
}
module.exports={replay,report,fingerprint};

},
function(require,module,exports){
'use strict';
// gpt：固定30日/月的纯函数台历。按原EJS阈值，首幕实际49天；原注释“50天”差一日。
const ACTS=Object.freeze([
 {act:1,start:1,term:'暮春初夏',phase:'禁令严颁'},
 {act:2,start:50,term:'仲夏入伏',phase:'巡抚开阖'},
 {act:3,start:110,term:'盛夏大暑',phase:'塞北巡边'},
 {act:4,start:170,term:'金秋霜降',phase:'督办考课'},
 {act:5,start:230,term:'初冬岁末',phase:'案牍定谳'}
].map(Object.freeze));
const digits='零一二三四五六七八九';
function numeral(raw){
 const s=String(raw).replace(/两/g,'二').replace(/〇/g,'零');
 if(/^\d+$/.test(s)){const n=Number(s);return Number.isSafeInteger(n)?n:null;}
 if(!/^[零一二三四五六七八九十百千万]+$/.test(s))return null;
 if(!/[十百千万]/.test(s)){const n=Number([...s].map(c=>digits.indexOf(c)).join(''));return Number.isSafeInteger(n)?n:null;}
 let total=0,section=0,n=0,last=10000;
 for(const c of s){if(digits.includes(c)){if(n!==0)return null;n=digits.indexOf(c);continue;}const unit={十:10,百:100,千:1000,万:10000}[c];if(unit===10000){total+=(section+n)*unit;section=0;n=0;last=10000;}else{if(unit>=last)return null;section+=(n||1)*unit;n=0;last=unit;}}
 const result=total+section+n;return Number.isSafeInteger(result)?result:null;
}
function chinese(n){if(n<10)return digits[n];if(n<20)return '十'+(n%10?digits[n%10]:'');if(n<100)return digits[Math.floor(n/10)]+'十'+(n%10?digits[n%10]:'');if(n<10000){const unit=n>=1000?1000:100,label=unit===1000?'千':'百',rest=n%unit;return digits[Math.floor(n/unit)]+label+(rest?(rest<unit/10?'零':'')+chinese(rest):'');}return String(n);}
const dayText=n=>n<=10?'初'+chinese(n):n<20?'十'+digits[n%10]:n===20?'二十':n<30?'廿'+digits[n%10]:'三十';
function actForDay(dayIndex){if(!Number.isSafeInteger(dayIndex)||dayIndex<1)throw new RangeError('dayIndex必须为正安全整数');return ACTS.findLast(a=>dayIndex>=a.start);}
function format(time){return time.era+chinese(time.year)+'年'+chinese(time.month)+'月'+dayText(time.monthDay)+' '+String(time.hour).padStart(2,'0')+':'+String(time.minute).padStart(2,'0')+(time.second?':'+String(time.second).padStart(2,'0'):'');}
function make(dayIndex,hour,minute,second=0,precision=second?'second':'minute'){
 const absolute=3*30+dayIndex-1,year=5+Math.floor(absolute/360),month=Math.floor(absolute%360/30)+1,monthDay=absolute%30+1;
 const {act,term,phase}=actForDay(dayIndex);const state={era:'宣德',year,month,monthDay,hour,minute,second,precision,dayIndex,act,term,phase};
 return {...state,yearName:chinese(year)+'年',monthName:chinese(month)+'月',dayName:dayText(monthDay),shichen:'子丑寅卯辰巳午未申酉戌亥'[Math.floor(((hour+1)%24)/2)]+'时',dateText:'宣德'+chinese(year)+'年'+chinese(month)+'月'+dayText(monthDay),timeText:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0')+(second?':'+String(second).padStart(2,'0'):''),formatted:format(state)};
}
function parseElapsed(value){
 if(typeof value!=='string')return null;
 const text=value.trim().replace(/\s+/g,'').replace(/个/g,'').replace(/整(?=日|天)/g,'').replace(/([\d零〇一二两三四五六七八九十百千万]+)半(分钟|刻钟|时辰|小时|日|天)/g,'$1$2半');
 if(!text)return null;
 const re=/(半|\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百千万]+)(分钟|刻钟|时辰|小时|日|天)(半)?/gy;
 let end=0,total=0,match;const units=new Set();
 while((match=re.exec(text))){if(match.index!==end)return null;end=re.lastIndex;const unit={分钟:1,刻钟:15,时辰:120,小时:60,日:1440,天:1440}[match[2]];if(units.has(unit))return null;units.add(unit);let n=match[1]==='半'?0.5:/^\d/.test(match[1])?Number(match[1]):numeral(match[1]);if(n===null||!Number.isFinite(n)||n<0||match[1]==='半'&&match[3])return null;if(match[3])n+=0.5;total+=n*unit;if(!Number.isSafeInteger(total*60))return null;}
 return end===text.length?total:null;
}
function parseAnchor(value){
 if(typeof value!=='string')return null;
 const m=value.trim().match(/^宣德([\d零〇一二两三四五六七八九十百千万]+)年([\d一二两三四五六七八九十]+)月(初?[\d一二三四五六七八九十]+|廿[一二三四五六七八九]?|三十)(?:日)?(?:\s*(.*))?$/);
 if(!m)return null;const year=numeral(m[1]),month=numeral(m[2]),day=numeral(m[3].replace(/^初/,'').replace(/^廿/,'二十'));
 if(year===null||year<5||month===null||month<1||month>12||day===null||day<1||day>30)return null;
 const tail=m[4]||'',hm=tail.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:$|\s)/),period=tail.match(/([子丑寅卯辰巳午未申酉戌亥])时/);
 let hour,minute;if(hm){hour=Number(hm[1]);minute=Number(hm[2]);if(hour>23||minute>59)return null;}else if(period){hour=({子:23,丑:1,寅:3,卯:5,辰:7,巳:9,午:11,未:13,申:15,酉:17,戌:19,亥:21})[period[1]];minute=0;}else return null;
 // 日期明确优先，但不接受无意义的尾部内容。
 if(tail.replace(/\d{1,2}:\d{2}/g,'').replace(/[子丑寅卯辰巳午未申酉戌亥]时/g,'').trim())return null;
 const dayIndex=(year-5)*360+(month-4)*30+day;if(!Number.isSafeInteger(dayIndex)||dayIndex<1||!Number.isSafeInteger((dayIndex-1)*86400+hour*3600+minute*60))return null;
 return make(dayIndex,hour,minute,0,hm?'minute':'shichen');
}
function advance(state,minutes){
 if(!state||!Number.isFinite(minutes)||!Number.isSafeInteger(minutes*60)||minutes<0||!Number.isSafeInteger(state.dayIndex)||state.dayIndex<1||!Number.isInteger(state.hour)||state.hour<0||state.hour>23||!Number.isInteger(state.minute)||state.minute<0||state.minute>59||!Number.isInteger(state.second??0)||(state.second??0)<0||(state.second??0)>59)throw new RangeError('时间与耗时须有效，耗时为非负分钟且总秒数为安全整数');
 const sum=(state.dayIndex-1)*86400+state.hour*3600+state.minute*60+(state.second??0)+minutes*60;
 if(!Number.isSafeInteger(sum))throw new RangeError('时间溢出');
 return make(Math.floor(sum/86400)+1,Math.floor(sum%86400/3600),Math.floor(sum%3600/60),sum%60,minutes===0?state.precision:sum%60?'second':'minute');
}
module.exports={ACTS,parseElapsed,parseAnchor,advance,actForDay,format};

},
function(require,module,exports){
/* gpt：八人纯函数羁押回放。初始未知，只信人物专属字段，不从传闻/全局事件猜归属。 */
(function(global){
 'use strict';
 const definitions=global.ZYX_HUD_CONFIG?.roster??(typeof require==='function'?require(5):[]);
 const unknown=v=>!v||/^(?:无|未明|未知|未记录|未登记|不详)$/.test(String(v).trim());
 const positive=new Set(['在押','关押中','已关押','已被关押','被关押','已收监','收监','已收押','收押','已入狱','入狱','被囚禁','被拘禁']);
 const negative=new Set(['未关押','未被关押','未在押','不在押','未入狱','未被捕','未曾被捕','自由','已释放','释放','获释','已获释','无罪释放','脱困','已脱困','逃脱','已逃脱','脱逃','已脱逃','越狱','已越狱','获救','已获救','救出','已救出','已离狱','已出狱','已死亡','已身亡']);
 function transition(value,def){if(unknown(value))return null;let text=String(value).trim();
  for(const name of [def.name,...def.aliases].sort((a,b)=>b.length-a.length)){if(text.startsWith(name)){text=text.slice(name.length).replace(/^[\s:：·]+/,'');break;}}
  const prefix=text.split(/[｜|：:，,；;。\n]/,1)[0].trim();
  if(positive.has(prefix))return true;if(negative.has(prefix))return false;
  // 兼容旧字段的明确直述；只接受以事实开头，拒绝“将/若/可能/据说”等条件传闻。
  if(/^(?:已被关押|被关押|已关押|已收监|已收押|关押中)(?:于|在|至|到|$)/.test(text))return true;
  if(/^(?:已经获释|已经脱困|已获释|已释放|已脱困|已逃脱|已经逃脱)(?:离开|离狱|回到|返回|$)/.test(text))return false;
  return null;
 }
 function evaluateRoster(reports=[]){
  const roster=definitions.map(def=>({...def,inCustody:null,isImprisoned:false,state:'未回报羁押状态',floor:null,custodyFloor:null}));
  for(const report of reports){for(const item of roster){const value=report[item.tag];if(unknown(value))continue;item.state=String(value).trim();item.floor=report.floor??null;const flag=transition(value,item);if(flag!==null){item.inCustody=flag;item.isImprisoned=flag;item.custodyFloor=report.floor??null;}}}
  return roster;
 }
 const api=Object.freeze({evaluateRoster,getImprisonedList:reports=>evaluateRoster(reports).filter(x=>x.inCustody===true),transition,tags:definitions.map(x=>x.tag)});
 global.ZYXPrisonTracker=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);

},
function(require,module,exports){
module.exports=[
 {"key":"bailian","name":"白雪莲","tag":"bailian_state","aliases":[],"portraitKey":"白雪莲-关押中","profile":"罗霄派亲传弟子、刑部捕盗司巡按女捕快。原设境界：通明。"},
 {"key":"shuangling","name":"薛霜灵","tag":"shuangling_state","aliases":[],"portraitKey":"薛霜灵-关押中","profile":"白莲教左路信使。原设境界：冲脉。"},
 {"key":"danniang","name":"裴丹杏","tag":"danniang_state","aliases":["丹娘"],"portraitKey":"丹娘-关押中","profile":"杏花村客栈掌柜，白雪莲与白玉莲之母；又称丹娘。"},
 {"key":"yuniang","name":"裴青玉","tag":"yuniang_state","aliases":["玉娘","潇潇"],"portraitKey":"玉娘-关押中","profile":"罗霄山徐家遗孀，丹娘亲妹；又称玉娘、潇潇。"},
 {"key":"baiyulian","name":"白玉莲","tag":"baiyulian_state","aliases":[],"portraitKey":"白玉莲-关押中","profile":"白雪莲胞妹，凡俗闺秀。"},
 {"key":"xieyunsu","name":"谢云素","tag":"xieyunsu_state","aliases":[],"portraitKey":"谢云素-关押中","profile":"罗霄派宿老。原设境界：绝顶·先天初境圆满。"},
 {"key":"junzhu","name":"朱仪瑄","tag":"junzhu_state","aliases":["郡主","宁安郡主","宣姑娘"],"portraitKey":"郡主-关押中","profile":"宁安郡主，又称宣姑娘。原设境界：凡骨初阶。"},
 {"key":"qingluo","name":"青萝","tag":"qingluo_state","aliases":["影雀"],"portraitKey":"青萝-关押中","profile":"郡主近卫，又称影雀。原设境界：入微·真气贯通。"}
]
;
},
function(require,module,exports){
/* gpt：只读原生聊天中当前候选的明确记录；不写变量，不用growth推断掌握或升境。 */
(function(global){
 'use strict';
 const realms=['末流','凡骨','淬体','冲脉','通明','入微','绝顶','宗师','半步天人','天人'];
 const none=value=>!value||/^(无|暂无|未明|未知|未记录|未登记|不详)$/.test(String(value).trim());
 function decode(value){return String(value??'').replace(/&(amp|lt|gt|quot|apos|nbsp);|&#(x[0-9a-f]+|[0-9]+);/gi,(all,name,n)=>{if(name)return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'}[name.toLowerCase()];const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):all;}).trim();}
 function realm(value){const text=decode(value);return realms.some(r=>text===r||text===r+'巅峰'||text===r+'·巅峰')?text:null;}
 function skills(value){if(Array.isArray(value))return [...new Set(value.slice(0,64).filter(v=>typeof v==='string').flatMap(skills))];const text=decode(value);if(none(text))return [];if(text.startsWith('[')){try{const parsed=JSON.parse(text);return Array.isArray(parsed)?skills(parsed):[];}catch{return [];}}
  return [...new Set(text.split(/[、,，;；\n]+/).map(v=>v.trim()).filter(v=>v&&!none(v)&&v.length<=80&&!/[<>\x00-\x1f]/.test(v)))].slice(0,64);
 }
 function parseOpening(text){const marker='[玩家开局设定已载入]',at=String(text).indexOf(marker);if(at<0)return null;const start=text.indexOf('{',at+marker.length);if(start<0)return null;let depth=0,quote=false,escape=false;
  for(let i=start;i<text.length;i++){const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}if(c==='"')quote=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{const record=JSON.parse(text.slice(start,i+1));if(!record||typeof record!=='object'||Array.isArray(record))return null;return {name:String(record['姓名']??''),identity:String(record['身位']??''),realm:realm(record['武功境界']),skills:skills(record['掌握武学']??record['已掌握武学']),hasSkillRecord:!none(record['掌握武学']??record['已掌握武学'])};}catch{return null;}}}return null;
 }
 function readReport(text){const clean=String(text??'').replace(/<(think|analysis)>[^]*?<\/\1>/gi,'').replace(/<details\b[^>]*>[^]*?<\/details>/gi,'');const blocks=[...clean.matchAll(/<status_bar>((?:(?!<status_bar>)[^])*?)<\/status_bar>/g)];if(blocks.length!==1||!clean.slice(blocks[0].index+blocks[0][0].length).trim().match(/^(?:---)?$/))return null;
  const content=blocks[0][1],get=tag=>{const hits=[...content.matchAll(new RegExp('<'+tag+'>([^<]*)</'+tag+'>','g'))];return hits.length===1?decode(hits[0][1]):'';};
  return {realm:realm(get('player_realm')),skills:skills(get('player_skills')),hasSkillRecord:!none(get('player_skills')),growth:{skill:get('growth_skill'),reason:get('growth_reason'),weight:get('growth_weight')}};
 }
 function committedOpening(message){
  const saved=message?.extra?.zyx_opening;
  if(saved?.version!==1||!saved.record||!String(message.mes??message.message??'').includes('<details data-zyx-opening="committed">'))return null;
  const expected=parseOpening('[玩家开局设定已载入]'+JSON.stringify(saved.record));
  const actual=parseOpening(String(message.mes??message.message??''));
  return expected&&actual&&JSON.stringify(expected)===JSON.stringify(actual)?actual:null;
 }
 function skillKey(value){return String(value).replace(/[《》「」]/g,'').replace(/[·・（(\s]+(?:初学|小成|大成|巅峰|圆满)[)）]?$/,'').trim();}
 function mergeSkill(state,skill,source){const key=skillKey(skill),old=state.skills.findIndex(v=>skillKey(v)===key);if(old<0){state.skills.push(skill);state.skillSources[skill]=source;}else if(skill!==state.skills[old]&&/[·・（(\s]+(?:初学|小成|大成|巅峰|圆满)[)）]?$/.test(skill.replace(/[《》「」]/g,''))){delete state.skillSources[state.skills[old]];state.skills[old]=skill;state.skillSources[skill]=source;}}
 function initial(){return {realm:null,skills:[],identity:'',playerName:'',openingFloor:null,realmSource:null,skillSources:Object.create(null),growth:[],reportFloor:null};}
 function apply(state,report,floor){if(!report)return;if(report.realm){state.realm=report.realm;state.realmSource={type:'report',floor};}for(const skill of report.skills)mergeSkill(state,skill,{type:'report',floor});
  if(report.growth&&!none(report.growth.skill))state.growth.push({...report.growth,floor});state.reportFloor=floor;
 }
 function fromChat(chat,{cutoff}={}){if(!Array.isArray(chat)||!Number.isInteger(cutoff)||cutoff<0||cutoff>=chat.length)throw new Error('武学回放必须给出当前楼层边界');let state=initial();
  for(let i=0;i<=cutoff;i++){const message=chat[i];if(!message||message.is_system)continue;const body=String(message.mes??message.message??'');const opening=message.is_user?parseOpening(body):i===0?committedOpening(message):null;if(opening){state=initial();Object.assign(state,{realm:opening.realm,skills:[],identity:opening.identity,playerName:opening.name,openingFloor:i,realmSource:opening.realm?{type:'opening',floor:i}:null});for(const skill of opening.skills)mergeSkill(state,skill,{type:'opening',floor:i});}else if(!message.is_user)apply(state,readReport(body),i);}
  state.growth=state.growth.slice(-30);return state;
 }
 function fromSnapshot(snapshot){const state=initial();apply(state,{realm:realm(snapshot.realm),skills:skills(snapshot.skills),growth:snapshot.growth},null);return state;}
 global.ZYXMartialLedger={realms,decodeText:decode,normalizeRealm:realm,parseSkills:skills,parseOpening,committedOpening,readReport,fromChat,fromSnapshot};
 if(typeof module==='object'&&module.exports)module.exports=global.ZYXMartialLedger;
})(typeof window==='object'?window:globalThis);

},
function(require,module,exports){
/* gpt：绑定原始正文和当前候选的短指纹；不把自身后台快照算入输入。 */
(function(global){
 'use strict';
 function fingerprint(message){const text=JSON.stringify([message?.mes??message?.message??'',message?.swipe_id??0,message?.extra?.zyx_opening??null]);let a=2166136261,b=5381;for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);a=Math.imul(a^code,16777619)>>>0;b=(Math.imul(b,33)^code)>>>0;}return text.length+':'+a.toString(16)+':'+b.toString(16);}
 const api={fingerprint};global.ZYXFingerprint=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);

},
function(require,module,exports){
module.exports={
  "schema": 1,
  "calendar": "card_30_day_month",
  "intelligence": {
    "mode": "confirmed_clue_count",
    "description": "原卡信物计数，非额外虚构的情报点数"
  },
  "clues": [
    {
      "id": "clue_1_1",
      "name": "白莲教调兵密函",
      "act": 1,
      "aliases": [
        "白莲教红阳真人家信密函",
        "红阳真人家信密函"
      ]
    },
    {
      "id": "clue_1_2",
      "name": "刑部捕盗司青铜腰牌",
      "act": 1,
      "aliases": []
    },
    {
      "id": "clue_1_3",
      "name": "罗霄混元气秘笈",
      "act": 1,
      "aliases": [
        "罗霄混元气秘笈"
      ]
    },
    {
      "id": "clue_1_4",
      "name": "边陲收押巡查名册",
      "act": 1,
      "aliases": []
    },
    {
      "id": "clue_2_1",
      "name": "各方悬赏海捕公文",
      "act": 2,
      "aliases": []
    },
    {
      "id": "clue_2_2",
      "name": "伪造通逆串供文牍",
      "act": 2,
      "aliases": []
    },
    {
      "id": "clue_2_3",
      "name": "重锁封脉枷镣",
      "act": 2,
      "aliases": []
    },
    {
      "id": "clue_2_4",
      "name": "神仙岭客栈暗账",
      "act": 2,
      "aliases": []
    },
    {
      "id": "clue_3_1",
      "name": "东厂巡边腰牌",
      "act": 3,
      "aliases": []
    },
    {
      "id": "clue_3_2",
      "name": "锦衣卫北司巡察密旨",
      "act": 3,
      "aliases": []
    },
    {
      "id": "clue_3_3",
      "name": "长宁知县暗档",
      "act": 3,
      "aliases": []
    },
    {
      "id": "clue_3_4",
      "name": "宁安郡主蟠龙金符",
      "act": 3,
      "aliases": []
    },
    {
      "id": "clue_4_1",
      "name": "东厂限期缉拿严旨",
      "act": 4,
      "aliases": []
    },
    {
      "id": "clue_4_2",
      "name": "三省边防戒严令箭",
      "act": 4,
      "aliases": []
    },
    {
      "id": "clue_4_3",
      "name": "深山黑狱地牢秘钥",
      "act": 4,
      "aliases": []
    },
    {
      "id": "clue_5_1",
      "name": "巡按御史平反手谕",
      "act": 5,
      "aliases": []
    },
    {
      "id": "clue_5_2",
      "name": "厂卫谋逆专权铁证",
      "act": 5,
      "aliases": []
    },
    {
      "id": "clue_5_3",
      "name": "三法司定谳公文",
      "act": 5,
      "aliases": []
    }
  ],
  "acts": [
    {
      "act": 1,
      "startsAt": 1,
      "title": "【第一幕 · 暮春初夏 · 禁令严颁】（当前生效大势 · 宣德五年四月初一至五月十九）",
      "body": "【第一幕 · 暮春初夏 · 禁令严颁】（当前生效大势 · 宣德五年四月初一至五月十九）\n* 天下宏观大势：\n  * 大明宣德五年春，仁宣之治方兴，天子与内阁重臣议宽恤民力，下诏蠲免钱粮；然永乐以降对民间邪教之警惕未曾松懈，刑部与兵部行文天下十三布政司，海捕严缉白莲教红阳派残余逆党，凡查获密件与信使者许以升迁重赏，隐匿不报者按谋反连坐。\n* 天时地利气象：\n  * 暮春初夏交替，江南与岭南交界群山连月阴雨迷蒙，山洪暴涨，多处栈道与泥石险径受阻；崇山深谷与州府官道交通阻隔，深山边陲俨如孤岛，外界消息迟滞难通。",
      "summary": "大明宣德五年春，仁宣之治方兴，天子与内阁重臣议宽恤民力，下诏蠲免钱粮；然永乐以降对民间邪教之警惕未曾松懈，刑部与兵部行文天下十三布政司，海捕严缉白莲教红阳派残余逆党，凡查获密件与信使者许以升迁重赏，隐匿不报者按谋反连坐。天时地利气象：暮春初夏交替，江南与岭南交界群山连月阴雨迷蒙，山洪暴涨，多处栈道与泥石险径受阻；崇山深"
    },
    {
      "act": 2,
      "startsAt": 50,
      "title": "【第二幕 · 仲夏入伏 · 巡抚开阖】（当前生效大势 · 宣德五年五月二十至七月十九）",
      "body": "【第二幕 · 仲夏入伏 · 巡抚开阖】（当前生效大势 · 宣德五年五月二十至七月十九）\n* 天下宏观大势：\n  * 宣德五年五月，朝廷正式确立巡抚之制，特简六部侍郎与都御史分巡江南、江西诸省清查赋税积弊、总督税粮，整饬贪墨；汉王朱高煦叛乱平定之后，朝廷加紧削夺各藩王护卫，天下藩王闭门自危；三省州县官僚系统在清查风潮下震恐紧绷，各级官吏严查过往文卷，自保防范甚严。\n* 天时地利气象：\n  * 仲夏时节入伏，暴雨稍歇，骄阳似火。山道积水退去，三省通商驿路行人商贾骤增，南北各路车马与江湖客流渐趋繁密，大明帝国肌理在热浪中喧腾躁动。",
      "summary": "宣德五年五月，朝廷正式确立巡抚之制，特简六部侍郎与都御史分巡江南、江西诸省清查赋税积弊、总督税粮，整饬贪墨；汉王朱高煦叛乱平定之后，朝廷加紧削夺各藩王护卫，天下藩王闭门自危；三省州县官僚系统在清查风潮下震恐紧绷，各级官吏严查过往文卷，自保防范甚严。天时地利气象：仲夏时节入伏，暴雨稍歇，骄阳似火。山道积水退去，三省通商驿"
    },
    {
      "act": 3,
      "startsAt": 110,
      "title": "【第三幕 · 盛夏大暑 · 塞北巡边】（当前生效大势 · 宣德五年七月二十至九月十九）",
      "body": "【第三幕 · 盛夏大暑 · 塞北巡边】（当前生效大势 · 宣德五年七月二十至九月十九）\n* 天下宏观大势：\n  * 盛夏交秋，因北疆塞外兀良哈三卫异动，明宣宗亲率京军三大营精锐车驾巡幸宣府、洗马林一带整饬边备，九边戒严；朝廷内廷司礼监与内官力量借机遍布南北水陆枢纽；刑部更令各按察司通令天下严密清查私度僧道度牒、收紧黄册路引，严防妖言惑众与逆党流窜。\n* 天时地利气象：\n  * 大暑转入处暑白露，山间午后常伴惊雷骤雨。南北驿道上快马公差飞驰往来，各处巡检司关津与要冲查验严苛，行旅之人风声鹤唳，帝国防备之网无远弗届。",
      "summary": "盛夏交秋，因北疆塞外兀良哈三卫异动，明宣宗亲率京军三大营精锐车驾巡幸宣府、洗马林一带整饬边备，九边戒严；朝廷内廷司礼监与内官力量借机遍布南北水陆枢纽；刑部更令各按察司通令天下严密清查私度僧道度牒、收紧黄册路引，严防妖言惑众与逆党流窜。天时地利气象：大暑转入处暑白露，山间午后常伴惊雷骤雨。南北驿道上快马公差飞驰往来，各处"
    },
    {
      "act": 4,
      "startsAt": 170,
      "title": "【第四幕 · 金秋霜降 · 督办考课】（当前生效大势 · 宣德五年九月二十至十一月十九）",
      "body": "【第四幕 · 金秋霜降 · 督办考课】（当前生效大势 · 宣德五年九月二十至十一月十九）\n* 天下宏观大势：\n  * 金秋霜降，岁末逼近。朝廷三年一度的考课大计临界，三法司重狱文牒纷纷下达各按察司与府县；从京师到行省，督抚重臣对辖境内未决大案与钦犯逃案严厉催逼，限期结案报奏，督责官吏逾期连坐；天下各处关隘哨卡防务全面收紧。\n* 天时地利气象：\n  * 寒霜初降，草木凋零，山风萧瑟凛冽。南疆要隘各路官防营伍刀枪明亮，关防盘查日趋森严，四方大案定案呈解在即，四方肃杀之气直冲云霄。",
      "summary": "金秋霜降，岁末逼近。朝廷三年一度的考课大计临界，三法司重狱文牒纷纷下达各按察司与府县；从京师到行省，督抚重臣对辖境内未决大案与钦犯逃案严厉催逼，限期结案报奏，督责官吏逾期连坐；天下各处关隘哨卡防务全面收紧。天时地利气象：寒霜初降，草木凋零，山风萧瑟凛冽。南疆要隘各路官防营伍刀枪明亮，关防盘查日趋森严，四方大案定案呈解在"
    },
    {
      "act": 5,
      "startsAt": 230,
      "title": "【第五幕 · 初冬岁末 · 案牍定谳】（当前生效大势 · 宣德五年十一月二十起）",
      "body": "【第五幕 · 初冬岁末 · 案牍定谳】（当前生效大势 · 宣德五年十一月二十起）\n* 天下宏观大势：\n  * 冬至岁末，朔风呼啸。巡抚与按察使法堂按律举行岁末大审，汇齐三法司卷宗，提审天下重辟与要案；大明帝国纲常法度在此展开一年一度的天下决断，赏罚升迁、平反定谳在此大白于天下。\n* 天时地利气象：\n  * 阴云漫天，寒气彻骨。州府正堂大门敞开，水火棍列于阶前，案卷如山，朝廷威仪之下，一切江湖流变与隐秘争端在此承受最终的历史清算。",
      "summary": "冬至岁末，朔风呼啸。巡抚与按察使法堂按律举行岁末大审，汇齐三法司卷宗，提审天下重辟与要案；大明帝国纲常法度在此展开一年一度的天下决断，赏罚升迁、平反定谳在此大白于天下。天时地利气象：阴云漫天，寒气彻骨。州府正堂大门敞开，水火棍列于阶前，案卷如山，朝廷威仪之下，一切江湖流变与隐秘争端在此承受最终的历史清算。"
    }
  ],
  "nodes": [
    {
      "id": "place_01",
      "name": "门前竹篱前院",
      "scene": "神仙岭与杏花村客栈",
      "aliases": [
        "门前竹篱前院",
        "神仙岭与杏花村客栈·门前竹篱前院"
      ],
      "gate": null,
      "sourceEntryId": 6
    },
    {
      "id": "place_02",
      "name": "一楼客堂大厅",
      "scene": "神仙岭与杏花村客栈",
      "aliases": [
        "一楼客堂大厅",
        "神仙岭与杏花村客栈·一楼客堂大厅"
      ],
      "gate": null,
      "sourceEntryId": 6
    },
    {
      "id": "place_03",
      "name": "一楼后堂与后厨酒窖",
      "scene": "神仙岭与杏花村客栈",
      "aliases": [
        "一楼后堂与后厨酒窖",
        "神仙岭与杏花村客栈·一楼后堂与后厨酒窖"
      ],
      "gate": null,
      "sourceEntryId": 6
    },
    {
      "id": "place_04",
      "name": "二楼客房走廊",
      "scene": "神仙岭与杏花村客栈",
      "aliases": [
        "二楼客房走廊",
        "神仙岭与杏花村客栈·二楼客房走廊"
      ],
      "gate": null,
      "sourceEntryId": 6
    },
    {
      "id": "place_05",
      "name": "白家后院天井私宅",
      "scene": "神仙岭与杏花村客栈",
      "aliases": [
        "白家后院天井私宅",
        "神仙岭与杏花村客栈·白家后院天井私宅"
      ],
      "gate": null,
      "sourceEntryId": 6
    },
    {
      "id": "place_06",
      "name": "神仙岭险道隘口（一线天通道中段）",
      "scene": "神仙岭险道隘口",
      "aliases": [
        "神仙岭险道隘口（一线天通道中段）",
        "神仙岭险道隘口·神仙岭险道隘口（一线天通道中段）"
      ],
      "gate": null,
      "sourceEntryId": 7
    },
    {
      "id": "place_07",
      "name": "山门外院",
      "scene": "豺狼坡黑狱",
      "aliases": [
        "山门外院",
        "豺狼坡黑狱·山门外院"
      ],
      "gate": null,
      "sourceEntryId": 8
    },
    {
      "id": "place_08",
      "name": "正殿大堂 (伪公堂)",
      "scene": "豺狼坡黑狱",
      "aliases": [
        "正殿大堂 (伪公堂)",
        "豺狼坡黑狱·正殿大堂 (伪公堂)"
      ],
      "gate": null,
      "sourceEntryId": 8
    },
    {
      "id": "place_09",
      "name": "地上监舍大通牢",
      "scene": "豺狼坡黑狱",
      "aliases": [
        "地上监舍大通牢",
        "豺狼坡黑狱·地上监舍大通牢"
      ],
      "gate": null,
      "sourceEntryId": 8
    },
    {
      "id": "place_10",
      "name": "地下铁笼水牢",
      "scene": "豺狼坡黑狱",
      "aliases": [
        "地下铁笼水牢",
        "豺狼坡黑狱·地下铁笼水牢"
      ],
      "gate": {
        "any": [
          {
            "prisonControl": "掌控"
          },
          {
            "clue": "clue_4_3"
          }
        ],
        "description": "需取得水牢钥匙或已明确掌控监牢。"
      },
      "sourceEntryId": 8
    },
    {
      "id": "place_11",
      "name": "后院生活区",
      "scene": "豺狼坡黑狱",
      "aliases": [
        "后院生活区",
        "豺狼坡黑狱·后院生活区"
      ],
      "gate": null,
      "sourceEntryId": 8
    },
    {
      "id": "place_12",
      "name": "长宁南门与瓮城",
      "scene": "长宁县城",
      "aliases": [
        "长宁南门与瓮城",
        "长宁县城·长宁南门与瓮城"
      ],
      "gate": {
        "unconfigured": true,
        "description": "日出启、日落锁及关防盘查；原卡未给精确启闭时刻。"
      },
      "sourceEntryId": 9
    },
    {
      "id": "place_13",
      "name": "县城十字长街市井",
      "scene": "长宁县城",
      "aliases": [
        "县城十字长街市井",
        "长宁县城·县城十字长街市井"
      ],
      "gate": null,
      "sourceEntryId": 9
    },
    {
      "id": "place_14",
      "name": "长宁县衙大堂与内衙",
      "scene": "长宁县城",
      "aliases": [
        "长宁县衙大堂与内衙",
        "长宁县城·长宁县衙大堂与内衙"
      ],
      "gate": null,
      "sourceEntryId": 9
    },
    {
      "id": "place_15",
      "name": "山麓迎宾牌坊与徐府庄园",
      "scene": "罗霄山",
      "aliases": [
        "山麓迎宾牌坊与徐府庄园",
        "罗霄山·山麓迎宾牌坊与徐府庄园"
      ],
      "gate": null,
      "sourceEntryId": 10
    },
    {
      "id": "place_16",
      "name": "山门中台演武坪",
      "scene": "罗霄山",
      "aliases": [
        "山门中台演武坪",
        "罗霄山·山门中台演武坪"
      ],
      "gate": {
        "unconfigured": true,
        "description": "入山查验与身份凭据须由明确剧情确认；原卡无统一数值门槛。"
      },
      "sourceEntryId": 10
    },
    {
      "id": "place_17",
      "name": "山顶总坛玉虚正殿",
      "scene": "罗霄山",
      "aliases": [
        "山顶总坛玉虚正殿",
        "罗霄山·山顶总坛玉虚正殿"
      ],
      "gate": null,
      "sourceEntryId": 10
    },
    {
      "id": "place_18",
      "name": "后山弟子精舍与试剑飞瀑",
      "scene": "罗霄山",
      "aliases": [
        "后山弟子精舍与试剑飞瀑",
        "罗霄山·后山弟子精舍与试剑飞瀑"
      ],
      "gate": null,
      "sourceEntryId": 10
    }
  ]
}
;
}];const cache={};function load(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};modules[id](load,module,module.exports);return module.exports;}load(0);})();