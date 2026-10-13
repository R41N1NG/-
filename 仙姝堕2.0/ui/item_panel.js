"use strict";
const {esc, modal} = require("./dom");
const {describeItem} = require("../runtime/item_catalog");
function openItem(doc, runtime, id, report) {
  const raw = runtime.getSnapshot()?.inventory.find(x => x.id === id || x.name === id);
  if (!raw) return () => {};
  const item = describeItem(raw), el = modal(doc, item.name);
  const close = el.querySelector("[data-close]");
  close.textContent = "×";
  close.setAttribute("aria-label", "关闭物品详情");
  el.querySelector(".xsd2-dialog-body").innerHTML =
    '<p>数量：'+esc(item.count)+' · '+(item.consumable ? '消耗品' : '非消耗品')+'</p>'+
    '<p><strong>介绍</strong><br>'+esc(item.description)+'</p>'+
    '<p><strong>效果</strong><br>'+esc(item.effect)+'</p>'+
    '<p>丢弃每次移除1件，不发送、不耗时；'+(item.consumable ? '使用每次消耗1件。' : '使用保留物品。')+'</p>'+
    '<button type="button" data-use>'+ (item.useMode === 'view' ? '查看' : '使用') +'</button><button type="button" data-discard>丢弃</button>'+
    '<p role="status" aria-live="polite"></p>';
  const buttons = [...el.querySelectorAll("[data-use],[data-discard]")];
  async function act(type) {
    buttons.forEach(b => b.disabled = true);
    try {
      await runtime.dispatchIntent({type, payload:{id}});
      if (el.isConnected) el.close();
    } catch (error) {
      el.querySelector("[role=status]").textContent = error.message;
      buttons.forEach(b => b.disabled = false);
      report?.(error);
    }
  }
  el.querySelector("[data-use]").onclick = () => act("USE_ITEM");
  el.querySelector("[data-discard]").onclick = () => act("DISCARD_ITEM");
  return () => el.remove();
}
module.exports = {openItem};
