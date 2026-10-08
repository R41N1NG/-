(function (root) {
  'use strict';
  if (!root.document || !root.BSECore || !root.BSEHost) return;
  const host = new root.BSEHost.Host(root);
  root.__branch_story_startup__ = {status: 'loading', error: ''};
  const start = async () => {
    root.__branch_story_plugin__?.destroy?.();
    const engine = new root.BSEEngine.Engine(host); const panel = new root.BSEUI.Panel(engine);
    let destroyed = false;
    const plugin = {version:engine.version, engine, panel, open: () => panel.toggle(), getState: () => engine.snapshot(), submitEvent: (...args) => engine.manualEvent(...args), destroy: () => { if (destroyed) return; destroyed = true; panel.destroy(); engine.destroy(); }};
    root.__branch_story_plugin__ = plugin;
    root.addEventListener('pagehide', plugin.destroy, {once: true});
    panel.mount();
    try {
      if (!host.api('getVariables')) throw new Error('未找到酒馆助手 getVariables 接口，请确认酒馆助手已启用且脚本运行在酒馆助手中');
      await engine.init();
      if (destroyed || engine.destroyed) return plugin;
    } catch (e) {
      engine.settings.enabled = false; engine.error = e.message; panel.render(); throw e;
    }
    try {
      const update = host.api('updateScriptButtonsWith');
      if (update) update(buttons => buttons.filter(b => b.name !== '分支剧本面板'));
    } catch (e) { console.warn('[BSE] 清理旧面板按钮失败', e.message); }
    const parser = host.owners().find(o => o.SlashCommandParser)?.SlashCommandParser;
    const command = host.owners().find(o => o.SlashCommand)?.SlashCommand;
    if (parser?.addCommandObject && command?.fromProps) {
      try { parser.addCommandObject(command.fromProps({name: 'bse', callback: () => { panel.toggle(); return ''; }, helpString: '打开分支剧本面板'})); } catch {}
    }
    root.__branch_story_startup__.status = 'ready'; return plugin;
  };
  root.__branch_story_ready__ = (host.doc()?.body ? Promise.resolve() : new Promise(resolve => root.addEventListener('DOMContentLoaded', resolve, {once: true}))).then(start);
  root.__branch_story_ready__.catch(e => {
    root.__branch_story_startup__ = {status: 'error', error: e.message || String(e)};
    console.error('[BSE] 初始化失败：' + root.__branch_story_startup__.error);
    const toast = host.owners().find(o => o.toastr?.error)?.toastr;
    try { toast?.error(root.__branch_story_startup__.error, '分支剧本启动失败'); } catch {}
  });
})(typeof window !== 'undefined' ? window : globalThis);
