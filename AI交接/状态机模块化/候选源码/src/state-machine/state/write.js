/* ═══════════════════════════════════════════════════════════
 * 四 · 写入（双写 ＋ 前后快照）
 * ═══════════════════════════════════════════════════════════ */

/** stat_data 快照（只留判读要用的东西，值截断） */
function snapshot() {
  const s = readStatData();
  if (!s) return null;
  const known = (s.known && typeof s.known === 'object') ? s.known : {};
  const display = {};
  for (const k of DISPLAY_FIELDS) {
    if (s[k] !== undefined && s[k] !== null && s[k] !== '') display[k] = clip(s[k]);
  }
  return {
    身份: s.身份 ?? null,
    阵营: s.阵营 ?? null,
    已解锁: ALL_FIELDS.filter((f) => known[f] === true),
    未设字段: ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean'),
    展示栏: display,
    // ⚠️ 在场角色是数组，clip() 会把它印成 [object Object] —— 单独压成一行摘要
    在场角色: Array.isArray(s[CAST_FIELD])
      ? s[CAST_FIELD].map((c) => `${(c && c.名) || '未具名'}(${(c && c.阶段) || '-'})`).join('｜')
      : null,
  };
}
function dumpStat(where) {
  const snap = snapshot();
  console.log(TAG, `[${where}] stat_data 快照：`, snap);
  return snap;
}

/** 把一个 thenable 收敛成 boolean（有些接口在不同版本里可能返回 Promise） */
function settle(ret, name) {
  if (ret && typeof ret.then === 'function') {
    return ret.then(() => true).catch((e) => { console.warn(TAG, `${name} 异步失败：`, msgOf(e)); return false; });
  }
  return Promise.resolve(true);
}

/**
 * 写 stat_data（**双写**：消息层 ＋ 聊天层，两边保持一致）。
 * @param {object} patch 形如 `{ 身份: '…', known: { 封元镇灵环: true } }`（顶层键会深合并）
 * @param {string} why   写这条的原因（日志用）
 */
async function writeStat(patch, why, manual = false) {
  const service = window.__xsdCorrection;
  if (!service) return { ok: false, why: '缺少二级纠错运行时，请重新构建卡片' };
  const result = await service.write(API, patch, manual);
  if (!result.ok) console.warn(TAG, '[统一写入] ' + why + '：' + result.why);
  return result;
}

/* 保留旧写入实现用于审查；生产入口已改统一队列，不调用此函数。 */
async function writeStatLegacy(patch, why) {
  
  patch = patch || {};
  try {
    const curId = readIdentity();
    const curFaction = readFaction();
    if (curId && patch.身份 === undefined) patch.身份 = curId;
    if (curFaction && patch.阵营 === undefined) patch.阵营 = curFaction;
  } catch (e) { /* 读不到就不带，别因为保险反而写坏 */ }
  const keys = Object.keys(patch || {});
  if (!keys.length) return { ok: false, why: '空写入' };
  dumpStat(`${why} · 改动前`);

  const initialChat = currentChatId();
  const detail = [];
  let okAny = false;
  for (const opt of LAYERS) {
    if (currentChatId() !== initialChat) {
      console.warn(TAG, `[写入] 异步写入中检测到聊天已切换（当前 ${currentChatId()} !== 初始 ${initialChat}），中止跨会话写入`);
      break;
    }
    let layerOk = false;
    let via = '';
    // 主路：insertOrAssignVariables —— 深合并，不必先读整层，天然保住别的键
    if (API.insertOrAssignVariables) {
      try {
        const ret = API.insertOrAssignVariables({ stat_data: patch }, opt);
        layerOk = await settle(ret, `insertOrAssignVariables(${opt.type})`);
        if (layerOk) via = 'insertOrAssignVariables';
      } catch (e) {
        console.warn(TAG, `insertOrAssignVariables(${LAYER_LABEL[opt.type]}) 失败：`, msgOf(e));
      }
    }
    // 回退：读出整层 → 深度合并 stat_data 字段 → 整层replace
    if (!layerOk && API.getVariables && API.replaceVariables) {
      try {
        const v = API.getVariables(opt);
        const base = (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
        const existingSd = (base.stat_data && typeof base.stat_data === 'object' && !Array.isArray(base.stat_data)) ? base.stat_data : {};
        base.stat_data = deepMerge(existingSd, patch);
        const ret = API.replaceVariables(base, opt);
        layerOk = await settle(ret, `replaceVariables(${opt.type})`);
        if (layerOk) via = 'replaceVariables';
      } catch (e) {
        console.warn(TAG, `replaceVariables(${LAYER_LABEL[opt.type]}) 失败：`, msgOf(e));
      }
    }
    if (layerOk) okAny = true;
    detail.push(`${LAYER_LABEL[opt.type]}:${layerOk ? '✔' + via : '✘'}`);
  }

  console.log(TAG, `[写入] ${why} → ${detail.join(' ｜ ')}`);
  if (!okAny) console.error(TAG, `❌ 写入失败：${why} —— 变量接口都用不了，闸门这一轮不会更新`);
  dumpStat(`${why} · 改动后`);

  if (okAny) {
    try {
      const refresh = (typeof window !== 'undefined' && typeof window.__xsdRefreshRelics === 'function')
        ? window.__xsdRefreshRelics
        : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdRefreshRelics === 'function')
          ? window.parent.__xsdRefreshRelics : null);
      if (refresh) refresh();
    } catch (e) { /* 忽略 */ }
  }

  return { ok: okAny, via: detail.join(' ｜ ') };
}

