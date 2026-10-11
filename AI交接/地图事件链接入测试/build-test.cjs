'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),zlib=require('node:zlib');
const dir=__dirname,repo=path.resolve(dir,'../..'),output=path.join(dir,'产物');fs.mkdirSync(output,{recursive:true});
const read=name=>fs.readFileSync(path.join(dir,'src',name),'utf8');
const runtime=read('runtime-test.js'),core=read('engine-test.js')+'\n'+read('controller.cjs');
const map=fs.readFileSync(path.join(repo,'AI交接/地图事件链模板/幽寂谷-v0.2/map.jpg')).toString('base64');
const install=`(function(h){let r=h;try{if(h.parent?.document)r=h.parent;}catch(_){}r.Function(${JSON.stringify(core)})();})(window);\n`;
const host=read('host.js').replace('MAP_DATA','data:image/jpeg;base64,'+map);
const content=runtime+'\n'+install+host;new vm.Script(content);
fs.writeFileSync(path.join(output,'幽寂谷地图接入测试脚本.js'),content);
const input=path.join(repo,'最新角色卡/仙姝堕.json'),card=JSON.parse(fs.readFileSync(input,'utf8'));
const entry={id:0,keys:[],secondary_keys:[],comment:'地图接入测试边界',content:'这是独立的幽寂谷地图事件链接入试验。只根据脚本提供的当前步骤叙述，不自行改变世界日期，不凭自由对话授予物品或推进任务。正式奖励名称和退出耗时未定，测试值不代表正式设定。',constant:true,selective:false,insertion_order:0,enabled:true,position:'before_char',extensions:{prevent_recursion:true,exclude_recursion:true,selectiveLogic:0,scan_depth:1}};
const data={name:'幽寂谷地图接入测试卡',description:'南疆幽寂谷地图事件链独立测试。自由活动与固定节点选择结合；只能用地图按钮推进关键分支。当前正式剧情未填，叙述克制的探索环境，不编造宝物名称或未知设定。',personality:'忠实遵守脚本当前步骤与结算回执。',scenario:'玩家在幽寂谷进行独立地图试验。日期、物品、互斥及轮数均由后台管理。',first_mes:'【幽寂谷地图接入测试】\n\n请启用酒馆助手卡内脚本，点击右下角“打开测试地图”，选择身份和测试日期。\n按钮会填入行动到输入栏，由你确认发送。普通自由对话只消耗选项轮数，不推进世界时间。\n这是独立测试卡，不使用或修改正式世界书。',mes_example:'',creator_notes:'独立接入测试 v0.3。正式GM/HUD/旧状态机不运行；本卡只用测试事件和同契约事务运行时。须在新聊天中试验。不要覆盖仙姝堕正式卡。',system_prompt:'按脚本提供的当前步骤演绎，角色不能知道尚未选择的分支或未取得物品。模型不计算世界时间、不自行发奖，不输出后台代码。',post_history_instructions:'以最新“幽寂谷地图测试·脚本状态”为准。不输出Status_block或UpdateVariable。结算时仅总结已核实回执，勿继续故事。',tags:['地图接入测试','幽寂谷'],creator:'gpt · 测试版',character_version:'map-test-0.3',alternate_greetings:[],group_only_greetings:[],extensions:{world:'幽寂谷地图接入测试世界书',tavern_helper:{scripts:[{type:'script',enabled:true,name:'幽寂谷地图接入测试',id:'youjigu-map-test-script',content,info:'独立事件测试，不并入正式世界书',button:{enabled:false,buttons:[]},data:{}}]},regex_scripts:[],depth_prompt:{prompt:'只执行当前步骤。世界日期和奖励以脚本回执为准；普通对话不得推进世界日期。',depth:0,role:'system'}},character_book:{name:'幽寂谷地图接入测试世界书',entries:[entry]}};
// 同步v2/v3和兼容平面字段，防止导入选中旧顶层名或开场白。
for(const key of Object.keys(data)){card[key]=data[key];if(card.data)card.data[key]=data[key];}
card.creatorcomment=data.creator_notes;
const json=Buffer.from(JSON.stringify(card,null,2));fs.writeFileSync(path.join(output,data.name+'.json'),json);
const world={name:data.character_book.name,entries:{0:{uid:0,key:[],keysecondary:[],comment:entry.comment,content:entry.content,constant:true,selective:false,order:0,position:0,disable:false,preventRecursion:true,excludeRecursion:true,selectiveLogic:0,scanDepth:1}}};fs.writeFileSync(path.join(output,world.name+'.json'),JSON.stringify(world,null,2));
// 只替换PNG元数据，保留原PNG像素与其余块逐字节，不改图像。
const png=fs.readFileSync(path.join(repo,'最新角色卡/仙姝堕.png')),sig=png.subarray(0,8),chunks=[];if(!sig.equals(Buffer.from('89504e470d0a1a0a','hex')))throw Error('输入不是PNG');
let offset=8;while(offset<png.length){const size=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8),chunk=png.subarray(offset,offset+size+12),body=chunk.subarray(8,-4);if(['tEXt','zTXt','iTXt'].includes(type)&&['chara','ccv3'].includes(body.toString('utf8').split('\0')[0])){}else if(type!=='IEND')chunks.push(chunk);offset+=size+12;}
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,body){const name=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(body.length);c.writeUInt32BE(crc(Buffer.concat([name,body])));return Buffer.concat([n,name,body,c]);}
for(const key of ['chara','ccv3'])chunks.push(chunk('tEXt',Buffer.from(key+'\0'+json.toString('base64'))));chunks.push(chunk('IEND',Buffer.alloc(0)));fs.writeFileSync(path.join(output,data.name+'.png'),Buffer.concat([sig,...chunks]));
const hashes={input:{path:'最新角色卡/仙姝堕.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex')},files:{}};for(const name of fs.readdirSync(output)){if(name==='SHA256.json')continue;const b=fs.readFileSync(path.join(output,name));hashes.files[name]={bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};}fs.writeFileSync(path.join(output,'SHA256.json'),JSON.stringify(hashes,null,2));console.log(JSON.stringify(hashes,null,2));
