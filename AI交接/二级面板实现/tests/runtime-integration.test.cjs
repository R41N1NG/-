const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../候选源码');
const core=fs.readFileSync(path.join(ROOT,'src/correction-runtime.js'),'utf8');
const full=fs.readFileSync(path.join(ROOT,'卡片脚本/状态机.js'),'utf8');
const cut=full.lastIndexOf('\nif (API.eventOn && EVENTS) {');assert(cut>0);
function sandbox() {
 const stores={chat:{stat_data:{}},message:{stat_data:{}}},logs=[];
 const factory=require('../候选源码/src/correction-runtime.js'),helper=factory({});
 const api={getVariables:o=>helper.clone(stores[o.type]),insertOrAssignVariables:(p,o)=>{stores[o.type]=helper.merge(stores[o.type],p);return true;},getChatMessages:()=>[{message:'',message_id:1}],eventOn:()=>({stop(){}})};
 const context={chatId:'integration',chat:[{},{}],name1:'玩家',name2:'赵无忧'};
 const s={...api,console:{log(){},warn(){},error(...a){logs.push(a);},info(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},document:{body:{},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){},createElement:()=>({style:{},setAttribute(){},appendChild(){}}),head:{appendChild(){}}},SillyTavern:{getContext:()=>context},TavernHelper:api,Date,Math,JSON,Number,String,Array,Object,RegExp,Error,isFinite,isNaN,parseInt,parseFloat,Promise,Set,Map};
 s.window=s;s.parent=s;s.top=s;s.globalThis=s;
 vm.createContext(s);vm.runInContext(core+'\n'+full.slice(0,cut),s,{filename:'候选实际状态机'});
 return {s,stores,helper,context};
}
test('候选实际deriveRelicClosure尊重人工false和true',()=>{
 const {s}=sandbox(),f='般若菩提菊成形',records={[JSON.stringify(['known',f])]:{path:['known',f],value:false}};
 const out=s.deriveRelicClosure({known:{楚灵夜处女丧失:true,楚灵夜后窍开发:true,[f]:false},人工纠错:{覆盖:records},ledger:{[f]:{来源:[{类型:'人工'}]}}});
 assert(!out.news.includes(f));records[JSON.stringify(['known',f])].value=true;
 const trueOut=s.deriveRelicClosure({known:{[f]:true},人工纠错:{覆盖:records},ledger:{[f]:{来源:[]}}});assert(!trueOut.撤销.includes(f));
});
test('候选依赖使用有效父字段，关闭二阶段不新增一阶段',()=>{
 const {s}=sandbox(),f='烟霞灵乳二阶段';
 const out=s.deriveRelicClosure({known:{[f]:false},news:[f],人工纠错:{覆盖:{[JSON.stringify(['known',f])]:{path:['known',f],value:false}}},出场实证:{柳含烟:{ok:true,证据:'实证'}}});assert(!out.news.includes(f));assert(!out.news.includes('烟霞灵乳一阶段'));
});
test('候选日期校正同楼不重算，下一楼正常累加',()=>{
 const {s}=sandbox(),sd={历时累计:2.5,本楼历时加速:0,人工校历:{楼:1}};
 assert.equal(s.nextAcc(sd,1,1/30,false).acc,2.5);assert(s.nextAcc(sd,2,1/30,false).acc>2.5);
});
test('候选writeStat实际走共享服务，双方都回读',async()=>{
 const {s,stores}=sandbox();stores.chat.stat_data={身份:'自设',仙盟历:1579.03,known:{}};stores.message.stat_data={...stores.chat.stat_data};
 const p=await s.__xsdCorrection.preview(s.TavernHelper,{relic:'boruoputiju',lit:false});await s.__xsdCorrection.save(s.TavernHelper,p);
 const r=await s.writeStat({known:{般若菩提菊成形:true}},'实际函数测试');assert(r.ok);assert.equal(stores.message.stat_data.known.般若菩提菊成形,false);
});
test('候选完整applyStatusToVars缺状态块不改日期',async()=>{
 const {s,stores,helper}=sandbox();const original={身份:'自设',仙盟历:1579.061,仙盟历文:'1579年6月7日',历基准:18953.2,历时累计:0,段位:3,known:{}};
 stores.chat.stat_data=helper.clone(original);stores.message.stat_data=helper.clone(original);
 await s.applyStatusToVars('普通正文，没有状态栏。',1);
 for(const f of ['仙盟历','仙盟历文','历基准','历时累计'])assert.equal(stores.chat.stat_data[f],original[f]);
});
test('候选panel模板除三资源占位外可编译，实际状态读取覆盖接入存在',()=>{
 const tpl=fs.readFileSync(path.join(ROOT,'卡片脚本/_src/状态栏面板.模板.js'),'utf8');
 const rendered=tpl.replace(/\/\*__XSD_(?:CSS|SKEL|FONT)_B64__\*\//g,"''");new vm.Script(core+'\n'+rendered);
 assert(tpl.includes('service.effective(stat)'));assert(tpl.includes('xsdRelicDisplayState'));
});
