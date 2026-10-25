'use strict';
// gpt 下级：真实上游角色字段→原生深度提示四行检查；不执行附件脚本或实际发出请求。
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),os=require('node:os'),crypto=require('node:crypto');
const dir=__dirname,root=path.resolve(dir,'..');
const file=path.resolve(process.argv[2]||path.join(root,'试用卡/【朱颜血·丹杏】CCv3-刑狱状态栏试用.json'));
const bytes=fs.readFileSync(file),card=JSON.parse(bytes),core=fs.readFileSync(path.join(dir,'核心输出协议.txt'),'utf8').trim();
const original=process.argv[3]?JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8')):null;
const marker='ZYX_STATUS_PROTOCOL_V4',calls=[],macroCalls=[],roles=[];
let worldbookReads=0;
const context=vm.createContext({
 characters:[{data:card.data}],this_chid:0,selected_group:null,
 power_user:{persona_description:'',prefer_character_prompt:false,prefer_character_jailbreak:false},chat_metadata:{},
 world_info:[],getWorldInfoPrompt:()=>{worldbookReads++;throw Error('本测试不加载世界书');},
 getGroupCharacterCardsLazy:()=>{throw Error('本测试不进入群聊');},
 baseChatReplace:value=>{macroCalls.push(value);return typeof value==='string'?value:'';},
 extension_settings:{note:{allowWIScan:false}},inject_ids:{DEPTH_PROMPT:'test-character-depth'},
 setExtensionPrompt:(...args)=>calls.push(args),
});
new vm.Script(fs.readFileSync(path.join(dir,'提示注入fixture/角色字段惰性读取.js'),'utf8')).runInContext(context);
// 角色名转枚举是本测试的宿主边界；SYSTEM/IN_CHAT本身取上游真实枚举。
context.recordRole=name=>roles.push(name);
new vm.Script('function getExtensionPromptRoleByName(name){recordRole(name);if(name!=="system")throw Error("本测试仅system角色");return extension_prompt_roles.SYSTEM;}').runInContext(context);
new vm.Script(fs.readFileSync(path.join(dir,'提示注入fixture/非群聊深度注入.js'),'utf8')).runInContext(context);
const api=new vm.Script('({getCharacterCardFieldsLazy,injectCharacterDepth,extension_prompt_types,extension_prompt_roles})').runInContext(context);
const checks=[];function check(name,fn){fn();checks.push({name,pass:true});}
let lazy,depthText;
check('关闭角色system与越狱偏好、未加载世界书时惰性深度字段仍读取V4',()=>{lazy=api.getCharacterCardFieldsLazy();assert.equal(macroCalls.length,0);assert.equal(lazy.system,'');assert.equal(lazy.jailbreak,'');depthText=lazy.charDepthPrompt;assert.ok(depthText.includes(marker));assert.ok(depthText.includes('<status_bar>'));assert.equal(depthText,core);assert.equal(worldbookReads,0);assert.equal(macroCalls.length,1);assert.equal(lazy.charDepthPrompt,depthText);assert.equal(macroCalls.length,1);});
check('原生非群聊四行产生IN_CHAT/depth0/system的真实调用参数',()=>{api.injectCharacterDepth(depthText);assert.equal(calls.length,1);const [id,text,type,depth,scan,role]=calls[0];assert.equal(id,'test-character-depth');assert.equal(text,core);assert.ok(text.includes(marker));assert.ok(text.includes('<status_bar>'));assert.equal(type,api.extension_prompt_types.IN_CHAT);assert.equal(type,1);assert.equal(depth,0);assert.equal(role,api.extension_prompt_roles.SYSTEM);assert.equal(role,0);assert.equal(scan,false);assert.deepEqual(roles,['system']);assert.equal(worldbookReads,0);});
check('description备援及depth_prompt各一份核心，原世界书无附加协议',()=>{const dp=card.data.extensions.depth_prompt;assert.equal(dp.depth,0);assert.equal(dp.role,'system');for(const text of [dp.prompt,card.data.description]){assert.equal((text.match(/<zyx_required_status_output>/g)||[]).length,1);assert.equal((text.match(/<\/zyx_required_status_output>/g)||[]).length,1);assert.equal((text.match(/ZYX_STATUS_PROTOCOL_V4/g)||[]).length,1);assert.ok(text.endsWith(core));}assert.equal(card.data.character_book.entries.length,42);assert.ok(!card.data.character_book.entries.some(e=>e.content.includes('<zyx_required_status_output>')||e.content.includes('<zyx_status_output_supplement>')));});
if(original)check('原始无depth_prompt时其他extensions及世界书保持',()=>{assert.ok(!Object.hasOwn(original.data.extensions,'depth_prompt'));const strip=e=>{const out=structuredClone(e);delete out.depth_prompt;delete out.regex_scripts;return out;};assert.deepEqual(strip(card.data.extensions),strip(original.data.extensions));assert.deepEqual(card.data.character_book,original.data.character_book);assert.equal(card.data.system_prompt,original.data.system_prompt);assert.equal(card.data.post_history_instructions,original.data.post_history_instructions);});
check('同版真实打包器重包不重复depth核心，成品与当前源一致',()=>{const temp=fs.mkdtempSync(path.join(os.tmpdir(),'zyx-depth-check-'));try{for(const rel of ['试用卡/pack-card.cjs','状态栏/apply.cjs','状态栏/build.cjs','状态栏/模板.html','状态栏/样式.css','状态栏/演示数据.json','状态栏/核心输出协议.txt','零楼/零楼.html']){const p=path.join(temp,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(path.join(root,rel),p);}const {patchCard}=require(path.join(temp,'试用卡/pack-card.cjs'));assert.deepEqual(patchCard(card),card);if(original)assert.deepEqual(patchCard(original),card);}finally{fs.rmSync(temp,{recursive:true,force:true});}});
console.log(JSON.stringify({result:'PASS',checks:checks.length,results:checks,proof:{marker,promptIncludesStatus:depthText.includes('<status_bar>'),extensionPromptType:calls[0][2],depth:calls[0][3],role:calls[0][5],preferCharacterPrompt:false,preferCharacterJailbreak:false,worldbookReads},sha256:crypto.createHash('sha256').update(bytes).digest('hex'),limitation:'证明同版卡配置经摘取的上游原生链进入setExtensionPrompt调用参数；不是用户端最终模型请求或模型遵从实证。'},null,2));
