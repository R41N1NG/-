/* ═══════════════════════════════════════════════════════════
 * 六 · 状态条解析 → 变量
 * ═══════════════════════════════════════════════════════════ */

/* 身份：gpt 下级实现。卡内适配层：只绑定依赖与诊断，不复制解析算法。
 * 名器互动依赖位于后续模块，箭头回调在解析时调用，初始化不读取后定义状态。
 */
const XSD_STATUS_PARSER = createXsdStatusParser({
  CAST_FIELD, FIELD_MAP, HOLDER_TO_RELIC, ALL_FIELDS, DEFLOWER_SYN,
  DEFLOWER_HARD_RES,
  isRelicActionLabel: (label) => isRelicActionLabel(label),
  parseRelicAction: (value) => parseRelicAction(value),
  emit: (level, message) => console[level](TAG, message),
});
const {
  TRAD_CHARS, SIMP_CHARS, FIELD_ALIAS, ALIAS_LOOKUP, STATUS_TAG, STATUS_OPEN_RE, STATUS_PAIR_RE, STATUS_STRIP_RE, XML_PAIR_RE, CAST_BLOCK_RE, CAST_FIELD_RE, CAST_KEYS, CAST_FIELD_ALIAS, CAST_MAX, CAST_EMPTY_RE,
} = XSD_STATUS_PARSER;
function toSimp(s) { return XSD_STATUS_PARSER.toSimp(s); }
function normalizeLabel(raw) { return XSD_STATUS_PARSER.normalizeLabel(raw); }
function matchField(label) { return XSD_STATUS_PARSER.matchField(label); }
function isProgressLabel(label) { return XSD_STATUS_PARSER.isProgressLabel(label); }
function isMilestoneLabel(label) { return XSD_STATUS_PARSER.isMilestoneLabel(label); }
function parseMilestones(value) { return XSD_STATUS_PARSER.parseMilestones(value); }
function parseProgress(value) { return XSD_STATUS_PARSER.parseProgress(value); }
function normalizeAnchorName(f) { return XSD_STATUS_PARSER.normalizeAnchorName(f); }
function isDeflowerLabel(label) { return XSD_STATUS_PARSER.isDeflowerLabel(label); }
function isNadeLabel(label) { return XSD_STATUS_PARSER.isNadeLabel(label); }
function parseNade(value) { return XSD_STATUS_PARSER.parseNade(value); }
function parseDeflowerBook(value) { return XSD_STATUS_PARSER.parseDeflowerBook(value); }
function nearDeflowerWord(text, name) { return XSD_STATUS_PARSER.nearDeflowerWord(text, name); }
function hasStatusBlock(text) { return XSD_STATUS_PARSER.hasStatusBlock(text); }
function parseCastBlocks(inner) { return XSD_STATUS_PARSER.parseCastBlocks(inner); }
function parseStatusBlock(text) { return XSD_STATUS_PARSER.parseStatusBlock(text); }

/** 2026-10-08（gpt 04 号①）：把「<实际发生> 申报 → 已校验锚点」这一段抽成**纯函数**。
 *  记账（applyMilestones）与推进（checkFastForwardStage 用到的 knownAhead）**共用同一份结果**，
 *  不再各自解读原始申报。纯函数、无副作用，可离线抠出单测。 */
/** 2026-10-08（主人当面指定）：**名器成形的前置** —— 持有者必须先被破身，否则不成形。
 *  依据：字段表里每条 `X处女丧失` 的 desc 原文，例：
 *    · 「叶红缨处女丧失 · 灼酒流炎穴的持有者被破身」
 *    · 「楚灵夜后窍开发 …与『楚灵夜处女丧失』同时为真，般若菩提菊才成形」
 *    · 「苏瑶处女丧失 · …与苏玲两个都丧失，灵犀同心才成形」
 *  ⇒ 写入侧（记账）此前没有这条校验，所以模型在 <实际发生> 里写一句「X成形」就能解锁
 *    （2026-10-08 真机事故：与苏瑶的戏里解锁了**慕容清歌**的「清歌弦鸣穴」）。
 *  **例外**：烟霞灵乳（昨日欢）没有「成形」这一步（持有者出场即二境、反色、占据者阎雷子），
 *    其条目由 `known['阎雷子脱困']` 注入 ⇒ 本表不收它。 */
