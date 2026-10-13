"use strict";
// 设计色板 tokens：金红系与墨底的唯一来源；CSS 侧经 tokenCss(scopes) 注入 --xsd2-* 自定义属性。
// 纹章形稿的填色属画作原色，不在此列（见 relic_fanfare）。
const TOKENS = {
  gold: "#d5b97b",       // HUD 主金（描边/强调）
  goldBright: "#e8cf8f", // 高亮金（标题/悬停）
  goldDeep: "#b98f3e",   // 深金（条底/渐变深端）
  goldWarm: "#e8b46b",   // 暖金（判词帽/提示条）
  goldLeaf: "#E8C363",   // 金箔（动效点缀）
  goldPlate: "#D9A93C",  // 匾金（纹章形稿主金）
  sealRed: "#C8372A",    // 朱砂印
  relicRed: "#D8402C",   // 形稿焰红
  ink: "#141B26",        // 墨底
};
function tokenCss(scopes) {
  const body = Object.entries(TOKENS)
    .map(([k, v]) => "--xsd2-" + k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) + ":" + v)
    .join(";");
  return scopes.join(",") + "{" + body + "}";
}
module.exports = { TOKENS, tokenCss };
