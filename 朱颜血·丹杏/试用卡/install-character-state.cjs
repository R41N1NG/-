'use strict';
const fs=require('node:fs'),{install:route}=require('./install-character-routing.cjs'),{install:opening}=require('./install-opening-draft.cjs'),{core,findRegex}=require('../状态栏/v2界面/协议.cjs');
function install(input){const card=opening(route(input)),d=card.data;d.extensions.depth_prompt.prompt=core;
 const hud=d.extensions.regex_scripts.find(s=>s.scriptName==='ZYX_02_状态栏HUD渲染');hud.findRegex=findRegex;
 const entry=d.character_book.entries.find(e=>e.id===5);if(entry)entry.content=core;
 d.extensions.zyx_character_state={version:2,identityWorldbook:'native-primary-exclusive',characters:'full-roster-known-facts-only'};return card;}
module.exports={install};
if(require.main===module){const[,,input,output]=process.argv;fs.writeFileSync(output,JSON.stringify(install(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
