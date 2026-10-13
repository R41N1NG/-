"use strict";
// 顺序播放覆盖层；等待结算遮罩撤下，减弱动态直接skip。
// clear可复用，取消等待计时器并使旧done失效，切聊天后不会续播旧项。
function createFxQueue(doc, options = {}) {
  const clock = options.clock || doc.defaultView;
  const retry = options.retryMs ?? 1200;
  const queue = [];
  let active = null, timer = null, generation = 0;
  function settlementBusy() {
    try { return !!doc.querySelector(".xsd2-tj-on,.xsd2-settlement-obscured"); } catch { return false; }
  }
  function reduced() {
    try { return !!doc.defaultView.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  }
  function drain() {
    if (active || timer !== null) return;
    while (queue.length) {
      if (reduced()) { const item = queue.shift(); try { item.skip?.(); } catch {} continue; }
      if (settlementBusy()) {
        const epoch = generation;
        timer = clock.setTimeout(() => { timer = null; if (epoch === generation) drain(); }, retry);
        return;
      }
      const item = queue.shift(), run = { handle: null, generation };
      active = run;
      const done = () => {
        if (active !== run || generation !== run.generation) return;
        active = null; drain();
      };
      try { run.handle = item.play(done); }
      catch (e) { console.error("[fx_queue] play error", e); done(); }
      return;
    }
  }
  return {
    // play(done)的done可同步调用；不返回handle的播放也计为活跃。
    enqueue(id, play, opts = {}) { queue.push({ id, play, skip: opts.skip }); drain(); },
    clear() {
      generation++; queue.length = 0;
      clock.clearTimeout(timer); timer = null;
      const stopped = active; active = null;
      try { stopped?.handle?.stop?.(); } catch {}
    },
    get pending() { return queue.length + (active ? 1 : 0); },
  };
}
module.exports = { createFxQueue };
