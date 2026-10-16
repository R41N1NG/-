"use strict";
const C=require('../../runtime/contracts');
const {resultTag}=require('../promotion/index');
const {modal}=require('../../ui/dom');
const {createPanelAction}=require('../../ui/panel_action');
const ID='neutral_nodes';
function createNeutralPlugin(definitions,stories){
 const entries=Object.entries(definitions);
 const state=s=>s.pluginState?.[ID] || {completed:{}};
 const known=(s,key)=>(s.known || s.stat_data.known)?.[key]===true;
 function lookup(nodeId){
  for(const [id,cfg] of entries){
   if(nodeId===cfg.entryId)return {id,cfg,entry:true};
   const choice=cfg.choices.find(x=>x.id===nodeId);if(choice)return {id,cfg,choice};
  }
  return null;
 }
 function available(s,x){
  if(!x || C.day(s.calendarDate)<C.day(x.cfg.open) || !x.cfg.prerequisites.every(k=>known(s,k)))return false;
  const st=state(s);
  if(x.entry)return !s.activeEvent && !st.completed?.[x.id] && !(x.id==='tianxi' && known(s,'已抵达天溪'));
  return s.activeEvent?.pluginId===ID && st.currentId===x.id && !!st.entryCode;
 }
 const active=id=>({pluginId:ID,id});
 function select(s,nodeId){
  const x=lookup(nodeId);if(!available(s,x))return {id:nodeId,allowed:false,reason:'当前时间、前置路线或节点状态不满足'};
  const {id,cfg,entry,choice}=x,st=state(s);
  const reserved={...st,currentId:id,entryCode:null};
  return {id:nodeId,allowed:true,open:cfg.open,displayText:entry?cfg.label:choice.label,
   actionText:entry?cfg.label:choice.label,prompt:stories[nodeId].content,rewards:[],grantsKnown:choice?.grants || [],
   completionQuery:entry?undefined:'只判断起始行动 '+st.entryCode+' 之后的本次剧情，不借用旧拜访。'+cfg.query+'。玩家选择：'+choice.label+'。不代玩家补写行动。',
   immediateResult:entry?{outcome:'success',pluginState:reserved,activeEvent:active(id),rewards:[],known:[]}:undefined};
 }
 async function settle(s,p,body){
  const x=lookup(p.nodeId),st=state(s);
  if(!x || p.pluginId!==ID || st.currentId!==x.id)return {outcome:'failure',reason:'中立节点行动不匹配'};
  if(x.entry)return {outcome:'success',pluginState:{...st,entryCode:p.actionCode},activeEvent:active(x.id),body};
  const answer=resultTag(body,p.actionCode);
  if(!answer)return {outcome:'retry',pluginState:st,activeEvent:active(x.id),body:'未收到有效结算回报，请重新点击完成。',reason:'中立节点回报缺失或行动编号不匹配'};
  if(answer==='否')return {outcome:'failure',pluginState:st,activeEvent:active(x.id),body:'本次条件尚未达成，可以继续探索后再次完成。',reason:'本次剧情尚未满足条件'};
  const next={...st,currentId:null,entryCode:null,completed:{...st.completed,[x.id]:true},...(x.id==='frontline'?{route:x.choice.id==='xmFrontGo'?'go':'stay'}:{})};
  return {outcome:'success',pluginState:next,activeEvent:null,known:x.choice.grants,rewards:[],
   body:x.cfg.label+'已完成：'+x.choice.label+'。也可继续探索。',reason:'本次回报确认达成',evidenceMode:'NEUTRAL_RESULT'};
 }
 function list(s){
  return entries.flatMap(([id,cfg])=>state(s).currentId===id && s.activeEvent?.pluginId===ID
   ?cfg.choices.filter(choice=>available(s,{id,cfg,choice}))
   :available(s,{id,cfg,entry:true})?[{id:cfg.entryId,label:cfg.label}]:[]);
 }
 function getPrompt(s){
  const st=state(s),cfg=definitions[st.currentId];if(s.activeEvent?.pluginId!==ID || !cfg)return '';
  return '当前中立剧情：'+cfg.label+'。承接本次入场后的自由交涉；不反复开场，不提前选择分支。完成条件：'+cfg.query+'。玩家可继续自由探索，准备好后点击完成。日期遵照后台，不凭叙述自行跳日；路线与节点事实只在中控结算后生效。';
 }
 function mount(slot,runtime){
  const openedState=runtime.getSnapshot();if(!openedState || (!list(openedState).length && openedState.activeEvent?.pluginId!==ID))return ()=>{};
  const doc=slot.ownerDocument,button=doc.createElement('button');button.type='button';button.dataset.neutralNodes='';button.textContent='中立剧情 · '+(openedState.activeEvent?.pluginId===ID?'继续行动':'可进行');slot.append(button);let dialog=null;
  button.onclick=()=>{
   if(dialog?.isConnected)return;
   const s=runtime.getSnapshot();if(!s)return;
   doc.querySelectorAll('dialog[data-neutral-dialog]').forEach(el=>el.close());
   dialog=modal(doc,'中立剧情');dialog.dataset.neutralDialog='';
   const sheet=dialog,body=sheet.querySelector('.xsd2-dialog-body'),hint=doc.createElement('p');hint.textContent='可以先自由行动，准备好后再推进节点。';body.append(hint);
   const run=createPanelAction(sheet,runtime,s,error=>{hint.textContent=error.message;});
   const retry=s.pending?.pluginId===ID && s.pending.selection?.completionQuery;
   const choices=s.pending?(retry?[{id:s.pending.nodeId,label:'重新生成本次结算'}]:[]):list(s);
   for(const choice of choices){
    const b=doc.createElement('button');b.type='button';b.dataset.neutralNode=choice.id;b.textContent=choice.label;b.style.cssText='display:block;width:100%;margin:8px 0;padding:9px';body.append(b);
    b.onclick=()=>run(async()=>{
     await runtime.dispatchIntent({type:retry?'RETRY_COMPLETION':'SELECT_NODE',pluginId:ID,
      expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:choice.id}});
     if(sheet.isConnected)sheet.close();
    });
   }
   if(!choices.length)hint.textContent='当前回复正在结算，请等待回复完成。';
  };
  return ()=>{button.remove();if(dialog?.isConnected)dialog.close();};
 }
 return {id:ID,version:'1.0',select,settle,list,getPrompt,mount,getDisplayText:nodeId=>{const x=lookup(nodeId);return x?(x.entry?x.cfg.label:x.choice.label):null;}};
}
module.exports={createNeutralPlugin};
