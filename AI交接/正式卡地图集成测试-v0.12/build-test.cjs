'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),zlib=require('node:zlib');
const dir=__dirname,repo=path.resolve(dir,'../..'),output=path.join(dir,'产物');fs.mkdirSync(output,{recursive:true});
const read=name=>fs.readFileSync(path.join(dir,'src',name),'utf8');
const originalRuntime=fs.readFileSync(path.join(repo,'src/correction-runtime.js'),'utf8').trim();
const runtime=read('runtime-integrated.js'),core=read('engine-test.js')+'\n'+read('controller.cjs');
const map=fs.readFileSync(path.join(repo,'AI交接/地图事件链模板/幽寂谷-v0.2/map.jpg')).toString('base64');
const install=`(function(h){let r=h;try{if(h.parent?.document)r=h.parent;}catch(_){}r.Function(${JSON.stringify(core)})();})(window);\n`;
const host=read('host.js').replace('MAP_DATA','data:image/jpeg;base64,'+map);
const input=path.join(repo,'最新角色卡/仙姝堕.json'),card=JSON.parse(fs.readFileSync(input,'utf8')),original=structuredClone(card.data||card);
const profiles=Object.fromEntries(['赵无忧','自设','焚欲殿主','欢喜殿主','浊龙殿主','魂欢殿主'].map(name=>[name,{content:original.character_book.entries.find(e=>e.comment==='【身份】'+name)?.content.replace(/^@@.*$/gm,'')||'',greeting:original.alternate_greetings.find(g=>g.includes('<IdentityPick name="'+name+'"'))||''}]));
const inventorySource=original.extensions.tavern_helper.scripts.find(s=>s.name==='状态栏面板').content.match(/function defaultInventoryFor\(identity\) \{[\s\S]*?\n\}/)?.[0];if(!inventorySource)throw Error('身份初始物品源缺失');const inventoryContext={};vm.createContext(inventoryContext);vm.runInContext(inventorySource+';this.defaultInventoryFor=defaultInventoryFor;',inventoryContext);for(const name of Object.keys(profiles))profiles[name].inventory=JSON.parse(JSON.stringify(inventoryContext.defaultInventoryFor(name)));
const content=runtime+'\n'+install+'window.parent.YoujiguProfiles='+JSON.stringify(profiles)+';\n'+host;new vm.Script(content);fs.writeFileSync(path.join(output,'幽寂谷地图集成脚本.js'),content);
const data=structuredClone(original);data.name='仙姝堕·地图集成测试';data.character_version='map-integrated-test-0.12';data.creator_notes=(data.creator_notes||'')+'\n独立正式卡地图集成测试 v0.12：完整正式内容、GM与状态机保留，原六身份时点不改；幽寂谷仅三四月出现。新聊天、启用脚本与正则、强制刷新后使用。不要覆盖正式卡。';
data.extensions.world='仙姝堕·地图集成测试世界书';data.character_book.name=data.extensions.world;
data.extensions.depth_prompt.prompt+='\n若存在隐蔽地图事件导演指令，只在该事件中遵守它规定的地点、耗时和节点结果；事件外按原世界设定继续。仍须输出Status_block。';
function once(text,from,to,label){if(text.split(from).length!==2)throw Error(label+'锚点不唯一');return text.replace(from,to);}
for(const script of data.extensions.tavern_helper.scripts){
 let t=script.content.replace(/\r\n/g,'\n');t=once(t,originalRuntime,runtime.trim(),script.name+'共用运行时');
 if(script.name==='状态栏面板')t=once(t,'window.__xsdCorrection?.bindStatusEntry(container);','window.__xsdCorrection?.bindStatusEntry(container);try{(window.parent?.__youjiguTest||window.__youjiguTest)?.bind(container);}catch(_){}','HUD地图入口');
 if(script.name==='状态机'){
  t=once(t,'return Array.from(targets).filter(Boolean);',"return Array.from(targets).filter(n=>n==='仙姝堕·地图集成测试世界书');",'隔离身份世界书写入');
  t=once(t,"const candidate = allNames.find((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧')));","const candidate = allNames.find(n=>n==='仙姝堕·地图集成测试世界书');",'隔离世界书兜底');
  t=once(t,'function onAiMessageReceived(id, options = {}) {','async function onAiMessageReceived(id, options = {}) {','调度入口');
  t=once(t,"!Number.isFinite(Number(patch.仙盟历)) || Number(patch.仙盟历) <= 0 || !patch.仙盟历文","!Number.isFinite(Number(patch.仙盟历??draft.仙盟历)) || Number(patch.仙盟历??draft.仙盟历) <= 0 || !(patch.仙盟历文??draft.仙盟历文)",'日历规划继承事件值');
  const anchor="    const text = typeof options.rawText === 'string' && options.rawText ? options.rawText : messageText(n);";
  t=once(t,anchor,"    const mapBridge=window.parent?.__youjiguTest||window.__youjiguTest;\n    if(mapBridge?.beforeStatus){const decision=await mapBridge.beforeStatus(n);if(decision.defer)return {ok:true,skipped:'map-pending',mesid:n};}\n"+anchor,'地图先结算');
  t=once(t,'const protectedValue = service.protect(draft, value, chatId);',"const bridge=window.parent?.__youjiguTest||window.__youjiguTest;\n      const protectedValue = bridge?.filterStatusPatch?bridge.filterStatusPatch(draft,service.protect(draft,value,chatId)):service.protect(draft,value,chatId);",'字段所有权');
 }
 new vm.Script(t);script.content=t;
}
data.extensions.tavern_helper.scripts.push({type:'script',enabled:true,name:'幽寂谷地图集成测试',id:'youjigu-map-integrated-script',content,info:'独立正式卡集成候选，不覆盖正式卡',button:{enabled:false,buttons:[]},data:{}});
data.extensions.regex_scripts.push({id:'youjigu-result-hide-integrated',scriptName:'幽寂谷结果标记隐藏',findRegex:'<Youjigu_result[^>]*\\/>',replaceString:'',trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0});
// 同步v2/v3和兼容平面字段，防止导入选中旧顶层名或开场白。
for(const key of Object.keys(data)){card[key]=data[key];if(card.data)card.data[key]=data[key];}
card.creatorcomment=data.creator_notes;
const json=Buffer.from(JSON.stringify(card,null,2));fs.writeFileSync(path.join(output,data.name+'.json'),json);
const world={name:data.character_book.name,entries:{}};for(const [i,e]of data.character_book.entries.entries()){world.entries[i]={...e,...e.extensions,uid:e.id??i,key:e.keys||[],keysecondary:e.secondary_keys||[],order:e.insertion_order??100,disable:e.enabled===false,preventRecursion:e.extensions?.prevent_recursion??true,excludeRecursion:e.extensions?.exclude_recursion??true};}fs.writeFileSync(path.join(output,data.character_book.name+'.json'),JSON.stringify(world,null,2));
// 只替换PNG元数据，保留原PNG像素与其余块逐字节，不改图像。
const png=fs.readFileSync(path.join(repo,'最新角色卡/仙姝堕.png')),sig=png.subarray(0,8),chunks=[];if(!sig.equals(Buffer.from('89504e470d0a1a0a','hex')))throw Error('输入不是PNG');
let offset=8;while(offset<png.length){const size=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8),chunk=png.subarray(offset,offset+size+12),body=chunk.subarray(8,-4);if(['tEXt','zTXt','iTXt'].includes(type)&&['chara','ccv3'].includes(body.toString('utf8').split('\0')[0])){}else if(type!=='IEND')chunks.push(chunk);offset+=size+12;}
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,body){const name=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(body.length);c.writeUInt32BE(crc(Buffer.concat([name,body])));return Buffer.concat([n,name,body,c]);}
for(const key of ['chara','ccv3'])chunks.push(chunk('tEXt',Buffer.from(key+'\0'+json.toString('base64'))));chunks.push(chunk('IEND',Buffer.alloc(0)));fs.writeFileSync(path.join(output,data.name+'.png'),Buffer.concat([sig,...chunks]));
const hashes={input:{path:'最新角色卡/仙姝堕.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex')},files:{}};for(const name of fs.readdirSync(output)){if(name==='SHA256.json')continue;const b=fs.readFileSync(path.join(output,name));hashes.files[name]={bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};}fs.writeFileSync(path.join(output,'SHA256.json'),JSON.stringify(hashes,null,2));console.log(JSON.stringify(hashes,null,2));
