/* 身份：gpt 下级复核。旧完整协调片段作oracle，不依照新实现重写选择算法。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict');
const HERE=path.resolve(__dirname,'..'),CAND=path.join(HERE,'候选源码'),FIX=path.join(__dirname,'fixtures');
const sources=JSON.parse(fs.readFileSync(path.join(FIX,'来源.json')));
function fixture(name){const row=sources.files.find(x=>x.file===name),b=fs.readFileSync(path.join(FIX,name));assert(row);assert.equal(row.sourceCommit,'064d67bc3bd8376f722bf050ca92a96d1aabef14');assert.equal(b.length,row.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),row.sha256);return b.toString();}
const legacyBlock=fixture('time-basis-block.064d67.js');
const calendarSource=fixture('calendar-core.064d67.js')+'\n'+fixture('calendar-adapter.064d67.js');
const newCore=fs.readFileSync(path.join(CAND,'src/state-machine/utils/time-basis-core.js'),'utf8');
const newAdapter=fs.readFileSync(path.join(CAND,'src/state-machine/utils/time-basis.js'),'utf8');
const newApply=fs.readFileSync(path.join(CAND,'src/state-machine/rules/apply-status.js'),'utf8');
const a=newApply.indexOf('      const basisResult = resolveCalendarBasis(sdNow);');
const b=newApply.indexOf('      const curBaseM = basis;',a)+'      const curBaseM = basis;'.length;
assert(a>=0&&b>a,'候选时间基准完整接入块存在');
const newBlock=newApply.slice(a,b);
function runtime(block,extra=''){
 const io={opening:'',throwHost:false,reads:[],logs:[],warnings:[]};
 const box={TAG:'[test]',console:{log:(...x)=>io.logs.push(x),warn:(...x)=>io.warnings.push(x)},messageText:id=>{io.reads.push(id);if(io.throwHost)throw Error('首楼宿主异常');return io.opening;}};
 vm.createContext(box);
 const fn=vm.runInContext(calendarSource+'\n'+extra+'\n(function(sdNow,messageId,patch,text){'+block+'\nreturn {basis,curBaseM,patch};})',box);
 return {io,fn};
}
const old=runtime(legacyBlock),next=runtime(newBlock,newCore+'\n'+newAdapter);
function invoke(r,sd,{opening='',throwHost=false,body='当前时点：仙盟历1579年正月初一；天溪城兽潮正在发生',floor=5,patch={保留字段:1}}={}){
 Object.assign(r.io,{opening,throwHost,reads:[],logs:[],warnings:[]});
 let output,error;try{output=structuredClone(r.fn(sd,floor,structuredClone(patch),body));}catch(e){error={name:e.name,message:e.message};}
 return {output,error,reads:structuredClone(r.io.reads),logs:structuredClone(r.io.logs),warnings:structuredClone(r.io.warnings)};
}
let comparisons=0;
function diff(sd,opt){comparisons++;const before=structuredClone(sd),x=invoke(old,sd,opt),y=invoke(next,sd,opt);assert.deepEqual(y,x,require('node:util').inspect({sd,opt},{depth:2}));assert.deepEqual(sd,before);return y;}
const values=[undefined,null,'',0,-0,-1,18938.2,NaN,Infinity,-Infinity,'0','18938.2','bad',false,true];
const identities=['赵无忧','焚欲殿主','浊龙殿主','欢喜殿主','魂欢殿主','自设','',undefined,'未知身份'];

test('历基准/五身份/自设/空未知/初始时点数值矩阵：结果、patch、日志和首楼读取一致',()=>{
 for(const basis of values)for(const identity of identities)for(const initial of values){
  diff(Object.freeze({历基准:basis,身份:identity,初始时点:initial}),{opening:'前文未来：仙盟历1580年正月初一\n当前时点：仙盟历1579年六月初七\n后文未来：仙盟历1590年腊月三十'});
 }
});
test('首楼唯一当前时点行、合法初七/跨年、缺失/31日/多行边界保持旧行为',()=>{
 const openings=['当前时点：仙盟历1579年六月初七','当前时点：仙盟历1578年十二月三十','当前时点：仙盟历1579年正月初一','当前时点：仙盟历1579年六月31日','当前时点：仙盟历1579年六月卅一','当前时点：仙盟历1579年13月初一','当前时点：仙盟历1579年六月初七\n当前时点：仙盟历1578年三月初三','仙盟历1579年六月初七','当前时点：','',null,0,'当前时点：仙盟历0000年正月初一'];
 for(const opening of openings)for(const initial of values)for(const identity of ['自设','未知身份',''])diff({身份:identity,初始时点:initial},{opening});
 const got=diff({身份:'自设'},{opening:openings[0]});
 assert.equal(got.output.patch.初始时点,1579*12+5+6/30);assert.equal(got.output.patch.历基准,got.output.patch.初始时点);assert.deepEqual(got.reads,[1]);
 const duplicate=diff({身份:'自设'},{opening:openings[6]});assert(!Object.hasOwn(duplicate.output.patch,'初始时点'));
});
test('不必要时不读首楼；宿主抛错按共享默认；楼号与先前patch保持',()=>{
 for(const basis of values)for(const identity of identities)for(const initial of [undefined,0,18938.2,NaN,Infinity]){
  for(const floor of [0,5,'5'])diff({历基准:basis,身份:identity,初始时点:initial},{throwHost:true,floor,patch:{保留字段:1,初始时点:7,历基准:8}});
 }
 assert.deepEqual(diff({历基准:Infinity},{throwHost:true}).reads,[]);
 assert.deepEqual(diff({身份:'魂欢殿主'},{throwHost:true}).reads,[]);
 assert.deepEqual(diff({身份:'自设',初始时点:18938.2},{throwHost:true}).reads,[]);
 assert.deepEqual(diff({身份:'自设'},{throwHost:true}).reads,[1]);
});
test('当前AI正文的未来日期与菜单多日期均不参与时间基准',()=>{
 for(const sd of [{身份:'自设'},{身份:'赵无忧'},{身份:'自设',初始时点:18938.2},{身份:'自设',历基准:18938.2}]){
  const opts={opening:'当前时点：仙盟历1579年六月初七'};
  const baseline=diff(sd,{...opts,body:''});
  for(const body of ['仙盟历1577年七月初一；1578年八月初一；1579年正月初一','当前时点：仙盟历1599年六月初七','<Status_block><仙盟历>1599.06</仙盟历></Status_block>'])assert.deepEqual(diff(sd,{...opts,body}),baseline);
 }
});
test('纯核和Node入口无宿主独立加载；选择返回不修改输入，接口冻结',()=>{
 const s={};for(const name of ['console','window','document','getVariables','messageText','localStorage'])Object.defineProperty(s,name,{get(){throw Error('不得读取宿主 '+name);}});
 vm.createContext(s);
 const api=vm.runInContext(fixture('calendar-core.064d67.js')+'\n'+newCore+'\ncreateXsdTimeBasis(createXsdCalendar());',s);
 const offline=require('../候选源码/src/state-machine/utils/time-basis.cjs');assert(Object.isFrozen(api));assert(Object.isFrozen(offline));
 for(const basis of values)for(const identity of identities)for(const initial of [undefined,0,18938.2,NaN,Infinity]){
  const input=Object.freeze({storedBasis:basis,identity,initialTime:initial,openingLine:'当前时点：仙盟历1579年六月初七'}),before=structuredClone(input);
  assert.equal(api.needsOpening(input),offline.needsOpening(input));assert.deepEqual(structuredClone(api.select(input)),structuredClone(offline.select(input)));assert.deepEqual(input,before);
 }
 const stripped=newCore.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');assert(!/\b(console|window|document|getVariables|messageText|writeStat|localStorage|fetch|require)\b/.test(stripped));
});
test.after(()=>process.stdout.write('Time basis differential calls: '+comparisons+'; all use bundled fixed-commit oracle\n'));
