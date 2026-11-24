'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const head=fs.readFileSync(path.join(__dirname,'test_foundation.cjs'),'utf8').split('async function runTests()')[0],holder={exports:{}};
new Function('require','__dirname','module',head.replace("sharedVars = null)","sharedVars = null, albumEntries = [])").replace("const ctx = {","const ctx = { OKH_ALBUM_CATALOG: albumEntries,")+'\nmodule.exports={createSandbox};')(require,__dirname,holder);
const img='data:image/png;base64,aGVsbG8=';
const item=(id='memory',extra={})=>({id,npc:'gulan',kind:'cg',title:'测试回忆',src:img,unlock:[{type:'metric',key:'affection',min:72}],...extra});
function sandbox(entries=[],sharedVars=null){return holder.exports.createSandbox('chat-test',sharedVars,entries)}
function plain(v){return JSON.parse(JSON.stringify(v))}
test('empty production catalog leaves legacy saves unchanged and provides a separate album page',async()=>{
 const sb=sandbox();await sb.OKH_APP.init();const world=sb.OKH_APP.world(),before=JSON.stringify(world);
 assert.equal(sb.OKH_APP_ALBUM.catalog.length,0);assert.deepEqual(plain(sb.OKH_APP_ALBUM.sync(world)),[]);assert.equal(JSON.stringify(world),before);
 const html=sb.OKH_APP.HUD.buildHudHtml(world);assert(html.includes('data-okh-tab="album"'));assert(html.includes('data-okh-page="album" aria-label="留影记录"'));assert(html.includes('已珍藏 0 幅'));assert(!html.includes('class="okh-memory"'));
 assert.equal(JSON.stringify(sb.OKH_APP.world()),before);
});
test('metric boundaries and combined flags collect once; later affection loss, death or departure does not erase earned pictures',()=>{
 const sb=sandbox(),album=sb.OKH_APP_ALBUM.create([item('threshold'),item('both',{unlock:[{type:'metric',key:'affection',min:70,max:80},{type:'worldFlag',key:'arrived_oakhaven'},{type:'npcFlag',key:'photo_scene'}]})]);
 const w=sb.OKHBackground.init(sb.OKH_APP.CFG.buildInitialWorld(),sb.OKH_APP.CFG.buildConfig());
 assert.deepEqual(plain(album.sync(w)),[]);w.npcs.gulan.values.affection=72;assert.deepEqual(plain(album.sync(w)),['threshold']);
 w.flags.arrived_oakhaven=true;assert.deepEqual(plain(album.sync(w)),[]);w.npcs.gulan.flags.photo_scene=true;assert.deepEqual(plain(album.sync(w)),['both']);
 assert.deepEqual(plain(album.sync(w)),[]);w.npcs.gulan.values.affection=0;w.npcs.gulan.monitored=false;w.npcs.gulan.alive=false;
 assert.equal(album.list(w).length,2);assert.equal(new Set(w.playerState.memories.map(r=>r.id)).size,2);
});
test('unknown characters, unsafe images, duplicate IDs, empty or malformed unlock rules are rejected',()=>{
 const sb=sandbox();for(const bad of [item('x',{npc:'stranger'}),item('x',{src:'javascript:alert(1)'}),item('x',{unlock:[]}),item('x',{unlock:[{type:'metric',key:'unknown',min:1}]}),item('x',{unlock:[{type:'metric',key:'affection',min:90,max:1}]}),item('x',{unlock:[{type:'event',id:'missing'}]})])assert.throws(()=>sb.OKH_APP_ALBUM.create([bad]));
 assert.throws(()=>sb.OKH_APP_ALBUM.create([item('same'),item('same')]));
});
test('event occurrence and a particular outcome are distinct collection conditions',()=>{
 const sb=sandbox(),event=sb.OKH_APP.CFG.EVENTS.find(e=>e.id==='gulan_final_rescue_prompt');assert(event);
 const outcome=Object.keys(event.outcomes)[0],album=sb.OKH_APP_ALBUM.create([item('occurred',{unlock:[{type:'event',id:event.id}]}),item('resolved',{unlock:[{type:'event',id:event.id,outcome}]})]);
 const w=sb.OKHBackground.init(sb.OKH_APP.CFG.buildInitialWorld(),sb.OKH_APP.CFG.buildConfig()),key=JSON.stringify(['event',event.id,'gulan']);
 assert.deepEqual(plain(album.sync(w)),[]);w.bg.eventStates[key]={status:'pending'};assert.deepEqual(plain(album.sync(w)),['occurred']);
 w.bg.eventStates[key]={status:'resolved',outcome:'not_matching'};assert.deepEqual(plain(album.sync(w)),[]);w.bg.eventStates[key].outcome=outcome;assert.deepEqual(plain(album.sync(w)),['resolved']);
});
test('unintroduced characters cannot earn pictures, and stale removed catalog entries never create broken or unknown thumbnails',()=>{
 const sb=sandbox(),album=sb.OKH_APP_ALBUM.create([item('ed',{npc:'ed',unlock:[{type:'introduced'}]})]),w=sb.OKHBackground.init(sb.OKH_APP.CFG.buildInitialWorld(),sb.OKH_APP.CFG.buildConfig());
 assert.deepEqual(plain(album.sync(w)),[]);w.playerState.memories=[{id:'removed',collectedAt:w.timeMin}];assert.deepEqual(plain(album.list(w)),[]);
 w.npcs.ed.monitored=true;assert.deepEqual(plain(album.sync(w)),['ed']);assert.equal(album.list(w).length,1);
});
test('a real bond receipt collects atomically, duplicate delivery does not duplicate it, and edited replies roll collection back',async()=>{
 const sb=sandbox([item()]);sb._ctxObj.chat=[{is_user:false,mes:'<status_bar><time elapsed="0"/></status_bar>'}];
 await sb.OKH_APP.init();await sb.OKH_APP.onMessage(0);assert.equal(sb.OKH_APP_ALBUM.list(sb.OKH_APP.world()).length,0);
 const text='<status_bar><time elapsed="0"/><bond npc="gulan" kind="confide"/></status_bar>';
 sb._ctxObj.chat.push({is_user:true,mes:'聊天'},{is_user:false,mes:text});await sb.OKH_APP.onMessage(2);assert.equal(sb.OKH_APP_ALBUM.list(sb.OKH_APP.world()).length,1);
 const saved=JSON.stringify(sb.OKH_APP.world());await sb.OKH_APP.onMessage(2);assert.equal(JSON.stringify(sb.OKH_APP.world()),saved);
 const cold=sandbox([item()],sb._vars);await cold.OKH_APP.init();assert.equal(cold.OKH_APP_ALBUM.list(cold.OKH_APP.world()).length,1);
 sb._ctxObj.chat[2].mes='<status_bar><time elapsed="0"/></status_bar>';await sb.OKH_APP.onMessage(2);assert.equal(sb.OKH_APP_ALBUM.list(sb.OKH_APP.world()).length,0);
 sb._ctxObj.chatId='another-album-chat';await sb.OKH_APP.init();assert.equal(sb.OKH_APP_ALBUM.list(sb.OKH_APP.world()).length,0);
});
test('a rejected save does not award the image or change the previous world',async()=>{
 const sb=sandbox([item()]);await sb.OKH_APP.init();const before=JSON.stringify(sb.OKH_APP.world());sb.replaceVariables=()=>false;
 await assert.rejects(sb.OKH_APP.step(0,{text:'<status_bar><bond npc="gulan" kind="confide"/></status_bar>'}));assert.equal(JSON.stringify(sb.OKH_APP.world()),before);
});
test('four initial character albums always exist; later women appear only after meeting and obtaining a portrait',()=>{
 const sb=sandbox(),album=sb.OKH_APP_ALBUM.create([item('cecilia_cg',{npc:'cecilia',unlock:[{type:'introduced'}]}),item('cecilia_portrait',{npc:'cecilia',kind:'portrait',unlock:[{type:'metric',key:'affection',min:30}]})]);
 const w=sb.OKHBackground.init(sb.OKH_APP.CFG.buildInitialWorld(),sb.OKH_APP.CFG.buildConfig());
 assert.deepEqual(plain(album.groups(w).map(g=>g.id)),['gulan','isna','nise','aurora']);assert.deepEqual(plain(album.sync(w)),[]);
 w.flags.arrived_oakhaven=true;w.playerLocation='church';album.sync(w);assert.equal(album.list(w).length,1);assert.equal(album.groups(w).length,4,'CG alone must not add a later character');
 w.npcs.cecilia.values.affection=30;album.sync(w);assert.equal(album.groups(w).at(-1).id,'cecilia');w.playerLocation='inn';album.sync(w);assert.equal(album.groups(w).length,5);
});
test('default portrait uses only owned images of that character; selection persists without changing game state or time',async()=>{
 const entries=[item('base',{kind:'portrait',unlock:[{type:'introduced'}]}),item('alternate',{unlock:[{type:'introduced'}]})],sb=sandbox(entries);await sb.OKH_APP.init();await sb.OKH_APP.step(0);const before=JSON.stringify(sb.OKH_APP.world());
 assert.equal(sb.OKH_APP_ALBUM.portrait(sb.OKH_APP.world(),'gulan',{}).id,'base');await sb.OKH_APP.setDefaultPortrait('gulan','alternate');assert.equal(JSON.stringify(sb.OKH_APP.world()),before);
 assert.equal(sb.OKH_APP_ALBUM.portrait(sb.OKH_APP.world(),'gulan',sb.OKH_APP.W.presentation().portraits).id,'alternate');
 await assert.rejects(sb.OKH_APP.setDefaultPortrait('nise','alternate'));await assert.rejects(sb.OKH_APP.setDefaultPortrait('gulan','uncollected'));
 await sb.OKH_APP.step(0);assert.equal(sb.OKH_APP.W.presentation().portraits.gulan,'alternate');const cold=sandbox(entries,sb._vars);await cold.OKH_APP.init();assert.equal(cold.OKH_APP.W.presentation().portraits.gulan,'alternate');
 const html=sb.OKH_APP.HUD.buildHudHtml(sb.OKH_APP.world());assert(!html.includes('okh-zoom-badge'));assert(!html.includes('data-okh-member="cecilia"'));
 sb._ctxObj.chatId='separate-default-chat';await sb.OKH_APP.init();assert.deepEqual(plain(sb.OKH_APP.W.presentation().portraits),{});
});
test('a selected image removed by reply rollback falls back to an owned portrait and rejected preference saves preserve the previous selection',async()=>{
 const entries=[item('base',{kind:'portrait',unlock:[{type:'introduced'}]}),item('alternate')],sb=sandbox(entries);sb._ctxObj.chat=[{is_user:false,mes:'<status_bar><time elapsed="0"/></status_bar>'}];await sb.OKH_APP.init();await sb.OKH_APP.onMessage(0);
 sb._ctxObj.chat.push({is_user:true,mes:'交谈'},{is_user:false,mes:'<status_bar><time elapsed="0"/><bond npc="gulan" kind="confide"/></status_bar>'});await sb.OKH_APP.onMessage(2);await sb.OKH_APP.setDefaultPortrait('gulan','alternate');
 sb._ctxObj.chat[2].mes='<status_bar><time elapsed="0"/></status_bar>';await sb.OKH_APP.onMessage(2);assert.equal(sb.OKH_APP_ALBUM.portrait(sb.OKH_APP.world(),'gulan',sb.OKH_APP.W.presentation().portraits).id,'base');
 const before=JSON.stringify(sb.OKH_APP.W.presentation());sb.replaceVariables=()=>false;await assert.rejects(sb.OKH_APP.setDefaultPortrait('gulan','base'));assert.equal(JSON.stringify(sb.OKH_APP.W.presentation()),before);
});
