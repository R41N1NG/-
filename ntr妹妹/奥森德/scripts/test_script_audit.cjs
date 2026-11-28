'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const header=fs.readFileSync(path.join(__dirname,'test_foundation.cjs'),'utf8').split('async function runTests()')[0];
const holder={exports:{}};
new Function('require','__dirname','module',header+'\nmodule.exports={createSandbox};')(require,__dirname,holder);
async function harness(extra={}){
 const sb=holder.exports.createSandbox('script-audit-a'),store=new Map();
 sb.OKH_APP.configure({getChatId:()=>sb._ctxObj.chatId,getContext:()=>sb._ctxObj,
  storage:{get:k=>store.get(k),set:(k,v)=>{store.set(k,v);return true}},inject:async()=>true,...extra});
 await sb.OKH_APP.init();
 return{sb,app:sb.OKH_APP,store};
}
async function pending(app){
 const w=app.world();w.bg.queue.push({id:'audit-pending',kind:'event',definitionId:'audit',mode:'result',text:'待发的已定事实',status:'pending',npcId:null,at:w.timeMin});await app.save(w,{debug:true});
}
const prepared=w=>Object.values(w.bg.generations).filter(g=>g.status==='prepared');
test('prompt injection failure leaves its event pending and no orphan prepared generation',async()=>{
 const {app}=await harness({inject:async text=>!text});await pending(app);
 await assert.rejects(app.beforeGeneration(),/注入.*失败/);
 assert.equal(prepared(app.world()).length,0);assert.equal(app.world().bg.queue[0].status,'pending');
});
test('cancelling a generation keeps the storage revision monotonic',async()=>{
 const {app}=await harness();await pending(app);await app.beforeGeneration();const revision=app.world().bg.revision;
 await app.cancelGeneration();assert(app.world().bg.revision>revision);assert.equal(prepared(app.world()).length,0);
});
test('the persistence boundary rejects a non-increasing commit version',async()=>{
 const {app,store}=await harness(),world=app.world(),s=app.W.session(),before=store.get(s.key);
 await assert.rejects(app.W.commit(s,{expectedRevision:world.bg.revision,state:world,checkpoint:null,reason:'audit'}),/版本必须递增/);
 assert.equal(store.get(s.key),before);
});
test('cancel then retry delivers the still-pending event exactly once',async()=>{
 const {sb,app}=await harness();await pending(app);await app.beforeGeneration();await app.cancelGeneration();await app.beforeGeneration();
 sb._ctxObj.chat=[{is_user:true,mes:'继续'},{is_user:false,mes:'<status_bar><time elapsed="0"/></status_bar>'}];await app.onMessage(1);
 assert.equal(app.world().bg.queue[0].status,'delivered');assert.equal(prepared(app.world()).length,0);
 const revision=app.world().bg.revision;await app.onMessage(1);assert.equal(app.world().bg.revision,revision);
});
test('switching chats during a prepared generation does not break the next generation or touch the old save',async()=>{
 const {sb,app,store}=await harness();await pending(app);await app.beforeGeneration();
 const key=app.W.session().key,old=store.get(key);sb._ctxObj.chatId='script-audit-b';await app.init();
 await app.beforeGeneration();assert.equal(store.get(key),old);
 await app.cancelGeneration();sb._ctxObj.chatId='script-audit-a';await app.beforeGeneration();assert.equal(prepared(app.world()).length,1);
 await app.cancelGeneration();
});
test('cold reload clears abandoned preparations before starting a fresh generation',async()=>{
 const {app}=await harness();await pending(app);const world=app.world();world.bg.generations.abandoned={status:'prepared',ids:['audit-pending']};await app.save(world,{debug:true});
 await app.beforeGeneration();assert.equal(prepared(app.world()).length,1);assert.equal(app.world().bg.generations.abandoned,undefined);await app.cancelGeneration();
});
for(const method of ['step','applyFront','onMessage','beforeGeneration','syncHistory'])test('queued '+method+' keeps the chat identity captured at call time',async()=>{
 const {sb,app,store}=await harness();sb._ctxObj.chat=[{is_user:false,mes:'<status_bar><time elapsed="10"/></status_bar>'}];
 const task=method==='step'?app.step(10):method==='applyFront'?app.applyFront({}, {minutes:10}):method==='onMessage'?app.onMessage(0):app[method]();
 sb._ctxObj.chatId='script-audit-b';await assert.rejects(task,/聊天已切换/);assert.equal(store.has(app.W.session().key),false);
});
test('a chat switch while an async prompt injection is in flight rejects the stale generation',async()=>{
 let sbRef;const {sb,app}=await harness({inject:async text=>{if(text)sbRef._ctxObj.chatId='script-audit-b';return true}});sbRef=sb;
 await assert.rejects(app.beforeGeneration(),/聊天已切换/);
});
test('edits older than the retained checkpoint window are rejected without a partial replay',async()=>{
 const {sb,app,store}=await harness({maxHistory:2});sb._ctxObj.chat=[{is_user:false,mes:'开场'}];await app.onMessage(0);
 for(let i=1;i<=4;i++){sb._ctxObj.chat.push({is_user:true,mes:'行动'+i},{is_user:false,mes:'<status_bar><time elapsed="1"/></status_bar>'});await app.onMessage(i*2)}
 const key=app.W.session().key,before=store.get(key);sb._ctxObj.chat[2].mes='<status_bar><time elapsed="200"/></status_bar>';
 await assert.rejects(app.syncHistory(),/回滚窗口|检查点窗口/);assert.equal(store.get(key),before);
});
test('schema migration does not invent a second pending record for a repeated event instance',async()=>{
 const {sb,app}=await harness();const w=app.world(),u=sb.OKHBackgroundModules.utils;
 const key=u.key('event','isna_alley_lockpick_spot','isna'),instance=u.key('event-instance','isna_alley_lockpick_spot','isna',2);
 w.schemaVersion=2;w.bg.eventStates[key]={definitionId:'isna_alley_lockpick_spot',npcId:'isna',status:'pending',instanceId:instance,occurrence:2};
 w.bg.queue=[{id:instance,eventKey:key,definitionId:'isna_alley_lockpick_spot',npcId:'isna',kind:'event',mode:'interaction',status:'pending',text:'待选择',at:w.timeMin,occurrence:2}];
 const migrated=sb.OKH_APP_CONFIG.migrateWorld(w);assert.equal(Object.keys(migrated.bg.eventStates).length,1);
 w.bg.eventStates={};const recovered=sb.OKH_APP_CONFIG.migrateWorld(w);assert.equal(recovered.bg.eventStates[key].instanceId,instance);
});
test('migration fills a missing Ed slot without introducing him before he has joined',async()=>{
 const {sb,app}=await harness();
 for(const joined of [false,true]){
  const w=app.world();w.schemaVersion=2;w.flags.arrived_oakhaven=true;w.flags.ed_joined=joined;w.playerLocation='inn';delete w.npcs.ed;
  const next=sb.OKH_APP_CONFIG.migrateWorld(w);assert.equal(next.npcs.ed.monitored,joined);assert.equal(next.npcs.ed.location,'inn');
 }
});
test('dead or unmonitored NPCs cannot receive paid bonds',async()=>{
 const {sb,app}=await harness(),cfg=app.config();
 for(const inactive of ['dead','unmonitored']){
  const w=app.world();w.flags.arrived_oakhaven=true;w.playerLocation='inn';w.npcs.isna.location='inn';w.npcs.isna.alive=inactive!=='dead';w.npcs.isna.monitored=inactive!=='unmonitored';
  const next=sb.OKHBackground.advance(w,{id:'bond-'+inactive,revision:'r',toMin:w.timeMin,front:{bonds:[{npc:'isna',kind:'gift'}]}},cfg).state;
  assert.equal(next.playerState.gold,w.playerState.gold);assert.equal(next.npcs.isna.values.affection,w.npcs.isna.values.affection);
  w.playerLocation='wilds';w.npcs.isna.location='wilds';w.npcs.gulan.monitored=false;
  const commission=sb.OKHBackground.advance(w,{id:'work-'+inactive,revision:'r',toMin:w.timeMin,front:{economies:[{op:'work',tier:'guild_high'}]}},cfg).state;
  assert.equal(commission.playerState.gold,w.playerState.gold);
 }
});
test('inherited Object methods are not registered bond kinds',async()=>{
 const {sb,app}=await harness(),w=app.world();w.npcs.nise.location=w.playerLocation;
 const next=sb.OKHBackground.advance(w,{id:'prototype-bond',revision:'r',toMin:w.timeMin,front:{bonds:[{npc:'nise',kind:'toString'}]}},app.config()).state;
 assert.equal(next.npcs.nise.flags.lastInteractDay,undefined);
});
test('supply purchases only charge the quantity that fits, including multiple purchases in one receipt',async()=>{
 const {sb,app}=await harness();
 for(const starting of [995,999]){
  const w=app.world();w.flags.arrived_oakhaven=true;w.playerLocation='inn';w.playerState.inventory=[{id:'supply',count:starting}];
  const next=sb.OKHBackground.advance(w,{id:'supply-'+starting,revision:'r',toMin:w.timeMin,front:{economies:[{op:'buy_supply',count:10},{op:'buy_supply',count:10}]}},app.config()).state;
  assert.equal(next.playerState.inventory.find(i=>i.id==='supply').count,999);assert.equal(next.playerState.gold,w.playerState.gold-(999-starting));
 }
});
test('a successful replacement atomically discards later receipts and keeps a usable checkpoint',async()=>{
 const {app}=await harness();const initial=app.world().timeMin;
 await app.step(20,{msgId:'first',revision:'r1'});await app.step(10,{msgId:'second',revision:'r1'});const revision=app.world().bg.revision;
 await app.step(5,{msgId:'first',revision:'r2'});assert.equal(app.world().timeMin,initial+5);assert.equal(app.world().bg.receipts.second,undefined);assert(app.world().bg.revision>revision);
 assert.equal(app.W.readEnvelope().history.length,1);await app.restore('first');assert.equal(app.world().timeMin,initial);
});
test('invalid replacement replies leave both current state and checkpoint history untouched',async()=>{
 const {app,store}=await harness();await app.step(20,{msgId:'audit-reply',revision:'r1'});const key=app.W.session().key,before=store.get(key);
 for(const text of ['<status_bar></status_bar><status_bar></status_bar>','<status_bar><event_resolve id="missing" outcome="accept"/></status_bar>']){
  await assert.rejects(app.step(5,{msgId:'audit-reply',revision:'r2',text}));assert.equal(store.get(key),before);
 }
});
test('a failed replacement save cannot leave only the rollback of a previously successful reply',async()=>{
 let block=false;const backing=new Map();const {app}=await harness({storage:{get:k=>backing.get(k),set:(k,v)=>{const receipt=JSON.parse(v).world?.bg?.receipts?.['audit-reply'];if(block&&receipt&&JSON.parse(receipt).revision==='r2')return false;backing.set(k,v);return true}}});
 await app.step(20,{msgId:'audit-reply',revision:'r1'});const key=app.W.session().key,before=backing.get(key);block=true;
 await assert.rejects(app.step(5,{msgId:'audit-reply',revision:'r2'}),/写入失败|保存冲突/);assert.equal(backing.get(key),before);
});
test('all registered plans, event targets and static effects refer to existing actors, locations, metrics and items',async()=>{
 const {sb,app}=await harness(),cfg=app.config(),roster=sb.OKH_APP_CONFIG.ROSTER,owners=new Map();
 for(const npc of roster)for(const id of [...npc.plan,...npc.nodePlan]){if(!owners.has(id))owners.set(id,[]);owners.get(id).push(npc.id)}
 function check(effect,actors){
  if(!effect||typeof effect==='function')return;
  if(Array.isArray(effect)){for(const {target,...data}of effect){assert(target==='world'||target==='player'||roster.some(n=>n.id===target));check(data,target==='world'?[]:[target])}return}
  for(const [key,value]of Object.entries(effect.add||{}))for(const actor of actors){assert(Object.hasOwn(roster.find(n=>n.id===actor).values,key));assert(Number.isFinite(value))}
  for(const key of ['move','playerMove'])if(effect[key])assert(Object.hasOwn(sb.OKH_APP_CONFIG.LOCATIONS,effect[key]));
  for(const spec of [...effect.itemsAdd||[],...effect.itemsRemove||[]])assert(Object.hasOwn(cfg.itemCatalog,typeof spec==='string'?spec:spec.id));
 }
 for(const definition of [...cfg.actions,...cfg.nodes,...cfg.events]){
  const actors=definition.targets||owners.get(definition.id)||[];for(const id of actors)assert(roster.some(n=>n.id===id));
  check(definition.effects,actors);for(const outcome of Object.values(definition.outcomes||{}))check(outcome.effects,actors);
 }
});
test('inactive NPC interactions expire while explicitly allowed inactive interactions stay resolvable',async()=>{
 const {sb,app}=await harness();
 for(const allowInactive of [false,true]){
  const cfg={...app.config(),actions:[],nodes:[],events:[{id:'availability',scope:'npc',targets:['isna'],mode:'interaction',when:()=>true,text:'等待选择',allowInactive,outcomes:{accept:{text:'已处理'}}}]};
  let w=sb.OKHBackground.advance(app.world(),{id:'trigger',revision:'r',toMin:app.world().timeMin},cfg).state;
  w.npcs.isna.alive=false;w.npcs.isna.monitored=false;
  w=sb.OKHBackground.advance(w,{id:'unavailable',revision:'r',toMin:w.timeMin},cfg).state;
  const key=sb.OKHBackgroundModules.utils.key('event','availability','isna');
  assert.equal(w.bg.eventStates[key].status,allowInactive?'pending':'cancelled');
  if(!allowInactive)assert.equal(sb.OKHBackground.prepare(w).ids.length,0);
  else{w=sb.OKHBackground.advance(w,{id:'resolve',revision:'r',toMin:w.timeMin,front:{resolveEvents:[{eventId:'availability',npcId:'isna',outcome:'accept'}]}},cfg).state;assert.equal(w.bg.eventStates[key].status,'resolved')}
 }
});
for(const method of ['onMessage','syncHistory'])test('an invalid latest-message edit through '+method+' preserves the authoritative state and history',async()=>{
 const {sb,app,store}=await harness();sb._ctxObj.chat=[{is_user:false,mes:'开场'}];await app.onMessage(0);
 sb._ctxObj.chat.push({is_user:true,mes:'行动'},{is_user:false,mes:'<status_bar><time elapsed="10"/></status_bar>'});await app.onMessage(2);
 const key=app.W.session().key,before=store.get(key);sb._ctxObj.chat[2].mes='<status_bar><event_resolve id="missing" outcome="accept"/></status_bar>';
 await assert.rejects(method==='onMessage'?app.onMessage(2):app.syncHistory());assert.equal(store.get(key),before);
});
async function completedReply(){
 const h=await harness(),{sb,app}=h;sb._ctxObj.chat=[{is_user:false,mes:'开场'}];await app.onMessage(0);await pending(app);await app.beforeGeneration();
 sb._ctxObj.chat.push({is_user:true,mes:'行动'},{is_user:false,swipe_id:0,mes:'<status_bar><time elapsed="10"/></status_bar>'});await app.onMessage(2);return h;
}
test('cancelling regeneration preserves the previous successful reply and its full checkpoint history',async()=>{
 const {app}=await completedReply(),before=app.world(),history=app.W.readEnvelope().history;
 await app.beforeGeneration({replaceIndex:2});assert.equal(app.world().timeMin,before.timeMin);await app.cancelGeneration();
 const after=app.world();delete before.bg.revision;delete after.bg.revision;assert.deepEqual(after,before);assert.deepEqual(app.W.readEnvelope().history,history);
});
test('regeneration uses the original prompt batch and atomically replaces the reply without reviving old requests',async()=>{
 const {sb,app}=await completedReply(),oldTime=app.world().timeMin;
 const batch=await app.beforeGeneration({replaceIndex:2});assert(batch.ids.includes('audit-pending'));assert.equal(app.world().timeMin,oldTime);
 sb._ctxObj.chat[2]={is_user:false,swipe_id:1,mes:'<status_bar><time elapsed="20"/></status_bar>'};await app.onMessage(2);
 assert.equal(app.world().timeMin,oldTime+10);assert.equal(app.world().bg.queue[0].status,'delivered');assert.equal(prepared(app.world()).length,0);
 assert.equal(app.W.readEnvelope().history.filter(h=>h.chatIndex===2).length,1);
});
test('an unchanged regenerated reply releases its preparation instead of leaving the prompt active',async()=>{
 const {app}=await completedReply(),time=app.world().timeMin;
 await app.beforeGeneration({replaceIndex:2});const result=await app.onMessage(2);
 assert.equal(result.duplicate,true);assert.equal(app.world().timeMin,time);assert.equal(prepared(app.world()).length,0);
});
test('a failed multi-reply replay is atomic and can resume after the invalid later receipt is corrected',async()=>{
 const {sb,app,store}=await harness({maxHistory:3});sb._ctxObj.chat=[{is_user:false,mes:'开场'}];await app.onMessage(0);
 for(let i=1;i<=3;i++){sb._ctxObj.chat.push({is_user:true,mes:'行动'+i},{is_user:false,mes:'<status_bar><time elapsed="10"/></status_bar>'});await app.onMessage(i*2)}
 const key=app.W.session().key,before=store.get(key);sb._ctxObj.chat[2].mes='<status_bar><time elapsed="20"/><move to="wilds_camp"/></status_bar>';
 sb._ctxObj.chat[4].mes='<status_bar><event_resolve id="missing" outcome="accept"/></status_bar>';
 await assert.rejects(app.syncHistory());assert.equal(store.get(key),before);
 sb._ctxObj.chat[4].mes='<status_bar><time elapsed="5"/></status_bar>';await app.syncHistory();
 assert.equal(app.world().timeMin,1080+20+5+35);assert.equal(app.world().playerLocation,'wilds_camp');assert.equal(app.W.readEnvelope().history.length,3);
});
