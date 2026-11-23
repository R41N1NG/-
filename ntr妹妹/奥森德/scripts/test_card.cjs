'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),card=JSON.parse(fs.readFileSync(path.join(ROOT,'最新角色卡/奥克赫斯.json'),'utf8'));
const input=JSON.parse(fs.readFileSync(path.join(__dirname,'inputs/card-fields.json'),'utf8'));
const script=card.data.extensions.tavern_helper.scripts[0],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const header=fs.readFileSync(path.join(__dirname,'test_foundation.cjs'),'utf8').split('async function runTests()')[0],holder={exports:{}};
new Function('require','__dirname','module',header+'\nmodule.exports={createSandbox};')(require,__dirname,holder);
function nativeSandbox(vars={},chatId='card-import',extend=()=>{}){
 const listeners=new Map(),prompts=new Map(),ctx={chatId,chat:[{is_user:false,is_system:false,mes:card.data.first_mes}],event_types:{GENERATION_STARTED:'GENERATION_STARTED',MESSAGE_RECEIVED:'MESSAGE_RECEIVED',MESSAGE_EDITED:'MESSAGE_EDITED',MESSAGE_DELETED:'MESSAGE_DELETED',MESSAGE_SWIPED:'MESSAGE_SWIPED',GENERATION_STOPPED:'GENERATION_STOPPED',CHAT_CHANGED:'CHAT_CHANGED'},setExtensionPrompt:(id,text)=>{prompts.set(id,text);return true}};
 const sb={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,setInterval,clearInterval,Date,encodeURIComponent,
  SillyTavern:{getContext:()=>ctx},getCurrentChatId:()=>ctx.chatId,tavern_events:ctx.event_types,
  getVariables:options=>{assert.equal(options.type,'chat');return{...vars}},replaceVariables:(next,options)=>{assert.equal(options.type,'chat');for(const k of Object.keys(vars))delete vars[k];Object.assign(vars,next);return true},
  eventOn:(name,fn)=>listeners.set(name,fn),eventRemoveListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)}};
 extend(sb,ctx);
 sb.globalThis=sb;vm.createContext(sb);vm.runInContext(script.content,sb,{filename:'card-embedded-script.js'});return{sb,ctx,vars,listeners,prompts};
}
function display(text){for(const rule of card.data.extensions.regex_scripts){const [,pattern,flags]=rule.findRegex.match(/^\/([\s\S]*)\/([gimsuy]*)$/);text=text.replace(new RegExp(pattern,flags),rule.replaceString)}return text}
test('V2 card contains the thirty-four clean standard lore entries, characters and opening with confirmed geography corrections',()=>{
 assert.equal(card.spec,'chara_card_v2');assert.equal(card.spec_version,'2.0');assert.equal(card.data.name,input.fields.name);
 const entries=card.data.character_book.entries;assert.equal(entries.length,34);assert.equal(new Set(entries.map(e=>e.id)).size,34);
 assert.equal(fs.readFileSync(path.join(ROOT,'最新角色卡/奥克赫斯.json'),'utf8'),fs.readFileSync(path.join(ROOT,'../dist/奥克赫斯.json'),'utf8'));
 const banned=['极其','极度','彻底','臣服','献祭','近乎','近乎于','绝对','尽数','不可或缺','顺从','终极','神坛'];
 for(const e of entries){assert(e.content.length>50);for(const b of banned)assert(!e.content.includes(b),`Banned word ${b} in entry ${e.comment}`);}
 assert.equal(entries.filter(e=>e.constant).length,4);
 assert.equal(entries.filter(e=>!e.constant).length,30);
 for(const key of ['mes_example','personality','scenario','alternate_greetings'])assert.deepEqual(card.data[key],input.fields[key]);
 assert(card.data.first_mes.includes('古兰：“今晚只能走到这里'));
 assert(card.data.first_mes.includes('<time elapsed="0" end="1日18:00" />'));
 assert(card.data.extensions.regex_scripts.some(r=>r.id==='okh-dialogue-bubble'));
 assert(card.data.description.includes('<room'));assert(card.data.description.includes('<economy'));assert(!card.data.description.includes('<injury'));
 assert.match(input.source_card_sha256,/^[a-f0-9]{64}$/);
 assert.equal(card.data.extensions.okh_build.source_card_sha256,input.source_card_sha256);
});
test('the character extension contains exactly one enabled native Tavern Helper script identical to the current standalone build',()=>{
 const helper=card.data.extensions.tavern_helper;assert.deepEqual(helper.variables,{});assert.equal(helper.scripts.length,1);
 assert.equal(script.type,'script');assert.equal(script.enabled,true);assert.equal(script.id,'okh-complete-autostart');assert.equal(script.button.enabled,false);
 assert.equal(script.content,fs.readFileSync(path.join(ROOT,'dist/okh_complete_autostart.js'),'utf8'));
 assert.equal(script.content,fs.readFileSync(path.join(ROOT,'../dist/okh_complete_autostart.js'),'utf8'));
 assert.equal(card.data.extensions.okh_build.runtime_sha256,sha(script.content));assert(!script.content.includes('__OKH_MAP_REGION__'));
 assert.equal(JSON.parse(JSON.stringify(card)).data.extensions.tavern_helper.scripts[0].content,script.content);
});