/** 写一个 known 字段 */
async function writeKnownField(field, value) {
  if (!ALL_FIELDS.includes(field)) {
    return { ok: false, why: `未知字段「${field}」（可发「锚点」查看清单）` };
  }
  return writeStat({ known: { [field]: !!value } }, `${field} = ${!!value}`, true);
}

/** 写身份（连阵营一起写），写完顺带把世界书那 6 条【身份】条目拨到选中那条 */
async function writeIdentity(name, guard) {
  
  if (typeof guard === 'function') {
    let pass = true;
    try { pass = !!guard(); } catch (e) { pass = false; }
    if (!pass) { console.warn(TAG, '[身份] guard 未通过 ⇒ 终止写入（会话或状态已变）'); return { ok: false, why: 'guard 未通过，已中止' }; }
  }
  if (!IDENTITY_NAMES.includes(name)) {
    return { ok: false, why: `未知身份「${name}」（可用：${IDENTITY_NAMES.join(' / ')}）` };
  }
  const faction = IDENTITY_FACTION[name] ?? FACTION_DEFAULT;
  const statPatch = { 身份: name, 阵营: faction };
  // ⚠️ 关键：新聊天（首楼选身份）或切换身份时，自动同步对应身份的专属起手行囊
  const s = readStatData();
  const curInv = Array.isArray(s?.inventory) ? s.inventory : [];
  const STARTER_ITEM_NAMES = new Set([
    '醉春风', '墨山道佩剑', '随身青锋剑', '随身佩剑', '回春散两盅',
    '天姝令（焚欲）', '《燎原蛊火诀》',
    '天姝令（欢喜）', '《旖旎梵音心经》', '积云檀木念珠',
    '天姝令（浊龙）', '《极乐龙体诀》', '真龙暗卫密符',
    '天姝令（魂欢）', '《情丝化灵录》', '百毒百草囊',
    '《极乐引》', '《极乐引》残篇'
  ]);
  const isStartersOnly = curInv.length === 0 || curInv.every(it => STARTER_ITEM_NAMES.has(it.name));
  if (isNewChat() || isStartersOnly) {
    statPatch.inventory = defaultInventoryFor(name);
  } else {
    const acquiredItems = curInv.filter(it => !STARTER_ITEM_NAMES.has(it.name));
    statPatch.inventory = [...defaultInventoryFor(name), ...acquiredItems];
  }
  const r = await writeStat(statPatch, `身份 → ${name}／阵营 ${faction}`);
  if (!r.ok) return { ok: false, why: '变量接口不可用，身份没写进去' };
  /* ⚠️ v1.5：换身份后同步「天姝会存在」的起手值（殿主 ⇒ true；赵无忧／自设 ⇒ 保持不动）。
   *   只升不降 —— 切回赵无忧不会把它打回 false（那会抹掉玩家已经知道的事实）。 */
  if (openFieldDefaultFor(name)) {
    try { await ensureInit(`换身份→${name}`); }
    catch (e) { console.warn(TAG, `[初始化·换身份→${name}] 失败（已吞掉）：`, msgOf(e)); }
  }
  const entries = await syncIdentityEntries(name);
  return { ok: true, faction, via: r.via, entries };
}

/** 物品名归一：去空白与括号注释、去掉开头的「数词＋量词」⇒ 词干（用来判「是不是同一件东西」） */
