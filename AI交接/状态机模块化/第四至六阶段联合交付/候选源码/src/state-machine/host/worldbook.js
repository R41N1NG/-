/* ═══════════════════════════════════════════════════════════
 * 八 · 世界书身份条目开关（开其一、关其余）
 * ═══════════════════════════════════════════════════════════ */

/**
 * 把世界书里「【身份】…」条目的开关拨到选中那条。
 * ⚠️ 为什么要有这一步：`@@if` 闸门只能保证「内容不进上下文」，世界书面板里 6 条**都显示启用**，
 *    玩家看面板会以为没生效。这里真的翻转 `enabled` 位，做到面板上也「开其一、关其余」。
 * ⚠️ 找不到带「【身份】」条目的世界书时**不报错退出** —— `@@if` 闸门仍然生效，功能不塌。
 */

/** 获取当前角色绑定的目标世界书名称列表（严格限定当前角色，避免遍历修改其他角色世界书） */
async function getTargetWorldbookNames() {
  const targets = new Set();
  // 1. 酒馆助手官方接口：getCharWorldbookNames('current')
  // TavernHelper 返回格式为 { primary: '仙姝堕', additional: [] } 或 数组
  try {
    const fn = API.getCharWorldbookNames || getGlobalOrParent('getCharWorldbookNames');
    if (fn) {
      const r = await fn('current');
      if (Array.isArray(r)) {
        r.forEach((n) => n && targets.add(String(n).trim()));
      } else if (r && typeof r === 'object') {
        if (r.primary) targets.add(String(r.primary).trim());
        if (Array.isArray(r.additional)) r.additional.forEach((n) => n && targets.add(String(n).trim()));
        if (typeof r.additional === 'string' && r.additional) targets.add(String(r.additional).trim());
      }
    }
  } catch (e) {
    console.warn(TAG, '[世界书] getCharWorldbookNames 探测异常：', msgOf(e));
  }

  // 2. SillyTavern 上下文中当前角色绑定的 worldbook (extensions.world)
  try {
    let ctx = null;
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) ctx = SillyTavern.getContext();
    else if (typeof window !== 'undefined' && window.parent && window.parent.SillyTavern && window.parent.SillyTavern.getContext) ctx = window.parent.SillyTavern.getContext();
    else if (API.getContext) ctx = API.getContext();
    else {
      const gCtx = getGlobalOrParent('getContext');
      if (gCtx) ctx = gCtx();
    }
    if (ctx) {
      const chid = (ctx.this_chid !== undefined) ? ctx.this_chid : 0;
      const ch = Array.isArray(ctx.characters) ? ctx.characters[chid] : null;
      if (ch) {
        const w = ch.data?.extensions?.world ?? ch.extensions?.world;
        if (w) targets.add(String(w).trim());
        const extra = ch.data?.extensions?.world_info ?? ch.extensions?.world_info;
        if (extra) targets.add(String(extra).trim());
      }
    }
  } catch (e) { /* 忽略 */ }

  // 3. 兜底扫描当前已有的世界书列表（匹配仙姝/赵无忧）
  try {
    const getNames = API.getWorldbookNames || getGlobalOrParent('getWorldbookNames');
    if (getNames) {
      const all = await getNames();
      if (Array.isArray(all)) {
        all.filter((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧'))).forEach((n) => targets.add(n));
      }
    }
  } catch (e) { /* 忽略 */ }

  // 4. 硬兜底常见本卡世界书命名
  ['仙姝堕', '仙姝墮 · 一张跑全书', '仙姝墮'].forEach((n) => targets.add(n));

  return Array.from(targets).filter(Boolean);
}

async function ensureWorldbookFile(reason) {
  const { getWorldbookNames, getCharacter, loadWorldInfo, saveWorldInfo, updateWorldInfoList, getContext } = API;
  /* ① 先看有没有现成的（优先看当前角色专属/绑定的世界书） */
  const targetBooks = await getTargetWorldbookNames();
  if (targetBooks.length) {
    for (const wb of targetBooks) {
      try {
        const info = loadWorldInfo ? await loadWorldInfo(wb) : null;
        const es = info ? Object.values?.(info.entries ?? {}) ?? [] : [];
        if (es.some((e) => String(e?.comment ?? e?.name ?? '').startsWith('【身份】'))) {
          console.log(TAG, `[世界书] 当前角色已绑定带【身份】条目的世界书「${wb}」（${es.length} 条）—— 用它`);
          return wb;
        }
      } catch (e) { /* 换下一本 */ }
    }
  }
  // 若未绑定，检查全局中是否已有本卡专属命名的世界书（如 仙姝堕 · 世界书），避免无谓重建
  let allNames = [];
  try { allNames = getWorldbookNames ? getWorldbookNames() : []; } catch (e) { /* 忽略 */ }
  if (Array.isArray(allNames) && allNames.length) {
    const candidate = allNames.find((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧')));
    if (candidate) {
      try {
        const info = loadWorldInfo ? await loadWorldInfo(candidate) : null;
        const es = info ? Object.values?.(info.entries ?? {}) ?? [] : [];
        if (es.some((e) => String(e?.comment ?? e?.name ?? '').startsWith('【身份】'))) {
          console.log(TAG, `[世界书] 找到本卡专属世界书「${candidate}」（${es.length} 条）—— 尝试绑定并使用`);
          try { await linkWorldbookToChar(candidate); } catch (e) { /* 忽略 */ }
          return candidate;
        }
      } catch (e) { /* 忽略 */ }
    }
  }

  /* ② 没有 ⇒ 从角色卡的内嵌书建一份 */
  let book = null, cardName = '';
  const ctxAny = (() => {
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) return SillyTavern.getContext();
      if (getContext) return getContext();
    } catch (err) { /* 忽略 */ }
    return null;
  })();
  const avatar = String((ctxAny && ctxAny.characters && ctxAny.characters[ctxAny.this_chid] && ctxAny.characters[ctxAny.this_chid].avatar) || '');
  const chid = (ctxAny && ctxAny.this_chid !== undefined) ? ctxAny.this_chid : 0;
  const pick = (ch) => {
    if (!ch) return null;
    const bk = ch.data?.character_book ?? ch.character_book ?? null;
    if (bk && Array.isArray(bk.entries) && bk.entries.length) { cardName = String(ch.name ?? '').trim(); return bk; }
    return null;
  };
  const tryCards = [
    ['await getCharacter("current")', async () => (getCharacter ? await getCharacter('current') : null)],
    ['await getCharacter(avatar)', async () => (getCharacter && avatar) ? await getCharacter(avatar) : null],
    ['await getCharacter(chid)', async () => (getCharacter ? await getCharacter(chid) : null)],
    ['window.characters[chid]', () => {
      const w = (typeof window !== 'undefined') ? window : null;
      if (!w || !Array.isArray(w.characters)) return null;
      const id = (w.this_chid !== undefined) ? w.this_chid : chid;
      return w.characters[id] ?? w.characters[chid] ?? null;
    }],
    ['ctx.characters[chid]', () => (ctxAny && Array.isArray(ctxAny.characters)) ? (ctxAny.characters[chid] ?? null) : null],
    ['window.chara_card_v3 / chara_card_v2', () => {
      const w = (typeof window !== 'undefined') ? window : null;
      return (w && (w.chara_card_v3 || w.chara_card_v2)) ? { data: (w.chara_card_v3 || w.chara_card_v2) } : null;
    }],
  ];
  for (const pair of tryCards) {
    const how = pair[0];
    try {
      const ch = await pair[1]();
      if (!ch) { console.log(TAG, '[世界书] 这条路拿不到对象：' + how); continue; }
      const bk = pick(ch);
      if (bk) { book = bk; console.log(TAG, '[世界书] 取到内嵌书（' + how + '）：' + bk.entries.length + ' 条，卡名「' + cardName + '」'); break; }
      console.log(TAG, '[世界书] ' + how + ' 拿到了对象但没有内嵌书，它的键：' + Object.keys(ch || {}).join(','));
    } catch (err) { console.warn(TAG, '[世界书] 取卡失败（' + how + '）：' + msgOf(err)); }
  }
  /* ⚠️ 兜到底：直接拉角色卡 PNG，解析 tEXt 里的 chara / ccv3（base64 的卡 JSON） */
  if (!book && avatar) {
    for (const url of ['/characters/' + encodeURIComponent(avatar), '/thumbnail?type=avatar&file=' + encodeURIComponent(avatar)]) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) { console.log(TAG, '[世界书] 取图失败 ' + url + '（HTTP ' + r.status + '）'); continue; }
        const buf = new Uint8Array(await r.arrayBuffer());
        const bk = readBookFromPng(buf);
        if (bk) { book = bk; console.log(TAG, '✅ [世界书] 直接从卡 PNG 里读到内嵌书：' + bk.entries.length + ' 条（' + url + '）'); break; }
        console.log(TAG, '[世界书] ' + url + ' 拿到了内容，但不是可解析的卡 PNG（' + buf.length + ' 字节）');
      } catch (err) { console.warn(TAG, '[世界书] 取图失败 ' + url + '：' + msgOf(err)); }
    }
  }
  if (!book && !avatar) console.warn(TAG, '[世界书] 连当前角色的 avatar 都取不到（ctx.characters 不可用）—— PNG 兜底这条路走不了');
  if (!book || !Array.isArray(book.entries) || !book.entries.length) {
    console.warn(TAG, '[世界书] 角色卡里没有内嵌世界书（或本版接口取不到）—— 身份条目开关交回 @@if 闸门');
    return null;
  }
  if (!saveWorldInfo) {
    console.warn(TAG, '[世界书] 这一版酒馆没有 saveWorldInfo —— 身份条目开关交回 @@if 闸门');
    return null;
  }
  const name = String(book.name ?? '').trim() || (cardName ? cardName + ' · 世界书' : '仙姝堕 · 世界书');
  /* ③ 字面同名的文件若已存在（哪怕是空的），绝不覆盖 —— 玩家可能改过 */
  try {
    const exists = loadWorldInfo ? await loadWorldInfo(name) : null;
    if (exists) {
      console.log(TAG, `[世界书] 文件「${name}」已存在（${Object.keys(exists.entries ?? {}).length} 条）—— 不覆盖`);
      try { await linkWorldbookToChar(name); } catch (e) { /* 忽略 */ }
      return name;
    }
  } catch (e) { /* 不存在时会抛，正常 */ }
  /* ④ 转格式：character_book.entries（数组）→ 世界书文件格式（entries 映射） */
  let data = null;
  try {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) ? SillyTavern.getContext() : (getContext ? getContext() : null);
    if (ctx && typeof ctx.convertCharacterBook === 'function') data = ctx.convertCharacterBook(book);
  } catch (e) { console.warn(TAG, '[世界书] convertCharacterBook 抛错，改用内联转换：', msgOf(e)); }
  if (!data || !data.entries) data = convertBookInline(book);
  try {
    await saveWorldInfo(name, data, true);
    if (updateWorldInfoList) { try { await updateWorldInfoList(); } catch (e) { /* 忽略 */ } }
    console.log(TAG, `✅ [世界书] 已把卡内嵌世界书导出为「${name}」（${Object.keys(data.entries).length} 条）`
      + `—— 起因：${reason}。切身份时就能只开对应的那一条了。`);
    try { await linkWorldbookToChar(name); } catch (e) { /* 绑定失败不影响建书 */ }
    return name;
  } catch (e) {
    console.warn(TAG, '[世界书] 写世界书文件失败：', msgOf(e));
    return null;
  }
}