function withChatWorldbooks(sb, ctx) {
 const books = new Map(), bindings = new Map();
 Object.assign(sb, {
  getWorldbookNames: () => [...books.keys()],
  getChatWorldbookName: chat => {
   assert.equal(chat, 'current');
   return bindings.get(ctx.chatId) || null;
  },
  createWorldbook: async (name, entries) => {
   if (books.has(name)) return false;
   books.set(name, structuredClone(entries));
   return true;
  },
  getWorldbook: async name => structuredClone(books.get(name)),
  replaceWorldbook: async (name, entries) => {
   assert(books.has(name));
   books.set(name, structuredClone(entries));
  },
  rebindChatWorldbook: async (chat, name) => {
   assert.equal(chat, 'current');
   assert(name === null || books.has(name));
   bindings.set(ctx.chatId, name);
  },
  testBooks: books, testBindings: bindings
 });
}

const edArchive = '<角色档案_古龙艾德_';
async function queueReveal(sb) {
 const world = sb.OKH_APP.world();
 Object.assign(world.flags, { arrived_oakhaven: true, ed_joined: true });
 Object.assign(world.npcs.gulan.values, { blood_density: 100, affection: 95 });
 world.npcs.ed.values.patience = 1;
 await sb.OKH_APP.save(world, { debug: true });
 await sb.OKH_APP.step(0);
 const waiting = sb.OKH_APP.world();
 assert(!waiting.flags.ed_revealed);
 const preReveal = await sb.OKH_APP.beforeGeneration();
 assert(!preReveal.text.includes(edArchive));
 assert(!preReveal.ids.some(id => id.includes('ed_showdown_')));
 await sb.OKH_APP.cancelGeneration();
 const ready = sb.OKH_APP.world();
 ready.npcs.ed.values.patience = 0;
 await sb.OKH_APP.save(ready, { debug: true });
 await sb.OKH_APP.step(0);
 const next = sb.OKH_APP.world();
 assert.equal(next.flags.ed_revealed, true);
 const reveal = next.bg.queue.find(event => event.definitionId === 'ed_showdown_good');
 assert.equal(reveal?.status, 'pending');
 return reveal.id;
}

async function deliverReveal(sb, ctx, listeners, revealId) {
 const batch = await sb.OKH_APP.beforeGeneration();
 assert(batch.ids.includes(revealId));
 assert(!batch.text.includes(edArchive));
 ctx.chat.push({ is_user: true, mes: '我留在古兰身边。' });
 ctx.chat.push({ is_user: false, mes: '<content>艾德显露真身。</content><status_bar><time elapsed="0" /><reveal_delivered id="ed_showdown_good" /></status_bar>' });
 await listeners.get('MESSAGE_RECEIVED')(ctx.chat.length - 1);
 assert.equal(sb.OKH_APP.world().bg.queue.find(event => event.id === revealId)?.status, 'delivered');
}

