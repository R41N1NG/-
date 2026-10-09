/* 身份：gpt 下级复核。独立验证；只写临时快照，不改归档/候选/生产。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {spawnSync,execFileSync}=require('node:child_process');
const test=require('node:test'),assert=require('node:assert/strict');
const PACK=path.resolve(__dirname,'..'),REPO=path.resolve(PACK,'../..');
const BASE=path.join(REPO,'AI交接/下级更新/2026-10-10-状态机模块化基线');
const CAND=path.join(PACK,'候选源码'),SM='卡片脚本/状态机.js';
const builder=require('../候选源码/src/state-machine/build.cjs');
const {install}=require('../应用模块化.cjs'),{restore}=require('../恢复模块化.cjs');
const delivery=JSON.parse(fs.readFileSync(path.join(PACK,'交付清单.json'),'utf8'));
const normalized=b=>Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n'));
const read=(root,rel)=>fs.readFileSync(path.join(root,rel));
const write=(root,rel,b)=>{const p=path.join(root,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);};
function snapshot(root){
 const out={};if(!fs.existsSync(root))return out;
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else out[path.relative(root,p)]=builder.digest(fs.readFileSync(p));}}
 scan(root);return out;
}
function fixture({crlf=false,packCopy=false}={}){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'xsd-mod-review-')),target=path.join(tmp,'project');
 fs.mkdirSync(target);
 for(const rel of [SM,'_build_card.js']){let b=read(BASE,rel);if(crlf)b=Buffer.from(normalized(b).toString().replace(/\n/g,'\r\n'));write(target,rel,b);}
 for(const r of delivery.requirements||[])write(target,r.path,read(BASE,r.path));
 let pack=PACK;
 if(packCopy){pack=path.join(tmp,'pack');fs.mkdirSync(pack);fs.cpSync(CAND,path.join(pack,'候选源码'),{recursive:true});fs.copyFileSync(path.join(PACK,'交付清单.json'),path.join(pack,'交付清单.json'));}
 return {tmp,target,pack,source:path.join(target,'src/state-machine'),clean:()=>fs.rmSync(tmp,{recursive:true,force:true})};
}
function guarded(fn,options){const f=fixture(options);try{return fn(f);}finally{f.clean();}}
function runBuild(target,...args){return spawnSync(process.execPath,[path.join(target,'src/state-machine/build.cjs'),...args],{cwd:target,encoding:'utf8'});}
function faultIO(nth){let n=0;const io=Object.create(fs);io.renameSync=(...args)=>{if(++n===nth)throw Error('reviewer injected rename failure');return fs.renameSync(...args);};return io;}

test('最新归档声明的34个文件大小及SHA全部真实匹配',()=>{
 const text=read(BASE,'README.md').toString(),rows=[...text.matchAll(/\| `([^`]+)` \| ([\d,]+) \| `([a-f0-9]+)` \|/g)];assert.equal(rows.length,34);
 for(const [,rel,size,sha]of rows){const b=read(BASE,rel);assert.equal(b.length,Number(size.replace(/,/g,'')),rel);assert.equal(builder.digest(b),sha,rel);}
 assert.equal(builder.digest(read(BASE,SM)),'7cd5d1cb318d8b7a1f2795b98e20f9f53dad7cb7c9cf085a080f8a6395515830');
 assert.equal(builder.digest(read(BASE,'_build_card.js')),'313de6672f33e0a982e3bc8b734416e44b88b5d41594dc662e337defb9c492ef');
});
test('同顺序同作用域拼接与最新完整状态机LF逐字节相同',()=>{
 const result=builder.assemble(path.join(CAND,'src/state-machine'),{verifyBaseline:true});
 assert.deepEqual(result.bytes,normalized(read(BASE,SM)));assert.deepEqual(result.bytes,read(CAND,SM));
 assert.equal(result.manifest.baseline.sha256,builder.digest(normalized(read(BASE,SM))));
});
test('27个源片段边界完整，基线行区间连续且覆盖全部源码',()=>{
 const result=builder.assemble(path.join(CAND,'src/state-machine'),{verifyBaseline:true});assert.equal(result.mapping.length,27);
 let last=0;for(const m of result.manifest.modules){const b=read(path.join(CAND,'src/state-machine'),m.path);new vm.Script(b.toString(),{filename:m.path});assert.equal(m.baselineLines[0],last+1);last=m.baselineLines[1];}
 assert.equal(last,(normalized(read(BASE,SM)).toString().match(/\n/g)||[]).length);
 const main=result.manifest.modules.find(m=>m.path==='main.js');assert(main);assert(main.baselineLines[1]-main.baselineLines[0]<350);
});
test('构建器仅增加模块先编译hook，运行时/时间滑块注入与脚本ID原样保留',()=>{
 const baseline=normalized(read(BASE,'_build_card.js')).toString(),next=read(CAND,'_build_card.js').toString();
 const hook="// gpt：源模块先按原顺序编译；其后共享运行时与时间点注入流程保持原样。\nrequire('./src/state-machine/build.cjs').buildStateMachine();\n";
 assert.equal(next.split(hook).length,2);assert.equal(next.replace(hook,''),baseline);
 assert(next.indexOf(hook)<next.indexOf("const SCRIPT_DIR ="));
});
test('安装默认只读，无文件/备份产生',()=>guarded(f=>{const before=snapshot(f.target);assert.equal(install(f.target).applied,false);assert.deepEqual(snapshot(f.target),before);assert(!fs.existsSync(path.join(f.target,'AI交接')));}));
test('首次安装32文件严格匹配交付SHA，原文件原字节完整备份',()=>guarded(f=>{
 const before=new Map([SM,'_build_card.js'].map(p=>[p,read(f.target,p)])),r=install(f.target,{apply:true});assert.equal(r.files,32);
 for(const x of delivery.files)assert.equal(builder.digest(read(f.target,x.path)),x.sha256,x.path);
 for(const [p,b]of before)assert.deepEqual(read(r.backup,p),b);
 assert.equal(runBuild(f.target,'--check','--baseline').status,0);
}));
test('重复安装内容不变，build与check可重复且不改文件',()=>guarded(f=>{
 install(f.target,{apply:true});const before=snapshot(f.target);assert.equal(runBuild(f.target).status,0);assert.equal(runBuild(f.target,'--check').status,0);assert.deepEqual(snapshot(f.target),before);
 install(f.target,{apply:true});for(const x of delivery.files)assert.equal(builder.digest(read(f.target,x.path)),x.sha256);
}));
test('CRLF目标只读预检保持字节，安装为LF且备份保留CRLF',()=>guarded(f=>{
 const before=snapshot(f.target),original=read(f.target,SM);assert(original.includes(Buffer.from('\r\n')));install(f.target);assert.deepEqual(snapshot(f.target),before);
 const r=install(f.target,{apply:true});assert.deepEqual(read(r.backup,SM),original);assert.deepEqual(read(f.target,SM),read(CAND,SM));
},{crlf:true}));
for(const rel of [SM,'_build_card.js'])test('未知本机版本拒绝全包安装：'+rel,()=>guarded(f=>{
 fs.appendFileSync(path.join(f.target,rel),'\n// legitimate local new work\n');const before=snapshot(f.target);assert.throws(()=>install(f.target,{apply:true}),/目标已更新/);assert.deepEqual(snapshot(f.target),before);assert(!fs.existsSync(path.join(f.target,'AI交接')));
}));
test('缺少必需构建器时全停，不生成源目录',()=>guarded(f=>{fs.unlinkSync(path.join(f.target,'_build_card.js'));const before=snapshot(f.target);assert.throws(()=>install(f.target,{apply:true}),/缺少必需/);assert.deepEqual(snapshot(f.target),before);}));
test('已有新模块被本机独立修改时拒覆盖全部文件',()=>guarded(f=>{write(f.target,'src/state-machine/main.js','// local version\n');const before=snapshot(f.target);assert.throws(()=>install(f.target,{apply:true}),/目标已更新/);assert.deepEqual(snapshot(f.target),before);}));
for(const r of delivery.requirements)test('共享依赖发生新改动时拒绝安装且保持全部源：'+r.path,()=>guarded(f=>{
 fs.appendFileSync(path.join(f.target,r.path),'\n// new dependency version\n');const before=snapshot(f.target);assert.throws(()=>install(f.target,{apply:true}),/共享依赖与上传基线不同/);assert.deepEqual(snapshot(f.target),before);
}));
for(const rel of ['src/state-machine/main.js','_build_card.js','src/state-machine/build-state.json'])test('候选包非换行篡改拒绝全停：'+rel,()=>guarded(f=>{
 fs.appendFileSync(path.join(f.pack,'候选源码',rel),'\n// modified package\n');const before=snapshot(f.target);assert.throws(()=>install(f.target,{apply:true,pack:f.pack}));assert.deepEqual(snapshot(f.target),before);
},{packCopy:true}));
test('候选模块缺失时安装全停',()=>guarded(f=>{fs.unlinkSync(path.join(f.pack,'候选源码/src/state-machine/main.js'));const before=snapshot(f.target);assert.throws(()=>install(f.target,{apply:true,pack:f.pack}));assert.deepEqual(snapshot(f.target),before);},{packCopy:true}));
test('模块清单乱序时--baseline拒绝，不触碰产物',()=>guarded(f=>{
 install(f.target,{apply:true});const p=path.join(f.source,'modules.json'),m=JSON.parse(fs.readFileSync(p));[m.modules[2],m.modules[3]]=[m.modules[3],m.modules[2]];fs.writeFileSync(p,JSON.stringify(m));const before=snapshot(f.target);
 const r=runBuild(f.target,'--baseline');assert.notEqual(r.status,0);assert.match(r.stderr,/偏离基线/);assert.deepEqual(snapshot(f.target),before);
}));
test('合法改模块可构建；只读check发现旧产物但不写入',()=>guarded(f=>{
 install(f.target,{apply:true});fs.appendFileSync(path.join(f.source,'utils/calendar.js'),'\n// approved modular source edit\n');const before=snapshot(f.target);
 assert.notEqual(runBuild(f.target,'--check').status,0);assert.deepEqual(snapshot(f.target),before);assert.equal(runBuild(f.target).status,0);assert.equal(runBuild(f.target,'--check').status,0);assert(read(f.target,SM).includes(Buffer.from('approved modular source edit')));
}));
test('手改生成文件拒绝构建覆盖，全部原字节保持',()=>guarded(f=>{
 install(f.target,{apply:true});fs.appendFileSync(path.join(f.target,SM),'\n// external generated edit\n');const before=snapshot(f.target);const r=runBuild(f.target);assert.notEqual(r.status,0);assert.match(r.stderr,/另行修改/);assert.deepEqual(snapshot(f.target),before);
}));
test('缺模块与非法清单路径在构建前失败且保持原产物',()=>guarded(f=>{
 install(f.target,{apply:true});fs.unlinkSync(path.join(f.source,'main.js'));let before=snapshot(f.target);assert.notEqual(runBuild(f.target).status,0);assert.deepEqual(snapshot(f.target),before);
 fs.copyFileSync(path.join(CAND,'src/state-machine/main.js'),path.join(f.source,'main.js'));const p=path.join(f.source,'modules.json'),m=JSON.parse(fs.readFileSync(p));m.modules[0].path='../main.js';fs.writeFileSync(p,JSON.stringify(m));before=snapshot(f.target);const r=runBuild(f.target);assert.notEqual(r.status,0);assert.match(r.stderr,/非法相对路径/);assert.deepEqual(snapshot(f.target),before);
}));
test('目录链接拒绝安装，外部目标保持原样',()=>guarded(f=>{
 const outside=path.join(f.tmp,'outside');fs.mkdirSync(outside);fs.rmSync(path.join(f.target,'src'),{recursive:true});fs.symlinkSync(outside,path.join(f.target,'src'),'dir');assert.throws(()=>install(f.target,{apply:true}),/拒绝链接/);assert.deepEqual(snapshot(outside),{});
}));
test('安装第5次替换注入故障后所有既有文件恢复、新增文件清除',()=>guarded(f=>{
 const before=new Map([SM,'_build_card.js'].map(p=>[p,read(f.target,p)]));assert.throws(()=>install(f.target,{apply:true,io:faultIO(5)}),/reviewer injected/);
 for(const [p,b]of before)assert.deepEqual(read(f.target,p),b);
 for(const x of delivery.files.filter(x=>!before.has(x.path)))assert(!fs.existsSync(path.join(f.target,x.path)),x.path);
 assert(fs.existsSync(path.join(f.target,'AI交接/状态机模块化备份')));
}));
test('安装失败回滚尊重替换后的外部新改动，不把其它人的修改覆盖回旧版',()=>guarded(f=>{
 const io=Object.create(fs);let n=0;const changed=path.join(f.target,'_build_card.js');io.renameSync=(...args)=>{
  if(++n===2){fs.writeFileSync(changed,'// external concurrent work\n');throw Error('injected concurrent writer');}return fs.renameSync(...args);
 };
 assert.throws(()=>install(f.target,{apply:true,io}),/后续外部改动已保留/);assert.equal(fs.readFileSync(changed,'utf8'),'// external concurrent work\n');
 assert.deepEqual(read(f.target,SM),read(BASE,SM));
}));
test('恢复默认只读；执行恢复返回原CRLF且删掉新增模块',()=>guarded(f=>{
 const original=new Map([SM,'_build_card.js'].map(p=>[p,read(f.target,p)])),r=install(f.target,{apply:true});const before=snapshot(f.target);
 assert.equal(restore(f.target,r.backup).restored,false);assert.deepEqual(snapshot(f.target),before);assert.equal(restore(f.target,r.backup,{apply:true}).restored,true);
 for(const [p,b]of original)assert.deepEqual(read(f.target,p),b);
 for(const x of delivery.files.filter(x=>!original.has(x.path)))assert(!fs.existsSync(path.join(f.target,x.path)));
},{crlf:true}));
test('安装后有新改动或备份被篡改，恢复拒绝整包覆盖',()=>guarded(f=>{
 const r=install(f.target,{apply:true});fs.appendFileSync(path.join(f.target,'src/state-machine/main.js'),'\n// newer work\n');let before=snapshot(f.target);assert.throws(()=>restore(f.target,r.backup,{apply:true}),/又有修改/);assert.deepEqual(snapshot(f.target),before);
 fs.copyFileSync(path.join(CAND,'src/state-machine/main.js'),path.join(f.target,'src/state-machine/main.js'));fs.appendFileSync(path.join(r.backup,SM),'\n// corrupt backup\n');before=snapshot(f.target);assert.throws(()=>restore(f.target,r.backup,{apply:true}),/备份SHA不符/);assert.deepEqual(snapshot(f.target),before);
}));
test('恢复第5次替换故障后保留全部已安装字节',()=>guarded(f=>{
 const r=install(f.target,{apply:true}),before=snapshot(f.target);assert.throws(()=>restore(f.target,r.backup,{apply:true,io:faultIO(5)}),/reviewer injected/);assert.deepEqual(snapshot(f.target),before);
}));
test('失败恢复后的旧/新/缺失混合状态可继续恢复，已经恢复时可重复预检',()=>guarded(f=>{
 const original=new Map([SM,'_build_card.js'].map(p=>[p,read(f.target,p)])),r=install(f.target,{apply:true});
 fs.copyFileSync(path.join(r.backup,'_build_card.js'),path.join(f.target,'_build_card.js'));fs.unlinkSync(path.join(f.target,'src/state-machine/main.js'));
 assert.equal(restore(f.target,r.backup,{apply:true}).restored,true);for(const[p,b]of original)assert.deepEqual(read(f.target,p),b);
 assert.equal(restore(f.target,r.backup).files,0);
}));
const SOURCE_CHECKS=['_chk_deflower_impersonation.mjs','_chk_relic_progress.mjs','_chk_derive_ledger.mjs','_chk_tick_preflight.mjs','_chk_clock_acc.mjs','_chk_defect_four.mjs','_chk_anchor_gate.mjs','_chk_freefield_gate.mjs','_chk_mingqi_prereq.mjs','_chk_form_gate.mjs'];
for(const name of SOURCE_CHECKS)test('模块化后实际源码门禁：'+name,()=>guarded(f=>{
 install(f.target,{apply:true});fs.cpSync(path.join(BASE,'tools'),path.join(f.target,'tools'),{recursive:true});fs.cpSync(path.join(BASE,'src/correction-runtime.js'),path.join(f.target,'src/correction-runtime.js'));
 const panel=execFileSync('git',['show','9f7a2de:卡片脚本/状态栏面板.js'],{cwd:REPO});write(f.target,'卡片脚本/状态栏面板.js',panel);
 const r=spawnSync(process.execPath,[path.join(f.target,'tools/checks',name)],{cwd:f.target,encoding:'utf8',timeout:20000});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
}));
