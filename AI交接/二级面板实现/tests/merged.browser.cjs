// gpt：实际候选GM＋宿主强覆盖样式；验证单窗口/阶段单选/预览失效/隐藏字段保护。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.XSD_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<style>button{background:#eee!important;color:#e8e8e8!important;letter-spacing:8px;padding-left:20px;text-indent:15px}body{margin:0;background:#201c28}</style><div data-xds-panel><div class="xh-title" style="letter-spacing:10px">卷中錄</div></div><iframe id="script"></iframe>');
  await page.evaluate(()=>{
   const sd={身份:'自设',仙盟历:1579.03,仙盟历文:'1579年3月1日',段位:3,known:{般若菩提菊成形:true,般若菩提菊一阶段:true,般若菩提菊二阶段:true,般若菩提菊三阶段:true,般若菩提菊四阶段:true,孤月定情:true}};
   window.stores={chat:{stat_data:structuredClone(sd)},message:{stat_data:structuredClone(sd)}};window.ctx={chatId:'merged',chat:[{},{}]};
   window.SillyTavern={getContext:()=>ctx};window.TavernHelper={getVariables:o=>structuredClone(stores[o.type]),updateVariablesWith:(fn,o)=>{stores[o.type]=fn(structuredClone(stores[o.type]));return structuredClone(stores[o.type]);}};
  });
  const base=path.resolve(__dirname,'../候选源码'),frame=page.frames()[1];
  await frame.evaluate(code=>(0,eval)(code),fs.readFileSync(path.join(base,'src/correction-runtime.js'),'utf8')+'\n'+fs.readFileSync(path.join(base,'卡片脚本/GM修改器.js'),'utf8'));
  await page.evaluate(()=>__xsdCorrection.bindStatusEntry(document.querySelector('[data-xds-panel]')));
  await page.getByRole('button',{name:'GM控制面板',exact:true}).click();
  const mask=page.locator('#xshd-gm-mask'),panel=page.locator('#xsd-correction-dialog'),confirm=panel.getByRole('button',{name:/^确认应用/});
  assert.equal(await mask.count(),1);assert.equal(await panel.locator('xpath=ancestor::*[@id="xshd-gm-mask"]').count(),1);assert.equal(await page.locator('[aria-modal="true"]').count(),0);
  assert.equal(await confirm.isDisabled(),true);assert.match(await panel.getByRole('status').innerText(),/先.*预览/);
  const gear=await page.locator('[data-xsd-settings]').evaluate(el=>{const s=getComputedStyle(el);return {border:s.borderTopWidth,align:s.alignItems,justify:s.justifyContent,spacing:s.letterSpacing,padding:s.paddingLeft,indent:s.textIndent};});
  assert(['normal','0px'].includes(gear.spacing));gear.spacing='0px';assert.deepEqual(gear,{border:'0px',align:'center',justify:'center',spacing:'0px',padding:'0px',indent:'0px'});
  const rgb=await panel.getByRole('button',{name:'预览改动',exact:true}).evaluate(el=>{const s=getComputedStyle(el);return [s.color,s.backgroundColor];});
  function luminance(rgb){const c=rgb.match(/\d+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  const vals=rgb.map(luminance).sort((a,b)=>a-b);assert((vals[1]+.05)/(vals[0]+.05)>=4.5,'宿主浅色!important下文字仍有4.5:1对比');
  await page.getByRole('tab',{name:'纹章与剧情',exact:true}).hover();const activeRgb=await page.getByRole('tab',{name:'纹章与剧情',exact:true}).evaluate(el=>{const s=getComputedStyle(el);return [s.color,s.backgroundColor];});const activeVals=activeRgb.map(luminance).sort((a,b)=>a-b);assert((activeVals[1]+.05)/(activeVals[0]+.05)>=4.5,'选中页签悬停仍可读');
  await panel.getByLabel('纹章',{exact:true}).selectOption('boruoputiju');await panel.getByLabel('当前阶段',{exact:true}).selectOption('2');
  assert.equal(await panel.getByLabel('当前阶段',{exact:true}).evaluate(el=>el.selectedOptions.length),1);
  await panel.getByRole('button',{name:'预览改动',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#xsd-correction-dialog button:nth-child(2)').disabled);
  assert.match(await panel.getByLabel('改动预览',{exact:true}).innerText(),/当前阶段：4 → 2/);assert(!/人工纠错|派生账本|历基准/.test(await panel.getByLabel('改动预览',{exact:true}).innerText()));
  await confirm.click();await page.waitForFunction(()=>stores.message.stat_data.known.般若菩提菊四阶段===false);
  const known=await page.evaluate(()=>stores.chat.stat_data.known);assert.equal(known.般若菩提菊一阶段,true);assert.equal(known.般若菩提菊二阶段,true);assert.equal(known.般若菩提菊三阶段,false);
  await panel.getByLabel('当前阶段',{exact:true}).selectOption('1');await panel.getByRole('button',{name:'预览改动',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#xsd-correction-dialog button:nth-child(2)').disabled);
  await panel.getByLabel('当前阶段',{exact:true}).selectOption('3');assert.equal(await confirm.isDisabled(),true);assert.match(await panel.getByRole('status').innerText(),/设置已变更.*预览/);
  // 异步读完之前改字段，旧预览不得重新启用确认按钮。
  await page.evaluate(()=>{const fn=TavernHelper.getVariables;window.originalGet=fn;TavernHelper.getVariables=o=>new Promise(resolve=>setTimeout(()=>resolve(fn(o)),80));});
  await panel.getByRole('button',{name:'预览改动',exact:true}).click();await panel.getByLabel('当前阶段',{exact:true}).selectOption('1');
  await page.waitForFunction(()=>!document.querySelector('#xsd-correction-dialog button:first-child').disabled);
  assert.equal(await confirm.isDisabled(),true);await page.evaluate(()=>TavernHelper.getVariables=originalGet);
  // 身份页不再提供多个阶段勾选，也不会保存不可见资格。
  await page.getByRole('tab',{name:'身份与状态',exact:true}).click();
  assert.equal(await mask.locator('input[data-known$="阶段"]').count(),0);assert.equal(await mask.locator('input[data-known="般若菩提菊成形"]').count(),0);
  const before=await page.evaluate(()=>structuredClone(stores.chat.stat_data.known));
  await mask.locator('[data-field="地点"]').fill('新地点');await mask.getByRole('button',{name:'💾 保存并生效',exact:true}).click();await page.waitForFunction(()=>stores.message.stat_data.地点==='新地点');
  const after=await page.evaluate(()=>stores.chat.stat_data.known);for(const [k,v] of Object.entries(before))assert.equal(after[k],v,'保存身份页不得改已存资格/事实：'+k);for(const k of await page.evaluate(()=>__xsdCorrection.relics.flatMap(r=>(r.form?[r.form]:[]).concat(r.stages)).concat(__xsdCorrection.plotFields)))assert.equal(Object.hasOwn(after,k),Object.hasOwn(before,k),'不得补写隐藏字段：'+k);
  await page.getByRole('tab',{name:'纹章与剧情',exact:true}).click();
  const out=path.resolve(__dirname,'../验证结果/v1.2');fs.mkdirSync(out,{recursive:true});await page.locator('#xsd-gm-correction').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(out,'GM合并界面-1000.png')});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>xsdGM.open());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const b=await page.locator('[data-xsd-settings]').boundingBox();assert(b.width>=36&&b.height>=36);}
  await page.locator('#xsd-gm-correction').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(out,'GM合并界面-320.png')});
  // 关闭后跨楼再打开应刷新token，不能“重开面板”循环失败。
  await page.getByTitle('关闭面板',{exact:true}).click();await page.evaluate(()=>ctx.chat.push({}));await page.getByRole('button',{name:'GM控制面板',exact:true}).click();
  await panel.getByLabel('当前阶段',{exact:true}).selectOption('1');await panel.getByRole('button',{name:'预览改动',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#xsd-correction-dialog button:nth-child(2)').disabled);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({scope:'实际候选GM＋宿主强覆盖样式模拟；非酒馆真机',passed:['无框居中36px齿轮直开单GM窗口','同一窗口页签切换无第二层遮罩','未预览与修改后明确禁用/提示','有效预览后确认双层写入','异步预览期间修改不会启用旧计划','当前阶段单选且历史资格保留','身份页不展示/不写名器阶段与共享主线','宿主样式覆盖下按钮文字对比≥4.5:1','390/320无横溢出','跨楼关闭重开可重新预览'],pageErrors:errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
