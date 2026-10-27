'use strict';
// gpt：只更新HUD地图与交付标记，保留已验证后台、开场和世界书。
const fs=require('node:fs'),{build}=require('../状态栏/v2界面/build.cjs');
function install(input){const card=structuredClone(input),ext=card.data.extensions,result=build();const matches=ext.regex_scripts.filter(rule=>rule.scriptName==='ZYX_02_状态栏HUD渲染');if(matches.length!==1)throw Error('HUD不唯一');Object.assign(matches[0],{findRegex:result.findRegex,replaceString:result.replaceString});ext.zyx_maps={version:1,defaultMapId:'region',maps:['region','world']};card.data.name=card.data.name.replace(/ · (?:七项修复7|地图接入8)$/,'')+' · 地图接入8';card.data.character_version=card.data.character_version.replace(/\+maps-v\d+$/,'')+'+maps-v1';return card;}
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node install-maps.cjs 已修复卡.json 地图接入卡.json');fs.writeFileSync(output,JSON.stringify(install(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
module.exports={install};
