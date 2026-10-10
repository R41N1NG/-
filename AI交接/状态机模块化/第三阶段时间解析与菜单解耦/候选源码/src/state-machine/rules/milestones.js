async function applyMilestones(p, messageId, text) {
  const list = Array.isArray(p?.里程碑) ? p.里程碑 : null;
  const bookIn = Array.isArray(p?.破处) ? p.破处 : [];
  const nadeIn = (p?.纳戒 && typeof p.纳戒 === 'object') ? p.纳戒 : null;
  const nadeHas = Boolean(nadeIn && ((nadeIn.获得 || []).length || (nadeIn.消耗 || []).length));
  const relicActs = Array.isArray(p?.名器互动) ? p.名器互动 : [];

  const sd0 = readStatData() || {};
  const prevRelicProgress = (sd0.relic_progress && typeof sd0.relic_progress === 'object') ? sd0.relic_progress : {};
  const hasRelicWork = relicActs.length > 0 || Object.values(prevRelicProgress).some((rp) => (rp.history || []).some((h) => Number(h.floor) === Number(messageId)));

  if (!list && !bookIn.length && !nadeHas && !hasRelicWork) return [];      // 四栏都没有且无名器回溯 ⇒ 什么都不做
  const known = readKnown() || {};
  
  const proseForAnchor = stripStatusBlock(text);
  /* 2026-10-08（gpt 04 号①）：与段位推进共用同一份已校验集合（本轮在段位那一步已算过一次，
     写在 p.本轮已验证锚点 上；没有就现算）。不再让「原始申报」和「校验结果」两套并行。 */
  const _v = Array.isArray(p?.本轮已验证锚点) ? { good: p.本轮已验证锚点, bad: [], dropped: [] } : validateAnchors(list || [], proseForAnchor, messageId, known, bookIn);
  const good = _v.good, bad = _v.bad, dropped = _v.dropped;
  let news = [];
  const correctionRecords = (readStatData() || {}).人工纠错?.覆盖 || {};
  const correctionAllows = f => correctionRecords[JSON.stringify(['known', f])]?.value !== false;
  for (const f of good) if (correctionAllows(f) && known[f] !== true && !news.includes(f)) news.push(f);
  if (list && !list.length) console.log(TAG, `[实际发生] 第 ${messageId} 楼：写了「无」`);
  if (!list) console.log(TAG, `[实际发生] 第 ${messageId} 楼没有这一栏，本轮只处理 <破处>`);
  if (bad.length) {
    console.warn(TAG, `⚠️ [实际发生] 第 ${messageId} 楼有 ${bad.length} 个**不属于字段台账**的名字，已丢弃：${bad.join('、')}`
      + '（只能用状态字段表里那一串；自造词不会被记账）');
  }
  
  const MINGQI_CHENG = ALL_FIELDS.filter((f) => /成形$/.test(f));
  const willTrue = (f) => news.includes(f) || known[f] === true;
  const curPlayerId = readIdentity() || '赵无忧';
  const isCustomExplicit = curPlayerId.includes('自设') || curPlayerId.includes('玩家') || curPlayerId.includes('{{user}}');
  const isZhao = !isCustomExplicit && curPlayerId.includes('赵无忧');
  const isFenyu = curPlayerId.includes('焚欲殿') || curPlayerId.includes('残阳');
  const isHuanxi = curPlayerId.includes('欢喜殿') || curPlayerId.includes('肉山');
  const isZhuolong = curPlayerId.includes('浊龙殿') || curPlayerId.includes('九皇子');
  const isHunhuan = curPlayerId.includes('魂欢殿') || curPlayerId.includes('病相思');
  const isCustom = isCustomExplicit || (!isZhao && !isFenyu && !isHuanxi && !isZhuolong && !isHunhuan);

  

  // ① 破处簿：与历史累积合并（先记的为准，不许模型来回改口）
  const proseOuter = stripStatusBlock(text);           // 本楼正文（去掉状态栏），破处依据只看它
  
  const anchorLog = (sd0.锚点账本 && typeof sd0.锚点账本 === 'object') ? { ...sd0.锚点账本 } : {};
  const anchorFinger = JSON.stringify((list || []).map((x) => normalizeAnchorName(String(x).trim())).filter(Boolean));
  const prevAnchor = anchorLog[String(messageId)] || null;
  const sameAnchorFinger = Boolean(prevAnchor && prevAnchor.指纹 === anchorFinger);
  let anchorLogChanged = false;
  const rollbackAnchors = (floorKey, entry) => {
    for (const f of (entry.新置真 || [])) {
      const elsewhere = Object.keys(anchorLog).some((k) => k !== floorKey && anchorLog[k] && (anchorLog[k].新置真 || []).includes(f));
      if (elsewhere) continue;                       // 别的楼也记过它 ⇒ 不该回滚
      if (known[f] === true) { delete known[f]; rolledBack.push(f); }   // 就地改，后续判定看到的就是回滚后的状态
    }
  };
  const rolledBack = [];
  if (prevAnchor && !sameAnchorFinger) {
    rollbackAnchors(String(messageId), prevAnchor);
    anchorLog[String(messageId)] = null;             // null 墓碑（深合并不认 delete）
    anchorLogChanged = true;
    if (rolledBack.length) console.log(TAG, `[锚点回退] 第 ${messageId} 楼内容变了 ⇒ 回滚这一楼置真的锚点：${rolledBack.join('、')}`);
  }
  const prevBook = (sd0.破处者 && typeof sd0.破处者 === 'object') ? sd0.破处者 : {};
  const mergedBook = Object.assign({}, prevBook);
  let bookChanged = false;
  for (const it of bookIn) {
    const h = it.持有者;
    let w = it.破处者;

    // 防冒名守卫：当前玩家身份若非赵无忧，但模型在破处簿中误将破处者报为「赵无忧」或留空
    // 强制纠偏为当前真实玩家身份，确保战果与名器归属不被赵无忧冒名抢夺
    if (!isZhao && (w === '赵无忧' || !w)) {
      console.warn(TAG, `⛔ [破处守卫] 第 ${messageId} 楼当前玩家身份为「${curPlayerId}」，模型误将破处者报为「${w}」⇒ 强制纠偏为当前玩家身份「${curPlayerId}」`);
      w = curPlayerId;
    }
    
    if (proseOuter && !proseOuter.includes(h)) {
      console.warn(TAG, `⛔ [破处闸门] 第 ${messageId} 楼丢弃「${h}、${w}」：本楼正文里根本没有「${h}」（八成是照抄写法示例）。`
        + `真要手工补，发「/解锁 ${h}处女丧失」。`);
      continue;
    }
    const hard = proseOuter ? DEFLOWER_HARD_RES.find(([re]) => re.test(proseOuter)) : null;
    if (proseOuter && !hard) {
      console.warn(TAG, `⛔ [破处闸门] 第 ${messageId} 楼丢弃「${h}、${w}」：本楼正文里没有破身实证（破身／落红／初夜这类字样一个都没有）。`
        + `若确实是含蓄写法，发「/解锁 ${h}处女丧失」手工补。`);
      continue;
    }
    if (!mergedBook[h]) { mergedBook[h] = w; bookChanged = true; }
    else if (mergedBook[h] !== w) {
      console.warn(TAG, `[破处簿] 第 ${messageId} 楼「${h}」已记作「${mergedBook[h]}」，本次的「${w}」不覆盖（先记的为准）`);
    }
  }
  const lost = (holder) => Boolean(mergedBook[holder])
    || known[holder + '处女丧失'] === true || news.includes(holder + '处女丧失');

  
  /* ⚠️ 键用**持有者**（FORM_OF_HOLDERS 里的 form 带「成形」后缀，用名器名当键会取不到）。 */
  const FORM_EXTRA = {
    楚灵夜: ['楚灵夜后窍开发'],
  };
  const extraOk = (g) => g.holders.every((h) => (FORM_EXTRA[h] || []).every((f) => willTrue(f)));
  const extraWhy = (g) => g.holders.flatMap((h) => FORM_EXTRA[h] || []).join('／');

  // ② 两条通道 → 补成形（跨回合累加：双姝要两个人都丧失才算，先后在不同回合也算）
  for (const g of FORM_OF_HOLDERS) {
    if (!g.holders.every(lost)) continue;
    if (!extraOk(g)) {
      console.log(TAG, `[成形闸门] 「${g.form}」的持有者已丧失，但额外条件未满足（还差：${extraWhy(g)}）⇒ 暂不成形`);
      continue;
    }
    if (willTrue(g.form)) continue;
    news.push(g.form);
    console.log(TAG, `↳ 派生：${g.holders.map((h) => h + '处女丧失').join(' ＋ ')}${extraWhy(g) ? ' ＋ ' + extraWhy(g) : ''} ⇒ 「${g.form}」`);
  }

  
  const STAGE_PREFIX_FIX = { 灵犀同心: '灵犀同心穴' };
  for (const g of FORM_OF_HOLDERS) {
    if (!willTrue(g.form)) continue;
    const base = g.form.replace(/成形$/, '');
    const prefix = STAGE_PREFIX_FIX[base] || base;
    const firstAnchor = prefix + '一阶段';
    if (!ALL_FIELDS.includes(firstAnchor)) continue;
    if (known[firstAnchor] === true || news.includes(firstAnchor)) continue;
    news.push(firstAnchor);
    console.log(TAG, `↳ 派生：${g.form} ⇒ 「${firstAnchor}」（落红／初度就是第一阶段，成形当刻一并记上，阶段条才进得了正文）`);
  }
  /* 2026-10-08（gpt 17 号 §2 ⑤⑦⑧）：两条"自动派发"改为**带来源账本的事务派生** ——
     触发看正文实际出场实证（不再沿用 known['阎雷子脱困'] 当资格）；派发时补写明确 NPC 归属与来源；
     依赖重算：账本里来源清零的才撤（人工来源不撤）。全过程在纯函数 `deriveRelicClosure` 里可离线测。 */
  news = news.filter(correctionAllows);
  const 出场实证 = { 柳含烟: 出场实证名('柳含烟', proseOuter) };
  const 派生账本旧 = (sd0.派生账本 && typeof sd0.派生账本 === 'object') ? sd0.派生账本 : {};
  const 归属来源旧 = (sd0.名器归属来源 && typeof sd0.名器归属来源 === 'object') ? sd0.名器归属来源 : {};
  const 闭包 = deriveRelicClosure({
    known, news, ledger: 派生账本旧, 名器归属: sd0.名器归属 || {}, 归属来源: 归属来源旧,
    messageId, 指纹: anchorFinger, 出场实证, 人工纠错: sd0.人工纠错,
  });
  news = 闭包.news;
  for (const l of 闭包.日志) console.log(TAG, '↳ 派生：' + l);
  const 派生撤销 = 闭包.撤销 || [];
  const 归属补写 = 闭包.归属补写 || {};
  const 归属来源补写 = 闭包.归属来源补写 || {};
  const 派生账本新 = 闭包.ledger || {};
  const 派生账本变 = JSON.stringify(派生账本新) !== JSON.stringify(派生账本旧);

  // ③ 冲突消解：只报成形而两条通道都没坐实的，先查正文，再决定挽救还是丢弃
  const rawText = String(text ?? '');
  for (const g of FORM_OF_HOLDERS) {
    const at = news.indexOf(g.form);
    if (at === -1) continue;
    
    if (!extraOk(g)) {
      news.splice(at, 1);
      console.warn(TAG, `⛔ [成形闸门] 第 ${messageId} 楼丢弃「${g.form}」：额外条件未满足（还差：${extraWhy(g)}）。`
        + `要手工补，先「/解锁 ${(g.holders.flatMap((h) => FORM_EXTRA[h] || [])[0])}」再「/解锁 ${g.form}」。`);
      continue;
    }
    if (g.holders.every((h) => Boolean(mergedBook[h]))) continue;                     // 通道①：破处簿
    if (g.holders.every((h) => known[h + '处女丧失'] === true || news.includes(h + '处女丧失'))) continue;  // 通道②：锚点
    const hits = g.holders.map((h) => nearDeflowerWord(rawText, h));
    if (rawText && hits.every(Boolean)) {
      console.log(TAG, `⚠️ [成形闸门] 第 ${messageId} 楼漏标挽救：「${g.form}」没带破处簿与处女丧失锚点，`
        + `但正文里 ${g.holders.map((h, i) => `「${h}」附近出现「${hits[i]}」`).join('、')} ⇒ 按正文实锤放行（归属按身份兜底）`);
      continue;
    }
    news.splice(at, 1);
    console.warn(TAG, `⛔ [成形闸门] 第 ${messageId} 楼丢弃「${g.form}」：破处簿与「${g.holders.join('／')}处女丧失」都没记，`
      + `本回合正文里也查不到落在这几人身上的破身实证。要手工补，发「/解锁 ${g.form}」。`);
  }

  // ④ 破处者簿 → 名器归属表（面板第一优先读 `stat_data.名器归属`）
  const relicOwners = {};
  for (const h of Object.keys(mergedBook)) {
    const r = HOLDER_TO_RELIC[h];
    if (r && !relicOwners[r]) relicOwners[r] = mergedBook[h];
  }
  /* ⑦ 派生事务里写下的明确 NPC 归属（只在没有更强来源时；不覆盖玩家/GM 的写入） */
  const 名器归属来源新 = Object.assign({}, 归属来源旧, 归属来源补写);
  for (const k of Object.keys(归属补写)) relicOwners[k] = 归属补写[k];
  const 归属来源变 = JSON.stringify(名器归属来源新) !== JSON.stringify(归属来源旧);
  const ownersChanged = JSON.stringify(sd0.名器归属 || {}) !== JSON.stringify(relicOwners);

  const playerRelicFormed = (function () {
    if (isFenyu) return willTrue('灼酒流炎穴成形') || willTrue('灵犀同心成形');
    if (isHuanxi) return willTrue('般若菩提菊成形') || willTrue('心魔茶璎乳成形');
    if (isZhuolong) return willTrue('九幽玄阴穴成形') || willTrue('玉虎噙香乳成形');
    if (isHunhuan) return willTrue('梅蕊穴成形') || willTrue('凤凰羽花成形');
    if (isZhao) {
      
      if (willTrue('北冥潮生穴成形')) return true;
      if (FORM_OF_HOLDERS.some((g) => willTrue(g.form))) return true;
      return false;
    }
    // 自设身份：自设玩家攻略任意名器均有效
    return MINGQI_CHENG.some(willTrue) || ALL_FIELDS.filter(f => /阶段$/.test(f)).some(willTrue);
  })();

  if (playerRelicFormed && known['获得任意名器'] !== true && !news.includes('获得任意名器')) {
    news.push('获得任意名器');
    console.log(TAG, `↳ 派生：玩家身份（${curPlayerId}）已有名器成形 ⇒ 记下「获得任意名器」`);
  }
  // 检查随剧情锚点推进获得的物品
  const sd = readStatData() || {};
  let inv = Array.isArray(sd.inventory) ? sd.inventory.slice() : defaultInventoryFor(curPlayerId);
  let invChanged = false;
  if (curPlayerId === '自设') {
    inv = inv.map(it => {
      if (!it || !it.name) return it;
      if (it.name === '墨山道佩剑') {
        invChanged = true;
        return { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' };
      }
      if (it.name === '醉春风' && it.full && (it.full.includes('赵无忧') || it.full.includes('红缨师姐'))) {
        invChanged = true;
        return { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。' };
      }
      return it;
    });
  }
  const hasItem = (nm) => inv.some((it) => it && (it.name === nm || (it.name && it.name.includes(nm))));
  
  const dispatched = (sd.派发记录 && typeof sd.派发记录 === 'object') ? { ...sd.派发记录 } : {};
  let dispatchChanged = false;
  if (willTrue('极乐引入手') && !hasItem('极乐引') && !dispatched['极乐引残篇']) {
    inv.push({ name: '《极乐引》残篇', desc: '记载天下诸般名器与双修造化之无上秘录。', full: '极乐楼不传之秘，封面柔韧若人皮，载有世间至阴至纯名器录与落红、情动、沉沦之境。能辨诸姝体质，演极乐造化。' });
    invChanged = true;
    dispatched['极乐引残篇'] = messageId;
    dispatchChanged = true;
  }
  if ((willTrue('赠送冰心泪') || willTrue('孤月定情')) && !hasItem('冰心泪') && !dispatched['冰心泪']) {
    inv.push({ name: '冰心泪', desc: '孤月亲炼相赠的护神法器项链，清凉温润。', full: '墨山道四弟子孤月以本源寒气与灵髓精炼之成对法器，戴于颈间可清心宁神、抵御诸邪侵袭与心魔扰动。' });
    invChanged = true;
    dispatched['冰心泪'] = messageId;
    dispatchChanged = true;
  }
  
  const nadeLog = (sd0.纳戒账本 && typeof sd0.纳戒账本 === 'object') ? { ...sd0.纳戒账本 } : {};
  const nadeFinger = nadeIn ? JSON.stringify([(nadeIn.消耗 || []).map((x) => [x.name, x.count]), (nadeIn.获得 || []).map((x) => [x.name, x.count])]) : '';
  const prevEntry = nadeLog[String(messageId)] || null;
  const sameFinger = Boolean(prevEntry && prevEntry.指纹 === nadeFinger);
  let ledgerChanged = false;
  if (prevEntry && !sameFinger) {
    /* ① 这一楼的内容变了（重生成／切换回复／编辑，或这一栏被撤掉）⇒ **先回滚旧账** */
    for (const x of (prevEntry.消耗 || [])) {
      inv = applyItemChange(inv, { kind: 'gain', name: x.name, count: x.count }).inv;   // 消耗过的加回来
    }
    for (const x of (prevEntry.获得 || [])) {
      inv = applyItemChange(inv, { kind: 'loss', name: x.name, count: x.count }).inv;   // 获得过的扣回去
    }
    
    nadeLog[String(messageId)] = null;
    invChanged = true;
    ledgerChanged = true;
    console.log(TAG, `[纳戒] 第 ${messageId} 楼内容变了 ⇒ 先回滚旧账（消耗 ${(prevEntry.消耗 || []).length} 项／获得 ${(prevEntry.获得 || []).length} 项）再重算`);
  } else if (sameFinger) {
    console.log(TAG, `[纳戒] 第 ${messageId} 楼这一栏与上次一致 ⇒ 不重复入账（幂等）`);
  }
  if (nadeIn && !sameFinger) {
    const done消耗 = [], done获得 = [];
    
    const prose = stripStatusBlock(text);
    for (const x of (nadeIn.消耗 || [])) {
      if (!itemEvidenceIn(prose, x.name)) {
        console.warn(TAG, `[纳戒] 第 ${messageId} 楼报的「消耗：${x.name}」在正文里找不到依据 ⇒ **丢弃**（八成是照抄写法示例；真要扣，发 /消耗物品 ${x.name}）`);
        continue;
      }
      const r = applyItemChange(inv, { kind: 'loss', name: x.name, count: x.count });
      inv = r.inv;
      if (r.ok) {
        invChanged = true;
        done消耗.push({ name: r.name, count: r.applied });
        console.log(TAG, `[纳戒] 第 ${messageId} 楼消耗「${r.name}」×${r.applied}（${r.note}）`);
      } else {
        console.warn(TAG, `[纳戒] 第 ${messageId} 楼要消耗「${x.name}」，纳戒里没有这一件（已忽略）`);
      }
    }
    for (const it of (nadeIn.获得 || [])) {
      if (!itemEvidenceIn(prose, it.name)) {
        console.warn(TAG, `[纳戒] 第 ${messageId} 楼报的「获得：${it.name}」在正文里找不到依据 ⇒ **丢弃**（真要加，发 /获得物品 ${it.name}）`);
        continue;
      }
      const r = applyItemChange(inv, { kind: 'gain', name: it.name, count: it.count || 1, desc: it.desc, full: it.full });
      inv = r.inv;
      if (r.ok) {
        invChanged = true;
        done获得.push({ name: r.name, count: r.applied });
        console.log(TAG, `[纳戒] 第 ${messageId} 楼收入「${r.name}」×${r.applied}`);
      }
    }
    if (done消耗.length || done获得.length) {
      nadeLog[String(messageId)] = { 指纹: nadeFinger, 消耗: done消耗, 获得: done获得 };
      ledgerChanged = true;
    }
  }
  inv = normalizeInventory(inv);
  if (ledgerChanged) invChanged = true;

  // ── 名器动作申报核验与浸润累进（首期：灼酒流炎穴试点）──
  let relicProgressChanged = false;
  let allRelicProgress = (typeof structuredClone === 'function')
    ? structuredClone(prevRelicProgress)
    : JSON.parse(JSON.stringify(prevRelicProgress));
  const swipeId = p?.swipeId ?? 0;
  const textHash = hashText(text);

  // 聚合本轮新成形与历史成形，防止当轮刚成形的名器被判为「尚未成形」
  const knownNow = Object.assign({}, known);
  for (const f of news) knownNow[f] = true;

  for (const pilotId of Object.keys(RELIC_PILOT_CONFIG)) {
    const act = relicActs.find((a) => a.relicId === pilotId) || null;
    const existingHistory = allRelicProgress[pilotId]?.history || [];
    const hadFloor = existingHistory.some((h) => Number(h.floor) === Number(messageId));

    if (act) {
      const vRes = validateRelicAction(act, proseOuter, knownNow, curPlayerId);
      if (vRes.ok) {
        allRelicProgress = calcRelicProgress(allRelicProgress, { ...act, ok: true, delta: vRes.delta }, messageId, swipeId, textHash);
        relicProgressChanged = true;
        console.log(TAG, `[名器互动] 第 ${messageId} 楼「${act.relicName}」动作「${act.action}」核验通过 ⇒ 浸润计数：${allRelicProgress[pilotId]?.count}/${allRelicProgress[pilotId]?.target}`);
      } else {
        console.warn(TAG, `⛔ [名器互动] 第 ${messageId} 楼丢弃动作「${act.raw}」：${vRes.why}`);
        if (hadFloor) {
          allRelicProgress = calcRelicProgress(allRelicProgress, { relicId: pilotId, ok: true, delta: 0, action: '无' }, messageId, swipeId, textHash);
          relicProgressChanged = true;
        }
      }
    } else if (hadFloor) {
      allRelicProgress = calcRelicProgress(allRelicProgress, { relicId: pilotId, ok: true, delta: 0, action: '无' }, messageId, swipeId, textHash);
      relicProgressChanged = true;
      console.log(TAG, `[名器互动] 第 ${messageId} 楼新分支无互动 ⇒ 撤销本楼旧分支贡献，当前计数：${allRelicProgress[pilotId]?.count}/${allRelicProgress[pilotId]?.target}`);
    } else if (willTrue(RELIC_PILOT_CONFIG[pilotId]?.formKey) && !allRelicProgress[pilotId]) {
      // 破身成形当轮保底建档，确保初始进度 0/5 落地
      allRelicProgress = calcRelicProgress(allRelicProgress, { relicId: pilotId, ok: true, delta: 0, action: '成形建档' }, messageId, swipeId, textHash);
      relicProgressChanged = true;
      console.log(TAG, `[名器互动] 第 ${messageId} 楼「${RELIC_PILOT_CONFIG[pilotId]?.names[0]}」破身成形 ⇒ 建立初始浸润档案 (0/${allRelicProgress[pilotId]?.target})`);
    }
  }

  // 双向兼容：同时在 zhuojiuliuyanxue / zhuojiu / 灼酒流炎穴 下维护镜像，确保前端取值 100% 命中
  for (const pid of Object.keys(RELIC_PILOT_CONFIG)) {
    const curP = allRelicProgress[pid];
    if (curP) {
      allRelicProgress['zhuojiuliuyanxue'] = curP;
      allRelicProgress[curP.name] = curP;
    }
  }

  const needOwnerWrite = ownersChanged && Object.keys(relicOwners).length > 0;
  const needDeriveWrite = 派生账本变 || 归属来源变 || 派生撤销.length > 0;
  if (!news.length && !bookChanged && !needOwnerWrite && !needDeriveWrite && !invChanged && !dispatchChanged && !relicProgressChanged) {
    console.log(TAG, `[实际发生] 第 ${messageId} 楼：${good.join('、') || '（无）'} —— 都已在账本里，无需写盘`);
    return [];
  }
  const patch = { known: {} };
  for (const f of news) patch.known[f] = true;
  if (bookChanged || needOwnerWrite) {
    patch.破处者 = mergedBook;
    patch.名器归属 = relicOwners;
  }
  if (relicProgressChanged) patch.relic_progress = allRelicProgress;
  /* ⑧ 派生账本与归属来源落盘；被撤销的派生写 false（墓碑在账本里是 null） */
  if (派生账本变) patch.派生账本 = 派生账本新;
  if (归属来源变) { patch.名器归属来源 = 名器归属来源新; patch.名器归属 = relicOwners; }
  if (派生撤销.length) {
    patch.known = patch.known || {};
    for (const f of 派生撤销) patch.known[f] = false;
    console.warn(TAG, `↩️ [派生回退] 第 ${messageId} 楼来源清零 ⇒ 撤销派生：${派生撤销.join('、')}`);
  }
  /* 记录本楼新置真的锚点（供回退用）；指纹一致时跳过（幂等） */
  if (!sameAnchorFinger && news.length) {
    anchorLog[String(messageId)] = { 指纹: anchorFinger, 新置真: news.slice() };
    anchorLogChanged = true;
    patch.锚点账本 = anchorLog;
  }
  if (invChanged) patch.inventory = inv;
  if (dispatchChanged) patch.派发记录 = dispatched;
  if (ledgerChanged) patch.纳戒账本 = nadeLog;
  if (anchorLogChanged) patch.锚点账本 = anchorLog;
  if (rolledBack.length) { patch.known = patch.known || {}; for (const f of rolledBack) patch.known[f] = false; }
  const r = await writeStat(patch, `第 ${messageId} 楼 <实际发生>/<破处>/<名器互动> 自动记账${invChanged ? '（含纳戒更新）' : ''}`);
  if (r && r.ok) {
    console.log(TAG, `✅ [实际发生] 第 ${messageId} 楼自动解锁 ${news.length} 个锚点：${news.join('、') || '（无）'}（via ${r.via}）`
      + (bookChanged ? ` 破处簿 +${bookIn.length} 条` : '')
      + (needOwnerWrite ? ` 名器归属 = ${JSON.stringify(relicOwners)}` : '')
      + (relicProgressChanged ? ' 名器浸润进度已更新' : '')
      + (invChanged ? ' 纳戒物品已更新' : ''));
    return news;
  }
  console.warn(TAG, `❌ [实际发生] 第 ${messageId} 楼自动解锁失败（${news.join('、')}）：${(r && r.why) || '变量接口不可用'}`);
  return [];
}

/**
 * 自由字段的一致性闸（2026-10-08 · gpt 17 号 §3 点名的那条"回喂通道"）
 * ─────────────────────────────────────────────────────────────────────
 * gpt 原话要点：「固定世界事件对这些状态的写入和再次渲染都做日期／前置一致性检查；
 *   记录被拒值、来源与诊断，保留最后可信值，不把『传闻／计划』提升为已发生事实；
 *   普通变化保留，按事件语义判断，**不以『有兽潮二字』一律拒绝**。」
 *
 * 判据（只拦"把未到的固定世界事件写成正在发生"这一类）：
 *   · 仅看 局势／近闻／远闻／危机／目标／阶段总结 六个自由文本字段；
 *   · 文本先过一遍**豁免表**（传闻／据说／将要／尚未／计划／若是…）—— 这些不算"已发生"，放行；
 *   · 命中事件宣言句式后，用**可信数值日期**与事件起点比：日期不可信或未到起点 ⇒ 拒绝写入，
 *     保留上一轮的可信值，并落 `自由字段闸` 诊断（后台，不进正文）；
 *   · 日期已到 ⇒ 放行（正文可以演，事实由 `<实际发生>` 建立 —— 与阶段驱动的世界轴同一口径）。
 */
