"use strict";
/** Owns only the zero-floor DOM. Does not write chat messages, save games or generate prose. */
function createZeroFloorHost({ document, window, lifecycle, preview = false }) {
  const panel = document.getElementById("wx-zero-floor");
  if (!panel) throw new Error("缺少零楼界面");
  const home = document.createComment("wx-zero-floor-home");
  panel.before(home);
  let visible = false,
    wrapper = null;
  const extensions = new Map();
  function restoreOpening() {
    if (!wrapper) return;
    if (wrapper.parentNode) wrapper.replaceWith(...wrapper.childNodes);
    wrapper = null;
  }
  function place() {
    if (lifecycle.disposed) return;
    const message = document.querySelector(
      '#chat .mes[mesid="0"] .mes_text, #chat [data-message-id="0"] .mes_text',
    );
    const destination = message || (preview ? home.parentNode : null);
    if (!visible) {
      panel.hidden = true;
      restoreOpening();
      if (home.parentNode && panel.parentNode !== home.parentNode)
        home.after(panel);
      return;
    }
    if (!destination) {
      panel.hidden = true;
      return;
    }
    if (message) {
      if (wrapper?.parentNode !== message) restoreOpening();
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.dataset.wxOpening = "true";
        wrapper.hidden = true;
        for (const node of [...message.childNodes])
          if (node !== panel) wrapper.append(node);
        message.append(wrapper);
      }
      // Host may append new rendered content without replacing mes_text.
      for (const node of [...message.childNodes])
        if (node !== panel && node !== wrapper) wrapper.append(node);
    }
    if (panel.parentNode !== destination) destination.prepend(panel);
    panel.hidden = false;
  }
  const observer = new window.MutationObserver(place);
  // Observe structural changes only; own mutations converge without a polling timer.
  observer.observe(document.body, { childList: true, subtree: true });
  lifecycle.cleanup(() => {
    observer.disconnect();
    restoreOpening();
    if (home.parentNode) home.after(panel);
    panel.hidden = true;
    home.remove();
  });
  return {
    show() {
      visible = true;
      place();
    },
    hide() {
      visible = false;
      place();
    },
    focus() {
      place();
      panel.scrollIntoView?.({ block: "start", behavior: "smooth" });
    },
    registerExtension(id, node, slot = "after") {
      if (
        !id ||
        extensions.has(id) ||
        !node ||
        !["before", "after"].includes(slot)
      )
        throw new Error("无效或重复的零楼扩展");
      const container = panel.querySelector(`[data-zero-slot="${slot}"]`);
      if (!container) throw new Error("零楼扩展插槽不存在");
      container.append(node);
      extensions.set(id, node);
      const remove = () => {
        node.remove();
        extensions.delete(id);
      };
      lifecycle.cleanup(remove);
      return remove;
    },
  };
}
module.exports = { createZeroFloorHost };
