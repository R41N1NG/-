"use strict";

/**
 * 《仙姝堕 2.0》幽寂谷正文事实核验与防死锁回执处理器
 * ─────────────────────────────────────────────────────────────────────────────
 * 严格遵循 2.0 框架与 GPT 契约：
 * 1. 成功标签绝不能越过正文实证：若正文包含否定、未发生或旁人取得，即使带有成功标签也拒绝放行；
 * 2. 无奖励移动节点（进入、离开、探寻）必须核验正文真实到达或场景转换，严禁空正文或“未能进入”蒙混过关；
 * 3. 严格拦截第三方主语取得（如师姐、同门、敌人抢走）；
 * 4. 彻底修复原代码中主语判断的恒真非空条件；
 * 5. 漏标降级防死锁：在正文正面强事实充分、无否定、无旁人的前提下，放行成功，杜绝死锁。
 */

// 否定与未发生拦截词（反例守卫）
const NEGATION_REGEX =
  /(未能|并未|未曾|不曾|并未能|无法|未尝|尚未|空空如也|一无所获|并未找到|未见|毫无所获|没能|没有拿到|未能如愿|失之交臂|扑了个空|徒劳无功|未见踪影)/;

// 阻止进入/未到达拦截词
const MOVEMENT_BLOCKED_REGEX =
  /(未能进入|无法进入|未能踏入|无法踏入|止步门外|停下脚步并未|没有进入|不敢深入|被阵法阻隔|被结界震退|折返回去|未能通过)/;

// 实际取得物品的正面动词
const ACQUIRE_REGEX =
  /(取出|取得|获得|得到|拿到|收集|采下|采集|收入|收起|纳入|握入|收入纳戒|探手取走|收入囊中|收入怀中|取入掌中|收好|握在手中)/;

// 到达与场景进入的正面动词（移动类节点核验）
const MOVEMENT_REGEX =
  /(步入|踏入|来到|进入|行至|抵达|穿过|深入|迈入|折返|离去|离开|走出|走出洞府|顺径而出|回返)/;

// 玩家第一/第二人称主语及自身持有介词
const SELF_SUBJECT_REGEX = /(你|自身|掌心|指尖|袖中|囊中|纳戒|怀中|手中)/;

// 第三方主语（旁观他人反例）
const THIRD_PARTY_REGEX =
  /(他人|别人|同门|师姐|师兄|敌修|魔修|黑袍人|黑袍修士|神秘人|对手|对方|旁人)/;

/**
 * 校验移动/观察类节点是否真实到达
 */
function verifyMovementEvidence(proseText, def) {
  const text = String(proseText || "").trim();
  if (!text) {
    return { ok: false, why: "正文为空，无法核验场景到达" };
  }

  // 若正文包含明确的被阻挡/未进入，拦截
  if (MOVEMENT_BLOCKED_REGEX.test(text)) {
    return { ok: false, why: "正文表明未能成功进入或被阻挡" };
  }

  // 必须包含场景移动正面词或包含目标场景实词
  const placeKeywords = [];
  if (def.to === "cave" || def.id === "k4m8")
    placeKeywords.push("洞府", "石门", "石窟", "洞内");
  if (def.to === "stream" || def.id === "s9a3")
    placeKeywords.push("山涧", "溪水", "溪流", "涧");
  if (def.to === "valley" || def.id === "u9h3")
    placeKeywords.push("山谷", "谷中", "腹地");
  if (def.to === "secret" || def.id === "v4t7")
    placeKeywords.push("密室", "石隙", "暗室", "裂隙");
  if (def.finish || def.early || def.to === "second")
    placeKeywords.push("出谷", "离开", "谷口", "山径", "深入", "岔路");
  if (def.id === "g7p2") placeKeywords.push("幽寂谷", "入谷", "谷口", "步入");
  if (def.id === "r2c6") placeKeywords.push("溪水", "清流", "水波", "水流");
  if (def.id === "a6d4") placeKeywords.push("树丛", "草丛", "灌木", "杂草");

  const hasPlaceKeyword =
    placeKeywords.length === 0 || placeKeywords.some((kw) => text.includes(kw));
  const hasMovementAction = MOVEMENT_REGEX.test(text);

  if (hasPlaceKeyword && (hasMovementAction || text.length > 15)) {
    return { ok: true, why: "正文场景流转核验通过" };
  }

  return { ok: false, why: "正文中未见明确到达目标场景的正向事实" };
}

/**
 * 校验正文是否真实包含物品取得事实
 */
