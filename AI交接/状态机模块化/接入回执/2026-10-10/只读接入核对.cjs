/* 身份：gpt 下级复核。固定提交只读复算，不连接酒馆、不修改源码。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..');
const get=(ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:root,maxBuffer:8*1024*1024});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const ref='8b7aa5924d03c97038d4a2b517a451c15846b407',previous='21a5723';
const panel='卡片脚本/状态栏面板.js',template='卡片脚本/_src/状态栏面板.模板.js';
const old=get(previous,panel).toString(),current=get(ref,panel).toString(),tpl=get(ref,template).toString();
function portion(source){const start=source.indexOf("        let progHint = '';"),end=source.indexOf("        gridHtml += '<div class=\"stage-card",start);assert(start>=0&&end>start);return source.slice(start,end);}
function run(source,{relic={id:'zhuojiuliuyanxue',n:'灼酒流炎穴'},progress={zhuojiu:{count:3,target:5}},reached=false,phase=2,state='self'}={}){
 const ctx={relObj:relic,stat:{relic_progress:progress},isReached:reached,i:phase,st:{state},data:{carrier:'测试携带者'},esc:String};vm.createContext(ctx);
 return vm.runInContext('(function(){'+portion(source)+';return progHint;})()',ctx);
}
const checks=[];function ck(name,fn){fn();checks.push({name,passed:true});}
ck('旧/新生成HUD完整脚本均可编译',()=>{new vm.Script(old);new vm.Script(current);});
ck('上个远程版本已有局部progHint声明，本次不是新增声明',()=>{assert(old.includes("let progHint = '';"));assert(current.includes("let progHint = '';"));});
ck('非试点心魔读取灼酒数值串台：旧版可复现，新版显示不串台',()=>{
 const args={relic:{id:'xinmochayingru',n:'心魔茶璎乳'}};assert(run(old,args).includes('3 / 5'));assert(!run(current,args).includes('3 / 5'));assert(!run(current,args).includes('sc-progress-card'));
});
ck('灼酒完整ID通过名称识别试点并读取短ID3/5',()=>{assert(run(current).includes('3 / 5'));});
ck('灼酒完整ID自己的记录优先且显示2/5',()=>{assert(run(current,{progress:{zhuojiuliuyanxue:{count:2,target:5},zhuojiu:{count:3,target:5}}}).includes('2 / 5'));});
ck('非试点即使有自己的数值也不展示试点数字卡',()=>{assert(!run(current,{relic:{id:'xinmochayingru',n:'心魔茶璎乳'},progress:{xinmochayingru:{count:2,target:5}}}).includes('sc-progress-card'));});
ck('试点缺记录不伪造0/5；已达阶段不显示待推进卡',()=>{assert(!run(current,{progress:{}}).includes('0 / 5'));assert.equal(run(current,{reached:true}),'');});
ck('远程模板未同步数值提示逻辑，且与上一提交相同',()=>{assert(!tpl.includes('progHint'));assert(!tpl.includes('relic_progress'));assert(!tpl.includes('isZhuojiu'));assert.deepEqual(get(ref,template),get(previous,template));});
const build=get(ref,'_build_card.js'),sm=get(ref,'卡片脚本/状态机.js');
ck('远程构建器仍是未接入模块的原基线',()=>{assert.equal(hash(build),'313de6672f33e0a982e3bc8b734416e44b88b5d41594dc662e337defb9c492ef');assert(!build.toString().includes("require('./src/state-machine/build.cjs').buildStateMachine();"));});
const files=execFileSync('git',['-c','core.quotePath=false','ls-tree','-r','--name-only',ref],{cwd:root,encoding:'utf8'}).trim().split('\n');
ck('远程只有候选包模块，工程根src/state-machine无文件',()=>{assert(!files.some(p=>p.startsWith('src/state-machine/')));assert(files.some(p=>p.startsWith('AI交接/状态机模块化/候选源码/src/state-machine/')));});
const packer=get(ref,'tools/pipeline/_pack_panel_script.mjs').toString();
ck('远程打包器从未同步模板重新生成HUD，不能固化手改产物',()=>{assert(packer.includes("const TPL = '卡片脚本/_src/状态栏面板.模板.js'"));assert(packer.includes('const out = tpl'));assert(packer.includes("writeFileSync(OUT, banner + out"));});
ck('阶段卡区域与模板同源，可精确接回45行进度块和一个输出拼接',()=>{
 const anchor='        const stageImgFilter = isReached ?',end='\n      return \'<div class="modal-wrap">\'';
 const section=s=>s.slice(s.indexOf(anchor),s.indexOf(end,s.indexOf(anchor)));
 const g=section(current),t=section(tpl),a=g.indexOf("        let progHint = '';"),b=g.indexOf("        gridHtml += '<div class=\"stage-card",a);
 assert.equal((g.slice(0,a)+g.slice(b)).replace('          + progHint\n',''),t);assert.equal(g.slice(a,b).split('\n').length-1,45);
 assert(!get(ref,'build.js').toString().includes('_pack_panel_script'));
});
ck('反向生成模板仅抽出三资源，回注入逐字节还原当前HUD且保留身份保护',()=>{
 const body=current.slice(current.indexOf('*/')+3),spec=[['XSD_CSS','CSS'],['XSD_SKELETON','SKEL'],['XSD_FONT_B64','FONT']];
 let reverse=body;const values={};
 for(const[key,tag]of spec){const p=new RegExp('^const '+key+' = (\'[A-Za-z0-9+/=]*\');$','gm'),matches=[...body.matchAll(p)];assert.equal(matches.length,1,key);values[tag]=matches[0][1];reverse=reverse.replace(p,'const '+key+' = /*__XSD_'+tag+'_B64__*/;');}
 let restored=reverse;for(const[,tag]of spec)restored=restored.replace('/*__XSD_'+tag+'_B64__*/',values[tag]);assert.equal(restored,body);
 assert(reverse.includes("writtenFields.add('id')"));assert(reverse.includes("typeof xsdStatData === 'function'"));assert(reverse.includes('const isZhuojiu'));
 new vm.Script(reverse.replace(/\/\*__XSD_(CSS|SKEL|FONT)_B64__\*\//g,"''"));
});
const result={identity:'gpt 下级复核',ref,previous,scope:'fixed-commit source readback and extracted actual HUD snippet VM; no full tests, build or deploy',checks,
 hashes:{stateMachine:hash(sm),cardBuilder:hash(build),generatedHUD:hash(get(ref,panel)),HUDTemplate:hash(get(ref,template))},
 remoteRootModulesPresent:false,remoteBuildHookPresent:false,templateProgressLogicPresent:false,locallyReportedInstallAndDeployIndependentlyVerified:false};
if(require.main===module){fs.writeFileSync(path.join(__dirname,'只读接入核对结果.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));}
module.exports=result;