/** 从一个 PNG 字节流里读出 tEXt 块 chara／ccv3，解出卡 JSON 与其中的内嵌书（只认这两块，别的一概不看） */
function readBookFromPng(bytes) {
  try {
    if (!bytes || bytes.length < 24) return null;
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return null;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const dec = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return s; };
    let p = 8;
    while (p + 12 <= bytes.length) {
      const len = dv.getUint32(p);
      const type = dec(bytes.subarray(p + 4, p + 8));
      if (type === 'tEXt') {
        const data = bytes.subarray(p + 8, p + 8 + len);
        let z = -1; for (let i = 0; i < data.length; i++) if (data[i] === 0) { z = i; break; }
        if (z > 0) {
          const key = dec(data.subarray(0, z));
          if (key === 'chara' || key === 'ccv3') {
            const b64 = dec(data.subarray(z + 1));
            const bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
            let utf8 = bin;
            try { utf8 = decodeURIComponent(escape(bin)); } catch (err) { /* 原始串也能 parse */ }
            const j = JSON.parse(utf8);
            const bd = j.data ?? j;
            const bk = bd.character_book ?? j.character_book ?? null;
            if (bk && Array.isArray(bk.entries) && bk.entries.length) return bk;
          }
        }
      }
      p += 12 + len;
      if (type === 'IEND') break;
    }
  } catch (err) { console.warn(TAG, '[世界书] 解析卡 PNG 失败：', msgOf(err)); }
  return null;
}

