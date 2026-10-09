// 实际候选GM在iframe中执行，父文档与变量API为最小宿主；不是酒馆真机。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.XSD_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<html><body><iframe id="script"></iframe></body></html>');
 const root=path.resolve(__dirname,'../候选源码');
 await page.evaluate(()=>{
  window.stores={chat:{stat_data:{身份:'自设',仙盟历:1579.03,段位:3,历基准:18950,历时累计:0,known:{}}},message:{stat_data:{身份:'自设',仙盟历:1579.03,段位:3,历基准:18950,历时累计:0,known:{}}}};
  window.ctx={chatId:'browser',chat:[{},{}],name1:'玩家'};
  function merge(t,p){for(const [k,v]of Object.entries(p)){if(v&&typeof v==='object'&&!Array.isArray(v)){if(!t[k]||typeof t[k]!=='object')t[k]={};merge(t[k],v);}else t[k]=v;}return t;}
  window.SillyTavern={getContext:()=>window.ctx};
  window.TavernHelper={updateVariablesWith:(fn,o)=>{stores[o.type]=fn(structuredClone(stores[o.type]));return structuredClone(stores[o.type]);},getVariables:o=>structuredClone(stores[o.type]),insertOrAssignVariables:(p,o)=>{merge(stores[o.type],p);return true;},getChatMessages:()=>[],setChatMessages:()=>true};
 });
 const frame=page.frames()[1];
 await frame.evaluate(code=>{(0,eval)(code);},fs.readFileSync(path.join(root,'src/correction-runtime.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'卡片脚本/GM修改器.js'),'utf8'));
 await page.evaluate(()=>{var iframe=document.createElement('iframe');iframe.id='second-script';document.body.appendChild(iframe);});
 const second=page.frames()[2];await second.evaluate(code=>(0,eval)(code),fs.readFileSync(path.join(root,'src/correction-runtime.js'),'utf8'));
 assert.equal(await second.evaluate(()=>window.__xsdCorrection===window.parent.__xsdCorrection),true);
 assert.equal(await frame.evaluate(()=>window.__xsdCorrection===window.parent.__xsdCorrection),true);
 await page.evaluate(()=>window.__xsdGM());
 await page.getByRole('button',{name:'纹章纠错',exact:true}).click();
 const dialog=page.locator('#xsd-correction-dialog');
 assert.equal(await dialog.count(),1,'实际GM点击应打开二级面板');
 await dialog.getByLabel('纹章',{exact:true}).selectOption('boruoputiju');
 await dialog.getByLabel('亮灭',{exact:true}).selectOption('false');
 await dialog.getByRole('button',{name:'预览改动',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#xsd-correction-dialog button:nth-child(2)')?.disabled).catch(()=>{});
 await dialog.getByRole('button',{name:'确认应用',exact:true}).click();
 await page.waitForFunction(()=>window.stores.chat.stat_data.known.般若菩提菊成形===false);
 assert.equal(await page.evaluate(()=>stores.message.stat_data.known.般若菩提菊成形),false);
 await dialog.getByRole('button',{name:'撤销最近一次',exact:true}).click();
 await page.waitForFunction(()=>window.stores.chat.xsd_correction_meta.log.length===0);
 await dialog.getByLabel('纹章',{exact:true}).selectOption('lingxitongxin');
 await page.waitForFunction(()=>document.querySelector('#xsd-correction-dialog select[aria-label="阶段"] option[value="4"]').disabled);
 assert.equal(await dialog.getByLabel('阶段',{exact:true}).locator('option[value="4"]').evaluate(el=>el.disabled),true);
 await dialog.getByRole('button',{name:'关闭',exact:true}).click();
 await page.evaluate(()=>window.__xsdCorrectionOpen());await page.evaluate(()=>window.__xsdCorrectionOpen());
 assert.equal(await page.locator('#xsd-correction-dialog').count(),1);
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.evaluate(()=>{window.ctx.chatId='different';window.__xsdCorrection.onChatChanged();});
 assert.equal(await page.locator('#xsd-correction-dialog').count(),0);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({scope:'实际GM iframe＋最小宿主Chromium',passed:['两个iframe共享同一运行时','GM二级入口','预览/双层写入','单笔撤销','缺四阶段禁选','重开单节点','390px无横向溢出','切聊天关闭'],pageErrors:errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
