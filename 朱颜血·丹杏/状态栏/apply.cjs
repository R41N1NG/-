'use strict';
// 用法：node apply.cjs 输入卡.json 输出卡.json；不修改输入，不触碰零楼与世界书。
const fs=require('node:fs');const path=require('node:path');
const {rule,guardRule,missingRule,streamRule,historyRule}=require('./build.cjs');
function patch(card){
 const result=structuredClone(card),scripts=result?.data?.extensions?.regex_scripts;
 if(!Array.isArray(scripts))throw new Error('不是含正则配置的CCv3角色卡');
 const matches=scripts.map((r,i)=>r.scriptName==='ZYX_02_状态栏HUD渲染'?i:-1).filter(i=>i>=0);
 if(matches.length!==1)throw new Error('必须恰好找到一条原状态栏规则，拒绝猜测或追加重复规则');
 const i=matches[0];scripts[i]={...scripts[i],...rule,id:scripts[i].id};
 const guards=scripts.map((r,i)=>r.scriptName===guardRule.scriptName?i:-1).filter(i=>i>=0);
 if(guards.length>1)throw new Error('异常保护规则重复，拒绝猜测');
 if(guards.length) scripts.splice(guards[0],1);
 const hudIndex=scripts.findIndex(r=>r.scriptName===rule.scriptName);
 scripts.splice(hudIndex+1,0,{...guardRule});
 // 03必须只作用显示层，不能在持久化之前抹掉状态数据。
 // 04只处理AI历史提示词，保留depth=0—2的最近记录，不清理用户正文。
 const related=[missingRule,streamRule,historyRule].map(config=>{
   const matches=scripts.filter(r=>r.scriptName===config.scriptName);
   if(matches.length>1)throw new Error('状态栏辅助规则重复，拒绝猜测');
   return {...matches[0],...config,id:matches[0]?.id??config.id};
 });
 for(let index=scripts.length-1;index>=0;index--)if(related.some(r=>r.scriptName===scripts[index].scriptName))scripts.splice(index,1);
 const afterGuard=scripts.findIndex(r=>r.scriptName===guardRule.scriptName)+1;
 scripts.splice(afterGuard,0,...related);
 return result;
}
if(require.main===module){
 const[, ,input,output]=process.argv;
 if(!input||!output)throw new Error('请提供输入及输出JSON路径');
 if(path.resolve(input)===path.resolve(output))throw new Error('输出不得覆盖输入原卡');
 if(fs.existsSync(output))throw new Error('输出路径已存在，请换一个新文件名');
 const next=patch(JSON.parse(fs.readFileSync(input,'utf8')));fs.writeFileSync(output,JSON.stringify(next,null,2)+'\n',{flag:'wx'});console.log('已生成替换HUD并加入异常记录保护的新卡：'+output);
}
module.exports={patch};
