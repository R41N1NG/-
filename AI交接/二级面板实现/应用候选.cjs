/* gpt：安装源码候选；不构建、不部署。先核全部源SHA，避免覆盖本机后续改动。 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const here=__dirname, target=path.resolve(process.argv[2]||''),apply=process.argv.includes('--apply');
if(!process.argv[2])throw Error('用法：node 应用候选.cjs 项目根目录 [--apply]');
const manifest=JSON.parse(fs.readFileSync(path.join(here,'候选清单.json')));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const f of manifest.files){
 const candidate=path.join(here,'候选源码',f.path),dest=path.join(target,f.path);
 if(digest(candidate)!==f.candidateSHA256)throw Error('候选文件SHA变化：'+f.path);
 if(fs.existsSync(dest)) {
  const sha=digest(dest);if(sha!==f.originalSHA256&&sha!==f.candidateSHA256)throw Error('目标已更新，停止覆盖：'+f.path);
 }else if(f.originalSHA256)throw Error('目标缺少原文件：'+f.path);
 const text=fs.readFileSync(candidate,'utf8').replace(/\/\*__XSD_(?:CSS|SKEL|FONT)_B64__\*\//g,"''");
 if(f.path.endsWith('.mjs')) require('node:child_process').execFileSync(process.execPath,['--check',candidate],{stdio:'pipe'});
 else new vm.Script(text,{filename:f.path});
}
if(!apply){console.log('全部源SHA与语法已校验；未改文件。加 --apply 才安装。');process.exit(0);}
const backup=path.join(target,'AI交接','二级面板源码备份',new Date().toISOString().replace(/[:.]/g,'-'));
for(const f of manifest.files){
 const dest=path.join(target,f.path),saved=path.join(backup,f.path);
 if(fs.existsSync(dest)){fs.mkdirSync(path.dirname(saved),{recursive:true});fs.copyFileSync(dest,saved);}
}
for(const f of manifest.files){const dest=path.join(target,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(here,'候选源码',f.path),dest);}
console.log(JSON.stringify({installed:manifest.files.map(f=>f.path),backup,notice:'源码已应用，尚未构建/部署；重打包面板并隔离构建验收。'},null,2));
