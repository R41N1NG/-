"use strict";
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const {buildCollegePreview}=require('./build/college-preview');
const {createPreview}=require('./build/college-preview-model');
const {browserSession}=require('./browser-session.cjs');
async function main(){
 const file=buildCollegePreview().file,out=path.dirname(file);
 const server=require('node:http').createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const p=createPreview(null,{period:3,seed:'college-preview-2'});p.move('school_gate_b');p.execute(p.request('start','daily.tailing'));
 const original=p.save(),b=await browserSession();let checks=0;
 try{
  for(const width of [1100,390]){
   await b.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:2,mobile:false});
   await b.send('Page.navigate',{url});await b.delay(700);
   for(const [value,dc,name] of [[115,0,'体力充足'],[57,1,'气喘'],[28,3,'疲惫'],[0,0,'体力耗尽']]){
    const s=JSON.parse(JSON.stringify(original));s.ledgerState.stamina=value;
    await b.evaluate(`localStorage.setItem('wx_college_schedule_preview_v1',${JSON.stringify(JSON.stringify(s))});location.reload();true`);
    for(let i=0;i<100;i++){await b.delay(100);if(await b.evaluate(`document.readyState==='complete'&&!!window.__collegePreview?.ready&&window.__collegePreview.snapshot().player.stamina===${value}`))break;}
    assert.equal(await b.evaluate(`document.getElementById('collegeTailStamina').textContent.includes(${JSON.stringify(name)})`),true);checks++;
    assert.equal(await b.evaluate(`document.getElementById('collegeFollow').disabled`),value<4);checks++;
    assert.equal(await b.evaluate(`document.getElementById('staminaBox').dataset.tip.includes(${JSON.stringify(dc?'跟随 DC +'+dc:name)})`),true);checks++;
    assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true);checks++;
    await b.evaluate("document.getElementById('collegeTailScreen').scrollIntoView({block:'start'});true");await b.delay(250);
    if(value===28||value===0){const img=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,`stamina-${value===0?'empty':'fatigue'}-${width}.png`),Buffer.from(img.data,'base64'));}
   }
  }
  console.log(`stamina browser: ${checks} checks passed`);
 }finally{await b.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