/** 把「当前角色 → 这本世界书」的绑定写进酒馆（extensions.world）—— 建/找到书之后调用一次；幂等 */
async function linkWorldbookToChar(wbName) {
  if (!wbName) return false;
  try {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext)
      ? SillyTavern.getContext()
      : ((typeof API !== 'undefined' && API.getContext) ? API.getContext() : null);
    if (!ctx || typeof ctx.writeExtensionField !== 'function') return false;
    const chid = (ctx.this_chid !== undefined) ? ctx.this_chid : 0;
    const ch = Array.isArray(ctx.characters) ? ctx.characters[chid] : null;
    if (!ch) return false;
    const now = ch?.data?.extensions?.world;
    if (String(now ?? '') === String(wbName)) return true;
    const r = await ctx.writeExtensionField(chid, 'world', wbName);
    console.log(TAG, '[世界书] 已把「' + ch.name + '」的主世界书绑定为「' + wbName + '」（writeExtensionField 返回：' + JSON.stringify(r) + '）');
    return true;
  } catch (err) { console.warn(TAG, '[世界书] 写 extensions.world 失败：' + msgOf(err)); return false; }
}

/** 内联版的「character_book → 世界书文件」转换（拿不到 `convertCharacterBook` 时兜底） */
function convertBookInline(book) {
  const out = { entries: {}, originalData: book };
  (book.entries || []).forEach((e, i) => {
    out.entries[String(e.id ?? i)] = {
      uid: e.id ?? i,
      key: Array.isArray(e.keys) ? e.keys : [],
      keysecondary: Array.isArray(e.secondary_keys) ? e.secondary_keys : [],
      comment: e.comment ?? e.name ?? '',
      content: e.content ?? '',
      constant: !!e.constant,
      selective: e.selective ?? undefined,
      order: e.insertion_order ?? e.order ?? 100,
      position: e.position ?? 0,
      disable: e.enabled === false,
      depth: e.extensions?.depth ?? 4,
      displayIndex: e.extensions?.display_index ?? i,
    };
  });
  return out;
}

