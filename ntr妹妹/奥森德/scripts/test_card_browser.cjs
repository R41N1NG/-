'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.OKH_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1080,height:1000},deviceScaleFactor:1.5}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.route('**/*',r=>r.abort());
  const dir=path.resolve(__dirname,'../最新角色卡');
  const trackListeners=()=>{
   const active=new Set(),add=document.addEventListener,remove=document.removeEventListener;
   const tracked=fn=>['onAvatarClick','onGlobalKeyDown'].includes(fn?.name);
   const tokens=new Map();
   function key(type,fn){if(!tokens.has(fn))tokens.set(fn,tokens.size);return `${type}:${tokens.get(fn)}`}
   document.addEventListener=function(type,fn,...args){if(tracked(fn))active.add(key(type,fn));return add.call(this,type,fn,...args)};
   document.removeEventListener=function(type,fn,...args){if(tracked(fn))active.delete(key(type,fn));return remove.call(this,type,fn,...args)};
   window.bubbleListenerCount=()=>active.size;
  };
  const html=fs.readFileSync(path.join(dir,'导入预览.html'),'utf8');
  await page.setContent(html.replace('<main id="chat">',`<script>(${trackListeners})()</script><main id="chat">`));await page.evaluate(()=>previewReady);
  assert.equal(await page.locator('#chat [data-okh-dlg]').count(),5);
  const previewVersion=await page.locator('#card-payload').evaluate(node=>JSON.parse(node.textContent).data.character_version);
  assert.equal(previewVersion,JSON.parse(fs.readFileSync(path.join(dir,'奥克赫斯.json'),'utf8')).data.character_version);
  const avatar=page.locator('#chat [data-okh-ava]').first(),modal=page.locator('#okh-bubble-modal');
  async function checkAvatar(){
   await avatar.click();assert(await modal.isVisible());
   await modal.getByRole('button',{name:'关闭',exact:true}).click();assert(await modal.isHidden());
   assert.equal(await page.evaluate(()=>bubbleListenerCount()),3);
  }
  await checkAvatar();
  const initial=await page.evaluate(()=>cardWorld());assert.equal(initial.timeMin,1080);assert.equal(initial.npcs.ed.monitored,false);assert.equal(initial.flags.arrived_oakhaven,false);
  assert.equal(await page.locator('#chat .okh-map-guide').count(),1);assert(!(await page.locator('#chat .narrative').innerText()).includes('<status_bar>'));
  assert(await page.evaluate(()=>previewContext.chat[0].mes.includes('<status_bar>')),'Display filtering changed raw messages');
  await page.locator('.okh-m-image img').evaluate(img=>img.decode());await page.locator('.okh-hud-canvas').screenshot({path:path.join(dir,'开场效果.jpg'),type:'jpeg',quality:91});
  assert.equal(await page.getByRole('button',{name:'镇内',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'旅店',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'奥克赫斯镇',exact:true}).count(),0);
  assert.equal(JSON.stringify(await page.evaluate(()=>cardWorld())),JSON.stringify(initial),'Browsing before arrival modified the save');
  await page.getByRole('button',{name:'演示：抵镇入住',exact:true}).click();await page.waitForFunction(()=>cardWorld().flags.arrived_oakhaven);
  assert.equal(await page.locator('#chat .okh-map-guide').count(),1);assert.equal(await page.locator('#chat [data-okh-hud]').count(),2);
  const after=JSON.stringify(await page.evaluate(()=>cardWorld()));
  await page.getByRole('button',{name:'镇内',exact:true}).click();await page.locator('.okh-m-image img').evaluate(img=>img.decode());await page.getByRole('button',{name:'断剑与麦酒',exact:true}).click();
  await page.getByRole('button',{name:'二层 · 客房',exact:true}).click();await page.locator('.okh-m-image img').evaluate(img=>img.decode());
  assert.equal(await page.locator('.okh-m-door').count(),6);await page.getByRole('button',{name:'查看古兰的房间',exact:true}).click();assert((await page.locator('.okh-m-room-head').innerText()).includes('独立住客'));
  await page.getByRole('button',{name:'查看伯里的房间',exact:true}).click();assert((await page.locator('.okh-m-room-head').innerText()).includes('你的房间'));
  await page.getByRole('button',{name:'查看妮丝的房间',exact:true}).click();assert((await page.locator('.okh-m-status').innerText()).includes('房内待确认'));
  await page.locator('.okh-m-journal').screenshot({path:path.join(dir,'旅店效果.jpg'),type:'jpeg',quality:94});
  await page.locator('#send_textarea').fill('已有草稿');await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();assert((await page.locator('#send_textarea').inputValue()).startsWith('已有草稿\n'));
  assert.equal(JSON.stringify(await page.evaluate(()=>cardWorld())),after,'Preparing a room intent changed the save');
  for(const width of [640,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const boxes=await page.locator('.okh-m-name').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));assert.equal(boxes.length,6);for(const r of boxes)assert(r.w>=44&&r.h>=44);if(width===390)await page.locator('.okh-m-journal').screenshot({path:path.join(dir,'手机效果.jpg'),type:'jpeg',quality:94})}
  await page.evaluate(()=>reloadCard());assert.equal(JSON.stringify(await page.evaluate(()=>cardWorld())),after,'Reloading a card reset progress');
  await checkAvatar();
  const counts=await page.evaluate(()=>cardListenerCounts());for(const [name,count]of Object.entries(counts))assert.equal(count,1,'Duplicate listener '+name);
  await page.setViewportSize({width:1080,height:1000});await page.getByRole('button',{name:'二层 · 客房',exact:true}).click();await page.getByRole('button',{name:'查看妮丝的房间',exact:true}).click();
  await page.locator('#send_textarea').fill('');await page.getByRole('button',{name:'› 敲门拜访',exact:true}).click();assert.equal((await page.locator('#send_textarea').inputValue()).split('轻轻敲门').length-1,1);
  await page.getByRole('button',{name:'演示：古兰表情',exact:true}).click();
  const expressionExample=page.locator('#expression-example');
  const portraitSources=['neutral','reprimand','smile'].map(face=>'data:image/webp;base64,'+
   fs.readFileSync(path.join(__dirname,'../对白头像/古兰',face+'.webp')).toString('base64'));
  await page.waitForFunction(()=>document.querySelectorAll('#expression-example [data-okh-ava-done]').length===3);
  assert.deepEqual(await expressionExample.locator('[data-okh-ava]').evaluateAll(nodes=>nodes.map(node=>node.style.backgroundImage)),portraitSources.map(src=>`url("${src}")`));
  assert(!(await expressionExample.innerText()).includes('[smile]'));
  await expressionExample.locator('[data-okh-ava]').last().click();
  assert.equal(await modal.locator('img').getAttribute('src'),portraitSources[2]);
  await modal.locator('img').evaluate(img=>img.decode());
  await modal.getByRole('button',{name:'关闭',exact:true}).click();
  await page.evaluate(()=>appendCardReply('<content>\n古兰：[cry]“没有这张图。”\n古兰：[表情写错]“这句话也保留。”\n妮丝：[smile]“这是我的对白。”\n伯里：\n“我明白。”\n</content>'));
  const reply=page.locator('#chat .mes[is_user=false]').last();
  await page.waitForFunction(()=>[...document.querySelectorAll('#chat .mes[is_user=false]')].at(-1).querySelectorAll('[data-okh-ava-done]').length===4);
  assert.deepEqual(await reply.locator('[data-okh-dlg-body]').allTextContents(),['没有这张图。','这句话也保留。','这是我的对白。','我明白。']);
  assert.deepEqual(await reply.locator('[data-okh-ava]').evaluateAll(nodes=>nodes.map(node=>node.style.backgroundImage)),[`url("${portraitSources[0]}")`,`url("${portraitSources[0]}")`,'','']);
  assert.equal(await reply.locator('.side-right[data-okh-speaker="伯里"]').count(),1);
  await reply.locator('[data-okh-dlg]').first().evaluate(row=>row.setAttribute('data-okh-face','smile'));
  await page.waitForFunction(()=>[...document.querySelectorAll('#chat .mes[is_user=false]')].at(-1).querySelector('[data-okh-ava]').getAttribute('data-okh-ava-face')==='smile');
  assert.equal(await reply.locator('[data-okh-ava]').first().evaluate(node=>node.style.backgroundImage),`url("${portraitSources[2]}")`);
  assert(!requests.some(url=>/regional-art|town-art|upper-scene|ground-scene|map-ink\.woff|journal-page/.test(url)),'Maps or font depended on a network download');
  assert.deepEqual(errors,[]);await page.evaluate(()=>document.getElementById('card-helper').contentWindow.OKH_APP.stop());
  assert.equal(await modal.count(),0);assert.equal(await page.evaluate(()=>bubbleListenerCount()),0);
  console.log('PASS: embedded card payload; native helper startup; greeting; four map views; six rooms; guarded identity; draft input; read-only browsing; mobile; unload/reload; one listener owner; offline maps, fonts and dialogue expressions');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
