(function (root) {
  'use strict';
  if (!root.document || !root.BSECore || !root.BSEHost) return;
  const host = new root.BSEHost.Host(root);
  if (!host.api('getVariables')) return;
  const start = async () => {
    root.__branch_story_plugin__?.destroy?.();
    const engine = new root.BSEEngine.Engine(host); const panel = new root.BSEUI.Panel(engine);
    const plugin = {engine, panel, open: () => panel.toggle(), getState: () => engine.snapshot(), submitEvent: (...args) => engine.manualEvent(...args), destroy: () => { panel.destroy(); engine.destroy(); }};
    root.__branch_story_plugin__ = plugin;
    try { await engine.init(); panel.mount(); }
    catch (e) { engine.settings.enabled = false; engine.error = e.message; panel.mount(); console.error('[BSE] 初始化失败：' + e.message); }
    const name = '分支剧本面板';
    host.api('appendInexistentScriptButtons')?.([{name, visible: false}]);
    const buttonEvent = host.api('getButtonEvent')?.(name); if (buttonEvent) host.on(buttonEvent, buttonEvent, () => panel.toggle());
    const parser = host.owners().find(o => o.SlashCommandParser)?.SlashCommandParser;
    const command = host.owners().find(o => o.SlashCommand)?.SlashCommand;
    if (parser?.addCommandObject && command?.fromProps) {
      try { parser.addCommandObject(command.fromProps({name: 'bse', callback: () => { panel.toggle(); return ''; }, helpString: '打开分支剧本面板'})); } catch {}
    }
    root.addEventListener('pagehide', plugin.destroy, {once: true});
  };
  if (host.doc()?.body) start(); else root.addEventListener('DOMContentLoaded', start, {once: true});
})(typeof window !== 'undefined' ? window : globalThis);
