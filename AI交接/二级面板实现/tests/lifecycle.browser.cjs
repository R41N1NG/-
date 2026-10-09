// gpt：实际GM＋生成模板；覆盖创建 iframe 销毁后宿主按钮、队列和实时API。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.XSD_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<div class="mes" mesid="1"><div class="mes_text"><div id="hud"></div></div></div><iframe id="gm-script"></iframe><iframe id="hud-script"></iframe>');
  await page.evaluate(()=>{
   const sd={身份:'自设',仙盟历:1579.03,仙盟历文:'1579年3月1日',段位:3,历基准:18950,历时累计:0,known:{}};
   window.stores={chat:{stat_data:structuredClone(sd)},message:{stat_data:structuredClone(sd)}};
   window.ctx={chatId:'lifecycle',chat:[{},{}],name1:'玩家'};window.SillyTavern={getContext:()=>ctx};
   window.calls=0;
   window.TavernHelper={
    getVariables:o=>structuredClone(stores[o.type]),
    updateVariablesWith:(fn,o)=>{calls++;stores[o.type]=fn(structuredClone(stores[o.type]));return structuredClone(stores[o.type]);},
    getChatMessages:()=>[],setChatMessages:()=>true
   };
  });
  const root=path.resolve(__dirname,'../候选源码'),core=fs.readFileSync(path.join(root,'src/correction-runtime.js'),'utf8');
  const gm=fs.readFileSync(path.join(root,'卡片脚本/GM修改器.js'),'utf8');
  let hud=fs.readFileSync(path.join(root,'卡片脚本/_src/状态栏面板.模板.js'),'utf8');
  // 资源仍从上传原生产件取，不在复核目录编造CSS/骨架/字体。
  const original=fs.readFileSync(path.resolve(__dirname,'../../下级更新/二级面板接入源码/卡片脚本/状态栏面板.js'),'utf8');
  for(const [key,mark]of [['CSS','CSS'],['SKELETON','SKEL'],['FONT_B64','FONT']]) {
   const match=original.match(new RegExp('const XSD_'+key+'\\s*=\\s*(["\'][^"\']*["\']);'));
   assert(match,'原生产件资源缺失：'+key);hud=hud.replace('/*__XSD_'+mark+'_B64__*/',match[1]);
  }
  const gmFrame=page.frames()[1],hudFrame=page.frames()[2];
  await gmFrame.evaluate(code=>(0,eval)(code),core+'\n'+gm);
  await hudFrame.evaluate(code=>(0,eval)(code),core+'\n'+hud);
  const raw='<Status_block>\n<地点>测试地点</地点>\n<身份>自设</身份>\n<在场>玩家</在场>\n</Status_block>';
  await page.evaluate(raw=>XsdHUD.mount(document.querySelector('#hud'),raw,1),raw);
  assert.equal(await page.locator('[data-xsd-settings]').count(),1);
  await page.getByRole('button',{name:'GM控制面板',exact:true}).click();
  let dialog=page.locator('#xsd-correction-dialog');
  await dialog.getByLabel('个人段位',{exact:true}).selectOption('auto'); // 核实争议的选项真实存在
  await page.evaluate(()=>{
   document.getElementById('gm-script').remove();document.getElementById('hud-script').remove();
   // 模拟助手宿主API重注册；不能持有旧API/iframe函数。
   const previous=TavernHelper;window.TavernHelper={...previous,updateVariablesWith:(fn,o)=>{window.newApiUsed=true;return previous.updateVariablesWith(fn,o);}};
  });
  await dialog.getByRole('button',{name:'重新读取',exact:true}).click();
  await dialog.getByLabel('个人段位',{exact:true}).selectOption('keep');
  await dialog.getByLabel('纹章',{exact:true}).selectOption('boruoputiju');
  await dialog.getByLabel('亮灭',{exact:true}).selectOption('false');
  await dialog.getByRole('button',{name:'预览改动',exact:true}).click();
  await dialog.getByRole('button',{name:'确认应用',exact:true}).click();
  await page.waitForFunction(()=>stores.message.stat_data.known.般若菩提菊成形===false);
  assert.equal(await page.evaluate(()=>newApiUsed),true);
  await dialog.getByRole('button',{name:'撤销最近一次',exact:true}).click();
  await page.waitForFunction(()=>stores.chat.xsd_correction_meta.log.length===0);
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();assert.equal(await dialog.count(),0);
  // 状态栏节点留下，而两个脚本iframe均已销毁：齿轮与完整GM仍能操作。
  await page.getByRole('button',{name:'GM控制面板',exact:true}).click();
  await dialog.getByRole('button',{name:'完整GM设置',exact:true}).click();
  assert.equal(await page.locator('#xshd-gm-mask').isVisible(),true);
  const mask=page.locator('#xshd-gm-mask');
  await mask.locator('[data-field="地点"]').fill('手工修复地点');
  await mask.getByRole('button',{name:'💾 保存并生效',exact:true}).click();
  await page.waitForFunction(()=>stores.message.stat_data.地点==='手工修复地点',null,{timeout:3000});
  await page.evaluate(()=>{stores.chat.stat_data.地点='外部更新地点';stores.message.stat_data.地点='外部更新地点';});
  await mask.getByTitle('读回当前值',{exact:true}).click();
  assert.equal(await mask.locator('[data-field="地点"]').inputValue(),'外部更新地点');
  await page.getByRole('button',{name:'纹章纠错',exact:true}).click();
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();
  const beforeDrag=await mask.boundingBox(),titleRect=await mask.locator('.xshd-gm-title').boundingBox();
  await page.mouse.move(titleRect.x+30,titleRect.y+10);await page.mouse.down();
  await page.mouse.move(titleRect.x+80,titleRect.y+40);await page.mouse.up();
  const afterDrag=await mask.boundingBox();assert(afterDrag.x>=beforeDrag.x+40);
  await page.mouse.move(titleRect.x+100,titleRect.y+60);
  assert.equal((await mask.boundingBox()).x,afterDrag.x,'松手后不得继续拖动');
  await mask.getByTitle('关闭面板',{exact:true}).click();
  assert.equal(await mask.isVisible(),false);
  // 新HUD iframe接入，重复渲染只保留一个齿轮，纹章气泡不再引用未定义变量。
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='hud-new';document.body.appendChild(f);});
  const fresh=page.frames()[1];await fresh.evaluate(code=>(0,eval)(code),core+'\n'+hud);
  await page.evaluate(raw=>{XsdHUD.mount(document.querySelector('#hud'),raw,1);XsdHUD.mount(document.querySelector('#hud'),raw,1);},raw);
  assert.equal(await page.locator('[data-xsd-settings]').count(),1);
  const relic=page.locator('.xh-relic').first();assert.equal(await relic.count(),1);
  await relic.hover();await page.waitForSelector('.xh-relic-popover');
  await page.getByRole('button',{name:'GM控制面板',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const size=await page.locator('[data-xsd-settings]').boundingBox();assert(size.width>=36&&size.height>=36);
  await dialog.getByLabel('主线事实',{exact:true}).selectOption('已抵达天溪');
  await dialog.getByRole('button',{name:'预览改动',exact:true}).click();
  const count=await page.evaluate(()=>calls);
  await page.evaluate(()=>{ctx.chatId='different';});
  await dialog.getByRole('button',{name:'确认应用',exact:true}).click();
  assert.equal(await page.evaluate(()=>calls),count,'切聊天后旧预览不得写入');
  await page.evaluate(()=>__xsdCorrection.onChatChanged());assert.equal(await dialog.count(),0);
  await page.evaluate(()=>xsdGM.open());
  await mask.locator('[data-field="地点"]').fill('旧表单不能覆盖新楼');
  const beforeOldForm=await page.evaluate(()=>calls);
  await page.evaluate(()=>ctx.chat.push({}));
  await mask.getByRole('button',{name:'💾 保存并生效',exact:true}).click();
  assert.equal(await page.evaluate(()=>calls),beforeOldForm,'原GM新楼变化后拒绝旧表单');
  await page.evaluate(()=>__xsdCorrection.onChatChanged());assert.equal(await mask.isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({scope:'实际GM/HUD＋4.11.3同步updater最小宿主；非酒馆真机',passed:['状态栏⚙️直接入口','个人段位交还自动选项','创建脚本iframe销毁后预览/应用/重新读取/撤销/关闭','API重新注册即时取新接口','完整GM销毁iframe后保存/读取/关闭','HUD重载与齿轮幂等','实际纹章悬停气泡无relObj异常','390px无横溢出/36px入口','跨聊天拒绝旧预览/原GM拒绝旧楼表单'],pageErrors:errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
