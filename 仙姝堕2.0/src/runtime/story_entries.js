"use strict";
function nodeEntryName(id) { return "【节点故事】" + id; }
function storyEntries(catalog, profiles = {}, startId = 10000) {
  const entries = [];
  for (const [id, story] of Object.entries(catalog)) {
    if (!/^[A-Za-z0-9-]+$/.test(id) || !story.content?.trim()) throw Error("故事条目缺少合法节点ID或内容");
    entries.push({uid:startId++, comment:nodeEntryName(id), key:["XSD2_"+id+"_"], keysecondary:[],
      content:story.content, constant:false, selective:false, disable:true, order:200,
      position:1, scanDepth:1, matchUser:true, matchCharacter:false,
      excludeRecursion:true, preventRecursion:true});
  }
  for (const [name, cfg] of Object.entries(profiles)) for (const stage of cfg.stages || []) {
    if (!stage.story?.trim()) continue;
    entries.push({uid:startId++,comment:"【人物阶段】"+name+":"+stage.id,key:[],keysecondary:[],
      content:stage.story,constant:true,selective:false,disable:true,order:201,position:1,
      excludeRecursion:true,preventRecursion:true});
  }
  return entries;
}
function managedEnabled(label, stat) {
  if (label.startsWith("【节点故事】")) return label === nodeEntryName(stat.node_trigger);
  if (label.startsWith("【人物阶段】")) {
    const visible = new Set([stat.身份,...(stat.在场角色 || []).map(x=>x.名)]);
    return Object.entries(stat.character_stages || {}).some(([name,x])=>visible.has(name) && label === "【人物阶段】"+name+":"+x.id && !!x.story);
  }
  return null;
}
module.exports = {storyEntries,managedEnabled,nodeEntryName};
