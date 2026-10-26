'use strict';
const fs=require('node:fs'),path=require('node:path');
const {repairControl}=require('./repair-control.cjs');
const {bundle}=require('../后台/build.cjs');
function installBackend(input){
 const card=repairControl(input),ext=card.data.extensions;
 const previous=ext.tavern_helper??{scripts:[]};if(!Array.isArray(previous.scripts))throw Error('无法识别原有酒馆助手脚本格式');
 const script={type:'script',enabled:true,id:'danxing-backend-v1',name:'丹杏·后台状态中枢',content:bundle(),info:'独立监听八人羁押、时间、信物情报与场所节点；聊天级快照；需酒馆助手。',button:{enabled:false,buttons:[]},data:{},export_with:{data:true,button:true}};
 ext.tavern_helper={...previous,scripts:[...previous.scripts.filter(s=>s.id!==script.id),script]};
 ext.zyx_backend={schema:1,release:'backend-v1'};
 card.data.name=card.data.name.replace(/ · 中控修复4$/,'')+' · 后台接入5';
 card.data.character_version=card.data.character_version.replace(/\+control-fix4$/,'')+'+backend-v1';
 return card;
}
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node install-backend.cjs 旧卡.json 新卡.json');if(path.resolve(input)===path.resolve(output))throw Error('禁止覆盖原卡');fs.writeFileSync(output,JSON.stringify(installBackend(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n',{flag:'wx'});}
module.exports={installBackend};
