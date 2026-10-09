/* ═══════════════════════════════════════════════════════════
 * 三 · 零依赖路径读写（不引 lodash，免得版本差异）
 * ═══════════════════════════════════════════════════════════ */

/** 递归深度合并对象，保护已有键（如 known 解锁表）不被浅写冲刷覆盖 */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  const out = (target && typeof target === 'object' && !Array.isArray(target)) ? Object.assign({}, target) : {};
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = out[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      out[k] = deepMerge(tv, sv);
    } else {
      out[k] = sv;
    }
  }
  return out;
}

function getPath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const ks = String(path).split('.');
  const last = ks.pop();
  let cur = obj;
  for (const k of ks) {
    if (cur[k] === null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[last] = value;
  return obj;
}
/** 值太长就截断（快照打印用，避免把整段正文糊到 console 里） */
function clip(v, n) {
  const t = String(v === undefined || v === null ? '' : v);
  const cap = n || 24;
  return t.length > cap ? t.slice(0, cap) + '…' : t;
}

