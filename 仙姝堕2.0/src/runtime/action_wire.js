"use strict";
const { hash } = require("./contracts");
function createActionCode(nodeId, receiptId) {
  if (!/^[A-Za-z0-9-]+$/.test(nodeId)) throw Error("节点ID须为稳定字母数字标识");
  return "XSD2_" + nodeId + "_" + hash(receiptId).padStart(8, "0");
}
function readActionCode(text) {
  const matches = [...String(text || "").matchAll(/\bXSD2_([A-Za-z0-9-]+)_([a-f0-9]{8})\b/g)];
  if (matches.length !== 1) return null;
  return { code:matches[0][0], nodeId:matches[0][1] };
}
module.exports = { createActionCode, readActionCode };
