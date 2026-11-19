'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const header=fs.readFileSync(path.join(__dirname,'test_foundation.cjs'),'utf8').split('async function runTests()')[0];
const holder={exports:{}};
new Function('require','__dirname','module',header+'\nmodule.exports={createSandbox};')(require,__dirname,holder);
function fixture(){
 const sb=holder.exports.createSandbox();
 const raw=sb.OKH_APP_DATA.buildInitialWorld();raw.flags.arrived_oakhaven=true;raw.playerLocation='inn';raw.timeMin=18*60;
 for(const id of ['gulan','isna','nise','aurora'])raw.npcs[id].location='inn';
 const world=sb.OKHBackground.init(raw,sb.OKH_APP_CONFIG.buildConfig());
 return {sb,map:sb.OKH_APP_MAP,world};
}
const el=attrs=>({getAttribute:k=>attrs[k]??null});
test('six room layout keeps player and independent Gulan, without registering new location IDs',()=>{
 const {sb,map,world}=fixture();assert.equal(map.rooms.length,6);assert.equal(map.rooms[0].npc,'player');assert.equal(map.rooms[1].npc,'gulan');
 assert.match(map.rooms[1].role,/独立住客/);assert.equal(Object.keys(sb.OKH_APP_CONFIG.LOCATIONS).length,8);
 assert.match(map.roomState(world,map.rooms[0]).role,/见习战士/);
});
test('same inn, focus and interaction are insufficient evidence of being in a bedroom',()=>{
 const {map,world}=fixture();world.focusNpcId='nise';world.interactingIds=['nise'];
 const state=map.roomState(world,map.rooms[3]);assert.match(state.status,/房内待确认/);assert(state.actions.some(a=>a.key==='knock'));assert(!state.actions.some(a=>a.key==='talk'));
});
test('unjoined or unmonitored Ed does not expose his identity or visits',()=>{
 const {map,world}=fixture();world.npcs.ed.monitored=true;
 let room=map.roomState(world,map.rooms[5]);assert.equal(room.known,false);assert(!room.name.includes('爱德'));assert.equal(room.actions.length,0);
 world.flags.ed_joined=true;room=map.roomState(world,map.rooms[5]);assert.equal(room.known,true);
 world.npcs.ed.monitored=false;assert.equal(map.roomState(world,map.rooms[5]).known,false);
});
test('temporarily absent guests do not disclose hidden camp coordinates or a find action',()=>{
 const {map,world}=fixture();const npc=world.npcs.gulan;npc.location='wilds_camp';npc.flags.captured_orc=true;
 const room=map.roomState(world,map.rooms[1]);assert.match(room.status,/暂离/);assert.equal(room.location,null);assert(!JSON.stringify(room).includes('wilds_camp'));assert(!room.actions.some(a=>a.key==='find'));
});
test('night co-room state respects location and phase, and important work removes the knock action',()=>{
 const {map,world}=fixture();world.flags.playerRoomTarget='gulan';assert.match(map.roomState(world,map.rooms[1]).status,/同住/);
 world.timeMin=10*60;assert.match(map.roomState(world,map.rooms[1]).status,/待确认/);
 world.npcs.gulan.activity={id:'work',kind:'important',label:'等待交接',startedAt:0};assert(!map.roomState(world,map.rooms[1]).actions.some(a=>a.key==='knock'));
});
test('browsing and accepted intents never modify the world, and stale actions are rejected',()=>{
 const {map,world}=fixture();let texts=[];const fill=s=>{texts.push(s);return true};const before=JSON.stringify(world);
 map.handle(el({'data-okh-act':'map-view','data-okh-view':'upper'}),world,'test',fill);
 map.handle(el({'data-okh-act':'map-room','data-okh-room':'room4'}),world,'test',fill);assert.equal(texts.length,0);
 map.handle(el({'data-okh-act':'map-intent','data-okh-room':'room4','data-okh-intent':'knock'}),world,'test',fill);assert.equal(texts.length,1);assert.match(texts[0],/妮丝/);assert.equal(JSON.stringify(world),before);
 world.npcs.nise.location='town';map.handle(el({'data-okh-act':'map-intent','data-okh-room':'room4','data-okh-intent':'knock'}),world,'test',fill);assert.equal(texts.length,1);
});
test('map state resets between chats and missing input retains a copyable draft',()=>{
 const {map,world}=fixture();map.build(world,'one');map.handle(el({'data-okh-act':'map-room','data-okh-room':'room1'}),world,'one',()=>false);
 map.handle(el({'data-okh-act':'map-intent','data-okh-room':'room1','data-okh-intent':'rest'}),world,'one',()=>false);
 assert.match(map.build(world,'one'),/可复制的行动草稿/);const other=map.build(world,'two');assert(!other.includes('可复制的行动草稿'));assert(!other.includes('okh-m-door'));
});
test('render signature updates for privacy and activity changes even without a clock change',()=>{
 const {map,world}=fixture();const first=map.signature(world);world.npcs.gulan.flags.captured_orc=true;assert.notEqual(map.signature(world),first);
 const second=map.signature(world);world.npcs.gulan.flags.captured_orc=false;world.npcs.gulan.activity={kind:'important',label:'忙碌'};assert.notEqual(map.signature(world),second);
});