test('deferred worldbook entries follow the delivered reveal, chat scope and reply rollback',async()=>{
 const {sb,ctx,listeners}=nativeSandbox({}, 'ed-reveal', withChatWorldbooks);
 try {
  await sb.OKH_CARD_READY;
  assert(!card.data.character_book.entries.some(entry => entry.content.includes(edArchive)));
  const revealId = await queueReveal(sb);
  assert.equal(sb.testBooks.size, 0);
  const abandoned = await sb.OKH_APP.beforeGeneration();
  assert(abandoned.ids.includes(revealId));
  await listeners.get('GENERATION_STOPPED')();
  assert.equal(sb.testBooks.size, 0);
  await deliverReveal(sb, ctx, listeners, revealId);
  const firstChat = ctx.chatId;
  const name = sb.testBindings.get(firstChat);
  const entries = sb.testBooks.get(name);
  assert.deepEqual(entries.map(entry => [entry.name, entry.strategy.type, entry.position.depth, entry.position.order]), [
   ['角色心智·古龙艾德', 'constant', 4, 262],
   ['角色全案·古龙艾德', 'constant', 6, 263]
  ]);
  assert(entries.every(entry => entry.content.startsWith(edArchive)));
  assert(!(await sb.OKH_APP.beforeGeneration()).text.includes(edArchive));
  await sb.OKH_APP.cancelGeneration();
  assert.equal(sb.testBooks.get(name), entries);

  // A copied chat can inherit a binding but has its own save.
  const messages = ctx.chat;
  ctx.chatId = 'ed-reveal-fork';
  ctx.chat = [messages[0]];
  sb.testBindings.set(ctx.chatId, name);
  await listeners.get('CHAT_CHANGED')();
  assert.equal(sb.testBindings.get(ctx.chatId), null);
  assert.equal(sb.testBooks.get(name), entries);
  ctx.chatId = firstChat;
  ctx.chat = messages;
  await listeners.get('CHAT_CHANGED')();
  assert.equal(sb.testBindings.get(firstChat), name);

  const replacement = await sb.OKH_APP.beforeGeneration({ type: 'regenerate', replaceIndex: 2 });
  assert(replacement.ids.includes(revealId));
  assert(!replacement.text.includes(edArchive));
  assert.equal(sb.testBindings.get(firstChat), null);
  await sb.OKH_APP.cancelGeneration();
  assert.equal(sb.testBindings.get(firstChat), name);
  ctx.chat.pop();
  await listeners.get('MESSAGE_DELETED')();
  assert.equal(sb.testBindings.get(firstChat), null);
  assert.equal(sb.testBooks.get(name).length, 0);
  assert.equal(sb.OKH_APP.world().bg.queue.find(event => event.id === revealId)?.status, 'pending');
 } finally {
  await sb.OKH_APP.stop();
 }
});

test('existing user chat worldbooks are preserved and the gated prompt supplies the revealed archive',async()=>{
 const {sb,ctx,listeners}=nativeSandbox({}, 'ed-custom-book', (sandbox, context) => {
  withChatWorldbooks(sandbox, context);
  sandbox.testBooks.set('我的世界书', []);
  sandbox.testBindings.set(context.chatId, '我的世界书');
 });
 try {
  await sb.OKH_CARD_READY;
  const revealId = await queueReveal(sb);
  await deliverReveal(sb, ctx, listeners, revealId);
  const next = await sb.OKH_APP.beforeGeneration();
  assert(next.text.includes(edArchive + '心智姿态>'));
  assert(next.text.includes(edArchive + '基础档案>'));
  assert.equal(sb.testBindings.get(ctx.chatId), '我的世界书');
  assert.equal(sb.testBooks.size, 1);
  assert.equal(sb.testBooks.get('我的世界书').length, 0);
 } finally {
  await sb.OKH_APP.stop();
 }
});