async function syncIdentityEntries(name) {
  const repFn = API.replaceWorldbook || getGlobalOrParent('replaceWorldbook');
  const getFn = API.getWorldbook || getGlobalOrParent('getWorldbook');
  const getNamesFn = API.getWorldbookNames || getGlobalOrParent('getWorldbookNames');
  const loadFn = API.loadWorldInfo || getGlobalOrParent('loadWorldInfo');
  const saveFn = API.saveWorldInfo || getGlobalOrParent('saveWorldInfo');

  if (!repFn && !saveFn) {
    console.warn(TAG, '[身份] 这一版酒馆助手与宿主均未找到 replaceWorldbook 或 saveWorldInfo，条目开关交回 @@if 闸门');
    return null;
  }

  // 1. 优先获取当前角色专门绑定的世界书（绝不随意触碰全局其他角色的世界书）
  let names = await getTargetWorldbookNames();

  // 2. 检查是否有带【身份】条目的世界书
  let hasIdentityBook = false;
  for (const wb of names) {
    try {
      let es = null;
      if (getFn) es = await getFn(wb);
      else if (loadFn) {
        const info = await loadFn(wb);
        es = info ? Object.values(info.entries ?? {}) : [];
      }
      if ((es || []).some((e) => String((e && (e.name ?? e.comment)) || '').startsWith('【身份】'))) {
        hasIdentityBook = true;
        break;
      }
    } catch (e) { /* 换下一本 */ }
  }

  if (!hasIdentityBook) {
    const built = await ensureWorldbookFile('切身份要拨【身份】条目开关，但当前角色没有带【身份】的世界书');
    if (built) {
      names = await getTargetWorldbookNames();
      if (!names.includes(built)) names.push(built);
    }
  }

  // 3. 兜底：若仍未获取到，尝试全局包含「仙姝/赵无忧」的世界书
  if (!names.length && getNamesFn) {
    try {
      const allNames = await getNamesFn();
      if (Array.isArray(allNames)) {
        const matched = allNames.filter((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧')));
        names.push(...matched);
      }
    } catch (e) { /* 忽略 */ }
  }

  if (!Array.isArray(names) || !names.length) {
    console.warn(TAG, '[身份] 未找到当前角色专属的世界书，条目开关未动（@@if 闸门仍然生效）');
    return null;
  }

  const isLord = ['焚欲殿主', '浊龙殿主', '欢喜殿主', '魂欢殿主'].includes(name);

  for (const wb of names) {
    let es = null;
    let usingRawFormat = false;
    let rawInfo = null;

    if (getFn) {
      try { es = await getFn(wb); } catch (e) { es = null; }
    }
    if ((!es || !es.length) && loadFn) {
      try {
        rawInfo = await loadFn(wb);
        if (rawInfo && rawInfo.entries) {
          es = Object.values(rawInfo.entries);
          usingRawFormat = true;
        }
      } catch (e) { es = null; }
    }
    if (!es || !es.length) continue;

    const nameOf = (e) => String((e && (e.name ?? e.comment)) || '');
    const hit = es.filter((e) => nameOf(e).startsWith('【身份】'));
    if (!hit.length) continue;

    let changed = 0, idChanged = 0, plotChanged = 0, unknown = 0;

    // A. 身份条目：开其一，关其余
    for (const e of hit) {
      const nm = nameOf(e);
      const idName = nm.replace('【身份】', '').trim();
      if (!IDENTITY_NAMES.includes(idName)) { unknown += 1; continue; }
      const want = (idName === name);
      const curEnabled = e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true);
      if (curEnabled !== want) {
        e.enabled = want;
        e.disable = !want;
        changed++;
        idChanged++;
      }
    }
    if (unknown) console.warn(TAG, `[身份] 世界书「${wb}」里有 ${unknown} 条【身份】条目的名字不在身份台账里（跳过）`);

    // B. 剧情条目联动：
    // 选赵无忧：开启 1-15 剧情（非专轨），关闭自设专轨与殿主专轨；
    // 选自设：开启自设专轨 3 条，关闭赵无忧 1-15 剧情与殿主专轨；
    // 选四大殿主：开启殿主专轨 4 条，关闭赵无忧 1-15 剧情与自设专轨！
    const plotEntries = es.filter((e) => nameOf(e).startsWith('【剧情】'));
    for (const e of plotEntries) {
      const nm = nameOf(e);
      let want = false;
      const isCustomTrack = nm.includes('自设专轨');
      const isLordTrack = nm.includes('殿主专轨');
      const isMainTrack = !isCustomTrack && !isLordTrack;

      if (name === '赵无忧') {
        want = isMainTrack;
      } else if (name === '自设') {
        want = isCustomTrack;
      } else if (isLord) {
        want = isLordTrack;
      } else {
        want = false;
      }

      const curEnabled = e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true);
      if (curEnabled !== want) {
        e.enabled = want;
        e.disable = !want;
        changed++;
        plotChanged++;
      }
    }

    if (changed > 0) {
      let replaced = false;
      // 优先 TavernHelper replaceWorldbook
      if (repFn && !usingRawFormat) {
        try {
          await repFn(wb, es, { render: 'immediate' });
          replaced = true;
        } catch (e) {
          console.warn(TAG, `[身份] replaceWorldbook 写回「${wb}」异常，尝试原生 saveWorldInfo：`, msgOf(e));
        }
      }

      // 原生 saveWorldInfo 兜底
      if (!replaced && saveFn) {
        try {
          if (!rawInfo && loadFn) rawInfo = await loadFn(wb);
          if (rawInfo && rawInfo.entries) {
            for (const key of Object.keys(rawInfo.entries)) {
              const ent = rawInfo.entries[key];
              const entName = String(ent.comment || ent.name || '');
              if (entName.startsWith('【身份】')) {
                const idName = entName.replace('【身份】', '').trim();
                if (IDENTITY_NAMES.includes(idName)) {
                  ent.disable = (idName !== name);
                }
              } else if (entName.startsWith('【剧情】')) {
                const isCustomTrack = entName.includes('自设专轨');
                const isLordTrack = entName.includes('殿主专轨');
                const isMainTrack = !isCustomTrack && !isLordTrack;
                let wantPlot = false;
                if (name === '赵无忧') wantPlot = isMainTrack;
                else if (name === '自设') wantPlot = isCustomTrack;
                else if (isLord) wantPlot = isLordTrack;
                ent.disable = !wantPlot;
              }
            }
            await saveFn(wb, rawInfo);
            replaced = true;
          }
        } catch (e) {
          console.warn(TAG, `[身份] saveWorldInfo 原生写回「${wb}」失败：`, msgOf(e));
        }
      }

      // 主动触发酒馆 UI 刷新（如果当前界面打开了世界书抽屉）
      try {
        const topDoc = (typeof window !== 'undefined' && window.parent && window.parent.document) || (typeof document !== 'undefined' && document);
        if (topDoc) {
          const $ = (typeof window !== 'undefined' && window.parent && window.parent.$) || (typeof window !== 'undefined' && window.$);
          if ($) {
            const sel = $('#world_editor_select');
            if (sel.length) {
              const curText = sel.find('option:selected').text();
              const curVal = sel.val();
              if (String(curText).includes(wb) || String(curVal).includes(wb)) {
                sel.trigger('change');
              }
            }
          }
        }
      } catch (e) { /* 忽略 UI 刷新异常 */ }

      if (!replaced) {
        console.warn(TAG, `[身份] 无法将条目修改写回世界书「${wb}」`);
        return null;
      }
    }

    let verify = '';
    try {
      let again = null;
      if (getFn) again = await getFn(wb);
      else if (loadFn) {
        const info = await loadFn(wb);
        again = info ? Object.values(info.entries ?? {}) : [];
      }
      if (again) {
        const isEntryOn = (e) => (e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true));
        const onIds = again.filter((e) => nameOf(e).startsWith('【身份】') && isEntryOn(e)).map(nameOf);
        const onPlots = again.filter((e) => nameOf(e).startsWith('【剧情】') && isEntryOn(e)).map(nameOf);
        verify = `｜回读：开着身份 [${onIds.join(',')}]，剧情开着 ${onPlots.length} 条`;
      }
    } catch (e) { verify = '｜回读失败'; }

    console.log(TAG, `[身份] 世界书「${wb}」：身份 ${hit.length} 条（改 ${idChanged}），剧情 ${plotEntries.length} 条（改 ${plotChanged}），目标「【身份】${name}」${verify}`);
    return { wb, total: hit.length, changed, idChanged, plotChanged };
  }

  console.warn(TAG, '[身份] 当前角色的世界书中未找到带「【身份】」的条目，条目开关未动（@@if 闸门仍然生效）');
  return null;
}

