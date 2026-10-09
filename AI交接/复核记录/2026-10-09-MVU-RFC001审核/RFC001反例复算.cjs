/* gpt：执行RFC实际伪代码，不把此脚本当接入实现；extractAction缺实现，仅用受控替身观察匹配内容。 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=path.resolve(__dirname,'../../下级更新/2026-10-09-MVU数值变量架构设计/MVU数值变量架构设计_RFC001.md'),rfc=fs.readFileSync(source,'utf8');
const blocks=[...rfc.matchAll(/```javascript\n([\s\S]*?)\n```/g)].map(m=>m[1]);assert.equal(blocks.length,2);
const pseudocode=blocks[1],tick=pseudocode.slice(pseudocode.indexOf('const action = parseRelicAction'));
const fn=pseudocode.slice(pseudocode.indexOf('function parseRelicAction'),pseudocode.indexOf('// 在 __xsdStateTick'));
const records=[],name='灼酒流炎穴',id='zhuojiu',raw='<名器互动>'+name+': 内射+1</名器互动>';
function context(sd){const c={stat_data:structuredClone(sd),statusBlock:{raw},console:{log(){}},extractAction:()=>({relicId:id,relicName:name,isInfusion:true})};vm.createContext(c);return c;}
function run(c){vm.runInContext('(function(){'+fn+'\n'+tick+'})();',c);return c.stat_data;}
function record(label,actual){records.push({label,actual});}
function state(progress={stage:1,infusion:4,target:5},known={}){return {relic_progress:{[id]:progress},known};}
let c=context({known:{}});assert.throws(()=>run(c),/undefined/);record('旧局缺relic_progress命名空间就抛错，缺初始化与本项隔离',true);
c=context({relic_progress:{},known:{}});for(let i=0;i<5;i++)run(c);assert.equal(c.stat_data.relic_progress[id],undefined);assert.equal(c.stat_data.known[name+'二阶段'],undefined);record('未存回新建cur，空存档五次处理仍无进度',c.stat_data);
c=context(state({stage:1,infusion:0,target:5}));for(let i=0;i<5;i++)run(c);assert.equal(c.stat_data.known[name+'二阶段'],true);record('同一内容重复tick五次就满额，未实现N-1快照/持久去重',c.stat_data);
c=context(state(undefined,{[name+'成形']:false,[name+'一阶段']:false}));run(c);assert.equal(c.stat_data.known[name+'二阶段'],true);record('未成形与一阶false也能升二，缺资格检查',c.stat_data);
c=context({...state(undefined,{[name+'二阶段']:false}),人工纠错:{chatId:'test',覆盖:{'["known","灼酒流炎穴二阶段"]':{path:['known',name+'二阶段'],value:false}}}});run(c);assert.equal(c.stat_data.known[name+'二阶段'],true);record('直接赋known绕人工false覆盖；走统一protect才可能挡，伪代码没有接入',c.stat_data.known);
c=context(state(undefined,{[name+'三阶段']:true,[name+'四阶段']:true}));run(c);assert.equal(c.stat_data.relic_progress[id].stage,2);assert.equal(c.stat_data.known[name+'四阶段'],true);record('progress.stage=2与known四阶段true并存，双真源冲突',c.stat_data);
c=context(state({stage:1,infusion:'1',target:5}));run(c);assert.equal(c.stat_data.relic_progress[id].stage,2);record('字符串1 + 1变11，一次从1点升满，没有类型校验',c.stat_data);
c=context(state({stage:1,infusion:-9,target:5}));run(c);assert.equal(c.stat_data.relic_progress[id].infusion,-8);record('Math.min不是Clamp0~5，负数保留',c.stat_data.relic_progress[id]);
c=context(state({stage:1,infusion:0,target:0}));run(c);assert.equal(c.stat_data.known[name+'二阶段'],true);record('未验证target，0阈值一次自动升阶',c.stat_data);
c=context(state({stage:3,infusion:0,target:5},{[name+'一阶段']:true,[name+'二阶段']:false,[name+'三阶段']:false}));run(c);assert.equal(c.stat_data.relic_progress[id].infusion,0);record('GM回到一阶但缓存stage=3，计数停止且未同步',c.stat_data);
c=context(state());const before=structuredClone(c.stat_data);run(c);assert.notDeepEqual(c.stat_data,before);record('伪代码只有内存修改，没有持久化双层写入/校验/事务', {beforeInfusion:before.relic_progress[id].infusion,afterInfusion:c.stat_data.relic_progress[id].infusion,writeAPICalls:0});
function parse(s){const box={extractAction:x=>x};vm.createContext(box);return vm.runInContext(fn+'\nparseRelicAction('+JSON.stringify(s)+')',box);}
let p=parse('<名器互动>'+name+': 内射+1<地点>庭院</地点>');assert(p.includes('<地点>'));record('漏闭合兜底跨进下一XML字段，解析边界不闭合',p);
p=parse('<名器互动>'+name+': 内射+1</名器互动><名器互动>另一名器: 内射+1</名器互动>');assert(!p.includes('另一名器'));record('多条互动只读第一条，未定义重复/冲突/多名器规则',p);
p=parse('写法示例：<名器互动>'+name+': 内射+1</名器互动>');assert(p);record('正则能匹配例子/引文；extractAction及实际发生校验仍未提供',p);
assert.equal(parse('无名器标签'),null);record('缺标签返回null，主流程可跳过这项',null);
const output={identity:'gpt',scope:'RFC001伪代码的确定性行为；extractAction为测试替身，无实际MVU插件/酒馆/正文事实验证/新架构实现',checks:records.length,records};
fs.writeFileSync(path.join(__dirname,'RFC001反例结果.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({checks:records.length,scope:output.scope},null,2));