test('the finale remains private until its own batch produces a verified reveal reply',async()=>{
 const {sb,ctx,listeners}=nativeSandbox({}, 'ed-reveal-delivery', withChatWorldbooks);
 const reply = async text => {
  ctx.chat.push({ is_user: true, mes: '继续。' }, { is_user: false, mes: text });
  await listeners.get('MESSAGE_RECEIVED')(ctx.chat.length - 1);
 };
 const summary = '【终局·真血自立】';
 const proof = '<reveal_delivered id="ed_showdown_good" />';
 const revealText = '<content>艾德显露真身。</content>';
 const withStatus = (text, marker = '') => text + '<status_bar><time elapsed="0" />' + marker + '</status_bar>';
 try {
  await sb.OKH_CARD_READY;
  const revealId = await queueReveal(sb);
  const waiting = sb.OKH_APP.world();
  const backlog = Array.from({length:8}, (_, i) => ({
   id:'queued-'+i, definitionId:'queued-'+i, kind:'event', mode:'result',
   status:'pending', text:'早先发生的事件', at:waiting.timeMin, npcId:null
  }));
  waiting.bg.queue.unshift(...backlog);
  await sb.OKH_APP.save(waiting,{debug:true});

  const pending = () => sb.OKH_APP.world().bg.queue.find(event => event.id === revealId)?.status;
  const beforeReveal = await sb.OKH_APP.beforeGeneration();
  assert(!beforeReveal.ids.includes(revealId));
  assert(!beforeReveal.text.includes(summary));
  assert(!beforeReveal.text.includes('【幕后真身揭晓设定】'));
  assert(!beforeReveal.text.includes(proof));
  await reply(withStatus(revealText, proof));
  assert.equal(pending(), 'pending');
  assert.equal(sb.testBooks.size, 0);
  assert(sb.OKH_APP.world().bg.queue.filter(event=>event.id.startsWith('queued-'))
   .every(event=>event.status==='delivered'));

  for (const incomplete of [
   withStatus(revealText),
   withStatus('<content>爱德抬头望向巨龙。</content>', proof),
   withStatus('<content>爱德尚未显露真身。</content>', proof),
   withStatus(revealText, '<reveal_delivered id="ed_showdown_dark" />')
  ]) {
   const batch = await sb.OKH_APP.beforeGeneration();
   assert(batch.ids.includes(revealId));
   assert(batch.text.includes(proof));
   assert(!batch.text.includes(summary));
   await reply(incomplete);
   assert.equal(pending(), 'pending');
   assert.equal(sb.testBooks.size, 0);
  }
  await sb.OKH_APP.beforeGeneration();
  await reply(withStatus(revealText, proof));
  assert.equal(pending(), 'delivered');
  const book = sb.testBindings.get(ctx.chatId);
  assert.equal(sb.testBooks.get(book).length, 2);
  assert((await sb.OKH_APP.beforeGeneration()).text.includes(summary));
  await sb.OKH_APP.cancelGeneration();

  // Editing an earlier reply preserves the matching saved reveal proof.
  ctx.chat[1].mes = '我望向旅店门口。';
  await listeners.get('MESSAGE_EDITED')();
  assert.equal(pending(), 'delivered');
  assert.equal(sb.testBindings.get(ctx.chatId), book);
  const savedProof = sb.OKH_APP.W.readEnvelope().history.find(record => record.revealProof);
  assert.equal(savedProof.chatIndex, ctx.chat.length - 1);
  // Editing the confirmed reply into a different scene withdraws that proof.
  ctx.chat.at(-1).mes = withStatus('<content>爱德走过窗边。</content>', proof);
  await listeners.get('MESSAGE_EDITED')();
  assert.equal(pending(), 'pending');
  assert.equal(sb.testBindings.get(ctx.chatId), null);
 } finally {
  await sb.OKH_APP.stop();
 }
});
test('an older save corrects a pending curfew mistakenly issued after the purge',async()=>{
 const {sb}=nativeSandbox();
 try {
  await sb.OKH_CARD_READY;
  const world = sb.OKH_APP.world();
  Object.assign(world.flags, { arrived_oakhaven:true, baron_purged:true, road_blocked:true,
   curfew_active:true, grand_tier_3:true });
  const entry = (id, text) => ({ id, definitionId:id, kind:'event', mode:'result', text,
   npcId:null, at:world.timeMin, status:'pending' });
  world.bg.queue.push(entry('eileen_lancaster_purge', '雷蒙德已经伏诛。'),
   entry('ed_grand_stage_3', '峡谷塌方，雷蒙德领主下令全城宵禁。'));
  await sb.OKH_APP.save(world,{debug:true});
  const repaired = sb.OKH_APP.world();
  assert.equal(repaired.flags.curfew_active,false);
  assert.equal(repaired.flags.road_blocked,true);
  const batch = await sb.OKH_APP.beforeGeneration();
  assert(batch.ids.includes('ed_grand_stage_3'));
  assert.match(batch.text,/峡谷官道因塌方中断/);
  assert.doesNotMatch(batch.text,/雷蒙德领主下令|全城宵禁/);
 } finally {
  await sb.OKH_APP.stop();
 }
});

