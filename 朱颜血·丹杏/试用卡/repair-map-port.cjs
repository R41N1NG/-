'use strict';
// gpt：定点修地图配置、地图模块与图片样式，保留上传版其他HUD脚本、美术和后台。
const fs=require('node:fs'),path=require('node:path');
const config=require('../状态栏/v2界面/配置.js');
function repair(input){const card=structuredClone(input),hud=card.data.extensions.regex_scripts.find(s=>s.scriptName==='ZYX_02_状态栏HUD渲染');if(!hud)throw Error('缺少HUD');let configs=0,maps=0;
 hud.replaceString=hud.replaceString.replace(/(<script\b[^>]*src="data:text\/javascript;charset=utf-8;base64,)([A-Za-z0-9+/=]+)("[^>]*><\/script>)/g,(whole,start,b64,end)=>{let code=Buffer.from(b64,'base64').toString();if(code.includes('root.ZYX_HUD_CONFIG = ZYXConfig')){const pattern=/    maps: \{[\s\S]*?\n    \}/g;let count=0;code=code.replace(pattern,()=>{count++;return '    maps: '+JSON.stringify(config.maps,null,2).replace(/\n/g,'\n    ');});if(count!==1)throw Error('地图配置块不唯一');configs++;}else if(code.includes('window.ZYXMapPanel = ')){code=fs.readFileSync(path.join(__dirname,'../状态栏/v2界面/地图.js'),'utf8');maps++;}else return whole;return start+Buffer.from(code).toString('base64')+end;});
 if(configs!==1||maps!==1)throw Error('地图配置/模块不唯一');const css=fs.readFileSync(path.join(__dirname,'../状态栏/地图样式.css'),'utf8');if(!hud.replaceString.includes(css))hud.replaceString=hud.replaceString.replace('</head>','<style data-zyx-map-styles>\n'+css+'\n</style></head>');card.data.extensions.zyx_maps={version:1,defaultMapId:'region',maps:['region','world']};return card;}
module.exports={repair};
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node repair-map-port.cjs 输入.json 输出.json');fs.writeFileSync(output,JSON.stringify(repair(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
