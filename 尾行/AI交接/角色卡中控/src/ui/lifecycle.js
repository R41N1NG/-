"use strict";
/** Resources belong to one mounted UI instance, never to the host page. */
function createLifecycle(window) {
  let disposed = false;
  const cleanups = new Set();
  function cleanup(fn) {
    if (disposed) fn();
    else cleanups.add(fn);
    return fn;
  }
  function on(target, type, callback, options) {
    if (!target || disposed) return;
    target.addEventListener(type, callback, options);
    cleanup(() => target.removeEventListener(type, callback, options));
  }
  function timeout(callback, delay, ...args) {
    if (disposed) return null;
    let id;
    const cancel = () => window.clearTimeout(id);
    id = window.setTimeout(() => {
      cleanups.delete(cancel);
      if (!disposed) callback(...args);
    }, delay);
    cleanup(cancel);
    return id;
  }
  function interval(callback, delay) {
    if (disposed) return null;
    const id = window.setInterval(() => {
      if (!disposed) return callback();
    }, delay);
    cleanup(() => window.clearInterval(id));
    return id;
  }
  function frame(callback) {
    if (disposed) return null;
    let id;
    const cancel = () => window.cancelAnimationFrame(id);
    id = window.requestAnimationFrame((time) => {
      cleanups.delete(cancel);
      if (!disposed) callback(time);
    });
    cleanup(cancel);
    return id;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const fn of cleanups) {
      try {
        fn();
      } catch {}
    }
    cleanups.clear();
  }
  return {
    on,
    timeout,
    interval,
    frame,
    cleanup,
    dispose,
    clearTimeout: (id) => window.clearTimeout(id),
    cancelFrame: (id) => window.cancelAnimationFrame(id),
    get disposed() {
      return disposed;
    },
  };
}
module.exports = { createLifecycle };
