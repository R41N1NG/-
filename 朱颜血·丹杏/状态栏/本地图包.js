/* 立绘接入端口：只解析显式配置，不读取磁盘、不请求网络、不创建 ObjectURL。 */
(function (root) {
  'use strict';

  function missing() { return { urls: [], source: 'missing' }; }

  function safeText(value) {
    if (typeof value !== 'string') return null;
    let text = value.trim();
    if (!text || /[\u0000-\u001f\u007f\\]/.test(text)) return null;
    // URL 会先归一化 ..，因此必须在 new URL 之前检查（也拦编码后的穿越）。
    let decoded = text;
    try {
      for (let i = 0; i < 6; i += 1) {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
        if (i === 5) return null;
      }
    } catch (_) { return null; }
    if (/[\u0000-\u001f\u007f\\]/.test(decoded)) return null;
    const path = decoded.split(/[?#]/, 1)[0];
    if (path.split('/').some(segment => segment === '..')) return null;
    return text;
  }

  function httpUrl(value, base, sameOriginForRelative) {
    const text = safeText(value);
    if (!text || text.startsWith('//')) return null;
    const explicitScheme = /^[a-z][a-z\d+.-]*:/i.test(text);
    if (explicitScheme && !/^https?:\/\//i.test(text)) return null;
    try {
      const url = new URL(text, base);
      if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
      if (!explicitScheme && sameOriginForRelative && url.origin !== sameOriginForRelative) return null;
      return url;
    } catch (_) { return null; }
  }

  function resolve(name, config, origin) {
    if (!config || typeof config !== 'object' || !config.files || typeof config.files !== 'object') return missing();
    const key = typeof name === 'string' ? name.trim() : '';
    if (!key || !Object.prototype.hasOwnProperty.call(config.files, key)) return missing();
    const file = safeText(config.files[key]);
    if (!file) return missing();
    // 完整 HTTP(S) URL 可直接登记；其余条目在指定图包目录内解析。
    if (/^[a-z][a-z\d+.-]*:/i.test(file)) {
      const absolute = httpUrl(file);
      return absolute ? { urls: [absolute.href], source: 'configured' } : missing();
    }
    let hostOrigin;
    try {
      hostOrigin = new URL(origin || root.location.origin);
      if (!/^https?:$/.test(hostOrigin.protocol)) return missing();
    } catch (_) { return missing(); }
    let directory = new URL('/', hostOrigin.origin);
    if (config.baseUrl !== undefined && config.baseUrl !== '') {
      directory = httpUrl(config.baseUrl, directory, hostOrigin.origin);
      if (!directory) return missing();
      directory.search = '';
      directory.hash = '';
      if (!directory.pathname.endsWith('/')) directory.pathname += '/';
    }
    // 根路径代表宿主同源路径；图包目录可以是显式配置的 HTTP(S) 地址。
    const base = file.startsWith('/') ? hostOrigin.origin : directory.href;
    const url = httpUrl(file, base, file.startsWith('/') ? hostOrigin.origin : null);
    return url ? { urls: [url.href], source: 'configured' } : missing();
  }

  root.ZYXPortraitLibrary = Object.freeze({ resolve });
})(window);
