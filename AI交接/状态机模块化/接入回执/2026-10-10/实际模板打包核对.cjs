/* 身份：gpt 下级复核。实际打包仅在/tmp文字快照中执行，不改资源或生产。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {execFileSync,spawnSync}=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),ref='8b7aa5924d03c97038d4a2b517a451c15846b407';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const show=p=>execFileSync('git',['show',ref+':'+p],{cwd:root,maxBuffer:8*1024*1024});
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'回填清单.json')));
const candidateFile=path.join(__dirname,'候选源码',manifest.templatePath),candidate=fs.readFileSync(candidateFile),tpl=candidate.toString();
assert.equal(candidate.length,206271);assert.equal(hash(candidate),'761ec3858394da40482669081fc401b7952cf46fb1c44897adf295ae9c5bb503');
assert.equal(hash(candidate),manifest.candidateTemplateSHA256);assert(!tpl.startsWith('/* ⚠️ 本文件由'));
const original=show(manifest.generatedHUDPath),hud=original.toString();assert.equal(hash(original),manifest.generatedHUDSHA256);
const specs=[['XSD_CSS','CSS'],['XSD_SKELETON','SKEL'],['XSD_FONT_B64','FONT']],resources={};
for(const[key,tag]of specs){
 const p=new RegExp('^const '+key+' = \'([A-Za-z0-9+/=]*)\';$','gm'),m=[...hud.matchAll(p)];assert.equal(m.length,1,key);resources[tag]=m[0][1];
 assert.equal(tpl.split('/*__XSD_'+tag+'_B64__*/').length-1,1,tag);
}
assert.equal((tpl.match(/\/\*__XSD_(?:CSS|SKEL|FONT)_B64__\*\//g)||[]).length,3);
new vm.Script(tpl.replace(/\/\*__XSD_(?:CSS|SKEL|FONT)_B64__\*\//g,"''"));
for(const snippet of ["writtenFields.add('id')","typeof xsdStatData === 'function'",'const isZhuojiu','+ progHint'])assert(tpl.includes(snippet),snippet);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'xsd-template-real-pack-')),project=path.join(tmp,'project');
const put=(relative,bytes)=>{const p=path.join(project,relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);};
let result;
try{
 put(manifest.templatePath,candidate);
 put('tools/pipeline/_pack_panel_script.mjs',show('tools/pipeline/_pack_panel_script.mjs'));
 const css=Buffer.from(resources.CSS,'base64').toString('utf8'),skeleton=Buffer.from(resources.SKEL,'base64').toString('utf8');
 put('_card_panel_v4.css',css);put('_card_panel_v4.replace.html','<style>'+css+'</style>'+skeleton+'<pre hidden></pre>');
 fs.mkdirSync(path.join(tmp,'_fonts'));fs.writeFileSync(path.join(tmp,'_fonts/wenkai-subset.b64.txt'),resources.FONT);
 const r=spawnSync(process.execPath,['tools/pipeline/_pack_panel_script.mjs'],{cwd:project,encoding:'utf8',timeout:15000});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
 const output=fs.readFileSync(path.join(project,manifest.generatedHUDPath)).toString();new vm.Script(output);
 const body=s=>{assert(s.startsWith('/* ⚠️ 本文件由'));return s.slice(s.indexOf('*/')+3);};
 assert.equal(body(output),body(hud));
 for(const[key,tag]of specs){const p=new RegExp('^const '+key+' = \'([A-Za-z0-9+/=]*)\';$','gm'),m=[...output.matchAll(p)];assert.equal(m.length,1,key);assert.equal(m[0][1],resources[tag],tag);}
 assert.deepEqual(fs.readFileSync(candidateFile),candidate);
 result={identity:'gpt 下级复核',sourceCommit:ref,actualCandidateSHA256:hash(candidate),actualCandidateBytes:candidate.length,
 originalPackerExecuted:true,exitCode:r.status,outputBodyByteEqualToCurrentHUD:true,templateSyntax:'PASS',generatedSyntax:'PASS',uniqueResourcePlaceholders:3,
 identityGuardRetained:true,hostApiProbeRetained:true,pilotProgressGuardRetained:true,resourceExpressionsUnchanged:true,
 candidateFileUnchanged:true,scope:'only /tmp text fixtures reconstructed from current HUD; no resources edited, full card built or tavern deployed',packerLog:r.stdout.trim()};
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
if(require.main===module){fs.writeFileSync(path.join(__dirname,'实际模板打包核对结果.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));}
module.exports=result;
