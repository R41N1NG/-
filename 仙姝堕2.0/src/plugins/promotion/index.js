"use strict";
const C = require("../../runtime/contracts");
const {meets} = require("../../runtime/conditions");
const {mountPromotion} = require("./ui");
const PLUGIN_ID = "character_promotion";
function resultTag(body, code) {
  const visible = String(body).replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");
  const tags = [...visible.matchAll(/<Promotion_result\b[^>]*>[\s\S]*?<\/Promotion_result>/g)];
  if (tags.length !== 1) return null;
  const parsed = /^<Promotion_result id="([A-Za-z0-9_-]+)">\s*(是|否)\s*<\/Promotion_result>$/.exec(tags[0][0]);
  return parsed && parsed[1] === code ? parsed[2] : null;
}
function createPromotionPlugin(definitions) {
  const defs = Object.entries(definitions);
  function lookup(nodeId) {
    for (const [id,cfg] of defs) for (const [kind,key] of [["enter","entryId"],["finish","finishId"]])
      if (cfg[key] === nodeId) return {id,cfg,kind};
    return null;
  }
  function stage(s,cfg) { return s.stat_data.character_stages?.[cfg.character]?.id; }
  function state(s) { return s.pluginState?.[PLUGIN_ID] || {}; }
  function available(s, item) {
    const {id,cfg,kind} = item;
    if (stage(s,cfg) !== cfg.fromStage) return false;
    if (kind === "enter") return !s.activeEvent && meets(s,cfg.conditions);
    return s.activeEvent?.pluginId === PLUGIN_ID && state(s).currentId === id;
  }
  function getDisplayText(nodeId) {
    const x = lookup(nodeId); if (!x) return null;
    return x.kind === "enter" ? x.cfg.label : "完成本次拜访";
  }
  function select(s,nodeId) {
    const x = lookup(nodeId);
    if (!x || !available(s,x)) return {id:nodeId,allowed:false,reason:"当前阶段、好感或事件状态不满足"};
    const {id,cfg,kind} = x;
    return {id:nodeId,allowed:true,character:cfg.character,displayText:getDisplayText(nodeId),
      actionText:getDisplayText(nodeId),promotionId:id,promotionKind:kind,
      prompt:kind === "enter" ? cfg.story : "核验本次专属剧情，不凭空补写新的行动以达成条件。",
      conditions:kind === "enter" ? cfg.conditions : [], rewards:[],grantsKnown:[],
      completionQuery:kind === "finish" ? "仅判断本次拜访（起始行动 "+(state(s).entryCode || "当前拜访")+"）之后的实际剧情，不把其他历史拜访当本次结果。"+cfg.query : undefined,
      stageGrant:kind === "finish" ? {character:cfg.character,from:cfg.fromStage,to:cfg.toStage} : undefined,
      // Only reserve the event on entry; do not mark the story complete or upgrade.
      reservedState:kind === "enter" ? {...state(s),currentId:id,lastResult:null,entryCode:null} : undefined,
      immediateResult:kind === "enter" ? {outcome:"success",pluginState:{...state(s),currentId:id,lastResult:null,entryCode:null},
        activeEvent:{pluginId:PLUGIN_ID,character:cfg.character,promotionId:id},rewards:[],known:[]} : undefined,
    };
  }
  async function settle(s,p,body) {
    const x = lookup(p.nodeId);
    if (!x || p.pluginId !== PLUGIN_ID || state(s).currentId !== x.id) return {outcome:"failure",reason:"晋升行动不匹配"};
    const base = {...state(s)}, active = {pluginId:PLUGIN_ID,character:x.cfg.character,promotionId:x.id};
    if (x.kind === "enter") return {outcome:"success",pluginState:{...base,entryCode:p.actionCode},activeEvent:active,body,reason:"专属故事已开启，仍为原阶段"};
    const report = resultTag(body,p.actionCode);
    if (!report) return {outcome:"retry",pluginState:{...base,lastResult:"invalid"},activeEvent:active,
      body:"本次结算未收到有效回报，尚未改变人物阶段。可以再次点击完成。",reason:"晋升回报缺失、冲突或行动标识不符"};
    const result = {outcome:report === "是" ? "success" : "failure",activeEvent:null,
      pluginState:{...base,currentId:null,lastResult:report,receipt:{id:p.id,character:x.cfg.character,answer:report}},
      body:report === "是" ? "这段夜访已告一段落。" : "这段夜访尚未达成相应条件。",reason:report === "是" ? "本轮回报确认达成" : "本轮回报未达成",evidenceMode:"PROMOTION_RESULT"};
    if (report === "是") result.stageGrant = {character:x.cfg.character,from:x.cfg.fromStage,to:x.cfg.toStage};
    return result;
  }
  function getPrompt(s) {
    const cfg = definitions[state(s).currentId];
    if (!cfg || s.activeEvent?.pluginId !== PLUGIN_ID) return "";
    return "【当前专属故事】"+cfg.label+"。承接已有历史及当前实际地点，沿用"+cfg.character+"原阶段设定。入口已开启，不反复重演敲门/入场，让玩家自由行动。人物阶段尚未晋升，等待玩家点击完成。正文出现结果或节点名称不会自动结算，不自动切换其他事件，不自行跳日。";
  }
  const plugin = {id:PLUGIN_ID,version:"1.0",select,settle,getPrompt,getDisplayText,
    list(s) {
      const currentIdent = s.identity || s.stat_data?.身份;
      const filtered = defs.filter(([_, cfg]) => {
        const identCond = cfg.conditions?.find(c => c.kind === "identity");
        return !identCond || identCond.value === currentIdent;
      });
      const byChar = new Map();
      for (const [id, cfg] of filtered) {
        const char = cfg.character;
        const curStage = stage(s, cfg);
        const isActive = s.activeEvent?.pluginId === PLUGIN_ID && state(s).currentId === id;
        const isCurrent = cfg.fromStage === curStage;
        const isPast = cfg.toStage === curStage;
        if (!byChar.has(char)) {
          byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
        } else {
          const prev = byChar.get(char);
          if (isActive) {
            byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
          } else if (!prev.isActive && isCurrent) {
            byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
          } else if (!prev.isActive && !prev.isCurrent && isPast) {
            byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
          }
        }
      }
      return [...byChar.values()].map(({ id, cfg }) => ({
        id,
        cfg,
        phase: stage(s, cfg),
        active: s.activeEvent?.pluginId === PLUGIN_ID && state(s).currentId === id,
        allowed: available(s, { id, cfg, kind: "enter" }),
        lastResult: state(s).lastResult,
      }));
    },
    mount(slot,runtime) {return mountPromotion(slot,runtime,plugin);},
  };
  return plugin;
}
module.exports = {createPromotionPlugin,resultTag,PLUGIN_ID};
