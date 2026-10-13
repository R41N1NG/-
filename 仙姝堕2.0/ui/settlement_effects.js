"use strict";
const {makeOverlay}=require("./settlement_art");
const {ensureStyle,makeCard}=require("./settlement_panel");
function createSettlementEffects(doc,onChange=()=>{},options={}) {
  const win=doc.defaultView, clock=options.clock || win || globalThis;
  const duration=options.duration ?? 3600,sealDuration=options.sealDuration ?? 640,liftDuration=options.liftDuration ?? 800;
  const reduced=options.reducedMotion ?? !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const style=ensureStyle(doc);let active=null,disposed=false,revision=0;
  const api={get revision(){return revision;},isMasked(id){return active?.id === id && !active.revealed;},update,reset,dispose};
  function changed(){revision++;onChange();}
  function schedule(r,fn,ms){const timer=clock.setTimeout(()=>{if(!disposed && active===r)fn();},Math.max(0,ms));r.timers.push(timer);}
  function detach(r){r.target?.classList.remove('xsd2-settlement-obscured');r.mount.remove();r.target=null;}
  function reset(){if(!active)return;const r=active;active=null;r.timers.forEach(t=>clock.clearTimeout(t));detach(r);changed();}
  function attach(r,c){
    const rows=[...doc.querySelectorAll('#chat .mes')];
    const floor=c.chat.length-1,latest=c.chat[floor];
    let target=null;
    if(!latest?.is_user && floor>r.sourceFloor) target=rows.find((row,i)=>Number(row.getAttribute('mesid') ?? i)===floor)?.querySelector('.mes_text');
    if(r.target!==target){r.target?.classList.remove('xsd2-settlement-obscured');r.target=target;}
    if(target){r.mount.style.position="absolute";target.classList.add('xsd2-settlement-obscured');if(r.mount.parentElement!==target)target.append(r.mount);}
    else {r.mount.style.position="relative";const chat=doc.querySelector('#chat');if(chat && r.mount.parentElement!==chat)chat.append(r.mount);}
  }
  function reveal(r){
    if(!r.ready || !r.minimum || r.sealing || r.revealed)return;
    r.sealing=true;
    r.overlay.querySelector('[data-tj="stepText"]').textContent="封天机";
    if(r.failed || reduced || r.skip){finish();return;}
    r.overlay.classList.add('xsd2-tj-sealing');
    schedule(r,finish,sealDuration);
    function finish(){
      r.overlay.classList.add('xsd2-tj-lifting','xsd2-tj-lifted');
      if(r.receipt) r.mount.querySelector('.xsd2-tj-stage').append(makeCard(doc,r.receipt,true));
      schedule(r,()=>{r.revealed=true;detach(r);active=null;r.timers.forEach(t=>clock.clearTimeout(t));changed();},reduced || r.failed || r.skip ? 0 : liftDuration);
    }
  }
  function begin(p,s,c){
    const mount=doc.createElement('div');mount.className='xsd2-tianji xsd2-tj-settle-floor xsd2-settlement-mount';
    mount.style.position='relative';mount.style.height='360px';
    const stage=doc.createElement('div');stage.className='xsd2-tj-stage';mount.append(stage);
    const overlay=makeOverlay(doc);overlay.classList.add('xsd2-tj-on');stage.append(overlay);
    const label=overlay.querySelector('[data-tj="stepText"]');
    const skip=doc.createElement('button');skip.type='button';skip.textContent='略过演算';skip.setAttribute('aria-label','略过动画，等待真实结算结果');overlay.append(skip);
    const r={id:p.id,chatId:s.chatId,branchId:s.branchId,sourceFloor:p.floor,nodeId:p.nodeId,mount,overlay,target:null,timers:[],minimum:reduced,ready:false,revealed:false};active=r;
    skip.onclick=()=>{r.mount.classList.add("xsd2-tj-still");r.skip=true;r.minimum=true;label.textContent=r.ready ? '天机落定' : '静候回音';reveal(r);};
    attach(r,c);changed();
    schedule(r,()=>overlay.classList.add('xsd2-tj-divining'),reduced ? 0 : 460);
    ['核时序','验因果','点赏赐'].forEach((text,i)=>schedule(r,()=>{if(!r.skip)label.textContent=text;},460+i*Math.max(200,(duration-1100)/3)));
    schedule(r,()=>{r.minimum=true;if(!r.ready)label.textContent='静候回音';reveal(r);},reduced ? 0 : duration-sealDuration);
  }
  function update(s,c){
    if(disposed)return;
    if(!s || (active && (s.chatId!==active.chatId || s.branchId!==active.branchId))){reset();return;}
    const p=s.pending, isSettlement=p && (p.selection?.completionQuery || p.selection?.settlement?.mode && p.selection.settlement.mode!=='none');
    if(isSettlement && active?.id!==p.id){reset();begin(p,s,c);}
    if(!active)return;
    const r=active;attach(r,c);
    if(p?.id === r.id)return;
    const receipt=s.settlements?.[r.id];
    if(receipt){r.receipt=receipt;r.ready=true;reveal(r);}
    else if(s.lastNodeResult?.nodeId===r.nodeId && s.lastNodeResult.floor>r.sourceFloor && s.lastNodeResult.outcome==='retry'){r.ready=true;r.failed=true;r.minimum=true;reveal(r);}
    else reset();
  }
  function dispose(){if(disposed)return;reset();disposed=true;style.remove();}
  return api;
}
module.exports={createSettlementEffects};
