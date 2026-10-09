(function (root) {
  'use strict';
  if (!root.document) return;
  root.__branch_story_loader_cleanup__?.();
  const urls = root.__BSE_LOADER_URLS__ || [
    'https://raw.githubusercontent.com/R41N1NG/-/main/酒馆剧本插件/branch_story_tavern_helper_import.json?bse=1.4.6',
    'https://testingcf.jsdelivr.net/gh/R41N1NG/-@main/酒馆剧本插件/branch_story_tavern_helper_import.json?bse=1.4.6',
    'https://cdn.jsdelivr.net/gh/R41N1NG/-@main/酒馆剧本插件/branch_story_tavern_helper_import.json?bse=1.4.6',
  ];
  let doc; try { doc = root.parent.document; } catch { doc = root.document; }
  doc ||= root.document;
  const controllers = new Set(); let alive = true; let button = null;
  const status = root.__branch_story_loader_status__ = {status: 'loading', stage: '正在启动加载器', attempts: [], error: ''};
  const note = text => {
    if (!alive) return;
    status.stage = text;
    if (!button && doc.body) {
      doc.getElementById('bse-loader-status')?.remove();
      button = doc.createElement('button'); button.id = 'bse-loader-status'; button.type = 'button'; button.setAttribute('role', 'status');
      button.style.cssText = 'position:fixed;display:block!important;visibility:visible!important;opacity:1!important;right:10px;bottom:calc(140px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:calc(100vw - 20px);min-height:44px;border:1px solid #81bda4;border-radius:12px;padding:10px 14px;background:#21473b;color:#e7ecf6;font:16px/1.5 system-ui;white-space:normal;overflow-wrap:anywhere;cursor:pointer';
      button.onclick = () => {
        const plugin = root.__branch_story_plugin__;
        if (plugin?.panel?.shadow) { plugin.open(); button.style.setProperty('display', 'none', 'important'); }
        else if (status.error) doc.defaultView.alert(status.error);
      };
      doc.body.appendChild(button);
    }
    if (button) { button.textContent = text; button.title = status.error || text; }
    console.info('[BSE 加载器] ' + text);
  };
  const cleanup = () => { alive = false; for (const c of controllers) c.abort(); controllers.clear(); button?.remove(); };
  root.__branch_story_loader_cleanup__ = cleanup;
  root.addEventListener('pagehide', cleanup, {once: true});
  const run = async () => {
    if (!doc.body) await new Promise(resolve => doc.addEventListener('DOMContentLoaded', resolve, {once: true}));
    note('剧本：正在下载…');
    let data = null;
    for (let i = 0; i < urls.length; i++) {
      if (!alive) return;
      const controller = new AbortController(); controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), root.__BSE_LOADER_TIMEOUT__ || 12000);
      note('剧本：下载线路 ' + (i + 1) + '/' + urls.length + '…');
      try {
        const response = await fetch(urls[i], {cache: 'no-cache', signal: controller.signal});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const parsed = await response.json();
        if (parsed.type !== 'script' || typeof parsed.content !== 'string' || !parsed.content.trim()) throw new Error('链接没有返回有效的酒馆助手脚本');
        const version = parsed.content.match(/Branch Story Engine v(\d+)\.(\d+)\.(\d+)/);
        const current = version && (+version[1] > 1 || +version[1] === 1 && (+version[2] > 4 || +version[2] === 4 && +version[3] >= 6));
        if (!current || !parsed.content.includes('__branch_story_ready__')) throw new Error('线路返回旧版插件缓存，继续尝试备用线路');
        data = parsed; status.attempts.push({line: i + 1, ok: true}); break;
      } catch (e) { status.attempts.push({line: i + 1, ok: false, error: e.name === 'AbortError' ? '连接超时或已取消' : e.message}); }
      finally { clearTimeout(timer); controllers.delete(controller); }
    }
    if (!alive) return;
    if (!data) throw new Error('所有下载线路均失败。' + status.attempts.map(a => '线路 ' + a.line + '：' + a.error).join('；') + '。可改用下载 JSON 后导入。');
    note('剧本：下载完成，正在启动…');
    (0, eval)(data.content);
    if (!root.__branch_story_ready__) throw new Error('下载的插件未提供启动确认，可能是旧缓存；请重新加载或导入最新 JSON');
    let timer;
    try {
      await Promise.race([root.__branch_story_ready__, new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('插件启动超过 15 秒，请查看脚本日志中的初始化错误')), 15000); })]);
    } finally { clearTimeout(timer); }
    if (!alive) return;
    const plugin = root.__branch_story_plugin__;
    if (!plugin?.panel?.shadow?.querySelector('.launcher')) throw new Error('插件未创建剧情面板，请查看脚本日志');
    status.status = 'ready'; status.stage = '启动完成'; button?.remove();
    console.info('[BSE 加载器] 启动完成，点击“剧本”打开面板');
  };
  root.__branch_story_loader_ready__ = run().catch(e => {
    if (!alive) return;
    status.status = 'error'; status.error = e.message || String(e); note('剧本：加载失败（点击查看原因）');
    console.error('[BSE 加载器] ' + status.error);
    try { (root.toastr || root.parent.toastr)?.error(status.error, '分支剧本加载失败'); } catch {}
  });
})(typeof window !== 'undefined' ? window : globalThis);
