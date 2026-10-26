'use strict';
// gpt：在用户上传派生卡上仅替换HUD02，保留47条世界书、四开场及已修零楼。
const fs=require('node:fs'),path=require('node:path');
const {rule}=require('../状态栏/build.cjs');
function repairHudCard(input){
 const result=structuredClone(input),scripts=result?.data?.extensions?.regex_scripts;
 if(!Array.isArray(scripts))throw new Error('缺角色正则');
 const matches=scripts.filter(item=>item.scriptName===rule.scriptName);
 if(matches.length!==1)throw new Error('HUD02不唯一，拒绝猜测');
 if(matches[0].disabled||!matches[0].markdownOnly||matches[0].promptOnly)throw new Error('HUD02阶段或启用设置异常，须先检查');
 Object.assign(matches[0],{findRegex:rule.findRegex,replaceString:rule.replaceString});
 result.data.name=result.data.name.replace(/ · (?:零楼修复1|功能修复2)$/,'')+' · 功能修复2';
 result.data.character_version=(result.data.character_version??'').replace(/\+(?:zero-fix1|hud-fix2)$/,'')+'+hud-fix2';
 return result;
}
if(require.main===module){
 const [,,input,output]=process.argv;if(!input||!output)throw new Error('用法：node repair-hud.cjs 当前卡.json 输出新卡.json');
 if(path.resolve(input)===path.resolve(output))throw new Error('禁止覆盖输入');
 fs.writeFileSync(output,JSON.stringify(repairHudCard(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n',{flag:'wx'});
 console.log('仅HUD02已修复：'+output);
}
module.exports={repairHudCard};
