/* 身份：gpt 下级独立复核。旧版真源作为 oracle，下载包不依赖 Git 或酒馆。 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const base = path.resolve(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures/status-parser');
const candidate = path.join(base, '候选源码/src/state-machine');
const read = file => fs.readFileSync(file, 'utf8');
const oldSource = read(path.join(fixture, 'legacy-status.js'));
const core = read(path.join(candidate, 'parsers/status-core.js'));
const adapter = read(path.join(candidate, 'parsers/status.js'));
const helpers = ['toSimp','normalizeLabel','matchField','isProgressLabel','isMilestoneLabel','parseMilestones','parseProgress','normalizeAnchorName','isDeflowerLabel','isNadeLabel','parseNade','parseDeflowerBook','nearDeflowerWord','hasStatusBlock','parseCastBlocks','parseStatusBlock'];
const constants = ['TRAD_CHARS','SIMP_CHARS','FIELD_ALIAS','ALIAS_LOOKUP','STATUS_TAG','STATUS_OPEN_RE','STATUS_PAIR_RE','STATUS_STRIP_RE','XML_PAIR_RE','CAST_BLOCK_RE','CAST_FIELD_RE','CAST_KEYS','CAST_FIELD_ALIAS','CAST_MAX','CAST_EMPTY_RE'];
const dependencies = ['CAST_FIELD','FIELD_MAP','HOLDER_TO_RELIC','ALL_FIELDS','DEFLOWER_SYN','DEFLOWER_HARD_RES'];
const registry = read(path.join(fixture, 'registry.js'));
const fields = read(path.join(fixture, 'status-fields.js'));
const relic = read(path.join(fixture, 'relic-progress.js'));
const plain = x => { const s = JSON.stringify(x); return s === undefined ? undefined : JSON.parse(s); };
const records = [];
function check(name, run) { run(); records.push({name, pass:true}); }
function load(source) {
  const logs = [], reads = [];
  const context = vm.createContext({TAG:'[audit-status]', console:{warn:(...v)=>logs.push(['warn',...v]),log:(...v)=>logs.push(['log',...v])},readIdentity:()=>{reads.push('identity');return '自设';}});
  // 实际后置名器函数声明与配置在 adapter 之后，保持生产初始化次序。
  const exposed = new vm.Script(registry+'\n'+fields+'\n'+source+'\n'+relic+'\n({'+[...helpers,...constants,...dependencies,'isRelicActionLabel','parseRelicAction'].join(',')+'});').runInContext(context);
  return { api:exposed, logs, reads, context };
}
const old = load(oldSource), newer = load(core+'\n'+adapter);
function compare(name, fn, args) {
  check(name, () => {
    old.logs.length = newer.logs.length = old.reads.length = newer.reads.length = 0;
    assert.deepEqual(plain(newer.api[fn](...args)), plain(old.api[fn](...args)));
    assert.deepEqual(newer.logs,old.logs);
    assert.deepEqual(newer.reads,old.reads);
  });
}
// 迁移核应逐字保留旧算法，唯一允许的两处变化是诊断出口注入。
check('mechanical-algorithm-body', () => {
  const start = oldSource.indexOf('/* ── 字段名归一');
  const end = oldSource.indexOf('/** 2026-10-08（gpt 04 号①）');
  const body = oldSource.slice(start,end).trim().replace('console.warn(TAG, ', "emit('warn', ").replace('console.log(TAG, ', "emit('log', ");
  const moved = core.slice(core.indexOf('/* ── 字段名归一'),core.lastIndexOf('\n  return {')).trim();
  assert.equal(moved, body);
});
for (const key of constants) check('constant:'+key, () => {
  const a = old.api[key], b = newer.api[key];
  if (a instanceof RegExp || Object.prototype.toString.call(a)==='[object RegExp]') assert.equal(String(b),String(a));
  else assert.deepEqual(plain(b),plain(a));
});
const labels = [null,undefined,'','名','角','地','時間','【歷·時】','在場','在場角色','角色','角色块','【關係_刻度】','氣候','進度','实际发生','里程碑','破處','破身簿','納戒','行囊','物品栏','名器互动','relic_action','unknown','__proto__','constructor','修為','暗處','天氣','周遭環境','遠聞','線索','危機',' 距启程 ', '倒计时'];
for (const fn of ['toSimp','normalizeLabel','matchField','isProgressLabel','isMilestoneLabel','isDeflowerLabel','isNadeLabel','hasStatusBlock']) {
  for (const [i,value] of labels.entries()) compare(fn+':'+i,fn,[value]);
}
const listValues = [null,undefined,'','无','（无）','-','—','NONE','进入幽寂谷、南域大劫','甲，乙 / 丙｜丁；戊\n己','孤月破处已完成、孤月元阴初破（说明）、兽潮血战[记事]','甲已达成、乙完成、丙已解锁','甲 乙'];
for (const fn of ['parseMilestones','parseProgress','normalizeAnchorName']) for (const [i,value] of [...listValues,...old.api.ALL_FIELDS,...old.api.DEFLOWER_SYN.map(s=>'孤月'+s)].entries()) compare(fn+':'+i,fn,[value]);
const inventory = ['无',null,'获得：青锋剑（入世防身）×2、酒壶x0、甲*3、乙 4｜消耗：青锋剑（旧）×1、酒壶 X2','拿到：冰心泪｜吃掉：丹药*3','收入：A×999｜使用：B×0','胡写：甲×2','获得：、 ×2、（描述）','获得：甲\n消耗：乙','获得：甲（长说明\n两行）'];
for (const [i,value] of inventory.entries()) compare('inventory:'+i,'parseNade',[value]);
for (const [i,value] of ['无',null,'孤月、赵无忧｜未知者、赵无忧｜叶红缨、甲、乙','苏瑶,甲;苏玲,乙','孤月','孤月、','孤月、甲\n叶红缨、乙'].entries()) compare('deflower:'+i,'parseDeflowerBook',[value]);
for (const [i,args] of [['叶红缨那一夜破了身，孤月在门外守着','孤月'],['叶红缨那一夜破了身，孤月在门外守着','叶红缨'],['孤月元阴初破','孤月'],['孤月'+ 'x'.repeat(81)+'破身','孤月'],['未知破身','孤月'],['','孤月'],[null,'孤月'],['叶红缨失身','叶红缨']].entries()) compare('near-deflower:'+i,'nearDeflowerWord',args);
const actor = (n,name) => `<角色${n}><名>${name}</名><阶段>初见</阶段><情况>静候</情况><心境>一\n二</心境><神态>站立</神态></角色${n}>`;
const castCases = ['',null,actor(1,'孤月'),actor(1,'甲')+actor(2,'乙')+actor(3,'丙')+actor(4,'丁'),'<角色１>无</角色１><角色二>孤月</角色二>', '<角色1><name>A</name><mind>B</mind><reason>C</reason><demeanor>D</demeanor></角色1>','<角色1><名>$& $\' $`</名></角色1>地点：山谷','<角色1><名>A</名></角色2>','<角色1><名>甲</名><名>乙</名></角色1>','<角色1><unknown>甲</unknown></角色1>'];
for (const [i,value] of castCases.entries()) compare('cast:'+i,'parseCastBlocks',[value]);
const blocks = [
 '',null,'正文：1579年\n<地点>不能读取</地点>',
 '<Status_block></Status_block>', '<StatusBlock><地点>甲</地点></StatusBlock>', '<status data-v="1">地点：乙</status>',
 '<Status_block>地点：YAML\n<地点>XML</地点>\n天气：晴\n<地点>后XML</地点></Status_block>',
 '<Status_block><身份>赵无忧</身份><在场>孤月</在场>'+actor(1,'孤月')+'</Status_block>',
 '<Status_block><未知>甲</未知><未知>乙</未知>\n未知：丙\n未知：丁</Status_block>',
 '<Status_block><进度>无</进度><实际发生>无</实际发生><纳戒>无</纳戒><破处>无</破处><名器互动>无</名器互动></Status_block>',
 '<Status_block><进度>兽潮血战已完成、进入幽寂谷（阶段）</进度><实际发生>南域大劫、天溪城兽潮</实际发生><纳戒>获得：甲×2｜消耗：乙×1</纳戒><破处>孤月、赵无忧</破处></Status_block>',
 '<Status_block><名器互动>灼酒流炎穴|赵无忧|内射 +1</名器互动><名器互动>zhuojiu|player|破身</名器互动></Status_block>',
 '<Status_block><名器互动>灼酒流炎穴|内射</名器互动></Status_block>',
 '<Status_block><名器互动>灼酒流炎穴|赵无忧|内射<地点>天溪</地点></Status_block>',
 '<Status_block>地点：谷地\n<名器互动>灼酒流炎穴|赵无忧|内射',
 '<Status_block><地点>甲\n乙</地点><环境>丙\n丁</环境></Status_block>',
 '<Status_block><status>地点：甲</status><时间>1578 年 三月 初三</时间></Status_block>',
 '<Status_block>地点：-\n环境：—\n进度：无\n实际发生：无\n名器互动：灼酒流炎穴|赵无忧|内射</Status_block>',
 '<Status_block>'+castCases[3]+'</Status_block>',
 '<Status_block><名>污染</名><在场>甲</在场><名器互动>未知|赵无忧|内射</名器互动></Status_block>',
 '<Status_block>地点：甲</Status_block><Status_block>地点：乙</Status_block>',
 '<STATUS_BLOCK>天氣：晴\r\n歷時：三天\r\n【關係·刻度】：友善</STATUS_BLOCK>',
];
for (const [i,text] of blocks.entries()) compare('block:'+i,'parseStatusBlock',[text]);
// 混合、重复和截断排列使用同一个真正的旧版 oracle，不重造解析算法。
for (let i=0;i<120;i++) {
 const body = [ `<地点>XML${i}</地点>`, `地点：YAML${i}`, `<进度>${i%2?'无':'进入幽寂谷已完成'}</进度>`, actor(1,i%3?'孤月':'$&'), '<名器互动>灼酒流炎穴|赵无忧|内射</名器互动>'][i%5];
 const mix = body+'\n'+[...blocks].slice(4,9)[Math.floor(i/5)%5];
 compare('mixed-sequence:'+i,'parseStatusBlock',['<Status_block>'+mix+(i%3?'':'</Status_block>')]);
}
check('semantic-invariants',()=>{
 assert.equal(newer.api.parseStatusBlock(blocks[6]).fields.地点,'XML');
 assert.equal(newer.api.parseStatusBlock(blocks[2]).found,false);
 const no = newer.api.parseStatusBlock(blocks[3]), none = newer.api.parseStatusBlock(blocks[9]);
 assert.equal(no.进度,null);assert.deepEqual(plain(none.进度),[]);
 assert.equal(newer.api.parseCastBlocks(castCases[3]).list.length,3);
 assert.equal(newer.api.matchField('名'),null);
 assert.equal(newer.api.matchField('在场'),'在场');
 assert.equal(newer.api.matchField('角色'),'身份');
 assert.equal(newer.api.nearDeflowerWord('叶红缨破了身，'+ 'x'.repeat(25)+'孤月在门外守着','孤月'),'');
 // 原注释的短句例子在旧版实际返回破身，作为旧行为锁定，另在报告说明。
 assert.equal(newer.api.nearDeflowerWord('叶红缨那一夜破了身，孤月在门外守着','孤月'),old.api.nearDeflowerWord('叶红缨那一夜破了身，孤月在门外守着','孤月'));
});
check('isolated-core-default-diagnostic-and-no-host',()=>{
 const context = vm.createContext({});
 for (const name of ['window','document','console','TAG','API','readStatData','writeStat']) Object.defineProperty(context,name,{get(){throw Error('宿主读取:'+name);}});
 const create = new vm.Script(core+'\ncreateXsdStatusParser;').runInContext(context);
 const deps = Object.fromEntries(dependencies.map(k=>[k,old.api[k]]));
 const before = JSON.stringify(deps);
 const parser = create({...deps,isRelicActionLabel:old.api.isRelicActionLabel,parseRelicAction:old.api.parseRelicAction});
 assert.equal(parser.parseStatusBlock('<Status_block>地点：甲').fields.地点,'甲');
 assert.equal(JSON.stringify(deps),before);
});
check('node-loader-uses-real-core',()=>{
 const create = require(path.join(candidate,'parsers/status.cjs'));
 const deps = Object.fromEntries(dependencies.map(k=>[k,old.api[k]]));
 const parser = create({...deps,isRelicActionLabel:old.api.isRelicActionLabel,parseRelicAction:old.api.parseRelicAction});
 assert.deepEqual(plain(parser.parseStatusBlock(blocks[6])),plain(old.api.parseStatusBlock(blocks[6])));
});
check('late-relic-function-binding-and-logging',()=>{
 const ctx = vm.createContext({TAG:'test',console:{warn(){},log(){}},calls:[]});
 const setup=registry+'\n'+fields+'\n'+core+'\n'+adapter;
 new vm.Script(setup).runInContext(ctx); // 后定义名器依赖不存在也能完成初始化。
 vm.runInContext("function isRelicActionLabel(v){calls.push(['label',v]);return v==='名器互动';} function parseRelicAction(v){calls.push(['action',v]);return {raw:v};}",ctx);
 const result=vm.runInContext("parseStatusBlock('<Status_block><名器互动>A</名器互动></Status_block>')",ctx);
 assert.deepEqual(plain(result.名器互动),[{raw:'A'}]);
 assert.deepEqual(plain(ctx.calls),[['label','名器互动'],['action','A']]);
});
const files={};
for(const name of ['legacy-status.js','registry.js','status-fields.js','relic-progress.js']) files[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(fixture,name))).digest('hex');
const result={identity:'gpt 下级独立复核',baseline:'card-project@064d67bc3bd8376f722bf050ca92a96d1aabef14',pass:true,total:records.length,coverage:{helpers:helpers.length,constants:constants.length,legacyComparisons:records.filter(x=>!x.name.startsWith('constant:')&&!['mechanical-algorithm-body','semantic-invariants','isolated-core-default-diagnostic-and-no-host','node-loader-uses-real-core','late-relic-function-binding-and-logging'].includes(x.name)).length},fixtures:files,checks:records};
fs.writeFileSync(path.join(base,'状态解析测试结果.json'),JSON.stringify(result,null,2)+'\n');
console.log(`PASS ${records.length} status-parser checks (${result.coverage.legacyComparisons} legacy comparisons)`);