test('all four map views, parchment and font are embedded byte-for-byte with their license',()=>{
 const assets=card.data.extensions.okh_build.assets;
 assert.deepEqual(Object.keys(assets),['region','town','ground','upper','journal','ink']);
 for(const [id,asset]of Object.entries(assets)){const bytes=fs.readFileSync(path.join(ROOT,asset.path));assert.equal(asset.sha256,sha(bytes));assert(script.content.includes('data:'+(id==='ink'?'font/woff':'image/webp')+';base64,'+bytes.toString('base64')),id)}
 assert(card.data.extensions.okh_build.licenses['map-ink.woff'].includes('SIL OPEN FONT LICENSE'));
});
test('display-only regexes hide complete, repeated and streaming receipts without adding a second HUD or changing raw messages',()=>{
 for(const rule of card.data.extensions.regex_scripts){assert.equal(rule.disabled,false);assert.equal(rule.markdownOnly,true);assert.equal(rule.promptOnly,false);assert.deepEqual(rule.placement,[2]);assert.equal(rule.runOnEdit,true)}
 for(const tail of ['<status_bar><time elapsed="5"/></status_bar>','<status_bar><time elapsed="5"/></status_bar><status_bar><time elapsed="10"/></status_bar>','<status_bar><time elapsed="5"','<STATUS_BAR>unfinished']){
  const raw='<content>正文。</content>\n'+tail,out=display(raw);assert(out.includes('正文。'));assert(!/<\/?(?:status_bar|content)\b/i.test(out));assert(!out.includes('data-okh-hud'));assert(raw.includes(tail));
 }
});
test('avatar forms follow settled character stages, route and confirmed duty',async()=>{
 const {sb}=nativeSandbox();
 try{
  await sb.OKH_CARD_READY;
  const {formsFor}=sb.OKH_BUBBLE_SIDE,world=sb.OKH_APP.world(),{aurora,isna,gulan,nise,eileen,cecilia}=world.npcs;
  const forms=()=>JSON.parse(JSON.stringify(formsFor(world)));
  isna.flags.captured_orc=true;isna.flags.isna_fallen_labyrinth=true;
  gulan.flags.gulan_final_fall_done=true;gulan.stage=2;nise.stage=2;eileen.stage=2;cecilia.stage=3;
  aurora.location='manor';aurora.flags.manor_service_active=true;
  assert.deepEqual(forms(),{},'A hint, temporary captivity or mere arrival at the manor leaked a form');
  aurora.flags.aurora_worked_manor_day=1;
  assert.deepEqual(forms(),{aurora:'maid'});
  aurora.location='inn';assert.deepEqual(forms(),{});
  aurora.location='manor';world.timeMin=5*1440;aurora.flags.aurora_worked_manor_day=6;
  assert.deepEqual(forms(),{},'Weekend off duty');
  aurora.stage=3;isna.flags.isna_fallen_orc=true;gulan.stage=3;nise.stage=3;eileen.stage=3;
  assert.deepEqual(forms(),{aurora:'fallen',isna:'fallen',gulan:'fallen',nise:'fallen',eileen:'fallen'});
 }finally{await sb.OKH_APP.stop()}
});
test('dialogue forms survive the checkpoint window and prune with restored replies',async()=>{
 const {sb,ctx}=nativeSandbox();
 try{
  await sb.OKH_CARD_READY;
  const app=sb.OKH_APP,key=index=>'reply:'+ctx.chatId+':'+index;
  const reply=async()=>{
   ctx.chat.push({is_user:false,is_system:false,mes:'伊丝娜：[smile]“我知道了。”\n<status_bar><time elapsed="0"/></status_bar>'});
   await app.onMessage(ctx.chat.length-1);
  };
  await reply();
  const world=app.world();world.npcs.isna.flags.isna_fallen_orc=true;
  await app.save(world,{debug:true});
  for(let i=0;i<=app.W.historyLimit();i++)await reply();
  const last=ctx.chat.length-1;
  const before=app.W.dialogueForms();
  assert.equal(Object.hasOwn(before,key(1)),true);
  assert.equal(before[key(1)].isna,undefined);
  assert.equal(before[key(2)].isna,'fallen');
  assert.equal(app.W.readEnvelope().history.some(record=>record.id===key(2)),false);
  await app.restore(key(last));
  const restored=app.W.dialogueForms();
  assert.equal(Object.hasOwn(restored,key(last)),false);
  assert.equal(restored[key(2)].isna,'fallen');
 }finally{await sb.OKH_APP.stop()}
});
test('the preserved opening and example parse against the bundled clock, locations and current receipt grammar',()=>{
 const sb=holder.exports.createSandbox(),cfg=sb.OKH_APP_CONFIG.buildConfig();
 for(const [id,text]of [['opening',card.data.first_mes],['example',card.data.mes_example.split('{{char}}: ')[1]]]){
  const w=sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(),cfg),parsed=sb.OKH_APP_PARSE.parseStatusBar(text);
  const end=w.timeMin+parsed.elapsed;assert.equal(parsed.endMin,end);
  const front=sb.OKH_APP_PARSE.buildFront(text,end,w,{config:cfg,locations:sb.OKH_APP_CONFIG.LOCATIONS,canMove:cfg.canMove});assert.equal(front.diagnostics.length,0);
  const next=sb.OKHBackground.advance(w,{id,revision:'r1',toMin:end,interactingIds:front.interactingIds,front},cfg).state;
  assert.equal(next.playerLocation,'wilds');assert.equal(next.flags.arrived_oakhaven,false);assert.equal(next.npcs.ed.monitored,false);
 }
});
test('imported card autostarts through native helper APIs, processes greeting once, and preserves progress on a fresh script context',async()=>{
 const first=nativeSandbox();let second;
 try{
  await first.sb.OKH_CARD_READY;assert(first.listeners.has('GENERATION_STARTED'));assert(first.listeners.has('MESSAGE_RECEIVED'));
  const app=first.sb.OKH_APP;assert.equal(app.info().coreVersion,'2.1.1');assert.equal(app.world().timeMin,1080);assert.equal(app.world().npcs.ed.monitored,false);
  const once=JSON.stringify(app.world());await first.listeners.get('MESSAGE_RECEIVED')(0);assert.equal(JSON.stringify(app.world()),once);
  await app.step(10);const progressed=JSON.stringify(app.world());await app.stop();second=nativeSandbox(first.vars);await second.sb.OKH_CARD_READY;
  assert.equal(JSON.stringify(second.sb.OKH_APP.world()),progressed);
 }finally{await first.sb.OKH_APP.stop();if(second)await second.sb.OKH_APP.stop()}
});
test('character script waits for chat allocation before creating a save',async()=>{
 const h=nativeSandbox({},null);
 try{await new Promise(resolve=>setImmediate(resolve));assert.equal(Object.keys(h.vars).length,0);h.ctx.chatId='card-import';await h.sb.OKH_CARD_READY;assert.equal(h.sb.OKH_APP.world().timeMin,1080)}finally{await h.sb.OKH_APP.stop()}
});
