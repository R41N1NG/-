
/** ═════════════════════════════════════════════════════════════════════
 * 名器动作申报、严格事实核验与浸润累进（MVU 状态机数值扩展 · 首期试点）
 * ─────────────────────────────────────────────────────────────────────
 * 遵循 GPT RFC-001 审核与 RFC-002 规范：
 *   1. 封闭动作枚举，模型严禁输出数字或 +1；
 *   2. 严格正文事实核验（持有者在场 + 内射硬词 + 否定句拦截 + 成形硬前置）；
 *   3. 接入统一 writeStat 队列，消息层历史快照与 Swipe 隔离（替换本楼贡献，绝不跨 Swipe 累加）；
 *   4. 首期不自动晋阶（恪守 GEMINI.md 铁律 36：达成 5 次仅标记 ready，真正晋阶须剧情生理自发迎合质变或 GM 解锁）；
 *   5. GM 人工回锁绝对优先。
 * ═════════════════════════════════════════════════════════════════════ */
const RELIC_PILOT_CONFIG = {
  zhuojiu: {
    id: 'zhuojiu',
    names: ['灼酒流炎穴', '灼酒流炎', '灼酒', 'zhuojiu'],
    owner: '叶红缨',
    ownerAliases: ['叶红缨', '红绡', '红缨'],
    formKey: '灼酒流炎穴成形',
    stage1Key: '灼酒流炎穴一阶段',
    stage2Key: '灼酒流炎穴二阶段',
    target: 5,
    validActions: ['内射', '深度交合内射', '精液灌注', '破身'],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌)/,
  }
};

function isRelicActionLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('名器互动') || n.includes('名器动作') || n === '名器' || n === 'relic_action';
}

/** `<名器互动>` 的值 → `{ relicId, relicName, actor, action, raw }`
 *  封闭事实枚举：例如「灼酒流炎穴|赵无忧|内射」或「zhuojiu|player|内射」
 *  严格去除模型自造的 +1、数字或 delta，只取名器、行为者、动作事实。 */
function parseRelicAction(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return null;
  // 防跨标签越界（如果带了 < 标签残余，截断到第一个 < 之前）
  const cleanV = v.split('<')[0].trim();
  if (!cleanV) return null;

  const segs = cleanV.split(/[；;\n]+/);
  for (const seg of segs) {
    const rawSeg = seg.trim();
    if (!rawSeg) continue;
    const parts = rawSeg.split(/[|｜、:：]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) continue;

    // 清理模型自加的 +1、数字等
    const cleanedParts = parts.map((p) => p.replace(/\s*\+?\d+.*$/, '').trim()).filter(Boolean);
    if (!cleanedParts.length) continue;

    for (const [id, cfg] of Object.entries(RELIC_PILOT_CONFIG)) {
      const matchRelic = cleanedParts.some((p) => cfg.names.includes(p) || cfg.ownerAliases.includes(p) || p.toLowerCase() === id.toLowerCase());
      if (!matchRelic) continue;

      let matchedAction = '';
      for (const p of cleanedParts) {
        if (cfg.validActions.includes(p)) {
          matchedAction = p;
          break;
        }
      }
      if (!matchedAction) {
        if (cleanedParts.some((p) => p.includes('内射') || p.includes('灌注'))) matchedAction = '内射';
        else if (cleanedParts.some((p) => p.includes('破身') || p.includes('初破'))) matchedAction = '破身';
      }

      if (matchedAction) {
        const actorPart = cleanedParts.find((p) => !cfg.names.includes(p) && !cfg.ownerAliases.includes(p) && p !== matchedAction && p.toLowerCase() !== id.toLowerCase());
        const curId = (typeof readIdentity === 'function' ? readIdentity() : null) || '赵无忧';
        const actor = actorPart || curId;
        return {
          relicId: id,
          relicName: cfg.names[0],
          actor,
          action: matchedAction,
          raw: rawSeg
        };
      }
    }
  }
  return null;
}

