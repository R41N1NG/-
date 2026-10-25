'use strict';
// gpt：完整打包零楼及HUD。原卡首条消息仍为小型gateway标记；界面只在显示层展开。
const fs=require('node:fs'),path=require('node:path');
const {patch:patchHud}=require('../状态栏/apply.cjs');
const gatewayName='ZYX_01_网关界面渲染 (零楼启动)';
function gatewayDocument(){
 const source=fs.readFileSync(path.join(__dirname,'../零楼/零楼.html'),'utf8');
 if(source.includes('{{HTML_SOURCE}}'))throw new Error('零楼源文件仍含占位符');
 return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>丹杏 · 身份选择</title><style>html,body{margin:0;padding:0;background:transparent}body{display:flow-root}</style></head><body>'+source+`
<script>
(() => {
  const root=document.getElementById('zyx-zero-floor');
  if(!root)return;
  const resize=()=>{
    try {
      const frame=window.frameElement;
      if(!frame)return;
      const height=Math.ceil(root.getBoundingClientRect().height+32);
      if(height>0&&frame.style.height!==height+'px')frame.style.height=height+'px';
    } catch {}
  };
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  observer?.observe(root);
  window.addEventListener('resize',resize);
  window.addEventListener('load',resize,{once:true});
  window.addEventListener('pagehide',()=>{observer?.disconnect();window.removeEventListener('resize',resize)},{once:true});
  requestAnimationFrame(resize);
})();
</script></body></html>`;
}
function patchCard(card){
 const result=patchHud(card),scripts=result.data.extensions.regex_scripts;
 result.data.name=result.data.name.replace(/ · 状态栏V[0-9]+$/,'')+' · 状态栏V4';
 result.data.character_version=(result.data.character_version??'').replace(/\+zyx-hud-v[0-9]+$/,'')+'+zyx-hud-v4';
 const matches=scripts.map((r,i)=>r.scriptName===gatewayName?i:-1).filter(i=>i>=0);
 if(matches.length!==1)throw new Error('必须唯一匹配零楼入口，拒绝猜测');
 const i=matches[0];
 scripts[i]={...scripts[i],findRegex:'<zyx_gateway>[^]*?</zyx_gateway>',replaceString:'```html\n'+gatewayDocument()+'\n```',placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null};
 // 从旧打包器升级时移除本工具曾追加到超长世界书的冗余补充，保留原条目。
 const entries=result.data.character_book?.entries??[];
 for(const entry of entries)entry.content=entry.content.replace(/\n\n<zyx_status_output_supplement>[^]*?<\/zyx_status_output_supplement>\s*$/,'');
 // 必需的短协议随角色描述发送，不再只依赖可被预算/导入状态影响的世界书。
 const core=fs.readFileSync(path.join(__dirname,'../状态栏/核心输出协议.txt'),'utf8').trim();
 const description=result.data.description.replace(/\n\n<zyx_required_status_output>[^]*?<\/zyx_required_status_output>\s*$/,'');
 result.data.description=description+'\n\n'+core;
 // 原生角色深度提示由SillyTavern每轮直接setExtensionPrompt，不依赖世界书预算或偏好开关。
 const previousDepth=result.data.extensions.depth_prompt??{};
 const basePrompt=(previousDepth.prompt??'').replace(/\n*<zyx_required_status_output>[^]*?<\/zyx_required_status_output>\s*$/,'');
 result.data.extensions.depth_prompt={...previousDepth,prompt:(basePrompt?basePrompt+'\n\n':'')+core,depth:0,role:'system'};

 return result;
}
if(require.main===module){
 const[, ,input,output]=process.argv;
 if(!input||!output)throw new Error('用法：node pack-card.cjs 原卡.json 输出新卡.json');
 if(path.resolve(input)===path.resolve(output))throw new Error('禁止覆盖原卡');
 fs.writeFileSync(output,JSON.stringify(patchCard(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n',{flag:'wx'});
 console.log('零楼与状态栏已完整打包：'+output);
}
module.exports={patchCard,gatewayDocument,gatewayName};
