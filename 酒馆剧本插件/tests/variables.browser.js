'use strict';
const http=require('node:http'),fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{fixture}=require('./helpers');
const content=JSON.parse(fs.readFileSync('branch_story_tavern_helper_import.json')).content,requests=[],errors=[];
const original='任务开始时，警觉为 **0**，范围 0 至 100。\n调查完成增加2。达到60时封锁入口。';
const variable={id:'alertness',title:'警觉',type:'integer',default:0,min:0,max:100,evidence:'任务开始时，警觉为 **0**，范围 0 至 100。',bounds_evidence:'范围 0 至 100'};
const raw={title:'警觉度测试',collections:[{id:'a',title:'现场线索',evidence:'调查完成增加2。',description:'在调查中找到的线索。'}],variables:[{...variable,evidence:undefined}],nodes:[{id:'n1',title:'调查现场',source_span:{from:'s1',to:'s1'},guidance:'观察当前现场',result_ids:['a'],completion_criteria:'调查完成',completion_evidence:'调查完成增加2。',numeric_effects:[{operation:'add',variable:'alertness',value:2,evidence:'调查完成增加2。'}],routes:[{target:'n1',label:'继续调查',condition:{variable:{id:'alertness',op:'lt',value:60}},condition_evidence:'达到60时封锁入口。'}]}]};
const server=http.createServer(async(req,res)=>{
 if(req.url==='/plugin.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.end(content);}
 if(req.url==='/frame')return res.end('<!doctype html><script src="/plugin.js"></script>');
 if(req.url==='/v1/chat/completions'){
  let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(JSON.parse(body).messages[1].content);requests.push(input);
  const value=input.operation==='repair_variables'?{complete:true,variable_evidence:[{...variable,default:99,max:999}]}:raw;
  res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]}));
 }
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="send_form"><textarea id="send_textarea"></textarea></div><script>const C={clone:v=>JSON.parse(JSON.stringify(v))};const fixture=${fixture.toString().replace('host: new Host(root)','host: null')};window.testHost=fixture();window.TavernHelper=testHost.root;</script><iframe src="/frame" style="display:none"></iframe>`);
});
const evaluate=(page,fn,arg)=>page.evaluate(({source,arg})=>new Function('e','arg','return ('+source+')(e,arg)')(document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine,arg),{source:fn.toString(),arg});
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BSE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [1366,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());const start=requests.length;
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__branch_story_plugin__?.engine.chat);
  await evaluate(page,e=>e.updateSettings({profile:{base_url:location.origin+'/v1',model:'mock',auto_partition:false}}));await page.locator('.launcher').click();await page.locator('nav [data-tab="analysis"]').click();await page.locator('[name="analysis_text"]').fill(original);
  await page.locator('[data-action="analysis-run"]').click();await page.waitForFunction(()=>!!document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.analysisDraft);
  assert.equal(requests.length-start,2);assert.equal(requests.at(-1).operation,'repair_variables');assert.equal(await evaluate(page,e=>e.analysisDraft.project.variables[0].default),0);assert.equal(await evaluate(page,e=>e.analysisDraft.project.variables[0].max),100);assert.equal(await evaluate(page,e=>e.error),'');
  // Load the original failed reply; the UI must offer a repair without reanalysing.
  const repairId=await evaluate(page,e=>e.rawAnalysis.replies[1].id);await page.locator('.section-nav button').filter({hasText:'恢复后台结果'}).click();assert((await page.locator('[name="analysis_saved_id"]').innerText()).includes('变量依据补修'));await page.locator('[name="analysis_saved_id"]').selectOption(repairId);await page.locator('[data-action="analysis-raw-load"]').click();await page.locator('.repair-variables > summary').click();assert((await page.locator('.repair-variables').innerText()).includes('alertness'));
  const reply=await evaluate(page,e=>e.rawAnalysis.replies[0].id);await page.locator('.section-nav button').filter({hasText:'恢复后台结果'}).click();await page.locator('[name="analysis_saved_id"]').selectOption(reply);await page.locator('[data-action="analysis-raw-load"]').click();const before=requests.length;
  await page.locator('[data-action="analysis-restore"]').click();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.error.includes('evidence'));assert.equal(requests.length,before);
  await page.locator('[data-action="analysis-repair"]').click();await page.waitForFunction(()=>!document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.busy && !document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.error);
  assert.equal(requests.length,before+1);assert.equal(requests.at(-1).operation,'repair_variables');assert.equal(await evaluate(page,e=>e.rawAnalysis.replies.length),3);assert(await page.locator('[data-action="analysis-convert"]').isVisible());
  await page.locator('[data-action="analysis-convert"]').click();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.__branch_story_plugin__.engine.project.title==='警觉度测试');const converted=requests.length;assert.equal(await evaluate(page,e=>e.state.variables.alertness),0);await evaluate(page,e=>e.complete());assert.equal(await evaluate(page,e=>e.state.variables.alertness),2);assert.deepEqual(await evaluate(page,e=>e.state.collected_ids),['a']);assert.equal(await evaluate(page,e=>e.project.collections[0].description),'');assert.equal(requests.length,converted);
  await page.screenshot({path:'/tmp/v145-variables-'+width+'.png'});assert(await page.locator('main').evaluate(el=>el.scrollWidth-el.clientWidth)<=2);await context.close();console.log(width+'px：integer本地兼容/可选说明留空→变量缺依据定向补修→原失败回复本地报错/单独修复→转化→本地数值结算，门槛/奖励保留通过');
 }assert.deepEqual(errors,[]);}finally{await browser.close();await new Promise(r=>server.close(r));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
