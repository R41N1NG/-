"use strict";
const {esc} = require("./dom"), {dateText} = require("../runtime/contracts");
function renderSettlement(doc, container, snapshot) {
  container.replaceChildren();
  if (!snapshot || snapshot.pending) return;
  for (const r of Object.values(snapshot.settlements || {}).filter(x=>x.floor === snapshot.floor)) {
    const el = doc.createElement("section");
    el.className = "xsd2-hud xsd2-settlement";
    el.dataset.receipt = r.id;
    const rewards = r.rewards.map(x=>typeof x === "string" ? x : x.name+"×"+(x.count || 1));
    el.innerHTML = '<strong>'+esc(r.title)+'</strong><p>'+esc(r.exitType || r.action)+'</p>'+
      (r.mode === "separate" && r.facts.length ? '<p>'+r.facts.map(esc).join('<br>')+'</p>' : '')+
      '<p>本次所得：'+esc(rewards.join('、') || '无')+'</p>'+
      '<p>耗时：'+esc(r.elapsedDays)+'日 · 仙盟历 '+esc(dateText(r.date))+'</p>';
    container.append(el);
  }
}
module.exports = {renderSettlement};
