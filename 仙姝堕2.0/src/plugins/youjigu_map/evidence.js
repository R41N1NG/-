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
function sentences(text) {
  return String(text || "")
    .replace(
      /<(?:Status_block|StatusBlock|status)\b[^>]*>[\s\S]*?<\/(?:Status_block|StatusBlock|status)>/gi,
      "",
    )
    .replace(/<Youjigu_result\b[^>]*\/?>(?:<\/Youjigu_result>)?/gi, "")
    .split(/[。！？\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
const NON_FACT =
  /(未能|并未|未曾|不曾|无法|尚未|没能|没有|空空如也|一无所获|计划|打算|准备|将要|即将|如果|假如|据说|传闻|听说|看见|看到|看着|目送|仍在.*(?:门外|门前)|站在.*(?:门外|门前)|止步门外)/;
function playerSentence(s, def) {
  return (
    /你|我|自身|自己|玩家|主角/.test(s) ||
    (def.playerIdentity && s.includes(def.playerIdentity))
  );
}
function verifyMovementEvidence(proseText, def) {
  const places = {
    g7p2: /幽寂谷|谷口|入谷/,
    k4m8: /洞府|石门|石窟|洞内/,
    s9a3: /山涧|溪水|溪流|涧/,
    u9h3: /山谷|谷中|腹地/,
    v4t7: /密室|石隙|暗室|裂隙/,
    r2c6: /溪水|清流|水波|水流/,
    a6d4: /树丛|草丛|灌木/,
  };
  const observation = ["r2c6", "a6d4"].includes(def.id);
  const target =
    places[def.id] ||
    (def.to === "second"
      ? /洞府|山涧|谷中|腹地|岔路/
      : def.finish || def.early
        ? /幽寂谷|出谷|谷口|山径|出口/
        : null);
  const ok = sentences(proseText).some((s) => {
    if (
      NON_FACT.test(s) ||
      MOVEMENT_BLOCKED_REGEX.test(s) ||
      !playerSentence(s, def) ||
      !target?.test(s)
    )
      return false;
    if (observation) return /查看|察看|观察|拨开|细看|望向|注视|检视/.test(s);
    if (def.to === "second")
      return /离开|走出|退出/.test(s) && /深入|腹地|谷中/.test(s);
    if (def.finish || def.early)
      return /离开|走出|出谷|离去|顺径而出|折返|回返/.test(s);
    return (
      /步入|踏入|进入|迈入|走进|抵达|行至|来到/.test(s) &&
      !/(?:洞府|石门|密室)(?:之前|前|外)/.test(s)
    );
  });
  return {
    ok,
    why: ok
      ? "正文场景流转核验通过"
      : "正文中未见玩家实际到达或观察目标场景的事实",
  };
}
function verifyProseEvidence(proseText, def) {
  if (!def || !def.reward) return verifyMovementEvidence(proseText, def || {});
  const words = {
    幽寂谷地图: ["幽寂谷地图", "地图", "残图", "路线图"],
    丹药: ["丹药", "灵丹", "古丹"],
    草药: ["草药", "灵草", "灵芝", "药草"],
    法宝: ["法宝", "古宝", "宝环"],
    秘籍: ["秘籍", "残篇", "法诀", "道书"],
  }[def.reward] || [def.reward];
  const escaped = words
    .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const actionBefore = new RegExp(
    "(?:取出|取得|获得|得到|拿到|收集|采下|采集|收起|收下|拾起)[^，,。！？]{0,28}(?:" +
      escaped +
      ")",
  );
  const actionAfter = new RegExp(
    "(?:" +
      escaped +
      ")[^，,。！？]{0,28}(?:收入|收起|纳入|采下|取走|收好|握在手中)",
  );
  for (const sentence of sentences(proseText)) {
    if (
      NON_FACT.test(sentence) ||
      NEGATION_REGEX.test(sentence) ||
      !playerSentence(sentence, def)
    )
      continue;
    if (
      /(?:师姐|师兄|他人|别人|她|他)(?:已经|亲自|抢先|独自|顺手|终于)?(?:取得|获得|拿到|收起|收入|取走|夺走)/.test(
        sentence,
      )
    )
      continue;
    if (actionBefore.test(sentence) || actionAfter.test(sentence))
      return {
        ok: true,
        matchedSentence: sentence,
        why: "玩家取得目标物品的正文实证通过",
      };
  }
  return { ok: false, why: "正文中未见玩家取得目标物品的事实" };
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
