"use strict";
const data = require("./generated-data");
const { createDispatcher } = require("./runtime/dispatcher");
const { createTavernHost } = require("./host/tavern");
const { mountHUD } = require("./ui/status_panel");
const CARD_NAME = "仙姝堕2.0·框架测试";
function start(win) {
  const host = createTavernHost(win, win.parent.document, CARD_NAME),
    doc = host.top.document;
  host.top.XSD2?.dispose?.();
  const runtime = createDispatcher(host, data);
  let hud = null,
    disposed = false;
  const unsubs = [],
    plugins = [];
  runtime.uiPlugins = plugins;
  function active() {
    return !disposed && host.isOurCard();
  }
  const report = (e) => {
    if (active()) host.report(e);
  };
  async function render() {
    if (!active()) return;
    const chat = doc.querySelector("#chat"),
      last = chat?.querySelector(".mes:last-child .mes_text");
    if (!last) return;
    const prior = doc.querySelector("[data-xsd2-root]");
    if (prior?.parentElement === last) {
      hud?.render();
      return;
    }
    hud?.destroy();
    prior?.remove();
    const el = doc.createElement("div");
    el.dataset.xsd2Root = "";
    last.append(el);
    hud = mountHUD(doc, el, runtime, data, report);
  }
  async function mirror() {
    if (active()) await host.syncState(runtime.getSnapshot());
  }
  async function restore() {
    if (!active()) return;
    await runtime.restore();
    await mirror();
    await render();
  }
  async function settle() {
    if (!active()) return;
    await runtime.settleStory();
    await mirror();
    await render();
  }
  function on(name, fn) {
    unsubs.push(
      host.on(name, (...args) => Promise.resolve(fn(...args)).catch(report)),
    );
  }
  on("CHAT_CHANGED", restore);
  on("MESSAGE_DELETED", restore);
  on("MESSAGE_SWIPED", async () => {
    host.markAborted(false);
    if (host.isGenerating()) return;
    await restore();
    await settle();
  });
  on("MESSAGE_UPDATED", settle);
  on("CHARACTER_MESSAGE_RENDERED", async () => {
    await settle();
    await render();
  });
  on("GENERATION_STARTED", async () => {
    if (!active()) return;
    host.markAborted(false);
    host.markGenerating(true);
    await runtime.replay();
    await mirror();
  });
  on("GENERATION_STOPPED", async () => {
    if (!active()) return;
    host.markAborted(true);
    host.markGenerating(false);
    await runtime.stop();
    await mirror();
    await render();
  });
  on("GENERATION_ENDED", async () => {
    host.markGenerating(false);
    await settle();
  });
  // These commands retain the migrated registry's manual unlock / identity controls.
  on("MESSAGE_SENT", async () => {
    if (!active()) return;
    const m = host.context().chat.at(-1);
    if (!m?.is_user) return;
    const match = String(m.mes)
      .trim()
      .match(/^\/?(解锁|锁定|身份|段位)\s+(.+)$/);
    if (!match) return;
    const [, cmd, value] = match;
    let payload;
    if (cmd === "身份") payload = { identity: value };
    else if (cmd === "段位") payload = { 段位: Number(value) };
    else {
      const R = data.rules(runtime.getSnapshot()?.stat_data || {});
      if (!R.ALL_FIELDS.includes(value)) throw Error("字段不在状态台账");
      payload = { ["known." + value]: cmd === "解锁" };
    }
    await runtime.dispatchIntent({ type: "GM_PATCH", payload });
    await mirror();
  });
  unsubs.push(
    runtime.subscribe(() => {
      void render().catch(report);
    }),
  );
  const exposed = {
    runtime,
    registerPlugin(plugin) {
      const unregister = runtime.registerPlugin(plugin);
      plugins.push(plugin);
      hud?.render();
      return () => {
        unregister();
        const i = plugins.indexOf(plugin);
        if (i >= 0) plugins.splice(i, 1);
        hud?.render();
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubs.forEach((f) => f());
      hud?.destroy();
      doc.querySelector("[data-xsd2-root]")?.remove();
      runtime.dispose();
      if (host.top.XSD2 === exposed) delete host.top.XSD2;
    },
  };
  host.top.XSD2 = exposed;
  win.addEventListener("pagehide", exposed.dispose, { once: true });
  win.addEventListener("unload", exposed.dispose, { once: true });
  for (const plugin of host.top.XSD2_PLUGINS || [])
    exposed.registerPlugin(plugin);
  if (active()) runtime.ready().then(mirror).then(render).catch(report);
  return exposed;
}
if (typeof window !== "undefined")
  try {
    start(window);
  } catch (e) {
    console.error("[仙姝堕2.0启动]", e);
    window.parent.toastr?.error(e.message);
  }
module.exports = { start, CARD_NAME };
