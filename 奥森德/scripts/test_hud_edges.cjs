'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {test,before,after}=require('node:test');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'地图预览/接入验证/hud-live-preview.html'),'utf8');
const hudSource=fs.readFileSync(path.join(root,'src/app/okh_app_hud.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'dist/okh_complete.js'),'utf8');
let browser;
before(async()=>{browser=await chromium.launch({executablePath:process.env.OKH_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']})});
after(async()=>{await browser?.close()});
async function withPage(run){
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.setContent(html);await page.evaluate(()=>previewReady);await page.evaluate(()=>OKH_APP.HUD.stopHud());await run(page);assert.deepEqual(errors,[])}finally{await page.close()}
}
async function room(page){
 await page.getByRole('button',{name:'二层 · 客房',exact:true}).click();
 await page.getByRole('button',{name:'查看妮丝的房间',exact:true}).click();
}
test('read-only, disabled and missing input keep a copyable intent; editable input preserves the exact draft',()=>withPage(async page=>{
 await room(page);
 const prior='已有草稿  \n';
 for(const flag of ['readOnly','disabled']){
  await page.locator('#send_textarea').evaluate((e,{flag,prior})=>{e.value=prior;e[flag]=true},{flag,prior});
  await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
  assert.equal(await page.locator('#send_textarea').inputValue(),prior);
  assert((await page.locator('.okh-m-draft').inputValue()).includes('妮丝'));
  assert((await page.locator('.okh-m-feedback').innerText()).includes('复制'));
  await page.locator('#send_textarea').evaluate((e,flag)=>{e[flag]=false},flag);
 }
 await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
 assert((await page.locator('#send_textarea').inputValue()).startsWith(prior+'我来到'));
 await page.locator('#send_textarea').evaluate(e=>e.remove());
 await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
 assert((await page.locator('.okh-m-draft').inputValue()).includes('妮丝'));
}));
test('old chat room and quick-action buttons cannot write into a newly selected chat before the next refresh',()=>withPage(async page=>{
 await room(page);
 await page.evaluate(async()=>{previewContext.chatId='another-chat';await OKH_APP.init();const w=OKH_APP.world();w.flags.arrived_oakhaven=true;w.playerLocation='inn';w.npcs.nise.location='inn';await OKH_APP.save(w,{debug:true})});
 const before=await page.evaluate(()=>JSON.stringify(OKH_APP.world()));
 await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
 assert.equal(await page.locator('#send_textarea').inputValue(),'');
 assert.equal(await page.evaluate(()=>JSON.stringify(OKH_APP.world())),before);
 assert.equal(await page.locator('[data-okh-hud]').getAttribute('data-okh-session'),'another-chat');
 assert.equal(await page.locator('.okh-m-status').count(),0,'Old room selection carried over');
 // General character actions need the same guard as map intents.
 await page.evaluate(async()=>{const oldQuick=document.querySelector('[data-okh-act=fill]');if(!oldQuick)throw Error('Missing quick action fixture');previewContext.chatId='third-chat';await OKH_APP.init();oldQuick.click()});
 assert.equal(await page.locator('#send_textarea').inputValue(),'');
 assert.equal(await page.locator('[data-okh-hud]').getAttribute('data-okh-session'),'third-chat');
}));
test('switching to a chat without a save clears the old HUD and watch text',()=>withPage(async page=>{
 await room(page);await page.evaluate(()=>{const watch=document.createElement('pre');watch.setAttribute('data-okh-watch','');document.body.append(watch);OKH_APP.showWatch(true)});
 assert((await page.locator('[data-okh-watch]').textContent()).length>0);
 await page.evaluate(()=>{previewContext.chatId='empty-chat';OKH_APP.renderHud()});
 assert.equal((await page.locator('[data-okh-hud]').textContent()).trim(),'');
 assert.equal(await page.locator('[data-okh-session]').count(),0);
 assert.equal(await page.locator('[data-okh-watch]').textContent(),'');
 assert(await page.locator('[data-okh-watch]').isHidden());
}));
test('a narrow embedded HUD in a wide desktop window exposes six separate room targets',()=>withPage(async page=>{
 await room(page);await page.addStyleTag({content:'.okh-hud{width:350px;max-width:350px;margin:0}.okh-hud-canvas{padding:12px!important}'});
 assert(await page.locator('.okh-m-options.is-rooms').isVisible());
 assert.equal(await page.locator('.okh-m-door:visible').count(),0);
 const boxes=await page.locator('.okh-m-name').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));
 assert.equal(boxes.length,6);
 for(const r of boxes)assert(r.w>=44&&r.h>=44);
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=boxes[i],b=boxes[j];assert(!(Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)))}
 await page.getByRole('button',{name:'妮丝',exact:true}).click();assert((await page.locator('.okh-m-room-head').innerText()).includes('妮丝'));
}));
test('location privacy updates room and roster without changing the clock or NPC location',()=>withPage(async page=>{
 await page.evaluate(async()=>{const w=OKH_APP.world();w.npcs.gulan.location='manor';await OKH_APP.save(w,{debug:true});OKH_APP.renderHud()});
 await page.getByRole('button',{name:'同伴名册',exact:false}).click();
 assert((await page.locator('[data-okh-member=gulan]').innerText()).includes('领主山庄'));
 await page.evaluate(async()=>{const w=OKH_APP.world();w.npcs.gulan.flags.captured_manor=true;await OKH_APP.save(w,{debug:true});OKH_APP.renderHud()});
 const card=await page.locator('[data-okh-member=gulan]').innerText();assert(card.includes('暂离'));assert(!card.includes('领主山庄'));
 await page.getByRole('button',{name:'旅途手札',exact:false}).click();
 await page.getByRole('button',{name:'二层 · 客房',exact:true}).click();await page.getByRole('button',{name:'查看古兰的房间',exact:true}).click();
 assert((await page.locator('.okh-m-status').innerText()).includes('暂离'));
 assert.equal(await page.getByRole('button',{name:'› 前往寻找',exact:true}).count(),0);
}));
test('hot reloading HUD stops its previous refresh timer and keeps one input handler',()=>withPage(async page=>{
 const active=await page.evaluate(src=>{
  const timers=new Set(),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
  window.setInterval=(...args)=>{const id=set(...args);timers.add(id);return id};window.clearInterval=id=>{timers.delete(id);return clear(id)};
  OKH_APP_HUD.startHud();(0,eval)(src);OKH_APP_HUD.startHud();window.currentHud=OKH_APP_HUD;return timers.size;
 },hudSource);
 assert.equal(active,1);
 await room(page);await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
 assert.equal((await page.locator('#send_textarea').inputValue()).split('轻轻敲门').length-1,1);
 await page.evaluate(()=>currentHud.stopHud());
}));
test('a helper iframe takes over the parent chat once and dispatches input events in the host document',()=>withPage(async page=>{
 await page.evaluate(()=>{const chat=document.createElement('div');chat.id='chat';chat.innerHTML='<div class="mes" is_user="false"><div class="mes_text"></div></div>';chat.querySelector('.mes_text').append(document.querySelector('[data-okh-hud]'));document.body.append(chat)});
 await page.evaluate(async code=>{
  const frame=document.createElement('iframe');document.body.append(frame);const helper=frame.contentWindow;helper.eval(code);
  const store=new Map();helper.OKH_APP.configure({getChatId:()=>previewContext.chatId,getContext:()=>previewContext,storage:{get:k=>store.get(k),set:(k,v)=>{store.set(k,v);return true}}});await helper.OKH_APP.init();await helper.OKH_APP.save(OKH_APP.world(),{debug:true});helper.OKH_APP.renderHud(true);
  window.inputCalls=0;window.hostEvent=true;document.getElementById('send_textarea').addEventListener('input',event=>{inputCalls++;hostEvent&&=event instanceof window.Event});
 },runtime);
 assert.equal(await page.locator('#chat .okh-map-guide').count(),1);
 await room(page);await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
 assert.equal(await page.evaluate(()=>inputCalls),1);
 assert.equal(await page.evaluate(()=>hostEvent),true);
 assert.equal((await page.locator('#send_textarea').inputValue()).split('轻轻敲门').length-1,1);
}));
