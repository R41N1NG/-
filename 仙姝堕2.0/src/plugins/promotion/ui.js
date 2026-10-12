"use strict";
const {esc,modal} = require("../../ui/dom");
function mountPromotion(slot,runtime,plugin) {
  const doc=slot.ownerDocument, trigger=doc.createElement("button");
  trigger.textContent="人物"; trigger.type="button"; trigger.dataset.promotionMenu="";
  slot.append(trigger); let dialog=null;
  function close(){if(dialog){dialog.remove();dialog=null;}}
  function render(){
    if (!dialog) return;
    const s=runtime.getSnapshot(); if(!s){close();return;}
    const body=dialog.querySelector(".xsd2-dialog-body"); body.replaceChildren();
    for(const row of plugin.list(s)) {
      const el=doc.createElement("section");
      const score=s.stat_data.character_metrics?.[row.cfg.character]?.好感度 ?? 0;
      const phaseMap = { stage01: "通常", stage02: "阶段一", stage03: "阶段二", stage04: "阶段三", stage05: "阶段四" };
      const phaseLabel = phaseMap[row.phase] || (row.phase === row.cfg.toStage ? '已完成' : '未解锁');
      el.innerHTML='<strong>'+esc(row.cfg.character)+'</strong><p>好感度 '+esc(score)+' · '+esc(phaseLabel)+'</p>';
      function button(label,id){
        const b=doc.createElement("button");b.textContent=label;b.type="button";b.dataset.promotionNode=id;
        b.disabled=!!s.pending;
        b.onclick=async()=>{
          b.disabled=true;
          try{
            const now=runtime.getSnapshot();
            await runtime.dispatchIntent({type:"SELECT_NODE",pluginId:plugin.id,
              expected:{chatId:now.chatId,branchId:now.branchId,floor:now.floor,revision:now.revision},payload:{nodeId:id}});
            close();
          }catch(error){const feedback=dialog?.querySelector('[role=status]');if(feedback)feedback.textContent=error.message;b.disabled=false;}
        };el.append(b);
      }
      if(row.active){
        button("完成本次拜访",row.cfg.finishId);button("结束本次拜访",row.cfg.leaveId);
        if(row.lastResult === "invalid") el.append(doc.createTextNode("尚未收到有效结算回报，可以再次点击完成。"));
      }else if(row.allowed)button(row.cfg.label,row.cfg.entryId);
      else if(row.phase !== row.cfg.toStage){
        const reqMetric = row.cfg.conditions?.find(c => c.kind === "metric");
        const reqScore = reqMetric?.value ?? 20;
        el.append(doc.createTextNode(s.activeEvent ? "当前事件结束后再查看。" : "好感度达到"+reqScore+"后开放。"));
      }
      else el.append(doc.createTextNode("本段专属剧情已完成。"));
      body.append(el);
    }
    const feedback=doc.createElement("p");feedback.setAttribute("role","status");body.append(feedback);
  }
  trigger.onclick=()=>{close();dialog=modal(doc,"人物互动");render();};
  const unsubscribe=runtime.subscribe(render);
  return ()=>{close();unsubscribe?.();trigger.remove();};
}
module.exports={mountPromotion};
