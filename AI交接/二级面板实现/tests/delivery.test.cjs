// gpt：防止CRLF导致假冲突，以及安装失败后继续构建；不依赖完整本机项目。
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const here=path.resolve(__dirname,'..'),manifest=require('../候选清单.json');
const read=(root,f)=>fs.readFileSync(path.join(root,f.path));
function fixture(){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'xsd-v12-delivery-')),pack=path.join(tmp,'pack'),target=path.join(tmp,'target');
 fs.mkdirSync(pack);fs.mkdirSync(target);
 for(const name of ['应用候选.cjs','候选清单.json'])fs.copyFileSync(path.join(here,name),path.join(pack,name));
 for(const f of manifest.files)for(const root of [target,path.join(pack,'候选源码')]){const dest=path.join(root,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,read(path.join(here,'候选源码'),f).toString().replace(/\n/g,'\r\n'));}
 const run=(apply=false)=>spawnSync(process.execPath,[path.join(pack,'应用候选.cjs'),target,...(apply?['--apply']:[])],{encoding:'utf8'});
 return {tmp,pack,target,run,clean:()=>fs.rmSync(tmp,{recursive:true,force:true})};
}
test('CRLF包与CRLF目标预检通过但保持原字节，不生成备份',()=>{const f=fixture();try{const before=manifest.files.map(x=>read(f.target,x));assert.equal(f.run().status,0);manifest.files.forEach((x,i)=>assert.deepEqual(read(f.target,x),before[i]));assert(!fs.existsSync(path.join(f.target,'AI交接')));}finally{f.clean();}});
test('真实安装写清单规定LF，备份保留CRLF原字节',()=>{const f=fixture();try{const before=manifest.files.map(x=>read(f.target,x)),r=f.run(true);assert.equal(r.status,0,r.stderr);const result=JSON.parse(r.stdout);manifest.files.forEach((x,i)=>{assert.deepEqual(read(f.target,x),read(path.join(here,'候选源码'),x));assert.deepEqual(read(result.backup,x),before[i]);});}finally{f.clean();}});
test('非换行目标变化拒绝，六源全部不动且不备份',()=>{const f=fixture();try{fs.appendFileSync(path.join(f.target,manifest.files[3].path),'\n// 本机独立改动\n');const before=manifest.files.map(x=>read(f.target,x)),r=f.run(true);assert.notEqual(r.status,0);assert.match(r.stderr,/目标已更新/);manifest.files.forEach((x,i)=>assert.deepEqual(read(f.target,x),before[i]));assert(!fs.existsSync(path.join(f.target,'AI交接')));}finally{f.clean();}});
test('候选内容变化拒绝而不覆盖任何目标',()=>{const f=fixture();try{fs.appendFileSync(path.join(f.pack,'候选源码',manifest.files[0].path),'\n// 被修改\n');const before=manifest.files.map(x=>read(f.target,x)),r=f.run(true);assert.notEqual(r.status,0);assert.match(r.stderr,/候选文件SHA变化/);manifest.files.forEach((x,i)=>assert.deepEqual(read(f.target,x),before[i]));}finally{f.clean();}});
test('接入CLI预检失败不运行打包；顺序执行器首错即停',()=>{
 const f=fixture();try{
  const marker=path.join(f.target,'不应出现的打包标记');
  for(const name of ['tools/pipeline/_pack_panel_script.mjs','tools/checks/_chk_status_missing.mjs','tools/checks/_chk_stage_drive.mjs']){const p=path.join(f.target,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'import fs from "node:fs";fs.writeFileSync('+JSON.stringify(marker)+',"bad");');}
  fs.appendFileSync(path.join(f.target,manifest.files[0].path),'\n// 独立修改\n');
  const r=spawnSync(process.execPath,[path.join(here,'隔离接入.cjs'),f.target,'--apply'],{encoding:'utf8'});assert.notEqual(r.status,0);assert(!fs.existsSync(marker));
  const seen=[];assert.throws(()=>require('../隔离接入.cjs').runSteps(['install','pack','build'],s=>{seen.push(s);throw Error('失败');}));assert.deepEqual(seen,['install']);
 }finally{f.clean();}
});
test('JSON比较忽略排版/键序，真实差异输出路径摘要而不输出内容',()=>{
 const {differences}=require('../比较构建JSON.cjs');assert.deepEqual(differences({a:1,b:[2]},{b:[2],a:1}),[]);
 const d=differences({name:'私人文本',a:1},{name:'另一个私人文本',a:2});assert.equal(d.length,2);assert(!JSON.stringify(d).includes('私人文本'));assert.equal(d[0].path,'$["name"]');
});
