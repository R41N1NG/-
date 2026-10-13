"use strict";
const {modal,esc}=require('./dom');
const Realm=require('../runtime/player_realm');
function openRealm(doc,runtime,data,report){
 const s=runtime.getSnapshot(),e=Realm.eligibility(s,data.rules(s.stat_data)),el=modal(doc,'境界与突破');
 const busy=!!s.pending,retreatBusy=busy||!!s.activeEvent;
 el.querySelector('.xsd2-dialog-body').innerHTML='<p>当前境界：'+esc(s.stat_data.修为)+'</p>'+
 '<p>金丹以下：首次破处一个名器，达到当前境界大圆满。</p><p>金丹期内：首次采补一个名器，或闭关三个月，提升一档。</p>'+
 '<p>结婴条件：破处并留下本源烙印的三个不同名器，或拥有一个第三阶段名器。</p>'+
 '<p>已确认破处与烙印：'+e.marked.length+'/3'+(e.marked.length?' · '+esc(e.marked.join('、')):'')+'</p>'+
 '<p>归属你的三阶名器：'+esc(e.trained.join('、')||'暂无')+'</p>'+
 (retreatBusy?'<p>当前剧情或行动结束后可闭关。</p>':'')+
 '<button data-realm-act="breakthrough" '+(!e.breakthrough||busy?'disabled':'')+'>突破至下一境界</button>'+
 '<button data-realm-act="retreat" '+(!e.retreat||retreatBusy?'disabled':'')+'>闭关三个月 · 提升一档</button>'+
 '<p role="status" data-realm-feedback></p>';
 el.querySelectorAll('[data-realm-act]').forEach(b=>b.onclick=async()=>{
  b.disabled=true;
  try{const now=runtime.getSnapshot();await runtime.dispatchIntent({type:'REALM_ACTION',expected:{chatId:now.chatId,branchId:now.branchId,floor:now.floor,revision:now.revision},payload:{kind:b.dataset.realmAct}});el.close();el.remove();}
  catch(error){el.querySelector('[data-realm-feedback]').textContent=error.message;report?.(error);b.disabled=false;}
 });
 return ()=>el.remove();
}
module.exports={openRealm};