function verifyProseEvidence(proseText, def) {
  // 无奖励节点转入移动/观察核验
  if (!def || !def.reward) {
    return verifyMovementEvidence(proseText, def || {});
  }

  const text = String(proseText || "").trim();
  if (!text) {
    return { ok: false, why: "正文为空，无法核验事实" };
  }

  const targetReward = def.reward;
  // 提取关键词（通用名称及衍生实词）
  const keywords = [targetReward];
  if (targetReward === "幽寂谷地图")
    keywords.push("地图", "古卷", "残图", "卷轴");
  if (targetReward === "丹药") keywords.push("丹", "灵丹", "古丹");
  if (targetReward === "草药") keywords.push("灵草", "灵芝", "草药", "药草");
  if (targetReward === "法宝") keywords.push("宝物", "古宝", "法宝", "宝环");
  if (targetReward === "秘籍")
    keywords.push("古卷", "残篇", "秘籍", "法诀", "道书");

  // 按句拆分判定
  const sentences = text.split(/[。！？\n]/);
  let foundValidAcquisition = false;
  let matchedSentence = "";

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    const hasItem = keywords.some((kw) => s.includes(kw));
    if (!hasItem) continue;

    // 1. 否定句拦截：若该句含否定，直接跳过并标记否定
    if (NEGATION_REGEX.test(s)) {
      continue;
    }

    // 2. 旁观他人拦截：若该句包含第三方（他人、师姐、魔修等），除非明确表示“归你所有”或“你从其手中取得”，否则一律拦截
    if (THIRD_PARTY_REGEX.test(s)) {
      const hasPlayerSubject = /(你|自身|主角|我)/.test(s);
      if (!hasPlayerSubject || /(抢先|夺走|取走|收走|拿走)/.test(s)) {
        continue;
      }
    }

    // 3. 必须包含取得动词
    if (ACQUIRE_REGEX.test(s)) {
      foundValidAcquisition = true;
      matchedSentence = s;
      break;
    }
  }

  if (foundValidAcquisition) {
    return {
      ok: true,
      matchedSentence,
      why: `正文事实核验通过：明确取得「${targetReward}」`,
    };
  }

  return {
    ok: false,
    why: `正文中未见明确取得「${targetReward}」的正面实证（须出现取得动词且无否定、非旁观）`,
  };
}

/**
 * 解析模型输出的隐蔽回执标签
 * 格式示例：<Youjigu_result id="b8n2" outcome="success"/>
 */
function parseReceiptTag(proseText, expectedActionId) {
  const text = String(proseText || "");
  if (!text.includes("Youjigu_result")) return null;

  const regex = /<Youjigu_result\s+([^>]+)\/?>/i;
  const match = text.match(regex);
  if (!match) return null;

  const attrs = match[1];
  const idMatch = attrs.match(/id=["']([^"']+)["']/i);
  const outcomeMatch = attrs.match(/outcome=["']([^"']+)["']/i);

  const parsedId = idMatch ? idMatch[1].trim() : "";
  const outcome = outcomeMatch
    ? outcomeMatch[1].trim().toLowerCase()
    : "success";

  if (expectedActionId && parsedId !== expectedActionId) {
    return {
      valid: false,
      tagId: parsedId,
      outcome,
      why: `标签ID「${parsedId}」与当前授权行动「${expectedActionId}」不匹配`,
    };
  }

  return {
    valid: true,
    tagId: parsedId,
    outcome,
    why: "回执标签完全匹配",
  };
}

/**
 * 综合判定行动结果（严格对齐 2.0 规范）
 */
function resolveActionResult(proseText, pendingDef) {
  if (!pendingDef) {
    return { success: false, status: "NO_PENDING", reason: "无待结算行动" };
  }

  const receipt = parseReceiptTag(proseText, pendingDef.id);
  const proseCheck = verifyProseEvidence(proseText, pendingDef);

  // 1. 模型明确给出了失败标签
  if (receipt && receipt.valid && receipt.outcome === "failure") {
    return {
      success: false,
      mode: "TAG_REJECTED",
      reason: "模型回执明确声明行动未达成",
    };
  }

  // 2. 严正门禁：无论是否有成功标签，若正文核验失败（包含否定、未到达或他人取得），坚决不放行！
  if (!proseCheck.ok) {
    return {
      success: false,
      mode: "PROSE_EVIDENCE_FAILED",
      reason: proseCheck.why || "正文事实核验未通过，拒绝结算",
    };
  }

  // 3. 模型给出了成功标签且正文事实核验通过
  if (receipt && receipt.valid && receipt.outcome === "success") {
    return {
      success: true,
      mode: "TAG_CONFIRMED",
      reason: "模型回执标签与正文事实共同确认成功",
      matchedProse: proseCheck.matchedSentence || "",
    };
  }

  // 4. 降级防死锁策略：
  // 若模型漏标（无 receipt 标签），但正文有充足正面事实证据且无反例，放行避免死锁
  if (!receipt && proseCheck.ok) {
    return {
      success: true,
      mode: "FALLBACK_PROSE_CONFIRMED",
      reason: "模型未附标签，但正文实证充分无否定，降级放行避免死锁",
      matchedProse: proseCheck.matchedSentence || "",
    };
  }

  return {
    success: false,
    mode: "PENDING_UNRESOLVED",
    reason: proseCheck.why || "未检测到有效行动达成证明",
  };
}

module.exports = {
  verifyMovementEvidence,
  verifyProseEvidence,
  parseReceiptTag,
  resolveActionResult,
};
