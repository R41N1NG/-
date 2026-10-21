"use strict";
const { normalize, loadLexicon } = require("./lexicon.js");
const MODE_WORDS = {
  prepare: "prepare",
  准备: "prepare",
  stealth: "stealth",
  潜行: "stealth",
  contact: "contact",
  接触: "contact",
  vehicle: "vehicle",
  车厢: "vehicle",
};
const VERIF_WORDS = {
  high: "high",
  高: "high",
  mid: "mid",
  中: "mid",
  low: "low",
  低: "low",
};
const ACTION_QUEUE_MAX = 3;
const KINDS = { ACTION: "动作", FACT: "事实", LIE: "谎言", MODE: "模式" };
/** 卡内注释协议与历史 XML 协议均归一到同一结构；正文不参与动作猜测。 */
function parseFloor(text, lex) {
  const L = lex || loadLexicon();
  const diag = {
    parseErrors: 0,
    halfWidthPipe: 0,
    actionOverflow: 0,
    degradedSamples: [],
    factBad: 0,
    lieBad: 0,
    modeBad: 0,
    modeDup: 0,
    unknownAction: [],
  };
  const tags = [];
  let actionCount = 0,
    modeCount = 0;
  function read(kind, body, compact = false) {
    const split = () => {
      if (body.includes("|")) diag.halfWidthPipe++;
      return body
        .split(/[｜|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    };
    try {
      if (kind === "动作") {
        if (actionCount >= ACTION_QUEUE_MAX) {
          diag.actionOverflow++;
          return;
        }
        const entry = L.byId.get(body.trim());
        const r = entry
          ? { hit: true, id: entry.id, name: entry.name, args: {} }
          : normalize(split().join(" "), L);
        if (!r.hit) {
          diag.parseErrors++;
          diag.unknownAction.push(body.slice(0, 24));
          return;
        }
        actionCount++;
        tags.push({ type: "action", id: r.id, name: r.name, args: r.args });
      } else if (kind === "事实") {
        const match = /^#([\w-]+)$/.exec(split()[0] || "");
        if (!match) {
          diag.factBad++;
          return;
        }
        tags.push({
          type: "fact",
          ticket: /^\d+$/.test(match[1]) ? Number(match[1]) : match[1],
        });
      } else if (kind === "谎言") {
        const segs = split();
        const level =
          compact && segs.length === 2
            ? VERIF_WORDS[segs[0].toLowerCase()]
            : VERIF_WORDS[(segs[3] || "").toLowerCase()];
        if (!level || (segs.length < 4 && !(compact && segs.length === 2))) {
          diag.lieBad++;
          return;
        }
        tags.push({
          type: "lie",
          claim: compact && segs.length === 2 ? segs[1] : segs[0],
          to: compact && segs.length === 2 ? "target" : segs[1],
          scene: segs[2] || "current",
          verifiability: level,
        });
      } else if (kind === "模式") {
        const mode = MODE_WORDS[body.trim().toLowerCase()];
        if (!mode) {
          diag.modeBad++;
          return;
        }
        if (modeCount++) {
          diag.modeDup++;
          return;
        }
        tags.push({ type: "mode", mode });
      }
    } catch {
      diag.parseErrors++;
    }
  }
  const cleanText = String(text || "")
    .replace(
      /<(动作|事实|谎言|模式)>([\s\S]*?)<\/\1>|<!--([\s\S]*?)-->/g,
      (full, kind, body, comment) => {
        if (kind) {
          read(kind, body);
          return "";
        }
        let recognized = false;
        for (const match of comment.matchAll(
          /\[(ACTION|FACT|LIE|MODE):([^\]]*)\]/gi,
        )) {
          recognized = true;
          read(KINDS[match[1].toUpperCase()], match[2], true);
        }
        return recognized ? "" : full;
      },
    )
    .trim();
  return { tags, cleanText, diag };
}
function verifyEvidence(cleanText, claim) {
  return !!claim && !!cleanText && cleanText.includes(claim);
}
module.exports = { parseFloor, verifyEvidence, ACTION_QUEUE_MAX };
