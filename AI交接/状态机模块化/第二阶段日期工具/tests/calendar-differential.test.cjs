/* 身份：gpt 下级复核。固定旧提交实际实现作oracle，差分覆盖而非重写预期算法。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os');
const {execFileSync,spawnSync}=require('node:child_process'),test=require('node:test'),assert=require('node:assert/strict');
const HERE=path.resolve(__dirname,'..'),REPO=path.resolve(HERE,'../../..'),CAND=path.join(HERE,'候选源码');
const REF='f6655f859092fe7ff60204574b3117bec09155ef';
const git=p=>execFileSync('git',['show',REF+':'+p],{cwd:REPO,maxBuffer:5*1024*1024}).toString();
const fixtureRoot=path.join(__dirname,'fixtures'),fixtureManifest=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'来源.json')));
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
function fixture(name){const info=fixtureManifest.files.find(f=>f.file===name),b=fs.readFileSync(path.join(fixtureRoot,name));assert(info);assert.equal(info.sourceCommit,REF);assert.equal(hash(b),info.sha256);assert.equal(b.length,info.bytes);return b.toString();}
const oldSource=fixture('calendar-legacy.f6655f8.js');
const coreSource=fs.readFileSync(path.join(CAND,'src/state-machine/utils/calendar-core.js'),'utf8');
const adapterSource=fs.readFileSync(path.join(CAND,'src/state-machine/utils/calendar.js'),'utf8');
const names=['nextAcc','cnNum','pickTimepointLine','parseXianmengFromText','fmtXianmengDay','parseLishi','fmtXianmeng','ymToMonths','monthsToYm'];
function context(source){const warnings=[],s={console:{warn:(...args)=>warnings.push(args)}};vm.createContext(s);const api=vm.runInContext(source+'\n({'+names.join(',')+'})',s);return {api,warnings};}
const old=context(oldSource),next=context(coreSource+'\n'+adapterSource),core=require('../候选源码/src/state-machine/utils/calendar.cjs');
function invoke(which,name,args){which.warnings.length=0;let value,error;try{value=structuredClone(which.api[name](...args));}catch(e){error={name:e.name,message:e.message};}return {value,error,warnings:structuredClone(which.warnings)};}
let comparisonCount=0;
function diff(name,args){comparisonCount++;assert.deepEqual(invoke(next,name,args),invoke(old,name,args),name+' '+require('node:util').inspect(args,{depth:2}));}
const VALUES=[undefined,null,'',0,-0,-3,1,0.1,12,NaN,Infinity,-Infinity,'0','-3','1.02','garbage',false,true];

test('九个既有调用函数保持旧输出/异常和警告（数值输入矩阵）',()=>{
 for(const name of names.filter(x=>x!=='nextAcc'))for(const v of VALUES)diff(name,[v]);
 for(const ym of VALUES)for(const day of VALUES)diff('fmtXianmengDay',[ym,day]);
});
test('中文日/月、日期缺失与非法边界保持，不擅自改旧解析规则',()=>{
 const nums=['初一','初七','三十','卅一','廿九','冬','正','腊','十一','二十一','三十一','两','零','〇',' 06 ','一百'];for(const n of nums)diff('cnNum',[n]);
 const dates=['仙盟历 1579 年 六月初七','仙盟历1578年三月初三','仙盟历1578年十二月三十','仙盟历1579年正月初一','仙盟历1579年冬月廿九','仙盟历1579年腊月三十','仙盟历1579年六月卅一','仙盟历1579年13月初一','仙盟历1579年0月初一','仙盟历1579年六月0日','仙盟历1579年六月31日','仙盟历1579年六月','没有日期','仙盟历1577年七月初一；仙盟历1579年六月初七'];
 for(const d of dates)diff('parseXianmengFromText',[d]);assert.deepEqual(structuredClone(core.parseXianmengFromText(dates[0])),{ym:1579.06,day:7});assert.equal(core.parseXianmengFromText('仙盟历1579年六月卅一'),null);
 for(const s of ['当前时点：仙盟历1579年六月初七','前文\n当前时点: 六月初七\n后文','当前时点：一\n当前时点：二','当前时点：','无时点'])diff('pickTimepointLine',[s]);
});
test('历时计划/倒计时/已过转场以及常规词汇差分',()=>{
 for(const s of ['—','无','一日','三天','十一日','十五天','一个时辰','半个时辰','半炷香','一夜','半年','一年','十三个月','2个月','一个月','数个月','三日已过，我们启程','历经半年闭关','距启程3日','还有两日','师尊说三日后启程','计划一个月后出发','预定于一年后赴会','定于三日后','拟于两日后','约于五月启程','已经过一月，明日再启程','一天\n数月后'])diff('parseLishi',[s]);
});
test('nextAcc累计/回退/撤销/月份转换值矩阵：输出形状及警告原文一致',()=>{
 let cases=0;
 for(const a of VALUES)for(const m of VALUES)for(const same of [false,true])for(const transit of [false,true]){
  const sd={历时累计:a,时点加速:'0.5',最后处理楼号:same?5:4,本楼历时加速:'0.1'};diff('nextAcc',[sd,5,m,transit]);cases++;
 }assert.equal(cases,1296);
 for(const push of VALUES)for(const prev of VALUES)diff('nextAcc',[{历时累计:null,时点加速:push,最后处理楼号:9,本楼历时加速:prev},9,0.02,false]);
});
test('人工校历同楼返回形状、NaN/Infinity/负累计保留旧语义',()=>{
 for(const a of VALUES)for(const floor of [0,1,'1',undefined,null,'bad'])for(const manualFloor of [0,1,'1',undefined,null,'bad']){
  const sd={人工校历:{楼:manualFloor},历时累计:a,最后处理楼号:floor,本楼历时加速:1};diff('nextAcc',[sd,floor,12,true]);
 }
 const result=next.api.nextAcc({人工校历:{楼:1},历时累计:2},1,12,true);assert(!Object.hasOwn(result,'sameFloor'));assert.equal(result.adv,0);assert.equal(result.capM,0.1);
 for(const sd of [undefined,null,false,0,'',{人工校历:false},{人工校历:{楼:0}}])diff('nextAcc',[sd,0,0.02,false]);
});
test('纯核显式参数对应兼容层，输入不修改，无日志副作用',()=>{
 for(const a of VALUES)for(const months of VALUES){
  const input={accumulated:a,fallbackOffset:0.5,previousFloor:7,previousAdvance:0.02,manualLocked:false,manualFloor:undefined,floor:7,months,transit:false},before=structuredClone(input);
  const result=core.calculateAdvance(input),expected=old.api.nextAcc({历时累计:a,时点加速:0.5,最后处理楼号:7,本楼历时加速:0.02},7,months,false);
  assert.deepEqual(structuredClone(result),structuredClone(expected));assert.deepEqual(input,before);
 }
 const sd=Object.freeze({人工校历:Object.freeze({楼:8}),历时累计:2,时点加速:0.5,最后处理楼号:8,本楼历时加速:0.2});const before=structuredClone(sd);next.api.nextAcc(sd,8,1,false);assert.deepEqual(sd,before);
});
test('30日累计和同楼多次重算撤销保持旧精度',()=>{
 let oldSD={},newSD={};for(let i=1;i<=30;i++){
  const a=invoke(old,'nextAcc',[oldSD,i,old.api.parseLishi('一日'),false]),b=invoke(next,'nextAcc',[newSD,i,next.api.parseLishi('一日'),false]);assert.deepEqual(a,b);
  oldSD={历时累计:a.value.acc,最后处理楼号:i,本楼历时加速:a.value.adv};newSD={历时累计:b.value.acc,最后处理楼号:i,本楼历时加速:b.value.adv};
 }assert(Math.abs(newSD.历时累计-1)<1e-12);
 for(const months of [0.02,0.05,0,0.2,0.02])diff('nextAcc',[newSD,30,months,false]);
});
test('新hasTransit helper与旧完整表达式一致，400字边界保持',()=>{
 const regex=vm.runInNewContext(oldSource+'\nLISHI_TRANSIT_RE;',{console:{warn(){}}});
 const texts=[undefined,null,0,'','一个月','半年','计划一年后启程','闭关','普通正文','普通'.repeat(200)+'闭关','普'.repeat(397)+'闭关','普'.repeat(398)+'闭关','普'.repeat(399)+'闭关','普'.repeat(400)+'闭关','🙂'.repeat(199)+'闭关','🙂'.repeat(200)+'闭关'];
 for(const elapsed of texts)for(const body of texts)assert.equal(core.hasTransit(elapsed,body),regex.test(String(elapsed||'')+' '+String(body||'').slice(0,400)));
 assert.equal(core.hasTransit('','普'.repeat(398)+'闭关'),true);assert.equal(core.hasTransit('','普'.repeat(399)+'闭关'),false);
});
test('dayOfMonth helper与原模运算表达式一致，跨年/初七换算差分',()=>{
 for(const n of [...VALUES,18953.2,18959.999999999,18960,18960.033333333333,18960.2,-0.2,-1.2])assert(Object.is(core.dayOfMonth(n),1+Math.floor((((n%1)+1)%1)*30+1e-9)));
 for(const ym of [1578.12,1579.01,1579.06,1580.01]){diff('ymToMonths',[ym]);const n=old.api.ymToMonths(ym);for(const delta of [0,1/30,0.2,1,12])diff('monthsToYm',[n+delta]);}
});
test('纯核可无宿主加载，console/API/DOM访问陷阱未触发，接口冻结',()=>{
 const s={};for(const name of ['console','window','document','getVariables','SillyTavern','localStorage'])Object.defineProperty(s,name,{get(){throw Error('禁止宿主读取 '+name);}});
 vm.createContext(s);const api=vm.runInContext(coreSource+'\ncreateXsdCalendar();',s);assert(Object.isFrozen(api));assert(Object.isFrozen(api.caps));
 api.calculateAdvance({months:Infinity});api.parseLishi('历经半年');api.parseXianmengFromText('仙盟历1579年六月初七');api.fmtXianmengDay(1579.06,7);api.hasTransit('一月','');
 const source=coreSource.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');assert(!/\b(console|window|document|getVariables|insertOrAssignVariables|localStorage|require|fetch|setTimeout)\b/.test(source));
});
test('Node离线入口加载同一纯核，core→adapter顺序且离线入口不入卡',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(CAND,'src/state-machine/modules.json')));const paths=manifest.modules.map(m=>m.path);assert.equal(paths.length,28);assert.equal(paths.indexOf('utils/calendar.js'),paths.indexOf('utils/calendar-core.js')+1);assert(!paths.includes('utils/calendar.cjs'));
 assert.equal(manifest.baseline.sha256,'7cd5d1cb318d8b7a1f2795b98e20f9f53dad7cb7c9cf085a080f8a6395515830');
});
test('原时钟门禁从const results开始逐字节保留，仅加载段变化',()=>{
 const oldGate=fixture('clock-gate-legacy.f6655f8.mjs'),nextGate=fs.readFileSync(path.join(CAND,'tools/checks/_chk_clock_acc.mjs'),'utf8');
 const marker='const results = [];';assert.equal(nextGate.slice(nextGate.indexOf(marker)),oldGate.slice(oldGate.indexOf(marker)));
});
const GATES=['_chk_deflower_impersonation.mjs','_chk_relic_progress.mjs','_chk_derive_ledger.mjs','_chk_tick_preflight.mjs','_chk_clock_acc.mjs','_chk_defect_four.mjs','_chk_anchor_gate.mjs','_chk_freefield_gate.mjs','_chk_mingqi_prereq.mjs','_chk_form_gate.mjs'];
for(const name of GATES)test('新生成物执行相关原定向门禁：'+name,()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'xsd-calendar-gate-'));try{
  fs.cpSync(CAND,tmp,{recursive:true});const archive=path.join(REPO,'AI交接/下级更新/2026-10-10-状态机模块化基线');fs.cpSync(path.join(archive,'tools'),path.join(tmp,'tools'),{recursive:true});
  fs.copyFileSync(path.join(CAND,'tools/checks/_chk_clock_acc.mjs'),path.join(tmp,'tools/checks/_chk_clock_acc.mjs'));
  for(const p of ['卡片脚本/状态栏面板.js','src/correction-runtime.js']){const dest=path.join(tmp,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,git(p));}
  const r=spawnSync(process.execPath,[path.join(tmp,'tools/checks',name)],{cwd:tmp,encoding:'utf8',timeout:20000});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test.after(()=>process.stdout.write('Legacy function differential calls: '+comparisonCount+' (plus pure-core/helper assertions)\n'));
