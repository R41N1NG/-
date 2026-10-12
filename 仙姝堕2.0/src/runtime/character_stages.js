"use strict";

function metricSpec(profiles, character, key) {
  const spec = profiles[character]?.metrics?.[key];
  if (!spec || !Number.isFinite(spec.min) || !Number.isFinite(spec.max) || spec.min > spec.max || !Number.isFinite(spec.default) || spec.default < spec.min || spec.default > spec.max)
    throw Error("人物数值配置无效或未注册");
  return spec;
}
function writeMetric(stat, profiles, character, key, value) {
  const spec = metricSpec(profiles, character, key);
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) throw Error("人物数值超出配置范围");
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
    const stage = cfg.stages.find(x=>x.id === completed);
    if (!stage) throw Error("已完成人物阶段不在配置中");
    const ident = s.stat_data?.身份 || s.identity;
    const story = (stage.stories && ident ? stage.stories[ident] : null) || stage.story || "";
    resolved[name] = {id:stage.id, priority:stage.priority, story, portrait:stage.portrait || null, nodes:stage.nodes || [], replaces:cfg.replaces || []};
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
module.exports = {metricSpec, writeMetric, resolveStages, completeStage};
