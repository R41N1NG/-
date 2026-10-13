"use strict";
const {negativeStages}=require("./character_stages");
function nodeEntryName(id) { return "【节点故事】" + id; }
function metricEntryContent(cfg) {
  const rules = [
    "【数值申报】本条目只约束对「" + cfg.character + "」的态度申报格式。",
    "每回合至多输出一个标签：<好感事件>" + cfg.character + "｜记心上或记恨｜依据：本回合原文关键句</好感事件>；重大事件用锚点：<好感事件>" + cfg.character + "｜锚点 锚点ID｜依据：本回合原文关键句</好感事件>。",
    "依据必须是本回合正文里逐字存在的句子；同档位或同一锚点冷却期内申报无效；没有值得申报的言行就不要输出标签。",
  ].join("\n");
  const rubric = [
    "## 她会记在心上",
    ...(cfg.rubric["记心上"] || []).map((x) => "- " + x),
    "## 她会记恨",
    ...(cfg.rubric["记恨"] || []).map((x) => "- " + x),
  ].join("\n");
  const anchors = (cfg.anchors || [])
    .map((a) => "- " + a.id + "（" + (a.delta > 0 ? "+" : "") + a.delta + "）：" + a.desc)
    .join("\n");
  return rules + "\n\n" + rubric + "\n\n## 锚点事件表\n" + anchors;
}
function metricEntries(defs = {}, startId = 11000) {
  const entries = [];
  for (const [, cfg] of Object.entries(defs)) {
    if (!cfg.character || !cfg.rubric || !cfg.metric) continue;
    entries.push({
      uid: startId++,
      comment: "【好感事件表】" + cfg.character,
      key: [],
      keysecondary: [],
      content: metricEntryContent(cfg),
      constant: true,
      selective: false,
      disable: true,
      order: 202,
      position: 1,
      excludeRecursion: true,
      preventRecursion: true,
    });
  }
  return entries;
}
function storyEntries(catalog, profiles = {}, startId = 10000) {
  const entries = [];
  for (const [id, story] of Object.entries(catalog)) {
    if (!/^[A-Za-z0-9-]+$/.test(id) || !story.content?.trim()) throw Error("故事条目缺少合法节点ID或内容");
    entries.push({uid:startId++, comment:nodeEntryName(id), key:["XSD2_"+id+"_"], keysecondary:[],
      content:story.content, constant:false, selective:false, disable:true, order:200,
      position:1, scanDepth:1, matchUser:true, matchCharacter:false,
      excludeRecursion:true, preventRecursion:true});
  }
  for (const [name, cfg] of Object.entries(profiles)) for (const stage of [...(cfg.stages || []),...negativeStages(cfg,name)]) {
    const keys = cfg.keys && cfg.keys.length ? cfg.keys : [name];
    if (stage.stories && typeof stage.stories === "object") {
      for (const [ident, content] of Object.entries(stage.stories)) {
        if (!content?.trim()) continue;
        entries.push({uid:startId++,comment:"【人物阶段】"+name+":"+stage.id+":"+ident,key:keys,keysecondary:[],
          content,constant:false,selective:false,disable:true,order:201,position:1,
          excludeRecursion:true,preventRecursion:true});
      }
    } else if (stage.story?.trim()) {
      entries.push({uid:startId++,comment:"【人物阶段】"+name+":"+stage.id,key:keys,keysecondary:[],
        content:stage.story,constant:false,selective:false,disable:true,order:201,position:1,
        excludeRecursion:true,preventRecursion:true});
    }
  }
  return entries;
}
function areaEntries(defs = {}, startId = 12000) {
  const entries = [];
  for (const cfg of Object.values(defs)) {
    if (!cfg.area || !cfg.background || !cfg.matchPrefix) continue;
    entries.push({
      uid: startId++,
      comment: "【区域背景】" + cfg.area,
      key: [],
      keysecondary: [],
      content: cfg.background,
      constant: true,
      selective: false,
      disable: true,
      order: 203,
      position: 1,
      excludeRecursion: true,
      preventRecursion: true,
    });
  }
  return entries;
}
function managedEnabled(label, stat) {
  if (label === "【阶段驱动】当前阶段压力与调度") return false;
  if (label === "【大势规则】中控调度") return true;
  if (label.startsWith("【中立】")) return false; // Retire the former seven-period schedule in existing bound books.
  if (label.startsWith("【大势背景】")) return label === "【大势背景】"+(stat.grand_era_entry||stat.grand_era);
  if (label.startsWith("【节点故事】")) return label === nodeEntryName(stat.node_trigger);
  if (Object.values(stat.character_stages || {}).some(x=>(x.replaces || []).includes(label))) return false;
  if (label.startsWith("【人物阶段】")) {
    const visible = new Set([stat.身份,stat.stage_focus,...(stat.在场角色 || []).map(x=>x.名)]);
    return Object.entries(stat.character_stages || {}).some(([name,x])=>{
      if (!visible.has(name) || !x.story) return false;
      if (label === "【人物阶段】"+name+":"+x.id) return true;
      if (label === "【人物阶段】"+name+":"+x.id+":"+stat.身份) return true;
      return false;
    });
  }
  if (label.startsWith("【好感事件表】")) {
    const character = label.slice("【好感事件表】".length);
    const visible = new Set([stat.身份,stat.stage_focus,...(stat.在场角色 || []).map(x=>x.名)]);
    return visible.has(character) && !!stat.character_metrics?.[character];
  }
  if (label.startsWith("【区域背景】")) {
    const area = label.slice("【区域背景】".length);
    return stat.active_area === area;
  }
  return null;
}
module.exports = {storyEntries,metricEntries,metricEntryContent,areaEntries,managedEnabled,nodeEntryName};
