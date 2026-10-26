/* gpt：可实例化调度器。view固定当前楼，live明确表示本聊天最新；不覆盖父窗口全局对象。 */
(function(global){
 'use strict';
 const clone=value=>structuredClone(value);
 function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}
 function create({bridge,snapshot,modules={}}){
  const registry=new Map(),listeners=new Set();let disposed=false,unsub=null,revision=0,last='',state=null;
  const first=bridge.read(),pinned=first?{chatId:first.chatId,cutoff:first.cutoff}:null;
  function register(name,module){if(disposed)throw Error('中控已销毁');if(!/^[a-z][a-z0-9_]*$/.test(name)||registry.has(name)||typeof module?.derive!=='function')throw Error('子模块名重复或缺derive');registry.set(name,module);return api;}
  function derive(context){const output={};for(const [name,module]of registry)output[name]=module.derive({...context,snapshot,get:key=>output[key]});return output;}
  function refresh(){if(disposed)return state;const current=bridge.read();const bound=!!pinned&&current?.chatId===pinned.chatId&&current.cutoff===pinned.cutoff;
   const stale=!!pinned&&!bound;
   const view=derive({source:bound?'history':'snapshot',chat:bound?current.chat:null,cutoff:bound?pinned.cutoff:null});
   const live=bound?derive({source:'history',chat:current.chat,cutoff:current.chat.length-1,live:true}):null;
   const next={scope:{chatId:pinned?.chatId??null,cutoff:pinned?.cutoff??null,stale},view,live};
   const signature=JSON.stringify(next);if(signature===last)return state;last=signature;state=freeze({...next,revision:++revision});
   for(const listener of [...listeners]){try{listener(state);}catch(error){global.console?.warn?.('[ZYX] 子界面刷新失败',error?.message??'');}}
   return state;
  }
  function stop(){unsub?.();unsub=null;}
  function start(){if(disposed)throw Error('中控已销毁');refresh();if(pinned&&!unsub)unsub=bridge.subscribe(refresh);return api;}
  function dispose(){if(disposed)return;stop();disposed=true;listeners.clear();for(const module of registry.values())module.dispose?.();registry.clear();}
  const api={register,refresh,start,stop,dispose,getSnapshot:()=>state,subscribe(listener){if(disposed)throw Error('中控已销毁');listeners.add(listener);if(state)listener(state);return ()=>listeners.delete(listener);},
   getFullRoster({live=false}={}){return clone((live?state?.live:state?.view)?.status?.allPrisoners??[]);},
   getImprisonedList({live=false}={}){return clone((live?state?.live:state?.view)?.status?.prisoners??[]);}};
  for(const [name,module]of Object.entries(modules))register(name,module);
  return api;
 }
 const api=Object.freeze({create});global.ZYXCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
