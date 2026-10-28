'use strict';
// gpt：修世界书境界与关键词，NPC运行档案从这份卡重编，保留节点门控。
const fs=require('node:fs'),{install}=require('./install-character-routing.cjs');
const KEYWORDS={
 6:['神仙岭','杏花村','杏花村客栈'],
 7:['神仙岭险道','神仙岭隘口','险道隘口','一线峡','一线石峡','绝岭截击点','落石隘口'],
 9:['长宁县城','长宁县','长宁县衙','悦来客栈'],
 15:['罗霄派','罗霄门','罗霄剑派'],
 16:['白莲教','红阳派','红阳真人','白莲妖女'],
 18:['白雪莲','雪莲','白捕快','白公差'],
 19:['薛霜灵','霜灵','薛姑娘'],
 20:['裴丹杏','丹娘','白夫人','杏花村老板娘','杏花村客栈老板娘'],
 21:['白玉莲','玉莲'],
 22:['裴青玉','青玉','玉娘','潇潇','徐家遗孀'],
 23:['白孝儒','白老童生'],
 24:['谢云素','云素','谢长老','罗霄派三长老','罗霄派传功宿老'],
 25:['封德明','封公公','封总管','东厂巡察使'],
 26:['陆寒渊','陆总旗','陆远','陆掌柜'],
 27:['朱仪瑄','宁安郡主','宣姑娘','仪瑄'],
 28:['青萝','影雀','侍卫青萝'],
 29:['孙天羽','天羽','孙差爷'],
 30:['卓天雄','卓爷'],
 31:['阎罗望','阎大人','阎狱正','阎牢头'],
 35:['罗霄混元气','混元气秘笈'],
};
function update(input){let card=structuredClone(input);const entries=card.data.character_book.entries;
 const martial=entries.find(e=>e.id===2),xie=entries.find(e=>e.id===24);if(!martial||!xie)throw Error('缺少目标条目');
 martial.content=martial.content.replace(/绝巅天堑 \(半步天人与化境\):[^\n]*/, '绝巅天堑 (半步天人与化境): 暂无');
 xie.content=xie.content.replaceAll('绝顶·先天初境圆满','先天·绝顶初境圆满').replaceAll('武学境界: 绝顶（先天初境圆满；','武学境界: 先天·绝顶初境圆满（');
 for(const e of entries)if(KEYWORDS[e.id])e.keys=[...KEYWORDS[e.id]];
 const hud=card.data.extensions.regex_scripts.find(s=>s.scriptName==='ZYX_02_状态栏HUD渲染');
 hud.replaceString=hud.replaceString.replace(/(<script\b[^>]*src="data:text\/javascript;charset=utf-8;base64,)([A-Za-z0-9+/=]+)("[^>]*><\/script>)/g,(all,start,b64,end)=>{const old=Buffer.from(b64,'base64').toString(),code=old.replaceAll('绝顶·先天初境圆满','先天·绝顶初境圆满').replace(/(key:\s*'xieyunsu',[\s\S]*?realm:\s*)'[^']*'/,"$1'先天·绝顶初境圆满'");return old===code?all:start+Buffer.from(code).toString('base64')+end;});
 return install(card);
}
module.exports={update,KEYWORDS};
if(require.main===module){const[,,input,output]=process.argv;fs.writeFileSync(output,JSON.stringify(update(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');}
