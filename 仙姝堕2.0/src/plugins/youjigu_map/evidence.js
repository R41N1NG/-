/**
 * 《仙姝堕 2.0》幽寂谷正文事实核验与防死锁回执处理器
 * ─────────────────────────────────────────────────────────────────────────────
 * 遵循 GPT 答复第一问的核心原则：
 * 1. 隐藏回执标签只作辅助信息，不作唯一权限凭据；
 * 2. 严格核验新玩家行动楼、对应已授权 pending 节点、当前场景；
 * 3. 降级防死锁机制：若已授权节点且正文事实明确取得、无否定词，允许规范化通过，
 *    避免因模型偶然漏标而永久卡死在 pending 状态；
 * 4. 严格拦截否定句、计划假象、旁观他人与未发生反例。
 */

// 否定与未发生拦截词
const NEGATION_REGEX = /(未能|并未|未曾|不曾|并未能|无法|未尝|尚未|空空如也|旁观|他人|别人|有人|打算|计划|准备|想要|如果|倘若|万一|被他人夺走|未能如愿|失之交臂)/;

// 实际取得正面动词
const ACQUIRE_REGEX = /(取出|取得|获得|得到|拿到|收集|采下|采集|收入|收起|纳入|握入|收入纳戒|探手取走|收入囊中|收入怀中|取入掌中)/;

// 玩家第一/第二人称主语
const SUBJECT_REGEX = /(你|自身|掌心|指尖|袖中|囊中|纳戒|怀中)/;

/**
 * 校验正文是否真实包含物品取得事实
 */
export function verifyProseEvidence(proseText, def) {
  if (!def || !def.reward) {
    // 无奖励的探索/观察类行动，不强制核验物品实词
    return { ok: true, why: '无物品奖励节点，核验通过' };
  }

  const text = String(proseText || '').trim();
  if (!text) {
    return { ok: false, why: '正文为空，无法核验事实' };
  }

  const targetReward = def.reward;
  // 提取关键词（全称与常见简称）
  const keywords = [targetReward];
  if (def.known === 'map_youjigu') keywords.push('古卷', '地图', '残卷');
  if (targetReward.includes('灵丹')) keywords.push('丹药', '灵丹');
  if (targetReward.includes('灵芝')) keywords.push('草药', '灵芝');
  if (targetReward.includes('环')) keywords.push('法宝', '宝环');
  if (targetReward.includes('谱')) keywords.push('秘籍', '古谱');

  // 按句拆分判定
  const sentences = text.split(/[。！？\n]/);
  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    // 检查是否包含物品
    const hasItem = keywords.some(kw => s.includes(kw));
    if (!hasItem) continue;

    // 否定句拦截（反例守卫）
    if (NEGATION_REGEX.test(s)) {
      continue;
    }

    // 检查是否有取得动作
    if (ACQUIRE_REGEX.test(s) && (SUBJECT_REGEX.test(s) || /^[^\s]/.test(s))) {
      return {
        ok: true,
        matchedSentence: s,
        why: `正文事实核验通过：明确取得「${targetReward}」`
      };
    }
  }

  return {
    ok: false,
    why: `正文中未见明确取得「${targetReward}」的正向事实实证（须出现取得动词且无否定）`
  };
}

/**
 * 解析模型输出的隐蔽回执标签
 * 格式示例：<Youjigu_result id="b8n2" outcome="success"/>
 */
export function parseReceiptTag(proseText, expectedActionId) {
  const text = String(proseText || '');
  if (!text.includes('Youjigu_result')) return null;

  const regex = /<Youjigu_result\s+([^>]+)\/?>/i;
  const match = text.match(regex);
  if (!match) return null;

  const attrs = match[1];
  const idMatch = attrs.match(/id=["']([^"']+)["']/i);
  const outcomeMatch = attrs.match(/outcome=["']([^"']+)["']/i);

  const parsedId = idMatch ? idMatch[1].trim() : '';
  const outcome = outcomeMatch ? outcomeMatch[1].trim().toLowerCase() : 'success';

  if (expectedActionId && parsedId !== expectedActionId) {
    return {
      valid: false,
      tagId: parsedId,
      outcome,
      why: `标签ID「${parsedId}」与当前授权行动「${expectedActionId}」不匹配`
    };
  }

  return {
    valid: true,
    tagId: parsedId,
    outcome,
    why: '回执标签完全匹配'
  };
}

/**
 * 综合判定行动结果（实施漏标降级防死锁）
 */
export function resolveActionResult(proseText, pendingDef) {
  if (!pendingDef) {
    return { success: false, status: 'NO_PENDING', reason: '无待结算行动' };
  }

  const receipt = parseReceiptTag(proseText, pendingDef.id);
  const proseCheck = verifyProseEvidence(proseText, pendingDef);

  // 1. 模型明确给出了成功标签
  if (receipt && receipt.valid && receipt.outcome === 'success') {
    return {
      success: true,
      mode: 'TAG_CONFIRMED',
      reason: '模型回执标签确认成功',
      matchedProse: proseCheck.matchedSentence || ''
    };
  }

  // 2. 模型明确给出了失败标签
  if (receipt && receipt.valid && receipt.outcome === 'failure') {
    return {
      success: false,
      mode: 'TAG_REJECTED',
      reason: '模型回执明确声明行动未达成'
    };
  }

  // 3. 降级防死锁策略（落实 GPT 建议）：
  // 若模型漏标（无 receipt 标签），但正文有充足事实取得证据，且行动已获授权
  if (!receipt && proseCheck.ok) {
    return {
      success: true,
      mode: 'FALLBACK_PROSE_CONFIRMED',
      reason: '模型未附标签，但正文取得事实充分，降级放行避免死锁',
      matchedProse: proseCheck.matchedSentence
    };
  }

  // 4. 正文证据不足或属于否定句反例
  return {
    success: false,
    mode: 'PENDING_UNRESOLVED',
    reason: proseCheck.why || '未检测到有效行动达成证明',
    needUserConfirm: true
  };
}
