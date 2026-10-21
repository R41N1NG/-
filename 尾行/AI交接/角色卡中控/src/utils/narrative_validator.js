"use strict";

/**
 * 尾行 · 风骨与合规物理拦截器 (narrative_validator.js)
 * 强行扫描提示词与世界书文本，一旦触犯反向否定禁令、写死人称或极端词，
 * 立即强行阻断并指令开发者先阅读 GEMINI.md。
 */

const VIOLATIONS = [
  { pattern: /严禁/g, reason: "触犯反向否定禁令（粉色大象陷阱）——使用正向定格留白代替" },
  { pattern: /PROHIBITIONS/g, reason: "触犯反向否定语法——禁止在提示词中罗列负向禁令块" },
  { pattern: /禁止/g, reason: "触犯反向否定词——使用正面动作边界代替" },
  { pattern: /(?:保持|必须|只能)第三人称/g, reason: "违背人称自适应铁律——必须自适应玩家第一/第三人称设定" },
  { pattern: /极其|极度|彻底|绝对|尽数|神坛|不可或缺|臣服|献祭|顺从|终极/g, reason: "触犯去极端词与去霸总戒律" },
  { pattern: /成年人|成人/g, reason: "触犯审核风控词汇——条目与提示词中不应出现成年人/成人等敏感词" }
];

function validateNarrativeDiscipline(text, sourceName = "未知信源") {
  if (typeof text !== "string") return;

  const errors = [];
  for (const { pattern, reason } of VIOLATIONS) {
    const matches = text.match(pattern);
    if (matches && matches.length) {
      errors.push(`  · 命中违禁词 [${matches[0]}] × ${matches.length}次: ${reason}`);
    }
  }

  if (errors.length) {
    const banner = [
      "",
      "================================================================================",
      " ⚡【风骨合规物理拦截】检测到违背文风规范或出现违规词！构建被强行阻断！",
      ` 目标信源: ${sourceName}`,
      "--------------------------------------------------------------------------------",
      ...errors,
      "--------------------------------------------------------------------------------",
      " ⚡ 最高铁律指示：",
      " 出现报错请先回去阅读 GEMINI.md 严格对照自身行为，修复后再行构建！",
      "================================================================================",
      ""
    ].join("\n");
    throw new Error(banner);
  }
}

module.exports = { validateNarrativeDiscipline, VIOLATIONS };
