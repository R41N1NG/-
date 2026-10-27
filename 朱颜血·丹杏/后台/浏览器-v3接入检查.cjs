'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),card=JSON.parse(fs.readFileSync(path.join(base,'试用卡/后台修复6/【朱颜血·丹杏】CCv3-后台修复6.json')));
const {fields}=require('../状态栏/v2界面/协议.cjs'),demo=require('../状态栏/演示数据.json').同行;const build={source:values=>'<status_bar>'+fields.map(k=>'<'+k+'>'+((values[k]&&typeof values[k]==='object')?Object.entries(values[k]).map(([a,b])=>'<'+a+'>'+b+'</'+a+'>').join(''):values[k]??'')+'</'+k+'>').join('')+'</status_bar>'};
const scripts=card.data.extensions.regex_scripts;
const ctx=vm.createContext({extension_settings:{disabledExtensions:[]},getRegexScripts:()=>scripts,substitute_find_regex:{NONE:0,RAW:1,ESCAPED:2},substituteParams:x=>x,substituteParamsExtended:x=>x,sanitizeRegexMacro:x=>x,console:{debug(){},warn(){}}});
new vm.Script(fs.readFileSync(path.join(base,'状态栏/宿主fixture/regexFromString.js'),'utf8')).runInContext(ctx);
new vm.Script('const RegexProvider={instance:{get:regexFromString}};\n'+fs.readFileSync(path.join(base,'状态栏/宿主fixture/阶段与替换.js'),'utf8')+'\nglobalThis.run=getRegexedString;').runInContext(ctx);
function documentFor(raw){const source=ctx.run(raw,2,{depth:0});assert.equal(source,raw);const shown=ctx.run(source,2,{isMarkdown:true,depth:0});const doc=shown.match(/```html\s*\n([^]*?)\n```/);assert.ok(doc);return doc[1];}
const report=(fields,body='合成验收剧情。')=>body+'\n'+build.source({...demo,...Object.fromEntries(require('../状态栏/羁押名册.json').map(x=>[x.tag,'未知'])),...fields});
const raw=report({time:'宣德五年四月初二 申时',prison_control:'掌控',elapsed:'半刻钟',bailian_state:'已释放',danniang_state:'在押',clue_obtained:'1',clues_gained:'["白莲教调兵密函"]'});
const server=http.createServer((q,r)=>{r.writeHead(q.url==='/'?200:404,{'Content-Type':'text/html'});r.end(q.url==='/'?'<meta name="viewport" content="width=device-width,initial-scale=1">':'');});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const errors=[];
try{const page=await browser.newPage({viewport:{width:1200,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');
await page.evaluate(({first,raw})=>{
 const listeners=new Map();window.bus={on(n,f){if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(f)},removeListener(n,f){listeners.get(n)?.delete(f)}};
 window.emit=async n=>{for(const f of [...(listeners.get(n)||[])])await f()};
 window.chatVars={external:42};window.injections=[];window.ctx={chatId:'test-a',characterId:0,characters:[{data:{extensions:{zyx_backend:{schema:1}}}}],chat:[{mes:first,is_user:false,extra:{}},{mes:raw,is_user:false,extra:{external:'keep'},swipes:[raw],swipe_id:0,swipe_info:[{}]}],eventSource:bus,event_types:Object.fromEntries(['GENERATION_ENDED','MESSAGE_UPDATED','MESSAGE_EDITED','MESSAGE_DELETED','MESSAGE_SWIPED','CHAT_CHANGED','GENERATION_STARTED','GENERATION_AFTER_COMMANDS'].map(k=>[k,k.toLowerCase()]))};
 window.SillyTavern={getContext:()=>ctx};window.TavernHelper={async setChatMessages(rows){for(const row of rows){const m=ctx.chat[row.message_id];m.mes=row.message;m.extra=row.extra;m.swipe_info??=[];m.swipe_info[m.swipe_id||0]=structuredClone(row.extra);}},async insertOrAssignVariables(v){Object.assign(chatVars,v)},async injectPrompts(p){window.injections=p}};
}, {first:card.data.alternate_greetings[1],raw});
await page.evaluate(code=>{const frame=document.createElement('iframe');frame.id='backend';frame.hidden=true;frame.srcdoc='<script>'+code.replaceAll('</script>','<\\/script>')+'</script>';document.body.append(frame)},card.data.extensions.tavern_helper.scripts.find(s=>s.id==='danxing-backend-v1').content);
await page.waitForFunction(()=>chatVars.zyx_backend_current?.state.ready===true);
assert.equal(await page.evaluate(()=>chatVars.zyx_time.minute),7);assert.equal(await page.evaluate(()=>chatVars.zyx_clue_progress.value),1);
await page.evaluate(doc=>{const wrapper=document.createElement('div');wrapper.className='mes';wrapper.setAttribute('mesid','1');const frame=document.createElement('iframe');frame.id='hud';frame.style.cssText='width:100%;border:0;height:1200px';frame.srcdoc=doc;wrapper.append(frame);document.body.append(wrapper)},documentFor(raw));
const hud=page.frameLocator('#hud');await hud.locator('[data-zyx-force]').filter({hasText:'官方知晓'}).waitFor();
assert.ok((await hud.locator('.zyx-hud-time').textContent()).includes('15:07'));await hud.locator('[data-open-prison]').click();assert.equal(await hud.locator('[data-prisoner-tab=bailian]').count(),0);assert.equal(await hud.locator('[data-prisoner-tab=danniang]').count(),1);await hud.locator('[data-prisoner-tab=danniang]').click();assert.ok((await hud.locator('[data-dossier-name]').textContent()).includes('裴丹杏'));await hud.locator('[data-close-prison]').click();
const next=report({time:'宣德五年四月初二 申时',prison_control:'掌控',elapsed:'49日',bailian_state:'在押',danniang_state:'已释放',clue_obtained:'1',clues_gained:'["白莲教调兵密函"]'});
await page.evaluate(async raw=>{ctx.chat[1].mes=raw;ctx.chat[1].swipes[0]=raw;await emit('message_edited')},next);
await hud.locator('[data-zyx-force]').filter({hasText:'第2幕'}).waitFor();await hud.locator('[data-open-prison]').click();assert.equal(await hud.locator('[data-prisoner-tab=bailian]').count(),1);assert.equal(await hud.locator('[data-prisoner-tab=danniang]').count(),0);
for(const width of [320,375]){await page.setViewportSize({width,height:1000});assert.ok(await hud.locator('[data-prison-dialog]').evaluate(el=>el.scrollWidth<=el.clientWidth));}
await hud.locator('[data-close-prison]').click();await page.evaluate(()=>document.querySelector('#hud').srcdoc=document.querySelector('#hud').srcdoc);await hud.locator('[data-zyx-force]').filter({hasText:'官方知晓'}).waitFor();
assert.equal(await page.evaluate(()=>chatVars.external),42);assert.equal(await page.evaluate(()=>ctx.chat[1].extra.external),'keep');assert.equal(await page.evaluate(()=>chatVars.zyx_clue_progress.value),1);assert.equal(await page.evaluate(()=>ctx.chat[1].mes),next);
assert.ok(!(await page.evaluate(()=>JSON.stringify(injections))).includes('第三幕'));
// 同一当前楼依次测试初始二人→第三人→八人→全部释放，其他六人不得预先出现在监牢。
const roster=require('../状态栏/羁押名册.json');
async function update(fields,body){const value=report({time:'宣德五年四月初二 申时',elapsed:'0分钟',prison_control:'掌控',...fields},body);await page.evaluate(async raw=>{ctx.chat[1].mes=raw;ctx.chat[1].swipes[0]=raw;await emit('message_edited')},value);}
await update({});await hud.locator('[data-open-prison]').click();assert.equal(await hud.locator('[data-prisoner-tab]').count(),2);
await update({danniang_state:'在押'});await hud.locator('[data-prisoner-tab=danniang]').waitFor();assert.equal(await hud.locator('[data-prisoner-tab]').count(),3);
await update(Object.fromEntries(roster.map(x=>[x.tag,'在押'])));assert.equal(await hud.locator('[data-prisoner-tab]').count(),8);assert.ok(await hud.locator('[data-prison-dialog]').evaluate(el=>el.scrollWidth<=el.clientWidth));
await update(Object.fromEntries(roster.map(x=>[x.tag,'已释放'])));assert.equal(await hud.locator('[data-prisoner-tab]').count(),0);assert.ok((await hud.locator('[data-prison-tabs]').textContent()).includes('当前没有明确在押'));
await hud.locator('[data-close-prison]').click();
const evidence='差役已经回城报案，将消息交给了主簿。';await update({intel_events:JSON.stringify([{id:'first_report',type:'report',evidence}])},evidence);assert.equal(await page.evaluate(()=>chatVars.zyx_intel),20);assert.ok(await page.evaluate(()=>chatVars.zyx_nodes.active.id==='dark'));await page.locator('#hud').evaluate(f=>f.contentWindow.dispatchEvent(new Event('load')));assert.equal(await page.evaluate(()=>typeof chatVars.zyx_intel),'number');assert.ok(Array.isArray(await page.evaluate(()=>chatVars.zyx_places)));assert.ok((await page.evaluate(()=>JSON.stringify(injections))).includes('official'));
// 在请求开始前已经解锁的NPC以完整档案注入，不等模型先用提要写完再改共享条目。
const entered=report({time:'宣德五年四月初二 申时',elapsed:'19日',prison_control:'掌控',location:'长宁县城'});
await page.evaluate(async raw=>{ctx.chat[1].mes=raw;ctx.chat[1].swipes[0]=raw;await emit('message_edited');await emit('generation_after_commands')},entered);
assert.ok(await page.evaluate(()=>JSON.parse(injections[0].content.split('\n')[1]).npcProfiles['宁安郡主'].length>100));
assert.ok(await page.evaluate(()=>JSON.parse(injections[0].content.split('\n')[1]).npcProfiles['青萝'].length>100));
await page.evaluate(async()=>{await emit('generation_ended');});
assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,cases:['实际正则分阶段HTML/CSS/JS','独立后台iframe无需打开监牢即可保存','收监/释放与监牢人犯切换关闭','耗时推进五幕大势','信物去重和原有数据保留','320/375监牢内部宽度','重渲染读取快照','只注入当前大势','初始2人后续3/8/0动态名单','HUD重渲染不覆盖官府数字/事件schema','NPC完整档案在生成前注入'],errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
