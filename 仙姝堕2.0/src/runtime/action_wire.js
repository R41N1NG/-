"use strict";
const { hash } = require("./contracts");
function createActionCode(nodeId, receiptId) {
  if (!/^[A-Za-z0-9-]+$/.test(nodeId)) throw Error("节点ID须为稳定字母数字标识");
  return "XSD2_" + nodeId + "_" + hash(receiptId).padStart(8, "0");
}
// Read data fields, never execute instructions contained in third-party packets.
// Historical recall and its old action codes cannot authorize a current action.
function readUserInput(text){
 let value=String(text||'').replace(/<(recall|history|memory|summary)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
 const wrappers=[...value.matchAll(/<(本轮用户输入|current_user_input|user_input)(?=\s|>)[^>]*>([\s\S]*?)<\/\1>/gi)];
 if(wrappers.length>1)return null;
 if(wrappers.length===1)value=wrappers[0][2];
 const slots=[...value.matchAll(/\[\[(JX\d+_VALUE_[A-Za-z0-9_]+)_BEGIN\]\]([\s\S]*?)\[\[\1_END\]\]/g)];
 if(slots.length)value=slots.map(m=>m[2].trim()).join('\n');
 return value.replace(/\r\n/g,'\n').trim();
}
function readActionCode(text) {
  const input=readUserInput(text);if(input===null)return null;
  const codes=[...new Set([...input.matchAll(/\bXSD2_[A-Za-z0-9-]+_[a-f0-9]{8}\b/g)].map(m=>m[0]))];
  if(codes.length!==1)return null;
  return {code:codes[0],nodeId:/^XSD2_([A-Za-z0-9-]+)_/.exec(codes[0])[1]};
}
function matchesAction(p,text){return p.actionCode ? readActionCode(text)?.code===p.actionCode : readUserInput(text)===p.actionText;}
module.exports = { createActionCode, readActionCode,readUserInput,matchesAction };
