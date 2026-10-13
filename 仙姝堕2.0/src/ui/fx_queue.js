"use strict";
// 动效队列中枢：覆盖层动效在此排队、逐个播放；统一两件事——
// 1) 结算遮罩活跃（.xsd2-tj-on / .xsd2-settlement-obscured）时避让重试，不与天机演算抢幕；
// 2) prefers-reduced-motion 时跳过播放、直接调 skip 落账。
function createFxQueue(doc, options = {}) {
  const retry = options.retryMs ?? 1200;
  const queue = [];
  const active = new Set();
  let draining = false;
  function settlementBusy() {
    try { return !!doc.querySelector(".xsd2-tj-on,.xsd2-settlement-obscured"); } catch { return false; }
  }
  function reduced() {
    try { return !!doc.defaultView.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  }
  function drain() {
    if (draining) return;
    draining = true;
    (function next() {
      const item = queue.shift();
      if (!item) { draining = false; return; }
      if (reduced()) { try { item.skip?.(); } catch {} next(); return; }
      if (settlementBusy()) { queue.unshift(item); setTimeout(next, retry); return; }
      let handle = null;
      try { handle = item.play(done); } catch { next(); return; }
      function done() {
        if (handle) active.delete(handle);
        next();
      }
      if (handle) active.add(handle);
    })();
  }
  return {
    // enqueue(id, play(done) => handle?, {skip})：play 内部播完/被跳过时必须调 done
    enqueue(id, play, opts = {}) {
      queue.push({ id, play, skip: opts.skip });
      drain();
    },
    clear() {
      queue.length = 0;
      for (const h of active) { try { h?.stop?.(); } catch {} }
      active.clear();
    },
    get pending() { return queue.length + active.size; },
  };
}
module.exports = { createFxQueue };
