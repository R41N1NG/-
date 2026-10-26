/* gpt：宿主读取与事件桥。只读聊天，不保存全局人物状态。 */
(function(global){
 'use strict';
 function windows(){const all=[global];try{if(global.parent!==global)all.push(global.parent)}catch{}try{if(global.top!==global&&!all.includes(global.top))all.push(global.top)}catch{}return all;}
 function host(){for(const window of windows()){try{const context=window.SillyTavern?.getContext?.();if(context&&Array.isArray(context.chat))return {window,context};}catch{}}return null;}
 function create({snapshot}){
  function read(){const h=host();if(!h)return null;const chatId=h.context.chatId||h.context.getCurrentChatId?.();if(!chatId)return null;
   const decode=global.ZYXMartialLedger.decodeText;
   function matches(body){const checks=Object.entries(snapshot).filter(([,v])=>v);return checks.length>0&&checks.every(([tag,value])=>{const found=[...String(body).matchAll(new RegExp('<'+tag+'>([^<]*)</'+tag+'>','g'))];return found.length===1&&decode(found[0][1])===value;});}
   let index=null;
   try{const node=global.frameElement?.closest('.mes');const attr=node?.getAttribute('mesid')??node?.getAttribute('data-message-id');if(attr!==null&&attr!==undefined&&/^\d+$/.test(attr))index=Number(attr);}catch{}
   if(index===null){for(const w of windows()){try{const api=typeof w.getCurrentMessageId==='function'?w:w.TavernHelper;if(typeof api?.getCurrentMessageId==='function'){const id=api.getCurrentMessageId();if(Number.isInteger(id)){index=id;break;}}}catch{}}}
   if(index===null){const indices=h.context.chat.map((m,i)=>m&&!m.is_user&&matches(m.mes??m.message??'')?i:-1).filter(i=>i>=0);if(indices.length===1)index=indices[0];}
   const m=h.context.chat[index];if(index===null||!m||m.is_user||m.is_system||!matches(m.mes??m.message??''))return null;
   return {chatId,chat:h.context.chat,cutoff:index};
  }
  function subscribe(callback){const h=host(),bus=h?.context.eventSource,types=h?.context.event_types;const off=[];
   if(bus&&typeof bus.on==='function'&&types){for(const key of ['MESSAGE_RECEIVED','MESSAGE_UPDATED','MESSAGE_EDITED','MESSAGE_DELETED','MESSAGE_SWIPED','CHAT_CHANGED','GENERATION_ENDED']){const event=types[key];if(!event)continue;bus.on(event,callback);off.push(()=>{if(typeof bus.removeListener==='function')bus.removeListener(event,callback);else bus.off?.(event,callback);});}}
   // 不同酒馆版本的事件表可能不全；轻量轮询只补读，不改消息。
   for(const w of windows()){try{w.addEventListener('zyx-backend-state',callback);off.push(()=>w.removeEventListener('zyx-backend-state',callback));}catch{}}
   const timer=bus&&types?null:global.setInterval(callback,1500);
   return ()=>{if(timer!==null)global.clearInterval(timer);for(const fn of off)fn();};
  }
  return {read,subscribe};
 }
 const api={create,windows,host};global.ZYXHostBridge=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
