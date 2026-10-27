'use strict';
// Read-only production audit. Usage: node this.cjs [repository-root] [result.json]
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'/workspace/-');
const out=path.resolve(process.argv[3]||'/tmp/danxing-v3-host-review-results.json');
const base=path.join(root,'朱颜血·丹杏');
const {createHostRuntime}=require(path.join(base,'后台/宿主适配.js'));
require(path.join(base,'后台/指纹.js'));
const projection=require(path.join(base,'状态栏/后台投影.js'));
const config=require(path.join(base,'后台/规则.json'));
const artifact=path.join(root,'downloads/danxing-backend-v3.json');
const card=JSON.parse(fs.readFileSync(artifact,'utf8'));
const opening=card.data.alternate_greetings[1];
const report=opening.match(/<status_bar>[^]*?<\/status_bar>/)[0].replace(/<elapsed>[^]*?<\/elapsed>/,'<elapsed>1时辰</elapsed>');
function setup(chat){
 const ctx={chatId:'review-a',characterId:0,characters:[{data:{extensions:{zyx_backend:{schema:1}}}}],chat};
 const vars={external:'kept'};
 const host={SillyTavern:{getContext:()=>ctx},TavernHelper:{
  async setChatMessages(rows){for(const row of rows){const m=ctx.chat[row.message_id];m.mes=row.message;m.extra=row.extra;if(m.swipes){m.swipe_info??=[];m.swipe_info[m.swipe_id??0]=row.extra;}}},
  async insertOrAssignVariables(v){Object.assign(vars,v);},async injectPrompts(){}
 }};host.parent=host;host.top=host;
 return {ctx,vars,runtime:createHostRuntime({window:host,config})};
}
(async()=>{
 const findings=[];
 const missing=setup([{mes:opening,extra:{}},{mes:'这一楼遗漏状态块。',extra:{}}]);
 try{
  await missing.runtime.sync();
  const engineState=missing.runtime.getState(),hud=projection.read(missing.ctx.chat,1,missing.ctx.chatId);
  const observed={enginePending:engineState.pending,hudPending:hud?.pending??null,lastError:missing.runtime.getDiagnostics().lastError,lastFloorHasBackend:!!missing.ctx.chat[1].extra.zyx_backend};
  assert.ok(observed.enginePending.some(x=>x.code==='missing_report'));
  assert.deepEqual(observed.hudPending,[]);assert.equal(observed.lastError,null);
  findings.push({id:'missing_report_not_visible',reproduced:true,steps:['有效零楼后追加无状态块楼','调用 runtime.sync()','对照 engineState.pending、HUD投影及diagnostics'],observed});
 }finally{await missing.runtime.stop();}
 const stale=setup([{mes:opening,extra:{}},{mes:'正常楼\n'+report,extra:{}}]);
 try{
  await stale.runtime.sync();assert.ok(projection.read(stale.ctx.chat,1,stale.ctx.chatId));
  const old=stale.ctx.chat[1].extra.zyx_backend;
  stale.ctx.chat[1].mes='编辑后无状态块';await stale.runtime.sync();
  const afterInvalid={oldBackendRetained:stale.ctx.chat[1].extra.zyx_backend===old,hud:projection.read(stale.ctx.chat,1,stale.ctx.chatId)};
  stale.ctx.chat.push({mes:'后续正常楼\n'+report,extra:{}});await stale.runtime.sync();
  const observed={afterInvalid,finalEngineReady:stale.runtime.getState().ready,lastFloorHasFreshSnapshot:!!stale.ctx.chat[2].extra.zyx_backend,hudAtLaterValidFloor:projection.read(stale.ctx.chat,2,stale.ctx.chatId),lastError:stale.runtime.getDiagnostics().lastError};
  assert.equal(observed.afterInvalid.oldBackendRetained,true);assert.equal(observed.finalEngineReady,true);assert.equal(observed.lastFloorHasFreshSnapshot,true);assert.equal(observed.hudAtLaterValidFloor,null);assert.equal(observed.lastError,null);
  findings.push({id:'stale_invalid_floor_blocks_later_valid_snapshots',reproduced:true,steps:['有效零楼和完整楼结算成功','将完整楼正文编辑成缺状态块并同步','追加新完整楼并同步','检查当前HUD投影'],observed});
 }finally{await stale.runtime.stop();}
 const result={audit:'danxing-backend-v3 host runtime',createdAt:new Date().toISOString(),repositoryRoot:root,artifact,productionFilesModified:false,scope:'Current source host adapter and engine; opening input from shipped backend-v3 card; no live Tavern connection.',findings};
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({resultFile:out,reproduced:findings.map(f=>f.id)},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
