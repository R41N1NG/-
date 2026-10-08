const test=require('node:test'),assert=require('node:assert/strict'),factory=require('../候选源码/src/correction-runtime.js');
function setup(initial={}) {
 const service=factory({}),c={chatId:'A',chat:[{},{}]},layers={chat:{stat_data:initial},message:{stat_data:service.clone(initial)}};
 let fail=null;
 const api={context:()=>c,getVariables:o=>service.clone(layers[o.type]),insertOrAssignVariables:async(payload,o)=>{
  if(fail&&fail(payload,o))throw Error('故障注入');layers[o.type]=service.merge(layers[o.type],payload);return true;
 }};
 return {service,c,layers,api,setFailure:f=>fail=f};
}
const id='boruoputiju',name='般若菩提菊',form=name+'成形';
const valid=()=>({身份:'自设',仙盟历:1579.03,段位:3,历基准:18945,历时累计:0,known:{}});
async function apply(x,intent){const p=await x.service.preview(x.api,intent);await x.service.save(x.api,p);return p;}
test('人工灭后自动补真被挡；历史阶段保留',async()=>{
 const x=setup({...valid(),known:{[form]:true,[name+'一阶段']:true}});
 await apply(x,{relic:id,lit:false});
 const r=await x.service.write(x.api,{known:{[form]:true}},false);assert(r.ok);
 assert.equal(x.layers.chat.stat_data.known[form],false);assert.equal(x.layers.message.stat_data.known[name+'一阶段'],true);
});
test('人工true不被自动撤销',async()=>{const x=setup(valid());await apply(x,{relic:id,lit:true});await x.service.write(x.api,{known:{[form]:false}},false);assert.equal(x.layers.chat.stat_data.known[form],true);});
test('阶段降级清高阶，低阶历史前缀保留',async()=>{const x=setup(valid());await apply(x,{relic:id,stage:4});await apply(x,{relic:id,stage:2});const k=x.layers.chat.stat_data.known;assert.equal(k[name+'一阶段'],true);assert.equal(k[name+'二阶段'],true);assert.equal(k[name+'三阶段'],false);assert.equal(k[name+'四阶段'],false);});
test('缺正文四阶拒绝',async()=>{const x=setup(valid());await assert.rejects(x.service.preview(x.api,{relic:'lingxitongxin',stage:4}),/未提供/);});
test('灵犀成形精确映射，未虚构穴成形',async()=>{const x=setup(valid());await apply(x,{relic:'lingxitongxin',lit:true});assert.equal(x.layers.chat.stat_data.known.灵犀同心成形,true);assert(!('灵犀同心穴成形' in x.layers.chat.stat_data.known));});
test('烟霞熄灭通过阶段否定，不新造字段',async()=>{const x=setup({...valid(),known:{烟霞灵乳二阶段:true}});await apply(x,{relic:'yanxialingru',lit:false});assert.equal(x.layers.chat.stat_data.known.烟霞灵乳二阶段,false);assert(!('烟霞灵乳成形' in x.layers.chat.stat_data.known));});
test('归属清空不会被NPC自动补回',async()=>{const x=setup(valid());await apply(x,{relic:id,owner:null});await x.service.write(x.api,{名器归属:{[name]:'阎雷子'}},false);assert.equal(x.layers.chat.stat_data.名器归属[name],null);assert.equal(x.layers.chat.stat_data.名器归属来源[name].由脚本写,false);});
test('强制显示反色不修改归属，不点亮灰纹',async()=>{const x=setup({...valid(),名器归属:{[name]:'自设'}});await apply(x,{relic:id,color:'inverted'});const sd=x.layers.chat.stat_data;assert.equal(sd.名器归属[name],'自设');assert.equal(x.service.visual(sd,id,'self'),'other');assert.equal(x.service.visual(sd,id,'none'),'none');});
test('无有效来源解除手工true回false；墓碑不复活',async()=>{const x=setup(valid());await apply(x,{relic:id,lit:true});await apply(x,{relic:id,lit:'auto'});assert.equal(x.layers.chat.stat_data.known[form],false);assert.equal(x.layers.chat.stat_data.人工纠错.覆盖[JSON.stringify(['known',form])],null);});
test('解除人工关闭有前置则重算自动成形',async()=>{const x=setup({...valid(),known:{楚灵夜处女丧失:true,楚灵夜后窍开发:true}});x.service.prerequisites[form]=['楚灵夜处女丧失','楚灵夜后窍开发'];await apply(x,{relic:id,lit:false});await apply(x,{relic:id,lit:'auto'});assert.equal(x.layers.chat.stat_data.known[form],true);});
test('不合法独立依赖不会让解除恢复true',async()=>{const x=setup({...valid(),派生账本:{烟霞灵乳一阶段:{来源:[{类型:'依赖',键:'烟霞灵乳二阶段成立'}]}},known:{烟霞灵乳二阶段:false}});await apply(x,{relic:'yanxialingru',stage:1});await apply(x,{relic:'yanxialingru',stage:'auto'});assert.equal(x.layers.chat.stat_data.known.烟霞灵乳一阶段,false);});
test('日期保持累计平移基准，自定义六月初七保持',async()=>{const x=setup({...valid(),历时累计:2.5});await apply(x,{date:'1579-6-7'});const sd=x.layers.chat.stat_data;assert.equal(sd.历时累计,2.5);assert.equal(sd.历基准+sd.历时累计,1579*12+5+6/30);assert.equal(sd.仙盟历,1579.061);assert.equal(sd.人工校历.楼,1);});
test('非法日期与早期未来事件被拒，未写盘',async()=>{const x=setup(valid());await assert.rejects(x.service.preview(x.api,{date:'1579-13-31'}));await assert.rejects(x.service.preview(x.api,{date:'1578-3-3',plot:{天溪城兽潮:true}}),/矛盾/);assert.equal(x.layers.chat.stat_data.仙盟历,1579.03);});
test('只允许主线白名单',async()=>{const x=setup(valid());await assert.rejects(x.service.preview(x.api,{plot:{任意字段:true}}),/白名单/);});
test('原型污染被拒',async()=>{const x=setup(valid());await assert.rejects(x.service.preview(x.api,JSON.parse('{"__proto__":{"污染":true}}')),/非法/);assert.equal({}.污染,undefined);});
test('单笔撤销完整覆盖和事实，日志在chat顶层',async()=>{const x=setup(valid());await apply(x,{relic:id,lit:true,owner:'自设',color:'inverted',date:'1579-6-7'});await x.service.undo(x.api);assert.equal(x.layers.chat.stat_data.known[form],null);assert.equal(x.layers.chat.stat_data.人工纠错.覆盖[JSON.stringify(['known',form])],null);assert.equal(x.layers.chat.stat_data.仙盟历,1579.03);assert.equal(x.layers.chat.xsd_correction_meta.log.length,0);assert(!x.layers.chat.stat_data.人工操作日志);});
test('相关键后续修改拒绝盲撤销',async()=>{const x=setup(valid());await apply(x,{relic:id,lit:true});x.layers.chat.stat_data.known[form]=false;x.layers.message.stat_data.known[form]=false;await assert.rejects(x.service.undo(x.api),/后续修改/);});
test('无关状态改变不被撤销覆盖',async()=>{const x=setup(valid());await apply(x,{relic:id,lit:true});await x.service.write(x.api,{地点:'新地点'},false);await x.service.undo(x.api);assert.equal(x.layers.chat.stat_data.地点,'新地点');});
test('预览后事实改变要求重新预览',async()=>{const x=setup(valid());const p=await x.service.preview(x.api,{relic:id,lit:true});await x.service.write(x.api,{known:{已抵达天溪:true}},false);await assert.rejects(x.service.save(x.api,p),/重新预览/);});
test('切聊天或最新楼变化不写入',async()=>{const x=setup(valid());const p=await x.service.preview(x.api,{relic:id,lit:true});x.c.chatId='B';await assert.rejects(x.service.save(x.api,p),/变化/);x.c.chatId='A';x.c.chat.push({});await assert.rejects(x.service.save(x.api,p),/变化/);});
test('epoch捕获往返切聊天',async()=>{const x=setup(valid());const p=await x.service.preview(x.api,{relic:id,lit:true});x.service.onChatChanged();await assert.rejects(x.service.save(x.api,p),/变化/);});
test('双击同一预览至多提交一笔',async()=>{const x=setup(valid());const p=await x.service.preview(x.api,{relic:id,lit:true});const r=await Promise.allSettled([x.service.save(x.api,p),x.service.save(x.api,p)]);assert.equal(r.filter(v=>v.status==='fulfilled').length,1);assert.equal(x.layers.chat.xsd_correction_meta.log.length,1);});
test('消息层失败补偿chat，不动其他键',async()=>{const x=setup({...valid(),known:{[form]:false},地点:'原地点'});x.setFailure((p,o)=>o.type==='message'&&p.stat_data?.known?.[form]===true);await assert.rejects(apply(x,{relic:id,lit:true}),/补偿/);assert.equal(x.layers.chat.stat_data.known[form],false);assert.equal(x.layers.chat.stat_data.地点,'原地点');});
test('bool false返回是失败，不伪装通过',async()=>{const x=setup(valid());x.api.insertOrAssignVariables=()=>false;const r=await x.service.write(x.api,{段位:2},false);assert.equal(r.ok,false);});
test('没有覆盖时自动流程正常',async()=>{const x=setup(valid());const r=await x.service.write(x.api,{known:{[form]:true},段位:4},false);assert(r.ok);assert.equal(x.layers.chat.stat_data.known[form],true);assert.equal(x.layers.message.stat_data.段位,4);});
test('旧GM修改的已注册字段也登记人工锁',async()=>{const x=setup(valid());await x.service.write(x.api,{known:{[form]:false}},true);await x.service.write(x.api,{known:{[form]:true}},false);assert.equal(x.layers.chat.stat_data.known[form],false);});

test('全部保持时拒绝空操作',async()=>{const x=setup(valid());await assert.rejects(x.service.preview(x.api,{relic:id}),/请选择/);assert(!x.layers.chat.xsd_correction_meta);});

test('已污染多事实可逐项纠正，不阻塞无关纹章修复',async()=>{const x=setup({...valid(),仙盟历:1578.03,known:{南域大劫:true,天溪城兽潮:true}});await apply(x,{relic:id,lit:false});await apply(x,{plot:{天溪城兽潮:false}});await apply(x,{plot:{南域大劫:false}});assert.equal(x.layers.chat.stat_data.known.南域大劫,false);});

test('新聊天空变量层可初始化，不退回整层替换',async()=>{const x=setup({});x.api.getVariables=o=>Object.keys(x.layers[o.type].stat_data).length?x.service.clone(x.layers[o.type]):null;const r=await x.service.write(x.api,{身份:'自设',known:{极乐引入手:false}},false);assert(r.ok);assert.equal(x.layers.chat.stat_data.身份,'自设');});
