'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),card=JSON.parse(fs.readFileSync(path.join(ROOT,'最新角色卡/奥克赫斯.json'),'utf8'));
const originalBytes=fs.readFileSync(path.join(ROOT,'原始上传/奥克赫斯_R4配套.json')),original=JSON.parse(originalBytes);
const script=card.data.extensions.tavern_helper.scripts[0],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const header=fs.readFileSync(path.join(__dirname,'test_foundation.cjs'),'utf8').split('async function runTests()')[0],holder={exports:{}};
new Function('require','__dirname','module',header+'\nmodule.exports={createSandbox};')(require,__dirname,holder);
function nativeSandbox(vars={},chatId='card-import'){
 const listeners=new Map(),prompts=new Map(),ctx={chatId,chat:[{is_user:false,is_system:false,mes:card.data.first_mes}],event_types:{GENERATION_STARTED:'GENERATION_STARTED',MESSAGE_RECEIVED:'MESSAGE_RECEIVED',MESSAGE_EDITED:'MESSAGE_EDITED',MESSAGE_DELETED:'MESSAGE_DELETED',MESSAGE_SWIPED:'MESSAGE_SWIPED',GENERATION_STOPPED:'GENERATION_STOPPED',CHAT_CHANGED:'CHAT_CHANGED'},setExtensionPrompt:(id,text)=>{prompts.set(id,text);return true}};
 const sb={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,setInterval,clearInterval,Date,encodeURIComponent,
  SillyTavern:{getContext:()=>ctx},getCurrentChatId:()=>ctx.chatId,tavern_events:ctx.event_types,
  getVariables:options=>{assert.equal(options.type,'chat');return{...vars}},replaceVariables:(next,options)=>{assert.equal(options.type,'chat');for(const k of Object.keys(vars))delete vars[k];Object.assign(vars,next);return true},
  eventOn:(name,fn)=>listeners.set(name,fn),eventRemoveListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)}};
 sb.globalThis=sb;vm.createContext(sb);vm.runInContext(script.content,sb,{filename:'card-embedded-script.js'});return{sb,ctx,vars,listeners,prompts};
}
function display(text){for(const rule of card.data.extensions.regex_scripts){const [,pattern,flags]=rule.findRegex.match(/^\/([\s\S]*)\/([gimsuy]*)$/);text=text.replace(new RegExp(pattern,flags),rule.replaceString)}return text}
test('V2 card contains the thirty-four clean standard lore entries, characters and opening with confirmed geography corrections',()=>{
 assert.equal(card.spec,'chara_card_v2');assert.equal(card.spec_version,'2.0');assert.equal(card.data.name,original.data.name);
 const entries=card.data.character_book.entries;assert.equal(entries.length,34);assert.equal(new Set(entries.map(e=>e.id)).size,34);
 const banned=['极其','极度','彻底','臣服','献祭','近乎','近乎于','绝对','尽数','不可或缺','顺从','终极','神坛'];
 for(const e of entries){assert(e.content.length>50);for(const b of banned)assert(!e.content.includes(b),`Banned word ${b} in entry ${e.comment}`);}
 assert.equal(entries.filter(e=>e.constant).length,4);
 assert.equal(entries.filter(e=>!e.constant).length,30);
 for(const key of ['mes_example','personality','scenario','alternate_greetings'])assert.deepEqual(card.data[key],original.data[key]);
 assert(card.data.first_mes.includes('古兰：“今晚只能走到这里'));
 assert(card.data.first_mes.includes('<time elapsed="0" end="1日18:00" />'));
 assert(card.data.extensions.regex_scripts.some(r=>r.id==='okh-dialogue-bubble'));
 assert(card.data.description.includes('<room'));assert(card.data.description.includes('<economy'));assert(!card.data.description.includes('<injury'));
 assert.equal(card.data.extensions.okh_build.source_card_sha256,sha(originalBytes));
});
test('the character extension contains exactly one enabled native Tavern Helper script identical to the current standalone build',()=>{
 const helper=card.data.extensions.tavern_helper;assert.deepEqual(helper.variables,{});assert.equal(helper.scripts.length,1);
 assert.equal(script.type,'script');assert.equal(script.enabled,true);assert.equal(script.id,'okh-complete-autostart');assert.equal(script.button.enabled,false);
 assert.equal(script.content,fs.readFileSync(path.join(ROOT,'dist/okh_complete_autostart.js'),'utf8'));
 assert.equal(card.data.extensions.okh_build.runtime_sha256,sha(script.content));assert(!script.content.includes('__OKH_MAP_REGION__'));
 assert.equal(JSON.parse(JSON.stringify(card)).data.extensions.tavern_helper.scripts[0].content,script.content);
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
