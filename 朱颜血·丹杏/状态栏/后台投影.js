/* gpt：仅消费通过聊天ID、当前候选指纹校验的后台快照。 */
(function(global){
 'use strict';
 function read(chat,cutoff,chatId){
  if(!Array.isArray(chat)||!Number.isInteger(cutoff)||!chatId)return null;
  // 前序编辑后，旧的后序快照不可继续充当真值。
  let latest=null;
  for(let floor=0;floor<=cutoff;floor++){
   const message=chat[floor];if(!message||message.is_user||message.is_system)continue;
   const saved=message.extra?.zyx_backend;
   if(!saved)continue;
   if(saved.schema!==1||saved.chatId!==String(chatId)||saved.sourceFingerprint!==global.ZYXFingerprint.fingerprint(message))return null;
   const prefix=global.ZYXFingerprint.fingerprint({mes:JSON.stringify(chat.slice(0,floor+1).map(global.ZYXFingerprint.fingerprint))});
   if(saved.sourcePrefix!==prefix)return null;
   latest=saved.snapshot;
  }
  // ready=false同样是经过输入校验的诊断，时间保持null，界面不得伪造开局。
  return latest?structuredClone(latest):null;
 }
 const api={read};global.ZYXBackendProjection=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
