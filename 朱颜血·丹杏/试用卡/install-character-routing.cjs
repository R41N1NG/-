'use strict';
const fs=require('node:fs'),path=require('node:path'),{bundle}=require('../后台/build.cjs'),cfg=require('../后台/规则.json');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
function install(input){const card=structuredClone(input),d=card.data;const backend=d.extensions.tavern_helper.scripts.filter(s=>s.id==='danxing-backend-v1');if(backend.length!==1)throw Error('后台不唯一');
 for(const [id,name]of Object.entries({24:'谢云素',25:'封德明',26:'陆寒渊',27:'宁安郡主',28:'青萝'})){const e=d.character_book.entries.find(e=>String(e.id)===id);if(!e||e.content!==cfg.npcProfiles[name])throw Error('人物档案变更，须先同步配置：'+name);e.enabled=false;e.extensions={...e.extensions,zyx_node_managed:true};}
 backend[0].content=bundle();
 const hud=d.extensions.regex_scripts.find(s=>s.scriptName==='ZYX_02_状态栏HUD渲染');let portraits=0,oldWriters=0;
 hud.replaceString=hud.replaceString.replace(/(<script\b[^>]*src="data:text\/javascript;charset=utf-8;base64,)([A-Za-z0-9+/=]+)("[^>]*><\/script>)/g,(all,start,b64,end)=>{
  let code=Buffer.from(b64,'base64').toString();if(code.includes('const PortraitLibrary = ')){code=read('../状态栏/v2界面/立绘.js');portraits++;}
  else if(code.includes('zyx_state_writer.js')||code.includes('旧HUD只读兼容入口')){code=read('../后台/指纹.js')+'\n'+read('../状态栏/后台投影.js')+'\n'+read('../状态栏/旧HUD只读兼容.js');oldWriters++;}
  else if(code.includes('portraitPoses=new Set(')){code=code.replace("['常态','拔剑'","['常态','战斗','拔剑'");}
  else return all;return start+Buffer.from(code).toString('base64')+end;
 });if(portraits!==1||oldWriters!==1)throw Error('立绘或旧写入器不唯一');
 for(const e of d.character_book.entries)e.content=e.content.replaceAll('常态/拔剑/哭泣/惊恐/愣住/事后/牢狱/关押','常态/战斗/拔剑/哭泣/惊恐/愣住/事后/牢狱/关押');
 const old='常态/拔剑/哭泣/惊恐/愣住/事后/牢狱/关押';d.extensions.depth_prompt.prompt=d.extensions.depth_prompt.prompt.replaceAll(old,'常态/战斗/拔剑/哭泣/惊恐/愣住/事后/牢狱/关押');
 d.extensions.zyx_character_routing={version:1,identity:'chat-scoped',npc:'node-scoped',qingluoCombatPortrait:'影雀'};return card;}
module.exports={install};
if(require.main===module){const[,,input,output]=process.argv;fs.writeFileSync(output,JSON.stringify(install(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
