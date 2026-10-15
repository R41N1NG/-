"use strict";
const {modal,esc}=require('./dom');
const {dateText}=require('../runtime/contracts');
const Realm=require('../runtime/player_realm');
function blockedReason(s,e,kind){
 if(s.pending)return '当前行动尚未结束，请等本轮回复完成。';
 if(kind==='retreat' && s.activeEvent)return '正在进行剧情，请完成或离开当前事件后再闭关。';
 if(kind==='retreat' && s.manual?.calendarDate)return '日期处于GM人工覆盖，请先在GM面板交还自动日期。';
 const r=s.stat_data.player_realm || Realm.parse(s.stat_data.修为);
 if(!r.major || !r.phase)return '当前境界或小阶段未明确，请在GM面板填写完整境界，例如金丹中期。';
 if(kind==='retreat'){
  if(r.major!=='金丹')return '目前闭关升档规则只适用于金丹前期、中期、后期。';
  if(r.phase==='大圆满')return '已到金丹大圆满，闭关不能继续升档；满足名器条件后可突破元婴。';
  return e.retreat?'':'当前境界不满足闭关条件。';
 }
 if(e.breakthrough)return '';
 if(['元婴','化神'].includes(r.major))return '元婴及以上的后续突破规则尚未配置。';
 if(r.phase!=='大圆满')return '请先达到当前境界大圆满，再突破至下一境界。';
 return '结婴条件未满足：需三个由你破处并留下本源烙印的名器，或一个归属你的三阶名器。';
}
function openRealm(doc,runtime,data,report,onComplete){
 const s=runtime.getSnapshot(),e=Realm.eligibility(s,data.rules(s.stat_data)),el=modal(doc,'境界与突破');
 const reasons=Object.fromEntries(['breakthrough','retreat'].map(kind=>[kind,blockedReason(s,e,kind)]));
 el.querySelector('.xsd2-dialog-body').innerHTML='<p>当前境界：'+esc(s.stat_data.修为)+'</p>'+
 '<p>金丹以下：首次破处一个名器，达到当前境界大圆满。</p><p>金丹期内：首次采补一个名器，或闭关三个月，提升一档。</p>'+
 '<p>结婴条件：破处并留下本源烙印的三个不同名器，或拥有一个第三阶段名器。</p>'+
 '<p>明确归属你，即视为本源烙印已确认；破处者仍须是你。</p>'+
 '<p>已确认破处与烙印：'+e.marked.length+'/3'+(e.marked.length?' · '+esc(e.marked.join('、')):'')+'</p>'+
 '<p>归属你的三阶名器：'+esc(e.trained.join('、')||'暂无')+'</p>'+
 '<details><summary>逐项查看突破条件</summary>'+e.details.filter(x=>x.formed||x.owner||x.stage>0).map(x=>'<p>'+esc(x.name)+'：'+esc(x.missing.join('；')||'破处、归属与本源烙印均已确认')+'</p>').join('')+'</details>'+
 ['breakthrough','retreat'].map(kind=>'<div><button type="button" data-realm-act="'+kind+'" aria-disabled="'+!!reasons[kind]+'"'+(reasons[kind]?' style="opacity:.6;cursor:help"':'')+'>'+(kind==='breakthrough'?'突破至下一境界':'闭关三个月 · 提升一档')+'</button>'+
 (reasons[kind]?'<p class="xsd2-label" data-realm-reason="'+kind+'">'+esc(reasons[kind])+'</p>':'')+'</div>').join('')+
 '<p role="status" data-realm-feedback></p>';
 el.querySelectorAll('[data-realm-act]').forEach(b=>b.onclick=async()=>{
  const kind=b.dataset.realmAct,now=runtime.getSnapshot(),currentEligibility=Realm.eligibility(now,data.rules(now.stat_data)),reason=blockedReason(now,currentEligibility,kind);
  if(reason){el.querySelector('[data-realm-feedback]').textContent=reason;return;}
  b.disabled=true;
  try{
   const result=await runtime.dispatchIntent({type:'REALM_ACTION',expected:{chatId:now.chatId,branchId:now.branchId,floor:now.floor,revision:now.revision},payload:{kind}});
   const after=result || runtime.getSnapshot();
   const message=(kind==='retreat'?'闭关结算已发送，等待回复':'突破完成')+'：'+after.stat_data.修为+' · 仙盟历 '+dateText(after.calendarDate);
   el.close();el.remove();
   if(onComplete)onComplete(message);
   else{const done=modal(doc,kind==='retreat'?'闭关完成':'突破完成');done.querySelector('.xsd2-dialog-body').textContent=message;}
  }catch(error){el.querySelector('[data-realm-feedback]').textContent=error.message;report?.(error);b.disabled=false;}
 });
 return ()=>el.remove();
}
module.exports={openRealm,blockedReason};
