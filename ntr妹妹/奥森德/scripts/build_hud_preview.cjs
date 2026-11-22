'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../地图预览/接入验证');fs.mkdirSync(dir,{recursive:true});
const runtime=fs.readFileSync(path.resolve(__dirname,'../dist/okh_complete.js'),'utf8').replace(/<\/script/gi,'<\\/script');
const page=`<!DOCTYPE html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>正式状态栏 · 地图接入验证</title>
<style>*{box-sizing:border-box}body{margin:0;padding:20px 10px 40px;background:#080605;color:#e8dfd3;font:13px/1.7 'Noto Sans CJK SC','Microsoft YaHei',sans-serif}.preview-top,.preview-input{max-width:760px;margin:0 auto 12px;color:#b3a594;font-size:11px}.preview-input{border:1px solid #59472f;padding:12px;margin-top:16px}.preview-input textarea{width:100%;min-height:80px;background:#0c0906;color:#fff5e3;border:1px solid #64533d;padding:9px;font:inherit;font-size:12px}.preview-input button{min-height:44px;background:transparent;border:0;color:#dfc89a;margin-right:18px;font:inherit;cursor:pointer}.okh-hud-canvas{box-shadow:none}@media(max-width:480px){body{padding:10px 8px 24px}.okh-hud-canvas{padding:13px 12px 20px!important}.okh-tabs-list{gap:8px!important}.okh-tab-btn{font-size:11px!important}}</style>
<div class="preview-top">正式 HUD 接入验证 · 独立沙盒存档，使用正式渲染和存储代码</div>
<div class="okh-hud" data-okh-hud></div>
<div class="preview-input"><label for="send_textarea">行动输入框 · 可修改后发送</label><textarea id="send_textarea"></textarea><div><button id="preview-nise-away" type="button">演示：妮丝外出</button><button id="preview-nise-return" type="button">演示：妮丝返回旅店</button></div><p id="preview-result"></p></div>
<script>window.previewContext={chatId:'map-runtime-preview',chat:[],setExtensionPrompt:()=>true};window.SillyTavern={getContext:()=>window.previewContext};</script>
<script>${runtime}</script>
<script>
window.previewReady=(async()=>{
 const store=new Map();OKH_APP.configure({getContext:()=>previewContext,getChatId:()=>previewContext.chatId,storage:{get:k=>store.get(k),set:(k,v)=>{store.set(k,v);return true}}});
 await OKH_APP.init();const w=OKH_APP.world();w.timeMin=15*1440+600;w.playerLocation='inn';w.playerState.gold=390;
 Object.assign(w.flags,{arrived_oakhaven:true,arrivedDay:1,ed_joined:true,ed_awake:true,ed_permanently_joined:true});
 for(const id of ['gulan','isna','nise','aurora','ed']){w.npcs[id].monitored=true;w.npcs[id].location='inn'}
 w.npcs.isna.location='town';w.npcs.aurora.location='manor';w.npcs.aurora.flags.manor_service_active=true;
 await OKH_APP.save(w,{debug:true});OKH_APP.HUD.startHud(1000);
 const change=async location=>{const next=OKH_APP.world();next.npcs.nise.location=location;await OKH_APP.save(next,{debug:true});OKH_APP.renderHud();document.getElementById('preview-result').textContent='沙盒存档已更新；地图从当前存档重新读取。'};
 document.getElementById('preview-nise-away').onclick=()=>change('town');document.getElementById('preview-nise-return').onclick=()=>change('inn');
})();previewReady.catch(e=>document.getElementById('preview-result').textContent=e.message);
</script></html>`;
fs.writeFileSync(path.join(dir,'hud-live-preview.html'),page);
console.log('正式 HUD 沙盒预览已生成：'+dir);
