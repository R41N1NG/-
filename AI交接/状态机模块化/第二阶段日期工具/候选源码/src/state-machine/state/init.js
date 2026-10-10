/* ═══════════════════════════════════════════════════════════
 * 五 · 初始化（幂等：只在字段缺失时补）
 * ═══════════════════════════════════════════════════════════ */

/**
 * 补齐缺失字段：
 *   · 13 个 known 全 false
 *   · 身份 = 赵无忧　·　阵营 = 墨山道
 * 已经有值的**一律不动**（否则玩家用 /解锁 翻开的锚点会被每次换聊天冲掉）。
 */
async function ensureInit(where) {
  const s = readStatData();
  const known = (s && s.known && typeof s.known === 'object') ? s.known : {};
  const patch = {};
  const missingKnown = ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean');
  if (missingKnown.length) {
    patch.known = {};
    for (const f of missingKnown) {
      if (known[f] === true) continue;
      patch.known[f] = false;
    }
  }
  if (!s || typeof s.relic_progress !== 'object' || s.relic_progress === null) {
    patch.relic_progress = {};
  }
  if (!s || typeof s.身份 !== 'string' || !s.身份) patch.身份 = IDENTITY_DEFAULT;
  if (!s || typeof s.阵营 !== 'string' || !s.阵营) patch.阵营 = FACTION_DEFAULT;
  const identityNow = (patch.身份 !== undefined) ? patch.身份 : (s?.身份 || IDENTITY_DEFAULT);
  if (!s || !Array.isArray(s.inventory) || !s.inventory.length) {
    patch.inventory = defaultInventoryFor(identityNow);
  } else if (identityNow === '自设') {
    // ⚠️ 自设行囊自动净化：防止历史旧聊或初始赵无忧身份残留的物品污染
    let invDirty = false;
    const cleaned = s.inventory.map(it => {
      if (!it || !it.name) return it;
      if (it.name === '墨山道佩剑') {
        invDirty = true;
        return { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' };
      }
      if (it.name === '醉春风' && it.full && (it.full.includes('赵无忧') || it.full.includes('红缨师姐'))) {
        invDirty = true;
        return { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。' };
      }
      return it;
    });
    if (invDirty) patch.inventory = cleaned;
  }

  
  {
    const invBase = Array.isArray(patch.inventory) ? patch.inventory
      : (Array.isArray(s && s.inventory) ? s.inventory : null);
    const LEGACY_COUNT = { 醉春风: 2 };
    if (invBase && invBase.some((it) => it && it.name && it.count === undefined)) {
      patch.inventory = normalizeInventory(invBase.map((it) => (
        it && it.name && it.count === undefined && LEGACY_COUNT[it.name]
          ? { ...it, count: LEGACY_COUNT[it.name] } : it
      )));
      console.log(TAG, `[初始化·${where}] 纳戒老数据迁移：补 id 与数量（醉春风按设计的「两坛」记 2）`);
    }
  }

  /* ⚠️ v1.5：按身份校正「天姝会存在」这一格（见 OPEN_FIELD_FOR_OWNER 注释）。
   *   只在**该为 true 却还是 false** 时补 —— 账本是只升不降的：
   *   玩家用 `/解锁` 翻开的、或从殿主身份切走后留下的 true，一律不回退。 */
  for (const f of openFieldsFor(identityNow)) {
    const cur = known[f];
    if (cur === true) continue;
    patch.known = patch.known || {};
    patch.known[f] = true;
    console.log(TAG, `[初始化] 当前身份「${identityNow}」按身份起手 ⇒ 置「${f} = true」`
      + `（原值 ${cur === undefined ? '未设' : cur}）`);
  }

  if (!Object.keys(patch).length) {
    console.log(TAG, `[初始化·${where}] 字段齐全（known ${ALL_FIELDS.length} 个 + 身份 + 阵营 + 纳戒），无需补`);
    return false;
  }
  console.log(TAG, `[初始化·${where}] 补 ${Object.keys(patch).length} 组：`
    + (patch.known ? `known ${missingKnown.length} 个（${missingKnown.join('、')}）` : 'known 齐全')
    + (patch.身份 ? ` ＋ 身份=${IDENTITY_DEFAULT}` : '')
    + (patch.inventory ? ` ＋ 纳戒物品 ${patch.inventory.length} 件` : '')
    + (patch.阵营 ? ` ＋ 阵营=${FACTION_DEFAULT}` : ''));
  const r = await writeStat(patch, `初始化·${where}`);
  /* ⚠️ v1.5：写没写进去必须**明说**。v1.4 时这里不检查返回值，
   *   于是「初始化跑了但那一笔没落地」在 console 里看不出来（只能靠 /已知 反推）。 */
  if (!r || r.ok !== true) {
    console.error(TAG, `❌ [初始化·${where}] 变量没写进去（${(r && r.via) || '接口不可用'}）`
      + ' —— 账本仍是空的，「进度」校验会一直报「状态条多写」。'
      + ' 可发 /身份 或敲 __xsdBoot() 重试；仍失败请看上面的写失败原因。');
  } else {
    console.log(TAG, `✅ [初始化·${where}] 已落地（${r.via}）—— 账本 now = ${ALL_FIELDS.length} 个 known 全 false，`
      + '「进度」校验从此有真账本可对。');
  }
  return true;
}

