// gpt：复现本次上传backend-v2冲突，仅使用内存模拟宿主，不连接酒馆。
// 用法：node backend-v2复现.cjs 待复核卡.json
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const card=JSON.parse(fs.readFileSync(process.argv[2]));
const hud=card.data.extensions.regex_scripts.find(s=>s.scriptName.startsWith('ZYX_02_'));
const embedded=[...hud.replaceString.matchAll(/src="data:[^,]+,([^"]+)"/g)].map(m=>Buffer.from(m[1],'base64').toString());
if(embedded.length!==9)throw Error('此复现脚本仅针对本次上传v2的9脚本包');
const vars={},ctx={chatId:'a',characterId:0,characters:[card],chat:[{mes:card.data.alternate_greetings[0],extra:{}}]};
const w={console,structuredClone,setInterval:()=>0,clearInterval(){},addEventListener(){},SillyTavern:{getContext:()=>ctx},TavernHelper:{async setChatMessages(rows){for(const r of rows){ctx.chat[r.message_id].mes=r.message;ctx.chat[r.message_id].extra=r.extra;}},insertOrAssignVariables(v){Object.assign(vars,v)},getVariables(){return vars},async injectPrompts(p){w.injections=p}}};w.parent=w;w.top=w;w.window=w;const sandbox=vm.createContext(w);
(async()=>{
vm.runInContext(card.data.extensions.tavern_helper.scripts.find(s=>s.id==='danxing-backend-v1').content,sandbox);await w.DanxingBackend.sync();
console.log('independent backend',JSON.stringify({intelType:typeof vars.zyx_intel,nodesArray:Array.isArray(vars.zyx_nodes),time:vars.zyx_time.formatted}));
for(const i of [0,1,2,3,4])vm.runInContext(embedded[i],sandbox);
w.ZYXStateWriter.sync({chat:ctx.chat});console.log('after HUD writer',JSON.stringify({intelType:typeof vars.zyx_intel,nodesArray:Array.isArray(vars.zyx_nodes),time:vars.zyx_time.stamp}));
await w.DanxingBackend.sync();console.log('after backend sync again',JSON.stringify({intelType:typeof vars.zyx_intel,nodesArray:Array.isArray(vars.zyx_nodes),injectedIntel:JSON.parse(w.injections[0].content.split('\n')[1]).intel}));
const replay=(items)=>w.ZYXStateWriter.replay(items.map(x=>({mes:'x',...x})),{parseStatus:s=>JSON.parse(s)});const m=s=>({mes:JSON.stringify(s)});
const t=replay([m({time:'宣德五年四月初一 酉时',elapsed:'初至'}),m({time:'宣德五年七月二十 酉时',elapsed:'半刻钟'})]);console.log('half-ke after model future time',JSON.stringify({day:t.time.dayIndex,act:t.time.act}));
const neg=replay([m({time:'宣德五年四月初一 酉时',elapsed:'初至'}),m({elapsed:'半刻钟',clue:'没有告发，没人出山报案',intel_delta:'0'})]);console.log('negative keyword intel',neg.intel.val);
const hours=replay([m({time:'宣德五年四月初一 酉时',elapsed:'初至'}),...Array.from({length:12},()=>m({elapsed:'一个时辰'}))]);console.log('12 shichen',JSON.stringify({day:hours.time.dayIndex,clock:hours.time.clock}));
const rule=card.data.extensions.regex_scripts.find(x=>x.scriptName.startsWith('ZYX_02_'));for(const text of ['<status_bar><time>宣德五年四月初一 酉时</time><clue_obtained>0</clue_obtained><clues_gained>[]</clues_gained></status_bar>','<status_bar><time>宣德五年四月初一 酉时</time><favor_pose>常态</favor_pose><extra_char_3>无</extra_char_3><extra_char_4>无</extra_char_4></status_bar>'])console.log('HUD accepts protocol fragment',new RegExp('^(?:'+rule.findRegex+')$').test(text));
console.log('native depth missing new fields',!card.data.extensions.depth_prompt.prompt.includes('<favor_pose>'),!card.data.extensions.depth_prompt.prompt.includes('<intel_delta>'));
await w.DanxingBackend.stop();
})().catch(e=>{console.error(e);process.exitCode=1});
