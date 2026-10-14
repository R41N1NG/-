"use strict";

const NEGATIVE_DEFAULTS=[
 {id:"neg_gap",label:"生隙",range:[-20,-1],boundary:"疏离冷淡，仅维持公事体面，关闭私密往来。",recovery:"守信、赔罪及正向互动可修复关系。"},
 {id:"neg_disgust",label:"嫌恶",range:[-50,-21],boundary:"戒备排斥，拒绝亲密接触、赠礼及私密同行。",recovery:"普通言语无效，须危机中的实际援手。",positiveAnchors:[]},
 {id:"neg_hostile",label:"敌视",range:[-80,-51],boundary:"关系敌对，停止正常私密往来，不接受亲密互动。",recovery:"普通互动不加分，仅生死援救等已配置大恩可修复。",positiveAnchors:[]},
 {id:"neg_nemesis",label:"死敌",range:[-100,-81],boundary:"关系为死仇，封闭常规正向互动与晋升入口。",recovery:"常规好感回升通道关闭。",positiveAnchors:[]}
];
function negativeStages(cfg,name){
 if(cfg.negativeStages?.length)return cfg.negativeStages;
 if(cfg.metrics?.好感度?.min>=0 || !cfg.metrics?.好感度)return [];
 return NEGATIVE_DEFAULTS.map(x=>({...x,...(x.id==="neg_disgust"?{positiveAnchors:cfg.negativeRecovery?.disgust || []}:x.id==="neg_hostile"?{positiveAnchors:cfg.negativeRecovery?.hostile || []}:{}),story:"【"+name+" · "+x.label+"】\n"+x.boundary+"\n"+x.recovery+"\n这是通用关系覆盖，具体人物负向心智待填；沿用人物本身设定，不补造犯罪、战斗结果或过去经历，不使用未解锁隐秘。"}));
}
function negativeOf(stat,cfg,name){
 const favor=stat.character_metrics?.[name]?.好感度 ?? cfg.metrics?.好感度?.default ?? 0;
 return favor<0 ? negativeStages(cfg,name).find(x=>favor>=x.range[0]&&favor<=x.range[1]) || null : null;
}
function canRecover(stat,profiles,name,via,evidence=""){
 const neg=negativeOf(stat,profiles[name] || {},name);
 if(!neg || !Object.hasOwn(neg,"positiveAnchors"))return true;
 if(!neg.positiveAnchors.includes(via))return false;
 if(neg.id==="neg_disgust" && via==="yh_weihu")return /危|险|救|援/.test(evidence) && /同门|弟子/.test(evidence);
 return true;
}
function metricSpec(profiles, character, key) {
  const spec = profiles[character]?.metrics?.[key];
  if (!spec || !Number.isFinite(spec.min) || !Number.isFinite(spec.max) || spec.min > spec.max || !Number.isFinite(spec.default) || spec.default < spec.min || spec.default > spec.max)
    throw Error("人物数值配置无效或未注册");
  return spec;
}
function writeMetric(stat, profiles, character, key, value) {
  const spec = metricSpec(profiles, character, key);
  if (!Number.isFinite(value) || value < spec.min || value > spec.max || (spec.integer && !Number.isInteger(value))) throw Error("人物数值超出配置范围");
  const cap=stat.character_metric_caps?.[character]?.[key];
  if(Number.isFinite(cap) && value>cap)throw Error("人物好感已永久锁定，上限为"+cap+"，不能恢复到−49及以上");
  if(key==="好感度" && value<=-51){stat.character_metric_caps ||= {};stat.character_metric_caps[character] ||= {};stat.character_metric_caps[character][key]=-50;}
  stat.character_metrics ||= {};
  stat.character_metrics[character] ||= {};
  stat.character_metrics[character][key] = value;
}
function resolveStages(s, profiles = {}) {
  s.stat_data.character_metrics ||= {};
  const resolved = {};
  for (const [name, cfg] of Object.entries(profiles)) {
    for (const key of Object.keys(cfg.metrics || {})) {
      const spec = metricSpec(profiles,name,key);
      const value = s.stat_data.character_metrics[name]?.[key] ?? spec.default;
      writeMetric(s.stat_data,profiles,name,key,value);
    }
    if (!cfg.stages?.length || new Set(cfg.stages.map(x=>x.id)).size !== cfg.stages.length || new Set(cfg.stages.map(x=>x.priority)).size !== cfg.stages.length || cfg.stages.some(x=>!x.id || !Number.isFinite(x.priority)))
      throw Error("人物阶段ID和优先级须唯一");
    const initial = cfg.initialStage || [...cfg.stages].sort((a,b)=>a.priority-b.priority)[0].id;
    const completed = s.stat_data.completed_character_stages?.[name] || initial;
    const positive = cfg.stages.find(x=>x.id === completed);
    if (!positive) throw Error("已完成人物阶段不在配置中");
    const negatives=negativeStages(cfg,name),ids=new Set(cfg.stages.map(x=>x.id));
    for(let i=0;i<negatives.length;i++){
      const x=negatives[i];if(!x.id || ids.has(x.id)||!Array.isArray(x.range)||x.range.length!==2||!Number.isInteger(x.range[0])||!Number.isInteger(x.range[1])||x.range[0]>x.range[1]||x.range[1]>=0||x.nodes?.length)throw Error("负好感配置区间或阶段ID无效");
      ids.add(x.id);for(let j=0;j<i;j++)if(x.range[0]<=negatives[j].range[1]&&x.range[1]>=negatives[j].range[0])throw Error("负好感区间重叠");
    }
    const negative=negativeOf(s.stat_data,cfg,name),stage=negative || positive;
    if((s.stat_data.character_metrics[name]?.好感度??0)<0 && !negative)throw Error("负好感区间未覆盖");
    const ident = s.stat_data?.身份 || s.identity;
    const story = (stage.stories && ident ? stage.stories[ident] : null) || stage.story || "";
    resolved[name] = {id:stage.id, priority:stage.priority, story, portrait:stage.portrait || null, nodes:negative?[]:stage.nodes || [], replaces:cfg.replaces || [], negative:!!negative, label:negative?.label || "", completedStage:completed};
  }
  s.stat_data.character_stages = resolved;
  return s;
}
function completeStage(s, profiles, grant) {
  const cfg = profiles[grant.character];
  const from = cfg?.stages.find(x=>x.id === grant.from), to = cfg?.stages.find(x=>x.id === grant.to);
  if (!from || !to || to.priority <= from.priority || s.stat_data.character_stages?.[grant.character]?.id !== grant.from)
    throw Error("晋升阶段提交与当前阶段不符");
  s.stat_data.completed_character_stages ||= {};
  s.stat_data.completed_character_stages[grant.character] = grant.to;
}
function completeStages(s,profiles,grants){
 if(!Array.isArray(grants)||!grants.length||new Set(grants.map(g=>g.character)).size!==grants.length)throw Error("双人阶段提交配置无效");
 for(const g of grants){const cfg=profiles[g.character],from=cfg?.stages.find(x=>x.id===g.from),to=cfg?.stages.find(x=>x.id===g.to);if(!from||!to||to.priority<=from.priority||s.stat_data.character_stages?.[g.character]?.id!==g.from)throw Error("双人阶段必须同时符合前置条件");}
 for(const g of grants)completeStage(s,profiles,g);
}
module.exports = {completeStages,metricSpec, writeMetric, resolveStages, completeStage, negativeStages, negativeOf, canRecover};