/** 核验名器互动申报（纯函数） */
function validateRelicAction(act, prose, known, currentIdentity) {
  if (!act || !act.relicId) return { ok: false, why: '无效或未知的动作申报' };
  const cfg = RELIC_PILOT_CONFIG[act.relicId];
  if (!cfg) return { ok: false, why: '非试点名器（首期仅支持灼酒流炎穴试点）' };

  // 1. 成形检查（前置硬闸门：known 状态 ＋ 账本归属实证兜底）
  const K = known || {};
  let isFormed = K[cfg.formKey] === true;
  if (!isFormed) {
    const sd = typeof readStatData === 'function' ? readStatData() : null;
    if (sd && (sd.名器归属?.[cfg.names[0]] || sd.名器归属?.[act.relicId] || sd.破处者?.[cfg.owner])) {
      isFormed = true;
    }
  }
  if (!isFormed) {
    return { ok: false, why: `名器「${cfg.names[0]}」尚未成形，不可累积互动或晋阶` };
  }

  // 2. 阶段检查（二阶段是否已达成）
  if (K[cfg.stage2Key] === true) {
    return { ok: false, why: `名器「${cfg.names[0]}」已达第二境（情动），一升二浸润计数已闭合` };
  }

  // 3. 动作枚举检查
  if (!cfg.validActions.includes(act.action)) {
    return { ok: false, why: `动作「${act.action}」不在合法枚举表内（支持：${cfg.validActions.join('、')}）` };
  }

  // 动作是破身：属于一阶成形动作，不增加入二阶浸润
  if (act.action === '破身') {
    return { ok: true, delta: 0, why: '破身属于一阶成形动作，不计入二阶浸润' };
  }

  // 4. 正文事实校验（Strict Evidence Check）
  const pText = String(prose || '');
  if (!pText) {
    return { ok: false, why: '本楼读不到正文文本，无法核验动作事实实证（fail-closed）' };
  }

  // 4a. 持有者在场实证
  const ownerPresent = cfg.ownerAliases.some((alias) => pText.includes(alias));
  if (!ownerPresent) {
    return { ok: false, why: `正文中未见持有者「${cfg.owner}」在场参与互动` };
  }

  // 4b. 动作证据词实证
  if (!cfg.evidenceRegex.test(pText)) {
    return { ok: false, why: `正文中未见「${act.action}」事实实证（须出现内射/精液灌注等硬词）` };
  }

  // 4c. 否定句拦截
  if (typeof negatedAround === 'function' && negatedAround(pText, cfg.evidenceRegex)) {
    return { ok: false, why: `正文中「${act.action}」实证落在否定或未发生分句中` };
  }

  return { ok: true, delta: 1, why: `正文事实核验通过（${cfg.owner}在场且有明确${act.action}实证）` };
}

/** 累进/回溯名器浸润进度（纯函数） */
function calcRelicProgress(allProgress, validAction, floor, swipeId, textHash) {
  const next = Object.assign({}, allProgress || {});
  if (!validAction || !validAction.relicId) return next;
  const id = validAction.relicId;
  const cfg = RELIC_PILOT_CONFIG[id];
  if (!cfg) return next;

  const cur = Object.assign({
    id,
    name: cfg.names[0],
    owner: cfg.owner,
    count: 0,
    target: cfg.target,
    ready: false,
    last_floor: 0,
    history: []
  }, next[id] || {});

  // 目标阈值由代码策略决定，严格正整数
  const target = Math.max(1, Math.floor(Number(cfg.target) || 5));
  cur.target = target;
  let count = Math.max(0, Math.min(target, Math.floor(Number(cur.count) || 0)));

  const fNum = Number(floor) || 0;
  const sNum = Number(swipeId) || 0;
  const hash = String(textHash || '');
  const delta = (validAction.ok !== false && Number.isFinite(Number(validAction.delta))) ? Math.floor(Number(validAction.delta)) : 0;

  let history = Array.isArray(cur.history) ? [...cur.history] : [];
  const existingIdx = history.findIndex((h) => Number(h.floor) === fNum);

  if (existingIdx >= 0) {
    const prev = history[existingIdx];
    // 同楼同分支同正文：幂等，不重复增减
    if (Number(prev.swipeId) === sNum && prev.hash === hash) {
      cur.count = count;
      cur.ready = count >= target;
      next[id] = cur;
      return next;
    }
    // 同楼换分支(Swipe)或编辑：撤销旧贡献，加上新贡献
    const prevDelta = Math.floor(Number(prev.delta) || 0);
    count = Math.max(0, Math.min(target, count - prevDelta + delta));
    history[existingIdx] = {
      floor: fNum,
      swipeId: sNum,
      hash,
      actor: validAction.actor || 'player',
      action: validAction.action || '',
      delta,
      timestamp: Date.now()
    };
  } else {
    // 新楼记录
    count = Math.max(0, Math.min(target, count + delta));
    history.push({
      floor: fNum,
      swipeId: sNum,
      hash,
      actor: validAction.actor || 'player',
      action: validAction.action || '',
      delta,
      timestamp: Date.now()
    });
  }

  // 约束审计账本大小，保留最近 20 笔
  if (history.length > 20) history = history.slice(-20);

  cur.count = count;
  cur.ready = count >= target;
  cur.last_floor = fNum;
  cur.history = history;
  next[id] = cur;
  return next;
}

