"use strict";
const {modal}=require('./dom');
// Native window.confirm can be suppressed by the browser or iframe host.
// Keep the decision in the current event panel and always expose cancellation.
function confirmExit(doc,node){
  doc.querySelectorAll('[data-xsd2-exit-confirm]').forEach(el=>el.cancelExit?.());
  const parent=doc.querySelector('dialog[data-xsd2-xibei-dialog][open]') || doc.querySelector('.xsd2-map-modal-box');
  const dialog=parent || modal(doc,'确认行程结算');
  const body=dialog.querySelector('.xsd2-dialog-body') || dialog;
  const controls=[...body.querySelectorAll('button')].map(el=>[el,el.disabled]);
  controls.forEach(([el])=>{el.disabled=true;});
  const panel=doc.createElement('section');panel.dataset.xsd2ExitConfirm='';
  panel.style.cssText='border:1px solid #b69a5e;border-radius:8px;padding:14px;margin:12px 0;box-sizing:border-box;max-width:100%';
  const text=doc.createElement('p');text.textContent=(node.confirmText || '确认结束本次行程？')+' 本次结算耗时'+node.exitDays+'日。';
  const yes=doc.createElement('button');yes.type='button';yes.dataset.exitConfirm='';yes.textContent='确认结算';
  const no=doc.createElement('button');no.type='button';no.dataset.exitCancel='';no.textContent='取消，继续探索';
  yes.style.cssText=no.style.cssText='padding:9px 12px;margin:4px;min-height:36px';
  panel.append(text,yes,no);body.append(panel);
  return new Promise(resolve=>{
    let done=false;
    const observer=new doc.defaultView.MutationObserver(()=>{if(!panel.isConnected)finish(false);});
    const onClose=()=>finish(false);
    function finish(answer){
      if(done)return;done=true;observer.disconnect();dialog.removeEventListener('close',onClose);dialog.removeEventListener('cancel',onClose);
      panel.remove();controls.forEach(([el,disabled])=>{if(el.isConnected)el.disabled=disabled;});
      if(!parent && dialog.isConnected)dialog.close();
      resolve(answer);
    }
    panel.cancelExit=()=>finish(false);
    yes.onclick=()=>finish(true);no.onclick=()=>finish(false);
    dialog.addEventListener('close',onClose);dialog.addEventListener('cancel',onClose);
    observer.observe(doc.body,{childList:true,subtree:true});
    yes.focus();
  });
}
module.exports={confirmExit};
