'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.OKH_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:980,height:1100},deviceScaleFactor:1.5});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const out=path.resolve(__dirname,'../地图预览/接入验证');
 await page.setContent(fs.readFileSync(path.join(out,'hud-live-preview.html'),'utf8'),{waitUntil:'load'});
 await page.evaluate(()=>window.previewReady);
 const before=await page.evaluate(()=>JSON.stringify(OKH_APP.world()));
 await page.getByRole('button',{name:'二层 · 客房',exact:true}).click();
 await page.getByRole('button',{name:'查看妮丝的房间',exact:true}).click();
 assert((await page.locator('.okh-m-status').innerText()).includes('房内待确认'));
 assert.equal(await page.evaluate(()=>JSON.stringify(OKH_APP.world())),before,'Browsing changed the save');
 await page.locator('.okh-hud-canvas').screenshot({path:path.join(out,'hud-rooms-desktop.jpg'),type:'jpeg',quality:92});
 await page.locator('#send_textarea').fill('已有草稿');
 await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();
 assert((await page.locator('#send_textarea').inputValue()).startsWith('已有草稿\n'));
 assert.equal(await page.evaluate(()=>JSON.stringify(OKH_APP.world())),before,'Preparing an intent changed the save');
 await page.screenshot({path:path.join(out,'hud-action.jpg'),type:'jpeg',quality:91,fullPage:true});
 await page.locator('#preview-nise-away').click();
 await page.waitForFunction(()=>document.querySelector('.okh-m-status')?.textContent.includes('外出'));
 assert.equal(await page.getByRole('button',{name:'› 敲门拜访',exact:true}).count(),0);
 assert(await page.getByRole('button',{name:'› 前往寻找',exact:true}).isVisible());
 await page.locator('#preview-nise-return').click();
 await page.waitForFunction(()=>document.querySelector('.okh-m-status')?.textContent.includes('房内待确认'));
 await page.getByRole('button',{name:'同伴名册',exact:false}).click();
 assert(await page.locator('[data-okh-page=roster]').isVisible());
 await page.getByRole('button',{name:'旅途手札',exact:false}).click();
 assert(await page.locator('.okh-m-status').isVisible());
 await page.locator('.okh-map-guide [data-okh-view=region]').click();
 await page.locator('.okh-map-guide img').evaluate(img=>img.decode());
 await page.locator('.okh-hud-canvas').screenshot({path:path.join(out,'hud-regional.jpg'),type:'jpeg',quality:91});
 await page.locator('.okh-m-image').screenshot({path:path.join(out,'map-labels-detail.jpg'),type:'jpeg',quality:94});
 await page.getByRole('button',{name:'奥克赫斯镇',exact:true}).click();
 await page.locator('.okh-map-guide img').evaluate(img=>img.decode());
 await page.locator('.okh-m-image').screenshot({path:path.join(out,'town-labels-detail.jpg'),type:'jpeg',quality:94});
 await page.getByRole('button',{name:'断剑与麦酒',exact:true}).click();
 await page.getByRole('button',{name:'二层 · 客房',exact:true}).click();
 await page.getByRole('button',{name:'查看古兰的房间',exact:true}).click();
 assert((await page.locator('.okh-m-room-head').innerText()).includes('独立住客'));
 await page.getByRole('button',{name:'查看伯里的房间',exact:true}).click();
 await page.locator('.okh-hud-canvas').screenshot({path:path.join(out,'hud-player-room.jpg'),type:'jpeg',quality:92});
 await page.getByRole('button',{name:'查看古兰的房间',exact:true}).click();
 for(const width of [640,390,320]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Horizontal overflow '+width);
  const boxes=await page.locator('.okh-m-options.is-rooms button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));
  assert.equal(boxes.length,6);
  for(const r of boxes){assert(r.w>=44,'Narrow room target '+width);assert(r.h>=44,'Short room target '+width)}
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=boxes[i],b=boxes[j];assert(!(Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)),'Overlapping room targets '+width)}
  if(width===390)await page.locator('.okh-hud-canvas').screenshot({path:path.join(out,'hud-rooms-mobile.jpg'),type:'jpeg',quality:92});
 }
 // A privacy-state change without a clock change must repaint the existing HUD.
 await page.evaluate(async()=>{const w=OKH_APP.world();w.npcs.gulan.location='wilds_camp';w.npcs.gulan.flags.captured_orc=true;await OKH_APP.save(w,{debug:true});OKH_APP.renderHud()});
 assert((await page.locator('.okh-m-status').innerText()).includes('暂离'));
 assert(!(await page.locator('.okh-m-detail').innerText()).includes('黑兽人'));
 await page.setViewportSize({width:980,height:1100});
 await page.locator('.okh-map-guide img').evaluate(img=>{img.src='data:image/webp;base64,broken'});
 await page.waitForFunction(()=>document.querySelector('.okh-m-image').classList.contains('image-unavailable'));
 assert(await page.locator('.okh-m-options.is-rooms').isVisible(),'Missing art must keep room navigation usable');
 // Standard SillyTavern message mounting, then compact old messages when a new reply appears.
 await page.evaluate(()=>{document.querySelector('[data-okh-hud]').remove();const chat=document.createElement('div');chat.id='chat';chat.innerHTML='<div class="mes" is_user="false"><div class="mes_text">已有叙事</div></div>';document.body.append(chat);OKH_APP.renderHud(true)});
 assert.equal(await page.locator('#chat [data-okh-hud]').count(),1);
 await page.evaluate(()=>{document.getElementById('chat').insertAdjacentHTML('beforeend','<div class="mes" is_user="false"><div class="mes_text">新回复</div></div>');OKH_APP.renderHud()});
 assert.equal(await page.locator('#chat [data-okh-hud]').count(),2);
 assert.equal(await page.locator('#chat .okh-hud-compact').count(),1);
 assert.equal(await page.locator('#chat .okh-map-guide').count(),1);
 // Same-origin helper iframe: fresh runtime targets the parent chat and its input.
 const runtime=fs.readFileSync(path.resolve(__dirname,'../dist/okh_complete.js'),'utf8');
 await page.evaluate(async code=>{
  OKH_APP.HUD.stopHud();document.querySelectorAll('[data-okh-hud]').forEach(el=>el.remove());
  const frame=document.createElement('iframe');frame.id='helper-script';document.body.append(frame);const helper=frame.contentWindow;helper.eval(code);
  const store=new Map();helper.OKH_APP.configure({getChatId:()=>previewContext.chatId,getContext:()=>previewContext,storage:{get:k=>store.get(k),set:(k,v)=>{store.set(k,v);return true}}});
  await helper.OKH_APP.init();helper.OKH_APP.renderHud(true);window.helperRuntime=helper;
 },runtime);
 assert.equal(await page.locator('#chat .okh-map-guide').count(),1,'Helper runtime did not mount in chat document');
 assert.equal(await page.evaluate(()=>document.getElementById('helper-script').contentDocument.querySelectorAll('[data-okh-hud]').length),0);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: real HUD/store; map and room navigation; read-only intents; live state/privacy; original tabs; responsive layout; auto mount/compact history; helper iframe; zero page errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
