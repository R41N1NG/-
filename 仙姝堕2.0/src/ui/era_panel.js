"use strict";
const {modal,esc}=require('./dom');
const C=require('../runtime/contracts');
function openEras(doc,runtime,data,report){
 const s=runtime.getSnapshot(),el=modal(doc,'中立大势 · 剧情时期'),busy=!!s.pending||!!s.activeEvent;
 el.querySelector('.xsd2-dialog-body').innerHTML='<p>快进只推进世界日期，不替你完成探索、晋升或领取奖励。</p>'+
 (busy?'<p>当前剧情或行动结束后可快进。</p>':'')+
 data.grandEras.map((e,i)=>{
  const future=C.day(e.startDate)>C.day(s.calendarDate),active=s.stat_data.grand_era===e.id;
  return '<article class="xsd2-era"><h3>'+esc(future?'未至时期 '+(i+1):e.name)+(active?' · 当前时期':'')+'</h3><p>'+C.dateText(e.startDate)+' — '+C.dateText(e.endDate)+'</p>'+
  (future?'': '<p>'+esc(e.background)+'</p>')+
  (future?'<button data-era="'+esc(e.id)+'" '+(busy?'disabled':'')+'>快进至 '+C.dateText(e.startDate)+'</button>':'')+'</article>';
 }).join('')+'<p>最后一期结束后延续最近的世界背景，后续变化由局部事件决定。</p><p role="status" data-era-feedback></p>';
 el.querySelectorAll('[data-era]').forEach(b=>b.onclick=async()=>{
  b.disabled=true;
  try{const now=runtime.getSnapshot();await runtime.dispatchIntent({type:'ADVANCE_ERA',expected:{chatId:now.chatId,branchId:now.branchId,floor:now.floor,revision:now.revision},payload:{id:b.dataset.era}});el.close();el.remove();}
  catch(error){el.querySelector('[data-era-feedback]').textContent=error.message;report?.(error);b.disabled=false;}
 });
 return ()=>el.remove();
}
module.exports={openEras};
