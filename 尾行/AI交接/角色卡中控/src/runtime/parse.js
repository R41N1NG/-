/**
 * 尾行 · 申报解析器：正文里的四类标签 → 结构化申报 + 净化正文 + 诊断
 *
 * 协议（申报协议与词表.md）：
 *   <动作>跟缀｜身后</动作>   <事实>#041</事实>
 *   <谎言>claim｜对谁｜场景｜可验证度</谎言>   <模式>接触</模式>
 * 铁律：宁可不结算，不可错结算——解析不了的整笔丢弃 + 诊断计数，不锁流程。
 */
const { normalize, loadLexicon } = require("./lexicon.js");

const TAG_RE = /<(动作|事实|谎言|模式)>([\s\S]*?)<\/\1>/g;
const MODE_WORDS = { "prepare": "prepare", "准备": "prepare", "stealth": "stealth", "潜行": "stealth",
                     "contact": "contact", "接触": "contact", "vehicle": "vehicle", "车厢": "vehicle" };
const VERIF_WORDS = { "high": "high", "高": "high", "mid": "mid", "中": "mid", "low": "low", "低": "low" };
const ACTION_QUEUE_MAX = 3;

/** 段分割：全角为主，半角宽容（记诊断）。 */
function splitSegs(body, diag) {
  if (body.includes("|")) diag.halfWidthPipe++;
  return body.split(/[｜|]/).map(s => s.trim()).filter(Boolean);
}

/**
 * 解析一栋楼的完整输出。
 * @returns {{tags:Array, cleanText:string, diag:object}}
 *  tags: [{type:'action',id,name,args} | {type:'fact',ticket} |
 *         {type:'lie',claim,to,scene,verifiability} | {type:'mode',mode}]
 */
function parseFloor(text, lex) {
  const L = lex || loadLexicon();
  const diag = { parseErrors: 0, halfWidthPipe: 0, actionOverflow: 0, degradedSamples: [],
                 factBad: 0, lieBad: 0, modeBad: 0, modeDup: 0, unknownAction: [] };
  const tags = [];
  let actionCount = 0, modeCount = 0;

  const src = String(text || "");
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(src)) !== null) {
    const [full, kind, body] = m;
    try {
      if (kind === "动作") {
        if (actionCount >= ACTION_QUEUE_MAX) { diag.actionOverflow++; continue; }   // 一楼一队上限
        // 段合并后走词表归一（词表锁：命不中即降级丢弃）
        const r = normalize(splitSegs(body, diag).join(" "), L);
        if (!r.hit) { diag.parseErrors++; diag.unknownAction.push(body.slice(0, 24)); continue; }
        actionCount++;
        tags.push({ type: "action", id: r.id, name: r.name, args: r.args });
      } else if (kind === "事实") {
        const segs = splitSegs(body, diag);
        const tm = /^#(\d+)$/.exec(segs[0] || "");
        if (!tm) { diag.factBad++; continue; }                                     // 无票据号即丢弃
        tags.push({ type: "fact", ticket: Number(tm[1]) });
      } else if (kind === "谎言") {
        const segs = splitSegs(body, diag);
        if (segs.length < 4) { diag.lieBad++; continue; }
        const v = VERIF_WORDS[segs[3].toLowerCase()] || null;
        if (!v) { diag.lieBad++; continue; }
        tags.push({ type: "lie", claim: segs[0], to: segs[1], scene: segs[2], verifiability: v });
      } else if (kind === "模式") {
        const val = MODE_WORDS[body.trim().toLowerCase()] || MODE_WORDS[body.trim()];
        if (!val) { diag.modeBad++; continue; }
        if (modeCount >= 1) { diag.modeDup++; continue; }                          // 一楼一次切换
        modeCount++;
        tags.push({ type: "mode", mode: val });
      }
    } catch (_) { diag.parseErrors++; }                                            // 单标签失败不牵连整楼
  }

  const cleanText = src.replace(TAG_RE, "").trim();
  return { tags, cleanText, diag };
}

/** 依据锁接口：申报内容必须是可见正文（已剥离标签）的逐字子串。 */
function verifyEvidence(cleanText, claim) {
  if (!claim || !cleanText) return false;
  return cleanText.includes(claim);
}

module.exports = { parseFloor, verifyEvidence, ACTION_QUEUE_MAX };
