'use strict';
function cardPreviewHtml(card){
 const json=JSON.stringify(card).replace(/</g,'\\u003c');
 return `<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奥克赫斯 · 整卡地图导入预览</title>
<style>*{box-sizing:border-box}body{margin:0;padding:20px 12px 40px;background:#090705;color:#e8dfd3;font:13px/1.7 'Noto Sans CJK SC','Microsoft YaHei',sans-serif}.preview-info,#chat,#send_form{max-width:800px;margin:0 auto 16px}.preview-info{color:#ad9e87;font-size:12px}.preview-info button{min-height:44px;border:1px solid #685439;background:#21180e;color:#dfc89a;padding:8px 14px;font:inherit;cursor:pointer}#send_textarea{width:100%;min-height:90px;background:#110d09;color:#f6ead5;border:1px solid #685439;padding:12px;font:inherit}.narrative{white-space:pre-line;line-height:1.9;color:#d7c8b5}.mes{margin:18px 0}.mes[is_user=true]{color:#a19178}.okh-hud-canvas{box-shadow:none!important}@media(max-width:480px){body{padding:10px 8px 24px}.okh-hud-canvas{padding:13px 12px 20px!important}}</style>
<div class="preview-info">整卡导入验证：直接读取新版 JSON 中的脚本和显示正则，模拟酒馆助手接口；沙盒存档与真实聊天隔离。<br>可先浏览地图，再用下方按钮演示抵镇入住。</div><main id="chat"></main>
<div class="preview-info"><button id="demo-arrive" type="button" disabled>演示：抵镇入住</button> <button id="demo-reload" type="button" disabled>重载卡内脚本</button><p id="preview-status" role="status">正在启动卡内脚本…</p></div>
<form id="send_form" onsubmit="return false"><label for="send_textarea">行动草稿（只填入，不自动发送）</label><textarea id="send_textarea"></textarea></form>
<script id="card-payload" type="application/json">${json}</script>
<script>
const previewCard=JSON.parse(document.getElementById('card-payload').textContent);
const listeners=new Map(),variables=new Map(),prompts=new Map();
window.previewContext={chatId:'card-import-preview',chat:[{is_user:false,is_system:false,mes:previewCard.data.first_mes}],event_types:{GENERATION_STARTED:'GENERATION_STARTED',MESSAGE_RECEIVED:'MESSAGE_RECEIVED',MESSAGE_EDITED:'MESSAGE_EDITED',MESSAGE_DELETED:'MESSAGE_DELETED',MESSAGE_SWIPED:'MESSAGE_SWIPED',GENERATION_STOPPED:'GENERATION_STOPPED',CHAT_CHANGED:'CHAT_CHANGED'},setExtensionPrompt:(id,text)=>{prompts.set(id,text);return true}};
window.SillyTavern={getContext:()=>previewContext};
function display(text){
 const rules=previewCard.data.extensions.regex_scripts.filter(r=>!r.disabled);
 const apply=(value,rule)=>{const end=rule.findRegex.lastIndexOf('/');return value.replace(new RegExp(rule.findRegex.slice(1,end),rule.findRegex.slice(end+1)),rule.replaceString)};
 const clean=rules.filter(r=>r.id!=='okh-dialogue-bubble').reduce(apply,text);
 const escaped=clean.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
 return rules.filter(r=>r.id==='okh-dialogue-bubble').reduce(apply,escaped);
}
function renderMessage(index){const msg=previewContext.chat[index],el=document.createElement('section');el.className='mes';el.setAttribute('is_user',String(!!msg.is_user));el.setAttribute('mesid',String(index));const body=document.createElement('div');body.className='mes_text';const narrative=document.createElement('div');narrative.className='narrative';narrative.innerHTML=display(msg.mes).trim();body.append(narrative);el.append(body);document.getElementById('chat').append(el)}
renderMessage(0);
window.cardWorld=()=>document.getElementById('card-helper').contentWindow.OKH_APP.world();
window.cardListenerCounts=()=>Object.fromEntries([...listeners].map(([key,set])=>[key,set.size]));
async function launchCard(){
 const iframe=document.createElement('iframe');iframe.id='card-helper';iframe.hidden=true;document.body.append(iframe);const helper=iframe.contentWindow;
 helper.getCurrentChatId=()=>previewContext.chatId;
 helper.getVariables=()=>({...variables.get(previewContext.chatId)});
 helper.replaceVariables=next=>{variables.set(previewContext.chatId,{...next});return true};
 helper.tavern_events=previewContext.event_types;
 helper.eventOn=(event,fn)=>{if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event).add(fn)};
 helper.eventRemoveListener=(event,fn)=>listeners.get(event)?.delete(fn);
 const scripts=previewCard.data.extensions.tavern_helper.scripts.filter(s=>s.type==='script'&&s.enabled);
 if(scripts.length!==1)throw Error('整合卡应有且仅有一份启用的完整脚本');
 helper.eval(scripts[0].content);await helper.OKH_CARD_READY;return helper;
}
window.appendCardReply=async text=>{
 previewContext.chat.push({is_user:true,mes:'演示行动'});renderMessage(previewContext.chat.length-1);
 previewContext.chat.push({is_user:false,is_system:false,mes:text});const index=previewContext.chat.length-1;renderMessage(index);
 for(const fn of listeners.get('MESSAGE_RECEIVED')||[])await fn(index);
 document.getElementById('card-helper').contentWindow.OKH_APP.renderHud();return cardWorld();
};
window.reloadCard=async()=>{document.getElementById('card-helper').remove();await launchCard();return cardWorld()};
window.previewReady=launchCard().then(()=>{
 document.getElementById('preview-status').textContent='卡内脚本已启动 · 地图和状态栏可操作';
 document.getElementById('demo-arrive').disabled=false;document.getElementById('demo-reload').disabled=false;
 document.getElementById('demo-arrive').onclick=async()=>{
  try{await appendCardReply('<content>演示回执：救下爱德后抵镇，并在旅店入住。</content><status_bar><time elapsed="30"/><prologue_step flag="ed_joined"/><prologue_step flag="arrived_oakhaven"/><move to="inn"/></status_bar>');document.getElementById('demo-arrive').disabled=true;document.getElementById('preview-status').textContent='已通过实际回执进入旅店，现可点选房间拟定行动。'}catch(e){document.getElementById('preview-status').textContent=e.message}
 };
 document.getElementById('demo-reload').onclick=async()=>{try{await reloadCard();document.getElementById('preview-status').textContent='已重载卡内脚本，沿用沙盒存档。'}catch(e){document.getElementById('preview-status').textContent=e.message}};
});previewReady.catch(e=>document.getElementById('preview-status').textContent=e.message);
</script></html>`;
}
module.exports={cardPreviewHtml};
