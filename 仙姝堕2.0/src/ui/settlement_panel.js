"use strict";
const {esc} = require("./dom"), {dateText} = require("../runtime/contracts");
const STYLE = require("./settlement_style");
function ensureStyle(doc) {
  let style=doc.querySelector('[data-xsd2-tianji-style]');
  if(!style){style=doc.createElement("style");style.dataset.xsd2TianjiStyle="";style.textContent=STYLE;doc.head.append(style);}
  return style;
}
function makeCard(doc,r,animate=false) {
  const section=doc.createElement("section");section.className="xsd2-tianji xsd2-tj-settle-floor";section.dataset.receipt=r.id;
  const rewards=(r.rewards || []).map(x=>typeof x === "string" ? x : x.name+"×"+(x.count || 1));
  const date="仙盟历 "+dateText(r.date), title=r.title || "天机落定";
  let verdict;
  if(r.kind === "promotion") verdict=r.answer === "是" ? "此番夜访已毕，所问已验，关系进境已记。" : "此番夜访已毕，所问未成，关系进境如前。";
  else verdict=(r.exitType || r.action || "此番行程")+"，历时"+r.elapsedDays+"日。"+(rewards.length ? "行囊有所得，天机落定。" : "行程已记，天机落定。");
  const facts=r.facts || [], ledger=[title,r.exitType || r.action || "",...facts,
    "本次所得："+(rewards.join("、") || "无"),"耗时："+r.elapsedDays+"日",date,
    ...(r.kind === "promotion" ? ["达成回报："+r.answer,"关系阶段："+r.stage] : [])];
  section.innerHTML='<div class="xsd2-tj-stage"><div class="xsd2-tj-beautified" style="display:block;'+(animate ? '' : 'animation:none')+'"><div class="xsd2-tj-card">'+
    '<span class="xsd2-tj-c3"></span><span class="xsd2-tj-c4"></span><div class="xsd2-tj-head"><span class="xsd2-tj-t">'+esc(title)+'</span>'+
    '<span class="xsd2-tj-seal-s"><span>天</span><span>机</span><span>已</span><span>定</span></span></div>'+
    '<div class="xsd2-tj-verdict">'+esc(verdict)+'</div><div class="xsd2-tj-ledger">'+
    '<div class="xsd2-tj-row"><span class="xsd2-tj-lab">时　序</span><span class="xsd2-tj-val">'+esc(date)+'　<span class="xsd2-tj-up">'+esc(r.elapsedDays)+'日</span></span></div>'+
    '<div class="xsd2-tj-row"><span class="xsd2-tj-lab">'+(r.kind === "promotion" ? '进　境' : '行　囊')+'</span><span class="xsd2-tj-val">'+
    esc(r.kind === "promotion" ? r.answer === "是" ? "关系阶段已更新" : "关系阶段未改变" : rewards.join("、") || "无新增所得")+'</span></div></div>'+
    '<details class="xsd2-tj-ledger-raw"><summary>展开天机底账</summary><pre class="xsd2-tj-raw-settle"></pre></details></div></div></div>';
  section.querySelector("pre").textContent=ledger.filter(Boolean).join("\n");
  return section;
}
function renderSettlement(doc,container,snapshot,effects) {
  const receipts=snapshot && !snapshot.pending ? Object.values(snapshot.settlements || {}).filter(x=>x.floor === snapshot.floor) : [];
  if(receipts.length)ensureStyle(doc);
  const ids=new Set(receipts.map(r=>r.id));
  for(const el of [...container.children]) if(!ids.has(el.dataset.receipt)) el.remove();
  for(const r of receipts){
    let el=[...container.children].find(x=>x.dataset.receipt === r.id);
    const key=JSON.stringify(r);
    if(!el || el._receiptKey !== key){const card=makeCard(doc,r);card._receiptKey=key;if(el)el.replaceWith(card);else container.append(card);el=card;}
    el.hidden=effects?.isMasked(r.id) || false;
  }
}
module.exports={renderSettlement,makeCard,ensureStyle};
