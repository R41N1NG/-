'use strict';
// gpt：按身份自动选择已有开场；地图使用图包端口。其余卡内容沿用功能修复2。
const fs=require('node:fs'),path=require('node:path');
const {rule}=require('../状态栏/build.cjs');
const bridge=fs.readFileSync(path.join(__dirname,'../零楼/开场跳转.js'),'utf8');
const script=(code,label)=>'<script data-zyx-opening-'+label+'="v1" src="data:text/javascript;charset=utf-8;base64,'+Buffer.from(code).toString('base64')+'"></script>';
function repairStartMap(input){
 const card=structuredClone(input),scripts=card?.data?.extensions?.regex_scripts;
 if(!Array.isArray(scripts)||card.data.alternate_greetings?.length!==4)throw Error('需要含四身份开场的本次角色卡');
 const gateways=scripts.filter(r=>r.scriptName==='ZYX_01_网关界面渲染 (零楼启动)'),huds=scripts.filter(r=>r.scriptName===rule.scriptName);
 if(gateways.length!==1||huds.length!==1)throw Error('01/02不唯一');
 const gateway=gateways[0];let html=gateway.replaceString;
 if(!/^```html\n/.test(html)||!html.endsWith('\n```'))throw Error('零楼缺HTML代码块入口，请先完成零楼修复');
 html=html.slice(8,-4).replace(/<script data-zyx-opening-(?:config|bridge)="v1"[^>]*><\/script>\n?/g,'');
 // 只在最终确认时同步身份，配置与确认均不改共享世界书；选中的身份规则随该聊天卷宗保存。
 let found=false;
 html=html.replace(/<script src="data:text\/javascript;charset=utf-8;base64,([A-Za-z0-9+/=]+)"><\/script>/g,(full,b64)=>{
  let source=Buffer.from(b64,'base64').toString('utf8');
  if(!source.includes('window.ZYX_ZERO_ACTION = function'))return full;
  found=true;
  source=source.replace('    void syncIdentity(id, role.title);','    // 配置预览不改共享身份变量或世界书。').replace('    void syncIdentity(selectedRole, roles[selectedRole].title);','    // 身份规则随当前零楼卷宗保存，不改共享世界书。');
  return '<script src="data:text/javascript;charset=utf-8;base64,'+Buffer.from(source).toString('base64')+'"></script>';
 });
 if(!found)throw Error('不是已知零楼控制器，拒绝拼接未知提交方式');
 html=html.replace('确认档案 · 生成卷宗','确认身份 · 进入开场').replace('踏入江湖 · 填入输入栏','重试进入对应身份开场').replace('确认后填入酒馆输入栏，由你检查并发送第一条消息。','确认身份后进入对应开场；如切换失败，可在这里重试或返回检查。');
 const labels=['【身份】锦衣缇骑','【身份】黑狱差役','【身份】江湖任侠','【身份】自设游侠'];
 const identityRules=labels.map(label=>{const found=card.data.character_book.entries.filter(e=>(e.name||e.comment)===label);if(found.length!==1||typeof found[0].content!=='string'||!found[0].content.trim())throw Error('身份规则缺失或不唯一：'+label);return found[0].content;});
 const config={gateway:card.data.first_mes,greetings:card.data.alternate_greetings,identityRules};
 const additions=script('window.ZYX_OPENING_CONFIG='+JSON.stringify(config)+';','config')+'\n'+script(bridge,'bridge');
 html=html.replace('</body>',additions+'\n</body>');
 gateway.replaceString='```html\n'+html.trim()+'\n```';
 Object.assign(huds[0],{findRegex:rule.findRegex,replaceString:rule.replaceString});
 card.data.name=card.data.name.replace(/ · (?:功能修复2|开场地图修复3)$/,'')+' · 开场地图修复3';
 card.data.character_version=(card.data.character_version??'').replace(/\+(?:hud-fix2|start-map-fix3)$/,'')+'+start-map-fix3';
 return card;
}
if(require.main===module){const [,,input,output]=process.argv;if(!input||!output)throw Error('用法：node repair-start-map.cjs 当前卡.json 新卡.json');if(path.resolve(input)===path.resolve(output))throw Error('禁止覆盖输入');fs.writeFileSync(output,JSON.stringify(repairStartMap(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n',{flag:'wx'});}
module.exports={repairStartMap};
