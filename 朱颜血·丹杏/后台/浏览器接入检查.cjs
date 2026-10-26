'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),card=JSON.parse(fs.readFileSync(path.join(base,'试用卡/后台接入5/【朱颜血·丹杏】CCv3-后台接入5.json')));
const build=require('../状态栏/build.cjs'),demo=require('../状态栏/演示数据.json').同行;
const scripts=card.data.extensions.regex_scripts;
const ctx=vm.createContext({extension_settings:{disabledExtensions:[]},getRegexScripts:()=>scripts,substitute_find_regex:{NONE:0,RAW:1,ESCAPED:2},substituteParams:x=>x,substituteParamsExtended:x=>x,sanitizeRegexMacro:x=>x,console:{debug(){},warn(){}}});
new vm.Script(fs.readFileSync(path.join(base,'状态栏/宿主fixture/regexFromString.js'),'utf8')).runInContext(ctx);
new vm.Script('const RegexProvider={instance:{get:regexFromString}};\n'+fs.readFileSync(path.join(base,'状态栏/宿主fixture/阶段与替换.js'),'utf8')+'\nglobalThis.run=getRegexedString;').runInContext(ctx);
function documentFor(raw){const source=ctx.run(raw,2,{depth:0});assert.equal(source,raw);const shown=ctx.run(source,2,{isMarkdown:true,depth:0});const doc=shown.match(/```html\s*\n([^]*?)\n```/);assert.ok(doc);return doc[1];}
const report=fields=>'合成验收剧情。\n'+build.source({...demo,...Object.fromEntries(require('../状态栏/羁押名册.json').map(x=>[x.tag,'未知'])),...fields});
const raw=report({time:'宣德五年四月初一 酉时',elapsed:'半刻钟',bailian_state:'已释放',danniang_state:'在押',clue_obtained:'1',clues_gained:'["白莲教调兵密函"]'});
const server=http.createServer((q,r)=>{r.writeHead(q.url==='/'?200:404,{'Content-Type':'text/html'});r.end(q.url==='/'?'<meta name="viewport" content="width=device-width,initial-scale=1">':'');});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const errors=[];
try{const page=await browser.newPage({viewport:{width:1200,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');
await page.evaluate(({first,raw})=>{
 const listeners=new Map();window.bus={on(n,f){if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(f)},removeListener(n,f){listeners.get(n)?.delete(f)}};
 window.emit=async n=>{for(const f of [...(listeners.get(n)||[])])await f()};
 window.chatVars={external:42};window.injections=[];window.ctx={chatId:'test-a',characterId:0,characters:[{data:{extensions:{zyx_backend:{schema:1}}}}],chat:[{mes:first,is_user:false,extra:{}},{mes:raw,is_user:false,extra:{external:'keep'},swipes:[raw],swipe_id:0,swipe_info:[{}]}],eventSource:bus,event_types:Object.fromEntries(['GENERATION_ENDED','MESSAGE_UPDATED','MESSAGE_EDITED','MESSAGE_DELETED','MESSAGE_SWIPED','CHAT_CHANGED','GENERATION_STARTED','GENERATION_AFTER_COMMANDS'].map(k=>[k,k.toLowerCase()]))};
 window.SillyTavern={getContext:()=>ctx};window.TavernHelper={async setChatMessages(rows){for(const row of rows){const m=ctx.chat[row.message_id];m.mes=row.message;m.extra=row.extra;m.swipe_info??=[];m.swipe_info[m.swipe_id||0]=structuredClone(row.extra);}},async insertOrAssignVariables(v){Object.assign(chatVars,v)},async injectPrompts(p){window.injections=p}};
}, {first:card.data.alternate_greetings[0],raw});
await page.evaluate(code=>{const frame=document.createElement('iframe');frame.id='backend';frame.hidden=true;frame.srcdoc='<script>'+code.replaceAll('</script>','<\\/script>')+'</script>';document.body.append(frame)},card.data.extensions.tavern_helper.scripts.find(s=>s.id==='danxing-backend-v1').content);
await page.waitForFunction(()=>chatVars.zyx_backend_current?.state.ready===true);
assert.equal(await page.evaluate(()=>chatVars.zyx_time.minute),7);assert.equal(await page.evaluate(()=>chatVars.zyx_intel.value),1);
await page.evaluate(doc=>{const wrapper=document.createElement('div');wrapper.className='mes';wrapper.setAttribute('mesid','1');const frame=document.createElement('iframe');frame.id='hud';frame.style.cssText='width:100%;border:0;height:1200px';frame.srcdoc=doc;wrapper.append(frame);document.body.append(wrapper)},documentFor(raw));
const hud=page.frameLocator('#hud');await hud.locator('[data-backend-notice]').filter({hasText:'后台已同步'}).waitFor();
assert.ok((await hud.locator('.zyx-hud-time').textContent()).includes('17:07'));await hud.locator('[data-open-prison]').click();assert.equal(await hud.locator('[data-prisoner=bailian]').count(),0);assert.equal(await hud.locator('[data-prisoner=danniang]').count(),1);await hud.locator('[data-prisoner=danniang]').click();assert.ok((await hud.locator('[data-prison-name]').textContent()).includes('裴丹杏'));await hud.locator('[data-prison-back]').click();await hud.locator('[data-close-prison]').click();
const next=report({time:'宣德五年四月初一 酉时',elapsed:'49日',bailian_state:'在押',danniang_state:'已释放',clue_obtained:'1',clues_gained:'["白莲教调兵密函"]'});
await page.evaluate(async raw=>{ctx.chat[1].mes=raw;ctx.chat[1].swipes[0]=raw;await emit('message_edited')},next);
await hud.locator('.zyx-hud-trend strong').filter({hasText:'第2幕'}).waitFor();await hud.locator('[data-open-prison]').click();assert.equal(await hud.locator('[data-prisoner=bailian]').count(),1);assert.equal(await hud.locator('[data-prisoner=danniang]').count(),0);
for(const width of [320,375]){await page.setViewportSize({width,height:1000});assert.ok(await hud.locator('[data-prison-dialog]').evaluate(el=>el.scrollWidth<=el.clientWidth));}
await hud.locator('[data-close-prison]').click();await page.evaluate(()=>document.querySelector('#hud').srcdoc=document.querySelector('#hud').srcdoc);await hud.locator('[data-backend-notice]').filter({hasText:'后台已同步'}).waitFor();
assert.equal(await page.evaluate(()=>chatVars.external),42);assert.equal(await page.evaluate(()=>ctx.chat[1].extra.external),'keep');assert.equal(await page.evaluate(()=>chatVars.zyx_intel.value),1);assert.equal(await page.evaluate(()=>ctx.chat[1].mes),next);
assert.ok(!(await page.evaluate(()=>JSON.stringify(injections))).includes('第三幕'));
assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,cases:['实际正则分阶段HTML/CSS/JS','独立后台iframe无需打开监牢即可保存','收监/释放与监牢详情返回','耗时推进五幕大势','情报去重和原有数据保留','320/375监牢内部宽度','重渲染读取快照','只注入当前大势'],errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
