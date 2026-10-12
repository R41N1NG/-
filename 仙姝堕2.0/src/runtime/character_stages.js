"use strict";
const {meets} = require("./conditions");
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
  const previous = s.stat_data.character_stages || {}, resolved = {};
  for (const [name, cfg] of Object.entries(profiles)) {
    for (const key of Object.keys(cfg.metrics || {})) {
      const spec = metricSpec(profiles,name,key);
      const value = s.stat_data.character_metrics[name]?.[key] ?? spec.default;
      writeMetric(s.stat_data,profiles,name,key,value);
    }
    if (!cfg.stages?.length || new Set(cfg.stages.map(x=>x.id)).size !== cfg.stages.length || new Set(cfg.stages.map(x=>x.priority)).size !== cfg.stages.length || cfg.stages.some(x=>!x.id || !Number.isFinite(x.priority)))
      throw Error("人物阶段ID和优先级须唯一");
    let stage = [...cfg.stages].sort((a,b)=>b.priority-a.priority).find(x=>meets(s,x.conditions || []));
    const old = cfg.stages.find(x=>x.id === previous[name]?.id);
    if (cfg.allowRegression === false && old && (!stage || old.priority > stage.priority)) stage = old;
    if (!stage) throw Error("人物须配置默认阶段");
    resolved[name] = {id:stage.id, priority:stage.priority, story:stage.story || "", portrait:stage.portrait || null, nodes:stage.nodes || []};
  }
  s.stat_data.character_stages = resolved;
  return s;
}
module.exports = {metricSpec, writeMetric, resolveStages};
