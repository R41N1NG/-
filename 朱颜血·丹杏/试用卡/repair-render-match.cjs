'use strict';
// gpt：只修复上传卡漂移的HUD匹配规则；界面、独立后台和用户内容逐字保留。
const fs=require('node:fs'),{findRegex}=require('../状态栏/v2界面/协议.cjs');
function repair(input){const card=structuredClone(input),rules=card.data.extensions.regex_scripts.filter(s=>s.scriptName==='ZYX_02_状态栏HUD渲染');if(rules.length!==1)throw Error('HUD规则不唯一');rules[0].findRegex=findRegex;return card;}
module.exports={repair};
if(require.main===module){const[,,input,output]=process.argv;if(!input||!output)throw Error('用法：node repair-render-match.cjs 输入.json 输出.json');fs.writeFileSync(output,JSON.stringify(repair(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
