// 4.11.3 updateVariablesWith：同步get → updater → replace，源证据见修复说明。
const test=require('node:test'),assert=require('node:assert/strict'),factory=require('../候选源码/src/correction-runtime.js');
function fixture(sd={}) {
 const service=factory({}),ctx={chatId:'contract',chat:[{},{}]},stores={chat:{stat_data:service.clone(sd),无关键:'保留'},message:{stat_data:service.clone(sd)}};
 const calls=[];let mutate=()=>{};
 const api={context:()=>ctx,getVariables:o=>service.clone(stores[o.type]),updateVariablesWith:(updater,o)=>{
  // 真实助手从当前层取副本；同步回调；返回同一更新结果。
  mutate(o);const result=updater(service.clone(stores[o.type]));stores[o.type]=result;calls.push(o.type);return result;
 }};
 return {service,api,ctx,stores,calls,beforeWrite:fn=>{mutate=fn;}};
}
const base=()=>({身份:'自设',仙盟历:1579.03,known:{},段位:3});
test('深合并保留旧键顺序时，等值来源记录不误报回读失败',async()=>{
 const x=fixture({...base(),名器归属来源:{般若菩提菊:{来源:'旧',由脚本写:true,归属者:'甲'}}});
 // 同时验证无updater的深合并兼容路径：对象键顺序有别，值相同。
 delete x.api.updateVariablesWith;x.api.insertOrAssignVariables=(p,o)=>{x.stores[o.type]=x.service.merge(x.stores[o.type],p);};
 const r=await x.service.write(x.api,{名器归属来源:{般若菩提菊:{归属者:'乙',由脚本写:false,来源:'人工'}}},false);
 assert(r.ok,r.why);assert.equal(x.stores.message.stat_data.名器归属来源.般若菩提菊.归属者,'乙');
});
test('同步updater精确替换来源对象，保留其他名器/当前新增变量',async()=>{
 const x=fixture({...base(),名器归属来源:{般若菩提菊:{来源:'旧',过期标记:1},梅蕊穴:{来源:'保留'}}});
 x.beforeWrite(o=>{x.stores[o.type].其他实时键='调用瞬间新增';x.stores[o.type].stat_data.地点='最新地点';});
 const r=await x.service.write(x.api,{名器归属来源:{般若菩提菊:{来源:'新',由脚本写:false}}},false);
 assert(r.ok,r.why);
 for(const v of Object.values(x.stores)){assert.deepEqual(v.stat_data.名器归属来源.般若菩提菊,{来源:'新',由脚本写:false});assert.equal(v.stat_data.名器归属来源.梅蕊穴.来源,'保留');assert.equal(v.其他实时键,'调用瞬间新增');assert.equal(v.stat_data.地点,'最新地点');}
});
test('updater分支应用与撤销恢复整条人工记录，不残留事务字段',async()=>{
 const key=JSON.stringify(['known','般若菩提菊成形']);
 const x=fixture({...base(),known:{般若菩提菊成形:false},人工纠错:{chatId:'contract',覆盖:{[key]:{path:['known','般若菩提菊成形'],value:false,旧标记:1}},纹章显示:{}}});
 const p=await x.service.preview(x.api,{relic:'boruoputiju',lit:true});await x.service.save(x.api,p);
 assert.equal(x.stores.chat.stat_data.人工纠错.覆盖[key].旧标记,undefined);
 await x.service.undo(x.api);assert.deepEqual(x.stores.chat.stat_data.人工纠错.覆盖[key],{path:['known','般若菩提菊成形'],value:false,旧标记:1});
 assert.equal(x.stores.chat.xsd_correction_meta.log.length,0);
});
test('updater消息层故障补偿chat，保留失败时其他写入',async()=>{
 const x=fixture({...base(),known:{般若菩提菊成形:false}}),original=x.api.updateVariablesWith;
 x.api.updateVariablesWith=(fn,o)=>{
  if(o.type==='message'){x.stores.chat.stat_data.地点='失败期间更新';throw Error('拒绝写入');}return original(fn,o);
 };
 const r=await x.service.write(x.api,{known:{般若菩提菊成形:true}},false);
 assert.equal(r.ok,false);assert.equal(x.stores.chat.stat_data.known.般若菩提菊成形,false);assert.equal(x.stores.chat.stat_data.地点,'失败期间更新');
});
test('updater即时聊天守卫，回调延迟到切局后不能改新局',async()=>{
 const x=fixture(base());x.api.updateVariablesWith=async(fn,o)=>{x.ctx.chatId='changed';return fn(x.stores[o.type]);};
 const r=await x.service.write(x.api,{段位:8},false);assert.equal(r.ok,false);assert.equal(x.stores.chat.stat_data.段位,3);
});
test('真正回读不一致仍拒绝，并给出层/楼/路径而不输出私聊值',async()=>{
 const x=fixture(base());x.api.updateVariablesWith=()=>undefined;
 const r=await x.service.write(x.api,{known:{般若菩提菊成形:true}},false);
 assert.equal(r.ok,false);assert.match(r.why,/chat \/ 楼1 \/ known → 般若菩提菊成形/);assert(!r.why.includes('自设'));
});
