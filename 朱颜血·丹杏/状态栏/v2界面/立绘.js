/**
 * 朱颜血 · 立绘智能寻径与多路径容灾引擎 (zyx_portrait_library.js)
 * 职责：
 * 1. 严格分离常态立绘与关押中立绘；
 * 2. 按「情境（pose）」自动挑选同名变体立绘（拔剑 / 哭泣 / 惊恐 / 愣住 / 事后 / 牢狱 / 关押），
 *    变体缺失时静默回落常态，绝不空图；
 * 3. 具备多路径级联容灾（Fallback Cascade），确保玩家无论在任何解压层级或系统均能加载成功。
 */

(function (root) {
  'use strict';

  function missing() { return { urls: [], source: 'missing' }; }

  function safeText(value) {
    if (typeof value !== 'string') return null;
    let text = value.trim();
    if (!text || /[\u0000-\u001f\u007f\\]/.test(text)) return null;
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

  // 角色归一化：别名 / 本名对照
  function normalizeRole(rawKey) {
    let name = String(rawKey || '').replace(/[（(][^)]*[）)]/g, '').trim();
    name = name.replace(/-(关押中|牢狱\d?)$/, '').trim();
    if (name === '裴玉青' || name === '裴青玉' || name === '潇潇') name = '玉娘';
    if (name === '裴丹杏' || name === '丹杏' || name === '裴掌柜' || name === '掌柜娘子') name = '丹娘';
    if (name === '朱仪瑄' || name === '宁安郡主' || name === '仪瑄') name = '郡主';
    if (name === '雪莲' || name === '白捕快' || name === '白公差') name = '白雪莲';
    if (name === '霜灵' || name === '薛妖女') name = '薛霜灵';
    if (name === '玉莲') name = '白玉莲';
    if (name === '影雀' || name === '侍卫青萝') name = '青萝';
    if (name === '云素' || name === '谢长老') name = '谢云素';
    return name;
  }

  // 情境词归一化：把模型/人工的各种写法收敛到图包里的实际变体词
  function normalizePose(pose) {
    const text = String(pose || '').trim().replace(/[·・、,，。.：:\s]/g, '');
    if (!text) return '';
    const table = [
      [/^(常态|普通|平常|无|无特殊|无变化|—|-)$/, ''],
      [/^(战斗|交战|迎敌|格斗|搏杀|作战|厮杀)$/, '战斗'],
      [/拔剑|出剑|持剑|剑拔|亮剑/, '拔剑'],
      [/哭泣|落泪|泪流|哭|泣/, '哭泣'],
      [/惊恐|惊惧|惊骇|骇然|惧色/, '惊恐'],
      [/愣住|愣|呆住|怔住|愕然/, '愣住'],
      [/性事|事后|云雨|承欢|床笫|缠绵/, '事后'],
      [/牢狱|水牢|囚牢|铁牢|狱中|受刑|受缚|枷锁/, '牢狱'],
      [/关押|在押|收监|羁押|囚犯/, '关押'],
    ];
    for (const [pattern, value] of table) {
      if (pattern.test(text)) return value;
    }
    return text.slice(0, 10);
  }

  // 稳定散列：同一个种子永远得到同一张图（同楼层重绘不跳图，跨楼层才变化）
  function hashIndex(seed, length) {
    if (length <= 1) return 0;
    let hash = 2166136261 >>> 0;
    const text = String(seed || '');
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    // murmur3 收尾混合，避免短种子取模后扎堆
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2246822507) >>> 0;
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 3266489909) >>> 0;
    hash ^= hash >>> 16;
    return (hash >>> 0) % length;
  }

  function rotate(list, seed) {
    if (list.length < 2 || !seed) return list;
    const start = hashIndex(seed, list.length);
    return list.slice(start).concat(list.slice(0, start));
  }

  // 生成按优先级排列的变体 key 列表（带序号的多张图按种子轮换起点）
  function variantKeys(role, pose, seed) {
    const keys = [];
    const push = (key) => { if (key && !keys.includes(key)) keys.push(key); };
    if (!pose) return keys;
    if (pose === '关押') { push(role + '-关押中'); return keys; }
    if (pose === '事后') {
      const list = [role + '-性事后'];
      for (const i of [1, 2, 0]) list.push(role + '-性事后' + i);
      return rotate(list, seed);
    }
    if (pose === '牢狱') {
      const list = [];
      for (const i of [0, 1, 2, 3, 4]) list.push(role + '-牢狱' + i);
      return rotate(list, seed);
    }
    const list = [role + '-' + pose];
    for (const i of [0, 1, 2]) list.push(role + '-' + pose + i);
    return rotate(list, seed);
  }

  function resolve(name, config, origin, pose, seed) {
    const rawKey = safeText(name);
    if (!rawKey) return missing();

    const role = normalizeRole(rawKey);
    const prisonByKey = /关押|牢狱|监牢/.test(rawKey);
    const effectivePose = prisonByKey ? '关押' : normalizePose(pose);

    let hostOrigin;
    try {
      hostOrigin = new URL(origin || root.location.origin);
    } catch (_) {
      try { hostOrigin = new URL(root.location.href); } catch (_) {}
    }

    const gotoBase = () => { try { const u = new URL(config?.baseUrl || 'user/images/zyx_gallery/', hostOrigin?.origin || undefined); return u.href; } catch (_) { return ''; } };

    const candidateUrls = [];
    function addUrl(u) {
      if (!u || !safeText(u)) return;
      if (!candidateUrls.includes(u)) candidateUrls.push(u);
      if (hostOrigin) {
        try {
          const abs = new URL(u, hostOrigin.origin).href;
          if (!candidateUrls.includes(abs)) candidateUrls.push(abs);
        } catch (_) {}
      }
    }

    const baseUrl = config?.baseUrl || 'user/images/zyx_gallery/';
    const dirsFor = (subdir, compact) => {
      const all = [
        baseUrl + subdir + '/',
        'user/images/zyx_gallery/' + subdir + '/',
        '/user/images/zyx_gallery/' + subdir + '/',
        'user/images/朱颜血/' + subdir + '/',
      ];
      if (compact) return all;
      return all.concat([
        'user/images/zyx_gallery/',
        '/user/images/zyx_gallery/',
        '/user/images/朱颜血/' + subdir + '/',
        'user/images/' + subdir + '/',
        '/user/images/' + subdir + '/',
        'characters/zyx_gallery/' + subdir + '/',
        'public/zyx_gallery/' + subdir + '/',
      ]);
    };

    const seen = new Set();
    function addKey(key, subdir, compact) {
      if (!key || seen.has(key + '|' + subdir)) return;
      // 无连字符的非常规文件名（如「薛霜灵牢狱4」）只有显式登记在配置里才尝试，避免无谓 404
      if (key !== role && !key.startsWith(role + '-') && !config?.files?.[key]) return;
      seen.add(key + '|' + subdir);
      const explicit = config?.files?.[key];
      if (explicit) {
        if (/^[a-z][a-z\d+.-]*:/i.test(explicit)) {
          addUrl(explicit);
        } else {
          addUrl(baseUrl + explicit);
          addUrl(explicit);
        }
        return;
      }
      for (const dir of dirsFor(subdir, compact)) addUrl(dir + key + '.png');
    }

    // 青萝/影雀共用身份；战斗图只在明确战斗或拔剑情境下优先。
    if(role==='青萝'&&['战斗','拔剑'].includes(effectivePose)) addKey('影雀','角色立绘',true);

    // 1) 情境变体优先（compact 路径集，404 时快速落到常态）
    const rotateOn = config?.rotate !== false;
    const variantSeed = rotateOn ? String(seed || '') + '|' + role + '|' + effectivePose : '';
    if (effectivePose) {
      const subdir = effectivePose === '关押' ? '关押中立绘' : '角色立绘';
      for (const key of variantKeys(role, effectivePose, variantSeed)) addKey(key, subdir, true);
      // 无连字符特例（如「薛霜灵牢狱4」）只在配置里登记过才追加，作为兜底尾巴
      if (effectivePose === '牢狱') {
        for (let i = 0; i <= 4; i++) {
          const oddKey = role + '牢狱' + i;
          if (config?.files?.[oddKey]) addKey(oddKey, subdir, true);
        }
      } else if (effectivePose !== '关押') {
        for (let i = 0; i <= 2; i++) {
          const oddKey = role + effectivePose + i;
          if (config?.files?.[oddKey]) addKey(oddKey, subdir, true);
        }
      }
    }

    // 2) 常态 / 关押中
    if (effectivePose === '关押') addKey(role + '-关押中', '关押中立绘', false);
    addKey(role, '角色立绘', false);

    // 3) 原始写法兜底（别名文件可能直接登记在配置里）
    if (rawKey !== role && config?.files?.[rawKey]) addKey(rawKey, '角色立绘', true);

    if (!candidateUrls.length) return missing();
    return { urls: candidateUrls, source: effectivePose ? 'variant+fallback' : 'default', pose: effectivePose, role };
  }

  const PortraitLibrary = Object.freeze({ resolve, normalizePose, normalizeRole });

  root.ZYXPortraitLibrary = PortraitLibrary;
  root.ZYX = root.ZYX || {};
  root.ZYX.PortraitLibrary = PortraitLibrary;

  if (typeof module === 'object' && module.exports) {
    module.exports = PortraitLibrary;
  }
})(typeof window !== 'undefined' ? window : globalThis);
