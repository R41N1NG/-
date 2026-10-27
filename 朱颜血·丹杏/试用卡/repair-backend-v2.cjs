'use strict';
// gpt：在肥鱼v2上传卡上修，保留其情境立绘、四副人物、调换主次和图包配置。
const fs=require('node:fs');const {build}=require('../状态栏/v2界面/build.cjs');const {bundle}=require('../后台/build.cjs');
function repair(input){const card=structuredClone(input),ext=card.data.extensions,hud=ext.regex_scripts.filter(x=>x.scriptName==='ZYX_02_状态栏HUD渲染');if(hud.length!==1)throw Error('HUD不唯一');const result=build();Object.assign(hud[0],{findRegex:result.findRegex,replaceString:result.replaceString});
 const block=/<zyx_required_status_output>[^]*?<\/zyx_required_status_output>/;
 if(!block.test(card.data.description))throw Error('缺原协议');card.data.description=card.data.description.replace(block,result.core);ext.depth_prompt={...ext.depth_prompt,prompt:result.core,depth:0,role:'system'};
 for(const entry of card.data.character_book.entries){if(entry.id===48)entry.content='【独立后台真值约定】本次请求中的“丹杏后台当前真值”为唯一结算来源。官方知晓度、信物、羁押、大势与事件节点分开记录；未收到有效真值不得用默认日期/0点冒充已结算。已解锁人物的完整档案由后台按当前聊天在本次请求注入，不切换共享世界书开关。';if(entry.id===5){entry.content=entry.content.replace(/<FORMAT_RULE>[^]*?<\/FORMAT_RULE>/,result.core).replace('逢剧情快进可写跳跃后的时刻，严禁回退改时','time只作照抄；不得从模型日期推进时钟');if(!entry.content.includes('ZYX_STATUS_PROTOCOL_V8'))entry.content+='\n'+result.core;}}
 ext.tavern_helper.scripts=ext.tavern_helper.scripts.filter(s=>s.id!=='danxing-backend-v1'&&s.id!=='danxing-backend-v3');ext.tavern_helper.scripts.push({type:'script',enabled:true,id:'danxing-backend-v1',name:'丹杏·后台状态中枢',content:bundle(),info:'gpt：唯一独立写入器。V8协议、秒级时钟、官府事件去重、动态八人羁押。',button:{enabled:false,buttons:[]},data:{},export_with:{data:true,button:true}});ext.zyx_backend={schema:1,release:'backend-v3'};
 card.data.name=card.data.name.replace(/ · (?:后台接入5|中控修复4|后台修复6)$/,'')+' · 后台修复6';card.data.character_version=(card.data.character_version||'').replace(/\+backend-v\d+$/,'')+'+backend-v3';return card;}
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node repair-backend-v2.cjs 输入v2.json 输出v3.json');fs.writeFileSync(output,JSON.stringify(repair(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
module.exports={repair};
