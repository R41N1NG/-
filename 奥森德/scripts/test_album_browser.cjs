'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.OKH_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const dir=path.resolve(__dirname,'../最新角色卡');
 try{
  const page=await browser.newPage({viewport:{width:1080,height:1000},deviceScaleFactor:1.5}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.route('**/*',r=>r.abort());
  await page.setContent(fs.readFileSync(path.join(dir,'导入预览.html'),'utf8'));await page.evaluate(()=>previewReady);await page.getByRole('button',{name:'👥 同伴名册',exact:true}).click();
  assert(await page.locator('.okh-album-empty').isVisible());assert.equal(await page.locator('.okh-memory').count(),0);await page.locator('.okh-hud-canvas').screenshot({path:path.join(dir,'回忆相册空状态.jpg'),type:'jpeg',quality:93});
  await page.evaluate(()=>document.getElementById('card-helper').contentWindow.OKH_APP.stop());
  await page.goto('about:blank');
  await page.setContent(fs.readFileSync(path.join(dir,'相册排版预览.html'),'utf8'));await page.evaluate(()=>previewReady);await page.getByRole('button',{name:'👥 同伴名册',exact:true}).click();
  assert.equal(await page.locator('.okh-memory').count(),4);assert(!(await page.locator('.okh-album').innerText()).includes('未收集标题'));assert(!(await page.locator('.okh-album').innerText()).includes('未登场标题'));
  await page.locator('.okh-memory img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));const before=JSON.stringify(await page.evaluate(()=>cardWorld()));
  const positions=await page.evaluate(()=>({album:document.querySelector('.okh-album').getBoundingClientRect().top,last:document.querySelector('.okh-member-card:last-of-type').getBoundingClientRect().bottom}));assert(positions.album>=positions.last);
  await page.locator('.okh-hud-canvas').screenshot({path:path.join(dir,'回忆相册示意.jpg'),type:'jpeg',quality:94});
  await page.getByRole('button',{name:'查看古兰的古兰 · 肖像',exact:true}).click();assert(await page.getByRole('dialog',{name:'古兰 · 肖像',exact:true}).isVisible());assert.equal(await page.locator('[data-okh-album-position]').innerText(),'1 / 4');assert(await page.getByRole('button',{name:'上一幅回忆',exact:true}).isDisabled());
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-okh-lb-cap]').innerText(),'妮丝 · 肖像');
  await page.getByRole('button',{name:'下一幅回忆',exact:true}).click();assert.equal(await page.locator('[data-okh-lb-cap]').innerText(),'旅途一页');await page.keyboard.press('Escape');assert(await page.locator('#okh-hud-lightbox').isHidden());
  await page.getByRole('button',{name:'妮丝2',exact:true}).click();assert.equal(await page.locator('.okh-memory').count(),2);
  await page.getByRole('button',{name:'查看妮丝的旅途一页',exact:true}).click();assert.equal(await page.locator('[data-okh-album-position]').innerText(),'2 / 2');assert(await page.getByRole('button',{name:'下一幅回忆',exact:true}).isDisabled());
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert((await page.evaluate(()=>document.activeElement.closest('#okh-hud-lightbox')!==null)));
  await page.getByRole('button',{name:'关闭',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-okh-memory')),'demo_nise_cg');
  await page.getByRole('button',{name:'全部4',exact:true}).click();
  for(const width of [640,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width===390)await page.locator('.okh-album').screenshot({path:path.join(dir,'回忆相册手机示意.jpg'),type:'jpeg',quality:94})}
  assert.equal(JSON.stringify(await page.evaluate(()=>cardWorld())),before,'Album browsing changed save state');
  await page.setViewportSize({width:320,height:568});await page.getByRole('button',{name:'查看妮丝的旅途一页',exact:true}).click();
  const navBox=await page.locator('.okh-lb-album-nav').boundingBox();assert(navBox.y>=0&&navBox.y+navBox.height<=568,'Mobile lightbox controls overflow');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'查看古兰的古兰 · 肖像',exact:true}).click();await page.evaluate(async()=>{const w=cardWorld();w.playerState.memories=w.playerState.memories.filter(row=>row.id!=='demo_gulan_portrait');await document.getElementById('card-helper').contentWindow.OKH_APP.save(w,{debug:true});document.getElementById('card-helper').contentWindow.OKH_APP.renderHud()});assert(await page.locator('#okh-hud-lightbox').isHidden(),'Rolled-back memories remain open');
  await page.evaluate(async()=>{previewContext.chatId='empty-album-chat';await document.getElementById('card-helper').contentWindow.OKH_APP.init();document.getElementById('card-helper').contentWindow.OKH_APP.renderHud()});await page.getByRole('button',{name:'👥 同伴名册',exact:true}).click();assert(await page.locator('.okh-album-empty').isVisible());
  assert(!requests.some(url=>url.includes('example.invalid')),'Uncollected images were requested');assert.deepEqual(errors,[]);
  await page.evaluate(()=>document.getElementById('card-helper').contentWindow.OKH_APP.stop());console.log('PASS: production empty album; collected-only gallery; character filters; large image; arrows and focus; mobile; read-only browsing; rollback and chat isolation; no locked-image requests');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
