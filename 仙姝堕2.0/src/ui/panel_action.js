"use strict";
function assertPanelSnapshot(origin,now){
 if(!now || ['chatId','branchId','revision','floor'].some(k=>origin?.[k]!==now[k]))throw Error('存档已变化（聊天或状态已切换），请关闭后重新打开。');
 return now;
}
// One pending operation per panel. Restore pre-existing disabled states, even
// after failures; closing an old panel cannot redirect its action to a new chat.
function createPanelAction(el,runtime,origin,fail){
 let busy=false;
 const anchor=typeof origin==='function'?null:{...origin};
 return async task=>{
  if(busy || !el.isConnected)return {cancelled:true};
  busy=true;
  const controls=[...el.querySelectorAll('button:not([data-close])')].map(b=>[b,b.disabled]);
  controls.forEach(([b])=>{b.disabled=true;});el.setAttribute('aria-busy','true');
  try{return await task(assertPanelSnapshot(typeof origin==='function'?origin():anchor,runtime.getSnapshot()));}
  catch(error){fail?.(error);return {failed:true};}
  finally{busy=false;el.removeAttribute('aria-busy');controls.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled;});}
 };
}
module.exports={assertPanelSnapshot,createPanelAction};
