/* gpt：旧HUD只读兼容入口；禁止旧楼层重绘重新计算/写入节点和情报。 */
(function(global){
 'use strict';
 function snapshot(){
  for(const w of [global,global.parent,global.top]){try{
   const c=w.SillyTavern?.getContext?.();if(!c?.chat)continue;
   let frame=global.frameElement,cutoff=null;for(let depth=0;frame&&depth<8;depth++){
    const row=frame.closest?.('[mesid]');if(row){cutoff=Number(row.getAttribute('mesid'));break;}frame=frame.ownerDocument?.defaultView?.frameElement;
   }
   if(!Number.isInteger(cutoff))return null;const state=global.ZYXBackendProjection.read(c.chat,cutoff,c.chatId||c.getCurrentChatId?.());
   return state?.ready?{time:state.time,intel:state.official,nodes:state.events}:null;
  }catch{}}
  return null;
 }
 global.ZYXStateWriter=Object.freeze({sync:snapshot,snapshot});
})(window);
