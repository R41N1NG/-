'use strict';
// gpt 下级：只核对派生卡，不运行附件脚本；原卡路径可由命令参数传入，不保存其全文。
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.resolve(process.argv[2]||path.join(__dirname,'【朱颜血·丹杏】CCv3-刑狱状态栏试用.json'));
const original=process.argv[3]?JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8')):null;
const bytes=fs.readFileSync(file),card=JSON.parse(bytes),root=path.resolve(__dirname,'..');
assert.equal(card.spec,'chara_card_v3');assert.equal(card.spec_version,'3.0');assert.equal(card.data.character_book.entries.length,42);
const names=['ZYX_01_网关界面渲染 (零楼启动)','ZYX_02_状态栏HUD渲染','ZYX_02B_状态栏异常记录保护','ZYX_03_流式传输防闪烁','ZYX_04_历史楼层清理 (剔除历史状态栏节约Token)'];
const scripts=card.data.extensions.regex_scripts;
for(const name of names)assert.equal(scripts.filter(r=>r.scriptName===name).length,1);
const gateway=scripts.find(r=>r.scriptName===names[0]),hud=scripts.find(r=>r.scriptName===names[1]);
assert.equal(gateway.markdownOnly,true);assert.equal(gateway.promptOnly,false);
const displayed=card.data.first_mes.replace(new RegExp(gateway.findRegex,'g'),gateway.replaceString);
assert.equal(displayed,gateway.replaceString,'String.replace破坏了零楼代码或未命中首条');
assert.equal((displayed.match(/```/g)||[]).length,2);assert.ok(displayed.startsWith('```html\n'));assert.ok(displayed.endsWith('\n```'));
const html=displayed.slice('```html\n'.length,-'\n```'.length);
assert.ok(/^<!doctype html><html\b/i.test(html));assert.ok(html.endsWith('</body></html>'));assert.ok(!html.includes('HTML_SOURCE'));
const roles=[...html.matchAll(/<button\b[^>]*\bdata-role="([^"]+)"[^>]*>/g)].map(m=>m[1]);assert.deepEqual(roles,['jinyiwei','yuzu','xiake','custom']);
const js=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];assert.equal(js.length,2);assert.equal((html.match(/<script\b/g)||[]).length,js.length);for(const [i,m]of js.entries())new vm.Script(m[1],{filename:'embedded-zero-floor-'+i+'.js'});
const source=fs.readFileSync(path.join(root,'零楼/零楼.html'),'utf8');assert.ok(html.includes(source));assert.ok(html.includes('ResizeObserver'));
const images=[...html.matchAll(/data:image\/([A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g)].map(m=>({mime:m[1],data:Buffer.from(m[2],'base64')}));assert.ok(images.length>0);assert.ok(images.every(i=>i.data.length>0));
for(const image of images){if(image.mime==='webp')assert.ok(image.data.toString('ascii',0,4)==='RIFF'&&image.data.toString('ascii',8,12)==='WEBP');else if(image.mime==='png')assert.equal(image.data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');else if(['jpg','jpeg'].includes(image.mime))assert.equal(image.data.subarray(0,2).toString('hex'),'ffd8');}
const bundle=JSON.parse(fs.readFileSync(path.join(root,'状态栏/状态栏正则.json'),'utf8'));assert.equal(hud.replaceString,bundle[0].replaceString);assert.equal(hud.findRegex,bundle[0].findRegex);assert.deepEqual(scripts.find(r=>r.scriptName===names[2]),bundle[1]);for(const config of bundle.slice(2)){const found=scripts.find(r=>r.scriptName===config.scriptName);for(const [k,v]of Object.entries(config))if(k!=='id')assert.deepEqual(found[k],v);}
const hudIndex=scripts.indexOf(hud);assert.equal(scripts[hudIndex+1].scriptName,names[2]);assert.equal(scripts[hudIndex+2].scriptName,'ZYX_03_流式传输防闪烁');
if(original){const supplement=fs.readFileSync(path.join(root,'状态栏/输出契约补充.txt'),'utf8').trim();const entry=card.data.character_book.entries.find(e=>e.comment==='【状态感知】态势感知仪表盘输出格式契约');const prior=original.data.character_book.entries.find(e=>e.comment===entry.comment);assert.equal(entry.content,prior.content.trimEnd()+'\n\n'+supplement);const omit=x=>{const y=structuredClone(x);y.data.extensions.regex_scripts=y.data.extensions.regex_scripts.filter(r=>!names.includes(r.scriptName));const e=y.data.character_book.entries.find(e=>e.comment==='【状态感知】态势感知仪表盘输出格式契约');e.content=e.content.replace(/<zyx_status_output_supplement>[^]*?<\/zyx_status_output_supplement>/g,'').trimEnd();return y;};assert.deepEqual(omit(card),omit(original),'除01/02/02B之外的内容发生变更');for(const name of names.filter(n=>n!==names[2]))assert.equal(scripts.find(r=>r.scriptName===name).id,original.data.extensions.regex_scripts.find(r=>r.scriptName===name).id);}
// 导入构建器会写派生产物，故仅在隔离临时目录调用同版打包器验证精确性/幂等。
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'zyx-product-check-'));
try{for(const rel of ['试用卡/pack-card.cjs','状态栏/apply.cjs','状态栏/build.cjs','状态栏/模板.html','状态栏/样式.css','状态栏/演示数据.json','状态栏/输出契约补充.txt','零楼/零楼.html']){const p=path.join(temp,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(path.join(root,rel),p);}const {patchCard}=require(path.join(temp,'试用卡/pack-card.cjs'));assert.deepEqual(patchCard(card),card,'打包非幂等');if(original)assert.deepEqual(patchCard(original),card,'成品不是当前源的完整打包结果');}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({result:'PASS',spec:card.spec,worldbookEntries:42,roles,scriptSyntaxChecks:js.length,embeddedImages:images.length,embeddedImageBytes:images.reduce((sum,i)=>sum+i.data.length,0),gatewayMatchesFirstMessageExactly:true,htmlCodeFenceCount:2,hudBundleExact:true,idempotent:true,comparedOriginal:!!original,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),limitation:'未在真实酒馆助手HTML代码块宿主中验收；未执行原卡脚本。'},null,2));
