'use strict';
// gpt：仅同步零楼开场桥接器，保留发布卡其他全部内容。
const fs=require('node:fs'),path=require('node:path');
function install(input){const card=structuredClone(input),rule=card.data.extensions.regex_scripts.find(s=>s.scriptName.startsWith('ZYX_01_'));if(!rule)throw Error('缺少零楼规则');let count=0;const code=fs.readFileSync(path.join(__dirname,'../零楼/开场跳转.js'),'utf8');rule.replaceString=rule.replaceString.replace(/(<script\b[^>]*src="data:text\/javascript;charset=utf-8;base64,)([A-Za-z0-9+/=]+)("[^>]*><\/script>)/g,(all,start,b64,end)=>{const old=Buffer.from(b64,'base64').toString();if(!old.includes('global.ZYXOpeningBridge=api'))return all;count++;return start+Buffer.from(code).toString('base64')+end;});if(count!==1)throw Error('开场桥接器不唯一');return card;}
module.exports={install};
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node install-opening-draft.cjs 输入.json 输出.json');fs.writeFileSync(output,JSON.stringify(install(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
