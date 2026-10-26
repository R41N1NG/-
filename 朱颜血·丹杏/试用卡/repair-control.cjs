'use strict';
// gpt：用可维护模块重建HUD/输出协议，保持已提交开场桥、47世界书及其他规则。
const fs=require('node:fs'),path=require('node:path');
const {rule}=require('../状态栏/build.cjs');
const core=fs.readFileSync(path.join(__dirname,'../状态栏/核心输出协议.txt'),'utf8').trim();
function repairControl(input){
 const card=structuredClone(input),scripts=card?.data?.extensions?.regex_scripts;
 if(!Array.isArray(scripts))throw Error('缺角色正则');
 const hud=scripts.filter(r=>r.scriptName===rule.scriptName);if(hud.length!==1)throw Error('HUD02不唯一');
 Object.assign(hud[0],{findRegex:rule.findRegex,replaceString:rule.replaceString});
 const old=/<zyx_required_status_output>[^]*?<\/zyx_required_status_output>\s*$/;
 if(!old.test(card.data.description)||!old.test(card.data.extensions.depth_prompt?.prompt??''))throw Error('原生核心协议缺失，拒绝猜测注入位置');
 card.data.description=card.data.description.replace(old,core);
 card.data.extensions.depth_prompt.prompt=card.data.extensions.depth_prompt.prompt.replace(old,core);
 card.data.name=card.data.name.replace(/ · (?:开场地图修复3|中控修复4)$/,'')+' · 中控修复4';
 card.data.character_version=(card.data.character_version??'').replace(/\+(?:start-map-fix3|control-fix4)$/,'')+'+control-fix4';
 return card;
}
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node repair-control.cjs 上传卡.json 新卡.json');if(path.resolve(input)===path.resolve(output))throw Error('禁止覆盖输入');fs.writeFileSync(output,JSON.stringify(repairControl(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n',{flag:'wx'});}
module.exports={repairControl};
